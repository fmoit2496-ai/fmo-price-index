/* ============================================================
   ดัชนีราคากลางสินค้าสัตว์น้ำ องค์การสะพานปลา
   v2 — ตัวเลือกการแสดงผลของผู้เยี่ยมชม + ข้อมูลย้อนหลังหลายปี
   ============================================================ */
'use strict';
(function () {

/* ---------------- constants & helpers ---------------- */
const I18N = window.FMO_I18N;
const tr = s => I18N.tr(s);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const CAT_LABEL = { fish:'ปลา', crab:'ปู', squid:'หมึก', shrimp:'กุ้ง', shell:'หอย' };
const CAT_ORDER = Object.keys(CAT_LABEL);
const CAT_DOT = { fish:'#1568B8', crab:'#D2603A', squid:'#7A4FCB', shrimp:'#C6851B', shell:'#0C9385' };
const CAT_FROM_TH = {}; CAT_ORDER.forEach(k => CAT_FROM_TH[CAT_LABEL[k]] = k);
const SIZE_LABEL = { S:'เล็ก', M:'กลาง', B:'ใหญ่', JAR:'กระปุก' };
const SIZE_ORDER = ['S','M','B','JAR'];
const TH_M = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const TH_MS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const MAX_TREND = 4;
const isIdx = k => k === 'INDEX' || (typeof k === 'string' && k.indexOf('IDX:') === 0);
const idxCat = k => k === 'INDEX' ? 'all' : String(k).slice(4);
const OFFICIAL_BASE = '2025-01-01';   // ฐานดัชนีที่เผยแพร่แล้ว (ม.ค. 2568) คงที่แม้เพิ่มข้อมูลปีก่อนหน้า
const RANGE_MONTHS = { '6m':6, '1y':12, '3y':36, '5y':60 };

/* option sets for segmented controls (single source of truth) */
const SEGS = {
  range:   [['6m','6 เดือน'],['1y','1 ปี'],['3y','3 ปี'],['5y','5 ปี'],['all','ทั้งหมด']],
  gran:    [['announce','รายประกาศ'],['month','รายเดือน'],['year','รายปี']],
  chart:   [['line','เส้น'],['area','พื้นที่'],['bar','แท่ง']],
  size:    [['auto','อัตโนมัติ'],['B','ใหญ่'],['M','กลาง'],['S','เล็ก']],
  base:    [['official','ฐานทางการ'],['range','ต้นช่วงที่เลือก']],
  theme:   [['auto','ตามอุปกรณ์'],['light','สว่าง'],['dark','มืด']],
  fs:      [['1','มาตรฐาน'],['1.125','ใหญ่'],['1.25','ใหญ่มาก']],
  compare: [['prev','ประกาศก่อนหน้า'],['year','1 ปีก่อน']],
  view:    [['table','ตาราง'],['card','การ์ด']],
  valmode: [['price','ราคา'],['pct','% เปลี่ยนแปลง']],
  tview:   [['timeline','ต่อเนื่อง'],['yoy','เทียบรายปี']]
};
const SORTS = ['name','priceDesc','priceAsc','change','cat'];

const DEFAULTS = { range:'1y', gran:'announce', chart:'line', size:'auto', base:'official', theme:'auto', fs:'1',
  compare:'prev', cat:'all', view:null, valmode:'price', tview:'timeline', sort:'name', trendItems:['INDEX'] };

const LS = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k,v){ try { localStorage.setItem(k,v); return true; } catch(e){ return false; } },
  del(k){ try { localStorage.removeItem(k); } catch(e){} }
};

/* ---------------- state ---------------- */
let P = Object.assign({}, DEFAULTS);                       // preferences (persisted)
const S = { tab:'overview', dateSel:null, search:'', admin:false,
            showTable:{ index:false, trend:false }, colorIdx:{}, lastTrend:null };
const SEED = JSON.parse($('#seed-data').textContent);
let CUSTOM = { items:{}, prices:{} };
let DB = { items:{}, prices:{}, dates:[] };
const charts = {};

function validPref(k, v){
  if (SEGS[k]) return SEGS[k].some(o => o[0] === v);
  if (k === 'sort') return SORTS.includes(v);
  if (k === 'cat') return v === 'all' || CAT_ORDER.includes(v);
  if (k === 'trendItems') return Array.isArray(v) && v.length > 0 && v.length <= MAX_TREND && v.every(x => typeof x === 'string');
  if (k === 'view') return v === 'table' || v === 'card';
  return false;
}
function loadPrefs(){
  let o = {};
  try { o = JSON.parse(LS.get('fmo.prefs.v2') || '{}') || {}; } catch(e){ o = {}; }
  P = Object.assign({}, DEFAULTS);
  Object.keys(DEFAULTS).forEach(k => { if (o[k] !== undefined && validPref(k, o[k])) P[k] = o[k]; });
  if (!P.view) P.view = window.innerWidth < 720 ? 'card' : 'table';
}
function savePrefs(){ LS.set('fmo.prefs.v2', JSON.stringify(P)); }

function loadCustom(){
  try {
    const o = JSON.parse(LS.get('fmo.custom.v1') || 'null');
    if (o && o.prices) CUSTOM = { items:o.items || {}, prices:o.prices };
  } catch(e){}
}
function saveCustom(){
  const ok = LS.set('fmo.custom.v1', JSON.stringify(CUSTOM));
  if (!ok) toast('เบราว์เซอร์ไม่อนุญาตให้เก็บข้อมูลในเครื่อง ข้อมูลจะหายเมื่อปิดหน้านี้');
}
function rebuildDB(){
  DB.items = Object.assign({}, SEED.items, CUSTOM.items);
  DB.prices = Object.assign({}, SEED.prices, CUSTOM.prices);
  DB.dates = Object.keys(DB.prices).sort();
}

/* ---------------- date & number helpers ---------------- */
const pd = s => { const [y,m,d] = s.split('-').map(Number); return new Date(Date.UTC(y, m-1, d)); };
const isoOf = dt => dt.toISOString().slice(0,10);
const be = y => Number(y) + 543;
function thaiDate(s){ const [y,m,d] = s.split('-').map(Number); return `${d} ${TH_M[m-1]} ${be(y)}`; }
function thaiDateShort(s){ const [y,m,d] = s.split('-').map(Number); return `${d} ${TH_MS[m-1]} ${String(be(y)).slice(-2)}`; }
function monthLabel(k){ const [y,m] = k.split('-').map(Number); return `${TH_MS[m-1]} ${String(be(y)).slice(-2)}`; }
function shiftMonths(s, n){
  const dt = pd(s); const day = dt.getUTCDate();
  dt.setUTCDate(1); dt.setUTCMonth(dt.getUTCMonth() + n);
  const dim = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth()+1, 0)).getUTCDate();
  dt.setUTCDate(Math.min(day, dim));
  return isoOf(dt);
}
const dayDiff = (a, b) => Math.round((pd(a) - pd(b)) / 864e5);
const monthsBetween = (a, b) => { const x = pd(a), y = pd(b); return (y.getUTCFullYear()-x.getUTCFullYear())*12 + y.getUTCMonth() - x.getUTCMonth(); };
function spanText(months){
  if (months < 1) return 'ไม่ถึง 1 เดือน';
  const y = Math.floor(months / 12), m = months % 12;
  return [y ? `${y} ปี` : '', m ? `${m} เดือน` : ''].filter(Boolean).join(' ');
}
const fmt0 = n => n == null ? '—' : Math.round(n).toLocaleString('en-US');
const fmt1 = n => n == null ? '—' : n.toFixed(1);
const signed = (n, d = 1) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n).toFixed(d);

/* ---------------- price logic ---------------- */
function sizeOrder(pref){ return pref === 'auto' ? ['B','M','S','JAR'] : [pref]; }
function priceOf(id, date, pref){
  const day = DB.prices[date]; const rec = day && day[id];
  if (!rec) return null;
  const order = sizeOrder(pref == null ? P.size : pref);
  for (const s of order) if (rec[s] != null) return rec[s];
  return null;
}
const catName = c => c === 'all' ? 'ทุกชนิด' : CAT_LABEL[c];
const inCat = id => P.cat === 'all' || (DB.items[id] && DB.items[id].cat === P.cat);
function indexAt(date, baseDate, pref, cat){
  let sum = 0, n = 0;
  for (const id in DB.items){
    if (cat && cat !== 'all' && DB.items[id].cat !== cat) continue;
    const a = priceOf(id, date, pref), b = priceOf(id, baseDate, pref);
    if (a && b){ sum += a / b * 100; n++; }
  }
  return n ? sum / n : null;
}
function rangeCutoff(){
  if (P.range === 'all' || !DB.dates.length) return DB.dates[0];
  return shiftMonths(DB.dates[DB.dates.length - 1], -RANGE_MONTHS[P.range]);
}
function datesInRange(){ const c = rangeCutoff(); return DB.dates.filter(d => d >= c); }
function officialBase(){ return DB.prices[OFFICIAL_BASE] ? OFFICIAL_BASE : DB.dates[0]; }
function baseDateFor(dates){ return P.base === 'range' ? dates[0] : officialBase(); }

function yearAgoDate(date){
  const target = shiftMonths(date, -12); let best = null, bd = 1e9;
  for (const d of DB.dates){ if (d >= date) break; const diff = Math.abs(dayDiff(d, target)); if (diff < bd){ bd = diff; best = d; } }
  return bd <= 45 ? best : null;
}
function prevDate(date){ const i = DB.dates.indexOf(date); return i > 0 ? DB.dates[i-1] : null; }
function compareDate(date){ return P.compare === 'year' ? yearAgoDate(date) : prevDate(date); }
function changePct(id, date, cmp){
  if (!cmp) return null;
  const a = priceOf(id, cmp), b = priceOf(id, date);
  return (a && b) ? (b - a) / a * 100 : null;
}
function pillHtml(c){
  if (c == null) return '<span class="pill flat">—</span>';
  if (Math.abs(c) < 0.05) return '<span class="pill flat">ทรงตัว</span>';
  return c > 0 ? `<span class="pill up">▲ ${signed(c)}%</span>` : `<span class="pill down">▼ ${signed(c)}%</span>`;
}

