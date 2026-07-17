# WK Waanzin — kwimhub.com

De site van de WK Waanzin-avond. Live op **https://kwimhub.com**.

- **`/`** — live klassement in psychedelische trip-stijl: teams, punten, prijzen onder de namen, en per team een prijzenkast-popup met alle gewonnen prijzen. Ververst zichzelf elke 12 s.
- **`/admin`** — Federatie Controlekamer (sleutel vereist): teams omhoog/omlaag, punten, eigen prijzen uploaden en per team toekennen, teamlogo's uploaden.
- **`/selector`** — de originele "willekeurige" teamselector (eenmalig gebruikt, gearchiveerd).

De leaderboard-state staat in Cloudflare KV (binding `LEADERBOARD` in `worker.js`); de admin-sleutel is een Worker-secret (`ADMIN_KEY`), nooit in de repo. De prijzencatalogus (de Kampioensring) staat in `catalog.js`; overige prijzen zijn geüploade afbeeldingen, beheerd via `/admin`.

## Hosting & workflow

- **Hosting:** Cloudflare Workers met static assets (config in `wrangler.jsonc`), gekoppeld aan deze GitHub-repo via Workers Builds. Elke push naar `main` deployt automatisch naar kwimhub.com; pushes naar andere branches krijgen een preview-URL.
- **Statisch:** geen build-stap — de repo-root wordt direct geserveerd (`index.html`, `og.png`, `variants/`); `.assetsignore` sluit repo-huishouding uit.
- **Vanaf je laptop:** clone de repo, bewerk, `git push`. Klaar — Cloudflare deployt zelf.
- **Vanuit Claude Code (cloud of lokaal):** zelfde verhaal — wijzigingen op een branch pushen geeft een preview, mergen naar `main` zet het live.
- **DNS/domein:** beheerd in Cloudflare (registrar + DNS + Pages in één dashboard).
