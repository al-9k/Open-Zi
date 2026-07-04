const BASE_URL = "http://localhost:8000";

async function request<T>(
  path: string,
  options?: RequestInit,
  retries = 3,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      if (!res.ok) {
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/csv")) {
        return res.text() as unknown as T;
      }
      return res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("unreachable");
}

export const api = {
  getCharacters: () =>
    request<Record<string, import("./types").CharacterData>>("/api/characters"),

  addCharacters: (text: string) =>
    request<import("./types").AddCharsResponse>("/api/characters/add", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  removeCharacter: (character: string) =>
    request<import("./types").RemoveCharResponse>("/api/characters/remove", {
      method: "POST",
      body: JSON.stringify({ character }),
    }),

  getWords: () =>
    request<Record<string, import("./types").WordData>>("/api/words"),

  search: (q: string) =>
    request<import("./types").SearchResults>(
      `/api/search?q=${encodeURIComponent(q)}`,
    ),

  getCharacter: (char: string) =>
    request<import("./types").DictionaryEntry>(
      `/api/character/${encodeURIComponent(char)}`,
    ),

  refresh: () =>
    request<{ status: string }>("/api/refresh", { method: "POST" }),

  getStats: () => request<import("./types").StatsData>("/api/stats"),

  save: () => request<{ status: string }>("/api/save", { method: "POST" }),

  load: () => request<{ status: string }>("/api/load", { method: "POST" }),

  exportAnki: () => request<string>("/api/export"),

  getDictionary: () =>
    request<import("./types").DictionaryEntry[]>("/api/dictionary"),
};