/* ---------------- series & aggregation ---------------- */
function bucketKey(date, gran){ return gran === 'month' ? date.slice(0,7) : gran === 'year' ? date.slice(0,4) : date; }
function aggregate(points, gran){
  if (gran === 'announce') return points.map(p => ({ k:p.date, label:thaiDateShort(p.date), v:p.v }));
  const m = new Map();
  points.forEach(p => { const k = bucketKey(p.date, gran); const e = m.get(k) || { s:0, n:0 }; e.s += p.v; e.n++; m.set(k, e); });
  return Array.from(m, ([k, e]) => ({ k, label: gran === 'month' ? monthLabel(k) : 'ปี ' + be(k), v: e.s / e.n }));
}
function labelForKey(k, gran){ return gran === 'announce' ? thaiDateShort(k) : gran === 'month' ? monthLabel(k) : 'ปี ' + be(k); }
/* align several aggregated series on the union of their bucket keys */
function align(seriesList){
  const keys = Array.from(new Set(seriesList.flatMap(s => s.map(p => p.k)))).sort();
  return { keys, values: seriesList.map(s => { const m = new Map(s.map(p => [p.k, p.v])); return keys.map(k => m.has(k) ? m.get(k) : null); }) };
}
function valueOf(def, date, baseDate){
  return isIdx(def.key) ? indexAt(date, baseDate, def.size, idxCat(def.key)) : priceOf(def.key, date, def.size);
}
function pointsFor(def, dates, baseDate){
  return dates.map(d => ({ date:d, v:valueOf(def, d, baseDate) })).filter(p => p.v != null);
}
function toPct(values){
  const first = values.find(v => v != null);
  return values.map(v => (v == null || !first) ? null : (v / first - 1) * 100);
}
function statsOf(points){
  if (!points.length) return null;
  let max = points[0], min = points[0], sum = 0;
  points.forEach(p => { sum += p.v; if (p.v > max.v) max = p; if (p.v < min.v) min = p; });
  const last = points[points.length - 1], first = points[0];
  return { last, avg: sum / points.length, max, min, change: first.v ? (last.v / first.v - 1) * 100 : null, n: points.length };
}

/* ---------------- theme & colours ---------------- */
const mqDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
function isDark(){
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'dark' || (t !== 'light' && mqDark && mqDark.matches);
}
function tok(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function applyAppearance(){
  const root = document.documentElement;
  if (P.theme === 'auto') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', P.theme);
  root.style.setProperty('--fs', P.fs);
}
const RAMP_LIGHT = ['#9ec5f4','#86b6ef','#5598e7','#2a78d6','#1c5cab','#104281'];
const RAMP_DARK  = ['#184f95','#1c5cab','#3987e5','#5598e7','#86b6ef','#b7d3f6'];
function hexA(hex, a){
  const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}

/* ---------------- tiny UI helpers ---------------- */
function toast(msg){
  const t = $('#toast'); $('#toastMsg').textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 3600);
}
function setText(id, txt){ const el = $('#' + id); if (el) el.textContent = txt; }
function setHtml(id, h){ const el = $('#' + id); if (el) el.innerHTML = h; }
function sizeLabelPref(){ return P.size === 'auto' ? 'อัตโนมัติ (ใหญ่→กลาง→เล็ก)' : 'ขนาด' + SIZE_LABEL[P.size]; }
const granLabel = () => (SEGS.gran.find(o => o[0] === P.gran) || [,''])[1];
const rangeLabel = () => (SEGS.range.find(o => o[0] === P.range) || [,''])[1];

/* ============================================================
   RENDER — HERO / NOTICES
   ============================================================ */
function renderHero(){
  const first = officialBase(), last = DB.dates[DB.dates.length - 1];
  setText('itemCountInline', Object.keys(DB.items).length);
  setText('todayLabel', 'วันนี้ ' + thaiDate(isoOf(new Date(Date.now() + 7 * 3600e3))));
  setText('gaugeLabel', `ดัชนีราคากลางสินค้าสัตว์น้ำ (ฐาน ${thaiDateShort(first)} = 100)`);
  const idx = indexAt(last, first, P.size);
  const pv = prevDate(last); const idxPrev = pv ? indexAt(pv, first, P.size) : null;
  setHtml('gaugeValue', `${fmt1(idx)}<small>จุด</small>`);
  const chip = $('#gaugeChip');
  if (idxPrev != null && idx != null){
    const p = (idx / idxPrev - 1) * 100;
    if (Math.abs(p) < 0.05){ chip.className = 'gauge-chip flat'; chip.textContent = 'ทรงตัว'; }
    else if (p > 0){ chip.className = 'gauge-chip up'; chip.textContent = '▲ ' + signed(p) + '%'; }
    else { chip.className = 'gauge-chip down'; chip.textContent = '▼ ' + signed(p) + '%'; }
    setText('gaugeChangeLabel', 'เทียบประกาศ ' + thaiDateShort(pv));
  } else { chip.className = 'gauge-chip flat'; chip.textContent = '—'; setText('gaugeChangeLabel', 'ยังไม่มีประกาศก่อนหน้าให้เทียบ'); }
  const days = dayDiff(isoOf(new Date(Date.now() + 7 * 3600e3)), last);
  setHtml('gaugeLatestDate', `${esc(thaiDate(last))}${days > 0 ? ` <span style="font-weight:400;opacity:.75">(${days} วันที่แล้ว)</span>` : ''}`);
  const years = Array.from(new Set(DB.dates.map(d => d.slice(0,4)))).length;
  setText('gaugeCount', `${DB.dates.length} ประกาศ · ${years} ปี`);
}
function renderNotices(){
  const last = DB.dates[DB.dates.length - 1];
  const days = dayDiff(isoOf(new Date(Date.now() + 7 * 3600e3)), last);
  const stale = $('#staleBar');
  if (days > 45){
    stale.hidden = false;
    stale.textContent = `ขณะนี้ประกาศราคาล่าสุดในระบบคือวันที่ ${thaiDate(last)} (ผ่านมาแล้วประมาณ ${spanText(Math.floor(days / 30))}) ราคาที่แสดงอาจไม่ตรงกับราคาตลาดในวันนี้ กรุณาใช้เป็นข้อมูลอ้างอิงเท่านั้น`;
  } else stale.hidden = true;
  const cb = $('#customBar');
  const nCustom = Object.keys(CUSTOM.prices).length;
  if (nCustom){ cb.hidden = false; cb.textContent = `คุณกำลังดูข้อมูลที่เพิ่มไว้ในเครื่องนี้ ${nCustom} ประกาศ ข้อมูลส่วนนี้ยังไม่ถูกเผยแพร่ให้ผู้เยี่ยมชมคนอื่น`; }
  else cb.hidden = true;
}
function renderCoverage(){
  const first = DB.dates[0], last = DB.dates[DB.dates.length - 1];
  const ly = +last.slice(0,4), fy = +first.slice(0,4);
  const startY = Math.min(fy, ly - 4);
  const cnt = {}; DB.dates.forEach(d => { const y = +d.slice(0,4); cnt[y] = (cnt[y] || 0) + 1; });
  let h = '<span class="cover-label">ข้อมูลในระบบ</span>';
  for (let y = startY; y <= ly; y++){
    const n = cnt[y] || 0;
    h += `<div class="cover-item ${n ? 'has' : 'empty'}"><b>${be(y)}</b><span>${n ? n + ' ประกาศ' : 'ไม่มีข้อมูล'}</span></div>`;
  }
  setHtml('coverage', h);
}
function renderRangeInfo(){
  const dates = datesInRange();
  const txt = dates.length ? `แสดง ${thaiDateShort(dates[0])} – ${thaiDateShort(dates[dates.length-1])} · ${dates.length} ประกาศ` : 'ไม่มีข้อมูลในช่วงนี้';
  setText('rangeInfoOv', txt); setText('rangeInfoTr', txt);
  const first = DB.dates[0], last = DB.dates[DB.dates.length - 1];
  const avail = monthsBetween(first, last);
  const req = RANGE_MONTHS[P.range];
  let msg = '';
  if (req && req > avail + 1)
    msg = `คุณเลือกดูย้อนหลัง ${rangeLabel()} แต่ตอนนี้ระบบมีข้อมูลย้อนหลังประมาณ ${spanText(avail)} (${thaiDateShort(first)} – ${thaiDateShort(last)}) กราฟจึงแสดงเท่าที่มี ข้อมูลปีก่อนหน้านี้จะปรากฏเมื่อมีการนำเข้า`;
  ['rangeNoticeOv','trendNotice'].forEach(id => { const el = $('#' + id); if (!el) return;
    if (id === 'trendNotice'){ el.dataset.range = msg; } else { el.hidden = !msg; el.textContent = msg; } });
}

/* ============================================================
   CHART ENGINE
   ============================================================ */
