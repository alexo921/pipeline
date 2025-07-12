#!/usr/bin/env python3
"""
Enhanced Healthcare Job Board Site Analyzer with Anti-Bot Evasion
================================================================

This script analyzes healthcare job board sites with advanced anti-bot evasion
techniques to bypass Cloudflare, captcha, and other protection systems.
"""

import os
import csv
import json
import time
import logging
import random
import shutil
import uuid
import requests
import re
import urllib.parse
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager

# Enhanced user agents pool
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
]

# Free proxy sources (you can expand this list)
def cleanup_chrome_processes():
    """Clean up any existing Chrome processes to avoid conflicts"""
    try:
        import subprocess
        # Kill any existing Chrome processes more aggressively
        subprocess.run(['pkill', '-9', '-f', 'chrome'], capture_output=True, timeout=5)
        subprocess.run(['pkill', '-9', '-f', 'chromedriver'], capture_output=True, timeout=5)
        subprocess.run(['pkill', '-9', '-f', 'undetected_chromedriver'], capture_output=True, timeout=5)
        
        # Also kill any remaining processes that might be holding user data dirs
        subprocess.run(['pkill', '-9', '-f', 'google-chrome'], capture_output=True, timeout=5)
        subprocess.run(['pkill', '-9', '-f', 'chromium'], capture_output=True, timeout=5)
        
        time.sleep(5)  # Wait longer for processes to clean up
        
        # Clean up any remaining user data directories
        subprocess.run(['rm', '-rf', '/tmp/chrome_*'], capture_output=True, timeout=10)
        subprocess.run(['rm', '-rf', '/tmp/uc_chrome_*'], capture_output=True, timeout=10)
        # Find and clean chrome-specific temp directories
        subprocess.run(['find', '/tmp', '-name', 'chrome_*', '-type', 'd', '-exec', 'rm', '-rf', '{}', '+'], capture_output=True, timeout=10)
        
        logging.info("Cleaned up existing Chrome processes and user data directories")
    except Exception as e:
        logging.warning(f"Failed to cleanup Chrome processes: {e}")

def get_free_proxies():
    """Get a list of free proxies (basic implementation)"""
    # This is a basic implementation - in production, use a reliable proxy service
    proxies = [
        # Add free proxies here if needed
        # Format: 'ip:port'
    ]
    return proxies

