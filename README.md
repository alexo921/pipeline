# Two-Tower Architecture for AI Model Training

This project implements a comprehensive two-tower architecture for recommendation systems and retrieval tasks. The two-tower model learns separate representations for queries (users) and candidates (items) and computes similarity scores between them.

## 🏗️ Architecture Overview

The two-tower architecture consists of:

1. **Query Tower**: Processes query/user features and outputs dense embeddings
2. **Candidate Tower**: Processes candidate/item features and outputs dense embeddings  
3. **Similarity Computation**: Computes similarity scores (typically dot product) between query and candidate embeddings

## 🚀 Features

- **Multiple Frameworks**: Implementations in PyTorch, TensorFlow, and XGBoost
- **Flexible Architecture**: Configurable embedding dimensions and hidden layers
- **Training Pipeline**: Complete training pipeline with validation and early stopping
- **Data Generation**: Synthetic data generation for testing
- **Visualization**: Training history plots and metrics tracking
- **Retrieval Demo**: Demonstrates real-world retrieval scenarios

## 📁 Project Structure

```
two_tower_model/
├── models/
│   └── two_tower.py          # Model implementations (PyTorch, TensorFlow, XGBoost)
├── training/
│   └── trainer.py             # Training utilities and trainer class
├── utils/
│   └── data_generator.py      # Data generation and preprocessing
├── configs/
│   └── config.py              # Configuration management
├── data/                      # Data directory
├── main.py                    # Main training script
└── README.md                  # This file
```

## 🛠️ Setup and Installation

1. **Activate your environment**:
```bash
source xgboost-env/bin/activate
```

2. **Navigate to the project directory**:
```bash
cd two_tower_model
```

3. **Run the training pipeline**:
```bash
python main.py
```

## 🎯 Usage Examples

### Basic Training (PyTorch)
```python
from main import train_pytorch_model
from configs.config import get_config

config = get_config()
model, trainer, metrics = train_pytorch_model(config)
```

### XGBoost Training
```python
from configs.config import get_config

config = get_config()
config.use_xgboost = True
# Run main script or call train_xgboost_model directly
```

### Custom Configuration
```python
from configs.config import get_config

config = get_config()
config.model.embedding_dim = 128
config.model.hidden_dims = [256, 128, 64]
config.training.learning_rate = 0.001
config.training.batch_size = 512
```

## 🔧 Configuration Options

### Model Configuration
- `query_vocab_size`: Number of unique queries/users
- `candidate_vocab_size`: Number of unique candidates/items
- `embedding_dim`: Dimension of embeddings (64 default)
- `hidden_dims`: List of hidden layer dimensions ([128, 64] default)
- `dropout_rate`: Dropout rate (0.1 default)
- `use_batch_norm`: Whether to use batch normalization

### Training Configuration
- `batch_size`: Training batch size (256 default)
- `learning_rate`: Learning rate (0.001 default)
- `weight_decay`: L2 regularization (0.01 default)
- `epochs`: Maximum training epochs (50 default)
- `early_stopping_patience`: Early stopping patience (5 default)

### Data Configuration
- `n_queries`: Number of synthetic queries (1000 default)
- `n_candidates`: Number of synthetic candidates (5000 default)
- `n_samples`: Total synthetic samples (50000 default)
- `positive_ratio`: Ratio of positive samples (0.2 default)

## 📊 Model Implementations

### 1. PyTorch Implementation
- Full-featured implementation with training pipeline
- Support for GPU acceleration
- Batch normalization and dropout
- Early stopping and model checkpointing

### 2. TensorFlow Implementation
- Keras-based implementation
- Compatible with TensorFlow 2.x
- Supports distributed training

### 3. XGBoost Implementation
- Feature-engineering based approach
- Combines query and candidate embeddings
- Excellent for structured data with many features

## 🎲 Data Generation

The project includes synthetic data generation that creates:
- User-item interaction patterns
- Realistic preference structures
- Configurable sparsity and positive ratios

For real datasets:
- MovieLens format support
- Extensible data loading utilities
- Train/validation/test splitting

## 📈 Training and Evaluation

Training includes:
- **Loss Tracking**: Binary cross-entropy loss
- **Metrics**: AUC-ROC for evaluation
- **Visualization**: Training history plots
- **Early Stopping**: Prevents overfitting
- **Model Checkpointing**: Saves best model

## 🔍 Retrieval Capabilities

The trained model can be used for:
- **Query Encoding**: Convert users to dense vectors
- **Candidate Encoding**: Convert items to dense vectors  
- **Similarity Search**: Find top-K similar items for users
- **Real-time Inference**: Fast similarity computation

## 🌟 Use Cases

This two-tower architecture is ideal for:
- **Recommendation Systems**: E-commerce, content recommendation
- **Information Retrieval**: Search engines, document matching
- **Advertisement Targeting**: User-ad matching
- **Social Media**: Friend/content suggestions
- **E-learning**: Course/content recommendations

## 🚀 Getting Started

1. **Quick Start**:
```bash
cd two_tower_model
python main.py
```

2. **Custom Training**:
```bash
# Modify configs/config.py for your needs
python main.py
```

3. **XGBoost Training**:
```bash
# Set use_xgboost=True in config
python main.py
```

## 📊 Expected Results

With default synthetic data, you should expect:
- **Training AUC**: ~0.85-0.90
- **Validation AUC**: ~0.82-0.87
- **Training Time**: 2-5 minutes on CPU
- **Model Size**: ~1-5MB depending on configuration

## 🤝 Contributing

Feel free to extend this implementation with:
- Additional loss functions (triplet loss, contrastive loss)
- More sophisticated negative sampling
- Integration with real datasets
- Production deployment utilities
- Advanced retrieval algorithms

## 📚 References

- [Two-Tower Models for Recommendation](https://research.google/pubs/pub48840/)
- [Deep Neural Networks for YouTube Recommendations](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/45530.pdf)
- [Sampling-Bias-Corrected Neural Modeling](https://research.google/pubs/pub48840/)

Happy training! 🎉
