#!/usr/bin/env python3

"""
Script to update existing BrightStar job data with actual Apply button URLs
"""

import json
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re

def extract_apply_url_from_page(job_detail_url):
    """Extract the Apply button URL from a job detail page using requests."""
    try:
        print(f"Fetching: {job_detail_url}")
        
        # Use requests instead of Selenium for faster processing
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(job_detail_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
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
            'a[href*="indeed"]',
            'a[href*="ziprecruiter"]',
            'button[onclick*="apply"]'
        ]
        
        for selector in apply_selectors:
            apply_elements = soup.select(selector)
            for apply_elem in apply_elements:
                href = apply_elem.get('href')
                onclick = apply_elem.get('onclick', '')
                text = apply_elem.get_text().strip().lower()
                
                # Skip elements that are clearly not apply buttons
                if any(skip_word in text for skip_word in ['back', 'home', 'search', 'browse']):
                    continue
                
                # Check href attribute
                if href and isinstance(href, str):
                    if href.startswith('http'):
                        print(f"  Found external apply URL: {href}")
                        return href
                    elif href.startswith('/'):
                        full_url = urljoin('https://careers.brightstarcare.com', href)
                        print(f"  Found relative apply URL: {full_url}")
                        return full_url
                
                # Check onclick attribute for URLs
                if onclick and isinstance(onclick, str) and ('http' in onclick or 'apply' in onclick.lower()):
                    url_match = re.search(r'https?://[^\s\'"]+', onclick)
                    if url_match:
                        found_url = url_match.group(0)
                        print(f"  Found apply URL in onclick: {found_url}")
                        return found_url
        
        # If no specific apply URL found, return the original URL
        print(f"  No apply button found, keeping original URL")
        return job_detail_url
        
    except Exception as e:
        print(f"  Error extracting from {job_detail_url}: {e}")
        return job_detail_url

def update_job_urls(json_file_path, max_jobs_to_update=10):
    """Update job URLs in the JSON file with Apply button URLs."""
    
    # Load existing job data
    print(f"Loading job data from {json_file_path}")
    with open(json_file_path, 'r', encoding='utf-8') as f:
        jobs = json.load(f)
    
    print(f"Found {len(jobs)} jobs total")
    print(f"Will update first {max_jobs_to_update} jobs for testing")
    
    updated_count = 0
    
    for i, job in enumerate(jobs[:max_jobs_to_update]):
        print(f"\\nProcessing job {i+1}/{max_jobs_to_update}: {job['title']}")
        
        original_url = job['url']
        print(f"  Original URL: {original_url}")
        
        # Extract Apply URL
        apply_url = extract_apply_url_from_page(original_url)
        
        if apply_url != original_url:
            job['url'] = apply_url
            job['original_detail_url'] = original_url  # Keep track of the detail page
            updated_count += 1
            print(f"  ✓ Updated URL to: {apply_url}")
        else:
            print(f"  → No change needed")
        
        # Be respectful to the server
        time.sleep(1)
    
    # Save updated data
    output_file = json_file_path.replace('.json', '_updated_urls.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)
    
    print(f"\\n=== SUMMARY ===")
    print(f"Updated {updated_count} out of {max_jobs_to_update} jobs")
    print(f"Saved updated data to: {output_file}")
    
    # Show some examples
    if updated_count > 0:
        print(f"\\nExamples of updated URLs:")
        count = 0
        for job in jobs[:max_jobs_to_update]:
            if 'original_detail_url' in job:
                print(f"  {job['title']}")
                print(f"    Detail: {job.get('original_detail_url', 'N/A')}")
                print(f"    Apply:  {job['url']}")
                count += 1
                if count >= 3:  # Show max 3 examples
                    break

if __name__ == "__main__":
    # Update the BrightStar job data
    json_file = "brightstar_ct_jobs_1000_20250625_002803.json"
    
    # Test with just 10 jobs first
    update_job_urls(json_file, max_jobs_to_update=10) 