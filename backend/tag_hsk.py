import json
from collections import Counter

with open("complete.json", "r", encoding="utf-8") as f:
    hsk_data = json.load(f)

hsk_map = {}
freq_map = {}

for item in hsk_data:
    simp = item["simplified"]
    freq = item.get("frequency")

    # Extract HSK level — prefer "new-" over "newest-"
    levels = item.get("level", [])
    new = [int(l.replace("new-", "")) for l in levels if l.startswith("new-")]
    newest = [int(l.replace("newest-", "")) for l in levels if l.startswith("newest-")]

    if new:
        hsk_map[simp] = min(new)
    elif newest:
        hsk_map[simp] = min(newest)

    if freq is not None:
        freq_map[simp] = freq

with open("cedict.json", "r", encoding="utf-8") as f:
    cedict = json.load(f)

tagged = 0
for key in cedict:
    if key in hsk_map:
        cedict[key]["hsk"] = hsk_map[key]
        tagged += 1
    if key in freq_map:
        cedict[key]["frequency"] = freq_map[key]

with open("cedict.json", "w", encoding="utf-8") as f:
    json.dump(cedict, f, ensure_ascii=False, indent=2)

by_level = Counter(cedict[k]["hsk"] for k in cedict if "hsk" in cedict[k])
tagged_freq = sum(1 for k in cedict if "frequency" in cedict[k])

print(f"Tagged {tagged} HSK levels, {tagged_freq} frequency values")
for lv in sorted(by_level):
    print(f"  HSK {lv}: {by_level[lv]}")
