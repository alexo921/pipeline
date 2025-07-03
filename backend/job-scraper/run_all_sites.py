#!/usr/bin/env python3
"""
Comprehensive Healthcare Job Scraper - Run All Sites
=====================================================

This script runs the comprehensive healthcare scraper for all 194 sites
configured in the "Job Board Data Scrape.csv" file.

Usage:
    python run_all_sites.py

Options can be modified in the script below.
"""

import sys
import os
from datetime import datetime

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from comprehensive_healthcare_scraper import ComprehensiveHealthcareScraper

def main():
    """Run the comprehensive healthcare scraper for all sites."""
    
    print("🚀 Starting Comprehensive Healthcare Job Scraping")
    print("=" * 60)
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Configuration options
    HEADLESS = True          # Set to False to see browser (for debugging)
    DEBUG = False            # Set to True for detailed logging
    MAX_SITES = None         # None = all sites, or specify a number like 50
    MAX_PAGES_PER_SITE = 30   # Number of pages to scrape per site (1-10 recommended)
    
    print("⚙️ Configuration:")
    print(f"   Headless mode: {HEADLESS}")
    print(f"   Debug mode: {DEBUG}")
    print(f"   Max sites: {MAX_SITES or 'All (194)'}")
    print(f"   Max pages per site: {MAX_PAGES_PER_SITE}")
    print()
    
    try:
        # Initialize scraper
        scraper = ComprehensiveHealthcareScraper(headless=HEADLESS, debug=DEBUG)
        
        # Run scraping
        print("🔍 Starting scrape process...")
        jobs = scraper.scrape_all_sites(
            max_sites=MAX_SITES, 
            max_pages_per_site=MAX_PAGES_PER_SITE
        )
        
        if jobs:
            print(f"\n✅ Scraping completed successfully!")
            print(f"📊 Total jobs found: {len(jobs)}")
            
            # Save results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename_prefix = f"comprehensive_healthcare_jobs_{len(jobs)}_{timestamp}"
            
            scraper.jobs = jobs  # Set jobs for saving
            scraper.save_jobs(filename_prefix)
            scraper.print_summary()
            
            print(f"\n💾 Results saved as:")
            print(f"   📄 {filename_prefix}.json")
            print(f"   📊 {filename_prefix}.csv")
            
        else:
            print("\n❌ No jobs were found. Check the logs for issues.")
            
    except KeyboardInterrupt:
        print("\n\n⏹️ Scraping interrupted by user")
        print("Partial results may have been saved.")
        
    except Exception as e:
        print(f"\n❌ Error during scraping: {e}")
        print("Check the logs for more details.")
        
    finally:
        print(f"\n🏁 Process completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main() 