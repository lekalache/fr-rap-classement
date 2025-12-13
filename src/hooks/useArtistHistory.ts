import { useState, useMemo } from 'react';
import type {
  ArtistHistory,
  AlbumEntry,
  YearlySnapshot,
  Era,
  EvolutionDataPoint
} from '../types/history';
import { ERAS } from '../types/history';
import artistsHistoryData from '../data/artists-history.json';
import albumsTimelineData from '../data/albums-timeline.json';

// Type assertion for imported JSON
const artistsHistory = artistsHistoryData as Record<string, ArtistHistory>;
const albumsTimeline = albumsTimelineData as AlbumEntry[];

export interface UseArtistHistoryReturn {
  // Data
  artistsHistory: Record<string, ArtistHistory>;
  albumsTimeline: AlbumEntry[];

  // Queries
  getArtistHistory: (artistId: string) => ArtistHistory | undefined;
  getArtistSnapshots: (artistId: string) => YearlySnapshot[];
  getArtistAlbums: (artistId: string) => AlbumEntry[];
  getSnapshotForYear: (artistId: string, year: number) => YearlySnapshot | undefined;

  // Evolution data
  getEvolutionData: (artistIds: string[], startYear?: number, endYear?: number) => EvolutionDataPoint[];

  // Timeline queries
  getAlbumsByYear: (year: number) => AlbumEntry[];
  getAlbumsByEra: (era: Era) => AlbumEntry[];
  getLegendaryAlbums: () => AlbumEntry[];

  // Stats
  availableArtists: string[];
  yearRange: { min: number; max: number };
}

export function useArtistHistory(): UseArtistHistoryReturn {
  const [history] = useState(artistsHistory);
  const [timeline] = useState(albumsTimeline);

  // Available artists with history data
  const availableArtists = useMemo(() => Object.keys(history), [history]);

  // Year range from all snapshots
  const yearRange = useMemo(() => {
    const allYears: number[] = [];

    Object.values(history).forEach((artist) => {
      artist.snapshots.forEach((snapshot) => {
        allYears.push(snapshot.year);
      });
    });

    timeline.forEach((album) => {
      allYears.push(album.year);
    });

    return {
      min: Math.min(...allYears),
      max: Math.max(...allYears),
    };
  }, [history, timeline]);

  // Get artist history
  const getArtistHistory = (artistId: string): ArtistHistory | undefined => {
    return history[artistId];
  };

  // Get artist snapshots
  const getArtistSnapshots = (artistId: string): YearlySnapshot[] => {
    return history[artistId]?.snapshots ?? [];
  };

  // Get artist albums
  const getArtistAlbums = (artistId: string): AlbumEntry[] => {
    return timeline.filter((album) => album.artistId === artistId);
  };

  // Get snapshot for specific year (interpolates if needed)
  const getSnapshotForYear = (artistId: string, year: number): YearlySnapshot | undefined => {
    const snapshots = getArtistSnapshots(artistId);
    if (snapshots.length === 0) return undefined;

    // Exact match
    const exact = snapshots.find((s) => s.year === year);
    if (exact) return exact;

    // Find surrounding years
    const sorted = [...snapshots].sort((a, b) => a.year - b.year);
    const before = sorted.filter((s) => s.year < year).pop();
    const after = sorted.find((s) => s.year > year);

    // Return closest one or interpolate rank
    if (before && after) {
      // Linear interpolation of rank
      const ratio = (year - before.year) / (after.year - before.year);
      const interpolatedRank = Math.round(
        before.estimatedRank + (after.estimatedRank - before.estimatedRank) * ratio
      );

      return {
        year,
        estimatedRank: interpolatedRank,
        metrics: {},
        source: 'estimated',
        notes: `Interpolé entre ${before.year} et ${after.year}`,
      };
    }

    // Return closest available
    return before ?? after;
  };

  // Get evolution data for chart
  const getEvolutionData = (
    artistIds: string[],
    startYear = yearRange.min,
    endYear = yearRange.max
  ): EvolutionDataPoint[] => {
    const data: EvolutionDataPoint[] = [];

    for (let year = startYear; year <= endYear; year++) {
      const point: EvolutionDataPoint = { year };

      artistIds.forEach((artistId) => {
        const snapshot = getSnapshotForYear(artistId, year);
        if (snapshot) {
          point[artistId] = snapshot.estimatedRank;
        }
      });

      // Only include years where at least one artist has data
      if (Object.keys(point).length > 1) {
        data.push(point);
      }
    }

    return data;
  };

  // Get albums by year
  const getAlbumsByYear = (year: number): AlbumEntry[] => {
    return timeline.filter((album) => album.year === year);
  };

  // Get albums by era
  const getAlbumsByEra = (era: Era): AlbumEntry[] => {
    const eraDef = ERAS[era];
    return timeline.filter(
      (album) => album.year >= eraDef.startYear && album.year <= eraDef.endYear
    );
  };

  // Get legendary albums
  const getLegendaryAlbums = (): AlbumEntry[] => {
    return timeline.filter((album) => album.impact === 'legendary');
  };

  return {
    artistsHistory: history,
    albumsTimeline: timeline,
    getArtistHistory,
    getArtistSnapshots,
    getArtistAlbums,
    getSnapshotForYear,
    getEvolutionData,
    getAlbumsByYear,
    getAlbumsByEra,
    getLegendaryAlbums,
    availableArtists,
    yearRange,
  };
}