function drawSeriesChart(canvasId, o){
  const canvas = $('#' + canvasId); if (!canvas || typeof Chart === 'undefined') return;
  if (charts[canvasId]) charts[canvasId].destroy();
  const many = o.datasets.length > 1;
  const nPts = o.labels.length;
  const ink = tok('--ink'), muted = tok('--muted'), grid = tok('--grid'), card = tok('--card');
  const datasets = o.datasets.map(d => {
    const isBar = o.type === 'bar';
    const common = { label:tr(d.name), _vals:d.values, borderColor:d.color };
    if (isBar){
      return Object.assign(common, { type:'bar', backgroundColor:d.color, borderRadius:3, borderSkipped:false, maxBarThickness:30,
        data:d.values.map(v => v == null ? null : (o.anchor != null ? [o.anchor, v] : v)) });
    }
    return Object.assign(common, { type:'line', data:d.values, borderWidth:d.bold ? 3 : 2, tension:.3, spanGaps:true,
      pointRadius: nPts <= 40 ? 3 : 0, pointHoverRadius:6, pointHitRadius:14, pointBackgroundColor:d.color, pointBorderColor:card, pointBorderWidth:1.5,
      fill: (o.type === 'area' && !many) ? 'origin' : false,
      backgroundColor: (o.type === 'area' && !many) ? (c => {
        const a = c.chart.chartArea; if (!a) return hexA(d.color, .15);
        const g = c.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom); g.addColorStop(0, hexA(d.color, .30)); g.addColorStop(1, hexA(d.color, .02)); return g;
      }) : d.color });
  });
  charts[canvasId] = new Chart(canvas.getContext('2d'), {
    data:{ labels:o.labels.map(tr), datasets },
    options:{
      responsive:true, maintainAspectRatio:false, animation:{ duration: reduceMotion ? 0 : 400 },
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ display:many, position:'top', align:'end', labels:{ color:ink, usePointStyle:true, pointStyle:'rectRounded', boxWidth:10, boxHeight:10, padding:14 } },
        tooltip:{ backgroundColor:tok('--tt-bg'), titleColor:'#fff', bodyColor:'#E8F0FA', borderColor:tok('--line'), borderWidth:1, padding:10, cornerRadius:8, boxPadding:4,
          callbacks:{ label:c => { const v = c.dataset._vals[c.dataIndex]; return v == null ? null : ' ' + c.dataset.label + ': ' + tr(o.tipFmt(v)); } } }
      },
      scales:{
        x:{ grid:{ display:false }, border:{ color:grid }, ticks:{ color:muted, maxRotation:0, autoSkip:true, maxTicksLimit: window.innerWidth < 560 ? 5 : 10 } },
        y:{ grid:{ color:grid }, border:{ display:false }, beginAtZero: !!o.zero, suggestedMin: o.center != null ? o.center - o.minSpan : undefined, suggestedMax: o.center != null ? o.center + o.minSpan : undefined, ticks:{ color:muted, callback:v => o.yFmt(v) } }
      }
    }
  });
}
function dataTableHtml(labels, cols){
  const rows = labels.map((l, i) => `<tr><td>${esc(l)}</td>${cols.map(c => `<td>${c.values[i] == null ? '—' : c.fmt(c.values[i])}</td>`).join('')}</tr>`).reverse().join('');
  return `<table class="dt"><thead><tr><th>ช่วงเวลา</th>${cols.map(c => `<th>${esc(c.name)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>`;
}
function applyTableMode(which){
  const isI = which === 'index';
  const show = S.showTable[which];
  const box = $(isI ? '#idxChartBox' : '#trChartBox'), tbl = $(isI ? '#idxTable' : '#trTable'), btn = $(isI ? '#idxTableBtn' : '#trTableBtn');
  box.hidden = show; tbl.hidden = !show;
  btn.setAttribute('aria-pressed', String(show)); btn.textContent = show ? 'ดูเป็นกราฟ' : 'ดูเป็นตาราง';
  if (!show){ const c = charts[isI ? 'indexChart' : 'trendChart']; if (c) c.resize(); }
}

/* ============================================================
   RENDER — OVERVIEW
   ============================================================ */
function renderOverview(){
  const first = officialBase(), last = DB.dates[DB.dates.length - 1];
  setText('ovUpdated', thaiDate(last));
  const idxLast = indexAt(last, first, P.size, P.cat);
  setHtml('kpiIndex', `${fmt1(idxLast)}<small>จุด</small>`);
  setText('kpiIndexLabel', P.cat === 'all' ? 'ดัชนีราคากลางล่าสุด' : `ดัชนีหมวด${CAT_LABEL[P.cat]}ล่าสุด`);
  setText('kpiIndexSub', `ฐาน ${thaiDateShort(first)} = 100 · ${sizeLabelPref()}`);

  const setDelta = (idV, idS, other) => {
    const v = $('#' + idV), s = $('#' + idS);
    if (other == null || idxLast == null){ v.textContent = '—'; v.className = 'k-value'; return false; }
    const p = (idxLast / other - 1) * 100;
    v.textContent = signed(p) + '%';
    v.className = 'k-value ' + (p > 0.05 ? 'k-up' : p < -0.05 ? 'k-down' : '');
    return p;
  };
  const pv = prevDate(last);
  const p1 = setDelta('kpiPrev', 'kpiPrevSub', pv ? indexAt(pv, first, P.size, P.cat) : null);
  setText('kpiPrevSub', p1 === false ? 'ยังไม่มีประกาศก่อนหน้า' : (p1 > 0.05 ? '▲ ราคาปรับสูงขึ้น' : p1 < -0.05 ? '▼ ราคาปรับลดลง' : 'ราคาทรงตัว') + ' · ' + thaiDateShort(pv));
  const ya = yearAgoDate(last);
  const p2 = setDelta('kpiYear', 'kpiYearSub', ya ? indexAt(ya, first, P.size, P.cat) : null);
  setText('kpiYearSub', p2 === false ? 'ยังไม่มีข้อมูลย้อนหลังครบ 1 ปี' : (p2 > 0.05 ? '▲ สูงกว่าปีก่อน' : p2 < -0.05 ? '▼ ต่ำกว่าปีก่อน' : 'ใกล้เคียงปีก่อน') + ' · ' + thaiDateShort(ya));

  const inRange = datesInRange().map(d => ({ d, v:indexAt(d, first, P.size, P.cat) })).filter(x => x.v != null);
  if (inRange.length){
    const mx = inRange.reduce((a, b) => b.v > a.v ? b : a), mn = inRange.reduce((a, b) => b.v < a.v ? b : a);
    setHtml('kpiRange', `${fmt1(mx.v)} <small>/</small> ${fmt1(mn.v)}`);
    setText('kpiRangeSub', `สูงสุด ${thaiDateShort(mx.d)} · ต่ำสุด ${thaiDateShort(mn.d)}`);
  } else { setText('kpiRange', '—'); setText('kpiRangeSub', ''); }

  renderIndexChart();
  renderCatChart(last);
  renderMovers(last);
}

function renderIndexChart(){
  const dates = datesInRange();
  const base = baseDateFor(dates);
  const pts = dates.map(d => ({ date:d, v:indexAt(d, base, P.size, P.cat) })).filter(p => p.v != null);
  const agg = aggregate(pts, P.gran);
  const labels = agg.map(a => a.label), vals = agg.map(a => a.v);
  const nCat = Object.keys(DB.items).filter(inCat).length;
  setText('idxTitle', P.cat === 'all' ? 'ดัชนีราคากลางสินค้าสัตว์น้ำ' : `ดัชนีราคากลางหมวด${CAT_LABEL[P.cat]}`);
  setText('idxNote', `ฐาน ${thaiDateShort(base)} = 100 จุด · ${catName(P.cat)} ${nCat} รายการ · ${sizeLabelPref()} · ${granLabel()}`);
  const box = $('#idxChartBox');
  if (agg.length < 1){ if (charts.indexChart){ charts.indexChart.destroy(); delete charts.indexChart; } box.innerHTML = '<div class="chart-empty">ไม่มีข้อมูลในช่วงเวลานี้</div>'; setHtml('idxTable', ''); return; }
  if (!$('#indexChart')) box.innerHTML = '<canvas id="indexChart" role="img" aria-label="กราฟดัชนีราคากลางสินค้าสัตว์น้ำ"></canvas>';
  drawSeriesChart('indexChart', { labels, type:P.chart, anchor:100, center:100, minSpan:3,
    datasets:[{ name: P.cat === 'all' ? 'ดัชนีราคากลาง' : 'ดัชนีหมวด' + CAT_LABEL[P.cat], color:tok('--series-main'), values:vals }],
    yFmt:v => Number(v.toFixed(1)), tipFmt:v => v.toFixed(1) + ' จุด' });
  setHtml('idxTable', dataTableHtml(labels, [{ name:'ดัชนี (จุด)', values:vals, fmt:v => v.toFixed(1) }]));
  applyTableMode('index');
}

function catAverages(date){
  const sums = {}, cnt = {};
  CAT_ORDER.forEach(c => { sums[c] = 0; cnt[c] = 0; });
  for (const id in DB.items){ const p = priceOf(id, date); if (p != null){ const c = DB.items[id].cat; if (sums[c] != null){ sums[c] += p; cnt[c]++; } } }
  const out = {}; CAT_ORDER.forEach(c => out[c] = cnt[c] ? sums[c] / cnt[c] : null); return out;
}
function renderCatChart(last){
  const cmp = compareDate(last);
  const cur = catAverages(last), prev = cmp ? catAverages(cmp) : null;
  setText('catNote', `บาท/กก. ประกาศ ${thaiDateShort(last)}` + (cmp ? ` เทียบ ${thaiDateShort(cmp)}` : ' (ยังไม่มีประกาศให้เทียบ)'));
  if (charts.catChart) charts.catChart.destroy();
  const dim = (col, c) => (P.cat === 'all' || c === P.cat) ? col : hexA(col.length === 7 ? col : '#888888', .28);
  const datasets = [{ label:tr('ล่าสุด ' + thaiDateShort(last)), data:CAT_ORDER.map(c => cur[c]), backgroundColor:CAT_ORDER.map(c => dim(tok('--series-main'), c)), borderRadius:4, maxBarThickness:28 }];
  if (prev) datasets.push({ label:tr(thaiDateShort(cmp)), data:CAT_ORDER.map(c => prev[c]), backgroundColor:CAT_ORDER.map(c => dim(tok('--bar-prev'), c)), borderRadius:4, maxBarThickness:28 });
  charts.catChart = new Chart($('#catChart').getContext('2d'), {
    type:'bar', data:{ labels:CAT_ORDER.map(c => tr(CAT_LABEL[c])), datasets },
    options:{ responsive:true, maintainAspectRatio:false, animation:{ duration: reduceMotion ? 0 : 400 }, interaction:{ mode:'index', intersect:false },
      plugins:{ legend:{ display:datasets.length > 1, position:'top', align:'end', labels:{ color:tok('--ink'), usePointStyle:true, pointStyle:'rectRounded', boxWidth:10, boxHeight:10 } },
        tooltip:{ backgroundColor:tok('--tt-bg'), padding:10, cornerRadius:8, callbacks:{ label:c => c.parsed.y == null ? null : ' ' + c.dataset.label + ': ' + fmt0(c.parsed.y) + ' ' + tr('บาท/กก.') } } },
      scales:{ x:{ grid:{ display:false }, ticks:{ color:tok('--ink') } }, y:{ beginAtZero:true, grid:{ color:tok('--grid') }, border:{ display:false }, ticks:{ color:tok('--muted') } } } }
  });
}
function renderMovers(last){
  const cmp = compareDate(last);
  setText('moversNote', (cmp ? `ประกาศ ${thaiDateShort(last)} เทียบ ${thaiDateShort(cmp)}` : 'ยังไม่มีประกาศให้เปรียบเทียบ') + (P.cat === 'all' ? '' : ` · เฉพาะหมวด${CAT_LABEL[P.cat]}`));
  const rows = [];
  if (cmp) for (const id in DB.items){ if (!inCat(id)) continue; const c = changePct(id, last, cmp); if (c != null && Math.abs(c) > 0.01) rows.push({ id, c }); }
  rows.sort((a, b) => b.c - a.c);
  const up = rows.filter(r => r.c > 0).slice(0, 5), down = rows.filter(r => r.c < 0).slice(-5).reverse();
  const row = (r, cls) => `<div class="mover-row"><span class="mover-name">${esc(DB.items[r.id].th)}<small>${esc(DB.items[r.id].en)}</small></span><span class="mover-pct ${cls}">${cls === 'up' ? '▲' : '▼'} ${signed(r.c)}%</span></div>`;
  const none = '<div class="mover-row" style="color:var(--muted)">ไม่มีรายการเปลี่ยนแปลง</div>';
  setHtml('moversUp', up.length ? up.map(r => row(r, 'up')).join('') : none);
  setHtml('moversDown', down.length ? down.map(r => row(r, 'down')).join('') : none);
}

/* ============================================================
   RENDER — PRICE LIST
   ============================================================ */
function buildCatChips(){
  const defs = [['all','ทั้งหมด','var(--ink)']].concat(CAT_ORDER.map(c => [c, CAT_LABEL[c], CAT_DOT[c]]));
  setHtml('catChips', defs.map(d => `<button class="chip" data-cat="${d[0]}" aria-pressed="${P.cat === d[0]}"><span class="dotc" style="background:${d[2]}"></span>${d[1]}</button>`).join(''));
}
function buildDateSelect(sel){
  const byYear = {};
  DB.dates.forEach(d => (byYear[d.slice(0,4)] = byYear[d.slice(0,4)] || []).push(d));
  const el = $('#dateSelect');
  el.innerHTML = Object.keys(byYear).sort().reverse().map(y =>
    `<optgroup label="ปี ${be(y)}">${byYear[y].slice().reverse().map(d => `<option value="${d}">${esc(thaiDate(d))}</option>`).join('')}</optgroup>`).join('');
  el.value = sel;
}
function renderPrice(){
  const date = (S.dateSel && DB.prices[S.dateSel]) ? S.dateSel : DB.dates[DB.dates.length - 1];
  S.dateSel = date;
  buildDateSelect(date);
  const idx = DB.dates.indexOf(date);
  $('#datePrev').disabled = idx <= 0; $('#dateNext').disabled = idx >= DB.dates.length - 1; $('#dateLatest').disabled = idx === DB.dates.length - 1;
  const cmp = compareDate(date);

  const q = S.search.toLowerCase();
  let rows = Object.keys(DB.items).filter(id => DB.prices[date][id] && priceOf(id, date, 'auto') != null).map(id => {
    const it = DB.items[id];
    return { id, it, rep:priceOf(id, date), rec:DB.prices[date][id], ch:changePct(id, date, cmp) };
  }).filter(r => r.rep != null || P.size === 'auto');
  const total = rows.length;
  rows = rows.filter(r => (P.cat === 'all' || r.it.cat === P.cat) && (!q || r.it.th.toLowerCase().includes(q) || (r.it.en || '').toLowerCase().includes(q) || (r.it.zh || '').toLowerCase().includes(q)));
  const cmpInfo = cmp ? `เทียบกับประกาศวันที่ ${thaiDate(cmp)}` : (P.compare === 'year' ? 'ไม่มีประกาศช่วง 1 ปีก่อน (±45 วัน) ให้เทียบ' : 'นี่คือประกาศแรกในระบบ ไม่มีประกาศก่อนหน้าให้เทียบ');
  setText('plInfo', `ประกาศที่ ${idx + 1} จาก ${DB.dates.length} · ${P.cat === 'all' ? '' : 'หมวด' + CAT_LABEL[P.cat] + ' · '}แสดง ${rows.length} จาก ${total} รายการ · ${cmpInfo}` + ((SEED.meta && SEED.meta[date] && SEED.meta[date].note) ? ` · หมายเหตุ: ${SEED.meta[date].note}` : ''));

  const cmpAbs = r => r.ch == null ? -1 : Math.abs(r.ch);
  const sorters = {
    name:(a, b) => a.it.th.localeCompare(b.it.th, 'th'),
    priceDesc:(a, b) => (b.rep ?? -1) - (a.rep ?? -1),
    priceAsc:(a, b) => (a.rep ?? 1e9) - (b.rep ?? 1e9),
    change:(a, b) => cmpAbs(b) - cmpAbs(a),
    cat:(a, b) => CAT_ORDER.indexOf(a.it.cat) - CAT_ORDER.indexOf(b.it.cat) || a.it.th.localeCompare(b.it.th, 'th')
  };
  rows.sort(sorters[P.sort] || sorters.name);

  const sizes = r => SIZE_ORDER.filter(s => r.rec[s] != null);
  const graphBtn = r => `<button class="rowbtn" data-trend="${esc(r.id)}" title="ดูแนวโน้มราคา ${esc(r.it.th)}" aria-label="ดูแนวโน้มราคา ${esc(r.it.th)}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 17 9 11 13 15 21 6"/><polyline points="15 6 21 6 21 12"/></svg></button>`;
  const table = $('#plTable'), cards = $('#plCards');
  table.hidden = P.view !== 'table'; cards.hidden = P.view !== 'card';
  if (!rows.length){
    const msg = '<div class="emptystate">ไม่พบสินค้าที่ค้นหา ลองใช้คำอื่น หรือเลือกหมวด "ทั้งหมด"</div>';
    table.innerHTML = msg; cards.innerHTML = msg; return;
  }
  if (P.view === 'table'){
    table.innerHTML = `<div class="table-scroll"><table class="pt"><thead><tr><th>#</th><th>ชนิดสัตว์น้ำ</th><th>หมวดหมู่</th><th>ราคา (บาท/กก.)</th><th>เทียบก่อนหน้า</th><th><span class="sr-only">กราฟ</span></th></tr></thead><tbody>${
      rows.map((r, i) => `<tr><td>${i + 1}</td><td class="namecell"><b>${esc(r.it.th)}</b><small>${esc(r.it.en)}</small></td><td><span class="cat-tag cat-${esc(r.it.cat)}">${CAT_LABEL[r.it.cat] || ''}</span></td><td><div class="sizewrap">${sizes(r).map(s => `<span class="sizebadge">${SIZE_LABEL[s]} <b>${fmt0(r.rec[s])}</b></span>`).join('')}</div></td><td>${pillHtml(r.ch)}</td><td>${graphBtn(r)}</td></tr>`).join('')
    }</tbody></table></div>`;
  } else {
    cards.innerHTML = rows.map(r => `<article class="pcard"><div class="pcard-top"><div class="namecell"><b>${esc(r.it.th)}</b><small>${esc(r.it.en)}</small></div><span class="cat-tag cat-${esc(r.it.cat)}">${CAT_LABEL[r.it.cat] || ''}</span></div><div class="pcard-prices">${sizes(r).map(s => `<div class="pprice"><small>${SIZE_LABEL[s]}</small><b>${fmt0(r.rec[s])}</b></div>`).join('')}</div><div class="pcard-foot">${pillHtml(r.ch)}${graphBtn(r)}</div></article>`).join('');
  }
}

/* ============================================================
   RENDER — TRENDS
   ============================================================ */
function assignColors(){
  const keys = P.trendItems;
  Object.keys(S.colorIdx).forEach(k => { if (!keys.includes(k)) delete S.colorIdx[k]; });
  keys.forEach(k => { if (S.colorIdx[k] == null){ const used = new Set(Object.values(S.colorIdx)); let i = 0; while (used.has(i)) i++; S.colorIdx[k] = i; } });
}
const seriesColor = i => tok('--s' + ((i % 4) + 1));
function trendKeys(){ return P.trendItems.filter(k => (k === 'INDEX') || (isIdx(k) && CAT_LABEL[idxCat(k)]) || DB.items[k]); }
function keyName(k){ return k === 'INDEX' ? 'ดัชนีรวมทุกสินค้า' : isIdx(k) ? 'ดัชนีหมวด' + CAT_LABEL[idxCat(k)] : DB.items[k].th; }

function buildTrendControls(){
  const keys = trendKeys();
  setHtml('trendChips', keys.map(k => `<span class="selchip"><i style="background:${seriesColor(S.colorIdx[k] || 0)}"></i>${esc(keyName(k))}${keys.length > 1 ? `<button data-rm="${esc(k)}" aria-label="เอาออก ${esc(keyName(k))}">×</button>` : ''}</span>`).join(''));
  const inp = $('#trendAdd');
  const full = keys.length >= MAX_TREND;
  const opts = [];
  if (!keys.includes('INDEX')) opts.push(['ดัชนีรวมทุกสินค้า', 'INDEX', 'ดัชนี']);
  CAT_ORDER.forEach(c => { if (!keys.includes('IDX:' + c)) opts.push(['ดัชนีหมวด' + CAT_LABEL[c], 'IDX:' + c, 'ดัชนี']); });
  Object.keys(DB.items).forEach(id => { if (!keys.includes(id)) opts.push([DB.items[id].th, id, DB.items[id].en || CAT_LABEL[DB.items[id].cat]]); });
  S.trendOpts = new Map();
  opts.forEach(o => { S.trendOpts.set(normName(o[0]), o[1]); S.trendOpts.set(normName(tr(o[0])), o[1]); const it = DB.items[o[1]]; if (it){ if (it.en) S.trendOpts.set(normName(it.en), o[1]); if (it.zh) S.trendOpts.set(normName(it.zh), o[1]); } });
  setHtml('trendList', opts.map(o => `<option value="${esc(tr(o[0]))}">${esc(tr(o[2]))}</option>`).join(''));
  inp.disabled = full; inp.value = '';
  inp.placeholder = full ? `เลือกครบ ${MAX_TREND} รายการแล้ว` : 'พิมพ์ค้นหาสินค้า หรือดัชนีหมวด เพื่อเพิ่ม';
}

function trendDefs(){
  const keys = trendKeys();
  const only = (keys.length === 1 && !isIdx(keys[0])) ? keys[0] : null;
  if (only && P.size === 'auto' && P.tview === 'timeline' && DB.items[only].sizes.length > 1){
    const palette = { S:0, M:1, B:2, JAR:3 };
    return SIZE_ORDER.filter(s => DB.items[only].sizes.includes(s)).map(s => ({ key:only, size:s, name:SIZE_LABEL[s], color:seriesColor(palette[s]), unit:'บาท/กก.', sizeSeries:true }));
  }
  return keys.map(k => ({ key:k, size:P.size, name:keyName(k), color:seriesColor(S.colorIdx[k] || 0), unit:isIdx(k) ? 'จุด' : 'บาท/กก.' }));
}

function renderTrends(){
  buildTrendControls();
  const dates = datesInRange();
  const base = baseDateFor(dates);
  let defs = trendDefs();
  const mixed = defs.some(d => isIdx(d.key)) && defs.some(d => !isIdx(d.key));
  const yoy = P.tview === 'yoy';
  const mode = (mixed && !yoy) ? 'pct' : P.valmode;
  const notes = [];
  if (S.lastTrend !== null) {}
  const rangeMsg = $('#trendNotice').dataset.range;
  if (rangeMsg) notes.push(rangeMsg);
  if (mixed && !yoy && P.valmode === 'price') notes.push('ดัชนีมีหน่วยเป็น "จุด" ส่วนสินค้ามีหน่วยเป็น "บาท/กก." จึงแสดงเป็น % เปลี่ยนแปลงจากต้นช่วงเพื่อเทียบบนแกนเดียวกัน');
  if (yoy && trendKeys().length > 1) notes.push('มุมมองเทียบรายปีแสดงทีละรายการ จึงใช้รายการแรกที่เลือก: ' + keyName(trendKeys()[0]));

  const titleKeys = trendKeys().map(keyName).join(' · ');
  setText('trendTitle', yoy ? `${keyName(trendKeys()[0])} เทียบรายปี` : titleKeys);
  const unitNote = mode === 'pct' ? '% เปลี่ยนแปลงจากต้นช่วง' : (defs.every(d => isIdx(d.key)) ? `จุด (ฐาน ${thaiDateShort(base)} = 100)` : 'บาทต่อกิโลกรัม');
  setText('trendNote', `${unitNote} · ${rangeLabel()} · ${yoy ? 'ค่าเฉลี่ยรายเดือนซ้อนกันตามปี' : granLabel()} · ${sizeLabelPref()}`);

  const box = $('#trChartBox');
  const statsEl = $('#trendStats');
  let anyData = false;

  if (yoy){
    const def = { key:trendKeys()[0], size:P.size, name:keyName(trendKeys()[0]) };
    const byYear = new Map();
    dates.forEach(d => {
      const v = valueOf(def, d, base); if (v == null) return;
      const y = d.slice(0,4); if (!byYear.has(y)) byYear.set(y, Array.from({ length:12 }, () => ({ s:0, n:0 })));
      const cell = byYear.get(y)[+d.slice(5,7) - 1]; cell.s += v; cell.n++;
    });
    const years = Array.from(byYear.keys()).sort().slice(-6);
    if (byYear.size > 6) notes.push('แสดง 6 ปีล่าสุดเท่านั้น');
    if (years.length === 1) notes.push('ขณะนี้มีข้อมูลเพียง 1 ปีในช่วงที่เลือก กราฟเทียบรายปีจะชัดขึ้นเมื่อมีข้อมูลหลายปี');
    const ramp = isDark() ? RAMP_DARK : RAMP_LIGHT;
    const colors = ramp.slice(ramp.length - years.length);
    const datasets = years.map((y, i) => ({ name:'ปี ' + be(y), color:colors[i], bold:i === years.length - 1, values:byYear.get(y).map(c => c.n ? c.s / c.n : null) }));
    anyData = years.length > 0;
    const isIdxSeries = isIdx(def.key);
    if (anyData){
      if (!$('#trendChart')) box.innerHTML = '<canvas id="trendChart" role="img" aria-label="กราฟแนวโน้มราคา"></canvas>';
      drawSeriesChart('trendChart', { labels:TH_MS, datasets, type:P.chart === 'bar' ? 'line' : P.chart, yFmt:v => isIdxSeries ? Number(v.toFixed(1)) : fmt0(v), tipFmt:v => isIdxSeries ? v.toFixed(1) + ' จุด' : fmt0(v) + ' บาท/กก.' });
      setHtml('trTable', dataTableHtml(TH_MS, datasets.map(d => ({ name:d.name, values:d.values, fmt:v => isIdxSeries ? v.toFixed(1) : fmt0(v) }))));
    }
    const pts = pointsFor(def, dates, base);
    renderStatsTable([{ def, color:seriesColor(S.colorIdx[def.key] || 0), st:statsOf(pts) }]);
  } else {
    const raw = defs.map(d => pointsFor(d, dates, base));
    const agg = raw.map(r => aggregate(r, P.gran));
    const al = align(agg);
    let values = al.values;
    if (mode === 'pct') values = values.map(toPct);
    anyData = values.some(v => v.some(x => x != null));
    const labels = al.keys.map(k => labelForKey(k, P.gran));
    if (anyData){
      if (!$('#trendChart')) box.innerHTML = '<canvas id="trendChart" role="img" aria-label="กราฟแนวโน้มราคา"></canvas>';
      const datasets = defs.map((d, i) => ({ name:d.name, color:d.color, values:values[i] }));
      const pctF = v => signed(v) + '%';
      const single = defs.length === 1;
      const allIdx = defs.every(d => isIdx(d.key));
      drawSeriesChart('trendChart', { labels, datasets, type:P.chart, zero: mode === 'price' && !allIdx,
        anchor: mode === 'pct' ? 0 : (allIdx ? 100 : null), center: mode === 'pct' ? 0 : (allIdx ? 100 : null), minSpan: mode === 'pct' ? 3 : 3,
        yFmt: mode === 'pct' ? (v => signed(v, 0) + '%') : (allIdx ? (v => Number(v.toFixed(1))) : fmt0),
        tipFmt: mode === 'pct' ? pctF : (v => allIdx ? v.toFixed(1) + ' จุด' : fmt0(v) + ' บาท/กก.') });
      setHtml('trTable', dataTableHtml(labels, datasets.map(d => ({ name:d.name, values:d.values, fmt:v => mode === 'pct' ? pctF(v) : (allIdx ? v.toFixed(1) : fmt0(v)) }))));
    }
    renderStatsTable(defs.map((d, i) => ({ def:d, color:d.color, st:statsOf(raw[i]) })));
  }
  if (!anyData){
    if (charts.trendChart){ charts.trendChart.destroy(); delete charts.trendChart; }
    box.innerHTML = '<div class="chart-empty">ไม่มีข้อมูลสำหรับสินค้า/ขนาดที่เลือกในช่วงเวลานี้ ลองเปลี่ยน "ขนาดสินค้า" ในปุ่มปรับการแสดงผล</div>';
    setHtml('trTable', '');
  }
  const nEl = $('#trendNotice'); nEl.hidden = notes.length === 0; nEl.textContent = notes.join(' · ');
  applyTableMode('trend');
}
function renderStatsTable(items){
  const f = (v, def) => v == null ? '—' : (isIdx(def.key) ? v.toFixed(1) + ' จุด' : fmt0(v) + ' บาท');
  const rows = items.filter(x => x.st).map(({ def, color, st }) => `<tr><td><span class="swatch" style="background:${color}"></span>${esc(def.name)}</td>
    <td>${f(st.last.v, def)}<small>${thaiDateShort(st.last.date)}</small></td><td>${f(st.avg, def)}</td>
    <td>${f(st.max.v, def)}<small>${thaiDateShort(st.max.date)}</small></td><td>${f(st.min.v, def)}<small>${thaiDateShort(st.min.date)}</small></td>
    <td class="${st.change > 0.05 ? 'k-up' : st.change < -0.05 ? 'k-down' : ''}">${st.change == null ? '—' : signed(st.change) + '%'}<small>${st.n} ประกาศ</small></td></tr>`).join('');
  setHtml('trendStats', rows ? `<table class="st"><thead><tr><th>รายการ</th><th>ล่าสุด</th><th>เฉลี่ย</th><th>สูงสุด</th><th>ต่ำสุด</th><th>เปลี่ยนแปลงในช่วง</th></tr></thead><tbody>${rows}</tbody></table>` : '');
}

/* ============================================================
   ADMIN — manage data
   ============================================================ */
function renderAnnounceList(){
  const dates = DB.dates.slice().reverse(); const latest = DB.dates[DB.dates.length - 1];
  setText('announceNote', `${DB.dates.length} ประกาศ เรียงจากล่าสุด`);
  setHtml('announceList', dates.map(d => {
    const custom = !!CUSTOM.prices[d];
    return `<li><span class="announce-date ${d === latest ? 'latest' : ''}"><span class="dot2"></span>${esc(thaiDate(d))}${d === latest ? ' <span class="badge badge-latest">ล่าสุด</span>' : ''}${custom ? ' <span class="badge badge-custom">เพิ่มในเครื่องนี้</span>' : ''}</span>${custom ? `<button class="icon-btn" data-del="${d}" aria-label="ลบประกาศ ${esc(thaiDate(d))}" title="ลบประกาศนี้ออกจากเครื่องนี้"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>` : ''}</li>`;
  }).join(''));
  const nd = $('#newDate').value;
  setText('dateHint', (nd && DB.prices[nd] ? `วันที่นี้มีประกาศอยู่แล้ว การบันทึกจะแทนที่ข้อมูลเดิม · ` : '') + `ประกาศล่าสุดในระบบ: ${thaiDate(latest)}`);
}
function buildAccordion(){
  const latest = DB.dates[DB.dates.length - 1];
  const openCat = $('#accordionWrap .acc-body.open') ? $('#accordionWrap .acc-body.open').dataset.cat : CAT_ORDER[0];
  setHtml('accordionWrap', CAT_ORDER.map(cat => {
    const items = Object.keys(DB.items).filter(id => DB.items[id].cat === cat);
    if (!items.length) return '';
    const rows = items.map(id => {
      const it = DB.items[id]; const rec = (DB.prices[latest] && DB.prices[latest][id]) || {};
      return `<div class="itemrow"><div class="iname">${esc(it.th)}<small>${esc(it.en)}</small></div>${SIZE_ORDER.map(s => {
        const has = (it.sizes || []).includes(s);
        return `<input type="number" inputmode="decimal" min="0" step="1" data-item="${esc(id)}" data-size="${s}" value="${has && rec[s] != null ? rec[s] : ''}" ${has ? '' : 'disabled'} aria-label="${esc(it.th)} ${SIZE_LABEL[s]}">`;
      }).join('')}</div>`;
    }).join('');
    return `<div class="accordion"><button class="acc-head" aria-expanded="${cat === openCat}"><span><span class="cat-tag cat-${cat}">${CAT_LABEL[cat]}</span> ${items.length} รายการ</span><span aria-hidden="true">${cat === openCat ? '–' : '+'}</span></button><div class="acc-body ${cat === openCat ? 'open' : ''}" data-cat="${cat}"><div class="sizehead"><span></span><span>เล็ก</span><span>กลาง</span><span>ใหญ่</span><span>กระปุก</span></div>${rows}</div></div>`;
  }).join(''));
}
function fillFromLatest(){
  const latest = DB.dates[DB.dates.length - 1]; const day = DB.prices[latest] || {};
  $$('#accordionWrap input[data-item]').forEach(inp => { const r = day[inp.dataset.item]; if (r && r[inp.dataset.size] != null && !inp.disabled) inp.value = r[inp.dataset.size]; });
}
function saveAnnouncement(){
  const date = $('#newDate').value;
  if (!date){ toast('กรุณาเลือกวันที่ประกาศ'); return; }
  const rec = {};
  $$('#accordionWrap input[data-item]').forEach(inp => {
    if (inp.disabled) return; const v = parseFloat(inp.value);
    if (!isNaN(v) && v > 0){ (rec[inp.dataset.item] = rec[inp.dataset.item] || {})[inp.dataset.size] = v; }
  });
  if (!Object.keys(rec).length){ toast('กรุณากรอกราคาอย่างน้อย 1 รายการ'); return; }
  CUSTOM.prices[date] = rec; saveCustom(); rebuildDB(); afterDataChange();
  toast('บันทึกประกาศวันที่ ' + thaiDate(date) + ' แล้ว (เก็บในเครื่องนี้)');
}

/* ---- CSV ---- */
function parseCSV(text){
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const delim = [',', ';', '\t'].map(d => [d, firstLine.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++){
    const c = text[i];
    if (q){ if (c === '"'){ if (text[i + 1] === '"'){ cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === delim){ row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r'){ if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some(x => x.trim() !== '')) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur); if (row.some(x => x.trim() !== '')) rows.push(row);
  return rows;
}
function parseDateStr(s){
  s = String(s || '').trim(); let m, y, mo, d;
  if ((m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/))){ y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/))){ d = +m[1]; mo = +m[2]; y = +m[3]; }
  else return null;
  if (y > 2400) y -= 543;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return isoOf(dt);
}
const normName = s => String(s || '').replace(/\s+/g, '').toLowerCase();
const HEADERS = { date:['วันที่','date','วันที่ประกาศ'], name:['ชื่อสินค้า','ชื่อ','สินค้า','item','name','รายการ'], cat:['หมวด','หมวดหมู่','category'],
  S:['เล็ก','s','small'], M:['กลาง','m','medium'], B:['ใหญ่','b','big','large'], JAR:['กระปุก','jar'] };
function nextCustomId(){ let n = 0; Object.keys(Object.assign({}, DB.items, CUSTOM.items)).forEach(id => { const m = /^c(\d+)$/.exec(id); if (m) n = Math.max(n, +m[1]); }); return 'c' + (n + 1); }

function importCSVText(text){
  const rows = parseCSV(text);
  if (rows.length < 2) return { ok:false, msg:'ไม่พบข้อมูลในไฟล์ (ต้องมีแถวหัวตารางและอย่างน้อย 1 แถวข้อมูล)' };
  const head = rows[0].map(h => h.trim().toLowerCase());
  const col = {}; Object.keys(HEADERS).forEach(k => { col[k] = head.findIndex(h => HEADERS[k].includes(h)); });
  if (col.date < 0 || col.name < 0) return { ok:false, msg:'ไม่พบคอลัมน์ "วันที่" และ "ชื่อสินค้า" ในแถวแรก กรุณาใช้แม่แบบที่ดาวน์โหลดจากปุ่มด้านบน' };
  if (!['S','M','B','JAR'].some(s => col[s] >= 0)) return { ok:false, msg:'ไม่พบคอลัมน์ราคา (เล็ก / กลาง / ใหญ่ / กระปุก)' };

  const items = Object.assign({}, DB.items); const newItems = {};
  const staged = {}; const unknown = new Set(); const created = new Set(); let badDate = 0, used = 0, badPrice = 0;
  const findItem = nm => { const n = normName(nm); for (const id in items) if (id === nm.trim() || normName(items[id].th) === n || (items[id].en && normName(items[id].en) === n)) return id; return null; };

  for (let r = 1; r < rows.length; r++){
    const row = rows[r]; const date = parseDateStr(row[col.date]);
    const nm = (row[col.name] || '').trim();
    if (!nm) continue;
    if (!date){ badDate++; continue; }
    const prices = {};
    ['S','M','B','JAR'].forEach(s => { if (col[s] >= 0){ const raw = String(row[col[s]] || '').replace(/[, ]/g, ''); if (raw !== ''){ const v = parseFloat(raw); if (isNaN(v) || v <= 0) badPrice++; else prices[s] = v; } } });
    if (!Object.keys(prices).length) continue;
    let id = findItem(nm);
    if (!id){
      const cat = col.cat >= 0 ? CAT_FROM_TH[(row[col.cat] || '').trim()] : null;
      if (!cat){ unknown.add(nm); continue; }
      id = nextCustomId(); items[id] = { th:nm, en:'', cat, sizes:[] }; newItems[id] = items[id]; created.add(nm);
    }
    const it = items[id];
    Object.keys(prices).forEach(s => { if (!(it.sizes || []).includes(s)){ it.sizes = SIZE_ORDER.filter(x => (it.sizes || []).includes(x) || x === s); newItems[id] = it; } });
    (staged[date] = staged[date] || {}); (staged[date][id] = staged[date][id] || {}); Object.assign(staged[date][id], prices); used++;
  }
  const dates = Object.keys(staged).sort();
  if (!dates.length) return { ok:false, msg:'ไม่มีแถวข้อมูลที่นำเข้าได้' + (unknown.size ? `\nสินค้าที่ไม่รู้จัก (ต้องระบุคอลัมน์ "หมวด" หากเป็นสินค้าใหม่): ${Array.from(unknown).slice(0, 8).join(', ')}` : '') + (badDate ? `\nแถววันที่ไม่ถูกต้อง: ${badDate}` : '') };
  const overwritten = dates.filter(d => DB.prices[d]).length;
  dates.forEach(d => { CUSTOM.prices[d] = Object.assign({}, DB.prices[d] || {}, staged[d]); });
  Object.assign(CUSTOM.items, newItems);
  saveCustom(); rebuildDB(); afterDataChange();
  const yrs = Array.from(new Set(dates.map(d => be(d.slice(0, 4))))).join(', ');
  let msg = `นำเข้าสำเร็จ ${dates.length} ประกาศ (${thaiDate(dates[0])} – ${thaiDate(dates[dates.length - 1])}) · ปี ${yrs} · ${used} แถวราคา`;
  if (overwritten) msg += `\nมี ${overwritten} วันที่ซ้ำกับประกาศเดิม ระบบรวมราคาที่นำเข้าทับรายการเดิม`;
  if (created.size) msg += `\nเพิ่มสินค้าใหม่ ${created.size} รายการ: ${Array.from(created).slice(0, 8).join(', ')}`;
  if (unknown.size) msg += `\nข้ามสินค้าที่ไม่รู้จัก ${unknown.size} ชื่อ (ไม่มีคอลัมน์หมวด): ${Array.from(unknown).slice(0, 8).join(', ')}`;
  if (badDate) msg += `\nข้ามแถวที่วันที่ไม่ถูกต้อง ${badDate} แถว`;
  if (badPrice) msg += `\nข้ามราคาที่ไม่ใช่ตัวเลข ${badPrice} ช่อง`;
  return { ok:true, msg };
}
function downloadBlob(name, text, type){
  const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function downloadTemplate(){
  const latest = DB.dates[DB.dates.length - 1]; const day = DB.prices[latest] || {};
  const q = s => /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  const lines = ['วันที่,ชื่อสินค้า,หมวด,เล็ก,กลาง,ใหญ่,กระปุก'];
  Object.keys(DB.items).forEach(id => { const it = DB.items[id], r = day[id] || {};
    lines.push([latest, q(it.th), CAT_LABEL[it.cat], r.S ?? '', r.M ?? '', r.B ?? '', r.JAR ?? ''].join(',')); });
  downloadBlob('fmo-price-template.csv', '﻿' + lines.join('\r\n') + '\r\n', 'text/csv;charset=utf-8');
  toast('ดาวน์โหลดแม่แบบแล้ว: แก้วันที่และราคา แล้วคัดลอกชุดเดิมต่อท้ายสำหรับประกาศอื่น');
}

/* ---- Public price export (CSV, UTF-8 with BOM so Excel shows Thai/Chinese correctly) ---- */
const EXP_L = {
  th:{ date:'วันที่ประกาศ (ค.ศ.)', n_th:'ชื่อสินค้า (ไทย)', n_en:'ชื่อสินค้า (อังกฤษ)', n_zh:'ชื่อสินค้า (จีน)', cat:'หมวด', S:'เล็ก', M:'กลาง', B:'ใหญ่', JAR:'กระปุก', unit:'บาท/กก.', note:'หมายเหตุ',
       jar:'ประกาศเป็นช่วง 200–250 บาท ใช้ค่ากลาง 225', src:'ที่มา: ประกาศราคากลางสินค้าสัตว์น้ำ องค์การสะพานปลา' },
  en:{ date:'Announcement date', n_th:'Product (Thai)', n_en:'Product (English)', n_zh:'Product (Chinese)', cat:'Category', S:'Small', M:'Medium', B:'Large', JAR:'Jar', unit:'THB/kg', note:'Note',
       jar:'Announced as a range of 200–250 THB; midpoint 225 used', src:'Source: Fish Marketing Organization benchmark aquatic-product price announcements' },
  zh:{ date:'公告日期', n_th:'产品名称(泰文)', n_en:'产品名称(英文)', n_zh:'产品名称(中文)', cat:'类别', S:'小', M:'中', B:'大', JAR:'罐装', unit:'泰铢/公斤', note:'备注',
       jar:'公告价格区间为200–250泰铢,取中间值225', src:'来源:泰国鱼市场组织水产品基准价格公告' }
};
const EXP_CAT = { th:{fish:'ปลา',crab:'ปู',squid:'หมึก',shrimp:'กุ้ง',shell:'หอย'}, en:{fish:'Fish',crab:'Crab',squid:'Squid',shrimp:'Shrimp',shell:'Shellfish'}, zh:{fish:'鱼类',crab:'蟹类',squid:'鱿鱼墨鱼',shrimp:'虾类',shell:'贝类'} };
function exportRows(dates){
  const L = EXP_L[I18N.lang] || EXP_L.th, C = EXP_CAT[I18N.lang] || EXP_CAT.th;
  const q = v => { v = v == null ? '' : String(v); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const head = [L.date, L.n_th, L.n_en, L.n_zh, L.cat, ...SIZE_ORDER.map(s => `${L[s]} (${L.unit})`), L.note];
  const lines = [head.map(q).join(',')];
  dates.forEach(d => {
    const day = DB.prices[d] || {}; const metaNote = (SEED.meta && SEED.meta[d] && SEED.meta[d].note) || '';
    Object.keys(DB.items).forEach(id => {
      const r = day[id]; if (!r) return; const it = DB.items[id];
      const notes = []; if (r.JAR != null) notes.push(L.jar); if (metaNote) notes.push(I18N.trL(metaNote, I18N.lang));
      lines.push([d, it.th, it.en || '', it.zh || '', C[it.cat] || '', ...SIZE_ORDER.map(s => r[s] ?? ''), notes.join(' ; ')].map(q).join(','));
    });
  });
  return { text:'\uFEFF' + lines.join('\r\n') + '\r\n', n:lines.length - 1 };
}
function exportPrices(all){
  const dates = all ? DB.dates.slice() : [S.dateSel || DB.dates[DB.dates.length - 1]];
  const { text, n } = exportRows(dates);
  const name = all ? `fmo-prices-${dates[0]}_to_${dates[dates.length - 1]}.csv` : `fmo-prices-${dates[0]}.csv`;
  downloadBlob(name, text, 'text/csv;charset=utf-8');
  const lg = I18N.lang, d0 = dates[0];
  toast(lg === 'en' ? (all ? `Downloaded: ${dates.length} announcements, ${n} rows` : `Downloaded: announcement of ${d0}, ${n} items`)
      : lg === 'zh' ? (all ? `已下载:${dates.length} 期公告,共 ${n} 行` : `已下载:${d0} 公告,共 ${n} 项`)
      : (all ? `ดาวน์โหลดแล้ว: ${dates.length} ประกาศ ${n} แถว` : `ดาวน์โหลดแล้ว: ประกาศ ${thaiDate(d0)} ${n} รายการ`));
}
function exportJSON(){
  const last = DB.dates[DB.dates.length - 1];
  downloadBlob(`fmo-price-data-${last}.json`, JSON.stringify({ version:2, exportedAt:new Date().toISOString(), items:DB.items, prices:DB.prices }), 'application/json');
  toast('ดาวน์โหลดไฟล์ข้อมูลทั้งหมดแล้ว');
}
function importJSONText(text){
  const o = JSON.parse(text); const prices = o.prices || o;
  if (!prices || typeof prices !== 'object') throw new Error('bad');
  let n = 0;
  Object.keys(prices).forEach(d => { if (/^\d{4}-\d{2}-\d{2}$/.test(d) && prices[d] && typeof prices[d] === 'object'){ CUSTOM.prices[d] = prices[d]; n++; } });
  if (o.items && typeof o.items === 'object') Object.keys(o.items).forEach(id => { const it = o.items[id]; if (!SEED.items[id] || JSON.stringify(SEED.items[id]) !== JSON.stringify(it)) CUSTOM.items[id] = it; });
  if (!n) throw new Error('empty');
  saveCustom(); rebuildDB(); afterDataChange(); return n;
}


/* ============================================================
   GLOBAL PRODUCT SEARCH (hero)
   ============================================================ */
const G = { active:-1, results:[] };
function gSearchResults(q){
  const n = normName(q); if (!n) return [];
  const last = DB.dates[DB.dates.length - 1];
  const out = [];
  Object.keys(DB.items).forEach(id => {
    const it = DB.items[id]; const t = normName(it.th), e = normName(it.en), z = normName(it.zh), c = normName(CAT_LABEL[it.cat]);
    const cs = [c, normName(I18N.trL(CAT_LABEL[it.cat], 'en')), normName(I18N.trL(CAT_LABEL[it.cat], 'zh'))];
    const pos = t.indexOf(n) >= 0 ? t.indexOf(n) : (e.indexOf(n) >= 0 ? 50 + e.indexOf(n) : (z && z.indexOf(n) >= 0 ? 30 + z.indexOf(n) : (cs.includes(n) ? 90 : -1)));
    if (pos >= 0) out.push({ id, pos, it, price:priceOf(id, last, 'auto') });
  });
  out.sort((a, b) => a.pos - b.pos || a.it.th.localeCompare(b.it.th, 'th'));
  return out.slice(0, 12);
}
function gPrices(r){
  const rec = DB.prices[DB.dates[DB.dates.length - 1]][r.id] || {};
  const ss = ['S','M','B','JAR'].filter(s => rec[s] != null);
  return ss.length ? ss.map(s => `<span>${SIZE_LABEL[s]} <b>${fmt0(rec[s])}</b></span>`).join('') : '—';
}
function gRender(){
  const input = $('#gSearch'), list = $('#gList'); const q = input.value.trim();
  if (!q){ list.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
  G.results = gSearchResults(q); G.active = G.results.length ? 0 : -1;
  list.innerHTML = G.results.length ? `<li class="g-head" role="presentation">ราคาตามประกาศล่าสุด ${thaiDate(DB.dates[DB.dates.length - 1])} (บาท/กก.) · แตะรายการเพื่อดูรายละเอียดและราคาย้อนหลัง</li>` + G.results.map((r, i) => `<li role="option" id="gopt-${i}" data-i="${i}" aria-selected="${i === G.active}"><span class="g-name"><b>${esc(r.it.th)}</b><small>${esc(r.it.en)}</small></span><span class="cat-tag cat-${esc(r.it.cat)}">${CAT_LABEL[r.it.cat] || ''}</span><span class="g-price">${gPrices(r)}</span></li>`).join('')
    : `<li class="g-empty" role="presentation">ไม่พบสินค้าที่ตรงกับ "${esc(q)}" ลองพิมพ์ชื่อสั้นลง เช่น "กุ้ง" หรือ "ปลา"</li>`;
  list.hidden = false; input.setAttribute('aria-expanded', 'true');
  input.setAttribute('aria-activedescendant', G.active >= 0 ? 'gopt-' + G.active : '');
}
function gClose(){ $('#gList').hidden = true; $('#gSearch').setAttribute('aria-expanded', 'false'); }
function gGo(text, exactId){
  S.search = text; $('#searchInput').value = text;
  if (exactId && P.cat !== 'all' && DB.items[exactId].cat !== P.cat){ P.cat = 'all'; savePrefs(); }
  S.dateSel = null; $('#gSearch').value = ''; gClose(); renderAll(); showTab('pricelist');
  window.scrollTo({ top: $('.navbar-outer').offsetTop, behavior: reduceMotion ? 'auto' : 'smooth' });
}
function bindGlobalSearch(){
  const input = $('#gSearch'), list = $('#gList');
  input.addEventListener('input', gRender);
  input.addEventListener('focus', gRender);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      if (list.hidden) gRender();
      if (!G.results.length) return; e.preventDefault();
      G.active = (G.active + (e.key === 'ArrowDown' ? 1 : -1) + G.results.length) % G.results.length;
      $$('#gList li[role=option]').forEach((li, i) => li.setAttribute('aria-selected', String(i === G.active)));
      input.setAttribute('aria-activedescendant', 'gopt-' + G.active);
      const el = $('#gopt-' + G.active); if (el) el.scrollIntoView({ block:'nearest' });
    } else if (e.key === 'Enter'){
      e.preventDefault(); const q = input.value.trim(); if (!q) return;
      if (G.active >= 0 && G.results[G.active] && !list.hidden) gGo(G.results[G.active].it.th, G.results[G.active].id); else gGo(q, null);
    } else if (e.key === 'Escape'){ gClose(); }
  });
  list.addEventListener('mousedown', e => { const li = e.target.closest('li[data-i]'); if (!li) return; e.preventDefault(); const r = G.results[+li.dataset.i]; if (r) gGo(r.it.th, r.id); });
  document.addEventListener('click', e => { if (!e.target.closest('.gsearch')) gClose(); });
}

/* ============================================================
   MASTER RENDER & EVENTS
   ============================================================ */
function afterDataChange(){ buildAccordion(); renderAll(); }
function syncControls(){
  $$('[data-seg]').forEach(seg => { const k = seg.dataset.seg; $$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(String(P[k]) === b.dataset.v))); });
  $$('select[data-pref]').forEach(s => { s.value = P[s.dataset.pref]; });
  $$('#catChips .chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.cat === P.cat)));
}
function renderCatBar(){
  buildCatChips();
  const n = Object.keys(DB.items).filter(inCat).length;
  setText('catNoteBar', P.cat === 'all' ? `ทุกชนิด ${n} รายการ` : `แสดงเฉพาะหมวด${CAT_LABEL[P.cat]} ${n} รายการ`);
}
function renderAll(){
  applyAppearance();
  assignColors();
  renderHero(); renderNotices(); renderCoverage(); renderRangeInfo(); renderCatBar();
  renderOverview(); renderPrice(); renderTrends(); renderAnnounceList();
  syncControls();
}
function setPref(k, v){
  if (!validPref(k, v)) return; P[k] = v; savePrefs(); renderAll();
}
function buildSegs(){
  $$('[data-seg]').forEach(seg => {
    const k = seg.dataset.seg; if (!SEGS[k]) return;
    seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', seg.dataset.label || k);
    seg.innerHTML = SEGS[k].map(o => `<button type="button" data-v="${o[0]}" aria-pressed="false">${o[1]}</button>`).join('');
    seg.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) setPref(k, b.dataset.v); });
  });
}
function showTab(name){
  if (name === 'upload' && !S.admin) name = 'overview';
  S.tab = name;
  $('#catbar').hidden = name === 'upload';
  $$('.tabbtn').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
  Object.values(charts).forEach(c => c && c.resize && c.resize());
}
function updateAdmin(){
  const h = location.hash + location.search;
  if (/admin-off/.test(h)) LS.del('fmo.admin');
  else if (/(^|[#&?])admin\b/.test(h)) LS.set('fmo.admin', '1');
  S.admin = LS.get('fmo.admin') === '1';
  $('#uploadTabBtn').hidden = !S.admin;
  if (!S.admin && S.tab === 'upload') showTab('overview');
}

/* drawer */
let lastFocus = null;
function openDrawer(){ lastFocus = document.activeElement; $('#drawer').classList.add('open'); $('#overlay').classList.add('open'); setTimeout(() => $('#closeDrawer').focus(), 50); }
function closeDrawer(){ $('#drawer').classList.remove('open'); $('#overlay').classList.remove('open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }

function bindEvents(){
  $('#tabbar').addEventListener('click', e => { const b = e.target.closest('.tabbtn'); if (b) showTab(b.dataset.tab); });
  $('#openDrawer').addEventListener('click', openDrawer);
  $('#closeDrawer').addEventListener('click', closeDrawer);
  $('#overlay').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#drawer').classList.contains('open')) closeDrawer();
    if (e.key === 'Tab' && $('#drawer').classList.contains('open')){
      const f = $$('#drawer button, #drawer select, #drawer input').filter(x => !x.disabled); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });
  $('#resetPrefs').addEventListener('click', () => { P = Object.assign({}, DEFAULTS); P.view = window.innerWidth < 720 ? 'card' : 'table'; S.colorIdx = {}; savePrefs(); renderAll(); toast('คืนค่าเริ่มต้นแล้ว'); });
  $$('select[data-pref]').forEach(s => s.addEventListener('change', () => setPref(s.dataset.pref, s.value)));

  /* price list */
  $('#dateSelect').addEventListener('change', e => { S.dateSel = e.target.value; renderPrice(); });
  $('#datePrev').addEventListener('click', () => { const i = DB.dates.indexOf(S.dateSel); if (i > 0){ S.dateSel = DB.dates[i - 1]; renderPrice(); } });
  $('#dateNext').addEventListener('click', () => { const i = DB.dates.indexOf(S.dateSel); if (i < DB.dates.length - 1){ S.dateSel = DB.dates[i + 1]; renderPrice(); } });
  $('#dateLatest').addEventListener('click', () => { S.dateSel = DB.dates[DB.dates.length - 1]; renderPrice(); });
  $('#searchInput').addEventListener('input', e => { S.search = e.target.value.trim(); renderPrice(); });
  $('#catChips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) setPref('cat', c.dataset.cat); });
  const goTrend = e => { const b = e.target.closest('[data-trend]'); if (!b) return; P.trendItems = [b.dataset.trend]; S.colorIdx = {}; savePrefs(); renderAll(); showTab('trends'); window.scrollTo({ top: $('.navbar-outer').offsetTop, behavior: reduceMotion ? 'auto' : 'smooth' }); };
  $('#plTable').addEventListener('click', goTrend); $('#plCards').addEventListener('click', goTrend);

  /* trends */
  const addTrend = () => { const inp = $('#trendAdd'); const key = S.trendOpts && S.trendOpts.get(normName(inp.value)); if (!key || P.trendItems.includes(key) || P.trendItems.length >= MAX_TREND) return; P.trendItems = P.trendItems.concat(key); savePrefs(); renderAll(); };
  $('#trendAdd').addEventListener('change', addTrend);
  $('#trendAdd').addEventListener('input', e => { if (e.inputType === 'insertReplacementText' || (!e.inputType && e.target.value)) addTrend(); });
  $('#trendChips').addEventListener('click', e => { const b = e.target.closest('[data-rm]'); if (!b) return; const next = P.trendItems.filter(k => k !== b.dataset.rm); if (next.length){ P.trendItems = next; savePrefs(); renderAll(); } });
  $('#idxTableBtn').addEventListener('click', () => { S.showTable.index = !S.showTable.index; applyTableMode('index'); });
  $('#trTableBtn').addEventListener('click', () => { S.showTable.trend = !S.showTable.trend; applyTableMode('trend'); });

  /* admin */
  $('#accordionWrap').addEventListener('click', e => { const h = e.target.closest('.acc-head'); if (!h) return; const body = h.nextElementSibling; const open = body.classList.toggle('open'); h.setAttribute('aria-expanded', String(open)); h.lastElementChild.textContent = open ? '–' : '+'; });
  $('#newDate').addEventListener('change', renderAnnounceList);
  $('#saveBtn').addEventListener('click', saveAnnouncement);
  $('#fillLatestBtn').addEventListener('click', () => { fillFromLatest(); toast('เติมราคาจากประกาศล่าสุดแล้ว'); });
  $('#exportBtn').addEventListener('click', exportJSON);
  $('#expDayBtn').addEventListener('click', () => exportPrices(false));
  $('#expAllBtn').addEventListener('click', () => exportPrices(true));
  $('#tplBtn').addEventListener('click', downloadTemplate);
  $('#announceList').addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (!b) return; const d = b.dataset.del; if (!confirm(`ลบประกาศวันที่ ${thaiDate(d)} ออกจากเครื่องนี้ใช่หรือไม่?`)) return; delete CUSTOM.prices[d]; saveCustom(); rebuildDB(); afterDataChange(); toast('ลบประกาศแล้ว'); });
  $('#resetCustomBtn').addEventListener('click', () => { if (!Object.keys(CUSTOM.prices).length){ toast('ยังไม่มีข้อมูลที่เพิ่มในเครื่องนี้'); return; } if (!confirm('ล้างข้อมูลทั้งหมดที่เพิ่มหรือนำเข้าในเครื่องนี้ และกลับไปใช้ข้อมูลที่เผยแพร่ใช่หรือไม่?')) return; CUSTOM = { items:{}, prices:{} }; LS.del('fmo.custom.v1'); rebuildDB(); afterDataChange(); toast('ล้างข้อมูลในเครื่องนี้แล้ว'); });
  const readFile = (file, cb) => { const r = new FileReader(); r.onload = ev => cb(String(ev.target.result)); r.readAsText(file, 'utf-8'); };
  $('#csvInput').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; readFile(f, t => { let res; try { res = importCSVText(t); } catch(err){ res = { ok:false, msg:'อ่านไฟล์ไม่สำเร็จ: ' + err.message }; } const log = $('#importLog'); log.hidden = false; log.textContent = (res.ok ? '✓ ' : '✕ ') + res.msg; toast(res.ok ? 'นำเข้า CSV สำเร็จ' : 'นำเข้า CSV ไม่สำเร็จ'); e.target.value = ''; }); });
  $('#importInput').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; readFile(f, t => { try { const n = importJSONText(t); toast(`นำเข้าข้อมูลสำเร็จ ${n} ประกาศ`); } catch(err){ toast('ไฟล์ .json ไม่ถูกต้อง'); } e.target.value = ''; }); });

  window.addEventListener('hashchange', () => { updateAdmin(); });
  if (mqDark) (mqDark.addEventListener ? mqDark.addEventListener('change', () => { if (P.theme === 'auto') renderAll(); }) : null);
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { renderOverview(); renderTrends(); }, 250); });
}

/* ---------------- boot ---------------- */
(function boot(){
  const logo = 'data:image/png;base64,' + $('#logo-b64').textContent.trim();
  $('#logoImg').src = logo;
  const ic = document.createElement('link'); ic.rel = 'icon'; ic.href = logo; document.head.appendChild(ic);
  if (typeof Chart !== 'undefined'){
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily; Chart.defaults.font.size = 12;
  }
  loadPrefs(); loadCustom(); rebuildDB();
  I18N.init(DB.items);
  buildSegs(); buildCatChips(); buildAccordion();
  bindEvents(); bindGlobalSearch(); updateAdmin();
  const latest = DB.dates[DB.dates.length - 1];
  $('#newDate').value = isoOf(new Date(pd(latest).getTime() + 14 * 864e5));
  I18N.onChange(() => { if (typeof Chart !== 'undefined') Chart.defaults.font.family = getComputedStyle(document.body).fontFamily; renderAll(); });
  $$('[data-lang-btn]').forEach(b => b.addEventListener('click', () => I18N.setLang(b.dataset.langBtn)));
  renderAll();
  I18N.translateAll();
  window.__charts = charts; window.__fmo = { DB, get P(){ return P; }, S, setPref, showTab, importCSVText, rebuildDB, get CUSTOM(){ return CUSTOM; } };
})();

})();