def try_api_endpoints(site_url, site_name):
    """Try to find API endpoints or RSS feeds"""
    try:
        parsed_url = urllib.parse.urlparse(site_url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        # Common API endpoints to try
        api_endpoints = [
            '/api/jobs', '/api/v1/jobs', '/api/v2/jobs',
            '/jobs/api', '/careers/api', '/positions/api',
            '/feed/jobs', '/rss/jobs', '/jobs.xml', '/jobs.json',
            '/api/positions', '/api/careers', '/api/openings',
            '/jobs/feed', '/careers/feed', '/openings/feed'
        ]
        
        headers = {
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'application/json, application/xml, text/xml, */*',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        
        for endpoint in api_endpoints:
            try:
                api_url = base_url + endpoint
                response = requests.get(api_url, headers=headers, timeout=10)
                
                if response.status_code == 200:
                    content_type = response.headers.get('content-type', '').lower()
                    if 'json' in content_type or 'xml' in content_type:
                        logging.info(f"Found API endpoint for {site_name}: {api_url}")
                        return {
                            'site_name': site_name,
                            'url': site_url,
                            'api_url': api_url,
                            'status': 'success',
                            'method': 'api',
                            'content_type': content_type,
                            'response_size': len(response.text)
                        }
            except:
                continue
        
        return None
    except:
        return None

def setup_undetected_driver(thread_id, use_proxy=False):
    """Setup Chrome driver with improved resource management (simplified version)"""
    try:
        # Use regular Chrome driver instead of undetected_chromedriver for better stability
        chrome_options = Options()
        
        # Advanced stealth options
        chrome_options.add_argument('--headless=new')  # Enable headless mode
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--disable-extensions')
        chrome_options.add_argument('--disable-plugins')
        chrome_options.add_argument('--disable-images')
        chrome_options.add_argument('--no-first-run')
        chrome_options.add_argument('--disable-default-apps')
        chrome_options.add_argument('--disable-background-timer-throttling')
        chrome_options.add_argument('--disable-backgrounding-occluded-windows')
        chrome_options.add_argument('--disable-renderer-backgrounding')
        
        # Memory and resource optimizations (simplified for stability)
        chrome_options.add_argument('--disable-logging')
        chrome_options.add_argument('--disable-gpu-sandbox')
        chrome_options.add_argument('--disable-background-networking')
        chrome_options.add_argument('--disable-sync')
        chrome_options.add_argument('--disable-translate')
        
        # Basic automation detection bypass
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Random window size
        window_sizes = ['1920,1080', '1366,768', '1440,900', '1536,864', '1280,720']
        chrome_options.add_argument(f'--window-size={random.choice(window_sizes)}')
        
        # Force a unique temporary directory for this session
        import tempfile
        user_data_dir = tempfile.mkdtemp(prefix=f'chrome_{thread_id}_')
        chrome_options.add_argument(f'--user-data-dir={user_data_dir}')
        
        # Additional options for stability
        chrome_options.add_argument('--incognito')
        chrome_options.add_argument('--disable-features=TranslateUI')
        chrome_options.add_argument('--disable-ipc-flooding-protection')
        # Removed --single-process as it can cause instability
        
        # Language and locale
        locales = ['en-US,en;q=0.9', 'en-GB,en;q=0.9', 'en-CA,en;q=0.9']
        chrome_options.add_argument(f'--accept-language={random.choice(locales)}')
        
        # Simplified prefs for stability
        prefs = {
            'profile.default_content_setting_values.notifications': 2,
            'profile.default_content_settings.popups': 0,
            'profile.managed_default_content_settings.images': 2,
        }
        chrome_options.add_experimental_option('prefs', prefs)
        
        # Use regular Chrome driver for better stability
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        # Set shorter timeouts for faster failure detection
        driver.set_page_load_timeout(25)  # Reduced from 30s
        driver.implicitly_wait(8)  # Reduced from 10s
        
        # Additional stealth scripts
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        driver.execute_script("Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]})")
        driver.execute_script("Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']})")
        
        return driver, user_data_dir
        
    except Exception as e:
        logging.error(f"Failed to setup Chrome driver: {e}")
        return None, None

def setup_stealth_driver(thread_id, use_proxy=False):
    """Setup Chrome driver with advanced stealth features and better resource management"""
    # Use the simplified Chrome driver setup
    return setup_undetected_driver(thread_id, use_proxy)

def advanced_human_behavior(driver):
    """Advanced human-like behavior simulation"""
    try:
        # Random mouse movements with realistic patterns
        actions = ActionChains(driver)
        
        # Get window size
        window_size = driver.get_window_size()
        width, height = window_size['width'], window_size['height']
        
        # Simulate reading behavior - move to different parts of page
        reading_positions = [
            (width * 0.2, height * 0.3),  # Top left content
            (width * 0.5, height * 0.4),  # Center
            (width * 0.7, height * 0.6),  # Right side
            (width * 0.3, height * 0.8),  # Bottom area
        ]
        
        for pos in reading_positions:
            try:
                actions.move_to_element_with_offset(driver.find_element(By.TAG_NAME, "body"), 
                                                  int(pos[0]), int(pos[1]))
                actions.pause(random.uniform(0.5, 2.0))
            except:
                pass
        
        actions.perform()
        
        # Simulate reading with progressive scrolling
        total_scroll = 0
        scroll_steps = random.randint(3, 8)
        
        for step in range(scroll_steps):
            scroll_amount = random.randint(200, 500)
            driver.execute_script(f"window.scrollBy(0, {scroll_amount});")
            total_scroll += scroll_amount
            
            # Pause as if reading
            time.sleep(random.uniform(1.5, 4.0))
            
            # Sometimes scroll back up a bit (realistic reading behavior)
            if random.random() < 0.3:
                back_scroll = random.randint(50, 200)
                driver.execute_script(f"window.scrollBy(0, -{back_scroll});")
                time.sleep(random.uniform(0.5, 1.5))
        
        # Occasionally interact with page elements
        if random.random() < 0.4:
            try:
                # Try to click on non-critical elements
                safe_elements = driver.find_elements(By.CSS_SELECTOR, 
                    "div, span, p, h1, h2, h3, h4, h5, h6")
                if safe_elements:
                    element = random.choice(safe_elements[:10])
                    if element.is_displayed():
                        actions = ActionChains(driver)
                        actions.move_to_element(element).pause(random.uniform(0.5, 1.5))
                        actions.perform()
            except:
                pass
        
        # Random keyboard interactions (like tab navigation)
        if random.random() < 0.2:
            try:
                body = driver.find_element(By.TAG_NAME, "body")
                for _ in range(random.randint(1, 3)):
                    body.send_keys(Keys.TAB)
                    time.sleep(random.uniform(0.3, 0.8))
            except:
                pass
        
    except Exception as e:
        logging.debug(f"Advanced human behavior simulation failed: {e}")

def human_like_behavior(driver):
    """Simulate human-like behavior"""
    try:
        # Use advanced behavior simulation
        advanced_human_behavior(driver)
        
    except Exception as e:
        logging.debug(f"Human-like behavior simulation failed: {e}")

def bypass_cloudflare(driver, max_wait=15):
    """Attempt to bypass Cloudflare protection"""
    try:
        # Wait for potential Cloudflare challenge
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            page_source = driver.page_source.lower()
            title = driver.title.lower()
            
            # Check if we're past Cloudflare
            if 'cloudflare' not in page_source and 'checking your browser' not in page_source:
                return True
            
            # Look for challenge completion
            if 'challenge' in page_source or 'checking' in title:
                logging.info("Waiting for Cloudflare challenge to complete...")
                time.sleep(5)
                continue
            
            # Try clicking if there's a button
            try:
                buttons = driver.find_elements(By.CSS_SELECTOR, 'button, input[type="submit"], .challenge-button')
                if buttons:
                    for button in buttons:
                        if button.is_displayed() and button.is_enabled():
                            button.click()
                            time.sleep(3)
                            break
            except:
                pass
            
            time.sleep(2)
        
        return False
        
    except Exception as e:
        logging.error(f"Cloudflare bypass failed: {e}")
        return False

def detect_anti_bot_protection(driver):
    """Enhanced anti-bot detection"""
    try:
        # Minimal wait for quick detection
        time.sleep(1)  # Reduced from 3s
        
        page_source = driver.page_source.lower()
        title = driver.title.lower()
        current_url = driver.current_url.lower()
        
        # Enhanced detection patterns
        cloudflare_indicators = [
            'cloudflare', 'checking your browser', 'just a moment',
            'please wait while we check', 'ray id', 'cf-ray'
        ]
        
        captcha_indicators = [
            'captcha', 'recaptcha', 'hcaptcha', 'i\'m not a robot',
            'verify you are human', 'prove you are human'
        ]
        
        access_denied_indicators = [
            'access denied', 'forbidden', '403', 'not authorized',
            'blocked', 'restricted access'
        ]
        
        bot_detection_indicators = [
            'bot detected', 'automated traffic', 'suspicious activity',
            'security check', 'unusual activity'
        ]
        
        # Check for different types of protection
        for indicator in cloudflare_indicators:
            if indicator in page_source or indicator in title or indicator in current_url:
                return 'cloudflare'
        
        for indicator in captcha_indicators:
            if indicator in page_source or indicator in title:
                return 'captcha'
        
        for indicator in access_denied_indicators:
            if indicator in page_source or indicator in title:
                return 'access_denied'
        
        for indicator in bot_detection_indicators:
            if indicator in page_source or indicator in title:
                return 'bot_detection'
        
        # Check for empty or minimal content (possible blocking)
        if len(page_source) < 1000 and ('error' in page_source or 'denied' in page_source):
            return 'unknown_protection'
        
        return 'none'
        
    except Exception as e:
        logging.error(f"Anti-bot detection failed: {e}")
        return 'none'

def extract_selectors_from_html(html_content, site_name):
    """Extract potential selectors from HTML without browser"""
    try:
        import re
        
        selectors_found = {
            'job_containers': [],
            'description_selectors': [],
            'requirements_selectors': [],
            'date_selectors': [],
            'salary_selectors': [],
            'location_selectors': []
        }
        
        # Find job container patterns
        container_patterns = [
            (r'<([^>]*class[^>]*(?:job|career|position|listing|post|vacancy|role|opening)[^>]*)>', 'class'),
            (r'<([^>]*id[^>]*(?:job|career|position|listing|post|vacancy|role|opening)[^>]*)>', 'id'),
            (r'<(a[^>]*href[^>]*(?:job|career|position)[^>]*)>', 'link'),
            (r'<(tr[^>]*[^>]*)>(?:[^<]*(?:nurse|care|aide|assistant|medical|healthcare|cna|rn|lpn|therapist)[^<]*)', 'table_row'),
            (r'<(li[^>]*[^>]*)>(?:[^<]*(?:nurse|care|aide|assistant|medical|healthcare|cna|rn|lpn|therapist)[^<]*)', 'list_item'),
            (r'<(div[^>]*data-[^>]*(?:job|career|position)[^>]*)>', 'data_attr')
        ]
        
        for pattern, pattern_type in container_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE | re.DOTALL)
            for match in matches[:10]:  # Limit to avoid overwhelming data
                # Extract class names and IDs
                class_match = re.search(r'class=["\']([^"\']*)["\']', match)
                id_match = re.search(r'id=["\']([^"\']*)["\']', match)
                
                if class_match:
                    classes = class_match.group(1).split()
                    for cls in classes:
                        if len(cls) > 2:
                            selectors_found['job_containers'].append(f'.{cls}')
                
                if id_match:
                    id_val = id_match.group(1)
                    if len(id_val) > 2:
                        selectors_found['job_containers'].append(f'#{id_val}')
        
        # Find description patterns
        desc_patterns = [
            (r'<([^>]*class[^>]*(?:description|summary|content|detail|overview|body)[^>]*)>', 'description_class'),
            (r'<(p[^>]*)>[^<]*(?:responsible|duties|role|position|seeking|looking for|we are hiring)[^<]{50,}', 'description_p'),
            (r'<(div[^>]*class[^>]*(?:description|summary|content|detail)[^>]*)>', 'description_div')
        ]
        
        for pattern, pattern_type in desc_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE | re.DOTALL)
            for match in matches[:5]:
                class_match = re.search(r'class=["\']([^"\']*)["\']', match)
                if class_match:
                    classes = class_match.group(1).split()
                    for cls in classes:
                        if len(cls) > 3:
                            selectors_found['description_selectors'].append(f'.{cls}')
        
        # Find requirements patterns
        req_patterns = [
            (r'<([^>]*class[^>]*(?:requirement|qualification|skill|experience)[^>]*)>', 'requirements_class'),
            (r'<(ul[^>]*)>[^<]*(?:required|must have|minimum|preferred|experience|education)[^<]{30,}', 'requirements_ul'),
            (r'<(ol[^>]*)>[^<]*(?:required|must have|minimum|preferred|experience|education)[^<]{30,}', 'requirements_ol')
        ]
        
        for pattern, pattern_type in req_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE | re.DOTALL)
            for match in matches[:5]:
                class_match = re.search(r'class=["\']([^"\']*)["\']', match)
                if class_match:
                    classes = class_match.group(1).split()
                    for cls in classes:
                        if len(cls) > 3:
                            selectors_found['requirements_selectors'].append(f'.{cls}')
        
        # Find date patterns
        date_patterns = [
            (r'<([^>]*class[^>]*(?:date|posted|published|time|ago)[^>]*)>', 'date_class'),
            (r'<(time[^>]*)>', 'time_tag'),
            (r'<([^>]*datetime[^>]*)>', 'datetime_attr')
        ]
        
        for pattern, pattern_type in date_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches[:5]:
                class_match = re.search(r'class=["\']([^"\']*)["\']', match)
                if class_match:
                    classes = class_match.group(1).split()
                    for cls in classes:
                        if len(cls) > 2:
                            selectors_found['date_selectors'].append(f'.{cls}')
        
        # Find salary patterns
        salary_patterns = [
            (r'<([^>]*class[^>]*(?:salary|pay|wage|compensation)[^>]*)>', 'salary_class'),
            (r'<([^>]*)>[^<]*\$[0-9,]+(?:\.?[0-9]*)?(?:/hour|/year|annually|hourly)?[^<]*</[^>]*>', 'salary_content')
        ]
        
        for pattern, pattern_type in salary_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches[:5]:
                class_match = re.search(r'class=["\']([^"\']*)["\']', match)
                if class_match:
                    classes = class_match.group(1).split()
                    for cls in classes:
                        if len(cls) > 2:
                            selectors_found['salary_selectors'].append(f'.{cls}')
        
        # Find location patterns
        location_patterns = [
            (r'<([^>]*class[^>]*(?:location|city|address|geo|place)[^>]*)>', 'location_class'),
            (r'<([^>]*)>[^<]*(?:[A-Z][a-z]+, [A-Z]{2}|[A-Z][a-z]+ County|Hospital|Center)[^<]*</[^>]*>', 'location_content')
        ]
        
        for pattern, pattern_type in location_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            for match in matches[:5]:
                class_match = re.search(r'class=["\']([^"\']*)["\']', match)
                if class_match:
                    classes = class_match.group(1).split()
                    for cls in classes:
                        if len(cls) > 2:
                            selectors_found['location_selectors'].append(f'.{cls}')
        
        # Remove duplicates and clean up
        for key in selectors_found:
            selectors_found[key] = list(set(selectors_found[key]))
            # Remove common utility classes that aren't useful
            selectors_found[key] = [
                s for s in selectors_found[key] 
                if not any(noise in s.lower() for noise in ['hidden', 'hide', 'invisible', 'sr-only', 'screen-reader'])
            ]
        
        return selectors_found
        
    except Exception as e:
        logging.debug(f"Failed to extract selectors from HTML for {site_name}: {e}")
        return {
            'job_containers': [],
            'description_selectors': [],
            'requirements_selectors': [],
            'date_selectors': [],
            'salary_selectors': [],
            'location_selectors': []
        }

