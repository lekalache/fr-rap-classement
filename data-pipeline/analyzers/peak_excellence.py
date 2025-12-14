"""Peak Excellence analyzer for measuring best work quality.

Calculates peak excellence based on:
- Best Album Score (60%): Certification efficiency of top album
- Classic Tracks Count (40%): Number of lasting hit songs
"""

import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


@dataclass
class PeakMetrics:
    """Peak excellence metrics for an artist."""
    artist_id: str
    peak_album_score: float  # 0-100
    classic_tracks_count: int
    classic_tracks_score: float  # 0-100
    total_score: float  # 0-100

    def to_dict(self) -> dict:
        return {
            "artist_id": self.artist_id,
            "peak_album_score": round(self.peak_album_score, 2),
            "classic_tracks_count": self.classic_tracks_count,
            "classic_tracks_score": round(self.classic_tracks_score, 2),
            "total_score": round(self.total_score, 2),
        }


# Weights for peak components
PEAK_WEIGHTS = {
    "peak_album": 0.60,
    "classic_tracks": 0.40,
}

# Peak album data: artist -> (album_name, certification_level, tracks_on_album)
# certification_level: diamond=5, platinum=3, gold=1
PEAK_ALBUMS = {
    "booba": ("Futur", 5, 17),  # Diamond, 17 tracks
    "pnl": ("Deux frères", 5, 16),  # Diamond
    "iam": ("L'école du micro d'argent", 5, 18),  # Diamond, legendary
    "nekfeu": ("Feu", 5, 18),  # Diamond
    "sch": ("JVLIVS", 5, 19),  # Diamond
    "damso": ("Lithopédion", 5, 17),  # Diamond
    "kery james": ("Dernier MC", 3, 16),  # Platinum
    "jul": ("Émotions", 5, 25),  # Diamond (despite volume)
    "ninho": ("Destin", 5, 18),  # Diamond
    "freeze corleone": ("LMF", 3, 20),  # Platinum
    "rim'k": ("Famille nombreuse", 3, 14),  # With 113
    "rohff": ("La fierté des nôtres", 3, 16),  # Platinum
    "lino": ("Paradis assassiné", 3, 13),  # Arsenik
    "vald": ("Agartha", 5, 16),  # Diamond
    "youssoupha": ("Noir D****", 3, 16),  # Platinum
    "sofiane": ("Bandit saleté", 3, 15),  # Platinum
    "djadja & dinaz": ("On s'promet", 5, 14),  # Diamond
    "dosseh": ("Vidalo$$a", 3, 15),  # Platinum
    "flenn": ("Vent d'ouest", 1, 12),  # Gold
    "ziak": ("Akimbo", 3, 13),  # Platinum
    "hayce lemsi": ("Electron Libre 2.0", 1, 15),  # Gold
    "sinik": ("Sang froid", 3, 14),  # Platinum
    "guizmo": ("Dans ma ruche", 3, 15),  # Platinum
    "sadek": ("Nique le casino", 3, 14),  # Platinum
    "bouss": ("Paradis", 1, 12),  # Gold
    "kaaris": ("Or Noir", 5, 16),  # Diamond
    "ntm": ("Paris sous les bombes", 5, 16),  # Diamond, legendary
    "oxmo puccino": ("Opéra Puccino", 3, 15),  # Platinum, classic
    "mc solaar": ("Prose Combat", 5, 14),  # Diamond, legendary
    "la fouine": ("Mes repères", 3, 16),  # Platinum
    "lacrim": ("Corleone", 3, 15),  # Platinum
    "maes": ("Pure", 5, 14),  # Diamond
    "gazo": ("Drill FR", 3, 14),  # Platinum
    "soprano": ("L'Everest", 5, 15),  # Diamond
    "médine": ("Arabian Panther", 1, 16),  # Gold, critically acclaimed
    "kalash criminel": ("Sélection naturelle", 3, 15),  # Platinum
    "seth gueko": ("Michto", 3, 14),  # Platinum
    "alkpote": ("L'empereur", 1, 15),  # Gold
}

