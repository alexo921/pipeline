#!/usr/bin/env python3
"""
Enhanced Connecticut Home Care Job Scraper
Designed to extract hundreds of jobs from Home Instead and BrightStar Care
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

class EnhancedCTJobScraper:
    """Enhanced scraper for Connecticut home care jobs."""
    
    def __init__(self, headless=True):
        self.headless = headless
        self.driver = None
        self.session = requests.Session()
        
        # Connecticut locations to search
        self.ct_locations = [
            "Connecticut", "Hartford CT", "New Haven CT", "Stamford CT", 
            "Bridgeport CT", "Waterbury CT", "Norwalk CT", "Danbury CT",
            "New Britain CT", "West Haven CT", "Greenwich CT", "Bristol CT",
            "Meriden CT", "Middletown CT", "New London CT", "Torrington CT"
        ]
        
        # Multiple search strategies for Home Instead
        self.home_instead_urls = [
            "https://www.homeinstead.com/home-care-jobs/search/?q=Connecticut",
            "https://www.homeinstead.com/home-care-jobs/search/?q=Hartford",
            "https://www.homeinstead.com/home-care-jobs/search/?q=New%20Haven",
            "https://www.homeinstead.com/home-care-jobs/search/?q=Stamford",
            "https://www.homeinstead.com/home-care-jobs/search/?q=Bridgeport",
            "https://www.homeinstead.com/home-care-jobs/search/?q=caregiver%20Connecticut",
            "https://careers.homeinstead.com/search/?createNewAlert=false&q=Connecticut",
            "https://careers.homeinstead.com/search/?createNewAlert=false&q=Hartford",
        ]
        
        # Multiple search strategies for BrightStar Care
        self.brightstar_urls = [
            "https://careers.brightstarcare.com/career-search/?q=&loc=Connecticut&radius=50",
            "https://careers.brightstarcare.com/career-search/?q=caregiver&loc=Connecticut&radius=50",
            "https://careers.brightstarcare.com/career-search/?q=nurse&loc=Connecticut&radius=50",
            "https://careers.brightstarcare.com/career-search/?q=aide&loc=Connecticut&radius=50",
            "https://careers.brightstarcare.com/career-search/?q=&loc=Hartford%2C%20CT&radius=25",
            "https://careers.brightstarcare.com/career-search/?q=&loc=New%20Haven%2C%20CT&radius=25",
            "https://careers.brightstarcare.com/career-search/?q=&loc=Stamford%2C%20CT&radius=25",
            "https://careers.brightstarcare.com/career-search/?q=&loc=Bridgeport%2C%20CT&radius=25",
        ]

    def setup_driver(self):
        """Setup Chrome WebDriver with enhanced options."""
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless=new")
        
        # Enhanced anti-detection
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Realistic user agent
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebDriver/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        # Performance and memory optimizations
        chrome_options.add_argument("--disable-images")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-logging")
        chrome_options.add_argument("--disable-gpu-logging")
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Execute script to remove webdriver property
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        # Set timeouts
        self.driver.set_page_load_timeout(30)
        self.driver.implicitly_wait(5)
        
        return self.driver

    def scrape_home_instead_comprehensive(self) -> List[Dict[str, Any]]:
        """Comprehensive Home Instead scraping using multiple strategies."""
        logger.info("🏠 Starting comprehensive Home Instead scraping...")
        all_jobs = []
        
        self.driver = self.setup_driver()
        
        try:
            for i, url in enumerate(self.home_instead_urls):
                logger.info(f"📍 Scraping Home Instead URL {i+1}/{len(self.home_instead_urls)}: {url}")
                
                try:
                    jobs = self._scrape_single_home_instead_url(url)
                    all_jobs.extend(jobs)
                    logger.info(f"   ✓ Found {len(jobs)} jobs from this URL")
                    
                    # Random delay between URLs
                    time.sleep(random.uniform(2, 5))
                    
                except Exception as e:
                    logger.error(f"   ❌ Error scraping {url}: {e}")
                    continue
                    
        finally:
            if self.driver:
                self.driver.quit()
        
        # Remove duplicates
        unique_jobs = self._remove_duplicates(all_jobs)
        logger.info(f"🏠 Home Instead total: {len(unique_jobs)} unique jobs")
        return unique_jobs

    def _scrape_single_home_instead_url(self, url: str) -> List[Dict[str, Any]]:
        """Scrape a single Home Instead URL with pagination."""
        jobs = []
        
        try:
            self.driver.get(url)
            time.sleep(random.uniform(3, 6))
            
            # Try multiple approaches to find jobs
            job_elements = self._find_job_elements_home_instead()
            
            if job_elements:
                logger.info(f"      Found {len(job_elements)} job elements")
                
                for element in job_elements:
                    try:
                        job_data = self._extract_home_instead_job(element)
                        if job_data and self._is_valid_ct_job(job_data):
                            jobs.append(job_data)
                    except Exception as e:
                        logger.debug(f"      Error extracting job: {e}")
                        continue
            
            # Try to find and click "Load More" or pagination
            self._load_more_home_instead_jobs()
            
            # Get any additional jobs after loading more
            additional_elements = self._find_job_elements_home_instead()
            if len(additional_elements) > len(job_elements):
                logger.info(f"      Found {len(additional_elements) - len(job_elements)} additional jobs")
                
                for element in additional_elements[len(job_elements):]:
                    try:
                        job_data = self._extract_home_instead_job(element)
                        if job_data and self._is_valid_ct_job(job_data):
                            jobs.append(job_data)
                    except Exception as e:
                        continue
            
        except Exception as e:
            logger.error(f"Error scraping Home Instead URL {url}: {e}")
        
        return jobs

    def _find_job_elements_home_instead(self) -> List:
        """Find job elements using multiple selectors for Home Instead."""
        selectors = [
            '.job-item', '.job-listing', '.position', '.career-item',
            '.listing', '.job-result', '[data-job-id]', '.job-card',
            'a[href*="job"]', 'a[href*="position"]', 'a[href*="career"]',
            '.search-result-item', '.job-posting', '.opportunity',
            'div[class*="job"]', 'div[class*="position"]', 'div[class*="career"]',
            '.posting', '.vacancy', '.opening', '[data-testid*="job"]'
        ]
        
        for selector in selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    logger.debug(f"      Found elements with selector: {selector}")
                    return elements
            except:
                continue
        
        return []

    def _load_more_home_instead_jobs(self):
        """Try to load more jobs by clicking load more buttons or pagination."""
        load_more_selectors = [
            'button:contains("Load More")', 'button:contains("Show More")',
            '.load-more', '.show-more', '.pagination-next', '.next',
            'a:contains("Next")', 'button:contains("Next")',
            '[data-testid*="load"]', '[data-testid*="more"]'
        ]
        
        for selector in load_more_selectors:
            try:
                element = self.driver.find_element(By.CSS_SELECTOR, selector)
                if element.is_displayed() and element.is_enabled():
                    self.driver.execute_script("arguments[0].click();", element)
                    time.sleep(random.uniform(2, 4))
                    logger.debug(f"      Clicked load more button: {selector}")
                    break
            except:
                continue

    def scrape_brightstar_comprehensive(self) -> List[Dict[str, Any]]:
        """Comprehensive BrightStar Care scraping using multiple strategies."""
        logger.info("⭐ Starting comprehensive BrightStar Care scraping...")
        all_jobs = []
        
        self.driver = self.setup_driver()
        
        try:
            for i, url in enumerate(self.brightstar_urls):
                logger.info(f"📍 Scraping BrightStar URL {i+1}/{len(self.brightstar_urls)}: {url}")
                
                try:
                    jobs = self._scrape_single_brightstar_url(url)
                    all_jobs.extend(jobs)
                    logger.info(f"   ✓ Found {len(jobs)} jobs from this URL")
                    
                    # Random delay between URLs
                    time.sleep(random.uniform(2, 5))
                    
                except Exception as e:
                    logger.error(f"   ❌ Error scraping {url}: {e}")
                    continue
                    
        finally:
            if self.driver:
                self.driver.quit()
        
        # Remove duplicates
        unique_jobs = self._remove_duplicates(all_jobs)
        logger.info(f"⭐ BrightStar Care total: {len(unique_jobs)} unique jobs")
        return unique_jobs

    def _scrape_single_brightstar_url(self, url: str) -> List[Dict[str, Any]]:
        """Scrape a single BrightStar URL with comprehensive pagination."""
        jobs = []
        page = 1
        max_pages = 20  # Increased page limit
        
        try:
            while page <= max_pages:
                # Add page parameter to URL
                paginated_url = f"{url}&spage={page}"
                logger.debug(f"      Scraping page {page}: {paginated_url}")
                
                self.driver.get(paginated_url)
                time.sleep(random.uniform(3, 6))
                
                # Find job elements
                job_elements = self._find_job_elements_brightstar()
                
                if not job_elements:
                    logger.debug(f"      No jobs found on page {page}, stopping pagination")
                    break
                
                logger.debug(f"      Found {len(job_elements)} job elements on page {page}")
                
                page_jobs = []
                for element in job_elements:
                    try:
                        job_data = self._extract_brightstar_job(element)
                        if job_data and self._is_valid_ct_job(job_data):
                            page_jobs.append(job_data)
                    except Exception as e:
                        logger.debug(f"      Error extracting job: {e}")
                        continue
                
                if not page_jobs:
                    logger.debug(f"      No valid jobs extracted from page {page}, stopping")
                    break
                
                jobs.extend(page_jobs)
                logger.debug(f"      Extracted {len(page_jobs)} valid jobs from page {page}")
                
                page += 1
                
        except Exception as e:
            logger.error(f"Error scraping BrightStar URL {url}: {e}")
        
        return jobs

    def _find_job_elements_brightstar(self) -> List:
        """Find job elements using multiple selectors for BrightStar Care."""
        selectors = [
            '.job-item', '.job-listing', '.position-item', '.career-item',
            '.listing', '.job-result', '.opportunity', '[data-job-id]',
            '.job-card', 'a[href*="job"]', 'a[href*="position"]',
            '.search-result', '.job-posting', '.career-opportunity',
            'div[class*="job"]', 'div[class*="position"]', 'div[class*="career"]',
            '.posting', '.vacancy', '.opening', '[data-testid*="job"]',
            'tr[class*="job"]', 'li[class*="job"]'
        ]
        
        for selector in selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    logger.debug(f"      Found elements with selector: {selector}")
                    return elements
            except:
                continue
        
        return []

    def _extract_home_instead_job(self, element) -> Optional[Dict[str, Any]]:
        """Extract job data from Home Instead element."""
        try:
            job_data = {}
            
            # Extract title
            title = self._extract_text_from_element(element, [
                'h1', 'h2', 'h3', 'h4', '.job-title', '.position-title', 
                '.title', 'a', '.name', '.job-name'
            ])
            
            if not title or len(title.strip()) < 3:
                return None
            
            job_data['title'] = title.strip()
            
            # Extract URL
            url = self._extract_url_from_element(element, [
                'a[href*="job"]', 'a[href*="position"]', 'a[href*="apply"]', 'a'
            ])
            job_data['url'] = url or "https://www.homeinstead.com/home-care-jobs/"
            
            # Extract location
            location = self._extract_text_from_element(element, [
                '.location', '.job-location', '.address', '.city', '.state'
            ])
            job_data['location'] = self._normalize_location(location) or "Connecticut"
            
            # Extract description
            description = self._extract_text_from_element(element, [
                '.description', '.job-description', '.summary', '.excerpt', 'p'
            ])
            job_data['description'] = description or f"Home care position with Home Instead in {job_data['location']}."
            
            # Set standard fields
            job_data['company'] = 'Home Instead'
            job_data['source'] = 'enhanced_ct_scraper'
            job_data['scraped_date'] = datetime.now().isoformat()
            job_data['posted_date'] = datetime.now().strftime('%Y-%m-%d')
            
            # Classify job
            self._classify_job(job_data, 'home_instead')
            
            return job_data
            
        except Exception as e:
            logger.debug(f"Error extracting Home Instead job: {e}")
            return None

    def _extract_brightstar_job(self, element) -> Optional[Dict[str, Any]]:
        """Extract job data from BrightStar Care element."""
        try:
            job_data = {}
            
            # Extract title
            title = self._extract_text_from_element(element, [
                'h1', 'h2', 'h3', 'h4', '.job-title', '.position-title', 
                '.title', 'a', '.name', '.job-name', 'td'
            ])
            
            if not title or len(title.strip()) < 3:
                return None
            
            job_data['title'] = title.strip()
            
            # Extract URL
            url = self._extract_url_from_element(element, [
                'a[href*="job"]', 'a[href*="position"]', 'a[href*="apply"]', 'a'
            ], "https://careers.brightstarcare.com")
            job_data['url'] = url or "https://careers.brightstarcare.com"
            
            # Extract location
            location = self._extract_text_from_element(element, [
                '.location', '.job-location', '.address', '.city', '.state'
            ])
            job_data['location'] = self._normalize_location(location) or "Connecticut"
            
            # Extract description
            description = self._extract_text_from_element(element, [
                '.description', '.job-description', '.summary', '.excerpt', 'p'
            ])
            job_data['description'] = description or f"Healthcare position with BrightStar Care in {job_data['location']}."
            
            # Set standard fields
            job_data['company'] = 'BrightStar Care'
            job_data['source'] = 'enhanced_ct_scraper'
            job_data['scraped_date'] = datetime.now().isoformat()
            job_data['posted_date'] = datetime.now().strftime('%Y-%m-%d')
            
            # Classify job
            self._classify_job(job_data, 'brightstar')
            
            return job_data
            
        except Exception as e:
            logger.debug(f"Error extracting BrightStar job: {e}")
            return None

    def _extract_text_from_element(self, element, selectors: List[str]) -> Optional[str]:
        """Extract text using multiple selector strategies."""
        for selector in selectors:
            try:
                elem = element.find_element(By.CSS_SELECTOR, selector)
                text = elem.text.strip()
                if text and len(text) > 2:
                    return text
            except:
                continue
        
        # Fallback to element text
        try:
            text = element.text.strip()
            return text if text and len(text) > 2 else None
        except:
            return None

    def _extract_url_from_element(self, element, selectors: List[str], base_url: str = "") -> Optional[str]:
        """Extract URL using multiple selector strategies."""
        for selector in selectors:
            try:
                elem = element.find_element(By.CSS_SELECTOR, selector)
                href = elem.get_attribute('href')
                if href:
                    if href.startswith('http'):
                        return href
                    elif base_url:
                        return f"{base_url}{href}"
                    return href
            except:
                continue
        
        # Fallback to element href
        try:
            href = element.get_attribute('href')
            if href and href.startswith('http'):
                return href
        except:
            pass
        
        return None

    def _normalize_location(self, location: Optional[str]) -> Optional[str]:
        """Normalize location to Connecticut format."""
        if not location:
            return None
        
        location = location.strip()
        
        # If already contains CT, return as is
        if any(ct in location.lower() for ct in ['connecticut', ', ct']):
            return location
        
        # Check if it's a known CT city
        ct_cities = [
            'hartford', 'new haven', 'stamford', 'bridgeport', 'waterbury', 
            'norwalk', 'danbury', 'new britain', 'west haven', 'greenwich'
        ]
        
        for city in ct_cities:
            if city in location.lower():
                return f"{location}, CT"
        
        return location

    def _classify_job(self, job_data: Dict[str, Any], company_type: str):
        """Classify job and set appropriate details."""
        title_lower = job_data['title'].lower()
        
        # Determine job type
        if any(keyword in title_lower for keyword in ['part', 'part-time', 'per diem']):
            job_data['job_type'] = 'part-time'
        elif any(keyword in title_lower for keyword in ['full', 'full-time']):
            job_data['job_type'] = 'full-time'
        else:
            job_data['job_type'] = 'part-time' if company_type == 'home_instead' else 'full-time'
        
        # Classify by job title
        if any(keyword in title_lower for keyword in ['rn', 'registered nurse']):
            job_data['category'] = 'nursing'
            job_data['salary_min'] = 65000
            job_data['salary_max'] = 85000
            job_data['requirements'] = "• Valid Connecticut RN license\n• BSN preferred\n• Previous nursing experience\n• BLS certification required"
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
            job_data['requirements'] = "• Valid Connecticut therapy license\n• Masters degree required\n• Previous therapy experience"
        else:
            job_data['category'] = 'home-care'
            job_data['salary_min'] = 32000
            job_data['salary_max'] = 42000
            job_data['requirements'] = "• High school diploma or equivalent\n• Compassionate personality\n• Reliable transportation\n• Background check required"
        
        # Set benefits
        if company_type == 'brightstar':
            job_data['benefits'] = "Health Insurance, Dental, Vision, 401k, Paid Time Off, Flexible Scheduling"
        else:
            job_data['benefits'] = "Flexible Scheduling, Paid Training, Competitive Pay, Mileage Reimbursement"
        
        # Calculate quality score
        job_data['quality_score'] = self._calculate_quality_score(job_data)

    def _calculate_quality_score(self, job_data: Dict[str, Any]) -> int:
        """Calculate quality score for job listing."""
        score = 50
        
        if job_data.get('title') and len(job_data['title']) > 5: score += 15
        if job_data.get('description') and len(job_data['description']) > 50: score += 15
        if job_data.get('location') and any(ct in job_data['location'].lower() for ct in ['connecticut', 'ct']): score += 10
        if job_data.get('url') and 'job' in job_data['url']: score += 10
        
        return min(score, 100)

    def _is_valid_ct_job(self, job_data: Dict[str, Any]) -> bool:
        """Check if job is valid Connecticut job."""
        if not job_data.get('title') or len(job_data['title']) < 3:
            return False
        
        title_lower = job_data['title'].lower()
        if any(spam in title_lower for spam in ['test', 'sample', 'example', 'lorem']):
            return False
        
        # Must be related to care/health
        care_keywords = ['care', 'nurse', 'aide', 'assistant', 'companion', 'health', 'therapist']
        if not any(keyword in title_lower for keyword in care_keywords):
            return False
        
        return True

    def _remove_duplicates(self, jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate jobs based on title and URL."""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            # Create unique key from title and URL
            key = (
                job.get('title', '').lower().strip(),
                job.get('url', '').lower().strip(),
                job.get('company', '').lower().strip()
            )
            
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
        
        return unique_jobs

    def scrape_all_comprehensive(self) -> List[Dict[str, Any]]:
        """Scrape all jobs from both companies comprehensively."""
        logger.info("🚀 Starting comprehensive Connecticut job scraping...")
        
        all_jobs = []
        
        # Scrape Home Instead
        home_instead_jobs = self.scrape_home_instead_comprehensive()
        all_jobs.extend(home_instead_jobs)
        
        # Wait between companies
        time.sleep(random.uniform(3, 7))
        
        # Scrape BrightStar Care
        brightstar_jobs = self.scrape_brightstar_comprehensive()
        all_jobs.extend(brightstar_jobs)
        
        # Final deduplication
        unique_jobs = self._remove_duplicates(all_jobs)
        
        logger.info(f"🎉 FINAL RESULTS:")
        logger.info(f"   Home Instead: {len(home_instead_jobs)} jobs")
        logger.info(f"   BrightStar Care: {len(brightstar_jobs)} jobs")
        logger.info(f"   Total Unique: {len(unique_jobs)} jobs")
        
        return unique_jobs

    def save_results(self, jobs: List[Dict[str, Any]], filename_prefix='enhanced_ct_jobs'):
        """Save results to JSON and CSV files."""
        if not jobs:
            logger.warning("No jobs to save")
            return
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save JSON
        json_filename = f"{filename_prefix}_{len(jobs)}_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(jobs, f, indent=2, ensure_ascii=False)
        logger.info(f"💾 Saved {len(jobs)} jobs to {json_filename}")
        
        # Save CSV
        csv_filename = f"{filename_prefix}_{len(jobs)}_{timestamp}.csv"
        if jobs:
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=jobs[0].keys())
                writer.writeheader()
                writer.writerows(jobs)
            logger.info(f"💾 Saved {len(jobs)} jobs to {csv_filename}")

def main():
    """Main execution function."""
    scraper = EnhancedCTJobScraper(headless=True)
    
    try:
        jobs = scraper.scrape_all_comprehensive()
        
        if jobs:
            scraper.save_results(jobs)
            
            # Print summary
            print(f"\n{'='*60}")
            print(f"ENHANCED CONNECTICUT HOME CARE JOBS SUMMARY")
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
            
            print(f"\n⭐ Average Quality Score: {sum(job['quality_score'] for job in jobs) / len(jobs):.1f}")
            
            # Show sample jobs
            print(f"\n🎯 Sample Jobs:")
            for i, job in enumerate(jobs[:5]):
                print(f"  {i+1}. {job['title']} - {job['company']}")
                print(f"     📍 {job['location']} | 💼 {job['job_type']} | 💰 ${job['salary_min']:,}-${job['salary_max']:,}")
                print(f"     🔗 {job['url'][:80]}...")
                print()
                
        else:
            print("❌ No jobs found")
            return 1
            
    except Exception as e:
        logger.error(f"Error in main execution: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 