def try_mobile_approach(site_url, site_name):
    """Try mobile user agent approach with detailed content extraction and selector detection"""
    try:
        mobile_headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        response = requests.get(site_url, headers=mobile_headers, timeout=15)
        
        if response.status_code == 200 and len(response.text) > 5000:
            content = response.text
            content_lower = content.lower()
            
            # Check if we got actual content (not a block page)
            if 'job' in content_lower or 'career' in content_lower or 'position' in content_lower:
                # Extract selectors from HTML
                html_selectors = extract_selectors_from_html(content, site_name)
                
                # Try to extract detailed job information from mobile page
                job_links = re.findall(r'href=["\']([^"\']*(?:job|career|position)[^"\']*)["\']', content)
                
                # Extract job titles
                title_patterns = [
                    r'<h[1-6][^>]*>([^<]*(?:nurse|care|aide|assistant|medical|healthcare|cna|rn|lpn|position|job|therapist|coordinator)[^<]*)</h[1-6]>',
                    r'<a[^>]*>([^<]*(?:nurse|care|aide|assistant|medical|healthcare|cna|rn|lpn|position|job|therapist|coordinator)[^<]*)</a>',
                    r'class[^>]*title[^>]*>([^<]*(?:nurse|care|aide|assistant|medical|healthcare|cna|rn|lpn|position|job|therapist|coordinator)[^<]*)</[^>]*>'
                ]
                
                job_titles = []
                for pattern in title_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    job_titles.extend([match.strip() for match in matches if len(match.strip()) > 5])
                
                # Extract job descriptions
                desc_patterns = [
                    r'<p[^>]*>([^<]*(?:responsible|duties|role|position|seeking|looking for|we are hiring)[^<]{50,500})</p>',
                    r'class[^>]*description[^>]*>([^<]{50,500})</[^>]*>',
                    r'<div[^>]*>([^<]*(?:responsible|duties|role|position|seeking|looking for|we are hiring)[^<]{50,500})</div>'
                ]
                
                job_descriptions = []
                for pattern in desc_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
                    job_descriptions.extend([match.strip() for match in matches])
                
                # Extract requirements
                req_patterns = [
                    r'<(?:ul|ol)[^>]*>(.*?(?:required|must have|minimum|preferred|experience|education|certification|license|degree|skills|qualifications).*?)</(?:ul|ol)>',
                    r'class[^>]*requirement[^>]*>([^<]*(?:required|must have|minimum|preferred|experience|education|certification)[^<]{30,300})</[^>]*>',
                    r'<p[^>]*>([^<]*(?:required|must have|minimum|preferred|experience|education|certification|license|degree|skills|qualifications)[^<]{30,300})</p>'
                ]
                
                job_requirements = []
                for pattern in req_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE | re.DOTALL)
                    job_requirements.extend([match.strip() for match in matches])
                
                if job_links or job_titles:
                    # Calculate content quality
                    content_quality = {
                        'job_links_found': len(job_links),
                        'job_titles_found': len(job_titles),
                        'job_descriptions_found': len(job_descriptions),
                        'job_requirements_found': len(job_requirements),
                        'avg_description_length': sum(len(desc) for desc in job_descriptions) / max(1, len(job_descriptions)),
                        'avg_requirements_length': sum(len(req) for req in job_requirements) / max(1, len(job_requirements))
                    }
                    
                    logging.info(f"Mobile approach successful for {site_name}: found {len(job_links)} job links")
                    if job_titles:
                        logging.info(f"  Extracted {len(job_titles)} job titles, {len(job_descriptions)} descriptions, {len(job_requirements)} requirements")
                    
                    return {
                        'site_name': site_name,
                        'url': site_url,
                        'status': 'success',
                        'method': 'mobile',
                        'job_links_found': len(job_links),
                        'job_containers': [{'selector': 'mobile_extraction', 'count': len(job_links)}],
                        'html_selectors': html_selectors,  # Add extracted selectors
                        'content_analysis': content_quality,
                        'sample_jobs': [
                            {
                                'title': title if i < len(job_titles) else '',
                                'description': job_descriptions[i] if i < len(job_descriptions) else '',
                                'requirements': job_requirements[i] if i < len(job_requirements) else '',
                                'method': 'mobile_regex'
                            }
                            for i, title in enumerate(job_titles[:3])  # Top 3 samples
                        ],
                        'anti_bot_type': 'none',
                        'retry_attempt': 1
                    }
        
        return None
    except:
        return None

