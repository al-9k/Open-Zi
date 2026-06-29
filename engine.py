import json
import re
from email import charset


class Engine:
    def __init__(self):
        self.charbank = []
        self.chars = {}
        self.words = []

    def load_dictionary(self, path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for key, val in data.items():
            if len(key) == 1:
                self.chars[key] = val
            else:
                self.words.append(val)
        print(f"Loaded {len(self.chars)} chars, {len(self.words)} words")

    def add_characters(self, input):
        chinese_pattern = re.compile(r"[\u4E00-\u9FFF]")
        self.query = chinese_pattern.findall(input)

        for char in self.query:
            # char must be valid or not in bank
            if (char in self.charbank) or (char not in self.chars):
                continue
            else:
                self.charbank.append(char)


if __name__ == "__main__":
    e = Engine()
    e.load_dictionary("sample_dict.json")
    input = input()
    e.add_characters(input)
    print(e.charbank)
