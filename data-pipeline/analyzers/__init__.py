"""Lyrics analysis modules."""

from .vocabulary import calculate_unique_words
from .flow import calculate_flow_score
from .punchlines import calculate_punchline_score
from .hooks import calculate_hook_score

__all__ = [
    "calculate_unique_words",
    "calculate_flow_score",
    "calculate_punchline_score",
    "calculate_hook_score",
]