def try_requests_approach(site_url, site_name):
    """Try simple requests approach with rotating headers and selector extraction"""
    try:
        headers = {
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0',
        }
        
        session = requests.Session()
        session.headers.update(headers)
        
        response = session.get(site_url, timeout=20, allow_redirects=True)
        
        if response.status_code == 200:
            content = response.text
            
            # Check for anti-bot indicators
            if any(indicator in content.lower() for indicator in 
                   ['cloudflare', 'captcha', 'checking your browser', 'access denied']):
                return None
            
            # Check for job-related content
            if len(content) > 3000 and any(keyword in content.lower() for keyword in 
                                         ['job', 'career', 'position', 'apply', 'hiring']):
                
                # Extract selectors from HTML
                html_selectors = extract_selectors_from_html(content, site_name)
                
                # Extract basic job information
                job_patterns = [
                    r'<a[^>]*href[^>]*(?:job|career|position)[^>]*>',
                    r'class[^>]*(?:job|career|position)[^>]*>',
                    r'<div[^>]*(?:job|career|position)[^>]*>'
                ]
                
                total_matches = 0
                for pattern in job_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    total_matches += len(matches)
                
                if total_matches > 0:
                    logging.info(f"Requests approach successful for {site_name}: {total_matches} job elements found")
                    return {
                        'site_name': site_name,
                        'url': site_url,
                        'status': 'success',
                        'method': 'requests',
                        'job_elements_found': total_matches,
                        'job_containers': [{'selector': 'requests_extraction', 'count': total_matches}],
                        'html_selectors': html_selectors,  # Add extracted selectors
                        'anti_bot_type': 'none'
                    }
        
        return None
    except:
        return None

def retry_with_different_approach(site_url, site_name, max_retries=3):
    """Retry site access with different approaches"""
    approaches = [
        {'method': 'mobile', 'proxy': False, 'wait_time': 5},  # Reduced wait times
        {'method': 'requests', 'proxy': False, 'wait_time': 3},
        {'method': 'undetected', 'proxy': False, 'wait_time': 8},
        {'method': 'stealth', 'proxy': False, 'wait_time': 10}
    ]
    
    for attempt in range(max_retries):
        approach = approaches[attempt % len(approaches)]
        
        try:
            logging.info(f"Retry {attempt + 1} for {site_name} with {approach['method']} approach")
            
            # Try different methods
            if approach['method'] == 'mobile':
                result = try_mobile_approach(site_url, site_name)
                if result:
                    result['retry_attempt'] = attempt + 1
                    return result
                    
            elif approach['method'] == 'requests':
                result = try_requests_approach(site_url, site_name)
                if result:
                    result['retry_attempt'] = attempt + 1
                    return result
            
            else:
                # Browser-based approaches
                driver = None
                user_data_dir = None
                
                try:
                    # Setup driver based on method
                    if approach['method'] == 'undetected':
                        driver, user_data_dir = setup_undetected_driver(
                            f"retry_{attempt}_{int(time.time())}", 
                            use_proxy=approach['proxy']
                        )
                    else:
                        driver, user_data_dir = setup_stealth_driver(
                            f"retry_{attempt}_{int(time.time())}", 
                            use_proxy=approach['proxy']
                        )
                    
                    if not driver:
                        continue
                    
                    # Navigate to site
                    driver.get(site_url)
                    
                    # Wait based on approach - reduced times
                    wait_time = approach['wait_time']
                    time.sleep(wait_time)
                    
                    # Simulate human behavior
                    human_like_behavior(driver)
                    
                    # Check for anti-bot protection
                    anti_bot_type = detect_anti_bot_protection(driver)
                    
                    if anti_bot_type == 'cloudflare':
                        # Try to bypass Cloudflare
                        if bypass_cloudflare(driver):
                            anti_bot_type = detect_anti_bot_protection(driver)
                    
                    if anti_bot_type == 'none':
                        # Success! Test selectors
                        results = test_selectors(driver, site_name)
                        results['site_name'] = site_name
                        results['url'] = site_url
                        results['status'] = 'success'
                        results['anti_bot_type'] = 'none'
                        results['retry_attempt'] = attempt + 1
                        results['method'] = approach['method']
                        
                        return results
                    
                    # If still blocked, try next approach
                    logging.warning(f"Still blocked on attempt {attempt + 1} ({approach['method']}): {anti_bot_type}")
                    
                finally:
                    # Clean up
                    if driver:
                        try:
                            driver.quit()
                        except:
                            pass
                    
                    if user_data_dir and os.path.exists(user_data_dir):
                        try:
                            shutil.rmtree(user_data_dir)
                        except:
                            pass
            
        except Exception as e:
            logging.error(f"Retry attempt {attempt + 1} ({approach['method']}) failed: {e}")
        
        # Wait before next retry - reduced time
        time.sleep(random.uniform(1, 3))
    
    # All retries failed
    return {
        'site_name': site_name,
        'url': site_url,
        'status': 'blocked',
        'reason': 'anti_bot',
        'anti_bot_type': 'persistent_blocking',
        'retry_attempts': max_retries
    }

