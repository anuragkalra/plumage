# Plumage

Gradients derived from the plumage of common Connecticut and New England birds.
Vite + TypeScript + Preact, fully static.

```sh
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build to dist/
```

Deploys to Vercel with zero config (framework preset: Vite, output: `dist`).

## Tuning colors

All bird data lives in [`src/data/birds.json`](src/data/birds.json). Each entry:

```json
{
  "slug": "northern-cardinal",
  "name": "Northern Cardinal",
  "scientific": "Cardinalis cardinalis",
  "stops": [{ "part": "Crest", "hex": "#D42A2F" }],
  "note": "One line shown under the name."
}
```

- `stops` are in plumage order (head to tail where it makes sense), 3–5 per bird.
- `part` is the label shown next to each swatch.
- `slug` is used in the URL hash (`/#cedar-waxwing`) and export filenames.

In dev, malformed hex values log a warning in the console.

## Features

- Linear, radial and conic gradients; angle for linear and conic
- Drag (or focus a handle and use ↑/↓) to reorder stops; remove, reverse, reset
- Copy a clean `background: …;` declaration; tap a hex to copy it
- PNG export at 1290×2796 (iPhone wallpaper) and 1080×1080, lightly dithered
  to avoid banding; on phones it opens the share sheet so it can go to Photos
- Browse: swipe the preview or the strip on mobile, grid on desktop, ←/→ keys
