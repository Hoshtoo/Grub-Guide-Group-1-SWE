# GrubGuide

**GrubGuide** helps you keep track of what is in your kitchen—alone or with the people you share a home with. Create an account, build your pantry list, and decide what everyone in your household can see versus what stays on your personal list.

The app is built for real day-to-day use: quick search and filters, barcode scanning when you want to add something fast, and **Baker's freshness** insights from your pantry data.

## What you can do

**Pantry inventory**  
Add items with details you care about (name, quantity, category, dates, notes). Search and filter so a long list stays manageable. Edit or remove items as things run out or you restock.

**Households**  
Create a household or join one with an invite code so roommates or family share one pantry view. People in the same household can see items marked for the household; you can keep other items on **your** list only when your backend supports a per-item “shared with household” flag.

**Barcode scanner**  
Use your device camera to scan a product barcode and add an item without typing the name by hand.

**Baker's freshness**  
Below your pantry list, **Baker's Freshness Analytics** turns your inventory into a simple health view: how “fresh” items look from shelf life and age, which ones need attention, and a 1–5 distribution so you can spot risk at a glance.

**Kroger calculator**  
The header can open a separate **Kroger shopping calculator** (build a list, see progress toward spend goals). That tool is its own small app in this repo; GrubGuide stays the pantry hub.

## Running GrubGuide locally

You need [Node.js](https://nodejs.org/) (LTS is fine) and a [Supabase](https://supabase.com/) project configured with the tables and security rules this app expects (profiles, households, members, inventory).

1. Clone the repo and install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project.
3. Optional: set `VITE_KROGER_CALCULATOR_URL` if the Kroger link in the header should point somewhere other than the default.
4. Start the app: `npm run dev`

Other useful commands: `npm run build`, `npm run preview`, `npm run lint`. To run only the Kroger calculator in development: `npm run kroger:install` then `npm run kroger:dev`.

## Stack (short)

React, Vite, and the Supabase JavaScript client—auth and data live in your Supabase project.
