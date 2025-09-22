#!/usr/bin/env python3
"""
Script to enhance existing job data by visiting individual job URLs
"""

import os
import json
import time
import logging
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from typing import List, Dict, Optional, Any
from datetime import datetime
import re
from urllib.parse import urljoin, urlparse
import csv

def setup_logging(debug: bool = False):
    """Setup logging configuration."""
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s | %(levelname)-8s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    return logging.getLogger(__name__)

logger = setup_logging()

class JobEnhancer:
    """Enhance job data by visiting individual job URLs."""
    
    def __init__(self, headless: bool = True, debug: bool = False):
        """Initialize the job enhancer."""
        self.headless = headless
        self.debug = debug
        self.driver = None
        self.stats = {
            'total_jobs': 0,
            'enhanced_jobs': 0,
            'skipped_jobs': 0,
            'failed_jobs': 0,
            'errors': [],
            'warnings': []
        }
        
        # Setup WebDriver
        if not self._setup_driver():
            raise Exception("Failed to setup WebDriver")
    
    def _setup_driver(self) -> bool:
        """Setup Chrome WebDriver."""
        try:
            options = uc.ChromeOptions()
            
            if self.headless:
                options.add_argument('--headless')
            
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1920,1080')
            options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            
            # Disable images and CSS for faster loading
            prefs = {
                "profile.managed_default_content_settings.images": 2,
                "profile.default_content_setting_values.notifications": 2
            }
            options.add_experimental_option("prefs", prefs)
            
            # Use Chromium browser
            options.binary_location = "/usr/bin/chromium-browser"
            
            self.driver = uc.Chrome(options=options)
            self.driver.set_page_load_timeout(30)
            
            logger.info("✅ WebDriver setup successful")
            return True
            
        except Exception as e:
            logger.error(f"❌ WebDriver setup failed: {e}")
            return False
    
    def _enhance_job_with_details(self, job: Dict) -> Dict:
        """Enhance job data by visiting the job URL and extracting detailed information."""
        if not job.get('job_url'):
            self.stats['skipped_jobs'] += 1
            return job
        
        enhanced_job = job.copy()
        job_url = job['job_url']
        
        try:
            logger.info(f"    🔍 Enhancing job: {job.get('title', 'Unknown')}")
            logger.info(f"    🔗 URL: {job_url}")
            
            # Visit the job detail page
            self.driver.get(job_url)
            time.sleep(3)  # Wait for page to load
            
            # Extract detailed information using JavaScript
            js_script = """
            function extractJobDetails() {
                const details = {};
                
                // Extract company name
                const companySelectors = [
                    '.company-name', '.employer', '.organization', '[class*="company"]',
                    '[class*="employer"]', '[class*="organization"]', '.job-company',
                    '.position-company', '.career-company', 'h1 + p', '.job-header p',
                    '[data-testid="company"]', '[data-company]', '.brand-name',
                    '.job-employer', '.position-employer', '.career-employer'
                ];
                
                for (let selector of companySelectors) {
                    const el = document.querySelector(selector);
                    if (el && el.textContent && el.textContent.trim().length > 2) {
                        details.company = el.textContent.trim();
                        break;
                    }
                }
                
                // Extract location
                const locationSelectors = [
                    '.location', '.job-location', '.position-location', '.career-location',
                    '[class*="location"]', '.job-address', '.position-address',
                    '[data-testid="location"]', '[data-location]', '.job-details .location',
                    '.job-info .location', '.position-info .location', '.job-address',
                    '.position-address', '.career-address', '.job-city', '.position-city'
                ];
                
                for (let selector of locationSelectors) {
                    const el = document.querySelector(selector);
                    if (el && el.textContent && el.textContent.trim().length > 2) {
                        details.location = el.textContent.trim();
                        break;
                    }
                }
                
                // Extract salary
                const salarySelectors = [
                    '.salary', '.job-salary', '.position-salary', '.career-salary',
                    '[class*="salary"]', '.compensation', '.pay', '.wage',
                    '[data-testid="salary"]', '[data-salary]', '.job-details .salary',
                    '.position-details .salary', '.benefits .salary', '.job-pay',
                    '.position-pay', '.career-pay', '.job-compensation'
                ];
                
                for (let selector of salarySelectors) {
                    const el = document.querySelector(selector);
                    if (el && el.textContent && el.textContent.trim().length > 2) {
                        details.salary = el.textContent.trim();
                        break;
                    }
                }
                
                // Extract job type
                const jobTypeSelectors = [
                    '.job-type', '.position-type', '.career-type', '.employment-type',
                    '[class*="job-type"]', '[class*="employment"]', '.type', '.category',
                    '[data-testid="job-type"]', '[data-type]', '.job-details .type',
                    '.position-details .type', '.employment-category', '.job-category',
                    '.position-category', '.career-category'
                ];
                
                for (let selector of jobTypeSelectors) {
                    const el = document.querySelector(selector);
                    if (el && el.textContent && el.textContent.trim().length > 2) {
                        details.job_type = el.textContent.trim();
                        break;
                    }
                }
                
                // Extract date posted
                const dateSelectors = [
                    '.date-posted', '.job-date', '.position-date', '.career-date',
                    '[class*="date"]', '.posted', '.published', '.created',
                    '[data-testid="date"]', '[data-date]', '.job-details .date',
                    '.position-details .date', '.posting-date', '.job-posted',
                    '.position-posted', '.career-posted'
                ];
                
                for (let selector of dateSelectors) {
                    const el = document.querySelector(selector);
                    if (el && el.textContent && el.textContent.trim().length > 2) {
                        details.date_posted = el.textContent.trim();
                        break;
                    }
                }
                
                // Extract enhanced description
                const descSelectors = [
                    '.job-description', '.position-description', '.career-description',
                    '.description', '.details', '.content', '.job-details',
                    '.position-details', '.career-details', '[class*="description"]',
                    '.job-content', '.position-content', '.career-content',
                    '.job-body', '.position-body', '.career-body', '.main-content',
                    '.job-main', '.position-main', '.career-main', '.job-summary',
                    '.position-summary', '.career-summary', '.job-overview',
                    '.position-overview', '.career-overview'
                ];
                
                for (let selector of descSelectors) {
                    const el = document.querySelector(selector);
                    if (el && el.textContent && el.textContent.trim().length > 50) {
                        details.description = el.textContent.trim();
                        break;
                    }
                }
                
                // Extract city and zip code from location
                if (details.location) {
                    const locationParts = details.location.split(',').map(part => part.trim());
                    if (locationParts.length >= 2) {
                        details.city = locationParts[0];
                        const stateZip = locationParts[1];
                        const zipMatch = stateZip.match(/\\d{5}/);
                        if (zipMatch) {
                            details.zip_code = zipMatch[0];
                        }
                    }
                }
                
                return details;
            }
            return extractJobDetails();
            """
            
            details = self.driver.execute_script(js_script)
            
            # Update enhanced job with detailed information
            if details:
                if details.get('company') and details['company'] != enhanced_job.get('company'):
                    enhanced_job['company'] = details['company']
                
                if details.get('location') and details['location'] != enhanced_job.get('location'):
                    enhanced_job['location'] = details['location']
                
                if details.get('salary') and details['salary'] != enhanced_job.get('salary'):
                    enhanced_job['salary'] = details['salary']
                
                if details.get('job_type') and details['job_type'] != enhanced_job.get('job_type'):
                    enhanced_job['job_type'] = details['job_type']
                
                if details.get('date_posted') and details['date_posted'] != enhanced_job.get('date_posted'):
                    enhanced_job['date_posted'] = details['date_posted']
                
                if details.get('description') and len(details['description']) > len(enhanced_job.get('description', '')):
                    enhanced_job['description'] = details['description']
                
                if details.get('city') and details['city'] != enhanced_job.get('city'):
                    enhanced_job['city'] = details['city']
                
                if details.get('zip_code') and details['zip_code'] != enhanced_job.get('zip_code'):
                    enhanced_job['zip_code'] = details['zip_code']
                
                self.stats['enhanced_jobs'] += 1
                logger.info(f"    ✅ Enhanced job with {len([k for k, v in details.items() if v])} new details")
            else:
                logger.info(f"    ⚠️ No additional details found for job")
            
        except Exception as e:
            logger.warning(f"    ⚠️ Error enhancing job {job_url}: {e}")
            self.stats['failed_jobs'] += 1
            self.stats['warnings'].append({
                'job_url': job_url,
                'error': str(e),
                'operation': 'enhancement'
            })
        
        return enhanced_job
    
    def enhance_jobs_batch(self, jobs: List[Dict], batch_size: int = 10) -> List[Dict]:
        """Enhance jobs in batches to avoid overwhelming the server."""
        enhanced_jobs = []
        total_jobs = len(jobs)
        self.stats['total_jobs'] = total_jobs
        
        logger.info(f"🚀 Starting job enhancement for {total_jobs} jobs")
        
        for i in range(0, total_jobs, batch_size):
            batch = jobs[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total_jobs + batch_size - 1) // batch_size
            
            logger.info(f"📦 Processing batch {batch_num}/{total_batches} ({len(batch)} jobs)")
            
            for job in batch:
                enhanced_job = self._enhance_job_with_details(job)
                enhanced_jobs.append(enhanced_job)
                
                # Small delay between jobs to be respectful
                time.sleep(1)
            
            # Longer delay between batches
            if i + batch_size < total_jobs:
                logger.info(f"⏳ Waiting 5 seconds before next batch...")
                time.sleep(5)
        
        logger.info(f"✅ Completed job enhancement. Enhanced {self.stats['enhanced_jobs']} jobs")
        return enhanced_jobs
    
    def save_enhanced_jobs(self, jobs: List[Dict], filename_prefix: str = "enhanced_jobs"):
        """Save enhanced jobs to JSON and CSV files."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save as JSON
        json_filename = f"{filename_prefix}_{len(jobs)}_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(jobs, f, indent=2, ensure_ascii=False)
        
        # Save as CSV
        csv_filename = f"{filename_prefix}_{len(jobs)}_{timestamp}.csv"
        if jobs:
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=jobs[0].keys())
                writer.writeheader()
                writer.writerows(jobs)
        
        logger.info(f"💾 Saved enhanced jobs to:")
        logger.info(f"   📄 JSON: {json_filename}")
        logger.info(f"   📊 CSV: {csv_filename}")
        
        return json_filename, csv_filename
    
    def print_summary(self):
        """Print enhancement summary."""
        logger.info(f"\n{'='*80}")
        logger.info("📊 JOB ENHANCEMENT SUMMARY")
        logger.info(f"{'='*80}")
        logger.info(f"💼 Total jobs processed: {self.stats['total_jobs']}")
        logger.info(f"🔍 Enhanced jobs: {self.stats['enhanced_jobs']}")
        logger.info(f"⏭️ Skipped jobs (no URL): {self.stats['skipped_jobs']}")
        logger.info(f"❌ Failed jobs: {self.stats['failed_jobs']}")
        
        if self.stats['warnings']:
            logger.info(f"\n⚠️ Warnings:")
            for warning in self.stats['warnings'][:5]:  # Show first 5 warnings
                logger.info(f"   • {warning.get('job_url', 'Unknown')}: {warning['error']}")
            if len(self.stats['warnings']) > 5:
                logger.info(f"   ... and {len(self.stats['warnings']) - 5} more warnings")
    
    def cleanup(self):
        """Clean up resources."""
        if self.driver:
            self.driver.quit()
            logger.info("🧹 WebDriver cleaned up")

def load_jobs_from_file(filename: str) -> List[Dict]:
    """Load jobs from JSON file."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            jobs = json.load(f)
        logger.info(f"✅ Loaded {len(jobs)} jobs from {filename}")
        return jobs
    except Exception as e:
        logger.error(f"❌ Error loading jobs from {filename}: {e}")
        raise

