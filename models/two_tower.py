import torch
import torch.nn as nn
import torch.nn.functional as F
import tensorflow as tf
from typing import Dict, List, Optional, Tuple
import numpy as np

class TwoTowerModel(nn.Module):
    """
    PyTorch implementation of Two-Tower Architecture for recommendation systems.
    
    This model learns separate embeddings for queries (users) and candidates (items)
    and computes similarity scores between them.
    """
    
    def __init__(
        self,
        query_vocab_size: int,
        candidate_vocab_size: int,
        embedding_dim: int = 64,
        hidden_dims: List[int] = [128, 64],
        dropout_rate: float = 0.1,
        use_batch_norm: bool = True
    ):
        super(TwoTowerModel, self).__init__()
        
        self.embedding_dim = embedding_dim
        
        # Query Tower (User Tower)
        self.query_embedding = nn.Embedding(query_vocab_size, embedding_dim)
        self.query_tower = self._build_tower(embedding_dim, hidden_dims, dropout_rate, use_batch_norm)
        
        # Candidate Tower (Item Tower)
        self.candidate_embedding = nn.Embedding(candidate_vocab_size, embedding_dim)
        self.candidate_tower = self._build_tower(embedding_dim, hidden_dims, dropout_rate, use_batch_norm)
        
        # Output dimensions should match for dot product
        self.output_dim = hidden_dims[-1] if hidden_dims else embedding_dim
        
    def _build_tower(self, input_dim: int, hidden_dims: List[int], dropout_rate: float, use_batch_norm: bool) -> nn.Module:
        """Build a tower with the specified architecture."""
        layers = []
        
        prev_dim = input_dim
        for hidden_dim in hidden_dims:
            layers.append(nn.Linear(prev_dim, hidden_dim))
            if use_batch_norm:
                layers.append(nn.BatchNorm1d(hidden_dim))
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout_rate))
            prev_dim = hidden_dim
            
        return nn.Sequential(*layers)
    
    def forward(self, query_ids: torch.Tensor, candidate_ids: torch.Tensor) -> torch.Tensor:
        """
        Forward pass of the two-tower model.
        
        Args:
            query_ids: Tensor of query (user) IDs [batch_size]
            candidate_ids: Tensor of candidate (item) IDs [batch_size]
            
        Returns:
            Similarity scores between queries and candidates [batch_size]
        """
        # Get embeddings
        query_emb = self.query_embedding(query_ids)
        candidate_emb = self.candidate_embedding(candidate_ids)
        
        # Pass through towers
        query_repr = self.query_tower(query_emb)
        candidate_repr = self.candidate_tower(candidate_emb)
        
        # Normalize representations
        query_repr = F.normalize(query_repr, p=2, dim=1)
        candidate_repr = F.normalize(candidate_repr, p=2, dim=1)
        
        # Compute similarity (dot product)
        similarity = torch.sum(query_repr * candidate_repr, dim=1)
        
        return similarity
    
    def get_query_embedding(self, query_ids: torch.Tensor) -> torch.Tensor:
        """Get query tower embeddings for retrieval."""
        query_emb = self.query_embedding(query_ids)
        query_repr = self.query_tower(query_emb)
        return F.normalize(query_repr, p=2, dim=1)
    
    def get_candidate_embedding(self, candidate_ids: torch.Tensor) -> torch.Tensor:
        """Get candidate tower embeddings for retrieval."""
        candidate_emb = self.candidate_embedding(candidate_ids)
        candidate_repr = self.candidate_tower(candidate_emb)
        return F.normalize(candidate_repr, p=2, dim=1)


