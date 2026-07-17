// Cloudflare Worker voor kwimhub.com — serveert statische assets + leaderboard-API.
// State staat in KV (binding LEADERBOARD), admin-sleutel als secret ADMIN_KEY.

const STATE_KEY = "state:v1";
const MAX_BODY = 4 * 1024 * 1024; // 4 MB — ruim genoeg voor 5 logo's als data-URL
const MAX_POGINGEN = 8; // mislukte inlogpogingen voor een IP wordt vergrendeld
const VERGRENDEL_SECONDEN = 15 * 60;

const WERELDLIED_KEY = "wereldlied:v1";
const WERELDLIED_CODES_KEY = "wereldlied:codes:v1"; // aparte KV-entry: nooit meesturen met de publieke GET
const WERELDLIED_MAX_TEKST = 140;

const DEFAULT_WERELDLIED = {
  actief: false,
  klaar: false,
  volgorde: [],
  huidige: 0,
  duur: 20,
  beurtStart: null,
  regels: []
};

const DEFAULT_STATE = {
  prijsDefs: [],
  teams: [
    { id: "t1", naam: "Team 1", spelers: ["Jelle", "Pepijn"], punten: 0, logo: null, land: null, prijzen: [] },
    { id: "t2", naam: "Team 2", spelers: ["Daniel", "Sep"], punten: 0, logo: null, land: null, prijzen: [] },
    { id: "t3", naam: "Team 3", spelers: ["Rob", "Lars"], punten: 0, logo: null, land: null, prijzen: [] },
    { id: "t4", naam: "Team 4", spelers: ["Thomas", "Zowi"], punten: 0, logo: null, land: null, prijzen: [] },
    { id: "t5", naam: "Team 5", spelers: ["Jaap", "Shayan"], punten: 0, logo: null, land: null, prijzen: [] }
  ]
};

// CORS staat open op /api zodat beheer-tools ook vanaf andere origins kunnen werken;
// schrijven blijft beschermd door de ADMIN_KEY-check.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...CORS
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

// Simpele brute-force-bescherming op IP-niveau via KV: na MAX_POGINGEN mislukte
// pogingen wordt het IP voor VERGRENDEL_SECONDEN vergrendeld voor /api/login en /api/state PUT.
function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "onbekend";
}

async function geverifieerd(request, env) {
  const ip = clientIp(request);
  const lockKey = `login-lock:${ip}`;
  if (await env.LEADERBOARD.get(lockKey)) return { ok: false, vergrendeld: true };

  const ok = checkAuth(request, env);
  const pogingenKey = `login-pogingen:${ip}`;
  if (ok) {
    await env.LEADERBOARD.delete(pogingenKey);
  } else {
    const raw = await env.LEADERBOARD.get(pogingenKey);
    const aantal = (raw ? Number(raw) : 0) + 1;
    if (aantal >= MAX_POGINGEN) {
      await env.LEADERBOARD.put(lockKey, "1", { expirationTtl: VERGRENDEL_SECONDEN });
      await env.LEADERBOARD.delete(pogingenKey);
    } else {
      await env.LEADERBOARD.put(pogingenKey, String(aantal), { expirationTtl: VERGRENDEL_SECONDEN });
    }
  }
  return { ok, vergrendeld: false };
}

function valideerState(state) {
  if (!state || !Array.isArray(state.teams) || state.teams.length === 0 || state.teams.length > 20) return false;
  if (state.prijsDefs !== undefined) {
    if (!Array.isArray(state.prijsDefs) || state.prijsDefs.length > 50) return false;
    for (const b of state.prijsDefs) {
      if (typeof b.id !== "string" || typeof b.naam !== "string") return false;
      if (typeof b.afbeelding !== "string" || !b.afbeelding.startsWith("data:image/")) return false;
    }
  }
  for (const t of state.teams) {
    if (typeof t.id !== "string" || typeof t.naam !== "string") return false;
    if (!Array.isArray(t.spelers) || !Array.isArray(t.prijzen)) return false;
    if (!t.prijzen.every(p => typeof p === "string")) return false;
    if (typeof t.punten !== "number" || !Number.isFinite(t.punten)) return false;
    if (t.logo !== null && (typeof t.logo !== "string" || !t.logo.startsWith("data:image/"))) return false;
    if (t.land !== undefined && t.land !== null && (typeof t.land !== "string" || !/^[A-Za-z]{2}$/.test(t.land))) return false;
  }
  return true;
}

