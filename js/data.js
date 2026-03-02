/* ═══════════════════════════════════════════════════════
   DATA LOADING & CACHING
   ═══════════════════════════════════════════════════════ */

/* ── Global state ── */
let PD = null;   // Paper trading data
let BD = null;   // Backtest data
let SC = {};     // Strategy configs
let CI = {};     // Chart instances
let panelOpen = false;
let currentTab = 'paper';
let btExpandedKey = null;
let firstLoad = true;

/* ── Chart instance cleanup ── */
const dc = (id) => { if (CI[id]) { CI[id].destroy(); delete CI[id]; } };

/* ═══════════════════════════════════════════════════════
   SESSION STORAGE CACHE (5-min TTL)
   ═══════════════════════════════════════════════════════ */
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_PFX = 'tad_';

function getCached(key) {
  try {
    const raw = sessionStorage.getItem(CACHE_PFX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_PFX + key); return null; }
    return data;
  } catch { return null; }
}

function setCache(key, data) {
  try { sessionStorage.setItem(CACHE_PFX + key, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* quota exceeded — ignore */ }
}

function updateTimestamp() {
  const ts = PD?.updated || BD?.updated;
  if (ts) {
    const d = new Date(ts);
    const locale = LANG === 'zh' ? 'zh-CN' : 'en-US';
    document.getElementById('lastUpd').textContent = T('updated') + ' ' + d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  }
}

/* ── Data loading with cache-first strategy ── */
async function loadAll() {
  try {
    /* ── Instant display from cache on first load ── */
    let usedCache = false;
    if (firstLoad) {
      const cPD = getCached('paper'), cBD = getCached('bt'), cSC = getCached('sc');
      if (cPD && cBD) {
        PD = cPD; BD = cBD; SC = cSC || {};
        popSel(); popBtSel();
        renderPaper(); renderBt();
        updateTimestamp();
        usedCache = true;
        firstLoad = false;
      }
    }

    /* ── Fetch fresh data (always runs, even after cache hit) ── */
    const [pR, bR, sR] = await Promise.all([
      fetch('data/paper_sessions.json?_=' + Date.now()),
      fetch('data/backtests.json?_=' + Date.now()),
      fetch('data/strategy_configs.json?_=' + Date.now()).catch(() => new Response('{}'))
    ]);
    if (!pR.ok) throw new Error('paper_sessions.json: ' + pR.status);
    if (!bR.ok) throw new Error('backtests.json: ' + bR.status);

    const newPD = await pR.json();
    const newBD = await bR.json();
    let newSC = {};
    try { newSC = await sR.json(); } catch (e) { newSC = {}; }

    /* Cache fresh data */
    setCache('paper', newPD); setCache('bt', newBD); setCache('sc', newSC);

    /* Skip re-render if data unchanged after cache hit */
    const dataChanged = !usedCache ||
      (newPD.updated || '') !== (PD?.updated || '') ||
      (newBD.updated || '') !== (BD?.updated || '');

    PD = newPD; BD = newBD; SC = newSC;
    updateTimestamp();

    if (firstLoad) { popSel(); popBtSel(); firstLoad = false; }
    if (dataChanged) { renderPaper(); renderBt(); }
  } catch (e) {
    console.error(e);
    if (!PD) {
      const h = `<div class="err">⚠️ ${e.message}</div>`;
      document.getElementById('paperOut').innerHTML = h;
      document.getElementById('btOut').innerHTML = h;
    }
  }
}

/* ── Populate selectors ── */
function popSel() {
  const s = document.getElementById('sSel');
  s.innerHTML = '';
  if (!PD?.sessions?.length) { s.innerHTML = '<option>No sessions</option>'; return; }
  PD.sessions.forEach((x, i) => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = x.name + (x.status === 'active' ? ' 🟢' : '') + ' — ' + x.start_date;
    s.appendChild(o);
  });
}

function popBtSel() {
  const s = document.getElementById('bSel');
  s.innerHTML = '';
  if (!BD?.runs?.length) { s.innerHTML = '<option>No runs</option>'; return; }
  BD.runs.forEach((r, i) => {
    const o = document.createElement('option');
    o.value = i;
    const llmTag = r.llm_model ? ' · 🤖 ' + r.llm_model : '';
    o.textContent = r.start + ' → ' + r.end + '  ·  ' + Object.keys(r.strategies || {}).length + ' ' + T('strategies_count') + llmTag;
    s.appendChild(o);
  });
}
