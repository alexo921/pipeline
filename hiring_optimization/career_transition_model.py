#!/usr/bin/env python3
"""
Enhanced model for career transition scenarios (tech/business → healthcare).
"""

import torch
import pandas as pd
import numpy as np
from real_data_loader import load_real_hiring_data
from hiring_model import create_hiring_model
from hiring_trainer import HiringTrainer

def analyze_career_transition_potential():
    """Analyze and demonstrate career transition matching."""
    
    print("🔄 CAREER TRANSITION HIRING MODEL")
    print("=" * 60)
    print("Matching tech/business candidates → healthcare opportunities")
    print()
    
    # Load data
    data = load_real_hiring_data(
        "transformed_features.csv", 
        "training_jobs_20250813_144107.json"
    )
    
    # Load trained model
    model = create_hiring_model(524, 504)
    trainer = HiringTrainer(model)
    trainer.load_model('real_hiring_experiments/real_hiring_model_20250813_154803/best_real_hiring_model.pth')
    
    candidate_features = torch.FloatTensor(data['candidate_features'])
    job_features = torch.FloatTensor(data['job_features'])
    candidate_df = data['candidate_df']
    job_df = data['job_df']
    
    print("🎯 SMART CAREER TRANSITION MATCHING")
    print("-" * 50)
    
    # Identify entry-level healthcare positions suitable for career changers
    entry_level_jobs = []
    admin_jobs = []
    tech_adjacent_jobs = []
    
    for i, job in job_df.iterrows():
        title_lower = job['title'].lower()
        desc_lower = str(job['description']).lower()
        
        # Entry-level positions
        if any(keyword in title_lower for keyword in ['cna', 'aide', 'assistant', 'trainee']):
            entry_level_jobs.append(i)
        
        # Administrative positions  
        elif any(keyword in title_lower for keyword in ['admin', 'coordinator', 'manager', 'director', 'office']):
            admin_jobs.append(i)
            
        # Tech-adjacent healthcare
        elif any(keyword in desc_lower for keyword in ['computer', 'software', 'system', 'data', 'record']):
            tech_adjacent_jobs.append(i)
    
    print(f"🏥 Healthcare Career Entry Points:")
    print(f"   Entry-level positions: {len(entry_level_jobs)}")
    print(f"   Administrative roles: {len(admin_jobs)}")
    print(f"   Tech-adjacent roles: {len(tech_adjacent_jobs)}")
    
    # Demonstrate smart matching for different candidate types
    model.eval()
    with torch.no_grad():
        
        print(f"\n1️⃣  TECH CANDIDATES → HEALTHCARE ADMIN")
        print("-" * 40)
        
        # Find tech candidates
        tech_candidates = []
        for i, candidate in candidate_df.iterrows():
            position = str(candidate.get('Suggested_Position', '')).lower()
            if any(keyword in position for keyword in ['software', 'network', 'data', 'it', 'engineer']):
                tech_candidates.append(i)
        
        if tech_candidates and admin_jobs:
            # Get best admin matches for tech candidates
            tech_indices = torch.tensor(tech_candidates[:5])
            admin_job_indices = torch.tensor(admin_jobs[:3])
            
            tech_embs = model.get_candidate_embedding(candidate_features[tech_indices])
            admin_embs = model.get_job_embedding(job_features[admin_job_indices])
            
            similarities = torch.mm(tech_embs, admin_embs.T)
            
            for i, cand_idx in enumerate(tech_indices[:3]):
                candidate = candidate_df.iloc[cand_idx.item()]
                best_job_idx = similarities[i].argmax().item()
                best_job = job_df.iloc[admin_jobs[best_job_idx]]
                score = similarities[i][best_job_idx].item()
                
                cand_name = candidate.get('Filename', '').replace('Resume','').replace('.pdf','')
                cand_position = candidate.get('Suggested_Position', 'N/A')
                
                print(f"   👨‍💻 {cand_name} ({cand_position})")
                print(f"      → 🏥 {best_job['title']} @ {best_job['company']}")
                print(f"      Match: {score:.3f}")
                print()
        
        print(f"2️⃣  CUSTOMER SERVICE → PATIENT CARE")
        print("-" * 40)
        
        # Find customer service candidates
        service_candidates = []
        for i, candidate in candidate_df.iterrows():
            position = str(candidate.get('Suggested_Position', '')).lower()
            if 'customer' in position or 'support' in position:
                service_candidates.append(i)
        
        if service_candidates and entry_level_jobs:
            service_indices = torch.tensor(service_candidates[:5])
            entry_embs = model.get_job_embedding(job_features[torch.tensor(entry_level_jobs)])
            service_embs = model.get_candidate_embedding(candidate_features[service_indices])
            
            similarities = torch.mm(service_embs, entry_embs.T)
            
            for i, cand_idx in enumerate(service_indices[:3]):
                candidate = candidate_df.iloc[cand_idx.item()]
                best_job_idx = similarities[i].argmax().item()
                best_job = job_df.iloc[entry_level_jobs[best_job_idx]]
                score = similarities[i][best_job_idx].item()
                
                cand_name = candidate.get('Filename', '').replace('Resume','').replace('.pdf','')
                cand_position = candidate.get('Suggested_Position', 'N/A')
                
                print(f"   🎧 {cand_name} ({cand_position})")
                print(f"      → 🏥 {best_job['title']} @ {best_job['company']}")  
                print(f"      Match: {score:.3f}")
                print()
        
        print(f"3️⃣  CAREER TRANSITION RECOMMENDATIONS")
        print("-" * 40)
        
        # Find candidates with transferable skills
        print("🎯 Best Career Transition Opportunities:")
        
        # Analyze all candidates for healthcare readiness
        transition_scores = []
        
        for i, candidate in candidate_df.iterrows():
            skills = str(candidate.get('Skills', '')).lower()
            position = str(candidate.get('Suggested_Position', '')).lower()
            experience = candidate.get('Years_of_Experience', 0)
            
            # Score based on transferable skills
            score = 0
            
            # Communication and interpersonal skills
            if any(skill in skills for skill in ['communication', 'customer', 'help', 'support', 'service']):
                score += 2
            
            # Management/leadership experience
            if any(skill in skills for skill in ['manager', 'lead', 'supervisor', 'team']):
                score += 2
                
            # Healthcare-adjacent experience
            if any(skill in skills for skill in ['care', 'assist', 'safety', 'documentation', 'record']):
                score += 3
            
            # Prefer some experience but not too senior
            if 1 <= experience <= 5:
                score += 1
            elif experience == 0:
                score += 0.5  # Entry level okay
                
            if score > 3:  # Threshold for good transition candidates
                transition_scores.append((i, candidate, score))
        
        # Sort by transition potential
        transition_scores.sort(key=lambda x: x[2], reverse=True)
        
        print(f"\n🌟 Top Career Transition Candidates:")
        for i, (cand_idx, candidate, t_score) in enumerate(transition_scores[:5]):
            cand_name = candidate.get('Filename', '').replace('Resume','').replace('.pdf','')
            cand_position = candidate.get('Suggested_Position', 'N/A')
            experience = candidate.get('Years_of_Experience', 'N/A')
            
            # Get their best healthcare match
            cand_emb = model.get_candidate_embedding(candidate_features[cand_idx:cand_idx+1])
            all_job_embs = model.get_job_embedding(job_features)
            similarities = torch.mm(cand_emb, all_job_embs.T).squeeze()
            best_job_idx = similarities.argmax().item()
            best_job = job_df.iloc[best_job_idx]
            
            print(f"   {i+1}. {cand_name}")
            print(f"      Current: {cand_position} ({experience} years)")
            print(f"      Transition Score: {'⭐' * int(t_score)}")
            print(f"      Best Healthcare Match: {best_job['title']}")
            print(f"      @ {best_job['company']}")
            print()

