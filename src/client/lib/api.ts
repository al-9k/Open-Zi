const BASE_URL = '';

export interface AddCharactersResponse {
  success: boolean;
  message: string;
}

export interface RemoveCharacterResponse {
  success: boolean;
  message: string;
}

export interface StatsResponse {
  char_count: number;
  word_count: number;
  dictionary_count: number;
  hsk_chars: Record<number, number>;
  hsk_words: Record<number, number>;
  char_timeline: Record<string, string[]>;
  word_timeline: Record<string, string[]>;
  coverage_percentage: number;
}

export interface RecommendationResponse {
  character: string;
  new_words: number;
  coverage_add: number;
  pinyin: string;
  definition: string;
  hsk: number | null;
  char_rank: number | null;
}

export interface SearchResultEntry {
  entry: string;
  pinyin: string;
  definition: string;
  hsk: number | null;
  frequency: number | null;
  frequencyRank: number | null;
  charRank: number | null;
  type: 'c' | 'w';
  priority: number;
}

export type SearchResults = Record<string, SearchResultEntry>;

export interface DictionaryPageEntry {
  entry: string;
  pinyin: string;
  definition: string;
  hsk: number | null;
  charRank: number | null;
  type: 'c' | 'w';
  isOwned: boolean;
}

export interface DictionaryPageResponse {
  entries: DictionaryPageEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function addCharacters(userId: string, input: string): Promise<AddCharactersResponse> {
  return request<AddCharactersResponse>('/api/characters', {
    method: 'POST',
    body: JSON.stringify({ userId, input }),
  });
}

export async function removeCharacter(userId: string, char: string): Promise<RemoveCharacterResponse> {
  return request<RemoveCharacterResponse>('/api/characters', {
    method: 'DELETE',
    body: JSON.stringify({ userId, char }),
  });
}

export async function getUserStats(userId: string): Promise<StatsResponse> {
  return request<StatsResponse>(`/api/users/${userId}/stats`);
}

export async function getRecommendation(userId: string): Promise<RecommendationResponse> {
  return request<RecommendationResponse>(`/api/users/${userId}/recommendation`);
}

export async function search(userId: string, query: string, all: boolean = true): Promise<SearchResults> {
  const params = new URLSearchParams({ userId, q: query, all: String(all) });
  return request<SearchResults>(`/api/search?${params.toString()}`);
}

export async function getDictionaryPage(
  userId: string,
  page: number = 1,
  pageSize: number = 250,
): Promise<DictionaryPageResponse> {
  const params = new URLSearchParams({ userId, page: String(page), pageSize: String(pageSize) });
  return request<DictionaryPageResponse>(`/api/dictionary?${params.toString()}`);
}
