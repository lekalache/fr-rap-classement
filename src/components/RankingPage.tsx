import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Artist, PillarName } from '../types';
import { rankArtists } from '../services/scoring';

interface Props {
  artists: Artist[];
  onSelectDuel: (artist1: Artist, artist2: Artist) => void;
}

type SortBy = 'total' | PillarName;

export function RankingPage({ artists, onSelectDuel }: Props) {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<SortBy>('total');
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);

  const pillarLabels: Record<PillarName, string> = {
    commercialPower: t('pillars.commercial'),
    careerLongevity: t('pillars.longevity'),
    lyricalCraft: t('pillars.technique'),
    quotability: t('pillars.quotability'),
    culturalInfluence: t('pillars.influence'),
    artisticVision: t('pillars.vision'),
    peakExcellence: t('pillars.excellence'),
    innovationScore: t('pillars.innovation'),
  };

  const rankedArtists = useMemo(() => {
    const ranked = rankArtists(artists);

    if (sortBy === 'total') {
      return ranked;
    }

    return [...ranked].sort((a, b) => {
      const scoreA = a.pillars[sortBy].score;
      const scoreB = b.pillars[sortBy].score;
      return scoreB - scoreA;
    });
  }, [artists, sortBy]);

  const toggleArtistSelection = (artist: Artist) => {
    if (selectedArtists.find((a) => a.id === artist.id)) {
      setSelectedArtists(selectedArtists.filter((a) => a.id !== artist.id));
    } else if (selectedArtists.length < 2) {
      setSelectedArtists([...selectedArtists, artist]);
    }
  };

  const handleLaunchDuel = () => {
    if (selectedArtists.length === 2) {
      onSelectDuel(selectedArtists[0], selectedArtists[1]);
    }
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  const getMedalBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-400/10 ring-2 ring-yellow-400/50';
      case 2: return 'bg-gray-300/10 ring-2 ring-gray-300/50';
      case 3: return 'bg-amber-600/10 ring-2 ring-amber-600/50';
      default: return 'bg-white/5';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const pillarKeys: PillarName[] = [
    'commercialPower',
    'careerLongevity',
    'lyricalCraft',
    'quotability',
    'culturalInfluence',
    'artisticVision',
    'peakExcellence',
    'innovationScore',
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black mb-4">{t('ranking.title')}</h1>
        <p className="text-xl text-gray-400">
          {t('ranking.subtitle', { count: artists.length })}
        </p>
      </div>

      {/* Sélection pour duel */}
      {selectedArtists.length > 0 && (
        <div className="sticky top-4 z-20 mb-6">
          <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-gray-400">{t('ranking.selection')}</span>
              {selectedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-lg"
                >
                  <span className="font-semibold">{artist.name}</span>
                  <button
                    onClick={() => toggleArtistSelection(artist)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
              {selectedArtists.length === 1 && (
                <span className="text-gray-500 text-sm">{t('ranking.selectSecond')}</span>
              )}
            </div>
            {selectedArtists.length === 2 && (
              <button
                onClick={handleLaunchDuel}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-bold hover:from-purple-600 hover:to-blue-600 transition-colors"
              >
                {t('ranking.launchDuel')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="text-gray-400 py-2">{t('ranking.sortBy')}</span>
        <button
          onClick={() => setSortBy('total')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            sortBy === 'total'
              ? 'bg-purple-500 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          {t('ranking.totalScore')}
        </button>
        {pillarKeys.map((pillar) => (
          <button
            key={pillar}
            onClick={() => setSortBy(pillar)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              sortBy === pillar
                ? 'bg-purple-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {pillarLabels[pillar]}
          </button>
        ))}
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1, 0, 2].map((podiumIndex) => {
          const artist = rankedArtists[podiumIndex];
          if (!artist) return null;
          const rank = podiumIndex + 1;
          const isSelected = selectedArtists.find((a) => a.id === artist.artist.id);

          return (
            <div
              key={artist.artist.id}
              onClick={() => toggleArtistSelection(artist.artist)}
              className={`
                ${podiumIndex === 0 ? 'order-2 -mt-4' : podiumIndex === 1 ? 'order-1' : 'order-3'}
                ${getMedalBg(rank)}
                ${isSelected ? 'ring-2 ring-purple-500' : ''}
                rounded-2xl p-6 text-center cursor-pointer hover:bg-white/10 transition-all
              `}
            >
              <div className={`text-4xl mb-2 ${getMedalColor(rank)}`}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
              </div>
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${
                rank === 1 ? 'from-yellow-400 to-yellow-600' :
                rank === 2 ? 'from-gray-300 to-gray-500' :
                'from-amber-500 to-amber-700'
              } flex items-center justify-center text-2xl font-bold`}>
                {artist.artist.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold mb-1">{artist.artist.name}</h3>
              <div className={`text-3xl font-black ${getScoreColor(artist.totalScore)}`}>
                {artist.totalScore}
              </div>
              <div className="text-sm text-gray-500">{t('ranking.points')}</div>
            </div>
          );
        })}
      </div>

      {/* Tableau complet */}
      <div className="bg-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-4 text-gray-400 font-semibold">#</th>
                <th className="text-left p-4 text-gray-400 font-semibold">{t('ranking.rapper')}</th>
                <th className="text-center p-4 text-gray-400 font-semibold">{t('ranking.score')}</th>
                {pillarKeys.map((pillar) => (
                  <th
                    key={pillar}
                    className={`text-center p-4 font-semibold cursor-pointer hover:text-white transition-colors ${
                      sortBy === pillar ? 'text-purple-400' : 'text-gray-400'
                    }`}
                    onClick={() => setSortBy(pillar)}
                  >
                    {pillarLabels[pillar].split(' ')[0]}
                  </th>
                ))}
                <th className="text-center p-4 text-gray-400 font-semibold">{t('ranking.debut')}</th>
              </tr>
            </thead>
            <tbody>
              {rankedArtists.map((artist, index) => {
                const displayRank = index + 1;
                const isSelected = selectedArtists.find((a) => a.id === artist.artist.id);

                return (
                  <tr
                    key={artist.artist.id}
                    onClick={() => toggleArtistSelection(artist.artist)}
                    className={`
                      border-b border-gray-800 cursor-pointer transition-colors
                      ${isSelected ? 'bg-purple-500/20' : 'hover:bg-white/5'}
                    `}
                  >
                    <td className="p-4">
                      <span className={`font-bold ${getMedalColor(displayRank)}`}>
                        {displayRank}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold`}>
                          {artist.artist.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold">{artist.artist.name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date().getFullYear() - artist.artist.debutYear} {t('ranking.yearsCareer')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xl font-black ${getScoreColor(artist.totalScore)}`}>
                        {artist.totalScore}
                      </span>
                    </td>
                    {pillarKeys.map((pillar) => (
                      <td key={pillar} className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-semibold ${
                            sortBy === pillar ? 'text-purple-400' : 'text-gray-300'
                          }`}>
                            {artist.pillars[pillar].score}
                          </span>
                          <div className="w-12 h-1 bg-gray-700 rounded-full mt-1">
                            <div
                              className={`h-full rounded-full ${
                                sortBy === pillar ? 'bg-purple-500' : 'bg-gray-500'
                              }`}
                              style={{ width: `${artist.pillars[pillar].score}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    ))}
                    <td className="p-4 text-center text-gray-400">
                      {artist.artist.debutYear}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats globales */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-purple-400">
            {Math.round(rankedArtists.reduce((sum, a) => sum + a.totalScore, 0) / rankedArtists.length)}
          </div>
          <div className="text-sm text-gray-400">{t('ranking.averageScore')}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-green-400">
            {rankedArtists[0]?.totalScore || 0}
          </div>
          <div className="text-sm text-gray-400">{t('ranking.maxScore')}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-yellow-400">
            {Math.round(rankedArtists.reduce((sum, a) => sum + (new Date().getFullYear() - a.artist.debutYear), 0) / rankedArtists.length)}
          </div>
          <div className="text-sm text-gray-400">{t('ranking.avgCareerYears')}</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center">
          <div className="text-3xl font-black text-blue-400">
            {rankedArtists.length}
          </div>
          <div className="text-sm text-gray-400">{t('ranking.rappers')}</div>
        </div>
      </div>
    </div>
  );
}
