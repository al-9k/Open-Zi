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
        chinese_pattern = re.compile(r"[\u4E00-\u9FFF]")  # Chinese unicode range
        if bool(re.search(r"[\u4E00-\u9FFF]", input)):  # Check for chinese input
            self.query = chinese_pattern.findall(input)  # Get chinese from query
        else:
            print("No characters found! Please input in chinese!")
            not_found.append(input)
            return {"added": added, "existed": existed, "not_found": not_found}

        for char in set(
            self.query
        ):  # we cast into a set so that we do not process duplicates like in 宝宝
            # char must be valid or not in bank
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
        for word in set(self.beastiary.keys()):  # Clean up dictionary post removal
            if not set(word).issubset(set(self.bank.keys())):
                del self.beastiary[word]

        for word in set(self.cedict.keys()):  # Sync step
            if len(word) == 1:  # skip single characters, already in bank
                continue
            else:  # check if a word is made of characters available in the bank
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

        # Search unlocked words — match by word, pinyin, or definition
        for word, data in self.beastiary.items():
            pinyin = data.get("pinyin", "").lower()
            definition = data.get("definition", "").lower()
            if q in word or q in pinyin or q in definition:
                result_list[word] = {"type": "w", **data}

        # Search characters in bank — match by char, pinyin, or definition
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
            pass  # no save file yet, start fresh

    def get_stats(self):
        # TODO: Our data needs to have HSK levels, for now the HSK key will be empty.
        char_history = defaultdict(list)
        word_history = defaultdict(list)
        hsk_chars = defaultdict(int)
        hsk_words = defaultdict(int)

        for char, data in self.bank.items():
            date = data.get("date", "unknown")
            char_history[date].append(char)
            hsk = data.get("hsk")
            if hsk:
                hsk_chars[hsk] += 1

        for word, data in self.beastiary.items():
            date = data.get("date", "unknown")
            word_history[date].append(word)
            hsk = data.get("hsk")
            if hsk:
                hsk_words[hsk] += 1

        return {
            "char_count": len(self.bank),
            "word_count": len(self.beastiary),
            "dictionary_count": len(self.bank) + len(self.beastiary),
            "hsk_chars": dict(hsk_chars),
            "hsk_words": dict(hsk_words),
            "char_timeline": dict(char_history),
            "word_timeline": dict(word_history),
        }

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


if __name__ == "__main__":
    e = Engine()
    e.load_dictionary("sample_dict.json")

    print("=== Add 你好 ===")
    e.add_characters("你好")

    print("\n=== Add 人大 ===")
    e.add_characters("人大")

    print("\n=== Unlocked Words ===")
    for word in sorted(e.beastiary.keys()):
        print(f"  {word} — {e.beastiary[word].get('pinyin', '')}")

    print("\n=== Stats ===")
    print(e.get_stats())

    print("\n=== Save State ===")
    e.save("test_save.json")
    print("Saved to test_save.json")

    print("\n=== Search '人' ===")
    print(e.search("人"))

    print("\n=== Remove 好 ===")
    result = e.remove_character("好")
    print(f"Removed: {result['removed_char']}")
    print(f"Affected words: {result['removed_words']}")
