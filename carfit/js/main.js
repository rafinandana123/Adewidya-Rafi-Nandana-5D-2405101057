(() => {
  'use strict';

  /* ================= Helper ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const rp = n => 'Rp' + Math.round(Number(n) || 0).toLocaleString('id-ID');
  const pct = n =>
    (Number(n) || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%';

  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));

  const KEYS = {
    users: 'carfit_users',
    user: 'carfit_user',
    cars: 'carfit_cars',
    profile: 'carfit_profile',
    history: 'carfit_history',
    brands: 'carfit_brands'
  };

  const store = {
    get(k, d) {
      try {
        return JSON.parse(localStorage.getItem(k)) ?? d;
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
        return true;
      } catch {
        return false;
      }
    }
  };

  /* ================= Aturan CarFit ================= */
  const CFG = {
    rate: 0.08,
    tenor: { min: 12, max: 84, step: 12 },
    limits: { kerja: 0.30, keluarga: 0.25, hobi: 0.10 }
  };

  const PURPOSE = {
    kerja: 'Kerja',
    keluarga: 'Keluarga',
    hobi: 'Hobi'
  };

  const normPurpose = v => (v in CFG.limits ? v : 'kerja');
  const purposeLabel = v =>
    PURPOSE[v] || (v === 'usaha' ? 'Usaha (data lama)' : '-');

  const DEMO_ADMIN = {
    name: 'Admin',
    email: 'admin@carfit.com',
    password: 'admin123',
    role: 'admin'
  };

  /* ================= Data mobil ================= */
  const DEFAULT_CARS = [
    { id: 'avanza-2020', brand: 'Toyota', name: 'Avanza 1.3 G M/T', year: 2020, cond: 'Bekas', energy: 'Bensin', price: 150e6, kmpl: 15, energyPrice: 10000, tax: 2.5e6, service: 1.5e6, reserve: 0.8e6, initial: 3e6 },
    { id: 'brio-2021', brand: 'Honda', name: 'Brio Satya 1.2', year: 2021, cond: 'Bekas', energy: 'Bensin', price: 135e6, kmpl: 18, energyPrice: 10000, tax: 2.2e6, service: 1.3e6, reserve: 0.7e6, initial: 3e6 },
    { id: 'ertiga-2020', brand: 'Suzuki', name: 'Ertiga 1.5 GX', year: 2020, cond: 'Bekas', energy: 'Bensin', price: 145e6, kmpl: 16, energyPrice: 10000, tax: 2.8e6, service: 1.6e6, reserve: 0.8e6, initial: 3e6 },
    { id: 'xenia-2019', brand: 'Daihatsu', name: 'Xenia 1.3 R', year: 2019, cond: 'Bekas', energy: 'Bensin', price: 125e6, kmpl: 15, energyPrice: 10000, tax: 2.2e6, service: 1.4e6, reserve: 0.8e6, initial: 3e6 }
  ];

  /* ---- Merek ---- */
  const BASE_BRANDS = [
    'Audi', 'BMW', 'Chery', 'Daihatsu', 'Honda', 'Hyundai', 'Isuzu', 'Kia',
    'Lexus', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Suzuki',
    'Toyota', 'Volkswagen', 'Wuling'
  ];

  const cleanBrand = v => String(v ?? '').trim().replace(/\s+/g, ' ');
  const sameBrand = (a, b) => cleanBrand(a).toLowerCase() === cleanBrand(b).toLowerCase();

  const prettyBrand = v => {
    const t = cleanBrand(v);
    const plain = t === t.toLowerCase() || (t === t.toUpperCase() && t.length > 3);

    return plain
      ? t.toLowerCase().replace(/(^|[\s-])(\S)/g, (m, a, b) => a + b.toUpperCase())
      : t;
  };

  const isBaseBrand = b => BASE_BRANDS.some(x => sameBrand(x, b));

  const getCustomBrands = () => {
    const list = store.get(KEYS.brands, []);
    return Array.isArray(list) ? list.map(cleanBrand).filter(Boolean) : [];
  };

  const loadCars = () => {
    const saved = store.get(KEYS.cars, null);
    const list = Array.isArray(saved)
      ? saved
      : DEFAULT_CARS.map(c => ({ ...c }));

    const known = new Map();
    [...BASE_BRANDS, ...getCustomBrands()].forEach(b => known.set(b.toLowerCase(), b));

    return list.map(c => {
      const raw = cleanBrand(c.brand);
      const key = raw.toLowerCase();

      if (!known.has(key)) known.set(key, raw);

      return { energy: 'Bensin', ...c, brand: known.get(key) };
    });
  };

  let CARS = loadCars();

  const carById = id => CARS.find(c => c.id === id) || null;
  const saveCars = () => store.set(KEYS.cars, CARS);

  const unitOf = car => car.energy === 'Listrik' ? 'kWh' : 'liter';
  const kmUnit = car => car.energy === 'Listrik' ? 'km/kWh' : 'km/L';

  const brandList = () => {
    const seen = new Map();

    CARS.forEach(c => {
      const key = cleanBrand(c.brand).toLowerCase();
      if (!seen.has(key)) seen.set(key, cleanBrand(c.brand));
    });

    return [...seen.values()].sort((a, b) => a.localeCompare(b, 'id'));
  };

  const allBrands = () => {
    const seen = new Map();

    [...BASE_BRANDS, ...getCustomBrands(), ...brandList()].forEach(b => {
      const key = b.toLowerCase();
      if (!seen.has(key)) seen.set(key, b);
    });

    return [...seen.values()].sort((a, b) => a.localeCompare(b, 'id'));
  };

  const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'webp'];
  const SILHOUETTE =
    '<svg class="car-silhouette" viewBox="0 0 400 160" aria-hidden="true"><use href="#car"/></svg>';

  const photoPath = (car, ext = PHOTO_EXT[0]) => `assets/images/${car.id}.${ext}`;

  window.carfitNoPhoto = img => {
    const next = Number(img.dataset.n || 0) + 1;

    if (img.dataset.id && next < PHOTO_EXT.length) {
      img.dataset.n = next;
      img.src = `assets/images/${img.dataset.id}.${PHOTO_EXT[next]}`;
      return;
    }

    if (img.dataset.soft) img.remove();
    else img.outerHTML = SILHOUETTE;
  };

  const carImage = (car, alt = true) => {
    const label = alt ? esc(car.brand + ' ' + car.name) : '';

    return car.image
      ? `<img src="${esc(car.image)}" alt="${label}" loading="lazy">`
      : `<img src="${esc(photoPath(car))}" data-id="${esc(car.id)}" alt="${label}" loading="lazy" onerror="carfitNoPhoto(this)">`;
  };

  /* ================= Profil & sesi ================= */
  const DEFAULT_PROFILE = {
    income: 8e6,
    expenses: 3e6,
    installments: 0.5e6,
    savings: 40e6,
    distance: 1000,
    purpose: 'kerja',
    method: 'credit',
    dp: 30e6,
    tenor: 48
  };

  const getProfile = () => ({
    ...DEFAULT_PROFILE,
    ...store.get(KEYS.profile, {})
  });

  const hasProfile = () => !!store.get(KEYS.profile, null);

  const getUser = () => store.get(KEYS.user, null);
  const getUsers = () => store.get(KEYS.users, []);

  const homeFor = user =>
    user.role === 'admin'
      ? 'admin.html'
      : hasProfile() ? 'dashboard.html' : 'profile.html';

  /* ================= Mesin perhitungan ================= */
  function calculate(car, p, o) {
    const G = Number(p.income) || 0;
    const O = Number(p.expenses) || 0;
    const A = Number(p.installments) || 0;
    const distance = Math.max(Number(o.distance) || 0, 0);

    const E = car.kmpl > 0 ? (distance / car.kmpl) * car.energyPrice : 0;
    const T = car.tax / 12;
    const S = car.service / 12;
    const R = car.reserve / 12;
    const C = E + T + S + R;

    let M = 0;
    let principal = 0;
    let interest = 0;
    let upfront;

    if (o.method === 'credit') {
      const tenor = Number(o.tenor) > 0 ? Number(o.tenor) : 48;
      const dp = Math.min(Math.max(Number(o.dp) || 0, 0), car.price);

      principal = car.price - dp;
      interest = principal * CFG.rate * (tenor / 12);
      M = (principal + interest) / tenor;
      upfront = dp + car.initial;
    } else {
      upfront = car.price + car.initial;
    }

    const V = C + M;
    const limitPct = CFG.limits[normPurpose(o.purpose)];
    const L = limitPct * G;
    const B = G > 0 ? (V / G) * 100 : 100;
    const left = G - O - A - V;

    const fundsOk = (Number(p.savings) || 0) >= upfront;
    const loadOk = G > 0 && V <= L + 1e-6;
    const cashOk = left >= 0;

    const reasons = [];

    if (!fundsOk) {
      reasons.push(
        `Dana awal kurang ${rp(upfront - p.savings)} ` +
        `(butuh ${rp(upfront)}, tersedia ${rp(p.savings)}).`
      );
    }

    if (!cashOk) {
      reasons.push(
        `Pengeluaran dan kewajiban bulanan melebihi penghasilan sebesar ${rp(-left)}.`
      );
    }

    if (!loadOk) {
      reasons.push(
        `Beban kendaraan ${pct(B)} dari penghasilan bersih, ` +
        `melampaui batas ${Math.round(limitPct * 100)}% (${rp(L)}).`
      );
    }

    const status = (!fundsOk || !cashOk)
      ? 'BELUM SESUAI'
      : (!loadOk ? 'PERLU PERTIMBANGAN' : 'SESUAI');

    if (!reasons.length) {
      reasons.push(
        `Dana awal mencukupi, rasio beban kendaraan ${pct(B)} memenuhi batas ` +
        `${Math.round(limitPct * 100)}%, dan sisa uang bulanan ${rp(left)}.`
      );
    }

    return {
      car, E, T, S, R, C, M, principal, interest, upfront,
      V, L, limitPct, B, left, fundsOk, loadOk, cashOk, status, reasons
    };
  }

  const cls = s =>
    s === 'SESUAI' ? 'success' : s === 'PERLU PERTIMBANGAN' ? 'warning' : 'danger';

  const label = s =>
    s === 'SESUAI' ? 'Sesuai' : s === 'PERLU PERTIMBANGAN' ? 'Perlu Pertimbangan' : 'Belum Sesuai';

  const badge = s => `<span class="status status-${cls(s)}">${label(s)}</span>`;

  const optionsFromProfile = p => ({
    method: p.method || 'credit',
    dp: Number(p.dp) || 0,
    tenor: Number(p.tenor) || 48,
    distance: Number(p.distance) || 0,
    purpose: normPurpose(p.purpose)
  });

  const STATUS_ORDER = { 'SESUAI': 0, 'PERLU PERTIMBANGAN': 1, 'BELUM SESUAI': 2 };

  const rankCars = (p, o = optionsFromProfile(p)) =>
    CARS
      .map(car => calculate(car, p, o))
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.V - b.V);

  function gaugeHTML(B, limitPct, size = '') {
    const SCALE = 60;
    const frac = Math.min(1, Math.max(0, B / SCALE));
    const over = B > limitPct * 100 + 1e-6;
    const a = Math.PI * (1 - Math.min(1, (limitPct * 100) / SCALE));
    const pt = r => `${(100 + r * Math.cos(a)).toFixed(1)}`;
    const py = r => `${(100 - r * Math.sin(a)).toFixed(1)}`;
    const arc = 'M20 100 A80 80 0 0 1 180 100';

    return `
      <div class="gauge ${size} ${over ? 'over' : ''}" role="img"
           aria-label="Beban ${pct(B)}, batas ${Math.round(limitPct * 100)}%">
        <div class="g-dial">
          <svg viewBox="0 0 200 112" aria-hidden="true">
            <path class="g-track" d="${arc}" pathLength="100"/>
            <path class="g-fill" d="${arc}" pathLength="100" style="--v:${(frac * 100).toFixed(1)}"/>
            <line class="g-limit-outline" x1="${pt(66)}" y1="${py(66)}" x2="${pt(94)}" y2="${py(94)}"/>
            <line class="g-limit" x1="${pt(66)}" y1="${py(66)}" x2="${pt(94)}" y2="${py(94)}"/>
          </svg>
          <div class="g-read">
            <strong data-count="${B.toFixed(1)}" data-decimals="1" data-suffix="%">${pct(B)}</strong>
            <span>beban kendaraan</span>
          </div>
        </div>
        <div class="g-scale"><span>0%</span><span>batas ${Math.round(limitPct * 100)}%</span><span>60%+</span></div>
      </div>
    `;
  }

  function barHTML(B, limitPct) {
    const SCALE = 60;
    const w = Math.min(100, Math.max(0, (B / SCALE) * 100));
    const m = Math.min(100, ((limitPct * 100) / SCALE) * 100);

    return `
      <div class="bar" data-reveal role="img"
           aria-label="Beban ${pct(B)}, batas ${Math.round(limitPct * 100)}%">
        <div class="bar-fill ${B > limitPct * 100 + 1e-6 ? 'over' : ''}" style="--w:${w.toFixed(1)}%"></div>
        <span class="bar-limit" style="left:${m.toFixed(1)}%"></span>
      </div>`;
  }

  function toast(message) {
    let region = $('.toast-region');

    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.append(region);
    }

    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    region.append(el);

    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    }, 2600);
  }

  /* ================= Efek visual ================= */
  const SPRITE = `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <symbol id="car" viewBox="0 0 400 160">
        <g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">
          <path vector-effect="non-scaling-stroke" d="M16 124V108c0-10 8-15 22-18l50-12c12-12 30-24 54-29 24-5 54-6 84-5 26 1 44 8 60 20l32 22 42 7c16 3 26 10 26 21v10h-44a36 36 0 0 0-72 0H132a36 36 0 0 0-72 0z"/>
          <path vector-effect="non-scaling-stroke" d="M98 78c10-12 24-20 42-24l56-2v26zM208 52l44 1c12 3 22 9 32 17l12 8H208zM204 52v60"/>
          <circle vector-effect="non-scaling-stroke" cx="96" cy="124" r="27"/>
          <circle vector-effect="non-scaling-stroke" cx="96" cy="124" r="13"/>
          <circle vector-effect="non-scaling-stroke" cx="306" cy="124" r="27"/>
          <circle vector-effect="non-scaling-stroke" cx="306" cy="124" r="13"/>
          <path vector-effect="non-scaling-stroke" d="M372 100l14 3M20 110h14"/>
        </g>
      </symbol>
    </svg>`;

  const fx = (() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let io = null;

    const fmt = (el, v) => {
      const d = Number(el.dataset.decimals) || 0;
      const text = el.dataset.format === 'rp'
        ? rp(v)
        : v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });

      return text + (el.dataset.suffix || '');
    };

    const countUp = el => {
      const to = Number(el.dataset.count) || 0;

      if (reduce) { el.textContent = fmt(el, to); return; }

      const t0 = performance.now();
      const tick = now => {
        const k = Math.min(1, (now - t0) / 1000);
        el.textContent = fmt(el, to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const show = el => {
      if (el.hasAttribute('data-reveal')) el.classList.add('seen');
      if (el.classList.contains('gauge')) el.classList.add('in');
      if (el.hasAttribute('data-count')) countUp(el);
    };

    const scan = (root = document) => {
      $$('[data-reveal], .gauge, [data-count]', root).forEach(el => {
        if (el.dataset.fx) return;
        el.dataset.fx = '1';
        if (io) io.observe(el); else show(el);
      });
    };

    const parallax = () => {
      const layers = $$('[data-depth]');
      if (reduce || !layers.length) return;

      let queued = false;

      addEventListener('scroll', () => {
        if (queued || innerWidth < 900) return;
        queued = true;

        requestAnimationFrame(() => {
          layers.forEach(l => {
            l.style.transform = `translate3d(0, ${(scrollY * Number(l.dataset.depth)).toFixed(1)}px, 0)`;
          });
          queued = false;
        });
      }, { passive: true });
    };

    const init = () => {
      document.body.insertAdjacentHTML('afterbegin', SPRITE);

      if (!reduce && 'IntersectionObserver' in window) {
        document.documentElement.classList.add('fx');

        io = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (!e.isIntersecting) return;
            show(e.target);
            io.unobserve(e.target);
          });
        }, { threshold: 0.15 });
      }

      parallax();

      const nav = $('.navbar');
      const onScroll = () => nav && nav.classList.toggle('scrolled', scrollY > 8);
      addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      document.addEventListener('click', e => {
        const a = e.target.closest('a[href]');
        if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (a.target && a.target !== '_self') return;

        const href = a.getAttribute('href');
        if (!/^[\w-]+\.html([?#].*)?$/.test(href)) return;

        e.preventDefault();
        document.body.classList.add('leaving');
        setTimeout(() => { location.href = a.href; }, 180);
      });

      addEventListener('pageshow', () => document.body.classList.remove('leaving'));
    };

    return { init, scan };
  })();

  /* ================= Navbar & sesi ================= */
  function guard() {
    const need = document.body.dataset.access;
    if (!need) return true;

    const user = getUser();

    if (!user) {
      location.replace('auth.html');
      return false;
    }

    if (need === 'admin' && user.role !== 'admin') {
      location.replace('dashboard.html');
      return false;
    }

    return true;
  }

  function initNav() {
    const header = $('.navbar');
    const menu = $('.nav-menu');
    const action = $('#navAction');
    const user = getUser();

    if (!header || !menu || !action) return;

    if (user) {
      menu.insertAdjacentHTML(
        'beforeend',
        user.role === 'admin'
          ? '<a href="admin.html">Panel Admin</a>'
          : '<a href="dashboard.html">Dashboard</a>'
      );
    }

    const page = location.pathname.split('/').pop() || 'index.html';

    $$('a', menu).forEach(a => {
      const href = a.getAttribute('href');
      if (href === page) a.classList.add('active');
    });

    if (!user) {
      action.innerHTML = '<a href="auth.html" class="btn btn-primary">Masuk</a>';
    } else {
      const name = esc(user.name || 'Pengguna');
      const initial = esc((user.name || 'P').charAt(0).toUpperCase());
      const roleText = user.role === 'admin' ? 'Administrator' : 'Pengguna';

      const links = user.role === 'admin'
        ? '<a href="admin.html">Kelola Data Mobil</a><a href="catalog.html">Lihat Katalog</a>'
        : '<a href="dashboard.html">Dashboard</a><a href="profile.html">Profil Finansial</a>';

      action.innerHTML = `
        <div class="user-menu">
          <button type="button" class="user-menu-button" id="userMenuButton"
                  aria-expanded="false" aria-controls="userDropdown">
            <span class="user-avatar">${initial}</span>
            <span class="user-info">
              <span class="user-name">${name}</span>
              <span class="user-role">${roleText}</span>
            </span>
          </button>
          <div class="user-dropdown" id="userDropdown">
            <div class="user-dropdown-header">
              <strong>${name}</strong>
              <span>${esc(user.email || '')}</span>
            </div>
            ${links}
            <a href="auth.html" id="logoutLink" class="logout-link">Keluar</a>
          </div>
        </div>
      `;

      const btn = $('#userMenuButton');
      const dd = $('#userDropdown');

      const close = () => {
        dd.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      };

      btn.addEventListener('click', e => {
        e.stopPropagation();
        const open = dd.classList.toggle('open');
        btn.setAttribute('aria-expanded', open);
      });

      document.addEventListener('click', e => {
        if (!dd.contains(e.target)) close();
      });

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') close();
      });

      $('#logoutLink').addEventListener('click', () => {
        try { localStorage.removeItem(KEYS.user); } catch {}
      });
    }

    const toggle = $('#navToggle');

    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = header.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open);
      });
    }
  }

  /* ================= Beranda ================= */
  function initHome() {
    const fan = $('#heroFan');
    if (!fan) return;

    const list = CARS.slice(0, 4);
    const mid = (list.length - 1) / 2;

    fan.innerHTML = list.map((c, i) => {
      const k = i - mid;

      return `
        <a class="fan-card" href="detail.html?car=${encodeURIComponent(c.id)}"
           style="--a:${(k * 7).toFixed(1)}deg;--x:${(k * 96).toFixed(0)}px;--y:${(Math.abs(k) * 18).toFixed(0)}px;--z:${10 - Math.round(Math.abs(k) * 2)}">
          <span class="fan-img">
            <svg viewBox="0 0 400 160" aria-hidden="true"><use href="#car"/></svg>
            ${c.image
              ? `<img src="${esc(c.image)}" alt="${esc(c.brand + ' ' + c.name)}">`
              : `<img src="${esc(photoPath(c))}" data-id="${esc(c.id)}" data-soft="1" alt="${esc(c.brand + ' ' + c.name)}" onerror="carfitNoPhoto(this)">`}
          </span>
          <span class="fan-cap">
            <small>${esc(c.brand)} • ${c.year}</small>
            <strong>${esc(c.name)}</strong>
            <em>${rp(c.price)}</em>
          </span>
        </a>`;
    }).join('');

    setTimeout(() => fan.classList.add('open'), 120);

    const car = carById('avanza-2020') || CARS[0];
    if (!car) return;

    const r = calculate(car, DEFAULT_PROFILE, optionsFromProfile(DEFAULT_PROFILE));

    $('#heroMeter').innerHTML =
      gaugeHTML(r.B, r.limitPct, 'gauge-sm') +
      `<small>Contoh ${esc(car.brand)} ${esc(car.name)}: penghasilan Rp8 juta, kredit 48 bulan, 1.000 km/bulan, tujuan kerja.</small>`;

    $('#heroChip').innerHTML =
      `Cicilan ${DEFAULT_PROFILE.tenor} bulan<strong>${rp(r.M)}</strong>`;
  }

  /* ================= Katalog ================= */
  function initCatalog() {
    const grid = $('#catalogGrid');
    if (!grid) return;

    const f = {
      brand: $('#brand'),
      cond: $('#condition'),
      price: $('#price'),
      sort: $('#sortCars')
    };

    f.brand.innerHTML =
      '<option value="">Semua Merek</option>' +
      brandList().map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join('');

    const card = (c, i) => `
      <article class="car-card" data-reveal style="--d:${Math.min(i, 5) * 60}ms">
        <a class="car-image" href="detail.html?car=${encodeURIComponent(c.id)}"
          aria-label="Lihat detail ${esc(c.brand)} ${esc(c.name)}">
          ${carImage(c)}
          <span class="car-year">${c.year}</span>
        </a>
        <div class="car-card-content">
          <span class="car-brand">${esc(c.brand)}</span>
          <h3>${esc(c.name)}</h3>
          <p class="car-meta">${c.year} • ${esc(c.cond)} • ${esc(c.energy)}</p>
          <div class="car-price">${rp(c.price)}</div>
          <div class="car-info">
            <span>Konsumsi</span>
            <strong>${c.kmpl} ${kmUnit(c)}</strong>
          </div>
          <a href="detail.html?car=${encodeURIComponent(c.id)}"
            class="btn btn-secondary car-button">Lihat Detail</a>
        </div>
      </article>
    `;

    const apply = () => {
      const maxPrice = Number(f.price.value) || Infinity;

      const list = CARS.filter(c =>
        (!f.brand.value || sameBrand(c.brand, f.brand.value)) &&
        (!f.cond.value || c.cond === f.cond.value) &&
        c.price <= maxPrice
      );

      const sorters = {
        'price-asc': (a, b) => a.price - b.price,
        'price-desc': (a, b) => b.price - a.price,
        'year-desc': (a, b) => b.year - a.year
      };

      if (sorters[f.sort.value]) list.sort(sorters[f.sort.value]);

      grid.innerHTML = list.map(card).join('');
      $('#catalogCount').textContent = `${list.length} kendaraan tersedia untuk dianalisis.`;
      $('#emptyCatalog').hidden = list.length > 0;

      const n = list.length;
      const cards = $$('.car-card', grid);
      const last = cards[cards.length - 1];

      if (last && n > 1) {
        const rest = (n - 2) % 3;
        if (n >= 3 && rest === 1) last.classList.add('fill-3');
        if (n >= 3 && rest === 2) last.classList.add('fill-2');
        if ((n - 1) % 2 === 1) last.classList.add('fill-t');
      }

      if (n === 1) cards[0].classList.add('fill-3');
      fx.scan(grid);
    };

    $('#applyFilters').addEventListener('click', apply);
    Object.values(f).forEach(el => el.addEventListener('change', apply));

    $('#resetFilters').addEventListener('click', () => {
      Object.values(f).forEach(el => { el.value = ''; });
      apply();
    });

    apply();
  }

  /* ================= Detail ================= */
  function initDetail() {
    const info = $('.detail-info');
    if (!info || !$('.specification-grid')) return;

    const car = carById(new URLSearchParams(location.search).get('car'));

    if (!car) {
      location.replace('catalog.html');
      return;
    }

    document.title = `${car.brand} ${car.name} | CarFit`;

    $('#breadcrumbCar').textContent = car.name;
    $('#detailImage').innerHTML = carImage(car);
    $('.detail-brand').textContent = car.brand;
    $('h1', info).textContent = car.name;
    $('.detail-meta').textContent = `${car.year} • ${car.cond} • ${car.energy}`;
    $('.detail-price').textContent = rp(car.price);

    $('.detail-description').textContent =
      `${car.brand} ${car.name} ${car.year} dianalisis berdasarkan harga, biaya operasional, dan kondisi finansial Anda.`;

    $$('a[href^="analysis.html"]').forEach(a => {
      a.href = `analysis.html?car=${encodeURIComponent(car.id)}`;
    });

    const spec = [
      ['Harga mobil', rp(car.price)],
      ['Tahun', car.year],
      ['Kondisi', car.cond],
      ['Jenis energi', car.energy],
      ['Konsumsi energi', `${car.kmpl} ${kmUnit(car)}`],
      ['Harga energi', `${rp(car.energyPrice)} / ${unitOf(car)}`],
      ['Pajak tahunan', rp(car.tax)],
      ['Servis tahunan', rp(car.service)],
      ['Cadangan perbaikan / tahun', rp(car.reserve)],
      ['Biaya awal lain', rp(car.initial)]
    ];

    $('.specification-grid').innerHTML = spec
      .map(([k, v]) => `
        <div class="specification-card">
          <span>${k}</span>
          <strong>${esc(v)}</strong>
        </div>
      `).join('');
  }

  /* ================= Profil finansial ================= */
  function initProfile() {
    const form = $('#profileForm');
    if (!form) return;

    const p = getProfile();

    form.income.value = hasProfile() ? p.income : '';
    form.expenses.value = hasProfile() ? p.expenses : '';
    form.installments.value = p.installments ?? 0;
    form.savings.value = hasProfile() ? p.savings : '';
    form.dependents.value = p.dependents ?? 0;
    form.distance.value = p.distance ?? 1000;
    form.down_payment.value = p.dp ?? 0;
    form.tenor.value = p.tenor ?? 48;

    const check = (name, value) => {
      const input = $(`input[name="${name}"][value="${value}"]`, form);
      if (input) input.checked = true;
    };

    check('purpose', normPurpose(p.purpose));
    check('purchase_method', p.method || 'credit');

    const creditOptions = $('#creditOptions');

    const toggleCredit = () => {
      const isCredit =
        $('input[name="purchase_method"]:checked', form)?.value === 'credit';

      creditOptions.hidden = !isCredit;
      form.down_payment.disabled = !isCredit;
      form.tenor.disabled = !isCredit;
      form.down_payment.required = isCredit;
      form.tenor.required = isCredit;
    };

    $$('input[name="purchase_method"]', form)
      .forEach(i => i.addEventListener('change', toggleCredit));

    toggleCredit();

    form.addEventListener('submit', e => {
      e.preventDefault();

      const data = {
        income: Number(form.income.value),
        expenses: Number(form.expenses.value),
        installments: Number(form.installments.value) || 0,
        savings: Number(form.savings.value),
        dependents: Number(form.dependents.value) || 0,
        distance: Number(form.distance.value) || 0,
        purpose: $('input[name="purpose"]:checked', form)?.value || 'kerja',
        method: $('input[name="purchase_method"]:checked', form)?.value || 'cash',
        dp: Number(form.down_payment.value) || 0,
        tenor: Number(form.tenor.value) || 48
      };

      if (
        !(data.income > 0) || data.expenses < 0 || data.installments < 0 ||
        data.savings < 0 || data.dependents < 0 || data.distance < 0
      ) {
        alert('Periksa kembali data finansial yang Anda masukkan.');
        return;
      }

      if (
        data.method === 'credit' &&
        (data.tenor < CFG.tenor.min || data.tenor > CFG.tenor.max ||
          data.tenor % CFG.tenor.step !== 0)
      ) {
        alert('Tenor harus kelipatan 12 bulan, antara 12–84 bulan.');
        return;
      }

      if (!store.set(KEYS.profile, data)) {
        alert('Profil gagal disimpan. Periksa pengaturan penyimpanan browser.');
        return;
      }

      toast('Profil finansial tersimpan');
      setTimeout(() => { location.href = 'dashboard.html'; }, 800);
    });
  }

  /* ================= Dashboard ================= */
  function historyItemHTML(item, index) {
    const car = item.car || {};
    const r = item.result || {};
    const o = item.options || {};

    const date = new Date(item.date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    return `
      <article class="history-item">
        <div class="history-main">
          <p class="history-date">${date}</p>
          <h3>${esc(car.brand)} ${esc(car.name)} ${esc(car.year)}</h3>
          <p>${o.method === 'credit' ? 'Kredit' : 'Tunai'} • ${esc(purposeLabel(o.purpose))}
            • Beban ${rp(r.V)} / bulan (${pct(r.B)})</p>
        </div>
        ${badge(r.status)}
        <div class="history-actions">
          <a href="result.html?i=${index}" class="btn btn-secondary">Lihat Hasil</a>
          <a href="analysis.html?car=${encodeURIComponent(car.id || '')}"
            class="btn btn-secondary">Analisis Ulang</a>
        </div>
      </article>
    `;
  }

  function initDashboard() {
    const sum = $('.finance-summary');
    if (!sum) return;

    const p = getProfile();
    const profileSaved = hasProfile();

    const avail = p.income - p.expenses - p.installments;
    const vals = profileSaved
      ? [p.income, p.expenses, p.installments, avail]
      : [0, 0, 0, 0];

    $$('.finance-card strong', sum).forEach((el, i) => {
      el.textContent = rp(vals[i]);
      el.dataset.count = vals[i];
      el.dataset.format = 'rp';
    });

    const note = $('.dashboard-note');
    const recoSections = $$('[data-needs-profile]');

    if (profileSaved) {
      note.textContent = 'Data di atas berasal dari profil finansial yang Anda simpan.';
    } else {
      note.innerHTML =
        'Profil finansial belum diisi. <a class="text-link" href="profile.html">Isi profil</a> ' +
        'untuk melihat rekomendasi mobil.';
      recoSections.forEach(s => { s.hidden = true; });
    }

    if (profileSaved && CARS.length) {
      const ranked = rankCars(p);
      const r = ranked[0];
      const id = encodeURIComponent(r.car.id);

      $('#mainRecommendation').innerHTML = `
        <div class="recommendation-image">
          ${carImage(r.car)}
          ${gaugeHTML(r.B, r.limitPct, 'gauge-xs')}
        </div>
        <div class="recommendation-content">
          <div class="recommendation-top">
            <div>
              <span class="car-brand">${esc(r.car.brand)}</span>
              <h3>${esc(r.car.name)}</h3>
              <p>${r.car.year} • ${esc(r.car.cond)}</p>
            </div>
            ${badge(r.status)}
          </div>

          <dl class="recommendation-figures">
            <div><dt>Harga mobil</dt><dd>${rp(r.car.price)}</dd></div>
            <div><dt>Total beban kendaraan</dt><dd>${rp(r.V)} <small>/ bulan</small></dd></div>
            <div><dt>Pendapatan tersedia</dt><dd>${rp(avail)} <small>/ bulan</small></dd></div>
            <div><dt>Rasio beban</dt><dd>${pct(r.B)}</dd></div>
          </dl>

          <p class="recommendation-reason">${r.reasons.map(esc).join(' ')}</p>

          <div class="recommendation-actions">
            <a href="detail.html?car=${id}" class="btn btn-primary">Lihat Detail Mobil</a>
            <a href="analysis.html?car=${id}" class="btn btn-secondary">Analisis Lebih Lanjut</a>
          </div>
        </div>
      `;

      const alts = ranked.slice(1, 4);

      $('#alternativeRecommendations').innerHTML = alts.length
        ? alts.map(a => `
            <article class="recommendation-mini" data-reveal>
              <div class="mini-image">${carImage(a.car)}</div>
              <div class="mini-content">
                <div class="mini-header">
                  <span class="car-brand">${esc(a.car.brand)}</span>
                  <h3>${esc(a.car.name)}</h3>
                  <p>${a.car.year} • ${esc(a.car.cond)}</p>
                </div>
                <div class="mini-info">
                  <div><span>Harga</span><strong>${rp(a.car.price)}</strong></div>
                  <div><span>Beban / bulan</span><strong>${rp(a.V)} (${pct(a.B)})</strong></div>
                  ${barHTML(a.B, a.limitPct)}
                </div>
                <div class="mini-side">
                  ${badge(a.status)}
                  <a class="text-link" href="detail.html?car=${encodeURIComponent(a.car.id)}">Lihat detail</a>
                </div>
              </div>
            </article>
          `).join('')
        : '<p class="empty-note">Belum ada mobil alternatif.</p>';
    } else if (profileSaved) {
      $('#mainRecommendation').innerHTML =
        '<p class="empty-note">Belum ada data mobil. Hubungi admin untuk menambahkan data.</p>';
      $('#alternativeRecommendations').innerHTML = '';
    }

    const historyBox = $('#analysisHistory');

    const renderHistory = () => {
      const history = store.get(KEYS.history, []);

      historyBox.innerHTML = history.length
        ? `<div class="history-list">${history.map(historyItemHTML).join('')}</div>`
        : '<p class="empty-note">Belum ada riwayat analisis.</p>';
    };

    renderHistory();
    fx.scan();

    $('#clearHistory').addEventListener('click', () => {
      if (!store.get(KEYS.history, []).length) {
        alert('Riwayat analisis masih kosong.');
        return;
      }

      if (confirm('Yakin ingin menghapus semua riwayat analisis?')) {
        store.set(KEYS.history, []);
        renderHistory();
        toast('Riwayat analisis dihapus');
      }
    });
  }

  /* ================= Analisis ================= */
  function initAnalysis() {
    const form = $('#analysisForm');
    if (!form) return;

    if (!CARS.length) {
      location.replace('catalog.html');
      return;
    }

    const p = getProfile();
    const saved = hasProfile();

    let car = carById(new URLSearchParams(location.search).get('car')) || CARS[0];

    const renderCar = () => {
      $('.selected-car-card').innerHTML = `
        <div class="selected-car-image">${carImage(car)}</div>
        <div class="selected-car-content">
          <label for="carSelect">Pilih mobil</label>
          <select id="carSelect">
            ${CARS.map(c => `
              <option value="${esc(c.id)}" ${c.id === car.id ? 'selected' : ''}>
                ${esc(c.brand)} ${esc(c.name)} (${c.year})
              </option>`).join('')}
          </select>

          <span class="car-brand">${esc(car.brand)}</span>
          <h2>${esc(car.name)}</h2>
          <p class="selected-car-year">${car.year} • ${esc(car.cond)}</p>
          <strong class="selected-car-price">${rp(car.price)}</strong>

          <div class="selected-car-spec">
            <div><span>Konsumsi energi</span><strong>${car.kmpl} ${kmUnit(car)}</strong></div>
            <div><span>Pajak tahunan</span><strong>${rp(car.tax)}</strong></div>
            <div><span>Servis tahunan</span><strong>${rp(car.service)}</strong></div>
          </div>
        </div>
      `;

      $('#carSelect').addEventListener('change', e => {
        car = carById(e.target.value);
        renderCar();
        out.hidden = true;
      });
    };

    const out = document.createElement('section');
    out.id = 'analysisResult';
    out.className = 'container result-wrap';
    out.hidden = true;
    $('.analysis-section').after(out);

    renderCar();

    $('#analysisIncome').textContent = rp(p.income) + ' / bulan';
    $('#analysisExpenses').textContent = rp(p.expenses) + ' / bulan';
    $('#analysisInstallments').textContent = rp(p.installments) + ' / bulan';
    $('#analysisAvailable').textContent =
      rp(p.income - p.expenses - p.installments) + ' / bulan';

    if (!saved) $('#profileWarning').hidden = false;

    form.dp.value = p.dp || 30e6;
    form.tenor.value = p.tenor || 48;
    form.monthly_distance.value = p.distance ?? 1000;
    form.purpose.value = normPurpose(p.purpose);

    $$('input[name="method"]').forEach(r => { r.checked = r.value === p.method; });

    const toggle = () => {
      const isCredit =
        $('input[name="method"]:checked', form)?.value === 'credit';

      $('#creditFields').hidden = !isCredit;
      form.dp.disabled = !isCredit;
      form.tenor.disabled = !isCredit;
      form.dp.required = isCredit;
      form.tenor.required = isCredit;
    };

    $$('input[name="method"]', form).forEach(r => r.addEventListener('change', toggle));
    toggle();

    form.addEventListener('submit', e => {
      e.preventDefault();

      const o = {
        method: $('input[name="method"]:checked', form)?.value || 'credit',
        dp: Number(form.dp.value) || 0,
        tenor: Number(form.tenor.value) || 48,
        distance: Number(form.monthly_distance.value) || 0,
        purpose: form.purpose.value
      };

      if (!saved) {
        alert('Isi dan simpan Profil Finansial terlebih dahulu.');
        location.href = 'profile.html';
        return;
      }

      if (!(p.income > 0)) {
        alert('Penghasilan bersih harus lebih dari 0.');
        location.href = 'profile.html';
        return;
      }

      if (
        o.method === 'credit' &&
        (o.tenor < CFG.tenor.min || o.tenor > CFG.tenor.max ||
          o.tenor % CFG.tenor.step !== 0)
      ) {
        alert('Tenor harus kelipatan 12 bulan (12–84).');
        return;
      }

      if (o.method === 'credit' && (o.dp < 0 || o.dp > car.price)) {
        alert('DP tidak boleh kurang dari 0 atau melebihi harga mobil.');
        return;
      }

      if (!(o.distance > 0)) {
        alert('Jarak tempuh per bulan harus lebih dari 0 km.');
        return;
      }

      const r = calculate(car, p, o);
      const alts = CARS.filter(c => c.id !== car.id).map(c => calculate(c, p, o));

      renderResult(out, r, alts, o, p);
      $$('.stepper li').forEach(li => { li.classList.remove('active'); li.classList.add('done'); });
      saveHistory(r, o, p);

      out.hidden = false;
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast('Analisis selesai dan disimpan ke riwayat');
    });
  }

  /* ================= Tampilan hasil ================= */
  function renderResult(el, r, alts, o, p) {
    const k = cls(r.status);
    const row = (n, v, c = '') =>
      `<div class="cost-row ${c}"><span>${n}</span><strong>${v}</strong></div>`;

    el.innerHTML = `
      <div class="result-status is-${k}">
        <div>
          <h2>${label(r.status)}</h2>
          <p class="result-car">${esc(r.car.brand)} ${esc(r.car.name)} ${r.car.year}</p>
          <ul class="result-reasons">${r.reasons.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
        <div class="gauge-box">${gaugeHTML(r.B, r.limitPct)}</div>
      </div>

      <div class="result-grid">
        <section class="result-block">
          <h2>Dana awal</h2>
          ${row('Tabungan tersedia', rp(p.savings))}
          ${row('Dana awal dibutuhkan', rp(r.upfront), r.fundsOk ? '' : 'is-bad')}
          <small>${o.method === 'credit'
            ? 'Kredit: DP + biaya awal lain.'
            : 'Tunai: harga mobil + biaya awal lain.'}</small>
        </section>

        <section class="result-block">
          <h2>Biaya mobil per bulan</h2>
          ${o.method === 'credit'
            ? row(`Cicilan (${o.tenor} bulan, bunga ${CFG.rate * 100}%/tahun)`, rp(r.M))
            : ''}
          ${row('Biaya energi', rp(r.E))}
          ${row('Pajak bulanan', rp(r.T))}
          ${row('Servis dan perawatan', rp(r.S))}
          ${row('Dana cadangan perbaikan', rp(r.R))}
          ${row('Total beban kendaraan', rp(r.V), 'cost-total')}
          ${o.method === 'credit'
            ? `<small>Pokok ${rp(r.principal)} + bunga ${rp(r.interest)}. Simulasi, bukan penawaran leasing.</small>`
            : ''}
        </section>
      </div>

      <section class="result-block">
        <h2>Rasio beban kendaraan</h2>
        <div class="limit-row">
          <span>Rasio beban kendaraan</span><strong>${pct(r.B)}</strong>
        </div>
        <div class="limit-row">
          <span>Batas tujuan ${esc(purposeLabel(o.purpose))}</span>
          <strong>${Math.round(r.limitPct * 100)}% = ${rp(r.L)}</strong>
        </div>
        <div class="limit-row">
          <span>Penilaian</span>
          <strong class="${r.loadOk ? 'is-good' : 'is-bad'}">${r.loadOk ? 'Memenuhi batas' : 'Melampaui batas'}</strong>
        </div>
        <small>Rasio = (total beban kendaraan bulanan ÷ penghasilan bersih) × 100%.
        Batas ${Math.round(r.limitPct * 100)}% adalah parameter kebijakan internal CarFit,
        bukan standar OJK/BI dan bukan DSR.</small>
      </section>

      <section class="result-block">
        <h2>Sisa uang bulanan</h2>
        ${row('Penghasilan − pengeluaran − cicilan aktif − beban kendaraan',
              rp(r.left), r.cashOk ? 'is-good' : 'is-bad')}
      </section>

      ${alts.length ? `
        <section class="result-block">
          <h2>Mobil alternatif (aturan yang sama)</h2>
          <div class="alt-list">
            ${alts.map(a => `
              <div class="alt-item">
                <div>
                  <strong>${esc(a.car.brand)} ${esc(a.car.name)}</strong>
                  <small>${rp(a.car.price)} • Beban ${rp(a.V)}/bulan (${pct(a.B)})</small>
                </div>
                ${badge(a.status)}
                <a class="text-link" href="detail.html?car=${encodeURIComponent(a.car.id)}">Detail</a>
              </div>`).join('')}
          </div>
        </section>` : ''}
    `;

    $$('.result-block', el).forEach((b, i) => {
      b.dataset.reveal = '';
      b.style.setProperty('--d', `${i * 70}ms`);
    });

    fx.scan(el);
  }

  function saveHistory(r, o, p) {
    const { image, ...carSnapshot } = r.car;

    const entry = {
      date: new Date().toISOString(),
      car: carSnapshot,
      profile: { ...p },
      options: { ...o },
      result: {
        status: r.status, E: r.E, T: r.T, S: r.S, R: r.R, C: r.C, M: r.M,
        principal: r.principal, interest: r.interest, upfront: r.upfront,
        V: r.V, L: r.L, limitPct: r.limitPct, B: r.B, left: r.left,
        fundsOk: r.fundsOk, loadOk: r.loadOk, cashOk: r.cashOk,
        reasons: [...r.reasons]
      }
    };

    const same = item =>
      item?.car?.id === entry.car.id &&
      JSON.stringify(item?.profile ?? {}) === JSON.stringify(entry.profile) &&
      JSON.stringify(item?.options ?? {}) === JSON.stringify(entry.options);

    const history = store.get(KEYS.history, []).filter(item => !same(item));
    history.unshift(entry);

    store.set(KEYS.history, history.slice(0, 20));
  }

  /* ================= Halaman hasil (dari riwayat) ================= */
  function initResult() {
    const box = $('#resultView');
    if (!box) return;

    const index = Number(new URLSearchParams(location.search).get('i'));
    const item = store.get(KEYS.history, [])[index];

    if (!item) {
      box.innerHTML = `
        <div class="empty-state">
          <h2>Hasil tidak ditemukan</h2>
          <p>Riwayat analisis ini sudah dihapus atau belum pernah dibuat.</p>
          <a href="analysis.html" class="btn btn-primary">Mulai analisis baru</a>
        </div>`;
      return;
    }

    const r = { ...item.result, car: item.car };
    const alts = CARS
      .filter(c => c.id !== item.car.id)
      .map(c => calculate(c, item.profile, item.options));

    renderResult(box, r, alts, item.options, item.profile);

    box.insertAdjacentHTML('beforeend', `
      <p class="history-note">
        Dianalisis pada ${new Date(item.date).toLocaleString('id-ID')}.
        Mobil alternatif dihitung dari data mobil terbaru.
      </p>
      <div class="result-actions">
        <a href="analysis.html?car=${encodeURIComponent(item.car.id)}" class="btn btn-primary">Analisis ulang</a>
        <a href="dashboard.html" class="btn btn-secondary">Kembali ke dashboard</a>
      </div>
    `);
  }

  /* ================= Login & daftar ================= */
  function initAuth() {
    const loginForm = $('#loginForm');
    const registerForm = $('#registerForm');
    if (!loginForm || !registerForm) return;

    const current = getUser();
    if (current && current.email) {
      location.replace(homeFor(current));
      return;
    }

    const title = $('#authTitle');
    const subtitle = $('#authSubtitle');

    const show = isLogin => {
      loginForm.hidden = !isLogin;
      registerForm.hidden = isLogin;
      title.textContent = isLogin ? 'Masuk ke akun' : 'Buat akun CarFit';
      subtitle.textContent = isLogin
        ? 'Masukkan email dan kata sandi untuk melanjutkan.'
        : 'Daftar untuk menyimpan profil dan riwayat analisis.';
      $('#loginMessage').textContent = '';
      $('#registerMessage').textContent = '';
    };

    $('#showRegister').addEventListener('click', () => show(false));
    $('#showLogin').addEventListener('click', () => show(true));

    registerForm.addEventListener('submit', e => {
      e.preventDefault();

      const name = $('#registerName').value.trim();
      const email = $('#registerEmail').value.trim().toLowerCase();
      const password = $('#registerPassword').value;
      const msg = $('#registerMessage');

      if (password !== $('#confirmPassword').value) {
        msg.textContent = 'Konfirmasi kata sandi tidak sama.';
        return;
      }

      const users = getUsers();

      if (email === DEMO_ADMIN.email || users.some(u => u.email === email)) {
        msg.textContent = 'Email sudah terdaftar. Silakan masuk.';
        return;
      }

      users.push({ name, email, password });

      if (!store.set(KEYS.users, users)) {
        msg.textContent = 'Akun gagal disimpan. Periksa pengaturan browser.';
        return;
      }

      msg.textContent = 'Pendaftaran berhasil. Silakan masuk.';
      registerForm.reset();

      setTimeout(() => {
        show(true);
        $('#loginEmail').value = email;
      }, 700);
    });

    loginForm.addEventListener('submit', e => {
      e.preventDefault();

      const email = $('#loginEmail').value.trim().toLowerCase();
      const password = $('#loginPassword').value;
      const msg = $('#loginMessage');

      let account = null;

      if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
        account = DEMO_ADMIN;
      } else {
        const found = getUsers().find(u => u.email === email && u.password === password);
        if (found) account = { name: found.name, email: found.email, role: 'user' };
      }

      if (!account) {
        msg.textContent = 'Email atau kata sandi tidak sesuai.';
        return;
      }

      const session = { name: account.name, email: account.email, role: account.role };

      if (!store.set(KEYS.user, session)) {
        msg.textContent = 'Gagal menyimpan sesi. Periksa pengaturan browser.';
        return;
      }

      location.href = homeFor(session);
    });
  }

  /* ================= Admin ================= */
  function resizeImage(file, max = 800) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();

        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');

          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);

          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };

        img.src = reader.result;
      };

      reader.readAsDataURL(file);
    });
  }

  function initAdmin() {
    const container = $('#carGroups');
    if (!container) return;

    const dialog = $('#carDialog');
    const form = $('#carForm');
    const imageInput = $('#carImage');
    const preview = $('#carImagePreview');
    const brandSelect = $('#brand');
    const brandOther = $('#brandOther');
    const brandOtherWrap = $('#brandOtherWrap');

    let editingId = null;
    let selectedImage = '';

    const persist = () => {
      if (saveCars()) return true;
      alert('Data gagal disimpan. Penyimpanan browser penuh atau diblokir; coba perkecil foto.');
      return false;
    };

    imageInput.addEventListener('change', async () => {
      const file = imageInput.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        alert('Pilih file gambar yang valid.');
        imageInput.value = '';
        return;
      }

      try {
        selectedImage = await resizeImage(file);
        preview.src = selectedImage;
        preview.hidden = false;
      } catch {
        alert('Foto tidak dapat dibaca.');
        imageInput.value = '';
      }
    });

    function renderBrandControls() {
      const select = $('#brandFilter');
      const keep = select.value;

      select.innerHTML =
        '<option value="">Semua merek</option>' +
        brandList().map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join('');

      select.value = brandList().some(b => sameBrand(b, keep)) ? keep : '';

    }

    function fillBrandSelect(selected = '') {
      brandSelect.innerHTML =
        '<option value="">Pilih merek…</option>' +
        allBrands().map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join('') +
        '<option value="__other">Lainnya…</option>';

      brandSelect.value = selected;
      toggleOther();
    }

    function toggleOther() {
      const other = brandSelect.value === '__other';

      brandOtherWrap.hidden = !other;
      brandOther.required = other;

      if (!other) brandOther.value = '';
    }

    function renderBrandPanel() {
      const customs = getCustomBrands();

      const rows = allBrands()
        .map(b => ({
          brand: b,
          cars: CARS.filter(c => sameBrand(c.brand, b)).length,
          base: isBaseBrand(b),
          custom: customs.some(x => sameBrand(x, b))
        }))
        .filter(r => r.cars > 0 || r.custom);

      $('#brandRows').innerHTML = rows.map(r => `
        <tr>
          <td><strong>${esc(r.brand)}</strong></td>
          <td>${r.cars} mobil</td>
          <td>${r.base ? 'Bawaan' : r.custom ? 'Ditambahkan admin' : 'Dari data mobil'}</td>
          <td class="admin-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-brand-edit="${esc(r.brand)}"
                    ${r.base ? 'disabled title="Merek bawaan tidak dapat diubah"' : ''}>Ubah nama</button>
            <button type="button" class="btn btn-danger btn-sm" data-brand-delete="${esc(r.brand)}"
                    ${r.custom && r.cars === 0 ? '' : 'disabled title="Hanya merek tambahan tanpa mobil yang bisa dihapus"'}>Hapus</button>
          </td>
        </tr>`).join('') ||
        '<tr><td colspan="4" class="admin-empty">Belum ada merek tambahan.</td></tr>';
    }

    function renderBrandChart() {
      const rows = brandList().map(b => {
        const list = CARS.filter(c => sameBrand(c.brand, b));
        return { b, n: list.length, avg: list.reduce((t, c) => t + c.price, 0) / list.length };
      });

      const max = Math.max(...rows.map(r => r.avg), 1);

      $('#brandChart').innerHTML = rows.map(r => `
        <div class="bar-row">
          <span class="bar-label">${esc(r.b)} <small>${r.n} mobil</small></span>
          <div class="bar-track"><div class="bar-fill" style="--w:${(r.avg / max * 100).toFixed(1)}%"></div></div>
          <strong>${rp(r.avg)}</strong>
        </div>`).join('') || '<p class="empty-note">Belum ada data mobil.</p>';
    }

    function renderStats() {
      const avg = CARS.length
        ? CARS.reduce((t, c) => t + c.price, 0) / CARS.length
        : 0;

      $('#statCars').textContent = CARS.length;
      $('#statBrands').textContent = brandList().length;
      $('#statAvg').textContent = rp(avg);
      $('#statHistory').textContent = store.get(KEYS.history, []).length;
    }

    function renderGroups() {
      const query = $('#carSearch').value.trim().toLowerCase();
      const brandFilter = $('#brandFilter').value;

      const visible = CARS.filter(c =>
        (!brandFilter || sameBrand(c.brand, brandFilter)) &&
        `${c.brand} ${c.name} ${c.year}`.toLowerCase().includes(query)
      );

      const groups = brandList()
        .map(b => ({ brand: b, cars: visible.filter(c => sameBrand(c.brand, b)) }))
        .filter(g => g.cars.length);

      container.innerHTML = groups.map(g => {
        const avg = g.cars.reduce((t, c) => t + c.price, 0) / g.cars.length;

        return `
          <details class="brand-group" open>
            <summary>
              <span class="brand-tile">${esc(g.brand.charAt(0).toUpperCase())}</span>
              <span class="brand-name">${esc(g.brand)}</span>
              <span class="brand-meta">${g.cars.length} mobil • rata-rata ${rp(avg)}</span>
            </summary>
            <div class="table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Mobil</th><th>Harga</th><th>Konsumsi</th><th>Harga energi</th>
                    <th>Pajak / tahun</th><th>Servis / tahun</th><th>Cadangan / tahun</th>
                    <th>Biaya awal</th><th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${g.cars.map(c => `
                    <tr>
                      <td>
                        <strong>${esc(c.name)}</strong>
                        <small>${c.year} • ${esc(c.cond)} • ${esc(c.energy)}</small>
                      </td>
                      <td>${rp(c.price)}</td>
                      <td>${c.kmpl} ${kmUnit(c)}</td>
                      <td>${rp(c.energyPrice)} / ${unitOf(c)}</td>
                      <td>${rp(c.tax)}</td>
                      <td>${rp(c.service)}</td>
                      <td>${rp(c.reserve)}</td>
                      <td>${rp(c.initial)}</td>
                      <td class="admin-actions">
                        <button type="button" class="btn btn-secondary btn-sm" data-edit="${esc(c.id)}">Edit</button>
                        <button type="button" class="btn btn-danger btn-sm" data-delete="${esc(c.id)}">Hapus</button>
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>
          </details>
        `;
      }).join('') || '<p class="empty-note">Tidak ada data mobil yang cocok.</p>';
    }

    function renderHistory() {
      const history = store.get(KEYS.history, []);

      $('#historyTable').innerHTML = history.slice(0, 10).map(item => `
        <tr>
          <td>${new Date(item.date).toLocaleString('id-ID')}</td>
          <td>${esc(item.car.brand)} ${esc(item.car.name)}</td>
          <td>${rp(item.car.price)}</td>
          <td>${rp(item.result.V)}</td>
          <td>${badge(item.result.status)}</td>
        </tr>`).join('') ||
        '<tr><td colspan="5" class="admin-empty">Belum ada riwayat analisis.</td></tr>';
    }

    const renderAll = () => {
      renderBrandControls();
      renderBrandPanel();
      renderBrandChart();
      renderStats();
      renderGroups();
      renderHistory();
    };

    function openForm(car = null) {
      editingId = car ? car.id : null;
      selectedImage = car?.image || '';

      imageInput.value = '';
      preview.src = selectedImage;
      preview.hidden = !selectedImage;

      $('#dialogTitle').textContent = car ? 'Edit mobil' : 'Tambah mobil';

      const data = car || {
        brand: '', name: '', year: new Date().getFullYear(), cond: 'Bekas',
        energy: 'Bensin', price: '', kmpl: '', energyPrice: 10000,
        tax: '', service: '', reserve: '', initial: 3000000
      };

      fillBrandSelect(data.brand || '');

      ['name', 'year', 'cond', 'energy', 'price', 'kmpl',
        'energyPrice', 'tax', 'service', 'reserve', 'initial']
        .forEach(key => { form.elements.namedItem(key).value = data[key] ?? ''; });

      dialog.showModal();
    }

    form.addEventListener('submit', e => {
      e.preventDefault();

      const val = key => form.elements.namedItem(key).value;
      const num = key => Number(val(key));

      const typed = val('brand') === '__other' ? cleanBrand(brandOther.value) : val('brand');
      const existing = allBrands().find(b => sameBrand(b, typed));
      const brand = existing || prettyBrand(typed);
      const brandIsNew = !!typed && !existing;

      const car = {
        brand,
        name: val('name').trim(),
        image: selectedImage,
        year: num('year'),
        cond: val('cond'),
        energy: val('energy'),
        price: num('price'),
        kmpl: num('kmpl'),
        energyPrice: num('energyPrice'),
        tax: num('tax'),
        service: num('service'),
        reserve: num('reserve'),
        initial: num('initial')
      };

      const invalid =
        !car.brand || !car.name || !(car.price > 0) || !(car.kmpl > 0) ||
        car.energyPrice < 0 || car.tax < 0 || car.service < 0 ||
        car.reserve < 0 || car.initial < 0;

      if (invalid) {
        alert('Periksa kembali data mobil. Harga dan konsumsi harus lebih dari 0, biaya tidak boleh negatif.');
        return;
      }

      const backup = CARS.map(c => ({ ...c }));

      if (editingId) {
        const index = CARS.findIndex(c => c.id === editingId);
        if (index === -1) return;
        CARS[index] = { ...car, id: editingId };
      } else {
        const baseId = `${car.brand}-${car.name}-${car.year}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        let id = baseId;
        let n = 2;

        while (CARS.some(c => c.id === id)) id = `${baseId}-${n++}`;

        CARS.push({ ...car, id });
      }

      if (!persist()) {
        CARS = backup;
        return;
      }

      if (brandIsNew) store.set(KEYS.brands, [...getCustomBrands(), brand]);

      dialog.close();
      renderAll();
      toast(editingId ? 'Perubahan data mobil disimpan' : 'Mobil baru ditambahkan');

      const savedId = editingId || CARS[CARS.length - 1].id;
      const row = $(`[data-edit="${CSS.escape(savedId)}"]`)?.closest('tr');
      if (row) row.classList.add('flash');
    });

    container.addEventListener('click', e => {
      const edit = e.target.closest('[data-edit]');
      const del = e.target.closest('[data-delete]');

      if (edit) {
        const car = carById(edit.dataset.edit);
        if (car) openForm(car);
      }

      if (del && confirm('Yakin ingin menghapus mobil ini?')) {
        CARS = CARS.filter(c => c.id !== del.dataset.delete);
        persist();
        renderAll();
        toast('Mobil dihapus');
      }
    });

    brandSelect.addEventListener('change', toggleOther);

    $('#addBrandForm').addEventListener('submit', e => {
      e.preventDefault();

      const input = $('#newBrand');
      const typed = cleanBrand(input.value);
      if (!typed) return;

      if (allBrands().some(b => sameBrand(b, typed))) {
        toast('Merek tersebut sudah ada');
        return;
      }

      store.set(KEYS.brands, [...getCustomBrands(), prettyBrand(typed)]);
      input.value = '';
      renderAll();
      toast('Merek ditambahkan');
    });

    $('#brandRows').addEventListener('click', e => {
      const edit = e.target.closest('[data-brand-edit]');
      const del = e.target.closest('[data-brand-delete]');

      if (edit && !edit.disabled) {
        const old = edit.dataset.brandEdit;
        const next = cleanBrand(prompt('Ubah nama merek:', old));

        if (!next || next === old) return;

        if (allBrands().some(b => sameBrand(b, next) && !sameBrand(b, old))) {
          alert('Merek dengan nama tersebut sudah ada.');
          return;
        }

        const backup = CARS.map(c => ({ ...c }));
        CARS.forEach(c => { if (sameBrand(c.brand, old)) c.brand = next; });

        if (!persist()) { CARS = backup; return; }

        const customs = getCustomBrands().map(b => (sameBrand(b, old) ? next : b));
        store.set(KEYS.brands, customs);

        renderAll();
        toast('Nama merek diperbarui di semua mobil');
      }

      if (del && !del.disabled && confirm('Hapus merek ini dari daftar?')) {
        store.set(KEYS.brands, getCustomBrands().filter(b => !sameBrand(b, del.dataset.brandDelete)));
        renderAll();
        toast('Merek dihapus');
      }
    });

    $('#addCar').addEventListener('click', () => openForm());
    $('#cancelDialog').addEventListener('click', () => dialog.close());
    $('#carSearch').addEventListener('input', renderGroups);
    $('#brandFilter').addEventListener('change', renderGroups);

    $('#resetCars').addEventListener('click', () => {
      if (!confirm('Kembalikan data mobil ke data awal? Perubahan Anda akan hilang.')) return;

      CARS = DEFAULT_CARS.map(c => ({ ...c }));
      persist();
      renderAll();
      toast('Data mobil dikembalikan ke data awal');
    });

    $('#clearHistory').addEventListener('click', () => {
      if (confirm('Hapus semua riwayat analisis?')) {
        store.set(KEYS.history, []);
        renderAll();
        toast('Riwayat analisis dihapus');
      }
    });

    renderAll();
  }

  /* ================= Init ================= */
  document.addEventListener('DOMContentLoaded', () => {
    if (!guard()) return;

    fx.init();

    [
      initNav, initHome, initCatalog, initDetail, initProfile,
      initDashboard, initAnalysis, initResult, initAuth, initAdmin
    ].forEach(fn => fn());

    fx.scan();
  });
})();