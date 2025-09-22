# Connecticut Healthcare Job Scraper Development Plan

## Overview
Based on analysis of `ct_only.csv`, we need to develop scrapers for 70+ Connecticut healthcare sites across 11 different job board platforms.

## Job Board Platform Analysis

### 1. **Apploi** (27 sites) - HIGH PRIORITY
- **Most common platform** in CT healthcare
- **Sites**: RydersHealth, New Haven Center, Southport Center, Torrington Center, Waterbury Center, West Haven Center, Atlas Healthcare, iCare Health Network, etc.
- **Characteristics**: 
  - Job cards with consistent structure
  - Location information in job listings
  - Apply buttons that redirect to Apploi
  - Multi-location feeds with location parsing needed
- **Scraper Status**: ✅ `apploi_scraper.py` created
- **Next Steps**: Test and refine selectors

### 2. **Custom** (7 sites) - MEDIUM PRIORITY
- **Sites**: Genesis, Home Instead, Grimes Center, Covenant Living, Nathaniel Witherell, etc.
- **Characteristics**: 
  - Various custom implementations
  - Different HTML structures
  - May require individual site analysis
- **Scraper Status**: 🔄 Needs development
- **Next Steps**: Create flexible custom scraper

### 3. **Paycom** (3 sites) - MEDIUM PRIORITY
- **Sites**: Elim Park Baptist Home, Mary Wade Home, Bristol Health
- **Characteristics**: 
  - ADP-based system
  - Standardized structure
  - Consistent selectors
- **Scraper Status**: 🔄 Needs development
- **Next Steps**: Create Paycom-specific scraper

### 4. **ADP** (3 sites) - MEDIUM PRIORITY
- **Sites**: Seabury Health Center, Duncaster Retirement Community, The Retreat Assisted Living
- **Characteristics**: 
  - Workforcenow platform
  - Enterprise ATS system
  - Robust structure
- **Scraper Status**: 🔄 Needs development
- **Next Steps**: Create ADP-specific scraper

### 5. **iCIMS** (2 sites) - LOW PRIORITY
- **Sites**: National Healthcare Associates, Whitney Rehabilitation Care Center
- **Characteristics**: 
  - Enterprise ATS
  - Standardized structure
  - Well-documented selectors
- **Scraper Status**: 🔄 Needs development
- **Next Steps**: Create iCIMS-specific scraper

### 6. **Hireology** (2 sites) - LOW PRIORITY
- **Sites**: EPOCH, The Arbors & The Ivy
- **Characteristics**: 
  - Recruitment platform
  - Consistent structure
  - Modern interface
- **Scraper Status**: 🔄 Needs development
- **Next Steps**: Create Hireology-specific scraper

### 7. **Dayforce** (2 sites) - LOW PRIORITY
- **Sites**: Benchmark, Oak Hill
- **Characteristics**: 
  - Ceridian platform
  - Enterprise HR system
  - Standardized structure
- **Scraper Status**: 🔄 Needs development
- **Next Steps**: Create Dayforce-specific scraper

### 8. **Single Sites** (1 site each) - LOW PRIORITY
- **UltiPro**: Harbor Chase
- **Paylocity**: Skyview Rehab and Nursing
- **Oracle**: Brookdale
- **ApplicantPool**: Mozaic Senior Services

## Development Priority Matrix

### Phase 1: High Impact (Complete by Week 1)
1. **Apploi Scraper** ✅ - 27 sites (38% of total)
   - Test and refine existing scraper
   - Handle multi-location parsing
   - Add error handling and retry logic

### Phase 2: Medium Impact (Complete by Week 2)
2. **Custom Scraper** - 7 sites (10% of total)
   - Create flexible scraper for custom sites
   - Individual site analysis and configuration
   - Fallback mechanisms

3. **Paycom Scraper** - 3 sites (4% of total)
   - Standardized ADP-based system
   - Consistent selectors and structure

4. **ADP Scraper** - 3 sites (4% of total)
   - Workforcenow platform
   - Enterprise-grade reliability

### Phase 3: Low Impact (Complete by Week 3)
5. **iCIMS Scraper** - 2 sites (3% of total)
6. **Hireology Scraper** - 2 sites (3% of total)
7. **Dayforce Scraper** - 2 sites (3% of total)
8. **Individual Platform Scrapers** - 4 sites (6% of total)

## Technical Requirements

