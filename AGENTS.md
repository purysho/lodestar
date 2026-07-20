# Lodestar — Project Brief

> **How to use this file:** Commit it to the root of your repo as `AGENTS.md` (Codex reads that file automatically), or attach it to your first Codex cloud task. It contains the full product spec, persistence schema, architecture rules, build order, and environment settings. Everything Codex needs is in this one document.
>
> **Third in a trilogy.** Same chassis as *GitHub Treasure Hunt* and *The Open Questions Atlas* — static site, Vite + React + Tailwind, GitHub Pages, zero backend. Those two are stateless discovery engines; **Lodestar is the memory layer that remembers what you found.** It can ingest stars from both (see §12), turning three scattered projects into one connected universe.

---

## 1. What we're building

**Lodestar** — a personal night sky that remembers what you discover. You add "stars" (a repo, an open question, a link, a stray thought — anything that struck you). Each takes a place in your sky and twinkles. Over visits, your scattered stars become **constellations you draw and name yourself**. You arrive, you place what moved you, you leave — and next time it's all still there, glowing.

- **For:** you, first — a place to keep what mattered. Then anyone who wants a calm, personal home for the things they find, instead of a bookmarks folder that goes to die.
- **The vibe:** a quiet cosmos. Dark, spacious, alive. Stars drift and shimmer. Adding one feels like an act of meaning, not data entry. Reverent, not busy.
- **Explicitly NOT:** not a note-taking app, not Obsidian, not a productivity dashboard, not a tagging system, not a social network. No folders, no nesting, no infinite metadata. A sky, not a database.

This is a **public, build-in-public open-source project**.

---

## 2. Hard rules (read first)

1. **Static site only.** No server, no backend, no database, no build-time secrets. Deploys to GitHub Pages.
2. **The user's data lives in their browser.** `localStorage` is the source of truth. No accounts, no sync server, no external calls to store anything. Portability comes from **export/import** (JSON download + a shareable encoded link), not a backend.
3. **Persistence schema is versioned from day one.** Saved data carries a `schemaVersion`. A migration path handles old data when the shape changes (§5.4). This is the core engineering lesson of the project — treat it seriously.
4. **Store authored meaning, not machine guesses.** The user's *drawn* constellations are persisted. Tag-based *suggestions* are derived at runtime and NEVER persisted — they can always be recomputed. This keeps the saved model clean (see §3.5).
5. **The human makes the meaning; the machine only suggests.** Auto-matching by shared tags may *hint* at connections (a faint line). The user decides whether to draw the real one, and can always move, connect, disconnect, and rename freely. Suggestions are dismissible and never override authorship.
6. **Only make changes directly requested in each task.** No features, backends, routers, or state libraries beyond this spec.

---

## 3. MVP feature spec

### 3.1 Add a star
A simple "add" affordance opens a minimal form: `title` (required), `note` (optional, one line), `tags` (optional, comma-separated), `url` (optional). On save, the star appears in the sky at an assigned position (§3.3) and persists immediately to `localStorage`.

