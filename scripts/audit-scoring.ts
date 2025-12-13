/**
 * Audit complet du système de scoring
 * Identifie les problèmes, incohérences et anomalies
 */

import artistsData from '../src/data/artists.json';

const CURRENT_YEAR = 2025;

const BENCHMARKS = {
  monthlyListeners: 15_000_000,
  youtubeViews: 5_000_000_000,
  certifications: 150,
  albumsCount: 18,
  careerYears: 35,
  uniqueWords: 8000,
  flowScore: 100,
  punchlineScore: 100,
  hookScore: 100,
  influenceScore: 100,
  wikipediaMentions: 600,
  awardsCount: 20,
  chartsLongevity: 350,
  thematicCoherence: 100,
  artisticIntegrity: 100,
  peakAlbumScore: 100,
  classicTracksCount: 30,
  innovationScore: 100,
};

interface Issue {
  type: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  details?: string;
}

const issues: Issue[] = [];

console.log('═══════════════════════════════════════════════════════════════');
console.log('                    AUDIT DU SCORING                           ');
console.log('═══════════════════════════════════════════════════════════════\n');

// ============================================================
// 1. VÉRIFICATION DES POIDS DES PILIERS
// ============================================================
console.log('1. VÉRIFICATION DES POIDS DES PILIERS');
console.log('─'.repeat(50));

const weights = {
  commercialPower: 0.20,
  careerLongevity: 0.08,
  lyricalCraft: 0.12,
  quotability: 0.08,
  culturalInfluence: 0.20,
  artisticVision: 0.12,
  peakExcellence: 0.12,
  innovationScore: 0.08,
};

const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
console.log('Poids total:', totalWeight.toFixed(2));

if (Math.abs(totalWeight - 1.0) > 0.001) {
  issues.push({
    type: 'critical',
    category: 'Poids',
    description: 'Les poids ne totalisent pas 100%',
    details: `Total: ${(totalWeight * 100).toFixed(1)}%`,
  });
  console.log('❌ ERREUR: Les poids ne font pas 100%!');
} else {
  console.log('✅ Les poids totalisent bien 100%');
}

console.log('\nRépartition:');
Object.entries(weights).forEach(([name, w]) => {
  console.log(`  ${name.padEnd(20)} ${(w * 100).toFixed(0)}%`);
});

// ============================================================
// 2. ANALYSE DES BENCHMARKS VS DONNÉES RÉELLES
// ============================================================
console.log('\n\n2. BENCHMARKS VS DONNÉES RÉELLES');
console.log('─'.repeat(50));

const artists = artistsData as any[];

const metricsToCheck = [
  'monthlyListeners',
  'youtubeViews',
  'certifications',
  'uniqueWords',
  'flowScore',
  'punchlineScore',
  'hookScore',
  'wikipediaMentions',
  'awardsCount',
  'chartsLongevity',
  'classicTracksCount',
] as const;

for (const metric of metricsToCheck) {
  const values = artists.map(a => a.metrics[metric]).filter(v => v !== undefined);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const benchmark = BENCHMARKS[metric as keyof typeof BENCHMARKS];

  const maxArtist = artists.find(a => a.metrics[metric] === max)?.name;
  const percentAtMax = (max / benchmark) * 100;

  console.log(`\n${metric}:`);
  console.log(`  Benchmark: ${benchmark.toLocaleString()}`);
  console.log(`  Max réel:  ${max.toLocaleString()} (${maxArtist}) = ${percentAtMax.toFixed(1)}% du benchmark`);
  console.log(`  Min réel:  ${min.toLocaleString()}`);
  console.log(`  Moyenne:   ${Math.round(avg).toLocaleString()}`);

  // Problème si le max réel est très loin du benchmark
  if (percentAtMax < 50) {
    issues.push({
      type: 'warning',
      category: 'Benchmark',
      description: `Benchmark ${metric} trop élevé`,
      details: `Max réel (${max}) = seulement ${percentAtMax.toFixed(0)}% du benchmark (${benchmark})`,
    });
    console.log(`  ⚠️  Benchmark potentiellement trop élevé!`);
  } else if (percentAtMax > 100) {
    issues.push({
      type: 'warning',
      category: 'Benchmark',
      description: `Benchmark ${metric} trop bas`,
      details: `Max réel (${max}) dépasse le benchmark (${benchmark})`,
    });
    console.log(`  ⚠️  Benchmark dépassé!`);
  }
}

