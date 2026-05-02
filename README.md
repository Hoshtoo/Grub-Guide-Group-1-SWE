# GrubGuide

GrubGuide is a household-aware pantry and kitchen inventory app. Signed-in users can manage items, share inventory with a household, scan barcodes, and use a small baking tracker—all backed by [Supabase](https://supabase.com/) (Postgres, auth, and row-level security).

The main application lives at the repository root (React + Vite). A separate **Kroger calculator** mini-app ships under `kroger-calculator/` and is optional for local development.

## Features

- **Authentication** — Email/password sign-in via Supabase Auth.
- **Households** — Create or join a household so multiple people can collaborate on shared inventory.
- **Inventory** — Add, edit, search, and filter pantry items; toggle between personal and household-visible items where your schema supports it.
- **Barcode scanner** — Add items using device camera scanning (`html5-qrcode`).
- **Baking tracker** — Simple helper for tracking bake-related quantities alongside the pantry UI.

## Tech stack

| Area        | Choice                          |
| ----------- | ------------------------------- |
| UI          | React 19                        |
| Build / dev | Vite 8                          |
| Backend     | Supabase (JS client v2)         |
| Linting     | ESLint 9 + React Hooks plugins  |

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- A Supabase project with tables and policies that match your deployment (see SQL files in the repo root)

## Quick start

1. **Clone the repository** and install dependencies:

   ```bash
   npm install
   ```

2. **Environment variables** — Copy the example env file and fill in your Supabase project URL and anon key:

   ```bash
   cp .env.example .env
   ```

   | Variable                       | Required | Description |
   | ------------------------------ | -------- | ----------- |
   | `VITE_SUPABASE_URL`            | Yes      | Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY`       | Yes      | Supabase anonymous (public) key |
   | `VITE_KROGER_CALCULATOR_URL`   | No       | URL for the Kroger calculator link in the header; if omitted, the app uses the default deployed calculator URL |

3. **Run the dev server**:

   ```bash
   npm run dev
   ```

4. **Production build** (outputs to `dist/`):

   ```bash
   npm run build
   ```

5. **Preview the production build locally**:

   ```bash
   npm run preview
   ```

## NPM scripts (root)

| Script            | What it does |
| ----------------- | ------------ |
| `npm run dev`     | Start the GrubGuide Vite dev server |
| `npm run build`   | Production build of GrubGuide |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint`    | Run ESLint |
| `npm run kroger:install` | Install dependencies for `kroger-calculator/` |
| `npm run kroger:dev`     | Start the Kroger calculator dev server (separate port) |
| `npm run kroger:build`   | Production build of the Kroger calculator |

## Kroger calculator (`kroger-calculator/`)

The Kroger shopping calculator is a **standalone** Vite + React app in `kroger-calculator/`. It does not replace the pantry app; it is developed and deployed separately if you use it.

- From the repo root, use the `kroger:*` scripts above, or `cd kroger-calculator` and use that package’s own `npm` scripts.
- The GrubGuide header link **Kroger Calculator** uses `VITE_KROGER_CALCULATOR_URL` when set; otherwise it falls back to the default public calculator URL configured in the app.

## Database and Supabase

The database (tables, `shared_with_household` on inventory, RLS, auth triggers) is configured in your **Supabase project** (dashboard or your team’s migration workflow). It must match what the app expects in `src/` (inventory, profiles, households).

## Project layout (high level)

```
├── src/                 # GrubGuide React app (components, Supabase client)
├── kroger-calculator/   # Optional standalone calculator app
├── public/              # Static assets for Vite
├── .env.example         # Template for local env vars
└── package.json         # Root scripts and GrubGuide dependencies
```

## Linting

ESLint is configured at the repo root. The `kroger-calculator` tree is ignored by the root linter so each app can be linted in its own context when needed.
