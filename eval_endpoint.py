#!/usr/bin/env python3
"""
Simple evaluation endpoint that directly calls the LLM for message classification.
This bypasses Rasa's NLU/Core and provides pure LLM classification for evaluation.
"""

from flask import Flask, request, jsonify
import requests
import json
import re

app = Flask(__name__)

LLM_URL = "http://localhost:1337/v1/chat/completions"

# Regex patterns for clamping (from actions.py)
NEGATIVE_KEYWORDS = [
    'exhausted', 'burned out', 'overwhelmed', 'stressed', 'tired', 'frustrated',
    'angry', 'upset', 'worried', 'problem', 'issue', 'complaint', 'difficult',
    'hard', 'struggling', 'failing', 'broken', 'wrong', 'bad', 'terrible',
    'awful', 'horrible', 'nightmare', 'chaos', 'crisis', 'emergency', 'urgent',
    'critical', 'serious', 'short staffed', 'understaffed', 'call-outs',
    'no coverage', 'alone', 'overworked', 'double shift', 'triple',
    'too many patients', 'overwhelming', 'impossible', "can't handle",
    'breaking point', 'cansado', 'agotado', 'estresado', 'problema',
    'difícil', 'malo', 'terrible', 'horrible', 'pesadilla', 'caos',
    'emergencia', 'urgente', 'crítico', 'serio'
]

POSITIVE_KEYWORDS = [
    'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'proud',
    'happy', 'good', 'positive', 'success', 'saved', 'helped', 'improved',
    'better', 'good shift', 'great day', 'love', 'appreciate', 'thankful',
    'grateful', 'genial', 'excelente', 'maravilloso', 'fantástico',
    'orgulloso', 'feliz', 'bueno', 'positivo', 'éxito', 'salvé', 'ayudé',
    'mejoré', 'mejor', 'buen turno', 'gran día', 'amo', 'agradecido'
]

SAFETY_KEYWORDS = ['unsafe', 'danger', 'threat', 'assault', 'weapon', 'violence', 'attack', 'harm']
HARASSMENT_KEYWORDS = ['harass', 'discriminat', 'bully', 'intimidat', 'racist', 'sexist']

def apply_regex_clamps(message, llm_json):
    """Apply regex-based overrides to LLM classification"""
    message_lower = message.lower()
    
    # Sentiment clamping
    neg_count = sum(1 for kw in NEGATIVE_KEYWORDS if kw in message_lower)
    pos_count = sum(1 for kw in POSITIVE_KEYWORDS if kw in message_lower)
    
    if neg_count >= 2 or any(kw in message_lower for kw in ['short staff', 'understaffed', 'too many patient']):
        llm_json['sentiment'] = 'negative'
    elif pos_count >= 2:
        llm_json['sentiment'] = 'positive'
    
    # Topic and routing for safety/harassment
    if any(kw in message_lower for kw in SAFETY_KEYWORDS):
        llm_json['topic'] = 'safety'
        llm_json['routing'] = 'Safety'
        llm_json['urgency'] = 'high'
    elif any(kw in message_lower for kw in HARASSMENT_KEYWORDS):
        llm_json['topic'] = 'harassment'
        llm_json['routing'] = 'HR'
        llm_json['urgency'] = 'high'
    
    # PHI scrubbing
    phone_pattern = r'(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}'
    room_pattern = r'\b(room|rm)\s*\d{1,4}[A-Za-z]?\b'
    patient_pattern = r'\bpatient\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b'
    
    for field in ['ack', 'summary', 'next_step']:
        if field in llm_json:
            text = llm_json[field]
            text = re.sub(phone_pattern, '[REDACTED]', text, flags=re.IGNORECASE)
            text = re.sub(room_pattern, '[REDACTED]', text, flags=re.IGNORECASE)
            text = re.sub(patient_pattern, '[REDACTED]', text, flags=re.IGNORECASE)
            llm_json[field] = text
    
    return llm_json

@app.route('/pip/label', methods=['POST'])
def label_message():
    """Direct LLM classification endpoint for evaluation"""
    try:
        data = request.json
        # Support both direct format and Rasa webhook format
        message = data.get('text') or data.get('message')
        
        if not message:
            return jsonify({"error": "No message provided", "data": data}), 400
        
        # Call LLM directly
        llm_payload = {
            "messages": [
                {
                    "role": "system",
                    "content": """You are Pip, a healthcare worker support chatbot. Classify messages into structured JSON.

OUTPUT FORMAT (return ONLY this JSON, no other text):
{
  "ack": "short empathetic response ≤160 chars",
  "summary": "neutral one-line summary ≤160 chars (no PHI)",
  "sentiment": "negative | neutral | positive",
  "topic": "staffing | scheduling | pay | management | safety | equipment | training | policies | workflow | patient_load | burnout | harassment | communication | supervisor_behavior | coworker_conflict | discrimination | professionalism | other",
  "urgency": "low | medium | high",
  "routing": "HR | DON | UnitManager | Safety | Scheduling | Payroll",
  "language": "en | es | ht",
  "next_step": "optional next step ≤120 chars"
}

RULES:
- Set sentiment=negative for: exhausted, stressed, short staffed, too many patients, problems
- Set sentiment=positive for: great, proud, success, helped, good day
- For safety issues: topic=safety, routing=Safety, urgency=high
- For harassment/discrimination: topic=harassment or discrimination, routing=HR, urgency=high
- Detect language (en/es/ht) and set accordingly
- Remove any phone numbers, room numbers, patient names from all fields"""
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            "max_tokens": 250,
            "temperature": 0.1
        }
        
        response = requests.post(LLM_URL, json=llm_payload, timeout=10)
        
        if response.status_code != 200:
            return jsonify({"error": "LLM server error"}), 500
        
        llm_response = response.json()
        content = llm_response['choices'][0]['message']['content']
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if not json_match:
            return jsonify({"error": "No JSON in LLM response"}), 500
        
        result = json.loads(json_match.group(0))
        
        # Apply regex clamps
        result = apply_regex_clamps(message, result)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)

