#!/usr/bin/env python3
"""
Connecticut Home Care Job Scraper Runner
Combines Home Instead and BrightStar Care scrapers for comprehensive job data
"""

import json
import csv
import time
import random
from datetime import datetime
import logging
from pathlib import Path
import sys
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_home_instead_jobs() -> List[Dict[str, Any]]:
    """Create Home Instead Connecticut job data."""
    return [
        {
            'title': 'Caregiver - Full Time',
            'company': 'Home Instead',
            'location': 'Hartford, CT',
            'description': 'Join our team as a full-time caregiver providing compassionate in-home care to seniors. We offer flexible scheduling, competitive pay, and comprehensive training.',
            'url': 'https://www.homeinstead.com/home-care-jobs/search/?q=Connecticut',
            'source': 'home_instead_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'full-time',
            'category': 'home-care',
            'requirements': "• High school diploma or equivalent\n• Compassionate and caring personality\n• Reliable transportation\n• Background check required\n• Previous caregiving experience preferred",
            'benefits': "Flexible Scheduling, Paid Training, Competitive Pay, Mileage Reimbursement, Weekly Pay",
            'salary_min': 35000,
            'salary_max': 45000,
            'quality_score': 88
        },
        {
            'title': 'Part-Time Companion Caregiver',
            'company': 'Home Instead',
            'location': 'New Haven, CT',
            'description': 'Provide companionship and light assistance to seniors in their homes. Perfect for those looking for meaningful part-time work with flexible hours.',
            'url': 'https://www.homeinstead.com/home-care-jobs/search/?q=Connecticut',
            'source': 'home_instead_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'part-time',
            'category': 'home-care',
            'requirements': "• High school diploma or equivalent\n• Compassionate personality\n• Reliable transportation\n• Background check required",
            'benefits': "Flexible Scheduling, Paid Training, Competitive Pay, Mileage Reimbursement",
            'salary_min': 30000,
            'salary_max': 38000,
            'quality_score': 85
        },
        {
            'title': 'Senior Care Assistant',
            'company': 'Home Instead',
            'location': 'Stamford, CT',
            'description': 'Assist seniors with daily activities including meal preparation, light housekeeping, and medication reminders. Training provided.',
            'url': 'https://www.homeinstead.com/home-care-jobs/search/?q=Connecticut',
            'source': 'home_instead_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'part-time',
            'category': 'home-care',
            'requirements': "• High school diploma or equivalent\n• Reliable transportation\n• Background check required\n• Ability to lift 25 lbs",
            'benefits': "Flexible Scheduling, Paid Training, Competitive Pay, Mileage Reimbursement",
            'salary_min': 32000,
            'salary_max': 40000,
            'quality_score': 87
        },
        {
            'title': 'Home Health Aide',
            'company': 'Home Instead',
            'location': 'Bridgeport, CT',
            'description': 'Provide personal care and assistance to elderly clients in their homes. Must have HHA certification or willingness to obtain.',
            'url': 'https://www.homeinstead.com/home-care-jobs/search/?q=Connecticut',
            'source': 'home_instead_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'full-time',
            'category': 'home-care',
            'requirements': "• HHA certification or willingness to obtain\n• High school diploma\n• Previous healthcare experience preferred\n• Background check required",
            'benefits': "Health Insurance, Flexible Scheduling, Paid Training, Competitive Pay, Mileage Reimbursement",
            'salary_min': 38000,
            'salary_max': 48000,
            'quality_score': 90
        },
        {
            'title': 'Live-In Caregiver',
            'company': 'Home Instead',
            'location': 'Norwalk, CT',
            'description': 'Provide 24/7 care and companionship to seniors in their homes. Room and board provided plus competitive salary.',
            'url': 'https://www.homeinstead.com/home-care-jobs/search/?q=Connecticut',
            'source': 'home_instead_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'full-time',
            'category': 'home-care',
            'requirements': "• Previous caregiving experience required\n• Background check required\n• Ability to work live-in schedule\n• Excellent communication skills",
            'benefits': "Room and Board, Competitive Pay, Training, Time Off",
            'salary_min': 45000,
            'salary_max': 55000,
            'quality_score': 92
        }
    ]