def extract_detailed_job_content(driver, container_element):
    """Extract detailed job content from a job container element"""
    job_data = {
        'title': '',
        'description': '',
        'requirements': '',
        'posted_date': '',
        'location': '',
        'salary': '',
        'job_type': ''
    }
    
    try:
        # Try to find job title
        title_selectors = [
            'h1', 'h2', 'h3', '.title', '.job-title', '.position-title',
            '[class*="title"]', '[class*="headline"]', 'a', '.name',
            '[data-testid*="title"]', '[data-cy*="title"]'
        ]
        
        for selector in title_selectors:
            try:
                title_elem = container_element.find_element(By.CSS_SELECTOR, selector)
                title_text = title_elem.text.strip()
                if len(title_text) > 5 and len(title_text) < 200:
                    job_data['title'] = title_text
                    break
            except:
                continue
        
        # Try to find job description
        description_selectors = [
            '.description', '.job-description', '.job-summary', '.summary',
            '.content', '.details', '.overview', '[class*="description"]',
            '[class*="summary"]', '[class*="detail"]', '[class*="content"]',
            'p', '.text', '.body', '[data-testid*="description"]'
        ]
        
        description_texts = []
        for selector in description_selectors:
            try:
                desc_elements = container_element.find_elements(By.CSS_SELECTOR, selector)
                for elem in desc_elements:
                    text = elem.text.strip()
                    if len(text) > 50:
                        # Check if it looks like a job description
                        desc_keywords = [
                            'responsible', 'duties', 'role', 'position', 'seeking',
                            'looking for', 'join our team', 'we are hiring',
                            'job summary', 'about the role', 'what you will do'
                        ]
                        if any(keyword in text.lower() for keyword in desc_keywords):
                            description_texts.append(text)
            except:
                continue
        
        if description_texts:
            # Take the longest description
            job_data['description'] = max(description_texts, key=len)
        
        # Try to find requirements
        requirements_selectors = [
            '.requirements', '.qualifications', '.skills', '.experience',
            '[class*="requirement"]', '[class*="qualification"]', '[class*="skill"]',
            '[class*="experience"]', '.must-have', '.preferred', '.education',
            '[data-testid*="requirement"]', 'ul', 'ol'
        ]
        
        requirements_texts = []
        for selector in requirements_selectors:
            try:
                req_elements = container_element.find_elements(By.CSS_SELECTOR, selector)
                for elem in req_elements:
                    text = elem.text.strip()
                    if len(text) > 30:
                        # Check if it looks like requirements
                        req_keywords = [
                            'required', 'must have', 'minimum', 'preferred',
                            'experience', 'education', 'certification', 'license',
                            'degree', 'skills', 'qualifications', 'years of'
                        ]
                        if any(keyword in text.lower() for keyword in req_keywords):
                            requirements_texts.append(text)
            except:
                continue
        
        if requirements_texts:
            # Take the longest requirements section
            job_data['requirements'] = max(requirements_texts, key=len)
        
        # Try to find posted date
        date_selectors = [
            '.date', '.posted', '.published', '.created', '.updated',
            '[class*="date"]', '[class*="posted"]', '[class*="time"]',
            'time', '.ago', '[datetime]', '[data-testid*="date"]'
        ]
        
        for selector in date_selectors:
            try:
                date_elements = container_element.find_elements(By.CSS_SELECTOR, selector)
                for elem in date_elements:
                    text = elem.text.strip()
                    date_attr = elem.get_attribute('datetime') or elem.get_attribute('data-date')
                    
                    if date_attr:
                        job_data['posted_date'] = date_attr
                        break
                    elif text and any(keyword in text.lower() for keyword in 
                                    ['ago', 'day', 'week', 'month', '2024', '2025']):
                        job_data['posted_date'] = text
                        break
            except:
                continue
        
        # Try to find location
        location_selectors = [
            '.location', '.city', '.address', '[class*="location"]',
            '[class*="city"]', '[class*="address"]', '.geo',
            '[data-testid*="location"]', '.place'
        ]
        
        for selector in location_selectors:
            try:
                loc_elem = container_element.find_element(By.CSS_SELECTOR, selector)
                loc_text = loc_elem.text.strip()
                if len(loc_text) > 2 and len(loc_text) < 100:
                    # Check if it looks like a location
                    if any(pattern in loc_text.lower() for pattern in 
                          [' city', ' state', ', ', ' county', ' hospital', ' center']):
                        job_data['location'] = loc_text
                        break
            except:
                continue
        
        # Try to find salary
        salary_selectors = [
            '.salary', '.pay', '.wage', '.compensation', '[class*="salary"]',
            '[class*="pay"]', '[class*="wage"]', '[data-testid*="salary"]'
        ]
        
        for selector in salary_selectors:
            try:
                salary_elem = container_element.find_element(By.CSS_SELECTOR, selector)
                salary_text = salary_elem.text.strip()
                if any(symbol in salary_text for symbol in ['$', 'hour', 'year', 'salary']):
                    job_data['salary'] = salary_text
                    break
            except:
                continue
        
        # Try to find job type
        type_selectors = [
            '.type', '.schedule', '.employment', '[class*="type"]',
            '[class*="schedule"]', '[class*="employment"]', '.full-time',
            '.part-time', '.contract', '.temporary'
        ]
        
        for selector in type_selectors:
            try:
                type_elem = container_element.find_element(By.CSS_SELECTOR, selector)
                type_text = type_elem.text.strip().lower()
                if any(jobtype in type_text for jobtype in 
                      ['full time', 'part time', 'contract', 'temporary', 'permanent']):
                    job_data['job_type'] = type_text
                    break
            except:
                continue
        
    except Exception as e:
        logging.debug(f"Error extracting detailed job content: {e}")
    
    return job_data

def test_selectors(driver, site_name):
    """Test different selectors to find job content and extract detailed information"""
    results = {
        'job_containers': [],
        'description_selectors': [],
        'requirements_selectors': [],
        'date_selectors': [],
        'best_container': None,
        'sample_jobs': [],
        'content_analysis': {
            'avg_description_length': 0,
            'avg_requirements_length': 0,
            'jobs_with_descriptions': 0,
            'jobs_with_requirements': 0,
            'jobs_with_dates': 0,
            'jobs_with_locations': 0,
            'jobs_with_salaries': 0
        }
    }
    
    # Job container selectors to test
    container_selectors = [
        'a[href*="job"]', 'a[href*="career"]', 'a[href*="position"]',
        '.job', '.job-item', '.job-listing', '.job-card', '.job-post',
        '.position', '.career', '.listing', '.post', '.role',
        '[class*="job"]', '[class*="career"]', '[class*="position"]',
        'tr', 'li', 'div.item', '.vacancy', '.opening', '.tile',
        '[data-testid*="job"]', '[data-cy*="job"]', '.card'
    ]
    
    # Find best job container and extract detailed content
    best_container_score = 0
    best_container_data = None
    
    for selector in container_selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            if len(elements) >= 3:  # Need at least 3 potential job items
                # Check if elements contain job-related text and extract details
                job_count = 0
                sample_jobs = []
                description_lengths = []
                requirements_lengths = []
                
                for elem in elements[:10]:  # Test first 10 elements
                    try:
                        text = elem.text.lower()
                        if any(keyword in text for keyword in ['nurse', 'care', 'aide', 'assistant', 
                                                             'medical', 'healthcare', 'cna', 'rn', 'lpn', 
                                                             'position', 'job', 'apply', 'full time', 
                                                             'part time', 'therapist', 'coordinator']):
                            job_count += 1
                            
                            # Extract detailed job content
                            job_details = extract_detailed_job_content(driver, elem)
                            if job_details['title'] or job_details['description']:
                                sample_jobs.append(job_details)
                                
                                if job_details['description']:
                                    description_lengths.append(len(job_details['description']))
                                if job_details['requirements']:
                                    requirements_lengths.append(len(job_details['requirements']))
                    except:
                        continue
                
                if job_count >= 2:  # At least 2 elements have job-related content
                    # Calculate content quality score
                    content_score = 0
                    if sample_jobs:
                        content_score += len([j for j in sample_jobs if j['title']]) * 10
                        content_score += len([j for j in sample_jobs if j['description']]) * 20
                        content_score += len([j for j in sample_jobs if j['requirements']]) * 15
                        content_score += len([j for j in sample_jobs if j['posted_date']]) * 5
                        content_score += len([j for j in sample_jobs if j['location']]) * 5
                    
                    container_data = {
                        'selector': selector,
                        'count': len(elements),
                        'job_relevance': job_count,
                        'content_score': content_score,
                        'sample_jobs': sample_jobs[:3],  # Store top 3 samples
                        'avg_description_length': sum(description_lengths) / len(description_lengths) if description_lengths else 0,
                        'avg_requirements_length': sum(requirements_lengths) / len(requirements_lengths) if requirements_lengths else 0
                    }
                    
                    results['job_containers'].append(container_data)
                    
                    # Check if this is the best container
                    if content_score > best_container_score:
                        best_container_score = content_score
                        best_container_data = container_data
                        results['best_container'] = selector
        except:
            continue
    
    # Analyze the best container more deeply
    if best_container_data:
        all_jobs = best_container_data['sample_jobs']
        if all_jobs:
            results['content_analysis'] = {
                'avg_description_length': sum(len(j['description']) for j in all_jobs if j['description']) / max(1, len([j for j in all_jobs if j['description']])),
                'avg_requirements_length': sum(len(j['requirements']) for j in all_jobs if j['requirements']) / max(1, len([j for j in all_jobs if j['requirements']])),
                'jobs_with_descriptions': len([j for j in all_jobs if j['description']]),
                'jobs_with_requirements': len([j for j in all_jobs if j['requirements']]),
                'jobs_with_dates': len([j for j in all_jobs if j['posted_date']]),
                'jobs_with_locations': len([j for j in all_jobs if j['location']]),
                'jobs_with_salaries': len([j for j in all_jobs if j['salary']])
            }
            results['sample_jobs'] = all_jobs
    
    # Test specific description selectors across the page
    description_selectors = [
        'p', '.description', '.job-description', '.content', '.details',
        '[class*="description"]', '[class*="detail"]', '[class*="content"]',
        'div', 'span', '.summary', '.overview', '.body', '.text',
        '[data-testid*="description"]', '[data-cy*="description"]'
    ]
    
    for selector in description_selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            desc_count = 0
            total_desc_length = 0
            
            for elem in elements[:20]:
                try:
                    text = elem.text.strip()
                    if len(text) > 50 and any(keyword in text.lower() for keyword in 
                                            ['responsible', 'duties', 'experience', 'required', 
                                             'qualifications', 'skills', 'education', 'role',
                                             'seeking', 'looking for', 'we are hiring']):
                        desc_count += 1
                        total_desc_length += len(text)
                except:
                    continue
            
            if desc_count > 0:
                results['description_selectors'].append({
                    'selector': selector,
                    'matches': desc_count,
                    'avg_length': total_desc_length / desc_count,
                    'quality_score': desc_count * (total_desc_length / desc_count) / 100
                })
        except:
            continue
    
    # Test specific requirements selectors
    requirements_selectors = [
        '.requirements', '.qualifications', '.skills', '.experience',
        '[class*="requirement"]', '[class*="qualification"]', '[class*="skill"]',
        '[class*="experience"]', '.must-have', '.preferred', '.education',
        'ul', 'ol', '.list', '[data-testid*="requirement"]'
    ]
    
    for selector in requirements_selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            req_count = 0
            total_req_length = 0
            
            for elem in elements[:20]:
                try:
                    text = elem.text.strip()
                    if len(text) > 30 and any(keyword in text.lower() for keyword in 
                                            ['required', 'must have', 'minimum', 'preferred',
                                             'experience', 'education', 'certification', 'license',
                                             'degree', 'skills', 'qualifications', 'years']):
                        req_count += 1
                        total_req_length += len(text)
                except:
                    continue
            
            if req_count > 0:
                results['requirements_selectors'].append({
                    'selector': selector,
                    'matches': req_count,
                    'avg_length': total_req_length / req_count,
                    'quality_score': req_count * (total_req_length / req_count) / 100
                })
        except:
            continue
    
    # Test date selectors
    date_selectors = [
        '[class*="date"]', '[class*="posted"]', '[class*="time"]',
        '.date', '.posted', '.published', 'time', 'span',
        '[class*="created"]', '[class*="updated"]', '.ago',
        '[datetime]', '[data-date]', '[data-testid*="date"]'
    ]
    
    for selector in date_selectors:
        try:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            date_count = 0
            
            for elem in elements[:20]:
                try:
                    text = elem.text.strip()
                    date_attr = elem.get_attribute('datetime') or elem.get_attribute('data-date')
                    
                    if date_attr or (text and any(keyword in text.lower() for keyword in 
                                                 ['ago', 'day', 'week', 'month', '2024', '2025', 
                                                  'posted', 'published', 'created', 'updated'])):
                        date_count += 1
                except:
                    continue
            
            if date_count > 0:
                results['date_selectors'].append({
                    'selector': selector,
                    'matches': date_count
                })
        except:
            continue
    
    # Sort selectors by quality
    results['description_selectors'].sort(key=lambda x: x.get('quality_score', 0), reverse=True)
    results['requirements_selectors'].sort(key=lambda x: x.get('quality_score', 0), reverse=True)
    results['job_containers'].sort(key=lambda x: x['content_score'], reverse=True)
    
    return results

