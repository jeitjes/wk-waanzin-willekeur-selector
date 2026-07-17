// Cloudflare Worker voor kwimhub.com — serveert statische assets + leaderboard-API.
// State staat in KV (binding LEADERBOARD), admin-sleutel als secret ADMIN_KEY.

const STATE_KEY = "state:v1";
const MAX_BODY = 4 * 1024 * 1024; // 4 MB — ruim genoeg voor 5 logo's als data-URL

const DEFAULT_STATE = {
  teams: [
    { id: "t1", naam: "Team 1", spelers: ["Jelle", "Pepijn"], punten: 0, logo: null, badges: [], trofeeen: [] },
    { id: "t2", naam: "Team 2", spelers: ["Daniel", "Sep"], punten: 0, logo: null, badges: [], trofeeen: [] },
    { id: "t3", naam: "Team 3", spelers: ["Rob", "Lars"], punten: 0, logo: null, badges: [], trofeeen: [] },
    { id: "t4", naam: "Team 4", spelers: ["Thomas", "Zowi"], punten: 0, logo: null, badges: [], trofeeen: [] },
    { id: "t5", naam: "Team 5", spelers: ["Jaap", "Shayan"], punten: 0, logo: null, badges: [], trofeeen: [] }
  ]
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function checkAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const key = auth.replace(/^Bearer\s+/i, "");
  const expected = env.ADMIN_KEY || "";
  if (!expected || key.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= key.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

function valideerState(state) {
  if (!state || !Array.isArray(state.teams) || state.teams.length === 0 || state.teams.length > 20) return false;
  for (const t of state.teams) {
    if (typeof t.id !== "string" || typeof t.naam !== "string") return false;
    if (!Array.isArray(t.spelers) || !Array.isArray(t.badges) || !Array.isArray(t.trofeeen)) return false;
    if (typeof t.punten !== "number" || !Number.isFinite(t.punten)) return false;
    if (t.logo !== null && (typeof t.logo !== "string" || !t.logo.startsWith("data:image/"))) return false;
    for (const tr of t.trofeeen) {
      if (typeof tr !== "object" || typeof tr.naam !== "string" || typeof tr.emoji !== "string") return false;
    }
  }
  return true;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/state") {
      if (request.method === "GET") {
        const raw = await env.LEADERBOARD.get(STATE_KEY);
        return json(raw ? JSON.parse(raw) : DEFAULT_STATE);
      }
      if (request.method === "PUT") {
        if (!checkAuth(request, env)) return json({ fout: "Geen toegang" }, 401);
        const len = Number(request.headers.get("Content-Length") || 0);
        if (len > MAX_BODY) return json({ fout: "Te groot" }, 413);
        let state;
        try {
          state = await request.json();
        } catch {
          return json({ fout: "Ongeldige JSON" }, 400);
        }
        if (!valideerState(state)) return json({ fout: "Ongeldige staat" }, 400);
        await env.LEADERBOARD.put(STATE_KEY, JSON.stringify(state));
        return json({ ok: true });
      }
      return json({ fout: "Methode niet toegestaan" }, 405);
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      return checkAuth(request, env) ? json({ ok: true }) : json({ fout: "Onjuiste sleutel" }, 401);
    }

    return env.ASSETS.fetch(request);
  }
};
