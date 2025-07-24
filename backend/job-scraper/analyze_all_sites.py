#!/usr/bin/env python3
"""
Comprehensive analysis of all 27 Apploi sites to determine optimal job extraction URLs
"""

import csv
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import json
from urllib.parse import urljoin, urlparse
import re

def analyze_site_structure(url, site_name):
    """Analyze a single site's structure to find job-related content."""
    
    print(f"\n🔍 Analyzing: {site_name}")
    print(f"   URL: {url}")
    
    # Setup driver
    options = uc.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-images')
    
    driver = uc.Chrome(options=options)
    
    try:
        # Visit the site
        print(f"   📄 Loading page...")
        driver.get(url)
        time.sleep(5)
        
        # Get page info
        title = driver.title
        current_url = driver.current_url
        
        print(f"   📋 Page title: {title}")
        print(f"   🔗 Current URL: {current_url}")
        
        # Look for job-related elements
        job_indicators = {
            'job_links': [],
            'career_links': [],
            'position_links': [],
            'apply_links': [],
            'job_containers': [],
            'iframe_sources': [],
            'redirects': []
        }
        
        # Check for iframes
        iframes = driver.find_elements(By.TAG_NAME, 'iframe')
        for iframe in iframes:
            try:
                src = iframe.get_attribute('src')
                if src:
                    job_indicators['iframe_sources'].append(src)
                    print(f"   🖼️ Found iframe: {src}")
            except:
                pass
        
        # Look for job-related links
        all_links = driver.find_elements(By.TAG_NAME, 'a')
        for link in all_links:
            try:
                href = link.get_attribute('href')
                text = link.text.lower().strip()
                
                if not href:
                    continue
                    
                # Check for job-related URLs
                if any(keyword in href.lower() for keyword in ['job', 'career', 'position', 'apply', 'employment']):
                    job_indicators['job_links'].append({
                        'text': link.text.strip(),
                        'url': href,
                        'type': 'job_related'
                    })
                
                # Check for career-related text
                if any(keyword in text for keyword in ['job', 'career', 'position', 'apply', 'employment', 'opportunity']):
                    job_indicators['career_links'].append({
                        'text': link.text.strip(),
                        'url': href,
                        'type': 'career_text'
                    })
                    
            except:
                pass
        
        # Look for job containers
        job_selectors = [
            '.job', '.career', '.position', '.employment',
            '[class*="job"]', '[class*="career"]', '[class*="position"]',
            '[id*="job"]', '[id*="career"]', '[id*="position"]',
            '.listing', '.posting', '.opening'
        ]
        
        for selector in job_selectors:
            try:
                elements = driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    job_indicators['job_containers'].append({
                        'selector': selector,
                        'count': len(elements)
                    })
            except:
                pass
        
        # Check for redirects
        if current_url != url:
            job_indicators['redirects'].append(current_url)
        
        # Look for common job board patterns
        page_source = driver.page_source.lower()
        
        # Check for specific job board indicators
        job_board_indicators = {
            'apploi': 'apploi' in page_source or 'apploi' in current_url,
            'icims': 'icims' in current_url,
            'paycom': 'paycom' in current_url,
            'dayforce': 'dayforce' in current_url,
            'adp': 'adp' in current_url,
            'hireology': 'hireology' in current_url,
            'ultipro': 'ultipro' in current_url,
            'paylocity': 'paylocity' in current_url,
            'applicantpool': 'applicantpool' in current_url,
            'oracle': 'oracle' in current_url
        }
        
        # Determine site type and recommendations
        site_analysis = {
            'site_name': site_name,
            'original_url': url,
            'current_url': current_url,
            'title': title,
            'job_board_type': None,
            'has_job_content': False,
            'recommended_urls': [],
            'job_indicators': job_indicators,
            'job_board_indicators': job_board_indicators,
            'recommendations': []
        }
        
        # Determine job board type
        for board, detected in job_board_indicators.items():
            if detected:
                site_analysis['job_board_type'] = board
                break
        
        # Check if site has job content
        has_jobs = (
            len(job_indicators['job_links']) > 0 or
            len(job_indicators['career_links']) > 0 or
            len(job_indicators['job_containers']) > 0 or
            any(job_board_indicators.values())
        )
        
        site_analysis['has_job_content'] = has_jobs
        
        # Generate recommendations
        if site_analysis['job_board_type']:
            site_analysis['recommendations'].append(f"Uses {site_analysis['job_board_type'].upper()} job board")
        
        if job_indicators['iframe_sources']:
            site_analysis['recommendations'].append("Has iframes - may need to switch context")
            site_analysis['recommended_urls'].extend(job_indicators['iframe_sources'])
        
        if job_indicators['redirects']:
            site_analysis['recommendations'].append("Site redirects to different URL")
            site_analysis['recommended_urls'].extend(job_indicators['redirects'])
        
        # Add job-related links as recommended URLs
        for link in job_indicators['job_links']:
            site_analysis['recommended_urls'].append(link['url'])
        
        # Print summary
        print(f"   📊 Analysis Summary:")
        print(f"      Job board type: {site_analysis['job_board_type'] or 'Unknown'}")
        print(f"      Has job content: {has_jobs}")
        print(f"      Job links found: {len(job_indicators['job_links'])}")
        print(f"      Career links found: {len(job_indicators['career_links'])}")
        print(f"      Job containers found: {len(job_indicators['job_containers'])}")
        print(f"      Iframes found: {len(job_indicators['iframe_sources'])}")
        
        if site_analysis['recommendations']:
            print(f"      Recommendations: {', '.join(site_analysis['recommendations'])}")
        
        return site_analysis
        
    except Exception as e:
        print(f"   ❌ Error analyzing {site_name}: {e}")
        return {
            'site_name': site_name,
            'original_url': url,
            'error': str(e),
            'has_job_content': False,
            'recommended_urls': []
        }
    finally:
        driver.quit()

