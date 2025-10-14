# Fine-Tuning with AWS SageMaker

## 🎯 Why SageMaker?

**Advantages:**
- ✅ More powerful GPUs (ml.g5.xlarge = A10G 24GB)
- ✅ Integrated with AWS ecosystem
- ✅ Automatic spot instance management
- ✅ Built-in experiment tracking
- ✅ Easy deployment after training
- ✅ No session timeouts like Colab

**Costs:**
- ml.g5.xlarge: ~$1.41/hour (on-demand)
- ml.g5.xlarge: ~$0.42/hour (spot instance, 70% savings!)
- **Expected cost: $0.30-$0.50 for this training job**

---

## 📋 Prerequisites

1. **AWS Account** with SageMaker access
2. **IAM Role** with SageMaker permissions
3. **S3 Bucket** for storing dataset and model
4. **SageMaker Studio** or **Notebook Instance** (optional)

---

## 🚀 Option 1: SageMaker Training Job (Recommended)

This approach uses SageMaker's managed training infrastructure.

### Step 1: Prepare Your Environment

```python
# Run in SageMaker Notebook or local environment with AWS CLI configured
import sagemaker
from sagemaker.huggingface import HuggingFace
import boto3

# Setup
sess = sagemaker.Session()
role = sagemaker.get_execution_role()  # Or specify your IAM role ARN
bucket = sess.default_bucket()
region = boto3.Session().region_name

print(f"SageMaker role: {role}")
print(f"S3 bucket: {bucket}")
print(f"Region: {region}")
```

### Step 2: Upload Dataset to S3

```python
# Upload your dataset
s3_prefix = "healthcare-lora-training"
dataset_s3_path = sess.upload_data(
    path='healthcare_classification_dataset.jsonl',
    bucket=bucket,
    key_prefix=f'{s3_prefix}/data'
)
print(f"Dataset uploaded to: {dataset_s3_path}")
```

### Step 3: Create Training Script

Create `train.py`:

```python
import os
import torch
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig
from trl import SFTTrainer, SFTConfig

def main():
    # Model config
    MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct"
    
    # SageMaker paths
    data_dir = os.environ.get('SM_CHANNEL_TRAINING', '/opt/ml/input/data/training')
    model_dir = os.environ.get('SM_MODEL_DIR', '/opt/ml/model')
    output_dir = os.environ.get('SM_OUTPUT_DATA_DIR', '/opt/ml/output')
    
    # HuggingFace authentication (set in SageMaker environment variables)
    hf_token = os.environ.get('HF_TOKEN')
    if hf_token:
        from huggingface_hub import login
        login(token=hf_token)
    
    # Load dataset
    print("📊 Loading dataset...")
    dataset = load_dataset('json', data_files=f'{data_dir}/healthcare_classification_dataset.jsonl', split='train')
    dataset = dataset.train_test_split(test_size=0.1, seed=42)
    print(f"Train: {len(dataset['train'])} | Val: {len(dataset['test'])}")
    
    # Format dataset for Llama
    def format_example(example):
        return {"text": f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Classify healthcare worker messages accurately.<|eot_id|><|start_header_id|>user<|end_header_id|>

{example['text']}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{{"topic": "{example['topic']}", "sentiment": "{example['sentiment']}", "urgency": "{example['urgency']}", "routing": "{example['routing']}"}}<|eot_id|>"""}
    
    train_dataset = dataset['train'].map(format_example)
    eval_dataset = dataset['test'].map(format_example)
    
    # Tokenizer
    print("📥 Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"
    
    # Model with 4-bit quantization for memory efficiency
    print("📥 Loading model...")
    from transformers import BitsAndBytesConfig
    
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )
    
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",
    )
    model.config.use_cache = False
    model.config.pretraining_tp = 1
    
    # LoRA config for Llama
    peft_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
        bias="none",
        task_type="CAUSAL_LM",
    )
    
    # Training config (optimized for Llama 8B + LoRA)
    sft_config = SFTConfig(
        output_dir=output_dir,
        num_train_epochs=3,
        per_device_train_batch_size=2,  # Smaller batch for 8B model
        gradient_accumulation_steps=4,  # More accumulation
        learning_rate=2e-4,
        warmup_steps=100,
        logging_steps=25,
        save_steps=300,
        eval_strategy="steps",
        eval_steps=300,
        fp16=True,
        save_total_limit=2,
        report_to="none",
        optim="paged_adamw_8bit",  # Memory-efficient optimizer
        gradient_checkpointing=True,  # Save memory
        dataset_text_field="text",
    )
    
    # Trainer
    trainer = SFTTrainer(
        model=model,
        args=sft_config,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        peft_config=peft_config,
        processing_class=tokenizer,
        max_seq_length=512,
    )
    
    print("🚀 Training started...")
    trainer.train()
    
    # Save to SageMaker model directory
    print("💾 Saving adapter...")
    trainer.save_model(model_dir)
    tokenizer.save_pretrained(model_dir)
    
    print("✅ Training complete!")

if __name__ == "__main__":
    main()
```

