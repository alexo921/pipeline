#!/usr/bin/env python3
"""
Fine-tuned Llama Server with LoRA Adapter
Serves the healthcare classification model via HTTP API
"""

import os
import json
import time
import logging
from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from peft import PeftModel
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Global variables for model and tokenizer
model = None
tokenizer = None
model_loaded = False

def load_model():
    """Load the base model and fine-tuned adapter"""
    global model, tokenizer, model_loaded
    
    try:
        logger.info("🚀 Starting model loading...")
        
        # Configuration
        MODEL_NAME = "meta-llama/Meta-Llama-3.1-8B-Instruct"
        ADAPTER_PATH = os.getenv("ADAPTER_PATH", "/app/adapters/healthcare_lora_adapter")
        
        logger.info(f"Loading base model: {MODEL_NAME}")
        logger.info(f"Loading adapter from: {ADAPTER_PATH}")
        
        # Clear GPU cache
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        # Configure quantization for memory efficiency
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        
        # Load base model
        logger.info("📥 Loading base model...")
        base_model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            quantization_config=bnb_config,
            device_map="auto",
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True,
        )
        
        # Load tokenizer
        logger.info("📥 Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.padding_side = "right"
        
        # Load fine-tuned adapter
        logger.info("📥 Loading fine-tuned adapter...")
        model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
        model.eval()
        
        # Configure model settings
        model.config.use_cache = False
        model.config.pretraining_tp = 1
        
        model_loaded = True
        logger.info("✅ Fine-tuned model loaded successfully!")
        
        # Print model info
        if torch.cuda.is_available():
            logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
            logger.info(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
        
    except Exception as e:
        logger.error(f"❌ Error loading model: {str(e)}")
        raise e

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy" if model_loaded else "loading",
        "model_loaded": model_loaded,
        "timestamp": time.time()
    })

@app.route('/generate', methods=['POST'])
def generate():
    """Generate classification for healthcare messages"""
    if not model_loaded:
        return jsonify({"error": "Model not loaded yet"}), 503
    
    try:
        data = request.json
        if not data or 'prompt' not in data:
            return jsonify({"error": "Missing 'prompt' in request"}), 400
        
        prompt = data.get('prompt', '').strip()
        if not prompt:
            return jsonify({"error": "Empty prompt"}), 400
        
        # Format prompt for Llama chat template
        formatted_prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>

Classify healthcare worker messages accurately.<|eot_id|><|start_header_id|>user<|end_header_id|>

{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

"""
        
        # Tokenize input
        inputs = tokenizer(formatted_prompt, return_tensors="pt").to(model.device)
        
        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=200,
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
        
        logger.info(f"Generated response: {response}")
        
        return jsonify({
            "response": response,
            "model": "llama-3.1-8b-finetuned",
            "adapter": "healthcare-lora-adapter"
        })
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/info', methods=['GET'])
def model_info():
    """Get model information"""
    if not model_loaded:
        return jsonify({"error": "Model not loaded yet"}), 503
    
    return jsonify({
        "model": "meta-llama/Meta-Llama-3.1-8B-Instruct",
        "adapter": "healthcare-lora-adapter",
        "quantization": "4-bit",
        "device": str(model.device) if model else "unknown",
        "loaded": model_loaded
    })

if __name__ == '__main__':
    logger.info("🚀 Starting Fine-tuned Llama Server...")
    
    # Load model in background
    load_model()
    
    # Start Flask server
    logger.info("🌐 Starting HTTP server on port 1337...")
    app.run(host='0.0.0.0', port=1337, debug=False, threaded=True)
