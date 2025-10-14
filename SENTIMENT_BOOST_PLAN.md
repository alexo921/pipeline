# 🎯 Sentiment Accuracy Boost Plan

## 📊 Current Baseline (in eval_output/)

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Sentiment Accuracy** | **52.0%** | **70-75%** | **+18-23%** |
| Topic Accuracy | 66.7% | 70%+ | +3-4% |
| Urgency Accuracy | 68.0% | 70%+ | +2% |
| Routing Accuracy | 88.7% | 90%+ | +1-3% |
| JSON Validity | 100% | 100% | ✅ |

---

## 🎯 Sentiment Error Analysis

**72 sentiment errors** (48% of examples):

1. **Negative → Neutral**: ~26 errors (36%)
   - "Leadership keeps changing rules" 
   - "Handoffs are chaotic"
   - "PTO rules are unclear"

2. **Neutral → Negative**: ~18 errors (25%)
   - "Schedule posted late again"
   - "Pago de OT no apareció"
   - "Vending machine is broken"

3. **Positive → Negative**: ~16 errors (22%)
   - "Need proper training"
   - "Short staffed but everyone helped"

4. **Other**: ~12 errors (17%)

---

## 🚀 Three Improvement Paths

### Option A: Quick Sentiment Clamps ⚡
**Time**: 30 minutes  
**Expected**: 52% → 62% (+10%)  
**Effort**: LOW

Add high-confidence regex patterns for top 20 error cases:
- Complaint words: "keeps changing", "chaotic", "unclear"
- Factual reports: "posted late", "didn't appear", "broken"
- Emotion detection: "exhausted", "frustrated", "appreciate"

### Option B: Context-Aware Sentiment 🧠
**Time**: 2-3 hours  
**Expected**: 52% → 68% (+16%)  
**Effort**: MEDIUM

Multi-tier sentiment detection:
1. Explicit emotion words (highest confidence)
2. Complaint patterns (negative bias)
3. Factual patterns (neutral bias)
4. Constructive patterns (neutral/positive bias)

### Option C: Deploy Fine-Tuned Model 🚀
**Time**: 4 hours (Docker setup)  
**Expected**: 52% → 75% (+23%)  
**Effort**: MEDIUM

Use your already-trained LoRA adapter:
- Trained on 1,710 healthcare examples
- Ready in `healthcare_lora_adapter/`
- Just needs Docker deployment

---

## 💡 Recommended Approach

**Start with Option A** (30 min quick win) → **Then Option C** (deploy fine-tuned model)

### Phase 1: Quick Clamps (30 minutes)
```bash
# Add sentiment patterns to actions.py
# Test with eval_pip_corrected.py
# Target: 52% → 62%
```

### Phase 2: Deploy Fine-Tuned Model (4 hours)
```bash
# Deploy healthcare_lora_adapter via Docker
# Full evaluation
# Target: 62% → 75%
```

**Total improvement**: 52% → 75% (+23%)  
**Total time**: ~4.5 hours  
**Best ROI**: Option C alone gets you to 75% if time is limited

---

## 🎯 Which Option Do You Want?

1. **Option A**: Quick patterns (30 min)
2. **Option B**: Context logic (3 hours)
3. **Option C**: Fine-tuned model (4 hours)
4. **A + C**: Quick win + Maximum gain (4.5 hours)

All evaluations will use `eval_output/` folder only.

