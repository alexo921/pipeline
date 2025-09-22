#!/usr/bin/env python3
"""
Comprehensive script to enhance all sites with missing job data
Handles multiple platforms: Apploi, iCIMS, IntelyCare, etc.
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional
from playwright.async_api import async_playwright
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ComprehensiveJobEnhancer:
    def __init__(self):
        self.enhanced_count = 0
        self.total_count = 0
        
    async def enhance_job_from_url(self, job: Dict) -> Dict:
        """Enhance a single job by visiting its URL and extracting data"""
        if not job.get('url') or job.get('title'):  # Skip if no URL or already has title
            return job
            
        url = job['url']
        
        # Skip certain URLs that don't contain job details
        if any(skip in url.lower() for skip in [
            '/jobs/', '/job-board/', '/careers/', '/browse-jobs',
            'post-a-job', 'login', 'employer_id'
        ]):
            return job
            
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                
                # Set user agent to avoid detection
                await page.set_extra_http_headers({
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                })
                
                # Navigate to the job URL
                await page.goto(url, wait_until='networkidle', timeout=30000)
                await page.wait_for_timeout(2000)
                
                # Extract data based on platform
                enhanced_job = await self._extract_job_data(page, job, url)
                
                await browser.close()
                return enhanced_job
                
        except Exception as e:
            logger.warning(f"Failed to enhance job {url}: {str(e)}")
            return job
    
    async def _extract_job_data(self, page, job: Dict, url: str) -> Dict:
        """Extract job data from the page based on platform detection"""
        
        # Detect platform based on URL
        if 'apploi.com' in url:
            return await self._extract_apploi_data(page, job)
        elif 'icims.com' in url:
            return await self._extract_icims_data(page, job)
        elif 'intelycare.com' in url:
            return await self._extract_intelycare_data(page, job)
        else:
            return await self._extract_generic_data(page, job)
    
    async def _extract_apploi_data(self, page, job: Dict) -> Dict:
        """Extract data from Apploi platform"""
        try:
            # Apploi selectors
            title = await self._safe_extract_text(page, [
                'h1', '.job-title', '[data-testid="job-title"]',
                '.title', 'h2', '.position-title'
            ])
            
            company = await self._safe_extract_text(page, [
                '.company-name', '[data-testid="company-name"]',
                '.employer', '.organization', '.facility-name'
            ])
            
            location = await self._safe_extract_text(page, [
                '.location', '[data-testid="location"]',
                '.job-location', '.address', '.city-state'
            ])
            
            description = await self._safe_extract_text(page, [
                '.job-description', '.description', '.job-details',
                '[data-testid="job-description"]', '.content'
            ])
            
            salary = await self._safe_extract_text(page, [
                '.salary', '.compensation', '.pay-rate',
                '[data-testid="salary"]', '.wage'
            ])
            
            # Update job with extracted data
            if title:
                job['title'] = title
            if company:
                job['company'] = company
            if location:
                job['location'] = location
                # Parse city/state from location
                city_state = self._parse_city_state(location)
                if city_state:
                    job['city'] = city_state['city']
                    job['state'] = city_state['state']
            if description:
                job['description'] = description
            if salary:
                job['salary'] = salary
                
        except Exception as e:
            logger.warning(f"Error extracting Apploi data: {str(e)}")
            
        return job
    
    async def _extract_icims_data(self, page, job: Dict) -> Dict:
        """Extract data from iCIMS platform"""
        try:
            # iCIMS selectors
            title = await self._safe_extract_text(page, [
                'h1', '.job-title', '.title',
                '[data-testid="job-title"]', 'h2'
            ])
            
            company = await self._safe_extract_text(page, [
                '.company-name', '.employer', '.facility-name',
                '[data-testid="company-name"]', '.organization'
            ])
            
            location = await self._safe_extract_text(page, [
                '.location', '.job-location', '.address',
                '[data-testid="location"]', '.city-state'
            ])
            
            description = await self._safe_extract_text(page, [
                '.job-description', '.description', '.job-details',
                '[data-testid="job-description"]', '.content'
            ])
            
            salary = await self._safe_extract_text(page, [
                '.salary', '.compensation', '.pay-rate',
                '[data-testid="salary"]', '.wage'
            ])
            
            # Update job with extracted data
            if title:
                job['title'] = title
            if company:
                job['company'] = company
            if location:
                job['location'] = location
                # Parse city/state from location
                city_state = self._parse_city_state(location)
                if city_state:
                    job['city'] = city_state['city']
                    job['state'] = city_state['state']
            if description:
                job['description'] = description
            if salary:
                job['salary'] = salary
                
        except Exception as e:
            logger.warning(f"Error extracting iCIMS data: {str(e)}")
            
        return job
    
    async def _extract_intelycare_data(self, page, job: Dict) -> Dict:
        """Extract data from IntelyCare platform"""
        try:
            # IntelyCare selectors
            title = await self._safe_extract_text(page, [
                'h1', '.job-title', '.title',
                '[data-testid="job-title"]', 'h2'
            ])
            
            company = await self._safe_extract_text(page, [
                '.company-name', '.employer', '.facility-name',
                '[data-testid="company-name"]', '.organization'
            ])
            
            location = await self._safe_extract_text(page, [
                '.location', '.job-location', '.address',
                '[data-testid="location"]', '.city-state'
            ])
            
            description = await self._safe_extract_text(page, [
                '.job-description', '.description', '.job-details',
                '[data-testid="job-description"]', '.content'
            ])
            
            salary = await self._safe_extract_text(page, [
                '.salary', '.compensation', '.pay-rate',
                '[data-testid="salary"]', '.wage'
            ])
            
            # Update job with extracted data
            if title:
                job['title'] = title
            if company:
                job['company'] = company
            if location:
                job['location'] = location
                # Parse city/state from location
                city_state = self._parse_city_state(location)
                if city_state:
                    job['city'] = city_state['city']
                    job['state'] = city_state['state']
            if description:
                job['description'] = description
            if salary:
                job['salary'] = salary
                
        except Exception as e:
            logger.warning(f"Error extracting IntelyCare data: {str(e)}")
            
        return job
    
    async def _extract_generic_data(self, page, job: Dict) -> Dict:
        """Extract data using generic selectors"""
        try:
            # Generic selectors that work across many platforms
            title = await self._safe_extract_text(page, [
                'h1', '.job-title', '.title', 'h2',
                '[data-testid="job-title"]', '.position-title'
            ])
            
            company = await self._safe_extract_text(page, [
                '.company-name', '.employer', '.facility-name',
                '[data-testid="company-name"]', '.organization'
            ])
            
            location = await self._safe_extract_text(page, [
                '.location', '.job-location', '.address',
                '[data-testid="location"]', '.city-state'
            ])
            
            description = await self._safe_extract_text(page, [
                '.job-description', '.description', '.job-details',
                '[data-testid="job-description"]', '.content'
            ])
            
            salary = await self._safe_extract_text(page, [
                '.salary', '.compensation', '.pay-rate',
                '[data-testid="salary"]', '.wage'
            ])
            
            # Update job with extracted data
            if title:
                job['title'] = title
            if company:
                job['company'] = company
            if location:
                job['location'] = location
                # Parse city/state from location
                city_state = self._parse_city_state(location)
                if city_state:
                    job['city'] = city_state['city']
                    job['state'] = city_state['state']
            if description:
                job['description'] = description
            if salary:
                job['salary'] = salary
                
        except Exception as e:
            logger.warning(f"Error extracting generic data: {str(e)}")
            
        return job
    
    async def _safe_extract_text(self, page, selectors: List[str]) -> Optional[str]:
        """Safely extract text using multiple selectors"""
        for selector in selectors:
            try:
                element = await page.query_selector(selector)
                if element:
                    text = await element.inner_text()
                    if text and text.strip():
                        return text.strip()
            except:
                continue
        return None
    
    def _parse_city_state(self, location: str) -> Optional[Dict[str, str]]:
        """Parse city and state from location string"""
        if not location:
            return None
            
        # Handle various location formats
        location = location.strip()
        
        # Pattern: City, State
        match = re.search(r'([A-Za-z\s\.\'-]+),\s*([A-Z]{2})', location)
        if match:
            return {
                'city': match.group(1).strip(),
                'state': match.group(2).strip()
            }
        
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
        
        return None
    
    async def enhance_file(self, filepath: str) -> str:
        """Enhance all jobs in a file"""
        logger.info(f"Enhancing {filepath}")
        
        # Load the original file
        with open(filepath, 'r', encoding='utf-8') as f:
            jobs = json.load(f)
        
        self.total_count += len(jobs)
        enhanced_jobs = []
        
        # Process jobs in batches to avoid overwhelming the sites
        batch_size = 10
        for i in range(0, len(jobs), batch_size):
            batch = jobs[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}/{(len(jobs) + batch_size - 1)//batch_size}")
            
            # Enhance each job in the batch
            for job in batch:
                enhanced_job = await self.enhance_job_from_url(job)
                enhanced_jobs.append(enhanced_job)
                
                # Count enhanced jobs
                if enhanced_job.get('title') and not job.get('title'):
                    self.enhanced_count += 1
        
        # Save enhanced file
        enhanced_filepath = filepath.replace('.json', '_enhanced.json')
        with open(enhanced_filepath, 'w', encoding='utf-8') as f:
            json.dump(enhanced_jobs, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Enhanced {self.enhanced_count} jobs in {filepath}")
        return enhanced_filepath

async def main():
    """Main function to enhance all site files"""
    enhancer = ComprehensiveJobEnhancer()
    
    # List of files to enhance
    files_to_enhance = [
        'site_AdviniaCare_20250717_164518.json',
        'site_Affinity_Home_Care_20250717_164356.json',
        'site_Allendale_Rehabilitation___Healthcare_Center_20250717_170717.json',
        'site_Alliance_Health_20250717_165248.json',
        'site_Always_Best_Care_20250717_165333.json',
        'site_Amedisys_20250717_165522.json',
        'site_Artis_Senior_Living_20250717_165100.json',
        'site_Ascension_20250717_164253.json',
        'site_Aspen_Hill_20250717_170005.json',
        'site_Atlas_Healthcare_20250717_170802.json',
        'site_Atria_20250717_165136.json',
        'site_Autumn_Lake_20250717_164215.json',
        'site_Aveanna_20250717_164331.json',
        'site_BaneCare_20250717_165311.json',
        'site_Benchmark_20250717_164540.json',
        'site_Bond_Health_Staffing_20250717_170508.json',
        'site_Brightstar_20250717_164436.json',
        'site_Brightview_Senior_Living_20250717_165824.json',
        'site_Brookdale_20250717_164929.json',
        'site_CenterWell_20250717_165420.json',
        'site_Charter_Senior_Living_20250717_165700.json',
        'site_Compassion_Home_Care_20250717_170845.json',
        'site_Covenant_Living_20250717_164703.json',
        'site_DRIFT_Services_20250717_170555.json',
        'site_ECHN_Visiting_Nurse___Health_Services_of_CT_20250717_165115.json',
        'site_Elara_Caring_20250717_165800.json',
        'site_Encompass_Health_20250717_165946.json',
        'site_Endurance_Home_Care_20250717_170923.json',
        'site_Fine_Care_Center_20250717_170615.json',
        'site_Gardenview_Home_Care_20250717_170451.json',
        'site_Guardian_Angel_Senior_Services_20250717_170221.json',
        'site_Hallkeen_20250717_164854.json',
        'site_Healogics_20250717_170158.json',
        'site_Hebrew_Senior_Life_20250717_170332.json',
        'site_Home_Helpers_20250717_170943.json',
        'site_Hometown_Nannies_20250717_170902.json',
        'site_Honor_Health_Network_20250717_170403.json',
        'site_IntelyCare_-_StaffDNA_20250717_164951.json',
        'site_LCB_Senior_Living_20250717_164727.json',
        'site_LHC_Group_20250717_165440.json',
        'site_Laconia_Nursing_Home_20250717_170825.json',
        'site_MJHS_Health_System_20250717_170533.json',
        'site_Maplewood_Senior_Living_20250717_165230.json',
        'site_Masonicare_20250717_164235.json',
        'site_Monarch_Communities_20250717_165157.json',
        'site_Mozaic_Senior_Services_20250717_164643.json',
        'site_National_Healthcare_Associates_20250717_164124.json',
        'site_Northbridge_Communities_20250717_164416.json',
        'site_Oak_Hill_20250717_164834.json',
        'site_PathWell_20250717_165922.json',
        'site_ProMedica_20250717_164912.json',
        'site_SCA_Health_20250717_170140.json',
        'site_Sapphire_Center_20250717_170736.json',
        'site_Senior_Lifestyle_20250717_165904.json',
        'site_Seniors_Helping_Seniors_20250717_170247.json',
        'site_Southcoast_Health_20250717_170028.json',
        'site_Southcoast_Health_20250717_170050.json',
        'site_Southcoast_Health_20250717_170116.json',
        'site_Sunrise_Senior_Living_20250717_165039.json',
        'site_Tandym_Group_20250717_170633.json',
        'site_The_Arbors___The_Ivy_20250717_164812.json',
        'site_The_Jewish_Home_20250717_170655.json',
        'site_The_Nurse_Network_20250717_171003.json',
        'site_Trinity_Health_at_Home_20250717_165612.json',
        'site_UniversaCare_20250717_165358.json',
        'site_VNA_Care_20250717_164623.json',
        'site_accentCare_20250717_165846.json',
        'site_enhabit_20250717_165458.json'
    ]
    
    enhanced_files = []
    
    for filename in files_to_enhance:
        if os.path.exists(filename):
            try:
                enhanced_file = await enhancer.enhance_file(filename)
                enhanced_files.append(enhanced_file)
                logger.info(f"✅ Enhanced {filename}")
            except Exception as e:
                logger.error(f"❌ Failed to enhance {filename}: {str(e)}")
        else:
            logger.warning(f"⚠️ File not found: {filename}")
    
    logger.info(f"🎉 Enhancement complete!")
    logger.info(f"📊 Total jobs processed: {enhancer.total_count}")
    logger.info(f"✨ Jobs enhanced: {enhancer.enhanced_count}")
    logger.info(f"📁 Enhanced files created: {len(enhanced_files)}")
    
    # Copy enhanced files to frontend public directory
    # for enhanced_file in enhanced_files:
    #     try:
    #         import shutil
    #         frontend_path = f"../../frontend/web-dashboard/public/{os.path.basename(enhanced_file)}"
    #         shutil.copy2(enhanced_file, frontend_path)
    #         logger.info(f"📋 Copied {enhanced_file} to frontend")
    #     except Exception as e:
    #         logger.error(f"❌ Failed to copy {enhanced_file}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main()) 