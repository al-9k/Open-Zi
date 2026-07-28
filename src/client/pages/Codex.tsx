import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getUserStats, getDictionaryPage, type StatsResponse, type DictionaryPageResponse } from '../lib/api';
import HSKBadge from '../components/HSKBadge';
import CoverageBar from '../components/CoverageBar';
import TonePinyin from '../components/TonePinyin';
import TypeBadge from '../components/TypeBadge';

const PAGE_SIZE = 250;
const HSK_TOTALS: Record<number, number> = { 1: 150, 2: 150, 3: 300, 4: 600, 5: 1300, 6: 2500 };

export default function Codex() {
  const { userId } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [dictPage, setDictPage] = useState<DictionaryPageResponse | null>(null);
  const [page, setPage] = useState(1);
  const [gridLoading, setGridLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchGrid = useCallback(async (p: number) => {
    setGridLoading(true);
    const d = await getDictionaryPage(userId, p, PAGE_SIZE);
    setDictPage(d);
    setGridLoading(false);
  }, [userId]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    const s = await getUserStats(userId);
    setStats(s);
    setStatsLoading(false);
  }, [userId]);

  useEffect(() => { fetchGrid(page); }, [fetchGrid, page]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">📚</span>
        <div>
          <h2 className="font-mono text-lg font-bold uppercase tracking-widest">Codex</h2>
          <p className="font-mono text-[10px] text-gray-500 uppercase">My Decks & Progress</p>
        </div>
      </div>

      {/* ── COVERAGE ── */}
      {statsLoading ? (
        <div className="w-full h-8 border-2 border-black bg-[#e8dcc8] animate-pulse shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]" />
      ) : (
        <CoverageBar percentage={stats?.coverage_percentage ?? 0} label="Overall Mastery" />
      )}

      {/* ── HSK GYM BADGES ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">🏅</span>
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest">HSK Gym Badges</h3>
          <div className="flex-1 retro-divider" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statsLoading
            ? [1, 2, 3, 4, 5, 6].map((level) => (
                <div key={level} className="retro-card p-5 flex flex-col items-center text-center animate-pulse">
                  <div className="w-20 h-20 border-4 border-black/30 bg-[#d4cec4] mb-3" />
                  <div className="h-5 w-20 bg-[#d4cec4] border-2 border-black/30 mb-2" />
                  <div className="w-full h-3 border-2 border-black/30 bg-[#e8dcc8]" />
                </div>
              ))
            : [1, 2, 3, 4, 5, 6].map((level) => {
                const caught = stats?.hsk_chars?.[level] ?? 0;
                const total: number = HSK_TOTALS[level] ?? 0;
                const progress = total > 0 ? (caught / total) * 100 : 0;
                const isComplete = progress >= 100;

                return (
                  <div key={level} className={`retro-card p-5 flex flex-col items-center text-center ${isComplete ? 'border-[#e8d44d]' : ''}`}>
                    <div className={`w-20 h-20 border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-3 ${isComplete ? 'bg-[#e8d44d]' : 'bg-[#d4cec4]'}`}>
                      <span className={`text-4xl ${isComplete ? '' : 'opacity-40'}`}>{isComplete ? '🏆' : '🔒'}</span>
                    </div>
                    <HSKBadge level={level} size="md" caught={caught} total={total} />
                    <div className="w-full mt-3 h-3 border-2 border-black bg-[#e8dcc8] overflow-hidden">
                      <div className={`h-full transition-all duration-500 ${isComplete ? 'bg-[#e8d44d]' : 'bg-[#7bc47f]'}`} style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                    <span className="font-mono text-[10px] text-gray-500 mt-1">{caught} / {total} characters</span>
                  </div>
                );
              })}
        </div>
      </section>

      {/* ── DICTIONARY GRID ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg">🃏</span>
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest">Dictionary Deck</h3>
          {dictPage && (
            <span className="retro-badge bg-[#7bc47f] text-[10px]">
              {dictPage.total.toLocaleString()} cards
            </span>
          )}
          <div className="flex-1 retro-divider" />
        </div>

        {/* Pagination controls */}
        {dictPage && (
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs text-gray-500">
              Page {dictPage.page} of {dictPage.totalPages}
              {' · '}
              {((dictPage.page - 1) * PAGE_SIZE + 1).toLocaleString()}–
              {Math.min(dictPage.page * PAGE_SIZE, dictPage.total).toLocaleString()}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="retro-btn text-xs disabled:opacity-30"
              >
                ← PREV
              </button>
              {Array.from({ length: Math.min(5, dictPage.totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, dictPage.totalPages - 4));
                const pn = start + i;
                if (pn > dictPage.totalPages) return null;
                return (
                  <button
                    key={pn}
                    onClick={() => setPage(pn)}
                    className={`w-8 h-8 border-2 border-black font-mono text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all ${
                      pn === page
                        ? 'bg-[#7bc47f] text-[#1b4332]'
                        : 'bg-[#e8dcc8] hover:bg-[#d4cec4]'
                    }`}
                  >
                    {pn}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(dictPage.totalPages, p + 1))}
                disabled={page >= dictPage.totalPages}
                className="retro-btn text-xs disabled:opacity-30"
              >
                NEXT →
              </button>
            </div>
          </div>
        )}

        {/* Card grid */}
        {gridLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="retro-card-locked p-3 flex flex-col gap-1.5 animate-pulse">
                <div className="h-7 w-12 bg-[#d4cec4]" />
                <div className="h-3 w-16 bg-[#d4cec4]" />
                <div className="h-3 w-full bg-[#d4cec4]" />
                <div className="h-3 w-3/4 bg-[#d4cec4]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {dictPage?.entries.map((entry) => (
              <div
                key={entry.entry}
                onClick={() => navigate(`/entry/${encodeURIComponent(entry.entry)}`)}
                className={`dict-grid-card p-3 flex flex-col gap-1.5 cursor-pointer transition-all border-4 ${
                  entry.isOwned
                    ? 'retro-card-caught'
                    : 'retro-card-locked'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`leading-none font-bold ${
                    entry.entry.length <= 1 ? 'text-2xl' :
                    entry.entry.length <= 2 ? 'text-xl' :
                    entry.entry.length <= 3 ? 'text-base' : 'text-sm'
                  }`}>
                    {entry.entry}
                  </span>
                  <TypeBadge type={entry.type} />
                </div>

                {entry.isOwned ? (
                  <TonePinyin pinyin={entry.pinyin} className="text-[10px]" />
                ) : (
                  <span className="font-mono text-[10px] text-gray-400">???</span>
                )}

                <p className={`text-[10px] leading-tight line-clamp-2 ${entry.isOwned ? 'text-gray-600' : 'text-gray-400'}`}>
                  {entry.isOwned ? entry.definition.replace(/\|/g, ' · ') : 'Learn to reveal definition'}
                </p>

                <div className="flex items-center gap-1 mt-auto pt-1">
                  {entry.hsk && <HSKBadge level={entry.hsk} size="sm" />}
                  {entry.isOwned && (
                    <span className="font-mono text-[9px] text-[#7bc47f] font-bold ml-auto">OWNED</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {dictPage && dictPage.totalPages > 1 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setPage((p) => Math.min(dictPage.totalPages, p + 1))}
              disabled={page >= dictPage.totalPages}
              className="retro-btn bg-[#7bc47f] text-base disabled:opacity-30"
            >
              LOAD MORE
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
