# RetailConnect - ML Model Take Home Test

## Project Overview

**RetailConnect** is building an intelligent job classification system for the retail industry. We need a machine learning engineer to develop models that can automatically categorize retail job postings into meaningful groups to improve candidate matching and hiring efficiency.

## Technical Requirements

### Tech Stack
- **Language**: Python 3.8+
- **ML Libraries**: scikit-learn, pandas, numpy
- **Optional**: TensorFlow/PyTorch for advanced models
- **Data**: JSON format for input/output

### Business Context
Retail hiring has unique challenges:
- High volume of job postings across different store types
- Need for quick categorization to match candidates
- Seasonal hiring patterns and varying employment types
- Store-specific requirements and local talent needs

## Take Home Assignment

### Core Task: Retail Job Classification System

Build a machine learning system that automatically classifies retail job postings into structured categories.

**Requirements:**

1. **Job Classification Models**: Train models to predict:
   - **Store Type**: Department Store, Specialty Retail, Grocery, Electronics, Fashion, Home & Garden, etc.
   - **Employment Type**: Full-Time, Part-Time, Seasonal, Temporary, Internship
   - **Shift**: Morning, Afternoon, Evening, Night, Weekend, Flexible

2. **Data Processing Pipeline**:
   - Clean and normalize retail job descriptions
   - Extract key features (salary, requirements, location)
   - Generate structured tags for each job
   - Handle retail-specific terminology and abbreviations

3. **Model Performance**: Achieve minimum accuracy targets:
   - Store Type: >85% accuracy
   - Employment Type: >80% accuracy
   - Shift: >90% accuracy

## Deliverables

### Required Files

1. **`retail_job_classifier.py`** - Main classification script
2. **`data_processor.py`** - Data cleaning and feature extraction
3. **`retail_jobs_dataset.json`** - Training dataset (75-100 jobs)
4. **`model_evaluation.py`** - Performance evaluation script
5. **`requirements.txt`** - Python dependencies
6. **`README.md`** - Documentation and usage instructions

### Optional Files

- `advanced_models.py` - Deep learning implementations
- `feature_engineering.py` - Advanced feature extraction
- `model_interpretation.py` - SHAP analysis or feature importance
- `data_augmentation.py` - Techniques to improve model performance

## Sample Data Structure

```json
{
  "id": "retail_job_001",
  "title": "Sales Associate - Electronics Department",
  "company": "TechMart",
  "description": "Join our electronics team! Help customers find the perfect gadgets and electronics. Previous retail experience preferred. Must be available evenings and weekends.",
  "location": "Miami, FL",
  "salary": "$15-18/hour",
  "requirements": [
    "High school diploma",
    "Customer service experience",
    "Basic electronics knowledge",
    "Weekend availability"
  ],
  "expected_output": {
    "store_type": "Electronics Retail",
    "employment_type": "Part-Time",
    "shift": "Evening"
  }
}
```

## Evaluation Criteria

### Model Performance (50%)
- Accuracy across all three classification tasks
- Consistent performance across different job types
- Robust handling of edge cases and variations

### Code Quality (30%)
- Clean, well-organized Python code
- Proper error handling and validation
- Efficient data processing and model training

### Feature Engineering (20%)
- Creative use of job text and metadata
- Appropriate preprocessing for retail domain
- Effective handling of categorical and text features

## Getting Started

### Quick Setup

1. **Run the setup script** (recommended):
   ```bash
   python3 setup.py
   ```

2. **Manual setup** (alternative):
   ```bash
   # Create virtual environment
   python3 -m venv retail_ml_env
   source retail_ml_env/bin/activate  # On Windows: retail_ml_env\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

### Development Workflow

1. **Implement** each component systematically:
   - Start with `data_processor.py`
   - Then `retail_job_classifier.py`
   - Finally `model_evaluation.py`

2. **Test** your implementation:
   ```bash
   python3 example_usage.py
   ```

3. **Document** your approach and decisions

### Testing Your Setup

Before starting development, verify your environment works:

```bash
# Test basic functionality
python3 test_syntax_only.py

# Test with dependencies (after setup)
python3 test_basic_functionality.py
```

## Time Expectation

- **Total Time**: 4-6 hours
- **Data Generation**: 1 hour
- **Model Development**: 2-3 hours
- **Evaluation & Optimization**: 1-2 hours

## Bonus Points

- Implement ensemble methods for better performance
- Add confidence scores for predictions
- Create visualization of model performance
- Handle multi-label classification scenarios
- Implement cross-validation strategies
- Add model interpretability features

## Sample Implementation Structure

```python
# retail_job_classifier.py
class RetailJobClassifier:
    def __init__(self):
        self.store_type_model = None
        self.employment_type_model = None
        self.shift_model = None
    
    def preprocess_data(self, jobs_data):
        # Clean and prepare job data
        pass
    
    def extract_features(self, job_text):
        # Extract relevant features
        pass
    
    def train_models(self, training_data):
        # Train classification models
        pass
    
    def predict(self, job_data):
        # Make predictions for new jobs
        pass
    
    def evaluate_performance(self, test_data):
        # Evaluate model accuracy
        pass
```

## What We're Looking For

We want to see how you approach:
- Building production-ready ML models
- Feature engineering for text classification
- Handling multi-class classification problems
- Optimizing model performance
- Writing clean, maintainable ML code
- Understanding retail domain requirements

This is your opportunity to showcase your machine learning skills and demonstrate how you'd contribute to building intelligent retail hiring systems.
