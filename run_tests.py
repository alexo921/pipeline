#!/usr/bin/env python3
"""
Test runner for hiring optimization two-tower model.
"""

import unittest
import sys
import os
import time
import argparse

def run_all_tests(verbose=False, pattern=None):
    """Run all tests in the tests directory."""
    # Add tests directory to path
    tests_dir = os.path.join(os.path.dirname(__file__), 'tests')
    sys.path.insert(0, tests_dir)
    
    # Discover and run tests
    loader = unittest.TestLoader()
    
    if pattern:
        loader.testNamePatterns = [pattern]
    
    # Find all test files
    test_suite = loader.discover(
        start_dir=tests_dir,
        pattern='test_*.py',
        top_level_dir=os.path.dirname(__file__)
    )
    
    # Run tests
    runner = unittest.TextTestRunner(
        verbosity=2 if verbose else 1,
        stream=sys.stdout
    )
    
    print("🧪 Running Hiring Optimization Model Tests")
    print("=" * 50)
    
    start_time = time.time()
    result = runner.run(test_suite)
    end_time = time.time()
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary")
    print("=" * 50)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    print(f"Total time: {end_time - start_time:.2f}s")
    
    if result.failures:
        print("\n❌ Failures:")
        for test, traceback in result.failures:
            print(f"  {test}: {traceback.split('AssertionError:')[-1].strip()}")
    
    if result.errors:
        print("\n💥 Errors:")
        for test, traceback in result.errors:
            print(f"  {test}: {traceback.split('Exception:')[-1].strip()}")
    
    # Return success/failure
    return len(result.failures) + len(result.errors) == 0

def run_specific_test(test_name, verbose=False):
    """Run a specific test class or method."""
    tests_dir = os.path.join(os.path.dirname(__file__), 'tests')
    sys.path.insert(0, tests_dir)
    
    # Import test modules
    from tests.test_hiring_model import TestHiringModel, TestHiringMatchingLoss
    from tests.test_training_pipeline import TestTrainingPipeline
    from tests.test_performance import TestPerformance
    
    # Create test suite
    loader = unittest.TestLoader()
    
    if test_name == 'model':
        suite = loader.loadTestsFromTestCase(TestHiringModel)
        suite.addTests(loader.loadTestsFromTestCase(TestHiringMatchingLoss))
    elif test_name == 'training':
        suite = loader.loadTestsFromTestCase(TestTrainingPipeline)
    elif test_name == 'performance':
        suite = loader.loadTestsFromTestCase(TestPerformance)
    else:
        print(f"❌ Unknown test category: {test_name}")
        print("Available categories: model, training, performance")
        return False
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2 if verbose else 1)
    result = runner.run(suite)
    
    return len(result.failures) + len(result.errors) == 0

def main():
    """Main test runner function."""
    parser = argparse.ArgumentParser(description='Run hiring optimization model tests')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    parser.add_argument('--category', '-c', choices=['model', 'training', 'performance'], 
                       help='Run specific test category')
    parser.add_argument('--pattern', '-p', help='Test name pattern (e.g., test_*speed*)')
    
    args = parser.parse_args()
    
    if args.category:
        success = run_specific_test(args.category, args.verbose)
    else:
        success = run_all_tests(args.verbose, args.pattern)
    
    if success:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)

if __name__ == '__main__':
    main()
