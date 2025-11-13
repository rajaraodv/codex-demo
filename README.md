# Tiger Mood Tracker

An emoji-first mood journal built with Next.js App Router. Log how you feel, add a short label for the moment, and review trends over time. Entries are stored in Tiger Data (Timescale/Postgres).

## Features

- Emoji picker with mood + context form that supports add, edit, and delete flows.
- Responsive history list that highlights the most recent entries with friendly formatting.
- REST API under `/api/moods` backed by PostgreSQL (Tiger Data) for CRUD operations.
- Automatic table creation plus SQL script in `db/schema.sql` if you prefer to manage schema manually.
- Graceful messaging when the database connection has not been configured yet.

## Prerequisites

- Node.js 18.18+ (Next.js 15 compatible).
- npm (ships with Node).
- Tiger Data CLI access (or the Tiger Cloud dashboard) to retrieve database credentials.

## Getting started

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy the environment template and fill in the Tiger Data connection string. Replace `<password>` with the password from Tiger Cloud (`tiger service get rzyyuyby46 --with-password true`).
   ```bash
   cp .env.example .env.local
   # DATABASE_URL should look like:
   # postgresql://tsdbadmin:<password>@rzyyuyby46.hles2ca4w9.tsdb.cloud.timescale.com:34717/tsdb?sslmode=require
   ```
3. Create the table (either run once manually or let the API lazily create it on first request).
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```
4. Start the dev server
   ```bash
   npm run dev
   ```
5. Visit [http://localhost:3000](http://localhost:3000) to add and review entries.

> **Tiger Data service**: `mood-tracker-db` (`id: rzyyuyby46`, region `us-east-1`). It may take a couple of minutes to finish provisioning. You can fetch credentials any time with `tiger service get rzyyuyby46 --with-password true` or from the Tiger Cloud console.

## API quick reference

| Method | Endpoint            | Description                  |
| ------ | ------------------- | ---------------------------- |
| GET    | `/api/moods`        | List all entries (newest first)
| POST   | `/api/moods`        | Create a new entry `{ emoji, mood, label?, entryDate }`
| PUT    | `/api/moods/:id`    | Update any subset of fields
| DELETE | `/api/moods/:id`    | Remove an entry

All endpoints return `{ data }` for success or `{ error }` on failure. Validation errors respond with HTTP 400, missing rows with HTTP 404.

## Project structure

```
src/
  app/
    api/moods/        # REST handlers for CRUD
    page.tsx          # Server component that loads initial entries
    layout.tsx        # Global fonts + metadata
    globals.css       # Global Tailwind styles
  components/
    mood-board.tsx    # Client component with the form + list UI
  lib/
    db.ts             # PostgreSQL pool helper
    moods.ts          # Reusable data access + validation
```

## Scripts

- `npm run dev` – start the app locally.
- `npm run build && npm run start` – production build & serve.
- `npm run lint` – ESLint (configured through `next/core-web-vitals`).

## Notes

- The Postgres pool enforces SSL automatically for remote hosts like Tiger Data. Override with `DATABASE_SSL=false` only if you are targeting a local Postgres instance.
- The API ensures the `mood_entries` table exists before every operation, so local prototypes work even without running the SQL script.
