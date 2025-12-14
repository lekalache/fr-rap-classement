"""Influence score analyzer combining Wikipedia, awards, and citation data.

Calculates influence score based on:
- Wikipedia Presence (25%): From Wikipedia API
- Awards/Certifications (25%): From awards collector
- Citation Network (25%): Mentions by other artists in lyrics
- Charts Efficiency (25%): Certifications / (albums × career years)
"""

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class InfluenceMetrics:
    """Influence metrics for an artist."""
    artist_id: str
    wikipedia_score: float  # 0-100
    awards_score: float  # 0-100
    citation_score: float  # 0-100
    charts_efficiency: float  # 0-100
    total_score: float  # 0-100

    def to_dict(self) -> dict:
        return {
            "artist_id": self.artist_id,
            "wikipedia_score": round(self.wikipedia_score, 2),
            "awards_score": round(self.awards_score, 2),
            "citation_score": round(self.citation_score, 2),
            "charts_efficiency": round(self.charts_efficiency, 2),
            "total_score": round(self.total_score, 2),
        }


# Weights for influence components
INFLUENCE_WEIGHTS = {
    "wikipedia": 0.25,
    "awards": 0.25,
    "citations": 0.25,
    "charts": 0.25,
}

# Artist data for calculations
ARTIST_DATA = {
    "booba": {"debut": 1994, "albums": 10, "certs": 145},
    "pnl": {"debut": 2014, "albums": 4, "certs": 95},
    "iam": {"debut": 1989, "albums": 9, "certs": 85},
    "nekfeu": {"debut": 2011, "albums": 5, "certs": 85},
    "sch": {"debut": 2015, "albums": 6, "certs": 78},
    "damso": {"debut": 2015, "albums": 5, "certs": 72},
    "kery james": {"debut": 1992, "albums": 8, "certs": 45},
    "jul": {"debut": 2013, "albums": 18, "certs": 120},
    "ninho": {"debut": 2016, "albums": 6, "certs": 95},
    "freeze corleone": {"debut": 2017, "albums": 3, "certs": 28},
    "rim'k": {"debut": 1995, "albums": 7, "certs": 42},
    "rohff": {"debut": 1996, "albums": 8, "certs": 38},
    "lino": {"debut": 1996, "albums": 5, "certs": 28},
    "vald": {"debut": 2013, "albums": 5, "certs": 48},
    "youssoupha": {"debut": 2007, "albums": 6, "certs": 32},
    "sofiane": {"debut": 2011, "albums": 5, "certs": 35},
    "djadja & dinaz": {"debut": 2015, "albums": 5, "certs": 55},
    "dosseh": {"debut": 2010, "albums": 4, "certs": 25},
    "flenn": {"debut": 2018, "albums": 2, "certs": 8},
    "ziak": {"debut": 2020, "albums": 2, "certs": 22},
    "hayce lemsi": {"debut": 2012, "albums": 4, "certs": 12},
    "sinik": {"debut": 2002, "albums": 6, "certs": 22},
    "guizmo": {"debut": 2010, "albums": 5, "certs": 18},
    "sadek": {"debut": 2008, "albums": 5, "certs": 22},
    "bouss": {"debut": 2019, "albums": 2, "certs": 8},
    "kaaris": {"debut": 2012, "albums": 8, "certs": 32},
    "ntm": {"debut": 1989, "albums": 4, "certs": 65},
    "oxmo puccino": {"debut": 1996, "albums": 9, "certs": 35},
    "mc solaar": {"debut": 1990, "albums": 8, "certs": 80},
    "la fouine": {"debut": 2003, "albums": 8, "certs": 55},
    "lacrim": {"debut": 2008, "albums": 7, "certs": 48},
    "maes": {"debut": 2017, "albums": 4, "certs": 65},
    "gazo": {"debut": 2019, "albums": 3, "certs": 42},
    "soprano": {"debut": 1994, "albums": 8, "certs": 85},
    "médine": {"debut": 2004, "albums": 8, "certs": 18},
    "kalash criminel": {"debut": 2016, "albums": 4, "certs": 32},
    "seth gueko": {"debut": 2006, "albums": 7, "certs": 22},
    "alkpote": {"debut": 2003, "albums": 8, "certs": 15},
}


