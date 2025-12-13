import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ArtistScore } from '../types';
import { PILLAR_LABELS, type PillarName } from '../types';

interface Props {
  artist1Score: ArtistScore;
  artist2Score: ArtistScore;
}

export function RadarChart({ artist1Score, artist2Score }: Props) {
  const pillarKeys = Object.keys(artist1Score.pillars) as PillarName[];

  const data = pillarKeys.map((key) => ({
    subject: PILLAR_LABELS[key],
    [artist1Score.artist.name]: artist1Score.pillars[key].score,
    [artist2Score.artist.name]: artist2Score.pillars[key].score,
    fullMark: 100,
  }));

  return (
    <div className="bg-white/5 rounded-2xl p-6">
      <h3 className="text-xl font-bold mb-4 text-center">Profil Comparatif</h3>
      <ResponsiveContainer width="100%" height={400}>
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#6B7280', fontSize: 10 }}
          />
          <Radar
            name={artist1Score.artist.name}
            dataKey={artist1Score.artist.name}
            stroke="#A855F7"
            fill="#A855F7"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Radar
            name={artist2Score.artist.name}
            dataKey={artist2Score.artist.name}
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Legend
            wrapperStyle={{ color: '#fff' }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
