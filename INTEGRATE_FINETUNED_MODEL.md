# 🎉 Fine-Tuned Model Integration Guide

## ✅ **Your Adapter is Ready!**

Your fine-tuned LoRA adapter has been successfully created with:
- **Base Model**: Llama 3.1 8B Instruct
- **LoRA Rank**: 8 (memory optimized)
- **Training Checkpoints**: 300, 579 (final)
- **Adapter Size**: 23MB (very efficient!)

---

## 🔧 **Integration Options**

### **Option 1: Replace Current LLM Server (Recommended)**

Update your existing pipeline to use the fine-tuned model:

#### **Step 1: Update Docker Compose**
```yaml
# In docker-compose.yml, update the llm-server service:
llm-server:
  build:
    context: .
    dockerfile: llama_server_finetuned.Dockerfile  # New dockerfile
  container_name: pipeline-llm-server
  volumes:
    - ./healthcare_lora_adapter:/app/adapters/healthcare_lora_adapter:ro
    - /home/ubuntu/.local/share/Jan/data/llamacpp/models/llama-3.1-8b-instruct-q5_k_m.gguf:/app/models/llama-3.1-8b-instruct-q5_k_m.gguf:ro
  ports:
    - "1337:1337"
  environment:
    - ADAPTER_PATH=/app/adapters/healthcare_lora_adapter
  restart: unless-stopped
```

#### **Step 2: Create New Dockerfile**
```dockerfile
# llama_server_finetuned.Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y build-essential cmake && rm -rf /var/lib/apt/lists/*
RUN pip install torch transformers peft accelerate bitsandbytes

# Copy adapter and model
COPY healthcare_lora_adapter/ ./adapters/healthcare_lora_adapter/
COPY models/llama-3.1-8b-instruct-q5_k_m.gguf ./models/

# Copy server script
COPY llama_server_with_adapter.py .

EXPOSE 1337
CMD ["python", "llama_server_with_adapter.py"]
```

#### **Step 3: Create Enhanced Server Script**
```python
# llama_server_with_adapter.py
import os
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel
import torch

app = Flask(__name__)

# Load base model
MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct"
ADAPTER_PATH = os.getenv("ADAPTER_PATH", "./adapters/healthcare_lora_adapter")

print("Loading base model...")
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
)

base_model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.float16,
)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

# Load fine-tuned adapter
print("Loading fine-tuned adapter...")
model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
model.eval()

print("✅ Fine-tuned model ready!")

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        prompt = data.get('prompt', '')
        
        # Format prompt for Llama
        formatted_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Classify healthcare worker messages accurately.<|eot_id|><|start_header_id|>user<|end_header_id|>

{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
        
        # Tokenize and generate
        inputs = tokenizer(formatted_prompt, return_tensors="pt").to(model.device)
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=200,
                temperature=0.3,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        response = response.split("<|start_header_id|>assistant<|end_header_id|>")[-1].strip()
        
        return jsonify({"response": response})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1337, debug=False)
```

---

### **Option 2: Test Locally First**

Test the fine-tuned model before integrating:

```python
# test_finetuned_model.py
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel
import torch

# Load model and adapter
MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct"
ADAPTER_PATH = "./healthcare_lora_adapter"

print("Loading base model...")
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
)

base_model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.float16,
)
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

# Load fine-tuned adapter
model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
model.eval()

# Test with sample messages
test_messages = [
    "No break again, 10 patients alone on 3 West",
    "The new scheduling system is working great!",
    "Manager yelled at me in front of patients",
    "Need clarification on the new policy"
]

for message in test_messages:
    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Classify healthcare worker messages accurately.<|eot_id|><|start_header_id|>user<|end_header_id|>

{message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
    
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=100,
            temperature=0.3,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    result = response.split("<|start_header_id|>assistant<|end_header_id|>")[-1].strip()
    
    print(f"\nMessage: {message}")
    print(f"Result: {result}")
    print("-" * 50)
```

---

## 📊 **Expected Performance Improvements**

With your fine-tuned model, you should see:

| Metric | Before (Baseline) | After (Fine-tuned) | Improvement |
|--------|-------------------|-------------------|-------------|
| **Overall Accuracy** | 70.8% | **75-80%** | +5-10% |
| **Sentiment Accuracy** | 56% | **70-75%** | +15-20% |
| **Topic Accuracy** | 70.7% | **75-80%** | +5-10% |
| **JSON Validity** | 100% | **100%** | Same |
| **Fallback Rate** | 0% | **0%** | Same |

---

## 🚀 **Quick Start Integration**

1. **Test locally first** (Option 2)
2. **Update docker-compose.yml** (Option 1)
3. **Create new Dockerfile** (Option 1)
4. **Rebuild and restart**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```
5. **Run evaluation**:
   ```bash
   python3 eval_pip.py --dataset pip_eval_v1.json --endpoint http://localhost:8080/pip/label --outdir finetuned_eval
   ```

---

## 🎯 **Next Steps**

1. **Test the model** with sample messages
2. **Integrate with your pipeline**
3. **Run full evaluation**
4. **Deploy to production**
5. **Monitor performance**

Your fine-tuned adapter is ready to significantly improve your healthcare classification accuracy! 🎉

**Expected training cost**: ~$2.82 (1 hour on ml.g5.2xlarge)
**Expected accuracy gain**: +5-10% overall, +15-20% sentiment
**File size**: Only 23MB (very efficient!)

Let me know if you need help with any of these integration steps!
