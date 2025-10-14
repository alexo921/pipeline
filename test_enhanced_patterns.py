#!/usr/bin/env python3
"""
Test the enhanced patterns with the correct Rasa endpoint
"""

import requests
import json
import time

def test_enhanced_patterns():
    """Test the enhanced patterns with sample messages"""
    
    # Test messages covering different scenarios
    test_messages = [
        "No break again, 10 patients alone on 3 West",
        "The new scheduling system is working great!",
        "Manager yelled at me in front of patients",
        "Need clarification on the new policy",
        "Equipment is broken and patients are waiting",
        "Great teamwork today, everyone helped out",
        "Short staffed again, this is unsafe",
        "Payroll mistake on my last check",
        "I'm exhausted from back-to-back doubles this week",
        "The new charting flow adds extra clicks; this isn't about pay, it's the EHR process itself."
    ]
    
    endpoint = "http://localhost:5005/webhooks/rest/webhook"
    
    print("🚀 Testing Enhanced Healthcare Classification Patterns")
    print("="*60)
    
    results = []
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n[{i}/{len(test_messages)}] Testing: {message}")
        print("-" * 50)
        
        try:
            # Send request to Rasa
            response = requests.post(
                endpoint,
                json={
                    "sender": f"test_user_{i}",
                    "message": message
                },
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    # Extract the JSON from the text response
                    response_text = data[0].get('text', '')
                    
                    try:
                        # Parse the JSON response
                        result = json.loads(response_text)
                        
                        print(f"✅ Response: {json.dumps(result, indent=2)}")
                        
                        # Analyze the classification
                        sentiment = result.get('sentiment', 'unknown')
                        topic = result.get('topic', 'unknown')
                        urgency = result.get('urgency', 'unknown')
                        routing = result.get('routing', 'unknown')
                        
                        print(f"📊 Classification:")
                        print(f"   Sentiment: {sentiment}")
                        print(f"   Topic: {topic}")
                        print(f"   Urgency: {urgency}")
                        print(f"   Routing: {routing}")
                        
                        results.append({
                            'message': message,
                            'classification': result,
                            'success': True
                        })
                        
                    except json.JSONDecodeError as e:
                        print(f"❌ JSON parsing failed: {e}")
                        print(f"   Raw response: {response_text}")
                        results.append({
                            'message': message,
                            'error': f"JSON parsing failed: {e}",
                            'success': False
                        })
                else:
                    print("❌ Empty response from server")
                    results.append({
                        'message': message,
                        'error': 'Empty response',
                        'success': False
                    })
            else:
                print(f"❌ HTTP {response.status_code}: {response.text}")
                results.append({
                    'message': message,
                    'error': f"HTTP {response.status_code}",
                    'success': False
                })
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
            results.append({
                'message': message,
                'error': str(e),
                'success': False
            })
        
        time.sleep(0.5)  # Small delay between requests
    
    # Summary
    print("\n" + "="*60)
    print("📊 TESTING SUMMARY")
    print("="*60)
    
    successful = sum(1 for r in results if r['success'])
    total = len(results)
    
    print(f"✅ Successful classifications: {successful}/{total}")
    print(f"❌ Failed classifications: {total - successful}/{total}")
    
    if successful > 0:
        print(f"\n🎯 Success rate: {successful/total*100:.1f}%")
        
        # Analyze sentiment distribution
        sentiments = [r['classification']['sentiment'] for r in results if r['success']]
        sentiment_counts = {}
        for s in sentiments:
            sentiment_counts[s] = sentiment_counts.get(s, 0) + 1
        
        print(f"\n📈 Sentiment distribution:")
        for sentiment, count in sentiment_counts.items():
            print(f"   {sentiment}: {count} ({count/len(sentiments)*100:.1f}%)")
        
        # Analyze topic distribution
        topics = [r['classification']['topic'] for r in results if r['success']]
        topic_counts = {}
        for t in topics:
            topic_counts[t] = topic_counts.get(t, 0) + 1
        
        print(f"\n📈 Topic distribution:")
        for topic, count in topic_counts.items():
            print(f"   {topic}: {count} ({count/len(topics)*100:.1f}%)")
    
    # Show failures
    failures = [r for r in results if not r['success']]
    if failures:
        print(f"\n❌ Failures:")
        for failure in failures:
            print(f"   '{failure['message'][:50]}...' - {failure['error']}")
    
    print("\n" + "="*60)
    if successful == total:
        print("🎉 ALL TESTS PASSED! Enhanced patterns are working correctly.")
    elif successful > total * 0.8:
        print("✅ MOSTLY WORKING! Enhanced patterns are largely functional.")
    else:
        print("⚠️  SOME ISSUES DETECTED. Check the failures above.")
    print("="*60)

if __name__ == "__main__":
    test_enhanced_patterns()
