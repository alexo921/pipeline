#!/usr/bin/env python3
"""
Main script to train the hiring optimization two-tower model.
Usage: python train_hiring_model.py --candidates path/to/candidates.csv --jobs path/to/jobs.json
"""

import os
import sys
import argparse
import torch
import numpy as np
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_loader import load_hiring_data
from hiring_model import create_hiring_model
from hiring_trainer import HiringTrainer, create_data_loaders

def main():
    parser = argparse.ArgumentParser(description='Train hiring optimization two-tower model')
    parser.add_argument('--candidates', type=str, 
                       default='/Users/alexostrander/Downloads/transformed_features.csv',
                       help='Path to candidate features CSV file')
    parser.add_argument('--jobs', type=str,
                       default='/Users/alexostrander/Downloads/training_jobs_20250813_144107.json', 
                       help='Path to job requirements JSON file')
    parser.add_argument('--epochs', type=int, default=30, help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=128, help='Training batch size')
    parser.add_argument('--lr', type=float, default=0.001, help='Learning rate')
    parser.add_argument('--embedding-dim', type=int, default=128, help='Embedding dimension')
    parser.add_argument('--save-dir', type=str, default='hiring_experiments', help='Directory to save results')
    parser.add_argument('--experiment-name', type=str, default=None, help='Experiment name')
    
    args = parser.parse_args()
    
    # Create experiment directory
    if args.experiment_name is None:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        args.experiment_name = f'hiring_model_{timestamp}'
    
    exp_dir = os.path.join(args.save_dir, args.experiment_name)
    os.makedirs(exp_dir, exist_ok=True)
    
    print("🎯 Hiring Optimization Two-Tower Model Training")
    print("=" * 60)
    print(f"Experiment: {args.experiment_name}")
    print(f"Save directory: {exp_dir}")
    print(f"Candidates file: {args.candidates}")
    print(f"Jobs file: {args.jobs}")
    print("=" * 60)
    
    # Set random seeds
    torch.manual_seed(42)
    np.random.seed(42)
    
    # Load and preprocess data
    print("\n📊 Loading and preprocessing data...")
    try:
        data = load_hiring_data(args.candidates, args.jobs)
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        print("Creating sample data for demonstration...")
        from data_loader import HiringDataProcessor
        processor = HiringDataProcessor()
        candidate_df = processor._create_sample_candidate_data()
        job_df = processor._create_sample_job_data()
        
        candidate_features, candidate_info = processor.preprocess_candidates(candidate_df)
        job_features, job_info = processor.preprocess_jobs(job_df)
        cand_indices, job_indices, labels = processor.create_training_pairs(
            candidate_df, job_df, n_pairs=20000
        )
        
        data = {
            'candidate_features': candidate_features,
            'job_features': job_features,
            'candidate_indices': cand_indices,
            'job_indices': job_indices,
            'labels': labels,
            'candidate_info': candidate_info,
            'job_info': job_info,
            'candidate_df': candidate_df,
            'job_df': job_df,
            'processor': processor
        }
    
    print(f"✅ Data loaded successfully!")
    print(f"   Candidates: {data['candidate_features'].shape}")
    print(f"   Jobs: {data['job_features'].shape}")
    print(f"   Training pairs: {len(data['labels']):,}")
    print(f"   Positive matches: {np.sum(data['labels']):,} ({np.mean(data['labels']):.2%})")
    
    # Create model
    print(f"\n🏗️ Creating two-tower model...")
    candidate_dim = data['candidate_features'].shape[1]
    job_dim = data['job_features'].shape[1]
    
    model_config = {
        'embedding_dim': args.embedding_dim,
        'hidden_dims': [256, 128, 64],  # Deep architecture for hiring
        'dropout_rate': 0.3,  # Higher dropout for better generalization
        'use_batch_norm': True
    }
    
    model = create_hiring_model(candidate_dim, job_dim, model_config)
    print(f"   Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    print(f"   Candidate features: {candidate_dim}")
    print(f"   Job features: {job_dim}")
    print(f"   Embedding dimension: {args.embedding_dim}")
    
    # Create data loaders
    print(f"\n📦 Creating data loaders...")
    train_loader, val_loader, test_loader = create_data_loaders(
        data, batch_size=args.batch_size, val_split=0.15
    )
    
    # Create trainer
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    trainer = HiringTrainer(
        model=model,
        device=device,
        learning_rate=args.lr,
        weight_decay=0.01
    )
    
    # Training
    print(f"\n🚀 Starting training...")
    model_save_path = os.path.join(exp_dir, 'best_hiring_model.pth')
    
    trainer.train(
        train_loader=train_loader,
        val_loader=val_loader,
        epochs=args.epochs,
        early_stopping_patience=10,
        save_path=model_save_path
    )
    
    # Final evaluation
    print(f"\n📈 Final evaluation on test set...")
    test_loss, test_auc, test_ap = trainer.validate(test_loader)
    print(f"Test Results:")
    print(f"  Loss: {test_loss:.4f}")
    print(f"  AUC-ROC: {test_auc:.4f}")
    print(f"  Average Precision: {test_ap:.4f}")
    
    # Generate training plots
    plot_save_path = os.path.join(exp_dir, 'training_history.png')
    trainer.plot_training_history(plot_save_path)
    
    # Demonstrate matching
    print(f"\n🎯 Demonstrating candidate-job matching...")
    candidate_features_tensor = torch.FloatTensor(data['candidate_features'])
    job_features_tensor = torch.FloatTensor(data['job_features'])
    
    matching_results = trainer.evaluate_matches(
        candidate_features_tensor,
        job_features_tensor,
        data['candidate_df'],
        data['job_df'],
        top_k=5
    )
    
    # Save results summary
    results_path = os.path.join(exp_dir, 'results_summary.txt')
    with open(results_path, 'w') as f:
        f.write(f"Hiring Optimization Model Results\n")
        f.write(f"={'='*40}\n")
        f.write(f"Experiment: {args.experiment_name}\n")
        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"Model Configuration:\n")
        f.write(f"  Candidate features: {candidate_dim}\n")
        f.write(f"  Job features: {job_dim}\n")
        f.write(f"  Embedding dimension: {args.embedding_dim}\n")
        f.write(f"  Model parameters: {sum(p.numel() for p in model.parameters()):,}\n\n")
        f.write(f"Training Configuration:\n")
        f.write(f"  Epochs: {len(trainer.train_losses)}\n")
        f.write(f"  Batch size: {args.batch_size}\n")
        f.write(f"  Learning rate: {args.lr}\n")
        f.write(f"  Training samples: {len(train_loader.dataset):,}\n")
        f.write(f"  Validation samples: {len(val_loader.dataset):,}\n")
        f.write(f"  Test samples: {len(test_loader.dataset):,}\n\n")
        f.write(f"Final Results:\n")
        f.write(f"  Test Loss: {test_loss:.4f}\n")
        f.write(f"  Test AUC-ROC: {test_auc:.4f}\n")
        f.write(f"  Test Average Precision: {test_ap:.4f}\n")
        f.write(f"  Total candidates: {data['candidate_info']['n_candidates']}\n")
        f.write(f"  Total jobs: {data['job_info']['n_jobs']}\n")
    
    print(f"\n✅ Training completed successfully!")
    print(f"📁 Results saved to: {exp_dir}")
    print(f"📊 Model saved to: {model_save_path}")
    print(f"📈 Plots saved to: {plot_save_path}")
    print(f"📄 Summary saved to: {results_path}")
    
    # Instructions for using the model
    print(f"\n🎉 Next Steps:")
    print(f"1. Load your trained model:")
    print(f"   model = create_hiring_model({candidate_dim}, {job_dim})")
    print(f"   trainer = HiringTrainer(model)")
    print(f"   trainer.load_model('{model_save_path}')")
    print(f"")
    print(f"2. Use for candidate-job matching:")
    print(f"   top_scores, top_indices = model.predict_matches(candidate_features, job_features)")
    print(f"")
    print(f"3. Get embeddings for similarity search:")
    print(f"   candidate_embeddings = model.get_candidate_embedding(candidate_features)")
    print(f"   job_embeddings = model.get_job_embedding(job_features)")

if __name__ == "__main__":
    main()
