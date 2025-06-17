import logging
from scraper_core import ScraperEngine
import json
from pathlib import Path
import requests
from datetime import datetime
import pandas as pd
import os
import unittest
from scraper_core import JobData
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def write_readable_output(jobs_data: dict, output_file: Path):
    """Write job data in a human-readable format."""
    with open(output_file, 'w') as f:
        f.write(f"Job Scraping Results\n")
        f.write(f"===================\n")
        f.write(f"Scraped on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Source URL: {jobs_data['source_url']}\n")
        f.write(f"Total Jobs Found: {jobs_data['total_jobs']}\n\n")

        for i, job in enumerate(jobs_data['jobs'], 1):
            f.write(f"Job {i}:\n")
            f.write(f"-------\n")
            f.write(f"Title: {job.get('title', 'N/A')}\n")
            f.write(f"Company: {job.get('company', 'N/A')}\n")
            f.write(f"Location: {job.get('location', 'N/A')}\n")
            f.write(f"URL: {job.get('url', 'N/A')}\n")
            if job.get('salary_min') or job.get('salary_max'):
                f.write(f"Salary: ${job.get('salary_min', 'N/A')} - ${job.get('salary_max', 'N/A')} {job.get('salary_period', '')}\n")
            f.write(f"Job Type: {job.get('job_type', 'N/A')}\n")
            f.write(f"Posted Date: {job.get('posted_date', 'N/A')}\n")
            if job.get('requirements'):
                f.write("Requirements:\n")
                for req in job['requirements']:
                    f.write(f"- {req}\n")
            f.write("\n")

