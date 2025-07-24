#!/usr/bin/env python3
"""
Ultimate Apploi Scraper with Enhanced Data Extraction and Parsing
"""

import os
import csv
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

class UltimateApploiScraper:
    """Ultimate scraper with enhanced data extraction and parsing."""
    
    def __init__(self, headless: bool = True, debug: bool = False, max_jobs_per_site: int = 15):
        """Initialize the ultimate scraper."""
        self.headless = headless
        self.debug = debug
        self.max_jobs_per_site = max_jobs_per_site
        self.driver = None
        self.site_configs = []
        self.scraping_stats = {
            'total_sites': 0,
            'successful_sites': 0,
            'failed_sites': 0,
            'total_jobs': 0,
            'jobs_with_details': 0,
            'jobs_with_salary': 0,
            'jobs_with_description': 0,
            'errors': [],
            'warnings': [],
            'webdriver_restarts': 0
        }
        
        # Load optimized site configurations
        self._load_optimized_configs()
        
        # Setup initial WebDriver
        if not self._setup_driver():
            raise Exception("Failed to setup initial WebDriver")
    
    def _load_optimized_configs(self):
        """Load optimized site configurations."""
        try:
            if os.path.exists('optimized_site_configs.json'):
                with open('optimized_site_configs.json', 'r') as f:
                    configs = json.load(f)
                
                # Filter out problematic URLs
                for config in configs:
                    if config.get('search_url') and any(tracker in config['search_url'].lower() 
                                                       for tracker in ['doubleclick', 'adsrvr', 'googleadservices', 'td.doubleclick', 'youtube.com']):
                        config['search_url'] = config['original_url']
                
                self.site_configs = configs
                logger.info(f"✅ Loaded {len(self.site_configs)} optimized site configurations")
            else:
                logger.warning("❌ optimized_site_configs.json not found, using fallback")
                self._load_fallback_configs()
        except Exception as e:
            logger.error(f"❌ Error loading optimized configs: {e}")
            self._load_fallback_configs()
    
    def _load_fallback_configs(self):
        """Load fallback configurations from CSV."""
        configs = []
        try:
            with open('ct_only.csv', 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get('search_url') and row.get('source_site'):
                        configs.append({
                            'source_site': row['source_site'],
                            'search_url': row['search_url'],
                            'job_board_type': row.get('job board type', '').lower(),
                            'priority': 'medium_priority',
                            'estimated_jobs': 10
                        })
            self.site_configs = configs
            logger.info(f"✅ Loaded {len(self.site_configs)} fallback configurations")
        except Exception as e:
            logger.error(f"❌ Error loading fallback configs: {e}")
            self.site_configs = []
    
    def _setup_driver(self) -> bool:
        """Setup WebDriver for scraping."""
        logger.info("🔧 Setting up WebDriver...")
        
        try:
            if self.driver:
                try:
                    self.driver.quit()
                except:
                    pass
            
            chrome_options = uc.ChromeOptions()
            
            if self.headless:
                chrome_options.add_argument("--headless=new")
            
            # Performance options
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--disable-plugins")
            chrome_options.add_argument("--disable-images")
            
            user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            chrome_options.add_argument(f"--user-agent={user_agent}")
            
            try:
                service = Service(ChromeDriverManager().install())
                self.driver = uc.Chrome(service=service, options=chrome_options)
            except Exception as e:
                self.driver = uc.Chrome(options=chrome_options)
            
            self.driver.get("https://www.google.com")
            time.sleep(2)
            logger.info("✅ WebDriver setup successful")
            return True
            
        except Exception as e:
            logger.error(f"❌ WebDriver setup failed: {e}")
            return False
    
    def _restart_driver_if_needed(self) -> bool:
        """Restart WebDriver if it's not responding."""
        try:
            self.driver.current_url
            return True
        except Exception as e:
            logger.warning(f"⚠️ WebDriver not responsive, restarting: {e}")
            self.scraping_stats['webdriver_restarts'] += 1
            return self._setup_driver()
    
    def _scrape_site_with_recovery(self, config: Dict) -> List[Dict]:
        """Scrape a single site with WebDriver recovery."""
        jobs = []
        site_name = config['source_site']
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                if not self._restart_driver_if_needed():
                    logger.error(f"  ❌ Failed to restart WebDriver for {site_name}")
                    break
                
                handler = self._get_job_board_handler(config.get('job_board_type', 'unknown'))
                jobs = handler(config)
                
                if jobs:
                    logger.info(f"  ✅ Successfully extracted {len(jobs)} jobs from {site_name}")
                    break
                else:
                    logger.warning(f"  ⚠️ No jobs found on {site_name} (attempt {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        time.sleep(5)
                
            except Exception as e:
                logger.error(f"  ❌ Error scraping {site_name} (attempt {attempt + 1}/{max_retries}): {e}")
                self.scraping_stats['errors'].append({
                    'site': site_name,
                    'error': str(e),
                    'url': config['search_url'],
                    'attempt': attempt + 1
                })
                
                if attempt < max_retries - 1:
                    logger.info(f"  🔄 Retrying {site_name} in 5 seconds...")
                    time.sleep(5)
                else:
                    logger.error(f"  ❌ Failed to scrape {site_name} after {max_retries} attempts")
        
        return jobs
    
    def _get_job_board_handler(self, job_board_type: str):
        """Get the appropriate handler for a job board type."""
        handlers = {
            'apploi': self._scrape_apploi_site,
            'icims': self._scrape_generic_site,
            'paycom': self._scrape_generic_site,
            'dayforce': self._scrape_generic_site,
            'adp': self._scrape_generic_site,
            'hireology': self._scrape_generic_site,
            'ultipro': self._scrape_generic_site,
            'paylocity': self._scrape_generic_site,
            'applicantpool': self._scrape_generic_site,
            'oracle': self._scrape_generic_site
        }
        return handlers.get(job_board_type, self._scrape_generic_site)
    
    def _scrape_apploi_site(self, config: Dict) -> List[Dict]:
        """Scrape Apploi-based sites with enhanced data extraction."""
        jobs = []
        site_name = config['source_site']
        
        logger.info(f"🔍 Scraping Apploi site: {site_name}")
        
        try:
            self.driver.get(config['search_url'])
            time.sleep(5)
            
            iframe_found = self._switch_to_iframe_if_needed()
            if iframe_found:
                logger.info("  ✅ Switched to iframe for job content")
            
            job_listings = self._extract_job_listings(config)
            
            if job_listings:
                logger.info(f"    📋 Found {len(job_listings)} job listings")
                
                jobs_to_process = job_listings[:self.max_jobs_per_site]
                logger.info(f"    🎯 Processing {len(jobs_to_process)} jobs (limited to {self.max_jobs_per_site} per site)")
                
                for i, job in enumerate(jobs_to_process, 1):
                    if job.get('job_url'):
                        logger.debug(f"      🔍 Extracting details for job {i}/{len(jobs_to_process)}: {job.get('title', 'Unknown')}")
                        detailed_job = self._extract_job_details(job, config)
                        if detailed_job:
                            jobs.append(detailed_job)
                            self.scraping_stats['jobs_with_details'] += 1
                        else:
                            jobs.append(job)
                    else:
                        jobs.append(job)
                    
                    time.sleep(1)
                
                remaining_jobs = job_listings[self.max_jobs_per_site:]
                if remaining_jobs:
                    logger.info(f"    📝 Adding {len(remaining_jobs)} additional jobs without detailed extraction")
                    jobs.extend(remaining_jobs)
            
            logger.info(f"  ✅ Found {len(jobs)} jobs on {site_name} ({self.scraping_stats['jobs_with_details']} with details)")
            
        except Exception as e:
            logger.error(f"  ❌ Error scraping {site_name}: {e}")
            self.scraping_stats['errors'].append({
                'site': site_name,
                'error': str(e),
                'url': config['search_url']
            })
        
        return jobs
    
    def _scrape_generic_site(self, config: Dict) -> List[Dict]:
        """Scrape generic sites."""
        return self._scrape_apploi_site(config)
    
    def _switch_to_iframe_if_needed(self) -> bool:
        """Switch to iframe if job content is in iframe."""
        try:
            iframes = self.driver.find_elements(By.TAG_NAME, 'iframe')
            
            for iframe in iframes:
                try:
                    src = iframe.get_attribute('src') or ''
                    
                    if any(skip_domain in src.lower() for skip_domain in [
                        'youtube.com', 'google.com/recaptcha', 'doubleclick.net',
                        'adsrvr.org', 'brandcdn.com', 'jometer.com', 'about:blank'
                    ]):
                        continue
                    
                    self.driver.switch_to.frame(iframe)
                    
                    job_indicators = self.driver.find_elements(By.CSS_SELECTOR, 
                        '.job, .career, .position, .employment, [class*="job"], [class*="career"]')
                    
                    if job_indicators:
                        logger.debug(f"    ✅ Found job content in iframe: {src[:50]}...")
                        return True
                    
                    self.driver.switch_to.default_content()
                    
                except Exception as e:
                    logger.debug(f"    ⚠️ Error checking iframe: {e}")
                    self.driver.switch_to.default_content()
                    continue
            
            return False
            
        except Exception as e:
            logger.debug(f"    ⚠️ Error switching to iframe: {e}")
            return False
    
    def _extract_job_listings(self, config: Dict) -> List[Dict]:
        """Extract job listings from the main page."""
        jobs = []
        site_name = config['source_site']
        
        try:
            js_script = """
            function extractJobListings() {
                const jobs = [];
                const selectors = [
                    '.position', '.job_listings', '.job-card', '.job-listing', '.job-item', '.job-posting',
                    '[data-testid="job-card"]', '[data-testid="job-item"]', '.career-item', '.position-card',
                    '.position-item', 'article[class*="job"]', 'section[class*="job"]', 'li[class*="job"]',
                    'div[class*="job-card"]', '.search-result', '.result-item', '.listing-item',
                    '[data-job-id]', '[data-position-id]', '[class*="JobCard"]', '[class*="JobItem"]',
                    '[class*="JobListing"]', '[class*="CareerCard"]', '[class*="CareerItem"]',
                    '[class*="PositionCard"]', '[class*="PositionItem"]', '.jobs-card', '[class*="job"]',
                    '[class*="career"]', '[class*="position"]', '[id*="job"]', '[id*="career"]',
                    '[id*="position"]', 'article', 'section', 'div[class*="card"]', 'div[class*="item"]',
                    'li', 'tr', '.listing', '.result', '[class*="listing"]', '[class*="result"]',
                    '[class*="posting"]', '[class*="opening"]', 'a[href*="job"]', 'a[href*="career"]',
                    'a[href*="position"]', '.job-search-result', '.career-search-result',
                    'tr[data-job-id]', 'div[class*="job"]', '.search-result-item', '.job-opportunity',
                    '.career-opportunity', '.job-opening', '.position-opening', '.job-posting',
                    '.career-posting', '.card', '.item', '.listing', '.result', '.posting', '.opening',
                    'div[class*="Card"]', 'div[class*="Item"]', 'div[class*="Listing"]',
                    'div[class*="Result"]', 'div[class*="Posting"]', 'div[class*="Opening"]',
                    '[class*="Apploi"]', '[class*="JobBoard"]', '[class*="CareerBoard"]',
                    '[data-apploi]', '[data-job-board]', '[data-career-board]'
                ];
                
                for (let selector of selectors) {
                    const containers = document.querySelectorAll(selector);
                    for (let container of containers) {
                        try {
                            const jobData = {
                                title: '',
                                company: arguments[1],
                                location: '',
                                description: '',
                                job_url: '',
                                job_type: '',
                                salary: '',
                                date_posted: '',
                                city: '',
                                state: 'CT',
                                zip_code: '',
                                source_url: arguments[0],
                                scraped_at: new Date().toISOString()
                            };
                            
                            // Extract title
                            const titleSelectors = [
                                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                                '.job-title', '.position-title', '.title', '[class*="title"]', 
                                'a[href*="job"]', 'strong', 'b', '.job-name', '.position-name',
                                '[data-testid="job-title"]', '[data-testid="position-title"]'
                            ];
                            
                            for (let titleSel of titleSelectors) {
                                const titleEl = container.querySelector(titleSel);
                                if (titleEl && titleEl.textContent && titleEl.textContent.trim().length > 3) {
                                    jobData.title = titleEl.textContent.trim();
                                    break;
                                }
                            }
                            
                            // Extract job URL
                            const links = container.querySelectorAll('a[href]');
                            for (let link of links) {
                                const href = link.getAttribute('href');
                                if (href) {
                                    if (href.includes('jobs.apploi.com') || 
                                        href.includes('apploi.com') ||
                                        href.includes('/job/') || 
                                        href.includes('/career/') || 
                                        href.includes('/position/') ||
                                        href.includes('job') || 
                                        href.includes('career') || 
                                        href.includes('position') ||
                                        (href.startsWith('/') && (href.includes('job') || href.includes('career') || href.includes('position'))) ||
                                        href.includes('apply') ||
                                        href.includes('posting') ||
                                        href.includes('opening')) {
                                        jobData.job_url = href.startsWith('http') ? href : window.location.origin + href;
                                        break;
                                    }
                                }
                            }
                            
                            // Extract basic location
                            const locationSelectors = [
                                '.location', '.job-location', '.position-location', 
                                '.address', '.city', '.state', '[class*="location"]'
                            ];
                            
                            for (let locSel of locationSelectors) {
                                const locEl = container.querySelector(locSel);
                                if (locEl && locEl.textContent && locEl.textContent.trim().length > 2) {
                                    jobData.location = locEl.textContent.trim();
                                    break;
                                }
                            }
                            
                            // Only add if we have at least a title or URL
                            if (jobData.title || jobData.job_url) {
                                jobs.push(jobData);
                            }
                        } catch (e) {
                            continue;
                        }
                    }
                }
                
                return jobs;
            }
            return extractJobListings();
            """
            
            jobs = self.driver.execute_script(js_script, config['search_url'], site_name)
            
            if jobs:
                logger.info(f"    ✅ Found {len(jobs)} job listings")
            
        except Exception as e:
            logger.warning(f"    ⚠️ Job listings extraction failed: {e}")
        
        return jobs
    
    def _extract_job_details(self, job: Dict, config: Dict) -> Optional[Dict]:
        """Extract detailed information from individual job page with enhanced parsing."""
        if not job.get('job_url'):
            return job
        
        try:
            self.driver.get(job['job_url'])
            time.sleep(3)
            
            js_script = """
            function extractJobDetails() {
                const jobDetails = {};
                
                // Extract detailed description
                const descSelectors = [
                    '.job-description', '.position-description', '.description', '.job-details',
                    '.position-details', '.content', '.details', '.summary', '.job-summary',
                    '.position-summary', '.requirements', '.job-requirements', '.position-requirements',
                    '.job-content', '.position-content', '.main-content', '.content-area',
                    'article', 'section', '.post-content', '.entry-content', '.job-body',
                    '[class*="description"]', '[class*="details"]', '[class*="content"]',
                    'p', 'div[class*="job"]', 'div[class*="position"]'
                ];
                
                for (let selector of descSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim().length > 100) {
                        jobDetails.description = element.textContent.trim();
                        break;
                    }
                }
                
                // Extract salary information
                const salarySelectors = [
                    '.salary', '.pay', '.compensation', '.wage', '.rate', '.hourly-rate',
                    '[class*="salary"]', '[class*="pay"]', '[class*="compensation"]',
                    '[class*="wage"]', '[class*="rate"]', '.benefits', '.compensation-info'
                ];
                
                for (let selector of salarySelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim().length > 5) {
                        jobDetails.salary = element.textContent.trim();
                        break;
                    }
                }
                
                // Extract job type
                const typeSelectors = [
                    '.job-type', '.position-type', '.employment-type', '.schedule', '.shift',
                    '[class*="type"]', '[class*="schedule"]', '[class*="shift"]', '.full-time',
                    '.part-time', '.per-diem', '.temporary', '.contract'
                ];
                
                for (let selector of typeSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim().length > 2) {
                        jobDetails.job_type = element.textContent.trim();
                        break;
                    }
                }
                
                // Extract location details
                const locationSelectors = [
                    '.location', '.job-location', '.position-location', '.address', '.city',
                    '.state', '.zip', '[class*="location"]', '[class*="address"]'
                ];
                
                for (let selector of locationSelectors) {
                    const element = document.querySelector(selector);
                    if (element && element.textContent && element.textContent.trim().length > 2) {
                        jobDetails.location = element.textContent.trim();
                        break;
                    }
                }
                
                return jobDetails;
            }
            return extractJobDetails();
            """
            
            details = self.driver.execute_script(js_script)
            
            # Merge details with original job data
            if details:
                for key, value in details.items():
                    if value and not job.get(key):
                        job[key] = value
                
                # Enhanced parsing of description to extract salary and job type
                if job.get('description'):
                    self.scraping_stats['jobs_with_description'] += 1
                    
                    # Extract salary from description
                    if not job.get('salary'):
                        salary = self._extract_salary_from_description(job['description'])
                        if salary:
                            job['salary'] = salary
                            self.scraping_stats['jobs_with_salary'] += 1
                    
                    # Extract job type from description
                    if not job.get('job_type'):
                        job_type = self._extract_job_type_from_description(job['description'])
                        if job_type:
                            job['job_type'] = job_type
                
                logger.debug(f"        ✅ Extracted details: {len([k for k, v in details.items() if v])} fields")
            
        except Exception as e:
            logger.debug(f"        ⚠️ Error extracting job details: {e}")
        
        return job
    
    def _extract_salary_from_description(self, description: str) -> Optional[str]:
        """Extract salary information from job description."""
        if not description:
            return None
        
        # Salary patterns
        salary_patterns = [
            r'\$[\d,]+(?:\.\d{2})?\s*(?:–|-|to)\s*\$[\d,]+(?:\.\d{2})?\s*(?:per\s+year|per\s+month|per\s+hour|annually|monthly|hourly)',
            r'\$[\d,]+(?:\.\d{2})?\s*(?:per\s+year|per\s+month|per\s+hour|annually|monthly|hourly)',
            r'(?:Pay|Salary|Compensation|Wage|Rate):\s*\$[\d,]+(?:\.\d{2})?\s*(?:–|-|to)\s*\$[\d,]+(?:\.\d{2})?',
            r'(?:Pay|Salary|Compensation|Wage|Rate):\s*\$[\d,]+(?:\.\d{2})?',
            r'\$[\d,]+(?:\.\d{2})?\s*(?:–|-|to)\s*\$[\d,]+(?:\.\d{2})?',
            r'\$[\d,]+(?:\.\d{2})?'
        ]
        
        for pattern in salary_patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        
        return None
    
    def _extract_job_type_from_description(self, description: str) -> Optional[str]:
        """Extract job type from job description."""
        if not description:
            return None
        
        # Job type patterns
        job_type_patterns = [
            r'Job Type:\s*(Full-time|Part-time|Per-diem|Temporary|Contract|Seasonal)',
            r'(Full-time|Part-time|Per-diem|Temporary|Contract|Seasonal)',
            r'(Full Time|Part Time|Per Diem)',
            r'(FT|PT|PD)'
        ]
        
        for pattern in job_type_patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                return match.group(1) if len(match.groups()) > 0 else match.group(0)
        
        return None
    
    def scrape_all_sites(self, max_sites: int = None) -> List[Dict]:
        """Scrape all configured sites with enhanced data extraction."""
        all_jobs = []
        
        logger.info(f"🚀 Starting ultimate scraping of {len(self.site_configs)} sites")
        logger.info(f"🎯 Max jobs per site: {self.max_jobs_per_site}")
        
        sites_to_scrape = self.site_configs[:max_sites] if max_sites else self.site_configs
        self.scraping_stats['total_sites'] = len(sites_to_scrape)
        
        for i, config in enumerate(sites_to_scrape, 1):
            try:
                logger.info(f"\n{'='*80}")
                logger.info(f"📋 Processing {i}/{len(sites_to_scrape)}: {config['source_site']}")
                logger.info(f"🔗 URL: {config['search_url']}")
                logger.info(f"📊 Priority: {config.get('priority', 'unknown')}")
                logger.info(f"🎯 Estimated jobs: {config.get('estimated_jobs', 'unknown')}")
                logger.info(f"{'='*80}")
                
                start_time = time.time()
                
                jobs = self._scrape_site_with_recovery(config)
                
                duration = time.time() - start_time
                
                if jobs:
                    all_jobs.extend(jobs)
                    self.scraping_stats['successful_sites'] += 1
                    self.scraping_stats['total_jobs'] += len(jobs)
                    logger.info(f"✅ {config['source_site']}: Successfully extracted {len(jobs)} jobs in {duration:.1f}s")
                else:
                    self.scraping_stats['failed_sites'] += 1
                    logger.warning(f"⚠️ {config['source_site']}: No jobs found in {duration:.1f}s")
                
                time.sleep(3)
                
            except Exception as e:
                self.scraping_stats['failed_sites'] += 1
                logger.error(f"❌ Error processing {config['source_site']}: {e}")
                self.scraping_stats['errors'].append({
                    'site': config['source_site'],
                    'error': str(e),
                    'url': config['search_url']
                })
                continue
        
        # Remove duplicates
        unique_jobs = self._remove_duplicates(all_jobs)
        
        logger.info(f"\n🎉 Ultimate scraping completed!")
        logger.info(f"📊 Total jobs found: {len(all_jobs)}")
        logger.info(f"📊 Unique jobs: {len(unique_jobs)}")
        logger.info(f"📊 Jobs with details: {self.scraping_stats['jobs_with_details']}")
        logger.info(f"📊 Jobs with descriptions: {self.scraping_stats['jobs_with_description']}")
        logger.info(f"📊 Jobs with salary: {self.scraping_stats['jobs_with_salary']}")
        logger.info(f"📊 Duplicates removed: {len(all_jobs) - len(unique_jobs)}")
        logger.info(f"🔄 WebDriver restarts: {self.scraping_stats['webdriver_restarts']}")
        
        return unique_jobs
    
    def _remove_duplicates(self, jobs: List[Dict]) -> List[Dict]:
        """Remove duplicate jobs based on title and company."""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            title = (job.get('title') or '').lower().strip()
            company = (job.get('company') or '').lower().strip()
            key = f"{title}|{company}"
            
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
        
        return unique_jobs
    
    def save_jobs(self, jobs: List[Dict], filename_prefix: str = "ultimate_apploi_jobs"):
        """Save jobs to JSON and CSV files."""
        if not jobs:
            logger.warning("⚠️ No jobs to save")
            return None, None
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_filename = f"{filename_prefix}_{len(jobs)}_{timestamp}.json"
        csv_filename = f"{filename_prefix}_{len(jobs)}_{timestamp}.csv"
        
        # Save as JSON
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(jobs, f, indent=2, ensure_ascii=False)
        
        # Save as CSV
        if jobs:
            fieldnames = jobs[0].keys()
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(jobs)
        
        logger.info(f"💾 Jobs saved to: {json_filename}, {csv_filename}")
        return json_filename, csv_filename
    
    def print_summary(self):
        """Print scraping summary."""
        print(f"\n{'='*80}")
        print("🎯 ULTIMATE APPLOI SCRAPING SUMMARY")
        print(f"{'='*80}")
        print(f"📊 BASIC STATISTICS:")
        print(f"   Sites processed: {self.scraping_stats['total_sites']}")
        print(f"   Sites successful: {self.scraping_stats['successful_sites']}")
        print(f"   Sites failed: {self.scraping_stats['failed_sites']}")
        print(f"   Total jobs found: {self.scraping_stats['total_jobs']}")
        print(f"   Jobs with details: {self.scraping_stats['jobs_with_details']}")
        print(f"   Jobs with descriptions: {self.scraping_stats['jobs_with_description']}")
        print(f"   Jobs with salary: {self.scraping_stats['jobs_with_salary']}")
        print(f"   WebDriver restarts: {self.scraping_stats['webdriver_restarts']}")
        print(f"   Max jobs per site: {self.max_jobs_per_site}")
        
        success_rate = (self.scraping_stats['successful_sites'] / self.scraping_stats['total_sites'] * 100) if self.scraping_stats['total_sites'] > 0 else 0
        detail_rate = (self.scraping_stats['jobs_with_details'] / self.scraping_stats['total_jobs'] * 100) if self.scraping_stats['total_jobs'] > 0 else 0
        description_rate = (self.scraping_stats['jobs_with_description'] / self.scraping_stats['total_jobs'] * 100) if self.scraping_stats['total_jobs'] > 0 else 0
        salary_rate = (self.scraping_stats['jobs_with_salary'] / self.scraping_stats['total_jobs'] * 100) if self.scraping_stats['total_jobs'] > 0 else 0
        
        print(f"   Success rate: {success_rate:.1f}%")
        print(f"   Detail extraction rate: {detail_rate:.1f}%")
        print(f"   Description rate: {description_rate:.1f}%")
        print(f"   Salary extraction rate: {salary_rate:.1f}%")
        
        if self.scraping_stats['errors']:
            print(f"\n❌ ERRORS ENCOUNTERED ({len(self.scraping_stats['errors'])}):")
            for i, error in enumerate(self.scraping_stats['errors'][:5], 1):
                print(f"   {i}. {error['site']}: {error['error']}")
                if 'url' in error:
                    print(f"      URL: {error['url']}")
        
        print(f"{'='*80}")
    
    def cleanup(self):
        """Clean up resources."""
        if self.driver:
            logger.info("🧹 Cleaning up WebDriver...")
            try:
                self.driver.quit()
            except:
                pass

def main():
    """Main function to run the ultimate scraper."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Ultimate Apploi Connecticut Healthcare Job Scraper')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode with detailed logging')
    parser.add_argument('--headless', action='store_true', default=True, help='Run in headless mode (default: True)')
    parser.add_argument('--max-sites', type=int, help='Maximum number of sites to scrape')
    parser.add_argument('--max-jobs-per-site', type=int, default=15, help='Maximum jobs to extract details from per site (default: 15)')
    parser.add_argument('--test', action='store_true', help='Run in test mode (scrape only first 3 sites)')
    
    args = parser.parse_args()
    
    print("🚀 Starting Ultimate Apploi Connecticut Healthcare Job Scraper...")
    print(f"🔧 Configuration:")
    print(f"   Debug mode: {args.debug}")
    print(f"   Headless mode: {args.headless}")
    print(f"   Max sites: {args.max_sites or 'All'}")
    print(f"   Max jobs per site: {args.max_jobs_per_site}")
    print(f"   Test mode: {args.test}")
    
    scraper = None
    try:
        scraper = UltimateApploiScraper(headless=args.headless, debug=args.debug, max_jobs_per_site=args.max_jobs_per_site)
        
        max_sites = 3 if args.test else args.max_sites
        jobs = scraper.scrape_all_sites(max_sites=max_sites)
        
        if jobs:
            json_file, csv_file = scraper.save_jobs(jobs)
            scraper.print_summary()
            
            print(f"\n✅ Ultimate scraping completed successfully!")
            print(f"📁 Results saved to: {json_file}, {csv_file}")
        else:
            print("❌ No jobs found during ultimate scraping")
    
    except Exception as e:
        print(f"❌ Error in ultimate scraping: {e}")
        if args.debug:
            import traceback
            traceback.print_exc()
    
    finally:
        if scraper:
            scraper.cleanup()

if __name__ == "__main__":
    main() 