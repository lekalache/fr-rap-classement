import type { Artist, ArtistScore, PillarScore, Comparison } from '../types';

const CURRENT_YEAR = new Date().getFullYear();

// ═══════════════════════════════════════════════════════════════
// SCORING SYSTEM V4 - FULLY OBJECTIVE
// ═══════════════════════════════════════════════════════════════
// All metrics are now computed by the Python pipeline:
// - innovationScore: TF-IDF style fingerprinting + first-mover analysis
// - artisticIntegrity: Consistency + independence + trend resistance
// - influenceScore: Wikipedia + awards + citation network
// - thematicCoherence: Topic modeling coherence
// - peakAlbumScore: Best album certification efficiency
//
// Run `python scripts/migrate_to_objective.py` to update artists.json
// ═══════════════════════════════════════════════════════════════

// Benchmarks V4 - all metrics now computed objectively
const BENCHMARKS = {
  // Commercial (basé sur Jul = référence max)
  monthlyListeners: 15_000_000,
  youtubeViews: 5_000_000_000,
  certifications: 150,
  albumsCount: 18,
  certificationEfficiency: 25,  // PNL a 23.8, on met 25 pour laisser de la marge

  // Longévité
  careerYears: 35,

  // Lyrical (recalibré sur données Genius réelles)
  uniqueWords: 5000,    // Médine a 4856, IAM 7125 (à vérifier)
  flowScore: 80,        // Max réel = 71 (Soprano)
  punchlineScore: 50,   // Max réel = 45 (Gazo)
  hookScore: 75,        // Max réel = 69 (Soprano)

  // Influence (chartsLongevity retiré - corrélation 0.94 avec certifications)
  influenceScore: 100,
  wikipediaMentions: 650,  // MC Solaar a 620
  awardsCount: 20,

  // Artistique (déjà 0-100, passthrough)
  thematicCoherence: 100,
  artisticIntegrity: 100,
  peakAlbumScore: 100,
  classicTracksCount: 30,
  innovationScore: 100,
};

function normalize(value: number, max: number): number {
  return Math.min(100, (value / max) * 100);
}

// ═══════════════════════════════════════════════════════════════
// PILIER 1: COMMERCIAL POWER (20%)
// Popularité actuelle + certifications + efficacité
// CORRIGÉ: Fusion listeners+youtube pour éviter double comptage
// ═══════════════════════════════════════════════════════════════
function calculateCommercialPower(artist: Artist): PillarScore {
  const { monthlyListeners, youtubeViews, certifications, albumsCount } = artist.metrics;

  // FUSION: Popularité actuelle = moyenne pondérée listeners + youtube
  // (évite le double comptage de la popularité)
  const listenersScore = normalize(monthlyListeners, BENCHMARKS.monthlyListeners);
  const viewsScore = normalize(youtubeViews, BENCHMARKS.youtubeViews);
  const popularityScore = listenersScore * 0.6 + viewsScore * 0.4;  // Spotify pèse plus

  const certsScore = normalize(certifications, BENCHMARKS.certifications);

  // Efficacité = certifications par album (récompense qualité > quantité)
  const efficiency = albumsCount > 0 ? certifications / albumsCount : 0;
  const efficiencyScore = normalize(efficiency, BENCHMARKS.certificationEfficiency);

  // Nouveaux poids: 50% popularité fusionnée, 30% certifs, 20% efficacité
  const score = popularityScore * 0.50 + certsScore * 0.30 + efficiencyScore * 0.20;

  return {
    name: 'Commercial',
    score: Math.round(score),
    weight: 0.20,
    details: `${(monthlyListeners / 1_000_000).toFixed(1)}M listeners, ${certifications} certifs`,
  };
}