// ============================================================
// 3. DÉTECTION DES VALEURS SUSPECTES
// ============================================================
console.log('\n\n3. VALEURS SUSPECTES');
console.log('─'.repeat(50));

// Artistes avec flowScore très bas ou très élevé
const suspiciousFlow = artists.filter(a => a.metrics.flowScore < 30 || a.metrics.flowScore > 80);
if (suspiciousFlow.length > 0) {
  console.log('\nflowScore extrêmes:');
  suspiciousFlow.forEach(a => {
    console.log(`  ${a.name}: ${a.metrics.flowScore}`);
    if (a.metrics.flowScore > 80) {
      issues.push({
        type: 'info',
        category: 'Valeur suspecte',
        description: `${a.name} a un flowScore très élevé (${a.metrics.flowScore})`,
      });
    }
  });
}

// Artistes avec très peu de mots uniques (possible erreur Genius)
const lowVocab = artists.filter(a => a.metrics.uniqueWords < 1000);
if (lowVocab.length > 0) {
  console.log('\nuniqueWords très bas (<1000):');
  lowVocab.forEach(a => {
    console.log(`  ${a.name}: ${a.metrics.uniqueWords} mots`);
    issues.push({
      type: 'warning',
      category: 'Valeur suspecte',
      description: `${a.name} a très peu de mots uniques (${a.metrics.uniqueWords})`,
      details: 'Possible erreur de collecte Genius',
    });
  });
}

// Artistes avec trop de mots uniques (possible erreur ou non collecté)
const highVocab = artists.filter(a => a.metrics.uniqueWords > 6000);
if (highVocab.length > 0) {
  console.log('\nuniqueWords très élevé (>6000):');
  highVocab.forEach(a => {
    console.log(`  ${a.name}: ${a.metrics.uniqueWords} mots`);
    issues.push({
      type: 'info',
      category: 'Valeur suspecte',
      description: `${a.name} a beaucoup de mots uniques (${a.metrics.uniqueWords})`,
      details: 'Vérifier si collecté via Genius ou estimation manuelle',
    });
  });
}

// ============================================================
// 4. COHÉRENCE DES MÉTRIQUES SUBJECTIVES
// ============================================================
console.log('\n\n4. MÉTRIQUES SUBJECTIVES (ÉDITORIAL)');
console.log('─'.repeat(50));

const subjectiveMetrics = [
  'influenceScore',
  'thematicCoherence',
  'artisticIntegrity',
  'peakAlbumScore',
  'innovationScore',
];

console.log('\nCes métriques sont des estimations éditoriales, pas calculées:');
for (const metric of subjectiveMetrics) {
  const values = artists.map(a => ({ name: a.name, value: a.metrics[metric] }));
  values.sort((a, b) => b.value - a.value);

  console.log(`\n${metric}:`);
  console.log('  Top 5:', values.slice(0, 5).map(v => `${v.name}(${v.value})`).join(', '));
  console.log('  Bottom 5:', values.slice(-5).map(v => `${v.name}(${v.value})`).join(', '));

  // Vérifier la distribution
  const avg = values.reduce((s, v) => s + v.value, 0) / values.length;
  const allSimilar = values.every(v => Math.abs(v.value - avg) < 15);
  if (allSimilar) {
    issues.push({
      type: 'warning',
      category: 'Distribution',
      description: `${metric} a une distribution trop uniforme`,
      details: `Tous les artistes entre ${Math.min(...values.map(v => v.value))} et ${Math.max(...values.map(v => v.value))}`,
    });
    console.log('  ⚠️  Distribution trop uniforme - ne différencie pas assez');
  }
}

// ============================================================
// 5. FORMULES POTENTIELLEMENT PROBLÉMATIQUES
// ============================================================
console.log('\n\n5. ANALYSE DES FORMULES');
console.log('─'.repeat(50));

