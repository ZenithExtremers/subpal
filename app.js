'use strict';
/* SubPal — サブスク管理PWA */
const VERSION = '1.7.0';
const KEY = 'subpal.v1';
const DATA_CACHE = 'subpal-data';

/* ---------- マスコット「パル」 ---------- */
function palSVG(mood = 'happy', cls = 'pal-svg') {
  const eyes = mood === 'happy'
    ? '<path d="M42 51q5-6 10 0M68 51q5-6 10 0" stroke="#24324A" stroke-width="3.2" fill="none" stroke-linecap="round"/>'
    : '<circle cx="47" cy="50" r="5.5" fill="#24324A"/><circle cx="73" cy="50" r="5.5" fill="#24324A"/><circle cx="49" cy="48" r="2" fill="#fff"/><circle cx="75" cy="48" r="2" fill="#fff"/>';
  const extra = mood === 'alert'
    ? '<path d="M96 26q5 8 0 12q-5-4 0-12z" fill="#7FD3F7"/>' : '';
  return `<svg class="${cls}${mood === 'alert' ? ' alert' : ''}" viewBox="0 0 120 120" aria-hidden="true">
  <ellipse cx="45" cy="110" rx="12" ry="5.5" fill="#F79A3E"/><ellipse cx="75" cy="110" rx="12" ry="5.5" fill="#F79A3E"/>
  <ellipse cx="20" cy="74" rx="9" ry="20" fill="#24324A" transform="rotate(20 20 74)"/>
  <ellipse cx="60" cy="64" rx="40" ry="45" fill="#24324A"/>
  <path d="M60 18q4-8 10-6q-6 2-6 8z" fill="#24324A"/>
  <ellipse cx="60" cy="78" rx="28" ry="29" fill="#FFF8EE"/>
  <circle cx="47" cy="50" r="15" fill="#FFF8EE"/><circle cx="73" cy="50" r="15" fill="#FFF8EE"/>
  ${eyes}
  <ellipse cx="38" cy="62" rx="5.5" ry="3.2" fill="#FF8FA3" opacity=".65"/><ellipse cx="82" cy="62" rx="5.5" ry="3.2" fill="#FF8FA3" opacity=".65"/>
  <path d="M53 59q7-4 14 0q-7 8-14 0z" fill="#F79A3E"/>
  <ellipse cx="98" cy="76" rx="9" ry="18" fill="#24324A" transform="rotate(-30 98 76)"/>
  <circle cx="98" cy="88" r="14" fill="#FFC23D" stroke="#E9A400" stroke-width="3"/>
  <text x="98" y="94" text-anchor="middle" font-size="16" font-weight="900" fill="#B37A00" font-family="sans-serif">¥</text>
  ${extra}
</svg>`;
}

/* ---------- 定数 ---------- */
const CATEGORIES = [
  ['video', '動画', '#E5534B'], ['music', '音楽', '#2BA36B'], ['game', 'ゲーム', '#7C5CFA'],
  ['work', '仕事・学習', '#3B82F6'], ['cloud', 'クラウド・AI', '#0EA5B7'], ['shop', 'ショッピング', '#F4A23B'],
  ['read', '読書・ニュース', '#B7791F'], ['life', '生活', '#EC4899'], ['other', 'その他', '#8592A6'],
];
const CAT = Object.fromEntries(CATEGORIES.map(([k, n, c]) => [k, { name: n, color: c }]));
const COLORS = ['#E50914', '#1DB954', '#FF9900', '#FF0033', '#113CCF', '#7C5CFA', '#0EA5B7', '#F4A23B', '#EC4899', '#24324A', '#2A9D8F', '#8592A6'];
const PRESETS = [
  ['Netflix', 'video', '#E50914', 'https://www.netflix.com/cancelplan'],
  ['Amazonプライム', 'shop', '#FF9900', 'https://www.amazon.co.jp/gp/primecentral'],
  ['YouTube Premium', 'video', '#FF0033', 'https://www.youtube.com/paid_memberships'],
  ['Spotify', 'music', '#1DB954', 'https://www.spotify.com/account/'],
  ['Apple Music', 'music', '#FA2D48', 'https://apps.apple.com/account/subscriptions'],
  ['Disney+', 'video', '#113CCF', 'https://www.disneyplus.com/account'],
  ['U-NEXT', 'video', '#1A1A1A', 'https://video.unext.jp/'],
  ['Hulu', 'video', '#1CE783', 'https://www.hulu.jp/account'],
  ['DAZN', 'video', '#2B2B2B', 'https://www.dazn.com/ja-JP/myaccount'],
  ['ABEMAプレミアム', 'video', '#3C3C3C', 'https://abema.tv/account'],
  ['dアニメストア', 'video', '#E6007E', 'https://animestore.docomo.ne.jp/'],
  ['Amazon Music Unlimited', 'music', '#25D1DA', 'https://www.amazon.co.jp/music/settings'],
  ['LINE MUSIC', 'music', '#06C755', 'https://music.line.me/'],
  ['Kindle Unlimited', 'read', '#232F3E', 'https://www.amazon.co.jp/kindle-dbs/ku/ku-central'],
  ['iCloud+', 'cloud', '#3693F3', 'https://apps.apple.com/account/subscriptions'],
  ['Google One', 'cloud', '#4285F4', 'https://play.google.com/store/account/subscriptions'],
  ['ChatGPT Plus', 'cloud', '#10A37F', 'https://chatgpt.com/'],
  ['Claude Pro', 'cloud', '#D97757', 'https://claude.ai/settings/billing'],
  ['Microsoft 365', 'work', '#D83B01', 'https://account.microsoft.com/services'],
  ['Adobe CC', 'work', '#FA0F00', 'https://account.adobe.com/plans'],
  ['Notion', 'work', '#2F2F2F', 'https://www.notion.so/'],
  ['Dropbox', 'cloud', '#0061FE', 'https://www.dropbox.com/account/plan'],
  ['Duolingo', 'work', '#58CC02', 'https://www.duolingo.com/settings/subscription'],
  ['Nintendo Switch Online', 'game', '#E60012', 'https://accounts.nintendo.com/'],
  ['PlayStation Plus', 'game', '#0070D1', 'https://www.playstation.com/ja-jp/ps-plus/'],
  ['Xbox Game Pass', 'game', '#107C10', 'https://account.microsoft.com/services'],
  ['Google Play（その他）', 'other', '#34A853', 'https://play.google.com/store/account/subscriptions'],
].map(([name, cat, color, url]) => ({ name, cat, color, url }));
const CYCLE_LABEL = { month: '月', year: '年', week: '週' };

