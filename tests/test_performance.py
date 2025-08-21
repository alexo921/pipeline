"""
Performance and regression tests for hiring optimization model.
"""

import unittest
import torch
import numpy as np
import sys
import os
import time
import tempfile
import shutil

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from hiring_optimization.hiring_model import HiringTwoTowerModel
from hiring_optimization.hiring_trainer import HiringTrainer, HiringDataset

class TestPerformance(unittest.TestCase):
    """Performance tests for the hiring optimization model."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        
        # Performance test parameters
        self.candidate_dim = 100
        self.job_dim = 80
        self.embedding_dim = 128
        self.batch_size = 64
        self.num_candidates = 1000
        self.num_jobs = 500
        
        # Create model
        self.model = HiringTwoTowerModel(
            candidate_feature_dim=self.candidate_dim,
            job_feature_dim=self.job_dim,
            embedding_dim=self.embedding_dim,
            hidden_dims=[256, 128],
            dropout_rate=0.1,
            use_batch_norm=True
        )
        
        # Generate test data
        self._generate_performance_data()
        
    def tearDown(self):
        """Clean up test fixtures."""
        shutil.rmtree(self.temp_dir)
        
    def _generate_performance_data(self):
        """Generate data for performance testing."""
        # Generate candidate features
        self.candidate_features = torch.randn(
            self.num_candidates, self.candidate_dim
        )
        
        # Generate job features
        self.job_features = torch.randn(
            self.num_jobs, self.job_dim
        )
        
        # Generate training data
        self.num_samples = 10000
        self.candidate_indices = torch.randint(0, self.num_candidates, (self.num_samples,))
        self.job_indices = torch.randint(0, self.num_jobs, (self.num_samples,))
        self.labels = torch.randint(0, 2, (self.num_samples,)).float()
        
    def test_inference_speed(self):
        """Test that inference meets speed requirements (<1ms per match)."""
        self.model.eval()
        
        # Warm up
        with torch.no_grad():
            _ = self.model.forward_candidate(self.candidate_features[:10])
            _ = self.model.forward_job(self.job_features[:10])
        
        # Test candidate encoding speed
        start_time = time.time()
        with torch.no_grad():
            candidate_embeddings = self.model.forward_candidate(self.candidate_features)
        candidate_time = time.time() - start_time
        
        # Test job encoding speed
        start_time = time.time()
        with torch.no_grad():
            job_embeddings = self.model.forward_job(self.job_features)
        job_time = time.time() - start_time
        
        # Test similarity computation speed
        start_time = time.time()
        with torch.no_grad():
            similarities = torch.mm(candidate_embeddings, job_embeddings.T)
        similarity_time = time.time() - start_time
        
        # Calculate per-match time
        total_matches = self.num_candidates * self.num_jobs
        per_match_time = similarity_time / total_matches * 1000  # Convert to milliseconds
        
        # Performance assertions
        self.assertLess(candidate_time, 0.1, f"Candidate encoding took {candidate_time:.3f}s, should be <0.1s")
        self.assertLess(job_time, 0.1, f"Job encoding took {job_time:.3f}s, should be <0.1s")
        self.assertLess(per_match_time, 1.0, f"Per-match time: {per_match_time:.3f}ms, should be <1ms")
        
        print(f"Performance Results:")
        print(f"  Candidate encoding: {candidate_time:.3f}s for {self.num_candidates} candidates")
        print(f"  Job encoding: {job_time:.3f}s for {self.num_jobs} jobs")
        print(f"  Similarity computation: {similarity_time:.3f}s for {total_matches:,} matches")
        print(f"  Per-match time: {per_match_time:.3f}ms")
        
    def test_memory_usage(self):
        """Test memory usage is reasonable."""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Create large batch
        large_batch_size = 512
        large_candidates = torch.randn(large_batch_size, self.candidate_dim)
        large_jobs = torch.randn(large_batch_size, self.job_dim)
        
        # Run inference
        self.model.eval()
        with torch.no_grad():
            _ = self.model(large_candidates, large_jobs)
            
        # Check memory usage
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (<500MB for large batch)
        self.assertLess(memory_increase, 500, f"Memory increase: {memory_increase:.1f}MB, should be <500MB")
        
        print(f"Memory Usage:")
        print(f"  Initial: {initial_memory:.1f}MB")
        print(f"  Final: {final_memory:.1f}MB")
        print(f"  Increase: {memory_increase:.1f}MB")
        
    def test_batch_scaling(self):
        """Test that model scales well with batch size."""
        batch_sizes = [1, 8, 32, 64, 128]
        times = []
        
        self.model.eval()
        
        for batch_size in batch_sizes:
            candidates = torch.randn(batch_size, self.candidate_dim)
            jobs = torch.randn(batch_size, self.job_dim)
            
            # Warm up
            with torch.no_grad():
                _ = self.model(candidates[:1], jobs[:1])
            
            # Time inference
            start_time = time.time()
            with torch.no_grad():
                _ = self.model(candidates, jobs)
            inference_time = time.time() - start_time
            
            times.append(inference_time)
            
        # Check that larger batches don't have exponential time increase
        for i in range(1, len(batch_sizes)):
            batch_ratio = batch_sizes[i] / batch_sizes[i-1]
            time_ratio = times[i] / times[i-1]
            
            # Time increase should be less than batch size increase
            self.assertLess(time_ratio, batch_ratio * 1.5, 
                          f"Batch {batch_sizes[i]} took {time_ratio:.2f}x longer than {batch_sizes[i-1]}, "
                          f"but batch size increased {batch_ratio:.2f}x")
        
        print(f"Batch Scaling Results:")
        for batch_size, time_taken in zip(batch_sizes, times):
            print(f"  Batch {batch_size:3d}: {time_taken:.4f}s")
            
    def test_accuracy_regression(self):
        """Test that model accuracy doesn't regress below acceptable thresholds."""
        # Create trainer
        trainer = HiringTrainer(
            model=self.model,
            device='cpu',
            learning_rate=0.001,
            weight_decay=0.01
        )
        
        # Create dataset
        dataset = HiringDataset(
            self.candidate_features.numpy(),
            self.job_features.numpy(),
            self.candidate_indices.numpy(),
            self.job_indices.numpy(),
            self.labels.numpy()
        )
        
        dataloader = torch.utils.data.DataLoader(
            dataset, 
            batch_size=self.batch_size, 
            shuffle=False
        )
        
        # Train for a few epochs
        trainer.train(
            train_loader=dataloader,
            val_loader=dataloader,  # Use same data for simplicity
            epochs=5,
            early_stopping_patience=10,
            save_path=os.path.join(self.temp_dir, 'regression_test.pth')
        )
        
        # Check final performance
        final_train_auc = trainer.train_aucs[-1]
        final_val_auc = trainer.val_aucs[-1]
        
        # Performance thresholds (adjust based on your requirements)
        self.assertGreater(final_train_auc, 0.5, f"Training AUC {final_train_auc:.3f} below threshold 0.5")
        self.assertGreater(final_val_auc, 0.45, f"Validation AUC {final_val_auc:.3f} below threshold 0.45")
        
        print(f"Accuracy Regression Test:")
        print(f"  Final Training AUC: {final_train_auc:.3f}")
        print(f"  Final Validation AUC: {final_val_auc:.3f}")
        
    def test_model_size(self):
        """Test that model size is reasonable."""
        # Count parameters
        total_params = sum(p.numel() for p in self.model.parameters())
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        
        # Check parameter counts
        self.assertLess(total_params, 1000000, f"Model has {total_params:,} parameters, should be <1M")
        self.assertLess(trainable_params, 1000000, f"Trainable parameters: {trainable_params:,}, should be <1M")
        
        # Check file size when saved
        save_path = os.path.join(self.temp_dir, 'size_test.pth')
        torch.save(self.model.state_dict(), save_path)
        file_size_mb = os.path.getsize(save_path) / 1024 / 1024
        
        self.assertLess(file_size_mb, 50, f"Model file size: {file_size_mb:.1f}MB, should be <50MB")
        
        print(f"Model Size Test:")
        print(f"  Total parameters: {total_params:,}")
        print(f"  Trainable parameters: {trainable_params:,}")
        print(f"  File size: {file_size_mb:.1f}MB")
        
    def test_concurrent_inference(self):
        """Test that model can handle concurrent inference requests."""
        import threading
        import queue
        
        results_queue = queue.Queue()
        num_threads = 4
        requests_per_thread = 10
        
        def inference_worker(thread_id):
            """Worker function for concurrent inference."""
            for i in range(requests_per_thread):
                candidates = torch.randn(16, self.candidate_dim)
                jobs = torch.randn(16, self.job_dim)
                
                start_time = time.time()
                with torch.no_grad():
                    similarities = self.model(candidates, jobs)
                inference_time = time.time() - start_time
                
                results_queue.put({
                    'thread_id': thread_id,
                    'request_id': i,
                    'time': inference_time,
                    'success': True
                })
        
        # Start concurrent threads
        threads = []
        for i in range(num_threads):
            thread = threading.Thread(target=inference_worker, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Collect results
        results = []
        while not results_queue.empty():
            results.append(results_queue.get())
        
        # Check all requests succeeded
        self.assertEqual(len(results), num_threads * requests_per_thread)
        
        # Check performance consistency
        times = [r['time'] for r in results]
        avg_time = np.mean(times)
        std_time = np.std(times)
        
        # Standard deviation should be small (consistent performance)
        self.assertLess(std_time, avg_time * 0.5, 
                       f"Performance too variable: std={std_time:.4f}s, mean={avg_time:.4f}s")
        
        print(f"Concurrent Inference Test:")
        print(f"  Threads: {num_threads}")
        print(f"  Requests per thread: {requests_per_thread}")
        print(f"  Total requests: {len(results)}")
        print(f"  Average time: {avg_time:.4f}s")
        print(f"  Std deviation: {std_time:.4f}s")

if __name__ == '__main__':
    unittest.main()
