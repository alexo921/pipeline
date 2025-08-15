"""
Real data loader for your actual hiring data files.
"""

import pandas as pd
import numpy as np
import json
import ast
from typing import Dict, List, Tuple, Optional, Any
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import torch

class RealHiringDataProcessor:
    """Process your actual candidate and job data."""
    
    def __init__(self):
        self.candidate_scaler = StandardScaler()
        self.job_scaler = StandardScaler()
        self.skill_vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
        self.job_desc_vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
        self.label_encoders = {}
        
        # Mappings
        self.candidate_id_map = {}
        self.job_id_map = {}
        
    def load_candidate_data(self, csv_path: str) -> pd.DataFrame:
        """Load candidate data from your transformed_features.csv."""
        print(f"Loading candidate data from {csv_path}")
        
        df = pd.read_csv(csv_path)
        print(f"✅ Loaded {len(df)} candidates")
        print(f"📊 Columns: {list(df.columns)}")
        
        # Parse skills from string representation of list
        if 'Skills' in df.columns:
            def parse_skills(skills_str):
                try:
                    # Convert string representation of list to actual list
                    skills_list = ast.literal_eval(skills_str)
                    return ' '.join(skills_list) if isinstance(skills_list, list) else str(skills_str)
                except:
                    return str(skills_str)
            
            df['Skills_Text'] = df['Skills'].apply(parse_skills)
        
        print(f"📝 Sample candidate skills: {df['Skills_Text'].iloc[0][:100]}...")
        return df
    
    def load_job_data(self, json_path: str) -> pd.DataFrame:
        """Load job data from your training_jobs JSON."""
        print(f"Loading job data from {json_path}")
        
        with open(json_path, 'r') as f:
            jobs_data = json.load(f)
        
        df = pd.DataFrame(jobs_data)
        print(f"✅ Loaded {len(df)} jobs")
        print(f"📊 Columns: {list(df.columns)}")
        
        # Combine title and description for text features
        df['job_text'] = (df['title'].fillna('') + ' ' + 
                         df['description'].fillna('') + ' ' + 
                         df['overview'].fillna(''))
        
        print(f"📝 Sample job text: {df['job_text'].iloc[0][:100]}...")
        return df
    
    def preprocess_candidates(self, df: pd.DataFrame) -> Tuple[np.ndarray, Dict]:
        """Preprocess candidate features."""
        print("🔄 Processing candidate features...")
        
        processed_features = []
        feature_names = []
        
        # Create candidate ID mapping
        self.candidate_id_map = {f"candidate_{i}": i for i in range(len(df))}
        
        # Numerical features from your data
        numerical_cols = [
            'Years_of_Experience', 'Resume_Job_Hopper_Score', 'Experience_Years_norm',
            'Shift_Availability_Match', 'Commute_Distance_miles', 'Intake_Completion_Time_minutes',
            'Weekly_Hours_Available', 'Commute_Distance_scaled', 'Weekly_Hours_norm'
        ]
        
        available_numerical = [col for col in numerical_cols if col in df.columns]
        if available_numerical:
            numerical_data = df[available_numerical].fillna(0).values.astype(float)
            processed_features.append(numerical_data)
            feature_names.extend(available_numerical)
            print(f"  ✅ Numerical features: {len(available_numerical)}")
        
        # Boolean/categorical features
        boolean_cols = [
            'Setting_Home Health', 'Setting_Hospital', 'Setting_No Preference', 'Setting_Nursing Home',
            'Exp_Entry Level', 'Exp_Mid-Junior', 'Exp_Mid-Senior', 'Exp_Senior',
            'Intake_Completed', 'Employer_Flag_Urgent', 'Weekend_Availability', 'Open_to_Per_Diem'
        ]
        
        available_boolean = [col for col in boolean_cols if col in df.columns]
        if available_boolean:
            boolean_data = df[available_boolean].fillna(False).astype(float).values
            processed_features.append(boolean_data)
            feature_names.extend(available_boolean)
            print(f"  ✅ Boolean features: {len(available_boolean)}")
        
        # Categorical features that need encoding
        categorical_cols = ['Suggested_Position', 'Job_Hopper_Bucket', 'Pay_Fairness_Sentiment']
        
        for col in categorical_cols:
            if col in df.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                
                # Fill NaN values before encoding
                col_data = df[col].fillna('Unknown')
                encoded = self.label_encoders[col].fit_transform(col_data)
                processed_features.append(encoded.reshape(-1, 1))
                feature_names.append(f'{col}_encoded')
        
        # Skills text vectorization
        if 'Skills_Text' in df.columns:
            skills_vectors = self.skill_vectorizer.fit_transform(df['Skills_Text']).toarray()
            processed_features.append(skills_vectors)
            feature_names.extend([f'skill_{i}' for i in range(skills_vectors.shape[1])])
            print(f"  ✅ Skill features: {skills_vectors.shape[1]}")
        
        # Combine all features
        combined_features = np.concatenate(processed_features, axis=1)
        
        # Normalize
        combined_features = self.candidate_scaler.fit_transform(combined_features)
        
        print(f"  📊 Final candidate features shape: {combined_features.shape}")
        
        return combined_features, {
            'feature_names': feature_names,
            'n_candidates': len(df),
            'candidate_id_map': self.candidate_id_map
        }
    
    def preprocess_jobs(self, df: pd.DataFrame) -> Tuple[np.ndarray, Dict]:
        """Preprocess job features."""
        print("🔄 Processing job features...")
        
        processed_features = []
        feature_names = []
        
        # Create job ID mapping
        if 'id' in df.columns:
            unique_jobs = df['id'].unique()
            self.job_id_map = {jid: i for i, jid in enumerate(unique_jobs)}
        else:
            self.job_id_map = {f"job_{i}": i for i in range(len(df))}
        
        # Job text features (title + description + overview)
        if 'job_text' in df.columns:
            job_vectors = self.job_desc_vectorizer.fit_transform(df['job_text']).toarray()
            processed_features.append(job_vectors)
            feature_names.extend([f'job_text_{i}' for i in range(job_vectors.shape[1])])
            print(f"  ✅ Job text features: {job_vectors.shape[1]}")
        
        # Company encoding (if available)
        if 'company' in df.columns:
            if 'job_company' not in self.label_encoders:
                self.label_encoders['job_company'] = LabelEncoder()
            
            company_encoded = self.label_encoders['job_company'].fit_transform(
                df['company'].fillna('Unknown')
            )
            processed_features.append(company_encoded.reshape(-1, 1))
            feature_names.append('company_encoded')
        
        # Location encoding (if available and not empty)
        if 'location' in df.columns:
            location_data = df['location'].fillna('Unknown')
            # Only encode if there are meaningful location values
            if not all(loc == '' or loc == 'Unknown' for loc in location_data):
                if 'job_location' not in self.label_encoders:
                    self.label_encoders['job_location'] = LabelEncoder()
                
                location_encoded = self.label_encoders['job_location'].fit_transform(location_data)
                processed_features.append(location_encoded.reshape(-1, 1))
                feature_names.append('location_encoded')
        
        # Add some basic numerical features based on text length (proxy for complexity)
        text_features = []
        if 'description' in df.columns:
            desc_lengths = df['description'].fillna('').apply(len).values.reshape(-1, 1)
            text_features.append(desc_lengths)
            feature_names.append('description_length')
        
        if 'title' in df.columns:
            title_lengths = df['title'].fillna('').apply(len).values.reshape(-1, 1)
            text_features.append(title_lengths)
            feature_names.append('title_length')
        
        if text_features:
            processed_features.extend(text_features)
        
        # Combine all features
        if processed_features:
            combined_features = np.concatenate(processed_features, axis=1)
            # Normalize
            combined_features = self.job_scaler.fit_transform(combined_features)
        else:
            # Fallback if no features extracted
            combined_features = np.random.randn(len(df), 10)
        
        print(f"  📊 Final job features shape: {combined_features.shape}")
        
        return combined_features, {
            'feature_names': feature_names,
            'n_jobs': len(df),
            'job_id_map': self.job_id_map
        }
    
    def create_training_pairs(
        self, 
        candidate_df: pd.DataFrame, 
        job_df: pd.DataFrame, 
        n_pairs: int = 50000
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Create intelligent training pairs based on your hiring data."""
        
        print(f"🎯 Creating {n_pairs} smart training pairs...")
        
        n_candidates = len(candidate_df)
        n_jobs = len(job_df)
        
        candidate_indices = []
        job_indices = []
        labels = []
        
        # Create positive pairs based on suggested position matching
        positive_pairs_created = 0
        
        for _ in range(n_pairs):
            cand_idx = np.random.randint(0, n_candidates)
            job_idx = np.random.randint(0, n_jobs)
            
            candidate = candidate_df.iloc[cand_idx]
            job = job_df.iloc[job_idx]
            
            # Calculate match score based on your data
            match_score = self._calculate_real_match_score(candidate, job)
            
            # Use threshold to determine positive/negative
            label = 1.0 if match_score > 0.6 else 0.0
            
            if label == 1.0:
                positive_pairs_created += 1
            
            candidate_indices.append(cand_idx)
            job_indices.append(job_idx)
            labels.append(label)
        
        # Convert to arrays
        candidate_indices = np.array(candidate_indices)
        job_indices = np.array(job_indices)
        labels = np.array(labels)
        
        print(f"  ✅ Created {len(labels)} pairs")
        print(f"  📊 Positive matches: {np.sum(labels)} ({np.mean(labels):.1%})")
        
        return candidate_indices, job_indices, labels
    
    def _calculate_real_match_score(self, candidate: pd.Series, job: pd.Series) -> float:
        """Calculate match score based on your actual data."""
        score = 0.0
        
        # Skills matching (most important for hiring)
        if 'Skills_Text' in candidate and 'job_text' in job:
            try:
                # Simple keyword overlap
                cand_skills = set(str(candidate['Skills_Text']).lower().split())
                job_text = set(str(job['job_text']).lower().split())
                
                # Remove common words
                common_words = {'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
                cand_skills = cand_skills - common_words
                job_text = job_text - common_words
                
                if len(job_text) > 0:
                    overlap = len(cand_skills.intersection(job_text))
                    skills_score = min(1.0, overlap / max(1, len(job_text) * 0.1))  # Adjust threshold
                    score += 0.6 * skills_score
            except:
                pass
        
        # Experience level matching
        if 'Years_of_Experience' in candidate:
            exp_years = candidate.get('Years_of_Experience', 0)
            # Assume jobs want 0-10 years (you can adjust based on job descriptions)
            exp_match = 1.0 if 0 <= exp_years <= 10 else 0.5
            score += 0.2 * exp_match
        
        # Setting preferences (healthcare specific)
        setting_cols = ['Setting_Home Health', 'Setting_Hospital', 'Setting_No Preference', 'Setting_Nursing Home']
        setting_match = 0.0
        for col in setting_cols:
            if col in candidate and candidate.get(col, False):
                setting_match = 1.0
                break
        score += 0.2 * setting_match
        
        return min(1.0, score)

def load_real_hiring_data(candidate_csv_path: str, job_json_path: str) -> Dict:
    """Load your actual hiring data files."""
    
    processor = RealHiringDataProcessor()
    
    # Load data
    candidate_df = processor.load_candidate_data(candidate_csv_path)
    job_df = processor.load_job_data(job_json_path)
    
    # Process features
    candidate_features, candidate_info = processor.preprocess_candidates(candidate_df)
    job_features, job_info = processor.preprocess_jobs(job_df)
    
    # Create training pairs
    cand_indices, job_indices, labels = processor.create_training_pairs(
        candidate_df, job_df, n_pairs=30000  # More pairs for better training
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
    # Test with your actual files
    data = load_real_hiring_data(
        "transformed_features.csv", 
        "training_jobs_20250813_144107.json"
    )
    print(f"\n✅ Real data loaded successfully!")
    print(f"📊 Candidates: {data['candidate_features'].shape}")
    print(f"📊 Jobs: {data['job_features'].shape}")
    print(f"📊 Training pairs: {len(data['labels'])}")
