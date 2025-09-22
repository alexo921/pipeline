#!/usr/bin/env python3
"""
Simple test script to extract job descriptions using the successful method from our quick test.
"""

import sys
import os
import time
from playwright.sync_api import sync_playwright

def test_simple_extraction():
    """Test simple extraction of job descriptions from Apploi pages."""
    print("🧪 Testing Simple Job Description Extraction...")
    
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
            
            # Get all text content from the page
            all_text = page.inner_text('body')
            print(f"📄 All page text length: {len(all_text)}")
            
            # Look for job description content
            if all_text:
                # Split into lines and look for description section
                lines = all_text.split('\n')
                description_lines = []
                in_description = False
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                        
                    # Check if we're entering a description section
                    if 'DESCRIPTION' in line.upper():
                        in_description = True
                        print(f"🎯 Found DESCRIPTION section: {line}")
                        continue
                        
                    # If we're in description section, collect lines
                    if in_description:
                        # Stop if we hit another section
                        if any(section in line.upper() for section in ['LOCATION', 'ABOUT', 'INDUSTRY', 'SOCIAL', 'COMPANY WEBSITE']):
                            print(f"🛑 Stopping at section: {line}")
                            break
                            
                        # Skip unwanted lines
                        lower_line = line.lower()
                        if any(unwanted in lower_line for unwanted in [
                            'apply now', 'terms and conditions', 'cookies and privacy policy',
                            'continue', '©', 'update browser', 'security vulnerability'
                        ]):
                            continue
                            
                        description_lines.append(line)
                        print(f"📝 Added description line: {line}")
                
                # Join description lines
                if description_lines:
                    description = ' '.join(description_lines)
                    if len(description) > 50:
                        print(f"✅ Found job description: {description}")
                        print(f"📏 Description length: {len(description)}")
                    else:
                        print(f"⚠️ Description too short: {description}")
                else:
                    print("❌ No description lines found")
                    
                    # Try alternative approach - look for job-related content
                    print("🔍 Trying alternative approach...")
                    job_keywords = ['experience', 'requirements', 'responsibilities', 'qualifications', 'duties', 'skills', 'license', 'certification']
                    
                    # Split text into sentences and look for job-related content
                    sentences = all_text.split('.')
                    job_sentences = []
                    
                    for sentence in sentences:
                        sentence = sentence.strip()
                        if len(sentence) > 20:
                            lower_sentence = sentence.lower()
                            if any(keyword in lower_sentence for keyword in job_keywords):
                                job_sentences.append(sentence)
                                print(f"🎯 Found job-related sentence: {sentence}")
                    
                    if job_sentences:
                        description = '. '.join(job_sentences)
                        print(f"✅ Found job description from sentences: {description}")
                        print(f"📏 Description length: {len(description)}")
                    else:
                        print("❌ No job-related sentences found")
            
        except Exception as e:
            print(f"❌ Error: {e}")
        
        finally:
            browser.close()

if __name__ == "__main__":
    test_simple_extraction() 