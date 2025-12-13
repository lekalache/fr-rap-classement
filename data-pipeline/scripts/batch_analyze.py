#!/usr/bin/env python
"""Batch analyze multiple artists."""

import subprocess
import sys
import json
import os

# Artists to analyze (only those that need re-running)
ARTISTS = [
    "La Fouine",
    "Lacrim",
    "Maes",
    "Gazo",
    "Médine",
    "Kalash Criminel",
    "Alkpote",
]

# Results storage
results = {}

for artist in ARTISTS:
    print(f"\n{'='*60}")
    print(f"Processing: {artist}")
    print('='*60)

    try:
        result = subprocess.run(
            [sys.executable, "scripts/analyze_artist.py", artist, "--collect"],
            capture_output=True,
            text=True,
            timeout=300
        )

        output = result.stdout + result.stderr

        # Extract scores from output
        scores = {}
        for line in output.split('\n'):
            if 'uniqueWords:' in line and '->' in line:
                scores['uniqueWords'] = int(line.split('->')[-1].strip())
            elif 'flowScore:' in line and '->' in line:
                scores['flowScore'] = int(line.split('->')[-1].strip())
            elif 'punchlineScore:' in line and '->' in line:
                scores['punchlineScore'] = int(line.split('->')[-1].strip())
            elif 'hookScore:' in line and '->' in line:
                scores['hookScore'] = int(line.split('->')[-1].strip())
            elif 'No songs found' in line:
                print(f"  ERROR: No songs found for {artist}")
            elif 'Collected' in line and 'songs' in line:
                print(f"  {line.strip()}")

        if scores:
            results[artist] = scores
            print(f"  Results: {scores}")

    except subprocess.TimeoutExpired:
        print(f"  TIMEOUT for {artist}")
    except Exception as e:
        print(f"  ERROR: {e}")

print("\n" + "="*60)
print("SUMMARY")
print("="*60)
for artist, scores in results.items():
    print(f"{artist}: uniqueWords={scores.get('uniqueWords', 0)}, flow={scores.get('flowScore', 0)}, punch={scores.get('punchlineScore', 0)}, hook={scores.get('hookScore', 0)}")

# Save results
with open('batch_results.json', 'w') as f:
    json.dump(results, f, indent=2)
print(f"\nResults saved to batch_results.json")
