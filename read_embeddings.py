#!/usr/bin/env python3
"""
Simple Embedding Reader for Two-Tower Models

This script helps you read and interpret individual embedding values
from your two-tower model in a human-readable format.
"""

import torch
import numpy as np
import pandas as pd
from models.two_tower import TwoTowerModel

def read_user_embedding(model: TwoTowerModel, user_id: int) -> dict:
    """
    Read and interpret a specific user's embedding.
    
    Args:
        model: Your trained TwoTowerModel
        user_id: The user ID to analyze
        
    Returns:
        Dictionary containing embedding analysis
    """
    model.eval()
    
    with torch.no_grad():
        # Get raw embedding (before tower processing)
        raw_emb = model.query_embedding(torch.tensor([user_id]))
        
        # Get processed embedding (after tower processing)
        processed_emb = model.get_query_embedding(torch.tensor([user_id]))
        
        # Convert to numpy
        raw_values = raw_emb.cpu().numpy().flatten()
        processed_values = processed_emb.cpu().numpy().flatten()
        
        # Analyze the embedding
        analysis = {
            'user_id': user_id,
            'raw_embedding': raw_values,
            'processed_embedding': processed_values,
            'raw_stats': {
                'mean': np.mean(raw_values),
                'std': np.std(raw_values),
                'min': np.min(raw_values),
                'max': np.max(raw_values),
                'range': np.ptp(raw_values)
            },
            'processed_stats': {
                'mean': np.mean(processed_values),
                'std': np.std(processed_values),
                'min': np.min(processed_values),
                'max': np.max(processed_values),
                'range': np.ptp(processed_values)
            }
        }
        
        return analysis

def read_item_embedding(model: TwoTowerModel, item_id: int) -> dict:
    """
    Read and interpret a specific item's embedding.
    
    Args:
        model: Your trained TwoTowerModel
        item_id: The item ID to analyze
        
    Returns:
        Dictionary containing embedding analysis
    """
    model.eval()
    
    with torch.no_grad():
        # Get raw embedding (before tower processing)
        raw_emb = model.candidate_embedding(torch.tensor([item_id]))
        
        # Get processed embedding (after tower processing)
        processed_emb = model.get_candidate_embedding(torch.tensor([item_id]))
        
        # Convert to numpy
        raw_values = raw_emb.cpu().numpy().flatten()
        processed_values = processed_emb.cpu().numpy().flatten()
        
        # Analyze the embedding
        analysis = {
            'item_id': item_id,
            'raw_embedding': raw_values,
            'processed_embedding': processed_values,
            'raw_stats': {
                'mean': np.mean(raw_values),
                'std': np.std(raw_values),
                'min': np.min(raw_values),
                'max': np.max(raw_values),
                'range': np.ptp(raw_values)
            },
            'processed_stats': {
                'mean': np.mean(processed_values),
                'std': np.std(processed_values),
                'min': np.min(processed_values),
                'max': np.max(processed_values),
                'range': np.ptp(processed_values)
            }
        }
        
        return analysis

