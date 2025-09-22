#!/usr/bin/env python3
"""
Enhanced Crawl4AI Healthcare Job Scraper
========================================

Advanced healthcare job scraper with:
- Pagination handling for all pages
- Site-specific crawling strategies
- Deep crawling for job details
- Rate limiting and retry logic
- Comprehensive data extraction
- Multi-platform support
"""

import asyncio
import csv
import json
import logging
import re
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
from urllib.parse import urljoin, urlparse, parse_qs
from collections import Counter
import hashlib
import aiohttp
from dataclasses import dataclass, asdict
from pathlib import Path
import random
import ssl
import certifi
from bs4 import BeautifulSoup
from bs4 import NavigableString

# Crawl4AI imports
from crawl4ai import AsyncWebCrawler, LLMConfig
from crawl4ai.extraction_strategy import LLMExtractionStrategy, JsonCssExtractionStrategy
from crawl4ai.chunking_strategy import SlidingWindowChunking

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class JobData:
    """Enhanced job data model with more comprehensive fields"""
    id: str
    title: str
    company: str
    location: str
    city: str
    state: str
    zip_code: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_type: Optional[str] = None
    job_type: Optional[str] = None
    description: str = ""
    requirements: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    platform: str = ""
    url: str = ""
    job_url: str = ""  # Direct link to job posting
    scraped_at: str = ""
    category: str = ""
    seniority: str = ""
    experience_level: str = ""
    education_level: str = ""
    certifications: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    shift_type: str = ""
    is_remote: bool = False
    is_travel: bool = False
    data_quality_score: float = 0.0
    department: str = ""
    facility_type: str = ""
    license_required: bool = False
    license_type: str = ""
    years_experience: Optional[int] = None
    application_deadline: str = ""
    posted_date: str = ""
    contact_info: str = ""
    
    def __post_init__(self):
        if self.requirements is None:
            self.requirements = []
        if self.benefits is None:
            self.benefits = []
        if self.certifications is None:
            self.certifications = []
        if self.skills is None:
            self.skills = []

