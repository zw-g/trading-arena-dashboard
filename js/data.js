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

/* ── Data loading ── */
async function loadAll() {
  try {
    const [pR, bR, sR] = await Promise.all([
      fetch('data/paper_sessions.json?_=' + Date.now()),
      fetch('data/backtests.json?_=' + Date.now()),
      fetch('data/strategy_configs.json?_=' + Date.now()).catch(() => new Response('{}'))
    ]);
    if (!pR.ok) throw new Error('paper_sessions.json: ' + pR.status);
    if (!bR.ok) throw new Error('backtests.json: ' + bR.status);
    PD = await pR.json();
    BD = await bR.json();
    try { SC = await sR.json(); } catch (e) { SC = {}; }

    const ts = PD.updated || BD.updated;
    if (ts) {
      const d = new Date(ts);
      const locale = LANG === 'zh' ? 'zh-CN' : 'en-US';
      document.getElementById('lastUpd').textContent = T('updated') + ' ' + d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
    }
    if (firstLoad) { popSel(); popBtSel(); firstLoad = false; }
    renderPaper();
    renderBt();
  } catch (e) {
    console.error(e);
    const h = `<div class="err">⚠️ ${e.message}</div>`;
    document.getElementById('paperOut').innerHTML = h;
    document.getElementById('btOut').innerHTML = h;
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
