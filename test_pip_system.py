#!/usr/bin/env python3
"""
Simple test runner for Pip chatbot system validation.
This script can test both mock responses and real system integration.
"""

import sys
import os
import argparse

def run_mock_tests():
    """Run tests with mock responses."""
    print("🧪 Running Mock Response Tests")
    print("=" * 50)
    
    # Import and run the mock test
    sys.path.append(os.path.join(os.path.dirname(__file__), 'rasa'))
    from test_pip_responses import main as run_mock_main
    
    return run_mock_main()

def run_integration_tests():
    """Run tests against the real Pip system."""
    print("🔗 Running Integration Tests")
    print("=" * 50)
    
    # Import and run the integration test
    sys.path.append(os.path.join(os.path.dirname(__file__), 'rasa'))
    from test_pip_integration import PipIntegrationTester
    
    tester = PipIntegrationTester()
    return tester.run_full_integration_test()

def run_unit_tests():
    """Run unit tests using unittest framework."""
    print("📋 Running Unit Tests")
    print("=" * 50)
    
    import unittest
    
    # Import test modules
    sys.path.append(os.path.join(os.path.dirname(__file__), 'rasa', 'tests'))
    from test_pip_classification import TestPipClassification, TestPipIntegration
    
    # Create test suite
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(TestPipClassification))
    suite.addTest(unittest.makeSuite(TestPipIntegration))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Return success if no failures or errors
    return len(result.failures) == 0 and len(result.errors) == 0

def main():
    """Main test runner with command line options."""
    parser = argparse.ArgumentParser(description='Test Pip chatbot system')
    parser.add_argument('--type', choices=['mock', 'integration', 'unit', 'all'], 
                       default='mock', help='Type of tests to run')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Verbose output')
    
    args = parser.parse_args()
    
    print("🤖 Pip Chatbot Test Suite")
    print("=" * 60)
    
    success = True
    
    if args.type in ['mock', 'all']:
        print("\n1️⃣ Running Mock Tests")
        success &= run_mock_tests()
    
    if args.type in ['unit', 'all']:
        print("\n2️⃣ Running Unit Tests")
        success &= run_unit_tests()
    
    if args.type in ['integration', 'all']:
        print("\n3️⃣ Running Integration Tests")
        success &= run_integration_tests()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 All tests completed successfully!")
    else:
        print("💥 Some tests failed!")
    print("=" * 60)
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
