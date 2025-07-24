#!/usr/bin/env python3
"""
CSV to JSON Converter for Job Cards
===================================

This script converts the manual.csv file into a JSON format suitable for job cards.
"""

import csv
import json
import re
from datetime import datetime
from typing import Dict, List, Any

def clean_text(text: str) -> str:
    """Clean and normalize text fields."""
    if not text:
        return ""
    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text.strip())
    return text

def parse_pay(pay_str: str) -> Dict[str, Any]:
    """Parse pay information from string."""
    if not pay_str:
        return {"amount": None, "type": "hourly", "range": False}
    
    pay_str = pay_str.strip()
    
    # Handle ranges like "$50-53" or "$32-35"
    if '-' in pay_str:
        # Extract numbers from range
        numbers = re.findall(r'\$?(\d+(?:\.\d+)?)', pay_str)
        if len(numbers) >= 2:
            return {
                "amount": float(numbers[0]),
                "max_amount": float(numbers[1]),
                "type": "hourly",
                "range": True
            }
    
    # Handle single amounts like "$20.02"
    amount_match = re.search(r'\$?(\d+(?:\.\d+)?)', pay_str)
    if amount_match:
        return {
            "amount": float(amount_match.group(1)),
            "type": "hourly",
            "range": False
        }
    
    return {"amount": None, "type": "hourly", "range": False}

def parse_employment_type(emp_type: str) -> List[str]:
    """Parse employment type into list of options."""
    if not emp_type:
        return []
    
    # Split by common delimiters and clean
    types = re.split(r'[,&]', emp_type)
    return [clean_text(t) for t in types if clean_text(t)]

def parse_shifts(shifts: str) -> List[str]:
    """Parse shifts into list of options."""
    if not shifts:
        return []
    
    # Split by common delimiters and clean
    shift_list = re.split(r'[,&]', shifts)
    return [clean_text(s) for s in shift_list if clean_text(s)]

def create_job_card(row: Dict[str, str]) -> Dict[str, Any]:
    """Create a job card object from CSV row."""
    
    # Clean and process the data
    title = clean_text(row.get('Title', ''))
    company = clean_text(row.get('source_site', ''))
    description = clean_text(row.get('Description', ''))
    role = clean_text(row.get('role', ''))
    shifts = parse_shifts(row.get('Shift(s)', ''))
    employment_types = parse_employment_type(row.get('employment_type', ''))
    pay_info = parse_pay(row.get('pay', ''))
    
    # Create location object
    location = {
        "state": clean_text(row.get('state', '')),
        "city": clean_text(row.get('city', '')),
        "zip_code": clean_text(row.get('zip_code', ''))
    }
    
    # Create the job card object
    job_card = {
        "id": f"manual_{hash(f'{company}_{title}_{row.get('apply_url', '')}')}",
        "title": title,
        "company": company,
        "description": description,
        "role": role,
        "shifts": shifts,
        "employment_type": employment_types,
        "location": location,
        "pay": pay_info,
        "setting_type": clean_text(row.get('setting_type', '')),
        "apply_url": clean_text(row.get('apply_url', '')),
        "source": "manual",
        "scraped_at": datetime.now().isoformat()
    }
    
    return job_card

def convert_csv_to_json(csv_file: str, json_file: str) -> None:
    """Convert CSV file to JSON format."""
    
    job_cards = []
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            for row in reader:
                try:
                    job_card = create_job_card(row)
                    job_cards.append(job_card)
                except Exception as e:
                    print(f"Error processing row: {e}")
                    print(f"Row data: {row}")
                    continue
        
        # Save to JSON file
        with open(json_file, 'w', encoding='utf-8') as file:
            json.dump(job_cards, file, indent=2, ensure_ascii=False)
        
        print(f"✅ Successfully converted {len(job_cards)} job cards")
        print(f"📁 Output saved to: {json_file}")
        
        # Print summary statistics
        print("\n📊 Summary Statistics:")
        print(f"   Total jobs: {len(job_cards)}")
        
        # Count by role
        roles = {}
        for job in job_cards:
            role = job.get('role', 'Unknown')
            roles[role] = roles.get(role, 0) + 1
        
        print(f"   Roles found: {len(roles)}")
        for role, count in sorted(roles.items()):
            print(f"     {role}: {count}")
        
        # Count by setting type
        settings = {}
        for job in job_cards:
            setting = job.get('setting_type', 'Unknown')
            settings[setting] = settings.get(setting, 0) + 1
        
        print(f"   Setting types: {len(settings)}")
        for setting, count in sorted(settings.items()):
            print(f"     {setting}: {count}")
        
        # Count jobs with pay information
        jobs_with_pay = sum(1 for job in job_cards if job['pay']['amount'] is not None)
        print(f"   Jobs with pay info: {jobs_with_pay}")
        
        # Count jobs with descriptions
        jobs_with_desc = sum(1 for job in job_cards if job['description'])
        print(f"   Jobs with descriptions: {jobs_with_desc}")
        
    except Exception as e:
        print(f"❌ Error converting CSV to JSON: {e}")

def main():
    """Main function."""
    csv_file = "manual.csv"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_file = f"manual_jobs_{timestamp}.json"
    
    print("🔄 Converting manual.csv to JSON format...")
    convert_csv_to_json(csv_file, json_file)

if __name__ == "__main__":
    main() 