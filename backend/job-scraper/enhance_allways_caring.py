#!/usr/bin/env python3
"""
Enhance All Ways Caring data by parsing location information
"""

import json
import re
from typing import Dict, Optional

def parse_city_state(location: str) -> Optional[Dict[str, str]]:
    """Parse city and state from All Ways Caring location format"""
    if not location:
        return None
        
    location = location.strip()
    
    # Pattern: US-STATE-CITY (like US-GA-POOLER)
    match = re.search(r'US-([A-Z]{2})-([A-Z\s]+)', location)
    if match:
        return {
            'city': match.group(2).strip(),
            'state': match.group(1).strip()
        }
    
    # Pattern: STATE-CITY
    match = re.search(r'([A-Z]{2})-([A-Z\s]+)', location)
    if match:
        return {
            'city': match.group(2).strip(),
            'state': match.group(1).strip()
        }
    
    # Pattern: City, State
    match = re.search(r'([A-Za-z\s\.\'-]+),\s*([A-Z]{2})', location)
    if match:
        return {
            'city': match.group(1).strip(),
            'state': match.group(2).strip()
        }
    
    return None

def enhance_allways_caring():
    """Enhance All Ways Caring data"""
    input_file = 'site_All_Ways_Caring_20250717_165550.json'
    output_file = 'site_All_Ways_Caring_20250717_165550_enhanced.json'
    
    # Load the original file
    with open(input_file, 'r', encoding='utf-8') as f:
        jobs = json.load(f)
    
    enhanced_jobs = []
    enhanced_count = 0
    
    for job in jobs:
        enhanced_job = job.copy()
        
        # Parse location if it exists
        if job.get('location'):
            city_state = parse_city_state(job['location'])
            if city_state:
                enhanced_job['city'] = city_state['city']
                enhanced_job['state'] = city_state['state']
                enhanced_count += 1
        
        # Clean up company name (remove US-STATE-CITY format)
        if job.get('company') and job['company'].startswith('US-'):
            # Extract just the company name from the location format
            company_parts = job['company'].split(' | ')
            if len(company_parts) > 1:
                enhanced_job['company'] = 'All Ways Caring HomeCare'
            else:
                enhanced_job['company'] = 'All Ways Caring HomeCare'
        
        enhanced_jobs.append(enhanced_job)
    
    # Save enhanced file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(enhanced_jobs, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Enhanced {enhanced_count} jobs with location parsing")
    print(f"📁 Saved to {output_file}")
    
    # Copy to frontend
    try:
        import shutil
        frontend_path = f"../../frontend/web-dashboard/public/{output_file}"
        shutil.copy2(output_file, frontend_path)
        print(f"📋 Copied to frontend: {frontend_path}")
    except Exception as e:
        print(f"❌ Failed to copy to frontend: {str(e)}")

if __name__ == "__main__":
    enhance_allways_caring() 