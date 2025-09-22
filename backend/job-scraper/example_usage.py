#!/usr/bin/env python3
"""
Example usage of the training dataset for pre-training machine learning models.
This script demonstrates how to load the transformed jobs and prepare them for various ML tasks.
"""

import json
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import numpy as np

def load_training_dataset(file_path: str):
    """Load the transformed training dataset."""
    with open(file_path, 'r', encoding='utf-8') as f:
        jobs = json.load(f)
    return jobs

def prepare_job_classification_data(jobs):
    """Prepare data for job classification (job setting, employment type, shift)."""
    data = []
    
    for job in jobs:
        # Extract features
        title = job.get('title', '')
        description = job.get('description', '')
        company = job.get('company', '')
        
        # Combine text features
        text_features = f"{title} {description} {company}".lower()
        
        # Extract target labels from tags
        job_setting = None
        employment_type = None
        shift = None
        
        for tag in job.get('tags', []):
            if tag['type'] == 'job_setting':
                job_setting = tag['label']
            elif tag['type'] == 'employment_type':
                employment_type = tag['label']
            elif tag['type'] == 'shift':
                shift = tag['label']
        
        data.append({
            'text_features': text_features,
            'job_setting': job_setting,
            'employment_type': employment_type,
            'shift': shift,
            'title': title,
            'company': company
        })
    
    return pd.DataFrame(data)

def prepare_salary_prediction_data(jobs):
    """Prepare data for salary prediction."""
    data = []
    
    for job in jobs:
        # Only include jobs with salary information
        salary = job.get('salary', '')
        if not salary:
            continue
            
        # Extract features
        title = job.get('title', '')
        description = job.get('description', '')
        company = job.get('company', '')
        location = job.get('location', '')
        
        # Combine text features
        text_features = f"{title} {description} {company} {location}".lower()
        
        # Extract salary value (simplified - you might want more sophisticated parsing)
        try:
            # Look for hourly rates first
            if 'per hour' in salary.lower():
                salary_match = salary.lower().replace('per hour', '').replace('$', '').replace(',', '').strip()
                salary_value = float(salary_match)
            elif 'per year' in salary.lower():
                salary_match = salary.lower().replace('per year', '').replace('$', '').replace(',', '').strip()
                salary_value = float(salary_match) / 2080  # Convert annual to hourly (40 hours/week * 52 weeks)
            else:
                continue
        except:
            continue
        
        data.append({
            'text_features': text_features,
            'salary_hourly': salary_value,
            'title': title,
            'company': company,
            'location': location
        })
    
    return pd.DataFrame(data)

def prepare_requirements_extraction_data(jobs):
    """Prepare data for requirements extraction."""
    data = []
    
    for job in jobs:
        description = job.get('description', '')
        requirements = job.get('requirements', [])
        
        if not requirements or not isinstance(requirements, list):
            continue
            
        # Create training examples for each requirement
        for req in requirements:
            if len(req) > 10:  # Filter out very short requirements
                data.append({
                    'description': description,
                    'requirement': req,
                    'title': job.get('title', ''),
                    'company': job.get('company', '')
                })
    
    return pd.DataFrame(data)

def train_job_classification_model(jobs_df):
    """Train a simple job classification model."""
    print("🔧 Training Job Classification Model...")
    
    # Prepare features
    vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
    X = vectorizer.fit_transform(jobs_df['text_features'])
    
    # Train models for each classification task
    models = {}
    
    # Job Setting Classification
    if 'job_setting' in jobs_df.columns:
        y_job_setting = jobs_df['job_setting'].dropna()
        if len(y_job_setting) > 0:
            X_job_setting = X[:len(y_job_setting)]
            X_train, X_test, y_train, y_test = train_test_split(
                X_job_setting, y_job_setting, test_size=0.2, random_state=42
            )
            
            model_job_setting = RandomForestClassifier(n_estimators=100, random_state=42)
            model_job_setting.fit(X_train, y_train)
            
            y_pred = model_job_setting.predict(X_test)
            print("\n📊 Job Setting Classification Results:")
            print(classification_report(y_test, y_pred))
            
            models['job_setting'] = {
                'model': model_job_setting,
                'vectorizer': vectorizer,
                'accuracy': model_job_setting.score(X_test, y_test)
            }
    
    # Employment Type Classification
    if 'employment_type' in jobs_df.columns:
        y_employment = jobs_df['employment_type'].dropna()
        if len(y_employment) > 0:
            X_employment = X[:len(y_employment)]
            X_train, X_test, y_train, y_test = train_test_split(
                X_employment, y_employment, test_size=0.2, random_state=42
            )
            
            model_employment = RandomForestClassifier(n_estimators=100, random_state=42)
            model_employment.fit(X_train, y_train)
            
            y_pred = model_employment.predict(X_test)
            print("\n📊 Employment Type Classification Results:")
            print(classification_report(y_test, y_pred))
            
            models['employment_type'] = {
                'model': model_employment,
                'vectorizer': vectorizer,
                'accuracy': model_employment.score(X_test, y_test)
            }
    
    # Shift Classification
    if 'shift' in jobs_df.columns:
        y_shift = jobs_df['shift'].dropna()
        if len(y_shift) > 0:
            X_shift = X[:len(y_shift)]
            X_train, X_test, y_train, y_test = train_test_split(
                X_shift, y_shift, test_size=0.2, random_state=42
            )
            
            model_shift = RandomForestClassifier(n_estimators=100, random_state=42)
            model_shift.fit(X_train, y_train)
            
            y_pred = model_shift.predict(X_test)
            print("\n📊 Shift Classification Results:")
            print(classification_report(y_test, y_pred))
            
            models['shift'] = {
                'model': model_shift,
                'vectorizer': vectorizer,
                'accuracy': model_shift.score(X_test, y_test)
            }
    
    return models

