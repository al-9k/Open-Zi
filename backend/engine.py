import json
import re
from collections import defaultdict
from datetime import datetime


class Engine:
    def __init__(self):
        self.bank = {}
        self.cedict = {}
        self.beastiary = {}

    def load_dictionary(self, path):
        with open(path, "r", encoding="utf-8") as f:
            self.cedict = json.load(f)

    def add_characters(self, input):
        added, existed, not_found = [], [], []
        chinese_pattern = re.compile(r"[\u4E00-\u9FFF]")
        if bool(re.search(r"[\u4E00-\u9FFF]", input)):
            self.query = chinese_pattern.findall(input)
        else:
            print("No characters found! Please input in chinese!")
            not_found.append(input)
            return {"added": added, "existed": existed, "not_found": not_found}

        for char in set(self.query):
            if char in self.bank:
                print(char, " is already in bank.")
                existed.append(char)
                continue
            elif char not in self.cedict:
                print(char, "is archaic and not supported.")
                not_found.append(char)
            else:
                self.bank[char] = {
                    **self.cedict[char],
                    "date": datetime.now().isoformat(),
                }
                added.append(char)
        self._sync_words()
        return {"added": added, "existed": existed, "not_found": not_found}

    def _sync_words(self):
        for word in set(self.beastiary.keys()):
            if not set(word).issubset(set(self.bank.keys())):
                del self.beastiary[word]

        for word in set(self.cedict.keys()):
            if len(word) == 1:
                continue
            else:
                if set(word).issubset(set(self.bank.keys())):
                    self.beastiary[word] = {
                        **self.cedict[word],
                        "date": datetime.now().isoformat(),
                    }

    def remove_character(self, char):
        removed = {"removed_char": char, "removed_words": []}

        if char not in self.bank:
            print("Character is not in the bank.")
            return removed
        else:
            for word in set(self.beastiary.keys()):
                if char in word:
                    removed["removed_words"].append(word)
                    del self.beastiary[word]
            del self.bank[char]
            return removed

    def search(self, query):
        result_list = {}
        if query == "":
            return self.beastiary

        q = query.lower()

        for word, data in self.beastiary.items():
            pinyin = data.get("pinyin", "").lower()
            definition = data.get("definition", "").lower()
            if q in word or q in pinyin or q in definition:
                result_list[word] = {"type": "w", **data}

        for char, data in self.bank.items():
            pinyin = data.get("pinyin", "").lower()
            definition = data.get("definition", "").lower()
            if q in char or q in pinyin or q in definition:
                result_list[char] = {"type": "c", **data}

        return result_list

    def save(self, path):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(
                {"bank": self.bank, "beastiary": self.beastiary},
                f,
                ensure_ascii=False,
                indent=2,
            )

    def load(self, path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.bank = data.get("bank", {})
            self.beastiary = data.get("beastiary", {})
        except FileNotFoundError:
            pass

    def get_stats(self):
        char_history = defaultdict(list)
        word_history = defaultdict(list)
        hsk_chars = defaultdict(int)
        hsk_words = defaultdict(int)
        learnt_chars = 0
        learnt_words = 0

        for char, data in self.bank.items():
            date = data.get("date", "unknown")
            char_history[date].append(char)
            hsk = data.get("hsk")
            if hsk:
                hsk_chars[hsk] += 1
            if data.get("learnt"):
                learnt_chars += 1

        for word, data in self.beastiary.items():
            date = data.get("date", "unknown")
            word_history[date].append(word)
            hsk = data.get("hsk")
            if hsk:
                hsk_words[hsk] += 1
            if data.get("learnt"):
                learnt_words += 1

        total_freq = sum(d.get("frequency", 0) for d in self.cedict.values())
        bank_freq = sum(d.get("frequency", 0) for d in self.bank.values())
        coverage = round((bank_freq / total_freq) * 100, 1) if total_freq else 0

        return {
            "char_count": len(self.bank),
            "word_count": len(self.beastiary),
            "dictionary_count": len(self.bank) + len(self.beastiary),
            "learnt_chars": learnt_chars,
            "learnt_words": learnt_words,
            "coverage": coverage,
            "hsk_chars": dict(hsk_chars),
            "hsk_words": dict(hsk_words),
            "char_timeline": dict(char_history),
            "word_timeline": dict(word_history),
        }

    def toggle_learnt(self, type, key):
        if type == "c" and key in self.bank:
            self.bank[key]["learnt"] = not self.bank[key].get("learnt", False)
        elif type == "w" and key in self.beastiary:
            self.beastiary[key]["learnt"] = not self.beastiary[key].get("learnt", False)

    def get_unlock_preview(self, char):
        if char not in self.cedict or char in self.bank:
            return {"words": 0, "coverage_gain": 0}
        bank_set = set(self.bank.keys()) | {char}
        new_words = 0
        new_freq = 0
        total_freq = sum(d.get("frequency", 0) for d in self.cedict.values())
        for word in self.cedict:
            if len(word) < 2:
                continue
            if char not in word:
                continue
            if set(word).issubset(bank_set):
                if word not in self.beastiary:
                    new_words += 1
                    new_freq += self.cedict[word].get("frequency", 0)
        gain = round((new_freq / total_freq) * 100, 1) if total_freq else 0
        return {"words": new_words, "coverage_gain": gain}

    def get_characters_sorted(self, offset=0, limit=250):
        items = []
        for char, data in self.cedict.items():
            if len(char) != 1:
                continue
            items.append(
                {
                    "char": char,
                    "pinyin": data.get("pinyin", ""),
                    "hsk": data.get("hsk"),
                    "frequency": data.get("frequency", 0),
                    "in_bank": char in self.bank,
                }
            )
        items.sort(key=lambda x: x["frequency"], reverse=True)
        return items[offset : offset + limit]

    def export_anki(self):
        rows = []
        for char, data in self.bank.items():
            rows.append(
                {
                    "front": char,
                    "back": f"{data.get('pinyin', '')}\n{data.get('definition', '')}",
                    "hsk": data.get("hsk", ""),
                }
            )
        for word, data in self.beastiary.items():
            rows.append(
                {
                    "front": word,
                    "back": f"{data.get('pinyin', '')}\n{data.get('definition', '')}",
                    "hsk": data.get("hsk", ""),
                }
            )
        return rows
