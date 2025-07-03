#!/usr/bin/env python3
"""
Connecticut Home Care Job Scraper
Combined scraper for Home Instead and BrightStar Care Connecticut jobs
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
from typing import List, Dict, Any, Optional
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CTHomeCareJobScraper:
    """Combined scraper for Connecticut home care jobs from multiple sources."""
    
    def __init__(self, headless=True):
        self.headless = headless
        self.driver = None
        self.all_jobs = []
        
        # Site configurations
        self.sites = {
            'home_instead': {
                'base_url': 'https://www.homeinstead.com',
                'search_url': 'https://www.homeinstead.com/home-care-jobs/search/?q=Connecticut',
                'company': 'Home Instead'
            },
            'brightstar': {
                'base_url': 'https://careers.brightstarcare.com',
                'search_url': 'https://careers.brightstarcare.com/career-search/?q=&loc=Connecticut&radius=25&spage=1',
                'company': 'BrightStar Care'
            }
        }
        
        # Connecticut locations
        self.ct_keywords = [
            "Connecticut", "CT", "Hartford", "New Haven", "Stamford", 
            "Bridgeport", "Waterbury", "Norwalk", "Danbury", "New Britain",
            "West Haven", "Greenwich", "Bristol", "Meriden", "Middletown"
        ]

    def setup_driver(self):
        """Setup Chrome WebDriver with proper configuration."""
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless=new")
        
        # Anti-detection measures
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        # Performance optimizations
        chrome_options.add_argument("--disable-images")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--window-size=1920,1080")
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Execute script to remove webdriver property
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        # Set timeouts
        self.driver.set_page_load_timeout(30)
        self.driver.implicitly_wait(10)
        
        return self.driver

    def wait_for_page_load(self, timeout=15):
        """Wait for page to fully load."""
        try:
            WebDriverWait(self.driver, timeout).until(
                lambda driver: driver.execute_script("return document.readyState") == "complete"
            )
            time.sleep(random.uniform(2, 4))
        except TimeoutException:
            logger.warning("Page load timeout, continuing anyway")

    def scrape_home_instead_jobs(self, max_pages=3) -> List[Dict[str, Any]]:
        """Scrape jobs from Home Instead."""
        logger.info("🏠 Starting Home Instead scraping...")
        jobs = []
        
        try:
            self.driver.get(self.sites['home_instead']['search_url'])
            self.wait_for_page_load()
            
            page_count = 0
            while page_count < max_pages:
                logger.info(f"Scraping Home Instead page {page_count + 1}")
                
                # Look for job listings with various selectors
                job_selectors = [
                    '.job-item', '.job-listing', '.position', '.career-item',
                    '.listing', '.job-result', '[data-job-id]', '.job-card',
                    'a[href*="job"]', 'a[href*="position"]', 'a[href*="career"]'
                ]
                
                job_elements = []
                for selector in job_selectors:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            job_elements = elements
                            logger.info(f"Found {len(job_elements)} elements with: {selector}")
                            break
                    except:
                        continue
                
                if not job_elements:
                    logger.warning("No job elements found")
                    break
                
                # Process jobs
                for i, element in enumerate(job_elements[:10]):  # Limit to avoid overwhelming
                    try:
                        job_data = self.extract_job_data(element, 'home_instead')
                        if job_data and self._is_valid_ct_job(job_data):
                            jobs.append(job_data)
                            logger.info(f"   ✓ {job_data['title']} at {job_data['location']}")
                    except Exception as e:
                        logger.error(f"   ⚠️  Error processing job {i+1}: {e}")
                
                if not self._go_to_next_page():
                    break
                page_count += 1
                time.sleep(random.uniform(2, 4))
                
        except Exception as e:
            logger.error(f"Error scraping Home Instead: {e}")
        
        logger.info(f"🏠 Home Instead: Found {len(jobs)} jobs")
        return jobs

    def scrape_brightstar_jobs(self, max_pages=3) -> List[Dict[str, Any]]:
        """Scrape jobs from BrightStar Care."""
        logger.info("⭐ Starting BrightStar Care scraping...")
        jobs = []
        
        try:
            self.driver.get(self.sites['brightstar']['search_url'])
            self.wait_for_page_load()
            
            # Try to set location if needed
            try:
                location_input = self.driver.find_element(By.CSS_SELECTOR, 'input[name="loc"], input[placeholder*="location"]')
                if not location_input.get_attribute('value'):
                    location_input.clear()
                    location_input.send_keys("Connecticut")
                    time.sleep(1)
                    
                    search_button = self.driver.find_element(By.CSS_SELECTOR, 'button[type="submit"], .search-btn')
                    search_button.click()
                    self.wait_for_page_load()
            except:
                pass
            
            page_count = 0
            while page_count < max_pages:
                logger.info(f"Scraping BrightStar page {page_count + 1}")
                
                # Look for job listings
                job_selectors = [
                    '.job-item', '.job-listing', '.position-item', '.career-item',
                    '.listing', '.job-result', '.opportunity', '[data-job-id]',
                    '.job-card', 'a[href*="job"]', 'a[href*="position"]'
                ]
                
                job_elements = []
                for selector in job_selectors:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            job_elements = elements
                            logger.info(f"Found {len(job_elements)} elements with: {selector}")
                            break
                    except:
                        continue
                
                if not job_elements:
                    logger.warning("No job elements found")
                    break
                
                # Process jobs
                for i, element in enumerate(job_elements[:10]):
                    try:
                        job_data = self.extract_job_data(element, 'brightstar')
                        if job_data and self._is_valid_ct_job(job_data):
                            jobs.append(job_data)
                            logger.info(f"   ✓ {job_data['title']} at {job_data['location']}")
                    except Exception as e:
                        logger.error(f"   ⚠️  Error processing job {i+1}: {e}")
                
                if not self._go_to_next_page():
                    break
                page_count += 1
                time.sleep(random.uniform(2, 4))
                
        except Exception as e:
            logger.error(f"Error scraping BrightStar: {e}")
        
        logger.info(f"⭐ BrightStar Care: Found {len(jobs)} jobs")
        return jobs

    def extract_job_data(self, job_element, site_type: str) -> Optional[Dict[str, Any]]:
        """Extract job data from job element based on site type."""
        try:
            job_data = {}
            
            # Get site config
            site_config = self.sites.get(site_type)
            if not site_config:
                return None
                
            # Extract title
            title_selectors = ['h3', 'h4', '.job-title', '.position-title', 'a[class*="title"]', '.title', 'a']
            title = self._extract_text_by_selectors(job_element, title_selectors)
            if not title:
                return None
            job_data['title'] = title
            
            # Extract URL
            url_selectors = ['a[href*="job"]', 'a[href*="position"]', 'a[href*="apply"]', 'a[href*="career"]', 'a']
            url = self._extract_url_by_selectors(job_element, url_selectors, site_config['base_url'])
            job_data['url'] = url or site_config['search_url']
            
            # Company
            job_data['company'] = site_config['company']
            
            # Extract location
            location_selectors = ['.location', '.job-location', '[class*="location"]', '.address']
            location = self._extract_text_by_selectors(job_element, location_selectors)
            if not location:
                # Try to find CT location in text
                text_content = job_element.text
                for keyword in self.ct_keywords[:5]:  # Check main CT keywords
                    if keyword in text_content:
                        location = f"{keyword}, CT"
                        break
                else:
                    location = "Connecticut"
            job_data['location'] = location
            
            # Extract description
            desc_selectors = ['.description', '.job-description', '.summary', '.excerpt', 'p']
            description = self._extract_text_by_selectors(job_element, desc_selectors)
            if not description:
                description = f"Healthcare position with {site_config['company']} in {location}."
            job_data['description'] = description
            
            # Determine job details based on title
            self._set_job_details(job_data, site_type)
            
            # Metadata
            job_data['source'] = f'{site_type}_scraper'
            job_data['scraped_date'] = datetime.now().isoformat()
            job_data['posted_date'] = datetime.now().strftime('%Y-%m-%d')
            job_data['quality_score'] = self._calculate_quality_score(job_data)
            
            return job_data
            
        except Exception as e:
            logger.error(f"Error extracting job data: {e}")
            return None

    def _extract_text_by_selectors(self, element, selectors: List[str]) -> Optional[str]:
        """Try multiple selectors to extract text."""
        for selector in selectors:
            try:
                elem = element.find_element(By.CSS_SELECTOR, selector)
                text = elem.text.strip()
                if text:
                    return text
            except:
                continue
        return None

    def _extract_url_by_selectors(self, element, selectors: List[str], base_url: str) -> Optional[str]:
        """Try multiple selectors to extract URL."""
        for selector in selectors:
            try:
                elem = element.find_element(By.CSS_SELECTOR, selector)
                url = elem.get_attribute('href')
                if url:
                    return url if url.startswith('http') else f"{base_url}{url}"
            except:
                continue
        return None

    def _set_job_details(self, job_data: Dict[str, Any], site_type: str):
        """Set job details based on title and site type."""
        title_lower = job_data['title'].lower()
        
        # Determine job type
        if any(keyword in title_lower for keyword in ['part', 'part-time', 'per diem']):
            job_data['job_type'] = 'part-time'
        elif any(keyword in title_lower for keyword in ['full', 'full-time']):
            job_data['job_type'] = 'full-time'
        else:
            job_data['job_type'] = 'part-time' if site_type == 'home_instead' else 'full-time'
        
        # Set category and salary based on job title
        if any(keyword in title_lower for keyword in ['rn', 'registered nurse']):
            job_data['category'] = 'nursing'
            job_data['salary_min'] = 65000
            job_data['salary_max'] = 85000
            job_data['requirements'] = "• Valid Connecticut RN license\n• BSN preferred\n• Previous nursing experience preferred\n• BLS certification required"
        elif any(keyword in title_lower for keyword in ['lpn', 'licensed practical']):
            job_data['category'] = 'nursing'
            job_data['salary_min'] = 45000
            job_data['salary_max'] = 60000
            job_data['requirements'] = "• Valid Connecticut LPN license\n• Previous nursing experience preferred\n• BLS certification required"
        elif any(keyword in title_lower for keyword in ['cna', 'certified nursing assistant']):
            job_data['category'] = 'nursing'
            job_data['salary_min'] = 35000
            job_data['salary_max'] = 45000
            job_data['requirements'] = "• Valid Connecticut CNA certification\n• Previous healthcare experience preferred\n• Background check required"
        elif any(keyword in title_lower for keyword in ['therapist', 'pt', 'ot', 'physical', 'occupational']):
            job_data['category'] = 'therapy'
            job_data['salary_min'] = 70000
            job_data['salary_max'] = 95000
            job_data['requirements'] = "• Valid Connecticut therapy license\n• Previous therapy experience required\n• CPR certification required"
        else:  # Caregiver, aide, companion
            job_data['category'] = 'home-care'
            job_data['salary_min'] = 30000
            job_data['salary_max'] = 42000
            job_data['requirements'] = "• High school diploma or equivalent\n• Compassionate personality\n• Reliable transportation\n• Background check required"
        
        # Benefits
        if site_type == 'home_instead':
            job_data['benefits'] = "Flexible Scheduling, Paid Training, Competitive Pay, Mileage Reimbursement, Weekly Pay"
        else:  # BrightStar
            job_data['benefits'] = "Health Insurance, Dental, Vision, 401k, Paid Time Off, Flexible Scheduling, Competitive Pay"

    def _calculate_quality_score(self, job_data: Dict[str, Any]) -> int:
        """Calculate quality score for the job listing."""
        score = 60  # Base score
        
        if job_data.get('title'): score += 10
        if job_data.get('description') and len(job_data['description']) > 50: score += 15
        if job_data.get('location') and any(ct in job_data['location'] for ct in self.ct_keywords): score += 10
        if job_data.get('url'): score += 5
        
        return min(score, 100)

    def _is_valid_ct_job(self, job_data: Dict[str, Any]) -> bool:
        """Check if job is valid and in Connecticut."""
        location = job_data.get('location', '').lower()
        title = job_data.get('title', '').lower()
        
        # Check location
        ct_indicators = ['connecticut', 'ct', 'hartford', 'new haven', 'stamford', 'bridgeport']
        location_valid = any(indicator in location for indicator in ct_indicators)
        
        # Check title
        title_valid = len(title) > 3 and not any(skip in title for skip in ['test', 'sample', 'example'])
        
        return location_valid and title_valid

    def _go_to_next_page(self) -> bool:
        """Navigate to next page if available."""
        try:
            next_selectors = [
                'a[aria-label*="Next"]', 'a[title*="Next"]', '.next',
                '.pagination-next', '[class*="next"]', 'button:contains("Next")'
            ]
            
            for selector in next_selectors:
                try:
                    next_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if next_button.is_enabled() and next_button.is_displayed():
                        self.driver.execute_script("arguments[0].click();", next_button)
                        self.wait_for_page_load()
                        return True
                except:
                    continue
            return False
        except:
            return False

    def scrape_all_sites(self, max_pages_per_site=3) -> List[Dict[str, Any]]:
        """Scrape jobs from all configured sites."""
        logger.info("🚀 Starting Connecticut Home Care Job Scraping...")
        
        if not self.driver:
            self.setup_driver()
        
        all_jobs = []
        
        try:
            # Scrape Home Instead
            home_instead_jobs = self.scrape_home_instead_jobs(max_pages_per_site)
            all_jobs.extend(home_instead_jobs)
            
            # Wait between sites
            time.sleep(random.uniform(5, 8))
            
            # Scrape BrightStar Care
            brightstar_jobs = self.scrape_brightstar_jobs(max_pages_per_site)
            all_jobs.extend(brightstar_jobs)
            
        except Exception as e:
            logger.error(f"Error during scraping: {e}")
        
        finally:
            if self.driver:
                self.driver.quit()
        
        # Remove duplicates based on title and company
        unique_jobs = self._remove_duplicates(all_jobs)
        
        logger.info(f"🎉 Scraping completed! Total unique jobs: {len(unique_jobs)}")
        return unique_jobs

    def _remove_duplicates(self, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate jobs based on title and company."""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            key = (job.get('title', '').lower().strip(), job.get('company', '').lower().strip())
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
        
        logger.info(f"Removed {len(jobs) - len(unique_jobs)} duplicates")
        return unique_jobs

    def save_results(self, jobs: List[Dict[str, Any]], format_type='both'):
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

