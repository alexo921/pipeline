#!/usr/bin/env python3
"""
Script to enhance existing job data JSON files with improved Apploi extraction
"""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path

# Add the current directory to the path so we can import the scraper
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from multi_site_deep_scraper_enhanced import EnhancedMultiSiteDeepScraper

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def enhance_json_file(file_path: str, max_jobs: int = 0):
    """Enhance a single JSON file"""
    try:
        # Create a temporary CSV file for the scraper
        temp_csv = "temp_sites.csv"
        with open(temp_csv, 'w') as f:
            f.write("site_name,site_url\n")
            f.write("test,https://example.com\n")
        
        try:
            scraper = EnhancedMultiSiteDeepScraper(temp_csv)
            await scraper.enhance_existing_json_file(file_path, max_jobs)
            logger.info(f"Successfully enhanced {file_path}")
        finally:
            # Clean up temporary file
            if os.path.exists(temp_csv):
                os.remove(temp_csv)
    except Exception as e:
        logger.error(f"Error enhancing {file_path}: {e}")

async def enhance_all_json_files(directory: str = "backend/job-scraper", max_jobs: int = 0):
    """Enhance all JSON files in the specified directory"""
    directory_path = Path(directory)
    
    if not directory_path.exists():
        logger.error(f"Directory {directory} does not exist")
        return
    
    # Find all JSON files that match the pattern
    json_files = list(directory_path.glob("site_*.json"))
    
    if not json_files:
        logger.warning(f"No JSON files found in {directory}")
        return
    
    logger.info(f"Found {len(json_files)} JSON files to enhance")
    
    for json_file in json_files:
        logger.info(f"Enhancing {json_file.name}...")
        await enhance_json_file(str(json_file), max_jobs)
        logger.info(f"Completed enhancing {json_file.name}")

async def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Enhance existing job data JSON files")
    parser.add_argument("--file", help="Specific JSON file to enhance")
    parser.add_argument("--directory", default="backend/job-scraper", help="Directory containing JSON files")
    parser.add_argument("--max-jobs", type=int, default=0, help="Maximum number of jobs to process per file (0 = all)")
    
    args = parser.parse_args()
    
    if args.file:
        # Enhance a specific file
        if not os.path.exists(args.file):
            logger.error(f"File {args.file} does not exist")
            return
        
        logger.info(f"Enhancing specific file: {args.file}")
        await enhance_json_file(args.file, args.max_jobs)
    else:
        # Enhance all files in directory
        logger.info(f"Enhancing all JSON files in {args.directory}")
        await enhance_all_json_files(args.directory, args.max_jobs)
    
    logger.info("Enhancement process completed!")

if __name__ == "__main__":
    asyncio.run(main()) 