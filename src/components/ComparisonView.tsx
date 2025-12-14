import { useTranslation } from 'react-i18next';
import type { Comparison } from '../types';
import { RadarChart } from './RadarChart';
import { ScoreBreakdown } from './ScoreBreakdown';

interface Props {
  comparison: Comparison;
}

export function ComparisonView({ comparison }: Props) {
  const { t } = useTranslation();
  const { artist1, artist2, winner, margin } = comparison;

  const isArtist1Winner = winner.id === artist1.artist.id;

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header avec scores */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {/* Artiste 1 */}
        <div className={`text-center p-6 rounded-2xl ${isArtist1Winner ? 'bg-green-900/30 ring-2 ring-green-500' : 'bg-white/5'}`}>
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold">
            {artist1.artist.name.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold mb-2">{artist1.artist.name}</h2>
          <div className="text-5xl font-black text-white">
            {artist1.totalScore}
          </div>
          <div className="text-sm text-gray-400 mt-1">{t('ranking.points')}</div>
          {isArtist1Winner && (
            <div className="mt-3 inline-block px-4 py-1 bg-green-500 rounded-full text-sm font-semibold">
              {t('comparison.winner')}
            </div>
          )}
        </div>

        {/* VS */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-6xl font-black text-gray-600">{t('comparison.vs')}</div>
          <div className="mt-4 text-sm text-gray-500">
            <span className="text-white font-semibold">{margin}</span> {t('comparison.margin')}
          </div>
        </div>

        {/* Artiste 2 */}
        <div className={`text-center p-6 rounded-2xl ${!isArtist1Winner ? 'bg-green-900/30 ring-2 ring-green-500' : 'bg-white/5'}`}>
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl font-bold">
            {artist2.artist.name.charAt(0)}
          </div>
          <h2 className="text-2xl font-bold mb-2">{artist2.artist.name}</h2>
          <div className="text-5xl font-black text-white">
            {artist2.totalScore}
          </div>
          <div className="text-sm text-gray-400 mt-1">{t('ranking.points')}</div>
          {!isArtist1Winner && (
            <div className="mt-3 inline-block px-4 py-1 bg-green-500 rounded-full text-sm font-semibold">
              {t('comparison.winner')}
            </div>
          )}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="mb-8">
        <RadarChart
          artist1Score={artist1}
          artist2Score={artist2}
        />
      </div>

      {/* Breakdown détaillé */}
      <div className="grid grid-cols-2 gap-6">
        <ScoreBreakdown artistScore={artist1} color="purple" />
        <ScoreBreakdown artistScore={artist2} color="blue" />
      </div>

      {/* Comparaison pilier par pilier */}
      <div className="mt-8 bg-white/5 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">{t('comparison.breakdown')}</h3>
        <div className="space-y-3">
          {comparison.breakdown.map((item) => (
            <div key={item.pillar} className="flex items-center gap-4">
              <div className="w-32 text-sm text-gray-400">{item.pillar}</div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${item.artist1Score}%` }}
                  />
                </div>
                <span className={`w-8 text-sm font-semibold ${item.winner === 'artist1' ? 'text-green-400' : 'text-gray-400'}`}>
                  {item.artist1Score}
                </span>
              </div>
              <div className="w-8 text-center text-gray-600">vs</div>
              <div className="flex-1 flex items-center gap-2">
                <span className={`w-8 text-sm font-semibold ${item.winner === 'artist2' ? 'text-green-400' : 'text-gray-400'}`}>
                  {item.artist2Score}
                </span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${item.artist2Score}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
