# WK Waanzin Willekeur Selector

Een deelbare single-file HTML-pagina (via WhatsApp) die vrienden van Privekwim door een fake "willekeurige" teamselectie leidt voor de WK Waanzin-avond. Deterministisch onder de motorkap, pure waanzin aan de buitenkant.

Live op **https://kwimhub.com** (Cloudflare Pages, auto-deploy vanaf `main`).

## Hosting & workflow

- **Hosting:** Cloudflare Pages, gekoppeld aan deze GitHub-repo. Elke push naar `main` deployt automatisch naar kwimhub.com; elke push naar een andere branch krijgt een eigen preview-URL (`<branch>.<project>.pages.dev`).
- **Statisch:** geen build-stap — de repo-root wordt direct geserveerd (`index.html`, `og.png`, `variants/`).
- **Vanaf je laptop:** clone de repo, bewerk, `git push`. Klaar — Cloudflare deployt zelf.
- **Vanuit Claude Code (cloud of lokaal):** zelfde verhaal — wijzigingen op een branch pushen geeft een preview, mergen naar `main` zet het live.
- **DNS/domein:** beheerd in Cloudflare (registrar + DNS + Pages in één dashboard).
