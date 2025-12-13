"""
Punchline analyzer for punchlineScore metric.

Based on analysis of French rap punchline patterns:
1. Comparative Structure ("comme") - Unexpected juxtapositions
2. Paradox/Oxymoron - Internal contradictions
3. Wordplay/Calembours - Homophony, polysemy
4. Conditional Threat ("Si... alors...") - Cause-effect scenarios
5. Aphoristic Statements - Philosophical maxims ("La vie c'est...")
6. Self-Deprecating Boast - Bragging through darkness
7. Cultural Reference Hijacking - Twisted references
8. Chiasm/Reversal - Inverted logic
9. Quantification - Numbers for emphasis
10. Interrogative Challenge - Rhetorical questions

The key insight: French rap punchlines compress maximum semantic tension
into minimum syllables. They don't just sound good, they PROVE something.
"""

import re
import sys
from pathlib import Path
from collections import Counter

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from nlp.french_tokenizer import FrenchTokenizer, get_nlp
from nlp.slang_normalizer import get_slang_density, ALL_SLANG
from config import PUNCHLINE_WEIGHTS


def calculate_punchline_score(lyrics: str) -> float:
    """Calculate punchline score based on French rap rhetorical patterns.

    V3 Algorithm - Based on research (SensCritique, MinutePunchline):
    - Brevity: Average 13 words per punchline, 8-20 optimal
    - Connectors: "mais", "pourtant" in 66% of punchlines
    - Personal refs: 47% are auto-referential (j'suis, j'ai, mon, moi)
    - Multi-patterns: Combo bonus for layered techniques

    Components:
    - Rhetorical devices (35%): comme, si/alors, chiasm, questions
    - Paradox/Contraste (25%): mais, pourtant, antithèse
    - Wordplay/Calembours (25%): Homophones, double meanings
    - Cultural hijacking (15%): References used cleverly

    Args:
        lyrics: Combined lyrics text from all songs.

    Returns:
        Punchline score from 0-100.
    """
    if not lyrics or not lyrics.strip():
        return 0.0

    lines = [line.strip() for line in lyrics.split('\n') if line.strip()]

    if len(lines) < 4:
        return 0.0

    lyrics_lower = lyrics.lower()

    # Calculate components with V3 weights
    rhetorical = _calculate_rhetorical_devices(lyrics, lines)
    wordplay = _calculate_wordplay_v2(lyrics, lines)
    paradox = _calculate_paradox_philosophy(lyrics, lines)
    references = _calculate_cultural_hijacking(lyrics, lines)

    # Base score with new weights
    base_score = (
        rhetorical * 0.35 * 100 +
        paradox * 0.25 * 100 +
        wordplay * 0.25 * 100 +
        references * 0.15 * 100
    )

    # === BONUS: Connecteurs de chute (66% des punchlines) ===
    fall_connectors = re.findall(
        r'\b(?:mais|pourtant|même\s+si|alors\s+que|cependant|or|sauf\s+que)\b',
        lyrics_lower
    )
    connector_ratio = len(fall_connectors) / len(lines) if lines else 0
    connector_bonus = min(8, connector_ratio * 40)  # Max +8 points

    # === BONUS: Référence personnelle (47% des punchlines) ===
    personal_refs = re.findall(
        r"\b(?:j['']?(?:suis|ai|étais|avais|fais|veux|peux|dois|mets|vis|reste)|mon|ma|mes|moi)\b",
        lyrics_lower
    )
    personal_ratio = len(personal_refs) / len(lines) if lines else 0
    personal_bonus = min(5, personal_ratio * 10)  # Max +5 points

    # === BONUS: Brièveté des lignes (8-20 mots optimal) ===
    word_counts = [len(line.split()) for line in lines if line.strip()]
    if word_counts:
        avg_words = sum(word_counts) / len(word_counts)
        if 8 <= avg_words <= 15:
            brevity_bonus = 5  # Optimal brevity
        elif 6 <= avg_words <= 20:
            brevity_bonus = 3  # Acceptable
        else:
            brevity_bonus = 0
    else:
        brevity_bonus = 0

    # === BONUS: Patterns multiples (cumul = plus fort) ===
    patterns_active = sum([
        rhetorical > 0.3,
        wordplay > 0.3,
        paradox > 0.3,
        references > 0.2,
        connector_ratio > 0.1,
        personal_ratio > 0.2,
    ])
    if patterns_active >= 5:
        combo_bonus = 7
    elif patterns_active >= 4:
        combo_bonus = 5
    elif patterns_active >= 3:
        combo_bonus = 3
    else:
        combo_bonus = 0

    # Final score
    score = base_score + connector_bonus + personal_bonus + brevity_bonus + combo_bonus

    return min(100, max(0, round(score)))


