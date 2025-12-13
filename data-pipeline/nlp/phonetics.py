"""French phonetics utilities for rhyme and flow analysis."""

import re
from typing import Optional

# Try to import phonemizer, but provide fallback if not available
try:
    from phonemizer import phonemize
    from phonemizer.backend import EspeakBackend
    PHONEMIZER_AVAILABLE = True
except ImportError:
    PHONEMIZER_AVAILABLE = False
    print("Warning: phonemizer not available. Using fallback phonetic rules.")


# French vowel phonemes for syllable counting
FRENCH_VOWELS = set("aeiouyàâäéèêëïîôùûüœæ")

# French vowel sounds (IPA)
IPA_VOWELS = set("aeɛiouøœyɔɑ̃ɛ̃œ̃ɔ̃")

# Common French rhyme endings (grapheme patterns)
RHYME_PATTERNS = {
    # -oir/-oire endings
    "oir": "waʁ",
    "oire": "waʁ",
    # -eur endings
    "eur": "œʁ",
    "eure": "œʁ",
    # -er/-é endings
    "er": "e",
    "é": "e",
    "ée": "e",
    "és": "e",
    "ées": "e",
    # -tion endings
    "tion": "sjɔ̃",
    "sion": "zjɔ̃",
    # -ment endings
    "ment": "mɑ̃",
    # -ant/-ent endings
    "ant": "ɑ̃",
    "ent": "ɑ̃",
    "ants": "ɑ̃",
    "ents": "ɑ̃",
    # -ain/-ein endings
    "ain": "ɛ̃",
    "ein": "ɛ̃",
    "in": "ɛ̃",
    # -on endings
    "on": "ɔ̃",
    "ons": "ɔ̃",
    # -ou endings
    "ou": "u",
    "ous": "u",
    "out": "u",
    # -age endings
    "age": "aʒ",
    "ages": "aʒ",
    # -ique endings
    "ique": "ik",
    "iques": "ik",
}


def get_ipa(text: str, language: str = "fr-fr") -> str:
    """Get IPA phonetic transcription of text.

    Args:
        text: Text to transcribe.
        language: Language code for phonemizer.

    Returns:
        IPA transcription.
    """
    if not text.strip():
        return ""

    # Use fallback for speed - phonemizer is too slow for batch processing
    return _fallback_g2p(text)


def _fallback_g2p(text: str) -> str:
    """Fallback grapheme-to-phoneme conversion for French.

    Args:
        text: Text to convert.

    Returns:
        Approximate phonetic representation.
    """
    text = text.lower()

    # Apply common French pronunciation rules
    replacements = [
        (r"eau", "o"),
        (r"au", "o"),
        (r"ou", "u"),
        (r"oi", "wa"),
        (r"ai", "ɛ"),
        (r"ei", "ɛ"),
        (r"an", "ɑ̃"),
        (r"en", "ɑ̃"),
        (r"am", "ɑ̃"),
        (r"em", "ɑ̃"),
        (r"on", "ɔ̃"),
        (r"om", "ɔ̃"),
        (r"in", "ɛ̃"),
        (r"im", "ɛ̃"),
        (r"ain", "ɛ̃"),
        (r"ein", "ɛ̃"),
        (r"un", "œ̃"),
        (r"um", "œ̃"),
        (r"eu", "ø"),
        (r"oeu", "ø"),
        (r"oe", "ø"),
        (r"ch", "ʃ"),
        (r"gn", "ɲ"),
        (r"qu", "k"),
        (r"gu", "g"),
        (r"ph", "f"),
        (r"th", "t"),
        (r"ç", "s"),
        (r"é", "e"),
        (r"è", "ɛ"),
        (r"ê", "ɛ"),
        (r"à", "a"),
        (r"â", "a"),
        (r"ù", "u"),
        (r"û", "u"),
        (r"î", "i"),
        (r"ï", "i"),
        (r"ô", "o"),
    ]

    result = text
    for pattern, replacement in replacements:
        result = re.sub(pattern, replacement, result)

    # Remove silent letters at end
    result = re.sub(r"[esxzt]$", "", result)

    return result