def main():
    """Main execution function."""
    scraper = CTHomeCareJobScraper(headless=True)
    
    try:
        jobs = scraper.scrape_all_sites(max_pages_per_site=3)
        
        if jobs:
            scraper.save_results(jobs, format_type='both')
            
            # Print summary
            print(f"\n{'='*60}")
            print(f"CONNECTICUT HOME CARE JOBS SCRAPING SUMMARY")
            print(f"{'='*60}")
            print(f"Total Jobs Found: {len(jobs)}")
            
            # Group by company
            companies = {}
            for job in jobs:
                company = job.get('company', 'Unknown')
                companies[company] = companies.get(company, 0) + 1
            
            print(f"\nJobs by Company:")
            for company, count in companies.items():
                print(f"  {company}: {count} jobs")
            
            # Group by category
            categories = {}
            for job in jobs:
                category = job.get('category', 'other')
                categories[category] = categories.get(category, 0) + 1
            
            print(f"\nJobs by Category:")
            for category, count in categories.items():
                print(f"  {category.title()}: {count} jobs")
            
            print(f"\nAverage Quality Score: {sum(job['quality_score'] for job in jobs) / len(jobs):.1f}")
            
            # Show sample jobs
            print(f"\nSample Jobs:")
            for i, job in enumerate(jobs[:5]):
                print(f"  {i+1}. {job['title']} - {job['company']} ({job['location']})")
                
        else:
            print("❌ No jobs found")
            return 1
            
    except Exception as e:
        logger.error(f"Error in main execution: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 