function genereerWereldliedCode() {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4 cijfers, hardop voor te lezen
}

async function leesHoofdstaat(env) {
  const raw = await env.LEADERBOARD.get(STATE_KEY);
  return raw ? JSON.parse(raw) : DEFAULT_STATE;
}

async function leesWereldlied(env) {
  const raw = await env.LEADERBOARD.get(WERELDLIED_KEY);
  return raw ? JSON.parse(raw) : DEFAULT_WERELDLIED;
}

async function schrijfWereldlied(env, w) {
  await env.LEADERBOARD.put(WERELDLIED_KEY, JSON.stringify(w));
}

async function leesWereldliedCodes(env) {
  const raw = await env.LEADERBOARD.get(WERELDLIED_CODES_KEY);
  return raw ? JSON.parse(raw) : {};
}

// zet de beurt een stap door en rondt de ronde af als iedereen geweest is
function volgendeBeurt(w) {
  w.huidige += 1;
  if (w.huidige >= w.volgorde.length) {
    w.klaar = true;
    w.beurtStart = null;
  } else {
    w.beurtStart = Date.now();
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/") && request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === "/api/state") {
      if (request.method === "GET") {
        return json(await leesHoofdstaat(env));
      }
      if (request.method === "PUT") {
        const auth = await geverifieerd(request, env);
        if (auth.vergrendeld) return json({ fout: "Te veel mislukte pogingen, probeer het over 15 minuten opnieuw" }, 429);
        if (!auth.ok) return json({ fout: "Geen toegang" }, 401);
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

    if (url.pathname === "/api/wereldlied") {
      if (request.method === "GET") return json(await leesWereldlied(env));
      return json({ fout: "Methode niet toegestaan" }, 405);
    }

    if (url.pathname === "/api/wereldlied/start" && request.method === "POST") {
      const auth = await geverifieerd(request, env);
      if (auth.vergrendeld) return json({ fout: "Te veel mislukte pogingen, probeer het over 15 minuten opnieuw" }, 429);
      if (!auth.ok) return json({ fout: "Geen toegang" }, 401);
      let body;
      try { body = await request.json(); } catch { body = {}; }
      const hoofdstaat = await leesHoofdstaat(env);
      let volgorde = Array.isArray(body.volgorde) && body.volgorde.length
        ? body.volgorde.filter(id => hoofdstaat.teams.some(t => t.id === id))
        : hoofdstaat.teams.map(t => t.id);
      if (body.shuffle) {
        for (let i = volgorde.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [volgorde[i], volgorde[j]] = [volgorde[j], volgorde[i]];
        }
      }
      const duur = Number.isFinite(body.duur) && body.duur >= 5 && body.duur <= 300 ? Math.round(body.duur) : 20;
      const codes = {};
      volgorde.forEach(id => { codes[id] = genereerWereldliedCode(); });
      await env.LEADERBOARD.put(WERELDLIED_CODES_KEY, JSON.stringify(codes));
      const w = {
        actief: true,
        klaar: volgorde.length === 0,
        volgorde,
        huidige: 0,
        duur,
        beurtStart: volgorde.length ? Date.now() : null,
        regels: []
      };
      await schrijfWereldlied(env, w);
      return json({ ok: true, staat: w, codes });
    }

    if (url.pathname === "/api/wereldlied/reset" && request.method === "POST") {
      const auth = await geverifieerd(request, env);
      if (auth.vergrendeld) return json({ fout: "Te veel mislukte pogingen, probeer het over 15 minuten opnieuw" }, 429);
      if (!auth.ok) return json({ fout: "Geen toegang" }, 401);
      await schrijfWereldlied(env, DEFAULT_WERELDLIED);
      await env.LEADERBOARD.put(WERELDLIED_CODES_KEY, JSON.stringify({}));
      return json({ ok: true });
    }

    if (url.pathname === "/api/wereldlied/codes" && request.method === "GET") {
      const auth = await geverifieerd(request, env);
      if (auth.vergrendeld) return json({ fout: "Te veel mislukte pogingen, probeer het over 15 minuten opnieuw" }, 429);
      if (!auth.ok) return json({ fout: "Geen toegang" }, 401);
      return json(await leesWereldliedCodes(env));
    }

    if (url.pathname === "/api/wereldlied/login" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ fout: "Ongeldige JSON" }, 400); }
      const codes = await leesWereldliedCodes(env);
      const ok = typeof body.teamId === "string" && typeof body.code === "string" && codes[body.teamId] === body.code;
      return ok ? json({ ok: true }) : json({ fout: "Onjuiste code" }, 401);
    }

    if (url.pathname === "/api/wereldlied/inzenden" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ fout: "Ongeldige JSON" }, 400); }
      const { teamId, code, tekst } = body || {};
      if (typeof teamId !== "string" || typeof code !== "string" || typeof tekst !== "string") {
        return json({ fout: "Ongeldig verzoek" }, 400);
      }
      const schoon = tekst.trim();
      if (!schoon || schoon.length > WERELDLIED_MAX_TEKST) return json({ fout: "Ongeldige tekst" }, 400);
      const codes = await leesWereldliedCodes(env);
      if (codes[teamId] !== code) return json({ fout: "Onjuiste code" }, 401);
      const w = await leesWereldlied(env);
      if (!w.actief || w.klaar) return json({ fout: "Het Wereldlied is niet actief" }, 409);
      if (w.volgorde[w.huidige] !== teamId) return json({ fout: "Niet jullie beurt" }, 409);
      const hoofdstaat = await leesHoofdstaat(env);
      const team = hoofdstaat.teams.find(t => t.id === teamId);
      w.regels.push({ teamId, teamNaam: team ? team.naam : teamId, tekst: schoon, tijd: Date.now(), overgeslagen: false });
      volgendeBeurt(w);
      await schrijfWereldlied(env, w);
      return json({ ok: true, staat: w });
    }

    // ieder scherm dat een afgelopen countdown ziet mag dit aanroepen — de server
    // controleert zelf of de tijd echt om is, dus dubbele of te vroege aanroepen zijn onschadelijk
    if (url.pathname === "/api/wereldlied/overslaan" && request.method === "POST") {
      const w = await leesWereldlied(env);
      if (!w.actief || w.klaar || w.beurtStart === null || Date.now() - w.beurtStart < w.duur * 1000) {
        return json(w);
      }
      const teamId = w.volgorde[w.huidige];
      const hoofdstaat = await leesHoofdstaat(env);
      const team = hoofdstaat.teams.find(t => t.id === teamId);
      w.regels.push({ teamId, teamNaam: team ? team.naam : teamId, tekst: null, tijd: Date.now(), overgeslagen: true });
      volgendeBeurt(w);
      await schrijfWereldlied(env, w);
      return json(w);
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      const auth = await geverifieerd(request, env);
      if (auth.vergrendeld) return json({ fout: "Te veel mislukte pogingen, probeer het over 15 minuten opnieuw" }, 429);
      return auth.ok ? json({ ok: true }) : json({ fout: "Onjuiste sleutel" }, 401);
    }

    return env.ASSETS.fetch(request);
  }
};
