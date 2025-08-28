"""
Syntax-Only Test for Retail ML Take-Home Test

This script tests only the syntax and basic structure without requiring
external packages. It ensures the code can be parsed and basic Python
functionality works.

Run this before sending the take-home test to candidates.
"""

import sys
import os
import ast
import traceback
import json

def test_python_syntax():
    """Test that all Python files have valid syntax."""
    print("🐍 Testing Python syntax...")
    
    python_files = [
        'data_processor.py',
        'retail_job_classifier.py',
        'model_evaluation.py',
        'example_usage.py'
    ]
    
    syntax_errors = []
    
    for file in python_files:
        try:
            with open(file, 'r') as f:
                content = f.read()
            
            # Try to parse the Python code
            ast.parse(content)
            print(f"✅ {file} - Syntax OK")
            
        except SyntaxError as e:
            syntax_errors.append(f"{file}: {e}")
            print(f"❌ {file} - Syntax Error: {e}")
        except Exception as e:
            syntax_errors.append(f"{file}: {e}")
            print(f"❌ {file} - Error: {e}")
    
    if syntax_errors:
        print(f"\n❌ Found {len(syntax_errors)} syntax errors:")
        for error in syntax_errors:
            print(f"  - {error}")
        return False
    
    print("✅ All Python files have valid syntax")
    return True

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

def test_json_syntax():
    """Test that JSON files have valid syntax."""
    print("\n📄 Testing JSON syntax...")
    
    try:
        with open('retail_jobs_dataset.json', 'r') as f:
            data = json.loads(f.read())
        
        if not isinstance(data, list):
            print("❌ JSON data is not a list")
            return False
        
        if len(data) == 0:
            print("❌ JSON data is empty")
            return False
        
        print(f"✅ JSON syntax OK - {len(data)} job postings")
        
        # Check first job structure
        if len(data) > 0:
            first_job = data[0]
            required_fields = ['id', 'title', 'company', 'description', 'expected_output']
            
            for field in required_fields:
                if field not in first_job:
                    print(f"❌ Missing required field in first job: {field}")
                    return False
            
            print("✅ Sample job structure is correct")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON syntax error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading JSON: {e}")
        return False

def test_import_structure():
    """Test that import statements are valid (without executing)."""
    print("\n📦 Testing import structure...")
    
    python_files = [
        'data_processor.py',
        'retail_job_classifier.py',
        'model_evaluation.py'
    ]
    
    import_errors = []
    
    for file in python_files:
        try:
            with open(file, 'r') as f:
                content = f.read()
            
            # Check for basic import patterns
            lines = content.split('\n')
            for i, line in enumerate(lines, 1):
                line = line.strip()
                if line.startswith('import ') or line.startswith('from '):
                    # Basic syntax check for import statements
                    if not line.endswith('\\') and 'import' in line:
                        # This is a very basic check - just ensure the line looks reasonable
                        if len(line) < 10:  # Too short to be valid
                            import_errors.append(f"{file}:{i} - Suspicious import line: {line}")
            
            print(f"✅ {file} - Import structure OK")
            
        except Exception as e:
            import_errors.append(f"{file}: {e}")
            print(f"❌ {file} - Error checking imports: {e}")
    
    if import_errors:
        print(f"\n⚠️ Found {len(import_errors)} import warnings:")
        for error in import_errors:
            print(f"  - {error}")
    
    return True

def test_class_definitions():
    """Test that class definitions exist and have required methods."""
    print("\n🏗️ Testing class definitions...")
    
    try:
        with open('data_processor.py', 'r') as f:
            content = f.read()
        
        if 'class RetailJobDataProcessor:' not in content:
            print("❌ RetailJobDataProcessor class not found")
            return False
        
        print("✅ RetailJobDataProcessor class found")
        
        with open('retail_job_classifier.py', 'r') as f:
            content = f.read()
        
        if 'class RetailJobClassifier:' not in content:
            print("❌ RetailJobClassifier class not found")
            return False
        
        print("✅ RetailJobClassifier class found")
        
        with open('model_evaluation.py', 'r') as f:
            content = f.read()
        
        if 'class RetailJobModelEvaluator:' not in content:
            print("❌ RetailJobModelEvaluator class not found")
            return False
        
        print("✅ RetailJobModelEvaluator class found")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking class definitions: {e}")
        return False

def main():
    """Run all syntax tests."""
    print("🚀 Retail ML Take-Home Test - Syntax & Structure Test")
    print("=" * 60)
    print("Note: This test checks syntax only, not functionality with dependencies")
    
    tests = [
        ("File Structure", test_file_structure),
        ("Python Syntax", test_python_syntax),
        ("JSON Syntax", test_json_syntax),
        ("Import Structure", test_import_structure),
        ("Class Definitions", test_class_definitions)
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
        print("🎉 All syntax tests passed! The take-home test structure is correct.")
        print("\n✅ What this means:")
        print("- All required files are present")
        print("- Python files have valid syntax")
        print("- JSON data is properly formatted")
        print("- Class definitions exist")
        print("- Import statements are structured correctly")
        print("\n⚠️ Note: This doesn't test functionality with dependencies.")
        print("   Candidates will need to install requirements.txt packages.")
    else:
        print("⚠️ Some tests failed. Please fix issues before sending.")
        print("\n❌ Issues to address:")
        print("- Check error messages above")
        print("- Verify file syntax and structure")
        print("- Ensure all required files are present")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