def analyze_single_site(site_data, thread_id):
    """Analyze a single site with comprehensive selector collection"""
    site_name = site_data.get('source_site', 'Unknown')
    site_url = site_data.get('jobs_url', site_data.get('search_url', ''))
    
    if not site_url:
        logging.warning(f"No URL found for {site_name}")
        return {
            'site_name': site_name,
            'url': '',
            'status': 'error',
            'reason': 'no_url',
            'anti_bot_type': 'none'
        }

    logging.info(f"Analyzing {site_name}: {site_url}")
    
    # TRY FAST APPROACHES FIRST but collect HTML selectors
    fast_result = None
    
    # 1. Try API endpoints first (fastest and most reliable)
    api_result = try_api_endpoints(site_url, site_name)
    if api_result:
        fast_result = api_result
    
    # 2. Try mobile approach (collects HTML selectors)
    if not fast_result:
        mobile_result = try_mobile_approach(site_url, site_name)
        if mobile_result:
            fast_result = mobile_result
    
    # 3. Try requests approach (collects HTML selectors)  
    if not fast_result:
        requests_result = try_requests_approach(site_url, site_name)
        if requests_result:
            fast_result = requests_result
    
    # If fast method succeeded, return it immediately (skip browser analysis)
    if fast_result:
        logging.info(f"Fast method succeeded for {site_name}: {fast_result['method']}")
        return fast_result
    
    # If all fast methods failed, skip browser approach and mark as failed
    logging.info(f"Fast methods failed for {site_name}, skipping browser approach")
    return {
        'site_name': site_name,
        'url': site_url,
        'status': 'error',
        'reason': 'fast_methods_failed',
        'anti_bot_type': 'none'
    }

def save_intermediate_results(results, timestamp):
    """Save intermediate results"""
    try:
        filename = f"simple_analysis_progress_{timestamp}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logging.error(f"Failed to save intermediate results: {e}")

