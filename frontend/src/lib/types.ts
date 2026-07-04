export interface CharacterData {
  pinyin: string;
  definition: string;
  hsk: number | null;
  frequency: number | null;
  frequency_rank: number | null;
  date: string;
}

export interface WordData {
  pinyin: string;
  definition: string;
  hsk: number | null;
  frequency_rank: number | null;
  date: string;
}

export interface SearchResultItem extends CharacterData {
  type: "c" | "w";
}

export interface StatsData {
  char_count: number;
  word_count: number;
  dictionary_count: number;
  hsk_chars: Record<string, number>;
  hsk_words: Record<string, number>;
  char_timeline: Record<string, string[]>;
  word_timeline: Record<string, string[]>;
}

export interface AddCharsResponse {
  added: string[];
  existed: string[];
  not_found: string[];
}

export interface RemoveCharResponse {
  removed_char: string;
  removed_words: string[];
}

export type BankDict = Record<string, CharacterData>;
export type BeastiaryDict = Record<string, WordData>;
export type SearchResults = Record<string, SearchResultItem>;

export interface DictionaryEntry {
  character: string;
  pinyin: string;
  definition: string;
  hsk: number | null;
  frequency: number | null;
  frequency_rank: number | null;
}
