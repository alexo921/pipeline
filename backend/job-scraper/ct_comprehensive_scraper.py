#!/usr/bin/env python3
"""
Connecticut Healthcare Job Scraper
==================================

Comprehensive scraper for Connecticut healthcare job sites with platform-specific
extraction logic for all major ATS systems and custom career pages.

Supported Platforms:
- Apploi (27 sites)
- Custom career pages (7 sites)
- Paycom/ADP (6 sites)
- iCIMS (2 sites)
- Hireology (2 sites)
- Dayforce (2 sites)
- UltiPro, Paylocity, Oracle, ApplicantPool (1 site each)
"""

import csv
import json
import logging
import re
import time
import random
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urljoin, urlparse, quote
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

class CTHealthcareScraper:
    """Connecticut healthcare job scraper with comprehensive platform support."""
    
    def __init__(self, headless: bool = True, debug: bool = False, max_workers: int = 3):
        self.headless = headless
        self.debug = debug
        self.max_workers = max_workers
        self.driver = None
        self.wait = None
        self.jobs = []
        self.site_configs = self._load_ct_site_configs()
        self.scraping_stats = {
            'sites_processed': 0,
            'sites_successful': 0,
            'sites_failed': 0,
            'total_jobs_found': 0,
            'start_time': None,
            'current_site': None,
            'errors': []
        }
        self.lock = threading.Lock()
        
        # Platform-specific configurations
        self.platform_configs = {
            'apploi': {
                'job_container': '.job-card, .job-listing, .job-item, [data-testid="job-card"]',
                'job_title': '.job-title, .job-name, h3 a, .title a, [data-testid="job-title"]',
                'job_location': '.job-location, .location, .job-city, [data-testid="job-location"]',
                'job_salary': '.salary, .compensation, .pay, .rate, [class*="salary"]',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info, .results-count'
            },
            'paycom': {
                'job_container': '.job-result, .job-item, [data-automation-id="jobPostingItem"]',
                'job_title': '.job-title, [data-automation-id="jobPostingTitle"] a, .position-title a',
                'job_location': '.job-location, [data-automation-id="jobPostingLocation"], .location',
                'job_salary': '.salary, .compensation, .pay, .rate',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info, .results-count'
            },
            'adp': {
                'job_container': '.job-result, .job-item, [data-automation-id="jobPostingItem"], .position-card',
                'job_title': '.job-title, [data-automation-id="jobPostingTitle"] a, .position-title a',
                'job_location': '.job-location, [data-automation-id="jobPostingLocation"], .location',
                'job_salary': '.salary, .compensation, .pay, .rate',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info, .results-count'
            },
            'icims': {
                'job_container': '.iCIMS_JobsTable tr, .jobs-list-item, .job-item, .row, .job-result',
                'job_title': '.iCIMS_InfoField_Job, .job-title, h3 a, .title a, td a, .job-name',
                'job_location': '.iCIMS_InfoField_Location, .job-location, .location, .job-city',
                'job_salary': '.salary, .compensation, .pay, .rate, [class*="salary"]',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.iCIMS_Paginator_Next, .pagination-next, [aria-label="Next"]',
                'pagination_info': '.iCIMS_Paginator_Summary, .pagination-info'
            },
            'hireology': {
                'job_container': '.job-listing, .job-item, .position-card, [data-testid="job-card"]',
                'job_title': '.job-title, .position-title, h3 a, .title a, [data-testid="job-title"]',
                'job_location': '.job-location, .location, .job-city, [data-testid="job-location"]',
                'job_salary': '.salary, .compensation, .pay, .rate',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info, .results-count'
            },
            'dayforce': {
                'job_container': '.job-result, .job-item, [data-automation-id="jobPostingItem"]',
                'job_title': '.job-title, [data-automation-id="jobPostingTitle"] a, .position-title a',
                'job_location': '.job-location, [data-automation-id="jobPostingLocation"], .location',
                'job_salary': '.salary, .compensation, .pay, .rate',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info, .results-count'
            },
            'ultipro': {
                'job_container': '.job-result, .job-item, [data-automation-id="jobPostingItem"]',
                'job_title': '.job-title, [data-automation-id="jobPostingTitle"] a, .position-title a',
                'job_location': '.job-location, [data-automation-id="jobPostingLocation"], .location',
                'job_salary': '.salary, .compensation, .pay, .rate',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info, .results-count'
            },
            'paylocity': {
                'job_container': '.job-result, .job-item, [data-automation-id="jobPostingItem"]',
                'job_title': '.job-title, [data-automation-id="jobPostingTitle"] a, .position-title a',
                'job_location': '.job-location, [data-automation-id="jobPostingLocation"], .location',
                'job_salary': '.salary, .compensation, .pay, .rate',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info, .results-count'
            },
            'oracle': {
                'job_container': '.job-result, .job-item, [data-automation-id="jobPostingItem"]',
                'job_title': '.job-title, [data-automation-id="jobPostingTitle"] a, .position-title a',
                'job_location': '.job-location, [data-automation-id="jobPostingLocation"], .location',
                'job_salary': '.salary, .compensation, .pay, .rate',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info, .results-count'
            },
            'applicantpool': {
                'job_container': '.job-listing, .job-item, .position-card',
                'job_title': '.job-title, .position-title, h3 a, .title a',
                'job_location': '.job-location, .location, .job-city',
                'job_salary': '.salary, .compensation, .pay, .rate',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info, .results-count'
            },
            'custom': {
                'job_container': '.job-card, .job-listing, .job-item, .position-card, .career-item',
                'job_title': '.job-title, .position-title, h3 a, .title a, .job-name',
                'job_location': '.job-location, .location, .job-city, .address',
                'job_salary': '.salary, .compensation, .pay, .rate',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info, .results-count'
            }
        }
        
    def _load_ct_site_configs(self) -> List[Dict]:
        """Load CT-specific site configurations from CSV."""
        configs = []
        try:
            with open('ct_only.csv', 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get('search_url') and row.get('source_site'):
                        # Clean up the job board type
                        job_board_type = row.get('job board type', '').strip().lower()
                        if job_board_type in ['', 'needs manual', 'def needs manual', 'old most likely needs manual', 
                                            'a little weird may need manial', 'weird one', 'A bunch of PDFs']:
                            job_board_type = 'custom'
                        
                        configs.append({
                            'source_site': row['source_site'],
                            'search_url': row['search_url'],
                            'state': row.get('state', 'CT'),
                            'city': row.get('city', ''),
                            'zip_code': row.get('zip_code', ''),
                            'location_scope': row.get('location_scope', ''),
                            'parse_location': row.get('parse_location?', 'No') == 'Yes',
                            'setting_type': row.get('setting_type', ''),
                            'job_board_type': job_board_type,
                            'notes': row.get('notes', '')
                        })
        except Exception as e:
            logger.error(f"Error loading CT site configs: {e}")
        
        logger.info(f"Loaded {len(configs)} CT site configurations")
        return configs
    
    def _setup_driver(self) -> bool:
        """Setup WebDriver with improved error handling."""
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
            
            # Use webdriver-manager to get the correct chromedriver
            try:
                service = Service(ChromeDriverManager().install())
                self.driver = uc.Chrome(service=service, options=chrome_options)
                logger.info("✅ WebDriver setup successful with webdriver-manager")
            except Exception as e:
                logger.warning(f"⚠️ webdriver-manager failed, trying fallback: {e}")
                self.driver = uc.Chrome(options=chrome_options)
                logger.info("✅ WebDriver setup successful with fallback method")
            
            self.wait = WebDriverWait(self.driver, 10)
            self.driver.get("https://www.google.com")
            time.sleep(2)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ WebDriver setup failed: {e}")
            return False
    
    def _detect_platform(self, url: str) -> str:
        """Detect the platform/ATS system from URL."""
        url_lower = url.lower()
        
        if 'apploi.com' in url_lower:
            return 'apploi'
        elif 'paycomonline.net' in url_lower:
            return 'paycom'
        elif any(x in url_lower for x in ['adp.com', 'workforcenow.adp']):
            return 'adp'
        elif 'icims.com' in url_lower:
            return 'icims'
        elif 'hireology.com' in url_lower:
            return 'hireology'
        elif 'dayforcehcm.com' in url_lower:
            return 'dayforce'
        elif 'ultipro.com' in url_lower:
            return 'ultipro'
        elif 'paylocity.com' in url_lower:
            return 'paylocity'
        elif 'oracle.com' in url_lower or 'oraclecloud.com' in url_lower:
            return 'oracle'
        elif 'applicantpool.com' in url_lower:
            return 'applicantpool'
        else:
            return 'custom'

    def _switch_to_iframe_if_needed(self, platform: str) -> bool:
        """Switch to iframe if job content is embedded."""
        if not self.driver:
            return False
            
        try:
            # Look for iframes
            iframes = self.driver.find_elements(By.TAG_NAME, 'iframe')
            if not iframes:
                return False
            
            logger.info(f"Found {len(iframes)} iframes, checking for job content...")
            
            for i, iframe in enumerate(iframes):
                try:
                    # Skip obvious non-job iframes
                    src = iframe.get_attribute('src') or ''
                    if any(skip_domain in src.lower() for skip_domain in [
                        'youtube.com', 'google.com/recaptcha', 'doubleclick.net', 
                        'adsrvr.org', 'brandcdn.com', 'jometer.com', 'about:blank'
                    ]):
                        continue
                    
                    # Switch to iframe
                    self.driver.switch_to.frame(iframe)
                    time.sleep(3)
                    
                    # Check if this iframe contains job content
                    page_source = self.driver.page_source.lower()
                    job_indicators = ['job', 'career', 'position', 'apply', 'hiring']
                    
                    if any(indicator in page_source for indicator in job_indicators):
                        logger.info(f"Found job content in iframe {i}")
                        return True
                    
                    # Switch back to main content
                    self.driver.switch_to.default_content()
                    
                except Exception as e:
                    logger.warning(f"Error checking iframe {i}: {e}")
                    self.driver.switch_to.default_content()
                    continue
            
            return False
            
        except Exception as e:
            logger.error(f"Error handling iframes: {e}")
            return False

    def _find_job_elements_alternative(self) -> List:
        """Alternative method to find job elements when standard selectors fail."""
        if not self.driver:
            return []
            
        try:
            # Look for elements containing job-related text
            job_keywords = ['job', 'career', 'position', 'opportunity', 'apply']
            job_elements = []
            
            # Search in all elements
            all_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'job') or contains(text(), 'career') or contains(text(), 'position')]")
            
            for element in all_elements:
                text = element.text.strip().lower()
                if any(keyword in text for keyword in job_keywords) and len(text) > 10:
                    # Check if this element or its parent looks like a job listing
                    try:
                        parent = element.find_element(By.XPATH, "./..")
                        if parent:
                            job_elements.append(parent)
                    except:
                        job_elements.append(element)
            
            logger.info(f"Found {len(job_elements)} potential job elements using alternative method")
            return job_elements
            
        except Exception as e:
            logger.error(f"Error in alternative job finding: {e}")
            return []
    
    def _extract_jobs_from_page(self, platform: str, config: Dict) -> List[Dict]:
        """Extract jobs from current page based on platform."""
        jobs = []
        platform_config = self.platform_configs.get(platform, self.platform_configs['custom'])
        
        if not self.driver:
            return jobs
        
        try:
            # Wait for page to load
            time.sleep(5)
            
            # Check for iframes and switch if needed
            iframe_found = self._switch_to_iframe_if_needed(platform)
            if iframe_found:
                logger.info("Switched to iframe for job content")
            
            # Find job containers
            job_containers = []
            for selector in platform_config['job_container'].split(', '):
                try:
                    containers = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if containers:
                        job_containers.extend(containers)
                        break
                except:
                    continue
            
            if not job_containers:
                logger.warning(f"No job containers found for {config['source_site']}")
                # Try alternative approach - look for any elements with job-related text
                job_containers = self._find_job_elements_alternative()
            
            # Extract jobs from containers
            for container in job_containers:
                try:
                    job_data = self._extract_job_from_container(container, platform_config, config)
                    if job_data:
                        jobs.append(job_data)
                except Exception as e:
                    logger.error(f"Error extracting job from container: {e}")
                    continue
            
            # Switch back to main content if we were in an iframe
            if iframe_found:
                self.driver.switch_to.default_content()
            
        except Exception as e:
            logger.error(f"Error extracting jobs from page: {e}")
            # Switch back to main content on error
            try:
                self.driver.switch_to.default_content()
            except:
                pass
        
        return jobs
    
    def _extract_job_from_container(self, container, platform_config: Dict, config: Dict) -> Optional[Dict]:
        """Extract job data from a single container."""
        try:
            job_data = {
                'title': '',
                'company': config['source_site'],
                'location': '',
                'city': config.get('city', ''),
                'state': config.get('state', 'CT'),
                'zip_code': config.get('zip_code', ''),
                'date_posted': '',
                'salary': '',
                'description': '',
                'url': '',
                'apply_url': '',
                'scraped_at': datetime.now().isoformat(),
                'source_site': config['source_site'],
                'job_board_type': config.get('job_board_type', 'custom'),
                'setting_type': config.get('setting_type', '')
            }
            
            # Extract title
            for selector in platform_config['job_title'].split(', '):
                try:
                    title_elem = container.find_element(By.CSS_SELECTOR, selector)
                    # Try multiple sources for title text
                    title_text = title_elem.text.strip()
                    
                    # If text is empty, try other attributes
                    if not title_text:
                        title_text = title_elem.get_attribute('title') or ''
                    if not title_text:
                        title_text = title_elem.get_attribute('aria-label') or ''
                    if not title_text:
                        title_text = title_elem.get_attribute('alt') or ''
                    if not title_text:
                        title_text = title_elem.get_attribute('data-title') or ''
                    
                    # If still no title, try to get it from the job page
                    if not title_text and title_elem.tag_name == 'a':
                        job_url = title_elem.get_attribute('href')
                        if job_url and 'jobs.apploi.com/view/' in job_url:
                            try:
                                # Store current page
                                current_url = self.driver.current_url
                                
                                # Visit job page to get title
                                self.driver.get(job_url)
                                time.sleep(3)
                                
                                # Get title from page title
                                page_title = self.driver.title.strip()
                                if page_title and len(page_title) > 3:
                                    title_text = page_title
                                    logger.info(f"Extracted title from job page: {title_text}")
                                
                                # Go back to original page
                                self.driver.get(current_url)
                                time.sleep(2)
                                
                            except Exception as e:
                                logger.warning(f"Error visiting job page for title: {e}")
                                # Try to go back to original page
                                try:
                                    self.driver.get(current_url)
                                    time.sleep(2)
                                except:
                                    pass
                    
                    # Clean up common title prefixes
                    title_text = title_text.replace('Title\n', '').replace('Job Posting Title\n', '')
                    job_data['title'] = title_text
                    
                    if not job_data['title'] and title_elem.get_attribute('href'):
                        job_data['url'] = title_elem.get_attribute('href')
                    break
                except:
                    continue
            
            # Extract location
            if config.get('parse_location'):
                for selector in platform_config['job_location'].split(', '):
                    try:
                        location_elem = container.find_element(By.CSS_SELECTOR, selector)
                        job_data['location'] = location_elem.text.strip()
                        break
                    except:
                        continue
            else:
                # Use fixed location from config
                if config.get('city'):
                    job_data['location'] = f"{config['city']}, {config['state']}"
                    if config.get('zip_code'):
                        job_data['location'] += f" {config['zip_code']}"
            
            # Extract salary
            for selector in platform_config['job_salary'].split(', '):
                try:
                    salary_elem = container.find_element(By.CSS_SELECTOR, selector)
                    job_data['salary'] = salary_elem.text.strip()
                    break
                except:
                    continue
            
            # Extract job type
            for selector in platform_config['job_type'].split(', '):
                try:
                    type_elem = container.find_element(By.CSS_SELECTOR, selector)
                    job_data['job_type'] = type_elem.text.strip()
                    break
                except:
                    continue
            
            # Validate job data
            if not job_data['title']:
                return None
            
            # Filter out invalid job titles
            invalid_titles = [
                'load more listings', 'load more', 'show more', 'next page',
                'previous page', 'pagination', 'navigation', 'menu', 'sidebar'
            ]
            
            if any(invalid_title in job_data['title'].lower() for invalid_title in invalid_titles):
                return None
            
            return job_data
            
        except Exception as e:
            logger.error(f"Error extracting job from container: {e}")
            return None
    
    def _navigate_to_next_page(self, platform: str) -> bool:
        """Navigate to next page if available."""
        try:
            platform_config = self.platform_configs.get(platform, self.platform_configs['custom'])
            
            for selector in platform_config['next_button'].split(', '):
                try:
                    next_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if next_button.is_enabled() and next_button.is_displayed():
                        next_button.click()
                        time.sleep(3)
                        return True
                except:
                    continue
            
            return False
            
        except Exception as e:
            logger.error(f"Error navigating to next page: {e}")
            return False
    
    def _scrape_site_with_pagination(self, config: Dict, max_pages: int = 10) -> List[Dict]:
        """Scrape a single site with pagination support."""
        jobs = []
        platform = self._detect_platform(config['search_url'])
        
        try:
            logger.info(f"Scraping {config['source_site']} ({platform})")
            
            self.driver.get(config['search_url'])
            time.sleep(3)
            
            page = 1
            while page <= max_pages:
                page_jobs = self._extract_jobs_from_page(platform, config)
                if not page_jobs:
                    break
                
                jobs.extend(page_jobs)
                logger.info(f"Page {page}: Found {len(page_jobs)} jobs")
                
                if not self._navigate_to_next_page(platform):
                    break
                
                page += 1
            
            logger.info(f"✅ {config['source_site']}: Total {len(jobs)} jobs found")
            
        except Exception as e:
            logger.error(f"❌ Error scraping {config['source_site']}: {e}")
        
        return jobs
    
    def scrape_all_sites(self, max_sites: Optional[int] = None, max_pages_per_site: int = 10) -> List[Dict]:
        """Scrape all CT healthcare sites."""
        if not self._setup_driver():
            logger.error("Failed to setup WebDriver")
            return []
        
        self.scraping_stats['start_time'] = datetime.now()
        all_jobs = []
        
        try:
            sites_to_scrape = self.site_configs[:max_sites] if max_sites else self.site_configs
            
            for i, config in enumerate(sites_to_scrape, 1):
                self.scraping_stats['current_site'] = config['source_site']
                self.scraping_stats['sites_processed'] = i
                
                logger.info(f"Processing {i}/{len(sites_to_scrape)}: {config['source_site']}")
                
                try:
                    site_jobs = self._scrape_site_with_pagination(config, max_pages_per_site)
                    if site_jobs:
                        all_jobs.extend(site_jobs)
                        self.scraping_stats['sites_successful'] += 1
                        self.scraping_stats['total_jobs_found'] += len(site_jobs)
                    else:
                        self.scraping_stats['sites_failed'] += 1
                        
                except Exception as e:
                    logger.error(f"Error processing {config['source_site']}: {e}")
                    self.scraping_stats['sites_failed'] += 1
                    self.scraping_stats['errors'].append({
                        'site': config['source_site'],
                        'error': str(e)
                    })
                
                # Random delay between sites
                time.sleep(random.uniform(2, 5))
            
        finally:
            if self.driver:
                self.driver.quit()
        
        # Remove duplicates
        all_jobs = self._remove_duplicates(all_jobs)
        
        logger.info(f"Scraping completed: {len(all_jobs)} unique jobs from {self.scraping_stats['sites_successful']} sites")
        return all_jobs
    
    def _remove_duplicates(self, jobs: List[Dict]) -> List[Dict]:
        """Remove duplicate jobs based on title and company."""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            key = f"{job['title']}_{job['company']}"
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
        
        return unique_jobs
    
    def save_jobs(self, jobs: List[Dict], filename_prefix: str = "ct_healthcare_jobs"):
        """Save jobs to JSON and CSV files."""
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
        
        logger.info(f"Jobs saved: {json_filename} ({len(jobs)} jobs)")
        return json_filename, csv_filename
    
    def print_summary(self):
        """Print scraping summary."""
        print("\n" + "="*60)
        print("CONNECTICUT HEALTHCARE JOB SCRAPING SUMMARY")
        print("="*60)
        print(f"Sites processed: {self.scraping_stats['sites_processed']}")
        print(f"Sites successful: {self.scraping_stats['sites_successful']}")
        print(f"Sites failed: {self.scraping_stats['sites_failed']}")
        print(f"Total jobs found: {self.scraping_stats['total_jobs_found']}")
        
        if self.scraping_stats['errors']:
            print(f"\nErrors encountered: {len(self.scraping_stats['errors'])}")
            for error in self.scraping_stats['errors'][:5]:  # Show first 5 errors
                print(f"  - {error['site']}: {error['error']}")

def main():
    """Main function to run the CT healthcare scraper."""
    scraper = CTHealthcareScraper(headless=True, debug=False)
    
    print("🚀 Starting Connecticut Healthcare Job Scraper...")
    print(f"📊 Total sites to process: {len(scraper.site_configs)}")
    
    # Scrape all sites
    jobs = scraper.scrape_all_sites(max_pages_per_site=5)
    
    if jobs:
        # Save results
        json_file, csv_file = scraper.save_jobs(jobs)
        
        # Print summary
        scraper.print_summary()
        
        print(f"\n✅ Scraping completed successfully!")
        print(f"📁 Results saved to: {json_file}, {csv_file}")
    else:
        print("❌ No jobs found during scraping")

if __name__ == "__main__":
    main() 