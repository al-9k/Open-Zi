import { useNavigate } from 'react-router-dom';
import TonePinyin from './TonePinyin';
import TypeBadge from './TypeBadge';
import HSKBadge from './HSKBadge';

interface CharacterCardProps {
  entry: string;
  pinyin: string;
  definition: string;
  hsk: number | null;
  type: 'c' | 'w';
  isOwned: boolean;
  charRank?: number | null;
}

export default function CharacterCard({
  entry, pinyin, definition, hsk, type, isOwned, charRank,
}: CharacterCardProps) {
  const navigate = useNavigate();
  const cardClass = isOwned ? 'retro-card-caught' : 'retro-card-locked';

  const handleClick = () => {
    navigate(`/entry/${encodeURIComponent(entry)}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`${cardClass} p-3 flex flex-col gap-2 min-w-[160px] max-w-[200px]`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <span className="text-3xl leading-none">{entry}</span>
        {!isOwned && (
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">???</span>
        )}
      </div>

      {/* Pinyin */}
      {isOwned && (
        <TonePinyin pinyin={pinyin} className="text-xs" />
      )}

      {/* Definition */}
      <p className={`text-[11px] leading-tight ${isOwned ? 'text-gray-700' : 'text-gray-400'}`}>
        {isOwned ? definition : 'Encounter this character to reveal...'}
      </p>

      {/* Badge row */}
      <div className="flex items-center gap-1.5 mt-auto pt-1 flex-wrap">
        <TypeBadge type={type} />
        {hsk && <HSKBadge level={hsk} size="sm" />}
        {charRank && isOwned && (
          <span className="font-mono text-[10px] text-gray-500">#{charRank}</span>
        )}
      </div>

      {/* Action indicator */}
      <div className="w-full text-center mt-1">
        <span className={`retro-btn text-[10px] py-1 px-3 inline-block ${isOwned ? 'bg-[#c47b7b]' : 'bg-[#7bc47f]'}`}>
          {isOwned ? 'FORGET' : 'LEARN!'}
        </span>
      </div>
    </div>
  );
}
