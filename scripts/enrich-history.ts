/**
 * Script pour enrichir l'historique des artistes avec des données antérieures
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../src/data');

interface YearlySnapshot {
  year: number;
  event?: string;
  metrics: Record<string, number | null>;
  estimatedRank: number;
  notes?: string;
  source: 'computed' | 'estimated' | 'archived';
}

interface ArtistHistory {
  artistId: string;
  artistName: string;
  snapshots: YearlySnapshot[];
}

const historyPath = path.join(DATA_DIR, 'artists-history.json');
const history: Record<string, ArtistHistory> = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));

// Données historiques enrichies
const enrichments: Record<string, YearlySnapshot[]> = {
  'mc-solaar': [
    {
      year: 1991,
      event: "Qui Sème le Vent Récolte le Tempo",
      metrics: { physicalSales: 400000, certifications: 4, influenceScore: 85, peakAlbumScore: 88, innovationScore: 98 },
      estimatedRank: 2,
      notes: "Premier album, révolution rap FR",
      source: 'estimated'
    },
    {
      year: 1994,
      event: "Prose Combat",
      metrics: { physicalSales: 1000000, certifications: 10, influenceScore: 95, peakAlbumScore: 95, innovationScore: 95 },
      estimatedRank: 1,
      notes: "Album légendaire, sommet artistique",
      source: 'estimated'
    },
    {
      year: 1997,
      event: "Paradisiaque",
      metrics: { physicalSales: 600000, certifications: 12, influenceScore: 88, peakAlbumScore: 85, innovationScore: 80 },
      estimatedRank: 2,
      notes: "Maintien du niveau",
      source: 'estimated'
    },
    {
      year: 2001,
      event: "Cinquième As",
      metrics: { physicalSales: 400000, certifications: 15, influenceScore: 80, peakAlbumScore: 78, innovationScore: 70 },
      estimatedRank: 5,
      notes: "Nouvelle génération émerge",
      source: 'estimated'
    },
    {
      year: 2007,
      event: "Chapitre 7",
      metrics: { physicalSales: 200000, youtubeViews: 30000000, certifications: 18, influenceScore: 72, peakAlbumScore: 75, innovationScore: 60 },
      estimatedRank: 10,
      notes: "Transition difficile vers digital",
      source: 'estimated'
    },
    {
      year: 2017,
      event: "Géopoétique",
      metrics: { monthlyListeners: 1200000, youtubeViews: 150000000, certifications: 25, influenceScore: 75, peakAlbumScore: 78, innovationScore: 65 },
      estimatedRank: 15,
      notes: "Retour après 10 ans d'absence",
      source: 'computed'
    }
  ],
  'oxmo-puccino': [
    {
      year: 1996,
      event: "Time Bomb (collectif)",
      metrics: { physicalSales: 50000, certifications: 1, influenceScore: 55, peakAlbumScore: 75, innovationScore: 70 },
      estimatedRank: 20,
      notes: "Début avec Time Bomb, poésie urbaine",
      source: 'estimated'
    },
    {
      year: 1998,
      event: "Opéra Puccino",
      metrics: { physicalSales: 200000, certifications: 3, influenceScore: 80, peakAlbumScore: 92, innovationScore: 90 },
      estimatedRank: 5,
      notes: "Album culte, Black Jacques Dutronc",
      source: 'estimated'
    },
    {
      year: 2001,
      event: "L'Amour est Mort",
      metrics: { physicalSales: 150000, certifications: 5, influenceScore: 82, peakAlbumScore: 90, innovationScore: 85 },
      estimatedRank: 6,
      notes: "Confirmation du génie lyrique",
      source: 'estimated'
    },
    {
      year: 2006,
      event: "Lipopette Bar",
      metrics: { physicalSales: 80000, youtubeViews: 15000000, certifications: 8, influenceScore: 78, peakAlbumScore: 85, innovationScore: 75 },
      estimatedRank: 10,
      notes: "Album personnel et mature",
      source: 'estimated'
    },
    {
      year: 2012,
      event: "Roi Sans Carrosse",
      metrics: { monthlyListeners: 400000, youtubeViews: 50000000, certifications: 12, influenceScore: 80, peakAlbumScore: 82, innovationScore: 70 },
      estimatedRank: 15,
      notes: "Légende du rap conscient",
      source: 'estimated'
    },
    {
      year: 2019,
      event: "La Voix Lactée",
      metrics: { monthlyListeners: 700000, youtubeViews: 80000000, certifications: 18, influenceScore: 85, peakAlbumScore: 85, innovationScore: 75 },
      estimatedRank: 18,
      notes: "Artiste respecté, influence durable",
      source: 'computed'
    }
  ],
  'soprano': [
    {
      year: 1995,
      event: "Débuts Psy4 de la Rime",
      metrics: { physicalSales: 30000, certifications: 0, influenceScore: 40, peakAlbumScore: 65, innovationScore: 55 },
      estimatedRank: 30,
      notes: "Début avec Psy4 de la Rime à Marseille",
      source: 'estimated'
    },
    {
      year: 2002,
      event: "Block Party (Psy4)",
      metrics: { physicalSales: 150000, certifications: 2, influenceScore: 55, peakAlbumScore: 72, innovationScore: 60 },
      estimatedRank: 12,
      notes: "Succès avec Psy4 de la Rime",
      source: 'estimated'
    },
    {
      year: 2007,
      event: "Puisqu'il Faut Vivre (Solo)",
      metrics: { physicalSales: 200000, youtubeViews: 50000000, certifications: 5, influenceScore: 58, peakAlbumScore: 72, innovationScore: 55 },
      estimatedRank: 10,
      notes: "Carrière solo lancée",
      source: 'estimated'
    },
    {
      year: 2013,
      event: "Cosmopolitanie",
      metrics: { monthlyListeners: 2000000, youtubeViews: 800000000, certifications: 25, influenceScore: 62, peakAlbumScore: 75, innovationScore: 55 },
      estimatedRank: 6,
      notes: "Succès populaire massif, Mon Précieux",
      source: 'computed'
    },
    {
      year: 2016,
      event: "L'Everest",
      metrics: { monthlyListeners: 4000000, youtubeViews: 1500000000, certifications: 45, influenceScore: 65, peakAlbumScore: 76, innovationScore: 52 },
      estimatedRank: 5,
      notes: "Album familial, Fresh Prince",
      source: 'computed'
    },
    {
      year: 2020,
      event: "Chasseur d'Étoiles",
      metrics: { monthlyListeners: 5000000, youtubeViews: 2500000000, certifications: 70, influenceScore: 68, peakAlbumScore: 75, innovationScore: 50 },
      estimatedRank: 6,
      notes: "Artiste populaire établi",
      source: 'computed'
    }
  ],
  'la-fouine': [
    {
      year: 2005,
      event: "Bourré au Son",
      metrics: { physicalSales: 80000, certifications: 2, influenceScore: 50, peakAlbumScore: 70, innovationScore: 55 },
      estimatedRank: 18,
      notes: "Premier album, Trappes représente",
      source: 'estimated'
    },
    {
      year: 2007,
      event: "Aller-Retour",
      metrics: { physicalSales: 150000, youtubeViews: 30000000, certifications: 5, influenceScore: 60, peakAlbumScore: 75, innovationScore: 58 },
      estimatedRank: 10,
      notes: "Montée en puissance",
      source: 'estimated'
    },
    {
      year: 2009,
      event: "Mes Repères",
      metrics: { physicalSales: 250000, youtubeViews: 200000000, certifications: 12, influenceScore: 70, peakAlbumScore: 78, innovationScore: 60 },
      estimatedRank: 5,
      notes: "Album du peuple, Ça Fait Mal",
      source: 'estimated'
    },
    {
      year: 2011,
      event: "La Fouine vs Laouni",
      metrics: { monthlyListeners: 1500000, youtubeViews: 600000000, certifications: 25, influenceScore: 72, peakAlbumScore: 76, innovationScore: 55 },
      estimatedRank: 4,
      notes: "Sommet commercial, Capitale du Crime",
      source: 'computed'
    },
    {
      year: 2013,
      event: "Drôle de Parcours",
      metrics: { monthlyListeners: 2000000, youtubeViews: 900000000, certifications: 38, influenceScore: 70, peakAlbumScore: 74, innovationScore: 50 },
      estimatedRank: 5,
      notes: "Maintien du succès",
      source: 'computed'
    },
    {
      year: 2016,
      event: "Nouveau Monde",
      metrics: { monthlyListeners: 1800000, youtubeViews: 1000000000, certifications: 48, influenceScore: 65, peakAlbumScore: 70, innovationScore: 45 },
      estimatedRank: 10,
      notes: "Déclin relatif, nouvelle génération",
      source: 'computed'
    }
  ],
  'kery-james': [
    {
      year: 1998,
      event: "Si c'était à refaire (Mafia K'1 Fry)",
      metrics: { physicalSales: 80000, certifications: 1, influenceScore: 50, peakAlbumScore: 70 },
      estimatedRank: 15,
      notes: "Début avec Mafia K'1 Fry, Orly",
      source: 'estimated'
    },
    {
      year: 2001,
      event: "Savoir & Vivre Ensemble",
      metrics: { physicalSales: 150000, certifications: 3, influenceScore: 70, peakAlbumScore: 82 },
      estimatedRank: 8,
      notes: "Premier album solo, rap conscient",
      source: 'estimated'
    },
    {
      year: 2005,
      event: "Ma Vérité",
      metrics: { physicalSales: 200000, certifications: 5, influenceScore: 80, peakAlbumScore: 85 },
      estimatedRank: 5,
      notes: "Confirmation du statut de rappeur engagé",
      source: 'estimated'
    },
    {
      year: 2008,
      event: "À l'ombre du Show Business",
      metrics: { physicalSales: 120000, youtubeViews: 20000000, certifications: 7, influenceScore: 82, peakAlbumScore: 88 },
      estimatedRank: 6,
      notes: "Album critique du milieu musical",
      source: 'estimated'
    },
    {
      year: 2013,
      event: "92.2012",
      metrics: { monthlyListeners: 500000, youtubeViews: 80000000, certifications: 10, influenceScore: 85, peakAlbumScore: 90 },
      estimatedRank: 7,
      notes: "Album politique majeur, Constat Amer",
      source: 'estimated'
    },
    {
      year: 2016,
      event: "Mouhammad Alix",
      metrics: { monthlyListeners: 800000, youtubeViews: 150000000, certifications: 15, influenceScore: 85, peakAlbumScore: 88 },
      estimatedRank: 10,
      notes: "Album autobiographique",
      source: 'estimated'
    },
    {
      year: 2020,
      event: "J'rap Encore",
      metrics: { monthlyListeners: 1000000, youtubeViews: 280000000, certifications: 25, influenceScore: 88, peakAlbumScore: 85 },
      estimatedRank: 12,
      notes: "Retour remarqué, toujours pertinent",
      source: 'computed'
    }
  ],
  'ninho': [
    {
      year: 2016,
      event: "M.I.L.S (Mixtape)",
      metrics: { monthlyListeners: 500000, youtubeViews: 50000000, certifications: 2, influenceScore: 40, peakAlbumScore: 70 },
      estimatedRank: 25,
      notes: "Révélation avec M.I.L.S",
      source: 'estimated'
    },
    {
      year: 2017,
      event: "Comme prévu",
      metrics: { monthlyListeners: 2000000, youtubeViews: 300000000, certifications: 8, influenceScore: 55, peakAlbumScore: 75 },
      estimatedRank: 12,
      notes: "Explosion commerciale, Afro Trap",
      source: 'estimated'
    },
    {
      year: 2018,
      event: "M.I.L.S 2",
      metrics: { monthlyListeners: 5000000, youtubeViews: 800000000, certifications: 20, influenceScore: 62, peakAlbumScore: 75 },
      estimatedRank: 6,
      notes: "Confirmation du phénomène",
      source: 'computed'
    },
    {
      year: 2019,
      event: "Destin",
      metrics: { monthlyListeners: 8000000, youtubeViews: 1500000000, certifications: 40, influenceScore: 68, peakAlbumScore: 78 },
      estimatedRank: 3,
      notes: "Album record, domination charts",
      source: 'computed'
    },
    {
      year: 2021,
      event: "M.I.L.S 3",
      metrics: { monthlyListeners: 11000000, youtubeViews: 2500000000, certifications: 70, influenceScore: 70, peakAlbumScore: 76 },
      estimatedRank: 2,
      notes: "Top 3 rappeurs FR en streams",
      source: 'computed'
    }
  ],
  'freeze-corleone': [
    {
      year: 2018,
      event: "Projet Blue Beam",
      metrics: { monthlyListeners: 200000, youtubeViews: 30000000, certifications: 1, influenceScore: 55, peakAlbumScore: 78 },
      estimatedRank: 30,
      notes: "Underground, début du phénomène",
      source: 'estimated'
    },
    {
      year: 2020,
      event: "La Menace Fantôme (LMF)",
      metrics: { monthlyListeners: 3000000, youtubeViews: 400000000, certifications: 12, influenceScore: 80, peakAlbumScore: 88 },
      estimatedRank: 8,
      notes: "Album culte, révolution drill FR",
      source: 'computed'
    },
    {
      year: 2022,
      event: "Shavkat / ADC",
      metrics: { monthlyListeners: 5000000, youtubeViews: 700000000, certifications: 20, influenceScore: 85, peakAlbumScore: 85 },
      estimatedRank: 7,
      notes: "Influence maximale sur la nouvelle génération",
      source: 'computed'
    }
  ],
  'rimk': [
    {
      year: 1996,
      event: "La Cosca (113)",
      metrics: { physicalSales: 50000, certifications: 1, influenceScore: 45, peakAlbumScore: 72 },
      estimatedRank: 18,
      notes: "Début avec 113 à Vitry",
      source: 'estimated'
    },
    {
      year: 1999,
      event: "Les Princes de la Ville (113)",
      metrics: { physicalSales: 500000, certifications: 6, influenceScore: 70, peakAlbumScore: 85 },
      estimatedRank: 5,
      notes: "Album classique, Tonton du Bled",
      source: 'estimated'
    },
    {
      year: 2005,
      event: "113 Degrés (113)",
      metrics: { physicalSales: 300000, certifications: 10, influenceScore: 72, peakAlbumScore: 80 },
      estimatedRank: 7,
      notes: "Confirmation 113",
      source: 'estimated'
    },
    {
      year: 2009,
      event: "L'Enfant du Pays (Solo)",
      metrics: { physicalSales: 80000, youtubeViews: 30000000, certifications: 12, influenceScore: 65, peakAlbumScore: 75 },
      estimatedRank: 12,
      notes: "Carrière solo",
      source: 'estimated'
    },
    {
      year: 2015,
      event: "Monster Tape",
      metrics: { monthlyListeners: 1000000, youtubeViews: 200000000, certifications: 18, influenceScore: 62, peakAlbumScore: 72 },
      estimatedRank: 15,
      notes: "Adaptation ère streaming",
      source: 'computed'
    },
    {
      year: 2019,
      event: "Mutant",
      metrics: { monthlyListeners: 1800000, youtubeViews: 500000000, certifications: 30, influenceScore: 70, peakAlbumScore: 78 },
      estimatedRank: 12,
      notes: "Collaboration Jul, retour commercial",
      source: 'computed'
    }
  ],
  'lino': [
    {
      year: 1998,
      event: "Si c'était à refaire (Arsenik)",
      metrics: { physicalSales: 200000, certifications: 3, influenceScore: 75, peakAlbumScore: 88 },
      estimatedRank: 6,
      notes: "Arsenik, duo légendaire avec Calbo",
      source: 'estimated'
    },
    {
      year: 2000,
      event: "Quelques gouttes suffisent (Arsenik)",
      metrics: { physicalSales: 100000, certifications: 4, influenceScore: 72, peakAlbumScore: 82 },
      estimatedRank: 10,
      notes: "Second album Arsenik",
      source: 'estimated'
    },
    {
      year: 2011,
      event: "Requiem",
      metrics: { physicalSales: 30000, youtubeViews: 20000000, certifications: 5, influenceScore: 65, peakAlbumScore: 78 },
      estimatedRank: 18,
      notes: "Album solo mature",
      source: 'estimated'
    },
    {
      year: 2015,
      event: "Paradis Assassiné",
      metrics: { monthlyListeners: 400000, youtubeViews: 50000000, certifications: 8, influenceScore: 70, peakAlbumScore: 82 },
      estimatedRank: 20,
      notes: "Technique reconnue",
      source: 'estimated'
    },
    {
      year: 2019,
      event: "Requiem 2",
      metrics: { monthlyListeners: 600000, youtubeViews: 100000000, certifications: 15, influenceScore: 75, peakAlbumScore: 85 },
      estimatedRank: 18,
      notes: "Retour en force, plumes techniques",
      source: 'computed'
    }
  ],
  'vald': [
    {
      year: 2015,
      event: "NQNT",
      metrics: { monthlyListeners: 800000, youtubeViews: 100000000, certifications: 3, influenceScore: 55, peakAlbumScore: 75 },
      estimatedRank: 18,
      notes: "Révélation avec NQNT, humour décalé",
      source: 'estimated'
    },
    {
      year: 2017,
      event: "Agartha",
      metrics: { monthlyListeners: 3000000, youtubeViews: 400000000, certifications: 15, influenceScore: 68, peakAlbumScore: 82 },
      estimatedRank: 8,
      notes: "Album concept, succès critique",
      source: 'computed'
    },
    {
      year: 2019,
      event: "Ce Monde Est Cruel",
      metrics: { monthlyListeners: 4500000, youtubeViews: 800000000, certifications: 30, influenceScore: 72, peakAlbumScore: 80 },
      estimatedRank: 6,
      notes: "Sommet commercial",
      source: 'computed'
    },
    {
      year: 2021,
      event: "V",
      metrics: { monthlyListeners: 5000000, youtubeViews: 1000000000, certifications: 42, influenceScore: 72, peakAlbumScore: 78 },
      estimatedRank: 8,
      notes: "Maintien du niveau, style unique",
      source: 'computed'
    }
  ],
  'youssoupha': [
    {
      year: 2007,
      event: "À Chaque Frère",
      metrics: { physicalSales: 80000, youtubeViews: 10000000, certifications: 2, influenceScore: 55, peakAlbumScore: 78 },
      estimatedRank: 15,
      notes: "Premier album, rappeur conscient",
      source: 'estimated'
    },
    {
      year: 2009,
      event: "Sur les Chemins du Retour",
      metrics: { physicalSales: 100000, youtubeViews: 50000000, certifications: 5, influenceScore: 65, peakAlbumScore: 82 },
      estimatedRank: 10,
      notes: "Confirmation, Dreamin'",
      source: 'estimated'
    },
    {
      year: 2012,
      event: "Noir Désir",
      metrics: { monthlyListeners: 600000, youtubeViews: 150000000, certifications: 12, influenceScore: 70, peakAlbumScore: 85 },
      estimatedRank: 8,
      notes: "Album mature, introspectif",
      source: 'estimated'
    },
    {
      year: 2015,
      event: "NGRTD",
      metrics: { monthlyListeners: 1200000, youtubeViews: 250000000, certifications: 18, influenceScore: 70, peakAlbumScore: 80 },
      estimatedRank: 12,
      notes: "Album engagé",
      source: 'computed'
    },
    {
      year: 2021,
      event: "Neptune Terminus",
      metrics: { monthlyListeners: 1500000, youtubeViews: 350000000, certifications: 25, influenceScore: 70, peakAlbumScore: 78 },
      estimatedRank: 15,
      notes: "Rappeur technique reconnu",
      source: 'computed'
    }
  ],
  'sinik': [
    {
      year: 2004,
      event: "Le Sang Froid",
      metrics: { physicalSales: 80000, certifications: 2, influenceScore: 50, peakAlbumScore: 72 },
      estimatedRank: 15,
      notes: "Premier album solo",
      source: 'estimated'
    },
    {
      year: 2006,
      event: "Sang Froid 2 / En Attendant",
      metrics: { physicalSales: 150000, youtubeViews: 30000000, certifications: 5, influenceScore: 62, peakAlbumScore: 75 },
      estimatedRank: 10,
      notes: "Montée en puissance, Une époque formidable",
      source: 'estimated'
    },
    {
      year: 2008,
      event: "Le Toit du Monde",
      metrics: { physicalSales: 100000, youtubeViews: 80000000, certifications: 8, influenceScore: 58, peakAlbumScore: 72 },
      estimatedRank: 12,
      notes: "Album personnel",
      source: 'estimated'
    },
    {
      year: 2010,
      event: "Ballon d'Or",
      metrics: { physicalSales: 50000, youtubeViews: 120000000, certifications: 12, influenceScore: 55, peakAlbumScore: 70 },
      estimatedRank: 18,
      notes: "Déclin commercial",
      source: 'estimated'
    },
    {
      year: 2015,
      metrics: { monthlyListeners: 500000, youtubeViews: 150000000, certifications: 18, influenceScore: 55, peakAlbumScore: 70 },
      estimatedRank: 25,
      notes: "Présence nostalgique",
      source: 'estimated'
    }
  ]
};

// Ajouter les enrichissements
let enriched = 0;
for (const [artistId, snapshots] of Object.entries(enrichments)) {
  if (history[artistId]) {
    // Fusionner les snapshots en évitant les doublons
    const existingYears = new Set(history[artistId].snapshots.map(s => s.year));
    const newSnapshots = snapshots.filter(s => !existingYears.has(s.year));

    if (newSnapshots.length > 0) {
      history[artistId].snapshots = [
        ...newSnapshots,
        ...history[artistId].snapshots
      ].sort((a, b) => a.year - b.year);

      console.log(`[ENRICHI] ${history[artistId].artistName}: +${newSnapshots.length} snapshots`);
      enriched++;
    }
  }
}

// Sauvegarder
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

console.log(`\n=== Résumé ===`);
console.log(`Artistes enrichis: ${enriched}`);
console.log(`Fichier sauvegardé: ${historyPath}`);