### Step 4: Create Requirements File

Create `requirements.txt`:

```
transformers>=4.36.0
datasets
peft
accelerate
trl
scipy
torch
```

### Step 5: Launch SageMaker Training Job

```python
# Create HuggingFace estimator
huggingface_estimator = HuggingFace(
    entry_point='train.py',
    source_dir='.',  # Directory containing train.py and requirements.txt
    instance_type='ml.g5.2xlarge',  # A10G GPU, 24GB VRAM (need more for Llama 8B)
    instance_count=1,
    role=role,
    transformers_version='4.36.0',
    pytorch_version='2.1.0',
    py_version='py310',
    use_spot_instances=True,  # Save 70% with spot instances!
    max_wait=7200,  # Max 2 hours
    max_run=3600,   # Max 1 hour training
    environment={
        'HF_TOKEN': 'hf_...',  # Your HuggingFace token (for Llama access)
    },
    hyperparameters={
        'epochs': 3,
    }
)

# Start training
huggingface_estimator.fit({
    'training': dataset_s3_path
})

print("🎉 Training job submitted!")
print(f"Job name: {huggingface_estimator.latest_training_job.name}")
```

### Step 6: Monitor Training

```python
# In SageMaker Console: Training > Training jobs > [your-job-name]
# Or programmatically:
from sagemaker.analytics import TrainingJobAnalytics

analytics = TrainingJobAnalytics(
    training_job_name=huggingface_estimator.latest_training_job.name,
    metric_names=['loss']
)
df = analytics.dataframe()
print(df)
```

### Step 7: Download Trained Adapter

```python
# After training completes, download the model
import boto3

s3 = boto3.client('s3')
job_name = huggingface_estimator.latest_training_job.name
model_s3_path = f's3://{bucket}/{job_name}/output/model.tar.gz'

# Download
!aws s3 cp {model_s3_path} ./healthcare_lora_adapter.tar.gz
!tar -xzf healthcare_lora_adapter.tar.gz -C ./healthcare_lora_adapter/

print("✅ Adapter downloaded to ./healthcare_lora_adapter/")
```

---

## 🚀 Option 2: SageMaker Notebook Instance (Simpler)

Similar to Colab, but with better GPU and no timeouts.

### Step 1: Create Notebook Instance

1. Go to **SageMaker Console** > **Notebook instances**
2. Click **Create notebook instance**
3. **Instance type**: `ml.g5.xlarge` (or `ml.p3.2xlarge` for V100)
4. **IAM role**: Create or select existing role with S3 access
5. **Volume size**: 50 GB
6. Click **Create**

### Step 2: Open Jupyter and Run

Once running, click **Open JupyterLab**, then create a new notebook:

```python
# Cell 1: Install dependencies
!pip install -q transformers datasets peft accelerate trl scipy

# Cell 2: Download dataset
!wget https://your-s3-bucket.s3.amazonaws.com/healthcare_classification_dataset.jsonl

# Cell 3: Authenticate with HuggingFace
from huggingface_hub import login
login(token='hf_...')  # Your HuggingFace token

# Cell 4: Run training (Llama 3.1 8B)
import torch
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig
from trl import SFTTrainer, SFTConfig

print("🚀 Healthcare Classification Fine-Tuning (Llama 3.1 8B)")

MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct"
DATASET_FILE = "healthcare_classification_dataset.jsonl"
OUTPUT_DIR = "./healthcare_lora_adapter"

# Load dataset
print("📊 Loading dataset...")
dataset = load_dataset('json', data_files=DATASET_FILE, split='train')
dataset = dataset.train_test_split(test_size=0.1, seed=42)
print(f"Train: {len(dataset['train'])} | Val: {len(dataset['test'])}")

# Format dataset for Llama
def format_example(example):
    return {"text": f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Classify healthcare worker messages accurately.<|eot_id|><|start_header_id|>user<|end_header_id|>

{example['text']}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{{"topic": "{example['topic']}", "sentiment": "{example['sentiment']}", "urgency": "{example['urgency']}", "routing": "{example['routing']}"}}<|eot_id|>"""}

train_dataset = dataset['train'].map(format_example)
eval_dataset = dataset['test'].map(format_example)

# Tokenizer
print("📥 Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

# Model with 4-bit quantization
print("📥 Loading model...")
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
)
model.config.use_cache = False

# LoRA config
peft_config = LoraConfig(
    r=16,
    lora_alpha=32,
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    bias="none",
    task_type="CAUSAL_LM",
)

# Training config
sft_config = SFTConfig(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    warmup_steps=100,
    logging_steps=25,
    save_steps=300,
    eval_strategy="steps",
    eval_steps=300,
    fp16=True,
    save_total_limit=2,
    report_to="none",
    optim="paged_adamw_8bit",
    gradient_checkpointing=True,
    dataset_text_field="text",
)

# Trainer
trainer = SFTTrainer(
    model=model,
    args=sft_config,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    peft_config=peft_config,
    processing_class=tokenizer,
    max_seq_length=512,
)

print("🚀 Training started...")
trainer.train()

print("\n💾 Saving adapter...")
trainer.save_model(OUTPUT_DIR)

print("✅ TRAINING COMPLETE!")

# Cell 4: Upload to S3
!aws s3 sync ./healthcare_lora_adapter/ s3://your-bucket/healthcare_lora_adapter/

# Cell 5: Stop instance (important to avoid charges!)
# Go to SageMaker Console > Notebook instances > Select instance > Stop
```

