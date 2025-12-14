import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Punchline Detector - Analyze if a text is a punchline
 *
 * Based on 10 French rap punchline patterns:
 * 1. Comparative Structure ("comme")
 * 2. Paradox/Oxymoron
 * 3. Wordplay/Calembours
 * 4. Conditional Threat ("Si... alors...")
 * 5. Aphoristic Statements
 * 6. Self-Deprecating Boast
 * 7. Cultural Reference Hijacking
 * 8. Chiasm/Reversal
 * 9. Quantification
 * 10. Interrogative Challenge
 */

interface PatternMatch {
  name: string;
  description: string;
  matches: string[];
  score: number;
  weight: number;
  examples: string[];
}

interface AnalysisResult {
  isPunchline: boolean;
  totalScore: number;
  patterns: PatternMatch[];
  verdict: string;
}

// Pattern definitions - IMPROVED for better sensitivity
const PATTERNS: {
  name: string;
  description: string;
  regex: RegExp[];
  weight: number;
  examples: string[];
}[] = [
  {
    name: 'Comparaison',
    description: 'Métaphore ou simile ("comme", "tel", "pareil")',
    regex: [
      /\bcomme\s+\w+/gi,  // Any "comme X"
      /\bcomme\s+si\b/gi,
      /\btel(?:le)?s?\s+\w+/gi,
      /\bpareil\s+[àa]\b/gi,
      /\bà\s+l['']image\s+de\b/gi,
      /\bfaçon\s+\w+/gi,
      /\bstyle\s+\w+/gi,
      /\bgenre\s+\w+/gi,
    ],
    weight: 0.18,
    examples: ['Mon flow comme un ouragan', 'Tel un soldat']
  },
  {
    name: 'Menace / Condition',
    description: 'Structure "Si..." ou menace implicite',
    regex: [
      /\bsi\s+\w+/gi,  // Any "si X"
      /\bquand\s+(?:tu|je|on|il)\s+\w+/gi,
      /\bfaut\s+(?:pas\s+)?que\b/gi,
      /\b(?:sinon|autrement|ou\s+bien)\b/gi,
      /\bgare\s+[àa]\b/gi,
      /\bt[''](?:as|auras|aurais)\s+\w+/gi,
    ],
    weight: 0.15,
    examples: ['Si tu parles trop...', 'Quand je rappe...']
  },
  {
    name: 'Question rhétorique',
    description: 'Question qui affirme plus qu\'elle interroge',
    regex: [
      /\?/g,  // Any question mark
      /\b(?:qui|quoi|comment|pourquoi|où)\b/gi,
      /\bc['']est\s+quoi\b/gi,
      /\btu\s+(?:crois|penses|veux)\b/gi,
      /\bqu['']est-ce\s+que\b/gi,
    ],
    weight: 0.12,
    examples: ['Qui peut me juger ?', 'C\'est quoi le succès ?']
  },
  {
    name: 'Paradoxe / Contraste',
    description: 'Opposition, contradiction, antithèse',
    regex: [
      /\bmais\b/gi,  // Any "mais"
      /\bpourtant\b/gi,
      /\bmême\s+si\b/gi,
      /\bsans\b.*\bavec\b|\bavec\b.*\bsans\b/gi,
      /\b(?:mort|mourir|meurs|meurt)\b.*\b(?:vie|vivre|vis|vit)\b/gi,
      /\b(?:vie|vivre|vis|vit)\b.*\b(?:mort|mourir|meurs|meurt)\b/gi,
      /\b(?:jour|lumière)\b.*\b(?:nuit|ombre)\b/gi,
      /\b(?:nuit|ombre)\b.*\b(?:jour|lumière)\b/gi,
      /\b(?:haut|monter)\b.*\b(?:bas|tomber|chuter)\b/gi,
      /\b(?:riche)\b.*\b(?:pauvre)\b|\b(?:pauvre)\b.*\b(?:riche)\b/gi,
      /\b(?:fort)\b.*\b(?:faible)\b|\b(?:faible)\b.*\b(?:fort)\b/gi,
      /\b(?:ange)\b.*\b(?:démon|diable)\b|\b(?:démon|diable)\b.*\b(?:ange)\b/gi,
      /\b(?:enfer)\b.*\b(?:paradis)\b|\b(?:paradis)\b.*\b(?:enfer)\b/gi,
      /\b(?:début)\b.*\b(?:fin)\b|\b(?:fin)\b.*\b(?:début)\b/gi,
      /\b(?:rien)\b.*\b(?:tout)\b|\b(?:tout)\b.*\b(?:rien)\b/gi,
      /\b(?:jamais)\b.*\b(?:toujours)\b|\b(?:toujours)\b.*\b(?:jamais)\b/gi,
    ],
    weight: 0.18,
    examples: ['Je meurs mais je vis', 'Du rien au tout']
  },
  {
    name: 'Aphorisme / Vérité',
    description: 'Maxime, sentence, vérité générale',
    regex: [
      /\bla\s+vie\b/gi,  // "la vie"
      /\bl['']amour\b/gi,
      /\ble\s+(?:succès|bonheur|temps|monde|rap|game|street|argent|fric)\b/gi,
      /\bc['']est\s+(?:ça|comme\s+ça)\b/gi,
      /\bon\s+(?:dit|sait|voit)\b/gi,
      /\bla\s+(?:rue|street|cité|tess)\b/gi,
      /\bla\s+(?:vérité|réalité)\b/gi,
    ],
    weight: 0.12,
    examples: ['La vie c\'est...', 'L\'amour c\'est...']
  },
  {
    name: 'Quantification',
    description: 'Nombres et mesures pour l\'emphase',
    regex: [
      /\b\d+\b/g,  // Any number
      /\b(?:cent|mille|million|milliard|zéro)\b/gi,
      /\b(?:premier|deuxième|dernier|seul|unique)\b/gi,
      /\b(?:tous?|toutes?|chaque|aucun)\b/gi,
      /\b(?:trop|assez|jamais|toujours|encore)\b/gi,
    ],
    weight: 0.10,
    examples: ['100 fois', 'Mille vies', 'Toujours debout']
  },
  {
    name: 'Jeu de mots',
    description: 'Double sens, homophonie, répétition',
    regex: [
      /\b(\w{4,})\b.*\b\1\b/gi, // Word repetition (4+ chars)
      /\bmots?\b.*\bmaux?\b|\bmaux?\b.*\bmots?\b/gi,
      /\bmais\b.*\bmet\b|\bmet\b.*\bmais\b/gi,
      /\bverre\b.*\bvert\b|\bvert\b.*\bverre\b/gi,
      /\bsang\b.*\bsens?\b|\bsens?\b.*\bsang\b/gi,
      /\bmère?\b.*\bmer\b|\bmer\b.*\bmère?\b/gi,
      /\bpère\b.*\bperd\b|\bperd\b.*\bpère\b/gi,
      /\bcour\b.*\bcœur\b|\bcœur\b.*\bcour\b/gi,
      /\btemps\b.*\btant\b|\btant\b.*\btemps\b/gi,
      /\bfin\b.*\bfaim\b|\bfaim\b.*\bfin\b/gi,
      /\bvoix\b.*\bvoi[est]\b|\bvoi[est]\b.*\bvoix\b/gi,
      /\bpoids\b.*\bpoi[sx]\b/gi,
      /\blair\b.*\blire\b|\blire\b.*\blair\b/gi,
    ],
    weight: 0.12,
    examples: ['Les mots en maux', 'La mer de ma mère']
  },
  {
    name: 'Structure inversée',
    description: 'Chiasme, miroir, retournement',
    regex: [
      /\b(\w+)\s+pour\s+(\w+).*\2\s+pour\s+\1/gi,
      /\bplus\b.*\bmoins\b|\bmoins\b.*\bplus\b/gi,
      /\bavant\b.*\baprès\b|\baprès\b.*\bavant\b/gi,
      /\b(?:je|j')\b.*\b(?:me|moi)\b.*\b(?:je|j')\b/gi,
    ],
    weight: 0.08,
    examples: ['Je vis pour rapper, je rappe pour vivre']
  },
  {
    name: 'Référence culturelle',
    description: 'Allusion à une personnalité ou œuvre',
    regex: [
      /\b(?:Scarface|Pacino|Escobar|Montana|Corleone)\b/gi,
      /\b(?:Jordan|Zidane|Messi|Ronaldo|Maradona)\b/gi,
      /\b(?:Ali|Tyson|Mike)\b/gi,
      /\b(?:Napoleon|César|Napoléon|Cesar)\b/gi,
      /\b(?:Jésus|Jesus|Dieu|Satan|Lucifer)\b/gi,
      /\b(?:Soprano|Booba|Nekfeu|Freeze|IAM|NTM)\b/gi,
      /\b(?:Batman|Joker|Thanos|Avengers)\b/gi,
    ],
    weight: 0.08,
    examples: ['Comme Scarface', 'Tel Napoléon']
  },
  {
    name: 'Intensité / Impact',
    description: 'Mots forts, violence verbale, choc',
    regex: [
      /\b(?:mort|mourir|tuer|crever|saigner|sang)\b/gi,
      /\b(?:feu|flamme|brûle|cendre)\b/gi,
      /\b(?:guerre|combat|battle|fight)\b/gi,
      /\b(?:roi|king|boss|chef|maître)\b/gi,
      /\b(?:fuck|nique|baise|merde|putain)\b/gi,
      /\b(?:balle|gun|calibre|flingue)\b/gi,
      /\b(?:cœur|âme|esprit|mental)\b/gi,
    ],
    weight: 0.10,
    examples: ['Le feu dans l\'âme', 'Roi de mon game']
  },
];

