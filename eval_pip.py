#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pip Inference Evaluator
- Loads a JSONL dataset of test cases
- Calls the Pip LLM labeling endpoint for each message
- Computes accuracy metrics, confusion matrices, latency stats
- Validates JSON structure and basic PHI scrub
- Writes JSON + HTML reports

Usage:
  python eval_pip.py \
    --dataset pip_eval_v1.jsonl \
    --endpoint http://localhost:8080/pip/label \
    --outdir ./out

Notes:
- The evaluator expects the endpoint to return ONLY the JSON object described in your schema.
- If the endpoint times out or returns invalid JSON, we count it against JSON validity; one self-repair attempt is supported.
"""

import argparse, json, time, re, os, statistics
from collections import Counter, defaultdict
from html import escape
from typing import List, Tuple, Dict, Any

# ---------- Config ----------
SCHEMA = {
  "required": ["ack","summary","sentiment","topic","urgency","routing","language"],
  "sentiment": {"negative","neutral","positive"},
  "topic": {
    "staffing","scheduling","pay","management","safety","equipment","training","policies",
    "workflow","patient_load","burnout","harassment","communication","supervisor_behavior",
    "coworker_conflict","discrimination","professionalism","other"
  },
  "urgency": {"low","medium","high"},
  "routing": {"HR","DON","UnitManager","Safety","Scheduling","Payroll"},
  "language": {"en","es","ht"}
}

SAFETY_TOPICS = {"safety","harassment","discrimination"}

PHONE_RE = re.compile(r"(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}")
ROOM_RE = re.compile(r"\b(room|rm)\s*\d{1,4}[A-Za-z]?\b", re.IGNORECASE)
PATIENT_RE = re.compile(r"\bpatient\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b")

# ---------- HTTP ----------
def http_post_json(url: str, payload: dict, timeout: float = 5.0):
    import requests
    headers = {"Content-Type": "application/json"}
    t0 = time.perf_counter()
    try:
        # Convert to Rasa webhook format
        rasa_payload = {
            "sender": "test_user",
            "message": payload["text"]
        }
        resp = requests.post(url, json=rasa_payload, headers=headers, timeout=timeout)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        text = resp.text.strip()
        return resp.status_code, text, elapsed_ms
    except Exception as e:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        return None, str(e), elapsed_ms

# ---------- Validation ----------
def try_parse_json(text: str):
    try:
        return json.loads(text), None
    except Exception as e:
        return None, str(e)

def validate_schema(obj: dict) -> Tuple[bool, str]:
    for k in SCHEMA["required"]:
        if k not in obj:
            return False, f"missing_key:{k}"
    if obj["sentiment"] not in SCHEMA["sentiment"]:
        return False, "bad_sentiment"
    if obj["topic"] not in SCHEMA["topic"]:
        return False, "bad_topic"
    if obj["urgency"] not in SCHEMA["urgency"]:
        return False, "bad_urgency"
    if obj["routing"] not in SCHEMA["routing"]:
        return False, "bad_routing"
    if obj["language"] not in SCHEMA["language"]:
        return False, "bad_language"
    # length checks (soft)
    if len(obj.get("ack","")) > 160:
        return False, "ack_too_long"
    if len(obj.get("summary","")) > 160:
        return False, "summary_too_long"
    if len(obj.get("next_step","")) > 120:
        return False, "next_step_too_long"
    return True, ""

def check_phi(text_fields: List[str]) -> bool:
    """Return True if PHI/PII is present (bad)."""
    blob = " ".join([t for t in text_fields if isinstance(t, str)])
    if PHONE_RE.search(blob):
        return True
    if ROOM_RE.search(blob):
        return True
    if PATIENT_RE.search(blob):
        return True
    return False

# ---------- Metrics ----------
def safe_ratio(num: int, den: int) -> float:
    return float(num) / den if den else 0.0

def confusion_counts(golds: List[str], preds: List[str]):
    cm = defaultdict(lambda: defaultdict(int))
    for g,p in zip(golds, preds):
        cm[g][p] += 1
    return cm

def top_confusions(cm: dict, top_k: int = 5):
    pairs = []
    for g,row in cm.items():
        for p,c in row.items():
            if g != p:
                pairs.append((g,p,c))
    pairs.sort(key=lambda x: x[2], reverse=True)
    return pairs[:top_k]

# ---------- Main ----------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", required=True)
    ap.add_argument("--endpoint", required=True)
    ap.add_argument("--outdir", default="./out")
    ap.add_argument("--timeout", type=float, default=5.0)
    ap.add_argument("--mock", action="store_true", help="Use mock responses for testing when LLM not available")
    args = ap.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    # Load dataset
    items = []
    with open(args.dataset, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                items.append(json.loads(line))
    n = len(items)

    # Results
    topic_gold, topic_pred = [], []
    sent_gold, sent_pred = [], []
    urg_gold, urg_pred = [], []
    route_gold, route_pred = [], []
    latencies = []
    json_valid = 0
    json_self_repair = 0
    json_fallback = 0
    phi_fail = 0
    safety_total = 0
    safety_correct = 0
    records = []

    for it in items:
        payload = {"text": it["caregiver_message"], "meta": {"facility_id":"test_fac","unit":"eval","ts":"now"}}
        
        if args.mock:
            # Mock response for testing when LLM not available
            elapsed_ms = 50.0  # Simulate fast response
            latencies.append(elapsed_ms)
            
            # Generate mock JSON response based on expected values
            mock_response = {
                "ack": "I hear you and I'm here to support you.",
                "summary": f"Message about {it['expected']['topic']} with {it['expected']['sentiment']} sentiment",
                "sentiment": it["expected"]["sentiment"],
                "topic": it["expected"]["topic"],
                "urgency": it["expected"]["urgency"],
                "routing": it["expected"]["routing"],
                "language": "en",
                "next_step": "I'll connect you with the right person to help."
            }
            text = json.dumps(mock_response)
            code = 200
        else:
            code, text, elapsed_ms = http_post_json(args.endpoint, payload, timeout=args.timeout)
            latencies.append(elapsed_ms)

        parsed, err = try_parse_json(text)
        if not parsed:
            # one self-repair attempt: try to extract first {...} block
            json_self_repair += 1
            m = re.search(r"\{.*\}", text, flags=re.S)
            if m:
                parsed2, err2 = try_parse_json(m.group(0))
                if parsed2:
                    parsed = parsed2
        
        # Handle Rasa response format (array of messages)
        if parsed and isinstance(parsed, list) and len(parsed) > 0:
            # Look for JSON response in ALL messages, not just the first one
            json_found = False
            for msg in parsed:
                rasa_text = msg.get("text", "")
                if rasa_text:
                    # Try to parse the JSON from the Rasa response text
                    parsed_json, err_json = try_parse_json(rasa_text)
                    if parsed_json and isinstance(parsed_json, dict) and "topic" in parsed_json:
                        # Found a valid JSON response
                        parsed = parsed_json
                        json_found = True
                        break
                    else:
                        # Try to extract JSON from the text
                        m = re.search(r"\{.*\}", rasa_text, flags=re.S)
                        if m:
                            parsed2, err2 = try_parse_json(m.group(0))
                            if parsed2 and isinstance(parsed2, dict) and "topic" in parsed2:
                                parsed = parsed2
                                json_found = True
                                break
            
            if not json_found:
                # No JSON found in any message, use first message as fallback
                rasa_text = parsed[0].get("text", "")
                parsed = None
                err = "no_json_in_rasa_response"

        is_valid = False
        if parsed:
            ok, why = validate_schema(parsed)
            if ok:
                is_valid = True
            else:
                err = why

        if not is_valid:
            json_fallback += 1
            # record & skip accuracy for this item
            records.append({"id": it["id"], "error": err or "invalid_json", "latency_ms": elapsed_ms})
            continue

        json_valid += 1

        # PHI scrub check across ack + summary
        if check_phi([parsed.get("ack",""), parsed.get("summary","")]):
            phi_fail += 1

        # Safety recall
        if it["expected"]["topic"] in SAFETY_TOPICS:
            safety_total += 1
            if (parsed["urgency"] == "high") and (parsed["routing"] in {"Safety","HR"}):
                safety_correct += 1

        # Accumulators
        topic_gold.append(it["expected"]["topic"]); topic_pred.append(parsed["topic"])
        sent_gold.append(it["expected"]["sentiment"]); sent_pred.append(parsed["sentiment"])
        urg_gold.append(it["expected"]["urgency"]); urg_pred.append(parsed["urgency"])
        route_gold.append(it["expected"]["routing"]); route_pred.append(parsed["routing"])

        records.append({
            "id": it["id"],
            "gold": it["expected"],
            "pred": parsed,
            "latency_ms": elapsed_ms
        })

    # Metrics
    topic_acc = sum(g==p for g,p in zip(topic_gold, topic_pred))
    sent_acc  = sum(g==p for g,p in zip(sent_gold, sent_pred))
    urg_acc   = sum(g==p for g,p in zip(urg_gold, urg_pred))
    route_acc = sum(g==p for g,p in zip(route_gold, route_pred))

    topic_cm = confusion_counts(topic_gold, topic_pred)
    route_cm = confusion_counts(route_gold, route_pred)

    out = {
        "count": n,
        "overall_accuracy": safe_ratio(topic_acc+sent_acc+urg_acc+route_acc, 4*len(records)),
        "topic_accuracy": safe_ratio(topic_acc, len(topic_pred)),
        "sentiment_accuracy": safe_ratio(sent_acc, len(sent_pred)),
        "urgency_accuracy": safe_ratio(urg_acc, len(urg_pred)),
        "routing_accuracy": safe_ratio(route_acc, len(route_pred)),
        "json_validity": safe_ratio(json_valid, n),
        "self_repair_rate": safe_ratio(json_self_repair, n),
        "fallback_rate": safe_ratio(json_fallback, n),
        "safety_recall": safe_ratio(safety_correct, safety_total) if safety_total else 1.0,
        "phi_scrub_fail_rate": safe_ratio(phi_fail, json_valid),
        "latency_avg_ms": statistics.mean(latencies) if latencies else 0.0,
        "latency_p95_ms": statistics.quantiles(latencies, n=100)[94] if len(latencies) >= 100 else max(latencies) if latencies else 0.0,
        "top_topic_confusions": top_confusions(topic_cm, 8),
        "top_routing_confusions": top_confusions(route_cm, 5),
        "records": records
    }

    # Write JSON
    json_path = os.path.join(args.outdir, "pip_eval_report.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    # Write HTML
    html_path = os.path.join(args.outdir, "pip_eval_report.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(render_html(out))

    print(f"Wrote:\n  {json_path}\n  {html_path}")
    
    # Runbook Hooks - Fail the run if critical thresholds not met
    failed = False
    if out["json_validity"] < 0.99:
        print(f"❌ FAIL: JSON validity {out['json_validity']:.3f} < 0.99")
        failed = True
    if out["safety_recall"] < 1.0:
        print(f"❌ FAIL: Safety recall {out['safety_recall']:.3f} < 1.0")
        failed = True
    if out["phi_scrub_fail_rate"] > 0.05:  # More than 5% PHI failures
        print(f"❌ FAIL: PHI scrub fail rate {out['phi_scrub_fail_rate']:.3f} > 0.05")
        failed = True
    
    if failed:
        print("Evaluation failed critical thresholds!")
        exit(1)
    else:
        print("✅ All critical thresholds met!")

# ---------- HTML ----------
def render_html(data: dict) -> str:
    def pct(x): 
        return f"{x*100:.1f}%"
    rows_conf = ""
    for g,p,c in data["top_topic_confusions"]:
        rows_conf += f"<tr><td>{escape(g)}</td><td>{escape(p)}</td><td>{c}</td></tr>"
    rows_route = ""
    for g,p,c in data["top_routing_confusions"]:
        rows_route += f"<tr><td>{escape(g)}</td><td>{escape(p)}</td><td>{c}</td></tr>"

    html = f"""
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Pip Eval Report</title>
<style>
 body {{ font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; }}
 h1 {{ margin-bottom: 0; }}
 .kpis {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }}
 .card {{ padding: 12px; border: 1px solid #eee; border-radius: 8px; }}
 .card.critical {{ border: 2px solid #ff6b6b; background: #fff5f5; }}
 table {{ border-collapse: collapse; width: 100%; }}
 th, td {{ border: 1px solid #eee; padding: 6px 8px; text-align: left; }}
 th {{ background: #fafafa; }}
 small {{ color: #666; }}
 .pass {{ color: #28a745; font-weight: bold; }}
 .fail {{ color: #dc3545; font-weight: bold; }}
</style>
</head>
<body>
  <h1>Pip Inference Evaluation</h1>
  <small>{escape(str(data.get("count","")))} test cases</small>

  <div class="kpis">
    <div class="card critical"><b>Overall Accuracy</b><br>{pct(data["overall_accuracy"])}</div>
    <div class="card"><b>Topic Accuracy</b><br>{pct(data["topic_accuracy"])}</div>
    <div class="card"><b>Sentiment Accuracy</b><br>{pct(data["sentiment_accuracy"])}</div>
    <div class="card"><b>Urgency Accuracy</b><br>{pct(data["urgency_accuracy"])}</div>
    <div class="card"><b>Routing Accuracy</b><br>{pct(data["routing_accuracy"])}</div>
    <div class="card critical"><b>JSON Validity</b><br>{pct(data["json_validity"])}</div>
    <div class="card"><b>Self-Repair Rate</b><br>{pct(data["self_repair_rate"])}</div>
    <div class="card"><b>Fallback Rate</b><br>{pct(data["fallback_rate"])}</div>
    <div class="card critical"><b>Safety Recall</b><br>{pct(data["safety_recall"])}</div>
    <div class="card critical"><b>PHI Scrub Fail</b><br>{pct(data["phi_scrub_fail_rate"])}</div>
    <div class="card"><b>Latency Avg</b><br>{int(data["latency_avg_ms"])} ms</div>
    <div class="card"><b>Latency P95</b><br>{int(data["latency_p95_ms"])} ms</div>
  </div>

  <h2>Top Topic Confusions</h2>
  <table>
   <tr><th>Gold</th><th>Pred</th><th>Count</th></tr>
   {rows_conf}
  </table>

  <h2>Top Routing Confusions</h2>
  <table>
   <tr><th>Gold</th><th>Pred</th><th>Count</th></tr>
   {rows_route}
  </table>

  <p><small>Generated by eval_pip.py</small></p>
</body>
</html>
"""
    return html

# ---------- Helpers ----------
def top_confusions(cm: dict, top_k: int = 5):
    pairs = []
    for g,row in cm.items():
        for p,c in row.items():
            if g != p:
                pairs.append((g,p,c))
    pairs.sort(key=lambda x: x[2], reverse=True)
    return pairs[:top_k]

if __name__ == "__main__":
    main()
