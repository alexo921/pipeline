#!/usr/bin/env python3

"""
Enhanced description extraction for BrightStar Care job pages
"""

import json
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import re

def extract_comprehensive_description(job_url):
    """Extract a comprehensive job description from a BrightStar job page."""
    try:
        print(f"Extracting description from: {job_url}")
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(job_url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Remove unwanted elements
        for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside']):
            element.decompose()
        
        description_parts = []
        
        # Strategy 1: Look for structured job description containers
        job_desc_selectors = [
            '.job-description',
            '.job-details', 
            '.job-content',
            '.position-description',
            '.job-posting',
            '.job-summary',
            '[class*="description"]',
            '[class*="detail"]',
            '[class*="content"]',
            '.entry-content',
            '.post-content',
            'article',
            'main .content',
            '.page-content'
        ]
        
        found_description = False
        for selector in job_desc_selectors:
            containers = soup.select(selector)
            for container in containers:
                text_content = []
                
                # Extract text from various elements
                for elem in container.find_all(['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span']):
                    text = elem.get_text().strip()
                    if text and len(text) > 10:
                        # Clean up the text
                        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
                        text_content.append(text)
                
                if text_content:
                    description_parts.extend(text_content)
                    found_description = True
                    break
            
            if found_description:
                break
        
        # Strategy 2: If no structured description found, extract from main content
        if not found_description:
            print("  No structured description found, extracting from main content...")
            
            # Look for main content areas
            main_selectors = [
                'main',
                '.main',
                '.container',
                '.content',
                '.wrapper',
                'body'
            ]
            
            for selector in main_selectors:
                main_container = soup.select_one(selector)
                if main_container:
                    # Extract all meaningful text
                    for elem in main_container.find_all(['p', 'div', 'li', 'h1', 'h2', 'h3', 'h4', 'h5']):
                        text = elem.get_text().strip()
                        if text and len(text) > 15:
                            # Skip navigation, footer, and other non-content
                            skip_phrases = [
                                'navigation', 'menu', 'footer', 'header', 'sidebar',
                                'cookie', 'privacy', 'terms', 'copyright', '©',
                                'follow us', 'social media', 'facebook', 'twitter',
                                'linkedin', 'instagram', 'contact us', 'about us',
                                'brightstar care', 'find a location', 'services',
                                'franchise', 'careers', 'news', 'blog'
                            ]
                            
                            if not any(phrase in text.lower() for phrase in skip_phrases):
                                # Clean up the text
                                text = re.sub(r'\s+', ' ', text)
                                description_parts.append(text)
                    break
        
        # Strategy 3: Extract specific job-related content patterns
        job_keywords = [
            'responsibilities', 'duties', 'requirements', 'qualifications',
            'experience', 'skills', 'education', 'benefits', 'compensation',
            'schedule', 'hours', 'shift', 'full-time', 'part-time',
            'caregiver', 'nurse', 'cna', 'rn', 'lpn', 'aide', 'assistant',
            'patient', 'client', 'care', 'medical', 'healthcare', 'clinical'
        ]
        
        job_related_parts = []
        for part in description_parts:
            if any(keyword in part.lower() for keyword in job_keywords):
                job_related_parts.append(part)
        
        # Use job-related parts if we found them, otherwise use all parts
        final_parts = job_related_parts if job_related_parts else description_parts
        
        # Remove duplicates while preserving order
        seen = set()
        unique_parts = []
        for part in final_parts:
            if part not in seen and len(part) > 20:
                seen.add(part)
                unique_parts.append(part)
        
        # Combine into a comprehensive description
        if unique_parts:
            description = ' '.join(unique_parts[:15])  # Take up to 15 relevant parts
            
            # Clean up the final description
            description = re.sub(r'\s+', ' ', description)  # Normalize whitespace
            description = description.strip()
            
            # Limit length but try to end at a sentence
            if len(description) > 2000:
                # Try to cut at a sentence boundary
                sentences = description.split('.')
                truncated = ''
                for sentence in sentences:
                    if len(truncated + sentence + '.') <= 2000:
                        truncated += sentence + '.'
                    else:
                        break
                description = truncated if truncated else description[:2000]
            
            print(f"  Extracted {len(description)} characters of description")
            return description
        else:
            print("  No description found")
            return ""
            
    except Exception as e:
        print(f"  Error extracting description: {e}")
        return ""

def update_job_descriptions(json_file_path, max_jobs_to_update=20):
    """Update job descriptions in the JSON file with enhanced extraction."""
    
    # Load existing job data
    print(f"Loading job data from {json_file_path}")
    with open(json_file_path, 'r', encoding='utf-8') as f:
        jobs = json.load(f)
    
    print(f"Found {len(jobs)} jobs total")
    print(f"Will update descriptions for first {max_jobs_to_update} jobs")
    
    updated_count = 0
    
    for i, job in enumerate(jobs[:max_jobs_to_update]):
        print(f"\nProcessing job {i+1}/{max_jobs_to_update}: {job['title']}")
        
        # Get the original detail URL (before Apply URL extraction)
        original_url = job.get('original_detail_url', job['url'])
        
        # If the URL is already a direct apply URL, construct the detail URL
        if 'careerplug.com' in original_url or 'hireology.com' in original_url:
            # Try to find the detail URL from the job ID
            job_id = job.get('id')
            if job_id:
                original_url = f"https://careers.brightstarcare.com/job-detail-{job_id}-{job['title'].lower().replace(' ', '-').replace('/', '-')}"
                print(f"  Constructed detail URL: {original_url}")
        
        print(f"  Current description length: {len(job.get('description', ''))}")
        
        # Extract enhanced description
        enhanced_description = extract_comprehensive_description(original_url)
        
        if enhanced_description and len(enhanced_description) > len(job.get('description', '')):
            job['description'] = enhanced_description
            updated_count += 1
            print(f"  ✓ Updated description ({len(enhanced_description)} chars)")
        else:
            print(f"  → No improvement found")
        
        # Be respectful to the server
        time.sleep(1)
    
    # Save updated data
    output_file = json_file_path.replace('.json', '_enhanced_descriptions.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)
    
    print(f"\n=== SUMMARY ===")
    print(f"Updated descriptions for {updated_count} out of {max_jobs_to_update} jobs")
    print(f"Saved updated data to: {output_file}")
    
    # Show some examples
    if updated_count > 0:
        print(f"\nExamples of enhanced descriptions:")
        count = 0
        for job in jobs[:max_jobs_to_update]:
            if len(job.get('description', '')) > 100:
                print(f"\n{job['title']}:")
                print(f"  Description ({len(job['description'])} chars): {job['description'][:200]}...")
                count += 1
                if count >= 3:  # Show max 3 examples
                    break
    
    return output_file

if __name__ == "__main__":
    # Update the BrightStar job data with enhanced descriptions
    json_file = "../../frontend/web-dashboard/brightstar_ct_jobs_1000_20250625_002803.json"
    
    # Test with first 20 jobs
    output_file = update_job_descriptions(json_file, max_jobs_to_update=20)
    print(f"\nCompleted! Enhanced descriptions saved to: {output_file}") 