/**
 * Scoring historique avec pondération par ère
 *
 * Gère l'inflation des streams et adapte le scoring selon l'époque :
 * - Ère physique (1990-2005): ventes physiques dominantes
 * - Ère transition (2006-2014): YouTube émerge
 * - Ère streaming début (2015-2017): streams très valorisés
 * - Ère streaming mature (2018-2021): début dévaluation
 * - Ère actuelle (2022-2025): streams très dévalués
 */

import type { YearlySnapshot, Era } from '../types/history';
import {
  getEra,
  getStreamInflationFactor,
  ERA_WEIGHTS,
  convertPhysicalToStreamEquivalent,
  ERAS
} from '../types/history';

// Benchmarks historiques par ère (pour normalisation)
const HISTORICAL_BENCHMARKS = {
  physical: {
    physicalSales: 1_500_000,  // IAM L'École = référence
    certifications: 10,
    chartsPosition: 1,
  },
  transition: {
    physicalSales: 500_000,
    youtubeViews: 100_000_000,
    certifications: 15,
    chartsPosition: 1,
  },
  streamingEarly: {
    monthlyListeners: 5_000_000,
    youtubeViews: 500_000_000,
    certifications: 20,
  },
  streamingMature: {
    monthlyListeners: 10_000_000,
    youtubeViews: 1_500_000_000,
    certifications: 50,
  },
  current: {
    monthlyListeners: 15_000_000,
    youtubeViews: 3_000_000_000,
    certifications: 100,
  },
};

/**
 * Normalise une valeur entre 0 et 100
 */
function normalize(value: number, max: number): number {
  return Math.min(100, (value / max) * 100);
}

/**
 * Calcule le score commercial ajusté pour l'ère
 */
export function calculateCommercialScoreForEra(
  snapshot: YearlySnapshot,
  era: Era
): number {
  const weights = ERA_WEIGHTS[era];
  const benchmarks = HISTORICAL_BENCHMARKS[era] as Record<string, number>;
  const metrics = snapshot.metrics;

  let score = 0;
  let totalWeight = 0;

  // Ventes physiques (surtout pour anciennes ères)
  if (metrics.physicalSales && weights.physicalSales > 0) {
    const physicalScore = normalize(
      metrics.physicalSales,
      benchmarks['physicalSales'] || 1_000_000
    );
    score += physicalScore * weights.physicalSales;
    totalWeight += weights.physicalSales;
  }

  // YouTube views
  if (metrics.youtubeViews && weights.youtubeViews > 0) {
    const ytScore = normalize(
      metrics.youtubeViews,
      benchmarks['youtubeViews'] || 500_000_000
    );
    score += ytScore * weights.youtubeViews;
    totalWeight += weights.youtubeViews;
  }

  // Streams (avec facteur d'inflation)
  if (metrics.monthlyListeners && weights.streams > 0) {
    const inflationFactor = getStreamInflationFactor(snapshot.year);
    const adjustedListeners = metrics.monthlyListeners * inflationFactor;
    const streamScore = normalize(
      adjustedListeners,
      (benchmarks['monthlyListeners'] || 10_000_000) * inflationFactor
    );
    score += streamScore * weights.streams;
    totalWeight += weights.streams;
  }

  // Certifications (stable à travers les ères)
  if (metrics.certifications && weights.certifications > 0) {
    const certScore = normalize(
      metrics.certifications,
      benchmarks.certifications || 50
    );
    score += certScore * weights.certifications;
    totalWeight += weights.certifications;
  }

  return totalWeight > 0 ? score / totalWeight : 0;
}

/**
 * Calcule le score d'influence ajusté pour l'ère
 */
export function calculateInfluenceScoreForEra(
  snapshot: YearlySnapshot,
  _era: Era
): number {
  const { influenceScore, innovationScore } = snapshot.metrics;

  // L'influence est plus valorisée pour les pionniers
  const influenceNorm = influenceScore ? normalize(influenceScore, 100) : 0;
  const innovationNorm = innovationScore ? normalize(innovationScore, 100) : 0;

  return influenceNorm * 0.6 + innovationNorm * 0.4;
}

/**
 * Calcule le score artistique (peak album, classiques)
 */
