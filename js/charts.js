/* ═══════════════════════════════════════════════════════
   CHART.JS RENDERING
   ═══════════════════════════════════════════════════════ */

/* ── Computed style helper ── */
function getCS(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

/* ═══════════════════════════════════════════════════════
   LTTB DOWNSAMPLING
   ═══════════════════════════════════════════════════════ */

/**
 * Largest-Triangle-Three-Buckets: returns indices to keep.
 * yValues: array of numbers (nulls treated as 0).
 * threshold: target number of points.
 */
function lttbIndices(yValues, threshold) {
  const len = yValues.length;
  if (threshold >= len || threshold <= 2) return Array.from({ length: len }, (_, i) => i);
  const indices = [0];
  const bucketSize = (len - 2) / (threshold - 2);
  let a = 0;
  for (let i = 0; i < threshold - 2; i++) {
    const bStart = Math.floor((i + 1) * bucketSize) + 1;
    const bEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, len);
    const nStart = Math.min(Math.floor((i + 2) * bucketSize) + 1, len);
    const nEnd = Math.min(Math.floor((i + 3) * bucketSize) + 1, len);
    let avgY = 0, cnt = 0;
    for (let j = nStart; j < nEnd; j++) { avgY += (yValues[j] ?? 0); cnt++; }
    avgY = cnt ? avgY / cnt : (yValues[len - 1] ?? 0);
    const avgX = cnt ? (nStart + nEnd - 1) / 2 : len - 1;
    let maxArea = -1, maxIdx = bStart;
    const pAY = yValues[a] ?? 0;
    for (let j = bStart; j < bEnd; j++) {
      const area = Math.abs((a - avgX) * ((yValues[j] ?? 0) - pAY) - (a - j) * (avgY - pAY));
      if (area > maxArea) { maxArea = area; maxIdx = j; }
    }
    indices.push(maxIdx);
    a = maxIdx;
  }
  indices.push(len - 1);
  return indices;
}

/** Downsample labels + datasets together using LTTB. */
function downsampleChart(labels, datasets, threshold) {
  if (!labels.length || labels.length <= threshold) return { labels, datasets };
  const refDs = datasets.find(d => d.label !== 'SPY' && d.label !== ('$' + (10000 / 1000) + 'K Base')) || datasets[0];
  const refData = (refDs?.data || []).map(v => v ?? 0);
  const indices = lttbIndices(refData, threshold);
  return {
    labels: indices.map(i => labels[i]),
    datasets: datasets.map(ds => ({ ...ds, data: indices.map(i => ds.data[i]) }))
  };
}

/* ═══════════════════════════════════════════════════════
   TIME RANGE FILTERING
   ═══════════════════════════════════════════════════════ */

/** Returns { start, end } indices for a date-label array. */
function getTimeRangeSlice(labels, range) {
  if (range === 'ALL' || !labels.length) return { start: 0, end: labels.length };
  const lastDate = new Date(labels[labels.length - 1] + 'T00:00:00');
  const startDate = new Date(lastDate);
  switch (range) {
    case '1M': startDate.setMonth(startDate.getMonth() - 1); break;
    case '3M': startDate.setMonth(startDate.getMonth() - 3); break;
    case '6M': startDate.setMonth(startDate.getMonth() - 6); break;
    case '1Y': startDate.setFullYear(startDate.getFullYear() - 1); break;
    default: return { start: 0, end: labels.length };
  }
  const startStr = startDate.toISOString().split('T')[0];
  let startIdx = labels.findIndex(d => d >= startStr);
  if (startIdx < 0) startIdx = 0;
  return { start: startIdx, end: labels.length };
}

/* ── Stored chart data for time-range re-rendering ── */
let _btRetStore = null;
let _pNavStore = null;

/* ═══════════════════════════════════════════════════════
   SHARED CHART OPTIONS
   ═══════════════════════════════════════════════════════ */