def generate_comprehensive_analysis(results, timestamp):
    """Generate comprehensive analysis and summary with enhanced selector effectiveness"""
    try:
        # Count statistics
        total_sites = len(results)
        successful_sites = [r for r in results if r['status'] == 'success']
        blocked_sites = [r for r in results if r['status'] == 'blocked']
        error_sites = [r for r in results if r['status'] == 'error']
        
        # Collect selector effectiveness from multiple sources
        container_selectors = {}
        description_selectors = {}
        requirements_selectors = {}
        date_selectors = {}
        salary_selectors = {}
        location_selectors = {}
        
        # Method effectiveness tracking
        method_effectiveness = {}
        
        for result in successful_sites:
            method = result.get('method', 'unknown')
            method_effectiveness[method] = method_effectiveness.get(method, 0) + 1
            
            # Collect from browser selectors (most detailed)
            browser_selectors = result.get('browser_selectors', {})
            if browser_selectors:
                # Count container selectors from browser analysis
                best_container = browser_selectors.get('best_container')
                if best_container:
                    container_selectors[best_container] = container_selectors.get(best_container, 0) + 1
                
                # Count all container selectors found
                for container in browser_selectors.get('job_containers', []):
                    selector = container.get('selector')
                    if selector:
                        container_selectors[selector] = container_selectors.get(selector, 0) + 1
                
                # Count description selectors
                for desc in browser_selectors.get('description_selectors', []):
                    selector = desc.get('selector') if isinstance(desc, dict) else desc
                    if selector:
                        description_selectors[selector] = description_selectors.get(selector, 0) + 1
                
                # Count requirements selectors
                for req in browser_selectors.get('requirements_selectors', []):
                    selector = req.get('selector') if isinstance(req, dict) else req
                    if selector:
                        requirements_selectors[selector] = requirements_selectors.get(selector, 0) + 1
                
                # Count date selectors
                for date in browser_selectors.get('date_selectors', []):
                    selector = date.get('selector') if isinstance(date, dict) else date
                    if selector:
                        date_selectors[selector] = date_selectors.get(selector, 0) + 1
            
            # Collect from HTML selectors (from mobile/requests approaches)
            html_selectors = result.get('html_selectors', {})
            if html_selectors:
                # Container selectors
                for selector in html_selectors.get('job_containers', []):
                    container_selectors[selector] = container_selectors.get(selector, 0) + 1
                
                # Description selectors
                for selector in html_selectors.get('description_selectors', []):
                    description_selectors[selector] = description_selectors.get(selector, 0) + 1
                
                # Requirements selectors
                for selector in html_selectors.get('requirements_selectors', []):
                    requirements_selectors[selector] = requirements_selectors.get(selector, 0) + 1
                
                # Date selectors
                for selector in html_selectors.get('date_selectors', []):
                    date_selectors[selector] = date_selectors.get(selector, 0) + 1
                
                # Salary selectors
                for selector in html_selectors.get('salary_selectors', []):
                    salary_selectors[selector] = salary_selectors.get(selector, 0) + 1
                
                # Location selectors
                for selector in html_selectors.get('location_selectors', []):
                    location_selectors[selector] = location_selectors.get(selector, 0) + 1
            
            # Fallback: collect from legacy format (for backward compatibility)
            best_container = result.get('best_container')
            if best_container and best_container not in container_selectors:
                container_selectors[best_container] = container_selectors.get(best_container, 0) + 1
            
            # Legacy description selectors
            for desc in result.get('description_selectors', []):
                selector = desc.get('selector') if isinstance(desc, dict) else str(desc)
                if selector:
                    description_selectors[selector] = description_selectors.get(selector, 0) + 1
            
            # Legacy date selectors
            for date in result.get('date_selectors', []):
                selector = date.get('selector') if isinstance(date, dict) else str(date)
                if selector:
                    date_selectors[selector] = date_selectors.get(selector, 0) + 1
        
        # Calculate selector rankings and effectiveness scores
        def calculate_effectiveness(selector_dict, total_successful):
            sorted_selectors = sorted(selector_dict.items(), key=lambda x: x[1], reverse=True)
            return [
                {
                    'selector': selector,
                    'count': count,
                    'percentage': (count / total_successful) * 100 if total_successful > 0 else 0,
                    'effectiveness_score': count * (count / total_successful) if total_successful > 0 else 0
                }
                for selector, count in sorted_selectors
            ]
        
        total_successful = len(successful_sites)
        
        # Enhanced selector effectiveness with detailed metrics
        selector_effectiveness = {
            'job_containers': calculate_effectiveness(container_selectors, total_successful),
            'job_descriptions': calculate_effectiveness(description_selectors, total_successful),
            'job_requirements': calculate_effectiveness(requirements_selectors, total_successful),
            'job_dates': calculate_effectiveness(date_selectors, total_successful),
            'job_salaries': calculate_effectiveness(salary_selectors, total_successful),
            'job_locations': calculate_effectiveness(location_selectors, total_successful)
        }
        
        # Method effectiveness analysis
        method_analysis = {
            method: {
                'count': count,
                'percentage': (count / total_successful) * 100 if total_successful > 0 else 0
            }
            for method, count in sorted(method_effectiveness.items(), key=lambda x: x[1], reverse=True)
        }
        
        # Top performing selectors summary
        top_selectors = {
            'containers': [s['selector'] for s in selector_effectiveness['job_containers'][:10]],
            'descriptions': [s['selector'] for s in selector_effectiveness['job_descriptions'][:10]],
            'requirements': [s['selector'] for s in selector_effectiveness['job_requirements'][:10]],
            'dates': [s['selector'] for s in selector_effectiveness['job_dates'][:10]],
            'salaries': [s['selector'] for s in selector_effectiveness['job_salaries'][:10]],
            'locations': [s['selector'] for s in selector_effectiveness['job_locations'][:10]]
        }
        
        # Detailed site analysis
        detailed_sites = []
        for result in successful_sites:
            site_detail = {
                'name': result['site_name'],
                'url': result['url'],
                'method': result.get('method', 'unknown'),
                'has_browser_analysis': 'browser_selectors' in result,
                'has_html_analysis': 'html_selectors' in result,
                'container_count': len(result.get('browser_selectors', {}).get('job_containers', [])) + len(result.get('html_selectors', {}).get('job_containers', [])),
                'description_count': len(result.get('browser_selectors', {}).get('description_selectors', [])) + len(result.get('html_selectors', {}).get('description_selectors', [])),
                'anti_bot_type': result.get('anti_bot_type', 'none'),
                'detailed_analysis': result.get('detailed_analysis', False)
            }
            
            # Add sample job data if available
            sample_jobs = result.get('sample_jobs', []) or result.get('browser_selectors', {}).get('sample_jobs', [])
            if sample_jobs:
                site_detail['sample_job_count'] = len(sample_jobs)
                site_detail['has_job_samples'] = True
            else:
                site_detail['sample_job_count'] = 0
                site_detail['has_job_samples'] = False
            
            detailed_sites.append(site_detail)
        
        # Create comprehensive summary
        summary = {
            'analysis_summary': {
                'total_sites_analyzed': total_sites,
                'accessible_sites': len(successful_sites),
                'blocked_sites': len(blocked_sites),
                'error_sites': len(error_sites),
                'success_rate': len(successful_sites) / total_sites if total_sites > 0 else 0,
                'sites_with_browser_analysis': len([s for s in successful_sites if 'browser_selectors' in s]),
                'sites_with_html_analysis': len([s for s in successful_sites if 'html_selectors' in s]),
                'sites_with_detailed_analysis': len([s for s in successful_sites if s.get('detailed_analysis', False)])
            },
            'method_effectiveness': method_analysis,
            'selector_effectiveness': selector_effectiveness,
            'top_selectors': top_selectors,
            'successful_sites': detailed_sites,
            'blocked_sites': [
                {
                    'name': r['site_name'], 
                    'url': r['url'],
                    'reason': r.get('reason', 'unknown'), 
                    'anti_bot_type': r.get('anti_bot_type', 'none'),
                    'method_attempted': r.get('method', 'unknown')
                } 
                for r in blocked_sites
            ],
            'error_sites': [
                {
                    'name': r['site_name'],
                    'url': r['url'], 
                    'reason': r.get('reason', 'unknown'),
                    'error': r.get('error', 'no details')
                }
                for r in error_sites
            ]
        }
        
        # Save detailed results
        with open(f"enhanced_analysis_detailed_{timestamp}.json", 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        # Save comprehensive summary
        with open(f"enhanced_analysis_summary_{timestamp}.json", 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        # Also save the legacy format for backward compatibility
        legacy_summary = {
            'analysis_summary': summary['analysis_summary'],
            'selector_effectiveness': {
                'job_containers': [(s['selector'], s['count']) for s in selector_effectiveness['job_containers']],
                'job_descriptions': [(s['selector'], s['count']) for s in selector_effectiveness['job_descriptions']],
                'job_dates': [(s['selector'], s['count']) for s in selector_effectiveness['job_dates']]
            },
            'successful_sites': [{'name': r['site_name'], 'url': r['url']} for r in successful_sites],
            'blocked_sites': [{'name': r['site_name'], 'reason': r.get('reason', 'unknown'), 'anti_bot_type': r.get('anti_bot_type', 'none')} for r in blocked_sites]
        }
        
        with open(f"simple_analysis_summary_{timestamp}.json", 'w', encoding='utf-8') as f:
            json.dump(legacy_summary, f, indent=2, ensure_ascii=False)
        
        return summary
        
    except Exception as e:
        logging.error(f"Failed to generate comprehensive analysis: {e}")
        import traceback
        logging.error(f"Full traceback: {traceback.format_exc()}")
        return None

def main():
    """Main function to run comprehensive site analysis"""
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('simple_analysis.log'),
            logging.StreamHandler()
        ]
    )
    
    # Clean up any existing Chrome processes to avoid conflicts
    cleanup_chrome_processes()
    
    # Load sites from CSV
    sites = []
    try:
        with open('Job Board Data Scrape.csv', 'r', encoding='utf-8-sig') as file:  # utf-8-sig handles BOM
            reader = csv.DictReader(file)
            all_rows = list(reader)
            
            # Filter out rows without valid URLs or site names
            for row in all_rows:
                site_name = row.get('source_site', '').strip()
                site_url = row.get('search_url', '').strip()
                
                if site_name and site_url and site_name != 'Unknown' and site_url.startswith('http'):
                    # Use search_url instead of jobs_url for this CSV
                    row['jobs_url'] = site_url
                    sites.append(row)
            
        logging.info(f"Loaded {len(sites)} valid sites from Job Board Data Scrape.csv (filtered from {len(all_rows)} total rows)")
    except Exception as e:
        logging.error(f"Failed to load CSV file: {e}")
        return
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results = []
    
    # Process sites in smaller batches to avoid resource conflicts
    batch_size = 1  # Single site per batch to avoid conflicts
    total_sites = len(sites)
    
    for i in range(0, total_sites, batch_size):
        batch = sites[i:i + batch_size]
        batch_results = []
        
        # Use ThreadPoolExecutor with single worker to avoid resource conflicts
        with ThreadPoolExecutor(max_workers=1) as executor:
            # Submit tasks with unique thread IDs
            future_to_site = {
                executor.submit(analyze_single_site, site, f"thread_{i + j}_{int(time.time())}_{random.randint(1000, 9999)}"): site 
                for j, site in enumerate(batch)
            }
            
            # Collect results with better timeout handling
            completed_futures = []
            try:
                for future in as_completed(future_to_site, timeout=45):  # Reduced to 45 seconds total  
                    try:
                        result = future.result(timeout=40)  # 40 seconds per site max
                        batch_results.append(result)
                        completed_futures.append(future)
                    except Exception as e:
                        site = future_to_site[future]
                        site_name = site.get('source_site', 'Unknown')
                        logging.error(f"Failed to get result for {site_name}: {e}")
                        batch_results.append({
                            'site_name': site_name,
                            'url': site.get('jobs_url', site.get('search_url', '')),
                            'status': 'error',
                            'reason': 'timeout',
                            'anti_bot_type': 'none',
                            'error': str(e)
                        })
                        completed_futures.append(future)
            except Exception as timeout_error:
                logging.error(f"Batch timeout error: {timeout_error}")
                # Handle remaining unfinished futures
                for future, site in future_to_site.items():
                    if future not in completed_futures:
                        site_name = site.get('source_site', 'Unknown')
                        logging.warning(f"Cancelling unfinished task for {site_name}")
                        future.cancel()
                        batch_results.append({
                            'site_name': site_name,
                            'url': site.get('jobs_url', site.get('search_url', '')),
                            'status': 'error',
                            'reason': 'batch_timeout',
                            'anti_bot_type': 'none',
                            'error': 'Batch processing timeout'
                        })
        
        results.extend(batch_results)
        
        # Save intermediate results
        save_intermediate_results(results, timestamp)
        
        # Progress update
        processed = len(results)
        logging.info(f"Processed {processed}/{total_sites} sites")
        print(f"Progress: {processed}/{total_sites} sites analyzed ({processed/total_sites*100:.1f}%)")
        
        # Add delay between batches
        if i + batch_size < total_sites:
            time.sleep(2)  # Reduced delay since no browser cleanup needed
    
    # Generate final comprehensive analysis
    summary = generate_comprehensive_analysis(results, timestamp)
    
    if summary:
        print(f"\n🎯 ENHANCED ANALYSIS COMPLETE")
        print(f"=" * 60)
        print(f"Total Sites: {summary['analysis_summary']['total_sites_analyzed']}")
        print(f"Successful: {summary['analysis_summary']['accessible_sites']} ({summary['analysis_summary']['success_rate']*100:.1f}%)")
        print(f"Blocked: {summary['analysis_summary']['blocked_sites']}")
        print(f"Errors: {summary['analysis_summary']['error_sites']}")
        print(f"Sites with Browser Analysis: {summary['analysis_summary']['sites_with_browser_analysis']}")
        print(f"Sites with HTML Analysis: {summary['analysis_summary']['sites_with_html_analysis']}")
        print(f"Sites with Detailed Analysis: {summary['analysis_summary']['sites_with_detailed_analysis']}")
        
        print(f"\n📊 METHOD EFFECTIVENESS:")
        for method, stats in summary.get('method_effectiveness', {}).items():
            print(f"  {method}: {stats['count']} sites ({stats['percentage']:.1f}%)")
        
        print(f"\n🏆 TOP SELECTORS FOR SCRAPING:")
        
        # Job Containers
        top_containers = summary['selector_effectiveness']['job_containers'][:10]
        if top_containers:
            print("Job Containers:")
            for i, selector_data in enumerate(top_containers, 1):
                print(f"  {i}. {selector_data['selector']}: {selector_data['count']} sites ({selector_data['percentage']:.1f}%)")
        
        # Job Descriptions
        top_descriptions = summary['selector_effectiveness']['job_descriptions'][:10]
        if top_descriptions:
            print("\nJob Descriptions:")
            for i, selector_data in enumerate(top_descriptions, 1):
                print(f"  {i}. {selector_data['selector']}: {selector_data['count']} sites ({selector_data['percentage']:.1f}%)")
        
        # Job Requirements
        top_requirements = summary['selector_effectiveness']['job_requirements'][:10]
        if top_requirements:
            print("\nJob Requirements:")
            for i, selector_data in enumerate(top_requirements, 1):
                print(f"  {i}. {selector_data['selector']}: {selector_data['count']} sites ({selector_data['percentage']:.1f}%)")
        
        # Job Dates
        top_dates = summary['selector_effectiveness']['job_dates'][:10]
        if top_dates:
            print("\nJob Dates:")
            for i, selector_data in enumerate(top_dates, 1):
                print(f"  {i}. {selector_data['selector']}: {selector_data['count']} sites ({selector_data['percentage']:.1f}%)")
        
        # Job Salaries
        top_salaries = summary['selector_effectiveness']['job_salaries'][:10]
        if top_salaries:
            print("\nJob Salaries:")
            for i, selector_data in enumerate(top_salaries, 1):
                print(f"  {i}. {selector_data['selector']}: {selector_data['count']} sites ({selector_data['percentage']:.1f}%)")
        
        # Job Locations
        top_locations = summary['selector_effectiveness']['job_locations'][:10]
        if top_locations:
            print("\nJob Locations:")
            for i, selector_data in enumerate(top_locations, 1):
                print(f"  {i}. {selector_data['selector']}: {selector_data['count']} sites ({selector_data['percentage']:.1f}%)")
        
        print(f"\n📁 FILES GENERATED:")
        print(f"  • enhanced_analysis_summary_{timestamp}.json (comprehensive results)")
        print(f"  • enhanced_analysis_detailed_{timestamp}.json (full raw data)")
        print(f"  • simple_analysis_summary_{timestamp}.json (legacy format)")
        
        print(f"\n💡 SCRAPER OPTIMIZATION TIPS:")
        print("1. Use top container selectors as primary targets")
        print("2. Implement fallback chain from most to least effective selectors")
        print("3. Focus on sites with detailed analysis for comprehensive data")
        print("4. Consider different approaches for different anti-bot types")
    
    logging.info(f"Enhanced comprehensive analysis completed. Results saved to enhanced_analysis_summary_{timestamp}.json")

if __name__ == "__main__":
    main() 