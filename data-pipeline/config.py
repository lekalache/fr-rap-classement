"""Configuration settings for the data pipeline."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent
PROJECT_ROOT = BASE_DIR.parent
ARTISTS_JSON_PATH = PROJECT_ROOT / "src" / "data" / "artists.json"
LYRICS_DB_PATH = BASE_DIR / "storage" / "lyrics.db"
LEXICONS_DIR = BASE_DIR / "nlp" / "lexicons"

# Genius API
GENIUS_ACCESS_TOKEN = os.getenv("GENIUS_ACCESS_TOKEN")
GENIUS_CLIENT_ID = os.getenv("GENIUS_CLIENT_ID")
GENIUS_CLIENT_SECRET = os.getenv("GENIUS_CLIENT_SECRET")

# Collection settings
MAX_SONGS_PER_ARTIST = 50
REQUEST_DELAY_SECONDS = 1.0

# Benchmarks (matching scoring.ts)
BENCHMARKS = {
    # Lyrical (automated)
    "uniqueWords": 8000,      # Nekfeu reference
    "flowScore": 100,
    "punchlineScore": 100,
    "hookScore": 100,

    # Innovation (automated)
    "innovationScore": 100,
    "styleCreation": 100,
    "lyricalUniqueness": 100,
    "firstMover": 100,
    "genreFusion": 100,

    # Integrity (automated)
    "artisticIntegrity": 100,
    "consistency": 100,
    "independence": 100,
    "trendResistance": 100,
    "featureSelectivity": 100,

    # Influence (automated)
    "influenceScore": 100,
    "wikipediaMentions": 650,
    "awardsCount": 20,
    "citationNetwork": 100,
    "chartsEfficiency": 100,

    # Thematic (automated)
    "thematicCoherence": 100,

    # Peak (automated)
    "peakAlbumScore": 100,
    "classicTracksCount": 30,
}

# Metric weights (for internal scoring)
FLOW_WEIGHTS = {
    "rhyme_density": 0.40,
    "internal_rhymes": 0.25,
    "syllable_variation": 0.20,
    "multisyllabic": 0.15,
}

PUNCHLINE_WEIGHTS = {
    "semantic_density": 0.30,
    "wordplay": 0.25,
    "metaphors": 0.25,
    "references": 0.20,
}

HOOK_WEIGHTS = {
    "repetition": 0.35,
    "catchiness": 0.30,
    "rhythm": 0.20,
    "brevity": 0.15,
}

# New objective scoring weights
INNOVATION_WEIGHTS = {
    "style_creation": 0.40,
    "lyrical_uniqueness": 0.30,
    "first_mover": 0.20,
    "genre_fusion": 0.10,
}

INTEGRITY_WEIGHTS = {
    "consistency": 0.35,
    "independence": 0.30,
    "trend_resistance": 0.20,
    "feature_selectivity": 0.15,
}

INFLUENCE_WEIGHTS = {
    "wikipedia_presence": 0.25,
    "awards_certifications": 0.25,
    "citation_network": 0.25,
    "charts_efficiency": 0.25,
}

PEAK_WEIGHTS = {
    "peak_album": 0.60,
    "classic_tracks": 0.40,
}