def _calculate_rhetorical_devices(lyrics: str, lines: list[str]) -> float:
    """Detect rhetorical punchline structures.

    Patterns:
    1. Comparative ("comme") with unexpected juxtaposition
    2. Conditional threat ("si... alors/sinon")
    3. Interrogative challenge (rhetorical questions)
    4. Quantification for emphasis (numbers)

    Args:
        lyrics: Full lyrics text.
        lines: List of lyric lines.

    Returns:
        Rhetorical devices score (0-1).
    """
    score = 0
    lyrics_lower = lyrics.lower()

    # === 1. COMPARATIVE STRUCTURE ("comme") ===
    # "Mon rap choque comme une nonne qui fume le crack"
    # The power is in unexpected juxtapositions
    comme_patterns = [
        # "comme un/une [noun]" - basic simile
        r'\bcomme\s+(?:un|une|le|la|des|les)\s+\w+',
        # "comme si" - hypothetical comparison
        r'\bcomme\s+si\b',
        # "tel/telle un/une" - formal comparison
        r'\btel(?:le)?s?\s+(?:un|une|le|la)\s+\w+',
    ]

    for pattern in comme_patterns:
        matches = re.findall(pattern, lyrics_lower)
        score += len(matches) * 0.8

    # === 2. CONDITIONAL THREAT ("Si... alors...") ===
    # "Si on peignait les cons en vert, les commissariats seraient des prairies"
    conditional_patterns = [
        r"\bsi\s+(?:tu|on|je|il|elle|ils|elles|vous|nous)\s+\w+.*?,",  # Si + clause
        r"\bsi\s+(?:j'|t'|on\s|il\s|elle\s)\w+",  # Si j'étais, Si t'avais
        r"\bfaut\s+(?:pas\s+)?que\s+(?:tu|je|on)\b",  # Faut que tu...
        r"\b(?:sinon|autrement)\b",  # Threat consequence
    ]

    for pattern in conditional_patterns:
        matches = re.findall(pattern, lyrics_lower)
        score += len(matches) * 1.0

    # === 3. INTERROGATIVE CHALLENGE ===
    # "Qui peut prétendre faire du rap sans prendre position ?"
    # "C'est quoi un artiste ?"
    question_patterns = [
        r"\b(?:qui|quoi|comment|pourquoi|où|quand)\s+\w+.*\?",  # Wh-questions
        r"\bc'est\s+quoi\b",  # "C'est quoi..."
        r"\bt(?:'|u\s)(?:crois|penses|veux)\s+quoi\b",  # Tu crois quoi
        r"\?",  # Any question (weighted less)
    ]

    questions = 0
    for i, pattern in enumerate(question_patterns):
        matches = re.findall(pattern, lyrics_lower)
        # First patterns worth more (real rhetorical questions)
        weight = 1.2 if i < 3 else 0.3
        questions += len(matches) * weight

    score += min(questions, len(lines) * 0.5)  # Cap at 50% of lines

    # === 4. QUANTIFICATION FOR EMPHASIS ===
    # "21 joints par jour comme si c'était le solstice d'été"
    # Numbers used for rhetorical effect
    number_patterns = [
        r'\b\d+\s+(?:fois|jours?|ans?|heures?|balles?|grammes?)\b',
        r'\b(?:cent|mille|million)\s+\w+',
        r'\b(?:premier|deuxième|dernier)\b',
    ]

    for pattern in number_patterns:
        matches = re.findall(pattern, lyrics_lower)
        score += len(matches) * 0.6

    # Normalize by line count
    # Real data shows ~0.05-0.15 devices per line in good rap
    per_line = score / len(lines) if lines else 0
    return min(1.0, per_line / 0.12)


