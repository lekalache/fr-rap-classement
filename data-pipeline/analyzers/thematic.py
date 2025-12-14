"""Thematic coherence analyzer using keyword-based topic detection.

Calculates thematic coherence based on:
- Dominant theme concentration
- Theme entropy (diversity penalty)
"""

import json
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import math

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from nlp.french_tokenizer import FrenchTokenizer
from analyzers.vocabulary import filter_french_text


@dataclass
class ThematicMetrics:
    """Thematic coherence metrics for an artist."""
    artist_id: str
    dominant_theme: str
    dominant_theme_weight: float  # 0-1
    theme_entropy: float  # 0-1 (lower = more coherent)
    coherence_score: float  # 0-100
    theme_distribution: dict[str, float]

    def to_dict(self) -> dict:
        return {
            "artist_id": self.artist_id,
            "dominant_theme": self.dominant_theme,
            "dominant_theme_weight": round(self.dominant_theme_weight, 3),
            "theme_entropy": round(self.theme_entropy, 3),
            "coherence_score": round(self.coherence_score, 2),
            "theme_distribution": {k: round(v, 3) for k, v in self.theme_distribution.items()},
        }


# Theme keywords for French rap
THEME_KEYWORDS = {
    "street": [
        "rue", "quartier", "bloc", "béton", "ghetto", "cité", "bitume",
        "trafic", "deal", "stup", "bicrave", "weed", "shit", "cocaine",
        "flic", "bac", "garde à vue", "prison", "taule", "cellule",
        "gang", "bande", "crew", "équipe", "frères", "gars", "mecs",
    ],
    "money": [
        "argent", "billet", "euro", "liasse", "cash", "thune", "oseille",
        "fric", "blé", "money", "fortune", "riche", "millionnaire",
        "business", "hustle", "grind", "travail", "entreprise",
        "rolex", "mercedes", "bmw", "luxe", "chaîne", "diamant",
    ],
    "love": [
        "amour", "cœur", "aimer", "femme", "fille", "belle", "beauté",
        "sentiment", "relation", "couple", "mariage", "famille",
        "maman", "mère", "père", "enfant", "fils", "fille",
        "trahison", "mensonge", "tromperie", "rupture", "séparation",
    ],
    "party": [
        "fête", "danse", "danser", "club", "nuit", "bouteille", "champagne",
        "alcool", "vodka", "hennessy", "whisky", "boire", "ivre",
        "ambiance", "soirée", "musique", "dj", "boîte", "discothèque",
    ],
    "conscious": [
        "société", "politique", "système", "justice", "injustice", "police",
        "racisme", "discrimination", "média", "mensonge", "vérité",
        "peuple", "révolution", "combat", "lutte", "résistance",
        "éducation", "école", "histoire", "france", "banlieue",
    ],
    "spiritual": [
        "dieu", "allah", "prière", "prier", "foi", "croire", "religion",
        "âme", "esprit", "destin", "karma", "paradis", "enfer",
        "mort", "vie", "éternel", "bénédiction", "miracle",
    ],
    "ego": [
        "roi", "boss", "patron", "numéro un", "meilleur", "légende",
        "goat", "first", "top", "champion", "victoire", "succès",
        "respect", "réputation", "nom", "legacy", "histoire",
        "haters", "jaloux", "envieux", "ennemis", "clash",
    ],
}


