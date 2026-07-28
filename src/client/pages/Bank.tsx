import { useEffect, useState, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { getUserStats, removeCharacter, type StatsResponse } from '../lib/api';
import CharacterCard from '../components/CharacterCard';
import QuickAddBar from '../components/QuickAddBar';

export default function Bank() {
  const { userId } = useUser();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState('');
  const [removeStatus, setRemoveStatus] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const s = await getUserStats(userId);
    setStats(s);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const allChars = stats
    ? Object.values(stats.char_timeline).flat().filter((c, i, a) => a.indexOf(c) === i)
    : [];

  const handleRemove = async () => {
    if (!removeTarget.trim()) return;
    try {
      await removeCharacter(userId, removeTarget.trim());
      setRemoveStatus(`Forgotten "${removeTarget.trim()}"`);
      setRemoveTarget('');
      fetchStats();
    } catch (err: any) {
      setRemoveStatus(`Error: ${err.message}`);
    }
    setTimeout(() => setRemoveStatus(''), 3000);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="font-mono text-lg animate-pulse">🏦 ACCESSING VAULT...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏦</span>
        <div>
          <h2 className="font-mono text-lg font-bold uppercase tracking-widest">Personal Bank</h2>
          <p className="font-mono text-[10px] text-gray-500 uppercase">
            Manage Your Character Deck
          </p>
        </div>
      </div>

      {/* ── VAULT STATS ── */}
      <div className="retro-card p-4 flex flex-wrap items-center gap-6">
        <div className="text-center">
          <span className="font-mono text-3xl font-bold">{allChars.length}</span>
          <p className="font-mono text-[10px] text-gray-500 uppercase">Characters</p>
        </div>
        <div className="text-center">
          <span className="font-mono text-3xl font-bold">{stats?.word_count ?? 0}</span>
          <p className="font-mono text-[10px] text-gray-500 uppercase">Words</p>
        </div>
        <div className="text-center">
          <span className="font-mono text-3xl font-bold">{stats?.dictionary_count ?? 0}</span>
          <p className="font-mono text-[10px] text-gray-500 uppercase">Total Deck</p>
        </div>
      </div>

      {/* ── QUICK ADD ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">📥</span>
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Add to Bank</h3>
          <div className="flex-1 retro-divider" />
        </div>
        <QuickAddBar onCharactersAdded={fetchStats} />
      </section>

      {/* ── REMOVE ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">📖</span>
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Forget Character</h3>
          <div className="flex-1 retro-divider" />
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={removeTarget}
            onChange={(e) => setRemoveTarget(e.target.value)}
            placeholder="Enter character to forget..."
            className="retro-input max-w-[200px]"
            maxLength={1}
          />
          <button onClick={handleRemove} className="retro-btn-danger">
            FORGET
          </button>
        </div>
        {removeStatus && (
          <p className="font-mono text-[10px] text-[#e74c3c] mt-2">{removeStatus}</p>
        )}
      </section>

      {/* ── CHARACTER GRID ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">🃏</span>
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Your Collection</h3>
          <span className="retro-badge bg-[#e8dcc8] text-[10px]">{allChars.length} cards</span>
          <div className="flex-1 retro-divider" />
        </div>
        {allChars.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allChars.map((char) => (
              <CharacterCard
                key={char}
                entry={char}
                pinyin=""
                definition=""
                hsk={null}
                type="c"
                isOwned={true}
              />
            ))}
          </div>
        ) : (
          <div className="retro-card p-12 text-center">
            <p className="font-mono text-lg text-gray-400">🏜️ YOUR VAULT IS EMPTY</p>
            <p className="font-mono text-[10px] text-gray-400 mt-2">
              Scan some Chinese text above to start building your deck!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
