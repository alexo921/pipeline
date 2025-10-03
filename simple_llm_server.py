#!/usr/bin/env python3
"""
Simple LLM Mock Server for Pip Testing
Returns structured JSON responses based on message content
"""

from flask import Flask, request, jsonify
import json
import re

app = Flask(__name__)

def apply_regex_clamps(text: str, llm_response: dict) -> dict:
    """Apply regex clamps to override LLM decisions with confident pattern matches."""
    text_lower = text.lower()
    result = llm_response.copy()
    
    # Regex clamps (same as in actions.py)
    clamps = [
        # Safety first
        (r"\b(threat|threatened|unsafe|assault|weapon|violence|no ppe|broken lift)\b",
         {"topic": "safety", "routing": "Safety", "urgency": "high"}),
        # Patient load vs staffing
        (r"\b(\d{1,2}\s?(patients|pts?)|alone on|double (shift|load))\b",
         {"topic": "patient_load"}),
        (r"\b(short staffed|understaffed|call[- ]?outs?|float coverage|not enough staff)\b",
         {"topic": "staffing"}),
        # Communication vs coworker vs supervisor
        (r"\b(handoff|ignored (notes|handoff)|no updates|unclear instructions)\b",
         {"topic": "communication"}),
        (r"\b(roll(ing)? eyes|gossip|refus(ing|ed) help|passive[- ]?aggressive)\b",
         {"topic": "coworker_conflict"}),
        (r"\b(charge nurse|supervisor|manager|lead|retaliat|belittle|favoritism)\b",
         {"topic": "supervisor_behavior", "routing": "HR"}),
        # Pay & scheduling
        (r"\b(overtime|OT|paycheck|rate|bonus)\b", {"topic": "pay", "routing": "Payroll"}),
        (r"\b(schedule|posted late|swap|time off|pto request)\b", {"topic": "scheduling", "routing": "Scheduling"}),
        # Equipment & supplies
        (r"\b(broken (lift|pump)|no gloves|equipment (down|broken)|malfunction(ing)?|lift.*broken|pump.*failing)\b",
         {"topic": "equipment"}),
        # Harassment / discrimination keywords
        (r"\b(harass(ed|ment)|slur|racis\w*|sexis\w*|homophob\w*|used slurs)\b",
         {"topic": "harassment", "routing": "HR", "urgency": "high"}),
        (r"\b(discriminat\w+|ageism|biased|bias|comment about my age|unfairly because of my accent)\b",
         {"topic": "discrimination", "routing": "HR", "urgency": "high"}),
    ]
    
    # Apply clamps in order
    for pattern, overrides in clamps:
        if re.search(pattern, text_lower, re.IGNORECASE):
            result.update(overrides)
            break
    
    return result

def generate_response(user_message: str) -> dict:
    """Generate a structured JSON response based on the user message."""
    
    # Default response
    default_response = {
        "ack": "I hear you and I'm here to support you.",
        "summary": f"Message about healthcare workplace concerns",
        "sentiment": "neutral",
        "topic": "other",
        "urgency": "low",
        "routing": "UnitManager",
        "language": "en",
        "next_step": "I'll connect you with the right person to help."
    }
    
    # Apply regex clamps
    clamped_response = apply_regex_clamps(user_message, default_response)
    
    # PHI scrubbing
    phi_patterns = [
        (r"(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}", "[REDACTED]"),  # Phone
        (r"\b(room|rm)\s*\d{1,4}[A-Za-z]?\b", "room [REDACTED]"),  # Room
        (r"\bpatient\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b", "patient [REDACTED]")  # Patient name
    ]
    
    for pattern, replacement in phi_patterns:
        clamped_response["ack"] = re.sub(pattern, replacement, clamped_response["ack"], flags=re.IGNORECASE)
        clamped_response["summary"] = re.sub(pattern, replacement, clamped_response["summary"], flags=re.IGNORECASE)
    
    return clamped_response

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """Handle chat completion requests."""
    try:
        data = request.get_json()
        messages = data.get('messages', [])
        
        if not messages:
            return jsonify({"error": "No messages provided"}), 400
        
        # Get the last user message
        user_message = ""
        for msg in reversed(messages):
            if msg.get('role') == 'user':
                user_message = msg.get('content', '')
                break
        
        if not user_message:
            return jsonify({"error": "No user message found"}), 400
        
        # Generate structured response
        response = generate_response(user_message)
        
        # Return in OpenAI-compatible format
        return jsonify({
            "id": "chatcmpl-123",
            "object": "chat.completion",
            "created": 1677652288,
            "model": "llama-3.1-8b-instruct",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": json.dumps(response)
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 50,
                "total_tokens": 60
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    print("🚀 Starting Simple LLM Server on port 1337")
    print("📡 Endpoint: http://localhost:1337/v1/chat/completions")
    app.run(host='0.0.0.0', port=1337, debug=False)
