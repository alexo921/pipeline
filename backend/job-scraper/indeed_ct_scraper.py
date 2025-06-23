#!/usr/bin/env python3
"""
Indeed Connecticut Healthcare Job Scraper
Based on: https://github.com/Eben001/IndeedJobScraper
Specialized for Connecticut and surrounding areas healthcare jobs
"""

import json
import csv
import time
import random
import requests
from datetime import datetime, timedelta
from pathlib import Path
import sys
import re
from typing import List, Dict, Any
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

from enhanced_selenium_scraper import EnhancedJobData

class IndeedCTScraper:
    """Specialized Indeed scraper for Connecticut healthcare jobs."""
    
    def __init__(self, headless=True):
        self.base_url = "https://www.indeed.com"
        self.driver = None
        self.headless = headless
        self.job_results = []
        
        # Connecticut specific locations
        self.ct_locations = [
            "Connecticut", "Hartford, CT", "New Haven, CT", "Stamford, CT", 
            "Bridgeport, CT", "Waterbury, CT", "Norwalk, CT", "Danbury, CT",
            "New Britain, CT", "West Haven, CT", "Greenwich, CT", "Bristol, CT"
        ]
        
        # Healthcare job keywords
        self.healthcare_keywords = [
            "registered nurse", "RN", "nurse", "nursing", "CNA", 
            "certified nursing assistant", "medical assistant", "healthcare",
            "home health aide", "patient care", "clinical", "hospital",
            "medical", "therapist", "technician"
        ]
    
    def setup_driver(self):
        """Setup Chrome WebDriver with proper configuration."""
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless")
        
        # Anti-detection measures
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        # Performance optimizations
        chrome_options.add_argument("--disable-images")
        chrome_options.add_argument("--disable-javascript")  # Remove if JS is needed
        chrome_options.add_argument("--disable-plugins")
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Execute script to remove webdriver property
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        return self.driver
    
    def build_search_url(self, job_keyword: str, location: str, radius: int = 25) -> str:
        """Build Indeed search URL for Connecticut jobs."""
        # Clean and format parameters
        job_query = job_keyword.replace(" ", "+")
        location_query = location.replace(" ", "+").replace(",", "%2C")
        
        # Build the search URL
        search_url = f"{self.base_url}/jobs?q={job_query}&l={location_query}&radius={radius}&sort=date"
        
        return search_url
    
    def extract_job_data(self, job_card) -> Dict[str, Any]:
        """Extract job data from Indeed job card element."""
        job_data = {}
        
        try:
            # Job Title and URL
            title_elem = job_card.find_element(By.CSS_SELECTOR, 'h2.jobTitle a')
            job_data['title'] = title_elem.get_attribute('title') or title_elem.text.strip()
            job_data['url'] = title_elem.get_attribute('href')
            
            # Company Name
            try:
                company_elem = job_card.find_element(By.CSS_SELECTOR, '[data-testid="company-name"]')
                job_data['company'] = company_elem.text.strip()
            except NoSuchElementException:
                job_data['company'] = "Unknown Company"
            
            # Location
            try:
                location_elem = job_card.find_element(By.CSS_SELECTOR, '[data-testid="job-location"]')
                job_data['location'] = location_elem.text.strip()
            except NoSuchElementException:
                job_data['location'] = "Connecticut"
            
            # Salary Information
            job_data['salary'] = ""
            try:
                salary_elem = job_card.find_element(By.CSS_SELECTOR, '[data-testid="attribute_snippet_testid"]')
                salary_text = salary_elem.text.strip()
                if any(word in salary_text.lower() for word in ['$', 'hour', 'year', 'salary']):
                    job_data['salary'] = salary_text
            except NoSuchElementException:
                pass
            
            # Job Description/Snippet
            try:
                desc_elem = job_card.find_element(By.CSS_SELECTOR, '[data-testid="job-snippet"]')
                job_data['description'] = desc_elem.text.strip()
            except NoSuchElementException:
                job_data['description'] = ""
            
            # Posted Date
            try:
                date_elem = job_card.find_element(By.CSS_SELECTOR, '[data-testid="myJobsStateDate"]')
                job_data['posted_date'] = date_elem.text.strip()
            except NoSuchElementException:
                job_data['posted_date'] = "Recently"
            
            # Job Type (if available)
            try:
                type_elem = job_card.find_element(By.CSS_SELECTOR, '[data-testid="attribute_snippet_testid"]')
                type_text = type_elem.text.strip().lower()
                if any(word in type_text for word in ['full', 'part', 'contract', 'temporary']):
                    job_data['job_type'] = type_text
                else:
                    job_data['job_type'] = "Full-time"
            except NoSuchElementException:
                job_data['job_type'] = "Full-time"
            
            # Additional metadata
            job_data['scraped_date'] = datetime.now().isoformat()
            job_data['source'] = 'indeed_ct_scraper'
            
        except Exception as e:
            print(f"   ⚠️  Error extracting job data: {e}")
            return None
        
        return job_data
    
    def parse_salary(self, salary_text: str) -> tuple:
        """Parse salary text to get min/max values."""
        if not salary_text:
            return 0, 0
        
        # Remove non-numeric characters except digits, periods, and common separators
        clean_text = re.sub(r'[^\d\.\-\s]', '', salary_text.lower())
        
        # Look for salary ranges
        range_patterns = [
            r'(\d+\.?\d*)\s*-\s*(\d+\.?\d*)',  # 50000 - 60000
            r'(\d+\.?\d*)\s*to\s*(\d+\.?\d*)',  # 50000 to 60000
        ]
        
        for pattern in range_patterns:
            match = re.search(pattern, clean_text)
            if match:
                try:
                    min_sal = float(match.group(1))
                    max_sal = float(match.group(2))
                    
                    # Convert hourly to annual if values are small
                    if min_sal < 100:  # Likely hourly rate
                        min_sal *= 2080  # 40 hours * 52 weeks
                        max_sal *= 2080
                    
                    return min_sal, max_sal
                except ValueError:
                    continue
        
        # Single value
        single_match = re.search(r'(\d+\.?\d*)', clean_text)
        if single_match:
            try:
                value = float(single_match.group(1))
                if value < 100:  # Hourly
                    value *= 2080
                return value * 0.9, value * 1.1  # Estimate range
            except ValueError:
                pass
        
        return 0, 0
    
    def categorize_job(self, title: str, description: str) -> str:
        """Categorize job based on title and description."""
        text = f"{title} {description}".lower()
        
        if any(word in text for word in ['rn', 'registered nurse', 'nurse manager', 'charge nurse']):
            return 'nursing'
        elif any(word in text for word in ['cna', 'nursing assistant', 'patient care assistant']):
            return 'cna'
        elif any(word in text for word in ['medical assistant', 'ma ', 'clinical assistant']):
            return 'medical_assistant'
        elif any(word in text for word in ['home health', 'caregiver', 'home care']):
            return 'home_health'
        elif any(word in text for word in ['therapist', 'therapy', 'pt', 'ot', 'physical therapy']):
            return 'therapy'
        elif any(word in text for word in ['technician', 'tech', 'lab', 'radiology', 'pharmacy']):
            return 'technician'
        else:
            return 'healthcare_other'
    
    def scrape_indeed_jobs(self, job_keyword: str, location: str, max_pages: int = 3) -> List[EnhancedJobData]:
        """Scrape Indeed jobs for specific keyword and location."""
        print(f"🔍 Scraping Indeed: '{job_keyword}' in {location}")
        
        jobs = []
        
        try:
            if not self.driver:
                self.setup_driver()
            
            # Build search URL
            search_url = self.build_search_url(job_keyword, location)
            print(f"   📋 URL: {search_url}")
            
            for page in range(max_pages):
                page_url = f"{search_url}&start={page * 10}"
                
                print(f"   📄 Scraping page {page + 1}/{max_pages}")
                
                self.driver.get(page_url)
                
                # Random delay to avoid rate limiting
                time.sleep(random.uniform(3, 6))
                
                # Wait for job cards to load
                try:
                    WebDriverWait(self.driver, 15).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, '[data-jk]'))
                    )
                except TimeoutException:
                    print(f"   ⚠️  Timeout waiting for jobs on page {page + 1}")
                    continue
                
                # Find all job cards
                job_cards = self.driver.find_elements(By.CSS_SELECTOR, '[data-jk]')
                print(f"   Found {len(job_cards)} job cards")
                
                if not job_cards:
                    print(f"   ⚠️  No job cards found on page {page + 1}")
                    break
                
                # Extract data from each job card
                page_jobs = 0
                for card in job_cards:
                    try:
                        job_data = self.extract_job_data(card)
                        if job_data:
                            # Create EnhancedJobData object
                            salary_min, salary_max = self.parse_salary(job_data.get('salary', ''))
                            
                            job = EnhancedJobData(
                                title=job_data['title'],
                                company=job_data['company'],
                                location=job_data['location'],
                                description=job_data['description'],
                                url=job_data['url'],
                                source=job_data['source'],
                                scraped_date=job_data['scraped_date'],
                                salary_min=salary_min,
                                salary_max=salary_max,
                                salary_text=job_data.get('salary', ''),
                                job_type=job_data.get('job_type', 'Full-time'),
                                posted_date=job_data.get('posted_date', ''),
                                category=self.categorize_job(job_data['title'], job_data['description'])
                            )
                            
                            # Calculate quality score
                            job.quality_score = self._calculate_quality_score(job)
                            
                            jobs.append(job)
                            page_jobs += 1
                            
                            print(f"   ✅ {job.title} at {job.company}")
                    
                    except Exception as e:
                        continue
                
                print(f"   📊 Page {page + 1}: {page_jobs} jobs extracted")
                
                # Delay between pages
                time.sleep(random.uniform(4, 8))
        
        except Exception as e:
            print(f"   ❌ Error scraping Indeed: {e}")
        
        print(f"   📊 Total jobs found: {len(jobs)}")
        return jobs
    
    def _calculate_quality_score(self, job: EnhancedJobData) -> float:
        """Calculate quality score for job posting."""
        score = 0.0
        
        # Basic information (40 points)
        if job.title: score += 10
        if job.company: score += 10
        if job.location: score += 10
        if job.description and len(job.description) > 50: score += 10
        
        # Salary information (30 points)
        if job.salary_min > 0 or job.salary_max > 0: score += 30
        
        # URL and source (20 points)
        if job.url: score += 15
        if job.source: score += 5
        
        # Additional details (10 points)
        if job.category: score += 5
        if job.posted_date: score += 5
        
        return min(score, 100.0)
    
    def run_comprehensive_ct_scrape(self) -> List[EnhancedJobData]:
        """Run comprehensive scraping for Connecticut healthcare jobs."""
        print("🚀 INDEED CONNECTICUT HEALTHCARE SCRAPER")
        print("=" * 50)
        
        all_jobs = []
        
        try:
            # Healthcare job searches for Connecticut
            search_combinations = [
                ("registered nurse", "Connecticut"),
                ("RN", "Hartford, CT"),
                ("nursing", "New Haven, CT"),
                ("CNA", "Stamford, CT"),
                ("medical assistant", "Bridgeport, CT"),
                ("healthcare", "Connecticut"),
            ]
            
            for keyword, location in search_combinations:
                try:
                    jobs = self.scrape_indeed_jobs(keyword, location, max_pages=2)
                    all_jobs.extend(jobs)
                    
                    print(f"   Running total: {len(all_jobs)} jobs")
                    
                    # Longer delay between searches
                    time.sleep(random.uniform(8, 15))
                    
                except Exception as e:
                    print(f"   ❌ Error with search '{keyword}' in {location}: {e}")
                    continue
        
        finally:
            if self.driver:
                self.driver.quit()
        
        return all_jobs
    
    def save_results(self, jobs: List[EnhancedJobData], format_type='both'):
        """Save results in JSON and/or CSV format."""
        if not jobs:
            print("❌ No jobs to save")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_filename = f"indeed_ct_jobs_{len(jobs)}_{timestamp}"
        
        # Save JSON
        if format_type in ['json', 'both']:
            json_filename = f"{base_filename}.json"
            with open(json_filename, 'w') as f:
                json.dump([job.to_dict() for job in jobs], f, indent=2, default=str)
            print(f"💾 JSON saved: {json_filename}")
        
        # Save CSV
        if format_type in ['csv', 'both']:
            csv_filename = f"{base_filename}.csv"
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                
                # Header
                writer.writerow([
                    'title', 'company', 'location', 'category', 'salary_min', 'salary_max', 
                    'salary_text', 'job_type', 'posted_date', 'quality_score', 'url', 'description'
                ])
                
                # Data rows
                for job in jobs:
                    writer.writerow([
                        job.title, job.company, job.location, job.category,
                        job.salary_min, job.salary_max, job.salary_text, job.job_type,
                        job.posted_date, job.quality_score, job.url, job.description
                    ])
            
            print(f"💾 CSV saved: {csv_filename}")
        
        return base_filename

