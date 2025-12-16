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
    'iam',
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

  // Era colors for buttons
  const eraButtonColors: Record<string, string> = {
    physical: 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black',
    transition: 'border-green-400 text-green-400 hover:bg-green-400 hover:text-black',
    streamingEarly: 'border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black',
    streamingMature: 'border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-black',
    current: 'border-red-400 text-red-400 hover:bg-red-400 hover:text-black',
  };

  return (
    <div className="space-y-8">
      {/* Header - 90s style */}
      <div className="text-center">
        <h1 className="text-4xl font-black text-yellow-400 uppercase tracking-wider">
          [ ÉVOLUTION DU CLASSEMENT ]
        </h1>
        <p className="text-gray-400 mt-2 font-bold uppercase">
          Visualisez l'évolution des rappeurs à travers les décennies (1990-2025)
        </p>
      </div>

      {/* Sélection des artistes - 90s style */}
      <div className="bg-black border-4 border-yellow-400 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-yellow-400 font-black text-lg uppercase tracking-wider">
            [ SÉLECTIONNER LES ARTISTES ]
          </span>
          <div className="flex-1 h-1 bg-yellow-400"></div>
          <span className="text-gray-500 font-bold text-sm">MAX 5</span>
        </div>

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
                  px-4 py-2 font-black uppercase text-sm transition-all border-4
                  ${isSelected
                    ? 'bg-black text-white border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]'
                    : 'bg-gray-900 text-gray-400 border-gray-700 hover:border-gray-500'
                  }
                `}
                style={{
                  borderColor: isSelected ? color : undefined,
                  color: isSelected ? color : undefined,
                }}
              >
                <span
                  className="inline-block w-3 h-3 mr-2 border border-white"
                  style={{ backgroundColor: color }}
                />
                {artistName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtres de période - 90s style */}
      <div className="bg-black border-4 border-green-400 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-green-400 font-black text-lg uppercase tracking-wider">
            [ PÉRIODE ]
          </span>
          <div className="flex-1 h-1 bg-green-400"></div>
        </div>

        <div className="flex flex-wrap gap-6 items-center">
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase font-bold">Début</label>
            <input
              type="number"
              min={yearRange.min}
              max={endYear - 1}
              value={startYear}
              onChange={(e) => setStartYear(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-black border-4 border-gray-600 text-yellow-400 font-black text-center focus:border-yellow-400 outline-none"
            />
          </div>
          <span className="text-gray-600 font-black text-2xl">→</span>
          <div>
            <label className="block text-xs text-gray-500 mb-1 uppercase font-bold">Fin</label>
            <input
              type="number"
              min={startYear + 1}
              max={yearRange.max}
              value={endYear}
              onChange={(e) => setEndYear(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-black border-4 border-gray-600 text-yellow-400 font-black text-center focus:border-yellow-400 outline-none"
            />
          </div>

          {/* Presets d'ères */}
          <div className="flex flex-wrap gap-2 ml-auto">
            {Object.entries(ERAS).map(([key, era]) => (
              <button
                key={key}
                onClick={() => {
                  setStartYear(era.startYear);
                  setEndYear(era.endYear);
                }}
                className={`px-3 py-2 text-xs font-black uppercase border-2 bg-black transition-all ${eraButtonColors[key]}`}
              >
                {era.name}
              </button>
            ))}
            <button
              onClick={() => {
                setStartYear(yearRange.min);
                setEndYear(yearRange.max);
              }}
              className="px-4 py-2 text-sm font-black uppercase bg-yellow-400 text-black border-4 border-white hover:bg-yellow-300"
            >
              TOUT
            </button>
          </div>
        </div>
      </div>

      {/* Graphique d'évolution - 90s style container */}
      <div className="bg-gray-900 border-4 border-purple-400 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-purple-400 font-black text-lg uppercase tracking-wider">
            [ ÉVOLUTION DES RANGS ]
          </span>
          <div className="flex-1 h-1 bg-purple-400"></div>
        </div>
        <p className="text-sm text-gray-500 mb-4 font-bold uppercase">
          Rang #1 en haut • Survolez pour les détails
        </p>

        {selectedArtists.length > 0 ? (
          <EvolutionChart
            artistIds={selectedArtists}
            startYear={startYear}
            endYear={endYear}
            showAlbums
          />
        ) : (
          <div className="h-[400px] flex items-center justify-center bg-black border-4 border-yellow-400">
            <span className="text-yellow-400 font-black uppercase">
              Sélectionnez au moins un artiste
            </span>
          </div>
        )}
      </div>

      {/* Sélection d'année pour détails - 90s style */}
      <div className="bg-black border-4 border-cyan-400 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-cyan-400 font-black text-lg uppercase tracking-wider">
            [ EXPLORER UNE ANNÉE ]
          </span>
          <div className="flex-1 h-1 bg-cyan-400"></div>
        </div>

        <div className="flex flex-wrap gap-1 mb-6">
          {Array.from({ length: Math.min(endYear - startYear + 1, 36) }, (_, i) => startYear + i).map(
            (year) => {
              const isSelected = selectedYear === year;

              return (
                <button
                  key={year}
                  onClick={() => setSelectedYear(isSelected ? null : year)}
                  className={`
                    w-14 py-2 text-xs font-black transition-all border-2
                    ${isSelected
                      ? 'bg-cyan-400 text-black border-white'
                      : 'bg-black text-gray-500 border-gray-700 hover:border-cyan-400 hover:text-cyan-400'
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
          <div className="border-t-4 border-cyan-400 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-3xl font-black text-cyan-400">{selectedYear}</h4>
              <div className="text-right">
                <p className="text-sm font-black text-purple-400 uppercase">{yearDetail.eraContext.name}</p>
                <p className="text-xs text-gray-500">
                  {yearDetail.eraContext.description}
                </p>
              </div>
            </div>

            {/* Facteur d'inflation */}
            <div className="mb-4 p-3 bg-gray-900 border-2 border-gray-700">
              <p className="text-sm text-gray-400 font-bold">
                FACTEUR STREAMS:{' '}
                <span className="text-yellow-400 font-black">
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
                  className="flex items-center gap-4 p-4 bg-gray-900 border-2"
                  style={{ borderColor: ARTIST_COLORS[artist.id] || '#888' }}
                >
                  <div
                    className="w-12 h-12 flex items-center justify-center font-black text-lg border-4 border-white"
                    style={{
                      backgroundColor: ARTIST_COLORS[artist.id],
                      color: '#000',
                    }}
                  >
                    #{artist.snapshot?.estimatedRank || '?'}
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-black uppercase"
                      style={{ color: ARTIST_COLORS[artist.id] }}
                    >
                      {artist.name}
                    </p>
                    {artist.snapshot?.event && (
                      <p className="text-sm text-gray-400">{artist.snapshot.event}</p>
                    )}
                    {artist.snapshot?.notes && (
                      <p className="text-xs text-gray-500 mt-1">{artist.snapshot.notes}</p>
                    )}
                  </div>
                  <div className="text-right text-sm font-bold">
                    {artist.snapshot?.metrics.certifications && (
                      <p className="text-yellow-400">
                        {artist.snapshot.metrics.certifications} CERTIFS
                      </p>
                    )}
                    {artist.snapshot?.metrics.monthlyListeners && (
                      <p className="text-blue-400">
                        {(artist.snapshot.metrics.monthlyListeners / 1_000_000).toFixed(1)}M LISTENERS
                      </p>
                    )}
                    {artist.snapshot?.metrics.physicalSales && (
                      <p className="text-green-400">
                        {(artist.snapshot.metrics.physicalSales / 1000).toFixed(0)}K VENTES
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline des albums légendaires - 90s style */}
      <div className="bg-black border-4 border-yellow-400 p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-yellow-400 font-black text-lg uppercase tracking-wider">
            ★ ALBUMS LÉGENDAIRES ★
          </span>
          <div className="flex-1 h-1 bg-yellow-400"></div>
        </div>

        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-1 bg-yellow-400" />

          <div className="space-y-4">
            {legendaryAlbums
              .filter((a) => a.year >= startYear && a.year <= endYear)
              .sort((a, b) => a.year - b.year)
              .map((album) => (
                <div
                  key={`${album.artistId}-${album.albumName}`}
                  className="relative pl-16"
                >
                  <div
                    className="absolute left-3 w-7 h-7 border-4 border-white flex items-center justify-center font-black text-xs"
                    style={{
                      backgroundColor: ARTIST_COLORS[album.artistId] || '#888',
                      color: '#000',
                    }}
                  >
                    {album.year.toString().slice(-2)}
                  </div>
                  <div
                    className="bg-gray-900 border-2 p-4"
                    style={{ borderColor: ARTIST_COLORS[album.artistId] || '#888' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500 font-bold">{album.year}</span>
                      <span
                        className="font-black uppercase"
                        style={{ color: ARTIST_COLORS[album.artistId] }}
                      >
                        {album.artistName}
                      </span>
                    </div>
                    <p className="text-lg font-black text-white uppercase">
                      {album.albumName}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 bg-yellow-400 text-black text-xs font-black">
                        {album.certifications} CERTIFS
                      </span>
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs font-black">
                        {album.genre.toUpperCase()}
                      </span>
                      {album.peakChartPosition === 1 && (
                        <span className="px-2 py-1 bg-green-500 text-black text-xs font-black">
                          #1 CHARTS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 font-bold">
                      CLASSIQUES: {album.classicTracks.join(' • ')}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Explication des ères - 90s style */}
      <div className="bg-black border-4 border-gray-600 p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-white font-black text-lg uppercase tracking-wider">
            [ COMPRENDRE LES ÈRES ]
          </span>
          <div className="flex-1 h-1 bg-gray-600"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(ERAS).map(([key, era]) => {
            const borderColors: Record<string, string> = {
              physical: 'border-yellow-400',
              transition: 'border-green-400',
              streamingEarly: 'border-cyan-400',
              streamingMature: 'border-purple-400',
              current: 'border-red-400',
            };
            const textColors: Record<string, string> = {
              physical: 'text-yellow-400',
              transition: 'text-green-400',
              streamingEarly: 'text-cyan-400',
              streamingMature: 'text-purple-400',
              current: 'text-red-400',
            };

            return (
              <div
                key={key}
                className={`p-4 bg-gray-900 border-4 ${borderColors[key]}`}
              >
                <h4 className={`font-black uppercase ${textColors[key]}`}>{era.name}</h4>
                <p className="text-sm text-gray-400 font-bold">
                  {era.startYear} - {era.endYear}
                </p>
                <p className="text-xs text-gray-500 mt-2">{era.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-gray-900 border-4 border-purple-400">
          <h4 className="font-black text-purple-400 mb-2 uppercase">
            ★ PONDÉRATION DES STREAMS ★
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
