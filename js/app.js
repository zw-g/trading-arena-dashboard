/* ═══════════════════════════════════════════════════════
   PAPER TRADING — Main render
   ═══════════════════════════════════════════════════════ */
function renderPaper() {
  const out = document.getElementById('paperOut');
  if (!PD?.sessions?.length) { out.innerHTML = `<div class="empty"><div class="ei">📋</div>${T('no_sessions')}</div>`; return; }
  const idx = parseInt(document.getElementById('sSel').value) || 0;
  const sess = PD.sessions[idx];
  if (!sess) { out.innerHTML = `<div class="err">${T('session_not_found')}</div>`; return; }
  const strats = sess.strategies || {};
  const keys = stratOrder(Object.keys(strats));
  const cap = sess.initial_capital || 10000;

  /* ── Strategy Cards (Level 1) — sorted by rank ── */
  const ranked = keys.map(k => {
    const s = strats[k], cur = s.current || {};
    return { k, ret: cur.return_pct || 0 };
  }).sort((a, b) => b.ret - a.ret);
  const rankedKeys = ranked.map(r => r.k);

  let h = '<div class="sg">';
  rankedKeys.forEach((k, ri) => {
    const s = strats[k], c = rc(k), m = getMeta(s, k), cur = s.current || {};
    const addedBadge = makeAddedBadge(m, sess.start_date);
    const verBadge = m.version ? `<span class="badge badge-ver">v${esc(m.version)}</span>` : '';
    const rankIcon = MEDALS[ri] || (ri + 1);
    h += `<div class="sc" style="--sc-c:${c}" onclick="onCardClick(this,'${k}','paper')" data-key="${k}">
      <div class="sc-top">
        <span class="sc-rank">${rankIcon}</span>
        <span class="sc-dot" style="background:${c}"></span>
        <span class="sc-name" data-key="${k}" data-src="paper"
          onmouseenter="ttEnter(this,'paper')" onmouseleave="ttLeave()"
          onclick="event.stopPropagation();ttTap(this,'paper')">${esc(displayName(s, k))}</span>
        <span class="sc-badges">${verBadge}${addedBadge}</span>
      </div>
      <div class="sc-nav ${pc(cur.return_pct)}">${fm(cur.nav)}</div>
      <div class="sc-ret ${pc(cur.return_pct)}">${fp(cur.return_pct)}</div>
      <div class="sc-metrics"><span>${T('sharpe')} ${fmt(s.sharpe, 2)}</span><span>${T('max_dd')} ${fmt(cur.max_drawdown, 1)}%</span><span>${T('win_rate')} ${fmt(s.win_rate, 1)}%</span></div>
    </div>`;
  });
  h += '</div>';

  /* ── NAV Chart + Sector Doughnut ── */
  h += '<div class="twocol">';
  h += `<div class="box"><div class="stitle"><span class="i">📈</span> ${T('nav_history')}</div>${timePillsHTML('pNavTimePills','setPNavTimeRange')}<div style="position:relative;height:340px"><canvas id="pNavC"></canvas></div></div>`;
  h += `<div class="box"><div class="stitle"><span class="i">🥧</span> ${T('sector_dist')}</div><div class="dw"><canvas id="pSecC"></canvas><div class="dc"><div class="n" id="secN">0</div><div class="l">${T('positions_label')}</div></div></div><div class="empty" id="secE" style="display:none"><div class="ei">📦</div>${T('no_positions')}</div></div>`;
  h += '</div>';

  /* ── Leaderboard ── */
  let lb = keys.map(k => { const s = strats[k], c = s.current || {}; return { k, ret: c.return_pct || 0, trades: c.trades || 0, wr: s.win_rate || 0, dd: c.max_drawdown || 0, sharpe: s.sharpe || 0 }; }).sort((a, b) => b.ret - a.ret);
  h += `<div class="box"><div class="stitle"><span class="i">🏆</span> ${T('leaderboard')}</div>
    <table id="pLb"><thead><tr>
      <th data-c="r" data-t="n">${T('rank')}</th><th data-c="n" data-t="s">${T('strategy')}</th>
      <th data-c="ret" data-t="n">${T('return_col')}</th><th data-c="tr" data-t="n" class="hmob">${T('trades')}</th>
      <th data-c="dd" data-t="n">${T('max_dd')}</th><th data-c="sh" data-t="n" class="hmob">${T('sharpe')}</th>
    </tr></thead><tbody>${lb.map((r, i) => {
      const nm = displayName(strats[r.k], r.k);
      return `<tr><td>${MEDALS[i] || i + 1}</td><td style="color:${rc(r.k)};font-weight:600">${esc(nm)}</td>
      <td class="${pc(r.ret)}" style="font-weight:700">${fp(r.ret)}</td><td class="hmob">${r.trades}</td>
      <td class="${pc(r.dd)}">${fmt(r.dd, 1)}%</td><td class="hmob">${fmt(r.sharpe, 2)}</td></tr>`;
    }).join('')}</tbody></table></div>`;

  /* ── Recent Trades (card-style) ── */
  let allT = [];
  keys.forEach(k => (strats[k].trades || []).forEach(t => allT.push({ ...t, strat: k })));
  allT.sort((a, b) => (b.date || '') > (a.date || '') ? 1 : -1);
  allT = allT.slice(0, 12);
  h += `<div class="box"><div class="stitle"><span class="i">🔄</span> ${T('recent_trades')}</div>`;
  if (!allT.length) h += `<div class="empty"><div class="ei">📭</div>${T('no_trades')}</div>`;
  else {
    h += '<div class="tl">';
    allT.forEach(t => {
      const act = (t.action || '').toLowerCase(), bc = act === 'buy' ? 'buy' : act === 'sell' ? 'sell' : 'stop';
      h += `<div class="ti"><span class="td" style="background:${rc(t.strat)}"></span>
        <div class="tm"><div class="tk">${esc(t.ticker || '—')}</div>
        <div class="tdet">${esc(displayName(null, t.strat))} · ${t.date || ''} · ${t.shares || ''} ${T('shares')} @ $${fmt(t.price, 2)}</div></div>
        <div class="tr"><span class="tbdg ${bc}">${(t.action || '').toUpperCase()}</span>
        ${t.pnl != null ? `<div class="tpnl ${pc(t.pnl)}">${t.pnl >= 0 ? '+' : ''}$${fmt(Math.abs(t.pnl), 2)}</div>` : ''}</div></div>`;
    });
    h += '</div>';
  }
  h += '</div>';

  out.innerHTML = h;
  updateStaticText();
  updateScoreboard();
  rPNav(keys, strats, cap);
  rPSec(keys, strats);
  makeSortable('pLb');
}

