# Healthcare Classification Fine-Tuning Guide

## 🎯 What We Have

✅ **Dataset Created**: 1,710 labeled examples
- `healthcare_classification_dataset.jsonl` (288KB)
- `healthcare_classification_dataset.csv` (163KB)
- Balanced across 18 topics
- Includes 60+ boundary cases

✅ **Fine-tuning Script**: `finetune_healthcare_lora.py`
- Uses LoRA for efficient training
- Optimized for Llama 3.1 8B
- Focuses on sentiment + urgency + topic

---

## ⚠️ CPU Training Warning

**Your hardware**: 2-core CPU, 7.6GB RAM, no GPU

**CPU training time**: 6-12 hours (VERY SLOW)
**GPU training time**: 30-60 minutes

**Recommendation**: Use cloud GPU instead of local CPU

---

## 🚀 Option A: Google Colab (FREE, FAST) ⭐ **RECOMMENDED**

### Steps:

1. **Upload files to Google Drive**:
   - `healthcare_classification_dataset.jsonl`
   - `finetune_healthcare_lora.py`

2. **Open Google Colab**: https://colab.research.google.com

3. **Select GPU runtime**:
   - Runtime → Change runtime type → T4 GPU

4. **Run training**:
```python
!pip install transformers datasets peft accelerate bitsandbytes trl
!python finetune_healthcare_lora.py
```

5. **Download adapter** (~100MB)

6. **Convert to GGUF** and deploy

**Time**: 30-60 minutes
**Cost**: FREE

---

## 🚀 Option B: RunPod / Lambda Labs (PAID, FAST)

### RunPod Steps:

1. Go to https://runpod.io
2. Select "Community Cloud" → GPU Pod
3. Choose A4000/A5000 (~$0.40/hour)
4. Upload dataset
5. Run fine-tuning script
6. Download adapter
7. Stop pod

**Time**: 30-45 minutes
**Cost**: ~$0.30-0.50

---

## 🚀 Option C: Local CPU (SLOW, FREE)

⚠️ **NOT RECOMMENDED** - Will take 6-12 hours

If you still want to try:
```bash
cd /home/ubuntu/pipeline
python3 finetune_healthcare_lora.py
```

---

## 📦 After Fine-Tuning

### 1. Convert LoRA Adapter to GGUF

```bash
# Merge LoRA with base model
python -m llama_cpp.convert \
  --model healthcare_lora_adapter \
  --outtype q5_k_m \
  --outfile llama-3.1-8b-healthcare-q5.gguf
```

### 2. Update docker-compose.yml

```yaml
volumes:
  - /path/to/llama-3.1-8b-healthcare-q5.gguf:/app/models/model.gguf:ro
```

### 3. Test & Evaluate

```bash
docker-compose restart llm-server pip-chatbot
python3 eval_pip.py --dataset pip_eval_v1.json \
  --endpoint http://localhost:5005/webhooks/rest/webhook \
  --outdir eval_output
```

### Expected Results:
- **Overall**: 70.8% → 75-82%
- **Sentiment**: 56% → 70-75%
- **Topic**: 70.7% → 75-80%
- **Urgency**: 68% → 73-78%

---

## 💡 Quick Start (Google Colab)

1. Upload dataset to Google Drive
2. Open new Colab notebook
3. Select GPU runtime
4. Run:

```python
from google.colab import drive
drive.mount('/content/drive')

!pip install transformers datasets peft accelerate bitsandbytes trl

# Copy and paste finetune_healthcare_lora.py content
# Or upload and run:
!python finetune_healthcare_lora.py
```

**30-60 minutes later**: Download the `healthcare_lora_adapter` folder!

---

## 🎯 Why This Will Work

1. **1,710 examples** >> 64 few-shot examples in prompt
2. **Model learns patterns** instead of memorizing prompts
3. **Healthcare-specific** language and context
4. **Boundary cases** explicitly trained
5. **Sentiment/urgency focus** (biggest weaknesses)

**Expected gain**: +5-12 percentage points overall accuracy

---

## 📋 Current vs Expected

| Metric | Current | After Fine-Tune | Gain |
|--------|---------|----------------|------|
| Overall | 70.8% | 75-82% | +4-11% |
| Sentiment | 56% | 70-75% | +14-19% |
| Topic | 70.7% | 75-80% | +4-9% |
| Urgency | 68% | 73-78% | +5-10% |
| Routing | 88.7% | 90-92% | +1-3% |

The dataset is ready - just need to train it! 🚀