// Brand names to penalize (lazy flex, not real punchlines)
const BRAND_PATTERNS = [
  /\b(?:gucci|prada|louis\s*vuitton|rolex|cartier|hermes|dior|chanel|balenciaga|versace|fendi|burberry|armani|bentley|ferrari|lamborghini|porsche|mercedes|amg|maybach)\b/gi,
];

function analyzePunchline(text: string): AnalysisResult {
  const patterns: PatternMatch[] = [];
  let totalScore = 0;
  let patternsDetected = 0;

  // Check each pattern
  for (const pattern of PATTERNS) {
    const matches: string[] = [];

    for (const regex of pattern.regex) {
      // Reset regex lastIndex for global patterns
      regex.lastIndex = 0;
      const found = text.match(regex);
      if (found) {
        matches.push(...found);
      }
    }

    const patternScore = matches.length > 0 ? pattern.weight * 100 : 0;
    if (matches.length > 0) patternsDetected++;
    totalScore += patternScore;

    patterns.push({
      name: pattern.name,
      description: pattern.description,
      matches: [...new Set(matches)], // Unique matches
      score: patternScore,
      weight: pattern.weight,
      examples: pattern.examples,
    });
  }

  // === BONUS: Brièveté (8-20 mots = optimal) ===
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  let brevityBonus = 0;
  if (wordCount >= 8 && wordCount <= 20) {
    brevityBonus = 15; // Optimal length bonus
  } else if (wordCount >= 5 && wordCount <= 25) {
    brevityBonus = 8; // Acceptable length
  } else if (wordCount > 30) {
    brevityBonus = -10; // Too long penalty
  }
  totalScore += brevityBonus;

  // === BONUS: Référence personnelle (47% des punchlines) ===
  const personalPatterns = /\b(?:j['']?(?:suis|ai|étais|avais|fais|veux|peux|dois|mets|vis|reste)|mon|ma|mes|moi)\b/gi;
  const personalMatches = text.match(personalPatterns);
  if (personalMatches && personalMatches.length > 0) {
    totalScore += 8; // Personal reference bonus
  }

  // === BONUS: Connecteurs de chute (66% des punchlines) ===
  const fallConnectors = /\b(?:mais|pourtant|même\s+si|alors\s+que|tandis\s+que|cependant|or|sauf\s+que)\b/gi;
  const connectorMatches = text.match(fallConnectors);
  if (connectorMatches && connectorMatches.length > 0) {
    totalScore += 12; // "Chute" connector bonus
  }

  // === BONUS: Multi-patterns (cumul = plus fort) ===
  if (patternsDetected >= 4) {
    totalScore += 15; // Strong combo
  } else if (patternsDetected >= 3) {
    totalScore += 10; // Good combo
  } else if (patternsDetected >= 2) {
    totalScore += 5; // Decent combo
  }

  // Brand penalty
  let brandPenalty = 0;
  for (const brandRegex of BRAND_PATTERNS) {
    brandRegex.lastIndex = 0;
    const brandMatches = text.match(brandRegex);
    if (brandMatches) {
      brandPenalty += brandMatches.length * 8; // -8 points per brand
    }
  }
  totalScore = Math.max(0, totalScore - brandPenalty);

  // Cap at 100
  totalScore = Math.min(100, totalScore);

  // Determine verdict
  let verdict: string;
  let isPunchline: boolean;

  if (totalScore >= 60) {
    verdict = 'PUNCHLINE LOURDE - Impact maximal';
    isPunchline = true;
  } else if (totalScore >= 40) {
    verdict = 'PUNCHLINE VALIDÉE - Fort potentiel';
    isPunchline = true;
  } else if (totalScore >= 25) {
    verdict = 'POTENTIEL - Structure intéressante';
    isPunchline = true;
  } else if (totalScore >= 15) {
    verdict = 'MOYEN - Quelques éléments présents';
    isPunchline = false;
  } else {
    verdict = 'PAS UNE PUNCHLINE - Trop faible';
    isPunchline = false;
  }

  // Add details
  if (brandPenalty > 0) {
    verdict += ` (-${brandPenalty} marques)`;
  }
  if (brevityBonus > 0) {
    verdict += ` (+${brevityBonus} brièveté)`;
  }

  return { isPunchline, totalScore, patterns, verdict };
}

