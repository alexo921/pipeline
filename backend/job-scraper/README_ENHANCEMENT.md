# Job Scraper Enhancement for Apploi Sites

## Overview

The multi-site deep scraper has been enhanced with comprehensive Apploi job extraction capabilities to improve data quality for sites using the Apploi job board platform.

## Problem

Many healthcare job sites use Apploi as their job board platform, but the original scraper was not effectively extracting job details from Apploi URLs, resulting in JSON files with mostly empty fields except for URLs.

## Solution

Enhanced the `multi_site_deep_scraper_enhanced.py` with:

### 1. Comprehensive Apploi Selectors
- Added extensive CSS selectors specifically for Apploi job pages
- Implemented multiple fallback strategies for each data field
- Enhanced pattern matching for dynamic class names

### 2. Advanced Data Extraction Methods
- **Salary Extraction**: Multiple methods including compensation headers, salary selectors, and pattern matching
- **Company Name Extraction**: Regex patterns to identify company names in job descriptions
- **Location Parsing**: Enhanced city/state extraction from various location formats
- **Date Extraction**: JSON-LD schema support and multiple selector fallbacks

### 3. Data Cleaning and Standardization
- Salary text cleaning and formatting
- Company name normalization
- Location parsing with multiple format support
- Description length validation

### 4. Enhancement Capabilities
- `enhance_job_data()`: Enhance individual job entries
- `enhance_job_batch()`: Process multiple jobs efficiently
- `enhance_existing_json_file()`: Enhance entire JSON files

## Key Improvements

### Before Enhancement
```json
{
  "title": "",
  "company": "",
  "location": "",
  "city": "",
  "state": "",
  "date_posted": "",
  "salary": "",
  "description": "",
  "url": "https://jobs.apploi.com/view/1337404?...",
  "apply_url": "https://jobs.apploi.com/view/1337404?..."
}
```

### After Enhancement
```json
{
  "title": "Registered Nurse (RN)",
  "company": "Athena Health Care Systems",
  "location": "Hartford, CT",
  "city": "Hartford",
  "state": "CT",
  "date_posted": "2025-07-15",
  "salary": "$35.00 - $45.00 per hour",
  "description": "We are seeking a dedicated Registered Nurse...",
  "url": "https://jobs.apploi.com/view/1337404?...",
  "apply_url": "https://jobs.apploi.com/view/1337404?..."
}
```

## Usage

### Enhance Existing JSON Files

```bash
# Enhance all JSON files in the directory
python enhance_existing_data.py

# Enhance a specific file
python enhance_existing_data.py --file site_Athena_Health_Care_Systems_20250716_221638.json

# Limit jobs processed per file
python enhance_existing_data.py --max-jobs 10
```

### Test Enhancement

```bash
# Test enhancement on Athena Health Care Systems data
python test_enhancement.py
```

### Programmatic Usage

```python
from multi_site_deep_scraper_enhanced import EnhancedMultiSiteDeepScraper

# Create scraper instance
scraper = EnhancedMultiSiteDeepScraper("sites.csv")

# Enhance existing JSON file
await scraper.enhance_existing_json_file("site_data.json", max_jobs=50)

# Enhance individual job
enhanced_job = await scraper.enhance_job_data(job_entry, browser)
```

## Enhanced Selectors

### Title Selectors
- `[class*="JobName-"]`
- `[class*="JobTitle-"]`
- `.job-title`, `.position-title`
- `h1`, `h2` elements

### Company Selectors
- `[class*="BrandName-"]`
- `[class*="Company-"]`
- `.company`, `.employer`
- `.job-company`, `.employer-name`

### Location Selectors
- `[class*="MapLocationText-"]`
- `[class*="Location-"]`
- `.location`, `.job-location`
- `.job-city`, `.job-state`

### Description Selectors
- `[class*="DangerousDiv-"]`
- `[class*="SummaryContainer-"]`
- `.description`, `.job-description`
- `.job-details`, `.position-details`

### Salary Extraction Methods
1. **Compensation Headers**: Find h3 elements with "compensation", "salary", or "pay"
2. **Salary Selectors**: Multiple CSS selectors for salary information
3. **Pattern Matching**: Regex patterns to find salary information in any text

## Statistics Tracking

The enhancement process provides detailed statistics:

```
Enhancement Statistics:
  Jobs with title: 45/50
  Jobs with company: 42/50
  Jobs with location: 38/50
  Jobs with description: 47/50
  Jobs with salary: 15/50
```

## Files Modified

1. **`multi_site_deep_scraper_enhanced.py`**
   - Added regex pattern compilation
   - Enhanced `get_job_details_efficient()` method
   - Added `enhance_job_data()` and `enhance_job_batch()` methods
   - Added `enhance_existing_json_file()` method

2. **`enhance_existing_data.py`**
   - New script for batch enhancement of JSON files

3. **`test_enhancement.py`**
   - Test script to demonstrate enhancement capabilities

## Performance Considerations

- Uses existing browser instances for efficiency
- Implements delays between requests to avoid overwhelming servers
- Processes jobs in batches with configurable limits
- Provides progress tracking and statistics

## Error Handling

- Graceful fallbacks when selectors don't match
- Comprehensive error logging
- Continues processing even if individual jobs fail
- Validates data quality before saving

## Future Improvements

1. **Machine Learning**: Train models to better identify job data patterns
2. **API Integration**: Direct integration with job board APIs where available
3. **Real-time Enhancement**: Enhance jobs as they're scraped
4. **Custom Selectors**: Site-specific selector configurations
5. **Data Validation**: Enhanced validation of extracted data quality 