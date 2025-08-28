"""
Example Usage of Retail Job Classification System

This script demonstrates how to use the implemented retail job classification system.
It shows the complete workflow from data loading to model evaluation.

Note: This script will only work after implementing the required methods in:
- data_processor.py
- retail_job_classifier.py  
- model_evaluation.py
"""

import json
import os
from data_processor import load_sample_data
from retail_job_classifier import RetailJobClassifier
from model_evaluation import RetailJobModelEvaluator


def demonstrate_basic_usage():
    """Demonstrate basic usage of the classification system."""
    print("🚀 RetailConnect Job Classification Demo")
    print("=" * 50)
    
    # Load sample data
    print("📊 Loading sample retail job data...")
    jobs_data = load_sample_data()
    
    if not jobs_data:
        print("❌ Error: No data loaded. Please check the data file.")
        return
    
    print(f"✅ Loaded {len(jobs_data)} job postings")
    
    # Initialize classifier
    print("\n🤖 Initializing job classifier...")
    classifier = RetailJobClassifier()
    
    # Train models
    print("🎯 Training classification models...")
    try:
        classifier.train_models(jobs_data, model_type="random_forest")
        print("✅ Models trained successfully!")
    except Exception as e:
        print(f"❌ Error training models: {e}")
        print("💡 Make sure you've implemented the required methods!")
        return
    
    # Make predictions
    print("\n🔮 Making predictions on sample jobs...")
    sample_jobs = jobs_data[:3]  # Test on first 3 jobs
    
    for i, job in enumerate(sample_jobs):
        try:
            prediction = classifier.predict(job)
            print(f"\nJob {i+1}: {job['title']}")
            print(f"  Store Type: {prediction['store_type']}")
            print(f"  Employment Type: {prediction['employment_type']}")
            print(f"  Shift: {prediction['shift']}")
        except Exception as e:
            print(f"❌ Error predicting job {i+1}: {e}")
    
    # Evaluate performance
    print("\n📈 Evaluating model performance...")
    try:
        evaluator = RetailJobModelEvaluator(classifier)
        performance = evaluator.create_performance_report()
        print("✅ Performance evaluation completed!")
        print("\n📊 Performance Summary:")
        print(performance[:500] + "..." if len(performance) > 500 else performance)
    except Exception as e:
        print(f"❌ Error evaluating performance: {e}")
    
    # Save models
    print("\n💾 Saving trained models...")
    try:
        classifier.save_models()
        print("✅ Models saved successfully!")
    except Exception as e:
        print(f"❌ Error saving models: {e}")


def demonstrate_advanced_features():
    """Demonstrate advanced features of the classification system."""
    print("\n🚀 Advanced Features Demo")
    print("=" * 40)
    
    # Load saved models
    print("📂 Loading saved models...")
    classifier = RetailJobClassifier()
    
    try:
        classifier.load_models()
        print("✅ Models loaded successfully!")
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        print("💡 Make sure you've trained and saved models first!")
        return
    
    # Generate sample predictions
    print("\n🎲 Generating sample predictions...")
    try:
        sample_predictions = classifier.generate_sample_predictions(3)
        for i, pred in enumerate(sample_predictions):
            print(f"\nSample Prediction {i+1}:")
            print(f"  {pred}")
    except Exception as e:
        print(f"❌ Error generating sample predictions: {e}")
    
    # Feature importance analysis
    print("\n🔍 Analyzing feature importance...")
    try:
        feature_importance = classifier.get_feature_importance()
        print("✅ Feature importance analysis completed!")
        for task, features in feature_importance.items():
            print(f"\n{task} - Top 5 Features:")
            for feature, importance in features[:5]:
                print(f"  {feature}: {importance:.4f}")
    except Exception as e:
        print(f"❌ Error analyzing feature importance: {e}")
    
    # Cross-validation
    print("\n🔄 Performing cross-validation...")
    jobs_data = load_sample_data()
    try:
        cv_results = classifier.cross_validate_models(jobs_data, cv_folds=5)
        print("✅ Cross-validation completed!")
        for task, scores in cv_results.items():
            print(f"\n{task}:")
            print(f"  Mean CV Score: {scores['mean']:.4f}")
            print(f"  Std CV Score: {scores['std']:.4f}")
    except Exception as e:
        print(f"❌ Error in cross-validation: {e}")


def demonstrate_evaluation_tools():
    """Demonstrate the evaluation and visualization tools."""
    print("\n📊 Evaluation Tools Demo")
    print("=" * 40)
    
    # Load data and train models
    jobs_data = load_sample_data()
    classifier = RetailJobClassifier()
    
    try:
        classifier.train_models(jobs_data)
        evaluator = RetailJobModelEvaluator(classifier)
        
        # Generate confusion matrices
        print("📊 Generating confusion matrices...")
        evaluator.generate_confusion_matrices()
        print("✅ Confusion matrices saved!")
        
        # Create performance visualizations
        print("📈 Creating performance visualizations...")
        evaluator.visualize_results()
        print("✅ Performance visualizations saved!")
        
        # Analyze feature importance
        print("🔍 Analyzing feature importance...")
        evaluator.analyze_feature_importance()
        print("✅ Feature importance analysis saved!")
        
        # Export all results
        print("📁 Exporting evaluation results...")
        evaluator.export_results()
        print("✅ All results exported!")
        
    except Exception as e:
        print(f"❌ Error in evaluation: {e}")
        print("💡 Make sure you've implemented the evaluation methods!")


def main():
    """Main demonstration function."""
    print("🎯 RetailConnect ML Take-Home Test - Example Usage")
    print("=" * 60)
    print("\nThis script demonstrates the complete workflow for the retail job")
    print("classification system. Make sure you've implemented all required methods!")
    print("\n" + "=" * 60)
    
    # Basic usage demo
    demonstrate_basic_usage()
    
    # Advanced features demo
    demonstrate_advanced_features()
    
    # Evaluation tools demo
    demonstrate_evaluation_tools()
    
    print("\n🎉 Demo completed!")
    print("\n📝 Next steps:")
    print("1. Implement all TODO methods in the provided files")
    print("2. Test your implementation with this script")
    print("3. Optimize model performance to meet accuracy targets")
    print("4. Add any bonus features you'd like to showcase")
    print("5. Submit your complete solution")


if __name__ == "__main__":
    main()
