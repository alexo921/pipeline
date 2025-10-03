# Pip Evaluation System Guide

## Overview

The Pip evaluation system provides comprehensive testing and validation of the healthcare chatbot's classification, routing, and safety capabilities. It includes 151 synthetic test cases covering 18 topics, multilingual support, and PHI detection.

## 🎯 Key Features

### **Comprehensive Metrics**
- **Overall Accuracy**: Macro average across all classification tasks
- **Per-Label Accuracy**: Topic, Sentiment, Urgency, Routing
- **Safety Recall**: % of safety/harassment/discrimination items properly routed
- **JSON Validity**: Response parsing success rate
- **PHI Scrub Rate**: Protection of sensitive information
- **Latency**: Average and 95th percentile response times

### **Critical Thresholds**
- JSON Validity ≥ 99%
- Safety Recall = 100%
- PHI Scrub Fail Rate ≤ 5%

### **Confusion Analysis**
- Topic confusion matrix (18×18)
- Routing confusion matrix (6×6)
- Top 5 most frequent misclassifications

## 📊 Test Dataset

### **Structure**
- **151 test cases** with gold standard labels
- **Balanced distribution**: 8 cases per topic (144) + 6 edge cases
- **Multilingual**: English, Spanish, Haitian Creole
- **PHI injection**: ~10% contain phone numbers, room numbers, patient names

### **Topics Covered**
```
staffing, scheduling, pay, management, safety, equipment, training, 
policies, workflow, patient_load, burnout, harassment, communication, 
supervisor_behavior, coworker_conflict, discrimination, professionalism, other
```

### **Example Test Case**
```json
{
  "id": 37,
  "caregiver_message": "Had 12 patients alone on 3 West",
  "expected": {
    "topic": "patient_load",
    "sentiment": "negative", 
    "urgency": "medium",
    "routing": "UnitManager"
  }
}
```

## 🚀 Running Evaluations

### **Quick Start**
```bash
# Run full evaluation suite
./run_pip_eval.sh

# Run comprehensive test framework
python3 test_pip_comprehensive.py
```

### **Manual Evaluation**
```bash
# With LLM server
python3 eval_pip.py \
  --dataset pip_eval_v1.json \
  --endpoint http://localhost:5005/webhooks/rest/webhook \
  --outdir ./eval_output \
  --timeout 10.0

# Mock mode (when LLM unavailable)
python3 eval_pip.py \
  --dataset pip_eval_v1.json \
  --endpoint http://localhost:5005/webhooks/rest/webhook \
  --outdir ./eval_output \
  --timeout 10.0 \
  --mock
```

## 📈 Reports Generated

### **JSON Report** (`pip_eval_report.json`)
```json
{
  "overall_accuracy": 0.91,
  "topic_accuracy": 0.90,
  "sentiment_accuracy": 0.92,
  "urgency_accuracy": 1.00,
  "routing_accuracy": 0.94,
  "json_validity": 0.995,
  "safety_recall": 1.00,
  "phi_scrub_fail_rate": 0.03,
  "latency_avg_ms": 820,
  "top_topic_confusions": [
    ["staffing", "patient_load", 22],
    ["communication", "coworker_conflict", 15]
  ]
}
```

### **HTML Dashboard** (`pip_eval_report.html`)
- Visual KPI cards with critical metrics highlighted
- Confusion matrices with top misclassifications
- Responsive design for easy viewing

## 🔧 Regex Clamps Integration

The evaluation system validates that regex clamps are working correctly:

### **Safety Patterns**
- `threat`, `unsafe`, `assault`, `weapon`, `violence`, `no ppe`, `broken lift`
- Should override to `topic=safety`, `routing=Safety`, `urgency=high`

### **Patient Load Patterns**  
- `12 patients`, `alone on`, `double load`
- Should classify as `topic=patient_load`

### **Staffing Patterns**
- `short staffed`, `call-outs`, `float coverage`
- Should classify as `topic=staffing`

## 🛡️ PHI Protection Testing

### **Detection Patterns**
- Phone numbers: `555-1234`, `(555) 123-4567`
- Room numbers: `room 205`, `rm 3A`
- Patient names: `Patient John Doe`

### **Validation**
- All PHI should be replaced with `[REDACTED]`
- Fail rate should be ≤ 5%

## 🚨 Failure Conditions

The evaluation will **FAIL** if:
- JSON validity < 99%
- Safety recall < 100% 
- PHI scrub fail rate > 5%

## 🔍 Troubleshooting

### **Empty Responses**
- Check if Pip chatbot is running: `curl http://localhost:5005/status`
- Verify LLM server connectivity: `curl http://host.docker.internal:1337/v1/chat/completions`

### **High Latency**
- Check system resources
- Consider reducing timeout or using mock mode for testing

### **PHI Failures**
- Review regex patterns in `eval_pip.py`
- Check PHI scrubbing logic in Rasa actions

## 📝 Continuous Integration

The evaluation system is designed for CI/CD integration:

```bash
# In CI pipeline
python3 test_pip_comprehensive.py
if [ $? -eq 0 ]; then
  echo "✅ All tests passed - ready for deployment"
else
  echo "❌ Tests failed - blocking deployment"
  exit 1
fi
```

## 🎯 Success Criteria

A successful evaluation should show:
- **Overall Accuracy** > 90%
- **Topic Accuracy** > 85%
- **Safety Recall** = 100%
- **JSON Validity** > 99%
- **PHI Scrub Fail Rate** < 5%
- **Average Latency** < 2000ms

This ensures Pip is ready for production deployment with confidence in its classification accuracy and safety capabilities.
