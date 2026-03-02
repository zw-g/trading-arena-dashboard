/* ═══════════════════════════════════════════════════════
   CONSTANTS, COLORS & I18N
   ═══════════════════════════════════════════════════════ */

/* ── I18N ── */
const I18N = {
  en: {
    paper_trading:'Paper Trading', backtests:'Backtests', live_trading:'Live Trading',
    session:'Session', run:'Run', nav_history:'NAV History', sector_dist:'Sector Distribution',
    leaderboard:'Leaderboard', recent_trades:'Recent Trades', strategy_ranking:'Strategy Ranking',
    returns_curve:'Returns Curve', monthly_heatmap:'Monthly Returns Heatmap',
    benchmark:'Benchmark', starting_capital:'Starting Capital', spy_return:'SPY Return',
    period:'Period', strategy:'Strategy', return_col:'Return', annual:'Annual', sharpe:'Sharpe',
    max_dd:'Max DD', win_rate:'Win Rate', mode:'Mode', trades:'Trades',
    no_trades:'No trades yet — waiting for first signals…', no_positions:'No positions yet',
    total_return:'Total Return', annual_return:'Annual Return', sharpe_ratio:'Sharpe Ratio',
    max_drawdown:'Max Drawdown', total_closed:'Total Closed Trades', final_nav:'Final NAV',
    methodology:'Methodology', ai_mode:'AI Mode', cost_formula:'Cost Formula',
    coverage:'Coverage', schedule:'Schedule', risk_mgmt:'Risk Management',
    exit_rules:'Exit Rules', position_sizing:'Position Sizing',
    top_winners:'Top Winners', top_losers:'Top Losers', monthly_returns:'Monthly Returns',
    nav_hist:'NAV History', about_strategy:'About This Strategy',
    zoom_hint:'Drag to zoom · Ctrl+scroll · Pinch', reset_zoom:'Reset zoom',
    updated:'Updated', auto_update:'Auto-updated every 120 s',
    rules_fallback:'Rules Fallback', rule_based:'Rule-based', ai_badge:'AI',
    coming_soon:'Coming Soon', live_msg:'Live trading will be enabled after paper trading validation.',
    current_status:'Current Status', current_positions:'Current Positions', top_trades:'Top Trades',
    no_sessions:'No paper trading sessions yet.', no_bt_runs:'No backtest runs yet.',
    session_not_found:'Session not found.', run_not_found:'Run not found.',
    pos_count:'pos', no_monthly:'No monthly data.', shares:'shares',
    spy_benchmark:'SPY Benchmark', sp500_index:'S&P 500 Index',
    strategies_count:'strategies', trading_days:'trading days',
    ticker:'Ticker', pnl:'P&L', date:'Date', vs_spy:'vs SPY',
    fallback_note:'This backtest used rule-based scoring, not LLM analysis',
    added:'Added', positions_label:'positions', loading_paper:'Loading paper trading data…',
    loading_bt:'Loading backtest data…',
    live_title:'Live Trading — Coming Soon',
    live_detail:'The live dashboard will mirror Paper Trading with real-time P&L, positions, and execution logs.',
    live_target:'Target: <strong>Alpaca API</strong> integration with real-time execution.',
    rank:'#',
    time_1m:'1M', time_3m:'3M', time_6m:'6M', time_1y:'1Y', time_all:'ALL',
    strategy_comparison:'Strategy Comparison', avg_hold_days:'Avg Hold',
    drawdown:'Drawdown', holdings:'Holdings', entry_price:'Avg Cost',
    current_price:'Current', weight_pct:'Weight', pnl_col:'P&L%',
    /* T24: Trade List */
    trade_list:'Trade List', all_trades:'All Trades', direction:'Direction',
    entry_date:'Entry Date', exit_date:'Exit Date', entry_price_col:'Entry Price',
    exit_price_col:'Exit Price', pnl_dollar:'P&L$', pnl_pct_col:'P&L%',
    hold_days_col:'Hold Days', exit_type_col:'Exit Type', search_ticker:'Search ticker…',
    no_completed_trades:'No completed trades yet', confidence_col:'Confidence',
    strategy_col:'Strategy', trade_detail:'Trade Detail',
    long_dir:'Long', short_dir:'Short',
    exit_stop_loss:'Stop Loss', exit_take_profit:'Take Profit',
    exit_signal_sell:'Signal Sell', exit_signal_reversal:'Signal Reversal',
    showing_trades:'Showing {n} of {total} trades', sort_by_pnl:'Sort by P&L%',
  },
  zh: {
    paper_trading:'模拟交易', backtests:'回测', live_trading:'实盘交易',
    session:'会话', run:'运行', nav_history:'净值走势', sector_dist:'板块分布',
    leaderboard:'排行榜', recent_trades:'最近交易', strategy_ranking:'策略排名',
    returns_curve:'收益曲线', monthly_heatmap:'月度收益热力图',
    benchmark:'基准', starting_capital:'初始资金', spy_return:'SPY 收益',
    period:'时间段', strategy:'策略', return_col:'总收益', annual:'年化', sharpe:'夏普比率',
    max_dd:'最大回撤', win_rate:'胜率', mode:'模式', trades:'交易数',
    no_trades:'暂无交易 — 等待第一个信号…', no_positions:'暂无持仓',
    total_return:'总收益', annual_return:'年化收益', sharpe_ratio:'夏普比率',
    max_drawdown:'最大回撤', total_closed:'已平仓交易', final_nav:'最终净值',
    methodology:'方法论', ai_mode:'AI 模式', cost_formula:'成本公式',
    coverage:'覆盖范围', schedule:'调度计划', risk_mgmt:'风险管理',
    exit_rules:'退出规则', position_sizing:'仓位管理',
    top_winners:'最佳交易', top_losers:'最差交易', monthly_returns:'月度收益',
    nav_hist:'净值走势', about_strategy:'策略介绍',
    zoom_hint:'拖拽放大 · Ctrl+滚轮 · 双指捏合', reset_zoom:'重置缩放',
    updated:'更新于', auto_update:'每 120 秒自动更新',
    rules_fallback:'规则回退', rule_based:'纯规则', ai_badge:'AI',
    coming_soon:'即将推出', live_msg:'实盘交易将在模拟交易验证后启用。',
    current_status:'当前状态', current_positions:'当前持仓', top_trades:'最佳交易',
    no_sessions:'暂无模拟交易会话。', no_bt_runs:'暂无回测数据。',
    session_not_found:'会话未找到。', run_not_found:'运行未找到。',
    pos_count:'持仓', no_monthly:'暂无月度数据。', shares:'股',
    spy_benchmark:'SPY 基准', sp500_index:'S&P 500 指数',
    strategies_count:'个策略', trading_days:'个交易日',
    ticker:'代码', pnl:'盈亏', date:'日期', vs_spy:'vs SPY',
    fallback_note:'此回测使用规则评分，非 LLM 分析',
    added:'添加于', positions_label:'持仓数', loading_paper:'正在加载模拟交易数据…',
    loading_bt:'正在加载回测数据…',
    live_title:'实盘交易 — 即将推出',
    live_detail:'实盘仪表盘将镜像模拟交易，提供实时盈亏、持仓和执行日志。',
    live_target:'目标：<strong>Alpaca API</strong> 实时执行。',
    rank:'#',
    time_1m:'1月', time_3m:'3月', time_6m:'6月', time_1y:'1年', time_all:'全部',
    strategy_comparison:'策略对比', avg_hold_days:'平均持仓',
    drawdown:'回撤曲线', holdings:'持仓明细', entry_price:'成本价',
    current_price:'现价', weight_pct:'权重', pnl_col:'盈亏%',
    /* T24: Trade List */
    trade_list:'交易列表', all_trades:'全部交易', direction:'方向',
    entry_date:'入场日期', exit_date:'出场日期', entry_price_col:'入场价',
    exit_price_col:'出场价', pnl_dollar:'盈亏$', pnl_pct_col:'盈亏%',
    hold_days_col:'持仓天数', exit_type_col:'退出类型', search_ticker:'搜索代码…',
    no_completed_trades:'暂无已完成交易', confidence_col:'信心度',
    strategy_col:'策略', trade_detail:'交易详情',
    long_dir:'做多', short_dir:'做空',
    exit_stop_loss:'止损', exit_take_profit:'止盈',
    exit_signal_sell:'信号卖出', exit_signal_reversal:'信号反转',
    showing_trades:'显示 {n}/{total} 笔交易', sort_by_pnl:'按盈亏%排序',
  }
};

