#!/usr/bin/env python3
"""
Fixed Apploi Scraper with Robust WebDriver Management
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

class FixedApploiScraper:
    """Fixed scraper with robust WebDriver management."""
    
    def __init__(self, headless: bool = True, debug: bool = False, max_jobs_per_site: int = 15):
        """Initialize the fixed scraper."""
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
            'webdriver_restarts': 0,
            'sites_since_restart': 0
        }
        
        # Load site configurations
        self._load_configs()
        
        # Setup initial WebDriver
        if not self._setup_driver():
            raise Exception("Failed to setup initial WebDriver")
    
    def _load_configs(self):
        """Load site configurations."""
        try:
            if os.path.exists('optimized_site_configs.json'):
                with open('optimized_site_configs.json', 'r') as f:
                    configs = json.load(f)
                self.site_configs = configs
                logger.info(f"✅ Loaded {len(self.site_configs)} optimized site configurations")
            else:
                logger.warning("❌ optimized_site_configs.json not found, using fallback")
                self._load_fallback_configs()
        except Exception as e:
            logger.error(f"❌ Error loading configs: {e}")
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
        """Setup WebDriver with robust error handling."""
        logger.info("🔧 Setting up WebDriver...")
        
        try:
            if self.driver:
                try:
                    self.driver.quit()
                except:
                    pass
                self.driver = None
            
            # Always create a new ChromeOptions for each attempt
            chrome_options = uc.ChromeOptions()
            if self.headless:
                chrome_options.add_argument("--headless=new")
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
            chrome_options.add_argument("--disable-features=VizDisplayCompositor")
            user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            chrome_options.add_argument(f"--user-agent={user_agent}")
            
            try:
                self.driver = uc.Chrome(options=chrome_options)
            except Exception as e:
                logger.error(f"❌ WebDriver setup failed: {e}")
                return False
            
            # Test the driver
            self.driver.get("https://www.google.com")
            time.sleep(3)
            # Reset counter
            self.scraping_stats['sites_since_restart'] = 0
            self.scraping_stats['webdriver_restarts'] += 1
            logger.info("✅ WebDriver setup successful")
            return True
        except Exception as e:
            logger.error(f"❌ WebDriver setup failed: {e}")
            return False
    
    def _restart_driver_if_needed(self) -> bool:
        """Restart WebDriver if needed (every 5 sites or on error)."""
        try:
            # Check if driver is responsive
            self.driver.current_url
            
            # Restart every 5 sites to prevent connection issues
            if self.scraping_stats['sites_since_restart'] >= 5:
                logger.info("🔄 Restarting WebDriver after 5 sites to prevent connection issues")
                return self._setup_driver()
            
            return True
            
        except Exception as e:
            logger.warning(f"⚠️ WebDriver not responsive, restarting: {e}")
            return self._setup_driver()
    
    def _scrape_site_with_recovery(self, config: Dict) -> List[Dict]:
        """Scrape a single site with robust recovery."""
        jobs = []
        site_name = config['source_site']
        max_retries = 2
        
        for attempt in range(max_retries):
            try:
                if not self._restart_driver_if_needed():
                    logger.error(f"  ❌ Failed to restart WebDriver for {site_name}")
                    break
                
                # Increment sites counter
                self.scraping_stats['sites_since_restart'] += 1
                
                handler = self._get_job_board_handler(config.get('job_board_type', 'unknown'))
                jobs = handler(config)
                
                if jobs:
                    logger.info(f"  ✅ Successfully extracted {len(jobs)} jobs from {site_name}")
                    break
                else:
                    logger.warning(f"  ⚠️ No jobs found on {site_name} (attempt {attempt + 1}/{max_retries})")
                    if attempt < max_retries - 1:
                        time.sleep(3)
                
            except Exception as e:
                logger.error(f"  ❌ Error scraping {site_name} (attempt {attempt + 1}/{max_retries}): {e}")
                self.scraping_stats['errors'].append({
                    'site': site_name,
                    'error': str(e),
                    'url': config['search_url'],
                    'attempt': attempt + 1
                })
                
                # Force restart on error
                self.scraping_stats['sites_since_restart'] = 5
                
                if attempt < max_retries - 1:
                    logger.info(f"  🔄 Retrying {site_name} in 3 seconds...")
                    time.sleep(3)
                else:
                    logger.error(f"  ❌ Failed to scrape {site_name} after {max_retries} attempts")
        
        return jobs
    
    def _get_job_board_handler(self, job_board_type: str):
        """Get the appropriate handler for a job board type."""
        handlers = {
            'apploi': self._scrape_apploi_site,
            'icims': self._scrape_generic_site,
            'paycom': self._scrape_generic_site,
            'workday': self._scrape_generic_site,
            'bamboohr': self._scrape_generic_site,
            'greenhouse': self._scrape_generic_site,
            'lever': self._scrape_generic_site,
            'smartrecruiters': self._scrape_generic_site,
            'jobvite': self._scrape_generic_site,
            'taleo': self._scrape_generic_site,
            'successfactors': self._scrape_generic_site,
            'adp': self._scrape_generic_site,
            'ukg': self._scrape_generic_site,
            'ceridian': self._scrape_generic_site,
            'paylocity': self._scrape_generic_site,
            'paychex': self._scrape_generic_site,
            'gusto': self._scrape_generic_site,
            'rippling': self._scrape_generic_site,
            'justworks': self._scrape_generic_site,
            'trinet': self._scrape_generic_site,
            'insperity': self._scrape_generic_site,
            'oasis': self._scrape_generic_site,
            'peo': self._scrape_generic_site,
            'asap': self._scrape_generic_site,
            'unknown': self._scrape_generic_site
        }
        return handlers.get(job_board_type.lower(), self._scrape_generic_site)
    
    def _scrape_apploi_site(self, config: Dict) -> List[Dict]:
        """Scrape Apploi job board sites."""
        try:
            url = config['search_url']
            logger.info(f"🔍 Scraping Apploi site: {config['source_site']}")
            
            self.driver.get(url)
            time.sleep(5)
            
            # Switch to iframe if needed
            self._switch_to_iframe_if_needed()
            
            # Extract job listings
            jobs = self._extract_job_listings(config)
            
            return jobs
            
        except Exception as e:
            logger.error(f"❌ Error scraping Apploi site {config['source_site']}: {e}")
            return []
    
    def _scrape_generic_site(self, config: Dict) -> List[Dict]:
        """Scrape generic job sites."""
        try:
            url = config['search_url']
            logger.info(f"🔍 Scraping generic site: {config['source_site']}")
            
            self.driver.get(url)
            time.sleep(5)
            
            # Switch to iframe if needed
            self._switch_to_iframe_if_needed()
            
            # Extract job listings
            jobs = self._extract_job_listings(config)
            
            return jobs
            
        except Exception as e:
            logger.error(f"❌ Error scraping generic site {config['source_site']}: {e}")
            return []
    
    def _switch_to_iframe_if_needed(self) -> bool:
        """Switch to iframe if present."""
        try:
            iframes = self.driver.find_elements(By.TAG_NAME, "iframe")
            for iframe in iframes:
                try:
                    iframe_src = iframe.get_attribute("src")
                    if iframe_src and any(keyword in iframe_src.lower() for keyword in ['jobs', 'careers', 'apply', 'workday', 'icims', 'paycom']):
                        self.driver.switch_to.frame(iframe)
                        logger.info("✅ Switched to job-related iframe")
                        return True
                except:
                    continue
            return False
        except Exception as e:
            logger.warning(f"⚠️ Error switching to iframe: {e}")
            return False
    
    def _extract_job_listings(self, config: Dict) -> List[Dict]:
        """Extract job listings from the current page."""
        jobs = []
        site_name = config['source_site']
        
        try:
            # Common job listing selectors
            selectors = [
                "a[href*='job']",
                "a[href*='career']",
                "a[href*='apply']",
                ".job-listing",
                ".job-card",
                ".position",
                ".opening",
                "[data-job-id]",
                "[data-position-id]"
            ]
            
            job_links = []
            for selector in selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    job_links.extend(elements)
                except:
                    continue
            
            # Remove duplicates
            unique_links = []
            seen_urls = set()
            for link in job_links:
                try:
                    href = link.get_attribute("href")
                    if href and href not in seen_urls:
                        seen_urls.add(href)
                        unique_links.append(link)
                except:
                    continue
            
            logger.info(f"  📊 Found {len(unique_links)} potential job links")
            
            # Extract job details (limit to max_jobs_per_site)
            for i, link in enumerate(unique_links[:self.max_jobs_per_site]):
                try:
                    job = self._extract_job_details(link, config)
                    if job:
                        jobs.append(job)
                except Exception as e:
                    logger.warning(f"  ⚠️ Error extracting job {i+1}: {e}")
                    continue
            
            logger.info(f"  ✅ Successfully extracted {len(jobs)} jobs from {site_name}")
            
        except Exception as e:
            logger.error(f"  ❌ Error extracting job listings from {site_name}: {e}")
        
        return jobs
    
    def _extract_job_details(self, link_element, config: Dict) -> Optional[Dict]:
        """Extract job details from a job link."""
        try:
            # Get basic info from the link
            title = link_element.text.strip()
            url = link_element.get_attribute("href")
            
            if not title or not url:
                return None
            
            # Create basic job object
            job = {
                'title': title,
                'company': config['source_site'],
                'url': url,
                'location': '',
                'salary': '',
                'job_type': '',
                'description': '',
                'source_site': config['source_site'],
                'job_board_type': config.get('job_board_type', 'unknown'),
                'scraped_at': datetime.now().isoformat()
            }
            
            # Try to get more details by clicking the link
            try:
                original_window = self.driver.current_window_handle
                link_element.click()
                time.sleep(3)
                
                # Extract additional details
                job = self._extract_additional_details(job)
                
                # Go back to main page
                self.driver.switch_to.window(original_window)
                
            except Exception as e:
                logger.warning(f"    ⚠️ Could not extract additional details: {e}")
            
            return job
            
        except Exception as e:
            logger.warning(f"    ⚠️ Error extracting job details: {e}")
            return None
    
    def _extract_additional_details(self, job: Dict) -> Dict:
        """Extract additional job details from the job page."""
        try:
            # Extract location
            location_selectors = [
                ".location",
                ".job-location",
                "[data-location]",
                ".address"
            ]
            
            for selector in location_selectors:
                try:
                    element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    job['location'] = element.text.strip()
                    break
                except:
                    continue
            
            # Extract description
            description_selectors = [
                ".job-description",
                ".description",
                ".details",
                ".content"
            ]
            
            for selector in description_selectors:
                try:
                    element = self.driver.find_element(By.CSS_SELECTOR, selector)
                    description = element.text.strip()
                    if description and len(description) > 50:
                        job['description'] = description
                        self.scraping_stats['jobs_with_description'] += 1
                        
                        # Extract salary and job type from description
                        salary = self._extract_salary_from_description(description)
                        if salary:
                            job['salary'] = salary
                            self.scraping_stats['jobs_with_salary'] += 1
                        
                        job_type = self._extract_job_type_from_description(description)
                        if job_type:
                            job['job_type'] = job_type
                        
                        break
                except:
                    continue
            
            self.scraping_stats['jobs_with_details'] += 1
            
        except Exception as e:
            logger.warning(f"    ⚠️ Error extracting additional details: {e}")
        
        return job
    
    def _extract_salary_from_description(self, description: str) -> Optional[str]:
        """Extract salary information from job description."""
        try:
            # Common salary patterns
            patterns = [
                r'\$[\d,]+(?:-\$[\d,]+)?\s*(?:per\s+)?(?:hour|year|month|week)',
                r'\$[\d,]+(?:-\$[\d,]+)?\s*(?:hourly|annually|monthly|weekly)',
                r'(?:salary|pay|compensation):\s*\$[\d,]+(?:-\$[\d,]+)?',
                r'\$[\d,]+(?:k|K)\s*(?:per\s+)?(?:year|annually)',
                r'\$[\d,]+(?:k|K)\s*-\s*\$[\d,]+(?:k|K)'
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, description, re.IGNORECASE)
                if matches:
                    return matches[0].strip()
            
            return None
            
        except Exception as e:
            logger.warning(f"    ⚠️ Error extracting salary: {e}")
            return None
    
    def _extract_job_type_from_description(self, description: str) -> Optional[str]:
        """Extract job type from job description."""
        try:
            # Common job type patterns
            job_types = {
                'full-time': ['full time', 'full-time', 'fulltime', 'permanent'],
                'part-time': ['part time', 'part-time', 'parttime'],
                'contract': ['contract', 'contractor', 'temporary', 'temp'],
                'internship': ['intern', 'internship', 'student'],
                'remote': ['remote', 'work from home', 'wfh', 'telecommute'],
                'hybrid': ['hybrid', 'flexible', 'mixed']
            }
            
            description_lower = description.lower()
            
            for job_type, keywords in job_types.items():
                if any(keyword in description_lower for keyword in keywords):
                    return job_type
            
            return None
            
        except Exception as e:
            logger.warning(f"    ⚠️ Error extracting job type: {e}")
            return None
    
    def scrape_all_sites(self, max_sites: int = None) -> List[Dict]:
        """Scrape all configured sites with robust WebDriver management."""
        all_jobs = []
        
        logger.info(f"🚀 Starting fixed scraping of {len(self.site_configs)} sites")
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
                
                # Brief pause between sites
                time.sleep(2)
                
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
        
        logger.info(f"\n🎉 Fixed scraping completed!")
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
    
    def save_jobs(self, jobs: List[Dict], filename_prefix: str = "fixed_apploi_jobs"):
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
        print("🎯 FIXED APPLOI SCRAPING SUMMARY")
        print(f"{'='*80}")
        print(f"📊 BASIC STATISTICS:")
        print(f"   Sites processed: {self.scraping_stats['total_sites']}")
        print(f"   Sites successful: {self.scraping_stats['successful_sites']}")
        print(f"   Sites failed: {self.scraping_stats['failed_sites']}")
        print(f"   Total jobs found: {self.scraping_stats['total_jobs']}")
        print(f"   Success rate: {(self.scraping_stats['successful_sites']/self.scraping_stats['total_sites']*100):.1f}%" if self.scraping_stats['total_sites'] > 0 else "0%")
        
        if self.scraping_stats['errors']:
            print(f"❌ ERRORS ENCOUNTERED ({len(self.scraping_stats['errors'])}):")
            for i, error in enumerate(self.scraping_stats['errors'][:5], 1):
                print(f"   {i}. {error['site']}: {error['error']}")
                print(f"      URL: {error['url']}")
        
        print(f"{'='*80}")
        print("✅ Fixed scraping completed successfully!")
        print(f"📁 Results saved to: {self.save_jobs.__name__}")
        print(f"{'='*80}")
    
    def cleanup(self):
        """Cleanup resources."""
        try:
            if self.driver:
                self.driver.quit()
                logger.info("🧹 Cleaning up WebDriver...")
        except Exception as e:
            logger.warning(f"⚠️ Error during cleanup: {e}")

def main():
    """Main function."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Fixed Apploi Scraper")
    parser.add_argument("--debug", action="store_true", help="Enable debug mode")
    parser.add_argument("--headless", action="store_true", default=True, help="Run in headless mode")
    parser.add_argument("--test", action="store_true", help="Run in test mode (max 3 sites)")
    parser.add_argument("--max-sites", type=int, help="Maximum number of sites to scrape")
    parser.add_argument("--max-jobs-per-site", type=int, default=15, help="Maximum jobs per site")
    
    args = parser.parse_args()
    
    try:
        scraper = FixedApploiScraper(
            headless=args.headless,
            debug=args.debug,
            max_jobs_per_site=args.max_jobs_per_site
        )
        
        max_sites = 3 if args.test else args.max_sites
        jobs = scraper.scrape_all_sites(max_sites=max_sites)
        
        if jobs:
            scraper.save_jobs(jobs)
            scraper.print_summary()
        else:
            logger.warning("⚠️ No jobs found")
        
    except KeyboardInterrupt:
        logger.info("🛑 Scraping interrupted by user")
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
    finally:
        if 'scraper' in locals():
            scraper.cleanup()

if __name__ == "__main__":
    main() 