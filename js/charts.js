/* ═══════════════════════════════════════════════════════
   CHART.JS RENDERING
   ═══════════════════════════════════════════════════════ */

/* ── Computed style helper ── */
function getCS(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

/* ── Shared chart options ── */
function chartOpts(unit) {
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
            return unit === '$' ? ` ${ctx.dataset.label}: $${v.toLocaleString()}` : ` ${ctx.dataset.label}: ${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
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
      borderWidth: 2.5, tension: .4, pointRadius: dates.length < 30 ? 3 : 0, pointHoverRadius: 5,
      fill: true, spanGaps: true
    };
  });
  dsets.push({
    label: '$' + (cap / 1000) + 'K Base', data: dates.map(() => cap),
    borderColor: '#94a3b8', _originalColor: '#94a3b8', _originalWidth: 1.5,
    borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false
  });
  CI['pNav'] = new Chart(cv, { type: 'line', data: { labels: dates, datasets: dsets }, options: chartOpts('$'), plugins: [highlightLinePlugin] });
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
      borderWidth: 2.5, tension: .4, pointRadius: dates.length < 30 ? 3 : 0, pointHoverRadius: 5,
      fill: true, spanGaps: true
    };
  });
  if (run.spy_return != null) {
    if (run.spy_nav_history?.length) {
      const sm = {}; run.spy_nav_history.forEach(h => sm[h.date] = h.nav);
      const iv = run.spy_nav_history[0].nav || 10000;
      dsets.push({
        label: 'SPY', data: dates.map(d => sm[d] != null ? ((sm[d] / iv - 1) * 100) : null),
        borderColor: '#94a3b8', _originalColor: '#94a3b8', _originalWidth: 2,
        borderDash: [6, 4], borderWidth: 2, pointRadius: 0, fill: false, spanGaps: true
      });
    } else {
      dsets.push({
        label: 'SPY', data: dates.map((_, i) => dates.length > 1 ? (run.spy_return * i / (dates.length - 1)) : run.spy_return),
        borderColor: '#94a3b8', _originalColor: '#94a3b8', _originalWidth: 2,
        borderDash: [6, 4], borderWidth: 2, pointRadius: 0, fill: false
      });
    }
  }
  CI['bRet'] = new Chart(cv, { type: 'line', data: { labels: dates, datasets: dsets }, options: chartOpts('%'), plugins: [highlightLinePlugin] });
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
  let h = `<div class="hmg" style="grid-template-columns:130px repeat(${months.length},1fr)">`;
  h += '<div class="hmc hmh"></div>';
  months.forEach(m => h += `<div class="hmc hmh">${m}</div>`);
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
   DETAIL PANEL CHARTS
   ═══════════════════════════════════════════════════════ */

/* ── Sparkline in detail panel ── */
function renderSparkline(navH, color) {
  dc('dpSpark');
  const canvas = document.getElementById('dpSpark'); if (!canvas) return;
  const dates = navH.map(h => h.date), vals = navH.map(h => h.nav);
  CI['dpSpark'] = new Chart(canvas, {
    type: 'line',
    data: { labels: dates, datasets: [{ data: vals, borderColor: color, backgroundColor: color + '20', borderWidth: 2, tension: .4, pointRadius: 0, fill: true }] },
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
    data: { labels: dates, datasets: [{ data: vals, borderColor: color, backgroundColor: color + '20', borderWidth: 2, tension: .4, pointRadius: 0, fill: true }] },
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
