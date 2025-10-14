#!/usr/bin/env python3
import json
import requests
import time

def test_llm_server(message, expected):
    """Test the LLM server directly"""
    url = "http://localhost:1337/v1/chat/completions"
    payload = {
        "messages": [{"role": "user", "content": message}],
        "max_tokens": 200
    }
    
    try:
        start_time = time.time()
        response = requests.post(url, json=payload, timeout=10)
        elapsed_ms = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            data = response.json()
            llm_response = data['choices'][0]['message']['content']
            
            # Parse the JSON response
            try:
                parsed = json.loads(llm_response)
                
                # Check accuracy
                correct = 0
                total = 0
                
                for key in ['topic', 'sentiment', 'urgency', 'routing']:
                    if key in expected and key in parsed:
                        total += 1
                        if parsed[key] == expected[key]:
                            correct += 1
                
                accuracy = correct / total if total > 0 else 0
                
                return {
                    'success': True,
                    'accuracy': accuracy,
                    'response': parsed,
                    'latency_ms': elapsed_ms,
                    'raw_response': llm_response
                }
            except json.JSONDecodeError as e:
                return {
                    'success': False,
                    'error': f'JSON parse error: {e}',
                    'latency_ms': elapsed_ms,
                    'raw_response': llm_response
                }
        else:
            return {
                'success': False,
                'error': f'HTTP {response.status_code}',
                'latency_ms': elapsed_ms
            }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'latency_ms': 0
        }

def main():
    # Test cases
    test_cases = [
        {
            'message': 'Had 12 patients alone on 3 West',
            'expected': {'topic': 'patient_load', 'sentiment': 'negative', 'urgency': 'medium', 'routing': 'UnitManager'}
        },
        {
            'message': 'The lift is broken and unsafe',
            'expected': {'topic': 'safety', 'sentiment': 'negative', 'urgency': 'high', 'routing': 'Safety'}
        },
        {
            'message': 'My supervisor called me a racial slur',
            'expected': {'topic': 'harassment', 'sentiment': 'negative', 'urgency': 'high', 'routing': 'HR'}
        },
        {
            'message': 'Great shift today, saved a life!',
            'expected': {'topic': 'professionalism', 'sentiment': 'positive', 'urgency': 'low', 'routing': 'UnitManager'}
        },
        {
            'message': 'I need time off next week',
            'expected': {'topic': 'scheduling', 'sentiment': 'neutral', 'urgency': 'low', 'routing': 'Scheduling'}
        }
    ]
    
    print("🧪 Testing LLM Server Directly")
    print("=" * 40)
    
    results = []
    total_accuracy = 0
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test['message'][:50]}...")
        
        result = test_llm_server(test['message'], test['expected'])
        results.append(result)
        
        if result['success']:
            print(f"   ✅ Success - Accuracy: {result['accuracy']:.2%}")
            print(f"   📊 Response: {json.dumps(result['response'], indent=2)}")
            print(f"   ⏱️  Latency: {result['latency_ms']:.1f}ms")
            total_accuracy += result['accuracy']
        else:
            print(f"   ❌ Failed - {result['error']}")
    
    print(f"\n📈 SUMMARY")
    print("=" * 40)
    print(f"Tests run: {len(test_cases)}")
    print(f"Successful: {sum(1 for r in results if r['success'])}")
    print(f"Failed: {sum(1 for r in results if not r['success'])}")
    print(f"Average accuracy: {total_accuracy/len(test_cases):.2%}")
    print(f"Average latency: {sum(r['latency_ms'] for r in results)/len(results):.1f}ms")

if __name__ == "__main__":
    main()
