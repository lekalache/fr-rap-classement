import { useState } from 'react';
import artistsData from '../data/artists.json';

interface DownloadFormat {
  name: string;
  extension: string;
  description: string;
  icon: string;
}

const FORMATS: DownloadFormat[] = [
  {
    name: 'JSON',
    extension: 'json',
    description: 'Format brut avec toutes les données',
    icon: '{ }',
  },
  {
    name: 'CSV',
    extension: 'csv',
    description: 'Compatible Excel, Google Sheets',
    icon: '📊',
  },
];

// Lyrics stats (pre-calculated to avoid shipping the full lyrics)
const LYRICS_STATS = {
  totalSongs: 1901,
  totalCharacters: 6448318,
  totalWords: 1150000, // approximate
  databaseSize: '8.2 MB',
  artists: [
    { name: 'Rohff', songs: 50, chars: 265701 },
    { name: 'Kery James', songs: 50, chars: 234135 },
    { name: 'Médine', songs: 50, chars: 212876 },
    { name: 'Nekfeu', songs: 50, chars: 211362 },
    { name: 'Lino', songs: 50, chars: 205165 },
    { name: 'IAM', songs: 50, chars: 203161 },
    { name: 'La Fouine', songs: 51, chars: 203470 },
    { name: 'Youssoupha', songs: 50, chars: 201190 },
    { name: 'Hayce Lemsi', songs: 50, chars: 199842 },
    { name: 'Guizmo', songs: 50, chars: 198042 },
  ],
};

