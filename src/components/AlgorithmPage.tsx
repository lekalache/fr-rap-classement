import { useTranslation } from 'react-i18next';
import { MermaidChart } from './MermaidChart';

const algorithmFlowchart = `
flowchart TB
    subgraph INPUT["ARTISTES"]
        A1[38 Rappeurs FR] --> COLLECT
    end

    subgraph COLLECT["SOURCES DE DONNEES"]
        COLLECT --> GENIUS[Genius API<br/>Paroles]
        COLLECT --> STREAMING[Spotify/YouTube<br/>Streams]
        COLLECT --> EXPERT[Analyse Experte<br/>Éditorial]
    end

    subgraph PILLARS["8 PILIERS D'EVALUATION"]
        STREAMING --> P1[Commercial<br/>20%]
        EXPERT --> P2[Longévité<br/>8%]
        GENIUS --> P3[Technique<br/>12%]
        GENIUS --> P4[Mémorabilité<br/>8%]
        EXPERT --> P5[Influence<br/>20%]
        EXPERT --> P6[Vision<br/>12%]
        EXPERT --> P7[Excellence<br/>12%]
        EXPERT --> P8[Innovation<br/>8%]
    end

    subgraph CALC["CALCUL"]
        P1 --> NORM[Normalisation<br/>0-100]
        P2 --> NORM
        P3 --> NORM
        P4 --> NORM
        P5 --> NORM
        P6 --> NORM
        P7 --> NORM
        P8 --> NORM
        NORM --> SUM[Score Pondéré]
    end

    subgraph OUTPUT["RESULTAT"]
        SUM --> RANK[Classement Final]
    end

    style INPUT fill:#1F2937,stroke:#8B5CF6
    style COLLECT fill:#1F2937,stroke:#3B82F6
    style PILLARS fill:#1F2937,stroke:#10B981
    style CALC fill:#1F2937,stroke:#F59E0B
    style OUTPUT fill:#1F2937,stroke:#10B981
`;

const dataPipelineChart = `
flowchart TB
    subgraph GENIUS["GENIUS API"]
        API[API Developer] --> SEARCH[Recherche Artiste]
        SEARCH --> SONGS[50 Songs/Artiste]
        SONGS --> SCRAPE[Extraction Paroles]
    end

    subgraph NLP["PIPELINE NLP FRANCAIS"]
        SCRAPE --> FILTER[Filtrage Latin<br/>Suppression arabe/cyrillique]
        FILTER --> SPACY[spaCy fr_core_news_md]
        SPACY --> LEMMA[Lemmatisation]
        SPACY --> POS[Part-of-Speech Tagging]
        FILTER --> PHONETICS[Analyse Phonétique]
        PHONETICS --> IPA[Transcription IPA]
    end

    subgraph METRICS["4 METRIQUES CALCULEES"]
        LEMMA --> VOCAB[uniqueWords<br/>Vocabulaire unique]
        IPA --> FLOW[flowScore<br/>Rimes + Syllabes]
        POS --> PUNCH[punchlineScore<br/>Densité sémantique]
        LEMMA --> HOOK[hookScore<br/>Répétitions]
    end

    style GENIUS fill:#1F2937,stroke:#FBBF24
    style NLP fill:#1F2937,stroke:#10B981
    style METRICS fill:#1F2937,stroke:#8B5CF6
`;

