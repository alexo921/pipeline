"""
Specialized two-tower model for hiring optimization.
Query Tower: Job requirements → Job embeddings
Candidate Tower: Candidate features → Candidate embeddings
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, List, Tuple, Optional

class HiringTwoTowerModel(nn.Module):
    """
    Two-tower model specialized for hiring optimization.
    
    - Candidate Tower: Processes candidate features (skills, experience, etc.)
    - Job Tower: Processes job requirements (skills needed, experience, etc.)
    - Matching: Computes similarity scores for candidate-job pairs
    """
    
    def __init__(
        self,
        candidate_feature_dim: int,
        job_feature_dim: int,
        embedding_dim: int = 128,
        hidden_dims: List[int] = [256, 128],
        dropout_rate: float = 0.2,
        use_batch_norm: bool = True
    ):
        super(HiringTwoTowerModel, self).__init__()
        
        self.embedding_dim = embedding_dim
        
        # Candidate Tower
        self.candidate_tower = self._build_tower(
            candidate_feature_dim, hidden_dims, dropout_rate, use_batch_norm, "candidate"
        )
        
        # Job Tower  
        self.job_tower = self._build_tower(
            job_feature_dim, hidden_dims, dropout_rate, use_batch_norm, "job"
        )
        
        # Final projection layers to ensure same output dimension
        final_dim = hidden_dims[-1] if hidden_dims else embedding_dim
        self.candidate_projection = nn.Linear(final_dim, embedding_dim)
        self.job_projection = nn.Linear(final_dim, embedding_dim)
        
        # Optional: Additional matching layers
        self.matching_head = nn.Sequential(
            nn.Linear(embedding_dim * 2, embedding_dim),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(embedding_dim, 1)
        )
        
        # Initialize weights
        self._init_weights()
    
    def _build_tower(
        self, 
        input_dim: int, 
        hidden_dims: List[int], 
        dropout_rate: float, 
        use_batch_norm: bool,
        tower_name: str
    ) -> nn.Module:
        """Build a tower with the specified architecture."""
        layers = []
        
        prev_dim = input_dim
        for i, hidden_dim in enumerate(hidden_dims):
            layers.append(nn.Linear(prev_dim, hidden_dim))
            
            if use_batch_norm:
                layers.append(nn.BatchNorm1d(hidden_dim))
            
            layers.append(nn.ReLU())
            layers.append(nn.Dropout(dropout_rate))
            prev_dim = hidden_dim
        
        return nn.Sequential(*layers)
    
    def _init_weights(self):
        """Initialize model weights."""
        for module in self.modules():
            if isinstance(module, nn.Linear):
                nn.init.xavier_uniform_(module.weight)
                if module.bias is not None:
                    nn.init.zeros_(module.bias)
            elif isinstance(module, nn.BatchNorm1d):
                nn.init.ones_(module.weight)
                nn.init.zeros_(module.bias)
    
    def forward_candidate(self, candidate_features: torch.Tensor) -> torch.Tensor:
        """Forward pass through candidate tower."""
        x = self.candidate_tower(candidate_features)
        x = self.candidate_projection(x)
        return F.normalize(x, p=2, dim=1)
    
    def forward_job(self, job_features: torch.Tensor) -> torch.Tensor:
        """Forward pass through job tower."""
        x = self.job_tower(job_features)
        x = self.job_projection(x)
        return F.normalize(x, p=2, dim=1)
    
    def forward(
        self, 
        candidate_features: torch.Tensor, 
        job_features: torch.Tensor,
        return_embeddings: bool = False
    ) -> torch.Tensor:
        """
        Forward pass for training.
        
        Args:
            candidate_features: [batch_size, candidate_feature_dim]
            job_features: [batch_size, job_feature_dim]
            return_embeddings: If True, return embeddings instead of similarity
            
        Returns:
            Similarity scores [batch_size] or embeddings if return_embeddings=True
        """
        # Get embeddings
        candidate_emb = self.forward_candidate(candidate_features)
        job_emb = self.forward_job(job_features)
        
        if return_embeddings:
            return candidate_emb, job_emb
        
        # Compute similarity (dot product)
        similarity = torch.sum(candidate_emb * job_emb, dim=1)
        
        # Optional: Use additional matching head
        # combined = torch.cat([candidate_emb, job_emb], dim=1)
        # similarity = self.matching_head(combined).squeeze(1)
        
        return similarity
    
    def predict_matches(
        self,
        candidate_features: torch.Tensor,
        job_features: torch.Tensor,
        top_k: int = 10
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Predict top-k matches for each candidate-job pair.
        
        Args:
            candidate_features: [n_candidates, candidate_feature_dim]
            job_features: [n_jobs, job_feature_dim] 
            top_k: Number of top matches to return
            
        Returns:
            top_scores: [n_candidates, top_k]
            top_indices: [n_candidates, top_k]
        """
        self.eval()
        with torch.no_grad():
            # Get embeddings
            candidate_embs = self.forward_candidate(candidate_features)  # [n_candidates, emb_dim]
            job_embs = self.forward_job(job_features)  # [n_jobs, emb_dim]
            
            # Compute all pairwise similarities
            similarities = torch.mm(candidate_embs, job_embs.T)  # [n_candidates, n_jobs]
            
            # Get top-k for each candidate
            top_scores, top_indices = torch.topk(similarities, k=min(top_k, similarities.size(1)), dim=1)
            
            return top_scores, top_indices
    
    def get_candidate_embedding(self, candidate_features: torch.Tensor) -> torch.Tensor:
        """Get normalized candidate embeddings."""
        return self.forward_candidate(candidate_features)
    
    def get_job_embedding(self, job_features: torch.Tensor) -> torch.Tensor:
        """Get normalized job embeddings.""" 
        return self.forward_job(job_features)