function chartOpts(unit, opts) {
  const { spyTooltip } = opts || {};
  return {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      highlightLine: true,
      legend: { labels: { color: getCS('--text-dim'), usePointStyle: true, pointStyle: 'circle', font: { size: 11 }, padding: 14 } },
      tooltip: {
        mode: 'nearest', intersect: false,
        backgroundColor: getCS('--card'), titleColor: getCS('--text'), bodyColor: getCS('--text-sec'),
        borderColor: getCS('--border'), borderWidth: 1, cornerRadius: 8, padding: 10,
        callbacks: {
          label: ctx => {
            const v = ctx.parsed.y;
            const name = ctx.dataset.label;
            const base = unit === '$'
              ? ` ${name}: $${v.toLocaleString()}`
              : ` ${name}: ${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
            if (!spyTooltip || name === 'SPY') return base;
            const spyDs = ctx.chart.data.datasets.find(d => d.label === 'SPY');
            if (spyDs) {
              const sv = spyDs.data[ctx.dataIndex];
              if (sv != null) {
                const diff = v - sv;
                return `${base}  (vs SPY: ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%)`;
              }
            }
            return base;
          }
        }
      },
      zoom: {
        pan: { enabled: true, mode: 'x', modifierKey: null },
        zoom: {
          wheel: { enabled: true, modifierKey: 'ctrl' },
          pinch: { enabled: true },
          drag: { enabled: true, backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.4)', borderWidth: 1 },
          mode: 'x',
          onZoomComplete: ({ chart }) => {
            const btn = chart.canvas.parentElement.querySelector('.zoom-reset');
            if (btn) btn.style.display = 'flex';
          }
        }
      }
    },
    scales: {
      x: { ticks: { color: getCS('--text-dim'), maxTicksLimit: 10, font: { size: 11 } }, grid: { color: getCS('--chart-grid') } },
      y: { ticks: { color: getCS('--text-dim'), font: { size: 11 }, callback: v => unit === '$' ? '$' + v.toLocaleString() : v.toFixed(1) + '%' }, grid: { color: getCS('--chart-grid') } }
    }
  };
}

/* ── Chart.js highlight-line plugin ── */
const highlightLinePlugin = {
  id: 'highlightLine',
  afterEvent(chart, args) {
    const event = args.event;
    if (event.type === 'mousemove') {
      const elements = chart.getElementsAtEventForMode(event, 'nearest', { intersect: false }, false);
      let needsUpdate = false;
      chart.data.datasets.forEach((ds, i) => {
        const origW = ds._originalWidth || 2.5;
        if (elements.length && elements[0].datasetIndex === i) {
          if (ds.borderWidth !== 4) { ds.borderWidth = 4; needsUpdate = true; }
          if (ds.borderColor !== ds._originalColor && ds._originalColor) { ds.borderColor = ds._originalColor; needsUpdate = true; }
        } else if (elements.length) {
          if (ds.borderWidth !== 1.5) { ds.borderWidth = 1.5; needsUpdate = true; }
          if (ds._originalColor && !ds._dimColor) ds._dimColor = ds._originalColor + '55';
          if (ds._dimColor && ds.borderColor !== ds._dimColor) { ds.borderColor = ds._dimColor; needsUpdate = true; }
        } else {
          if (ds.borderWidth !== origW) { ds.borderWidth = origW; needsUpdate = true; }
          if (ds._originalColor && ds.borderColor !== ds._originalColor) { ds.borderColor = ds._originalColor; needsUpdate = true; }
        }
      });
      if (needsUpdate) chart.update('none');
    }
    if (event.type === 'mouseout') {
      let needsUpdate = false;
      chart.data.datasets.forEach(ds => {
        const origW = ds._originalWidth || 2.5;
        if (ds.borderWidth !== origW) { ds.borderWidth = origW; needsUpdate = true; }
        if (ds._originalColor && ds.borderColor !== ds._originalColor) { ds.borderColor = ds._originalColor; needsUpdate = true; }
      });
      if (needsUpdate) chart.update('none');
    }
  }
};

/* ── Zoom controls ── */
function addZoomControls(canvasId, chartKey) {
  const cv = document.getElementById(canvasId); if (!cv) return;
  const parent = cv.parentElement;
  if (parent.querySelector('.zoom-controls')) return;
  const ctrl = document.createElement('div');
  ctrl.className = 'zoom-controls';
  ctrl.innerHTML = `
    <span class="zoom-hint">🔍 ${T('zoom_hint')}</span>
    <button class="zoom-reset" style="display:none" onclick="resetChartZoom('${chartKey}',this)">↩ ${T('reset_zoom')}</button>
  `;
  parent.insertBefore(ctrl, cv);
}

function resetChartZoom(key, btn) {
  if (CI[key]) { CI[key].resetZoom(); if (btn) btn.style.display = 'none'; }
}

/* ═══════════════════════════════════════════════════════
   TIME RANGE PILL HANDLERS
   ═══════════════════════════════════════════════════════ */

function setBtTimeRange(range) {
  if (!_btRetStore) return;
  document.querySelectorAll('#btTimePills .pill-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.range === range)
  );
  _renderBtRetChart(range);
}

function setPNavTimeRange(range) {
  if (!_pNavStore) return;
  document.querySelectorAll('#pNavTimePills .pill-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.range === range)
  );
  _renderPNavChart(range);
}

/* ═══════════════════════════════════════════════════════
   PAPER TRADING CHARTS
   ═══════════════════════════════════════════════════════ */

/* ── Paper NAV chart ── */
function rPNav(keys, strats, cap) {
  dc('pNav');
  const cv = document.getElementById('pNavC'); if (!cv) return;
  const ds = new Set();
  keys.forEach(k => (strats[k].nav_history || []).forEach(h => ds.add(h.date)));
  const dates = [...ds].sort(); if (!dates.length) return;

  const dsets = keys.map(k => {
    const hist = strats[k].nav_history || [], mp = {};
    hist.forEach(h => mp[h.date] = h.nav);
    const c = rc(k);
    return {
      label: displayName(strats[k], k), data: dates.map(d => mp[d] ?? null),
      borderColor: c, _originalColor: c, _originalWidth: 2.5, backgroundColor: c + '18',
      borderWidth: 2.5, tension: .3, pointRadius: 0, pointHoverRadius: 5,
      fill: true, spanGaps: true
    };
  });
  dsets.push({
    label: '$' + (cap / 1000) + 'K Base', data: dates.map(() => cap),
    borderColor: '#94a3b8', _originalColor: '#94a3b8', _originalWidth: 1.5,
    borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, fill: false
  });

  _pNavStore = { dates, dsets };
  _renderPNavChart('ALL');
}

function _renderPNavChart(range) {
  dc('pNav');
  const cv = document.getElementById('pNavC'); if (!cv || !_pNavStore) return;
  const { dates, dsets } = _pNavStore;
  const { start, end } = getTimeRangeSlice(dates, range);
  const fDates = dates.slice(start, end);
  const fDsets = dsets.map(ds => ({ ...ds, data: ds.data.slice(start, end) }));
  const { labels, datasets } = downsampleChart(fDates, fDsets, 150);

  CI['pNav'] = new Chart(cv, {
    type: 'line',
    data: { labels, datasets },
    options: chartOpts('$'),
    plugins: [highlightLinePlugin]
  });
  addZoomControls('pNavC', 'pNav');
}

/* ── Paper sector doughnut ── */
function rPSec(keys, strats) {
  dc('pSec');
  const cv = document.getElementById('pSecC'), eEl = document.getElementById('secE'), nEl = document.getElementById('secN');
  if (!cv) return;
  const sm = {}; let tot = 0;
  keys.forEach(k => {
    const pos = strats[k].positions || {};
    Object.values(pos).forEach(p => { const s = p.sector || 'Other'; sm[s] = (sm[s] || 0) + (p.shares || 1); tot++; });
  });
  if (nEl) nEl.textContent = tot;
  const labels = Object.keys(sm);
  if (!labels.length) {
    cv.style.display = 'none';
    document.querySelector('.dc')?.style.setProperty('display', 'none');
    if (eEl) eEl.style.display = ''; return;
  }
  cv.style.display = '';
  document.querySelector('.dc')?.style.setProperty('display', '');
  if (eEl) eEl.style.display = 'none';
  const colors = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ec4899','#ef4444','#06b6d4','#a78bfa','#f97316','#14b8a6','#64748b'];
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  CI['pSec'] = new Chart(cv, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: labels.map(l => sm[l]), backgroundColor: colors.slice(0, labels.length), borderColor: isDark ? '#1e293b' : '#ffffff', borderWidth: 3 }] },
    options: { responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: getCS('--text-sec'), font: { size: 11 }, usePointStyle: true, pointStyle: 'circle', padding: 12 } } } }
  });
}

/* ═══════════════════════════════════════════════════════
   BACKTEST CHARTS
   ═══════════════════════════════════════════════════════ */

/* ── Returns curve ── */
function rBRet(keys, strats, run) {
  dc('bRet');
  const cv = document.getElementById('bRetC'); if (!cv) return;
  const ds = new Set();
  keys.forEach(k => (strats[k].nav_history || []).forEach(h => ds.add(h.date)));
  const dates = [...ds].sort(); if (!dates.length) return;

  const dsets = keys.map(k => {
    const hist = strats[k].nav_history || [], mp = {};
    hist.forEach(h => mp[h.date] = h.nav);
    const iv = hist.length ? hist[0].nav : 10000, c = rc(k);
    const isDk = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      label: displayName(strats[k], k), data: dates.map(d => mp[d] != null ? ((mp[d] / iv - 1) * 100) : null),
      borderColor: c, _originalColor: c, _originalWidth: 2.5, backgroundColor: c + (isDk ? '18' : '25'),
      borderWidth: 2.5, tension: .3, pointRadius: 0, pointHoverRadius: 5,
      fill: true, spanGaps: true
    };
  });

  /* SPY overlay */
  if (run.spy_return != null) {
    if (run.spy_nav_history?.length) {
      const sm = {}; run.spy_nav_history.forEach(h => sm[h.date] = h.nav);
      const iv = run.spy_nav_history[0].nav || 10000;
      dsets.push({
        label: 'SPY', data: dates.map(d => sm[d] != null ? ((sm[d] / iv - 1) * 100) : null),
        borderColor: '#94a3b8', _originalColor: '#94a3b8', _originalWidth: 2,
        borderDash: [5, 5], borderWidth: 2, pointRadius: 0, fill: false, spanGaps: true
      });
    } else {
      dsets.push({
        label: 'SPY', data: dates.map((_, i) => dates.length > 1 ? (run.spy_return * i / (dates.length - 1)) : run.spy_return),
        borderColor: '#94a3b8', _originalColor: '#94a3b8', _originalWidth: 2,
        borderDash: [5, 5], borderWidth: 2, pointRadius: 0, fill: false
      });
    }
  }

  _btRetStore = { dates, dsets, hasSpy: run.spy_return != null };
  _renderBtRetChart('ALL');
}

function _renderBtRetChart(range) {
  dc('bRet');
  const cv = document.getElementById('bRetC'); if (!cv || !_btRetStore) return;
  const { dates, dsets, hasSpy } = _btRetStore;
  const { start, end } = getTimeRangeSlice(dates, range);
  const fDates = dates.slice(start, end);
  const fDsets = dsets.map(ds => ({ ...ds, data: ds.data.slice(start, end) }));
  const { labels, datasets } = downsampleChart(fDates, fDsets, 150);

  CI['bRet'] = new Chart(cv, {
    type: 'line',
    data: { labels, datasets },
    options: chartOpts('%', { spyTooltip: hasSpy }),
    plugins: [highlightLinePlugin]
  });
  addZoomControls('bRetC', 'bRet');
}

/* ── Heatmap ── */
function rBHM(keys, strats) {
  const el = document.getElementById('bHM'); if (!el) return;
  const ms = new Set();
  keys.forEach(k => Object.keys(strats[k].monthly_returns || {}).forEach(m => ms.add(m)));
  const months = [...ms].sort();
  if (!months.length) { el.innerHTML = '<div class="empty">' + T('no_monthly') + '</div>'; return; }
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  /* Build grid with explicit column count for alignment */
  const cols = months.length;
  let h = `<div class="hmg" style="grid-template-columns:130px repeat(${cols},1fr)">`;

  /* Header row: empty corner + month labels */
  h += '<div class="hmc hmh"></div>';
  months.forEach(m => h += `<div class="hmc hmh">${m}</div>`);

  /* Data rows */
  keys.forEach(k => {
    const mr = strats[k].monthly_returns || {};
    h += `<div class="hmc hml"><span class="hmd" style="background:${rc(k)}"></span>${esc(displayName(strats[k], k))}</div>`;
    months.forEach(m => {
      const v = mr[m];
      if (v == null) { h += `<div class="hmc" style="background:var(--hm-empty);color:var(--text-dim)">—</div>`; return; }
      const int = Math.min(Math.abs(v) / 5, 1);
      let bg, fg;
      if (v >= 0) { bg = isDark ? `rgba(52,211,153,${.12 + int * .45})` : `rgba(16,185,129,${.08 + int * .35})`; fg = 'var(--hm-pos)'; }
      else { bg = isDark ? `rgba(248,113,113,${.12 + int * .45})` : `rgba(239,68,68,${.08 + int * .35})`; fg = 'var(--hm-neg)'; }
      h += `<div class="hmc" style="background:${bg};color:${fg}">${v >= 0 ? '+' : ''}${v.toFixed(1)}%</div>`;
    });
  });
  h += '</div>';
  el.innerHTML = h;
}

/* ═══════════════════════════════════════════════════════
   COMPARISON TABLE
   ═══════════════════════════════════════════════════════ */

function renderComparisonTable(keys, strats, spy) {
  const el = document.getElementById('cmpTableWrap'); if (!el) return;

  /* Gather data & sort by total return desc */
  const rows = keys.map(k => {
    const s = strats[k];
    return {
      k, name: displayName(s, k),
      ret: s.total_return ?? null,
      sharpe: s.sharpe ?? null,
      dd: s.max_drawdown ?? null,
      wr: s.win_rate ?? null,
      hold: s.avg_hold_days ?? null,
    };
  }).sort((a, b) => (b.ret || 0) - (a.ret || 0));

  if (!rows.length) { el.innerHTML = ''; return; }

  /* Find best / worst for each metric */
  const metrics = ['ret', 'sharpe', 'dd', 'wr'];
  const best = {}, worst = {};
  metrics.forEach(m => {
    const vals = rows.map(r => r[m]).filter(v => v != null);
    if (!vals.length) return;
    if (m === 'dd') {
      /* Max DD: closer to 0 = better (less negative) */
      best[m] = Math.max(...vals);
      worst[m] = Math.min(...vals);
    } else {
      best[m] = Math.max(...vals);
      worst[m] = Math.min(...vals);
    }
  });

  const cls = (m, v) => {
    if (v == null || best[m] == null) return '';
    if (v === best[m] && best[m] !== worst[m]) return 'cmp-best';
    if (v === worst[m] && best[m] !== worst[m]) return 'cmp-worst';
    return '';
  };

  let h = `<table class="cmp-table" id="cmpTbl">
    <thead><tr>
      <th data-c="n" data-t="s">${T('strategy')}</th>
      <th data-c="ret" data-t="n">${T('total_return')}</th>
      <th data-c="sh" data-t="n">${T('sharpe')}</th>
      <th data-c="dd" data-t="n">${T('max_dd')}</th>
      <th data-c="wr" data-t="n">${T('win_rate')}</th>
      <th data-c="hd" data-t="n">${T('avg_hold_days')}</th>
    </tr></thead><tbody>`;

  rows.forEach(r => {
    h += `<tr>
      <td style="color:${rc(r.k)};font-weight:600">${esc(r.name)}</td>
      <td class="${cls('ret', r.ret)}" style="font-weight:700">${fp(r.ret)}</td>
      <td class="${cls('sharpe', r.sharpe)}">${fmt(r.sharpe, 2)}</td>
      <td class="${cls('dd', r.dd)}">${r.dd != null ? fmt(r.dd, 1) + '%' : '—'}</td>
      <td class="${cls('wr', r.wr)}">${r.wr != null ? fmt(r.wr, 1) + '%' : '—'}</td>
      <td>${r.hold != null ? fmt(r.hold, 1) + 'd' : '—'}</td>
    </tr>`;
  });

  /* SPY row if available */
  if (spy != null) {
    h += `<tr style="opacity:.7;font-style:italic">
      <td style="color:var(--c-spy);font-weight:600">SPY</td>
      <td style="font-weight:700">${fp(spy)}</td>
      <td>—</td><td>—</td><td>—</td><td>—</td>
    </tr>`;
  }

  h += '</tbody></table>';
  el.innerHTML = h;
  makeSortable('cmpTbl');
}

/* ═══════════════════════════════════════════════════════
   TIME RANGE PILLS HTML HELPER
   ═══════════════════════════════════════════════════════ */

function timePillsHTML(id, handler) {
  const ranges = [
    { key: '1M', label: T('time_1m') },
    { key: '3M', label: T('time_3m') },
    { key: '6M', label: T('time_6m') },
    { key: '1Y', label: T('time_1y') },
    { key: 'ALL', label: T('time_all') },
  ];
  return `<div class="time-pills" id="${id}">${ranges.map(r =>
    `<button class="pill-btn${r.key === 'ALL' ? ' active' : ''}" data-range="${r.key}" onclick="${handler}('${r.key}')">${r.label}</button>`
  ).join('')}</div>`;
}

/* ═══════════════════════════════════════════════════════
   DETAIL PANEL CHARTS
   ═══════════════════════════════════════════════════════ */

/* ── Sparkline in detail panel ── */
function renderSparkline(navH, color) {
  dc('dpSpark');
  const canvas = document.getElementById('dpSpark'); if (!canvas) return;
  const dates = navH.map(h => h.date), vals = navH.map(h => h.nav);
  CI['dpSpark'] = new Chart(canvas, {
    type: 'line',
    data: { labels: dates, datasets: [{ data: vals, borderColor: color, backgroundColor: color + '20', borderWidth: 2, tension: .3, pointRadius: 0, fill: true }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: getCS('--card'), titleColor: getCS('--text'), bodyColor: getCS('--text-sec'),
        borderColor: getCS('--border'), borderWidth: 1, cornerRadius: 8,
        callbacks: { label: ctx => ' $' + ctx.parsed.y.toLocaleString() }
      } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

/* ── Backtest monthly bar chart ── */
function renderBtMonthly(months, mr, color) {
  dc('btMonthly');
  const container = document.querySelector('.bt-monthly-chart');
  const canvas = document.getElementById('btMonthlyC');
  if (!canvas || !container) return;
  const w = container.offsetWidth || 800;
  canvas.style.width = w + 'px';
  canvas.style.height = '180px';
  const vals = months.map(m => mr[m]);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const colors = vals.map(v => v >= 0
    ? (isDark ? 'rgba(52,211,153,0.7)' : 'rgba(16,185,129,0.7)')
    : (isDark ? 'rgba(248,113,113,0.7)' : 'rgba(239,68,68,0.7)')
  );
  CI['btMonthly'] = new Chart(canvas, {
    type: 'bar',
    data: { labels: months, datasets: [{ data: vals, backgroundColor: colors, borderRadius: 4, borderSkipped: false }] },
    options: {
      responsive: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: getCS('--card'), titleColor: getCS('--text'), bodyColor: getCS('--text-sec'),
        borderColor: getCS('--border'), borderWidth: 1, cornerRadius: 8,
        callbacks: { label: ctx => ` ${ctx.parsed.y >= 0 ? '+' : ''}${ctx.parsed.y.toFixed(2)}%` }
      } },
      scales: {
        x: { ticks: { color: getCS('--text-dim'), maxTicksLimit: 12, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: getCS('--text-dim'), font: { size: 10 }, callback: v => v.toFixed(0) + '%' }, grid: { color: getCS('--chart-grid') } }
      }
    }
  });
}

/* ── Drawdown chart in detail panel ── */
function renderDrawdownChart(navH, color) {
  dc('dpDrawdown');
  const canvas = document.getElementById('dpDrawdown');
  if (!canvas || navH.length < 2) return;

  let peak = -Infinity;
  const ddData = [], dates = [];
  navH.forEach(h => {
    if (h.nav > peak) peak = h.nav;
    ddData.push(((h.nav - peak) / peak) * 100);
    dates.push(h.date);
  });

  let maxDDVal = 0, maxDDIdx = 0;
  ddData.forEach((d, i) => { if (d < maxDDVal) { maxDDVal = d; maxDDIdx = i; } });

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const redLine = isDark ? 'rgba(248,113,113,0.8)' : 'rgba(239,68,68,0.7)';
  const redFill = isDark ? 'rgba(248,113,113,0.15)' : 'rgba(239,68,68,0.1)';
  const redPoint = isDark ? '#f87171' : '#ef4444';

  const ptRadius = ddData.map((_, i) => i === maxDDIdx ? 6 : 0);
  const ptBg = ddData.map((_, i) => i === maxDDIdx ? redPoint : 'transparent');

  CI['dpDrawdown'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        data: ddData,
        borderColor: redLine,
        backgroundColor: redFill,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: ptRadius,
        pointBackgroundColor: ptBg,
        pointBorderColor: ptBg,
        pointHoverRadius: 4,
        fill: 'origin'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: getCS('--card'), titleColor: getCS('--text'),
          bodyColor: getCS('--text-sec'), borderColor: getCS('--border'),
          borderWidth: 1, cornerRadius: 8,
          callbacks: {
            label: ctx => ` Drawdown: ${ctx.parsed.y.toFixed(2)}%`,
            afterLabel: ctx => ctx.dataIndex === maxDDIdx ? '⚠️ Max Drawdown' : ''
          }
        }
      },
      scales: {
        x: { ticks: { color: getCS('--text-dim'), maxTicksLimit: 8, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: getCS('--text-dim'), font: { size: 10 }, callback: v => v.toFixed(1) + '%' }, grid: { color: getCS('--chart-grid') } }
      }
    }
  });
}

/* ── Monthly returns bar chart in detail panel ── */
function renderPanelMonthlyChart(monthlyReturns) {
  dc('dpMonthly');
  const canvas = document.getElementById('dpMonthly');
  if (!canvas) return;

  const months = Object.keys(monthlyReturns).sort();
  if (!months.length) return;

  const vals = months.map(m => monthlyReturns[m]);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const colors = vals.map(v => v >= 0
    ? (isDark ? 'rgba(52,211,153,0.7)' : 'rgba(16,185,129,0.7)')
    : (isDark ? 'rgba(248,113,113,0.7)' : 'rgba(239,68,68,0.7)')
  );

  CI['dpMonthly'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        data: vals,
        backgroundColor: colors,
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: getCS('--card'), titleColor: getCS('--text'),
          bodyColor: getCS('--text-sec'), borderColor: getCS('--border'),
          borderWidth: 1, cornerRadius: 8,
          callbacks: { label: ctx => ` ${ctx.parsed.y >= 0 ? '+' : ''}${ctx.parsed.y.toFixed(2)}%` }
        }
      },
      scales: {
        x: { ticks: { color: getCS('--text-dim'), maxTicksLimit: 12, font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: getCS('--text-dim'), font: { size: 10 }, callback: v => v.toFixed(0) + '%' }, grid: { color: getCS('--chart-grid') } }
      }
    }
  });
}

/* ── Backtest detail sparkline ── */
function renderBtDetailSpark(navH, color) {
  dc('btDetailSpark');
  const container = document.querySelector('#btExpand .dp-spark');
  const canvas = document.getElementById('btDetailSpark');
  if (!canvas || !container) return;
  const w = container.offsetWidth || 800;
  canvas.style.width = w + 'px';
  canvas.style.height = '120px';
  const dates = navH.map(h => h.date), vals = navH.map(h => h.nav);
  CI['btDetailSpark'] = new Chart(canvas, {
    type: 'line',
    data: { labels: dates, datasets: [{ data: vals, borderColor: color, backgroundColor: color + '20', borderWidth: 2, tension: .3, pointRadius: 0, fill: true }] },
    options: {
      responsive: false,
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: getCS('--card'), titleColor: getCS('--text'), bodyColor: getCS('--text-sec'),
        borderColor: getCS('--border'), borderWidth: 1, cornerRadius: 8,
        callbacks: { label: ctx => ' $' + ctx.parsed.y.toLocaleString() }
      } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}
