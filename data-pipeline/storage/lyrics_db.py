"""SQLite database for caching lyrics and analysis results."""

import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

import sys
sys.path.append(str(__file__).rsplit('/', 2)[0])

from config import LYRICS_DB_PATH


class LyricsDatabase:
    """SQLite database for storing and caching lyrics data."""

    def __init__(self, db_path: Optional[Path] = None):
        """Initialize the database connection.

        Args:
            db_path: Path to SQLite database file.
        """
        self.db_path = db_path or LYRICS_DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        """Create database tables if they don't exist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS artists (
                    id TEXT PRIMARY KEY,
                    genius_id INTEGER,
                    name TEXT NOT NULL,
                    last_updated TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS songs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    artist_id TEXT NOT NULL,
                    genius_song_id INTEGER UNIQUE,
                    title TEXT NOT NULL,
                    lyrics TEXT,
                    url TEXT,
                    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (artist_id) REFERENCES artists(id)
                );

                CREATE TABLE IF NOT EXISTS analysis_cache (
                    artist_id TEXT PRIMARY KEY,
                    unique_words INTEGER,
                    flow_score REAL,
                    punchline_score REAL,
                    hook_score REAL,
                    total_songs INTEGER,
                    total_words INTEGER,
                    analyzed_at TIMESTAMP,
                    FOREIGN KEY (artist_id) REFERENCES artists(id)
                );

                CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist_id);
                CREATE INDEX IF NOT EXISTS idx_songs_genius_id ON songs(genius_song_id);

                -- New tables for objective scoring (Phase 2 refactor)

                -- Extended song metadata for innovation/influence analysis
                CREATE TABLE IF NOT EXISTS songs_metadata (
                    song_id INTEGER PRIMARY KEY,
                    release_date TEXT,
                    album_name TEXT,
                    featured_artists TEXT,  -- JSON array
                    genius_pageviews INTEGER DEFAULT 0,
                    annotation_count INTEGER DEFAULT 0,
                    certification_level TEXT,  -- gold/platinum/diamond
                    FOREIGN KEY (song_id) REFERENCES songs(id)
                );

                -- Innovation metrics (computed by innovation analyzer)
                CREATE TABLE IF NOT EXISTS artist_innovation (
                    artist_id TEXT PRIMARY KEY,
                    style_uniqueness REAL DEFAULT 0,
                    vocabulary_distinctiveness REAL DEFAULT 0,
                    first_mover_score REAL DEFAULT 0,
                    genre_fusion_score REAL DEFAULT 0,
                    total_innovation_score REAL DEFAULT 0,
                    computed_at TIMESTAMP,
                    FOREIGN KEY (artist_id) REFERENCES artists(id)
                );

                -- Integrity metrics (computed by integrity analyzer)
                CREATE TABLE IF NOT EXISTS artist_integrity (
                    artist_id TEXT PRIMARY KEY,
                    consistency_score REAL DEFAULT 0,
                    independence_score REAL DEFAULT 0,
                    trend_resistance REAL DEFAULT 0,
                    feature_selectivity REAL DEFAULT 0,
                    total_integrity_score REAL DEFAULT 0,
                    computed_at TIMESTAMP,
                    FOREIGN KEY (artist_id) REFERENCES artists(id)
                );

                -- Influence metrics (computed by influence analyzer)
                CREATE TABLE IF NOT EXISTS artist_influence (
                    artist_id TEXT PRIMARY KEY,
                    wikipedia_backlinks INTEGER DEFAULT 0,
                    wikipedia_pageviews INTEGER DEFAULT 0,
                    wikipedia_languages INTEGER DEFAULT 0,
                    awards_weighted_score REAL DEFAULT 0,
                    citation_mentions INTEGER DEFAULT 0,
                    style_adoption_score REAL DEFAULT 0,
                    total_influence_score REAL DEFAULT 0,
                    computed_at TIMESTAMP,
                    FOREIGN KEY (artist_id) REFERENCES artists(id)
                );

                -- Thematic coherence (computed by thematic analyzer)
                CREATE TABLE IF NOT EXISTS artist_themes (
                    artist_id TEXT PRIMARY KEY,
                    dominant_themes TEXT,  -- JSON array of top themes
                    theme_concentration REAL DEFAULT 0,
                    theme_entropy REAL DEFAULT 0,
                    coherence_score REAL DEFAULT 0,
                    computed_at TIMESTAMP,
                    FOREIGN KEY (artist_id) REFERENCES artists(id)
                );

                -- Peak excellence metrics
                CREATE TABLE IF NOT EXISTS artist_peak (
                    artist_id TEXT PRIMARY KEY,
                    peak_album_score REAL DEFAULT 0,
                    classic_tracks_count INTEGER DEFAULT 0,
                    total_peak_score REAL DEFAULT 0,
                    computed_at TIMESTAMP,
                    FOREIGN KEY (artist_id) REFERENCES artists(id)
                );

                -- Wikipedia data cache
                CREATE TABLE IF NOT EXISTS wikipedia_cache (
                    artist_id TEXT PRIMARY KEY,
                    page_title TEXT,
                    page_id INTEGER,
                    page_length INTEGER DEFAULT 0,
                    backlinks_count INTEGER DEFAULT 0,
                    languages_count INTEGER DEFAULT 0,
                    pageviews_monthly INTEGER DEFAULT 0,
                    references_count INTEGER DEFAULT 0,
                    creation_date TEXT,
                    fetched_at TIMESTAMP,
                    FOREIGN KEY (artist_id) REFERENCES artists(id)
                );

                -- Awards and certifications cache
                CREATE TABLE IF NOT EXISTS awards_cache (
                    artist_id TEXT PRIMARY KEY,
                    total_awards INTEGER DEFAULT 0,
                    total_certifications INTEGER DEFAULT 0,
                    diamond_count INTEGER DEFAULT 0,
                    platinum_count INTEGER DEFAULT 0,
                    gold_count INTEGER DEFAULT 0,
                    weighted_awards_score REAL DEFAULT 0,
                    weighted_certs_score REAL DEFAULT 0,
                    fetched_at TIMESTAMP,
                    FOREIGN KEY (artist_id) REFERENCES artists(id)
                );
            """)

    def save_artist(self, artist_id: str, name: str, genius_id: Optional[int] = None):
        """Save or update an artist record.

        Args:
            artist_id: Internal artist ID (from artists.json).
            name: Artist name.
            genius_id: Genius API artist ID.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO artists (id, genius_id, name, last_updated)
                VALUES (?, ?, ?, ?)
            """, (artist_id, genius_id, name, datetime.now()))

    def save_song(
        self,
        artist_id: str,
        genius_song_id: int,
        title: str,
        lyrics: str,
        url: Optional[str] = None
    ):
        """Save a song to the database.

        Args:
            artist_id: Internal artist ID.
            genius_song_id: Genius API song ID.
            title: Song title.
            lyrics: Cleaned lyrics text.
            url: Genius song URL.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO songs
                (artist_id, genius_song_id, title, lyrics, url, collected_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (artist_id, genius_song_id, title, lyrics, url, datetime.now()))

    def save_songs_batch(self, artist_id: str, songs: list[dict]):
        """Save multiple songs at once.

        Args:
            artist_id: Internal artist ID.
            songs: List of song dicts with keys: id, title, lyrics, url.
        """
        with sqlite3.connect(self.db_path) as conn:
            for song in songs:
                conn.execute("""
                    INSERT OR REPLACE INTO songs
                    (artist_id, genius_song_id, title, lyrics, url, collected_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    artist_id,
                    song.get("id"),
                    song["title"],
                    song["lyrics"],
                    song.get("url"),
                    datetime.now()
                ))

    def get_artist_lyrics(self, artist_id: str) -> list[str]:
        """Get all lyrics for an artist.

        Args:
            artist_id: Internal artist ID.

        Returns:
            List of lyrics strings.
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT lyrics FROM songs WHERE artist_id = ? AND lyrics IS NOT NULL",
                (artist_id,)
            )
            return [row[0] for row in cursor.fetchall()]

    def get_combined_lyrics(self, artist_id: str) -> str:
        """Get all lyrics for an artist combined into one string.

        Args:
            artist_id: Internal artist ID.

        Returns:
            Combined lyrics text.
        """
        lyrics = self.get_artist_lyrics(artist_id)
        return "\n\n".join(lyrics)

    def get_song_count(self, artist_id: str) -> int:
        """Get the number of songs stored for an artist.

        Args:
            artist_id: Internal artist ID.

        Returns:
            Number of songs.
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT COUNT(*) FROM songs WHERE artist_id = ?",
                (artist_id,)
            )
            return cursor.fetchone()[0]

    def save_analysis(
        self,
        artist_id: str,
        unique_words: int,
        flow_score: float,
        punchline_score: float,
        hook_score: float,
        total_songs: int,
        total_words: int
    ):
        """Cache analysis results for an artist.

        Args:
            artist_id: Internal artist ID.
            unique_words: Calculated unique words count.
            flow_score: Calculated flow score (0-100).
            punchline_score: Calculated punchline score (0-100).
            hook_score: Calculated hook score (0-100).
            total_songs: Number of songs analyzed.
            total_words: Total word count across all songs.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO analysis_cache
                (artist_id, unique_words, flow_score, punchline_score, hook_score,
                 total_songs, total_words, analyzed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                artist_id, unique_words, flow_score, punchline_score, hook_score,
                total_songs, total_words, datetime.now()
            ))

    def get_cached_analysis(self, artist_id: str) -> Optional[dict]:
        """Get cached analysis results for an artist.

        Args:
            artist_id: Internal artist ID.

        Returns:
            Dict with analysis results or None if not cached.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM analysis_cache WHERE artist_id = ?",
                (artist_id,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def artist_needs_update(self, artist_id: str, max_age_days: int = 30) -> bool:
        """Check if an artist's data needs to be refreshed.

        Args:
            artist_id: Internal artist ID.
            max_age_days: Maximum age in days before refresh needed.

        Returns:
            True if update is needed.
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT last_updated FROM artists WHERE id = ?",
                (artist_id,)
            )
            row = cursor.fetchone()
            if not row or not row[0]:
                return True

            last_updated = datetime.fromisoformat(row[0])
            age = (datetime.now() - last_updated).days
            return age > max_age_days

    def clear_artist_data(self, artist_id: str):
        """Remove all data for an artist.

        Args:
            artist_id: Internal artist ID.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM songs WHERE artist_id = ?", (artist_id,))
            conn.execute("DELETE FROM analysis_cache WHERE artist_id = ?", (artist_id,))
            conn.execute("DELETE FROM artists WHERE id = ?", (artist_id,))

    # ═══════════════════════════════════════════════════════════════
    # NEW METHODS FOR OBJECTIVE SCORING
    # ═══════════════════════════════════════════════════════════════

    def save_innovation_metrics(
        self,
        artist_id: str,
        style_uniqueness: float,
        vocabulary_distinctiveness: float,
        first_mover_score: float,
        genre_fusion_score: float,
        total_score: float
    ):
        """Save innovation metrics for an artist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO artist_innovation
                (artist_id, style_uniqueness, vocabulary_distinctiveness,
                 first_mover_score, genre_fusion_score, total_innovation_score, computed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (artist_id, style_uniqueness, vocabulary_distinctiveness,
                  first_mover_score, genre_fusion_score, total_score, datetime.now()))

    def get_innovation_metrics(self, artist_id: str) -> Optional[dict]:
        """Get cached innovation metrics."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM artist_innovation WHERE artist_id = ?", (artist_id,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def save_integrity_metrics(
        self,
        artist_id: str,
        consistency_score: float,
        independence_score: float,
        trend_resistance: float,
        feature_selectivity: float,
        total_score: float
    ):
        """Save integrity metrics for an artist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO artist_integrity
                (artist_id, consistency_score, independence_score,
                 trend_resistance, feature_selectivity, total_integrity_score, computed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (artist_id, consistency_score, independence_score,
                  trend_resistance, feature_selectivity, total_score, datetime.now()))

    def get_integrity_metrics(self, artist_id: str) -> Optional[dict]:
        """Get cached integrity metrics."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM artist_integrity WHERE artist_id = ?", (artist_id,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def save_influence_metrics(
        self,
        artist_id: str,
        wikipedia_backlinks: int,
        wikipedia_pageviews: int,
        wikipedia_languages: int,
        awards_weighted_score: float,
        citation_mentions: int,
        style_adoption_score: float,
        total_score: float
    ):
        """Save influence metrics for an artist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO artist_influence
                (artist_id, wikipedia_backlinks, wikipedia_pageviews, wikipedia_languages,
                 awards_weighted_score, citation_mentions, style_adoption_score,
                 total_influence_score, computed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (artist_id, wikipedia_backlinks, wikipedia_pageviews, wikipedia_languages,
                  awards_weighted_score, citation_mentions, style_adoption_score,
                  total_score, datetime.now()))

    def get_influence_metrics(self, artist_id: str) -> Optional[dict]:
        """Get cached influence metrics."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM artist_influence WHERE artist_id = ?", (artist_id,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def save_thematic_metrics(
        self,
        artist_id: str,
        dominant_themes: str,  # JSON string
        theme_concentration: float,
        theme_entropy: float,
        coherence_score: float
    ):
        """Save thematic coherence metrics for an artist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO artist_themes
                (artist_id, dominant_themes, theme_concentration,
                 theme_entropy, coherence_score, computed_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (artist_id, dominant_themes, theme_concentration,
                  theme_entropy, coherence_score, datetime.now()))

    def get_thematic_metrics(self, artist_id: str) -> Optional[dict]:
        """Get cached thematic metrics."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM artist_themes WHERE artist_id = ?", (artist_id,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def save_peak_metrics(
        self,
        artist_id: str,
        peak_album_score: float,
        classic_tracks_count: int,
        total_score: float
    ):
        """Save peak excellence metrics for an artist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO artist_peak
                (artist_id, peak_album_score, classic_tracks_count,
                 total_peak_score, computed_at)
                VALUES (?, ?, ?, ?, ?)
            """, (artist_id, peak_album_score, classic_tracks_count,
                  total_score, datetime.now()))

    def get_peak_metrics(self, artist_id: str) -> Optional[dict]:
        """Get cached peak excellence metrics."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM artist_peak WHERE artist_id = ?", (artist_id,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def save_wikipedia_cache(self, artist_id: str, data: dict):
        """Cache Wikipedia data for an artist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO wikipedia_cache
                (artist_id, page_title, page_id, page_length, backlinks_count,
                 languages_count, pageviews_monthly, references_count, creation_date, fetched_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                artist_id, data.get("page_title"), data.get("page_id"),
                data.get("page_length", 0), data.get("backlinks_count", 0),
                data.get("languages_count", 0), data.get("pageviews_monthly", 0),
                data.get("references_count", 0), data.get("creation_date"),
                datetime.now()
            ))

    def get_wikipedia_cache(self, artist_id: str) -> Optional[dict]:
        """Get cached Wikipedia data."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM wikipedia_cache WHERE artist_id = ?", (artist_id,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def save_awards_cache(self, artist_id: str, data: dict):
        """Cache awards data for an artist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO awards_cache
                (artist_id, total_awards, total_certifications, diamond_count,
                 platinum_count, gold_count, weighted_awards_score, weighted_certs_score, fetched_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                artist_id, data.get("total_awards", 0), data.get("total_certifications", 0),
                data.get("diamond_count", 0), data.get("platinum_count", 0),
                data.get("gold_count", 0), data.get("weighted_awards_score", 0),
                data.get("weighted_certs_score", 0), datetime.now()
            ))

    def get_awards_cache(self, artist_id: str) -> Optional[dict]:
        """Get cached awards data."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM awards_cache WHERE artist_id = ?", (artist_id,)
            )
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_all_artists_lyrics(self) -> dict[str, str]:
        """Get combined lyrics for all artists.

        Returns:
            Dict mapping artist_id to combined lyrics.
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT artist_id, GROUP_CONCAT(lyrics, '\n\n') as combined
                FROM songs
                WHERE lyrics IS NOT NULL
                GROUP BY artist_id
            """)
            return {row[0]: row[1] for row in cursor.fetchall()}

    def get_all_computed_metrics(self) -> dict[str, dict]:
        """Get all computed metrics for all artists.

        Returns:
            Dict mapping artist_id to all their computed metrics.
        """
        results = {}
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row

            # Get all artists
            cursor = conn.execute("SELECT id FROM artists")
            artist_ids = [row[0] for row in cursor.fetchall()]

            for artist_id in artist_ids:
                results[artist_id] = {
                    "innovation": self.get_innovation_metrics(artist_id),
                    "integrity": self.get_integrity_metrics(artist_id),
                    "influence": self.get_influence_metrics(artist_id),
                    "thematic": self.get_thematic_metrics(artist_id),
                    "peak": self.get_peak_metrics(artist_id),
                    "analysis": self.get_cached_analysis(artist_id),
                }

        return results


if __name__ == "__main__":
    # Test the database
    db = LyricsDatabase()

    # Save test data
    db.save_artist("test", "Test Artist", 12345)
    db.save_song("test", 1, "Test Song", "These are test lyrics\nLine two")

    # Retrieve
    lyrics = db.get_artist_lyrics("test")
    print(f"Lyrics: {lyrics}")

    # Clean up
    db.clear_artist_data("test")
    print("Test completed successfully")
