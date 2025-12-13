"""Flow analyzer for flowScore metric - rhymes, syllables, cadence."""

import re
import sys
from pathlib import Path
from collections import Counter
from typing import Optional

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from nlp.phonetics import (
    get_phonetic_ending,
    count_syllables_french,
    syllables_per_line,
    rhymes_with,
)
from config import FLOW_WEIGHTS


def calculate_flow_score(lyrics: str) -> float:
    """Calculate flow score based on rhyme patterns and rhythm.

    Components:
    - Rhyme density (40%): Ratio of rhyming line endings
    - Internal rhymes (25%): Rhymes within lines
    - Syllable variation (20%): Variety in line lengths
    - Multisyllabic rhymes (15%): Complex rhyme patterns

    Args:
        lyrics: Combined lyrics text from all songs.

    Returns:
        Flow score from 0-100.
    """
    if not lyrics or not lyrics.strip():
        return 0.0

    lines = [line.strip() for line in lyrics.split('\n') if line.strip()]

    if len(lines) < 4:
        return 0.0

    # Calculate components
    rhyme_density = _calculate_rhyme_density(lines)
    internal_rhymes = _calculate_internal_rhymes(lines)
    syllable_variation = _calculate_syllable_variation(lines)
    multisyllabic = _calculate_multisyllabic_rhymes(lines)

    # Weighted combination
    score = (
        rhyme_density * FLOW_WEIGHTS["rhyme_density"] * 100 +
        internal_rhymes * FLOW_WEIGHTS["internal_rhymes"] * 100 +
        syllable_variation * FLOW_WEIGHTS["syllable_variation"] * 100 +
        multisyllabic * FLOW_WEIGHTS["multisyllabic"] * 100
    )

    return min(100, max(0, round(score)))


def _calculate_rhyme_density(lines: list[str]) -> float:
    """Calculate the density of end-of-line rhymes.

    Args:
        lines: List of lyric lines.

    Returns:
        Rhyme density ratio (0-1).
    """
    if len(lines) < 2:
        return 0.0

    # Get last word of each line
    last_words = []
    for line in lines:
        words = re.findall(r"[a-zàâäéèêëïîôùûüœæ]+", line.lower())
        if words:
            last_words.append(words[-1])
        else:
            last_words.append("")

    # Count rhyming pairs (check consecutive and alternating)
    rhyme_count = 0
    total_pairs = 0

    for i in range(len(last_words) - 1):
        # Check consecutive (AABB pattern)
        if last_words[i] and last_words[i + 1]:
            total_pairs += 1
            if rhymes_with(last_words[i], last_words[i + 1]):
                rhyme_count += 1

        # Check alternating (ABAB pattern)
        if i + 2 < len(last_words) and last_words[i] and last_words[i + 2]:
            total_pairs += 1
            if rhymes_with(last_words[i], last_words[i + 2]):
                rhyme_count += 1

    if total_pairs == 0:
        return 0.0

    # Normalize to 0-1 range (expect ~30-50% rhyming in good rap)
    density = rhyme_count / total_pairs
    return min(1.0, density * 2)  # Scale up since perfect rhyming is rare


def _calculate_internal_rhymes(lines: list[str]) -> float:
    """Calculate density of rhymes within lines (internal rhymes).

    Args:
        lines: List of lyric lines.

    Returns:
        Internal rhyme score (0-1).
    """
    if not lines:
        return 0.0

    total_internal = 0
    lines_with_internal = 0

    for line in lines:
        words = re.findall(r"[a-zàâäéèêëïîôùûüœæ]+", line.lower())
        if len(words) < 4:
            continue

        # Check for rhymes between words within the line
        rhymes_found = 0
        for i in range(len(words)):
            for j in range(i + 2, len(words)):  # Skip adjacent words
                if rhymes_with(words[i], words[j], strictness=2):
                    rhymes_found += 1

        if rhymes_found > 0:
            lines_with_internal += 1
            total_internal += min(rhymes_found, 3)  # Cap at 3 per line

    if len(lines) == 0:
        return 0.0

    # Score based on percentage of lines with internal rhymes
    line_ratio = lines_with_internal / len(lines)
    # Average internal rhymes per line (normalized)
    avg_internal = total_internal / len(lines) if lines else 0

    return min(1.0, line_ratio * 0.6 + min(avg_internal / 2, 0.4))


