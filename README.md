# Open-Zi · 开字

A self-expanding Chinese dictionary that treats characters as vectors in the space of all Chinese characters. Learn characters, unlock words, and watch your coverage grow.

## Architecture

```
Open-Zi/
├── src/
│   ├── engine.ts              # Dictionary engine — character bank, stats, search, recommendations
│   ├── server.ts              # Express API server (port 3000)
│   ├── index.ts               # Drizzle DB connection
│   ├── db/
│   │   ├── schema.ts          # Drizzle ORM schema (users, cedict, user_char_bank)
│   │   ├── seed.ts            # Seeds the cedict table from cedict.json
│   │   └── cedict.json        # CEDICT dictionary data (~7,594 entries)
│   └── client/                # React frontend (Vite + Tailwind v4)
│       ├── lib/api.ts         # Single source of truth for all network requests
│       ├── context/           # UserContext — global userId provider
│       ├── components/        # Reusable UI components
│       └── pages/             # Route pages (Dashboard, Codex, Bank, Search, Entry)
├── docker-compose.yml         # PostgreSQL 16
├── drizzle.config.ts          # Drizzle Kit config
├── vite.config.ts             # Vite dev server with /api proxy
└── index.html                 # Vite entry point
```

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

## Setup

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker compose up -d

# Create tables, seed the default user, and populate the dictionary
npm run db:setup

# Start the API server (terminal 1)
npm run server

# Start the frontend dev server (terminal 2)
npm run dev
```

Open `http://localhost:5173` in your browser.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/characters` | Add characters to user bank. Body: `{ userId, input }` |
| `DELETE` | `/api/characters` | Remove a character. Body: `{ userId, char }` |
| `GET` | `/api/users/:userId/stats` | Stats, HSK breakdown, timeline, coverage % |
| `GET` | `/api/users/:userId/recommendation` | Highest-value next character to learn |
| `GET` | `/api/search?userId=&q=&all=` | Dictionary search |
| `GET` | `/api/dictionary?userId=&page=&pageSize=` | Paginated dictionary entries |

## Core Loop

1. Paste Chinese text into the **Quick Scan** bar on the Dashboard
2. Characters are extracted, deduplicated, and stored in your bank
3. Words composed entirely of known characters are automatically unlocked
4. Your **Coverage** percentage rises — this measures real-world text comprehension
5. The **Recommended Next** card suggests the character that unlocks the most new words

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite frontend dev server |
| `npm run server` | Start Express API server |
| `npm run build` | Type-check and production build the frontend |
| `npm run db:push` | Push Drizzle schema to PostgreSQL |
| `npm run db:seed` | Seed the CEDICT dictionary data |
| `npm run db:setup` | Push schema + create default user + seed |
