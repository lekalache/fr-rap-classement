"""Genius API client for lyrics collection."""

import re
import time
from typing import Optional
import requests
from bs4 import BeautifulSoup

import sys
sys.path.append(str(__file__).rsplit('/', 2)[0])

from config import (
    GENIUS_ACCESS_TOKEN,
    MAX_SONGS_PER_ARTIST,
    REQUEST_DELAY_SECONDS,
)


class GeniusCollector:
    """Custom Genius API client using the developer API."""

    API_ROOT = "https://api.genius.com"

    # Map ambiguous artist names to their Genius IDs
    ARTIST_ID_MAP = {
        "jul": 74283,  # JuL (French rapper from Marseille)
        "pnl": 335710,  # PNL (French rap duo - Ademo & N.O.S)
        "sch": 276476,  # SCH (French rapper from Marseille)
        "iam": 1770,  # IAM (French hip-hop group from Marseille)
        "kaaris": 14693,  # Kaaris (French rapper from Sevran)
        "ntm": 24568,  # Suprême NTM (French hip-hop group)
        "oxmo puccino": 1947,  # Oxmo Puccino (corrected)
        "mc solaar": 1310,  # MC Solaar
        "la fouine": 1303,  # La Fouine
        "lacrim": 11650,  # Lacrim
        "maes": 638160,  # Maes
        "gazo": 23012,  # Gazo
        "soprano": 1431,  # Soprano (Psy4 de la Rime) - corrected
        "médine": 1265,  # Médine
        "kalash criminel": 592670,  # Kalash Criminel
        "seth gueko": 11499,  # Seth Gueko (French rapper)
        "alkpote": 15427,  # Alkpote
    }

    def __init__(self, access_token: Optional[str] = None):
        """Initialize the Genius client.

        Args:
            access_token: Genius API access token. Uses env var if not provided.
        """
        token = access_token or GENIUS_ACCESS_TOKEN
        if not token:
            raise ValueError("Genius access token is required")

        self.token = token
        self.headers = {"Authorization": f"Bearer {token}"}
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        self.last_request_time = 0.0

    def _rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self.last_request_time
        if elapsed < REQUEST_DELAY_SECONDS:
            time.sleep(REQUEST_DELAY_SECONDS - elapsed)
        self.last_request_time = time.time()

    def _api_get(self, endpoint: str, params: dict = None) -> dict:
        """Make a GET request to the Genius API.

        Args:
            endpoint: API endpoint (e.g., "/search").
            params: Query parameters.

        Returns:
            JSON response dict.
        """
        self._rate_limit()
        url = f"{self.API_ROOT}{endpoint}"
        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()

    def search_artist(self, artist_name: str) -> Optional[dict]:
        """Search for an artist on Genius.

        Args:
            artist_name: Name of the artist to search for.

        Returns:
            Artist info dict or None if not found.
        """
        try:
            data = self._api_get("/search", {"q": artist_name})
            hits = data.get("response", {}).get("hits", [])

            for hit in hits:
                result = hit.get("result", {})
                # Find matching artist
                primary_artist = result.get("primary_artist", {})
                if primary_artist.get("name", "").lower() == artist_name.lower():
                    return {
                        "id": primary_artist.get("id"),
                        "name": primary_artist.get("name"),
                        "url": primary_artist.get("url"),
                    }

            # If exact match not found, return first artist
            if hits:
                result = hits[0].get("result", {})
                primary_artist = result.get("primary_artist", {})
                return {
                    "id": primary_artist.get("id"),
                    "name": primary_artist.get("name"),
                    "url": primary_artist.get("url"),
                }

            return None
        except Exception as e:
            print(f"Error searching for artist {artist_name}: {e}")
            return None

    def get_artist_songs(
        self,
        artist_name: str,
        max_songs: Optional[int] = None
    ) -> list[dict]:
        """Get songs for an artist with lyrics.

        Args:
            artist_name: Name of the artist.
            max_songs: Maximum number of songs to fetch.

        Returns:
            List of song dicts with title, lyrics, and metadata.
        """
        max_songs = max_songs or MAX_SONGS_PER_ARTIST

        # Check if we have a known ID for this artist
        artist_key = artist_name.lower().strip()
        if artist_key in self.ARTIST_ID_MAP:
            artist_id = self.ARTIST_ID_MAP[artist_key]
            artist_info = {"id": artist_id, "name": artist_name}
            print(f"Using mapped artist ID for {artist_name}: {artist_id}")
        else:
            # Search for the artist
            artist_info = self.search_artist(artist_name)
            if not artist_info:
                print(f"Artist not found: {artist_name}")
                return []
            artist_id = artist_info["id"]
            print(f"Found artist: {artist_info['name']} (ID: {artist_id})")

        # Get songs from artist
        songs = []
        page = 1
        per_page = 20

        while len(songs) < max_songs:
            try:
                data = self._api_get(
                    f"/artists/{artist_id}/songs",
                    {"page": page, "per_page": per_page, "sort": "popularity"}
                )
                song_list = data.get("response", {}).get("songs", [])

                if not song_list:
                    break

                for song_data in song_list:
                    if len(songs) >= max_songs:
                        break

                    # Only include songs where this artist is the primary artist
                    primary_artist = song_data.get("primary_artist", {})
                    if primary_artist.get("id") != artist_id:
                        continue

                    song_url = song_data.get("url")
                    title = song_data.get("title")

                    if not song_url:
                        continue

                    # Scrape lyrics
                    print(f"  Fetching lyrics for: {title}")
                    lyrics = self._scrape_lyrics(song_url)

                    if lyrics:
                        songs.append({
                            "id": song_data.get("id"),
                            "title": title,
                            "lyrics": lyrics,
                            "url": song_url,
                            "artist_name": artist_info["name"],
                        })

                page += 1

            except Exception as e:
                print(f"Error fetching songs page {page}: {e}")
                break

        print(f"Collected {len(songs)} songs for {artist_name}")
        return songs

    def _scrape_lyrics(self, song_url: str) -> Optional[str]:
        """Scrape lyrics from a Genius song page.

        Args:
            song_url: URL of the song page.

        Returns:
            Cleaned lyrics text or None if failed.
        """
        self._rate_limit()

        try:
            response = self.session.get(song_url, timeout=15)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            # Find lyrics containers (Genius uses data-lyrics-container attribute)
            lyrics_containers = soup.find_all(attrs={"data-lyrics-container": "true"})

            if not lyrics_containers:
                # Fallback: try to find by class
                lyrics_containers = soup.find_all("div", class_=re.compile(r"Lyrics__Container"))

            if not lyrics_containers:
                return None

            # Extract text from all containers
            lyrics_parts = []
            for container in lyrics_containers:
                # Replace <br> with newlines
                for br in container.find_all("br"):
                    br.replace_with("\n")

                text = container.get_text(separator="\n")
                lyrics_parts.append(text)

            lyrics = "\n".join(lyrics_parts)
            return self._clean_lyrics(lyrics)

        except Exception as e:
            print(f"  Error scraping lyrics from {song_url}: {e}")
            return None

    def _clean_lyrics(self, lyrics: str) -> str:
        """Clean up raw lyrics text.

        Args:
            lyrics: Raw lyrics from Genius.

        Returns:
            Cleaned lyrics text.
        """
        if not lyrics:
            return ""

        lines = lyrics.split('\n')
        cleaned_lines = []

        for line in lines:
            line = line.strip()

            # Skip contributor/embed lines
            if "Contributors" in line or "Embed" in line:
                continue
            # Skip section headers like [Verse 1]
            if line.startswith('[') and line.endswith(']'):
                continue
            # Skip "You might also like" recommendations
            if "You might also like" in line:
                continue
            # Skip empty lines at the start
            if not cleaned_lines and not line:
                continue

            cleaned_lines.append(line)

        # Join and clean up
        text = '\n'.join(cleaned_lines)

        # Remove multiple consecutive newlines
        while '\n\n\n' in text:
            text = text.replace('\n\n\n', '\n\n')

        return text.strip()

    def get_all_lyrics(
        self,
        artist_name: str,
        max_songs: Optional[int] = None
    ) -> list[str]:
        """Get all lyrics for an artist as a list of strings.

        Args:
            artist_name: Name of the artist.
            max_songs: Maximum number of songs to fetch.

        Returns:
            List of lyrics strings.
        """
        songs = self.get_artist_songs(artist_name, max_songs)
        return [song["lyrics"] for song in songs if song["lyrics"]]


if __name__ == "__main__":
    # Test the collector
    collector = GeniusCollector()

    # Test with a single artist
    songs = collector.get_artist_songs("Booba", max_songs=3)
    for song in songs:
        print(f"\n--- {song['title']} ---")
        print(song['lyrics'][:500] + "..." if len(song['lyrics']) > 500 else song['lyrics'])
