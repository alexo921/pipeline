#!/usr/bin/env python3
"""
Comprehensive Healthcare Job Scraper
Scrapes job listings from multiple healthcare job sites with various structures.
Modeled after the BrightStar scraper with enhanced multi-site capabilities.

This scraper can handle:
- Multi-location feeds (parse location from job cards)
- Single-site employers (fixed location, static parsing)  
- ATS systems (Workday, iCIMS, ADP, etc.)
- State-level feeds (parse city/zip from each job)

Tag Categories implemented:
- Employment Type: Full-Time, Part-Time, Per Diem, Contract
- Shift Type: Day Shift, Evening Shift, Overnight, Weekend Shift, Flexible Hours
- Care Setting: Home Care, Skilled Nursing Facility, Assisted Living, Memory Care, Hospice, Group Home
- Facility Tags: Private Facility, Non-Profit, Multi-Site Network
- Other Flags: Bonus Available, Urgent Hire, Same-Day Interview
"""

import json
import time
import csv
import re
import logging
from datetime import datetime
from typing import List, Dict, Optional, Set, Tuple
import random

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
    from webdriver_manager.chrome import ChromeDriverManager
    from bs4 import BeautifulSoup
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False
    print("Warning: Selenium not installed. Please run: pip install selenium webdriver-manager beautifulsoup4")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class ComprehensiveHealthcareScraper:
    """Comprehensive scraper for healthcare job listings from multiple sources."""
    
    def __init__(self, headless: bool = True, debug: bool = False):
        """Initialize the scraper."""
        if not SELENIUM_AVAILABLE:
            raise ImportError("Selenium is required. Install with: pip install selenium webdriver-manager beautifulsoup4")
            
        self.headless = headless
        self.debug = debug
        self.driver: Optional[webdriver.Chrome] = None
        self.wait: Optional[WebDriverWait] = None
        self.jobs = []
        self.processed_urls: Set[str] = set()
        
        # Healthcare-related keywords for content filtering
        self.healthcare_keywords = {
            'patient', 'care', 'nurse', 'nursing', 'medical', 'health', 'healthcare',
            'caregiver', 'assistant', 'therapy', 'clinical', 'hospital', 'clinic',
            'treatment', 'medication', 'doctor', 'physician', 'cna', 'rn', 'lpn',
            'aide', 'home care', 'senior', 'elderly', 'disability', 'rehabilitation',
            'personal care', 'companionship', 'respite', 'dementia', 'alzheimer',
            'certified', 'licensed', 'experience', 'compassionate', 'reliable',
            'responsibilities', 'duties', 'qualifications', 'requirements',
            'benefits', 'schedule', 'shift', 'hourly', 'salary', 'compensation',
            'homemaker', 'companion', 'support', 'wellness', 'therapy', 'therapist'
        }
        
        # Tag mappings for standardization per user requirements
        self.tag_mappings = {
            'employment_type': {
                'full-time': 'Full-Time', 'full time': 'Full-Time', 'fulltime': 'Full-Time', 'ft': 'Full-Time',
                'part-time': 'Part-Time', 'part time': 'Part-Time', 'parttime': 'Part-Time', 'pt': 'Part-Time',
                'per diem': 'Per Diem', 'perdiem': 'Per Diem', 'prn': 'Per Diem',
                'contract': 'Contract', 'temporary': 'Contract', 'temp': 'Contract'
            },
            'shift_type': {
                'day': 'Day Shift', 'day shift': 'Day Shift', 'days': 'Day Shift', 'morning': 'Day Shift',
                'evening': 'Evening Shift', 'evening shift': 'Evening Shift', 'evenings': 'Evening Shift',
                'night': 'Overnight', 'night shift': 'Overnight', 'nights': 'Overnight', 'overnight': 'Overnight',
                'weekend': 'Weekend Shift', 'weekends': 'Weekend Shift',
                'flexible': 'Flexible Hours', 'flex': 'Flexible Hours', 'varies': 'Flexible Hours'
            },
            'care_setting': {
                'home care': 'Home Care', 'homecare': 'Home Care', 'in-home': 'Home Care',
                'skilled nursing': 'Skilled Nursing Facility', 'snf': 'Skilled Nursing Facility',
                'nursing facility': 'Skilled Nursing Facility', 'nursing home': 'Skilled Nursing Facility',
                'assisted living': 'Assisted Living', 'memory care': 'Memory Care',
                'dementia care': 'Memory Care', 'alzheimer': 'Memory Care',
                'hospice': 'Hospice', 'group home': 'Group Home', 'residential': 'Group Home'
            }
        }
        
        # Load site configurations from CSV
        self.site_configs = self._load_site_configs()
        
    def _load_site_configs(self) -> List[Dict]:
        """Load site configurations from the CSV file."""
        configs = []
        try:
            with open('Job Board Data Scrape.csv', 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Skip empty rows
                    if not any(row.values()):
                        continue
                        
                    if row.get('search_url') and row.get('source_site') and row.get('search_url').startswith('http'):
                        config = {
                            'source_site': row['source_site'],
                            'search_url': row['search_url'],
                            'role': row.get('role', 'ALL_MATCHING'),
                            'state': row.get('state', ''),
                            'city': row.get('city', ''),
                            'zip_code': row.get('zip_code', ''),
                            'location_scope': row.get('location_scope', 'multi'),
                            'location_source': row.get('location_source', 'card body'),
                            'parse_location': row.get('parse_location?', 'Yes').lower() == 'yes',
                            'notes': row.get('notes', ''),
                            'setting_type': row.get('setting_type', 'mixed')
                        }
                        configs.append(config)
        except FileNotFoundError:
            logger.error("Job Board Data Scrape.csv not found. Please ensure the file is in the current directory.")
        except Exception as e:
            logger.error(f"Error loading site configs: {e}")
            
        logger.info(f"Loaded {len(configs)} site configurations")
        return configs
        
    def _setup_driver(self):
        """Set up the Chrome WebDriver."""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.wait = WebDriverWait(self.driver, 15)
        
    def _log(self, message: str, level: str = "INFO"):
        """Log a message with timestamp."""
        if level == "DEBUG" and not self.debug:
            return
        getattr(logger, level.lower())(message)
        
    def _extract_location(self, text: str, config: Dict) -> Tuple[str, str]:
        """Extract city and state from location text ensuring we get city+state not just state."""
        if not text:
            if config.get('city') and config.get('state'):
                return config['city'], config['state']
            return '', ''
            
        # Clean up the location text
        location = re.sub(r'\s+', ' ', text.strip())
        
        # Enhanced patterns for city, state (prioritizing city+state combinations)
        patterns = [
            # Standard formats
            r'([^,]+),\s*([A-Z]{2})\b',  # City, ST
            r'([^,]+),\s*([A-Za-z\s]+)\s+([A-Z]{2})\b',  # City, State ST
            r'([^,]+)\s+([A-Z]{2})\s+\d{5}',  # City ST ZIP
            r'([^,]+),\s*([A-Za-z\s]+)$',  # City, State (full name)
            
            # Additional patterns for different formats
            r'([^,\n]+),?\s*([A-Z]{2})\s*\d{5}',  # City, ST ZIP or City ST ZIP
            r'([A-Za-z\s]+),\s*(Connecticut|CT)\b',  # City, Connecticut
            r'([A-Za-z\s]+)\s+(Connecticut|CT)\b',  # City Connecticut
            r'([A-Za-z\s]+),\s*([A-Z]{2})\s*$',  # City, ST at end of line
        ]
        
        for pattern in patterns:
            match = re.search(pattern, location, re.IGNORECASE)
            if match:
                groups = match.groups()
                if len(groups) == 2:
                    city, state = groups
                    # Normalize state to abbreviation
                    if state.lower() == 'connecticut':
                        state = 'CT'
                    return city.strip(), state.strip().upper()
                elif len(groups) == 3:
                    city, state_name, state_abbrev = groups
                    return city.strip(), state_abbrev.strip().upper()
        
        # If no pattern matches, try to find state abbreviation and extract city
        state_match = re.search(r'\b(CT|Connecticut)\b', location, re.IGNORECASE)
        if state_match:
            state = 'CT' if state_match.group(1).upper() in ['CT', 'CONNECTICUT'] else state_match.group(1).upper()
            city = location.replace(state_match.group(1), '').replace(',', '').strip()
            # Clean up city name
            city = re.sub(r'^\s*[-,]\s*|\s*[-,]\s*$', '', city)
            # Only return if we have a meaningful city name
            if city and len(city) > 2 and not city.lower() in ['ct', 'connecticut']:
                return city, state
            
        # Fall back to config if available
        if config.get('city') and config.get('state'):
            return config['city'], config['state']
            
        # Last resort: if we only have state, try to extract something useful
        if len(location.strip()) <= 3:  # Likely just a state abbreviation
            return '', location.strip().upper()
        else:
            # Try to extract meaningful location even if pattern doesn't match
            # Look for common Connecticut cities
            ct_cities = ['hartford', 'new haven', 'bridgeport', 'stamford', 'waterbury', 
                        'norwalk', 'danbury', 'new britain', 'west hartford', 'greenwich',
                        'hamden', 'meriden', 'bristol', 'manchester', 'west haven',
                        'milford', 'stratford', 'east hartford', 'middletown', 'enfield']
            
            location_lower = location.lower()
            for city in ct_cities:
                if city in location_lower:
                    return city.title(), 'CT'
                    
            return location, ''

    def _generate_comprehensive_location_data(self, element, config: Dict) -> Tuple[str, str, str]:
        """Generate comprehensive location data using multiple strategies."""
        
        # Strategy 1: Extract from job element using enhanced selectors
        location_text = ''
        if config.get('parse_location', True):
            # Enhanced location selectors
            location_selectors = [
                '.location', '.job-location', '.position-location', '.city', 
                '.state', '.address', '.geo', '.locality', '.region',
                '[data-location]', '[data-city]', '[data-state]',
                '.job-info .location', '.job-meta .location', '.meta .location',
                '.job-details .location', '.posting-location', '.work-location',
                '.job-location-text', '.location-text', '.office-location'
            ]
            
            for selector in location_selectors:
                try:
                    location_elem = element.find_element(By.CSS_SELECTOR, selector)
                    location_text = location_elem.text.strip()
                    if location_text and len(location_text) > 1:
                        break
                except:
                    continue
                    
            # Strategy 2: Extract from job text using patterns
            if not location_text:
                job_text = element.text
                location_patterns = [
                    r'(?:Location|City|Address):\s*([^,\n]+,?\s*[A-Z]{2})',
                    r'([A-Za-z\s]+,\s*(?:CT|Connecticut))',
                    r'([A-Za-z\s]+\s+(?:CT|Connecticut))',
                    r'(\b[A-Za-z\s]+,\s*[A-Z]{2}\b)',
                ]
                
                for pattern in location_patterns:
                    match = re.search(pattern, job_text, re.IGNORECASE)
                    if match:
                        location_text = match.group(1).strip()
                        break
        
        # Strategy 3: Extract city and state
        city, state = self._extract_location(location_text, config)
        
        # Strategy 4: Use config defaults if we didn't get location from job element
        if not city and not state:
            city = config.get('city', '')
            state = config.get('state', 'CT')  # Default to CT since we're focusing on Connecticut
        elif not city and state:
            # If we have state but no city, try to use config city
            city = config.get('city', '')
        elif city and not state:
            # If we have city but no state, default to CT
            state = 'CT'
        
        # Strategy 5: For multi-location sites, try to extract more specific location
        if config.get('location_scope') == 'multi' and not city:
            # For multi-location sites without specific city, we might need to look deeper
            # This could be enhanced with more specific parsing based on site structure
            pass
        
        # Strategy 6: Format final location string
        if city and state:
            final_location = f"{city}, {state}"
        elif city and not state:
            final_location = f"{city}, CT"
            state = 'CT'
        elif state and not city:
            if config.get('city'):
                final_location = f"{config['city']}, {state}"
                city = config['city']
            else:
                final_location = state
        else:
            # Last resort: use config or default
            if config.get('city') and config.get('state'):
                final_location = f"{config['city']}, {config['state']}"
                city, state = config['city'], config['state']
            else:
                final_location = "Connecticut"
                state = 'CT'
        
        return city, state, final_location

    def _generate_tags(self, title: str, description: str, location: str, config: Dict) -> List[Dict]:
        """Generate standardized tags for a job in the order specified by user."""
        tags = []
        text_to_analyze = f"{title} {description} {location}".lower()
        
        # 1. Employment Type tags (first priority)
        for keyword, tag in self.tag_mappings['employment_type'].items():
            if keyword in text_to_analyze:
                tags.append({'id': len(tags) + 1, 'label': tag, 'type': 'employment'})
                break
                
        # 2. Shift Type tags (second priority)
        for keyword, tag in self.tag_mappings['shift_type'].items():
            if keyword in text_to_analyze:
                tags.append({'id': len(tags) + 1, 'label': tag, 'type': 'shift'})
                break
                
        # 3. Care Setting tags (third priority)
        setting_tag = None
        for keyword, tag in self.tag_mappings['care_setting'].items():
            if keyword in text_to_analyze:
                setting_tag = tag
                break
                
        # Use config setting type if no setting detected
        if not setting_tag:
            setting_mapping = {
                'home_care': 'Home Care', 
                'snf': 'Skilled Nursing Facility', 
                'assisted_living': 'Assisted Living',
                'memory_care': 'Memory Care', 
                'hospice': 'Hospice', 
                'group_home': 'Group Home',
                'rehab_only': 'Skilled Nursing Facility',
                'mixed': 'Home Care'  # Default fallback
            }
            setting_tag = setting_mapping.get(config.get('setting_type'), 'Home Care')
            
        if setting_tag:
            tags.append({'id': len(tags) + 1, 'label': setting_tag, 'type': 'care_setting'})
            
        # 4. Other/Flags (fourth priority)
        # Add facility type flags
        if 'non-profit' in text_to_analyze or 'nonprofit' in text_to_analyze:
            tags.append({'id': len(tags) + 1, 'label': 'Non-Profit', 'type': 'facility'})
        elif 'private' in text_to_analyze:
            tags.append({'id': len(tags) + 1, 'label': 'Private Facility', 'type': 'facility'})
            
        # Multi-site network detection
        multi_site_keywords = ['locations', 'multiple sites', 'network', 'nationwide', 'regional']
        if any(keyword in text_to_analyze for keyword in multi_site_keywords):
            tags.append({'id': len(tags) + 1, 'label': 'Multi-Site Network', 'type': 'facility'})
            
        # Add urgency and bonus flags
        urgency_keywords = ['urgent', 'immediate', 'asap']
        if any(keyword in text_to_analyze for keyword in urgency_keywords):
            tags.append({'id': len(tags) + 1, 'label': 'Urgent Hire', 'type': 'flag'})
            
        bonus_keywords = ['bonus', 'sign-on', 'hiring bonus', 'signing bonus', 'incentive']
        if any(keyword in text_to_analyze for keyword in bonus_keywords):
            tags.append({'id': len(tags) + 1, 'label': 'Bonus Available', 'type': 'flag'})
            
        interview_keywords = ['same day', 'immediate interview', 'walk-in', 'on-the-spot']
        if any(keyword in text_to_analyze for keyword in interview_keywords):
            tags.append({'id': len(tags) + 1, 'label': 'Same-Day Interview', 'type': 'flag'})
            
        return tags
        
    def _extract_salary(self, text: str) -> str:
        """Extract salary information from text."""
        if not text:
            return ''
            
        salary_patterns = [
            r'\$[\d,]+(?:\.\d{2})?\s*-\s*\$[\d,]+(?:\.\d{2})?\s*(?:per\s+hour|\/hour|hourly)?',
            r'\$[\d,]+(?:\.\d{2})?\s*(?:per\s+hour|\/hour|hourly)',
            r'[\d,]+\s*-\s*[\d,]+\s*(?:per\s+hour|\/hour|hourly)',
            r'\$[\d,]+(?:\.\d{2})?\s*(?:annually|per\s+year|\/year)',
            r'competitive\s+(?:salary|wage|pay|compensation)',
            r'market\s+rate', r'DOE', r'based\s+on\s+experience'
        ]
        
        for pattern in salary_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        return ''
        
    def _find_job_elements(self, config: Dict) -> List:
        """Find job elements on the current page based on site type."""
        if not self.driver:
            return []
            
        # Universal job element selectors (ordered by specificity)
        selectors = [
            # Most specific job containers
            '.job-item', '.job-listing', '.job-card', '.position-item', '.career-item',
            '.job-result', '.job-entry', '.listing', '.opportunity', '.position', '.role', '.opening',
            
            # Data attributes (common in ATS systems)
            '[data-job-id]', '[data-position-id]', '[data-job]', '[data-position]',
            
            # Job links (catch-all for link-based listings)
            'a[href*="job"]', 'a[href*="position"]', 'a[href*="career"]',
            'a[href*="opening"]', 'a[href*="opportunity"]',
            
            # Generic containers that might contain jobs
            '.search-result', '.result-item', '.list-item', '.card', '.item', '.entry'
        ]
        
        for selector in selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    # Filter elements to ensure they contain healthcare job-related content
                    filtered_elements = []
                    for element in elements:
                        element_text = element.text.lower()
                        # Check for healthcare job keywords
                        healthcare_job_keywords = [
                            'nurse', 'nursing', 'care', 'aide', 'assistant', 'therapist', 
                            'coordinator', 'caregiver', 'cna', 'rn', 'lpn', 'medical',
                            'healthcare', 'health care', 'patient', 'clinical'
                        ]
                        if any(keyword in element_text for keyword in healthcare_job_keywords):
                            filtered_elements.append(element)
                    
                    if filtered_elements:
                        self._log(f"Found {len(filtered_elements)} healthcare job elements with selector: {selector}", "DEBUG")
                        return filtered_elements[:20]  # Limit to prevent overwhelming
                        
            except Exception as e:
                self._log(f"Error with selector {selector}: {e}", "DEBUG")
                continue
                
        return []

    def _extract_job_details_from_element(self, element, config: Dict) -> Optional[Dict]:
        """Extract job details from a job element."""
        try:
            # Extract job title
            title_selectors = [
                '.job-title', '.position-title', '.title', 'h1', 'h2', 'h3', 'h4',
                '.role-title', '.job-name', '.position-name', '.posting-title',
                'a[href*="job"]', 'a[href*="position"]'
            ]
            
            title = ''
            for selector in title_selectors:
                try:
                    title_elem = element.find_element(By.CSS_SELECTOR, selector)
                    title = title_elem.text.strip()
                    if title and len(title) > 3 and not title.lower().startswith('view'):
                        break
                except:
                    continue
                    
            if not title:
                # Fallback to first meaningful link text
                try:
                    links = element.find_elements(By.TAG_NAME, 'a')
                    for link in links:
                        link_text = link.text.strip()
                        if link_text and len(link_text) > 5:
                            title = link_text
                            break
                except:
                    return None
                    
            if not title:
                return None
                    
            # Extract location
            city, state, final_location = self._generate_comprehensive_location_data(element, config)
            
            # Extract salary
            salary_text = ''
            salary_selectors = ['.salary', '.wage', '.pay', '.compensation', '.rate', '.price']
            
            for selector in salary_selectors:
                try:
                    salary_elem = element.find_element(By.CSS_SELECTOR, selector)
                    salary_text = salary_elem.text.strip()
                    if salary_text:
                        break
                except:
                    continue
                    
            # Extract job URL
            job_url = ''
            try:
                job_link = element.find_element(By.TAG_NAME, 'a')
                job_url = job_link.get_attribute('href')
                # Ensure absolute URL
                if job_url and not job_url.startswith('http'):
                    base_url = config['search_url'].split('/')[0] + '//' + config['search_url'].split('/')[2]
                    job_url = base_url + job_url
            except:
                pass
                
            # Use element text as description for now (can be enhanced with detail page scraping)
            description = element.text.strip()
            # Clean up description (remove excessive whitespace)
            description = re.sub(r'\s+', ' ', description)
            overview = description[:200] + '...' if len(description) > 200 else description
                
            # Extract and clean salary
            if not salary_text:
                salary_text = self._extract_salary(description)
            
            cleaned_salary = self._extract_salary(salary_text) if salary_text else 'Not specified'
            
            # Generate tags in the specified order
            tags = self._generate_tags(title, description, final_location, config)
            
            # Create job data structure matching expected format
            job_data = {
                'id': f"{config['source_site']}_{abs(hash(job_url or title))}",
                'title': title,
                'company': config['source_site'],
                'location': final_location,
                'city': city or config.get('city', ''),
                'state': state or config.get('state', ''),
                'salary': cleaned_salary,
                'description': description,
                'overview': overview,
                'requirements': [],  # Could be enhanced to extract specific requirements
                'url': job_url or '',
                'source': config['source_site'],
                'source_url': config['search_url'],
                'scraped_at': datetime.now().isoformat(),
                'tags': tags,
                'setting_type': config.get('setting_type', 'mixed')
            }
            
            return job_data
            
        except Exception as e:
            self._log(f"Error extracting job details: {e}", "DEBUG")
            return None

    def scrape_site(self, config: Dict, max_pages: int = 1) -> List[Dict]:
        """Scrape jobs from a single site."""
        site_jobs = []
        self._log(f"Scraping {config['source_site']}: {config['search_url']}")
        
        try:
            self.driver.get(config['search_url'])
            time.sleep(random.uniform(3, 6))
            
            # Wait for page to load
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            # Look for job elements
            job_elements = self._find_job_elements(config)
            
            if not job_elements:
                self._log(f"No healthcare job elements found for {config['source_site']}")
                return site_jobs
                
            self._log(f"Found {len(job_elements)} potential job elements for {config['source_site']}")
            
            # Extract details from each job element
            for i, element in enumerate(job_elements[:15]):  # Limit to 15 jobs per site for performance
                try:
                    job_data = self._extract_job_details_from_element(element, config)
                    if job_data and job_data['title']:  # Ensure we have a valid job
                        site_jobs.append(job_data)
                        self._log(f"  ✓ {job_data['title']} at {job_data['location']}")
                except Exception as e:
                    self._log(f"  ⚠️ Error extracting job {i+1}: {e}", "DEBUG")
                    continue
                
        except Exception as e:
            self._log(f"❌ Error scraping {config['source_site']}: {e}")
            
        self._log(f"Completed {config['source_site']}: {len(site_jobs)} valid jobs found")
        return site_jobs

    def scrape_all_sites(self, max_sites: int = None, max_pages_per_site: int = 1) -> List[Dict]:
        """Scrape jobs from all configured sites."""
        self._log(f"🚀 Starting comprehensive healthcare job scraping")
        
        try:
            self._setup_driver()
            
            sites_to_process = self.site_configs[:max_sites] if max_sites else self.site_configs
            total_sites = len(sites_to_process)
            
            self._log(f"📋 Processing {total_sites} healthcare job sites")
            
            for i, config in enumerate(sites_to_process, 1):
                self._log(f"📍 [{i}/{total_sites}] Processing: {config['source_site']}")
                
                try:
                    site_jobs = self.scrape_site(config, max_pages_per_site)
                    self.jobs.extend(site_jobs)
                    
                    # Add delay between sites to be respectful
                    if i < total_sites:
                        delay = random.uniform(2, 5)
                        self._log(f"⏳ Waiting {delay:.1f}s before next site...")
                        time.sleep(delay)
                        
                except Exception as e:
                    self._log(f"❌ Error processing {config['source_site']}: {e}")
                    continue
                    
        except Exception as e:
            self._log(f"💥 Critical error during scraping: {e}")
            
        finally:
            if self.driver:
                self.driver.quit()
                
        # Remove duplicates
        unique_jobs = self._remove_duplicates(self.jobs)
        self._log(f"✅ Scraping completed! Found {len(unique_jobs)} unique healthcare jobs from {len(sites_to_process)} sites")
        return unique_jobs
        
    def _remove_duplicates(self, jobs: List[Dict]) -> List[Dict]:
        """Remove duplicate jobs based on title, company, and location."""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            # Create a normalized key for deduplication
            key = f"{job['title'].lower().strip()}|{job['company'].lower().strip()}|{job['location'].lower().strip()}"
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
                
        self._log(f"🔄 Removed {len(jobs) - len(unique_jobs)} duplicate jobs")
        return unique_jobs
        
    def save_jobs(self, filename_prefix: str = "comprehensive_healthcare_jobs"):
        """Save scraped jobs to JSON and CSV files."""
        if not self.jobs:
            self._log("⚠️ No jobs to save")
            return
            
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save as JSON
        json_filename = f"{filename_prefix}_{len(self.jobs)}_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(self.jobs, f, indent=2, ensure_ascii=False)
        self._log(f"💾 Saved {len(self.jobs)} jobs to {json_filename}")
        
        # Save as CSV with flattened structure
        if self.jobs:
            csv_filename = f"{filename_prefix}_{len(self.jobs)}_{timestamp}.csv"
            
            flattened_jobs = []
            for job in self.jobs:
                flattened_job = job.copy()
                # Convert tags to readable string format
                if 'tags' in flattened_job:
                    flattened_job['tags'] = '; '.join([f"{tag['label']} ({tag['type']})" for tag in flattened_job['tags']])
                # Convert any remaining lists to strings
                for key, value in flattened_job.items():
                    if isinstance(value, list):
                        flattened_job[key] = '; '.join(str(v) for v in value)
                flattened_jobs.append(flattened_job)
            
            if flattened_jobs:
                fieldnames = flattened_jobs[0].keys()
                with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(flattened_jobs)
                    
            self._log(f"📊 Saved {len(self.jobs)} jobs to {csv_filename}")

    def print_summary(self):
        """Print a detailed summary of scraped jobs."""
        if not self.jobs:
            print("No jobs found.")
            return
            
        print(f"\n{'='*60}")
        print(f"🏥 HEALTHCARE JOB SCRAPING SUMMARY")
        print(f"{'='*60}")
        print(f"📊 Total Jobs Found: {len(self.jobs)}")
        
        # Summary by source
        sources = {}
        for job in self.jobs:
            source = job['source']
            sources[source] = sources.get(source, 0) + 1
        
        print(f"\n📍 Jobs by Source:")
        for source, count in sorted(sources.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {source}: {count} jobs")
            
        # Summary by state
        states = {}
        for job in self.jobs:
            state = job.get('state', 'Unknown')
            if state:
                states[state] = states.get(state, 0) + 1
        
        if states:
            print(f"\n📍 Jobs by State:")
            for state, count in sorted(states.items(), key=lambda x: x[1], reverse=True)[:10]:
                print(f"  • {state}: {count} jobs")
                
        # Summary by care setting
        care_settings = {}
        for job in self.jobs:
            for tag in job.get('tags', []):
                if tag.get('type') == 'care_setting':
                    setting = tag['label']
                    care_settings[setting] = care_settings.get(setting, 0) + 1
                    
        if care_settings:
            print(f"\n🏥 Jobs by Care Setting:")
            for setting, count in sorted(care_settings.items(), key=lambda x: x[1], reverse=True):
                print(f"  • {setting}: {count} jobs")


def main():
    """Main function to run the comprehensive healthcare scraper."""
    print("🏥 Comprehensive Healthcare Job Scraper")
    print("=" * 50)
    
    if not SELENIUM_AVAILABLE:
        print("❌ Required packages not installed!")
        print("Please run: pip install selenium webdriver-manager beautifulsoup4")
        return
    
    try:
        # Initialize scraper
        scraper = ComprehensiveHealthcareScraper(headless=True, debug=False)
        
        if not scraper.site_configs:
            print("❌ No site configurations loaded. Please ensure 'Job Board Data Scrape.csv' is present.")
            return
        
        print(f"📋 Loaded {len(scraper.site_configs)} healthcare job sites")
        
        # Scrape from first 10 sites for testing (change max_sites=None for all sites)
        print("🚀 Starting scraping process...")
        jobs = scraper.scrape_all_sites(max_sites=10, max_pages_per_site=1)
        
        # Save results
        scraper.save_jobs()
        
        # Print detailed summary
        scraper.print_summary()
        
        print(f"\n✅ Scraping completed successfully!")
        print(f"📄 Results saved to JSON and CSV files")
        
    except KeyboardInterrupt:
        print("\n⏹️ Scraping interrupted by user")
    except Exception as e:
        print(f"💥 Error: {e}")


if __name__ == "__main__":
    main() 