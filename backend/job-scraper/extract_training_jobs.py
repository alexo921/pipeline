#!/usr/bin/env python3
"""
Extract and transform jobs from improved_ct_jobs_20250725_054659.json for pre-training.
This script applies the same transformation logic used in the frontend to create
a clean dataset of 50-100 jobs with transformed features.
"""

import json
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import random

def clean_job_card_content(text: str, max_length: int = 100) -> str:
    """Clean and truncate long content for job cards."""
    if not text:
        return ''
    
    # Remove common unwanted patterns that shouldn't be in job cards
    cleaned = text
    patterns_to_remove = [
        r'Your web browser.*?update your browser',
        r'Chrome \d+.*?vulnerability',
        r'Please take a minute.*?browser',
        r'Update browser',
        r'\b(?:Click here|Apply now|Learn more|Read more)\b',
        r'\b(?:www\.|https?://)\S+',
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        r'By checking this box.*?Privacy Policy',
        r'Continue',
        r'Job Type\s*:\s*[A-Za-z\s-]+',
        r'DESCRIPTION',
        r'POSITION SUMMARY',
        r'POSITION REQUIREMENTS',
        r'Working Conditions',
        r'Physical Requirements',
        r'Behavioral Competencies',
        r'\$[\d,]+ sign-on bonus.*?(?=\s|$)',
        r'Registered Nurse licensed.*?(?=\s|$)',
        r'Minimum of.*?(?=\s|$)',
        r'CPR certified.*?(?=\s|$)',
        r'Ability to.*?(?=\s|$)',
        r'Works in.*?(?=\s|$)',
        r'Physical.*?(?=\s|$)',
        r'Accountability.*?(?=\s|$)',
        r'\bis\s+a\b(?!\s*[0-9])',
        r'We are hiring.*?team',
        r'Working with our team.*?life',
        r'Here at.*?company',
        r'As a.*?resident',
        r'Experience & Education.*?required',
        r'Duties & Responsibilities.*?team',
        r'Specific Requirements.*?public',
        r'About.*?England',
        r"Athena's Benefits.*?apply",
        r'We are an equal.*?law'
    ]
    
    for pattern in patterns_to_remove:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
    
    # Normalize whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # If still too long, truncate with ellipsis
    if len(cleaned) > max_length:
        return cleaned[:max_length-3] + '...'
    
    return cleaned

