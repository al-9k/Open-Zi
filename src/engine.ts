import { promises as fs } from 'fs';

// Define a dictionary type for the dictionary entries
type DictData = Record<string, any>;

class Engine {
        // Declare our parameters
        public bank: DictData;
        public cedict: DictData;
        public beastiary: DictData;

        // Assign paramters to a name
        public constructor(bank: DictData, cedict: DictData, beastiary: DictData) {
            this.bank = bank;
            this.cedict = cedict;
            this.beastiary = beastiary;        
        }

        // Asynchronous file loading used below -- better than synchronous
        public async LoadCedict(path: string): Promise<string> {
            try {
                const data = await fs.readFile(path, 'utf-8');
                return data;
            } catch (error) {
                console.error('Error reading file:', error);
                return '';

            }
        }
    }