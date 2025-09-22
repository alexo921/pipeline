#!/usr/bin/env python3
"""
Test browser setup
"""

from playwright.sync_api import sync_playwright
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)s | %(message)s')
logger = logging.getLogger(__name__)

def test_browser_setup():
    """Test browser setup with different engines."""
    try:
        logger.info("🔧 Setting up Playwright browser...")
        playwright = sync_playwright().start()
        
        browser_engines = ['chromium', 'firefox']
        for engine in browser_engines:
            try:
                logger.info(f"🔧 Trying {engine} browser...")
                if engine == 'chromium':
                    browser = playwright.chromium.launch(
                        headless=True,
                        args=[
                            '--no-sandbox',
                            '--disable-blink-features=AutomationControlled',
                            '--disable-dev-shm-usage',
                            '--disable-web-security',
                            '--disable-features=VizDisplayCompositor'
                        ]
                    )
                elif engine == 'firefox':
                    browser = playwright.firefox.launch(headless=True)
                else:
                    browser = playwright.webkit.launch(headless=True)
                
                logger.info(f"✅ Successfully launched {engine} browser")
                
                # Test creating a context and page
                context = browser.new_context(
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
                
                page = context.new_page()
                logger.info(f"✅ Successfully created page with {engine}")
                
                # Test navigation
                page.goto('https://example.com', wait_until='domcontentloaded')
                title = page.title()
                logger.info(f"✅ Successfully navigated to example.com, title: {title}")
                
                # Clean up
                page.close()
                context.close()
                browser.close()
                
                logger.info(f"✅ {engine} test completed successfully")
                return True
                
            except Exception as e:
                logger.error(f"❌ Failed to setup {engine} browser: {e}")
                continue
        
        playwright.stop()
        return False
        
    except Exception as e:
        logger.error(f"❌ Failed to setup Playwright browser: {e}")
        return False

if __name__ == "__main__":
    success = test_browser_setup()
    print(f"Browser setup test result: {success}") 