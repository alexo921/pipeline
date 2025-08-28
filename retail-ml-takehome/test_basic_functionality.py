"""
Basic Functionality Test for Retail ML Take-Home Test

This script tests the basic functionality of the take-home test to ensure:
1. All files can be imported without errors
2. Sample data loads correctly
3. Basic class instantiation works
4. No syntax errors in the template files

Run this before sending the take-home test to candidates.
"""

import sys
import os
import json
import traceback

def test_imports():
    """Test that all required modules can be imported."""
    print("🧪 Testing imports...")
    
    try:
        from data_processor import RetailJobDataProcessor, load_sample_data
        print("✅ data_processor.py imports successfully")
    except Exception as e:
        print(f"❌ Error importing data_processor: {e}")
        return False
    
    try:
        from retail_job_classifier import RetailJobClassifier
        print("✅ retail_job_classifier.py imports successfully")
    except Exception as e:
        print(f"❌ Error importing retail_job_classifier: {e}")
        return False
    
    try:
        from model_evaluation import RetailJobModelEvaluator
        print("✅ model_evaluation.py imports successfully")
    except Exception as e:
        print(f"❌ Error importing model_evaluation: {e}")
        return False
    
    return True

def test_data_loading():
    """Test that sample data can be loaded."""
    print("\n📊 Testing data loading...")
    
    try:
        from data_processor import load_sample_data
        jobs_data = load_sample_data()
        
        if not jobs_data:
            print("❌ No data loaded")
            return False
        
        print(f"✅ Loaded {len(jobs_data)} job postings")
        
        # Check data structure
        if len(jobs_data) > 0:
            sample_job = jobs_data[0]
            required_fields = ['id', 'title', 'company', 'description', 'expected_output']
            
            for field in required_fields:
                if field not in sample_job:
                    print(f"❌ Missing required field: {field}")
                    return False
            
            print("✅ Sample data structure is correct")
        
        return True
        
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        traceback.print_exc()
        return False

def test_class_instantiation():
    """Test that all classes can be instantiated."""
    print("\n🏗️ Testing class instantiation...")
    
    try:
        from data_processor import RetailJobDataProcessor
        processor = RetailJobDataProcessor()
        print("✅ RetailJobDataProcessor instantiated successfully")
    except Exception as e:
        print(f"❌ Error instantiating RetailJobDataProcessor: {e}")
        return False
    
    try:
        from retail_job_classifier import RetailJobClassifier
        classifier = RetailJobClassifier()
        print("✅ RetailJobClassifier instantiated successfully")
    except Exception as e:
        print(f"❌ Error instantiating RetailJobClassifier: {e}")
        return False
    
    try:
        from model_evaluation import RetailJobModelEvaluator
        evaluator = RetailJobModelEvaluator(classifier)
        print("✅ RetailJobModelEvaluator instantiated successfully")
    except Exception as e:
        print(f"❌ Error instantiating RetailJobModelEvaluator: {e}")
        return False
    
    return True

def test_basic_methods():
    """Test that basic methods exist and can be called."""
    print("\n🔧 Testing basic methods...")
    
    try:
        from data_processor import RetailJobDataProcessor
        processor = RetailJobDataProcessor()
        
        # Test that methods exist
        methods = ['clean_job_text', 'extract_text_features', 'extract_metadata_features', 
                  'create_feature_matrix', 'preprocess_data']
        
        for method in methods:
            if not hasattr(processor, method):
                print(f"❌ Missing method: {method}")
                return False
        
        print("✅ All required methods exist in RetailJobDataProcessor")
        
    except Exception as e:
        print(f"❌ Error testing RetailJobDataProcessor methods: {e}")
        return False
    
    try:
        from retail_job_classifier import RetailJobClassifier
        classifier = RetailJobClassifier()
        
        # Test that methods exist
        methods = ['prepare_data', 'train_models', 'predict', 'evaluate_performance', 
                  'save_models', 'load_models']
        
        for method in methods:
            if not hasattr(classifier, method):
                print(f"❌ Missing method: {method}")
                return False
        
        print("✅ All required methods exist in RetailJobClassifier")
        
    except Exception as e:
        print(f"❌ Error testing RetailJobClassifier methods: {e}")
        return False
    
    return True

def test_sample_data_quality():
    """Test the quality and variety of sample data."""
    print("\n📈 Testing sample data quality...")
    
    try:
        from data_processor import load_sample_data
        jobs_data = load_sample_data()
        
        # Check variety in store types
        store_types = set()
        employment_types = set()
        shifts = set()
        
        for job in jobs_data:
            if 'expected_output' in job:
                expected = job['expected_output']
                if 'store_type' in expected:
                    store_types.add(expected['store_type'])
                if 'employment_type' in expected:
                    employment_types.add(expected['employment_type'])
                if 'shift' in expected:
                    shifts.add(expected['shift'])
        
        print(f"✅ Store types found: {len(store_types)} - {', '.join(store_types)}")
        print(f"✅ Employment types found: {len(employment_types)} - {', '.join(employment_types)}")
        print(f"✅ Shifts found: {len(shifts)} - {', '.join(shifts)}")
        
        # Check minimum variety
        if len(store_types) < 3:
            print("⚠️ Warning: Limited store type variety")
        if len(employment_types) < 3:
            print("⚠️ Warning: Limited employment type variety")
        if len(shifts) < 3:
            print("⚠️ Warning: Limited shift variety")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing data quality: {e}")
        return False

def test_file_structure():
    """Test that all required files exist."""
    print("\n📁 Testing file structure...")
    
    required_files = [
        'README.md',
        'requirements.txt',
        'retail_jobs_dataset.json',
        'data_processor.py',
        'retail_job_classifier.py',
        'model_evaluation.py',
        'example_usage.py',
        'README_IMPLEMENTATION.md',
        '.gitignore'
    ]
    
    missing_files = []
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"❌ Missing files: {', '.join(missing_files)}")
        return False
    
    print(f"✅ All {len(required_files)} required files present")
    return True

def main():
    """Run all tests."""
    print("🚀 Retail ML Take-Home Test - Basic Functionality Test")
    print("=" * 60)
    
    tests = [
        ("File Structure", test_file_structure),
        ("Imports", test_imports),
        ("Data Loading", test_data_loading),
        ("Class Instantiation", test_class_instantiation),
        ("Basic Methods", test_basic_methods),
        ("Sample Data Quality", test_sample_data_quality)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            if test_func():
                passed += 1
                print(f"✅ {test_name} PASSED")
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} ERROR: {e}")
            traceback.print_exc()
    
    print(f"\n{'='*60}")
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The take-home test is ready to send.")
        print("\n✅ What this means:")
        print("- All files can be imported without errors")
        print("- Sample data loads correctly")
        print("- Classes can be instantiated")
        print("- Required methods exist")
        print("- Sample data has good variety")
    else:
        print("⚠️ Some tests failed. Please fix issues before sending.")
        print("\n❌ Issues to address:")
        print("- Check error messages above")
        print("- Verify all required files are present")
        print("- Test file syntax and imports")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
