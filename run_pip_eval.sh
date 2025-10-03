#!/bin/bash

# Pip Evaluation Runner
# Runs the comprehensive evaluation suite against the Pip chatbot

set -e

echo "🚀 Starting Pip Evaluation Suite"
echo "================================"

# Check if Pip chatbot is running
if ! curl -f http://localhost:5005/status > /dev/null 2>&1; then
    echo "❌ Pip chatbot not running. Start it with: docker-compose up -d pip-chatbot"
    exit 1
fi

echo "✅ Pip chatbot is running"

# Create output directory
mkdir -p ./eval_output

# Run evaluation
echo "📊 Running evaluation on 151 test cases..."

# Check if we should use mock mode (when LLM server not available)
if ! curl -f http://host.docker.internal:1337/v1/chat/completions > /dev/null 2>&1; then
    echo "⚠️  LLM server not available, running in mock mode"
    python3 eval_pip.py \
        --dataset pip_eval_v1.json \
        --endpoint http://localhost:5005/webhooks/rest/webhook \
        --outdir ./eval_output \
        --timeout 10.0 \
        --mock
else
    echo "✅ LLM server available, running full evaluation"
    python3 eval_pip.py \
        --dataset pip_eval_v1.json \
        --endpoint http://localhost:5005/webhooks/rest/webhook \
        --outdir ./eval_output \
        --timeout 10.0
fi

echo ""
echo "📋 Evaluation Summary:"
echo "====================="
echo "📄 JSON Report: ./eval_output/pip_eval_report.json"
echo "🌐 HTML Report: ./eval_output/pip_eval_report.html"
echo ""
echo "🎯 Key Metrics:"
python3 -c "
import json
with open('./eval_output/pip_eval_report.json', 'r') as f:
    data = json.load(f)
print(f'  Overall Accuracy: {data[\"overall_accuracy\"]:.1%}')
print(f'  Topic Accuracy: {data[\"topic_accuracy\"]:.1%}')
print(f'  Safety Recall: {data[\"safety_recall\"]:.1%}')
print(f'  JSON Validity: {data[\"json_validity\"]:.1%}')
print(f'  PHI Scrub Fail: {data[\"phi_scrub_fail_rate\"]:.1%}')
print(f'  Avg Latency: {data[\"latency_avg_ms\"]:.0f}ms')
"

echo ""
echo "✅ Evaluation complete!"
