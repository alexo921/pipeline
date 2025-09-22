#!/usr/bin/env python3
"""
Analyze Apploi sites to understand their job container structures and pagination patterns.
"""

import asyncio
import json
import time
from playwright.async_api import async_playwright
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)s | %(message)s')
logger = logging.getLogger(__name__)

class ApploiSiteAnalyzer:
    def __init__(self):
        self.apploi_sites = [
            {
                "name": "RydersHealth",
                "url": "https://www.rydershealth.com/career-opportunities/",
                "type": "multi-location"
            },
            {
                "name": "New Haven Center for Nursing & Rehab",
                "url": "https://newhavennh.com/career/",
                "type": "single-site"
            },
            {
                "name": "Southport Center for Nursing & Rehab",
                "url": "https://southportnh.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Torrington Center for Nursing & Reha",
                "url": "https://torringtonnh.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Waterbury Center for Nursing & Rehab",
                "url": "https://waterburynh.com/careers/",
                "type": "single-site"
            },
            {
                "name": "West Haven Center for Nursing & Reha",
                "url": "https://westhavennh.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Atlas Healthcare",
                "url": "https://theatlashcg.com/careers/",
                "type": "multi-location"
            },
            {
                "name": "iCare Health Network",
                "url": "https://www.icarehn.com/careers/",
                "type": "multi-location"
            },
            {
                "name": "Athena Health Care Systems",
                "url": "https://athenahealthcare.com/careers/",
                "type": "multi-location"
            },
            {
                "name": "Apple Rehab",
                "url": "https://jobs.apploi.com/profile/apple-rehab?utm_campaign=truman&utm_medium=&utm_source=false",
                "type": "multi-location"
            },
            {
                "name": "Complete Care at Glendale Center LLC",
                "url": "https://completecareglendale.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Fox Hill",
                "url": "https://ccfoxhill.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Complete Care at Groton Regency LLC",
                "url": "https://ccgrotonregency.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Complete Care at Harrington Court LL",
                "url": "https://ccharringtoncourt.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Complete Care at Meriden Center LLC",
                "url": "https://ccmeriden.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Kimberly Hall North",
                "url": "https://completecarekhn.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Kimberly Hall South Center",
                "url": "https://completecarekhs.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Autumn Lake",
                "url": "https://autumnlakehealthcare.com/careers/",
                "type": "multi-location"
            },
            {
                "name": "Autumn Lake Bucks Hill",
                "url": "https://autumnlakebuckshill.com/career/",
                "type": "single-site"
            },
            {
                "name": "Autumn Lake Cromwell",
                "url": "https://autumnlakecromwell.com/career/",
                "type": "single-site"
            },
            {
                "name": "Autumn Lake New Britain",
                "url": "https://autumnlakenewbritain.com/career/",
                "type": "single-site"
            },
            {
                "name": "Advanced Center for Nursing & Rehabilitation",
                "url": "https://advancednh.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Amberwoods of Farmington",
                "url": "https://www.amberwoodsof.com/careers/",
                "type": "single-site"
            },
            {
                "name": "The Villa at Stamford",
                "url": "https://stamfordvilla.org/careers/",
                "type": "single-site"
            },
            {
                "name": "Meriden Health and Rehab",
                "url": "https://meridenrehab.com/careers/",
                "type": "single-site"
            },
            {
                "name": "Right at Home",
                "url": "https://www.rightathome.net/tolland/jobs",
                "type": "single-site"
            },
            {
                "name": "Aaron Manor Nursing and Rehabilitation Center",
                "url": "https://aaronmanor.com/Careers.aspx",
                "type": "single-site"
            }
        ]
        
    async def setup_browser(self):
        """Setup browser with anti-bot detection measures."""
        self.playwright = await async_playwright().start()
        
        # Launch browser with anti-bot detection measures
        self.browser = await self.playwright.chromium.launch(
            headless=True,  # Set to True for production
            args=[
                '--no-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        )
        
        # Create context with stealth measures
        self.context = await self.browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            extra_http_headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            viewport={'width': 1920, 'height': 1080}
        )
        
        # Add script to hide webdriver
        await self.context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
        """)
        
        self.page = await self.context.new_page()
        
    async def analyze_site(self, site: Dict) -> Dict:
        """Analyze a single Apploi site to understand its structure."""
        try:
            logger.info(f"🔍 Analyzing {site['name']} at {site['url']}")
            
            # Navigate to the site
            await self.page.goto(site['url'], wait_until='domcontentloaded', timeout=30000)
            await asyncio.sleep(3)  # Wait for dynamic content
            
            # Get page info
            page_title = await self.page.title()
            current_url = self.page.url
            
            analysis = {
                "name": site['name'],
                "original_url": site['url'],
                "final_url": current_url,
                "page_title": page_title,
                "job_containers": [],
                "pagination": None,
                "apploi_embedded": False,
                "direct_apploi": False,
                "notes": []
            }
            
            # Check if it's a direct Apploi URL
            if 'apploi.com' in current_url:
                analysis['direct_apploi'] = True
                analysis['notes'].append("Direct Apploi URL")
            
            # Look for Apploi iframe or embedded content
            apploi_selectors = [
                'iframe[src*="apploi"]',
                'iframe[src*="jobs.apploi"]',
                '[data-apploi]',
                '[class*="apploi"]',
                '[id*="apploi"]'
            ]
            
            for selector in apploi_selectors:
                elements = await self.page.query_selector_all(selector)
                if elements:
                    analysis['apploi_embedded'] = True
                    analysis['notes'].append(f"Found Apploi content with selector: {selector}")
                    break
            
            # Look for job containers
            job_container_selectors = [
                '[class*="job"]',
                '[class*="position"]',
                '[class*="career"]',
                '[class*="listing"]',
                '[class*="card"]',
                '[data-testid*="job"]',
                '[id*="job"]',
                'article',
                '.job-listing',
                '.position-card',
                '.career-item'
            ]
            
            for selector in job_container_selectors:
                try:
                    elements = await self.page.query_selector_all(selector)
                    if elements:
                        container_info = {
                            "selector": selector,
                            "count": len(elements),
                            "sample_text": []
                        }
                        
                        # Get sample text from first few elements
                        for i, element in enumerate(elements[:3]):
                            try:
                                text = await element.inner_text()
                                container_info["sample_text"].append(text[:200] + "..." if len(text) > 200 else text)
                            except:
                                pass
                        
                        analysis['job_containers'].append(container_info)
                except Exception as e:
                    logger.debug(f"Error with selector {selector}: {e}")
            
            # Look for pagination
            pagination_selectors = [
                '[class*="pagination"]',
                '[class*="page"]',
                '[class*="next"]',
                '[class*="prev"]',
                '[aria-label*="pagination"]',
                '.pagination',
                '.page-numbers',
                'nav[aria-label*="pagination"]'
            ]
            
            for selector in pagination_selectors:
                try:
                    elements = await self.page.query_selector_all(selector)
                    if elements:
                        analysis['pagination'] = {
                            "selector": selector,
                            "count": len(elements),
                            "text": await elements[0].inner_text() if elements else ""
                        }
                        break
                except Exception as e:
                    logger.debug(f"Error with pagination selector {selector}: {e}")
            
            # Check for "Load More" or "See More" buttons
            load_more_selectors = [
                'button:has-text("Load More")',
                'button:has-text("See More")',
                'button:has-text("Show More")',
                '[class*="load-more"]',
                '[class*="see-more"]'
            ]
            
            for selector in load_more_selectors:
                try:
                    elements = await self.page.query_selector_all(selector)
                    if elements:
                        analysis['pagination'] = {
                            "type": "load_more",
                            "selector": selector,
                            "count": len(elements)
                        }
                        break
                except Exception as e:
                    logger.debug(f"Error with load more selector {selector}: {e}")
            
            # Take a screenshot for visual analysis
            screenshot_path = f"analysis_{site['name'].replace(' ', '_').replace('&', 'and')}.png"
            await self.page.screenshot(path=screenshot_path)
            analysis['screenshot'] = screenshot_path
            
            logger.info(f"✅ Analysis complete for {site['name']}")
            return analysis
            
        except Exception as e:
            logger.error(f"❌ Error analyzing {site['name']}: {e}")
            return {
                "name": site['name'],
                "error": str(e),
                "original_url": site['url']
            }
    
    async def analyze_all_sites(self):
        """Analyze all Apploi sites."""
        await self.setup_browser()
        
        results = []
        
        for site in self.apploi_sites:
            try:
                result = await self.analyze_site(site)
                results.append(result)
                
                # Save progress after each site
                with open('apploi_analysis_results.json', 'w') as f:
                    json.dump(results, f, indent=2)
                
                # Wait between sites to be respectful
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"❌ Failed to analyze {site['name']}: {e}")
                results.append({
                    "name": site['name'],
                    "error": str(e),
                    "original_url": site['url']
                })
        
        # Save final results
        with open('apploi_analysis_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        # Print summary
        print("\n" + "="*80)
        print("ANALYSIS SUMMARY")
        print("="*80)
        
        successful = [r for r in results if 'error' not in r]
        failed = [r for r in results if 'error' in r]
        
        print(f"✅ Successfully analyzed: {len(successful)} sites")
        print(f"❌ Failed to analyze: {len(failed)} sites")
        
        direct_apploi = [r for r in successful if r.get('direct_apploi')]
        embedded_apploi = [r for r in successful if r.get('apploi_embedded')]
        
        print(f"🎯 Direct Apploi URLs: {len(direct_apploi)}")
        print(f"🔗 Embedded Apploi content: {len(embedded_apploi)}")
        
        sites_with_jobs = [r for r in successful if r.get('job_containers')]
        print(f"💼 Sites with job containers: {len(sites_with_jobs)}")
        
        sites_with_pagination = [r for r in successful if r.get('pagination')]
        print(f"📄 Sites with pagination: {len(sites_with_pagination)}")
        
        await self.browser.close()
        await self.playwright.stop()

async def main():
    analyzer = ApploiSiteAnalyzer()
    await analyzer.analyze_all_sites()

if __name__ == "__main__":
    asyncio.run(main()) 