def create_transition_insights():
    """Create insights for hiring managers about career transitions."""
    
    print("💡 HIRING MANAGER INSIGHTS")
    print("=" * 50)
    
    print("🎯 Why This Model Works for Career Transitions:")
    print()
    print("1️⃣  Transferable Skills Focus:")
    print("   • Customer service → Patient interaction")
    print("   • Problem solving → Clinical thinking")
    print("   • Tech skills → Healthcare IT systems")
    print("   • Management → Healthcare administration")
    print()
    
    print("2️⃣  Entry Points Identified:")
    print("   • CNA/Aide positions for service-oriented candidates")
    print("   • Admin roles for business/tech backgrounds")
    print("   • Specialized roles (IT, HR) within healthcare")
    print()
    
    print("3️⃣  Success Factors:")
    print("   • Willingness to learn healthcare protocols")
    print("   • Strong communication skills")
    print("   • Customer service mindset")
    print("   • Reliability and attention to detail")
    print()
    
    print("🚀 Hiring Recommendations:")
    print("   • Offer healthcare training programs")
    print("   • Emphasize transferable skills in job descriptions")
    print("   • Create mentorship programs for career changers")
    print("   • Consider 'healthcare readiness' assessments")

if __name__ == "__main__":
    analyze_career_transition_potential()
    create_transition_insights()
