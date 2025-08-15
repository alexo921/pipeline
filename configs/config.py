import torch
"""Configuration file for two-tower model training."""

import os
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

@dataclass
class ModelConfig:
    """Model architecture configuration."""
    query_vocab_size: int = 1000
    candidate_vocab_size: int = 5000
    embedding_dim: int = 64
    hidden_dims: List[int] = field(default_factory=lambda: [128, 64])
    dropout_rate: float = 0.1
    use_batch_norm: bool = True

@dataclass
class TrainingConfig:
    """Training configuration."""
    batch_size: int = 256
    learning_rate: float = 0.001
    weight_decay: float = 0.01
    epochs: int = 50
    early_stopping_patience: int = 5
    device: str = 'cuda' if torch.cuda.is_available() else 'cpu'

@dataclass
class DataConfig:
    """Data configuration."""
    n_queries: int = 1000
    n_candidates: int = 5000
    n_samples: int = 50000
    positive_ratio: float = 0.2
    train_size: float = 0.7
    val_size: float = 0.15
    random_state: int = 42
    negative_sampling_ratio: int = 4

@dataclass
class XGBoostConfig:
    """XGBoost model configuration."""
    params: Dict[str, Any] = field(default_factory=lambda: {
        'objective': 'binary:logistic',
        'eval_metric': 'logloss',
        'max_depth': 6,
        'learning_rate': 0.1,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'random_state': 42
    })
    num_boost_round: int = 100
    early_stopping_rounds: int = 10

@dataclass
class ExperimentConfig:
    """Overall experiment configuration."""
    model: ModelConfig = field(default_factory=ModelConfig)
    training: TrainingConfig = field(default_factory=TrainingConfig)
    data: DataConfig = field(default_factory=DataConfig)
    xgboost: XGBoostConfig = field(default_factory=XGBoostConfig)
    
    # Paths
    save_dir: str = "experiments"
    model_save_path: str = "best_model.pth"
    plot_save_path: str = "training_history.png"
    
    # Experiment settings
    experiment_name: str = "two_tower_experiment"
    use_xgboost: bool = False
    use_tensorflow: bool = False
    verbose: bool = True

def get_config() -> ExperimentConfig:
    """Get default configuration."""
    config = ExperimentConfig()
    
    # Create experiment directory
    exp_dir = os.path.join(config.save_dir, config.experiment_name)
    os.makedirs(exp_dir, exist_ok=True)
    
    # Update paths
    config.model_save_path = os.path.join(exp_dir, config.model_save_path)
    config.plot_save_path = os.path.join(exp_dir, config.plot_save_path)
    
    return config

def print_config(config: ExperimentConfig):
    """Print configuration details."""
    print("=" * 50)
    print("EXPERIMENT CONFIGURATION")
    print("=" * 50)
    
    print(f"Experiment: {config.experiment_name}")
    print(f"Save Directory: {config.save_dir}")
    
    print("\n--- Model Configuration ---")
    print(f"Query Vocab Size: {config.model.query_vocab_size:,}")
    print(f"Candidate Vocab Size: {config.model.candidate_vocab_size:,}")
    print(f"Embedding Dimension: {config.model.embedding_dim}")
    print(f"Hidden Dimensions: {config.model.hidden_dims}")
    print(f"Dropout Rate: {config.model.dropout_rate}")
    print(f"Batch Normalization: {config.model.use_batch_norm}")
    
    print("\n--- Training Configuration ---")
    print(f"Batch Size: {config.training.batch_size}")
    print(f"Learning Rate: {config.training.learning_rate}")
    print(f"Weight Decay: {config.training.weight_decay}")
    print(f"Max Epochs: {config.training.epochs}")
    print(f"Early Stopping Patience: {config.training.early_stopping_patience}")
    print(f"Device: {config.training.device}")
    
    print("\n--- Data Configuration ---")
    print(f"Queries: {config.data.n_queries:,}")
    print(f"Candidates: {config.data.n_candidates:,}")
    print(f"Samples: {config.data.n_samples:,}")
    print(f"Positive Ratio: {config.data.positive_ratio:.2%}")
    print(f"Train/Val/Test Split: {config.data.train_size}/{config.data.val_size}/{1-config.data.train_size-config.data.val_size}")
    
    if config.use_xgboost:
        print("\n--- XGBoost Configuration ---")
        for key, value in config.xgboost.params.items():
            print(f"{key}: {value}")
        print(f"Boosting Rounds: {config.xgboost.num_boost_round}")
    
    print("=" * 50)