// Efficacité commerciale: certifs/albums
console.log('\nEfficacité commerciale (certifs/album):');
const efficiencies = artists.map(a => ({
  name: a.name,
  albums: a.metrics.albumsCount,
  certifs: a.metrics.certifications,
  efficiency: a.metrics.albumsCount > 0 ? a.metrics.certifications / a.metrics.albumsCount : 0,
}));
efficiencies.sort((a, b) => b.efficiency - a.efficiency);

console.log('  Top 5:');
efficiencies.slice(0, 5).forEach(e => {
  console.log(`    ${e.name}: ${e.efficiency.toFixed(1)} certifs/album (${e.certifs}/${e.albums})`);
});

// Vérifier si le benchmark de 15 certifs/album est réaliste
const maxEfficiency = Math.max(...efficiencies.map(e => e.efficiency));
if (maxEfficiency > 15) {
  issues.push({
    type: 'warning',
    category: 'Benchmark',
    description: 'Benchmark efficacité (15 certifs/album) dépassé',
    details: `Max: ${maxEfficiency.toFixed(1)} certifs/album`,
  });
  console.log(`  ⚠️  Benchmark 15 dépassé: max = ${maxEfficiency.toFixed(1)}`);
}

// Bonus décennie
console.log('\nBonus décennie (problème potentiel):');
console.log('  Formule actuelle: decadeBonus = min(100, ceil(careerYears/10) * 25)');
console.log('  → 4 décennies (40 ans) pour atteindre 100%');
console.log('  → Mais benchmark careerYears = 35 ans');
issues.push({
  type: 'info',
  category: 'Formule',
  description: 'Décalage entre benchmark années (35) et bonus décennie (40 pour 100%)',
  details: 'Un artiste avec 35 ans de carrière a yearsScore=100% mais decadeBonus=100% aussi (ceil(35/10)*25=100)',
});

// ============================================================
// 6. DOUBLE COMPTAGE POTENTIEL
// ============================================================
console.log('\n\n6. DOUBLE COMPTAGE POTENTIEL');
console.log('─'.repeat(50));

console.log('\nMétriques pouvant être corrélées:');
console.log('  - certifications ↔ chartsLongevity (les deux mesurent le succès commercial)');
console.log('  - monthlyListeners ↔ youtubeViews (les deux mesurent la popularité)');
console.log('  - influenceScore ↔ innovationScore (souvent liés)');
console.log('  - uniqueWords ↔ flowScore (collectés ensemble via Genius)');

issues.push({
  type: 'info',
  category: 'Méthodologie',
  description: 'Corrélation possible entre certifications et chartsLongevity',
  details: 'Les deux contribuent au score et mesurent des concepts similaires',
});

// ============================================================
// 7. RÉSUMÉ DES PROBLÈMES
// ============================================================
console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('                    RÉSUMÉ DES PROBLÈMES                        ');
console.log('═══════════════════════════════════════════════════════════════\n');

const criticalIssues = issues.filter(i => i.type === 'critical');
const warnings = issues.filter(i => i.type === 'warning');
const infos = issues.filter(i => i.type === 'info');

if (criticalIssues.length > 0) {
  console.log('🔴 CRITIQUES:');
  criticalIssues.forEach(i => {
    console.log(`   ${i.category}: ${i.description}`);
    if (i.details) console.log(`      → ${i.details}`);
  });
}

if (warnings.length > 0) {
  console.log('\n🟡 AVERTISSEMENTS:');
  warnings.forEach(i => {
    console.log(`   ${i.category}: ${i.description}`);
    if (i.details) console.log(`      → ${i.details}`);
  });
}

if (infos.length > 0) {
  console.log('\n🔵 INFORMATIONS:');
  infos.forEach(i => {
    console.log(`   ${i.category}: ${i.description}`);
    if (i.details) console.log(`      → ${i.details}`);
  });
}

console.log(`\nTotal: ${criticalIssues.length} critiques, ${warnings.length} avertissements, ${infos.length} infos`);
