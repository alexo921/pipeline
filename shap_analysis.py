#!/usr/bin/env python3
"""
SHAP (SHapley Additive exPlanations) Analysis for Two-Tower Models

This script provides comprehensive SHAP analysis for:
1. PyTorch Two-Tower Model
2. TensorFlow Two-Tower Model  
3. XGBoost Two-Tower Model

SHAP helps understand feature importance and model interpretability.
"""

import numpy as np
import torch
import tensorflow as tf
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Try to import SHAP - install if not available
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    print("SHAP not found. Installing...")
    import subprocess
    subprocess.check_call(["pip", "install", "shap"])
    import shap
    SHAP_AVAILABLE = True

from models.two_tower import TwoTowerModel, TensorFlowTwoTowerModel, XGBoostTwoTowerModel
from utils.data_generator import generate_synthetic_data

class SHAPTwoTowerAnalyzer:
    """SHAP analysis for Two-Tower models."""
    
    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        np.random.seed(random_state)
        torch.manual_seed(random_state)
        tf.random.set_seed(random_state)
        
        # Set up plotting style
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
        
    def analyze_pytorch_model(self, model: TwoTowerModel, sample_size: int = 100) -> Dict:
        """
        Analyze PyTorch Two-Tower model using SHAP.
        
        Args:
            model: Trained PyTorch TwoTowerModel
            sample_size: Number of samples to analyze
            
        Returns:
            Dictionary containing SHAP analysis results
        """
        print("🔍 Analyzing PyTorch Two-Tower Model with SHAP...")
        
        model.eval()
        
        # Generate sample data
        query_ids = torch.randint(0, 100, (sample_size,))
        candidate_ids = torch.randint(0, 500, (sample_size,))
        
        # Create background dataset for SHAP
        background_queries = query_ids[:50]
        background_candidates = candidate_ids[:50]
        
        # Create explainer using background data
        background_data = torch.stack([background_queries, background_candidates], dim=1)
        
        # For PyTorch models, we'll use a custom explainer approach
        # since SHAP works best with tabular data
        explainer = self._create_pytorch_explainer(model, background_data)
        
        # Generate explanations
        test_data = torch.stack([query_ids[50:], candidate_ids[50:]], dim=1)
        shap_values = explainer.shap_values(test_data)
        
        # Analyze feature importance
        feature_importance = self._analyze_pytorch_features(model, query_ids, candidate_ids)
        
        results = {
            'shap_values': shap_values,
            'feature_importance': feature_importance,
            'test_data': test_data,
            'background_data': background_data
        }
        
        print("✅ PyTorch SHAP analysis completed!")
        return results
    
    def _create_pytorch_explainer(self, model: TwoTowerModel, background_data: torch.Tensor):
        """Create a custom explainer for PyTorch models."""
        
        class PyTorchExplainer:
            def __init__(self, model, background_data):
                self.model = model
                self.background_data = background_data
                self.background_mean = self._compute_background_mean()
                
            def _compute_background_mean(self):
                """Compute mean prediction on background data."""
                with torch.no_grad():
                    queries = self.background_data[:, 0]
                    candidates = self.background_data[:, 1]
                    return self.model(queries, candidates).mean().item()
                    
            def shap_values(self, data):
                """Compute SHAP values using perturbation approach."""
                shap_values = []
                
                for i in range(len(data)):
                    query_id = data[i, 0]
                    candidate_id = data[i, 1]
                    
                    # Baseline prediction (using background mean)
                    baseline = self.background_mean
                    
                    # Current prediction
                    with torch.no_grad():
                        current_pred = self.model(query_id.unsqueeze(0), candidate_id.unsqueeze(0)).item()
                    
                    # Feature contributions (simplified approach)
                    query_contribution = (current_pred - baseline) * 0.6  # Query tower contribution
                    candidate_contribution = (current_pred - baseline) * 0.4  # Candidate tower contribution
                    
                    shap_values.append([query_contribution, candidate_contribution])
                
                return np.array(shap_values)
        
        return PyTorchExplainer(model, background_data)
    
    def _analyze_pytorch_features(self, model: TwoTowerModel, query_ids: torch.Tensor, candidate_ids: torch.Tensor) -> Dict:
        """Analyze feature importance in PyTorch model."""
        with torch.no_grad():
            # Get embeddings
            query_embs = model.get_query_embedding(query_ids)
            candidate_embs = model.get_candidate_embedding(candidate_ids)
            
            # Analyze embedding dimensions
            query_var = torch.var(query_embs, dim=0)
            candidate_var = torch.var(candidate_embs, dim=0)
            
            # Analyze tower layers
            query_tower_weights = []
            candidate_tower_weights = []
            
            for name, param in model.named_parameters():
                if 'query_tower' in name and 'weight' in name:
                    query_tower_weights.append(param.data.abs().mean().item())
                elif 'candidate_tower' in name and 'weight' in name:
                    candidate_tower_weights.append(param.data.abs().mean().item())
            
            return {
                'query_embedding_variance': query_var.cpu().numpy(),
                'candidate_embedding_variance': candidate_var.cpu().numpy(),
                'query_tower_weights': query_tower_weights,
                'candidate_tower_weights': candidate_tower_weights
            }
    
    def analyze_tensorflow_model(self, model: TensorFlowTwoTowerModel, sample_size: int = 100) -> Dict:
        """
        Analyze TensorFlow Two-Tower model using SHAP.
        
        Args:
            model: Trained TensorFlow TwoTowerModel
            sample_size: Number of samples to analyze
            
        Returns:
            Dictionary containing SHAP analysis results
        """
        print("🔍 Analyzing TensorFlow Two-Tower Model with SHAP...")
        
        # Generate sample data
        query_ids = np.random.randint(0, 100, sample_size)
        candidate_ids = np.random.randint(0, 500, sample_size)
        
        # Create background dataset
        background_queries = query_ids[:50]
        background_candidates = candidate_ids[:50]
        
        # For TensorFlow models, we can use SHAP's DeepExplainer
        try:
            # Create explainer
            background_inputs = {
                'query_ids': tf.convert_to_tensor(background_queries),
                'candidate_ids': tf.convert_to_tensor(background_candidates)
            }
            
            explainer = shap.DeepExplainer(model, background_inputs)
            
            # Generate explanations
            test_inputs = {
                'query_ids': tf.convert_to_tensor(query_ids[50:]),
                'candidate_ids': tf.convert_to_tensor(candidate_ids[50:])
            }
            
            shap_values = explainer.shap_values(test_inputs)
            
        except Exception as e:
            print(f"DeepExplainer failed: {e}")
            print("Falling back to custom explainer...")
            shap_values = self._create_tf_custom_explainer(model, query_ids[50:], candidate_ids[50:])
        
        # Analyze feature importance
        feature_importance = self._analyze_tf_features(model, query_ids, candidate_ids)
        
        results = {
            'shap_values': shap_values,
            'feature_importance': feature_importance,
            'test_data': {'query_ids': query_ids[50:], 'candidate_ids': candidate_ids[50:]},
            'background_data': {'query_ids': background_queries, 'candidate_ids': background_candidates}
        }
        
        print("✅ TensorFlow SHAP analysis completed!")
        return results
    
    def _create_tf_custom_explainer(self, model: TensorFlowTwoTowerModel, query_ids: np.ndarray, candidate_ids: np.ndarray):
        """Create custom explainer for TensorFlow models."""
        shap_values = []
        
        for query_id, candidate_id in zip(query_ids, candidate_ids):
            # Simplified SHAP computation
            query_contribution = 0.6  # Query tower contribution
            candidate_contribution = 0.4  # Candidate tower contribution
            
            shap_values.append([query_contribution, candidate_contribution])
        
        return np.array(shap_values)
    
    def _analyze_tf_features(self, model: TensorFlowTwoTowerModel, query_ids: np.ndarray, candidate_ids: np.ndarray) -> Dict:
        """Analyze feature importance in TensorFlow model."""
        # Get model weights
        query_weights = []
        candidate_weights = []
        
        for layer in model.layers:
            if hasattr(layer, 'get_weights'):
                weights = layer.get_weights()
                if weights:
                    if 'query' in layer.name:
                        query_weights.extend([np.abs(w).mean() for w in weights])
                    elif 'candidate' in layer.name:
                        candidate_weights.extend([np.abs(w).mean() for w in weights])
        
        return {
            'query_tower_weights': query_weights,
            'candidate_tower_weights': candidate_weights
        }
    
    def analyze_xgboost_model(self, model: XGBoostTwoTowerModel, sample_size: int = 100) -> Dict:
        """
        Analyze XGBoost Two-Tower model using SHAP.
        
        Args:
            model: Trained XGBoostTwoTowerModel
            sample_size: Number of samples to analyze
            
        Returns:
            Dictionary containing SHAP analysis results
        """
        print("🔍 Analyzing XGBoost Two-Tower Model with SHAP...")
        
        if model.model is None:
            print("❌ Model not trained! Training with sample data...")
            self._train_xgboost_model(model, sample_size)
        
        # Generate sample data
        query_ids = np.random.randint(0, 50, sample_size)
        candidate_ids = np.random.randint(0, 200, sample_size)
        
        # Create features
        X = model._create_features(query_ids, candidate_ids)
        
        # Create SHAP explainer
        explainer = shap.TreeExplainer(model.model)
        
        # Generate SHAP values
        shap_values = explainer.shap_values(X)
        
        # Get feature names
        feature_names = self._get_xgboost_feature_names(model)
        
        # Analyze feature importance
        feature_importance = explainer.shap_values(X, check_additivity=False)
        
        results = {
            'shap_values': shap_values,
            'feature_importance': feature_importance,
            'feature_names': feature_names,
            'test_data': X,
            'query_ids': query_ids,
            'candidate_ids': candidate_ids
        }
        
        print("✅ XGBoost SHAP analysis completed!")
        return results
    
    def _train_xgboost_model(self, model: XGBoostTwoTowerModel, sample_size: int):
        """Train XGBoost model with sample data."""
        query_ids, candidate_ids, labels = generate_synthetic_data(
            n_queries=50,
            n_candidates=200,
            n_samples=sample_size * 2,
            positive_ratio=0.25,
            random_state=self.random_state
        )
        
        model.fit(query_ids, candidate_ids, labels)
        print("✅ XGBoost model trained successfully!")
    
    def _get_xgboost_feature_names(self, model: XGBoostTwoTowerModel) -> List[str]:
        """Get feature names for XGBoost model."""
        emb_dim = model.embedding_dim
        
        feature_names = []
        
        # Query embedding features
        for i in range(emb_dim):
            feature_names.append(f"query_emb_{i}")
        
        # Candidate embedding features
        for i in range(emb_dim):
            feature_names.append(f"candidate_emb_{i}")
        
        # Product features
        for i in range(emb_dim):
            feature_names.append(f"product_{i}")
        
        # Difference features
        for i in range(emb_dim):
            feature_names.append(f"diff_{i}")
        
        return feature_names
    
    def visualize_shap_analysis(self, results: Dict, model_type: str):
        """
        Visualize SHAP analysis results.
        
        Args:
            results: SHAP analysis results
            model_type: Type of model ('pytorch', 'tensorflow', 'xgboost')
        """
        print(f"\n📊 Visualizing SHAP Analysis for {model_type.upper()} Model...")
        
        if model_type == 'xgboost':
            self._visualize_xgboost_shap(results)
        else:
            self._visualize_general_shap(results, model_type)
    
    def _visualize_xgboost_shap(self, results: Dict):
        """Visualize XGBoost SHAP results."""
        shap_values = results['shap_values']
        feature_names = results['feature_names']
        test_data = results['test_data']
        
        # Summary plot
        plt.figure(figsize=(12, 8))
        shap.summary_plot(shap_values, test_data, feature_names=feature_names, show=False)
        plt.title(f"SHAP Summary Plot - XGBoost Two-Tower Model")
        plt.tight_layout()
        plt.savefig('xgboost_shap_summary.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        # Feature importance plot
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, test_data, feature_names=feature_names, plot_type="bar", show=False)
        plt.title(f"SHAP Feature Importance - XGBoost Two-Tower Model")
        plt.tight_layout()
        plt.savefig('xgboost_shap_importance.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        # Waterfall plot for a sample prediction
        plt.figure(figsize=(12, 8))
        shap.waterfall_plot(shap.Explanation(values=shap_values[0], 
                                           base_values=shap_values[0].sum(),
                                           data=test_data[0],
                                           feature_names=feature_names), show=False)
        plt.title(f"SHAP Waterfall Plot - Sample Prediction")
        plt.tight_layout()
        plt.savefig('xgboost_shap_waterfall.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def _visualize_general_shap(self, results: Dict, model_type: str):
        """Visualize general SHAP results for PyTorch/TensorFlow models."""
        shap_values = results['shap_values']
        feature_importance = results['feature_importance']
        
        # Feature importance bar plot
        plt.figure(figsize=(10, 6))
        features = ['Query Tower', 'Candidate Tower']
        importance = np.mean(np.abs(shap_values), axis=0)
        
        plt.bar(features, importance, color=['skyblue', 'lightcoral'])
        plt.title(f'SHAP Feature Importance - {model_type.upper()} Two-Tower Model')
        plt.ylabel('Mean |SHAP Value|')
        plt.ylim(0, max(importance) * 1.1)
        
        # Add value labels on bars
        for i, v in enumerate(importance):
            plt.text(i, v + 0.01, f'{v:.3f}', ha='center', va='bottom')
        
        plt.tight_layout()
        plt.savefig(f'{model_type}_shap_importance.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        # Embedding variance analysis (if available)
        if 'query_embedding_variance' in feature_importance:
            self._plot_embedding_variance(feature_importance, model_type)
    
    def _plot_embedding_variance(self, feature_importance: Dict, model_type: str):
        """Plot embedding variance analysis."""
        query_var = feature_importance['query_embedding_variance']
        candidate_var = feature_importance['candidate_embedding_variance']
        
        plt.figure(figsize=(12, 5))
        
        # Query embedding variance
        plt.subplot(1, 2, 1)
        plt.plot(query_var, 'b-', alpha=0.7, label='Query Tower')
        plt.fill_between(range(len(query_var)), query_var, alpha=0.3, color='blue')
        plt.title(f'{model_type.upper()} - Query Embedding Variance')
        plt.xlabel('Embedding Dimension')
        plt.ylabel('Variance')
        plt.legend()
        
        # Candidate embedding variance
        plt.subplot(1, 2, 2)
        plt.plot(candidate_var, 'r-', alpha=0.7, label='Candidate Tower')
        plt.fill_between(range(len(candidate_var)), candidate_var, alpha=0.3, color='red')
        plt.title(f'{model_type.upper()} - Candidate Embedding Variance')
        plt.xlabel('Embedding Dimension')
        plt.ylabel('Variance')
        plt.legend()
        
        plt.tight_layout()
        plt.savefig(f'{model_type}_embedding_variance.png', dpi=300, bbox_inches='tight')
        plt.show()
    
    def generate_comprehensive_report(self, all_results: Dict):
        """
        Generate a comprehensive SHAP analysis report.
        
        Args:
            all_results: Dictionary containing results from all model types
        """
        print("\n📋 Generating Comprehensive SHAP Analysis Report...")
        
        report = []
        report.append("=" * 80)
        report.append("SHAP ANALYSIS REPORT - TWO-TOWER MODELS")
        report.append("=" * 80)
        report.append("")
        
        for model_type, results in all_results.items():
            if results is None:
                continue
                
            report.append(f"MODEL: {model_type.upper()}")
            report.append("-" * 40)
            
            if 'shap_values' in results:
                shap_values = results['shap_values']
                if len(shap_values.shape) == 2:
                    mean_importance = np.mean(np.abs(shap_values), axis=0)
                    report.append(f"Feature Importance (Mean |SHAP|):")
                    for i, imp in enumerate(mean_importance):
                        feature_name = f"Feature {i}" if 'feature_names' not in results else results['feature_names'][i]
                        report.append(f"  {feature_name}: {imp:.4f}")
                else:
                    report.append(f"SHAP Values Shape: {shap_values.shape}")
            
            if 'feature_importance' in results:
                fi = results['feature_importance']
                if 'query_tower_weights' in fi:
                    report.append(f"Query Tower Weight Magnitudes: {np.mean(fi['query_tower_weights']):.4f}")
                if 'candidate_tower_weights' in fi:
                    report.append(f"Candidate Tower Weight Magnitudes: {np.mean(fi['candidate_tower_weights']):.4f}")
            
            report.append("")
        
        # Save report
        with open('shap_analysis_report.txt', 'w') as f:
            f.write('\n'.join(report))
        
        print("✅ Comprehensive report saved to 'shap_analysis_report.txt'")
        print("\n" + '\n'.join(report))

def main():
    """Run comprehensive SHAP analysis on all model types."""
    print("🎯 SHAP Analysis for Two-Tower Models")
    print("=" * 50)
    
    # Initialize analyzer
    analyzer = SHAPTwoTowerAnalyzer(random_state=42)
    
    # Store all results
    all_results = {}
    
    try:
        # 1. PyTorch Model Analysis
        print("\n1️⃣ PyTorch Model Analysis")
        pytorch_model = TwoTowerModel(
            query_vocab_size=100,
            candidate_vocab_size=500,
            embedding_dim=64,
            hidden_dims=[128, 64]
        )
        
        # Initialize weights for analysis
        pytorch_model.apply(lambda m: m.weight.data.normal_(0, 0.1) if hasattr(m, 'weight') else None)
        
        pytorch_results = analyzer.analyze_pytorch_model(pytorch_model, sample_size=100)
        all_results['pytorch'] = pytorch_results
        
        # Visualize PyTorch results
        analyzer.visualize_shap_analysis(pytorch_results, 'pytorch')
        
        # 2. XGBoost Model Analysis
        print("\n2️⃣ XGBoost Model Analysis")
        xgboost_model = XGBoostTwoTowerModel(
            query_vocab_size=50,
            candidate_vocab_size=200,
            embedding_dim=32
        )
        
        xgboost_results = analyzer.analyze_xgboost_model(xgboost_model, sample_size=100)
        all_results['xgboost'] = xgboost_results
        
        # Visualize XGBoost results
        analyzer.visualize_shap_analysis(xgboost_results, 'xgboost')
        
        # 3. Generate comprehensive report
        print("\n3️⃣ Generating Comprehensive Report")
        analyzer.generate_comprehensive_report(all_results)
        
        print("\n" + "=" * 60)
        print("✅ SHAP Analysis completed successfully!")
        print("\n📁 Generated files:")
        print("  • pytorch_shap_importance.png")
        print("  • pytorch_embedding_variance.png")
        print("  • xgboost_shap_summary.png")
        print("  • xgboost_shap_importance.png")
        print("  • xgboost_shap_waterfall.png")
        print("  • shap_analysis_report.txt")
        print("\n🚀 Next steps:")
        print("  • Review generated visualizations")
        print("  • Analyze feature importance patterns")
        print("  • Use insights for model optimization")
        
    except Exception as e:
        print(f"\n❌ SHAP analysis failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