export function PunchlineDetectorPage() {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      const analysis = analyzePunchline(text);
      setResult(analysis);
      setIsAnalyzing(false);
    }, 300); // Small delay for UX
  };

  const examplePunchlines = [
    { text: "J'ai une couronne sur la tête pourtant c'est le voisin qui a eu la fève", artist: "Booba" },
    { text: "J'suis pas riche mais je joue que les meilleurs films", artist: "Nekfeu" },
    { text: "La vie c'est pas du rap, dans la vraie vie les balles ne riment pas", artist: "Kery James" },
    { text: "J'suis parti de rien comme un orphelin dans un ascenseur", artist: "Booba" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-transparent bg-clip-text">
          {t('detector.title').toUpperCase()}
        </h1>
        <p className="text-gray-400">
          {t('detector.subtitle')}
        </p>
      </div>

      {/* Input area */}
      <div className="bg-white/5 rounded-xl p-6 mb-6">
        <label className="block text-sm font-semibold text-purple-400 mb-3">
          {t('detector.title').toUpperCase()}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('detector.placeholder')}
          className="w-full bg-black/30 rounded-lg p-4 text-white placeholder-gray-500 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
          rows={3}
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Exemples:</span>
          {examplePunchlines.map((ex, i) => (
            <button
              key={i}
              onClick={() => setText(ex.text)}
              className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              title={`${ex.artist}`}
            >
              {ex.text.slice(0, 40)}...
            </button>
          ))}
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!text.trim() || isAnalyzing}
          className={`
            mt-6 w-full py-4 rounded-xl font-bold text-lg transition-all
            ${text.trim() && !isAnalyzing
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isAnalyzing ? t('detector.analyzing') : t('detector.analyze').toUpperCase()}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Verdict */}
          <div className={`
            rounded-xl p-6 text-center
            ${result.isPunchline
              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30'
              : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30'}
          `}>
            <div className="text-6xl mb-4">
              {result.isPunchline ? '🔥' : '❌'}
            </div>
            <div className={`text-2xl font-bold ${result.isPunchline ? 'text-green-400' : 'text-red-400'}`}>
              {result.verdict}
            </div>
            <div className="text-4xl font-black mt-4">
              {t('detector.score')}: {result.totalScore.toFixed(0)}/100
            </div>
          </div>

          {/* Pattern breakdown */}
          <div className="bg-white/5 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-400 mb-4">
              {t('detector.breakdown').toUpperCase()}
            </h3>

            <div className="space-y-4">
              {result.patterns
                .filter(p => p.score > 0 || p.matches.length > 0)
                .sort((a, b) => b.score - a.score)
                .map((pattern, i) => (
                  <div key={i} className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-green-400 font-bold">{pattern.name}</span>
                        <span className="text-gray-500 text-sm ml-2">({pattern.description})</span>
                      </div>
                      <span className={`font-bold ${pattern.score > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                        +{pattern.score.toFixed(0)}
                      </span>
                    </div>

                    {pattern.matches.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-400">Détecté: </span>
                        <span className="text-yellow-400">
                          {pattern.matches.slice(0, 3).map((m, j) => (
                            <span key={j} className="bg-yellow-500/20 px-2 py-0.5 rounded mr-2">
                              "{m}"
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

              {/* Show patterns not detected */}
              <details className="mt-4">
                <summary className="text-gray-500 cursor-pointer hover:text-gray-400">
                  Patterns non détectés ({result.patterns.filter(p => p.matches.length === 0).length})
                </summary>
                <div className="mt-2 space-y-2">
                  {result.patterns
                    .filter(p => p.matches.length === 0)
                    .map((pattern, i) => (
                      <div key={i} className="text-sm text-gray-600 pl-4">
                        <span className="font-semibold">{pattern.name}</span>: {pattern.examples[0]}
                      </div>
                    ))}
                </div>
              </details>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-lg font-bold text-purple-400 mb-3">
              {t('detector.tips').toUpperCase()}
            </h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li>• Ajoute une <span className="text-yellow-400">comparaison inattendue</span> avec "comme"</li>
              <li>• Crée un <span className="text-yellow-400">paradoxe</span> ou une contradiction</li>
              <li>• Utilise un <span className="text-yellow-400">jeu de mots</span> (homophonie, double sens)</li>
              <li>• Formule une <span className="text-yellow-400">vérité universelle</span> ("La vie c'est...")</li>
              <li>• <span className="text-red-400">Évite</span> les noms de marques (Gucci, Rolex, etc.)</li>
            </ul>
          </div>
        </div>
      )}

      {/* Info section */}
      {!result && (
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold text-purple-400 mb-4">
            {t('detector.howItWorks').toUpperCase()}
          </h3>
          <p className="text-gray-400 mb-4">
            Une punchline compresse le maximum de <span className="text-purple-400">tension sémantique</span>
            dans un minimum de syllabes. Elle ne sonne pas juste bien - elle <span className="text-green-400">PROUVE</span> quelque chose.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[
              { name: 'Comparaison', example: '"comme un X" inattendu', weight: '15%' },
              { name: 'Paradoxe', example: 'contradiction interne', weight: '15%' },
              { name: 'Menace Si/Alors', example: 'cause-effet menaçant', weight: '15%' },
              { name: 'Jeu de mots', example: 'homophonie, polysémie', weight: '12%' },
              { name: 'Aphorisme', example: '"La vie c\'est..."', weight: '10%' },
              { name: 'Chiasme', example: 'A-B puis B-A', weight: '10%' },
              { name: 'Question rhét.', example: 'défi interrogatif', weight: '10%' },
              { name: 'Quantification', example: 'nombres emphatiques', weight: '8%' },
            ].map((item, i) => (
              <div key={i} className="bg-black/30 rounded-lg p-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-white">{item.name}</span>
                  <span className="text-purple-400 text-sm">{item.weight}</span>
                </div>
                <div className="text-gray-500 text-sm">{item.example}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
