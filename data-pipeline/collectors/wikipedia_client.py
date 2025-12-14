"""Wikipedia API client for artist influence metrics."""

import time
from typing import Optional
from dataclasses import dataclass
import requests

import sys
sys.path.append(str(__file__).rsplit('/', 2)[0])

from config import REQUEST_DELAY_SECONDS


@dataclass
class WikipediaMetrics:
    """Metrics collected from Wikipedia for an artist."""
    page_title: str
    page_id: int
    page_length: int  # bytes - indicates notoriety
    backlinks_count: int  # pages linking to artist
    languages_count: int  # number of language versions
    pageviews_monthly: int  # average monthly views
    references_count: int  # number of citations
    categories_count: int
    creation_date: Optional[str]  # first recognition
    extract: str  # short description

    def calculate_mentions_score(self, benchmark: int = 650) -> int:
        """Calculate normalized mentions score (0-100).

        Formula: backlinks * 2 + references + (languages * 5) + (pageviews / 10000)
        """
        raw_score = (
            self.backlinks_count * 2 +
            self.references_count +
            self.languages_count * 5 +
            self.pageviews_monthly / 10000
        )
        normalized = min(100, (raw_score / benchmark) * 100)
        return int(normalized)

    def to_dict(self) -> dict:
        """Convert to dictionary for storage."""
        return {
            "page_title": self.page_title,
            "page_id": self.page_id,
            "page_length": self.page_length,
            "backlinks_count": self.backlinks_count,
            "languages_count": self.languages_count,
            "pageviews_monthly": self.pageviews_monthly,
            "references_count": self.references_count,
            "categories_count": self.categories_count,
            "creation_date": self.creation_date,
            "mentions_score": self.calculate_mentions_score(),
        }


