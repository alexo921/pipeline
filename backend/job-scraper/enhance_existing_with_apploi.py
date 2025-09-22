#!/usr/bin/env python3
"""
Script to enhance existing job data using the enhanced apploi_scraper.py
"""

import os
import json
import time
import logging
from datetime import datetime
from typing import List, Dict
import argparse

# Import the enhanced scraper
from apploi_scraper import CTJobScraper, setup_logging

logger = setup_logging(debug=False)

def load_jobs_from_file(filename: str) -> List[Dict]:
    """Load jobs from JSON file."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            jobs = json.load(f)
        logger.info(f"✅ Loaded {len(jobs)} jobs from {filename}")
        return jobs
    except Exception as e:
        logger.error(f"❌ Error loading jobs from {filename}: {e}")
        raise

def save_enhanced_jobs(jobs: List[Dict], filename_prefix: str = "enhanced_jobs"):
    """Save enhanced jobs to JSON and CSV files."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save as JSON
    json_filename = f"{filename_prefix}_{len(jobs)}_{timestamp}.json"
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(jobs, f, indent=2, ensure_ascii=False)
    
    logger.info(f"💾 Saved enhanced jobs to: {json_filename}")
    return json_filename

def enhance_existing_jobs(input_file: str, batch_size: int = 10, debug: bool = False, headless: bool = True):
    """Enhance existing job data using the apploi scraper."""
    
    # Load existing jobs
    jobs = load_jobs_from_file(input_file)
    
    if not jobs:
        logger.warning("⚠️ No jobs found in input file")
        return
    
    # Initialize the enhanced scraper
    scraper = CTJobScraper(headless=headless, debug=debug)
    
    try:
        # Setup the browser
        if not scraper._setup_driver():
            logger.error("❌ Failed to setup browser")
            return
        
        # Enhance jobs in batches with progress saving
        enhanced_jobs = []
        total_jobs = len(jobs)
        
        logger.info(f"🚀 Starting job enhancement for {total_jobs} jobs")
        
        for i in range(0, total_jobs, batch_size):
            batch = jobs[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total_jobs + batch_size - 1) // batch_size
            
            logger.info(f"📦 Processing batch {batch_num}/{total_batches} ({len(batch)} jobs)")
            
            # Enhance this batch
            batch_enhanced = scraper._enhance_jobs_batch(batch, batch_size=len(batch))
            enhanced_jobs.extend(batch_enhanced)
            
            # Save progress after each batch
            if enhanced_jobs:
                input_name = os.path.splitext(os.path.basename(input_file))[0]
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                progress_file = f"enhanced_{input_name}_batch_{batch_num}_{len(enhanced_jobs)}_{timestamp}.json"
                
                with open(progress_file, 'w', encoding='utf-8') as f:
                    json.dump(enhanced_jobs, f, indent=2, ensure_ascii=False)
                
                logger.info(f"💾 Progress saved: {progress_file} ({len(enhanced_jobs)} jobs enhanced)")
            
            # Longer delay between batches
            if i + batch_size < total_jobs:
                logger.info(f"⏳ Waiting 5 seconds before next batch...")
                time.sleep(5)
        
        if enhanced_jobs:
            # Save final enhanced results
            input_name = os.path.splitext(os.path.basename(input_file))[0]
            output_file = save_enhanced_jobs(enhanced_jobs, f"enhanced_{input_name}")
            
            # Print summary
            scraper.print_summary()
            
            logger.info(f"\n🎉 Job enhancement completed successfully!")
            logger.info(f"📁 Results saved to: {output_file}")
        else:
            logger.warning("⚠️ No enhanced jobs to save")
        
    except Exception as e:
        logger.error(f"❌ Fatal error during enhancement: {e}")
        # Save whatever we have so far
        if 'enhanced_jobs' in locals() and enhanced_jobs:
            input_name = os.path.splitext(os.path.basename(input_file))[0]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            recovery_file = f"enhanced_{input_name}_recovery_{len(enhanced_jobs)}_{timestamp}.json"
            
            with open(recovery_file, 'w', encoding='utf-8') as f:
                json.dump(enhanced_jobs, f, indent=2, ensure_ascii=False)
            
            logger.info(f"💾 Recovery file saved: {recovery_file}")
        raise
    finally:
        # Cleanup
        scraper.cleanup()

def main():
    """Main function to enhance existing job data."""
    parser = argparse.ArgumentParser(description='Enhance existing job data using apploi scraper')
    parser.add_argument('input_file', help='Input JSON file with job data')
    parser.add_argument('--batch-size', type=int, default=10, help='Batch size for processing (default: 10)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    parser.add_argument('--headless', action='store_true', default=True, help='Run in headless mode (default: True)')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_file):
        logger.error(f"❌ Input file not found: {args.input_file}")
        return
    
    try:
        enhance_existing_jobs(
            input_file=args.input_file,
            batch_size=args.batch_size,
            debug=args.debug,
            headless=args.headless
        )
    except Exception as e:
        logger.error(f"❌ Fatal error: {e}")
        raise

if __name__ == "__main__":
    main() 