export function getToneNumber(pinyin: string): number {
  const toneMap: Record<string, number> = {
    ā: 1, á: 2, ǎ: 3, à: 4,
    ē: 1, é: 2, ě: 3, è: 4,
    ī: 1, í: 2, ǐ: 3, ì: 4,
    ō: 1, ó: 2, ǒ: 3, ò: 4,
    ū: 1, ú: 2, ǔ: 3, ù: 4,
    ǖ: 1, ǘ: 2, ǚ: 3, ǜ: 4,
  };
  for (const char of pinyin) {
    if (toneMap[char]) return toneMap[char];
  }
  return 5;
}

interface TonePinyinProps {
  pinyin: string;
  className?: string;
}

export default function TonePinyin({ pinyin, className = '' }: TonePinyinProps) {
  const syllables = pinyin.split(/\s+/);
  const tone = getToneNumber(pinyin);
  const toneClass = `tone-${tone}`;

  return (
    <span className={`font-mono font-bold ${toneClass} ${className}`}>
      {syllables.join(' ')}
    </span>
  );
}