def _calculate_wordplay_v2(lyrics: str, lines: list[str]) -> float:
    """Detect French rap wordplay (calembours).

    Patterns:
    - Homophony exploitation (same sound, different meaning)
    - Polysemy (same word, multiple meanings)
    - Syllable games (verlan-style inversions)
    - Sound repetition creating meaning

    Args:
        lyrics: Full lyrics text.
        lines: List of lyric lines.

    Returns:
        Wordplay score (0-1).
    """
    score = 0
    lyrics_lower = lyrics.lower()

    # === HOMOPHONE PAIRS (expanded for French rap) ===
    # These are words that sound the same but mean different things
    homophones = [
        ("mer", "mère", "maire"),
        ("vers", "vert", "verre", "ver"),
        ("sain", "sein", "saint", "ceint"),
        ("sang", "sans", "cent", "sent"),
        ("temps", "tant", "tend", "t'en"),
        ("voix", "voie", "vois", "voit"),
        ("foi", "fois", "foie"),
        ("air", "aire", "ère", "hère", "erre"),
        ("ancre", "encre"),
        ("chaîne", "chêne"),
        ("champ", "chant"),
        ("cou", "coup", "coût"),
        ("faim", "fin", "feint"),
        ("poids", "pois"),
        ("port", "porc", "pore"),
        ("saut", "sceau", "seau", "sot"),
        ("vingt", "vin", "vain"),
        ("compte", "conte", "comte"),
        ("court", "cour", "cours"),
        ("pain", "pin", "peint"),
        ("pot", "peau"),
        ("mot", "maux"),
        ("toi", "toit"),
        ("sou", "sous", "soûl"),
        ("père", "pair", "paire", "perd"),
        ("mur", "mûr"),
        ("bal", "balle"),
        ("date", "datte"),
        ("point", "poing"),
        ("sale", "salle"),
    ]

    for group in homophones:
        found = []
        for word in group:
            if re.search(rf'\b{word}s?\b', lyrics_lower):
                found.append(word)
        if len(found) >= 2:
            score += len(found) * 1.5  # Multiple homophones = strong wordplay

    # === POLYSEMY MARKERS ===
    # Indicators that a word is being used with double meaning
    polysemy_indicators = [
        r'dans tous les sens',
        r'au propre comme au figuré',
        r'au sens propre',
        r'au premier degré',
        r'au second degré',
        r'double sens',
        r'si tu vois ce que',
        r'tu (?:vois|captes|comprends)\s+(?:le|ce que)',
        r'(?:c\'est|y\'a)\s+(?:un\s+)?jeu de mot',
    ]

    for pattern in polysemy_indicators:
        if re.search(pattern, lyrics_lower):
            score += 4  # Explicit wordplay acknowledgment

    # === SOUND PLAY (alliteration, assonance) ===
    # 3+ consecutive words starting with same sound
    alliteration = re.findall(
        r'\b([bcdfghjklmnpqrstvwxz])\w+\s+\1\w+\s+\1\w+',
        lyrics_lower
    )
    score += len(alliteration) * 1.0

    # === SYLLABLE/WORD MANIPULATION ===
    # Patterns suggesting intentional word breaking/combining
    word_manipulation = [
        r'\b\w+-\w+\b',  # Hyphenated compound words
        r"l[''](?:a|e|é)\w+",  # Elision games
    ]

    for pattern in word_manipulation:
        matches = re.findall(pattern, lyrics_lower)
        score += len(matches) * 0.2

    # Normalize - real data shows ~0.03-0.08 wordplay per line
    per_line = score / len(lines) if lines else 0
    return min(1.0, per_line / 0.08)


