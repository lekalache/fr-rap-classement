import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useComparison } from './hooks/useComparison';
import { SearchBar } from './components/SearchBar';
import { ComparisonView } from './components/ComparisonView';
import { AlgorithmPage } from './components/AlgorithmPage';
import { RankingPage } from './components/RankingPage';
import { EvolutionPage } from './components/EvolutionPage';
import { PunchlineDetectorPage } from './components/PunchlineDetectorPage';
import { DataPage } from './components/DataPage';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import type { Artist } from './types';

type Page = 'duel' | 'ranking' | 'algorithm' | 'evolution' | 'detector' | 'data';

function App() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState<Page>('duel');
  const {
    artists,
    artist1,
    artist2,
    comparison,
    setArtist1,
    setArtist2,
    compare,
    reset,
  } = useComparison();

  const canCompare = artist1 && artist2 && artist1.id !== artist2.id;

  const handleSelectDuelFromRanking = (a1: Artist, a2: Artist) => {
    setArtist1(a1);
    setArtist2(a2);
    setCurrentPage('duel');
    setTimeout(() => compare(), 0);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => {
              setCurrentPage('duel');
              reset();
            }}
            className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 text-transparent bg-clip-text"
          >
            RAP FR OPENDATA
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCurrentPage('duel');
                reset();
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentPage === 'duel'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {t('nav.duel')}
            </button>
            <button
              onClick={() => setCurrentPage('ranking')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentPage === 'ranking'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {t('nav.ranking')}
            </button>
            <button
              onClick={() => setCurrentPage('evolution')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentPage === 'evolution'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {t('nav.evolution')}
            </button>
            <button
              onClick={() => setCurrentPage('algorithm')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentPage === 'algorithm'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {t('nav.algorithm')}
            </button>
            <button
              onClick={() => setCurrentPage('detector')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentPage === 'detector'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {t('nav.punchlineDetector')}
            </button>
            <button
              onClick={() => setCurrentPage('data')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentPage === 'data'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {t('nav.openData')}
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto">
        {/* Page Data */}
        {currentPage === 'data' && <DataPage />}

        {/* Page Punchline Detector */}
        {currentPage === 'detector' && <PunchlineDetectorPage />}

        {/* Page Algorithme */}
        {currentPage === 'algorithm' && <AlgorithmPage />}

        {/* Page Évolution */}
        {currentPage === 'evolution' && <EvolutionPage />}

        {/* Page Classement */}
        {currentPage === 'ranking' && (
          <RankingPage
            artists={artists}
            onSelectDuel={handleSelectDuelFromRanking}
          />
        )}

        {/* Page Duel */}
        {currentPage === 'duel' && (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-blue-500 text-transparent bg-clip-text">
                {t('hero.title')}
              </h1>
              <p className="text-xl text-gray-400">
                {t('hero.subtitle')}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {t('hero.artistCount', { count: artists.length })}
              </p>
            </div>

            {/* Sélection des artistes */}
            {!comparison && (
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-purple-400 mb-2">
                      {t('duel.rapper1')}
                    </label>
                    <SearchBar
                      artists={artists.filter((a) => a.id !== artist2?.id)}
                      selectedArtist={artist1}
                      onSelect={setArtist1}
                      placeholder={t('duel.searchPlaceholder')}
                      color="purple"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-400 mb-2">
                      {t('duel.rapper2')}
                    </label>
                    <SearchBar
                      artists={artists.filter((a) => a.id !== artist1?.id)}
                      selectedArtist={artist2}
                      onSelect={setArtist2}
                      placeholder={t('duel.searchPlaceholder')}
                      color="blue"
                    />
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={compare}
                    disabled={!canCompare}
                    className={`
                      px-12 py-4 rounded-xl font-bold text-lg transition-all
                      ${canCompare
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 cursor-pointer'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    {t('duel.launchDuel')}
                  </button>
                  {artist1 && artist2 && artist1.id === artist2.id && (
                    <p className="mt-2 text-red-400 text-sm">
                      {t('duel.selectDifferent')}
                    </p>
                  )}
                </div>

                {/* Liste rapide */}
                <div className="mt-12">
                  <h3 className="text-lg font-semibold text-gray-400 mb-4">{t('duel.popularDuels')}</h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      ['Rim\'K', 'Jul'],
                      ['Booba', 'Rohff'],
                      ['Nekfeu', 'Damso'],
                      ['PNL', 'SCH'],
                      ['Ninho', 'Jul'],
                      ['Kery James', 'Youssoupha'],
                      ['Freeze Corleone', 'Vald'],
                      ['IAM', 'Lino'],
                    ].map(([name1, name2]) => {
                      const a1 = artists.find((a) => a.name === name1);
                      const a2 = artists.find((a) => a.name === name2);
                      if (!a1 || !a2) return null;
                      return (
                        <button
                          key={`${name1}-${name2}`}
                          onClick={() => {
                            setArtist1(a1);
                            setArtist2(a2);
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
                        >
                          {name1} vs {name2}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Résultats */}
            {comparison && (
              <div>
                <button
                  onClick={reset}
                  className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {t('duel.newDuel')}
                </button>
                <ComparisonView comparison={comparison} />
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-gray-600 text-sm">
          <p>{t('footer.algorithm')}</p>
          <p className="mt-1">{t('footer.disclaimer')}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
