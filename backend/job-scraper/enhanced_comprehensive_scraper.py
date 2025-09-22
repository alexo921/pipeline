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
import logging
import re
import time
import random
from datetime import datetime
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

class EnhancedHealthcareScraper:
    """Enhanced healthcare job scraper with comprehensive data extraction, NLP processing, and resilient scraping."""
    
    def __init__(self, headless: bool = True, debug: bool = False, max_workers: int = 3):
        self.headless = headless
        self.debug = debug
        self.max_workers = max_workers
        self.driver = None
        self.wait = None
        self.jobs = []
        self.site_configs = self._load_site_configs()
        self.scraping_stats = {
            'sites_processed': 0,
            'sites_successful': 0,
            'sites_failed': 0,
            'total_jobs_found': 0,
            'start_time': None,
            'current_site': None,
            'errors': []
        }
        self.lock = threading.Lock()  # For thread-safe operations
        
        # Job settings, employment types, and shifts for classification
        self.job_settings = {
            'nursing_home': ['nursing home', 'skilled nursing', 'ltc', 'long term care', 'nursing facility'],
            'assisted_living': ['assisted living', 'alf', 'memory care', 'senior living', 'independent living'],
            'homecare': ['homecare', 'home care', 'home health', 'in-home', 'home health aide', 'personal care']
        }
        
        self.employment_types = {
            'full_time': ['full-time', 'full time', 'permanent', 'regular'],
            'part_time': ['part-time', 'part time', 'flexible hours'],
            'per_diem': ['per diem', 'per-diem', 'prn', 'as needed', 'on call'],
            'temp_to_perm': ['temp-to-perm', 'temp to perm', 'temporary to permanent', 'contract to hire'],
            'local_contract': ['local contract', 'travel contract', 'contract position', 'temporary contract']
        }
        
        self.shifts = {
            '7am_3pm': ['7am-3pm', '7am to 3pm', '7:00am-3:00pm', 'day shift', 'morning shift', 'first shift'],
            '3pm_11pm': ['3pm-11pm', '3pm to 11pm', '3:00pm-11:00pm', 'evening shift', 'afternoon shift', 'second shift'],
            '11pm_7am': ['11pm-7am', '11pm to 7am', '11:00pm-7:00am', 'night shift', 'overnight shift', 'third shift']
        }
        
        # Enhanced platform-specific selectors and patterns
        self.platform_configs = {
            'icims': {
                'job_container': '.iCIMS_JobsTable tr, .jobs-list-item, .job-item, .row, .job-result',
                'job_title': '.iCIMS_InfoField_Job, .job-title, h3 a, .title a, td a, .job-name',
                'job_location': '.iCIMS_InfoField_Location, .job-location, .location, .job-city',
                'job_salary': '.salary, .compensation, .pay, .rate, [class*="salary"], [class*="pay"]',
                'job_type': '.job-type, .employment-type, .schedule, .shift, [class*="type"]',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.iCIMS_Paginator_Next, .pagination-next, [aria-label="Next"]',
                'pagination_info': '.iCIMS_Paginator_Summary, .pagination-info'
            },
            'adp': {
                'job_container': '.job-result, .job-item, [data-automation-id="jobPostingItem"], .position-card',
                'job_title': '.job-title, [data-automation-id="jobPostingTitle"] a, .position-title a',
                'job_location': '.job-location, [data-automation-id="jobPostingLocation"], .location',
                'job_salary': '.salary, .compensation, .pay, [data-automation-id*="salary"]',
                'job_type': '.job-type, .employment-type, .schedule, [data-automation-id*="type"]',
                'job_description': '.job-description, .description, .summary',
                'next_button': '[aria-label="Next"], .paging-next, .pagination-next, .next-page',
                'pagination_info': '.paging-info, .pagination-summary'
            },
            'workday': {
                'job_container': '[data-automation-id="jobPostingItem"], .job-posting, .position',
                'job_title': '[data-automation-id="jobPostingTitle"] a, .job-title a, .position-title',
                'job_location': '[data-automation-id="jobPostingLocation"], .job-location, .location',
                'job_salary': '[data-automation-id*="salary"], .salary, .compensation',
                'job_type': '[data-automation-id*="type"], .job-type, .employment-type',
                'job_description': '[data-automation-id*="description"], .job-description',
                'next_button': '[data-automation-id="paginationNext"], .pagination-next',
                'pagination_info': '[data-automation-id="paginationSummary"]'
            },
            'ultipro': {
                'job_container': '.job-item, .job-posting, .position, .opportunity',
                'job_title': '.job-title a, .position-title a, h3 a, .opportunity-title',
                'job_location': '.job-location, .location, .job-info .location, .opportunity-location',
                'job_salary': '.salary, .compensation, .pay, .rate',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info'
            },
            'onshift': {
                'job_container': '.job-posting, .job-item, .position-card, .job-position',
                'job_title': '.job-title, .position-title, h3, .job-position-title',
                'job_location': '.location, .job-location, .position-location, .facility-name',
                'job_salary': '.salary, .pay, .rate, .compensation',
                'job_type': '.job-type, .shift, .schedule, .employment-type',
                'job_description': '.job-description, .description, .summary',
                'next_button': '.pagination-next, .next-page, [aria-label="Next"]',
                'pagination_info': '.pagination-summary'
            },
            'apploi': {
                'job_container': '.job-card, .job-item, .position, .job-listing',
                'job_title': '.job-title, .position-title, h3, .job-name',
                'job_location': '.location, .job-location, .job-address',
                'job_salary': '.salary, .pay, .rate, .compensation',
                'job_type': '.job-type, .shift, .schedule, .employment-type',
                'job_description': '.job-description, .description, .summary',
                'next_button': '.pagination-next, [aria-label="Next"], .load-more',
                'pagination_info': '.pagination-info'
            },
            'hireology': {
                'job_container': '.job-posting, .job-item, .position, .opening',
                'job_title': '.job-title a, .position-title a, .opening-title a',
                'job_location': '.location, .job-location, .opening-location',
                'job_salary': '.salary, .pay, .rate, .compensation',
                'job_type': '.job-type, .shift, .schedule, .employment-type',
                'job_description': '.job-description, .description, .summary',
                'next_button': '.pagination-next, .next, [aria-label="Next"]',
                'pagination_info': '.pagination-summary'
            },
            'smartrecruiters': {
                'job_container': '.opening-job, .job-item, .position, .job-link',
                'job_title': '.job-title a, .opening-job-title a, .position-title',
                'job_location': '.job-location, .opening-job-location, .location',
                'job_salary': '.salary, .pay, .rate, .compensation',
                'job_type': '.job-type, .shift, .schedule, .employment-type',
                'job_description': '.job-description, .description, .summary',
                'next_button': '.pagination-next, [aria-label="Next"], .load-more',
                'pagination_info': '.pagination-widget'
            },
            'intelycare': {
                'job_container': '.job-card, .job-listing, .position, .job-item',
                'job_title': '.job-title, .position-title, .job-name',
                'job_location': '.location, .job-location, .job-address',
                'job_salary': '.salary, .pay, .rate, .compensation',
                'job_type': '.job-type, .shift, .schedule, .employment-type',
                'job_description': '.job-description, .description, .summary',
                'next_button': '.pagination-next, .load-more, [aria-label="Next"]',
                'pagination_info': '.pagination-info'
            },
            'homeinstead': {
                'job_container': '.job-card, .job-item, .position, .job-listing',
                'job_title': '.job-title, .position-title, .job-name, h3',
                'job_location': '.location, .job-location, .job-address, .city-state',
                'job_salary': '.salary, .pay, .rate, .compensation',
                'job_type': '.job-type, .shift, .schedule, .employment-type',
                'job_description': '.job-description, .description, .summary',
                'next_button': '.pagination-next, .load-more, [aria-label="Next"]',
                'pagination_info': '.pagination-info'
            },
            'custom': {
                'job_container': '.job, .job-item, .job-listing, .job-card, .position, .career, .opening, .vacancy, .role, .post, .listing, .opportunity, .employment, .job-row, tr',
                'job_title': '.job-title, .position-title, .title, .job-name, .role-title, h1, h2, h3, h4, h5, a[href*="job"], a[href*="career"], a[href*="position"], .career-title',
                'job_location': '.location, .job-location, .position-location, .city, .state, .address, .geo, .job-city, .job-state',
                'job_salary': '.salary, .pay, .rate, .compensation, .wage, .hourly, .annual, [class*="salary"], [class*="pay"]',
                'job_type': '.job-type, .employment-type, .schedule, .shift, .hours, .work-type, [class*="type"], [class*="shift"]',
                'job_description': '.job-description, .description, .summary, .details, .job-details, .content, .text',
                'next_button': '.next, .pagination-next, .load-more, [aria-label="Next"], .page-next, .btn-next, .more-jobs, .next-page, .pager-next',
                'pagination_info': '.pagination, .page-info, .results-info, .pager-info'
            }
        }
        
        # Enhanced salary patterns for extraction
        self.salary_patterns = [
            r'\$(\d{1,3}(?:,\d{3})*)\s*-\s*\$(\d{1,3}(?:,\d{3})*)\s*(?:per\s+)?(?:hour|hr|year|yr|annually|month|mo)',
            r'\$(\d{1,3}(?:,\d{3})*)\s*(?:per\s+)?(?:hour|hr|year|yr|annually|month|mo)',
            r'(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)\s*(?:per\s+)?(?:hour|hr|year|yr|annually|month|mo)',
            r'(\d{1,3}(?:,\d{3})*)\s*(?:per\s+)?(?:hour|hr|year|yr|annually|month|mo)',
            r'\$(\d{1,3}(?:,\d{3})*)\s*-\s*\$(\d{1,3}(?:,\d{3})*)\s*(?:hourly|annually|monthly)',
            r'\$(\d{1,3}(?:,\d{3})*)\s*(?:hourly|annually|monthly)',
            r'(\d{1,3}(?:,\d{3})*)\s*-\s*(\d{1,3}(?:,\d{3})*)\s*(?:hourly|annually|monthly)',
            r'(\d{1,3}(?:,\d{3})*)\s*(?:hourly|annually|monthly)',
            r'competitive\s+salary',
            r'competitive\s+pay',
            r'competitive\s+compensation'
        ]
        
        # Enhanced shift type patterns
        self.shift_patterns = [
            r'\b(day|night|evening|morning|afternoon|overnight|weekend|weekday|weekends?|weekdays?)\s*(?:shift|schedule|hours?|work)\b',
            r'\b(full\s*-?\s*time|part\s*-?\s*time|per\s*diem|prn|casual|temporary|temp|seasonal)\b',
            r'\b(7am\s*-?\s*3pm|3pm\s*-?\s*11pm|11pm\s*-?\s*7am|8am\s*-?\s*4pm|4pm\s*-?\s*12am|12am\s*-?\s*8am)\b',
            r'\b(7:00\s*am\s*-?\s*3:00\s*pm|3:00\s*pm\s*-?\s*11:00\s*pm|11:00\s*pm\s*-?\s*7:00\s*am)\b',
            r'\b(day\s*shift|night\s*shift|evening\s*shift|morning\s*shift|afternoon\s*shift)\b',
            r'\b(rotating\s*shifts?|flexible\s*schedule|variable\s*hours?)\b'
        ]
        
        # Enhanced requirements patterns with categories
        self.requirements_patterns = {
            'education': [
                r'\b(high\s*school\s*diploma|ged|bachelor|master|doctorate|phd|associate|certification|certified)\b',
                r'\b(degree|diploma|certificate|license|licensed)\b'
            ],
            'experience': [
                r'\b(\d+\s*years?\s*experience|\d+\s*months?\s*experience|entry\s*level|experienced|senior)\b',
                r'\b(\d+)\s*[-+]?\s*years?\s*(?:of\s*)?(?:experience|exp)\b'
            ],
            'certifications': [
                r'\b(cna|certified\s*nursing\s*assistant|rn|registered\s*nurse|lpn|licensed\s*practical\s*nurse)\b',
                r'\b(cpr\s*certification|first\s*aid|bcls|acls|driver\s*license|clean\s*background)\b',
                r'\b(certified|certification|license|licensed)\b'
            ],
            'skills': [
                r'\b(compassionate|reliable|dependable|flexible|team\s*player|communication\s*skills)\b',
                r'\b(patient\s*care|medication|vital\s*signs|documentation|computer\s*skills)\b'
            ]
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
    
    def _setup_driver(self) -> bool:
        """Setup WebDriver with improved error handling and webdriver-manager."""
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
            
            # Use webdriver-manager to get the correct chromedriver
            try:
                # First try with webdriver-manager
                service = Service(ChromeDriverManager().install())
                self.driver = uc.Chrome(service=service, options=chrome_options)
                self._log("✅ WebDriver setup successful with webdriver-manager")
            except Exception as e:
                self._log(f"⚠️ webdriver-manager failed, trying fallback: {e}")
                # Fallback to undetected_chromedriver
                self.driver = uc.Chrome(options=chrome_options)
                self._log("✅ WebDriver setup successful with fallback method")
            
            # Setup wait
            self.wait = WebDriverWait(self.driver, 10)
            
            # Test the driver
            self.driver.get("https://www.google.com")
            time.sleep(2)
            
            return True
            
        except Exception as e:
            self._log(f"❌ WebDriver setup failed: {e}")
            return False
    
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
        
        # Find job containers with enhanced detection
        job_containers = []
        
        # Method 1: Try platform-specific selectors
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
                                             'therapy', 'social worker', 'director', 'manager', 'supervisor',
                                             'dietary', 'housekeeping', 'maintenance', 'receptionist']
                        if any(keyword in elem_text for keyword in healthcare_keywords) or len(elem_text) < 100:
                            healthcare_elements.append(elem)
                    
                    if healthcare_elements:
                        job_containers = healthcare_elements
                        self._log(f"Found {len(healthcare_elements)} healthcare job containers with selector: {selector}")
                        break
            except Exception as e:
                self._log(f"Error with selector {selector}: {e}", "DEBUG")
                continue
        
        # Method 2: Fallback to generic job detection
        if not job_containers:
            try:
                # Look for common job listing patterns
                generic_selectors = [
                    'tr', 'div', 'li', 'article', 'section',
                    '[class*="job"]', '[class*="position"]', '[class*="career"]',
                    '[class*="listing"]', '[class*="post"]', '[class*="opening"]'
                ]
                
                for selector in generic_selectors:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            # Filter elements that might be job listings
                            potential_jobs = []
                            for elem in elements:
                                elem_text = elem.text.strip()
                                if (len(elem_text) > 20 and len(elem_text) < 2000 and 
                                    any(x in elem_text.lower() for x in ['nurse', 'care', 'aide', 'assistant', 'therapist', 'coordinator'])):
                                    potential_jobs.append(elem)
                            
                            if potential_jobs:
                                job_containers = potential_jobs
                                self._log(f"Found {len(potential_jobs)} potential job containers with generic selector: {selector}")
                                break
                    except:
                        continue
            except Exception as e:
                self._log(f"Error with generic selectors: {e}", "DEBUG")
        
        # Method 3: Last resort - look for any elements with job-related text
        if not job_containers:
            try:
                # Get all text elements and look for job patterns
                all_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'nurse') or contains(text(), 'care') or contains(text(), 'aide') or contains(text(), 'assistant')]")
                if all_elements:
                    # Group elements by their parent containers
                    containers = set()
                    for elem in all_elements:
                        try:
                            parent = elem.find_element(By.XPATH, "./..")
                            containers.add(parent)
                        except:
                            continue
                    
                    if containers:
                        job_containers = list(containers)
                        self._log(f"Found {len(job_containers)} job containers using text-based detection")
            except Exception as e:
                self._log(f"Error with text-based detection: {e}", "DEBUG")
        
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
                    
            # --- IMPROVED: Enhanced URL extraction ---
            job_url = ''
            try:
                # Method 1: Try to find the most relevant link (job title link)
                for selector in platform_config['job_title'].split(', '):
                    try:
                        title_elem = container.find_element(By.CSS_SELECTOR, selector)
                        if title_elem.tag_name == 'a':
                            job_url = title_elem.get_attribute('href')
                            if job_url:
                                break
                        # If title element is not a link, find the closest link
                        else:
                            link_elem = title_elem.find_element(By.XPATH, './/a')
                            if link_elem:
                                job_url = link_elem.get_attribute('href')
                                if job_url:
                                    break
                    except:
                        continue
                
                # Method 2: Find any link that looks like a job link
                if not job_url:
                    try:
                        links = container.find_elements(By.TAG_NAME, 'a')
                        for link in links:
                            href = link.get_attribute('href')
                            if href and any(x in href.lower() for x in ['job', 'career', 'position', 'apply', 'detail']):
                                job_url = href
                                break
                    except:
                        pass
                
                # Method 3: Find the first valid link as fallback
                if not job_url:
                    try:
                        link_elem = container.find_element(By.TAG_NAME, 'a')
                        job_url = link_elem.get_attribute('href')
                    except:
                        pass
                
                # Normalize URL
                if job_url and not job_url.startswith('http'):
                    job_url = urljoin(config['search_url'], job_url)
                    
            except Exception as e:
                self._log(f"URL extraction error: {e}", "DEBUG")
                
            # Parse location for city/state
            city, state = self._parse_location(location)
            # If no location found, try to extract from full container text
            if not city and not state:
                container_text = container.text
                city, state = self._parse_location(container_text)
                
            # --- NEW: Use BeautifulSoup fallback for all fields ---
            html = ''
            try:
                html = container.get_attribute('outerHTML')
            except:
                pass
            soup = BeautifulSoup(html, 'html.parser') if html else None
            
            # --- IMPROVED: Enhanced salary extraction ---
            salary = ''
            # Method 1: Try platform-specific selectors
            for selector in platform_config.get('job_salary', '').split(', '):
                try:
                    salary_elem = container.find_element(By.CSS_SELECTOR, selector)
                    salary = salary_elem.text.strip()
                    if salary:
                        break
                except:
                    continue
                    
            # Method 2: BeautifulSoup fallback
            if not salary and soup:
                for selector in platform_config.get('job_salary', '').split(', '):
                    elem = soup.select_one(selector)
                    if elem and elem.get_text(strip=True):
                        salary = elem.get_text(strip=True)
                        break
                        
            # Method 3: Enhanced regex patterns on all text
            if not salary and soup:
                text = soup.get_text(separator=' ', strip=True)
                for pattern in self.salary_patterns:
                    match = re.search(pattern, text, re.IGNORECASE)
                    if match:
                        salary = match.group(0)
                        break
                        
            # Method 4: Look for salary in specific elements
            if not salary and soup:
                # Look in spans, divs, and other elements that might contain salary
                for elem in soup.find_all(['span', 'div', 'p', 'strong', 'b']):
                    elem_text = elem.get_text(strip=True)
                    if elem_text and any(x in elem_text.lower() for x in ['$', 'salary', 'pay', 'hourly', 'annual']):
                        for pattern in self.salary_patterns:
                            match = re.search(pattern, elem_text, re.IGNORECASE)
                            if match:
                                salary = match.group(0)
                                break
                        if salary:
                            break
                            
            # Extract shift type/job type
            shift_type = ''
            for selector in platform_config.get('job_type', '').split(', '):
                try:
                    shift_elem = container.find_element(By.CSS_SELECTOR, selector)
                    shift_type = shift_elem.text.strip()
                    if shift_type:
                        break
                except:
                    continue
            if not shift_type and soup:
                for selector in platform_config.get('job_type', '').split(', '):
                    elem = soup.select_one(selector)
                    if elem and elem.get_text(strip=True):
                        shift_type = elem.get_text(strip=True)
                        break
            if not shift_type and soup:
                text = soup.get_text(separator=' ', strip=True)
                for pattern in self.shift_patterns:
                    match = re.search(pattern, text, re.IGNORECASE)
                    if match:
                        shift_type = match.group(0)
                        break
                        
            # Extract requirements
            requirements = ''
            for selector in platform_config.get('job_description', '').split(', '):
                try:
                    description_elem = container.find_element(By.CSS_SELECTOR, selector)
                    requirements = description_elem.text.strip()
                    if requirements and len(requirements) > 10:
                        break
                except:
                    continue
            if not requirements and soup:
                for selector in platform_config.get('job_description', '').split(', '):
                    elem = soup.select_one(selector)
                    if elem and elem.get_text(strip=True):
                        requirements = elem.get_text(strip=True)
                        break
            if not requirements and soup:
                text = soup.get_text(separator=' ', strip=True)
                reqs = set()
                for pattern in self.requirements_patterns['education']:
                    for match in re.findall(pattern, text, re.IGNORECASE):
                        reqs.add(match)
                for pattern in self.requirements_patterns['experience']:
                    for match in re.findall(pattern, text, re.IGNORECASE):
                        reqs.add(match)
                for pattern in self.requirements_patterns['certifications']:
                    for match in re.findall(pattern, text, re.IGNORECASE):
                        reqs.add(match)
                for pattern in self.requirements_patterns['skills']:
                    for match in re.findall(pattern, text, re.IGNORECASE):
                        reqs.add(match)
                if reqs:
                    requirements = ', '.join(reqs)
            
            # Extract benefits
            benefits = ''
            if soup:
                text = soup.get_text(separator=' ', strip=True)
                benefit_keywords = [
                    '401k', 'insurance', 'paid time off', 'pto', 'health insurance', 'dental', 'vision',
                    'retirement', 'bonus', 'tuition', 'flexible', 'training', 'development', 'sign-on', 'referral'
                ]
                found = [k for k in benefit_keywords if k in text.lower()]
                if found:
                    benefits = ', '.join(found)
            
            # --- IMPROVED: Enhanced application URL extraction ---
            application_url = job_url
            if soup:
                for a in soup.find_all('a', href=True):
                    href = a['href']
                    if any(x in href.lower() for x in ['apply', 'application', 'workday', 'icims', 'smartrecruiters', 'hire']):
                        if href.startswith('http'):
                            application_url = href
                        else:
                            application_url = urljoin(config['search_url'], href)
                        break
                        
            # Extract ZIP code from location
            zip_code = self._extract_zip_code(location)
            
            # Get full description for intelligent processing
            full_description = container.text.strip()
            
            # Intelligent processing
            salary_parsed = self._parse_salary_intelligently(salary)
            job_classification = self._classify_job(title, full_description)
            requirements_structured = self._extract_requirements_intelligently(full_description)
            
            # Create job data
            job_data = {
                'id': f"{config['source_site']}_{abs(hash(job_url or title))}",
                'title': title,
                'company': config['source_site'],
                'location': location or f"{city}, {state}" if city and state else state if state else 'Location not specified',
                'city': city,
                'state': state,
                'zip_code': zip_code,
                'url': job_url,
                'source': config['source_site'],
                'source_url': config['search_url'],
                'scraped_at': datetime.now().isoformat(),
                'description': full_description[:1000] + '...' if len(full_description) > 1000 else full_description,
                'platform': self._detect_platform(config['search_url']),
                'salary': salary,
                'salary_parsed': salary_parsed,
                'shift_type': shift_type,
                'requirements': requirements,
                'requirements_structured': requirements_structured,
                'benefits': benefits,
                'application_url': application_url,
                'job_category': job_classification['category'],
                'seniority_level': job_classification['seniority_level'],
                'is_remote': job_classification['is_remote'],
                'classification_confidence': job_classification['confidence_score']
            }
            
            # Validate and add quality metrics
            validated_job = self._validate_job_data(job_data)
            
            return validated_job
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
            r'([A-Za-z\s]+)\s+([A-Z]{2})',  # City ST (no comma)
            r'([A-Za-z\s]+),\s*([A-Za-z\s]+),\s*([A-Z]{2})',  # City, County, ST
        ]
        
        for pattern in patterns:
            match = re.search(pattern, location_text.strip(), re.IGNORECASE)
            if match:
                groups = match.groups()
                if len(groups) == 2:
                    city, state = groups
                    # Normalize state
                    if state.lower() in ['connecticut', 'massachusetts', 'rhode island', 'new york', 'vermont', 'new hampshire', 'maine']:
                        state_map = {'connecticut': 'CT', 'massachusetts': 'MA', 'rhode island': 'RI', 
                                   'new york': 'NY', 'vermont': 'VT', 'new hampshire': 'NH', 'maine': 'ME'}
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
    
    def _parse_salary_intelligently(self, salary_text: str) -> Dict[str, Any]:
        """Intelligently parse salary information and standardize format."""
        if not salary_text:
            return {'min': None, 'max': None, 'type': None, 'raw': '', 'is_competitive': False}
        
        salary_text = salary_text.lower().strip()
        
        # Check for competitive salary indicators
        if any(word in salary_text for word in ['competitive', 'market rate', 'negotiable']):
            return {
                'min': None, 'max': None, 'type': 'competitive',
                'raw': salary_text, 'is_competitive': True
            }
        
        # Parse numeric salary ranges
        for pattern in self.salary_patterns[:8]:  # Skip competitive patterns
            match = re.search(pattern, salary_text, re.IGNORECASE)
            if match:
                groups = match.groups()
                
                # Determine salary type
                salary_type = 'unknown'
                if any(word in salary_text for word in ['hour', 'hr', 'hourly']):
                    salary_type = 'hourly'
                elif any(word in salary_text for word in ['year', 'yr', 'annually', 'annual']):
                    salary_type = 'annual'
                elif any(word in salary_text for word in ['month', 'mo', 'monthly']):
                    salary_type = 'monthly'
                
                # Extract min and max values
                if len(groups) == 2 and groups[0] and groups[1]:
                    try:
                        min_val = int(groups[0].replace(',', ''))
                        max_val = int(groups[1].replace(',', ''))
                        return {
                            'min': min_val, 'max': max_val, 'type': salary_type,
                            'raw': salary_text, 'is_competitive': False
                        }
                    except ValueError:
                        continue
                elif len(groups) == 1 and groups[0]:
                    try:
                        val = int(groups[0].replace(',', ''))
                        return {
                            'min': val, 'max': val, 'type': salary_type,
                            'raw': salary_text, 'is_competitive': False
                        }
                    except ValueError:
                        continue
        
        return {'min': None, 'max': None, 'type': None, 'raw': salary_text, 'is_competitive': False}
    
    def _classify_job(self, title: str, description: str = '') -> Dict[str, Any]:
        """Classify job into job setting, employment type, and shift."""
        text = f"{title} {description}".lower()
        
        # Determine job setting
        job_setting_scores = {}
        for setting, keywords in self.job_settings.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                job_setting_scores[setting] = score
        
        primary_job_setting = max(job_setting_scores.items(), key=lambda x: x[1])[0] if job_setting_scores else 'nursing_home'
        
        # Determine employment type
        employment_scores = {}
        for emp_type, keywords in self.employment_types.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                employment_scores[emp_type] = score
        
        primary_employment_type = max(employment_scores.items(), key=lambda x: x[1])[0] if employment_scores else 'full_time'
        
        # Determine shift
        shift_scores = {}
        for shift, keywords in self.shifts.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                shift_scores[shift] = score
        
        primary_shift = max(shift_scores.items(), key=lambda x: x[1])[0] if shift_scores else '7am_3pm'
        
        return {
            'job_setting': primary_job_setting,
            'employment_type': primary_employment_type,
            'shift': primary_shift,
            'confidence_score': max(job_setting_scores.values()) if job_setting_scores else 0
        }
    
    def _extract_requirements_intelligently(self, text: str) -> Dict[str, List[str]]:
        """Intelligently extract and categorize requirements."""
        if not text:
            return {'education': [], 'experience': [], 'certifications': [], 'skills': []}
        
        text = text.lower()
        requirements = {'education': [], 'experience': [], 'certifications': [], 'skills': []}
        
        # Extract requirements by category
        for category, patterns in self.requirements_patterns.items():
            found_requirements = set()
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple):
                        found_requirements.update(match)
                    else:
                        found_requirements.add(match)
            
            # Clean and filter requirements
            cleaned_reqs = []
            for req in found_requirements:
                req = req.strip()
                if req and len(req) > 2 and req not in ['and', 'or', 'the', 'for', 'with']:
                    cleaned_reqs.append(req)
            
            requirements[category] = list(set(cleaned_reqs))
        
        # Extract years of experience more precisely
        experience_patterns = [
            r'(\d+)\s*[-+]?\s*years?\s*(?:of\s*)?(?:experience|exp)',
            r'(\d+)\s*[-+]?\s*years?\s*(?:in\s*)?(?:healthcare|nursing|care)',
            r'minimum\s*(\d+)\s*years?',
            r'at\s*least\s*(\d+)\s*years?'
        ]
        
        for pattern in experience_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                requirements['experience'].append(f"{match} years experience")
        
        return requirements
    
    def _validate_job_data(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and clean job data."""
        validated = job_data.copy()
        
        # Validate salary data
        if job_data.get('salary'):
            salary_info = self._parse_salary_intelligently(job_data['salary'])
            validated['salary_parsed'] = salary_info
            
            # Flag suspicious salary ranges
            if salary_info['min'] and salary_info['max']:
                if salary_info['type'] == 'hourly' and salary_info['max'] > 200:
                    validated['salary_warning'] = 'Suspiciously high hourly rate'
                elif salary_info['type'] == 'annual' and salary_info['max'] > 500000:
                    validated['salary_warning'] = 'Suspiciously high annual salary'
        
        # Validate location data
        if not job_data.get('city') and not job_data.get('state'):
            validated['location_warning'] = 'Missing location information'
        
        # Validate required fields
        missing_fields = []
        for field in ['title', 'company', 'url']:
            if not job_data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            validated['missing_fields'] = missing_fields
        
        # Calculate data completeness score
        required_fields = ['title', 'company', 'location', 'url', 'description']
        optional_fields = ['salary', 'shift_type', 'requirements', 'benefits']
        
        required_score = sum(1 for field in required_fields if job_data.get(field)) / len(required_fields)
        optional_score = sum(1 for field in optional_fields if job_data.get(field)) / len(optional_fields)
        
        validated['completeness_score'] = {
            'required': required_score,
            'optional': optional_score,
            'overall': (required_score * 0.7) + (optional_score * 0.3)
        }
        
        return validated
    
    def _extract_zip_code(self, location_text: str) -> str:
        """Extract ZIP code from location text."""
        if not location_text:
            return ''
        
        zip_pattern = r'\b\d{5}(?:-\d{4})?\b'
        match = re.search(zip_pattern, location_text)
        return match.group(0) if match else ''
    
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
    
    def scrape_all_sites(self, max_sites: Optional[int] = None, max_pages_per_site: int = 50) -> List[Dict]:
        """Scrape all sites sequentially with improved error handling."""
        self._log(f"🚀 Starting Enhanced Healthcare Job Scraping (Sequential Mode)")
        self.scraping_stats['start_time'] = datetime.now()
        
        sites_to_process = self.site_configs[:max_sites] if max_sites else self.site_configs
        total_sites = len(sites_to_process)
        
        self._log(f"📋 Processing {total_sites} healthcare job sites with up to {max_pages_per_site} pages each")
        
        all_jobs = []
        
        # Process sites sequentially to avoid WebDriver conflicts
        for i, config in enumerate(sites_to_process, 1):
            try:
                self._log(f"🏥 Processing site {i}/{total_sites}: {config['source_site']}")
                
                # Scrape single site with resilience
                site_jobs = self._scrape_site_with_resilience(config, max_pages_per_site)
                all_jobs.extend(site_jobs)
                
                # Progress update
                processed = self.scraping_stats['sites_processed']
                success_rate = (self.scraping_stats['sites_successful'] / processed * 100) if processed > 0 else 0
                
                self._log(f"📊 Progress: {processed}/{total_sites} sites | "
                         f"Success: {success_rate:.1f}% | "
                         f"Jobs: {len(all_jobs)} | "
                         f"Errors: {len(self.scraping_stats['errors'])}")
                
                # Add delay between sites to be respectful
                if i < total_sites:
                    delay = random.uniform(2, 5)
                    self._log(f"⏳ Waiting {delay:.1f}s before next site...")
                    time.sleep(delay)
                
            except Exception as e:
                self._log(f"❌ Exception processing {config['source_site']}: {e}")
                with self.lock:
                    self.scraping_stats['sites_failed'] += 1
                    self.scraping_stats['errors'].append({
                        'site': config['source_site'],
                        'error': str(e),
                        'timestamp': datetime.now().isoformat()
                    })
        
        # Final processing
        unique_jobs = self._remove_duplicates(all_jobs)
        self.jobs = unique_jobs
        
        # Generate final statistics
        self._generate_final_statistics()
        
        self._log(f"🎉 Sequential scraping completed! Found {len(unique_jobs)} unique jobs from {total_sites} sites")
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
        """Save jobs to JSON and CSV files with comprehensive summary."""
        if not self.jobs:
            self._log("No jobs to save")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Generate comprehensive summary
        summary = self._generate_comprehensive_summary()
        
        # Save as JSON with summary
        json_filename = f"{filename_prefix}_{len(self.jobs)}_{timestamp}.json"
        output_data = {
            'summary': summary,
            'jobs': self.jobs,
            'metadata': {
                'total_jobs': len(self.jobs),
                'scraped_at': datetime.now().isoformat(),
                'sites_processed': len(self.site_configs),
                'version': '2.0_enhanced'
            }
        }
        
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        # Save as CSV
        csv_filename = f"{filename_prefix}_{len(self.jobs)}_{timestamp}.csv"
        if self.jobs:
            # Flatten the data for CSV
            flattened_jobs = []
            for job in self.jobs:
                flat_job = job.copy()
                
                # Remove problematic fields that can't be easily flattened
                fields_to_remove = ['missing_fields', 'location_warning', 'classification_confidence']
                for field in fields_to_remove:
                    flat_job.pop(field, None)
                
                # Flatten salary_parsed
                if 'salary_parsed' in flat_job:
                    salary_parsed = flat_job.pop('salary_parsed')
                    flat_job['salary_min'] = salary_parsed.get('min')
                    flat_job['salary_max'] = salary_parsed.get('max')
                    flat_job['salary_type'] = salary_parsed.get('type')
                    flat_job['salary_is_competitive'] = salary_parsed.get('is_competitive')
                
                # Flatten requirements_structured
                if 'requirements_structured' in flat_job:
                    reqs = flat_job.pop('requirements_structured')
                    flat_job['education_requirements'] = '; '.join(reqs.get('education', []))
                    flat_job['experience_requirements'] = '; '.join(reqs.get('experience', []))
                    flat_job['certification_requirements'] = '; '.join(reqs.get('certifications', []))
                    flat_job['skill_requirements'] = '; '.join(reqs.get('skills', []))
                
                # Flatten completeness_score
                if 'completeness_score' in flat_job:
                    completeness = flat_job.pop('completeness_score')
                    flat_job['completeness_required'] = completeness.get('required')
                    flat_job['completeness_optional'] = completeness.get('optional')
                    flat_job['completeness_overall'] = completeness.get('overall')
                
                flattened_jobs.append(flat_job)
            
            fieldnames = flattened_jobs[0].keys()
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(flattened_jobs)
        
        # Save summary separately
        summary_filename = f"{filename_prefix}_summary_{timestamp}.json"
        with open(summary_filename, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        self._log(f"💾 Saved {len(self.jobs)} jobs to {json_filename}, {csv_filename}, and {summary_filename}")
        self._log(f"📊 Summary: {summary['total_jobs']} jobs, {summary['unique_companies']} companies, {summary['data_quality']['average_completeness']:.1f}% completeness")
    
    def _generate_comprehensive_summary(self) -> Dict[str, Any]:
        """Generate comprehensive analysis of scraped job data."""
        if not self.jobs:
            return {}
        
        # Basic statistics
        total_jobs = len(self.jobs)
        unique_companies = len(set(job.get('company', '') for job in self.jobs))
        unique_locations = len(set(job.get('location', '') for job in self.jobs))
        
        # Salary analysis
        salary_stats = self._analyze_salary_data()
        
        # Job category analysis
        category_stats = self._analyze_job_categories()
        
        # Data quality analysis
        quality_stats = self._analyze_data_quality()
        
        # Platform analysis
        platform_stats = self._analyze_platforms()
        
        # Requirements analysis
        requirements_stats = self._analyze_requirements()
        
        # Location analysis
        location_stats = self._analyze_locations()
        
        return {
            'total_jobs': total_jobs,
            'unique_companies': unique_companies,
            'unique_locations': unique_locations,
            'salary_analysis': salary_stats,
            'job_categories': category_stats,
            'data_quality': quality_stats,
            'platforms': platform_stats,
            'requirements': requirements_stats,
            'locations': location_stats,
            'scraping_metadata': {
                'sites_processed': len(self.site_configs),
                'scraped_at': datetime.now().isoformat(),
                'version': '2.0_enhanced'
            }
        }
    
    def _analyze_salary_data(self) -> Dict[str, Any]:
        """Analyze salary data across all jobs."""
        salary_data = []
        competitive_count = 0
        
        for job in self.jobs:
            salary_parsed = job.get('salary_parsed', {})
            if salary_parsed.get('is_competitive'):
                competitive_count += 1
            elif salary_parsed.get('min') and salary_parsed.get('max'):
                salary_data.append({
                    'min': salary_parsed['min'],
                    'max': salary_parsed['max'],
                    'type': salary_parsed['type']
                })
        
        if not salary_data:
            return {'total_with_salary': 0, 'competitive_count': competitive_count}
        
        # Calculate statistics by type
        hourly_salaries = [s for s in salary_data if s['type'] == 'hourly']
        annual_salaries = [s for s in salary_data if s['type'] == 'annual']
        
        stats = {
            'total_with_salary': len(salary_data),
            'competitive_count': competitive_count,
            'salary_coverage': len(salary_data) / len(self.jobs) * 100
        }
        
        if hourly_salaries:
            hourly_mins = [s['min'] for s in hourly_salaries]
            hourly_maxs = [s['max'] for s in hourly_salaries]
            stats['hourly'] = {
                'count': len(hourly_salaries),
                'min_range': min(hourly_mins),
                'max_range': max(hourly_maxs),
                'avg_min': sum(hourly_mins) / len(hourly_mins),
                'avg_max': sum(hourly_maxs) / len(hourly_maxs)
            }
        
        if annual_salaries:
            annual_mins = [s['min'] for s in annual_salaries]
            annual_maxs = [s['max'] for s in annual_salaries]
            stats['annual'] = {
                'count': len(annual_salaries),
                'min_range': min(annual_mins),
                'max_range': max(annual_maxs),
                'avg_min': sum(annual_mins) / len(annual_mins),
                'avg_max': sum(annual_maxs) / len(annual_maxs)
            }
        
        return stats
    
    def _analyze_job_categories(self) -> Dict[str, Any]:
        """Analyze job categories and seniority levels."""
        categories = {}
        seniority_levels = {}
        remote_count = 0
        
        for job in self.jobs:
            category = job.get('job_category', 'other')
            seniority = job.get('seniority_level', 'entry')
            is_remote = job.get('is_remote', False)
            
            categories[category] = categories.get(category, 0) + 1
            seniority_levels[seniority] = seniority_levels.get(seniority, 0) + 1
            
            if is_remote:
                remote_count += 1
        
        return {
            'categories': categories,
            'seniority_levels': seniority_levels,
            'remote_jobs': remote_count,
            'remote_percentage': remote_count / len(self.jobs) * 100
        }
    
    def _analyze_data_quality(self) -> Dict[str, Any]:
        """Analyze data quality and completeness."""
        completeness_scores = []
        missing_fields = {}
        
        for job in self.jobs:
            completeness = job.get('completeness_score', {})
            if completeness:
                completeness_scores.append(completeness.get('overall', 0))
            
            missing = job.get('missing_fields', [])
            for field in missing:
                missing_fields[field] = missing_fields.get(field, 0) + 1
        
        return {
            'average_completeness': sum(completeness_scores) / len(completeness_scores) * 100 if completeness_scores else 0,
            'missing_fields': missing_fields,
            'high_quality_jobs': len([s for s in completeness_scores if s >= 0.8]),
            'low_quality_jobs': len([s for s in completeness_scores if s < 0.5])
        }
    
    def _analyze_platforms(self) -> Dict[str, Any]:
        """Analyze job distribution across platforms."""
        platforms = {}
        
        for job in self.jobs:
            platform = job.get('platform', 'unknown')
            platforms[platform] = platforms.get(platform, 0) + 1
        
        return platforms
    
    def _analyze_requirements(self) -> Dict[str, Any]:
        """Analyze requirements and certifications."""
        all_requirements = {'education': [], 'experience': [], 'certifications': [], 'skills': []}
        
        for job in self.jobs:
            reqs = job.get('requirements_structured', {})
            for category in all_requirements:
                all_requirements[category].extend(reqs.get(category, []))
        
        # Count most common requirements
        requirement_counts = {}
        for category, reqs in all_requirements.items():
            counts = Counter(reqs)
            requirement_counts[category] = dict(counts.most_common(10))
        
        return requirement_counts
    
    def _analyze_locations(self) -> Dict[str, Any]:
        """Analyze job locations and geographic distribution."""
        states = {}
        cities = {}
        
        for job in self.jobs:
            state = job.get('state', '')
            city = job.get('city', '')
            
            if state:
                states[state] = states.get(state, 0) + 1
            if city:
                cities[city] = cities.get(city, 0) + 1
        
        return {
            'states': dict(sorted(states.items(), key=lambda x: x[1], reverse=True)[:10]),
            'cities': dict(sorted(cities.items(), key=lambda x: x[1], reverse=True)[:10]),
            'jobs_with_location': len([j for j in self.jobs if j.get('state') or j.get('city')])
        }
    
    def _setup_driver_with_retry(self, max_retries: int = 3) -> bool:
        """Setup Chrome WebDriver with retry logic for resilience."""
        for attempt in range(max_retries):
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
                
                self.driver = uc.Chrome(options=chrome_options)
                self.wait = WebDriverWait(self.driver, 20)
                
                # Test the driver
                self.driver.get("https://www.google.com")
                time.sleep(2)
                
                self._log(f"✅ WebDriver setup successful on attempt {attempt + 1}")
                return True
                
            except Exception as e:
                self._log(f"❌ WebDriver setup failed on attempt {attempt + 1}: {e}")
                if self.driver:
                    try:
                        self.driver.quit()
                    except:
                        pass
                    self.driver = None
                
                if attempt < max_retries - 1:
                    time.sleep(random.uniform(2, 5))
        
        return False
    
    def _scrape_site_with_resilience(self, config: Dict, max_pages: int = 30, max_retries: int = 3) -> List[Dict]:
        """Scrape a single site with comprehensive error handling and retry logic."""
        site_jobs = []
        platform = self._detect_platform(config['search_url'])
        page_count = 0  # Initialize page_count at the beginning
        
        self._log(f"🏥 Starting resilient scraping of {config['source_site']} (Platform: {platform})")
        
        for attempt in range(max_retries):
            try:
                if not self.driver or not self.wait:
                    if not self._setup_driver_with_retry():
                        continue
                
                # Navigate to site with enhanced timeout handling
                try:
                    if not self.driver:
                        continue
                        
                    # Clear cookies and cache for fresh start
                    self.driver.delete_all_cookies()
                    
                    # Navigate with longer timeout
                    self.driver.set_page_load_timeout(30)
                    self.driver.get(config['search_url'])
                    
                    # Wait for page to load with multiple checks
                    time.sleep(random.uniform(4, 7))
                    
                    # Check if page loaded successfully
                    if self.wait:
                        try:
                            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
                        except TimeoutException:
                            self._log(f"⚠️ Body element not found for {config['source_site']}")
                            
                        # Wait for some content to load
                        try:
                            self.wait.until(lambda driver: len(driver.find_elements(By.TAG_NAME, "div")) > 5)
                        except TimeoutException:
                            self._log(f"⚠️ Page content not loading for {config['source_site']}")
                            
                except TimeoutException:
                    self._log(f"⚠️ Timeout loading {config['source_site']}, retrying...")
                    continue
                except Exception as e:
                    self._log(f"⚠️ Error loading {config['source_site']}: {e}")
                    continue
                
                # Check if page has any content
                try:
                    page_text = self.driver.find_element(By.TAG_NAME, "body").text
                    if len(page_text.strip()) < 100:
                        self._log(f"⚠️ Page seems empty for {config['source_site']}, retrying...")
                        continue
                except:
                    self._log(f"⚠️ Cannot read page content for {config['source_site']}")
                    continue
                
                # Scrape pages with pagination
                page_count = 0  # Reset page count for this attempt
                consecutive_empty_pages = 0
                previous_job_count = 0
                
                while page_count < max_pages:
                    page_count += 1
                    self._log(f"  📄 Page {page_count} of {config['source_site']}")
                    
                    try:
                        # Extract jobs from current page
                        page_jobs = self._extract_jobs_from_page(platform, config)
                        
                        if page_jobs:
                            # Check for duplicate jobs
                            new_jobs = []
                            for job in page_jobs:
                                job_id = job['id']
                                if not any(existing_job['id'] == job_id for existing_job in site_jobs):
                                    new_jobs.append(job)
                            
                            if new_jobs:
                                site_jobs.extend(new_jobs)
                                consecutive_empty_pages = 0
                                self._log(f"    ✅ Found {len(new_jobs)} new jobs on page {page_count} (total: {len(site_jobs)})")
                            else:
                                consecutive_empty_pages += 1
                                self._log(f"    ⚠️ No new jobs on page {page_count} (duplicates)")
                        else:
                            consecutive_empty_pages += 1
                            self._log(f"    ⚠️ No jobs found on page {page_count}")
                        
                        # Stop conditions
                        if consecutive_empty_pages >= 3:
                            self._log(f"    🛑 Stopping after {consecutive_empty_pages} consecutive empty pages")
                            break
                        
                        if len(site_jobs) == previous_job_count and page_count > 1:
                            self._log(f"    🛑 No progress, stopping pagination")
                            break
                        
                        previous_job_count = len(site_jobs)
                        
                        # Navigate to next page
                        if not self._navigate_to_next_page(platform):
                            self._log(f"    🏁 No more pages available")
                            break
                        
                        time.sleep(random.uniform(2, 4))
                        
                    except Exception as e:
                        self._log(f"    ❌ Error on page {page_count}: {e}")
                        consecutive_empty_pages += 1
                        if consecutive_empty_pages >= 3:
                            break
                        continue
                
                # Success - break out of retry loop
                break
                
            except Exception as e:
                self._log(f"❌ Error scraping {config['source_site']} (attempt {attempt + 1}): {e}")
                
                # Record error for analysis
                with self.lock:
                    self.scraping_stats['errors'].append({
                        'site': config['source_site'],
                        'error': str(e),
                        'attempt': attempt + 1,
                        'timestamp': datetime.now().isoformat()
                    })
                
                if attempt < max_retries - 1:
                    time.sleep(random.uniform(5, 10))
                    
                    # Reset driver for next attempt
                    if self.driver:
                        try:
                            self.driver.quit()
                        except:
                            pass
                        self.driver = None
        
        # Update statistics
        with self.lock:
            self.scraping_stats['sites_processed'] += 1
            if site_jobs:
                self.scraping_stats['sites_successful'] += 1
                self.scraping_stats['total_jobs_found'] += len(site_jobs)
            else:
                self.scraping_stats['sites_failed'] += 1
        
        self._log(f"✅ Completed {config['source_site']}: {len(site_jobs)} total jobs from {page_count} pages")
        return site_jobs
    
    def scrape_all_sites_parallel(self, max_sites: Optional[int] = None, max_pages_per_site: int = 30) -> List[Dict]:
        """Scrape all sites using parallel processing for improved performance."""
        self._log(f"🚀 Starting Enhanced Healthcare Job Scraping with Parallel Processing")
        self.scraping_stats['start_time'] = datetime.now()
        
        sites_to_process = self.site_configs[:max_sites] if max_sites else self.site_configs
        total_sites = len(sites_to_process)
        
        self._log(f"📋 Processing {total_sites} healthcare job sites with up to {max_pages_per_site} pages each")
        self._log(f"🔧 Using {self.max_workers} parallel workers")
        
        all_jobs = []
        
        # Use ThreadPoolExecutor for parallel processing with separate drivers
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all scraping tasks with separate driver instances
            future_to_site = {
                executor.submit(self._scrape_site_with_separate_driver, config, max_pages_per_site): config 
                for config in sites_to_process
            }
            
            # Process completed tasks
            for future in as_completed(future_to_site):
                config = future_to_site[future]
                try:
                    site_jobs = future.result()
                    all_jobs.extend(site_jobs)
                    
                    # Progress update
                    processed = self.scraping_stats['sites_processed']
                    success_rate = (self.scraping_stats['sites_successful'] / processed * 100) if processed > 0 else 0
                    
                    self._log(f"📊 Progress: {processed}/{total_sites} sites | "
                            f"Success: {success_rate:.1f}% | "
                            f"Jobs: {len(all_jobs)} | "
                            f"Errors: {len(self.scraping_stats['errors'])}")
                    
                except Exception as e:
                    self._log(f"❌ Exception in parallel processing for {config['source_site']}: {e}")
                    with self.lock:
                        self.scraping_stats['sites_failed'] += 1
        
        # Final processing
        unique_jobs = self._remove_duplicates(all_jobs)
        self.jobs = unique_jobs
        
        # Generate final statistics
        self._generate_final_statistics()
        
        self._log(f"🎉 Parallel scraping completed! Found {len(unique_jobs)} unique jobs from {total_sites} sites")
        return unique_jobs
    
    def _scrape_site_with_separate_driver(self, config: Dict, max_pages: int = 30) -> List[Dict]:
        """Scrape a single site with its own separate WebDriver instance."""
        site_jobs = []
        platform = self._detect_platform(config['search_url'])
        page_count = 0
        driver = None
        
        try:
            # Create a separate driver instance for this site
            driver = self._create_separate_driver()
            if not driver:
                self._log(f"❌ Failed to create driver for {config['source_site']}")
                return site_jobs
            
            self._log(f"🏥 Starting separate driver scraping of {config['source_site']} (Platform: {platform})")
            
            # Navigate to site
            try:
                driver.set_page_load_timeout(30)
                driver.get(config['search_url'])
                time.sleep(random.uniform(4, 7))
                
                # Check if page loaded
                page_text = driver.find_element(By.TAG_NAME, "body").text
                if len(page_text.strip()) < 100:
                    self._log(f"⚠️ Page seems empty for {config['source_site']}")
                    return site_jobs
                    
            except Exception as e:
                self._log(f"⚠️ Error loading {config['source_site']}: {e}")
                return site_jobs
            
            # Scrape pages with pagination
            consecutive_empty_pages = 0
            previous_job_count = 0
            
            while page_count < max_pages:
                page_count += 1
                self._log(f"  📄 Page {page_count} of {config['source_site']}")
                
                try:
                    # Extract jobs from current page using the separate driver
                    page_jobs = self._extract_jobs_from_page_with_driver(driver, platform, config)
                    
                    if page_jobs:
                        # Check for duplicate jobs
                        new_jobs = []
                        for job in page_jobs:
                            job_id = job['id']
                            if not any(existing_job['id'] == job_id for existing_job in site_jobs):
                                new_jobs.append(job)
                        
                        if new_jobs:
                            site_jobs.extend(new_jobs)
                            consecutive_empty_pages = 0
                            self._log(f"    ✅ Found {len(new_jobs)} new jobs on page {page_count} (total: {len(site_jobs)})")
                        else:
                            consecutive_empty_pages += 1
                            self._log(f"    ⚠️ No new jobs on page {page_count} (duplicates)")
                    else:
                        consecutive_empty_pages += 1
                        self._log(f"    ⚠️ No jobs found on page {page_count}")
                    
                    # Stop conditions
                    if consecutive_empty_pages >= 3:
                        self._log(f"    🛑 Stopping after {consecutive_empty_pages} consecutive empty pages")
                        break
                    
                    if len(site_jobs) == previous_job_count and page_count > 1:
                        self._log(f"    🛑 No progress, stopping pagination")
                        break
                    
                    previous_job_count = len(site_jobs)
                    
                    # Navigate to next page
                    if not self._navigate_to_next_page_with_driver(driver, platform):
                        self._log(f"    🏁 No more pages available")
                        break
                    
                    time.sleep(random.uniform(2, 4))
                    
                except Exception as e:
                    self._log(f"    ❌ Error on page {page_count}: {e}")
                    consecutive_empty_pages += 1
                    if consecutive_empty_pages >= 3:
                        break
                    continue
            
            # Update statistics
            with self.lock:
                self.scraping_stats['sites_processed'] += 1
                if site_jobs:
                    self.scraping_stats['sites_successful'] += 1
                    self.scraping_stats['total_jobs_found'] += len(site_jobs)
                else:
                    self.scraping_stats['sites_failed'] += 1
            
            self._log(f"✅ Completed {config['source_site']}: {len(site_jobs)} total jobs from {page_count} pages")
            
        except Exception as e:
            self._log(f"❌ Error scraping {config['source_site']}: {e}")
            with self.lock:
                self.scraping_stats['sites_failed'] += 1
                self.scraping_stats['errors'].append({
                    'site': config['source_site'],
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                })
        
        finally:
            # Clean up the separate driver
            if driver:
                try:
                    driver.quit()
                except:
                    pass
        
        return site_jobs
    
    def _create_separate_driver(self):
        """Create a separate WebDriver instance for parallel processing."""
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
            
            # Use a different port to avoid conflicts
            chrome_options.add_argument("--remote-debugging-port=0")
            
            # Use webdriver-manager for better chromedriver management
            try:
                service = Service(ChromeDriverManager().install())
                driver = uc.Chrome(service=service, options=chrome_options)
                return driver
            except Exception as e:
                self._log(f"⚠️ webdriver-manager failed for separate driver, trying fallback: {e}")
                # Fallback to undetected_chromedriver
                driver = uc.Chrome(options=chrome_options)
                return driver
                
        except Exception as e:
            self._log(f"❌ Failed to create separate driver: {e}")
            return None
    
    def _extract_jobs_from_page_with_driver(self, driver, platform: str, config: Dict) -> List[Dict]:
        """Extract jobs from current page using a specific driver instance."""
        jobs = []
        platform_config = self.platform_configs.get(platform, self.platform_configs['custom'])
        
        if not driver:
            return jobs
        
        # Find job containers with enhanced detection
        job_containers = []
        
        # Method 1: Try platform-specific selectors
        for selector in platform_config['job_container'].split(', '):
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    # Filter for healthcare-related jobs
                    healthcare_elements = []
                    for elem in elements:
                        elem_text = elem.text.lower()
                        healthcare_keywords = ['nurse', 'nursing', 'care', 'aide', 'assistant', 'therapist', 
                                             'coordinator', 'caregiver', 'cna', 'rn', 'lpn', 'medical',
                                             'healthcare', 'health care', 'patient', 'clinical', 'rehab',
                                             'therapy', 'social worker', 'director', 'manager', 'supervisor',
                                             'dietary', 'housekeeping', 'maintenance', 'receptionist']
                        if any(keyword in elem_text for keyword in healthcare_keywords) or len(elem_text) < 100:
                            healthcare_elements.append(elem)
                    
                    if healthcare_elements:
                        job_containers = healthcare_elements
                        self._log(f"Found {len(healthcare_elements)} healthcare job containers with selector: {selector}")
                        break
            except Exception as e:
                self._log(f"Error with selector {selector}: {e}", "DEBUG")
                continue
        
        # Method 2: Fallback to generic job detection
        if not job_containers:
            try:
                # Look for common job listing patterns
                generic_selectors = [
                    'tr', 'div', 'li', 'article', 'section',
                    '[class*="job"]', '[class*="position"]', '[class*="career"]',
                    '[class*="listing"]', '[class*="post"]', '[class*="opening"]'
                ]
                
                for selector in generic_selectors:
                    try:
                        elements = driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            # Filter elements that might be job listings
                            potential_jobs = []
                            for elem in elements:
                                elem_text = elem.text.strip()
                                if (len(elem_text) > 20 and len(elem_text) < 2000 and 
                                    any(x in elem_text.lower() for x in ['nurse', 'care', 'aide', 'assistant', 'therapist', 'coordinator'])):
                                    potential_jobs.append(elem)
                            
                            if potential_jobs:
                                job_containers = potential_jobs
                                self._log(f"Found {len(potential_jobs)} potential job containers with generic selector: {selector}")
                                break
                    except:
                        continue
            except Exception as e:
                self._log(f"Error with generic selectors: {e}", "DEBUG")
        
        # Method 3: Last resort - look for any elements with job-related text
        if not job_containers:
            try:
                # Get all text elements and look for job patterns
                all_elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'nurse') or contains(text(), 'care') or contains(text(), 'aide') or contains(text(), 'assistant')]")
                if all_elements:
                    # Group elements by their parent containers
                    containers = set()
                    for elem in all_elements:
                        try:
                            parent = elem.find_element(By.XPATH, "./..")
                            containers.add(parent)
                        except:
                            continue
                    
                    if containers:
                        job_containers = list(containers)
                        self._log(f"Found {len(job_containers)} job containers using text-based detection")
            except Exception as e:
                self._log(f"Error with text-based detection: {e}", "DEBUG")
        
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
    
    def _navigate_to_next_page_with_driver(self, driver, platform: str) -> bool:
        """Navigate to next page using a specific driver instance."""
        if not driver:
            return False
        
        platform_config = self.platform_configs.get(platform, self.platform_configs['custom'])
        
        try:
            # Try to find and click next button
            for selector in platform_config['next_button'].split(', '):
                try:
                    next_button = driver.find_element(By.CSS_SELECTOR, selector)
                    if next_button.is_enabled() and next_button.is_displayed():
                        driver.execute_script("arguments[0].click();", next_button)
                        time.sleep(random.uniform(2, 4))
                        return True
                except:
                    continue
            
            # Try JavaScript navigation
            try:
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)
                
                # Look for "Load More" or similar buttons
                load_more_selectors = [
                    '[class*="load"]', '[class*="more"]', '[class*="next"]',
                    'button:contains("Load More")', 'button:contains("Show More")',
                    'a:contains("Next")', 'a:contains("More")'
                ]
                
                for selector in load_more_selectors:
                    try:
                        button = driver.find_element(By.CSS_SELECTOR, selector)
                        if button.is_enabled() and button.is_displayed():
                            driver.execute_script("arguments[0].click();", button)
                            time.sleep(random.uniform(2, 4))
                            return True
                    except:
                        continue
            except:
                pass
            
            return False
            
        except Exception as e:
            self._log(f"Error navigating to next page: {e}", "DEBUG")
            return False
    
    def _generate_final_statistics(self):
        """Generate comprehensive final statistics."""
        if not self.scraping_stats['start_time']:
            return
        
        end_time = datetime.now()
        duration = end_time - self.scraping_stats['start_time']
        
        self.scraping_stats.update({
            'end_time': end_time.isoformat(),
            'duration_seconds': duration.total_seconds(),
            'duration_formatted': str(duration),
            'jobs_per_minute': len(self.jobs) / (duration.total_seconds() / 60) if duration.total_seconds() > 0 else 0,
            'success_rate': (self.scraping_stats['sites_successful'] / self.scraping_stats['sites_processed'] * 100) if self.scraping_stats['sites_processed'] > 0 else 0
        })
    
    def get_scraping_progress(self) -> Dict[str, Any]:
        """Get current scraping progress and statistics."""
        if not self.scraping_stats['start_time']:
            return {'status': 'not_started'}
        
        current_time = datetime.now()
        elapsed = current_time - self.scraping_stats['start_time']
        
        return {
            'status': 'in_progress',
            'current_site': self.scraping_stats['current_site'],
            'sites_processed': self.scraping_stats['sites_processed'],
            'sites_successful': self.scraping_stats['sites_successful'],
            'sites_failed': self.scraping_stats['sites_failed'],
            'total_jobs_found': self.scraping_stats['total_jobs_found'],
            'elapsed_time': str(elapsed),
            'errors_count': len(self.scraping_stats['errors']),
            'success_rate': (self.scraping_stats['sites_successful'] / self.scraping_stats['sites_processed'] * 100) if self.scraping_stats['sites_processed'] > 0 else 0
        }
    
    def save_scraping_state(self, filename: str = "scraping_state.json"):
        """Save current scraping state for potential resume."""
        state = {
            'scraping_stats': self.scraping_stats,
            'jobs_count': len(self.jobs),
            'saved_at': datetime.now().isoformat()
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
        
        self._log(f"💾 Scraping state saved to {filename}")
    
    def _log(self, message: str, level: str = "INFO"):
        """Log message with timestamp."""
        if level == "DEBUG" and not self.debug:
            return
        getattr(logger, level.lower())(message)
    
    def export_to_multiple_formats(self, base_filename: str = "enhanced_healthcare_jobs"):
        """Export jobs to multiple formats for different use cases."""
        if not self.jobs:
            self._log("No jobs to export")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 1. Full JSON with all data
        full_json_filename = f"{base_filename}_full_{len(self.jobs)}_{timestamp}.json"
        with open(full_json_filename, 'w', encoding='utf-8') as f:
            json.dump(self.jobs, f, indent=2, ensure_ascii=False)
        
        # 2. Simplified JSON for API consumption
        simplified_jobs = []
        for job in self.jobs:
            simplified_job = {
                'id': job.get('id'),
                'title': job.get('title'),
                'company': job.get('company'),
                'location': job.get('location'),
                'city': job.get('city'),
                'state': job.get('state'),
                'zip_code': job.get('zip_code'),
                'salary_min': job.get('salary_parsed', {}).get('min'),
                'salary_max': job.get('salary_parsed', {}).get('max'),
                'salary_type': job.get('salary_parsed', {}).get('type'),
                'shift_type': job.get('shift_type'),
                'job_category': job.get('job_category'),
                'seniority_level': job.get('seniority_level'),
                'is_remote': job.get('is_remote'),
                'url': job.get('url'),
                'application_url': job.get('application_url'),
                'platform': job.get('platform'),
                'scraped_at': job.get('scraped_at')
            }
            simplified_jobs.append(simplified_job)
        
        simple_json_filename = f"{base_filename}_simple_{len(self.jobs)}_{timestamp}.json"
        with open(simple_json_filename, 'w', encoding='utf-8') as f:
            json.dump(simplified_jobs, f, indent=2, ensure_ascii=False)
        
        # 3. Excel-compatible CSV
        csv_filename = f"{base_filename}_{len(self.jobs)}_{timestamp}.csv"
        self.save_jobs(base_filename)  # This already creates the CSV
        
        # 4. High-quality jobs only (completeness score > 0.8)
        high_quality_jobs = [
            job for job in self.jobs 
            if job.get('completeness_score', {}).get('overall', 0) > 0.8
        ]
        
        if high_quality_jobs:
            hq_filename = f"{base_filename}_high_quality_{len(high_quality_jobs)}_{timestamp}.json"
            with open(hq_filename, 'w', encoding='utf-8') as f:
                json.dump(high_quality_jobs, f, indent=2, ensure_ascii=False)
        
        # 5. Jobs with salary information
        jobs_with_salary = [
            job for job in self.jobs 
            if job.get('salary_parsed', {}).get('min') or job.get('salary_parsed', {}).get('is_competitive')
        ]
        
        if jobs_with_salary:
            salary_filename = f"{base_filename}_with_salary_{len(jobs_with_salary)}_{timestamp}.json"
            with open(salary_filename, 'w', encoding='utf-8') as f:
                json.dump(jobs_with_salary, f, indent=2, ensure_ascii=False)
        
        self._log(f"📁 Exported {len(self.jobs)} jobs to multiple formats:")
        self._log(f"   📄 Full data: {full_json_filename}")
        self._log(f"   📄 Simple data: {simple_json_filename}")
        self._log(f"   📊 CSV: {csv_filename}")
        if high_quality_jobs:
            self._log(f"   ⭐ High quality: {hq_filename}")
        if jobs_with_salary:
            self._log(f"   💰 With salary: {salary_filename}")
    
    def get_quality_insights(self) -> Dict[str, Any]:
        """Get detailed quality insights and recommendations."""
        if not self.jobs:
            return {}
        
        insights = {
            'overall_quality': {},
            'field_completeness': {},
            'data_quality_issues': [],
            'recommendations': []
        }
        
        # Overall quality metrics
        completeness_scores = [job.get('completeness_score', {}).get('overall', 0) for job in self.jobs]
        insights['overall_quality'] = {
            'average_completeness': sum(completeness_scores) / len(completeness_scores) * 100,
            'high_quality_jobs': len([s for s in completeness_scores if s >= 0.8]),
            'medium_quality_jobs': len([s for s in completeness_scores if 0.5 <= s < 0.8]),
            'low_quality_jobs': len([s for s in completeness_scores if s < 0.5])
        }
        
        # Field completeness analysis
        fields = ['title', 'company', 'location', 'salary', 'shift_type', 'requirements', 'benefits', 'application_url']
        for field in fields:
            count = sum(1 for job in self.jobs if job.get(field))
            insights['field_completeness'][field] = {
                'count': count,
                'percentage': count / len(self.jobs) * 100
            }
        
        # Identify common issues
        missing_salary = len([j for j in self.jobs if not j.get('salary')])
        missing_location = len([j for j in self.jobs if not j.get('city') and not j.get('state')])
        missing_requirements = len([j for j in self.jobs if not j.get('requirements')])
        
        if missing_salary > len(self.jobs) * 0.5:
            insights['data_quality_issues'].append(f"High percentage of jobs missing salary ({missing_salary}/{len(self.jobs)})")
        
        if missing_location > len(self.jobs) * 0.3:
            insights['data_quality_issues'].append(f"Many jobs missing location ({missing_location}/{len(self.jobs)})")
        
        if missing_requirements > len(self.jobs) * 0.4:
            insights['data_quality_issues'].append(f"Many jobs missing requirements ({missing_requirements}/{len(self.jobs)})")
        
        # Generate recommendations
        if insights['overall_quality']['average_completeness'] < 70:
            insights['recommendations'].append("Consider improving selectors for better data extraction")
        
        if missing_salary > len(self.jobs) * 0.5:
            insights['recommendations'].append("Focus on sites that typically include salary information")
        
        if len(self.scraping_stats.get('errors', [])) > 10:
            insights['recommendations'].append("Review and fix common scraping errors for better success rate")
        
        return insights
    
    def print_comprehensive_report(self):
        """Print a comprehensive report of the scraping results."""
        if not self.jobs:
            print("❌ No jobs to report")
            return
        
        print("\n" + "="*80)
        print("🎯 ENHANCED HEALTHCARE JOB SCRAPER - COMPREHENSIVE REPORT")
        print("="*80)
        
        # Basic statistics
        print(f"\n📊 BASIC STATISTICS:")
        print(f"   Total Jobs Found: {len(self.jobs):,}")
        print(f"   Unique Companies: {len(set(job.get('company', '') for job in self.jobs))}")
        print(f"   Unique Locations: {len(set(job.get('location', '') for job in self.jobs))}")
        
        # Scraping performance
        if self.scraping_stats.get('start_time'):
            print(f"\n⚡ SCRAPING PERFORMANCE:")
            print(f"   Sites Processed: {self.scraping_stats.get('sites_processed', 0)}")
            print(f"   Success Rate: {self.scraping_stats.get('success_rate', 0):.1f}%")
            print(f"   Duration: {self.scraping_stats.get('duration_formatted', 'N/A')}")
            print(f"   Jobs per Minute: {self.scraping_stats.get('jobs_per_minute', 0):.1f}")
        
        # Data quality
        quality_insights = self.get_quality_insights()
        print(f"\n🔍 DATA QUALITY:")
        print(f"   Average Completeness: {quality_insights.get('overall_quality', {}).get('average_completeness', 0):.1f}%")
        print(f"   High Quality Jobs: {quality_insights.get('overall_quality', {}).get('high_quality_jobs', 0)}")
        print(f"   Low Quality Jobs: {quality_insights.get('overall_quality', {}).get('low_quality_jobs', 0)}")
        
        # Job categories
        categories = Counter(job.get('job_category', 'other') for job in self.jobs)
        print(f"\n🏥 JOB CATEGORIES:")
        for category, count in categories.most_common():
            print(f"   {category.title()}: {count} jobs ({count/len(self.jobs)*100:.1f}%)")
        
        # Salary analysis
        salary_stats = self._analyze_salary_data()
        if salary_stats.get('total_with_salary', 0) > 0:
            print(f"\n💰 SALARY ANALYSIS:")
            print(f"   Jobs with Salary: {salary_stats['total_with_salary']} ({salary_stats['salary_coverage']:.1f}%)")
            print(f"   Competitive Salary: {salary_stats['competitive_count']}")
            
            if 'hourly' in salary_stats:
                hourly = salary_stats['hourly']
                print(f"   Hourly Range: ${hourly['min_range']}-${hourly['max_range']}")
                print(f"   Average Hourly: ${hourly['avg_min']:.1f}-${hourly['avg_max']:.1f}")
            
            if 'annual' in salary_stats:
                annual = salary_stats['annual']
                print(f"   Annual Range: ${annual['min_range']:,}-${annual['max_range']:,}")
                print(f"   Average Annual: ${annual['avg_min']:,.0f}-${annual['avg_max']:,.0f}")
        
        # Platform distribution
        platforms = Counter(job.get('platform', 'unknown') for job in self.jobs)
        print(f"\n🔧 PLATFORM DISTRIBUTION:")
        for platform, count in platforms.most_common():
            print(f"   {platform.title()}: {count} jobs ({count/len(self.jobs)*100:.1f}%)")
        
        # Top locations
        locations = self._analyze_locations()
        print(f"\n📍 TOP LOCATIONS:")
        for state, count in list(locations.get('states', {}).items())[:5]:
            print(f"   {state}: {count} jobs")
        
        # Quality insights
        if quality_insights.get('data_quality_issues'):
            print(f"\n⚠️  DATA QUALITY ISSUES:")
            for issue in quality_insights['data_quality_issues']:
                print(f"   • {issue}")
        
        if quality_insights.get('recommendations'):
            print(f"\n💡 RECOMMENDATIONS:")
            for rec in quality_insights['recommendations']:
                print(f"   • {rec}")
        
        print("\n" + "="*80)

def main():
    """Main function to run the enhanced healthcare job scraper."""
    print("🚀 Enhanced Comprehensive Healthcare Job Scraper v2.2")
    print("=" * 60)
    
    # Initialize scraper
    scraper = EnhancedHealthcareScraper(
        headless=True,
        debug=True,
        max_workers=1  # Use single worker for sequential processing
    )
    
    try:
        # Use sequential scraping for better stability
        jobs = scraper.scrape_all_sites()
        
        if jobs:
            print(f"\n🎉 Scraping completed successfully!")
            print(f"📊 Found {len(jobs)} unique jobs")
            
            # Export results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            base_filename = f"enhanced_healthcare_jobs_{len(jobs)}_{timestamp}"
            
            scraper.export_to_multiple_formats(base_filename)
            scraper.print_comprehensive_report()
            
        else:
            print("⚠️ No jobs found")
            
    except KeyboardInterrupt:
        print("\n⚠️ Scraping interrupted by user")
    except Exception as e:
        print(f"❌ Error during scraping: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Cleanup
        if scraper.driver:
            try:
                scraper.driver.quit()
            except:
                pass

if __name__ == "__main__":
    main() 