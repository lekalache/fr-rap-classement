export interface Artist {
  id: string;
  name: string;
  image: string;
  debutYear: number;

  metrics: {
    // Commercial
    monthlyListeners: number;
    youtubeViews: number;
    certifications: number;
    albumsCount: number;

    // Legacy (gardé pour référence, non utilisé dans score V2)
    topChartsAppearances: number;
    featuresCount: number;

    // Lyrical
    uniqueWords: number;
    flowScore: number;              // 0-100 : variété et maîtrise du flow

    // Quotability
    punchlineScore: number;
    hookScore: number;              // 0-100 : qualité des refrains

    // Cultural Influence
    influenceScore: number;         // 0-100 : combien d'artistes influencés
    wikipediaMentions: number;
    awardsCount: number;
    chartsLongevity: number;        // Semaines cumulées dans les charts

    // Artistic Vision
    thematicCoherence: number;      // 0-100 : univers artistique cohérent
    artisticIntegrity: number;      // 0-100 : refus de compromis

    // Peak Excellence
    peakAlbumScore: number;         // 0-100 : qualité du meilleur album
    classicTracksCount: number;     // Nombre de titres considérés classiques

    // Innovation
    innovationScore: number;        // 0-100 : création de nouveau son/genre
  };
}

export interface PillarScore {
  name: string;
  score: number;
  weight: number;
  details: string;
}

export interface ArtistScore {
  artist: Artist;
  totalScore: number;
  pillars: {
    commercialPower: PillarScore;
    careerLongevity: PillarScore;
    lyricalCraft: PillarScore;
    quotability: PillarScore;
    culturalInfluence: PillarScore;
    artisticVision: PillarScore;
    peakExcellence: PillarScore;
    innovationScore: PillarScore;
  };
  rank: number;
}

export interface Comparison {
  artist1: ArtistScore;
  artist2: ArtistScore;
  winner: Artist;
  margin: number;
  breakdown: {
    pillar: string;
    artist1Score: number;
    artist2Score: number;
    winner: 'artist1' | 'artist2' | 'tie';
  }[];
}

export type PillarName =
  | 'commercialPower'
  | 'careerLongevity'
  | 'lyricalCraft'
  | 'quotability'
  | 'culturalInfluence'
  | 'artisticVision'
  | 'peakExcellence'
  | 'innovationScore';

export const PILLAR_WEIGHTS: Record<PillarName, number> = {
  commercialPower: 0.20,
  careerLongevity: 0.08,
  lyricalCraft: 0.12,
  quotability: 0.08,
  culturalInfluence: 0.20,
  artisticVision: 0.12,
  peakExcellence: 0.12,
  innovationScore: 0.08,
};

export const PILLAR_LABELS: Record<PillarName, string> = {
  commercialPower: 'Commercial',
  careerLongevity: 'Longévité',
  lyricalCraft: 'Technique',
  quotability: 'Mémorabilité',
  culturalInfluence: 'Influence',
  artisticVision: 'Vision',
  peakExcellence: 'Excellence',
  innovationScore: 'Innovation',
};
