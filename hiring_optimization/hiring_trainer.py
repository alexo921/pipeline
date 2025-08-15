"""
Training pipeline for hiring optimization two-tower model.
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import matplotlib.pyplot as plt
from sklearn.metrics import roc_auc_score, precision_recall_curve, average_precision_score
import os
from datetime import datetime

from hiring_model import HiringTwoTowerModel, HiringMatchingLoss

class HiringDataset(Dataset):
    """Dataset for hiring optimization training."""
    
    def __init__(
        self,
        candidate_features: np.ndarray,
        job_features: np.ndarray, 
        candidate_indices: np.ndarray,
        job_indices: np.ndarray,
        labels: np.ndarray
    ):
        self.candidate_features = torch.FloatTensor(candidate_features)
        self.job_features = torch.FloatTensor(job_features)
        self.candidate_indices = torch.LongTensor(candidate_indices)
        self.job_indices = torch.LongTensor(job_indices)
        self.labels = torch.FloatTensor(labels)
        
    def __len__(self):
        return len(self.labels)
    
    def __getitem__(self, idx):
        return {
            'candidate_features': self.candidate_features[self.candidate_indices[idx]],
            'job_features': self.job_features[self.job_indices[idx]],
            'labels': self.labels[idx],
            'candidate_idx': self.candidate_indices[idx],
            'job_idx': self.job_indices[idx]
        }

class HiringTrainer:
    """Trainer for hiring optimization model."""
    
    def __init__(
        self,
        model: HiringTwoTowerModel,
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu',
        learning_rate: float = 0.001,
        weight_decay: float = 0.01
    ):
        self.model = model.to(device)
        self.device = device
        self.optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
        self.criterion = HiringMatchingLoss()
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer, mode='max', factor=0.5, patience=3, 
        )
        
        # Training history
        self.train_losses = []
        self.val_losses = []
        self.train_aucs = []
        self.val_aucs = []
        self.train_aps = []  # Average precision scores
        self.val_aps = []
        
    def train_epoch(self, train_loader: DataLoader) -> Tuple[float, float, float]:
        """Train for one epoch."""
        self.model.train()
        total_loss = 0
        all_predictions = []
        all_labels = []
        
        for batch_idx, batch in enumerate(train_loader):
            # Move batch to device
            candidate_features = batch['candidate_features'].to(self.device)
            job_features = batch['job_features'].to(self.device)
            labels = batch['labels'].to(self.device)
            
            # Forward pass
            self.optimizer.zero_grad()
            similarities = self.model(candidate_features, job_features)
            loss = self.criterion(similarities, labels)
            
            # Backward pass
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            
            # Store predictions for metrics
            with torch.no_grad():
                predictions = torch.sigmoid(similarities)
                all_predictions.extend(predictions.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
            
            # Print progress
            if batch_idx % 50 == 0:
                print(f'  Batch {batch_idx}/{len(train_loader)}, Loss: {loss.item():.4f}')
        
        avg_loss = total_loss / len(train_loader)
        auc = roc_auc_score(all_labels, all_predictions)
        ap = average_precision_score(all_labels, all_predictions)
        
        return avg_loss, auc, ap
    
    def validate(self, val_loader: DataLoader) -> Tuple[float, float, float]:
        """Validate the model."""
        self.model.eval()
        total_loss = 0
        all_predictions = []
        all_labels = []
        
        with torch.no_grad():
            for batch in val_loader:
                candidate_features = batch['candidate_features'].to(self.device)
                job_features = batch['job_features'].to(self.device)
                labels = batch['labels'].to(self.device)
                
                similarities = self.model(candidate_features, job_features)
                loss = self.criterion(similarities, labels)
                
                total_loss += loss.item()
                
                predictions = torch.sigmoid(similarities)
                all_predictions.extend(predictions.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        avg_loss = total_loss / len(val_loader)
        auc = roc_auc_score(all_labels, all_predictions)
        ap = average_precision_score(all_labels, all_predictions)
        
        return avg_loss, auc, ap
    
    def train(
        self,
        train_loader: DataLoader,
        val_loader: Optional[DataLoader] = None,
        epochs: int = 20,
        early_stopping_patience: int = 7,
        save_path: Optional[str] = None
    ):
        """Train the model."""
        print(f"🚀 Training hiring model on {self.device}")
        print(f"Model parameters: {sum(p.numel() for p in self.model.parameters()):,}")
        
        best_val_score = 0
        patience_counter = 0
        
        for epoch in range(epochs):
            print(f"\n📊 Epoch {epoch+1}/{epochs}")
            print("-" * 50)
            
            # Training
            train_loss, train_auc, train_ap = self.train_epoch(train_loader)
            self.train_losses.append(train_loss)
            self.train_aucs.append(train_auc)
            self.train_aps.append(train_ap)
            
            print(f"Train - Loss: {train_loss:.4f}, AUC: {train_auc:.4f}, AP: {train_ap:.4f}")
            
            # Validation
            if val_loader is not None:
                val_loss, val_auc, val_ap = self.validate(val_loader)
                self.val_losses.append(val_loss)
                self.val_aucs.append(val_auc)
                self.val_aps.append(val_ap)
                
                print(f"Val   - Loss: {val_loss:.4f}, AUC: {val_auc:.4f}, AP: {val_ap:.4f}")
                
                # Learning rate scheduling
                self.scheduler.step(val_auc)
                
                # Early stopping based on validation AUC
                current_score = val_auc
                if current_score > best_val_score:
                    best_val_score = current_score
                    patience_counter = 0
                    
                    # Save best model
                    if save_path:
                        self.save_model(save_path)
                        print(f"✅ Best model saved (AUC: {best_val_score:.4f})")
                else:
                    patience_counter += 1
                    
                if patience_counter >= early_stopping_patience:
                    print(f"🛑 Early stopping triggered after {epoch+1} epochs")
                    break
            
            print(f"Learning rate: {self.optimizer.param_groups[0]['lr']:.6f}")
    
    def evaluate_matches(
        self,
        candidate_features: torch.Tensor,
        job_features: torch.Tensor,
        candidate_df: pd.DataFrame,
        job_df: pd.DataFrame,
        top_k: int = 5
    ) -> Dict:
        """Evaluate model on candidate-job matching."""
        self.model.eval()
        
        with torch.no_grad():
            candidate_features = candidate_features.to(self.device)
            job_features = job_features.to(self.device)
            
            # Get top matches for each candidate
            top_scores, top_indices = self.model.predict_matches(
                candidate_features, job_features, top_k=top_k
            )
            
            results = {
                'top_scores': top_scores.cpu().numpy(),
                'top_indices': top_indices.cpu().numpy(),
                'n_candidates': len(candidate_df),
                'n_jobs': len(job_df)
            }
            
            # Print sample results
            print(f"\n🎯 Top {top_k} job matches for sample candidates:")
            print("=" * 60)
            
            for i in range(min(5, len(candidate_df))):
                if i < len(top_scores):
                    candidate_name = candidate_df.iloc[i].get('name', f'Candidate_{i}')
                    print(f"\n👤 {candidate_name}:")
                    
                    for j in range(min(top_k, len(top_indices[i]))):
                        job_idx = top_indices[i][j].item()
                        score = top_scores[i][j].item()
                        
                        if job_idx < len(job_df):
                            job_title = job_df.iloc[job_idx].get('title', f'Job_{job_idx}')
                            company = job_df.iloc[job_idx].get('company', 'Unknown')
                            print(f"  {j+1}. {job_title} @ {company} (score: {score:.3f})")
            
            return results
    
    def plot_training_history(self, save_path: Optional[str] = None):
        """Plot training history with hiring-specific metrics."""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 10))
        
        # Plot losses
        ax1.plot(self.train_losses, label='Train Loss', color='blue', alpha=0.8)
        if self.val_losses:
            ax1.plot(self.val_losses, label='Validation Loss', color='red', alpha=0.8)
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Loss')
        ax1.set_title('Training and Validation Loss')
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Plot AUCs
        ax2.plot(self.train_aucs, label='Train AUC', color='blue', alpha=0.8)
        if self.val_aucs:
            ax2.plot(self.val_aucs, label='Validation AUC', color='red', alpha=0.8)
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('AUC-ROC')
        ax2.set_title('AUC-ROC Scores')
        ax2.legend()
        ax2.grid(True, alpha=0.3)
        
        # Plot Average Precision
        ax3.plot(self.train_aps, label='Train AP', color='blue', alpha=0.8)
        if self.val_aps:
            ax3.plot(self.val_aps, label='Validation AP', color='red', alpha=0.8)
        ax3.set_xlabel('Epoch')
        ax3.set_ylabel('Average Precision')
        ax3.set_title('Average Precision Scores')
        ax3.legend()
        ax3.grid(True, alpha=0.3)
        
        # Learning curves comparison
        if self.val_aucs and self.val_aps:
            ax4.plot(self.val_aucs, label='Validation AUC', color='green', alpha=0.8)
            ax4.plot(self.val_aps, label='Validation AP', color='orange', alpha=0.8)
            ax4.set_xlabel('Epoch')
            ax4.set_ylabel('Score')
            ax4.set_title('Validation Metrics Comparison')
            ax4.legend()
            ax4.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"📊 Training plots saved to {save_path}")
        else:
            plt.show()
    
    def save_model(self, path: str):
        """Save model and training state."""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'train_losses': self.train_losses,
            'val_losses': self.val_losses,
            'train_aucs': self.train_aucs,
            'val_aucs': self.val_aucs,
            'train_aps': self.train_aps,
            'val_aps': self.val_aps,
        }, path)
    
    def load_model(self, path: str):
        """Load saved model and training state."""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        
        if 'scheduler_state_dict' in checkpoint:
            self.scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
        
        # Load training history
        self.train_losses = checkpoint.get('train_losses', [])
        self.val_losses = checkpoint.get('val_losses', [])
        self.train_aucs = checkpoint.get('train_aucs', [])
        self.val_aucs = checkpoint.get('val_aucs', [])
        self.train_aps = checkpoint.get('train_aps', [])
        self.val_aps = checkpoint.get('val_aps', [])

def create_data_loaders(data: Dict, batch_size: int = 128, val_split: float = 0.2) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """Create train, validation, and test data loaders."""
    
    # Get data
    candidate_features = data['candidate_features']
    job_features = data['job_features']
    candidate_indices = data['candidate_indices']
    job_indices = data['job_indices']
    labels = data['labels']
    
    # Split data
    n_samples = len(labels)
    n_val = int(val_split * n_samples)
    n_test = int(val_split * n_samples)
    n_train = n_samples - n_val - n_test
    
    # Random permutation
    perm = np.random.permutation(n_samples)
    train_idx = perm[:n_train]
    val_idx = perm[n_train:n_train + n_val]
    test_idx = perm[n_train + n_val:]
    
    # Create datasets
    train_dataset = HiringDataset(
        candidate_features, job_features,
        candidate_indices[train_idx], job_indices[train_idx], labels[train_idx]
    )
    
    val_dataset = HiringDataset(
        candidate_features, job_features,
        candidate_indices[val_idx], job_indices[val_idx], labels[val_idx]
    )
    
    test_dataset = HiringDataset(
        candidate_features, job_features,
        candidate_indices[test_idx], job_indices[test_idx], labels[test_idx]
    )
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
    
    print(f"📊 Data splits created:")
    print(f"  Train: {len(train_dataset):,} samples ({len(train_loader)} batches)")
    print(f"  Val:   {len(val_dataset):,} samples ({len(val_loader)} batches)")
    print(f"  Test:  {len(test_dataset):,} samples ({len(test_loader)} batches)")
    
    return train_loader, val_loader, test_loader

if __name__ == "__main__":
    print("🧪 Testing hiring trainer...")
    
    # Create dummy data for testing
    from hiring_model import create_hiring_model
    
    candidate_dim, job_dim = 50, 30
    n_candidates, n_jobs = 100, 20
    n_pairs = 1000
    
    # Dummy data
    dummy_data = {
        'candidate_features': np.random.randn(n_candidates, candidate_dim),
        'job_features': np.random.randn(n_jobs, job_dim),
        'candidate_indices': np.random.randint(0, n_candidates, n_pairs),
        'job_indices': np.random.randint(0, n_jobs, n_pairs),
        'labels': np.random.randint(0, 2, n_pairs).astype(float)
    }
    
    # Create model and trainer
    model = create_hiring_model(candidate_dim, job_dim)
    trainer = HiringTrainer(model)
    
    # Create data loaders
    train_loader, val_loader, test_loader = create_data_loaders(dummy_data, batch_size=32)
    
    # Quick training test (1 epoch)
    print("\n🚀 Testing training for 1 epoch...")
    trainer.train(train_loader, val_loader, epochs=1)
    
    print("✅ Trainer test completed successfully!")
