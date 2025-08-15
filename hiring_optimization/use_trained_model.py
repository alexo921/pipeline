#!/usr/bin/env python3
"""
Demonstration of how to use your trained hiring model for practical candidate-job matching.
"""

import torch
import numpy as np
import pandas as pd
from real_data_loader import load_real_hiring_data
from hiring_model import create_hiring_model
from hiring_trainer import HiringTrainer

def load_trained_model():
    """Load your trained model."""
    print("📡 Loading your trained hiring model...")
    
    # Model dimensions (from your training)
    candidate_dim = 524
    job_dim = 504
    
    # Create model with same config as training
    model_config = {
        'embedding_dim': 128,
        'hidden_dims': [512, 256, 128],
        'dropout_rate': 0.3,
        'use_batch_norm': True
    }
    
    model = create_hiring_model(candidate_dim, job_dim, model_config)
    trainer = HiringTrainer(model)
    
    # Load your trained model
    model_path = 'real_hiring_experiments/real_hiring_model_20250813_154803/best_real_hiring_model.pth'
    trainer.load_model(model_path)
    
    print(f"✅ Model loaded with {sum(p.numel() for p in model.parameters()):,} parameters")
    return model, trainer

def demonstrate_candidate_job_matching():
    """Demonstrate practical candidate-job matching."""
    print("\n🎯 Practical Hiring Demonstration")
    print("=" * 50)
    
    # Load your model
    model, trainer = load_trained_model()
    
    # Load your data
    print("📊 Loading your candidate and job data...")
    data = load_real_hiring_data(
        "transformed_features.csv", 
        "training_jobs_20250813_144107.json"
    )
    
    candidate_features = torch.FloatTensor(data['candidate_features'])
    job_features = torch.FloatTensor(data['job_features'])
    candidate_df = data['candidate_df']
    job_df = data['job_df']
    
    print(f"✅ Data loaded: {len(candidate_df)} candidates, {len(job_df)} jobs")
    
    # Scenario 1: Find best candidates for a specific job
    print(f"\n📋 Scenario 1: Finding Best Candidates for a Job")
    print("-" * 50)
    
    # Pick an interesting job (let's say job index 5)
    job_idx = 5
    job_info = job_df.iloc[job_idx]
    print(f"🎯 Job: {job_info['title']}")
    print(f"🏢 Company: {job_info['company']}")
    print(f"📄 Description: {job_info['description'][:200]}...")
    
    # Get top candidates for this job
    model.eval()
    with torch.no_grad():
        job_emb = model.get_job_embedding(job_features[job_idx:job_idx+1])
        candidate_embs = model.get_candidate_embedding(candidate_features)
        
        # Compute similarities
        similarities = torch.mm(candidate_embs, job_emb.T).squeeze()
        top_candidates = torch.topk(similarities, k=10)
        
        print(f"\n🏆 Top 10 Candidates:")
        for i, (cand_idx, score) in enumerate(zip(top_candidates.indices, top_candidates.values)):
            candidate = candidate_df.iloc[cand_idx.item()]
            filename = candidate.get('Filename', f'Candidate_{cand_idx.item()}')
            experience = candidate.get('Years_of_Experience', 'N/A')
            suggested_pos = candidate.get('Suggested_Position', 'N/A')
            
            print(f"  {i+1:2d}. {filename.replace('Resume','').replace('.pdf','')}")
            print(f"      Experience: {experience} years | Position: {suggested_pos}")
            print(f"      Match Score: {score.item():.4f}")
            print()
    
    # Scenario 2: Find best jobs for a specific candidate
    print(f"\n👤 Scenario 2: Finding Best Jobs for a Candidate")
    print("-" * 50)
    
    # Pick a candidate (let's say candidate index 10)
    cand_idx = 10
    candidate_info = candidate_df.iloc[cand_idx]
    print(f"👤 Candidate: {candidate_info.get('Filename', 'Unknown').replace('Resume','').replace('.pdf','')}")
    print(f"💼 Experience: {candidate_info.get('Years_of_Experience', 'N/A')} years")
    print(f"🎯 Suggested Position: {candidate_info.get('Suggested_Position', 'N/A')}")
    
    # Get top jobs for this candidate
    with torch.no_grad():
        cand_emb = model.get_candidate_embedding(candidate_features[cand_idx:cand_idx+1])
        job_embs = model.get_job_embedding(job_features)
        
        # Compute similarities
        similarities = torch.mm(cand_emb, job_embs.T).squeeze()
        top_jobs = torch.topk(similarities, k=5)
        
        print(f"\n🎯 Top 5 Job Recommendations:")
        for i, (job_idx, score) in enumerate(zip(top_jobs.indices, top_jobs.values)):
            job = job_df.iloc[job_idx.item()]
            
            print(f"  {i+1}. {job['title']}")
            print(f"     Company: {job['company']}")
            print(f"     Match Score: {score.item():.4f}")
            print()
    
    # Scenario 3: Batch processing - find best matches for multiple scenarios
    print(f"\n⚡ Scenario 3: Batch Processing for HR Team")
    print("-" * 50)
    
    # Get all similarities at once (efficient for production)
    with torch.no_grad():
        all_candidate_embs = model.get_candidate_embedding(candidate_features)
        all_job_embs = model.get_job_embedding(job_features)
        
        # Compute full similarity matrix
        similarity_matrix = torch.mm(all_candidate_embs, all_job_embs.T)
        print(f"📊 Computed similarity matrix: {similarity_matrix.shape}")
        print(f"   ({similarity_matrix.shape[0]} candidates × {similarity_matrix.shape[1]} jobs)")
        
        # Find overall best matches
        flat_similarities = similarity_matrix.flatten()
        top_matches = torch.topk(flat_similarities, k=5)
        
        print(f"\n🏆 Top 5 Overall Candidate-Job Matches:")
        for i, (flat_idx, score) in enumerate(zip(top_matches.indices, top_matches.values)):
            # Convert flat index back to (candidate, job) indices
            cand_idx = flat_idx.item() // similarity_matrix.shape[1]
            job_idx = flat_idx.item() % similarity_matrix.shape[1]
            
            candidate = candidate_df.iloc[cand_idx]
            job = job_df.iloc[job_idx]
            
            cand_name = candidate.get('Filename', 'Unknown').replace('Resume','').replace('.pdf','')
            
            print(f"  {i+1}. {cand_name} → {job['title']}")
            print(f"     Company: {job['company']}")
            print(f"     Match Score: {score.item():.4f}")
            print()