// ═══════════════════════════════════════════════════════════════
// PILIER 2: CAREER LONGEVITY (8%)
// Durée de carrière pure, sans pénaliser les sélectifs
// ═══════════════════════════════════════════════════════════════
function calculateCareerLongevity(artist: Artist): PillarScore {
  const careerYears = CURRENT_YEAR - artist.debutYear;

  // Décennies d'activité réelles (1-10 ans = 1, 11-20 ans = 2, etc.)
  const decadesActive = Math.ceil(careerYears / 10);
  const decadeBonus = Math.min(100, decadesActive * 25);

  const yearsScore = normalize(careerYears, BENCHMARKS.careerYears);
  const score = yearsScore * 0.6 + decadeBonus * 0.4;

  return {
    name: 'Longévité',
    score: Math.round(score),
    weight: 0.08,
    details: `${careerYears} ans, ${decadesActive} décennie${decadesActive > 1 ? 's' : ''}`,
  };
}

// ═══════════════════════════════════════════════════════════════
// PILIER 3: LYRICAL CRAFT (12%)
// Vocabulaire + flow + structure
// ═══════════════════════════════════════════════════════════════
function calculateLyricalCraft(artist: Artist): PillarScore {
  const { uniqueWords, flowScore } = artist.metrics;

  const vocabScore = normalize(uniqueWords, BENCHMARKS.uniqueWords);
  const flowNorm = normalize(flowScore, BENCHMARKS.flowScore);

  // 40% vocab, 60% flow (le flow compte plus que le vocabulaire)
  const score = vocabScore * 0.40 + flowNorm * 0.60;

  return {
    name: 'Technique',
    score: Math.round(score),
    weight: 0.12,
    details: `${uniqueWords.toLocaleString()} mots, flow ${flowScore}/100`,
  };
}

// ═══════════════════════════════════════════════════════════════
// PILIER 4: QUOTABILITY (8%)
// Punchlines + hooks mémorables
// ═══════════════════════════════════════════════════════════════
function calculateQuotability(artist: Artist): PillarScore {
  const { punchlineScore, hookScore } = artist.metrics;

  const punchNorm = normalize(punchlineScore, BENCHMARKS.punchlineScore);
  const hookNorm = normalize(hookScore, BENCHMARKS.hookScore);

  // 60% punchlines, 40% hooks
  const score = punchNorm * 0.60 + hookNorm * 0.40;

  return {
    name: 'Mémorabilité',
    score: Math.round(score),
    weight: 0.08,
    details: `Punchlines ${punchlineScore}, Refrains ${hookScore}`,
  };
}

// ═══════════════════════════════════════════════════════════════
// PILIER 5: CULTURAL INFLUENCE (20%)
// Impact réel - SANS features (choix artistique)
// CORRIGÉ: Retiré chartsLongevity (corrélation 0.94 avec certifications)
// ═══════════════════════════════════════════════════════════════
function calculateCulturalInfluence(artist: Artist): PillarScore {
  const { influenceScore, wikipediaMentions, awardsCount } = artist.metrics;

  const influenceNorm = normalize(influenceScore, BENCHMARKS.influenceScore);
  const wikiNorm = normalize(wikipediaMentions, BENCHMARKS.wikipediaMentions);
  const awardsNorm = normalize(awardsCount, BENCHMARKS.awardsCount);

  // Nouveaux poids sans chartsLongevity: 45% influence, 30% wiki, 25% awards
  const score = influenceNorm * 0.45 + wikiNorm * 0.30 + awardsNorm * 0.25;

  return {
    name: 'Influence',
    score: Math.round(score),
    weight: 0.20,
    details: `Influence ${influenceScore}/100, ${awardsCount} awards`,
  };
}

// ═══════════════════════════════════════════════════════════════
// PILIER 6: ARTISTIC VISION (12%)
// Cohérence thématique + intégrité artistique
// ═══════════════════════════════════════════════════════════════
function calculateArtisticVision(artist: Artist): PillarScore {
  const { thematicCoherence, artisticIntegrity } = artist.metrics;

  const coherenceNorm = normalize(thematicCoherence, BENCHMARKS.thematicCoherence);
  const integrityNorm = normalize(artisticIntegrity, BENCHMARKS.artisticIntegrity);

  // Intégrité compte légèrement plus (récompense ceux qui ne font pas de compromis)
  const score = coherenceNorm * 0.45 + integrityNorm * 0.55;

  return {
    name: 'Vision',
    score: Math.round(score),
    weight: 0.12,
    details: `Cohérence ${thematicCoherence}, Intégrité ${artisticIntegrity}`,
  };
}

