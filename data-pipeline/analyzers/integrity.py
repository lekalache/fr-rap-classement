"""Artistic integrity analyzer for measuring artistic vision consistency.

Calculates integrity score based on:
- Consistency (35%): Style stability across career (TF-IDF variance)
- Independence (30%): Label status, release control
- Trend Resistance (20%): Not following mainstream trends
- Feature Selectivity (15%): Feature-to-solo ratio, partner quality
"""

import json
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


@dataclass
class IntegrityMetrics:
    """Integrity metrics for an artist."""
    artist_id: str
    consistency_score: float  # 0-100
    independence_score: float  # 0-100
    trend_resistance: float  # 0-100
    feature_selectivity: float  # 0-100
    total_score: float  # 0-100

    def to_dict(self) -> dict:
        return {
            "artist_id": self.artist_id,
            "consistency_score": round(self.consistency_score, 2),
            "independence_score": round(self.independence_score, 2),
            "trend_resistance": round(self.trend_resistance, 2),
            "feature_selectivity": round(self.feature_selectivity, 2),
            "total_score": round(self.total_score, 2),
        }


# Weights for integrity components
INTEGRITY_WEIGHTS = {
    "consistency": 0.35,
    "independence": 0.30,
    "trend_resistance": 0.20,
    "feature_selectivity": 0.15,
}

# Artist independence data (True = independent/own label)
ARTIST_INDEPENDENCE = {
    "booba": True,  # 92i (own label, very independent)
    "pnl": True,  # QLF Records (own label, famously independent)
    "iam": False,  # Historically signed, later independent
    "nekfeu": True,  # Seine Zoo (own collective)
    "sch": False,  # Rec. 118 / Capitol
    "damso": True,  # 92i at times, now independent
    "kery james": True,  # His own production
    "jul": True,  # D'Or et de Platine (own label, very independent)
    "ninho": False,  # Rec. 118 / Capitol
    "freeze corleone": True,  # 667 (own collective)
    "rim'k": False,  # AP Records
    "rohff": False,  # Various labels
    "lino": True,  # Hostile / Own production
    "vald": True,  # Ekip (own label)
    "youssoupha": True,  # Bomayé Musik
    "sofiane": False,  # Various labels
    "djadja & dinaz": True,  # Independent
    "dosseh": False,  # Def Jam / Capitol
    "flenn": True,  # Independent
    "ziak": True,  # Independent
    "hayce lemsi": True,  # Independent
    "sinik": False,  # Sony BMG
    "guizmo": True,  # Néochrome
    "sadek": False,  # MUSIC
    "bouss": True,  # Independent
    "kaaris": False,  # Therapy Music / Capitol
    "ntm": False,  # Sony historically
    "oxmo puccino": True,  # Wagram / Own production
    "mc solaar": False,  # Polydor
    "la fouine": False,  # Sony
    "lacrim": False,  # Def Jam
    "maes": False,  # Naïve / Capitol
    "gazo": True,  # Drill FR collective
    "soprano": False,  # Rec. 118
    "médine": True,  # Din Records (own label)
    "kalash criminel": False,  # Def Jam
    "seth gueko": True,  # Neochrome
    "alkpote": True,  # Independent
}

# Album counts (for feature selectivity)
ARTIST_ALBUMS = {
    "booba": 10,
    "pnl": 4,
    "iam": 9,
    "nekfeu": 5,
    "sch": 6,
    "damso": 5,
    "kery james": 8,
    "jul": 18,
    "ninho": 6,
    "freeze corleone": 3,
    "rim'k": 7,
    "rohff": 8,
    "lino": 5,
    "vald": 5,
    "youssoupha": 6,
    "sofiane": 5,
    "djadja & dinaz": 5,
    "dosseh": 4,
    "flenn": 2,
    "ziak": 2,
    "hayce lemsi": 4,
    "sinik": 6,
    "guizmo": 5,
    "sadek": 5,
    "bouss": 2,
    "kaaris": 8,
    "ntm": 4,
    "oxmo puccino": 9,
    "mc solaar": 8,
    "la fouine": 8,
    "lacrim": 7,
    "maes": 4,
    "gazo": 3,
    "soprano": 8,
    "médine": 8,
    "kalash criminel": 4,
    "seth gueko": 7,
    "alkpote": 8,
}

