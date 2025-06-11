import pandas as pd
import json
import time
import random
import logging
import psycopg2
from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path
from urllib.parse import urlparse
import requests
from fake_useragent import UserAgent
from ratelimit import limits, sleep_and_retry
from tenacity import retry, stop_after_attempt, wait_exponential
import hashlib
import re
from concurrent.futures import ThreadPoolExecutor
import yaml
from bs4 import BeautifulSoup

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('job_processor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class JobDataProcessor:
    def __init__(self, config_path: str):
        self.config = self._load_config(config_path)
        self.db_connection = self._setup_database()
        self.user_agent = UserAgent()
        self.processed_jobs = set()
        
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from YAML file"""
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)

    def _setup_database(self) -> psycopg2.extensions.connection:
        """Setup PostgreSQL connection"""
        return psycopg2.connect(
            dbname=self.config['database']['name'],
            user=self.config['database']['user'],
            password=self.config['database']['password'],
            host=self.config['database']['host'],
            port=self.config['database']['port']
        )

class CSVParser:
    def __init__(self, config: dict):
        self.config = config
        self.required_columns = config.get('csv', {}).get('required_columns', [])
        self.validation_rules = config.get('csv', {}).get('validation_rules', {})
        self.source_configs = config['sources']

    def parse_csv(self, file_path: str) -> pd.DataFrame:
        """Parse CSV file and validate its contents"""
        try:
            df = pd.read_csv(file_path)
            self._validate_columns(df)
            self._validate_data_format(df)
            return df
        except Exception as e:
            logger.error(f"Error parsing CSV file {file_path}: {str(e)}")
            raise

    def _validate_columns(self, df: pd.DataFrame):
        """Validate that required columns are present"""
        missing_columns = set(self.required_columns) - set(df.columns)
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")

    def _validate_data_format(self, df: pd.DataFrame):
        """Validate data format according to rules"""
        for column, rules in self.validation_rules.items():
            if column in df.columns:
                self._apply_validation_rules(df[column], rules)

    def _apply_validation_rules(self, series: pd.Series, rules: Dict[str, Any]):
        """Apply validation rules to a pandas Series"""
        for rule, value in rules.items():
            if rule == 'not_null' and value:
                if series.isnull().any():
                    raise ValueError(f"Column {series.name} contains null values")
            
            elif rule == 'unique' and value:
                if not series.is_unique:
                    raise ValueError(f"Column {series.name} contains duplicate values")
            
            elif rule == 'max_length':
                if series.astype(str).str.len().max() > value:
                    raise ValueError(f"Column {series.name} contains values exceeding max length of {value}")
            
            elif rule == 'pattern':
                invalid_values = series[~series.astype(str).str.match(value)]
                if not invalid_values.empty:
                    raise ValueError(f"Column {series.name} contains values not matching pattern {value}")
            
            elif rule == 'allowed_values':
                invalid_values = series[~series.isin(value)]
                if not invalid_values.empty:
                    raise ValueError(f"Column {series.name} contains values not in allowed list: {invalid_values.unique()}")

class ScraperEngine:
    def __init__(self, config: dict):
        self.config = config
        self.user_agent = UserAgent()
        self.session = requests.Session()

    def _determine_source_type(self, url: str) -> str:
        """Determine the job board source type from the URL."""
        parsed_url = urlparse(url)
        if "mycnajobs.com" in parsed_url.netloc:
            return "mycnajobs"
        raise ValueError(f"Unsupported job board URL: {url}")

    def _get_parser(self, source_type: str):
        """Get the appropriate parser function for the source type."""
        parsers = {
            "mycnajobs": self._parse_mycnajobs
        }
        if source_type not in parsers:
            raise ValueError(f"No parser available for source type: {source_type}")
        return parsers[source_type]

    def _parse_mycnajobs(self, response: requests.Response) -> Dict[str, Any]:
        """Parse myCNAjobs response and extract job data."""
        try:
            soup = BeautifulSoup(response.text, 'html.parser')
            jobs_data = []
            
            # Find all job listings
            job_listings = soup.find_all('div', class_='job-listing')
            
            for job in job_listings:
                job_data = {
                    'title': self._safe_extract(job.find('h2', class_='job-title')),
                    'company': self._safe_extract(job.find('span', class_='company-name')),
                    'location': self._safe_extract(job.find('span', class_='location')),
                    'description': self._safe_extract(job.find('div', class_='description')),
                    'posted_date': self._safe_extract(job.find('span', class_='posted-date')),
                    'url': self._extract_job_url(job),
                    'source': 'mycnajobs',
                    'scraped_date': datetime.now().isoformat()
                }
                jobs_data.append(job_data)
            
            return {
                'jobs': jobs_data,
                'total_found': len(jobs_data),
                'source_url': response.url
            }
        except Exception as e:
            logger.error(f"Error parsing myCNAjobs response: {str(e)}")
            raise

    def _safe_extract(self, element) -> str:
        """Safely extract text from a BeautifulSoup element."""
        if element and element.text:
            return element.text.strip()
        return ""

    def _extract_job_url(self, job_element) -> str:
        """Extract job URL from the job listing element."""
        link = job_element.find('a', href=True)
        if link and link.get('href'):
            url = link['href']
            if not url.startswith('http'):
                url = f"https://www.mycnajobs.com{url}"
            return url
        return ""

    @sleep_and_retry
    @limits(calls=10, period=60)  # Rate limiting: 10 calls per minute
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    def scrape_url(self, url: str) -> Dict[str, Any]:
        """Scrape URL with rate limiting and retry logic"""
        headers = {'User-Agent': self.user_agent.random}
        try:
            response = self.session.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            return self._parse_response(response)
        except requests.exceptions.RequestException as e:
            logger.error(f"Error scraping {url}: {str(e)}")
            raise

    def _parse_response(self, response: requests.Response) -> Dict[str, Any]:
        """Parse response based on source type"""
        source_type = self._determine_source_type(response.url)
        parser = self._get_parser(source_type)
        return parser(response)

class DataProcessor:
    def __init__(self, config: dict):
        self.config = config
        self.role_classifier = RoleClassifier()
        self.location_parser = LocationParser()
        self.deduplicator = Deduplicator()

    def process_job(self, job_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process job data with classification and deduplication"""
        processed_data = {
            'job_id': self._generate_job_id(job_data),
            'role': self.role_classifier.classify(job_data),
            'location': self.location_parser.parse(job_data['location']),
            'raw_data': job_data,
            'processed_at': datetime.now().isoformat()
        }
        
        if not self.deduplicator.is_duplicate(processed_data):
            return processed_data
        return None

    def _generate_job_id(self, job_data: Dict[str, Any]) -> str:
        """Generate unique job ID"""
        unique_string = f"{job_data['title']}{job_data['company']}{job_data['location']}"
        return hashlib.sha256(unique_string.encode()).hexdigest()

class RoleClassifier:
    def __init__(self):
        self.role_patterns = self._load_role_patterns()

    def classify(self, job_data: Dict[str, Any]) -> str:
        """Classify job role based on title and description"""
        title = job_data['title'].lower()
        description = job_data['description'].lower()
        
        for role, patterns in self.role_patterns.items():
            if any(pattern in title or pattern in description for pattern in patterns):
                return role
        return 'Other'

class LocationParser:
    def __init__(self):
        self._load_location_patterns()
        
    def _load_location_patterns(self):
        """Load location parsing patterns and rules"""
        self.remote_keywords = {'remote', 'virtual', 'work from home', 'wfh', 'telecommute'}
        self.state_abbrev = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
            'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
            'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
            'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
            'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
            'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
            'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
            'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
            'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
            'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
            'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
        }
        # Create reverse mapping
        self.state_names = {v: k for k, v in self.state_abbrev.items()}

    def _extract_city(self, location_str: str) -> str:
        """Extract city from location string."""
        if not location_str:
            return ""
            
        # Remove state and zip code if present
        location_parts = location_str.split(',')
        if location_parts:
            city = location_parts[0].strip()
            # Remove any ZIP code that might be in the city part
            city = re.sub(r'\d{5}(?:-\d{4})?', '', city).strip()
            return city
        return ""

    def _extract_state(self, location_str: str) -> str:
        """Extract state from location string."""
        if not location_str:
            return ""
            
        # Try to find state abbreviation
        state_pattern = r'(?:^|\s)([A-Z]{2})(?:\s|$|\d)'
        match = re.search(state_pattern, location_str.upper())
        if match and match.group(1) in self.state_abbrev:
            return match.group(1)
            
        # Try to find full state name
        for state_name in self.state_names:
            if state_name.upper() in location_str.upper():
                return self.state_names[state_name]
                
        return ""

    def _extract_country(self, location_str: str) -> str:
        """Extract country from location string."""
        # For now, assuming US-only jobs
        return "USA"

    def _is_remote(self, location_str: str) -> bool:
        """Determine if the position is remote."""
        if not location_str:
            return False
            
        location_lower = location_str.lower()
        return any(keyword in location_lower for keyword in self.remote_keywords)

    def parse(self, location_str: str) -> Dict[str, Any]:
        """Parse location string into structured format"""
        return {
            'city': self._extract_city(location_str),
            'state': self._extract_state(location_str),
            'country': self._extract_country(location_str),
            'is_remote': self._is_remote(location_str)
        }

