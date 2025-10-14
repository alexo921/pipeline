# Accuracy Improvement Recommendations

## Current Status (English-Only Model)
- **Overall Accuracy**: 68.2%
- **JSON Validity**: 100% ✅
- **Fallback Rate**: 0% ✅

### Field-by-Field Performance
| Field | Accuracy | Status | Gap to 80% |
|-------|----------|--------|------------|
| Routing | 88.7% | ✅ Excellent | N/A |
| Topic | 70.0% | ⚠️ Good | -10% |
| Urgency | 66.0% | ⚠️ Fair | -14% |
| Sentiment | 48.0% | ❌ Poor | -32% |

---

## Priority 1: Fix Sentiment (48% → 75%+)

### Root Causes
1. **LLM not following guidelines** - Temperature 0.8 may be too creative
2. **Weak pattern overrides** - Confidence threshold 0.7 too high
3. **Insufficient examples** - Only basic sentiment patterns

### Solutions

#### A. Strengthen Sentiment Override System (HIGH IMPACT)
```python
# Lower confidence threshold for sentiment overrides
confidence_threshold = 0.5  # Was 0.7

# Add more aggressive sentiment post-processing
# Apply sentiment LAST (after all other processing)
# Always override if strong indicators present
```

#### B. Reduce LLM Temperature (MEDIUM IMPACT)
```python
# Current: 0.8 (too creative)
"temperature": 0.6,  # More deterministic
```

#### C. Add More Sentiment Examples (MEDIUM IMPACT)
Add 10+ examples specifically for sentiment edge cases:
- Neutral statements with negative context
- Positive feedback with concerns
- Sarcasm/irony detection

---

## Priority 2: Reduce Topic Confusion (70% → 80%+)

### Top Confusions to Fix

#### 1. Workflow → Pay (6 cases)
**Issue**: Payment-related workflow issues classified as "pay"

**Fix**: Add specific workflow patterns
```python
(r"\b(process|paperwork|forms|documentation).*(pay|paycheck)\b", 
 {"topic": "workflow", "confidence": 0.9}),
```

#### 2. Communication → Other (6 cases)
**Issue**: Communication topics not detected

**Fix**: Enhance communication patterns
```python
(r"\b(handoff|report|updates|briefing|told|said|informed)\b",
 {"topic": "communication", "confidence": 0.8}),
```

#### 3. Coworker Conflict → Other (5 cases)
**Issue**: Peer conflicts missed

**Fix**: Add conflict indicators
```python
(r"\b(coworker|colleague|peer|teammate).*(rude|conflict|argument|disagree|tension)\b",
 {"topic": "coworker_conflict", "confidence": 0.9}),
```

#### 4. Equipment → Other (5 cases)
**Issue**: Equipment mentions not detected

**Fix**: Expand equipment patterns
```python
(r"\b(bed|wheelchair|walker|monitor|device|machine).*(broken|not working|malfunction)\b",
 {"topic": "equipment", "confidence": 0.8}),
```

---

## Priority 3: Improve Urgency (66% → 75%+)

### Issues
- Medium vs Low confusion
- Not detecting recurring issues as medium urgency

### Solutions

#### A. Add Recurrence Patterns
```python
(r"\b(again|still|yet again|once more|repeatedly)\b",
 {"urgency": "medium", "confidence": 0.9}),
```

#### B. Strengthen High Urgency Detection
```python
# Already good, but add:
(r"\b(now|immediately|urgent|asap|critical|emergency)\b",
 {"urgency": "high", "confidence": 1.0}),
```

---

## Implementation Priority

### Phase 1: Sentiment Focus (Biggest Impact)
1. ✅ Lower confidence threshold: 0.7 → 0.5
2. ✅ Reduce temperature: 0.8 → 0.6
3. ✅ Move sentiment processing to LAST step
4. ✅ Add 10 sentiment examples to prompt

**Expected**: Sentiment 48% → 65-70%

### Phase 2: Topic Improvements
1. ✅ Add workflow/pay disambiguation
2. ✅ Enhance communication patterns
3. ✅ Add coworker conflict patterns
4. ✅ Expand equipment patterns

**Expected**: Topic 70% → 75-80%

### Phase 3: Urgency Refinement
1. ✅ Add recurrence patterns
2. ✅ Strengthen high urgency detection

**Expected**: Urgency 66% → 72-75%

---

## Expected Final Results

After all improvements:
- **Overall Accuracy**: 75-78% (from 68.2%)
- **Sentiment**: 65-70% (from 48%)
- **Topic**: 75-80% (from 70%)
- **Urgency**: 72-75% (from 66%)
- **Routing**: 88-90% (maintain)

---

## Quick Win Actions (Do First)

1. **Reduce temperature to 0.6** (1 line change)
2. **Lower confidence threshold to 0.5** (1 line change)
3. **Move sentiment processing to last** (reorder 2 lines)
4. **Add 5 top confusion patterns** (10 lines)

**Time**: 15 minutes
**Expected gain**: +5-8% overall accuracy
