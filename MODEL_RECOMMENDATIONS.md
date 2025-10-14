# Model Recommendations for Your Hardware

## 💻 Your System Specs
- **RAM**: 7.6GB (3.4GB available after services)
- **CPU**: 2-core Intel Xeon @ 2.50GHz
- **Disk**: 26GB free
- **GPU**: None

---

## ✅ Models You CAN Run (CPU-only)

### 1. **Llama 3.1 8B Q5_K_M** ⭐ Currently Running
- **Size**: 5.4GB
- **RAM needed**: ~6GB
- **Status**: ✅ Fits perfectly
- **Accuracy**: 70.8% (proven ceiling)
- **Speed**: ~500ms per response
- **Recommendation**: Already optimal for 8B

### 2. **Llama 3.2 3B Instruct Q8**
- **Size**: ~3.5GB
- **RAM needed**: ~4GB
- **Status**: ✅ Would run faster
- **Expected accuracy**: 62-68% (WORSE than 8B)
- **Speed**: ~200ms per response
- **Recommendation**: ❌ Don't downgrade

### 3. **Phi-3.5 Mini (3.8B)**
- **Size**: ~2.3GB (Q4)
- **RAM needed**: ~3GB
- **Status**: ✅ Very fast
- **Expected accuracy**: 65-72%
- **Speed**: ~150ms per response
- **Recommendation**: 🤔 Worth trying - good at structured tasks

### 4. **Qwen 2.5 7B Instruct Q4**
- **Size**: ~4.4GB
- **RAM needed**: ~5GB
- **Status**: ✅ Fits
- **Expected accuracy**: 68-74%
- **Speed**: ~450ms per response
- **Recommendation**: 🟡 Similar to current, might be slightly better

### 5. **Mistral 7B Instruct v0.3 Q5**
- **Size**: ~5GB
- **RAM needed**: ~6GB
- **Status**: ✅ Barely fits
- **Expected accuracy**: 68-73%
- **Speed**: ~500ms per response
- **Recommendation**: 🟡 Alternative, not better

---

## ❌ Models You CANNOT Run (Too Big)

### Models Requiring 16GB+ RAM
- **Llama 3.1 70B** (Q4: ~40GB RAM needed)
- **Mixtral 8x7B** (Q4: ~26GB RAM needed)
- **Llama 3.3 70B** (Q4: ~42GB RAM needed)
- **Qwen 2.5 14B** (Q8: ~16GB RAM needed)

---

## 🎯 Best Options Given Your Constraints

### Option A: Try Phi-3.5 Mini ⭐ **Quick Test**
**Why**: Specifically tuned for structured output tasks
**Size**: 2.3GB
**Expected**: 65-72% (might be better at classification)
**Effort**: 10 minutes to test

**Command**:
```bash
wget https://huggingface.co/microsoft/Phi-3.5-mini-instruct-gguf/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf
```

### Option B: API-Based Model ⭐⭐ **BEST ACCURACY**
**Why**: Cloud models are MUCH better (80-90% accuracy)
**Cost**: ~$0.10-0.50 per 1,000 eval runs
**Options**:
1. **GPT-4o-mini** ($0.15/1M tokens) - 85-90% expected
2. **Claude 3.5 Haiku** ($0.80/1M tokens) - 88-92% expected
3. **Together AI** (Llama 70B hosted) - ~$0.20/1M tokens

### Option C: Fine-Tune Current Model ⭐⭐⭐ **RECOMMENDED**
**Why**: Best cost/performance for your use case
**Cost**: $50-200 one-time
**Result**: 75-82% accuracy
**Steps**:
1. Collect 500-1000 labeled examples from your eval dataset + production
2. Fine-tune Llama 3.1 8B on Google Colab or Runpod
3. Deploy fine-tuned model (same size, same speed, better accuracy)

---

## 💡 Recommended Path Forward

### Immediate (This Week):
1. **Test Phi-3.5 Mini** (10 minutes)
   - If it hits 72%+, keep it
   - If not, stick with current

### Short-term (Next 2 Weeks):
2. **Start collecting production data**
   - User messages + correct classifications
   - Target: 500+ examples

### Medium-term (Month 1):
3. **Fine-tune Llama 3.1 8B**
   - Use collected production data
   - Expected: 75-82% accuracy
   - One-time cost, no ongoing fees

### Long-term (If needed):
4. **Evaluate API models**
   - Only if fine-tuning doesn't reach 80%
   - GPT-4o-mini likely best cost/performance

---

## 🚀 Quick Action

Want me to download and test **Phi-3.5 Mini**? It's small (2.3GB), fast, and specifically designed for structured tasks like classification. Could be a quick win!