class Deduplicator:
    def __init__(self):
        self.processed_jobs = set()

    def is_duplicate(self, job_data: Dict[str, Any]) -> bool:
        """Check if job is duplicate"""
        job_id = job_data['job_id']
        if job_id in self.processed_jobs:
            return True
        self.processed_jobs.add(job_id)
        return False

class DatabaseManager:
    def __init__(self, config: dict):
        self.config = config
        self.connection = self._setup_connection()

    def store_job(self, job_data: Dict[str, Any]):
        """Store job data in PostgreSQL"""
        try:
            with self.connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO jobs (
                        job_id, title, company, location, role,
                        description, raw_data, processed_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    job_data['job_id'],
                    job_data['title'],
                    job_data['company'],
                    json.dumps(job_data['location']),
                    job_data['role'],
                    job_data['description'],
                    json.dumps(job_data['raw_data']),
                    job_data['processed_at']
                ))
            self.connection.commit()
        except Exception as e:
            logger.error(f"Error storing job data: {str(e)}")
            self.connection.rollback()
            raise

def main():
    # Load configuration
    config_path = 'config.yaml'
    processor = JobDataProcessor(config_path)
    
    # Process CSV files
    csv_parser = CSVParser(processor.config)
    scraper = ScraperEngine(processor.config)
    data_processor = DataProcessor(processor.config)
    db_manager = DatabaseManager(processor.config)
    
    # Process each source
    for source in processor.config['sources']:
        try:
            # Parse CSV
            df = csv_parser.parse_csv(source['file_path'])
            
            # Process each job
            for _, row in df.iterrows():
                # Scrape additional data if needed
                if source['needs_scraping']:
                    scraped_data = scraper.scrape_url(row['url'])
                    job_data = {**row.to_dict(), **scraped_data}
                else:
                    job_data = row.to_dict()
                
                # Process and store job data
                processed_data = data_processor.process_job(job_data)
                if processed_data:
                    db_manager.store_job(processed_data)
                
        except Exception as e:
            logger.error(f"Error processing source {source['name']}: {str(e)}")
            continue

if __name__ == "__main__":
    main()