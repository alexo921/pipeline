#!/usr/bin/env python3
"""
Iframe-Aware Job Scraper for Connecticut Healthcare Sites
========================================================

This scraper can handle job boards that use iframes and complex structures,
which is common for many ATS systems.
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
import threading

import undetected_chromedriver as uc
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IframeAwareScraper:
    """Scraper that can handle iframes and complex job board structures."""
    
    def __init__(self, headless: bool = True, debug: bool = False):
        self.headless = headless
        self.debug = debug
        self.driver = None
        self.wait = None
        self.jobs = []
        self.site_configs = self._load_ct_sites()
        self.scraping_stats = {
            'sites_processed': 0,
            'sites_successful': 0,
            'sites_failed': 0,
            'total_jobs_found': 0,
            'start_time': None,
            'errors': []
        }
        
        # Enhanced selectors for different platforms
        self.platform_selectors = {
            'apploi': {
                'job_container': [
                    '.job_listings .job', '.job-card', '.job-listing', '.job-item',
                    '[class*="job"]', '[class*="position"]', '.career-item'
                ],
                'job_title': [
                    '.job-title', '.job-name', 'h3 a', '.title a', '.position-title',
                    '[data-testid="job-title"]', '.job-name a'
                ],
                'job_location': [
                    '.job-location', '.location', '.job-city', '.address',
                    '[data-testid="job-location"]', '.job-address'
                ],
                'apply_button': [
                    '.apply-button', '.apply-now', '[data-testid="apply-button"]',
                    'a[href*="apply"]', '.btn-apply', '.apply-link'
                ]
            },
            'paycom': {
                'job_container': [
                    '.job-result', '.job-item', '[data-automation-id="jobPostingItem"]',
                    '.position-card', '.job-listing'
                ],
                'job_title': [
                    '.job-title', '[data-automation-id="jobPostingTitle"] a',
                    '.position-title a', '.job-name a'
                ],
                'job_location': [
                    '.job-location', '[data-automation-id="jobPostingLocation"]',
                    '.location', '.job-city'
                ],
                'apply_button': [
                    '.apply-button', '.apply-now', '[data-automation-id="apply-button"]'
                ]
            },
            'icims': {
                'job_container': [
                    '.iCIMS_JobsTable tr', '.jobs-list-item', '.job-item',
                    '.row', '.job-result', '.job-listing'
                ],
                'job_title': [
                    '.iCIMS_InfoField_Job', '.job-title', 'h3 a', '.title a',
                    'td a', '.job-name', '.position-title'
                ],
                'job_location': [
                    '.iCIMS_InfoField_Location', '.job-location', '.location',
                    '.job-city', '.job-address'
                ],
                'apply_button': [
                    '.apply-button', '.apply-now', '.iCIMS_ApplyButton'
                ]
            },
            'custom': {
                'job_container': [
                    '.job-card', '.job-listing', '.job-item', '.career-item',
                    '.position-card', '[class*="job"]', '[class*="career"]'
                ],
                'job_title': [
                    '.job-title', '.job-name', 'h3 a', '.title a',
                    '.position-title', '[data-testid="job-title"]'
                ],
                'job_location': [
                    '.job-location', '.location', '.job-city', '.address',
                    '[data-testid="job-location"]'
                ],
                'apply_button': [
                    '.apply-button', '.apply-now', '[data-testid="apply-button"]',
                    'a[href*="apply"]', '.btn-apply'
                ]
            }
        }
    
    def _load_ct_sites(self) -> List[Dict]:
        """Load CT site configurations."""
        configs = []
        try:
            with open('ct_only.csv', 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get('search_url') and row.get('source_site'):
                        # Clean up job board type
                        job_board_type = row.get('job board type', '').strip().lower()
                        if job_board_type in ['', 'needs manual', 'def needs manual', 'old most likely needs manual']:
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
        """Setup WebDriver with iframe support."""
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
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            
            # Use webdriver-manager
            try:
                service = Service(ChromeDriverManager().install())
                self.driver = uc.Chrome(service=service, options=chrome_options)
                logger.info("✅ WebDriver setup successful")
            except Exception as e:
                logger.warning(f"⚠️ webdriver-manager failed, using fallback: {e}")
                self.driver = uc.Chrome(options=chrome_options)
            
            self.wait = WebDriverWait(self.driver, 15)
            self.driver.get("https://www.google.com")
            time.sleep(2)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ WebDriver setup failed: {e}")
            return False
    
    def _find_element_with_selectors(self, container, selectors: List[str]):
        """Find element using multiple selector options."""
        for selector in selectors:
            try:
                element = container.find_element(By.CSS_SELECTOR, selector)
                if element and element.text.strip():
                    return element
            except:
                continue
        return None
    
    def _switch_to_iframe_if_needed(self, platform: str) -> bool:
        """Switch to iframe if job content is embedded."""
        try:
            # Look for iframes
            iframes = self.driver.find_elements(By.TAG_NAME, 'iframe')
            if not iframes:
                return False
            
            logger.info(f"Found {len(iframes)} iframes, checking for job content...")
            
            for i, iframe in enumerate(iframes):
                try:
                    # Switch to iframe
                    self.driver.switch_to.frame(iframe)
                    time.sleep(2)
                    
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
    
    def _extract_jobs_from_page(self, platform: str, config: Dict) -> List[Dict]:
        """Extract jobs from current page, handling iframes."""
        jobs = []
        
        if not self.driver:
            return jobs
        
        try:
            # Wait for page to load
            time.sleep(5)
            
            # Check for iframes and switch if needed
            iframe_found = self._switch_to_iframe_if_needed(platform)
            if iframe_found:
                logger.info("Switched to iframe for job content")
            
            # Get platform-specific selectors
            platform_config = self.platform_selectors.get(platform, self.platform_selectors['custom'])
            
            # Find job containers
            job_containers = []
            for selector in platform_config['job_container']:
                try:
                    containers = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if containers:
                        job_containers = containers
                        logger.info(f"Found {len(containers)} job containers with selector: {selector}")
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
    
    def _find_job_elements_alternative(self) -> List:
        """Alternative method to find job elements when standard selectors fail."""
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
                    parent = element.find_element(By.XPATH, "./..")
                    if parent:
                        job_elements.append(parent)
            
            logger.info(f"Found {len(job_elements)} potential job elements using alternative method")
            return job_elements
            
        except Exception as e:
            logger.error(f"Error in alternative job finding: {e}")
            return []
    
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
            title_elem = self._find_element_with_selectors(container, platform_config['job_title'])
            if title_elem:
                job_data['title'] = title_elem.text.strip()
                # Get URL if it's a link
                if title_elem.tag_name == 'a':
                    job_data['url'] = title_elem.get_attribute('href')
            
            # Extract location
            if config.get('parse_location'):
                location_elem = self._find_element_with_selectors(container, platform_config['job_location'])
                if location_elem:
                    job_data['location'] = location_elem.text.strip()
            else:
                # Use fixed location from config
                if config.get('city'):
                    job_data['location'] = f"{config['city']}, {config['state']}"
                    if config.get('zip_code'):
                        job_data['location'] += f" {config['zip_code']}"
            
            # Extract apply URL
            apply_elem = self._find_element_with_selectors(container, platform_config['apply_button'])
            if apply_elem:
                job_data['apply_url'] = apply_elem.get_attribute('href')
            
            # Validate job data
            if not job_data['title']:
                return None
            
            return job_data
            
        except Exception as e:
            logger.error(f"Error extracting job from container: {e}")
            return None
    
    def _scrape_site_with_pagination(self, config: Dict, max_pages: int = 5) -> List[Dict]:
        """Scrape a single site with pagination support."""
        jobs = []
        platform = config.get('job_board_type', 'custom')
        
        try:
            logger.info(f"Scraping site: {config['source_site']} ({platform})")
            
            self.driver.get(config['search_url'])
            time.sleep(5)
            
            page = 1
            while page <= max_pages:
                page_jobs = self._extract_jobs_from_page(platform, config)
                if not page_jobs:
                    logger.info(f"No more jobs found on page {page}")
                    break
                
                jobs.extend(page_jobs)
                logger.info(f"Page {page}: Found {len(page_jobs)} jobs")
                
                # Try to navigate to next page (simplified for now)
                if page < max_pages:
                    try:
                        # Look for next button
                        next_selectors = ['.pagination-next', '[aria-label="Next"]', '.next-page', '.load-more']
                        next_found = False
                        for selector in next_selectors:
                            try:
                                next_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                                if next_button.is_enabled() and next_button.is_displayed():
                                    next_button.click()
                                    time.sleep(3)
                                    next_found = True
                                    break
                            except:
                                continue
                        
                        if not next_found:
                            logger.info("No more pages available")
                            break
                    except:
                        break
                
                page += 1
            
            logger.info(f"✅ {config['source_site']}: Total {len(jobs)} jobs found")
            
        except Exception as e:
            logger.error(f"❌ Error scraping {config['source_site']}: {e}")
            self.scraping_stats['errors'].append({
                'site': config['source_site'],
                'error': str(e)
            })
        
        return jobs
    
    def scrape_all_sites(self, max_sites: Optional[int] = None, max_pages_per_site: int = 5) -> List[Dict]:
        """Scrape all CT healthcare sites."""
        if not self._setup_driver():
            logger.error("Failed to setup WebDriver")
            return []
        
        self.scraping_stats['start_time'] = datetime.now()
        all_jobs = []
        
        try:
            sites_to_scrape = self.site_configs[:max_sites] if max_sites else self.site_configs
            
            for i, config in enumerate(sites_to_scrape, 1):
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
                time.sleep(random.uniform(3, 6))
            
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
    
    def save_jobs(self, jobs: List[Dict], filename_prefix: str = "iframe_ct_jobs"):
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
        print("IFRAME-AWARE CONNECTICUT HEALTHCARE JOB SCRAPING SUMMARY")
        print("="*60)
        print(f"Sites processed: {self.scraping_stats['sites_processed']}")
        print(f"Sites successful: {self.scraping_stats['sites_successful']}")
        print(f"Sites failed: {self.scraping_stats['sites_failed']}")
        print(f"Total jobs found: {self.scraping_stats['total_jobs_found']}")
        
        if self.scraping_stats['errors']:
            print(f"\nErrors encountered: {len(self.scraping_stats['errors'])}")
            for error in self.scraping_stats['errors'][:5]:
                print(f"  - {error['site']}: {error['error']}")

def main():
    """Main function to run the iframe-aware scraper."""
    scraper = IframeAwareScraper(headless=True, debug=False)
    
    print("🚀 Starting Iframe-Aware Connecticut Healthcare Job Scraper...")
    print(f"📊 Total sites to process: {len(scraper.site_configs)}")
    
    # Test with a few sites first
    jobs = scraper.scrape_all_sites(max_sites=5, max_pages_per_site=3)
    
    if jobs:
        # Save results
        json_file, csv_file = scraper.save_jobs(jobs)
        
        # Print summary
        scraper.print_summary()
        
        print(f"\n✅ Iframe-aware scraping completed successfully!")
        print(f"📁 Results saved to: {json_file}, {csv_file}")
    else:
        print("❌ No jobs found during iframe-aware scraping")

if __name__ == "__main__":
    main() 