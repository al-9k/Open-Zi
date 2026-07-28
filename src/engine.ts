import 'dotenv/config';
import { sql, inArray, and, eq, or, isNull, isNotNull, asc } from 'drizzle-orm';
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { cedict_entries, user_char_bank } from './db/schema.js';

export class DictionaryEngine {
    private db: NodePgDatabase<Record<string, never>>;

    constructor(dbInstance: NodePgDatabase<Record<string, never>>) {
        this.db = dbInstance;
    }

    private _extractChineseCharacters(data:string): string[] | null {
        const matches = data.match(/[\u4E00-\u9FFF]/gu);
        if (!matches) { // .match() either returns null (falsy) or a list (truthy)
            console.log("No Simplified Chinese regex characters found, please input in Simplified Chinese.");
            return null;
        }
        return matches
    }

    async addCharacters(userId: string, input:string): Promise<boolean> {
        const inputlist = this._extractChineseCharacters(input);

        if (!inputlist || inputlist.length == 0) return false;

        const uniqueInput = Array.from(new Set(inputlist)); // de-duplicate

        const existingRows = await this.db
            .select({char: user_char_bank.char})
            .from(user_char_bank)
            .where(
                and(
                    eq(user_char_bank.userId, userId),
                    inArray(user_char_bank.char, uniqueInput)
                )
            ); // a single query to check everything
        
        const existingChars = new Set(existingRows.map(row => row.char));

        const newChars = uniqueInput.filter(char => !existingChars.has(char)); // filter to get new chars from input set

        if (newChars.length > 0) {
            // map characters and inject userId
            const insertPayload = newChars.map(character => ({
                userId: userId, 
                char: character,
                date_added: new Date().toISOString()
            }));
            
            // Pass the payload to .values() and remove the trailing duplicate syntax
            await this.db.insert(user_char_bank).values(insertPayload);
            console.log(`Added ${insertPayload.length} new characters: ${insertPayload.map(row => row.char).join(', ')}`); 
        }
        await this._syncWords(userId);
        return true
    }

    private async _syncWords(userId: string) {
        // Get all bank chars for this user
        const bankChars = await this.db
            .select({ char: user_char_bank.char })
            .from(user_char_bank)
            .where(eq(user_char_bank.userId, userId));
      
        const bankSet = new Set(bankChars.map(r => r.char));

        // Fetch all multi-char words from CEDICT
        const words = await this.db
            .select()
            .from(cedict_entries)
            .where(sql`LENGTH(${cedict_entries.entry}) > 1`);

        // Filter — every component char must be in bank
        return words
            .filter(w => [...w.entry].every(c => bankSet.has(c)))
            .map(w => ({
            word: w.entry,
            pinyin: w.pinyin,
            definition: w.definition,
            hsk: w.hsk,
            }));
        }

    async removeCharacter(userId: string, char: string) {
        const deletedRow = await this.db
            .delete(user_char_bank)
            .where(and(eq(user_char_bank.char, char), eq(user_char_bank.userId, userId)))
            .returning({char: user_char_bank.char})

        if (deletedRow.length > 0) {
            console.log(`${char} has been successfully removed from ${userId}'s character bank.`);
            return true;
        } else {
            console.log(`${char} is not in ${userId}'s character bank.`);
            return false;
        }
    }

    async getStats(userId: string) {
        const charBankRows = await this.db
            .select({
                char: user_char_bank.char,
                date_added: user_char_bank.date_added,
                hsk: cedict_entries.hsk,
            })
            .from(user_char_bank)
            .leftJoin(cedict_entries, eq(user_char_bank.char, cedict_entries.entry))
            .where(eq(user_char_bank.userId, userId));

        const charTimeline: Record<string, string[]> = {};
        const hskChars: Record<number, number> = {};

        for (const row of charBankRows) {
            // Group by date
            const date = row.date_added ?? "unknown";
            
            // Fallback to empty array if it doesn't exist yet
            charTimeline[date] = charTimeline[date] || [];
            charTimeline[date].push(row.char);

            // Group by HSK
            if (row.hsk) {
                // Fallback to 0 if it doesn't exist yet 
                hskChars[row.hsk] = (hskChars[row.hsk] || 0) + 1;
            }
        }

        const charCount = charBankRows.length;
        const words = await this._syncWords(userId);
        const wordCount = words.length;
        const hskWords: Record<number, number> = {};

        for (const w of words) {
            if (w.hsk) hskWords[w.hsk] = (hskWords[w.hsk] || 0) + 1;
        }

        return {
            char_count: charCount,
            word_count: wordCount,
            dictionary_count: charCount + wordCount,
            hsk_chars: hskChars,
            hsk_words: {}, 
            char_timeline: charTimeline,
            word_timeline: {},
        };
    }