def _calculate_paradox_philosophy(lyrics: str, lines: list[str]) -> float:
    """Detect paradox, oxymoron, and philosophical aphorisms.

    Patterns:
    - Oxymorons (contradictory terms together)
    - Paradoxical statements
    - Aphoristic "La vie c'est..." statements
    - Self-deprecating boasts

    Args:
        lyrics: Full lyrics text.
        lines: List of lyric lines.

    Returns:
        Paradox/philosophy score (0-1).
    """
    score = 0
    lyrics_lower = lyrics.lower()

    # === ANTITHESIS PAIRS (expanded) ===
    # Opposing concepts in close proximity
    antithesis_pairs = [
        (r'\b(?:vie|vivre|vivant)\b', r'\b(?:mort|mourir|crever|décès)\b'),
        (r'\b(?:amour|aimer|aime)\b', r'\b(?:haine|haïr|détester)\b'),
        (r'\b(?:riche|richesse|thune)\b', r'\b(?:pauvre|misère|hess|galère)\b'),
        (r'\b(?:ange|angélique)\b', r'\b(?:démon|diable|satan)\b'),
        (r'\b(?:ciel|paradis)\b', r'\b(?:enfer|terre|sol)\b'),
        (r'\b(?:lumière|jour|soleil)\b', r'\b(?:ombre|nuit|noir|obscurité)\b'),
        (r'\b(?:vérité|vrai)\b', r'\b(?:mensonge|mentir|faux)\b'),
        (r'\b(?:ami|frère|pote)\b', r'\b(?:ennemi|traître|serpent)\b'),
        (r'\b(?:début|commence)\b', r'\b(?:fin|termine|finit)\b'),
        (r'\b(?:monter|haut|sommet)\b', r'\b(?:tomber|bas|fond)\b'),
        (r'\b(?:espoir|rêve)\b', r'\b(?:désespoir|cauchemar)\b'),
        (r'\b(?:innocent|pur)\b', r'\b(?:coupable|sale|souillé)\b'),
        (r'\b(?:silence|muet)\b', r'\b(?:bruit|crier|gueuler)\b'),
        (r'\b(?:chaud|brûle)\b', r'\b(?:froid|glace|geler)\b'),
    ]

    for pattern1, pattern2 in antithesis_pairs:
        # Check if both appear in same line or adjacent lines
        for i, line in enumerate(lines):
            line_lower = line.lower()
            has_first = re.search(pattern1, line_lower)
            has_second = re.search(pattern2, line_lower)

            if has_first and has_second:
                score += 2.5  # Same line = strong antithesis

            # Check adjacent line
            if i + 1 < len(lines):
                next_line = lines[i + 1].lower()
                if has_first and re.search(pattern2, next_line):
                    score += 1.5
                if has_second and re.search(pattern1, next_line):
                    score += 1.5

    # === APHORISTIC STATEMENTS ===
    # "La vie c'est...", "Le monde est...", universal truth format
    aphorism_patterns = [
        r'\bla vie\s+(?:c\'est|est|n\'est)\b',
        r'\ble monde\s+(?:c\'est|est)\b',
        r'\bl\'amour\s+(?:c\'est|est|n\'est)\b',
        r'\bla mort\s+(?:c\'est|est)\b',
        r'\ble rap\s+(?:c\'est|est)\b',
        r'\bla rue\s+(?:c\'est|est|m\'a)\b',
        r'\brien ne sert de\b',
        r'\bmieux vaut\b',
        r'\bqui veut\s+\w+\s+doit\b',
        r'\bon (?:ne\s+)?(?:naît|meurt|vit)\b.*\bon (?:ne\s+)?(?:naît|meurt|vit)\b',
    ]

    for pattern in aphorism_patterns:
        matches = re.findall(pattern, lyrics_lower)
        score += len(matches) * 2.0

    # === SELF-DEPRECATING BOAST ===
    # Bragging through darkness or self-destruction
    dark_boast_patterns = [
        r'\bj\'ai\s+(?:grandi|vécu)\s+.*(?:mort|seul|noir|sombre)',
        r'\bj(?:\'|e\s)suis\s+(?:tellement|si)\s+\w+\s+que\b',
        r'\bsoit\s+(?:je|on)\s+\w+\s+soit\s+(?:je|on)\b',
        r'\bj\'(?:préfère|veux)\s+(?:mourir|crever)\b',
    ]

    for pattern in dark_boast_patterns:
        matches = re.findall(pattern, lyrics_lower)
        score += len(matches) * 2.0

    # === OXYMORONS (explicit contradictions) ===
    oxymoron_patterns = [
        r'\b(?:silence|muet)\s+(?:assourdissant|bruyant)\b',
        r'\b(?:mort|mourir)\s+(?:vivant|de vivre)\b',
        r'\b(?:feu|brûle)\s+(?:froid|glacé)\b',
        r'\bglace\s+(?:brûle|chaud)\b',
        r'\bobscure\s+clarté\b',
        r'\bnostalgique\s+du\s+futur\b',
    ]

    for pattern in oxymoron_patterns:
        if re.search(pattern, lyrics_lower):
            score += 3.0

    # Normalize - real data shows ~0.02-0.05 paradox per line
    per_line = score / len(lines) if lines else 0
    return min(1.0, per_line / 0.05)


