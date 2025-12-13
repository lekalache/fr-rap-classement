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
    "uniqueWords": 8000,      # Nekfeu reference
    "flowScore": 100,
    "punchlineScore": 100,
    "hookScore": 100,
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
