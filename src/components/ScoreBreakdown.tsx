import type { ArtistScore, PillarName } from '../types';
import { PILLAR_LABELS } from '../types';

interface Props {
  artistScore: ArtistScore;
  color: 'purple' | 'blue';
}

export function ScoreBreakdown({ artistScore, color }: Props) {
  const bgColor = color === 'purple' ? 'bg-purple-600' : 'bg-blue-600';
  const barColor = color === 'purple' ? 'bg-purple-500' : 'bg-blue-500';
  const borderColor = color === 'purple' ? 'border-purple-500' : 'border-blue-500';
  const pillarKeys = Object.keys(artistScore.pillars) as PillarName[];

  return (
    <div className={`bg-gray-900 border-4 ${borderColor} p-6`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 ${bgColor} border-2 border-white flex items-center justify-center font-black`}>
          {artistScore.artist.name.charAt(0)}
        </div>
        <h3 className="text-lg font-black uppercase">{artistScore.artist.name}</h3>
      </div>

      <div className="space-y-4">
        {pillarKeys.map((key) => {
          const pillar = artistScore.pillars[key];
          return (
            <div key={key}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400 font-bold">{PILLAR_LABELS[key]}</span>
                <span className="font-black">{pillar.score}</span>
              </div>
              <div className="h-3 bg-gray-800 border border-gray-600 overflow-hidden">
                <div
                  className={`h-full ${barColor} transition-all duration-500`}
                  style={{ width: `${pillar.score}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">{pillar.details}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t-2 border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-bold uppercase">Score Total</span>
          <span className="text-3xl font-black text-yellow-400">{artistScore.totalScore}</span>
        </div>
      </div>
    </div>
  );
}