def main():
    """Main function to run Indeed CT scraper."""
    print("🚀 INDEED CONNECTICUT HEALTHCARE JOB SCRAPER")
    print("🎯 Based on: https://github.com/Eben001/IndeedJobScraper")
    print("=" * 60)
    
    start_time = datetime.now()
    
    # Initialize scraper
    scraper = IndeedCTScraper(headless=True)
    
    try:
        # Run comprehensive scraping
        jobs = scraper.run_comprehensive_ct_scrape()
        
        if jobs:
            # Filter and analyze results
            quality_jobs = [job for job in jobs if job.quality_score >= 70]
            ct_jobs = [job for job in jobs if 'CT' in job.location.upper()]
            
            print(f"\n📈 Indeed Connecticut Results:")
            print(f"   Total jobs scraped: {len(jobs)}")
            print(f"   Connecticut-specific: {len(ct_jobs)}")
            print(f"   Quality jobs (≥70): {len(quality_jobs)}")
            
            # Category breakdown
            categories = {}
            for job in quality_jobs:
                cat = job.category or 'other'
                categories[cat] = categories.get(cat, 0) + 1
            
            print(f"\n🏷️  Job Categories:")
            for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                print(f"   {cat}: {count}")
            
            # Salary analysis
            salaries = [job.salary_min for job in quality_jobs if job.salary_min > 0]
            if salaries:
                avg_salary = sum(salaries) / len(salaries)
                print(f"\n💰 Average Salary: ${avg_salary:,.0f}")
            
            # Save results
            scraper.save_results(jobs, 'both')
            
            # Show sample results
            print(f"\n⭐ Sample Indeed CT Jobs:")
            for i, job in enumerate(quality_jobs[:5], 1):
                print(f"\n   {i}. {job.title}")
                print(f"      🏥 Company: {job.company}")
                print(f"      📍 Location: {job.location}")
                if job.salary_text:
                    print(f"      💰 Salary: {job.salary_text}")
                print(f"      🔗 Apply: {job.url}")
                print(f"      ⭐ Quality: {job.quality_score}/100")
            
            end_time = datetime.now()
            duration = end_time - start_time
            
            print(f"\n⏱️  Scraping Summary:")
            print(f"   Duration: {duration}")
            print(f"   Jobs scraped: {len(jobs)}")
            if len(jobs) > 0:
                print(f"   Success rate: {len(quality_jobs)/len(jobs)*100:.1f}%")
            
            print(f"\n🎉 SUCCESS! Scraped {len(jobs)} Indeed jobs for Connecticut!")
            
        else:
            print("\n😞 No jobs found on Indeed for Connecticut")
            
    except Exception as e:
        print(f"\n❌ Scraping failed: {e}")
    
    finally:
        if scraper.driver:
            scraper.driver.quit()

if __name__ == "__main__":
    main() 