/* ═══════════════════════════════════════════════════════
   BACKTESTS — Main render
   ═══════════════════════════════════════════════════════ */
function renderBt() {
  btExpandedKey = null;
  const out = document.getElementById('btOut');
  if (!BD?.runs?.length) { out.innerHTML = `<div class="empty"><div class="ei">📊</div>${T('no_bt_runs')}</div>`; return; }
  const idx = parseInt(document.getElementById('bSel').value) || 0;
  const run = BD.runs[idx]; if (!run) { out.innerHTML = `<div class="err">${T('run_not_found')}</div>`; return; }
  const strats = run.strategies || {};
  const keys = stratOrder(Object.keys(strats));
  const spy = run.spy_return;
  const runMode = getRunMode(run, strats, keys);

  let h = '';

  /* ── Session header ── */
  h += `<div class="bt-header">
    <div class="bt-header-title">📊 ${esc(run.start)} → ${esc(run.end)}</div>
    <div class="bt-header-meta">${keys.length} ${T('strategies_count')}${spy != null ? ' · SPY ' + fp(spy) : ''}</div>
    ${modeBadge(runMode, run.llm_model)}
  </div>`;

  /* ── Benchmark info box ── */
  if (spy != null) {
    const spyNav = run.spy_nav_history;
    const startDate = run.start || '—', endDate = run.end || '—';
    const tradingDays = spyNav?.length || '—';
    h += `<div class="bt-bench">
      <span class="bt-bench-label">📊 ${T('benchmark')}: S&P 500 (SPY)</span>
      <span>${T('starting_capital')}: <span class="bt-bench-val">$10,000</span></span>
      <span>${T('spy_return')}: <span class="bt-bench-val ${pc(spy)}">${fp(spy)}</span></span>
      <span>${T('period')}: <span class="bt-bench-val">${esc(startDate)} → ${esc(endDate)}</span>${typeof tradingDays === 'number' ? ' (' + tradingDays + ' ' + T('trading_days') + ')' : ''}</span>
    </div>`;
  }

  /* ── Ranking table ── */
  const ranked = keys.map(k => {
    const s = strats[k];
    return { k, name: displayName(s, k), ret: s.total_return, ann: s.annual_return, sharpe: s.sharpe, dd: s.max_drawdown, wr: s.win_rate, trades: s.trades, nav: s.final_nav, closed: s.total_closed, mode: getMode(s, k), llm: s.llm_model };
  }).sort((a, b) => (b.ret || 0) - (a.ret || 0));
  h += `<div class="box"><div class="stitle"><span class="i">🏆</span> ${T('strategy_ranking')}</div>
    <table id="bSt"><thead><tr>
      <th data-c="r" data-t="n">${T('rank')}</th>
      <th data-c="n" data-t="s">${T('strategy')}</th>
      <th data-c="nav" data-t="n">${T('final_nav')}</th>
      <th data-c="ret" data-t="n">${T('return_col')}</th>
      <th data-c="ann" data-t="n" class="hmob">${T('annual')}</th>
      <th data-c="sh" data-t="n">${T('sharpe')}</th>
      <th data-c="dd" data-t="n">${T('max_dd')}</th>
      <th data-c="wr" data-t="n" class="hmob">${T('win_rate')}</th>
      <th data-c="m" data-t="s">${T('mode')}</th>
    </tr></thead><tbody>${ranked.map((r, i) => `<tr>
      <td>${MEDALS[i] || i + 1}</td>
      <td style="color:${rc(r.k)};font-weight:600">${esc(r.name)}</td>
      <td style="font-weight:700">${r.nav ? '$' + r.nav.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '—'}</td>
      <td class="${pc(r.ret)}" style="font-weight:700">${fp(r.ret)}</td>
      <td class="${pc(r.ann)} hmob">${fp(r.ann)}</td>
      <td>${fmt(r.sharpe, 2)}</td>
      <td class="${pc(r.dd)}">${fmt(r.dd, 1)}%</td>
      <td class="hmob">${fmt(r.wr, 1)}%</td>
      <td>${modeBadge(r.mode, r.llm)}</td>
    </tr>`).join('')}</tbody></table></div>`;

  /* ── Strategy cards ── */
  h += '<div class="sg">';
  h += `<div class="sc spy" style="--sc-c:var(--c-spy)"><div class="sc-top"><span class="sc-dot" style="background:var(--c-spy)"></span><span style="font-size:.76rem;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:.4px">${T('spy_benchmark')}</span></div>
    <div class="sc-ret ${pc(spy)}" style="font-size:1.5rem;font-weight:800">$${spy != null ? Math.round(10000 * (1 + spy / 100)).toLocaleString() : '—'}</div>
    <div style="font-size:.82rem;font-weight:600" class="${pc(spy)}">${fp(spy)}</div>
    <div class="sc-sub"><span>${T('sp500_index')}</span></div></div>`;
  keys.forEach(k => {
    const s = strats[k], c = rc(k), m = getMeta(s, k);
    const diff = s.total_return != null && spy != null ? s.total_return - spy : null;
    const mode = getMode(s, k);
    const verBadge = m.version ? `<span class="badge badge-ver">v${esc(m.version)}</span>` : '';
    h += `<div class="sc" style="--sc-c:${c}" onclick="onCardClick(this,'${k}','bt')" data-key="${k}">
      <div class="sc-top"><span class="sc-dot" style="background:${c}"></span>
        <span class="sc-name" data-key="${k}" data-src="bt"
          onmouseenter="ttEnter(this,'bt')" onmouseleave="ttLeave()"
          onclick="event.stopPropagation();ttTap(this,'bt')">${esc(displayName(s, k))}</span>
        <span class="sc-badges">${verBadge}</span></div>
      <div class="sc-ret ${pc(s.total_return)}" style="font-size:1.5rem;font-weight:800">${s.final_nav ? '$' + Math.round(s.final_nav).toLocaleString() : fp(s.total_return)}</div>
      <div style="font-size:.82rem;font-weight:600" class="${pc(s.total_return)}">${fp(s.total_return)}</div>
      <div class="vs ${pc(diff)}">${T('vs_spy')}: ${fp(diff)}</div>
      <div style="margin-top:6px">${modeBadge(mode, s.llm_model)}</div>
      <div class="sc-sub"><span>${s.trades || 0} ${T('trades')}</span><span>${T('sharpe')} ${fmt(s.sharpe, 2)}</span></div>
    </div>`;
  });
  h += '</div>';

  /* ── Expandable detail container ── */
  h += '<div class="bt-expand" id="btExpand"><div class="bt-expand-inner" id="btExpandInner"></div></div>';

  /* ── Returns chart with time pills ── */
  h += `<div class="box"><div class="stitle"><span class="i">📈</span> ${T('returns_curve')}</div>${timePillsHTML('btTimePills','setBtTimeRange')}<div style="position:relative;height:340px"><canvas id="bRetC"></canvas></div></div>`;

  /* ── Heatmap ── */
  h += `<div class="box"><div class="stitle"><span class="i">🗓️</span> ${T('monthly_heatmap')}</div><div id="bHM"></div></div>`;

  /* ── Comparison Table ── */
  h += `<div class="box"><div class="stitle"><span class="i">📊</span> ${T('strategy_comparison')}</div><div id="cmpTableWrap"></div></div>`;

  out.innerHTML = h;
  updateStaticText();
  updateScoreboard();
  rBRet(keys, strats, run);
  rBHM(keys, strats);
  renderComparisonTable(keys, strats, spy);
  makeSortable('bSt');
}

