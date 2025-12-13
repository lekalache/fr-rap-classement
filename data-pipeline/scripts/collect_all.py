#!/usr/bin/env python3
"""
Main script to collect lyrics and compute metrics for all artists.

Usage:
    python scripts/collect_all.py [--artists ARTIST1,ARTIST2] [--skip-collection] [--force]

Examples:
    python scripts/collect_all.py                    # Process all artists
    python scripts/collect_all.py --artists Booba,PNL  # Process specific artists
    python scripts/collect_all.py --skip-collection  # Only recompute metrics from cached lyrics
    python scripts/collect_all.py --force           # Force re-collection even if cached
"""

import argparse
import json
import sys
from pathlib import Path
from datetime import datetime

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from tqdm import tqdm

from config import ARTISTS_JSON_PATH, MAX_SONGS_PER_ARTIST
from collectors.genius_client import GeniusCollector
from storage.lyrics_db import LyricsDatabase
from analyzers.vocabulary import calculate_unique_words, calculate_vocabulary_metrics
from analyzers.flow import calculate_flow_score, calculate_flow_metrics
from analyzers.punchlines import calculate_punchline_score, calculate_punchline_metrics
from analyzers.hooks import calculate_hook_score, calculate_hook_metrics


def load_artists() -> list[dict]:
    """Load artists from artists.json."""
    with open(ARTISTS_JSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_artists(artists: list[dict]):
    """Save updated artists to artists.json."""
    with open(ARTISTS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(artists, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(artists)} artists to {ARTISTS_JSON_PATH}")


def collect_artist_lyrics(
    collector: GeniusCollector,
    db: LyricsDatabase,
    artist_id: str,
    artist_name: str,
    max_songs: int = MAX_SONGS_PER_ARTIST,
    force: bool = False
) -> bool:
    """Collect lyrics for a single artist.

    Args:
        collector: GeniusCollector instance.
        db: LyricsDatabase instance.
        artist_id: Internal artist ID.
        artist_name: Artist name for Genius search.
        max_songs: Maximum songs to collect.
        force: Force re-collection even if cached.

    Returns:
        True if collection was successful.
    """
    # Check if we already have lyrics cached
    existing_count = db.get_song_count(artist_id)

    if existing_count >= max_songs and not force:
        print(f"  Skipping {artist_name}: {existing_count} songs already cached")
        return True

    if existing_count > 0 and not force:
        print(f"  {artist_name}: {existing_count} songs cached, collecting more...")

    # Collect from Genius
    songs = collector.get_artist_songs(artist_name, max_songs)

    if not songs:
        print(f"  Warning: No songs found for {artist_name}")
        return False

    # Save to database
    db.save_artist(artist_id, artist_name)
    db.save_songs_batch(artist_id, songs)

    print(f"  Collected {len(songs)} songs for {artist_name}")
    return True


def analyze_artist(db: LyricsDatabase, artist_id: str) -> dict:
    """Analyze lyrics and compute metrics for an artist.

    Args:
        db: LyricsDatabase instance.
        artist_id: Internal artist ID.

    Returns:
        Dict with computed metrics.
    """
    lyrics = db.get_combined_lyrics(artist_id)

    if not lyrics:
        return {
            "uniqueWords": 0,
            "flowScore": 0,
            "punchlineScore": 0,
            "hookScore": 0,
        }

    # Calculate metrics
    unique_words = calculate_unique_words(lyrics)
    flow_score = calculate_flow_score(lyrics)
    punchline_score = calculate_punchline_score(lyrics)
    hook_score = calculate_hook_score(lyrics)

    # Cache results
    db.save_analysis(
        artist_id=artist_id,
        unique_words=unique_words,
        flow_score=flow_score,
        punchline_score=punchline_score,
        hook_score=hook_score,
        total_songs=db.get_song_count(artist_id),
        total_words=len(lyrics.split())
    )

    return {
        "uniqueWords": unique_words,
        "flowScore": flow_score,
        "punchlineScore": punchline_score,
        "hookScore": hook_score,
    }


def analyze_artist_detailed(db: LyricsDatabase, artist_id: str, artist_name: str) -> dict:
    """Get detailed analysis for an artist (for debugging/inspection).

    Args:
        db: LyricsDatabase instance.
        artist_id: Internal artist ID.
        artist_name: Artist name for display.

    Returns:
        Dict with all detailed metrics.
    """
    lyrics = db.get_combined_lyrics(artist_id)

    if not lyrics:
        return {"error": "No lyrics found"}

    return {
        "artist": artist_name,
        "song_count": db.get_song_count(artist_id),
        "word_count": len(lyrics.split()),
        "vocabulary": calculate_vocabulary_metrics(lyrics),
        "flow": calculate_flow_metrics(lyrics),
        "punchlines": calculate_punchline_metrics(lyrics),
        "hooks": calculate_hook_metrics(lyrics),
    }


def process_all_artists(
    artists: list[dict],
    skip_collection: bool = False,
    force: bool = False,
    specific_artists: list[str] = None
) -> list[dict]:
    """Process all artists: collect lyrics and compute metrics.

    Args:
        artists: List of artist dicts from artists.json.
        skip_collection: Skip Genius API collection, only analyze cached.
        force: Force re-collection even if cached.
        specific_artists: Only process these artists (by name).

    Returns:
        Updated list of artist dicts.
    """
    collector = GeniusCollector() if not skip_collection else None
    db = LyricsDatabase()

    # Filter artists if specific ones requested
    if specific_artists:
        artists_to_process = [
            a for a in artists
            if a["name"].lower() in [s.lower() for s in specific_artists]
        ]
        if not artists_to_process:
            print(f"No matching artists found for: {specific_artists}")
            return artists
    else:
        artists_to_process = artists

    print(f"\n=== Processing {len(artists_to_process)} artists ===\n")

    for artist in tqdm(artists_to_process, desc="Processing artists"):
        artist_id = artist["id"]
        artist_name = artist["name"]

        print(f"\n--- {artist_name} ---")

        # Step 1: Collect lyrics (unless skipped)
        if not skip_collection:
            success = collect_artist_lyrics(
                collector, db, artist_id, artist_name, force=force
            )
            if not success:
                print(f"  Skipping analysis for {artist_name} (no lyrics)")
                continue

        # Step 2: Analyze and compute metrics
        song_count = db.get_song_count(artist_id)
        if song_count == 0:
            print(f"  No cached lyrics for {artist_name}")
            continue

        print(f"  Analyzing {song_count} songs...")
        metrics = analyze_artist(db, artist_id)

        # Update artist metrics
        artist["metrics"]["uniqueWords"] = metrics["uniqueWords"]
        artist["metrics"]["flowScore"] = metrics["flowScore"]
        artist["metrics"]["punchlineScore"] = metrics["punchlineScore"]
        artist["metrics"]["hookScore"] = metrics["hookScore"]

        print(f"  Results: uniqueWords={metrics['uniqueWords']}, "
              f"flow={metrics['flowScore']}, "
              f"punchlines={metrics['punchlineScore']}, "
              f"hooks={metrics['hookScore']}")

    return artists


def main():
    parser = argparse.ArgumentParser(
        description="Collect lyrics and compute writing quality metrics"
    )
    parser.add_argument(
        "--artists",
        type=str,
        help="Comma-separated list of artist names to process"
    )
    parser.add_argument(
        "--skip-collection",
        action="store_true",
        help="Skip Genius API collection, only analyze cached lyrics"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-collection even if lyrics are cached"
    )
    parser.add_argument(
        "--detailed",
        type=str,
        help="Print detailed analysis for a specific artist"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Don't save changes to artists.json"
    )

    args = parser.parse_args()

    # Load artists
    artists = load_artists()
    print(f"Loaded {len(artists)} artists from {ARTISTS_JSON_PATH}")

    # Handle detailed analysis request
    if args.detailed:
        db = LyricsDatabase()
        artist = next((a for a in artists if a["name"].lower() == args.detailed.lower()), None)
        if artist:
            detailed = analyze_artist_detailed(db, artist["id"], artist["name"])
            print(json.dumps(detailed, indent=2, ensure_ascii=False))
        else:
            print(f"Artist not found: {args.detailed}")
        return

    # Parse specific artists
    specific_artists = None
    if args.artists:
        specific_artists = [a.strip() for a in args.artists.split(",")]

    # Process artists
    updated_artists = process_all_artists(
        artists,
        skip_collection=args.skip_collection,
        force=args.force,
        specific_artists=specific_artists
    )

    # Save results
    if not args.dry_run:
        save_artists(updated_artists)
        print("\n=== Complete ===")
        print(f"Updated metrics saved to {ARTISTS_JSON_PATH}")
    else:
        print("\n=== Dry run complete (no changes saved) ===")


if __name__ == "__main__":
    main()