**⚠️ Important:** Stop the notebook instance when done to avoid charges!

---

## 🚀 Option 3: SageMaker Studio (Modern UI)

Similar to Notebook Instance but with better IDE.

1. Go to **SageMaker Console** > **Studio**
2. Create domain if needed
3. Launch Studio
4. Create new notebook with **PyTorch 2.1 Python 3.10 GPU Optimized** image
5. Select instance: `ml.g5.xlarge`
6. Run same code as Option 2

---

## 💰 Cost Comparison (Llama 3.1 8B)

| Option | Instance | Cost/Hour | Training Time | Total Cost |
|--------|----------|-----------|---------------|------------|
| **Colab Free** | T4 (15GB) | $0 | 60-90 min | $0 |
| **Colab Pro** | T4/V100 | $10/mo | 60-90 min | $10/mo |
| **SageMaker (Spot)** | A10G (24GB) | $0.84 | 45-60 min | **$0.63-$0.84** |
| **SageMaker (On-Demand)** | A10G (24GB) | $2.82 | 45-60 min | $2.11-$2.82 |
| **SageMaker (Spot)** | V100 (16GB) | $0.92 | 50-70 min | $0.77-$1.07 |

**Best Value: SageMaker g5.2xlarge with Spot Instances (~$0.75)** 🎯

**Note:** Llama 8B needs more resources than Phi-3.5 Mini, but still cost-effective with spot instances!

---

## 🎯 Which Option to Choose?

### Use **Training Job (Option 1)** if:
- ✅ You want production-grade infrastructure
- ✅ You need experiment tracking
- ✅ You want automatic retry on spot interruption
- ✅ You plan to deploy the model on SageMaker

### Use **Notebook Instance (Option 2)** if:
- ✅ You want hands-on control
- ✅ You're experimenting/debugging
- ✅ You want a Colab-like experience

### Use **Colab** if:
- ✅ You want free GPU
- ✅ You don't need the fastest training
- ✅ You're okay with potential timeouts

---

## 📦 After Training: Deploy on SageMaker

```python
from sagemaker.huggingface import HuggingFaceModel

# Create model
huggingface_model = HuggingFaceModel(
    model_data=f's3://{bucket}/{job_name}/output/model.tar.gz',
    role=role,
    transformers_version='4.36.0',
    pytorch_version='2.1.0',
    py_version='py310',
)

# Deploy endpoint
predictor = huggingface_model.deploy(
    initial_instance_count=1,
    instance_type='ml.g5.xlarge',
    endpoint_name='healthcare-classifier'
)

# Inference
result = predictor.predict({
    'inputs': 'No break again, 10 patients alone on 3 West'
})
print(result)
```

---

## 🎯 Quick Start: 5-Minute Setup

**Fastest way to start:**

```bash
# 1. Clone this repo in SageMaker Studio/Notebook
git clone <your-repo>
cd pipeline

# 2. Upload dataset to S3
aws s3 cp healthcare_classification_dataset.jsonl s3://your-bucket/data/

# 3. Run training job
python sagemaker_train.py  # Script using Option 1 above

# 4. Wait ~30 min, download adapter
aws s3 sync s3://your-bucket/output/healthcare_lora_adapter/ ./healthcare_lora_adapter/
```

---

## ✅ Summary (Llama 3.1 8B)

**Recommended: SageMaker Training Job with Spot Instances**
- **Model**: Llama 3.1 8B (4-bit quantized)
- **Cost**: ~$0.75 (spot) vs $0 (Colab free)
- **Time**: 45-60 minutes (faster than Colab's 60-90 min)
- **GPU**: A10G 24GB (ml.g5.2xlarge)
- **Reliability**: High (auto-retry on spot interruption)
- **Setup**: Need HuggingFace token for Llama access

### 🔑 Key Differences from Phi-3.5:
- ✅ Uses Llama chat template format
- ✅ 4-bit quantization (vs FP16 for Phi)
- ✅ Different LoRA targets (q/k/v/o vs qkv/o)
- ✅ Slightly higher cost but potentially better accuracy
- ✅ Requires HuggingFace authentication

Let me know if you want me to create the full `sagemaker_train.py` script! 🚀