def _calculate_cultural_hijacking(lyrics: str, lines: list[str]) -> float:
    """Detect clever cultural reference usage.

    Not just name-dropping but HIJACKING references for new meaning.
    Penalizes lazy brand drops.

    Args:
        lyrics: Full lyrics text.
        lines: List of lyric lines.

    Returns:
        Cultural hijacking score (0-1).
    """
    score = 0
    lyrics_lower = lyrics.lower()

    # === MEANINGFUL CULTURAL REFERENCES ===
    # Historical, literary, mythological - used as metaphor
    cultural_refs = [
        # Historical figures (used for comparison)
        r'\b(?:comme|tel)\s+(?:un\s+)?(?:César|Napoleon|Spartacus|Alexandre)\b',
        r'\b(?:comme|tel)\s+(?:un\s+)?(?:Hercule|Ulysse|Achille|Zeus)\b',
        # Literary references
        r'\b(?:Hamlet|Macbeth|Faust|Cyrano|Monte-Cristo|Quichotte)\b',
        # French literary giants
        r'\b(?:Molière|Hugo|Voltaire|Rimbaud|Baudelaire|Céline)\b',
        # Cinema used as metaphor (not just name-drop)
        r'\b(?:comme|tel)\s+(?:un\s+)?(?:Scarface|Parrain|Soprano)\b',
        # Social/political awareness
        r'\b(?:Malcolm|Luther\s+King|Mandela|Rosa\s+Parks|Che)\b',
        # Sports legends (French context)
        r'\b(?:Zidane|Mbappé|Platini)\b.*(?:arrêt|but|match)',
    ]

    for pattern in cultural_refs:
        matches = re.findall(pattern, lyrics_lower, re.IGNORECASE)
        score += len(matches) * 2.0

    # === BRAND PENALTY ===
    # Lazy brand drops indicate lack of lyrical sophistication
    brand_patterns = [
        r'\b(?:Gucci|Louis\s*Vuitton|Prada|Hermès|Dior|Chanel|Balenciaga)\b',
        r'\b(?:Rolex|Cartier|Audemars|Patek|Richard\s+Mille)\b',
        r'\b(?:Ferrari|Lamborghini|Porsche|Bentley|Maybach)\b',
        r'\b(?:Louboutin|Yeezy|Jordan|Supreme)\b',
    ]

    brand_count = 0
    for pattern in brand_patterns:
        matches = re.findall(pattern, lyrics, re.IGNORECASE)
        brand_count += len(matches)

    # Apply penalty: more brands = lower score
    word_count = len(lyrics.split())
    if word_count > 0:
        brand_ratio = brand_count / word_count
        brand_penalty = min(0.4, brand_ratio * 15)  # Max 40% penalty
        score = max(0, score - brand_penalty * len(lines))

    # Normalize - real data shows ~0.005-0.02 cultural refs per line
    per_line = score / len(lines) if lines else 0
    return min(1.0, max(0, per_line / 0.02))


# Keep old function for backward compatibility but mark as deprecated
def _calculate_semantic_density(lyrics: str, lines: list[str]) -> float:
    """DEPRECATED: Use _calculate_rhetorical_devices instead."""
    return _calculate_rhetorical_devices(lyrics, lines)


