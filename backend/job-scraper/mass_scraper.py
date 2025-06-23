#!/usr/bin/env python3
"""
Mass healthcare job scraper - Generate thousands of jobs for pipeline testing
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
import sys

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

from enhanced_selenium_scraper import EnhancedJobData

def generate_healthcare_jobs(target_count: int = 5000) -> list:
    """Generate a large dataset of healthcare jobs."""
    print(f"🏗️  Generating {target_count} healthcare jobs for pipeline testing...")
    
    # Expanded job templates with more variety
    job_templates = [
        # Nursing (30% of jobs)
        {
            'titles': [
                'Registered Nurse - ICU', 'RN - Emergency Department', 'Staff Nurse - Med/Surg', 
                'Charge Nurse', 'ICU Nurse', 'Pediatric Nurse', 'Oncology Nurse', 
                'OR Nurse', 'Labor & Delivery Nurse', 'Cardiac Nurse', 'Trauma Nurse',
                'Travel Nurse', 'Nurse Manager', 'Clinical Nurse', 'Float Pool Nurse'
            ],
            'companies': [
                'Metro General Hospital', 'City Medical Center', 'Regional Healthcare', 
                'University Hospital', 'St. Mary\'s Medical Center', 'Children\'s Hospital',
                'Cancer Treatment Center', 'Heart Institute', 'Community Hospital',
                'Memorial Medical Center', 'Baptist Health System', 'Methodist Hospital'
            ],
            'locations': [
                'Atlanta, GA', 'Phoenix, AZ', 'Dallas, TX', 'Miami, FL', 'Seattle, WA',
                'Denver, CO', 'Austin, TX', 'Charlotte, NC', 'Nashville, TN', 'Orlando, FL',
                'Tampa, FL', 'Jacksonville, FL', 'Houston, TX', 'San Antonio, TX'
            ],
            'category': 'nursing',
            'salary_range': (55000, 95000),
            'weight': 0.30
        },
        # CNA/Nursing Assistant (20% of jobs)
        {
            'titles': [
                'CNA - Certified Nursing Assistant', 'Nursing Assistant', 'Patient Care Assistant',
                'Nursing Aide', 'Healthcare Assistant', 'Clinical Assistant', 'Ward Clerk',
                'Patient Care Technician', 'Medical Assistant', 'Unit Secretary'
            ],
            'companies': [
                'Sunrise Care Center', 'Golden Years Nursing Home', 'Comfort Care Facility',
                'Assisted Living Center', 'Rehabilitation Center', 'Memory Care Unit',
                'Long-term Care Facility', 'Skilled Nursing Facility'
            ],
            'locations': [
                'Houston, TX', 'Chicago, IL', 'Los Angeles, CA', 'New York, NY',
                'Philadelphia, PA', 'Detroit, MI', 'Cleveland, OH', 'Milwaukee, WI'
            ],
            'category': 'cna',
            'salary_range': (28000, 48000),
            'weight': 0.20
        },
        # Home Health (15% of jobs)
        {
            'titles': [
                'Home Health Aide', 'Personal Care Assistant', 'Companion Caregiver',
                'Private Duty Nurse', 'Home Care Nurse', 'Live-in Caregiver',
                'Respite Care Provider', 'Elder Care Assistant'
            ],
            'companies': [
                'Caring Hearts Home Care', 'Family First Care', 'Helping Hands Services',
                'ComForCare', 'Visiting Angels', 'Home Instead', 'Comfort Keepers',
                'Senior Helpers', 'Brightstar Care', 'Maxim Healthcare'
            ],
            'locations': [
                'Orlando, FL', 'Denver, CO', 'Portland, OR', 'Boston, MA',
                'Las Vegas, NV', 'Sacramento, CA', 'Kansas City, MO', 'Memphis, TN'
            ],
            'category': 'home_health',
            'salary_range': (22000, 38000),
            'weight': 0.15
        },
        # Medical Assistant/Allied Health (15% of jobs)
        {
            'titles': [
                'Medical Assistant', 'Clinical Assistant', 'Healthcare Assistant',
                'Physical Therapist', 'Occupational Therapist', 'Respiratory Therapist',
                'Radiology Technician', 'Lab Technician', 'Pharmacy Technician',
                'Medical Receptionist', 'Medical Scribe'
            ],
            'companies': [
                'Family Practice Associates', 'Primary Care Center', 'Medical Group',
                'Urgent Care Center', 'Outpatient Clinic', 'Specialty Clinic',
                'Diagnostic Center', 'Physical Therapy Center'
            ],
            'locations': [
                'San Antonio, TX', 'Philadelphia, PA', 'San Diego, CA',
                'Columbus, OH', 'Indianapolis, IN', 'Louisville, KY', 'Raleigh, NC'
            ],
            'category': 'medical_assistant',
            'salary_range': (32000, 55000),
            'weight': 0.15
        },
        # Specialized Healthcare (10% of jobs)
        {
            'titles': [
                'Mental Health Counselor', 'Social Worker', 'Case Manager',
                'Discharge Planner', 'Healthcare Coordinator', 'Patient Navigator',
                'Clinical Research Coordinator', 'Quality Assurance Specialist'
            ],
            'companies': [
                'Mental Health Center', 'Behavioral Health Services', 'Social Services',
                'Research Institute', 'Healthcare Network', 'Medical Foundation'
            ],
            'locations': [
                'Portland, OR', 'Minneapolis, MN', 'Pittsburgh, PA', 'Buffalo, NY',
                'Richmond, VA', 'Salt Lake City, UT', 'Oklahoma City, OK'
            ],
            'category': 'specialized_healthcare',
            'salary_range': (45000, 70000),
            'weight': 0.10
        },
        # Administrative/Support (10% of jobs)
        {
            'titles': [
                'Healthcare Administrator', 'Medical Office Manager', 'Healthcare Recruiter',
                'Medical Billing Specialist', 'Insurance Coordinator', 'Patient Services Rep',
                'Healthcare IT Specialist', 'Medical Records Clerk'
            ],
            'companies': [
                'Healthcare Administration', 'Medical Management Group', 'Health System',
                'Medical Billing Company', 'Healthcare Staffing Agency'
            ],
            'locations': [
                'Birmingham, AL', 'Little Rock, AR', 'Boise, ID', 'Des Moines, IA',
                'Wichita, KS', 'Omaha, NE', 'Albuquerque, NM'
            ],
            'category': 'healthcare_admin',
            'salary_range': (35000, 65000),
            'weight': 0.10
        }
    ]
    
    jobs = []
    
    # Calculate job counts based on weights
    for template in job_templates:
        count = int(target_count * template['weight'])
        
        for _ in range(count):
            # Random date within last 30 days
            random_days = random.randint(0, 30)
            scraped_date = (datetime.now() - timedelta(days=random_days)).isoformat()
            
            # Generate salary range
            salary_min = random.randint(template['salary_range'][0], template['salary_range'][1] - 10000)
            salary_max = random.randint(salary_min + 5000, template['salary_range'][1])
            
            # Generate job description
            descriptions = [
                f"Seeking qualified {template['category']} professional for full-time position. Excellent benefits package including health insurance, dental, vision, and retirement plan.",
                f"Join our dynamic healthcare team! We offer competitive salary, flexible scheduling, and opportunities for professional growth and development.",
                f"Immediate opening for experienced healthcare professional. Must have relevant certifications and excellent communication skills. Great work environment.",
                f"We are looking for a dedicated healthcare professional to join our team. Comprehensive benefits and competitive compensation package offered.",
                f"Excellent opportunity for career advancement in healthcare. Supportive team environment with ongoing education and training opportunities."
            ]
            
            job = EnhancedJobData(
                title=random.choice(template['titles']),
                company=random.choice(template['companies']),
                location=random.choice(template['locations']),
                description=random.choice(descriptions),
                source='mass_healthcare_generator',
                scraped_date=scraped_date,
                salary_min=salary_min,
                salary_max=salary_max,
                category=template['category'],
                job_type=random.choice(['full-time', 'part-time', 'contract', 'per-diem']),
                quality_score=random.randint(65, 98),
                url=f"https://example-jobs.com/job/{random.randint(100000, 999999)}",
                posted_date=(datetime.now() - timedelta(days=random_days)).strftime('%Y-%m-%d'),
                requirements=f"• {random.choice(['1-3', '2-5', '3+ years'])} years experience\n• Relevant certifications required\n• Excellent communication skills",
                benefits="Health Insurance, Dental, Vision, 401k, Paid Time Off"
            )
            
            jobs.append(job)
    
    # Fill remaining slots if needed
    remaining = target_count - len(jobs)
    if remaining > 0:
        for _ in range(remaining):
            template = random.choice(job_templates)
            # Similar job generation logic as above
            job = EnhancedJobData(
                title=random.choice(template['titles']),
                company=random.choice(template['companies']),
                location=random.choice(template['locations']),
                description="Healthcare position with competitive benefits package.",
                source='mass_healthcare_generator',
                scraped_date=datetime.now().isoformat(),
                salary_min=random.randint(template['salary_range'][0], template['salary_range'][1]),
                salary_max=random.randint(template['salary_range'][0], template['salary_range'][1]),
                category=template['category'],
                job_type='full-time',
                quality_score=random.randint(70, 95)
            )
            jobs.append(job)
    
    print(f"   ✅ Generated {len(jobs)} healthcare jobs")
    return jobs

def save_mass_results(jobs: list, count: int):
    """Save mass-generated results in multiple formats."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save JSON
    json_filename = f"mass_healthcare_jobs_{count}_{timestamp}.json"
    with open(json_filename, 'w') as f:
        json.dump([job.to_dict() for job in jobs], f, indent=2, default=str)
    
    # Save CSV
    csv_filename = f"mass_healthcare_jobs_{count}_{timestamp}.csv"
    
    # Create CSV header
    csv_content = "title,company,location,category,salary_min,salary_max,job_type,quality_score,posted_date,source\n"
    
    for job in jobs:
        csv_content += f'"{job.title}","{job.company}","{job.location}","{job.category}",{job.salary_min},{job.salary_max},"{job.job_type}",{job.quality_score},"{job.posted_date}","{job.source}"\n'
    
    with open(csv_filename, 'w') as f:
        f.write(csv_content)
    
    return json_filename, csv_filename

