import artistsData from '../src/data/artists.json';

const CURRENT_YEAR = 2025;
const BENCHMARKS = { careerYears: 35 };

function normalize(value: number, max: number): number {
  return Math.min(100, (value / max) * 100);
}

// Old calculation (calendar decades)
function oldDecades(debutYear: number) {
  const startDecade = Math.floor(debutYear / 10);
  const currentDecade = Math.floor(CURRENT_YEAR / 10);
  return currentDecade - startDecade + 1;
}

// New calculation (actual decades of activity)
function newDecades(debutYear: number) {
  const careerYears = CURRENT_YEAR - debutYear;
  return Math.ceil(careerYears / 10);
}

function calculateScore(careerYears: number, decadesActive: number) {
  const yearsScore = normalize(careerYears, BENCHMARKS.careerYears);
  const decadeBonus = Math.min(100, decadesActive * 25);
  return Math.round(yearsScore * 0.6 + decadeBonus * 0.4);
}

console.log('Impact du changement de calcul des décennies:\n');
console.log('Artiste'.padEnd(20), 'Années'.padStart(6), 'Avant'.padStart(8), 'Après'.padStart(8), 'Diff'.padStart(6));
console.log('-'.repeat(50));

interface Impact {
  name: string;
  years: number;
  old: number;
  new: number;
  diff: number;
  oldDec: number;
  newDec: number;
}

const impacts: Impact[] = [];

for (const artist of artistsData as any[]) {
  const careerYears = CURRENT_YEAR - artist.debutYear;
  const oldDec = oldDecades(artist.debutYear);
  const newDec = newDecades(artist.debutYear);
  const oldScore = calculateScore(careerYears, oldDec);
  const newScore = calculateScore(careerYears, newDec);
  const diff = newScore - oldScore;

  impacts.push({ name: artist.name, years: careerYears, old: oldScore, new: newScore, diff, oldDec, newDec });
}

// Sort by impact (biggest negative first)
impacts.sort((a, b) => a.diff - b.diff);

for (const i of impacts) {
  const diffStr = i.diff === 0 ? '=' : (i.diff > 0 ? '+' + i.diff : String(i.diff));
  console.log(
    i.name.padEnd(20),
    String(i.years).padStart(6),
    String(i.old).padStart(8),
    String(i.new).padStart(8),
    diffStr.padStart(6)
  );
}

console.log('\n--- Résumé ---');
const affected = impacts.filter(i => i.diff !== 0);
console.log('Artistes affectés: ' + affected.length + '/' + impacts.length);

const maxNegative = Math.min(...impacts.map(i => i.diff));
console.log('Pire impact pilier Longévité: ' + maxNegative + ' points');
console.log('Impact sur score total (poids 8%): ' + (maxNegative * 0.08).toFixed(2) + ' points');
