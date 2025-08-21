#!/usr/bin/env python3
"""
Embedding Analyzer for Two-Tower Models

This script extracts, analyzes, and visualizes the 64-dimensional embeddings
from your two-tower model to understand what each dimension represents.
"""

import torch
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

from models.two_tower import TwoTowerModel, XGBoostTwoTowerModel
from utils.data_generator import generate_synthetic_data

class EmbeddingAnalyzer:
    """Analyze and visualize embeddings from two-tower models."""
    
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        np.random.seed(random_state)
        torch.manual_seed(random_state)
        
        # Set up plotting
        plt.style.use('default')
        sns.set_palette("husl")
    
    def extract_pytorch_embeddings(self, model: TwoTowerModel, sample_size: int = 100) -> Dict:
        """
        Extract embeddings from PyTorch two-tower model.
        
        Args:
            model: Trained TwoTowerModel
            sample_size: Number of samples to analyze
            
        Returns:
            Dictionary containing embeddings and metadata
        """
        print("🔍 Extracting PyTorch embeddings...")
        
        model.eval()
        
        # Generate sample data
        query_ids = torch.arange(min(sample_size, 100))  # Use actual user IDs
        candidate_ids = torch.arange(min(sample_size, 500))  # Use actual item IDs
        
        with torch.no_grad():
            # Get raw embeddings (before tower processing)
            raw_query_embs = model.query_embedding(query_ids)
            raw_candidate_embs = model.candidate_embedding(candidate_ids)
            
            # Get processed embeddings (after tower processing)
            query_embs = model.get_query_embedding(query_ids)
            candidate_embs = model.get_candidate_embedding(candidate_ids)
            
            # Get predictions
            predictions = model(query_ids, candidate_ids)
        
        return {
            'raw_query_embs': raw_query_embs.cpu().numpy(),
            'raw_candidate_embs': raw_candidate_embs.cpu().numpy(),
            'processed_query_embs': query_embs.cpu().numpy(),
            'processed_candidate_embs': candidate_embs.cpu().numpy(),
            'query_ids': query_ids.cpu().numpy(),
            'candidate_ids': candidate_ids.cpu().numpy(),
            'predictions': predictions.cpu().numpy(),
            'embedding_dim': model.embedding_dim
        }
    
    def analyze_embedding_dimensions(self, embeddings: Dict) -> Dict:
        """
        Analyze what each embedding dimension represents.
        
        Args:
            embeddings: Dictionary containing embedding data
            
        Returns:
            Dictionary containing dimension analysis
        """
        print("📊 Analyzing embedding dimensions...")
        
        raw_query = embeddings['raw_query_embs']
        raw_candidate = embeddings['raw_candidate_embs']
        processed_query = embeddings['processed_query_embs']
        processed_candidate = embeddings['processed_candidate_embs']
        
        # Analyze each dimension
        dimension_analysis = {}
        
        for dim in range(embeddings['embedding_dim']):
            # Raw embedding statistics
            query_dim_values = raw_query[:, dim]
            candidate_dim_values = raw_candidate[:, dim]
            
            # Processed embedding statistics
            proc_query_dim_values = processed_query[:, dim]
            proc_candidate_dim_values = processed_candidate[:, dim]
            
            dimension_analysis[dim] = {
                'raw_query_mean': np.mean(query_dim_values),
                'raw_query_std': np.std(query_dim_values),
                'raw_query_range': np.ptp(query_dim_values),
                'raw_candidate_mean': np.mean(candidate_dim_values),
                'raw_candidate_std': np.std(candidate_dim_values),
                'raw_candidate_range': np.ptp(candidate_dim_values),
                'processed_query_mean': np.mean(proc_query_dim_values),
                'processed_query_std': np.std(proc_query_dim_values),
                'processed_candidate_mean': np.mean(proc_candidate_dim_values),
                'processed_candidate_std': np.std(proc_candidate_dim_values),
                'query_candidate_correlation': np.corrcoef(query_dim_values, candidate_dim_values)[0, 1],
                'variance_ratio': np.var(query_dim_values) / (np.var(candidate_dim_values) + 1e-8)
            }
        
        return dimension_analysis
    
    def visualize_embedding_dimensions(self, embeddings: Dict, dimension_analysis: Dict):
        """
        Create comprehensive visualizations of embedding dimensions.
        
        Args:
            embeddings: Dictionary containing embedding data
            dimension_analysis: Dictionary containing dimension analysis
        """
        print("🎨 Creating embedding visualizations...")
        
        # 1. Dimension importance ranking
        self._plot_dimension_importance(dimension_analysis)
        
        # 2. Raw vs processed embeddings
        self._plot_raw_vs_processed(embeddings)
        
        # 3. Embedding heatmaps
        self._plot_embedding_heatmaps(embeddings)
        
        # 4. Dimension correlation analysis
        self._plot_dimension_correlations(embeddings)
        
        # 5. Individual dimension analysis
        self._plot_individual_dimensions(embeddings, dimension_analysis)
    
    def _plot_dimension_importance(self, dimension_analysis: Dict):
        """Plot dimension importance based on variance and correlation."""
        dims = list(dimension_analysis.keys())
        
        # Calculate importance scores
        importance_scores = []
        for dim in dims:
            analysis = dimension_analysis[dim]
            
            # Combine multiple factors for importance
            variance_score = (analysis['raw_query_std'] + analysis['raw_candidate_std']) / 2
            correlation_score = abs(analysis['query_candidate_correlation'])
            range_score = (analysis['raw_query_range'] + analysis['raw_candidate_range']) / 2
            
            # Weighted importance score
            importance = variance_score * 0.4 + correlation_score * 0.3 + range_score * 0.3
            importance_scores.append(importance)
        
        # Sort dimensions by importance
        sorted_indices = np.argsort(importance_scores)[::-1]
        sorted_dims = [dims[i] for i in sorted_indices]
        sorted_scores = [importance_scores[i] for i in sorted_indices]
        
        # Plot top dimensions
        plt.figure(figsize=(15, 8))
        
        # Top 20 dimensions
        top_n = min(20, len(sorted_dims))
        plt.subplot(1, 2, 1)
        plt.bar(range(top_n), sorted_scores[:top_n], color='skyblue', alpha=0.7)
        plt.title(f'Top {top_n} Most Important Dimensions')
        plt.xlabel('Dimension Rank')
        plt.ylabel('Importance Score')
        plt.xticks(range(top_n), [f'Dim {d}' for d in sorted_dims[:top_n]], rotation=45)
        
        # All dimensions
        plt.subplot(1, 2, 2)
        plt.plot(range(len(sorted_dims)), sorted_scores, 'b-', alpha=0.7)
        plt.title('Dimension Importance Ranking (All Dimensions)')
        plt.xlabel('Dimension Rank')
        plt.ylabel('Importance Score')
        plt.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('dimension_importance_ranking.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        # Print top dimensions
        print(f"\n🏆 Top 10 Most Important Dimensions:")
        for i in range(min(10, len(sorted_dims))):
            dim = sorted_dims[i]
            score = sorted_scores[i]
            analysis = dimension_analysis[dim]
            print(f"  {i+1:2d}. Dimension {dim:2d}: Score {score:.4f}")
            print(f"      Query std: {analysis['raw_query_std']:.4f}, Candidate std: {analysis['raw_candidate_std']:.4f}")
            print(f"      Correlation: {analysis['query_candidate_correlation']:.4f}")
    
    def _plot_raw_vs_processed(self, embeddings: Dict):
        """Compare raw embeddings vs processed embeddings."""
        raw_query = embeddings['raw_query_embs']
        processed_query = embeddings['processed_query_embs']
        
        plt.figure(figsize=(15, 10))
        
        # Query embeddings comparison
        plt.subplot(2, 2, 1)
        plt.scatter(raw_query[:, 0], raw_query[:, 1], alpha=0.6, label='Raw')
        plt.scatter(processed_query[:, 0], processed_query[:, 1], alpha=0.6, label='Processed')
        plt.title('Query Embeddings: Raw vs Processed (Dimensions 0 & 1)')
        plt.xlabel('Dimension 0')
        plt.ylabel('Dimension 1')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Candidate embeddings comparison
        plt.subplot(2, 2, 2)
        raw_candidate = embeddings['raw_candidate_embs']
        processed_candidate = embeddings['processed_candidate_embs']
        plt.scatter(raw_candidate[:, 0], raw_candidate[:, 1], alpha=0.6, label='Raw')
        plt.scatter(processed_candidate[:, 0], processed_candidate[:, 1], alpha=0.6, label='Processed')
        plt.title('Candidate Embeddings: Raw vs Processed (Dimensions 0 & 1)')
        plt.xlabel('Dimension 0')
        plt.ylabel('Dimension 1')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Distribution comparison
        plt.subplot(2, 2, 3)
        plt.hist(raw_query.flatten(), bins=50, alpha=0.7, label='Raw Query', density=True)
        plt.hist(processed_query.flatten(), bins=50, alpha=0.7, label='Processed Query', density=True)
        plt.title('Distribution: Raw vs Processed Query Embeddings')
        plt.xlabel('Embedding Value')
        plt.ylabel('Density')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        plt.subplot(2, 2, 4)
        plt.hist(raw_candidate.flatten(), bins=50, alpha=0.7, label='Raw Candidate', density=True)
        plt.hist(processed_candidate.flatten(), bins=50, alpha=0.7, label='Processed Candidate', density=True)
        plt.title('Distribution: Raw vs Processed Candidate Embeddings')
        plt.xlabel('Embedding Value')
        plt.ylabel('Density')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('raw_vs_processed_embeddings.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def _plot_embedding_heatmaps(self, embeddings: Dict):
        """Create heatmaps of embedding matrices."""
        raw_query = embeddings['raw_query_embs']
        raw_candidate = embeddings['raw_candidate_embs']
        
        plt.figure(figsize=(20, 8))
        
        # Query embeddings heatmap
        plt.subplot(1, 2, 1)
        sns.heatmap(raw_query.T, cmap='RdBu_r', center=0, 
                   xticklabels=embeddings['query_ids'][::10], 
                   yticklabels=range(embeddings['embedding_dim']),
                   cbar_kws={'label': 'Embedding Value'})
        plt.title('Query Embeddings Heatmap (Users × Dimensions)')
        plt.xlabel('User ID')
        plt.ylabel('Embedding Dimension')
        
        # Candidate embeddings heatmap
        plt.subplot(1, 2, 2)
        sns.heatmap(raw_candidate.T, cmap='RdBu_r', center=0,
                   xticklabels=embeddings['candidate_ids'][::10],
                   yticklabels=range(embeddings['embedding_dim']),
                   cbar_kws={'label': 'Embedding Value'})
        plt.title('Candidate Embeddings Heatmap (Items × Dimensions)')
        plt.xlabel('Item ID')
        plt.ylabel('Embedding Dimension')
        
        plt.tight_layout()
        plt.savefig('embedding_heatmaps.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def _plot_dimension_correlations(self, embeddings: Dict):
        """Analyze correlations between embedding dimensions."""
        raw_query = embeddings['raw_query_embs']
        raw_candidate = embeddings['raw_candidate_embs']
        
        # Query dimension correlations
        query_corr = np.corrcoef(raw_query.T)
        candidate_corr = np.corrcoef(raw_candidate.T)
        
        plt.figure(figsize=(20, 8))
        
        plt.subplot(1, 2, 1)
        sns.heatmap(query_corr, cmap='RdBu_r', center=0, 
                   xticklabels=range(embeddings['embedding_dim']),
                   yticklabels=range(embeddings['embedding_dim']),
                   cbar_kws={'label': 'Correlation'})
        plt.title('Query Embedding Dimension Correlations')
        plt.xlabel('Dimension')
        plt.ylabel('Dimension')
        
        plt.subplot(1, 2, 2)
        sns.heatmap(candidate_corr, cmap='RdBu_r', center=0,
                   xticklabels=range(embeddings['embedding_dim']),
                   yticklabels=range(embeddings['embedding_dim']),
                   cbar_kws={'label': 'Correlation'})
        plt.title('Candidate Embedding Dimension Correlations')
        plt.xlabel('Dimension')
        plt.ylabel('Dimension')
        
        plt.tight_layout()
        plt.savefig('dimension_correlations.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def _plot_individual_dimensions(self, embeddings: Dict, dimension_analysis: Dict):
        """Analyze individual dimensions in detail."""
        raw_query = embeddings['raw_query_embs']
        raw_candidate = embeddings['raw_candidate_embs']
        
        # Select top 8 dimensions for detailed analysis
        top_dims = sorted(dimension_analysis.keys(), 
                         key=lambda x: dimension_analysis[x]['raw_query_std'] + 
                                      dimension_analysis[x]['raw_candidate_std'])[-8:]
        
        fig, axes = plt.subplots(2, 4, figsize=(20, 10))
        axes = axes.flatten()
        
        for i, dim in enumerate(top_dims):
            analysis = dimension_analysis[dim]
            
            # Plot distribution for this dimension
            axes[i].hist(raw_query[:, dim], bins=20, alpha=0.7, label='Users', density=True)
            axes[i].hist(raw_candidate[:, dim], bins=20, alpha=0.7, label='Items', density=True)
            axes[i].set_title(f'Dimension {dim}\nQuery std: {analysis["raw_query_std"]:.3f}\nCandidate std: {analysis["raw_candidate_std"]:.3f}')
            axes[i].set_xlabel('Value')
            axes[i].set_ylabel('Density')
            axes[i].legend()
            axes[i].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig('individual_dimension_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def export_embedding_data(self, embeddings: Dict, dimension_analysis: Dict, filename: str = 'embedding_analysis.csv'):
        """Export embedding analysis to CSV for further analysis."""
        print(f"💾 Exporting embedding data to {filename}...")
        
        # Create DataFrame with dimension analysis
        analysis_data = []
        for dim in range(embeddings['embedding_dim']):
            analysis = dimension_analysis[dim]
            row = {
                'dimension': dim,
                'raw_query_mean': analysis['raw_query_mean'],
                'raw_query_std': analysis['raw_query_std'],
                'raw_query_range': analysis['raw_query_range'],
                'raw_candidate_mean': analysis['raw_candidate_mean'],
                'raw_candidate_std': analysis['raw_candidate_std'],
                'raw_candidate_range': analysis['raw_candidate_range'],
                'processed_query_mean': analysis['processed_query_mean'],
                'processed_query_std': analysis['processed_query_std'],
                'processed_candidate_mean': analysis['processed_candidate_mean'],
                'processed_candidate_std': analysis['processed_candidate_std'],
                'query_candidate_correlation': analysis['query_candidate_correlation'],
                'variance_ratio': analysis['variance_ratio']
            }
            analysis_data.append(row)
        
        # Create DataFrame and save
        df = pd.DataFrame(analysis_data)
        df.to_csv(filename, index=False)
        print(f"✅ Data exported to {filename}")
        
        # Also save raw embeddings
        np.save('raw_query_embeddings.npy', embeddings['raw_query_embs'])
        np.save('raw_candidate_embeddings.npy', embeddings['raw_candidate_embs'])
        np.save('processed_query_embeddings.npy', embeddings['processed_query_embs'])
        np.save('processed_candidate_embeddings.npy', embeddings['processed_candidate_embs'])
        print("✅ Raw embeddings saved as .npy files")
        
        return df
    
    def interpret_dimensions(self, embeddings: Dict, dimension_analysis: Dict) -> Dict:
        """
        Provide human-readable interpretation of what each dimension might represent.
        
        Args:
            embeddings: Dictionary containing embedding data
            dimension_analysis: Dictionary containing dimension analysis
            
        Returns:
            Dictionary containing dimension interpretations
        """
        print("🧠 Interpreting embedding dimensions...")
        
        interpretations = {}
        
        for dim in range(embeddings['embedding_dim']):
            analysis = dimension_analysis[dim]
            
            # Analyze patterns to suggest what this dimension represents
            query_std = analysis['raw_query_std']
            candidate_std = analysis['raw_candidate_std']
            correlation = analysis['query_candidate_correlation']
            variance_ratio = analysis['variance_ratio']
            
            # Determine dimension type
            if query_std > candidate_std * 2:
                dimension_type = "User-focused"
                description = "This dimension primarily differentiates between users"
            elif candidate_std > query_std * 2:
                dimension_type = "Item-focused"
                description = "This dimension primarily differentiates between items"
            else:
                dimension_type = "Balanced"
                description = "This dimension affects both users and items similarly"
            
            # Determine importance level
            total_variance = query_std + candidate_std
            if total_variance > 0.5:
                importance = "High"
            elif total_variance > 0.2:
                importance = "Medium"
            else:
                importance = "Low"
            
            # Suggest what it might represent
            if abs(correlation) > 0.3:
                if correlation > 0:
                    relationship = "Users and items with high values in this dimension tend to match well"
                else:
                    relationship = "Users and items with opposite values in this dimension tend to match well"
            else:
                relationship = "This dimension doesn't show strong user-item correlation"
            
            interpretations[dim] = {
                'type': dimension_type,
                'importance': importance,
                'description': description,
                'relationship': relationship,
                'query_std': query_std,
                'candidate_std': candidate_std,
                'correlation': correlation,
                'total_variance': total_variance
            }
        
        return interpretations
    
    def print_dimension_summary(self, interpretations: Dict):
        """Print a human-readable summary of dimension interpretations."""
        print("\n📋 Dimension Interpretation Summary")
        print("=" * 80)
        
        # Group by type
        user_focused = []
        item_focused = []
        balanced = []
        
        for dim, interpretation in interpretations.items():
            if interpretation['type'] == "User-focused":
                user_focused.append((dim, interpretation))
            elif interpretation['type'] == "Item-focused":
                item_focused.append((dim, interpretation))
            else:
                balanced.append((dim, interpretation))
        
        # Sort by importance within each group
        for group in [user_focused, item_focused, balanced]:
            group.sort(key=lambda x: x[1]['total_variance'], reverse=True)
        
        print(f"\n👥 USER-FOCUSED DIMENSIONS ({len(user_focused)} dimensions):")
        print("-" * 50)
        for dim, interpretation in user_focused[:10]:  # Top 10
            print(f"  Dimension {dim:2d} ({interpretation['importance']}): {interpretation['description']}")
            print(f"    User variance: {interpretation['query_std']:.4f}, Correlation: {interpretation['correlation']:.3f}")
        
        print(f"\n🛍️  ITEM-FOCUSED DIMENSIONS ({len(item_focused)} dimensions):")
        print("-" * 50)
        for dim, interpretation in item_focused[:10]:  # Top 10
            print(f"  Dimension {dim:2d} ({interpretation['importance']}): {interpretation['description']}")
            print(f"    Item variance: {interpretation['candidate_std']:.4f}, Correlation: {interpretation['correlation']:.3f}")
        
        print(f"\n⚖️  BALANCED DIMENSIONS ({len(balanced)} dimensions):")
        print("-" * 50)
        for dim, interpretation in balanced[:10]:  # Top 10
            print(f"  Dimension {dim:2d} ({interpretation['importance']}): {interpretation['description']}")
            print(f"    Total variance: {interpretation['total_variance']:.4f}, Correlation: {interpretation['correlation']:.3f}")

def main():
    """Run comprehensive embedding analysis."""
    print("🔍 Embedding Analysis for Two-Tower Models")
    print("=" * 50)
    
    # Initialize analyzer
    analyzer = EmbeddingAnalyzer(random_state=42)
    
    try:
        # 1. Create and analyze PyTorch model
        print("\n1️⃣ Creating PyTorch model for analysis...")
        pytorch_model = TwoTowerModel(
            query_vocab_size=100,
            candidate_vocab_size=500,
            embedding_dim=64,
            hidden_dims=[128, 64]
        )
        
        # Initialize weights for analysis
        pytorch_model.apply(lambda m: m.weight.data.normal_(0, 0.1) if hasattr(m, 'weight') else None)
        
        # 2. Extract embeddings
        print("\n2️⃣ Extracting embeddings...")
        embeddings = analyzer.extract_pytorch_embeddings(pytorch_model, sample_size=100)
        
        # 3. Analyze dimensions
        print("\n3️⃣ Analyzing embedding dimensions...")
        dimension_analysis = analyzer.analyze_embedding_dimensions(embeddings)
        
        # 4. Create visualizations
        print("\n4️⃣ Creating visualizations...")
        analyzer.visualize_embedding_dimensions(embeddings, dimension_analysis)
        
        # 5. Interpret dimensions
        print("\n5️⃣ Interpreting dimensions...")
        interpretations = analyzer.interpret_dimensions(embeddings, dimension_analysis)
        analyzer.print_dimension_summary(interpretations)
        
        # 6. Export data
        print("\n6️⃣ Exporting analysis data...")
        df = analyzer.export_embedding_data(embeddings, dimension_analysis)
        
        print("\n" + "=" * 60)
        print("✅ Embedding analysis completed successfully!")
        print("\n📁 Generated files:")
        print("  • dimension_importance_ranking.png")
        print("  • raw_vs_processed_embeddings.png")
        print("  • embedding_heatmaps.png")
        print("  • dimension_correlations.png")
        print("  • individual_dimension_analysis.png")
        print("  • embedding_analysis.csv")
        print("  • *.npy files (raw embedding data)")
        print("\n🚀 Next steps:")
        print("  • Review visualizations to understand dimension patterns")
        print("  • Use CSV data for further analysis")
        print("  • Apply insights to optimize your model architecture")
        
    except Exception as e:
        print(f"\n❌ Embedding analysis failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
