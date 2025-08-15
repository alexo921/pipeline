#!/usr/bin/env python3
"""
Analyze the mismatch between candidate backgrounds and job requirements.
"""

import pandas as pd
import json
import numpy as np

def analyze_data_mismatch():
    """Analyze your actual data mismatch situation."""
    print("🔍 HIRING DATA MISMATCH ANALYSIS")
    print("=" * 60)
    
    # Load data
    candidates_df = pd.read_csv('transformed_features.csv')
    with open('training_jobs_20250813_144107.json', 'r') as f:
        jobs_data = json.load(f)
    jobs_df = pd.DataFrame(jobs_data)
    
    print(f"📊 Data Overview:")
    print(f"   Candidates: {len(candidates_df)}")
    print(f"   Jobs: {len(jobs_df)}")
    
    # Analyze candidate backgrounds
    print(f"\n👥 CANDIDATE ANALYSIS:")
    print("-" * 30)
    
    if 'Suggested_Position' in candidates_df.columns:
        positions = candidates_df['Suggested_Position'].value_counts()
        
        # Categorize positions
        healthcare_candidates = 0
        tech_candidates = 0
        business_candidates = 0
        unidentified_candidates = 0
        
        healthcare_keywords = ['health', 'nurse', 'medical', 'care', 'therapy']
        tech_keywords = ['software', 'IT', 'network', 'engineer', 'data', 'cyber', 'tech', 'developer', 'analyst', 'AI', 'ML']
        business_keywords = ['manager', 'sales', 'finance', 'business', 'hr', 'human resources', 'support', 'writer', 'content']
        
        print(f"📋 Candidate Position Breakdown:")
        
        for position, count in positions.head(15).items():
            pos_lower = str(position).lower()
            
            if 'not identified' in pos_lower:
                unidentified_candidates += count
                category = "❓ Unidentified"
            elif any(keyword in pos_lower for keyword in healthcare_keywords):
                healthcare_candidates += count
                category = "🏥 Healthcare"
            elif any(keyword in pos_lower for keyword in tech_keywords):
                tech_candidates += count
                category = "💻 Technology"
            elif any(keyword in pos_lower for keyword in business_keywords):
                business_candidates += count
                category = "💼 Business"
            else:
                category = "❓ Other"
            
            print(f"   {category:15} {position}: {count}")
        
        print(f"\n📈 Summary:")
        print(f"   Unidentified: {unidentified_candidates} ({unidentified_candidates/len(candidates_df)*100:.1f}%)")
        print(f"   Technology: {tech_candidates} ({tech_candidates/len(candidates_df)*100:.1f}%)")
        print(f"   Business: {business_candidates} ({business_candidates/len(candidates_df)*100:.1f}%)")
        print(f"   Healthcare: {healthcare_candidates} ({healthcare_candidates/len(candidates_df)*100:.1f}%)")
    
    # Analyze job requirements
    print(f"\n💼 JOB ANALYSIS:")
    print("-" * 30)
    
    healthcare_jobs = 0
    tech_jobs = 0
    business_jobs = 0
    
    print(f"📋 Job Category Breakdown:")
    for i, job in jobs_df.iterrows():
        title_lower = job['title'].lower()
        
        if any(keyword in title_lower for keyword in ['nurse', 'nursing', 'cna', 'lpn', 'rn', 'therapy', 'therapist', 'medical', 'care', 'health', 'dietary', 'cook', 'maintenance', 'social worker', 'admission', 'mds']):
            healthcare_jobs += 1
        elif any(keyword in title_lower for keyword in ['it', 'tech', 'engineer', 'analyst', 'developer']):
            tech_jobs += 1
        elif any(keyword in title_lower for keyword in ['manager', 'director', 'admin', 'business', 'coordinator']):
            business_jobs += 1
    
    print(f"   🏥 Healthcare Jobs: {healthcare_jobs} ({healthcare_jobs/len(jobs_df)*100:.1f}%)")
    print(f"   💻 Technology Jobs: {tech_jobs} ({tech_jobs/len(jobs_df)*100:.1f}%)")
    print(f"   💼 Business Jobs: {business_jobs} ({business_jobs/len(jobs_df)*100:.1f}%)")
    
    # The mismatch problem
    print(f"\n🎯 THE MISMATCH PROBLEM:")
    print("-" * 40)
    print(f"❌ Problem: You have {tech_candidates + business_candidates} non-healthcare candidates")
    print(f"   trying to match with {healthcare_jobs} healthcare jobs!")
    print(f"")
    print(f"💡 What the AI model is doing:")
    print(f"   • Learning to match Software Engineers → Nurse positions")
    print(f"   • Matching IT Support → Physical Therapy roles") 
    print(f"   • Pairing Customer Service → CNA positions")
    print(f"   • This is why matches seem unusual!")
    
    # Solutions
    print(f"\n🚀 SOLUTIONS:")
    print("-" * 20)
    print(f"1️⃣  Career Transition Focus:")
    print(f"    • Train model for career changes (tech → healthcare)")
    print(f"    • Weight transferable skills (communication, problem-solving)")
    print(f"    • Consider entry-level healthcare positions for career switchers")
    print(f"")
    print(f"2️⃣  Skills-Based Matching:")
    print(f"    • Focus on soft skills (communication, organization)")
    print(f"    • Match administrative skills → healthcare admin roles")
    print(f"    • Tech skills → healthcare IT positions")
    print(f"")
    print(f"3️⃣  Hybrid Approach:")
    print(f"    • Add more diverse job categories to your job dataset")
    print(f"    • Or filter candidates to healthcare-interested only")
    print(f"    • Weight experience vs. willingness to learn")
    
    # Show some actual examples
    print(f"\n📋 REALISTIC MATCHING EXAMPLES:")
    print("-" * 40)
    
    # Find candidates that might actually work in healthcare
    potential_matches = []
    
    for i, candidate in candidates_df.iterrows():
        skills_text = str(candidate.get('Skills', '')).lower()
        position = str(candidate.get('Suggested_Position', '')).lower()
        
        # Look for transferable skills or healthcare interest
        transferable_score = 0
        
        if any(skill in skills_text for skill in ['communication', 'customer service', 'care', 'help', 'support', 'manage', 'organize']):
            transferable_score += 1
            
        if any(word in position for word in ['support', 'service', 'assistant', 'coordinator']):
            transferable_score += 1
            
        if transferable_score > 0:
            potential_matches.append((i, candidate, transferable_score))
    
    # Show top potential matches
    potential_matches.sort(key=lambda x: x[2], reverse=True)
    
    print(f"🎯 Best Career Transition Candidates:")
    for i, (idx, candidate, score) in enumerate(potential_matches[:5]):
        filename = candidate.get('Filename', '').replace('Resume', '').replace('.pdf', '')
        position = candidate.get('Suggested_Position', 'N/A')
        experience = candidate.get('Years_of_Experience', 'N/A')
        
        print(f"   {i+1}. {filename}")
        print(f"      Current: {position} ({experience} years)")
        print(f"      Healthcare Potential: {'⭐' * score}")
        print()

if __name__ == "__main__":
    analyze_data_mismatch()