# Feature counts (estimated from Genius data)
ARTIST_FEATURES = {
    "booba": 180,
    "pnl": 12,  # Very selective
    "iam": 120,
    "nekfeu": 65,
    "sch": 95,
    "damso": 55,
    "kery james": 95,
    "jul": 220,
    "ninho": 140,
    "freeze corleone": 75,
    "rim'k": 95,
    "rohff": 85,
    "lino": 75,
    "vald": 45,
    "youssoupha": 85,
    "sofiane": 75,
    "djadja & dinaz": 45,
    "dosseh": 85,
    "flenn": 25,
    "ziak": 18,
    "hayce lemsi": 55,
    "sinik": 65,
    "guizmo": 55,
    "sadek": 65,
    "bouss": 20,
    "kaaris": 85,
    "ntm": 40,
    "oxmo puccino": 80,
    "mc solaar": 60,
    "la fouine": 120,
    "lacrim": 95,
    "maes": 70,
    "gazo": 55,
    "soprano": 90,
    "médine": 65,
    "kalash criminel": 75,
    "seth gueko": 110,
    "alkpote": 95,
}

# Trending terms by year (for trend resistance calculation)
TRENDING_TERMS_BY_YEAR = {
    2018: ["drill", "autotune", "gang", "flex", "trap"],
    2019: ["drill", "cloud", "lean", "perco", "drogue"],
    2020: ["drill", "corona", "confine", "masque", "freestyle"],
    2021: ["nft", "crypto", "drill", "afro", "amapiano"],
    2022: ["drill", "jersey", "afro", "plugg", "rage"],
    2023: ["drill", "afro", "amapiano", "rage", "pluggnb"],
    2024: ["drill", "afro", "jersey", "plugg", "phonk"],
}


