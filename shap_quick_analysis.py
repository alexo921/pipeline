#!/usr/bin/env python3
"""
Quick SHAP Analysis for Two-Tower Models

This script provides focused SHAP analysis for specific use cases:
1. Model comparison
2. Feature importance analysis
3. Individual prediction explanations
4. Model debugging
"""

import numpy as np
import torch
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Optional
import warnings
warnings.filterwarnings('ignore')

try:
    import shap
except ImportError:
    print("SHAP not found. Please install with: pip install shap")
    exit(1)

from models.two_tower import TwoTowerModel, XGBoostTwoTowerModel
from utils.data_generator import generate_synthetic_data

class QuickSHAPAnalyzer:
    """Quick SHAP analysis for specific use cases."""
    
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        np.random.seed(random_state)
        torch.manual_seed(random_state)
        
        # Set up plotting
        plt.style.use('default')
        sns.set_palette("husl")
    
    def analyze_model_comparison(self, models: Dict[str, object], sample_size: int = 50):
        """
        Compare SHAP values across different models.
        
        Args:
            models: Dictionary of model_name: model_object
            sample_size: Number of samples to analyze
        """
        print("🔍 Comparing SHAP values across models...")
        
        results = {}
        
        for name, model in models.items():
            print(f"  Analyzing {name}...")
            
            if isinstance(model, TwoTowerModel):
                result = self._analyze_pytorch_quick(model, sample_size)
            elif isinstance(model, XGBoostTwoTowerModel):
                result = self._analyze_xgboost_quick(model, sample_size)
            else:
                print(f"  ⚠️  Unknown model type for {name}")
                continue
            
            results[name] = result
        
        # Compare results
        self._compare_model_results(results)
        return results
    
    def _analyze_pytorch_quick(self, model: TwoTowerModel, sample_size: int) -> Dict:
        """Quick PyTorch model analysis."""
        model.eval()
        
        # Generate sample data
        query_ids = torch.randint(0, 100, (sample_size,))
        candidate_ids = torch.randint(0, 500, (sample_size,))
        
        # Get embeddings and compute importance
        with torch.no_grad():
            query_embs = model.get_query_embedding(query_ids)
            candidate_embs = model.get_candidate_embedding(candidate_ids)
            
            # Compute feature importance based on embedding variance
            query_importance = torch.var(query_embs, dim=0).cpu().numpy()
            candidate_importance = torch.var(candidate_embs, dim=0).cpu().numpy()
            
            # Compute predictions
            predictions = model(query_ids, candidate_ids).cpu().numpy()
        
        return {
            'query_importance': query_importance,
            'candidate_importance': candidate_importance,
            'predictions': predictions,
            'model_type': 'pytorch'
        }
    
    def _analyze_xgboost_quick(self, model: XGBoostTwoTowerModel, sample_size: int) -> Dict:
        """Quick XGBoost model analysis."""
        if model.model is None:
            print("    Training XGBoost model...")
            self._train_xgboost_quick(model, sample_size)
        
        # Generate sample data
        query_ids = np.random.randint(0, 50, sample_size)
        candidate_ids = np.random.randint(0, 200, sample_size)
        
        # Create features
        X = model._create_features(query_ids, candidate_ids)
        
        # Get SHAP values
        explainer = shap.TreeExplainer(model.model)
        shap_values = explainer.shap_values(X)
        
        # Get predictions
        predictions = model.predict(query_ids, candidate_ids)
        
        return {
            'shap_values': shap_values,
            'predictions': predictions,
            'feature_data': X,
            'model_type': 'xgboost'
        }
    
    def _train_xgboost_quick(self, model: XGBoostTwoTowerModel, sample_size: int):
        """Quick training for XGBoost model."""
        query_ids, candidate_ids, labels = generate_synthetic_data(
            n_queries=50,
            n_candidates=200,
            n_samples=sample_size * 2,
            positive_ratio=0.25,
            random_state=self.random_state
        )
        
        model.fit(query_ids, candidate_ids, labels)
    
    def _compare_model_results(self, results: Dict):
        """Compare results across models."""
        print("\n📊 Model Comparison Results:")
        print("-" * 40)
        
        for name, result in results.items():
            print(f"\n{name.upper()}:")
            
            if result['model_type'] == 'pytorch':
                query_imp = np.mean(result['query_importance'])
                candidate_imp = np.mean(result['candidate_importance'])
                pred_mean = np.mean(result['predictions'])
                pred_std = np.std(result['predictions'])
                
                print(f"  Query Tower Importance: {query_imp:.4f}")
                print(f"  Candidate Tower Importance: {candidate_imp:.4f}")
                print(f"  Predictions: {pred_mean:.4f} ± {pred_std:.4f}")
                
            elif result['model_type'] == 'xgboost':
                shap_mean = np.mean(np.abs(result['shap_values']))
                pred_mean = np.mean(result['predictions'])
                pred_std = np.std(result['predictions'])
                
                print(f"  Mean |SHAP|: {shap_mean:.4f}")
                print(f"  Predictions: {pred_mean:.4f} ± {pred_std:.4f}")
    
    def analyze_feature_importance(self, model, model_type: str, sample_size: int = 100):
        """
        Analyze feature importance for a specific model.
        
        Args:
            model: The model to analyze
            model_type: 'pytorch' or 'xgboost'
            sample_size: Number of samples to analyze
        """
        print(f"🔍 Analyzing feature importance for {model_type.upper()} model...")
        
        if model_type == 'pytorch':
            return self._analyze_pytorch_features(model, sample_size)
        elif model_type == 'xgboost':
            return self._analyze_xgboost_features(model, sample_size)
        else:
            print(f"❌ Unknown model type: {model_type}")
            return None
    
    def _analyze_pytorch_features(self, model: TwoTowerModel, sample_size: int):
        """Analyze PyTorch model features."""
        model.eval()
        
        # Generate data
        query_ids = torch.randint(0, 100, (sample_size,))
        candidate_ids = torch.randint(0, 500, (sample_size,))
        
        with torch.no_grad():
            # Get embeddings
            query_embs = model.get_query_embedding(query_ids)
            candidate_embs = model.get_candidate_embedding(candidate_ids)
            
            # Analyze embedding dimensions
            query_var = torch.var(query_embs, dim=0)
            candidate_var = torch.var(candidate_embs, dim=0)
            
            # Analyze tower weights
            query_weights = []
            candidate_weights = []
            
            for name, param in model.named_parameters():
                if 'query_tower' in name and 'weight' in name:
                    query_weights.append(param.data.abs().mean().item())
                elif 'candidate_tower' in name and 'weight' in name:
                    candidate_weights.append(param.data.abs().mean().item())
            
            # Create visualization
            self._plot_pytorch_analysis(query_var, candidate_var, query_weights, candidate_weights)
            
            return {
                'query_variance': query_var.cpu().numpy(),
                'candidate_variance': candidate_var.cpu().numpy(),
                'query_weights': query_weights,
                'candidate_weights': candidate_weights
            }
    
    def _analyze_xgboost_features(self, model: XGBoostTwoTowerModel, sample_size: int):
        """Analyze XGBoost model features."""
        if model.model is None:
            self._train_xgboost_quick(model, sample_size)
        
        # Generate data
        query_ids = np.random.randint(0, 50, sample_size)
        candidate_ids = np.random.randint(0, 200, sample_size)
        X = model._create_features(query_ids, candidate_ids)
        
        # Get SHAP values
        explainer = shap.TreeExplainer(model.model)
        shap_values = explainer.shap_values(X)
        
        # Get feature names
        feature_names = self._get_feature_names(model.embedding_dim)
        
        # Create visualization
        self._plot_xgboost_analysis(shap_values, X, feature_names)
        
        return {
            'shap_values': shap_values,
            'feature_names': feature_names,
            'feature_data': X
        }
    
    def _get_feature_names(self, embedding_dim: int) -> List[str]:
        """Get feature names for XGBoost model."""
        names = []
        
        # Query embeddings
        for i in range(embedding_dim):
            names.append(f"query_{i}")
        
        # Candidate embeddings
        for i in range(embedding_dim):
            names.append(f"candidate_{i}")
        
        # Product features
        for i in range(embedding_dim):
            names.append(f"product_{i}")
        
        # Difference features
        for i in range(embedding_dim):
            names.append(f"diff_{i}")
        
        return names
    
    def _plot_pytorch_analysis(self, query_var, candidate_var, query_weights, candidate_weights):
        """Plot PyTorch analysis results."""
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # Query embedding variance
        axes[0, 0].plot(query_var.cpu().numpy(), 'b-', alpha=0.7)
        axes[0, 0].set_title('Query Embedding Variance')
        axes[0, 0].set_xlabel('Dimension')
        axes[0, 0].set_ylabel('Variance')
        
        # Candidate embedding variance
        axes[0, 1].plot(candidate_var.cpu().numpy(), 'r-', alpha=0.7)
        axes[0, 1].set_title('Candidate Embedding Variance')
        axes[0, 1].set_xlabel('Dimension')
        axes[0, 1].set_ylabel('Variance')
        
        # Query tower weights
        if query_weights:
            axes[1, 0].bar(range(len(query_weights)), query_weights, alpha=0.7, color='skyblue')
            axes[1, 0].set_title('Query Tower Weight Magnitudes')
            axes[1, 0].set_xlabel('Layer')
            axes[1, 0].set_ylabel('Weight Magnitude')
        
        # Candidate tower weights
        if candidate_weights:
            axes[1, 1].bar(range(len(candidate_weights)), candidate_weights, alpha=0.7, color='lightcoral')
            axes[1, 1].set_title('Candidate Tower Weight Magnitudes')
            axes[1, 1].set_xlabel('Layer')
            axes[1, 1].set_ylabel('Weight Magnitude')
        
        plt.tight_layout()
        plt.savefig('pytorch_feature_analysis.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def _plot_xgboost_analysis(self, shap_values, feature_data, feature_names):
        """Plot XGBoost analysis results."""
        # Summary plot
        plt.figure(figsize=(12, 8))
        shap.summary_plot(shap_values, feature_data, feature_names=feature_names, show=False)
        plt.title("XGBoost Feature Importance Summary")
        plt.tight_layout()
        plt.savefig('xgboost_feature_summary.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        # Bar plot of mean absolute SHAP values
        mean_shap = np.mean(np.abs(shap_values), axis=0)
        top_features = np.argsort(mean_shap)[-20:]  # Top 20 features
        
        plt.figure(figsize=(12, 8))
        plt.barh(range(len(top_features)), mean_shap[top_features])
        plt.yticks(range(len(top_features)), [feature_names[i] for i in top_features])
        plt.xlabel('Mean |SHAP Value|')
        plt.title('Top 20 Most Important Features')
        plt.tight_layout()
        plt.savefig('xgboost_top_features.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def explain_individual_prediction(self, model, model_type: str, query_id, candidate_id):
        """
        Explain an individual prediction.
        
        Args:
            model: The model to use
            model_type: 'pytorch' or 'xgboost'
            query_id: Query/User ID
            candidate_id: Candidate/Item ID
        """
        print(f"🔍 Explaining prediction for Query {query_id} → Candidate {candidate_id}")
        
        if model_type == 'pytorch':
            return self._explain_pytorch_prediction(model, query_id, candidate_id)
        elif model_type == 'xgboost':
            return self._explain_xgboost_prediction(model, query_id, candidate_id)
        else:
            print(f"❌ Unknown model type: {model_type}")
            return None
    
    def _explain_pytorch_prediction(self, model: TwoTowerModel, query_id, candidate_id):
        """Explain PyTorch model prediction."""
        model.eval()
        
        with torch.no_grad():
            # Get embeddings
            query_emb = model.get_query_embedding(torch.tensor([query_id]))
            candidate_emb = model.get_candidate_embedding(torch.tensor([candidate_id]))
            
            # Get prediction
            prediction = model(torch.tensor([query_id]), torch.tensor([candidate_id]))
            
            # Analyze embedding contributions
            query_norm = torch.norm(query_emb, dim=1)
            candidate_norm = torch.norm(candidate_emb, dim=1)
            
            # Compute similarity components
            similarity = torch.sum(query_emb * candidate_emb, dim=1)
            
            print(f"  Prediction: {prediction.item():.4f}")
            print(f"  Query Embedding Norm: {query_norm.item():.4f}")
            print(f"  Candidate Embedding Norm: {candidate_norm.item():.4f}")
            print(f"  Similarity Score: {similarity.item():.4f}")
            
            return {
                'prediction': prediction.item(),
                'query_norm': query_norm.item(),
                'candidate_norm': candidate_norm.item(),
                'similarity': similarity.item()
            }
    
    def _explain_xgboost_prediction(self, model: XGBoostTwoTowerModel, query_id, candidate_id):
        """Explain XGBoost model prediction."""
        if model.model is None:
            print("  ❌ Model not trained!")
            return None
        
        # Create features
        X = model._create_features(np.array([query_id]), np.array([candidate_id]))
        
        # Get prediction
        prediction = model.predict(np.array([query_id]), np.array([candidate_id]))[0]
        
        # Get SHAP values
        explainer = shap.TreeExplainer(model.model)
        shap_values = explainer.shap_values(X)
        
        print(f"  Prediction: {prediction:.4f}")
        print(f"  SHAP Values: {shap_values[0]}")
        
        # Create waterfall plot
        plt.figure(figsize=(10, 6))
        feature_names = self._get_feature_names(model.embedding_dim)
        
        shap.waterfall_plot(shap.Explanation(
            values=shap_values[0],
            base_values=shap_values[0].sum(),
            data=X[0],
            feature_names=feature_names
        ), show=False)
        
        plt.title(f"Prediction Explanation: Query {query_id} → Candidate {candidate_id}")
        plt.tight_layout()
        plt.savefig(f'prediction_explanation_{query_id}_{candidate_id}.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        return {
            'prediction': prediction,
            'shap_values': shap_values[0],
            'feature_names': feature_names
        }

def main():
    """Run quick SHAP analysis examples."""
    print("🚀 Quick SHAP Analysis for Two-Tower Models")
    print("=" * 50)
    
    analyzer = QuickSHAPAnalyzer(random_state=42)
    
    try:
        # 1. Create models for comparison
        print("\n1️⃣ Creating models for comparison...")
        
        pytorch_model = TwoTowerModel(
            query_vocab_size=100,
            candidate_vocab_size=500,
            embedding_dim=64,
            hidden_dims=[128, 64]
        )
        
        xgboost_model = XGBoostTwoTowerModel(
            query_vocab_size=50,
            candidate_vocab_size=200,
            embedding_dim=32
        )
        
        # Initialize PyTorch weights
        pytorch_model.apply(lambda m: m.weight.data.normal_(0, 0.1) if hasattr(m, 'weight') else None)
        
        models = {
            'PyTorch': pytorch_model,
            'XGBoost': xgboost_model
        }
        
        # 2. Compare models
        print("\n2️⃣ Comparing models...")
        comparison_results = analyzer.analyze_model_comparison(models, sample_size=50)
        
        # 3. Analyze feature importance
        print("\n3️⃣ Analyzing feature importance...")
        pytorch_features = analyzer.analyze_feature_importance(pytorch_model, 'pytorch', sample_size=100)
        xgboost_features = analyzer.analyze_feature_importance(xgboost_model, 'xgboost', sample_size=100)
        
        # 4. Explain individual predictions
        print("\n4️⃣ Explaining individual predictions...")
        pytorch_explanation = analyzer.explain_individual_prediction(pytorch_model, 'pytorch', 42, 123)
        xgboost_explanation = analyzer.explain_individual_prediction(xgboost_model, 'xgboost', 25, 100)
        
        print("\n" + "=" * 60)
        print("✅ Quick SHAP analysis completed!")
        print("\n📁 Generated files:")
        print("  • pytorch_feature_analysis.png")
        print("  • xgboost_feature_summary.png")
        print("  • xgboost_top_features.png")
        print("  • prediction_explanation_*.png")
        print("\n🚀 Next steps:")
        print("  • Review generated visualizations")
        print("  • Use insights for model debugging")
        print("  • Optimize model architecture based on findings")
        
    except Exception as e:
        print(f"\n❌ Quick analysis failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
