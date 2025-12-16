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
      ring: 'focus:border-yellow-400',
      bg: 'bg-purple-600',
      hover: 'hover:bg-gray-700',
    },
    blue: {
      ring: 'focus:border-yellow-400',
      bg: 'bg-blue-600',
      hover: 'hover:bg-gray-700',
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
          className={`flex items-center gap-3 p-4 bg-gray-900 border-2 border-gray-600 cursor-pointer ${colorClasses[color].hover}`}
          onClick={() => {
            onSelect(null as unknown as Artist);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <div className={`w-12 h-12 ${colorClasses[color].bg} border-2 border-white flex items-center justify-center text-xl font-black`}>
            {selectedArtist.name.charAt(0)}
          </div>
          <div>
            <div className="font-black text-lg uppercase">{selectedArtist.name}</div>
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
            className={`w-full p-4 bg-gray-900 border-2 border-gray-600 outline-none ${colorClasses[color].ring} transition-all placeholder:text-gray-500 font-bold`}
          />
          {isOpen && filtered.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-10 w-full mt-2 bg-gray-900 border-2 border-gray-600 max-h-72 overflow-y-auto"
            >
              {filtered.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => handleSelect(artist)}
                  className={`w-full flex items-center gap-3 p-3 border-b border-gray-700 ${colorClasses[color].hover} transition-colors text-left`}
                >
                  <div className={`w-10 h-10 ${colorClasses[color].bg} border-2 border-white flex items-center justify-center font-black`}>
                    {artist.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold">{artist.name}</div>
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
