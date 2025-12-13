"""
French tokenizer using spaCy for lyrics analysis.

Pipeline NLP Français - Documentation
=====================================

Ce module utilise spaCy (https://spacy.io) pour l'analyse linguistique
du français, optimisé pour les paroles de rap.

Modèles spaCy disponibles pour le français:
-------------------------------------------
- fr_core_news_sm (15 MB): Petit modèle, rapide mais moins précis
- fr_core_news_md (44 MB): Modèle moyen, bon équilibre vitesse/précision [DÉFAUT]
- fr_core_news_lg (556 MB): Grand modèle, plus précis mais plus lent

Documentation: https://spacy.io/models/fr

Composants du pipeline:
-----------------------
1. Tokenizer: Découpage du texte en tokens (mots, ponctuation)
2. Lemmatizer: Réduction des mots à leur forme canonique
   Exemple: "mangeons" → "manger", "allés" → "aller"
3. POS Tagger: Étiquetage grammatical (NOUN, VERB, ADJ...)
4. NER: Reconnaissance d'entités nommées (personnes, lieux)

Utilisation:
-----------
    from nlp.french_tokenizer import FrenchTokenizer

    tokenizer = FrenchTokenizer()
    lemmas = tokenizer.get_unique_lemmas("Je marche dans la rue")
    # → {'marcher', 'rue'}

Références:
----------
- spaCy: https://spacy.io
- Modèles FR: https://spacy.io/models/fr
- Universal POS Tags: https://universaldependencies.org/u/pos/
"""

from typing import Optional
import spacy
from spacy.language import Language

# Global NLP instance (lazy loaded)
_nlp: Optional[Language] = None

# Configuration du modèle
# Options: "fr_core_news_sm", "fr_core_news_md", "fr_core_news_lg"
# "md" offre le meilleur rapport précision/performance pour notre usage
SPACY_MODEL = "fr_core_news_md"


def get_nlp(model: Optional[str] = None) -> Language:
    """Get or create the spaCy French NLP pipeline.

    Args:
        model: spaCy model name. Options:
            - "fr_core_news_sm": Small (15MB), fast, less accurate
            - "fr_core_news_md": Medium (44MB), balanced [default]
            - "fr_core_news_lg": Large (556MB), most accurate

    Returns:
        Loaded spaCy French model.

    Example:
        >>> nlp = get_nlp()  # Uses default fr_core_news_md
        >>> nlp = get_nlp("fr_core_news_lg")  # Use large model
    """
    global _nlp

    model_name = model or SPACY_MODEL

    if _nlp is None or (model and model != SPACY_MODEL):
        try:
            _nlp = spacy.load(model_name)
            print(f"✓ Loaded spaCy model: {model_name}")
        except OSError:
            print(f"Downloading spaCy model: {model_name}...")
            spacy.cli.download(model_name)
            _nlp = spacy.load(model_name)
            print(f"✓ Downloaded and loaded: {model_name}")

    return _nlp


class FrenchTokenizer:
    """French tokenizer optimized for rap lyrics analysis."""

    def __init__(self):
        """Initialize the tokenizer."""
        self.nlp = get_nlp()

        # French stop words to exclude from vocabulary counts
        self.stop_words = set(self.nlp.Defaults.stop_words)

        # Additional stop words common in rap
        self.rap_stop_words = {
            "ouais", "wesh", "yo", "hey", "oh", "ah", "eh",
            "nan", "nah", "bah", "pah", "tah", "rah",
            "la", "le", "les", "un", "une", "des",
            "j", "t", "m", "l", "s", "n", "d", "c", "qu",
            "yeah", "yah", "ya", "uh", "huh",
        }
        self.stop_words.update(self.rap_stop_words)

    def tokenize(self, text: str) -> list[str]:
        """Tokenize text into words.

        Args:
            text: Text to tokenize.

        Returns:
            List of tokens.
        """
        doc = self.nlp(text.lower())
        return [token.text for token in doc if token.is_alpha]

    def lemmatize(self, text: str) -> list[str]:
        """Get lemmatized forms of words.

        Args:
            text: Text to lemmatize.

        Returns:
            List of lemmas.
        """
        doc = self.nlp(text.lower())
        return [token.lemma_ for token in doc
                if token.is_alpha and len(token.text) > 1]

    def get_content_words(self, text: str) -> list[str]:
        """Get content words (excluding stop words).

        Args:
            text: Text to analyze.

        Returns:
            List of content words.
        """
        doc = self.nlp(text.lower())
        return [token.text for token in doc
                if token.is_alpha
                and token.text not in self.stop_words
                and len(token.text) > 1]

    def get_unique_lemmas(self, text: str, exclude_stops: bool = True) -> set[str]:
        """Get unique lemmatized words.

        Args:
            text: Text to analyze.
            exclude_stops: Whether to exclude stop words.

        Returns:
            Set of unique lemmas.
        """
        doc = self.nlp(text.lower())
        lemmas = set()

        for token in doc:
            if not token.is_alpha or len(token.text) < 2:
                continue
            if exclude_stops and token.text in self.stop_words:
                continue
            lemmas.add(token.lemma_)

        return lemmas

    def get_pos_tags(self, text: str) -> list[tuple[str, str]]:
        """Get part-of-speech tags for text.

        Args:
            text: Text to analyze.

        Returns:
            List of (word, POS) tuples.
        """
        doc = self.nlp(text)
        return [(token.text, token.pos_) for token in doc if token.is_alpha]

    def get_entities(self, text: str) -> list[tuple[str, str]]:
        """Extract named entities from text.

        Args:
            text: Text to analyze.

        Returns:
            List of (entity_text, entity_label) tuples.
        """
        doc = self.nlp(text)
        return [(ent.text, ent.label_) for ent in doc.ents]

    def get_nouns(self, text: str) -> list[str]:
        """Extract nouns from text.

        Args:
            text: Text to analyze.

        Returns:
            List of nouns.
        """
        doc = self.nlp(text)
        return [token.text for token in doc
                if token.pos_ == "NOUN" and token.is_alpha]

    def get_verbs(self, text: str) -> list[str]:
        """Extract verbs from text.

        Args:
            text: Text to analyze.

        Returns:
            List of verbs.
        """
        doc = self.nlp(text)
        return [token.text for token in doc
                if token.pos_ == "VERB" and token.is_alpha]

    def count_words(self, text: str) -> int:
        """Count total words in text.

        Args:
            text: Text to count.

        Returns:
            Word count.
        """
        doc = self.nlp(text)
        return sum(1 for token in doc if token.is_alpha)


if __name__ == "__main__":
    # Test the tokenizer
    tokenizer = FrenchTokenizer()

    test_text = """
    Dans la ville où les rêves se brisent
    Je marche seul sous les lumières grises
    Les mots sont des armes, les phrases des lames
    On écrit notre histoire avec nos flammes
    """

    print("Tokens:", tokenizer.tokenize(test_text)[:20])
    print("Lemmas:", tokenizer.lemmatize(test_text)[:20])
    print("Content words:", tokenizer.get_content_words(test_text)[:20])
    print("Unique lemmas:", len(tokenizer.get_unique_lemmas(test_text)))
    print("Entities:", tokenizer.get_entities(test_text))
    print("Word count:", tokenizer.count_words(test_text))