def compare_embeddings(model: TwoTowerModel, user_id: int, item_id: int) -> dict:
    """
    Compare a user and item embedding to understand their similarity.
    
    Args:
        model: Your trained TwoTowerModel
        user_id: The user ID to analyze
        item_id: The item ID to analyze
        
    Returns:
        Dictionary containing comparison analysis
    """
    user_analysis = read_user_embedding(model, user_id)
    item_analysis = read_item_embedding(model, item_id)
    
    # Get similarity score
    with torch.no_grad():
        similarity = model(torch.tensor([user_id]), torch.tensor([item_id]))
        similarity_score = similarity.item()
    
    # Calculate embedding similarity
    user_processed = user_analysis['processed_embedding']
    item_processed = item_analysis['processed_embedding']
    
    # Cosine similarity
    cos_sim = np.dot(user_processed, item_processed) / (np.linalg.norm(user_processed) * np.linalg.norm(item_processed))
    
    # Euclidean distance
    euclidean_dist = np.linalg.norm(user_processed - item_processed)
    
    # Dimension-wise analysis
    dimension_analysis = []
    for dim in range(len(user_processed)):
        user_val = user_processed[dim]
        item_val = item_processed[dim]
        diff = abs(user_val - item_val)
        
        dimension_analysis.append({
            'dimension': dim,
            'user_value': user_val,
            'item_value': item_val,
            'difference': diff,
            'contribution': user_val * item_val  # How this dimension contributes to similarity
        })
    
    # Sort by contribution (most important dimensions first)
    dimension_analysis.sort(key=lambda x: abs(x['contribution']), reverse=True)
    
    comparison = {
        'user_id': user_id,
        'item_id': item_id,
        'model_similarity': similarity_score,
        'cosine_similarity': cos_sim,
        'euclidean_distance': euclidean_dist,
        'user_embedding': user_analysis,
        'item_embedding': item_analysis,
        'dimension_analysis': dimension_analysis,
        'top_contributing_dimensions': dimension_analysis[:10]  # Top 10 dimensions
    }
    
    return comparison

def print_embedding_analysis(analysis: dict, analysis_type: str = "user"):
    """
    Print embedding analysis in a human-readable format.
    
    Args:
        analysis: Analysis dictionary from read_user_embedding or read_item_embedding
        analysis_type: "user" or "item"
    """
    if analysis_type == "user":
        print(f"👤 USER {analysis['user_id']} EMBEDDING ANALYSIS")
    else:
        print(f"🛍️  ITEM {analysis['item_id']} EMBEDDING ANALYSIS")
    
    print("=" * 60)
    
    # Raw embedding stats
    print("📊 RAW EMBEDDING STATISTICS:")
    raw_stats = analysis['raw_stats']
    print(f"  Mean: {raw_stats['mean']:.6f}")
    print(f"  Std:  {raw_stats['std']:.6f}")
    print(f"  Min:  {raw_stats['min']:.6f}")
    print(f"  Max:  {raw_stats['max']:.6f}")
    print(f"  Range: {raw_stats['range']:.6f}")
    
    # Processed embedding stats
    print("\n🔧 PROCESSED EMBEDDING STATISTICS:")
    proc_stats = analysis['processed_stats']
    print(f"  Mean: {proc_stats['mean']:.6f}")
    print(f"  Std:  {proc_stats['std']:.6f}")
    print(f"  Min:  {proc_stats['min']:.6f}")
    print(f"  Max:  {proc_stats['max']:.6f}")
    print(f"  Range: {proc_stats['range']:.6f}")
    
    # Top and bottom dimensions
    raw_emb = analysis['raw_embedding']
    top_dims = np.argsort(raw_emb)[-5:]  # Top 5 dimensions
    bottom_dims = np.argsort(raw_emb)[:5]  # Bottom 5 dimensions
    
    print(f"\n🏆 TOP 5 DIMENSIONS (highest values):")
    for i, dim in enumerate(top_dims):
        print(f"  {i+1}. Dimension {dim:2d}: {raw_emb[dim]:.6f}")
    
    print(f"\n📉 BOTTOM 5 DIMENSIONS (lowest values):")
    for i, dim in enumerate(bottom_dims):
        print(f"  {i+1}. Dimension {dim:2d}: {raw_emb[dim]:.6f}")
    
    # Show all dimensions in a table format
    print(f"\n📋 ALL 64 DIMENSIONS:")
    print("-" * 80)
    print("Dim | Raw Value    | Processed | Dim | Raw Value    | Processed")
    print("-" * 80)
    
    for i in range(0, 64, 2):
        if i + 1 < 64:
            print(f"{i:3d} | {raw_emb[i]:11.6f} | {analysis['processed_embedding'][i]:9.6f} | {i+1:3d} | {raw_emb[i+1]:11.6f} | {analysis['processed_embedding'][i+1]:9.6f}")
        else:
            print(f"{i:3d} | {raw_emb[i]:11.6f} | {analysis['processed_embedding'][i]:9.6f} |")