class TensorFlowTwoTowerModel(tf.keras.Model):
    """
    TensorFlow implementation of Two-Tower Architecture.
    """
    
    def __init__(
        self,
        query_vocab_size: int,
        candidate_vocab_size: int,
        embedding_dim: int = 64,
        hidden_dims: List[int] = [128, 64],
        dropout_rate: float = 0.1,
        **kwargs
    ):
        super(TensorFlowTwoTowerModel, self).__init__(**kwargs)
        
        self.embedding_dim = embedding_dim
        self.hidden_dims = hidden_dims
        self.dropout_rate = dropout_rate
        
        # Query Tower
        self.query_embedding = tf.keras.layers.Embedding(query_vocab_size, embedding_dim)
        self.query_tower = self._build_tower(hidden_dims, dropout_rate, name_prefix="query")
        
        # Candidate Tower
        self.candidate_embedding = tf.keras.layers.Embedding(candidate_vocab_size, embedding_dim)
        self.candidate_tower = self._build_tower(hidden_dims, dropout_rate, name_prefix="candidate")
        
    def _build_tower(self, hidden_dims: List[int], dropout_rate: float, name_prefix: str) -> tf.keras.Model:
        """Build a tower with the specified architecture."""
        inputs = tf.keras.Input(shape=(self.embedding_dim,))
        x = inputs
        
        for i, hidden_dim in enumerate(hidden_dims):
            x = tf.keras.layers.Dense(hidden_dim, activation='relu', name=f"{name_prefix}_dense_{i}")(x)
            x = tf.keras.layers.BatchNormalization(name=f"{name_prefix}_bn_{i}")(x)
            x = tf.keras.layers.Dropout(dropout_rate, name=f"{name_prefix}_dropout_{i}")(x)
        
        x = tf.keras.layers.Lambda(lambda x: tf.nn.l2_normalize(x, axis=1), name=f"{name_prefix}_normalize")(x)
        
        return tf.keras.Model(inputs, x, name=f"{name_prefix}_tower")
    
    def call(self, inputs: Dict[str, tf.Tensor], training: Optional[bool] = None) -> tf.Tensor:
        """
        Forward pass of the two-tower model.
        
        Args:
            inputs: Dict containing 'query_ids' and 'candidate_ids'
            training: Whether the model is in training mode
            
        Returns:
            Similarity scores between queries and candidates
        """
        query_ids = inputs['query_ids']
        candidate_ids = inputs['candidate_ids']
        
        # Get embeddings
        query_emb = self.query_embedding(query_ids)
        candidate_emb = self.candidate_embedding(candidate_ids)
        
        # Pass through towers
        query_repr = self.query_tower(query_emb, training=training)
        candidate_repr = self.candidate_tower(candidate_emb, training=training)
        
        # Compute similarity (dot product)
        similarity = tf.reduce_sum(query_repr * candidate_repr, axis=1)
        
        return similarity


class XGBoostTwoTowerModel:
    """
    XGBoost-based Two-Tower model for feature-rich scenarios.
    Uses XGBoost to learn complex feature interactions after tower processing.
    """
    
    def __init__(
        self,
        query_vocab_size: int,
        candidate_vocab_size: int,
        embedding_dim: int = 64,
        xgb_params: Optional[Dict] = None
    ):
        import xgboost as xgb
        
        self.query_vocab_size = query_vocab_size
        self.candidate_vocab_size = candidate_vocab_size
        self.embedding_dim = embedding_dim
        
        # Initialize embeddings (can be pre-trained)
        self.query_embeddings = np.random.normal(0, 0.1, (query_vocab_size, embedding_dim))
        self.candidate_embeddings = np.random.normal(0, 0.1, (candidate_vocab_size, embedding_dim))
        
        # XGBoost model parameters
        default_params = {
            'objective': 'binary:logistic',
            'eval_metric': 'logloss',
            'max_depth': 6,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42
        }
        self.xgb_params = {**default_params, **(xgb_params or {})}
        self.model = None
        
    def _create_features(self, query_ids: np.ndarray, candidate_ids: np.ndarray) -> np.ndarray:
        """Create features by combining query and candidate embeddings."""
        query_embs = self.query_embeddings[query_ids]
        candidate_embs = self.candidate_embeddings[candidate_ids]
        
        # Combine embeddings: concatenation, element-wise product, and difference
        concat_features = np.concatenate([query_embs, candidate_embs], axis=1)
        product_features = query_embs * candidate_embs
        diff_features = np.abs(query_embs - candidate_embs)
        
        return np.concatenate([concat_features, product_features, diff_features], axis=1)
    
    def fit(self, query_ids: np.ndarray, candidate_ids: np.ndarray, labels: np.ndarray):
        """Train the XGBoost model."""
        import xgboost as xgb
        
        X = self._create_features(query_ids, candidate_ids)
        
        dtrain = xgb.DMatrix(X, label=labels)
        self.model = xgb.train(self.xgb_params, dtrain, num_boost_round=100)
        
    def predict(self, query_ids: np.ndarray, candidate_ids: np.ndarray) -> np.ndarray:
        """Make predictions."""
        if self.model is None:
            raise ValueError("Model must be trained first!")
        
        import xgboost as xgb
        
        X = self._create_features(query_ids, candidate_ids)
        dtest = xgb.DMatrix(X)
        
        return self.model.predict(dtest)
    
    def update_embeddings(self, query_embeddings: np.ndarray, candidate_embeddings: np.ndarray):
        """Update embeddings (useful when using pre-trained embeddings)."""
        self.query_embeddings = query_embeddings
        self.candidate_embeddings = candidate_embeddings
