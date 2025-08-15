#!/usr/bin/env python3
"""
Improved data loader for healthcare hiring optimization.
Better feature engineering and more intelligent training pair creation.
"""

import pandas as pd
import numpy as np
import json
import ast
from typing import Dict, List, Tuple, Optional, Any
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import torch
import re

class ImprovedHealthcareDataProcessor:
    """Enhanced processor for healthcare hiring data with better feature engineering."""
    
    def __init__(self):
        self.candidate_scaler = StandardScaler()
        self.job_scaler = StandardScaler()
        self.skill_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english', ngram_range=(1, 2))
        self.job_desc_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english', ngram_range=(1, 2))
        self.label_encoders = {}
        
        # Healthcare-specific mappings
        self.candidate_id_map = {}
        self.job_id_map = {}
        
        # Healthcare role mappings
        self.healthcare_roles = {
            'CNA': ['cna', 'certified nursing assistant', 'nursing assistant', 'aide'],
            'RN': ['rn', 'registered nurse', 'nurse', 'bsn', 'msn'],
            'LPN': ['lpn', 'licensed practical nurse', 'practical nurse'],
            'Physical Therapist': ['physical therapist', 'pt', 'dpt'],
            'Occupational Therapist': ['occupational therapist', 'ot', 'mot'],
            'Administrative': ['administrative', 'admin', 'coordinator', 'director'],
            'Therapy Assistant': ['therapy assistant', 'pta', 'ota', 'assistant']
        }
        
        # Healthcare settings
        self.healthcare_settings = {
            'nursing_home': ['nursing home', 'skilled nursing', 'long term care', 'rehabilitation'],
            'hospital': ['hospital', 'acute care', 'icu', 'emergency'],
            'home_health': ['home health', 'home care', 'visiting nurse', 'hospice'],
            'outpatient': ['outpatient', 'clinic', 'ambulatory', 'urgent care']
        }
    
    def load_candidate_data(self, csv_path: str) -> pd.DataFrame:
        """Load candidate data with healthcare focus."""
        print(f"Loading healthcare candidate data from {csv_path}")
        
        df = pd.read_csv(csv_path)
        print(f"✅ Loaded {len(df)} healthcare candidates")
        print(f"📊 Columns: {list(df.columns)}")
        
        # Parse skills from string representation of list
        if 'Skills' in df.columns:
            def parse_skills(skills_str):
                try:
                    skills_list = ast.literal_eval(skills_str)
                    if isinstance(skills_list, list):
                        # Clean and normalize healthcare skills
                        cleaned_skills = []
                        for skill in skills_list:
                            skill_str = str(skill).lower()
                            # Remove common non-medical words
                            if skill_str not in ['go', 'os', 'unity', 'gui', 'workexperience']:
                                cleaned_skills.append(skill)
                        return ' '.join(cleaned_skills)
                    return str(skills_str)
                except:
                    return str(skills_str)
            
            df['Skills_Text'] = df['Skills'].apply(parse_skills)
        
        # Extract healthcare-specific information
        df['Healthcare_Role'] = self._extract_healthcare_role(df)
        df['Healthcare_Setting'] = self._extract_healthcare_setting(df)
        df['Certification_Level'] = self._extract_certification_level(df)
        
        print(f"📝 Sample candidate skills: {df['Skills_Text'].iloc[0][:100]}...")
        print(f"🏥 Healthcare roles identified: {df['Healthcare_Role'].value_counts().to_dict()}")
        
        return df
    
    def _extract_healthcare_role(self, df: pd.DataFrame) -> pd.Series:
        """Extract healthcare roles from candidate data."""
        roles = []
        
        for idx, row in df.iterrows():
            skills_text = str(row.get('Skills_Text', '')).lower()
            suggested_pos = str(row.get('Suggested_Position', '')).lower()
            
            # Check for role matches
            found_role = 'Other'
            for role, keywords in self.healthcare_roles.items():
                if any(keyword in skills_text or keyword in suggested_pos for keyword in keywords):
                    found_role = role
                    break
            
            roles.append(found_role)
        
        return pd.Series(roles)
    
    def _extract_healthcare_setting(self, df: pd.DataFrame) -> pd.Series:
        """Extract healthcare setting preferences."""
        settings = []
        
        for idx, row in df.iterrows():
            skills_text = str(row.get('Skills_Text', '')).lower()
            
            # Check for setting matches
            found_setting = 'Unknown'
            for setting, keywords in self.healthcare_settings.items():
                if any(keyword in skills_text for keyword in keywords):
                    found_setting = setting
                    break
            
            settings.append(found_setting)
        
        return pd.Series(settings)
    
    def _extract_certification_level(self, df: pd.DataFrame) -> pd.Series:
        """Extract certification levels."""
        levels = []
        
        for idx, row in df.iterrows():
            skills_text = str(row.get('Skills_Text', '')).lower()
            exp_years = row.get('Years_of_Experience', 0)
            
            # Determine certification level
            if any(cert in skills_text for cert in ['cna', 'certified nursing assistant']):
                level = 'CNA'
            elif any(cert in skills_text for cert in ['lpn', 'licensed practical nurse']):
                level = 'LPN'
            elif any(cert in skills_text for cert in ['rn', 'registered nurse']):
                level = 'RN'
            elif any(cert in skills_text for cert in ['pt', 'physical therapist']):
                level = 'PT'
            elif any(cert in skills_text for cert in ['ot', 'occupational therapist']):
                level = 'OT'
            elif exp_years > 5:
                level = 'Experienced'
            elif exp_years > 0:
                level = 'Entry_Level'
            else:
                level = 'Student'
            
            levels.append(level)
        
        return pd.Series(levels)
    
    def load_job_data(self, json_path: str) -> pd.DataFrame:
        """Load job data with healthcare focus."""
        print(f"Loading healthcare job data from {json_path}")
        
        with open(json_path, 'r') as f:
            jobs_data = json.load(f)
        
        df = pd.DataFrame(jobs_data)
        print(f"✅ Loaded {len(df)} healthcare jobs")
        print(f"📊 Columns: {list(df.columns)}")
        
        # Combine title and description for text features
        df['job_text'] = (df['title'].fillna('') + ' ' + 
                         df['description'].fillna('') + ' ' + 
                         df['overview'].fillna(''))
        
        # Extract healthcare-specific job information
        df['Healthcare_Role'] = self._extract_job_healthcare_role(df)
        df['Healthcare_Setting'] = self._extract_job_healthcare_setting(df)
        df['Required_Certification'] = self._extract_required_certification(df)
        df['Experience_Required'] = self._extract_experience_required(df)
        
        print(f"📝 Sample job text: {df['job_text'].iloc[0][:100]}...")
        print(f"🏥 Job roles identified: {df['Healthcare_Role'].value_counts().to_dict()}")
        
        return df
    
    def _extract_job_healthcare_role(self, df: pd.DataFrame) -> pd.Series:
        """Extract healthcare roles from job postings."""
        roles = []
        
        for idx, row in df.iterrows():
            title = str(row.get('title', '')).lower()
            description = str(row.get('description', '')).lower()
            text = title + ' ' + description
            
            # Check for role matches
            found_role = 'Other'
            for role, keywords in self.healthcare_roles.items():
                if any(keyword in text for keyword in keywords):
                    found_role = role
                    break
            
            roles.append(found_role)
        
        return pd.Series(roles)
    
    def _extract_job_healthcare_setting(self, df: pd.DataFrame) -> pd.Series:
        """Extract healthcare settings from job postings."""
        settings = []
        
        for idx, row in df.iterrows():
            text = str(row.get('job_text', '')).lower()
            
            # Check for setting matches
            found_setting = 'Unknown'
            for setting, keywords in self.healthcare_settings.items():
                if any(keyword in text for keyword in keywords):
                    found_setting = setting
                    break
            
            settings.append(found_setting)
        
        return pd.Series(settings)
    
    def _extract_required_certification(self, df: pd.DataFrame) -> pd.Series:
        """Extract required certifications from job postings."""
        certs = []
        
        for idx, row in df.iterrows():
            text = str(row.get('job_text', '')).lower()
            
            # Check for certification requirements
            if any(cert in text for cert in ['cna', 'certified nursing assistant']):
                cert = 'CNA'
            elif any(cert in text for cert in ['lpn', 'licensed practical nurse']):
                cert = 'LPN'
            elif any(cert in text for cert in ['rn', 'registered nurse']):
                cert = 'RN'
            elif any(cert in text for cert in ['pt', 'physical therapist']):
                cert = 'PT'
            elif any(cert in text for cert in ['ot', 'occupational therapist']):
                cert = 'OT'
            else:
                cert = 'Not_Specified'
            
            certs.append(cert)
        
        return pd.Series(certs)
    
    def _extract_experience_required(self, df: pd.DataFrame) -> pd.Series:
        """Extract experience requirements from job postings."""
        exp_levels = []
        
        for idx, row in df.iterrows():
            text = str(row.get('job_text', '')).lower()
            
            # Check for experience requirements
            if any(phrase in text for phrase in ['entry level', 'new graduate', 'student']):
                exp_level = 'Entry_Level'
            elif any(phrase in text for phrase in ['experienced', 'senior', 'lead']):
                exp_level = 'Experienced'
            elif any(phrase in text for phrase in ['mid level', 'intermediate']):
                exp_level = 'Mid_Level'
            else:
                exp_level = 'Not_Specified'
            
            exp_levels.append(exp_level)
        
        return pd.Series(exp_levels)
    
    def preprocess_candidates(self, df: pd.DataFrame) -> Tuple[np.ndarray, Dict]:
        """Preprocess candidate features with healthcare focus."""
        print("🔄 Processing healthcare candidate features...")
        
        processed_features = []
        feature_names = []
        
        # Create candidate ID mapping
        self.candidate_id_map = {f"candidate_{i}": i for i in range(len(df))}
        
        # Numerical features
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
        
        # Boolean features
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
        
        # Healthcare-specific categorical features
        healthcare_categorical = ['Healthcare_Role', 'Healthcare_Setting', 'Certification_Level']
        
        for col in healthcare_categorical:
            if col in df.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                
                col_data = df[col].fillna('Unknown')
                encoded = self.label_encoders[col].fit_transform(col_data)
                processed_features.append(encoded.reshape(-1, 1))
                feature_names.append(f'{col}_encoded')
                print(f"  ✅ {col} features: {len(self.label_encoders[col].classes_)}")
        
        # Skills text vectorization (enhanced for healthcare)
        if 'Skills_Text' in df.columns:
            skills_vectors = self.skill_vectorizer.fit_transform(df['Skills_Text']).toarray()
            processed_features.append(skills_vectors)
            feature_names.extend([f'skill_{i}' for i in range(skills_vectors.shape[1])])
            print(f"  ✅ Enhanced skill features: {skills_vectors.shape[1]}")
        
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
        """Preprocess job features with healthcare focus."""
        print("🔄 Processing healthcare job features...")
        
        processed_features = []
        feature_names = []
        
        # Create job ID mapping
        if 'id' in df.columns:
            unique_jobs = df['id'].unique()
            self.job_id_map = {jid: i for i, jid in enumerate(unique_jobs)}
        else:
            self.job_id_map = {f"job_{i}": i for i in range(len(df))}
        
        # Job text features (enhanced for healthcare)
        if 'job_text' in df.columns:
            job_vectors = self.job_desc_vectorizer.fit_transform(df['job_text']).toarray()
            processed_features.append(job_vectors)
            feature_names.extend([f'job_text_{i}' for i in range(job_vectors.shape[1])])
            print(f"  ✅ Enhanced job text features: {job_vectors.shape[1]}")
        
        # Healthcare-specific categorical features
        healthcare_categorical = ['Healthcare_Role', 'Healthcare_Setting', 'Required_Certification', 'Experience_Required']
        
        for col in healthcare_categorical:
            if col in df.columns:
                if f'job_{col}' not in self.label_encoders:
                    self.label_encoders[f'job_{col}'] = LabelEncoder()
                
                col_data = df[col].fillna('Unknown')
                encoded = self.label_encoders[f'job_{col}'].fit_transform(col_data)
                processed_features.append(encoded.reshape(-1, 1))
                feature_names.append(f'{col}_encoded')
                print(f"  ✅ {col} features: {len(self.label_encoders[f'job_{col}'].classes_)}")
        
        # Company encoding
        if 'company' in df.columns:
            if 'job_company' not in self.label_encoders:
                self.label_encoders['job_company'] = LabelEncoder()
            
            company_encoded = self.label_encoders['job_company'].fit_transform(
                df['company'].fillna('Unknown')
            )
            processed_features.append(company_encoded.reshape(-1, 1))
            feature_names.append('company_encoded')
        
        # Location encoding
        if 'location' in df.columns:
            location_data = df['location'].fillna('Unknown')
            if not all(loc == '' or loc == 'Unknown' for loc in location_data):
                if 'job_location' not in self.label_encoders:
                    self.label_encoders['job_location'] = LabelEncoder()
                
                location_encoded = self.label_encoders['job_location'].fit_transform(location_data)
                processed_features.append(location_encoded.reshape(-1, 1))
                feature_names.append('location_encoded')
        
        # Text complexity features
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
            combined_features = self.job_scaler.fit_transform(combined_features)
        else:
            combined_features = np.random.randn(len(df), 10)
        
        print(f"  📊 Final job features shape: {combined_features.shape}")
        
        return combined_features, {
            'feature_names': feature_names,
            'n_jobs': len(df),
            'job_id_map': self.job_id_map
        }
    
    def create_intelligent_training_pairs(
        self, 
        candidate_df: pd.DataFrame, 
        job_df: pd.DataFrame, 
        n_pairs: int = 50000
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """Create intelligent training pairs based on healthcare matching."""
        
        print(f"🎯 Creating {n_pairs} intelligent healthcare training pairs...")
        
        n_candidates = len(candidate_df)
        n_jobs = len(job_df)
        
        candidate_indices = []
        job_indices = []
        labels = []
        
        # Create positive pairs based on healthcare matching
        positive_pairs_created = 0
        
        for _ in range(n_pairs):
            cand_idx = np.random.randint(0, n_candidates)
            job_idx = np.random.randint(0, n_jobs)
            
            candidate = candidate_df.iloc[cand_idx]
            job = job_df.iloc[job_idx]
            
            # Calculate intelligent match score
            match_score = self._calculate_healthcare_match_score(candidate, job)
            
            # Use threshold to determine positive/negative
            label = 1.0 if match_score > 0.7 else 0.0  # Higher threshold for better quality
            
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
    
    def _calculate_healthcare_match_score(self, candidate: pd.Series, job: pd.Series) -> float:
        """Calculate intelligent match score for healthcare positions."""
        score = 0.0
        
        # Role matching (most important)
        if 'Healthcare_Role' in candidate and 'Healthcare_Role' in job:
            if candidate['Healthcare_Role'] == job['Healthcare_Role']:
                score += 0.4  # Perfect role match
            elif candidate['Healthcare_Role'] != 'Other' and job['Healthcare_Role'] != 'Other':
                score += 0.2  # Both have healthcare roles
        
        # Certification level matching
        if 'Certification_Level' in candidate and 'Required_Certification' in job:
            cand_cert = candidate['Certification_Level']
            job_cert = job['Required_Certification']
            
            if cand_cert == job_cert:
                score += 0.3  # Perfect certification match
            elif cand_cert in ['RN', 'PT', 'OT'] and job_cert in ['RN', 'PT', 'OT']:
                score += 0.2  # Similar professional level
            elif cand_cert in ['LPN', 'CNA'] and job_cert in ['LPN', 'CNA']:
                score += 0.2  # Similar support level
        
        # Setting preferences
        if 'Healthcare_Setting' in candidate and 'Healthcare_Setting' in job:
            if candidate['Healthcare_Setting'] == job['Healthcare_Setting']:
                score += 0.2  # Perfect setting match
            elif candidate['Healthcare_Setting'] != 'Unknown' and job['Healthcare_Setting'] != 'Unknown':
                score += 0.1  # Both have specific settings
        
        # Experience level matching
        if 'Years_of_Experience' in candidate:
            exp_years = candidate.get('Years_of_Experience', 0)
            if 'Experience_Required' in job:
                job_exp = job['Experience_Required']
                
                if job_exp == 'Entry_Level' and exp_years <= 2:
                    score += 0.1
                elif job_exp == 'Mid_Level' and 2 < exp_years <= 8:
                    score += 0.1
                elif job_exp == 'Experienced' and exp_years > 8:
                    score += 0.1
        
        # Skills matching (enhanced)
        if 'Skills_Text' in candidate and 'job_text' in job:
            try:
                cand_skills = set(str(candidate['Skills_Text']).lower().split())
                job_text = set(str(job['job_text']).lower().split())
                
                # Remove common words
                common_words = {'and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
                cand_skills = cand_skills - common_words
                job_text = job_text - common_words
                
                if len(job_text) > 0:
                    overlap = len(cand_skills.intersection(job_text))
                    skills_score = min(1.0, overlap / max(1, len(job_text) * 0.05))  # Lower threshold
                    score += 0.2 * skills_score
            except:
                pass
        
        return min(1.0, score)

def load_improved_healthcare_data(candidate_csv_path: str, job_json_path: str) -> Dict:
    """Load healthcare data with improved processing."""
    
    processor = ImprovedHealthcareDataProcessor()
    
    # Load data
    candidate_df = processor.load_candidate_data(candidate_csv_path)
    job_df = processor.load_job_data(job_json_path)
    
    # Process features
    candidate_features, candidate_info = processor.preprocess_candidates(candidate_df)
    job_features, job_info = processor.preprocess_jobs(job_df)
    
    # Create intelligent training pairs
    cand_indices, job_indices, labels = processor.create_intelligent_training_pairs(
        candidate_df, job_df, n_pairs=40000  # More pairs for better training
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
    data = load_improved_healthcare_data(
        "transformed_features.csv", 
        "training_jobs_20250813_144107.json"
    )
    print(f"\n✅ Improved healthcare data loaded successfully!")
    print(f"📊 Candidates: {data['candidate_features'].shape}")
    print(f"📊 Jobs: {data['job_features'].shape}")
    print(f"📊 Training pairs: {len(data['labels'])}")
    print(f"📊 Positive rate: {np.mean(data['labels']):.1%}")
