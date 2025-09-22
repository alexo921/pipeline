#!/bin/bash
# Script to activate the virtual environment for the training dataset scripts

echo "🐍 Activating Python virtual environment..."
source venv/bin/activate

echo "✅ Virtual environment activated!"
echo "📦 Available packages:"
pip list | grep -E "(pandas|scikit-learn|numpy)"

echo ""
echo "🚀 You can now run:"
echo "   python3 extract_training_jobs.py    # Extract and transform jobs"
echo "   python3 example_usage.py            # Example ML usage"
echo ""
echo "💡 To deactivate, run: deactivate"