def main():
    """Analyze all sites in the CSV file."""
    
    print("🚀 Starting comprehensive site analysis...")
    
    # Load sites from CSV
    sites = []
    with open('ct_only.csv', 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get('search_url') and row.get('source_site'):
                sites.append({
                    'name': row['source_site'],
                    'url': row['search_url'],
                    'job_board_type': row.get('job board type', '').lower()
                })
    
    print(f"📊 Found {len(sites)} sites to analyze")
    
    # Analyze each site
    results = []
    for i, site in enumerate(sites, 1):
        print(f"\n{'='*80}")
        print(f"📋 Processing {i}/{len(sites)}: {site['name']}")
        print(f"{'='*80}")
        
        analysis = analyze_site_structure(site['url'], site['name'])
        analysis['csv_job_board_type'] = site['job_board_type']
        results.append(analysis)
        
        # Small delay between sites
        time.sleep(2)
    
    # Save results
    with open('site_analysis_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    # Generate summary report
    print(f"\n{'='*80}")
    print("📊 ANALYSIS SUMMARY")
    print(f"{'='*80}")
    
    sites_with_jobs = [r for r in results if r.get('has_job_content', False)]
    sites_with_errors = [r for r in results if 'error' in r]
    
    print(f"Total sites analyzed: {len(results)}")
    print(f"Sites with job content: {len(sites_with_jobs)}")
    print(f"Sites with errors: {len(sites_with_errors)}")
    
    # Group by job board type
    job_board_types = {}
    for result in results:
        board_type = result.get('job_board_type', 'unknown')
        if board_type not in job_board_types:
            job_board_types[board_type] = []
        job_board_types[board_type].append(result['site_name'])
    
    print(f"\n📋 Sites by Job Board Type:")
    for board_type, site_names in job_board_types.items():
        board_display = board_type.upper() if board_type else "UNKNOWN"
        print(f"   {board_display}: {len(site_names)} sites")
        for name in site_names[:3]:  # Show first 3
            print(f"     - {name}")
        if len(site_names) > 3:
            print(f"     ... and {len(site_names) - 3} more")
    
    # Show sites with job content
    print(f"\n✅ Sites with Job Content ({len(sites_with_jobs)}):")
    for result in sites_with_jobs:
        print(f"   - {result['site_name']} ({result.get('job_board_type', 'unknown')})")
    
    # Show sites with errors
    if sites_with_errors:
        print(f"\n❌ Sites with Errors ({len(sites_with_errors)}):")
        for result in sites_with_errors:
            print(f"   - {result['site_name']}: {result['error']}")
    
    print(f"\n💾 Detailed results saved to: site_analysis_results.json")

if __name__ == "__main__":
    main() 