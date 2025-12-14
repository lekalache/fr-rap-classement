"""Awards and certifications collector for French rappers."""

import time
from typing import Optional
from dataclasses import dataclass, field
import requests
from bs4 import BeautifulSoup

import sys
sys.path.append(str(__file__).rsplit('/', 2)[0])

from config import REQUEST_DELAY_SECONDS


@dataclass
class Award:
    """Single award entry."""
    name: str
    year: int
    category: str
    award_type: str  # 'victoire', 'nrj', 'mtv', 'other'
    weight: float = 1.0


@dataclass
class Certification:
    """Single certification entry."""
    title: str
    level: str  # 'diamond', 'platinum', 'gold', 'silver'
    year: Optional[int] = None
    is_album: bool = True


@dataclass
class ArtistAwards:
    """All awards and certifications for an artist."""
    artist_name: str
    awards: list[Award] = field(default_factory=list)
    certifications: list[Certification] = field(default_factory=list)

    # Certification weights (SNEP thresholds)
    CERT_WEIGHTS = {
        "diamond": 8.0,  # 500,000+ albums or 50M+ streams
        "platinum": 4.0,  # 100,000+ albums or 10M+ streams
        "gold": 2.0,  # 50,000+ albums or 5M+ streams
        "silver": 1.0,  # 25,000+ albums
    }

    # Award weights
    AWARD_WEIGHTS = {
        "victoire": 10.0,  # Victoires de la Musique
        "nrj": 5.0,  # NRJ Music Awards
        "mtv": 4.0,  # MTV Europe Music Awards
        "other": 3.0,  # Other awards
    }

    @property
    def total_awards_count(self) -> int:
        """Total number of awards."""
        return len(self.awards)

    @property
    def total_certifications_count(self) -> int:
        """Total number of certifications."""
        return len(self.certifications)

    @property
    def weighted_awards_score(self) -> float:
        """Calculate weighted awards score."""
        score = 0.0
        for award in self.awards:
            weight = self.AWARD_WEIGHTS.get(award.award_type, 3.0)
            score += weight * award.weight
        return score

    @property
    def weighted_certifications_score(self) -> float:
        """Calculate weighted certifications score."""
        score = 0.0
        for cert in self.certifications:
            weight = self.CERT_WEIGHTS.get(cert.level, 1.0)
            score += weight
        return score

    @property
    def diamond_count(self) -> int:
        """Number of diamond certifications."""
        return len([c for c in self.certifications if c.level == "diamond"])

    @property
    def platinum_count(self) -> int:
        """Number of platinum certifications."""
        return len([c for c in self.certifications if c.level == "platinum"])

    @property
    def gold_count(self) -> int:
        """Number of gold certifications."""
        return len([c for c in self.certifications if c.level == "gold"])

    def calculate_influence_score(self, benchmark: float = 200.0) -> int:
        """Calculate normalized influence score from awards (0-100).

        Args:
            benchmark: Maximum expected score for normalization.

        Returns:
            Normalized score 0-100.
        """
        raw_score = self.weighted_awards_score + self.weighted_certifications_score
        normalized = min(100, (raw_score / benchmark) * 100)
        return int(normalized)

    def to_dict(self) -> dict:
        """Convert to dictionary for storage."""
        return {
            "artist_name": self.artist_name,
            "total_awards": self.total_awards_count,
            "total_certifications": self.total_certifications_count,
            "diamond_count": self.diamond_count,
            "platinum_count": self.platinum_count,
            "gold_count": self.gold_count,
            "weighted_awards_score": self.weighted_awards_score,
            "weighted_certifications_score": self.weighted_certifications_score,
            "influence_score": self.calculate_influence_score(),
            "awards": [
                {"name": a.name, "year": a.year, "category": a.category, "type": a.award_type}
                for a in self.awards
            ],
            "certifications": [
                {"title": c.title, "level": c.level, "year": c.year, "is_album": c.is_album}
                for c in self.certifications
            ],
        }


