# Wardrobe

A local-first digital wardrobe and deterministic outfit recommendation app built with Next.js 16, React, TypeScript, Tailwind CSS and browser Local Storage.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Architecture

- No backend, database, Firebase, authentication, weather service, or API key.
- Clothing photos are resized in-browser and stored as JPEG data URLs in Local Storage.
- Typed storage helpers isolate browser persistence from UI code.
- Outfit generation is deterministic and independent from React/Local Storage.
- Candidate combinations are generated from active tops, bottoms, shoes and optional jackets, hard-filtered, scored, thresholded at 60, and deduplicated.
- Wear history adds a temporary recency penalty and never permanently excludes an outfit.
- A basic service worker + manifest make the app PWA-ready.

## Routes

- `/` dashboard
- `/wardrobe` wardrobe library
- `/wardrobe/add` add clothing
- `/wardrobe/[id]` edit/deactivate clothing
- `/outfits` saved outfit library
- `/recommendations` filtered recommendations
- `/history` wear history
