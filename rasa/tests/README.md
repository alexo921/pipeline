# Pip Chatbot Testing Suite

This directory contains comprehensive tests for Pip's classification and routing system, validating the accuracy of topic classification, sentiment analysis, urgency detection, and routing decisions.

## Test Structure

### 1. Mock Response Tests (`test_pip_responses.py`)
- **Purpose**: Tests classification logic with simulated responses
- **Use Case**: Quick validation without requiring running servers
- **Coverage**: 10 core test cases with expected classifications

### 2. Integration Tests (`test_pip_integration.py`)
- **Purpose**: Tests against real Pip system with Rasa + Llama integration
- **Use Case**: End-to-end validation of the complete system
- **Requirements**: Both Rasa and Llama servers must be running

### 3. Unit Tests (`test_pip_classification.py`)
- **Purpose**: Comprehensive unittest framework tests
- **Use Case**: Detailed testing with unittest framework
- **Coverage**: Classification, safety escalation, PHI protection, JSON format validation

## Test Data

The test suite uses 50 test cases covering various scenarios:

### Core Test Cases (1-10)
```json
{
  "id": 1,
  "message": "Had a good shift today, everyone helped out",
  "expected": {
    "topic": "communication",
    "sentiment": "positive", 
    "urgency": "low",
    "routing": "UnitManager"
  }
}
```

### Test Categories
- **Positive Scenarios**: Good shifts, teamwork, professional development
- **Negative Scenarios**: Staffing issues, safety concerns, harassment
- **Neutral Scenarios**: Routine reports, policy questions
- **Safety Critical**: Threats, violence, unsafe conditions
- **PHI Protection**: Patient details, room numbers, phone numbers

## Running Tests

### Quick Mock Tests
```bash
# Run mock tests (no servers required)
python test_pip_system.py --type mock
```

### Full Integration Tests
```bash
# Start servers first
./start-pip-chatbot.sh

# Run integration tests
python test_pip_system.py --type integration
```

### Unit Tests
```bash
# Run unittest framework tests
python test_pip_system.py --type unit
```

### All Tests
```bash
# Run all test types
python test_pip_system.py --type all
```

## Test Metrics

### Classification Accuracy Targets
- **Topic Classification**: ≥80% accuracy
- **Sentiment Analysis**: ≥80% accuracy  
- **Urgency Detection**: ≥90% accuracy
- **Routing Decisions**: ≥85% accuracy
- **Overall System**: ≥80% accuracy

### Safety Escalation Validation
- Safety keywords → High urgency + Safety routing
- Harassment → High urgency + HR routing
- Equipment issues → Appropriate routing based on severity

### PHI Protection Validation
- Patient names → [REDACTED]
- Room numbers → [REDACTED]
- Phone numbers → [REDACTED]
- Medical details → [REDACTED]

## Expected JSON Output Format

```json
{
  "ack": "That shift sounds brutal 😞 logging it now",
  "summary": "Staff reported patient load issue with negative sentiment",
  "sentiment": "negative",
  "topic": "patient_load",
  "urgency": "medium",
  "routing": "UnitManager",
  "language": "en",
  "next_step": "Review staffing levels for patient safety"
}
```

## Topic Taxonomy

The system classifies messages into these topics:
- `staffing` - Understaffing, overwork
- `scheduling` - Shift changes, availability
- `pay` - Payroll, overtime issues
- `management` - Leadership concerns
- `safety` - Threats, violence, unsafe conditions
- `equipment` - Broken or malfunctioning equipment
- `training` - Professional development needs
- `policies` - Policy questions or violations
- `workflow` - Process improvements
- `patient_load` - Too many patients, workload
- `burnout` - Fatigue, stress, exhaustion
- `harassment` - Workplace harassment
- `communication` - Team communication issues
- `supervisor_behavior` - Supervisor conduct
- `coworker_conflict` - Peer conflicts
- `discrimination` - Discriminatory behavior
- `professionalism` - Professional conduct
- `other` - Uncategorized issues

## Routing Map

Based on topic classification:
- `safety` → Safety department
- `harassment | discrimination` → HR
- `pay` → Payroll
- `scheduling` → Scheduling
- `equipment | staffing | workflow | patient_load | communication | coworker_conflict` → UnitManager
- `supervisor_behavior | management | policies | training` → HR
- `burnout/other` → UnitManager

## Safety Precedence Rules

1. **High Priority Safety**: Self-harm, threats, violence, weapons → `urgency=high`, `routing=Safety`
2. **High Priority HR**: Harassment, discrimination → `urgency=high`, `routing=HR`
3. **Medium Priority**: Equipment, staffing, workflow issues → Appropriate department routing
4. **Low Priority**: Positive feedback, routine reports → `urgency=low`, `routing=UnitManager`

## Test Results Interpretation

### Accuracy Levels
- **90%+**: Excellent - System performing optimally
- **80-89%**: Good - System performing well with minor issues
- **70-79%**: Fair - System needs improvements
- **<70%**: Poor - System requires significant work

### Common Issues
- **Topic Misclassification**: Improve NLU training data
- **Sentiment Confusion**: Enhance sentiment analysis rules
- **Routing Errors**: Update routing logic
- **Safety Escalation**: Strengthen safety keyword detection
- **PHI Leakage**: Improve redaction algorithms

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```bash
# CI test command
python test_pip_system.py --type all
```

Exit codes:
- `0`: All tests passed
- `1`: One or more tests failed

## Debugging Failed Tests

1. **Check Server Status**: Ensure Rasa and Llama servers are running
2. **Review Logs**: Check server logs for errors
3. **Validate Training**: Ensure model is properly trained
4. **Test Individual Components**: Run mock tests first
5. **Check Network**: Verify server connectivity

## Contributing

When adding new test cases:

1. Add to the test_cases array in test files
2. Include expected classification results
3. Update documentation if new topics/routing added
4. Ensure tests cover edge cases
5. Validate safety escalation rules

## Maintenance

- **Weekly**: Run full test suite
- **After Updates**: Validate all classifications still work
- **New Features**: Add corresponding test cases
- **Performance**: Monitor test execution time
- **Accuracy**: Track accuracy trends over time