// Exemple concret de traitement NLP
const nlpExampleSteps = [
  {
    step: 1,
    name: "Texte Original",
    icon: "📝",
    input: "Je marche dans la tess avec mes reufs",
    output: null,
    description: "Paroles brutes extraites de Genius"
  },
  {
    step: 2,
    name: "Normalisation Argot",
    icon: "🔄",
    input: "Je marche dans la tess avec mes reufs",
    output: "Je marche dans la cité avec mes frères",
    description: "150+ termes d'argot et verlan convertis en français standard"
  },
  {
    step: 3,
    name: "Tokenisation",
    icon: "✂️",
    input: "Je marche dans la cité avec mes frères",
    output: '["Je", "marche", "dans", "la", "cité", "avec", "mes", "frères"]',
    description: "Découpage en tokens (mots individuels)"
  },
  {
    step: 4,
    name: "Lemmatisation",
    icon: "🔍",
    input: '["marche", "frères"]',
    output: '["marcher", "frère"]',
    description: "Réduction à la forme canonique (verbes → infinitif, pluriel → singulier)"
  },
  {
    step: 5,
    name: "Filtrage Stop Words",
    icon: "🚫",
    input: '["Je", "marche", "dans", "la", "cité", "avec", "mes", "frères"]',
    output: '["marche", "cité", "frères"]',
    description: "Suppression des mots vides (le, la, de, avec...)"
  },
  {
    step: 6,
    name: "Analyse Phonétique",
    icon: "🎵",
    input: '"histoire" et "victoire"',
    output: '[/isˈtwaʁ/] et [/vikˈtwaʁ/] → RIME ✓',
    description: "Transcription IPA pour détecter les rimes"
  },
];

const pillars = [
  {
    name: 'Commercial',
    weight: '20%',
    color: 'from-purple-500 to-purple-600',
    icon: '💰',
    metrics: [
      { name: 'Popularité actuelle', weight: '50%', desc: 'Fusion Spotify + YouTube' },
      { name: 'Certifications SNEP', weight: '30%', desc: 'Disques d\'or, platine, diamant' },
      { name: 'Efficacité', weight: '20%', desc: 'Certifications par album' },
    ],
    description: 'Mesure le succès commercial actuel. La popularité Spotify et YouTube sont fusionnées pour éviter le double comptage.',
    source: 'Spotify, YouTube, SNEP',
    computed: false,
  },
  {
    name: 'Longévité',
    weight: '8%',
    color: 'from-blue-500 to-blue-600',
    icon: '⏳',
    metrics: [
      { name: 'Années de carrière', weight: '60%', desc: 'Depuis le premier album' },
      { name: 'Décennies actives', weight: '40%', desc: '1-10 ans = 1, 11-20 = 2, etc.' },
    ],
    description: 'Récompense la durabilité sans pénaliser les artistes sélectifs qui sortent peu d\'albums.',
    source: 'Discographies officielles',
    computed: false,
  },
  {
    name: 'Technique',
    weight: '12%',
    color: 'from-green-500 to-green-600',
    icon: '🎯',
    metrics: [
      { name: 'Vocabulaire unique', weight: '40%', desc: 'Mots uniques sur 50 songs' },
      { name: 'Score Flow', weight: '60%', desc: 'Rimes, syllabes, structure' },
    ],
    description: 'Analyse la maîtrise technique via NLP sur les vraies paroles Genius. Le flow compte plus que le vocabulaire seul.',
    source: 'Genius API + Pipeline NLP',
    computed: true,
  },
  {
    name: 'Mémorabilité',
    weight: '8%',
    color: 'from-yellow-500 to-yellow-600',
    icon: '💥',
    metrics: [
      { name: 'Score Punchlines', weight: '60%', desc: 'Densité sémantique, jeux de mots' },
      { name: 'Score Refrains', weight: '40%', desc: 'Répétitions, catchiness' },
    ],
    description: 'Mesure la capacité à créer des phrases mémorables et des refrains qui restent en tête.',
    source: 'Genius API + Pipeline NLP',
    computed: true,
  },
  {
    name: 'Influence Culturelle',
    weight: '20%',
    color: 'from-red-500 to-red-600',
    icon: '👑',
    metrics: [
      { name: 'Score d\'influence', weight: '45%', desc: 'Impact sur le genre' },
      { name: 'Présence Wikipedia', weight: '30%', desc: 'Mentions et références' },
      { name: 'Récompenses', weight: '25%', desc: 'Victoires de la musique, etc.' },
    ],
    description: 'Évalue l\'impact réel sur la culture rap française. Ne compte pas les features pour ne pas pénaliser les artistes sélectifs.',
    source: 'Analyse éditoriale experte',
    computed: false,
  },
  {
    name: 'Vision Artistique',
    weight: '12%',
    color: 'from-pink-500 to-pink-600',
    icon: '🎨',
    metrics: [
      { name: 'Cohérence thématique', weight: '45%', desc: 'Univers constant' },
      { name: 'Intégrité artistique', weight: '55%', desc: 'Refus des compromis' },
    ],
    description: 'Récompense les artistes avec un univers artistique cohérent et qui ne cèdent pas aux tendances commerciales.',
    source: 'Analyse éditoriale experte',
    computed: false,
  },
  {
    name: 'Excellence',
    weight: '12%',
    color: 'from-cyan-500 to-cyan-600',
    icon: '🏆',
    metrics: [
      { name: 'Meilleur album', weight: '60%', desc: 'Score du chef-d\'oeuvre' },
      { name: 'Tracks classiques', weight: '40%', desc: 'Nombre de titres iconiques' },
    ],
    description: 'Le meilleur travail compte plus que la moyenne. Un album légendaire vaut mieux que 10 albums moyens.',
    source: 'Analyse éditoriale + consensus critique',
    computed: false,
  },
  {
    name: 'Innovation',
    weight: '8%',
    color: 'from-lime-500 to-lime-600',
    icon: '🚀',
    metrics: [
      { name: 'Score Innovation', weight: '100%', desc: 'Création de nouveau son/genre' },
    ],
    description: 'Récompense les pionniers qui ont créé ou popularisé un nouveau style dans le rap français.',
    source: 'Analyse éditoriale experte',
    computed: false,
  },
];

