#!/usr/bin/env python3

"""
Script to process all BrightStar jobs and extract clean Apply URLs
"""

import json
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, parse_qs
import re

def extract_apply_url_from_page(job_detail_url):
    """Extract the Apply button URL from a job detail page using requests."""
    try:
        # Use requests instead of Selenium for faster processing
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(job_detail_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for Apply button or application link
        apply_selectors = [
            'a[href*="apply"]',
            'a[href*="application"]', 
            '.apply-button',
            '.apply-link',
            '[class*="apply"]'
        ]
        
        for selector in apply_selectors:
            apply_elements = soup.select(selector)
            for apply_elem in apply_elements:
                href = apply_elem.get('href')
                text = apply_elem.get_text().strip().lower()
                
                # Skip elements that are clearly not apply buttons
                if any(skip_word in text for skip_word in ['back', 'home', 'search', 'browse']):
                    continue
                
                # Check href attribute
                if href and isinstance(href, str):
                    if href.startswith('http'):
                        return clean_apply_url(href)
                    elif href.startswith('/'):
                        full_url = urljoin('https://careers.brightstarcare.com', href)
                        return clean_apply_url(full_url)
        
        # If no specific apply URL found, return the original URL
        return job_detail_url
        
    except Exception as e:
        print(f"  Error extracting from {job_detail_url}: {e}")
        return job_detail_url

def clean_apply_url(apply_url):
    """Clean the apply URL to get the direct application link."""
    try:
        # Parse the URL to check if it's a redirect
        parsed = urlparse(apply_url)
        
        # If it's a BrightStar redirect URL, extract the real URL from the query parameter
        if 'apply-now.php' in parsed.path and 'url=' in parsed.query:
            query_params = parse_qs(parsed.query)
            if 'url' in query_params and query_params['url']:
                real_url = query_params['url'][0]
                # Remove fragment (everything after #)
                if '#' in real_url:
                    real_url = real_url.split('#')[0]
                return real_url
        
        return apply_url
    except:
        return apply_url

def process_all_jobs(json_file_path, batch_size=50):
    """Process all jobs to extract Apply URLs in batches."""
    
    # Load existing job data
    print(f"Loading job data from {json_file_path}")
    with open(json_file_path, 'r', encoding='utf-8') as f:
        jobs = json.load(f)
    
    print(f"Found {len(jobs)} jobs total")
    print(f"Processing in batches of {batch_size}")
    
    updated_count = 0
    total_batches = (len(jobs) + batch_size - 1) // batch_size
    
    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min(start_idx + batch_size, len(jobs))
        
        print(f"\\n=== BATCH {batch_num + 1}/{total_batches} (jobs {start_idx + 1}-{end_idx}) ===")
        
        for i in range(start_idx, end_idx):
            job = jobs[i]
            job_num = i + 1
            
            print(f"[{job_num}/{len(jobs)}] {job['title']}")
            
            original_url = job['url']
            
            # Extract Apply URL
            apply_url = extract_apply_url_from_page(original_url)
            
            if apply_url != original_url:
                job['url'] = apply_url
                job['original_detail_url'] = original_url  # Keep track of the detail page
                updated_count += 1
                print(f"  ✓ Updated to: {apply_url}")
            else:
                print(f"  → No change")
            
            # Be respectful to the server
            time.sleep(0.5)
        
        # Save progress after each batch
        temp_file = json_file_path.replace('.json', f'_temp_batch_{batch_num + 1}.json')
        with open(temp_file, 'w', encoding='utf-8') as f:
            json.dump(jobs, f, indent=2, ensure_ascii=False)
        print(f"Saved progress to {temp_file}")
        
        # Small break between batches
        if batch_num < total_batches - 1:
            print("Pausing 5 seconds between batches...")
            time.sleep(5)
    
    # Save final updated data
    output_file = json_file_path.replace('.json', '_with_apply_urls.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)
    
    print(f"\\n=== FINAL SUMMARY ===")
    print(f"Processed {len(jobs)} jobs total")
    print(f"Updated {updated_count} jobs with new Apply URLs")
    print(f"Saved final data to: {output_file}")
    
    # Show some examples
    if updated_count > 0:
        print(f"\\nExamples of updated URLs:")
        count = 0
        for job in jobs:
            if 'original_detail_url' in job:
                print(f"  {job['title']}")
                print(f"    Detail: {job.get('original_detail_url', 'N/A')}")
                print(f"    Apply:  {job['url']}")
                count += 1
                if count >= 5:  # Show max 5 examples
                    break
    
    return output_file

if __name__ == "__main__":
    # Process all BrightStar job data
    json_file = "brightstar_ct_jobs_1000_20250625_002803.json"
    
    print("This will process all 1000 jobs to extract Apply URLs.")
    print("This may take 10-15 minutes to complete respectfully.")
    
    confirmation = input("Continue? (y/N): ")
    if confirmation.lower() in ['y', 'yes']:
        output_file = process_all_jobs(json_file, batch_size=50)
        print(f"\\nCompleted! Updated file: {output_file}")
    else:
        print("Cancelled.") 