### Core Scraper Features
- **Multi-platform support** with platform detection
- **Resilient error handling** with retry logic
- **Rate limiting** to avoid being blocked
- **Duplicate detection** and removal
- **Data validation** and cleaning
- **Comprehensive logging** and monitoring

### Data Extraction Requirements
- **Job Title**: Required field
- **Company**: From site configuration
- **Location**: Parse from job listing or use fixed location
- **Salary**: Extract when available
- **Job Type**: Full-time, part-time, per diem, etc.
- **Description**: Extract job details when available
- **Apply URL**: Direct application link
- **Source Site**: Track origin
- **Job Board Type**: Platform identification

### Output Formats
- **JSON**: Primary format for data processing
- **CSV**: For analysis and reporting
- **Database**: For live data integration

## Implementation Strategy

### 1. Platform-Specific Scrapers
Create individual scrapers for each major platform:
- `apploi_scraper.py` ✅
- `paycom_scraper.py`
- `adp_scraper.py`
- `icims_scraper.py`
- `hireology_scraper.py`
- `dayforce_scraper.py`
- `custom_scraper.py`

### 2. Unified Orchestrator
Create a main orchestrator that:
- Loads site configurations from CSV
- Routes to appropriate platform scraper
- Handles error recovery and retries
- Manages data aggregation and deduplication
- Generates comprehensive reports

### 3. Testing Framework
- **Site Structure Analysis**: `test_ct_sites.py` ✅
- **Platform-Specific Testing**: Test each scraper individually
- **Integration Testing**: Test full pipeline
- **Data Quality Validation**: Verify extracted data

## Current Status

### ✅ Completed
- **CT Site Analysis**: Analyzed 70+ sites and categorized by platform
- **Apploi Scraper**: Created specialized scraper for 27 Apploi sites
- **Site Testing Framework**: Created analysis script to examine site structures
- **Comprehensive Scraper**: Created base scraper with platform detection

### 🔄 In Progress
- **Site Structure Testing**: Running analysis on sample sites
- **Apploi Scraper Testing**: Validating selectors and functionality

### 📋 Next Steps
1. **Test Apploi Scraper** on sample sites
2. **Create Paycom Scraper** for 3 sites
3. **Create Custom Scraper** for 7 sites
4. **Create ADP Scraper** for 3 sites
5. **Build Unified Orchestrator** for all platforms
6. **Implement Data Quality Validation**
7. **Create Production Pipeline**

## Success Metrics

### Coverage
- **Target**: 90% of CT healthcare sites (63+ sites)
- **Current**: 0% (planning phase)
- **Phase 1 Goal**: 38% (27 Apploi sites)

### Data Quality
- **Job Title**: 100% extraction rate
- **Location**: 95% accuracy
- **Salary**: 60% extraction rate (when available)
- **Apply URL**: 80% extraction rate

### Performance
- **Scraping Speed**: 5-10 sites per hour
- **Error Rate**: <5% per site
- **Data Completeness**: >90% for required fields

## Risk Mitigation

### Technical Risks
- **Site Structure Changes**: Implement flexible selectors
- **Rate Limiting**: Add delays and rotation
- **Anti-Bot Measures**: Use undetected-chromedriver
- **Data Quality**: Implement validation and cleaning

### Operational Risks
- **Site Availability**: Implement retry logic
- **Data Volume**: Implement pagination handling
- **Maintenance**: Create modular, maintainable code

## Timeline

### Week 1: Foundation
- ✅ Complete site analysis
- ✅ Create Apploi scraper
- 🔄 Test and refine Apploi scraper
- 📋 Create Paycom scraper

### Week 2: Core Platforms
- 📋 Complete Paycom scraper
- 📋 Create Custom scraper
- 📋 Create ADP scraper
- 📋 Begin unified orchestrator

### Week 3: Integration
- 📋 Complete remaining platform scrapers
- 📋 Finish unified orchestrator
- 📋 Implement data validation
- 📋 Create production pipeline

### Week 4: Testing & Deployment
- 📋 Comprehensive testing
- 📋 Performance optimization
- 📋 Documentation
- 📋 Production deployment

## Conclusion

This development plan provides a structured approach to building comprehensive CT healthcare job scrapers. By focusing on the most common platforms first (Apploi - 38% of sites), we can achieve significant coverage quickly while building a foundation for the remaining platforms.

The modular approach allows for independent development and testing of each platform scraper, reducing risk and enabling parallel development. The unified orchestrator will provide a single interface for managing all scrapers and generating comprehensive reports. 