### 3.2 The sky (the canvas)
All stars render in a single dark field. Each star:
- Sits at a position (`x`, `y` in a normalized coordinate space so it's resolution-independent).
- **Twinkles** — a gentle opacity/scale pulse on an animation loop, slightly desynced per star so the sky feels alive.
- Is brighter/larger by an attribute (e.g. number of connections, or recency) — pick one, keep it subtle.
- Shows its `title` on hover/focus; clicking opens a small detail popover (note, tags, "open link" if `url` present, delete).
- Optional: faint parallax drift on mouse-move for depth. Respect `prefers-reduced-motion` (freeze all motion).

### 3.3 Star placement
New stars are placed at a pleasant default position (e.g. gentle random scatter avoiding overlap, or spiral-out from center). **The user can then drag any star anywhere** — dragged positions persist. Placement is a starting suggestion; arrangement is the user's.

### 3.4 Constellations (the core mechanic — user-drawn)
- **Draw:** the user connects two stars to create a line between them; connecting more builds a constellation. Interaction: click a star, click another → a line is drawn (or a drag-from-star-to-star gesture — pick the cleaner one and note it).
- **Name:** a constellation can be given a name by the user.
- **Edit:** the user can disconnect stars, remove lines, move stars (lines follow), and rename or delete constellations.
- Constellations are **persisted** — they are authored meaning.

### 3.5 Suggested links (tag-matching — assistive, not authoritative)
- When stars share one or more `tags`, the sky may render a **faint, dotted "suggested" line** between them, visually distinct from solid user-drawn constellation lines.
- A suggestion is an *invitation*: the user can **accept** it (it becomes a real, solid, persisted connection) or **dismiss/ignore** it (it stays faint or disappears).
- Suggestions are **derived at runtime from tags and NEVER persisted** (rule §2.4). Only acceptance is persisted (as a normal connection). This means suggestions recompute automatically as stars/tags change — no stale data.
- A toggle lets the user hide suggested links entirely for a clean, purely-authored sky.

### 3.6 Persistence + portability
- Every change writes to `localStorage` immediately.
- **Export:** download the whole sky as a JSON file.
- **Import:** load a sky from a JSON file (with a confirm, since it replaces/merges — pick one and state it).
- **Shareable link:** encode the sky (or a compact form) into a URL so a sky can be shared or moved between devices. Note size limits — if a sky is too large to encode in a URL, fall back to file export and say so.

### 3.7 Out of scope for MVP (do not build yet)
- **V2:** smarter suggestions (beyond exact tag match — e.g. source or fuzzy match), constellation styling/colors, search/filter within the sky, zoom/pan for large skies.
- **V2 — trilogy ingest:** "send to sky" from Treasure Hunt / the Atlas (§12). Build the star schema to accommodate it now; wire the actual handoff later.
- **V3:** any AI (e.g. "suggest a name for this constellation," semantic relatedness). Not before the honest core works.

---

## 4. Architecture

```
Browser
  ├─ React app (Vite + Tailwind)
  ├─ SkyCanvas            ← renders stars + lines, runs the twinkle/animation loop
  ├─ store (localStorage) ← source of truth: stars + user-drawn constellations
  ├─ suggestions (derived) ← computed from tags at runtime, NEVER persisted
  ├─ export / import       ← JSON file + encoded shareable link
  └─ GitHub Pages          ← static hosting, deployed by Actions
```

- No backend, no external calls. The entire app is the browser + `localStorage`.
- **The clean split that makes the data model honest:** persisted = stars + authored connections; derived = tag-based suggestions. Never persist what you can recompute.

---

## 5. Persistence layer (this project's "API")

### 5.1 The saved shape (localStorage, one key e.g. `lodestar:sky`)

```json
{
  "schemaVersion": 1,
  "stars": [
    {
      "id": "star-abc123",
      "title": "Why do we sleep?",
      "note": "found in the Atlas — still haunts me",
      "tags": ["biology", "neuroscience"],
      "url": "https://...",
      "x": 0.42,
      "y": 0.61,
      "origin": "manual",
      "createdAt": "2026-07-20T12:00:00Z"
    }
  ],
  "constellations": [
    {
      "id": "con-xyz789",
      "name": "Things that keep me up",
      "starIds": ["star-abc123", "star-def456"],
      "createdAt": "2026-07-20T12:05:00Z"
    }
  ]
}
```

### 5.2 Field notes
- **`id`** — stable unique id per star/constellation. Required.
- **`x` / `y`** — normalized 0–1 coordinates (resolution-independent). Persisted so arrangement survives.
- **`tags`** — drive the derived suggestion layer. Optional.
- **`origin`** — `"manual"` for MVP; reserved for `"treasure-hunt"` / `"atlas"` when trilogy ingest lands (§12). Forward-compat.
- **Connections are modeled as constellations** (a set of star ids). A single accepted suggestion is just a 2-star constellation (or fold into an existing one — pick a model and keep it consistent).
- **Suggestions are NOT in this schema** — they're computed from `tags` at runtime.

### 5.3 Store responsibilities (worth testing hard)
1. Load from `localStorage`; if empty, start a fresh sky at current `schemaVersion`.
2. Every mutation (add/move/connect/rename/delete) writes the whole sky back atomically.
3. Export serializes the sky; import validates + loads it (reject malformed JSON gracefully).
4. Encode/decode the shareable-link form; handle over-size gracefully.

### 5.4 Schema migration (the core lesson — do not skip)
- On load, read `schemaVersion`. If it's older than the current version, run ordered migration functions (`v1→v2`, `v2→v3`, …) to bring the data up to date before the app uses it.
- Never assume loaded data matches the current shape. Old exports and old browsers will carry old schemas.
- Add a test proving a `schemaVersion: 1` blob loads correctly under a (mocked) higher current version via migration.

---

## 6. Tech stack

- **Vite + React + Tailwind CSS.** No router. No state library (useState/useReducer/context only). No external persistence library — `localStorage` directly.
- **Rendering: start with SVG.** Rationale: easy click/focus targets and accessibility for free, which matters for the interaction-heavy constellation drawing. **Tradeoff to document:** SVG strains with thousands of nodes; canvas handles volume/effects better but requires hand-rolled hit detection. MVP skies are small — SVG is right. Note the canvas migration path for a "large sky" future; do not build it yet.
- **Vitest** for the store (persistence, export/import round-trip, migration) and the suggestion derivation (correct tag matching, never persisted).
- Node 20. npm with committed `package-lock.json`.

### File structure

```
index.html
vite.config.js            # base: '/lodestar/'  ← required for Pages
src/
  main.jsx
  App.jsx
  lib/store.js            # localStorage load/save, export/import, encode/decode, MIGRATIONS
  lib/suggestions.js      # derive tag-based suggested links (pure, never persists)
  components/
    SkyCanvas.jsx         # SVG sky: stars + lines + twinkle/animation loop
    Star.jsx              # a single star (twinkle, hover, drag)
    ConstellationLayer.jsx# solid user lines + faint suggested lines
    AddStarForm.jsx
    StarDetailPopover.jsx
    SkyToolbar.jsx        # add, export, import, share, toggle suggestions
.github/workflows/deploy.yml
AGENTS.md                 # this file
LICENSE                   # MIT
README.md
```

---

## 7. Design spec

This is the first project in the trilogy that is *graphics, not cards*. The sky is the product — spend the craft here, keep everything else quiet.

- **The sky is the hero.** Dark, deep, spacious. Stars are small points of light with soft glow. Emptiness is not wasted space — it's the cosmos.
- **Alive, not static.** Gentle twinkle (desynced per star), optional parallax drift. The sky should feel like it's breathing. All motion respects `prefers-reduced-motion`.
- **Two line languages, clearly distinct:** solid/bright = user-drawn constellations (authored); faint/dotted = suggested links (derived). A glance should tell them apart.
- **Palette:** a night sky — deep blues/indigos/near-black, starlight white/pale gold, one restrained accent for interactive states. (Avoid generic dark-mode gray dashboards; derive from "night sky," not "admin panel.")
- **Interaction feels physical:** dragging a star is smooth and direct; drawing a line between two stars is satisfying and obvious. Focus states visible for keyboard users.
- **Accessible:** stars are focusable and operable by keyboard (add/connect/delete without a mouse), sufficient contrast, semantic structure, `aria-label`s on controls. A calm cosmos should still be usable by everyone.
- **Copy:** quiet and human. Empty sky is an invitation ("Your sky is empty. Add something that struck you."), not an error.

*(A dedicated design pass can follow, as with the other two — treat this as direction, not final tokens.)*

---

## 8. Build order (run as sequential Codex tasks)

| # | Task | Done when |
|---|---|---|
| 1 | Scaffold Vite + React + Tailwind; dark full-viewport sky shell | `npm run dev` shows the empty cosmos |
| 2 | `lib/store.js`: schema, load/save to localStorage, `schemaVersion` + migration scaffold, Vitest | `npm test` passes; a v1 blob round-trips and migrates under a mocked higher version |
| 3 | Add a star (form) + render stars in the SVG sky with twinkle | Adding a star persists it; reload restores it, still twinkling |
| 4 | Drag to reposition + star detail popover + delete | Dragged positions persist across reload; stars can be removed |
| 5 | User-drawn constellations: connect, name, disconnect, rename, delete | Connections persist; lines follow dragged stars |
| 6 | Suggested links from shared tags (derived, faint, dismissible) + toggle; accept promotes to a real connection | Suggestions appear from tags, are NOT in saved data, accepting one persists it as a connection |
| 7 | Export/import JSON + shareable encoded link; then Pages workflow + README + polish | Sky survives export→import round-trip; site live on GitHub Pages from `main` |

---

## 9. Public repo hygiene

- **LICENSE:** MIT.
- **Repo topics:** `localstorage`, `generative`, `svg`, `personal`, `constellations`, `build-in-public`.
- **README:** what it is, screenshot/GIF of the sky (motion sells this one — a GIF beats a still), 3-command quick start, the philosophy (a sky that remembers), how it connects to the other two projects.
- **Labels:** seed a few `good first issue`s (e.g. "add a new twinkle easing," "add keyboard shortcut for connect").
- No secrets to leak — the data never leaves the user's browser, which is itself a nice privacy line for the README.

---

## 10. Deployment (GitHub Pages via Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci && npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
      - uses: actions/deploy-pages@v4
```

Remember `base: '/lodestar/'` in `vite.config.js` (match the repo name) or Pages serves broken asset paths.

---

## 11. Codex environment settings (cloud)

- **Dependencies:** with `package-lock.json` committed, Codex auto-installs via npm. Explicit setup script if preferred: `npm ci`.
- **Node version:** environment variable `CODEX_ENV_NODE_VERSION=20`.
- **Secrets:** none. This project needs no credentials anywhere.
- **Agent internet access:** not required — the app makes no external calls at all.
- Commands the agent should use: `npm run dev` · `npm test` · `npm run lint` · `npm run build`.
- Testing tip: if the Playwright MCP server is connected in Codex CLI, have the agent add a star, reload the page, and confirm it persists — persistence bugs hide until you reload.

---

## 12. The trilogy connection & reference

### The universe
Lodestar completes a set that talks to each other:
- **GitHub Treasure Hunt** (live) — discover open-source repos. *Stateless.*
- **The Open Questions Atlas** (live) — discover open questions. *Stateless.*
- **Lodestar** — remember what you found. *The memory layer.*

### Trilogy ingest (build schema for it now, wire it later — V2)
The `origin` field and the star schema (§5) are designed so a repo from Treasure Hunt or a question from the Atlas can become a star:
- A "send to sky" action in the other two apps would pass a star payload (`title`, `note`, `tags`, `url`, `origin`) to Lodestar — e.g. via the shareable-link/import mechanism, or a shared URL param.
- Keep the star schema stable and `origin`-aware so this handoff is a small addition, not a refactor. **Do not build the handoff in MVP** — just don't foreclose it.

### Chassis reference
Reuses the architecture of the other two (static site, Vite/React/Tailwind, GitHub Pages, schema-first data). Where a decision isn't specified here, follow the established pattern.

### The one guiding principle
From the whole trilogy: **the machine surfaces possibilities; the human makes the meaning.** Categories in the first two, suggested links here — always assistive, never authoritative, always added *after* the honest core works.

---

*This brief is for an agentic tool with repo access. Scope: this repository only. Stop and ask before adding any dependency not named in §6, any file outside §6's structure, or before persisting anything that rule §2.4 says should stay derived.*
