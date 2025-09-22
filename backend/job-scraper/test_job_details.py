#!/usr/bin/env python3
"""
Test script to specifically test job detail extraction from Apploi pages.
This will help us debug why we're not getting actual job descriptions.
"""

import sys
import os
from improved_ct_scraper import ImprovedCTJobScraper

def test_job_details():
    """Test job detail extraction from a few Apploi job URLs."""
    print("🧪 Testing Job Detail Extraction from Apploi Pages...")

    # Create scraper instance with debug enabled
    scraper = ImprovedCTJobScraper(headless=True, debug=True)

    # Test URLs including the specific one provided
    test_urls = [
        "https://jobs.apploi.com/view/740335?utm_campaign=jobs_snippet&utm_source=waterbury-nh-career-page&utm_medium=client-web-site&utm_term=josh-reiss&_=1753382341.098593",
        "https://jobs.apploi.com/view/865692?utm_campaign=jobs_snippet&utm_source=Ryders_Health_Management-career-page&utm_medium=client-web-site&utm_term=apploi-snippet",
        "https://jobs.apploi.com/view/1530909?utm_campaign=jobs_snippet&utm_source=Ryders_Health_Management-career-page&utm_medium=client-web-site&utm_term=apploi-snippet"
    ]

    if not scraper._setup_browser():
        print("❌ Failed to setup browser")
        return

    try:
        for i, url in enumerate(test_urls, 1):
            print(f"\n🔍 Testing URL {i}: {url}")
            
            # Create a dummy site config
            site_config = {
                'source_site': 'TestSite',
                'search_url': 'https://test.com',
                'job_board_type': 'apploi'
            }
            
            # Extract job details
            job_details = scraper._extract_job_details(scraper.page, url, site_config)
            
            if job_details:
                print(f"✅ Successfully extracted job details:")
                print(f"   Title: {job_details.get('title', 'N/A')}")
                print(f"   Company: {job_details.get('company', 'N/A')}")
                print(f"   Location: {job_details.get('location', 'N/A')}")
                print(f"   Description length: {len(job_details.get('description', ''))}")
                if job_details.get('description'):
                    print(f"   Description preview: {job_details['description'][:200]}...")
                else:
                    print(f"   Description: None")
            else:
                print(f"❌ No job details extracted")
            
            print("-" * 80)

    except Exception as e:
        print(f"❌ Error during testing: {e}")
    
    finally:
        scraper.browser.close()

if __name__ == "__main__":
    test_job_details() 