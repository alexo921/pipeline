#!/usr/bin/env python3
"""
Simple demo of two-tower model functionality.
"""

import torch
import numpy as np
from models.two_tower import TwoTowerModel, XGBoostTwoTowerModel
from utils.data_generator import generate_synthetic_data

def demo_pytorch_model():
    """Demonstrate PyTorch two-tower model."""
    print("🔥 PyTorch Two-Tower Model Demo")
    print("=" * 50)
    
    # Create model
    model = TwoTowerModel(
        query_vocab_size=100,
        candidate_vocab_size=500,
        embedding_dim=64,
        hidden_dims=[128, 64]
    )
    model.eval()
    
    # Generate sample queries and candidates
    query_batch = torch.randint(0, 100, (8,))  # 8 users
    candidate_batch = torch.randint(0, 500, (20,))  # 20 items
    
    print(f"Processing {len(query_batch)} users and {len(candidate_batch)} items")
    
    with torch.no_grad():
        # Get embeddings
        query_embs = model.get_query_embedding(query_batch)
        candidate_embs = model.get_candidate_embedding(candidate_batch)
        
        print(f"Query embeddings: {query_embs.shape}")
        print(f"Candidate embeddings: {candidate_embs.shape}")
        
        # Compute all pairwise similarities
        similarities = torch.mm(query_embs, candidate_embs.T)
        print(f"Similarity matrix: {similarities.shape}")
        
        # Top-3 recommendations for each user
        top_items = torch.topk(similarities, k=3, dim=1)
        
        print("\nTop 3 recommendations per user:")
        for i in range(len(query_batch)):
            user_id = query_batch[i].item()
            item_indices = top_items.indices[i]
            scores = top_items.values[i]
            
            print(f"User {user_id}: Items {[candidate_batch[idx].item() for idx in item_indices]} "
                  f"(scores: {[f'{s.item():.3f}' for s in scores]})")

def demo_xgboost_model():
    """Demonstrate XGBoost two-tower model."""
    print("\n🌳 XGBoost Two-Tower Model Demo") 
    print("=" * 50)
    
    # Generate training data
    print("Generating training data...")
    query_ids, candidate_ids, labels = generate_synthetic_data(
        n_queries=50,
        n_candidates=200,
        n_samples=2000,
        positive_ratio=0.25,
        random_state=42
    )
    
    # Split data
    split = int(0.8 * len(labels))
    train_data = (query_ids[:split], candidate_ids[:split], labels[:split])
    test_data = (query_ids[split:], candidate_ids[split:], labels[split:])
    
    # Create and train model
    model = XGBoostTwoTowerModel(
        query_vocab_size=50,
        candidate_vocab_size=200,
        embedding_dim=32
    )
    
    print("Training XGBoost model...")
    model.fit(*train_data)
    
    # Evaluate
    test_preds = model.predict(*test_data)
    
    from sklearn.metrics import roc_auc_score, accuracy_score
    auc = roc_auc_score(test_data[2], test_preds)
    acc = accuracy_score(test_data[2], test_preds > 0.5)
    
    print(f"Test AUC: {auc:.4f}")
    print(f"Test Accuracy: {acc:.4f}")
    print(f"Positive rate: {np.mean(test_data[2]):.2%}")

def demo_model_comparison():
    """Compare different model architectures."""
    print("\n📊 Model Architecture Comparison")
    print("=" * 50)
    
    configs = [
        ("Small", 32, [64]),
        ("Medium", 64, [128, 64]), 
        ("Large", 128, [256, 128, 64]),
        ("Wide", 64, [256, 256]),
        ("Deep", 64, [128, 128, 64, 32])
    ]
    
    vocab_sizes = (1000, 5000)  # queries, candidates
    
    print(f"Comparing models for {vocab_sizes[0]:,} queries × {vocab_sizes[1]:,} candidates:\n")
    
    for name, emb_dim, hidden_dims in configs:
        model = TwoTowerModel(
            query_vocab_size=vocab_sizes[0],
            candidate_vocab_size=vocab_sizes[1], 
            embedding_dim=emb_dim,
            hidden_dims=hidden_dims
        )
        
        params = sum(p.numel() for p in model.parameters())
        memory_mb = params * 4 / (1024**2)  # 4 bytes per float32
        
        print(f"{name:>6}: {emb_dim:>3}d → {' → '.join(f'{d}d' for d in hidden_dims):>20} "
               f"| {params:>8,} params | ~{memory_mb:>4.1f} MB")

def main():
    """Run all demos."""
    print("🎯 Two-Tower Model Demonstrations")
    print("This shows practical usage examples for two-tower architectures\n")
    
    # Set seeds for reproducibility
    torch.manual_seed(42)
    np.random.seed(42)
    
    try:
        demo_pytorch_model()
        demo_xgboost_model()
        demo_model_comparison()
        
        print("\n✅ All demos completed successfully!")
        print("\n🚀 Ready to train? Run: python main.py")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
