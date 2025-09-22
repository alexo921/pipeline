#!/usr/bin/env python3
"""
Simple script to check the current progress of the scraper.
"""

import os
import json
from datetime import datetime

def check_progress():
    """Check the current progress of the scraper."""
    progress_file = "scraper_progress.json"
    
    if not os.path.exists(progress_file):
        print("📂 No progress file found. Scraper has not started or no progress was saved.")
        return
    
    try:
        with open(progress_file, 'r', encoding='utf-8') as f:
            progress = json.load(f)
        
        print("📊 SCRAPER PROGRESS")
        print("=" * 50)
        print(f"📍 Current Site: {progress.get('current_site_name', 'Unknown')}")
        print(f"🔢 Site Index: {progress.get('current_site_index', 0) + 1}")
        print(f"📋 Job Index: {progress.get('current_job_index', 0) + 1}")
        print(f"💼 Total Jobs Scraped: {progress.get('total_jobs_scraped', 0)}")
        print(f"✅ Successful Sites: {progress.get('successful_sites', 0)}")
        print(f"❌ Failed Sites: {progress.get('failed_sites', 0)}")
        print(f"🚫 Failed URLs: {len(progress.get('failed_urls', []))}")
        
        if 'timestamp' in progress:
            timestamp = progress['timestamp']
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                print(f"⏰ Last Updated: {dt.strftime('%Y-%m-%d %H:%M:%S')}")
            except:
                print(f"⏰ Last Updated: {timestamp}")
        
        if 'last_activity_time' in progress:
            last_activity = progress['last_activity_time']
            try:
                dt = datetime.fromtimestamp(last_activity)
                print(f"🔄 Last Activity: {dt.strftime('%Y-%m-%d %H:%M:%S')}")
            except:
                print(f"🔄 Last Activity: {last_activity}")
        
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error reading progress file: {e}")

if __name__ == "__main__":
    check_progress() 