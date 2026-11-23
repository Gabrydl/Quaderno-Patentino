// Funzione "traduci" del Quaderno Patentino: traduzione tecnica di inglese nautico con Gemini.
// - Solo per chi ha fatto l'accesso nell'app (token dell'utente verificato su Supabase Auth).
// - Massimo 300 caratteri per richiesta, massimo 60 richieste ogni 10 minuti per utente.
// - La chiave resta qui, nel segreto GEMINI_KEY: l'app non la vede mai.
// - GEMINI_PER_TUTTI = true: la usano tutti gli account registrati (scelta dell'utente, 26/10/2026).
//   Con false solo gli account con app_metadata.ruolo = 'superadmin' o 'admin' oppure app_metadata.gemini = true.
// - Modello: segreto GEMINI_MODEL, se c'è; altrimenti i modelli "flash" disponibili con la chiave, dal più recente
//   (prima i flash, poi i flash-lite). Se un modello è occupato o al limite si passa al successivo e lo si salta
//   per qualche minuto (ritirato: per un giorno).
// - I termini del glossario del sito (frasario/deepl_it_en.tsv e deepl_en_it.tsv) presenti nella frase vengono passati a Gemini.
// - GET ?stato=1 : controllo (chiave presente, modelli) senza tradurre nulla.
// - POST {controllo: true} : dice all'app se l'account può usare Gemini.
// 23/11/2026: più veloce. {modo: "veloce"} = bozza in ~1 s con i modelli flash-lite senza ragionamento;
//   {modo: "preciso"} (predefinito) = i modelli flash con ragionamento "low", interrogati insieme: vince il primo che
//   risponde, così un modello sovraccarico (503) non fa più aspettare. Limite per utente portato a 60 richieste ogni
//   10 minuti, perché l'app ne fa due per traduzione.
// 22/11/2026: nuovo sito (Gabrydl/Quaderno-Patentino su GitHub Pages) tra le origini ammesse e come fonte del glossario.
const SITO = "https://gabrydl.github.io/Quaderno-Patentino/frasario/";
const GEM = "https://generativelanguage.googleapis.com/v1beta";

const GEMINI_PER_TUTTI = true;   // false = solo admin e account abilitati uno per uno
const MAX_CARATTERI = 300;
const LIMITE = 60, FINESTRA_MS = 10 * 60 * 1000;
const ORIGINI = [/^https:\/\/gabrydl\.github\.io$/, /^https:\/\/gabrydl99\.github\.io$/, /^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/, /^https:\/\/appassets\.androidplatform\.net$/];

const gkey = () => Deno.env.get("GEMINI_KEY") ?? "";

function cors(req: Request) {
  const o = req.headers.get("origin") ?? "";
  const h: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
  if (ORIGINI.some((r) => r.test(o))) h["Access-Control-Allow-Origin"] = o;
  return h;
}
const json = (req: Request, corpo: unknown, stato = 200) =>
  new Response(JSON.stringify(corpo), { status: stato, headers: { ...cors(req), "Content-Type": "application/json" } });

/* utente: il token dell'app deve essere valido; dall'account si legge anche se può usare Gemini */
async function utente(req: Request): Promise<{ id: string; gemini: boolean } | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const apikey = req.headers.get("apikey") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const r = await fetch(Deno.env.get("SUPABASE_URL") + "/auth/v1/user", { headers: { Authorization: auth, apikey } });
  if (!r.ok) return null;
  const u = await r.json();
  if (!u?.id) return null;
  const m = u.app_metadata ?? {};
  return { id: u.id, gemini: GEMINI_PER_TUTTI || m.ruolo === "superadmin" || m.ruolo === "admin" || m.gemini === true };
}

const usi = new Map<string, number[]>();
function troppe(id: string) {
  const ora = Date.now(), l = (usi.get(id) ?? []).filter((t) => ora - t < FINESTRA_MS);
  if (l.length >= LIMITE) { usi.set(id, l); return true; }
  l.push(ora); usi.set(id, l); return false;
}