class WikipediaCollector:
    """Collector for Wikipedia metrics via MediaWiki API."""

    # French Wikipedia API
    API_URL = "https://fr.wikipedia.org/w/api.php"
    PAGEVIEWS_API = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article"

    # Map artist names to their Wikipedia page titles
    ARTIST_PAGE_MAP = {
        "booba": "Booba",
        "pnl": "PNL_(groupe)",
        "iam": "IAM",
        "nekfeu": "Nekfeu",
        "sch": "SCH_(rappeur)",
        "damso": "Damso",
        "kery james": "Kery_James",
        "jul": "Jul_(chanteur)",
        "ninho": "Ninho",
        "freeze corleone": "Freeze_Corleone",
        "rim'k": "Rim'K",
        "rohff": "Rohff",
        "lino": "Lino_(rappeur)",
        "vald": "Vald_(rappeur)",
        "youssoupha": "Youssoupha",
        "sofiane": "Sofiane_(rappeur)",
        "djadja & dinaz": "Djadja_&_Dinaz",
        "dosseh": "Dosseh",
        "flenn": "Flenn",
        "ziak": "Ziak_(rappeur)",
        "hayce lemsi": "Hayce_Lemsi",
        "sinik": "Sinik",
        "guizmo": "Guizmo_(rappeur)",
        "sadek": "Sadek_(rappeur)",
        "bouss": "Bouss_(rappeur)",
        "kaaris": "Kaaris",
        "ntm": "Suprême_NTM",
        "oxmo puccino": "Oxmo_Puccino",
        "mc solaar": "MC_Solaar",
        "la fouine": "La_Fouine",
        "lacrim": "Lacrim",
        "maes": "Maes_(rappeur)",
        "gazo": "Gazo_(rappeur)",
        "soprano": "Soprano_(rappeur)",
        "médine": "Médine_(rappeur)",
        "kalash criminel": "Kalash_Criminel",
        "seth gueko": "Seth_Gueko",
        "alkpote": "Alkpote",
    }

    def __init__(self):
        """Initialize the Wikipedia collector."""
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "FRRapClassement/1.0 (https://github.com/fr-rap-classement; contact@example.com)"
        })
        self.last_request_time = 0.0

    def _rate_limit(self):
        """Enforce rate limiting between requests."""
        elapsed = time.time() - self.last_request_time
        if elapsed < REQUEST_DELAY_SECONDS:
            time.sleep(REQUEST_DELAY_SECONDS - elapsed)
        self.last_request_time = time.time()

    def _get_page_title(self, artist_name: str) -> str:
        """Get Wikipedia page title for an artist."""
        key = artist_name.lower().strip()
        if key in self.ARTIST_PAGE_MAP:
            return self.ARTIST_PAGE_MAP[key]
        # Try to search for the page
        return artist_name.replace(" ", "_")

    def get_page_info(self, page_title: str) -> Optional[dict]:
        """Get basic page info from Wikipedia.

        Args:
            page_title: Wikipedia page title.

        Returns:
            Page info dict or None if not found.
        """
        self._rate_limit()

        params = {
            "action": "query",
            "titles": page_title,
            "prop": "info|extracts|categories|revisions",
            "inprop": "url",
            "exintro": True,
            "explaintext": True,
            "exsentences": 3,
            "cllimit": 50,
            "rvprop": "timestamp",
            "rvlimit": 1,
            "rvdir": "older",  # Get first revision
            "format": "json",
        }

        try:
            response = self.session.get(self.API_URL, params=params)
            response.raise_for_status()
            data = response.json()

            pages = data.get("query", {}).get("pages", {})
            for page_id, page_data in pages.items():
                if page_id == "-1":
                    return None
                return {
                    "page_id": int(page_id),
                    "title": page_data.get("title", ""),
                    "length": page_data.get("length", 0),
                    "extract": page_data.get("extract", ""),
                    "categories": page_data.get("categories", []),
                    "creation_date": page_data.get("revisions", [{}])[0].get("timestamp"),
                }
            return None
        except Exception as e:
            print(f"Error fetching page info for {page_title}: {e}")
            return None

    def get_backlinks_count(self, page_title: str) -> int:
        """Get the number of pages linking to this page.

        Args:
            page_title: Wikipedia page title.

        Returns:
            Number of backlinks.
        """
        self._rate_limit()

        params = {
            "action": "query",
            "list": "backlinks",
            "bltitle": page_title,
            "bllimit": "max",
            "blnamespace": 0,  # Only main namespace
            "format": "json",
        }

        try:
            total = 0
            while True:
                response = self.session.get(self.API_URL, params=params)
                response.raise_for_status()
                data = response.json()

                backlinks = data.get("query", {}).get("backlinks", [])
                total += len(backlinks)

                # Check for continuation
                if "continue" in data:
                    params["blcontinue"] = data["continue"]["blcontinue"]
                else:
                    break

                # Limit to avoid too many requests
                if total >= 500:
                    break

            return total
        except Exception as e:
            print(f"Error fetching backlinks for {page_title}: {e}")
            return 0

    def get_language_links_count(self, page_title: str) -> int:
        """Get the number of language versions of this page.

        Args:
            page_title: Wikipedia page title.

        Returns:
            Number of languages.
        """
        self._rate_limit()

        params = {
            "action": "query",
            "titles": page_title,
            "prop": "langlinks",
            "lllimit": "max",
            "format": "json",
        }

        try:
            response = self.session.get(self.API_URL, params=params)
            response.raise_for_status()
            data = response.json()

            pages = data.get("query", {}).get("pages", {})
            for page_data in pages.values():
                langlinks = page_data.get("langlinks", [])
                return len(langlinks) + 1  # +1 for French version
            return 1
        except Exception as e:
            print(f"Error fetching language links for {page_title}: {e}")
            return 1

    def get_references_count(self, page_title: str) -> int:
        """Get the number of references/citations on the page.

        Args:
            page_title: Wikipedia page title.

        Returns:
            Approximate number of references.
        """
        self._rate_limit()

        params = {
            "action": "parse",
            "page": page_title,
            "prop": "sections",
            "format": "json",
        }

        try:
            response = self.session.get(self.API_URL, params=params)
            response.raise_for_status()
            data = response.json()

            # Get page content to count references
            params2 = {
                "action": "query",
                "titles": page_title,
                "prop": "revisions",
                "rvprop": "content",
                "rvslots": "main",
                "format": "json",
            }

            self._rate_limit()
            response2 = self.session.get(self.API_URL, params=params2)
            response2.raise_for_status()
            data2 = response2.json()

            pages = data2.get("query", {}).get("pages", {})
            for page_data in pages.values():
                content = page_data.get("revisions", [{}])[0].get("slots", {}).get("main", {}).get("*", "")
                # Count <ref> tags
                ref_count = content.count("<ref")
                return ref_count
            return 0
        except Exception as e:
            print(f"Error fetching references for {page_title}: {e}")
            return 0

    def get_pageviews(self, page_title: str, days: int = 30) -> int:
        """Get monthly pageviews from Wikimedia REST API.

        Args:
            page_title: Wikipedia page title.
            days: Number of days to average.

        Returns:
            Average monthly pageviews.
        """
        self._rate_limit()

        from datetime import datetime, timedelta

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        # Format dates for API
        start_str = start_date.strftime("%Y%m%d")
        end_str = end_date.strftime("%Y%m%d")

        url = f"{self.PAGEVIEWS_API}/fr.wikipedia/all-access/all-agents/{page_title}/daily/{start_str}/{end_str}"

        try:
            response = self.session.get(url)
            if response.status_code == 404:
                # Page might not have view data
                return 0
            response.raise_for_status()
            data = response.json()

            items = data.get("items", [])
            if not items:
                return 0

            total_views = sum(item.get("views", 0) for item in items)
            # Extrapolate to monthly
            monthly_views = int(total_views * 30 / days)
            return monthly_views
        except Exception as e:
            print(f"Error fetching pageviews for {page_title}: {e}")
            return 0

    def collect_artist_metrics(self, artist_name: str) -> Optional[WikipediaMetrics]:
        """Collect all Wikipedia metrics for an artist.

        Args:
            artist_name: Name of the artist.

        Returns:
            WikipediaMetrics object or None if page not found.
        """
        page_title = self._get_page_title(artist_name)
        print(f"Collecting Wikipedia metrics for {artist_name} ({page_title})...")

        # Get basic page info
        page_info = self.get_page_info(page_title)
        if not page_info:
            print(f"  Page not found: {page_title}")
            return None

        # Collect all metrics
        backlinks = self.get_backlinks_count(page_title)
        print(f"  Backlinks: {backlinks}")

        languages = self.get_language_links_count(page_title)
        print(f"  Languages: {languages}")

        references = self.get_references_count(page_title)
        print(f"  References: {references}")

        pageviews = self.get_pageviews(page_title)
        print(f"  Monthly pageviews: {pageviews}")

        metrics = WikipediaMetrics(
            page_title=page_info["title"],
            page_id=page_info["page_id"],
            page_length=page_info["length"],
            backlinks_count=backlinks,
            languages_count=languages,
            pageviews_monthly=pageviews,
            references_count=references,
            categories_count=len(page_info.get("categories", [])),
            creation_date=page_info.get("creation_date"),
            extract=page_info.get("extract", ""),
        )

        print(f"  Calculated mentions score: {metrics.calculate_mentions_score()}")
        return metrics

    def collect_all_artists(self, artist_names: list[str]) -> dict[str, WikipediaMetrics]:
        """Collect Wikipedia metrics for all artists.

        Args:
            artist_names: List of artist names.

        Returns:
            Dict mapping artist names to their metrics.
        """
        results = {}
        for name in artist_names:
            metrics = self.collect_artist_metrics(name)
            if metrics:
                results[name.lower()] = metrics
        return results


if __name__ == "__main__":
    # Test the collector
    collector = WikipediaCollector()

    # Test with a few artists
    test_artists = ["Jul", "Booba", "PNL", "IAM"]

    for artist in test_artists:
        print(f"\n{'='*50}")
        metrics = collector.collect_artist_metrics(artist)
        if metrics:
            print(f"\nFinal metrics for {artist}:")
            for key, value in metrics.to_dict().items():
                print(f"  {key}: {value}")
