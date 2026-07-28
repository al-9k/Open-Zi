import 'dotenv/config';
import { db } from '../index.js';
import { DictionaryEngine } from '../engine.js';

const engine = new DictionaryEngine(db);

try {
  const result = await engine.search('default-user', '一', true);
  console.log('✅ Search OK:', Object.keys(result).length, 'results');
  console.log(JSON.stringify(Object.keys(result).slice(0, 5)));
} catch (err) {
  console.error('❌ Search FAILED:');
  console.error(err);
}

process.exit(0);
