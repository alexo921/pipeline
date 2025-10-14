#!/usr/bin/env python3
"""
Test the fine-tuned model locally
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel

def test_finetuned_model():
    print("🚀 Testing Fine-tuned Healthcare Classification Model")
    
    # Configuration
    MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct"
    ADAPTER_PATH = "./healthcare_lora_adapter"
    
    # Test messages
    test_messages = [
        "No break again, 10 patients alone on 3 West",
        "The new scheduling system is working great!",
        "Manager yelled at me in front of patients",
        "Need clarification on the new policy",
        "Equipment is broken and patients are waiting",
        "Great teamwork today, everyone helped out",
        "Short staffed again, this is unsafe",
        "Payroll mistake on my last check"
    ]
    
    try:
        print("\n📥 Loading model and adapter...")
        
        # Check if CUDA is available
        if not torch.cuda.is_available():
            print("❌ CUDA not available. Testing with CPU (will be slow)...")
            device = "cpu"
        else:
            print(f"✅ CUDA available: {torch.cuda.get_device_name(0)}")
            device = "cuda"
        
        # Configure quantization for memory efficiency
        if device == "cuda":
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_use_double_quant=True,
            )
        else:
            bnb_config = None
        
        # Load base model
        print("Loading base model...")
        base_model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            quantization_config=bnb_config,
            device_map="auto" if device == "cuda" else None,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            low_cpu_mem_usage=True,
        )
        
        # Load tokenizer
        print("Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.padding_side = "right"
        
        # Load fine-tuned adapter
        print("Loading fine-tuned adapter...")
        model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
        model.eval()
        
        print("✅ Model loaded successfully!")
        
        # Test each message
        print("\n" + "="*80)
        print("🧪 TESTING HEALTHCARE MESSAGE CLASSIFICATION")
        print("="*80)
        
        for i, message in enumerate(test_messages, 1):
            print(f"\n[{i}/{len(test_messages)}] Message: {message}")
            print("-" * 60)
            
            # Format prompt for Llama
            prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Classify healthcare worker messages accurately.<|eot_id|><|start_header_id|>user<|end_header_id|>

{message}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
            
            # Tokenize and generate
            inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
            
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=100,
                    temperature=0.3,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                )
            
            # Decode response
            full_response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract just the assistant's response
            if "<|start_header_id|>assistant<|end_header_id|>" in full_response:
                response = full_response.split("<|start_header_id|>assistant<|end_header_id|>")[-1].strip()
            else:
                response = full_response
            
            print(f"Result: {response}")
            
            # Try to parse JSON
            try:
                import json
                # Extract JSON from response
                if "{" in response and "}" in response:
                    json_start = response.find("{")
                    json_end = response.rfind("}") + 1
                    json_str = response[json_start:json_end]
                    parsed = json.loads(json_str)
                    print(f"✅ Valid JSON: {parsed}")
                else:
                    print("⚠️  No JSON found in response")
            except Exception as e:
                print(f"❌ JSON parsing failed: {e}")
        
        print("\n" + "="*80)
        print("✅ TESTING COMPLETE!")
        print("="*80)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_finetuned_model()
