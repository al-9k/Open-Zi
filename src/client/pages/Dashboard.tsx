import { useEffect, useState, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { getUserStats, type StatsResponse } from '../lib/api';
import StatCard from '../components/StatCard';
import CoverageBar from '../components/CoverageBar';
import RecommendationCard from '../components/RecommendationCard';
import QuickAddBar from '../components/QuickAddBar';

export default function Dashboard() {
  const { userId } = useUser();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const s = await getUserStats(userId);
      setStats(s);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="font-mono text-lg animate-pulse">📡 CONNECTING TO CODEX...</p>
          <div className="mt-4 w-48 h-4 border-2 border-black mx-auto overflow-hidden">
            <div className="h-full bg-[#7bc47f] animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="retro-card p-8 text-center">
        <p className="font-mono text-lg text-[#e74c3c]">⚠️ SIGNAL LOST</p>
        <p className="font-mono text-xs text-gray-600 mt-2">{error}</p>
        <button onClick={fetchStats} className="retro-btn mt-4">RETRY</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── STATS BAR ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">📟</span>
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Codex Status</h2>
          <div className="flex-1 retro-divider" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon="🀄"
            label="Chars Learned"
            value={stats?.char_count ?? 0}
            sublabel="unique characters"
          />
          <StatCard
            icon="📖"
            label="Words Unlocked"
            value={stats?.word_count ?? 0}
            sublabel="from your deck"
          />
          <StatCard
            icon="🗂️"
            label="Total Entries"
            value={stats?.dictionary_count ?? 0}
            sublabel="chars + words"
          />
          <StatCard
            icon="📊"
            label="Coverage"
            value={`${(stats?.coverage_percentage ?? 0).toFixed(1)}%`}
            sublabel="text comprehension"
          />
        </div>
      </section>

      {/* ── COVERAGE BAR ── */}
      <section>
        <CoverageBar
          percentage={stats?.coverage_percentage ?? 0}
          label="Comprehension Coverage"
        />
      </section>

      {/* ── QUICK ADD ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">📥</span>
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Quick Scan</h2>
          <div className="flex-1 retro-divider" />
        </div>
        <QuickAddBar onCharactersAdded={fetchStats} />
      </section>

      {/* ── RECOMMENDATION ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">🎯</span>
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest">Recommended Next</h2>
          <div className="flex-1 retro-divider" />
        </div>
        <RecommendationCard />
      </section>
    </div>
  );
}
