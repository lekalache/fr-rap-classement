/**
 * Script pour fusionner les données calculées (artists.json)
 * avec les snapshots historiques (artists-history.json)
 *
 * Usage: npx ts-node scripts/merge-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../src/data');

interface ArtistMetrics {
  monthlyListeners: number;
  youtubeViews: number;
  certifications: number;
  albumsCount: number;
  uniqueWords: number;
  flowScore: number;
  punchlineScore: number;
  hookScore: number;
  influenceScore: number;
  wikipediaMentions: number;
  awardsCount: number;
  chartsLongevity: number;
  thematicCoherence: number;
  artisticIntegrity: number;
  peakAlbumScore: number;
  classicTracksCount: number;
  innovationScore: number;
}

interface Artist {
  id: string;
  name: string;
  debutYear: number;
  metrics: ArtistMetrics;
}

interface YearlySnapshot {
  year: number;
  event?: string;
  metrics: Partial<{
    monthlyListeners: number | null;
    youtubeViews: number | null;
    physicalSales: number | null;
    certifications: number;
    albumsCount: number;
    influenceScore: number;
    peakAlbumScore: number;
    innovationScore: number;
    artisticIntegrity: number;
    uniqueWords: number;
    flowScore: number;
    punchlineScore: number;
    hookScore: number;
  }>;
  estimatedRank: number;
  notes?: string;
  source: 'computed' | 'estimated' | 'archived';
}

interface ArtistHistory {
  artistId: string;
  artistName: string;
  snapshots: YearlySnapshot[];
}

// Charger les données
const artistsPath = path.join(DATA_DIR, 'artists.json');
const historyPath = path.join(DATA_DIR, 'artists-history.json');

const artists: Artist[] = JSON.parse(fs.readFileSync(artistsPath, 'utf-8'));
const history: Record<string, ArtistHistory> = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));

console.log('=== Fusion des données ===\n');
console.log(`Artistes dans artists.json: ${artists.length}`);
console.log(`Artistes dans artists-history.json: ${Object.keys(history).length}\n`);

// Pour chaque artiste dans artists.json
let updated = 0;
let added = 0;

for (const artist of artists) {
  const artistHistory = history[artist.id];

  if (!artistHistory) {
    // Créer une nouvelle entrée historique
    console.log(`[NOUVEAU] ${artist.name} - Création de l'historique`);

    history[artist.id] = {
      artistId: artist.id,
      artistName: artist.name,
      snapshots: [
        {
          year: 2024,
          metrics: {
            monthlyListeners: artist.metrics.monthlyListeners,
            youtubeViews: artist.metrics.youtubeViews,
            certifications: artist.metrics.certifications,
            albumsCount: artist.metrics.albumsCount,
            influenceScore: artist.metrics.influenceScore,
            peakAlbumScore: artist.metrics.peakAlbumScore,
            innovationScore: artist.metrics.innovationScore,
            artisticIntegrity: artist.metrics.artisticIntegrity,
            uniqueWords: artist.metrics.uniqueWords,
            flowScore: artist.metrics.flowScore,
            punchlineScore: artist.metrics.punchlineScore,
            hookScore: artist.metrics.hookScore,
          },
          estimatedRank: 0, // À calculer
          notes: 'Données calculées via Genius API + métriques actuelles',
          source: 'computed',
        },
      ],
    };
    added++;
  } else {
    // Mettre à jour le snapshot 2024
    const snapshot2024 = artistHistory.snapshots.find(s => s.year === 2024);

    if (snapshot2024) {
      // Mettre à jour avec les données calculées
      console.log(`[MAJ] ${artist.name} - Mise à jour snapshot 2024`);

      snapshot2024.metrics = {
        ...snapshot2024.metrics,
        monthlyListeners: artist.metrics.monthlyListeners,
        youtubeViews: artist.metrics.youtubeViews,
        certifications: artist.metrics.certifications,
        albumsCount: artist.metrics.albumsCount,
        influenceScore: artist.metrics.influenceScore,
        peakAlbumScore: artist.metrics.peakAlbumScore,
        innovationScore: artist.metrics.innovationScore,
        artisticIntegrity: artist.metrics.artisticIntegrity,
        uniqueWords: artist.metrics.uniqueWords,
        flowScore: artist.metrics.flowScore,
        punchlineScore: artist.metrics.punchlineScore,
        hookScore: artist.metrics.hookScore,
      };
      snapshot2024.source = 'computed';
      snapshot2024.notes = (snapshot2024.notes || '') + ' [Métriques Genius intégrées]';
      updated++;
    } else {
      // Ajouter un nouveau snapshot 2024
      console.log(`[AJOUT] ${artist.name} - Ajout snapshot 2024`);

      artistHistory.snapshots.push({
        year: 2024,
        metrics: {
          monthlyListeners: artist.metrics.monthlyListeners,
          youtubeViews: artist.metrics.youtubeViews,
          certifications: artist.metrics.certifications,
          albumsCount: artist.metrics.albumsCount,
          influenceScore: artist.metrics.influenceScore,
          peakAlbumScore: artist.metrics.peakAlbumScore,
          innovationScore: artist.metrics.innovationScore,
          artisticIntegrity: artist.metrics.artisticIntegrity,
          uniqueWords: artist.metrics.uniqueWords,
          flowScore: artist.metrics.flowScore,
          punchlineScore: artist.metrics.punchlineScore,
          hookScore: artist.metrics.hookScore,
        },
        estimatedRank: 0,
        notes: 'Données calculées via Genius API + métriques actuelles',
        source: 'computed',
      });

      // Trier par année
      artistHistory.snapshots.sort((a, b) => a.year - b.year);
      updated++;
    }
  }
}

// Sauvegarder
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

console.log('\n=== Résumé ===');
console.log(`Artistes mis à jour: ${updated}`);
console.log(`Nouveaux artistes ajoutés: ${added}`);
console.log(`\nFichier sauvegardé: ${historyPath}`);

// Afficher les artistes manquants dans l'historique
const historyIds = new Set(Object.keys(history));
const artistIds = new Set(artists.map(a => a.id));

const missingInHistory = artists.filter(a => !historyIds.has(a.id));
const missingInArtists = Object.keys(history).filter(id => !artistIds.has(id));

if (missingInHistory.length > 0) {
  console.log('\nArtistes sans historique détaillé (snapshots vides):');
  missingInHistory.forEach(a => console.log(`  - ${a.name}`));
}

if (missingInArtists.length > 0) {
  console.log('\nArtistes dans historique mais pas dans artists.json:');
  missingInArtists.forEach(id => console.log(`  - ${id}`));
}
