#!/usr/bin/env python3
"""
Final working demo of two-tower model functionality.
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
            
            recommended_items = [candidate_batch[idx].item() for idx in item_indices]
            score_strs = [f'{s.item():.3f}' for s in scores]
            
            print(f"User {user_id}: Items {recommended_items} (scores: {score_strs})")

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
    train_queries, train_candidates, train_labels = query_ids[:split], candidate_ids[:split], labels[:split]
    test_queries, test_candidates, test_labels = query_ids[split:], candidate_ids[split:], labels[split:]
    
    # Create and train model
    model = XGBoostTwoTowerModel(
        query_vocab_size=50,
        candidate_vocab_size=200,
        embedding_dim=32
    )
    
    print("Training XGBoost model...")
    model.fit(train_queries, train_candidates, train_labels)
    
    # Evaluate
    test_preds = model.predict(test_queries, test_candidates)
    
    from sklearn.metrics import roc_auc_score, accuracy_score
    auc = roc_auc_score(test_labels, test_preds)
    acc = accuracy_score(test_labels, test_preds > 0.5)
    
    print(f"Test AUC: {auc:.4f}")
    print(f"Test Accuracy: {acc:.4f}")
    print(f"Positive rate in test: {np.mean(test_labels):.2%}")

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
        
        arch_str = ' → '.join(f'{d}' for d in hidden_dims)
        print(f"{name:>6}: {emb_dim:>3}d → {arch_str:<15} | {params:>8,} params | ~{memory_mb:>4.1f} MB")

def demo_practical_usage():
    """Show practical usage patterns."""
    print("\n💡 Practical Usage Patterns")
    print("=" * 50)
    
    # Create a production-like model
    model = TwoTowerModel(
        query_vocab_size=10000,    # 10K users
        candidate_vocab_size=50000, # 50K items
        embedding_dim=128,
        hidden_dims=[256, 128]
    )
    model.eval()
    
    print("Scenario: E-commerce recommendation system")
    print(f"- Users: {10000:,}")
    print(f"- Items: {50000:,}")
    print(f"- Model parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Simulate user requesting recommendations
    user_id = torch.tensor([1234])  # User 1234
    
    # In production, you'd have pre-computed item embeddings
    # Here we simulate with a random sample of items
    sample_items = torch.randint(0, 50000, (1000,))  # Sample 1K items
    
    with torch.no_grad():
        user_emb = model.get_query_embedding(user_id)
        item_embs = model.get_candidate_embedding(sample_items)
        
        # Compute similarities
        similarities = torch.mm(user_emb, item_embs.T).squeeze()
        
        # Get top recommendations
        top_10 = torch.topk(similarities, k=10)
        
        print(f"\nTop 10 recommendations for User {user_id.item()}:")
        for i, (idx, score) in enumerate(zip(top_10.indices, top_10.values)):
            item_id = sample_items[idx].item()
            print(f"  {i+1:2d}. Item {item_id:5d}: {score.item():.4f}")

def main():
    """Run all demos."""
    print("🎯 Two-Tower Model Complete Demo")
    print("This demonstrates the full functionality of two-tower architectures\n")
    
    # Set seeds for reproducibility
    torch.manual_seed(42)
    np.random.seed(42)
    
    try:
        demo_pytorch_model()
        demo_xgboost_model()
        demo_model_comparison()
        demo_practical_usage()
        
        print("\n" + "=" * 60)
        print("✅ All demos completed successfully!")
        print("\n🚀 Next steps:")
        print("  • Run 'python main.py' for full model training")
        print("  • Edit 'configs/config.py' to customize architecture")
        print("  • Check 'experiments/' folder for training results")
        print("  • Use trained models for production inference")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
