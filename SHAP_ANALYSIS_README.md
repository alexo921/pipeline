# SHAP Analysis for Two-Tower Models

This directory contains comprehensive SHAP (SHapley Additive exPlanations) analysis tools for understanding and interpreting two-tower recommendation models.

## 🎯 What is SHAP?

SHAP (SHapley Additive exPlanations) is a game theory-based approach to explain the output of any machine learning model. It provides:

- **Feature Importance**: Which features contribute most to predictions
- **Individual Explanations**: Why a specific prediction was made
- **Model Interpretability**: Understanding how the model works internally
- **Debugging**: Identifying potential issues in model behavior

## 📁 Files Overview

### 1. `shap_analysis.py` - Comprehensive Analysis
The main SHAP analysis script that provides:
- Full analysis of PyTorch, TensorFlow, and XGBoost models
- Comprehensive visualizations
- Detailed reports
- Model comparison capabilities

### 2. `shap_quick_analysis.py` - Focused Analysis
A streamlined version for specific use cases:
- Quick model comparison
- Feature importance analysis
- Individual prediction explanations
- Model debugging

### 3. Generated Outputs
After running the analysis, you'll get:
- **Visualizations**: PNG files showing SHAP analysis results
- **Reports**: Text files with detailed analysis summaries
- **Insights**: Understanding of model behavior and feature importance

## 🚀 Quick Start

### Prerequisites
```bash
# Activate the virtual environment
source /home/ubuntu/xgboost-env/bin/activate

# Install required packages (if not already installed)
pip install shap matplotlib seaborn torch tensorflow
```

### Run Comprehensive Analysis
```bash
python shap_analysis.py
```

### Run Quick Analysis
```bash
python shap_quick_analysis.py
```

## 📊 Understanding the Outputs

### 1. PyTorch Model Analysis
- **Feature Importance**: Shows which embedding dimensions are most important
- **Tower Analysis**: Compares query vs. candidate tower contributions
- **Weight Analysis**: Visualizes layer weight magnitudes

### 2. XGBoost Model Analysis
- **SHAP Summary Plots**: Overall feature importance across all samples
- **Feature Importance Bars**: Top features ranked by importance
- **Waterfall Plots**: Individual prediction explanations

### 3. Model Comparison
- **Cross-Model Analysis**: Compare different architectures
- **Performance Metrics**: Prediction distributions and variances
- **Feature Contribution**: How different models use features

## 🔍 Key Insights from SHAP Analysis

### Feature Importance Patterns
1. **Query Embeddings**: Which user characteristics matter most
2. **Candidate Embeddings**: Which item features drive recommendations
3. **Interaction Features**: How user-item combinations influence scores
4. **Tower Contributions**: Relative importance of query vs. candidate towers

### Model Behavior Understanding
1. **Prediction Drivers**: What leads to high/low similarity scores
2. **Bias Detection**: Are certain user/item types favored?
3. **Robustness**: How stable are predictions across different inputs
4. **Efficiency**: Which features can be optimized or removed

## 💡 Use Cases

### 1. Model Development
- **Architecture Optimization**: Identify which layers contribute most
- **Feature Engineering**: Discover important feature combinations
- **Hyperparameter Tuning**: Understand model sensitivity

### 2. Production Monitoring
- **Drift Detection**: Monitor feature importance changes over time
- **Performance Debugging**: Explain unexpected predictions
- **User Experience**: Understand why recommendations are made

### 3. Business Intelligence
- **User Segmentation**: Identify what drives user preferences
- **Content Optimization**: Understand what makes items popular
- **A/B Testing**: Validate model changes with explanations

## 🛠️ Customization

### Modify Analysis Parameters
```python
# In shap_analysis.py or shap_quick_analysis.py
analyzer = SHAPTwoTowerAnalyzer(random_state=42)

# Customize sample sizes
results = analyzer.analyze_pytorch_model(model, sample_size=200)

# Customize visualization settings
analyzer.visualize_shap_analysis(results, 'pytorch')
```

