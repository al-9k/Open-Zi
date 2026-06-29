import json
import re
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
        chinese_pattern = re.compile(r"[\u4E00-\u9FFF]")  # Chinese unicode range
        if bool(re.search(r"[\u4E00-\u9FFF]", input)):  # Check for chinese input
            self.query = chinese_pattern.findall(input)  # Get chinese from query
        else:
            print("No characters found! Please input in chinese!")
            return

        for char in self.query:
            # char must be valid or not in bank
            if char in self.bank:
                print(char, " is already in bank.")
                continue
            elif char not in self.cedict:
                print(char, "is archaic and not supported.")
            else:
                self.bank[char] = {
                    **self.cedict[char],
                    "added": datetime.now().isoformat(),
                }
        self._sync_words()

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
                        "unlocked": datetime.now().isoformat(),
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


if __name__ == "__main__":
    e = Engine()
    e.load_dictionary("sample_dict.json")
    e.bank["好"] = e.cedict["好"]
    print("Input some characters...")
    input = input()
    e.add_characters(input)
