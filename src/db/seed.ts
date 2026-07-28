import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { db } from '../index.js'; 
import { cedict_entries } from './schema.js'; // Assuming your table name

async function main() {
    console.log("Starting database seeding from cedict.json ...")

    try {
        const cedictPath = path.resolve("./src/db/cedict.json");

        const rawData = await fs.readFile(cedictPath, 'utf8');

        const characterData = JSON.parse(rawData);

        const charactersToInsert = Object.entries(characterData).map(([char, data]: [string, any]) => {
            return {
                entry: char,            // key
                pinyin: data.pinyin,        // Mandatory
                definition: data.definition,// Mandatory
                hsk: data.hsk,              // Optional (if missing in JSON, becomes undefined/NULL)
                frequency: data.frequency,  // Optional
                frequencyRank: data.frequency_rank, // Optional (maps frequency_rank to camelCase)
                charRank: data.char_rank // Also optional
            };
        });

        await db.delete(cedict_entries); // wipes old entry

        const BATCH_SIZE = 500

        for (let i = 0; i < charactersToInsert.length; i+= BATCH_SIZE) {
            const batch = charactersToInsert.slice(i, i+BATCH_SIZE);
            await db.insert(cedict_entries).values(batch);
            console.log(`Inserted ${Math.min(i + BATCH_SIZE, charactersToInsert.length)} / ${charactersToInsert.length}`);
        }

        console.log("Formatted ${charactersToInsert.length} characters for insertion.");

    } catch (error) {
    console.error('SEEDING FAILED:');
    console.error(error);
    process.exit(1);
  }
}
    
main();