/* ---------- ユーティリティ ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const yen = n => (n < 0 ? '-' : '') + '¥' + Math.abs(Math.round(n)).toLocaleString('ja-JP');
const pad = n => String(n).padStart(2, '0');
const toStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const daysUntil = s => Math.round((parse(s) - today()) / 86400000);
const md = s => { const d = parse(s); return `${d.getMonth() + 1}/${d.getDate()}`; };
const wd = s => '日月火水木金土'[parse(s).getDay()];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const initial = name => (name.trim()[0] || '?').toUpperCase();
const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };

function addCycle(dateStr, sub, times = 1) {
  const d = parse(dateStr);
  const n = (sub.interval || 1) * times;
  if (sub.cycle === 'week') { d.setDate(d.getDate() + 7 * n); return toStr(d); }
  const months = (sub.cycle === 'year' ? 12 : 1) * n;
  const anchor = sub.anchorDay || d.getDate();
  const y = d.getFullYear(), m = d.getMonth() + months;
  const last = new Date(y, m + 1, 0).getDate();
  return toStr(new Date(y, m, Math.min(anchor, last)));
}
function monthly(sub) {
  const p = Number(sub.price) || 0, i = sub.interval || 1;
  if (sub.cycle === 'year') return p / (12 * i);
  if (sub.cycle === 'week') return p * 52 / 12 / i;
  return p / i;
}
function cycleText(sub) {
  const i = sub.interval || 1;
  const u = CYCLE_LABEL[sub.cycle];
  return i === 1 ? `毎${u}` : `${i}${sub.cycle === 'month' ? 'か月' : u}ごと`;
}
function dayChip(n, trial) {
  if (n === 0) return `<span class="chip today">${trial ? '今日で無料終了' : '今日'}</span>`;
  if (n === 1) return `<span class="chip ${trial ? 'trial' : 'soon'}">${trial ? '無料期間 明日まで' : '明日'}</span>`;
  const cls = trial ? 'trial' : (n <= 7 ? 'soon' : '');
  return `<span class="chip ${cls}">${trial ? `無料期間 あと${n}日` : `あと${n}日`}</span>`;
}

/* ---------- 状態と保存 ---------- */
let state = load();
function load() {
  const base = { subs: [], settings: { theme: 'system', notify: false, defaultNotify: 3 }, notified: {}, pay: { payments: [], budget: 0 } };
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Array.isArray(d.subs)) return { ...base, ...d, settings: { ...base.settings, ...d.settings }, pay: { ...base.pay, ...d.pay, payments: d.pay?.payments || [] } };
  } catch {}
  return base;
}
function save() {
  try { const rp = monthReport(); state.report = rp && state.settings.report !== false ? { key: rp.key, title: rp.title, body: rp.body } : null; } catch {}
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  mirror();
}
async function mirror() { // Service Worker（バックグラウンド通知）用の写し
  try {
    if (!('caches' in window)) return;
    const c = await caches.open(DATA_CACHE);
    await c.put('/__subpal_data.json', new Response(JSON.stringify(state), { headers: { 'content-type': 'application/json' } }));
  } catch {}
}
async function mergeNotifiedFromSW() {
  try {
    const c = await caches.open(DATA_CACHE);
    const r = await c.match('/__subpal_data.json');
    if (!r) return;
    const d = await r.json();
    Object.assign(state.notified, d.notified || {});
  } catch {}
}
function rollForward() {
  const t = today();
  let changed = false;
  for (const s of state.subs) {
    if (s.status !== 'active' || !s.nextDate) continue;
    let guard = 0;
    while (parse(s.nextDate) < t && guard++ < 2000) { s.nextDate = addCycle(s.nextDate, s); changed = true; }
  }
  if (changed) save();
}

