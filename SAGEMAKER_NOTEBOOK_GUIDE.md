# SageMaker Notebook - Llama 3.1 8B Fine-Tuning Guide

## 🎯 For SageMaker Notebook Instance / Studio GUI

This is the **simplest approach** - just like Colab but with better GPU and no timeouts.

---

## 📋 Step 1: Create Notebook Instance (One-Time Setup)

### In AWS Console:

1. **Go to SageMaker** → **Notebook instances**
2. Click **Create notebook instance**
3. **Settings:**
   - **Name**: `healthcare-finetuning`
   - **Instance type**: `ml.g5.2xlarge` (A10G 24GB GPU)
   - **Volume size**: `50 GB`
   - **IAM role**: 
     - Select "Create a new role" 
     - Allow S3 access (any bucket)
     - Click "Create role"
4. Click **Create notebook instance**
5. Wait ~5 minutes for status: **InService**
6. Click **Open JupyterLab**

**Cost:** ~$2.82/hour (on-demand) - **Remember to stop when done!**

---

## 📋 Step 2: Setup (First Time Only)

### In JupyterLab:

Create new **Python 3** notebook, then run these cells:

#### Cell 1: Install Dependencies
```python
!pip install -q -U transformers datasets peft accelerate trl scipy bitsandbytes huggingface-hub
print("✅ Dependencies installed!")
```

#### Cell 2: Upload Dataset

**Option A - Upload via GUI:**
1. Click upload icon (↑) in left sidebar
2. Select `healthcare_classification_dataset.jsonl` from your computer
3. Wait for upload to complete

**Option B - Download from S3:**
```python
!aws s3 cp s3://your-bucket/healthcare_classification_dataset.jsonl .
```

**Option C - Copy from local (if you have it):**
```python
# Just drag and drop the file into the file browser on the left
```

---

## 🚀 Step 3: Run Fine-Tuning

### Cell 3: Authenticate with HuggingFace
```python
from huggingface_hub import login

# Replace with your token from https://huggingface.co/settings/tokens
HF_TOKEN = "hf_..."  # Your actual token here

login(token=HF_TOKEN)
print("✅ Authenticated with HuggingFace")
```

### Cell 4: Check GPU
```python
import torch
print(f"GPU Available: {torch.cuda.is_available()}")
print(f"GPU Name: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None'}")
print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
```

Expected output:
```
GPU Available: True
GPU Name: NVIDIA A10G
GPU Memory: 22.73 GB
```

