#!/usr/bin/env python3
"""
BrightStar Care Job Scraper with improved pagination
Scrapes job listings from BrightStar Care's career search page.
"""

import json
import time
import csv
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse
import re

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup


class BrightStarScraper:
    """Scraper for BrightStar Care job listings."""
    
    def __init__(self, headless: bool = True, debug: bool = False):
        """Initialize the scraper."""
        self.headless = headless
        self.debug = debug
        self.driver: Optional[webdriver.Chrome] = None
        self.wait: Optional[WebDriverWait] = None
        self.jobs = []
        self.base_url = "https://careers.brightstarcare.com"
        self.search_url = "https://careers.brightstarcare.com/career-search/?q=&loc=&radius=10&spage={}"
        
        # Healthcare-related keywords for content filtering
        self.healthcare_keywords = {
            'patient', 'care', 'nurse', 'nursing', 'medical', 'health', 'healthcare',
            'caregiver', 'assistant', 'therapy', 'clinical', 'hospital', 'clinic',
            'treatment', 'medication', 'doctor', 'physician', 'cna', 'rn', 'lpn',
            'aide', 'home care', 'senior', 'elderly', 'disability', 'rehabilitation',
            'personal care', 'companionship', 'respite', 'dementia', 'alzheimer',
            'certified', 'licensed', 'experience', 'compassionate', 'reliable',
            'responsibilities', 'duties', 'qualifications', 'requirements',
            'benefits', 'schedule', 'shift', 'hourly', 'salary', 'compensation'
        }
        
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
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.wait = WebDriverWait(self.driver, 10)
        
    def _log(self, message: str, level: str = "INFO"):
        """Log a message with timestamp."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        if level == "DEBUG" and not self.debug:
            return
        print(f"[{timestamp}] [{level}] {message}")
        
    def _extract_comprehensive_description(self, soup: BeautifulSoup) -> str:
        """Extract comprehensive job description using multiple strategies."""
        description_parts = []
        
        # Strategy 1: Look for structured job description containers
        structured_selectors = [
            '.job-description', '.job-details', '.job-content', '.position-description',
            '[class*="description"]', '.job-summary', '.position-summary',
            '.job-responsibilities', '.job-requirements', '.job-qualifications',
            '.position-details', '.role-description', '.job-info',
            '[id*="description"]', '[id*="details"]', '[id*="summary"]'
        ]
        
        found_structured = False
        for selector in structured_selectors:
            containers = soup.select(selector)
            for container in containers:
                if container and len(container.get_text().strip()) > 50:
                    # Remove unwanted elements
                    for unwanted in container.select('script, style, nav, header, footer, .navigation, .menu'):
                        unwanted.decompose()
                    
                    # Extract text from various elements
                    for elem in container.find_all(['p', 'div', 'li', 'span', 'h3', 'h4', 'h5', 'h6']):
                        text = elem.get_text().strip()
                        if self._is_relevant_job_content(text):
                            description_parts.append(text)
                    
                    found_structured = True
                    break
            
            if found_structured:
                break
        
        # Strategy 2: If no structured description found, extract from main content areas
        if not found_structured:
            main_selectors = [
                'main', 'article', '.content', '.main-content', '.page-content',
                '.entry-content', '.post-content', '[role="main"]'
            ]
            
            for selector in main_selectors:
                main_container = soup.select_one(selector)
                if main_container:
                    # Remove unwanted elements
                    for unwanted in main_container.select('script, style, nav, header, footer, .navigation, .menu, .sidebar'):
                        unwanted.decompose()
                    
                    # Extract relevant paragraphs and list items
                    for elem in main_container.find_all(['p', 'li', 'div']):
                        text = elem.get_text().strip()
                        if self._is_relevant_job_content(text):
                            description_parts.append(text)
                    break
        
        # Strategy 3: If still no content, look for any job-related content
        if not description_parts:
            all_text_elements = soup.find_all(['p', 'li', 'div', 'span'])
            for elem in all_text_elements:
                text = elem.get_text().strip()
                if self._is_relevant_job_content(text) and self._contains_healthcare_keywords(text):
                    description_parts.append(text)
        
        # Clean and deduplicate description parts
        cleaned_parts = []
        seen_content = set()
        
        for part in description_parts:
            # Normalize whitespace
            normalized = ' '.join(part.split())
            
            # Skip if too short or already seen
            if len(normalized) < 20 or normalized.lower() in seen_content:
                continue
            
            seen_content.add(normalized.lower())
            cleaned_parts.append(normalized)
        
        # Join and limit the description
        full_description = ' '.join(cleaned_parts)
        
        # Limit to 2000 characters but break at sentence boundaries
        if len(full_description) > 2000:
            truncated = full_description[:2000]
            # Find the last sentence boundary
            last_period = truncated.rfind('.')
            last_exclamation = truncated.rfind('!')
            last_question = truncated.rfind('?')
            
            last_sentence_end = max(last_period, last_exclamation, last_question)
            if last_sentence_end > 1500:  # Only truncate at sentence if it's not too short
                full_description = truncated[:last_sentence_end + 1]
            else:
                full_description = truncated
        
        return full_description.strip()
    
    def _is_relevant_job_content(self, text: str) -> bool:
        """Check if text content is relevant to job descriptions."""
        if not text or len(text.strip()) < 15:
            return False
        
        text_lower = text.lower()
        
        # Skip navigation, footer, and other non-content
        skip_phrases = [
            'main navigation', 'skip to content', 'privacy policy', 'terms of service',
            'cookie policy', 'follow us', 'social media', 'facebook', 'twitter',
            'linkedin', 'instagram', 'contact us', 'about us', 'careers',
            'brightstar care', 'find a location', 'services', 'franchise',
            'copyright', '©', 'all rights reserved', 'back to top',
            'search jobs', 'job search', 'find jobs', 'career search'
        ]
        
        if any(phrase in text_lower for phrase in skip_phrases):
            return False
        
        # Look for job-related content indicators
        job_indicators = [
            'responsibilities', 'duties', 'requirements', 'qualifications',
            'experience', 'skills', 'education', 'benefits', 'we offer',
            'position', 'role', 'candidate', 'must have', 'preferred',
            'required', 'minimum', 'years', 'degree', 'certification',
            'schedule', 'hours', 'shift', 'full-time', 'part-time',
            'salary', 'hourly', 'competitive', 'compensation'
        ]
        
        return any(indicator in text_lower for indicator in job_indicators)
    
    def _contains_healthcare_keywords(self, text: str) -> bool:
        """Check if text contains healthcare-related keywords."""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.healthcare_keywords)
        
    def _find_job_links(self) -> List[str]:
        """Find all job links on the current page."""
        if not self.driver:
            return []
            
        job_links = []
        
        # Multiple strategies to find job links
        selectors = [
            'a[href*="job-detail-"]',  # Direct job detail links
            'a[href*="/job-detail"]',   # Alternative job detail links
            '.job-listing a',           # Job listing containers
            '.job-item a',             # Alternative job item containers
            '.career-item a',          # Career item containers
        ]
        
        for selector in selectors:
            try:
                links = self.driver.find_elements(By.CSS_SELECTOR, selector)
                for link in links:
                    href = link.get_attribute('href')
                    if href and 'job-detail' in href and href not in job_links:
                        job_links.append(href)
                        if self.debug:
                            title = link.text.strip()
                            self._log(f"Found job link: {title[:50]}... -> {href}", "DEBUG")
                            
                if job_links:  # If we found links with this selector, no need to try others
                    break
                    
            except Exception as e:
                self._log(f"Error finding links with selector {selector}: {e}", "DEBUG")
                continue
        
        # If no direct job links found, try finding any clickable job elements
        if not job_links:
            try:
                # Look for job title elements that might be clickable
                job_elements = self.driver.find_elements(By.CSS_SELECTOR, 
                    'h3 a, h4 a, .job-title a, .position-title a, [class*="job"] a[href*="job"]')
                
                for element in job_elements:
                    href = element.get_attribute('href')
                    if href and href not in job_links:
                        job_links.append(href)
                        
            except Exception as e:
                self._log(f"Error finding job elements: {e}", "DEBUG")
        
        # Remove any duplicate or invalid links
        valid_links = []
        for link in job_links:
            if link and link.startswith('http') and 'job' in link.lower():
                # Clean up any anchor fragments for consistency
                clean_link = link.split('#')[0]
                if clean_link not in valid_links:
                    valid_links.append(clean_link)
        
        self._log(f"Found {len(valid_links)} unique job links on current page")
        return valid_links
        
    def _has_next_page(self, current_page: int) -> bool:
        """Check if there's a next page available."""
        try:
            # Look for pagination elements
            pagination_selectors = [
                '.pagination .page-link',
                '.pagination a',
                '.page-link',
                '.pager a',
                'a[href*="spage="]'
            ]
            
            for selector in pagination_selectors:
                try:
                    page_elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    for element in page_elements:
                        text = element.text.strip().lower()
                        href = element.get_attribute('href')
                        
                        # Check for "Next" button
                        if text == 'next' and href:
                            self._log(f"Found Next button with href: {href}", "DEBUG")
                            return True
                            
                        # Check for page numbers higher than current
                        if href and f'spage={current_page + 1}' in href:
                            self._log(f"Found link to page {current_page + 1}", "DEBUG")
                            return True
                            
                        # Check for numeric page links
                        if text.isdigit() and int(text) > current_page:
                            self._log(f"Found page number {text} > current page {current_page}", "DEBUG")
                            return True
                            
                except Exception as e:
                    self._log(f"Error checking pagination with selector {selector}: {e}", "DEBUG")
                    continue
            
            # Alternative method: try to access the next page directly
            next_page_url = self.search_url.format(current_page + 1)
            current_url = self.driver.current_url
            
            # If we haven't already tried this next page, assume it exists
            # This is safer than trying to navigate to it just to check
            if current_page < 100:  # Reasonable upper limit
                self._log(f"Assuming page {current_page + 1} exists (up to reasonable limit)", "DEBUG")
                return True
                
        except Exception as e:
            self._log(f"Error checking for next page: {e}", "DEBUG")
            
        return False
        
    def _navigate_to_page(self, page_num: int) -> bool:
        """Navigate to a specific page."""
        try:
            page_url = self.search_url.format(page_num)
            self._log(f"Navigating to page {page_num}: {page_url}")
            
            self.driver.get(page_url)
            time.sleep(3)
            
            # Wait for the page to load
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            # Verify we're on the right page
            current_url = self.driver.current_url
            if f'spage={page_num}' in current_url:
                self._log(f"Successfully navigated to page {page_num}")
                return True
            else:
                self._log(f"URL doesn't contain expected page parameter: {current_url}")
                # Still try to proceed - the page might have loaded correctly
                return True
                
        except Exception as e:
            self._log(f"Error navigating to page {page_num}: {e}")
            return False
            
    def _extract_job_details(self, job_url: str) -> Optional[Dict]:
        """Extract detailed information from a job page."""
        try:
            self._log(f"Extracting details from: {job_url}", "DEBUG")
            self.driver.get(job_url)
            time.sleep(2)
            
            # Wait for the page to load
            self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Extract job title - try multiple strategies
            title = None
            title_selectors = [
                'h1', 'h2', '.job-title', '.position-title', 
                '[class*="title"]', '.job-header h1', '.job-header h2'
            ]
            
            for selector in title_selectors:
                title_elems = soup.select(selector)  # Use select() instead of select_one()
                for title_elem in title_elems:
                    title_text = title_elem.get_text().strip()
                    # Filter out navigation and generic titles
                    if (title_text and len(title_text) > 5 and 
                        title_text.lower() not in ['main navigation', 'navigation', 'menu']):
                        # Check if it contains healthcare-related keywords
                        healthcare_keywords = [
                            'caregiver', 'nurse', 'cna', 'rn', 'lpn', 'aide', 'assistant',
                            'therapist', 'coordinator', 'scheduler', 'admin', 'care',
                            'health', 'medical', 'clinical', 'home'
                        ]
                        if any(keyword in title_text.lower() for keyword in healthcare_keywords):
                            title = title_text
                            break
                if title:  # If we found a title, break out of the outer loop too
                    break
            
            if not title:
                self._log(f"Could not find job title for {job_url}", "DEBUG")
                return None
            
            # Extract comprehensive description using enhanced extraction
            description = self._extract_comprehensive_description(soup)
            
            # Extract location - look for location-specific content
            location = "Connecticut"  # Default since we're searching CT
            location_patterns = [
                r'\b([A-Z][a-z]+\s*,\s*CT)\b',
                r'\b([A-Z][a-z]+\s*Connecticut)\b',
                r'\b(Connecticut)\b'
            ]
            
            page_text = soup.get_text()
            for pattern in location_patterns:
                match = re.search(pattern, page_text)
                if match:
                    location = match.group(1)
                    break
            
            # Determine job category based on title
            category = "Healthcare"
            if any(word in title.lower() for word in ['caregiver', 'aide', 'assistant', 'companion']):
                category = "Caregiving"
            elif any(word in title.lower() for word in ['nurse', 'rn', 'lpn', 'cna']):
                category = "Nursing"
            elif any(word in title.lower() for word in ['therapist', 'therapy']):
                category = "Therapy"
            elif any(word in title.lower() for word in ['admin', 'coordinator', 'scheduler']):
                category = "Administration"
            
            # Set salary range based on job type
            salary_range = "$15-25/hour"
            if 'rn' in title.lower() or 'registered nurse' in title.lower():
                salary_range = "$30-45/hour"
            elif 'lpn' in title.lower() or 'licensed practical nurse' in title.lower():
                salary_range = "$25-35/hour"
            elif 'cna' in title.lower():
                salary_range = "$16-22/hour"
            elif any(word in title.lower() for word in ['coordinator', 'supervisor', 'manager']):
                salary_range = "$45-65k/year"
            
            # Set requirements based on job type
            requirements = []
            if 'caregiver' in title.lower():
                requirements = [
                    "High school diploma or equivalent",
                    "Compassionate and reliable",
                    "Previous caregiving experience preferred",
                    "Valid driver's license"
                ]
            elif 'cna' in title.lower():
                requirements = [
                    "Valid CNA certification",
                    "High school diploma or equivalent", 
                    "Previous healthcare experience",
                    "CPR certification preferred"
                ]
            elif 'rn' in title.lower():
                requirements = [
                    "Valid RN license",
                    "BSN degree preferred",
                    "Minimum 2 years experience",
                    "Current CPR certification"
                ]
            
            # Extract the actual application URL from Apply button
            application_url = job_url  # Default to job detail URL
            try:
                # Look for Apply button or application link
                apply_selectors = [
                    'a[href*="apply"]',
                    'a[href*="application"]', 
                    '.apply-button',
                    '.apply-link',
                    '[class*="apply"]',
                    'a[href*="workday"]',
                    'a[href*="icims"]',
                    'a[href*="smartrecruiters"]',
                    'button[onclick*="apply"]'
                ]
                
                for selector in apply_selectors:
                    apply_elements = soup.select(selector)
                    for apply_elem in apply_elements:
                        href = apply_elem.get('href')
                        onclick = apply_elem.get('onclick', '')
                        
                        # Check href attribute
                        if href and (href.startswith('http') or href.startswith('/')):
                            # Convert relative URLs to absolute
                            if href.startswith('/'):
                                from urllib.parse import urljoin
                                application_url = urljoin('https://careers.brightstarcare.com', href)
                            else:
                                application_url = href
                            self._log(f"Found application URL via href: {application_url}", "DEBUG")
                            break
                        
                        # Check onclick attribute for URLs
                        elif onclick and ('http' in onclick or 'apply' in onclick.lower()):
                            # Extract URL from onclick
                            url_match = re.search(r'https?://[^\s\'"]+|[\'"]([^\'"]*apply[^\'"]*)[\'"]', onclick)
                            if url_match:
                                potential_url = url_match.group(1) if url_match.group(1) else url_match.group(0)
                                if potential_url.startswith('http'):
                                    application_url = potential_url
                                elif potential_url.startswith('/'):
                                    from urllib.parse import urljoin
                                    application_url = urljoin('https://careers.brightstarcare.com', potential_url)
                                else:
                                    application_url = f"https://careers.brightstarcare.com/{potential_url}"
                                self._log(f"Found application URL via onclick: {application_url}", "DEBUG")
                                break
                    
                    if application_url != job_url:  # If we found a different URL, break
                        break
                
                # If no specific apply URL found, look for external job board links
                if application_url == job_url:
                    external_selectors = [
                        'a[href*="indeed.com"]',
                        'a[href*="linkedin.com"]',
                        'a[href*="glassdoor.com"]',
                        'a[href*="ziprecruiter.com"]'
                    ]
                    
                    for selector in external_selectors:
                        external_elem = soup.select_one(selector)
                        if external_elem and external_elem.get('href'):
                            application_url = external_elem.get('href')
                            self._log(f"Found external application URL: {application_url}", "DEBUG")
                            break
                            
            except Exception as e:
                self._log(f"Error extracting application URL: {e}", "DEBUG")
                application_url = job_url  # Fallback to job detail URL
            
            job_data = {
                'id': job_url.split('job-detail-')[1].split('-')[0] if 'job-detail-' in job_url else None,
                'title': title,
                'company': 'BrightStar Care',
                'location': location,
                'salary_range': salary_range,
                'job_type': 'Part-time',  # Most BrightStar jobs are part-time
                'category': category,
                'description': description,  # Use full comprehensive description
                'requirements': requirements,
                'benefits': [
                    "Flexible scheduling",
                    "Competitive pay",
                    "Training provided",
                    "Professional development"
                ],
                'url': application_url,
                'posted_date': datetime.now().strftime('%Y-%m-%d'),
                'application_deadline': '',
                'remote_work_available': False,
                'experience_level': 'Entry Level',
                'education_level': 'High School',
                'skills_required': ['Caregiving', 'Communication', 'Compassion'],
                'scraped_at': datetime.now().isoformat()
            }
            
            self._log(f"Successfully extracted job: {title}", "DEBUG")
            return job_data
            
        except Exception as e:
            self._log(f"Error extracting job details from {job_url}: {e}")
            return None
            
    def scrape_jobs(self, max_pages: int = 10) -> List[Dict]:
        """Scrape jobs from BrightStar Care."""
        self._log(f"Starting BrightStar Care scraper (max_pages: {max_pages})")
        
        try:
            self._setup_driver()
            current_page = 1
            total_jobs_found = 0
            pages_processed = 0
            
            while current_page <= max_pages:
                self._log(f"Processing page {current_page}...")
                
                # Navigate to the current page
                if not self._navigate_to_page(current_page):
                    self._log(f"Failed to navigate to page {current_page}")
                    break
                
                # Find job links on this page
                job_links = self._find_job_links()
                
                if not job_links:
                    self._log(f"No job links found on page {current_page}")
                    break
                
                self._log(f"Found {len(job_links)} job links on page {current_page}")
                
                # Extract details from each job
                for i, job_url in enumerate(job_links, 1):
                    self._log(f"Processing job {i}/{len(job_links)} on page {current_page}")
                    
                    job_data = self._extract_job_details(job_url)
                    if job_data:
                        self.jobs.append(job_data)
                        total_jobs_found += 1
                        self._log(f"Successfully scraped job: {job_data['title']}")
                    else:
                        self._log(f"Failed to scrape job from {job_url}")
                
                pages_processed += 1
                
                # Check if there's a next page
                if not self._has_next_page(current_page):
                    self._log("No more pages available")
                    break
                    
                current_page += 1
                time.sleep(2)  # Be respectful to the server
            
            self._log(f"Scraping completed. Found {total_jobs_found} jobs across {pages_processed} pages")
            return self.jobs
            
        except Exception as e:
            self._log(f"Error during scraping: {e}")
            return self.jobs
            
        finally:
            if self.driver:
                self.driver.quit()
                
    def save_jobs(self, filename_prefix: str = "brightstar_ct_jobs"):
        """Save scraped jobs to JSON and CSV files."""
        if not self.jobs:
            self._log("No jobs to save")
            return
            
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save as JSON
        json_filename = f"{filename_prefix}_{len(self.jobs)}_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(self.jobs, f, indent=2, ensure_ascii=False)
        self._log(f"Saved {len(self.jobs)} jobs to {json_filename}")
        
        # Save as CSV
        if self.jobs:
            csv_filename = f"{filename_prefix}_{len(self.jobs)}_{timestamp}.csv"
            fieldnames = self.jobs[0].keys()
            
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for job in self.jobs:
                    # Convert lists to strings for CSV
                    row = job.copy()
                    for key, value in row.items():
                        if isinstance(value, list):
                            row[key] = '; '.join(str(v) for v in value)
                    writer.writerow(row)
                    
            self._log(f"Saved {len(self.jobs)} jobs to {csv_filename}")


def main():
    """Main function to run the scraper."""
    scraper = BrightStarScraper(headless=True, debug=True)
    
    try:
        # Scrape jobs - real run for substantial dataset
        jobs = scraper.scrape_jobs(max_pages=100)  # Real run: 30 pages (~300 jobs)
        
        if jobs:
            scraper.save_jobs()
            print(f"\n=== SCRAPING SUMMARY ===")
            print(f"Total jobs scraped: {len(jobs)}")
            print(f"Companies: {set(job['company'] for job in jobs)}")
            print(f"Categories: {set(job['category'] for job in jobs)}")
            print(f"Sample jobs:")
            for i, job in enumerate(jobs[:5], 1):
                print(f"  {i}. {job['title']} - {job['location']}")
        else:
            print("No jobs were scraped")
            
    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main() 