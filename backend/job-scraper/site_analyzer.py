#!/usr/bin/env python3
"""
Healthcare Job Board Site Analyzer
==================================

This script analyzes various healthcare job board sites to identify the correct
selectors for extracting job descriptions, requirements, and posting dates.
"""

import csv
import json
import time
import random
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urljoin, urlparse

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

class SiteAnalyzer:
    
    def __init__(self, headless: bool = False):
        self.headless = headless
        self.driver = None
        self.wait = None
        self.analysis_results = []
        
    def _setup_driver(self):
        """Setup Chrome WebDriver."""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless=new")
        
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.wait = WebDriverWait(self.driver, 10)
    
    def analyze_site(self, site_name: str, url: str) -> Dict:
        """Analyze a single site for job detail selectors."""
        print(f"\n🔍 Analyzing {site_name}")
        print(f"URL: {url}")
        
        analysis = {
            'site_name': site_name,
            'url': url,
            'status': 'success',
            'job_containers': [],
            'description_selectors': [],
            'requirements_selectors': [],
            'date_selectors': [],
            'sample_jobs': [],
            'notes': []
        }
        
        try:
            self.driver.get(url)
            time.sleep(random.uniform(3, 5))
            
            # Check if page loaded properly
            page_title = self.driver.title.lower()
            if any(blocked in page_title for blocked in ['just a moment', 'cloudflare', 'checking']):
                analysis['status'] = 'blocked'
                analysis['notes'].append('Site blocked by anti-bot protection')
                return analysis
            
            # Find job containers
            job_selectors = [
                '.job', '.job-item', '.job-listing', '.job-card', '.job-post',
                '.position', '.position-item', '.career', '.career-item',
                '.listing', '.post', '.role', '.item',
                'a[href*="job"]', 'a[href*="career"]', 'a[href*="position"]',
                'tr', '[class*="job"]', '[class*="position"]'
            ]
            
            job_containers = []
            for selector in job_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements and len(elements) > 0:
                        # Filter for healthcare-related content
                        healthcare_elements = []
                        for elem in elements[:10]:  # Check first 10
                            try:
                                elem_text = elem.text.lower()
                                healthcare_keywords = [
                                    'nurse', 'nursing', 'care', 'aide', 'assistant',
                                    'cna', 'rn', 'lpn', 'medical', 'healthcare',
                                    'patient', 'clinical', 'therapy', 'caregiver'
                                ]
                                if any(keyword in elem_text for keyword in healthcare_keywords):
                                    healthcare_elements.append(elem)
                            except:
                                continue
                        
                        if healthcare_elements:
                            job_containers = healthcare_elements[:5]  # Take first 5
                            analysis['job_containers'].append({
                                'selector': selector,
                                'count': len(healthcare_elements)
                            })
                            break
                except:
                    continue
            
            if not job_containers:
                analysis['status'] = 'no_jobs'
                analysis['notes'].append('No job containers found')
                return analysis
            
            # Analyze job containers for description/requirements/date patterns
            for i, container in enumerate(job_containers):
                try:
                    job_analysis = self._analyze_job_container(container, i)
                    analysis['sample_jobs'].append(job_analysis)
                    
                    # Collect unique selectors
                    for desc_sel in job_analysis.get('description_selectors', []):
                        if desc_sel not in analysis['description_selectors']:
                            analysis['description_selectors'].append(desc_sel)
                    
                    for req_sel in job_analysis.get('requirements_selectors', []):
                        if req_sel not in analysis['requirements_selectors']:
                            analysis['requirements_selectors'].append(req_sel)
                    
                    for date_sel in job_analysis.get('date_selectors', []):
                        if date_sel not in analysis['date_selectors']:
                            analysis['date_selectors'].append(date_sel)
                            
                except Exception as e:
                    analysis['notes'].append(f'Error analyzing job container {i}: {str(e)}')
                    continue
            
            # Try clicking on first job to see detail page
            if job_containers:
                try:
                    first_job = job_containers[0]
                    job_link = None
                    
                    # Try to find job link
                    if first_job.tag_name == 'a':
                        job_link = first_job.get_attribute('href')
                    else:
                        try:
                            link_elem = first_job.find_element(By.TAG_NAME, 'a')
                            job_link = link_elem.get_attribute('href')
                        except:
                            pass
                    
                    if job_link:
                        original_url = self.driver.current_url
                        self.driver.get(job_link)
                        time.sleep(3)
                        
                        # Analyze job detail page
                        detail_analysis = self._analyze_job_detail_page()
                        analysis['job_detail_analysis'] = detail_analysis
                        
                        # Go back to original page
                        self.driver.get(original_url)
                        time.sleep(2)
                        
                except Exception as e:
                    analysis['notes'].append(f'Error analyzing job detail page: {str(e)}')
            
        except Exception as e:
            analysis['status'] = 'error'
            analysis['notes'].append(f'General error: {str(e)}')
        
        return analysis
    
    def _analyze_job_container(self, container, index: int) -> Dict:
        """Analyze a single job container for patterns."""
        job_analysis = {
            'index': index,
            'title': '',
            'location': '',
            'description_selectors': [],
            'requirements_selectors': [],
            'date_selectors': [],
            'full_text': container.text.strip()[:500]  # First 500 chars
        }
        
        # Look for description patterns
        description_selectors = [
            '.description', '.job-description', '.summary', '.job-summary',
            '.details', '.job-details', '.content', '.job-content',
            '.overview', '.job-overview', '.info', '.job-info',
            'p', '.text', '.body', '[class*="description"]',
            '[class*="summary"]', '[class*="detail"]'
        ]
        
        for selector in description_selectors:
            try:
                desc_elem = container.find_element(By.CSS_SELECTOR, selector)
                desc_text = desc_elem.text.strip()
                if desc_text and len(desc_text) > 50:  # Meaningful description
                    job_analysis['description_selectors'].append(selector)
            except:
                continue
        
        # Look for requirements patterns
        requirements_selectors = [
            '.requirements', '.job-requirements', '.qualifications',
            '.job-qualifications', '.skills', '.job-skills',
            '.experience', '.job-experience', '.must-have',
            '[class*="requirement"]', '[class*="qualification"]',
            '[class*="skill"]', '[class*="experience"]'
        ]
        
        for selector in requirements_selectors:
            try:
                req_elem = container.find_element(By.CSS_SELECTOR, selector)
                req_text = req_elem.text.strip()
                if req_text and len(req_text) > 30:  # Meaningful requirements
                    job_analysis['requirements_selectors'].append(selector)
            except:
                continue
        
        # Look for date patterns
        date_selectors = [
            '.date', '.posted-date', '.job-date', '.created-date',
            '.publish-date', '.posting-date', '.updated-date',
            '.time', '.posted', '.created', '.updated',
            '[class*="date"]', '[class*="posted"]', '[class*="time"]',
            'time', '.timestamp'
        ]
        
        for selector in date_selectors:
            try:
                date_elem = container.find_element(By.CSS_SELECTOR, selector)
                date_text = date_elem.text.strip()
                if date_text and any(word in date_text.lower() for word in ['ago', 'posted', 'day', 'week', 'month', '2024', '2025']):
                    job_analysis['date_selectors'].append(selector)
            except:
                continue
        
        return job_analysis
    
    def _analyze_job_detail_page(self) -> Dict:
        """Analyze job detail page for description/requirements patterns."""
        detail_analysis = {
            'url': self.driver.current_url,
            'title': self.driver.title,
            'description_selectors': [],
            'requirements_selectors': [],
            'date_selectors': []
        }
        
        # More comprehensive selectors for detail pages
        description_selectors = [
            '.job-description', '.description', '.job-summary', '.summary',
            '.job-details', '.details', '.job-content', '.content',
            '.job-overview', '.overview', '.job-info', '.info',
            '.about-job', '.job-about', '.position-description',
            '#job-description', '#description', '#job-details',
            '[data-testid*="description"]', '[data-testid*="summary"]',
            '.rich-text', '.formatted-text', '.job-text',
            'main', '.main-content', '.job-posting'
        ]
        
        for selector in description_selectors:
            try:
                desc_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                desc_text = desc_elem.text.strip()
                if desc_text and len(desc_text) > 100:  # Substantial description
                    detail_analysis['description_selectors'].append({
                        'selector': selector,
                        'text_length': len(desc_text),
                        'sample_text': desc_text[:200] + '...' if len(desc_text) > 200 else desc_text
                    })
            except:
                continue
        
        # Requirements selectors for detail pages
        requirements_selectors = [
            '.requirements', '.job-requirements', '.qualifications',
            '.job-qualifications', '.skills', '.job-skills',
            '.experience', '.job-experience', '.must-have',
            '.preferred', '.desired', '.minimum-requirements',
            '#requirements', '#qualifications', '#skills',
            '[data-testid*="requirement"]', '[data-testid*="qualification"]',
            '.requirement-list', '.qualification-list', '.skill-list'
        ]
        
        for selector in requirements_selectors:
            try:
                req_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                req_text = req_elem.text.strip()
                if req_text and len(req_text) > 50:  # Substantial requirements
                    detail_analysis['requirements_selectors'].append({
                        'selector': selector,
                        'text_length': len(req_text),
                        'sample_text': req_text[:200] + '...' if len(req_text) > 200 else req_text
                    })
            except:
                continue
        
        # Date selectors for detail pages
        date_selectors = [
            '.posted-date', '.job-date', '.created-date', '.publish-date',
            '.posting-date', '.updated-date', '.date-posted',
            '.job-posted', '.posted-on', '.date-created',
            '[data-testid*="date"]', '[data-testid*="posted"]',
            'time', '.timestamp', '.time-ago'
        ]
        
        for selector in date_selectors:
            try:
                date_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                date_text = date_elem.text.strip()
                if date_text and any(word in date_text.lower() for word in ['ago', 'posted', 'day', 'week', 'month', '2024', '2025']):
                    detail_analysis['date_selectors'].append({
                        'selector': selector,
                        'text': date_text
                    })
            except:
                continue
        
        return detail_analysis
    
    def analyze_sample_sites(self) -> List[Dict]:
        """Analyze all healthcare job board sites from the CSV."""
        # Load all sites from CSV
        sites_to_analyze = []
        try:
            with open('Job Board Data Scrape.csv', 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if row.get('search_url') and row.get('source_site'):
                        sites_to_analyze.append((row['source_site'], row['search_url']))
        except Exception as e:
            print(f"Error loading sites from CSV: {e}")
            return []
        
        print(f"🚀 Starting analysis of {len(sites_to_analyze)} healthcare job board sites from CSV")
        
        try:
            self._setup_driver()
            
            for i, (site_name, url) in enumerate(sites_to_analyze, 1):
                print(f"\n[{i}/{len(sites_to_analyze)}] Analyzing {site_name}")
                try:
                    analysis = self.analyze_site(site_name, url)
                    self.analysis_results.append(analysis)
                    
                    # Brief summary
                    print(f"✅ {site_name}: {analysis['status']}")
                    if analysis['status'] == 'success':
                        print(f"   - Job containers: {len(analysis['job_containers'])}")
                        print(f"   - Description selectors: {len(analysis['description_selectors'])}")
                        print(f"   - Requirements selectors: {len(analysis['requirements_selectors'])}")
                        print(f"   - Date selectors: {len(analysis['date_selectors'])}")
                    elif analysis['status'] == 'blocked':
                        print(f"   - Blocked by anti-bot protection")
                    elif analysis['status'] == 'no_jobs':
                        print(f"   - No job containers found")
                    elif analysis['status'] == 'error':
                        print(f"   - Error: {analysis['notes']}")
                    
                    # Save progress every 25 sites
                    if i % 25 == 0:
                        self.save_analysis(f"partial_analysis_{i}_sites.json")
                        print(f"📊 Progress saved after {i} sites")
                    
                    # Delay between sites to be respectful
                    time.sleep(random.uniform(1, 3))
                    
                except Exception as e:
                    print(f"❌ Error analyzing {site_name}: {e}")
                    continue
                    
        except Exception as e:
            print(f"💥 Critical error: {e}")
            
        finally:
            if self.driver:
                self.driver.quit()
        
        return self.analysis_results
    
    def save_analysis(self, filename: str = "site_analysis_results.json"):
        """Save analysis results to JSON file."""
        if not self.analysis_results:
            print("No analysis results to save")
            return
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"site_analysis_{timestamp}.json"
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.analysis_results, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Analysis results saved to {filename}")
    
    def generate_selector_recommendations(self) -> Dict:
        """Generate recommendations for selectors based on analysis."""
        recommendations = {
            'description_selectors': {},
            'requirements_selectors': {},
            'date_selectors': {},
            'site_specific_patterns': {}
        }
        
        # Count selector frequency across all sites
        desc_counts = {}
        req_counts = {}
        date_counts = {}
        
        for result in self.analysis_results:
            if result['status'] == 'success':
                # Count description selectors
                for selector in result['description_selectors']:
                    desc_counts[selector] = desc_counts.get(selector, 0) + 1
                
                # Count requirements selectors
                for selector in result['requirements_selectors']:
                    req_counts[selector] = req_counts.get(selector, 0) + 1
                
                # Count date selectors
                for selector in result['date_selectors']:
                    date_counts[selector] = date_counts.get(selector, 0) + 1
        
        # Sort by frequency
        recommendations['description_selectors'] = dict(sorted(desc_counts.items(), key=lambda x: x[1], reverse=True))
        recommendations['requirements_selectors'] = dict(sorted(req_counts.items(), key=lambda x: x[1], reverse=True))
        recommendations['date_selectors'] = dict(sorted(date_counts.items(), key=lambda x: x[1], reverse=True))
        
        # Identify site-specific patterns
        for result in self.analysis_results:
            if result['status'] == 'success':
                site_name = result['site_name']
                recommendations['site_specific_patterns'][site_name] = {
                    'url_pattern': result['url'],
                    'best_description_selectors': result['description_selectors'][:3],
                    'best_requirements_selectors': result['requirements_selectors'][:3],
                    'best_date_selectors': result['date_selectors'][:3]
                }
        
        return recommendations

def main():
    """Main execution function."""
    print("🔍 Healthcare Job Board Site Analyzer")
    print("=" * 50)
    
    analyzer = SiteAnalyzer(headless=True)  # Use headless mode
    
    # Analyze sample sites
    results = analyzer.analyze_sample_sites()
    
    # Save results
    analyzer.save_analysis()
    
    # Generate recommendations
    recommendations = analyzer.generate_selector_recommendations()
    
    # Print summary
    print(f"\n📊 ANALYSIS SUMMARY")
    print(f"=" * 30)
    print(f"Sites analyzed: {len(results)}")
    successful = sum(1 for r in results if r['status'] == 'success')
    print(f"Successful analyses: {successful}")
    
    print(f"\n🎯 TOP SELECTOR RECOMMENDATIONS")
    print(f"=" * 40)
    
    print("\nDescription Selectors (by frequency):")
    for selector, count in list(recommendations['description_selectors'].items())[:10]:
        print(f"  {selector}: {count} sites")
    
    print("\nRequirements Selectors (by frequency):")
    for selector, count in list(recommendations['requirements_selectors'].items())[:10]:
        print(f"  {selector}: {count} sites")
    
    print("\nDate Selectors (by frequency):")
    for selector, count in list(recommendations['date_selectors'].items())[:10]:
        print(f"  {selector}: {count} sites")
    
    # Save recommendations
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    rec_filename = f"selector_recommendations_{timestamp}.json"
    with open(rec_filename, 'w', encoding='utf-8') as f:
        json.dump(recommendations, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Recommendations saved to {rec_filename}")

if __name__ == "__main__":
    main() 