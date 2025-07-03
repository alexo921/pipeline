#!/usr/bin/env python3
"""
Final Comprehensive Healthcare Job Scraper
==========================================

This scraper handles all 194 healthcare job sites with proper pagination
and enhanced job extraction to get thousands of jobs.
"""

import csv
import json
import time
import random
import re
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin, urlparse, parse_qs

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

class FinalHealthcareScraper:
    
    def __init__(self, headless: bool = True, debug: bool = False):
        self.headless = headless
        self.debug = debug
        self.driver = None
        self.wait = None
        self.jobs = []
        self.site_configs = self._load_site_configs()
        
        # Universal selectors that work across most healthcare job sites
        self.universal_selectors = {
            'job_containers': [
                # Job-specific classes
                '.job', '.job-item', '.job-listing', '.job-card', '.job-post', '.job-row',
                '.position', '.position-item', '.position-card',
                '.career', '.career-item', '.career-listing',
                '.opening', '.vacancy', '.opportunity', '.employment',
                # Generic containers that often contain jobs
                '.listing', '.post', '.role', '.item',
                # Link-based selectors (many sites use job links)
                'a[href*="job"]', 'a[href*="career"]', 'a[href*="position"]', 'a[href*="opening"]',
                # Table rows (for traditional job tables)
                'tr', 'tbody tr',
                # Class-based wildcards
                '[class*="job"]', '[class*="position"]', '[class*="career"]'
            ],
            'job_titles': [
                '.job-title', '.position-title', '.title', '.job-name', '.role-title',
                '.career-title', '.opening-title', '.vacancy-title',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'a[href*="job"]', 'a[href*="career"]', 'a[href*="position"]',
                '.name', '.position'
            ],
            'job_locations': [
                '.location', '.job-location', '.position-location', '.address',
                '.city', '.state', '.geo', '.locale', '.place',
                '.job-city', '.job-state', '.job-address',
                '[class*="location"]', '[class*="address"]', '[class*="city"]'
            ],
            'pagination_buttons': [
                '.next', '.pagination-next', '.page-next', '.btn-next',
                '.load-more', '.more-jobs', '.show-more',
                '[aria-label="Next"]', '[aria-label="next"]',
                'a[href*="page"]', 'button[onclick*="page"]',
                '.pager-next', '.next-page'
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
            print(f"Error loading site configs: {e}")
        
        print(f"Loaded {len(configs)} site configurations")
        return configs
    
    def _setup_driver(self):
        """Setup Chrome WebDriver with anti-detection."""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless=new")
        
        # Anti-detection measures
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument(f"--user-data-dir=/tmp/chrome_final_{random.randint(1000, 9999)}")
        
        # Performance optimizations
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-images")
        chrome_options.add_argument("--disable-javascript")  # Will enable for specific sites
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.wait = WebDriverWait(self.driver, 15)
    
    def _find_job_containers(self, max_containers: int = 100) -> List:
        """Find job containers using universal selectors."""
        job_containers = []
        
        for selector in self.universal_selectors['job_containers']:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    # Filter for healthcare-related content
                    healthcare_elements = []
                    for elem in elements:
                        try:
                            elem_text = elem.text.lower()
                            elem_html = elem.get_attribute('outerHTML').lower()
                            
                            healthcare_keywords = [
                                'nurse', 'nursing', 'care', 'aide', 'assistant', 'therapist',
                                'coordinator', 'caregiver', 'cna', 'rn', 'lpn', 'medical',
                                'healthcare', 'health care', 'patient', 'clinical', 'rehab',
                                'therapy', 'social worker', 'director', 'manager', 'home',
                                'certified', 'licensed', 'supervisor', 'administrator',
                                'medication', 'treatment', 'wellness', 'senior', 'elderly'
                            ]
                            
                            if (any(keyword in elem_text for keyword in healthcare_keywords) or
                                any(keyword in elem_html for keyword in healthcare_keywords) or
                                len(elem_text.strip()) < 200):  # Short text might be job titles
                                healthcare_elements.append(elem)
                        except:
                            # If we can't analyze, include it
                            healthcare_elements.append(elem)
                    
                    if healthcare_elements:
                        job_containers = healthcare_elements[:max_containers]
                        self._log(f"Found {len(healthcare_elements)} healthcare containers with: {selector}")
                        break
            except Exception as e:
                continue
        
        return job_containers
    
    def _extract_job_from_container(self, container, config: Dict) -> Optional[Dict]:
        """Extract job data from a container element."""
        try:
            title = ''
            location = ''
            job_url = ''
            
            # Extract title using multiple strategies
            for selector in self.universal_selectors['job_titles']:
                try:
                    title_elem = container.find_element(By.CSS_SELECTOR, selector)
                    title = title_elem.text.strip()
                    if title and len(title) > 3 and not title.lower().startswith(('view', 'apply', 'see', 'click')):
                        break
                except:
                    continue
            
            # Fallback title extraction
            if not title:
                try:
                    # Try getting text from the container itself
                    container_text = container.text.strip()
                    if container_text:
                        lines = container_text.split('\n')
                        for line in lines:
                            line = line.strip()
                            if len(line) > 3 and len(line) < 100:  # Reasonable title length
                                title = line
                                break
                except:
                    pass
            
            # Extract location
            for selector in self.universal_selectors['job_locations']:
                try:
                    location_elem = container.find_element(By.CSS_SELECTOR, selector)
                    location = location_elem.text.strip()
                    if location and len(location) > 1:
                        break
                except:
                    continue
            
            # Extract job URL
            try:
                if container.tag_name == 'a':
                    job_url = container.get_attribute('href')
                else:
                    link_elem = container.find_element(By.TAG_NAME, 'a')
                    job_url = link_elem.get_attribute('href')
                
                if job_url and not job_url.startswith('http'):
                    job_url = urljoin(config['search_url'], job_url)
            except:
                pass
            
            # Skip if no meaningful title found
            if not title or len(title.strip()) < 3:
                return None
            
            # Parse location for city/state
            city, state = self._parse_location(location or container.text)
            
            # Create job data
            job_data = {
                'id': f"{config['source_site']}_{abs(hash(job_url or title))}",
                'title': title.strip(),
                'company': config['source_site'],
                'location': location or f"{city}, {state}" if city and state else state if state else 'Location not specified',
                'city': city,
                'state': state,
                'url': job_url,
                'source': config['source_site'],
                'source_url': config['search_url'],
                'scraped_at': datetime.now().isoformat(),
                'description': container.text.strip()[:300] + '...' if len(container.text) > 300 else container.text.strip()
            }
            
            return job_data
            
        except Exception as e:
            return None
    
    def _parse_location(self, location_text: str) -> Tuple[str, str]:
        """Parse location text to extract city and state."""
        if not location_text:
            return '', ''
        
        # Enhanced location patterns
        patterns = [
            r'([^,\n]+),\s*([A-Z]{2})\b',  # City, ST
            r'([^,\n]+),\s*([A-Za-z\s]+)\s+([A-Z]{2})\b',  # City, State ST
            r'([^,\n]+),\s*([A-Za-z\s]+)$',  # City, State
            r'([A-Za-z\s]+)\s+([A-Z]{2})\s+\d{5}',  # City ST ZIP
            r'([A-Za-z\s]+),\s*(Connecticut|Massachusetts|CT|MA|NY|RI|VT|NH|ME)\b',  # City, State
        ]
        
        for pattern in patterns:
            match = re.search(pattern, location_text.strip(), re.IGNORECASE)
            if match:
                groups = match.groups()
                if len(groups) == 2:
                    city, state = groups
                    # Normalize state names
                    state_map = {
                        'connecticut': 'CT', 'massachusetts': 'MA', 'rhode island': 'RI',
                        'new york': 'NY', 'vermont': 'VT', 'new hampshire': 'NH', 'maine': 'ME'
                    }
                    state = state_map.get(state.lower(), state)
                    return city.strip(), state.strip().upper()
                elif len(groups) == 3:
                    city, state_name, state_abbrev = groups
                    return city.strip(), state_abbrev.strip().upper()
        
        # Extract just state if no city found
        state_patterns = [
            r'\b(CT|MA|NY|RI|VT|NH|ME|AL|AK|AZ|AR|CA|CO|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|MD|MI|MN|MS|MO|MT|NE|NV|NJ|NM|NC|ND|OH|OK|OR|PA|SC|SD|TN|TX|UT|VA|WA|WV|WI|WY|DC)\b',
            r'\b(Connecticut|Massachusetts|Rhode Island|New York|Vermont|New Hampshire|Maine)\b'
        ]
        
        for pattern in state_patterns:
            match = re.search(pattern, location_text, re.IGNORECASE)
            if match:
                state = match.group(1)
                state_map = {
                    'connecticut': 'CT', 'massachusetts': 'MA', 'rhode island': 'RI',
                    'new york': 'NY', 'vermont': 'VT', 'new hampshire': 'NH', 'maine': 'ME'
                }
                state = state_map.get(state.lower(), state)
                return '', state.upper()
        
        return '', ''
    
    def _try_pagination(self) -> bool:
        """Try to navigate to next page using various strategies."""
        current_url = self.driver.current_url
        
        # Strategy 1: Click next button
        for selector in self.universal_selectors['pagination_buttons']:
            try:
                next_buttons = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for button in next_buttons:
                    if button.is_enabled() and button.is_displayed():
                        button_text = button.text.lower()
                        if any(word in button_text for word in ['next', 'more', '>']):
                            try:
                                button.click()
                                time.sleep(random.uniform(2, 4))
                                if self.driver.current_url != current_url:
                                    return True
                            except:
                                try:
                                    self.driver.execute_script("arguments[0].click();", button)
                                    time.sleep(random.uniform(2, 4))
                                    if self.driver.current_url != current_url:
                                        return True
                                except:
                                    continue
            except:
                continue
        
        # Strategy 2: URL-based pagination
        pagination_patterns = [
            (r'page=(\d+)', 'page={}'),
            (r'spage=(\d+)', 'spage={}'),
            (r'p=(\d+)', 'p={}'),
            (r'offset=(\d+)', 'offset={}'),
            (r'/(\d+)/?$', '/{}/')
        ]
        
        for pattern, replacement in pagination_patterns:
            match = re.search(pattern, current_url)
            if match:
                current_page = int(match.group(1))
                next_page = current_page + 1
                
                if 'offset' in pattern:
                    next_page = current_page + 25  # Common offset increment
                
                next_url = re.sub(pattern, replacement.format(next_page), current_url)
                
                try:
                    self.driver.get(next_url)
                    time.sleep(random.uniform(2, 4))
                    return True
                except:
                    continue
        
        # Strategy 3: Add pagination parameter if none exists
        if '?' in current_url:
            next_url = current_url + '&page=2'
        else:
            next_url = current_url + '?page=2'
        
        try:
            self.driver.get(next_url)
            time.sleep(random.uniform(2, 4))
            return True
        except:
            pass
        
        return False
    
    def _scrape_site_with_pagination(self, config: Dict, max_pages: int = 30) -> List[Dict]:
        """Scrape a single site with comprehensive pagination."""
        all_jobs = []
        
        self._log(f"🏥 Scraping {config['source_site']}")
        
        try:
            if not self.driver or not self.wait:
                return all_jobs
            
            self.driver.get(config['search_url'])
            time.sleep(random.uniform(3, 6))
            
            # Wait for page load
            try:
                self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            except:
                self._log(f"  ⚠️ Timeout loading page")
                return all_jobs
            
            # Check for blocking
            page_title = self.driver.title.lower()
            page_source = self.driver.page_source.lower()
            
            blocking_indicators = ['just a moment', 'cloudflare', 'checking', 'security', 'captcha', 'robot']
            if any(indicator in page_title or indicator in page_source[:1000] for indicator in blocking_indicators):
                self._log(f"  🚫 Site blocked by anti-bot protection")
                return all_jobs
            
            page_count = 0
            consecutive_empty_pages = 0
            previous_job_count = 0
            
            while page_count < max_pages:
                page_count += 1
                self._log(f"  📄 Page {page_count}")
                
                # Find and extract jobs from current page
                job_containers = self._find_job_containers()
                page_jobs = []
                
                for container in job_containers:
                    job_data = self._extract_job_from_container(container, config)
                    if job_data:
                        # Check for duplicates
                        job_id = job_data['id']
                        if not any(existing_job['id'] == job_id for existing_job in all_jobs):
                            page_jobs.append(job_data)
                
                if page_jobs:
                    all_jobs.extend(page_jobs)
                    consecutive_empty_pages = 0
                    self._log(f"    ✓ Found {len(page_jobs)} new jobs (total: {len(all_jobs)})")
                else:
                    consecutive_empty_pages += 1
                    self._log(f"    ⚠️ No jobs found on page {page_count}")
                
                # Stop conditions
                if consecutive_empty_pages >= 3:
                    self._log(f"    🛑 Stopping after {consecutive_empty_pages} empty pages")
                    break
                
                if len(all_jobs) == previous_job_count and page_count > 1:
                    self._log(f"    🛑 No progress, stopping")
                    break
                
                previous_job_count = len(all_jobs)
                
                # Try to go to next page
                if page_count < max_pages:
                    if not self._try_pagination():
                        self._log(f"    🏁 No more pages available")
                        break
                
                # Random delay between pages
                time.sleep(random.uniform(1, 3))
            
        except Exception as e:
            self._log(f"  ❌ Error: {e}")
        
        self._log(f"✅ Completed {config['source_site']}: {len(all_jobs)} jobs from {page_count} pages")
        return all_jobs
    
    def scrape_all_sites(self, max_sites: Optional[int] = None, max_pages_per_site: int = 30) -> List[Dict]:
        """Scrape all sites from the CSV."""
        self._log(f"🚀 Starting Final Comprehensive Healthcare Job Scraping")
        
        try:
            self._setup_driver()
            
            sites_to_process = self.site_configs[:max_sites] if max_sites else self.site_configs
            total_sites = len(sites_to_process)
            
            self._log(f"📋 Processing {total_sites} healthcare job sites")
            
            for i, config in enumerate(sites_to_process, 1):
                self._log(f"🏥 [{i}/{total_sites}] {config['source_site']}")
                
                try:
                    site_jobs = self._scrape_site_with_pagination(config, max_pages_per_site)
                    self.jobs.extend(site_jobs)
                    
                    total_jobs = len(self.jobs)
                    avg_per_site = total_jobs / i if i > 0 else 0
                    self._log(f"📊 Progress: {total_jobs} total jobs | Avg: {avg_per_site:.1f} jobs/site")
                    
                    # Delay between sites
                    if i < total_sites:
                        delay = random.uniform(2, 5)
                        time.sleep(delay)
                        
                except Exception as e:
                    self._log(f"❌ Error processing {config['source_site']}: {e}")
                    continue
                    
        except Exception as e:
            self._log(f"💥 Critical error: {e}")
            
        finally:
            if self.driver:
                self.driver.quit()
        
        # Remove duplicates
        unique_jobs = self._remove_duplicates(self.jobs)
        self._log(f"🎉 Scraping completed! Found {len(unique_jobs)} unique jobs from {len(sites_to_process)} sites")
        
        return unique_jobs
    
    def _remove_duplicates(self, jobs: List[Dict]) -> List[Dict]:
        """Remove duplicate jobs."""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            identifier = (
                job.get('title', '').lower().strip(),
                job.get('company', '').lower().strip(),
                job.get('location', '').lower().strip()
            )
            if identifier not in seen and identifier[0]:
                seen.add(identifier)
                unique_jobs.append(job)
        
        self._log(f"🔄 Removed {len(jobs) - len(unique_jobs)} duplicate jobs")
        return unique_jobs
    
    def save_jobs(self, filename_prefix: str = "final_comprehensive_healthcare_jobs"):
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
    
    def _log(self, message: str):
        """Log message with timestamp."""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def main():
    """Main execution function."""
    print("🚀 Final Comprehensive Healthcare Job Scraper")
    print("=" * 60)
    
    # Configuration
    MAX_SITES = None  # None for all 194 sites
    MAX_PAGES_PER_SITE = 30  # Up to 30 pages per site
    HEADLESS = True
    DEBUG = False
    
    scraper = FinalHealthcareScraper(headless=HEADLESS, debug=DEBUG)
    
    # Run comprehensive scraping
    jobs = scraper.scrape_all_sites(max_sites=MAX_SITES, max_pages_per_site=MAX_PAGES_PER_SITE)
    
    if jobs:
        scraper.jobs = jobs
        scraper.save_jobs("final_comprehensive_healthcare_jobs")
        
        # Print final summary
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
        
        # Company breakdown (top 10)
        company_counts = {}
        for job in jobs:
            company = job.get('company', 'Unknown')
            company_counts[company] = company_counts.get(company, 0) + 1
        
        print(f"\nTop 10 Companies by Job Count:")
        for company, count in sorted(company_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {company}: {count} jobs")
        
    else:
        print("❌ No jobs found")

if __name__ == "__main__":
    main() 