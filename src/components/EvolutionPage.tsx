import { useState, useMemo } from 'react';
import { EvolutionChart } from './EvolutionChart';
import { useArtistHistory } from '../hooks/useArtistHistory';
import { ARTIST_COLORS, ERAS } from '../types/history';
import { getEraContext } from '../services/historical-scoring';

export function EvolutionPage() {
  const {
    availableArtists,
    artistsHistory,
    yearRange,
    getLegendaryAlbums,
    getArtistSnapshots,
  } = useArtistHistory();

  // État pour les artistes sélectionnés
  const [selectedArtists, setSelectedArtists] = useState<string[]>([
    'booba',
    'kaaris',
    'pnl',
  ]);

  // État pour la période
  const [startYear, setStartYear] = useState(1990);
  const [endYear, setEndYear] = useState(2025);

  // Année sélectionnée pour le détail
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Toggle un artiste
  const toggleArtist = (artistId: string) => {
    setSelectedArtists((prev) =>
      prev.includes(artistId)
        ? prev.filter((id) => id !== artistId)
        : prev.length < 5
          ? [...prev, artistId]
          : prev
    );
  };

  // Détail de l'année sélectionnée
  const yearDetail = useMemo(() => {
    if (!selectedYear) return null;

    const eraContext = getEraContext(selectedYear);
    const artistsData = selectedArtists
      .map((id) => {
        const snapshots = getArtistSnapshots(id);
        const snapshot = snapshots.find((s) => s.year === selectedYear);
        return {
          id,
          name: artistsHistory[id]?.artistName || id,
          snapshot,
        };
      })
      .filter((a) => a.snapshot)
      .sort((a, b) => (a.snapshot?.estimatedRank || 99) - (b.snapshot?.estimatedRank || 99));

    return { eraContext, artistsData };
  }, [selectedYear, selectedArtists, artistsHistory, getArtistSnapshots]);

  // Albums légendaires
  const legendaryAlbums = getLegendaryAlbums();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-yellow-400 uppercase tracking-wider">
          Évolution du Classement
        </h1>
        <p className="text-gray-400 mt-2">
          Visualisez l'évolution des rappeurs à travers les décennies (1990-2025)
        </p>
      </div>

      {/* Sélection des artistes */}
      <div className="bg-gray-900 border-2 border-gray-700 p-6">
        <h3 className="text-lg font-black text-white mb-4 uppercase">
          Sélectionner les artistes (max 5)
        </h3>
        <div className="flex flex-wrap gap-2">
          {availableArtists.map((artistId) => {
            const isSelected = selectedArtists.includes(artistId);
            const artistName = artistsHistory[artistId]?.artistName || artistId;
            const color = ARTIST_COLORS[artistId] || '#888';

            return (
              <button
                key={artistId}
                onClick={() => toggleArtist(artistId)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all
                  ${isSelected
                    ? 'text-white ring-2'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                  }
                `}
                style={{
                  backgroundColor: isSelected ? color + '30' : undefined,
                  borderColor: isSelected ? color : undefined,
                  boxShadow: isSelected ? `0 0 0 2px ${color}` : undefined,
                }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: color }}
                />
                {artistName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtres de période */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Période</h3>
        <div className="flex flex-wrap gap-6 items-center">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Début</label>
            <input
              type="number"
              min={yearRange.min}
              max={endYear - 1}
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-gray-700 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fin</label>
            <input
              type="number"
              min={startYear + 1}
              max={yearRange.max}
              value={endYear}
              onChange={(e) => setEndYear(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-gray-700 rounded-lg text-white"
            />
          </div>

          {/* Presets d'ères */}
          <div className="flex gap-2 ml-auto">
            {Object.entries(ERAS).map(([key, era]) => (
              <button
                key={key}
                onClick={() => {
                  setStartYear(era.startYear);
                  setEndYear(era.endYear);
                }}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300"
              >
                {era.name}
              </button>
            ))}
            <button
              onClick={() => {
                setStartYear(yearRange.min);
                setEndYear(yearRange.max);
              }}
              className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-500 rounded-lg text-white"
            >
              Tout
            </button>
          </div>
        </div>
      </div>

      {/* Graphique d'évolution */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Évolution des Rangs
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Le rang 1 est en haut. Cliquez sur une année pour voir les détails.
        </p>

        {selectedArtists.length > 0 ? (
          <EvolutionChart
            artistIds={selectedArtists}
            startYear={startYear}
            endYear={endYear}
            showAlbums
          />
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-500">
            Sélectionnez au moins un artiste
          </div>
        )}
      </div>

      {/* Sélection d'année pour détails */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Explorer une Année
        </h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {Array.from({ length: Math.min(endYear - startYear + 1, 36) }, (_, i) => startYear + i).map(
            (year) => {
              const isSelected = selectedYear === year;

              return (
                <button
                  key={year}
                  onClick={() => setSelectedYear(isSelected ? null : year)}
                  className={`
                    px-3 py-1 rounded text-sm transition-all
                    ${isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }
                  `}
                >
                  {year}
                </button>
              );
            }
          )}
        </div>

        {/* Détails de l'année */}
        {yearDetail && selectedYear && (
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-2xl font-bold text-white">{selectedYear}</h4>
              <div className="text-right">
                <p className="text-sm text-purple-400">{yearDetail.eraContext.name}</p>
                <p className="text-xs text-gray-500">
                  {yearDetail.eraContext.description}
                </p>
              </div>
            </div>

            {/* Facteur d'inflation */}
            <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">
                Facteur d'ajustement streams:{' '}
                <span className="text-white font-semibold">
                  ×{(1 / yearDetail.eraContext.streamInflation).toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  (1M streams {selectedYear} = {(1 / yearDetail.eraContext.streamInflation).toFixed(2)}M équiv. 2015)
                </span>
              </p>
            </div>

            {/* Classement de l'année */}
            <div className="space-y-3">
              {yearDetail.artistsData.map((artist) => (
                <div
                  key={artist.id}
                  className="flex items-center gap-4 p-4 bg-gray-700/30 rounded-lg"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                    style={{
                      backgroundColor: ARTIST_COLORS[artist.id] + '30',
                      color: ARTIST_COLORS[artist.id],
                    }}
                  >
                    #{artist.snapshot?.estimatedRank || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{artist.name}</p>
                    {artist.snapshot?.event && (
                      <p className="text-sm text-gray-400">{artist.snapshot.event}</p>
                    )}
                    {artist.snapshot?.notes && (
                      <p className="text-xs text-gray-500 mt-1">{artist.snapshot.notes}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    {artist.snapshot?.metrics.certifications && (
                      <p className="text-yellow-400">
                        {artist.snapshot.metrics.certifications} certifs
                      </p>
                    )}
                    {artist.snapshot?.metrics.monthlyListeners && (
                      <p className="text-blue-400">
                        {(artist.snapshot.metrics.monthlyListeners / 1_000_000).toFixed(1)}M listeners
                      </p>
                    )}
                    {artist.snapshot?.metrics.physicalSales && (
                      <p className="text-green-400">
                        {(artist.snapshot.metrics.physicalSales / 1000).toFixed(0)}k ventes
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline des albums légendaires */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Albums Légendaires (1990-2025)
        </h3>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700" />

          <div className="space-y-4">
            {legendaryAlbums
              .filter((a) => a.year >= startYear && a.year <= endYear)
              .sort((a, b) => a.year - b.year)
              .map((album) => (
                <div
                  key={`${album.artistId}-${album.albumName}`}
                  className="relative pl-10"
                >
                  <div
                    className="absolute left-2 w-5 h-5 rounded-full border-2 bg-gray-900"
                    style={{
                      borderColor: ARTIST_COLORS[album.artistId] || '#888',
                    }}
                  />
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-400">{album.year}</span>
                      <span
                        className="font-bold"
                        style={{ color: ARTIST_COLORS[album.artistId] }}
                      >
                        {album.artistName}
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {album.albumName}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                        {album.certifications} certifs
                      </span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                        {album.genre}
                      </span>
                      {album.peakChartPosition === 1 && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                          #1 Charts
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Classiques: {album.classicTracks.join(', ')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Explication des ères */}
      <div className="bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Comprendre les Ères
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(ERAS).map(([key, era]) => (
            <div key={key} className="p-4 bg-gray-700/30 rounded-lg">
              <h4 className="font-semibold text-white">{era.name}</h4>
              <p className="text-sm text-gray-400">
                {era.startYear} - {era.endYear}
              </p>
              <p className="text-xs text-gray-500 mt-2">{era.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <h4 className="font-semibold text-purple-400 mb-2">
            Pondération des Streams
          </h4>
          <p className="text-sm text-gray-300">
            Les streams sont dévalués de ~10% par an après 2015 (année de référence).
            Par exemple, 1 million de streams en 2024 équivaut à ~390K streams de 2015.
            Cela permet de comparer équitablement les artistes à travers les époques.
          </p>
        </div>
      </div>
    </div>
  );
}