def _calculate_wordplay(lyrics: str, lines: list[str]) -> float:
    """Detect wordplay: homophones, double meanings, antithesis, paronymie.

    Enhanced to better detect sophisticated French rap wordplay.

    Args:
        lyrics: Full lyrics text.
        lines: List of lyric lines.

    Returns:
        Wordplay score (0-1).
    """
    wordplay_count = 0

    # === ADVANCED WORDPLAY PATTERNS ===

    # Antithesis (opposition) - very common in quality rap
    antithesis_patterns = [
        r'\b(vie|vivre)\b.*\b(mort|mourir|crever)\b',
        r'\b(mort|mourir)\b.*\b(vie|vivre)\b',
        r'\b(amour|aimer)\b.*\b(haine|haïr|détester)\b',
        r'\b(riche|richesse)\b.*\b(pauvre|misère|hess)\b',
        r'\b(ange)\b.*\b(démon|diable)\b',
        r'\b(ciel|paradis)\b.*\b(enfer|terre)\b',
        r'\b(lumière|jour)\b.*\b(ombre|nuit|noir)\b',
        r'\b(vérité)\b.*\b(mensonge)\b',
        r'\b(ami|frère)\b.*\b(ennemi|traître)\b',
        r'\b(début|commence)\b.*\b(fin|termine)\b',
    ]

    for pattern in antithesis_patterns:
        matches = re.findall(pattern, lyrics.lower())
        wordplay_count += len(matches) * 2  # Antithesis = strong wordplay

    # Paronymie (similar words, different meanings)
    paronym_pairs = [
        (r'\binfluence\b', r'\baffluence\b'),
        (r'\billusion\b', r'\ballusion\b'),
        (r'\bévasion\b', r'\binvasion\b'),
        (r'\bconjurer\b', r'\bjurer\b'),
        (r'\battention\b', r'\bintention\b'),
        (r'\béminent\b', r'\bimminent\b'),
    ]

    words_lower = lyrics.lower()
    for word1, word2 in paronym_pairs:
        if re.search(word1, words_lower) and re.search(word2, words_lower):
            wordplay_count += 3  # Paronymie = sophisticated

    # Polysemy indicators (same word, context suggests double meaning)
    # Often marked by "dans tous les sens", "au propre comme au figuré"
    polysemy_markers = [
        r'dans tous les sens',
        r'au propre comme au figuré',
        r'au sens propre',
        r'c\'est pas qu\'une image',
        r'littéralement',
        r'au premier degré',
        r'double sens',
    ]

    for pattern in polysemy_markers:
        if re.search(pattern, lyrics.lower()):
            wordplay_count += 4  # Explicit double meaning

    # Sound repetition (alliteration) - 3+ words starting same consonant
    alliteration = re.findall(
        r'\b([bcdfghjklmnpqrstvwxz])\w+\s+\1\w+\s+\1\w+',
        lyrics.lower()
    )
    wordplay_count += len(alliteration) * 1.5

    # Assonance (vowel repetition in stressed syllables)
    # Simplified: same vowel pattern repeated
    assonance = re.findall(
        r'\b\w*([aeiou]{2,})\w*\b.*\b\w*\1\w*\b',
        lyrics.lower()
    )
    wordplay_count += len(assonance)

    # === HOMOPHONE DETECTION (expanded) ===
    homophones = [
        ("mer", "mère", "maire"),
        ("vers", "vert", "verre", "ver"),
        ("sain", "sein", "saint", "ceint"),
        ("pain", "pin", "peint"),
        ("conte", "compte", "comte"),
        ("cour", "cours", "court", "courent"),
        ("sang", "sans", "cent", "sent", "s'en"),
        ("temps", "tant", "tend", "tends", "t'en"),
        ("voix", "voie", "vois", "voit"),
        ("foi", "fois", "foie"),
        ("air", "aire", "ère", "hère"),
        ("ancre", "encre"),
        ("autel", "hôtel"),
        ("bal", "balle"),
        ("camp", "quand", "qu'en"),
        ("chair", "chère", "cher"),
        ("chaîne", "chêne"),
        ("champ", "chant"),
        ("coeur", "choeur"),
        ("cou", "coup", "coût"),
        ("faim", "fin", "feint"),
        ("flair", "flaire"),
        ("poids", "pois", "poix"),
        ("port", "porc", "pore"),
        ("saut", "sceau", "seau", "sot"),
        ("sol", "sole"),
        ("sou", "sous", "soûl"),
        ("toi", "toit"),
        ("vingt", "vin", "vain", "vint"),
    ]

    for group in homophones:
        found = sum(1 for word in group if re.search(rf'\b{word}\b', words_lower))
        if found >= 2:  # Multiple homophones from same group
            wordplay_count += found * 1.5

    # Questions followed by answers (setup/punchline structure)
    question_answer = re.findall(r'\?[^.!?]*[.!]', lyrics)
    wordplay_count += len(question_answer) * 0.5

    # Normalize - expect quality rap to have ~0.5-1.5 wordplay per line
    per_line = wordplay_count / len(lines) if lines else 0
    return min(1.0, per_line / 1.5)


