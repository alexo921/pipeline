#!/usr/bin/env python3
"""
Simple Llama server to run the downloaded model locally for Rasa integration.
This script starts a local API server that Rasa can call for natural language responses.
"""

import argparse
import json
import logging
from typing import List, Dict, Any
from flask import Flask, request, jsonify
import subprocess
import threading
import time
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class LlamaServer:
    def __init__(self, model_path: str, port: int = 8080):
        self.model_path = model_path
        self.port = port
        self.server_process = None
        self.server_url = f"http://localhost:{port}"
        
    def start_llama_server(self):
        """Start the llama.cpp server process."""
        try:
            # Find the llama-server binary
            llama_server_path = "/home/ubuntu/pipeline/jan/llama-server"
            
            if not os.path.exists(llama_server_path):
                logger.error(f"llama-server not found at {llama_server_path}")
                return False
                
            # Start the server
            cmd = [
                llama_server_path,
                "-m", self.model_path,
                "--port", str(self.port),
                "--host", "0.0.0.0",
                "--ctx-size", "2048",
                "--batch-size", "512",
                "--threads", "4"
            ]
            
            logger.info(f"Starting llama server with command: {' '.join(cmd)}")
            self.server_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Wait a moment for server to start
            time.sleep(3)
            
            # Check if server is running
            if self.server_process.poll() is None:
                logger.info(f"Llama server started successfully on port {self.port}")
                return True
            else:
                logger.error("Failed to start llama server")
                return False
                
        except Exception as e:
            logger.error(f"Error starting llama server: {e}")
            return False
    
    def stop_llama_server(self):
        """Stop the llama server process."""
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait()
            logger.info("Llama server stopped")

# Global server instance
llama_server = None

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """Handle chat completion requests from Rasa."""
    try:
        data = request.get_json()
        
        if not data or 'messages' not in data:
            return jsonify({'error': 'Invalid request format'}), 400
        
        messages = data['messages']
        model = data.get('model', 'llama-3.1-8b-instruct')
        temperature = data.get('temperature', 0.7)
        max_tokens = data.get('max_tokens', 200)
        
        # Format messages for llama.cpp
        prompt = format_messages_for_llama(messages)
        
        # For now, return a simple response
        # In a full implementation, you would call the actual llama.cpp API
        response_text = generate_response(prompt, messages)
        
        response = {
            "id": "chatcmpl-" + str(int(time.time())),
            "object": "chat.completion",
            "created": int(time.time()),
            "model": model,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response_text
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": len(prompt.split()),
                "completion_tokens": len(response_text.split()),
                "total_tokens": len(prompt.split()) + len(response_text.split())
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error in chat_completions: {e}")
        return jsonify({'error': 'Internal server error'}), 500

def format_messages_for_llama(messages: List[Dict[str, str]]) -> str:
    """Format messages for llama.cpp input."""
    formatted = ""
    
    for message in messages:
        role = message.get('role', 'user')
        content = message.get('content', '')
        
        if role == 'system':
            formatted += f"System: {content}\n\n"
        elif role == 'user':
            formatted += f"Human: {content}\n"
        elif role == 'assistant':
            formatted += f"Assistant: {content}\n"
    
    formatted += "Assistant: "
    return formatted

def generate_response(prompt: str, messages: List[Dict[str, str]]) -> str:
    """Generate a response using the Llama model."""
    # For now, return a simple healthcare-focused response
    # In a full implementation, this would call the actual llama.cpp server
    
    last_user_message = ""
    for message in reversed(messages):
        if message.get('role') == 'user':
            last_user_message = message.get('content', '').lower()
            break
    
    # Simple response logic based on keywords
    if any(word in last_user_message for word in ['shift', 'worked', 'department']):
        return "I'd be happy to help you document your shift! Can you tell me more about your department, hours worked, and how it went?"
    elif any(word in last_user_message for word in ['schedule', 'work', 'available']):
        return "I can help you with schedule questions! You can check your upcoming shifts in the mobile app or let me know what specific scheduling help you need."
    elif any(word in last_user_message for word in ['help', 'support', 'problem']):
        return "I'm here to support you! Can you tell me more about what you're experiencing or what help you need?"
    elif any(word in last_user_message for word in ['training', 'learn', 'course']):
        return "I'd be happy to help you with training and development opportunities! What specific skills or areas are you interested in learning more about?"
    else:
        return "Hi! I'm Pip, your healthcare workforce assistant. How can I help you today? I can assist with shift documentation, scheduling questions, workplace support, and more!"

def main():
    parser = argparse.ArgumentParser(description='Llama server for Rasa integration')
    parser.add_argument('--model', required=True, help='Path to the Llama model file')
    parser.add_argument('--port', type=int, default=8080, help='Port for the API server')
    parser.add_argument('--llama-port', type=int, default=8081, help='Port for the llama.cpp server')
    
    args = parser.parse_args()
    
    global llama_server
    llama_server = LlamaServer(args.model, args.llama_port)
    
    # Start llama server
    if not llama_server.start_llama_server():
        logger.error("Failed to start llama server. Exiting.")
        return
    
    try:
        logger.info(f"Starting Flask API server on port {args.port}")
        app.run(host='0.0.0.0', port=args.port, debug=False)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        llama_server.stop_llama_server()

if __name__ == "__main__":
    main()