class AwardsCollector:
    """Collector for awards and certifications data."""

    # Known awards data for French rappers (manually curated from public sources)
    # Format: artist_key -> list of (name, year, category, type)
    KNOWN_AWARDS = {
        "booba": [
            ("Victoire de la Musique", 2011, "Meilleur album rap", "victoire"),
            ("Victoire de la Musique", 2017, "Meilleur album rap", "victoire"),
            ("NRJ Music Awards", 2015, "Meilleur artiste masculin", "nrj"),
            ("NRJ Music Awards", 2017, "Meilleur clip", "nrj"),
        ],
        "pnl": [
            ("Victoire de la Musique", 2017, "Album le plus streamé", "victoire"),
            ("Victoire de la Musique", 2020, "Album de l'année", "victoire"),
        ],
        "iam": [
            ("Victoire de la Musique", 1998, "Meilleur groupe", "victoire"),
            ("Victoire de la Musique", 2007, "Meilleur album rap", "victoire"),
            ("Victoire de la Musique", 2018, "Victoire d'honneur", "victoire"),
        ],
        "nekfeu": [
            ("Victoire de la Musique", 2016, "Meilleur album rap", "victoire"),
            ("Victoire de la Musique", 2020, "Meilleur album rap", "victoire"),
        ],
        "sch": [
            ("Victoire de la Musique", 2020, "Révélation scène", "victoire"),
            ("NRJ Music Awards", 2022, "Meilleur artiste masculin", "nrj"),
        ],
        "damso": [
            ("Victoire de la Musique", 2018, "Meilleur album rap", "victoire"),
            ("D6bels Music Awards", 2018, "Album de l'année", "other"),
            ("D6bels Music Awards", 2019, "Artiste de l'année", "other"),
        ],
        "jul": [
            ("NRJ Music Awards", 2016, "Révélation francophone", "nrj"),
            ("NRJ Music Awards", 2018, "Artiste français masculin", "nrj"),
            ("W9 d'Or", 2016, "Artiste masculin de l'année", "other"),
            ("W9 d'Or", 2017, "Artiste masculin de l'année", "other"),
            ("Flamme Olympique", 2024, "Porteur de la flamme", "other"),
        ],
        "ninho": [
            ("Victoire de la Musique", 2019, "Meilleur album rap", "victoire"),
            ("NRJ Music Awards", 2019, "Révélation francophone", "nrj"),
            ("NRJ Music Awards", 2022, "Artiste français masculin", "nrj"),
        ],
        "kery james": [
            ("Victoire de la Musique", 2009, "Meilleur album rap", "victoire"),
            ("Victoire de la Musique", 2017, "Meilleur album rap", "victoire"),
        ],
        "mc solaar": [
            ("Victoire de la Musique", 1992, "Révélation variétés", "victoire"),
            ("Victoire de la Musique", 1995, "Artiste masculin", "victoire"),
            ("Victoire de la Musique", 1998, "Meilleur album", "victoire"),
            ("Victoire de la Musique", 2018, "Victoire d'honneur", "victoire"),
        ],
        "ntm": [
            ("Victoire de la Musique", 1999, "Groupe de l'année", "victoire"),
        ],
        "oxmo puccino": [
            ("Victoire de la Musique", 2009, "Meilleur album rap", "victoire"),
            ("Victoire de la Musique", 2013, "Meilleur album rap", "victoire"),
        ],
        "soprano": [
            ("NRJ Music Awards", 2017, "Artiste français masculin", "nrj"),
            ("NRJ Music Awards", 2018, "Chanson francophone", "nrj"),
            ("NRJ Music Awards", 2019, "Duo francophone", "nrj"),
            ("Victoire de la Musique", 2019, "Chanson de l'année", "victoire"),
        ],
        "freeze corleone": [],  # Controversial, fewer mainstream awards
        "kaaris": [
            ("Trace Urban Music Awards", 2014, "Meilleur album rap", "other"),
        ],
        "maes": [
            ("NRJ Music Awards", 2020, "Révélation francophone", "nrj"),
        ],
        "gazo": [
            ("Victoire de la Musique", 2022, "Révélation scène", "victoire"),
        ],
        "vald": [
            ("Victoire de la Musique", 2018, "Album le plus streamé", "victoire"),
        ],
        "médine": [],  # Political content limits mainstream awards
        "youssoupha": [
            ("Trace Urban Music Awards", 2012, "Meilleur album rap", "other"),
            ("Trace Urban Music Awards", 2015, "Artiste masculin", "other"),
        ],
    }

    # Known certifications (sample data - in production, scrape from SNEP)
    KNOWN_CERTIFICATIONS = {
        "jul": [
            ("My World", "diamond", 2015, True),
            ("Je tourne en rond", "diamond", 2016, True),
            ("Émotions", "diamond", 2016, True),
            ("La tête dans les nuages", "diamond", 2017, True),
            ("L'Ovni", "diamond", 2016, True),
            ("Inspi d'ailleurs", "diamond", 2018, True),
            ("C'est pas des LOL", "platinum", 2017, True),
            ("Alors la zone", "platinum", 2018, True),
            ("Rien 100 rien", "diamond", 2018, True),
            ("Bande organisée", "diamond", 2020, False),  # Single
        ],
        "booba": [
            ("Ouest Side", "diamond", 2006, True),
            ("0.9", "diamond", 2008, True),
            ("Lunatic", "platinum", 2010, True),
            ("Futur", "diamond", 2012, True),
            ("D.U.C", "diamond", 2015, True),
            ("Nero Nemesis", "diamond", 2015, True),
            ("Trône", "diamond", 2017, True),
            ("Ultra", "platinum", 2021, True),
        ],
        "pnl": [
            ("Le Monde Chico", "diamond", 2015, True),
            ("Dans la légende", "diamond", 2016, True),
            ("Deux frères", "diamond", 2019, True),
            ("Au DD", "diamond", 2019, False),
        ],
        "ninho": [
            ("Comme prévu", "diamond", 2017, True),
            ("Destin", "diamond", 2019, True),
            ("M.I.L.S 3", "diamond", 2020, True),
            ("Jefe", "diamond", 2022, True),
        ],
        "nekfeu": [
            ("Feu", "diamond", 2015, True),
            ("Cyborg", "platinum", 2016, True),
            ("Les Étoiles vagabondes", "diamond", 2019, True),
        ],
        "sch": [
            ("A7", "platinum", 2015, True),
            ("Anarchie", "platinum", 2016, True),
            ("JVLIVS", "diamond", 2019, True),
            ("JVLIVS II", "diamond", 2021, True),
            ("JVLIVS Prequel", "platinum", 2022, True),
        ],
        "damso": [
            ("Batterie faible", "platinum", 2016, True),
            ("Ipséité", "diamond", 2017, True),
            ("Lithopédion", "diamond", 2018, True),
            ("QALF", "diamond", 2020, True),
        ],
        "iam": [
            ("L'école du micro d'argent", "diamond", 1997, True),
            ("Ombre est lumière", "platinum", 1993, True),
            ("Revoir un printemps", "platinum", 2003, True),
        ],
        "mc solaar": [
            ("Qui sème le vent récolte le tempo", "platinum", 1991, True),
            ("Prose Combat", "diamond", 1994, True),
            ("Paradisiaque", "platinum", 1997, True),
            ("Cinquième As", "platinum", 2001, True),
        ],
        "kery james": [
            ("À l'ombre du show business", "gold", 2008, True),
            ("Dernier MC", "gold", 2013, True),
        ],
        "soprano": [
            ("Cosmopolitanie", "platinum", 2014, True),
            ("L'Everest", "diamond", 2016, True),
            ("Phoenix", "diamond", 2018, True),
            ("Chasseur d'étoiles", "platinum", 2020, True),
        ],
        "maes": [
            ("Pure", "diamond", 2019, True),
            ("Les derniers salopards", "platinum", 2020, True),
            ("Réelle vie 3.0", "diamond", 2023, True),
        ],
        "gazo": [
            ("Drill FR", "platinum", 2020, True),
            ("KMT", "platinum", 2022, True),
        ],
        "freeze corleone": [
            ("LMF", "platinum", 2020, True),
        ],
        "kaaris": [
            ("Or Noir", "diamond", 2013, True),
            ("Le bruit de mon âme", "platinum", 2015, True),
            ("Okou Gnakouri", "platinum", 2016, True),
        ],
        "la fouine": [
            ("Bourré au son", "platinum", 2005, True),
            ("Aller-retour", "platinum", 2007, True),
            ("Mes repères", "platinum", 2009, True),
            ("La Fouine vs Laouni", "platinum", 2011, True),
            ("Drôle de parcours", "platinum", 2013, True),
        ],
        "lacrim": [
            ("Corleone", "platinum", 2014, True),
            ("Force & Honneur", "platinum", 2017, True),
            ("Persona Non Grata", "platinum", 2019, True),
        ],
        "ntm": [
            ("1993... J'appuie sur la gâchette", "platinum", 1993, True),
            ("Paris sous les bombes", "diamond", 1995, True),
            ("Suprême NTM", "platinum", 1998, True),
        ],
        "oxmo puccino": [
            ("Opéra Puccino", "gold", 1998, True),
            ("L'amour est mort", "gold", 2001, True),
        ],
        "vald": [
            ("Agartha", "diamond", 2017, True),
            ("Ce monde est cruel", "platinum", 2019, True),
            ("V", "platinum", 2021, True),
        ],
    }

    def __init__(self):
        """Initialize the awards collector."""
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
        })
        self.last_request_time = 0.0

    def _rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self.last_request_time
        if elapsed < REQUEST_DELAY_SECONDS:
            time.sleep(REQUEST_DELAY_SECONDS - elapsed)
        self.last_request_time = time.time()

    def get_artist_awards(self, artist_name: str) -> ArtistAwards:
        """Get awards and certifications for an artist.

        Uses known data for now. In production, could scrape from:
        - SNEP (https://snepmusique.com/les-certifications/)
        - Victoires de la Musique
        - NRJ Music Awards

        Args:
            artist_name: Name of the artist.

        Returns:
            ArtistAwards object with all awards and certifications.
        """
        key = artist_name.lower().strip()
        result = ArtistAwards(artist_name=artist_name)

        # Load awards
        awards_data = self.KNOWN_AWARDS.get(key, [])
        for name, year, category, award_type in awards_data:
            result.awards.append(Award(
                name=name,
                year=year,
                category=category,
                award_type=award_type,
            ))

        # Load certifications
        certs_data = self.KNOWN_CERTIFICATIONS.get(key, [])
        for title, level, year, is_album in certs_data:
            result.certifications.append(Certification(
                title=title,
                level=level,
                year=year,
                is_album=is_album,
            ))

        return result

    def collect_all_artists(self, artist_names: list[str]) -> dict[str, ArtistAwards]:
        """Collect awards data for all artists.

        Args:
            artist_names: List of artist names.

        Returns:
            Dict mapping artist names to their awards data.
        """
        results = {}
        for name in artist_names:
            print(f"Collecting awards for {name}...")
            awards = self.get_artist_awards(name)
            results[name.lower()] = awards
            print(f"  Awards: {awards.total_awards_count}, Certifications: {awards.total_certifications_count}")
            print(f"  Influence score: {awards.calculate_influence_score()}")
        return results


if __name__ == "__main__":
    # Test the collector
    collector = AwardsCollector()

    # Test with a few artists
    test_artists = ["Jul", "Booba", "PNL", "IAM", "Nekfeu", "Freeze Corleone"]

    print("=" * 60)
    print("AWARDS COLLECTION TEST")
    print("=" * 60)

    for artist in test_artists:
        print(f"\n{'='*50}")
        print(f"Artist: {artist}")
        print("=" * 50)

        awards = collector.get_artist_awards(artist)
        data = awards.to_dict()

        print(f"Total Awards: {data['total_awards']}")
        print(f"Total Certifications: {data['total_certifications']}")
        print(f"  - Diamond: {data['diamond_count']}")
        print(f"  - Platinum: {data['platinum_count']}")
        print(f"  - Gold: {data['gold_count']}")
        print(f"Weighted Awards Score: {data['weighted_awards_score']:.1f}")
        print(f"Weighted Certs Score: {data['weighted_certifications_score']:.1f}")
        print(f"Influence Score: {data['influence_score']}/100")
