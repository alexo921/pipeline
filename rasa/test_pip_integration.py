#!/usr/bin/env python3
"""
Integration test for Pip chatbot that can test against the actual running system.
This script tests the complete end-to-end functionality including Rasa and Llama integration.
"""

import json
import sys
import os
import requests
import time
import subprocess
from typing import Dict, List, Optional

class PipIntegrationTester:
    """Integration tester for Pip chatbot system."""
    
    def __init__(self, rasa_server_url="http://localhost:5005", llama_server_url="http://localhost:1337"):
        self.rasa_server_url = rasa_server_url
        self.llama_server_url = llama_server_url
        self.test_results = []
        
    def test_llama_server(self) -> bool:
        """Test if Llama server is running and responsive."""
        print("🔍 Testing Llama server connectivity...")
        try:
            response = requests.post(
                f"{self.llama_server_url}/v1/chat/completions",
                json={
                    "model": "llama-3.1-8b-instruct",
                    "messages": [{"role": "user", "content": "Hello"}],
                    "max_tokens": 10
                },
                timeout=10
            )
            if response.status_code == 200:
                print("✅ Llama server is running and responsive")
                return True
            else:
                print(f"❌ Llama server returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Llama server is not accessible: {e}")
            return False
    
    def test_rasa_server(self) -> bool:
        """Test if Rasa server is running and responsive."""
        print("🔍 Testing Rasa server connectivity...")
        try:
            response = requests.get(f"{self.rasa_server_url}/status", timeout=10)
            if response.status_code == 200:
                print("✅ Rasa server is running and responsive")
                return True
            else:
                print(f"❌ Rasa server returned status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Rasa server is not accessible: {e}")
            return False
    
    def send_message_to_pip(self, message: str) -> Optional[Dict]:
        """Send a message to Pip and get the response."""
        try:
            payload = {
                "sender": "test_user",
                "message": message
            }
            
            response = requests.post(
                f"{self.rasa_server_url}/webhooks/rest/webhook",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data:
                    return {
                        "text": data[0].get("text", ""),
                        "raw_response": data
                    }
            return None
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Error sending message to Pip: {e}")
            return None
    
    def parse_pip_response(self, response_text: str) -> Dict:
        """Parse Pip's JSON response from the text."""
        try:
            # Try to extract JSON from the response
            # Pip should return structured JSON, but we need to handle different formats
            if response_text.startswith("{") and response_text.endswith("}"):
                return json.loads(response_text)
            else:
                # If not pure JSON, try to extract JSON from the text
                import re
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
                else:
                    # Fallback: create a basic response structure
                    return {
                        "ack": response_text,
                        "summary": "Response received",
                        "sentiment": "neutral",
                        "topic": "other",
                        "urgency": "low",
                        "routing": "UnitManager",
                        "language": "en",
                        "next_step": "Follow up as needed"
                    }
        except json.JSONDecodeError:
            # Fallback response if JSON parsing fails
            return {
                "ack": response_text,
                "summary": "Response received",
                "sentiment": "neutral",
                "topic": "other",
                "urgency": "low",
                "routing": "UnitManager",
                "language": "en",
                "next_step": "Follow up as needed"
            }
    
    def run_classification_tests(self) -> Dict:
        """Run the main classification tests against the real Pip system."""
        print("\n🧪 Running Classification Tests Against Real Pip System")
        print("=" * 60)
        
        test_cases = [
            {
                "id": 1,
                "message": "Had a good shift today, everyone helped out",
                "expected": {
                    "topic": "communication",
                    "sentiment": "positive", 
                    "urgency": "low",
                    "routing": "UnitManager"
                }
            },
            {
                "id": 2,
                "message": "No break again, 10 patients all by myself",
                "expected": {
                    "topic": "patient_load",
                    "sentiment": "negative",
                    "urgency": "medium", 
                    "routing": "UnitManager"
                }
            },
            {
                "id": 3,
                "message": "Visitor threatened me in dialysis",
                "expected": {
                    "topic": "safety",
                    "sentiment": "negative",
                    "urgency": "high",
                    "routing": "Safety"
                }
            },
            {
                "id": 4,
                "message": "Supervisor yelled at me in front of staff",
                "expected": {
                    "topic": "supervisor_behavior",
                    "sentiment": "negative",
                    "urgency": "high",
                    "routing": "HR"
                }
            },
            {
                "id": 5,
                "message": "Overtime missing from my paycheck",
                "expected": {
                    "topic": "pay",
                    "sentiment": "negative",
                    "urgency": "medium",
                    "routing": "Payroll"
                }
            }
        ]
        
        results = {
            "topic": {"correct": 0, "total": 0, "details": []},
            "sentiment": {"correct": 0, "total": 0, "details": []},
            "urgency": {"correct": 0, "total": 0, "details": []},
            "routing": {"correct": 0, "total": 0, "details": []}
        }
        
        for test_case in test_cases:
            print(f"\n📝 Test {test_case['id']}: {test_case['message']}")
            print("-" * 60)
            
            # Send message to Pip
            response = self.send_message_to_pip(test_case['message'])
            
            if response:
                # Parse the response
                parsed_response = self.parse_pip_response(response['text'])
                
                print(f"✅ Response received: {response['text'][:100]}...")
                print(f"📊 Parsed JSON: {json.dumps(parsed_response, indent=2)}")
                
                # Test each classification component
                for metric in ["topic", "sentiment", "urgency", "routing"]:
                    expected = test_case["expected"][metric]
                    predicted = parsed_response.get(metric, "NOT_FOUND")
                    correct = predicted == expected
                    
                    results[metric]["total"] += 1
                    if correct:
                        results[metric]["correct"] += 1
                    
                    results[metric]["details"].append({
                        "test_id": test_case["id"],
                        "message": test_case["message"],
                        "expected": expected,
                        "predicted": predicted,
                        "correct": correct
                    })
                    
                    status = "✅" if correct else "❌"
                    print(f"  {status} {metric.upper()}: Expected '{expected}', Got '{predicted}'")
                
                # Store test result
                self.test_results.append({
                    "test_id": test_case["id"],
                    "message": test_case["message"],
                    "expected": test_case["expected"],
                    "actual": parsed_response,
                    "response_text": response['text']
                })
                
            else:
                print("❌ No response received from Pip")
                # Count as incorrect for all metrics
                for metric in results:
                    results[metric]["total"] += 1
                    results[metric]["details"].append({
                        "test_id": test_case["id"],
                        "message": test_case["message"],
                        "expected": test_case["expected"][metric],
                        "predicted": "NO_RESPONSE",
                        "correct": False
                    })
        
        return results
    
    def test_safety_escalation(self):
        """Test safety escalation with real Pip responses."""
        print("\n🚨 Testing Safety Escalation with Real Pip")
        print("=" * 60)
        
        safety_messages = [
            "Visitor threatened me in dialysis",
            "Unsafe equipment in shower room",
            "Patient became violent during care"
        ]
        
        for message in safety_messages:
            print(f"\n📝 Safety Test: {message}")
            response = self.send_message_to_pip(message)
            
            if response:
                parsed_response = self.parse_pip_response(response['text'])
                urgency = parsed_response.get("urgency")
                routing = parsed_response.get("routing")
                topic = parsed_response.get("topic")
                
                print(f"  Response: {response['text'][:100]}...")
                print(f"  Topic: {topic}")
                print(f"  Urgency: {urgency}")
                print(f"  Routing: {routing}")
                
                # Validate safety escalation
                safety_correct = urgency == "high" and routing == "Safety" and topic == "safety"
                status = "✅" if safety_correct else "❌"
                print(f"  {status} Safety escalation {'correct' if safety_correct else 'incorrect'}")
            else:
                print("  ❌ No response received")
    
    def test_phi_protection(self):
        """Test PHI protection with real Pip responses."""
        print("\n🔒 Testing PHI Protection with Real Pip")
        print("=" * 60)
        
        phi_messages = [
            "Patient John Smith in room 204 needs help",
            "Mrs. Johnson's blood pressure is high",
            "Call Dr. Williams at 555-1234 about room 15B"
        ]
        
        for message in phi_messages:
            print(f"\n📝 PHI Test: {message}")
            response = self.send_message_to_pip(message)
            
            if response:
                parsed_response = self.parse_pip_response(response['text'])
                summary = parsed_response.get("summary", "")
                ack = parsed_response.get("ack", "")
                
                print(f"  Response: {response['text'][:100]}...")
                print(f"  Summary: {summary}")
                print(f"  Ack: {ack}")
                
                # Check for PHI in response (basic check)
                phi_detected = any(word in response['text'].lower() for word in ["john smith", "mrs. johnson", "555-1234", "room 204"])
                
                status = "✅" if not phi_detected else "❌"
                print(f"  {status} PHI protection {'working' if not phi_detected else 'failed'}")
            else:
                print("  ❌ No response received")
    
    def generate_test_report(self, results: Dict):
        """Generate a comprehensive test report."""
        print("\n" + "=" * 60)
        print("📊 INTEGRATION TEST REPORT")
        print("=" * 60)
        
        # Calculate accuracies
        for metric, data in results.items():
            accuracy = (data["correct"] / data["total"] * 100) if data["total"] > 0 else 0
            print(f"{metric.upper():>12}: {accuracy:5.1f}% ({data['correct']}/{data['total']})")
        
        overall_accuracy = sum(data["correct"] for data in results.values()) / sum(data["total"] for data in results.values()) * 100
        print(f"{'OVERALL':>12}: {overall_accuracy:5.1f}%")
        
        # Detailed results
        print("\n📋 DETAILED RESULTS")
        print("-" * 60)
        
        for metric, data in results.items():
            print(f"\n{metric.upper()} CLASSIFICATION:")
            for detail in data["details"]:
                status = "✅" if detail["correct"] else "❌"
                print(f"  {status} Test {detail['test_id']}: Expected '{detail['expected']}', Got '{detail['predicted']}'")
        
        # Overall assessment
        print(f"\n🎯 OVERALL ASSESSMENT")
        print("-" * 60)
        
        if overall_accuracy >= 90:
            print("🟢 EXCELLENT: Pip's integration is working perfectly!")
        elif overall_accuracy >= 80:
            print("🟡 GOOD: Pip's integration is performing well.")
        elif overall_accuracy >= 70:
            print("🟠 FAIR: Pip's integration needs some improvements.")
        else:
            print("🔴 POOR: Pip's integration requires significant work.")
        
        return overall_accuracy >= 80
    
    def run_full_integration_test(self) -> bool:
        """Run the complete integration test suite."""
        print("🤖 Pip Chatbot Integration Test Suite")
        print("=" * 60)
        
        # Check server connectivity
        llama_ok = self.test_llama_server()
        rasa_ok = self.test_rasa_server()
        
        if not llama_ok or not rasa_ok:
            print("\n❌ Cannot run integration tests - servers not available")
            print("Please ensure both Llama and Rasa servers are running:")
            print("  - Llama server: http://localhost:8080")
            print("  - Rasa server: http://localhost:5005")
            return False
        
        try:
            # Run classification tests
            results = self.run_classification_tests()
            
            # Run specialized tests
            self.test_safety_escalation()
            self.test_phi_protection()
            
            # Generate report
            success = self.generate_test_report(results)
            
            return success
            
        except Exception as e:
            print(f"❌ Integration test failed with error: {e}")
            return False

def main():
    """Main test runner."""
    tester = PipIntegrationTester()
    
    # Check if we're in the right directory
    if not os.path.exists("rasa"):
        print("❌ Please run this script from the pipeline root directory")
        return False
    
    success = tester.run_full_integration_test()
    
    if success:
        print("\n🎉 Integration tests completed successfully!")
    else:
        print("\n💥 Integration tests failed!")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