class EnhancedCrawl4AIHealthcareScraper:
    """Enhanced healthcare job scraper with pagination and deep crawling"""
    
    def __init__(self, api_key: Optional[str] = None, max_concurrent: int = 3):
        self.api_key = api_key
        self.max_concurrent = max_concurrent
        self.jobs: List[JobData] = []
        self.scraping_stats = {
            'sites_processed': 0,
            'sites_successful': 0,
            'sites_failed': 0,
            'total_jobs_found': 0,
            'pages_scraped': 0,
            'start_time': None,
            'current_site': None,
            'errors': []
        }
        
        # Rate limiting and anti-bot measures
        self.rate_limiter = asyncio.Semaphore(max_concurrent)
        self.delay_between_requests = 3.0  # Increased delay
        self.max_retries = 3
        self.session_timeout = 30
        
        # Anti-bot headers and user agents
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ]
        
        self.default_headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        }
        
        # Initialize Crawl4AI crawler with enhanced configuration
        if api_key:
            llm_config = LLMConfig(
                provider="openai/gpt-4o-mini",
                api_token=api_key
            )
            
            self.crawler = AsyncWebCrawler(
                extraction_strategy=LLMExtractionStrategy(
                    llm_config=llm_config,
                    instruction=self._get_extraction_prompt()
                ),
                chunking_strategy=SlidingWindowChunking(
                    chunk_size=4000,
                    chunk_overlap=200
                )
            )
        else:
            self.crawler = None
        
        # Site-specific strategies
        self.site_strategies = self._load_site_strategies()
        
        # Load site configurations
        self.site_configs = self._load_site_configs()
        
        # Enhanced platform configurations for better extraction
        self.platform_configs = self._load_platform_configs()
        
    def _load_site_strategies(self) -> Dict[str, Dict]:
        """Load site-specific crawling strategies"""
        return {
            'mycnajobs': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/job/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'indeed': {
                'pagination_pattern': r'start=(\d+)',
                'next_page_pattern': r'data-testid="pagination-page-next"',
                'job_links_pattern': r'href="(/jobs/view/[^"]+)"',
                'max_pages': 50,
                'delay': 3.0
            },
            'linkedin': {
                'pagination_pattern': r'start=(\d+)',
                'next_page_pattern': r'aria-label="Next"',
                'job_links_pattern': r'href="(/jobs/view/[^"]+)"',
                'max_pages': 50,
                'delay': 4.0
            },
            'glassdoor': {
                'pagination_pattern': r'p\.(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/Job/[^"]+)"',
                'max_pages': 50,
                'delay': 3.0
            },
            'ziprecruiter': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/job/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'careerbuilder': {
                'pagination_pattern': r'page_number=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/job/[^"]+)"',
                'max_pages': 50,
                'delay': 3.0
            },
            'icims': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'adp': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'workday': {
                'pagination_pattern': r'start=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 3.0
            },
            'ultipro': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'smartrecruiters': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 3.0
            },
            'dayforce': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'hireology': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'paycom': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'jobvite': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'onshift': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'intelycare': {
                'pagination_pattern': r'listing_page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'governmentjobs': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'paylocity': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'apploi': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'brightstarcare': {
                'pagination_pattern': r'spage=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'homeinstead': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'oracle': {
                'pagination_pattern': r'start=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 3.0
            },
            'ascension': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'aveanna': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'synergyhomecare': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'brookdale': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'sunriseseniorliving': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'artis': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'healthcaresource': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'atria': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'monarch': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'senior-living-communities': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'maplewood': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'duncaster': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'alliance': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'banecare': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'alwaysbestcare': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'centerwell': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'lhcgroup': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'ehab': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'amedisys': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'rightathome': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'bristolhealth': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'allwayscaring': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'trinity': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'charter': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'elara': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'brightviewseniorliving': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'aaronmanor': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'accentcare': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'seniorlifestyle': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'pathwell': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'encompass': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'aspenhill': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'southcoast': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'sca': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'healogics': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'hebrewseniorlife': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'associatedhomecare': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'honorhealthnetwork': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'fivestarnusing': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.5
            },
            'bondhealthstaffing': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'mjhs': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'tandymgroup': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'jewishhome': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'allendale': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'sapphirerehab': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'laconianursinghome': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'compassionhomellc': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'hometownnannies': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'endurancehomecare': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/jobs/[^"]+)"',
                'max_pages': 50,
                'delay': 2.0
            },
            'default': {
                'pagination_pattern': r'page=(\d+)',
                'next_page_pattern': r'next.*?page',
                'job_links_pattern': r'href="(/[^"]*job[^"]*)"',
                'next_button': '.next, .pagination-next, .load-more, .show-more, [aria-label="Next"], .btn-next, .next-page',
                'max_pages': 50,
                'delay': 2.0
            }
        }
    
    def _load_platform_configs(self) -> Dict[str, Dict]:
        """Load enhanced platform-specific configurations for better extraction"""
        return {
            'icims': {
                'job_container': '.iCIMS_JobsTable tr, .jobs-list-item, .job-item, .row, .job-result, [class*="job"]',
                'job_title': '.iCIMS_InfoField_Job, .job-title, h3 a, .title a, td a, .job-name, [class*="title"]',
                'job_location': '.iCIMS_InfoField_Location, .job-location, .location, .job-city, [class*="location"]',
                'job_salary': '.salary, .compensation, .pay, .rate, [class*="salary"], [class*="pay"]',
                'job_type': '.job-type, .employment-type, .schedule, .shift, [class*="type"]',
                'job_description': '.job-description, .description, .summary, .details',
                'next_button': '.iCIMS_Paginator_Next, .pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.iCIMS_Paginator_Summary, .pagination-info',
                'max_pages': 50,
                'delay': 2.5
            },
            'adp': {
                'job_container': '.job-result, .job-item, [data-automation-id="jobPostingItem"], .position-card',
                'job_title': '.job-title, [data-automation-id="jobPostingTitle"] a, .position-title a',
                'job_location': '.job-location, [data-automation-id="jobPostingLocation"], .location',
                'job_salary': '.salary, .compensation, .pay, [data-automation-id*="salary"]',
                'job_type': '.job-type, .employment-type, .schedule, [data-automation-id*="type"]',
                'job_description': '.job-description, .description, .summary',
                'next_button': '[aria-label="Next"], .paging-next, .pagination-next, .next-page',
                'pagination_info': '.paging-info, .pagination-summary',
                'max_pages': 50,
                'delay': 2.0
            },
            'workday': {
                'job_container': '[data-automation-id="jobPostingItem"], .job-posting, .position',
                'job_title': '[data-automation-id="jobPostingTitle"] a, .job-title a, .position-title',
                'job_location': '[data-automation-id="jobPostingLocation"], .job-location, .location',
                'job_salary': '[data-automation-id*="salary"], .salary, .compensation',
                'job_type': '[data-automation-id*="type"], .job-type, .employment-type',
                'job_description': '[data-automation-id*="description"], .job-description',
                'next_button': '[data-automation-id="paginationNext"], .pagination-next',
                'pagination_info': '[data-automation-id="paginationSummary"]',
                'max_pages': 50,
                'delay': 3.0
            },
            'ultipro': {
                'job_container': '.job-item, .job-posting, .position, .opportunity',
                'job_title': '.job-title a, .position-title a, h3 a, .opportunity-title',
                'job_location': '.job-location, .location, .job-info .location, .opportunity-location',
                'job_salary': '.salary, .compensation, .pay, .rate',
                'job_type': '.job-type, .employment-type, .schedule, .shift',
                'job_description': '.job-description, .description, .summary',
                'next_button': '.pagination-next, [aria-label="Next"], .next-page',
                'pagination_info': '.pagination-info',
                'max_pages': 50,
                'delay': 2.5
            },
            'smartrecruiters': {
                'job_container': '.opening-job, .job-item, .position, .job-link',
                'job_title': '.job-title a, .opening-job-title a, .position-title',
                'job_location': '.job-location, .opening-job-location, .location',
                'job_salary': '.salary, .pay, .rate, .compensation',
                'job_type': '.job-type, .shift, .schedule, .employment-type',
                'job_description': '.job-description, .description, .summary',
                'next_button': '.pagination-next, [aria-label="Next"], .load-more',
                'pagination_info': '.pagination-widget',
                'max_pages': 50,
                'delay': 3.0
            },
            'custom': {
                'job_container': '.job, .job-item, .job-listing, .job-card, .position, .career, .opening, .vacancy, .role, .post, .listing, .opportunity, .employment, .job-row, tr',
                'job_title': '.job-title, .position-title, .title, .job-name, .role-title, h1, h2, h3, h4, h5, a[href*="job"], a[href*="career"], a[href*="position"], .career-title',
                'job_location': '.location, .job-location, .position-location, .city, .state, .address, .geo, .job-city, .job-state',
                'job_salary': '.salary, .pay, .rate, .compensation, .wage, .hourly, .annual, [class*="salary"], [class*="pay"]',
                'job_type': '.job-type, .employment-type, .schedule, .shift, .hours, .work-type, [class*="type"], [class*="shift"]',
                'job_description': '.job-description, .description, .summary, .details, .job-details, .content, .text',
                'next_button': '.next, .pagination-next, .load-more, [aria-label="Next"], .page-next, .btn-next, .more-jobs, .next-page, .pager-next',
                'pagination_info': '.pagination, .page-info, .results-info, .pager-info',
                'max_pages': 50,
                'delay': 2.0
            }
        }
    
    def _get_extraction_prompt(self) -> str:
        """Enhanced extraction prompt for comprehensive job data with better pagination detection"""
        return """
        You are an expert healthcare job data extractor. Extract comprehensive job information from healthcare job boards and career pages.
        
        Extract the following information for each job posting:
        
        {
            "jobs": [
                {
                    "title": "Job title (e.g., Registered Nurse, CNA, Caregiver, Physical Therapist)",
                    "company": "Company or facility name",
                    "location": "Full location string (City, State ZIP)",
                    "city": "City name",
                    "state": "State abbreviation (CT, MA, etc.)",
                    "zip_code": "ZIP code if available",
                    "salary_min": "Minimum salary (number only, no $ or commas)",
                    "salary_max": "Maximum salary (number only, no $ or commas)",
                    "salary_type": "hourly/yearly/monthly",
                    "job_type": "full-time/part-time/contract/temporary/per-diem",
                    "description": "Full job description (up to 1000 characters)",
                    "requirements": ["requirement1", "requirement2"],
                    "benefits": ["benefit1", "benefit2"],
                    "shift_type": "day/night/rotating/on-call",
                    "is_remote": true/false,
                    "is_travel": true/false,
                    "experience_level": "entry/mid/senior/executive",
                    "education_level": "high school/associate/bachelor/master/doctorate",
                    "certifications": ["cert1", "cert2"],
                    "skills": ["skill1", "skill2"],
                    "department": "Department name",
                    "facility_type": "hospital/nursing_home/home_care/assisted_living/clinic",
                    "license_required": true/false,
                    "license_type": "RN/LPN/CNA/PT/OT/etc",
                    "years_experience": "Number of years required",
                    "application_deadline": "Deadline if specified",
                    "posted_date": "Date job was posted",
                    "contact_info": "Contact information if available",
                    "job_url": "Direct link to job posting"
                }
            ],
            "pagination": {
                "has_next_page": true/false,
                "next_page_url": "URL for next page if available",
                "total_pages": "Total number of pages if shown"
            }
        }
        
        CRITICAL EXTRACTION GUIDELINES:
        1. Extract EVERY job listing on the page - look for job cards, rows, links, or any job-related content
        2. Focus on healthcare roles: nurses, caregivers, CNA, HHA, LPN, RN, medical assistants, therapists, etc.
        3. Look for job containers: .job, .job-item, .job-listing, .job-card, .position, .career, .opening, tr, etc.
        4. Extract location information carefully - many healthcare jobs are facility-specific
        5. For salary, look for hourly rates (common in healthcare) or annual salaries
        6. Identify shift types (day, night, rotating) which are common in healthcare
        7. Look for healthcare-specific requirements like licenses, certifications
        8. Extract benefits like health insurance, PTO, retirement plans
        9. Skip navigation menus, headers, footers, and non-job content
        10. For multi-location employers, extract location from each job listing
        11. Extract direct job URLs when available
        12. Identify facility types (hospital, nursing home, home care, etc.)
        13. Look for experience requirements and deadlines
        
        PAGINATION DETECTION - BE AGGRESSIVE:
        - Look for ANY pagination indicators: "Next" buttons, "Next Page" links, arrow navigation
        - Check for page numbers in the URL (page=2, p=2, etc.)
        - Look for "Load More" or "Show More" buttons
        - Check for pagination controls at bottom of page
        - Look for page numbers like "Page 1 of 10" or "1-25 of 100 results"
        - If you see ANY pagination controls, set has_next_page to true
        - Common pagination patterns: page=1, p=1, start=25, offset=25, spage=1
        - If current page shows "Page 1 of 10", there are more pages available
        - Look for infinite scroll indicators or "load more" functionality
        - If you see job listings but no obvious pagination, assume there might be more pages
        - CRITICAL: We need to capture EVERY job on the page, not just the first few
        
        JOB DETECTION PATTERNS:
        - Look for repeated job listings, job cards, or job-related content
        - Check for table rows (tr) that might contain job data
        - Look for links containing "job", "career", "position", "opening"
        - Check for elements with job-related classes or IDs
        - If you see multiple similar structures, they're likely job listings
        - Don't stop at the first job - extract ALL jobs visible on the page
        """
    
    def _load_site_configs(self) -> List[Dict]:
        """Load healthcare job site configurations from CSV file"""
        csv_file = "Job Board Data Scrape.csv"
        configs = []
        
        try:
            with open(csv_file, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row.get('source_site') or not row.get('search_url'):
                        continue
                    
                    platform = self._extract_platform_from_url(row['search_url'])
                    strategy = self.site_strategies.get(platform, self.site_strategies['default'])
                    
                    config = {
                        "name": row['source_site'].strip(),
                        "url": row['search_url'].strip(),
                        "platform": platform,
                        "max_pages": strategy['max_pages'],
                        "delay": strategy['delay'],
                        "state": row.get('state', ''),
                        "city": row.get('city', ''),
                        "zip_code": row.get('zip_code', ''),
                        "setting_type": row.get('setting_type', ''),
                        "location_scope": row.get('location_scope', ''),
                        "parse_location": row.get('parse_location?', 'No') == 'Yes',
                        "notes": row.get('notes', '')
                    }
                    configs.append(config)
                    
            logger.info(f"Loaded {len(configs)} site configurations from CSV")
            
        except Exception as e:
            logger.error(f"Error loading CSV file: {str(e)}")
            configs = []
        
        return configs
    
    def _extract_platform_from_url(self, url: str) -> str:
        """Extract platform name from URL"""
        url_lower = url.lower()
        
        # Comprehensive platform detection for all sites
        platforms = {
            # Major job boards
            'indeed.com': 'indeed',
            'linkedin.com': 'linkedin',
            'glassdoor.com': 'glassdoor',
            'ziprecruiter.com': 'ziprecruiter',
            'careerbuilder.com': 'careerbuilder',
            'monster.com': 'monster',
            'simplyhired.com': 'simplyhired',
            'dice.com': 'dice',
            
            # Healthcare specific
            'mycnajobs.com': 'mycnajobs',
            'healthcaresource.com': 'healthcaresource',
            'nursefly.com': 'nursefly',
            'allnurses.com': 'allnurses',
            'nursingjobs.com': 'nursingjobs',
            'nurse.com': 'nurse.com',
            'nursingworld.org': 'americannurses',
            'nursegrid.com': 'nursegrid',
            'nurserecruiter.com': 'nurserecruiter',
            'nursezone.com': 'nursezone',
            'nursetogether.com': 'nursetogether',
            'nursejournal.org': 'nursejournal',
            'nursebuff.com': 'nursebuff',
            
            # ATS platforms
            'apploi.com': 'apploi',
            'icims.com': 'icims',
            'jobvite.com': 'jobvite',
            'adp.com': 'adp',
            'oraclecloud.com': 'oracle',
            'onshift.com': 'onshift',
            'paycomonline.net': 'paycom',
            'dayforcehcm.com': 'dayforce',
            'hireology.com': 'hireology',
            'ultipro.com': 'ultipro',
            'smartrecruiters.com': 'smartrecruiters',
            'jobs.net': 'jobs.net',
            'workdayjobs.com': 'workday',
            'intelycare.com': 'intelycare',
            'governmentjobs.com': 'governmentjobs',
            'paylocity.com': 'paylocity',
            
            # Healthcare organizations
            'trinity-health.org': 'trinity',
            'elara.com': 'elara',
            'brightviewseniorliving.com': 'brightviewseniorliving',
            'accentcare.com': 'accentcare',
            'seniorlifestyle.com': 'seniorlifestyle',
            'encompasshealth.com': 'encompass',
            'southcoast.icims.com': 'southcoast',
            'sca.health': 'sca',
            'healogics.com': 'healogics',
            'hebrewseniorlife.com': 'hebrewseniorlife',
            'ber1002bhcs': 'berkshire',
            
            # Senior living and care
            'brookdale.com': 'brookdale',
            'sunriseseniorliving.com': 'sunriseseniorliving',
            'artis.com': 'artis',
            'atria.com': 'atria',
            'monarch.com': 'monarch',
            'senior-living-communities.com': 'senior-living-communities',
            'maplewood.com': 'maplewood',
            'duncaster.com': 'duncaster',
            
            # Home care
            'alliancehhs.org': 'alliance',
            'banecare.com': 'banecare',
            'alwaysbestcare.com': 'alwaysbestcare',
            'centerwellcareers.com': 'centerwell',
            'lhcgroup.com': 'lhcgroup',
            'ehab.com': 'ehab',
            'amedisys.com': 'amedisys',
            'rightathome.net': 'rightathome',
            'bristolhealth.org': 'bristolhealth',
            'allwayscaring.com': 'allwayscaring',
            'charter.com': 'charter',
            'brightstarcare.com': 'brightstarcare',
            'homeinstead.com': 'homeinstead',
            'ascension.org': 'ascension',
            'aveanna.com': 'aveanna',
            'synergyhomecare.com': 'synergyhomecare',
            
            # Other healthcare
            'carelistings.com': 'carelistings',
            'rydershealth.com': 'rydershealth',
            'newhavennh.com': 'newhavennh',
            'southportnh.com': 'southportnh',
            'torringtonnh.com': 'torringtonnh',
            'waterburynh.com': 'waterburynh',
            'westhavennh.com': 'westhavennh',
            'theatlashcg.com': 'theatlashcg',
            'icarehn.com': 'icarehn',
            'athenahealthcare.com': 'athenahealthcare',
            'genesiscareers.jobs': 'genesiscareers',
            'completecareglendale.com': 'completecareglendale',
            'ccfoxhill.com': 'ccfoxhill',
            'ccgrotonregency.com': 'ccgrotonregency',
            'ccharringtoncourt.com': 'ccharringtoncourt',
            'ccmeriden.com': 'ccmeriden',
            'completecarekhn.com': 'completecarekhn',
            'completecarekhs.com': 'completecarekhs',
            'autumnlakehealthcare.com': 'autumnlakehealthcare',
            'autumnlakebuckshill.com': 'autumnlakebuckshill',
            'autumnlakecromwell.com': 'autumnlakecromwell',
            'autumnlakenewbritain.com': 'autumnlakenewbritain',
            'masonicare.org': 'masonicare',
            'advancednh.com': 'advancednh',
            'amberwoodsof.com': 'amberwoodsof',
            'colonialhr.com': 'colonialhr',
            'ctbaptisthomes.org': 'ctbaptisthomes',
            'gladeviewcares.com': 'gladeviewcares',
            'ynhhs.org': 'ynhhs',
            'epochseniorliving.com': 'epochseniorliving',
            'vnacare.org': 'vnacare',
            'mozaicsl.com': 'mozaicsl',
            'mcleancare.org': 'mcleancare',
            'stamfordvilla.org': 'stamfordvilla',
            'whitneyrehab.com': 'whitneyrehab',
            'meridenrehab.com': 'meridenrehab',
            'beechwoodrehab.net': 'beechwoodrehab',
            'noblehorizons.org': 'noblehorizons',
            'ndhrehab.org': 'ndhrehab',
            'orange-healthcare.com': 'orange-healthcare',
            'covliving.org': 'covliving',
            'sjlivingcenter.org': 'sjlivingcenter',
            'westviewhcc.com': 'westviewhcc',
            'wprnc.com': 'wprnc',
            'hallkeen.com': 'hallkeen',
            'promedica.org': 'promedica',
            'watermarkretirementcommunities.com': 'watermarkretirementcommunities',
            'oakhill.org': 'oakhill',
            'aaronmanor.com': 'aaronmanor',
            'pathwellhealth.com': 'pathwell',
            'aspenhillrehab.com': 'aspenhill',
            'hathornehhc.com': 'hathornehhc',
            'aplaceathome.com': 'aplaceathome',
            'briarwoodrehab.com': 'briarwoodrehab',
            'associatedhomecare.com': 'associatedhomecare',
            'honorhealthnetwork.com': 'honorhealthnetwork',
            'fivestarnusing.com': 'fivestarnusing',
            'bondhealthstaffing.com': 'bondhealthstaffing',
            'mjhs.jobs': 'mjhs',
            'tandymgroup.com': 'tandymgroup',
            'jewishhome.org': 'jewishhome',
            'allendalehc.com': 'allendale',
            'sapphirerehab.com': 'sapphirerehab',
            'laconianursinghome.com': 'laconianursinghome',
            'compassionhomellc.com': 'compassionhomellc',
            'hometownnannies.com': 'hometownnannies',
            'endurancehomecare.com': 'endurancehomecare'
        }
        
        for domain, platform in platforms.items():
            if domain in url_lower:
                return platform
        
        # Extract domain as platform for unknown sites
        try:
            domain = urlparse(url).netloc
            return domain.replace('www.', '').split('.')[0]
        except:
            return 'unknown'
    
    async def scrape_site_with_pagination(self, config: Dict) -> List[JobData]:
        """Scrape a site with pagination support and enhanced anti-bot measures"""
        all_jobs = []
        current_url = config['url']
        page_num = 1
        platform = self._extract_platform_from_url(config['url'])
        platform_config = self.platform_configs.get(platform, self.platform_configs['custom'])
        max_pages = 50  # Increased to 50 pages for better coverage
        delay = platform_config.get('delay', 2.0)  # Reduced delay for faster scraping
        
        logger.info(f"Starting to scrape {config['name']} (Platform: {platform}) with enhanced pagination")
        self.scraping_stats['current_site'] = config['name']
        
        consecutive_empty_pages = 0
        previous_job_count = 0
        force_pagination = False
        visited_urls = set()  # Track visited URLs to prevent loops
        spa_mode = False  # Track if we're in SPA mode
        
        while page_num <= max_pages and current_url:
            try:
                # Check if we've already visited this URL (but allow SPA mode)
                if current_url in visited_urls and not spa_mode:
                    logger.info(f"Already visited URL, stopping pagination: {current_url}")
                    break
                visited_urls.add(current_url)
                
                async with self.rate_limiter:
                    logger.info(f"Scraping page {page_num} of {config['name']}: {current_url}")
                    
                    # Scrape current page with retry logic
                    page_jobs, next_url = await self._scrape_single_page_with_retry(current_url, config, page_num, platform)
                    
                    if page_jobs:
                        # Check for duplicate jobs
                        new_jobs = []
                        for job in page_jobs:
                            job_id = job.id
                            if not any(existing_job.id == job_id for existing_job in all_jobs):
                                new_jobs.append(job)
                        
                        if new_jobs:
                            all_jobs.extend(new_jobs)
                            consecutive_empty_pages = 0
                            logger.info(f"Found {len(new_jobs)} new jobs on page {page_num} (total: {len(all_jobs)})")
                        else:
                            consecutive_empty_pages += 1
                            logger.info(f"No new jobs on page {page_num} (duplicates)")
                    else:
                        consecutive_empty_pages += 1
                        logger.info(f"No jobs found on page {page_num}")
                    
                    # Update stats
                    self.scraping_stats['pages_scraped'] += 1
                    
                    # Enhanced pagination logic with multiple fallbacks
                    if not next_url:
                        # Try SPA pagination detection first
                        spa_next_url = await self._detect_spa_pagination_async(current_url, config, platform)
                        if spa_next_url:
                            next_url = spa_next_url
                            spa_mode = True
                            logger.info(f"Detected SPA pagination: {next_url}")
                        else:
                            # Try to force pagination by generating next URL
                            generated_next_url = self._generate_next_page_url(current_url, platform)
                            if generated_next_url:
                                next_url = generated_next_url
                                force_pagination = True
                                logger.info(f"Forcing pagination to: {next_url}")
                    
                    # More lenient stop conditions for better coverage
                    if consecutive_empty_pages >= 5:  # Increased from 3 to 5
                        logger.info(f"Stopping after {consecutive_empty_pages} consecutive empty pages")
                        break
                    
                    if len(all_jobs) == previous_job_count and page_num > 3 and not force_pagination and not spa_mode:
                        logger.info(f"No progress for 3 pages, stopping pagination")
                        break
                    
                    # Stop if we're hitting WordPress API URLs or other non-job URLs
                    if any(skip_pattern in current_url.lower() for skip_pattern in [
                        '/wp-json/wp/v2/', '/api/', '/admin/', '/wp-admin/', '/wp-content/',
                        '/assets/', '/css/', '/js/', '/images/', '/uploads/',
                        'json', 'xml', 'rss', 'feed', 'sitemap', 'robots.txt',
                        'favicon.ico', '.well-known', '/cgi-bin/', '/tmp/'
                    ]):
                        logger.info(f"Stopping - hit non-job URL: {current_url}")
                        break
                    
                    # Stop if URL looks like a specific post/page rather than pagination
                    if re.search(r'/\d{4}/\d{2}/', current_url) or re.search(r'/page/\d+$', current_url):
                        logger.info(f"Stopping - URL looks like specific post/page: {current_url}")
                        break
                    
                    # Stop if we're getting redirected to the same page (but allow SPA mode)
                    if len(visited_urls) > 1 and len(set(visited_urls)) == 1 and not spa_mode:
                        logger.info(f"Stopping - getting redirected to same URL: {current_url}")
                        break
                    
                    previous_job_count = len(all_jobs)
                    
                    # Check if we should continue
                    if not next_url:
                        logger.info(f"No more pages available for {config['name']}")
                        break
                    
                    # Move to next page
                    current_url = next_url
                    page_num += 1
                    
                    # Enhanced rate limiting with random delays
                    delay_with_jitter = delay + random.uniform(0.5, 2.0)  # Reduced jitter
                    logger.info(f"Waiting {delay_with_jitter:.1f}s before next page...")
                    await asyncio.sleep(delay_with_jitter)
                    
            except Exception as e:
                error_msg = f"Error scraping page {page_num} of {config['name']}: {str(e)}"
                logger.error(error_msg)
                self.scraping_stats['errors'].append(error_msg)
                consecutive_empty_pages += 1
                
                if consecutive_empty_pages >= 5:  # Increased from 3 to 5
                    break
                
                # Wait longer on error
                await asyncio.sleep(delay * 2)
        
        logger.info(f"Completed scraping {config['name']}: {len(all_jobs)} jobs from {page_num-1} pages")
        return all_jobs
    
    async def _scrape_single_page_with_retry(self, url: str, config: Dict, page_num: int, platform: str) -> Tuple[List[JobData], Optional[str]]:
        """Scrape a single page with retry logic and enhanced anti-bot measures"""
        platform_config = self.site_strategies.get(platform, self.site_strategies['default'])
        delay = platform_config['delay']
        
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Attempt {attempt + 1}/{self.max_retries} for page {page_num}")
                
                if not self.crawler:
                    # Fallback to enhanced extraction without LLM
                    return await self._scrape_without_llm_enhanced(url, config, page_num, platform)
                
                # Use Crawl4AI for extraction with enhanced configuration
                result = await self.crawler.arun(url=url)
                
                # Extract jobs and pagination info
                jobs = self._extract_jobs_from_result(result, config)
                next_url = self._extract_next_page_url_enhanced(result, config, url, platform)
                
                if jobs or attempt == self.max_retries - 1:
                    return jobs, next_url
                
                # Wait before retry
                await asyncio.sleep(delay * (attempt + 1))
                
            except Exception as e:
                logger.error(f"Error scraping page (attempt {attempt + 1}): {str(e)}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(delay * (attempt + 1))
                else:
                    return [], None
        
        return [], None
    
    async def _scrape_single_page(self, url: str, config: Dict, page_num: int) -> Tuple[List[JobData], Optional[str]]:
        """Scrape a single page and return jobs + next page URL"""
        try:
            if not self.crawler:
                # Fallback to basic extraction without LLM
                return await self._scrape_without_llm(url, config, page_num)
            
            # Use Crawl4AI for extraction
            result = await self.crawler.arun(url=url)
            
            # Extract jobs and pagination info
            jobs = self._extract_jobs_from_result(result, config)
            next_url = self._extract_next_page_url(result, config, url)
            
            return jobs, next_url
            
        except Exception as e:
            logger.error(f"Error scraping page: {str(e)}")
            return [], None
    
    async def _scrape_without_llm_enhanced(self, url: str, config: Dict, page_num: int, platform: str) -> Tuple[List[JobData], Optional[str]]:
        """Enhanced fallback scraping without LLM with anti-bot measures"""
        try:
            # Create session with anti-bot measures
            connector = aiohttp.TCPConnector(ssl=ssl.create_default_context(cafile=certifi.where()))
            timeout = aiohttp.ClientTimeout(total=self.session_timeout)
            
            headers = self.default_headers.copy()
            headers['User-Agent'] = random.choice(self.user_agents)
            
            async with aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers=headers
            ) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        content = await response.text()
                        
                        # Enhanced extraction using platform-specific patterns
                        jobs = self._extract_jobs_from_html_enhanced(content, config, platform)
                        next_url = self._extract_next_page_from_html_enhanced(content, config, url, platform)
                        
                        return jobs, next_url
                    else:
                        logger.warning(f"HTTP {response.status} for {url}")
                        return [], None
                        
        except Exception as e:
            logger.error(f"Error in enhanced fallback scraping: {str(e)}")
            return [], None
    
    async def _scrape_without_llm(self, url: str, config: Dict, page_num: int) -> Tuple[List[JobData], Optional[str]]:
        """Fallback scraping without LLM"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        content = await response.text()
                        
                        # Basic extraction using regex patterns
                        jobs = self._extract_jobs_from_html(content, config)
                        next_url = self._extract_next_page_from_html(content, config, url)
                        
                        return jobs, next_url
                    else:
                        logger.warning(f"HTTP {response.status} for {url}")
                        return [], None
                        
        except Exception as e:
            logger.error(f"Error in fallback scraping: {str(e)}")
            return [], None
    
    def _extract_jobs_from_result(self, result, config: Dict) -> List[JobData]:
        """Extract jobs from Crawl4AI result"""
        jobs = []
        
        try:
            if hasattr(result, 'extracted_content') and result.extracted_content:
                extracted_data = json.loads(result.extracted_content)
                
                if 'jobs' in extracted_data:
                    for job_data in extracted_data['jobs']:
                        job = self._create_job_object(job_data, config)
                        if job:
                            jobs.append(job)
            
            # Also try markdown extraction
            if hasattr(result, 'markdown') and result.markdown:
                markdown_jobs = self._extract_jobs_from_markdown(result.markdown, config)
                jobs.extend(markdown_jobs)
                
        except Exception as e:
            logger.error(f"Error extracting jobs from result: {str(e)}")
        
        return jobs
    
    def _extract_next_page_url_enhanced(self, result, config: Dict, current_url: str, platform: str) -> Optional[str]:
        """Enhanced extraction of next page URL with platform-specific patterns"""
        try:
            # First try LLM extraction
            if hasattr(result, 'extracted_content') and result.extracted_content:
                try:
                    extracted_data = json.loads(result.extracted_content)
                    
                    if 'pagination' in extracted_data:
                        pagination = extracted_data['pagination']
                        if pagination.get('has_next_page') and pagination.get('next_page_url'):
                            next_url = pagination['next_page_url']
                            if not self._is_wordpress_api_url(next_url):
                                logger.info(f"Found next page via LLM: {next_url}")
                                return next_url
                except json.JSONDecodeError:
                    pass
            
            # Try HTML extraction from markdown
            if hasattr(result, 'markdown') and result.markdown:
                next_url = self._extract_next_page_from_html_enhanced(result.markdown, config, current_url, platform)
                if next_url:
                    logger.info(f"Found next page via HTML: {next_url}")
                    return next_url
            
            # Try raw HTML extraction
            if hasattr(result, 'html') and result.html:
                next_url = self._extract_next_page_from_html_enhanced(result.html, config, current_url, platform)
                if next_url:
                    logger.info(f"Found next page via raw HTML: {next_url}")
                    return next_url
            
            # URL-based pagination patterns
            next_url = self._generate_next_page_url(current_url, platform)
            if next_url:
                logger.info(f"Generated next page URL: {next_url}")
                return next_url
                
        except Exception as e:
            logger.error(f"Error extracting next page URL: {str(e)}")
        
        logger.info(f"No next page found for {platform}")
        return None
    
    def _extract_next_page_url(self, result, config: Dict, current_url: str) -> Optional[str]:
        """Extract next page URL from result"""
        try:
            if hasattr(result, 'extracted_content') and result.extracted_content:
                extracted_data = json.loads(result.extracted_content)
                
                if 'pagination' in extracted_data:
                    pagination = extracted_data['pagination']
                    if pagination.get('has_next_page') and pagination.get('next_page_url'):
                        return pagination['next_page_url']
            
            # Fallback to HTML extraction
            if hasattr(result, 'markdown') and result.markdown:
                return self._extract_next_page_from_html(result.markdown, config, current_url)
                
        except Exception as e:
            logger.error(f"Error extracting next page URL: {str(e)}")
        
        return None
    
    def _extract_jobs_from_html(self, html_content: str, config: Dict) -> List[JobData]:
        """Extract jobs from HTML content using regex patterns"""
        jobs = []
        platform = config.get('platform', 'default')
        strategy = self.site_strategies.get(platform, self.site_strategies['default'])
        
        # Extract job links
        job_links = re.findall(strategy['job_links_pattern'], html_content, re.IGNORECASE)
        
        for link in job_links[:20]:  # Limit to first 20 jobs per page
            # Create basic job object
            job_data = {
                'title': f"Job from {config['name']}",
                'company': config['name'],
                'location': f"{config.get('city', '')}, {config.get('state', '')}",
                'job_url': urljoin(config['url'], link)
            }
            
            job = self._create_job_object(job_data, config)
            if job:
                jobs.append(job)
        
        return jobs
    
    def _extract_jobs_from_html_enhanced(self, html_content: str, config: Dict, platform: str) -> List[JobData]:
        """Enhanced extraction of jobs from HTML content using platform-specific selectors"""
        jobs = []
        platform_config = self.platform_configs.get(platform, self.platform_configs['custom'])
        
        try:
            # Parse HTML with BeautifulSoup for better extraction
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Find job containers using platform-specific selectors
            job_containers = []
            for selector in platform_config['job_container'].split(', '):
                elements = soup.select(selector)
                if elements:
                    # Filter for healthcare-related jobs
                    healthcare_elements = []
                    for elem in elements:
                        elem_text = elem.get_text().lower()
                        healthcare_keywords = ['nurse', 'nursing', 'care', 'aide', 'assistant', 'therapist', 
                                             'coordinator', 'caregiver', 'cna', 'rn', 'lpn', 'medical',
                                             'healthcare', 'health care', 'patient', 'clinical', 'rehab',
                                             'therapy', 'social worker', 'director', 'manager', 'supervisor',
                                             'dietary', 'housekeeping', 'maintenance', 'receptionist']
                        if any(keyword in elem_text for keyword in healthcare_keywords) or len(elem_text) < 100:
                            healthcare_elements.append(elem)
                    
                    if healthcare_elements:
                        job_containers = healthcare_elements
                        logger.info(f"Found {len(healthcare_elements)} healthcare job containers with selector: {selector}")
                        break
            
            # Extract job data from each container
            for container in job_containers[:50]:  # Limit to first 50 jobs per page
                job_data = self._extract_job_from_container_enhanced(container, platform_config, config)
                if job_data:
                    job = self._create_job_object(job_data, config)
                    if job:
                        jobs.append(job)
                        
        except Exception as e:
            logger.error(f"Error in enhanced HTML extraction: {str(e)}")
        
        return jobs
    
    def _extract_job_from_container_enhanced(self, container, platform_config: Dict, config: Dict) -> Optional[Dict]:
        """Extract job data from a single container using enhanced selectors"""
        try:
            job_data = {}
            
            # Extract title
            for selector in platform_config['job_title'].split(', '):
                elem = container.select_one(selector)
                if elem:
                    title = elem.get_text(strip=True)
                    if title and len(title) > 3 and not title.lower().startswith(('view', 'apply', 'see')):
                        job_data['title'] = title
                        # Get URL if it's a link
                        if elem.name == 'a' and elem.get('href'):
                            job_data['job_url'] = urljoin(config['url'], elem['href'])
                        break
            
            # Extract location
            for selector in platform_config['job_location'].split(', '):
                elem = container.select_one(selector)
                if elem:
                    location = elem.get_text(strip=True)
                    if location and len(location) > 1:
                        job_data['location'] = location
                        break
            
            # Extract salary
            for selector in platform_config.get('job_salary', '').split(', '):
                elem = container.select_one(selector)
                if elem:
                    salary = elem.get_text(strip=True)
                    if salary:
                        job_data['salary'] = salary
                        break
            
            # Extract job type/shift
            for selector in platform_config.get('job_type', '').split(', '):
                elem = container.select_one(selector)
                if elem:
                    job_type = elem.get_text(strip=True)
                    if job_type:
                        job_data['job_type'] = job_type
                        break
            
            # Extract description
            for selector in platform_config.get('job_description', '').split(', '):
                elem = container.select_one(selector)
                if elem:
                    description = elem.get_text(strip=True)
                    if description and len(description) > 10:
                        job_data['description'] = description
                        break
            
            # Set company name
            job_data['company'] = config['name']
            
            return job_data if job_data.get('title') else None
            
        except Exception as e:
            logger.error(f"Error extracting job from container: {str(e)}")
            return None
    
    def _generate_next_page_url(self, current_url: str, platform: str) -> Optional[str]:
        """Generate next page URL based on common pagination patterns (enhanced)"""
        try:
            parsed_url = urlparse(current_url)
            query_params = parse_qs(parsed_url.query)
            
            # Skip WordPress API URLs and other non-job URLs
            if self._is_wordpress_api_url(current_url) or any(skip_pattern in current_url.lower() for skip_pattern in [
                '/api/', '/admin/', '/wp-admin/', '/wp-content/',
                '/assets/', '/css/', '/js/', '/images/', '/uploads/',
                'json', 'xml', 'rss', 'feed', 'sitemap'
            ]):
                logger.info(f"Skipping URL generation for non-job URL: {current_url}")
                return None
            
            # Get platform-specific pagination pattern
            platform_config = self.site_strategies.get(platform, self.site_strategies['default'])
            pagination_pattern = platform_config.get('pagination_pattern', r'page=(\d+)')
            
            # Extract the parameter name from the pattern
            param_match = re.match(r'([a-zA-Z_]+)=\(\\d\+\)', pagination_pattern)
            if param_match:
                param_name = param_match.group(1)
                increment = 1  # Default increment
                
                # Special cases for different parameters
                if param_name in ['start', 'offset']:
                    increment = 25  # Common offset increment
                elif param_name == 'spage':
                    increment = 1
                
                if param_name in query_params:
                    try:
                        current_value = int(query_params[param_name][0])
                        next_value = current_value + increment
                        
                        # Create new query params
                        new_query_params = query_params.copy()
                        new_query_params[param_name] = [str(next_value)]
                        
                        # Rebuild URL
                        new_query = '&'.join([f"{k}={v[0]}" for k, v in new_query_params.items()])
                        next_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
                        
                        logger.info(f"Generated next page URL: {param_name}={current_value} -> {param_name}={next_value}")
                        return next_url
                    except (ValueError, IndexError):
                        pass
            
            # Enhanced fallback to common pagination patterns (similar to comprehensive scraper)
            pagination_patterns = [
                ('page', 1),
                ('p', 1),
                ('spage', 1),
                ('start', 25),
                ('offset', 25),
                ('pg', 1),
                ('pagenum', 1),
                ('page_number', 1),
                ('listing_page', 1),
                ('current_page', 1),
                ('page_num', 1),
                ('pageid', 1),
                ('paged', 1),
                ('page_num', 1),
                ('page_number', 1),
                ('pageid', 1),
                ('paged', 1)
            ]
            
            for param, increment in pagination_patterns:
                if param in query_params:
                    try:
                        current_value = int(query_params[param][0])
                        next_value = current_value + increment
                        
                        # Create new query params
                        new_query_params = query_params.copy()
                        new_query_params[param] = [str(next_value)]
                        
                        # Rebuild URL
                        new_query = '&'.join([f"{k}={v[0]}" for k, v in new_query_params.items()])
                        next_url = f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
                        
                        logger.info(f"Generated next page URL: {param}={current_value} -> {param}={next_value}")
                        return next_url
                    except (ValueError, IndexError):
                        continue
            
            # Try URL path-based pagination (but be more selective)
            path_parts = parsed_url.path.split('/')
            for i, part in enumerate(path_parts):
                if part.isdigit() and len(part) <= 4:  # Only reasonable page numbers
                    try:
                        current_page = int(part)
                        next_page = current_page + 1
                        
                        # Skip if it looks like a WordPress post ID (usually > 1000)
                        if current_page > 1000:
                            continue
                        
                        # Replace the page number in the path
                        new_path_parts = path_parts.copy()
                        new_path_parts[i] = str(next_page)
                        new_path = '/'.join(new_path_parts)
                        
                        next_url = f"{parsed_url.scheme}://{parsed_url.netloc}{new_path}"
                        if parsed_url.query:
                            next_url += f"?{parsed_url.query}"
                        
                        logger.info(f"Generated next page URL: path {current_page} -> {next_page}")
                        return next_url
                    except ValueError:
                        continue
            
            # Try WordPress query parameter pagination
            if 'p=' in current_url:
                try:
                    # Extract current page number from ?p=123
                    p_match = re.search(r'[?&]p=(\d+)', current_url)
                    if p_match:
                        current_page = int(p_match.group(1))
                        next_page = current_page + 1
                        
                        # Skip if it looks like a WordPress post ID (usually > 1000)
                        if current_page > 1000:
                            return None
                        
                        # Replace the page number
                        next_url = re.sub(r'([?&])p=\d+', r'\1p=' + str(next_page), current_url)
                        if next_url != current_url:
                            logger.info(f"Generated next page URL: p={current_page} -> p={next_page}")
                            return next_url
                except (ValueError, AttributeError):
                    pass
            
            # Try hash-based pagination (e.g., #/search?page=1)
            if '#' in current_url:
                try:
                    hash_part = current_url.split('#')[1]
                    page_match = re.search(r'page=(\d+)', hash_part)
                    if page_match:
                        current_page = int(page_match.group(1))
                        next_page = current_page + 1
                        next_hash = hash_part.replace(f'page={current_page}', f'page={next_page}')
                        next_url = current_url.replace(hash_part, next_hash)
                        logger.info(f"Generated next page URL: hash page={current_page} -> page={next_page}")
                        return next_url
                except (ValueError, IndexError):
                    pass
            
            # Try WordPress specific patterns
            if 'wp-json' in current_url or 'wordpress' in current_url.lower():
                # WordPress REST API pagination
                if 'per_page=' in current_url and 'page=' in current_url:
                    page_match = re.search(r'page=(\d+)', current_url)
                    if page_match:
                        current_page = int(page_match.group(1))
                        next_page = current_page + 1
                        next_url = re.sub(r'page=\d+', f'page={next_page}', current_url)
                        logger.info(f"Generated WordPress API next page URL: page={current_page} -> page={next_page}")
                        return next_url
            
            return None
            
        except Exception as e:
            logger.error(f"Error generating next page URL: {str(e)}")
            return None
    
    def _is_wordpress_api_url(self, url: str) -> bool:
        """Check if URL is a WordPress API URL that should be ignored"""
        return 'wp-json/wp/v2/pages/' in url or 'wp-json/wp/v2/posts/' in url
    
    def _detect_spa_pagination(self, soup: BeautifulSoup, current_url: str, platform: str) -> Optional[str]:
        """Detect SPA-style pagination where content changes but URL stays the same"""
        try:
            # Look for SPA pagination indicators
            spa_indicators = [
                # Common SPA pagination patterns
                '[data-page]', '[data-current-page]', '[data-pagination]',
                '.pagination-container', '.pagination-wrapper', '.pagination-controls',
                '[class*="pagination"]', '[class*="page"]', '[class*="next"]',
                '.load-more', '.show-more', '.load-more-jobs', '.show-more-jobs',
                '[data-load-more]', '[data-show-more]', '[data-next-page]',
                '.pagination-next', '.next-page', '.page-next',
                '[aria-label*="Next"]', '[aria-label*="next"]',
                '.btn-next', '.button-next', '.next-button',
                '[onclick*="next"]', '[onclick*="page"]', '[onclick*="load"]',
                '.infinite-scroll', '.scroll-load', '.auto-load',
                '[data-infinite]', '[data-scroll]', '[data-auto-load]'
            ]
            
            for selector in spa_indicators:
                elements = soup.select(selector)
                for elem in elements:
                    # Check if this looks like a pagination element
                    elem_text = elem.get_text().lower().strip()
                    elem_attrs = ' '.join([str(v) for v in elem.attrs.values()]).lower()
                    
                    # Look for pagination keywords
                    pagination_keywords = [
                        'next', 'page', 'load more', 'show more', 'more jobs',
                        'previous', 'first', 'last', 'page', 'of', 'results'
                    ]
                    
                    if any(keyword in elem_text or keyword in elem_attrs for keyword in pagination_keywords):
                        # Check if it's clickable (has href, onclick, or is a button)
                        if (elem.get('href') or elem.get('onclick') or 
                            elem.name in ['button', 'a'] or 
                            'cursor: pointer' in elem_attrs or
                            'click' in elem_attrs):
                            
                            # Generate SPA-style next URL
                            spa_next_url = self._generate_spa_next_url(current_url, platform)
                            if spa_next_url:
                                logger.info(f"Detected SPA pagination element: {elem.name} with text '{elem_text[:50]}...'")
                                return spa_next_url
            
            # Look for pagination state in data attributes
            pagination_data = soup.find(attrs={'data-current-page': True})
            if pagination_data and hasattr(pagination_data, 'get'):
                try:
                    current_page_str = pagination_data.get('data-current-page', '1')
                    total_pages_str = pagination_data.get('data-total-pages', '1')
                    
                    if isinstance(current_page_str, str) and isinstance(total_pages_str, str):
                        current_page = int(current_page_str)
                        total_pages = int(total_pages_str)
                        
                        if current_page < total_pages:
                            spa_next_url = self._generate_spa_next_url(current_url, platform, current_page + 1)
                            if spa_next_url:
                                logger.info(f"Detected SPA pagination data: page {current_page} of {total_pages}")
                                return spa_next_url
                except (ValueError, TypeError):
                    pass
            
            # Look for job count indicators that suggest more content
            job_containers = soup.select('.job, .job-item, .job-listing, .job-card, .position, .career, .opening')
            if len(job_containers) > 0:
                # Check if there are pagination controls or "load more" buttons
                load_more_buttons = soup.select('.load-more, .show-more, .load-more-jobs, .show-more-jobs, [data-load-more], [data-show-more]')
                if load_more_buttons:
                    spa_next_url = self._generate_spa_next_url(current_url, platform)
                    if spa_next_url:
                        logger.info(f"Detected load more button with {len(job_containers)} jobs")
                        return spa_next_url
            
            return None
            
        except Exception as e:
            logger.error(f"Error detecting SPA pagination: {str(e)}")
            return None
    
    def _detect_spa_pagination_enhanced(self, soup: BeautifulSoup, current_url: str, platform: str) -> Optional[str]:
        """Enhanced SPA pagination detection with broader patterns and better analysis"""
        try:
            # Enhanced SPA pagination indicators (similar to comprehensive scraper)
            spa_indicators = [
                # Platform-specific selectors
                '.iCIMS_Paginator_Next', '.pagination-next', '[aria-label="Next"]',
                '.paging-next', '.next-page', '.page-next', '.btn-next',
                '.button-next', '.next-button', '.pager-next',
                
                # Load more patterns
                '.load-more', '.show-more', '.load-more-jobs', '.show-more-jobs',
                '[data-load-more]', '[data-show-more]', '[data-next-page]',
                '.more-jobs', '.continue-loading', '.load-additional',
                
                # Infinite scroll patterns
                '.infinite-scroll', '.scroll-load', '.auto-load',
                '[data-infinite]', '[data-scroll]', '[data-auto-load]',
                '.scroll-container', '.scroll-wrapper',
                
                # Generic pagination patterns
                '[class*="pagination"]', '[class*="page"]', '[class*="next"]',
                '[class*="more"]', '[class*="load"]', '[class*="show"]',
                '.pagination-container', '.pagination-wrapper', '.pagination-controls',
                
                # Data attributes
                '[data-page]', '[data-current-page]', '[data-pagination]',
                '[data-next]', '[data-more]', '[data-load]',
                
                # Interactive elements
                '[onclick*="next"]', '[onclick*="page"]', '[onclick*="load"]',
                '[onclick*="more"]', '[onclick*="show"]',
                'button[onclick]', 'a[onclick]', '[role="button"]',
                
                # Accessibility patterns
                '[aria-label*="Next"]', '[aria-label*="next"]',
                '[aria-label*="More"]', '[aria-label*="more"]',
                '[aria-label*="Load"]', '[aria-label*="load"]',
                
                # Test patterns
                '[data-testid*="next"]', '[data-testid*="pagination"]',
                '[data-testid*="more"]', '[data-testid*="load"]'
            ]
            
            for selector in spa_indicators:
                elements = soup.select(selector)
                for elem in elements:
                    # Enhanced element analysis
                    elem_text = elem.get_text().lower().strip()
                    elem_attrs = ' '.join([str(v) for v in elem.attrs.values()]).lower()
                    elem_class = elem.get('class', [])
                    elem_id = elem.get('id', '')
                    
                    # Comprehensive pagination keywords
                    pagination_keywords = [
                        'next', 'page', 'load more', 'show more', 'more jobs',
                        'previous', 'first', 'last', 'page', 'of', 'results',
                        'continue', 'more', 'load', 'show', 'pagination',
                        'additional', 'further', 'expand', 'extend'
                    ]
                    
                    # Fix: ensure elem_class is a string before calling lower()
                    if isinstance(elem_class, list):
                        elem_class_str = ' '.join(elem_class).lower()
                    else:
                        elem_class_str = str(elem_class).lower()
                    
                    # Check if element looks like pagination
                    is_pagination_element = (
                        any(keyword in elem_text for keyword in pagination_keywords) or
                        any(keyword in elem_attrs for keyword in pagination_keywords) or
                        any(keyword in elem_class_str for keyword in pagination_keywords) or
                        any(keyword in elem_id.lower() for keyword in pagination_keywords)
                    )
                    
                    if is_pagination_element:
                        # Check if element is interactive/clickable
                        is_clickable = (
                            elem.get('href') or 
                            elem.get('onclick') or 
                            elem.name in ['button', 'a'] or
                            'cursor: pointer' in elem_attrs or
                            'click' in elem_attrs or
                            'button' in elem_attrs or
                            'disabled' not in elem_attrs  # Not disabled
                        )
                        
                        if is_clickable:
                            # Try to extract URL from element first
                            next_url = self._extract_url_from_element_data(elem, current_url)
                            if next_url:
                                logger.info(f"Found SPA next URL from element: {next_url}")
                                return next_url
                            
                            # Generate SPA-style next URL as fallback
                            spa_next_url = self._generate_spa_next_url_enhanced(current_url, platform, elem=elem)
                            if spa_next_url:
                                logger.info(f"Generated SPA next URL: {spa_next_url}")
                                return spa_next_url
            
            # Enhanced pagination state detection
            pagination_states = [
                {'data-current-page': True, 'data-total-pages': True},
                {'data-page': True, 'data-total': True},
                {'data-pagination-current': True, 'data-pagination-total': True},
                {'data-current': True, 'data-total': True}
            ]
            
            for state_attrs in pagination_states:
                pagination_data = soup.find(attrs=state_attrs)
                if pagination_data and hasattr(pagination_data, 'get') and not isinstance(pagination_data, (str, NavigableString)):
                    try:
                        # Try different attribute combinations
                        current_page = None
                        total_pages = None
                        
                        for attr_name in ['data-current-page', 'data-page', 'data-pagination-current', 'data-current']:
                            attr_value = pagination_data.get(attr_name) if hasattr(pagination_data, 'get') else None
                            if attr_value and isinstance(attr_value, str):
                                current_page = int(attr_value)
                                break
                        
                        for attr_name in ['data-total-pages', 'data-total', 'data-pagination-total']:
                            attr_value = pagination_data.get(attr_name) if hasattr(pagination_data, 'get') else None
                            if attr_value and isinstance(attr_value, str):
                                total_pages = int(attr_value)
                                break
                        
                        if current_page and total_pages and current_page < total_pages:
                            spa_next_url = self._generate_spa_next_url_enhanced(current_url, platform, next_page=current_page + 1)
                            if spa_next_url:
                                logger.info(f"Detected pagination state: page {current_page} of {total_pages}")
                                return spa_next_url
                    except (ValueError, TypeError):
                        continue
            
            # Look for job count and pagination indicators
            job_containers = soup.select('.job, .job-item, .job-listing, .job-card, .position, .career, .opening, .job-result, .job-posting')
            if len(job_containers) > 0:
                # Check for pagination controls or load more buttons
                load_more_selectors = [
                    '.load-more', '.show-more', '.load-more-jobs', '.show-more-jobs',
                    '[data-load-more]', '[data-show-more]', '[data-next-page]',
                    '.more-jobs', '.continue-loading', '.load-additional',
                    'button:contains("Load More")', 'button:contains("Show More")',
                    'a:contains("Next")', 'a:contains("More")'
                ]
                
                for selector in load_more_selectors:
                    load_more_buttons = soup.select(selector)
                    if load_more_buttons:
                        # Try to extract URL from load more button
                        for button in load_more_buttons:
                            next_url = self._extract_url_from_element_data(button, current_url)
                            if next_url:
                                logger.info(f"Found next URL from load more button: {next_url}")
                                return next_url
                        
                        # Generate SPA URL as fallback
                        spa_next_url = self._generate_spa_next_url_enhanced(current_url, platform, elem=elem)
                        if spa_next_url:
                            logger.info(f"Generated SPA URL for load more with {len(job_containers)} jobs")
                            return spa_next_url
            
            # Look for pagination text patterns
            pagination_text_patterns = [
                r'page\s+(\d+)\s+of\s+(\d+)',
                r'(\d+)\s+of\s+(\d+)\s+results',
                r'showing\s+(\d+)\s*-\s*(\d+)\s+of\s+(\d+)',
                r'(\d+)\s*-\s*(\d+)\s+of\s+(\d+)\s+jobs'
            ]
            
            page_text = soup.get_text()
            for pattern in pagination_text_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    try:
                        groups = match.groups()
                        if len(groups) >= 2:
                            current_page = int(groups[0])
                            total_pages = int(groups[1])
                            
                            if current_page < total_pages:
                                spa_next_url = self._generate_spa_next_url_enhanced(current_url, platform, next_page=current_page + 1)
                                if spa_next_url:
                                    logger.info(f"Detected pagination text: page {current_page} of {total_pages}")
                                    return spa_next_url
                    except (ValueError, IndexError):
                        continue
            
            return None
            
        except Exception as e:
            logger.error(f"Error in enhanced SPA pagination detection: {str(e)}")
            return None
    
    async def _detect_spa_pagination_async(self, current_url: str, config: Dict, platform: str) -> Optional[str]:
        """Async SPA pagination detection that fetches the page and analyzes it"""
        try:
            # Create session with anti-bot measures
            connector = aiohttp.TCPConnector(ssl=ssl.create_default_context(cafile=certifi.where()))
            timeout = aiohttp.ClientTimeout(total=self.session_timeout)
            
            headers = self.default_headers.copy()
            headers['User-Agent'] = random.choice(self.user_agents)
            
            async with aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers=headers
            ) as session:
                async with session.get(current_url) as response:
                    if response.status == 200:
                        content = await response.text()
                        soup = BeautifulSoup(content, 'html.parser')
                        
                        # Enhanced SPA pagination indicators (similar to comprehensive scraper)
                        spa_indicators = [
                            # Platform-specific selectors
                            '.iCIMS_Paginator_Next', '.pagination-next', '[aria-label="Next"]',
                            '.paging-next', '.next-page', '.page-next', '.btn-next',
                            '.button-next', '.next-button', '.pager-next',
                            
                            # Load more patterns
                            '.load-more', '.show-more', '.load-more-jobs', '.show-more-jobs',
                            '[data-load-more]', '[data-show-more]', '[data-next-page]',
                            '.more-jobs', '.continue-loading', '.load-additional',
                            
                            # Infinite scroll patterns
                            '.infinite-scroll', '.scroll-load', '.auto-load',
                            '[data-infinite]', '[data-scroll]', '[data-auto-load]',
                            '.scroll-container', '.scroll-wrapper',
                            
                            # Generic pagination patterns
                            '[class*="pagination"]', '[class*="page"]', '[class*="next"]',
                            '[class*="more"]', '[class*="load"]', '[class*="show"]',
                            '.pagination-container', '.pagination-wrapper', '.pagination-controls',
                            
                            # Data attributes
                            '[data-page]', '[data-current-page]', '[data-pagination]',
                            '[data-next]', '[data-more]', '[data-load]',
                            
                            # Interactive elements
                            '[onclick*="next"]', '[onclick*="page"]', '[onclick*="load"]',
                            '[onclick*="more"]', '[onclick*="show"]',
                            'button[onclick]', 'a[onclick]', '[role="button"]',
                            
                            # Accessibility patterns
                            '[aria-label*="Next"]', '[aria-label*="next"]',
                            '[aria-label*="More"]', '[aria-label*="more"]',
                            '[aria-label*="Load"]', '[aria-label*="load"]',
                            
                            # Test patterns
                            '[data-testid*="next"]', '[data-testid*="pagination"]',
                            '[data-testid*="more"]', '[data-testid*="load"]'
                        ]
                        
                        for selector in spa_indicators:
                            elements = soup.select(selector)
                            for elem in elements:
                                # Enhanced element analysis
                                elem_text = elem.get_text().lower().strip()
                                elem_attrs = ' '.join([str(v) for v in elem.attrs.values()]).lower()
                                elem_class = elem.get('class', [])
                                elem_id = elem.get('id', '')
                                
                                # Comprehensive pagination keywords
                                pagination_keywords = [
                                    'next', 'page', 'load more', 'show more', 'more jobs',
                                    'previous', 'first', 'last', 'page', 'of', 'results',
                                    'continue', 'more', 'load', 'show', 'pagination',
                                    'additional', 'further', 'expand', 'extend'
                                ]
                                
                                # Fix: ensure elem_class is a string before calling lower()
                                if isinstance(elem_class, list):
                                    elem_class_str = ' '.join(elem_class).lower()
                                else:
                                    elem_class_str = str(elem_class).lower()
                                
                                # Check if element looks like pagination
                                is_pagination_element = (
                                    any(keyword in elem_text for keyword in pagination_keywords) or
                                    any(keyword in elem_attrs for keyword in pagination_keywords) or
                                    any(keyword in elem_class_str for keyword in pagination_keywords) or
                                    any(keyword in elem_id.lower() for keyword in pagination_keywords)
                                )
                                
                                if is_pagination_element:
                                    # Check if element is interactive/clickable
                                    is_clickable = (
                                        elem.get('href') or 
                                        elem.get('onclick') or 
                                        elem.name in ['button', 'a'] or
                                        'cursor: pointer' in elem_attrs or
                                        'click' in elem_attrs or
                                        'button' in elem_attrs or
                                        'disabled' not in elem_attrs  # Not disabled
                                    )
                                    
                                    if is_clickable:
                                        # Try to extract URL from element first
                                        next_url = self._extract_url_from_element_data(elem, current_url)
                                        if next_url:
                                            logger.info(f"Found SPA next URL from element: {next_url}")
                                            return next_url
                                        
                                        # Generate SPA-style next URL as fallback
                                        spa_next_url = self._generate_spa_next_url_enhanced(current_url, platform, elem=elem)
                                        if spa_next_url:
                                            logger.info(f"Generated SPA next URL: {spa_next_url}")
                                            return spa_next_url
                        
                        # Look for job count and pagination indicators
                        job_containers = soup.select('.job, .job-item, .job-listing, .job-card, .position, .career, .opening, .job-result, .job-posting')
                        if len(job_containers) > 0:
                            # Check for pagination controls or load more buttons
                            load_more_selectors = [
                                '.load-more', '.show-more', '.load-more-jobs', '.show-more-jobs',
                                '[data-load-more]', '[data-show-more]', '[data-next-page]',
                                '.more-jobs', '.continue-loading', '.load-additional',
                                'button:contains("Load More")', 'button:contains("Show More")',
                                'a:contains("Next")', 'a:contains("More")'
                            ]
                            
                            for selector in load_more_selectors:
                                load_more_buttons = soup.select(selector)
                                if load_more_buttons:
                                    # Try to extract URL from load more button
                                    for button in load_more_buttons:
                                        next_url = self._extract_url_from_element_data(button, current_url)
                                        if next_url:
                                            logger.info(f"Found next URL from load more button: {next_url}")
                                            return next_url
                                    
                                    # Generate SPA URL as fallback
                                    spa_next_url = self._generate_spa_next_url_enhanced(current_url, platform)
                                    if spa_next_url:
                                        logger.info(f"Generated SPA URL for load more with {len(job_containers)} jobs")
                                        return spa_next_url
                        
                        # Look for pagination text patterns
                        pagination_text_patterns = [
                            r'page\s+(\d+)\s+of\s+(\d+)',
                            r'(\d+)\s+of\s+(\d+)\s+results',
                            r'showing\s+(\d+)\s*-\s*(\d+)\s+of\s+(\d+)',
                            r'(\d+)\s*-\s*(\d+)\s+of\s+(\d+)\s+jobs'
                        ]
                        
                        page_text = soup.get_text()
                        for pattern in pagination_text_patterns:
                            match = re.search(pattern, page_text, re.IGNORECASE)
                            if match:
                                try:
                                    groups = match.groups()
                                    if len(groups) >= 2:
                                        current_page = int(groups[0])
                                        total_pages = int(groups[1])
                                        
                                        if current_page < total_pages:
                                            spa_next_url = self._generate_spa_next_url_enhanced(current_url, platform, next_page=current_page + 1)
                                            if spa_next_url:
                                                logger.info(f"Detected pagination text: page {current_page} of {total_pages}")
                                                return spa_next_url
                                except (ValueError, IndexError):
                                    continue
                        
                        return None
                    else:
                        logger.warning(f"HTTP {response.status} for SPA detection: {current_url}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error in async SPA pagination detection: {str(e)}")
            return None
    
    def _generate_spa_next_url(self, current_url: str, platform: str, next_page: Optional[int] = None) -> Optional[str]:
        """Generate next URL for SPA-style pagination"""
        try:
            parsed_url = urlparse(current_url)
            query_params = parse_qs(parsed_url.query)
            
            # Common SPA pagination parameters
            spa_params = ['page', 'p', 'spage', 'start', 'offset', 'pg', 'pagenum', 'page_number', 'listing_page']
            
            # If we have a specific next page number, use it
            if next_page is not None:
                # Try to find existing pagination parameter
                for param in spa_params:
                    if param in query_params:
                        new_query_params = query_params.copy()
                        new_query_params[param] = [str(next_page)]
                        new_query = '&'.join([f"{k}={v[0]}" for k, v in new_query_params.items()])
                        return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
                
                # Add new pagination parameter
                new_query_params = query_params.copy()
                new_query_params['page'] = [str(next_page)]
                new_query = '&'.join([f"{k}={v[0]}" for k, v in new_query_params.items()])
                return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
            
            # Otherwise, try to increment existing pagination parameter
            for param in spa_params:
                if param in query_params:
                    try:
                        current_value = int(query_params[param][0])
                        next_value = current_value + 1
                        
                        new_query_params = query_params.copy()
                        new_query_params[param] = [str(next_value)]
                        new_query = '&'.join([f"{k}={v[0]}" for k, v in new_query_params.items()])
                        
                        logger.info(f"Generated SPA next URL: {param}={current_value} -> {param}={next_value}")
                        return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
                    except (ValueError, IndexError):
                        continue
            
            # If no existing pagination parameter, add one
            new_query_params = query_params.copy()
            new_query_params['page'] = ['2']  # Start with page 2
            new_query = '&'.join([f"{k}={v[0]}" for k, v in new_query_params.items()])
            
            logger.info("Generated SPA next URL with new page parameter")
            return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
            
        except Exception as e:
            logger.error(f"Error generating SPA next URL: {str(e)}")
            return None
    
    def _extract_next_page_from_html_enhanced(self, html_content: str, config: Dict, current_url: str, platform: str) -> Optional[str]:
        """Enhanced extraction of next page URL from HTML content with platform-specific patterns and SPA support"""
        platform_config = self.site_strategies.get(platform, self.site_strategies['default'])
        
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Try platform-specific next button selectors (if they exist)
            next_button_selectors = platform_config.get('next_button', '')
            if next_button_selectors:
                for selector in next_button_selectors.split(', '):
                    elem = soup.select_one(selector)
                    if elem:
                        # Try href first
                        href = elem.get('href')
                        if href and isinstance(href, str):
                            next_url = urljoin(current_url, href)
                            # Skip WordPress API URLs and other non-job URLs
                            if not self._is_wordpress_api_url(next_url) and not any(skip_pattern in next_url.lower() for skip_pattern in [
                                '/api/', '/admin/', '/wp-admin/', '/wp-content/',
                                '/assets/', '/css/', '/js/', '/images/', '/uploads/',
                                'json', 'xml', 'rss', 'feed', 'sitemap'
                            ]):
                                logger.info(f"Found next page via platform selector: {next_url}")
                                return next_url
                        
                        # If no href, try data attributes and onclick
                        next_url = self._extract_url_from_element_data(elem, current_url)
                        if next_url:
                            logger.info(f"Found next page via data attributes: {next_url}")
                            return next_url
            
            # Enhanced SPA pagination detection with broader selectors
            spa_next_url = self._detect_spa_pagination_enhanced(soup, current_url, platform)
            if spa_next_url:
                return spa_next_url
            
            # Try comprehensive next button detection (similar to comprehensive scraper)
            comprehensive_next_selectors = [
                '.next', '.pagination-next', '.load-more', '.show-more', 
                '[aria-label="Next"]', '[aria-label="next"]', '.page-next', 
                '.btn-next', '.button-next', '.next-button', '.next-page',
                '.pager-next', '.more-jobs', '.show-more-jobs', '.load-more-jobs',
                '[class*="next"]', '[class*="more"]', '[class*="load"]',
                'a[href*="next"]', 'a[href*="page"]', 'a[href*="more"]',
                'button[onclick*="next"]', 'button[onclick*="page"]', 'button[onclick*="load"]',
                '[data-testid*="next"]', '[data-testid*="pagination"]',
                '.infinite-scroll', '.scroll-load', '.auto-load',
                '[data-infinite]', '[data-scroll]', '[data-auto-load]'
            ]
            
            for selector in comprehensive_next_selectors:
                elements = soup.select(selector)
                for elem in elements:
                    # Check if element looks like a pagination element
                    elem_text = elem.get_text().lower().strip()
                    elem_attrs = ' '.join([str(v) for v in elem.attrs.values()]).lower()
                    
                    # Look for pagination keywords
                    pagination_keywords = [
                        'next', 'page', 'load more', 'show more', 'more jobs',
                        'previous', 'first', 'last', 'page', 'of', 'results',
                        'continue', 'more', 'load', 'show', 'pagination'
                    ]
                    
                    if any(keyword in elem_text or keyword in elem_attrs for keyword in pagination_keywords):
                        # Try href first
                        href = elem.get('href')
                        if href and isinstance(href, str):
                            next_url = urljoin(current_url, href)
                            if not self._is_wordpress_api_url(next_url) and not any(skip_pattern in next_url.lower() for skip_pattern in [
                                '/api/', '/admin/', '/wp-admin/', '/wp-content/',
                                '/assets/', '/css/', '/js/', '/images/', '/uploads/',
                                'json', 'xml', 'rss', 'feed', 'sitemap'
                            ]):
                                logger.info(f"Found next page via comprehensive selector: {next_url}")
                                return next_url
                        
                        # Try data attributes and onclick
                        next_url = self._extract_url_from_element_data(elem, current_url)
                        if next_url:
                            logger.info(f"Found next page via comprehensive data extraction: {next_url}")
                            return next_url
            
            # Fallback to regex patterns (enhanced)
            next_patterns = [
                r'href="([^"]*next[^"]*)"',
                r'href="([^"]*page[^"]*)"',
                r'href="([^"]*more[^"]*)"',
                r'data-testid="pagination-page-next"[^>]*href="([^"]*)"',
                r'href="([^"]*p=(\d+)[^"]*)"',
                r'href="([^"]*page=(\d+)[^"]*)"',
                r'href="([^"]*start=(\d+)[^"]*)"',
                r'href="([^"]*offset=(\d+)[^"]*)"',
                r'onclick="[^"]*href=([^"]*)"',
                r'data-url="([^"]*)"',
                r'data-next="([^"]*)"',
                r'data-page="([^"]*)"'
            ]
            
            for pattern in next_patterns:
                matches = re.findall(pattern, html_content, re.IGNORECASE)
                if matches:
                    match = matches[0]
                    if isinstance(match, tuple):
                        href = match[0]
                    else:
                        href = match
                    if href and isinstance(href, str):
                        next_url = urljoin(current_url, href)
                        # Skip WordPress API URLs and other non-job URLs
                        if not self._is_wordpress_api_url(next_url) and not any(skip_pattern in next_url.lower() for skip_pattern in [
                            '/api/', '/admin/', '/wp-admin/', '/wp-content/',
                            '/assets/', '/css/', '/js/', '/images/', '/uploads/',
                            'json', 'xml', 'rss', 'feed', 'sitemap'
                        ]):
                            logger.info(f"Found next page via regex pattern: {next_url}")
                            return next_url
            
            # Last resort: look for any link with pagination-like text
            all_links = soup.find_all('a', href=True)
            for link in all_links:
                link_text = link.get_text().lower().strip()
                href = link.get('href', '')
                
                if (any(keyword in link_text for keyword in ['next', 'page', 'more', 'load', 'show']) and 
                    href and isinstance(href, str)):
                    next_url = urljoin(current_url, href)
                    if not self._is_wordpress_api_url(next_url) and not any(skip_pattern in next_url.lower() for skip_pattern in [
                        '/api/', '/admin/', '/wp-admin/', '/wp-content/',
                        '/assets/', '/css/', '/js/', '/images/', '/uploads/',
                        'json', 'xml', 'rss', 'feed', 'sitemap'
                    ]):
                        logger.info(f"Found next page via link text: {next_url}")
                        return next_url
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting next page URL: {str(e)}")
            return None
    
    def _extract_url_from_element_data(self, elem, current_url: str) -> Optional[str]:
        """Extract next page URL from element's data attributes, onclick, or other attributes"""
        try:
            # Try data attributes first
            data_attrs = ['data-url', 'data-next', 'data-page', 'data-href', 'data-link']
            for attr in data_attrs:
                value = elem.get(attr)
                if value and isinstance(value, str) and ('http' in value or value.startswith('/')):
                    next_url = urljoin(current_url, value)
                    if not self._is_wordpress_api_url(next_url):
                        return next_url
            
            # Try onclick attribute
            onclick = elem.get('onclick')
            if onclick and isinstance(onclick, str):
                # Look for URL patterns in onclick
                url_patterns = [
                    r'window\.location\.href\s*=\s*["\']([^"\']+)["\']',
                    r'location\.href\s*=\s*["\']([^"\']+)["\']',
                    r'href\s*=\s*["\']([^"\']+)["\']',
                    r'url\s*=\s*["\']([^"\']+)["\']',
                    r'["\']([^"\']*page[^"\']*)["\']',
                    r'["\']([^"\']*next[^"\']*)["\']'
                ]
                
                for pattern in url_patterns:
                    match = re.search(pattern, onclick, re.IGNORECASE)
                    if match:
                        url_value = match.group(1)
                        if url_value and ('http' in url_value or url_value.startswith('/')):
                            next_url = urljoin(current_url, url_value)
                            if not self._is_wordpress_api_url(next_url):
                                return next_url
            
            # Try other common attributes
            other_attrs = ['href', 'src', 'action']
            for attr in other_attrs:
                value = elem.get(attr)
                if value and isinstance(value, str) and ('http' in value or value.startswith('/')):
                    next_url = urljoin(current_url, value)
                    if not self._is_wordpress_api_url(next_url):
                        return next_url
            
            return None
            
        except Exception as e:
            logger.error(f"Error extracting URL from element data: {str(e)}")
            return None
    
    def _extract_next_page_from_html(self, html_content: str, config: Dict, current_url: str) -> Optional[str]:
        """Extract next page URL from HTML content"""
        platform = config.get('platform', 'default')
        strategy = self.site_strategies.get(platform, self.site_strategies['default'])
        
        # Look for next page patterns
        next_patterns = [
            r'href="([^"]*next[^"]*)"',
            r'href="([^"]*page[^"]*)"',
            r'data-testid="pagination-page-next"[^>]*href="([^"]*)"'
        ]
        
        for pattern in next_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            if matches:
                next_url = urljoin(current_url, matches[0])
                return next_url
        
        return None
    
    def _extract_jobs_from_markdown(self, markdown_content: str, config: Dict) -> List[JobData]:
        """Extract job data from markdown content using regex patterns"""
        jobs = []
        
        # Check if this is a page with multiple job listings
        if self._is_multiple_jobs_page(markdown_content):
            jobs = self._extract_multiple_jobs_from_page(markdown_content, config)
        else:
            # Original single job extraction logic
            jobs = self._extract_single_job_from_markdown(markdown_content, config)
        
        return jobs
    
    def _is_multiple_jobs_page(self, markdown_content: str) -> bool:
        """Check if the markdown content contains multiple job listings"""
        # Look for patterns that indicate multiple jobs
        multiple_job_patterns = [
            r'\d+\s+(?:certified nursing assistant|cnas?|nurses?|caregivers?|job listings?)',
            r'(?:job listings?|positions?|openings?)\s+(?:near|in|for)',
            r'##\s*\[.*?\]\(.*?\)',  # Multiple markdown headers with links
            r'#\s*\[.*?\]\(.*?\)',   # Multiple markdown links
        ]
        
        for pattern in multiple_job_patterns:
            if re.search(pattern, markdown_content, re.IGNORECASE):
                return True
        
        # Check if content contains multiple job sections
        if markdown_content.count('## [') > 1 or markdown_content.count('# [') > 1:
            return True
        
        return False
    
    def _extract_multiple_jobs_from_page(self, markdown_content: str, config: Dict) -> List[JobData]:
        """Extract individual job listings from a page with multiple jobs"""
        jobs = []
        
        # Extract job titles and URLs from markdown links
        # Pattern: # [Job Title](URL) or ## [Job Title](URL)
        job_patterns = [
            r'#\s*\[([^\]]+)\]\(([^)]+)\)',
            r'##\s*\[([^\]]+)\]\(([^)]+)\)',
        ]
        
        for pattern in job_patterns:
            matches = re.findall(pattern, markdown_content)
            for title, url in matches:
                if title and url and not title.startswith('content') and not title.startswith('Skip to'):
                    # Create a new job entry
                    job_id = hashlib.md5(f"{title}{url}".encode('utf-8')).hexdigest()[:16]
                    job_data = JobData(
                        id=job_id,
                        title=title.strip(),
                        company=config.get('company', ''),
                        location='',
                        city='',
                        state='',
                        zip_code='',
                        salary_min=None,
                        salary_max=None,
                        salary_type='',
                        job_type='',
                        description=f"Job listing: {title}\nURL: {url}",
                        requirements=[],
                        benefits=[],
                        platform=config.get('platform', ''),
                        url=config.get('url', ''),
                        job_url=url.strip(),
                        scraped_at=datetime.now().isoformat(),
                        category=config.get('category', ''),
                        seniority='',
                        experience_level='',
                        education_level='',
                        certifications=[],
                        skills=[],
                        shift_type='',
                        is_remote=False,
                        is_travel=False,
                        data_quality_score=0.0,
                        department='',
                        facility_type='',
                        license_required=False,
                        license_type='',
                        years_experience='',
                        application_deadline='',
                        posted_date='',
                        contact_info=''
                    )
                    
                    # Extract location from URL if possible
                    location_match = re.search(r'/([^/]+)-ct/', url)
                    if location_match:
                        job_data.city = location_match.group(1).replace('-', ' ').title()
                        job_data.state = 'CT'
                    
                    jobs.append(job_data)
        
        # If no markdown links found, try to extract from other patterns
        if not jobs:
            # Look for job titles in other formats
            title_patterns = [
                r'##\s*\[([^\]]+)\]',  # ## [Job Title]
                r'###\s*\[([^\]]+)\]',  # ### [Job Title]
                r'##\s*([^#\n]+)',     # ## Job Title
            ]
            
            for pattern in title_patterns:
                matches = re.findall(pattern, markdown_content)
                for title in matches:
                    if title and len(title.strip()) > 5 and not title.startswith('content'):
                        job_id = hashlib.md5(f"{title}".encode('utf-8')).hexdigest()[:16]
                        job_data = JobData(
                            id=job_id,
                            title=title.strip(),
                            company=config.get('company', ''),
                            location='',
                            city='',
                            state='',
                            zip_code='',
                            salary_min=None,
                            salary_max=None,
                            salary_type='',
                            job_type='',
                            description=f"Job listing: {title}",
                            requirements=[],
                            benefits=[],
                            platform=config.get('platform', ''),
                            url=config.get('url', ''),
                            job_url='',
                            scraped_at=datetime.now().isoformat(),
                            category=config.get('category', ''),
                            seniority='',
                            experience_level='',
                            education_level='',
                            certifications=[],
                            skills=[],
                            shift_type='',
                            is_remote=False,
                            is_travel=False,
                            data_quality_score=0.0,
                            department='',
                            facility_type='',
                            license_required=False,
                            license_type='',
                            years_experience=None,
                            application_deadline='',
                            posted_date='',
                            contact_info=''
                        )
                        jobs.append(job_data)
        
        return jobs
    
    def _extract_single_job_from_markdown(self, markdown_content: str, config: Dict) -> List[JobData]:
        """Original single job extraction logic"""
        jobs = []
        
        # Job title patterns
        title_patterns = [
            r'#\s*(.+?)\s*\n',
            r'##\s*(.+?)\s*\n',
            r'\*\*(.+?)\*\*\s*[-–—]\s*(.+?)\n',
            r'(?:Job Title|Position|Role):\s*(.+?)\n'
        ]
        
        # Location patterns
        location_patterns = [
            r'(?:Location|Address):\s*(.+?)\n',
            r'📍\s*(.+?)\n',
            r'🏢\s*(.+?)\n'
        ]
        
        # Split content into potential job sections
        sections = markdown_content.split('\n\n')
        
        for section in sections:
            if len(section.strip()) < 50:
                continue
                
            job_data = {}
            
            # Extract title
            for pattern in title_patterns:
                match = re.search(pattern, section, re.IGNORECASE)
                if match:
                    job_data['title'] = match.group(1).strip()
                    break
            
            # Extract location
            for pattern in location_patterns:
                match = re.search(pattern, section, re.IGNORECASE)
                if match:
                    job_data['location'] = match.group(1).strip()
                    break
            
            # Extract description
            lines = section.split('\n')
            if len(lines) > 3:
                job_data['description'] = '\n'.join(lines[3:]).strip()
            
            # Create job object if we have at least a title
            if job_data.get('title'):
                job = self._create_job_object(job_data, config)
                if job:
                    jobs.append(job)
        
        return jobs
    
    def _create_job_object(self, job_data: Dict, config: Dict) -> Optional[JobData]:
        """Create a JobData object from extracted data"""
        try:
            # Generate unique ID
            job_id = self._generate_job_id(job_data)
            
            # Parse location
            location_info = self._parse_location(job_data.get('location', ''))
            
            # Parse salary
            salary_info = self._parse_salary(job_data)
            
            # Classify job
            classification = self._classify_job(
                job_data.get('title', ''),
                job_data.get('description', '')
            )
            
            # Calculate data quality score
            quality_score = self._calculate_quality_score(job_data)
            
            job = JobData(
                id=job_id,
                title=job_data.get('title', '').strip(),
                company=job_data.get('company', config['name']).strip(),
                location=job_data.get('location', '').strip(),
                city=location_info['city'],
                state=location_info['state'],
                zip_code=location_info['zip_code'],
                salary_min=salary_info['min'],
                salary_max=salary_info['max'],
                salary_type=salary_info['type'],
                job_type=job_data.get('job_type', '').strip(),
                description=job_data.get('description', '').strip(),
                requirements=job_data.get('requirements', []),
                benefits=job_data.get('benefits', []),
                platform=config['platform'],
                url=config['url'],
                job_url=job_data.get('job_url', ''),
                scraped_at=datetime.now().isoformat(),
                category=classification['category'],
                seniority=classification['seniority'],
                experience_level=job_data.get('experience_level', ''),
                education_level=job_data.get('education_level', ''),
                certifications=job_data.get('certifications', []),
                skills=job_data.get('skills', []),
                shift_type=job_data.get('shift_type', ''),
                is_remote=job_data.get('is_remote', False),
                is_travel=job_data.get('is_travel', False),
                data_quality_score=quality_score,
                department=job_data.get('department', ''),
                facility_type=job_data.get('facility_type', ''),
                license_required=job_data.get('license_required', False),
                license_type=job_data.get('license_type', ''),
                years_experience=job_data.get('years_experience'),
                application_deadline=job_data.get('application_deadline', ''),
                posted_date=job_data.get('posted_date', ''),
                contact_info=job_data.get('contact_info', '')
            )
            
            return job
            
        except Exception as e:
            logger.error(f"Error creating job object: {str(e)}")
            return None
    
    def _generate_job_id(self, job_data: Dict) -> str:
        """Generate a unique job ID"""
        title = job_data.get('title', '')
        company = job_data.get('company', '')
        location = job_data.get('location', '')
        
        job_string = f"{title}_{company}_{location}".lower()
        return hashlib.md5(job_string.encode()).hexdigest()[:12]
    
    def _parse_location(self, location_text: str) -> Dict[str, str]:
        """Parse location text into components"""
        if not location_text:
            return {'city': '', 'state': '', 'zip_code': ''}
        
        patterns = [
            r'([^,]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)',
            r'([^,]+),\s*([A-Z]{2})',
            r'([^,]+)\s+([A-Z]{2})\s*(\d{5}(?:-\d{4})?)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, location_text.strip())
            if match:
                groups = match.groups()
                return {
                    'city': groups[0].strip(),
                    'state': groups[1].strip(),
                    'zip_code': groups[2].strip() if len(groups) > 2 else ''
                }
        
        return {
            'city': location_text.strip(),
            'state': '',
            'zip_code': ''
        }
    
    def _parse_salary(self, job_data: Dict) -> Dict[str, Any]:
        """Parse salary information"""
        salary_min = job_data.get('salary_min')
        salary_max = job_data.get('salary_max')
        salary_type = job_data.get('salary_type', '')
        
        if isinstance(salary_min, str):
            try:
                salary_min = float(salary_min.replace(',', ''))
            except:
                salary_min = None
        
        if isinstance(salary_max, str):
            try:
                salary_max = float(salary_max.replace(',', ''))
            except:
                salary_max = None
        
        return {
            'min': salary_min,
            'max': salary_max,
            'type': salary_type.lower() if salary_type else None
        }
    
    def _classify_job(self, title: str, description: str = '') -> Dict[str, str]:
        """Classify job by category and seniority"""
        title_lower = title.lower()
        desc_lower = description.lower()
        combined_text = f"{title_lower} {desc_lower}"
        
        # Job categories
        job_categories = {
            'nursing': ['nurse', 'rn', 'lpn', 'cna', 'nursing', 'registered nurse', 'licensed practical nurse', 'certified nursing assistant'],
            'caregiving': ['caregiver', 'care aide', 'home health aide', 'personal care', 'companion', 'care assistant'],
            'therapy': ['therapist', 'therapy', 'physical therapist', 'occupational therapist', 'speech therapist', 'respiratory therapist'],
            'administration': ['coordinator', 'scheduler', 'administrator', 'manager', 'director', 'supervisor', 'lead'],
            'medical': ['doctor', 'physician', 'nurse practitioner', 'physician assistant', 'medical assistant'],
            'support': ['receptionist', 'clerk', 'assistant', 'aide', 'technician', 'specialist']
        }
        
        # Seniority levels
        seniority_levels = {
            'entry': ['entry', 'junior', 'new grad', 'recent graduate', 'no experience', 'training provided'],
            'mid': ['experienced', '2+ years', '3+ years', 'intermediate', 'mid-level'],
            'senior': ['senior', 'lead', 'supervisor', '5+ years', '7+ years', 'advanced'],
            'executive': ['director', 'manager', 'chief', 'head of', 'vice president', 'executive']
        }
        
        # Classify category
        category = 'other'
        for cat, keywords in job_categories.items():
            if any(keyword in combined_text for keyword in keywords):
                category = cat
                break
        
        # Classify seniority
        seniority = 'mid'
        for level, keywords in seniority_levels.items():
            if any(keyword in combined_text for keyword in keywords):
                seniority = level
                break
        
        return {
            'category': category,
            'seniority': seniority
        }
    
    def _calculate_quality_score(self, job_data: Dict) -> float:
        """Calculate data quality score (0-1)"""
        score = 0.0
        total_fields = 0
        
        # Required fields
        if job_data.get('title'):
            score += 1.0
        total_fields += 1
        
        if job_data.get('company'):
            score += 1.0
        total_fields += 1
        
        if job_data.get('location'):
            score += 1.0
        total_fields += 1
        
        # Optional fields
        if job_data.get('description'):
            score += 0.5
        total_fields += 0.5
        
        if job_data.get('salary_min') or job_data.get('salary_max'):
            score += 0.5
        total_fields += 0.5
        
        if job_data.get('requirements'):
            score += 0.3
        total_fields += 0.3
        
        if job_data.get('benefits'):
            score += 0.2
        total_fields += 0.2
        
        if job_data.get('job_url'):
            score += 0.3
        total_fields += 0.3
        
        return score / total_fields if total_fields > 0 else 0.0
    
    async def scrape_all_sites(self, max_sites: Optional[int] = None) -> List[JobData]:
        """Scrape all configured sites with enhanced pagination and anti-bot measures"""
        self.scraping_stats['start_time'] = datetime.now().isoformat()
        
        sites_to_scrape = self.site_configs[:max_sites] if max_sites else self.site_configs
        
        logger.info(f"Starting to scrape {len(sites_to_scrape)} sites with enhanced pagination and anti-bot measures")
        logger.info(f"Using {self.max_concurrent} concurrent workers with {self.delay_between_requests}s base delay")
        
        # Scrape sites with enhanced rate limiting
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def scrape_with_semaphore(config):
            async with semaphore:
                try:
                    # Add random delay before starting each site
                    await asyncio.sleep(random.uniform(1.0, 3.0))
                    return await self.scrape_site_with_pagination(config)
                except Exception as e:
                    logger.error(f"Error scraping {config['name']}: {str(e)}")
                    self.scraping_stats['errors'].append({
                        'site': config['name'],
                        'error': str(e),
                        'timestamp': datetime.now().isoformat()
                    })
                    return []
        
        tasks = [scrape_with_semaphore(config) for config in sites_to_scrape]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Collect all jobs
        all_jobs = []
        for result in results:
            if isinstance(result, list):
                all_jobs.extend(result)
                self.scraping_stats['sites_successful'] += 1
            else:
                self.scraping_stats['sites_failed'] += 1
                logger.error(f"Site scraping failed: {result}")
        
        self.scraping_stats['sites_processed'] = len(sites_to_scrape)
        self.scraping_stats['total_jobs_found'] = len(all_jobs)
        
        # Remove duplicates
        unique_jobs = self._remove_duplicates(all_jobs)
        
        self.jobs = unique_jobs
        
        # Calculate success rate
        success_rate = (self.scraping_stats['sites_successful'] / self.scraping_stats['sites_processed'] * 100) if self.scraping_stats['sites_processed'] > 0 else 0
        
        logger.info(f"Scraping complete. Found {len(unique_jobs)} unique jobs from {self.scraping_stats['sites_successful']} sites across {self.scraping_stats['pages_scraped']} pages")
        logger.info(f"Success rate: {success_rate:.1f}% | Errors: {len(self.scraping_stats['errors'])}")
        
        return unique_jobs
    
    def _remove_duplicates(self, jobs: List[JobData]) -> List[JobData]:
        """Remove duplicate jobs based on title, company, and location"""
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            key = f"{job.title.lower()}_{job.company.lower()}_{job.city.lower()}"
            
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
        
        return unique_jobs
    
    async def test_pagination_on_site(self, site_name: str, max_pages: int = 5) -> Dict[str, Any]:
        """Test pagination on a specific site to verify it's working"""
        logger.info(f"Testing pagination on site: {site_name}")
        
        # Find the site configuration
        site_config = None
        for config in self.site_configs:
            if config['name'] == site_name:
                site_config = config
                break
        
        if not site_config:
            logger.error(f"Site '{site_name}' not found in configuration")
            return {'error': 'Site not found'}
        
        # Test pagination
        all_jobs = []
        current_url = site_config['url']
        page_num = 1
        platform = self._extract_platform_from_url(site_config['url'])
        
        logger.info(f"Testing {site_name} (Platform: {platform}) - Max pages: {max_pages}")
        
        while page_num <= max_pages and current_url:
            try:
                logger.info(f"Testing page {page_num}: {current_url}")
                
                # Scrape current page
                page_jobs, next_url = await self._scrape_single_page_with_retry(current_url, site_config, page_num, platform)
                
                logger.info(f"Page {page_num}: Found {len(page_jobs)} jobs, Next URL: {next_url}")
                
                if page_jobs:
                    all_jobs.extend(page_jobs)
                
                if not next_url:
                    # Try to generate next URL
                    generated_next_url = self._generate_next_page_url(current_url, platform)
                    if generated_next_url:
                        next_url = generated_next_url
                        logger.info(f"Generated next URL: {next_url}")
                
                if not next_url:
                    logger.info(f"No more pages available")
                    break
                
                current_url = next_url
                page_num += 1
                
                # Short delay for testing
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error testing page {page_num}: {str(e)}")
                break
        
        result = {
            'site_name': site_name,
            'platform': platform,
            'pages_tested': page_num - 1,
            'total_jobs_found': len(all_jobs),
            'pagination_working': page_num > 1,
            'jobs_per_page': len(all_jobs) / (page_num - 1) if page_num > 1 else 0
        }
        
        logger.info(f"Pagination test result: {result}")
        return result
    
    def save_jobs(self, filename_prefix: str = "enhanced_crawl4ai_jobs"):
        """Save jobs to multiple formats"""
        if not self.jobs:
            logger.warning("No jobs to save")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save as JSON
        json_filename = f"{filename_prefix}_{len(self.jobs)}_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump([asdict(job) for job in self.jobs], f, indent=2, ensure_ascii=False)
        
        # Save as CSV
        csv_filename = f"{filename_prefix}_{len(self.jobs)}_{timestamp}.csv"
        with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
            if self.jobs:
                writer = csv.DictWriter(f, fieldnames=asdict(self.jobs[0]).keys())
                writer.writeheader()
                for job in self.jobs:
                    writer.writerow(asdict(job))
        
        # Save summary
        summary_filename = f"{filename_prefix}_{len(self.jobs)}_{timestamp}_summary.json"
        summary = self._generate_summary()
        with open(summary_filename, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(self.jobs)} jobs to:")
        logger.info(f"  JSON: {json_filename}")
        logger.info(f"  CSV: {csv_filename}")
        logger.info(f"  Summary: {summary_filename}")
    
    def _generate_summary(self) -> Dict[str, Any]:
        """Generate comprehensive summary of scraped data"""
        if not self.jobs:
            return {}
        
        summary = {
            'total_jobs': len(self.jobs),
            'scraping_stats': self.scraping_stats,
            'timestamp': datetime.now().isoformat()
        }
        
        # Category analysis
        categories = Counter(job.category for job in self.jobs)
        summary['categories'] = dict(categories)
        
        # Seniority analysis
        seniority = Counter(job.seniority for job in self.jobs)
        summary['seniority'] = dict(seniority)
        
        # Platform analysis
        platforms = Counter(job.platform for job in self.jobs)
        summary['platforms'] = dict(platforms)
        
        # Salary analysis
        salaries = [job.salary_min for job in self.jobs if job.salary_min]
        if salaries:
            summary['salary_stats'] = {
                'min': min(salaries),
                'max': max(salaries),
                'avg': sum(salaries) / len(salaries),
                'count': len(salaries)
            }
        
        # Location analysis
        states = Counter(job.state for job in self.jobs if job.state)
        summary['top_states'] = dict(states.most_common(10))
        
        cities = Counter(job.city for job in self.jobs if job.city)
        summary['top_cities'] = dict(cities.most_common(10))
        
        # Quality analysis
        quality_scores = [job.data_quality_score for job in self.jobs]
        summary['quality_stats'] = {
            'avg_score': sum(quality_scores) / len(quality_scores),
            'min_score': min(quality_scores),
            'max_score': max(quality_scores)
        }
        
        return summary
    
    def print_summary(self):
        """Print a summary of the scraping results"""
        if not self.jobs:
            print("No jobs found")
            return
        
        print("\n" + "="*60)
        print("ENHANCED CRAWL4AI HEALTHCARE JOB SCRAPING SUMMARY")
        print("="*60)
        print(f"Total Jobs Found: {len(self.jobs)}")
        print(f"Sites Processed: {self.scraping_stats['sites_processed']}")
        print(f"Sites Successful: {self.scraping_stats['sites_successful']}")
        print(f"Sites Failed: {self.scraping_stats['sites_failed']}")
        print(f"Pages Scraped: {self.scraping_stats['pages_scraped']}")
        
        # Categories
        categories = Counter(job.category for job in self.jobs)
        print(f"\nJob Categories:")
        for category, count in categories.most_common():
            print(f"  {category.title()}: {count}")
        
        # Top states
        states = Counter(job.state for job in self.jobs if job.state)
        print(f"\nTop States:")
        for state, count in states.most_common(5):
            print(f"  {state}: {count}")
        
        # Quality score
        avg_quality = sum(job.data_quality_score for job in self.jobs) / len(self.jobs)
        print(f"\nAverage Data Quality Score: {avg_quality:.2f}")
        
        print("="*60)
    
    def _generate_spa_next_url_enhanced(self, current_url: str, platform: str, elem=None, next_page: Optional[int] = None) -> Optional[str]:
        """Enhanced SPA next URL generation with element analysis and better fallbacks"""
        try:
            parsed_url = urlparse(current_url)
            query_params = parse_qs(parsed_url.query)
            
            # If we have a specific next page number, use it
            if next_page is not None:
                # Try to find existing pagination parameter
                spa_params = ['page', 'p', 'spage', 'start', 'offset', 'pg', 'pagenum', 'page_number', 'listing_page']
                for param in spa_params:
                    if param in query_params:
                        new_query_params = query_params.copy()
                        new_query_params[param] = [str(next_page)]
                        new_query = '&'.join([f"{k}={v[0]}" for k, v in new_query_params.items()])
                        return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
                
                # Add new pagination parameter
                new_query_params = query_params.copy()
                new_query_params['page'] = [str(next_page)]
                new_query = '&'.join([f"{k}={v[0]}" for k, v in new_query_params.items()])
                return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
            
            # If we have an element, try to extract pagination info from it
            if elem and hasattr(elem, 'get'):
                # Try to extract page number from element attributes
                for attr_name in ['data-page', 'data-current-page', 'data-next-page']:
                    attr_value = elem.get(attr_name)
                    if attr_value and isinstance(attr_value, str):
                        try:
                            page_num = int(attr_value)
                            return self._generate_spa_next_url_enhanced(current_url, platform, next_page=page_num)
                        except ValueError:
                            continue
                
                # Try to extract from element text (e.g., "Page 2 of 10")
                elem_text = elem.get_text()
                page_match = re.search(r'page\s+(\d+)', elem_text, re.IGNORECASE)
                if page_match:
                    try:
                        page_num = int(page_match.group(1))
                        return self._generate_spa_next_url_enhanced(current_url, platform, next_page=page_num)
                    except ValueError:
                        pass
            
                # Try to extract from element text (e.g., "Page 2 of 10")
                elem_text = elem.get_text()
                page_match = re.search(r'page\s+(\d+)', elem_text, re.IGNORECASE)
                if page_match:
                    try:
                        page_num = int(page_match.group(1))
                        return self._generate_spa_next_url_enhanced(current_url, platform, next_page=page_num)
                    except ValueError:
                        pass
            
            # Otherwise, try to increment existing pagination parameter
            spa_params = ['page', 'p', 'spage', 'start', 'offset', 'pg', 'pagenum', 'page_number', 'listing_page']
            for param in spa_params:
                if param in query_params:
                    try:
                        current_value = int(query_params[param][0])
                        next_value = current_value + 1
                        
                        new_query_params = query_params.copy()
                        new_query_params[param] = [str(next_value)]
                        new_query = '&'.join([f"{k}={v[0]}" for k, v in new_query_params.items()])
                        
                        logger.info(f"Generated enhanced SPA next URL: {param}={current_value} -> {param}={next_value}")
                        return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
                    except (ValueError, IndexError):
                        continue
            
            # If no existing pagination parameter, add one
            new_query_params = query_params.copy()
            new_query_params['page'] = ['2']  # Start with page 2
            new_query = '&'.join([f"{k}={v[0]}" for k, v in new_query_params.items()])
            
            logger.info("Generated enhanced SPA next URL with new page parameter")
            return f"{parsed_url.scheme}://{parsed_url.netloc}{parsed_url.path}?{new_query}"
            
        except Exception as e:
            logger.error(f"Error generating enhanced SPA next URL: {str(e)}")
            return None
    
    def cleanup_existing_csv(self, input_filename: str, output_filename: str = None) -> None:
        """Clean up existing CSV file by reprocessing combined job entries"""
        if output_filename is None:
            output_filename = input_filename.replace('.csv', '_cleaned.csv')
        
        logger.info(f"Cleaning up CSV file: {input_filename}")
        
        cleaned_jobs = []
        processed_count = 0
        fixed_count = 0
        
        try:
            with open(input_filename, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                for row in reader:
                    processed_count += 1
                    
                    # Check if this is a problematic entry with multiple jobs
                    if self._is_combined_job_entry(row):
                        logger.info(f"Processing combined job entry: {row.get('title', 'Unknown')}")
                        
                        # Extract individual jobs from the description
                        individual_jobs = self._extract_individual_jobs_from_combined_entry(row)
                        
                        for job_data in individual_jobs:
                            # Create a new job object with the extracted data
                            job = self._create_job_object(job_data, {
                                'name': row.get('company', ''),
                                'platform': row.get('platform', ''),
                                'url': row.get('url', '')
                            })
                            if job:
                                cleaned_jobs.append(job)
                                fixed_count += 1
                    else:
                        # This is a normal single job entry, keep it as is
                        job = self._create_job_object(row, {
                            'name': row.get('company', ''),
                            'platform': row.get('platform', ''),
                            'url': row.get('url', '')
                        })
                        if job:
                            cleaned_jobs.append(job)
            
            # Save the cleaned jobs
            self.jobs = cleaned_jobs
            self.save_jobs(output_filename.replace('.csv', ''))
            
            logger.info(f"CSV cleanup completed:")
            logger.info(f"  - Processed entries: {processed_count}")
            logger.info(f"  - Fixed combined entries: {fixed_count}")
            logger.info(f"  - Total jobs after cleanup: {len(cleaned_jobs)}")
            logger.info(f"  - Output file: {output_filename}")
            
        except Exception as e:
            logger.error(f"Error cleaning up CSV file: {str(e)}")
    
    def _is_combined_job_entry(self, row: Dict) -> bool:
        """Check if a CSV row represents a combined job entry"""
        title = row.get('title', '').lower()
        description = row.get('description', '')
        
        # Check for patterns that indicate multiple jobs
        combined_patterns = [
            r'\d+\s+(?:certified nursing assistant|cnas?|nurses?|caregivers?|job listings?)',
            r'(?:job listings?|positions?|openings?)\s+(?:near|in|for)',
            r'##\s*\[.*?\]\(.*?\)',  # Multiple markdown headers with links
        ]
        
        for pattern in combined_patterns:
            if re.search(pattern, title, re.IGNORECASE) or re.search(pattern, description, re.IGNORECASE):
                return True
        
        # Check if description contains multiple job sections
        if description.count('## [') > 1:
            return True
        
        return False
    
    def _extract_individual_jobs_from_combined_entry(self, row: Dict) -> List[Dict]:
        """Extract individual job data from a combined entry"""
        jobs = []
        description = row.get('description', '')
        
        # Split by job headers (## [Job Title](URL))
        job_sections = re.split(r'(?=##\s*\[)', description)
        
        for section in job_sections:
            if not section.strip():
                continue
            
            # Extract job data from this section
            job_data = self._extract_job_from_section(section, {
                'name': row.get('company', ''),
                'platform': row.get('platform', ''),
                'url': row.get('url', '')
            })
            
            if job_data:
                # Preserve some metadata from the original row
                job_data['platform'] = row.get('platform', '')
                job_data['url'] = row.get('url', '')
                job_data['scraped_at'] = row.get('scraped_at', '')
                jobs.append(job_data)
        
        return jobs
    
    def _filter_jobs_by_date(self, jobs: List[JobData], days_old: int) -> List[JobData]:
        """Filter jobs older than a specified number of days"""
        cutoff_date = datetime.now() - timedelta(days=days_old)
        filtered_jobs = []
        
        for job in jobs:
            # Skip jobs without posted_date
            if not job.posted_date:
                continue
                
            try:
                # Try to parse the posted_date
                if isinstance(job.posted_date, str):
                    # Handle different date formats
                    if job.posted_date.isdigit():
                        # Unix timestamp
                        job_date = datetime.fromtimestamp(int(job.posted_date))
                    elif 'T' in job.posted_date:
                        # ISO format
                        job_date = datetime.fromisoformat(job.posted_date.replace('Z', '+00:00'))
                    else:
                        # Try common date formats
                        for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%B %d, %Y', '%b %d, %Y']:
                            try:
                                job_date = datetime.strptime(job.posted_date, fmt)
                                break
                            except ValueError:
                                continue
                        else:
                            # If no format matches, skip this job
                            continue
                    
                    # Only include jobs posted within the specified timeframe
                    if job_date >= cutoff_date:
                        filtered_jobs.append(job)
                        
            except (ValueError, TypeError) as e:
                # Skip jobs with invalid date formats
                logger.debug(f"Skipping job with invalid date format '{job.posted_date}': {e}")
                continue
        
        return filtered_jobs

async def main():
    """Main function to run the enhanced scraper with CT focus and date filtering"""
    # Initialize scraper with enhanced configuration
    scraper = EnhancedCrawl4AIHealthcareScraper(
        api_key="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",
        max_concurrent=2  # Conservative for pagination and anti-bot measures
    )
    
    try:
        # Filter sites - PRIORITIZE CT JOBS
        all_sites = scraper.site_configs
        
        # CT is PRIMARY TARGET - get all CT sites first
        ct_sites = [site for site in all_sites if site.get('state') == 'CT']
        
        # Other states are BONUS - get a limited number of non-CT sites
        other_sites = [site for site in all_sites if site.get('state') != 'CT']
        
        # Prioritize CT sites, then add some other states as bonus
        sites_to_scrape = ct_sites + other_sites[:10]  # Limit bonus sites to 10
        
        print(f"🎯 CT-FOCUSED SCRAPING CONFIGURATION:")
        print(f"  - CT sites (PRIMARY): {len(ct_sites)}")
        print(f"  - Other states (BONUS): {len(other_sites[:10])}")
        print(f"  - Total sites to scrape: {len(sites_to_scrape)}")
        print(f"  - Date filter: Jobs must be posted within last 60 days")
        
        # Show CT sites first
        print(f"\n📍 CT SITES (Primary Target):")
        for i, site in enumerate(ct_sites[:10]):  # Show first 10 CT sites
            platform = scraper._extract_platform_from_url(site['url'])
            platform_config = scraper.platform_configs.get(platform, scraper.platform_configs['custom'])
            print(f"  {i+1}. {site['name']} ({platform}) - {site.get('city', 'Unknown')}, CT")
        
        if len(ct_sites) > 10:
            print(f"  ... and {len(ct_sites) - 10} more CT sites")
        
        # Show bonus sites
        if other_sites[:10]:
            print(f"\n🎁 BONUS SITES (Other States):")
            for i, site in enumerate(other_sites[:5]):  # Show first 5 bonus sites
                platform = scraper._extract_platform_from_url(site['url'])
                print(f"  {i+1}. {site['name']} ({platform}) - {site.get('state', 'Unknown')}")
        
        print(f"\nAnti-bot measures: {len(scraper.user_agents)} user agents, {scraper.delay_between_requests}s base delay")
        
        # Option to test pagination on a CT site first
        test_pagination = input("\nTest pagination on first CT site? (y/n): ").lower().strip()
        if test_pagination == 'y' and ct_sites:
            test_site = ct_sites[0]['name']
            print(f"Testing pagination on CT site: {test_site}")
            test_result = await scraper.test_pagination_on_site(test_site, max_pages=30)
            print(f"Test result: {test_result}")
            
            if not test_result.get('pagination_working'):
                print("⚠️ Pagination test failed. Proceeding with full scrape anyway...")
        
        # Scrape sites with CT focus and date filtering
        jobs = await scraper.scrape_all_sites()  # Scrape all sites from CSV
        
        # Apply date filtering to exclude jobs older than 60 days
        print(f"\n📅 Applying date filter: Removing jobs older than 60 days...")
        filtered_jobs = scraper._filter_jobs_by_date(jobs, days_old=60)
        
        print(f"  - Jobs before date filter: {len(jobs)}")
        print(f"  - Jobs after date filter: {len(filtered_jobs)}")
        print(f"  - Jobs removed (too old): {len(jobs) - len(filtered_jobs)}")
        
        # Update scraper jobs with filtered results
        scraper.jobs = filtered_jobs
        
        # Save results with CT focus indicator
        scraper.save_jobs("enhanced_crawl4ai_jobs_ct_focused")
        
        # Print summary with CT focus stats
        scraper.print_summary()
        
        # Print CT-specific statistics
        ct_jobs = [job for job in filtered_jobs if job.state == 'CT']
        other_jobs = [job for job in filtered_jobs if job.state != 'CT']
        
        print(f"\n🎯 CT-FOCUSED RESULTS:")
        print(f"  - CT jobs: {len(ct_jobs)} ({len(ct_jobs)/len(filtered_jobs)*100:.1f}%)")
        print(f"  - Other states: {len(other_jobs)} ({len(other_jobs)/len(filtered_jobs)*100:.1f}%)")
        print(f"  - Total recent jobs: {len(filtered_jobs)}")
        
        # Print anti-bot statistics
        print(f"\nAnti-bot Statistics:")
        print(f"  User agents used: {len(scraper.user_agents)}")
        print(f"  Base delay: {scraper.delay_between_requests}s")
        print(f"  Max retries: {scraper.max_retries}")
        print(f"  Session timeout: {scraper.session_timeout}s")
        
    except Exception as e:
        logger.error(f"Error in main: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main()) 