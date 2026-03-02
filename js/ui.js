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
  /* Mobile bottom nav labels */
  document.querySelectorAll('.mob-nav-btn').forEach(b => {
    const t = b.dataset.t, lbl = b.querySelector('.mob-nav-lbl');
    if (!lbl) return;
    if (t === 'paper') lbl.textContent = T('paper_trading');
    else if (t === 'bt') lbl.textContent = T('backtests');
    else if (t === 'live') lbl.textContent = T('live_trading');
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
  if (btn) btn.innerHTML = t === 'dark'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
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
  /* Sync mobile bottom nav */
  document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  updateStaticText();
  updateScoreboard();
  /* Render deferred charts for newly visible tab */
  flushDeferredCharts(t);
  /* Resize any charts that were created while tab was hidden (canvas width=0) */
  requestAnimationFrame(() => {
    const pane = document.getElementById('p-' + t);
    if (pane) pane.querySelectorAll('canvas').forEach(c => {
      const chart = Chart.getChart(c);
      if (chart) chart.resize();
    });
  });
}

/* ═══════════════════════════════════════════════════════
   ARENA SCOREBOARD
   ═══════════════════════════════════════════════════════ */
function updateScoreboard() {
  const el = document.getElementById('scoreboard');
  if (!el) return;

  let items = [];

  if (currentTab === 'paper' && PD?.sessions?.length) {
    const idx = parseInt(document.getElementById('sSel')?.value) || 0;
    const sess = PD.sessions[idx];
    if (sess) {
      const strats = sess.strategies || {};
      items = Object.keys(strats).map(k => {
        const s = strats[k], cur = s.current || {};
        return { key: k, name: displayName(s, k), ret: cur.return_pct || 0 };
      }).sort((a, b) => b.ret - a.ret);
    }
  } else if (currentTab === 'bt' && BD?.runs?.length) {
    const idx = parseInt(document.getElementById('bSel')?.value) || 0;
    const run = BD.runs[idx];
    if (run) {
      const strats = run.strategies || {};
      items = Object.keys(strats).map(k => {
        const s = strats[k];
        return { key: k, name: displayName(s, k), ret: s.total_return || 0 };
      }).sort((a, b) => b.ret - a.ret);
      if (run.spy_return != null) {
        items.push({ key: 'SPY', name: 'SPY', ret: run.spy_return, isSpy: true });
      }
    }
  }

  if (!items.length) { el.innerHTML = ''; return; }

  let html = '<div class="scoreboard-track">';
  items.forEach((item, i) => {
    const medal = MEDALS[i] || '';
    const retClass = pc(item.ret);
    const color = item.isSpy ? 'var(--c-spy)' : rc(item.key);
    if (i > 0) html += '<span class="sb-sep">·</span>';
    html += `<span class="sb-item">`;
    if (!item.isSpy) html += `<span class="sb-rank">#${i + 1}</span>`;
    if (medal && !item.isSpy) html += `<span class="sb-medal">${medal}</span>`;
    html += `<span class="sb-name" style="color:${color}">${esc(item.name)}</span>`;
    html += `<span class="sb-ret ${retClass}">${fp(item.ret)}</span>`;
    html += `</span>`;
  });
  html += '</div>';
  el.innerHTML = html;
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

/* ── KPI card helper ── */
function kpiCard(label, value, indicator) {
  const arrow = indicator == null ? ''
    : indicator > 0.001 ? '<span class="kpi-arrow pos">▲</span>'
    : indicator < -0.001 ? '<span class="kpi-arrow neg">▼</span>' : '';
  const valClass = indicator == null ? '' : pc(indicator);
  return `<div class="kpi-card"><div class="kpi-label">${label}</div><div class="kpi-value ${valClass}">${value}${arrow}</div></div>`;
}

/* ── Holdings table builder ── */
function buildHoldingsTable(pos, posKeys) {
  const items = posKeys.map(tk => {
    const p = pos[tk];
    const pnlPct = p.pnl_pct != null ? p.pnl_pct : (p.current_price && p.avg_cost ? ((p.current_price / p.avg_cost - 1) * 100) : null);
    return { ticker: tk, ...p, pnlPct };
  }).sort((a, b) => (b.pnlPct || 0) - (a.pnlPct || 0));

  let html = `<div class="dp-section"><div class="dp-label">💼 ${T('holdings')} (${posKeys.length})</div>`;
  html += `<div style="overflow-x:auto"><table class="holdings-table">`;
  html += `<thead><tr><th>${T('ticker')}</th><th>${T('shares')}</th><th>${T('entry_price')}</th><th>${T('current_price')}</th><th>${T('pnl_col')}</th><th>${T('weight_pct')}</th></tr></thead>`;
  html += `<tbody>`;
  items.forEach(item => {
    html += `<tr>
      <td style="font-weight:700">${esc(item.ticker)}</td>
      <td>${item.shares || 0}</td>
      <td>${item.avg_cost != null ? '$' + fmt(item.avg_cost, 2) : '—'}</td>
      <td>${item.current_price != null ? '$' + fmt(item.current_price, 2) : '—'}</td>
      <td class="${pc(item.pnlPct)}" style="font-weight:700">${item.pnlPct != null ? fp(item.pnlPct) : '—'}</td>
      <td>${item.weight != null ? fmt(item.weight, 1) + '%' : '—'}</td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  return html;
}

function openPanel(stratData, key, source) {
  panelOpen = true;
  /* Destroy previous panel charts */
  dc('dpSpark'); dc('dpDrawdown'); dc('dpMonthly');

  const m = getMeta(stratData, key), c = rc(key);
  document.getElementById('dpDot').style.background = c;
  document.getElementById('dpTitle').textContent = m.name || displayName(stratData, key);
  const vEl = document.getElementById('dpVer');
  if (m.version) { vEl.textContent = 'v' + m.version; vEl.style.display = ''; } else vEl.style.display = 'none';

  let html = '';
  const isPaper = source === 'paper';
  const cur = stratData?.current || {};

  /* ── 1. KPI Grid (2×3) ── */
  const totalReturn = isPaper ? (cur.return_pct ?? stratData.total_return) : stratData.total_return;
  const sharpe = stratData.sharpe;
  const maxDD = isPaper ? (cur.max_drawdown ?? stratData.max_drawdown) : stratData.max_drawdown;
  const winRate = stratData.win_rate;
  const totalTrades = isPaper ? (cur.trades || 0) : (stratData.trades || stratData.total_closed || 0);
  const avgHoldDays = stratData.avg_hold_days;

  html += `<div class="kpi-grid">`;
  html += kpiCard(T('total_return'), fp(totalReturn), totalReturn);
  html += kpiCard(T('sharpe_ratio'), fmt(sharpe, 2), sharpe);
  html += kpiCard(T('max_dd'), maxDD != null ? fmt(maxDD, 1) + '%' : '—', maxDD);
  html += kpiCard(T('win_rate'), winRate != null ? fmt(winRate, 1) + '%' : '—', winRate != null ? winRate - 50 : null);
  html += kpiCard(T('trades'), totalTrades, null);
  html += kpiCard(T('avg_hold_days'), avgHoldDays != null ? fmt(avgHoldDays, 1) + 'd' : '—', null);
  html += `</div>`;

  /* ── 2. Drawdown Chart ── */
  const navH = stratData?.nav_history || [];
  if (navH.length > 1) {
    let peak = -Infinity, maxDDVal = 0, maxDDDate = '';
    navH.forEach(h => {
      if (h.nav > peak) peak = h.nav;
      const dd = ((h.nav - peak) / peak) * 100;
      if (dd < maxDDVal) { maxDDVal = dd; maxDDDate = h.date; }
    });
    html += `<div class="dp-section">
      <div class="dp-label">📉 ${T('drawdown')}</div>
      <div class="dp-chart"><canvas id="dpDrawdown"></canvas></div>
      <div class="dp-dd-annotation">⚠️ ${T('max_dd')}: <strong class="neg">${fmt(maxDDVal, 2)}%</strong> (${maxDDDate})</div>
    </div>`;
  }

  /* ── 3. Monthly Returns Bar Chart ── */
  const mr = stratData?.monthly_returns || {};
  const mrKeys = Object.keys(mr).sort();
  if (mrKeys.length) {
    html += `<div class="dp-section">
      <div class="dp-label">📊 ${T('monthly_returns')}</div>
      <div class="dp-chart"><canvas id="dpMonthly"></canvas></div>
    </div>`;
  }

  /* ── 4. NAV Sparkline ── */
  if (navH.length > 1) {
    html += `<div class="dp-section"><div class="dp-label">📈 ${T('nav_hist')}</div><div class="dp-spark"><canvas id="dpSpark"></canvas></div></div>`;
  }

  /* ── 5. Holdings Table ── */
  const pos = stratData?.positions || {};
  const posKeys = Object.keys(pos);
  if (posKeys.length > 0) {
    html += buildHoldingsTable(pos, posKeys);
  } else if (isPaper) {
    html += `<div class="dp-section"><div class="dp-label">💼 ${T('holdings')}</div><div class="empty"><div class="ei">📦</div>${T('no_positions')}</div></div>`;
  }

  /* ── 6. Description section ── */
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

  /* ── 7. Methodology section ── */
  const methPri = getMethod(m), methSec = getMethodSec(m);
  if (methPri || methSec) {
    html += `<div class="dp-section"><div class="bt-method"><div class="dp-label">📐 ${T('methodology')}</div>`;
    if (methPri) html += `<div class="bt-desc">${esc(methPri)}</div>`;
    if (methSec) html += `<div class="bt-desc-en">${esc(methSec)}</div>`;
    html += `</div></div>`;
  }

  /* ── 8. AI Mode & Cost & Coverage ── */
  if (m.ai_mode || m.cost_formula || m.signals_per_day) {
    html += `<div class="dp-section"><div class="bt-info-row">`;
    if (m.ai_mode) html += `<div class="bt-info-item"><span class="bt-info-label">🤖 ${T('ai_mode')}</span><span>${esc(m.ai_mode)}</span></div>`;
    if (m.cost_formula) html += `<div class="bt-info-item"><span class="bt-info-label">💰 ${T('cost_formula')}</span><span>${esc(m.cost_formula)}</span></div>`;
    if (m.signals_per_day) html += `<div class="bt-info-item"><span class="bt-info-label">📊 ${T('coverage')}</span><span>${esc(m.signals_per_day)}</span></div>`;
    html += `</div></div>`;
  }

  /* ── 9. Schedule & Risk from strategy_configs.json ── */
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

  /* ── T24: Completed trades list (if available) ── */
  const completedTrades = stratData?.completed_trades || [];
  if (completedTrades.length) {
    html += `<div class="dp-section"><div class="dp-label">📋 ${T('trade_list')} (${completedTrades.length})</div><div id="panelTradeList" class="tl-wrap"></div></div>`;
  }

  /* ── 10. Trade timeline (Level 2, each clickable for Level 3) ── */
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

  /* Render charts after DOM insertion */
  setTimeout(() => {
    if (navH.length > 1) {
      renderDrawdownChart(navH, c);
      renderSparkline(navH, c);
    }
    if (mrKeys.length) renderPanelMonthlyChart(mr);
    /* T24: Init completed trades list in panel */
    if (completedTrades.length) {
      buildTradeList('panelTradeList', completedTrades, { showStrategy: false });
    }
  }, 50);
}

function closePanel() {
  panelOpen = false;
  dc('dpSpark'); dc('dpDrawdown'); dc('dpMonthly');
  destroyTradeList('panelTradeList');
  document.getElementById('panelOverlay').classList.remove('open');
  document.getElementById('detailPanel').classList.remove('open');
  document.body.style.overflow = '';
  document.querySelectorAll('.sc.selected').forEach(c => c.classList.remove('selected'));
}

function toggleTrade(el) { el.classList.toggle('expanded'); }

/* ═══════════════════════════════════════════════════════
   T24: TRADE LIST WITH VIRTUAL SCROLLING
   ═══════════════════════════════════════════════════════ */

/** Global state for virtual scroll instances. */
const _tlState = {};
const TL_ROW_H = 36;
const TL_DETAIL_H = 180;

/**
 * Build a trade list component inside the given container.
 * @param {string} id       – unique id for this trade list instance
 * @param {Array}  trades   – array of completed_trade objects
 * @param {Object} opts     – { showStrategy: bool, stratColor: fn(stratKey)->color }
 */
function buildTradeList(id, trades, opts) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  const showStrat = opts?.showStrategy || false;

  const state = {
    all: trades,
    filtered: trades,
    sortKey: 'pnl_pct',
    sortAsc: false,
    filter: '',
    expanded: null,
    showStrat,
    opts: opts || {},
  };
  _tlState[id] = state;

  /* Build the DOM structure */
  const hCls = showStrat ? 'tl-header tl-header-all' : 'tl-header';
  let html = '';

  /* Toolbar */
  html += `<div class="tl-toolbar">
    <input class="tl-search" type="text" placeholder="${T('search_ticker')}"
      oninput="_tlFilter('${id}',this.value)">
    <span class="tl-stats" id="${id}-stats"></span>
  </div>`;

  /* Header */
  html += `<div class="${hCls}" id="${id}-hdr">`;
  const cols = _tlCols(showStrat);
  cols.forEach(c => {
    const active = c.key === state.sortKey;
    const cls = active ? (state.sortAsc ? 'tl-th tl-sa' : 'tl-th tl-sd') : 'tl-th';
    html += `<div class="${cls}" data-k="${c.key}" onclick="_tlSort('${id}','${c.key}')">${c.label}</div>`;
  });
  html += `</div>`;

  /* Viewport */
  html += `<div class="tl-viewport" id="${id}-vp">
    <div class="tl-viewport-inner" id="${id}-inner"></div>
  </div>`;

  wrap.innerHTML = html;

  /* Attach scroll listener */
  const vp = document.getElementById(id + '-vp');
  if (vp) {
    let ticking = false;
    vp.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(() => { _tlRender(id); ticking = false; }); }
    });
  }

  /* Initial sort + render (defer to ensure DOM measurements are ready) */
  requestAnimationFrame(() => _tlApply(id));
}

function _tlCols(showStrat) {
  const cols = [
    { key: 'ticker', label: T('ticker') },
  ];
  if (showStrat) cols.push({ key: 'strategy', label: T('strategy_col') });
  cols.push(
    { key: 'direction', label: T('direction') },
    { key: 'entry_date', label: T('entry_date') },
    { key: 'exit_date', label: T('exit_date') },
    { key: 'entry_price', label: T('entry_price_col') },
    { key: 'exit_price', label: T('exit_price_col') },
    { key: 'pnl', label: T('pnl_dollar') },
    { key: 'pnl_pct', label: T('pnl_pct_col') },
    { key: 'hold_days', label: T('hold_days_col') },
    { key: 'exit_type', label: T('exit_type_col') },
  );
  return cols;
}

function _tlFilter(id, text) {
  const s = _tlState[id]; if (!s) return;
  s.filter = text.toLowerCase();
  s.expanded = null;
  _tlApply(id);
}

function _tlSort(id, key) {
  const s = _tlState[id]; if (!s) return;
  if (s.sortKey === key) { s.sortAsc = !s.sortAsc; }
  else { s.sortKey = key; s.sortAsc = false; }
  s.expanded = null;

  /* Update header indicators */
  const hdr = document.getElementById(id + '-hdr');
  if (hdr) {
    hdr.querySelectorAll('.tl-th').forEach(th => {
      th.classList.remove('tl-sa', 'tl-sd');
      if (th.dataset.k === key) th.classList.add(s.sortAsc ? 'tl-sa' : 'tl-sd');
    });
  }
  _tlApply(id);
}

function _tlApply(id) {
  const s = _tlState[id]; if (!s) return;

  /* Filter */
  let rows = s.all;
  if (s.filter) {
    rows = rows.filter(r => (r.ticker || '').toLowerCase().includes(s.filter));
  }

  /* Sort */
  const sk = s.sortKey, asc = s.sortAsc;
  rows = [...rows].sort((a, b) => {
    let va = a[sk], vb = b[sk];
    if (va == null) va = '';
    if (vb == null) vb = '';
    if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb + '').toLowerCase(); }
    if (va < vb) return asc ? -1 : 1;
    if (va > vb) return asc ? 1 : -1;
    return 0;
  });

  s.filtered = rows;

  /* Update stats */
  const statsEl = document.getElementById(id + '-stats');
  if (statsEl) {
    statsEl.textContent = T('showing_trades')
      .replace('{n}', rows.length)
      .replace('{total}', s.all.length);
  }

  _tlRender(id);
}

function _tlToggle(id, idx) {
  const s = _tlState[id]; if (!s) return;
  s.expanded = s.expanded === idx ? null : idx;
  _tlRender(id);
}

function _tlRowTop(idx, expanded) {
  if (expanded == null || idx <= expanded) return idx * TL_ROW_H;
  return idx * TL_ROW_H + TL_DETAIL_H;
}

function _tlRender(id) {
  const s = _tlState[id]; if (!s) return;
  const vp = document.getElementById(id + '-vp');
  const inner = document.getElementById(id + '-inner');
  if (!vp || !inner) return;

  const N = s.filtered.length;
  const exp = s.expanded;
  const totalH = N * TL_ROW_H + (exp != null ? TL_DETAIL_H : 0);
  inner.style.height = totalH + 'px';

  if (!N) {
    inner.innerHTML = `<div class="tl-empty"><div class="tl-empty-icon">📭</div><div class="tl-empty-text">${T('no_completed_trades')}</div></div>`;
    return;
  }

  const scrollTop = vp.scrollTop;
  const viewH = vp.clientHeight || 480; /* fallback when parent is display:none */
  const buffer = 5;

  /* Find visible range */
  let startIdx, endIdx;
  if (exp == null) {
    startIdx = Math.max(0, Math.floor(scrollTop / TL_ROW_H) - buffer);
    endIdx = Math.min(N, Math.ceil((scrollTop + viewH) / TL_ROW_H) + buffer);
  } else {
    /* Account for the expanded detail gap */
    const detailTop = (exp + 1) * TL_ROW_H;
    const detailBot = detailTop + TL_DETAIL_H;
    if (scrollTop + viewH < detailTop) {
      /* All visible rows are before the detail */
      startIdx = Math.max(0, Math.floor(scrollTop / TL_ROW_H) - buffer);
      endIdx = Math.min(N, Math.ceil((scrollTop + viewH) / TL_ROW_H) + buffer);
    } else if (scrollTop > detailBot) {
      /* All visible rows are after the detail */
      startIdx = Math.max(0, Math.floor((scrollTop - TL_DETAIL_H) / TL_ROW_H) - buffer);
      endIdx = Math.min(N, Math.ceil((scrollTop + viewH - TL_DETAIL_H) / TL_ROW_H) + buffer);
    } else {
      /* Detail is in view — render around it */
      startIdx = Math.max(0, Math.floor(scrollTop / TL_ROW_H) - buffer);
      endIdx = Math.min(N, Math.ceil((scrollTop + viewH - TL_DETAIL_H) / TL_ROW_H) + buffer + 2);
    }
  }

  let html = '';
  for (let i = startIdx; i < endIdx; i++) {
    const row = s.filtered[i];
    const top = _tlRowTop(i, exp);
    const isExp = i === exp;
    const pnlCls = (row.pnl_pct || 0) >= 0 ? 'pos' : 'neg';
    const rowCls = 'tl-row' + (s.showStrat ? ' tl-row-all' : '') + (isExp ? ' tl-row-expanded' : '');

    html += `<div class="${rowCls}" style="top:${top}px;height:${TL_ROW_H}px" onclick="_tlToggle('${id}',${i})">`;
    html += `<div class="tl-td tl-td-ticker">${esc(row.ticker || '—')}</div>`;
    if (s.showStrat) {
      const sc = s.opts.stratColor ? s.opts.stratColor(row.strategy) : 'var(--text-dim)';
      html += `<div class="tl-td"><span class="tl-strat-badge" style="color:${sc}">${esc(displayName(null, row.strategy || ''))}</span></div>`;
    }
    html += `<div class="tl-td tl-td-dir ${(row.direction || 'long').toLowerCase()}">${(row.direction || 'long') === 'long' ? T('long_dir') : T('short_dir')}</div>`;
    html += `<div class="tl-td">${row.entry_date || '—'}</div>`;
    html += `<div class="tl-td">${row.exit_date || '—'}</div>`;
    html += `<div class="tl-td">$${fmt(row.entry_price, 2)}</div>`;
    html += `<div class="tl-td">$${fmt(row.exit_price, 2)}</div>`;
    html += `<div class="tl-td tl-td-pnl ${pnlCls}">${row.pnl != null ? ((row.pnl >= 0 ? '+' : '') + '$' + fmt(Math.abs(row.pnl), 2)) : '—'}</div>`;
    html += `<div class="tl-td tl-td-pnl ${pnlCls}">${row.pnl_pct != null ? ((row.pnl_pct >= 0 ? '+' : '') + fmt(row.pnl_pct, 2) + '%') : '—'}</div>`;
    html += `<div class="tl-td">${row.hold_days != null ? row.hold_days + 'd' : '—'}</div>`;
    html += `<div class="tl-td">${_tlExitBadge(row.exit_type)}</div>`;
    html += `</div>`;

    if (isExp) {
      const detTop = top + TL_ROW_H;
      html += `<div class="tl-detail" style="top:${detTop}px;height:${TL_DETAIL_H}px">`;
      html += _tlDetailHTML(row, s);
      html += `</div>`;
    }
  }

  inner.innerHTML = html;
}

function _tlExitBadge(exitType) {
  if (!exitType) return '<span class="tl-td-exit other">—</span>';
  const et = exitType.toLowerCase();
  if (et.includes('stop_loss') || et === 'sl') return `<span class="tl-td-exit sl">${T('exit_stop_loss')}</span>`;
  if (et.includes('take_profit') || et === 'tp') return `<span class="tl-td-exit tp">${T('exit_take_profit')}</span>`;
  if (et.includes('signal')) return `<span class="tl-td-exit sig">${et.includes('reversal') ? T('exit_signal_reversal') : T('exit_signal_sell')}</span>`;
  return `<span class="tl-td-exit other">${esc(exitType.replace(/_/g, ' '))}</span>`;
}

function _tlDetailHTML(row, state) {
  let h = '<div class="tl-detail-grid">';

  h += _tlDetailItem(T('ticker'), row.ticker || '—');
  h += _tlDetailItem(T('direction'), row.direction === 'short' ? '🔴 ' + T('short_dir') : '🟢 ' + T('long_dir'));
  h += _tlDetailItem(T('entry_date'), row.entry_date || '—');
  h += _tlDetailItem(T('exit_date'), row.exit_date || '—');
  h += _tlDetailItem(T('entry_price_col'), '$' + fmt(row.entry_price, 2));
  h += _tlDetailItem(T('exit_price_col'), '$' + fmt(row.exit_price, 2));

  const pnlCls = (row.pnl || 0) >= 0 ? 'pos' : 'neg';
  h += `<div class="tl-detail-item"><div class="tl-detail-label">${T('pnl_dollar')}</div><div class="tl-detail-value ${pnlCls}">${row.pnl != null ? ((row.pnl >= 0 ? '+' : '') + '$' + fmt(Math.abs(row.pnl), 2)) : '—'}</div></div>`;
  h += `<div class="tl-detail-item"><div class="tl-detail-label">${T('pnl_pct_col')}</div><div class="tl-detail-value ${pnlCls}">${row.pnl_pct != null ? ((row.pnl_pct >= 0 ? '+' : '') + fmt(row.pnl_pct, 2) + '%') : '—'}</div></div>`;

  h += _tlDetailItem(T('hold_days_col'), row.hold_days != null ? row.hold_days + ' days' : '—');
  h += _tlDetailItem(T('exit_type_col'), _tlExitBadge(row.exit_type));

  if (row.shares != null) h += _tlDetailItem(T('shares'), row.shares);
  if (state.showStrat && row.strategy) {
    const sc = state.opts.stratColor ? state.opts.stratColor(row.strategy) : 'var(--text)';
    h += `<div class="tl-detail-item"><div class="tl-detail-label">${T('strategy_col')}</div><div class="tl-detail-value" style="color:${sc}">${esc(displayName(null, row.strategy))}</div></div>`;
  }
  if (row.signal_confidence != null) {
    h += _tlDetailItem(T('confidence_col'), (row.signal_confidence * 100).toFixed(0) + '%');
  }

  h += '</div>';
  return h;
}

function _tlDetailItem(label, value) {
  return `<div class="tl-detail-item"><div class="tl-detail-label">${label}</div><div class="tl-detail-value">${value}</div></div>`;
}

/** Destroy a trade list instance and clean up. */
function destroyTradeList(id) {
  delete _tlState[id];
  const el = document.getElementById(id);
  if (el) el.innerHTML = '';
}

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

/* ═══════════════════════════════════════════════════════
   CAROUSEL DOT INDICATORS (Mobile)
   ═══════════════════════════════════════════════════════ */
function initCarouselDots(sgEl) {
  if (!sgEl) return;
  /* Remove any existing dots container */
  const prev = sgEl.parentNode.querySelector('.carousel-dots');
  if (prev) prev.remove();

  const cards = sgEl.querySelectorAll('.sc');
  if (cards.length < 2) return;

  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'carousel-dots';
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' on' : '');
    dot.setAttribute('aria-label', 'Card ' + (i + 1));
    dot.addEventListener('click', () => {
      cards[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
    dotsWrap.appendChild(dot);
  });
  sgEl.after(dotsWrap);

  /* Scroll observer to update active dot */
  let ticking = false;
  sgEl.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollLeft = sgEl.scrollLeft;
      const sgRect = sgEl.getBoundingClientRect();
      const center = sgRect.left + sgRect.width / 2;
      let closest = 0, minDist = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const cardCenter = r.left + r.width / 2;
        const dist = Math.abs(cardCenter - center);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      dotsWrap.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('on', i === closest));
      ticking = false;
    });
  }, { passive: true });
}

/* Call after renderPaper / renderBt injects .sg */
function refreshCarouselDots() {
  if (window.innerWidth > 768) return;
  document.querySelectorAll('.pane.on .sg').forEach(initCarouselDots);
}
