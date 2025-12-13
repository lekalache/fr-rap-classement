/**
 * Types pour les données historiques et temporelles
 * Permet de tracker l'évolution des artistes à travers les années
 */

// Ères du rap français avec leurs caractéristiques
export type Era = 'physical' | 'transition' | 'streamingEarly' | 'streamingMature' | 'current';

export interface EraDefinition {
  name: string;
  startYear: number;
  endYear: number;
  description: string;
}

export const ERAS: Record<Era, EraDefinition> = {
  physical: {
    name: 'Ère Physique',
    startYear: 1990,
    endYear: 2005,
    description: 'Ventes physiques dominantes, pas de streaming',
  },
  transition: {
    name: 'Ère Transition',
    startYear: 2006,
    endYear: 2014,
    description: 'YouTube émerge, téléchargement légal/illégal',
  },
  streamingEarly: {
    name: 'Streaming (Début)',
    startYear: 2015,
    endYear: 2017,
    description: 'Adoption streaming, streams très valorisés',
  },
  streamingMature: {
    name: 'Streaming (Mature)',
    startYear: 2018,
    endYear: 2021,
    description: 'Streaming dominant, début dévaluation',
  },
  current: {
    name: 'Ère Actuelle',
    startYear: 2022,
    endYear: 2025,
    description: 'Saturation marché, streams très dévalués',
  },
};

// Pondération des métriques selon l'ère
export interface EraWeights {
  physicalSales: number;
  certifications: number;
  chartsPosition: number;
  streams: number;
  youtubeViews: number;
}

export const ERA_WEIGHTS: Record<Era, EraWeights> = {
  physical: {
    physicalSales: 1.0,
    certifications: 1.0,
    chartsPosition: 1.0,
    streams: 0,
    youtubeViews: 0,
  },
  transition: {
    physicalSales: 0.6,
    certifications: 1.0,
    chartsPosition: 0.9,
    streams: 0,
    youtubeViews: 0.8,
  },
  streamingEarly: {
    physicalSales: 0.2,
    certifications: 1.0,
    chartsPosition: 0.8,
    streams: 1.0,
    youtubeViews: 0.6,
  },
  streamingMature: {
    physicalSales: 0.1,
    certifications: 0.9,
    chartsPosition: 0.7,
    streams: 0.5,
    youtubeViews: 0.4,
  },
  current: {
    physicalSales: 0.05,
    certifications: 0.8,
    chartsPosition: 0.6,
    streams: 0.25,
    youtubeViews: 0.3,
  },
};

// Snapshot annuel d'un artiste
export interface YearlySnapshot {
  year: number;
  event?: string;  // Album ou événement marquant
  metrics: {
    // Métriques commerciales (peuvent être null selon l'ère)
    monthlyListeners?: number | null;
    youtubeViews?: number | null;
    physicalSales?: number | null;
    certifications?: number;
    chartsPosition?: number;
    albumsCount?: number;

    // Métriques qualitatives (estimées pour anciennes ères)
    influenceScore?: number;
    peakAlbumScore?: number;
    innovationScore?: number;
    artisticIntegrity?: number;
  };
  estimatedRank: number;  // 1-25+
  notes?: string;
  source: 'computed' | 'estimated' | 'archived';
}

// Historique complet d'un artiste
export interface ArtistHistory {
  artistId: string;
  artistName: string;
  snapshots: YearlySnapshot[];
}

// Entrée d'album dans la timeline
export interface AlbumEntry {
  artistId: string;
  artistName: string;
  albumName: string;
  year: number;
  month?: number;  // 1-12
  impact: 'low' | 'medium' | 'high' | 'legendary';
  certifications: number;  // Nombre de certifications (or, platine, diamant)
  certificationLevel?: 'or' | 'platine' | 'double-platine' | 'triple-platine' | 'diamant';
  physicalSales?: number;
  classicTracks: string[];
  genre: string;
  peakChartPosition?: number;
  weeksInChart?: number;
}

