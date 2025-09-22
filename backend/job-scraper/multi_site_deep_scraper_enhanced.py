#!/usr/bin/env python3
"""
Enhanced Multi-Site Deep Scraper with Crawl4AI Integration
==========================================================

- Reads multi.csv for target job sites
- Uses Crawl4AI for dynamic selector detection and data extraction
- For each site, deeply scrapes job listings and job detail pages
- Focuses on CT and surrounding states
- Excludes jobs older than 60 days
- Saves results in CSV and JSON
"""

import csv
import json
import logging
import re
import time
import random
import base64
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import asyncio
from playwright.async_api import async_playwright
from urllib.parse import urljoin
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
from crawl4ai.extraction_strategy import LLMExtractionStrategy
from dateutil import parser as date_parser

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SURROUNDING_STATES = {"CT", "NY", "MA", "RI", "NJ", "NH", "VT", "PA"}

# Base selectors for fallback - expanded for different site types
BASE_SELECTORS = {
    # Job cards/containers - expanded for different formats
    "card": [
        # iCIMS specific selectors (National Healthcare Associates)
        ".iCIMS_JobsTable .row",
        ".iCIMS_JobsTable div[class*='row']",
        # General selectors
        "a[href*='job']", 
        "a[href*='career']",
        "a[href*='position']",
        ".job-listing", 
        ".job-card", 
        ".listing", 
        "[class*='job']", 
        "[class*='listing']",
        ".search-result",
        ".result-item",
        ".job-item",
        ".position-item",
        ".career-item",
        "[data-job-id]",
        "[data-position-id]",
        ".job-search-result",
        ".career-search-result",
        "tr[data-job-id]",
        "li[class*='job']",
        "div[class*='job']",
        ".search-result-item",
        ".job-opportunity",
        ".career-opportunity",
        ".job-opening",
        ".position-opening",
        ".job-posting",
        ".career-posting"
    ],
    
    # Job titles - expanded for different formats
    "title": [
        # iCIMS specific selectors (National Healthcare Associates)
        ".col-xs-12.title h3",
        ".col-xs-12.title a h3",
        ".title h3",
        # General selectors
        "h1", "h2", "h3", "h4",
        ".title", ".job-title", "[class*='title']",
        ".position-title",
        ".career-title",
        ".job-name",
        ".position-name",
        ".job-heading",
        ".position-heading",
        "[data-job-title]",
        ".job-link",
        "a[href*='job']",
        "a[href*='career']",
        "a[href*='position']"
    ],
    
    # Company names - expanded
    "company": [
        # iCIMS specific selectors (National Healthcare Associates)
        ".col-xs-6.header.left span",
        ".header.left span",
        # General selectors
        ".company", ".employer", ".company-name", "[class*='company']",
        ".organization",
        ".employer-name",
        ".facility-name",
        ".location-name",
        "[data-company]",
        ".job-company",
        ".position-company"
    ],
    
    # Job locations - expanded
    "location": [
        ".location", ".job-location", "[class*='location']",
        ".job-city",
        ".job-state",
        ".position-location",
        ".career-location",
        ".job-address",
        ".position-address",
        "[data-location]",
        ".job-site",
        ".position-site",
        ".facility-location",
        ".work-location"
    ],
    
    # Salary information - expanded
    "salary": [
        ".salary", ".pay", ".compensation", "[class*='salary']", "[class*='pay']",
        ".job-salary",
        ".position-salary",
        ".compensation-range",
        ".pay-range",
        ".salary-range",
        ".job-pay",
        ".position-pay",
        "[data-salary]",
        ".wage",
        ".rate"
    ],
    
    # Job descriptions - expanded
    "description": [
        # iCIMS specific selectors (National Healthcare Associates)
        ".col-xs-12.description",
        ".description",
        # General selectors
        ".job-description", "[class*='description']",
        ".job-summary",
        ".position-summary",
        ".job-details",
        ".position-details",
        ".job-overview",
        ".position-overview",
        ".job-content",
        ".position-content",
        ".job-text",
        ".position-text"
    ],
    
    # Posted dates - expanded
    "date": [
        ".date", ".posted", ".date-posted", "[class*='date']",
        ".job-date",
        ".position-date",
        ".posted-date",
        ".created-date",
        ".publish-date",
        ".job-posted",
        ".position-posted",
        "[data-posted-date]",
        ".job-created",
        ".position-created",
        ".job-published",
        ".position-published"
    ]
}

