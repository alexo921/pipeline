#!/usr/bin/env python3
"""
Full-scale healthcare job scraper - designed to collect thousands of jobs
"""

import json
import sys
import time
import random
from pathlib import Path
from datetime import datetime

# Add current directory to path for imports
sys.path.append(str(Path(__file__).parent))

from enhanced_selenium_scraper import EnhancedJobScraper

def load_all_healthcare_sites():
    """Load all healthcare job sites from JSON file."""
    try:
        with open('healthcare_sites.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ healthcare_sites.json not found")
        return None

def prepare_site_list(sites_config):
    """Prepare a comprehensive list of sites to scrape."""
    all_sites = []
    
    # Add all categories with priorities
    categories = [
        ('general_aggregators', 'HIGH'),      # Usually most jobs
        ('primary_healthcare_sites', 'HIGH'), # Specialized healthcare
        ('specialized_healthcare', 'MEDIUM'), # Focused sites
        ('company_career_pages', 'MEDIUM'),   # Company sites
        ('government_sites', 'LOW'),          # Government jobs
        ('regional_sites', 'LOW'),            # Regional focus
        ('niche_healthcare', 'LOW')           # Niche markets
    ]
    
    for category, priority in categories:
        if category in sites_config:
            for site in sites_config[category]:
                site_info = {
                    'name': site['name'],
                    'url': site['url'] + site.get('search_params', ''),
                    'category': category,
                    'priority': priority,
                    'focus': site.get('focus', [])
                }
                all_sites.append(site_info)
    
    # Sort by priority: HIGH -> MEDIUM -> LOW
    priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    all_sites.sort(key=lambda x: priority_order[x['priority']])
    
    return all_sites

def run_comprehensive_scrape():
    """Run a comprehensive scraping session."""
    print("🚀 FULL-SCALE HEALTHCARE JOB SCRAPER")
    print("=" * 60)
    
    # Load all sites
    sites_config = load_all_healthcare_sites()
    if not sites_config:
        return
    
    all_sites = prepare_site_list(sites_config)
    
    print(f"📊 Loaded {len(all_sites)} healthcare job sites:")
    
    # Show site breakdown by category
    categories = {}
    for site in all_sites:
        cat = site['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    for cat, count in categories.items():
        print(f"   📂 {cat.replace('_', ' ').title()}: {count} sites")
    
    print(f"\n🎯 STRATEGY: Progressive scraping with multiple approaches")
    print(f"   • Start with high-priority sites (most likely to have jobs)")
    print(f"   • Use multiple pages per site")
    print(f"   • Implement delays to avoid rate limiting")
    print(f"   • Save progress incrementally")
    
    # Start comprehensive scraping
    all_jobs = []
    successful_sites = []
    failed_sites = []
    
    try:
        with EnhancedJobScraper(headless=True) as scraper:
            print(f"\n🔥 Starting comprehensive scraping session...")
            print(f"   Time started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            for i, site in enumerate(all_sites, 1):
                try:
                    print(f"\n🔍 [{i}/{len(all_sites)}] Scraping: {site['name']}")
                    print(f"   Priority: {site['priority']} | Category: {site['category']}")
                    print(f"   URL: {site['url']}")
                    
                    # Determine pages based on priority
                    max_pages = {
                        'HIGH': 5,    # High priority sites get more pages
                        'MEDIUM': 3,  # Medium priority sites
                        'LOW': 2      # Low priority sites
                    }[site['priority']]
                    
                    jobs = scraper.scrape_site(site['url'], max_pages=max_pages)
                    
                    if jobs:
                        all_jobs.extend(jobs)
                        successful_sites.append(site['name'])
                        print(f"   ✅ Found {len(jobs)} jobs! (Total: {len(all_jobs)})")
                        
                        # Save incremental progress every 100 jobs
                        if len(all_jobs) % 100 == 0 and len(all_jobs) > 0:
                            save_incremental_results(all_jobs, len(all_jobs))
                    else:
                        failed_sites.append(site['name'])
                        print(f"   ⚠️  No jobs found")
                    
                    # Progress update
                    if i % 5 == 0 or len(all_jobs) >= 100:
                        print(f"\n📊 Progress Update:")
                        print(f"   Sites processed: {i}/{len(all_sites)}")
                        print(f"   Total jobs found: {len(all_jobs)}")
                        print(f"   Successful sites: {len(successful_sites)}")
                        print(f"   Average jobs per successful site: {len(all_jobs)/max(1, len(successful_sites)):.1f}")
                    
                    # Longer delay between sites to avoid detection
                    delay = random.uniform(3, 8)
                    print(f"   ⏳ Waiting {delay:.1f}s before next site...")
                    time.sleep(delay)
                    
                    # Early exit if we have enough jobs
                    if len(all_jobs) >= 1000:
                        print(f"\n🎉 TARGET REACHED! Found {len(all_jobs)} jobs!")
                        break
                        
                except KeyboardInterrupt:
                    print(f"\n⏹️  Scraping interrupted by user")
                    break
                except Exception as e:
                    failed_sites.append(site['name'])
                    print(f"   ❌ Error: {e}")
                    continue
            
            # Final results
            print(f"\n🏁 SCRAPING SESSION COMPLETE!")
            print(f"=" * 50)
            print(f"📊 Final Statistics:")
            print(f"   Total jobs collected: {len(all_jobs)}")
            print(f"   Sites attempted: {i}")
            print(f"   Successful sites: {len(successful_sites)}")
            print(f"   Failed sites: {len(failed_sites)}")
            print(f"   Success rate: {len(successful_sites)/(i)*100:.1f}%")
            
            if all_jobs:
                # Filter for quality jobs
                quality_jobs = [job for job in all_jobs if job.quality_score >= 50]
                high_quality_jobs = [job for job in all_jobs if job.quality_score >= 70]
                
                print(f"\n📈 Quality Analysis:")
                print(f"   All jobs: {len(all_jobs)}")
                print(f"   Quality jobs (score ≥50): {len(quality_jobs)}")
                print(f"   High-quality jobs (score ≥70): {len(high_quality_jobs)}")
                
                # Category breakdown
                categories = {}
                for job in quality_jobs:
                    cat = getattr(job, 'category', 'other') or 'other'
                    categories[cat] = categories.get(cat, 0) + 1
                
                print(f"\n🏷️  Job Categories (Quality jobs):")
                for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                    print(f"   {cat}: {count}")
                
                # Save comprehensive results
                save_final_results(scraper, all_jobs, quality_jobs, high_quality_jobs)
                
                print(f"\n💾 Results saved in multiple formats!")
                return len(all_jobs)
            else:
                print(f"\n😞 No jobs found across all sites")
                print(f"   This may be due to:")
                print(f"   • Heavy anti-bot protection")
                print(f"   • Outdated CSS selectors")
                print(f"   • Network/connectivity issues")
                return 0
                
    except Exception as e:
        print(f"❌ Scraping session failed: {e}")
        if all_jobs:
            save_emergency_results(all_jobs)
        return len(all_jobs)

def save_incremental_results(jobs, count):
    """Save incremental results during scraping."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"incremental_jobs_{count}_{timestamp}.json"
    
    with open(filename, 'w') as f:
        json.dump([job.to_dict() for job in jobs], f, indent=2, default=str)
    
    print(f"   💾 Incremental save: {filename}")

def save_final_results(scraper, all_jobs, quality_jobs, high_quality_jobs):
    """Save comprehensive final results."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save all jobs
    scraper.save_results(all_jobs, 'json')
    scraper.save_results(all_jobs, 'csv')
    
    # Save quality jobs separately
    if quality_jobs:
        quality_filename = f"quality_jobs_{len(quality_jobs)}_{timestamp}.json"
        with open(quality_filename, 'w') as f:
            json.dump([job.to_dict() for job in quality_jobs], f, indent=2, default=str)
    
    # Save high-quality jobs
    if high_quality_jobs:
        hq_filename = f"high_quality_jobs_{len(high_quality_jobs)}_{timestamp}.json"
        with open(hq_filename, 'w') as f:
            json.dump([job.to_dict() for job in high_quality_jobs], f, indent=2, default=str)

def save_emergency_results(jobs):
    """Save results in case of emergency/interruption."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"emergency_save_{len(jobs)}_{timestamp}.json"
    
    with open(filename, 'w') as f:
        json.dump([job.to_dict() for job in jobs], f, indent=2, default=str)
    
    print(f"🚨 Emergency save completed: {filename}")

def main():
    print("🚀 FULL-SCALE HEALTHCARE JOB SCRAPER")
    print("🎯 Target: Thousands of healthcare jobs")
    print("=" * 60)
    
    start_time = datetime.now()
    
    try:
        total_jobs = run_comprehensive_scrape()
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        print(f"\n⏱️  Session Summary:")
        print(f"   Start time: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   End time: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   Duration: {duration}")
        print(f"   Jobs collected: {total_jobs}")
        
        if total_jobs > 0:
            print(f"   Rate: {total_jobs / (duration.total_seconds() / 60):.1f} jobs/minute")
        
        if total_jobs >= 1000:
            print(f"\n🎉 SUCCESS! Collected {total_jobs} jobs!")
        elif total_jobs >= 100:
            print(f"\n✅ Good progress! Collected {total_jobs} jobs!")
        else:
            print(f"\n⚠️  Limited results: {total_jobs} jobs")
            print(f"   Consider trying alternative scraping strategies")
        
    except KeyboardInterrupt:
        print(f"\n⏹️  Scraping interrupted by user")
    except Exception as e:
        print(f"\n❌ Scraping failed: {e}")

if __name__ == "__main__":
    main() 