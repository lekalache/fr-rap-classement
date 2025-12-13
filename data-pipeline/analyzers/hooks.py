"""Hook analyzer for hookScore metric - chorus memorability, catchiness."""

import re
import sys
from pathlib import Path
from collections import Counter
from hashlib import md5

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from nlp.phonetics import count_syllables_french, syllables_per_line
from config import HOOK_WEIGHTS


def calculate_hook_score(lyrics: str) -> float:
    """Calculate hook score based on memorability and catchiness.

    Components:
    - Repetition structure (35%): Chorus patterns, repeated phrases
    - Phonetic catchiness (30%): Easy-to-pronounce patterns
    - Rhythm regularity (20%): Consistent beat patterns
    - Brevity (15%): Short, punchy phrases

    Args:
        lyrics: Combined lyrics text from all songs.

    Returns:
        Hook score from 0-100.
    """
    if not lyrics or not lyrics.strip():
        return 0.0

    lines = [line.strip() for line in lyrics.split('\n') if line.strip()]

    if len(lines) < 4:
        return 0.0

    # Calculate components
    repetition = _calculate_repetition_score(lyrics)
    catchiness = _calculate_phonetic_catchiness(lyrics, lines)
    rhythm = _calculate_rhythm_regularity(lyrics)
    brevity = _calculate_brevity_score(lyrics)

    # Weighted combination
    score = (
        repetition * HOOK_WEIGHTS["repetition"] * 100 +
        catchiness * HOOK_WEIGHTS["catchiness"] * 100 +
        rhythm * HOOK_WEIGHTS["rhythm"] * 100 +
        brevity * HOOK_WEIGHTS["brevity"] * 100
    )

    return min(100, max(0, round(score)))


def _calculate_repetition_score(lyrics: str) -> float:
    """Calculate repetition patterns indicating hooks/choruses.

    Args:
        lyrics: Full lyrics text.

    Returns:
        Repetition score (0-1).
    """
    # Split into paragraphs (potential choruses)
    paragraphs = [p.strip() for p in lyrics.split('\n\n') if p.strip()]

    if len(paragraphs) < 2:
        # Check line-level repetition instead
        lines = [line.strip().lower() for line in lyrics.split('\n') if line.strip()]
        if len(lines) < 4:
            return 0.0

        line_counts = Counter(lines)
        repeated_lines = sum(1 for count in line_counts.values() if count > 1)
        return min(1.0, repeated_lines / len(lines) * 4)

    # Hash paragraphs for comparison
    para_hashes = [md5(p.lower().encode()).hexdigest()[:8] for p in paragraphs]
    hash_counts = Counter(para_hashes)

    # Count repeated paragraphs (likely choruses)
    repeated_paras = sum(1 for count in hash_counts.values() if count > 1)
    chorus_ratio = repeated_paras / len(paragraphs)

    # Also check for repeated phrases within text
    # Common hook patterns: repeated 3+ word phrases
    words = lyrics.lower().split()
    phrase_counts = Counter()

    for i in range(len(words) - 2):
        phrase = ' '.join(words[i:i + 3])
        phrase_counts[phrase] += 1

    repeated_phrases = sum(1 for count in phrase_counts.values() if count >= 3)
    phrase_score = min(1.0, repeated_phrases / 20)

    return chorus_ratio * 0.6 + phrase_score * 0.4


def _calculate_phonetic_catchiness(lyrics: str, lines: list[str]) -> float:
    """Calculate phonetic catchiness (ease of pronunciation/singing).

    Args:
        lyrics: Full lyrics text.
        lines: List of lyric lines.

    Returns:
        Catchiness score (0-1).
    """
    # Catchy characteristics:
    # 1. Open syllables (ending in vowels)
    # 2. Simple consonant clusters
    # 3. Short words
    # 4. Vowel harmony

    words = re.findall(r"[a-zàâäéèêëïîôùûüœæ]+", lyrics.lower())

    if not words:
        return 0.0

    # Average word length (shorter = catchier for hooks)
    avg_length = sum(len(w) for w in words) / len(words)
    length_score = max(0, 1 - (avg_length - 4) / 6)  # Optimal ~4 letters

    # Open syllable ratio (words ending in vowels)
    vowels = set("aeiouyàâäéèêëïîôùûü")
    open_syllables = sum(1 for w in words if w[-1] in vowels)
    open_ratio = open_syllables / len(words)

    # Simple consonant clusters (no complex clusters like "str", "scr")
    complex_clusters = len(re.findall(r'[bcdfghjklmnpqrstvwxz]{3,}', lyrics.lower()))
    cluster_penalty = min(1.0, complex_clusters / len(words) * 10)
    cluster_score = 1 - cluster_penalty

    # Vowel repetition (vowel harmony)
    vowel_sequence = ''.join(c for c in lyrics.lower() if c in vowels)
    if len(vowel_sequence) >= 2:
        vowel_pairs = Counter(vowel_sequence[i:i + 2] for i in range(len(vowel_sequence) - 1))
        # More repeated vowel pairs = more harmonic
        harmony_score = min(1.0, sum(1 for c in vowel_pairs.values() if c > 2) / 10)
    else:
        harmony_score = 0.5

    return (
        length_score * 0.3 +
        open_ratio * 0.3 +
        cluster_score * 0.2 +
        harmony_score * 0.2
    )


