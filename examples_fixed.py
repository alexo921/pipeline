#!/usr/bin/env python3
"""
Examples demonstrating different two-tower model configurations and use cases.
"""

import torch
import numpy as np
from models.two_tower import TwoTowerModel, XGBoostTwoTowerModel
from configs.config import get_config
from utils.data_generator import generate_synthetic_data

def example_basic_usage():
    """Basic usage example."""
    print("=" * 60)
    print("EXAMPLE 1: Basic Two-Tower Model Usage")
    print("=" * 60)
    
    # Create a simple model
    model = TwoTowerModel(
        query_vocab_size=100,
        candidate_vocab_size=1000,
        embedding_dim=32,
        hidden_dims=[64, 32]
    )
    model.eval()  # Set to eval mode to avoid batch norm issues
    
    # Generate some sample data
    query_ids = torch.randint(0, 100, (10,))
    candidate_ids = torch.randint(0, 1000, (10,))
    
    # Get similarity scores
    with torch.no_grad():
        similarities = model(query_ids, candidate_ids)
        print(f"Query IDs: {query_ids[:5].tolist()}")
        print(f"Candidate IDs: {candidate_ids[:5].tolist()}")
        print(f"Similarities: {similarities[:5].tolist()}")
        
        # Get individual embeddings
        query_embeddings = model.get_query_embedding(query_ids[:3])
        candidate_embeddings = model.get_candidate_embedding(candidate_ids[:5])
        
        print(f"\nQuery embeddings shape: {query_embeddings.shape}")
        print(f"Candidate embeddings shape: {candidate_embeddings.shape}")

def example_recommendation_system():
    """Example for recommendation system use case."""
    print("\n" + "=" * 60)
    print("EXAMPLE 2: Recommendation System Simulation")
    print("=" * 60)
    
    # Simulate a small e-commerce scenario
    n_users = 500
    n_items = 2000
    
    model = TwoTowerModel(
        query_vocab_size=n_users,
        candidate_vocab_size=n_items,
        embedding_dim=64,
        hidden_dims=[128, 64]
    )
    model.eval()  # Set to eval mode
    
    # Simulate multiple users wanting recommendations (batch processing)
    user_ids = torch.tensor([42, 123, 456, 789, 12])  # Multiple users
    
    with torch.no_grad():
        # Get user embeddings
        user_embeddings = model.get_query_embedding(user_ids)
        
        # Sample some items for recommendation
        sample_items = torch.randint(0, n_items, (100,))  # Sample 100 items
        item_embeddings = model.get_candidate_embedding(sample_items)
        
        # Compute similarities between users and items
        similarities = torch.mm(user_embeddings, item_embeddings.T)
        
        # Get top-5 recommendations for each user
        top_k = 5
        top_items = torch.topk(similarities, k=top_k, dim=1)
        
        print(f"Top {top_k} recommendations:")
        for i, user_id in enumerate(user_ids):
            item_indices = top_items.indices[i]
            scores = top_items.values[i]
            recommended_items = sample_items[item_indices]
            
            print(f"User {user_id.item()}:")
            for j, (item_id, score) in enumerate(zip(recommended_items, scores)):
                print(f"  {j+1}. Item {item_id.item()}: {score.item():.4f}")

def example_xgboost_model():
    """Example using XGBoost two-tower model."""
    print("\n" + "=" * 60)
    print("EXAMPLE 3: XGBoost Two-Tower Model")
    print("=" * 60)
    
    # Generate training data
    query_ids, candidate_ids, labels = generate_synthetic_data(
        n_queries=100,
        n_candidates=500,
        n_samples=5000,
        positive_ratio=0.3,
        random_state=42
    )
    
    # Create and train XGBoost model
    xgb_model = XGBoostTwoTowerModel(
        query_vocab_size=100,
        candidate_vocab_size=500,
        embedding_dim=32
    )
    
    # Split data for training
    split_idx = int(0.8 * len(labels))
    train_queries = query_ids[:split_idx]
    train_candidates = candidate_ids[:split_idx]
    train_labels = labels[:split_idx]
    
    test_queries = query_ids[split_idx:]
    test_candidates = candidate_ids[split_idx:]
    test_labels = labels[split_idx:]
    
    # Train the model
    print("Training XGBoost model...")
    xgb_model.fit(train_queries, train_candidates, train_labels)
    
    # Make predictions
    train_preds = xgb_model.predict(train_queries, train_candidates)
    test_preds = xgb_model.predict(test_queries, test_candidates)
    
    from sklearn.metrics import roc_auc_score
    train_auc = roc_auc_score(train_labels, train_preds)
    test_auc = roc_auc_score(test_labels, test_preds)
    
    print(f"Train AUC: {train_auc:.4f}")
    print(f"Test AUC: {test_auc:.4f}")