# Classic tracks count (platinum+ certified singles that are still culturally relevant)
CLASSIC_TRACKS = {
    "booba": 28,  # Boulbi, Ouest Side, DKR, Pitbull, etc.
    "pnl": 18,  # Au DD, Dans la légende, À l'ammoniaque, etc.
    "iam": 22,  # Petit frère, Je danse le mia, L'empire du côté obscur
    "nekfeu": 15,  # On verra, Réalité augmentée, Nique les clones
    "sch": 14,  # Champs-Élysées, Marché noir, Mannschaft
    "damso": 16,  # Θ. Macarena, Autotune, Bruxelles vie
    "kery james": 18,  # Lettre à la République, À l'ombre du show business
    "jul": 12,  # Tchikita, Je lève la moto, Bande organisée
    "ninho": 10,  # Maman ne le sait pas, Lettre à une femme
    "freeze corleone": 12,  # Freeze Raël, Desiigner, Shavkat
    "rim'k": 10,  # Tonton du bled, Clandestino
    "rohff": 8,  # Qui est l'exemple, En mode
    "lino": 12,  # Affaire de famille, Savoir-faire
    "vald": 10,  # Journal perso, Désaccordé
    "youssoupha": 10,  # Dreamin, Entourage
    "sofiane": 6,  # Toka, Mon ptit loup
    "djadja & dinaz": 6,  # Tenue de motard, À chaque fois
    "dosseh": 5,  # Infréquentables, Habitué
    "flenn": 4,  # Bella Ciao, Allo
    "ziak": 6,  # Tout en Dior, Akimbo
    "hayce lemsi": 4,  # Électron libre
    "sinik": 5,  # Une époque formidable, Le bruit
    "guizmo": 6,  # C'est tout, Dans ma ruche
    "sadek": 5,  # Johnny Niuuum, Bébé
    "bouss": 2,  # Paradis
    "kaaris": 15,  # Tchoin, Octogone, Maison citrouille
    "ntm": 20,  # Le monde de demain, That's my people, Ma Benz
    "oxmo puccino": 18,  # L'enfant seul, Toucher l'horizon
    "mc solaar": 20,  # Bouge de là, Caroline, Nouveau Western
    "la fouine": 12,  # Du ferme, Krav Maga
    "lacrim": 10,  # Oh bah oui, Corleone
    "maes": 8,  # Blanche, Fetty Wap
    "gazo": 6,  # Haine & Sex, DIE
    "soprano": 14,  # Cosmo, Fresh Prince, À la bien
    "médine": 10,  # Don't Laïk, Prose élite
    "kalash criminel": 8,  # Cougar Gang, Sauvagerie
    "seth gueko": 8,  # Titi parisien, Michto
    "alkpote": 7,  # L'empereur, XVBarbar
}


class PeakAnalyzer:
    """Analyzer for computing peak excellence scores."""

    def __init__(self):
        """Initialize the peak analyzer."""
        pass

    def calculate_peak_album_score(self, artist_id: str) -> float:
        """Calculate score based on best album quality.

        Uses certification level and efficiency (certs/tracks).

        Args:
            artist_id: Artist identifier.

        Returns:
            Peak album score (0-100).
        """
        artist_key = artist_id.lower().replace("-", " ").replace("_", " ")
        album_data = PEAK_ALBUMS.get(artist_key)

        if not album_data:
            return 50.0

        album_name, cert_level, tracks = album_data

        # Base score from certification level
        cert_scores = {5: 90, 3: 70, 1: 50}
        base_score = cert_scores.get(cert_level, 50)

        # Efficiency bonus: fewer tracks for same cert = better quality
        # Average album: 15 tracks
        efficiency = 15 / max(tracks, 1)
        efficiency_bonus = min(10, (efficiency - 1) * 15)

        final_score = min(100, base_score + efficiency_bonus)
        return max(0, final_score)

    def calculate_classic_tracks_score(self, artist_id: str) -> tuple[int, float]:
        """Calculate score based on number of classic tracks.

        Args:
            artist_id: Artist identifier.

        Returns:
            Tuple of (count, normalized score 0-100).
        """
        artist_key = artist_id.lower().replace("-", " ").replace("_", " ")
        count = CLASSIC_TRACKS.get(artist_key, 5)

        # Normalize (benchmark: 30 classics = 100)
        score = min(100, (count / 30) * 100)

        return count, score

    def calculate_peak_score(self, artist_id: str) -> PeakMetrics:
        """Calculate complete peak excellence score.

        Args:
            artist_id: Artist identifier.

        Returns:
            PeakMetrics with all component scores.
        """
        peak_album = self.calculate_peak_album_score(artist_id)
        classic_count, classic_score = self.calculate_classic_tracks_score(artist_id)

        # Calculate weighted total
        total = (
            peak_album * PEAK_WEIGHTS["peak_album"] +
            classic_score * PEAK_WEIGHTS["classic_tracks"]
        )

        return PeakMetrics(
            artist_id=artist_id,
            peak_album_score=peak_album,
            classic_tracks_count=classic_count,
            classic_tracks_score=classic_score,
            total_score=total,
        )

    def analyze_all_artists(self, artist_ids: list[str]) -> dict[str, PeakMetrics]:
        """Analyze peak excellence for all artists.

        Args:
            artist_ids: List of artist identifiers.

        Returns:
            Dict mapping artist_id to PeakMetrics.
        """
        results = {}
        for artist_id in artist_ids:
            metrics = self.calculate_peak_score(artist_id)
            results[artist_id] = metrics
            print(f"  {artist_id}: {metrics.total_score:.1f}")

        return results


if __name__ == "__main__":
    print("=== Peak Excellence Analyzer Test ===\n")

    analyzer = PeakAnalyzer()

    test_artists = [
        "booba", "pnl", "jul", "iam", "nekfeu",
        "ntm", "mc solaar", "freeze corleone", "gazo"
    ]

    print("Analyzing peak excellence...")
    results = analyzer.analyze_all_artists(test_artists)

    print("\n=== Results ===")
    for artist_id, metrics in sorted(results.items(), key=lambda x: -x[1].total_score):
        print(f"\n{artist_id.upper()}:")
        print(f"  Peak Album Score: {metrics.peak_album_score:.1f}")
        print(f"  Classic Tracks: {metrics.classic_tracks_count}")
        print(f"  Classic Tracks Score: {metrics.classic_tracks_score:.1f}")
        print(f"  TOTAL: {metrics.total_score:.1f}")