def print_comparison_analysis(comparison: dict):
    """
    Print comparison analysis between user and item.
    
    Args:
        comparison: Comparison dictionary from compare_embeddings
    """
    print(f"🔍 USER {comparison['user_id']} vs ITEM {comparison['item_id']} COMPARISON")
    print("=" * 80)
    
    # Similarity scores
    print("📊 SIMILARITY SCORES:")
    print(f"  Model Similarity: {comparison['model_similarity']:.6f}")
    print(f"  Cosine Similarity: {comparison['cosine_similarity']:.6f}")
    print(f"  Euclidean Distance: {comparison['euclidean_distance']:.6f}")
    
    # Top contributing dimensions
    print(f"\n🏆 TOP 10 CONTRIBUTING DIMENSIONS:")
    print("-" * 80)
    print("Rank | Dim | User Value | Item Value | Difference | Contribution")
    print("-" * 80)
    
    for i, dim_analysis in enumerate(comparison['top_contributing_dimensions']):
        print(f"{i+1:4d} | {dim_analysis['dimension']:3d} | {dim_analysis['user_value']:10.6f} | {dim_analysis['item_value']:10.6f} | {dim_analysis['difference']:10.6f} | {dim_analysis['contribution']:11.6f}")
    
    # Dimension patterns
    print(f"\n📈 DIMENSION PATTERNS:")
    
    # Find dimensions where user and item are similar
    similar_dims = [d for d in comparison['dimension_analysis'] if d['difference'] < 0.1]
    print(f"  Similar dimensions (diff < 0.1): {len(similar_dims)}")
    
    # Find dimensions where user and item are different
    different_dims = [d for d in comparison['dimension_analysis'] if d['difference'] > 0.3]
    print(f"  Different dimensions (diff > 0.3): {len(different_dims)}")
    
    # Find dimensions with high contribution
    high_contrib_dims = [d for d in comparison['dimension_analysis'] if abs(d['contribution']) > 0.01]
    print(f"  High contribution dimensions (|contrib| > 0.01): {len(high_contrib_dims)}")

def main():
    """Interactive embedding reader."""
    print("🔍 Interactive Embedding Reader for Two-Tower Models")
    print("=" * 60)
    
    # Create a sample model
    model = TwoTowerModel(
        query_vocab_size=100,
        candidate_vocab_size=500,
        embedding_dim=64,
        hidden_dims=[128, 64]
    )
    
    # Initialize weights
    model.apply(lambda m: m.weight.data.normal_(0, 0.1) if hasattr(m, 'weight') else None)
    
    while True:
        print("\n📋 Available Commands:")
        print("  1. Read user embedding")
        print("  2. Read item embedding")
        print("  3. Compare user and item")
        print("  4. Exit")
        
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == '1':
            try:
                user_id = int(input("Enter user ID (0-99): "))
                if 0 <= user_id <= 99:
                    analysis = read_user_embedding(model, user_id)
                    print_embedding_analysis(analysis, "user")
                else:
                    print("❌ User ID must be between 0 and 99")
            except ValueError:
                print("❌ Please enter a valid number")
        
        elif choice == '2':
            try:
                item_id = int(input("Enter item ID (0-499): "))
                if 0 <= item_id <= 499:
                    analysis = read_item_embedding(model, item_id)
                    print_embedding_analysis(analysis, "item")
                else:
                    print("❌ Item ID must be between 0 and 499")
            except ValueError:
                print("❌ Please enter a valid number")
        
        elif choice == '3':
            try:
                user_id = int(input("Enter user ID (0-99): "))
                item_id = int(input("Enter item ID (0-499): "))
                if 0 <= user_id <= 99 and 0 <= item_id <= 499:
                    comparison = compare_embeddings(model, user_id, item_id)
                    print_comparison_analysis(comparison)
                else:
                    print("❌ User ID must be 0-99, Item ID must be 0-499")
            except ValueError:
                print("❌ Please enter valid numbers")
        
        elif choice == '4':
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice. Please enter 1, 2, 3, or 4.")

if __name__ == "__main__":
    main()
