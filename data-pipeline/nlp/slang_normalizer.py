"""Normalizer for French rap slang (verlan, argot)."""

# Verlan dictionary - reversed syllable words common in French rap
VERLAN_DICT = {
    # Common verlan
    "meuf": "femme",
    "keuf": "flic",
    "teuf": "fete",
    "chelou": "louche",
    "ouf": "fou",
    "cimer": "merci",
    "zarbi": "bizarre",
    "relou": "lourd",
    "beur": "arabe",
    "rebeu": "arabe",
    "trom": "metro",
    "reum": "mere",
    "reup": "pere",
    "reuf": "frere",
    "reus": "soeur",
    "teci": "cite",
    "teci": "cite",
    "tess": "cite",
    "zyva": "vas-y",
    "ziva": "vas-y",
    "vazy": "vas-y",
    "pécho": "choper",
    "chanmé": "méchant",
    "venère": "énervé",
    "cainri": "ricain",
    "bédav": "dav",
    "feuj": "juif",
    "renoi": "noir",
    "reblan": "blanc",
    "cefran": "francais",
    "céfran": "francais",
    "keum": "mec",
    "ièpe": "pied",
    "iepe": "pied",
    "tièpe": "pitié",
    "tiépe": "pitié",
    "zebi": "bite",
    "zeb": "bite",
    "zen": "nez",
    "zetla": "allez",
    "zeter": "tirer",
    "zomblou": "blouzé",
    "zonmai": "maison",
    "zicmu": "musique",

    # Double verlan
    "meufeu": "femme",
    "feumeu": "femme",
    "beubar": "barbe",

    # Argot / slang
    "thune": "argent",
    "oseille": "argent",
    "biff": "argent",
    "ble": "argent",
    "blé": "argent",
    "fric": "argent",
    "pognon": "argent",
    "moula": "argent",
    "moulaga": "argent",
    "liasse": "argent",
    "wari": "argent",
    "srab": "arabe",
    "gadji": "fille",
    "go": "fille",
    "gova": "fille",
    "binks": "mauvais",
    "chanclé": "chancelant",
    "daronne": "mere",
    "daron": "pere",
    "deter": "determiné",
    "gow": "fille",
    "gova": "fille",
    "hess": "misere",
    "lass": "fille",
    "narvalo": "fou",
    "paro": "fou",
    "pera": "pere",
    "rageux": "jaloux",
    "seum": "rage",
    "shlag": "dechet",
    "teh": "shit",
    "tieks": "quartier",
    "tise": "alcool",
    "wesh": "salut",
    "zbeul": "bordel",
    "zouz": "fille",

    # Rap specific
    "bendo": "quartier",
    "block": "quartier",
    "bail": "truc",
    "bails": "trucs",
    "bicrave": "vendre",
    "caillasse": "cailloux",
    "charger": "attaquer",
    "crari": "faire",
    "dalle": "rien",
    "dead": "mort",
    "dinguerie": "folie",
    "equipe": "groupe",
    "igo": "ami",
    "kiffer": "aimer",
    "lover": "draguer",
    "narvalo": "idiot",
    "peufra": "frapper",
    "pistave": "piste",
    "poucave": "balance",
    "ratpi": "parti",
    "sah": "frere",
    "sce-la": "place",
    "shifter": "fumer",
    "s'ter": "partir",
    "tarba": "tabasser",
    "tchip": "mepris",
    "ter-shi": "shit",
    "validé": "approuvé",
}

# Arabic/Maghrebi words common in French rap
ARABIC_SLANG = {
    "wallah": "je jure",
    "starfoullah": "pardon dieu",
    "hamdoulah": "grace a dieu",
    "inshallah": "si dieu veut",
    "mashallah": "grace a dieu",
    "haram": "interdit",
    "halal": "permis",
    "khouya": "frere",
    "khoya": "frere",
    "akhi": "frere",
    "sah": "frere",
    "sahbi": "ami",
    "wesh": "salut",
    "chouf": "regarde",
    "hchouma": "honte",
    "la": "non",
    "ouais": "oui",
    "miskine": "pauvre",
    "meskin": "pauvre",
    "kiffer": "aimer",
    "kif": "plaisir",
    "bled": "pays",
    "bleda": "village",
    "bezef": "beaucoup",
    "zhar": "chance",
    "nif": "orgueil",
    "baraka": "benediction",
    "hess": "misere",
    "zerma": "genre",
}

# Combine all dictionaries
ALL_SLANG = {**VERLAN_DICT, **ARABIC_SLANG}


def normalize_slang(text: str, keep_original_for_rhymes: bool = False) -> str:
    """Normalize French rap slang to standard French.

    Args:
        text: Text containing slang to normalize.
        keep_original_for_rhymes: If True, append normalized form instead of replacing.

    Returns:
        Normalized text.
    """
    words = text.split()
    normalized = []

    for word in words:
        lower = word.lower().strip(",.!?;:'\"()[]")

        if lower in ALL_SLANG:
            if keep_original_for_rhymes:
                # Keep both for phonetic analysis
                normalized.append(word)
            else:
                # Replace with standard French
                # Preserve capitalization
                replacement = ALL_SLANG[lower]
                if word[0].isupper():
                    replacement = replacement.capitalize()
                normalized.append(replacement)
        else:
            normalized.append(word)

    return ' '.join(normalized)


def get_slang_words(text: str) -> list[str]:
    """Extract slang words from text.

    Args:
        text: Text to analyze.

    Returns:
        List of slang words found.
    """
    words = text.lower().split()
    return [w.strip(",.!?;:'\"()[]") for w in words
            if w.strip(",.!?;:'\"()[]") in ALL_SLANG]


def get_slang_density(text: str) -> float:
    """Calculate the density of slang in text.

    Args:
        text: Text to analyze.

    Returns:
        Ratio of slang words to total words (0-1).
    """
    words = text.lower().split()
    if not words:
        return 0.0

    slang_count = sum(1 for w in words
                      if w.strip(",.!?;:'\"()[]") in ALL_SLANG)
    return slang_count / len(words)


if __name__ == "__main__":
    # Test the normalizer
    test_text = "Wesh mon reuf, j'suis dans la tess avec les keufs"
    print(f"Original: {test_text}")
    print(f"Normalized: {normalize_slang(test_text)}")
    print(f"Slang words: {get_slang_words(test_text)}")
    print(f"Slang density: {get_slang_density(test_text):.2%}")