class ThematicAnalyzer:
    """Analyzer for computing thematic coherence scores."""

    def __init__(self):
        """Initialize the thematic analyzer."""
        self.tokenizer = FrenchTokenizer()

    def detect_themes(self, lyrics: str) -> dict[str, float]:
        """Detect theme distribution in lyrics.

        Args:
            lyrics: Artist's combined lyrics.

        Returns:
            Dict mapping theme names to their weights (0-1).
        """
        if not lyrics:
            return {theme: 0 for theme in THEME_KEYWORDS}

        text = filter_french_text(lyrics.lower())
        words = text.split()
        total_words = len(words)

        if total_words < 100:
            return {theme: 0 for theme in THEME_KEYWORDS}

        # Count theme keyword occurrences
        theme_counts = {}
        for theme, keywords in THEME_KEYWORDS.items():
            count = sum(1 for word in words if word in keywords)
            theme_counts[theme] = count

        # Normalize to weights
        total_theme_words = sum(theme_counts.values())
        if total_theme_words == 0:
            return {theme: 1 / len(THEME_KEYWORDS) for theme in THEME_KEYWORDS}

        theme_weights = {
            theme: count / total_theme_words
            for theme, count in theme_counts.items()
        }

        return theme_weights

    def calculate_entropy(self, distribution: dict[str, float]) -> float:
        """Calculate Shannon entropy of theme distribution.

        Lower entropy = more focused on specific themes = more coherent.

        Args:
            distribution: Theme weight distribution.

        Returns:
            Normalized entropy (0-1).
        """
        entropy = 0.0
        for weight in distribution.values():
            if weight > 0:
                entropy -= weight * math.log2(weight)

        # Normalize by max entropy (uniform distribution)
        max_entropy = math.log2(len(distribution))
        if max_entropy > 0:
            normalized_entropy = entropy / max_entropy
        else:
            normalized_entropy = 0

        return normalized_entropy

    def calculate_coherence_score(self, lyrics: str, artist_id: str) -> ThematicMetrics:
        """Calculate thematic coherence score.

        Args:
            lyrics: Artist's combined lyrics.
            artist_id: Artist identifier.

        Returns:
            ThematicMetrics with coherence analysis.
        """
        # Detect theme distribution
        theme_distribution = self.detect_themes(lyrics)

        # Find dominant theme
        if theme_distribution:
            dominant_theme = max(theme_distribution, key=theme_distribution.get)
            dominant_weight = theme_distribution[dominant_theme]
        else:
            dominant_theme = "unknown"
            dominant_weight = 0

        # Calculate entropy
        entropy = self.calculate_entropy(theme_distribution)

        # Coherence score = high dominant weight + low entropy
        # Formula: (dominant_weight * 100) * (1 - entropy * 0.5)
        coherence = (dominant_weight * 100) * (1 - entropy * 0.5)

        # Scale to 0-100
        coherence_score = min(100, max(0, coherence * 2))

        return ThematicMetrics(
            artist_id=artist_id,
            dominant_theme=dominant_theme,
            dominant_theme_weight=dominant_weight,
            theme_entropy=entropy,
            coherence_score=coherence_score,
            theme_distribution=theme_distribution,
        )

    def analyze_all_artists(self, all_lyrics: dict[str, str]) -> dict[str, ThematicMetrics]:
        """Analyze thematic coherence for all artists.

        Args:
            all_lyrics: Dict mapping artist_id to combined lyrics.

        Returns:
            Dict mapping artist_id to ThematicMetrics.
        """
        results = {}
        for artist_id, lyrics in all_lyrics.items():
            metrics = self.calculate_coherence_score(lyrics, artist_id)
            results[artist_id] = metrics
            print(f"  {artist_id}: {metrics.coherence_score:.1f} (dominant: {metrics.dominant_theme})")

        return results


if __name__ == "__main__":
    print("=== Thematic Analyzer Test ===\n")

    analyzer = ThematicAnalyzer()

    test_lyrics = {
        "kery_james": """
        La société nous ment le système nous opprime
        La police nous traque la justice nous condamne
        Le peuple se réveille la révolution arrive
        L'éducation est la clé contre l'ignorance
        La france oublie ses enfants de banlieue
        """ * 20,
        "jul": """
        Dans le quartier on fait du biff on compte les billets
        La rue c'est notre vie le bloc notre maison
        Les frères sont là on bicrave pour manger
        La fête ce soir champagne et bouteilles
        Les femmes sont belles l'amour est compliqué
        """ * 20,
        "pnl": """
        L'âme errante dans la cité béton gris
        Le destin nous guide allah nous protège
        La famille c'est sacré les frères c'est la vie
        L'argent ne fait pas le bonheur mais aide
        La vie est dure mais on garde la foi
        """ * 20,
    }

    print("Analyzing themes...")
    results = analyzer.analyze_all_artists(test_lyrics)

    print("\n=== Results ===")
    for artist_id, metrics in sorted(results.items(), key=lambda x: -x[1].coherence_score):
        print(f"\n{artist_id.upper()}:")
        print(f"  Dominant Theme: {metrics.dominant_theme}")
        print(f"  Dominant Weight: {metrics.dominant_theme_weight:.2%}")
        print(f"  Entropy: {metrics.theme_entropy:.3f}")
        print(f"  Coherence Score: {metrics.coherence_score:.1f}")
        print(f"  Distribution: {', '.join(f'{k}:{v:.1%}' for k, v in sorted(metrics.theme_distribution.items(), key=lambda x: -x[1])[:3])}")
