#!/usr/bin/env python3
"""
Batch Healthcare Job Board Site Analyzer
========================================

This script efficiently analyzes all healthcare job board sites from the CSV
to identify the correct selectors for extracting job descriptions, requirements,
and posting dates.
"""

import os
import csv
import json
import time
import logging
import threading
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse
import multiprocessing as mp
from concurrent.futures import ThreadPoolExecutor, as_completed

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import uuid

class BatchSiteAnalyzer:
    
    def __init__(self, headless: bool = True, timeout: int = 30):
        self.headless = headless
        self.timeout = timeout
        self.analysis_results = []
        
    def _setup_driver(self):
        """Setup Chrome WebDriver for a single process."""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless=new")
        
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-images")
        chrome_options.add_argument(f"--user-data-dir=/tmp/chrome_batch_{random.randint(1000, 9999)}")
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        driver.set_page_load_timeout(self.timeout)
        
        return driver
    
    def analyze_single_site(self, site_data: tuple) -> Dict:
        """Analyze a single site efficiently."""
        site_name, url = site_data
        
        analysis = {
            'site_name': site_name,
            'url': url,
            'status': 'success',
            'job_containers': [],
            'description_selectors': [],
            'requirements_selectors': [],
            'date_selectors': [],
            'page_structure': {},
            'notes': [],
            'analyzed_at': datetime.now().isoformat()
        }
        
        driver = None
        try:
            driver = self._setup_driver()
            wait = WebDriverWait(driver, 15)
            
            # Load the page
            driver.get(url)
            time.sleep(random.uniform(2, 4))
            
            # Wait for page load
            wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            
            # Check for blocking
            page_title = driver.title.lower()
            page_source = driver.page_source.lower()
            
            blocking_indicators = ['just a moment', 'cloudflare', 'checking', 'security', 'captcha', 'robot', 'blocked']
            if any(indicator in page_title or indicator in page_source[:2000] for indicator in blocking_indicators):
                analysis['status'] = 'blocked'
                analysis['notes'].append('Site blocked by anti-bot protection')
                return analysis
            
            # Analyze page structure
            analysis['page_structure'] = self._analyze_page_structure(driver)
            
            # Find job containers
            job_containers = self._find_job_containers_fast(driver)
            if not job_containers:
                analysis['status'] = 'no_jobs'
                analysis['notes'].append('No job containers found')
                return analysis
            
            analysis['job_containers'] = [{'selector': selector, 'count': count} for selector, count in job_containers.items()]
            
            # Analyze selectors in the first few job containers
            selectors_found = self._analyze_selectors_fast(driver, list(job_containers.keys())[:3])
            analysis.update(selectors_found)
            
            # Try to click on first job for detail page analysis
            detail_analysis = self._analyze_job_detail_fast(driver)
            if detail_analysis:
                analysis['job_detail_analysis'] = detail_analysis
            
        except Exception as e:
            analysis['status'] = 'error'
            analysis['notes'].append(f'Error: {str(e)}')
            
        finally:
            if driver:
                try:
                    driver.quit()
                except:
                    pass
        
        return analysis
    
    def _analyze_page_structure(self, driver) -> Dict:
        """Quickly analyze the page structure."""
        structure = {
            'title': driver.title,
            'url': driver.current_url,
            'has_forms': False,
            'has_tables': False,
            'has_job_keywords': False,
            'main_content_selectors': []
        }
        
        try:
            # Check for forms
            forms = driver.find_elements(By.TAG_NAME, 'form')
            structure['has_forms'] = len(forms) > 0
            
            # Check for tables
            tables = driver.find_elements(By.TAG_NAME, 'table')
            structure['has_tables'] = len(tables) > 0
            
            # Check for healthcare job keywords in page text
            page_text = driver.find_element(By.TAG_NAME, 'body').text.lower()
            healthcare_keywords = ['nurse', 'nursing', 'care', 'aide', 'assistant', 'cna', 'rn', 'lpn', 'medical', 'healthcare']
            structure['has_job_keywords'] = any(keyword in page_text for keyword in healthcare_keywords)
            
            # Find main content areas
            main_selectors = ['main', '.main', '#main', '.content', '#content', '.container', '.job-listings', '.jobs']
            for selector in main_selectors:
                try:
                    elements = driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        structure['main_content_selectors'].append(selector)
                except:
                    continue
                    
        except Exception as e:
            structure['error'] = str(e)
        
        return structure
    
    def _find_job_containers_fast(self, driver) -> Dict[str, int]:
        """Quickly find job containers and count them."""
        job_selectors = [
            '.job', '.job-item', '.job-listing', '.job-card', '.job-post',
            '.position', '.position-item', '.career', '.career-item',
            '.listing', '.post', '.role', '.item',
            'a[href*="job"]', 'a[href*="career"]', 'a[href*="position"]',
            'tr', '[class*="job"]', '[class*="position"]', '[class*="career"]'
        ]
        
        containers = {}
        for selector in job_selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    # Quick filter for healthcare content
                    healthcare_count = 0
                    for elem in elements[:10]:  # Check first 10
                        try:
                            elem_text = elem.text.lower()
                            if any(keyword in elem_text for keyword in ['nurse', 'care', 'aide', 'assistant', 'medical', 'healthcare', 'cna', 'rn', 'lpn']):
                                healthcare_count += 1
                        except:
                            continue
                    
                    if healthcare_count > 0:
                        containers[selector] = healthcare_count
                        
            except Exception:
                continue
        
        return containers
    
    def _analyze_selectors_fast(self, driver, container_selectors: List[str]) -> Dict:
        """Quickly analyze selectors for descriptions, requirements, and dates."""
        found_selectors = {
            'description_selectors': [],
            'requirements_selectors': [],
            'date_selectors': []
        }
        
        # Test selectors on the page level first
        description_selectors = [
            '.job-description', '.description', '.summary', '.details', '.content',
            '.overview', '.info', '[class*="description"]', '[class*="summary"]',
            '[class*="detail"]', 'p', '.text'
        ]
        
        requirements_selectors = [
            '.requirements', '.qualifications', '.skills', '.experience',
            '[class*="requirement"]', '[class*="qualification"]', '[class*="skill"]',
            'ul', 'ol', '.list'
        ]
        
        date_selectors = [
            '.date', '.posted-date', '.time', '.posted', '.created', '.updated',
            '[class*="date"]', '[class*="posted"]', '[class*="time"]', 'time'
        ]
        
        # Test description selectors
        for selector in description_selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                for elem in elements[:3]:  # Check first 3
                    text = elem.text.strip()
                    if text and len(text) > 50:
                        found_selectors['description_selectors'].append(selector)
                        break
            except:
                continue
        
        # Test requirements selectors
        for selector in requirements_selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                for elem in elements[:3]:
                    text = elem.text.strip()
                    if text and len(text) > 30 and any(word in text.lower() for word in ['require', 'must', 'skill', 'experience', 'education']):
                        found_selectors['requirements_selectors'].append(selector)
                        break
            except:
                continue
        
        # Test date selectors
        for selector in date_selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                for elem in elements[:3]:
                    text = elem.text.strip()
                    if text and any(word in text.lower() for word in ['ago', 'posted', 'day', 'week', 'month', '2024', '2025']):
                        found_selectors['date_selectors'].append(selector)
                        break
            except:
                continue
        
        return found_selectors
    
    def _analyze_job_detail_fast(self, driver) -> Optional[Dict]:
        """Try to analyze a job detail page quickly."""
        try:
            # Look for job links
            job_links = driver.find_elements(By.CSS_SELECTOR, 'a[href*="job"], a[href*="career"], a[href*="position"]')
            if not job_links:
                return None
            
            # Try first job link
            first_link = job_links[0]
            job_url = first_link.get_attribute('href')
            if not job_url:
                return None
            
            original_url = driver.current_url
            driver.get(job_url)
            time.sleep(2)
            
            detail_analysis = {
                'detail_url': job_url,
                'detail_title': driver.title,
                'description_selectors': [],
                'requirements_selectors': [],
                'date_selectors': []
            }
            
            # Quick analysis of detail page
            detail_selectors = self._analyze_selectors_fast(driver, [])
            detail_analysis.update(detail_selectors)
            
            # Go back
            driver.get(original_url)
            time.sleep(1)
            
            return detail_analysis
            
        except Exception:
            try:
                driver.get(original_url)
            except:
                pass
            return None
    
    def load_sites_from_csv(self) -> List[tuple]:
        """Load all sites from the CSV file."""
        sites = []
        try:
            with open('Job Board Data Scrape.csv', 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get('search_url') and row.get('source_site'):
                        sites.append((row['source_site'], row['search_url']))
        except Exception as e:
            print(f"Error loading sites from CSV: {e}")
        
        return sites
    
    def analyze_all_sites_batch(self, batch_size: int = 5, max_sites: Optional[int] = None) -> List[Dict]:
        """Analyze all sites in batches."""
        sites = self.load_sites_from_csv()
        if max_sites:
            sites = sites[:max_sites]
        
        print(f"🚀 Starting batch analysis of {len(sites)} healthcare job board sites")
        print(f"📦 Processing in batches of {batch_size}")
        
        all_results = []
        
        # Process sites in batches
        for i in range(0, len(sites), batch_size):
            batch = sites[i:i+batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(sites) + batch_size - 1) // batch_size
            
            print(f"\n📦 Processing batch {batch_num}/{total_batches} ({len(batch)} sites)")
            
            # Process batch with threading
            with ThreadPoolExecutor(max_workers=min(batch_size, 3)) as executor:
                future_to_site = {executor.submit(self.analyze_single_site, site): site for site in batch}
                
                for future in as_completed(future_to_site):
                    site = future_to_site[future]
                    try:
                        result = future.result(timeout=60)  # 60 second timeout per site
                        all_results.append(result)
                        print(f"✅ {site[0]}: {result['status']}")
                    except Exception as e:
                        print(f"❌ {site[0]}: Error - {e}")
                        # Add error result
                        all_results.append({
                            'site_name': site[0],
                            'url': site[1],
                            'status': 'timeout_error',
                            'notes': [f'Timeout or error: {str(e)}'],
                            'analyzed_at': datetime.now().isoformat()
                        })
            
            # Save progress after each batch
            self.save_batch_results(all_results, f"batch_analysis_progress_{len(all_results)}_sites.json")
            print(f"📊 Progress: {len(all_results)} sites analyzed")
            
            # Delay between batches
            if i + batch_size < len(sites):
                time.sleep(random.uniform(3, 6))
        
        self.analysis_results = all_results
        return all_results
    
    def save_batch_results(self, results: List[Dict], filename: str):
        """Save batch results to file."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"batch_analysis_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
    
    def generate_comprehensive_recommendations(self, results: List[Dict]) -> Dict:
        """Generate comprehensive selector recommendations."""
        recommendations = {
            'summary': {
                'total_sites': len(results),
                'successful_analyses': sum(1 for r in results if r['status'] == 'success'),
                'blocked_sites': sum(1 for r in results if r['status'] == 'blocked'),
                'no_jobs_sites': sum(1 for r in results if r['status'] == 'no_jobs'),
                'error_sites': sum(1 for r in results if r['status'] in ['error', 'timeout_error'])
            },
            'description_selectors': {},
            'requirements_selectors': {},
            'date_selectors': {},
            'job_container_selectors': {},
            'site_patterns': {}
        }
        
        # Count selector frequencies
        for result in results:
            if result['status'] == 'success':
                # Count description selectors
                for selector in result.get('description_selectors', []):
                    recommendations['description_selectors'][selector] = recommendations['description_selectors'].get(selector, 0) + 1
                
                # Count requirements selectors
                for selector in result.get('requirements_selectors', []):
                    recommendations['requirements_selectors'][selector] = recommendations['requirements_selectors'].get(selector, 0) + 1
                
                # Count date selectors
                for selector in result.get('date_selectors', []):
                    recommendations['date_selectors'][selector] = recommendations['date_selectors'].get(selector, 0) + 1
                
                # Count job container selectors
                for container in result.get('job_containers', []):
                    selector = container.get('selector')
                    if selector:
                        recommendations['job_container_selectors'][selector] = recommendations['job_container_selectors'].get(selector, 0) + 1
        
        # Sort by frequency
        for key in ['description_selectors', 'requirements_selectors', 'date_selectors', 'job_container_selectors']:
            recommendations[key] = dict(sorted(recommendations[key].items(), key=lambda x: x[1], reverse=True))
        
        return recommendations

def setup_driver(thread_id=None):
    """Setup Chrome driver with appropriate options"""
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--disable-web-security')
    chrome_options.add_argument('--allow-running-insecure-content')
    chrome_options.add_argument('--disable-features=VizDisplayCompositor')
    
    # Create unique user data directory for each thread
    if thread_id is None:
        thread_id = str(uuid.uuid4())
    
    user_data_dir = f'/tmp/chrome_user_data_{thread_id}_{os.getpid()}'
    chrome_options.add_argument(f'--user-data-dir={user_data_dir}')
    
    # Random user agent rotation
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
    ]
    chrome_options.add_argument(f'--user-agent={user_agents[hash(thread_id) % len(user_agents)]}')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.set_page_load_timeout(30)
    return driver

def analyze_single_site(site_data, thread_id):
    """Analyze a single site for optimal selectors"""
    try:
        site_name = site_data.get('source_site', site_data.get('Site Name', 'Unknown'))
        site_url = site_data.get('jobs_url', site_data.get('Jobs URL', ''))
        
        if not site_url:
            logging.warning(f"No URL found for {site_name}")
            return {
                'site_name': site_name,
                'url': '',
                'status': 'error',
                'reason': 'no_url',
                'anti_bot_type': 'none'
            }

        logging.info(f"Analyzing {site_name}: {site_url}")
        
        # Setup driver with unique thread ID
        driver = setup_driver(thread_id)
        
        try:
            # Navigate to the site
            driver.get(site_url)
            time.sleep(3)  # Wait for page load
            
            # Check for anti-bot protection
            anti_bot_type = detect_anti_bot_protection(driver)
            if anti_bot_type != 'none':
                logging.warning(f"Anti-bot protection detected on {site_name}: {anti_bot_type}")
                return {
                    'site_name': site_name,
                    'url': site_url,
                    'status': 'blocked',
                    'reason': 'anti_bot',
                    'anti_bot_type': anti_bot_type
                }
            
            # Test different selectors
            results = test_selectors(driver, site_name)
            results['site_name'] = site_name
            results['url'] = site_url
            results['status'] = 'success'
            results['anti_bot_type'] = 'none'
            
            logging.info(f"Successfully analyzed {site_name} - Best container: {results.get('best_container', 'none')}")
            return results
            
        except Exception as e:
            logging.error(f"Error analyzing {site_name}: {str(e)}")
            return {
                'site_name': site_name,
                'url': site_url,
                'status': 'error',
                'reason': 'error',
                'anti_bot_type': 'none',
                'error': str(e)
            }
        finally:
            try:
                driver.quit()
            except:
                pass
            
            # Clean up user data directory
            user_data_dir = f'/tmp/chrome_user_data_{thread_id}_{os.getpid()}'
            try:
                import shutil
                if os.path.exists(user_data_dir):
                    shutil.rmtree(user_data_dir)
            except:
                pass
                
    except Exception as e:
        logging.error(f"Analysis failed: {str(e)}")
        return {
            'site_name': site_data.get('source_site', site_data.get('Site Name', 'Unknown')),
            'url': site_data.get('jobs_url', site_data.get('Jobs URL', '')),
            'status': 'error',
            'reason': 'error',
            'anti_bot_type': 'none',
            'error': str(e)
        }

def main():
    """Main function to run comprehensive site analysis"""
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('comprehensive_analysis.log'),
            logging.StreamHandler()
        ]
    )
    
    # Load sites from CSV
    sites = []
    try:
        with open('Job Board Data Scrape.csv', 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            sites = list(reader)
        logging.info(f"Loaded {len(sites)} sites from Job Board Data Scrape.csv")
    except Exception as e:
        logging.error(f"Failed to load CSV file: {e}")
        return
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results = []
    
    # Process sites in smaller batches to avoid resource conflicts
    batch_size = 3  # Reduced batch size
    total_sites = len(sites)
    
    for i in range(0, total_sites, batch_size):
        batch = sites[i:i + batch_size]
        batch_results = []
        
        # Use ThreadPoolExecutor with limited workers
        with ThreadPoolExecutor(max_workers=3) as executor:
            # Submit tasks with unique thread IDs
            future_to_site = {
                executor.submit(analyze_single_site, site, f"thread_{i + j}"): site 
                for j, site in enumerate(batch)
            }
            
            # Collect results
            for future in as_completed(future_to_site, timeout=120):
                try:
                    result = future.result(timeout=60)
                    batch_results.append(result)
                except Exception as e:
                    site = future_to_site[future]
                    site_name = site.get('source_site', site.get('Site Name', 'Unknown'))
                    logging.error(f"Failed to get result for {site_name}: {e}")
                    batch_results.append({
                        'site_name': site_name,
                        'url': site.get('jobs_url', site.get('Jobs URL', '')),
                        'status': 'error',
                        'reason': 'timeout',
                        'anti_bot_type': 'none',
                        'error': str(e)
                    })
        
        results.extend(batch_results)
        
        # Save intermediate results
        save_intermediate_results(results, timestamp)
        
        # Progress update
        processed = len(results)
        logging.info(f"Processed {processed}/{total_sites} sites")
        
        # Add delay between batches
        if i + batch_size < total_sites:
            time.sleep(5)
    
    # Generate final comprehensive analysis
    generate_comprehensive_analysis(results, timestamp)
    
    logging.info(f"Comprehensive analysis completed. Results saved to comprehensive_analysis_{timestamp}.json")

if __name__ == "__main__":
    main() 