class EnhancedMultiSiteDeepScraper:
    def __init__(self, csv_path: str, max_sites: int = 0, pages_per_site: int = 3, max_jobs_per_page: int = 50):
        self.csv_path = csv_path
        self.max_sites = max_sites if max_sites > 0 else None
        self.pages_per_site = pages_per_site
        self.max_jobs_per_page = max_jobs_per_page
        self.sites = self._load_sites()
        self.results: List[Dict[str, Any]] = []
        self.crawler = AsyncWebCrawler()
        self._compile_regex_patterns()
        
    def _compile_regex_patterns(self):
        """Compile regex patterns for data extraction"""
        # Salary patterns
        self.salary_patterns = [
            re.compile(r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+)?(?:hour|hr|year|yr|month|mo)', re.IGNORECASE),
            re.compile(r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+)?(?:hour|hr|year|yr|month|mo)', re.IGNORECASE),
            re.compile(r'\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+)?(?:hour|hr|year|yr|month|mo)', re.IGNORECASE),
            re.compile(r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+)?(?:hour|hr|year|yr|month|mo)', re.IGNORECASE),
            re.compile(r'salary[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', re.IGNORECASE),
            re.compile(r'pay[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', re.IGNORECASE),
            re.compile(r'compensation[:\s]*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', re.IGNORECASE),
        ]
        
        # Company name patterns
        self.company_patterns = [
            re.compile(r'at\s+([A-Z][a-zA-Z\s&.,]+?)(?:\s+we|\s+is|\s+are|\s+offers|\s+provides)', re.IGNORECASE),
            re.compile(r'join\s+([A-Z][a-zA-Z\s&.,]+?)(?:\s+team|\s+family|\s+staff)', re.IGNORECASE),
            re.compile(r'([A-Z][a-zA-Z\s&.,]+?)\s+is\s+(?:seeking|looking|hiring)', re.IGNORECASE),
        ]
        
        # Location patterns
        self.location_patterns = [
            re.compile(r'in\s+([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})', re.IGNORECASE),
            re.compile(r'located\s+in\s+([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})', re.IGNORECASE),
            re.compile(r'([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})', re.IGNORECASE),
        ]

    def extract_salary_info(self, text: str) -> str:
        """Extract salary information from text using regex patterns"""
        if not text:
            return ""
        
        for pattern in self.salary_patterns:
            match = pattern.search(text)
            if match:
                if len(match.groups()) == 2:  # Range
                    return f"${match.group(1)} - ${match.group(2)}"
                else:  # Single value
                    return f"${match.group(1)}"
        return ""

    def extract_company_name(self, text: str) -> str:
        """Extract company name from text using regex patterns"""
        if not text:
            return ""
        
        for pattern in self.company_patterns:
            match = pattern.search(text)
            if match:
                company = match.group(1).strip()
                # Clean up common suffixes
                company = re.sub(r'\s+(?:LLC|Inc|Corp|Corporation|Company|Co|Ltd|Limited)$', '', company, flags=re.IGNORECASE)
                return company
        return ""

    def extract_location_info(self, text: str) -> tuple:
        """Extract location information from text"""
        if not text:
            return "", ""
        
        for pattern in self.location_patterns:
            match = pattern.search(text)
            if match:
                location = match.group(1).strip()
                parts = location.split(',')
                if len(parts) >= 2:
                    city = parts[0].strip()
                    state = parts[1].strip()
                    return city, state
        return "", ""

    def extract_city_state_from_location(self, location: str) -> tuple:
        """Extract city and state from location string"""
        if not location:
            return "", ""
        
        # Handle various location formats
        location = location.strip()
        
        # Pattern 1: "City, State"
        city_state_pattern = re.compile(r'^([^,]+),\s*([A-Z]{2})\s*$')
        match = city_state_pattern.match(location)
        if match:
            return match.group(1).strip(), match.group(2).strip()
        
        # Pattern 2: "City, State, ZIP"
        city_state_zip_pattern = re.compile(r'^([^,]+),\s*([A-Z]{2})\s*,\s*\d{5}(?:-\d{4})?$')
        match = city_state_zip_pattern.match(location)
        if match:
            return match.group(1).strip(), match.group(2).strip()
        
        # Pattern 3: "Address, City, State"
        address_pattern = re.compile(r'^(.+),\s*([^,]+),\s*([A-Z]{2})\s*$')
        match = address_pattern.match(location)
        if match:
            return match.group(2).strip(), match.group(3).strip()
        
        # Pattern 4: "Address, City, State, ZIP"
        address_zip_pattern = re.compile(r'^(.+),\s*([^,]+),\s*([A-Z]{2})\s*,\s*\d{5}(?:-\d{4})?$')
        match = address_zip_pattern.match(location)
        if match:
            return match.group(2).strip(), match.group(3).strip()
        
        # Pattern 5: Just "City, State" in the middle of text
        city_state_in_text = re.compile(r'([A-Z][a-zA-Z\s]+),\s*([A-Z]{2})')
        match = city_state_in_text.search(location)
        if match:
            return match.group(1).strip(), match.group(2).strip()
        
        # Fallback: try to split by comma
        parts = location.split(',')
        if len(parts) >= 2:
            # Try to identify which part is the state (2-letter code)
            for i, part in enumerate(parts):
                part = part.strip()
                if re.match(r'^[A-Z]{2}$', part):
                    if i > 0:
                        return parts[i-1].strip(), part
                    elif i < len(parts) - 1:
                        return part, parts[i+1].strip()
        
        return "", ""

    def clean_salary_text(self, salary_text: str) -> str:
        """Clean and standardize salary text"""
        if not salary_text:
            return ""
        
        # Remove extra whitespace and normalize
        salary = re.sub(r'\s+', ' ', salary_text.strip())
        
        # Extract dollar amounts and ranges
        # Pattern for ranges like "$50,000 - $60,000"
        range_pattern = re.compile(r'\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', re.IGNORECASE)
        range_match = range_pattern.search(salary)
        if range_match:
            return f"${range_match.group(1)} - ${range_match.group(2)}"
        
        # Pattern for single amounts like "$50,000"
        single_pattern = re.compile(r'\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', re.IGNORECASE)
        single_match = single_pattern.search(salary)
        if single_match:
            return f"${single_match.group(1)}"
        
        # If no dollar amounts found, return original text
        return salary

    def _load_sites(self) -> List[Dict[str, str]]:
        sites = []
        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("search_url"):
                    sites.append(row)
        logger.info(f"Loaded {len(sites)} sites from {self.csv_path}")
        if self.max_sites:
            sites = sites[:self.max_sites]
        return sites

    async def detect_selectors_with_crawl4ai(self, page_content: str, site_name: str) -> Dict[str, List[str]]:
        """Detect job listing selectors - simplified to use base selectors since manual extraction works better"""
        try:
            # Skip Crawl4AI selector detection since it's not working well
            # and manual extraction with base selectors is more reliable
            logger.info(f"Using base selectors for {site_name} (Crawl4AI selector detection skipped)")
            return BASE_SELECTORS
                
        except Exception as e:
            logger.warning(f"Failed to detect selectors for {site_name}: {e}")
            return BASE_SELECTORS

    async def extract_job_data_with_crawl4ai(self, job_url: str, job_title: str = "") -> Dict[str, Any]:
        """Use Crawl4AI to extract detailed job information"""
        try:
            extraction_strategy = LLMExtractionStrategy(
                extraction_prompt=f"""
                Extract detailed job information from this job posting page.
                Job title: {job_title}
                
                Extract the following information:
                1. Job title (if not already provided)
                2. Company name
                3. Job location (city, state)
                4. Salary information (including ranges, hourly rates, bonuses)
                5. Job description
                6. Posted date
                7. Application URL or instructions
                
                Return a JSON object with the extracted data:
                {{
                    "title": "job title",
                    "company": "company name",
                    "location": "full location",
                    "city": "city name",
                    "state": "state abbreviation",
                    "salary": "salary information",
                    "description": "job description",
                    "date_posted": "posted date",
                    "apply_url": "application URL"
                }}
                
                Be thorough in extracting salary information - look for hourly rates, annual salaries, bonuses, benefits, etc.
                If information is not available, use null for that field.
                """,
                extraction_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "company": {"type": "string"},
                        "location": {"type": "string"},
                        "city": {"type": "string"},
                        "state": {"type": "string"},
                        "salary": {"type": "string"},
                        "description": {"type": "string"},
                        "date_posted": {"type": "string"},
                        "apply_url": {"type": "string"}
                    }
                }
            )
            
            result = await self.crawler.arun(
                url=job_url,
                extraction_strategy=extraction_strategy
            )
            
            if result.extracted_content:
                job_data = json.loads(result.extracted_content)
                logger.info(f"Crawl4AI extracted job data: {job_data.get('title', 'Unknown')}")
                return job_data
                
        except Exception as e:
            logger.warning(f"Failed to extract job data with Crawl4AI: {e}")
        
        return {}

    async def detect_pagination_method(self, page, site_name: str) -> Dict[str, Any]:
        """Detect the pagination method used by the site"""
        try:
            # Common pagination selectors
            pagination_selectors = [
                "nav[aria-label*='pagination']",
                ".pagination",
                ".pager",
                "[class*='pagination']",
                "[class*='pager']",
                "ul.pagination",
                ".page-numbers",
                ".pagination-nav",
                "button[aria-label*='next']",
                "button[aria-label*='previous']",
                "a[aria-label*='next']",
                "a[aria-label*='previous']",
                ".next",
                ".prev",
                ".previous",
                "[data-page]",
                "[data-pagination]"
            ]
            
            # Check for pagination elements
            pagination_elements = []
            for selector in pagination_selectors:
                elements = await page.query_selector_all(selector)
                if elements:
                    pagination_elements.extend(elements)
            
            # Check for "Load More" or "Show More" buttons
            load_more_selectors = [
                "button:has-text('Load More')",
                "button:has-text('Show More')",
                "button:has-text('View More')",
                "a:has-text('Load More')",
                "a:has-text('Show More')",
                ".load-more",
                ".show-more",
                "[class*='load-more']",
                "[class*='show-more']"
            ]
            
            load_more_button = None
            for selector in load_more_selectors:
                try:
                    load_more_button = await page.query_selector(selector)
                    if load_more_button:
                        break
                except:
                    continue
            
            # Check for infinite scroll indicators
            infinite_scroll_indicators = [
                ".infinite-scroll",
                "[data-infinite-scroll]",
                ".scroll-load",
                "[class*='infinite']"
            ]
            
            has_infinite_scroll = False
            for selector in infinite_scroll_indicators:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        has_infinite_scroll = True
                        break
                except:
                    continue
            
            # Check URL structure for pagination patterns
            current_url = page.url
            url_has_pagination = any(pattern in current_url for pattern in ['page=', 'p=', 'offset=', 'start='])
            
            pagination_info = {
                "has_pagination_elements": len(pagination_elements) > 0,
                "has_load_more": load_more_button is not None,
                "has_infinite_scroll": has_infinite_scroll,
                "url_has_pagination": url_has_pagination,
                "pagination_elements": len(pagination_elements),
                "method": "unknown"
            }
            
            # Determine pagination method
            if has_infinite_scroll:
                pagination_info["method"] = "infinite_scroll"
            elif load_more_button:
                pagination_info["method"] = "load_more"
            elif pagination_elements:
                pagination_info["method"] = "traditional"
            elif url_has_pagination:
                pagination_info["method"] = "url_based"
            else:
                pagination_info["method"] = "single_page"
            
            logger.info(f"Pagination detection for {site_name}: {pagination_info['method']}")
            return pagination_info
            
        except Exception as e:
            logger.warning(f"Error detecting pagination for {site_name}: {e}")
            return {"method": "unknown", "has_pagination_elements": False}

    async def navigate_to_next_page(self, page, pagination_info: Dict[str, Any], current_page_num: int) -> bool:
        """Navigate to the next page using the detected pagination method"""
        try:
            if pagination_info["method"] == "load_more":
                # Click "Load More" button
                load_more_selectors = [
                    "button:has-text('Load More')",
                    "button:has-text('Show More')",
                    "button:has-text('View More')",
                    ".load-more",
                    ".show-more"
                ]
                
                for selector in load_more_selectors:
                    try:
                        button = await page.query_selector(selector)
                        if button and await button.is_visible():
                            await button.click()
                            await page.wait_for_timeout(3000)  # Wait for content to load
                            logger.info(f"Clicked 'Load More' button for page {current_page_num + 1}")
                            return True
                    except:
                        continue
                        
            elif pagination_info["method"] == "traditional":
                # Click next page button
                next_selectors = [
                    "a[aria-label*='next']",
                    "button[aria-label*='next']",
                    ".next",
                    ".pagination .next",
                    "a:has-text('Next')",
                    "button:has-text('Next')",
                    "[data-page='" + str(current_page_num + 1) + "']"
                ]
                
                for selector in next_selectors:
                    try:
                        next_button = await page.query_selector(selector)
                        if next_button and await next_button.is_visible() and await next_button.is_enabled():
                            await next_button.click()
                            await page.wait_for_timeout(3000)
                            logger.info(f"Clicked next page button for page {current_page_num + 1}")
                            return True
                    except:
                        continue
                        
            elif pagination_info["method"] == "url_based":
                # Try URL-based navigation
                current_url = page.url
                if "page=" in current_url:
                    next_url = current_url.replace(f"page={current_page_num}", f"page={current_page_num + 1}")
                elif "p=" in current_url:
                    next_url = current_url.replace(f"p={current_page_num}", f"p={current_page_num + 1}")
                else:
                    separator = "&" if "?" in current_url else "?"
                    next_url = f"{current_url}{separator}page={current_page_num + 1}"
                
                await page.goto(next_url, timeout=30000)
                await page.wait_for_timeout(3000)
                logger.info(f"Navigated to URL: {next_url}")
                return True
                
            elif pagination_info["method"] == "infinite_scroll":
                # Scroll to bottom to trigger infinite scroll
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(3000)
                logger.info(f"Scrolled to bottom for infinite scroll page {current_page_num + 1}")
                return True
            
            return False
            
        except Exception as e:
            logger.warning(f"Error navigating to next page: {e}")
            return False

    async def validate_page_change(self, page, previous_job_count: int, previous_job_urls: set) -> bool:
        """Validate that the page actually changed and has new content"""
        try:
            # Wait for content to load
            await page.wait_for_timeout(2000)
            
            # Get current job cards
            card_selectors = BASE_SELECTORS["card"]
            job_cards = []
            for selector in card_selectors:
                cards = await page.query_selector_all(selector)
                if cards:
                    job_cards.extend(cards)
                    break
            current_job_count = len(job_cards)
            
            # Get current job URLs
            current_job_urls = set()
            for card in job_cards[:10]:  # Check first 10 jobs
                try:
                    url = await card.get_attribute("href")
                    if url:
                        current_job_urls.add(url)
                except:
                    continue
            
            # Check if we have new content
            new_urls = current_job_urls - previous_job_urls
            has_new_content = len(new_urls) > 0
            
            logger.info(f"Page validation: {current_job_count} jobs, {len(new_urls)} new URLs, has_new_content: {has_new_content}")
            
            return has_new_content
            
        except Exception as e:
            logger.warning(f"Error validating page change: {e}")
            return False

    async def deep_scrape_site(self, site: Dict[str, str], max_pages: int = 3):
        base_url = site["search_url"]
        site_name = site["source_site"]
        logger.info(f"[Enhanced] Scraping {site_name} - up to {max_pages} pages")
        jobs = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Set user agent to avoid detection
            await page.set_extra_http_headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })
            
            try:
                # Navigate to the base URL
                await page.goto(base_url, timeout=60000)
                await page.wait_for_timeout(5000)
                
                # Check for iframes/embedded widgets and switch to them if found
                iframes = await page.query_selector_all("iframe")
                frame = None
                if iframes:
                    logger.info(f"Found {len(iframes)} iframes on {site_name}")
                    for i, iframe in enumerate(iframes):
                        try:
                            iframe_src = await iframe.get_attribute("src")
                            if iframe_src and "icims" in iframe_src.lower():
                                logger.info(f"Switching to iframe {i+1}: {iframe_src}")
                                frame = page.frame_locator(f"iframe:nth-child({i+1})")
                                break
                        except Exception as e:
                            logger.warning(f"Error checking iframe {i+1}: {e}")
                            continue
                
                # Add random delay to avoid rate limiting
                await page.wait_for_timeout(random.randint(2000, 5000))
                
                # Detect pagination method for this site
                pagination_info = await self.detect_pagination_method(page, site_name)
                logger.info(f"Detected pagination method: {pagination_info['method']}")
                
                processed_urls = set()
                previous_job_urls = set()
                all_job_cards_seen = set()
                page_num = 1
                while page_num <= max_pages:
                    logger.info(f"Processing page {page_num} for {site_name}")
                    # Use Crawl4AI for selector detection on first page
                    if page_num == 1:
                        try:
                            html_content = await page.content()
                            selectors = await self.detect_selectors_with_crawl4ai(html_content, site_name)
                            logger.info(f"Crawl4AI detected selectors for {site_name}")
                        except Exception as e:
                            logger.warning(f"Failed to use Crawl4AI for selector detection: {e}")
                            selectors = BASE_SELECTORS
                    else:
                        selectors = BASE_SELECTORS
                    card_selectors = selectors.get("card", BASE_SELECTORS["card"])
                    if isinstance(card_selectors, str):
                        card_selectors = [card_selectors]
                    job_cards = []
                    # Use frame for all selectors if present
                    search_context = frame if frame else page
                    for selector in card_selectors:
                        try:
                            if frame:
                                cards = await search_context.locator(selector).all()
                            else:
                                cards = await search_context.query_selector_all(selector)
                        if cards:
                            job_cards.extend(cards)
                            logger.info(f"Found {len(cards)} job cards with selector: {selector}")
                            break
                        except Exception as e:
                            logger.warning(f"Error with selector {selector}: {e}")
                            continue
                    logger.info(f"Found {len(job_cards)} job cards on page {page_num} for {site_name}")
                    MAX_JOBS_PER_PAGE = 500
                    if len(job_cards) > MAX_JOBS_PER_PAGE:
                        logger.warning(f"Found {len(job_cards)} jobs, limiting to first {MAX_JOBS_PER_PAGE} to prevent memory issues")
                        job_cards = job_cards[:MAX_JOBS_PER_PAGE]
                    # Widget debug: log first 5 job card HTMLs
                    for i, card in enumerate(job_cards[:5]):
                        try:
                            html = await card.inner_html()
                            logger.debug(f"Job card {i+1} HTML: {html[:200]}")
                        except:
                            continue
                    # Get current job URLs for validation
                    current_job_urls = set()
                    for card in job_cards:
                        try:
                            url = await card.get_attribute("href")
                            if url:
                                current_job_urls.add(url)
                        except:
                            continue
                    if page_num > 1:
                        has_new_content = await self.validate_page_change(page, len(job_cards), previous_job_urls)
                        if not has_new_content:
                            logger.info(f"No new content detected on page {page_num}, stopping pagination/infinite scroll")
                            break
                    previous_job_urls = current_job_urls
                    page_jobs = 0
                    for i, card in enumerate(job_cards):
                        try:
                            job_start_time = time.time()
                            JOB_TIMEOUT = 15
                            # Get job URL
                            job_url = await card.get_attribute("href")
                            if not job_url:
                                # Try to get from .col-xs-12.title a
                                try:
                                    url_elem = card.locator('.col-xs-12.title a').first
                                    job_url = await url_elem.get_attribute("href") if url_elem else ""
                                except:
                                    job_url = ""
                            if not job_url:
                                continue
                            job_url = job_url if job_url.startswith("http") else urljoin(page.url, job_url)
                            if job_url in processed_urls:
                                continue
                            processed_urls.add(job_url)
                            # Extract title
                            title = ""
                            try:
                                title_elem = card.locator('.col-xs-12.title h3').first
                                title = await title_elem.inner_text() if title_elem else ""
                            except:
                                pass
                            # Extract company/facility (skip label span)
                            company = ""
                            try:
                                company_spans = await card.locator('.col-xs-6.header.left span').all()
                                for span in company_spans:
                                    span_text = await span.inner_text()
                                    span_class = await span.get_attribute("class")
                                    
                                    # Skip spans with sr-only or field-label class (these are labels)
                                    if span_class and ("sr-only" in span_class or "field-label" in span_class):
                                continue
                            
                                    # Use the first non-label span as the company name
                                    if span_text and span_text.strip():
                                        company = span_text.strip()
                                        break
                            except:
                                pass
                            # Extract description
                            description = ""
                            try:
                                desc_elem = card.locator('.col-xs-12.description').first
                                description = await desc_elem.inner_text() if desc_elem else ""
                            except:
                                pass
                            # Extract city and state from company name
                            city, state = "", ""
                            if company:
                                # Try to extract city from company name
                                # Example: "Bethel Health & Rehabilitation Center" -> city="Bethel"
                                parts = company.split()
                                if len(parts) > 0:
                                    city = parts[0]
                                
                                # For National Healthcare Associates, most facilities are in CT
                                # We could enhance this by checking job detail pages for exact location
                                state = "CT"  # Default to CT for National Healthcare Associates
                            
                            # Compose job dict
                                        job = {
                                "title": title.strip() if title else "",
                                "company": company.strip() if company else "",
                                "location": company.strip() if company else "",
                                "city": city,
                                "state": state,
                                            "date_posted": "",
                                            "salary": "",
                                "description": description.strip() if description else "",
                                            "url": job_url,
                                            "apply_url": job_url,
                                            "scraped_at": datetime.now().isoformat(),
                                            "source_site": site_name
                                        }
                            jobs.append(job)
                            logger.info(f"Extracted job: {job['title'][:50]} at {job['company']}")
                            page_jobs += 1
                        except Exception as e:
                            logger.warning(f"Error scraping job card {i+1} on page {page_num}: {e}")
                            continue
                    logger.info(f"Extracted {page_jobs} jobs from page {page_num}")
                    page_num += 1
        logger.info(f"Scraped {len(jobs)} total jobs from {site_name}")
        return jobs
            except Exception as e:
                logger.error(f"Error scraping {site_name}: {e}")
        return jobs

    async def get_job_details_efficient(self, job_url: str, job_title: str = "", browser=None) -> Optional[Dict[str, Any]]:
        """Extract detailed job information efficiently using existing browser instance with enhanced Apploi support"""
        if not browser:
            logger.warning("No browser instance provided, falling back to original method")
            return await self.get_job_details_from_url(job_url, job_title)
            
        try:
            # Create a new page in the existing browser context
            page = await browser.new_page()
            
            # Set user agent to avoid detection
            await page.set_extra_http_headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            })
            
            try:
                # Add timeout for page navigation
                await page.goto(job_url, timeout=30000, wait_until='domcontentloaded')
                await page.wait_for_timeout(2000)  # Wait for dynamic content
                
                # Wait for key Apploi selectors
                try:
                    await page.wait_for_selector('[class*="JobName-"]', timeout=10000)
                except:
                    # If key selector doesn't appear, try to continue anyway
                    pass
                
                # Initialize job details
                job_details = {
                    "title": job_title,
                    "company": "",
                    "location": "",
                    "city": "",
                    "state": "",
                    "date_posted": "",
                    "salary": "",
                    "description": "",
                    "url": job_url,
                    "apply_url": job_url,
                    "scraped_at": datetime.now().isoformat(),
                    "source_site": ""
                }
                
                # Enhanced Apploi extraction using single page evaluation
                page_data = await page.evaluate("""
                    () => {
                        const data = {};
                        
                        // Title - comprehensive Apploi selectors
                        const titleSelectors = [
                            '[class*="JobName-"]', '[class*="JobTitle-"]', 'h1', 'h2',
                            '.job-title', '.position-title', '.title',
                            '[data-job-title]', '.job-name', '.position-name',
                            '.job-header h1', '.job-header h2', '.job-details h1',
                            '.position-header h1', '.job-info h1', '.job-info h2'
                        ];
                        
                        for (const selector of titleSelectors) {
                            const elem = document.querySelector(selector);
                            if (elem && elem.innerText.trim() && 
                                !elem.innerText.trim().toLowerCase().includes('apply now') &&
                                !elem.innerText.trim().toLowerCase().includes('apply')) {
                                data.title = elem.innerText.trim();
                                break;
                            }
                        }
                        
                        // Company - comprehensive Apploi selectors
                        const companySelectors = [
                            '[class*="BrandName-"]', '[class*="Company-"]', '.company',
                            '.employer', '.company-name', '.organization',
                            '[data-company]', '.job-company', '.employer-name',
                            '.job-header .company', '.job-info .company', '.job-details .company',
                            '.position-company', '.job-organization', '.employer-info'
                        ];
                        
                        for (const selector of companySelectors) {
                            const elem = document.querySelector(selector);
                            if (elem && elem.innerText.trim()) {
                                data.company = elem.innerText.trim();
                                break;
                            }
                        }
                        
                        // Location - comprehensive Apploi selectors
                        const locationSelectors = [
                            '[class*="MapLocationText-"]', '[class*="Location-"]', '.location',
                            '.job-location', '.position-location', '[data-location]',
                            '.job-city', '.job-state', '.job-header .location',
                            '.job-info .location', '.job-details .location',
                            '.position-location', '.job-address', '.location-info'
                        ];
                        
                        for (const selector of locationSelectors) {
                            const elem = document.querySelector(selector);
                            if (elem && elem.innerText.trim()) {
                                data.location = elem.innerText.trim();
                                break;
                            }
                        }
                        
                        // Description - comprehensive Apploi selectors
                        const descSelectors = [
                            '[class*="DangerousDiv-"]', '[class*="SummaryContainer-"]',
                            '.description', '.job-description', '.position-description',
                            '.job-details', '.position-details', '.job-summary',
                            '.job-content', '.position-content', '.job-body',
                            '.description-content', '.job-full-description',
                            '.job-requirements', '.job-responsibilities', '.job-duties'
                        ];
                        
                        for (const selector of descSelectors) {
                            const elem = document.querySelector(selector);
                            if (elem && elem.innerText.trim() && elem.innerText.trim().length > 50) {
                                data.description = elem.innerText.trim();
                                break;
                            }
                        }
                        
                        // Salary - enhanced extraction with multiple methods
                        let salary = '';
                        
                        // Method 1: Find h3 with "Compensation" text
                        const h3Elements = document.querySelectorAll('h3');
                        let compensationHeader = null;
                        for (const h3 of h3Elements) {
                            if (h3.innerText.toLowerCase().includes('compensation') ||
                                h3.innerText.toLowerCase().includes('salary') ||
                                h3.innerText.toLowerCase().includes('pay')) {
                                compensationHeader = h3;
                                break;
                            }
                        }
                        
                        if (compensationHeader) {
                            let next = compensationHeader.nextElementSibling;
                            while (next) {
                                if (next.tagName === 'P') {
                                    salary = next.innerText.trim();
                                    break;
                                }
                                next = next.nextElementSibling;
                            }
                        }
                        
                        // Method 2: Try salary-specific selectors
                        if (!salary) {
                            const salarySelectors = [
                                '[class*="Salary"]', '[class*="Compensation"]', '[class*="Pay"]',
                                '.salary', '.compensation', '.pay-rate', '.job-salary',
                                '[data-salary]', '.salary-range', '.pay-range',
                                '.job-header .salary', '.job-info .salary', '.job-details .salary',
                                '.position-salary', '.compensation-info', '.pay-info',
                                '.salary-info', '.benefits', '.compensation-details'
                            ];
                            
                            for (const selector of salarySelectors) {
                                const elem = document.querySelector(selector);
                                if (elem && elem.innerText.trim()) {
                                    salary = elem.innerText.trim();
                                    break;
                                }
                            }
                        }
                        
                        // Method 3: Look for salary patterns in any text
                        if (!salary) {
                            const allElements = document.querySelectorAll('*');
                            for (const elem of allElements) {
                                const text = elem.innerText || elem.textContent || '';
                                if (text && (
                                    text.toLowerCase().includes('$') && 
                                    (text.toLowerCase().includes('hr') || text.toLowerCase().includes('hour') || 
                                     text.toLowerCase().includes('year') || text.toLowerCase().includes('salary') ||
                                     text.toLowerCase().includes('pay') || text.toLowerCase().includes('compensation'))
                                )) {
                                    salary = text.trim();
                                    break;
                                }
                            }
                        }
                        
                        data.salary = salary;
                        
                        // Date posted - try JSON-LD first, then selectors
                        let datePosted = '';
                        
                        // Try JSON-LD schema
                        const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
                        if (jsonLdScript) {
                            try {
                                const jsonData = JSON.parse(jsonLdScript.innerText);
                                if (jsonData && jsonData['@type'] === 'JobPosting' && jsonData.datePosted) {
                                    datePosted = jsonData.datePosted;
                                }
                            } catch (e) {
                                // Ignore JSON parsing errors
                            }
                        }
                        
                        // If no date from JSON-LD, try selectors
                        if (!datePosted) {
                            const dateSelectors = [
                                '.date', '.posted', '.date-posted', '.job-date',
                                '[data-posted-date]', '.created-date', '.job-posted',
                                '.job-header .date', '.job-info .date', '.job-details .date',
                                '.position-date', '.posted-date', '.job-created'
                            ];
                            
                            for (const selector of dateSelectors) {
                                const elem = document.querySelector(selector);
                                if (elem && elem.innerText.trim()) {
                                    datePosted = elem.innerText.trim();
                                    break;
                                }
                            }
                        }
                        
                        data.datePosted = datePosted;
                        
                        // Full page text for fallback extraction
                        data.fullText = document.body.innerText;
                        
                        return data;
                    }
                """)
                
                # Update job details with extracted data
                if page_data.get('title'):
                    job_details["title"] = page_data['title']
                if page_data.get('company'):
                    job_details["company"] = page_data['company']
                if page_data.get('location'):
                    job_details["location"] = page_data['location']
                if page_data.get('description'):
                    job_details["description"] = page_data['description']
                if page_data.get('datePosted'):
                    job_details["date_posted"] = page_data['datePosted']
                
                # Enhanced salary extraction and cleaning
                salary_extracted = False
                if page_data.get('salary'):
                    cleaned_salary = self.clean_salary_text(page_data['salary'])
                    if cleaned_salary:
                        job_details["salary"] = cleaned_salary
                        salary_extracted = True
                
                # Fallback salary extraction from full text
                if not salary_extracted and page_data.get('fullText'):
                    salary_info = self.extract_salary_info(page_data['fullText'])
                    if salary_info:
                        job_details["salary"] = salary_info
                
                # Enhanced city/state extraction from location
                if job_details["location"]:
                    city, state = self.extract_city_state_from_location(job_details["location"])
                    if city:
                        job_details["city"] = city
                    if state:
                        job_details["state"] = state
                
                # Fallback description from full text if needed
                if not job_details["description"] and page_data.get('fullText'):
                    job_details["description"] = page_data['fullText'][:2000]  # Limit length
                
                # Filter by date (≤ 60 days)
                if job_details["date_posted"]:
                    try:
                        parsed_date = date_parser.parse(job_details["date_posted"], fuzzy=True)
                        days_ago = (datetime.now() - parsed_date).days
                        if days_ago > 60:
                            logger.info(f"Job {job_details['title']} is {days_ago} days old, skipping")
                            await page.close()
                            return None
                    except Exception as e:
                        logger.warning(f"Could not parse date '{job_details['date_posted']}': {e}")
                        # If can't parse date, keep the job
                
                await page.close()
                return job_details
                
            except Exception as e:
                logger.warning(f"Error extracting job details from {job_url}: {e}")
                await page.close()
                return None
                
        except Exception as e:
            logger.warning(f"Error in get_job_details_efficient for {job_url}: {e}")
            return None

    async def enhance_job_data(self, job_entry: Dict[str, Any], browser=None) -> Dict[str, Any]:
        """Enhance a single job entry with missing information using enhanced Apploi extraction"""
        job_url = job_entry.get("url", "")
        job_title = job_entry.get("title", "")
        
        if not job_url:
            return job_entry
        
        # Only process jobs that need enhancement
        needs_enhancement = (
            not job_title or (job_title and job_title.strip() == "") or
            not job_entry.get("company") or (job_entry.get("company") and job_entry.get("company").strip() == "") or
            not job_entry.get("location") or (job_entry.get("location") and job_entry.get("location").strip() == "") or
            not job_entry.get("description") or (job_entry.get("description") and job_entry.get("description").strip() == "")
        )
        
        if not needs_enhancement:
            return job_entry
        
        # Extract job details using enhanced method
        job_details = await self.get_job_details_efficient(job_url, job_title, browser)
        
        # Merge data if we got new information
        if job_details:
            for key, value in job_details.items():
                if key == "title" and (not job_entry.get(key) or (job_entry.get(key) and job_entry.get(key).strip() == "")):
                    job_entry[key] = value
                elif key in job_entry and (not job_entry.get(key) or (job_entry.get(key) and job_entry.get(key).strip() == "")):
                    job_entry[key] = value
                elif key not in job_entry:
                    job_entry[key] = value
        
        return job_entry

    async def enhance_job_batch(self, jobs: List[Dict[str, Any]], browser=None) -> List[Dict[str, Any]]:
        """Enhance a batch of job entries with missing information"""
        enhanced_jobs = []
        
        for i, job in enumerate(jobs):
            logger.info(f"Enhancing job {i+1}/{len(jobs)}: {job.get('url', 'unknown')[:50]}...")
            
            try:
                # Add timeout to prevent hanging
                enhanced_job = await asyncio.wait_for(
                    self.enhance_job_data(job, browser),
                    timeout=30.0  # 30 second timeout per job
                )
                enhanced_jobs.append(enhanced_job)
                logger.info(f"Successfully enhanced job {i+1}")
                
            except asyncio.TimeoutError:
                logger.warning(f"Timeout enhancing job {i+1}, keeping original data")
                enhanced_jobs.append(job)  # Keep original job
            except Exception as e:
                logger.warning(f"Error enhancing job {i+1}: {e}")
                enhanced_jobs.append(job)  # Keep original job
            
            # Small delay to avoid overwhelming the server
            await asyncio.sleep(1)
        
        return enhanced_jobs

    async def get_job_details_from_url(self, job_url: str, job_title: str = "") -> Optional[Dict[str, Any]]:
        """Extract detailed job information from a job detail page using Crawl4AI"""
        try:
            # Create a new page for this job
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                
                # Set user agent to avoid detection
                await page.set_extra_http_headers({
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                })
                
                try:
                    # Add timeout for page navigation
                    await page.goto(job_url, timeout=15000)  # Reduced timeout
                    await page.wait_for_timeout(2000)  # Reduced wait time
                    
                    # Get page content for manual extraction
                    page_content = await page.content()
                    
                    # Try Crawl4AI first for structured extraction (with shorter timeout)
                    try:
                        extraction_strategy = LLMExtractionStrategy(
                            extraction_prompt=f"""
                            You are a job data extraction expert. Extract detailed job information from this job posting page.
                            
                            Current job title: {job_title}
                            
                            Extract ALL available information from the page:
                            1. Job title (look for h1, h2, or prominent text)
                            2. Company name (look for company, employer, organization names)
                            3. Job location (city, state, country)
                            4. Salary information (hourly rates, annual salaries, bonuses, benefits)
                            5. Full job description (all text describing the role)
                            6. Posted date (when the job was posted)
                            7. Application URL or instructions
                            
                            IMPORTANT: Be thorough and extract as much information as possible.
                            Look for salary information in various formats: hourly rates, annual salaries, ranges, bonuses, etc.
                            Extract the complete job description, not just a summary.
                            
                            Return a JSON object with the extracted data:
                            {{
                                "title": "exact job title",
                                "company": "company name",
                                "location": "full location string",
                                "city": "city name",
                                "state": "state abbreviation",
                                "salary": "complete salary information",
                                "description": "full job description",
                                "date_posted": "posted date",
                                "apply_url": "application URL"
                            }}
                            
                            If any information is not available, use empty string "" for that field.
                            Do not use null values.
                            """,
                            extraction_schema={
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string"},
                                    "company": {"type": "string"},
                                    "location": {"type": "string"},
                                    "city": {"type": "string"},
                                    "state": {"type": "string"},
                                    "salary": {"type": "string"},
                                    "description": {"type": "string"},
                                    "date_posted": {"type": "string"},
                                    "apply_url": {"type": "string"}
                                }
                            }
                        )
                        
                        # Use timeout for Crawl4AI extraction
                        result = await asyncio.wait_for(
                            self.crawler.arun(
                                url=job_url,
                                extraction_strategy=extraction_strategy
                            ),
                            timeout=20  # 20 second timeout for Crawl4AI
                        )
                        
                        if result.extracted_content:
                            try:
                                job_details = json.loads(result.extracted_content)
                                logger.info(f"Crawl4AI extracted job data: {job_details.get('title', 'Unknown')}")
                                
                                # Validate that we got meaningful data
                                if job_details.get('title') and job_details.get('title').strip():
                                    # Add metadata
                                    job_details["url"] = job_url
                                    job_details["scraped_at"] = datetime.now().isoformat()
                                    job_details["source_site"] = ""
                                    
                                    # Filter by date (≤ 60 days)
                                    if job_details.get("date_posted"):
                                        try:
                                            parsed_date = date_parser.parse(job_details["date_posted"], fuzzy=True)
                                            days_ago = (datetime.now() - parsed_date).days
                                            if days_ago > 60:
                                                logger.info(f"Job {job_details['title']} is {days_ago} days old, skipping")
                                                await page.close()
                                                await browser.close()
                                                return None
                                        except Exception as e:
                                            logger.warning(f"Could not parse date '{job_details['date_posted']}': {e}")
                                    
                                    await page.close()
                                    await browser.close()
                                    return job_details
                                else:
                                    logger.warning(f"Crawl4AI returned empty title for {job_url}, falling back to manual extraction")
                            except json.JSONDecodeError as e:
                                logger.warning(f"Failed to parse Crawl4AI JSON response: {e}")
                                logger.warning(f"Raw response: {result.extracted_content}")
                        else:
                            logger.warning(f"Crawl4AI returned no content for {job_url}")
                            
                    except asyncio.TimeoutError:
                        logger.warning(f"Crawl4AI extraction timeout for {job_url}, falling back to manual extraction")
                    except Exception as e:
                        logger.warning(f"Crawl4AI extraction failed for {job_url}: {e}")
                        # Fall back to manual extraction
                    
                    # Manual extraction fallback with improved selectors for Apploi-style pages
                    job_details = {
                        "title": job_title,
                        "company": "",
                        "location": "",
                        "city": "",
                        "state": "",
                        "date_posted": "",
                        "salary": "",
                        "description": "",
                        "url": job_url,
                        "apply_url": job_url,
                        "scraped_at": datetime.now().isoformat(),
                        "source_site": ""
                    }
                    
                    # Try to extract title if not provided - look for specific Apploi selectors
                    if not job_title:
                        title_selectors = [
                            ".JobName-dmjwia-1", ".JobTitle-sc-4gzzc3-12", "h1", "h2", 
                            ".job-title", ".position-title", ".title",
                            "[data-job-title]", ".job-name", ".position-name",
                            ".job-header h1", ".job-header h2", ".job-details h1",
                            ".position-header h1", ".job-info h1", ".job-info h2"
                        ]
                        for selector in title_selectors:
                            try:
                                title_elem = await page.query_selector(selector)
                                if title_elem:
                                    title_text = await title_elem.inner_text()
                                    if title_text.strip() and title_text.strip().lower() not in ['apply now', 'apply', 'job description summary']:
                                        job_details["title"] = title_text.strip()
                                        break
                            except:
                                continue
                    
                    # Extract company name with Apploi-specific selectors
                    company_selectors = [
                        ".BrandName-dmjwia-2", ".JobTitle-sc-4gzzc3-12", ".company", 
                        ".employer", ".company-name", ".organization",
                        "[data-company]", ".job-company", ".employer-name",
                        ".job-header .company", ".job-info .company", ".job-details .company",
                        ".position-company", ".job-organization", ".employer-info"
                    ]
                    for selector in company_selectors:
                        try:
                            company_elem = await page.query_selector(selector)
                            if company_elem:
                                company_text = await company_elem.inner_text()
                                if company_text.strip():
                                    job_details["company"] = company_text.strip()
                                    break
                        except:
                            continue
                    
                    # Extract location with Apploi-specific selectors
                    location_selectors = [
                        ".MapLocationText-sc-1tguxea-1", ".location", ".job-location", 
                        ".position-location", "[data-location]", ".job-city", ".job-state",
                        ".job-header .location", ".job-info .location", ".job-details .location",
                        ".position-location", ".job-address", ".location-info"
                    ]
                    for selector in location_selectors:
                        try:
                            location_elem = await page.query_selector(selector)
                            if location_elem:
                                location_text = await location_elem.inner_text()
                                if location_text.strip():
                                    job_details["location"] = location_text.strip()
                                    break
                        except:
                            continue
                    
                    # Extract salary with comprehensive selectors including Apploi patterns
                    salary_selectors = [
                        ".salary", ".pay", ".compensation", ".job-salary",
                        "[data-salary]", ".salary-range", ".pay-range",
                        ".job-header .salary", ".job-info .salary", ".job-details .salary",
                        ".position-salary", ".compensation-info", ".pay-info",
                        ".salary-info", ".benefits", ".compensation-details"
                    ]
                    for selector in salary_selectors:
                        try:
                            salary_elem = await page.query_selector(selector)
                            if salary_elem:
                                salary_text = await salary_elem.inner_text()
                                if salary_text.strip():
                                    job_details["salary"] = salary_text.strip()
                                    break
                        except:
                            continue
                    
                    # Extract description with Apploi-specific selectors
                    description_selectors = [
                        ".DangerousDiv-sc-1wpt4zn-2", ".description", ".job-description", 
                        ".position-description", ".job-details", ".position-details", 
                        ".job-summary", ".job-content", ".position-content", ".job-body",
                        ".description-content", ".job-full-description",
                        ".job-requirements", ".job-responsibilities", ".job-duties"
                    ]
                    for selector in description_selectors:
                        try:
                            desc_elem = await page.query_selector(selector)
                            if desc_elem:
                                desc_text = await desc_elem.inner_text()
                                if desc_text.strip() and len(desc_text.strip()) > 50:  # Ensure meaningful content
                                    job_details["description"] = desc_text.strip()
                                    break
                        except:
                            continue
                    
                    # Extract date posted - try to get from JSON-LD schema first
                    date_selectors = [
                        ".date", ".posted", ".date-posted", ".job-date",
                        "[data-posted-date]", ".created-date", ".job-posted",
                        ".job-header .date", ".job-info .date", ".job-details .date",
                        ".position-date", ".posted-date", ".job-created"
                    ]
                    
                    # First try to extract from JSON-LD schema (common in job sites)
                    try:
                        json_ld_script = await page.query_selector('script[type="application/ld+json"]')
                        if json_ld_script:
                            json_content = await json_ld_script.inner_text()
                            try:
                                json_data = json.loads(json_content)
                                if isinstance(json_data, dict) and json_data.get('@type') == 'JobPosting':
                                    if json_data.get('datePosted'):
                                        job_details["date_posted"] = json_data["datePosted"]
                            except:
                                pass
                    except:
                        pass
                    
                    # If no date from JSON-LD, try regular selectors
                    if not job_details["date_posted"]:
                        for selector in date_selectors:
                            try:
                                date_elem = await page.query_selector(selector)
                                if date_elem:
                                    date_text = await date_elem.inner_text()
                                    if date_text.strip():
                                        job_details["date_posted"] = date_text.strip()
                                        break
                            except:
                                continue
                    
                    # Parse location to extract city and state
                    if job_details["location"]:
                        location_parts = job_details["location"].split(",")
                        if len(location_parts) >= 2:
                            job_details["city"] = location_parts[0].strip()
                            job_details["state"] = location_parts[1].strip()
                    
                    # Filter by date (≤ 60 days)
                    if job_details["date_posted"]:
                        try:
                            parsed_date = date_parser.parse(job_details["date_posted"], fuzzy=True)
                            days_ago = (datetime.now() - parsed_date).days
                            if days_ago > 60:
                                logger.info(f"Job {job_details['title']} is {days_ago} days old, skipping")
                                await page.close()
                                await browser.close()
                                return None
                        except Exception as e:
                            logger.warning(f"Could not parse date '{job_details['date_posted']}': {e}")
                            # If can't parse date, keep the job
                    
                    await page.close()
                    await browser.close()
                    
                    return job_details
                    
                except Exception as e:
                    logger.warning(f"Error extracting job details from {job_url}: {e}")
                    await page.close()
                    await browser.close()
                    return None
                    
        except Exception as e:
            logger.warning(f"Error in get_job_details_from_url for {job_url}: {e}")
            return None

    async def test_crawl4ai_extraction(self, job_url: str):
        """Test Crawl4AI extraction on a single job URL for debugging"""
        try:
            extraction_strategy = LLMExtractionStrategy(
                extraction_prompt="""
                You are a job data extraction expert. Extract detailed job information from this job posting page.
                
                Extract ALL available information from the page:
                1. Job title (look for h1, h2, or prominent text)
                2. Company name (look for company, employer, organization names)
                3. Job location (city, state, country)
                4. Salary information (hourly rates, annual salaries, bonuses, benefits)
                5. Full job description (all text describing the role)
                6. Posted date (when the job was posted)
                7. Application URL or instructions
                
                IMPORTANT: Be thorough and extract as much information as possible.
                Look for salary information in various formats: hourly rates, annual salaries, ranges, bonuses, etc.
                Extract the complete job description, not just a summary.
                
                Return a JSON object with the extracted data:
                {
                    "title": "exact job title",
                    "company": "company name",
                    "location": "full location string",
                    "city": "city name",
                    "state": "state abbreviation",
                    "salary": "complete salary information",
                    "description": "full job description",
                    "date_posted": "posted date",
                    "apply_url": "application URL"
                }
                
                If any information is not available, use empty string "" for that field.
                Do not use null values.
                """,
                extraction_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "company": {"type": "string"},
                        "location": {"type": "string"},
                        "city": {"type": "string"},
                        "state": {"type": "string"},
                        "salary": {"type": "string"},
                        "description": {"type": "string"},
                        "date_posted": {"type": "string"},
                        "apply_url": {"type": "string"}
                    }
                }
            )
            
            print(f"Testing Crawl4AI extraction on: {job_url}")
            result = await self.crawler.arun(
                url=job_url,
                extraction_strategy=extraction_strategy
            )
            
            print(f"Crawl4AI Result Type: {type(result)}")
            print(f"Crawl4AI Result Attributes: {dir(result)}")
            print(f"Crawl4AI Extracted Content: {result.extracted_content}")
            
            if result.extracted_content:
                try:
                    job_data = json.loads(result.extracted_content)
                    print(f"Parsed JSON: {json.dumps(job_data, indent=2)}")
                    return job_data
                except json.JSONDecodeError as e:
                    print(f"JSON Parse Error: {e}")
                    print(f"Raw content: {result.extracted_content}")
                    return None
            else:
                print("No extracted content returned")
                return None
                
        except Exception as e:
            print(f"Crawl4AI Test Error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def run(self):
        logger.info(f"Starting enhanced deep scrape for {len(self.sites)} sites")
        all_jobs = []
        
        for i, site in enumerate(self.sites, 1):
            logger.info(f"Processing site {i}/{len(self.sites)}: {site['source_site']}")
            try:
                jobs = asyncio.run(self.deep_scrape_site(site, self.pages_per_site))
                all_jobs.extend(jobs)
                logger.info(f"Completed {site['source_site']}: {len(jobs)} jobs (Total: {len(all_jobs)} jobs)")
                
                # Save individual site results to its own file
                if jobs:
                    self.save_results(site_name=site['source_site'], jobs=jobs)
                
                # Save cumulative results to overall file
                self.results = all_jobs
                self.save_results()
                logger.info(f"Saved site results and cumulative progress after site {i}: {len(all_jobs)} total jobs")
                
                # Add delay between sites to avoid rate limiting
                time.sleep(random.randint(3, 8))
                    
            except Exception as e:
                logger.error(f"Error processing site {site['source_site']}: {e}")
                # Still save cumulative progress even if a site fails
                self.results = all_jobs
                self.save_results()
                logger.info(f"Saved cumulative progress after failed site {i}: {len(all_jobs)} total jobs")
                continue
        
        logger.info(f"Total jobs collected: {len(all_jobs)}")
        logger.info("Enhanced deep scrape complete!")

    async def enhance_existing_json_file(self, json_file_path: str, max_jobs: int = 0) -> None:
        """Enhance an existing JSON file with improved Apploi extraction"""
        try:
            # Load existing data
            with open(json_file_path, 'r', encoding='utf-8') as f:
                existing_jobs = json.load(f)
            
            logger.info(f"Loaded {len(existing_jobs)} jobs from {json_file_path}")
            
            # Limit jobs if specified
            if max_jobs > 0:
                existing_jobs = existing_jobs[:max_jobs]
                logger.info(f"Processing first {len(existing_jobs)} jobs")
            
            # Initialize browser
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                
                try:
                    # Enhance jobs in batches
                    enhanced_jobs = await self.enhance_job_batch(existing_jobs, browser)
                    
                    # Save enhanced results
                    output_file = json_file_path.replace('.json', '_enhanced.json')
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(enhanced_jobs, f, indent=2, ensure_ascii=False)
                    
                    logger.info(f"Enhanced {len(enhanced_jobs)} jobs saved to {output_file}")
                    
                    # Print statistics
                    jobs_with_title = sum(1 for job in enhanced_jobs if job.get('title') and job.get('title').strip())
                    jobs_with_company = sum(1 for job in enhanced_jobs if job.get('company') and job.get('company').strip())
                    jobs_with_location = sum(1 for job in enhanced_jobs if job.get('location') and job.get('location').strip())
                    jobs_with_description = sum(1 for job in enhanced_jobs if job.get('description') and job.get('description').strip())
                    jobs_with_salary = sum(1 for job in enhanced_jobs if job.get('salary') and job.get('salary').strip())
                    
                    logger.info(f"Enhancement Statistics:")
                    logger.info(f"  Jobs with title: {jobs_with_title}/{len(enhanced_jobs)}")
                    logger.info(f"  Jobs with company: {jobs_with_company}/{len(enhanced_jobs)}")
                    logger.info(f"  Jobs with location: {jobs_with_location}/{len(enhanced_jobs)}")
                    logger.info(f"  Jobs with description: {jobs_with_description}/{len(enhanced_jobs)}")
                    logger.info(f"  Jobs with salary: {jobs_with_salary}/{len(enhanced_jobs)}")
                    
                finally:
                    await browser.close()
                    
        except Exception as e:
            logger.error(f"Error enhancing {json_file_path}: {e}")

    def save_results(self, site_name: str = "", jobs: Optional[List[Dict[str, Any]]] = None):
        """Save results to files - can save individual site results or all results"""
        # Generate timestamp for unique filenames
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Use provided jobs or fall back to self.results
        jobs_to_save = jobs if jobs is not None else self.results
        
        if not jobs_to_save:
            logger.warning("No jobs to save")
            return
        
        # Create site-specific filename if site_name is provided
        if site_name:
            # Clean site name for filename
            safe_site_name = re.sub(r'[^\w\-_\.]', '_', site_name)
            json_filename = f"site_{safe_site_name}_{timestamp}.json"
            csv_filename = f"site_{safe_site_name}_{timestamp}.csv"
        else:
            # Save all results
            json_filename = f"enhanced_multi_deep_results_{timestamp}.json"
            csv_filename = f"enhanced_multi_deep_results_{timestamp}.csv"
        
        # Save to JSON
        with open(json_filename, "w", encoding="utf-8") as f:
            json.dump(jobs_to_save, f, indent=2, ensure_ascii=False)
        
        # Save to CSV (flatten fields)
        keys = set()
        for job in jobs_to_save:
            keys.update(job.keys())
        
        with open(csv_filename, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=list(keys))
            writer.writeheader()
            writer.writerows(jobs_to_save)
        
        # Also save to latest files for easy access
        if site_name:
            # Save site-specific latest files
            safe_site_name = re.sub(r'[^\w\-_\.]', '_', site_name)
            latest_json = f"site_{safe_site_name}_latest.json"
            latest_csv = f"site_{safe_site_name}_latest.csv"
            
            with open(latest_json, "w", encoding="utf-8") as f:
                json.dump(jobs_to_save, f, indent=2, ensure_ascii=False)
            
            with open(latest_csv, "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=list(keys))
                writer.writeheader()
                writer.writerows(jobs_to_save)
        else:
            # Save overall latest files
            with open("enhanced_multi_deep_results_latest.json", "w", encoding="utf-8") as f:
                json.dump(jobs_to_save, f, indent=2, ensure_ascii=False)
            
            with open("enhanced_multi_deep_results_latest.csv", "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=list(keys))
                writer.writeheader()
                writer.writerows(jobs_to_save)
        
        if site_name:
            logger.info(f"Site results saved to {json_filename}, {csv_filename}, and site_{safe_site_name}_latest.* files")
        else:
            logger.info(f"All results saved to {json_filename}, {csv_filename}, and latest files")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enhanced Multi-Site Deep Scraper with Crawl4AI")
    parser.add_argument("--max-sites", type=int, default=0, help="Maximum number of sites to scrape (0 = all sites)")
    parser.add_argument("--pages-per-site", type=int, default=3, help="Maximum pages to scrape per site")
    parser.add_argument("--max-jobs-per-page", type=int, default=50, help="Maximum jobs to process per page (prevents freezing)")
    parser.add_argument("--csv-path", type=str, default="multi.csv", help="Path to CSV file with site URLs")
    
    args = parser.parse_args()
    
    scraper = EnhancedMultiSiteDeepScraper(
        csv_path=args.csv_path,
        max_sites=args.max_sites,
        pages_per_site=args.pages_per_site,
        max_jobs_per_page=args.max_jobs_per_page
    )
    scraper.run() 