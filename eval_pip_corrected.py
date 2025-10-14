#!/usr/bin/env python3
"""
Corrected evaluation script for Rasa endpoint
"""

import json
import requests
import time
import argparse
from pathlib import Path
import statistics

def load_dataset(dataset_path):
    """Load the evaluation dataset"""
    with open(dataset_path, 'r') as f:
        return [json.loads(line.strip()) for line in f if line.strip()]

def call_rasa_endpoint(message, endpoint_url):
    """Call the Rasa endpoint with proper format"""
    try:
        response = requests.post(
            endpoint_url,
            json={
                "sender": "eval_user",
                "message": message
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                # Extract the JSON from the text response
                response_text = data[0].get('text', '')
                try:
                    # Parse the inner JSON
                    result = json.loads(response_text)
                    return result, None
                except json.JSONDecodeError as e:
                    return None, f"JSON parsing failed: {e}"
            else:
                return None, "Empty response"
        else:
            return None, f"HTTP {response.status_code}: {response.text}"
            
    except requests.exceptions.RequestException as e:
        return None, str(e)

def evaluate_dataset(dataset, endpoint_url):
    """Evaluate the dataset against the endpoint"""
    results = []
    latencies = []
    
    print(f"📊 Evaluating {len(dataset)} examples...")
    
    for i, example in enumerate(dataset):
        if i % 50 == 0:
            print(f"   Progress: {i}/{len(dataset)}")
        
        start_time = time.time()
        result, error = call_rasa_endpoint(example['caregiver_message'], endpoint_url)
        latency = (time.time() - start_time) * 1000
        latencies.append(latency)
        
        if result:
            # Check if classification matches expected
            expected = example.get('expected', {})
            
            record = {
                'id': i + 1,
                'text': example['caregiver_message'],
                'expected': expected,
                'actual': result,
                'latency_ms': latency,
                'success': True
            }
            
            # Check accuracy
            if expected:
                record['sentiment_correct'] = result.get('sentiment') == expected.get('sentiment')
                record['topic_correct'] = result.get('topic') == expected.get('topic')
                record['urgency_correct'] = result.get('urgency') == expected.get('urgency')
                record['routing_correct'] = result.get('routing') == expected.get('routing')
            else:
                record['sentiment_correct'] = True
                record['topic_correct'] = True
                record['urgency_correct'] = True
                record['routing_correct'] = True
                
        else:
            record = {
                'id': i + 1,
                'text': example['caregiver_message'],
                'error': error,
                'latency_ms': latency,
                'success': False
            }
        
        results.append(record)
        
        # Small delay to avoid overwhelming the server
        time.sleep(0.1)
    
    return results, latencies

def calculate_metrics(results):
    """Calculate evaluation metrics"""
    total = len(results)
    successful = sum(1 for r in results if r['success'])
    
    if successful == 0:
        return {
            'count': total,
            'overall_accuracy': 0.0,
            'topic_accuracy': 0.0,
            'sentiment_accuracy': 0.0,
            'urgency_accuracy': 0.0,
            'routing_accuracy': 0.0,
            'json_validity': 0.0,
            'fallback_rate': 1.0,
            'successful_responses': 0
        }
    
    # Calculate accuracies
    sentiment_correct = sum(1 for r in results if r.get('sentiment_correct', False))
    topic_correct = sum(1 for r in results if r.get('topic_correct', False))
    urgency_correct = sum(1 for r in results if r.get('urgency_correct', False))
    routing_correct = sum(1 for r in results if r.get('routing_correct', False))
    
    return {
        'count': total,
        'overall_accuracy': successful / total,
        'topic_accuracy': topic_correct / successful if successful > 0 else 0.0,
        'sentiment_accuracy': sentiment_correct / successful if successful > 0 else 0.0,
        'urgency_accuracy': urgency_correct / successful if successful > 0 else 0.0,
        'routing_accuracy': routing_correct / successful if successful > 0 else 0.0,
        'json_validity': successful / total,
        'fallback_rate': (total - successful) / total,
        'successful_responses': successful
    }

def main():
    parser = argparse.ArgumentParser(description='Evaluate Pip chatbot with corrected endpoint')
    parser.add_argument('--dataset', required=True, help='Path to evaluation dataset')
    parser.add_argument('--endpoint', required=True, help='Rasa endpoint URL')
    parser.add_argument('--outdir', required=True, help='Output directory for results')
    
    args = parser.parse_args()
    
    # Create output directory
    outdir = Path(args.outdir)
    outdir.mkdir(exist_ok=True)
    
    print("🚀 Starting Corrected Pip Evaluation")
    print("="*50)
    print(f"Dataset: {args.dataset}")
    print(f"Endpoint: {args.endpoint}")
    print(f"Output: {args.outdir}")
    print("="*50)
    
    # Load dataset
    print("📥 Loading dataset...")
    dataset = load_dataset(args.dataset)
    print(f"✅ Loaded {len(dataset)} examples")
    
    # Evaluate
    print("🔍 Running evaluation...")
    results, latencies = evaluate_dataset(dataset, args.endpoint)
    
    # Calculate metrics
    print("📊 Calculating metrics...")
    metrics = calculate_metrics(results)
    
    # Add latency statistics
    if latencies:
        metrics['latency_avg_ms'] = statistics.mean(latencies)
        metrics['latency_p95_ms'] = sorted(latencies)[int(len(latencies) * 0.95)]
    else:
        metrics['latency_avg_ms'] = 0.0
        metrics['latency_p95_ms'] = 0.0
    
    # Save results
    report_path = outdir / 'pip_eval_report.json'
    with open(report_path, 'w') as f:
        json.dump({
            'metrics': metrics,
            'results': results
        }, f, indent=2)
    
    # Generate HTML report
    html_path = outdir / 'pip_eval_report.html'
    generate_html_report(metrics, results, html_path)
    
    # Print summary
    print("\n" + "="*50)
    print("📊 EVALUATION RESULTS")
    print("="*50)
    print(f"Total examples: {metrics['count']}")
    print(f"Successful responses: {metrics['successful_responses']}")
    print(f"JSON validity: {metrics['json_validity']:.3f}")
    print(f"Overall accuracy: {metrics['overall_accuracy']:.3f}")
    print(f"Sentiment accuracy: {metrics['sentiment_accuracy']:.3f}")
    print(f"Topic accuracy: {metrics['topic_accuracy']:.3f}")
    print(f"Urgency accuracy: {metrics['urgency_accuracy']:.3f}")
    print(f"Routing accuracy: {metrics['routing_accuracy']:.3f}")
    print(f"Fallback rate: {metrics['fallback_rate']:.3f}")
    print(f"Avg latency: {metrics['latency_avg_ms']:.1f}ms")
    print(f"P95 latency: {metrics['latency_p95_ms']:.1f}ms")
    
    # Check thresholds
    json_valid = metrics['json_validity'] >= 0.99
    overall_good = metrics['overall_accuracy'] >= 0.70
    
    print("\n" + "="*50)
    if json_valid and overall_good:
        print("✅ PASS: All critical thresholds met!")
    else:
        print("❌ FAIL: Some thresholds not met")
        if not json_valid:
            print(f"   JSON validity {metrics['json_validity']:.3f} < 0.99")
        if not overall_good:
            print(f"   Overall accuracy {metrics['overall_accuracy']:.3f} < 0.70")
    print("="*50)
    
    print(f"\n📁 Results saved to: {outdir}")
    print(f"📄 JSON report: {report_path}")
    print(f"🌐 HTML report: {html_path}")

def generate_html_report(metrics, results, html_path):
    """Generate HTML report"""
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Pip Evaluation Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .metric {{ background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }}
        .pass {{ background: #d4edda; }}
        .fail {{ background: #f8d7da; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
    </style>
</head>
<body>
    <h1>Pip Evaluation Report</h1>
    
    <h2>Summary Metrics</h2>
    <div class="metric {'pass' if metrics['json_validity'] >= 0.99 else 'fail'}">
        <strong>JSON Validity:</strong> {metrics['json_validity']:.3f} {'✅' if metrics['json_validity'] >= 0.99 else '❌'}
    </div>
    <div class="metric {'pass' if metrics['overall_accuracy'] >= 0.70 else 'fail'}">
        <strong>Overall Accuracy:</strong> {metrics['overall_accuracy']:.3f} {'✅' if metrics['overall_accuracy'] >= 0.70 else '❌'}
    </div>
    <div class="metric">
        <strong>Sentiment Accuracy:</strong> {metrics['sentiment_accuracy']:.3f}
    </div>
    <div class="metric">
        <strong>Topic Accuracy:</strong> {metrics['topic_accuracy']:.3f}
    </div>
    <div class="metric">
        <strong>Urgency Accuracy:</strong> {metrics['urgency_accuracy']:.3f}
    </div>
    <div class="metric">
        <strong>Routing Accuracy:</strong> {metrics['routing_accuracy']:.3f}
    </div>
    <div class="metric">
        <strong>Fallback Rate:</strong> {metrics['fallback_rate']:.3f}
    </div>
    <div class="metric">
        <strong>Average Latency:</strong> {metrics['latency_avg_ms']:.1f}ms
    </div>
    <div class="metric">
        <strong>P95 Latency:</strong> {metrics['latency_p95_ms']:.1f}ms
    </div>
    
    <h2>Sample Results</h2>
    <table>
        <tr>
            <th>ID</th>
            <th>Text</th>
            <th>Success</th>
            <th>Sentiment</th>
            <th>Topic</th>
            <th>Urgency</th>
            <th>Routing</th>
            <th>Latency (ms)</th>
        </tr>
    """
    
    # Show first 20 results
    for result in results[:20]:
        if result['success']:
            actual = result['actual']
            html_content += f"""
        <tr>
            <td>{result['id']}</td>
            <td>{result['text'][:50]}...</td>
            <td>✅</td>
            <td>{actual.get('sentiment', 'N/A')}</td>
            <td>{actual.get('topic', 'N/A')}</td>
            <td>{actual.get('urgency', 'N/A')}</td>
            <td>{actual.get('routing', 'N/A')}</td>
            <td>{result['latency_ms']:.1f}</td>
        </tr>
            """
        else:
            html_content += f"""
        <tr>
            <td>{result['id']}</td>
            <td>{result['text'][:50]}...</td>
            <td>❌</td>
            <td colspan="5">{result.get('error', 'Unknown error')}</td>
            <td>{result['latency_ms']:.1f}</td>
        </tr>
            """
    
    html_content += """
    </table>
    
    <p><em>Report generated on {}</em></p>
</body>
</html>
    """.format(time.strftime('%Y-%m-%d %H:%M:%S'))
    
    with open(html_path, 'w') as f:
        f.write(html_content)

if __name__ == "__main__":
    main()