    private static readonly COVERAGE_MILESTONES: [number, number][] = [
        [1, 4.09], [2, 5.6], [3, 7.02], [4, 8.18], [5, 9.28],
        [8, 12.20], [10, 13.9], [16, 17.68], [20, 19.72], [25, 22.08],
        [50, 30.52], [100, 40.0], [250, 55.0], [500, 75.0],
        [1000, 90.0], [1500, 95.0], [2000, 97.0], [3000, 99.0],
        [7594, 100.0],
    ];

    private static _rankToCoverage(rank: number): number {
        const milestones = DictionaryEngine.COVERAGE_MILESTONES;

        if (rank <= 0) {
            return 0.0;
        }

        for (let i = 0; i < milestones.length - 1; i++) {
            const [r1, c1] = milestones[i]!;
            const [r2, c2] = milestones[i + 1]!;

            if (rank >= r1 && rank <= r2) {
                const frac = (rank - r1) / (r2 - r1);
                return c1 + frac * (c2 - c1);
            }
        }

        return 100.0;
    }

    async _compute_coverage(userId: string): Promise<number> {
        const userChars = await this.db
            .select({
                char: user_char_bank.char,
                charRank: cedict_entries.charRank,
            })
            .from(user_char_bank)
            .leftJoin(cedict_entries, eq(user_char_bank.char, cedict_entries.entry))
            .where(eq(user_char_bank.userId, userId));

        let total = 0.0;

        // Loop through the user's characters
        for (const row of userChars) {
            if (row.char.length === 1) {
                const rank = row.charRank; 
                
                // (We know it's in the bank because we queried the bank! So we just check rank)
                if (rank) {
                    const marginal = DictionaryEngine._rankToCoverage(rank) - DictionaryEngine._rankToCoverage(rank - 1);
                    total += marginal;
                }
            }
        }
        return Math.round(total * 10) / 10;
    }

    async getHighestValueChar(userId: string) {
        const bankRows = await this.db.select({ char: user_char_bank.char })
            .from(user_char_bank)
            .where(eq(user_char_bank.userId, userId));
        
        const bankSet = new Set(bankRows.map(r => r.char));

        // Get top 250 unlearned single characters (candidates)
        // We use a leftJoin to find characters that are NOT in the user's bank.
        const candidates = await this.db.select({
            char: cedict_entries.entry,
            rank: cedict_entries.charRank,
            pinyin: cedict_entries.pinyin,
            definition: cedict_entries.definition,
            hsk: cedict_entries.hsk,
        })
        .from(cedict_entries)
        .leftJoin(user_char_bank, and(
            eq(user_char_bank.char, cedict_entries.entry),
            eq(user_char_bank.userId, userId)
        ))
        .where(and(
            sql`char_length(${cedict_entries.entry}) = 1`, // len(char) == 1
            isNull(user_char_bank.char),                   // char not in self.bank
            isNotNull(cedict_entries.charRank)             // rank exists
        ))
        .orderBy(asc(cedict_entries.charRank))             // candidates.sort()
        .limit(250);                                       // candidates[:250]

        if (candidates.length === 0) return null;

        const candidateSet = new Set(candidates.map(c => c.char));

        // Get multi-character words not in beastiary
        const words = await this.db.select({ word: cedict_entries.entry })
            .from(cedict_entries)
            .where(sql`char_length(${cedict_entries.entry}) > 1`); // len(word) != 1

        // Count unlockable words per candidate
        const counts: Record<string, number> = {};

        for (const row of words) {
            const charsInWord = new Set(row.word.split(''));
            const missing = [...charsInWord].filter(c => !bankSet.has(c));

            if (missing.length === 1) {
                const char = missing[0]; // TypeScript thinks this is string | undefined
                
                // FIX: Check if char exists before using it
                if (char && candidateSet.has(char)) {
                    counts[char] = (counts[char] || 0) + 1;
                }
            }
        }

        // Find the best character
        let bestChar: string | null = null;
        let bestCount = 0;

        // Use Object.entries to get [key, value] pairs directly
        for (const [char, count] of Object.entries(counts)) {
            if (count > bestCount) {
                bestCount = count;
                bestChar = char;
            }
        }

        if (!bestChar) return null;
        
        // Get the data for the best char
        const data = candidates.find(c => c.char === bestChar);
        
        if (!data) return null;

        // Calculate coverage
        const rank = data.rank ?? 0;
        const coverageAdd = rank 
            ? DictionaryEngine._rankToCoverage(rank) - DictionaryEngine._rankToCoverage(rank - 1) 
            : 0;

        // Return the formatted object
        return {
            character: bestChar,
            new_words: bestCount,
            coverage_add: Math.round(coverageAdd * 100) / 100,
            pinyin: data.pinyin || "",
            definition: data.definition || "",
            hsk: data.hsk,
            char_rank: data.rank,
        };
    }

