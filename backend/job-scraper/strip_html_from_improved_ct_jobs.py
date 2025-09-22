#!/usr/bin/env python3
"""
Script to strip HTML from improved_ct_jobs_20250725_054659.json
"""

import json
import re
import html
from pathlib import Path

def strip_html_tags(text):
    """Remove HTML tags and decode HTML entities"""
    if not text or not isinstance(text, str):
        return text
    
    # Decode HTML entities first
    text = html.unescape(text)
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Clean up extra whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text

def clean_job_data(job):
    """Clean HTML from job data fields"""
    # Fields that commonly contain HTML
    html_fields = ['description', 'requirements', 'qualifications', 'title', 'company']
    
    for field in html_fields:
        if field in job and job[field]:
            job[field] = strip_html_tags(job[field])
    
    return job

def main():
    # File paths
    input_file = Path('improved_ct_jobs_20250725_054659.json')
    output_file = Path('improved_ct_jobs_20250725_054659_cleaned.json')
    
    print(f"Reading {input_file}...")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            jobs = json.load(f)
        
        print(f"Loaded {len(jobs)} jobs")
        
        # Clean each job
        cleaned_jobs = []
        for i, job in enumerate(jobs):
            if i % 100 == 0:
                print(f"Processing job {i + 1}/{len(jobs)}")
            
            cleaned_job = clean_job_data(job)
            cleaned_jobs.append(cleaned_job)
        
        # Save cleaned data
        print(f"Saving cleaned data to {output_file}...")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_jobs, f, indent=2, ensure_ascii=False)
        
        print("HTML stripping completed successfully!")
        print(f"Original file size: {input_file.stat().st_size / 1024 / 1024:.2f} MB")
        print(f"Cleaned file size: {output_file.stat().st_size / 1024 / 1024:.2f} MB")
        
        # Show a sample of cleaned data
        if cleaned_jobs:
            print("\nSample cleaned job description:")
            sample_job = cleaned_jobs[0]
            if 'description' in sample_job:
                desc = sample_job['description']
                print(desc[:200] + "..." if len(desc) > 200 else desc)
        
    except FileNotFoundError:
        print(f"Error: {input_file} not found")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {input_file}: {e}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 