// Données pour le graphique d'évolution
export interface EvolutionDataPoint {
  year: number;
  [artistId: string]: number | string;  // rank par artiste + year
}

// Props du composant EvolutionChart
export interface EvolutionChartProps {
  artistIds: string[];
  startYear?: number;
  endYear?: number;
  showAlbums?: boolean;
}

// Structure du fichier artists-history.json
export type ArtistsHistoryData = Record<string, ArtistHistory>;

// Structure du fichier albums-timeline.json
export type AlbumsTimelineData = AlbumEntry[];

// Utilitaire: obtenir l'ère d'une année
export function getEra(year: number): Era {
  if (year < 2006) return 'physical';
  if (year < 2015) return 'transition';
  if (year < 2018) return 'streamingEarly';
  if (year < 2022) return 'streamingMature';
  return 'current';
}

// Utilitaire: calculer le facteur d'inflation des streams
export function getStreamInflationFactor(year: number): number {
  const baselineYear = 2015;
  if (year <= baselineYear) return 1.0;

  // ~10% dévaluation par an après 2015
  const yearsAfter = year - baselineYear;
  return Math.pow(0.90, yearsAfter);
}

// Utilitaire: convertir ventes physiques en équivalent streams
export function convertPhysicalToStreamEquivalent(
  physicalSales: number,
  year: number
): number {
  const decade = Math.floor(year / 10) * 10;
  const conversionRates: Record<number, number> = {
    1990: 3000,  // 1 album = 3000 streams équiv.
    2000: 2000,  // Début téléchargement
    2010: 1500,  // Transition
  };

  const rate = conversionRates[decade] || 1500;
  return physicalSales * rate;
}

// Couleurs pour les artistes dans le graphique
export const ARTIST_COLORS: Record<string, string> = {
  // Légendes
  booba: '#8B5CF6',           // Violet
  iam: '#10B981',             // Vert
  ntm: '#6366F1',             // Indigo
  'mc-solaar': '#14B8A6',     // Teal
  'oxmo-puccino': '#A855F7',  // Purple
  rohff: '#F97316',           // Orange foncé

  // Nouvelle génération
  pnl: '#3B82F6',             // Bleu
  nekfeu: '#EF4444',          // Rouge
  jul: '#EC4899',             // Rose
  sch: '#06B6D4',             // Cyan
  damso: '#84CC16',           // Lime
  ninho: '#22D3EE',           // Cyan clair
  'freeze-corleone': '#1E293B', // Slate foncé

  // Trap/Street
  kaaris: '#F59E0B',          // Orange
  lacrim: '#78716C',          // Stone
  maes: '#0EA5E9',            // Sky
  gazo: '#A3E635',            // Lime clair
  'kalash-criminel': '#DC2626', // Rouge foncé
  'seth-gueko': '#92400E',    // Amber foncé
  alkpote: '#7C3AED',         // Violet vif

  // Classiques
  'la-fouine': '#FACC15',     // Jaune
  soprano: '#F472B6',         // Pink
  medine: '#059669',          // Emerald
  'kery-james': '#2563EB',    // Bleu roi
  'rim-k': '#DC2626',         // Rouge
  lino: '#4F46E5',            // Indigo
  youssoupha: '#0891B2',      // Cyan foncé

  // Autres
  vald: '#F43F5E',            // Rose vif
  sofiane: '#65A30D',         // Lime foncé
  'djadja-dinaz': '#FB923C',  // Orange clair
  dosseh: '#818CF8',          // Indigo clair
  flenn: '#34D399',           // Emerald clair
  ziak: '#F87171',            // Rouge clair
  'hayce-lemsi': '#60A5FA',   // Bleu clair
  sinik: '#C084FC',           // Purple clair
  guizmo: '#4ADE80',          // Vert clair
  sadek: '#FBBF24',           // Amber
  bouss: '#38BDF8',           // Sky clair
};
