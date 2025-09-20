#!/usr/bin/env python

import torch
import torch.nn as nn
import torch.nn.functional as F
import tensorflow as tf
from typing import Dict, List, Optional
import numpy as np


# =========================================================
# Sinusoidal Positional Embedding
# =========================================================
class SinusoidalPositionalEmbedding(nn.Module):
    """
    Implements Sinusoidal Positional Encoding (used in Transformer).
    """
    def __init__(self, max_seq_len: int, embed_dim: int):
        super().__init__()
        position = torch.arange(max_seq_len).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, embed_dim, 2) * (-np.log(10000.0) / embed_dim))

        pe = torch.zeros(max_seq_len, embed_dim)
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)

        self.register_buffer("pe", pe.unsqueeze(0))  # (1, max_seq_len, embed_dim)

    def forward(self, x):
        return x + self.pe[:, :x.size(1)]


# =========================================================
# PyTorch Two-Tower Model
# =========================================================
class TwoTowerModel(nn.Module):
    def __init__(
        self,
        query_vocab_size: int,
        candidate_vocab_size: int,
        embedding_dim: int = 64,
        hidden_dims: List[int] = [128, 64],
        dropout_rate: float = 0.1,
        use_positional_encoding: bool = True,
        use_batch_norm: bool = True,
        seq_len_query: int = 10,
        seq_len_candidate: int = 12
    ):
        super(TwoTowerModel, self).__init__()

        self.embedding_dim = embedding_dim
        self.seq_len_query = seq_len_query
        self.seq_len_candidate = seq_len_candidate
        self.use_positional_encoding = use_positional_encoding

        # Positional Embeddings
        self.positional_embedding_query = SinusoidalPositionalEmbedding(self.seq_len_query, embedding_dim)
        self.positional_embedding_candidate = SinusoidalPositionalEmbedding(self.seq_len_candidate, embedding_dim)

        # Query Tower
        self.query_embedding = nn.Embedding(query_vocab_size, embedding_dim)
        self.query_tower = self._build_tower(embedding_dim, hidden_dims, dropout_rate, use_batch_norm)

        # Candidate Tower
        self.candidate_embedding = nn.Embedding(candidate_vocab_size, embedding_dim)
        self.candidate_tower = self._build_tower(embedding_dim, hidden_dims, dropout_rate, use_batch_norm)

        # Output dimension
        self.output_dim = hidden_dims[-1] if hidden_dims else embedding_dim

    def _build_tower(self, input_dim: int, hidden_dims: List[int], dropout_rate: float, use_batch_norm: bool):
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
        # Query
        query_emb = self.query_embedding(query_ids)
        if self.use_positional_encoding:
            query_emb = self.positional_embedding_query(query_emb)

        # Candidate
        candidate_emb = self.candidate_embedding(candidate_ids)
        if self.use_positional_encoding:
            candidate_emb = self.positional_embedding_candidate(candidate_emb)

        # Mean pooling (seq_len -> fixed size)
        query_emb = query_emb.mean(dim=1)
        candidate_emb = candidate_emb.mean(dim=1)

        # Towers
        query_repr = self.query_tower(query_emb)
        candidate_repr = self.candidate_tower(candidate_emb)

        # Normalize and compute similarity
        query_repr = F.normalize(query_repr, p=2, dim=1)
        candidate_repr = F.normalize(candidate_repr, p=2, dim=1)
        similarity = torch.sum(query_repr * candidate_repr, dim=1)
        return similarity


# =========================================================
# TensorFlow Two-Tower Model
# =========================================================
class TensorFlowTwoTowerModel(tf.keras.Model):
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

        # Towers
        self.query_embedding = tf.keras.layers.Embedding(query_vocab_size, embedding_dim)
        self.query_tower = self._build_tower(hidden_dims, dropout_rate, name_prefix="query")

        self.candidate_embedding = tf.keras.layers.Embedding(candidate_vocab_size, embedding_dim)
        self.candidate_tower = self._build_tower(hidden_dims, dropout_rate, name_prefix="candidate")

    def _build_tower(self, hidden_dims: List[int], dropout_rate: float, name_prefix: str) -> tf.keras.Model:
        inputs = tf.keras.Input(shape=(self.embedding_dim,))
        x = inputs
        for i, hidden_dim in enumerate(hidden_dims):
            x = tf.keras.layers.Dense(hidden_dim, activation='relu', name=f"{name_prefix}_dense_{i}")(x)
            x = tf.keras.layers.BatchNormalization(name=f"{name_prefix}_bn_{i}")(x)
            x = tf.keras.layers.Dropout(dropout_rate, name=f"{name_prefix}_dropout_{i}")(x)
        x = tf.keras.layers.Lambda(lambda x: tf.nn.l2_normalize(x, axis=1), name=f"{name_prefix}_normalize")(x)
        return tf.keras.Model(inputs, x, name=f"{name_prefix}_tower")

    def call(self, inputs: Dict[str, tf.Tensor], training: Optional[bool] = None) -> tf.Tensor:
        query_ids = inputs['query_ids']
        candidate_ids = inputs['candidate_ids']

        query_emb = self.query_embedding(query_ids)
        candidate_emb = self.candidate_embedding(candidate_ids)

        # Mean pooling (for seq inputs)
        query_emb = tf.reduce_mean(query_emb, axis=1)
        candidate_emb = tf.reduce_mean(candidate_emb, axis=1)

        query_repr = self.query_tower(query_emb, training=training)
        candidate_repr = self.candidate_tower(candidate_emb, training=training)

        similarity = tf.reduce_sum(query_repr * candidate_repr, axis=1)
        return similarity


