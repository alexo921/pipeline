#!/usr/bin/env python3
"""
Quick test script to extract job descriptions from Apploi pages before bot detection kicks in.
"""

import sys
import os
import time
from playwright.sync_api import sync_playwright

def test_quick_extraction():
    """Test quick extraction of job descriptions from Apploi pages."""
    print("🧪 Testing Quick Job Description Extraction...")
    
    # Test URL from the user
    test_url = "https://jobs.apploi.com/view/740335?utm_campaign=jobs_snippet&utm_source=waterbury-nh-career-page&utm_medium=client-web-site&utm_term=josh-reiss&_=1753382341.098593"
    
    with sync_playwright() as p:
        # Launch browser with minimal anti-bot detection
        browser = p.chromium.launch(
            headless=True,  # Run headless for server environment
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        )
        
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        page = context.new_page()
        
        # Add anti-bot script
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            delete window.navigator.__proto__.webdriver;
        """)
        
        try:
            print(f"🔍 Accessing: {test_url}")
            
            # Navigate to the page
            page.goto(test_url, wait_until='domcontentloaded', timeout=10000)
            
            # Wait a short time for content to load
            time.sleep(2)
            
            # Try to get the page content quickly
            print("📄 Getting page content...")
            
            # Look for job description elements
            description_selectors = [
                '[class*="description"]',
                '[class*="Description"]',
                '[class*="content"]',
                '[class*="Content"]',
                'div:has-text("DESCRIPTION")',
                'div:has-text("Description")',
                'div:has-text("Job Description")',
                'div:has-text("Position Description")',
                '[data-testid="job-description"]',
                '[data-testid="description"]',
                '.job-description-content',
                '.position-description-content',
                'main',
                'article',
                '.job-content',
                '.position-content',
                'div[class*="description"]',
                'div[class*="content"]',
                'div[class*="body"]',
                'p'
            ]
            
            found_description = False
            
            for selector in description_selectors:
                try:
                    elements = page.query_selector_all(selector)
                    if elements:
                        print(f"✅ Found {len(elements)} elements with selector: {selector}")
                        
                        for i, elem in enumerate(elements[:3]):  # Check first 3 elements
                            try:
                                text = elem.inner_text().strip()
                                if text and len(text) > 100:
                                    print(f"📝 Element {i+1} text preview: {text[:200]}...")
                                    print(f"📏 Text length: {len(text)}")
                                    
                                    # Check if it looks like a job description
                                    if any(keyword in text.lower() for keyword in ['experience', 'requirements', 'responsibilities', 'qualifications', 'duties', 'skills', 'license', 'certification']):
                                        print(f"🎯 Found job description with selector: {selector}")
                                        print(f"📄 Full description: {text}")
                                        found_description = True
                                        break
                            except Exception as e:
                                print(f"⚠️ Error getting text from element {i+1}: {e}")
                                continue
                        
                        if found_description:
                            break
                            
                except Exception as e:
                    print(f"⚠️ Error with selector {selector}: {e}")
                    continue
            
            if not found_description:
                print("🔍 Trying to get all text content...")
                try:
                    # Get all text content from the page
                    all_text = page.inner_text('body')
                    print(f"📄 All page text length: {len(all_text)}")
                    print(f"📄 Text preview: {all_text[:500]}...")
                    
                    # Look for job-related content
                    lines = all_text.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line and len(line) > 50:
                            if any(keyword in line.lower() for keyword in ['experience', 'requirements', 'responsibilities', 'qualifications', 'duties', 'skills', 'license', 'certification']):
                                print(f"🎯 Found job-related line: {line}")
                                found_description = True
                                break
                except Exception as e:
                    print(f"⚠️ Error getting all text: {e}")
            
            if not found_description:
                print("❌ No job description found")
            
        except Exception as e:
            print(f"❌ Error: {e}")
        
        finally:
            browser.close()

if __name__ == "__main__":
    test_quick_extraction() 