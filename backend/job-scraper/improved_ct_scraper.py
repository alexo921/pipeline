#!/usr/bin/env python3
"""
Improved Connecticut Healthcare Job Scraper
===========================================

This scraper is specifically designed to handle SPA (Single Page Application) career sites
with job card pagination. It follows these steps:

1. Access sites from ct_only.csv
2. Find career page and job card containers
3. Analyze how many jobs are available
4. Click through job cards and get detailed job information
5. Return JSON format suitable for job cards on the site

Key improvements:
- Better SPA handling with proper wait strategies
- Job card detection and pagination handling
- Individual job detail extraction
- Robust error handling and retry logic
- Progress tracking and detailed logging
- Comprehensive page validation and corruption detection
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
import os
from pathlib import Path

from playwright.sync_api import sync_playwright, Page, Browser, Playwright

# Create logs directory if it doesn't exist
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

def setup_logging(debug: bool = False):
    """Setup enhanced logging with file and console output."""
    log_level = logging.DEBUG if debug else logging.INFO
    
    # Create formatters
    detailed_formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)-20s | %(funcName)-20s | %(message)s'
    )
    simple_formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(message)s'
    )
    
    # Create handlers
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_handler = logging.FileHandler(
        f"logs/improved_ct_scraper_{timestamp}.log", 
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(detailed_formatter)
    
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(simple_formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.handlers.clear()
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    return logging.getLogger(__name__)

class ImprovedCTJobScraper:
    """Improved Connecticut Healthcare Job Scraper for SPA sites with job card pagination."""
    
    def __init__(self, headless: bool = True, debug: bool = False):
        self.headless = headless
        self.debug = debug
        self.logger = setup_logging(debug=debug)
        
        self.playwright = None
        self.browser = None
        self.page = None
        self.context = None
        self.site_configs = self._load_ct_sites()
        
        # Scraping statistics
        self.stats = {
            'start_time': datetime.now(),
            'sites_processed': 0,
            'sites_successful': 0,
            'sites_failed': 0,
            'total_jobs_found': 0,
            'total_jobs_extracted': 0,
            'errors': [],
            'site_details': {},
            'page_corruptions': 0,
            'page_recreations': 0
        }
        
        # Job card selectors for different platforms
        self.job_card_selectors = {
            'apploi': [
                '[data-testid="job-card"]',
                '.job-card',
                '.job-listing-card',
                '[class*="job-card"]',
                '[class*="JobCard"]',
                '.card[href*="job"]',
                'a[href*="/job/"]',
                'a[href*="/view/"]'
            ],
            'icims': [
                '.job-result',
                '.job-listing',
                '[data-automation="job-result"]',
                '.job-card',
                'a[href*="/job/"]'
            ],
            'paycom': [
                '.job-listing',
                '.job-result',
                'a[href*="/job/"]',
                '.job-card'
            ],
            'dayforce': [
                '.job-result',
                '.job-listing',
                'a[href*="/job/"]',
                '.job-card'
            ],
            'hireology': [
                '.job-listing',
                '.job-result',
                'a[href*="/job/"]',
                '.job-card'
            ],
            'generic': [
                '.job-card',
                '.job-listing',
                '.job-result',
                '.career-card',
                'a[href*="/job/"]',
                'a[href*="/career/"]',
                'a[href*="/position/"]',
                '[class*="job"]',
                '[class*="career"]',
                '[class*="position"]'
            ]
        }
        
        # Pagination selectors
        self.pagination_selectors = [
            '.pagination',
            '.pager',
            '[class*="pagination"]',
            '[class*="pager"]',
            '.load-more',
            '[class*="load-more"]',
            'button[class*="load"]',
            'button[class*="more"]',
            '.next-page',
            '.next',
            '[aria-label*="next"]',
            '[aria-label*="Next"]'
        ]
    
    def _validate_page(self, page) -> bool:
        """Validate that page is a proper Playwright Page object."""
        try:
            # Check if page exists
            if not page:
                self.logger.warning("⚠️ Page is None")
                return False
            
            # Check if page is corrupted (dict instead of Page object)
            if isinstance(page, dict):
                self.logger.warning("⚠️ Page is corrupted (dict object)")
                self.stats['page_corruptions'] += 1
                return False
            
            # Check if page has required methods
            required_methods = ['goto', 'title', 'url', 'content', 'query_selector', 'query_selector_all']
            for method in required_methods:
                if not hasattr(page, method):
                    self.logger.warning(f"⚠️ Page missing required method: {method}")
                    return False
            
            # Test if page is responsive
            try:
                test_url = page.url
                return True
            except Exception as e:
                self.logger.warning(f"⚠️ Page is not responsive: {e}")
                return False
                
        except Exception as e:
            self.logger.warning(f"⚠️ Error validating page: {e}")
            return False
    
    def _recreate_page(self) -> bool:
        """Recreate the page object if it's corrupted."""
        try:
            self.logger.info("🔄 Recreating corrupted page...")
            
            # Close existing page if it exists
            if self.page and hasattr(self.page, 'close'):
                try:
                    self.page.close()
                except:
                    pass
            
            # Create new page
            if self.context:
                self.page = self.context.new_page()
                self.stats['page_recreations'] += 1
                self.logger.info("✅ Successfully recreated page")
                return True
            else:
                self.logger.error("❌ No context available to recreate page")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Error recreating page: {e}")
            return False
    
    def _safe_page_operation(self, operation_name: str, operation_func, *args, **kwargs):
        """Safely execute a page operation with error handling and page recreation."""
        max_retries = 2
        
        for attempt in range(max_retries + 1):
            try:
                # Validate page before operation
                if not self._validate_page(self.page):
                    if attempt < max_retries:
                        self.logger.warning(f"⚠️ Page validation failed, recreating page (attempt {attempt + 1})")
                        if not self._recreate_page():
                            raise Exception("Failed to recreate page")
                        continue
                    else:
                        raise Exception("Page validation failed after max retries")
                
                # Execute the operation
                result = operation_func(*args, **kwargs)
                return result
                
            except Exception as e:
                if attempt < max_retries:
                    self.logger.warning(f"⚠️ {operation_name} failed (attempt {attempt + 1}): {e}")
                    # Try to recreate page for next attempt
                    if not self._recreate_page():
                        self.logger.error(f"❌ Failed to recreate page for retry")
                        break
                    time.sleep(1)  # Brief pause before retry
                else:
                    self.logger.error(f"❌ {operation_name} failed after {max_retries + 1} attempts: {e}")
                    raise e
        
        return None
    
    def _load_ct_sites(self) -> List[Dict]:
        """Load Connecticut healthcare sites from ct_only.csv."""
        sites = []
        
        try:
            with open('ct_only.csv', 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # Skip sites marked as needing manual work
                    if any(phrase in row.get('notes', '').lower() for phrase in 
                          ['needs manual', 'def needs manual', 'old most likely needs manual']):
                        continue
                    
                    site_config = {
                        'source_site': row['source_site'],
                        'search_url': row['search_url'],
                        'state': row.get('state', 'CT'),
                        'city': row.get('city', ''),
                        'zip_code': row.get('zip_code', ''),
                        'job_board_type': row.get('job board type', 'generic'),
                        'setting_type': row.get('setting_type', ''),
                        'notes': row.get('notes', '')
                    }
                    sites.append(site_config)
                    
            self.logger.info(f"✅ Loaded {len(sites)} Connecticut healthcare sites from ct_only.csv")
            return sites
            
        except Exception as e:
            self.logger.error(f"❌ Error loading sites from ct_only.csv: {e}")
            return []
    
    def _setup_browser(self) -> bool:
        """Setup Playwright browser with optimal settings for SPA sites."""
        try:
            self.logger.info("🔧 Setting up Playwright browser...")
            
            self.playwright = sync_playwright().start()
            
            # Launch browser with settings optimized for SPAs and anti-bot detection
            self.browser = self.playwright.chromium.launch(
                headless=self.headless,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-images',  # Speed up loading
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--disable-field-trial-config',
                    '--disable-ipc-flooding-protection',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ]
            )
            
            # Create context with realistic settings
            self.context = self.browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                extra_http_headers={
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                }
            )
            
            # Create page
            self.page = self.context.new_page()
            
            # Remove automation indicators
            self.page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
                
                // Remove other automation indicators
                delete window.navigator.__proto__.webdriver;
                
                // Override plugins to look more realistic
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5],
                });
                
                // Override languages
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en'],
                });
                
                // Override user agent
                Object.defineProperty(navigator, 'userAgent', {
                    get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                });
                
                // Override platform
                Object.defineProperty(navigator, 'platform', {
                    get: () => 'Win32',
                });
                
                // Override hardware concurrency
                Object.defineProperty(navigator, 'hardwareConcurrency', {
                    get: () => 8,
                });
                
                // Override device memory
                Object.defineProperty(navigator, 'deviceMemory', {
                    get: () => 8,
                });
                
                // Override connection
                Object.defineProperty(navigator, 'connection', {
                    get: () => ({
                        effectiveType: '4g',
                        rtt: 50,
                        downlink: 10,
                        saveData: false
                    }),
                });
                
                // Override permissions
                Object.defineProperty(navigator, 'permissions', {
                    get: () => ({
                        query: () => Promise.resolve({ state: 'granted' })
                    }),
                });
            """)
            
            self.logger.info("✅ Playwright browser setup complete")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to setup Playwright browser: {e}")
            return False
    
    def _wait_for_spa_load(self, page: Page, timeout: int = 30) -> bool:
        """Wait for SPA to load and stabilize."""
        try:
            # Validate page first
            if not self._validate_page(page):
                self.logger.warning("⚠️ Invalid page object in _wait_for_spa_load")
                return False
            
            # Wait for network to be idle safely
            def wait_for_network():
                page.wait_for_load_state('networkidle', timeout=timeout * 1000)
            
            try:
                self._safe_page_operation("Wait for network idle", wait_for_network)
            except Exception as e:
                self.logger.warning(f"⚠️ Error waiting for network idle: {e}")
                # Continue anyway, might still work
            
            # Wait a bit more for any dynamic content
            time.sleep(3)
            
            # Check if page has loaded content safely
            try:
                def get_page_content():
                    return page.content()
                
                content = self._safe_page_operation("Get page content for validation", get_page_content)
                if not content:
                    self.logger.warning("⚠️ Failed to get page content for validation")
                    return False
                
                if len(content) < 1000:  # Very small page, might be error
                    self.logger.warning("⚠️ Page content seems too small, might be an error page")
                    return False
                
                return True
                
            except Exception as e:
                self.logger.warning(f"⚠️ Error checking page content: {e}")
                return False
            
        except Exception as e:
            self.logger.warning(f"⚠️ Error waiting for SPA load: {e}")
            return False
    
    def _find_job_cards(self, page: Page, job_board_type: str = 'generic') -> List[Dict]:
        """Find all job cards on the current page."""
        job_cards = []
        
        # Get selectors for this job board type
        selectors = self.job_card_selectors.get(job_board_type.lower(), self.job_card_selectors['generic'])
        
        self.logger.info(f"🔍 Looking for job cards using {job_board_type} selectors...")
        
        for selector in selectors:
            try:
                # Wait for elements to be present safely
                def wait_for_selector():
                    page.wait_for_selector(selector, timeout=10000)
                
                try:
                    self._safe_page_operation(f"Wait for selector: {selector}", wait_for_selector)
                except Exception as e:
                    self.logger.debug(f"⚠️ Selector {selector} wait failed: {e}")
                    continue
                
                # Get all job cards safely
                def get_job_cards():
                    return page.query_selector_all(selector)
                
                cards = self._safe_page_operation(f"Get job cards with selector: {selector}", get_job_cards)
                if not cards:
                    self.logger.debug(f"⚠️ No cards found with selector: {selector}")
                    continue
                
                self.logger.info(f"✅ Found {len(cards)} job cards with selector: {selector}")
                
                for i, card in enumerate(cards):
                    try:
                        # Extract basic info from card
                        card_info = self._extract_card_info(card, page)
                        if card_info:
                            job_cards.append(card_info)
                        else:
                            # If extraction failed, try a simpler approach
                            self.logger.debug(f"⚠️ Card extraction failed for card {i}, trying simple approach")
                            simple_info = self._extract_simple_card_info(card, page)
                            if simple_info:
                                job_cards.append(simple_info)
                            
                    except Exception as e:
                        self.logger.debug(f"⚠️ Error extracting card {i}: {e}")
                        continue
                
                # If we found cards, break out of selector loop
                break
                
            except Exception as e:
                self.logger.debug(f"⚠️ Selector {selector} failed: {e}")
                continue
        
        self.logger.info(f"📋 Total job cards found: {len(job_cards)}")
        return job_cards
    
    def _extract_card_info(self, card, page: Page) -> Optional[Dict]:
        """Extract basic information from a job card."""
        try:
            # Get the card element
            card_element = card
            
            # Extract title
            title = ""
            title_selectors = [
                'h1', 'h2', 'h3', 'h4',
                '[class*="title"]',
                '[class*="Title"]',
                '.job-title',
                '.position-title',
                '.card-title'
            ]
            
            for selector in title_selectors:
                try:
                    title_elem = card_element.query_selector(selector)
                    if title_elem:
                        title = title_elem.inner_text().strip()
                        if title and len(title) > 3:
                            break
                except:
                    continue
            
            # If no title found, try to get text content from the card itself
            if not title:
                try:
                    title = card_element.inner_text().strip()
                    # Clean up the title - take first line and limit length
                    if title:
                        title_lines = title.split('\n')
                        title = title_lines[0].strip()
                        if len(title) > 100:  # Too long, probably not a title
                            title = ""
                except:
                    pass
            
            # Extract location
            location = ""
            location_selectors = [
                '[class*="location"]',
                '[class*="Location"]',
                '.location',
                '.job-location',
                '.address'
            ]
            
            for selector in location_selectors:
                try:
                    loc_elem = card_element.query_selector(selector)
                    if loc_elem:
                        location = loc_elem.inner_text().strip()
                        if location and len(location) > 2:
                            break
                except:
                    continue
            
            # Get the job URL
            job_url = ""
            try:
                # Since we found this with a[href*="/view/"], it should be a link
                job_url = card_element.get_attribute('href')
                
                # If still no URL, try to get it from the card's parent or surrounding elements
                if not job_url:
                    # Look for any clickable element that might contain the job URL
                    clickable_elem = card_element.query_selector('[onclick*="job"], [onclick*="view"], [onclick*="apply"]')
                    if clickable_elem:
                        onclick = clickable_elem.get_attribute('onclick')
                        if onclick:
                            # Extract URL from onclick handler
                            import re
                            url_match = re.search(r'["\']([^"\']*job[^"\']*)["\']', onclick)
                            if url_match:
                                job_url = url_match.group(1)
                
                # If still no URL, try to construct it from the card's data attributes
                if not job_url:
                    job_id = card_element.get_attribute('data-job-id') or card_element.get_attribute('data-id')
                    if job_id:
                        # Try common URL patterns
                        base_url = page.url
                        if 'apploi.com' in base_url:
                            job_url = f"https://jobs.apploi.com/view/{job_id}"
                        elif 'icims.com' in base_url:
                            job_url = f"{base_url}/job/{job_id}"
                        else:
                            job_url = f"{base_url}/job/{job_id}"
                
            except Exception as e:
                self.logger.debug(f"⚠️ Error extracting URL: {e}")
            
            # Make URL absolute if it's relative
            if job_url and not job_url.startswith('http'):
                job_url = urljoin(page.url, job_url)
            
            # Extract additional information from the card
            job_type = ""
            salary = ""
            company = ""
            
            # Try to extract job type from title
            if title:
                title_lower = title.lower()
                if any(term in title_lower for term in ['full time', 'full-time', 'fulltime']):
                    job_type = 'Full Time'
                elif any(term in title_lower for term in ['part time', 'part-time', 'parttime']):
                    job_type = 'Part Time'
                elif any(term in title_lower for term in ['per diem', 'perdiem', 'prn', 'casual']):
                    job_type = 'Per Diem'
                elif any(term in title_lower for term in ['temporary', 'temp', 'contract']):
                    job_type = 'Temporary'
            
            # Try to extract salary information from card
            salary_selectors = [
                '[class*="salary"]',
                '[class*="Salary"]',
                '[class*="pay"]',
                '[class*="Pay"]',
                '[class*="compensation"]',
                '[class*="Compensation"]'
            ]
            
            for selector in salary_selectors:
                try:
                    salary_elem = card_element.query_selector(selector)
                    if salary_elem:
                        salary = salary_elem.inner_text().strip()
                        if salary and len(salary) > 3:
                            break
                except:
                    continue
            
            # Try to extract company information from card
            company_selectors = [
                '[class*="company"]',
                '[class*="Company"]',
                '[class*="employer"]',
                '[class*="Employer"]'
            ]
            
            for selector in company_selectors:
                try:
                    company_elem = card_element.query_selector(selector)
                    if company_elem:
                        company = company_elem.inner_text().strip()
                        if company and len(company) > 2:
                            break
                except:
                    continue
            
            # For debugging, log what we found
            self.logger.debug(f"Card info - Title: '{title}', Location: '{location}', URL: '{job_url}', Type: '{job_type}', Salary: '{salary}', Company: '{company}'")
            
            # Return card info even if we only have a URL (we can extract title from the job page)
            if job_url:
                return {
                    'title': title,
                    'location': location,
                    'job_url': job_url,
                    'job_type': job_type,
                    'salary': salary,
                    'company': company,
                    'card_element': card_element
                }
            
        except Exception as e:
            self.logger.debug(f"⚠️ Error extracting card info: {e}")
        
        return None
    
    def _handle_pagination(self, page: Page) -> bool:
        """Handle pagination to load more jobs."""
        self.logger.info("📄 Checking for pagination...")
        
        for selector in self.pagination_selectors:
            try:
                # Look for pagination elements safely
                def find_pagination():
                    return page.query_selector(selector)
                
                pagination_elem = self._safe_page_operation(f"Find pagination with selector: {selector}", find_pagination)
                if not pagination_elem:
                    continue
                
                self.logger.info(f"✅ Found pagination with selector: {selector}")
                
                # Look for "Load More" or "Next" buttons
                load_more_selectors = [
                    'button:has-text("Load More")',
                    'button:has-text("Show More")',
                    'button:has-text("Next")',
                    'a:has-text("Next")',
                    '[aria-label*="next"]',
                    '[aria-label*="Next"]'
                ]
                
                for load_selector in load_more_selectors:
                    try:
                        def find_load_button():
                            return page.query_selector(load_selector)
                        
                        load_button = self._safe_page_operation(f"Find load button: {load_selector}", find_load_button)
                        if not load_button:
                            continue
                        
                        # Check if button is visible safely
                        try:
                            is_visible = load_button.is_visible()
                        except Exception as e:
                            self.logger.debug(f"⚠️ Error checking button visibility: {e}")
                            continue
                        
                        if is_visible:
                            self.logger.info(f"🔄 Clicking load more button: {load_selector}")
                            
                            def click_load_button():
                                load_button.click()
                                time.sleep(3)
                                page.wait_for_load_state('networkidle', timeout=10000)
                            
                            try:
                                self._safe_page_operation(f"Click load button: {load_selector}", click_load_button)
                                return True
                            except Exception as e:
                                self.logger.debug(f"⚠️ Error clicking load button: {e}")
                                continue
                                
                    except Exception as e:
                        self.logger.debug(f"⚠️ Load more button {load_selector} failed: {e}")
                        continue
                
                # If no load more button, try clicking next page
                next_selectors = [
                    'a:has-text("Next")',
                    'button:has-text("Next")',
                    '.next',
                    '.next-page'
                ]
                
                for next_selector in next_selectors:
                    try:
                        def find_next_button():
                            return page.query_selector(next_selector)
                        
                        next_button = self._safe_page_operation(f"Find next button: {next_selector}", find_next_button)
                        if not next_button:
                            continue
                        
                        # Check if button is visible safely
                        try:
                            is_visible = next_button.is_visible()
                        except Exception as e:
                            self.logger.debug(f"⚠️ Error checking button visibility: {e}")
                            continue
                        
                        if is_visible:
                            self.logger.info(f"🔄 Clicking next page button: {next_selector}")
                            
                            def click_next_button():
                                next_button.click()
                                time.sleep(3)
                                page.wait_for_load_state('networkidle', timeout=10000)
                            
                            try:
                                self._safe_page_operation(f"Click next button: {next_selector}", click_next_button)
                                return True
                            except Exception as e:
                                self.logger.debug(f"⚠️ Error clicking next button: {e}")
                                continue
                                
                    except Exception as e:
                        self.logger.debug(f"⚠️ Next page button {next_selector} failed: {e}")
                        continue
                
                break
                
            except Exception as e:
                self.logger.debug(f"⚠️ Pagination selector {selector} failed: {e}")
                continue
        
        self.logger.info("📄 No more pagination found")
        return False
    
    def _extract_job_details(self, page: Page, job_url: str, site_config: Dict) -> Optional[Dict]:
        """Extract detailed job information from individual job page."""
        if not job_url:
            return None
        
        self.logger.info(f"🔍 Extracting job details from: {job_url}")
        
        # Add timeout mechanism to prevent freezing
        start_time = datetime.now()
        timeout_seconds = 60  # 60 second timeout per job
        
        try:
            # Validate page object first
            if not self._validate_page(page):
                self.logger.error("❌ Invalid page object, cannot extract job details")
                return None
            
            # Store current page URL safely
            try:
                current_url = page.url
                self.logger.debug(f"🔗 Current page URL: {current_url}")
            except Exception as e:
                self.logger.error(f"❌ Error getting current URL: {e}")
                return None
            
            # Navigate to job page with safe operation
            def goto_job_page():
                page.goto(job_url, wait_until='domcontentloaded', timeout=10000)
                time.sleep(2)  # Short wait for content to load
            
            try:
                self._safe_page_operation("Navigate to job page", goto_job_page)
            except Exception as e:
                self.logger.error(f"❌ Failed to navigate to job page: {e}")
                return None
            
            # Check timeout
            if (datetime.now() - start_time).total_seconds() > timeout_seconds:
                self.logger.warning(f"⚠️ Timeout reached during navigation")
                return None
            
            # For Apploi pages, try to wait for specific content to load
            if 'apploi.com' in job_url:
                try:
                    def wait_for_apploi_content():
                        page.wait_for_selector('[class*="job"], [class*="position"], [class*="description"], [class*="details"]', timeout=5000)
                    
                    self._safe_page_operation("Wait for Apploi content", wait_for_apploi_content)
                except Exception as e:
                    self.logger.debug(f"⚠️ Apploi content wait failed: {e}")
                    # Continue without waiting
            
            # Check timeout
            if (datetime.now() - start_time).total_seconds() > timeout_seconds:
                self.logger.warning(f"⚠️ Timeout reached after content wait")
                return None
            
            # Get page content safely
            try:
                def get_page_content():
                    return page.content()
                
                page_content = self._safe_page_operation("Get page content", get_page_content)
                if page_content:
                    self.logger.debug(f"Page content length: {len(page_content)}")
                else:
                    self.logger.warning("⚠️ Failed to get page content")
                    return None
            except Exception as e:
                self.logger.error(f"❌ Error getting page content: {e}")
                return None
            
            # Check if we got redirected or hit an error page
            try:
                current_page_url = page.url
                if "error" in current_page_url.lower() or "not found" in current_page_url.lower():
                    self.logger.warning(f"⚠️ Hit error page: {current_page_url}")
                    return None
            except Exception as e:
                self.logger.warning(f"⚠️ Error checking page URL: {e}")
                # Continue anyway
            
            # Debug: Check what elements are available (safely)
            try:
                def get_debug_info():
                    return page.evaluate("""
                        () => {
                            const debug = {
                                url: window.location.href,
                                title: document.title,
                                h1Count: document.querySelectorAll('h1').length,
                                h2Count: document.querySelectorAll('h2').length,
                                jobTitleCount: document.querySelectorAll('.job-title').length,
                                positionTitleCount: document.querySelectorAll('.position-title').length,
                                allElements: [],
                                allText: document.body.innerText.substring(0, 500)
                            };
                            
                            // Get all elements with job-related classes
                            const jobElements = document.querySelectorAll('[class*="job"], [class*="position"], [class*="title"], [class*="description"], [class*="details"]');
                            for (let i = 0; i < Math.min(jobElements.length, 15); i++) {
                                const elem = jobElements[i];
                                debug.allElements.push({
                                    tag: elem.tagName,
                                    className: elem.className,
                                    text: elem.textContent ? elem.textContent.substring(0, 200) : ''
                                });
                            }
                            
                            return debug;
                        }
                    """)
                
                debug_info = self._safe_page_operation("Get debug info", get_debug_info)
                if debug_info:
                    self.logger.debug(f"Debug info: {debug_info}")
                else:
                    self.logger.debug("⚠️ Failed to get debug info")
            except Exception as e:
                self.logger.debug(f"⚠️ Error getting debug info: {e}")
                # Continue without debug info
            
            # Extract job details using JavaScript (safely)
            try:
                def extract_job_details():
                    return page.evaluate("""
                        () => {
                            const details = {
                                title: '',
                                company: '',
                                location: '',
                                salary: '',
                                job_type: '',
                                description: '',
                                requirements: '',
                                qualifications: '',
                                date_posted: '',
                                application_info: '',
                                job_url: window.location.href
                            };
                            
                            try {
                            
                            // Clean text function
                            const cleanText = (text) => {
                                if (!text) return '';
                                // Properly escape the text to avoid syntax errors
                                return text.replace(/\\s+/g, ' ').replace(/['"\\n\\r\\t]/g, ' ').trim();
                            };
                            
                            // Clean job description function
                            const cleanJobDescription = (text) => {
                                if (!text) return '';
                                
                                // Split into lines and filter out unwanted content
                                const lines = text.split('\\n').map(line => line.trim()).filter(line => {
                                    // Remove lines that are likely not job description content
                                    const lowerLine = line.toLowerCase();
                                    return !lowerLine.includes('apply now') &&
                                           !lowerLine.includes('terms and conditions') &&
                                           !lowerLine.includes('cookies and privacy policy') &&
                                           !lowerLine.includes('continue') &&
                                           !lowerLine.includes('©') &&
                                           !lowerLine.includes('about ') &&
                                           !lowerLine.includes('industry:') &&
                                           !lowerLine.includes('social:') &&
                                           !lowerLine.includes('company website') &&
                                           line.length > 0;
                                });
                                
                                // Join the filtered lines
                                let cleaned = lines.join('\\n');
                                
                                // Remove extra whitespace
                                cleaned = cleaned.replace(/\\s+/g, ' ').trim();
                                
                                // If the cleaned text is too short, return the original
                                if (cleaned.length < 50) {
                                    return text;
                                }
                                
                                return cleaned;
                            };
                            
                            // Check if this is an Apploi page
                            const isApploi = window.location.href.includes('apploi.com');
                            
                            // Extract title - try Apploi-specific selectors first
                            let titleFound = false;
                            if (isApploi) {
                                const apploiTitleSelectors = [
                                    '.job-title',
                                    '.position-title', 
                                    'h1',
                                    '[data-testid="job-title"]',
                                    '.job-name',
                                    '.position-name',
                                    '.job-header h1',
                                    '.job-details h1',
                                    '[class*="JobTitle"]',
                                    '[class*="PositionTitle"]',
                                    '[class*="job-title"]',
                                    '[class*="position-title"]'
                                ];
                                
                                for (const selector of apploiTitleSelectors) {
                                    const elem = document.querySelector(selector);
                                    if (elem && elem.textContent) {
                                        const title = cleanText(elem.textContent);
                                        if (title && title.length > 3 && title.length < 200) {
                                            details.title = title;
                                            titleFound = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // If no title found with Apploi selectors, try generic ones
                            if (!titleFound) {
                                const titleSelectors = [
                                    'h1', 'h2', '.job-title', '.position-title', '.title',
                                    '[class*="JobName"]', '[class*="JobTitle"]', '[class*="PositionTitle"]',
                                    '[data-job-title]', '.job-name', '.position-name'
                                ];
                                
                                for (const selector of titleSelectors) {
                                    const elem = document.querySelector(selector);
                                    if (elem && elem.textContent) {
                                        const title = cleanText(elem.textContent);
                                        if (title && title.length > 3 && title.length < 200) {
                                            details.title = title;
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // Extract company
                            const companySelectors = [
                                '.company', '.employer', '.company-name', '.organization',
                                '[class*="BrandName"]', '[class*="Company"]',
                                '[data-company]', '.job-company', '.employer-name'
                            ];
                            
                            for (const selector of companySelectors) {
                                const elem = document.querySelector(selector);
                                if (elem && elem.textContent) {
                                    const company = cleanText(elem.textContent);
                                    if (company && company.length > 2 && company.length < 100) {
                                        details.company = company;
                                        break;
                                    }
                                }
                            }
                            
                            // Extract location
                            const locationSelectors = [
                                '.location', '.job-location', '.address',
                                '[class*="Location"]', '[class*="MapLocation"]',
                                '[data-location]', '.job-city', '.job-state'
                            ];
                            
                            for (const selector of locationSelectors) {
                                const elem = document.querySelector(selector);
                                if (elem && elem.textContent) {
                                    const location = cleanText(elem.textContent);
                                    if (location && location.length > 2 && location.length < 100) {
                                        details.location = location;
                                        break;
                                    }
                                }
                            }
                            
                            // Extract salary
                            const salarySelectors = [
                                '.salary', '.compensation', '.pay-rate', '.job-salary',
                                '[class*="Salary"]', '[class*="Compensation"]', '[class*="Pay"]',
                                '[data-salary]', '.salary-range', '.pay-range'
                            ];
                            
                            for (const selector of salarySelectors) {
                                const elem = document.querySelector(selector);
                                if (elem && elem.textContent) {
                                    const salary = cleanText(elem.textContent);
                                    if (salary && salary.length > 3 && salary.length < 100) {
                                        const lowerSalary = salary.toLowerCase();
                                        if (lowerSalary.includes('$') || lowerSalary.includes('salary') || 
                                            lowerSalary.includes('pay') || lowerSalary.includes('compensation') ||
                                            lowerSalary.includes('hour') || lowerSalary.includes('year')) {
                                            details.salary = salary;
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // Extract job type
                            const typeSelectors = [
                                '.job-type', '.employment-type', '.schedule',
                                '[class*="Type"]', '[class*="Employment"]',
                                '[data-job-type]', '.job-schedule', '.work-schedule'
                            ];
                            
                            for (const selector of typeSelectors) {
                                const elem = document.querySelector(selector);
                                if (elem && elem.textContent) {
                                    const jobType = cleanText(elem.textContent);
                                    if (jobType && jobType.length > 2 && jobType.length < 50) {
                                        const lowerType = jobType.toLowerCase();
                                        const validTypes = ['full time', 'part time', 'per diem', 'temporary', 
                                                          'contract', 'permanent', 'seasonal', 'prn', 'casual'];
                                        if (validTypes.some(type => lowerType.includes(type))) {
                                            details.job_type = jobType;
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // Extract description
                            let descFound = false;
                            if (isApploi) {
                                // Apploi-specific description selectors
                                const apploiDescSelectors = [
                                    '[class*="description"]',
                                    '[class*="Description"]',
                                    '[class*="content"]',
                                    '[class*="Content"]',
                                    '[class*="details"]',
                                    '[class*="Details"]',
                                    '[class*="summary"]',
                                    '[class*="Summary"]',
                                    '.job-description',
                                    '.position-description',
                                    '.job-details',
                                    '.position-details',
                                    '.job-content',
                                    '.position-content',
                                    // New selectors based on the actual HTML structure
                                    '[class*="DangerousDiv"]',
                                    '[class*="SectionHeader"]',
                                    'div:has-text("DESCRIPTION")',
                                    'div:has-text("Description")',
                                    'div:has-text("Job Description")',
                                    'div:has-text("Position Description")',
                                    'p',  // Target all paragraph tags
                                    '[class*="sc-"]'  // Target styled components
                                ];
                                
                                for (const selector of apploiDescSelectors) {
                                    const elem = document.querySelector(selector);
                                    if (elem && elem.textContent) {
                                        const desc = cleanText(elem.textContent);
                                        if (desc && desc.length > 100 && desc.length < 10000) {
                                            details.description = desc;
                                            descFound = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // If no description found, try a more aggressive approach
                            if (!descFound) {
                                // Look for any div with substantial text content
                                const allDivs = document.querySelectorAll('div');
                                for (const div of allDivs) {
                                    const divText = cleanText(div.textContent);
                                    if (divText && divText.length > 200 && divText.length < 5000) {
                                        // Check if this div contains job-related content
                                        const lowerText = divText.toLowerCase();
                                        if (lowerText.includes('experience') || lowerText.includes('requirements') || 
                                            lowerText.includes('responsibilities') || lowerText.includes('qualifications') ||
                                            lowerText.includes('duties') || lowerText.includes('skills') ||
                                            lowerText.includes('license') || lowerText.includes('certification')) {
                                            details.description = divText;
                                            console.log('Found description with aggressive search');
                                            console.log('Description preview:', divText.substring(0, 200));
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            // If still no description found, try generic ones
                            if (!descFound) {
                                const descSelectors = [
                                    // Primary selector that worked in our test
                                    '[class*="Description"]',
                                    // Other Apploi-specific selectors
                                    '[class*="DangerousDiv"]',
                                    '[class*="SectionHeader"]',
                                    'div:has-text("DESCRIPTION")',
                                    'div:has-text("Description")',
                                    'div:has-text("Job Description")',
                                    'div:has-text("Position Description")',
                                    // More specific Apploi selectors
                                    '[data-testid="job-description"]',
                                    '[data-testid="description"]',
                                    '.job-description-content',
                                    '.position-description-content',
                                    // Generic selectors as fallback
                                    '.description', '.job-description', '.position-description',
                                    '[class*="Content"]', '[class*="Summary"]',
                                    '.job-details', '.position-details', '.job-summary',
                                    '.job-content', '.position-content', '.job-body',
                                    // Target the main content area
                                    'main',
                                    'article',
                                    // Target all divs that might contain descriptions
                                    'div[class*="description"]',
                                    'div[class*="content"]',
                                    'div[class*="body"]',
                                    // Fallback to paragraph tags
                                    'p'
                                ];
                                
                                for (const selector of descSelectors) {
                                    const elem = document.querySelector(selector);
                                    if (elem && elem.textContent) {
                                        let desc = cleanText(elem.textContent);
                                        
                                        // If the description is too short, try to get text from child paragraphs
                                        if (desc && desc.length < 100) {
                                            const paragraphs = elem.querySelectorAll('p');
                                            if (paragraphs.length > 0) {
                                                const paragraphTexts = [];
                                                for (const p of paragraphs) {
                                                    const pText = cleanText(p.textContent);
                                                    if (pText && pText.length > 5) {
                                                        paragraphTexts.push(pText);
                                                    }
                                                }
                                                if (paragraphTexts.length > 0) {
                                                    desc = paragraphTexts.join(' ');
                                                }
                                            }
                                        }
                                        
                                        // If still too short, try to get text from all child elements
                                        if (desc && desc.length < 100) {
                                            const allElements = elem.querySelectorAll('*');
                                            const textParts = [];
                                            for (const child of allElements) {
                                                const childText = cleanText(child.textContent);
                                                if (childText && childText.length > 10 && !textParts.includes(childText)) {
                                                    textParts.push(childText);
                                                }
                                            }
                                            if (textParts.length > 0) {
                                                desc = textParts.join(' ');
                                            }
                                        }
                                        
                                        if (desc && desc.length > 50 && desc.length < 10000) {
                                            // Clean up the description to focus on job content
                                            const cleanedDesc = cleanJobDescription(desc);
                                            if (cleanedDesc && cleanedDesc.length > 50) {
                                                details.description = cleanedDesc;
                                                console.log('Found description with selector:', selector);
                                                console.log('Description preview:', cleanedDesc.substring(0, 200));
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                            
                            // Extract requirements
                            const reqSelectors = [
                                '.requirements', '.qualifications', '.skills',
                                '[class*="Requirements"]', '[class*="Qualifications"]',
                                '.job-requirements', '.position-requirements',
                                '.job-qualifications', '.position-qualifications'
                            ];
                            
                            for (const selector of reqSelectors) {
                                const elem = document.querySelector(selector);
                                if (elem && elem.textContent) {
                                    const requirements = cleanText(elem.textContent);
                                    if (requirements && requirements.length > 20 && requirements.length < 2000) {
                                        details.requirements = requirements;
                                        break;
                                    }
                                }
                            }
                            
                            // Extract date posted
                            const dateSelectors = [
                                '.date', '.posted', '.date-posted', '.job-date',
                                '[data-posted-date]', '.created-date', '.job-posted'
                            ];
                            
                            for (const selector of dateSelectors) {
                                const elem = document.querySelector(selector);
                                if (elem && elem.textContent) {
                                    const date = cleanText(elem.textContent);
                                    if (date && date.length > 5 && date.length < 50) {
                                        details.date_posted = date;
                                        break;
                                    }
                                }
                            }
                            
                            } catch (error) {
                                console.error('Error in job details extraction:', error);
                            }
                            
                            return details;
                        }
                    """)
                
                job_details = self._safe_page_operation("Extract job details", extract_job_details)
                if not job_details:
                    self.logger.warning("⚠️ Failed to extract job details from JavaScript")
                    return None
                    
            except Exception as e:
                self.logger.error(f"❌ Error extracting job details: {e}")
                return None
            
            # Check timeout before final processing
            if (datetime.now() - start_time).total_seconds() > timeout_seconds:
                self.logger.warning(f"⚠️ Timeout reached before final processing")
                return None
            
            # Add metadata
            job_details['source_url'] = site_config['search_url']
            job_details['company'] = job_details.get('company') or site_config['source_site']
            job_details['state'] = site_config.get('state', 'CT')
            job_details['city'] = site_config.get('city', '')
            job_details['zip_code'] = site_config.get('zip_code', '')
            job_details['scraped_at'] = datetime.now().isoformat()
            
            # Go back to original page safely
            try:
                def go_back_to_original():
                    page.goto(current_url)
                    time.sleep(2)
                
                self._safe_page_operation("Go back to original page", go_back_to_original)
            except Exception as e:
                self.logger.warning(f"⚠️ Error going back to original page: {e}")
                # Continue anyway, this is not critical
            
            return job_details
            
        except Exception as e:
            self.logger.warning(f"❌ Error extracting job details from {job_url}: {e}")
            # Try to go back to original page safely
            try:
                if current_url:
                    def go_back_to_original():
                        page.goto(current_url)
                        time.sleep(2)
                    
                    self._safe_page_operation("Go back to original page (error recovery)", go_back_to_original)
            except Exception as recovery_error:
                self.logger.debug(f"⚠️ Error during error recovery: {recovery_error}")
            
            return None
    
    def _extract_simple_card_info(self, card, page: Page) -> Optional[Dict]:
        """Extract basic information from a job card using a simpler approach."""
        try:
            # Get the card element
            card_element = card
            
            # Get the URL directly from the link
            job_url = ""
            try:
                # Since we found this with a[href*="/view/"], it should be a link
                job_url = card_element.get_attribute('href')
            except:
                pass
            
            # Make URL absolute if it's relative
            if job_url and not job_url.startswith('http'):
                job_url = urljoin(page.url, job_url)
            
            # Get the text content as title
            title = ""
            try:
                title = card_element.inner_text().strip()
                # Clean up the title - take first line and limit length
                if title:
                    title_lines = title.split('\n')
                    title = title_lines[0].strip()
                    if len(title) > 100:  # Too long, probably not a title
                        title = title[:100].strip()
            except:
                pass
            
            # For debugging, log what we found
            self.logger.debug(f"Simple card info - Title: '{title}', URL: '{job_url}'")
            
            # Return if we have a URL
            if job_url:
                return {
                    'title': title,
                    'location': '',
                    'job_url': job_url,
                    'card_element': card_element
                }
            
        except Exception as e:
            self.logger.debug(f"⚠️ Error extracting simple card info: {e}")
        
        return None
    
    def _scrape_site_jobs(self, site_config: Dict, max_jobs: int = 50) -> List[Dict]:
        """Scrape jobs from a single site following the specified workflow."""
        site_jobs = []
        site_name = site_config['source_site']
        job_board_type = site_config.get('job_board_type', 'generic')
        
        self.logger.info(f"🏥 Processing site: {site_name}")
        self.logger.info(f"🔗 URL: {site_config['search_url']}")
        self.logger.info(f"📋 Job board type: {job_board_type}")
        
        start_time = datetime.now()
        
        try:
            # Step 1: Access the site safely
            self.logger.info(f"🌐 Accessing site: {site_config['search_url']}")
            
            def goto_site():
                self.page.goto(site_config['search_url'], wait_until='domcontentloaded')
            
            try:
                self._safe_page_operation("Access site", goto_site)
            except Exception as e:
                self.logger.error(f"❌ Failed to access site {site_name}: {e}")
                return site_jobs
            
            # Step 2: Wait for SPA to load
            if not self._wait_for_spa_load(self.page):
                self.logger.warning(f"⚠️ SPA load failed for {site_name}")
                return site_jobs
            
            # Step 3: Find job cards and analyze count
            all_job_cards = []
            page_num = 1
            
            while True:
                self.logger.info(f"📄 Processing page {page_num}...")
                
                # Find job cards on current page
                job_cards = self._find_job_cards(self.page, job_board_type)
                
                if job_cards:
                    all_job_cards.extend(job_cards)
                    self.logger.info(f"📋 Found {len(job_cards)} job cards on page {page_num}")
                    
                    # Check if we have enough jobs
                    if len(all_job_cards) >= max_jobs:
                        self.logger.info(f"✅ Reached max jobs limit ({max_jobs})")
                        break
                    
                    # Try to load more jobs via pagination
                    if not self._handle_pagination(self.page):
                        self.logger.info("📄 No more pages available")
                        break
                    
                    page_num += 1
                else:
                    self.logger.info("📄 No job cards found on this page")
                    break
            
            self.logger.info(f"📊 Total job cards found: {len(all_job_cards)}")
            
            # Step 4: Click through job cards and get details
            jobs_processed = 0
            for i, card_info in enumerate(all_job_cards[:max_jobs]):
                try:
                    self.logger.info(f"🔍 Processing job {i+1}/{min(len(all_job_cards), max_jobs)}: {card_info.get('title', 'Unknown')}")
                    
                    # Extract detailed job information
                    job_details = self._extract_job_details(self.page, card_info.get('job_url'), site_config)
                    
                    if job_details and job_details.get('title'):
                        # Merge card info with detailed info
                        final_job = {**card_info, **job_details}
                        site_jobs.append(final_job)
                        jobs_processed += 1
                        
                        self.logger.info(f"✅ Successfully extracted job: {job_details['title']}")
                    else:
                        # Fallback: Use card info if job details extraction failed
                        self.logger.warning(f"⚠️ No job details extracted from: {card_info.get('job_url')}")
                        self.logger.info(f"🔄 Using card info as fallback for: {card_info.get('title')}")
                        
                        # Create job from card info with enriched information
                        job_title = card_info.get('title', '')
                        card_job_type = card_info.get('job_type', '')
                        card_salary = card_info.get('salary', '')
                        card_company = card_info.get('company', '')
                        
                        # Create a comprehensive description using all available information
                        description_parts = []
                        
                        # Position information
                        if job_title:
                            description_parts.append(f"Position: {job_title}")
                        
                        # Location information
                        if site_config.get('city'):
                            description_parts.append(f"Location: {site_config.get('city')}, {site_config.get('state', 'CT')}")
                        elif card_info.get('location'):
                            description_parts.append(f"Location: {card_info.get('location')}")
                        else:
                            description_parts.append(f"Location: {site_config.get('state', 'CT')}")
                        
                        # ZIP code
                        if site_config.get('zip_code'):
                            description_parts.append(f"ZIP: {site_config.get('zip_code')}")
                        
                        # Company information
                        if card_company:
                            description_parts.append(f"Company: {card_company}")
                        else:
                            description_parts.append(f"Company: {site_config['source_site']}")
                        
                        # Job type information
                        if card_job_type:
                            description_parts.append(f"Job Type: {card_job_type}")
                        else:
                            # Detect job type from title if not found in card
                            title_lower = job_title.lower()
                            if any(term in title_lower for term in ['full time', 'full-time', 'fulltime']):
                                description_parts.append("Job Type: Full Time")
                            elif any(term in title_lower for term in ['part time', 'part-time', 'parttime']):
                                description_parts.append("Job Type: Part Time")
                            elif any(term in title_lower for term in ['per diem', 'perdiem', 'prn', 'casual']):
                                description_parts.append("Job Type: Per Diem")
                            elif any(term in title_lower for term in ['temporary', 'temp', 'contract']):
                                description_parts.append("Job Type: Temporary")
                        
                        # Salary information
                        if card_salary:
                            description_parts.append(f"Salary: {card_salary}")
                        
                        # Healthcare-specific context
                        if any(keyword in job_title.lower() for keyword in ['nurse', 'cna', 'lpn', 'rn', 'therapist', 'doctor', 'physician', 'medical', 'healthcare', 'care', 'dietitian', 'occupational', 'physical', 'speech']):
                            description_parts.append("Healthcare position in Connecticut")
                        
                        # Shift information (extract from title)
                        shift_keywords = ['morning', 'afternoon', 'evening', 'night', 'day', 'weekend', 'overnight', '7-3', '3-11', '11-7', '7am', '3pm', '11pm']
                        found_shifts = [keyword for keyword in shift_keywords if keyword in job_title.lower()]
                        if found_shifts:
                            description_parts.append(f"Shifts: {', '.join(found_shifts).title()}")
                        
                        # Application instructions
                        description_parts.append(f"Apply directly at: {card_info.get('job_url', '')}")
                        
                        # Determine final job type
                        final_job_type = card_job_type
                        if not final_job_type:
                            title_lower = job_title.lower()
                            if any(term in title_lower for term in ['full time', 'full-time', 'fulltime']):
                                final_job_type = 'Full Time'
                            elif any(term in title_lower for term in ['part time', 'part-time', 'parttime']):
                                final_job_type = 'Part Time'
                            elif any(term in title_lower for term in ['per diem', 'perdiem', 'prn', 'casual']):
                                final_job_type = 'Per Diem'
                            elif any(term in title_lower for term in ['temporary', 'temp', 'contract']):
                                final_job_type = 'Temporary'
                        
                        fallback_job = {
                            'title': job_title,
                            'company': card_company if card_company else site_config['source_site'],
                            'location': f"{site_config.get('city', '')}, {site_config.get('state', 'CT')}".strip(', ') if site_config.get('city') else (card_info.get('location') if card_info.get('location') else site_config.get('state', 'CT')),
                            'job_url': card_info.get('job_url', ''),
                            'source_url': site_config['search_url'],
                            'state': site_config.get('state', 'CT'),
                            'city': site_config.get('city', ''),
                            'zip_code': site_config.get('zip_code', ''),
                            'scraped_at': datetime.now().isoformat(),
                            'description': ' | '.join(description_parts),
                            'salary': card_salary,
                            'job_type': final_job_type,
                            'requirements': '',
                            'qualifications': '',
                            'date_posted': '',
                            'application_info': f"Apply directly at: {card_info.get('job_url', '')}"
                        }
                        
                        site_jobs.append(fallback_job)
                        jobs_processed += 1
                        
                        self.logger.info(f"✅ Added fallback job: {fallback_job['title']}")
                    
                    # Add delay between jobs
                    time.sleep(random.uniform(1, 3))
                    
                except Exception as e:
                    self.logger.warning(f"❌ Error processing job {i+1}: {e}")
                    continue
            
            duration = (datetime.now() - start_time).total_seconds()
            self.logger.info(f"✅ {site_name}: Successfully extracted {jobs_processed} jobs in {duration:.1f}s")
            
            # Update stats
            self.stats['sites_processed'] += 1
            self.stats['sites_successful'] += 1
            self.stats['total_jobs_found'] += len(all_job_cards)
            self.stats['total_jobs_extracted'] += len(site_jobs)
            self.stats['site_details'][site_name] = {
                'status': 'success',
                'job_cards_found': len(all_job_cards),
                'jobs_extracted': len(site_jobs),
                'duration_seconds': duration,
                'url': site_config['search_url']
            }
            
            return site_jobs
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self.logger.error(f"❌ Error scraping {site_name}: {e}")
            
            # Update stats
            self.stats['sites_processed'] += 1
            self.stats['sites_failed'] += 1
            self.stats['errors'].append({
                'site': site_name,
                'error': str(e),
                'url': site_config['search_url']
            })
            self.stats['site_details'][site_name] = {
                'status': 'error',
                'job_cards_found': 0,
                'jobs_extracted': 0,
                'duration_seconds': duration,
                'url': site_config['search_url'],
                'error': str(e)
            }
            
            return []
    
    def scrape_all_sites(self, max_sites: int = None, max_jobs_per_site: int = 20) -> List[Dict]:
        """Scrape jobs from all Connecticut healthcare sites."""
        self.logger.info("🚀 Starting improved Connecticut healthcare job scraping...")
        self.logger.info(f"📊 Total sites available: {len(self.site_configs)}")
        
        if not self._setup_browser():
            self.logger.error("❌ Failed to setup browser, aborting")
            return []
        
        all_jobs = []
        
        try:
            # Determine how many sites to process
            sites_to_process = self.site_configs
            if max_sites:
                sites_to_process = self.site_configs[:max_sites]
                self.logger.info(f"🔧 Test mode: Processing first {max_sites} sites")
            
            # Process each site
            for i, config in enumerate(sites_to_process, 1):
                self.logger.info(f"📋 Processing {i}/{len(sites_to_process)}: {config['source_site']}")
                
                try:
                    site_jobs = self._scrape_site_jobs(config, max_jobs_per_site)
                    all_jobs.extend(site_jobs)
                    
                    # Save progress after each site
                    self.save_progress(all_jobs, config['source_site'])
                    
                    # Add delay between sites
                    time.sleep(random.uniform(2, 5))
                    
                except Exception as e:
                    self.logger.error(f"❌ Error processing site {config['source_site']}: {e}")
                    # Still save progress even if this site failed
                    if all_jobs:
                        self.save_progress(all_jobs, f"failed_{config['source_site']}")
                    continue
            
            # Remove duplicates
            unique_jobs = self._remove_duplicates(all_jobs)
            self.logger.info(f"🔄 Removed {len(all_jobs) - len(unique_jobs)} duplicate jobs")
            
            # Update final stats
            self.stats['end_time'] = datetime.now()
            self.stats['total_jobs_found'] = len(unique_jobs)
            
            self.logger.info(f"🎉 Scraping completed! Found {len(unique_jobs)} unique jobs")
            
            return unique_jobs
            
        except Exception as e:
            self.logger.error(f"❌ Error during scraping: {e}")
            # Save whatever we have so far
            if all_jobs:
                self.save_progress(all_jobs, "error_recovery")
            return []
        
        finally:
            # Cleanup
            try:
                if self.page and hasattr(self.page, 'close'):
                    self.page.close()
            except Exception as e:
                self.logger.debug(f"⚠️ Error closing page: {e}")
            
            try:
                if self.context and hasattr(self.context, 'close'):
                    self.context.close()
            except Exception as e:
                self.logger.debug(f"⚠️ Error closing context: {e}")
            
            try:
                if self.browser and hasattr(self.browser, 'close'):
                    self.browser.close()
            except Exception as e:
                self.logger.debug(f"⚠️ Error closing browser: {e}")
            
            try:
                if self.playwright and hasattr(self.playwright, 'stop'):
                    self.playwright.stop()
            except Exception as e:
                self.logger.debug(f"⚠️ Error stopping playwright: {e}")
    
    def _remove_duplicates(self, jobs: List[Dict]) -> List[Dict]:
        """Remove duplicate jobs based on title and company."""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            # Create a key based on title and company
            key = f"{job.get('title', '').lower()}_{job.get('company', '').lower()}"
            
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
        
        return unique_jobs
    
    def save_progress(self, jobs: List[Dict], site_name: str = "", filename_prefix: str = "improved_ct_jobs_progress"):
        """Save current progress to a file after each site."""
        if not jobs:
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        site_suffix = f"_{site_name.replace(' ', '_').replace('/', '_')}" if site_name else ""
        
        # Save as JSON
        json_filename = f"{filename_prefix}{site_suffix}_{len(jobs)}_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(jobs, f, indent=2, ensure_ascii=False)
        
        self.logger.info(f"💾 Progress saved: {json_filename} ({len(jobs)} jobs)")
    
    def save_jobs(self, jobs: List[Dict], filename_prefix: str = "improved_ct_jobs"):
        """Save jobs to JSON and CSV files."""
        if not jobs:
            self.logger.warning("⚠️ No jobs to save")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save as JSON
        json_filename = f"{filename_prefix}_{len(jobs)}_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(jobs, f, indent=2, ensure_ascii=False)
        
        # Save as CSV
        csv_filename = f"{filename_prefix}_{len(jobs)}_{timestamp}.csv"
        if jobs:
            # Get all unique fieldnames from all job dicts
            fieldnames = set()
            for job in jobs:
                fieldnames.update(job.keys())
            fieldnames = sorted(list(fieldnames))
            
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                for job in jobs:
                    writer.writerow(job)
        
        self.logger.info(f"💾 Jobs saved: {json_filename} ({len(jobs)} jobs)")
        self.logger.info(f"💾 Jobs saved: {csv_filename} ({len(jobs)} jobs)")
    
    def print_summary(self):
        """Print comprehensive scraping summary."""
        print("="*80)
        print("🎯 IMPROVED CONNECTICUT HEALTHCARE JOB SCRAPING SUMMARY")
        print("="*80)
        
        # Basic statistics
        print(f"📊 BASIC STATISTICS:")
        print(f"   Sites processed: {self.stats['sites_processed']}")
        print(f"   Sites successful: {self.stats['sites_successful']}")
        print(f"   Sites failed: {self.stats['sites_failed']}")
        print(f"   Total job cards found: {self.stats['total_jobs_found']}")
        print(f"   Total jobs extracted: {self.stats['total_jobs_extracted']}")
        print(f"   Page corruptions detected: {self.stats['page_corruptions']}")
        print(f"   Page recreations: {self.stats['page_recreations']}")
        
        # Timing information
        if self.stats['start_time'] and self.stats.get('end_time'):
            duration = (self.stats['end_time'] - self.stats['start_time']).total_seconds()
            print(f"\n⏱️ TIMING:")
            print(f"   Start time: {self.stats['start_time'].strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"   End time: {self.stats['end_time'].strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"   Total duration: {duration:.1f} seconds ({duration/60:.1f} minutes)")
            
            if self.stats['sites_processed'] > 0:
                avg_time_per_site = duration / self.stats['sites_processed']
                print(f"   Average time per site: {avg_time_per_site:.1f} seconds")
        
        # Site details
        if self.stats['site_details']:
            print(f"\n🏥 SITE DETAILS:")
            successful_sites = [site for site, details in self.stats['site_details'].items() 
                              if details.get('status') == 'success']
            failed_sites = [site for site, details in self.stats['site_details'].items() 
                           if details.get('status') == 'error']
            
            print(f"   Successful sites: {len(successful_sites)}")
            print(f"   Failed sites: {len(failed_sites)}")
            
            # Show top performing sites
            if successful_sites:
                print(f"\n   🏆 TOP PERFORMING SITES:")
                site_jobs = [(site, self.stats['site_details'][site]['jobs_extracted']) 
                            for site in successful_sites]
                site_jobs.sort(key=lambda x: x[1], reverse=True)
                
                for i, (site, jobs) in enumerate(site_jobs[:5], 1):
                    duration = self.stats['site_details'][site]['duration_seconds']
                    print(f"     {i}. {site}: {jobs} jobs ({duration:.1f}s)")
        
        # Errors
        if self.stats['errors']:
            print(f"\n❌ ERRORS ENCOUNTERED ({len(self.stats['errors'])}):")
            for i, error in enumerate(self.stats['errors'][:5], 1):
                print(f"   {i}. {error['site']}: {error['error']}")
                if 'url' in error:
                    print(f"      URL: {error['url']}")
        
        print("="*80)

def main():
    """Main function to run the improved Connecticut job scraper."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Improved Connecticut Healthcare Job Scraper')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode with detailed logging')
    parser.add_argument('--headless', action='store_true', default=True, help='Run in headless mode (default: True)')
    parser.add_argument('--max-sites', type=int, help='Maximum sites to scrape (for testing)')
    parser.add_argument('--max-jobs-per-site', type=int, default=20, help='Maximum jobs to scrape per site (default: 20)')
    parser.add_argument('--test', action='store_true', help='Run in test mode (scrape only first 3 sites)')
    
    args = parser.parse_args()
    
    print("🚀 Starting Improved Connecticut Healthcare Job Scraper...")
    print(f"🔧 Configuration:")
    print(f"   Debug mode: {args.debug}")
    print(f"   Headless mode: {args.headless}")
    print(f"   Max jobs per site: {args.max_jobs_per_site}")
    print(f"   Test mode: {args.test}")
    
    scraper = ImprovedCTJobScraper(headless=args.headless, debug=args.debug)
    
    # Determine max sites for test mode
    max_sites = None
    if args.test:
        max_sites = 3
    elif args.max_sites:
        max_sites = args.max_sites
    
    # Run the scraper
    jobs = scraper.scrape_all_sites(
        max_sites=max_sites, 
        max_jobs_per_site=args.max_jobs_per_site
    )
    
    if jobs:
        # Save results
        scraper.save_jobs(jobs)
        
        # Print summary
        scraper.print_summary()
        
        print(f"\n✅ Improved Connecticut job scraping completed successfully!")
        print(f"📁 Results saved to: improved_ct_jobs_{len(jobs)}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    else:
        print("❌ No jobs found or scraping failed")

if __name__ == "__main__":
    main() 