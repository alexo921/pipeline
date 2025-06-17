import os
import pandas as pd
from urllib.parse import urlparse, parse_qs
import time
import random
import traceback
from datetime import datetime
from typing import List, Dict, Any
import logging
from selenium_scraper import SeleniumScraper

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_domain(url: str) -> str:
    """Extract domain from URL."""
    try:
        return urlparse(url).netloc
    except:
        return 'unknown'

def save_jobs(jobs: List[Dict[str, Any]], filename: str) -> None:
    """Save jobs to a JSON file."""
    try:
        # Create output directory if it doesn't exist
        os.makedirs('output', exist_ok=True)
        
        # Save to JSON file
        output_file = os.path.join('output', f'{filename}.json')
        pd.DataFrame(jobs).to_json(output_file, orient='records', indent=2)
        logger.info(f"Saved {len(jobs)} jobs to {output_file}")
        
    except Exception as e:
        logger.error(f"Error saving jobs: {str(e)}")

def filter_connecticut_urls(urls: List[str], df: pd.DataFrame) -> List[str]:
    """Filter URLs to only include Connecticut-related ones and deduplicate them."""
    # Remove duplicates while preserving order
    unique_urls = []
    seen = set()
    for url in urls:
        if url not in seen:
            unique_urls.append(url)
            seen.add(url)
    
    logger.info(f"Found {len(unique_urls)} unique URLs after deduplication")
    for i, url in enumerate(unique_urls, 1):
        logger.info(f"URL {i}: {url}")
    
    return unique_urls

def scrape_url(url: str, scraper: SeleniumScraper) -> List[Dict]:
    """Scrape a single URL for job listings."""
    try:
        # Log URL details
        parsed_url = urlparse(url)
        query_params = parse_qs(parsed_url.query)
        logger.info(f"Processing URL: {url}")
        logger.info(f"Domain: {parsed_url.netloc}")
        logger.info(f"Query parameters: {query_params}")
        
        # Get the source site and scrape jobs
        jobs = scraper.scrape_jobs(url)
        
        if jobs:
            logger.info(f"Successfully scraped {len(jobs)} jobs from {url}")
            return jobs
        else:
            logger.warning(f"No jobs found at {url}")
            return []
            
    except Exception as e:
        logger.error(f"Error scraping URL {url}: {str(e)}")
        logger.error(traceback.format_exc())
        return []

def main():
    """Main function to read URLs from Excel and scrape each one."""
    try:
        # Read URLs from Excel file
        df = pd.read_excel('Job Board Data Scrape.xlsx')
        all_urls = df['search_url'].dropna().tolist()
        
        # Filter for Connecticut URLs
        urls = filter_connecticut_urls(all_urls, df)
        # Take only first 5 URLs for testing
        urls = urls[:5]
        logger.info(f"Testing with first {len(urls)} unique URLs")
        
        # Initialize scraper with anti-detection measures
        with SeleniumScraper(headless=False) as scraper:
            all_jobs = []
            
            # Create debug directory
            debug_dir = os.path.join('output', 'debug')
            os.makedirs(debug_dir, exist_ok=True)
            
            # Scrape each URL
            for i, url in enumerate(urls, 1):
                logger.info(f"\nProcessing URL {i} of {len(urls)}")
                logger.info("-" * 50)
                
                try:
                    # Get source site and other metadata
                    row = df[df['search_url'] == url].iloc[0]
                    source_site = row['source_site']
                    role = row['role']
                    state = row['state']
                    city = row['city']
                    
                    logger.info(f"Source site: {source_site}")
                    logger.info(f"Role: {role}")
                    logger.info(f"Location: {city}, {state}")
                    
                    # Scrape the URL
                    jobs = scrape_url(url, scraper)
                    
                    if not jobs:
                        continue
                    
                    # Add metadata to jobs
                    for job in jobs:
                        job['source_site'] = source_site
                        job['target_role'] = role
                        job['target_state'] = state
                        job['target_city'] = city
                    
                    all_jobs.extend(jobs)
                    
                    # Save intermediate results
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    save_jobs(jobs, f'jobs_{get_domain(url)}_{timestamp}')
                    
                    # Add a random delay between sites
                    if i < len(urls):
                        delay = random.uniform(5, 10)  # Longer delay between sites
                        logger.info(f"Waiting {delay:.1f} seconds before next site...")
                        time.sleep(delay)
                        
                except Exception as e:
                    logger.error(f"Error processing URL {url}: {str(e)}")
                    logger.error(traceback.format_exc())
                    continue
            
            # Save all results together
            if all_jobs:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                save_jobs(all_jobs, f'test_connecticut_jobs_{timestamp}')
                
                logger.info(f"\nScraping Summary:")
                logger.info("-" * 40)
                for url in urls:
                    domain = get_domain(url)
                    count = len([j for j in all_jobs if get_domain(j['source_url']) == domain])
                    logger.info(f"{domain}: {count} jobs")
                logger.info("-" * 40)
                logger.info(f"Total: {len(all_jobs)} jobs")
            else:
                logger.warning("No jobs were found from any URL")
        
    except Exception as e:
        logger.error(f"Error during execution: {str(e)}")
        logger.error(traceback.format_exc())
        raise

if __name__ == '__main__':
    main() 