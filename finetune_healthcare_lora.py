#!/usr/bin/env python3
"""
Fine-tune Llama 3.1 8B with LoRA for Healthcare Classification
Focuses on sentiment + urgency + topic
"""

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

print("🚀 Starting Healthcare Classification Fine-Tuning")
print("=" * 60)

# Configuration
MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct"
DATASET_FILE = "healthcare_classification_dataset.jsonl"
OUTPUT_DIR = "./healthcare_lora_adapter"
MAX_LENGTH = 512

print(f"\n📊 Loading dataset: {DATASET_FILE}")
dataset = load_dataset('json', data_files=DATASET_FILE, split='train')
print(f"✅ Loaded {len(dataset)} examples")

# Split train/val
dataset = dataset.train_test_split(test_size=0.1, seed=42)
train_dataset = dataset['train']
val_dataset = dataset['test']
print(f"  Train: {len(train_dataset)} | Val: {len(val_dataset)}")

print(f"\n📥 Loading model: {MODEL_NAME}")
print("Note: This will download ~16GB. May take 10-15 minutes...")

# Load tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

# Load model in 8-bit for CPU efficiency
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    device_map="cpu",
    torch_dtype=torch.float32,  # CPU requires float32
    low_cpu_mem_usage=True,
)

print("✅ Model loaded")

# Prepare for LoRA
print("\n🔧 Configuring LoRA...")
lora_config = LoraConfig(
    r=16,  # LoRA rank
    lora_alpha=32,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
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
    
    prompt = f"""Classify this healthcare worker message.

Message: {text}

Provide ONLY the classification as JSON:
{{"topic": "{topic}", "sentiment": "{sentiment}", "urgency": "{urgency}", "routing": "{routing}"}}"""
    
    return {"text": prompt}

print("\n📝 Formatting dataset...")
train_dataset = train_dataset.map(format_prompt, remove_columns=train_dataset.column_names)
val_dataset = val_dataset.map(format_prompt, remove_columns=val_dataset.column_names)

def tokenize_function(examples):
    return tokenizer(examples["text"], truncation=True, max_length=MAX_LENGTH, padding="max_length")

train_dataset = train_dataset.map(tokenize_function, batched=True, remove_columns=["text"])
val_dataset = val_dataset.map(tokenize_function, batched=True, remove_columns=["text"])

print("✅ Dataset formatted and tokenized")

# Training arguments - optimized for CPU
print("\n⚙️  Setting up training (CPU-optimized)...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=1,  # Small for CPU
    per_device_eval_batch_size=1,
    gradient_accumulation_steps=8,  # Simulate larger batch
    learning_rate=2e-4,
    warmup_steps=100,
    logging_steps=50,
    save_steps=500,
    eval_steps=500,
    save_total_limit=2,
    fp16=False,  # CPU doesn't support fp16
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
print("WARNING: CPU training will be SLOW (6-12 hours estimated)")
print("Consider using Google Colab with GPU for faster training (30-60 min)")
print("\nContinue? (Ctrl+C to cancel, Enter to proceed)")
input()

# Train
trainer.train()

# Save the LoRA adapter
print("\n💾 Saving LoRA adapter...")
model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print(f"\n✅ Fine-tuning complete!")
print(f"📁 Adapter saved to: {OUTPUT_DIR}")
print("\n🎯 To use the fine-tuned model:")
print("  1. Load base model + LoRA adapter")
print("  2. Convert to GGUF format")
print("  3. Replace current model in llama server")
print("\nExpected accuracy improvement: 70.8% → 75-82%")

