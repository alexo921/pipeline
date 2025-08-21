"""
Unit tests for hiring optimization two-tower model.
"""

import unittest
import torch
import numpy as np
import sys
import os

# Add parent directory to path to import hiring_model
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from hiring_optimization.hiring_model import HiringTwoTowerModel, HiringMatchingLoss

class TestHiringModel(unittest.TestCase):
    """Test cases for HiringTwoTowerModel."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.candidate_dim = 50
        self.job_dim = 30
        self.embedding_dim = 128
        self.batch_size = 16
        
        # Create model
        self.model = HiringTwoTowerModel(
            candidate_feature_dim=self.candidate_dim,
            job_feature_dim=self.job_dim,
            embedding_dim=self.embedding_dim,
            hidden_dims=[256, 128],
            dropout_rate=0.2,
            use_batch_norm=True
        )
        
        # Create test data
        self.candidate_features = torch.randn(self.batch_size, self.candidate_dim)
        self.job_features = torch.randn(self.batch_size, self.job_dim)
        
    def test_model_initialization(self):
        """Test model initialization and architecture."""
        # Check model components exist
        self.assertIsNotNone(self.model.candidate_tower)
        self.assertIsNotNone(self.model.job_tower)
        self.assertIsNotNone(self.model.candidate_projection)
        self.assertIsNotNone(self.model.job_projection)
        self.assertIsNotNone(self.model.matching_head)
        
        # Check embedding dimension
        self.assertEqual(self.model.embedding_dim, self.embedding_dim)
        
        # Check total parameters
        total_params = sum(p.numel() for p in self.model.parameters())
        self.assertGreater(total_params, 0)
        print(f"Model has {total_params:,} parameters")
        
    def test_candidate_tower_output(self):
        """Test candidate tower produces correct output shape."""
        self.model.eval()
        with torch.no_grad():
            candidate_embeddings = self.model.forward_candidate(self.candidate_features)
            
        # Check output shape
        expected_shape = (self.batch_size, self.embedding_dim)
        self.assertEqual(candidate_embeddings.shape, expected_shape)
        
        # Check embeddings are normalized (L2 norm = 1)
        norms = torch.norm(candidate_embeddings, p=2, dim=1)
        np.testing.assert_allclose(norms.numpy(), 1.0, rtol=1e-5)
        
    def test_job_tower_output(self):
        """Test job tower produces correct output shape."""
        self.model.eval()
        with torch.no_grad():
            job_embeddings = self.model.forward_job(self.job_features)
            
        # Check output shape
        expected_shape = (self.batch_size, self.embedding_dim)
        self.assertEqual(job_embeddings.shape, expected_shape)
        
        # Check embeddings are normalized (L2 norm = 1)
        norms = torch.norm(job_embeddings, p=2, dim=1)
        np.testing.assert_allclose(norms.numpy(), 1.0, rtol=1e-5)
        
    def test_forward_pass(self):
        """Test complete forward pass through the model."""
        self.model.eval()
        with torch.no_grad():
            similarities = self.model(self.candidate_features, self.job_features)
            
        # Check output shape
        expected_shape = (self.batch_size,)
        self.assertEqual(similarities.shape, expected_shape)
        
        # Check output range (similarity scores should be reasonable)
        self.assertTrue(torch.all(similarities >= -1.0))
        self.assertTrue(torch.all(similarities <= 1.0))
        
    def test_batch_consistency(self):
        """Test that model handles different batch sizes correctly."""
        self.model.eval()
        
        # Test with different batch sizes
        for batch_size in [1, 8, 32]:
            candidate_features = torch.randn(batch_size, self.candidate_dim)
            job_features = torch.randn(batch_size, self.job_dim)
            
            with torch.no_grad():
                similarities = self.model(candidate_features, job_features)
                
            self.assertEqual(similarities.shape, (batch_size,))
            
    def test_gradient_flow(self):
        """Test that gradients flow through the model."""
        self.model.train()
        
        # Forward pass
        similarities = self.model(self.candidate_features, self.job_features)
        
        # Create dummy loss
        dummy_loss = similarities.mean()
        
        # Backward pass
        dummy_loss.backward()
        
        # Check that gradients exist
        has_gradients = False
        for param in self.model.parameters():
            if param.grad is not None:
                has_gradients = True
                break
                
        self.assertTrue(has_gradients, "No gradients found in model parameters")
        
    def test_dropout_behavior(self):
        """Test dropout behavior during training vs evaluation."""
        # Training mode
        self.model.train()
        with torch.no_grad():
            train_output1 = self.model.forward_candidate(self.candidate_features)
            train_output2 = self.model.forward_candidate(self.candidate_features)
            
        # Evaluation mode
        self.model.eval()
        with torch.no_grad():
            eval_output1 = self.model.forward_candidate(self.candidate_features)
            eval_output2 = self.model.forward_candidate(self.candidate_features)
            
        # Training outputs should differ due to dropout
        train_diff = torch.norm(train_output1 - train_output2).item()
        eval_diff = torch.norm(eval_output1 - eval_output2).item()
        
        self.assertGreater(train_diff, 0.0, "Training outputs should differ due to dropout")
        self.assertAlmostEqual(eval_diff, 0.0, places=5, msg="Eval outputs should be identical")
        
    def test_model_device_transfer(self):
        """Test model can be moved to different devices."""
        if torch.cuda.is_available():
            # Move to GPU
            self.model.cuda()
            self.assertTrue(next(self.model.parameters()).is_cuda)
            
            # Move back to CPU
            self.model.cpu()
            self.assertFalse(next(self.model.parameters()).is_cuda)
        else:
            # Skip if no GPU available
            self.skipTest("CUDA not available")
            
    def test_weight_initialization(self):
        """Test that weights are properly initialized."""
        # Check that weights are not all zero
        for name, param in self.model.named_parameters():
            if 'weight' in name:
                self.assertFalse(torch.all(param == 0), f"Weights in {name} should not be all zero")
                
        # Check that biases are properly initialized
        for name, param in self.model.named_parameters():
            if 'bias' in name:
                if 'batch_norm' in name:
                    # BatchNorm biases should be zero
                    self.assertTrue(torch.all(param == 0), f"BatchNorm bias in {name} should be zero")
                else:
                    # Linear biases should be zero
                    self.assertTrue(torch.all(param == 0), f"Linear bias in {name} should be zero")

class TestHiringMatchingLoss(unittest.TestCase):
    """Test cases for HiringMatchingLoss."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.loss_fn = HiringMatchingLoss()
        self.batch_size = 16
        
    def test_loss_computation(self):
        """Test loss computation with valid inputs."""
        # Create dummy predictions and labels
        predictions = torch.randn(self.batch_size)
        labels = torch.randint(0, 2, (self.batch_size,)).float()
        
        # Compute loss
        loss = self.loss_fn(predictions, labels)
        
        # Check loss is a scalar
        self.assertEqual(loss.dim(), 0)
        
        # Check loss is positive
        self.assertGreater(loss.item(), 0.0)
        
    def test_loss_gradients(self):
        """Test that loss produces gradients."""
        predictions = torch.randn(self.batch_size, requires_grad=True)
        labels = torch.randint(0, 2, (self.batch_size,)).float()
        
        # Compute loss
        loss = self.loss_fn(predictions, labels)
        
        # Backward pass
        loss.backward()
        
        # Check gradients exist
        self.assertIsNotNone(predictions.grad)
        
    def test_loss_with_extreme_values(self):
        """Test loss behavior with extreme prediction values."""
        # Very confident predictions
        predictions = torch.tensor([10.0, -10.0, 10.0, -10.0])
        labels = torch.tensor([1.0, 0.0, 1.0, 0.0])
        
        loss = self.loss_fn(predictions, labels)
        
        # Loss should be finite
        self.assertTrue(torch.isfinite(loss))
        
        # Loss should be reasonable
        self.assertLess(loss.item(), 100.0)

if __name__ == '__main__':
    unittest.main()
