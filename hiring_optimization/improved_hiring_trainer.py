#!/usr/bin/env python3
"""
Improved hiring trainer with better data balancing and similarity scoring.
Addresses the 3.2% positive match rate issue and improves model performance.
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import matplotlib.pyplot as plt
from sklearn.metrics import roc_auc_score, precision_recall_curve, average_precision_score
import os
from datetime import datetime
from sklearn.model_selection import train_test_split

from hiring_model import HiringTwoTowerModel, HiringMatchingLoss

class ImprovedHiringDataset(Dataset):
    """Improved dataset with better data balancing."""
    
    def __init__(
        self,
        candidate_features: np.ndarray,
        job_features: np.ndarray, 
        candidate_indices: np.ndarray,
        job_indices: np.ndarray,
        labels: np.ndarray,
        weights: Optional[np.ndarray] = None
    ):
        self.candidate_features = torch.FloatTensor(candidate_features)
        self.job_features = torch.FloatTensor(job_features)
        self.candidate_indices = torch.LongTensor(candidate_indices)
        self.job_indices = torch.LongTensor(job_indices)
        self.labels = torch.FloatTensor(labels)
        self.weights = torch.FloatTensor(weights) if weights is not None else None
        
    def __len__(self):
        return len(self.labels)
    
    def __getitem__(self, idx):
        return {
            'candidate_features': self.candidate_features[self.candidate_indices[idx]],
            'job_features': self.job_features[self.job_indices[idx]],
            'labels': self.labels[idx],
            'candidate_idx': self.candidate_indices[idx],
            'job_idx': self.job_indices[idx],
            'weights': self.weights[idx] if self.weights is not None else 1.0
        }

class ImprovedHiringTrainer:
    """Improved trainer with better data balancing and training strategies."""
    
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
            self.optimizer, mode='max', factor=0.5, patience=5
        )
        
        # Training history
        self.train_losses = []
        self.val_losses = []
        self.train_aucs = []
        self.val_aucs = []
        self.train_aps = []
        self.val_aps = []
        
    def create_balanced_data_loaders(
        self,
        data: Dict,
        batch_size: int = 128,
        val_split: float = 0.15,
        test_split: float = 0.15,
        positive_oversample: float = 3.0  # Oversample positive pairs
    ) -> Tuple[DataLoader, DataLoader, DataLoader]:
        """Create balanced data loaders with oversampling of positive pairs."""
        
        print("🔄 Creating balanced data loaders...")
        
        # Separate positive and negative pairs
        positive_mask = data['labels'] > 0.5
        negative_mask = ~positive_mask
        
        positive_indices = np.where(positive_mask)[0]
        negative_indices = np.where(negative_mask)[0]
        
        print(f"  📊 Positive pairs: {len(positive_indices)}")
        print(f"  📊 Negative pairs: {len(negative_indices)}")
        
        # Oversample positive pairs
        n_positive = len(positive_indices)
        n_negative = len(negative_indices)
        target_positive = int(n_negative * positive_oversample)
        
        if target_positive > n_positive:
            # Repeat positive pairs
            positive_indices = np.tile(positive_indices, int(np.ceil(target_positive / n_positive)))
            positive_indices = positive_indices[:target_positive]
        
        # Combine and shuffle
        balanced_indices = np.concatenate([positive_indices, negative_indices])
        np.random.shuffle(balanced_indices)
        
        print(f"  📊 Balanced dataset: {len(balanced_indices)} pairs")
        print(f"  📊 New positive rate: {len(positive_indices) / len(balanced_indices):.1%}")
        
        # Split indices
        train_idx, temp_idx = train_test_split(
            balanced_indices, test_size=val_split + test_split, random_state=42
        )
        val_idx, test_idx = train_test_split(
            temp_idx, test_size=test_split / (val_split + test_split), random_state=42
        )
        
        # Create datasets
        train_dataset = ImprovedHiringDataset(
            data['candidate_features'],
            data['job_features'],
            data['candidate_indices'][train_idx],
            data['job_indices'][train_idx],
            data['labels'][train_idx]
        )
        
        val_dataset = ImprovedHiringDataset(
            data['candidate_features'],
            data['job_features'],
            data['candidate_indices'][val_idx],
            data['job_indices'][val_idx],
            data['labels'][val_idx]
        )
        
        test_dataset = ImprovedHiringDataset(
            data['candidate_features'],
            data['job_features'],
            data['candidate_indices'][test_idx],
            data['job_indices'][test_idx],
            data['labels'][test_idx]
        )
        
        # Create loaders
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
        
        print(f"📊 Data splits created:")
        print(f"  Train: {len(train_dataset)} samples ({len(train_loader)} batches)")
        print(f"  Val:   {len(val_dataset)} samples ({len(val_loader)} batches)")
        print(f"  Test:  {len(test_dataset)} samples ({len(test_loader)} batches)")
        
        return train_loader, val_loader, test_loader
    
    def train_epoch(self, train_loader: DataLoader) -> Tuple[float, float, float]:
        """Train for one epoch with improved loss computation."""
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
            
            # Apply temperature scaling to improve similarity distribution
            temperature = 0.1
            scaled_similarities = similarities / temperature
            
            loss = self.criterion(scaled_similarities, labels)
            
            # Backward pass
            loss.backward()
            
            # Gradient clipping to prevent exploding gradients
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            
            self.optimizer.step()
            
            total_loss += loss.item()
            
            # Store predictions for metrics
            with torch.no_grad():
                predictions = torch.sigmoid(scaled_similarities)
                all_predictions.extend(predictions.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
            
            if batch_idx % 20 == 0:
                print(f"  Batch {batch_idx}/{len(train_loader)}, Loss: {loss.item():.4f}")
        
        # Calculate metrics
        avg_loss = total_loss / len(train_loader)
        auc = roc_auc_score(all_labels, all_predictions) if len(set(all_labels)) > 1 else 0.5
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
                temperature = 0.1
                scaled_similarities = similarities / temperature
                
                loss = self.criterion(scaled_similarities, labels)
                total_loss += loss.item()
                
                predictions = torch.sigmoid(scaled_similarities)
                all_predictions.extend(predictions.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        avg_loss = total_loss / len(val_loader)
        auc = roc_auc_score(all_labels, all_predictions) if len(set(all_labels)) > 1 else 0.5
        ap = average_precision_score(all_labels, all_predictions)
        
        return avg_loss, auc, ap
    
    def train(
        self,
        train_loader: DataLoader,
        val_loader: DataLoader,
        epochs: int = 50,
        early_stopping_patience: int = 15,
        save_path: str = None
    ):
        """Train the model with improved monitoring."""
        
        print(f"🚀 Training improved hiring model on {self.device}")
        print(f"Model parameters: {sum(p.numel() for p in self.model.parameters()):,}")
        
        best_val_auc = 0
        patience_counter = 0
        
        for epoch in range(epochs):
            print(f"\n📊 Epoch {epoch+1}/{epochs}")
            print("-" * 50)
            
            # Training
            train_loss, train_auc, train_ap = self.train_epoch(train_loader)
            
            # Validation
            val_loss, val_auc, val_ap = self.validate(val_loader)
            
            # Store history
            self.train_losses.append(train_loss)
            self.val_losses.append(val_loss)
            self.train_aucs.append(train_auc)
            self.val_aucs.append(val_auc)
            self.train_aps.append(train_ap)
            self.val_aps.append(val_ap)
            
            # Print results
            print(f"Train - Loss: {train_loss:.4f}, AUC: {train_auc:.4f}, AP: {train_ap:.4f}")
            print(f"Val   - Loss: {val_loss:.4f}, AUC: {val_auc:.4f}, AP: {val_ap:.4f}")
            
            # Learning rate scheduling
            self.scheduler.step(val_auc)
            current_lr = self.optimizer.param_groups[0]['lr']
            print(f"Learning rate: {current_lr:.6f}")
            
            # Save best model
            if val_auc > best_val_auc:
                best_val_auc = val_auc
                patience_counter = 0
                if save_path:
                    torch.save(self.model.state_dict(), save_path)
                    print(f"✅ Best model saved (AUC: {val_auc:.4f})")
            else:
                patience_counter += 1
                if patience_counter >= early_stopping_patience:
                    print(f"🛑 Early stopping triggered after {epoch+1} epochs")
                    break
        
        print(f"\n🏆 Training completed! Best validation AUC: {best_val_auc:.4f}")
    
    def evaluate_matches(
        self,
        candidate_features: torch.Tensor,
        job_features: torch.Tensor,
        candidate_df: pd.DataFrame,
        job_df: pd.DataFrame,
        top_k: int = 5
    ) -> Dict:
        """Evaluate matches with improved similarity scoring."""
        
        print(f"\n🎯 Evaluating matches with improved model...")
        
        self.model.eval()
        with torch.no_grad():
            # Get embeddings
            candidate_embs = self.model.forward_candidate(candidate_features)
            job_embs = self.model.forward_job(job_features)
            
            # Compute similarities with temperature scaling
            temperature = 0.1
            similarities = torch.mm(candidate_embs, job_embs.T) / temperature
            
            # Apply sigmoid to get probabilities
            probabilities = torch.sigmoid(similarities)
            
            # Get top matches for each candidate
            top_probs, top_indices = torch.topk(probabilities, k=min(top_k, job_features.size(0)), dim=1)
            
            results = {}
            for i in range(min(5, candidate_features.size(0))):  # Show first 5 candidates
                candidate_name = candidate_df.iloc[i]['Filename'] if 'Filename' in candidate_df.columns else f"Candidate_{i}"
                
                matches = []
                for j in range(top_k):
                    job_idx = top_indices[i][j].item()
                    job_title = job_df.iloc[job_idx]['title'] if 'title' in job_df.columns else f"Job_{job_idx}"
                    company = job_df.iloc[job_idx]['company'] if 'company' in job_df.columns else "Unknown"
                    prob = top_probs[i][j].item()
                    
                    matches.append({
                        'job_title': job_title,
                        'company': company,
                        'probability': prob,
                        'score': similarities[i][job_idx].item()
                    })
                
                results[candidate_name] = matches
            
            return results
    
    def plot_training_history(self, save_path: str):
        """Plot training history."""
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # Loss
        axes[0, 0].plot(self.train_losses, label='Train')
        axes[0, 0].plot(self.val_losses, label='Validation')
        axes[0, 0].set_title('Training and Validation Loss')
        axes[0, 0].set_xlabel('Epoch')
        axes[0, 0].set_ylabel('Loss')
        axes[0, 0].legend()
        axes[0, 0].grid(True)
        
        # AUC
        axes[0, 1].plot(self.train_aucs, label='Train')
        axes[0, 1].plot(self.val_aucs, label='Validation')
        axes[0, 1].set_title('Training and Validation AUC')
        axes[0, 1].set_xlabel('Epoch')
        axes[0, 1].set_ylabel('AUC')
        axes[0, 1].legend()
        axes[0, 1].grid(True)
        
        # AP
        axes[1, 0].plot(self.train_aps, label='Train')
        axes[1, 0].plot(self.val_aps, label='Validation')
        axes[1, 0].set_title('Training and Validation Average Precision')
        axes[1, 0].set_xlabel('Epoch')
        axes[1, 0].set_ylabel('AP')
        axes[1, 0].legend()
        axes[1, 0].grid(True)
        
        # Learning rate
        axes[1, 1].plot(range(len(self.train_losses)), [0.001] * len(self.train_losses), label='Initial LR')
        axes[1, 1].set_title('Learning Rate Schedule')
        axes[1, 1].set_xlabel('Epoch')
        axes[1, 1].set_ylabel('Learning Rate')
        axes[1, 1].legend()
        axes[1, 1].grid(True)
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

    def load_model(self, path: str):
        """Load a trained model from the given path."""
        print(f"📥 Loading model from {path}")
        checkpoint = torch.load(path, map_location=self.device)
        
        # Handle different checkpoint formats
        if 'model_state_dict' in checkpoint:
            # Standard checkpoint format
            self.model.load_state_dict(checkpoint['model_state_dict'])
            if 'optimizer_state_dict' in checkpoint:
                self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        else:
            # Direct state dict format (what we have)
            self.model.load_state_dict(checkpoint)
        
        print(f"✅ Model loaded successfully from {path}")
    
    def save_model(self, path: str):
        """Save the current model state."""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'train_losses': self.train_losses,
            'val_losses': self.val_losses,
            'train_aucs': self.train_aucs,
            'val_aucs': self.val_aucs,
            'train_aps': self.train_aps,
            'val_aps': self.val_aps
        }, path)
        print(f"💾 Model saved to {path}")

def create_improved_data_loaders(data: Dict, **kwargs):
    """Create improved data loaders with the new trainer."""
    trainer = ImprovedHiringTrainer(None)  # Temporary trainer just for data loading
    return trainer.create_balanced_data_loaders(data, **kwargs)
