"""
Data loader for hiring optimization using two-tower architecture.
Loads candidate features and job requirements for matching.
"""

import pandas as pd
import numpy as np
import json
from typing import Dict, List, Tuple, Optional, Any
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import torch

class HiringDataProcessor:
    """Process candidate and job data for two-tower model training."""
    
    def __init__(self):
        self.candidate_scaler = StandardScaler()
        self.job_scaler = StandardScaler()
        self.skill_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.job_desc_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.label_encoders = {}
        
        # Mappings for IDs
        self.candidate_id_map = {}
        self.job_id_map = {}
        
    def load_candidate_data(self, csv_path: str) -> pd.DataFrame:
        """Load and preprocess candidate data from CSV."""
        print(f"Loading candidate data from {csv_path}")
        
        try:
            df = pd.read_csv(csv_path)
            print(f"Loaded {len(df)} candidates")
            print(f"Columns: {list(df.columns)}")
            
            # Display sample data
            print("\nSample candidate data:")
            print(df.head())
            
            return df
            
        except Exception as e:
            print(f"Error loading candidate data: {e}")
            return self._create_sample_candidate_data()
    
    def load_job_data(self, json_path: str) -> pd.DataFrame:
        """Load and preprocess job data from JSON."""
        print(f"Loading job data from {json_path}")
        
        try:
            with open(json_path, 'r') as f:
                jobs_data = json.load(f)
            
            # Convert to DataFrame (assuming it's a list of job dictionaries)
            if isinstance(jobs_data, dict):
                jobs_data = [jobs_data]  # Single job
            elif isinstance(jobs_data, list):
                pass  # Multiple jobs
            else:
                raise ValueError("JSON should contain job dictionary or list of jobs")
            
            df = pd.DataFrame(jobs_data)
            print(f"Loaded {len(df)} jobs")
            print(f"Columns: {list(df.columns)}")
            
            # Display sample data
            print("\nSample job data:")
            print(df.head())
            
            return df
            
        except Exception as e:
            print(f"Error loading job data: {e}")
            return self._create_sample_job_data()
    
    def _create_sample_candidate_data(self) -> pd.DataFrame:
        """Create sample candidate data for testing."""
        print("Creating sample candidate data...")
        
        np.random.seed(42)
        n_candidates = 1000
        
        # Common skills in tech hiring
        skills_pool = [
            'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 
            'Kubernetes', 'Git', 'Machine Learning', 'Data Analysis', 'MongoDB',
            'PostgreSQL', 'REST APIs', 'GraphQL', 'TypeScript', 'Java', 'C++',
            'Project Management', 'Team Leadership', 'Communication', 'Problem Solving'
        ]
        
        candidates = []
        for i in range(n_candidates):
            # Random skills (2-8 skills per candidate)
            n_skills = np.random.randint(2, 9)
            candidate_skills = np.random.choice(skills_pool, n_skills, replace=False)
            
            candidate = {
                'candidate_id': f'CAND_{i:04d}',
                'name': f'Candidate_{i}',
                'experience_years': np.random.uniform(0, 15),
                'education_level': np.random.choice(['Bachelor', 'Master', 'PhD', 'Bootcamp']),
                'skills': ', '.join(candidate_skills),
                'location': np.random.choice(['San Francisco', 'New York', 'Remote', 'Austin', 'Seattle']),
                'salary_expectation': np.random.uniform(60000, 200000),
                'availability': np.random.choice(['Immediate', '2 weeks', '1 month', '3 months']),
                'work_preference': np.random.choice(['Remote', 'On-site', 'Hybrid']),
                'industry_experience': ', '.join(np.random.choice(
                    ['Tech', 'Finance', 'Healthcare', 'E-commerce', 'Gaming'], 
                    np.random.randint(1, 4), replace=False
                ))
            }
            candidates.append(candidate)
        
        return pd.DataFrame(candidates)
    
    def _create_sample_job_data(self) -> pd.DataFrame:
        """Create sample job data for testing."""
        print("Creating sample job data...")
        
        np.random.seed(42)
        n_jobs = 50
        
        job_types = [
            'Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps Engineer',
            'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 
            'Machine Learning Engineer', 'Data Analyst', 'Technical Lead'
        ]
        
        jobs = []
        for i in range(n_jobs):
            job_type = np.random.choice(job_types)
            
            # Skills based on job type
            if 'Data' in job_type or 'ML' in job_type:
                required_skills = ['Python', 'SQL', 'Machine Learning', 'Data Analysis']
            elif 'Frontend' in job_type:
                required_skills = ['JavaScript', 'React', 'TypeScript', 'CSS']
            elif 'Backend' in job_type:
                required_skills = ['Python', 'SQL', 'REST APIs', 'Docker']
            elif 'DevOps' in job_type:
                required_skills = ['AWS', 'Docker', 'Kubernetes', 'Git']
            else:
                required_skills = ['Python', 'JavaScript', 'SQL', 'Git']
            
            # Add random additional skills
            additional_skills = np.random.choice([
                'MongoDB', 'PostgreSQL', 'GraphQL', 'Node.js', 'Team Leadership'
            ], np.random.randint(0, 3), replace=False)
            
            all_skills = list(set(required_skills + list(additional_skills)))
            
            job = {
                'job_id': f'JOB_{i:04d}',
                'title': job_type,
                'company': f'Company_{i % 20}',  # 20 different companies
                'description': f'We are looking for a {job_type} with experience in {", ".join(required_skills)}',
                'required_skills': ', '.join(all_skills),
                'min_experience': np.random.uniform(0, 8),
                'max_experience': np.random.uniform(3, 12),
                'salary_min': np.random.uniform(80000, 120000),
                'salary_max': np.random.uniform(120000, 250000),
                'location': np.random.choice(['San Francisco', 'New York', 'Remote', 'Austin', 'Seattle']),
                'work_type': np.random.choice(['Remote', 'On-site', 'Hybrid']),
                'urgency': np.random.choice(['High', 'Medium', 'Low']),
                'industry': np.random.choice(['Tech', 'Finance', 'Healthcare', 'E-commerce', 'Gaming'])
            }
            jobs.append(job)
        
        return pd.DataFrame(jobs)
    
    def preprocess_candidates(self, df: pd.DataFrame) -> Tuple[np.ndarray, Dict]:
        """Preprocess candidate data for model input."""
        processed_features = []
        feature_names = []
        
        # Map candidate IDs to integers
        unique_candidates = df['candidate_id'].unique() if 'candidate_id' in df.columns else df.index
        self.candidate_id_map = {cid: i for i, cid in enumerate(unique_candidates)}
        
        # Numerical features
        numerical_cols = []
        for col in ['experience_years', 'salary_expectation']:
            if col in df.columns:
                numerical_cols.append(col)
                feature_names.append(col)
        
        if numerical_cols:
            numerical_data = df[numerical_cols].fillna(0).values
            processed_features.append(numerical_data)
        
        # Categorical features
        categorical_cols = []
        for col in ['education_level', 'location', 'availability', 'work_preference']:
            if col in df.columns:
                categorical_cols.append(col)
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                
                encoded = self.label_encoders[col].fit_transform(df[col].fillna('Unknown'))
                processed_features.append(encoded.reshape(-1, 1))
                feature_names.append(f'{col}_encoded')
        
        # Skills (text vectorization)
        if 'skills' in df.columns:
            skills_text = df['skills'].fillna('')
            skills_vectors = self.skill_vectorizer.fit_transform(skills_text).toarray()
            processed_features.append(skills_vectors)
            feature_names.extend([f'skill_{i}' for i in range(skills_vectors.shape[1])])
        
        # Combine all features
        if processed_features:
            combined_features = np.concatenate(processed_features, axis=1)
            # Normalize
            combined_features = self.candidate_scaler.fit_transform(combined_features)
        else:
            combined_features = np.random.randn(len(df), 10)  # Fallback
        
        print(f"Candidate features shape: {combined_features.shape}")
        print(f"Feature names ({len(feature_names)}): {feature_names[:10]}...")
        
        return combined_features, {
            'feature_names': feature_names,
            'n_candidates': len(unique_candidates),
            'candidate_id_map': self.candidate_id_map
        }
    
    def preprocess_jobs(self, df: pd.DataFrame) -> Tuple[np.ndarray, Dict]:
        """Preprocess job data for model input."""
        processed_features = []
        feature_names = []
        
        # Map job IDs to integers
        unique_jobs = df['job_id'].unique() if 'job_id' in df.columns else df.index
        self.job_id_map = {jid: i for i, jid in enumerate(unique_jobs)}
        
        # Numerical features
        numerical_cols = []
        for col in ['min_experience', 'max_experience', 'salary_min', 'salary_max']:
            if col in df.columns:
                numerical_cols.append(col)
                feature_names.append(col)
        
        if numerical_cols:
            numerical_data = df[numerical_cols].fillna(0).values
            processed_features.append(numerical_data)
        
        # Categorical features
        categorical_cols = []
        for col in ['location', 'work_type', 'urgency', 'industry']:
            if col in df.columns:
                categorical_cols.append(col)
                if f'job_{col}' not in self.label_encoders:
                    self.label_encoders[f'job_{col}'] = LabelEncoder()
                
                encoded = self.label_encoders[f'job_{col}'].fit_transform(df[col].fillna('Unknown'))
                processed_features.append(encoded.reshape(-1, 1))
                feature_names.append(f'{col}_encoded')
        
        # Job descriptions and required skills
        text_features = []
        for col in ['description', 'required_skills']:
            if col in df.columns:
                text_features.extend(df[col].fillna('').tolist())
        
        if text_features:
            if len(text_features) == 2 * len(df):  # Both description and skills
                # Combine description and skills
                combined_text = [text_features[i] + ' ' + text_features[i + len(df)] 
                               for i in range(len(df))]
            else:
                combined_text = text_features[:len(df)]
            
            job_text_vectors = self.job_desc_vectorizer.fit_transform(combined_text).toarray()
            processed_features.append(job_text_vectors)
            feature_names.extend([f'job_text_{i}' for i in range(job_text_vectors.shape[1])])
        
        # Combine all features
        if processed_features:
            combined_features = np.concatenate(processed_features, axis=1)
            # Normalize
            combined_features = self.job_scaler.fit_transform(combined_features)
        else:
            combined_features = np.random.randn(len(df), 10)  # Fallback
        
        print(f"Job features shape: {combined_features.shape}")
        print(f"Feature names ({len(feature_names)}): {feature_names[:10]}...")
        
        return combined_features, {
            'feature_names': feature_names,
            'n_jobs': len(unique_jobs),
            'job_id_map': self.job_id_map
        }
    
    def create_training_pairs(
        self, 
        candidate_df: pd.DataFrame, 
        job_df: pd.DataFrame, 
        n_pairs: int = 10000
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Create training pairs with labels for hiring optimization."""
        
        print(f"Creating {n_pairs} training pairs...")
        
        # Get feature dimensions
        n_candidates = len(self.candidate_id_map)
        n_jobs = len(self.job_id_map)
        
        # Create pairs
        candidate_indices = []
        job_indices = []
        labels = []
        
        # Positive pairs (good matches) - 30%
        n_positive = int(0.3 * n_pairs)
        for _ in range(n_positive):
            # Random candidate and job
            cand_idx = np.random.randint(0, n_candidates)
            job_idx = np.random.randint(0, n_jobs)
            
            # Create positive label based on some matching criteria
            # This is where you'd implement your hiring logic
            label = self._calculate_match_score(candidate_df.iloc[cand_idx], job_df.iloc[job_idx])
            
            candidate_indices.append(cand_idx)
            job_indices.append(job_idx)
            labels.append(1.0 if label > 0.5 else 0.0)
        
        # Negative pairs (poor matches) - 70%
        n_negative = n_pairs - n_positive
        for _ in range(n_negative):
            cand_idx = np.random.randint(0, n_candidates)
            job_idx = np.random.randint(0, n_jobs)
            
            # Most pairs should be negative (realistic hiring scenario)
            candidate_indices.append(cand_idx)
            job_indices.append(job_idx)
            labels.append(0.0)
        
        # Shuffle the pairs
        indices = np.random.permutation(len(candidate_indices))
        candidate_indices = np.array(candidate_indices)[indices]
        job_indices = np.array(job_indices)[indices]
        labels = np.array(labels)[indices]
        
        print(f"Created {len(labels)} pairs with {np.sum(labels)} positive matches ({np.mean(labels):.2%})")
        
        return candidate_indices, job_indices, labels
    
    def _calculate_match_score(self, candidate: pd.Series, job: pd.Series) -> float:
        """Calculate match score between candidate and job."""
        score = 0.0
        
        # Experience match
        if 'experience_years' in candidate and 'min_experience' in job:
            exp_score = 1.0 if candidate['experience_years'] >= job['min_experience'] else 0.5
            score += 0.3 * exp_score
        
        # Location match
        if 'location' in candidate and 'location' in job:
            loc_score = 1.0 if candidate['location'] == job['location'] or 'Remote' in [candidate.get('work_preference', ''), job.get('work_type', '')] else 0.3
            score += 0.2 * loc_score
        
        # Skills match (basic overlap)
        if 'skills' in candidate and 'required_skills' in job:
            cand_skills = set(str(candidate['skills']).lower().split(', '))
            job_skills = set(str(job['required_skills']).lower().split(', '))
            overlap = len(cand_skills.intersection(job_skills))
            skills_score = min(1.0, overlap / max(1, len(job_skills)))
            score += 0.5 * skills_score
        
        return min(1.0, score)

def load_hiring_data(candidate_csv_path: str, job_json_path: str) -> Dict:
    """Main function to load and preprocess hiring data."""
    
    processor = HiringDataProcessor()
    
    # Load raw data
    candidate_df = processor.load_candidate_data(candidate_csv_path)
    job_df = processor.load_job_data(job_json_path)
    
    # Preprocess features
    candidate_features, candidate_info = processor.preprocess_candidates(candidate_df)
    job_features, job_info = processor.preprocess_jobs(job_df)
    
    # Create training pairs
    cand_indices, job_indices, labels = processor.create_training_pairs(
        candidate_df, job_df, n_pairs=20000
    )
    
    return {
        'candidate_features': candidate_features,
        'job_features': job_features,
        'candidate_indices': cand_indices,
        'job_indices': job_indices,
        'labels': labels,
        'candidate_info': candidate_info,
        'job_info': job_info,
        'candidate_df': candidate_df,
        'job_df': job_df,
        'processor': processor
    }

if __name__ == "__main__":
    # Test with sample data
    data = load_hiring_data("dummy_path.csv", "dummy_path.json")
    print(f"\nData loaded successfully!")
    print(f"Candidates: {data['candidate_features'].shape}")
    print(f"Jobs: {data['job_features'].shape}")
    print(f"Training pairs: {len(data['labels'])}")
