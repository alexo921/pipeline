#!/usr/bin/env python3
"""
Comprehensive Pip Testing Framework
- Runs unit tests for regex clamps and classification logic
- Runs integration tests against the live Pip chatbot
- Runs evaluation suite with 151 test cases
- Generates comprehensive reports
"""

import subprocess
import sys
import os
import json
import time
from pathlib import Path

def run_command(cmd, description):
    """Run a command and return success status."""
    print(f"\n🔄 {description}")
    print(f"   Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if result.returncode == 0:
            print(f"✅ {description} - PASSED")
            return True
        else:
            print(f"❌ {description} - FAILED")
            print(f"   Error: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} - TIMEOUT")
        return False
    except Exception as e:
        print(f"💥 {description} - ERROR: {e}")
        return False

def check_service_health():
    """Check if required services are running."""
    print("\n🏥 Checking Service Health")
    print("=" * 30)
    
    services = {
        "Pip Chatbot": "http://localhost:5005/status",
        "ChromaDB": "http://localhost:8000/api/v1/heartbeat",
        "PostgreSQL": "localhost:5432"
    }
    
    healthy = True
    for name, endpoint in services.items():
        if "localhost" in endpoint and ":" in endpoint:
            # Simple port check
            import socket
            host, port = endpoint.split(":")
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(2)
                result = sock.connect_ex((host, int(port)))
                sock.close()
                if result == 0:
                    print(f"✅ {name} - Running")
                else:
                    print(f"❌ {name} - Not responding")
                    healthy = False
            except:
                print(f"❌ {name} - Connection failed")
                healthy = False
        else:
            # HTTP check
            try:
                import requests
                resp = requests.get(endpoint, timeout=2)
                if resp.status_code == 200:
                    print(f"✅ {name} - Running")
                else:
                    print(f"❌ {name} - HTTP {resp.status_code}")
                    healthy = False
            except:
                print(f"❌ {name} - Not responding")
                healthy = False
    
    return healthy

def run_unit_tests():
    """Run unit tests for Pip components."""
    print("\n🧪 Running Unit Tests")
    print("=" * 25)
    
    tests = [
        (["python3", "-m", "pytest", "rasa/tests/test_pip_classification.py", "-v"], 
         "Pip Classification Unit Tests"),
        (["python3", "test_pip_system.py", "mock"], 
         "Pip System Mock Tests"),
    ]
    
    passed = 0
    total = len(tests)
    
    for cmd, desc in tests:
        if run_command(cmd, desc):
            passed += 1
    
    return passed, total

def run_integration_tests():
    """Run integration tests against live Pip chatbot."""
    print("\n🔗 Running Integration Tests")
    print("=" * 30)
    
    # Test basic connectivity
    tests = [
        (["curl", "-f", "http://localhost:5005/status"], 
         "Pip Chatbot Health Check"),
        (["python3", "test_pip_system.py", "integration"], 
         "Pip Integration Tests"),
    ]
    
    passed = 0
    total = len(tests)
    
    for cmd, desc in tests:
        if run_command(cmd, desc):
            passed += 1
    
    return passed, total

def run_evaluation_suite():
    """Run the comprehensive evaluation suite."""
    print("\n📊 Running Evaluation Suite")
    print("=" * 30)
    
    # Run the evaluation
    if run_command(["./run_pip_eval.sh"], "Comprehensive Evaluation Suite"):
        # Parse and display results
        try:
            with open("./eval_output/pip_eval_report.json", "r") as f:
                data = json.load(f)
            
            print(f"\n📈 Evaluation Results:")
            print(f"   Overall Accuracy: {data['overall_accuracy']:.1%}")
            print(f"   Topic Accuracy: {data['topic_accuracy']:.1%}")
            print(f"   Safety Recall: {data['safety_recall']:.1%}")
            print(f"   JSON Validity: {data['json_validity']:.1%}")
            print(f"   PHI Scrub Fail: {data['phi_scrub_fail_rate']:.1%}")
            
            # Check if evaluation passed critical thresholds
            if (data['json_validity'] >= 0.99 and 
                data['safety_recall'] >= 1.0 and 
                data['phi_scrub_fail_rate'] <= 0.05):
                return True
            else:
                print("❌ Evaluation failed critical thresholds")
                return False
                
        except Exception as e:
            print(f"❌ Failed to parse evaluation results: {e}")
            return False
    else:
        return False

def generate_summary_report(unit_passed, unit_total, integration_passed, integration_total, eval_passed):
    """Generate a comprehensive summary report."""
    print("\n📋 COMPREHENSIVE TEST SUMMARY")
    print("=" * 50)
    
    print(f"🏥 Service Health: {'✅ HEALTHY' if check_service_health() else '❌ ISSUES'}")
    print(f"🧪 Unit Tests: {unit_passed}/{unit_total} passed")
    print(f"🔗 Integration Tests: {integration_passed}/{integration_total} passed")
    print(f"📊 Evaluation Suite: {'✅ PASSED' if eval_passed else '❌ FAILED'}")
    
    overall_passed = (unit_passed == unit_total and 
                     integration_passed == integration_total and 
                     eval_passed)
    
    print(f"\n🎯 OVERALL RESULT: {'✅ ALL TESTS PASSED' if overall_passed else '❌ SOME TESTS FAILED'}")
    
    if overall_passed:
        print("\n🚀 Pip is ready for production deployment!")
    else:
        print("\n⚠️  Please address failing tests before deployment.")
    
    return overall_passed

def main():
    """Main test runner."""
    print("🤖 Pip Comprehensive Testing Framework")
    print("=====================================")
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Change to project directory
    os.chdir(Path(__file__).parent)
    
    # Run all test suites
    unit_passed, unit_total = run_unit_tests()
    integration_passed, integration_total = run_integration_tests()
    eval_passed = run_evaluation_suite()
    
    # Generate summary
    overall_passed = generate_summary_report(
        unit_passed, unit_total, 
        integration_passed, integration_total, 
        eval_passed
    )
    
    # Exit with appropriate code
    sys.exit(0 if overall_passed else 1)

if __name__ == "__main__":
    main()
