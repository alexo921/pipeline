# Training Dataset for Job Pre-training

## Overview

This document describes the training dataset created from `improved_ct_jobs_20250725_054659.json` for pre-training machine learning models with transformed features.

## Dataset Details

- **Source**: `improved_ct_jobs_20250725_054659.json` (245 total jobs)
- **Extracted**: 75 jobs (middle ground between requested 50-100)
- **Output File**: `training_jobs_20250813_144107.json`
- **Format**: JSON with transformed and cleaned job data

## Transformation Features Applied

The dataset has been processed using the same transformation logic as the frontend application:

### 1. **Tag Generation**
Each job automatically receives three structured tags:

- **Job Setting** (Purple): 
  - `Nursing Home` (default for healthcare)
  - `Assisted Living Facility`
  - `Home Care`

- **Employment Type** (Blue):
  - `Full-Time` (default)
  - `Part-Time`
  - `Per-Diem`
  - `Temp-To-Perm`
  - `Local Contract`

- **Shift** (Pink):
  - `Morning` (default for healthcare)
  - `Afternoon`
  - `Evening`
  - `Night`
  - `Overnight`
  - Specific time ranges (e.g., `7AM-3PM`, `3PM-11PM`, `11PM-7AM`)

### 2. **Data Cleaning**
- **Content Cleaning**: Removes browser warnings, security alerts, and other unwanted text
- **Salary Processing**: Extracts and validates salary information from multiple sources
- **Location Parsing**: Converts full addresses to "City, State" format
- **Title Truncation**: Limits job titles to 80 characters
- **Requirements Extraction**: Automatically extracts job requirements from descriptions

### 3. **Rich Data Fields**
- Job URLs and application information
- Date posted and scraping timestamps
- Organization details (logo, website, name)
- Geographic coordinates (latitude/longitude)
- Industry classification
- Education requirements

## Dataset Statistics

```
📊 Training Dataset Summary:
   Total jobs: 75
   Job Settings: {'Nursing Home': 75}
   Employment Types: {'Full-Time': 42, 'Per-Diem': 13, 'Part-Time': 20}
   Shifts: {'Morning': 62, '11PM-7AM': 2, '7AM-3PM': 5, '7PM-7AM': 1, '8AM-4PM': 1, 'Evening': 3, '3PM-11PM': 1}
   Jobs with salary: 10
   Jobs with requirements: 35
```

## Data Structure

Each job in the dataset contains:

```json
{
  "id": "unique_job_identifier",
  "title": "cleaned_job_title",
  "company": "parsed_company_name",
  "location": "city_state_format",
  "salary": "formatted_salary",
  "url": "application_url",
  "overview": "brief_description",
  "description": "full_job_description",
  "requirements": ["extracted_requirements"],
  "tags": [
    {
      "id": "tag_id",
      "label": "tag_label",
      "type": "tag_type"
    }
  ],
  "job_url": "original_job_url",
  "date_posted": "posting_date",
  "employment_type": "employment_category",
  "base_salary": "salary_data",
  "industry": "industry_type",
  "education_requirements": "education_data",
  "organization_logo": "company_logo_url",
  "organization_name": "company_name",
  "organization_website": "company_website",
  "address": {
    "city": "city_name",
    "state": "state_name",
    "zip_code": "postal_code",
    "street_address": "full_address",
    "latitude": "lat_coordinate",
    "longitude": "long_coordinate"
  },
  "scraped_at": "scraping_timestamp",
  "source_url": "source_website"
}
```

## Use Cases for Pre-training

### 1. **Job Classification Models**
- **Input**: Job title, description, company
- **Output**: Job setting, employment type, shift classification
- **Features**: Text embeddings, company patterns, location data

### 2. **Salary Prediction Models**
- **Input**: Job title, description, location, company, requirements
- **Output**: Salary range prediction
- **Features**: Text features, geographic features, company features

### 3. **Requirements Extraction Models**
- **Input**: Job description
- **Output**: Structured requirements list
- **Features**: Text patterns, section headers, bullet points

### 4. **Location Parsing Models**
- **Input**: Raw location strings
- **Output**: Standardized city, state format
- **Features**: Address patterns, state mappings, geographic data

### 5. **Company Classification Models**
- **Input**: Company name, description, location
- **Output**: Facility type, parent company identification
- **Features**: Company name patterns, facility keywords, location context

## Pre-training Recommendations

### 1. **Data Splitting**
- **Training**: 70% (52 jobs)
- **Validation**: 20% (15 jobs)  
- **Test**: 10% (8 jobs)

### 2. **Feature Engineering**
- **Text Features**: Use job titles, descriptions, and requirements
- **Categorical Features**: Tags, employment types, job settings
- **Numerical Features**: Salary (when available), coordinates
- **Temporal Features**: Date posted, scraping timestamps

### 3. **Model Types**
- **Classification**: For tag prediction, company classification
- **Regression**: For salary prediction
- **Sequence Models**: For requirements extraction
- **Multi-task Learning**: Combine multiple objectives

### 4. **Data Augmentation**
- **Text Variations**: Synonym replacement, sentence paraphrasing
- **Tag Variations**: Expand tag categories based on patterns
- **Geographic Expansion**: Use coordinates for regional analysis

## Quality Assurance

The dataset has been validated for:
- ✅ Consistent tag structure across all jobs
- ✅ Cleaned and normalized text content
- ✅ Proper salary formatting and validation
- ✅ Standardized location formats
- ✅ Complete rich data fields
- ✅ No duplicate or malformed entries

## Next Steps

1. **Model Development**: Use this dataset to train initial models
2. **Data Expansion**: Collect more diverse job samples
3. **Feature Refinement**: Iterate on transformation logic
4. **Validation**: Test models on real-world job data
5. **Production Integration**: Deploy models to enhance job processing

## Script Usage

To regenerate the training dataset:

```bash
cd backend/job-scraper
python3 extract_training_jobs.py
```

The script will:
- Load the source JSON file
- Extract a random sample of jobs
- Apply all transformations
- Generate comprehensive tags
- Save the cleaned dataset
- Provide statistics and summary

## Contact

For questions about the dataset or transformation logic, refer to the frontend transformation functions in `frontend/web-dashboard/app/jobs/page.tsx`.
