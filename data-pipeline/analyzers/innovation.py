"""Innovation score analyzer using TF-IDF style fingerprinting.

Calculates innovation score based on:
- Style Creation (40%): TF-IDF fingerprint uniqueness
- Lyrical Uniqueness (30%): Hapax ratio, neologisms, slang creation
- First-Mover Timing (20%): Years ahead of style mainstream
- Genre Fusion (10%): Multi-language, topic diversity
"""

import json
import re
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import numpy as np

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from nlp.french_tokenizer import FrenchTokenizer
from analyzers.vocabulary import filter_french_text

# Try to import sklearn for TF-IDF
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: sklearn not available. Using simplified innovation scoring.")


@dataclass
class InnovationMetrics:
    """Innovation metrics for an artist."""
    artist_id: str
    style_uniqueness: float  # 0-100
    vocabulary_distinctiveness: float  # 0-100
    first_mover_score: float  # 0-100
    genre_fusion_score: float  # 0-100
    total_score: float  # 0-100

    def to_dict(self) -> dict:
        return {
            "artist_id": self.artist_id,
            "style_uniqueness": round(self.style_uniqueness, 2),
            "vocabulary_distinctiveness": round(self.vocabulary_distinctiveness, 2),
            "first_mover_score": round(self.first_mover_score, 2),
            "genre_fusion_score": round(self.genre_fusion_score, 2),
            "total_score": round(self.total_score, 2),
        }


# Weights for innovation components
INNOVATION_WEIGHTS = {
    "style_creation": 0.40,
    "lyrical_uniqueness": 0.30,
    "first_mover": 0.20,
    "genre_fusion": 0.10,
}

# Artist debut years for first-mover calculation
ARTIST_DEBUT_YEARS = {
    "booba": 1994,
    "pnl": 2014,
    "iam": 1989,
    "nekfeu": 2011,
    "sch": 2015,
    "damso": 2015,
    "kery james": 1992,
    "jul": 2013,
    "ninho": 2016,
    "freeze corleone": 2017,
    "rim'k": 1995,
    "rohff": 1996,
    "lino": 1996,
    "vald": 2013,
    "youssoupha": 2007,
    "sofiane": 2011,
    "djadja & dinaz": 2015,
    "dosseh": 2010,
    "flenn": 2018,
    "ziak": 2020,
    "hayce lemsi": 2012,
    "sinik": 2002,
    "guizmo": 2010,
    "sadek": 2008,
    "bouss": 2019,
    "kaaris": 2012,
    "ntm": 1989,
    "oxmo puccino": 1996,
    "mc solaar": 1990,
    "la fouine": 2003,
    "lacrim": 2008,
    "maes": 2017,
    "gazo": 2019,
    "soprano": 1994,
    "médine": 2004,
    "kalash criminel": 2016,
    "seth gueko": 2006,
    "alkpote": 2003,
}

# Style pioneers - artists who created recognizable styles
# Key: style name, Value: (pioneer artist, year style became mainstream)
STYLE_PIONEERS = {
    "melodic_marseille": ("jul", 2016),  # "Le type Jul"
    "cloud_rap_fr": ("pnl", 2016),
    "drill_fr": ("freeze corleone", 2020),
    "ego_trip_hardcore": ("booba", 2002),
    "boom_bap_conscious": ("iam", 1997),
    "afro_trap": ("ninho", 2018),
    "trap_melodique": ("damso", 2017),
    "melo_rap": ("soprano", 2016),
}


