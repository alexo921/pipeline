#!/usr/bin/env python3
"""
Utility to (re)create the /data directory with a fresh synthetic dataset
compatible with the two-tower training examples in this repo.

Outputs (in /data):
  - train.csv, val.csv, test.csv  (columns: query_id,candidate_id,label)
  - meta.json (basic stats + parameters)

Usage:
  python tools/generate_dataset.py --n_queries 1000 --n_candidates 5000 --n_samples 50000 --positive_ratio 0.2
"""
import argparse
import json
from pathlib import Path
import numpy as np
import pandas as pd

from utils.data_generator import (
    generate_synthetic_data,
    create_train_val_test_split,
    print_data_statistics,
)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--n_queries", type=int, default=1000)
    parser.add_argument("--n_candidates", type=int, default=5000)
    parser.add_argument("--n_samples", type=int, default=50000)
    parser.add_argument("--positive_ratio", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    # Create data dir
    data_dir = Path(__file__).resolve().parents[1] / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    # Generate base synthetic data
    q, c, y = generate_synthetic_data(
        n_queries=args.n_queries,
        n_candidates=args.n_candidates,
        n_samples=args.n_samples,
        positive_ratio=args.positive_ratio,
        random_state=args.seed,
    )

    # Split
    (q_tr, c_tr, y_tr), (q_va, c_va, y_va), (q_te, c_te, y_te) = create_train_val_test_split(q, c, y)

    # Save CSVs
    def save_split(fname: str, qsplit: np.ndarray, csplit: np.ndarray, ysplit: np.ndarray):
        df = pd.DataFrame({"query_id": qsplit, "candidate_id": csplit, "label": ysplit})
        df.to_csv(data_dir / fname, index=False)

    save_split("train.csv", q_tr, c_tr, y_tr)
    save_split("val.csv", q_va, c_va, y_va)
    save_split("test.csv", q_te, c_te, y_te)

    # Save meta
    meta = {
        "n_queries": int(args.n_queries),
        "n_candidates": int(args.n_candidates),
        "n_samples": int(args.n_samples),
        "positive_ratio": float(args.positive_ratio),
        "seed": int(args.seed),
        "counts": {
            "train": int(len(y_tr)),
            "val": int(len(y_va)),
            "test": int(len(y_te)),
        },
    }
    (data_dir / "meta.json").write_text(json.dumps(meta, indent=2))

    # Print quick stats to console
    print_data_statistics(q, c, y)
    print(f"\nWrote dataset to: {data_dir}")


if __name__ == "__main__":
    main()


