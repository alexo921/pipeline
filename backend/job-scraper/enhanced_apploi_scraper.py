#!/usr/bin/env python3
"""
Enhanced Apploi Scraper with Multi-Job Board Support and Job Detail Enhancement
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

class EnhancedApploiScraper:
    """Enhanced scraper that supports multiple job board types and job detail enhancement."""
    
    def __init__(self, headless: bool = True, debug: bool = False):
        """Initialize the enhanced scraper."""
        self.headless = headless
        self.debug = debug
        self.driver = None
        self.site_configs = []
        self.scraping_stats = {
            'total_sites': 0,
            'successful_sites': 0,
            'failed_sites': 0,
            'total_jobs': 0,
            'enhanced_jobs': 0,
            'errors': [],
            'warnings': []
        }
        
        # Load optimized site configurations
        self._load_optimized_configs()
        
        # Setup WebDriver
        if not self._setup_driver():
            raise Exception("Failed to setup WebDriver")
    
    def _load_optimized_configs(self):
        """Load optimized site configurations."""
        try:
            if os.path.exists('optimized_site_configs.json'):
                with open('optimized_site_configs.json', 'r') as f:
                    configs = json.load(f)
                
                # Filter out problematic URLs and use original URLs when recommended URLs are tracking links
                for config in configs:
                    # Use original URL if recommended URL is a tracking/analytics URL
                    if config.get('search_url') and any(tracker in config['search_url'].lower() 
                                                       for tracker in ['doubleclick', 'adsrvr', 'googleadservices', 'td.doubleclick']):
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
            chrome_options = uc.ChromeOptions()
            
            if self.headless:
                chrome_options.add_argument("--headless=new")
                logger.debug("  📱 Headless mode enabled")
            
            # Performance and stability options
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--disable-plugins")
            chrome_options.add_argument("--disable-images")
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            
            # User agent
            user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            chrome_options.add_argument(f"--user-agent={user_agent}")
            
            logger.debug("  ⚙️ Chrome options configured")
            
            # Try webdriver-manager first
            try:
                logger.debug("  🔄 Attempting to use webdriver-manager...")
                service = Service(ChromeDriverManager().install())
                self.driver = uc.Chrome(service=service, options=chrome_options)
            except Exception as e:
                logger.debug(f"  ⚠️ webdriver-manager failed: {e}")
                logger.debug("  🔄 Attempting to use system Chrome...")
                self.driver = uc.Chrome(options=chrome_options)
            
            # Test the driver
            self.driver.get("https://www.google.com")
            logger.info("✅ WebDriver setup successful")
            return True
            
        except Exception as e:
            logger.error(f"❌ WebDriver setup failed: {e}")
            return False
    
    def _get_job_board_handler(self, job_board_type: str):
        """Get the appropriate handler for a job board type."""
        handlers = {
            'apploi': self._scrape_apploi_site,
            'icims': self._scrape_icims_site,
            'paycom': self._scrape_paycom_site,
            'dayforce': self._scrape_generic_site,  # Use generic for now
            'adp': self._scrape_generic_site,  # Use generic for now
            'hireology': self._scrape_generic_site,  # Use generic for now
            'ultipro': self._scrape_generic_site,  # Use generic for now
            'paylocity': self._scrape_generic_site,  # Use generic for now
            'applicantpool': self._scrape_generic_site,  # Use generic for now
            'oracle': self._scrape_generic_site  # Use generic for now
        }
        return handlers.get(job_board_type, self._scrape_generic_site)
    
    def _scrape_apploi_site(self, config: Dict) -> List[Dict]:
        """Scrape Apploi-based sites."""
        jobs = []
        site_name = config['source_site']
        
        logger.info(f"🔍 Scraping Apploi site: {site_name}")
        
        try:
            # Visit the site
            self.driver.get(config['search_url'])
            time.sleep(5)
            
            # Check for iframes and switch if needed
            iframe_found = self._switch_to_iframe_if_needed()
            if iframe_found:
                logger.info("  ✅ Switched to iframe for job content")
            
            # Use JavaScript extraction for Apploi sites
            jobs = self._extract_jobs_with_javascript(config)
            
            logger.info(f"  ✅ Found {len(jobs)} jobs on {site_name}")
            
        except Exception as e:
            logger.error(f"  ❌ Error scraping {site_name}: {e}")
            self.scraping_stats['errors'].append({
                'site': site_name,
                'error': str(e),
                'url': config['search_url']
            })
        
        return jobs
    
    def _scrape_icims_site(self, config: Dict) -> List[Dict]:
        """Scrape iCIMS-based sites."""
        jobs = []
        site_name = config['source_site']
        
        logger.info(f"🔍 Scraping iCIMS site: {site_name}")
        
        try:
            # Visit the site
            self.driver.get(config['search_url'])
            time.sleep(5)
            
            # iCIMS sites often have job listings in specific containers
            job_containers = self.driver.find_elements(By.CSS_SELECTOR, '.job-result, .job-listing, .search-result')
            
            for container in job_containers:
                try:
                    job_data = self._extract_job_from_icims_container(container, config)
                    if job_data:
                        jobs.append(job_data)
                except Exception as e:
                    logger.debug(f"    ⚠️ Error extracting job from container: {e}")
                    continue
            
            logger.info(f"  ✅ Found {len(jobs)} jobs on {site_name}")
            
        except Exception as e:
            logger.error(f"  ❌ Error scraping {site_name}: {e}")
            self.scraping_stats['errors'].append({
                'site': site_name,
                'error': str(e),
                'url': config['search_url']
            })
        
        return jobs
    
    def _scrape_paycom_site(self, config: Dict) -> List[Dict]:
        """Scrape Paycom-based sites."""
        jobs = []
        site_name = config['source_site']
        
        logger.info(f"🔍 Scraping Paycom site: {site_name}")
        
        try:
            # Visit the site
            self.driver.get(config['search_url'])
            time.sleep(5)
            
            # Paycom sites often have job listings in specific containers
            job_containers = self.driver.find_elements(By.CSS_SELECTOR, '.job-listing, .job-result, .position')
            
            for container in job_containers:
                try:
                    job_data = self._extract_job_from_paycom_container(container, config)
                    if job_data:
                        jobs.append(job_data)
                except Exception as e:
                    logger.debug(f"    ⚠️ Error extracting job from container: {e}")
                    continue
            
            logger.info(f"  ✅ Found {len(jobs)} jobs on {site_name}")
            
        except Exception as e:
            logger.error(f"  ❌ Error scraping {site_name}: {e}")
            self.scraping_stats['errors'].append({
                'site': site_name,
                'error': str(e),
                'url': config['search_url']
            })
        
        return jobs
    
    def _scrape_generic_site(self, config: Dict) -> List[Dict]:
        """Scrape generic sites with unknown job board type."""
        jobs = []
        site_name = config['source_site']
        
        logger.info(f"🔍 Scraping generic site: {site_name}")
        
        try:
            # Visit the site
            self.driver.get(config['search_url'])
            time.sleep(5)
            
            # Try multiple extraction methods
            jobs = self._extract_jobs_with_javascript(config)
            
            if not jobs:
                # Fallback to traditional extraction
                jobs = self._extract_jobs_traditional(config)
            
            logger.info(f"  ✅ Found {len(jobs)} jobs on {site_name}")
            
        except Exception as e:
            logger.error(f"  ❌ Error scraping {site_name}: {e}")
            self.scraping_stats['errors'].append({
                'site': site_name,
                'error': str(e),
                'url': config['search_url']
            })
        
        return jobs
    
    def _switch_to_iframe_if_needed(self) -> bool:
        """Switch to iframe if job content is in iframe."""
        try:
            iframes = self.driver.find_elements(By.TAG_NAME, 'iframe')
            
            for iframe in iframes:
                try:
                    src = iframe.get_attribute('src') or ''
                    
                    # Skip non-job iframes
                    if any(skip_domain in src.lower() for skip_domain in [
                        'youtube.com', 'google.com/recaptcha', 'doubleclick.net',
                        'adsrvr.org', 'brandcdn.com', 'jometer.com', 'about:blank'
                    ]):
                        continue
                    
                    # Switch to iframe and check for job content
                    self.driver.switch_to.frame(iframe)
                    
                    # Look for job indicators
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
    
    def _extract_jobs_with_javascript(self, config: Dict) -> List[Dict]:
        """Extract jobs using JavaScript to avoid stale element issues."""
        jobs = []
        site_name = config['source_site']
        
        try:
            # Comprehensive JavaScript extraction script
            js_script = """
            function extractAllJobs() {
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
                            const titleSelectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '.job-title', '.position-title', '.title', '[class*="title"]', 'a[href*="job"]', 'strong', 'b'];
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
                                    if (href.includes('jobs.apploi.com') || href.includes('apploi.com') || 
                                        href.includes('/job/') || href.includes('/career/') || 
                                        href.includes('/position/') || href.includes('job') || 
                                        href.includes('career') || href.includes('position') ||
                                        (href.startsWith('/') && (href.includes('job') || href.includes('career') || href.includes('position')))) {
                                        jobData.job_url = href.startsWith('http') ? href : window.location.origin + href;
                                        break;
                                    }
                                }
                            }
                            
                            // Extract description
                            const descSelectors = ['.description', '.job-description', '.position-description', 'p', '.content', '.details'];
                            for (let descSel of descSelectors) {
                                const descEl = container.querySelector(descSel);
                                if (descEl && descEl.textContent && descEl.textContent.trim().length > 10) {
                                    jobData.description = descEl.textContent.trim();
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
            return extractAllJobs();
            """
            
            jobs = self.driver.execute_script(js_script, config['search_url'], site_name)
            
            if jobs:
                logger.info(f"    ✅ JavaScript extraction found {len(jobs)} jobs")
                for job in jobs:
                    logger.debug(f"      ✅ Extracted: {job.get('title', 'No title')[:50]}...")
            
        except Exception as e:
            logger.warning(f"    ⚠️ JavaScript extraction failed: {e}")
        
        return jobs
    
    def _extract_jobs_traditional(self, config: Dict) -> List[Dict]:
        """Fallback traditional extraction method."""
        jobs = []
        site_name = config['source_site']
        
        try:
            # Look for job containers
            job_containers = self.driver.find_elements(By.CSS_SELECTOR, 
                '.job, .career, .position, .employment, [class*="job"], [class*="career"]')
            
            for container in job_containers:
                try:
                    job_data = self._extract_job_from_container(container, config)
                    if job_data:
                        jobs.append(job_data)
                except Exception as e:
                    logger.debug(f"    ⚠️ Error extracting job from container: {e}")
                    continue
            
        except Exception as e:
            logger.warning(f"    ⚠️ Traditional extraction failed: {e}")
        
        return jobs
    
    def _extract_job_from_container(self, container, config: Dict) -> Optional[Dict]:
        """Extract job data from a container element."""
        try:
            job_data = {
                'title': '',
                'company': config['source_site'],
                'location': '',
                'description': '',
                'job_url': '',
                'job_type': '',
                'salary': '',
                'date_posted': '',
                'city': '',
                'state': 'CT',
                'zip_code': '',
                'source_url': config['search_url'],
                'scraped_at': datetime.now().isoformat()
            }
            
            # Extract title
            title_selectors = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '.job-title', '.position-title', '.title']
            for selector in title_selectors:
                try:
                    title_elem = container.find_element(By.CSS_SELECTOR, selector)
                    if title_elem and title_elem.text.strip():
                        job_data['title'] = title_elem.text.strip()
                        break
                except:
                    continue
            
            # Extract job URL
            try:
                links = container.find_elements(By.TAG_NAME, 'a')
                for link in links:
                    href = link.get_attribute('href')
                    if href and any(keyword in href.lower() for keyword in ['job', 'career', 'position']):
                        job_data['job_url'] = href
                        break
            except:
                pass
            
            # Extract description
            try:
                desc_elem = container.find_element(By.CSS_SELECTOR, '.description, .job-description, p')
                if desc_elem and desc_elem.text.strip():
                    job_data['description'] = desc_elem.text.strip()
            except:
                pass
            
            # Only return if we have meaningful data
            if job_data['title'] or job_data['job_url']:
                return job_data
            
        except Exception as e:
            logger.debug(f"    ⚠️ Error extracting job data: {e}")
        
        return None
    
    def _extract_job_from_icims_container(self, container, config: Dict) -> Optional[Dict]:
        """Extract job data from iCIMS container."""
        return self._extract_job_from_container(container, config)
    
    def _extract_job_from_paycom_container(self, container, config: Dict) -> Optional[Dict]:
        """Extract job data from Paycom container."""
        return self._extract_job_from_container(container, config)
    
    def _enhance_job_with_details(self, job: Dict) -> Dict:
        """Enhance job data by visiting the job URL and extracting detailed information."""
        if not job.get('job_url'):
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
                    '[data-testid="company"]', '[data-company]', '.brand-name'
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
                    '.job-info .location', '.position-info .location'
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
                    '.position-details .salary', '.benefits .salary'
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
                    '.position-details .type', '.employment-category'
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
                    '.position-details .date', '.posting-date'
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
                    '.job-main', '.position-main', '.career-main'
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
                
                self.scraping_stats['enhanced_jobs'] += 1
                logger.info(f"    ✅ Enhanced job with {len([k for k, v in details.items() if v])} new details")
            
        except Exception as e:
            logger.warning(f"    ⚠️ Error enhancing job {job_url}: {e}")
            self.scraping_stats['warnings'].append({
                'job_url': job_url,
                'error': str(e),
                'operation': 'enhancement'
            })
        
        return enhanced_job
    
    def _enhance_jobs_batch(self, jobs: List[Dict], batch_size: int = 10) -> List[Dict]:
        """Enhance jobs in batches to avoid overwhelming the server."""
        enhanced_jobs = []
        total_jobs = len(jobs)
        
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
        
        logger.info(f"✅ Completed job enhancement. Enhanced {self.scraping_stats['enhanced_jobs']} jobs")
        return enhanced_jobs

    def scrape_all_sites(self, max_sites: int = None, enhance_jobs: bool = True) -> List[Dict]:
        """Scrape all configured sites with optional job enhancement."""
        all_jobs = []
        
        logger.info(f"🚀 Starting enhanced scraping of {len(self.site_configs)} sites")
        if enhance_jobs:
            logger.info("🔍 Job enhancement enabled - will visit individual job URLs for detailed information")
        
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
                
                # Get appropriate handler for job board type
                handler = self._get_job_board_handler(config.get('job_board_type', 'unknown'))
                jobs = handler(config)
                
                duration = time.time() - start_time
                
                if jobs:
                    all_jobs.extend(jobs)
                    self.scraping_stats['successful_sites'] += 1
                    self.scraping_stats['total_jobs'] += len(jobs)
                    logger.info(f"✅ {config['source_site']}: Successfully extracted {len(jobs)} jobs in {duration:.1f}s")
                else:
                    self.scraping_stats['failed_sites'] += 1
                    logger.warning(f"⚠️ {config['source_site']}: No jobs found in {duration:.1f}s")
                
            except Exception as e:
                self.scraping_stats['failed_sites'] += 1
                logger.error(f"❌ {config['source_site']}: Error during scraping: {e}")
                self.scraping_stats['errors'].append({
                    'site': config['source_site'],
                    'error': str(e),
                    'url': config['search_url']
                })
        
        # Remove duplicates
        logger.info(f"\n🧹 Removing duplicates from {len(all_jobs)} jobs...")
        unique_jobs = self._remove_duplicates(all_jobs)
        logger.info(f"✅ After deduplication: {len(unique_jobs)} unique jobs")
        
        # Enhance jobs if requested
        if enhance_jobs and unique_jobs:
            logger.info(f"\n🔍 Starting job enhancement process...")
            enhanced_jobs = self._enhance_jobs_batch(unique_jobs)
            return enhanced_jobs
        
        return unique_jobs
    
    def _remove_duplicates(self, jobs: List[Dict]) -> List[Dict]:
        """Remove duplicate jobs based on title and company."""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            # Create a key based on title and company
            title = (job.get('title') or '').lower().strip()
            company = (job.get('company') or '').lower().strip()
            key = f"{title}|{company}"
            
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
        
        return unique_jobs
    
    def save_jobs(self, jobs: List[Dict], filename_prefix: str = "enhanced_apploi_jobs"):
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
        logger.info(f"\n{'='*80}")
        logger.info("📊 SCRAPING SUMMARY")
        logger.info(f"{'='*80}")
        logger.info(f"🏢 Total sites processed: {self.scraping_stats['total_sites']}")
        logger.info(f"✅ Successful sites: {self.scraping_stats['successful_sites']}")
        logger.info(f"❌ Failed sites: {self.scraping_stats['failed_sites']}")
        logger.info(f"💼 Total jobs found: {self.scraping_stats['total_jobs']}")
        logger.info(f"🔍 Enhanced jobs: {self.scraping_stats['enhanced_jobs']}")
        
        if self.scraping_stats['errors']:
            logger.info(f"\n❌ Errors encountered:")
            for error in self.scraping_stats['errors'][:5]:  # Show first 5 errors
                logger.info(f"   • {error['site']}: {error['error']}")
            if len(self.scraping_stats['errors']) > 5:
                logger.info(f"   ... and {len(self.scraping_stats['errors']) - 5} more errors")
        
        if self.scraping_stats['warnings']:
            logger.info(f"\n⚠️ Warnings:")
            for warning in self.scraping_stats['warnings'][:5]:  # Show first 5 warnings
                logger.info(f"   • {warning.get('job_url', 'Unknown')}: {warning['error']}")
            if len(self.scraping_stats['warnings']) > 5:
                logger.info(f"   ... and {len(self.scraping_stats['warnings']) - 5} more warnings")
    
    def cleanup(self):
        """Clean up resources."""
        if self.driver:
            logger.info("🧹 Cleaning up WebDriver...")
            self.driver.quit()

def main():
    """Main function to run the enhanced scraper."""
    try:
        # Initialize scraper
        scraper = EnhancedApploiScraper(headless=True, debug=False)
        
        # Scrape all sites with job enhancement
        jobs = scraper.scrape_all_sites(enhance_jobs=True)
        
        if jobs:
            # Save results
            scraper.save_jobs(jobs, "enhanced_apploi_jobs")
            
            # Print summary
            scraper.print_summary()
            
            logger.info(f"\n🎉 Scraping completed successfully!")
            logger.info(f"📁 Results saved to: enhanced_apploi_jobs_*.json and enhanced_apploi_jobs_*.csv")
        else:
            logger.warning("⚠️ No jobs found during scraping")
        
    except Exception as e:
        logger.error(f"❌ Fatal error during scraping: {e}")
        raise
    finally:
        # Cleanup
        if 'scraper' in locals():
            scraper.cleanup()

if __name__ == "__main__":
    main() 