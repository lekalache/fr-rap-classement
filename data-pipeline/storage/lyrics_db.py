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