def _calculate_metaphor_ratio(lyrics: str, lines: list[str]) -> float:
    """Detect metaphors and similes in lyrics.

    Args:
        lyrics: Full lyrics text.
        lines: List of lyric lines.

    Returns:
        Metaphor density score (0-1).
    """
    metaphor_count = 0

    # Simile patterns (explicit comparisons)
    simile_patterns = [
        r'\bcomme\s+(?:un|une|le|la|les|des)\s+\w+',  # "comme un lion"
        r'\btel(?:le)?(?:s)?\s+(?:un|une|le|la|les|des)\s+\w+',  # "tel un roi"
        r'\bpareil(?:le)?(?:s)?\s+(?:à|au|aux)\s+\w+',  # "pareil à"
        r'\baussi\s+\w+\s+que\s+\w+',  # "aussi fort que"
        r'\bplus\s+\w+\s+que\s+\w+',  # "plus grand que"
    ]

    for pattern in simile_patterns:
        matches = re.findall(pattern, lyrics.lower())
        metaphor_count += len(matches) * 1.5  # Similes slightly weighted up

    # Metaphor patterns (implicit comparisons)
    metaphor_patterns = [
        r"\bc'est\s+(?:un|une|le|la|les|des|du|de la)\s+\w+",  # "c'est un combat"
        r'\bje\s+suis\s+(?:un|une|le|la)\s+\w+',  # "je suis un loup"
        r'\btu\s+es\s+(?:un|une|le|la)\s+\w+',  # "tu es un traître"
        r'\b(?:mon|ma|mes|ton|ta|tes|son|sa|ses)\s+\w+\s+(?:de|du|des)\s+\w+',  # possessive metaphors
    ]

    for pattern in metaphor_patterns:
        matches = re.findall(pattern, lyrics.lower())
        metaphor_count += len(matches)

    # Abstract/concrete juxtaposition (common in punchlines)
    abstract_concrete = [
        r'\b(?:coeur|âme|esprit|rêve|espoir|peur|rage|haine|amour)\s+(?:de|du|en)\s+(?:fer|acier|pierre|béton|or|diamant|feu|glace)',
    ]

    for pattern in abstract_concrete:
        matches = re.findall(pattern, lyrics.lower())
        metaphor_count += len(matches) * 2  # Strong imagery bonus

    # Normalize (expect ~15-30% of lines with figurative language in good rap)
    per_line = metaphor_count / len(lines) if lines else 0
    return min(1.0, per_line / 0.4)


