#!/usr/bin/env python3
"""
Collect Wikipedia metrics for all artists.

Usage:
    python scripts/collect_wikipedia.py          # Collect for all artists
    python scripts/collect_wikipedia.py "Booba"  # Collect for specific artist
    python scripts/collect_wikipedia.py --force  # Force refresh all data
"""

import argparse
import json
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import ARTISTS_JSON_PATH
from collectors.wikipedia_client import WikipediaCollector
from storage.lyrics_db import LyricsDatabase


def load_artists() -> list[dict]:
    """Load artists from artists.json."""
    with open(ARTISTS_JSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def collect_for_artist(
    collector: WikipediaCollector,
    db: LyricsDatabase,
    artist: dict,
    force: bool = False
) -> bool:
    """Collect Wikipedia data for a single artist.

    Args:
        collector: WikipediaCollector instance.
        db: LyricsDatabase instance.
        artist: Artist dict from artists.json.
        force: Force refresh even if cached.

    Returns:
        True if collected successfully.
    """
    artist_id = artist["id"]
    artist_name = artist["name"]

    # Check cache unless forcing refresh
    if not force:
        cached = db.get_wikipedia_cache(artist_id)
        if cached:
            print(f"[CACHED] {artist_name}: backlinks={cached['backlinks_count']}, "
                  f"pageviews={cached['pageviews_monthly']}")
            return True

    # Collect from Wikipedia
    metrics = collector.collect_artist_metrics(artist_name)

    if not metrics:
        print(f"[ERROR] {artist_name}: Page not found")
        return False

    # Save to database
    db.save_wikipedia_cache(artist_id, metrics.to_dict())

    print(f"[OK] {artist_name}: backlinks={metrics.backlinks_count}, "
          f"pageviews={metrics.pageviews_monthly}, score={metrics.calculate_mentions_score()}")

    return True


def collect_all(force: bool = False) -> dict:
    """Collect Wikipedia data for all artists.

    Args:
        force: Force refresh even if cached.

    Returns:
        Dict with collection results.
    """
    artists = load_artists()
    collector = WikipediaCollector()
    db = LyricsDatabase()

    results = {
        "success": 0,
        "cached": 0,
        "failed": 0,
        "artists": {}
    }

    print(f"\n{'='*60}")
    print(f"Collecting Wikipedia data for {len(artists)} artists")
    print(f"{'='*60}\n")

    for i, artist in enumerate(artists, 1):
        print(f"[{i}/{len(artists)}] ", end="")

        success = collect_for_artist(collector, db, artist, force)

        if success:
            cached = db.get_wikipedia_cache(artist["id"])
            if cached:
                results["artists"][artist["id"]] = {
                    "name": artist["name"],
                    "backlinks": cached["backlinks_count"],
                    "pageviews": cached["pageviews_monthly"],
                    "languages": cached["languages_count"],
                    "references": cached["references_count"],
                }
                results["success"] += 1
        else:
            results["failed"] += 1

    print(f"\n{'='*60}")
    print(f"SUMMARY: {results['success']} collected, {results['failed']} failed")
    print(f"{'='*60}")

    return results


def generate_report(results: dict) -> str:
    """Generate a markdown report of Wikipedia data.

    Args:
        results: Collection results dict.

    Returns:
        Markdown report string.
    """
    lines = [
        "# Wikipedia Data Collection Report",
        "",
        f"**Total Artists:** {results['success'] + results['failed']}",
        f"**Collected:** {results['success']}",
        f"**Failed:** {results['failed']}",
        "",
        "## Artist Data",
        "",
        "| Artist | Backlinks | Pageviews | Languages | References |",
        "|--------|-----------|-----------|-----------|------------|",
    ]

    # Sort by backlinks descending
    sorted_artists = sorted(
        results["artists"].items(),
        key=lambda x: x[1]["backlinks"],
        reverse=True
    )

    for artist_id, data in sorted_artists:
        lines.append(
            f"| {data['name']} | {data['backlinks']} | "
            f"{data['pageviews']:,} | {data['languages']} | {data['references']} |"
        )

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Collect Wikipedia metrics for artists"
    )
    parser.add_argument(
        "artist",
        type=str,
        nargs="?",
        help="Specific artist name to collect (optional)"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force refresh cached data"
    )
    parser.add_argument(
        "--report",
        action="store_true",
        help="Generate markdown report"
    )

    args = parser.parse_args()

    if args.artist:
        # Collect for specific artist
        artists = load_artists()
        artist = next(
            (a for a in artists if a["name"].lower() == args.artist.lower()),
            None
        )

        if not artist:
            print(f"Artist not found: {args.artist}")
            print("\nAvailable artists:")
            for a in sorted(artists, key=lambda x: x["name"]):
                print(f"  - {a['name']}")
            return

        collector = WikipediaCollector()
        db = LyricsDatabase()
        collect_for_artist(collector, db, artist, args.force)
    else:
        # Collect for all
        results = collect_all(args.force)

        if args.report:
            report = generate_report(results)
            report_path = Path(__file__).parent.parent / "reports" / "wikipedia_data.md"
            report_path.parent.mkdir(exist_ok=True)
            report_path.write_text(report)
            print(f"\nReport saved to: {report_path}")


if __name__ == "__main__":
    main()
