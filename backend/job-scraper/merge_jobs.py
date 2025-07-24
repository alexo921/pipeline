#!/usr/bin/env python3
"""
Merge Jobs Script
=================

This script merges manual jobs with scraped jobs into a single JSON file.
"""

import json
import glob
from datetime import datetime
from typing import List, Dict, Any

def load_json_file(file_path: str) -> List[Dict[str, Any]]:
    """Load jobs from a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return json.load(file)
    except Exception as e:
        print(f"❌ Error loading {file_path}: {e}")
        return []

def save_json_file(jobs: List[Dict[str, Any]], file_path: str) -> None:
    """Save jobs to a JSON file."""
    try:
        with open(file_path, 'w', encoding='utf-8') as file:
            json.dump(jobs, file, indent=2, ensure_ascii=False)
        print(f"✅ Saved {len(jobs)} jobs to {file_path}")
    except Exception as e:
        print(f"❌ Error saving {file_path}: {e}")

def merge_jobs() -> None:
    """Merge all job files into a single JSON."""
    
    all_jobs = []
    
    # Load manual jobs
    manual_files = glob.glob("manual_jobs_*.json")
    if manual_files:
        latest_manual = max(manual_files)
        manual_jobs = load_json_file(latest_manual)
        all_jobs.extend(manual_jobs)
        print(f"📋 Loaded {len(manual_jobs)} manual jobs from {latest_manual}")
    
    # Load scraped jobs
    scraped_files = glob.glob("apploi_ct_jobs_*.json")
    if scraped_files:
        latest_scraped = max(scraped_files)
        scraped_jobs = load_json_file(latest_scraped)
        all_jobs.extend(scraped_jobs)
        print(f"🤖 Loaded {len(scraped_jobs)} scraped jobs from {latest_scraped}")
    
    if not all_jobs:
        print("❌ No job files found to merge")
        return
    
    # Create merged filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    merged_file = f"all_ct_jobs_{timestamp}.json"
    
    # Save merged jobs
    save_json_file(all_jobs, merged_file)
    
    # Print summary
    print(f"\n📊 Merge Summary:")
    print(f"   Total jobs: {len(all_jobs)}")
    
    # Count by source
    sources = {}
    for job in all_jobs:
        source = job.get('source', 'unknown')
        sources[source] = sources.get(source, 0) + 1
    
    for source, count in sources.items():
        print(f"   {source}: {count}")
    
    # Count by role
    roles = {}
    for job in all_jobs:
        role = job.get('role', 'Unknown')
        roles[role] = roles.get(role, 0) + 1
    
    print(f"\n👥 Roles:")
    for role, count in sorted(roles.items()):
        print(f"   {role}: {count}")
    
    # Count jobs with descriptions
    jobs_with_desc = sum(1 for job in all_jobs if job.get('description'))
    print(f"\n📝 Jobs with descriptions: {jobs_with_desc}/{len(all_jobs)} ({jobs_with_desc/len(all_jobs)*100:.1f}%)")
    
    # Count jobs with pay info
    jobs_with_pay = sum(1 for job in all_jobs if job.get('pay', {}).get('amount'))
    print(f"💰 Jobs with pay info: {jobs_with_pay}/{len(all_jobs)} ({jobs_with_pay/len(all_jobs)*100:.1f}%)")

def main():
    """Main function."""
    print("🔄 Merging job files...")
    merge_jobs()

if __name__ == "__main__":
    main() 