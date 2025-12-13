#!/usr/bin/env python3
"""
Recalculate punchline scores for all artists using the improved algorithm.

This script re-analyzes cached lyrics and updates artists.json with new scores.
The algorithm was improved to:
- Penalize brand name drops (Gucci, Rolex, etc.)
- Better detect sophisticated wordplay (antithesis, homophones, paronymie)
- Reward meaningful cultural references over lazy flex

Usage:
    python scripts/recalc_punchlines.py
    python scripts/recalc_punchlines.py --dry-run  # Preview without saving
"""

import argparse
import json
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import ARTISTS_JSON_PATH
from storage.lyrics_db import LyricsDatabase
from analyzers.punchlines import calculate_punchline_metrics


def load_artists() -> list[dict]:
    """Load artists from artists.json."""
    with open(ARTISTS_JSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_artists(artists: list[dict]):
    """Save artists to artists.json."""
    with open(ARTISTS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(artists, f, indent=2, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser(
        description="Recalculate punchline scores with improved algorithm"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without saving to artists.json"
    )
    args = parser.parse_args()

    db = LyricsDatabase()
    artists = load_artists()

    print("=" * 70)
    print("RECALCULATING PUNCHLINE SCORES (V2 - Brand penalty + Advanced wordplay)")
    print("=" * 70)
    print()

    changes = []

    for artist in artists:
        artist_id = artist["id"]
        artist_name = artist["name"]
        old_score = artist["metrics"]["punchlineScore"]

        # Get cached lyrics
        lyrics = db.get_combined_lyrics(artist_id)
        song_count = db.get_song_count(artist_id)

        if not lyrics or song_count == 0:
            print(f"⚠️  {artist_name:20} - No cached lyrics, skipping")
            continue

        # Calculate new punchline score
        metrics = calculate_punchline_metrics(lyrics)
        new_score = metrics["punchline_score"]
        diff = new_score - old_score

        # Store change
        changes.append({
            "name": artist_name,
            "old": old_score,
            "new": new_score,
            "diff": diff,
            "rhetorical": metrics["rhetorical_devices"],
            "wordplay": metrics["wordplay"],
            "paradox": metrics["paradox_philosophy"],
            "cultural": metrics["cultural_refs"],
        })

        # Update artist data
        if not args.dry_run:
            artist["metrics"]["punchlineScore"] = new_score

        # Print result
        if diff > 0:
            indicator = f"↑{diff:+.0f}"
            color = "🟢"
        elif diff < 0:
            indicator = f"↓{diff:+.0f}"
            color = "🔴"
        else:
            indicator = "  0"
            color = "⚪"

        print(f"{color} {artist_name:20} {old_score:3} → {new_score:3} ({indicator})")

    # Summary
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)

    # Sort by new score
    changes.sort(key=lambda x: x["new"], reverse=True)

    print("\nTOP 10 PUNCHLINERS (NEW):")
    for i, c in enumerate(changes[:10], 1):
        print(f"  {i:2}. {c['name']:20} {c['new']:3} (was {c['old']})")

    print("\nBIGGEST WINNERS:")
    winners = sorted(changes, key=lambda x: x["diff"], reverse=True)[:5]
    for c in winners:
        print(f"  ↑ {c['name']:20} +{c['diff']:.0f} ({c['old']} → {c['new']})")

    print("\nBIGGEST LOSERS:")
    losers = sorted(changes, key=lambda x: x["diff"])[:5]
    for c in losers:
        print(f"  ↓ {c['name']:20} {c['diff']:.0f} ({c['old']} → {c['new']})")

    # Save if not dry run
    if not args.dry_run:
        save_artists(artists)
        print(f"\n✅ Updated {len(changes)} artists in artists.json")
    else:
        print(f"\n⚠️  DRY RUN - No changes saved. Run without --dry-run to apply.")


if __name__ == "__main__":
    main()