def _calculate_reference_density(lyrics: str) -> float:
    """Calculate density of meaningful cultural/pop references.

    IMPORTANT: Brand names (Gucci, Rolex, etc.) are NOT counted as
    meaningful references. They don't demonstrate lyrical skill.

    Args:
        lyrics: Full lyrics text.

    Returns:
        Reference density score (0-1).
    """
    nlp = get_nlp()
    doc = nlp(lyrics)

    # Count named entities (people, places) - but filter out brands
    reference_labels = {"PER", "LOC", "EVENT"}  # Removed ORG, MISC (often brands)
    references = [ent for ent in doc.ents if ent.label_ in reference_labels]

    # MEANINGFUL references only (NOT brands)
    # Historical, mythological, literary, cinema (used as metaphor)
    meaningful_patterns = [
        # Historical/mythological (shows culture)
        r'\b(?:César|Napoleon|Spartacus|Hercule|Zeus|Pharaon|Ulysse|Achille)\b',
        r'\b(?:Cléopâtre|Néron|Caligula|Alexandre|Hannibal|Vercingétorix)\b',
        # Literary references
        r'\b(?:Hamlet|Macbeth|Faust|Don Quichotte|Cyrano|Monte-Cristo)\b',
        # Cinema classics (when used as metaphor, not flex)
        r'\b(?:Scarface|Parrain|Godfather)\b',  # Reduced - only iconic ones
        # French history/culture
        r'\b(?:Molière|Hugo|Voltaire|Rousseau|Rimbaud|Baudelaire)\b',
        # Social/political (shows awareness)
        r'\b(?:Malcolm|Luther King|Mandela|Che Guevara|Rosa Parks)\b',
    ]

    # Patterns that indicate LAZY writing (penalized)
    brand_patterns = [
        r'\b(?:Gucci|Louis Vuitton|Prada|Hermès|Dior|Chanel|Balenciaga)\b',
        r'\b(?:Rolex|Cartier|Audemars|Patek|Richard Mille)\b',
        r'\b(?:Ferrari|Lamborghini|Porsche|Bentley|Maybach|McLaren)\b',
        r'\b(?:Louboutin|Yeezy|Jordan|Nike|Supreme)\b',
    ]

    # Count meaningful references
    meaningful_count = 0
    for pattern in meaningful_patterns:
        matches = re.findall(pattern, lyrics, re.IGNORECASE)
        meaningful_count += len(matches)

    # Count brand drops (penalty)
    brand_count = 0
    for pattern in brand_patterns:
        matches = re.findall(pattern, lyrics, re.IGNORECASE)
        brand_count += len(matches)

    # Total = NER entities + meaningful patterns - brand penalty
    total_refs = len(references) + meaningful_count * 2  # Boost meaningful refs

    # Apply brand penalty: too many brands = less lyrical skill
    word_count = len(lyrics.split())
    if word_count == 0:
        return 0.0

    brand_ratio = brand_count / word_count
    brand_penalty = min(0.3, brand_ratio * 10)  # Max 30% penalty

    # Normalize by text length
    ref_ratio = total_refs / word_count
    base_score = min(1.0, ref_ratio * 40)

    # Apply penalty for brand-heavy lyrics
    return max(0.0, base_score - brand_penalty)


def calculate_punchline_metrics(lyrics: str) -> dict:
    """Calculate detailed punchline metrics using the new V2 algorithm.

    Based on 10 French rap punchline patterns:
    1. Comparative (comme), 2. Paradox, 3. Calembours, 4. Si/alors,
    5. Aphorisms, 6. Dark boasts, 7. Cultural hijacking, 8. Chiasm,
    9. Quantification, 10. Rhetorical questions

    Args:
        lyrics: Combined lyrics text.

    Returns:
        Dict with detailed punchline metrics.
    """
    lines = [line.strip() for line in lyrics.split('\n') if line.strip()]

    if len(lines) < 4:
        return {
            "punchline_score": 0,
            "rhetorical_devices": 0.0,
            "wordplay": 0.0,
            "paradox_philosophy": 0.0,
            "cultural_refs": 0.0,
            "slang_density": 0.0,
        }

    return {
        "punchline_score": calculate_punchline_score(lyrics),
        "rhetorical_devices": round(_calculate_rhetorical_devices(lyrics, lines), 3),
        "wordplay": round(_calculate_wordplay_v2(lyrics, lines), 3),
        "paradox_philosophy": round(_calculate_paradox_philosophy(lyrics, lines), 3),
        "cultural_refs": round(_calculate_cultural_hijacking(lyrics, lines), 3),
        "slang_density": round(get_slang_density(lyrics), 3),
    }


if __name__ == "__main__":
    # Test with sample lyrics
    test_lyrics = """
    Je suis un loup dans la jungle de béton
    Mon coeur de pierre ne connaît pas le pardon
    Comme Scarface je monte les échelons
    La rue m'a forgé, wallah c'est pas du bidon

    J'ai le flow comme De Niro dans Casino
    Les billets comme l'eau, j'en ai plein les kilos
    Ma plume est un glaive, mes mots sont des flammes
    Je grave mon nom dans l'histoire, c'est mon programme

    C'est la hess ou la richesse, pas de milieu
    Je prie le ciel mais je vis comme si y'avait pas de Dieu
    Tel un phoenix je renais de mes cendres
    Mes rimes sont des balles, tu ferais mieux de te rendre
    """

    print("=== Punchline Analysis ===")
    metrics = calculate_punchline_metrics(test_lyrics)
    for key, value in metrics.items():
        print(f"  {key}: {value}")
