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
// Optimisées pour contraste sur fond noir (90s aesthetic)
export const ARTIST_COLORS: Record<string, string> = {
  // Légendes
  booba: '#A78BFA',           // Violet clair (was #8B5CF6)
  iam: '#34D399',             // Vert clair (was #10B981)
  ntm: '#818CF8',             // Indigo clair (was #6366F1)
  'mc-solaar': '#2DD4BF',     // Teal clair (was #14B8A6)
  'oxmo-puccino': '#C084FC',  // Purple clair (was #A855F7)
  rohff: '#FB923C',           // Orange (was #F97316)

  // Nouvelle génération
  pnl: '#60A5FA',             // Bleu clair (was #3B82F6)
  nekfeu: '#F87171',          // Rouge clair (was #EF4444)
  jul: '#F472B6',             // Rose
  sch: '#22D3EE',             // Cyan clair (was #06B6D4)
  damso: '#A3E635',           // Lime clair (was #84CC16)
  ninho: '#67E8F9',           // Cyan très clair (was #22D3EE)
  'freeze-corleone': '#94A3B8', // Slate clair (was #1E293B - trop sombre!)

  // Trap/Street
  kaaris: '#FBBF24',          // Amber (was #F59E0B)
  lacrim: '#A8A29E',          // Stone clair (was #78716C)
  maes: '#38BDF8',            // Sky clair (was #0EA5E9)
  gazo: '#BEF264',            // Lime très clair (was #A3E635)
  'kalash-criminel': '#F87171', // Rouge clair (was #DC2626)
  'seth-gueko': '#F59E0B',    // Amber vif (was #92400E - trop sombre!)
  alkpote: '#A78BFA',         // Violet (was #7C3AED)

  // Classiques
  'la-fouine': '#FDE047',     // Jaune vif (was #FACC15)
  soprano: '#F9A8D4',         // Pink clair (was #F472B6)
  medine: '#34D399',          // Emerald clair (was #059669)
  'kery-james': '#60A5FA',    // Bleu clair (was #2563EB)
  'rim-k': '#FB7185',         // Rouge rosé (was #DC2626)
  lino: '#818CF8',            // Indigo clair (was #4F46E5)
  youssoupha: '#22D3EE',      // Cyan (was #0891B2)

  // Autres
  vald: '#FB7185',            // Rose vif
  sofiane: '#A3E635',         // Lime (was #65A30D)
  'djadja-dinaz': '#FDBA74',  // Orange clair (was #FB923C)
  dosseh: '#A5B4FC',          // Indigo très clair (was #818CF8)
  flenn: '#6EE7B7',           // Emerald clair (was #34D399)
  ziak: '#FCA5A5',            // Rouge très clair (was #F87171)
  'hayce-lemsi': '#93C5FD',   // Bleu très clair (was #60A5FA)
  sinik: '#D8B4FE',           // Purple très clair (was #C084FC)
  guizmo: '#86EFAC',          // Vert très clair (was #4ADE80)
  sadek: '#FCD34D',           // Amber clair (was #FBBF24)
  bouss: '#7DD3FC',           // Sky très clair (was #38BDF8)
};
