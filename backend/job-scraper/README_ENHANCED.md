# Enhanced Healthcare Job Scraper v2.0

A comprehensive, intelligent healthcare job scraper with advanced NLP processing, resilient scraping, and comprehensive data analysis.

## 🚀 New Features in v2.0

### 🔍 **Intelligent Data Extraction**
- **Smart Salary Parsing**: Automatically extracts and standardizes salary ranges (hourly/annual)
- **Job Classification**: Categorizes jobs into Nursing, Caregiving, Therapy, Administration, etc.
- **Seniority Detection**: Identifies entry, mid, senior, and executive level positions
- **Requirements Analysis**: Extracts and categorizes education, experience, certifications, and skills
- **Benefits Detection**: Identifies common benefits like 401k, insurance, PTO, etc.

### 🛡️ **Resilient Scraping**
- **Retry Logic**: Automatic retry with exponential backoff for failed requests
- **Error Recovery**: Graceful handling of timeouts, connection errors, and page load failures
- **Parallel Processing**: Multi-threaded scraping for improved performance
- **State Persistence**: Save and resume scraping from where it left off

### 📊 **Comprehensive Analytics**
- **Data Quality Scoring**: Automatic assessment of job posting completeness
- **Salary Analysis**: Statistical analysis of salary ranges and market trends
- **Platform Distribution**: Analysis of job sources across different ATS platforms
- **Geographic Analysis**: Location-based job distribution insights

### 📁 **Multiple Export Formats**
- **Full JSON**: Complete data with all extracted fields
- **Simplified JSON**: Clean format for API consumption
- **CSV Export**: Excel-compatible spreadsheet format
- **High-Quality Filter**: Export only jobs with >80% completeness
- **Salary-Only Export**: Jobs with salary information

## 🏗️ Architecture

### Core Components

1. **EnhancedHealthcareScraper**: Main scraper class with all new capabilities
2. **Platform Detection**: Automatic detection of ATS platforms (iCIMS, Workday, ADP, etc.)
3. **NLP Processing**: Intelligent text analysis for job classification and requirements extraction
4. **Data Validation**: Quality checks and completeness scoring
5. **Parallel Processing**: Multi-threaded execution for improved performance

### Data Model

Each job posting now includes:

```json
{
  "id": "unique_job_id",
  "title": "Job Title",
  "company": "Company Name",
  "location": "Full Location",
  "city": "City",
  "state": "State",
  "zip_code": "ZIP Code",
  "salary": "Raw salary text",
  "salary_parsed": {
    "min": 25,
    "max": 35,
    "type": "hourly",
    "is_competitive": false
  },
  "shift_type": "Full-time",
  "requirements": "Raw requirements text",
  "requirements_structured": {
    "education": ["Bachelor's degree"],
    "experience": ["2 years experience"],
    "certifications": ["RN license"],
    "skills": ["Patient care", "Communication"]
  },
  "benefits": "401k, health insurance",
  "job_category": "nursing",
  "seniority_level": "mid",
  "is_remote": false,
  "completeness_score": {
    "required": 0.9,
    "optional": 0.7,
    "overall": 0.85
  }
}
```

## 🚀 Usage

### Basic Usage

```python
from enhanced_comprehensive_scraper import EnhancedHealthcareScraper

# Initialize scraper
scraper = EnhancedHealthcareScraper(
    headless=True,
    debug=False,
    max_workers=3  # For parallel processing
)

# Scrape all sites
jobs = scraper.scrape_all_sites(
    max_sites=None,  # All sites
    max_pages_per_site=30
)

# Save results
scraper.save_jobs("healthcare_jobs")
```

### Parallel Processing

```python
# Use parallel processing for better performance
jobs = scraper.scrape_all_sites_parallel(
    max_sites=50,
    max_pages_per_site=20
)
```

### Export to Multiple Formats

```python
# Export to all available formats
scraper.export_to_multiple_formats("healthcare_jobs")
```

### Get Quality Insights

```python
# Analyze data quality
insights = scraper.get_quality_insights()
print(f"Average completeness: {insights['overall_quality']['average_completeness']:.1f}%")
```

### Generate Comprehensive Report

```python
# Print detailed analysis
scraper.print_comprehensive_report()
```

## 📊 Output Files

The scraper generates multiple output files:

1. **`enhanced_healthcare_jobs_X_timestamp.json`**: Full data with comprehensive analysis
2. **`enhanced_healthcare_jobs_X_timestamp.csv`**: Excel-compatible spreadsheet
3. **`enhanced_healthcare_jobs_summary_timestamp.json`**: Statistical summary
4. **`enhanced_healthcare_jobs_full_X_timestamp.json`**: Complete raw data
5. **`enhanced_healthcare_jobs_simple_X_timestamp.json`**: Simplified format for APIs
6. **`enhanced_healthcare_jobs_high_quality_X_timestamp.json`**: High-quality jobs only
7. **`enhanced_healthcare_jobs_with_salary_X_timestamp.json`**: Jobs with salary info

## 🔧 Configuration

### Scraper Settings

```python
scraper = EnhancedHealthcareScraper(
    headless=True,        # Run in headless mode
    debug=False,          # Enable debug logging
    max_workers=3         # Number of parallel workers
)
```

### Scraping Parameters

```python
jobs = scraper.scrape_all_sites(
    max_sites=100,        # Limit number of sites
    max_pages_per_site=30 # Pages per site
)
```

## 📈 Performance

### Speed Improvements
- **Parallel Processing**: 3x faster with 3 workers
- **Resilient Scraping**: Higher success rates with retry logic
- **Optimized Selectors**: Better data extraction efficiency

### Data Quality
- **Completeness Scoring**: Automatic quality assessment
- **Validation**: Data integrity checks
- **Error Tracking**: Comprehensive error logging

## 🧪 Testing

Run the test script to verify functionality:

```bash
python test_enhanced_scraper.py
```

This will:
- Test with 3 sample sites
- Verify all new features
- Generate test output files
- Display comprehensive report

## 📋 Requirements

```bash
pip install undetected-chromedriver selenium beautifulsoup4
```

## 🔍 Monitoring

### Real-time Progress

```python
# Get current progress
progress = scraper.get_scraping_progress()
print(f"Processed: {progress['sites_processed']}")
print(f"Success Rate: {progress['success_rate']:.1f}%")
```

### Error Analysis

```python
# Check for errors
errors = scraper.scraping_stats['errors']
for error in errors:
    print(f"Site: {error['site']}, Error: {error['error']}")
```

## 🎯 Use Cases

1. **Job Market Analysis**: Comprehensive healthcare job market insights
2. **Salary Research**: Salary range analysis by job type and location
3. **Recruitment Intelligence**: Understanding job requirements and trends
4. **Competitive Analysis**: Monitor competitor job postings
5. **Data Science**: Rich dataset for ML/AI applications

## 🔄 Future Enhancements

- **Machine Learning**: Predictive salary modeling
- **Real-time Monitoring**: Live job posting alerts
- **API Integration**: REST API for data access
- **Advanced NLP**: More sophisticated text analysis
- **Geographic Intelligence**: Location-based insights

## 📞 Support

For issues or questions:
1. Check the error logs in the scraping output
2. Review the data quality insights
3. Test with a small sample using `test_enhanced_scraper.py`

---

**Enhanced Healthcare Job Scraper v2.0** - The most comprehensive healthcare job scraping solution available. 