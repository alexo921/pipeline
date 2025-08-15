#!/usr/bin/env python3
"""
Improved training script for healthcare hiring optimization.
Addresses data imbalance and improves similarity scoring.
"""

import os
import sys
import torch
import numpy as np
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from real_data_loader import load_real_hiring_data
from hiring_model import create_hiring_model
from improved_hiring_trainer import ImprovedHiringTrainer

def main():
    print("🎯 Improved Healthcare Hiring Model Training")
    print("=" * 60)
    print("🔧 Addressing data imbalance and similarity scoring issues")
    print("=" * 60)
    
    # Set random seeds
    torch.manual_seed(42)
    np.random.seed(42)
    
    # Load your actual data
    print("📊 Loading your healthcare data files...")
    data = load_real_hiring_data(
        "transformed_features.csv", 
        "training_jobs_20250813_144107.json"
    )
    
    print(f"✅ Data loaded successfully!")
    print(f"   👥 Candidates: {data['candidate_features'].shape[0]} with {data['candidate_features'].shape[1]} features")
    print(f"   💼 Jobs: {data['job_features'].shape[0]} with {data['job_features'].shape[1]} features")
    print(f"   🔗 Training pairs: {len(data['labels']):,}")
    print(f"   ✅ Positive matches: {np.sum(data['labels']):,} ({np.mean(data['labels']):.1%})")
    
    # Create experiment directory
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    exp_name = f'improved_healthcare_model_{timestamp}'
    exp_dir = os.path.join('improved_hiring_experiments', exp_name)
    os.makedirs(exp_dir, exist_ok=True)
    
    print(f"📁 Experiment: {exp_name}")
    
    # Create improved model with better architecture
    print(f"\n🏗️ Creating improved healthcare hiring model...")
    candidate_dim = data['candidate_features'].shape[1]
    job_dim = data['job_features'].shape[1]
    
    # Enhanced model configuration for healthcare
    model_config = {
        'embedding_dim': 256,  # Larger embeddings for complex healthcare data
        'hidden_dims': [1024, 512, 256],  # Deeper network
        'dropout_rate': 0.4,  # Higher dropout for regularization
        'use_batch_norm': True
    }
    
    model = create_hiring_model(candidate_dim, job_dim, model_config)
    print(f"   📊 Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Create improved data loaders with balancing
    print(f"\n📦 Creating balanced data loaders...")
    trainer = ImprovedHiringTrainer(model)
    
    train_loader, val_loader, test_loader = trainer.create_balanced_data_loaders(
        data, 
        batch_size=64,  # Smaller batch size for better gradient estimates
        val_split=0.15,
        test_split=0.15,
        positive_oversample=5.0  # 5x oversampling of positive pairs
    )
    
    # Create improved trainer
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    improved_trainer = ImprovedHiringTrainer(
        model=model,
        device=device,
        learning_rate=0.0005,  # Lower learning rate for stability
        weight_decay=0.01
    )
    
    # Training with improvements
    print(f"\n🚀 Starting improved training...")
    model_save_path = os.path.join(exp_dir, 'best_improved_healthcare_model.pth')
    
    improved_trainer.train(
        train_loader=train_loader,
        val_loader=val_loader,
        epochs=60,  # More epochs with better early stopping
        early_stopping_patience=20,  # More patience
        save_path=model_save_path
    )
    
    # Final evaluation
    print(f"\n📈 Final evaluation...")
    test_loss, test_auc, test_ap = improved_trainer.validate(test_loader)
    print(f"🎯 Test Results:")
    print(f"   Loss: {test_loss:.4f}")
    print(f"   AUC-ROC: {test_auc:.4f}")
    print(f"   Average Precision: {test_ap:.4f}")
    
    # Generate improved plots
    plot_save_path = os.path.join(exp_dir, 'improved_training_history.png')
    improved_trainer.plot_training_history(plot_save_path)
    
    # Demonstrate improved candidate-job matching
    print(f"\n🎯 Demonstrating improved healthcare matching...")
    
    candidate_features_tensor = torch.FloatTensor(data['candidate_features'])
    job_features_tensor = torch.FloatTensor(data['job_features'])
    
    # Show specific examples with improved scoring
    matching_results = improved_trainer.evaluate_matches(
        candidate_features_tensor,
        job_features_tensor,
        data['candidate_df'],
        data['job_df'],
        top_k=5
    )
    
    # Print improved results
    print(f"\n🎯 Improved Matching Results:")
    print("=" * 60)
    
    for candidate_name, matches in matching_results.items():
        print(f"\n👤 {candidate_name}:")
        for i, match in enumerate(matches):
            print(f"  {i+1}. {match['job_title']} @ {match['company']}")
            print(f"     Probability: {match['probability']:.3f}, Score: {match['score']:.3f}")
    
    # Save detailed results
    results_path = os.path.join(exp_dir, 'improved_results_summary.txt')
    with open(results_path, 'w') as f:
        f.write(f"Improved Healthcare Hiring Model Results\n")
        f.write(f"={'='*50}\n")
        f.write(f"Experiment: {exp_name}\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"Improvements Made:\n")
        f.write(f"  ✅ Data balancing with 5x positive pair oversampling\n")
        f.write(f"  ✅ Temperature scaling for better similarity distribution\n")
        f.write(f"  ✅ Gradient clipping for training stability\n")
        f.write(f"  ✅ Enhanced model architecture (256D embeddings)\n")
        f.write(f"  ✅ Improved learning rate scheduling\n\n")
        f.write(f"Data Summary:\n")
        f.write(f"  Healthcare candidates: {data['candidate_info']['n_candidates']}\n")
        f.write(f"  Healthcare jobs: {data['job_info']['n_jobs']}\n")
        f.write(f"  Training pairs: {len(data['labels']):,}\n")
        f.write(f"  Original positive rate: {np.mean(data['labels']):.1%}\n")
        f.write(f"  Balanced positive rate: ~{min(1.0, 5.0 * np.mean(data['labels'])):.1%}\n\n")
        f.write(f"Model Configuration:\n")
        f.write(f"  Candidate features: {candidate_dim}\n")
        f.write(f"  Job features: {job_dim}\n")
        f.write(f"  Embedding dimension: {model_config['embedding_dim']}\n")
        f.write(f"  Model parameters: {sum(p.numel() for p in model.parameters()):,}\n\n")
        f.write(f"Final Results:\n")
        f.write(f"  Test Loss: {test_loss:.4f}\n")
        f.write(f"  Test AUC-ROC: {test_auc:.4f}\n")
        f.write(f"  Test Average Precision: {test_ap:.4f}\n\n")
        f.write(f"Healthcare Focus:\n")
        f.write(f"  Target roles: CNA, RN, LPN, Physical Therapist, etc.\n")
        f.write(f"  Settings: Nursing homes, hospitals, home health\n")
        f.write(f"  Skills matching: Medical terminology, patient care, certifications\n")
    
    print(f"\n✅ Improved training completed!")
    print(f"📁 Results saved to: {exp_dir}")
    print(f"📊 Model: {model_save_path}")
    print(f"📈 Plots: {plot_save_path}")
    print(f"📄 Summary: {results_path}")
    
    # Instructions for using the improved model
    print(f"\n🎉 Your Improved Healthcare Hiring Model is Ready!")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"")
    print(f"💡 Key improvements implemented:")
    print(f"")
    print(f"🔧 Data Balancing:")
    print(f"   • 5x oversampling of positive matches")
    print(f"   • Balanced training/validation splits")
    print(f"   • Improved class distribution")
    print(f"")
    print(f"🔧 Model Architecture:")
    print(f"   • Larger embeddings (256D vs 128D)")
    print(f"   • Deeper network layers")
    print(f"   • Better regularization")
    print(f"")
    print(f"🔧 Training Stability:")
    print(f"   • Temperature scaling for similarities")
    print(f"   • Gradient clipping")
    print(f"   • Improved learning rate scheduling")
    print(f"")
    print(f"🎯 Healthcare-specific features:")
    print(f"   • Medical terminology matching")
    print(f"   • Certification alignment")
    print(f"   • Setting preferences (nursing home, hospital, etc.)")
    print(f"   • Experience level matching")
    print(f"")
    print(f"💼 To use your improved model:")
    print(f"")
    print(f"1️⃣  Load the model:")
    print(f"   from hiring_model import create_hiring_model")
    print(f"   from improved_hiring_trainer import ImprovedHiringTrainer")
    print(f"   ")
    print(f"   model = create_hiring_model({candidate_dim}, {job_dim}, {model_config})")
    print(f"   trainer = ImprovedHiringTrainer(model)")
    print(f"   trainer.load_model('{model_save_path}')")
    print(f"")
    print(f"2️⃣  Find best healthcare candidates:")
    print(f"   # Get top matches for a specific job")
    print(f"   job_features = job_features_tensor[0:1]  # RN position")
    print(f"   results = trainer.evaluate_matches(candidate_features_tensor, job_features)")
    print(f"")
    print(f"🎯 Your model now provides meaningful similarity scores")
    print(f"   and better healthcare job-candidate matching!")

if __name__ == "__main__":
    main()
