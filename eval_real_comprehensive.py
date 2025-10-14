#!/usr/bin/env python3
import json
import requests
import time
import statistics

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
                
                # Check accuracy for each field
                topic_correct = parsed.get('topic') == expected.get('topic')
                sentiment_correct = parsed.get('sentiment') == expected.get('sentiment')
                urgency_correct = parsed.get('urgency') == expected.get('urgency')
                routing_correct = parsed.get('routing') == expected.get('routing')
                
                overall_correct = all([topic_correct, sentiment_correct, urgency_correct, routing_correct])
                
                return {
                    'success': True,
                    'overall_correct': overall_correct,
                    'topic_correct': topic_correct,
                    'sentiment_correct': sentiment_correct,
                    'urgency_correct': urgency_correct,
                    'routing_correct': routing_correct,
                    'response': parsed,
                    'latency_ms': elapsed_ms,
                    'json_valid': True
                }
            except json.JSONDecodeError as e:
                return {
                    'success': False,
                    'error': f'JSON parse error: {e}',
                    'latency_ms': elapsed_ms,
                    'json_valid': False,
                    'raw_response': llm_response
                }
        else:
            return {
                'success': False,
                'error': f'HTTP {response.status_code}',
                'latency_ms': elapsed_ms,
                'json_valid': False
            }
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'latency_ms': 0,
            'json_valid': False
        }

def main():
    # Load the full dataset
    test_cases = []
    with open('pip_eval_v1.json', 'r') as f:
        for line in f:
            if line.strip():
                test_cases.append(json.loads(line))
    
    print(f"🧪 Comprehensive Real LLM Evaluation")
    print(f"=" * 50)
    print(f"Testing {len(test_cases)} cases against live LLM server...")
    print()
    
    results = []
    latencies = []
    json_valid_count = 0
    
    # Test each case
    for i, test in enumerate(test_cases, 1):
        if i % 20 == 0:
            print(f"Progress: {i}/{len(test_cases)} ({i/len(test_cases)*100:.1f}%)")
        
        result = test_llm_server(test['caregiver_message'], test['expected'])
        results.append(result)
        
        if result.get('json_valid', False):
            json_valid_count += 1
            latencies.append(result['latency_ms'])
    
    # Calculate metrics
    total_tests = len(test_cases)
    successful_tests = sum(1 for r in results if r['success'])
    json_validity = json_valid_count / total_tests
    
    overall_accuracy = sum(1 for r in results if r.get('overall_correct', False)) / total_tests
    topic_accuracy = sum(1 for r in results if r.get('topic_correct', False)) / total_tests
    sentiment_accuracy = sum(1 for r in results if r.get('sentiment_correct', False)) / total_tests
    urgency_accuracy = sum(1 for r in results if r.get('urgency_correct', False)) / total_tests
    routing_accuracy = sum(1 for r in results if r.get('routing_correct', False)) / total_tests
    
    avg_latency = statistics.mean(latencies) if latencies else 0
    p95_latency = statistics.quantiles(latencies, n=20)[18] if len(latencies) > 20 else max(latencies) if latencies else 0
    
    # Print results
    print(f"\n📊 REAL EVALUATION RESULTS")
    print(f"=" * 50)
    print(f"Total tests: {total_tests}")
    print(f"Successful responses: {successful_tests} ({successful_tests/total_tests*100:.1f}%)")
    print(f"JSON validity: {json_validity:.3f} ({json_validity*100:.1f}%)")
    print()
    print(f"ACCURACY METRICS:")
    print(f"Overall accuracy: {overall_accuracy:.3f} ({overall_accuracy*100:.1f}%)")
    print(f"Topic accuracy: {topic_accuracy:.3f} ({topic_accuracy*100:.1f}%)")
    print(f"Sentiment accuracy: {sentiment_accuracy:.3f} ({sentiment_accuracy*100:.1f}%)")
    print(f"Urgency accuracy: {urgency_accuracy:.3f} ({urgency_accuracy*100:.1f}%)")
    print(f"Routing accuracy: {routing_accuracy:.3f} ({routing_accuracy*100:.1f}%)")
    print()
    print(f"PERFORMANCE METRICS:")
    print(f"Average latency: {avg_latency:.1f}ms")
    print(f"P95 latency: {p95_latency:.1f}ms")
    print(f"Valid responses: {json_valid_count}")
    
    # Check against thresholds
    print(f"\n🎯 THRESHOLD ANALYSIS:")
    json_valid_threshold = 0.99
    overall_acc_threshold = 0.80
    
    json_valid_pass = json_validity >= json_valid_threshold
    overall_acc_pass = overall_accuracy >= overall_acc_threshold
    
    print(f"JSON validity >= {json_valid_threshold:.1%}: {'✅ PASS' if json_valid_pass else '❌ FAIL'}")
    print(f"Overall accuracy >= {overall_acc_threshold:.1%}: {'✅ PASS' if overall_acc_pass else '❌ FAIL'}")
    
    if json_valid_pass and overall_acc_pass:
        print(f"\n🎉 ALL CRITICAL THRESHOLDS MET!")
    else:
        print(f"\n⚠️  SOME THRESHOLDS NOT MET")

if __name__ == "__main__":
    main()
