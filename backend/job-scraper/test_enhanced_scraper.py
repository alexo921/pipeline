#!/usr/bin/env python3
"""
Test script for the Enhanced Healthcare Job Scraper
Tests the improved scraper with a small sample of sites
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enhanced_comprehensive_scraper import EnhancedHealthcareScraper
import json
from datetime import datetime

def test_enhanced_scraper():
    """Test the enhanced scraper with improvements."""
    print("🧪 Testing Enhanced Healthcare Job Scraper v2.2 (Sequential Mode)")
    print("=" * 60)
    
    # Initialize scraper with debug mode for better feedback
    scraper = EnhancedHealthcareScraper(headless=True, debug=True, max_workers=1)
    
    # Test with fewer sites to avoid conflicts
    print("🔧 Testing with 3 sample sites (sequential mode)...")
    
    try:
        # Scrape a small number of sites
        jobs = scraper.scrape_all_sites(max_sites=3, max_pages_per_site=2)
        
        print(f"\n📊 Test Results Summary:")
        print(f"   • Total Jobs Found: {len(jobs)}")
        print(f"   • Sites Processed: {scraper.scraping_stats['sites_processed']}")
        print(f"   • Sites Successful: {scraper.scraping_stats['sites_successful']}")
        print(f"   • Sites Failed: {scraper.scraping_stats['sites_failed']}")
        print(f"   • Success Rate: {(scraper.scraping_stats['sites_successful'] / scraper.scraping_stats['sites_processed'] * 100):.1f}%" if scraper.scraping_stats['sites_processed'] > 0 else "0%")
        
        if jobs:
            # Show sample job data
            print(f"\n📋 Sample Job Data:")
            sample_job = jobs[0]
            for key, value in sample_job.items():
                if key not in ['description', 'requirements', 'benefits']:  # Skip long fields
                    print(f"   • {key}: {value}")
            
            # Data quality analysis
            jobs_with_url = sum(1 for job in jobs if job.get('url'))
            jobs_with_salary = sum(1 for job in jobs if job.get('salary'))
            jobs_with_location = sum(1 for job in jobs if job.get('location'))
            
            print(f"\n📈 Data Quality Metrics:")
            print(f"   • Jobs with URL: {jobs_with_url}/{len(jobs)} ({jobs_with_url/len(jobs)*100:.1f}%)")
            print(f"   • Jobs with Salary: {jobs_with_salary}/{len(jobs)} ({jobs_with_salary/len(jobs)*100:.1f}%)")
            print(f"   • Jobs with Location: {jobs_with_location}/{len(jobs)} ({jobs_with_location/len(jobs)*100:.1f}%)")
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"test_enhanced_scraper_{len(jobs)}_{timestamp}.json"
        summary_file = f"test_enhanced_scraper_{len(jobs)}_{timestamp}_summary_{timestamp}.json"
        
        with open(results_file, 'w') as f:
            json.dump(jobs, f, indent=2, default=str)
        
        # Save summary statistics
        summary = {
            'test_timestamp': timestamp,
            'total_jobs': len(jobs),
            'sites_processed': scraper.scraping_stats['sites_processed'],
            'sites_successful': scraper.scraping_stats['sites_successful'],
            'sites_failed': scraper.scraping_stats['sites_failed'],
            'success_rate': (scraper.scraping_stats['sites_successful'] / scraper.scraping_stats['sites_processed'] * 100) if scraper.scraping_stats['sites_processed'] > 0 else 0,
            'data_quality': {
                'jobs_with_url': sum(1 for job in jobs if job.get('url')),
                'jobs_with_salary': sum(1 for job in jobs if job.get('salary')),
                'jobs_with_location': sum(1 for job in jobs if job.get('location')),
                'jobs_with_company': sum(1 for job in jobs if job.get('company')),
                'jobs_with_job_type': sum(1 for job in jobs if job.get('job_type')),
            },
            'errors': scraper.scraping_stats['errors'],
            'scraping_stats': scraper.scraping_stats
        }
        
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        print(f"\n💾 Results saved to:")
        print(f"   • Jobs: {results_file}")
        print(f"   • Summary: {summary_file}")
        
        return jobs
        
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        return []
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        return []

if __name__ == "__main__":
    test_enhanced_scraper() 