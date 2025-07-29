#!/usr/bin/env python3
"""
Improved Connecticut Healthcare Job Scraper with successful job description extraction.
"""

import sys
import os
import time
import json
import csv
import signal
import threading
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, Page
import logging
import ipdb as pdb

def setup_logging(debug: bool = False):
    """Setup logging configuration."""
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s | %(levelname)-8s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    return logging.getLogger(__name__)

class ImprovedCTJobScraper:
    """Improved Connecticut Healthcare Job Scraper with successful description extraction."""
    
    def __init__(self, headless: bool = True, debug: bool = False, resume_from_progress: bool = True):
        self.logger = setup_logging(debug)
        self.headless = headless
        self.debug = debug
        self.resume_from_progress = resume_from_progress
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        self.ct_sites = []
        self.total_jobs_scraped = 0
        self.successful_sites = 0
        self.failed_sites = 0
        self.failed_urls = set()  # Track URLs that have failed to avoid retrying them
        self.corruption_count = 0  # Track how many times corruption has been detected
        
        # Progress tracking for restart functionality
        self.progress_file = "scraper_progress.json"
        self.last_activity_time = time.time()
        self.current_site_index = 0
        self.current_job_index = 0
        self.current_site_name = ""
        self.scraped_jobs = []  # All jobs scraped so far
        self.site_jobs = []  # Jobs from current site
        self.is_running = False
        self.last_progress_save = time.time()
        self.progress_save_interval = 60  # Save progress every 60 seconds
        
        # Timeout detection
        self.max_job_timeout = 120  # 2 minutes per job
        self.max_site_timeout = 1800  # 30 minutes per site
        self.max_total_timeout = 7200  # 2 hours total
        self.start_time = time.time()
        
        # Load progress if resuming
        if self.resume_from_progress:
            self._load_progress()
        
        # Pre-populate with known problematic URLs
        self.failed_urls.add("https://jobs.apploi.com/view/1439065?utm_campaign=jobs_snippet&utm_source=Ryders_Health_Management-career-page&utm_medium=client-web-site&utm_term=apploi-snippet&_=1753467150.221748")
        self.failed_urls.add("https://jobs.apploi.com/view/877843?utm_campaign=jobs_snippet&utm_source=Ryders_Health_Management-career-page&utm_medium=client-web-site&utm_term=apploi-snippet&_=1753468527.5839765")
        self.failed_urls.add("https://jobs.apploi.com/view/1439065?utm_campaign=jobs_snippet&utm_source=Ryders_Health_Management-career-page&utm_medium=client-web-site&utm_term=apploi-snippet&_=1753468274.059498")
        self.failed_urls.add("https://jobs.apploi.com/view/877843?utm_campaign=jobs_snippet&utm_source=Ryders_Health_Management-career-page&utm_medium=client-web-site&utm_term=apploi-snippet&_=1753469271.0406475")
        
        # Job card selectors for different job board types
        self.job_card_selectors = {
            'apploi': [
                'a[href*="/view/"]',
                '[class*="JobCard"]',
                '[class*="PositionCard"]',
                '.job-card',
                '.position-card'
            ],
            'generic': [
                'a[href*="job"]',
                'a[href*="position"]',
                'a[href*="career"]',
                '.job-card',
                '.position-card',
                '.job-listing',
                '.position-listing',
                '[class*="JobCard"]',
                '[class*="PositionCard"]'
            ]
        }
        
        # Load Connecticut healthcare sites
        self._load_ct_sites()
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals gracefully."""
        self.logger.info(f"🛑 Received signal {signum}, shutting down gracefully...")
        self.is_running = False
        self._save_progress()
        self._cleanup()
        sys.exit(0)
    
    def _load_progress(self):
        """Load progress from file if it exists."""
        try:
            if os.path.exists(self.progress_file):
                with open(self.progress_file, 'r', encoding='utf-8') as f:
                    progress = json.load(f)
                
                self.current_site_index = progress.get('current_site_index', 0)
                self.current_job_index = progress.get('current_job_index', 0)
                self.current_site_name = progress.get('current_site_name', "")
                self.scraped_jobs = progress.get('scraped_jobs', [])
                self.failed_urls = set(progress.get('failed_urls', []))
                self.successful_sites = progress.get('successful_sites', 0)
                self.failed_sites = progress.get('failed_sites', 0)
                self.total_jobs_scraped = progress.get('total_jobs_scraped', 0)
                
                self.logger.info(f"📂 Loaded progress: Site {self.current_site_index}, Job {self.current_job_index}")
                self.logger.info(f"📊 Resume point: {self.current_site_name} ({len(self.scraped_jobs)} jobs already scraped)")
                return True
        except Exception as e:
            self.logger.warning(f"⚠️ Could not load progress: {e}")
        return False
    
    def _save_progress(self):
        """Save current progress to file."""
        try:
            progress = {
                'timestamp': datetime.now().isoformat(),
                'current_site_index': self.current_site_index,
                'current_job_index': self.current_job_index,
                'current_site_name': self.current_site_name,
                'scraped_jobs': self.scraped_jobs,
                'failed_urls': list(self.failed_urls),
                'successful_sites': self.successful_sites,
                'failed_sites': self.failed_sites,
                'total_jobs_scraped': self.total_jobs_scraped,
                'last_activity_time': self.last_activity_time
            }
            
            with open(self.progress_file, 'w', encoding='utf-8') as f:
                json.dump(progress, f, indent=2, ensure_ascii=False)
            
            self.last_progress_save = time.time()
            self.logger.debug(f"💾 Progress saved: Site {self.current_site_index}, Job {self.current_job_index}")
            
        except Exception as e:
            self.logger.error(f"❌ Error saving progress: {e}")
    
    def _check_timeout(self, operation: str = "general") -> bool:
        """Check if any timeout has been exceeded."""
        current_time = time.time()
        elapsed = current_time - self.start_time
        
        # Check total timeout
        if elapsed > self.max_total_timeout:
            self.logger.warning(f"⚠️ Total timeout exceeded ({elapsed:.1f}s > {self.max_total_timeout}s)")
            return True
        
        # Check site timeout
        if operation == "site" and elapsed > self.max_site_timeout:
            self.logger.warning(f"⚠️ Site timeout exceeded ({elapsed:.1f}s > {self.max_site_timeout}s)")
            return True
        
        # Check job timeout
        if operation == "job" and elapsed > self.max_job_timeout:
            self.logger.warning(f"⚠️ Job timeout exceeded ({elapsed:.1f}s > {self.max_job_timeout}s)")
            return True
        
        return False
    
    def _update_activity(self):
        """Update last activity time."""
        self.last_activity_time = time.time()
        
        # Auto-save progress periodically
        if time.time() - self.last_progress_save > self.progress_save_interval:
            self._save_progress()
    
    def _cleanup(self):
        """Clean up resources."""
        try:
            if hasattr(self, 'page') and self.page:
                self.page.close()
        except:
            pass
        
        try:
            if hasattr(self, 'context') and self.context:
                self.context.close()
        except:
            pass
        
        try:
            if hasattr(self, 'browser') and self.browser:
                self.browser.close()
        except:
            pass
        
        try:
            if hasattr(self, 'playwright') and self.playwright:
                self.playwright.stop()
        except:
            pass
        
        self.logger.info("🧹 Cleanup completed")
    
    def _load_ct_sites(self) -> List[Dict]:
        """Load Connecticut healthcare sites from CSV file."""
        try:
            csv_path = 'ct_only.csv'
            if not os.path.exists(csv_path):
                self.logger.error(f"❌ CSV file not found: {csv_path}")
                return []
            
            sites = []
            with open(csv_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    sites.append(row)
            
            self.ct_sites = sites
            self.logger.info(f"✅ Loaded {len(sites)} Connecticut healthcare sites from {csv_path}")
            return sites
            
        except Exception as e:
            self.logger.error(f"❌ Error loading CT sites: {e}")
            return []
    
    def _setup_browser(self) -> bool:
        """Setup Playwright browser with anti-bot detection measures."""
        try:
            self.logger.info("🔧 Setting up Playwright browser...")
            self.playwright = sync_playwright().start()
            
            # Use only Chromium for better compatibility
            try:
                self.logger.info("🔧 Launching Chromium browser...")
                self.browser = self.playwright.chromium.launch(
                    headless=self.headless,
                    args=[
                        '--no-sandbox',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-dev-shm-usage',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor'
                    ]
                )
                
                # Create context with stealth measures
                self.context = self.browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    extra_http_headers={
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                    },
                    viewport={'width': 1920, 'height': 1080}
                )
                
                # Add script to hide webdriver
                self.context.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined,
                    });
                """)
                
                self.page = self.context.new_page()
                self.logger.info("✅ Browser setup completed successfully")
                return True
            except Exception as e:
                self.logger.error(f"❌ Failed to setup Chromium browser: {e}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Failed to setup Playwright browser: {e}")
            return False
    
    def _ensure_valid_page(self) -> bool:
        """Ensure self.page is a valid Playwright Page object, recreate if necessary."""
        try:
            # Check if page exists and is valid
            if not hasattr(self, 'page') or not self.page:
                self.logger.warning("⚠️ self.page is not available, creating new page")
                if hasattr(self, 'context') and self.context:
                    self.page = self.context.new_page()
                    return True
                else:
                    self.logger.error("❌ No context available to create new page")
                    return False
            
            # Check if page is a dict (corrupted)
            if isinstance(self.page, dict):
                self.logger.warning("⚠️ self.page is corrupted (dict), recreating page")
                try:
                    if hasattr(self, 'context') and self.context:
                        self.page = self.context.new_page()
                        self.logger.info("✅ Successfully recreated corrupted page")
                        return True
                    else:
                        self.logger.error("❌ No context available to recreate page")
                        return False
                except Exception as e:
                    self.logger.error(f"❌ Error recreating page: {e}")
                    return False
            
            # Check if page has required methods
            if not hasattr(self.page, 'goto') or not hasattr(self.page, 'title'):
                self.logger.warning("⚠️ self.page is not a valid Playwright Page object, recreating")
                try:
                    if hasattr(self, 'context') and self.context:
                        self.page = self.context.new_page()
                        self.logger.info("✅ Successfully recreated invalid page")
                        return True
                    else:
                        self.logger.error("❌ No context available to recreate page")
                        return False
                except Exception as e:
                    self.logger.error(f"❌ Error recreating page: {e}")
                    return False
            
            # Test if page is still responsive
            try:
                # Try a simple operation to test if page is still valid
                test_url = self.page.url
                return True
            except Exception as e:
                # Check for the specific dict corruption error
                if "'dict' object has no attribute" in str(e):
                    self.logger.error(f"❌ Page corruption detected during responsiveness test: {e}")
                    try:
                        if hasattr(self, 'context') and self.context:
                            self.page = self.context.new_page()
                            self.logger.info("✅ Successfully recreated corrupted page")
                            return True
                        else:
                            self.logger.error("❌ No context available to recreate page")
                            return False
                    except Exception as recreate_error:
                        self.logger.error(f"❌ Error recreating page: {recreate_error}")
                        return False
                else:
                    self.logger.warning(f"⚠️ self.page is not responsive: {e}, recreating")
                    try:
                        if hasattr(self, 'context') and self.context:
                            self.page = self.context.new_page()
                            self.logger.info("✅ Successfully recreated unresponsive page")
                            return True
                        else:
                            self.logger.error("❌ No context available to recreate page")
                            return False
                    except Exception as recreate_error:
                        self.logger.error(f"❌ Error recreating page: {recreate_error}")
                        return False
            
        except Exception as e:
            # Check for the specific dict corruption error
            if "'dict' object has no attribute" in str(e):
                self.logger.error(f"❌ Page corruption detected in _ensure_valid_page: {e}")
                try:
                    if hasattr(self, 'context') and self.context:
                        self.page = self.context.new_page()
                        self.logger.info("✅ Successfully recreated corrupted page")
                        return True
                    else:
                        self.logger.error("❌ No context available to recreate page")
                        return False
                except Exception as recreate_error:
                    self.logger.error(f"❌ Error recreating page: {recreate_error}")
                    return False
            else:
                self.logger.error(f"❌ Error in _ensure_valid_page: {e}")
                return False
    
    def _safe_page_operation(self, page: Page, operation_name: str, operation_func, *args, **kwargs):
        """Safely execute a page operation, catching dict corruption errors."""
        try:
            # Check for corruption before any operation
            if isinstance(page, dict):
                self.logger.error(f"❌ Page is corrupted (dict) before {operation_name}")
                return None
            
            # Validate page object
            if not hasattr(page, 'goto'):
                self.logger.error(f"❌ Page is not a valid Playwright object before {operation_name}")
                return None
            
            # Execute the operation
            return operation_func(*args, **kwargs)
            
        except Exception as e:
            # Check for the specific dict corruption error
            if "'dict' object has no attribute" in str(e):
                self.logger.error(f"❌ Page corruption detected during {operation_name}: {e}")
                return None
            else:
                # Re-raise non-corruption errors
                raise e
    
    def _handle_dict_corruption(self, error_msg: str, job_url: str = "") -> bool:
        """Centralized handler for dict corruption errors."""
        self.logger.error(f"❌ Dict corruption detected: {error_msg}")
        
        if job_url:
            self.failed_urls.add(job_url)
            self.logger.info(f"📝 Added {job_url} to failed URLs list")
        
        # Increment corruption counter
        self.corruption_count += 1
        
        # If corruption happens multiple times, recreate browser context
        if self.corruption_count >= 3:
            self.logger.warning("⚠️ Multiple corruption events detected, recreating browser context")
            if self._recreate_browser_context():
                self.corruption_count = 0  # Reset counter
                return True
            else:
                self.logger.error("❌ Failed to recreate browser context")
                return False
        
        # Try to recreate page
        if hasattr(self, 'context') and self.context:
            try:
                self.page = self.context.new_page()
                self.logger.info("✅ Successfully recreated page after corruption")
                return True
            except Exception as recreate_error:
                self.logger.error(f"❌ Failed to recreate page: {recreate_error}")
                return False
        
        return False

    def _extract_job_details(self, page: Page, job_url: str, site_config: Dict) -> Optional[Dict]:
        """Extract detailed job information from individual job page using Python-based approach."""
        if not job_url:
            return None
        
        self.logger.info(f"🔍 Extracting job details from: {job_url}")
        
        # IMMEDIATE CORRUPTION CHECK - catch it before any processing
        if isinstance(page, dict):
            self.logger.error(f"❌ Page is corrupted (dict) at start of _extract_job_details, skipping job: {job_url}")
            return None
        
        # Add timeout mechanism to prevent freezing
        start_time = datetime.now()
        timeout_seconds = 60  # 60 second timeout per job
        
        try:
            # EARLY CORRUPTION CHECK - catch it immediately
            if isinstance(page, dict):
                self.logger.error(f"❌ Page is corrupted (dict) at start of _extract_job_details, skipping job: {job_url}")
                return None
            
            # ULTRA-EARLY CORRUPTION CHECK - test page responsiveness before any operations
            try:
                test_url = page.url
                test_title = page.title()
            except Exception as e:
                if "'dict' object has no attribute" in str(e):
                    self.logger.error(f"❌ Page corruption detected during responsiveness test, skipping job: {job_url}")
                    raise Exception("PAGE_CORRUPTION_DETECTED")
                else:
                    self.logger.warning(f"⚠️ Page not responsive during test: {e}")
                    return None
            
            # Comprehensive validation of page object
            if not page:
                self.logger.error("❌ page is None")
                return None
            
            if not hasattr(page, 'goto'):
                self.logger.error(f"❌ page is not a Playwright Page object: {type(page)}")
                return None
            
            # Test if page is responsive and has required methods
            try:
                test_url = page.url
                # Test if page has the required methods
                if not hasattr(page, 'title') or not hasattr(page, 'inner_text'):
                    self.logger.error("❌ page object is missing required methods")
                    return None
            except Exception as e:
                self.logger.error(f"❌ page is not responsive: {e}")
                return None
            
            # Check timeout before proceeding
            if (datetime.now() - start_time).total_seconds() > timeout_seconds:
                self.logger.warning(f"⚠️ Timeout reached before starting job extraction")
                return None
            
            # Store current page URL
            try:
                current_url = page.url
            except Exception as e:
                self.logger.error(f"❌ Error getting page URL: {e}")
                return None
            
            # Navigate to job page and wait for full rendering
            try:
                page.goto(job_url, wait_until='domcontentloaded', timeout=15000)
                time.sleep(3)  # Additional wait for JavaScript execution
                
                # IMMEDIATE CORRUPTION CHECK after navigation
                if isinstance(page, dict):
                    self.logger.error(f"❌ Page corruption detected immediately after navigation, skipping job: {job_url}")
                    return None
                    
            except Exception as e:
                self.logger.error(f"❌ Error navigating to job URL: {e}")
                return None
            
            # Check timeout after navigation
            if (datetime.now() - start_time).total_seconds() > timeout_seconds:
                self.logger.warning(f"⚠️ Timeout reached after navigation")
                return None
            
            # Debug: Check what URL we actually ended up on
            try:
                current_url = page.url
                self.logger.info(f"🔗 Current page URL: {current_url}")
            except Exception as e:
                self.logger.error(f"❌ Error getting current URL: {e}")
                return None
            
            # Debug: Check if we're on the right page - with better error handling
            try:
                # Validate page object again before calling title()
                if not isinstance(page, dict) and hasattr(page, 'title'):
                    page_title = page.title()
                    self.logger.info(f"📋 Page title: {page_title}")
                else:
                    self.logger.warning("⚠️ Page object is corrupted, skipping title extraction")
            except Exception as e:
                # Check for the specific dict corruption error
                if "'dict' object has no attribute" in str(e):
                    self.logger.error(f"❌ Page corruption detected during title check: {e}")
                    # CRITICAL: Raise a special exception to signal corruption to the retry loop
                    raise Exception("PAGE_CORRUPTION_DETECTED")
                else:
                    self.logger.warning(f"⚠️ Error getting page title: {e}")
                    # Let the retry loop handle corruption detection
                    pass
            
            # Check timeout before content processing
            if (datetime.now() - start_time).total_seconds() > timeout_seconds:
                self.logger.warning(f"⚠️ Timeout reached before content processing")
                return None
            
            # For Apploi pages, wait for content to load
            if 'apploi.com' in job_url:
                try:
                    # Check if page is corrupted before any operations
                    if isinstance(page, dict):
                        self.logger.error("❌ Page is corrupted (dict) during Apploi content wait, skipping job")
                        return None
                    
                    # Wait for job content to appear (avoid browser update messages)
                    page.wait_for_selector('[class*="job"], [class*="position"], [class*="description"], [class*="details"], [class*="MapLocation"], [class*="compensation"]', timeout=10000)
                    
                    # Wait for network to be idle
                    page.wait_for_load_state('networkidle', timeout=10000)
                    self.logger.info("✅ Network is idle, content should be loaded")
                    
                    # Additional wait for dynamic content
                    time.sleep(3)
                    
                    # Check if we're getting a browser update message
                    try:
                        # Validate page before inner_text call
                        if isinstance(page, dict):
                            self.logger.error("❌ Page is corrupted (dict) during content check, skipping job")
                            return None
                        
                        page_content = page.inner_text('body')
                        if 'update your browser' in page_content.lower():
                            self.logger.warning("⚠️ Detected browser update message, trying to dismiss it...")
                            
                            # Try to dismiss the browser update warning
                            try:
                                # Validate page before query_selector call
                                if isinstance(page, dict):
                                    self.logger.error("❌ Page is corrupted (dict) during dismiss attempt, skipping job")
                                    return None
                                
                                # Look for the dismiss button or close the warning
                                dismiss_button = page.query_selector('#buorgul, .buorg a, [class*="close"], [class*="dismiss"]')
                                if dismiss_button:
                                    dismiss_button.click()
                                    self.logger.info("✅ Clicked dismiss button")
                                    time.sleep(2)
                                else:
                                    # Try to remove the warning div directly
                                    page.evaluate("""
                                        const warning = document.querySelector('.buorg, #buorg');
                                        if (warning) {
                                            warning.remove();
                                        }
                                    """)
                                    self.logger.info("✅ Removed browser warning div")
                                    time.sleep(2)
                            except Exception as e:
                                self.logger.debug(f"⚠️ Error dismissing browser warning: {e}")
                            
                            # Wait for the actual content to load
                            time.sleep(3)
                            
                            # Try to wait for job content to appear
                            try:
                                # Validate page before wait_for_selector call
                                if isinstance(page, dict):
                                    self.logger.error("❌ Page is corrupted (dict) during content wait, skipping job")
                                    return None
                                
                                page.wait_for_selector('[class*="job"], [class*="position"], [class*="description"], [class*="details"], [class*="MapLocation"], [class*="compensation"], [data-testid="job-description"]', timeout=8000)
                                self.logger.info("✅ Job content appeared after dismissing warning")
                            except:
                                self.logger.warning("⚠️ Job content still not visible after dismissing warning")
                        else:
                            self.logger.info("✅ No browser update warning detected, page should be loading normally")
                            
                            # Wait for job content to appear even without browser warning
                            try:
                                # Validate page before wait_for_selector call
                                if isinstance(page, dict):
                                    self.logger.error("❌ Page is corrupted (dict) during content wait, skipping job")
                                    return None
                                
                                page.wait_for_selector('[class*="job"], [class*="position"], [class*="description"], [class*="details"], [class*="MapLocation"], [class*="compensation"], [data-testid="job-description"]', timeout=10000)
                                self.logger.info("✅ Job content appeared")
                            except:
                                self.logger.warning("⚠️ Job content not visible, trying alternative approach")
                                
                                # Try to wait for any content to load
                                try:
                                    # Validate page before wait_for_selector call
                                    if isinstance(page, dict):
                                        self.logger.error("❌ Page is corrupted (dict) during body wait, skipping job")
                                        return None
                                    
                                    page.wait_for_selector('body', timeout=3000)
                                    self.logger.info("✅ Body content loaded")
                                except:
                                    self.logger.warning("⚠️ Even body content not loading")
                    except Exception as e:
                        # Check if this is a dict corruption error
                        if "'dict' object has no attribute" in str(e):
                            self.logger.error("❌ Page corruption detected during content check, skipping job")
                            return None
                        else:
                            self.logger.warning(f"⚠️ Error checking page content: {e}")
                        
                except Exception as e:
                    # Check if this is a dict corruption error
                    if "'dict' object has no attribute" in str(e):
                        self.logger.error("❌ Page corruption detected during Apploi content wait, skipping job")
                        return None
                    else:
                        self.logger.warning(f"⚠️ Error waiting for Apploi content: {e}")
                        # If that fails, just continue without waiting
                        pass
            
            # Check timeout before data extraction
            if (datetime.now() - start_time).total_seconds() > timeout_seconds:
                self.logger.warning(f"⚠️ Timeout reached before data extraction")
                return None
            
            # Extract job details using Python-based approach
            job_details = {
                'title': '',
                'company': '',
                'location': '',
                'salary': '',
                'job_type': '',
                'description': '',
                'requirements': '',
                'qualifications': '',
                'date_posted': '',
                'application_info': '',
                'job_url': job_url
            }
            
            # For Apploi sites, try to extract from JSON-LD first, then Open Graph meta tags
            if 'apploi.com' in job_url:
                self.logger.info("🎯 Detected Apploi site, using JSON-LD extraction")
                try:
                    # Validate page object before extraction
                    if isinstance(page, dict):
                        self.logger.error("❌ Page object is corrupted (dict) during JSON-LD extraction")
                        return None
                    
                    job_details = self._extract_apploi_job_data(page, job_details)
                    self.logger.info("✅ Apploi job data extraction completed")
                except Exception as e:
                    self.logger.error(f"❌ Error in Apploi job data extraction: {e}")
                    # Continue with fallback
            else:
                self.logger.info("🌐 Non-Apploi site, using Open Graph fallback")
                # For non-Apploi sites, try Open Graph meta tags as fallback
                try:
                    # Validate page object before extraction
                    if isinstance(page, dict):
                        self.logger.error("❌ Page object is corrupted (dict) during Open Graph extraction")
                        return None
                    
                    og_data = self._extract_open_graph_data(page)
                    if og_data:
                        job_details = self._parse_open_graph_data(og_data, job_details)
                except Exception as e:
                    self.logger.error(f"❌ Error in Open Graph extraction: {e}")
            
            # Check final timeout
            if (datetime.now() - start_time).total_seconds() > timeout_seconds:
                self.logger.warning(f"⚠️ Timeout reached during data extraction")
                return None
            
            # Add metadata (only if not already set by JSON-LD)
            job_details['source_url'] = site_config['search_url']
            job_details['scraped_at'] = datetime.now().isoformat()
            
            # Only use site_config as fallback if JSON-LD didn't provide the data
            if not job_details.get('company'):
                job_details['company'] = site_config['source_site']
            if not job_details.get('state'):
                job_details['state'] = site_config.get('state', 'CT')
            if not job_details.get('city'):
                job_details['city'] = site_config.get('city', '')
            if not job_details.get('zip_code'):
                job_details['zip_code'] = site_config.get('zip_code', '')
            
            return job_details
            
        except Exception as e:
            # Check if this is our special corruption exception
            if str(e) == "PAGE_CORRUPTION_DETECTED":
                self.logger.error(f"❌ Page corruption detected in _extract_job_details for {job_url}")
                # Re-raise the corruption exception to be caught by the retry loop
                raise e
            else:
                self.logger.warning(f"❌ Error extracting job details from {job_url}: {e}")
                return None
        finally:
            # Force garbage collection to prevent memory leaks
            import gc
            gc.collect()
    
    def _extract_apploi_job_data(self, page: Page, job_details: Dict) -> Dict:
        """Extract job data from Apploi sites using JSON-LD only."""
        try:
            self.logger.info("🔍 Extracting job data from Apploi site using JSON-LD...")
            
            # IMMEDIATE CORRUPTION CHECK - catch it before any processing
            if isinstance(page, dict):
                self.logger.error("❌ Page is corrupted (dict) in _extract_apploi_job_data, skipping job")
                return job_details
            
            # Check for page corruption first
            if isinstance(page, dict):
                self.logger.error("❌ Page is corrupted (dict) in _extract_apploi_job_data, skipping job")
                return job_details
            
            # Validate that page is actually a Playwright Page object
            if not hasattr(page, 'query_selector'):
                self.logger.error(f"❌ page is not a Playwright Page object in _extract_apploi_job_data: {type(page)}")
                return job_details
            
            # Try to extract JSON-LD data
            json_ld_data = self._extract_json_ld_data(page)
            
            if json_ld_data:
                self.logger.info("✅ Found JSON-LD data, parsing it...")
                job_details = self._parse_json_ld_job_data(json_ld_data, job_details)
                self.logger.info("✅ JSON-LD extraction and parsing complete")
                return job_details
            else:
                self.logger.warning("⚠️ No JSON-LD data found")
                # Fallback to Open Graph meta tags for title and description
                self.logger.info("🔄 Falling back to Open Graph data...")
                og_data = self._extract_open_graph_data(page)
                if og_data:
                    job_details = self._parse_open_graph_data(og_data, job_details)
                    self.logger.info("✅ Open Graph extraction complete")
                    return job_details
            
            self.logger.warning("⚠️ No structured data found")
            return job_details
            
        except Exception as e:
            # Check if this is our special corruption exception
            if str(e) == "PAGE_CORRUPTION_DETECTED":
                self.logger.error("❌ Page corruption detected in _extract_apploi_job_data")
                # Re-raise the corruption exception
                raise e
            # Check if this is a dict corruption error
            elif "'dict' object has no attribute" in str(e):
                self.logger.error("❌ Page corruption detected in _extract_apploi_job_data, skipping job")
                return job_details
            else:
                self.logger.warning(f"⚠️ Error extracting Apploi job data: {e}")
                return job_details
    
    def _extract_json_ld_data(self, page: Page) -> Optional[Dict]:
        """Extract JSON-LD data from the page."""
        try:
            self.logger.info("🔍 Attempting to extract JSON-LD data...")
            
            # IMMEDIATE CORRUPTION CHECK - catch it before any processing
            if isinstance(page, dict):
                self.logger.error("❌ Page is corrupted (dict) in _extract_json_ld_data, skipping job")
                return None
            
            # Check for page corruption first
            if isinstance(page, dict):
                self.logger.error("❌ Page is corrupted (dict) in _extract_json_ld_data, skipping job")
                return None
            
            # Wait a bit for dynamic content to load
            time.sleep(2)
            
            # Try multiple approaches to extract JSON data
            approaches = [
                self._try_json_ld_scripts,
                self._try_global_variables,
                self._try_script_content,
                self._try_dom_data_attributes
            ]
            
            for i, approach in enumerate(approaches):
                try:
                    self.logger.info(f"🔍 Trying approach {i+1}: {approach.__name__}")
                    result = approach(page)
                    if result:
                        self.logger.info(f"✅ Found JSON data using {approach.__name__}")
                        return result
                except Exception as e:
                    # Check if this is a dict corruption error
                    if "'dict' object has no attribute" in str(e):
                        self.logger.error(f"❌ Page corruption detected in approach {i+1}, stopping extraction")
                        return None
                    else:
                        self.logger.debug(f"⚠️ Approach {i+1} failed: {e}")
                        continue
            
            self.logger.warning("❌ No JSON-LD data found with any approach")
            return None
            
        except Exception as e:
            # Check if this is our special corruption exception
            if str(e) == "PAGE_CORRUPTION_DETECTED":
                self.logger.error("❌ Page corruption detected in _extract_json_ld_data")
                # Re-raise the corruption exception
                raise e
            # Check if this is a dict corruption error
            elif "'dict' object has no attribute" in str(e):
                self.logger.error("❌ Page corruption detected in _extract_json_ld_data, skipping job")
                return None
            else:
                self.logger.warning(f"⚠️ Error extracting JSON-LD data: {e}")
                return None
    
    def _try_json_ld_scripts(self, page: Page) -> Optional[Dict]:
        """Try to extract JSON-LD from script tags."""
        try:
            # IMMEDIATE CORRUPTION CHECK - catch it before any processing
            if isinstance(page, dict):
                self.logger.error("❌ Page is corrupted (dict) in _try_json_ld_scripts, skipping job")
                return None
            
            # Check for page corruption first
            if isinstance(page, dict):
                self.logger.error("❌ Page is corrupted (dict) in _try_json_ld_scripts, skipping job")
                return None
            
            # Validate that page is actually a Playwright Page object
            if not hasattr(page, 'query_selector_all'):
                self.logger.error(f"❌ page is not a Playwright Page object in _try_json_ld_scripts: {type(page)}")
                return None
            
            # Try Apploi-specific JSON-LD script first
            json_ld_scripts = page.query_selector_all('script[type="application/ld+json"][data-rh="true"]')
            
            if not json_ld_scripts:
                # Fallback to any JSON-LD script tags
                json_ld_scripts = page.query_selector_all('script[type="application/ld+json"]')
            
            self.logger.info(f"🔍 Found {len(json_ld_scripts)} JSON-LD script tags")
            
            for i, script in enumerate(json_ld_scripts):
                try:
                    # Validate that script is a valid Playwright element
                    if not hasattr(script, 'inner_text') or not hasattr(script, 'get_attribute'):
                        self.logger.debug(f"⚠️ Script {i+1} is not a valid Playwright element: {type(script)}")
                        continue
                    
                    # Check if script is still attached to the DOM
                    try:
                        script_content = script.inner_text().strip()
                    except Exception as e:
                        self.logger.debug(f"⚠️ Script {i+1} is no longer attached to DOM: {e}")
                        continue
                        
                    self.logger.debug(f"📄 JSON-LD script {i+1} content: '{script_content}'")
                    
                    if script_content and script_content != '{}' and len(script_content) > 10:
                        self.logger.debug(f"📄 Processing JSON-LD script {i+1}: {script_content[:200]}...")
                        data = json.loads(script_content)
                        
                        # Accept any JSON data (capture all key-value pairs)
                        if isinstance(data, dict):
                            self.logger.info(f"✅ Found JSON-LD data with keys: {list(data.keys())}")
                            return data
                        elif isinstance(data, list):
                            # Handle array of data - return the first item
                            for item in data:
                                if isinstance(item, dict):
                                    self.logger.info(f"✅ Found JSON-LD data in array with keys: {list(item.keys())}")
                                    return item
                        else:
                            self.logger.debug(f"⚠️ JSON-LD script {i+1} doesn't contain valid JSON data")
                
                except json.JSONDecodeError as e:
                    self.logger.debug(f"⚠️ JSON decode error in script {i+1}: {e}")
                    continue
                except Exception as e:
                    # Check if this is a dict corruption error
                    if "'dict' object has no attribute" in str(e):
                        self.logger.error(f"❌ Page corruption detected in script {i+1}, stopping extraction")
                        return None
                    else:
                        self.logger.debug(f"⚠️ Error parsing JSON-LD script {i+1}: {e}")
                        continue
            
            return None
            
        except Exception as e:
            # Check if this is our special corruption exception
            if str(e) == "PAGE_CORRUPTION_DETECTED":
                self.logger.error("❌ Page corruption detected in _try_json_ld_scripts")
                # Re-raise the corruption exception
                raise e
            # Check if this is a dict corruption error
            elif "'dict' object has no attribute" in str(e):
                self.logger.error("❌ Page corruption detected in _try_json_ld_scripts, skipping job")
                return None
            else:
                self.logger.debug(f"⚠️ Error in _try_json_ld_scripts: {e}")
                return None
    
    def _try_global_variables(self, page: Page) -> Optional[Dict]:
        """Try to extract job data from global JavaScript variables."""
        try:
            # Validate that page is actually a Playwright Page object
            if not hasattr(page, 'evaluate'):
                self.logger.error(f"❌ page is not a Playwright Page object in _try_global_variables: {type(page)}")
                return None
            
            # Try to execute JavaScript to extract job data from global variables
            json_data = page.evaluate("""
                // Try to find job data in global variables
                const possibleVars = [
                    'window.__INITIAL_STATE__',
                    'window.jobData',
                    'window.appData',
                    'window.pageData',
                    'window.__NEXT_DATA__',
                    'window.__APOLLO_STATE__'
                ];
                
                for (const varName of possibleVars) {
                    try {
                        const data = eval(varName);
                        if (data && typeof data === 'object') {
                            return JSON.stringify(data);
                        }
                    } catch (e) {
                        // Variable doesn't exist or is not accessible
                        continue;
                    }
                }
                
                return null;
            """)
            
            if json_data:
                self.logger.info("✅ Found job data in global variables")
                data = json.loads(json_data)
                if isinstance(data, dict):
                    return data
                elif isinstance(data, list) and len(data) > 0:
                    return data[0] if isinstance(data[0], dict) else None
            
            return None
            
        except Exception as e:
            self.logger.debug(f"⚠️ Error in _try_global_variables: {e}")
            return None
    
    def _try_script_content(self, page: Page) -> Optional[Dict]:
        """Try to extract job data from script content."""
        try:
            # Validate that page is actually a Playwright Page object
            if not hasattr(page, 'query_selector_all'):
                self.logger.error(f"❌ page is not a Playwright Page object in _try_script_content: {type(page)}")
                return None
            
            # Look for script tags that might contain job data
            scripts = page.query_selector_all('script:not([type="application/ld+json"])')
            
            for script in scripts:
                try:
                    # Validate that script is a valid Playwright element
                    if not hasattr(script, 'inner_text'):
                        continue
                    
                    content = script.inner_text()
                    if not content:
                        continue
                    
                    # Look for JSON-like patterns in script content
                    if 'jobData' in content or 'jobLocation' in content or 'hiringOrganization' in content:
                        # Try to extract JSON from the script
                        import re
                        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
                        matches = re.findall(json_pattern, content)
                        
                        for match in matches:
                            try:
                                data = json.loads(match)
                                if isinstance(data, dict) and (data.get('title') or data.get('description')):
                                    self.logger.info("✅ Found job data in script content")
                                    return data
                            except json.JSONDecodeError:
                                continue
                
                except Exception as e:
                    self.logger.debug(f"⚠️ Error processing script: {e}")
                    continue
            
            return None
            
        except Exception as e:
            self.logger.debug(f"⚠️ Error in _try_script_content: {e}")
            return None
    
    def _try_dom_data_attributes(self, page: Page) -> Optional[Dict]:
        """Try to extract job data from DOM data attributes."""
        try:
            # Validate that page is actually a Playwright Page object
            if not hasattr(page, 'query_selector_all'):
                self.logger.error(f"❌ page is not a Playwright Page object in _try_dom_data_attributes: {type(page)}")
                return None
            
            # Look for elements with data attributes that might contain job data
            elements = page.query_selector_all('[data-job], [data-job-data], [data-json]')
            
            for element in elements:
                try:
                    # Validate that element is a valid Playwright element
                    if not hasattr(element, 'get_attribute'):
                        continue
                    
                    # Try different data attributes
                    for attr in ['data-job', 'data-job-data', 'data-json']:
                        data_attr = element.get_attribute(attr)
                        if data_attr:
                            try:
                                data = json.loads(data_attr)
                                if isinstance(data, dict) and (data.get('title') or data.get('description')):
                                    self.logger.info("✅ Found job data in DOM data attributes")
                                    return data
                            except json.JSONDecodeError:
                                continue
                
                except Exception as e:
                    self.logger.debug(f"⚠️ Error processing element: {e}")
                    continue
            
            return None
            
        except Exception as e:
            self.logger.debug(f"⚠️ Error in _try_dom_data_attributes: {e}")
            return None
    
    def _extract_open_graph_data(self, page: Page) -> Optional[Dict]:
        """Extract Open Graph meta tags from the page."""
        try:
            # Validate that page is actually a Playwright Page object
            if not hasattr(page, 'query_selector_all'):
                self.logger.error(f"❌ page is not a Playwright Page object in _extract_open_graph_data: {type(page)}")
                return None
            
            og_data = {}
            
            # Common Open Graph meta tags for job data
            og_selectors = [
                'meta[property="og:title"]',
                'meta[property="og:description"]',
                'meta[property="og:url"]',
                'meta[property="og:site_name"]',
                'meta[name="description"]',
                'meta[property="og:type"]'
            ]
            
            for selector in og_selectors:
                try:
                    elements = page.query_selector_all(selector)
                    for element in elements:
                        # Validate that element is a valid Playwright element
                        if not hasattr(element, 'get_attribute'):
                            continue
                        
                        property_name = element.get_attribute('property') or element.get_attribute('name')
                        content = element.get_attribute('content')
                        
                        if property_name and content:
                            # Convert property name to a simple key
                            key = property_name.replace('og:', '').replace(':', '_')
                            og_data[key] = content.strip()
                
                except Exception as e:
                    self.logger.debug(f"⚠️ Error extracting {selector}: {e}")
                    continue
            
            if og_data:
                self.logger.info(f"✅ Found Open Graph data: {list(og_data.keys())}")
                return og_data
            
            return None
            
        except Exception as e:
            self.logger.debug(f"⚠️ Error extracting Open Graph data: {e}")
            return None
    
    def _parse_json_ld_job_data(self, json_ld_data: Dict, job_details: Dict) -> Dict:
        """Parse JSON-LD data into job_details format - capture ALL key-value pairs."""
        try:
            self.logger.info(f"🔍 Parsing JSON-LD data with keys: {list(json_ld_data.keys())}")
            
            # Capture ALL key-value pairs from JSON-LD data
            for key, value in json_ld_data.items():
                if value is not None and value != '':
                    # Convert key to snake_case for consistency
                    snake_key = key.replace('@', '').lower()
                    job_details[snake_key] = value
                    self.logger.info(f"📝 Extracted {key}: {str(value)[:100]}...")
            
            # Special handling for nested objects
            if json_ld_data.get('hiringOrganization') and isinstance(json_ld_data['hiringOrganization'], dict):
                org = json_ld_data['hiringOrganization']
                for key, value in org.items():
                    if value is not None and value != '':
                        org_key = f"organization_{key.replace('@', '').lower()}"
                        job_details[org_key] = value
                        self.logger.info(f"🏢 Extracted organization {key}: {str(value)[:100]}...")
            
            if json_ld_data.get('jobLocation') and isinstance(json_ld_data['jobLocation'], dict):
                location = json_ld_data['jobLocation']
                for key, value in location.items():
                    if value is not None and value != '':
                        loc_key = f"location_{key.replace('@', '').lower()}"
                        job_details[loc_key] = value
                        self.logger.info(f"📍 Extracted location {key}: {str(value)[:100]}...")
                        
                # Handle nested address object
                if location.get('address') and isinstance(location['address'], dict):
                    address = location['address']
                    for key, value in address.items():
                        if value is not None and value != '':
                            addr_key = f"address_{key.replace('@', '').lower()}"
                            job_details[addr_key] = value
                            self.logger.info(f"🏠 Extracted address {key}: {str(value)[:100]}...")
            
            if json_ld_data.get('educationRequirements') and isinstance(json_ld_data['educationRequirements'], dict):
                edu_req = json_ld_data['educationRequirements']
                for key, value in edu_req.items():
                    if value is not None and value != '':
                        edu_key = f"education_{key.replace('@', '').lower()}"
                        job_details[edu_key] = value
                        self.logger.info(f"🎓 Extracted education {key}: {str(value)[:100]}...")
            
            # Log successful extraction with key details
            title = job_details.get('title', 'Unknown')
            company = job_details.get('company', 'Unknown')
            location = job_details.get('location', 'Unknown')
            self.logger.info(f"✅ Successfully parsed JSON-LD data for: {title} at {company} in {location}")
            
        except Exception as e:
            self.logger.warning(f"⚠️ Error parsing JSON-LD data: {e}")
        
        return job_details
    
    def _parse_open_graph_data(self, og_data: Dict, job_details: Dict) -> Dict:
        """Parse Open Graph data into job_details format."""
        try:
            # Extract title
            if og_data.get('og:title'):
                job_details['title'] = og_data['og:title']
            elif og_data.get('twitter:title'):
                job_details['title'] = og_data['twitter:title']
            
            # Extract description
            if og_data.get('og:description'):
                job_details['description'] = og_data['og:description']
            elif og_data.get('twitter:description'):
                job_details['description'] = og_data['twitter:description']
            
            # Extract company/site name
            if og_data.get('og:site_name'):
                job_details['company'] = og_data['og:site_name']
            
            # Extract image
            if og_data.get('og:image'):
                job_details['company_logo'] = og_data['og:image']
            elif og_data.get('twitter:image'):
                job_details['company_logo'] = og_data['twitter:image']
            
            self.logger.info(f"✅ Successfully parsed Open Graph data for: {job_details.get('title', 'Unknown')}")
            
        except Exception as e:
            self.logger.warning(f"⚠️ Error parsing Open Graph data: {e}")
        
        return job_details
    
    def _extract_description_traditional(self, page: Page, job_details: Dict) -> Dict:
        """Extract job description using traditional DOM parsing methods."""
        try:
            # First, try to find the DangerousDiv element that contains the description
            dangerous_div = page.query_selector('[class*="DangerousDiv-sc-"]')
            if dangerous_div:
                description_text = dangerous_div.inner_text().strip()
                if description_text and len(description_text) > 50:
                    job_details['description'] = description_text
                    self.logger.info(f"✅ Found job description in DangerousDiv: {description_text[:100]}...")
                    return job_details
            # If no DangerousDiv found, try the data-testid approach
            desc_element = page.query_selector('[data-testid="job-description"]')
            if desc_element:
                # Look for DangerousDiv within the job description container
                dangerous_div_inner = desc_element.query_selector('[class*="DangerousDiv-sc-"]')
                if dangerous_div_inner:
                    description_text = dangerous_div_inner.inner_text().strip()
                    if description_text and len(description_text) > 50:
                        job_details['description'] = description_text
                        self.logger.info(f"✅ Found job description in nested DangerousDiv: {description_text[:100]}...")
                        return job_details
            # Fallback: Get all text content from the page
            all_text = page.inner_text('body')
            # Look for job description content
            if all_text:
                # Split into lines and look for description section
                lines = all_text.split('\n')
                description_lines = []
                in_description = False
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    # Check if we're entering a description section
                    if 'DESCRIPTION' in line.upper():
                        in_description = True
                        continue
                    # If we're in description section, collect lines
                    if in_description:
                        # Stop if we hit another section
                        if any(section in line.upper() for section in ['LOCATION', 'ABOUT', 'INDUSTRY', 'SOCIAL', 'COMPANY WEBSITE']):
                            break
                        # Skip unwanted lines
                        lower_line = line.lower()
                        if any(unwanted in lower_line for unwanted in [
                            'apply now', 'terms and conditions', 'cookies and privacy policy',
                            'continue', '©', 'update browser', 'security vulnerability'
                        ]):
                            continue
                        description_lines.append(line)
                # Join description lines
                if description_lines:
                    description = ' '.join(description_lines)
                    if len(description) > 50:
                        job_details['description'] = description
                        self.logger.info(f"✅ Found job description: {description[:100]}...")
            # If no description found in structured way, try to extract from all text
            if not job_details['description']:
                # Look for job-related content in the full text
                job_keywords = ['experience', 'requirements', 'responsibilities', 'qualifications', 'duties', 'skills', 'license', 'certification']
                # Split text into sentences and look for job-related content
                sentences = all_text.split('.')
                job_sentences = []
                for sentence in sentences:
                    sentence = sentence.strip()
                    if len(sentence) > 20:
                        lower_sentence = sentence.lower()
                        if any(keyword in lower_sentence for keyword in job_keywords):
                            job_sentences.append(sentence)
                if job_sentences:
                    job_details['description'] = '. '.join(job_sentences)
                    self.logger.info(f"✅ Found job description from sentences: {job_details['description'][:100]}...")
        except Exception as e:
            self.logger.warning(f"⚠️ Error extracting description: {e}")
        return job_details
    
    def _find_job_cards(self, page: Page, job_board_type: str = 'generic') -> List[Dict]:
        """Find job cards on the page and extract job_url/text immediately (no Playwright objects returned)."""
        try:
            self.logger.info(f"🔍 Finding job cards for {job_board_type} job board...")
            if not hasattr(page, 'query_selector_all'):
                self.logger.error(f"❌ page is not a Playwright Page object in _find_job_cards: {type(page)}")
                return []
            
            job_cards = []
            selectors = []
            if job_board_type == 'apploi':
                selectors = [
                    '[class*="job"]:not([class*="job-board"]):not([class*="job-search"])',
                    '[class*="card"]:not([class*="card-header"]):not([class*="card-body"]):not([class*="card-footer"])',
                    '[id*="job"]:not([id*="job-board"]):not([id*="job-search"])',
                    'article[class*="job"]',
                    'div[class*="position"]',
                    'div[class*="listing"]',
                    'div[class*="career"]'
                ]
            else:
                selectors = [
                    '[class*="job"]',
                    '[class*="position"]',
                    '[class*="listing"]',
                    '[class*="card"]',
                    'article',
                    '[data-testid*="job"]',
                    '[id*="job"]'
                ]
            
            for selector in selectors:
                try:
                    elements = page.query_selector_all(selector)
                    if elements:
                        self.logger.info(f"✅ Found {len(elements)} job cards with selector: {selector}")
                        for element in elements:
                            try:
                                text = element.inner_text().strip()
                                if not text or len(text) < 10:
                                    continue
                                if any(skip_text in text.lower() for skip_text in [
                                    'see all jobs', 'careers', 'join our team', 'skip to content',
                                    'home', 'about us', 'contact us', 'privacy policy', 'copyright'
                                ]):
                                    continue
                                # Extract job_url from first <a href> inside the card
                                job_url = ""
                                links = element.query_selector_all('a[href]')
                                for link in links:
                                    href = link.get_attribute('href')
                                    if href and ('/view/' in href or 'jobs.apploi.com' in href):
                                        job_url = href
                                        break
                                if not job_url and links:
                                    job_url = links[0].get_attribute('href')
                                if job_url and not job_url.startswith('http'):
                                    job_url = urljoin(page.url, job_url)
                                if not job_url:
                                    continue
                                # Optionally extract title (first line)
                                title = text.split('\n')[0].strip() if text else ''
                                job_cards.append({
                                    'job_url': job_url,
                                    'title': title,
                                    'text': text,
                                    'selector': selector
                                })
                            except Exception as e:
                                self.logger.debug(f"⚠️ Error processing element with {selector}: {e}")
                    
                    if job_cards:
                        break
                except Exception as e:
                    self.logger.debug(f"⚠️ Error with selector {selector}: {e}")
                    continue
            
            # Remove duplicates based on job_url
            unique_cards = []
            seen_urls = set()
            for card in job_cards:
                if card['job_url'] not in seen_urls:
                    seen_urls.add(card['job_url'])
                    unique_cards.append(card)
            
            self.logger.info(f"✅ Found {len(unique_cards)} unique job cards")
            return unique_cards
        except Exception as e:
            self.logger.error(f"❌ Error finding job cards: {e}")
            return []
    
    def _extract_card_info(self, card, page: Page) -> Optional[Dict]:
        """Extract basic information from a job card."""
        try:
            # Get the card element
            card_element = card
            
            # If card_element is a dict, skip Playwright calls
            if isinstance(card_element, dict):
                self.logger.warning("⚠️ card_element is a dict, not a Playwright element. Skipping Playwright calls.")
                return None
            
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
            self.logger.debug(f"Card info - Title: '{title}', URL: '{job_url}'")
            
            # Return if we have a URL
            if job_url:
                return {
                    'title': title,
                    'location': '',
                    'job_url': job_url,
                    'card_element': card_element
                }
            
        except Exception as e:
            self.logger.debug(f"⚠️ Error extracting card info: {e}")
        
        return None
    
    def _extract_simple_card_info(self, card, page: Page) -> Optional[Dict]:
        """Extract basic information from a job card using a simpler approach."""
        try:
            # Get the card element
            card_element = card
            
            # If card_element is a dict, skip Playwright calls
            if isinstance(card_element, dict):
                self.logger.warning("⚠️ card_element is a dict, not a Playwright element. Skipping Playwright calls.")
                return None
            
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
            self.logger.info(f"🌐 Accessing site: {site_config['search_url']}")
            self.page.goto(site_config['search_url'], wait_until='domcontentloaded')
            time.sleep(3)
            job_cards = self._find_job_cards(self.page, job_board_type)
            if not job_cards:
                self.logger.warning(f"⚠️ No job cards found on {site_name}")
                return []
            jobs_processed = 0
            for i, card_info in enumerate(job_cards[:max_jobs]):
                try:
                    # Global corruption check at the start of each job
                    if isinstance(self.page, dict):
                        self.logger.error(f"❌ Global page corruption detected before job {i+1}, skipping job immediately")
                        # Add to failed URLs to prevent future attempts
                        self.failed_urls.add(job_url)
                        self.logger.info(f"📝 Added {job_url} to failed URLs list")
                        continue
                    
                    job_url = card_info.get('job_url', '')
                    if not job_url:
                        self.logger.debug(f"⚠️ No job URL found for card {i+1}")
                        continue
                    
                    # Skip URLs that have previously failed - check this BEFORE any processing
                    if job_url in self.failed_urls:
                        self.logger.info(f"⏭️ Skipping previously failed URL: {job_url}")
                        continue
                    
                    # Skip all Ryders Health jobs past job number 35
                    if 'Ryders_Health_Management' in job_url and i >= 35:
                        self.logger.info(f"⏭️ Skipping Ryders Health job {i+1} (past limit 35): {job_url}")
                        continue
                    
                    # Also skip URLs that match problematic patterns (Ryders Health specific jobs)
                    if any(pattern in job_url for pattern in [
                        "jobs.apploi.com/view/1439065",
                        "jobs.apploi.com/view/877843",
                        "jobs.apploi.com/view/1371768"
                    ]):
                        self.logger.info(f"⏭️ Skipping known problematic Ryders Health job: {job_url}")
                        continue
                    
                    self.logger.info(f"📄 Processing job {i+1}/{min(len(job_cards), max_jobs)}: {job_url}")
                    
                    # EARLY CORRUPTION CHECK - before any processing
                    if isinstance(self.page, dict):
                        self.logger.error(f"❌ Page is corrupted (dict) before job processing, skipping job: {job_url}")
                        # Add to failed URLs to prevent future attempts
                        self.failed_urls.add(job_url)
                        self.logger.info(f"📝 Added {job_url} to failed URLs list")
                        continue
                    
                    # Additional validation - check if page has required methods
                    try:
                        if not hasattr(self.page, 'goto') or not hasattr(self.page, 'title'):
                            self.logger.error(f"❌ Page object is missing required methods, skipping job: {job_url}")
                            self.failed_urls.add(job_url)
                            continue
                    except Exception as e:
                        if "'dict' object has no attribute" in str(e):
                            self.logger.error(f"❌ Page corruption detected during validation: {e}")
                            self.failed_urls.add(job_url)
                            continue
                        else:
                            self.logger.warning(f"⚠️ Error validating page object: {e}")
                            continue
                    
                    # ULTRA-EARLY CORRUPTION CHECK - test page responsiveness before any operations
                    try:
                        test_url = self.page.url
                        test_title = self.page.title()
                    except Exception as e:
                        if "'dict' object has no attribute" in str(e):
                            self.logger.error(f"❌ Page corruption detected during responsiveness test, skipping job: {job_url}")
                            self.failed_urls.add(job_url)
                            self.logger.info(f"📝 Added {job_url} to failed URLs list")
                            continue
                        else:
                            self.logger.warning(f"⚠️ Page not responsive during test: {e}")
                            continue
                    
                    # Add retry mechanism for job extraction
                    max_retries = 2
                    job_details = None
                    job_start_time = datetime.now()
                    job_timeout = 30  # Reduced to 30 seconds per job to prevent hanging
                    
                    # Track if this job was corrupted to prevent retries
                    job_corrupted = False
                    
                    try:
                        for retry in range(max_retries):
                            # If job was corrupted in previous attempt, don't retry
                            if job_corrupted:
                                self.logger.info("⏭️ Skipping retry for corrupted job")
                                break
                            
                            # Additional check at the start of each retry
                            if isinstance(self.page, dict):
                                self.logger.error("❌ Page corruption detected at start of retry, skipping job immediately")
                                self.failed_urls.add(job_url)
                                self.logger.info(f"📝 Added {job_url} to failed URLs list")
                                job_corrupted = True
                                break
                                
                            try:
                                # Check if we've exceeded the job timeout
                                if (datetime.now() - job_start_time).total_seconds() > job_timeout:
                                    self.logger.warning(f"⚠️ Job timeout reached after {job_timeout}s, skipping job")
                                    break
                                
                                # Validate that self.page is still a valid Playwright object
                                if not self._ensure_valid_page():
                                    self.logger.error("❌ self.page is not available after retry")
                                    break
                                
                                # Additional validation before extraction - recreate page if corrupted
                                if isinstance(self.page, dict):
                                    self.logger.error("❌ self.page is corrupted (dict), recreating page")
                                    if hasattr(self, 'context') and self.context:
                                        try:
                                            self.page = self.context.new_page()
                                            self.logger.info("✅ Successfully recreated page")
                                            # Navigate back to the job URL
                                            self.page.goto(job_url, wait_until='domcontentloaded', timeout=10000)  # Reduced timeout
                                            time.sleep(2)  # Reduced wait time
                                        except Exception as recreate_error:
                                            self.logger.error(f"❌ Error recreating page: {recreate_error}")
                                            break
                                    else:
                                        self.logger.error("❌ No context available to recreate page")
                                        break
                                
                                # Additional safety check - if page is still corrupted, skip this job
                                if isinstance(self.page, dict):
                                    self.logger.error("❌ Page is still corrupted after recreation, skipping job")
                                    break
                                
                                # Try to extract job details, but catch corruption errors at this level
                                try:
                                    # ULTRA-EARLY CORRUPTION CHECK before calling _extract_job_details
                                    if isinstance(self.page, dict):
                                        self.logger.error("❌ Page corruption detected before job extraction, skipping job immediately")
                                        self.failed_urls.add(job_url)
                                        self.logger.info(f"📝 Added {job_url} to failed URLs list")
                                        job_corrupted = True
                                        break
                                    
                                    job_details = self._extract_job_details(self.page, job_url, site_config)
                                    if job_details:
                                        break  # Success, exit retry loop
                                    else:
                                        self.logger.warning(f"⚠️ Job extraction returned None, retry {retry + 1}/{max_retries}")
                                except Exception as extract_error:
                                    # Check if this is our special corruption exception
                                    if str(extract_error) == "PAGE_CORRUPTION_DETECTED":
                                        self.logger.error("❌ Page corruption detected during extraction, skipping job immediately")
                                        # Add to failed URLs to prevent future attempts
                                        self.failed_urls.add(job_url)
                                        self.logger.info(f"📝 Added {job_url} to failed URLs list")
                                        
                                        # Mark job as corrupted to prevent retries
                                        job_corrupted = True
                                        
                                        # Increment corruption counter
                                        self.corruption_count += 1
                                        
                                        # If corruption happens multiple times, recreate browser context
                                        if self.corruption_count >= 3:
                                            self.logger.warning("⚠️ Multiple corruption events detected, recreating browser context")
                                            if self._recreate_browser_context():
                                                self.corruption_count = 0  # Reset counter
                                            else:
                                                self.logger.error("❌ Failed to recreate browser context, stopping scraper")
                                                return site_jobs
                                        
                                        # CRITICAL: Break out of retry loop immediately - don't retry corrupted jobs
                                        break
                                    # Check if this is a corruption error
                                    elif "'dict' object has no attribute" in str(extract_error):
                                        self.logger.error("❌ Page object corruption detected during extraction, skipping job immediately")
                                        # Add to failed URLs to prevent future attempts
                                        self.failed_urls.add(job_url)
                                        self.logger.info(f"📝 Added {job_url} to failed URLs list")
                                        
                                        # Mark job as corrupted to prevent retries
                                        job_corrupted = True
                                        
                                        # Increment corruption counter
                                        self.corruption_count += 1
                                        
                                        # If corruption happens multiple times, recreate browser context
                                        if self.corruption_count >= 3:
                                            self.logger.warning("⚠️ Multiple corruption events detected, recreating browser context")
                                            if self._recreate_browser_context():
                                                self.corruption_count = 0  # Reset counter
                                            else:
                                                self.logger.error("❌ Failed to recreate browser context, stopping scraper")
                                                return site_jobs
                                        
                                        # CRITICAL: Break out of retry loop immediately - don't retry corrupted jobs
                                        break
                                    else:
                                        # Re-raise non-corruption errors
                                        raise extract_error
                                
                                except Exception as e:
                                    # Check if this is a corruption error first
                                    if "'dict' object has no attribute" in str(e):
                                        self.logger.error("❌ Page object corruption detected during retry, skipping job immediately")
                                        # Add to failed URLs to prevent future attempts
                                        self.failed_urls.add(job_url)
                                        self.logger.info(f"📝 Added {job_url} to failed URLs list")
                                        
                                        # Mark job as corrupted to prevent retries
                                        job_corrupted = True
                                        
                                        # Increment corruption counter
                                        self.corruption_count += 1
                                        
                                        # If corruption happens multiple times, recreate browser context
                                        if self.corruption_count >= 3:
                                            self.logger.warning("⚠️ Multiple corruption events detected, recreating browser context")
                                            if self._recreate_browser_context():
                                                self.corruption_count = 0  # Reset counter
                                            else:
                                                self.logger.error("❌ Failed to recreate browser context, stopping scraper")
                                                return site_jobs
                                        
                                        # Break out of retry loop immediately - don't retry corrupted jobs
                                        break
                                    else:
                                        self.logger.error(f"❌ Error extracting job details (retry {retry + 1}/{max_retries}): {e}")
                                        # Only retry for non-corruption errors
                                        if retry < max_retries - 1:
                                            time.sleep(1)  # Reduced wait time
                                            # Try to recreate page if it's corrupted
                                            try:
                                                if hasattr(self, 'context') and self.context:
                                                    self.page = self.context.new_page()
                                                    self.logger.info("✅ Recreated page for retry")
                                            except Exception as recreate_error:
                                                self.logger.error(f"❌ Error recreating page: {recreate_error}")
                                        continue
                    except Exception as e:
                        # Check if this is a corruption error first
                        if "'dict' object has no attribute" in str(e):
                            self.logger.error("❌ Page object corruption detected during retry, skipping job immediately")
                            # Add to failed URLs to prevent future attempts
                            self.failed_urls.add(job_url)
                            self.logger.info(f"📝 Added {job_url} to failed URLs list")
                            
                            # Mark job as corrupted to prevent retries
                            job_corrupted = True
                            
                            # Increment corruption counter
                            self.corruption_count += 1
                            
                            # If corruption happens multiple times, recreate browser context
                            if self.corruption_count >= 3:
                                self.logger.warning("⚠️ Multiple corruption events detected, recreating browser context")
                                if self._recreate_browser_context():
                                    self.corruption_count = 0  # Reset counter
                                else:
                                    self.logger.error("❌ Failed to recreate browser context, stopping scraper")
                                    return site_jobs
                            
                            # Break out of retry loop immediately - don't retry corrupted jobs
                            break
                        else:
                            self.logger.error(f"❌ Error extracting job details (retry {retry + 1}/{max_retries}): {e}")
                            # Only retry for non-corruption errors
                            if retry < max_retries - 1:
                                time.sleep(1)  # Reduced wait time
                                # Try to recreate page if it's corrupted
                                try:
                                    if hasattr(self, 'context') and self.context:
                                        self.page = self.context.new_page()
                                        self.logger.info("✅ Recreated page for retry")
                                except Exception as recreate_error:
                                    self.logger.error(f"❌ Error recreating page: {recreate_error}")
                                continue
                    
                    job_duration = (datetime.now() - job_start_time).total_seconds()
                    if job_duration > job_timeout:
                        self.logger.warning(f"⚠️ Job processing timed out after {job_duration:.1f}s")
                        continue
                    
                    # If job was corrupted, skip all further processing
                    if job_corrupted:
                        self.logger.info(f"⏭️ Skipping further processing for corrupted job: {job_url}")
                        continue
                    
                    if job_details:
                        card_text = card_info.get('text', '')
                        if not job_details.get('title') and card_text:
                            lines = card_text.split('\n')
                            if len(lines) > 1:
                                job_details['title'] = lines[-1].strip()
                        if not job_details.get('location') and card_text:
                            if '|' in card_text:
                                parts = card_text.split('|')
                                if len(parts) >= 2:
                                    location_part = parts[1].strip()
                                    job_details['location'] = location_part
                        site_jobs.append(job_details)
                        jobs_processed += 1
                        self.logger.info(f"✅ Successfully extracted job: {job_details.get('title', 'Unknown')}")
                    else:
                        self.logger.warning(f"⚠️ Failed to extract job details from {job_url}")
                        # Add to failed URLs to skip in future runs
                        self.failed_urls.add(job_url)
                        self.logger.info(f"📝 Added {job_url} to failed URLs list")
                    
                    time.sleep(1)
                    if (i + 1) % 5 == 0:
                        self._cleanup_memory()
                    
                except Exception as e:
                    # Check for the specific dict corruption error
                    if "'dict' object has no attribute" in str(e):
                        job_url = card_info.get('job_url', '')
                        if not self._handle_dict_corruption(str(e), job_url):
                            self.logger.error("❌ Failed to handle corruption, stopping scraper")
                            return site_jobs
                        continue
                    else:
                        self.logger.error(f"❌ Error processing job {i+1}: {e}")
                        continue
            end_time = datetime.now()
            duration = (end_time - site_start_time).total_seconds()
            self.logger.info(f"✅ Completed {site_name}: {jobs_processed} jobs in {duration:.1f}s")
            return site_jobs
        except Exception as e:
            self.logger.error(f"❌ Error scraping {site_name}: {e}")
            return []
        finally:
            self._cleanup_memory()
    
    def scrape_all_sites(self, max_sites: int = None, max_jobs_per_site: int = 20) -> List[Dict]:
        """Scrape jobs from all Apploi-based Connecticut healthcare sites with progress tracking and resume capability."""
        if not self._setup_browser():
            self.logger.error("❌ Failed to setup browser")
            return []
        
        # Add global exception handler for dict corruption
        import sys
        original_excepthook = sys.excepthook
        
        def global_exception_handler(exc_type, exc_value, exc_traceback):
            if "'dict' object has no attribute" in str(exc_value):
                self.logger.error(f"❌ Global dict corruption detected: {exc_value}")
                # Don't print the traceback for this specific error to avoid spam
                return
            else:
                # Call the original exception handler for other errors
                original_excepthook(exc_type, exc_value, exc_traceback)
        
        sys.excepthook = global_exception_handler
        
        self.is_running = True
        self.start_time = time.time()
        
        # Filter for Apploi sites only
        apploi_sites = [site for site in self.ct_sites if site.get('job board type', '').strip().lower() == 'apploi']
        if max_sites:
            apploi_sites = apploi_sites[:max_sites]
        
        self.logger.info(f"🚀 Starting to scrape {len(apploi_sites)} Apploi sites...")
        if self.current_site_index > 0:
            self.logger.info(f"📂 Resuming from site {self.current_site_index + 1}/{len(apploi_sites)}: {self.current_site_name}")
        
        # Start from the current site index (resume point)
        for i in range(self.current_site_index, len(apploi_sites)):
            if not self.is_running:
                self.logger.info("🛑 Scraping stopped by user or timeout")
                break
            
            site_config = apploi_sites[i]
            site_name = site_config.get('source_site', f'site_{i+1}')
            self.current_site_name = site_name
            self.current_site_index = i
            self.current_job_index = 0
            
            # Make a safe filename prefix
            safe_site_name = ''.join(c if c.isalnum() else '_' for c in site_name)[:40]
            self.logger.info(f"📋 Processing site {i+1}/{len(apploi_sites)}: {site_name}")
            
            # Check timeout before starting site
            if self._check_timeout("site"):
                self.logger.warning(f"⚠️ Site timeout reached, saving progress and stopping")
                self._save_progress()
                break
            
            try:
                # Create a new context for each site to isolate them
                try:
                    if hasattr(self, 'context') and self.context:
                        self.context.close()
                    self.context = self.browser.new_context(
                        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        extra_http_headers={
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.5',
                            'Accept-Encoding': 'gzip, deflate',
                            'DNT': '1',
                            'Connection': 'keep-alive',
                            'Upgrade-Insecure-Requests': '1',
                        },
                        viewport={'width': 1920, 'height': 1080}
                    )
                    self.context.add_init_script("""
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => undefined,
                        });
                    """)
                    self.page = self.context.new_page()
                except Exception as e:
                    self.logger.error(f"❌ Failed to create new context for {site_name}: {e}")
                    self.failed_sites += 1
                    continue
                
                # Scrape jobs from this site with progress tracking
                site_jobs = self._scrape_site_jobs_with_progress(site_config, max_jobs_per_site)
                
                if site_jobs:
                    self.scraped_jobs.extend(site_jobs)
                    self.successful_sites += 1
                    self.total_jobs_scraped += len(site_jobs)
                    self.logger.info(f"✅ Successfully scraped {len(site_jobs)} jobs from {site_name}")
                    # Save jobs for this site to its own file
                    self.save_jobs(site_jobs, filename_prefix=f"apploi_jobs_{safe_site_name}")
                else:
                    self.failed_sites += 1
                    self.logger.warning(f"⚠️ No jobs found on {site_name}")
                
                # Save progress after each site
                self._save_progress()
                
                # Clean up context
                try:
                    if self.context:
                        self.context.close()
                except Exception as e:
                    self.logger.debug(f"⚠️ Error closing context: {e}")
                    time.sleep(2)
                    
            except Exception as e:
                self.failed_sites += 1
                self.logger.error(f"❌ Error processing {site_name}: {e}")
                # Save progress on error
                self._save_progress()
        
        self.is_running = False
        self._cleanup_memory()
        self.logger.info(f"🎉 Scraping completed!")
        self.logger.info(f"📊 Total jobs scraped: {len(self.scraped_jobs)}")
        self.logger.info(f"✅ Successful sites: {self.successful_sites}")
        self.logger.info(f"❌ Failed sites: {self.failed_sites}")
        
        # Restore original exception handler
        sys.excepthook = original_excepthook
        
        return self.scraped_jobs
    
    def _scrape_site_jobs_with_progress(self, site_config: Dict, max_jobs: int = 50) -> List[Dict]:
        """Scrape jobs from a single site with progress tracking and timeout detection."""
        site_jobs = []
        site_name = site_config['source_site']
        job_board_type = site_config.get('job_board_type', 'generic')
        self.logger.info(f"🏥 Processing site: {site_name}")
        self.logger.info(f"🔗 URL: {site_config['search_url']}")
        self.logger.info(f"📋 Job board type: {job_board_type}")
        
        site_start_time = time.time()
        
        try:
            self.logger.info(f"🌐 Accessing site: {site_config['search_url']}")
            self.page.goto(site_config['search_url'], wait_until='domcontentloaded')
            time.sleep(3)
            
            # Update activity
            self._update_activity()
            
            job_cards = self._find_job_cards(self.page, job_board_type)
            if not job_cards:
                self.logger.warning(f"⚠️ No job cards found on {site_name}")
                return []
            
            jobs_processed = 0
            
            # Resume from current job index if resuming
            start_job_index = self.current_job_index
            if start_job_index > 0:
                self.logger.info(f"📂 Resuming from job {start_job_index + 1}/{len(job_cards)}")
            
            for i in range(start_job_index, min(len(job_cards), max_jobs)):
                if not self.is_running:
                    self.logger.info("🛑 Scraping stopped by user")
                    break
                
                # Check timeout for this job
                if self._check_timeout("job"):
                    self.logger.warning(f"⚠️ Job timeout reached, saving progress and stopping")
                    self._save_progress()
                    break
                
                self.current_job_index = i
                self._update_activity()
                
                try:
                    # Global corruption check at the start of each job
                    if isinstance(self.page, dict):
                        self.logger.error(f"❌ Global page corruption detected before job {i+1}, skipping job immediately")
                        # Add to failed URLs to prevent future attempts
                        job_url = card_info.get('job_url', '')
                        if job_url:
                            self.failed_urls.add(job_url)
                            self.logger.info(f"📝 Added {job_url} to failed URLs list")
                        continue
                    
                    card_info = job_cards[i]
                    job_url = card_info.get('job_url', '')
                    if not job_url:
                        self.logger.debug(f"⚠️ No job URL found for card {i+1}")
                        continue
                    
                    # Skip URLs that have previously failed
                    if job_url in self.failed_urls:
                        self.logger.info(f"⏭️ Skipping previously failed URL: {job_url}")
                        continue
                    
                    # Skip all Ryders Health jobs past job number 35
                    if 'Ryders_Health_Management' in job_url and i >= 35:
                        self.logger.info(f"⏭️ Skipping Ryders Health job {i+1} (past limit 35): {job_url}")
                        continue
                    
                    # Also skip URLs that match problematic patterns
                    if any(pattern in job_url for pattern in [
                        "jobs.apploi.com/view/1439065",
                        "jobs.apploi.com/view/877843",
                        "jobs.apploi.com/view/1371768"
                    ]):
                        self.logger.info(f"⏭️ Skipping known problematic Ryders Health job: {job_url}")
                        continue
                    
                    self.logger.info(f"📄 Processing job {i+1}/{min(len(job_cards), max_jobs)}: {job_url}")
                    
                    # EARLY CORRUPTION CHECK - before any processing
                    if isinstance(self.page, dict):
                        self.logger.error(f"❌ Page is corrupted (dict) before job processing, skipping job: {job_url}")
                        self.failed_urls.add(job_url)
                        self.logger.info(f"📝 Added {job_url} to failed URLs list")
                        continue
                    
                    # Additional validation - check if page has required methods
                    try:
                        if not hasattr(self.page, 'goto') or not hasattr(self.page, 'title'):
                            self.logger.error(f"❌ Page object is missing required methods, skipping job: {job_url}")
                            self.failed_urls.add(job_url)
                            continue
                    except Exception as e:
                        if "'dict' object has no attribute" in str(e):
                            self.logger.error(f"❌ Page corruption detected during validation: {e}")
                            self.failed_urls.add(job_url)
                            continue
                        else:
                            self.logger.warning(f"⚠️ Error validating page object: {e}")
                            continue
                    
                    # ULTRA-EARLY CORRUPTION CHECK - test page responsiveness before any operations
                    try:
                        test_url = self.page.url
                        test_title = self.page.title()
                    except Exception as e:
                        if "'dict' object has no attribute" in str(e):
                            self.logger.error(f"❌ Page corruption detected during responsiveness test, skipping job: {job_url}")
                            self.failed_urls.add(job_url)
                            self.logger.info(f"📝 Added {job_url} to failed URLs list")
                            continue
                        else:
                            self.logger.warning(f"⚠️ Page not responsive during test: {e}")
                            continue
                    
                    # Add retry mechanism for job extraction
                    max_retries = 2
                    job_details = None
                    job_start_time = datetime.now()
                    job_timeout = 30  # Reduced to 30 seconds per job to prevent hanging
                    
                    # Track if this job was corrupted to prevent retries
                    job_corrupted = False
                    
                    for retry in range(max_retries):
                        # If job was corrupted in previous attempt, don't retry
                        if job_corrupted:
                            self.logger.info("⏭️ Skipping retry for corrupted job")
                            break
                        
                        # Additional check at the start of each retry
                        if isinstance(self.page, dict):
                            self.logger.error("❌ Page corruption detected at start of retry, skipping job immediately")
                            self.failed_urls.add(job_url)
                            self.logger.info(f"📝 Added {job_url} to failed URLs list")
                            job_corrupted = True
                            break
                            
                        try:
                            # Check if we've exceeded the job timeout
                            if (datetime.now() - job_start_time).total_seconds() > job_timeout:
                                self.logger.warning(f"⚠️ Job timeout reached after {job_timeout}s, skipping job")
                                break
                            
                            # Validate that self.page is still a valid Playwright object
                            if not self._ensure_valid_page():
                                self.logger.error("❌ self.page is not available after retry")
                                break
                            
                            # Additional validation before extraction - recreate page if corrupted
                            if isinstance(self.page, dict):
                                self.logger.error("❌ self.page is corrupted (dict), recreating page")
                                if hasattr(self, 'context') and self.context:
                                    try:
                                        self.page = self.context.new_page()
                                        self.logger.info("✅ Successfully recreated page")
                                        # Navigate back to the job URL
                                        self.page.goto(job_url, wait_until='domcontentloaded', timeout=10000)  # Reduced timeout
                                        time.sleep(2)  # Reduced wait time
                                    except Exception as recreate_error:
                                        self.logger.error(f"❌ Error recreating page: {recreate_error}")
                                        break
                                else:
                                    self.logger.error("❌ No context available to recreate page")
                                    break
                            
                            # Additional safety check - if page is still corrupted, skip this job
                            if isinstance(self.page, dict):
                                self.logger.error("❌ Page is still corrupted after recreation, skipping job")
                                break
                            
                            # Try to extract job details, but catch corruption errors at this level
                            try:
                                # ULTRA-EARLY CORRUPTION CHECK before calling _extract_job_details
                                if isinstance(self.page, dict):
                                    self.logger.error("❌ Page corruption detected before job extraction, skipping job immediately")
                                    self.failed_urls.add(job_url)
                                    self.logger.info(f"📝 Added {job_url} to failed URLs list")
                                    job_corrupted = True
                                    break
                                
                                job_details = self._extract_job_details(self.page, job_url, site_config)
                                if job_details:
                                    break  # Success, exit retry loop
                                else:
                                    self.logger.warning(f"⚠️ Job extraction returned None, retry {retry + 1}/{max_retries}")
                            except Exception as extract_error:
                                # Check if this is our special corruption exception
                                if str(extract_error) == "PAGE_CORRUPTION_DETECTED":
                                    self.logger.error("❌ Page corruption detected during extraction, skipping job immediately")
                                    # Add to failed URLs to prevent future attempts
                                    self.failed_urls.add(job_url)
                                    self.logger.info(f"📝 Added {job_url} to failed URLs list")
                                    
                                    # Mark job as corrupted to prevent retries
                                    job_corrupted = True
                                    
                                    # Increment corruption counter
                                    self.corruption_count += 1
                                    
                                    # If corruption happens multiple times, recreate browser context
                                    if self.corruption_count >= 3:
                                        self.logger.warning("⚠️ Multiple corruption events detected, recreating browser context")
                                        if self._recreate_browser_context():
                                            self.corruption_count = 0  # Reset counter
                                        else:
                                            self.logger.error("❌ Failed to recreate browser context, stopping scraper")
                                            return site_jobs
                                    
                                    # CRITICAL: Break out of retry loop immediately - don't retry corrupted jobs
                                    break
                                # Check if this is a corruption error
                                elif "'dict' object has no attribute" in str(extract_error):
                                    self.logger.error("❌ Page object corruption detected during extraction, skipping job immediately")
                                    # Add to failed URLs to prevent future attempts
                                    self.failed_urls.add(job_url)
                                    self.logger.info(f"📝 Added {job_url} to failed URLs list")
                                    
                                    # Mark job as corrupted to prevent retries
                                    job_corrupted = True
                                    
                                    # Increment corruption counter
                                    self.corruption_count += 1
                                    
                                    # If corruption happens multiple times, recreate browser context
                                    if self.corruption_count >= 3:
                                        self.logger.warning("⚠️ Multiple corruption events detected, recreating browser context")
                                        if self._recreate_browser_context():
                                            self.corruption_count = 0  # Reset counter
                                        else:
                                            self.logger.error("❌ Failed to recreate browser context, stopping scraper")
                                            return site_jobs
                                    
                                    # CRITICAL: Break out of retry loop immediately - don't retry corrupted jobs
                                    break
                                else:
                                    # Re-raise non-corruption errors
                                    raise extract_error
                                
                            except Exception as e:
                                # Check if this is a corruption error first
                                if "'dict' object has no attribute" in str(e):
                                    self.logger.error("❌ Page object corruption detected during retry, skipping job immediately")
                                    # Add to failed URLs to prevent future attempts
                                    self.failed_urls.add(job_url)
                                    self.logger.info(f"📝 Added {job_url} to failed URLs list")
                                    
                                    # Mark job as corrupted to prevent retries
                                    job_corrupted = True
                                    
                                    # Increment corruption counter
                                    self.corruption_count += 1
                                    
                                    # If corruption happens multiple times, recreate browser context
                                    if self.corruption_count >= 3:
                                        self.logger.warning("⚠️ Multiple corruption events detected, recreating browser context")
                                        if self._recreate_browser_context():
                                            self.corruption_count = 0  # Reset counter
                                        else:
                                            self.logger.error("❌ Failed to recreate browser context, stopping scraper")
                                            return site_jobs
                                    
                                    # Break out of retry loop immediately - don't retry corrupted jobs
                                    break
                                else:
                                    self.logger.error(f"❌ Error extracting job details (retry {retry + 1}/{max_retries}): {e}")
                                    # Only retry for non-corruption errors
                                    if retry < max_retries - 1:
                                        time.sleep(1)  # Reduced wait time
                                        # Try to recreate page if it's corrupted
                                        try:
                                            if hasattr(self, 'context') and self.context:
                                                self.page = self.context.new_page()
                                                self.logger.info("✅ Recreated page for retry")
                                        except Exception as recreate_error:
                                            self.logger.error(f"❌ Error recreating page: {recreate_error}")
                                        continue
                    
                    job_duration = (datetime.now() - job_start_time).total_seconds()
                    if job_duration > job_timeout:
                        self.logger.warning(f"⚠️ Job processing timed out after {job_duration:.1f}s")
                        continue
                    
                    # If job was corrupted, skip all further processing
                    if job_corrupted:
                        self.logger.info(f"⏭️ Skipping further processing for corrupted job: {job_url}")
                        continue
                    
                    if job_details:
                        card_text = card_info.get('text', '')
                        if not job_details.get('title') and card_text:
                            lines = card_text.split('\n')
                            if len(lines) > 1:
                                job_details['title'] = lines[-1].strip()
                        if not job_details.get('location') and card_text:
                            if '|' in card_text:
                                parts = card_text.split('|')
                                if len(parts) >= 2:
                                    location_part = parts[1].strip()
                                    job_details['location'] = location_part
                        site_jobs.append(job_details)
                        jobs_processed += 1
                        self.logger.info(f"✅ Successfully extracted job: {job_details.get('title', 'Unknown')}")
                    else:
                        self.logger.warning(f"⚠️ Failed to extract job details from {job_url}")
                        # Add to failed URLs to skip in future runs
                        self.failed_urls.add(job_url)
                        self.logger.info(f"📝 Added {job_url} to failed URLs list")
                    
                    time.sleep(1)
                    if (i + 1) % 5 == 0:
                        self._cleanup_memory()
                        # Save progress periodically
                        self._save_progress()
                    
                except Exception as e:
                    # Check for the specific dict corruption error
                    if "'dict' object has no attribute" in str(e):
                        job_url = card_info.get('job_url', '')
                        if not self._handle_dict_corruption(str(e), job_url):
                            self.logger.error("❌ Failed to handle corruption, stopping scraper")
                            return site_jobs
                        continue
                    else:
                        self.logger.error(f"❌ Error processing job {i+1}: {e}")
                        continue
            
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            self.logger.info(f"✅ Completed {site_name}: {jobs_processed} jobs in {duration:.1f}s")
            return site_jobs
        except Exception as e:
            self.logger.error(f"❌ Error scraping {site_name}: {e}")
            return []
        finally:
            self._cleanup_memory()
            
    def _cleanup_memory(self):
        """Clean up memory to prevent heap growth issues."""
        try:
            import gc
            gc.collect()
            self.logger.debug("🧹 Memory cleanup completed")
        except Exception as e:
            self.logger.debug(f"⚠️ Error during memory cleanup: {e}")
    
    def _remove_duplicates(self, jobs: List[Dict]) -> List[Dict]:
        """Remove duplicate jobs based on URL."""
        seen_urls = set()
        unique_jobs = []
        
        for job in jobs:
            job_url = job.get('job_url', '')
            if job_url and job_url not in seen_urls:
                seen_urls.add(job_url)
                unique_jobs.append(job)
        
        self.logger.info(f"🔄 Removed {len(jobs) - len(unique_jobs)} duplicate jobs")
        return unique_jobs
    
    def save_progress(self, jobs: List[Dict], site_name: str = "", filename_prefix: str = "improved_ct_jobs_progress"):
        """Save progress to JSON file."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{filename_prefix}_{timestamp}.json"
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(jobs, f, indent=2, ensure_ascii=False)
            
            self.logger.info(f"💾 Progress saved: {filename} ({len(jobs)} jobs)")
            
        except Exception as e:
            self.logger.error(f"❌ Error saving progress: {e}")
    
    def save_jobs(self, jobs: List[Dict], filename_prefix: str = "improved_ct_jobs"):
        """Save jobs to JSON and CSV files."""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Save to JSON
            json_filename = f"{filename_prefix}_{timestamp}.json"
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(jobs, f, indent=2, ensure_ascii=False)
            
            # Save to CSV
            csv_filename = f"{filename_prefix}_{timestamp}.csv"
            if jobs:
                # Collect all unique fieldnames from all jobs
                all_fieldnames = set()
                for job in jobs:
                    all_fieldnames.update(job.keys())
                
                # Convert to sorted list for consistent ordering
                fieldnames = sorted(list(all_fieldnames))
                
                with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(jobs)
            
            self.logger.info(f"💾 Jobs saved: {json_filename} and {csv_filename}")
            
        except Exception as e:
            self.logger.error(f"❌ Error saving jobs: {e}")
    
    def print_summary(self):
        """Print scraping summary."""
        print("\n" + "="*60)
        print("📊 SCRAPING SUMMARY")
        print("="*60)
        print(f"🏥 Total sites processed: {self.successful_sites + self.failed_sites}")
        print(f"✅ Successful sites: {self.successful_sites}")
        print(f"❌ Failed sites: {self.failed_sites}")
        print(f"📋 Total jobs scraped: {self.total_jobs_scraped}")
        print(f"📈 Success rate: {(self.successful_sites / (self.successful_sites + self.failed_sites) * 100):.1f}%" if (self.successful_sites + self.failed_sites) > 0 else "N/A")
        print(f"🔄 Page corruptions detected: {self.corruption_count}")
        print(f"📝 Failed URLs tracked: {len(self.failed_urls)}")
        print("="*60)

    def _recreate_browser_context(self) -> bool:
        """Recreate the entire browser context when corruption is detected."""
        try:
            self.logger.warning("🔄 Recreating entire browser context due to corruption...")
            
            # Close existing context and page
            try:
                if hasattr(self, 'page') and self.page:
                    self.page.close()
            except:
                pass
            
            try:
                if hasattr(self, 'context') and self.context:
                    self.context.close()
            except:
                pass
            
            # Create new context
            if hasattr(self, 'browser') and self.browser:
                self.context = self.browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    extra_http_headers={
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                    },
                    viewport={'width': 1920, 'height': 1080}
                )
                
                # Add script to hide webdriver
                self.context.add_init_script("""
                    Object.defineProperty(navigator, 'webdriver', {
                        get: () => undefined,
                    });
                """)
                
                # Create new page
                self.page = self.context.new_page()
                self.logger.info("✅ Successfully recreated browser context")
                return True
            else:
                self.logger.error("❌ No browser available to recreate context")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Error recreating browser context: {e}")
            return False

def main():
    """Main function to run the scraper with enhanced restart and timeout detection."""
    print("🚀 Starting Improved Connecticut Healthcare Job Scraper...")
    
    max_restarts = 5
    restart_count = 0
    total_start_time = time.time()
    max_total_runtime = 4 * 60 * 60  # 4 hours total runtime
    
    while restart_count < max_restarts:
        try:
            print(f"🔄 Attempt {restart_count + 1}/{max_restarts}")
            
            # Check if we've exceeded total runtime
            total_elapsed = time.time() - total_start_time
            if total_elapsed > max_total_runtime:
                print(f"⏰ Total runtime exceeded ({total_elapsed/3600:.1f}h > {max_total_runtime/3600:.1f}h), stopping")
                break
            
            # Create scraper instance with resume capability
            scraper = ImprovedCTJobScraper(headless=True, debug=True, resume_from_progress=True)
            
            # Check if we're resuming from a previous run
            if scraper.current_site_index > 0 or len(scraper.scraped_jobs) > 0:
                print(f"📂 Resuming from previous run: Site {scraper.current_site_index + 1}, {len(scraper.scraped_jobs)} jobs already scraped")
            
            # Scrape all sites
            jobs = scraper.scrape_all_sites(max_jobs_per_site=50)
            
            # Save results
            if jobs:
                scraper.save_jobs(jobs)
                print(f"💾 Saved {len(jobs)} total jobs")
            
            # Print summary
            scraper.print_summary()
            
            print("✅ Scraper completed successfully!")
            break
            
        except KeyboardInterrupt:
            print("\n🛑 Scraping interrupted by user")
            try:
                scraper._save_progress()
                scraper._cleanup()
            except:
                pass
            break
            
        except Exception as e:
            print(f"❌ Error in attempt {restart_count + 1}: {e}")
            
            # Save progress before restarting
            try:
                if 'scraper' in locals():
                    scraper._save_progress()
                    scraper._cleanup()
            except:
                pass
            
            restart_count += 1
            if restart_count < max_restarts:
                wait_time = min(60 * restart_count, 300)  # Progressive backoff: 1min, 2min, 3min, 5min, 5min
                print(f"🔄 Restarting scraper in {wait_time} seconds... (attempt {restart_count + 1}/{max_restarts})")
                time.sleep(wait_time)
                continue
            else:
                print("❌ Max restart attempts reached. Giving up.")
                break
    
    # Final cleanup
    try:
        if 'scraper' in locals():
            scraper._save_progress()
            scraper._cleanup()
    except:
        pass
    
    print("🏁 Scraper process finished")

if __name__ == "__main__":
    main() 