/**
 * Display current top 15 ranking
 */

import artistsData from '../src/data/artists.json';
import { rankArtists } from '../src/services/scoring';
import type { Artist } from '../src/types';

const artists = artistsData as Artist[];
const ranked = rankArtists(artists);

console.log('═══════════════════════════════════════════════════════════════');
console.log('                 TOP 15 CLASSEMENT (V4 - sans double comptage) ');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('#   Artiste              Score   Commercial  Influence  Technique');
console.log('─'.repeat(70));

ranked.slice(0, 15).forEach((artist, i) => {
  const rank = (i + 1).toString().padStart(2);
  const name = artist.artist.name.padEnd(20);
  const score = artist.totalScore.toFixed(1).padStart(5);
  const commercial = artist.pillars.commercialPower.score.toString().padStart(6);
  const influence = artist.pillars.culturalInfluence.score.toString().padStart(6);
  const lyrical = artist.pillars.lyricalCraft.score.toString().padStart(6);

  console.log(`${rank}. ${name} ${score}   ${commercial}      ${influence}      ${lyrical}`);
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                     BOTTOM 5                                   ');
console.log('═══════════════════════════════════════════════════════════════\n');

ranked.slice(-5).forEach((artist, i) => {
  const rank = (ranked.length - 4 + i).toString().padStart(2);
  const name = artist.artist.name.padEnd(20);
  const score = artist.totalScore.toFixed(1).padStart(5);

  console.log(`${rank}. ${name} ${score}`);
});
