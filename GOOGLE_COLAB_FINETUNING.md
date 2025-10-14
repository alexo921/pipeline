# Google Colab Fine-Tuning Guide (FREE GPU)

## 🎯 What You'll Do

Train a LoRA adapter for Llama 3.1 8B on your 1,710 healthcare examples using Google's free T4 GPU.

**Time**: 30-60 minutes  
**Cost**: FREE  
**Expected Result**: 75-82% accuracy (from 70.8%)

---

## 📋 Step-by-Step Instructions

### Step 1: Prepare Files (2 minutes)

1. **Download these files from your server**:
   ```bash
   # On your local machine, download these from the server:
   scp ubuntu@your-server:/home/ubuntu/pipeline/healthcare_classification_dataset.jsonl .
   ```

2. **Files you need**:
   - `healthcare_classification_dataset.jsonl` (288KB)

### Step 2: Open Google Colab (1 minute)

1. Go to: https://colab.research.google.com
2. Click **"New Notebook"**
3. Click **"Runtime" → "Change runtime type"**
4. Select **"T4 GPU"** (or L4 if available)
5. Click **"Save"**

### Step 3: Upload Dataset (1 minute)

In the Colab notebook:

1. Click the **folder icon** on the left sidebar
2. Click the **upload icon** (⬆️)
3. Upload `healthcare_classification_dataset.jsonl`
4. Wait for upload to complete

### Step 4: Install Dependencies (2 minutes)

Copy and paste this into a cell and run:

```python
# Install required packages (with specific versions)
!pip install -q -U bitsandbytes transformers datasets peft accelerate trl
!pip install -q scipy

print("✅ Dependencies installed!")

# Verify bitsandbytes
import bitsandbytes as bnb
print(f"bitsandbytes version: {bnb.__version__}")
```

### Step 5: Create Training Script (Copy-Paste)

Create a new cell and paste this ENTIRE script:

```python
#!/usr/bin/env python3
import json
import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import os

print("🚀 Healthcare Classification Fine-Tuning")
print("=" * 60)

# Configuration
MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct"
DATASET_FILE = "healthcare_classification_dataset.jsonl"
OUTPUT_DIR = "./healthcare_lora_adapter"
MAX_LENGTH = 512

# NOTE: You'll need HuggingFace token for Llama access
# Get token from: https://huggingface.co/settings/tokens
# Request Llama access: https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct

from huggingface_hub import login
login()  # Will prompt for token

print(f"\n📊 Loading dataset: {DATASET_FILE}")
dataset = load_dataset('json', data_files=DATASET_FILE, split='train')
print(f"✅ Loaded {len(dataset)} examples")

# Split train/val
dataset = dataset.train_test_split(test_size=0.1, seed=42)
train_dataset = dataset['train']
val_dataset = dataset['test']
print(f"  Train: {len(train_dataset)} | Val: {len(val_dataset)}")

print(f"\n📥 Loading model: {MODEL_NAME}")

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

# Load model in 4-bit for GPU efficiency
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
    trust_remote_code=True,
)

print("✅ Model loaded")

# Prepare for LoRA
print("\n🔧 Configuring LoRA...")
model = prepare_model_for_kbit_training(model)

lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# Format dataset
def format_prompt(example):
    """Format as classification task."""
    text = example['text']
    topic = example['topic']
    sentiment = example['sentiment']
    urgency = example['urgency']
    routing = example['routing']
    
    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a healthcare classification expert. Classify worker messages accurately.
<|eot_id|><|start_header_id|>user<|end_header_id|>

Classify this message:
{text}
<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{{"topic": "{topic}", "sentiment": "{sentiment}", "urgency": "{urgency}", "routing": "{routing}"}}<|eot_id|>"""
    
    return {"text": prompt}

print("\n📝 Formatting dataset...")
train_dataset = train_dataset.map(format_prompt, remove_columns=train_dataset.column_names)
val_dataset = val_dataset.map(format_prompt, remove_columns=val_dataset.column_names)

def tokenize_function(examples):
    return tokenizer(examples["text"], truncation=True, max_length=MAX_LENGTH, padding="max_length")

train_dataset = train_dataset.map(tokenize_function, batched=True, remove_columns=["text"])
val_dataset = val_dataset.map(tokenize_function, batched=True, remove_columns=["text"])

print("✅ Dataset formatted")

# Training arguments - GPU optimized
print("\n⚙️  Setting up training...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=4,
    per_device_eval_batch_size=4,
    gradient_accumulation_steps=2,
    learning_rate=2e-4,
    warmup_steps=50,
    logging_steps=25,
    save_steps=200,
    eval_steps=200,
    save_total_limit=2,
    fp16=True,
    evaluation_strategy="steps",
    load_best_model_at_end=True,
    push_to_hub=False,
    report_to="none",
)

# Data collator
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=False
)

# Trainer
print("\n🏋️  Initializing trainer...")
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    data_collator=data_collator,
)

print("\n🚀 Starting training...")
trainer.train()

# Save the LoRA adapter
print("\n💾 Saving LoRA adapter...")
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print(f"\n✅ Fine-tuning complete!")
print(f"📁 Adapter saved to: {OUTPUT_DIR}")
print("\n🎯 Download the 'healthcare_lora_adapter' folder")
print("   Then convert to GGUF and deploy!")
```

**Run this cell** - training will take 30-60 minutes.

### Step 6: Wait for Training (30-60 min)

You'll see output like:
```
Training: [███████░░░] 45% | 500/1100 steps | Loss: 1.23
```

☕ Grab coffee - it's automated!