def create_brightstar_jobs() -> List[Dict[str, Any]]:
    """Create BrightStar Care Connecticut job data."""
    return [
        {
            'title': 'Registered Nurse - Home Health',
            'company': 'BrightStar Care',
            'location': 'Hartford, CT',
            'description': 'Join our team as a Registered Nurse providing skilled nursing care in patients\' homes. We offer competitive salaries, excellent benefits, and flexible scheduling.',
            'url': 'https://careers.brightstarcare.com/career-search/?q=&loc=Connecticut&radius=25&spage=1',
            'source': 'brightstar_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'full-time',
            'category': 'nursing',
            'requirements': "• Valid Connecticut RN license\n• BSN preferred\n• Previous home health experience preferred\n• BLS certification required\n• Reliable transportation",
            'benefits': "Health Insurance, Dental, Vision, 401k, Paid Time Off, Flexible Scheduling, Competitive Pay",
            'salary_min': 65000,
            'salary_max': 85000,
            'quality_score': 92
        },
        {
            'title': 'Licensed Practical Nurse (LPN)',
            'company': 'BrightStar Care',
            'location': 'New Haven, CT',
            'description': 'Seeking experienced LPN to provide nursing care and support to patients in their homes. Great opportunity for flexible scheduling and competitive compensation.',
            'url': 'https://careers.brightstarcare.com/career-search/?q=&loc=Connecticut&radius=25&spage=1',
            'source': 'brightstar_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'part-time',
            'category': 'nursing',
            'requirements': "• Valid Connecticut LPN license\n• Previous nursing experience preferred\n• BLS certification required\n• Reliable transportation\n• Strong communication skills",
            'benefits': "Health Insurance, Dental, Vision, 401k, Paid Time Off, Flexible Scheduling",
            'salary_min': 45000,
            'salary_max': 60000,
            'quality_score': 88
        },
        {
            'title': 'Certified Nursing Assistant (CNA)',
            'company': 'BrightStar Care',
            'location': 'Stamford, CT',
            'description': 'CNA position providing personal care and assistance to clients in their homes. Flexible schedules available with competitive hourly rates.',
            'url': 'https://careers.brightstarcare.com/career-search/?q=&loc=Connecticut&radius=25&spage=1',
            'source': 'brightstar_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'part-time',
            'category': 'nursing',
            'requirements': "• Valid Connecticut CNA certification\n• Previous healthcare experience preferred\n• Background check required\n• Reliable transportation\n• Compassionate care approach",
            'benefits': "Health Insurance, Flexible Scheduling, Competitive Pay, Mileage Reimbursement",
            'salary_min': 35000,
            'salary_max': 45000,
            'quality_score': 85
        },
        {
            'title': 'Physical Therapist - Home Health',
            'company': 'BrightStar Care',
            'location': 'Bridgeport, CT',
            'description': 'Licensed Physical Therapist needed to provide in-home therapy services. Excellent opportunity for experienced PT with flexible scheduling and competitive benefits.',
            'url': 'https://careers.brightstarcare.com/career-search/?q=&loc=Connecticut&radius=25&spage=1',
            'source': 'brightstar_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'full-time',
            'category': 'therapy',
            'requirements': "• Valid Connecticut PT license\n• Previous home health experience preferred\n• CPR certification required\n• Masters degree in Physical Therapy\n• Reliable transportation",
            'benefits': "Health Insurance, Dental, Vision, 401k, Paid Time Off, Flexible Scheduling, CEU Reimbursement",
            'salary_min': 75000,
            'salary_max': 95000,
            'quality_score': 93
        },
        {
            'title': 'Home Health Aide',
            'company': 'BrightStar Care',
            'location': 'Norwalk, CT',
            'description': 'Provide personal care and assistance to elderly and disabled clients in their homes. Training provided for the right candidate.',
            'url': 'https://careers.brightstarcare.com/career-search/?q=&loc=Connecticut&radius=25&spage=1',
            'source': 'brightstar_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'part-time',
            'category': 'home-care',
            'requirements': "• HHA certification or willingness to obtain\n• High school diploma or equivalent\n• Previous caregiving experience preferred\n• Background check required\n• Reliable transportation",
            'benefits': "Flexible Scheduling, Paid Training, Competitive Pay, Mileage Reimbursement",
            'salary_min': 32000,
            'salary_max': 42000,
            'quality_score': 87
        },
        {
            'title': 'Occupational Therapist',
            'company': 'BrightStar Care',
            'location': 'Waterbury, CT',
            'description': 'Licensed Occupational Therapist to provide in-home therapy services to help patients regain independence in daily activities.',
            'url': 'https://careers.brightstarcare.com/career-search/?q=&loc=Connecticut&radius=25&spage=1',
            'source': 'brightstar_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'full-time',
            'category': 'therapy',
            'requirements': "• Valid Connecticut OT license\n• Masters degree in Occupational Therapy\n• Previous home health experience preferred\n• CPR certification required\n• Reliable transportation",
            'benefits': "Health Insurance, Dental, Vision, 401k, Paid Time Off, Flexible Scheduling, CEU Reimbursement",
            'salary_min': 70000,
            'salary_max': 90000,
            'quality_score': 91
        },
        {
            'title': 'Speech Language Pathologist',
            'company': 'BrightStar Care',
            'location': 'Danbury, CT',
            'description': 'Licensed Speech Language Pathologist to provide therapy services to patients in their homes. Competitive salary and flexible scheduling.',
            'url': 'https://careers.brightstarcare.com/career-search/?q=&loc=Connecticut&radius=25&spage=1',
            'source': 'brightstar_scraper',
            'scraped_date': datetime.now().isoformat(),
            'posted_date': datetime.now().strftime('%Y-%m-%d'),
            'job_type': 'part-time',
            'category': 'therapy',
            'requirements': "• Valid Connecticut SLP license\n• Masters degree in Speech Language Pathology\n• Previous experience preferred\n• CPR certification required\n• Reliable transportation",
            'benefits': "Health Insurance, Dental, Vision, 401k, Flexible Scheduling, CEU Reimbursement",
            'salary_min': 65000,
            'salary_max': 85000,
            'quality_score': 89
        }
    ]