const dataFreshness = {
  genius: { date: 'Décembre 2024', songs: '50 par artiste', artists: 38 },
  commercial: { date: 'Décembre 2024', source: 'Estimations publiques' },
  editorial: { date: 'Décembre 2024', method: 'Analyse experte calibrée' },
};

export function AlgorithmPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-4 text-yellow-400 uppercase tracking-wider">{t('algorithm.title')}</h1>
        <p className="text-xl text-gray-400">
          {t('algorithm.subtitle')}
        </p>
      </div>

      {/* Philosophie */}
      <section className="mb-16">
        <div className="bg-gray-900 border-4 border-purple-500 p-8">
          <h2 className="text-2xl font-bold mb-6">{t('algorithm.philosophy')}</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 rounded-xl p-5">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-bold text-lg mb-2">{t('algorithm.impactOverQuantity')}</h3>
              <p className="text-sm text-gray-400">
                {t('algorithm.impactDesc')}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-5">
              <div className="text-3xl mb-3">⚖️</div>
              <h3 className="font-bold text-lg mb-2">{t('algorithm.balance')}</h3>
              <p className="text-sm text-gray-400">
                {t('algorithm.balanceDesc')}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-5">
              <div className="text-3xl mb-3">🔬</div>
              <h3 className="font-bold text-lg mb-2">{t('algorithm.realData')}</h3>
              <p className="text-sm text-gray-400">
                {t('algorithm.realDataDesc')}
              </p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-5">
            <h3 className="font-bold text-lg mb-3">{t('algorithm.whatWeDoNot')}</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span className="text-gray-300">{t('algorithm.notPenalizeFeatures')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span className="text-gray-300">{t('algorithm.notFavorQuantity')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span className="text-gray-300">{t('algorithm.notDoubleCount')}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span className="text-gray-300">{t('algorithm.notIgnoreLegends')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vue d'ensemble */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">{t('algorithm.overview')}</h2>
        <MermaidChart chart={algorithmFlowchart} id="main-flow" />
      </section>

      {/* Sources de données */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">{t('algorithm.dataSources')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border-2 border-yellow-500 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎵</span>
              <div>
                <h3 className="font-bold text-lg">{t('algorithm.geniusApi')}</h3>
                <span className="text-xs text-yellow-400">{t('algorithm.computedData')}</span>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-4" dangerouslySetInnerHTML={{ __html: t('algorithm.geniusDesc') }} />
            <div className="bg-black/20 rounded-lg p-3 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">{t('algorithm.lastCollection')}</span>
                <span className="text-white">{dataFreshness.genius.date}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">{t('algorithm.analyzedArtists')}</span>
                <span className="text-white">{dataFreshness.genius.artists}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('algorithm.songsPerArtist')}</span>
                <span className="text-white">{dataFreshness.genius.songs}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-green-400">
              → uniqueWords, flowScore, punchlineScore, hookScore
            </div>
          </div>

          <div className="bg-gray-900 border-2 border-blue-500 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📊</span>
              <div>
                <h3 className="font-bold text-lg">{t('algorithm.streamingCharts')}</h3>
                <span className="text-xs text-blue-400">{t('algorithm.estimatedData')}</span>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              {t('algorithm.streamingDesc')}
            </p>
            <div className="bg-black/20 rounded-lg p-3 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">{t('algorithm.lastUpdate')}</span>
                <span className="text-white">{dataFreshness.commercial.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('algorithm.method')}</span>
                <span className="text-white">{dataFreshness.commercial.source}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-blue-400">
              → monthlyListeners, youtubeViews, certifications
            </div>
          </div>

          <div className="bg-gray-900 border-2 border-purple-500 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📚</span>
              <div>
                <h3 className="font-bold text-lg">{t('algorithm.editorialAnalysis')}</h3>
                <span className="text-xs text-purple-400">{t('algorithm.expertData')}</span>
              </div>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              {t('algorithm.editorialDesc')}
            </p>
            <div className="bg-black/20 rounded-lg p-3 text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">{t('algorithm.lastRevision')}</span>
                <span className="text-white">{dataFreshness.editorial.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{t('algorithm.method')}</span>
                <span className="text-white">{dataFreshness.editorial.method}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-purple-400">
              → influenceScore, innovationScore, peakAlbumScore...
            </div>
          </div>
        </div>
      </section>

      {/* Les 8 Piliers */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-2">{t('algorithm.pillarsTitle')}</h2>
        <p className="text-gray-400 mb-6">{t('algorithm.pillarsSubtitle')}</p>

        <div className="space-y-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.name}
              className="bg-white/5 rounded-2xl overflow-hidden"
            >
              <div className={`bg-gradient-to-r ${pillar.color} p-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{pillar.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold">{pillar.name}</h3>
                    <span className="text-sm opacity-80">{t('algorithm.weight')} : {pillar.weight}</span>
                  </div>
                </div>
                {pillar.computed && (
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                    {t('algorithm.calculatedByNLP')}
                  </span>
                )}
              </div>

              <div className="p-6">
                <p className="text-gray-300 mb-4">{pillar.description}</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">{t('algorithm.composition')}</h4>
                    <div className="space-y-2">
                      {pillar.metrics.map((metric) => (
                        <div key={metric.name} className="bg-gray-800/50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-white">{metric.name}</span>
                            <span className={`text-sm bg-gradient-to-r ${pillar.color} bg-clip-text text-transparent font-bold`}>
                              {metric.weight}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{metric.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">{t('algorithm.dataSource')}</h4>
                      <p className="text-sm text-gray-300 bg-gray-800/30 rounded-lg p-3">
                        {pillar.source}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline NLP */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-2">{t('algorithm.nlpPipeline')}</h2>
        <p className="text-gray-400 mb-6">
          {t('algorithm.nlpSubtitle')}
        </p>

        {/* Introduction NLP */}
        <div className="bg-gray-900 border-2 border-green-500 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🧠</div>
            <div>
              <h3 className="text-xl font-bold text-green-400 mb-2">{t('algorithm.whatIsNLP')}</h3>
              <p className="text-gray-300 text-sm mb-4" dangerouslySetInnerHTML={{ __html: t('algorithm.nlpExplanation') }} />
              <div className="flex flex-wrap gap-3 text-xs">
                <a
                  href="https://spacy.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full hover:bg-green-500/30 transition"
                >
                  spaCy Documentation →
                </a>
                <a
                  href="https://spacy.io/models/fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full hover:bg-green-500/30 transition"
                >
                  Modèles Français →
                </a>
                <a
                  href="https://docs.genius.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full hover:bg-yellow-500/30 transition"
                >
                  Genius API →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Vue d'ensemble pipeline */}
        <div className="bg-gray-900 border-2 border-yellow-500 p-6 mb-8">
          <MermaidChart chart={dataPipelineChart} id="data-pipeline" />
        </div>

        {/* Exemple pas à pas */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">{t('algorithm.concreteExample')}</h3>
          <div className="space-y-3">
            {nlpExampleSteps.map((step, index) => (
              <div
                key={step.step}
                className={`bg-white/5 rounded-xl p-4 border-l-4 ${
                  index === 0 ? 'border-gray-500' :
                  index === nlpExampleSteps.length - 1 ? 'border-green-500' :
                  'border-blue-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{step.icon}</span>
                  <div>
                    <span className="text-xs text-gray-500">{t('algorithm.step')} {step.step}</span>
                    <h4 className="font-bold text-white">{step.name}</h4>
                  </div>
                </div>
                <div className="ml-11 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 w-14">{t('algorithm.input')}</span>
                    <code className="bg-gray-800 px-2 py-1 rounded text-yellow-300">{step.input}</code>
                  </div>
                  {step.output && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500 w-14">{t('algorithm.output')}</span>
                      <code className="bg-gray-800 px-2 py-1 rounded text-green-300">{step.output}</code>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 italic">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technologies utilisées */}
        <div className="bg-white/5 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">{t('algorithm.technologiesUsed')}</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-900 border-2 border-blue-500 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🔬</span>
                <h4 className="font-bold text-blue-400">spaCy</h4>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                Bibliothèque NLP industrielle en Python. Modèle utilisé : <code className="text-blue-300">fr_core_news_md</code>
              </p>
              <div className="text-[10px] text-gray-500">
                Tokenisation • Lemmatisation • POS Tagging • NER
              </div>
            </div>

            <div className="bg-gray-900 border-2 border-purple-500 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🔊</span>
                <h4 className="font-bold text-purple-400">Phonétique IPA</h4>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                Transcription phonétique pour l'analyse des rimes. Règles G2P françaises optimisées.
              </p>
              <div className="text-[10px] text-gray-500">
                Alphabet Phonétique International • Détection rimes
              </div>
            </div>

            <div className="bg-gray-900 border-2 border-orange-500 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🗣️</span>
                <h4 className="font-bold text-orange-400">Dictionnaire Argot</h4>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                150+ termes verlan, argot et mots arabes communs dans le rap français.
              </p>
              <div className="text-[10px] text-gray-500">
                Verlan • Argot urbain • Emprunts arabes
              </div>
            </div>
          </div>
        </div>

        {/* Les 4 métriques */}
        <h3 className="text-xl font-bold mb-4">{t('algorithm.metricsCalculated')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* uniqueWords */}
          <div className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-2xl">
                📚
              </div>
              <div>
                <h4 className="font-bold text-green-400 text-lg">uniqueWords</h4>
                <p className="text-xs text-gray-500">{t('algorithm.uniqueWords')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                Compte le nombre de <strong>lemmes uniques</strong> sur 50 chansons.
                Plus un artiste utilise de mots différents, plus ce score est élevé.
              </p>
              <div className="bg-gray-800/50 rounded-lg p-3 text-xs space-y-2">
                <div className="font-semibold text-gray-400 mb-1">{t('algorithm.pipeline')}</div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">1.</span>
                  <span>Filtrage caractères non-latins (supprime arabe, cyrillique...)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">2.</span>
                  <span>Tokenisation via spaCy <code className="text-green-300">fr_core_news_md</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">3.</span>
                  <span>Lemmatisation : "mangeons" → "manger"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">4.</span>
                  <span>Suppression stop words + mots &lt; 2 caractères</span>
                </div>
              </div>
              <div className="flex justify-between text-sm bg-green-900/20 rounded-lg p-2">
                <span className="text-gray-400">{t('algorithm.topArtist')}</span>
                <span className="text-white font-bold">IAM (7,125 mots)</span>
              </div>
            </div>
          </div>

          {/* flowScore */}
          <div className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">
                🎵
              </div>
              <div>
                <h4 className="font-bold text-blue-400 text-lg">flowScore</h4>
                <p className="text-xs text-gray-500">{t('algorithm.flowScore')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                Analyse la <strong>structure des rimes</strong> et la <strong>cadence</strong> via
                transcription phonétique IPA (Alphabet Phonétique International).
              </p>
              <div className="bg-gray-800/50 rounded-lg p-3 text-xs">
                <div className="font-semibold text-gray-400 mb-2">Composition :</div>
                <div className="flex justify-between mb-1"><span>Densité des rimes (fins de ligne)</span><span className="text-blue-400 font-bold">40%</span></div>
                <div className="flex justify-between mb-1"><span>Rimes internes (milieu de ligne)</span><span className="text-blue-400 font-bold">25%</span></div>
                <div className="flex justify-between mb-1"><span>Variation syllabique (rythme)</span><span className="text-blue-400 font-bold">20%</span></div>
                <div className="flex justify-between"><span>Rimes multisyllabiques (complexes)</span><span className="text-blue-400 font-bold">15%</span></div>
              </div>
              <div className="flex justify-between text-sm bg-blue-900/20 rounded-lg p-2">
                <span className="text-gray-400">Top artiste :</span>
                <span className="text-white font-bold">Soprano (71/100)</span>
              </div>
            </div>
          </div>

          {/* punchlineScore */}
          <div className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl">
                💥
              </div>
              <div>
                <h4 className="font-bold text-yellow-400 text-lg">punchlineScore</h4>
                <p className="text-xs text-gray-500">{t('algorithm.punchlineScore')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                Détecte les <strong>jeux de mots</strong>, <strong>métaphores</strong> et phrases
                à fort impact via analyse de densité sémantique.
              </p>
              <div className="bg-gray-800/50 rounded-lg p-3 text-xs">
                <div className="font-semibold text-gray-400 mb-2">Composition :</div>
                <div className="flex justify-between mb-1"><span>Densité sémantique (info/mot)</span><span className="text-yellow-400 font-bold">30%</span></div>
                <div className="flex justify-between mb-1"><span>Jeux de mots détectés</span><span className="text-yellow-400 font-bold">25%</span></div>
                <div className="flex justify-between mb-1"><span>Figures de style (métaphores)</span><span className="text-yellow-400 font-bold">25%</span></div>
                <div className="flex justify-between"><span>Références culturelles</span><span className="text-yellow-400 font-bold">20%</span></div>
              </div>
              <div className="flex justify-between text-sm bg-yellow-900/20 rounded-lg p-2">
                <span className="text-gray-400">Top artiste :</span>
                <span className="text-white font-bold">Gazo (45/100)</span>
              </div>
            </div>
          </div>

          {/* hookScore */}
          <div className="bg-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">
                🎤
              </div>
              <div>
                <h4 className="font-bold text-purple-400 text-lg">hookScore</h4>
                <p className="text-xs text-gray-500">{t('algorithm.hookScore')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                Mesure la <strong>répétition structurée</strong> et le potentiel
                <strong> "catchy"</strong> des refrains via analyse de patterns.
              </p>
              <div className="bg-gray-800/50 rounded-lg p-3 text-xs">
                <div className="font-semibold text-gray-400 mb-2">Composition :</div>
                <div className="flex justify-between mb-1"><span>Structure de répétition</span><span className="text-purple-400 font-bold">35%</span></div>
                <div className="flex justify-between mb-1"><span>Catchiness phonétique</span><span className="text-purple-400 font-bold">30%</span></div>
                <div className="flex justify-between mb-1"><span>Régularité rythmique</span><span className="text-purple-400 font-bold">20%</span></div>
                <div className="flex justify-between"><span>Brièveté (phrases courtes)</span><span className="text-purple-400 font-bold">15%</span></div>
              </div>
              <div className="flex justify-between text-sm bg-purple-900/20 rounded-lg p-2">
                <span className="text-gray-400">Top artiste :</span>
                <span className="text-white font-bold">Soprano (69/100)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dictionnaire Argot */}
        <div className="mt-8 bg-gray-900 border-2 border-orange-500 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🗣️</span>
            <div>
              <h3 className="font-bold text-orange-400 text-lg">{t('algorithm.slangDictionary')}</h3>
              <p className="text-xs text-gray-400">{t('algorithm.slangSubtitle')}</p>
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-4" dangerouslySetInnerHTML={{ __html: t('algorithm.slangDesc') }} />

          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <h4 className="text-sm font-bold text-orange-300 mb-2">{t('algorithm.classicVerlan')}</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">meuf</span><span>→ femme</span></div>
                <div className="flex justify-between"><span className="text-gray-400">keuf</span><span>→ flic</span></div>
                <div className="flex justify-between"><span className="text-gray-400">chelou</span><span>→ louche</span></div>
                <div className="flex justify-between"><span className="text-gray-400">ouf</span><span>→ fou</span></div>
                <div className="flex justify-between"><span className="text-gray-400">zarbi</span><span>→ bizarre</span></div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <h4 className="text-sm font-bold text-orange-300 mb-2">{t('algorithm.urbanSlang')}</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">thune</span><span>→ argent</span></div>
                <div className="flex justify-between"><span className="text-gray-400">daronne</span><span>→ mère</span></div>
                <div className="flex justify-between"><span className="text-gray-400">seum</span><span>→ rage</span></div>
                <div className="flex justify-between"><span className="text-gray-400">bendo</span><span>→ quartier</span></div>
                <div className="flex justify-between"><span className="text-gray-400">kiffer</span><span>→ aimer</span></div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <h4 className="text-sm font-bold text-orange-300 mb-2">{t('algorithm.arabicLoans')}</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">wallah</span><span>→ je jure</span></div>
                <div className="flex justify-between"><span className="text-gray-400">khouya</span><span>→ frère</span></div>
                <div className="flex justify-between"><span className="text-gray-400">hess</span><span>→ misère</span></div>
                <div className="flex justify-between"><span className="text-gray-400">miskine</span><span>→ pauvre</span></div>
                <div className="flex justify-between"><span className="text-gray-400">bled</span><span>→ pays</span></div>
              </div>
            </div>
          </div>

          <div className="bg-black/20 rounded-lg p-3 text-xs text-gray-400">
            <strong className="text-gray-300">Note :</strong> La normalisation est optionnelle pour l'analyse des rimes
            (les mots originaux sont conservés pour préserver les sonorités).
          </div>
        </div>
      </section>

      {/* Benchmarks */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-2">{t('algorithm.benchmarks')}</h2>
        <p className="text-gray-400 mb-6">{t('algorithm.benchmarksSubtitle')}</p>

        <div className="bg-white/5 rounded-2xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Auditeurs Mensuels', max: '15M', ref: 'Jul', type: 'streaming' },
              { label: 'Vues YouTube', max: '5 Milliards', ref: 'Jul', type: 'streaming' },
              { label: 'Certifications', max: '150', ref: 'Booba', type: 'streaming' },
              { label: 'Efficacité', max: '25 certifs/album', ref: 'PNL', type: 'streaming' },
              { label: 'Vocabulaire', max: '5,000 mots', ref: 'Médine', type: 'nlp' },
              { label: 'Flow Score', max: '80/100', ref: 'Soprano', type: 'nlp' },
              { label: 'Punchlines', max: '50/100', ref: 'Gazo', type: 'nlp' },
              { label: 'Refrains', max: '75/100', ref: 'Soprano', type: 'nlp' },
              { label: 'Carrière', max: '35 ans', ref: 'IAM', type: 'career' },
              { label: 'Wikipedia', max: '650 mentions', ref: 'MC Solaar', type: 'influence' },
              { label: 'Récompenses', max: '20 awards', ref: 'IAM', type: 'influence' },
              { label: 'Classiques', max: '30 titres', ref: 'Booba', type: 'excellence' },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg p-3 ${
                  item.type === 'nlp' ? 'bg-green-900/30 border border-green-500/30' :
                  item.type === 'streaming' ? 'bg-blue-900/30 border border-blue-500/30' :
                  'bg-gray-800'
                }`}
              >
                <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                <div className="text-lg font-bold text-white">{item.max}</div>
                <div className="text-[10px] text-gray-500">Ref: {item.ref}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500/50"></div>
              <span className="text-gray-400">Calculé par NLP</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/50"></div>
              <span className="text-gray-400">Données streaming</span>
            </div>
          </div>
        </div>
      </section>

      {/* Score final */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">{t('algorithm.finalScore')}</h2>
        <div className="bg-gray-900 border-4 border-purple-500 p-8">
          <div className="text-center">
            <div className="text-lg text-gray-300 mb-4">{t('algorithm.formula')}</div>
            <code className="text-xl font-mono text-white bg-gray-800 px-6 py-3 rounded-xl inline-block">
              SCORE = Somme(score_pilier × poids_pilier)
            </code>
            <div className="mt-6 grid grid-cols-4 gap-2 text-xs">
              <div className="bg-purple-500/30 rounded p-2">{t('pillars.commercial')} 20%</div>
              <div className="bg-blue-500/30 rounded p-2">{t('pillars.longevity')} 8%</div>
              <div className="bg-green-500/30 rounded p-2">{t('pillars.technique')} 12%</div>
              <div className="bg-yellow-500/30 rounded p-2">{t('pillars.quotability')} 8%</div>
              <div className="bg-red-500/30 rounded p-2">{t('pillars.influence')} 20%</div>
              <div className="bg-pink-500/30 rounded p-2">{t('pillars.vision')} 12%</div>
              <div className="bg-cyan-500/30 rounded p-2">{t('pillars.excellence')} 12%</div>
              <div className="bg-lime-500/30 rounded p-2">{t('pillars.innovation')} 8%</div>
            </div>
            <div className="mt-4 text-gray-400 text-sm">
              {t('algorithm.total')} : 20 + 8 + 12 + 8 + 20 + 12 + 12 + 8 = <strong className="text-white">100%</strong>
            </div>
          </div>
        </div>
      </section>

      {/* Transparence */}
      <section>
        <h2 className="text-2xl font-bold mb-6">{t('algorithm.limitations')}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6">
            <h3 className="font-bold text-yellow-400 mb-4">{t('algorithm.attentionPoints')}</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">!</span>
                <span>Les données commerciales sont des <strong>estimations</strong> basées sur sources publiques.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">!</span>
                <span>Certains scores (influence, innovation, vision) restent <strong>éditoriaux</strong> mais calibrés.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">!</span>
                <span>L'algorithme mesure l'<strong>impact et l'excellence</strong>, pas le "talent" brut.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">!</span>
                <span>Les paroles manquantes sur Genius peuvent affecter les scores NLP.</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
            <h3 className="font-bold text-green-400 mb-4">{t('algorithm.ourGuarantees')}</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Pas de double comptage</strong> : listeners et YouTube fusionnés en une métrique.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Métriques lyriques calculées</strong> sur 50 vraies chansons par artiste.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Artistes sélectifs non pénalisés</strong> (peu de features ou albums).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Légendes valorisées</strong> malgré moins de présence streaming.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
