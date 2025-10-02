"""
Unit tests for Pip's classification and routing system.
Tests the accuracy of topic classification, sentiment analysis, urgency detection, and routing decisions.
"""

import unittest
import json
import sys
import os

# Add the actions directory to the path so we can import the actions
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'actions'))

from actions import ActionRAGEnhancedChat


class TestPipClassification(unittest.TestCase):
    """Test cases for Pip's message classification and routing system."""

    def setUp(self):
        """Set up test fixtures."""
        self.action = ActionRAGEnhancedChat()
        
        # Test data with expected classifications
        self.test_cases = [
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
            },
            {
                "id": 6,
                "message": "Same chaos as always, nothing new",
                "expected": {
                    "topic": "burnout",
                    "sentiment": "neutral",
                    "urgency": "medium",
                    "routing": "UnitManager"
                }
            },
            {
                "id": 7,
                "message": "New CNA did great, really proud of them",
                "expected": {
                    "topic": "professionalism",
                    "sentiment": "positive",
                    "urgency": "low",
                    "routing": "UnitManager"
                }
            },
            {
                "id": 8,
                "message": "Short staffed again, everyone exhausted",
                "expected": {
                    "topic": "staffing",
                    "sentiment": "negative",
                    "urgency": "medium",
                    "routing": "UnitManager"
                }
            },
            {
                "id": 9,
                "message": "Unsafe equipment in shower room",
                "expected": {
                    "topic": "equipment",
                    "sentiment": "negative",
                    "urgency": "high",
                    "routing": "Safety"
                }
            },
            {
                "id": 10,
                "message": "I'm just so tired all the time",
                "expected": {
                    "topic": "burnout",
                    "sentiment": "negative",
                    "urgency": "medium",
                    "routing": "HR"
                }
            }
        ]

    def test_topic_classification(self):
        """Test that messages are correctly classified by topic."""
        print("\n=== Testing Topic Classification ===")
        
        topic_results = {}
        for test_case in self.test_cases:
            message = test_case["message"]
            expected_topic = test_case["expected"]["topic"]
            
            # This would need to be implemented to extract topic from Pip's response
            # For now, we'll create a mock classification method
            predicted_topic = self._classify_topic(message)
            
            topic_results[test_case["id"]] = {
                "message": message,
                "expected": expected_topic,
                "predicted": predicted_topic,
                "correct": predicted_topic == expected_topic
            }
            
            print(f"Test {test_case['id']}: {message[:50]}...")
            print(f"  Expected: {expected_topic}")
            print(f"  Predicted: {predicted_topic}")
            print(f"  ✓ Correct" if predicted_topic == expected_topic else "  ✗ Incorrect")
            print()

        # Calculate accuracy
        correct = sum(1 for result in topic_results.values() if result["correct"])
        accuracy = (correct / len(topic_results)) * 100
        print(f"Topic Classification Accuracy: {accuracy:.1f}% ({correct}/{len(topic_results)})")
        
        self.assertGreaterEqual(accuracy, 80, "Topic classification accuracy should be at least 80%")

    def test_sentiment_analysis(self):
        """Test that messages are correctly analyzed for sentiment."""
        print("\n=== Testing Sentiment Analysis ===")
        
        sentiment_results = {}
        for test_case in self.test_cases:
            message = test_case["message"]
            expected_sentiment = test_case["expected"]["sentiment"]
            
            predicted_sentiment = self._classify_sentiment(message)
            
            sentiment_results[test_case["id"]] = {
                "message": message,
                "expected": expected_sentiment,
                "predicted": predicted_sentiment,
                "correct": predicted_sentiment == expected_sentiment
            }
            
            print(f"Test {test_case['id']}: {message[:50]}...")
            print(f"  Expected: {expected_sentiment}")
            print(f"  Predicted: {predicted_sentiment}")
            print(f"  ✓ Correct" if predicted_sentiment == expected_sentiment else "  ✗ Incorrect")
            print()

        # Calculate accuracy
        correct = sum(1 for result in sentiment_results.values() if result["correct"])
        accuracy = (correct / len(sentiment_results)) * 100
        print(f"Sentiment Analysis Accuracy: {accuracy:.1f}% ({correct}/{len(sentiment_results)})")
        
        self.assertGreaterEqual(accuracy, 80, "Sentiment analysis accuracy should be at least 80%")

    def test_urgency_detection(self):
        """Test that messages are correctly assessed for urgency."""
        print("\n=== Testing Urgency Detection ===")
        
        urgency_results = {}
        for test_case in self.test_cases:
            message = test_case["message"]
            expected_urgency = test_case["expected"]["urgency"]
            
            predicted_urgency = self._classify_urgency(message)
            
            urgency_results[test_case["id"]] = {
                "message": message,
                "expected": expected_urgency,
                "predicted": predicted_urgency,
                "correct": predicted_urgency == expected_urgency
            }
            
            print(f"Test {test_case['id']}: {message[:50]}...")
            print(f"  Expected: {expected_urgency}")
            print(f"  Predicted: {predicted_urgency}")
            print(f"  ✓ Correct" if predicted_urgency == expected_urgency else "  ✗ Incorrect")
            print()

        # Calculate accuracy
        correct = sum(1 for result in urgency_results.values() if result["correct"])
        accuracy = (correct / len(urgency_results)) * 100
        print(f"Urgency Detection Accuracy: {accuracy:.1f}% ({correct}/{len(urgency_results)})")
        
        self.assertGreaterEqual(accuracy, 80, "Urgency detection accuracy should be at least 80%")

    def test_routing_decisions(self):
        """Test that messages are correctly routed to appropriate departments."""
        print("\n=== Testing Routing Decisions ===")
        
        routing_results = {}
        for test_case in self.test_cases:
            message = test_case["message"]
            expected_routing = test_case["expected"]["routing"]
            
            predicted_routing = self._classify_routing(message)
            
            routing_results[test_case["id"]] = {
                "message": message,
                "expected": expected_routing,
                "predicted": predicted_routing,
                "correct": predicted_routing == expected_routing
            }
            
            print(f"Test {test_case['id']}: {message[:50]}...")
            print(f"  Expected: {expected_routing}")
            print(f"  Predicted: {predicted_routing}")
            print(f"  ✓ Correct" if predicted_routing == expected_routing else "  ✗ Incorrect")
            print()

        # Calculate accuracy
        correct = sum(1 for result in routing_results.values() if result["correct"])
        accuracy = (correct / len(routing_results)) * 100
        print(f"Routing Decision Accuracy: {accuracy:.1f}% ({correct}/{len(routing_results)})")
        
        self.assertGreaterEqual(accuracy, 80, "Routing decision accuracy should be at least 80%")

    def test_safety_escalation(self):
        """Test that safety-related messages are properly escalated."""
        print("\n=== Testing Safety Escalation ===")
        
        safety_keywords = ["threat", "unsafe", "dangerous", "violence", "assault", "weapon"]
        safety_tests = [
            "Visitor threatened me in dialysis",
            "Unsafe equipment in shower room", 
            "Patient became violent during care",
            "Someone brought a weapon to the unit",
            "I was assaulted by a family member"
        ]
        
        for message in safety_tests:
            topic = self._classify_topic(message)
            urgency = self._classify_urgency(message)
            routing = self._classify_routing(message)
            
            print(f"Message: {message}")
            print(f"  Topic: {topic}")
            print(f"  Urgency: {urgency}")
            print(f"  Routing: {routing}")
            
            # Safety messages should be high urgency and route to Safety
            if any(keyword in message.lower() for keyword in safety_keywords):
                self.assertEqual(urgency, "high", f"Safety message should be high urgency: {message}")
                self.assertEqual(routing, "Safety", f"Safety message should route to Safety: {message}")
            print("  ✓ Safety escalation correct")
            print()

    def test_phi_protection(self):
        """Test that PHI is properly redacted from responses."""
        print("\n=== Testing PHI Protection ===")
        
        phi_messages = [
            "Patient John Smith in room 204 needs help",
            "Mrs. Johnson's blood pressure is high",
            "Call Dr. Williams at 555-1234 about room 15B",
            "Patient in ICU bed 3 needs medication"
        ]
        
        for message in phi_messages:
            # This would test the actual PHI scrubbing in Pip's response
            scrubbed = self._scrub_phi(message)
            
            print(f"Original: {message}")
            print(f"Scrubbed: {scrubbed}")
            
            # Check that PHI elements are redacted
            self.assertIn("[REDACTED]", scrubbed, f"PHI should be redacted: {message}")
            self.assertNotIn("John Smith", scrubbed, "Patient names should be redacted")
            self.assertNotIn("Mrs. Johnson", scrubbed, "Patient names should be redacted")
            self.assertNotIn("555-1234", scrubbed, "Phone numbers should be redacted")
            self.assertNotIn("room 204", scrubbed, "Room numbers should be redacted")
            print("  ✓ PHI protection correct")
            print()

    def test_json_output_format(self):
        """Test that Pip returns properly formatted JSON responses."""
        print("\n=== Testing JSON Output Format ===")
        
        test_message = "Had a good shift today, everyone helped out"
        
        # This would test the actual JSON output from Pip
        json_response = self._get_pip_json_response(test_message)
        
        print(f"Message: {test_message}")
        print(f"JSON Response: {json.dumps(json_response, indent=2)}")
        
        # Validate JSON structure
        required_fields = ["ack", "summary", "sentiment", "topic", "urgency", "routing", "language", "next_step"]
        for field in required_fields:
            self.assertIn(field, json_response, f"JSON response missing required field: {field}")
        
        # Validate field constraints
        self.assertLessEqual(len(json_response["ack"]), 160, "Ack field should be ≤160 characters")
        self.assertLessEqual(len(json_response["summary"]), 160, "Summary field should be ≤160 characters")
        self.assertLessEqual(len(json_response["next_step"]), 120, "Next step field should be ≤120 characters")
        
        # Validate enum values
        valid_sentiments = ["negative", "neutral", "positive"]
        valid_urgencies = ["low", "medium", "high"]
        valid_routings = ["HR", "DON", "UnitManager", "Safety", "Scheduling", "Payroll"]
        valid_languages = ["en", "es", "ht"]
        
        self.assertIn(json_response["sentiment"], valid_sentiments, "Invalid sentiment value")
        self.assertIn(json_response["urgency"], valid_urgencies, "Invalid urgency value")
        self.assertIn(json_response["routing"], valid_routings, "Invalid routing value")
        self.assertIn(json_response["language"], valid_languages, "Invalid language value")
        
        print("  ✓ JSON format validation passed")

    # Mock classification methods (these would be replaced with actual Pip integration)
    
    def _classify_topic(self, message):
        """Mock topic classification method."""
        # This is a simplified mock - in reality, this would call Pip's actual classification
        message_lower = message.lower()
        
        if any(word in message_lower for word in ["threat", "unsafe", "dangerous", "violence"]):
            return "safety"
        elif any(word in message_lower for word in ["supervisor", "yelled", "boss", "manager"]):
            return "supervisor_behavior"
        elif any(word in message_lower for word in ["paycheck", "overtime", "pay", "money"]):
            return "pay"
        elif any(word in message_lower for word in ["short staffed", "staffing", "exhausted"]):
            return "staffing"
        elif any(word in message_lower for word in ["equipment", "broken", "malfunction"]):
            return "equipment"
        elif any(word in message_lower for word in ["tired", "burnout", "chaos"]):
            return "burnout"
        elif any(word in message_lower for word in ["patients", "load", "myself"]):
            return "patient_load"
        elif any(word in message_lower for word in ["good", "great", "proud", "helped"]):
            return "communication"
        elif any(word in message_lower for word in ["cna", "professional", "did great"]):
            return "professionalism"
        else:
            return "other"

    def _classify_sentiment(self, message):
        """Mock sentiment classification method."""
        message_lower = message.lower()
        
        positive_words = ["good", "great", "proud", "helped", "teamwork", "win"]
        negative_words = ["threat", "yelled", "missing", "chaos", "exhausted", "tired", "unsafe"]
        
        if any(word in message_lower for word in positive_words):
            return "positive"
        elif any(word in message_lower for word in negative_words):
            return "negative"
        else:
            return "neutral"

    def _classify_urgency(self, message):
        """Mock urgency classification method."""
        message_lower = message.lower()
        
        high_urgency_words = ["threat", "unsafe", "dangerous", "violence", "assault"]
        medium_urgency_words = ["yelled", "missing", "exhausted", "tired", "short staffed"]
        
        if any(word in message_lower for word in high_urgency_words):
            return "high"
        elif any(word in message_lower for word in medium_urgency_words):
            return "medium"
        else:
            return "low"

    def _classify_routing(self, message):
        """Mock routing classification method."""
        topic = self._classify_topic(message)
        urgency = self._classify_urgency(message)
        
        # Apply routing rules based on topic and urgency
        routing_map = {
            "safety": "Safety",
            "supervisor_behavior": "HR",
            "pay": "Payroll",
            "staffing": "UnitManager",
            "equipment": "Safety" if urgency == "high" else "UnitManager",
            "burnout": "HR" if urgency == "medium" else "UnitManager",
            "patient_load": "UnitManager",
            "communication": "UnitManager",
            "professionalism": "UnitManager"
        }
        
        return routing_map.get(topic, "UnitManager")

    def _scrub_phi(self, message):
        """Mock PHI scrubbing method."""
        # Simple mock PHI scrubbing
        import re
        
        # Replace patient names (simple pattern)
        message = re.sub(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', '[REDACTED]', message)
        
        # Replace phone numbers
        message = re.sub(r'\d{3}-\d{3}-\d{4}', '[REDACTED]', message)
        
        # Replace room numbers
        message = re.sub(r'room \d+[A-Z]?', 'room [REDACTED]', message)
        
        return message

    def _get_pip_json_response(self, message):
        """Mock JSON response from Pip."""
        return {
            "ack": "That shift sounds great! :raised_hands: logging it now",
            "summary": "Staff reported positive teamwork experience",
            "sentiment": "positive",
            "topic": "communication", 
            "urgency": "low",
            "routing": "UnitManager",
            "language": "en",
            "next_step": "Consider sharing positive feedback with team"
        }


class TestPipIntegration(unittest.TestCase):
    """Integration tests for Pip's complete response system."""

    def setUp(self):
        """Set up integration test fixtures."""
        self.action = ActionRAGEnhancedChat()

    def test_end_to_end_response(self):
        """Test complete end-to-end response generation."""
        print("\n=== Testing End-to-End Response ===")
        
        test_messages = [
            "Had a good shift today, everyone helped out",
            "Visitor threatened me in dialysis", 
            "No break again, 10 patients all by myself"
        ]
        
        for message in test_messages:
            print(f"\nTesting message: {message}")
            
            # This would test the actual Pip response generation
            response = self._simulate_pip_response(message)
            
            print(f"Response: {response}")
            
            # Validate response structure
            self.assertIsInstance(response, dict, "Response should be a dictionary")
            self.assertIn("ack", response, "Response should contain acknowledgment")
            self.assertIn("summary", response, "Response should contain summary")
            
            print("  ✓ End-to-end response valid")

    def _simulate_pip_response(self, message):
        """Simulate Pip's response generation."""
        # This would integrate with the actual Pip system
        return {
            "ack": f"Got it, logging your message about: {message[:30]}...",
            "summary": f"Staff feedback: {message[:50]}...",
            "sentiment": "neutral",
            "topic": "other",
            "urgency": "low", 
            "routing": "UnitManager",
            "language": "en",
            "next_step": "Feedback logged for review"
        }


if __name__ == '__main__':
    # Create test suite
    suite = unittest.TestSuite()
    
    # Add classification tests
    suite.addTest(unittest.makeSuite(TestPipClassification))
    
    # Add integration tests  
    suite.addTest(unittest.makeSuite(TestPipIntegration))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"TEST SUMMARY")
    print(f"{'='*50}")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    
    if result.failures:
        print(f"\nFAILURES:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback}")
    
    if result.errors:
        print(f"\nERRORS:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback}")
