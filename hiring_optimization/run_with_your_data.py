#!/usr/bin/env python3
"""
Simple script to run hiring optimization with your actual data files.
Place this script in the same directory as your CSV and JSON files.
"""

import os
import sys
import subprocess

def main():
    print("🎯 Hiring Optimization Setup")
    print("=" * 50)
    
    # File paths (adjust these to match your file locations)
    candidates_file = "/Users/alexostrander/Downloads/transformed_features.csv"
    jobs_file = "/Users/alexostrander/Downloads/training_jobs_20250813_144107.json"
    
    # Check if files exist
    candidates_exists = os.path.exists(candidates_file)
    jobs_exists = os.path.exists(jobs_file)
    
    print(f"📄 Candidate file: {candidates_file}")
    print(f"   Status: {'✅ Found' if candidates_exists else '❌ Not found'}")
    
    print(f"📄 Job file: {jobs_file}")
    print(f"   Status: {'✅ Found' if jobs_exists else '❌ Not found'}")
    
    if not candidates_exists or not jobs_exists:
        print("\n⚠️  Data files not found!")
        print("Please update the file paths in this script to match your actual file locations.")
        print("\nTo use this script:")
        print("1. Edit the file paths above to point to your actual files")
        print("2. Run this script again")
        return
    
    print("\n🚀 Starting training with your data...")
    print("-" * 50)
    
    # Training command
    cmd = [
        "python", "train_hiring_model.py",
        "--candidates", candidates_file,
        "--jobs", jobs_file,
        "--epochs", "25",
        "--batch-size", "128",
        "--embedding-dim", "128",
        "--experiment-name", "your_hiring_model"
    ]
    
    try:
        # Run the training
        subprocess.run(cmd, check=True)
        print("\n🎉 Training completed successfully!")
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ Training failed with error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you're in the hiring_optimization directory")
        print("2. Activate the virtual environment: source ../../xgboost-env/bin/activate")
        print("3. Check that your data files are in the correct format")
        
    except FileNotFoundError:
        print("\n❌ Could not find train_hiring_model.py")
        print("Make sure you're running this script from the hiring_optimization directory")

if __name__ == "__main__":
    main()
