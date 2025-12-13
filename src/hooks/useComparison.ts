import { create } from 'zustand';
import type { Artist, Comparison } from '../types';
import { compareArtists } from '../services/scoring';
import artistsData from '../data/artists.json';

interface ComparisonState {
  artists: Artist[];
  artist1: Artist | null;
  artist2: Artist | null;
  comparison: Comparison | null;
  setArtist1: (artist: Artist | null) => void;
  setArtist2: (artist: Artist | null) => void;
  compare: () => void;
  reset: () => void;
}

export const useComparison = create<ComparisonState>((set, get) => ({
  artists: artistsData as Artist[],
  artist1: null,
  artist2: null,
  comparison: null,

  setArtist1: (artist) => {
    set({ artist1: artist, comparison: null });
  },

  setArtist2: (artist) => {
    set({ artist2: artist, comparison: null });
  },

  compare: () => {
    const { artist1, artist2 } = get();
    if (artist1 && artist2) {
      const comparison = compareArtists(artist1, artist2);
      set({ comparison });
    }
  },

  reset: () => {
    set({ artist1: null, artist2: null, comparison: null });
  },
}));