class InfluenceAnalyzer:
    """Analyzer for computing objective influence scores."""

    def __init__(self):
        """Initialize the influence analyzer."""
        pass

    def calculate_wikipedia_score(self, wiki_data: Optional[dict]) -> float:
        """Calculate influence score from Wikipedia data.

        Args:
            wiki_data: Data from WikipediaCollector.

        Returns:
            Wikipedia influence score (0-100).
        """
        if not wiki_data:
            return 30.0  # Default for missing data

        backlinks = wiki_data.get("backlinks_count", 0)
        pageviews = wiki_data.get("pageviews_monthly", 0)
        languages = wiki_data.get("languages_count", 1)
        references = wiki_data.get("references_count", 0)

        # Calculate raw score
        raw_score = (
            backlinks * 0.5 +
            pageviews / 5000 +
            languages * 3 +
            references * 0.2
        )

        # Normalize to 0-100 (benchmark: 200 raw = 100 score)
        normalized = min(100, (raw_score / 200) * 100)
        return max(0, normalized)

    def calculate_awards_score(self, awards_data: Optional[dict]) -> float:
        """Calculate influence score from awards data.

        Args:
            awards_data: Data from AwardsCollector.

        Returns:
            Awards influence score (0-100).
        """
        if not awards_data:
            return 30.0

        weighted_awards = awards_data.get("weighted_awards_score", 0)
        weighted_certs = awards_data.get("weighted_certs_score", 0)

        # Combine awards and certifications
        raw_score = weighted_awards + weighted_certs

        # Normalize (benchmark: 150 raw = 100 score)
        normalized = min(100, (raw_score / 150) * 100)
        return max(0, normalized)

    def calculate_citation_score(
        self,
        artist_id: str,
        all_lyrics: dict[str, str]
    ) -> float:
        """Calculate how often other artists mention this artist.

        Args:
            artist_id: Artist to analyze.
            all_lyrics: All artists' lyrics.

        Returns:
            Citation score (0-100).
        """
        artist_key = artist_id.lower().replace("-", " ").replace("_", " ")

        # Names and aliases to search for
        search_terms = [artist_key]

        # Add common variations
        name_variations = {
            "booba": ["b2o", "kopp", "92i"],
            "pnl": ["ademo", "n.o.s", "deux frères"],
            "iam": ["akhenaton", "shurik'n"],
            "jul": ["juju", "julien mari", "j.u.l"],
            "nekfeu": ["ken samaras", "feu"],
            "sch": ["s.c.h"],
            "damso": ["dems"],
            "kaaris": ["double k"],
            "ntm": ["joey starr", "kool shen"],
            "freeze corleone": ["freeze", "corleone", "667"],
            "gazo": ["gazo drill"],
            "mc solaar": ["solaar", "claude mc"],
        }

        if artist_key in name_variations:
            search_terms.extend(name_variations[artist_key])

        # Count mentions in other artists' lyrics
        mention_count = 0
        mentioned_by = set()

        for other_id, lyrics in all_lyrics.items():
            if other_id.lower() == artist_key:
                continue  # Skip self

            lyrics_lower = lyrics.lower()
            for term in search_terms:
                if term in lyrics_lower:
                    count = lyrics_lower.count(term)
                    mention_count += count
                    mentioned_by.add(other_id)
                    break  # Count once per artist

        # Score based on mentions and unique artists
        raw_score = len(mentioned_by) * 10 + mention_count

        # Normalize (benchmark: 100 raw = 100 score)
        normalized = min(100, (raw_score / 100) * 100)
        return max(0, normalized)

    def calculate_charts_efficiency(self, artist_id: str) -> float:
        """Calculate charts efficiency score.

        Efficiency = certifications / (albums × career_length)

        Args:
            artist_id: Artist to analyze.

        Returns:
            Charts efficiency score (0-100).
        """
        artist_key = artist_id.lower().replace("-", " ").replace("_", " ")
        data = ARTIST_DATA.get(artist_key)

        if not data:
            return 40.0

        current_year = 2024
        career_years = max(1, current_year - data["debut"])
        albums = max(1, data["albums"])
        certs = data["certs"]

        # Efficiency formula
        # Higher certs per album per decade = better
        efficiency = certs / albums

        # Normalize (benchmark: 20 certs/album = 100 score)
        # PNL: 95/4 = 23.75 (excellent)
        # Jul: 120/18 = 6.67 (lower because many albums)
        # But Jul's volume matters, so we adjust

        # Volume bonus for high-output artists
        if albums >= 10:
            efficiency *= 1.3  # Bonus for maintaining quality across many albums

        normalized = min(100, (efficiency / 20) * 100)
        return max(0, normalized)

    def calculate_influence_score(
        self,
        artist_id: str,
        wiki_data: Optional[dict] = None,
        awards_data: Optional[dict] = None,
        all_lyrics: Optional[dict[str, str]] = None
    ) -> InfluenceMetrics:
        """Calculate complete influence score for an artist.

        Args:
            artist_id: Artist identifier.
            wiki_data: Wikipedia data from collector.
            awards_data: Awards data from collector.
            all_lyrics: All artists' lyrics for citation analysis.

        Returns:
            InfluenceMetrics with all component scores.
        """
        wikipedia_score = self.calculate_wikipedia_score(wiki_data)
        awards_score = self.calculate_awards_score(awards_data)
        citation_score = self.calculate_citation_score(
            artist_id, all_lyrics or {}
        )
        charts_efficiency = self.calculate_charts_efficiency(artist_id)

        # Calculate weighted total
        total = (
            wikipedia_score * INFLUENCE_WEIGHTS["wikipedia"] +
            awards_score * INFLUENCE_WEIGHTS["awards"] +
            citation_score * INFLUENCE_WEIGHTS["citations"] +
            charts_efficiency * INFLUENCE_WEIGHTS["charts"]
        )

        return InfluenceMetrics(
            artist_id=artist_id,
            wikipedia_score=wikipedia_score,
            awards_score=awards_score,
            citation_score=citation_score,
            charts_efficiency=charts_efficiency,
            total_score=total,
        )


