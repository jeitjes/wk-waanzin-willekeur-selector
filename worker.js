// Cloudflare Worker voor kwimhub.com — serveert statische assets + leaderboard-API.
// State staat in KV (binding LEADERBOARD). /admin-toegang loopt via een lange,
// willekeurige link-token (secret ADMIN_KEY) — geen wachtwoordveld, gewoon delen.

const STATE_KEY = "state:v1";
const MAX_BODY = 4 * 1024 * 1024; // 4 MB — ruim genoeg voor 5 logo's als data-URL
const LOGO_MAX_BODY = 1.5 * 1024 * 1024; // 1.5 MB — ruim genoeg voor één verkleind profielfotootje

const WERELDLIED_KEY = "wereldlied:v1";
const WERELDLIED_HISTORY_KEY = "wereldlied:geschiedenis:v1";
const WERELDLIED_HISTORY_MAX = 30;
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

// De vier vaste prijzen — moet gelijk lopen met catalog.js
const PRIJS_IDS = ["fairplay", "flairplay", "legacy", "kampioensring"];

const DEFAULT_STATE = {
  teams: [
    { id: "t1", naam: "Team 1", spelers: ["Jelle", "Pepijn"], punten: 0, logo: null, land: null, prijzen: [] },
    { id: "t2", naam: "Team 2", spelers: ["Daniel", "Sep"], punten: 0, logo: null, land: null, prijzen: [] },
    { id: "t3", naam: "Team 3", spelers: ["Rob", "Lars"], punten: 0, logo: null, land: null, prijzen: [] },
    { id: "t4", naam: "Team 4", spelers: ["Thomas", "Zowi"], punten: 0, logo: null, land: null, prijzen: [] },
    { id: "t5", naam: "Team 5", spelers: ["Jaap", "Shayan"], punten: 0, logo: null, land: null, prijzen: [] }
  ]
};

// CORS staat open op /api zodat beheer-tools ook vanaf andere origins kunnen werken.
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

// Constant-time vergelijking tegen de link-token — lengte lekt via vroege return,
// maar dat is onvermijdelijk en onschadelijk voor een token van vaste lengte.
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
    if (!Array.isArray(t.spelers) || !Array.isArray(t.prijzen)) return false;
    if (!t.prijzen.every(p => PRIJS_IDS.includes(p))) return false;
    if (typeof t.punten !== "number" || !Number.isFinite(t.punten)) return false;
    if (t.logo !== null && (typeof t.logo !== "string" || !t.logo.startsWith("data:image/"))) return false;
    if (t.land !== undefined && t.land !== null && (typeof t.land !== "string" || !/^[A-Za-z]{2}$/.test(t.land))) return false;
  }
  return true;
}

// De KV-staat kan nog in een oudere vorm staan: losse badges/trofeeen-velden
// (met geüploade badgeDefs) of prijzen met bdef-*-ids. Deze migratie mapt dat
// alles naar de vier vaste prijs-ids; onbekende prijzen vervallen.
const OUDE_PRIJS_IDS = { "bdef-fairplay": "fairplay", "bdef-flair": "flairplay", "bdef-legacy": "legacy" };

function migreerStaat(state) {
  if (!state || !Array.isArray(state.teams)) return state;
  delete state.badgeDefs;
  delete state.prijsDefs;
  state.teams.forEach(t => {
    const oud = Array.isArray(t.prijzen)
      ? t.prijzen
      : [
          ...(Array.isArray(t.badges) ? t.badges : []),
          ...(Array.isArray(t.trofeeen)
            ? t.trofeeen.filter(tr => tr && typeof tr.id === "string" && tr.id.startsWith("kampioensring")).map(() => "kampioensring")
            : [])
        ];
    t.prijzen = [...new Set(oud.map(id => OUDE_PRIJS_IDS[id] || id))].filter(id => PRIJS_IDS.includes(id));
    delete t.badges;
    delete t.trofeeen;
  });
  return state;
}

async function leesHoofdstaat(env) {
  const raw = await env.LEADERBOARD.get(STATE_KEY);
  return raw ? migreerStaat(JSON.parse(raw)) : DEFAULT_STATE;
}

async function leesWereldlied(env) {
  const raw = await env.LEADERBOARD.get(WERELDLIED_KEY);
  return raw ? JSON.parse(raw) : DEFAULT_WERELDLIED;
}

