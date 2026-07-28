import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { search, addCharacters, removeCharacter } from '../lib/api';
import type { SearchResultEntry } from '../lib/api';
import { getToneNumber } from '../components/TonePinyin';
import TypeBadge from '../components/TypeBadge';
import HSKBadge from '../components/HSKBadge';

/** Returns tone class (tone-1 through tone-5) for a pinyin syllable. */
function toneClass(syllable: string): string {
  return `tone-${getToneNumber(syllable)}`;
}

interface Reading {
  pinyin: string;
  definitions: string[];
}

/** Parse pinyin (split by "; ") and definitions (split by " | ") into paired readings. */
function parseReadings(pinyin: string, definition: string): Reading[] {
  const readings = pinyin.split(';').map((s) => s.trim()).filter(Boolean);
  const defGroups = definition.split('|').map((s) => s.trim()).filter(Boolean);

  return readings.map((p, i) => ({
    pinyin: p,
    definitions: (defGroups[i] ?? defGroups[defGroups.length - 1] ?? '')
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean),
  }));
}

export default function Entry() {
  const { word } = useParams<{ word: string }>();
  const { userId } = useUser();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<SearchResultEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const isOwned = entry ? entry.priority <= 2 : false;

  useEffect(() => {
    if (!word) return;
    let cancelled = false;

    setLoading(true);
    search(userId, decodeURIComponent(word), true)
      .then((results) => {
        if (cancelled) return;
        const found = results[decodeURIComponent(word)];
        if (found) {
          setEntry(found);
        } else {
          setError('Entry not found in codex.');
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [word, userId]);

  const handleLearn = async () => {
    if (!entry) return;
    setActionLoading(true);
    try {
      await addCharacters(userId, entry.entry);
      setActionMessage(`"${entry.entry}" learned!`);
      const results = await search(userId, decodeURIComponent(word!), true);
      setEntry(results[decodeURIComponent(word!)] ?? null);
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    }
    setActionLoading(false);
    setTimeout(() => setActionMessage(''), 3000);
  };

  const handleForget = async () => {
    if (!entry) return;
    setActionLoading(true);
    try {
      await removeCharacter(userId, entry.entry);
      setActionMessage(`"${entry.entry}" forgotten.`);
      const results = await search(userId, decodeURIComponent(word!), true);
      setEntry(results[decodeURIComponent(word!)] ?? null);
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    }
    setActionLoading(false);
    setTimeout(() => setActionMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="font-mono text-lg animate-pulse">📖 LOADING ENTRY...</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="retro-card p-8 text-center">
        <p className="font-mono text-lg text-[#e74c3c]">⚠️ ENTRY NOT FOUND</p>
        <p className="font-mono text-xs text-gray-600 mt-2">{error || 'No data available.'}</p>
        <button onClick={() => navigate(-1)} className="retro-btn mt-4">GO BACK</button>
      </div>
    );
  }

  const readings = parseReadings(entry.pinyin, entry.definition);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="retro-btn text-xs">
        ← BACK
      </button>

      {/* ── MAIN CARD ── */}
      <div className="retro-card p-8">
        {/* Header: adaptive display for chars vs words */}
        {entry.entry.length === 1 ? (
          /* Single character — square frame */
          <div className="flex items-start gap-6 mb-6">
            <div className="w-32 h-32 border-4 border-black bg-[#e8dcc8] flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
              <span className="text-7xl leading-none">{entry.entry}</span>
            </div>
            <div className="flex-1 min-w-0 space-y-2 pt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <TypeBadge type={entry.type} />
                {entry.hsk && <HSKBadge level={entry.hsk} size="sm" />}
                {entry.charRank && (
                  <span className="font-mono text-[10px] text-gray-500">Rank #{entry.charRank}</span>
                )}
              </div>
              {readings.length === 1 && (
                <p className="font-mono text-lg font-bold" dangerouslySetInnerHTML={{
                  __html: readings[0]!.pinyin.split(/\s+/).map((s) =>
                    `<span class="${toneClass(s)}">${s}</span>`
                  ).join(' '),
                }} />
              )}
              <p className="font-mono text-[10px] text-gray-500 uppercase">
                {readings.length} reading{readings.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        ) : (
          /* Compound word — horizontal pill banner */
          <div className="mb-6">
            <div className="inline-flex items-center border-4 border-black bg-[#e8dcc8] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-6 py-3 mb-3">
              <span className={`font-bold leading-none whitespace-nowrap ${
                entry.entry.length <= 2 ? 'text-5xl' :
                entry.entry.length <= 3 ? 'text-4xl' :
                entry.entry.length <= 5 ? 'text-2xl' : 'text-xl'
              }`}>
                {entry.entry}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <TypeBadge type={entry.type} />
              {entry.hsk && <HSKBadge level={entry.hsk} size="sm" />}
              {entry.charRank && (
                <span className="font-mono text-[10px] text-gray-500">Rank #{entry.charRank}</span>
              )}
            </div>
            {readings.length === 1 && (
              <p className="font-mono text-lg font-bold" dangerouslySetInnerHTML={{
                __html: readings[0]!.pinyin.split(/\s+/).map((s) =>
                  `<span class="${toneClass(s)}">${s}</span>`
                ).join(' '),
              }} />
            )}
          </div>
        )}

        {/* ── READINGS ── */}
        <div className="space-y-4">
          {readings.map((reading, i) => (
            <div
              key={i}
              className="border-2 border-black bg-[#fafaf5] p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]"
            >
              {/* Pinyin row — each syllable/syllable group tone-colored */}
              <div className="font-mono text-base font-bold mb-2 flex flex-wrap gap-x-2">
                {reading.pinyin.split(/\s+/).map((syllable, j) => (
                  <span key={j} className={toneClass(syllable)}>
                    {syllable}
                  </span>
                ))}
              </div>

              {/* Definitions */}
              <ul className="space-y-1">
                {reading.definitions.map((def, j) => (
                  <li key={j} className="font-mono text-sm text-gray-700 leading-relaxed flex gap-2">
                    <span className="text-[#7bc47f] font-bold flex-shrink-0">▸</span>
                    <span>{def}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── COMPONENT CHARACTERS (compound words only) ── */}
        {entry.entry.length > 1 && (
          <div className="mt-6 pt-6 border-t-2 border-dashed border-black/30">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
              Component Characters
            </h3>
            <div className="flex flex-wrap gap-3">
              {[...entry.entry].map((char, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/entry/${encodeURIComponent(char)}`)}
                  className="retro-card-caught p-3 flex flex-col items-center gap-1 min-w-[72px]"
                >
                  <span className="text-3xl leading-none">{char}</span>
                  <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider">
                    inspect
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── ACTION ZONE ── */}
        <div className="mt-6 pt-6 border-t-2 border-black">
          <div className="flex items-center gap-4 flex-wrap">
            {isOwned ? (
              <button
                onClick={handleForget}
                disabled={actionLoading}
                className="retro-btn-danger text-base px-6 py-3 font-bold"
              >
                {actionLoading ? '...' : '📖 FORGET'}
              </button>
            ) : (
              <button
                onClick={handleLearn}
                disabled={actionLoading}
                className="retro-btn bg-[#7bc47f] text-base px-6 py-3 font-bold"
              >
                {actionLoading ? '...' : '📖 LEARN!'}
              </button>
            )}
            <span className="font-mono text-xs text-gray-500">
              {isOwned ? 'You have learned this' : 'Not yet learned'}
            </span>
          </div>
          {actionMessage && (
            <p className={`font-mono text-xs mt-3 ${actionMessage.includes('Error') ? 'text-[#e74c3c]' : 'text-[#27ae60]'}`}>
              {actionMessage}
            </p>
          )}
        </div>
      </div>

      {/* ── STATS CARD ── */}
      <div className="retro-card p-6">
        <h3 className="font-mono text-sm font-bold uppercase tracking-widest mb-4">Codex Data</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="font-mono text-[10px] text-gray-500 uppercase">Type</span>
            <p className="font-mono text-sm font-bold">{entry.type === 'c' ? 'Character' : 'Word'}</p>
          </div>
          <div>
            <span className="font-mono text-[10px] text-gray-500 uppercase">Status</span>
            <p className="font-mono text-sm font-bold">{isOwned ? '🟢 LEARNED' : '⚫ UNKNOWN'}</p>
          </div>
          <div>
            <span className="font-mono text-[10px] text-gray-500 uppercase">Frequency Rank</span>
            <p className="font-mono text-sm font-bold">{entry.frequencyRank ?? '—'}</p>
          </div>
          <div>
            <span className="font-mono text-[10px] text-gray-500 uppercase">Char Rank</span>
            <p className="font-mono text-sm font-bold">{entry.charRank ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* ── PLACEHOLDER SECTIONS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="retro-card-locked p-6 text-center">
          <span className="text-3xl block mb-2">✍️</span>
          <p className="font-mono text-xs font-bold uppercase">Stroke Order</p>
          <p className="font-mono text-[10px] text-gray-500 mt-1">Animation coming soon</p>
        </div>
        <div className="retro-card-locked p-6 text-center">
          <span className="text-3xl block mb-2">🧩</span>
          <p className="font-mono text-xs font-bold uppercase">Components</p>
          <p className="font-mono text-[10px] text-gray-500 mt-1">Breakdown coming soon</p>
        </div>
        <div className="retro-card-locked p-6 text-center">
          <span className="text-3xl block mb-2">🔊</span>
          <p className="font-mono text-xs font-bold uppercase">Pronunciation</p>
          <p className="font-mono text-[10px] text-gray-500 mt-1">Audio coming soon</p>
        </div>
        <div className="retro-card-locked p-6 text-center">
          <span className="text-3xl block mb-2">📝</span>
          <p className="font-mono text-xs font-bold uppercase">Example Sentences</p>
          <p className="font-mono text-[10px] text-gray-500 mt-1">Coming soon</p>
        </div>
      </div>
    </div>
  );
}
