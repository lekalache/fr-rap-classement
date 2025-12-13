import type { ArtistScore, PillarName } from '../types';
import { PILLAR_LABELS } from '../types';

interface Props {
  artistScore: ArtistScore;
  color: 'purple' | 'blue';
}

export function ScoreBreakdown({ artistScore, color }: Props) {
  const colorClasses = {
    purple: 'from-purple-500 to-pink-500',
    blue: 'from-blue-500 to-cyan-500',
  };

  const barColor = color === 'purple' ? 'bg-purple-500' : 'bg-blue-500';
  const pillarKeys = Object.keys(artistScore.pillars) as PillarName[];

  return (
    <div className="bg-white/5 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center font-bold`}>
          {artistScore.artist.name.charAt(0)}
        </div>
        <h3 className="text-lg font-bold">{artistScore.artist.name}</h3>
      </div>

      <div className="space-y-4">
        {pillarKeys.map((key) => {
          const pillar = artistScore.pillars[key];
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{PILLAR_LABELS[key]}</span>
                <span className="font-semibold">{pillar.score}</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${pillar.score}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">{pillar.details}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Score Total</span>
          <span className="text-3xl font-black">{artistScore.totalScore}</span>
        </div>
      </div>
    </div>
  );
}
