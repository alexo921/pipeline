#!/usr/bin/env python3
"""
Enhanced Comprehensive Healthcare Job Scraper
==============================================

This scraper handles all 194+ healthcare job sites with platform-specific
extraction logic for maximum job discovery across different ATS systems.

Supported Platforms:
- iCIMS, ADP, Workday, UltiPro, OnShift, Apploi, Hireology
- IntelyCare, Home Instead, SmartRecruiters
- Custom career pages and proprietary systems
"""

import csv
import json
import time
import random
import re
import logging
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin, urlparse, parse_qs

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedHealthcareScraper:
    
    def __init__(self, headless: bool = True, debug: bool = False):
        self.headless = headless
        self.debug = debug
        self.driver = None
        self.wait = None
        self.jobs = []
        self.site_configs = self._load_site_configs()
        
        # Platform-specific selectors and patterns
        self.platform_configs = {
            'icims': {
                'job_container': '.iCIMS_JobsTable tr, .jobs-list-item, .job-item, .row',
                'job_title': '.iCIMS_InfoField_Job, .job-title, h3 a, .title a, td a',
                'job_location': '.iCIMS_InfoField_Location, .job-location, .location',
                'next_button': '.iCIMS_Paginator_Next, .pagination-next, [aria-label="Next"]',
                'pagination_info': '.iCIMS_Paginator_Summary, .pagination-info'
            },
            'adp': {
                'job_container': '.job-result, .job-item, [data-automation-id="jobPostingItem"], .position-card',
                'job_title': '.job-title, [data-automation-id="jobPostingTitle"] a, .position-title a',
                'job_location': '.job-location, [data-automation-id="jobPostingLocation"], .location',
                'next_button': '[aria-label="Next"], .paging-next, .pagination-next, .next-page',
                'pagination_info': '.paging-info, .pagination-summary'
            },
            'workday': {
                'job_container': '[data-automation-id="jobPostingItem"], .job-posting, .position',
                'job_title': '[data-automation-id="jobPostingTitle"] a, .job-title a, .position-title',
                'job_location': '[data-automation-id="jobPostingLocation"], .job-location, .location',
                'next_button': '[data-automation-id="paginationNext"], .pagination-next',
                'pagination_info': '[data-automation-id="paginationSummary"]'
            },
            'ultipro': {
                'job_container': '.job-item, .job-posting, .position, .opportunity',
                'job_title': '.job-title a, .position-title a, h3 a, .opportunity-title',
                'job_location': '.job-location, .location, .job-info .location, .opportunity-location',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info'
            },
            'onshift': {
                'job_container': '.job-posting, .job-item, .position-card, .job-position',
                'job_title': '.job-title, .position-title, h3, .job-position-title',
                'job_location': '.location, .job-location, .position-location, .facility-name',
                'next_button': '.pagination-next, .next-page, [aria-label="Next"]',
                'pagination_info': '.pagination-summary'
            },
            'apploi': {
                'job_container': '.job-card, .job-item, .position, .job-listing',
                'job_title': '.job-title, .position-title, h3, .job-name',
                'job_location': '.location, .job-location, .job-address',
                'next_button': '.pagination-next, [aria-label="Next"], .load-more',
                'pagination_info': '.pagination-info'
            },
            'hireology': {
                'job_container': '.job-posting, .job-item, .position, .opening',
                'job_title': '.job-title a, .position-title a, .opening-title a',
                'job_location': '.location, .job-location, .opening-location',
                'next_button': '.pagination-next, .next, [aria-label="Next"]',
                'pagination_info': '.pagination-summary'
            },
            'smartrecruiters': {
                'job_container': '.opening-job, .job-item, .position, .job-link',
                'job_title': '.job-title a, .opening-job-title a, .position-title',
                'job_location': '.job-location, .opening-job-location, .location',
                'next_button': '.pagination-next, [aria-label="Next"], .load-more',
                'pagination_info': '.pagination-widget'
            },
            'intelycare': {
                'job_container': '.job-card, .job-listing, .position, .job-item',
                'job_title': '.job-title, .position-title, .job-name',
                'job_location': '.location, .job-location, .job-address',
                'next_button': '.pagination-next, .load-more, [aria-label="Next"]',
                'pagination_info': '.pagination-info'
            },
            'homeinstead': {
                'job_container': '.job-card, .job-item, .position, .job-listing',
                'job_title': '.job-title, .position-title, .job-name, h3',
                'job_location': '.location, .job-location, .job-address, .city-state',
                'next_button': '.pagination-next, .load-more, [aria-label="Next"]',
                'pagination_info': '.pagination-info'
            },
            'custom': {
                'job_container': '.job, .job-item, .job-listing, .job-card, .position, .career, .opening, .vacancy, .role, .post, .listing, .opportunity, .employment, .job-row, tr',
                'job_title': '.job-title, .position-title, .title, .job-name, .role-title, h1, h2, h3, h4, h5, a[href*="job"], a[href*="career"], a[href*="position"], .career-title',
                'job_location': '.location, .job-location, .position-location, .city, .state, .address, .geo, .job-city, .job-state',
                'next_button': '.next, .pagination-next, .load-more, [aria-label="Next"], .page-next, .btn-next, .more-jobs, .next-page, .pager-next',
                'pagination_info': '.pagination, .page-info, .results-info, .pager-info'
            }
        }
    
    def _load_site_configs(self) -> List[Dict]:
        """Load site configurations from CSV."""
        configs = []
        try:
            with open('Job Board Data Scrape.csv', 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get('search_url') and row.get('source_site'):
                        configs.append({
                            'source_site': row['source_site'],
                            'search_url': row['search_url']
                        })
        except Exception as e:
            logger.error(f"Error loading site configs: {e}")
        
        logger.info(f"Loaded {len(configs)} site configurations")
        return configs
    
    def _setup_driver(self):
        """Setup Chrome WebDriver with optimized settings."""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless=new")
        
        # Performance and stealth optimizations
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.wait = WebDriverWait(self.driver, 20)
    
    def _detect_platform(self, url: str) -> str:
        """Detect the platform/ATS system from URL."""
        url_lower = url.lower()
        
        if 'icims.com' in url_lower:
            return 'icims'
        elif any(x in url_lower for x in ['adp.com', 'workforcenow.adp']):
            return 'adp'
        elif 'workday' in url_lower:
            return 'workday'
        elif 'ultipro.com' in url_lower:
            return 'ultipro'
        elif 'onshift.com' in url_lower:
            return 'onshift'
        elif 'apploi.com' in url_lower:
            return 'apploi'
        elif 'hireology.com' in url_lower:
            return 'hireology'
        elif 'smartrecruiters.com' in url_lower:
            return 'smartrecruiters'
        elif 'intelycare.com' in url_lower:
            return 'intelycare'
        elif 'homeinstead.com' in url_lower:
            return 'homeinstead'
        else:
            return 'custom'
    
    def _extract_jobs_from_page(self, platform: str, config: Dict) -> List[Dict]:
        """Extract jobs from current page based on platform."""
        jobs = []
        platform_config = self.platform_configs.get(platform, self.platform_configs['custom'])
        
        if not self.driver:
            return jobs
        
        # Find job containers
        job_containers = []
        for selector in platform_config['job_container'].split(', '):
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    # Filter for healthcare-related jobs
                    healthcare_elements = []
                    for elem in elements:
                        elem_text = elem.text.lower()
                        healthcare_keywords = ['nurse', 'nursing', 'care', 'aide', 'assistant', 'therapist', 
                                             'coordinator', 'caregiver', 'cna', 'rn', 'lpn', 'medical',
                                             'healthcare', 'health care', 'patient', 'clinical', 'rehab',
                                             'therapy', 'social worker', 'director', 'manager']
                        if any(keyword in elem_text for keyword in healthcare_keywords) or len(elem_text) < 50:
                            healthcare_elements.append(elem)
                    
                    if healthcare_elements:
                        job_containers = healthcare_elements
                        self._log(f"Found {len(healthcare_elements)} healthcare job containers with selector: {selector}")
                        break
            except Exception as e:
                self._log(f"Error with selector {selector}: {e}", "DEBUG")
                continue
        
        if not job_containers:
            self._log(f"No job containers found for {config['source_site']}")
            return jobs
        
        # Extract job data from each container
        for i, container in enumerate(job_containers[:100]):  # Increased limit per page
            try:
                job_data = self._extract_job_from_container(container, platform_config, config)
                if job_data:
                    jobs.append(job_data)
            except Exception as e:
                self._log(f"Error extracting job {i+1}: {e}", "DEBUG")
                continue
        
        return jobs
    
    def _extract_job_from_container(self, container, platform_config: Dict, config: Dict) -> Optional[Dict]:
        """Extract job data from a single container."""
        try:
            # Extract title
            title = ''
            for selector in platform_config['job_title'].split(', '):
                try:
                    title_elem = container.find_element(By.CSS_SELECTOR, selector)
                    title = title_elem.text.strip()
                    if title and len(title) > 3 and not title.lower().startswith(('view', 'apply', 'see')):
                        break
                except:
                    continue
            
            # Fallback: try to get title from any link or heading
            if not title:
                try:
                    for tag in ['a', 'h1', 'h2', 'h3', 'h4', 'h5']:
                        title_elem = container.find_element(By.TAG_NAME, tag)
                        title = title_elem.text.strip()
                        if title and len(title) > 3:
                            break
                except:
                    pass
            
            if not title:
                return None
            
            # Extract location
            location = ''
            for selector in platform_config['job_location'].split(', '):
                try:
                    location_elem = container.find_element(By.CSS_SELECTOR, selector)
                    location = location_elem.text.strip()
                    if location and len(location) > 1:
                        break
                except:
                    continue
            
            # Extract job URL
            job_url = ''
            try:
                link_elem = container.find_element(By.TAG_NAME, 'a')
                job_url = link_elem.get_attribute('href')
                if job_url and not job_url.startswith('http'):
                    job_url = urljoin(config['search_url'], job_url)
            except:
                pass
            
            # Parse location for city/state
            city, state = self._parse_location(location)
            
            # If no location found, try to extract from full container text
            if not city and not state:
                container_text = container.text
                city, state = self._parse_location(container_text)
            
            # Create job data
            job_data = {
                'id': f"{config['source_site']}_{abs(hash(job_url or title))}",
                'title': title,
                'company': config['source_site'],
                'location': location or f"{city}, {state}" if city and state else state if state else 'Location not specified',
                'city': city,
                'state': state,
                'url': job_url,
                'source': config['source_site'],
                'source_url': config['search_url'],
                'scraped_at': datetime.now().isoformat(),
                'description': container.text.strip()[:500] + '...' if len(container.text) > 500 else container.text.strip(),
                'platform': self._detect_platform(config['search_url'])
            }
            
            return job_data
            
        except Exception as e:
            self._log(f"Error extracting job from container: {e}", "DEBUG")
            return None
    
    def _parse_location(self, location_text: str) -> Tuple[str, str]:
        """Parse location text to extract city and state."""
        if not location_text:
            return '', ''
        
        # Enhanced patterns for location parsing
        patterns = [
            r'([^,\n]+),\s*([A-Z]{2})\b',  # City, ST
            r'([^,\n]+),\s*([A-Za-z\s]+)\s+([A-Z]{2})\b',  # City, State ST
            r'([^,\n]+),\s*([A-Za-z\s]+)$',  # City, State
            r'([A-Za-z\s]+)\s+([A-Z]{2})\s+\d{5}',  # City ST ZIP
            r'([A-Za-z\s]+),\s*(Connecticut|Massachusetts|CT|MA)\b',  # City, Connecticut/MA
        ]
        
        for pattern in patterns:
            match = re.search(pattern, location_text.strip(), re.IGNORECASE)
            if match:
                groups = match.groups()
                if len(groups) == 2:
                    city, state = groups
                    # Normalize state
                    if state.lower() in ['connecticut', 'massachusetts', 'rhode island', 'new york']:
                        state_map = {'connecticut': 'CT', 'massachusetts': 'MA', 'rhode island': 'RI', 'new york': 'NY'}
                        state = state_map.get(state.lower(), state)
                    return city.strip(), state.strip().upper()
                elif len(groups) == 3:
                    city, state_name, state_abbrev = groups
                    return city.strip(), state_abbrev.strip().upper()
        
        # Try to extract just state
        state_patterns = [
            r'\b(CT|MA|NY|RI|VT|NH|ME|AL|AK|AZ|AR|CA|CO|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|MD|MI|MN|MS|MO|MT|NE|NV|NJ|NM|NC|ND|OH|OK|OR|PA|SC|SD|TN|TX|UT|VA|WA|WV|WI|WY|DC)\b',
            r'\b(Connecticut|Massachusetts|Rhode Island|New York|Vermont|New Hampshire|Maine)\b'
        ]
        
        for pattern in state_patterns:
            match = re.search(pattern, location_text, re.IGNORECASE)
            if match:
                state = match.group(1)
                if state.lower() in ['connecticut', 'massachusetts', 'rhode island', 'new york', 'vermont', 'new hampshire', 'maine']:
                    state_map = {'connecticut': 'CT', 'massachusetts': 'MA', 'rhode island': 'RI', 
                               'new york': 'NY', 'vermont': 'VT', 'new hampshire': 'NH', 'maine': 'ME'}
                    state = state_map.get(state.lower(), state)
                return '', state.upper()
        
        return '', ''
    
    def _navigate_to_next_page(self, platform: str) -> bool:
        """Navigate to next page if available."""
        platform_config = self.platform_configs.get(platform, self.platform_configs['custom'])
        
        if not self.driver:
            return False
        
        # Try different next button selectors
        for selector in platform_config['next_button'].split(', '):
            try:
                next_buttons = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for next_button in next_buttons:
                    if next_button.is_enabled() and next_button.is_displayed():
                        # Check if button is not disabled
                        button_class = next_button.get_attribute('class') or ''
                        button_disabled = next_button.get_attribute('disabled')
                        
                        if 'disabled' not in button_class.lower() and not button_disabled:
                            try:
                                # Try regular click first
                                next_button.click()
                                time.sleep(random.uniform(3, 5))
                                return True
                            except:
                                # Try JavaScript click
                                self.driver.execute_script("arguments[0].click();", next_button)
                                time.sleep(random.uniform(3, 5))
                                return True
            except Exception as e:
                self._log(f"Error with next button selector {selector}: {e}", "DEBUG")
                continue
        
        # Try URL-based pagination patterns
        current_url = self.driver.current_url
        
        # Pattern 1: page parameter
        if 'page=' in current_url:
            page_match = re.search(r'page=(\d+)', current_url)
            if page_match:
                current_page = int(page_match.group(1))
                next_page_url = current_url.replace(f'page={current_page}', f'page={current_page + 1}')
                self.driver.get(next_page_url)
                time.sleep(random.uniform(3, 5))
                return True
        
        # Pattern 2: spage parameter (for some sites)
        if 'spage=' in current_url:
            page_match = re.search(r'spage=(\d+)', current_url)
            if page_match:
                current_page = int(page_match.group(1))
                next_page_url = current_url.replace(f'spage={current_page}', f'spage={current_page + 1}')
                self.driver.get(next_page_url)
                time.sleep(random.uniform(3, 5))
                return True
        
        # Pattern 3: offset parameter
        if 'offset=' in current_url:
            offset_match = re.search(r'offset=(\d+)', current_url)
            if offset_match:
                current_offset = int(offset_match.group(1))
                next_offset = current_offset + 25  # Common increment
                next_page_url = current_url.replace(f'offset={current_offset}', f'offset={next_offset}')
                self.driver.get(next_page_url)
                time.sleep(random.uniform(3, 5))
                return True
        
        return False
    
    def _scrape_site_with_pagination(self, config: Dict, max_pages: int = 30) -> List[Dict]:
        """Scrape a single site with pagination support."""
        all_jobs = []
        platform = self._detect_platform(config['search_url'])
        
        self._log(f"Scraping {config['source_site']} (Platform: {platform})")
        
        try:
            if not self.driver or not self.wait:
                return all_jobs
                
            self.driver.get(config['search_url'])
            time.sleep(random.uniform(4, 7))
            
            # Wait for page to load
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            page_count = 0
            consecutive_empty_pages = 0
            previous_job_count = 0
            
            while page_count < max_pages:
                page_count += 1
                self._log(f"  📄 Page {page_count} of {config['source_site']}")
                
                # Extract jobs from current page
                page_jobs = self._extract_jobs_from_page(platform, config)
                
                if page_jobs:
                    # Check for duplicate jobs (same page loaded)
                    new_jobs = []
                    for job in page_jobs:
                        job_id = job['id']
                        if not any(existing_job['id'] == job_id for existing_job in all_jobs):
                            new_jobs.append(job)
                    
                    if new_jobs:
                        all_jobs.extend(new_jobs)
                        consecutive_empty_pages = 0
                        self._log(f"    ✓ Found {len(new_jobs)} new jobs on page {page_count} (total: {len(all_jobs)})")
                    else:
                        consecutive_empty_pages += 1
                        self._log(f"    ⚠️ No new jobs on page {page_count} (duplicates)")
                else:
                    consecutive_empty_pages += 1
                    self._log(f"    ⚠️ No jobs found on page {page_count}")
                
                # Stop if we hit too many empty pages or no progress
                if consecutive_empty_pages >= 3:
                    self._log(f"    🛑 Stopping after {consecutive_empty_pages} consecutive empty pages")
                    break
                
                # Stop if job count hasn't changed (same page reloaded)
                if len(all_jobs) == previous_job_count and page_count > 1:
                    self._log(f"    🛑 No progress, stopping pagination")
                    break
                
                previous_job_count = len(all_jobs)
                
                # Try to navigate to next page
                if not self._navigate_to_next_page(platform):
                    self._log(f"    🏁 No more pages available")
                    break
                
                # Random delay between pages
                time.sleep(random.uniform(2, 4))
            
        except Exception as e:
            self._log(f"❌ Error scraping {config['source_site']}: {e}")
        
        self._log(f"✅ Completed {config['source_site']}: {len(all_jobs)} total jobs from {page_count} pages")
        return all_jobs
    
    def scrape_all_sites(self, max_sites: Optional[int] = None, max_pages_per_site: int = 30) -> List[Dict]:
        """Scrape all sites with enhanced pagination."""
        self._log(f"🚀 Starting Enhanced Healthcare Job Scraping")
        
        try:
            self._setup_driver()
            
            sites_to_process = self.site_configs[:max_sites] if max_sites else self.site_configs
            total_sites = len(sites_to_process)
            
            self._log(f"📋 Processing {total_sites} healthcare job sites with up to {max_pages_per_site} pages each")
            
            for i, config in enumerate(sites_to_process, 1):
                self._log(f"🏥 [{i}/{total_sites}] {config['source_site']}")
                
                try:
                    site_jobs = self._scrape_site_with_pagination(config, max_pages_per_site)
                    self.jobs.extend(site_jobs)
                    
                    # Progress update
                    total_jobs = len(self.jobs)
                    avg_per_site = total_jobs / i if i > 0 else 0
                    self._log(f"📊 Progress: {total_jobs} total jobs collected | Avg: {avg_per_site:.1f} jobs/site")
                    
                    # Delay between sites to be respectful
                    if i < total_sites:
                        delay = random.uniform(3, 6)
                        time.sleep(delay)
                        
                except Exception as e:
                    self._log(f"❌ Error processing {config['source_site']}: {e}")
                    continue
                    
        except Exception as e:
            self._log(f"💥 Critical error during scraping: {e}")
            
        finally:
            if self.driver:
                self.driver.quit()
        
        # Remove duplicates and finalize
        unique_jobs = self._remove_duplicates(self.jobs)
        self._log(f"🎉 Scraping completed! Found {len(unique_jobs)} unique jobs from {len(sites_to_process)} sites")
        
        return unique_jobs
    
    def _remove_duplicates(self, jobs: List[Dict]) -> List[Dict]:
        """Remove duplicate jobs."""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            # Create a unique identifier
            identifier = (job.get('title', '').lower().strip(), 
                         job.get('company', '').lower().strip(), 
                         job.get('location', '').lower().strip())
            if identifier not in seen and identifier[0]:  # Ensure title exists
                seen.add(identifier)
                unique_jobs.append(job)
        
        self._log(f"🔄 Removed {len(jobs) - len(unique_jobs)} duplicate jobs")
        return unique_jobs
    
    def save_jobs(self, filename_prefix: str = "enhanced_healthcare_jobs"):
        """Save jobs to JSON and CSV files."""
        if not self.jobs:
            self._log("No jobs to save")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save as JSON
        json_filename = f"{filename_prefix}_{len(self.jobs)}_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(self.jobs, f, indent=2, ensure_ascii=False)
        
        # Save as CSV
        csv_filename = f"{filename_prefix}_{len(self.jobs)}_{timestamp}.csv"
        if self.jobs:
            fieldnames = self.jobs[0].keys()
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(self.jobs)
        
        self._log(f"💾 Saved {len(self.jobs)} jobs to {json_filename} and {csv_filename}")
    
    def _log(self, message: str, level: str = "INFO"):
        """Log message with timestamp."""
        if level == "DEBUG" and not self.debug:
            return
        getattr(logger, level.lower())(message)

def main():
    """Main execution function."""
    print("🚀 Enhanced Comprehensive Healthcare Job Scraper")
    print("=" * 60)
    
    # Configuration
    MAX_SITES = None  # None for all sites
    MAX_PAGES_PER_SITE = 30  # Up to 30 pages per site
    HEADLESS = True
    DEBUG = False
    
    scraper = EnhancedHealthcareScraper(headless=HEADLESS, debug=DEBUG)
    
    # Run scraping
    jobs = scraper.scrape_all_sites(max_sites=MAX_SITES, max_pages_per_site=MAX_PAGES_PER_SITE)
    
    if jobs:
        scraper.jobs = jobs
        scraper.save_jobs("enhanced_comprehensive_healthcare_jobs")
        
        # Print summary
        print(f"\n📊 FINAL SUMMARY")
        print(f"=" * 40)
        print(f"Total Jobs Found: {len(jobs)}")
        print(f"Sites Processed: {len(scraper.site_configs)}")
        print(f"Average Jobs per Site: {len(jobs) / len(scraper.site_configs):.1f}")
        
        # Location analysis
        with_city_state = sum(1 for job in jobs if job.get('city') and job.get('state'))
        with_state_only = sum(1 for job in jobs if job.get('state') and not job.get('city'))
        print(f"Jobs with City+State: {with_city_state} ({with_city_state/len(jobs)*100:.1f}%)")
        print(f"Jobs with State only: {with_state_only} ({with_state_only/len(jobs)*100:.1f}%)")
        
        # Platform breakdown
        platform_counts = {}
        for job in jobs:
            platform = job.get('platform', 'unknown')
            platform_counts[platform] = platform_counts.get(platform, 0) + 1
        
        print(f"\nJobs by Platform:")
        for platform, count in sorted(platform_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  {platform}: {count} jobs")
        
    else:
        print("❌ No jobs found")

if __name__ == "__main__":
    main() 