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
    
    # Generate some sample data
    query_ids = torch.randint(0, 100, (10,))
    candidate_ids = torch.randint(0, 1000, (10,))
    
    # Get similarity scores
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
    
    # Simulate a user wanting recommendations
    user_id = torch.tensor([42])  # User 42 wants recommendations
    
    # Get all item embeddings (in practice, you'd have a pre-computed index)
    all_item_ids = torch.arange(n_items)
    item_embeddings = model.get_candidate_embedding(all_item_ids)
    user_embedding = model.get_query_embedding(user_id)
    
    # Compute similarities with all items
    similarities = torch.mm(user_embedding, item_embeddings.T).squeeze()
    
    # Get top-10 recommendations
    top_k = 10
    top_items = torch.topk(similarities, k=top_k)
    
    print(f"Top {top_k} recommendations for User {user_id.item()}:")
    for i, (item_idx, score) in enumerate(zip(top_items.indices, top_items.values)):
        print(f"  {i+1}. Item {item_idx.item()}: {score.item():.4f}")

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
        positive_ratio=0.3
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

def example_different_architectures():
    """Example showing different architecture configurations."""
    print("\n" + "=" * 60)
    print("EXAMPLE 4: Different Architecture Configurations")
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
        }
    ]
    
    query_vocab_size = 1000
    candidate_vocab_size = 5000
    
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
        
        config['params'] = total_params
        
        print(f"{config['name']}:")
        print(f"  Embedding dim: {config['embedding_dim']}")
        print(f"  Hidden dims: {config['hidden_dims']}")
        print(f"  Total parameters: {total_params:,}")
        print(f"  Trainable parameters: {trainable_params:,}")
        print()

def main():
    """Run all examples."""
    print("🎯 Two-Tower Model Examples")
    
    # Set random seeds for reproducibility
    torch.manual_seed(42)
    np.random.seed(42)
    
    example_basic_usage()
    example_recommendation_system()
    example_xgboost_model()
    example_different_architectures()
    
    print("\n🎉 All examples completed successfully!")
    print("\nTo train a full model, run: python main.py")
    print("To customize configuration, edit configs/config.py")

if __name__ == "__main__":
    main()
