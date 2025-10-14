#!/usr/bin/env python3
import json
import requests
import time

def test_llm_server(message):
    """Test the LLM server directly"""
    url = "http://localhost:1337/v1/chat/completions"
    payload = {
        "messages": [{"role": "user", "content": message}],
        "max_tokens": 200
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        if response.status_code == 200:
            data = response.json()
            llm_response = data['choices'][0]['message']['content']
            return json.loads(llm_response)
    except:
        pass
    return None

def main():
    # Load test cases and analyze patterns
    test_cases = []
    with open('pip_eval_v1.json', 'r') as f:
        for line in f:
            if line.strip():
                test_cases.append(json.loads(line))
    
    print("🔍 ANALYZING ACCURACY PATTERNS")
    print("=" * 50)
    
    # Analyze sentiment issues
    print("\n📊 SENTIMENT ANALYSIS:")
    sentiment_examples = []
    for test in test_cases[:20]:  # Sample first 20
        expected = test['expected']['sentiment']
        if expected == 'negative':
            sentiment_examples.append((test['caregiver_message'], expected))
    
    for message, expected in sentiment_examples[:5]:
        result = test_llm_server(message)
        if result:
            predicted = result.get('sentiment', 'unknown')
            print(f"Expected: {expected}, Got: {predicted}")
            print(f"Message: {message[:60]}...")
            print()
    
    # Analyze topic issues
    print("\n📊 TOPIC ANALYSIS:")
    topic_examples = []
    for test in test_cases[:20]:
        expected = test['expected']['topic']
        if expected == 'patient_load':
            topic_examples.append((test['caregiver_message'], expected))
    
    for message, expected in topic_examples[:5]:
        result = test_llm_server(message)
        if result:
            predicted = result.get('topic', 'unknown')
            print(f"Expected: {expected}, Got: {predicted}")
            print(f"Message: {message[:60]}...")
            print()

if __name__ == "__main__":
    main()
