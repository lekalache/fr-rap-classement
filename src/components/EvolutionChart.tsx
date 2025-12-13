import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { EvolutionChartProps, AlbumEntry } from '../types/history';
import { ARTIST_COLORS, ERAS } from '../types/history';
import { useArtistHistory } from '../hooks/useArtistHistory';

interface TooltipPayloadItem {
  color: string;
  name: string;
  value: number;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: number;
  albums: AlbumEntry[];
}

// Custom tooltip pour afficher les albums
function CustomTooltip({ active, payload, label, albums }: CustomTooltipProps) {
  if (!active || !payload || !label) return null;

  const yearAlbums = albums.filter((a) => a.year === label);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
      <p className="font-bold text-white mb-2">{label}</p>

      {/* Rangs des artistes */}
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="text-white font-semibold">#{entry.value}</span>
          </div>
        ))}
      </div>

      {/* Albums de l'année */}
      {yearAlbums.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-1">Albums cette année:</p>
          {yearAlbums.map((album) => (
            <div key={`${album.artistId}-${album.albumName}`} className="text-xs">
              <span
                className="font-medium"
                style={{ color: ARTIST_COLORS[album.artistId] || '#888' }}
              >
                {album.artistName}
              </span>
              <span className="text-gray-400"> - {album.albumName}</span>
              {album.impact === 'legendary' && (
                <span className="ml-1 text-yellow-500">*</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EvolutionChart({
  artistIds,
  startYear = 1990,
  endYear = 2025,
  showAlbums = true,
}: EvolutionChartProps) {
  const {
    getEvolutionData,
    albumsTimeline,
    artistsHistory,
  } = useArtistHistory();

  // Données pour le graphique
  const chartData = useMemo(() => {
    return getEvolutionData(artistIds, startYear, endYear);
  }, [artistIds, startYear, endYear, getEvolutionData]);

  // Albums légendaires pour les marqueurs
  const legendaryAlbums = useMemo(() => {
    return albumsTimeline.filter(
      (album) =>
        album.impact === 'legendary' &&
        artistIds.includes(album.artistId) &&
        album.year >= startYear &&
        album.year <= endYear
    );
  }, [albumsTimeline, artistIds, startYear, endYear]);

  // Noms des artistes
  const artistNames = useMemo(() => {
    const names: Record<string, string> = {};
    artistIds.forEach((id) => {
      names[id] = artistsHistory[id]?.artistName || id;
    });
    return names;
  }, [artistIds, artistsHistory]);

  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-500">
        Pas de données disponibles pour les artistes sélectionnés
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={500}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

          <XAxis
            dataKey="year"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
            domain={[startYear, endYear]}
          />

          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
            reversed // Rang 1 en haut
            domain={[1, 25]}
            label={{
              value: 'Rang',
              angle: -90,
              position: 'insideLeft',
              fill: '#9CA3AF',
            }}
          />

          <Tooltip
            content={<CustomTooltip albums={albumsTimeline} />}
          />

          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            formatter={(value) => (
              <span className="text-gray-300">{value}</span>
            )}
          />

          {/* Lignes de séparation des ères */}
          {Object.entries(ERAS).map(([key, era]) => (
            <ReferenceLine
              key={key}
              x={era.startYear}
              stroke="#4B5563"
              strokeDasharray="5 5"
              label={{
                value: era.name,
                position: 'top',
                fill: '#6B7280',
                fontSize: 10,
              }}
            />
          ))}

          {/* Ligne pour chaque artiste */}
          {artistIds.map((artistId) => (
            <Line
              key={artistId}
              type="monotone"
              dataKey={artistId}
              name={artistNames[artistId]}
              stroke={ARTIST_COLORS[artistId] || '#888888'}
              strokeWidth={2}
              dot={{ r: 4, fill: ARTIST_COLORS[artistId] || '#888888' }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}

          {/* Marqueurs pour albums légendaires */}
          {showAlbums &&
            legendaryAlbums.map((album) => (
              <ReferenceLine
                key={`${album.artistId}-${album.albumName}`}
                x={album.year}
                stroke={ARTIST_COLORS[album.artistId] || '#888'}
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Légende des albums légendaires */}
      {showAlbums && legendaryAlbums.length > 0 && (
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-400 mb-2">
            Albums Légendaires
          </h4>
          <div className="flex flex-wrap gap-3">
            {legendaryAlbums.map((album) => (
              <div
                key={`${album.artistId}-${album.albumName}`}
                className="flex items-center gap-2 text-sm"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ARTIST_COLORS[album.artistId] }}
                />
                <span className="text-gray-300">
                  {album.year} - {album.artistName}:{' '}
                  <span className="text-white font-medium">{album.albumName}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