def get_phonetic_ending(word: str, num_phonemes: int = 3) -> str:
    """Get the phonetic ending of a word for rhyme comparison.

    Args:
        word: Word to analyze.
        num_phonemes: Number of phonemes to extract from end.

    Returns:
        Phonetic ending string.
    """
    if not word:
        return ""

    word = word.lower().strip()

    # Check pattern dictionary first
    for pattern, phoneme in RHYME_PATTERNS.items():
        if word.endswith(pattern):
            return phoneme

    # Get IPA and extract ending
    ipa = get_ipa(word)
    if ipa:
        # Remove spaces and get last n phonemes
        ipa_clean = ipa.replace(" ", "")
        return ipa_clean[-num_phonemes:] if len(ipa_clean) >= num_phonemes else ipa_clean

    return word[-num_phonemes:]


def count_syllables_french(text: str) -> int:
    """Count syllables in French text.

    Uses vowel cluster counting with French-specific rules.

    Args:
        text: Text to count syllables in.

    Returns:
        Estimated syllable count.
    """
    if not text:
        return 0

    text = text.lower()
    syllable_count = 0

    # Process each word
    words = re.findall(r"[a-zàâäéèêëïîôùûüœæ]+", text)

    for word in words:
        if not word:
            continue

        # Count vowel groups as syllables
        # But handle French-specific cases

        # Replace common digraphs that are single sounds
        word = re.sub(r"eau", "O", word)
        word = re.sub(r"au", "O", word)
        word = re.sub(r"ou", "U", word)
        word = re.sub(r"oi", "W", word)
        word = re.sub(r"ai", "E", word)
        word = re.sub(r"ei", "E", word)
        word = re.sub(r"eu", "Y", word)
        word = re.sub(r"oeu", "Y", word)
        word = re.sub(r"oe", "Y", word)

        # Count vowel clusters
        vowels = "aeiouyàâäéèêëïîôùûüœæOUWEY"
        in_vowel = False
        word_syllables = 0

        for char in word:
            if char in vowels:
                if not in_vowel:
                    word_syllables += 1
                    in_vowel = True
            else:
                in_vowel = False

        # Handle silent 'e' at end (usually not pronounced)
        if word.endswith('e') and len(word) > 2 and word[-2] not in vowels:
            word_syllables = max(1, word_syllables - 1)

        # Handle 'es' ending (usually silent)
        if word.endswith('es') and len(word) > 3:
            word_syllables = max(1, word_syllables - 1)

        syllable_count += max(1, word_syllables)

    return syllable_count


def syllables_per_line(text: str) -> list[int]:
    """Get syllable count for each line in text.

    Args:
        text: Multi-line text.

    Returns:
        List of syllable counts per line.
    """
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    return [count_syllables_french(line) for line in lines]


def rhymes_with(word1: str, word2: str, strictness: int = 2) -> bool:
    """Check if two words rhyme.

    Args:
        word1: First word.
        word2: Second word.
        strictness: Number of phonemes that must match (1-3).

    Returns:
        True if words rhyme.
    """
    ending1 = get_phonetic_ending(word1, strictness)
    ending2 = get_phonetic_ending(word2, strictness)
    return ending1 == ending2 and ending1 != ""


def find_rhyming_pairs(words: list[str]) -> list[tuple[str, str]]:
    """Find all rhyming pairs in a list of words.

    Args:
        words: List of words to analyze.

    Returns:
        List of (word1, word2) tuples that rhyme.
    """
    pairs = []
    seen = set()

    for i, word1 in enumerate(words):
        for word2 in words[i + 1:]:
            if word1 != word2 and (word2, word1) not in seen:
                if rhymes_with(word1, word2):
                    pairs.append((word1, word2))
                    seen.add((word1, word2))

    return pairs


if __name__ == "__main__":
    # Test the phonetics module
    test_words = ["histoire", "victoire", "noir", "espoir", "amour", "toujours"]

    print("Phonetic endings:")
    for word in test_words:
        print(f"  {word}: {get_phonetic_ending(word)}")

    print("\nRhyme pairs:", find_rhyming_pairs(test_words))

    test_line = "Je marche dans la rue sous la pluie"
    print(f"\nSyllables in '{test_line}': {count_syllables_french(test_line)}")

    test_verse = """
    Dans la ville où les rêves se brisent
    Je marche seul sous les lumières grises
    """
    print(f"Syllables per line: {syllables_per_line(test_verse)}")
