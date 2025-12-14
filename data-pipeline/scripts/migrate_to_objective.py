#!/usr/bin/env python3
"""
Migration script to compute all objective metrics for existing artists.

This script:
1. Collects Wikipedia data for all artists
2. Collects awards data
3. Computes innovation scores (TF-IDF style fingerprinting)
4. Computes integrity scores
5. Computes influence scores
6. Computes thematic coherence
7. Computes peak excellence
8. Exports to artists.json
9. Generates migration report

Usage:
    python scripts/migrate_to_objective.py
    python scripts/migrate_to_objective.py --artist "Jul"
    python scripts/migrate_to_objective.py --dry-run
    python scripts/migrate_to_objective.py --skip-collection
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import ARTISTS_JSON_PATH
from storage.lyrics_db import LyricsDatabase
from collectors.wikipedia_client import WikipediaCollector
from collectors.awards_collector import AwardsCollector
from analyzers.innovation import InnovationAnalyzer
from analyzers.integrity import IntegrityAnalyzer
from analyzers.influence import InfluenceAnalyzer
from analyzers.thematic import ThematicAnalyzer
from analyzers.peak_excellence import PeakAnalyzer


def load_artists() -> list[dict]:
    """Load artists from JSON file."""
    with open(ARTISTS_JSON_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_artists(artists: list[dict]):
    """Save artists to JSON file."""
    with open(ARTISTS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(artists, f, ensure_ascii=False, indent=2)


def collect_external_data(artists: list[dict], skip: bool = False) -> tuple[dict, dict]:
    """Collect Wikipedia and awards data.

    Args:
        artists: List of artist dicts.
        skip: If True, skip collection and return empty dicts.

    Returns:
        Tuple of (wikipedia_data, awards_data) dicts.
    """
    if skip:
        print("Skipping external data collection...")
        return {}, {}

    print("\n" + "=" * 60)
    print("PHASE 1: COLLECTING EXTERNAL DATA")
    print("=" * 60)

    wiki_collector = WikipediaCollector()
    awards_collector = AwardsCollector()

    wiki_data = {}
    awards_data = {}

    for artist in artists:
        name = artist["name"]
        artist_id = artist["id"]

        print(f"\nCollecting for {name}...")

        # Wikipedia
        try:
            wiki_metrics = wiki_collector.collect_artist_metrics(name)
            if wiki_metrics:
                wiki_data[artist_id] = wiki_metrics.to_dict()
        except Exception as e:
            print(f"  Wikipedia error: {e}")

        # Awards
        try:
            awards = awards_collector.get_artist_awards(name)
            awards_data[artist_id] = awards.to_dict()
        except Exception as e:
            print(f"  Awards error: {e}")

    return wiki_data, awards_data


def compute_all_scores(
    artists: list[dict],
    db: LyricsDatabase,
    wiki_data: dict,
    awards_data: dict
) -> dict[str, dict]:
    """Compute all objective scores for all artists.

    Args:
        artists: List of artist dicts.
        db: Database connection.
        wiki_data: Wikipedia data by artist_id.
        awards_data: Awards data by artist_id.

    Returns:
        Dict mapping artist_id to all computed scores.
    """
    print("\n" + "=" * 60)
    print("PHASE 2: COMPUTING OBJECTIVE SCORES")
    print("=" * 60)

    # Get all lyrics from database
    all_lyrics = db.get_all_artists_lyrics()
    artist_ids = [a["id"] for a in artists]

    results = {}

    # Initialize analyzers
    innovation_analyzer = InnovationAnalyzer()
    integrity_analyzer = IntegrityAnalyzer()
    influence_analyzer = InfluenceAnalyzer()
    thematic_analyzer = ThematicAnalyzer()
    peak_analyzer = PeakAnalyzer()

    # Build TF-IDF model for innovation (needs all lyrics)
    print("\nBuilding TF-IDF model for innovation analysis...")
    if all_lyrics:
        innovation_analyzer._build_tfidf_model(all_lyrics)

    # Compute scores for each artist
    for artist in artists:
        artist_id = artist["id"]
        name = artist["name"]
        lyrics = all_lyrics.get(artist_id, "")

        print(f"\nComputing scores for {name}...")

        result = {"artist_id": artist_id, "name": name}

        # Innovation
        try:
            innovation = innovation_analyzer.calculate_innovation_score(
                artist_id, lyrics, all_lyrics
            )
            result["innovation"] = innovation.to_dict()
            print(f"  Innovation: {innovation.total_score:.1f}")
        except Exception as e:
            print(f"  Innovation error: {e}")
            result["innovation"] = {"total_score": 50}

        # Integrity
        try:
            integrity = integrity_analyzer.calculate_integrity_score(artist_id, lyrics)
            result["integrity"] = integrity.to_dict()
            print(f"  Integrity: {integrity.total_score:.1f}")
        except Exception as e:
            print(f"  Integrity error: {e}")
            result["integrity"] = {"total_score": 50}

        # Influence
        try:
            influence = influence_analyzer.calculate_influence_score(
                artist_id,
                wiki_data=wiki_data.get(artist_id),
                awards_data=awards_data.get(artist_id),
                all_lyrics=all_lyrics
            )
            result["influence"] = influence.to_dict()
            print(f"  Influence: {influence.total_score:.1f}")
        except Exception as e:
            print(f"  Influence error: {e}")
            result["influence"] = {"total_score": 50}

        # Thematic
        try:
            thematic = thematic_analyzer.calculate_coherence_score(lyrics, artist_id)
            result["thematic"] = thematic.to_dict()
            print(f"  Thematic: {thematic.coherence_score:.1f}")
        except Exception as e:
            print(f"  Thematic error: {e}")
            result["thematic"] = {"coherence_score": 50}

        # Peak Excellence
        try:
            peak = peak_analyzer.calculate_peak_score(artist_id)
            result["peak"] = peak.to_dict()
            print(f"  Peak: {peak.total_score:.1f}")
        except Exception as e:
            print(f"  Peak error: {e}")
            result["peak"] = {"total_score": 50}

        results[artist_id] = result

    return results


def update_artists_json(artists: list[dict], scores: dict[str, dict], dry_run: bool = False):
    """Update artists.json with computed scores.

    Args:
        artists: Original artist list.
        scores: Computed scores by artist_id.
        dry_run: If True, don't actually save.
    """
    print("\n" + "=" * 60)
    print("PHASE 3: UPDATING ARTISTS.JSON")
    print("=" * 60)

    for artist in artists:
        artist_id = artist["id"]
        if artist_id not in scores:
            continue

        result = scores[artist_id]

        # Update metrics with computed values
        old_innovation = artist["metrics"].get("innovationScore", 0)
        old_integrity = artist["metrics"].get("artisticIntegrity", 0)

        new_innovation = int(result.get("innovation", {}).get("total_score", old_innovation))
        new_integrity = int(result.get("integrity", {}).get("total_score", old_integrity))
        new_influence = int(result.get("influence", {}).get("total_score", artist["metrics"].get("influenceScore", 50)))
        new_thematic = int(result.get("thematic", {}).get("coherence_score", artist["metrics"].get("thematicCoherence", 50)))
        new_peak = int(result.get("peak", {}).get("total_score", artist["metrics"].get("peakAlbumScore", 50)))

        print(f"\n{artist['name']}:")
        print(f"  innovationScore: {old_innovation} -> {new_innovation}")
        print(f"  artisticIntegrity: {old_integrity} -> {new_integrity}")
        print(f"  influenceScore: {artist['metrics'].get('influenceScore', 0)} -> {new_influence}")
        print(f"  thematicCoherence: {artist['metrics'].get('thematicCoherence', 0)} -> {new_thematic}")
        print(f"  peakAlbumScore: {artist['metrics'].get('peakAlbumScore', 0)} -> {new_peak}")

        # Update the artist dict
        artist["metrics"]["innovationScore"] = new_innovation
        artist["metrics"]["artisticIntegrity"] = new_integrity
        artist["metrics"]["influenceScore"] = new_influence
        artist["metrics"]["thematicCoherence"] = new_thematic
        artist["metrics"]["peakAlbumScore"] = new_peak

    if dry_run:
        print("\n[DRY RUN] Not saving changes.")
    else:
        save_artists(artists)
        print("\n✓ Artists.json updated successfully!")


def generate_report(artists: list[dict], scores: dict[str, dict]):
    """Generate migration report."""
    print("\n" + "=" * 60)
    print("MIGRATION REPORT")
    print("=" * 60)

    print(f"\nDate: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Artists processed: {len(scores)}")

    # Top changes
    print("\n--- TOP INNOVATION CHANGES ---")
    changes = []
    for artist in artists:
        artist_id = artist["id"]
        if artist_id in scores:
            old = artist["metrics"].get("innovationScore", 0)
            new = scores[artist_id].get("innovation", {}).get("total_score", old)
            changes.append((artist["name"], old, new, new - old))

    for name, old, new, diff in sorted(changes, key=lambda x: -abs(x[3]))[:5]:
        sign = "+" if diff > 0 else ""
        print(f"  {name}: {old} -> {new:.0f} ({sign}{diff:.0f})")

    print("\n--- TOP INTEGRITY CHANGES ---")
    changes = []
    for artist in artists:
        artist_id = artist["id"]
        if artist_id in scores:
            old = artist["metrics"].get("artisticIntegrity", 0)
            new = scores[artist_id].get("integrity", {}).get("total_score", old)
            changes.append((artist["name"], old, new, new - old))

    for name, old, new, diff in sorted(changes, key=lambda x: -abs(x[3]))[:5]:
        sign = "+" if diff > 0 else ""
        print(f"  {name}: {old} -> {new:.0f} ({sign}{diff:.0f})")


def main():
    parser = argparse.ArgumentParser(description="Migrate to objective scoring")
    parser.add_argument("--artist", help="Only process specific artist")
    parser.add_argument("--dry-run", action="store_true", help="Don't save changes")
    parser.add_argument("--skip-collection", action="store_true", help="Skip external data collection")
    args = parser.parse_args()

    print("=" * 60)
    print("OBJECTIVE SCORING MIGRATION")
    print("=" * 60)

    # Load artists
    artists = load_artists()
    print(f"\nLoaded {len(artists)} artists from {ARTISTS_JSON_PATH}")

    # Filter if specific artist requested
    if args.artist:
        artists = [a for a in artists if args.artist.lower() in a["name"].lower()]
        if not artists:
            print(f"Artist '{args.artist}' not found!")
            return
        print(f"Filtered to: {[a['name'] for a in artists]}")

    # Initialize database
    db = LyricsDatabase()

    # Phase 1: Collect external data
    wiki_data, awards_data = collect_external_data(artists, skip=args.skip_collection)

    # Phase 2: Compute scores
    scores = compute_all_scores(artists, db, wiki_data, awards_data)

    # Phase 3: Update JSON
    # Reload full list for update (in case we filtered)
    all_artists = load_artists()
    update_artists_json(all_artists, scores, dry_run=args.dry_run)

    # Generate report
    generate_report(all_artists, scores)

    print("\n" + "=" * 60)
    print("MIGRATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
