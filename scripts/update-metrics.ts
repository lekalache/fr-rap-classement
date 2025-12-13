/**
 * Update artists.json with collected Genius metrics
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const artistsPath = path.join(__dirname, '../src/data/artists.json');
const artists = JSON.parse(fs.readFileSync(artistsPath, 'utf-8'));

// Collected metrics from Genius analysis
const metricsUpdate: Record<string, { uniqueWords: number; flowScore: number; punchlineScore: number; hookScore: number }> = {
  'oxmo-puccino': { uniqueWords: 2567, flowScore: 53, punchlineScore: 30, hookScore: 66 },
  'mc-solaar': { uniqueWords: 3272, flowScore: 48, punchlineScore: 36, hookScore: 61 },
  'la-fouine': { uniqueWords: 2200, flowScore: 58, punchlineScore: 38, hookScore: 63 },
  'lacrim': { uniqueWords: 2409, flowScore: 45, punchlineScore: 35, hookScore: 64 },
  'maes': { uniqueWords: 1290, flowScore: 56, punchlineScore: 38, hookScore: 58 },
  'gazo': { uniqueWords: 1478, flowScore: 39, punchlineScore: 45, hookScore: 60 },
  'soprano': { uniqueWords: 1479, flowScore: 71, punchlineScore: 37, hookScore: 69 },
  'medine': { uniqueWords: 4856, flowScore: 43, punchlineScore: 38, hookScore: 61 },
  'kalash-criminel': { uniqueWords: 1587, flowScore: 50, punchlineScore: 38, hookScore: 60 },
  'seth-gueko': { uniqueWords: 701, flowScore: 54, punchlineScore: 31, hookScore: 67 },
  'alkpote': { uniqueWords: 3411, flowScore: 42, punchlineScore: 36, hookScore: 61 },
};

let updated = 0;
for (const artist of artists) {
  const metrics = metricsUpdate[artist.id];
  if (metrics) {
    artist.metrics.uniqueWords = metrics.uniqueWords;
    artist.metrics.flowScore = metrics.flowScore;
    artist.metrics.punchlineScore = metrics.punchlineScore;
    artist.metrics.hookScore = metrics.hookScore;
    console.log(`[MAJ] ${artist.name}: uniqueWords=${metrics.uniqueWords}, flow=${metrics.flowScore}`);
    updated++;
  }
}

fs.writeFileSync(artistsPath, JSON.stringify(artists, null, 2));
console.log(`\n${updated} artistes mis à jour`);
