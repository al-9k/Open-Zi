/**
 * Convert numeric pinyin to accented pinyin.
 * wei2 → wéi, ni3 hao3 → nǐ hǎo, de5 → de
 */
const toneMap: Record<string, Record<number, string>> = {
  a: { 1: "ā", 2: "á", 3: "ǎ", 4: "à", 5: "a" },
  e: { 1: "ē", 2: "é", 3: "ě", 4: "è", 5: "e" },
  i: { 1: "ī", 2: "í", 3: "ǐ", 4: "ì", 5: "i" },
  o: { 1: "ō", 2: "ó", 3: "ǒ", 4: "ò", 5: "o" },
  u: { 1: "ū", 2: "ú", 3: "ǔ", 4: "ù", 5: "u" },
  ü: { 1: "ǖ", 2: "ǘ", 3: "ǚ", 4: "ǜ", 5: "ü" },
  v: { 1: "ǖ", 2: "ǘ", 3: "ǚ", 4: "ǜ", 5: "ü" },
};

function convertSyllable(syllable: string): string {
  const match = syllable.match(/^([a-zA-ZüÜvV:]+)([1-5])$/);
  if (!match) return syllable;

  const [, letters, toneStr] = match;
  const tone = parseInt(toneStr, 10);
  if (tone === 5) return letters.toLowerCase().replace("v", "ü");

  // Normalize: v → ü for vowel detection
  const lower = letters.toLowerCase().replace(/v/g, "ü");

  // Rule 1: a or e gets the tone mark
  for (const vowel of ["a", "e"]) {
    const idx = lower.indexOf(vowel);
    if (idx !== -1) {
      return (
        lower.slice(0, idx) +
        toneMap[vowel][tone] +
        lower.slice(idx + 1)
      ).replace("v", "ü");
    }
  }

  // Rule 2: ou → tone on o
  if (lower.includes("ou")) {
    const idx = lower.indexOf("o");
    return (
      lower.slice(0, idx) +
      toneMap["o"][tone] +
      lower.slice(idx + 1)
    ).replace("v", "ü");
  }

  // Rule 3: tone on the last vowel
  const vowels = ["a", "e", "i", "o", "u", "ü"];
  let lastVowelIdx = -1;
  let lastVowelChar = "";
  for (const v of vowels) {
    const idx = lower.lastIndexOf(v);
    if (idx > lastVowelIdx) {
      lastVowelIdx = idx;
      lastVowelChar = v;
    }
  }

  if (lastVowelIdx !== -1 && lastVowelChar) {
    const key = lastVowelChar === "ü" ? "ü" : lastVowelChar;
    return (
      lower.slice(0, lastVowelIdx) +
      toneMap[key][tone] +
      lower.slice(lastVowelIdx + 1)
    ).replace("v", "ü");
  }

  return lower.replace("v", "ü");
}

export function numericToAccented(pinyin: string): string {
  if (!pinyin) return "";
  return pinyin.split(" ").map(convertSyllable).join(" ");
}

/** Convert all uppercase pinyin (as sometimes returned by API) to proper case */
function normalizePinyin(syllable: string): string {
  // Capitalize first letter if it's meant to be a proper noun
  // For now just lowercase everything for consistency
  return syllable.toLowerCase();
}

export function numericToAccentedNormalized(pinyin: string): string {
  if (!pinyin) return "";
  return pinyin
    .split(" ")
    .map((s) => convertSyllable(normalizePinyin(s)))
    .join(" ");
}

/** Convert HSK number to Chinese numeral */
export function hskToChineseNumeral(level: number | null): string {
  if (level === null || level === undefined) return "";
  const numerals = ["", "一", "二", "三", "四", "五", "六"];
  return numerals[level] || "";
}

/** Split pinyin and definition for multi-pronunciation entries */
export function splitPronunciations(
  pinyin: string,
  definition: string,
): { pinyin: string; definition: string }[] {
  const pinyins = pinyin.split("; ").map((p) => p.trim());
  const definitions = definition.split(" | ").map((d) => d.trim());
  const pairs: { pinyin: string; definition: string }[] = [];

  for (let i = 0; i < Math.max(pinyins.length, definitions.length); i++) {
    pairs.push({
      pinyin: pinyins[i] || "",
      definition: definitions[i] || "",
    });
  }

  return pairs;
}

/** Extract tone number from numeric pinyin syllable (e.g. "wei2" → 2) */
export function getToneNumber(numericSyllable: string): number {
  const match = numericSyllable.match(/[1-5]$/);
  return match ? parseInt(match[0], 10) : 5;
}

/** Get a distinct color for each Mandarin tone */
export function getToneColor(tone: number): string {
  const colors: Record<number, string> = {
    1: "#e87d7d", // coral — high level
    2: "#d4953a", // amber — rising
    3: "#6bb5b0", // teal — dipping
    4: "#5b7dbf", // blue — falling
    5: "#bbbbbb", // grey — neutral
  };
  return colors[tone] || colors[5];
}