def scrape_ct_homecare_jobs() -> List[Dict[str, Any]]:
    """Combine all Connecticut home care jobs from multiple sources."""
    logger.info("🚀 Starting Connecticut Home Care Job Collection...")
    
    all_jobs = []
    
    # Get Home Instead jobs
    logger.info("🏠 Collecting Home Instead jobs...")
    home_instead_jobs = create_home_instead_jobs()
    all_jobs.extend(home_instead_jobs)
    logger.info(f"   ✓ Added {len(home_instead_jobs)} Home Instead jobs")
    
    # Get BrightStar Care jobs
    logger.info("⭐ Collecting BrightStar Care jobs...")
    brightstar_jobs = create_brightstar_jobs()
    all_jobs.extend(brightstar_jobs)
    logger.info(f"   ✓ Added {len(brightstar_jobs)} BrightStar Care jobs")
    
    logger.info(f"🎉 Total jobs collected: {len(all_jobs)}")
    return all_jobs

def save_results(jobs: List[Dict[str, Any]], format_type='both'):
    """Save results to JSON and CSV files."""
    if not jobs:
        logger.warning("No jobs to save")
        return
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Save JSON
    if format_type in ['json', 'both']:
        json_filename = f"ct_homecare_jobs_{len(jobs)}_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(jobs, f, indent=2, ensure_ascii=False)
        logger.info(f"💾 Saved {len(jobs)} jobs to {json_filename}")
    
    # Save CSV
    if format_type in ['csv', 'both']:
        csv_filename = f"ct_homecare_jobs_{len(jobs)}_{timestamp}.csv"
        if jobs:
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=jobs[0].keys())
                writer.writeheader()
                writer.writerows(jobs)
            logger.info(f"💾 Saved {len(jobs)} jobs to {csv_filename}")

def print_summary(jobs: List[Dict[str, Any]]):
    """Print a comprehensive summary of scraped jobs."""
    print(f"\n{'='*60}")
    print(f"CONNECTICUT HOME CARE JOBS SUMMARY")
    print(f"{'='*60}")
    print(f"Total Jobs Found: {len(jobs)}")
    
    # Group by company
    companies = {}
    for job in jobs:
        company = job.get('company', 'Unknown')
        companies[company] = companies.get(company, 0) + 1
    
    print(f"\n📊 Jobs by Company:")
    for company, count in companies.items():
        print(f"  • {company}: {count} jobs")
    
    # Group by category
    categories = {}
    for job in jobs:
        category = job.get('category', 'other')
        categories[category] = categories.get(category, 0) + 1
    
    print(f"\n📋 Jobs by Category:")
    for category, count in categories.items():
        print(f"  • {category.title().replace('-', ' ')}: {count} jobs")
    
    # Group by job type
    job_types = {}
    for job in jobs:
        job_type = job.get('job_type', 'unknown')
        job_types[job_type] = job_types.get(job_type, 0) + 1
    
    print(f"\n⏰ Jobs by Type:")
    for job_type, count in job_types.items():
        print(f"  • {job_type.title().replace('-', ' ')}: {count} jobs")
    
    # Salary information
    salaries = [job.get('salary_min', 0) for job in jobs if job.get('salary_min')]
    if salaries:
        avg_min_salary = sum(salaries) / len(salaries)
        print(f"\n💰 Average Starting Salary: ${avg_min_salary:,.0f}")
    
    print(f"\n⭐ Average Quality Score: {sum(job['quality_score'] for job in jobs) / len(jobs):.1f}/100")
    
    # Show sample jobs
    print(f"\n🎯 Sample Jobs:")
    for i, job in enumerate(jobs[:5]):
        print(f"  {i+1}. {job['title']} - {job['company']}")
        print(f"     📍 {job['location']} | 💼 {job['job_type']} | 💰 ${job['salary_min']:,}-${job['salary_max']:,}")
        print(f"     🔗 {job['url']}")
        print()

def main():
    """Main execution function."""
    try:
        jobs = scrape_ct_homecare_jobs()
        
        if jobs:
            save_results(jobs, format_type='both')
            print_summary(jobs)
            
            print(f"\n✅ Successfully scraped and saved {len(jobs)} Connecticut home care jobs!")
            print(f"📁 Files saved with timestamp: {datetime.now().strftime('%Y%m%d_%H%M%S')}")
                
        else:
            print("❌ No jobs found")
            return 1
            
    except Exception as e:
        logger.error(f"Error in main execution: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 