class HiringMatchingLoss(nn.Module):
    """Specialized loss function for hiring optimization."""
    
    def __init__(self, margin: float = 0.5, temperature: float = 0.1):
        super().__init__()
        self.margin = margin
        self.temperature = temperature
        self.bce_loss = nn.BCEWithLogitsLoss()
    
    def forward(
        self, 
        similarities: torch.Tensor, 
        labels: torch.Tensor,
        candidate_embs: Optional[torch.Tensor] = None,
        job_embs: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """
        Compute hiring-specific loss.
        
        Args:
            similarities: [batch_size] similarity scores
            labels: [batch_size] binary labels (1 for good match, 0 for poor match)
            candidate_embs: [batch_size, emb_dim] candidate embeddings (optional)
            job_embs: [batch_size, emb_dim] job embeddings (optional)
        """
        # Primary loss: Binary cross-entropy
        primary_loss = self.bce_loss(similarities, labels)
        
        # Optional: Add contrastive loss for better embedding separation
        contrastive_loss = 0.0
        if candidate_embs is not None and job_embs is not None:
            # Positive pairs should be closer
            positive_mask = labels > 0.5
            if positive_mask.sum() > 0:
                positive_distances = 1 - similarities[positive_mask]  # 1 - cosine_similarity
                contrastive_loss += positive_distances.mean()
            
            # Negative pairs should be farther apart
            negative_mask = labels <= 0.5
            if negative_mask.sum() > 0:
                negative_distances = torch.clamp(self.margin - (1 - similarities[negative_mask]), min=0)
                contrastive_loss += negative_distances.mean()
        
        total_loss = primary_loss + 0.1 * contrastive_loss
        return total_loss

def create_hiring_model(candidate_dim: int, job_dim: int, config: Optional[Dict] = None) -> HiringTwoTowerModel:
    """Factory function to create hiring model with default configuration."""
    
    default_config = {
        'embedding_dim': 128,
        'hidden_dims': [256, 128],
        'dropout_rate': 0.2,
        'use_batch_norm': True
    }
    
    if config:
        default_config.update(config)
    
    model = HiringTwoTowerModel(
        candidate_feature_dim=candidate_dim,
        job_feature_dim=job_dim,
        **default_config
    )
    
    return model

if __name__ == "__main__":
    # Test the model
    print("Testing HiringTwoTowerModel...")
    
    # Sample dimensions
    candidate_dim = 100  # Features from candidate CSV
    job_dim = 50         # Features from job JSON
    batch_size = 32
    
    # Create model
    model = create_hiring_model(candidate_dim, job_dim)
    print(f"Model created with {sum(p.numel() for p in model.parameters()):,} parameters")
    
    # Test forward pass
    candidate_features = torch.randn(batch_size, candidate_dim)
    job_features = torch.randn(batch_size, job_dim)
    labels = torch.randint(0, 2, (batch_size,)).float()
    
    # Training mode
    model.train()
    similarities = model(candidate_features, job_features)
    print(f"Training similarities shape: {similarities.shape}")
    
    # Test loss
    loss_fn = HiringMatchingLoss()
    loss = loss_fn(similarities, labels)
    print(f"Loss: {loss.item():.4f}")
    
    # Test prediction
    model.eval()
    with torch.no_grad():
        n_candidates = 10
        n_jobs = 20
        
        all_candidates = torch.randn(n_candidates, candidate_dim)
        all_jobs = torch.randn(n_jobs, job_dim)
        
        top_scores, top_indices = model.predict_matches(all_candidates, all_jobs, top_k=5)
        print(f"Prediction shape: {top_scores.shape}")
        print(f"Top matches for candidate 0: {top_indices[0].tolist()}")
    
    print("✅ Model test completed successfully!")
