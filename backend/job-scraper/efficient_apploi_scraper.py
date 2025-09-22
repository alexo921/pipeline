#!/usr/bin/env python3
"""
Efficient Apploi Connecticut Healthcare Job Scraper
==================================================

This scraper efficiently handles Apploi-based job sites with optimized job page title extraction.
"""

import time
import csv
import json
import logging
from datetime import datetime
from typing import List, Dict, Optional
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EfficientApploiScraper:
    def __init__(self):
        self.driver = None
        self.apploi_selectors = {
            'job_container': ['.jobs-card', '[class*="job"]', '[class*="career"]', '[class*="position"]'],
            'job_title': ['a[class*="job"]', 'a[class*="title"]', 'h1', 'h2', 'h3', '[class*="title"]'],
            'job_location': ['[class*="location"]', '[class*="address"]', '[class*="city"]'],
            'job_type': ['[class*="type"]', '[class*="schedule"]', '[class*="shift"]'],
            'pagination': ['[class*="next"]', '[class*="pagination"]', 'a[href*="page"]']
        }
        
        # Sites that need job page title extraction
        self.sites_needing_job_pages = [
            'atlas', 'complete care', 'fox hill', 'kimberly', 'autumn lake'
        ]
        
        # Cache for job page titles to avoid repeated visits
        self.job_title_cache = {}

    def setup_driver(self):
        """Setup WebDriver for scraping."""
        try:
            chrome_options = uc.ChromeOptions()
            chrome_options.add_argument("--headless=new")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--window-size=1920,1080")
            
            service = Service(ChromeDriverManager().install())
            self.driver = uc.Chrome(service=service, options=chrome_options)
            logger.info("✅ WebDriver setup successful")
            return True
        except Exception as e:
            logger.error(f"❌ WebDriver setup failed: {e}")
            return False

    def _load_apploi_site_configs(self) -> List[Dict]:
        """Load Apploi site configurations from CSV."""
        configs = []
        try:
            with open('ct_only.csv', 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if (row.get('search_url') and 
                        row.get('source_site') and 
                        'apploi' in row.get('job board type', '').lower()):
                        configs.append({
                            'source_site': row['source_site'],
                            'search_url': row['search_url'],
                            'city': row.get('city', ''),
                            'state': row.get('state', 'CT'),
                            'zip_code': row.get('zip_code', ''),
                            'setting_type': row.get('setting_type', '')
                        })
            logger.info(f"Loaded {len(configs)} Apploi site configurations")
        except Exception as e:
            logger.error(f"Error loading site configs: {e}")
        return configs

    def _needs_job_page_extraction(self, site_name: str) -> bool:
        """Check if a site needs job page title extraction."""
        return any(keyword in site_name.lower() for keyword in self.sites_needing_job_pages)

    def _get_job_title_from_page(self, job_url: str) -> Optional[str]:
        """Get job title from job page, with caching."""
        if job_url in self.job_title_cache:
            return self.job_title_cache[job_url]
        
        try:
            # Store current page
            current_url = self.driver.current_url
            
            # Visit job page
            self.driver.get(job_url)
            time.sleep(2)  # Reduced wait time
            
            # Get title from page title
            page_title = self.driver.title.strip()
            if page_title and len(page_title) > 3:
                self.job_title_cache[job_url] = page_title
                logger.info(f"Extracted title from job page: {page_title}")
            
            # Go back to original page
            self.driver.get(current_url)
            time.sleep(1)  # Reduced wait time
            
            return page_title if page_title and len(page_title) > 3 else None
            
        except Exception as e:
            logger.warning(f"Error visiting job page for title: {e}")
            # Try to go back to original page
            try:
                self.driver.get(current_url)
                time.sleep(1)
            except:
                pass
            return None

    def _extract_job_from_container(self, container, site_config: Dict) -> Optional[Dict]:
        """Extract job data from a container element."""
        if not self.driver:
            return None
            
        try:
            job_data = {
                'title': '',
                'company': site_config['source_site'],
                'location': '',
                'city': site_config.get('city', ''),
                'state': site_config.get('state', 'CT'),
                'zip_code': site_config.get('zip_code', ''),
                'date_posted': '',
                'salary': '',
                'description': '',
                'url': '',
                'apply_url': '',
                'scraped_at': datetime.now().isoformat(),
                'source_site': site_config['source_site'],
                'job_board_type': 'apploi',
                'setting_type': site_config.get('setting_type', '')
            }

            # Extract title
            title_elem = None
            for selector in self.apploi_selectors['job_title']:
                try:
                    title_elem = container.find_element(By.CSS_SELECTOR, selector)
                    if title_elem:
                        break
                except:
                    continue

            if title_elem:
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
                
                # If still no title and site needs job page extraction, try job page
                if not title_text and self._needs_job_page_extraction(site_config['source_site']):
                    if title_elem.tag_name == 'a':
                        job_url = title_elem.get_attribute('href')
                        if job_url and 'jobs.apploi.com/view/' in job_url:
                            title_text = self._get_job_title_from_page(job_url)
                
                # Clean up common title prefixes
                title_text = title_text.replace('Title\n', '').replace('Job Posting Title\n', '')
                job_data['title'] = title_text
                
                # Get URL if it's a link
                if title_elem.tag_name == 'a':
                    job_data['url'] = title_elem.get_attribute('href')

            # Extract location
            for selector in self.apploi_selectors['job_location']:
                try:
                    location_elem = container.find_element(By.CSS_SELECTOR, selector)
                    if location_elem:
                        job_data['location'] = location_elem.text.strip()
                        break
                except:
                    continue

            # Extract job type
            for selector in self.apploi_selectors['job_type']:
                try:
                    type_elem = container.find_element(By.CSS_SELECTOR, selector)
                    if type_elem:
                        job_data['job_type'] = type_elem.text.strip()
                        break
                except:
                    continue

            # Filter invalid job titles
            invalid_titles = [
                'load more listings', 'load more', 'show more', 'next page',
                'previous page', 'pagination', 'navigation', 'menu', 'sidebar'
            ]
            if any(invalid_title in job_data['title'].lower() for invalid_title in invalid_titles):
                return None

            # Only return if we have a valid title
            if job_data['title'] and len(job_data['title']) > 2:
                return job_data

        except Exception as e:
            logger.warning(f"Error extracting job from container: {e}")

        return None

    def _extract_jobs_from_page(self, site_config: Dict) -> List[Dict]:
        """Extract jobs from current page."""
        if not self.driver:
            return []
            
        jobs = []
        try:
            # Look for job containers
            job_containers = []
            for selector in self.apploi_selectors['job_container']:
                try:
                    containers = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if containers:
                        job_containers = containers
                        logger.info(f"Found {len(containers)} job containers with selector: {selector}")
                        break
                except:
                    continue

            if not job_containers:
                logger.warning("No job containers found")
                return []

            # Extract jobs from containers
            for container in job_containers:
                job_data = self._extract_job_from_container(container, site_config)
                if job_data:
                    jobs.append(job_data)

            logger.info(f"Page: Found {len(jobs)} jobs")

        except Exception as e:
            logger.error(f"Error extracting jobs from page: {e}")

        return jobs

    def _scrape_site_with_pagination(self, site_config: Dict) -> List[Dict]:
        """Scrape a single site with pagination support."""
        if not self.driver:
            return []
            
        all_jobs = []
        page = 1
        
        try:
            logger.info(f"Scraping Apploi site: {site_config['source_site']}")
            
            # Load the page
            self.driver.get(site_config['search_url'])
            time.sleep(8)

            # Check for iframes
            iframes = self.driver.find_elements(By.TAG_NAME, 'iframe')
            if iframes:
                logger.info(f"Found {len(iframes)} iframes, checking for job content...")
                
                # Try to find job content in iframes
                iframe_found = False
                for i, iframe in enumerate(iframes):
                    try:
                        src = iframe.get_attribute('src') or ''
                        if any(skip_domain in src.lower() for skip_domain in [
                            'youtube.com', 'google.com/recaptcha', 'doubleclick.net',
                            'adsrvr.org', 'brandcdn.com', 'jometer.com', 'about:blank'
                        ]):
                            continue
                        
                        self.driver.switch_to.frame(iframe)
                        
                        # Check if this iframe has job content
                        containers = []
                        for selector in self.apploi_selectors['job_container']:
                            try:
                                containers = self.driver.find_elements(By.CSS_SELECTOR, selector)
                                if containers:
                                    break
                            except:
                                continue
                        
                        if containers:
                            logger.info(f"Found job content in iframe {i}")
                            logger.info("Switched to iframe for job content")
                            iframe_found = True
                            break
                        else:
                            self.driver.switch_to.default_content()
                    except Exception as e:
                        logger.warning(f"Error checking iframe {i}: {e}")
                        self.driver.switch_to.default_content()
                        continue

            # Extract jobs from current page
            page_jobs = self._extract_jobs_from_page(site_config)
            
            # If no containers found in iframe, check main page
            if not page_jobs and iframe_found:
                logger.info("No containers found in iframe, checking main page content...")
                self.driver.switch_to.default_content()
                iframe_found = False  # Reset flag as we are now on main content
                for selector in self.apploi_selectors['job_container']:
                    try:
                        containers = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if containers:
                            logger.info(f"Found {len(containers)} job containers in main page with selector: {selector}")
                            page_jobs = self._extract_jobs_from_page(site_config)
                            break
                    except:
                        continue

            all_jobs.extend(page_jobs)

            # Handle pagination (simplified for now)
            # Look for next page button
            next_page_found = False
            for selector in self.apploi_selectors['pagination']:
                try:
                    next_buttons = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if next_buttons:
                        next_page_found = True
                        break
                except:
                    continue

            if not next_page_found:
                logger.info("No more pages available")

        except Exception as e:
            logger.error(f"Error scraping site {site_config['source_site']}: {e}")

        return all_jobs

    def scrape_all_sites(self):
        """Scrape all Apploi sites."""
        if not self.setup_driver():
            return

        try:
            # Load site configurations
            site_configs = self._load_apploi_site_configs()
            logger.info(f"Starting to scrape {len(site_configs)} Apploi sites")

            all_jobs = []
            successful_sites = 0
            failed_sites = 0

            for i, config in enumerate(site_configs, 1):
                logger.info(f"Processing {i}/{len(site_configs)}: {config['source_site']}")
                
                try:
                    site_jobs = self._scrape_site_with_pagination(config)
                    if site_jobs:
                        all_jobs.extend(site_jobs)
                        successful_sites += 1
                        logger.info(f"✅ {config['source_site']}: Total {len(site_jobs)} jobs found")
                    else:
                        failed_sites += 1
                        logger.warning(f"❌ {config['source_site']}: No jobs found")
                except Exception as e:
                    failed_sites += 1
                    logger.error(f"❌ Error processing {config['source_site']}: {e}")

                time.sleep(2)  # Brief pause between sites

            # Remove duplicates based on title and company
            unique_jobs = []
            seen = set()
            for job in all_jobs:
                key = (job['title'], job['company'])
                if key not in seen:
                    seen.add(key)
                    unique_jobs.append(job)

            # Save results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"efficient_apploi_ct_jobs_{len(unique_jobs)}_{timestamp}"
            
            with open(f"{filename}.json", 'w') as f:
                json.dump(unique_jobs, f, indent=2)
            
            with open(f"{filename}.csv", 'w', newline='', encoding='utf-8') as f:
                if unique_jobs:
                    writer = csv.DictWriter(f, fieldnames=unique_jobs[0].keys())
                    writer.writeheader()
                    writer.writerows(unique_jobs)

            logger.info(f"Efficient Apploi scraping completed: {len(unique_jobs)} unique jobs from {successful_sites} sites")
            logger.info(f"Jobs saved: {filename}.json ({len(unique_jobs)} jobs)")

            # Print summary
            print("\n" + "=" * 60)
            print("EFFICIENT APPLOI CONNECTICUT HEALTHCARE JOB SCRAPING SUMMARY")
            print("=" * 60)
            print(f"Sites processed: {len(site_configs)}")
            print(f"Sites successful: {successful_sites}")
            print(f"Sites failed: {failed_sites}")
            print(f"Total jobs found: {len(all_jobs)}")
            print(f"Unique jobs: {len(unique_jobs)}")
            print(f"\n✅ Efficient Apploi scraping completed successfully!")
            print(f"📁 Results saved to: {filename}.json, {filename}.csv")

        except Exception as e:
            logger.error(f"Error in scraping process: {e}")
        finally:
            if self.driver:
                self.driver.quit()

def main():
    """Main function."""
    scraper = EfficientApploiScraper()
    scraper.scrape_all_sites()

if __name__ == "__main__":
    main() 