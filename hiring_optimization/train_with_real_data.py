#!/usr/bin/env python3
"""
Train hiring model with your actual data files.
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
from hiring_trainer import HiringTrainer, create_data_loaders

def main():
    print("🎯 Training with Your Real Hiring Data")
    print("=" * 60)
    
    # Set random seeds
    torch.manual_seed(42)
    np.random.seed(42)
    
    # Load your actual data
    print("📊 Loading your data files...")
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
    exp_name = f'real_hiring_model_{timestamp}'
    exp_dir = os.path.join('real_hiring_experiments', exp_name)
    os.makedirs(exp_dir, exist_ok=True)
    
    print(f"📁 Experiment: {exp_name}")
    
    # Create model
    print(f"\n🏗️ Creating specialized hiring model...")
    candidate_dim = data['candidate_features'].shape[1]
    job_dim = data['job_features'].shape[1]
    
    model_config = {
        'embedding_dim': 128,
        'hidden_dims': [512, 256, 128],  # Deeper for complex real data
        'dropout_rate': 0.3,
        'use_batch_norm': True
    }
    
    model = create_hiring_model(candidate_dim, job_dim, model_config)
    print(f"   📊 Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Create data loaders
    print(f"\n📦 Creating data loaders...")
    train_loader, val_loader, test_loader = create_data_loaders(
        data, batch_size=256, val_split=0.15
    )
    
    # Create trainer
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    trainer = HiringTrainer(
        model=model,
        device=device,
        learning_rate=0.001,
        weight_decay=0.02  # Higher regularization for real data
    )
    
    # Training
    print(f"\n🚀 Starting training on your real data...")
    model_save_path = os.path.join(exp_dir, 'best_real_hiring_model.pth')
    
    trainer.train(
        train_loader=train_loader,
        val_loader=val_loader,
        epochs=40,  # More epochs for real data
        early_stopping_patience=12,
        save_path=model_save_path
    )
    
    # Final evaluation
    print(f"\n📈 Final evaluation...")
    test_loss, test_auc, test_ap = trainer.validate(test_loader)
    print(f"🎯 Test Results:")
    print(f"   Loss: {test_loss:.4f}")
    print(f"   AUC-ROC: {test_auc:.4f}")
    print(f"   Average Precision: {test_ap:.4f}")
    
    # Generate plots
    plot_save_path = os.path.join(exp_dir, 'real_training_history.png')
    trainer.plot_training_history(plot_save_path)
    
    # Demonstrate real candidate-job matching
    print(f"\n🎯 Demonstrating real candidate-job matching...")
    
    candidate_features_tensor = torch.FloatTensor(data['candidate_features'])
    job_features_tensor = torch.FloatTensor(data['job_features'])
    
    # Show specific examples with real names
    matching_results = trainer.evaluate_matches(
        candidate_features_tensor,
        job_features_tensor,
        data['candidate_df'],
        data['job_df'],
        top_k=5
    )
    
    # Save detailed results
    results_path = os.path.join(exp_dir, 'real_results_summary.txt')
    with open(results_path, 'w') as f:
        f.write(f"Real Hiring Data Model Results\n")
        f.write(f"={'='*40}\n")
        f.write(f"Experiment: {exp_name}\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"Data Summary:\n")
        f.write(f"  Real candidates: {data['candidate_info']['n_candidates']}\n")
        f.write(f"  Real jobs: {data['job_info']['n_jobs']}\n")
        f.write(f"  Training pairs: {len(data['labels']):,}\n")
        f.write(f"  Positive rate: {np.mean(data['labels']):.1%}\n\n")
        f.write(f"Model Configuration:\n")
        f.write(f"  Candidate features: {candidate_dim}\n")
        f.write(f"  Job features: {job_dim}\n")
        f.write(f"  Embedding dimension: {model_config['embedding_dim']}\n")
        f.write(f"  Model parameters: {sum(p.numel() for p in model.parameters()):,}\n\n")
        f.write(f"Final Results:\n")
        f.write(f"  Test Loss: {test_loss:.4f}\n")
        f.write(f"  Test AUC-ROC: {test_auc:.4f}\n")
        f.write(f"  Test Average Precision: {test_ap:.4f}\n")
    
    print(f"\n✅ Training completed!")
    print(f"📁 Results saved to: {exp_dir}")
    print(f"📊 Model: {model_save_path}")
    print(f"📈 Plots: {plot_save_path}")
    print(f"📄 Summary: {results_path}")
    
    # Instructions for using with your real data
    print(f"\n🎉 Your Real Hiring Model is Ready!")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"")
    print(f"💡 To use your trained model:")
    print(f"")
    print(f"1️⃣  Load the model:")
    print(f"   from hiring_model import create_hiring_model")
    print(f"   from hiring_trainer import HiringTrainer")
    print(f"   ")
    print(f"   model = create_hiring_model({candidate_dim}, {job_dim})")
    print(f"   trainer = HiringTrainer(model)")
    print(f"   trainer.load_model('{model_save_path}')")
    print(f"")
    print(f"2️⃣  Find best candidates for jobs:")
    print(f"   # Get top 10 candidates for job_id=5")
    print(f"   job_features = job_features_tensor[5:6]  # Specific job")
    print(f"   scores, indices = model.predict_matches(candidate_features_tensor, job_features)")
    print(f"")
    print(f"3️⃣  Get candidate embeddings for similarity search:")
    print(f"   candidate_embeddings = model.get_candidate_embedding(candidate_features_tensor)")
    print(f"   job_embeddings = model.get_job_embedding(job_features_tensor)")
    print(f"")
    print(f"🎯 Your model is trained on {data['candidate_info']['n_candidates']} real candidates")
    print(f"   and {data['job_info']['n_jobs']} real job positions!")

if __name__ == "__main__":
    main()