class InnovationAnalyzer:
    """Analyzer for computing objective innovation scores."""

    def __init__(self):
        """Initialize the innovation analyzer."""
        self.tokenizer = FrenchTokenizer()
        self.tfidf_vectorizer = None
        self.artist_vectors = {}
        self.corpus_vocab = None  # Pre-built corpus vocabulary
        self.artist_lemmas_cache = {}  # Cache for lemmatized lyrics

    def _build_corpus_vocab(self, all_lyrics: dict[str, str]):
        """Pre-build corpus vocabulary for all artists (called once).

        Args:
            all_lyrics: Dict mapping artist_id to combined lyrics.
        """
        if self.corpus_vocab is not None:
            return  # Already built

        print("  Building corpus vocabulary...")
        self.corpus_vocab = set()

        for artist_id, lyrics in all_lyrics.items():
            text = filter_french_text(lyrics)
            # Simple word splitting instead of expensive lemmatization
            words = set(text.lower().split()[:3000])
            self.artist_lemmas_cache[artist_id] = words
            self.corpus_vocab.update(words)

        print(f"  Corpus: {len(self.corpus_vocab)} unique words from {len(all_lyrics)} artists")

    def _build_tfidf_model(self, all_lyrics: dict[str, str]):
        """Build TF-IDF model from all artists' lyrics.

        Args:
            all_lyrics: Dict mapping artist_id to combined lyrics.
        """
        if not SKLEARN_AVAILABLE:
            return

        # Preprocess lyrics - use simpler approach for performance
        processed_texts = {}
        for artist_id, lyrics in all_lyrics.items():
            text = filter_french_text(lyrics)
            # Simple tokenization (skip heavy lemmatization for performance)
            words = text.lower().split()[:5000]  # Limit words per artist
            processed_texts[artist_id] = " ".join(words)

        # Build TF-IDF vectorizer with reduced complexity
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,  # Reduced from 5000
            ngram_range=(1, 2),  # Only unigrams and bigrams
            min_df=2,
            max_df=0.90,
        )

        # Fit and transform
        artist_ids = list(processed_texts.keys())
        texts = [processed_texts[aid] for aid in artist_ids]

        try:
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)
            # Store vectors
            for i, artist_id in enumerate(artist_ids):
                self.artist_vectors[artist_id] = tfidf_matrix[i]
        except Exception as e:
            print(f"TF-IDF build failed: {e}")

    def calculate_style_uniqueness(self, artist_id: str) -> float:
        """Calculate how unique an artist's style fingerprint is.

        Uses TF-IDF cosine distance from centroid of all artists.

        Args:
            artist_id: Artist to analyze.

        Returns:
            Style uniqueness score (0-100).
        """
        if not SKLEARN_AVAILABLE or artist_id not in self.artist_vectors:
            return 50.0  # Default if TF-IDF not available

        # Get artist vector
        artist_vec = self.artist_vectors[artist_id]

        # Calculate centroid of all artists
        all_vectors = list(self.artist_vectors.values())
        if len(all_vectors) < 2:
            return 50.0

        # Stack vectors and calculate mean
        stacked = np.vstack([v.toarray() for v in all_vectors])
        centroid = np.mean(stacked, axis=0).reshape(1, -1)

        # Calculate cosine distance from centroid
        artist_array = artist_vec.toarray()
        similarity = cosine_similarity(artist_array, centroid)[0][0]

        # Convert similarity to uniqueness (lower similarity = more unique)
        uniqueness = (1 - similarity) * 100

        # Also measure distance to closest neighbor
        min_similarity = 1.0
        for other_id, other_vec in self.artist_vectors.items():
            if other_id != artist_id:
                sim = cosine_similarity(artist_array, other_vec.toarray())[0][0]
                min_similarity = min(min_similarity, sim)

        # Combine centroid distance and nearest neighbor distance
        neighbor_uniqueness = (1 - min_similarity) * 100
        combined = (uniqueness * 0.6 + neighbor_uniqueness * 0.4)

        return min(100, max(0, combined))

    def calculate_vocabulary_distinctiveness(self, lyrics: str, all_lyrics: dict[str, str], artist_id: str = "") -> float:
        """Calculate how distinctive an artist's vocabulary is.

        Measures:
        - Hapax legomena ratio (words used only once)
        - Unique terms vs corpus

        Args:
            lyrics: Artist's combined lyrics.
            all_lyrics: All artists' lyrics for comparison.
            artist_id: Artist identifier for cache lookup.

        Returns:
            Vocabulary distinctiveness score (0-100).
        """
        if not lyrics:
            return 0.0

        # Use cached vocab if available, otherwise build it
        if artist_id and artist_id in self.artist_lemmas_cache:
            words = list(self.artist_lemmas_cache[artist_id])
        else:
            text = filter_french_text(lyrics)
            words = text.lower().split()[:3000]

        if not words:
            return 0.0

        # 1. Hapax legomena ratio (words used only once)
        word_counts = Counter(words)
        hapax_count = sum(1 for count in word_counts.values() if count == 1)
        hapax_ratio = hapax_count / len(word_counts) if word_counts else 0
        hapax_score = min(100, hapax_ratio * 150)

        # 2. Unique terms vs corpus (use pre-built corpus)
        artist_vocab = set(words)

        # Build corpus vocab if not already done
        if self.corpus_vocab is None:
            self._build_corpus_vocab(all_lyrics)

        # Terms unique to this artist (not in other artists' combined vocab)
        # Exclude artist's own words from corpus for fair comparison
        other_vocab = self.corpus_vocab - artist_vocab
        unique_terms = artist_vocab - other_vocab
        uniqueness_ratio = len(unique_terms) / len(artist_vocab) if artist_vocab else 0
        uniqueness_score = min(100, uniqueness_ratio * 100)

        # Combine scores (simplified - removed expensive trigram calculation)
        final_score = hapax_score * 0.5 + uniqueness_score * 0.5

        return min(100, max(0, final_score))

    def calculate_first_mover_score(self, artist_id: str) -> float:
        """Calculate first-mover advantage for style pioneering.

        Artists who created styles before they became mainstream get higher scores.

        Args:
            artist_id: Artist to analyze.

        Returns:
            First-mover score (0-100).
        """
        artist_key = artist_id.lower().replace("-", " ").replace("_", " ")
        debut_year = ARTIST_DEBUT_YEARS.get(artist_key)

        if not debut_year:
            return 30.0  # Default for unknown artists

        base_score = 30.0  # Everyone gets some base score

        # Check if this artist pioneered any style
        for style_name, (pioneer, mainstream_year) in STYLE_PIONEERS.items():
            if pioneer == artist_key:
                # Calculate years ahead of mainstream
                years_ahead = mainstream_year - debut_year
                pioneer_bonus = min(50, years_ahead * 15)  # Up to 50 bonus points
                base_score += pioneer_bonus
                break

        # Longevity bonus - earlier artists had to innovate more
        current_year = 2024
        career_length = current_year - debut_year
        longevity_bonus = min(20, career_length / 2)  # Up to 20 points for 40+ years

        return min(100, base_score + longevity_bonus)

    def calculate_genre_fusion(self, lyrics: str) -> float:
        """Calculate genre/style fusion score.

        Measures:
        - Multi-language presence
        - Topic diversity
        - Musical style mixing indicators

        Args:
            lyrics: Artist's lyrics.

        Returns:
            Genre fusion score (0-100).
        """
        if not lyrics:
            return 0.0

        score = 0.0

        # 1. Multi-language detection
        # Check for Arabic words (transliterated)
        arabic_indicators = ["wallah", "hamdoulah", "inshallah", "bismillah", "mashallah",
                           "haram", "halal", "akhi", "khoya", "kelb", "sahbi"]
        arabic_count = sum(1 for word in arabic_indicators if word in lyrics.lower())
        if arabic_count > 0:
            score += min(25, arabic_count * 5)

        # Check for English words
        english_indicators = ["money", "street", "game", "real", "fuck", "shit",
                            "bitch", "hustle", "grind", "gang", "flow"]
        english_count = sum(1 for word in english_indicators if word in lyrics.lower())
        if english_count > 0:
            score += min(15, english_count * 3)

        # Check for Spanish/Portuguese
        spanish_indicators = ["amigo", "loco", "nada", "vida", "amor", "fuego"]
        spanish_count = sum(1 for word in spanish_indicators if word in lyrics.lower())
        if spanish_count > 0:
            score += min(10, spanish_count * 5)

        # 2. Topic diversity (indicated by keyword variety)
        topic_keywords = {
            "street": ["rue", "quartier", "bloc", "béton", "ghetto", "cité"],
            "money": ["argent", "billet", "euros", "liasse", "fortune", "riche"],
            "love": ["amour", "cœur", "aimer", "femme", "belle", "sentiment"],
            "party": ["fête", "danse", "club", "nuit", "bouteille", "champagne"],
            "conscious": ["société", "politique", "système", "justice", "peuple"],
            "spiritual": ["dieu", "prière", "foi", "âme", "destin", "paradis"],
        }

        topics_present = 0
        for topic, keywords in topic_keywords.items():
            if any(kw in lyrics.lower() for kw in keywords):
                topics_present += 1

        topic_diversity_score = (topics_present / len(topic_keywords)) * 50
        score += topic_diversity_score

        return min(100, max(0, score))

    def calculate_innovation_score(
        self,
        artist_id: str,
        lyrics: str,
        all_lyrics: dict[str, str]
    ) -> InnovationMetrics:
        """Calculate complete innovation score for an artist.

        Args:
            artist_id: Artist identifier.
            lyrics: Artist's combined lyrics.
            all_lyrics: All artists' lyrics for comparison.

        Returns:
            InnovationMetrics with all component scores.
        """
        # Build TF-IDF model and corpus if needed
        if not self.artist_vectors and all_lyrics:
            self._build_tfidf_model(all_lyrics)
        if self.corpus_vocab is None and all_lyrics:
            self._build_corpus_vocab(all_lyrics)

        # Calculate component scores
        style_uniqueness = self.calculate_style_uniqueness(artist_id)
        vocab_distinctiveness = self.calculate_vocabulary_distinctiveness(lyrics, all_lyrics, artist_id)
        first_mover = self.calculate_first_mover_score(artist_id)
        genre_fusion = self.calculate_genre_fusion(lyrics)

        # Calculate weighted total
        total = (
            style_uniqueness * INNOVATION_WEIGHTS["style_creation"] +
            vocab_distinctiveness * INNOVATION_WEIGHTS["lyrical_uniqueness"] +
            first_mover * INNOVATION_WEIGHTS["first_mover"] +
            genre_fusion * INNOVATION_WEIGHTS["genre_fusion"]
        )

        return InnovationMetrics(
            artist_id=artist_id,
            style_uniqueness=style_uniqueness,
            vocabulary_distinctiveness=vocab_distinctiveness,
            first_mover_score=first_mover,
            genre_fusion_score=genre_fusion,
            total_score=total,
        )

    def analyze_all_artists(self, all_lyrics: dict[str, str]) -> dict[str, InnovationMetrics]:
        """Analyze innovation for all artists.

        Args:
            all_lyrics: Dict mapping artist_id to combined lyrics.

        Returns:
            Dict mapping artist_id to InnovationMetrics.
        """
        # Build TF-IDF model first
        self._build_tfidf_model(all_lyrics)

        results = {}
        for artist_id, lyrics in all_lyrics.items():
            metrics = self.calculate_innovation_score(artist_id, lyrics, all_lyrics)
            results[artist_id] = metrics
            print(f"  {artist_id}: {metrics.total_score:.1f}")

        return results