def main():
    """Generate mass healthcare jobs dataset."""
    print("🚀 MASS HEALTHCARE JOB GENERATOR")
    print("🎯 Target: Generate thousands of healthcare jobs")
    print("=" * 60)
    
    target_counts = [1000, 5000, 10000]
    
    print("Select target count:")
    for i, count in enumerate(target_counts, 1):
        print(f"   {i}. {count:,} jobs")
    
    # For automation, let's generate 5000 jobs
    target_count = 5000
    
    start_time = datetime.now()
    
    # Generate jobs
    jobs = generate_healthcare_jobs(target_count)
    
    # Filter by quality
    quality_jobs = [job for job in jobs if job.quality_score >= 70]
    high_quality_jobs = [job for job in jobs if job.quality_score >= 85]
    
    # Analyze results
    print(f"\n📈 Generation Results:")
    print(f"   Total jobs generated: {len(jobs):,}")
    print(f"   Quality jobs (≥70): {len(quality_jobs):,}")
    print(f"   High-quality jobs (≥85): {len(high_quality_jobs):,}")
    
    # Category breakdown
    categories = {}
    for job in jobs:
        cat = job.category or 'other'
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\n🏷️  Job Distribution by Category:")
    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(jobs)) * 100
        print(f"   {cat}: {count:,} ({percentage:.1f}%)")
    
    # Salary analysis
    salaries = [job.salary_min for job in jobs if job.salary_min > 0]
    if salaries:
        avg_salary = sum(salaries) / len(salaries)
        min_salary = min(salaries)
        max_salary = max(salaries)
        
        print(f"\n💰 Salary Analysis:")
        print(f"   Average: ${avg_salary:,.0f}")
        print(f"   Range: ${min_salary:,} - ${max_salary:,}")
    
    # Save results
    json_file, csv_file = save_mass_results(jobs, len(jobs))
    
    print(f"\n💾 Results saved:")
    print(f"   JSON: {json_file}")
    print(f"   CSV: {csv_file}")
    
    # Sample jobs
    print(f"\n⭐ Sample Jobs:")
    for i, job in enumerate(random.sample(jobs, min(5, len(jobs))), 1):
        print(f"   {i}. {job.title}")
        print(f"      Company: {job.company}")
        print(f"      Location: {job.location}")
        print(f"      Salary: ${job.salary_min:,} - ${job.salary_max:,}")
        print(f"      Category: {job.category}")
        print(f"      Quality: {job.quality_score}")
        print()
    
    end_time = datetime.now()
    duration = end_time - start_time
    
    print(f"⏱️  Generation Summary:")
    print(f"   Duration: {duration}")
    print(f"   Jobs generated: {len(jobs):,}")
    print(f"   Rate: {len(jobs) / duration.total_seconds():.0f} jobs/second")
    
    print(f"\n🎉 SUCCESS! Generated {len(jobs):,} healthcare jobs for pipeline testing!")
    
    return len(jobs)

if __name__ == "__main__":
    main() 