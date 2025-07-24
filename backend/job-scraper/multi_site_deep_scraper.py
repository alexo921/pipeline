#!/usr/bin/env python3
"""
Multi-Site Deep Scraper (Crawl4AI Style)
========================================

- Reads multi.csv for target job sites
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
from datetime import datetime, timedelta
from typing import List, Dict, Any
import random
import asyncio
from playwright.async_api import async_playwright
from urllib.parse import urljoin

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SURROUNDING_STATES = {"CT", "NY", "MA", "RI", "NJ", "NH", "VT", "PA"}

SELECTOR_MAP = {
    "myCNAjobs": {
        "card": "a.priorityListing",
        "link": None,  # Use the card's href
        "title": ".title span",
        "company": ".company-name",
        "location": ".location span span:first-child",
        "city": ".location span span:first-child",
        "state": ".location span span:last-child",
        "date_posted": ".posted-date",
        "description": ".description",
        "apply": None,  # Use job_url
        # Detail page selectors (will be updated after testing)
        "detail_title": "h1, .job-title",
        "detail_company": ".employer-name, .company-name",
        "detail_location": ".job-location, .location",
        "detail_description": ".job-description, .description",
        "detail_apply": ".apply-button, .btn-apply",
        "detail_salary": ".gray-box-list li:first-child"
    },
    "RydersHealth": {
        "card": ".job-listing, div.job",
        "link": "a",
        "title": ".job-title, h2",
        "company": ".company, h1, h2",
        "location": ".location",
        "date_posted": ".date, .posted-date",
        "salary": ".salary",
        "description": ".description",
        "apply": "a.apply, .apply-button",
        "detail_title": "h1, .job-title",
        "detail_company": ".employer-name, .company-name",
        "detail_location": ".job-location, .location",
        "detail_description": ".job-description, .description",
        "detail_apply": ".apply-button, .btn-apply",
        "detail_salary": ".gray-box-list li:first-child"
    },
    "Atlas Healthcare": {
        "card": ".job-listing, div.career-listing",
        "link": "a",
        "title": ".job-title, h2",
        "company": ".company, h1, h2",
        "location": ".location",
        "date_posted": ".date, .posted-date",
        "salary": ".salary",
        "description": ".description",
        "apply": "a.apply, .apply-button",
        "detail_title": "h1, .job-title",
        "detail_company": ".employer-name, .company-name",
        "detail_location": ".job-location, .location",
        "detail_description": ".job-description, .description",
        "detail_apply": ".apply-button, .btn-apply",
        "detail_salary": ".gray-box-list li:first-child"
    }
}

class MultiSiteDeepScraper:
    def __init__(self, csv_path: str, max_sites: int = 0):
        self.csv_path = csv_path
        self.max_sites = max_sites if max_sites > 0 else None
        self.sites = self._load_sites()
        self.results: List[Dict[str, Any]] = []

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

    async def deep_scrape_site(self, site: Dict[str, str], max_pages: int = 5):
        base_url = site["search_url"]
        site_name = site["source_site"]
        selectors = SELECTOR_MAP.get(site_name, SELECTOR_MAP["myCNAjobs"])  # fallback
        logger.info(f"[Playwright] Scraping {site_name} - up to {max_pages} pages")
        jobs = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            for page_num in range(1, max_pages + 1):
                # Construct page URL
                if "page=" in base_url:
                    page_url = base_url.replace("page=1", f"page={page_num}")
                else:
                    page_url = f"{base_url}&page={page_num}" if "?" in base_url else f"{base_url}?page={page_num}"
                
                logger.info(f"Scraping page {page_num}: {page_url}")
                
                page = await browser.new_page()
                
                # Set user agent to avoid detection
                await page.set_extra_http_headers({
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                })
                
                try:
                    await page.goto(page_url, timeout=60000)
                    
                    # Wait for content to load
                    await page.wait_for_timeout(5000)
                    
                    # Try to wait for job-related content
                    try:
                        await page.wait_for_selector(selectors["card"], timeout=10000)
                    except:
                        logger.warning(f"No job-related selectors found on page {page_num} for {site_name}")
                        await page.close()
                        continue
                    
                    # Save page HTML for debugging (only first page)
                    if page_num == 1:
                        html_content = await page.content()
                        with open(f"debug_{site_name.lower().replace(' ', '_')}.html", "w", encoding="utf-8") as f:
                            f.write(html_content)
                        logger.info(f"Saved debug HTML for {site_name}")
                    
                    # Try multiple selector strategies
                    job_cards = await page.query_selector_all(selectors["card"])
                    
                    if not job_cards:
                        logger.warning(f"No job cards found on page {page_num} for {site_name}")
                        await page.close()
                        continue
                    
                    logger.info(f"Processing {len(job_cards)} job cards on page {page_num} for {site_name}")
                    
                    # Process all job cards on this page
                    for i, card in enumerate(job_cards):
                        try:
                            # For myCNAjobs, the card itself is the link
                            job_url = await card.get_attribute("href")
                            if not job_url:
                                continue
                            job_url = job_url if job_url.startswith("http") else urljoin(page_url, job_url)
                            logger.info(f"Job URL: {job_url}")
                            
                            # First, extract basic info from the job card
                            async def get_card_text(selector):
                                if not selector:
                                    return ""
                                try:
                                    elem = await card.query_selector(selector)
                                    if elem:
                                        text = await elem.inner_text()
                                        if text.strip():
                                            return text.strip()
                                except:
                                    return ""
                            
                            # Extract basic info from card
                            card_title = await get_card_text(selectors["title"])
                            card_company = await get_card_text(selectors["company"])
                            card_location = await get_card_text(selectors["location"])
                            card_city = await get_card_text(selectors["city"])
                            card_state = await get_card_text(selectors["state"])
                            card_date = await get_card_text(selectors["date_posted"])
                            card_description = await get_card_text(selectors["description"])
                            
                            # Now get detailed info from the job page
                            job_page = await browser.new_page()
                            await job_page.set_extra_http_headers({
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                            })
                            
                            await job_page.goto(job_url, timeout=30000)
                            await job_page.wait_for_timeout(3000)
                            
                            # Extract details from job page with fallback to card data
                            async def get_detail_text(selector):
                                if not selector:
                                    return ""
                                try:
                                    elem = await job_page.query_selector(selector)
                                    if elem:
                                        text = await elem.inner_text()
                                        if text.strip():
                                            return text.strip()
                                except:
                                    return ""
                            
                            # Get detailed info, fallback to card info if not found
                            detail_title = await get_detail_text(selectors.get("detail_title", selectors["title"]))
                            detail_company = await get_detail_text(selectors.get("detail_company", selectors["company"]))
                            detail_location = await get_detail_text(selectors.get("detail_location", selectors["location"]))
                            detail_description = await get_detail_text(selectors.get("detail_description", selectors["description"]))
                            detail_salary = await get_detail_text(selectors.get("detail_salary", ""))
                            
                            # Enhanced salary extraction - also check title and description
                            salary_info = []
                            if detail_salary:
                                salary_info.append(detail_salary)
                            
                            # Check if salary info is in the title
                            if detail_title and any(keyword in detail_title.lower() for keyword in ['$', 'salary', 'pay', 'hour', 'annual', 'yearly']):
                                salary_info.append(f"Title: {detail_title}")
                            
                            # Check if salary info is in the description
                            if detail_description:
                                # Look for salary patterns in description
                                import re
                                salary_patterns = [
                                    r'\$\d+(?:,\d{3})*(?:\.\d{2})?(?:\s*-\s*\$\d+(?:,\d{3})*(?:\.\d{2})?)?(?:\s*/\s*(?:hour|hr|year|annum|month|week))?',
                                    r'\$\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:per\s+(?:hour|hr|year|annum|month|week|cycle))',
                                    r'(?:salary|pay|compensation|wage).*?\$\d+(?:,\d{3})*(?:\.\d{2})?',
                                ]
                                
                                for pattern in salary_patterns:
                                    matches = re.findall(pattern, detail_description, re.IGNORECASE)
                                    if matches:
                                        salary_info.extend(matches)
                            
                            # Combine all salary information
                            final_salary = " | ".join(salary_info) if salary_info else ""
                            
                            # Debug salary extraction
                            if final_salary:
                                logger.info(f"Found salary: {final_salary}")
                            else:
                                logger.info("No salary found")
                            
                            job = {
                                "title": detail_title or card_title,
                                "company": detail_company or card_company,
                                "location": detail_location or card_location,
                                "city": card_city,  # Usually only available on card
                                "state": card_state,  # Usually only available on card
                                "date_posted": card_date,  # Usually only available on card
                                "salary": final_salary,  # Enhanced salary extraction
                                "description": detail_description or card_description,
                                "url": job_url,
                                "apply_url": job_url,
                                "scraped_at": datetime.now().isoformat(),
                            }
                            
                            # Try to get apply URL from detail page
                            try:
                                apply_elem = await job_page.query_selector(selectors.get("detail_apply", selectors["apply"]))
                                if apply_elem:
                                    apply_url = await apply_elem.get_attribute("href")
                                    job["apply_url"] = apply_url if apply_url else job_url
                                else:
                                    job["apply_url"] = job_url
                            except:
                                job["apply_url"] = job_url
                            
                            jobs.append(job)
                            logger.info(f"Extracted job: {job['title'][:50]}...")
                            await job_page.close()
                            
                        except Exception as e:
                            logger.warning(f"Error scraping job card {i+1} on page {page_num}: {e}")
                            continue
                    
                    await page.close()
                    
                except Exception as e:
                    logger.warning(f"Error scraping page {page_num} for {site_name}: {e}")
                    await page.close()
                    continue
            
            await browser.close()
        logger.info(f"Scraped {len(jobs)} jobs from {site_name}")
        return jobs

    def run(self):
        logger.info(f"Starting deep scrape for {len(self.sites)} sites")
        all_jobs = []
        
        for i, site in enumerate(self.sites, 1):
            logger.info(f"Processing site {i}/{len(self.sites)}: {site['source_site']}")
            try:
                jobs = asyncio.run(self.deep_scrape_site(site))
                all_jobs.extend(jobs)
                logger.info(f"Completed {site['source_site']}: {len(jobs)} jobs")
                
                # Save intermediate results every 10 sites
                if i % 10 == 0:
                    self.results = all_jobs
                    self.save_results()
                    logger.info(f"Intermediate save: {len(all_jobs)} jobs collected so far")
                    
            except Exception as e:
                logger.error(f"Error processing site {site['source_site']}: {e}")
                continue
        
        self.results = all_jobs
        logger.info(f"Total jobs collected: {len(all_jobs)}")
        # Save final results
        self.save_results()
        logger.info("Deep scrape complete!")

    def save_results(self):
        # Save to JSON
        with open("multi_deep_results.json", "w", encoding="utf-8") as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        # Save to CSV (flatten fields)
        if self.results:
            keys = set()
            for job in self.results:
                keys.update(job.keys())
            with open("multi_deep_results.csv", "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=list(keys))
                writer.writeheader()
                writer.writerows(self.results)

if __name__ == "__main__":
    scraper = MultiSiteDeepScraper(csv_path="multi.csv", max_sites=0)  # 0 means all sites
    scraper.run() 