def example_batch_processing():
    """Example of batch processing for production scenarios."""
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Batch Processing for Production")
    print("=" * 60)
    
    model = TwoTowerModel(
        query_vocab_size=10000,
        candidate_vocab_size=50000,
        embedding_dim=128,
        hidden_dims=[256, 128]
    )
    model.eval()  # Set to evaluation mode
    
    # Simulate batch processing
    batch_size = 32
    n_candidates_sample = 100
    
    # Batch of users requesting recommendations
    user_batch = torch.randint(0, 10000, (batch_size,))
    candidate_batch = torch.randint(0, 50000, (n_candidates_sample,))
    
    print(f"Processing {batch_size} users with {n_candidates_sample} candidate items")
    
    # Process in batches (efficient for production)
    with torch.no_grad():
        # Get embeddings
        user_embeddings = model.get_query_embedding(user_batch)
        candidate_embeddings = model.get_candidate_embedding(candidate_batch)
        
        print(f"User embeddings shape: {user_embeddings.shape}")
        print(f"Candidate embeddings shape: {candidate_embeddings.shape}")
        
        # Compute similarity matrix
        similarity_matrix = torch.mm(user_embeddings, candidate_embeddings.T)
        print(f"Similarity matrix shape: {similarity_matrix.shape}")
        
        # Get top-3 for first 5 users
        top_k = 3
        top_candidates = torch.topk(similarity_matrix[:5], k=top_k, dim=1)
        
        print(f"\nTop {top_k} candidates for first 5 users:")
        for i in range(5):
            user_id = user_batch[i].item()
            candidate_indices = top_candidates.indices[i]
            scores = top_candidates.values[i]
            recommended_candidates = candidate_batch[candidate_indices]
            
            print(f"User {user_id}: Items {recommended_candidates.tolist()} (scores: {[f'{s:.4f}' for s in scores.tolist()]})") 

def example_different_architectures():
    """Example showing different architecture configurations."""
    print("\n" + "=" * 60)
    print("EXAMPLE 5: Different Architecture Configurations")
    print("=" * 60)
    
    configs = [
        {
            'name': 'Small Model',
            'embedding_dim': 32,
            'hidden_dims': [64],
            'params': None
        },
        {
            'name': 'Medium Model', 
            'embedding_dim': 64,
            'hidden_dims': [128, 64],
            'params': None
        },
        {
            'name': 'Large Model',
            'embedding_dim': 128,
            'hidden_dims': [256, 128, 64],
            'params': None
        },
        {
            'name': 'Deep Model',
            'embedding_dim': 64,
            'hidden_dims': [128, 128, 64, 32],
            'params': None
        }
    ]
    
    query_vocab_size = 1000
    candidate_vocab_size = 5000
    
    print(f"Comparing models for {query_vocab_size:,} queries and {candidate_vocab_size:,} candidates:\n")
    
    for config in configs:
        model = TwoTowerModel(
            query_vocab_size=query_vocab_size,
            candidate_vocab_size=candidate_vocab_size,
            embedding_dim=config['embedding_dim'],
            hidden_dims=config['hidden_dims']
        )
        
        # Count parameters
        total_params = sum(p.numel() for p in model.parameters())
        trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
        
        # Estimate memory usage (rough calculation)
        param_memory_mb = total_params * 4 / (1024**2)  # 4 bytes per float32
        
        print(f"{config['name']}:")
        print(f"  Architecture: {config['embedding_dim']} → {' → '.join(map(str, config['hidden_dims']))}")
        print(f"  Parameters: {total_params:,}")
        print(f"  Memory (params): ~{param_memory_mb:.1f} MB")
        print()

def main():
    """Run all examples."""
    print("🎯 Two-Tower Model Examples")
    print("This demonstrates various use cases and configurations for two-tower models\n")
    
    # Set random seeds for reproducibility
    torch.manual_seed(42)
    np.random.seed(42)
    
    try:
        example_basic_usage()
        example_recommendation_system()
        example_xgboost_model()
        example_batch_processing()
        example_different_architectures()
        
        print("\n🎉 All examples completed successfully!")
        print("\nNext steps:")
        print("- Run 'python main.py' for full model training")
        print("- Edit 'configs/config.py' to customize model architecture")
        print("- Check 'experiments/' folder for training results")
        
    except Exception as e:
        print(f"\n❌ Error running examples: {e}")
        print("Make sure you're in the correct environment and all dependencies are installed")

if __name__ == "__main__":
    main()
