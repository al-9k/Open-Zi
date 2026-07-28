import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { search, type SearchResults } from '../lib/api';
import CharacterCard from '../components/CharacterCard';

export default function Search() {
  const { userId } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<SearchResults>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const r = await search(userId, q, true);
      setResults(r);
      setHasSearched(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryParam) {
      setQuery(queryParam);
      doSearch(queryParam);
    }
  }, [queryParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  const entries = Object.values(results);

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🔎</span>
        <div>
          <h2 className="font-mono text-lg font-bold uppercase tracking-widest">Search Codex</h2>
          <p className="font-mono text-[10px] text-gray-500 uppercase">Find characters & words</p>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by character, pinyin, or definition..."
          className="retro-input flex-1 text-base"
        />
        <button type="submit" className="retro-btn-primary text-base" disabled={loading}>
          {loading ? 'SEARCHING...' : 'SEARCH'}
        </button>
      </form>

      {/* ── LOADING ── */}
      {loading && (
        <div className="text-center py-8">
          <p className="font-mono text-sm animate-pulse">🔍 SCANNING DATABASE...</p>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="retro-card p-4 text-center border-[#e74c3c]">
          <p className="font-mono text-sm text-[#e74c3c]">{error}</p>
        </div>
      )}

      {/* ── RESULTS ── */}
      {!loading && hasSearched && (
        <>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold">
              {entries.length} RESULT{entries.length !== 1 ? 'S' : ''}
            </span>
            <div className="flex-1 retro-divider" />
          </div>

          {entries.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {entries.map((entry) => (
                <CharacterCard
                  key={entry.entry}
                  entry={entry.entry}
                  pinyin={entry.pinyin}
                  definition={entry.definition}
                  hsk={entry.hsk}
                  type={entry.type}
                  isOwned={entry.priority <= 2}
                  charRank={entry.charRank}
                />
              ))}
            </div>
          ) : (
            <div className="retro-card p-12 text-center">
              <p className="font-mono text-lg text-gray-400">🔮 NO RESULTS FOUND</p>
              <p className="font-mono text-[10px] text-gray-400 mt-2">
                Try a different search term
              </p>
            </div>
          )}
        </>
      )}

      {/* ── EMPTY STATE ── */}
      {!loading && !hasSearched && (
        <div className="retro-card p-12 text-center">
          <span className="text-6xl block mb-4">🔎</span>
          <p className="font-mono text-lg">ENTER A SEARCH QUERY</p>
          <p className="font-mono text-[10px] text-gray-500 mt-2 max-w-md mx-auto">
            Search for Chinese characters, words, pinyin readings, or English definitions
            to populate your codex
          </p>
        </div>
      )}
    </div>
  );
}