def write_failed_urls(failed_urls: list, output_file: Path):
    """Write failed URLs to a file with reasons."""
    with open(output_file, 'w') as f:
        f.write("Failed Job Scraping URLs\n")
        f.write("=======================\n")
        f.write(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        for failed in failed_urls:
            f.write(f"URL: {failed['url']}\n")
            f.write(f"Reason: {failed['reason']}\n")
            f.write(f"Status: {failed['status']}\n")
            f.write("-------------------\n")

def analyze_page_structure(url: str):
    """Analyze the HTML structure of a page to help debug selectors"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Look for common job listing containers
        logger.info(f"\nAnalyzing page structure for {url}")
        
        # Check for job cards/listings
        job_containers = soup.find_all(['div', 'article', 'li'], class_=lambda x: x and any(term in x.lower() for term in ['job', 'position', 'listing', 'posting', 'career']))
        logger.info(f"Found {len(job_containers)} potential job containers")
        
        if job_containers:
            # Analyze first container
            sample = job_containers[0]
            logger.info("\nSample container structure:")
            logger.info(f"Tag: {sample.name}")
            logger.info(f"Classes: {sample.get('class', [])}")
            logger.info(f"ID: {sample.get('id', 'None')}")
            
            # Look for key elements
            logger.info("\nKey elements found:")
            for tag in ['h1', 'h2', 'h3', 'h4', 'a']:
                elements = sample.find_all(tag)
                logger.info(f"{tag} tags: {len(elements)}")
                for elem in elements[:2]:  # Show first 2 examples
                    logger.info(f"- {tag}: {elem.get_text(strip=True)[:100]}")
    
    except Exception as e:
        logger.error(f"Error analyzing {url}: {str(e)}")

def test_scraper():
    # Initialize scraper with basic config
    config = {
        'scraper': {
            'rate_limit': {
                'calls': 1,
                'period': 3  # 1 call every 3 seconds to be respectful
            },
            'pagination': {
                'max_pages': 2  # Limit to 2 pages for testing
            }
        }
    }
    
    scraper = ScraperEngine(config)
    
    # Updated test URLs with correct paths
    test_urls = [
        'https://www.mycnajobs.com/jobs/search/',  # Updated MyCNAJobs URL
        'https://www.homeinstead.com/home-care-jobs/',  # Correct Home Instead URL
        'https://www.brightstarcare.com/careers/caregiver-jobs'  # More specific BrightStar Care URL
    ]
    
    # First analyze the structure of each page
    for url in test_urls:
        analyze_page_structure(url)
        
    # Then test scraping
    for url in test_urls:
        logger.info(f"\nTesting scraper with URL: {url}")
        try:
            results = scraper.scrape(url)
            logger.info(f"Successfully scraped {results['total_jobs']} jobs from {url}")
            
            # Print first job details as sample
            if results['jobs']:
                logger.info("\nSample job details:")
                sample_job = results['jobs'][0]
                for key, value in sample_job.items():
                    logger.info(f"{key}: {value}")
        except Exception as e:
            logger.error(f"Error scraping {url}: {str(e)}")

if __name__ == "__main__":
    test_scraper()

class TestScraperEngine(unittest.TestCase):
    def setUp(self):
        self.scraper = ScraperEngine()
        
    def test_mycnajobs_parser(self):
        # Sample HTML that matches the format we see in successful_jobs.txt
        html = """
        <div class="job-listing">
            <div class="job-card">
                <h2 class="title">Home Health Aide (HHA)</h2>
                <div class="company-name">Affinity Home Care</div>
                <div class="location">Port Jefferson, NY, USA</div>
                <div class="job-type">Full-time</div>
                <div class="salary">$18-22/hr</div>
                <div class="posted-date">2d ago</div>
                <a href="https://www.mycnajobs.com/jobs/123456-home-health-aide-hha" class="job-link">View Job</a>
                <div class="description">Join our team as a Home Health Aide...</div>
            </div>
            <div class="job-card">
                <h2 class="title">Licensed Practical Nurse (LPN)</h2>
                <div class="company-name">Affinity Home Care</div>
                <div class="location">Patchogue, NY, USA</div>
                <div class="job-type">Part-time</div>
                <div class="salary">$25-30/hr</div>
                <div class="posted-date">1w ago</div>
                <a href="https://www.mycnajobs.com/jobs/123457-lpn" class="job-link">View Job</a>
                <div class="description">We are seeking an experienced LPN...</div>
            </div>
        </div>
        """
        
        base_url = "https://www.mycnajobs.com"
        jobs = self.scraper._parse_mycnajobs(html, base_url)
        
        # Verify we got both jobs
        self.assertEqual(len(jobs), 2)
        
        # Verify first job details
        job1 = jobs[0]
        self.assertEqual(job1['title'], "Home Health Aide (HHA)")
        self.assertEqual(job1['company'], "Affinity Home Care")
        self.assertEqual(job1['location'], "Port Jefferson, NY, USA")
        self.assertEqual(job1['job_type'], "Full-time")
        self.assertEqual(job1['salary_min'], 18.0)
        self.assertEqual(job1['salary_max'], 22.0)
        self.assertEqual(job1['salary_period'], "hourly")
        self.assertEqual(job1['posted_date'], "2d ago")
        self.assertTrue(job1['url'].endswith("123456-home-health-aide-hha"))
        
        # Verify second job details
        job2 = jobs[1]
        self.assertEqual(job2['title'], "Licensed Practical Nurse (LPN)")
        self.assertEqual(job2['company'], "Affinity Home Care")
        self.assertEqual(job2['location'], "Patchogue, NY, USA")
        self.assertEqual(job2['job_type'], "Part-time")
        self.assertEqual(job2['salary_min'], 25.0)
        self.assertEqual(job2['salary_max'], 30.0)
        self.assertEqual(job2['salary_period'], "hourly")
        self.assertEqual(job2['posted_date'], "1w ago")
        self.assertTrue(job2['url'].endswith("123457-lpn"))
        
    def test_salary_parser(self):
        test_cases = [
            ("$18-22/hr", {'salary_min': 18.0, 'salary_max': 22.0, 'salary_period': 'hourly'}),
            ("$50k/year", {'salary_min': 50000.0, 'salary_max': 50000.0, 'salary_period': 'yearly'}),
            ("$20/hour", {'salary_min': 20.0, 'salary_max': 20.0, 'salary_period': 'hourly'}),
            ("$40k - $60k per year", {'salary_min': 40000.0, 'salary_max': 60000.0, 'salary_period': 'yearly'}),
            ("$15.50/hr", {'salary_min': 15.50, 'salary_max': 15.50, 'salary_period': 'hourly'}),
        ]
        
        for salary_text, expected in test_cases:
            result = self.scraper._parse_salary(salary_text)
            self.assertEqual(result, expected, f"Failed parsing: {salary_text}")
            
    def test_job_data_cleaning(self):
        # Test case where title contains "ago VIEW JOB"
        job_data = {
            'title': '2d ago VIEW JOB',
            'company': '',
            'location': 'Home Health Aide (HHA) • Affinity Home Care • Full-time • Port Jefferson, NY, USA',
            'description': 'Join our team as a Home Health Aide...',
            'posted_date': '2d ago',
            'url': 'https://www.mycnajobs.com/jobs/123456',
            'source': 'mycnajobs',
            'scraped_date': datetime.now().isoformat()
        }
        
        job = JobData(**job_data)
        
        # Verify the cleaning worked
        self.assertEqual(job.title, "Home Health Aide (HHA)")
        self.assertEqual(job.company, "Affinity Home Care")
        self.assertEqual(job.job_type, "Full-time")
        self.assertEqual(job.location, "Port Jefferson, NY, USA")
        
    def test_duplicate_detection(self):
        # Create two similar jobs with all required fields
        job1_data = {
            'title': 'Home Health Aide',
            'company': 'Affinity Care',
            'location': 'New York, NY',
            'description': 'Join our team...',
            'posted_date': '1d ago',
            'url': 'https://example.com/job1',
            'source': 'test',
            'scraped_date': datetime.now().isoformat()
        }
        
        # Create a duplicate with slightly different data
        job2_data = job1_data.copy()
        job2_data['posted_date'] = '2d ago'
        job2_data['url'] = 'https://example.com/job2'
        
        job1 = JobData(**job1_data)
        job2 = JobData(**job2_data)
        
        # First job should not be a duplicate
        self.assertFalse(self.scraper.deduplicator.is_duplicate(job1.to_dict()))
        
        # Second job should be detected as duplicate
        self.assertTrue(self.scraper.deduplicator.is_duplicate(job2.to_dict()))