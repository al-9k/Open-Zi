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

    def search(self, query, search_all=True):
        result_list = {}
        if query == "":
            return self.beastiary

        q = query.lower()

        # Priority: exact char match > char starts with > word starts with > contains
        # Search characters in bank first
        for char, data in self.bank.items():
            pinyin = data.get("pinyin", "").lower()
            definition = data.get("definition", "").lower()
            if char == q:
                result_list[char] = {"type": "c", **data}

        for char, data in self.bank.items():
            if char in result_list:
                continue
            pinyin = data.get("pinyin", "").lower()
            definition = data.get("definition", "").lower()
            if char.startswith(q) or q in char or q in pinyin or q in definition:
                result_list[char] = {"type": "c", **data}

        # Search unlocked words
        for word, data in self.beastiary.items():
            pinyin = data.get("pinyin", "").lower()
            definition = data.get("definition", "").lower()
            if word == q:
                result_list[word] = {"type": "w", **data}

        for word, data in self.beastiary.items():
            if word in result_list:
                continue
            pinyin = data.get("pinyin", "").lower()
            definition = data.get("definition", "").lower()
            if word.startswith(q) or q in word or q in pinyin or q in definition:
                result_list[word] = {"type": "w", **data}

        # Search full cedict for entries not already found
        if search_all and q:
            for key, data in self.cedict.items():
                if key in result_list:
                    continue
                pinyin = data.get("pinyin", "").lower()
                if q in key or q in pinyin:
                    t = "w" if len(key) > 1 else "c"
                    result_list[key] = {"type": t, **data}

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
            "coverage": self._compute_coverage(),
        }

    # Known coverage milestones from Chinese corpus linguistics (HanziCraft, Jun Da)
    _COVERAGE_MILESTONES = [
        (1, 4.09), (2, 5.6), (3, 7.02), (4, 8.18), (5, 9.28),
        (8, 12.20), (10, 13.9), (16, 17.68), (20, 19.72), (25, 22.08),
        (50, 30.52), (100, 40.0), (250, 55.0), (500, 75.0),
        (1000, 90.0), (1500, 95.0), (2000, 97.0), (3000, 99.0),
        (7594, 100.0),
    ]

    @staticmethod
    def _rank_to_coverage(rank):
        milestones = Engine._COVERAGE_MILESTONES
        if rank <= 0:
            return 0.0
            return milestones[0][1]
        for i in range(len(milestones) - 1):
            r1, c1 = milestones[i]
            r2, c2 = milestones[i + 1]
            if r1 <= rank <= r2:
                frac = (rank - r1) / (r2 - r1)
                return c1 + frac * (c2 - c1)
        return 100.0

    def _compute_coverage(self):
        """Coverage based on known corpus milestones — 的 = 4.09%."""
        total = 0.0
        for char, data in self.cedict.items():
            if len(char) == 1:
                rank = data.get("char_rank")
                if rank and char in self.bank:
                    marginal = self._rank_to_coverage(rank) - self._rank_to_coverage(rank - 1)
                    total += marginal
        return round(total, 1)

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


    def get_highest_value_char(self):
        """Find the best character to learn next — scans top 250 unlearned chars.
        Returns the one that unlocks the most new words."""
        from collections import Counter
        bank_set = set(self.bank)

        # Get top unlearned characters by char_rank
        candidates = []
        for char, data in self.cedict.items():
            if len(char) != 1 or char in self.bank:
                continue
            rank = data.get("char_rank")
            if rank:
                candidates.append((rank, char))
        candidates.sort()
        candidates = candidates[:250]

        if not candidates:
            return None

        # Count unlockable words per candidate
        counts = Counter()
        for word in self.cedict:
            if len(word) == 1 or word in self.beastiary:
                continue
            chars_in_word = set(word)
            missing = chars_in_word - bank_set
            if len(missing) == 1:
                char = missing.pop()
                if char in {c for _, c in candidates}:
                    counts[char] += 1

        if not counts:
            return None

        best_char, best_count = counts.most_common(1)[0]
        data = self.cedict[best_char]
        rank = data.get("char_rank")
        coverage_add = self._rank_to_coverage(rank) - self._rank_to_coverage(rank - 1) if rank else 0
        return {
            "character": best_char,
            "new_words": best_count,
            "coverage_add": round(coverage_add, 2),
            "pinyin": data.get("pinyin", ""),
            "definition": data.get("definition", ""),
            "hsk": data.get("hsk"),
            "char_rank": data.get("char_rank"),
        }

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
