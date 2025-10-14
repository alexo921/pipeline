#!/usr/bin/env python3
import json
import argparse
import sys

def try_parse_json(text: str):
    try:
        return json.loads(text), None
    except json.JSONDecodeError as e:
        return None, str(e)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset", required=True)
    ap.add_argument("--mock", action="store_true")
    args = ap.parse_args()

    # Load dataset
    items = []
    with open(args.dataset, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                items.append(json.loads(line))

    print(f"Loaded {len(items)} items")
    print(f"Mock mode: {args.mock}")

    for i, it in enumerate(items):
        print(f"\n--- Processing item {i+1} ---")
        print(f"Message: {it['caregiver_message']}")
        print(f"Expected: {it['expected']}")
        
        if args.mock:
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
            print(f"Generated mock response: {text}")
        else:
            text = ""
            print("Not in mock mode, no response generated")

        # Test parsing
        parsed, err = try_parse_json(text)
        print(f"Parse result: {parsed is not None}")
        print(f"Error: {err}")
        if parsed:
            print(f"Parsed JSON keys: {list(parsed.keys())}")

if __name__ == "__main__":
    main()
