"""Vocabulary richness analyzer for uniqueWords metric."""

import re
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from nlp.french_tokenizer import FrenchTokenizer, get_nlp
from nlp.slang_normalizer import normalize_slang


def filter_french_text(text: str) -> str:
    """Filter out non-French/Latin characters (Arabic, Cyrillic, etc.).

    Args:
        text: Raw lyrics text.

    Returns:
        Text with only French/Latin characters preserved.
    """
    # Keep only Latin characters (including French accents), numbers, and basic punctuation
    # This regex matches: a-z, A-Z, French accented chars, numbers, spaces, newlines, basic punctuation
    french_pattern = r'[a-zA-ZàâäéèêëïîôùûüœæçÀÂÄÉÈÊËÏÎÔÙÛÜŒÆÇ0-9\s\n\.,;:!?\'\"-]+'
    matches = re.findall(french_pattern, text)
    return ' '.join(matches)

# Try to import lexicalrichness for MTLD
try:
    from lexicalrichness import LexicalRichness
    LEXICALRICHNESS_AVAILABLE = True
except ImportError:
    LEXICALRICHNESS_AVAILABLE = False


def calculate_unique_words(lyrics: str, normalize_verlan: bool = True) -> int:
    """Calculate unique vocabulary count from lyrics.

    Uses lemmatization and optionally MTLD for length-independent measurement.

    Args:
        lyrics: Combined lyrics text from all songs.
        normalize_verlan: Whether to normalize slang before counting.

    Returns:
        Estimated unique vocabulary size (adjusted for diversity).
    """
    if not lyrics or not lyrics.strip():
        return 0

    # Filter out non-French characters (Arabic, Cyrillic, etc.)
    text = filter_french_text(lyrics)

    # Optionally normalize slang for vocabulary counting
    if normalize_verlan:
        text = normalize_slang(text, keep_original_for_rhymes=False)
    else:
        text = text

    # Initialize tokenizer
    tokenizer = FrenchTokenizer()

    # Get unique lemmas (excluding stop words)
    unique_lemmas = tokenizer.get_unique_lemmas(text, exclude_stops=True)
    raw_unique_count = len(unique_lemmas)

    # Calculate diversity factor using MTLD if available
    diversity_factor = 1.0
    if LEXICALRICHNESS_AVAILABLE and len(text.split()) >= 100:
        try:
            lex = LexicalRichness(text)
            # MTLD (Measure of Textual Lexical Diversity)
            # Typical values: 50-100 for normal text, higher = more diverse
            mtld = lex.mtld(threshold=0.72)
            # Normalize MTLD to a factor between 0.5 and 1.5
            diversity_factor = max(0.5, min(1.5, mtld / 80))
        except Exception:
            # Fallback if MTLD fails
            diversity_factor = 1.0

    # Adjust unique count by diversity factor
    adjusted_count = int(raw_unique_count * diversity_factor)

    # Cap at reasonable maximum (benchmark is 8000)
    return min(adjusted_count, 12000)


def calculate_vocabulary_metrics(lyrics: str) -> dict:
    """Calculate detailed vocabulary metrics.

    Args:
        lyrics: Combined lyrics text.

    Returns:
        Dict with detailed vocabulary metrics.
    """
    if not lyrics or not lyrics.strip():
        return {
            "unique_words": 0,
            "total_words": 0,
            "unique_lemmas": 0,
            "ttr": 0.0,
            "mtld": 0.0,
            "vocabulary_density": 0.0,
        }

    tokenizer = FrenchTokenizer()

    # Basic counts
    total_words = tokenizer.count_words(lyrics)
    tokens = tokenizer.tokenize(lyrics)
    unique_tokens = len(set(tokens))

    # Lemmatized counts
    lemmas = tokenizer.lemmatize(lyrics)
    unique_lemmas = len(set(lemmas))

    # Type-Token Ratio (vocabulary density)
    ttr = unique_tokens / total_words if total_words > 0 else 0

    # MTLD calculation
    mtld = 0.0
    if LEXICALRICHNESS_AVAILABLE and total_words >= 100:
        try:
            lex = LexicalRichness(lyrics)
            mtld = lex.mtld(threshold=0.72)
        except Exception:
            mtld = 0.0

    # Content word density
    content_words = tokenizer.get_content_words(lyrics)
    content_unique = len(set(content_words))
    vocabulary_density = content_unique / len(content_words) if content_words else 0

    return {
        "unique_words": calculate_unique_words(lyrics),
        "total_words": total_words,
        "unique_lemmas": unique_lemmas,
        "ttr": round(ttr, 4),
        "mtld": round(mtld, 2),
        "vocabulary_density": round(vocabulary_density, 4),
    }


def get_rare_words(lyrics: str, threshold: int = 2) -> list[str]:
    """Extract rare words that appear infrequently.

    Args:
        lyrics: Lyrics text to analyze.
        threshold: Maximum occurrence count to be considered rare.

    Returns:
        List of rare words.
    """
    tokenizer = FrenchTokenizer()
    lemmas = tokenizer.lemmatize(lyrics)

    # Count occurrences
    from collections import Counter
    counts = Counter(lemmas)

    # Filter rare words
    rare = [word for word, count in counts.items()
            if count <= threshold and len(word) > 3]

    return sorted(rare)


def get_vocabulary_by_pos(lyrics: str) -> dict[str, int]:
    """Get vocabulary breakdown by part of speech.

    Args:
        lyrics: Lyrics text to analyze.

    Returns:
        Dict mapping POS tags to unique word counts.
    """
    nlp = get_nlp()
    doc = nlp(lyrics.lower())

    pos_vocab = {}
    for token in doc:
        if token.is_alpha and len(token.text) > 1:
            pos = token.pos_
            if pos not in pos_vocab:
                pos_vocab[pos] = set()
            pos_vocab[pos].add(token.lemma_)

    return {pos: len(words) for pos, words in pos_vocab.items()}


if __name__ == "__main__":
    # Test with sample lyrics
    test_lyrics = """
    Dans la ville où les rêves se brisent
    Je marche seul sous les lumières grises
    Les mots sont des armes, les phrases des lames
    On écrit notre histoire avec nos flammes

    La rue m'a tout appris, la rue m'a tout pris
    Entre béton et ciel, je cherche un paradis
    Les souvenirs me hantent, les regrets me guettent
    Mais je continue d'avancer, tête haute, en quête

    Chaque mot est un combat, chaque rime une victoire
    Dans ce monde de béton, je cherche ma gloire
    Les étoiles sont loin mais je garde espoir
    Un jour j'atteindrai le sommet, c'est mon histoire
    """

    print("=== Vocabulary Analysis ===")
    metrics = calculate_vocabulary_metrics(test_lyrics)
    for key, value in metrics.items():
        print(f"  {key}: {value}")

    print(f"\nUnique words (final): {calculate_unique_words(test_lyrics)}")
    print(f"\nRare words: {get_rare_words(test_lyrics)[:10]}")
    print(f"\nVocab by POS: {get_vocabulary_by_pos(test_lyrics)}")