### Add New Model Types
```python
def analyze_custom_model(self, model, sample_size: int = 100):
    """Add support for new model architectures."""
    # Implement custom analysis logic
    pass
```

### Custom Visualizations
```python
def custom_visualization(self, results: Dict):
    """Create custom plots for specific insights."""
    # Implement custom plotting logic
    pass
```

## 📈 Interpreting Results

### High SHAP Values
- **Positive**: Feature increases prediction score
- **Negative**: Feature decreases prediction score
- **Magnitude**: How much the feature influences the prediction

### Feature Groups
1. **Query Features**: User characteristics and preferences
2. **Candidate Features**: Item attributes and metadata
3. **Interaction Features**: User-item combination effects
4. **Temporal Features**: Time-based patterns (if applicable)

### Model Comparison Insights
- **Consistency**: Do different models agree on important features?
- **Efficiency**: Which model uses features most effectively?
- **Robustness**: How stable are feature importance rankings?

## 🔧 Troubleshooting

### Common Issues
1. **Memory Errors**: Reduce `sample_size` parameter
2. **Import Errors**: Ensure all dependencies are installed
3. **Model Errors**: Check model compatibility and training status
4. **Visualization Issues**: Verify matplotlib backend configuration

### Performance Optimization
1. **Batch Processing**: Process data in smaller chunks
2. **Feature Sampling**: Analyze subset of features for large models
3. **Caching**: Save intermediate results for repeated analysis
4. **Parallel Processing**: Use multiprocessing for large datasets

## 📚 Advanced Usage

### Batch Analysis
```python
# Analyze multiple models simultaneously
models = {
    'baseline': baseline_model,
    'improved': improved_model,
    'experimental': experimental_model
}

all_results = {}
for name, model in models.items():
    results = analyzer.analyze_model(model, sample_size=100)
    all_results[name] = results

# Generate comparison report
analyzer.generate_comprehensive_report(all_results)
```

### Time Series Analysis
```python
# Track feature importance over time
time_results = {}
for timestamp, model in time_series_models.items():
    results = analyzer.analyze_model(model, sample_size=100)
    time_results[timestamp] = results

# Analyze drift and stability
analyzer.analyze_temporal_stability(time_results)
```

### Custom Metrics
```python
# Define custom importance metrics
def custom_importance_metric(shap_values, feature_data):
    """Custom feature importance calculation."""
    # Implement custom logic
    return custom_importance_scores

# Use in analysis
analyzer.custom_metrics = [custom_importance_metric]
```

## 🎯 Best Practices

### 1. Analysis Strategy
- Start with comprehensive analysis for new models
- Use quick analysis for routine monitoring
- Focus on specific features for targeted optimization

### 2. Interpretation
- Consider business context when interpreting results
- Look for patterns across multiple samples
- Validate insights with domain experts

### 3. Action Items
- Prioritize features with highest SHAP values
- Investigate unexpected feature importance patterns
- Use insights to guide model improvements

### 4. Documentation
- Document key findings and insights
- Track changes in feature importance over time
- Share results with stakeholders

## 🚀 Next Steps

After running SHAP analysis:

1. **Review Visualizations**: Understand what the plots reveal
2. **Analyze Patterns**: Look for consistent feature importance
3. **Identify Opportunities**: Find areas for model improvement
4. **Implement Changes**: Use insights to optimize models
5. **Monitor Results**: Track improvements over time

## 📞 Support

For questions or issues with SHAP analysis:

1. Check the generated error logs
2. Review the comprehensive report
3. Verify model compatibility
4. Adjust analysis parameters as needed

## 🔗 Related Resources

- [SHAP Documentation](https://shap.readthedocs.io/)
- [Two-Tower Model Architecture](https://arxiv.org/abs/2003.02139)
- [Model Interpretability Best Practices](https://christophm.github.io/interpretable-ml-book/)
- [Feature Importance Analysis](https://scikit-learn.org/stable/auto_examples/ensemble/plot_forest_importances.html)

---

**Happy Analyzing! 🎉**

Use these tools to unlock the secrets of your two-tower models and build better recommendation systems.