### Cell 5: Fine-Tuning Script (Main Training)
```python
import torch
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import LoraConfig
from trl import SFTTrainer, SFTConfig

print("🚀 Healthcare Classification Fine-Tuning (Llama 3.1 8B)")

# Configuration
MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct"
DATASET_FILE = "healthcare_classification_dataset.jsonl"
OUTPUT_DIR = "./healthcare_lora_adapter"

# Load dataset
print("\n📊 Loading dataset...")
dataset = load_dataset('json', data_files=DATASET_FILE, split='train')
dataset = dataset.train_test_split(test_size=0.1, seed=42)
print(f"✅ Train: {len(dataset['train'])} | Val: {len(dataset['test'])}")

# Format dataset for Llama
def format_example(example):
    return {"text": f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Classify healthcare worker messages accurately.<|eot_id|><|start_header_id|>user<|end_header_id|>

{example['text']}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

{{"topic": "{example['topic']}", "sentiment": "{example['sentiment']}", "urgency": "{example['urgency']}", "routing": "{example['routing']}"}}<|eot_id|>"""}

print("\n📝 Formatting examples...")
train_dataset = dataset['train'].map(format_example, num_proc=4)
eval_dataset = dataset['test'].map(format_example, num_proc=4)
print("✅ Dataset formatted")

# Load tokenizer
print("\n📥 Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"
print("✅ Tokenizer loaded")

# Load model with 4-bit quantization (memory optimized)
print("\n📥 Loading Llama 3.1 8B model (this takes ~3-5 minutes)...")

# Clear GPU cache first
torch.cuda.empty_cache()

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
    llm_int8_enable_fp32_cpu_offload=True,  # Enable CPU offloading
)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.float16,
    low_cpu_mem_usage=True,
    max_memory={0: "20GB", "cpu": "30GB"},  # Limit GPU to 20GB, allow CPU offload
)
model.config.use_cache = False
model.config.pretraining_tp = 1

# Enable memory efficient attention
model.config.use_memory_efficient_attention = True
print("✅ Model loaded!")

# LoRA configuration (reduced rank for memory)
print("\n🔧 Setting up LoRA...")
peft_config = LoraConfig(
    r=8,  # Reduced from 16 to 8
    lora_alpha=16,  # Reduced from 32 to 16
    lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    bias="none",
    task_type="CAUSAL_LM",
)
print("✅ LoRA configured")

# Training configuration (memory optimized)
print("\n⚙️ Setting up training...")
sft_config = SFTConfig(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=1,  # Reduced from 2 to 1
    gradient_accumulation_steps=8,  # Increased from 4 to 8
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
    dataloader_pin_memory=False,  # Reduce memory
)

# Create trainer (without max_seq_length - will use default)
trainer = SFTTrainer(
    model=model,
    args=sft_config,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    peft_config=peft_config,
    processing_class=tokenizer,
)
print("✅ Trainer ready")

# Start training
print("\n" + "="*60)
print("🚀 TRAINING STARTED!")
print("="*60)
print("Expected time: 45-60 minutes")
print("Go grab coffee ☕ - this will take a while!")
print("="*60 + "\n")

trainer.train()

# Save adapter
print("\n💾 Saving LoRA adapter...")
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print("\n" + "="*60)
print("✅ TRAINING COMPLETE!")
print("="*60)
print(f"📁 Adapter saved to: {OUTPUT_DIR}")
print("\nNext steps:")
print("1. Download the adapter folder")
print("2. Stop the notebook instance to avoid charges")
print("="*60)
```

---

## 📦 Step 4: Download Trained Adapter

### **Option A - Download via GUI (Easiest):**

