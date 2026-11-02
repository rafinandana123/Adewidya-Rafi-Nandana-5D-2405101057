(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rp = n => 'Rp' + Math.round(Number(n) || 0).toLocaleString('id-ID');
  const pct = n => (Number(n) || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? '-' : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); };
  const param = k => new URLSearchParams(location.search).get(k);
  const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  const K = { users: 'carfit_users', session: 'carfit_user', cars: 'carfit_cars', profile: 'carfit_profile', history: 'carfit_history' };

  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
  };

  const hashPw = s => { let h = 5381; for (const ch of 'carfit:' + s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0; return 'h' + h.toString(16); };

  function toast(msg, type = 'ok') {
    let box = $('#toastBox');
    if (!box) { box = document.createElement('div'); box.id = 'toastBox'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3800);
  }

  function confirmBox(msg, okLabel = 'Ya, lanjutkan') {
    return new Promise(res => {
      const d = document.createElement('dialog');
      d.className = 'confirm-dialog';
      d.innerHTML = `<p>${esc(msg)}</p><div class="admin-form-actions"><button type="button" class="btn btn-secondary" data-r="0">Batal</button><button type="button" class="btn btn-primary" data-r="1">${esc(okLabel)}</button></div>`;
      d.addEventListener('click', e => {
        const b = e.target.closest('[data-r]');
        if (b) { d.close(); res(b.dataset.r === '1'); }
      });
      d.addEventListener('cancel', () => res(false));
      d.addEventListener('close', () => d.remove());
      document.body.appendChild(d);
      d.showModal();
    });
  }

  const SEED_CARS = [
    { id: 'avanza-2020',
      brand: 'Toyota',
      name: 'Avanza 1.3 G M/T',
      year: 2020,
      cond: 'Bekas',
      energy: 'Bensin',
      transmission: 'Manual',
      seats: 7,
      price: 150e6,
      kmpl: 15,
      energyPrice: 10000,
      tax: 2.5e6,
      service: 1.5e6,
      reserve: 0.8e6,
      initial: 3e6,
      active: true },
    { id: 'brio-2021',
      brand: 'Honda',
      name: 'Brio Satya 1.2',
      year: 2021,
      cond: 'Bekas',
      energy: 'Bensin',
      transmission: 'Manual',
      seats: 5,
      price: 135e6,
      kmpl: 18,
      energyPrice: 10000,
      tax: 2.2e6,
      service: 1.3e6,
      reserve: 0.7e6,
      initial: 3e6,
      active: true },
    { id: 'ertiga-2020',
      brand: 'Suzuki',
      name: 'Ertiga 1.5 GX',
      year: 2020,
      cond: 'Bekas',
      energy: 'Bensin',
      transmission: 'Manual',
      seats: 7,
      price: 145e6,
      kmpl: 16,
      energyPrice: 10000,
      tax: 2.8e6,
      service: 1.6e6,
      reserve: 0.8e6,
      initial: 3e6,
      active: true },
    { id: 'xenia-2019',
      brand: 'Daihatsu',
      name: 'Xenia 1.3 R',
      year: 2019,
      cond: 'Bekas',
      energy: 'Bensin',
      transmission: 'Manual',
      seats: 7,
      price: 125e6,
      kmpl: 15,
      energyPrice: 10000,
      tax: 2.2e6,
      service: 1.4e6,
      reserve: 0.8e6,
      initial: 3e6,
      active: true },
    { id: 'agya-2022',
      brand: 'Toyota',
      name: 'Agya 1.2 G M/T',
      year: 2022,
      cond: 'Bekas',
      energy: 'Bensin',
      transmission: 'Manual',
      seats: 5,
      price: 115e6,
      kmpl: 19,
      energyPrice: 10000,
      tax: 1.9e6,
      service: 1.1e6,
      reserve: 0.6e6,
      initial: 3e6,
      active: true },
    { id: 'ayla-2024',
      brand: 'Daihatsu',
      name: 'Ayla 1.0 X',
      year: 2024,
      cond: 'Baru',
      energy: 'Bensin',
      transmission: 'Manual',
      seats: 5,
      price: 170e6,
      kmpl: 21,
      energyPrice: 10000,
      tax: 2.0e6,
      service: 1.0e6,
      reserve: 0.5e6,
      initial: 12e6,
      active: true },
    { id: 'jazz-2018',
      brand: 'Honda',
      name: 'Jazz RS CVT',
      year: 2018,
      cond: 'Bekas',
      energy: 'Bensin',
      transmission: 'Otomatis',
      seats: 5,
      price: 190e6,
      kmpl: 14,
      energyPrice: 10000,
      tax: 3.2e6,
      service: 1.9e6,
      reserve: 1.2e6,
      initial: 3e6,
      active: true },
    { id: 'xpander-2021',
      brand: 'Mitsubishi',
      name: 'Xpander GLS A/T',
      year: 2021,
      cond: 'Bekas',
      energy: 'Bensin',
      transmission: 'Otomatis',
      seats: 7,
      price: 220e6,
      kmpl: 14,
      energyPrice: 10000,
      tax: 3.6e6,
      service: 2.0e6,
      reserve: 1.2e6,
      initial: 3.5e6,
      active: true },
    { id: 'innova-2019',
      brand: 'Toyota',
      name: 'Innova Reborn 2.4 G Diesel',
      year: 2019,
      cond: 'Bekas',
      energy: 'Diesel',
      transmission: 'Manual',
      seats: 7,
      price: 290e6,
      kmpl: 12,
      energyPrice: 13500,
      tax: 4.8e6,
      service: 2.6e6,
      reserve: 1.6e6,
      initial: 4e6,
      active: true },
    { id: 'airev-2023',
      brand: 'Wuling',
      name: 'Air EV Long Range',
      year: 2023,
      cond: 'Baru',
      energy: 'Listrik',
      transmission: 'Otomatis',
      seats: 4,
      price: 230e6,
      kmpl: 10,
      energyPrice: 1700,
      tax: 0.4e6,
      service: 0.9e6,
      reserve: 0.6e6,
      initial: 8e6,
      active: true }
  ];

  function normCar(c) {
    return {
      ...c,
      id: String(c.id || uid('car')),
      energy: c.energy || 'Bensin',
      transmission: c.transmission || '-',
      seats: Number(c.seats) || 0,
      active: c.active !== false,
      price: Number(c.price) || 0,
      kmpl: Number(c.kmpl) || 1,
      energyPrice: Number(c.energyPrice) || 0,
      tax: Number(c.tax) || 0,
      service: Number(c.service) || 0,
      reserve: Number(c.reserve) || 0,
      initial: Number(c.initial) || 0
    };
  }

  function loadCars() {
    const raw = store.get(K.cars, null);
    if (!Array.isArray(raw)) {
      const seed = SEED_CARS.map(normCar);
      store.set(K.cars, seed);
      return seed;
    }
    return raw.filter(c => c && typeof c === 'object').map(normCar);
  }

  let CARS = loadCars();
  const saveCars = () => store.set(K.cars, CARS);
  const carById = id => CARS.find(c => c.id === id) || null;
  const activeCars = () => CARS.filter(c => c.active);
  const unitE = c => (c.energy === 'Listrik' ? 'kWh' : 'liter');
  const effUnit = c => (c.energy === 'Listrik' ? 'km/kWh' : 'km/L');

  const PHONE_RE = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function loadUsers() {
    let users = store.get(K.users, null);
    if (!Array.isArray(users)) users = [];
    let changed = false;
    users = users.filter(u => u && u.email).map(u => {
      const n = { ...u };
      if (!n.id) { n.id = uid('u'); changed = true; }
      if (n.password && !n.pw) { n.pw = hashPw(n.password); changed = true; }
      if ('password' in n) { delete n.password; changed = true; }
      if (!n.role) { n.role = 'user'; changed = true; }
      if (!n.status) { n.status = 'aktif'; changed = true; }
      if (!n.createdAt) { n.createdAt = new Date().toISOString(); changed = true; }
      return n;
    });
    if (!users.some(u => u.role === 'admin')) {
      users.push({ id: 'u-admin',
        name: 'Admin CarFit',
        email: 'admin@carfit.com',
        phone: '081200000001',
        pw: hashPw('admin123'),
        role: 'admin',
        status: 'aktif',
        createdAt: new Date().toISOString() });
      changed = true;
    }
    if (!localStorage.getItem(K.users) && !users.some(u => u.email === 'demo@carfit.com')) {
      users.push({ id: 'u-demo',
        name: 'Demo Pengguna',
        email: 'demo@carfit.com',
        phone: '081200000002',
        pw: hashPw('demo123'),
        role: 'user',
        status: 'aktif',
        createdAt: new Date().toISOString() });
      changed = true;
    }
    if (changed) store.set(K.users, users);
    return users;
  }
  const saveUsers = u => store.set(K.users, u);

  function currentUser() {
    const s = store.get(K.session, null);
    if (!s) return null;
    const u = loadUsers().find(x => (s.id && x.id === s.id) || (!s.id && x.email === s.email));
    if (!u || u.status !== 'aktif') return null;
    return u;
  }
  const isAdmin = u => !!u && u.role === 'admin';

  const DEFAULT_OPTS = { purpose: 'kerja', method: 'credit', dp: 30e6, tenor: 48, distance: 1000 };
  function profileMap() {
    const m = store.get(K.profile, {});
    if (!m || typeof m !== 'object' || Array.isArray(m) || 'income' in m) return {}; 
    return m;
  }
  function getProfile(userId) {
    if (!userId) return null;
    const m = profileMap();
    if (!m['u-demo'] && !localStorage.getItem(K.profile) && userId === 'u-demo') {
      m['u-demo'] = { income: 8e6, expenses: 3e6, installments: 0.5e6, savings: 40e6, dependents: 1, ...DEFAULT_OPTS };
      store.set(K.profile, m);
    }
    return m[userId] ? { ...DEFAULT_OPTS, ...m[userId] } : null;
  }
  function saveProfile(userId, p) {
    const m = profileMap();
    m[userId] = p;
    return store.set(K.profile, m);
  }

  const CFG = {
    rate: 0.08,
    totalLimit: 0.30,
    mainLimit: 0.30,
    hobbyLimit: 0.10,
    purposeLimits: {
      kerja: 0.30,
      keluarga: 0.50,
      usaha: 0.45,
      hobi: 0.10
    }
  };

  function calculate(car, p, o) {
    const G = p.income, O = p.expenses, A = p.installments;
    const E = (o.distance / car.kmpl) * car.energyPrice;
    const T = car.tax / 12, S = car.service / 12, R = car.reserve / 12;
    const C = E + T + S + R;

    let M = 0, principal = 0, interest = 0, dp = 0, dpAdjusted = false, upfront;
    if (o.method === 'credit') {
      dp = Math.min(Math.max(o.dp, 0), car.price);
      dpAdjusted = dp !== o.dp;
      principal = car.price - dp;
      interest = principal * CFG.rate * (o.tenor / 12);
      M = (principal + interest) / o.tenor;
      upfront = dp + car.initial;
    } else {
      upfront = car.price + car.initial;
    }

    const V = C + M;                                   
    const limitPct = CFG.purposeLimits[o.purpose] ?? CFG.mainLimit;
    const L = limitPct * G;
    const B = G > 0 ? (V / G) * 100 : 0;               
    const totalDue = A + V;                            
    const D = G > 0 ? (totalDue / G) * 100 : 0;        
    const left = G - O - A - V;                        
    const eps = 0.5;

    const fundsOk = p.savings + eps >= upfront;
    const loadOk = V <= L + eps;
    const totalOk = totalDue <= limitPct * G + eps;
    const cashOk = left >= -eps;

    const reasons = [];
    if (!fundsOk) reasons.push(`Dana awal kurang ${rp(upfront - p.savings)} (butuh ${rp(upfront)}, tabungan ${rp(p.savings)}).`);
    if (!cashOk) reasons.push(`Pengeluaran dan kewajiban bulanan melebihi penghasilan sebesar ${rp(-left)}.`);
    if (!loadOk) reasons.push(`Beban mobil ${pct(B)} dari penghasilan melewati batas ${limitPct * 100}% untuk ${o.purpose === 'hobi' ? 'kendaraan hobi' : 'kendaraan utama'} (${rp(L)}).`);
    if (!totalOk) reasons.push(`Total kewajiban bulanan (cicilan aktif + mobil) ${pct(D)} dari penghasilan melewati batas acuan ${limitPct * 100}%.`);

    const status = (!fundsOk || !cashOk) ? 'BELUM SESUAI' : ((!loadOk || !totalOk) ? 'PERLU PERTIMBANGAN' : 'SESUAI');
    if (!reasons.length) reasons.push(`Dana awal mencukupi (sisa tabungan ${rp(p.savings - upfront)}), beban mobil ${pct(B)} dan total kewajiban ${pct(D)} berada dalam batas, serta sisa penghasilan ${rp(left)} per bulan.`);

    return { carId: car.id,
      E,
      T,
      S,
      R,
      C,
      M,
      principal,
      interest,
      dp,
      dpAdjusted,
      upfront,
      V,
      L,
      limitPct,
      B,
      totalDue,
      D,
      left,
      savingsAfter: p.savings - upfront,
      fundsOk,
      loadOk,
      totalOk,
      cashOk,
      status,
      reasons };
  }

  const cls = s => (s === 'SESUAI' ? 'success' : s === 'PERLU PERTIMBANGAN' ? 'warning' : 'danger');
  const label = s => (s === 'SESUAI' ? 'Sesuai' : s === 'PERLU PERTIMBANGAN' ? 'Perlu Pertimbangan' : 'Belum Sesuai');
  const ICON = { success: '✓', warning: '!', danger: '✕' };
  const badge = s => `<span class="status status-${cls(s)}">${ICON[cls(s)]} ${label(s)}</span>`;
  const PRIORITY = { 'SESUAI': 0, 'PERLU PERTIMBANGAN': 1, 'BELUM SESUAI': 2 };
  const PURPOSE = { kerja: 'Kerja', keluarga: 'Keluarga', usaha: 'Usaha', hobi: 'Hobi / Kendaraan Sekunder' };

  function validateFinance(p) {
    const e = [];
    const f = (v,
      n) => { if (v === '' || v === null || v === undefined || !Number.isFinite(Number(v))) e.push(`${n} harus berupa angka.`);
      else if (Number(v) < 0) e.push(`${n} tidak boleh negatif.`);
      };
    f(p.income, 'Penghasilan'); f(p.expenses, 'Pengeluaran rutin'); f(p.installments, 'Cicilan aktif'); f(p.savings, 'Tabungan');
    if (!e.length && Number(p.income) <= 0) e.push('Penghasilan bulanan harus lebih dari 0.');
    return e;
  }
  function validatePurchase(o, price) {
    const e = [];
    if (!Number.isFinite(o.distance) || o.distance <= 0) e.push('Jarak tempuh per bulan harus lebih dari 0 km.');
    if (!PURPOSE[o.purpose]) e.push('Pilih tujuan penggunaan mobil.');
    if (o.method === 'credit') {
      if (!Number.isFinite(o.tenor) || !Number.isInteger(o.tenor) || o.tenor < 12 || o.tenor > 84) e.push('Tenor harus bilangan bulat antara 12 dan 84 bulan.');
      if (!Number.isFinite(o.dp) || o.dp < 0) e.push('Uang muka (DP) tidak boleh kosong atau negatif.');
      else if (price && o.dp > price) e.push(`DP tidak boleh melebihi harga mobil (${rp(price)}).`);
    }
    return e;
  }

  function evaluateAll(profile) {
    const p = { income: profile.income, expenses: profile.expenses, installments: profile.installments, savings: profile.savings };
    const o = { method: profile.method, dp: profile.dp, tenor: profile.tenor, distance: profile.distance, purpose: profile.purpose };
    return activeCars()
      .map(car => ({ car, r: calculate(car, p, o) }))
      .sort((a, b) => PRIORITY[a.r.status] - PRIORITY[b.r.status] || a.r.V - b.r.V);
  }

  const getHistory = () => { const h = store.get(K.history, []); return Array.isArray(h) ? h.filter(x => x && x.id && x.car && x.result) : []; };
  const userHistory = u => getHistory().filter(h => h.user && h.user.id === u.id).sort((a, b) => new Date(b.date) - new Date(a.date));

  function saveHistory(user, car, p, o, r) {
    const entry = {
      id: uid('h'),
      date: new Date().toISOString(),
      user: { id: user.id, name: user.name, email: user.email },
      car: JSON.parse(JSON.stringify(car)),
      profile: { income: p.income, expenses: p.expenses, installments: p.installments, savings: p.savings },
      options: { ...o },
      result: JSON.parse(JSON.stringify(r))
    };
    const all = getHistory();
    all.unshift(entry);
    return store.set(K.history, all.slice(0, 500)) ? entry : null;
  }

  const PAGE = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function renderChrome(user) {
    const nav = $('#siteNav');
    if (nav) {
      const links = !user
        ? [['index.html', 'Beranda'], ['catalog.html', 'Katalog Mobil'], ['index.html#how-it-works', 'Cara Kerja']]
        : isAdmin(user)
          ? [['admin.html', 'Admin'], ['catalog.html', 'Katalog Mobil']]
          : [['dashboard.html',
            'Dashboard'],
            ['catalog.html',
            'Katalog Mobil'],
            ['recommendations.html',
            'Rekomendasi'],
            ['analysis.html',
            'Analisis'],
            ['history.html',
            'Riwayat']];
      const act = h => (h.split('#')[0] === PAGE || (PAGE === 'result.html' && h === 'history.html') || (PAGE === 'detail.html' && h === 'catalog.html')) && !h.includes('#') ? ' class="active"' : '';
      const initial = user ? esc(user.name.trim().charAt(0).toUpperCase() || '?') : '';
      nav.innerHTML = `
        <div class="container navbar-inner">
          <a href="index.html" class="logo">CarFit</a>
          <button type="button" class="nav-toggle" id="navToggle" aria-label="Buka menu" aria-expanded="false">☰</button>
          <nav class="nav-menu" id="navMenu">
            ${links.map(([h, t]) => `<a href="${h}"${act(h)}>${t}</a>`).join('')}
            ${user ? `
            <div class="user-menu">
              <button type="button" class="user-menu-button" id="userMenuButton" aria-expanded="false" aria-controls="userDropdown">
                <div class="user-avatar">${initial}</div>
                <div class="user-info"><span class="user-name">${esc(user.name)}</span><span class="user-role">${isAdmin(user) ? 'Administrator' : 'Pengguna'}</span></div>
                <span class="user-arrow">▾</span>
              </button>
              <div class="user-dropdown" id="userDropdown">
                <div class="user-dropdown-header"><div class="user-avatar large">${initial}</div><div><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span></div></div>
                <div class="user-dropdown-menu">
                  ${isAdmin(user) ? '<a href="admin.html"><span class="dropdown-icon">⚙</span><span>Panel Admin</span></a>' : '<a href="profile.html"><span class="dropdown-icon">👤</span><span>Profil &amp; Keuangan</span></a><a href="history.html"><span class="dropdown-icon">🕘</span><span>Riwayat Analisis</span></a>'}
                </div>
                <div class="user-dropdown-footer"><a href="#" class="logout-link" id="logoutLink"><span class="dropdown-icon">↪</span><span>Keluar</span></a></div>
              </div>
            </div>` : '<a href="auth.html" class="btn btn-primary">Masuk</a>'}
          </nav>
        </div>`;
      const tg = $('#navToggle');
      tg.addEventListener('click', () => { const o = $('#navMenu').classList.toggle('open'); tg.setAttribute('aria-expanded', o); });
      const btn = $('#userMenuButton'), dd = $('#userDropdown');
      if (btn) {
        btn.addEventListener('click', e => { e.stopPropagation(); const o = dd.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
        document.addEventListener('click', e => { if (!dd.contains(e.target)) dd.classList.remove('open'); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape') dd.classList.remove('open'); });
        $('#logoutLink').addEventListener('click', e => {
          e.preventDefault();
          localStorage.removeItem(K.session);
          location.href = 'auth.html?out=1';
        });
      }
    }
    const ft = $('#siteFooter');
    if (ft) ft.innerHTML = `<div class="container footer-inner"><div><strong>CarFit</strong><p>Pilih Mobil Sesuai Kemampuan.</p></div><p>© 2026 CarFit. Simulasi frontend untuk UTS — bukan penawaran kredit resmi.</p></div>`;
    $$('[data-start]').forEach(a => { a.href = user && !isAdmin(user) ? 'analysis.html' : 'auth.html?next=analysis.html'; });
  }

  function guard(user) {
    const need = document.body.dataset.access;
    if (!need) return true;
    const here = PAGE + location.search;
    if (need === 'guest') { if (user) { location.replace(isAdmin(user) ? 'admin.html' : 'dashboard.html'); return false; } return true; }
    if (!user) { location.replace('auth.html?next=' + encodeURIComponent(here)); return false; }
    if (need === 'admin' && !isAdmin(user)) { location.replace('dashboard.html'); return false; }
    if (need === 'user' && isAdmin(user)) { location.replace('admin.html'); return false; }
    return true;
  }

  const carImg = (c, cls2 = '') => c.image ? `<img src="${esc(c.image)}" alt="${esc(c.brand + ' ' + c.name)}" class="${cls2}">` : '<span>Foto belum tersedia</span>';

  function initCatalog() {
    const grid = $('#catalogGrid');
    if (!grid) return;
    const cars = activeCars();
    const fill = (id, vals, first) => { $(id).innerHTML = `<option value="">${first}</option>` + vals.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join(''); };
    fill('#brand', [...new Set(cars.map(c => c.brand))].sort(), 'Semua Merek');
    fill('#year', [...new Set(cars.map(c => c.year))].sort((a, b) => b - a), 'Semua Tahun');
    const f = { q: $('#carSearch'), brand: $('#brand'), year: $('#year'), cond: $('#condition'), energy: $('#energy'), price: $('#price'), sort: $('#sortCars') };

    const render = () => {
      let list = cars.filter(c => {
        const q = f.q.value.trim().toLowerCase();
        return (!q || `${c.brand} ${c.name} ${c.year}`.toLowerCase().includes(q)) &&
          (!f.brand.value || c.brand === f.brand.value) &&
          (!f.year.value || String(c.year) === f.year.value) &&
          (!f.cond.value || c.cond === f.cond.value) &&
          (!f.energy.value || c.energy === f.energy.value) &&
          (!f.price.value || c.price <= Number(f.price.value));
      });
      const s = f.sort.value;
      if (s === 'price-asc') list.sort((a, b) => a.price - b.price);
      if (s === 'price-desc') list.sort((a, b) => b.price - a.price);
      if (s === 'year-desc') list.sort((a, b) => b.year - a.year);
      grid.innerHTML = list.map(c => `
        <article class="car-card">
          <div class="car-image">${carImg(c)}</div>
          <div class="car-card-content">
            <span class="car-brand">${esc(c.brand)}</span>
            <h3>${esc(c.name)}</h3>
            <p class="car-meta">${c.year} • ${esc(c.cond)} • ${esc(c.energy)}</p>
            <div class="car-price">${rp(c.price)}</div>
            <div class="car-divider"></div>
            <div class="car-info"><span>Konsumsi</span><strong>${c.kmpl} ${effUnit(c)}</strong></div>
            <a href="detail.html?car=${encodeURIComponent(c.id)}" class="btn btn-secondary car-button">Lihat Detail</a>
          </div>
        </article>`).join('');
      const empty = $('#emptyCatalog');
      empty.hidden = list.length > 0;
      empty.textContent = cars.length === 0 ? 'Belum ada mobil di katalog. Admin dapat menambahkan data mobil.' : 'Tidak ada mobil yang cocok dengan pencarian atau filter. Coba ubah kata kunci atau kriteria.';
      $('#catalogCount').textContent = `${list.length} dari ${cars.length} kendaraan ditampilkan.`;
    };
    Object.values(f).forEach(el => { el.addEventListener('input', render); el.addEventListener('change', render); });
    $('#resetFilters').addEventListener('click', () => { Object.values(f).forEach(el => { el.value = ''; }); render(); });
    render();
  }

  function initDetail() {
    const root = $('#detailRoot');
    if (!root) return;
    const car = carById(param('car'));
    if (!car) {
      root.innerHTML = `<div class="container"><div class="empty-state"><h2>Mobil tidak ditemukan</h2><p>Tautan mobil tidak valid. Pilih mobil dari katalog.</p><a class="btn btn-primary" href="catalog.html">Ke Katalog</a></div></div>`;
      return;
    }
    document.title = `${car.brand} ${car.name} | CarFit`;
    const user = currentUser();
    const prof = user ? getProfile(user.id) : null;
    const draw = dist => {
      const E = (dist / car.kmpl) * car.energyPrice, T = car.tax / 12, S = car.service / 12, R = car.reserve / 12, C = E + T + S + R;
      $('#ownershipGrid').innerHTML = `
        <article class="ownership-card"><div class="ownership-icon">E</div><h3>Energi</h3><p>${dist.toLocaleString('id-ID')} km ÷ ${car.kmpl} ${effUnit(car)} × ${rp(car.energyPrice)}/${unitE(car)}</p><div class="ownership-formula">${rp(E)} / bulan</div></article>
        <article class="ownership-card"><div class="ownership-icon">P</div><h3>Pajak</h3><p>${rp(car.tax)} per tahun ÷ 12</p><div class="ownership-formula">${rp(T)} / bulan</div></article>
        <article class="ownership-card"><div class="ownership-icon">S</div><h3>Servis Berkala</h3><p>${rp(car.service)} per tahun ÷ 12</p><div class="ownership-formula">${rp(S)} / bulan</div></article>
        <article class="ownership-card"><div class="ownership-icon">R</div><h3>Dana Perbaikan</h3><p>${rp(car.reserve)} per tahun ÷ 12</p><div class="ownership-formula">${rp(R)} / bulan</div></article>`;
      $('#ownershipTotal').innerHTML = `Estimasi biaya kepemilikan <strong>${rp(C)}</strong> per bulan (${rp(C * 12)} per tahun), belum termasuk cicilan.`;
    };
    $('#breadcrumbCar').textContent = car.name;
    $('#detailBrand').textContent = car.brand;
    $('#detailName').textContent = car.name;
    $('#detailMeta').textContent = `${car.year} • ${car.cond} • ${car.energy}`;
    $('#detailPrice').textContent = rp(car.price);
    $('#detailImage').innerHTML = carImg(car);
    $('#detailDescription').textContent = `${car.brand} ${car.name} (${car.year}, ${car.cond.toLowerCase()}) dinilai dari harga, biaya kepemilikan bulanan, dan kondisi finansial Anda dengan aturan CarFit yang sama di seluruh halaman.`;
    const spec = [['Harga Mobil',
      rp(car.price)],
      ['Tahun',
      car.year],
      ['Kondisi',
      car.cond],
      ['Jenis Energi',
      car.energy],
      ['Transmisi',
      car.transmission],
      ['Kapasitas',
      car.seats ? car.seats + ' penumpang' : '-'],
      ['Efisiensi Energi',
      `${car.kmpl} ${effUnit(car)}`],
      ['Harga Energi',
      `${rp(car.energyPrice)} / ${unitE(car)}`],
      ['Pajak Tahunan',
      rp(car.tax)],
      ['Servis Tahunan',
      rp(car.service)],
      ['Dana Perbaikan / Tahun',
      rp(car.reserve)],
      ['Biaya Awal Lain',
      rp(car.initial)]];
    $('#specGrid').innerHTML = spec.map(([k, v]) => `<div class="specification-card"><span>${k}</span><strong>${esc(v)}</strong></div>`).join('');
    const di = $('#distInput');
    di.value = prof && prof.distance > 0 ? prof.distance : 1000;
    const upd = () => draw(Math.max(0, Number(di.value) || 0));
    di.addEventListener('input', upd);
    upd();
    const url = `analysis.html?car=${encodeURIComponent(car.id)}`;
    $('#detailAnalysis').href = url;
    $('#detailSim').href = url + '#simulasi';
    $('#detailAnalysisBottom').href = url;
    if (!car.active) {
      $('#inactiveNote').hidden = false;
      $$('#detailAnalysis,#detailSim,#detailAnalysisBottom').forEach(a => { a.removeAttribute('href'); a.classList.add('disabled'); a.setAttribute('aria-disabled', 'true'); });
    }
  }

  function safeNext(n) { return n && /^[a-z-]+\.html(\?[\w=&%.-]*)?$/i.test(n) ? n : null; }

  function initAuth() {
    const lf = $('#loginForm'), rf = $('#registerForm');
    if (!lf || !rf) return;
    if (param('out')) toast('Anda telah keluar.');
    const show = reg => {
      lf.hidden = reg; rf.hidden = !reg;
      $('#authTitle').textContent = reg ? 'Buat Akun CarFit' : 'Masuk ke Akun';
      $('#authSubtitle').textContent = reg ? 'Daftar untuk mulai menggunakan fitur CarFit.' : 'Masukkan informasi akun untuk melanjutkan.';
      $('#loginMessage').textContent = ''; $('#registerMessage').textContent = '';
    };
    $('#showRegister').addEventListener('click', () => show(true));
    $('#showLogin').addEventListener('click', () => show(false));
    loadUsers();

    rf.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('#registerMessage'); msg.className = 'auth-message error';
      const name = $('#registerName').value.trim().replace(/\s+/g, ' ');
      const email = $('#registerEmail').value.trim().toLowerCase();
      const phone = $('#registerPhone').value.trim().replace(/[\s-]/g, '');
      const pw = $('#registerPassword').value, pw2 = $('#confirmPassword').value;
      if (name.length < 2) return void (msg.textContent = 'Nama minimal 2 karakter.');
      if (!EMAIL_RE.test(email)) return void (msg.textContent = 'Format email tidak valid.');
      if (!PHONE_RE.test(phone)) return void (msg.textContent = 'Nomor HP tidak valid. Contoh: 081234567890.');
      if (pw.length < 6 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return void (msg.textContent = 'Kata sandi minimal 6 karakter dan mengandung huruf serta angka.');
      if (pw !== pw2) return void (msg.textContent = 'Konfirmasi kata sandi tidak sama.');
      const users = loadUsers();
      if (users.some(u => u.email === email)) return void (msg.textContent = 'Email sudah terdaftar. Silakan masuk.');
      users.push({ id: uid('u'), name, email, phone, pw: hashPw(pw), role: 'user', status: 'aktif', createdAt: new Date().toISOString() });
      if (!saveUsers(users)) return void (msg.textContent = 'Akun gagal disimpan. Periksa pengaturan penyimpanan browser.');
      msg.className = 'auth-message ok'; msg.textContent = 'Pendaftaran berhasil. Silakan masuk.';
      rf.reset();
      setTimeout(() => { show(false); $('#loginEmail').value = email; $('#loginPassword').focus(); }, 700);
    });

    lf.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('#loginMessage'); msg.className = 'auth-message error';
      const email = $('#loginEmail').value.trim().toLowerCase();
      const pw = $('#loginPassword').value;
      if (!EMAIL_RE.test(email)) return void (msg.textContent = 'Format email tidak valid.');
      const u = loadUsers().find(x => x.email === email && x.pw === hashPw(pw));
      if (!u) return void (msg.textContent = 'Email atau kata sandi tidak sesuai.');
      if (u.status !== 'aktif') return void (msg.textContent = 'Akun Anda dinonaktifkan. Hubungi admin CarFit.');
      if (!store.set(K.session, { id: u.id })) return void (msg.textContent = 'Gagal menyimpan sesi. Periksa pengaturan browser.');
      msg.className = 'auth-message ok'; msg.textContent = 'Berhasil masuk.';
      location.href = isAdmin(u) ? 'admin.html' : (safeNext(param('next')) || 'dashboard.html');
    });
  }

  function initProfile(user) {
    const af = $('#accountForm');
    if (!af) return;
    const fill = () => { af.name.value = user.name; af.email.value = user.email; af.phone.value = user.phone || ''; };
    fill();
    af.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('#accountMessage'); msg.className = 'auth-message error';
      const name = af.name.value.trim().replace(/\s+/g, ' '), email = af.email.value.trim().toLowerCase(), phone = af.phone.value.trim().replace(/[\s-]/g, '');
      if (name.length < 2) return void (msg.textContent = 'Nama minimal 2 karakter.');
      if (!EMAIL_RE.test(email)) return void (msg.textContent = 'Format email tidak valid.');
      if (!PHONE_RE.test(phone)) return void (msg.textContent = 'Nomor HP tidak valid. Contoh: 081234567890.');
      const users = loadUsers();
      if (users.some(u => u.email === email && u.id !== user.id)) return void (msg.textContent = 'Email sudah dipakai akun lain.');
      const me = users.find(u => u.id === user.id);
      Object.assign(me, { name, email, phone });
      if (!saveUsers(users)) return void (msg.textContent = 'Perubahan gagal disimpan.');
      msg.className = 'auth-message ok'; msg.textContent = 'Data akun berhasil disimpan.';
      toast('Data akun disimpan.');
      renderChrome(me);
    });

    const ff = $('#profileForm');
    const p = getProfile(user.id) || { ...DEFAULT_OPTS, income: '', expenses: '', installments: 0, savings: '', dependents: 0 };
    ['income', 'expenses', 'installments', 'savings', 'dependents', 'distance'].forEach(k => { ff[k].value = p[k] ?? ''; });
    ff.down_payment.value = p.dp ?? 0; ff.tenor.value = p.tenor ?? 48;
    const pick = (name, v) => { const i = $(`input[name="${name}"][value="${v}"]`, ff); if (i) i.checked = true; };
    pick('purpose', p.purpose); pick('purchase_method', p.method);
    const toggle = () => {
      const credit = $('input[name="purchase_method"]:checked', ff)?.value === 'credit';
      $('#creditOptions').hidden = !credit; ff.down_payment.disabled = !credit; ff.tenor.disabled = !credit;
    };
    $$('input[name="purchase_method"]', ff).forEach(i => i.addEventListener('change', toggle));
    toggle();
    ff.addEventListener('submit', e => {
      e.preventDefault();
      const msg = $('#profileMessage'); msg.className = 'auth-message error';
      const data = {
        income: ff.income.value === '' ? NaN : Number(ff.income.value), expenses: ff.expenses.value === '' ? NaN : Number(ff.expenses.value),
        installments: ff.installments.value === '' ? NaN : Number(ff.installments.value), savings: ff.savings.value === '' ? NaN : Number(ff.savings.value),
        dependents: Number(ff.dependents.value) || 0, distance: Number(ff.distance.value),
        purpose: $('input[name="purpose"]:checked', ff)?.value, method: $('input[name="purchase_method"]:checked', ff)?.value || 'cash',
        dp: Number(ff.down_payment.value) || 0, tenor: Number(ff.tenor.value) || 48
      };
      const errs = [...validateFinance(data), ...validatePurchase(data, 0)];
      if (data.dependents < 0) errs.push('Jumlah tanggungan tidak boleh negatif.');
      if (errs.length) { msg.innerHTML = errs.map(esc).join('<br>'); return; }
      if (!saveProfile(user.id, data)) return void (msg.textContent = 'Profil gagal disimpan. Periksa pengaturan penyimpanan browser.');
      msg.className = 'auth-message ok'; msg.textContent = 'Profil finansial berhasil disimpan.';
      toast('Profil finansial disimpan.');
    });

    $('#passwordForm').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target, msg = $('#passwordMessage'); msg.className = 'auth-message error';
      const users = loadUsers(), me = users.find(u => u.id === user.id);
      if (me.pw !== hashPw(f.current.value)) return void (msg.textContent = 'Kata sandi saat ini salah.');
      const n = f.newpw.value;
      if (n.length < 6 || !/[A-Za-z]/.test(n) || !/\d/.test(n)) return void (msg.textContent = 'Kata sandi baru minimal 6 karakter dan mengandung huruf serta angka.');
      if (n !== f.confirm.value) return void (msg.textContent = 'Konfirmasi kata sandi baru tidak sama.');
      if (hashPw(n) === me.pw) return void (msg.textContent = 'Kata sandi baru harus berbeda dari yang lama.');
      me.pw = hashPw(n);
      if (!saveUsers(users)) return void (msg.textContent = 'Kata sandi gagal disimpan.');
      f.reset(); msg.className = 'auth-message ok'; msg.textContent = 'Kata sandi berhasil diganti.';
      toast('Kata sandi diganti.');
    });
  }

  function initAnalysis(user) {
    const form = $('#analysisForm');
    if (!form) return;
    const cars = activeCars();
    const none = $('#noCars');
    if (!cars.length) { none.hidden = false; $('#analysisArea').hidden = true; return; }
    const wanted = carById(param('car'));
    if (param('car') && (!wanted || !wanted.active)) toast('Mobil yang dipilih tidak tersedia. Pilih mobil lain.', 'err');
    let car = wanted && wanted.active ? wanted : cars[0];

    const p = getProfile(user.id);
    if (p) { ['income',
      'expenses',
      'installments',
      'savings'].forEach(k => { form[k].value = p[k];
      });
      form.distance.value = p.distance;
      form.purpose.value = p.purpose;
      form.dp.value = p.dp;
      form.tenor.value = p.tenor;
      $$('input[name="method"]',
      form).forEach(r => { r.checked = r.value === p.method;
      });
      }
    else { $('#noProfileNote').hidden = false; form.installments.value = 0; form.distance.value = 1000; }

    const sel = $('#carSelect');
    sel.innerHTML = cars.map(c => `<option value="${esc(c.id)}">${esc(c.brand)} ${esc(c.name)} (${c.year})</option>`).join('');
    sel.value = car.id;

    const read = () => ({
      p: { income: form.income.value === '' ? NaN : Number(form.income.value),
        expenses: form.expenses.value === '' ? NaN : Number(form.expenses.value),
        installments: form.installments.value === '' ? NaN : Number(form.installments.value),
        savings: form.savings.value === '' ? NaN : Number(form.savings.value) },
      o: { method: $('input[name="method"]:checked',
        form)?.value || 'credit',
        dp: form.dp.value === '' ? NaN : Number(form.dp.value),
        tenor: form.tenor.value === '' ? NaN : Number(form.tenor.value),
        distance: form.distance.value === '' ? NaN : Number(form.distance.value),
        purpose: form.purpose.value }
    });
    const check = () => { const { p: pp, o } = read(); return [...validateFinance(pp), ...validatePurchase(o, car.price)]; };

    const drawCar = () => {
      $('#selCarBody').innerHTML = `
        <div class="selected-car-image">${carImg(car)}</div>
        <span class="car-brand">${esc(car.brand)}</span><h2>${esc(car.name)}</h2>
        <p class="selected-car-year">${car.year} • ${esc(car.cond)} • ${esc(car.energy)}</p>
        <strong class="selected-car-price">${rp(car.price)}</strong>
        <div class="selected-car-spec">
          <div><span>Konsumsi Energi</span><strong>${car.kmpl} ${effUnit(car)}</strong></div>
          <div><span>Pajak Tahunan</span><strong>${rp(car.tax)}</strong></div>
          <div><span>Servis Tahunan</span><strong>${rp(car.service)}</strong></div>
          <div><span>Dana Perbaikan / Tahun</span><strong>${rp(car.reserve)}</strong></div>
        </div>`;
    };

    const preview = () => {
      const credit = read().o.method === 'credit';
      $('#creditFields').hidden = !credit; form.dp.disabled = !credit; form.tenor.disabled = !credit;
      const errs = check();
      const box = $('#simBox');
      if (errs.length) { box.innerHTML = `<p class="sim-hint">Lengkapi data yang valid untuk melihat simulasi.</p><ul class="form-error-list">${errs.map(e => `<li>${esc(e)}</li>`).join('')}</ul>`;
        return;
        }
      const { p: pp, o } = read();
      const r = calculate(car, pp, o);
      const row = (n, v, c = '') => `<div class="result-cost-row ${c}"><span>${n}</span><strong>${v}</strong></div>`;
      box.innerHTML = `
        ${row('Harga mobil', rp(car.price))}
        ${row(credit ? 'Kebutuhan dana awal (DP + biaya awal lain)' : 'Kebutuhan dana awal (harga + biaya awal lain)', rp(r.upfront))}
        ${credit ? row('Pokok kredit', rp(r.principal)) + row(`Total bunga (8%/thn × ${o.tenor / 12} thn)`, rp(r.interest)) + row('Estimasi cicilan bulanan', rp(r.M)) : row('Cicilan bulanan', 'Tidak ada (tunai)')}
        ${row('Biaya kepemilikan bulanan', rp(r.C))}
        ${row('Total beban mobil bulanan', rp(r.V), 'cost-total')}
        <div class="sim-status">Pratinjau status: ${badge(r.status)}</div>`;
    };

    sel.addEventListener('change', () => { car = carById(sel.value); drawCar(); preview(); });
    form.addEventListener('input', preview);
    form.addEventListener('change', preview);
    drawCar(); preview();

    form.addEventListener('submit', e => {
      e.preventDefault();
      const errs = check();
      const eb = $('#analysisErrors');
      if (errs.length) { eb.hidden = false;
        eb.innerHTML = '<strong>Periksa kembali:</strong><ul>' + errs.map(x => `<li>${esc(x)}</li>`).join('') + '</ul>';
        eb.scrollIntoView({ block: 'center',
        behavior: 'smooth' });
        return;
        }
      eb.hidden = true;
      const { p: pp, o } = read();
      if (o.method === 'cash') { o.dp = 0; o.tenor = 0; }
      const r = calculate(car, pp, o);
      const entry = saveHistory(user, car, pp, o, r);
      if (!entry) { toast('Analisis gagal disimpan. Ruang penyimpanan browser mungkin penuh.', 'err'); return; }
      if ($('#saveToProfile').checked) saveProfile(user.id,
        { ...(getProfile(user.id) || { dependents: 0 }),
        ...pp,
        ...o,
        dp: o.method === 'cash' ? (getProfile(user.id)?.dp ?? 0) : o.dp,
        tenor: o.method === 'cash' ? (getProfile(user.id)?.tenor ?? 48) : o.tenor });
      toast('Analisis selesai dan tersimpan di riwayat.');
      location.href = 'result.html?id=' + encodeURIComponent(entry.id);
    });
    if (location.hash === '#simulasi') setTimeout(() => $('#simulasi').scrollIntoView({ behavior: 'smooth' }), 200);
  }

  function resultHTML(h) {
    const c = h.car, r = h.result, o = h.options, p = h.profile, k = cls(r.status), credit = o.method === 'credit';
    const row = (n, v, x = '') => `<div class="result-cost-row ${x}"><span>${n}</span><strong>${v}</strong></div>`;
    const chk = (ok,
      t,
      a) => `<div class="result-cost-row"><span><span class="check-icon ${ok ? 'check-success' : 'check-fail'}">${ok ? '✓' : '✕'}</span> ${t}</span><strong>${a}</strong></div>`;
    const eu = c.energy === 'Listrik' ? 'km/kWh' : 'km/L', un = c.energy === 'Listrik' ? 'kWh' : 'liter';
    const avail = p.income - p.expenses - p.installments;
    return `
      <div class="result-status ${k === 'success' ? 'ok' : k === 'danger' ? 'bad' : ''}">
        <div class="result-status-icon">${ICON[k]}</div>
        <div><h2>${label(r.status)}</h2><ul class="result-reasons">${r.reasons.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      </div>
      <div class="result-vehicle">
        <div class="result-vehicle-image">${carImg(c)}</div>
        <div class="result-vehicle-content">
          <span class="result-vehicle-brand">${esc(c.brand)}</span><h3>${esc(c.name)}</h3>
          <p class="result-vehicle-year">${c.year} • ${esc(c.cond)} • ${esc(c.energy)}</p>
          <strong class="result-vehicle-price">${rp(c.price)}</strong>
          <p class="result-meta">Metode: <b>${credit ? 'Kredit' : 'Tunai'}</b> • Tujuan: <b>${esc(PURPOSE[o.purpose] || o.purpose)}</b> • Jarak: <b>${o.distance.toLocaleString('id-ID')} km/bulan</b></p>
        </div>
      </div>
      <div class="result-block"><h2>Data Keuangan Saat Analisis</h2>
        <div class="result-finance-grid">
          <div class="result-finance-card"><div class="result-finance-label">Penghasilan</div><div class="result-finance-value">${rp(p.income)}</div></div>
          <div class="result-finance-card"><div class="result-finance-label">Pengeluaran Rutin</div><div class="result-finance-value">${rp(p.expenses)}</div></div>
          <div class="result-finance-card"><div class="result-finance-label">Cicilan Aktif</div><div class="result-finance-value">${rp(p.installments)}</div></div>
          <div class="result-finance-card"><div class="result-finance-label">Tabungan</div><div class="result-finance-value">${rp(p.savings)}</div></div>
          <div class="result-finance-card highlight"><div class="result-finance-label">Pendapatan Tersedia (sebelum mobil)</div><div class="result-finance-value">${rp(avail)}</div></div>
        </div>
      </div>
      <div class="result-block"><h2>Kebutuhan Dana Awal</h2>
        ${credit ? row('Uang muka (DP)', rp(r.dp)) : row('Harga mobil (tunai)', rp(c.price))}
        ${row('Biaya awal lain (administrasi, balik nama, dll.)', rp(c.initial))}
        ${row('Total kebutuhan dana awal', rp(r.upfront), 'cost-total')}
        ${chk(r.fundsOk, 'Tabungan vs kebutuhan dana awal', `${rp(p.savings)} / ${rp(r.upfront)}`)}
        <small>Sisa tabungan setelah dana awal: ${rp(r.savingsAfter)}.</small>
      </div>
      ${credit ? `<div class="result-block"><h2>Simulasi Kredit</h2>
        ${row('Harga mobil', rp(c.price))}${row('DP', rp(r.dp))}${row('Pokok kredit', rp(r.principal))}
        ${row(`Total bunga (${rp(r.principal)} × 8% × ${o.tenor}/12)`, rp(r.interest))}
        ${row(`Estimasi cicilan (${o.tenor} bulan)`, rp(r.M), 'cost-total')}
        <small>Bunga sederhana 8% per tahun. Simulasi matematis, bukan penawaran lembaga pembiayaan.</small></div>` : ''}
      <div class="result-block"><h2>Biaya Kepemilikan dan Beban Bulanan</h2>
        ${credit ? row('Cicilan kredit', rp(r.M)) : ''}
        ${row(`Biaya energi (${o.distance.toLocaleString('id-ID')} km ÷ ${c.kmpl} ${eu} × ${rp(c.energyPrice)}/${un})`, rp(r.E))}
        ${row(`Pajak (${rp(c.tax)} ÷ 12)`, rp(r.T))}
        ${row(`Servis berkala (${rp(c.service)} ÷ 12)`, rp(r.S))}
        ${row(`Dana perbaikan (${rp(c.reserve)} ÷ 12)`, rp(r.R))}
        ${row('Biaya kepemilikan bulanan', rp(r.C))}
        ${row('Total beban mobil bulanan', rp(r.V), 'cost-total')}
      </div>
      <div class="result-block"><h2>Persentase Beban dan Sisa Penghasilan</h2>
        <div class="result-limit-row"><span>Beban mobil terhadap penghasilan</span><strong>${pct(r.B)}</strong></div>
        <div class="result-ratio-bar"><div class="result-ratio-progress ${r.loadOk ? '' : 'over'}" style="width:${Math.min(100, Math.max(0, r.B))}%"></div></div>
        <div class="result-limit-row"><span>Batas (${o.purpose === 'hobi' ? 'kendaraan hobi' : 'kendaraan utama'})</span><strong>${r.limitPct * 100}% = ${rp(r.L)}</strong></div>
        <div class="result-limit-row"><span>Total kewajiban (cicilan aktif ${rp(p.installments)} + mobil ${rp(r.V)}) = ${rp(r.totalDue)}</span><strong class="${r.totalOk ? '' : 'txt-bad'}">${pct(r.D)} (batas ${r.limitPct * 100}%)</strong></div>
        <div class="result-finance-grid"><div class="result-finance-card ${r.cashOk ? 'highlight' : 'bad'}"><div class="result-finance-label">Sisa penghasilan = penghasilan − pengeluaran − cicilan aktif − beban mobil</div><div class="result-finance-value">${rp(r.left)}</div></div></div>
        <small>Persentase beban adalah rasio kewajiban terhadap penghasilan, sedangkan sisa penghasilan adalah uang yang tersisa setelah semua pengeluaran. Keduanya dua indikator berbeda.</small>
      </div>
      <div class="result-block"><h2>Aturan Status</h2>
        ${chk(r.fundsOk, 'Dana awal tercukupi', r.fundsOk ? 'Ya' : 'Tidak')}
        ${chk(r.cashOk, 'Sisa penghasilan tidak negatif', r.cashOk ? 'Ya' : 'Tidak')}
        ${chk(r.loadOk, `Beban mobil ≤ ${r.limitPct * 100}% penghasilan`, r.loadOk ? 'Ya' : 'Tidak')}
        ${chk(r.totalOk, `Total kewajiban ≤ ${r.limitPct * 100}% penghasilan`, r.totalOk ? 'Ya' : 'Tidak')}
        <small>Prioritas: dana awal atau sisa penghasilan tidak terpenuhi → BELUM SESUAI; selain itu, salah satu batas beban terlewati → PERLU PERTIMBANGAN; semua terpenuhi → SESUAI. Hasil ini bukan jaminan persetujuan kredit.</small>
      </div>`;
  }

  function initResult(user) {
    const root = $('#resultRoot');
    if (!root) return;
    const h = getHistory().find(x => x.id === param('id'));
    if (!h || (h.user.id !== user.id && !isAdmin(user))) {
      root.innerHTML = '<div class="empty-state"><h2>Hasil analisis tidak ditemukan</h2><p>Riwayat ini tidak tersedia untuk akun Anda.</p><a class="btn btn-primary" href="history.html">Ke Riwayat</a></div>';
      return;
    }
    $('#resultMeta').textContent = `ID ${h.id} • ${fmtDate(h.date)} • ${h.user.name}`;
    root.innerHTML = resultHTML(h);
    const live = carById(h.car.id);
    const again = $('#againBtn');
    if (live && live.active && !isAdmin(user)) again.href = 'analysis.html?car=' + encodeURIComponent(h.car.id);
    else { again.classList.add('disabled'); again.removeAttribute('href'); again.title = 'Mobil ini sudah tidak aktif'; }
    if (isAdmin(user)) { again.hidden = true; $('#recoBtn').hidden = true; }
  }

  function initHistory(user) {
    const box = $('#historyList');
    if (!box) return;
    const draw = () => {
      const list = userHistory(user);
      $('#clearHistory').hidden = !list.length;
      box.innerHTML = list.length ? list.map(h => `
        <article class="history-item">
          <div class="history-top"><div><p>${fmtDate(h.date)} • ${h.options.method === 'credit' ? `Kredit (DP ${rp(h.result.dp)},
            ${h.options.tenor} bln)` : 'Tunai'}</p><h3>${esc(h.car.brand)} ${esc(h.car.name)} ${h.car.year}</h3></div>${badge(h.result.status)}</div>
          <div class="history-figures"><div><span>Beban bulanan</span><strong>${rp(h.result.V)}</strong></div><div><span>Beban terhadap penghasilan</span><strong>${pct(h.result.B)}</strong></div><div><span>Dana awal</span><strong>${rp(h.result.upfront)}</strong></div><div><span>Sisa penghasilan</span><strong>${rp(h.result.left)}</strong></div></div>
          <div class="history-actions"><a class="btn btn-primary" href="result.html?id=${encodeURIComponent(h.id)}">Lihat Detail</a><button type="button" class="btn btn-danger" data-del="${esc(h.id)}">Hapus</button></div>
        </article>`).join('') : '<div class="empty-state"><h2>Belum ada riwayat analisis</h2><p>Hasil analisis Anda akan tersimpan di sini sebagai snapshot.</p><a class="btn btn-primary" href="analysis.html">Mulai Analisis</a></div>';
    };
    box.addEventListener('click', async e => {
      const b = e.target.closest('[data-del]');
      if (!b || !await confirmBox('Hapus riwayat analisis ini?', 'Hapus')) return;
      store.set(K.history, getHistory().filter(h => !(h.id === b.dataset.del && h.user.id === user.id)));
      toast('Riwayat dihapus.'); draw();
    });
    $('#clearHistory').addEventListener('click', async () => {
      if (!await confirmBox('Hapus semua riwayat analisis milik Anda? Riwayat pengguna lain tidak terpengaruh.', 'Hapus semua')) return;
      store.set(K.history, getHistory().filter(h => h.user.id !== user.id));
      toast('Seluruh riwayat Anda dihapus.'); draw();
    });
    draw();
  }

  const miniCard = ({ car, r }, top) => `
    <article class="reco-card ${top ? 'reco-top' : ''}">
      <div class="reco-img">${carImg(car)}</div>
      <div class="reco-body">
        <div class="reco-head"><div><span class="car-brand">${esc(car.brand)}</span><h3>${esc(car.name)}</h3><p>${car.year} • ${esc(car.cond)} • ${esc(car.energy)} • ${rp(car.price)}</p></div>${badge(r.status)}</div>
        <div class="history-figures"><div><span>Dana awal</span><strong>${rp(r.upfront)}</strong></div><div><span>Beban bulanan</span><strong>${rp(r.V)}</strong></div><div><span>% beban mobil</span><strong>${pct(r.B)}</strong></div><div><span>Sisa penghasilan</span><strong>${rp(r.left)}</strong></div></div>
        <p class="reco-reason">${esc(r.reasons.join(' '))}</p>
        <div class="history-actions"><a class="btn btn-secondary" href="detail.html?car=${encodeURIComponent(car.id)}">Lihat Detail</a><a class="btn btn-primary" href="analysis.html?car=${encodeURIComponent(car.id)}">Analisis Mobil Ini</a></div>
      </div>
    </article>`;

  function initRecs(user) {
    const root = $('#recoList');
    if (!root) return;
    const p = getProfile(user.id);
    if (!p || !(p.income > 0)) { root.innerHTML = '<div class="empty-state"><h2>Profil finansial belum diisi</h2><p>Rekomendasi dihitung dari penghasilan, pengeluaran, cicilan, dan tabungan Anda.</p><a class="btn btn-primary" href="profile.html">Isi Profil Finansial</a></div>';
      return;
      }
    const all = evaluateAll(p);
    if (!all.length) { root.innerHTML = '<div class="empty-state"><h2>Belum ada mobil aktif</h2><p>Katalog kosong. Admin perlu menambahkan atau mengaktifkan mobil.</p></div>';
      return;
      }
    $('#recoBasis').innerHTML = `Dasar penilaian: penghasilan ${rp(p.income)}, tabungan ${rp(p.savings)}, ${p.method === 'credit' ? `kredit DP ${rp(p.dp)} tenor ${p.tenor} bulan` : 'pembelian tunai'}, ${p.distance.toLocaleString('id-ID')} km/bulan, tujuan ${esc(PURPOSE[p.purpose] || p.purpose)}. <a href="profile.html" class="text-link">Ubah profil</a>`;
    const filter = $('#recoFilter'), chosen = new Set();
    const draw = () => {
      const list = all.filter(x => !filter.value || x.r.status === filter.value);
      root.innerHTML = list.length ? list.map((x,
        i) => `<div class="reco-wrap"><label class="reco-check"><input type="checkbox" data-cmp="${esc(x.car.id)}" ${chosen.has(x.car.id) ? 'checked' : ''}> Bandingkan</label>${miniCard(x, i === 0 && !filter.value && x.r.status === 'SESUAI')}</div>`).join('') : '<div class="empty-state"><p>Tidak ada mobil dengan status tersebut.</p></div>';
    };
    const cmp = () => {
      const box = $('#compareBox'), sel = all.filter(x => chosen.has(x.car.id));
      $('#compareBtn').disabled = sel.length < 2;
      if (sel.length < 2) { box.hidden = true; return; }
      const rows = [['Harga',
        x => rp(x.car.price)],
        ['Tahun / kondisi',
        x => `${x.car.year} • ${x.car.cond}`],
        ['Dana awal',
        x => rp(x.r.upfront)],
        ['Cicilan',
        x => rp(x.r.M)],
        ['Biaya kepemilikan / bln',
        x => rp(x.r.C)],
        ['Total beban mobil / bln',
        x => rp(x.r.V)],
        ['% beban mobil',
        x => pct(x.r.B)],
        ['Sisa penghasilan',
        x => rp(x.r.left)],
        ['Status',
        x => badge(x.r.status)]];
      box.hidden = false;
      box.innerHTML = `<h2>Perbandingan Mobil</h2><div class="table-wrap"><table class="admin-table"><thead><tr><th></th>${sel.map(x => `<th>${esc(x.car.brand)} ${esc(x.car.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([n, f]) => `<tr><td><b>${n}</b></td>${sel.map(x => `<td>${f(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    root.addEventListener('change', e => {
      const c = e.target.closest('[data-cmp]'); if (!c) return;
      if (c.checked) { if (chosen.size >= 3) { c.checked = false;
        toast('Maksimal 3 mobil untuk dibandingkan.',
        'err');
        return;
        } chosen.add(c.dataset.cmp);
        } else chosen.delete(c.dataset.cmp);
      $('#compareBtn').disabled = chosen.size < 2;
      $('#compareBox').hidden = chosen.size < 2 ? true : $('#compareBox').hidden;
    });
    $('#compareBtn').addEventListener('click', cmp);
    filter.addEventListener('change', draw);
    draw();
  }

  function initDashboard(user) {
    const fin = $('#dashFinance');
    if (!fin) return;
    $('#dashHello').textContent = `Halo, ${user.name.split(' ')[0]}`;
    $('#dashProfile').innerHTML = `<div class="dash-profile"><div class="user-avatar large">${esc(user.name.charAt(0).toUpperCase())}</div><div><strong>${esc(user.name)}</strong><p>${esc(user.email)} • ${esc(user.phone || '-')}</p></div><a class="btn btn-secondary" href="profile.html">Profil</a></div>`;
    const p = getProfile(user.id), ok = p && p.income > 0;
    if (ok) {
      const av = p.income - p.expenses - p.installments;
      fin.innerHTML = [['Penghasilan Bersih',
        p.income,
        'per bulan'],
        ['Pengeluaran Rutin',
        p.expenses,
        'per bulan'],
        ['Cicilan Berjalan',
        p.installments,
        'per bulan'],
        ['Pendapatan Tersedia',
        av,
        'setelah pengeluaran dan cicilan'],
        ['Tabungan',
        p.savings,
        'dana tersedia']].map(([a,
        b,
        c],
        i) => `<div class="finance-card ${i === 3 ? 'finance-highlight' : ''}"><span class="finance-label">${a}</span><strong>${rp(b)}</strong><small>${c}</small></div>`).join('');
      $('#dashNote').textContent = 'Data berasal dari profil finansial akun Anda.';
    } else {
      fin.innerHTML = '<div class="empty-state wide"><h3>Profil finansial belum diisi</h3><p>Isi penghasilan, pengeluaran, cicilan, dan tabungan untuk mendapatkan rekomendasi.</p><a class="btn btn-primary" href="profile.html">Isi Profil Finansial</a></div>';
      $('#dashNote').textContent = '';
    }
    const reco = $('#dashReco'), alts = $('#dashAlts');
    if (!ok) { reco.innerHTML = '<p class="muted">Rekomendasi muncul setelah profil finansial diisi.</p>'; alts.innerHTML = ''; }
    else {
      const all = evaluateAll(p);
      if (!all.length) reco.innerHTML = '<p class="muted">Belum ada mobil aktif di katalog.</p>';
      else {
        reco.innerHTML = (all[0].r.status === 'SESUAI' ? '' : '<p class="muted">Belum ada mobil berstatus Sesuai; berikut yang paling mendekati.</p>') + miniCard(all[0], true);
        alts.innerHTML = all.slice(1, 4).map(x => miniCard(x, false)).join('');
      }
    }
    const hs = userHistory(user);
    $('#dashHistoryCount').textContent = hs.length;
    $('#dashHistory').innerHTML = hs.length ? hs.slice(0,
      3).map(h => `<div class="alt-item"><div><strong>${esc(h.car.brand)} ${esc(h.car.name)}</strong><br><small>${fmtDate(h.date)} • beban ${rp(h.result.V)}/bln (${pct(h.result.B)})</small></div>${badge(h.result.status)}<a class="text-link" href="result.html?id=${encodeURIComponent(h.id)}">Detail →</a></div>`).join('') : '<p class="muted">Belum ada analisis. Mulai dari katalog atau halaman analisis.</p>';
  }

  function initAdmin(user) {
    const tbody = $('#carTable');
    if (!tbody) return;
    $$('.tab-btn').forEach(b => b.addEventListener('click', () => {
      $$('.tab-btn').forEach(x => x.classList.toggle('active', x === b));
      $$('.tab-panel').forEach(p => { p.hidden = p.id !== 'tab-' + b.dataset.tab; });
    }));
    const dialog = $('#carDialog'), form = $('#carForm');
    let editingId = null, img = '';
    const unitLabel = () => { const l = form.energy.value === 'Listrik';
      $('#kmplLabel').textContent = `Konsumsi (${l ? 'km/kWh' : 'km/L'})`;
      $('#energyPriceLabel').textContent = `Harga Energi (Rp per ${l ? 'kWh' : 'liter'})`;
      };
    form.energy.addEventListener('change', unitLabel);

    $('#carImage').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      if (!f.type.startsWith('image/')) { toast('Pilih file gambar yang valid.', 'err'); e.target.value = ''; return; }
      if (f.size > 5 * 1024 * 1024) { toast('Ukuran foto maksimal 5 MB.', 'err'); e.target.value = ''; return; }
      const rd = new FileReader();
      rd.onload = () => {
        const im = new Image();
        im.onload = () => {
          const s = Math.min(1, 640 / im.width), cv = document.createElement('canvas');
          cv.width = im.width * s; cv.height = im.height * s;
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
          img = cv.toDataURL('image/jpeg', 0.75);
          $('#carImagePreview').src = img; $('#carImagePreview').hidden = false;
        };
        im.onerror = () => toast('Gambar tidak dapat dibaca.', 'err');
        im.src = rd.result;
      };
      rd.readAsDataURL(f);
    });

    const drawCars = () => {
      const q = ($('#carSearch').value || '').toLowerCase();
      const list = CARS.filter(c => `${c.brand} ${c.name} ${c.year}`.toLowerCase().includes(q));
      tbody.innerHTML = list.map(c => `<tr class="${c.active ? '' : 'row-off'}">
        <td>${esc(c.brand)} ${esc(c.name)}<br><small>${c.year} • ${esc(c.cond)} • ${esc(c.energy)}</small></td>
        <td>${rp(c.price)}</td><td>${c.kmpl} ${effUnit(c)}</td><td>${rp(c.energyPrice)}</td><td>${rp(c.tax)}</td><td>${rp(c.service)}</td><td>${rp(c.reserve)}</td><td>${rp(c.initial)}</td>
        <td><span class="status ${c.active ? 'status-success' : 'status-danger'}">${c.active ? 'Aktif' : 'Nonaktif'}</span></td>
        <td class="admin-actions"><button type="button" class="btn btn-secondary" data-edit="${esc(c.id)}">Edit</button><button type="button" class="btn btn-danger" data-toggle="${esc(c.id)}">${c.active ? 'Nonaktifkan' : 'Aktifkan'}</button></td></tr>`).join('') || '<tr><td colspan="10" class="admin-empty">Tidak ada data mobil.</td></tr>';
    };

    const drawUsers = () => {
      const users = loadUsers(), hist = getHistory();
      $('#userTable').innerHTML = users.map(u => `<tr class="${u.status === 'aktif' ? '' : 'row-off'}"><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.phone || '-')}</td><td>${u.role === 'admin' ? 'Admin' : 'Pengguna'}</td><td>${new Date(u.createdAt).toLocaleDateString('id-ID')}</td><td>${hist.filter(h => h.user.id === u.id).length}</td><td><span class="status ${u.status === 'aktif' ? 'status-success' : 'status-danger'}">${u.status === 'aktif' ? 'Aktif' : 'Nonaktif'}</span></td><td>${u.role === 'admin' ? '<small>Tidak dapat diubah</small>' : `<button type="button" class="btn btn-secondary" data-ustatus="${esc(u.id)}">${u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>`}</td></tr>`).join('');
    };

    const drawStats = () => {
      const users = loadUsers().filter(u => u.role !== 'admin'), hist = getHistory();
      $('#statUsers').textContent = users.length;
      $('#statUsersActive').textContent = `${users.filter(u => u.status === 'aktif').length} akun aktif`;
      $('#statCars').textContent = activeCars().length;
      $('#statCarsTotal').textContent = `dari ${CARS.length} data mobil`;
      $('#statHistory').textContent = hist.length;
      const avg = activeCars().length ? activeCars().reduce((s, c) => s + c.price, 0) / activeCars().length : 0;
      $('#statAvg').textContent = rp(avg);
      $('#historyTable').innerHTML = hist.slice().sort((a,
        b) => new Date(b.date) - new Date(a.date)).slice(0,
        30).map(h => `<tr><td>${fmtDate(h.date)}</td><td>${esc(h.user.name)}<br><small>${esc(h.user.email)}</small></td><td>${esc(h.car.brand)} ${esc(h.car.name)}</td><td>${h.options.method === 'credit' ? 'Kredit' : 'Tunai'}</td><td>${rp(h.result.V)}</td><td>${badge(h.result.status)}</td></tr>`).join('') || '<tr><td colspan="6" class="admin-empty">Belum ada aktivitas analisis.</td></tr>';
    };
    const refresh = () => { drawCars(); drawUsers(); drawStats(); };

    function openForm(c) {
      editingId = c ? c.id : null; img = c?.image || '';
      $('#carImage').value = ''; $('#carImagePreview').src = img; $('#carImagePreview').hidden = !img;
      $('#dialogTitle').textContent = c ? 'Edit Mobil' : 'Tambah Mobil';
      const d = c || { brand: '',
        name: '',
        year: new Date().getFullYear(),
        cond: 'Bekas',
        energy: 'Bensin',
        transmission: 'Manual',
        seats: 5,
        price: '',
        kmpl: '',
        energyPrice: 10000,
        tax: '',
        service: '',
        reserve: '',
        initial: 3e6 };
      Object.keys(d).forEach(k => { if (form.elements[k] && form.elements[k].type !== 'file') form.elements[k].value = d[k] ?? ''; });
      $('#carFormError').textContent = ''; unitLabel(); dialog.showModal();
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const n = k => (form.elements[k].value === '' ? NaN : Number(form.elements[k].value));
      const car = { brand: form.brand.value.trim(),
        name: form.name.value.trim(),
        year: n('year'),
        cond: form.cond.value,
        energy: form.energy.value,
        transmission: form.transmission.value,
        seats: n('seats'),
        price: n('price'),
        kmpl: n('kmpl'),
        energyPrice: n('energyPrice'),
        tax: n('tax'),
        service: n('service'),
        reserve: n('reserve'),
        initial: n('initial'),
        image: img };
      const err = $('#carFormError');
      const bad = !car.brand ? 'Merek wajib diisi.' : !car.name ? 'Model wajib diisi.' : !(car.year >= 1990 && car.year <= 2100) ? 'Tahun harus antara 1990 dan 2100.' : !(car.price > 0) ? 'Harga harus lebih dari 0.' : !(car.kmpl > 0) ? 'Konsumsi harus lebih dari 0.' : [car.energyPrice,
        car.tax,
        car.service,
        car.reserve,
        car.initial].some(v => !Number.isFinite(v) || v < 0) ? 'Biaya tidak boleh kosong atau negatif.' : !(car.seats >= 0) ? 'Kapasitas tidak valid.' : '';
      if (bad) { err.textContent = bad; return; }
      if (!await confirmBox(editingId ? 'Simpan perubahan data mobil ini? Riwayat lama tidak berubah.' : 'Tambahkan mobil ini ke katalog?', 'Simpan')) return;
      if (editingId) {
        const i = CARS.findIndex(c => c.id === editingId);
        CARS[i] = normCar({ ...CARS[i], ...car, id: editingId });
      } else {
        const base = `${car.brand}-${car.name}-${car.year}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        let id = base, k = 2; while (CARS.some(c => c.id === id)) id = `${base}-${k++}`;
        CARS.push(normCar({ ...car, id, active: true }));
      }
      if (!saveCars()) { err.textContent = 'Gagal menyimpan. Ruang penyimpanan browser mungkin penuh (coba foto lebih kecil).'; loadCarsInto(); return; }
      dialog.close(); toast('Data mobil disimpan.'); refresh();
    });
    const loadCarsInto = () => { CARS = loadCars(); };

    tbody.addEventListener('click', async e => {
      const ed = e.target.closest('[data-edit]'), tg = e.target.closest('[data-toggle]');
      if (ed) openForm(carById(ed.dataset.edit));
      if (tg) {
        const c = carById(tg.dataset.toggle);
        const msg = c.active ? `Nonaktifkan ${c.brand} ${c.name}? Mobil tidak muncul lagi di katalog dan analisis baru, tetapi riwayat lama tetap tersimpan.` : `Aktifkan kembali ${c.brand} ${c.name}?`;
        if (await confirmBox(msg,
          c.active ? 'Nonaktifkan' : 'Aktifkan')) { c.active = !c.active;
          saveCars();
          toast(c.active ? 'Mobil diaktifkan.' : 'Mobil dinonaktifkan.');
          refresh();
          }
      }
    });
    $('#userTable').addEventListener('click', async e => {
      const b = e.target.closest('[data-ustatus]'); if (!b) return;
      const users = loadUsers(), u = users.find(x => x.id === b.dataset.ustatus);
      if (!u || u.role === 'admin') return;
      const off = u.status === 'aktif';
      if (!await confirmBox(off ? `Nonaktifkan akun ${u.name}? Pengguna tidak dapat masuk sampai diaktifkan lagi.` : `Aktifkan kembali akun ${u.name}?`,
        off ? 'Nonaktifkan' : 'Aktifkan')) return;
      u.status = off ? 'nonaktif' : 'aktif'; saveUsers(users); toast('Status akun diperbarui.'); refresh();
    });
    $('#addCar').addEventListener('click', () => openForm());
    $('#cancelDialog').addEventListener('click', () => dialog.close());
    $('#carSearch').addEventListener('input', drawCars);
    $('#resetCars').addEventListener('click', async () => {
      if (!await confirmBox('Kembalikan data mobil ke data awal? Perubahan mobil Anda akan hilang. Riwayat analisis tidak terpengaruh.', 'Reset data')) return;
      CARS = SEED_CARS.map(normCar); saveCars(); toast('Data mobil dikembalikan.'); refresh();
    });
    refresh();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const user = currentUser();
    if (store.get(K.session, null) && !user) localStorage.removeItem(K.session); 
    if (!guard(user)) return;
    renderChrome(user);
    initCatalog(); initDetail(); initAuth();
    if (user) { initProfile(user); initAnalysis(user); initResult(user); initHistory(user); initRecs(user); initDashboard(user); initAdmin(user); }
  });

  window.CarFit = { calculate, evaluateAll, CFG }; 
})();