def _calculate_rhythm_regularity(lyrics: str) -> float:
    """Calculate rhythm regularity in potential hook sections.

    Args:
        lyrics: Full lyrics text.

    Returns:
        Rhythm regularity score (0-1).
    """
    # Split into paragraphs
    paragraphs = [p.strip() for p in lyrics.split('\n\n') if p.strip()]

    if not paragraphs:
        return 0.5

    regularity_scores = []

    for para in paragraphs:
        lines = [line.strip() for line in para.split('\n') if line.strip()]
        if len(lines) < 2:
            continue

        syllables = [count_syllables_french(line) for line in lines]

        if not syllables:
            continue

        # Calculate variance in syllable counts
        mean_syl = sum(syllables) / len(syllables)
        if mean_syl == 0:
            continue

        variance = sum((s - mean_syl) ** 2 for s in syllables) / len(syllables)
        cv = (variance ** 0.5) / mean_syl  # Coefficient of variation

        # Lower CV = more regular rhythm
        # Hooks typically have very regular rhythm (CV < 0.2)
        if cv < 0.15:
            regularity_scores.append(1.0)
        elif cv < 0.3:
            regularity_scores.append(0.7)
        elif cv < 0.5:
            regularity_scores.append(0.4)
        else:
            regularity_scores.append(0.2)

    if not regularity_scores:
        return 0.5

    return sum(regularity_scores) / len(regularity_scores)


def _calculate_brevity_score(lyrics: str) -> float:
    """Calculate brevity of phrases (hooks are typically short and punchy).

    Args:
        lyrics: Full lyrics text.

    Returns:
        Brevity score (0-1).
    """
    # Find repeated sections (likely hooks)
    paragraphs = [p.strip() for p in lyrics.split('\n\n') if p.strip()]

    if len(paragraphs) < 2:
        # Use all lines
        lines = [line.strip() for line in lyrics.split('\n') if line.strip()]
        if not lines:
            return 0.5
        avg_words = sum(len(line.split()) for line in lines) / len(lines)
    else:
        # Hash paragraphs to find repeated ones (hooks)
        para_hashes = {}
        for para in paragraphs:
            h = md5(para.lower().encode()).hexdigest()[:8]
            if h not in para_hashes:
                para_hashes[h] = []
            para_hashes[h].append(para)

        # Get repeated paragraphs (hooks)
        hooks = [paras[0] for paras in para_hashes.values() if len(paras) > 1]

        if not hooks:
            # No repeated sections, use shortest paragraphs as proxy
            hooks = sorted(paragraphs, key=len)[:3]

        # Calculate average words in hook sections
        hook_words = []
        for hook in hooks:
            lines = hook.split('\n')
            for line in lines:
                hook_words.append(len(line.split()))

        avg_words = sum(hook_words) / len(hook_words) if hook_words else 10

    # Ideal hook line: 4-8 words
    # Score based on deviation from ideal
    if avg_words < 4:
        brevity = 0.7  # Too short might lack substance
    elif avg_words <= 8:
        brevity = 1.0  # Ideal range
    elif avg_words <= 12:
        brevity = 0.7  # Slightly long
    else:
        brevity = max(0.3, 1 - (avg_words - 12) / 20)  # Too long

    return brevity


def calculate_hook_metrics(lyrics: str) -> dict:
    """Calculate detailed hook metrics.

    Args:
        lyrics: Combined lyrics text.

    Returns:
        Dict with detailed hook metrics.
    """
    lines = [line.strip() for line in lyrics.split('\n') if line.strip()]

    if len(lines) < 4:
        return {
            "hook_score": 0,
            "repetition": 0.0,
            "catchiness": 0.0,
            "rhythm_regularity": 0.0,
            "brevity": 0.0,
            "chorus_detected": False,
        }

    # Detect if there's a clear chorus
    paragraphs = [p.strip() for p in lyrics.split('\n\n') if p.strip()]
    para_hashes = Counter(md5(p.lower().encode()).hexdigest()[:8] for p in paragraphs)
    has_chorus = any(count > 1 for count in para_hashes.values())

    return {
        "hook_score": calculate_hook_score(lyrics),
        "repetition": round(_calculate_repetition_score(lyrics), 3),
        "catchiness": round(_calculate_phonetic_catchiness(lyrics, lines), 3),
        "rhythm_regularity": round(_calculate_rhythm_regularity(lyrics), 3),
        "brevity": round(_calculate_brevity_score(lyrics), 3),
        "chorus_detected": has_chorus,
    }


if __name__ == "__main__":
    # Test with sample lyrics (with repeated chorus)
    test_lyrics = """
    Dans la nuit je marche seul
    Les étoiles sont mon seul public
    Je chante pour oublier la douleur
    Ma voix résonne dans le noir

    C'est le refrain de ma vie
    C'est le refrain de ma vie
    Je chante encore et encore
    C'est le refrain de ma vie

    Les rues sont vides à cette heure
    Mais mon coeur bat comme un tambour
    Chaque pas me rapproche du jour
    Où je trouverai le bonheur

    C'est le refrain de ma vie
    C'est le refrain de ma vie
    Je chante encore et encore
    C'est le refrain de ma vie

    Et quand le soleil se lève enfin
    Je sais que demain sera mieux
    La musique guide mon chemin
    Vers des horizons radieux
    """

    print("=== Hook Analysis ===")
    metrics = calculate_hook_metrics(test_lyrics)
    for key, value in metrics.items():
        print(f"  {key}: {value}")