export function calculateArtisticScoreForEra(
  snapshot: YearlySnapshot,
  _era: Era
): number {
  const { peakAlbumScore, artisticIntegrity } = snapshot.metrics;

  const peakNorm = peakAlbumScore ? normalize(peakAlbumScore, 100) : 0;
  const integrityNorm = artisticIntegrity ? normalize(artisticIntegrity, 100) : 0;

  return peakNorm * 0.7 + integrityNorm * 0.3;
}

/**
 * Calcule le score total pour un snapshot avec pondération par ère
 */
export function calculateHistoricalScore(snapshot: YearlySnapshot): number {
  const era = getEra(snapshot.year);

  const commercialScore = calculateCommercialScoreForEra(snapshot, era);
  const influenceScore = calculateInfluenceScoreForEra(snapshot, era);
  const artisticScore = calculateArtisticScoreForEra(snapshot, era);

  // Pondération des piliers selon l'ère
  // Les anciennes ères valorisent plus l'influence et l'artistique
  let weights: { commercial: number; influence: number; artistic: number };

  switch (era) {
    case 'physical':
      weights = { commercial: 0.25, influence: 0.40, artistic: 0.35 };
      break;
    case 'transition':
      weights = { commercial: 0.30, influence: 0.35, artistic: 0.35 };
      break;
    case 'streamingEarly':
      weights = { commercial: 0.35, influence: 0.35, artistic: 0.30 };
      break;
    case 'streamingMature':
    case 'current':
    default:
      weights = { commercial: 0.40, influence: 0.30, artistic: 0.30 };
      break;
  }

  return (
    commercialScore * weights.commercial +
    influenceScore * weights.influence +
    artisticScore * weights.artistic
  );
}

/**
 * Compare deux snapshots de la même année
 */
export function compareSnapshotsForYear(
  snapshot1: YearlySnapshot,
  snapshot2: YearlySnapshot
): 1 | -1 | 0 {
  const score1 = calculateHistoricalScore(snapshot1);
  const score2 = calculateHistoricalScore(snapshot2);

  if (score1 > score2) return 1;
  if (score1 < score2) return -1;
  return 0;
}

/**
 * Convertit les métriques anciennes en équivalent moderne
 */
export function convertToModernEquivalent(
  snapshot: YearlySnapshot
): { streamEquivalent: number; description: string } {
  const era = getEra(snapshot.year);
  const metrics = snapshot.metrics;

  if (era === 'physical' || era === 'transition') {
    // Convertir ventes physiques en équivalent streams
    if (metrics.physicalSales) {
      const equivalent = convertPhysicalToStreamEquivalent(
        metrics.physicalSales,
        snapshot.year
      );
      return {
        streamEquivalent: equivalent,
        description: `${(metrics.physicalSales / 1000).toFixed(0)}k ventes = ${(equivalent / 1_000_000).toFixed(1)}M streams équiv.`,
      };
    }
  }

  // Ère streaming - ajuster pour inflation
  if (metrics.monthlyListeners) {
    const factor = getStreamInflationFactor(snapshot.year);
    const adjusted = Math.round(metrics.monthlyListeners / factor);
    return {
      streamEquivalent: adjusted,
      description: `${(metrics.monthlyListeners / 1_000_000).toFixed(1)}M → ${(adjusted / 1_000_000).toFixed(1)}M ajusté (×${(1 / factor).toFixed(2)})`,
    };
  }

  return { streamEquivalent: 0, description: 'Données non disponibles' };
}

/**
 * Obtient le contexte de l'ère pour affichage
 */
export function getEraContext(year: number): {
  era: Era;
  name: string;
  description: string;
  streamInflation: number;
} {
  const era = getEra(year);
  const eraDef = ERAS[era];
  const inflation = getStreamInflationFactor(year);

  return {
    era,
    name: eraDef.name,
    description: eraDef.description,
    streamInflation: inflation,
  };
}

/**
 * Génère le classement pour une année donnée
 */
export function rankArtistsForYear(
  snapshots: { artistId: string; artistName: string; snapshot: YearlySnapshot }[]
): { artistId: string; artistName: string; rank: number; score: number }[] {
  const scored = snapshots.map(({ artistId, artistName, snapshot }) => ({
    artistId,
    artistName,
    score: calculateHistoricalScore(snapshot),
    estimatedRank: snapshot.estimatedRank,
  }));

  // Trier par score décroissant
  scored.sort((a, b) => b.score - a.score);

  return scored.map((item, index) => ({
    artistId: item.artistId,
    artistName: item.artistName,
    rank: index + 1,
    score: Math.round(item.score * 10) / 10,
  }));
}