def extract_city_state(location: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract city, state from a full address."""
    if not location or not isinstance(location, str):
        return None, None
    
    # State name to code mapping
    state_name_to_code = {
        'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
        'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
        'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
        'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
        'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
        'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
        'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
        'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
        'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
        'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
    }
    
    # Try to match: ... City, ST ... (with optional ZIP and country)
    city_state_match = re.search(r'([A-Za-z .\'-]+),\s*([A-Z]{2})(?:\s*,?\s*\d{5}(?:-\d{4})?\s*,?\s*(?:United States|USA|US)?)?$', location, re.IGNORECASE)
    if city_state_match:
        return f"{city_state_match.group(1).strip()}, {city_state_match.group(2).strip()}", None
    
    # Try to match: ... City, State ... (with optional ZIP and country)
    city_full_state_match = re.search(r'([A-Za-z .\'-]+),\s*([A-Za-z\s]+)(?:\s*,?\s*\d{5}(?:-\d{4})?\s*,?\s*(?:United States|USA|US)?)?$', location, re.IGNORECASE)
    if city_full_state_match:
        city = city_full_state_match.group(1).strip()
        full_state = city_full_state_match.group(2).strip()
        state_code = state_name_to_code.get(full_state.lower())
        if state_code:
            return f"{city}, {state_code}", None
    
    # Try flexible patterns
    flexible_city_state_match = re.search(r'([A-Za-z .\'-]+),\s*([A-Z]{2})', location)
    if flexible_city_state_match:
        return f"{flexible_city_state_match.group(1).strip()}, {flexible_city_state_match.group(2).strip()}", None
    
    flexible_city_full_state_match = re.search(r'([A-Za-z .\'-]+),\s*([A-Za-z\s]+)', location)
    if flexible_city_full_state_match:
        city = flexible_city_full_state_match.group(1).strip()
        full_state = flexible_city_full_state_match.group(2).strip()
        state_code = state_name_to_code.get(full_state.lower())
        if state_code:
            return f"{city}, {state_code}", None
    
    # Try to extract just state
    state_match = re.search(r'\b([A-Z]{2})\b', location)
    if state_match:
        return None, state_match.group(1)
    
    # Try to match full state names
    location_lower = location.lower().strip()
    for state_name, state_code in state_name_to_code.items():
        if location_lower == state_name or location_lower in state_name:
            return None, state_code
    
    return None, None

def is_monetary(value: str) -> bool:
    """Check if a string is a monetary value."""
    if not value:
        return False
    return bool(re.search(r'\$\s?\d|\d+\s?(USD|usd|dollars|per\s?hour|\/hr|hourly|annually|per\s?year)', value))

def is_sign_on_bonus(text: str) -> bool:
    """Check if text contains sign-on bonus or other non-salary monetary values."""
    if not text:
        return False
    lower_text = text.lower()
    bonus_keywords = ['sign-on bonus', 'sign on bonus', 'signing bonus', 'bonus', 'incentive', 'referral bonus', 'retention bonus']
    return any(keyword in lower_text for keyword in bonus_keywords)

def extract_valid_salary(text: str) -> Optional[str]:
    """Extract and validate salary from text."""
    if not text:
        return None
    
    text_lower = text.lower()
    
    # Skip if it's a sign-on bonus
    if is_sign_on_bonus(text):
        return None
    
    # Look for hourly patterns
    hourly_patterns = [
        r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+hour|\/hour|\/hr|hourly)',
        r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+hour|\/hour|\/hr|hourly)'
    ]
    
    for pattern in hourly_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            num_value = float(match.group(1).replace(',', ''))
            return f"${num_value:.2f} per hour"
    
    # Look for annual patterns
    annual_patterns = [
        r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+year|annually|annual)',
        r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+year|annually|annual)'
    ]
    
    for pattern in annual_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            num_value = float(match.group(1).replace(',', ''))
            return f"${num_value:.2f} per year"
    
    # Look for per diem patterns
    per_diem_patterns = [
        r'\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+diem)',
        r'(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+diem)'
    ]
    
    for pattern in per_diem_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            num_value = float(match.group(1).replace(',', ''))
            return f"${num_value:.2f} per diem"
    
    return None

def format_salary(salary: str) -> str:
    """Format salary with proper units."""
    if not salary:
        return ''
    
    # Filter out malformed salary entries
    if re.search(r'\$\d{2}-\$\d{2}', salary) or re.search(r'\$\d{2}\/\$\d{2}', salary):
        return ''
    
    # Skip if it's a sign-on bonus
    if is_sign_on_bonus(salary):
        return ''
    
    salary_lower = salary.lower()
    
    # Handle malformed entries like "$025 - $07"
    if re.search(r'\$\d{3}-\$\d{2}', salary):
        match = re.search(r'\$(\d{3})-\$(\d{2})', salary)
        if match:
            first_num = int(match.group(1))
            second_num = int(match.group(2))
            return f"${first_num}-{second_num} per hour"
    
    # Check for hourly rates
    if any(indicator in salary_lower for indicator in ['/hr', '/hour', 'per hour', 'hourly']):
        match = re.search(r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', salary)
        if match:
            num_value = float(match.group(1).replace(',', ''))
            return f"${num_value:.2f} per hour"
    
    # Check for annual salaries
    if any(indicator in salary_lower for indicator in ['per year', 'annually', 'annual']):
        match = re.search(r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', salary)
        if match:
            num_value = float(match.group(1).replace(',', ''))
            return f"${num_value:.2f} per year"
    
    # Check for per diem rates
    if 'per diem' in salary_lower:
        match = re.search(r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', salary)
        if match:
            num_value = float(match.group(1).replace(',', ''))
            return f"${num_value:.2f} per diem"
    
    # If it's just a number with $, be conservative
    simple_match = re.search(r'\$?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)', salary)
    if simple_match and '/' not in salary_lower:
        num_value = float(simple_match.group(1).replace(',', ''))
        if 10 <= num_value <= 200:
            return f"${num_value:.2f} per hour"
    
    return ''

def truncate_title(title: str, max_length: int = 80) -> str:
    """Truncate long titles."""
    if not title or len(title) <= max_length:
        return title
    return title[:max_length-3] + '...'

def extract_requirements_from_description(desc: str) -> List[str]:
    """Extract requirements from description."""
    if not desc:
        return []
    
    requirements = []
    desc_lower = desc.lower()
    
    # Common requirement section headers
    requirement_headers = [
        r'requirements?:',
        r'qualifications?:',
        r'requirements & qualifications?:',
        r'minimum requirements?:',
        r'required qualifications?:',
        r'education & experience?:',
        r'education and experience?:',
        r'licenses & certifications?:',
        r'licenses and certifications?:',
        r'skills required?:',
        r'required skills?:',
        r'experience required?:',
        r'required experience?:'
    ]
    
    # Find requirement sections
    for header in requirement_headers:
        match = re.search(header, desc, re.IGNORECASE)
        if match:
            start_index = match.end()
            remaining_text = desc[start_index:]
            
            # Extract content until next major section or end
            next_section_match = re.search(r'\n\s*(?:benefits|responsibilities|duties|overview|about|compensation|salary|schedule|shift|location|contact|apply|application)', remaining_text, re.IGNORECASE)
            end_index = next_section_match.start() if next_section_match else len(remaining_text)
            requirement_section = remaining_text[:end_index].strip()
            
            if requirement_section:
                # Split by common delimiters and clean up
                items = requirement_section.split(r'[•\n\r]')
                items = [item.strip() for item in items if item.strip()]
                items = [item for item in items if 10 < len(item) < 500]
                items = [item for item in items if not any(keyword in item.lower() for keyword in ['apply now', 'click here'])]
                requirements.extend(items)
    
    # If no structured requirements found, look for bullet points
    if not requirements:
        bullet_matches = re.findall(r'[•·]\s*([^•·\n]+)', desc)
        if bullet_matches:
            items = [item.strip() for item in bullet_matches if item.strip()]
            items = [item for item in items if 10 < len(item) < 500]
            items = [item for item in items if not any(keyword in item.lower() for keyword in ['apply now', 'click here', 'contact us'])]
            requirements.extend(items)
    
    # Remove duplicates and return
    return list(dict.fromkeys(requirements))[:10]  # Limit to 10 requirements max

def parse_facility_from_company(company: str, description: str, location: str) -> str:
    """Parse out individual facilities from multi-site parent companies."""
    if not company:
        return ''
    
    company_lower = company.lower()
    description_lower = description.lower()
    location_lower = location.lower() if isinstance(location, str) else ''
    
    # Multi-site parent companies and their facility patterns
    parent_company_patterns = {
        'rydershealth': {
            'patterns': [
                r'bel-air manor',
                r'bel air manor',
                r'belair manor',
                r'cheshire house nursing & rehabilitation center',
                r'cheshire house',
                r'douglas manor nursing & rehabilitation center',
                r'douglas manor',
                r'greentree manor nursing & rehabilitation center',
                r'greentree manor',
                r'aaron manor nursing and rehabilitation center',
                r'aaron manor',
                r'west haven center for nursing & rehabilitation',
                r'west haven center',
                r'waterbury center for nursing & rehabilitation',
                r'waterbury center',
                r'torrington center for nursing & rehabilitation',
                r'torrington center',
                r'southport center for nursing & rehabilitation',
                r'southport center',
                r'new haven center for nursing & rehabilitation',
                r'new haven center'
            ],
            'fallback': 'RydersHealth'
        },
        'athena health care systems': {
            'patterns': [
                r'athena hospice of rhode island',
                r'athena home health & hospice',
                r'athena home health and hospice',
                r'athena hospice',
                r'athena home health'
            ],
            'fallback': 'Athena Health Care Systems'
        }
    }
    
    # Check if this is a known parent company
    for parent_company, config in parent_company_patterns.items():
        if parent_company in company_lower:
            # Look for facility patterns in description and location
            for pattern in config['patterns']:
                if re.search(pattern, description_lower, re.IGNORECASE) or re.search(pattern, location_lower, re.IGNORECASE):
                    return pattern.replace('_', ' ').title()
            
            # If no specific facility found, return the fallback
            return config['fallback']
    
    # If not a known parent company, return the original company name
    return company

def get_job_setting(title: str, description: str, company: str) -> str:
    """Get job setting tag."""
    text = (title + ' ' + description).lower()
    company_text = (company or '').lower()
    
    # Check for nursing home indicators in company name first
    nursing_home_company_patterns = [
        'rehabilitation and healthcare center',
        'rehabilitation & healthcare center',
        'rehabilitation center',
        'healthcare center',
        'nursing home',
        'skilled nursing',
        'skilled nursing facility',
        'long term care',
        'ltc',
        'convalescent home',
        'care center',
        'health center',
        'medical center',
        'rehab center',
        'rehabilitation facility',
        'healthcare facility',
        'nursing facility',
        'care facility'
    ]
    
    for pattern in nursing_home_company_patterns:
        if pattern in company_text:
            return 'Nursing Home'
    
    # Check for nursing home indicators in title and description
    if any(indicator in text for indicator in ['nursing home', 'skilled nursing', 'ltc', 'long term care', 'convalescent', 'rehabilitation']):
        return 'Nursing Home'
    elif any(indicator in text for indicator in ['assisted living', 'alf', 'memory care']):
        return 'Assisted Living Facility'
    elif any(indicator in text for indicator in ['homecare', 'home care', 'home health', 'in-home']):
        return 'Home Care'
    else:
        return 'Nursing Home'  # Default to Nursing Home

def get_employment_type(title: str, description: str) -> str:
    """Get employment type tag."""
    text = (title + ' ' + description).lower()
    if 'part-time' in text or 'part time' in text:
        return 'Part-Time'
    elif any(indicator in text for indicator in ['per diem', 'per-diem', 'prn']):
        return 'Per-Diem'
    elif any(indicator in text for indicator in ['temp-to-perm', 'temp to perm', 'temporary to permanent']):
        return 'Temp-To-Perm'
    elif any(indicator in text for indicator in ['local contract', 'travel contract', 'contract position']):
        return 'Local Contract'
    else:
        return 'Full-Time'  # Default to Full-Time

def get_shift(title: str, description: str) -> str:
    """Get shift tag."""
    title_text = title.lower()
    desc_text = description.lower()
    combined_text = title_text + ' ' + desc_text
    
    # Helper function to check text for patterns
    def check_text_for_patterns(text: str) -> Optional[str]:
        # First check for first, second, third shift patterns
        shift_number_patterns = [
            (r'first\s*shift|1st\s*shift|first', 'Morning'),
            (r'second\s*shift|2nd\s*shift|second', 'Evening'),
            (r'third\s*shift|3rd\s*shift|third', 'Overnight'),
        ]
        
        for pattern, shift in shift_number_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return shift
        
        # Check for specific time patterns
        specific_time_patterns = [
            (r'7\s*(?:am|a)?\s*[-to]\s*7\s*(?:pm|p)?', '7AM-7PM'),
            (r'7\s*(?:pm|p)?\s*[-to]\s*7\s*(?:am|a)?', '7PM-7AM'),
            (r'6\s*(?:am|a)?\s*[-to]\s*6\s*(?:pm|p)?', '6AM-6PM'),
            (r'6\s*(?:pm|p)?\s*[-to]\s*6\s*(?:am|a)?', '6PM-6AM'),
            (r'8\s*(?:am|a)?\s*[-to]\s*8\s*(?:pm|p)?', '8AM-8PM'),
            (r'8\s*(?:pm|p)?\s*[-to]\s*8\s*(?:am|a)?', '8PM-8AM'),
            (r'7\s*(?:am|a)?\s*[-to]\s*3\s*(?:pm|p)?', '7AM-3PM'),
            (r'3\s*(?:pm|p)?\s*[-to]\s*11\s*(?:pm|p)?', '3PM-11PM'),
            (r'11\s*(?:pm|p)?\s*[-to]\s*7\s*(?:am|a)?', '11PM-7AM'),
            (r'6\s*(?:am|a)?\s*[-to]\s*2\s*(?:pm|p)?', '6AM-2PM'),
            (r'2\s*(?:pm|p)?\s*[-to]\s*10\s*(?:pm|p)?', '2PM-10PM'),
            (r'10\s*(?:pm|p)?\s*[-to]\s*6\s*(?:am|a)?', '10PM-6AM'),
            (r'8\s*(?:am|a)?\s*[-to]\s*4\s*(?:pm|p)?', '8AM-4PM'),
            (r'4\s*(?:pm|p)?\s*[-to]\s*12\s*(?:am|a|midnight)?', '4PM-12AM'),
            (r'12\s*(?:am|a|midnight)?\s*[-to]\s*8\s*(?:am|a)?', '12AM-8AM'),
            (r'9\s*(?:am|a)?\s*[-to]\s*5\s*(?:pm|p)?', '9AM-5PM'),
            (r'5\s*(?:pm|p)?\s*[-to]\s*1\s*(?:am|a)?', '5PM-1AM'),
            (r'1\s*(?:am|a)?\s*[-to]\s*9\s*(?:am|a)?', '1AM-9AM'),
        ]
        
        for pattern, shift in specific_time_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return shift
        
        # Check for explicit shift keywords
        if any(indicator in text for indicator in ['overnight shift', 'night shift', 'graveyard shift', 'night nurses', 'overnight']):
            return 'Night'
        elif any(indicator in text for indicator in ['morning shift', 'early morning', 'morning']):
            return 'Morning'
        elif any(indicator in text for indicator in ['afternoon shift', 'midday', 'afternoon']):
            return 'Afternoon'
        elif any(indicator in text for indicator in ['evening shift', 'late afternoon', 'evening']):
            return 'Evening'
        elif any(indicator in text for indicator in ['day shift', 'daytime', 'day and evening']):
            return 'Morning'
        
        return None
    
    # Check description first as it often contains more detailed shift information
    result = check_text_for_patterns(desc_text)
    if result:
        return result
    
    # Check title if description didn't yield results
    result = check_text_for_patterns(title_text)
    if result:
        return result
    
    # Check combined text as fallback
    result = check_text_for_patterns(combined_text)
    if result:
        return result
    
    # Default based on common healthcare patterns
    if any(indicator in combined_text for indicator in ['day shift', 'daytime']):
        return 'Morning'
    elif any(indicator in combined_text for indicator in ['evening', 'afternoon']):
        return 'Afternoon'
    elif any(indicator in combined_text for indicator in ['night', 'overnight']):
        return 'Night'
    
    # Default to Morning for healthcare jobs
    return 'Morning'

def generate_tags(title: str, description: str, category: str = None, company: str = None) -> List[Dict[str, Any]]:
    """Generate tags for a job based on title, description, and category."""
    tags = []
    
    # Job Setting tag (Purple)
    job_setting = get_job_setting(title, description, company)
    tags.append({'id': f"tag_{len(tags)}", 'label': job_setting, 'type': 'job_setting'})
    
    # Employment Type tag (Blue)
    employment_type = get_employment_type(title, description)
    tags.append({'id': f"tag_{len(tags)}", 'label': employment_type, 'type': 'employment_type'})
    
    # Shift tag (Pink)
    shift = get_shift(title, description)
    tags.append({'id': f"tag_{len(tags)}", 'label': shift, 'type': 'shift'})
    
    return tags

def transform_job_data(raw_jobs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Transform the raw job data to generate tags and clean up the data."""
    transformed_jobs = []
    
    for index, job in enumerate(raw_jobs):
        title = job.get('title', 'Unknown Position')
        description = job.get('description', '')
        url = job.get('url') or job.get('job_url', '')
        company = job.get('company') or job.get('organization_name', '')
        location = job.get('location', '')
        
        # Parse out individual facilities from multi-site parent companies
        parsed_company = parse_facility_from_company(company, description, location)
        
        # Extract city, state from location
        city_state, state_only = extract_city_state(location)
        location = city_state or state_only or ''
        # If not parseable, hide location
        if not city_state and not state_only:
            location = ''
        
        # Enhanced salary logic - check multiple sources
        salary = job.get('salary_range') or job.get('salary', '')
        
        # Check for base_salary from rich data
        if not salary and job.get('basesalary'):
            base_salary = job['basesalary']
            if isinstance(base_salary, dict) and base_salary.get('value'):
                salary = f"${base_salary['value']}/hr"
        
        # First try to extract valid salary from title
        if not salary or is_sign_on_bonus(salary):
            title_salary = extract_valid_salary(title)
            if title_salary:
                salary = title_salary
        
        # If no valid salary from title, try description
        if not salary or is_sign_on_bonus(salary):
            desc_salary = extract_valid_salary(description)
            if desc_salary:
                salary = desc_salary
        
        # Format the salary with proper units
        salary = format_salary(salary)
        
        # Truncate title if it's too long
        truncated_title = truncate_title(title)
        
        # Generate tags
        tags = generate_tags(truncated_title, description, job.get('category'), parsed_company)
        
        # Extract requirements from description if not already present
        requirements = job.get('requirements', [])
        if not requirements or (isinstance(requirements, list) and len(requirements) == 0):
            extracted_requirements = extract_requirements_from_description(description)
            if extracted_requirements:
                requirements = extracted_requirements
        
        # Extract rich data fields
        rich_data = {
            'job_url': job.get('job_url'),
            'date_posted': job.get('dateposted') or job.get('date_posted'),
            'employment_type': job.get('employmenttype'),
            'base_salary': job.get('basesalary'),
            'industry': job.get('industry'),
            'education_requirements': job.get('educationrequirements'),
            'organization_logo': job.get('organization_logo') or (job.get('hiringorganization', {}) or {}).get('logo'),
            'organization_name': job.get('organization_name') or (job.get('hiringorganization', {}) or {}).get('name'),
            'organization_website': job.get('organization_sameas') or (job.get('hiringorganization', {}) or {}).get('sameAs'),
            'address': {
                'city': job.get('address_addresslocality') or (job.get('joblocation', {}) or {}).get('address', {}).get('addressLocality'),
                'state': job.get('address_addressregion') or (job.get('joblocation', {}) or {}).get('address', {}).get('addressRegion'),
                'zip_code': job.get('address_postalcode') or (job.get('joblocation', {}) or {}).get('address', {}).get('postalCode'),
                'street_address': job.get('address_streetaddress') or (job.get('joblocation', {}) or {}).get('address', {}).get('streetAddress'),
                'latitude': job.get('address_latitude') or (job.get('joblocation', {}) or {}).get('address', {}).get('latitude'),
                'longitude': job.get('address_longitude') or (job.get('joblocation', {}) or {}).get('address', {}).get('longitude'),
            },
            'scraped_at': job.get('scraped_at'),
            'source_url': job.get('source_url'),
        }
        
        transformed_job = {
            'id': job.get('id') or f"job_{index + 1}",
            'title': truncated_title,
            'company': clean_job_card_content(parsed_company, 50),
            'location': clean_job_card_content(location, 30),
            'salary': clean_job_card_content(salary, 20),
            'url': url,
            'overview': clean_job_card_content(job.get('overview') or 'Community Focused. Care Driven.', 50),
            'description': description,
            'requirements': requirements,
            'tags': tags,
            **rich_data  # Spread all the rich data fields
        }
        
        transformed_jobs.append(transformed_job)
    
    # Filter out jobs with unknown or empty company names
    transformed_jobs = [
        job for job in transformed_jobs 
        if job['company'].strip().lower() not in ['', 'unknown company', 'unknown', 'n/a', 'na']
    ]
    
    return transformed_jobs

def main():
    """Main function to extract and transform jobs for training."""
    print("🚀 Starting job extraction and transformation for pre-training...")
    
    # Load the JSON file
    input_file = "improved_ct_jobs_20250725_054659.json"
    print(f"📁 Loading jobs from {input_file}...")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            raw_jobs = json.load(f)
        print(f"✅ Loaded {len(raw_jobs)} jobs from {input_file}")
    except Exception as e:
        print(f"❌ Error loading {input_file}: {e}")
        return
    
    # Extract 75 jobs (middle ground between 50-100)
    target_count = 75
    print(f"🎯 Extracting {target_count} jobs for training...")
    
    # Randomly sample jobs to ensure diversity
    random.seed(42)  # Set seed for reproducibility
    selected_jobs = random.sample(raw_jobs, min(target_count, len(raw_jobs)))
    print(f"✅ Selected {len(selected_jobs)} jobs")
    
    # Transform the selected jobs
    print("🔄 Transforming job data...")
    transformed_jobs = transform_job_data(selected_jobs)
    print(f"✅ Transformed {len(transformed_jobs)} jobs")
    
    # Create output filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"training_jobs_{timestamp}.json"
    
    # Save the transformed jobs
    print(f"💾 Saving transformed jobs to {output_file}...")
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(transformed_jobs, f, indent=2, ensure_ascii=False)
        print(f"✅ Successfully saved {len(transformed_jobs)} transformed jobs to {output_file}")
    except Exception as e:
        print(f"❌ Error saving {output_file}: {e}")
        return
    
    # Print summary statistics
    print("\n📊 Training Dataset Summary:")
    print(f"   Total jobs: {len(transformed_jobs)}")
    
    # Count jobs by job setting
    job_settings = {}
    employment_types = {}
    shifts = {}
    
    for job in transformed_jobs:
        for tag in job.get('tags', []):
            if tag['type'] == 'job_setting':
                job_settings[tag['label']] = job_settings.get(tag['label'], 0) + 1
            elif tag['type'] == 'employment_type':
                employment_types[tag['label']] = employment_types.get(tag['label'], 0) + 1
            elif tag['type'] == 'shift':
                shifts[tag['label']] = shifts.get(tag['label'], 0) + 1
    
    print(f"   Job Settings: {dict(job_settings)}")
    print(f"   Employment Types: {dict(employment_types)}")
    print(f"   Shifts: {dict(shifts)}")
    
    # Count jobs with salary information
    jobs_with_salary = sum(1 for job in transformed_jobs if job.get('salary'))
    print(f"   Jobs with salary: {jobs_with_salary}")
    
    # Count jobs with requirements
    jobs_with_requirements = sum(1 for job in transformed_jobs if job.get('requirements'))
    print(f"   Jobs with requirements: {jobs_with_requirements}")
    
    print(f"\n🎉 Training dataset ready! File: {output_file}")
    print("   You can now use this file for pre-training your model with transformed features.")

if __name__ == "__main__":
    main()