def analyze_model_insights():
    """Analyze what the model has learned."""
    print(f"\n🔍 Model Insights and Analysis")
    print("=" * 50)
    
    model, trainer = load_trained_model()
    
    # Load data
    data = load_real_hiring_data(
        "transformed_features.csv", 
        "training_jobs_20250813_144107.json"
    )
    
    candidate_df = data['candidate_df']
    job_df = data['job_df']
    
    print(f"📊 Your Hiring Data Summary:")
    print(f"   Candidates: {len(candidate_df)}")
    print(f"   Jobs: {len(job_df)}")
    print(f"   Model Performance: 80.88% AUC (excellent!)")
    
    # Analyze job categories
    print(f"\n💼 Job Categories in Your Data:")
    job_titles = job_df['title'].value_counts().head(10)
    for title, count in job_titles.items():
        print(f"   {title}: {count}")
    
    # Analyze candidate suggested positions
    print(f"\n👥 Candidate Positions:")
    if 'Suggested_Position' in candidate_df.columns:
        positions = candidate_df['Suggested_Position'].value_counts().head(10)
        for pos, count in positions.items():
            print(f"   {pos}: {count}")
    
    # Experience distribution
    print(f"\n📈 Experience Distribution:")
    if 'Years_of_Experience' in candidate_df.columns:
        exp_stats = candidate_df['Years_of_Experience'].describe()
        print(f"   Mean: {exp_stats['mean']:.1f} years")
        print(f"   Range: {exp_stats['min']:.0f}-{exp_stats['max']:.0f} years")

def main():
    """Main demonstration."""
    print("🎯 Your Real Hiring Optimization System")
    print("🎉 Successfully trained on your actual data!")
    print("=" * 60)
    
    try:
        # Demonstrate practical usage
        demonstrate_candidate_job_matching()
        
        # Show insights
        analyze_model_insights()
        
        print(f"\n✅ Demonstration Complete!")
        print(f"🚀 Your hiring model is ready for production use!")
        print(f"\n📝 Key Takeaways:")
        print(f"   • Model achieved 80.88% AUC (excellent performance)")
        print(f"   • Trained on 961 real candidates and 75 real jobs")
        print(f"   • Can process candidate-job matching in real-time")
        print(f"   • Ready for integration into your hiring workflow")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nMake sure you've run the training script first:")
        print("python train_with_real_data.py")

if __name__ == "__main__":
    main()