// ═══════════════════════════════════════════════════════════════
// PILIER 7: PEAK EXCELLENCE (12%)
// Le meilleur travail, pas la moyenne
// ═══════════════════════════════════════════════════════════════
function calculatePeakExcellence(artist: Artist): PillarScore {
  const { peakAlbumScore, classicTracksCount } = artist.metrics;

  const peakNorm = normalize(peakAlbumScore, BENCHMARKS.peakAlbumScore);
  const classicsNorm = normalize(classicTracksCount, BENCHMARKS.classicTracksCount);

  // 60% meilleur album, 40% nombre de classiques
  const score = peakNorm * 0.60 + classicsNorm * 0.40;

  return {
    name: 'Excellence',
    score: Math.round(score),
    weight: 0.12,
    details: `Meilleur album ${peakAlbumScore}/100, ${classicTracksCount} classiques`,
  };
}

// ═══════════════════════════════════════════════════════════════
// PILIER 8: INNOVATION SCORE (8%)
// Création de nouveau son/genre
// ═══════════════════════════════════════════════════════════════
function calculateInnovationScore(artist: Artist): PillarScore {
  const { innovationScore } = artist.metrics;

  const score = normalize(innovationScore, BENCHMARKS.innovationScore);

  return {
    name: 'Innovation',
    score: Math.round(score),
    weight: 0.08,
    details: `Innovation ${innovationScore}/100`,
  };
}

// ═══════════════════════════════════════════════════════════════
// CALCUL DU SCORE TOTAL
// ═══════════════════════════════════════════════════════════════
export function calculateArtistScore(artist: Artist): ArtistScore {
  const pillars = {
    commercialPower: calculateCommercialPower(artist),
    careerLongevity: calculateCareerLongevity(artist),
    lyricalCraft: calculateLyricalCraft(artist),
    quotability: calculateQuotability(artist),
    culturalInfluence: calculateCulturalInfluence(artist),
    artisticVision: calculateArtisticVision(artist),
    peakExcellence: calculatePeakExcellence(artist),
    innovationScore: calculateInnovationScore(artist),
  };

  const totalScore = Object.values(pillars).reduce(
    (sum, pillar) => sum + pillar.score * pillar.weight,
    0
  );

  return {
    artist,
    totalScore: Math.round(totalScore * 10) / 10,
    pillars,
    rank: 0,
  };
}

export function compareArtists(artist1: Artist, artist2: Artist): Comparison {
  const score1 = calculateArtistScore(artist1);
  const score2 = calculateArtistScore(artist2);

  const pillarNames = Object.keys(score1.pillars) as (keyof typeof score1.pillars)[];

  const breakdown = pillarNames.map((pillar) => {
    const s1 = score1.pillars[pillar].score;
    const s2 = score2.pillars[pillar].score;

    return {
      pillar: score1.pillars[pillar].name,
      artist1Score: s1,
      artist2Score: s2,
      winner: s1 > s2 ? 'artist1' as const : s1 < s2 ? 'artist2' as const : 'tie' as const,
    };
  });

  const winner = score1.totalScore >= score2.totalScore ? artist1 : artist2;
  const margin = Math.abs(score1.totalScore - score2.totalScore);

  return {
    artist1: score1,
    artist2: score2,
    winner,
    margin: Math.round(margin * 10) / 10,
    breakdown,
  };
}

export function rankArtists(artists: Artist[]): ArtistScore[] {
  const scores = artists.map(calculateArtistScore);
  scores.sort((a, b) => b.totalScore - a.totalScore);

  return scores.map((score, index) => ({
    ...score,
    rank: index + 1,
  }));
}
