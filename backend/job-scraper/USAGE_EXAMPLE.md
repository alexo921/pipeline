# Usage Examples for Enhanced Job Scraper

## Enhancing Existing JSON Files

### 1. Enhance a Specific File
```bash
python3 enhance_existing_data.py --file site_Athena_Health_Care_Systems_20250716_221638.json --max-jobs 10
```

### 2. Enhance All JSON Files in Directory
```bash
python3 enhance_existing_data.py --directory . --max-jobs 5
```

### 3. Test Enhancement on Sample Data
```bash
python3 test_enhancement.py
```

## What the Enhancement Does

The enhanced scraper adds the following improvements to Apploi-based job sites:

### Before Enhancement:
- Most fields are empty except URLs
- Job titles missing
- Company names missing
- Locations missing
- Descriptions missing
- Salary information missing

### After Enhancement:
- Extracts job titles from Apploi job pages
- Identifies company names from job descriptions
- Parses location information
- Extracts full job descriptions
- Attempts to find salary information
- Cleans and formats all data

## Key Features Added

1. **Comprehensive Apploi Selectors**: Multiple CSS selectors for different Apploi page layouts
2. **Salary Extraction**: Multiple methods to find compensation information
3. **Company Name Detection**: Regex patterns to identify company names
4. **Location Parsing**: Enhanced city/state extraction
5. **Data Cleaning**: Removes extra whitespace and formatting issues
6. **Fallback Strategies**: Multiple approaches for each data field

## Output Files

Enhanced files are saved with `_enhanced` suffix:
- Original: `site_Athena_Health_Care_Systems_20250716_221638.json`
- Enhanced: `site_Athena_Health_Care_Systems_20250716_221638_enhanced.json`

## Performance Notes

- Processing is done asynchronously for better performance
- Browser automation handles dynamic content loading
- Rate limiting prevents overwhelming target sites
- Progress logging shows enhancement status 