1. **Wait for training to complete** (you'll see "✅ TRAINING COMPLETE!")
2. **Look at the left sidebar** - you should see a `healthcare_lora_adapter` folder
3. **Right-click the folder** → **Download**
4. **Save to your computer** - this downloads the entire folder as a zip file

### **Visual Guide:**
```
JupyterLab Interface:
┌─────────────────────────────────────┐
│ 📁 healthcare_lora_adapter/         │ ← Right-click this
│   ├── adapter_config.json           │
│   ├── adapter_model.bin             │
│   └── tokenizer files...            │
│ 📄 other files...                   │
└─────────────────────────────────────┘
        ↓ Right-click → Download
```

### **Option B - Create zip file first:**
```python
# Cell 6: Create zip file for easier download
!zip -r healthcare_lora_adapter.zip healthcare_lora_adapter/
print("✅ Created zip file!")
print("Now right-click 'healthcare_lora_adapter.zip' in file browser and download")
```

### **Option C - Upload to S3 (if you have AWS access):**
```python
# Cell 6: Upload to S3 for later use
!aws s3 sync ./healthcare_lora_adapter/ s3://your-bucket/healthcare_lora_adapter/
print("✅ Uploaded to S3!")
print("Download from: https://s3.console.aws.amazon.com/")
```

### **Option D - Check what's in the folder:**
```python
# Cell 6: See what files were created
!ls -la healthcare_lora_adapter/
print("\nFolder contents:")
!find healthcare_lora_adapter/ -type f
```

### **What you should see in the folder:**
```
healthcare_lora_adapter/
├── adapter_config.json      # LoRA configuration
├── adapter_model.bin        # Trained weights (main file)
├── adapter_model.safetensors # Alternative format
├── tokenizer.json           # Tokenizer files
├── tokenizer_config.json
└── special_tokens_map.json
```

### **If you don't see the folder:**
1. **Check the training completed** - look for "✅ TRAINING COMPLETE!"
2. **Refresh the file browser** - click the refresh button (🔄)
3. **Check the current directory** - run `!pwd` and `!ls` to see files

### **File sizes to expect:**
- **adapter_model.bin**: ~100-200 MB (the main trained weights)
- **adapter_config.json**: ~1 KB (configuration)
- **Total folder**: ~200-300 MB

### **After downloading:**
1. **Extract the zip file** on your computer
2. **Upload to your server** or use locally
3. **Stop the SageMaker instance** to avoid charges! ⚠️

---

## ⚠️ IMPORTANT: Stop Instance to Avoid Charges!

### When Training is Complete:

**In AWS Console:**
1. Go to **SageMaker** → **Notebook instances**
2. Select `healthcare-finetuning`
3. Click **Actions** → **Stop**
4. Wait for status: **Stopped**

**Cost if you forget:** $2.82/hour = $67.68/day! 💸

---

## 🔍 Where to See Training Output

### In the Notebook Cell Output:

**The output appears DIRECTLY BELOW Cell 5** (the training cell) in the notebook.

You'll see:
1. **Initial setup logs** (loading dataset, model, etc.)
2. **Training progress** (loss metrics every 25 steps)
3. **Completion message** (when done)

### Real-Time Output Example:

```
🚀 Healthcare Classification Fine-Tuning (Llama 3.1 8B)

📊 Loading dataset...
✅ Train: 1539 | Val: 171

📝 Formatting examples...
✅ Dataset formatted

📥 Loading tokenizer...
✅ Tokenizer loaded

📥 Loading Llama 3.1 8B model (this takes ~3-5 minutes)...
Loading checkpoint shards: 100%|████████████| 4/4 [03:12<00:00, 48.2s/it]
✅ Model loaded!

🔧 Setting up LoRA...
✅ LoRA configured

⚙️ Setting up training...
✅ Trainer ready

============================================================
🚀 TRAINING STARTED!
============================================================
Expected time: 45-60 minutes
Go grab coffee ☕ - this will take a while!
============================================================

  [25/1155]   2% | Loss: 1.234 | LR: 0.0002 | 00:05
  [50/1155]   4% | Loss: 0.987 | LR: 0.00019 | 00:10
  [75/1155]   6% | Loss: 0.845 | LR: 0.00018 | 00:15
  [100/1155]  8% | Loss: 0.756 | LR: 0.00017 | 00:20
  ...
  [300/1155] 26% | Loss: 0.623 | LR: 0.00015 | 01:00
  [300/1155] EVAL | Eval Loss: 0.523 | Epoch: 1.0
  ...
  [600/1155] 52% | Loss: 0.456 | LR: 0.00012 | 01:40
  [600/1155] EVAL | Eval Loss: 0.412 | Epoch: 2.0
  ...
  [900/1155] 78% | Loss: 0.345 | LR: 0.00008 | 02:20
  [900/1155] EVAL | Eval Loss: 0.389 | Epoch: 3.0
  ...
  [1155/1155] 100% | Loss: 0.312 | LR: 0.00000 | 03:00

💾 Saving LoRA adapter...
============================================================
✅ TRAINING COMPLETE!
============================================================
📁 Adapter saved to: ./healthcare_lora_adapter

Next steps:
1. Download the adapter folder
2. Stop the notebook instance to avoid charges
============================================================
```

### Visual Guide:

```
┌─────────────────────────────────────────────┐
│  Cell 5: [▶ Run] [■ Stop]                  │ ← Click Run to start
├─────────────────────────────────────────────┤
│  # Fine-tuning script                       │
│  import torch                               │
│  from datasets import load_dataset          │
│  ...                                        │
│  trainer.train()  # This runs for 45-60 min│
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│  OUTPUT (appears here as it runs)           │ ← Watch this area!
├─────────────────────────────────────────────┤
│  🚀 Healthcare Classification Fine-Tuning   │
│  📊 Loading dataset...                      │
│  ✅ Train: 1539 | Val: 171                  │
│  ...                                        │
│  [25/1155]   2% | Loss: 1.234               │ ← Updates every 25 steps
│  [50/1155]   4% | Loss: 0.987               │
│  ...                                        │
│  ✅ TRAINING COMPLETE!                      │
└─────────────────────────────────────────────┘
```

### What to Look For:

**✅ Good Signs:**
- Loss **decreasing** over time (1.2 → 0.9 → 0.7 → 0.5 → 0.3)
- Eval loss **lower** than training loss
- No CUDA errors or warnings
- Steady progress (new line every 30-60 seconds)

**⚠️ Warning Signs:**
- Loss stuck at same value (model not learning)
- CUDA out of memory errors → reduce batch size
- No output for >5 minutes → check if cell is running

### Progress Indicators:

| Time | Step | Epoch | What's Happening |
|------|------|-------|------------------|
| 0-5 min | - | - | Loading model & dataset |
| 5-25 min | 1-400 | 0-1 | First epoch, loss dropping fast |
| 25-45 min | 400-800 | 1-2 | Second epoch, refinement |
| 45-60 min | 800-1155 | 2-3 | Final epoch, fine-tuning |
| 60-65 min | Done | 3 | Saving adapter |

### Cell Status Indicators:

- **`[*]`** = Cell is currently running (look for this!)
- **`[5]`** = Cell completed (number shows execution order)
- **`[ ]`** = Cell not run yet

---

## 💡 Pro Tips:

1. **Keep the browser tab open** - output won't show if you close it
2. **Don't click anywhere in the output area** - it won't stop training, but keeps it clean
3. **Scroll down as it runs** - new lines appear at the bottom
4. **Look for the progress bar** - HuggingFace shows `[step/total]`
5. **Check the kernel indicator** - top-right should show "●" (busy) while running

---

## 🧪 Test the Adapter (Optional)

```python
# Cell 7: Quick test
from peft import PeftModel

print("Loading model with adapter...")
base_model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
)
model = PeftModel.from_pretrained(base_model, OUTPUT_DIR)
model.eval()

# Test message
test_message = "No break again, 10 patients alone on 3 West"

# Generate
inputs = tokenizer(
    f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Classify healthcare worker messages accurately.<|eot_id|><|start_header_id|>user<|end_header_id|>

{test_message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

""",
    return_tensors="pt"
).to("cuda")

outputs = model.generate(**inputs, max_new_tokens=100, temperature=0.3)
result = tokenizer.decode(outputs[0], skip_special_tokens=True)

print("\n" + "="*60)
print("TEST MESSAGE:", test_message)
print("="*60)
print("RESULT:")
print(result.split("<|start_header_id|>assistant<|end_header_id|>")[-1].strip())
print("="*60)
```

Expected output:
```json
{"topic": "patient_load", "sentiment": "negative", "urgency": "medium", "routing": "UnitManager"}
```

---

## 💰 Cost Summary

| Item | Cost |
|------|------|
| **Instance (ml.g5.2xlarge)** | $2.82/hour |
| **Training time** | ~1 hour |
| **Storage (50GB)** | ~$0.10/month |
| **Total for one training run** | **~$2.82** |

**Tips to save money:**
- ✅ Stop instance immediately after download
- ✅ Delete instance if no longer needed
- ✅ Use spot instances for production (70% savings)

---

## 🎯 Quick Reference

### Full workflow:
1. **Create instance** (5 min setup)
2. **Open JupyterLab**
3. **Run cells 1-5** (50-65 min total)
4. **Download adapter** (cell 6 or GUI)
5. **Stop instance** ⚠️ IMPORTANT!

### Common issues:

**"CUDA out of memory":**
- Reduce `per_device_train_batch_size` to 1
- Increase `gradient_accumulation_steps` to 8

**"HuggingFace authentication failed":**
- Check your token is correct
- Ensure you've accepted Llama license at https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct

**Training seems stuck:**
- First step takes ~5 min (model loading)
- Each step should take ~15-30 seconds
- Total: ~45-60 minutes

---

## ✅ You're Done!

After training:
1. ✅ Download `healthcare_lora_adapter` folder
2. ✅ Stop the notebook instance
3. ✅ Test the adapter in your Rasa setup
4. ✅ Expect 75-80% accuracy! 🎯

Need help? Check the main guide: `SAGEMAKER_FINETUNING.md`

