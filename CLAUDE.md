# WK Waanzin — kwimhub.com

Static site (plain HTML, no build step) plus a small leaderboard-API, served by a Cloudflare Worker (`worker.js`) with static assets. Live at **https://kwimhub.com** (and www).

## Architecture

- `index.html` — live leaderboard (homepage); polls `GET /api/state` every 12 s.
- `admin.html` (→ `/admin`) — admin panel; mutations go through `PUT /api/state` with `Authorization: Bearer <ADMIN_KEY>`, validated server-side in `worker.js`.
- `selector.html` (→ `/selector`) — the original one-time team selector, archived.
- `catalog.js` — shared badge/trophy catalog for both pages.
- Leaderboard state lives in KV (binding `LEADERBOARD`, namespace id in `wrangler.jsonc`); team logos are stored inside the state as small data-URLs. The admin key is the Worker secret `ADMIN_KEY` (production: `wrangler secret put ADMIN_KEY`; local dev: `.dev.vars`, which is git- and assets-ignored).
- Local dev: `npx wrangler dev` (local KV simulation, independent of production state).

## Hosting & deploy (Cloudflare)

- Worker name: `kwimhub` — config in `wrangler.jsonc`. Custom domains `kwimhub.com` and `www.kwimhub.com` are attached via the `routes` block there; DNS and certs are managed by Cloudflare automatically.
- **Credentials**: use the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` environment variables (already set in the shell). Wrangler picks them up automatically — never run `wrangler login` / OAuth, and never print the token.
- Deploy: `npx wrangler deploy` from the repo root (wrangler is not installed globally; use npx). This uploads the repo root as static assets and goes live immediately.
- For Cloudflare API calls that wrangler doesn't cover, use `curl` with `Authorization: Bearer $CLOUDFLARE_API_TOKEN` against `https://api.cloudflare.com/client/v4/...`.

### Static assets can serve stale after deploy — known gotcha

`npx wrangler deploy` diffs local files against what's already uploaded and **skips re-uploading files whose content hash is unchanged** ("No updated asset files to upload"). If a previous deploy's assets never got properly invalidated at Cloudflare's edge (e.g. because the API token lacked cache-purge permission at the time), redeploying identical content does **not** fix it — there's nothing new to push.

The zone-level `POST /client/v4/zones/<id>/purge_cache` API (`purge_everything` or by `files`) does **not** reliably invalidate the Workers Static Assets caching layer — confirmed by testing: purge returned `success: true` but `curl -sD -` kept showing `cf-cache-status: HIT` on old content afterwards, from fresh `cf-ray` IDs (i.e. genuinely reaching Cloudflare each time, not a local artifact).

**What actually works**: force a real content change (e.g. a throwaway HTML comment) so wrangler re-uploads the file with a new hash — that's what actually busts the edge cache. Verify with `curl -s <url> | grep -c <marker-string-only-in-new-version>` before declaring a deploy live; `wrangler deploy`'s own success output is not sufficient proof the *served* content changed.

## Asset hygiene

`.assetsignore` controls what gets published. Everything in the repo root that is not listed there **becomes publicly downloadable** — when adding internal files or directories (dotdirs, configs, notes), add them to `.assetsignore` before deploying. `.claude` and `.wrangler` are already excluded.

## Conventions

- Site content and commit messages are in Dutch.
- Page variants live in `variants/`; `index.html` is the main page; `og.html`/`og.png` are for social previews.
- House style: navy/gold Federatie-look with the teal/magenta/gold psychedelic "trip" accents (see the ring/hueSpin CSS in `index.html`).
