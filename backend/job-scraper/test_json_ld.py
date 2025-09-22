#!/usr/bin/env python3
"""
Simple test script to test JSON-LD extraction only.
"""

from playwright.sync_api import sync_playwright
import json
import time

def test_json_ld_extraction():
    """Test JSON-LD extraction from a single job page."""
    print("🔧 Testing JSON-LD extraction...")
    
    try:
        playwright = sync_playwright().start()
        
        browser = playwright.chromium.launch(
            headless=True,
            channel="chrome",
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.168 Safari/537.36'
            ]
        )
        
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.168 Safari/537.36'
        )
        
        page = context.new_page()
        
        # Test URL
        test_url = 'https://jobs.apploi.com/view/865692'
        print(f"🌐 Navigating to: {test_url}")
        
        page.goto(test_url, wait_until='domcontentloaded', timeout=15000)
        time.sleep(3)
        
        print("📋 Page title:", page.title())
        print("🔗 Current URL:", page.url)
        
        # Try JSON-LD extraction
        print("🔍 Attempting JSON-LD extraction...")
        
        # Wait a bit for dynamic content to load
        time.sleep(2)
        
        # Try to extract JSON-LD from script tags
        json_ld_scripts = page.query_selector_all('script[type="application/ld+json"][data-rh="true"]')
        
        if not json_ld_scripts:
            json_ld_scripts = page.query_selector_all('script[type="application/ld+json"]')
        
        print(f"🔍 Found {len(json_ld_scripts)} JSON-LD script tags")
        
        for i, script in enumerate(json_ld_scripts):
            try:
                script_content = script.inner_text().strip()
                print(f"📄 JSON-LD script {i+1} content: '{script_content}'")
                
                if script_content and script_content != '{}' and len(script_content) > 10:
                    print(f"📄 Processing JSON-LD script {i+1}: {script_content[:200]}...")
                    data = json.loads(script_content)
                    
                    if isinstance(data, dict):
                        print(f"✅ Found JSON-LD data with keys: {list(data.keys())}")
                        
                        # Print key job information
                        if data.get('title'):
                            print(f"📋 Title: {data['title']}")
                        if data.get('description'):
                            print(f"📝 Description preview: {data['description'][:100]}...")
                        if data.get('jobLocation'):
                            print(f"📍 Location: {data['jobLocation']}")
                        if data.get('baseSalary'):
                            print(f"💰 Salary: {data['baseSalary']}")
                        
                        return data
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict):
                                print(f"✅ Found JSON-LD data in array with keys: {list(item.keys())}")
                                return item
                    else:
                        print(f"⚠️ JSON-LD script {i+1} doesn't contain valid JSON data")
            
            except json.JSONDecodeError as e:
                print(f"⚠️ JSON decode error in script {i+1}: {e}")
                continue
            except Exception as e:
                print(f"⚠️ Error parsing JSON-LD script {i+1}: {e}")
                continue
        
        print("❌ No valid JSON-LD data found")
        return None
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return None
    finally:
        if 'browser' in locals():
            browser.close()
        if 'playwright' in locals():
            playwright.stop()

if __name__ == "__main__":
    result = test_json_ld_extraction()
    if result:
        print("✅ JSON-LD extraction successful!")
    else:
        print("❌ JSON-LD extraction failed!") 