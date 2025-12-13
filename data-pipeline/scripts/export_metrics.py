#!/usr/bin/env python3
"""
Export computed metrics from the database to artists.json.

Usage:
    python scripts/export_metrics.py
    python scripts/export_metrics.py --dry-run
"""

import argparse
import json
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import ARTISTS_JSON_PATH
from storage.lyrics_db import LyricsDatabase


def load_artists() -> list[dict]:
    """Load artists from artists.json."""
    with open(ARTISTS_JSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_artists(artists: list[dict]):
    """Save updated artists to artists.json."""
    with open(ARTISTS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(artists, f, ensure_ascii=False, indent=2)


def export_metrics(dry_run: bool = False):
    """Export cached analysis results to artists.json."""
    db = LyricsDatabase()
    artists = load_artists()

    print(f"Exporting metrics for {len(artists)} artists...")
    print()

    updated_count = 0

    for artist in artists:
        artist_id = artist["id"]
        artist_name = artist["name"]

        # Get cached analysis
        cached = db.get_cached_analysis(artist_id)

        if not cached:
            print(f"  {artist_name}: No cached analysis")
            continue

        # Get current values
        old_values = {
            "uniqueWords": artist["metrics"]["uniqueWords"],
            "flowScore": artist["metrics"]["flowScore"],
            "punchlineScore": artist["metrics"]["punchlineScore"],
            "hookScore": artist["metrics"]["hookScore"],
        }

        # New values from cache
        new_values = {
            "uniqueWords": cached["unique_words"],
            "flowScore": int(cached["flow_score"]),
            "punchlineScore": int(cached["punchline_score"]),
            "hookScore": int(cached["hook_score"]),
        }

        # Check if changed
        changed = any(old_values[k] != new_values[k] for k in old_values)

        if changed:
            print(f"  {artist_name}:")
            for key in old_values:
                if old_values[key] != new_values[key]:
                    print(f"    {key}: {old_values[key]} -> {new_values[key]}")

            # Update artist
            artist["metrics"]["uniqueWords"] = new_values["uniqueWords"]
            artist["metrics"]["flowScore"] = new_values["flowScore"]
            artist["metrics"]["punchlineScore"] = new_values["punchlineScore"]
            artist["metrics"]["hookScore"] = new_values["hookScore"]
            updated_count += 1
        else:
            print(f"  {artist_name}: No changes")

    print()

    if dry_run:
        print(f"Dry run: {updated_count} artists would be updated")
    else:
        save_artists(artists)
        print(f"Exported metrics for {updated_count} artists to {ARTISTS_JSON_PATH}")


def main():
    parser = argparse.ArgumentParser(
        description="Export computed metrics to artists.json"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show changes without saving"
    )

    args = parser.parse_args()
    export_metrics(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