/* glossario del sito (ricontrollato ogni 6 ore) */
let fonte: { itEn: [string, string][]; enIt: [string, string][]; quando: number } | null = null;
async function glossario() {
  if (fonte && Date.now() - fonte.quando < 6 * 3600 * 1000) return fonte;
  const [f1, f2] = await Promise.all([fetch(SITO + "deepl_it_en.tsv", { cache: "no-store" }), fetch(SITO + "deepl_en_it.tsv", { cache: "no-store" })]);
  if (!f1.ok || !f2.ok) { console.error("tsv", f1.status, f2.status); return fonte; }
  const righe = (t: string) => t.trim().split("\n").map((l) => l.split("\t") as [string, string]).filter((x) => x.length === 2);
  fonte = { itEn: righe(await f1.text()), enIt: righe(await f2.text()), quando: Date.now() };
  return fonte;
}
const normale = (s: string) => " " + s.toLowerCase().replace(/[’‘`´]/g, "'").replace(/[^\p{L}\p{N}' ]+/gu, " ").replace(/\s+/g, " ").trim() + " ";
async function termini(testo: string, da: string): Promise<[string, string][]> {
  const g = await glossario();
  if (!g) return [];
  const t = normale(testo);
  return (da === "it" ? g.itEn : g.enIt).filter(([s]) => s.length > 2 && t.includes(normale(s))).slice(0, 30);
}

/* modelli: i "flash" disponibili, dal più recente; prima i flash, poi i flash-lite, per ultimi gli alias "latest".
   Un modello occupato (503) o al limite (429) si salta per 3 minuti, uno ritirato (404) per un giorno. */
let elenco: { nomi: string[]; quando: number } | null = null;
const fermo = new Map<string, number>();
async function modelli(): Promise<string[]> {
  const fisso = Deno.env.get("GEMINI_MODEL");
  if (fisso) return [fisso];
  if (!elenco || Date.now() - elenco.quando > 24 * 3600 * 1000) {
    const r = await fetch(GEM + "/models?pageSize=200", { headers: { "x-goog-api-key": gkey() } });
    if (r.ok) {
      const voto = (n: string) => parseFloat((n.match(/gemini-(\d+(\.\d+)?)/) ?? [])[1] ?? "0")
        - (/lite/.test(n) ? 100 : 0) - (/preview|exp/.test(n) ? 0.05 : 0) - (/latest/.test(n) ? 1000 : 0);
      const nomi: string[] = ((await r.json()).models ?? [])
        .filter((m: { name: string; supportedGenerationMethods?: string[] }) =>
          /flash/i.test(m.name) && !/image|tts|audio|live|embed|omni/i.test(m.name) &&
          (m.supportedGenerationMethods ?? []).includes("generateContent"))
        .map((m: { name: string }) => m.name.replace(/^models\//, ""))
        .sort((a: string, b: string) => voto(b) - voto(a));
      if (nomi.length) elenco = { nomi, quando: Date.now() };
    } else console.error("modelli", r.status, await r.text());
  }
  const nomi = elenco?.nomi ?? ["gemini-flash-latest", "gemini-flash-lite-latest"];
  const liberi = nomi.filter((n) => (fermo.get(n) ?? 0) < Date.now());
  return liberi.length ? liberi : nomi;
}

function istruzioni(da: string, voci: [string, string][]) {
  const [l1, l2] = da === "it" ? ["italiano", "inglese"] : ["inglese", "italiano"];
  return [
    "Sei un traduttore professionista di inglese tecnico marittimo (Maritime English, IMO SMCP, COLREG, SOLAS).",
    `Traduci il testo dall'${l1} all'${l2}.`,
    "Usa sempre la terminologia nautica professionale usata a bordo e negli esami, mai la traduzione generica o letterale: il gergo nautico va reso con il termine tecnico equivalente.",
    "Quando esiste una frase standard IMO SMCP, usa quella.",
    voci.length ? "Termini del frasario dell'utente da rispettare:\n" + voci.map(([s, t]) => `- ${s} = ${t}`).join("\n") : "",
    "Rispondi solo con la traduzione, senza spiegazioni.",
  ].filter(Boolean).join("\n");
}

type Esito = { ok: true; testo: string; modello: string } | { ok: false; stato: number };

/* ragionamento: i modelli Gemini 3 usano thinkingLevel, i 2.x thinkingBudget */
function ragionamento(m: string, livello: "minimal" | "low") {
  if (/gemini-[3-9]/.test(m)) return { thinkingLevel: livello };
  return { thinkingBudget: livello === "minimal" ? 0 : 512 };
}

async function prova(m: string, corpo: Record<string, unknown>, livello: "minimal" | "low", segnale: AbortSignal): Promise<Esito> {
  const invia = (lv: "minimal" | "low") => fetch(`${GEM}/models/${m}:generateContent`, {
    method: "POST", signal: AbortSignal.any([segnale, AbortSignal.timeout(lv === "minimal" ? 8000 : 15000)]),
    headers: { "x-goog-api-key": gkey(), "Content-Type": "application/json" },
    body: JSON.stringify({ ...corpo, generationConfig: { temperature: 0.2, maxOutputTokens: 2048, thinkingConfig: ragionamento(m, lv) } }),
  });
  let r: Response;
  try {
    r = await invia(livello);
    if (r.status === 400 && livello === "minimal") {   // alcuni modelli non accettano "minimal": si riprova con "low"
      const t = await r.text();
      if (/thinking/i.test(t)) r = await invia("low"); else { console.error("gemini", m, 400, t.slice(0, 300)); return { ok: false, stato: 400 }; }
    }
  } catch (e) {
    if (!segnale.aborted) { console.error("gemini", m, "tempo scaduto"); fermo.set(m, Date.now() + 300 * 1000); }
    return { ok: false, stato: 504 };
  }
  if ([429, 503, 404, 500].includes(r.status)) {   // al limite, occupato o ritirato: lo si salta per un po'
    console.error("gemini", m, r.status);
    fermo.set(m, Date.now() + (r.status === 404 ? 24 * 3600 : r.status === 429 ? 120 : 300) * 1000);
    return { ok: false, stato: r.status };
  }
  if (!r.ok) { console.error("gemini", m, r.status, (await r.text()).slice(0, 300)); return { ok: false, stato: r.status }; }
  const j = await r.json();
  const parti: { text?: string; thought?: boolean }[] = j.candidates?.[0]?.content?.parts ?? [];
  const out = parti.filter((p) => !p.thought).map((p) => p.text ?? "").join("").trim();
  if (!out) { console.error("gemini vuoto", m, JSON.stringify(j).slice(0, 300)); return { ok: false, stato: 502 }; }
  return { ok: true, testo: out, modello: m };
}

/* gara: gli stessi dati a più modelli insieme; vince il primo che risponde bene, gli altri vengono interrotti */
async function gara(nomi: string[], corpo: Record<string, unknown>, livello: "minimal" | "low"): Promise<Esito[]> {
  const stop = new AbortController(), esiti: Esito[] = [];
  return await new Promise((fine) => {
    let rimasti = nomi.length;
    if (!rimasti) return fine([]);
    for (const m of nomi) prova(m, corpo, livello, stop.signal).then((e) => {
      esiti.push(e);
      if (e.ok) { stop.abort(); fine([e]); }
      else if (--rimasti === 0) fine(esiti);
    });
  });
}

async function gemini(testo: string, da: string, veloce: boolean): Promise<{ ok: true; testo: string; modello: string } | { ok: false; stato: number; messaggio: string }> {
  const corpo = {
    systemInstruction: { parts: [{ text: istruzioni(da, await termini(testo, da)) }] },
    contents: [{ role: "user", parts: [{ text: testo }] }],
  };
  const tutti = await modelli(), lite = (n: string) => /lite/.test(n);
  const flash = tutti.filter((n) => !lite(n)).slice(0, 4), leggeri = tutti.filter(lite).slice(0, 2);
  const turni: [string[], "minimal" | "low"][] = veloce
    ? [[leggeri, "minimal"], [flash.slice(0, 2), "minimal"]]
    : [[flash, "low"], [leggeri, "low"]];
  const esiti: Esito[] = [];
  for (const [nomi, livello] of turni) {
    const e = await gara(nomi, corpo, livello);
    const vinto = e.find((x) => x.ok);
    if (vinto && vinto.ok) return vinto;
    esiti.push(...e);
  }
  return esiti.some((e) => !e.ok && e.stato === 429)
    ? { ok: false, stato: 429, messaggio: "Limite gratuito di Gemini raggiunto: riprova tra un minuto." }
    : { ok: false, stato: 503, messaggio: "Gemini è molto occupato in questo momento: riprova tra poco." };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  const url = new URL(req.url);

  if (req.method === "GET" && url.searchParams.has("stato")) {
    return json(req, gkey() ? { chiave: true, modelli: await modelli(), per_tutti: GEMINI_PER_TUTTI } : { chiave: false });
  }
  if (req.method !== "POST") return json(req, { errore: "metodo" }, 405);

  let corpo: { testo?: string; da?: string; controllo?: boolean; modo?: string };
  try { corpo = await req.json(); } catch { return json(req, { errore: "formato" }, 400); }

  const ut = await utente(req);
  if (corpo.controllo) return json(req, { gemini: !!ut?.gemini, aperto: GEMINI_PER_TUTTI, pronto: !!gkey() });
  if (!ut) return json(req, { errore: "accesso", messaggio: "Per la traduzione Gemini serve l'accesso con il tuo account." }, 401);
  if (!ut.gemini) return json(req, { errore: "gemini", messaggio: "Gemini non è attivo per questo account." }, 403);
  if (!gkey()) return json(req, { errore: "chiave", messaggio: "Gemini non è ancora configurato." }, 503);
  if (troppe(ut.id)) return json(req, { errore: "limite", messaggio: "Troppe richieste: riprova tra qualche minuto." }, 429);

  const testo = (corpo.testo ?? "").trim();
  const da = corpo.da === "en" ? "en" : "it";
  if (!testo) return json(req, { errore: "vuoto" }, 400);
  if (testo.length > MAX_CARATTERI) return json(req, { errore: "lungo", messaggio: `Massimo ${MAX_CARATTERI} caratteri.` }, 400);

  const g = await gemini(testo, da, corpo.modo === "veloce");
  if (!g.ok) return json(req, { errore: "gemini", messaggio: g.messaggio }, g.stato);
  return json(req, { traduzione: g.testo, da, a: da === "en" ? "it" : "en", modello: g.modello, modo: corpo.modo === "veloce" ? "veloce" : "preciso" });
});
