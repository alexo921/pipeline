import logging
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from typing import Optional, Dict, Any, List, Union
import time
import random
from datetime import datetime
from fake_useragent import UserAgent
import re
from urllib.parse import urljoin, urlparse
from dataclasses import dataclass, asdict
import hashlib
import json
import traceback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class JobData:
    """Data class for storing job information."""
    
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None
    scraped_date: Optional[str] = None
    posted_date: Optional[str] = None
    job_type: Optional[str] = None
    duties: Optional[List[str]] = None
    requirements: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    shift: Optional[str] = None
    experience_required: Optional[str] = None
    certifications_required: Optional[List[str]] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_period: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the job data to a dictionary."""
        return {k: v for k, v in asdict(self).items() if v is not None}

class SeleniumScraper:
    """Scraper class using Selenium for JavaScript-rendered content."""
    
    def __init__(self, headless: bool = True):
        """Initialize the scraper."""
        self.headless = headless
        self.driver = None
        self.wait = None
        self.seen_jobs = set()
        self.logger = logging.getLogger(__name__)
        
    def __enter__(self):
        """Context manager entry."""
        self.driver = self._setup_driver()
        self.wait = WebDriverWait(self.driver, 10)
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        if self.driver:
            self.logger.info("Successfully closed webdriver")
            self.driver.quit()

    def _setup_driver(self) -> webdriver.Chrome:
        """Set up Chrome WebDriver with appropriate options."""
        chrome_options = webdriver.ChromeOptions()
        if self.headless:
            chrome_options.add_argument('--headless=new')  # Using new headless mode
        
        # Add options to avoid detection
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_argument('--disable-infobars')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--start-maximized')
        
        # Add random user agent
        user_agents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
        ]
        chrome_options.add_argument(f'user-agent={random.choice(user_agents)}')
        
        # Add additional headers
        chrome_options.add_argument('--accept-language=en-US,en;q=0.9')
        chrome_options.add_argument('--accept=text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
        
        # Disable automation flags
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_experimental_option('excludeSwitches', ['enable-automation'])
        
        # Create and return the driver
        driver = webdriver.Chrome(options=chrome_options)
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': 'Object.defineProperty(navigator, "webdriver", { get: () => undefined });'
        })
        
        # Set page load timeout
        driver.set_page_load_timeout(30)
        
        return driver

    def _random_sleep(self, min_seconds: float = 1.0, max_seconds: float = 3.0):
        """Add random delay between actions to appear more human-like."""
        time.sleep(random.uniform(min_seconds, max_seconds))

    def _scroll_page(self):
        """Scroll the page to simulate human behavior and load dynamic content."""
        try:
            # Get scroll height
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            
            while True:
                # Scroll down to bottom
                self.driver.execute_script(f"window.scrollTo(0, {last_height/2});")
                time.sleep(random.uniform(0.5, 1.0))
                
                # Scroll more
                self.driver.execute_script(f"window.scrollTo({last_height/2}, {last_height});")
                time.sleep(random.uniform(0.5, 1.0))
                
                # Calculate new scroll height and compare with last scroll height
                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    break
                last_height = new_height
                
                # Random pause between scrolls
                time.sleep(random.uniform(0.3, 0.7))
            
            self.logger.info("Successfully scrolled through page")
            
        except Exception as e:
            self.logger.error(f"Error scrolling page: {str(e)}")

    def _parse_salary(self, salary_text: str) -> Optional[Dict[str, Any]]:
        """Parse salary information from text."""
        if not salary_text:
            return None
            
        try:
            # Common salary patterns
            patterns = [
                # $50,000/year or $50k/year
                r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+k)(?:/|\s+per\s+|\s+a\s+)?(\w+)',
                # $20-25/hour or $20-$25/hour
                r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+k)(?:\s*-\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+k))?(?:/|\s+per\s+|\s+a\s+)?(\w+)',
                # 50,000-75,000 per year
                r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+k)(?:\s*-\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+k))?(?:/|\s+per\s+|\s+a\s+)?(\w+)',
            ]
            
            def convert_to_float(val: str) -> float:
                """Convert salary string to float."""
                if not val:
                    return 0.0
                    
                # Remove commas and convert 'k' to thousands
                val = val.replace(',', '')
                if val.lower().endswith('k'):
                    val = float(val[:-1]) * 1000
                return float(val)
            
            for pattern in patterns:
                match = re.search(pattern, salary_text, re.IGNORECASE)
                if match:
                    groups = match.groups()
                    
                    # Handle different pattern matches
                    if len(groups) == 2:  # Single value with period
                        salary_min = convert_to_float(groups[0])
                        salary_max = salary_min
                        period = groups[1]
                    elif len(groups) == 3:  # Range with period
                        salary_min = convert_to_float(groups[0])
                        salary_max = convert_to_float(groups[1]) if groups[1] else salary_min
                        period = groups[2]
                    else:
                        continue
                    
                    # Normalize period
                    period = period.lower().strip()
                    if period in ['year', 'yearly', 'annual', 'annually']:
                        period = 'year'
                    elif period in ['hour', 'hourly', 'hr']:
                        period = 'hour'
                    elif period in ['month', 'monthly', 'mo']:
                        period = 'month'
                    elif period in ['week', 'weekly', 'wk']:
                        period = 'week'
                    elif period in ['day', 'daily']:
                        period = 'day'
                    else:
                        continue
                    
                    return {
                        'salary_min': salary_min,
                        'salary_max': salary_max,
                        'salary_period': period
                    }
            
            return None
            
        except Exception as e:
            logger.warning(f"Error parsing salary: {str(e)}")
            return None

    def _detect_site_type(self, url: str, html: str) -> str:
        """Detect the type of job board site."""
        domain = urlparse(url).netloc.lower()
        
        if 'mycnajobs' in domain:
            return 'mycnajobs'
        elif 'carelistings' in domain:
            return 'carelistings'
        elif 'icims' in domain:
            return 'icims'
        elif 'apploi' in domain or 'jobs.apploi' in domain:
            return 'apploi'
        elif 'genesiscareers' in domain:
            return 'genesis'
        elif any(x in domain for x in ['newhavennh', 'southportnh', 'torringtonnh', 'waterburynh', 'westhavennh']):
            return 'nursing_home'
        elif 'icarehn' in domain:
            return 'icare'
        elif 'athenahealthcare' in domain:
            return 'athena'
        else:
            return 'default'

    def _get_selectors(self, site_type: str) -> Dict[str, Any]:
        """Get the appropriate selectors based on site type."""
        selectors = {
            'mycnajobs': {
                'container': '.job-listing, .job-card, .search-result-item, .job-search-results .job-item, .search-results-list .job-result',
                'title': 'h2, h3, .job-title, .position-title, .job-name',
                'company': '.company-name, .employer-name, .company-info',
                'location': '.location, .job-location, .city-state',
                'description': '.job-description, .description, .job-details',
                'url': 'a[href*="/job/"], a[href*="/jobs/"], a[href*="careers"]',
                'posted_date': '.posted-date, .date-posted, .post-date',
                'pagination': {
                    'next_button': '.next-page, .pagination-next, button[aria-label="Next page"], .pagination .next',
                    'page_numbers': '.pagination .page-number, .pagination .page',
                    'last_page': '.pagination .page-number:last-child, .pagination .page:last-child'
                },
                'job_page': {
                    'title': 'h1.job-title, h1, .position-title',
                    'company': '.company-info h2, .employer-info, .company-name',
                    'location': '.job-location, .location, .city-state',
                    'description': '.job-description, .description, .job-details',
                    'requirements': '.job-requirements, .requirements, .qualifications',
                    'salary': '.salary-info, .compensation, .pay-rate',
                    'benefits': '.benefits-info, .perks, .benefits'
                }
            },
            'carelistings': {
                'container': '.job-listing, div.job-listing',
                'title': 'h3.job-title, .job-title',
                'company': '.company-name, div.company-name',
                'location': '.location, div.location',
                'description': '.description, div.description',
                'url': 'a.job-link, a[href*="jobs"]',
                'posted_date': '.posted-date, div.posted-date',
                'pagination': {
                    'next_button': 'a.next, a[rel="next"]',
                    'page_numbers': '.pagination a.page-number, .pagination .page',
                    'last_page': '.pagination a.page-number:last-child, .pagination .page:last-child'
                },
                'job_page': {
                    'title': 'h1.job-title, .job-title',
                    'company': '.employer-info h2, .company-name',
                    'location': '.job-location, .location',
                    'description': '.full-description, .description',
                    'requirements': '.requirements, .qualifications',
                    'salary': '.compensation, .salary',
                    'benefits': '.benefits, .perks'
                }
            },
            'icims': {
                'container': '.row.iCIMS_JobsTable, .iCIMS_JobsTable',
                'title': 'a.iCIMS_Anchor, .iCIMS_JobTitle',
                'location': 'span[itemprop="addressLocality"], .iCIMS_JobLocation',
                'description': 'div[itemprop="description"], .iCIMS_JobDescription',
                'url': 'a.iCIMS_Anchor, a[href*="jobs"]',
                'posted_date': '.posting-date, .iCIMS_PostedDate',
                'pagination': {
                    'next_button': '.iCIMS_NextPage, .next-page, a[rel="next"]',
                    'page_numbers': '.iCIMS_Paging .page-number, .pagination .page',
                    'last_page': '.iCIMS_Paging .page-number:last-child, .pagination .page:last-child'
                },
                'job_page': {
                    'title': 'h1.iCIMS_Header, .iCIMS_JobTitle',
                    'location': '.iCIMS_JobLocation, .location',
                    'description': '.iCIMS_JobDescription, .description',
                    'requirements': '.iCIMS_JobRequirements, .requirements',
                    'salary': '.iCIMS_JobSalary, .salary',
                    'benefits': '.iCIMS_JobBenefits, .benefits'
                }
            },
            'nursing_home': {
                'container': '.career-listing, .job-listing, article.job',
                'title': '.position-title, .job-title, h2, h3',
                'description': '.description, .job-description',
                'url': 'a.apply-link, a.position-link, a[href*="careers"], a[href*="jobs"]',
                'location': '.location, .job-location',
                'company': '.company-name, .employer-name',
                'posted_date': '.posted-date, .date-posted',
                'pagination': {
                    'next_button': '.next-page, .pagination-next, a[rel="next"]',
                    'page_numbers': '.pagination .page-number, .pagination .page',
                    'last_page': '.pagination .page-number:last-child, .pagination .page:last-child'
                },
                'job_page': {
                    'title': 'h1.job-title, h1, .position-title',
                    'company': '.company-info h2, .employer-info',
                    'location': '.job-location, .location',
                    'description': '.job-description, .description',
                    'requirements': '.requirements, .qualifications',
                    'salary': '.salary-info, .compensation',
                    'benefits': '.benefits-info, .perks'
                }
            },
            'default': {
                'container': '.job-listing, .job-card, .search-result-item, article.job',
                'title': 'h2, h3, .job-title, .position-title',
                'company': '.company-name, .employer-name, .company',
                'location': '.location, .job-location, .city-state',
                'description': '.job-description, .description',
                'url': 'a[href*="/job/"], a[href*="/jobs/"], a[href*="careers"]',
                'posted_date': '.posted-date, .date-posted',
                'pagination': {
                    'next_button': '.next-page, .pagination-next, button[aria-label="Next page"]',
                    'page_numbers': '.pagination .page-number',
                    'last_page': '.pagination .page-number:last-child'
                },
                'job_page': {
                    'title': 'h1.job-title, h1',
                    'company': '.company-info h2, .employer-info',
                    'location': '.job-location, .location',
                    'description': '.job-description, .description',
                    'requirements': '.job-requirements, .requirements',
                    'salary': '.salary-info, .compensation',
                    'benefits': '.benefits-info, .perks'
                }
            }
        }
        
        return selectors.get(site_type, selectors['default'])

    def _generate_job_hash(self, job_data: Dict[str, Any]) -> str:
        """Generate a unique hash for a job listing."""
        # Create a string combining key job attributes
        job_string = f"{job_data.get('title', '')}{job_data.get('company', '')}{job_data.get('location', '')}"
        # Add description snippet if available
        if job_data.get('description'):
            job_string += job_data['description'][:100]  # Use first 100 chars of description
        return hashlib.md5(job_string.encode()).hexdigest()

    def _is_duplicate(self, job_data: Dict[str, Any]) -> bool:
        """Check if a job is a duplicate."""
        job_hash = self._generate_job_hash(job_data)
        if job_hash in self.seen_jobs:
            return True
        self.seen_jobs.add(job_hash)
        return False

    def get_page_source(self, url: str, wait_for: Dict[str, str] = None) -> Optional[str]:
        """Get the page source after waiting for dynamic content to load."""
        try:
            self.logger.info(f"Fetching page: {url}")
            
            # Add random delay before request
            time.sleep(random.uniform(2, 4))
            
            # Load the page
            self.driver.get(url)
            
            # Handle site-specific interactions
            domain = urlparse(url).netloc.lower()
            
            # MyCNAJobs specific handling
            if 'mycnajobs' in domain:
                try:
                    # Wait for page load
                    self.wait.until(EC.presence_of_element_located((By.TAG_NAME, 'body')))
                    time.sleep(random.uniform(1, 2))
                    
                    # Log the page title and URL
                    self.logger.info(f"Page title: {self.driver.title}")
                    self.logger.info(f"Current URL: {self.driver.current_url}")
                    
                    # Wait for job listings container
                    try:
                        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '.job-search-results, .search-results')))
                        self.logger.info("Found job listings container")
                    except TimeoutException:
                        self.logger.warning("Timeout waiting for job listings container")
                    
                    # Try to find and click cookie consent
                    try:
                        cookie_buttons = self.driver.find_elements(By.CSS_SELECTOR, 
                            '.cookie-consent-button, #cookie-consent, .cc-button, button[data-testid="cookie-consent-button"], .cookie-banner button, #onetrust-accept-btn-handler')
                        if cookie_buttons:
                            for button in cookie_buttons:
                                if button.is_displayed() and button.is_enabled():
                                    button.click()
                                    self.logger.info("Clicked cookie consent button")
                                    time.sleep(random.uniform(1, 2))
                                    break
                    except Exception as e:
                        self.logger.info(f"Cookie consent handling: {str(e)}")
                    
                    # Try to close popups
                    try:
                        popup_buttons = self.driver.find_elements(By.CSS_SELECTOR, 
                            '.modal-close, .popup-close, .close-button, button[aria-label="Close"], .modal .close, .modal-dialog .close')
                        if popup_buttons:
                            for button in popup_buttons:
                                if button.is_displayed() and button.is_enabled():
                                    button.click()
                                    self.logger.info("Closed a popup")
                                    time.sleep(random.uniform(1, 2))
                    except Exception as e:
                        self.logger.info(f"Popup handling: {str(e)}")
                    
                    # Wait for job cards with expanded selectors
                    try:
                        job_selectors = [
                            '.job-card',
                            '.job-listing',
                            '.search-result-item',
                            '.job-search-results .job-item',
                            '.search-results-list .job-result',
                            '.job-listings-container .job',
                            '#search-results-list .job-posting'
                        ]
                        
                        # Try each selector
                        for selector in job_selectors:
                            try:
                                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                                if elements:
                                    self.logger.info(f"Found {len(elements)} job listings with selector: {selector}")
                                    break
                            except:
                                continue
                        
                        # If no elements found with any selector, log the page source for debugging
                        if not any(self.driver.find_elements(By.CSS_SELECTOR, selector) for selector in job_selectors):
                            self.logger.warning("No job listings found with any selector")
                            self.logger.debug(f"Page source: {self.driver.page_source[:1000]}...")  # Log first 1000 chars
                            
                    except Exception as e:
                        self.logger.error(f"Error checking job listings: {str(e)}")
                    
                except Exception as e:
                    self.logger.error(f"Error handling MyCNAJobs site: {str(e)}")
            
            # Add random mouse movements and scrolls
            try:
                # Initial scroll to activate any lazy loading
                self.driver.execute_script("window.scrollTo(0, 200)")
                time.sleep(random.uniform(0.5, 1.0))
                
                # Random mouse movements
                actions = webdriver.ActionChains(self.driver)
                for _ in range(3):
                    x = random.randint(100, 400)  # Reduced range to avoid out of bounds
                    y = random.randint(100, 200)  # Reduced range to avoid out of bounds
                    actions.move_by_offset(x, y).perform()
                    time.sleep(random.uniform(0.3, 0.7))
                    
                    # Small scroll after each movement
                    self.driver.execute_script(f"window.scrollTo(0, {random.randint(300, 500)})")
                    time.sleep(random.uniform(0.3, 0.7))
            except Exception as e:
                self.logger.warning(f"Error during mouse movements: {str(e)}")
            
            # Wait for specific element if provided
            if wait_for:
                try:
                    self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, wait_for['value'])))
                except TimeoutException:
                    self.logger.warning(f"Timeout waiting for element: {wait_for['value']}")
            
            # Final scroll through page
            self._scroll_page()
            
            # Add random delay after page load
            time.sleep(random.uniform(2, 4))
            
            return self.driver.page_source
            
        except Exception as e:
            self.logger.error(f"Error getting page source: {str(e)}")
            return None

    def _is_valid_job_title(self, title: str) -> bool:
        """Check if a string looks like a valid job title."""
        if not title:
            return False
        
        # Exclude obvious non-job titles
        exclude_patterns = [
            r'^why\s+',
            r'^we\'re\s+seeking\s+',
            r'^find\s+',
            r'^search\s+',
            r'^about\s+',
            r'^learn\s+',
            r'^join\s+',
            r'^become\s+',
            r'^apply\s+',
        ]
        
        for pattern in exclude_patterns:
            if re.search(pattern, title.lower()):
                return False
        
        # Check length (typical job titles are between 3 and 50 characters)
        if len(title) < 3 or len(title) > 50:
            return False
        
        # Must contain at least one letter
        if not re.search(r'[a-zA-Z]', title):
            return False
        
        return True

    def _is_valid_location(self, location: str) -> bool:
        """Check if a string looks like a valid location."""
        if not location:
            return False
        
        # Must contain letters
        if not re.search(r'[a-zA-Z]', location):
            return False
        
        # Exclude obvious non-locations
        exclude_patterns = [
            r'search',
            r'find',
            r'apply',
            r'click',
            r'learn',
            r'need',
            r'want',
            r'help',
            r'join',
            r'about',
            r'hr\b',  # Exclude HR when it's a word by itself
            r'if\b',  # Exclude "if" when it's a word by itself
            r'so\b',  # Exclude "so" when it's a word by itself
            r'the\b',  # Exclude "the" when it's a word by itself
            r'and\b',  # Exclude "and" when it's a word by itself
        ]
        
        for pattern in exclude_patterns:
            if re.search(pattern, location.lower()):
                return False
        
        return True

    def _find_job_location(self, container: BeautifulSoup) -> Optional[str]:
        """Find job location in the container."""
        # First try finding location in text that matches location patterns
        text = container.get_text()
        location_patterns = [
            r'(?:Location|Address|Area):\s*([^,\n]+(?:,\s*[A-Z]{2})?)',
            r'(?:in|at)\s+([^,\n]+(?:,\s*[A-Z]{2})?)',
            r'(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})',  # City, State
            r'(?:^|\s)([A-Z]{2}(?:\s*-\s*[A-Z]{2})*)'  # State codes
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, text)
            if match:
                location = match.group(1).strip()
                if self._is_valid_location(location):
                    logger.info(f"Found location from pattern: {location}")
                    return location
        
        # Try common location-related classes
        location_classes = [
            'location',
            'job-location',
            'position-location',
            'company-location',
            'address',
            'city-state',
            'region'
        ]
        
        for class_name in location_classes:
            elements = container.find_all(class_=lambda x: x and class_name in x.lower())
            for element in elements:
                location = element.get_text().strip()
                if self._is_valid_location(location):
                    logger.info(f"Found location from class: {location}")
                    return location
        
        # Default to "Multiple Locations" if no specific location found
        return "Multiple Locations"

    def _find_job_url(self, container: BeautifulSoup, base_url: str = 'https://www.homeinstead.com') -> Optional[str]:
        """Find job URL in the container."""
        # Try to find URL in anchor tags
        links = container.find_all('a')
        for link in links:
            href = link.get('href')
            if href:
                # Clean and validate URL
                url = self._clean_url(href, base_url)
                if url:
                    logger.info(f"Found URL: {url}")
                    return url
        
        # Try to find URL in other common attributes
        url_attributes = ['data-url', 'data-href', 'data-link']
        for attr in url_attributes:
            elements = container.find_all(attrs={attr: True})
            for element in elements:
                url = self._clean_url(element[attr], base_url)
                if url:
                    logger.info(f"Found URL from attribute {attr}: {url}")
                    return url
        
        # If no specific job URL found, return the careers page
        return base_url

    def _clean_url(self, url: str, base_url: str) -> Optional[str]:
        """Clean and validate a URL."""
        if not url:
            return None
            
        # Remove any whitespace
        url = url.strip()
        
        # Skip javascript: links and empty anchors
        if url.startswith(('javascript:', '#')) or url == '/':
            return None
        
        try:
            # Handle relative URLs
            if not url.startswith(('http://', 'https://')):
                url = urljoin(base_url, url)
            
            # Parse URL to validate it
            parsed = urlparse(url)
            if not all([parsed.scheme, parsed.netloc]):
                return None
            
            return url
            
        except Exception as e:
            logger.warning(f"Error cleaning URL {url}: {str(e)}")
            return None

    def extract_jobs(self, html: str, selectors: Dict[str, str]) -> List[Dict[str, Any]]:
        """Extract job listings from HTML using BeautifulSoup."""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            jobs = []
            
            # Get site-specific selectors
            site_type = self._detect_site_type(self.driver.current_url, html)
            site_selectors = self._get_selectors(site_type)
            
            # Find all job containers
            containers = soup.select(site_selectors['container'])
            self.logger.info(f"Found {len(containers)} job containers with selector: {site_selectors['container']}")
            
            for container in containers:
                try:
                    # Extract job details
                    title_elem = container.select_one(site_selectors['title'])
                    desc_elem = container.select_one(site_selectors['description'])
                    loc_elem = container.select_one(site_selectors['location'])
                    company_elem = container.select_one(site_selectors['company'])
                    url_elem = container.select_one(site_selectors['url'])
                    
                    # Create job dictionary
                    job = {
                        'title': title_elem.get_text(strip=True) if title_elem else None,
                        'description': desc_elem.get_text(strip=True) if desc_elem else None,
                        'location': loc_elem.get_text(strip=True) if loc_elem else None,
                        'company': company_elem.get_text(strip=True) if company_elem else None,
                        'url': urljoin(self.driver.current_url, url_elem['href']) if url_elem and url_elem.get('href') else None,
                        'source': site_type,
                        'scraped_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    }
                    
                    # Only add jobs with at least a title
                    if job['title']:
                        jobs.append(job)
                        self.logger.info(f"Successfully extracted job: {job['title']}")
                    
                except Exception as e:
                    self.logger.error(f"Error extracting job details: {str(e)}")
                    continue
            
            return jobs
            
        except Exception as e:
            self.logger.error(f"Error extracting jobs: {str(e)}")
            return []

    def _safe_extract(self, element) -> Optional[str]:
        """Safely extract text from a BeautifulSoup element."""
        try:
            return element.get_text().strip()
        except:
            return None

    def _extract_url(self, container, selector: str) -> Optional[str]:
        """Extract URL from a container using a selector."""
        try:
            element = container.select_one(selector)
            if element and element.name == 'a':
                return element.get('href')
        except:
            pass
        return None

    def close(self):
        """Close the browser."""
        if self.driver:
            self.driver.quit()
            self.driver = None
            self.wait = None

    def _extract_job_details(self, url: str, site_type: str) -> Dict[str, Any]:
        """Extract detailed job information from a job listing page."""
        try:
            # Navigate to job page
            self.logger.info(f"Extracting details from: {url}")
            self.driver.get(url)
            time.sleep(random.uniform(2, 4))
            
            # Get selectors for this site type
            selectors = self._get_selectors(site_type)['job_page']
            
            # Extract job details
            job_details = {}
            
            # Title
            try:
                job_details['title'] = self.driver.find_element(By.CSS_SELECTOR, selectors['title']).text.strip()
            except:
                self.logger.warning("Could not find job title")
            
            # Company
            try:
                job_details['company'] = self.driver.find_element(By.CSS_SELECTOR, selectors['company']).text.strip()
            except:
                self.logger.warning("Could not find company name")
            
            # Location
            try:
                job_details['location'] = self.driver.find_element(By.CSS_SELECTOR, selectors['location']).text.strip()
            except:
                self.logger.warning("Could not find location")
            
            # Description
            try:
                job_details['description'] = self.driver.find_element(By.CSS_SELECTOR, selectors['description']).text.strip()
            except:
                self.logger.warning("Could not find description")
            
            # Requirements
            try:
                job_details['requirements'] = self.driver.find_element(By.CSS_SELECTOR, selectors['requirements']).text.strip()
            except:
                self.logger.warning("Could not find requirements")
            
            # Salary
            try:
                job_details['salary'] = self.driver.find_element(By.CSS_SELECTOR, selectors['salary']).text.strip()
            except:
                self.logger.warning("Could not find salary")
            
            # Benefits
            try:
                job_details['benefits'] = self.driver.find_element(By.CSS_SELECTOR, selectors['benefits']).text.strip()
            except:
                self.logger.warning("Could not find benefits")
            
            # Add metadata
            job_details['source_url'] = url
            job_details['scraped_date'] = datetime.now().isoformat()
            
            return job_details
            
        except Exception as e:
            self.logger.error(f"Error extracting job details: {str(e)}")
            return None

    def _has_next_page(self, site_type: str) -> bool:
        """Check if there is a next page of results."""
        try:
            selectors = self._get_selectors(site_type)['pagination']
            next_button = self.driver.find_element(By.CSS_SELECTOR, selectors['next_button'])
            return next_button.is_enabled() and next_button.is_displayed()
        except:
            return False

    def _go_to_next_page(self, site_type: str) -> bool:
        """Attempt to go to the next page of results."""
        try:
            selectors = self._get_selectors(site_type)['pagination']
            next_button = self.driver.find_element(By.CSS_SELECTOR, selectors['next_button'])
            if next_button.is_enabled() and next_button.is_displayed():
                next_button.click()
                time.sleep(random.uniform(2, 4))
                return True
            return False
        except:
            return False

    def scrape_jobs(self, url: str, site_type: str = None) -> List[Dict[str, Any]]:
        """Scrape all jobs from a job board, including pagination."""
        all_jobs = []
        page = 1
        max_pages = 10  # Limit to prevent infinite loops
        
        try:
            # Get initial page
            self.logger.info(f"Starting scrape of {url}")
            html = self.get_page_source(url)
            if not html:
                return []
            
            # Detect site type if not provided
            if not site_type:
                site_type = self._detect_site_type(url, html)
            self.logger.info(f"Detected site type: {site_type}")
            
            while page <= max_pages:
                self.logger.info(f"Scraping page {page}")
                
                # Get job containers
                selectors = self._get_selectors(site_type)
                
                # Try multiple container selectors
                containers = []
                container_selectors = selectors['container'].split(',')
                for selector in container_selectors:
                    selector = selector.strip()
                    try:
                        found_containers = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if found_containers:
                            self.logger.info(f"Found {len(found_containers)} job containers with selector: {selector}")
                            containers.extend(found_containers)
                    except Exception as e:
                        self.logger.warning(f"Error finding containers with selector {selector}: {str(e)}")
                
                if not containers:
                    self.logger.warning("No job containers found on page")
                    break
                
                self.logger.info(f"Found {len(containers)} total job containers")
                
                # Process each job container
                for container in containers:
                    try:
                        # Extract job details from container
                        job_details = {}
                        
                        # Title
                        try:
                            title_selectors = selectors['title'].split(',')
                            for selector in title_selectors:
                                selector = selector.strip()
                                title_elem = container.find_element(By.CSS_SELECTOR, selector)
                                if title_elem:
                                    job_details['title'] = title_elem.text.strip()
                                    break
                        except Exception as e:
                            self.logger.warning(f"Could not find job title: {str(e)}")
                            continue  # Skip jobs without titles
                        
                        # Company
                        try:
                            company_selectors = selectors['company'].split(',')
                            for selector in company_selectors:
                                selector = selector.strip()
                                company_elem = container.find_element(By.CSS_SELECTOR, selector)
                                if company_elem:
                                    job_details['company'] = company_elem.text.strip()
                                    break
                        except Exception as e:
                            self.logger.warning(f"Could not find company name: {str(e)}")
                        
                        # Location
                        try:
                            location_selectors = selectors['location'].split(',')
                            for selector in location_selectors:
                                selector = selector.strip()
                                location_elem = container.find_element(By.CSS_SELECTOR, selector)
                                if location_elem:
                                    job_details['location'] = location_elem.text.strip()
                                    break
                        except Exception as e:
                            self.logger.warning(f"Could not find location: {str(e)}")
                        
                        # Description
                        try:
                            desc_selectors = selectors['description'].split(',')
                            for selector in desc_selectors:
                                selector = selector.strip()
                                desc_elem = container.find_element(By.CSS_SELECTOR, selector)
                                if desc_elem:
                                    job_details['description'] = desc_elem.text.strip()
                                    break
                        except Exception as e:
                            self.logger.warning(f"Could not find description: {str(e)}")
                        
                        # URL
                        try:
                            url_selectors = selectors['url'].split(',')
                            for selector in url_selectors:
                                selector = selector.strip()
                                url_elem = container.find_element(By.CSS_SELECTOR, selector)
                                if url_elem:
                                    job_details['url'] = url_elem.get_attribute('href')
                                    break
                        except Exception as e:
                            self.logger.warning(f"Could not find job URL: {str(e)}")
                        
                        # Add metadata
                        job_details['source'] = site_type
                        job_details['scraped_date'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                        
                        # Log the found job
                        self.logger.info(f"Found job: {job_details.get('title', 'Unknown')} at {job_details.get('company', 'Unknown')}")
                        
                        # Add to results if we have at least a title
                        if job_details.get('title'):
                            all_jobs.append(job_details)
                        
                        # Random delay between job scrapes
                        time.sleep(random.uniform(1, 2))
                        
                    except Exception as e:
                        self.logger.error(f"Error processing job container: {str(e)}")
                        continue
                
                # Check for next page
                if not self._has_next_page(site_type):
                    self.logger.info("No more pages to scrape")
                    break
                
                # Go to next page
                if not self._go_to_next_page(site_type):
                    self.logger.info("Failed to go to next page")
                    break
                
                page += 1
                time.sleep(random.uniform(2, 4))  # Delay between pages
            
            self.logger.info(f"Completed scraping {len(all_jobs)} jobs from {page} pages")
            return all_jobs
            
        except Exception as e:
            self.logger.error(f"Error during job scraping: {str(e)}")
            self.logger.error(traceback.format_exc())
            return [] 