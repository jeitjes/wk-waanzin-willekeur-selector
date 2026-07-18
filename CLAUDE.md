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

## Working across multiple sessions — deploy discipline

This project is worked on from **several Claude sessions in parallel**, each on its own branch, and all deploying to the same single Worker. `wrangler deploy` publishes the **entire working directory** — so the last session to deploy wins wholesale, silently wiping any feature that isn't in that session's checkout. This has already caused a production regression once (a session deployed from a checkout without the Wereldlied changes, five minutes after they went live).

Rules to prevent it:

1. **Always `git fetch origin main` and merge `origin/main` into your branch immediately before every deploy.** Never deploy a checkout that is behind main — you'd be un-shipping other sessions' work. This applies even if your own change is tiny.
2. **After verifying a feature live, merge your branch into `main` promptly** (ask the user first — pushing to main needs explicit permission). Work that only lives on a feature branch is invisible to other sessions and will be overwritten by their next deploy.
3. **If live behavior doesn't match your code**, don't assume caching: first check the Worker's deployment list (`GET /accounts/$CLOUDFLARE_ACCOUNT_ID/workers/scripts/kwimhub/deployments`) for deploys you didn't make. A version ID you don't recognize means another session deployed over you — re-merge and redeploy rather than debugging phantom cache issues.
4. **Merge conflicts**: resolve by keeping *both* features whenever possible (they're usually orthogonal — e.g. main's state-migration alongside this branch's endpoint changes). After resolving, sanity-check with `node --check worker.js` and parse each HTML file's inline `<script>` blocks with `new Function(...)` before committing.
5. **After every deploy, verify the live site actually serves your change** (curl + grep for a marker string unique to the new version) — and re-check a few minutes later if the user reports it broken, since another session may have deployed in between.

## Asset hygiene

`.assetsignore` controls what gets published. Everything in the repo root that is not listed there **becomes publicly downloadable** — when adding internal files or directories (dotdirs, configs, notes), add them to `.assetsignore` before deploying. `.claude` and `.wrangler` are already excluded.

## Conventions

- Site content and commit messages are in Dutch.
- Page variants live in `variants/`; `index.html` is the main page; `og.html`/`og.png` are for social previews.
- House style: navy/gold Federatie-look with the teal/magenta/gold psychedelic "trip" accents (see the ring/hueSpin CSS in `index.html`).

## Known regressions to watch for

- **Infinite scroll on mobile (`index.html`)**: the page must stop scrolling exactly where the content ends — no rubber-band bounce past the footer on mobile browsers. This is guarded by `overscroll-behavior-y: none` on the `html, body` rule near the top of `index.html`'s `<style>`. This has regressed before (silently dropped during a refactor); if it reappears, check that rule is still present before investigating further, and manually verify by hand on a phone (scroll to bottom, keep dragging up — it should not bounce or reveal empty space) before each deploy that touches `index.html`'s layout/CSS.
