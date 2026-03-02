/* ═══════════════════════════════════════════════════════
   UI — DOM Operations, Tabs, Panels, Tooltips, Sorting
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   LANGUAGE
   ═══════════════════════════════════════════════════════ */
function detectLang() {
  const stored = localStorage.getItem('lang');
  if (stored && I18N[stored]) return stored;
  const nav = (navigator.language || '').toLowerCase();
  if (nav.startsWith('zh')) return 'zh';
  return 'en';
}

function setLang(lang) {
  LANG = lang;
  localStorage.setItem('lang', lang);
  updateLangBtn();
  if (PD) renderPaper();
  if (BD) renderBt();
  updateStaticText();
}

function toggleLang() { setLang(LANG === 'en' ? 'zh' : 'en'); }

function updateLangBtn() {
  const en = document.getElementById('langEn'), zh = document.getElementById('langZh');
  if (en && zh) {
    if (LANG === 'zh') { zh.classList.add('lang-active'); en.classList.remove('lang-active'); }
    else { en.classList.add('lang-active'); zh.classList.remove('lang-active'); }
  }
}

function updateStaticText() {
  /* Tabs */
  document.querySelectorAll('.tab-btn').forEach(b => {
    const t = b.dataset.t;
    if (t === 'paper') b.textContent = '📋 ' + T('paper_trading');
    else if (t === 'bt') b.textContent = '📊 ' + T('backtests');
    else if (t === 'live') b.textContent = '🟢 ' + T('live_trading');
  });
  /* Selector labels */
  const lblS = document.querySelector('label[for="sSel"]');
  if (lblS) lblS.textContent = T('session');
  const lblB = document.querySelector('label[for="bSel"]');
  if (lblB) lblB.textContent = T('run');
  /* Footer */
  const ft = document.getElementById('ftText');
  if (ft) ft.textContent = 'Trading Arena · ' + T('auto_update');
  /* Live pane */
  const lt = document.getElementById('liveTitle');
  if (lt) lt.innerHTML = T('live_title');
  const lm = document.getElementById('liveMsg');
  if (lm) lm.innerHTML = T('live_msg') + '<br>' + T('live_target');
  const ld = document.getElementById('liveDetail');
  if (ld) ld.textContent = T('live_detail');
  /* Loading text */
  const paperLd = document.querySelector('#paperOut .ld');
  if (paperLd) paperLd.textContent = T('loading_paper');
  const btLd = document.querySelector('#btOut .ld');
  if (btLd) btLd.textContent = T('loading_bt');
}

/* ═══════════════════════════════════════════════════════
   THEME
   ═══════════════════════════════════════════════════════ */
function detectTheme() {
  const stored = localStorage.getItem('theme');
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : '');
  const btn = document.getElementById('themeBtn');
  if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', t);
  if (PD) renderPaper();
  if (BD) renderBt();
}

function toggleTheme() {
  setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

/* ═══════════════════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════════════════ */
function switchTab(t) {
  currentTab = t;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  document.querySelectorAll('.pane').forEach(p => {
    const isTarget = p.id === 'p-' + t;
    p.classList.remove('on');
    if (isTarget) { void p.offsetWidth; p.classList.add('on'); }
  });
  updateStaticText();
}

/* ═══════════════════════════════════════════════════════
   TOOLTIP
   ═══════════════════════════════════════════════════════ */
const sTT = document.getElementById('stt');

function showTT(el, sd, k) {
  const m = getMeta(sd, k), c = rc(k);
  document.getElementById('stDot').style.background = c;
  document.getElementById('stTitle').textContent = m.name || displayName(sd, k);
  const dEl = document.getElementById('stDesc');
  const ttDesc = getDesc(m);
  if (ttDesc) { dEl.textContent = ttDesc; dEl.style.display = ''; } else dEl.style.display = 'none';
  const fEl = document.getElementById('stFoot');
  const parts = [];
  if (m.version) parts.push('v' + m.version);
  if (m.type) parts.push(m.type);
  if (m.cost) parts.push(m.cost);
  if (m.data_used) parts.push(m.data_used);
  if (parts.length) { fEl.textContent = parts.join(' · '); fEl.style.display = ''; } else fEl.style.display = 'none';
  // Position
  const r = el.getBoundingClientRect(), ar = document.getElementById('stArr');
  sTT.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 330)) + 'px';
  sTT.classList.add('vis');
  const ttR = sTT.getBoundingClientRect();
  if (r.bottom + ttR.height + 12 < window.innerHeight) {
    sTT.style.top = (r.bottom + 8) + 'px'; ar.className = 'arr top';
  } else {
    sTT.style.top = (r.top - ttR.height - 8) + 'px'; ar.className = 'arr bot';
  }
  ar.style.left = Math.min(24, r.width / 2) + 'px';
}