/* ---------- テーマ ---------- */
function applyTheme() {
  const t = state.settings.theme;
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

/* ---------- 集計 ---------- */
const active = () => state.subs.filter(s => s.status === 'active');
const totalMonthly = () => active().reduce((a, s) => a + monthly(s), 0);
function events(rangeDays = 31) {
  const ev = [];
  for (const s of active()) {
    if (s.nextDate && s.nextDate !== s.trialEnd) { const n = daysUntil(s.nextDate); if (n >= 0 && n <= rangeDays) ev.push({ s, type: 'bill', date: s.nextDate, n }); }
    if (s.trialEnd) { const n = daysUntil(s.trialEnd); if (n >= 0 && n <= rangeDays) ev.push({ s, type: 'trial', date: s.trialEnd, n }); }
  }
  return ev.sort((a, b) => a.n - b.n || (a.type === 'trial' ? -1 : 1));
}
function forecast12() {
  const t = today();
  const start = new Date(t.getFullYear(), t.getMonth(), 1);
  const buckets = [];
  for (let i = 0; i < 12; i++) { const d = new Date(start.getFullYear(), start.getMonth() + i, 1); buckets.push({ y: d.getFullYear(), m: d.getMonth(), sum: 0 }); }
  const end = new Date(start.getFullYear(), start.getMonth() + 12, 1);
  for (const s of active()) {
    if (!s.nextDate) continue;
    let d = s.nextDate, guard = 0;
    while (parse(d) < end && guard++ < 600) {
      const pd = parse(d);
      const b = buckets.find(b => b.y === pd.getFullYear() && b.m === pd.getMonth());
      if (b) b.sum += Number(s.price) || 0;
      d = addCycle(d, s);
    }
  }
  return buckets;
}

/* ---------- 描画：ホーム ---------- */
function palMessage() {
  if (!state.subs.length) return ['happy', 'はじめまして！ぼくはパル。<br>使っているサブスクを登録すると、支払い日や無料期間の終わりをお知らせするよ。'];
  const ev = events(31);
  const trial = ev.find(e => e.type === 'trial' && e.n <= Math.max(3, e.s.notifyDays ?? 3));
  if (trial) return ['alert', trial.n === 0
    ? `<b>${esc(trial.s.name)}</b>の無料期間、今日で終わるよ！続けないなら今のうちに解約しよう。`
    : `<b>${esc(trial.s.name)}</b>の無料期間、あと${trial.n}日で終わるよ。続ける？`];
  const todayBill = ev.filter(e => e.type === 'bill' && e.n === 0);
  if (todayBill.length) return ['alert', `今日は<b>${todayBill.map(e => esc(e.s.name)).join('・')}</b>の支払い日だよ。`];
  const soon = ev.find(e => e.type === 'bill' && e.n <= 3);
  if (soon) return ['alert', `あと${soon.n}日で<b>${esc(soon.s.name)}</b>の支払い（${yen(soon.s.price)}）だよ。`];
  const next = ev.find(e => e.type === 'bill');
  if (next) return ['happy', `しばらく大きな予定はないよ。次は<b>${esc(next.s.name)}</b>（${md(next.date)}）だよ。`];
  if (!active().length) return ['happy', '利用中のサブスクはゼロ。すっきり！'];
  return ['happy', '今月の支払いはもう落ち着いたよ。のんびりいこう。'];
}
function itemHTML(s, opt = {}) {
  const n = opt.date ? daysUntil(opt.date) : (s.nextDate ? daysUntil(s.nextDate) : null);
  let chip = '';
  if (s.status === 'paused') chip = '<span class="chip paused">停止中</span>';
  else if (s.status === 'cancelled') chip = '<span class="chip paused">解約済み</span>';
  else if (opt.type) chip = dayChip(n, opt.type === 'trial');
  else if (s.trialEnd && daysUntil(s.trialEnd) >= 0) chip = dayChip(daysUntil(s.trialEnd), true);
  else if (n !== null) chip = dayChip(n, false);
  const date = opt.date || s.nextDate;
  const desc = s.status === 'active' && date
    ? `${md(date)}（${wd(date)}）${opt.type === 'trial' ? '無料期間終了' : '支払い'}・${cycleText(s)}`
    : `${cycleText(s)}・${CAT[s.cat]?.name || 'その他'}`;
  const bell = s.status === 'active' && s.notifyDays < 0 ? '・🔕' : '';
  return `<button class="item ${s.status !== 'active' ? 'dim' : ''}" data-edit="${s.id}">
    <div class="badge" style="background:${esc(s.color)}">${esc(initial(s.name))}</div>
    <div class="meta"><div class="name">${esc(s.name)}</div><div class="desc">${desc}${bell}</div></div>
    <div class="right"><div class="price">${yen(s.price)}</div>${chip}</div></button>`;
}
function renderHome() {
  const [mood, msg] = palMessage();
  const m = totalMonthly();
  const ev = events(31);
  let html = `<div class="pal">${palSVG(mood)}<div class="bubble">${msg}</div></div>`;
  if (!state.subs.length) {
    html += `<div class="card"><div class="empty">まずは1つ登録してみよう。<br>人気サービスはタップだけで追加できるよ。<button class="btn primary" data-act="add">＋ サブスクを追加</button></div></div>`;
    if (state.pay.payments.length) html += reportCard() + monthSummaryCard();
  } else {
    html += `<div class="card hero"><div class="label">毎月の支払い（目安）</div><div class="big">${yen(m)}</div>
      <div class="row"><div>年間<b>${yen(m * 12)}</b></div><div>利用中<b>${active().length}件</b></div><div>今月残り<b>${yen(remainingThisMonth())}</b></div></div></div>`;
    html += reportCard();
    html += monthSummaryCard();
    html += `<div class="section-title">これからの予定（30日）</div>`;
    html += ev.length ? `<div class="card">${ev.map(e => itemHTML(e.s, e)).join('')}</div>`
      : `<div class="card"><div class="empty">30日以内の支払いはないよ。</div></div>`;
  }
  if (deferredInstall) html += installCard();
  $('#view-home').innerHTML = html;
}
function monthSummaryCard() {
  const sub = subsThisMonth(), pp = payThisMonth(), bi = budgetInfo();
  const total = sub + pp;
  const t = today();
  const w = total ? Math.round(sub / total * 100) : 0;
  return `<div class="section-title">${t.getMonth() + 1}月の支出まとめ</div><button class="card summary" data-act="go-pay">
    <div class="sum-total">${yen(total)}</div>
    <div class="meter split"><div style="width:${w}%;background:var(--primary)"></div><div style="width:${100 - w}%;background:#FF0033"></div></div>
    <div class="sum-rows"><div><i style="background:var(--primary)"></i>サブスク（固定費）<b>${yen(sub)}</b></div>
    <div><i style="background:#FF0033"></i>PayPay（使った分）<b>${yen(pp)}</b></div>
    ${bi ? `<div class="sub-note">PayPay予算 ${yen(bi.b)}・${bi.left >= 0 ? `あと${yen(bi.left)}` : `${yen(-bi.left)}オーバー`}</div>` : ''}</div></button>`;
}
function remainingThisMonth() { return forecast12()[0].sum; }
function installCard() {
  return `<div class="card install">${palSVG('happy', 'pal-svg')}<p>ホーム画面に追加すると、アプリのようにすぐ開けて通知も届きやすくなるよ。</p><button class="btn primary" data-act="install">追加</button></div>`;
}

/* ---------- 描画：一覧 ---------- */
let listFilter = 'active', listSort = 'date';
function renderList() {
  const counts = { active: 0, paused: 0, cancelled: 0 };
  state.subs.forEach(s => counts[s.status]++);
  let subs = state.subs.filter(s => s.status === listFilter);
  const sorters = {
    date: (a, b) => (a.nextDate || '9999').localeCompare(b.nextDate || '9999'),
    price: (a, b) => monthly(b) - monthly(a),
    name: (a, b) => a.name.localeCompare(b.name, 'ja'),
  };
  subs.sort(sorters[listSort]);
  const seg = [['active', '利用中'], ['paused', '停止中'], ['cancelled', '解約済み']]
    .map(([k, n]) => `<button class="${listFilter === k ? 'on' : ''}" data-filter="${k}">${n} ${counts[k]}</button>`).join('');
  let html = `<div class="toolbar"><div class="seg">${seg}</div></div>
    <div class="toolbar"><select class="select" id="sort"><option value="date">次の支払日順</option><option value="price">金額が高い順</option><option value="name">名前順</option></select></div>`;
  html += subs.length ? `<div class="card">${subs.map(s => itemHTML(s)).join('')}</div>`
    : `<div class="card"><div class="empty">${palSVG('happy')}${listFilter === 'active' ? 'まだ登録がないよ。右下の＋から追加しよう。' : 'ここにはまだ何もないよ。'}</div></div>`;
  $('#view-list').innerHTML = html;
  $('#sort').value = listSort;
}

/* ---------- 描画：集計 ---------- */
function donut(parts) {
  const total = parts.reduce((a, p) => a + p.v, 0);
  const r = 52, C = 2 * Math.PI * r;
  let off = 0;
  const segs = parts.map(p => {
    const len = total ? p.v / total * C : 0;
    const seg = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${p.c}" stroke-width="22" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 70 70)"/>`;
    off += len; return seg;
  }).join('');
  return `<svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--surface2)" stroke-width="22"/>${segs}
    <text x="70" y="66" text-anchor="middle" font-size="11" fill="var(--sub)" font-weight="700">月あたり</text>
    <text x="70" y="84" text-anchor="middle" font-size="16" fill="var(--text)" font-weight="800">${yen(total)}</text></svg>`;
}
function renderStats() {
  const m = totalMonthly();
  const saved = state.subs.filter(s => s.status === 'cancelled').reduce((a, s) => a + monthly(s), 0);
  let html = `<div class="kpis">
    <div class="kpi"><div class="k">月あたり</div><div class="v">${yen(m)}</div></div>
    <div class="kpi"><div class="k">年間</div><div class="v">${yen(m * 12)}</div></div>
    <div class="kpi"><div class="k">1日あたり</div><div class="v">${yen(m * 12 / 365)}</div></div>
    <div class="kpi"><div class="k">解約で節約（年）</div><div class="v good">${yen(saved * 12)}</div></div></div>`;
  if (!active().length) {
    html += `<div class="card"><div class="empty">${palSVG('happy')}利用中のサブスクを登録すると、ここに内訳が出るよ。</div></div>`;
    $('#view-stats').innerHTML = html; return;
  }
  const byCat = {};
  active().forEach(s => { byCat[s.cat] = (byCat[s.cat] || 0) + monthly(s); });
  const parts = Object.entries(byCat).map(([k, v]) => ({ k, v, c: CAT[k]?.color || '#8592A6', n: CAT[k]?.name || 'その他' })).sort((a, b) => b.v - a.v);
  html += `<div class="section-title">カテゴリ別（月あたり）</div><div class="card donut-wrap">${donut(parts)}
    <div class="legend">${parts.map(p => `<div><i style="background:${p.c}"></i><span>${p.n}</span><b>${yen(p.v)}</b></div>`).join('')}</div></div>`;
  const fc = forecast12();
  const max = Math.max(...fc.map(b => b.sum), 1);
  html += `<div class="section-title">これから12か月の支払い予定 <span style="font-size:13px">合計 ${yen(fc.reduce((a, b) => a + b.sum, 0))}</span></div>
    <div class="card"><div class="bars">${fc.map((b, i) => `<div class="b ${i === 0 ? 'cur' : ''}" title="${b.m + 1}月 ${yen(b.sum)}">
      <div class="m" style="font-weight:700;color:var(--text)">${b.sum ? yenShort(b.sum) : ''}</div>
      <div class="bar" style="height:${b.sum / max * 100}%"></div><div class="m">${b.m + 1}月</div></div>`).join('')}</div></div>`;
  const top = [...active()].sort((a, b) => monthly(b) - monthly(a)).slice(0, 5);
  html += `<div class="section-title">月あたりが高い順</div><div class="card">${top.map(s => `<button class="item" data-edit="${s.id}">
    <div class="badge" style="background:${esc(s.color)}">${esc(initial(s.name))}</div>
    <div class="meta"><div class="name">${esc(s.name)}</div><div class="desc">${cycleText(s)} ${yen(s.price)}</div></div>
    <div class="right"><div class="price">${yen(monthly(s))}</div><span class="chip">${Math.round(monthly(s) / m * 100)}%</span></div></button>`).join('')}</div>`;
  $('#view-stats').innerHTML = html;
}

/* ---------- 描画：設定 ---------- */
function renderSettings() {
  const st = state.settings;
  const perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const notifyOn = st.notify && perm === 'granted';
  const theme = [['system', '自動'], ['light', 'ライト'], ['dark', 'ダーク']]
    .map(([k, n]) => `<button class="${st.theme === k ? 'on' : ''}" data-theme-set="${k}">${n}</button>`).join('');
  $('#view-settings').innerHTML = `
    <div class="section-title">通知</div>
    <div class="card">
      <button class="set-row" data-act="toggle-notify"><div>支払い・無料期間のお知らせ<small>${perm === 'unsupported' ? 'このブラウザは通知に対応していません' : perm === 'denied' ? 'ブラウザの設定で通知がブロックされています' : 'アプリを開いたときや、バックグラウンドで知らせます'}</small></div><div class="switch ${notifyOn ? 'on' : ''}"></div></button>
      <div class="set-row"><div>新規登録時の通知タイミング</div>
        <select class="select" id="default-notify">${notifyOptions(st.defaultNotify)}</select></div>
      <button class="set-row" data-act="toggle-report"><div>月初の先月レポート<small>毎月1日以降に、先月の支出を通知でお知らせ</small></div><div class="switch ${st.report !== false ? 'on' : ''}"></div></button>
      <button class="set-row" data-act="ics"><div>カレンダーに書き出す（.ics）<small>Googleカレンダー等に取り込むと、確実にリマインドが届きます</small></div><span>›</span></button>
    </div>
    <div class="section-title">表示</div>
    <div class="card"><div class="seg">${theme}</div></div>
    <div class="section-title">データ</div>
    <div class="card">
      <button class="set-row" data-act="export"><div>バックアップを保存<small>JSONファイルとして書き出します</small></div><span>›</span></button>
      <button class="set-row" data-act="import"><div>バックアップから復元<small>今のデータは置き換わります</small></div><span>›</span></button>
      <button class="set-row danger" data-act="reset" id="reset-btn"><div>すべてのデータを削除</div><span>›</span></button>
    </div>
    ${deferredInstall ? installCard() : ''}
    <div class="about">${palSVG('happy', 'pal-svg')}<br>SubPal v${VERSION}<br>データはこの端末の中だけに保存されます</div>`;
}

/* ---------- PayPay使用量（支払い通知から取り込んだ金額と手入力だけを扱う） ---------- */
const ym = s => s.slice(0, 7);
const ymLabel = k => `${Number(k.slice(5))}月`;
const yenShort = v => v >= 10000 ? `${(Math.round(v / 1000) / 10).toString()}万円` : `${Math.round(v).toLocaleString('ja-JP')}円`;
function payMonthly() {
  const m = {};
  for (const p of state.pay.payments) m[ym(p.date)] = (m[ym(p.date)] || 0) + p.amount;
  return m;
}
function monthKeyOffset(off) { const t = today(); return ym(toStr(new Date(t.getFullYear(), t.getMonth() + off, 1))); }
/* 今月のサブスク請求額（すでに払った分も含む） */
function subsThisMonth() { return subsInMonth(0); }
function subsInMonth(off) {
  const t = today(), start = new Date(t.getFullYear(), t.getMonth() + off, 1), end = new Date(t.getFullYear(), t.getMonth() + off + 1, 1);
  let sum = 0;
  for (const s of active()) {
    if (!s.nextDate) continue;
    let k = 0;
    while (k < 400 && parse(addCycle(s.nextDate, s, -(k + 1))) >= start) k++;
    let d = addCycle(s.nextDate, s, -k), g = 0;
    while (parse(d) < end && g++ < 400) { if (parse(d) >= start) sum += Number(s.price) || 0; d = addCycle(d, s); }
  }
  return sum;
}
/* 先月レポート */
function monthReport() {
  const p1 = monthKeyOffset(-1), p2 = monthKeyOffset(-2), map = payMonthly();
  const sub1 = subsInMonth(-1), sub2 = subsInMonth(-2), pay1 = map[p1] || 0, pay2 = map[p2] || 0;
  const tot1 = sub1 + pay1, tot2 = sub2 + pay2;
  if (!tot1) return null;
  const diff = tot1 - tot2, hasPrev = tot2 > 0;
  const cmp = hasPrev ? (diff > 0 ? `${ymLabel(p2)}より${yen(diff)}多い` : diff < 0 ? `${ymLabel(p2)}より${yen(-diff)}少ない` : `${ymLabel(p2)}と同じ`) : '';
  const b = Number(state.pay.budget) || 0;
  return { key: p1, label: ymLabel(p1), sub1, pay1, tot1, diff, hasPrev, cmp, budgetOk: b ? pay1 <= b : null, budget: b,
    title: `${ymLabel(p1)}のふりかえり：合計${yen(tot1)}`, body: `サブスク${yen(sub1)}＋PayPay${yen(pay1)}${cmp ? `。${cmp}` : ''}` };
}
function reportCard() {
  const r = monthReport();
  if (!r || today().getDate() > 7) return '';
  return `<div class="section-title">${r.label}のふりかえり</div><div class="card report">
    <div class="sum-total">${yen(r.tot1)}</div>
    ${r.hasPrev ? `<div class="chip ${r.diff > 0 ? 'soon' : ''}" style="margin:2px 0 10px">${r.cmp}</div>` : ''}
    <div class="sum-rows"><div><i style="background:var(--primary)"></i>サブスク<b>${yen(r.sub1)}</b></div><div><i style="background:#FF0033"></i>PayPay<b>${yen(r.pay1)}</b></div>
    ${r.budget ? `<div class="sub-note">PayPay予算 ${yen(r.budget)} → ${r.budgetOk ? '予算内でした' : `${yen(r.pay1 - r.budget)}オーバーでした`}</div>` : ''}</div></div>`;
}
function payThisMonth() { return payMonthly()[monthKeyOffset(0)] || 0; }
function budgetInfo() {
  const b = Number(state.pay.budget) || 0;
  if (!b) return null;
  const used = payThisMonth(), t = today();
  const daysLeft = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate() - t.getDate() + 1;
  const left = b - used;
  return { b, used, left, daysLeft, perDay: left > 0 ? left / daysLeft : 0, rate: used / b };
}
function budgetCard() {
  const bi = budgetInfo();
  if (!bi) return `<button class="card budget-card" data-act="pay-budget"><div class="budget-head"><b>今月の予算</b><span class="chip">未設定</span></div><div class="hint" style="margin:6px 0 0">予算を決めると「あと何円使えるか」がわかるよ。タップして設定。</div></button>`;
  const pct = Math.min(100, Math.round(bi.rate * 100));
  const cls = bi.rate >= 1 ? 'over' : bi.rate >= 0.8 ? 'warn' : '';
  return `<button class="card budget-card" data-act="pay-budget"><div class="budget-head"><b>今月の予算 ${yen(bi.b)}</b><span class="chip ${bi.rate >= 1 ? 'today' : bi.rate >= 0.8 ? 'soon' : ''}">${pct}%</span></div>
    <div class="meter"><div class="meter-fill ${cls}" style="width:${pct}%"></div></div>
    <div class="budget-row">${bi.left >= 0 ? `<span>あと <b>${yen(bi.left)}</b></span><span>1日あたり <b>${yen(bi.perDay)}</b>（残り${bi.daysLeft}日）</span>` : `<span class="over-text">予算を <b>${yen(-bi.left)}</b> オーバー</span>`}</div></button>`;
}
let calMonth = null;
function payCalendar() {
  if (!calMonth) calMonth = monthKeyOffset(0);
  const [y, m] = calMonth.split('-').map(Number);
  const first = new Date(y, m - 1, 1), days = new Date(y, m, 0).getDate();
  const byDay = {};
  for (const p of state.pay.payments) if (ym(p.date) === calMonth) byDay[p.date] = (byDay[p.date] || 0) + p.amount;
  const vals = Object.values(byDay), max = Math.max(...vals, 1), total = vals.reduce((a, v) => a + v, 0);
  const tStr = toStr(today());
  let cells = '日月火水木金土'.split('').map((d, i) => `<div class="cal-h ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${d}</div>`).join('');
  for (let i = 0; i < first.getDay(); i++) cells += '<div></div>';
  for (let d = 1; d <= days; d++) {
    const key = `${y}-${pad(m)}-${pad(d)}`, v = byDay[key] || 0;
    const a = v ? 0.18 + 0.7 * (v / max) : 0;
    cells += `<button class="cal-d ${key === tStr ? 'today' : ''}" ${v ? `data-day="${key}"` : ''} style="${v ? `background:color-mix(in srgb, var(--primary) ${Math.round(a * 100)}%, transparent)` : ''}">
      <span>${d}</span>${v ? `<small>${yenShort(v)}</small>` : ''}</button>`;
  }
  return `<div class="section-title">使った日カレンダー</div><div class="card">
    <div class="cal-nav"><button data-cal="-1" aria-label="前の月">‹</button><b>${y}年${m}月</b><span class="cal-total">${yen(total)}</span><button data-cal="1" aria-label="次の月">›</button></div>
    <div class="cal">${cells}</div>
    ${vals.length ? '' : '<p class="hint" style="margin:10px 2px 0">通知から取り込んだ支払いと、手で入れた「使った額」が日ごとに表示されます。</p>'}</div>`;
}
function renderPay() {
  const pays = state.pay.payments;
  const map = payMonthly();
  const cur = monthKeyOffset(0), prev = monthKeyOffset(-1);
  const months = Array.from({ length: 6 }, (_, i) => monthKeyOffset(i - 5));
  const withData = Object.keys(map).filter(k => k < cur);
  const avg = withData.length ? withData.slice(-6).reduce((a, k) => a + map[k], 0) / Math.min(6, withData.length) : null;
  let mood = 'happy', msg;
  if (!pays.length) msg = 'PayPayの支払い通知から、使った金額を自動で集計するよ。<br>手で入れることもできるよ。';
  else if (map[prev] !== undefined) {
    const v = map[prev];
    msg = `先月は<b>${yen(v)}</b>使ったよ。` + (avg && withData.length > 1 ? (v > avg * 1.2 ? 'いつもより多めだね。' : v < avg * 0.8 ? 'いつもより節約できたね！' : '') : '');
    if (avg && withData.length > 1 && v > avg * 1.2) mood = 'alert';
  } else msg = `今月はここまで<b>${yen(map[cur] || 0)}</b>使ったよ。`;
  const bi = budgetInfo();
  if (bi && bi.rate >= 1) { mood = 'alert'; msg = `今月のPayPay、予算を<b>${yen(-bi.left)}</b>オーバーしてるよ。ちょっと控えめにしよう。`; }
  else if (bi && bi.rate >= 0.8) { mood = 'alert'; msg = `予算の${Math.round(bi.rate * 100)}%まで使ったよ。あと<b>${yen(bi.left)}</b>、1日<b>${yen(bi.perDay)}</b>くらいでいこう。`; }
  let html = `<div class="pal">${palSVG(mood)}<div class="bubble">${msg}</div></div>
    <div class="card hero"><div class="label">今月のPayPay使用額</div><div class="big">${yen(map[cur] || 0)}</div>
    <div class="row"><div>先月<b>${map[prev] !== undefined ? yen(map[prev]) : '—'}</b></div><div>月平均<b>${avg !== null ? yen(avg) : '—'}</b></div><div>今月の件数<b>${pays.filter(p => ym(p.date) === cur).length}件</b></div></div></div>
    <button class="btn primary" data-act="pay-spend" style="margin:0">＋ 使った額を入力</button>
    ${budgetCard()}`;
  if (Object.keys(map).length) {
    const max = Math.max(...months.map(k => map[k] || 0), 1);
    html += `<div class="section-title">月ごとの使用額</div><div class="card"><div class="bars">${months.map(k => `<div class="b ${k === cur ? 'cur' : ''}">
      <div class="m" style="font-weight:700;color:var(--text)">${map[k] ? yenShort(map[k]) : ''}</div>
      <div class="bar" style="height:${Math.max(0, map[k] || 0) / max * 100}%"></div><div class="m">${ymLabel(k)}</div></div>`).join('')}</div></div>`;
  }
  html += payCalendar();
  const sorted = [...pays].sort((a, b) => b.date.localeCompare(a.date) || b.t - a.t).slice(0, 60);
  html += `<div class="section-title">記録</div>`;
  html += sorted.length ? `<div class="card">${sorted.map(r => `<button class="item" data-payment="${r.id}"><div class="badge" style="background:#24324A">支</div>
      <div class="meta"><div class="name">${md(r.date)}（${wd(r.date)}）</div><div class="desc">${r.src === 'manual' ? '手入力' : '通知から自動'}</div></div>
      <div class="right"><div class="price">${yen(r.amount)}</div></div></button>`).join('')}</div>`
    : `<div class="card"><div class="empty">まだ記録がないよ。PayPayで払うと自動で入るよ。</div></div>`;
  html += `<p class="hint" style="text-align:center">PayPayにはつながず、通知から金額だけを取り込みます。記録はこの端末の中だけに保存されます。</p>`;
  $('#view-pay').innerHTML = html;
}
let payDraft = null;
function openPayForm(rec) {
  payDraft = rec ? { ...rec } : { id: uid(), amount: '', date: toStr(today()), t: Date.now() };
  const isNew = !rec;
  openSheet(`<h2>${isNew ? '使った額を記録' : '記録を編集'}</h2>
    <div class="field"><label>金額</label><div class="price-input"><span>¥</span><input id="p-amount" type="number" inputmode="numeric" min="0" step="1" value="${esc(payDraft.amount)}" placeholder="0"></div></div>
    <div class="field"><label>日付</label><input id="p-date" type="date" value="${esc(payDraft.date)}"></div>
    <button class="btn primary" data-act="pay-save">${isNew ? '記録する' : '保存する'}</button>
    ${isNew ? '' : '<button class="btn danger" data-act="pay-delete">削除</button>'}
    <button class="btn ghost" data-act="close">キャンセル</button>`);
  if (isNew) setTimeout(() => $('#p-amount')?.focus(), 350);
}
function savePay() {
  const amt = Number($('#p-amount').value);
  if ($('#p-amount').value === '' || isNaN(amt) || amt <= 0) return toast('金額を入れてね');
  const old = state.pay.payments.find(p => p.id === payDraft.id);
  state.pay.payments = state.pay.payments.filter(p => p.id !== payDraft.id);
  state.pay.payments.push({ id: payDraft.id, key: old?.key || 'manual-' + payDraft.id, date: $('#p-date').value || toStr(today()), amount: Math.round(amt), t: payDraft.t || Date.now(), src: old ? old.src : 'manual' });
  save(); vibrate(15); closeSheet(); render();
  toast(old ? '保存したよ' : `${yen(amt)}の支払いを記録したよ`);
}

/* MacroDroid から送られた支払い額の取り込み（?pp=YYYYMMDDhhmmss-金額,...） */
function importPayments(str) {
  const seen = new Set(state.pay.payments.map(p => p.key));
  let n = 0, sum = 0;
  const parseStamp = st => {
    let m;
    if ((m = st.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/))) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    if (/^\d{12,13}$/.test(st)) return toStr(new Date(Number(st)));
    if (/^\d{9,10}$/.test(st)) return toStr(new Date(Number(st) * 1000));
    const d = new Date(st.replace(/\//g, '-').replace(' ', 'T'));
    if (!isNaN(d)) return toStr(d);
    const d2 = new Date(st);
    return isNaN(d2) ? toStr(today()) : toStr(d2);
  };
  for (const raw of (str.includes(';') ? str.split(';') : str.split(/[,\s]+/))) {
    const tok = raw.trim();
    if (!tok) continue;
    let m, date, amount;
    if ((m = tok.match(/^(.*)_([\d,]+)$/))) { date = parseStamp(m[1].trim()); amount = Number(m[2].replace(/,/g, '')); }
    else if ((m = tok.match(/^(\d{4})(\d{2})(\d{2})(\d{0,6})-(\d+)$/))) { date = `${m[1]}-${m[2]}-${m[3]}`; amount = Number(m[5]); }
    else if ((m = tok.match(/^([\d,]+)$/))) { date = toStr(today()); amount = Number(m[1].replace(/,/g, '')); }
    else continue;
    if (!amount || amount > 1000000 || seen.has(tok)) continue;
    seen.add(tok);
    state.pay.payments.push({ id: uid(), key: tok, date, amount, t: Date.now() + n });
    n++; sum += amount;
  }
  save();
  go('pay');
  toast(n ? `PayPayの支払い${n}件（${yen(sum)}）を取り込んだよ` : '新しい支払いはなかったよ');
}

/* ---------- 描画まとめ ---------- */
let currentView = 'home';
function render() {
  rollForward();
  ({ home: renderHome, list: renderList, pay: renderPay, stats: renderStats, settings: renderSettings })[currentView]();
}
function go(view) {
  currentView = view;
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === view));
  $('#title').textContent = { home: 'SubPal', list: 'サブスク一覧', pay: 'PayPay使用量', stats: '集計', settings: '設定' }[view];
  $('#fab').classList.toggle('hide', view === 'settings' || view === 'pay');
  window.scrollTo({ top: 0 });
  render();
}

/* ---------- シート（追加・編集） ---------- */
function openSheet(html) {
  $('#sheet-body').innerHTML = html;
  $('#sheet').scrollTop = 0;
  const already = $('#sheet').classList.contains('show');
  $('#backdrop').classList.add('show'); $('#sheet').classList.add('show');
  if (!already) history.pushState({ sheet: true }, '');
}
function closeSheet(fromPop) {
  if (!$('#sheet').classList.contains('show')) return;
  $('#backdrop').classList.remove('show'); $('#sheet').classList.remove('show');
  if (!fromPop && history.state?.sheet) history.back();
}
window.addEventListener('popstate', () => closeSheet(true));

function openPicker() {
  openSheet(`<h2>サブスクを追加</h2>
    <input class="search" id="preset-q" placeholder="サービス名で検索" autocomplete="off">
    <div class="preset-grid" id="preset-grid">${presetGrid('')}</div>
    <button class="custom-btn" data-act="custom">＋ 一覧にないサービスを自分で入力</button>
    <button class="btn ghost" data-act="close">閉じる</button>`);
}
function presetGrid(q) {
  const k = q.trim().toLowerCase();
  const list = PRESETS.filter(p => !k || p.name.toLowerCase().includes(k));
  return list.map(p => `<button class="preset" data-preset="${esc(p.name)}"><div class="badge" style="background:${p.color}">${esc(initial(p.name))}</div>${esc(p.name)}</button>`).join('')
    || `<div class="empty" style="grid-column:1/-1">見つからないよ。下のボタンから自分で入力してね。</div>`;
}

let draft = null;
function openForm(sub) {
  const isNew = !sub;
  draft = sub ? { ...sub } : {
    id: uid(), name: '', price: '', cycle: 'month', interval: 1, nextDate: toStr(today()), cat: 'other',
    color: COLORS[Math.floor(Math.random() * COLORS.length)], trialEnd: '', notifyDays: state.settings.defaultNotify,
    url: '', memo: '', status: 'active', createdAt: Date.now(),
  };
  if (draft._preset) delete draft._preset;
  const st = draft.status;
  openSheet(`<h2>${isNew ? '新しいサブスク' : '編集'}</h2>
    <div class="preview"><div class="badge" id="pv-badge" style="background:${esc(draft.color)}">${esc(initial(draft.name || '?'))}</div>
      <div><div class="name" id="pv-name">${esc(draft.name || 'サービス名')}</div><div class="desc" id="pv-desc"></div></div></div>
    <div class="field"><label>サービス名</label><input id="f-name" value="${esc(draft.name)}" placeholder="例：Netflix" maxlength="40"></div>
    <div class="field"><label>料金（1回の支払い額）</label><div class="price-input"><span>¥</span><input id="f-price" type="number" inputmode="decimal" min="0" step="1" value="${esc(draft.price)}" placeholder="0"></div></div>
    <div class="field"><label>支払いのサイクル</label>
      <div class="grid2"><div class="seg" id="f-cycle">${['month', 'year', 'week'].map(c => `<button type="button" data-cycle="${c}" class="${draft.cycle === c ? 'on' : ''}">${CYCLE_LABEL[c]}</button>`).join('')}</div>
      <select id="f-interval">${intervalOptions(draft.cycle, draft.interval)}</select></div></div>
    <div class="field"><label>次の支払日</label><input id="f-next" type="date" value="${esc(draft.nextDate)}"></div>
    <div class="field"><label>無料期間の終了日（あれば）</label><input id="f-trial" type="date" value="${esc(draft.trialEnd)}"></div>
    <p class="hint">無料トライアル中なら入れておくと、終わる前にパルが知らせます。</p>
    <div class="grid2">
      <div class="field"><label>カテゴリ</label><select id="f-cat">${CATEGORIES.map(([k, n]) => `<option value="${k}" ${draft.cat === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>通知</label><select id="f-notify">${notifyOptions(Number(draft.notifyDays))}</select></div>
    </div>
    <div class="field"><label>色</label><div class="colors" id="f-colors">${COLORS.map(c => `<button type="button" data-color="${c}" class="${draft.color === c ? 'on' : ''}" style="background:${c}" aria-label="色"></button>`).join('')}</div></div>
    <div class="field"><label>解約・管理ページのURL</label><input id="f-url" type="url" inputmode="url" value="${esc(draft.url)}" placeholder="https://"></div>
    <div class="field"><label>メモ</label><textarea id="f-memo" placeholder="プラン名、登録したメールアドレスなど">${esc(draft.memo)}</textarea></div>
    <button class="btn primary" data-act="save">${isNew ? '登録する' : '保存する'}</button>
    ${isNew ? '' : `
      ${draft.url ? `<a class="btn ghost" href="${esc(draft.url)}" target="_blank" rel="noopener">解約・管理ページを開く ↗</a>` : ''}
      ${st === 'active' ? `<button class="btn warn" data-act="status" data-to="paused">一時停止にする</button><button class="btn warn" data-act="status" data-to="cancelled">解約済みにする</button>`
        : `<button class="btn ghost" data-act="status" data-to="active">利用中に戻す</button>`}
      <button class="btn danger" data-act="delete">削除</button>`}
    <button class="btn ghost" data-act="close">キャンセル</button>`);
  updatePreview();
  if (isNew) setTimeout(() => $('#f-name')?.focus(), 350);
}
function notifyOptions(sel) {
  return [-1, 0, 1, 2, 3, 5, 7, 14].map(d => `<option value="${d}" ${sel === d ? 'selected' : ''}>${d < 0 ? '通知しない' : d ? d + '日前' : '当日'}</option>`).join('');
}
function intervalOptions(cycle, sel) {
  return Array.from({ length: 12 }, (_, i) => i + 1)
    .map(i => `<option value="${i}" ${sel === i ? 'selected' : ''}>${cycleText({ cycle, interval: i })}</option>`).join('');
}
function readForm() {
  draft.name = $('#f-name').value.trim();
  draft.price = $('#f-price').value === '' ? '' : Math.max(0, Number($('#f-price').value));
  draft.interval = Number($('#f-interval').value);
  draft.nextDate = $('#f-next').value;
  draft.trialEnd = $('#f-trial').value;
  draft.cat = $('#f-cat').value;
  draft.notifyDays = Number($('#f-notify').value);
  draft.url = $('#f-url').value.trim();
  draft.memo = $('#f-memo').value.trim();
}
function updatePreview() {
  if (!$('#f-name')) return;
  readForm();
  $('#pv-badge').textContent = initial(draft.name || '?');
  $('#pv-badge').style.background = draft.color;
  $('#pv-name').textContent = draft.name || 'サービス名';
  const p = Number(draft.price) || 0;
  $('#pv-desc').textContent = `${cycleText(draft)} ${yen(p)}　→ 月あたり ${yen(monthly(draft))}・年 ${yen(monthly(draft) * 12)}`;
}
function saveDraft() {
  readForm();
  if (!draft.name) return toast('サービス名を入れてね'), $('#f-name').focus();
  if (draft.price === '' || isNaN(draft.price)) return toast('料金を入れてね'), $('#f-price').focus();
  if (!draft.nextDate) return toast('次の支払日を入れてね');
  if (draft.url && !/^https?:\/\//i.test(draft.url)) draft.url = 'https://' + draft.url;
  draft.anchorDay = parse(draft.nextDate).getDate();
  const i = state.subs.findIndex(s => s.id === draft.id);
  const isNew = i < 0;
  if (isNew) state.subs.push(draft); else state.subs[i] = draft;
  save(); vibrate(15);
  closeSheet(); render();
  toast(isNew ? `${draft.name}を登録したよ` : '保存したよ');
  if (isNew && state.subs.length === 1 && !state.settings.notify && 'Notification' in window && Notification.permission === 'default') {
    setTimeout(() => toast('設定から通知をオンにすると、支払い前に知らせるよ'), 2600);
  }
}
function setStatus(to) {
  readForm();
  const s = state.subs.find(x => x.id === draft.id);
  if (!s) return;
  Object.assign(s, draft, { status: to });
  if (to === 'cancelled') s.cancelledAt = Date.now();
  if (to === 'active') { s.anchorDay = parse(s.nextDate).getDate(); }
  save(); closeSheet(); render();
  toast({ paused: '一時停止にしたよ', cancelled: `解約おつかれさま！年${yen(monthly(s) * 12)}の節約だね`, active: '利用中に戻したよ' }[to]);
}

/* 2回タップで確定するボタン（ブラウザのダイアログを使わない） */
function armed(btn, label, fn) {
  if (btn.dataset.armed) { fn(); return; }
  btn.dataset.armed = '1'; const orig = btn.innerHTML;
  btn.classList.add('armed'); btn.innerHTML = label; vibrate(10);
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.classList.remove('armed'); btn.innerHTML = orig; } }, 3000);
}

/* ---------- 通知 ---------- */
async function toggleNotify() {
  if (!('Notification' in window)) return toast('このブラウザは通知に対応していません');
  if (state.settings.notify && Notification.permission === 'granted') {
    state.settings.notify = false; save(); renderSettings(); return toast('通知をオフにしたよ');
  }
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  if (perm !== 'granted') { renderSettings(); return toast('通知が許可されませんでした'); }
  state.settings.notify = true; save(); renderSettings();
  await registerPeriodic();
  const reg = await navigator.serviceWorker?.ready;
  reg?.showNotification('SubPal', { body: '通知をオンにしたよ！支払い前にお知らせするね。', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'subpal-welcome' });
  checkReminders();
}
async function registerPeriodic() {
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('periodicSync' in reg) {
      const st = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (st.state === 'granted') await reg.periodicSync.register('subpal-check', { minInterval: 12 * 60 * 60 * 1000 });
    }
  } catch {}
}
function reminderList() {
  const out = [];
  for (const s of active()) {
    const nd = s.notifyDays ?? 3;
    if (nd < 0) continue;
    if (s.nextDate) { const n = daysUntil(s.nextDate); if (n >= 0 && n <= nd) out.push({ key: `${s.id}:bill:${s.nextDate}`, title: n === 0 ? `今日は${s.name}の支払い日` : `${s.name}の支払いまであと${n}日`, body: `${md(s.nextDate)} に ${yen(s.price)} の支払い予定です。` }); }
    if (s.trialEnd) { const n = daysUntil(s.trialEnd); if (n >= 0 && n <= Math.max(nd, 1)) out.push({ key: `${s.id}:trial:${s.trialEnd}`, title: n === 0 ? `${s.name}の無料期間は今日まで` : `${s.name}の無料期間はあと${n}日`, body: '続けないなら、終わる前に解約しよう。' }); }
  }
  const rp = monthReport();
  if (rp && state.settings.report !== false) out.push({ key: `report:${rp.key}`, title: rp.title, body: rp.body });
  const bi = budgetInfo();
  if (bi && bi.rate >= 0.8) {
    const k = monthKeyOffset(0), over = bi.rate >= 1;
    out.push({ key: `budget:${k}:${over ? 100 : 80}`, title: over ? 'PayPayの予算をオーバーしたよ' : 'PayPayの予算の80%を使ったよ', body: over ? `今月は予算より${yen(-bi.left)}多く使っています。` : `あと${yen(bi.left)}、1日${yen(bi.perDay)}くらいが目安です。` });
  }
  return out;
}
async function checkReminders() {
  if (!state.settings.notify || !('Notification' in window) || Notification.permission !== 'granted') return;
  await mergeNotifiedFromSW();
  const reg = await navigator.serviceWorker?.ready;
  if (!reg) return;
  let changed = false;
  for (const r of reminderList()) {
    if (state.notified[r.key]) continue;
    await reg.showNotification(r.title, { body: r.body, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: r.key, data: { url: './' } });
    state.notified[r.key] = Date.now(); changed = true;
  }
  // 60日より古い記録は掃除
  const limit = Date.now() - 60 * 86400000;
  for (const k in state.notified) if (state.notified[k] < limit) { delete state.notified[k]; changed = true; }
  if (changed) save();
}

/* ---------- 書き出し・読み込み ---------- */
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportJSON() {
  download(`subpal-backup-${toStr(today())}.json`, JSON.stringify({ app: 'SubPal', version: VERSION, exportedAt: new Date().toISOString(), subs: state.subs, settings: state.settings, pay: state.pay }, null, 2), 'application/json');
  toast('バックアップを保存したよ');
}
function importJSON(file) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const d = JSON.parse(fr.result);
      if (!Array.isArray(d.subs)) throw 0;
      state.subs = d.subs.filter(s => s && s.id && s.name).map(s => ({ status: 'active', interval: 1, cycle: 'month', cat: 'other', ...s }));
      if (d.settings) state.settings = { ...state.settings, ...d.settings };
      if (d.pay && Array.isArray(d.pay.payments)) state.pay = { ...state.pay, payments: d.pay.payments, budget: d.pay.budget || 0 };
      save(); applyTheme(); render(); toast('バックアップから復元したよ');
    } catch { toast('ファイルを読み込めませんでした'); }
  };
  fr.readAsText(file);
}
function exportICS() {
  const subs = active().filter(s => s.nextDate);
  if (!subs.length) return toast('利用中のサブスクがないよ');
  const icsEsc = s => String(s).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ymd = s => s.replace(/-/g, '');
  const next = s => toStr(new Date(parse(s).getTime() + 86400000));
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SubPal//JA', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:SubPal サブスク'];
  for (const s of subs) {
    const freq = { month: 'MONTHLY', year: 'YEARLY', week: 'WEEKLY' }[s.cycle];
    const nd = s.notifyDays ?? 3;
    lines.push('BEGIN:VEVENT', `UID:${s.id}@subpal`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(s.nextDate)}`, `DTEND;VALUE=DATE:${ymd(next(s.nextDate))}`,
      `RRULE:FREQ=${freq};INTERVAL=${s.interval || 1}`, `SUMMARY:${icsEsc(`${s.name} 支払い ${yen(s.price)}`)}`,
      `DESCRIPTION:${icsEsc((s.url ? '管理ページ: ' + s.url + '\n' : '') + (s.memo || ''))}`,
      ...(nd < 0 ? [] : ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(s.name + 'の支払い')}`, nd === 0 ? 'TRIGGER:PT9H' : `TRIGGER:-PT${nd * 24 - 9}H`, 'END:VALARM']), 'END:VEVENT');
    if (s.trialEnd && daysUntil(s.trialEnd) >= 0) {
      lines.push('BEGIN:VEVENT', `UID:${s.id}-trial@subpal`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(s.trialEnd)}`, `DTEND;VALUE=DATE:${ymd(next(s.trialEnd))}`,
        `SUMMARY:${icsEsc(s.name + ' 無料期間終了')}`, ...(nd < 0 ? [] : ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(s.name + 'の無料期間がもうすぐ終了')}`, 'TRIGGER:-PT39H', 'END:VALARM']), 'END:VEVENT');
    }
  }
  lines.push('END:VCALENDAR');
  download('subpal.ics', lines.join('\r\n'), 'text/calendar');
  toast('カレンダー用ファイルを書き出したよ');
}

/* ---------- トースト ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- インストール ---------- */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; render(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; render(); toast('ホーム画面に追加したよ！'); });

/* ---------- イベント ---------- */
document.addEventListener('click', async e => {
  const t = e.target.closest('button, a');
  if (!t) return;
  if (t.classList.contains('tab')) return go(t.dataset.view);
  if (t.id === 'fab') return openPicker();
  if (t.dataset.cal) {
    const [y, m] = calMonth.split('-').map(Number);
    calMonth = ym(toStr(new Date(y, m - 1 + Number(t.dataset.cal), 1))); return renderPay();
  }
  if (t.dataset.day) {
    const list = state.pay.payments.filter(p => p.date === t.dataset.day).sort((a, b) => a.t - b.t);
    return openSheet(`<h2>${md(t.dataset.day)}（${wd(t.dataset.day)}）の支払い</h2>
      <div class="card" style="box-shadow:none;background:var(--surface2)">${list.map(p => `<button class="item" data-payment="${p.id}"><div class="badge" style="background:#24324A">支</div><div class="meta"><div class="name">${yen(p.amount)}</div><div class="desc">${p.src === 'manual' ? '手入力' : '通知から自動'}</div></div><div class="right">›</div></button>`).join('')}</div>
      <div class="preview"><div class="name">合計 ${yen(list.reduce((a, p) => a + p.amount, 0))}</div></div>
      <button class="btn ghost" data-act="close">閉じる</button>`);
  }
  if (t.dataset.payment) {
    const p = state.pay.payments.find(x => x.id === t.dataset.payment); if (!p) return;
    return openPayForm(p);
  }
  if (t.dataset.edit) { const s = state.subs.find(x => x.id === t.dataset.edit); if (s) openForm(s); return; }
  if (t.dataset.filter) { listFilter = t.dataset.filter; return renderList(); }
  if (t.dataset.themeSet) { state.settings.theme = t.dataset.themeSet; save(); applyTheme(); return renderSettings(); }
  if (t.dataset.preset) {
    const p = PRESETS.find(x => x.name === t.dataset.preset);
    openForm(); Object.assign(draft, { name: p.name.replace('（その他）', ''), cat: p.cat, color: p.color, url: p.url });
    $('#f-name').value = draft.name; $('#f-cat').value = p.cat; $('#f-url').value = p.url;
    document.querySelectorAll('#f-colors button').forEach(b => b.classList.toggle('on', b.dataset.color === p.color));
    updatePreview(); setTimeout(() => $('#f-price')?.focus(), 350);
    return;
  }
  if (t.dataset.cycle) {
    draft.cycle = t.dataset.cycle; document.querySelectorAll('#f-cycle button').forEach(b => b.classList.toggle('on', b === t));
    $('#f-interval').innerHTML = intervalOptions(draft.cycle, Number($('#f-interval').value)); return updatePreview();
  }
  if (t.dataset.color) {
    if (!t.closest('#f-colors')) return;
    draft.color = t.dataset.color; document.querySelectorAll('#f-colors button').forEach(b => b.classList.toggle('on', b === t)); return updatePreview();
  }
  switch (t.dataset.act) {
    case 'add': return openPicker();
    case 'custom': return openForm();
    case 'save': return saveDraft();
    case 'close': return closeSheet();
    case 'status': return setStatus(t.dataset.to);
    case 'delete': return armed(t, 'もう一度タップで削除', () => { state.subs = state.subs.filter(s => s.id !== draft.id); save(); closeSheet(); render(); toast('削除したよ'); });
    case 'pay-spend': return openPayForm(null);
    case 'go-pay': return go('pay');
    case 'pay-budget': return openSheet(`<h2>PayPayの月予算</h2>
      <div class="field"><label>1か月に使っていい金額</label><div class="price-input"><span>¥</span><input id="b-amount" type="number" inputmode="numeric" min="0" step="1000" value="${state.pay.budget || ''}" placeholder="30000"></div></div>
      <p class="hint">予算の80%を超えるとパルが知らせます。0にすると予算なしに戻ります。</p>
      <button class="btn primary" data-act="budget-save">保存する</button><button class="btn ghost" data-act="close">キャンセル</button>`);
    case 'budget-save': state.pay.budget = Math.max(0, Math.round(Number($('#b-amount').value) || 0)); save(); closeSheet(); render(); return toast(state.pay.budget ? `予算を${yen(state.pay.budget)}にしたよ` : '予算をなしにしたよ');
    case 'pay-save': return savePay();
    case 'pay-delete': return armed(t, 'もう一度タップで削除', () => { state.pay.payments = state.pay.payments.filter(p => p.id !== payDraft.id); save(); closeSheet(); render(); toast('削除したよ'); });
    case 'payment-delete': return armed(t, 'もう一度タップで削除', () => { state.pay.payments = state.pay.payments.filter(p => p.id !== payDraft.id); save(); closeSheet(); render(); toast('削除したよ'); });
    case 'toggle-notify': return toggleNotify();
    case 'toggle-report': state.settings.report = state.settings.report === false; save(); renderSettings(); return toast(state.settings.report === false ? '先月レポートをオフにしたよ' : '先月レポートをオンにしたよ');
    case 'ics': return exportICS();
    case 'export': return exportJSON();
    case 'import': return $('#import-file').click();
    case 'reset': return armed(t, '<div>もう一度タップで全部消します</div>', () => { state.subs = []; state.notified = {}; state.pay.payments = []; save(); render(); toast('すべて削除したよ'); });
    case 'install': if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; render(); } return;
  }
});
$('#backdrop').addEventListener('click', () => closeSheet());
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
document.addEventListener('input', e => {
  if (e.target.id === 'preset-q') $('#preset-grid').innerHTML = presetGrid(e.target.value);
  else if (e.target.closest('#sheet') && e.target.id?.startsWith('f-')) updatePreview();
});
document.addEventListener('change', e => {
  if (e.target.id === 'sort') { listSort = e.target.value; renderList(); }
  if (e.target.id === 'default-notify') { state.settings.defaultNotify = Number(e.target.value); save(); toast('保存したよ'); }
  if (e.target.id === 'import-file' && e.target.files[0]) { importJSON(e.target.files[0]); e.target.value = ''; }
  if (e.target.closest?.('#sheet') && e.target.id?.startsWith('f-')) updatePreview();
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); checkReminders(); } });

/* ---------- 起動 ---------- */
applyTheme();
go('home');
mirror();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => { checkReminders(); if (state.settings.notify) registerPeriodic(); }).catch(() => {});
}
{ const pp = new URLSearchParams(location.search).get('pp'); if (pp !== null) { history.replaceState(null, '', location.pathname); setTimeout(() => importPayments(pp), 100); } }
if (new URLSearchParams(location.search).get('add')) { history.replaceState(null, '', location.pathname); setTimeout(openPicker, 300); }
// 日付が変わったら更新
setInterval(() => { if (!document.hidden) render(); }, 60 * 1000);
