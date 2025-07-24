#!/usr/bin/env python3
"""
Fix Apploi URL processing by properly extracting job details from Apploi job pages
"""

import json
import time
import random
import logging
from datetime import datetime
from typing import Dict, List, Optional
from playwright.sync_api import sync_playwright

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ApploiURLFixer:
    """Fix Apploi URL processing by properly extracting job details."""
    
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.playwright = None
        self.browser = None
        self.page = None
        self.job_details_cache = {}
        
    def setup_browser(self):
        """Setup Playwright browser."""
        try:
            logger.info("🔧 Setting up Playwright browser...")
            self.playwright = sync_playwright().start()
            
            self.browser = self.playwright.chromium.launch(
                headless=self.headless,
                args=[
                    '--no-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-extensions',
                    '--disable-plugins',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                ]
            )
            
            self.page = self.browser.new_page()
            self.page.set_viewport_size({"width": 1920, "height": 1080})
            
            logger.info("✅ Browser setup complete")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to setup browser: {e}")
            return False
    
    def extract_apploi_job_details(self, job_url: str) -> Optional[Dict]:
        """Extract job details from Apploi job page with enhanced selectors."""
        if not self.page:
            logger.error("❌ Page not available")
            return None
        
        # Check cache
        if job_url in self.job_details_cache:
            logger.debug(f"💾 Cache hit for: {job_url}")
            return self.job_details_cache[job_url]
        
        logger.info(f"🔍 Extracting details from: {job_url}")
        
        try:
            # Store current URL
            current_url = self.page.url
            
            # Visit job page
            self.page.goto(job_url, wait_until='domcontentloaded', timeout=15000)
            time.sleep(3)  # Wait for page to load
            
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
                    
                    // Apploi-specific selectors
                    const apploiSelectors = {
                        title: [
                            'h1', 'h2', '.job-title', '.position-title', '.title',
                            '[class*="JobName"]', '[class*="JobTitle"]', '[class*="PositionTitle"]',
                            '[data-job-title]', '.job-name', '.position-name',
                            '.job-header h1', '.job-header h2', '.job-details h1',
                            '.position-header h1', '.job-info h1', '.job-info h2',
                            '.entry-title', '.post-title', '.page-title',
                            '[class*="title"]', '.job-title h1', '.job-title h2',
                            '.position h1', '.position h2', '.job h1', '.job h2',
                            '.listing-title', '.job-listing-title', '.position-listing-title',
                            // Apploi-specific
                            '.job-detail-title', '.job-detail h1', '.job-detail h2',
                            '.job-header-title', '.position-detail-title'
                        ],
                        company: [
                            '.company', '.employer', '.company-name', '.organization',
                            '[class*="BrandName"]', '[class*="Company"]',
                            '[data-company]', '.job-company', '.employer-name',
                            '.job-header .company', '.job-info .company', '.job-details .company',
                            '.entry-meta .company', '.job-meta .company', '.position-meta .company',
                            '[class*="employer"]', '[class*="organization"]', '.job-employer',
                            '.position-company', '.listing-company', '.job-listing-company',
                            // Apploi-specific
                            '.job-detail-company', '.job-header-company', '.employer-info'
                        ],
                        location: [
                            '.location', '.job-location', '.address',
                            '[class*="Location"]', '[class*="MapLocation"]',
                            '[data-location]', '.job-city', '.job-state',
                            '.job-header .location', '.job-info .location', '.job-details .location',
                            '.entry-meta .location', '.job-meta .location', '.position-meta .location',
                            '[class*="address"]', '.job-address', '.position-address',
                            '.listing-location', '.job-listing-location', '.position-listing-location',
                            // Apploi-specific
                            '.job-detail-location', '.job-header-location', '.location-info'
                        ],
                        salary: [
                            '.salary', '.compensation', '.pay-rate', '.job-salary',
                            '[class*="Salary"]', '[class*="Compensation"]', '[class*="Pay"]',
                            '[data-salary]', '.salary-range', '.pay-range',
                            '.job-header .salary', '.job-info .salary', '.job-details .salary',
                            '.entry-meta .salary', '.job-meta .salary', '.position-meta .salary',
                            '[class*="wage"]', '[class*="rate"]', '.job-wage', '.position-wage',
                            '.listing-salary', '.job-listing-salary', '.position-listing-salary',
                            // Apploi-specific
                            '.job-detail-salary', '.job-header-salary', '.compensation-info'
                        ],
                        job_type: [
                            '.job-type', '.employment-type', '.schedule',
                            '[class*="Type"]', '[class*="Employment"]',
                            '[data-job-type]', '.job-schedule', '.work-schedule',
                            '.entry-meta .type', '.job-meta .type', '.position-meta .type',
                            '[class*="schedule"]', '.job-schedule', '.position-schedule',
                            '.listing-type', '.job-listing-type', '.position-listing-type',
                            // Apploi-specific
                            '.job-detail-type', '.job-header-type', '.employment-info'
                        ],
                        description: [
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
                            '.job-section', '.position-section', '.listing-section',
                            // Apploi-specific
                            '.job-detail-description', '.job-content-main', '.job-body-content'
                        ]
                    };
                    
                    // Extract each field
                    for (const [field, selectors] of Object.entries(apploiSelectors)) {
                        for (const selector of selectors) {
                            const elem = document.querySelector(selector);
                            if (elem && elem.textContent) {
                                const text = cleanText(elem.textContent);
                                if (text && text.length > 2) {
                                    // Additional validation for specific fields
                                    if (field === 'title' && text.length < 200 && 
                                        !text.toLowerCase().includes('home') && 
                                        !text.toLowerCase().includes('about') &&
                                        !text.toLowerCase().includes('contact')) {
                                        details[field] = text;
                                        break;
                                    } else if (field === 'company' && text.length < 100) {
                                        details[field] = text;
                                        break;
                                    } else if (field === 'location' && text.length < 100) {
                                        details[field] = text;
                                        break;
                                    } else if (field === 'salary' && text.length < 100) {
                                        const lowerSalary = text.toLowerCase();
                                        if (lowerSalary.includes('$') || lowerSalary.includes('salary') || 
                                            lowerSalary.includes('pay') || lowerSalary.includes('compensation') ||
                                            lowerSalary.includes('hour') || lowerSalary.includes('year') ||
                                            lowerSalary.includes('wage') || lowerSalary.includes('rate')) {
                                            details[field] = text;
                                            break;
                                        }
                                    } else if (field === 'job_type' && text.length < 50) {
                                        const lowerType = text.toLowerCase();
                                        const validTypes = ['full time', 'part time', 'per diem', 'temporary', 
                                                          'contract', 'permanent', 'seasonal', 'prn', 'casual',
                                                          'full-time', 'part-time', 'per-diem'];
                                        if (validTypes.some(type => lowerType.includes(type))) {
                                            details[field] = text;
                                            break;
                                        }
                                    } else if (field === 'description' && text.length > 100 && text.length < 10000) {
                                        details[field] = text;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    // Try to get date from JSON-LD schema
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
                    
                    return details;
                }
            """)
            
            # Add metadata
            job_details['job_url'] = job_url
            job_details['scraped_at'] = datetime.now().isoformat()
            
            # Cache the results
            self.job_details_cache[job_url] = job_details
            
            # Log what we found
            if job_details.get('title'):
                logger.info(f"✅ Found title: {job_details['title']}")
            if job_details.get('company'):
                logger.info(f"🏢 Found company: {job_details['company']}")
            if job_details.get('location'):
                logger.info(f"📍 Found location: {job_details['location']}")
            if job_details.get('description'):
                logger.info(f"📝 Description length: {len(job_details['description'])} chars")
            
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
    
    def fix_jobs_with_apploi_urls(self, jobs: List[Dict]) -> List[Dict]:
        """Fix jobs that have Apploi URLs but missing details."""
        fixed_jobs = []
        apploi_jobs = [job for job in jobs if job.get('job_url', '').startswith('https://jobs.apploi.com/')]
        
        logger.info(f"🔧 Found {len(apploi_jobs)} jobs with Apploi URLs to fix")
        
        for i, job in enumerate(apploi_jobs):
            logger.info(f"🔧 Processing job {i+1}/{len(apploi_jobs)}: {job.get('title', 'Unknown')}")
            
            # Check if job needs fixing (has URL but missing key details)
            needs_fixing = (
                job.get('job_url') and 
                (not job.get('company') or not job.get('location') or not job.get('description') or len(job.get('description', '')) < 50)
            )
            
            if needs_fixing:
                logger.info(f"🔧 Job needs fixing, extracting details from: {job['job_url']}")
                job_details = self.extract_apploi_job_details(job['job_url'])
                
                if job_details:
                    # Update job with extracted details
                    if job_details.get('company') and not job.get('company'):
                        job['company'] = job_details['company']
                    
                    if job_details.get('location') and not job.get('location'):
                        job['location'] = job_details['location']
                    
                    if job_details.get('salary') and not job.get('salary'):
                        job['salary'] = job_details['salary']
                    
                    if job_details.get('job_type') and not job.get('job_type'):
                        job['job_type'] = job_details['job_type']
                    
                    if job_details.get('date_posted') and not job.get('date_posted'):
                        job['date_posted'] = job_details['date_posted']
                    
                    if job_details.get('description') and len(job_details['description']) > len(job.get('description', '')):
                        job['description'] = job_details['description']
                    
                    if job_details.get('requirements'):
                        job['requirements'] = job_details['requirements']
                    
                    if job_details.get('qualifications'):
                        job['qualifications'] = job_details['qualifications']
                    
                    if job_details.get('application_info'):
                        job['application_info'] = job_details['application_info']
                    
                    logger.info(f"✅ Successfully enhanced job: {job.get('title', 'Unknown')}")
                else:
                    logger.warning(f"⚠️ Failed to extract details for job: {job.get('title', 'Unknown')}")
            
            fixed_jobs.append(job)
            
            # Small delay between jobs
            time.sleep(random.uniform(1, 3))
        
        # Add non-Apploi jobs back
        non_apploi_jobs = [job for job in jobs if not job.get('job_url', '').startswith('https://jobs.apploi.com/')]
        fixed_jobs.extend(non_apploi_jobs)
        
        logger.info(f"✅ Fixed {len(apploi_jobs)} Apploi jobs, total jobs: {len(fixed_jobs)}")
        return fixed_jobs
    
    def cleanup(self):
        """Cleanup browser resources."""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()

def main():
    """Main function to fix Apploi URLs in the JSON file."""
    input_file = "ultimate_apploi_jobs_514_20250723_135843.json"
    output_file = "fixed_apploi_jobs.json"
    
    try:
        # Load jobs
        logger.info(f"📂 Loading jobs from {input_file}")
        with open(input_file, 'r', encoding='utf-8') as f:
            jobs = json.load(f)
        
        logger.info(f"📊 Loaded {len(jobs)} jobs")
        
        # Count Apploi jobs
        apploi_jobs = [job for job in jobs if job.get('job_url', '').startswith('https://jobs.apploi.com/')]
        logger.info(f"🔗 Found {len(apploi_jobs)} jobs with Apploi URLs")
        
        # Setup fixer
        fixer = ApploiURLFixer(headless=True)
        if not fixer.setup_browser():
            logger.error("❌ Failed to setup browser")
            return
        
        try:
            # Fix jobs
            fixed_jobs = fixer.fix_jobs_with_apploi_urls(jobs)
            
            # Save fixed jobs
            logger.info(f"💾 Saving fixed jobs to {output_file}")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(fixed_jobs, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ Successfully saved {len(fixed_jobs)} fixed jobs")
            
        finally:
            fixer.cleanup()
    
    except Exception as e:
        logger.error(f"❌ Error: {e}")

if __name__ == "__main__":
    main() 