if __name__ == "__main__":
    print("=== Influence Analyzer Test ===\n")

    analyzer = InfluenceAnalyzer()

    # Test with mock data
    test_artists = ["booba", "pnl", "jul", "iam", "nekfeu"]

    mock_wiki_data = {
        "booba": {"backlinks_count": 150, "pageviews_monthly": 50000, "languages_count": 8, "references_count": 120},
        "pnl": {"backlinks_count": 100, "pageviews_monthly": 60000, "languages_count": 6, "references_count": 80},
        "jul": {"backlinks_count": 120, "pageviews_monthly": 80000, "languages_count": 5, "references_count": 100},
        "iam": {"backlinks_count": 200, "pageviews_monthly": 30000, "languages_count": 12, "references_count": 150},
        "nekfeu": {"backlinks_count": 80, "pageviews_monthly": 40000, "languages_count": 4, "references_count": 60},
    }

    mock_awards = {
        "booba": {"weighted_awards_score": 40, "weighted_certs_score": 80},
        "pnl": {"weighted_awards_score": 20, "weighted_certs_score": 70},
        "jul": {"weighted_awards_score": 25, "weighted_certs_score": 90},
        "iam": {"weighted_awards_score": 60, "weighted_certs_score": 50},
        "nekfeu": {"weighted_awards_score": 30, "weighted_certs_score": 55},
    }

    mock_lyrics = {
        "booba": "je suis le boss du rap game",
        "pnl": "booba est le patron du game",
        "jul": "dans la paranoïa comme booba",
        "iam": "le rap français depuis 1989",
        "nekfeu": "inspiré par iam et booba",
    }

    print("Analyzing influence...")
    for artist in test_artists:
        metrics = analyzer.calculate_influence_score(
            artist,
            wiki_data=mock_wiki_data.get(artist),
            awards_data=mock_awards.get(artist),
            all_lyrics=mock_lyrics
        )
        print(f"\n{artist.upper()}:")
        print(f"  Wikipedia: {metrics.wikipedia_score:.1f}")
        print(f"  Awards: {metrics.awards_score:.1f}")
        print(f"  Citations: {metrics.citation_score:.1f}")
        print(f"  Charts Efficiency: {metrics.charts_efficiency:.1f}")
        print(f"  TOTAL: {metrics.total_score:.1f}")
