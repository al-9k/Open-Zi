import { writable, get } from "svelte/store";
import type { BankDict, BeastiaryDict, StatsData } from "./types";

export type Page =
  | "dashboard"
  | "dictionary"
  | "my-bank"
  | "my-decks"
  | "my-decks2"
  | "search-results"
  | "settings";

export const currentPage = writable<Page>("dashboard");
export const previousPage = writable<Page>("dashboard");
export const dictionaryTarget = writable<{
  text: string;
  isWord: boolean;
} | null>(null);

export const bankDict = writable<BankDict>({});
export const beastiaryDict = writable<BeastiaryDict>({});
export const stats = writable<StatsData | null>(null);
export const searchResults = writable<Record<
  string,
  import("./types").SearchResultItem
> | null>(null);

export const navigateTo = (page: Page) => {
  currentPage.set(page);
  if (page !== "dictionary") {
    dictionaryTarget.set(null);
  }
};

export const openDictionary = (text: string, isWord: boolean) => {
  previousPage.set(get(currentPage));
  dictionaryTarget.set({ text, isWord });
  currentPage.set("dictionary");
};

export const masteredChars = writable<Set<string>>(new Set());

export const markMastered = (char: string) => {
  masteredChars.update(s => new Set([...s, char]));
};

export const markLearning = (char: string) => {
  masteredChars.update(s => { const n = new Set(s); n.delete(char); return n; });
};

export const isMastered = (char: string): boolean => {
  return get(masteredChars).has(char);
};