def analyze_dataset_statistics(jobs):
    """Analyze and display dataset statistics."""
    print("📊 Dataset Analysis")
    print("=" * 50)
    
    # Basic counts
    print(f"Total jobs: {len(jobs)}")
    
    # Tag distribution
    tag_counts = {}
    for job in jobs:
        for tag in job.get('tags', []):
            tag_type = tag['type']
            tag_label = tag['label']
            if tag_type not in tag_counts:
                tag_counts[tag_type] = {}
            tag_counts[tag_type][tag_label] = tag_counts[tag_type].get(tag_label, 0) + 1
    
    for tag_type, labels in tag_counts.items():
        print(f"\n{tag_type.replace('_', ' ').title()}:")
        for label, count in labels.items():
            print(f"  {label}: {count}")
    
    # Salary information
    jobs_with_salary = sum(1 for job in jobs if job.get('salary'))
    print(f"\nJobs with salary information: {jobs_with_salary}")
    
    # Requirements information
    jobs_with_requirements = sum(1 for job in jobs if job.get('requirements') and len(job.get('requirements', [])) > 0)
    print(f"Jobs with requirements: {jobs_with_requirements}")
    
    # Location information
    jobs_with_location = sum(1 for job in jobs if job.get('location'))
    print(f"Jobs with location: {jobs_with_location}")
    
    # Company diversity
    unique_companies = set(job.get('company') for job in jobs if job.get('company'))
    print(f"Unique companies: {len(unique_companies)}")
    
    print("\n" + "=" * 50)

def main():
    """Main function demonstrating dataset usage."""
    print("🚀 Training Dataset Usage Examples")
    print("=" * 50)
    
    # Load the dataset
    dataset_file = "training_jobs_20250813_144107.json"
    try:
        jobs = load_training_dataset(dataset_file)
        print(f"✅ Loaded {len(jobs)} jobs from {dataset_file}")
    except FileNotFoundError:
        print(f"❌ Dataset file {dataset_file} not found!")
        print("Please run extract_training_jobs.py first to generate the dataset.")
        return
    
    # Analyze dataset statistics
    analyze_dataset_statistics(jobs)
    
    # Prepare data for different ML tasks
    print("\n🔧 Preparing Data for Machine Learning Tasks...")
    
    # 1. Job Classification
    print("\n1️⃣ Job Classification Data Preparation...")
    classification_df = prepare_job_classification_data(jobs)
    print(f"   Prepared {len(classification_df)} samples for classification")
    
    # 2. Salary Prediction
    print("\n2️⃣ Salary Prediction Data Preparation...")
    salary_df = prepare_salary_prediction_data(jobs)
    print(f"   Prepared {len(salary_df)} samples for salary prediction")
    
    # 3. Requirements Extraction
    print("\n3️⃣ Requirements Extraction Data Preparation...")
    requirements_df = prepare_requirements_extraction_data(jobs)
    print(f"   Prepared {len(requirements_df)} samples for requirements extraction")
    
    # Train a simple classification model
    if len(classification_df) > 0:
        print("\n🎯 Training Classification Models...")
        models = train_job_classification_model(classification_df)
        
        print(f"\n✅ Training completed! Trained {len(models)} models:")
        for task, model_info in models.items():
            print(f"   {task}: {model_info['accuracy']:.3f} accuracy")
    
    # Show sample predictions
    if len(classification_df) > 0:
        print("\n🔮 Sample Predictions:")
        sample_jobs = classification_df.head(3)
        
        for idx, job in sample_jobs.iterrows():
            print(f"\nJob {idx + 1}: {job['title']}")
            print(f"Company: {job['company']}")
            print(f"Actual Tags:")
            print(f"  - Job Setting: {job['job_setting']}")
            print(f"  - Employment Type: {job['employment_type']}")
            print(f"  - Shift: {job['shift']}")
    
    print("\n🎉 Dataset usage examples completed!")
    print("\nNext steps:")
    print("1. Use the prepared DataFrames for your specific ML tasks")
    print("2. Implement more sophisticated feature engineering")
    print("3. Try different ML algorithms (BERT, transformers, etc.)")
    print("4. Expand the dataset with more diverse job samples")

if __name__ == "__main__":
    main()