let LANG = 'en';
function T(key) { return (I18N[LANG]||I18N.en)[key]||(I18N.en[key]||key); }

/* ── Strategy order & names ── */
const SO = ['A_masters','B_committee','C_quant','D_llm','E_baseline'];
const SN = {A_masters:'A — Masters',B_committee:'B — Committee',C_quant:'C — Quant',D_llm:'D — LLM Debate',E_baseline:'E — Baseline'};
const MEDALS = ['🥇','🥈','🥉','4','5','6','7','8'];

/* ── Detailed strategy metadata (client-side fallback) ── */
const STRATEGY_META = {
  A_masters: {
    version:"2.0", name:"Masters Vote",
    description:"4位投资大师(Graham/Buffett, Cathie Wood, Druckenmiller, Burry)各自独立 AI 分析。每位大师用自己的投资哲学和决策框架深度分析，最终多数票决定。",
    description_en:"4 legendary investors (Graham/Buffett, Cathie Wood, Druckenmiller, Burry) each analyze independently via LLM. Each master applies their own investment philosophy and decision framework. Majority vote decides the signal.",
    type:"Multi-persona AI voting",
    methodology:"Each master receives enriched data (price, technicals, fundamentals, industry benchmarks, news sentiment) and responds with their investment thesis. Graham focuses on value metrics (P/E, D/E, margin of safety), Wood on innovation/disruption, Druckenmiller on macro/momentum, Burry on contrarian/deep value.",
    methodology_cn:"每位大师接收丰富数据（价格、技术面、基本面、行业基准、新闻情绪），按各自投资哲学分析。Graham 看价值指标（P/E, D/E, 安全边际），Wood 看创新/颠覆性，Druckenmiller 看宏观/动量，Burry 做逆向深度价值分析。",
    ai_mode:"live: Claude Opus | backtest: Claude Haiku | fallback: rule-based scoring",
    cost_formula:"4 LLM calls/stock × N stocks/day × token_cost",
    signals_per_day:"~50 stocks analyzed (top from C+E screener)"
  },
  B_committee: {
    version:"2.0", name:"Investment Committee",
    description:"模拟机构投委会：Research Analyst → Risk Manager → Portfolio Manager 三轮串行讨论。每轮 AI 读取前一轮结论并补充分析。",
    description_en:"Simulates institutional IC: Research Analyst → Risk Manager → Portfolio Manager in 3-round serial discussion. Each round reads the previous conclusion and adds analysis.",
    type:"Serial AI discussion",
    methodology:"Round 1 (Analyst): Deep fundamental + technical analysis with Porter's Five Forces. Round 2 (Risk Manager): Red flag detection, position sizing via Kelly Criterion. Round 3 (PM): Final decision weighing analyst optimism vs risk concerns. VIX-aware regime detection adjusts risk tolerance.",
    methodology_cn:"第1轮（分析师）：深度基本面+技术面分析，Porter 五力模型。第2轮（风控）：红旗检测，Kelly Criterion 仓位计算。第3轮（PM）：综合分析师乐观vs风控担忧做最终决策。VIX 感知调整风险容忍度。",
    ai_mode:"live: Claude Opus | backtest: Claude Haiku | fallback: weighted scoring",
    cost_formula:"3 LLM calls/stock × N stocks/day × token_cost",
    signals_per_day:"~50 stocks analyzed"
  },
  C_quant: {
    version:"1.0", name:"Quant Model",
    description:"纯数学量化模型。根据 VIX 恐慌指数自动切换市场 regime（Bull/Bear/Sideways），调整四维权重。",
    description_en:"Pure mathematical model. Auto-switches market regime based on VIX (Bull < 16, Sideways 16-25, Bear > 25), dynamically adjusts weights across 4 dimensions.",
    type:"Systematic quantitative (rule-based)",
    methodology:"Four scoring dimensions: (1) Trend: MA20/50/200 cross signals, (2) Mean Reversion: Bollinger Band position + RSI extremes, (3) Momentum: price change + volume surge, (4) Volatility: VIX regime detection. Weights shift by regime — Bull favors trend/momentum, Bear favors mean-reversion.",
    methodology_cn:"四维评分：(1) 趋势：MA20/50/200交叉信号，(2) 均值回归：布林带位置+RSI极值，(3) 动量：价格变化+成交量突增，(4) 波动率：VIX regime检测。权重随regime变化——牛市侧重趋势/动量，熊市侧重均值回归。",
    ai_mode:"Pure rules — no LLM, no API cost",
    cost_formula:"$0/day (pure computation)",
    signals_per_day:"All 499 stocks (free screener)"
  },
  D_llm: {
    version:"2.0", name:"LLM Debate",
    description:"AI 辩论引擎：Bull Agent → Bear Agent → Judge。两个 AI 先分别做多/做空论证，Judge 综合裁决。结构化 Bayesian reasoning。",
    description_en:"AI debate engine: Bull Agent → Bear Agent → Judge. Two AIs build opposing cases (long vs short), then Judge synthesizes using structured Bayesian reasoning.",
    type:"Adversarial AI debate",
    methodology:"Bull Agent builds the strongest possible bullish case with evidence. Bear Agent then sees Bull's argument and builds the strongest bearish counter-case. Judge sees both arguments and applies Bayesian reasoning to weigh evidence strength, assign posterior probabilities, and render a final signal with confidence.",
    methodology_cn:"Bull Agent 构建最强做多论据。Bear Agent 看到多方论据后构建最强做空反驳。Judge 看到双方论据，用 Bayesian reasoning 评估证据强度，给出后验概率和最终信号。",
    ai_mode:"live: Claude Opus | backtest: Claude Haiku | fallback: weighted scoring",
    cost_formula:"3 LLM calls/stock × N stocks/day × token_cost",
    signals_per_day:"~50 stocks analyzed"
  },
  E_baseline: {
    version:"1.0", name:"Baseline",
    description:"最简单的策略：MA50/MA200 金叉/死叉 + RSI 分级信心。作为对照组——复杂策略必须跑赢这个才有价值。",
    description_en:"Simplest strategy: MA50/MA200 Golden/Death Cross + tiered RSI confidence. Control group — complex strategies must beat this to justify their complexity.",
    type:"Simple rules (control group)",
    methodology:"Golden Cross (MA50 > MA200) = bullish. Death Cross (MA50 < MA200) = bearish. RSI tiers adjust confidence: RSI < 30 → high bullish confidence, RSI > 70 → high bearish confidence. No fundamentals, no news, no AI.",
    methodology_cn:"金叉（MA50 > MA200）= 看多。死叉（MA50 < MA200）= 看空。RSI 分级调整信心度：RSI < 30 → 高看多信心，RSI > 70 → 高看空信心。不看基本面，不看新闻，不用 AI。",
    ai_mode:"Pure rules — no LLM, no API cost",
    cost_formula:"$0/day (pure computation)",
    signals_per_day:"All 499 stocks (free screener)"
  }
};

