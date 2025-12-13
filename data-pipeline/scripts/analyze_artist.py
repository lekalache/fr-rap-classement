#!/usr/bin/env python3
"""
Analyze a single artist's lyrics in detail.

Usage:
    python scripts/analyze_artist.py "Booba"
    python scripts/analyze_artist.py "PNL" --collect
"""

import argparse
import json
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import ARTISTS_JSON_PATH, MAX_SONGS_PER_ARTIST
from collectors.genius_client import GeniusCollector
from storage.lyrics_db import LyricsDatabase
from analyzers.vocabulary import calculate_vocabulary_metrics
from analyzers.flow import calculate_flow_metrics
from analyzers.punchlines import calculate_punchline_metrics
from analyzers.hooks import calculate_hook_metrics


def load_artists() -> list[dict]:
    """Load artists from artists.json."""
    with open(ARTISTS_JSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def find_artist(artists: list[dict], name: str) -> dict | None:
    """Find artist by name (case-insensitive)."""
    name_lower = name.lower()
    for artist in artists:
        if artist["name"].lower() == name_lower:
            return artist
    return None


def collect_lyrics(artist_name: str, artist_id: str, max_songs: int = MAX_SONGS_PER_ARTIST):
    """Collect lyrics for an artist from Genius."""
    print(f"\n=== Collecting lyrics for {artist_name} ===")

    collector = GeniusCollector()
    db = LyricsDatabase()

    songs = collector.get_artist_songs(artist_name, max_songs)

    if not songs:
        print(f"No songs found for {artist_name}")
        return False

    db.save_artist(artist_id, artist_name)
    db.save_songs_batch(artist_id, songs)

    print(f"Collected {len(songs)} songs")
    return True


def analyze_artist(artist_name: str, artist_id: str):
    """Analyze an artist's cached lyrics."""
    db = LyricsDatabase()

    song_count = db.get_song_count(artist_id)
    if song_count == 0:
        print(f"\nNo cached lyrics for {artist_name}")
        print("Run with --collect to fetch lyrics from Genius")
        return

    lyrics = db.get_combined_lyrics(artist_id)
    word_count = len(lyrics.split())

    print(f"\n{'='*60}")
    print(f"ANALYSIS: {artist_name}")
    print(f"{'='*60}")
    print(f"\nSongs analyzed: {song_count}")
    print(f"Total words: {word_count:,}")

    # Vocabulary metrics
    print(f"\n--- VOCABULARY (uniqueWords) ---")
    vocab = calculate_vocabulary_metrics(lyrics)
    for key, value in vocab.items():
        print(f"  {key}: {value}")

    # Flow metrics
    print(f"\n--- FLOW (flowScore) ---")
    flow = calculate_flow_metrics(lyrics)
    for key, value in flow.items():
        print(f"  {key}: {value}")

    # Punchline metrics
    print(f"\n--- PUNCHLINES (punchlineScore) ---")
    punchlines = calculate_punchline_metrics(lyrics)
    for key, value in punchlines.items():
        print(f"  {key}: {value}")

    # Hook metrics
    print(f"\n--- HOOKS (hookScore) ---")
    hooks = calculate_hook_metrics(lyrics)
    for key, value in hooks.items():
        print(f"  {key}: {value}")

    # Summary
    print(f"\n{'='*60}")
    print("FINAL SCORES")
    print(f"{'='*60}")
    print(f"  uniqueWords:    {vocab['unique_words']}")
    print(f"  flowScore:      {flow['flow_score']}")
    print(f"  punchlineScore: {punchlines['punchline_score']}")
    print(f"  hookScore:      {hooks['hook_score']}")

    # Compare with current values
    artists = load_artists()
    artist = find_artist(artists, artist_name)
    if artist:
        print(f"\n--- Comparison with current values ---")
        print(f"  uniqueWords:    {artist['metrics']['uniqueWords']} -> {vocab['unique_words']}")
        print(f"  flowScore:      {artist['metrics']['flowScore']} -> {flow['flow_score']}")
        print(f"  punchlineScore: {artist['metrics']['punchlineScore']} -> {punchlines['punchline_score']}")
        print(f"  hookScore:      {artist['metrics']['hookScore']} -> {hooks['hook_score']}")


def main():
    parser = argparse.ArgumentParser(
        description="Analyze a single artist's lyrics in detail"
    )
    parser.add_argument(
        "artist",
        type=str,
        help="Artist name to analyze"
    )
    parser.add_argument(
        "--collect",
        action="store_true",
        help="Collect lyrics from Genius before analyzing"
    )
    parser.add_argument(
        "--max-songs",
        type=int,
        default=MAX_SONGS_PER_ARTIST,
        help=f"Maximum songs to collect (default: {MAX_SONGS_PER_ARTIST})"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON"
    )

    args = parser.parse_args()

    # Find artist in database
    artists = load_artists()
    artist = find_artist(artists, args.artist)

    if not artist:
        print(f"Artist not found in artists.json: {args.artist}")
        print("\nAvailable artists:")
        for a in sorted(artists, key=lambda x: x["name"]):
            print(f"  - {a['name']}")
        return

    artist_id = artist["id"]
    artist_name = artist["name"]

    # Collect if requested
    if args.collect:
        success = collect_lyrics(artist_name, artist_id, args.max_songs)
        if not success:
            return

    # Analyze
    if args.json:
        db = LyricsDatabase()
        lyrics = db.get_combined_lyrics(artist_id)
        if lyrics:
            result = {
                "artist": artist_name,
                "song_count": db.get_song_count(artist_id),
                "vocabulary": calculate_vocabulary_metrics(lyrics),
                "flow": calculate_flow_metrics(lyrics),
                "punchlines": calculate_punchline_metrics(lyrics),
                "hooks": calculate_hook_metrics(lyrics),
            }
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(json.dumps({"error": "No lyrics found"}, indent=2))
    else:
        analyze_artist(artist_name, artist_id)


if __name__ == "__main__":
    main()
