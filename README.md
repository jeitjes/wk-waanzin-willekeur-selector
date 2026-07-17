# WK Waanzin Willekeur Selector

Een deelbare single-file HTML-pagina (via WhatsApp) die vrienden van Privekwim door een fake "willekeurige" teamselectie leidt voor de WK Waanzin-avond. Deterministisch onder de motorkap, pure waanzin aan de buitenkant.

Live op **https://kwimhub.com** (Cloudflare Workers static assets, auto-deploy vanaf `main`).

## Hosting & workflow

- **Hosting:** Cloudflare Workers met static assets (config in `wrangler.jsonc`), gekoppeld aan deze GitHub-repo via Workers Builds. Elke push naar `main` deployt automatisch naar kwimhub.com; pushes naar andere branches krijgen een preview-URL.
- **Statisch:** geen build-stap — de repo-root wordt direct geserveerd (`index.html`, `og.png`, `variants/`); `.assetsignore` sluit repo-huishouding uit.
- **Vanaf je laptop:** clone de repo, bewerk, `git push`. Klaar — Cloudflare deployt zelf.
- **Vanuit Claude Code (cloud of lokaal):** zelfde verhaal — wijzigingen op een branch pushen geeft een preview, mergen naar `main` zet het live.
- **DNS/domein:** beheerd in Cloudflare (registrar + DNS + Pages in één dashboard).