def _calculate_syllable_variation(lines: list[str]) -> float:
    """Calculate syllable variation (rhythmic diversity).

    Good flow has intentional variation while maintaining cohesion.

    Args:
        lines: List of lyric lines.

    Returns:
        Syllable variation score (0-1).
    """
    syllables = syllables_per_line('\n'.join(lines))

    if len(syllables) < 4:
        return 0.5  # Neutral for short texts

    # Calculate coefficient of variation
    mean_syl = sum(syllables) / len(syllables)
    if mean_syl == 0:
        return 0.0

    variance = sum((s - mean_syl) ** 2 for s in syllables) / len(syllables)
    std_dev = variance ** 0.5
    cv = std_dev / mean_syl

    # Ideal CV is around 0.15-0.35 (some variation but not chaotic)
    # Too low = monotonous, too high = inconsistent
    if cv < 0.1:
        score = cv * 5  # Low variation penalty
    elif cv < 0.35:
        score = 0.8 + (0.35 - abs(cv - 0.25)) * 2  # Sweet spot
    else:
        score = max(0.3, 1.0 - (cv - 0.35) * 2)  # High variation penalty

    return min(1.0, max(0.0, score))


def _calculate_multisyllabic_rhymes(lines: list[str]) -> float:
    """Calculate presence of complex multisyllabic rhymes.

    Args:
        lines: List of lyric lines.

    Returns:
        Multisyllabic rhyme score (0-1).
    """
    if len(lines) < 2:
        return 0.0

    # Get last words
    last_words = []
    for line in lines:
        words = re.findall(r"[a-zàâäéèêëïîôùûüœæ]+", line.lower())
        if words:
            last_words.append(words[-1])

    # Check for multisyllabic rhymes (3+ phoneme matches)
    multi_rhymes = 0
    pairs_checked = 0

    for i in range(len(last_words)):
        for j in range(i + 1, min(i + 5, len(last_words))):  # Check nearby lines
            if last_words[i] and last_words[j]:
                pairs_checked += 1
                # Check for longer phonetic match (3+ phonemes)
                if rhymes_with(last_words[i], last_words[j], strictness=3):
                    multi_rhymes += 1

    if pairs_checked == 0:
        return 0.0

    # Normalize - expect ~10-20% multisyllabic in skilled rap
    ratio = multi_rhymes / pairs_checked
    return min(1.0, ratio * 5)


def calculate_flow_metrics(lyrics: str) -> dict:
    """Calculate detailed flow metrics.

    Args:
        lyrics: Combined lyrics text.

    Returns:
        Dict with detailed flow metrics.
    """
    lines = [line.strip() for line in lyrics.split('\n') if line.strip()]

    if len(lines) < 4:
        return {
            "flow_score": 0,
            "rhyme_density": 0.0,
            "internal_rhymes": 0.0,
            "syllable_variation": 0.0,
            "multisyllabic_rhymes": 0.0,
            "avg_syllables_per_line": 0.0,
        }

    syllables = syllables_per_line('\n'.join(lines))

    return {
        "flow_score": calculate_flow_score(lyrics),
        "rhyme_density": round(_calculate_rhyme_density(lines), 3),
        "internal_rhymes": round(_calculate_internal_rhymes(lines), 3),
        "syllable_variation": round(_calculate_syllable_variation(lines), 3),
        "multisyllabic_rhymes": round(_calculate_multisyllabic_rhymes(lines), 3),
        "avg_syllables_per_line": round(sum(syllables) / len(syllables), 1) if syllables else 0,
    }


if __name__ == "__main__":
    # Test with sample lyrics
    test_lyrics = """
    Dans la ville où les rêves se brisent
    Je marche seul sous les lumières grises
    Les mots sont des armes, les phrases des lames
    On écrit notre histoire avec nos flammes

    La rue m'a tout appris, la rue m'a tout pris
    Entre béton et ciel, je cherche un paradis
    Les souvenirs me hantent comme des fantômes
    Dans ce labyrinthe de pierre et de chrome

    Chaque mot est un combat, chaque rime une victoire
    Dans ce monde de béton, je cherche ma gloire
    Les étoiles sont loin mais je garde espoir
    Un jour j'atteindrai le sommet, c'est mon histoire
    """

    print("=== Flow Analysis ===")
    metrics = calculate_flow_metrics(test_lyrics)
    for key, value in metrics.items():
        print(f"  {key}: {value}")
