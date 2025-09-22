#!/usr/bin/env python3
"""
Connecticut Healthcare Job Scraper - Individual Job Page Focus
=============================================================

This scraper focuses on extracting comprehensive job data from individual job detail pages.
It first finds job links on listing pages, then visits each job page to extract:
- Job title
- Company name
- Location
- Salary information
- Job type (Full Time, Part Time, etc.)
- Detailed job description
- Requirements and qualifications
- Application instructions
- Date posted
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

from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

# Configure enhanced logging
import os
from pathlib import Path

# Create logs directory if it doesn't exist
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# Configure logging with both file and console output
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
    # File handler for detailed logs
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_handler = logging.FileHandler(
        f"logs/ct_job_scraper_{timestamp}.log", 
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(detailed_formatter)
    
    # Console handler for user-friendly output
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(simple_formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.handlers.clear()  # Clear existing handlers
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    # Create specific logger for this module
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)
    
    return logger

# Initialize logging
logger = setup_logging(debug=False)

class CTJobScraper:
    """Connecticut Healthcare Job Scraper focused on individual job pages."""
    
    def __init__(self, headless: bool = True, debug: bool = False):
        self.headless = headless
        self.debug = debug
        
        # Reinitialize logging with debug setting
        global logger
        logger = setup_logging(debug=debug)
        
        self.playwright = None
        self.browser = None
        self.page = None
        self.jobs = []
        self.site_configs = self._load_ct_sites()
        
        # Enhanced scraping stats
        self.scraping_stats = {
            'start_time': datetime.now(),
            'end_time': None,
            'sites_processed': 0,
            'sites_successful': 0,
            'sites_failed': 0,
            'total_jobs_found': 0,
            'total_job_pages_visited': 0,
            'total_jobs_with_details': 0,
            'performance_metrics': {
                'total_pages_scraped': 0,
                'total_job_links_found': 0,
                'total_job_pages_visited': 0,
                'total_job_details_extracted': 0,
                'cache_hits': 0,
                'cache_misses': 0,
                'total_meta_extractions': 0,
                'total_enhanced_extractions': 0
            },
            'site_details': {},
            'errors': [],
            'warnings': []
        }
        
        # Cache for job details to avoid re-scraping
        self.job_details_cache = {}
        
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
                        'location_scope': row.get('location_scope', ''),
                        'setting_type': row.get('setting_type', ''),
                        'job_board_type': row.get('job board type', ''),
                        'parse_location': row.get('parse_location?', 'No') == 'Yes',
                        'notes': row.get('notes', '')
                    }
                    sites.append(site_config)
                    
            logger.info(f"✅ Loaded {len(sites)} Connecticut healthcare sites from ct_only.csv")
            return sites
            
        except Exception as e:
            logger.error(f"❌ Error loading sites from ct_only.csv: {e}")
            return []
    
    def _setup_driver(self) -> bool:
        """Setup Playwright browser and page."""
        try:
            logger.info("🔧 Setting up Playwright browser...")
            
            self.playwright = sync_playwright().start()
            
            # Launch browser with realistic settings
            self.browser = self.playwright.chromium.launch(
                headless=self.headless,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--disable-images',
                    '--disable-javascript',  # We'll enable it selectively
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ]
            )
            
            # Create page with realistic settings
            self.page = self.browser.new_page()
            
            # Set viewport
            self.page.set_viewport_size({"width": 1920, "height": 1080})
            
            # Set extra headers to look more like a real browser
            self.page.set_extra_http_headers({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            })
            
            logger.info("✅ Playwright browser setup complete")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to setup Playwright browser: {e}")
            return False
    
    def _find_job_links_on_page(self, config: Dict) -> List[str]:
        """Find all job links on the current page."""
        job_links = []
        site_name = config['source_site']
        
        logger.info(f"🔍 Finding job links on page for: {site_name}")
        
        if not self.page:
            logger.error("❌ Playwright page not available")
            return job_links
        
        try:
            # Wait for page to load
            time.sleep(3)
            
            # Use JavaScript to find job links
            links_script = """
            () => {
                const jobLinks = [];
                
                // Common patterns for job links
                const linkPatterns = [
                    // Apploi patterns
                    'a[href*="jobs.apploi.com"]',
                    'a[href*="apploi.com/view"]',
                    'a[href*="apploi.com/job"]',
                    
                    // Generic job patterns
                    'a[href*="/job/"]',
                    'a[href*="/career/"]',
                    'a[href*="/position/"]',
                    'a[href*="/employment/"]',
                    'a[href*="job_listing"]',
                    'a[href*="post_type=job"]',
                    
                    // ATS patterns
                    'a[href*="paycomonline.net"]',
                    'a[href*="dayforcehcm.com"]',
                    'a[href*="hireology.com"]',
                    'a[href*="icims.com"]',
                    'a[href*="adp.com"]',
                    'a[href*="paylocity.com"]',
                    'a[href*="ultipro.com"]',
                    'a[href*="oracle.com"]',
                    'a[href*="applicantpool.com"]',
                    
                    // Custom patterns
                    'a[href*="careers."]',
                    'a[href*="jobs."]',
                    'a[href*="employment."]'
                ];
                
                // Find all links that match patterns
                for (const pattern of linkPatterns) {
                    const links = document.querySelectorAll(pattern);
                    for (const link of links) {
                        const href = link.getAttribute('href');
                        if (href && href.trim()) {
                            // Make sure it's a job-related link
                            const text = link.textContent || '';
                            const lowerText = text.toLowerCase();
                            const lowerHref = href.toLowerCase();
                            
                            // Skip navigation, footer, header links
                            if (lowerText.includes('home') || lowerText.includes('about') || 
                                lowerText.includes('contact') || lowerText.includes('privacy') ||
                                lowerText.includes('terms') || lowerText.includes('login') ||
                                lowerText.includes('sign up') || lowerText.includes('register')) {
                                continue;
                            }
                            
                            // Make sure it's not just a page navigation link
                            if (lowerHref.includes('page=') || lowerHref.includes('sort=') || 
                                lowerHref.includes('filter=') || lowerHref.includes('search=')) {
                                continue;
                            }
                            
                            // Convert relative URLs to absolute
                            let fullUrl = href;
                            if (href.startsWith('/')) {
                                fullUrl = window.location.origin + href;
                            } else if (href.startsWith('./')) {
                                fullUrl = window.location.origin + href.substring(1);
                            } else if (!href.startsWith('http')) {
                                fullUrl = window.location.origin + '/' + href;
                            }
                            
                            if (!jobLinks.includes(fullUrl)) {
                                jobLinks.push(fullUrl);
                            }
                        }
                    }
                }
                
                // Also look for links with job-related text
                const allLinks = document.querySelectorAll('a[href]');
                for (const link of allLinks) {
                    const href = link.getAttribute('href');
                    const text = link.textContent || '';
                    
                    if (href && text && text.length > 3 && text.length < 100) {
                        const lowerText = text.toLowerCase();
                        
                        // Check if link text looks like a job title
                        const jobKeywords = ['nurse', 'cna', 'rn', 'lpn', 'therapist', 'aide', 'assistant', 
                                           'manager', 'director', 'coordinator', 'specialist', 'technician', 
                                           'care', 'health', 'medical', 'apply', 'job', 'position', 'career'];
                        
                        const hasJobKeyword = jobKeywords.some(keyword => lowerText.includes(keyword));
                        
                        if (hasJobKeyword && !text.includes('Home') && !text.includes('About') && 
                            !text.includes('Contact') && !text.includes('Privacy')) {
                            
                            // Convert relative URLs to absolute
                            let fullUrl = href;
                            if (href.startsWith('/')) {
                                fullUrl = window.location.origin + href;
                            } else if (href.startsWith('./')) {
                                fullUrl = window.location.origin + href.substring(1);
                            } else if (!href.startsWith('http')) {
                                fullUrl = window.location.origin + '/' + href;
                            }
                            
                            if (!jobLinks.includes(fullUrl)) {
                                jobLinks.push(fullUrl);
                            }
                        }
                    }
                }
                
                return jobLinks;
            }
            """
            
            job_links = self.page.evaluate(links_script)
            
            # Filter out duplicates and invalid links
            unique_links = []
            for link in job_links:
                if link and link.startswith('http') and link not in unique_links:
                    unique_links.append(link)
            
            logger.info(f"✅ Found {len(unique_links)} job links on page")
            return unique_links
            
        except Exception as e:
            logger.error(f"❌ Error finding job links: {e}")
            return []
    
    def _extract_job_details_from_page(self, job_url: str, config: Dict) -> Optional[Dict]:
        """Extract comprehensive job details from individual job page."""
        if not self.page:
            logger.error("❌ Playwright page not available for job page extraction")
            return None
        
        # Check cache first
        if job_url in self.job_details_cache:
            logger.debug(f"💾 Cache hit for: {job_url[:50]}...")
            return self.job_details_cache[job_url]
        
        self.scraping_stats['performance_metrics']['cache_misses'] += 1
        self.scraping_stats['performance_metrics']['total_job_pages_visited'] += 1
        
        logger.debug(f"🔍 Extracting job details from: {job_url}")
        
        try:
            # Store current page
            current_url = self.page.url
            
            # Visit job page with shorter timeout
            logger.debug(f"🚀 Navigating to job page...")
            self.page.goto(job_url, wait_until='domcontentloaded', timeout=15000)
            time.sleep(2)  # Wait for page to load
            
            # Extract job details using enhanced JavaScript
            job_details = self.page.evaluate("""
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
                        application_info: ''
                    };
                    
                    // Clean text function
                    const cleanText = (text) => {
                        if (!text) return '';
                        return text.replace(/\\s+/g, ' ').trim();
                    };
                    
                    // Extract title - enhanced selectors
                    const titleSelectors = [
                        'h1', 'h2', '.job-title', '.position-title', '.title',
                        '[class*="JobName"]', '[class*="JobTitle"]', '[class*="PositionTitle"]',
                        '[data-job-title]', '.job-name', '.position-name',
                        '.job-header h1', '.job-header h2', '.job-details h1',
                        '.position-header h1', '.job-info h1', '.job-info h2',
                        '.entry-title', '.post-title', '.page-title',
                        '[class*="title"]', '.job-title h1', '.job-title h2',
                        '.position h1', '.position h2', '.job h1', '.job h2',
                        '.listing-title', '.job-listing-title', '.position-listing-title'
                    ];
                    
                    for (const selector of titleSelectors) {
                        const elem = document.querySelector(selector);
                        if (elem && elem.textContent) {
                            const title = cleanText(elem.textContent);
                            if (title && title.length > 3 && title.length < 200 && 
                                !title.toLowerCase().includes('home') && 
                                !title.toLowerCase().includes('about') &&
                                !title.toLowerCase().includes('contact')) {
                                details.title = title;
                                break;
                            }
                        }
                    }
                    
                    // Extract company - enhanced selectors
                    const companySelectors = [
                        '.company', '.employer', '.company-name', '.organization',
                        '[class*="BrandName"]', '[class*="Company"]',
                        '[data-company]', '.job-company', '.employer-name',
                        '.job-header .company', '.job-info .company', '.job-details .company',
                        '.entry-meta .company', '.job-meta .company', '.position-meta .company',
                        '[class*="employer"]', '[class*="organization"]', '.job-employer',
                        '.position-company', '.listing-company', '.job-listing-company'
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
                    
                    // Extract location - enhanced selectors
                    const locationSelectors = [
                        '.location', '.job-location', '.address',
                        '[class*="Location"]', '[class*="MapLocation"]',
                        '[data-location]', '.job-city', '.job-state',
                        '.job-header .location', '.job-info .location', '.job-details .location',
                        '.entry-meta .location', '.job-meta .location', '.position-meta .location',
                        '[class*="address"]', '.job-address', '.position-address',
                        '.listing-location', '.job-listing-location', '.position-listing-location'
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
                    
                    // Extract salary - enhanced selectors
                    const salarySelectors = [
                        '.salary', '.compensation', '.pay-rate', '.job-salary',
                        '[class*="Salary"]', '[class*="Compensation"]', '[class*="Pay"]',
                        '[data-salary]', '.salary-range', '.pay-range',
                        '.job-header .salary', '.job-info .salary', '.job-details .salary',
                        '.entry-meta .salary', '.job-meta .salary', '.position-meta .salary',
                        '[class*="wage"]', '[class*="rate"]', '.job-wage', '.position-wage',
                        '.listing-salary', '.job-listing-salary', '.position-listing-salary'
                    ];
                    
                    for (const selector of salarySelectors) {
                        const elem = document.querySelector(selector);
                        if (elem && elem.textContent) {
                            const salary = cleanText(elem.textContent);
                            if (salary && salary.length > 3 && salary.length < 100) {
                                const lowerSalary = salary.toLowerCase();
                                if (lowerSalary.includes('$') || lowerSalary.includes('salary') || 
                                    lowerSalary.includes('pay') || lowerSalary.includes('compensation') ||
                                    lowerSalary.includes('hour') || lowerSalary.includes('year') ||
                                    lowerSalary.includes('wage') || lowerSalary.includes('rate')) {
                                    details.salary = salary;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Extract job type - enhanced selectors
                    const typeSelectors = [
                        '.job-type', '.employment-type', '.schedule',
                        '[class*="Type"]', '[class*="Employment"]',
                        '[data-job-type]', '.job-schedule', '.work-schedule',
                        '.entry-meta .type', '.job-meta .type', '.position-meta .type',
                        '[class*="schedule"]', '.job-schedule', '.position-schedule',
                        '.listing-type', '.job-listing-type', '.position-listing-type'
                    ];
                    
                    for (const selector of typeSelectors) {
                        const elem = document.querySelector(selector);
                        if (elem && elem.textContent) {
                            const jobType = cleanText(elem.textContent);
                            if (jobType && jobType.length > 2 && jobType.length < 50) {
                                const lowerType = jobType.toLowerCase();
                                const validTypes = ['full time', 'part time', 'per diem', 'temporary', 
                                                  'contract', 'permanent', 'seasonal', 'prn', 'casual',
                                                  'full-time', 'part-time', 'per-diem'];
                                if (validTypes.some(type => lowerType.includes(type))) {
                                    details.job_type = jobType;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Extract description - MAJOR ENHANCEMENT with multiple strategies
                    let description = '';
                    
                    // Strategy 1: Look for main content areas
                    const descSelectors = [
                        '.description', '.job-description', '.position-description',
                        '[class*="Description"]', '[class*="Content"]', '[class*="Summary"]',
                        '.job-details', '.position-details', '.job-summary',
                        '.job-content', '.position-content', '.job-body',
                        '.description-content', '.job-full-description',
                        '.entry-content', '.post-content', '.page-content',
                        '.job-text', '.position-text', '.listing-content',
                        '.job-listing-content', '.position-listing-content',
                        '.job-details-content', '.position-details-content',
                        '.job-full-content', '.position-full-content',
                        '.job-main', '.position-main', '.listing-main',
                        '.job-section', '.position-section', '.listing-section'
                    ];
                    
                    for (const selector of descSelectors) {
                        const elem = document.querySelector(selector);
                        if (elem && elem.textContent) {
                            const desc = cleanText(elem.textContent);
                            if (desc && desc.length > 100 && desc.length < 10000) {
                                description = desc;
                                break;
                            }
                        }
                    }
                    
                    // Strategy 2: If no description found, look for any large text blocks
                    if (!description) {
                        const allElements = document.querySelectorAll('div, section, article, p');
                        let bestCandidate = '';
                        
                        for (const elem of allElements) {
                            const text = cleanText(elem.textContent);
                            if (text && text.length > 200 && text.length < 5000) {
                                // Check if it looks like job description content
                                const lowerText = text.toLowerCase();
                                const jobKeywords = ['responsibilities', 'duties', 'requirements', 
                                                   'qualifications', 'experience', 'skills', 'education',
                                                   'license', 'certification', 'nursing', 'care', 'patient',
                                                   'health', 'medical', 'assist', 'provide', 'maintain',
                                                   'ensure', 'perform', 'coordinate', 'manage', 'supervise'];
                                
                                const keywordCount = jobKeywords.filter(keyword => lowerText.includes(keyword)).length;
                                
                                if (keywordCount >= 3 && text.length > bestCandidate.length) {
                                    bestCandidate = text;
                                }
                            }
                        }
                        
                        if (bestCandidate) {
                            description = bestCandidate;
                        }
                    }
                    
                    // Strategy 3: Look for content in specific job-related containers
                    if (!description) {
                        const jobContainers = document.querySelectorAll('[class*="job"], [class*="position"], [class*="listing"]');
                        for (const container of jobContainers) {
                            const text = cleanText(container.textContent);
                            if (text && text.length > 150 && text.length < 3000) {
                                description = text;
                                break;
                            }
                        }
                    }
                    
                    details.description = description;
                    
                    // Extract requirements/qualifications - enhanced selectors
                    const reqSelectors = [
                        '.requirements', '.qualifications', '.skills',
                        '[class*="Requirements"]', '[class*="Qualifications"]',
                        '.job-requirements', '.position-requirements',
                        '.job-qualifications', '.position-qualifications',
                        '.entry-content .requirements', '.job-content .requirements',
                        '.position-content .requirements', '.listing-content .requirements',
                        '.job-section .requirements', '.position-section .requirements',
                        '.job-details .requirements', '.position-details .requirements'
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
                    
                    // Extract date posted - enhanced selectors
                    const dateSelectors = [
                        '.date', '.posted', '.date-posted', '.job-date',
                        '[data-posted-date]', '.created-date', '.job-posted',
                        '.job-header .date', '.job-info .date', '.job-details .date',
                        '.entry-meta .date', '.job-meta .date', '.position-meta .date',
                        '.entry-date', '.post-date', '.published-date',
                        '.listing-date', '.job-listing-date', '.position-listing-date',
                        '[class*="date"]', '[class*="posted"]', '[class*="created"]'
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
                    
                    // Try to get date from JSON-LD schema
                    if (!details.date_posted) {
                        const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
                        if (jsonLdScript) {
                            try {
                                const jsonData = JSON.parse(jsonLdScript.textContent);
                                if (jsonData && jsonData['@type'] === 'JobPosting' && jsonData.datePosted) {
                                    details.date_posted = jsonData.datePosted;
                                }
                            } catch (e) {
                                // Ignore JSON parsing errors
                            }
                        }
                    }
                    
                    // Extract application information - enhanced selectors
                    const appSelectors = [
                        '.apply', '.application', '.how-to-apply',
                        '[class*="Apply"]', '[class*="Application"]',
                        '.job-apply', '.position-apply', '.apply-info',
                        '.entry-content .apply', '.job-content .apply',
                        '.position-content .apply', '.listing-content .apply',
                        '.job-section .apply', '.position-section .apply',
                        '.job-details .apply', '.position-details .apply',
                        '.apply-button', '.application-button', '.apply-now',
                        '.job-apply-button', '.position-apply-button'
                    ];
                    
                    for (const selector of appSelectors) {
                        const elem = document.querySelector(selector);
                        if (elem && elem.textContent) {
                            const appInfo = cleanText(elem.textContent);
                            if (appInfo && appInfo.length > 20 && appInfo.length < 1000) {
                                details.application_info = appInfo;
                                break;
                            }
                        }
                    }
                    
                    return details;
                }
            """)
            
            # Add metadata
            job_details['job_url'] = job_url
            job_details['source_url'] = config['search_url']
            job_details['company'] = job_details.get('company') or config['source_site']
            job_details['state'] = config.get('state', 'CT')
            job_details['city'] = config.get('city', '')
            job_details['zip_code'] = config.get('zip_code', '')
            job_details['scraped_at'] = datetime.now().isoformat()
            
            # Cache the results
            self.job_details_cache[job_url] = job_details
            
            # Log what we found
            if job_details.get('title'):
                logger.info(f"✅ Extracted job: {job_details['title']}")
            if job_details.get('description'):
                logger.info(f"📝 Description length: {len(job_details['description'])} chars")
            if job_details.get('salary'):
                logger.info(f"💰 Salary: {job_details['salary']}")
            
            # Go back to original page
            self.page.goto(current_url)
            time.sleep(2)
            
            return job_details
            
        except Exception as e:
            logger.warning(f"❌ Error extracting job details from {job_url}: {e}")
            # Try to go back to original page
            try:
                self.page.goto(current_url)
                time.sleep(2)
            except:
                pass
            return None

    def _enhance_job_with_details(self, job: Dict) -> Dict:
        """Enhance job data by visiting the job URL and extracting detailed information."""
        if not job.get('job_url'):
            return job
        
        enhanced_job = job.copy()
        job_url = job['job_url']
        
        try:
            logger.info(f"    🔍 Enhancing job: {job.get('title', 'Unknown')}")
            logger.info(f"    🔗 URL: {job_url}")
            
            # Extract detailed information from job page
            job_details = self._extract_job_details_from_page(job_url, {
                'source_site': job.get('company', ''),
                'search_url': job.get('source_url', ''),
                'state': job.get('state', 'CT'),
                'city': job.get('city', ''),
                'zip_code': job.get('zip_code', '')
            })
            
            if job_details:
                # Update enhanced job with detailed information
                if job_details.get('company') and job_details['company'] != enhanced_job.get('company'):
                    enhanced_job['company'] = job_details['company']
                
                if job_details.get('location') and job_details['location'] != enhanced_job.get('location'):
                    enhanced_job['location'] = job_details['location']
                
                if job_details.get('salary') and job_details['salary'] != enhanced_job.get('salary'):
                    enhanced_job['salary'] = job_details['salary']
                
                if job_details.get('job_type') and job_details['job_type'] != enhanced_job.get('job_type'):
                    enhanced_job['job_type'] = job_details['job_type']
                
                if job_details.get('date_posted') and job_details['date_posted'] != enhanced_job.get('date_posted'):
                    enhanced_job['date_posted'] = job_details['date_posted']
                
                if job_details.get('description') and len(job_details['description']) > len(enhanced_job.get('description', '')):
                    enhanced_job['description'] = job_details['description']
                
                if job_details.get('requirements'):
                    enhanced_job['requirements'] = job_details['requirements']
                
                if job_details.get('qualifications'):
                    enhanced_job['qualifications'] = job_details['qualifications']
                
                if job_details.get('application_info'):
                    enhanced_job['application_info'] = job_details['application_info']
                
                # Extract city and zip code from location if available
                if job_details.get('location'):
                    location_parts = job_details['location'].split(',')
                    if len(location_parts) >= 2:
                        enhanced_job['city'] = location_parts[0].strip()
                        state_zip = location_parts[1].strip()
                        zip_match = re.search(r'\d{5}', state_zip)
                        if zip_match:
                            enhanced_job['zip_code'] = zip_match.group()
                
                self.scraping_stats['performance_metrics']['total_enhanced_extractions'] += 1
                logger.info(f"    ✅ Enhanced job with detailed information")
            
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
                time.sleep(random.uniform(1, 3))
            
            # Longer delay between batches
            if i + batch_size < total_jobs:
                logger.info(f"⏳ Waiting 5 seconds before next batch...")
                time.sleep(5)
        
        logger.info(f"✅ Completed job enhancement. Enhanced {self.scraping_stats['performance_metrics']['total_enhanced_extractions']} jobs")
        return enhanced_jobs
    
    def _scrape_site_jobs(self, config: Dict, max_jobs: int = 50) -> List[Dict]:
        """Scrape jobs from a single site by visiting individual job pages."""
        site_jobs = []
        site_name = config['source_site']
        
        logger.info(f"🏥 Processing site: {site_name}")
        logger.info(f"🔗 URL: {config['search_url']}")
        
        start_time = datetime.now()
        
        try:
            # Visit the site's job page
            logger.info(f"🌐 Visiting: {config['search_url']}")
            self.page.goto(config['search_url'], wait_until='networkidle')
            time.sleep(5)  # Wait for page to load
            
            # Find job links on the page
            job_links = self._find_job_links_on_page(config)
            
            if not job_links:
                logger.warning(f"⚠️ No job links found on {site_name}")
                return site_jobs
            
            logger.info(f"🔗 Found {len(job_links)} job links, processing up to {max_jobs}...")
            
            # Process each job link
            jobs_processed = 0
            for i, job_url in enumerate(job_links[:max_jobs]):
                try:
                    logger.debug(f"📋 Processing job {i+1}/{min(len(job_links), max_jobs)}: {job_url[:50]}...")
                    
                    # Extract job details from individual page
                    job_details = self._extract_job_details_from_page(job_url, config)
                    
                    if job_details and job_details.get('title'):
                        site_jobs.append(job_details)
                        jobs_processed += 1
                        logger.debug(f"✅ Successfully extracted job: {job_details['title']}")
                    else:
                        logger.debug(f"⚠️ No job details extracted from: {job_url}")
                    
                    # Add delay between requests
                    time.sleep(random.uniform(1, 3))
                    
                except Exception as e:
                    logger.warning(f"❌ Error processing job {i+1}: {e}")
                    continue
            
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"✅ {site_name}: Successfully extracted {jobs_processed} jobs in {duration:.1f}s")
            
            # Update stats
            self.scraping_stats['sites_processed'] += 1
            self.scraping_stats['sites_successful'] += 1
            self.scraping_stats['total_jobs_found'] += len(site_jobs)
            self.scraping_stats['site_details'][site_name] = {
                'status': 'success',
                'jobs_found': len(site_jobs),
                'duration_seconds': duration,
                'url': config['search_url']
            }
            
            return site_jobs
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            logger.error(f"❌ Error scraping {site_name}: {e}")
            
            # Update stats
            self.scraping_stats['sites_processed'] += 1
            self.scraping_stats['sites_failed'] += 1
            self.scraping_stats['errors'].append({
                'site': site_name,
                'error': str(e),
                'url': config['search_url']
            })
            self.scraping_stats['site_details'][site_name] = {
                'status': 'error',
                'jobs_found': 0,
                'duration_seconds': duration,
                'url': config['search_url'],
                'error': str(e)
            }
            
            return []
    
    def save_progress(self, jobs: List[Dict], site_name: str = "", filename_prefix: str = "ct_jobs_progress"):
        """Save current progress to a file after each site."""
        if not jobs:
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        site_suffix = f"_{site_name.replace(' ', '_').replace('/', '_')}" if site_name else ""
        
        # Save as JSON
        json_filename = f"{filename_prefix}{site_suffix}_{len(jobs)}_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(jobs, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Progress saved: {json_filename} ({len(jobs)} jobs)")

    def scrape_all_sites(self, max_sites: int = None, max_jobs_per_site: int = 20, enhance_jobs: bool = True) -> List[Dict]:
        """Scrape jobs from all Connecticut healthcare sites with optional job enhancement."""
        logger.info("🚀 Starting Connecticut healthcare job scraping...")
        logger.info(f"📊 Total sites available: {len(self.site_configs)}")
        if enhance_jobs:
            logger.info("🔍 Job enhancement enabled - will visit individual job URLs for detailed information")
        
        if not self._setup_driver():
            logger.error("❌ Failed to setup browser, aborting")
            return []
        
        all_jobs = []
        
        try:
            # Determine how many sites to process
            sites_to_process = self.site_configs
            if max_sites:
                sites_to_process = self.site_configs[:max_sites]
                logger.info(f"🔧 Test mode: Processing first {max_sites} sites")
            
            # Process each site
            for i, config in enumerate(sites_to_process, 1):
                logger.info(f"📋 Processing {i}/{len(sites_to_process)}: {config['source_site']}")
                
                try:
                    site_jobs = self._scrape_site_jobs(config, max_jobs_per_site)
                    all_jobs.extend(site_jobs)
                    
                    # Save progress after each site
                    logger.info(f"💾 Saving progress after site {i}...")
                    self.save_progress(all_jobs, config['source_site'])
                    
                    # Add delay between sites
                    time.sleep(random.uniform(2, 5))
                    
                except Exception as e:
                    logger.error(f"❌ Error processing site {config['source_site']}: {e}")
                    # Still save progress even if this site failed
                    if all_jobs:
                        logger.info(f"💾 Saving progress after failed site {i}...")
                        self.save_progress(all_jobs, f"failed_{config['source_site']}")
                    continue
            
            # Remove duplicates
            unique_jobs = self._remove_duplicates(all_jobs)
            logger.info(f"🔄 Removed {len(all_jobs) - len(unique_jobs)} duplicate jobs")
            
            # Save progress after deduplication
            if unique_jobs:
                logger.info(f"💾 Saving progress after deduplication...")
                self.save_progress(unique_jobs, "deduplicated")
            
            # Enhance jobs if requested
            if enhance_jobs and unique_jobs:
                logger.info(f"\n🔍 Starting job enhancement process...")
                enhanced_jobs = self._enhance_jobs_batch(unique_jobs)
                unique_jobs = enhanced_jobs
                
                # Save progress after enhancement
                if unique_jobs:
                    logger.info(f"💾 Saving progress after enhancement...")
                    self.save_progress(unique_jobs, "enhanced")
            
            # Update final stats
            self.scraping_stats['end_time'] = datetime.now()
            self.scraping_stats['total_jobs_found'] = len(unique_jobs)
            
            logger.info(f"🎉 Scraping completed! Found {len(unique_jobs)} unique jobs")
            
            return unique_jobs
            
        except Exception as e:
            logger.error(f"❌ Error during scraping: {e}")
            # Save whatever we have so far
            if all_jobs:
                logger.info(f"💾 Saving progress after error...")
                self.save_progress(all_jobs, "error_recovery")
            return []
        
        finally:
            # Cleanup
            if self.browser:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
    
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
    
    def save_jobs(self, jobs: List[Dict], filename_prefix: str = "ct_jobs"):
        """Save jobs to JSON and CSV files."""
        if not jobs:
            logger.warning("⚠️ No jobs to save")
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
        
        logger.info(f"💾 Jobs saved: {json_filename} ({len(jobs)} jobs)")
        logger.info(f"💾 Jobs saved: {csv_filename} ({len(jobs)} jobs)")
    
    def print_summary(self):
        """Print comprehensive scraping summary."""
        print("="*80)
        print("🎯 CONNECTICUT HEALTHCARE JOB SCRAPING SUMMARY")
        print("="*80)
        
        # Basic statistics
        print(f"📊 BASIC STATISTICS:")
        print(f"   Sites processed: {self.scraping_stats['sites_processed']}")
        print(f"   Sites successful: {self.scraping_stats['sites_successful']}")
        print(f"   Sites failed: {self.scraping_stats['sites_failed']}")
        print(f"   Total jobs found: {self.scraping_stats['total_jobs_found']}")
        
        # Performance metrics
        if self.scraping_stats['performance_metrics']:
            print(f"\n⚡ PERFORMANCE METRICS:")
            metrics = self.scraping_stats['performance_metrics']
            print(f"   Total job pages visited: {metrics.get('total_job_pages_visited', 0)}")
            print(f"   Cache hits: {metrics.get('cache_hits', 0)}")
            print(f"   Cache misses: {metrics.get('cache_misses', 0)}")
            
            # Calculate cache hit rate
            total_cache_requests = metrics.get('cache_hits', 0) + metrics.get('cache_misses', 0)
            if total_cache_requests > 0:
                cache_hit_rate = (metrics.get('cache_hits', 0) / total_cache_requests) * 100
                print(f"   Cache hit rate: {cache_hit_rate:.1f}%")
        
        # Timing information
        if self.scraping_stats['start_time'] and self.scraping_stats['end_time']:
            duration = (self.scraping_stats['end_time'] - self.scraping_stats['start_time']).total_seconds()
            print(f"\n⏱️ TIMING:")
            print(f"   Start time: {self.scraping_stats['start_time'].strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"   End time: {self.scraping_stats['end_time'].strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"   Total duration: {duration:.1f} seconds ({duration/60:.1f} minutes)")
            
            if self.scraping_stats['sites_processed'] > 0:
                avg_time_per_site = duration / self.scraping_stats['sites_processed']
                print(f"   Average time per site: {avg_time_per_site:.1f} seconds")
        
        # Site details
        if self.scraping_stats['site_details']:
            print(f"\n🏥 SITE DETAILS:")
            successful_sites = [site for site, details in self.scraping_stats['site_details'].items() 
                              if details.get('status') == 'success']
            failed_sites = [site for site, details in self.scraping_stats['site_details'].items() 
                           if details.get('status') == 'error']
            
            print(f"   Successful sites: {len(successful_sites)}")
            print(f"   Failed sites: {len(failed_sites)}")
            
            # Show top performing sites
            if successful_sites:
                print(f"\n   🏆 TOP PERFORMING SITES:")
                site_jobs = [(site, self.scraping_stats['site_details'][site]['jobs_found']) 
                            for site in successful_sites]
                site_jobs.sort(key=lambda x: x[1], reverse=True)
                
                for i, (site, jobs) in enumerate(site_jobs[:5], 1):
                    duration = self.scraping_stats['site_details'][site]['duration_seconds']
                    print(f"     {i}. {site}: {jobs} jobs ({duration:.1f}s)")
        
        # Errors and warnings
        if self.scraping_stats['errors']:
            print(f"\n❌ ERRORS ENCOUNTERED ({len(self.scraping_stats['errors'])}):")
            for i, error in enumerate(self.scraping_stats['errors'][:5], 1):
                print(f"   {i}. {error['site']}: {error['error']}")
                if 'url' in error:
                    print(f"      URL: {error['url']}")
        
        if self.scraping_stats['warnings']:
            print(f"\n⚠️ WARNINGS ({len(self.scraping_stats['warnings'])}):")
            for warning in self.scraping_stats['warnings']:
                print(f"   - {warning}")
        
        print("="*80)

def main():
    """Main function to run the Connecticut job scraper."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Connecticut Healthcare Job Scraper')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode with detailed logging')
    parser.add_argument('--headless', action='store_true', default=True, help='Run in headless mode (default: True)')
    parser.add_argument('--max-sites', type=int, help='Maximum sites to scrape (for testing)')
    parser.add_argument('--max-jobs-per-site', type=int, default=20, help='Maximum jobs to scrape per site (default: 20)')
    parser.add_argument('--test', action='store_true', help='Run in test mode (scrape only first 3 sites)')
    parser.add_argument('--no-enhance', action='store_true', help='Disable job enhancement (skip visiting individual job URLs)')
    
    args = parser.parse_args()
    
    print("🚀 Starting Connecticut Healthcare Job Scraper...")
    print(f"🔧 Configuration:")
    print(f"   Debug mode: {args.debug}")
    print(f"   Headless mode: {args.headless}")
    print(f"   Max jobs per site: {args.max_jobs_per_site}")
    print(f"   Test mode: {args.test}")
    print(f"   Job enhancement: {not args.no_enhance}")
    
    scraper = CTJobScraper(headless=args.headless, debug=args.debug)
    
    # Determine max sites for test mode
    max_sites = None
    if args.test:
        max_sites = 3
    elif args.max_sites:
        max_sites = args.max_sites
    
    # Run the scraper
    jobs = scraper.scrape_all_sites(
        max_sites=max_sites, 
        max_jobs_per_site=args.max_jobs_per_site,
        enhance_jobs=not args.no_enhance
    )
    
    if jobs:
        # Save results
        scraper.save_jobs(jobs)
        
        # Print summary
        scraper.print_summary()
        
        print(f"\n✅ Connecticut job scraping completed successfully!")
        print(f"📁 Results saved to: ct_jobs_{len(jobs)}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    else:
        print("❌ No jobs found or scraping failed")

if __name__ == "__main__":
    main()
    main()