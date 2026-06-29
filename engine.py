import json
import re


class Engine:
    def __init__(self):
        self.charbank = {}
        self.chardict = {}
        self.words = []

    def load_dictionary(self, path):
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        for key, val in data.items():
            if len(key) == 1:
                self.chardict[key] = val
            else:
                self.words.append(val)
        print(f"Loaded {len(self.chardict)} chars, {len(self.words)} words")

    def add_characters(self, input):
        chinese_pattern = re.compile(r"[\u4E00-\u9FFF]")

        if bool(re.search(r"[\u4E00-\u9FFF]", input)):
            self.query = chinese_pattern.findall(input)
        else:
            print("No characters found! Please input in chinese!")
            return

        invalid = []

        for char in self.query:
            # char must be valid or not in bank
            if char in self.charbank:
                invalid.append(char)
                continue
            elif char not in self.chardict:
                print("This archaic character is not supported: ", char)
                invalid.append(char)
            else:
                self.charbank[char] = self.chardict[char]

        print("Characters rejected: ", invalid)
        print("Characters accepted: ", e.charbank)


if __name__ == "__main__":
    e = Engine()
    e.load_dictionary("sample_dict.json")
    e.charbank["好"] = e.chardict["好"]
    print("Input some characters...")
    input = input()
    e.add_characters(input)