/* ═══════════════════════════════════════════════════════
   BACKTESTS — Expandable detail
   ═══════════════════════════════════════════════════════ */
function toggleBtDetail(key) {
  const expand = document.getElementById('btExpand');
  const inner = document.getElementById('btExpandInner');
  if (!expand || !inner) return;

  document.querySelectorAll('#p-bt .sc.selected').forEach(c => c.classList.remove('selected'));

  if (btExpandedKey === key) {
    btExpandedKey = null;
    expand.style.maxHeight = '0';
    expand.classList.remove('open');
    dc('btMonthly');
    return;
  }

  btExpandedKey = key;
  const card = document.querySelector(`#p-bt .sc[data-key="${key}"]`);
  if (card) card.classList.add('selected');

  const idx = parseInt(document.getElementById('bSel').value) || 0;
  const run = BD.runs[idx];
  const sd = run?.strategies?.[key];
  if (!sd) return;

  const c = rc(key), m = getMeta(sd, key), mode = getMode(sd, key);
  let h = '';

  /* Header */
  h += `<div class="bt-expand-head">
    <span class="bt-expand-dot" style="background:${c}"></span>
    <span class="bt-expand-name">${esc(displayName(sd, key))}</span>
    ${modeBadge(mode, sd.llm_model)}
    ${m.version ? `<span class="badge badge-ver">v${esc(m.version)}</span>` : ''}
    <button class="bt-expand-close" onclick="event.stopPropagation();toggleBtDetail('${key}')">✕</button>
  </div>`;

  /* Description */
  const btDescPri = getDesc(m), btDescSec = getDescSec(m);
  if (btDescPri || btDescSec) {
    h += `<div style="margin-bottom:12px">`;
    if (btDescPri) h += `<div class="bt-desc">${esc(btDescPri)}</div>`;
    if (btDescSec) h += `<div class="bt-desc-en">${esc(btDescSec)}</div>`;
    if (m.type) h += `<div class="dp-meta-row" style="margin-top:6px"><span class="dp-meta-tag">${esc(m.type)}</span></div>`;
    h += `</div>`;
  }

  /* Methodology */
  const btMethPri = getMethod(m), btMethSec = getMethodSec(m);
  if (btMethPri || btMethSec) {
    h += `<div class="bt-method"><div class="dp-label">📐 ${T('methodology')}</div>`;
    if (btMethPri) h += `<div class="bt-desc">${esc(btMethPri)}</div>`;
    if (btMethSec) h += `<div class="bt-desc-en">${esc(btMethSec)}</div>`;
    h += `</div>`;
  }

  /* AI Mode & Cost & Coverage */
  if (m.ai_mode || m.cost_formula || m.signals_per_day) {
    h += `<div class="bt-info-row">`;
    if (m.ai_mode) h += `<div class="bt-info-item"><span class="bt-info-label">🤖 ${T('ai_mode')}</span><span>${esc(m.ai_mode)}</span></div>`;
    if (m.cost_formula) h += `<div class="bt-info-item"><span class="bt-info-label">💰 ${T('cost_formula')}</span><span>${esc(m.cost_formula)}</span></div>`;
    if (m.signals_per_day) h += `<div class="bt-info-item"><span class="bt-info-label">📊 ${T('coverage')}</span><span>${esc(m.signals_per_day)}</span></div>`;
    h += `</div>`;
  }

  /* Schedule & Risk from strategy_configs.json */
  const bsc = SC[key] || {};
  const bsched = bsc.schedule || {};
  const brm = bsc.risk_management || bsc.risk || {};
  const bschedKeys = Object.keys(bsched);
  const bExitRules = brm.position_exit_rules || [];
  const bSizing = brm.position_sizing || {};
  if (bschedKeys.length || bExitRules.length) {
    h += `<div style="margin-top:12px"><div class="dp-label">📅 ${T('schedule')}</div><div class="bt-info-row">`;
    bschedKeys.forEach(sk => {
      const s = bsched[sk]; if (!s || typeof s !== 'object') return;
      h += `<div class="bt-info-item"><span class="bt-info-label">⏰ ${esc(sk.replace(/_/g, ' '))}</span><span style="font-weight:600">${esc((s.frequency || '') + (s.time ? ' at ' + s.time : '') + (s.market_hours_only ? ' (mkt hrs)' : ''))}</span></div>`;
    });
    h += `</div></div>`;
    if (bExitRules.length) {
      h += `<div style="margin-top:8px"><div class="dp-label">🛡️ ${T('exit_rules')}</div><div style="display:flex;flex-wrap:wrap;gap:6px">`;
      bExitRules.forEach(r => {
        const t = r.trigger_pct != null ? ((r.trigger_pct > 0 ? '+' : '') + Math.round(r.trigger_pct * 100) + '%') : '';
        h += `<div style="background:var(--bg);border-radius:var(--radius-sm);padding:6px 10px;font-size:.76rem"><b>${esc(r.name?.replace(/_/g, ' ') || '')}</b>${t ? ' <span style="font-weight:700">(' + t + ')</span>' : ''} → ${esc(r.action?.replace(/_/g, ' ') || '')}</div>`;
      });
      h += `</div></div>`;
    }
  }

  /* Fallback note */
  if (mode === 'fallback') {
    h += `<div class="bt-fallback-note">⚙️ ${T('fallback_note')}</div>`;
  }

  /* Metrics grid */
  const cap = 10000;
  const finalNav = sd.final_nav || (sd.total_return != null ? cap * (1 + sd.total_return / 100) : null);
  const totalClosed = sd.total_closed || sd.trades || 0;
  h += `<div class="bt-metrics">
    <div class="bt-metric"><div class="bt-metric-label">${T('total_return')}</div><div class="bt-metric-value ${pc(sd.total_return)}">${fp(sd.total_return)}</div></div>
    <div class="bt-metric"><div class="bt-metric-label">${T('final_nav')}</div><div class="bt-metric-value">${finalNav != null ? fm(Math.round(finalNav)) : '—'}</div></div>
    <div class="bt-metric"><div class="bt-metric-label">${T('annual_return')}</div><div class="bt-metric-value ${pc(sd.annual_return)}">${fp(sd.annual_return)}</div></div>
    <div class="bt-metric"><div class="bt-metric-label">${T('sharpe_ratio')}</div><div class="bt-metric-value">${fmt(sd.sharpe, 2)}</div></div>
    <div class="bt-metric"><div class="bt-metric-label">${T('max_drawdown')}</div><div class="bt-metric-value ${pc(sd.max_drawdown)}">${fmt(sd.max_drawdown, 1)}%</div></div>
    <div class="bt-metric"><div class="bt-metric-label">${T('win_rate')}</div><div class="bt-metric-value">${fmt(sd.win_rate, 1)}%</div></div>
    <div class="bt-metric"><div class="bt-metric-label">${T('total_closed')}</div><div class="bt-metric-value">${totalClosed}</div></div>
  </div>`;

  /* Monthly returns bar chart */
  const mr = sd.monthly_returns || {};
  const mrKeys = Object.keys(mr).sort();
  if (mrKeys.length) {
    h += `<div style="margin-top:20px"><div class="dp-label">📅 ${T('monthly_returns')}</div>
      <div class="bt-monthly-chart"><canvas id="btMonthlyC" height="180"></canvas></div></div>`;
  }

  /* Top Winners & Losers */
  const tw = sd.top_winners || [], tl = sd.top_losers || [];
  if (tw.length || tl.length) {
    h += `<div style="margin-top:20px"><div class="dp-label">🏆 ${T('top_trades')}</div><div class="bt-top-trades">`;
    if (tw.length) {
      h += `<div class="bt-tt-section"><h4>🟢 ${T('top_winners')}</h4><table><thead><tr><th>${T('ticker')}</th><th>${T('pnl')}</th><th>${T('date')}</th></tr></thead><tbody>`;
      tw.forEach(t => { h += `<tr><td style="font-weight:600">${esc(t.ticker)}</td><td class="pos" style="font-weight:700">+$${fmt(Math.abs(t.pnl), 0)}</td><td style="font-size:.78rem;color:var(--text-dim)">${t.date || ''}</td></tr>`; });
      h += `</tbody></table></div>`;
    }
    if (tl.length) {
      h += `<div class="bt-tt-section"><h4>🔴 ${T('top_losers')}</h4><table><thead><tr><th>${T('ticker')}</th><th>${T('pnl')}</th><th>${T('date')}</th></tr></thead><tbody>`;
      tl.forEach(t => { h += `<tr><td style="font-weight:600">${esc(t.ticker)}</td><td class="neg" style="font-weight:700">-$${fmt(Math.abs(t.pnl), 0)}</td><td style="font-size:.78rem;color:var(--text-dim)">${t.date || ''}</td></tr>`; });
      h += `</tbody></table></div>`;
    }
    h += `</div></div>`;
  }

  /* NAV sparkline */
  const navH = sd.nav_history || [];
  if (navH.length > 1) {
    h += `<div style="margin-top:20px"><div class="dp-label">📈 ${T('nav_hist')}</div><div class="dp-spark"><canvas id="btDetailSpark" height="120"></canvas></div></div>`;
  }

  inner.innerHTML = h;
  dc('btMonthly'); dc('btDetailSpark');

  expand.classList.add('open');
  void inner.offsetHeight;
  expand.style.maxHeight = inner.scrollHeight + 48 + 'px';

  setTimeout(() => expand.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);

  const renderCharts = () => {
    if (mrKeys.length) renderBtMonthly(mrKeys, mr, c);
    if (navH.length > 1) renderBtDetailSpark(navH, c);
    requestAnimationFrame(() => { expand.style.maxHeight = inner.scrollHeight + 48 + 'px'; });
  };
  let rendered = false;
  const onEnd = (e) => {
    if (rendered || e.propertyName !== 'max-height') return;
    rendered = true; expand.removeEventListener('transitionend', onEnd);
    renderCharts();
  };
  expand.addEventListener('transitionend', onEnd);
  setTimeout(() => { if (!rendered) { rendered = true; renderCharts(); } }, 600);
}

/* ═══════════════════════════════════════════════════════
   INITIALIZATION
   ═══════════════════════════════════════════════════════ */
(function init() {
  /* Theme */
  setTheme(detectTheme());

  /* Language */
  LANG = detectLang();
  updateLangBtn();
  updateStaticText();

  /* Load data */
  loadAll();

  /* Event listeners */
  document.addEventListener('click', e => {
    if (!e.target.closest('.sc-name') && !e.target.closest('.stt')) hideTT();
  });
  sTT.addEventListener('mouseleave', hideTT);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panelOpen) closePanel(); });

  /* Listen for system theme changes */
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) setTheme(e.matches ? 'dark' : 'light');
  });

  /* Smart refresh */
  function getRefreshInterval() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = hour >= 6 && hour <= 13;
    if (isWeekday && isMarketHours) return 5 * 60 * 1000;
    return 30 * 60 * 1000;
  }

  let refreshTimer = setInterval(loadAll, getRefreshInterval());
  setInterval(() => {
    clearInterval(refreshTimer);
    refreshTimer = setInterval(loadAll, getRefreshInterval());
  }, 15 * 60 * 1000);
})();
