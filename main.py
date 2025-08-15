#!/usr/bin/env python3
"""
Main script to train and evaluate two-tower models.
"""

import os
import sys
import torch
import numpy as np
from torch.utils.data import DataLoader

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.two_tower import TwoTowerModel, TensorFlowTwoTowerModel, XGBoostTwoTowerModel
from training.trainer import TwoTowerTrainer, TwoTowerDataset
from utils.data_generator import (
    generate_synthetic_data, 
    create_train_val_test_split,
    print_data_statistics
)
from configs.config import get_config, print_config

def train_pytorch_model(config):
    """Train PyTorch two-tower model."""
    print("\n🚀 Training PyTorch Two-Tower Model")
    print("=" * 50)
    
    # Generate data
    print("Generating synthetic data...")
    query_ids, candidate_ids, labels = generate_synthetic_data(
        n_queries=config.data.n_queries,
        n_candidates=config.data.n_candidates,
        n_samples=config.data.n_samples,
        positive_ratio=config.data.positive_ratio,
        random_state=config.data.random_state
    )
    
    print_data_statistics(query_ids, candidate_ids, labels)
    
    # Split data
    train_data, val_data, test_data = create_train_val_test_split(
        query_ids, candidate_ids, labels,
        train_size=config.data.train_size,
        val_size=config.data.val_size,
        random_state=config.data.random_state
    )
    
    # Create datasets and dataloaders
    train_dataset = TwoTowerDataset(*train_data)
    val_dataset = TwoTowerDataset(*val_data)
    test_dataset = TwoTowerDataset(*test_data)
    
    train_loader = DataLoader(train_dataset, batch_size=config.training.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=config.training.batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=config.training.batch_size, shuffle=False)
    
    print(f"\nTrain batches: {len(train_loader)}")
    print(f"Val batches: {len(val_loader)}")
    print(f"Test batches: {len(test_loader)}")
    
    # Create model
    model = TwoTowerModel(
        query_vocab_size=config.model.query_vocab_size,
        candidate_vocab_size=config.model.candidate_vocab_size,
        embedding_dim=config.model.embedding_dim,
        hidden_dims=config.model.hidden_dims,
        dropout_rate=config.model.dropout_rate,
        use_batch_norm=config.model.use_batch_norm
    )
    
    # Create trainer
    trainer = TwoTowerTrainer(
        model=model,
        device=config.training.device,
        learning_rate=config.training.learning_rate,
        weight_decay=config.training.weight_decay
    )
    
    # Train model
    trainer.train(
        train_loader=train_loader,
        val_loader=val_loader,
        epochs=config.training.epochs,
        early_stopping_patience=config.training.early_stopping_patience,
        save_path=config.model_save_path
    )
    
    # Evaluate on test set
    print("\nEvaluating on test set...")
    test_loss, test_auc = trainer.validate(test_loader)
    print(f"Test Loss: {test_loss:.4f}, Test AUC: {test_auc:.4f}")
    
    # Plot training history
    trainer.plot_training_history(config.plot_save_path)
    
    return model, trainer, (test_loss, test_auc)

def train_xgboost_model(config):
    """Train XGBoost two-tower model."""
    print("\n🌳 Training XGBoost Two-Tower Model")
    print("=" * 50)
    
    # Generate data
    print("Generating synthetic data...")
    query_ids, candidate_ids, labels = generate_synthetic_data(
        n_queries=config.data.n_queries,
        n_candidates=config.data.n_candidates,
        n_samples=config.data.n_samples,
        positive_ratio=config.data.positive_ratio,
        random_state=config.data.random_state
    )
    
    print_data_statistics(query_ids, candidate_ids, labels)
    
    # Split data
    train_data, val_data, test_data = create_train_val_test_split(
        query_ids, candidate_ids, labels,
        train_size=config.data.train_size,
        val_size=config.data.val_size,
        random_state=config.data.random_state
    )
    
    # Create model
    model = XGBoostTwoTowerModel(
        query_vocab_size=config.model.query_vocab_size,
        candidate_vocab_size=config.model.candidate_vocab_size,
        embedding_dim=config.model.embedding_dim,
        xgb_params=config.xgboost.params
    )
    
    # Train model
    print("Training XGBoost model...")
    model.fit(*train_data)
    
    # Evaluate
    train_predictions = model.predict(*train_data)
    test_predictions = model.predict(*test_data)
    
    from sklearn.metrics import roc_auc_score, log_loss
    
    train_auc = roc_auc_score(train_data[2], train_predictions)
    test_auc = roc_auc_score(test_data[2], test_predictions)
    train_loss = log_loss(train_data[2], train_predictions)
    test_loss = log_loss(test_data[2], test_predictions)
    
    print(f"Train AUC: {train_auc:.4f}, Train Loss: {train_loss:.4f}")
    print(f"Test AUC: {test_auc:.4f}, Test Loss: {test_loss:.4f}")
    
    return model, (test_loss, test_auc)

def demo_retrieval(model, config):
    """Demonstrate retrieval capabilities."""
    print("\n🔍 Retrieval Demonstration")
    print("=" * 50)
    
    if not isinstance(model, TwoTowerModel):
        print("Retrieval demo only available for PyTorch models")
        return
    
    # Generate some query and candidate embeddings
    with torch.no_grad():
        # Sample some queries and candidates
        query_ids = torch.randint(0, config.model.query_vocab_size, (5,))
        candidate_ids = torch.randint(0, config.model.candidate_vocab_size, (20,))
        
        query_embeddings = model.get_query_embedding(query_ids)
        candidate_embeddings = model.get_candidate_embedding(candidate_ids)
        
        print(f"Query embeddings shape: {query_embeddings.shape}")
        print(f"Candidate embeddings shape: {candidate_embeddings.shape}")
        
        # Compute similarities
        similarities = torch.mm(query_embeddings, candidate_embeddings.T)
        
        print("\nTop 3 candidates for each query:")
        for i, query_id in enumerate(query_ids):
            top_k_candidates = torch.topk(similarities[i], k=3)
            print(f"Query {query_id.item()}: {top_k_candidates.indices.tolist()} (scores: {top_k_candidates.values.tolist()})")

def main():
    """Main function."""
    print("🏗️  Two-Tower Model Training Pipeline")
    
    # Get configuration
    config = get_config()
    
    if config.verbose:
        print_config(config)
    
    # Train model based on configuration
    if config.use_xgboost:
        model, metrics = train_xgboost_model(config)
    else:
        model, trainer, metrics = train_pytorch_model(config)
        
        # Demo retrieval
        demo_retrieval(model, config)
    
    print(f"\n🎉 Training completed!")
    print(f"Final test metrics - Loss: {metrics[0]:.4f}, AUC: {metrics[1]:.4f}")

if __name__ == "__main__":
    main()
