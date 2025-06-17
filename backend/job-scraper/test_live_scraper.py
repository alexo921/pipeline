import logging
from selenium_scraper import SeleniumScraper, JobData
import json
from datetime import datetime
from typing import List, Dict, Any
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def save_jobs(jobs: List[Dict[str, Any]], filename: str):
    """Save jobs to both JSON and human-readable formats."""
    # Save as JSON
    with open(filename + '.json', 'w') as f:
        json.dump(jobs, f, indent=2)
    
    # Save as human-readable text
    with open(filename + '.txt', 'w') as f:
        f.write(f"Job Listings Report - Generated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total Jobs Found: {len(jobs)}\n\n")
        
        for job in jobs:
            f.write("="*80 + "\n")
            f.write(f"Title: {job.get('title', 'N/A')}\n")
            f.write(f"Company: {job.get('company', 'N/A')}\n")
            f.write(f"Location: {job.get('location', 'N/A')}\n")
            
            # Add salary information if available
            if any(key in job for key in ['salary_min', 'salary_max', 'salary_period']):
                salary_info = []
                if job.get('salary_min') == job.get('salary_max'):
                    salary_info.append(f"${job['salary_min']:,.2f}")
                elif job.get('salary_min') and job.get('salary_max'):
                    salary_info.append(f"${job['salary_min']:,.2f} - ${job['salary_max']:,.2f}")
                if job.get('salary_period'):
                    salary_info.append(f"per {job['salary_period']}")
                if salary_info:
                    f.write(f"Salary: {' '.join(salary_info)}\n")
            
            if job.get('job_type'):
                f.write(f"Type: {job['job_type']}\n")
            
            f.write(f"URL: {job.get('url', 'N/A')}\n")
            f.write(f"Scraped: {job.get('scraped_date', 'N/A')}\n")
            f.write("\nDescription:\n")
            f.write(f"{job.get('description', 'No description available.')}\n")
            
            if job.get('requirements'):
                f.write("\nRequirements:\n")
                for req in job['requirements']:
                    f.write(f"- {req}\n")
            
            f.write("="*80 + "\n\n")

def scrape_home_instead():
    """Scrape Home Instead jobs with all new features."""
    url = "https://www.homeinstead.com/home-care-jobs/"
    
    with SeleniumScraper(headless=False) as scraper:
        try:
            logger.info(f"Starting scrape of {url}")
            
            # Wait for job elements
            wait_for = {
                'by': 'css selector',
                'value': '.job-description-border, .score-style-box, .job-listing, .career-listing'
            }
            
            # Get page source
            html = scraper.get_page_source(url, wait_for)
            if not html:
                logger.error("Failed to get page source")
                return
            
            # Save debug HTML
            with open('debug_page.html', 'w') as f:
                f.write(html)
            
            # Detect site type
            site_type = scraper._detect_site_type(url, html)
            logger.info(f"Detected site type: {site_type}")
            
            # Define selectors based on site type
            selectors = {
                'container': 'div.job-description-border',
                'title': 'h3',
                'description': 'p',
                'location': None,  # We'll use our advanced location detection
                'company': None,  # We'll set this to Home Instead
                'url': None  # We'll construct this from the base URL
            }
            
            # Extract jobs
            jobs = scraper.extract_jobs(html, selectors)
            logger.info(f"Found {len(jobs)} jobs")
            
            # Process each job through JobData for validation and enhancement
            processed_jobs = []
            for job in jobs:
                try:
                    # Add company name and base URL
                    job['company'] = 'Home Instead'
                    if not job.get('url'):
                        job['url'] = url
                    
                    # Add scraped date
                    job['scraped_date'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    
                    # Try to extract salary information from description
                    try:
                        if job.get('description'):
                            salary_info = scraper._parse_salary(job['description'])
                            if salary_info:
                                job.update(salary_info)
                    except (AttributeError, TypeError, ValueError):
                        # If salary parsing fails, continue without salary info
                        logger.warning(f"Could not parse salary for job: {job['title']}")
                    
                    # Create JobData instance for validation and cleaning
                    job_data = JobData(
                        title=job['title'],
                        company=job['company'],
                        location=job.get('location', 'Multiple Locations'),
                        description=job.get('description', ''),
                        posted_date=None,  # No posted date available
                        url=job['url'],
                        source=site_type,
                        scraped_date=job['scraped_date'],
                        salary_min=job.get('salary_min'),
                        salary_max=job.get('salary_max'),
                        salary_period=job.get('salary_period')
                    )
                    
                    # Convert back to dict and add to processed jobs
                    processed_jobs.append(job_data.to_dict())
                    logger.info(f"Successfully processed job: {job['title']}")
                    
                except Exception as e:
                    logger.error(f"Error processing job {job.get('title', 'Unknown')}: {str(e)}")
                    continue
            
            # Save results
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            save_jobs(processed_jobs, f'jobs_output_{timestamp}')
            logger.info(f"Saved {len(processed_jobs)} jobs to output files")
            
            return processed_jobs
            
        except Exception as e:
            logger.error(f"Error during scraping: {str(e)}")
            return None

def main():
    """Run the live scraper test."""
    try:
        logger.info("Starting live scraper test...")
        jobs = scrape_home_instead()
        if jobs:
            logger.info(f"Successfully scraped {len(jobs)} jobs")
            
            # Print sample job
            if jobs:
                logger.info("\nSample job:")
                for key, value in jobs[0].items():
                    logger.info(f"{key}: {value}")
        
    except Exception as e:
        logger.error(f"Error during testing: {str(e)}")

if __name__ == "__main__":
    main() 