### Step 7: Download the Adapter

After training completes:

1. In Colab's file browser (left sidebar)
2. Find the `healthcare_lora_adapter` folder
3. Right-click → Download
4. Save the .zip file (~100MB)

---

## 📦 Step 8: Deploy on Your Server

### 8a. Upload Adapter to Server

```bash
# On your local machine:
scp healthcare_lora_adapter.zip ubuntu@your-server:/home/ubuntu/
```

### 8b. Merge LoRA with Base Model

```bash
# On server:
cd /home/ubuntu
unzip healthcare_lora_adapter.zip

# Install llama.cpp converter
pip install --break-system-packages llama-cpp-python

# Merge LoRA with base model (creates new GGUF)
python3 << 'PYTHON'
from peft import PeftModel, AutoPeftModelForCausalLM
from transformers import AutoTokenizer
import torch

print("Merging LoRA adapter with base model...")

# Load base + adapter
model = AutoPeftModelForCausalLM.from_pretrained(
    "healthcare_lora_adapter",
    device_map="cpu",
    torch_dtype=torch.float32
)

# Merge and save
merged_model = model.merge_and_unload()
merged_model.save_pretrained("./healthcare_merged_model")

print("✅ Merged model saved")
PYTHON

# Convert to GGUF format
cd healthcare_merged_model
llama.cpp/convert.py . --outtype q5_k_m --outfile ../llama-3.1-8b-healthcare-q5.gguf

echo "✅ Created: llama-3.1-8b-healthcare-q5.gguf"
```

### 8c. Update Docker Configuration

```bash
cd /home/ubuntu/pipeline

# Update docker-compose.yml volume path
sed -i 's|llama-3.1-8b-instruct-q5_k_m.gguf|llama-3.1-8b-healthcare-q5.gguf|g' docker-compose.yml

# Also update the Dockerfile CMD
sed -i 's|llama-3.1-8b-instruct-q5_k_m.gguf|llama-3.1-8b-healthcare-q5.gguf|g' llama_server.Dockerfile
```

### 8d. Restart and Test

```bash
cd /home/ubuntu/pipeline

# Rebuild with new model
docker-compose down
docker-compose up -d --build

# Wait for services
sleep 90

# Retrain Rasa
docker exec pipeline-pip-chatbot bash -c "cd /app/rasa && rasa train --force"

# Restart Rasa
docker-compose restart pip-chatbot
sleep 60

# Run evaluation
python3 eval_pip.py \
  --dataset pip_eval_v1.json \
  --endpoint http://localhost:5005/webhooks/rest/webhook \
  --outdir eval_output

# Check results
cat eval_output/pip_eval_report.json | jq '{overall: .overall_accuracy, sentiment: .sentiment_accuracy, topic: .topic_accuracy}'
```

---

## 🎯 Expected Results

**Before (current)**:
- Overall: 70.8%
- Sentiment: 56.0%
- Topic: 70.7%

**After (fine-tuned)**:
- Overall: **75-82%** (+4-11%)
- Sentiment: **70-75%** (+14-19%)
- Topic: **75-80%** (+4-9%)

---

## 🚀 Quick Start Checklist

- [ ] Download `healthcare_classification_dataset.jsonl` from server
- [ ] Open Google Colab (colab.research.google.com)
- [ ] Select T4 GPU runtime
- [ ] Upload dataset file
- [ ] Install dependencies cell
- [ ] Paste and run training script
- [ ] Get HuggingFace token (https://huggingface.co/settings/tokens)
- [ ] Request Llama access (https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct)
- [ ] Wait 30-60 minutes
- [ ] Download adapter folder
- [ ] Upload to server and merge
- [ ] Update docker config
- [ ] Restart services
- [ ] Evaluate

**Total time: ~2 hours** (mostly automated)

---

## 💡 Pro Tips

1. **HuggingFace Access**: 
   - Create account at huggingface.co
   - Go to Meta-Llama-3.1-8B-Instruct page
   - Click "Request Access" (usually approved in minutes)
   - Generate token: Settings → Access Tokens → New Token

2. **Colab Tips**:
   - Free tier gives 12 hours GPU time
   - Training takes ~45 minutes
   - Download adapter IMMEDIATELY after training
   - Colab can disconnect - save frequently

3. **Verify GPU**:
   ```python
   import torch
   print(torch.cuda.is_available())  # Should be True
   print(torch.cuda.get_device_name(0))  # Should show "Tesla T4"
   ```

---

## 🆘 Troubleshooting

**"Cannot access gated repo"**:
→ Need HuggingFace token + Llama access approval

**"Out of memory"**:
→ Reduce batch size to 2 or 1

**"Runtime disconnected"**:
→ Colab free tier has limits - download what you have and resume

**"Training too slow"**:
→ Verify GPU is enabled (Runtime → Change runtime type)

---

## 📊 What Happens During Training

1. **Download model** (~5-10 min) - 16GB download
2. **Prepare LoRA** (1 min) - Configure trainable parameters
3. **Training** (30-45 min):
   - Epoch 1/3: Learn patterns
   - Epoch 2/3: Refine understanding
   - Epoch 3/3: Polish accuracy
4. **Save adapter** (1 min) - ~100MB file

**Total: ~45-60 minutes**

---

## ✅ After Fine-Tuning

You'll have a `healthcare_lora_adapter` folder with:
- `adapter_config.json`
- `adapter_model.safetensors` (~100MB)
- `tokenizer` files

**This adapter teaches your model healthcare-specific classification!**

Expected accuracy jump: **70.8% → 75-82%** 🚀

