import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Artist, PillarName } from '../types';
import { rankArtists, DEFAULT_WEIGHTS, type CustomWeights } from '../services/scoring';

interface Props {
  artists: Artist[];
  onSelectDuel: (artist1: Artist, artist2: Artist) => void;
}

type SortBy = 'total' | PillarName;

// Convert weights (0-1) to slider values (0-100) and back
const weightsToSliders = (weights: CustomWeights) =>
  Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, Math.round(v * 100)])) as Record<keyof CustomWeights, number>;

const slidersToWeights = (sliders: Record<keyof CustomWeights, number>) =>
  Object.fromEntries(Object.entries(sliders).map(([k, v]) => [k, v / 100])) as CustomWeights;

export function RankingPage({ artists, onSelectDuel }: Props) {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<SortBy>('total');
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [showWeightSliders, setShowWeightSliders] = useState(false);
  const [sliderValues, setSliderValues] = useState(weightsToSliders(DEFAULT_WEIGHTS));
  const [isCustomMode, setIsCustomMode] = useState(false);

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

  // Convert slider values to weights
  const customWeights = useMemo(() => slidersToWeights(sliderValues), [sliderValues]);

  const rankedArtists = useMemo(() => {
    const weights = isCustomMode ? customWeights : undefined;
    const ranked = rankArtists(artists, weights);

    if (sortBy === 'total') {
      return ranked;
    }

    return [...ranked].sort((a, b) => {
      const scoreA = a.pillars[sortBy].score;
      const scoreB = b.pillars[sortBy].score;
      return scoreB - scoreA;
    });
  }, [artists, sortBy, isCustomMode, customWeights]);

  const handleSliderChange = (pillar: keyof CustomWeights, value: number) => {
    setSliderValues(prev => ({ ...prev, [pillar]: value }));
    setIsCustomMode(true);
  };

  const resetWeights = () => {
    setSliderValues(weightsToSliders(DEFAULT_WEIGHTS));
    setIsCustomMode(false);
  };

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
      case 1: return 'bg-yellow-900';
      case 2: return 'bg-gray-800';
      case 3: return 'bg-amber-900';
      default: return 'bg-gray-900';
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
          <div className="bg-gray-900 border-2 border-gray-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-gray-400 font-bold uppercase">{t('ranking.selection')}</span>
              {selectedArtists.map((artist) => (
                <div
                  key={artist.id}
                  className="flex items-center gap-2 bg-purple-600 px-3 py-1 border-2 border-white"
                >
                  <span className="font-bold">{artist.name}</span>
                  <button
                    onClick={() => toggleArtistSelection(artist)}
                    className="text-gray-300 hover:text-white"
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
                className="px-6 py-2 bg-yellow-400 text-black border-2 border-white font-black uppercase hover:bg-yellow-300 transition-colors"
              >
                {t('ranking.launchDuel')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="mb-6 bg-gray-900 border-4 border-yellow-400 p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-yellow-400 font-black text-lg uppercase tracking-wider">[ {t('ranking.sortBy')} ]</span>
          <div className="flex-1 h-1 bg-yellow-400"></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSortBy('total')}
            className={`px-5 py-3 font-black uppercase text-sm transition-all ${
              sortBy === 'total'
                ? 'bg-yellow-400 text-black border-4 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]'
                : 'bg-black text-yellow-400 border-4 border-yellow-400 hover:bg-yellow-400 hover:text-black'
            }`}
          >
            ★ {t('ranking.totalScore')}
          </button>
          {pillarKeys.map((pillar, index) => (
            <button
              key={pillar}
              onClick={() => setSortBy(pillar)}
              className={`px-4 py-3 font-black uppercase text-xs transition-all ${
                sortBy === pillar
                  ? 'bg-yellow-400 text-black border-4 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)]'
                  : 'bg-black text-gray-300 border-2 border-gray-600 hover:border-yellow-400 hover:text-yellow-400'
              }`}
            >
              {String(index + 1).padStart(2, '0')}. {pillarLabels[pillar]}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Weight Sliders */}
      <div className="mb-6">
        <button
          onClick={() => setShowWeightSliders(!showWeightSliders)}
          className={`flex items-center gap-2 px-4 py-2 font-bold uppercase text-sm transition-colors ${
            isCustomMode
              ? 'bg-yellow-400 text-black border-2 border-white'
              : 'bg-gray-900 text-gray-300 border-2 border-gray-600 hover:border-yellow-400'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          {t('ranking.customWeights')}
          {isCustomMode && <span className="text-xs opacity-75">({t('ranking.customMode')})</span>}
          <svg className={`w-4 h-4 transition-transform ${showWeightSliders ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showWeightSliders && (
          <div className="mt-4 bg-gray-900 border-2 border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-gray-300 uppercase">{t('ranking.customWeights')}</h3>
              {isCustomMode && (
                <button
                  onClick={resetWeights}
                  className="px-3 py-1 text-sm bg-red-600 text-white border-2 border-white font-bold uppercase hover:bg-red-500 transition-colors"
                >
                  {t('ranking.resetWeights')}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pillarKeys.map((pillar) => {
                const defaultValue = Math.round(DEFAULT_WEIGHTS[pillar] * 100);
                const currentValue = sliderValues[pillar];
                const isModified = currentValue !== defaultValue;

                return (
                  <div key={pillar} className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-300">
                        {pillarLabels[pillar]}
                      </label>
                      <span className={`text-sm font-bold ${isModified ? 'text-purple-400' : 'text-gray-500'}`}>
                        {currentValue}%
                        {isModified && <span className="text-xs text-gray-600 ml-1">({defaultValue}%)</span>}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={currentValue}
                      onChange={(e) => handleSliderChange(pillar, parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-gray-500 text-center">
              Les poids sont automatiquement normalisés pour totaliser 100%
            </p>
          </div>
        )}
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
                ${isSelected ? 'border-4 border-purple-500' : 'border-4 border-gray-700'}
                p-6 text-center cursor-pointer hover:border-yellow-400 transition-all
              `}
            >
              <div className={`text-4xl mb-2 ${getMedalColor(rank)}`}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
              </div>
              <div className={`w-20 h-20 mx-auto mb-4 border-4 border-white ${
                rank === 1 ? 'bg-yellow-500' :
                rank === 2 ? 'bg-gray-400' :
                'bg-amber-600'
              } flex items-center justify-center text-2xl font-black`}>
                {artist.artist.name.charAt(0)}
              </div>
              <h3 className="text-xl font-black mb-1 uppercase">{artist.artist.name}</h3>
              <div className={`text-3xl font-black ${getScoreColor(artist.totalScore)}`}>
                {artist.totalScore}
              </div>
              <div className="text-sm text-gray-500 uppercase">{t('ranking.points')}</div>
            </div>
          );
        })}
      </div>

      {/* Tableau complet */}
      <div className="bg-gray-900 border-4 border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-600 bg-gray-800">
                <th className="text-left p-4 text-gray-300 font-black uppercase">#</th>
                <th className="text-left p-4 text-gray-300 font-black uppercase">{t('ranking.rapper')}</th>
                <th className="text-center p-4 text-gray-300 font-black uppercase">{t('ranking.score')}</th>
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
                      border-b border-gray-700 cursor-pointer transition-colors
                      ${isSelected ? 'bg-purple-900' : 'hover:bg-gray-800'}
                    `}
                  >
                    <td className="p-4">
                      <span className={`font-black ${getMedalColor(displayRank)}`}>
                        {displayRank}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 border-2 border-white flex items-center justify-center font-black">
                          {artist.artist.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold">{artist.artist.name}</div>
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
        <div className="bg-gray-900 border-2 border-purple-500 p-4 text-center">
          <div className="text-3xl font-black text-purple-400">
            {Math.round(rankedArtists.reduce((sum, a) => sum + a.totalScore, 0) / rankedArtists.length)}
          </div>
          <div className="text-sm text-gray-400 uppercase font-bold">{t('ranking.averageScore')}</div>
        </div>
        <div className="bg-gray-900 border-2 border-green-500 p-4 text-center">
          <div className="text-3xl font-black text-green-400">
            {rankedArtists[0]?.totalScore || 0}
          </div>
          <div className="text-sm text-gray-400 uppercase font-bold">{t('ranking.maxScore')}</div>
        </div>
        <div className="bg-gray-900 border-2 border-yellow-500 p-4 text-center">
          <div className="text-3xl font-black text-yellow-400">
            {Math.round(rankedArtists.reduce((sum, a) => sum + (new Date().getFullYear() - a.artist.debutYear), 0) / rankedArtists.length)}
          </div>
          <div className="text-sm text-gray-400 uppercase font-bold">{t('ranking.avgCareerYears')}</div>
        </div>
        <div className="bg-gray-900 border-2 border-blue-500 p-4 text-center">
          <div className="text-3xl font-black text-blue-400">
            {rankedArtists.length}
          </div>
          <div className="text-sm text-gray-400 uppercase font-bold">{t('ranking.rappers')}</div>
        </div>
      </div>
    </div>
  );
}