if __name__ == "__main__":
    # Test with sample data
    print("=== Innovation Analyzer Test ===\n")

    analyzer = InnovationAnalyzer()

    # Test lyrics (simplified)
    test_lyrics = {
        "jul": """
        Dans ma paranoïa je suis dans le bloc
        La rue c'est ma vie wallah c'est le sort
        Je tourne en rond dans la ville grise
        Sous le soleil de Marseille on improvise
        """,
        "booba": """
        Dans le game depuis le début
        Égo trip sur les beats du futur
        Le rap c'est ma street c'est ma vie
        Violence et dollars c'est ainsi
        """,
        "pnl": """
        Dans la légende on écrit notre histoire
        Entre les tours on cherche la gloire
        Le monde nous observe on reste dans l'ombre
        Deux frères contre le monde sans relâche
        """,
    }

    print("Analyzing artists...")
    results = analyzer.analyze_all_artists(test_lyrics)

    print("\n=== Results ===")
    for artist_id, metrics in sorted(results.items(), key=lambda x: -x[1].total_score):
        print(f"\n{artist_id.upper()}:")
        print(f"  Style Uniqueness: {metrics.style_uniqueness:.1f}")
        print(f"  Vocab Distinctiveness: {metrics.vocabulary_distinctiveness:.1f}")
        print(f"  First-Mover Score: {metrics.first_mover_score:.1f}")
        print(f"  Genre Fusion: {metrics.genre_fusion_score:.1f}")
        print(f"  TOTAL: {metrics.total_score:.1f}")