# =========================================================
# XGBoost Two-Tower Model
# =========================================================
class XGBoostTwoTowerModel:
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

        self.query_embeddings = np.random.normal(0, 0.1, (query_vocab_size, embedding_dim))
        self.candidate_embeddings = np.random.normal(0, 0.1, (candidate_vocab_size, embedding_dim))

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
        query_embs = self.query_embeddings[query_ids]
        candidate_embs = self.candidate_embeddings[candidate_ids]

        concat_features = np.concatenate([query_embs, candidate_embs], axis=1)
        product_features = query_embs * candidate_embs
        diff_features = np.abs(query_embs - candidate_embs)

        return np.concatenate([concat_features, product_features, diff_features], axis=1)

    def fit(self, query_ids: np.ndarray, candidate_ids: np.ndarray, labels: np.ndarray):
        import xgboost as xgb
        X = self._create_features(query_ids, candidate_ids)
        dtrain = xgb.DMatrix(X, label=labels)
        self.model = xgb.train(self.xgb_params, dtrain, num_boost_round=50)

    def predict(self, query_ids: np.ndarray, candidate_ids: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise ValueError("Model must be trained first!")

        import xgboost as xgb
        X = self._create_features(query_ids, candidate_ids)
        dtest = xgb.DMatrix(X)
        return self.model.predict(dtest)


# =========================================================
# Example usage
# =========================================================
if __name__ == "__main__":
    # ------------------ PyTorch Demo ------------------
    print("\n=== PyTorch TwoTowerModel Demo ===")
    query_vocab_size, candidate_vocab_size = 100, 200
    seq_len_query, seq_len_candidate = 10, 12   # define sequence lengths

    torch_model = TwoTowerModel(
        query_vocab_size=query_vocab_size,
        candidate_vocab_size=candidate_vocab_size,
        seq_len_query=seq_len_query,
        seq_len_candidate=seq_len_candidate
    )

    # batch_size=5, seq_len=10 for queries, 12 for candidates
    query_ids = torch.randint(0, query_vocab_size, (5, seq_len_query))
    candidate_ids = torch.randint(0, candidate_vocab_size, (5, seq_len_candidate))
    scores = torch_model(query_ids, candidate_ids)
    print("PyTorch similarity scores:", scores.detach().numpy())

    # ------------------ TensorFlow Demo ------------------
    print("\n=== TensorFlow TwoTowerModel Demo ===")
    tf_model = TensorFlowTwoTowerModel(query_vocab_size, candidate_vocab_size)

    tf_query_ids = tf.random.uniform((5, 10), minval=0, maxval=query_vocab_size, dtype=tf.int32)
    tf_candidate_ids = tf.random.uniform((5, 12), minval=0, maxval=candidate_vocab_size, dtype=tf.int32)
    inputs = {"query_ids": tf_query_ids, "candidate_ids": tf_candidate_ids}
    tf_scores = tf_model(inputs, training=False)
    print("TensorFlow similarity scores:", tf_scores.numpy())

    # ------------------ XGBoost Demo ------------------
    print("\n=== XGBoost TwoTowerModel Demo ===")
    xgb_model = XGBoostTwoTowerModel(query_vocab_size, candidate_vocab_size)

    num_samples = 20
    train_query_ids = np.random.randint(0, query_vocab_size, size=num_samples)
    train_candidate_ids = np.random.randint(0, candidate_vocab_size, size=num_samples)
    labels = np.random.randint(0, 2, size=num_samples)

    xgb_model.fit(train_query_ids, train_candidate_ids, labels)

    test_query_ids = np.array([1, 2, 3])
    test_candidate_ids = np.array([10, 20, 30])
    predictions = xgb_model.predict(test_query_ids, test_candidate_ids)
    print("XGBoost predictions:", predictions)
