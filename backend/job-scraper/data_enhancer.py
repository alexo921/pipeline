#!/usr/bin/env python3
"""
Data Enhancement Script for Job Scraper
=======================================

This script takes an existing CSV file of job listings and enhances the data
by re-scraping URLs to fill in missing information like salary, location, etc.

Features:
- Re-scrapes job URLs to get missing data
- Fills in salary information
- Improves location data
- Adds missing job details
- Preserves existing good data
- Generates enhancement report
"""

import csv
import json
import logging
import re
import time
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urljoin, urlparse
from collections import Counter
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

import undetected_chromedriver as uc
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobDataEnhancer:
    """Enhances existing job data by re-scraping URLs to fill missing information"""
    
    def __init__(self, headless: bool = True, debug: bool = False, max_workers: int = 3, ct_focus: bool = True, max_days_old: int = 60):
        self.headless = headless
        self.debug = debug
        self.max_workers = max_workers
        self.ct_focus = ct_focus  # Focus on CT jobs
        self.max_days_old = max_days_old  # Filter out jobs older than this
        self.driver = None
        self.wait = None
        self.enhancement_stats = {
            'total_jobs': 0,
            'jobs_enhanced': 0,
            'jobs_improved': 0,
            'jobs_failed': 0,
            'ct_jobs': 0,
            'other_jobs': 0,
            'jobs_filtered_by_date': 0,
            'start_time': None,
            'errors': [],
            'improvements': {
                'salary_added': 0,
                'location_improved': 0,
                'description_enhanced': 0,
                'requirements_added': 0,
                'benefits_added': 0,
                'job_type_added': 0,
                'shift_type_added': 0
            }
        }
        self.lock = threading.Lock()
        
        # Salary patterns for extraction
        self.salary_patterns = [
            r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*to\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+)?(hour|hr|year|annual|month)',
            r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*to\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+)?(hour|hr|year|annual|month)',
            r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+)?(hour|hr|year|annual|month)',
            r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+)?(hour|hr|year|annual|month)',
            r'competitive\s+salary',
            r'competitive\s+pay',
            r'competitive\s+compensation'
        ]
        
        # Location patterns
        self.location_patterns = [
            r'([^,]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)',
            r'([^,]+),\s*([A-Z]{2})',
            r'([^,]+)\s+([A-Z]{2})\s*(\d{5}(?:-\d{4})?)',
            r'([^,]+)\s+([A-Z]{2})'
        ]
        
        # Job type patterns
        self.job_type_patterns = [
            r'(full\s*-?\s*time|fulltime)',
            r'(part\s*-?\s*time|parttime)',
            r'(per\s+diem|per\s*diem)',
            r'(temporary|temp)',
            r'(contract|contractor)',
            r'(casual)'
        ]
        
        # Shift type patterns
        self.shift_patterns = [
            r'(day\s+shift|days)',
            r'(night\s+shift|nights)',
            r'(evening\s+shift|evenings)',
            r'(rotating\s+shift|rotating)',
            r'(weekend\s+shift|weekends)',
            r'(on\s*-?\s*call|oncall)',
            r'(7\s*-\s*3|7am\s*-\s*3pm)',
            r'(3\s*-\s*11|3pm\s*-\s*11pm)',
            r'(11\s*-\s*7|11pm\s*-\s*7am)'
        ]
    
    def _setup_driver(self) -> bool:
        """Setup WebDriver for enhancement scraping"""
        try:
            chrome_options = uc.ChromeOptions()
            if self.headless:
                chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--disable-plugins")
            chrome_options.add_argument("--disable-images")
            chrome_options.add_argument("--disable-javascript")
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            chrome_options.add_argument("--disable-features=VizDisplayCompositor")
            
            try:
                service = Service(ChromeDriverManager().install())
                self.driver = uc.Chrome(service=service, options=chrome_options)
                self._log("✅ WebDriver setup successful for enhancement")
            except Exception as e:
                self._log(f"⚠️ webdriver-manager failed, trying fallback: {e}")
                self.driver = uc.Chrome(options=chrome_options)
                self._log("✅ WebDriver setup successful with fallback")
            
            self.wait = WebDriverWait(self.driver, 10)
            return True
            
        except Exception as e:
            self._log(f"❌ Failed to setup WebDriver: {e}")
            return False
    
    def _log(self, message: str):
        """Log message with timestamp"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"[{timestamp}] {message}")
        if self.debug:
            logger.info(message)
    
    def _needs_enhancement(self, job: Dict) -> bool:
        """Check if a job needs enhancement based on missing data"""
        missing_fields = []
        
        # Check for missing salary information
        if not job.get('salary_min') and not job.get('salary_max') and not job.get('salary_type'):
            missing_fields.append('salary')
        
        # Check for missing or poor location data
        if not job.get('city') or not job.get('state') or job.get('city') == '' or job.get('state') == '':
            missing_fields.append('location')
        
        # Check for missing job details
        if not job.get('job_type') or job.get('job_type') == '':
            missing_fields.append('job_type')
        
        if not job.get('shift_type') or job.get('shift_type') == '':
            missing_fields.append('shift_type')
        
        # Check for poor description
        description = job.get('description', '')
        if len(description) < 100 or 'Job listing:' in description:
            missing_fields.append('description')
        
        # Check for missing requirements
        if not job.get('requirements') or job.get('requirements') == '':
            missing_fields.append('requirements')
        
        # Check for missing benefits
        if not job.get('benefits') or job.get('benefits') == '':
            missing_fields.append('benefits')
        
        return len(missing_fields) > 0, missing_fields
    
    def _filter_jobs_by_date(self, jobs: List[Dict]) -> List[Dict]:
        """Filter jobs older than max_days_old days"""
        if not self.max_days_old:
            return jobs
            
        cutoff_date = datetime.now() - timedelta(days=self.max_days_old)
        filtered_jobs = []
        
        for job in jobs:
            # Skip jobs without posted_date
            posted_date = job.get('posted_date', '')
            if not posted_date:
                continue
                
            try:
                # Try to parse the posted_date
                if isinstance(posted_date, str):
                    # Handle different date formats
                    if posted_date.isdigit():
                        # Unix timestamp
                        job_date = datetime.fromtimestamp(int(posted_date))
                    elif 'T' in posted_date:
                        # ISO format
                        job_date = datetime.fromisoformat(posted_date.replace('Z', '+00:00'))
                    else:
                        # Try common date formats
                        for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%B %d, %Y', '%b %d, %Y']:
                            try:
                                job_date = datetime.strptime(posted_date, fmt)
                                break
                            except ValueError:
                                continue
                        else:
                            # If no format matches, skip this job
                            continue
                    
                    # Only include jobs posted within the specified timeframe
                    if job_date >= cutoff_date:
                        filtered_jobs.append(job)
                    else:
                        self.enhancement_stats['jobs_filtered_by_date'] += 1
                        
            except (ValueError, TypeError) as e:
                # Skip jobs with invalid date formats
                logger.debug(f"Skipping job with invalid date format '{posted_date}': {e}")
                continue
        
        return filtered_jobs
    
    def _filter_jobs_by_state(self, jobs: List[Dict]) -> List[Dict]:
        """Filter jobs to prioritize CT jobs if ct_focus is enabled"""
        if not self.ct_focus:
            return jobs
            
        ct_jobs = []
        other_jobs = []
        
        for job in jobs:
            state = job.get('state', '').upper()
            if state == 'CT':
                ct_jobs.append(job)
                self.enhancement_stats['ct_jobs'] += 1
            else:
                other_jobs.append(job)
                self.enhancement_stats['other_jobs'] += 1
        
        # Prioritize CT jobs, then add some other jobs as bonus
        if other_jobs:
            # Take only a limited number of non-CT jobs as bonus
            bonus_jobs = other_jobs[:len(ct_jobs) // 4]  # 25% of CT jobs as bonus
            return ct_jobs + bonus_jobs
        else:
            return ct_jobs
    
    def _extract_salary_from_text(self, text: str) -> Dict[str, Any]:
        """Extract salary information from text"""
        text_lower = text.lower()
        
        for pattern in self.salary_patterns:
            matches = re.findall(pattern, text_lower)
            if matches:
                if len(matches[0]) == 2:  # Range
                    min_sal, max_sal = matches[0]
                    min_sal = float(min_sal.replace(',', ''))
                    max_sal = float(max_sal.replace(',', ''))
                    return {
                        'salary_min': min_sal,
                        'salary_max': max_sal,
                        'salary_type': 'hourly' if 'hour' in text_lower or 'hr' in text_lower else 'yearly'
                    }
                elif len(matches[0]) == 2:  # Single value with type
                    amount, salary_type = matches[0]
                    amount = float(amount.replace(',', ''))
                    return {
                        'salary_min': amount,
                        'salary_max': amount,
                        'salary_type': 'hourly' if salary_type in ['hour', 'hr'] else 'yearly'
                    }
        
        # Check for competitive salary
        if any(phrase in text_lower for phrase in ['competitive salary', 'competitive pay', 'competitive compensation']):
            return {
                'salary_min': None,
                'salary_max': None,
                'salary_type': 'competitive'
            }
        
        return {}
    
    def _extract_location_from_text(self, text: str) -> Dict[str, str]:
        """Extract location information from text"""
        for pattern in self.location_patterns:
            matches = re.findall(pattern, text)
            if matches:
                if len(matches[0]) == 3:  # City, State, ZIP
                    city, state, zip_code = matches[0]
                    return {
                        'city': city.strip(),
                        'state': state.strip(),
                        'zip_code': zip_code.strip()
                    }
                elif len(matches[0]) == 2:  # City, State
                    city, state = matches[0]
                    return {
                        'city': city.strip(),
                        'state': state.strip(),
                        'zip_code': ''
                    }
        
        return {}
    
    def _extract_job_type_from_text(self, text: str) -> str:
        """Extract job type from text"""
        text_lower = text.lower()
        
        for pattern in self.job_type_patterns:
            if re.search(pattern, text_lower):
                match = re.search(pattern, text_lower).group(1)
                if 'full' in match:
                    return 'full-time'
                elif 'part' in match:
                    return 'part-time'
                elif 'per' in match and 'diem' in match:
                    return 'per-diem'
                elif 'temp' in match:
                    return 'temporary'
                elif 'contract' in match:
                    return 'contract'
                elif 'casual' in match:
                    return 'casual'
        
        return ''
    
    def _extract_shift_type_from_text(self, text: str) -> str:
        """Extract shift type from text"""
        text_lower = text.lower()
        
        for pattern in self.shift_patterns:
            if re.search(pattern, text_lower):
                match = re.search(pattern, text_lower).group(1)
                if 'day' in match:
                    return 'day'
                elif 'night' in match:
                    return 'night'
                elif 'evening' in match:
                    return 'evening'
                elif 'rotating' in match:
                    return 'rotating'
                elif 'weekend' in match:
                    return 'weekend'
                elif 'on' in match and 'call' in match:
                    return 'on-call'
                elif '7' in match and '3' in match:
                    return 'day'
                elif '3' in match and '11' in match:
                    return 'evening'
                elif '11' in match and '7' in match:
                    return 'night'
        
        return ''
    
    def _scrape_job_details(self, job_url: str) -> Dict[str, Any]:
        """Scrape detailed information from a job URL"""
        if not job_url or job_url == '':
            return {}
        
        try:
            if not self.driver:
                if not self._setup_driver():
                    return {}
            
            # Navigate to job URL
            self.driver.set_page_load_timeout(30)
            self.driver.get(job_url)
            time.sleep(random.uniform(2, 4))
            
            # Get page content
            page_source = self.driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # Extract text content
            text_content = soup.get_text()
            
            # Extract information
            enhancements = {}
            
            # Extract salary
            salary_info = self._extract_salary_from_text(text_content)
            if salary_info:
                enhancements.update(salary_info)
            
            # Extract location
            location_info = self._extract_location_from_text(text_content)
            if location_info:
                enhancements.update(location_info)
            
            # Extract job type
            job_type = self._extract_job_type_from_text(text_content)
            if job_type:
                enhancements['job_type'] = job_type
            
            # Extract shift type
            shift_type = self._extract_shift_type_from_text(text_content)
            if shift_type:
                enhancements['shift_type'] = shift_type
            
            # Extract description (look for longer, more detailed descriptions)
            description_selectors = [
                '.job-description',
                '.description',
                '.job-details',
                '.details',
                '[class*="description"]',
                '[class*="details"]',
                '.content',
                'main',
                'article'
            ]
            
            description_text = ''
            for selector in description_selectors:
                elements = soup.select(selector)
                for element in elements:
                    text = element.get_text().strip()
                    if len(text) > len(description_text):
                        description_text = text
            
            if len(description_text) > 200:  # Only use if significantly longer
                enhancements['description'] = description_text[:2000]  # Limit length
            
            # Extract requirements and benefits
            requirements = []
            benefits = []
            
            # Look for requirements sections
            req_keywords = ['requirements', 'qualifications', 'experience', 'education', 'skills']
            for keyword in req_keywords:
                elements = soup.find_all(text=re.compile(keyword, re.IGNORECASE))
                for element in elements:
                    parent = element.parent
                    if parent:
                        text = parent.get_text()
                        if len(text) > 50 and len(text) < 1000:
                            requirements.append(text.strip())
            
            # Look for benefits sections
            benefit_keywords = ['benefits', 'perks', 'compensation', 'package', 'offering']
            for keyword in benefit_keywords:
                elements = soup.find_all(text=re.compile(keyword, re.IGNORECASE))
                for element in elements:
                    parent = element.parent
                    if parent:
                        text = parent.get_text()
                        if len(text) > 50 and len(text) < 1000:
                            benefits.append(text.strip())
            
            if requirements:
                enhancements['requirements'] = '; '.join(requirements[:3])  # Limit to 3
            
            if benefits:
                enhancements['benefits'] = '; '.join(benefits[:3])  # Limit to 3
            
            return enhancements
            
        except Exception as e:
            self._log(f"Error scraping job details from {job_url}: {e}")
            return {}
    
    def enhance_job(self, job: Dict) -> Dict:
        """Enhance a single job with missing information"""
        needs_enhancement, missing_fields = self._needs_enhancement(job)
        
        if not needs_enhancement:
            return job
        
        self._log(f"Enhancing job: {job.get('title', 'Unknown')} - Missing: {missing_fields}")
        
        # Try to enhance using job_url first, then url
        job_url = job.get('job_url') or job.get('url')
        
        if job_url:
            enhancements = self._scrape_job_details(job_url)
            
            if enhancements:
                # Apply enhancements
                enhanced_job = job.copy()
                
                # Track improvements
                with self.lock:
                    if 'salary_min' in enhancements or 'salary_max' in enhancements:
                        self.enhancement_stats['improvements']['salary_added'] += 1
                    
                    if 'city' in enhancements or 'state' in enhancements:
                        self.enhancement_stats['improvements']['location_improved'] += 1
                    
                    if 'description' in enhancements:
                        self.enhancement_stats['improvements']['description_enhanced'] += 1
                    
                    if 'requirements' in enhancements:
                        self.enhancement_stats['improvements']['requirements_added'] += 1
                    
                    if 'benefits' in enhancements:
                        self.enhancement_stats['improvements']['benefits_added'] += 1
                    
                    if 'job_type' in enhancements:
                        self.enhancement_stats['improvements']['job_type_added'] += 1
                    
                    if 'shift_type' in enhancements:
                        self.enhancement_stats['improvements']['shift_type_added'] += 1
                
                enhanced_job.update(enhancements)
                enhanced_job['enhanced_at'] = datetime.now().isoformat()
                
                self.enhancement_stats['jobs_improved'] += 1
                return enhanced_job
        
        self.enhancement_stats['jobs_failed'] += 1
        return job
    
    def enhance_csv_data(self, input_filename: str, output_filename: str = None, max_jobs: Optional[int] = None) -> None:
        """Enhance job data from CSV file"""
        if output_filename is None:
            output_filename = input_filename.replace('.csv', '_enhanced.csv')
        
        self.enhancement_stats['start_time'] = datetime.now()
        self._log(f"🚀 Starting data enhancement for: {input_filename}")
        
        # Read existing CSV
        jobs = []
        try:
            with open(input_filename, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                jobs = list(reader)
        except Exception as e:
            self._log(f"❌ Error reading CSV file: {e}")
            return
        
        self.enhancement_stats['total_jobs'] = len(jobs)
        self._log(f"📊 Loaded {len(jobs)} jobs from {input_filename}")
        
        # Apply CT focus filtering
        if self.ct_focus:
            self._log(f"🎯 Applying CT focus filtering...")
            jobs = self._filter_jobs_by_state(jobs)
            self._log(f"  - CT jobs: {self.enhancement_stats['ct_jobs']}")
            self._log(f"  - Other jobs: {self.enhancement_stats['other_jobs']}")
            self._log(f"  - Total after CT filtering: {len(jobs)}")
        
        # Apply date filtering
        if self.max_days_old:
            self._log(f"📅 Applying date filter: Removing jobs older than {self.max_days_old} days...")
            jobs_before_date_filter = len(jobs)
            jobs = self._filter_jobs_by_date(jobs)
            self._log(f"  - Jobs before date filter: {jobs_before_date_filter}")
            self._log(f"  - Jobs after date filter: {len(jobs)}")
            self._log(f"  - Jobs removed (too old): {self.enhancement_stats['jobs_filtered_by_date']}")
        
        self._log(f"📊 Final job count for enhancement: {len(jobs)}")
        
        # Filter jobs that need enhancement
        jobs_to_enhance = []
        for job in jobs:
            needs_enhancement, _ = self._needs_enhancement(job)
            if needs_enhancement:
                jobs_to_enhance.append(job)
        
        self._log(f"🎯 {len(jobs_to_enhance)} jobs need enhancement")
        
        # Limit jobs if specified
        if max_jobs:
            jobs_to_enhance = jobs_to_enhance[:max_jobs]
            self._log(f"🔧 Limiting to {max_jobs} jobs for enhancement")
        
        # Enhance jobs
        enhanced_jobs = []
        processed = 0
        
        for job in jobs:
            if job in jobs_to_enhance:
                enhanced_job = self.enhance_job(job)
                enhanced_jobs.append(enhanced_job)
                processed += 1
                
                if processed % 10 == 0:
                    self._log(f"📈 Enhanced {processed}/{len(jobs_to_enhance)} jobs...")
                
                # Add delay between requests
                time.sleep(random.uniform(1, 3))
            else:
                enhanced_jobs.append(job)
        
        # Save enhanced data
        if enhanced_jobs:
            fieldnames = enhanced_jobs[0].keys()
            with open(output_filename, 'w', newline='', encoding='utf-8') as file:
                writer = csv.DictWriter(file, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(enhanced_jobs)
        
        # Generate enhancement report
        self._generate_enhancement_report(output_filename)
    
    def _generate_enhancement_report(self, output_filename: str) -> None:
        """Generate a report of enhancement results"""
        end_time = datetime.now()
        duration = end_time - self.enhancement_stats['start_time']
        
        self._log(f"\n🎉 Data Enhancement Completed!")
        self._log(f"📊 Enhancement Report:")
        self._log(f"   • Total Jobs: {self.enhancement_stats['total_jobs']}")
        self._log(f"   • CT Jobs: {self.enhancement_stats['ct_jobs']}")
        self._log(f"   • Other Jobs: {self.enhancement_stats['other_jobs']}")
        self._log(f"   • Jobs Filtered by Date: {self.enhancement_stats['jobs_filtered_by_date']}")
        self._log(f"   • Jobs Enhanced: {self.enhancement_stats['jobs_enhanced']}")
        self._log(f"   • Jobs Improved: {self.enhancement_stats['jobs_improved']}")
        self._log(f"   • Jobs Failed: {self.enhancement_stats['jobs_failed']}")
        self._log(f"   • Duration: {duration}")
        
        self._log(f"\n📈 Improvements Made:")
        for improvement, count in self.enhancement_stats['improvements'].items():
            if count > 0:
                self._log(f"   • {improvement.replace('_', ' ').title()}: {count}")
        
        self._log(f"\n💾 Enhanced data saved to: {output_filename}")
        
        # Save detailed report
        report_filename = output_filename.replace('.csv', '_enhancement_report.json')
        report = {
            'enhancement_stats': {
                'total_jobs': self.enhancement_stats['total_jobs'],
                'ct_jobs': self.enhancement_stats['ct_jobs'],
                'other_jobs': self.enhancement_stats['other_jobs'],
                'jobs_filtered_by_date': self.enhancement_stats['jobs_filtered_by_date'],
                'jobs_enhanced': self.enhancement_stats['jobs_enhanced'],
                'jobs_improved': self.enhancement_stats['jobs_improved'],
                'jobs_failed': self.enhancement_stats['jobs_failed'],
                'start_time': self.enhancement_stats['start_time'].isoformat() if self.enhancement_stats['start_time'] else None,
                'errors': self.enhancement_stats['errors'],
                'improvements': self.enhancement_stats['improvements']
            },
            'duration_seconds': duration.total_seconds(),
            'output_file': output_filename,
            'timestamp': end_time.isoformat()
        }
        
        with open(report_filename, 'w', encoding='utf-8') as file:
            json.dump(report, file, indent=2, ensure_ascii=False)
        
        self._log(f"📄 Detailed report saved to: {report_filename}")

def main():
    """Main function to run the data enhancer"""
    print("🚀 Job Data Enhancement Tool")
    print("=" * 50)
    
    # Initialize enhancer with CT focus and date filtering
    enhancer = JobDataEnhancer(
        headless=True,
        debug=True,
        max_workers=1,  # Use single worker for enhancement
        ct_focus=True,  # Focus on CT jobs
        max_days_old=60  # Filter out jobs older than 60 days
    )
    
    # Default input file (the cleaned CSV)
    input_filename = "enhanced_crawl4ai_jobs_anti_bot_1207_20250714_225544_cleaned.csv"
    
    # Check if file exists
    import os
    if not os.path.exists(input_filename):
        print(f"❌ Input file not found: {input_filename}")
        print("Please run the cleanup script first to generate the cleaned CSV file.")
        return
    
    try:
        # Enhance the data
        enhancer.enhance_csv_data(
            input_filename=input_filename,
            max_jobs=100  # Start with 100 jobs for testing
        )
        
    except KeyboardInterrupt:
        print("\n⚠️ Enhancement interrupted by user")
    except Exception as e:
        print(f"❌ Error during enhancement: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup
        if enhancer.driver:
            try:
                enhancer.driver.quit()
            except:
                pass

if __name__ == "__main__":
    main() 