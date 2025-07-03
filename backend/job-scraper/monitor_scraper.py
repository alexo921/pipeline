#!/usr/bin/env python3
"""
Monitor the progress of the comprehensive salary scraper.
"""

import os
import glob
import time
import json
from datetime import datetime

def monitor_scraper_progress():
    """Monitor the progress of the running scraper."""
    
    print("🔍 COMPREHENSIVE SALARY SCRAPER MONITOR")
    print("=" * 50)
    print(f"Monitoring started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check if scraper is running
    import subprocess
    try:
        result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
        if 'run_salary_focused_scraper.py' in result.stdout:
            print("✅ Scraper is currently RUNNING")
        else:
            print("❌ Scraper is NOT running")
    except:
        print("⚠️  Could not check scraper status")
    
    # Look for latest output files
    print("\n📁 Checking for output files...")
    
    # Find the most recent comprehensive scrape files
    json_files = glob.glob("comprehensive_salary_scrape_*.json")
    csv_files = glob.glob("comprehensive_salary_scrape_*.csv")
    
    if json_files:
        latest_json = max(json_files, key=os.path.getctime)
        print(f"📄 Latest JSON file: {latest_json}")
        
        # Get file size and modification time
        file_size = os.path.getsize(latest_json) / (1024 * 1024)  # MB
        mod_time = datetime.fromtimestamp(os.path.getmtime(latest_json))
        print(f"   Size: {file_size:.2f} MB")
        print(f"   Last modified: {mod_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Try to count jobs in the file
        try:
            with open(latest_json, 'r') as f:
                data = json.load(f)
                if isinstance(data, list):
                    job_count = len(data)
                    jobs_with_salary = len([job for job in data if job.get('salary') and job['salary'].strip()])
                    salary_rate = (jobs_with_salary / job_count * 100) if job_count > 0 else 0
                    
                    print(f"   Jobs found: {job_count:,}")
                    print(f"   Jobs with salary: {jobs_with_salary:,} ({salary_rate:.1f}%)")
                    
                    # Show recent job samples
                    if job_count > 0:
                        print(f"\n💼 Latest jobs (last 3):")
                        for i, job in enumerate(data[-3:], 1):
                            salary_info = f" - Salary: {job['salary']}" if job.get('salary') else " - No salary"
                            print(f"   {i}. {job.get('title', 'Unknown')} at {job.get('company', 'Unknown')}{salary_info}")
        except Exception as e:
            print(f"   ⚠️  Could not parse JSON file: {e}")
    else:
        print("📄 No comprehensive scrape JSON files found yet")
    
    if csv_files:
        latest_csv = max(csv_files, key=os.path.getctime)
        print(f"\n📊 Latest CSV file: {latest_csv}")
        file_size = os.path.getsize(latest_csv) / 1024  # KB
        print(f"   Size: {file_size:.1f} KB")
    
    # Check for any recent files (last 10 minutes)
    print(f"\n🕒 Recent files (last 10 minutes):")
    current_time = time.time()
    recent_files = []
    
    for file_pattern in ["*.json", "*.csv"]:
        for file_path in glob.glob(file_pattern):
            if current_time - os.path.getmtime(file_path) < 600:  # 10 minutes
                recent_files.append((file_path, os.path.getmtime(file_path)))
    
    if recent_files:
        recent_files.sort(key=lambda x: x[1], reverse=True)
        for file_path, mod_time in recent_files[:5]:
            mod_datetime = datetime.fromtimestamp(mod_time)
            print(f"   📄 {file_path} - {mod_datetime.strftime('%H:%M:%S')}")
    else:
        print("   No recent files found")
    
    print(f"\n📈 Expected Progress:")
    print(f"   • Total sites to scrape: 194")
    print(f"   • Pages per site: 5")
    print(f"   • Estimated duration: 45 minutes")
    print(f"   • Expected jobs: 2,000-5,000+")
    print(f"   • Expected salary info: 300-1,000+ jobs (15-20%)")
    
    print(f"\n🔄 To check progress again, run: python3 monitor_scraper.py")

if __name__ == "__main__":
    monitor_scraper_progress() 