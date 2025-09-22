#!/usr/bin/env python3
"""
Create comprehensive scraping plan based on site analysis results
"""

import json
import csv
from collections import defaultdict

def load_analysis_results():
    """Load the site analysis results."""
    with open('site_analysis_results.json', 'r') as f:
        return json.load(f)

def create_scraping_plan():
    """Create a comprehensive scraping plan based on analysis results."""
    
    print("🚀 Creating Comprehensive Scraping Plan...")
    
    # Load analysis results
    results = load_analysis_results()
    
    # Categorize sites by job board type and effectiveness
    categories = {
        'apploi_sites': [],
        'major_job_boards': [],
        'custom_sites': [],
        'problematic_sites': []
    }
    
    job_board_mapping = {
        'apploi': 'apploi_sites',
        'icims': 'major_job_boards', 
        'paycom': 'major_job_boards',
        'dayforce': 'major_job_boards',
        'adp': 'major_job_boards',
        'hireology': 'major_job_boards',
        'ultipro': 'major_job_boards',
        'paylocity': 'major_job_boards',
        'applicantpool': 'major_job_boards',
        'oracle': 'major_job_boards'
    }
    
    for result in results:
        site_info = {
            'name': result['site_name'],
            'original_url': result['original_url'],
            'current_url': result['current_url'],
            'job_board_type': result.get('job_board_type'),
            'has_job_content': result.get('has_job_content', False),
            'job_links_count': len(result.get('job_indicators', {}).get('job_links', [])),
            'recommended_urls': result.get('recommended_urls', []),
            'recommendations': result.get('recommendations', [])
        }
        
        # Categorize based on job board type
        if site_info['job_board_type'] in job_board_mapping:
            category = job_board_mapping[site_info['job_board_type']]
            categories[category].append(site_info)
        elif site_info['has_job_content'] and site_info['job_links_count'] > 0:
            categories['custom_sites'].append(site_info)
        else:
            categories['problematic_sites'].append(site_info)
    
    # Create optimized scraping plan
    scraping_plan = {
        'high_priority': [],
        'medium_priority': [],
        'low_priority': [],
        'skip': []
    }
    
    # High priority: Apploi sites (we know these work well)
    for site in categories['apploi_sites']:
        if site['has_job_content'] and site['job_links_count'] > 5:
            scraping_plan['high_priority'].append({
                **site,
                'priority_reason': 'Apploi site with good job content',
                'estimated_jobs': site['job_links_count'] * 2  # Estimate 2 jobs per link
            })
    
    # Medium priority: Major job boards
    for site in categories['major_job_boards']:
        if site['has_job_content'] and site['job_links_count'] > 10:
            scraping_plan['medium_priority'].append({
                **site,
                'priority_reason': f'Major job board ({site["job_board_type"]}) with good content',
                'estimated_jobs': site['job_links_count']
            })
    
    # Medium priority: Custom sites with good content
    for site in categories['custom_sites']:
        if site['job_links_count'] > 5:
            scraping_plan['medium_priority'].append({
                **site,
                'priority_reason': 'Custom site with good job content',
                'estimated_jobs': site['job_links_count']
            })
    
    # Low priority: Sites with limited content
    for site in categories['custom_sites']:
        if site['job_links_count'] <= 5:
            scraping_plan['low_priority'].append({
                **site,
                'priority_reason': 'Limited job content',
                'estimated_jobs': site['job_links_count']
            })
    
    # Skip: Problematic sites
    for site in categories['problematic_sites']:
        scraping_plan['skip'].append({
            **site,
            'priority_reason': 'No job content or errors',
            'estimated_jobs': 0
        })
    
    # Save the scraping plan
    with open('scraping_plan.json', 'w') as f:
        json.dump(scraping_plan, f, indent=2)
    
    # Create CSV for easy viewing
    with open('scraping_plan.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Priority', 'Site Name', 'Job Board Type', 'Original URL', 
            'Current URL', 'Job Links Count', 'Estimated Jobs', 'Priority Reason',
            'Recommended URLs'
        ])
        
        for priority, sites in scraping_plan.items():
            for site in sites:
                writer.writerow([
                    priority,
                    site['name'],
                    site['job_board_type'] or 'Unknown',
                    site['original_url'],
                    site['current_url'],
                    site['job_links_count'],
                    site['estimated_jobs'],
                    site['priority_reason'],
                    '; '.join(site['recommended_urls'][:3])  # First 3 URLs
                ])
    
    # Print summary
    print(f"\n📊 SCRAPING PLAN SUMMARY")
    print(f"{'='*80}")
    
    total_estimated_jobs = 0
    for priority, sites in scraping_plan.items():
        priority_jobs = sum(site['estimated_jobs'] for site in sites)
        total_estimated_jobs += priority_jobs
        print(f"{priority.upper()}: {len(sites)} sites, ~{priority_jobs} estimated jobs")
    
    print(f"\n🎯 TOTAL ESTIMATED JOBS: ~{total_estimated_jobs}")
    
    # Show top sites by estimated jobs
    print(f"\n🏆 TOP 10 SITES BY ESTIMATED JOBS:")
    all_sites = []
    for priority, sites in scraping_plan.items():
        if priority != 'skip':
            all_sites.extend(sites)
    
    top_sites = sorted(all_sites, key=lambda x: x['estimated_jobs'], reverse=True)[:10]
    for i, site in enumerate(top_sites, 1):
        print(f"  {i:2d}. {site['name']}: ~{site['estimated_jobs']} jobs ({site['job_board_type'] or 'Unknown'})")
    
    # Show job board distribution
    print(f"\n📋 JOB BOARD DISTRIBUTION:")
    job_board_counts = defaultdict(int)
    for site in all_sites:
        board_type = site['job_board_type'] or 'Unknown'
        job_board_counts[board_type] += 1
    
    for board_type, count in sorted(job_board_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {board_type.upper()}: {count} sites")
    
    print(f"\n💾 Files created:")
    print(f"  - scraping_plan.json (detailed plan)")
    print(f"  - scraping_plan.csv (spreadsheet format)")
    
    return scraping_plan

def create_optimized_scraper_config():
    """Create an optimized scraper configuration based on the plan."""
    
    scraping_plan = create_scraping_plan()
    
    # Create optimized site configurations
    optimized_configs = []
    
    for priority, sites in scraping_plan.items():
        if priority == 'skip':
            continue
            
        for site in sites:
            # Determine the best URL to use
            best_url = site['current_url']
            if site['recommended_urls']:
                # Prefer job-specific URLs over general career pages
                job_urls = [url for url in site['recommended_urls'] 
                           if any(keyword in url.lower() for keyword in ['job', 'position', 'career'])]
                if job_urls:
                    best_url = job_urls[0]
            
            config = {
                'source_site': site['name'],
                'search_url': best_url,
                'priority': priority,
                'job_board_type': site['job_board_type'],
                'estimated_jobs': site['estimated_jobs'],
                'original_url': site['original_url'],
                'recommendations': site['recommendations']
            }
            
            optimized_configs.append(config)
    
    # Sort by priority and estimated jobs
    priority_order = {'high_priority': 1, 'medium_priority': 2, 'low_priority': 3}
    optimized_configs.sort(key=lambda x: (priority_order[x['priority']], -x['estimated_jobs']))
    
    # Save optimized configs
    with open('optimized_site_configs.json', 'w') as f:
        json.dump(optimized_configs, f, indent=2)
    
    print(f"\n✅ Created optimized scraper configuration with {len(optimized_configs)} sites")
    print(f"💾 Saved to: optimized_site_configs.json")
    
    return optimized_configs

if __name__ == "__main__":
    create_optimized_scraper_config() 