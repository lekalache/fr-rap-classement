import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
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

// 90s Style Tooltip - Bold, blocky, uppercase
function RetroTooltip({ active, payload, label, albums }: CustomTooltipProps) {
  if (!active || !payload || !label) return null;

  const yearAlbums = albums.filter((a) => a.year === label);

  return (
    <div className="bg-black border-4 border-yellow-400 p-4 font-black uppercase">
      <div className="text-2xl text-yellow-400 mb-3 text-center">{label}</div>

      <div className="border-t-4 border-yellow-400 pt-3 space-y-2">
        {payload
          .filter((entry) => entry.value != null)
          .sort((a, b) => a.value - b.value)
          .map((entry) => (
            <div key={entry.name} className="flex justify-between gap-6 items-center">
              <span className="flex items-center gap-2">
                <span
                  className="w-4 h-4 border-2 border-white"
                  style={{ backgroundColor: entry.color }}
                />
                <span style={{ color: entry.color }}>{entry.name}</span>
              </span>
              <span className="text-white text-lg">#{entry.value}</span>
            </div>
          ))}
      </div>

      {yearAlbums.length > 0 && (
        <div className="mt-4 pt-3 border-t-2 border-gray-600">
          <div className="text-green-400 text-xs mb-2">★ ALBUMS:</div>
          {yearAlbums.map((album) => (
            <div
              key={`${album.artistId}-${album.albumName}`}
              className="text-xs normal-case"
            >
              <span style={{ color: ARTIST_COLORS[album.artistId] || '#888' }}>
                {album.artistName}
              </span>
              <span className="text-gray-400"> - {album.albumName}</span>
              {album.impact === 'legendary' && (
                <span className="ml-1 text-yellow-400">★</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 90s Style Legend - Chip buttons
function RetroLegend({
  artistIds,
  artistNames
}: {
  artistIds: string[];
  artistNames: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center mt-6">
      {artistIds.map((id) => (
        <div
          key={id}
          className="px-4 py-2 bg-black border-4 border-white font-black uppercase text-sm flex items-center gap-2"
        >
          <span
            className="w-4 h-4 border-2 border-white"
            style={{ backgroundColor: ARTIST_COLORS[id] || '#888' }}
          />
          <span style={{ color: ARTIST_COLORS[id] || '#888' }}>
            {artistNames[id]}
          </span>
        </div>
      ))}
    </div>
  );
}

// Era header component
function EraHeader({ startYear, endYear }: { startYear: number; endYear: number }) {
  const visibleEras = Object.entries(ERAS).filter(
    ([, era]) => era.startYear <= endYear && era.endYear >= startYear
  );

  const eraColors: Record<string, string> = {
    physical: 'text-yellow-400 border-yellow-400',
    transition: 'text-green-400 border-green-400',
    streamingEarly: 'text-cyan-400 border-cyan-400',
    streamingMature: 'text-purple-400 border-purple-400',
    current: 'text-red-400 border-red-400',
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center mb-4">
      {visibleEras.map(([key, era]) => (
        <div
          key={key}
          className={`px-3 py-1 bg-black border-2 text-xs font-black uppercase ${eraColors[key]}`}
        >
          [{era.startYear}-{era.endYear}] {era.name}
        </div>
      ))}
    </div>
  );
}

// Custom square dot for lines
const SquareDot = (props: { cx?: number; cy?: number; stroke?: string; fill?: string }) => {
  const { cx, cy, fill } = props;
  if (cx === undefined || cy === undefined) return null;

  return (
    <rect
      x={cx - 5}
      y={cy - 5}
      width={10}
      height={10}
      fill={fill}
      stroke="#FFFFFF"
      strokeWidth={2}
    />
  );
};

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

  // Era background colors (very subtle)
  const eraBackgrounds: Record<string, string> = {
    physical: 'rgba(250, 204, 21, 0.08)',      // Yellow
    transition: 'rgba(34, 197, 94, 0.08)',      // Green
    streamingEarly: 'rgba(6, 182, 212, 0.08)', // Cyan
    streamingMature: 'rgba(168, 85, 247, 0.08)', // Purple
    current: 'rgba(239, 68, 68, 0.08)',         // Red
  };

  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-black border-4 border-yellow-400">
        <span className="text-yellow-400 font-black uppercase">
          Pas de données disponibles
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Era Header */}
      <EraHeader startYear={startYear} endYear={endYear} />

      {/* Chart */}
      <div className="border-4 border-yellow-400 bg-black p-2">
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={chartData}
            margin={{ top: 30, right: 40, left: 60, bottom: 20 }}
          >
            {/* Era background zones */}
            {Object.entries(ERAS).map(([key, era]) => {
              const areaStart = Math.max(era.startYear, startYear);
              const areaEnd = Math.min(era.endYear, endYear);
              if (areaStart >= areaEnd) return null;

              return (
                <ReferenceArea
                  key={key}
                  x1={areaStart}
                  x2={areaEnd}
                  fill={eraBackgrounds[key]}
                  fillOpacity={1}
                />
              );
            })}

            {/* Bold grid */}
            <CartesianGrid
              stroke="#374151"
              strokeWidth={1}
              strokeDasharray="0"
            />

            {/* X-Axis - Years */}
            <XAxis
              dataKey="year"
              stroke="#FFD700"
              strokeWidth={3}
              tick={{ fill: '#FFD700', fontWeight: 'bold', fontSize: 14 }}
              tickLine={{ stroke: '#FFD700', strokeWidth: 2 }}
              axisLine={{ stroke: '#FFD700', strokeWidth: 3 }}
              domain={[startYear, endYear]}
              type="number"
              tickCount={Math.min(8, endYear - startYear + 1)}
            />

            {/* Y-Axis - Ranks */}
            <YAxis
              stroke="#FFD700"
              strokeWidth={3}
              tick={{ fill: '#FFD700', fontWeight: 'bold', fontSize: 12 }}
              tickLine={{ stroke: '#FFD700', strokeWidth: 2 }}
              axisLine={{ stroke: '#FFD700', strokeWidth: 3 }}
              reversed
              domain={[1, 30]}
              ticks={[1, 5, 10, 15, 20, 25, 30]}
              tickFormatter={(value) => `#${value}`}
              label={{
                value: 'RANG',
                angle: -90,
                position: 'insideLeft',
                fill: '#FFD700',
                fontWeight: 'bold',
                fontSize: 14,
                offset: -10,
              }}
            />

            {/* Tooltip */}
            <Tooltip
              content={<RetroTooltip albums={albumsTimeline} />}
              cursor={{ stroke: '#FFD700', strokeWidth: 2, strokeDasharray: '5 5' }}
            />

            {/* Era separator lines */}
            {Object.entries(ERAS).map(([key, era]) => {
              if (era.startYear < startYear || era.startYear > endYear) return null;
              return (
                <ReferenceLine
                  key={key}
                  x={era.startYear}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                />
              );
            })}

            {/* Artist lines - Step type for angular 90s look */}
            {artistIds.map((artistId) => (
              <Line
                key={artistId}
                type="stepAfter"
                dataKey={artistId}
                name={artistNames[artistId]}
                stroke={ARTIST_COLORS[artistId] || '#888888'}
                strokeWidth={3}
                dot={<SquareDot fill={ARTIST_COLORS[artistId] || '#888888'} />}
                activeDot={{
                  r: 8,
                  fill: ARTIST_COLORS[artistId] || '#888888',
                  stroke: '#FFFFFF',
                  strokeWidth: 3,
                }}
                connectNulls
              />
            ))}

            {/* Legendary album markers */}
            {showAlbums &&
              legendaryAlbums.map((album) => (
                <ReferenceLine
                  key={`${album.artistId}-${album.albumName}`}
                  x={album.year}
                  stroke={ARTIST_COLORS[album.artistId] || '#888'}
                  strokeWidth={3}
                  strokeDasharray="0"
                  label={{
                    value: '★',
                    position: 'top',
                    fill: ARTIST_COLORS[album.artistId] || '#888',
                    fontSize: 18,
                    fontWeight: 'bold',
                  }}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Custom 90s Legend */}
      <RetroLegend artistIds={artistIds} artistNames={artistNames} />

      {/* Legendary albums list - 90s style */}
      {showAlbums && legendaryAlbums.length > 0 && (
        <div className="mt-6 bg-black border-4 border-green-400 p-4">
          <h4 className="text-green-400 font-black uppercase text-lg mb-4 flex items-center gap-2">
            <span>★</span> ALBUMS LÉGENDAIRES <span>★</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {legendaryAlbums.map((album) => (
              <div
                key={`${album.artistId}-${album.albumName}`}
                className="bg-gray-900 border-2 p-3 flex items-start gap-3"
                style={{ borderColor: ARTIST_COLORS[album.artistId] || '#888' }}
              >
                <span
                  className="w-6 h-6 border-2 border-white flex items-center justify-center font-black text-sm"
                  style={{ backgroundColor: ARTIST_COLORS[album.artistId] || '#888' }}
                >
                  {album.year.toString().slice(-2)}
                </span>
                <div>
                  <div
                    className="font-black uppercase text-sm"
                    style={{ color: ARTIST_COLORS[album.artistId] || '#888' }}
                  >
                    {album.artistName}
                  </div>
                  <div className="text-white text-sm font-bold">
                    {album.albumName}
                  </div>
                  <div className="text-yellow-400 text-xs mt-1">
                    {album.certifications} certifs
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