    async search(userId: string, query: string, searchAll: boolean = true) {
        const q = query.toLowerCase().trim();

        // If query is empty, return all learned words
        if (q === "") {
            return []; // Return user_word_bank items here later
        }

        // Build the search conditions 
        const matchCondition = or(
            sql`${cedict_entries.entry} ILIKE ${'%' + q + '%'}`,
            sql`${cedict_entries.pinyin} ILIKE ${'%' + q + '%'}`,
            sql`${cedict_entries.definition} ILIKE ${'%' + q + '%'}`
        );

        //Determine the final WHERE clause based on searchAll flag
        const finalWhereCondition = searchAll 
            ? matchCondition 
            : and(isNotNull(user_char_bank.char), matchCondition);

        // Build the query in one shot
        const results = await this.db
            .select({
                entry: cedict_entries.entry,
                pinyin: cedict_entries.pinyin,
                definition: cedict_entries.definition,
                hsk: cedict_entries.hsk,
                frequency: cedict_entries.frequency,
                frequencyRank: cedict_entries.frequencyRank,
                charRank: cedict_entries.charRank,
                type: sql<"c" | "w">`CASE WHEN char_length(${cedict_entries.entry}) > 1 THEN 'w' ELSE 'c' END`,
                priority: sql<number>`
                    CASE
                    WHEN ${user_char_bank.char} IS NOT NULL AND ${cedict_entries.entry} = ${q} THEN 1
                    WHEN ${user_char_bank.char} IS NOT NULL AND ${matchCondition} THEN 2
                    WHEN ${cedict_entries.entry} = ${q} THEN 3
                    ELSE 4
                    END
                `
            })
            .from(cedict_entries)
            .leftJoin(user_char_bank, and(
                eq(user_char_bank.char, cedict_entries.entry),
                eq(user_char_bank.userId, userId)
            ))
            .where(finalWhereCondition)
            .orderBy(sql`9 asc`, asc(cedict_entries.frequencyRank))
            .limit(50);

        // Convert to dictionary format
        const resultDict: Record<string, any> = {};
        for (const row of results) {
            resultDict[row.entry] = row;
        }

        return resultDict;
    }

    async getDictionaryPage(userId: string, page: number = 1, pageSize: number = 250) {
        const offset = (page - 1) * pageSize;

        const rows = await this.db
            .select({
                entry: cedict_entries.entry,
                pinyin: cedict_entries.pinyin,
                definition: cedict_entries.definition,
                hsk: cedict_entries.hsk,
                charRank: cedict_entries.charRank,
                type: sql<"c" | "w">`CASE WHEN char_length(${cedict_entries.entry}) > 1 THEN 'w' ELSE 'c' END`,
                owned: sql<boolean>`CASE WHEN ${user_char_bank.char} IS NOT NULL THEN true ELSE false END`,
            })
            .from(cedict_entries)
            .leftJoin(user_char_bank, and(
                eq(user_char_bank.char, cedict_entries.entry),
                eq(user_char_bank.userId, userId)
            ))
            .orderBy(asc(cedict_entries.charRank))
            .limit(pageSize)
            .offset(offset);

        const totalResult = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(cedict_entries);

        const total = totalResult[0]?.count ?? 0;

        return {
            entries: rows.map((row) => ({
                ...row,
                isOwned: row.owned,
            })),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }
}