async function schrijfWereldlied(env, w) {
  await env.LEADERBOARD.put(WERELDLIED_KEY, JSON.stringify(w));
}

async function leesWereldliedGeschiedenis(env) {
  const raw = await env.LEADERBOARD.get(WERELDLIED_HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

// bewaart een afgeronde of afgebroken ronde in de geschiedenis vóórdat hij overschreven wordt;
// rondes zonder een enkele regel zijn niet interessant en worden niet bewaard
async function archiveerWereldlied(env, w) {
  if (!w || !Array.isArray(w.regels) || w.regels.length === 0) return;
  const geschiedenis = await leesWereldliedGeschiedenis(env);
  geschiedenis.unshift({
    id: `wl-${Date.now()}`,
    geeindigd: Date.now(),
    klaar: w.klaar,
    volgorde: w.volgorde,
    duur: w.duur,
    regels: w.regels
  });
  if (geschiedenis.length > WERELDLIED_HISTORY_MAX) geschiedenis.length = WERELDLIED_HISTORY_MAX;
  await env.LEADERBOARD.put(WERELDLIED_HISTORY_KEY, JSON.stringify(geschiedenis));
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

    // Alleen het logo-veld van één team wordt aangeraakt, de rest van de staat blijft ongemoeid.
    if (url.pathname === "/api/logo" && request.method === "POST") {
      const len = Number(request.headers.get("Content-Length") || 0);
      if (len > LOGO_MAX_BODY) return json({ fout: "Te groot" }, 413);
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ fout: "Ongeldige JSON" }, 400);
      }
      const { teamId, logo } = body || {};
      if (typeof teamId !== "string") return json({ fout: "Ongeldig verzoek" }, 400);
      if (logo !== null && (typeof logo !== "string" || !logo.startsWith("data:image/") || logo.length > LOGO_MAX_BODY)) {
        return json({ fout: "Ongeldige afbeelding" }, 400);
      }
      const staat = await leesHoofdstaat(env);
      const team = staat.teams.find(t => t.id === teamId);
      if (!team) return json({ fout: "Onbekend team" }, 404);
      team.logo = logo;
      await env.LEADERBOARD.put(STATE_KEY, JSON.stringify(staat));
      return json({ ok: true, staat });
    }

    if (url.pathname === "/api/wereldlied") {
      if (request.method === "GET") return json(await leesWereldlied(env));
      return json({ fout: "Methode niet toegestaan" }, 405);
    }

    if (url.pathname === "/api/wereldlied/start" && request.method === "POST") {
      // volledig publiek — iedereen mag een nieuwe ronde starten. Er kan maar één ronde
      // tegelijk lopen: is de huidige nog actief én niet afgerond, dan moet die eerst
      // gestopt worden via /api/wereldlied/reset.
      const huidig = await leesWereldlied(env);
      if (huidig.actief && !huidig.klaar) {
        return json({ fout: "Er loopt al een ronde — stop die eerst" }, 409);
      }
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
      await archiveerWereldlied(env, huidig);
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
      return json({ ok: true, staat: w });
    }

    // volledig publiek — iedereen mag de lopende ronde afbreken (de client toont
    // hiervoor een bevestigingsdialoog). De ronde tot nu toe blijft in de geschiedenis.
    if (url.pathname === "/api/wereldlied/reset" && request.method === "POST") {
      const huidig = await leesWereldlied(env);
      await archiveerWereldlied(env, huidig);
      await schrijfWereldlied(env, DEFAULT_WERELDLIED);
      return json({ ok: true });
    }

    if (url.pathname === "/api/wereldlied/geschiedenis" && request.method === "GET") {
      return json(await leesWereldliedGeschiedenis(env));
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      return checkAuth(request, env) ? json({ ok: true }) : json({ fout: "Onjuiste sleutel" }, 401);
    }

    if (url.pathname === "/api/wereldlied/inzenden" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json({ fout: "Ongeldige JSON" }, 400); }
      const { teamId, tekst } = body || {};
      if (typeof teamId !== "string" || typeof tekst !== "string") {
        return json({ fout: "Ongeldig verzoek" }, 400);
      }
      const schoon = tekst.trim();
      if (!schoon || schoon.length > WERELDLIED_MAX_TEKST) return json({ fout: "Ongeldige tekst" }, 400);
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

    return env.ASSETS.fetch(request);
  }
};
