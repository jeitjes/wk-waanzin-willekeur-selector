# WK Waanzin — kwimhub.com

Static site (plain HTML, no build step) plus a small leaderboard-API, served by a Cloudflare Worker (`worker.js`) with static assets. Live at **https://kwimhub.com** (and www).

## Architecture

- `index.html` — live leaderboard (homepage); polls `GET /api/state` every 12 s.
- `admin.html` (→ `/admin`) — admin panel; mutations go through `PUT /api/state` and are unauthenticated by design (no password gate — anyone with the URL can edit state).
- `selector.html` (→ `/selector`) — the original one-time team selector, archived.
- `catalog.js` — shared badge/trophy catalog for both pages.
- Leaderboard state lives in KV (binding `LEADERBOARD`, namespace id in `wrangler.jsonc`); team logos are stored inside the state as small data-URLs.
- Local dev: `npx wrangler dev` (local KV simulation, independent of production state).

## Hosting & deploy (Cloudflare)

- Worker name: `kwimhub` — config in `wrangler.jsonc`. Custom domains `kwimhub.com` and `www.kwimhub.com` are attached via the `routes` block there; DNS and certs are managed by Cloudflare automatically.
- **Credentials**: use the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` environment variables (already set in the shell). Wrangler picks them up automatically — never run `wrangler login` / OAuth, and never print the token.
- Deploy: `npx wrangler deploy` from the repo root (wrangler is not installed globally; use npx). This uploads the repo root as static assets and goes live immediately.
- For Cloudflare API calls that wrangler doesn't cover, use `curl` with `Authorization: Bearer $CLOUDFLARE_API_TOKEN` against `https://api.cloudflare.com/client/v4/...`.

## Asset hygiene

`.assetsignore` controls what gets published. Everything in the repo root that is not listed there **becomes publicly downloadable** — when adding internal files or directories (dotdirs, configs, notes), add them to `.assetsignore` before deploying. `.claude` and `.wrangler` are already excluded.

## Conventions

- Site content and commit messages are in Dutch.
- Page variants live in `variants/`; `index.html` is the main page; `og.html`/`og.png` are for social previews.
- House style: navy/gold Federatie-look with the teal/magenta/gold psychedelic "trip" accents (see the ring/hueSpin CSS in `index.html`).

## Known regressions to watch for

- **Infinite scroll on mobile (`index.html`)**: the page must stop scrolling exactly where the content ends — no rubber-band bounce past the footer on mobile browsers. This is guarded by `overscroll-behavior-y: none` on the `html, body` rule near the top of `index.html`'s `<style>`. This has regressed before (silently dropped during a refactor); if it reappears, check that rule is still present before investigating further, and manually verify by hand on a phone (scroll to bottom, keep dragging up — it should not bounce or reveal empty space) before each deploy that touches `index.html`'s layout/CSS.
