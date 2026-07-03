# OpenZi - Frontend Build Checklist

## Engine Updates Needed

- [ ] Add `toggle_learnt(type, key)` - flags bank chars or beastiary words as learnt
  - Type "c" for character, "w" for word
  - Toggles `learnt: True/False` on the entry
- [ ] Update `get_stats()` - separate unlocked vs learnt counts for words
- [ ] Add coverage field to `get_stats()` - sum frequency of known chars / total frequency
- [ ] Add method to get characters sorted by frequency, paginated (every 250)
- [ ] Add `get_unlock_preview(char)` - for a character NOT in bank, calculate:
  - How many new words would this character unlock
  - Total frequency of those unlockable words
  - Coverage percentage increase if added

## API Updates

- [ ] `POST /api/toggle-learnt` - body `{"type": "c"|"w", "key": "..."}` toggles learnt flag
- [ ] `GET /api/characters/sorted?offset=0&limit=250` - frequency-sorted for grid pagination
- [ ] `GET /api/characters/unlock-preview?char=...` - returns unlock potential
- [ ] Stats endpoint returns coverage percentage and split counts

---

## Layout

### Sidebar (fixed left)
- [ ] Navigation: Dashboard | My Bank | My HSK | Soundboard | My Decks | Settings
- [ ] Active page highlighted
- [ ] Search bar in sidebar
- [ ] Collapsible on mobile

### Global Filter/Sort (on all relevant pages)
- [ ] Sort: frequency (default), alphabetical, HSK level, date added
- [ ] Filter: HSK level, learning state, frequency range
- [ ] Search within current view

---

## Dashboard Page

### Stats
- [ ] Reading Coverage - percentage + progress bar
- [ ] Stats grid: Total Characters Learnt, Total Words Unlocked, Total Words Learnt
- [ ] HSK Pie Chart - distribution by level + non-HSK slice

### Full Character Grid (below stats)
- [ ] ALL characters sorted by frequency, sectioned every 250
- [ ] Unowned cards show: "Unlock Y words (+X% coverage)"
- [ ] Owned cards highlighted differently
- [ ] Click card -> navigates to Dictionary Entry page

---

## Dictionary Entry Page

- [ ] Dedicated page for each character/word, like a Wikipedia article
- [ ] **Header**: character/word displayed large, accented pinyin, HSK badge, frequency rank
- [ ] **Definitions**: all definitions from CEDICT, listed cleanly
- [ ] **Unlocked words containing this character** (if in bank) - clickable cards
- [ ] **Learning state** toggle button
- [ ] **Add to bank / Remove from bank** button
- [ ] **Back button** to return to previous view
- [ ] Accessible by clicking any character card anywhere in the app

---

## My Bank Page

- [ ] Two sub-tabs: Character Bank | Word Bank
- [ ] Note: "X characters = Y new words unlocked"

### Character Bank Sub-tab
- [ ] Three sections by learning state: Learning first, Not Started second, Learnt last (collapsible)
- [ ] Grid sorted by frequency within each section
- [ ] Card: character large, pinyin, definition, HSK badge, frequency
- [ ] Learning state overlay (click to cycle)
- [ ] Click card -> Dictionary Entry page
- [ ] Remove button + confirmation dialog (shows affected words)
- [ ] Input box + Add button

### Word Bank Sub-tab
- [ ] Same three-section layout by learning state
- [ ] Card: word, pinyin, definition, HSK badge
- [ ] Click card -> Dictionary Entry page
- [ ] Shows which characters unlocked this word

---

## My HSK Page

- [ ] Six sub-tabs: HSK 1 | HSK 2 | HSK 3 | HSK 4 | HSK 5 | HSK 6

### Per HSK Level
- [ ] Progress bar - X of Y characters/words learned
- [ ] Passing threshold indicator (80%)
- [ ] Stats: known, remaining
- [ ] Frequency-sorted grid, cards link to Dictionary Entry

---

## Soundboard Page

- [ ] Play button per tone (1-4 + neutral)
- [ ] Example characters per tone

---

## My Decks Page

- [ ] List of user-created decks
- [ ] Create deck from filtered selection
- [ ] Export to Anki
- [ ] Study mode (future)

---

## Settings Page

- [ ] Dictionary management
- [ ] Data management
- [ ] Display options
- [ ] Save / Load
- [ ] About

---

## Character Cards (Shared)

- [ ] 3-state learning overlay: not started / learning / learnt
- [ ] Colors: grey / yellow-orange / green
- [ ] Shows: character (large), pinyin, HSK badge, frequency
- [ ] Unowned: "Unlock Y words (+X% coverage)" cue
- [ ] Click anywhere on card -> Dictionary Entry page

## Grid System (Reused)

- [ ] Dense responsive grid, sectioned every 250, lazy loaded

## Color Scheme

- [ ] HSK 1-6 distinct colors, non-HSK grey, learning states grey/yellow/green
- [ ] Sidebar: dark bg, light text
