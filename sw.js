/* SubPal Service Worker */
const CACHE = 'subpal-shell-v5';
const DATA_CACHE = 'subpal-data';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/badge-96.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== DATA_CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  // 共有されたスクショを受け取る（Android）
  if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      try {
        const fd = await req.formData();
        const f = fd.get('image');
        if (f) { const c = await caches.open(DATA_CACHE); await c.put('/__shared_image', new Response(f, { headers: { 'content-type': f.type || 'image/png' } })); }
      } catch {}
      return Response.redirect(new URL('./?shared=1', self.registration.scope).href, 303);
    })());
    return;
  }
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // まずネット、だめならキャッシュ（更新がすぐ反映され、オフラインでも動く）
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});

/* ---- バックグラウンドでの通知チェック ---- */
const pad = n => String(n).padStart(2, '0');
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const daysUntil = s => Math.round((parse(s) - today()) / 86400000);
const md = s => { const d = parse(s); return `${d.getMonth() + 1}/${d.getDate()}`; };
const yen = n => '¥' + Math.round(n).toLocaleString('ja-JP');
const toStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function addCycle(dateStr, sub) {
  const d = parse(dateStr), n = sub.interval || 1;
  if (sub.cycle === 'week') { d.setDate(d.getDate() + 7 * n); return toStr(d); }
  const months = (sub.cycle === 'year' ? 12 : 1) * n;
  const anchor = sub.anchorDay || d.getDate(), y = d.getFullYear(), m = d.getMonth() + months;
  return toStr(new Date(y, m, Math.min(anchor, new Date(y, m + 1, 0).getDate())));
}

async function check() {
  const c = await caches.open(DATA_CACHE);
  const r = await c.match('/__subpal_data.json');
  if (!r) return;
  const state = await r.json();
  if (!state.settings?.notify) return;
  state.notified = state.notified || {};
  let changed = false;
  for (const s of state.subs || []) {
    if (s.status !== 'active') continue;
    let guard = 0;
    while (s.nextDate && parse(s.nextDate) < today() && guard++ < 2000) s.nextDate = addCycle(s.nextDate, s);
    const nd = s.notifyDays ?? 3;
    if (nd < 0) continue;
    const list = [];
    if (s.nextDate) { const n = daysUntil(s.nextDate); if (n >= 0 && n <= nd) list.push([`${s.id}:bill:${s.nextDate}`, n === 0 ? `今日は${s.name}の支払い日` : `${s.name}の支払いまであと${n}日`, `${md(s.nextDate)} に ${yen(s.price)} の支払い予定です。`]); }
    if (s.trialEnd) { const n = daysUntil(s.trialEnd); if (n >= 0 && n <= Math.max(nd, 1)) list.push([`${s.id}:trial:${s.trialEnd}`, n === 0 ? `${s.name}の無料期間は今日まで` : `${s.name}の無料期間はあと${n}日`, '続けないなら、終わる前に解約しよう。']); }
    for (const [key, title, body] of list) {
      if (state.notified[key]) continue;
      await self.registration.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: key, data: { url: './' } });
      state.notified[key] = Date.now(); changed = true;
    }
  }
  const pay = state.pay || {};
  if (pay.remind && (pay.records || []).length && !(pay.payments || []).length) {
    const t = today(), k = `${t.getFullYear()}-${pad(t.getMonth() + 1)}`;
    if (!pay.records.some(r => r.type === 'balance' && r.date >= k + '-01') && !state.notified[`pay:${k}`]) {
      await self.registration.showNotification('月が変わったよ', { body: 'PayPayの残高を記録すると、先月いくら使ったかがわかるよ。', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: `pay:${k}`, data: { url: './' } });
      state.notified[`pay:${k}`] = Date.now(); changed = true;
    }
  }
  if (changed) await c.put('/__subpal_data.json', new Response(JSON.stringify(state), { headers: { 'content-type': 'application/json' } }));
}
self.addEventListener('periodicsync', e => { if (e.tag === 'subpal-check') e.waitUntil(check()); });

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const w of list) if ('focus' in w) return w.focus();
    return self.clients.openWindow('./');
  }));
});
