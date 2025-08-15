import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import numpy as np
from typing import Dict, List, Tuple, Optional
import matplotlib.pyplot as plt
from sklearn.metrics import roc_auc_score, accuracy_score
import os

class TwoTowerDataset(Dataset):
    """Dataset class for two-tower model training."""
    
    def __init__(self, query_ids: np.ndarray, candidate_ids: np.ndarray, labels: np.ndarray):
        self.query_ids = torch.LongTensor(query_ids)
        self.candidate_ids = torch.LongTensor(candidate_ids)
        self.labels = torch.FloatTensor(labels)
        
    def __len__(self):
        return len(self.query_ids)
    
    def __getitem__(self, idx):
        return {
            'query_ids': self.query_ids[idx],
            'candidate_ids': self.candidate_ids[idx],
            'labels': self.labels[idx]
        }

class TwoTowerTrainer:
    """Trainer class for two-tower models."""
    
    def __init__(
        self,
        model: nn.Module,
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu',
        learning_rate: float = 0.001,
        weight_decay: float = 0.01
    ):
        self.model = model.to(device)
        self.device = device
        self.optimizer = optim.Adam(model.parameters(), lr=learning_rate, weight_decay=weight_decay)
        self.criterion = nn.BCEWithLogitsLoss()
        
        self.train_losses = []
        self.val_losses = []
        self.train_aucs = []
        self.val_aucs = []
        
    def train_epoch(self, train_loader: DataLoader) -> Tuple[float, float]:
        """Train for one epoch."""
        self.model.train()
        total_loss = 0
        all_predictions = []
        all_labels = []
        
        for batch in train_loader:
            # Move batch to device
            query_ids = batch['query_ids'].to(self.device)
            candidate_ids = batch['candidate_ids'].to(self.device)
            labels = batch['labels'].to(self.device)
            
            # Forward pass
            self.optimizer.zero_grad()
            logits = self.model(query_ids, candidate_ids)
            loss = self.criterion(logits, labels)
            
            # Backward pass
            loss.backward()
            self.optimizer.step()
            
            total_loss += loss.item()
            
            # Store predictions for AUC calculation
            with torch.no_grad():
                predictions = torch.sigmoid(logits)
                all_predictions.extend(predictions.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        avg_loss = total_loss / len(train_loader)
        auc = roc_auc_score(all_labels, all_predictions)
        
        return avg_loss, auc
    
    def validate(self, val_loader: DataLoader) -> Tuple[float, float]:
        """Validate the model."""
        self.model.eval()
        total_loss = 0
        all_predictions = []
        all_labels = []
        
        with torch.no_grad():
            for batch in val_loader:
                query_ids = batch['query_ids'].to(self.device)
                candidate_ids = batch['candidate_ids'].to(self.device)
                labels = batch['labels'].to(self.device)
                
                logits = self.model(query_ids, candidate_ids)
                loss = self.criterion(logits, labels)
                
                total_loss += loss.item()
                
                predictions = torch.sigmoid(logits)
                all_predictions.extend(predictions.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())
        
        avg_loss = total_loss / len(val_loader)
        auc = roc_auc_score(all_labels, all_predictions)
        
        return avg_loss, auc
    
    def train(
        self,
        train_loader: DataLoader,
        val_loader: Optional[DataLoader] = None,
        epochs: int = 10,
        early_stopping_patience: int = 5,
        save_path: Optional[str] = None
    ):
        """Train the model."""
        print(f"Training on device: {self.device}")
        print(f"Model parameters: {sum(p.numel() for p in self.model.parameters()):,}")
        
        best_val_auc = 0
        patience_counter = 0
        
        for epoch in range(epochs):
            # Training
            train_loss, train_auc = self.train_epoch(train_loader)
            self.train_losses.append(train_loss)
            self.train_aucs.append(train_auc)
            
            print(f"Epoch {epoch+1}/{epochs}")
            print(f"Train Loss: {train_loss:.4f}, Train AUC: {train_auc:.4f}")
            
            # Validation
            if val_loader is not None:
                val_loss, val_auc = self.validate(val_loader)
                self.val_losses.append(val_loss)
                self.val_aucs.append(val_auc)
                
                print(f"Val Loss: {val_loss:.4f}, Val AUC: {val_auc:.4f}")
                
                # Early stopping
                if val_auc > best_val_auc:
                    best_val_auc = val_auc
                    patience_counter = 0
                    
                    # Save best model
                    if save_path:
                        self.save_model(save_path)
                        print(f"Best model saved to {save_path}")
                else:
                    patience_counter += 1
                    
                if patience_counter >= early_stopping_patience:
                    print(f"Early stopping triggered after {epoch+1} epochs")
                    break
            
            print("-" * 50)
    
    def plot_training_history(self, save_path: Optional[str] = None):
        """Plot training history."""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
        
        # Plot losses
        ax1.plot(self.train_losses, label='Train Loss', color='blue')
        if self.val_losses:
            ax1.plot(self.val_losses, label='Validation Loss', color='red')
        ax1.set_xlabel('Epoch')
        ax1.set_ylabel('Loss')
        ax1.set_title('Training and Validation Loss')
        ax1.legend()
        ax1.grid(True)
        
        # Plot AUCs
        ax2.plot(self.train_aucs, label='Train AUC', color='blue')
        if self.val_aucs:
            ax2.plot(self.val_aucs, label='Validation AUC', color='red')
        ax2.set_xlabel('Epoch')
        ax2.set_ylabel('AUC')
        ax2.set_title('Training and Validation AUC')
        ax2.legend()
        ax2.grid(True)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"Training history plot saved to {save_path}")
        else:
            plt.show()
    
    def save_model(self, path: str):
        """Save the model."""
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'train_losses': self.train_losses,
            'val_losses': self.val_losses,
            'train_aucs': self.train_aucs,
            'val_aucs': self.val_aucs,
        }, path)
    
    def load_model(self, path: str):
        """Load a saved model."""
        checkpoint = torch.load(path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.train_losses = checkpoint.get('train_losses', [])
        self.val_losses = checkpoint.get('val_losses', [])
        self.train_aucs = checkpoint.get('train_aucs', [])
        self.val_aucs = checkpoint.get('val_aucs', [])