function convertToCSV(data: typeof artistsData): string {
  if (data.length === 0) return '';

  // Get all metric keys
  const metricKeys = Object.keys(data[0].metrics);

  // Header row
  const headers = ['id', 'name', 'debutYear', ...metricKeys];

  // Data rows
  const rows = data.map(artist => {
    const baseFields = [
      artist.id,
      `"${artist.name}"`,
      artist.debutYear.toString(),
    ];
    const metricValues = metricKeys.map(key =>
      (artist.metrics as Record<string, number>)[key]?.toString() || '0'
    );
    return [...baseFields, ...metricValues].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function DataPage() {
  const [downloadCount, setDownloadCount] = useState(0);

  const handleDownload = (format: DownloadFormat) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `fr-rap-classement-${timestamp}.${format.extension}`;

    if (format.extension === 'json') {
      const content = JSON.stringify(artistsData, null, 2);
      downloadFile(content, filename, 'application/json');
    } else if (format.extension === 'csv') {
      const content = convertToCSV(artistsData);
      downloadFile(content, filename, 'text/csv');
    }

    setDownloadCount(prev => prev + 1);
  };

  // Calculate some stats
  const totalArtists = artistsData.length;
  const totalMetrics = Object.keys(artistsData[0]?.metrics || {}).length;
  const avgPunchlineScore = Math.round(
    artistsData.reduce((sum, a) => sum + a.metrics.punchlineScore, 0) / totalArtists
  );
  const avgFlowScore = Math.round(
    artistsData.reduce((sum, a) => sum + a.metrics.flowScore, 0) / totalArtists
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 text-transparent bg-clip-text">
          TÉLÉCHARGER LES DONNÉES
        </h1>
        <p className="text-gray-400">
          Accède aux données brutes utilisées par l'algorithme
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-green-400">{totalArtists}</div>
          <div className="text-sm text-gray-500">Artistes</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-blue-400">{totalMetrics}</div>
          <div className="text-sm text-gray-500">Métriques</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-purple-400">{avgPunchlineScore}</div>
          <div className="text-sm text-gray-500">Punchline moy.</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-yellow-400">{avgFlowScore}</div>
          <div className="text-sm text-gray-500">Flow moy.</div>
        </div>
      </div>

      {/* Download buttons */}
      <div className="bg-white/5 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-green-400 mb-4">
          FORMATS DISPONIBLES
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FORMATS.map((format) => (
            <button
              key={format.extension}
              onClick={() => handleDownload(format)}
              className="flex items-center gap-4 p-4 bg-black/30 hover:bg-black/50 rounded-xl border border-white/10 hover:border-green-500/50 transition-all group"
            >
              <div className="text-3xl w-12 h-12 flex items-center justify-center bg-green-500/20 rounded-lg group-hover:bg-green-500/30">
                {format.icon}
              </div>
              <div className="text-left flex-1">
                <div className="font-bold text-white">{format.name}</div>
                <div className="text-sm text-gray-500">{format.description}</div>
              </div>
              <div className="text-green-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {downloadCount > 0 && (
          <div className="mt-4 text-center text-green-400 text-sm">
            {downloadCount} téléchargement{downloadCount > 1 ? 's' : ''} effectué{downloadCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Data structure preview */}
      <div className="bg-white/5 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold text-purple-400 mb-4">
          STRUCTURE DES DONNÉES
        </h2>

        <div className="bg-black/50 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-300">
{`{
  "id": "booba",
  "name": "Booba",
  "debutYear": 1994,
  "metrics": {
    // Commercial
    "monthlyListeners": 8500000,
    "youtubeViews": 3200000000,
    "certifications": 145,

    // Technique (analysé par NLP)
    "uniqueWords": 4187,
    "flowScore": 50,
    "punchlineScore": 61,
    "hookScore": 62,

    // Influence
    "influenceScore": 95,
    "wikipediaMentions": 420,

    // Longévité
    "chartsLongevity": 280,
    "albumsCount": 10,

    // Excellence
    "peakAlbumScore": 92,
    "classicTracksCount": 28,

    // Innovation
    "innovationScore": 88
  }
}`}
          </pre>
        </div>
      </div>

      {/* Metrics explanation */}
      <div className="bg-white/5 rounded-xl p-6">
        <h2 className="text-lg font-bold text-blue-400 mb-4">
          MÉTRIQUES ANALYSÉES
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'uniqueWords', desc: 'Vocabulaire unique (via spaCy NLP)', source: 'Genius API' },
            { name: 'flowScore', desc: 'Densité de rimes, variations syllabiques', source: 'Analyse audio/texte' },
            { name: 'punchlineScore', desc: 'Patterns rhétoriques (V3 algorithm)', source: 'NLP + Patterns' },
            { name: 'hookScore', desc: 'Mémorabilité des refrains', source: 'Analyse structurelle' },
            { name: 'influenceScore', desc: 'Impact sur la culture rap FR', source: 'Wikipedia + Citations' },
            { name: 'certifications', desc: 'Disques d\'or/platine SNEP', source: 'SNEP officiel' },
            { name: 'monthlyListeners', desc: 'Auditeurs mensuels Spotify', source: 'Spotify API' },
            { name: 'youtubeViews', desc: 'Vues totales YouTube', source: 'YouTube Data' },
          ].map((metric) => (
            <div key={metric.name} className="bg-black/30 rounded-lg p-3">
              <div className="font-mono text-green-400 text-sm">{metric.name}</div>
              <div className="text-gray-400 text-sm mt-1">{metric.desc}</div>
              <div className="text-gray-600 text-xs mt-1">Source: {metric.source}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lyrics Database Section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20 mb-6">
        <h2 className="text-lg font-bold text-purple-400 mb-4">
          BASE DE PAROLES (LYRICS)
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-purple-400">{LYRICS_STATS.totalSongs.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Chansons</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-pink-400">{(LYRICS_STATS.totalCharacters / 1000000).toFixed(1)}M</div>
            <div className="text-xs text-gray-500">Caractères</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-blue-400">~{(LYRICS_STATS.totalWords / 1000).toFixed(0)}K</div>
            <div className="text-xs text-gray-500">Mots</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-black text-green-400">{LYRICS_STATS.databaseSize}</div>
            <div className="text-xs text-gray-500">Taille DB</div>
          </div>
        </div>

        <h3 className="text-sm font-bold text-gray-400 mb-3">TOP 10 - VOLUME DE TEXTE</h3>
        <div className="space-y-2">
          {LYRICS_STATS.artists.map((artist, i) => (
            <div key={artist.name} className="flex items-center gap-3">
              <span className="text-gray-600 w-6 text-right">{i + 1}.</span>
              <span className="text-white flex-1">{artist.name}</span>
              <span className="text-gray-500 text-sm">{artist.songs} songs</span>
              <div className="w-32 bg-black/30 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  style={{ width: `${(artist.chars / LYRICS_STATS.artists[0].chars) * 100}%` }}
                />
              </div>
              <span className="text-purple-400 text-sm w-20 text-right">
                {(artist.chars / 1000).toFixed(0)}K
              </span>
            </div>
          ))}
        </div>

        {/* Download button */}
        <a
          href="/lyrics.db"
          download="fr-rap-lyrics.db"
          className="mt-6 flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold transition-all"
        >
          <span className="text-2xl">📥</span>
          <div className="text-left">
            <div className="text-white">Télécharger la base SQLite</div>
            <div className="text-purple-200 text-sm font-normal">lyrics.db - {LYRICS_STATS.databaseSize}</div>
          </div>
        </a>

        <div className="mt-4 p-4 bg-black/30 rounded-lg">
          <div className="text-sm text-gray-400">
            <span className="text-purple-400 font-semibold">Format SQLite</span> - Ouvrable avec:
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {['DB Browser for SQLite', 'Python (sqlite3)', 'DBeaver', 'TablePlus'].map(tool => (
              <span key={tool} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-500">
                {tool}
              </span>
            ))}
          </div>
          <pre className="mt-3 text-xs text-gray-500 bg-black/30 p-2 rounded overflow-x-auto">
{`-- Structure de la base
SELECT * FROM artists;     -- Liste des artistes
SELECT * FROM songs;       -- Toutes les paroles
SELECT * FROM analysis_cache;  -- Scores calculés`}
          </pre>
        </div>

        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <span>⚠️</span>
            <span>Usage recherche/éducatif uniquement - Les paroles restent © leurs auteurs</span>
          </div>
        </div>
      </div>

      {/* License */}
      <div className="mt-8 text-center text-gray-600 text-sm">
        <p>Données collectées à des fins éducatives et de divertissement.</p>
        <p className="mt-1">Licence: CC BY-NC 4.0 - Attribution requise, usage non-commercial</p>
      </div>
    </div>
  );
}
