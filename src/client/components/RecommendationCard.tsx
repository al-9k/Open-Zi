import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getRecommendation, type RecommendationResponse } from '../lib/api';
import TonePinyin from './TonePinyin';
import HSKBadge from './HSKBadge';

export default function RecommendationCard() {
  const { userId } = useUser();
  const navigate = useNavigate();
  const [rec, setRec] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getRecommendation(userId)
      .then((r) => { if (!cancelled) setRec(r); })
      .catch(() => { if (!cancelled) setRec(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="retro-card p-6 text-center animate-pulse">
        <p className="font-mono text-sm">Scanning for next target...</p>
      </div>
    );
  }

  if (!rec) {
    return (
      <div className="retro-card p-6 text-center">
        <p className="font-mono text-sm">No targets found. You've caught them all!</p>
      </div>
    );
  }

  return (
    <div className="retro-card p-6 relative overflow-hidden cursor-pointer group"
         onClick={() => navigate(`/entry/${encodeURIComponent(rec.character)}`)}>
      {/* Wild Encounter banner */}
      <div className="absolute top-0 left-0 right-0 bg-[#e07b7b] border-b-2 border-black py-1.5 px-4">
        <p className="font-mono text-[10px] font-bold text-black text-center tracking-widest uppercase">
          📖 Undiscovered Glyph Detected! 📖
        </p>
      </div>

      <div className="mt-8 flex gap-6 items-center">
        {/* Character display */}
        <div className="flex-shrink-0 w-28 h-28 border-4 border-black bg-[#e8dcc8] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
          <span className="text-6xl">{rec.character}</span>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          <TonePinyin pinyin={rec.pinyin} className="text-base" />
          <p className="font-mono text-[11px] text-gray-600 mt-1 leading-snug line-clamp-2">
            {rec.definition}
          </p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {rec.hsk && <HSKBadge level={rec.hsk} size="sm" />}
            {rec.char_rank && (
              <span className="font-mono text-[10px] text-gray-500">Rank #{rec.char_rank}</span>
            )}
          </div>
        </div>
      </div>

      {/* Learning value stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="retro-card p-3 text-center">
          <span className="font-mono text-2xl font-bold text-[#27ae60]">+{rec.new_words}</span>
          <p className="font-mono text-[9px] uppercase text-gray-500 mt-0.5">Words Unlocked</p>
        </div>
        <div className="retro-card p-3 text-center">
          <span className="font-mono text-2xl font-bold text-[#2980b9]">+{rec.coverage_add}%</span>
          <p className="font-mono text-[9px] uppercase text-gray-500 mt-0.5">Coverage Gain</p>
        </div>
      </div>

      {/* Catch button */}
      <div className="mt-4 text-center">
        <span className="retro-btn bg-[#7bc47f] inline-block text-base px-8 py-3 font-bold">
          ⚔️ CATCH!
        </span>
      </div>
    </div>
  );
}
