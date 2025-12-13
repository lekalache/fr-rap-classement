import { useState, useRef, useEffect } from 'react';
import type { Artist } from '../types';

interface Props {
  artists: Artist[];
  selectedArtist: Artist | null;
  onSelect: (artist: Artist) => void;
  placeholder: string;
  color: 'purple' | 'blue';
}

export function SearchBar({ artists, selectedArtist, onSelect, placeholder, color }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = artists.filter((artist) =>
    artist.name.toLowerCase().includes(query.toLowerCase())
  );

  const colorClasses = {
    purple: {
      ring: 'focus:ring-purple-500',
      bg: 'bg-purple-500',
      hover: 'hover:bg-purple-500/20',
    },
    blue: {
      ring: 'focus:ring-blue-500',
      bg: 'bg-blue-500',
      hover: 'hover:bg-blue-500/20',
    },
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (artist: Artist) => {
    onSelect(artist);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {selectedArtist ? (
        <div
          className={`flex items-center gap-3 p-4 bg-white/10 rounded-xl cursor-pointer ${colorClasses[color].hover}`}
          onClick={() => {
            onSelect(null as unknown as Artist);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <div className={`w-12 h-12 rounded-full ${colorClasses[color].bg} flex items-center justify-center text-xl font-bold`}>
            {selectedArtist.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-lg">{selectedArtist.name}</div>
            <div className="text-sm text-gray-400">Depuis {selectedArtist.debutYear}</div>
          </div>
          <button className="ml-auto text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`w-full p-4 bg-white/10 rounded-xl outline-none ring-2 ring-transparent ${colorClasses[color].ring} transition-all placeholder:text-gray-500`}
          />
          {isOpen && filtered.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-10 w-full mt-2 bg-gray-800 rounded-xl shadow-xl overflow-hidden"
            >
              {filtered.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => handleSelect(artist)}
                  className={`w-full flex items-center gap-3 p-3 ${colorClasses[color].hover} transition-colors text-left`}
                >
                  <div className={`w-10 h-10 rounded-full ${colorClasses[color].bg} flex items-center justify-center font-bold`}>
                    {artist.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold">{artist.name}</div>
                    <div className="text-xs text-gray-400">Depuis {artist.debutYear}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