def main():
    """Main function to enhance existing job data."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Enhance existing job data by visiting job URLs')
    parser.add_argument('input_file', help='Input JSON file with job data')
    parser.add_argument('--batch-size', type=int, default=10, help='Batch size for processing (default: 10)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--headless', action='store_true', default=True, help='Run in headless mode (default: True)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_file):
        logger.error(f"❌ Input file not found: {args.input_file}")
        return
    
    try:
        # Load existing jobs
        jobs = load_jobs_from_file(args.input_file)
        
        if not jobs:
            logger.warning("⚠️ No jobs found in input file")
            return
        
        # Initialize enhancer
        enhancer = JobEnhancer(headless=args.headless, debug=args.debug)
        
        # Enhance jobs
        enhanced_jobs = enhancer.enhance_jobs_batch(jobs, batch_size=args.batch_size)
        
        if enhanced_jobs:
            # Save enhanced results
            input_name = os.path.splitext(os.path.basename(args.input_file))[0]
            enhancer.save_enhanced_jobs(enhanced_jobs, f"enhanced_{input_name}")
            
            # Print summary
            enhancer.print_summary()
            
            logger.info(f"\n🎉 Job enhancement completed successfully!")
        else:
            logger.warning("⚠️ No enhanced jobs to save")
        
    except Exception as e:
        logger.error(f"❌ Fatal error during enhancement: {e}")
        raise
    finally:
        # Cleanup
        if 'enhancer' in locals():
            enhancer.cleanup()

if __name__ == "__main__":
    main() 