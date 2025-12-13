"""French NLP utilities for rap lyrics analysis."""

from .french_tokenizer import FrenchTokenizer, get_nlp
from .phonetics import get_phonetic_ending, get_ipa, count_syllables_french
from .slang_normalizer import normalize_slang, VERLAN_DICT

__all__ = [
    "FrenchTokenizer",
    "get_nlp",
    "get_phonetic_ending",
    "get_ipa",
    "count_syllables_french",
    "normalize_slang",
    "VERLAN_DICT",
]
