"""
Integration tests for hiring optimization training pipeline.
"""

import unittest
import torch
import numpy as np
import sys
import os
import tempfile
import shutil

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from hiring_optimization.hiring_model import HiringTwoTowerModel
from hiring_optimization.hiring_trainer import HiringTrainer, HiringDataset
from hiring_optimization.data_loader import HiringDataLoader

class TestTrainingPipeline(unittest.TestCase):
    """Test cases for the complete training pipeline."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        
        # Model parameters
        self.candidate_dim = 20
        self.job_dim = 15
        self.embedding_dim = 64
        self.batch_size = 8
        self.num_samples = 100
        
        # Create model
        self.model = HiringTwoTowerModel(
            candidate_feature_dim=self.candidate_dim,
            job_feature_dim=self.job_dim,
            embedding_dim=self.embedding_dim,
            hidden_dims=[128, 64],
            dropout_rate=0.1,
            use_batch_norm=True
        )
        
        # Create trainer
        self.trainer = HiringTrainer(
            model=self.model,
            device='cpu',  # Use CPU for testing
            learning_rate=0.001,
            weight_decay=0.01
        )
        
        # Generate synthetic data
        self._generate_test_data()
        
    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir)
        
    def _generate_test_data(self):
        """Generate synthetic test data."""
        # Generate candidate features
        self.candidate_features = np.random.randn(
            self.num_samples, self.candidate_dim
        )
        
        # Generate job features
        self.job_features = np.random.randn(
            self.num_samples, self.job_dim
        )
        
        # Generate candidate and job indices
        self.candidate_indices = np.random.randint(0, self.num_samples, self.num_samples)
        self.job_indices = np.random.randint(0, self.num_samples, self.num_samples)
        
        # Generate labels (some positive, some negative)
        self.labels = np.random.choice([0, 1], self.num_samples, p=[0.7, 0.3])
        
    def test_dataset_creation(self):
        """Test dataset creation and iteration."""
        dataset = HiringDataset(
            self.candidate_features,
            self.job_features,
            self.candidate_indices,
            self.job_indices,
            self.labels
        )
        
        # Check dataset length
        self.assertEqual(len(dataset), self.num_samples)
        
        # Check sample structure
        sample = dataset[0]
        expected_keys = ['candidate_features', 'job_features', 'labels', 'candidate_idx', 'job_idx']
        self.assertEqual(set(sample.keys()), set(expected_keys))
        
        # Check tensor types
        self.assertIsInstance(sample['candidate_features'], torch.Tensor)
        self.assertIsInstance(sample['job_features'], torch.Tensor)
        self.assertIsInstance(sample['labels'], torch.Tensor)
        
        # Check shapes
        self.assertEqual(sample['candidate_features'].shape, (self.candidate_dim,))
        self.assertEqual(sample['job_features'].shape, (self.job_dim,))
        self.assertEqual(sample['labels'].shape, ())
        
    def test_data_loader(self):
        """Test data loader functionality."""
        dataset = HiringDataset(
            self.candidate_features,
            self.job_features,
            self.candidate_indices,
            self.job_indices,
            self.labels
        )
        
        dataloader = torch.utils.data.DataLoader(
            dataset, 
            batch_size=self.batch_size, 
            shuffle=True
        )
        
        # Check batch structure
        batch = next(iter(dataloader))
        self.assertEqual(batch['candidate_features'].shape, (self.batch_size, self.candidate_dim))
        self.assertEqual(batch['job_features'].shape, (self.batch_size, self.job_dim))
        self.assertEqual(batch['labels'].shape, (self.batch_size,))
        
    def test_training_step(self):
        """Test single training step."""
        # Create small dataset
        small_dataset = HiringDataset(
            self.candidate_features[:self.batch_size],
            self.job_features[:self.batch_size],
            self.candidate_indices[:self.batch_size],
            self.job_indices[:self.batch_size],
            self.labels[:self.batch_size]
        )
        
        dataloader = torch.utils.data.DataLoader(
            small_dataset, 
            batch_size=self.batch_size, 
            shuffle=False
        )
        
        # Get initial model state
        initial_params = {name: param.clone() for name, param in self.model.named_parameters()}
        
        # Run training step
        train_loss, train_auc, train_ap = self.trainer.train_epoch(dataloader)
        
        # Check that parameters changed (training occurred)
        params_changed = False
        for name, param in self.model.named_parameters():
            if not torch.allclose(param, initial_params[name]):
                params_changed = True
                break
                
        self.assertTrue(params_changed, "Model parameters should change during training")
        
        # Check metrics are reasonable
        self.assertGreater(train_loss, 0.0)
        self.assertGreaterEqual(train_auc, 0.0)
        self.assertLessEqual(train_auc, 1.0)
        self.assertGreaterEqual(train_ap, 0.0)
        self.assertLessEqual(train_ap, 1.0)
        
    def test_validation_step(self):
        """Test validation step."""
        # Create validation dataset
        val_dataset = HiringDataset(
            self.candidate_features[:self.batch_size],
            self.job_features[:self.batch_size],
            self.candidate_indices[:self.batch_size],
            self.job_indices[:self.batch_size],
            self.labels[:self.batch_size]
        )
        
        val_dataloader = torch.utils.data.DataLoader(
            val_dataset, 
            batch_size=self.batch_size, 
            shuffle=False
        )
        
        # Run validation
        val_loss, val_auc = self.trainer.validate(val_dataloader)
        
        # Check metrics are reasonable
        self.assertGreater(val_loss, 0.0)
        self.assertGreaterEqual(val_auc, 0.0)
        self.assertLessEqual(val_auc, 1.0)
        
    def test_model_saving_and_loading(self):
        """Test model checkpoint saving and loading."""
        # Save model
        save_path = os.path.join(self.temp_dir, 'test_model.pth')
        self.trainer.save_model(save_path)
        
        # Check file exists
        self.assertTrue(os.path.exists(save_path))
        
        # Create new model and trainer
        new_model = HiringTwoTowerModel(
            candidate_feature_dim=self.candidate_dim,
            job_feature_dim=self.job_dim,
            embedding_dim=self.embedding_dim,
            hidden_dims=[128, 64],
            dropout_rate=0.1,
            use_batch_norm=True
        )
        
        new_trainer = HiringTrainer(
            model=new_model,
            device='cpu',
            learning_rate=0.001,
            weight_decay=0.01
        )
        
        # Load saved model
        new_trainer.load_model(save_path)
        
        # Check that models have same parameters
        for (name1, param1), (name2, param2) in zip(
            self.model.named_parameters(), 
            new_model.named_parameters()
        ):
            self.assertTrue(torch.allclose(param1, param2), 
                          f"Parameters for {name1} should match after loading")
                          
    def test_learning_rate_scheduling(self):
        """Test learning rate scheduler functionality."""
        initial_lr = self.trainer.optimizer.param_groups[0]['lr']
        
        # Simulate poor performance to trigger LR reduction
        for _ in range(5):
            self.trainer.scheduler.step(0.1)  # Low metric value
            
        # Check that learning rate decreased
        current_lr = self.trainer.optimizer.param_groups[0]['lr']
        self.assertLess(current_lr, initial_lr)
        
    def test_training_history_tracking(self):
        """Test that training history is properly tracked."""
        # Create small dataset
        small_dataset = HiringDataset(
            self.candidate_features[:self.batch_size],
            self.job_features[:self.batch_size],
            self.candidate_indices[:self.batch_size],
            self.job_indices[:self.batch_size],
            self.labels[:self.batch_size]
        )
        
        dataloader = torch.utils.data.DataLoader(
            small_dataset, 
            batch_size=self.batch_size, 
            shuffle=False
        )
        
        # Run training
        self.trainer.train_epoch(dataloader)
        
        # Check that history was updated
        self.assertGreater(len(self.trainer.train_losses), 0)
        self.assertGreater(len(self.trainer.train_aucs), 0)
        self.assertGreater(len(self.trainer.train_aps), 0)
        
    def test_early_stopping(self):
        """Test early stopping functionality."""
        # Create datasets
        train_dataset = HiringDataset(
            self.candidate_features[:self.batch_size],
            self.job_features[:self.batch_size],
            self.candidate_indices[:self.batch_size],
            self.job_indices[:self.batch_size],
            self.labels[:self.batch_size]
        )
        
        val_dataset = HiringDataset(
            self.candidate_features[self.batch_size:2*self.batch_size],
            self.job_features[self.batch_size:2*self.batch_size],
            self.candidate_indices[self.batch_size:2*self.batch_size],
            self.job_indices[self.batch_size:2*self.batch_size],
            self.labels[self.batch_size:2*self.batch_size]
        )
        
        train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=self.batch_size)
        val_loader = torch.utils.data.DataLoader(val_dataset, batch_size=self.batch_size)
        
        # Test early stopping with patience=2
        save_path = os.path.join(self.temp_dir, 'early_stop_test.pth')
        
        # This should trigger early stopping due to poor performance
        self.trainer.train(
            train_loader=train_loader,
            val_loader=val_loader,
            epochs=10,
            early_stopping_patience=2,
            save_path=save_path
        )
        
        # Check that training stopped early
        self.assertLess(len(self.trainer.val_losses), 10)
        
    def test_batch_normalization_behavior(self):
        """Test batch normalization behavior during training vs evaluation."""
        # Training mode
        self.model.train()
        train_output1 = self.model.forward_candidate(self.candidate_features[:self.batch_size])
        train_output2 = self.model.forward_candidate(self.candidate_features[:self.batch_size])
        
        # Evaluation mode
        self.model.eval()
        eval_output1 = self.model.forward_candidate(self.candidate_features[:self.batch_size])
        eval_output2 = self.model.forward_candidate(self.candidate_features[:self.batch_size])
        
        # Training outputs should differ due to batch norm
        train_diff = torch.norm(train_output1 - train_output2).item()
        eval_diff = torch.norm(eval_output1 - eval_output2).item()
        
        self.assertGreater(train_diff, 0.0, "Training outputs should differ due to batch norm")
        self.assertAlmostEqual(eval_diff, 0.0, places=5, msg="Eval outputs should be identical")

if __name__ == '__main__':
    unittest.main()
