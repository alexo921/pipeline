import logging
from selenium_scraper import SeleniumScraper, JobData
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_salary_parsing():
    """Test the salary parsing functionality."""
    scraper = SeleniumScraper(headless=True)
    
    test_cases = [
        ("$50,000/year", {"salary_min": 50000, "salary_max": 50000, "salary_period": "yearly"}),
        ("$20-$25 per hour", {"salary_min": 20, "salary_max": 25, "salary_period": "hourly"}),
        ("$40k - $60k/yr", {"salary_min": 40000, "salary_max": 60000, "salary_period": "yearly"}),
        ("$15.50/hr", {"salary_min": 15.50, "salary_max": 15.50, "salary_period": "hourly"}),
        ("Invalid salary", {"salary_min": None, "salary_max": None, "salary_period": None}),
    ]
    
    logger.info("Testing salary parsing...")
    for salary_text, expected in test_cases:
        result = scraper._parse_salary(salary_text)
        logger.info(f"Input: {salary_text}")
        logger.info(f"Expected: {expected}")
        logger.info(f"Got: {result}")
        logger.info("---")

def test_job_data_validation():
    """Test the JobData class validation."""
    logger.info("Testing JobData validation...")
    
    # Test valid job data
    try:
        job = JobData(
            title="Senior Care Professional",
            company="Home Instead",
            location="Boston, MA",
            description="Caring for seniors...",
            posted_date="2024-01-01",
            url="https://example.com/job",
            source="homeinstead",
            scraped_date=datetime.now().isoformat(),
            salary_min=20.0,
            salary_max=25.0,
            salary_period="hourly",
            job_type="full-time"
        )
        logger.info("Valid job data created successfully")
        logger.info(job.to_dict())
    except Exception as e:
        logger.error(f"Error creating valid job: {str(e)}")

    # Test invalid job data
    try:
        job = JobData(
            title="",  # Empty title should raise error
            company="Home Instead",
            location="Boston, MA",
            description="Test description",
            posted_date="2024-01-01",
            url="https://example.com/job",
            source="homeinstead",
            scraped_date=datetime.now().isoformat()
        )
        logger.error("Should have raised ValueError for empty title")
    except ValueError as e:
        logger.info(f"Correctly caught error: {str(e)}")

def test_location_parsing():
    """Test location parsing and validation."""
    scraper = SeleniumScraper(headless=True)
    
    test_cases = [
        "Boston, MA",
        "Multiple Locations",
        "New York City",
        "CA",
        "Remote",
        "need help",  # Should be invalid
        "click here",  # Should be invalid
        "HR department"  # Should be invalid
    ]
    
    logger.info("Testing location parsing...")
    for location in test_cases:
        is_valid = scraper._is_valid_location(location)
        logger.info(f"Location: {location}")
        logger.info(f"Is valid: {is_valid}")
        logger.info("---")

def test_deduplication():
    """Test job deduplication logic."""
    scraper = SeleniumScraper(headless=True)
    
    # Create some test jobs
    test_jobs = [
        {
            "title": "Care Professional",
            "company": "Home Instead",
            "location": "Boston, MA",
            "description": "Test description 1"
        },
        {
            "title": "Care Professional",  # Duplicate
            "company": "Home Instead",
            "location": "Boston, MA",
            "description": "Test description 1"
        },
        {
            "title": "Care Professional",
            "company": "Home Instead",
            "location": "New York, NY",  # Different location
            "description": "Test description 2"
        }
    ]
    
    logger.info("Testing deduplication...")
    for job in test_jobs:
        is_duplicate = scraper._is_duplicate(job)
        logger.info(f"Job: {job['title']} in {job['location']}")
        logger.info(f"Is duplicate: {is_duplicate}")
        logger.info("---")

def test_site_detection():
    """Test job board site type detection."""
    scraper = SeleniumScraper(headless=True)
    
    test_cases = [
        ("https://www.homeinstead.com/careers", "<html>homeinstead careers</html>"),
        ("https://jobs.icims.com/jobs", "<html>icims job board</html>"),
        ("https://www.apploi.com/jobs", "<html>apploi platform</html>"),
        ("https://www.example.com/jobs", "<html>generic job board</html>")
    ]
    
    logger.info("Testing site type detection...")
    for url, html in test_cases:
        site_type = scraper._detect_site_type(url, html)
        logger.info(f"URL: {url}")
        logger.info(f"Detected site type: {site_type}")
        logger.info("---")

def main():
    """Run all tests."""
    try:
        logger.info("Starting tests...")
        
        # Run individual tests
        test_salary_parsing()
        test_job_data_validation()
        test_location_parsing()
        test_deduplication()
        test_site_detection()
        
        logger.info("All tests completed!")
        
    except Exception as e:
        logger.error(f"Error during testing: {str(e)}")
    finally:
        # Clean up any resources
        pass

if __name__ == "__main__":
    main() 