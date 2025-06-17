from selenium_scraper import JobData
import requests
from typing import List, Dict, Any, Optional
import logging
import time
import re
import json
from datetime import datetime
from urllib.parse import urlencode
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class MyCNAJobsScraper:
    """Scraper for myCNAjobs website using direct HTTP requests."""
    
    BASE_URL = "https://www.mycnajobs.com"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        })
        
    def _parse_salary(self, text: str) -> Dict[str, Any]:
        """Parse salary information from text."""
        if not text:
            return {}
            
        # Common patterns for salary ranges
        patterns = [
            r'\$(\d+(?:\.\d+)?)\s*(?:-\s*\$?(\d+(?:\.\d+)?))?\s*(?:per\s+|\/)?(?:hour|hr|h)',
            r'\$(\d+(?:\.\d+)?)\s*(?:-\s*\$?(\d+(?:\.\d+)?))?\s*(?:per\s+|\/)?(?:year|yr|annually)',
            r'(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?\s*(?:per\s+|\/)?(?:hour|hr|h)',
            r'(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?\s*(?:per\s+|\/)?(?:year|yr|annually)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                min_salary = float(match.group(1))
                max_salary = float(match.group(2)) if match.group(2) else min_salary
                period = 'hourly' if any(x in match.group(0).lower() for x in ['hour', 'hr', 'h']) else 'yearly'
                
                # Ensure min_salary is less than max_salary
                if min_salary > max_salary:
                    min_salary, max_salary = max_salary, min_salary
                    
                return {
                    'salary_min': min_salary,
                    'salary_max': max_salary,
                    'salary_period': period
                }
        return {}
        
    def _get_search_url(self, page: int = 1) -> str:
        """Get the search URL for the given page."""
        if page == 1:
            return f"{self.BASE_URL}/search-results-jobs/?q=connecticut"
        return f"{self.BASE_URL}/search-results-jobs/?q=connecticut&page={page}"
        
    def _get_job_details(self, url: str) -> Dict[str, Any]:
        """Get detailed job information from the job's page.
        
        Args:
            url: The URL of the job listing page
            
        Returns:
            Dictionary containing detailed job information
        """
        try:
            response = self.session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Save the job page HTML for debugging
            with open(f'debug_job_page_{int(time.time())}.html', 'w') as f:
                f.write(soup.prettify())
            
            details = {}
            
            # Extract job description
            description_element = soup.select_one('.job-description, #job-description, .description, .job-details, .job-content')
            if description_element:
                details['description'] = description_element.get_text(strip=True)
            
            # Extract requirements
            requirements_element = soup.select_one('.job-requirements, .requirements, .qualifications')
            if requirements_element:
                details['requirements'] = requirements_element.get_text(strip=True)
            
            # Extract benefits
            benefits_element = soup.select_one('.benefits-info, .perks, .benefits')
            if benefits_element:
                details['benefits'] = benefits_element.get_text(strip=True)
            
            # Extract salary information
            salary_element = soup.select_one('.salary-info, .compensation, .pay-rate')
            if salary_element:
                salary_text = salary_element.get_text(strip=True)
                details.update(self._parse_salary(salary_text))
            
            # Extract employment type
            job_type_element = soup.select_one('.employment-type, .job-type, .position-type')
            if job_type_element:
                details['job_type'] = job_type_element.get_text(strip=True)
            
            # Extract shift information
            shift_element = soup.select_one('.shift-info, .shift-details, .schedule')
            if shift_element:
                details['shift'] = shift_element.get_text(strip=True)
            
            # Extract experience requirements
            experience_element = soup.select_one('.experience-requirements, .experience')
            if experience_element:
                details['experience_required'] = experience_element.get_text(strip=True)
            
            # Extract certification requirements
            certification_element = soup.select_one('.certifications, .certification-requirements')
            if certification_element:
                details['certifications_required'] = certification_element.get_text(strip=True)
            
            return details
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting job details from {url}: {str(e)}")
            return {}
            
        except Exception as e:
            logger.error(f"Unexpected error getting job details from {url}: {str(e)}")
            return {}
        
    def _clean_company_name(self, company: str) -> str:
        """Clean company name by removing posted date and extra whitespace."""
        if not company:
            return None
        # Remove "Posted X days ago" and similar text
        company = re.sub(r'Posted.*ago', '', company)
        return company.strip()

    def _clean_description(self, description: str) -> str:
        """Clean and format job description."""
        if not description:
            return None
            
        # Extract and remove location and job type information at the start
        location_match = re.match(r'^Competitive([^A-Z]+)', description)
        if location_match:
            description = description[len(location_match.group(0)):]
            
        # Replace Unicode characters
        description = description.replace('\u2013', '-')
        description = description.replace('\u2019', "'")
        description = description.replace('\u00a0', ' ')
        
        # Remove multiple spaces
        description = re.sub(r'\s+', ' ', description)
        
        # Remove URLs
        description = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', description)
        
        # Remove "APPLY ONLINE TODAY" and similar text
        description = re.sub(r'APPLY ONLINE TODAY!.*', '', description)
        description = re.sub(r'Or call us at.*', '', description)
        
        # Clean up newlines
        description = re.sub(r'\n\s*\n', '\n\n', description)
        
        return description.strip()

    def _extract_location(self, text: str) -> Dict[str, str]:
        """Extract location information from text."""
        if not text:
            return {}
            
        # Look for city and state in common formats
        location_patterns = [
            r'(?:in|at|near|,)?\s*([A-Z][a-zA-Z\s-]+),?\s*([A-Z]{2})\s*(\d{5})?',
            r'(?:in|at|near|,)?\s*([A-Z][a-zA-Z\s-]+)\s+area',
            r'Location:\s*([A-Z][a-zA-Z\s-]+),?\s*([A-Z]{2})'
        ]
        
        for pattern in location_patterns:
            match = re.search(pattern, text)
            if match:
                location = {
                    'city': match.group(1).strip() if match.group(1) else None,
                    'state': match.group(2).strip() if len(match.groups()) > 1 and match.group(2) else None,
                    'zip': match.group(3).strip() if len(match.groups()) > 2 and match.group(3) else None
                }
                return {k: v for k, v in location.items() if v}
        return {}

    def _extract_structured_data(self, description: str) -> Dict[str, Any]:
        """Extract structured data from job description."""
        data = {}
        
        # Extract job type
        job_type_patterns = [
            r'(Full[- ]Time|Part[- ]Time|Contract|Temporary|Per[- ]Diem)',
            r'Employment Type:\s*(.*?)(?:\n|$)',
            r'Position Type:\s*(.*?)(?:\n|$)'
        ]
        for pattern in job_type_patterns:
            match = re.search(pattern, description, re.IGNORECASE)
            if match:
                data['job_type'] = match.group(1).strip()
                break
        
        # Extract job duties
        duties_section = None
        duties_patterns = [
            r'Job Duties[^:]*:(.+?)(?=(?:Requirements|Qualifications|Benefits|We Offer|What We Offer|$))',
            r'Duties[^:]*:(.+?)(?=(?:Requirements|Qualifications|Benefits|We Offer|What We Offer|$))',
            r'Responsibilities[^:]*:(.+?)(?=(?:Requirements|Qualifications|Benefits|We Offer|What We Offer|$))'
        ]
        for pattern in duties_patterns:
            match = re.search(pattern, description, re.IGNORECASE | re.DOTALL)
            if match:
                duties_section = match.group(1).strip()
                break
                
        if duties_section:
            duties = []
            for duty in re.split(r'[•\n]', duties_section):
                duty = duty.strip()
                if duty and not any(x in duty.lower() for x in ['apply online', 'call us', 'following']):
                    duties.append(duty)
            if duties:
                data['duties'] = duties
        
        # Extract requirements
        req_section = None
        req_patterns = [
            r'Requirements[^:]*:(.+?)(?=(?:Benefits|We Offer|What We Offer|Job Duties|Duties|Responsibilities|$))',
            r'Qualifications[^:]*:(.+?)(?=(?:Benefits|We Offer|What We Offer|Job Duties|Duties|Responsibilities|$))',
            r'Job Requirements[^:]*:(.+?)(?=(?:Benefits|We Offer|What We Offer|Job Duties|Duties|Responsibilities|$))'
        ]
        for pattern in req_patterns:
            match = re.search(pattern, description, re.IGNORECASE | re.DOTALL)
            if match:
                req_section = match.group(1).strip()
                break
                
        if req_section:
            reqs = []
            for req in re.split(r'[•\n]', req_section):
                req = req.strip()
                if req and not any(x in req.lower() for x in ['apply online', 'call us', 'enjoy the following', 'benefits']):
                    reqs.append(req)
            if reqs:
                data['requirements'] = reqs
        
        # Extract benefits
        benefits_section = None
        benefits_patterns = [
            r'Benefits[^:]*:(.+?)(?=(?:Requirements|Qualifications|Job Requirements|Job Duties|Duties|Responsibilities|$))',
            r'We Offer[^:]*:(.+?)(?=(?:Requirements|Qualifications|Job Requirements|Job Duties|Duties|Responsibilities|$))',
            r'What We Offer[^:]*:(.+?)(?=(?:Requirements|Qualifications|Job Requirements|Job Duties|Duties|Responsibilities|$))'
        ]
        for pattern in benefits_patterns:
            match = re.search(pattern, description, re.IGNORECASE | re.DOTALL)
            if match:
                benefits_section = match.group(1).strip()
                break
                
        if benefits_section:
            benefits = []
            for benefit in re.split(r'[•\n]', benefits_section):
                benefit = benefit.strip()
                if benefit and not any(x in benefit.lower() for x in ['apply online', 'call us', 'requirements', 'cna / hha', 'following']):
                    benefits.append(benefit)
            if benefits:
                data['benefits'] = benefits
        
        # Extract shift information
        shift_patterns = [
            r'(Day Shift|Night Shift|Evening Shift|Overnight|Weekday|Weekend)',
            r'Shift:\s*(.*?)(?:\n|$)',
            r'Schedule:\s*(.*?)(?:\n|$)'
        ]
        shifts = []
        for pattern in shift_patterns:
            matches = re.finditer(pattern, description, re.IGNORECASE)
            for match in matches:
                shift = match.group(1).strip()
                if shift and shift not in shifts:
                    shifts.append(shift)
        if shifts:
            data['shift'] = ', '.join(shifts)
        
        # Extract salary information from description
        salary_info = self._parse_salary(description)
        if salary_info:
            data.update(salary_info)
            
        # Extract location information
        location_info = self._extract_location(description)
        if location_info:
            data.update(location_info)
        
        return data

    def _extract_jobs_from_page(self, html: str) -> List[Dict[str, Any]]:
        """Extract job listings from the HTML of a search results page."""
        jobs = []
        soup = BeautifulSoup(html, 'html.parser')
        
        # Debug: Save the HTML for inspection
        with open(f'debug_page_{int(time.time())}.html', 'w') as f:
            f.write(soup.prettify())
            
        # Find all job listings
        job_elements = soup.select('.job-listing, .job-card, .job-result-card, .job-item, article.job')
        logger.info(f"Found {len(job_elements)} job elements")
        
        seen_urls = set()  # Track URLs to avoid duplicates
        
        for job_element in job_elements:
            try:
                # Extract job title and URL
                title_element = job_element.select_one('.job-title a, h3 a, .job-name a, h2 a, .title span')
                if not title_element:
                    logger.debug("No title element found")
                    continue
                    
                title = title_element.get_text(strip=True)
                
                # Get the URL from the job listing element itself or the title element
                url = job_element.get('href') or title_element.parent.get('href')
                if not url:
                    logger.debug("No URL found")
                    continue
                    
                if not url.startswith('http'):
                    url = f"{self.BASE_URL}{url}"
                
                # Skip duplicate URLs
                if url in seen_urls:
                    logger.debug(f"Skipping duplicate job: {url}")
                    continue
                seen_urls.add(url)
                    
                logger.debug(f"Processing job: {title} ({url})")
                
                # Extract basic information from the listing
                company_element = job_element.select_one('.company-name, .employer, .company')
                company = self._clean_company_name(company_element.get_text(strip=True) if company_element else None)
                
                location_element = job_element.select_one('.location, .job-location, .city-state')
                location = location_element.get_text(strip=True) if location_element else None
                
                # Get the preview description if available
                preview_desc_element = job_element.select_one('.description, .preview-description, .job-snippet')
                preview_description = preview_desc_element.get_text(strip=True) if preview_desc_element else None
                
                # Get posted date
                posted_date_element = job_element.select_one('.posted-date, .date-posted, .post-date')
                posted_date = posted_date_element.get_text(strip=True) if posted_date_element else None
                
                # Check for salary in title
                title_salary = self._parse_salary(title)
                
                # Get detailed job information
                logger.info(f"Fetching detailed information for job: {title}")
                job_details = self._get_job_details(url)
                
                # Clean and merge descriptions
                description = job_details.get('description', preview_description)
                description = self._clean_description(description)
                
                # Extract structured data from description
                structured_data = self._extract_structured_data(description)
                
                # Merge salary information (prefer title over description)
                salary_info = title_salary or structured_data
                
                # Extract location information from various sources
                location_info = {}
                if location:
                    location_info = self._extract_location(location)
                if not location_info:
                    location_info = structured_data.get('city') and structured_data
                
                # Create JobData instance with all available information
                job_data = JobData(
                    title=title,
                    company=company,
                    location=location,
                    description=description,
                    url=url,
                    source="myCNAjobs",
                    scraped_date=time.strftime("%Y-%m-%d"),
                    posted_date=posted_date,
                    job_type=structured_data.get('job_type', job_details.get('job_type')),
                    duties=structured_data.get('duties'),
                    requirements=structured_data.get('requirements', job_details.get('requirements')),
                    benefits=structured_data.get('benefits', job_details.get('benefits')),
                    shift=structured_data.get('shift', job_details.get('shift')),
                    experience_required=job_details.get('experience_required'),
                    certifications_required=job_details.get('certifications_required'),
                    salary_min=salary_info.get('salary_min'),
                    salary_max=salary_info.get('salary_max'),
                    salary_period=salary_info.get('salary_period'),
                    city=location_info.get('city'),
                    state=location_info.get('state'),
                    zip_code=location_info.get('zip')
                )
                
                jobs.append(job_data.to_dict())
                logger.info(f"Successfully scraped job: {title}")
                
                # Add a small delay between job detail requests
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Error extracting job data: {str(e)}")
                continue
                
        return jobs
        
    def _has_next_page(self, html: str) -> bool:
        """Check if there is a next page of results."""
        soup = BeautifulSoup(html, 'html.parser')
        next_button = soup.select_one('a.next-page:not(.disabled), .pagination .next:not(.disabled), a[rel="next"], .next a')
        return bool(next_button and 'disabled' not in next_button.get('class', []))
        
    def scrape_jobs(self) -> List[Dict[str, Any]]:
        """Scrape CNA jobs in Connecticut."""
        all_jobs = []
        page = 1
        max_pages = 10
        seen_urls = set()
        
        while page <= max_pages:
            logger.info(f"Fetching page {page}")
            
            try:
                # Get the search results page
                url = self._get_search_url(page)
                logger.debug(f"Fetching URL: {url}")
                
                response = self.session.get(url)
                response.raise_for_status()
                
                # Extract jobs from the page
                jobs = self._extract_jobs_from_page(response.text)
                logger.info(f"Found {len(jobs)} jobs on page {page}")
                
                # Add new jobs to the list
                for job in jobs:
                    if job['url'] not in seen_urls:
                        all_jobs.append(job)
                        seen_urls.add(job['url'])
                        
                # Check if we should continue to the next page
                if not jobs or not self._has_next_page(response.text):
                    logger.info("No more pages to scrape")
                    break
                    
                # Add delay between pages
                time.sleep(2)
                page += 1
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Error fetching page {page}: {str(e)}")
                break
                
        return all_jobs

def main():
    """Main function to run the scraper."""
    # Configure logging
    logging.basicConfig(
        level=logging.DEBUG,  # Set to DEBUG for more detailed logging
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    scraper = MyCNAJobsScraper()
    jobs = scraper.scrape_jobs()
    
    # Save results
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    output_file = f"jobs_output_{timestamp}.json"
    
    with open(output_file, 'w') as f:
        json.dump(jobs, f, indent=2)
        
    print(f"\nScraping completed!")
    print(f"Total jobs scraped: {len(jobs)}")
    print(f"Results saved to: {output_file}")
    print(f"Debug HTML saved to: debug_page.html")

if __name__ == "__main__":
    main() 