class IntegrityAnalyzer:
    """Analyzer for computing objective artistic integrity scores."""

    def __init__(self):
        """Initialize the integrity analyzer."""
        self.tokenizer = FrenchTokenizer()

    def calculate_consistency(self, lyrics: str, artist_id: str) -> float:
        """Calculate style consistency across the artist's work.

        Measures how stable the artist's vocabulary and themes are.
        Lower variance in TF-IDF vectors = higher consistency.

        Args:
            lyrics: Artist's combined lyrics.
            artist_id: Artist identifier.

        Returns:
            Consistency score (0-100).
        """
        if not lyrics or not SKLEARN_AVAILABLE:
            return 50.0

        text = filter_french_text(lyrics)
        lemmas = self.tokenizer.lemmatize(text)

        if len(lemmas) < 100:
            return 50.0

        # Split lyrics into chunks (simulating different time periods)
        chunk_size = max(100, len(lemmas) // 10)
        chunks = []
        for i in range(0, len(lemmas) - chunk_size, chunk_size):
            chunk = " ".join(lemmas[i:i + chunk_size])
            if len(chunk.split()) >= 50:
                chunks.append(chunk)

        if len(chunks) < 3:
            return 60.0  # Not enough data

        # Build TF-IDF vectors for each chunk
        vectorizer = TfidfVectorizer(max_features=1000)
        try:
            tfidf_matrix = vectorizer.fit_transform(chunks)
        except ValueError:
            return 60.0

        # Calculate pairwise similarities
        similarities = cosine_similarity(tfidf_matrix)

        # Average similarity (excluding diagonal)
        n = len(chunks)
        total_sim = 0
        count = 0
        for i in range(n):
            for j in range(i + 1, n):
                total_sim += similarities[i][j]
                count += 1

        avg_similarity = total_sim / count if count > 0 else 0.5

        # Higher similarity = higher consistency
        consistency_score = avg_similarity * 100

        return min(100, max(0, consistency_score))

    def calculate_independence(self, artist_id: str) -> float:
        """Calculate independence score based on label status.

        Independent artists who control their own output get higher scores.

        Args:
            artist_id: Artist identifier.

        Returns:
            Independence score (0-100).
        """
        artist_key = artist_id.lower().replace("-", " ").replace("_", " ")
        is_independent = ARTIST_INDEPENDENCE.get(artist_key)

        if is_independent is None:
            return 50.0  # Unknown

        if is_independent:
            base_score = 80.0

            # Bonus for famous independent artists
            legendary_independents = ["pnl", "jul", "booba", "freeze corleone"]
            if artist_key in legendary_independents:
                base_score = 95.0

            return base_score
        else:
            # Signed artists start at 40, can go up based on creative control reputation
            signed_with_control = ["sch", "damso", "nekfeu"]
            if artist_key in signed_with_control:
                return 55.0
            return 40.0

    def calculate_trend_resistance(self, lyrics: str) -> float:
        """Calculate how much an artist resists following trends.

        Measures correlation with trending terms - lower = more resistant.

        Args:
            lyrics: Artist's lyrics.

        Returns:
            Trend resistance score (0-100).
        """
        if not lyrics:
            return 50.0

        lyrics_lower = lyrics.lower()

        # Count trending term usage
        total_trending = 0
        for year, terms in TRENDING_TERMS_BY_YEAR.items():
            for term in terms:
                count = lyrics_lower.count(term)
                total_trending += count

        # Normalize by lyrics length
        word_count = len(lyrics.split())
        if word_count < 100:
            return 50.0

        trend_density = total_trending / (word_count / 1000)

        # Lower trend density = higher resistance
        # Expected range: 0-20 trending terms per 1000 words
        if trend_density < 2:
            resistance_score = 90.0
        elif trend_density < 5:
            resistance_score = 75.0
        elif trend_density < 10:
            resistance_score = 60.0
        elif trend_density < 15:
            resistance_score = 45.0
        else:
            resistance_score = 30.0

        return resistance_score

    def calculate_feature_selectivity(self, artist_id: str) -> float:
        """Calculate feature selectivity score.

        Lower feature-to-album ratio = more selective/higher integrity.

        Args:
            artist_id: Artist identifier.

        Returns:
            Feature selectivity score (0-100).
        """
        artist_key = artist_id.lower().replace("-", " ").replace("_", " ")

        albums = ARTIST_ALBUMS.get(artist_key, 5)
        features = ARTIST_FEATURES.get(artist_key, 50)

        # Feature per album ratio
        feature_ratio = features / albums if albums > 0 else 10

        # Lower ratio = more selective
        # PNL: 3 features/album (very selective)
        # Jul: 12 features/album (many features but still his style)
        # La Fouine: 15 features/album (lots of commercial features)

        if feature_ratio < 5:
            selectivity_score = 95.0
        elif feature_ratio < 10:
            selectivity_score = 80.0
        elif feature_ratio < 15:
            selectivity_score = 65.0
        elif feature_ratio < 20:
            selectivity_score = 50.0
        else:
            selectivity_score = 35.0

        return selectivity_score

    def calculate_integrity_score(self, artist_id: str, lyrics: str) -> IntegrityMetrics:
        """Calculate complete integrity score for an artist.

        Args:
            artist_id: Artist identifier.
            lyrics: Artist's combined lyrics.

        Returns:
            IntegrityMetrics with all component scores.
        """
        # Calculate component scores
        consistency = self.calculate_consistency(lyrics, artist_id)
        independence = self.calculate_independence(artist_id)
        trend_resistance = self.calculate_trend_resistance(lyrics)
        feature_selectivity = self.calculate_feature_selectivity(artist_id)

        # Calculate weighted total
        total = (
            consistency * INTEGRITY_WEIGHTS["consistency"] +
            independence * INTEGRITY_WEIGHTS["independence"] +
            trend_resistance * INTEGRITY_WEIGHTS["trend_resistance"] +
            feature_selectivity * INTEGRITY_WEIGHTS["feature_selectivity"]
        )

        return IntegrityMetrics(
            artist_id=artist_id,
            consistency_score=consistency,
            independence_score=independence,
            trend_resistance=trend_resistance,
            feature_selectivity=feature_selectivity,
            total_score=total,
        )

    def analyze_all_artists(self, all_lyrics: dict[str, str]) -> dict[str, IntegrityMetrics]:
        """Analyze integrity for all artists.

        Args:
            all_lyrics: Dict mapping artist_id to combined lyrics.

        Returns:
            Dict mapping artist_id to IntegrityMetrics.
        """
        results = {}
        for artist_id, lyrics in all_lyrics.items():
            metrics = self.calculate_integrity_score(artist_id, lyrics)
            results[artist_id] = metrics
            print(f"  {artist_id}: {metrics.total_score:.1f}")

        return results


if __name__ == "__main__":
    # Test with sample data
    print("=== Integrity Analyzer Test ===\n")

    analyzer = IntegrityAnalyzer()

    # Test specific artists
    test_artists = {
        "jul": """
        Dans ma paranoïa je suis dans le bloc
        La rue c'est ma vie c'est le sort
        Je tourne en rond dans la ville
        Sous le soleil de Marseille on vit
        Toujours le même son toujours le même style
        Marseille dans le coeur on reste fidèle
        """ * 20,  # Consistent lyrics
        "pnl": """
        Dans la légende on écrit notre histoire
        Entre les tours on cherche la gloire
        Le monde nous observe on reste dans l'ombre
        Deux frères contre le monde
        """ * 20,
        "booba": """
        Dans le game depuis le début
        Ego trip violence et dollars
        Le rap c'est ma street c'est ma vie
        Drill trap autotune flex gang
        """ * 20,
    }

    print("Analyzing artists...")
    results = analyzer.analyze_all_artists(test_artists)

    print("\n=== Results ===")
    for artist_id, metrics in sorted(results.items(), key=lambda x: -x[1].total_score):
        print(f"\n{artist_id.upper()}:")
        print(f"  Consistency: {metrics.consistency_score:.1f}")
        print(f"  Independence: {metrics.independence_score:.1f}")
        print(f"  Trend Resistance: {metrics.trend_resistance:.1f}")
        print(f"  Feature Selectivity: {metrics.feature_selectivity:.1f}")
        print(f"  TOTAL: {metrics.total_score:.1f}")