function hideTT() { sTT.classList.remove('vis'); }

function ttEnter(el, src) {
  const k = el.dataset.key; let sd;
  if (src === 'paper') { const i = parseInt(document.getElementById('sSel').value) || 0; sd = PD?.sessions?.[i]?.strategies?.[k]; }
  else { const i = parseInt(document.getElementById('bSel').value) || 0; sd = BD?.runs?.[i]?.strategies?.[k]; }
  showTT(el, sd, k);
}

function ttLeave() { setTimeout(() => { if (!sTT.matches(':hover')) hideTT(); }, 100); }

function ttTap(el, src) {
  const k = el.dataset.key;
  if (sTT.classList.contains('vis')) { hideTT(); return; }
  ttEnter(el, src);
}

/* ═══════════════════════════════════════════════════════
   DETAIL PANEL (Level 2 + 3)
   ═══════════════════════════════════════════════════════ */
function openPanel(stratData, key, source) {
  panelOpen = true;
  const m = getMeta(stratData, key), c = rc(key);
  document.getElementById('dpDot').style.background = c;
  document.getElementById('dpTitle').textContent = m.name || displayName(stratData, key);
  const vEl = document.getElementById('dpVer');
  if (m.version) { vEl.textContent = 'v' + m.version; vEl.style.display = ''; } else vEl.style.display = 'none';

  let html = '';

  /* Description section */
  const descPri = getDesc(m), descSec = getDescSec(m);
  if (descPri || descSec) {
    html += `<div class="dp-section"><div class="dp-label">${T('about_strategy')}</div>`;
    if (descPri) html += `<div class="dp-desc">${esc(descPri)}</div>`;
    if (descSec && descPri) html += `<div class="dp-desc" style="font-size:.78rem;color:var(--text-dim);font-style:italic">${esc(descSec)}</div>`;
    else if (descSec) html += `<div class="dp-desc">${esc(descSec)}</div>`;
    const tags = [];
    if (m.type) tags.push(m.type); if (m.data_used) tags.push(m.data_used); if (m.cost) tags.push(m.cost);
    if (tags.length) html += `<div class="dp-meta-row">${tags.map(t => '<span class="dp-meta-tag">' + esc(t) + '</span>').join('')}</div>`;
    html += `</div>`;
  }

  /* Methodology section */
  const methPri = getMethod(m), methSec = getMethodSec(m);
  if (methPri || methSec) {
    html += `<div class="dp-section"><div class="bt-method"><div class="dp-label">📐 ${T('methodology')}</div>`;
    if (methPri) html += `<div class="bt-desc">${esc(methPri)}</div>`;
    if (methSec) html += `<div class="bt-desc-en">${esc(methSec)}</div>`;
    html += `</div></div>`;
  }

  /* AI Mode & Cost & Coverage */
  if (m.ai_mode || m.cost_formula || m.signals_per_day) {
    html += `<div class="dp-section"><div class="bt-info-row">`;
    if (m.ai_mode) html += `<div class="bt-info-item"><span class="bt-info-label">🤖 ${T('ai_mode')}</span><span>${esc(m.ai_mode)}</span></div>`;
    if (m.cost_formula) html += `<div class="bt-info-item"><span class="bt-info-label">💰 ${T('cost_formula')}</span><span>${esc(m.cost_formula)}</span></div>`;
    if (m.signals_per_day) html += `<div class="bt-info-item"><span class="bt-info-label">📊 ${T('coverage')}</span><span>${esc(m.signals_per_day)}</span></div>`;
    html += `</div></div>`;
  }

  /* Schedule & Risk from strategy_configs.json */
  const sc = SC[key] || {};
  const sched = sc.schedule || {};
  const rm = sc.risk_management || sc.risk || {};
  const schedKeys = Object.keys(sched);
  const exitRules = rm.position_exit_rules || [];
  const sizing = rm.position_sizing || {};
  if (schedKeys.length || exitRules.length || Object.keys(sizing).length) {
    if (sc.philosophy) html += `<div class="dp-section" style="margin-top:12px"><div class="bt-desc-en" style="font-style:normal;opacity:.85">💡 ${esc(sc.philosophy)}</div></div>`;
    html += `<div class="dp-section"><div class="dp-label">📅 ${T('schedule')}</div>`;
    if (schedKeys.length) {
      html += `<div class="bt-info-row">`;
      schedKeys.forEach(sk => {
        const s = sched[sk]; if (!s || typeof s !== 'object') return;
        const freq = s.frequency || '';
        const time = s.time ? ' at ' + s.time : '';
        const mh = s.market_hours_only ? ' (market hrs)' : '';
        html += `<div class="bt-info-item"><span class="bt-info-label">⏰ ${esc(sk.replace(/_/g, ' '))}</span><span style="font-weight:600">${esc(freq + time + mh)}</span>`;
        if (LANG === 'zh' && s.description_cn) html += `<br><span style="font-size:.72rem;color:var(--text-dim)">${esc(s.description_cn)}</span>`;
        else if (s.description) html += `<br><span style="font-size:.72rem;color:var(--text-dim)">${esc(s.description)}</span>`;
        html += `</div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;

    /* Exit rules */
    if (exitRules.length) {
      html += `<div class="dp-section"><div class="dp-label">🛡️ ${T('exit_rules')}</div>`;
      if (rm._philosophy) html += `<div class="bt-desc-en" style="margin-bottom:10px;font-size:.76rem">${esc(rm._philosophy)}</div>`;
      html += `<div style="display:flex;flex-direction:column;gap:6px">`;
      exitRules.forEach(r => {
        const trigger = r.trigger_pct != null ? ((r.trigger_pct > 0 ? '+' : '') + Math.round(r.trigger_pct * 100) + '%') : r.trigger || '';
        const actionMap = { 'full_exit': '🔴 Full Exit', 'trim_half': '🟡 Trim Half', 'reduce_or_exit': '🟠 Reduce/Exit', 'add_position': '🟢 Add Position', 'full_exit_and_reverse': '🔴 Exit & Reverse' };
        const action = actionMap[r.action] || r.action;
        html += `<div style="background:var(--bg);border-radius:var(--radius-sm);padding:8px 12px;font-size:.8rem">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:700">${esc(r.name?.replace(/_/g, ' ') || '')}</span>
            <span style="font-size:.72rem">${esc(action)}</span>
          </div>
          <div style="font-size:.72rem;color:var(--text-dim);margin-top:3px">${esc(r.description || trigger)}</div>
        </div>`;
      });
      html += `</div></div>`;
    }

    /* Position sizing */
    if (Object.keys(sizing).length) {
      html += `<div class="dp-section"><div class="dp-label">📐 ${T('position_sizing')}</div><div class="bt-info-row">`;
      if (sizing.max_single_position_pct != null) html += `<div class="bt-info-item" style="min-width:100px;flex:0 1 auto"><span class="bt-info-label">Max Position</span><span style="font-weight:700">${Math.round(sizing.max_single_position_pct * 100)}%</span></div>`;
      if (sizing.min_cash_reserve_pct != null) html += `<div class="bt-info-item" style="min-width:100px;flex:0 1 auto"><span class="bt-info-label">Cash Reserve</span><span style="font-weight:700">${Math.round(sizing.min_cash_reserve_pct * 100)}%</span></div>`;
      if (sizing.max_sector_pct != null) html += `<div class="bt-info-item" style="min-width:100px;flex:0 1 auto"><span class="bt-info-label">Max Sector</span><span style="font-weight:700">${Math.round(sizing.max_sector_pct * 100)}%</span></div>`;
      if (sizing.sizing_method) html += `<div class="bt-info-item" style="min-width:100px;flex:0 1 auto"><span class="bt-info-label">Method</span><span style="font-weight:700">${esc(sizing.sizing_method.replace(/_/g, ' '))}</span></div>`;
      html += `</div>`;
      if (sizing.description) html += `<div class="bt-desc-en" style="margin-top:6px;font-size:.74rem">${esc(sizing.description)}</div>`;
      html += `</div>`;
    }
  }

  /* NAV sparkline */
  const navH = stratData?.nav_history || [];
  if (navH.length > 1) {
    html += `<div class="dp-section"><div class="dp-label">${T('nav_hist')}</div><div class="dp-spark"><canvas id="dpSpark"></canvas></div></div>`;
  }

  /* Current stats mini-bar */
  const cur = stratData?.current;
  if (cur) {
    html += `<div class="dp-section"><div class="dp-label">${T('current_status')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:10px;text-align:center">
          <div style="font-size:.68rem;color:var(--text-dim);text-transform:uppercase">NAV</div>
          <div style="font-size:1.1rem;font-weight:800;margin-top:2px" class="${pc(cur.return_pct)}">${fm(cur.nav)}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:10px;text-align:center">
          <div style="font-size:.68rem;color:var(--text-dim);text-transform:uppercase">${T('return_col')}</div>
          <div style="font-size:1.1rem;font-weight:800;margin-top:2px" class="${pc(cur.return_pct)}">${fp(cur.return_pct)}</div>
        </div>
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:10px;text-align:center">
          <div style="font-size:.68rem;color:var(--text-dim);text-transform:uppercase">${T('max_dd')}</div>
          <div style="font-size:1.1rem;font-weight:800;margin-top:2px" class="${pc(cur.max_drawdown)}">${fmt(cur.max_drawdown, 1)}%</div>
        </div>
      </div>
    </div>`;
  }

  /* Positions */
  const pos = stratData?.positions || {};
  const posKeys = Object.keys(pos);
  if (posKeys.length > 0) {
    html += `<div class="dp-section"><div class="dp-label">${T('current_positions')} (${posKeys.length})</div><div class="pos-list">`;
    posKeys.forEach(tk => {
      const p = pos[tk];
      const pnlPct = p.pnl_pct != null ? p.pnl_pct : (p.current_price && p.avg_cost ? ((p.current_price / p.avg_cost - 1) * 100) : null);
      html += `<div class="pos-item">
        <div class="pi-ticker">${esc(tk)}</div>
        <div class="pi-shares">${p.shares || 0} ${T('shares')}${p.avg_cost != null ? ' @ $' + fmt(p.avg_cost, 2) : ''}</div>
        <div class="pi-pnl ${pc(pnlPct)}">${pnlPct != null ? fp(pnlPct) : '—'}</div>
      </div>`;
    });
    html += `</div></div>`;
  } else {
    html += `<div class="dp-section"><div class="dp-label">${T('current_positions')}</div><div class="empty"><div class="ei">📦</div>${T('no_positions')}</div></div>`;
  }

  /* Trade timeline (Level 2, each clickable for Level 3) */
  const trades = (stratData?.trades || []).slice(-20).reverse();
  if (trades.length > 0) {
    html += `<div class="dp-section"><div class="dp-label">${T('recent_trades')} (${trades.length})</div><div class="trade-timeline">`;
    trades.forEach((t, i) => {
      const act = (t.action || '').toLowerCase();
      const bc = act === 'buy' ? 'buy' : act === 'sell' ? 'sell' : 'stop';
      const hasDetail = t.reason || t.bull_summary || t.bear_summary || t.key_factor;
      html += `<div class="tt-card${hasDetail ? ' clickable' : ''}" ${hasDetail ? 'onclick="toggleTrade(this)"' : ''}>
        <div class="tt-top">
          <span class="tt-ticker">${esc(t.ticker || '—')}</span>
          <span class="tbdg ${bc}">${(t.action || '').toUpperCase()}</span>
          <span class="tt-date">${t.date || ''}</span>
        </div>
        <div class="tt-mid">
          ${t.shares != null ? t.shares + ' ' + T('shares') : ''}${t.price != null ? ' @ $' + fmt(t.price, 2) : ''}
          ${t.pnl != null ? '<span class="' + pc(t.pnl) + '" style="font-weight:700;margin-left:auto">' + (t.pnl >= 0 ? '+' : '') + ' $' + fmt(Math.abs(t.pnl), 2) + '</span>' : ''}
        </div>`;
      if (hasDetail) {
        html += `<div class="tt-detail">`;
        if (t.reason) html += `<div class="td-reason">${esc(t.reason)}</div>`;
        if (t.bull_summary) html += `<div class="td-arg bull"><div class="td-arg-label">🐂 Bull Case</div>${esc(t.bull_summary)}</div>`;
        if (t.bear_summary) html += `<div class="td-arg bear"><div class="td-arg-label">🐻 Bear Case</div>${esc(t.bear_summary)}</div>`;
        if (t.key_factor) html += `<div class="td-keyfactor">🔑 ${esc(t.key_factor)}</div>`;
        html += `</div>`;
      }
      html += `</div>`;
    });
    html += `</div></div>`;
  } else {
    html += `<div class="dp-section"><div class="dp-label">${T('recent_trades')}</div><div class="empty"><div class="ei">📭</div>${T('no_trades')}</div></div>`;
  }

  document.getElementById('dpBody').innerHTML = html;
  document.getElementById('panelOverlay').classList.add('open');
  document.getElementById('detailPanel').classList.add('open');
  document.body.style.overflow = 'hidden';

  if (navH.length > 1) setTimeout(() => renderSparkline(navH, c), 50);
}

function closePanel() {
  panelOpen = false;
  document.getElementById('panelOverlay').classList.remove('open');
  document.getElementById('detailPanel').classList.remove('open');
  document.body.style.overflow = '';
  document.querySelectorAll('.sc.selected').forEach(c => c.classList.remove('selected'));
}

function toggleTrade(el) { el.classList.toggle('expanded'); }

/* ═══════════════════════════════════════════════════════
   CARD CLICK & TOOLTIP DELEGATORS
   ═══════════════════════════════════════════════════════ */
function onCardClick(el, key, src) {
  document.querySelectorAll('.sc.selected').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  let sd;
  if (src === 'paper') {
    const idx = parseInt(document.getElementById('sSel').value) || 0;
    sd = PD?.sessions?.[idx]?.strategies?.[key];
  } else {
    const idx = parseInt(document.getElementById('bSel').value) || 0;
    sd = BD?.runs?.[idx]?.strategies?.[key];
  }
  if (sd) openPanel(sd, key, src);
}

/* ═══════════════════════════════════════════════════════
   SORTABLE TABLES
   ═══════════════════════════════════════════════════════ */
function makeSortable(id) {
  const t = document.getElementById(id); if (!t) return;
  t.querySelectorAll('th').forEach((th, ci) => {
    th.addEventListener('click', () => {
      const tb = t.querySelector('tbody'), rows = [...tb.querySelectorAll('tr')];
      const tp = th.dataset.t || 's', asc = th.classList.contains('sa');
      t.querySelectorAll('th').forEach(h => h.classList.remove('sa', 'sd'));
      th.classList.add(asc ? 'sd' : 'sa');
      rows.sort((a, b) => {
        let va = a.cells[ci]?.textContent.replace(/[%$,+▲▼🥇🥈🥉 ]/g, '') || '';
        let vb = b.cells[ci]?.textContent.replace(/[%$,+▲▼🥇🥈🥉 ]/g, '') || '';
        if (tp === 'n') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
        return va < vb ? (asc ? 1 : -1) : va > vb ? (asc ? -1 : 1) : 0;
      });
      rows.forEach(r => tb.appendChild(r));
    });
  });
}

/* ── added_date badge ── */
function makeAddedBadge(meta, sessionStart) {
  if (!meta?.added_date || !sessionStart) return '';
  if (meta.added_date <= sessionStart) return '';
  const d = new Date(meta.added_date);
  const locale = LANG === 'zh' ? 'zh-CN' : 'en-US';
  const label = d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  return `<span class="badge badge-new">${T('added')} ${label}</span>`;
}
