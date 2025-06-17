import logging
from selenium_scraper import SeleniumScraper
import json
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def analyze_page_structure(scraper, html):
    """Analyze the page structure to find potential job listing elements."""
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    
    # Common job-related classes/IDs
    job_related_terms = ['job', 'career', 'position', 'listing', 'opening', 'vacancy']
    
    # Look for elements with job-related classes
    for term in job_related_terms:
        elements = soup.find_all(class_=lambda x: x and term.lower() in x.lower())
        if elements:
            logger.info(f"\nFound {len(elements)} elements with class containing '{term}'")
            if len(elements) > 0:
                logger.info("Sample element:")
                logger.info(f"Tag: {elements[0].name}")
                logger.info(f"Classes: {elements[0].get('class', [])}")
                logger.info(f"Text: {elements[0].get_text(strip=True)[:200]}")
                logger.info(f"HTML structure:")
                logger.info(elements[0].prettify()[:500])
    
    # Look for elements with job-related IDs
    for term in job_related_terms:
        elements = soup.find_all(id=lambda x: x and term.lower() in x.lower())
        if elements:
            logger.info(f"\nFound {len(elements)} elements with ID containing '{term}'")
            if len(elements) > 0:
                logger.info("Sample element:")
                logger.info(f"Tag: {elements[0].name}")
                logger.info(f"ID: {elements[0].get('id', '')}")
                logger.info(f"Text: {elements[0].get_text(strip=True)[:200]}")

def test_home_instead():
    """Test scraping Home Instead jobs."""
    url = "https://www.homeinstead.com/home-care-jobs/"
    
    # Initialize scraper in non-headless mode for debugging
    with SeleniumScraper(headless=False) as scraper:
        try:
            logger.info(f"Attempting to load URL: {url}")
            
            # First wait for any element to be present
            wait_for = {
                'by': 'css selector',
                'value': '.job-description-border, .score-style-box, .job-listing, .career-listing'  # Try multiple selectors
            }
            
            # Get page source
            html = scraper.get_page_source(url, wait_for)
            if not html:
                logger.error("Failed to get page source")
                return
            
            # Save HTML for debugging
            with open('debug_page.html', 'w', encoding='utf-8') as f:
                f.write(html)
            logger.info("Saved page source to debug_page.html")
            
            # Analyze page structure
            logger.info("\nAnalyzing page structure...")
            analyze_page_structure(scraper, html)
            
            # Based on analysis, define selectors
            selectors = {
                'container': [
                    'div.job-description-border',  # Found in previous run
                    'div.score-style-box',         # Found in previous run
                    'div[class*="job-description"]',
                    'div[class*="career-box"]',
                    'div[class*="position-box"]',
                    'div[class*="job-listing"]',
                    'div[class*="career-listing"]',
                    'div[class*="job-card"]',
                    'div[class*="career-card"]',
                    'article[class*="job"]',
                    'article[class*="career"]',
                    'div.list-unstyled',  # Try this as it was found in the HTML
                    'div.content-spot'     # Try this as it was found in the HTML
                ],
                'title': [
                    'h2',  # Try any h2 within the container
                    'h3',  # Try any h3 within the container
                    'h4',  # Try any h4 within the container
                    '.job-name',
                    '.position-title',
                    'strong',  # Sometimes titles are in bold
                    'div[class*="title"]',
                    '.job-title',
                    '.career-title',
                    'a[class*="job"]',  # Sometimes the title is in a link
                    'a[class*="career"]'
                ],
                'location': [
                    '.location',
                    'div[class*="location"]',
                    'span[class*="location"]',
                    'div[class*="address"]',
                    'p[class*="location"]',
                    '.job-location',
                    '.career-location',
                    'div[class*="area"]',
                    'span[class*="area"]'
                ],
                'description': [
                    '.job-description',
                    'div[class*="description"]',
                    'p[class*="description"]',
                    '.score-style-box p',  # Try paragraphs within score-style-box
                    '.content-spot p',     # Try paragraphs within content-spot
                    'p',                   # Try any paragraph as fallback
                    '.job-details',
                    '.career-details'
                ],
                'url': [
                    'a[href*="apply"]',
                    'a[href*="job"]',
                    'a[href*="career"]',
                    'a[class*="apply"]',
                    'a[class*="job"]',
                    'a[href*="position"]',
                    'a[href*="opening"]',
                    'a[href*="vacancy"]',
                    'a[class*="cta"]',  # Common for Call-To-Action links
                    'a'  # Fallback to any link in the container
                ]
            }
            
            # Try each container selector
            jobs = []
            for container_selector in selectors['container']:
                logger.info(f"\nTrying container selector: {container_selector}")
                
                # Update selectors dictionary for this attempt
                current_selectors = {
                    'container': container_selector,
                    'title': ', '.join(selectors['title']),
                    'location': ', '.join(selectors['location']),
                    'description': ', '.join(selectors['description']),
                    'url': ', '.join(selectors['url'])
                }
                
                # Extract jobs with current selectors
                current_jobs = scraper.extract_jobs(html, current_selectors)
                if current_jobs:
                    logger.info(f"Found {len(current_jobs)} jobs with this selector!")
                    
                    # Check if these are new unique jobs
                    for job in current_jobs:
                        # Only add if we don't already have this job (check by title)
                        if not any(existing_job['title'] == job['title'] for existing_job in jobs):
                            jobs.append(job)
            
            # Log results
            logger.info(f"\nFound total of {len(jobs)} unique jobs")
            
            if jobs:
                # Save to file for inspection
                with open('home_instead_jobs.json', 'w') as f:
                    json.dump(jobs, f, indent=2)
                logger.info("Saved jobs to home_instead_jobs.json")
                
                # Print first job as sample
                logger.info("\nSample job:")
                for key, value in jobs[0].items():
                    logger.info(f"{key}: {value}")
            
        except Exception as e:
            logger.error(f"Error in test: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())

if __name__ == "__main__":
    test_home_instead() 