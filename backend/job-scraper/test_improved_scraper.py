#!/usr/bin/env python3
"""
Test script for the improved Connecticut job scraper.
This script runs the scraper on a few test sites to verify functionality.
"""

import sys
import os
from improved_ct_scraper import ImprovedCTJobScraper

def test_scraper():
    """Test the improved scraper with a few sites."""
    print("🧪 Testing Improved Connecticut Job Scraper...")
    
    # Create scraper instance
    scraper = ImprovedCTJobScraper(headless=True, debug=True)  # Set headless=True for server environment
    
    # Test with just 2 sites
    jobs = scraper.scrape_all_sites(max_sites=2, max_jobs_per_site=5)
    
    if jobs:
        print(f"✅ Test successful! Found {len(jobs)} jobs")
        
        # Save test results
        scraper.save_jobs(jobs, "test_improved_ct_jobs")
        
        # Print summary
        scraper.print_summary()
        
        # Show first few jobs
        print("\n📋 Sample jobs found:")
        for i, job in enumerate(jobs[:3], 1):
            print(f"\n{i}. {job.get('title', 'No title')}")
            print(f"   Company: {job.get('company', 'No company')}")
            print(f"   Location: {job.get('location', 'No location')}")
            print(f"   URL: {job.get('job_url', 'No URL')}")
            if job.get('salary'):
                print(f"   Salary: {job['salary']}")
            if job.get('job_type'):
                print(f"   Type: {job['job_type']}")
    else:
        print("❌ Test failed - no jobs found")

if __name__ == "__main__":
    test_scraper() 