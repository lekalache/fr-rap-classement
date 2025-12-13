/**
 * Analyze correlation between metrics to detect double counting
 */

import artistsData from '../src/data/artists.json';

interface ArtistData {
  name: string;
  metrics: {
    monthlyListeners: number;
    youtubeViews: number;
    certifications: number;
    chartsLongevity: number;
    influenceScore: number;
    innovationScore: number;
  };
}

const artists = artistsData as ArtistData[];

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('           ANALYSE DE CORRÉLATION - DOUBLE COMPTAGE            ');
console.log('═══════════════════════════════════════════════════════════════\n');

// Extract metric arrays
const monthlyListeners = artists.map(a => a.metrics.monthlyListeners);
const youtubeViews = artists.map(a => a.metrics.youtubeViews);
const certifications = artists.map(a => a.metrics.certifications);
const chartsLongevity = artists.map(a => a.metrics.chartsLongevity);
const influenceScore = artists.map(a => a.metrics.influenceScore);
const innovationScore = artists.map(a => a.metrics.innovationScore);

console.log('Corrélations potentiellement problématiques:\n');

// 1. monthlyListeners vs youtubeViews
const corr1 = pearsonCorrelation(monthlyListeners, youtubeViews);
console.log(`1. monthlyListeners ↔ youtubeViews: ${corr1.toFixed(3)}`);
if (corr1 > 0.7) {
  console.log('   ⚠️  FORTE corrélation - Double comptage de la popularité actuelle');
} else if (corr1 > 0.5) {
  console.log('   ⚡ Corrélation modérée');
} else {
  console.log('   ✅ Corrélation faible - OK');
}

// 2. certifications vs chartsLongevity
const corr2 = pearsonCorrelation(certifications, chartsLongevity);
console.log(`\n2. certifications ↔ chartsLongevity: ${corr2.toFixed(3)}`);
if (corr2 > 0.7) {
  console.log('   ⚠️  FORTE corrélation - Double comptage du succès commercial');
} else if (corr2 > 0.5) {
  console.log('   ⚡ Corrélation modérée');
} else {
  console.log('   ✅ Corrélation faible - OK');
}

// 3. influenceScore vs innovationScore
const corr3 = pearsonCorrelation(influenceScore, innovationScore);
console.log(`\n3. influenceScore ↔ innovationScore: ${corr3.toFixed(3)}`);
if (corr3 > 0.7) {
  console.log('   ⚠️  FORTE corrélation - Double comptage de l\'impact culturel');
} else if (corr3 > 0.5) {
  console.log('   ⚡ Corrélation modérée');
} else {
  console.log('   ✅ Corrélation faible - OK');
}

// 4. certifications vs monthlyListeners
const corr4 = pearsonCorrelation(certifications, monthlyListeners);
console.log(`\n4. certifications ↔ monthlyListeners: ${corr4.toFixed(3)}`);
if (corr4 > 0.7) {
  console.log('   ⚠️  FORTE corrélation');
} else if (corr4 > 0.5) {
  console.log('   ⚡ Corrélation modérée');
} else {
  console.log('   ✅ Corrélation faible - OK');
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                        RECOMMANDATIONS                         ');
console.log('═══════════════════════════════════════════════════════════════\n');

if (corr1 > 0.7) {
  console.log('→ monthlyListeners + youtubeViews: Considérer fusionner en une');
  console.log('  seule métrique "popularité actuelle" ou réduire le poids d\'une des deux');
}

if (corr2 > 0.7) {
  console.log('→ certifications + chartsLongevity: Ces deux métriques mesurent');
  console.log('  le même concept. Considérer en garder une seule ou réduire les poids.');
}

if (corr3 > 0.7) {
  console.log('→ influenceScore + innovationScore: Forte corrélation car les');
  console.log('  innovateurs ont tendance à être influents. OK si intentionnel.');
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                   POIDS ACTUELS PAR PILIER                     ');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Commercial Power (20%):');
console.log('  - monthlyListeners: 35%');
console.log('  - youtubeViews: 25%');
console.log('  - certifications: 25%');
console.log('  - efficiency: 15%');

console.log('\nCultural Influence (20%):');
console.log('  - influenceScore: 35%');
console.log('  - wikipediaMentions: 25%');
console.log('  - awardsCount: 20%');
console.log('  - chartsLongevity: 20%');

console.log('\n→ chartsLongevity est dans Influence, pas dans Commercial');
console.log('  Cela réduit le double comptage direct.');