/* ── Color maps (light & dark) ── */
const CL = {A_masters:'#3b82f6',B_committee:'#8b5cf6',C_quant:'#00c781',D_llm:'#f5a623',E_baseline:'#ec4899'};
const CD = {A_masters:'#60a5fa',B_committee:'#a78bfa',C_quant:'#3dd68c',D_llm:'#ffc547',E_baseline:'#f472b6'};

/* ── Color helper ── */
function rc(k) {
  const base = baseKey(k);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return (isDark ? CD : CL)[base] || '#94a3b8';
}

/* ── Strategy key utils (multi-version) ── */
function baseKey(k) {
  for (const b of SO) if (k === b || k.startsWith(b + '_v')) return b;
  return k;
}

function stratOrder(keys) {
  return [...keys].sort((a, b) => {
    const ai = SO.indexOf(baseKey(a)), bi = SO.indexOf(baseKey(b));
    const ia = ai < 0 ? 99 : ai, ib = bi < 0 ? 99 : bi;
    if (ia !== ib) return ia - ib;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

function displayName(stratData, key) {
  const m = stratData?.meta;
  if (m?.name) return m.name;
  return SN[baseKey(key)] || key;
}

function getMeta(sd, k) {
  const base = baseKey(k);
  const fallback = STRATEGY_META[base] || { name: SN[base] || k };
  const dataMeta = sd?.meta || {};
  return { ...fallback, ...dataMeta };
}

/* ── Formatting helpers ── */
const fmt = (n, d = 2) => n == null ? '—' : Number(n).toFixed(d);
const fp  = (n) => n == null ? '—' : (n >= 0 ? '+' : '') + fmt(n, 1) + '%';
const fm  = (n) => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const pc  = (n) => n == null ? 'neut' : n > 0.001 ? 'pos' : n < -0.001 ? 'neg' : 'neut';

/* ── i18n description helpers ── */
function getDesc(m)    { return LANG === 'zh' ? (m.description || m.description_en || '') : (m.description_en || m.description || ''); }
function getDescSec(m) { return LANG === 'zh' ? (m.description_en || '') : (m.description || ''); }
function getMethod(m)    { return LANG === 'zh' ? (m.methodology_cn || m.methodology || '') : (m.methodology || m.methodology_cn || ''); }
function getMethodSec(m) { return LANG === 'zh' ? (m.methodology || '') : (m.methodology_cn || ''); }

/* ── HTML escape ── */
function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

/* ── Mode helpers ── */
function getMode(sd, key) {
  if (sd.mode) return sd.mode;
  const base = baseKey(key);
  const type = (sd.meta?.type || '').toLowerCase();
  if (base === 'C_quant' || base === 'E_baseline' || type.includes('rule') || type.includes('quant') || type.includes('simple')) return 'rules';
  if (sd.llm_model) return 'llm';
  return 'fallback';
}

function getRunMode(run, strats, keys) {
  if (run.llm_model) return 'llm';
  const modes = keys.map(k => getMode(strats[k], k));
  if (modes.some(m => m === 'llm')) return 'llm';
  if (modes.every(m => m === 'rules')) return 'rules';
  return 'fallback';
}

function modeBadge(mode, llmModel) {
  if (mode === 'llm') {
    const m = llmModel ? ` (${llmModel.charAt(0).toUpperCase() + llmModel.slice(1)})` : '';
    return `<span class="badge-mode badge-llm">🤖 ${T('ai_badge')}${esc(m)}</span>`;
  }
  if (mode === 'fallback') return `<span class="badge-mode badge-fallback">⚙️ ${T('rules_fallback')}</span>`;
  if (mode === 'rules') return `<span class="badge-mode badge-rules">📊 ${T('rule_based')}</span>`;
  return '';
}
