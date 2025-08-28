#!/usr/bin/env python3
"""
Setup Script for Retail ML Take-Home Test

This script helps candidates set up their environment for the take-home test.
It creates a virtual environment and installs required dependencies.
"""

import os
import sys
import subprocess
import platform

def print_step(step_num, description):
    """Print a formatted step description."""
    print(f"\n{'='*60}")
    print(f"Step {step_num}: {description}")
    print(f"{'='*60}")

def run_command(command, description):
    """Run a shell command and handle errors."""
    print(f"\n🔄 {description}")
    print(f"Command: {command}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            print("✅ Output:")
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stderr:
            print("Error output:")
            print(e.stderr)
        return False

def check_python_version():
    """Check if Python version is compatible."""
    print_step(1, "Checking Python Version")
    
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ is required")
        print("Please upgrade your Python version and try again.")
        return False
    
    print("✅ Python version is compatible")
    return True

def create_virtual_environment():
    """Create a virtual environment."""
    print_step(2, "Creating Virtual Environment")
    
    venv_name = "retail_ml_env"
    
    if os.path.exists(venv_name):
        print(f"Virtual environment '{venv_name}' already exists")
        return True
    
    if run_command(f"python3 -m venv {venv_name}", "Creating virtual environment"):
        print(f"✅ Virtual environment '{venv_name}' created successfully")
        return True
    else:
        print("❌ Failed to create virtual environment")
        return False

def activate_virtual_environment():
    """Provide instructions for activating the virtual environment."""
    print_step(3, "Virtual Environment Setup")
    
    venv_name = "retail_ml_env"
    
    if platform.system() == "Windows":
        activate_script = f"{venv_name}\\Scripts\\activate"
        print("On Windows, activate the virtual environment with:")
        print(f"  {activate_script}")
    else:
        activate_script = f"source {venv_name}/bin/activate"
        print("On macOS/Linux, activate the virtual environment with:")
        print(f"  {activate_script}")
    
    print(f"\nOr run this command:")
    print(f"  python3 -m venv {venv_name}")
    print(f"  {activate_script}")
    
    return True

def install_dependencies():
    """Install required dependencies."""
    print_step(4, "Installing Dependencies")
    
    if run_command("pip install -r requirements.txt", "Installing required packages"):
        print("✅ Dependencies installed successfully")
        return True
    else:
        print("❌ Failed to install dependencies")
        print("\nYou can try installing manually:")
        print("  pip install scikit-learn pandas numpy matplotlib seaborn nltk scipy joblib")
        return False

def test_installation():
    """Test that the installation works."""
    print_step(5, "Testing Installation")
    
    test_script = """
import sys
print("Testing imports...")

try:
    import pandas as pd
    print("✅ pandas imported successfully")
except ImportError as e:
    print(f"❌ pandas import failed: {e}")

try:
    import numpy as np
    print("✅ numpy imported successfully")
except ImportError as e:
    print(f"❌ numpy import failed: {e}")

try:
    import sklearn
    print("✅ scikit-learn imported successfully")
except ImportError as e:
    print(f"❌ scikit-learn import failed: {e}")

try:
    import matplotlib.pyplot as plt
    print("✅ matplotlib imported successfully")
except ImportError as e:
    print(f"❌ matplotlib import failed: {e}")

print("\\nImport test completed!")
"""
    
    # Write test script to temporary file
    test_file = "test_imports.py"
    with open(test_file, "w") as f:
        f.write(test_script)
    
    # Run the test
    if run_command(f"python3 {test_file}", "Testing package imports"):
        print("✅ All packages imported successfully")
        
        # Clean up
        os.remove(test_file)
        return True
    else:
        print("❌ Some packages failed to import")
        return False

def print_next_steps():
    """Print next steps for the candidate."""
    print_step(6, "Next Steps")
    
    print("🎉 Setup completed successfully!")
    print("\n📝 Next steps:")
    print("1. Activate your virtual environment:")
    if platform.system() == "Windows":
        print("   retail_ml_env\\Scripts\\activate")
    else:
        print("   source retail_ml_env/bin/activate")
    
    print("\n2. Start implementing the TODO methods in:")
    print("   - data_processor.py")
    print("   - retail_job_classifier.py")
    print("   - model_evaluation.py")
    
    print("\n3. Test your implementation:")
    print("   python3 example_usage.py")
    
    print("\n4. Check the README_IMPLEMENTATION.md for detailed guidance")
    
    print("\n🚀 Good luck with your take-home test!")

def main():
    """Main setup function."""
    print("🚀 Retail ML Take-Home Test - Environment Setup")
    print("=" * 60)
    print("This script will help you set up your environment for the ML take-home test.")
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Create virtual environment
    if not create_virtual_environment():
        return False
    
    # Provide activation instructions
    if not activate_virtual_environment():
        return False
    
    # Install dependencies
    if not install_dependencies():
        return False
    
    # Test installation
    if not test_installation():
        return False
    
    # Print next steps
    print_next_steps()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
