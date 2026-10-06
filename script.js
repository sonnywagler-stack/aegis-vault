/* Aegis Vault — drawings, configurator, cart.
   All Vault 3×3 dimensions come from the cut plan (mm). */
(() => {
  'use strict';

  /* ---------- Dimensions (plan de découpe 3×3 ETB) ---------- */
  const V = {
    W: 617, D: 545,          // emprise du fond
    t: 8,                    // épaisseur parois / cloisons
    base: 16,                // fond double 8 + 8
    wall: 88,                // hauteur des parois
    frame: 3,                // cadres aimantés
    lid: 8,
    cell: { x: 195, y: 171, z: 94 },
    etb: { x: 192, y: 168, z: 92 },
    wheel: 80,
    gap: 6,                  // écart entre deux modules (pastilles 3 + 3)
    magX: [154.25, 462.75],  // aimants sur L1 / pastilles avant-arrière
    magY: [264.5],           // aimants sur L2 / pastilles gauche-droite
    emptyKg: 14, etbKg: 6 / 9,
  };
  const TOP_WALL = V.base + V.wall;            // 104
  const TOP_CELL = V.base + V.cell.z;          // 110 : le couvercle repose sur les cloisons

  /* ---------- Catalogue (prix à ajuster) ---------- */
  const VAULT_PRICE = 349;
  const PRODUCTS = [
    {
      id: 'vault33', name: 'Vault 3×3 · ETB', price: VAULT_PRICE, tag: 'Best-seller', featured: true,
      desc: 'Le module complet : 9 compartiments pour ETB, couvercle aimanté, 4 roulettes dont 2 à frein, 6 pastilles de liaison pour former un mur.',
      specs: ['617 × 545 mm', '9 ETB', 'PMMA coulé 8 mm', '18 aimants N52', '≈ 14 kg'],
      art: () => isoVault({ lift: 90, scale: 0.38, w: 520, h: 360 }),
    },
    {
      id: 'etb-solo', name: 'Vitrine ETB solo', price: 39.9, tag: 'Nouveau',
      desc: 'Un boîtier acrylique pour une seule ETB, à poser sur une étagère. Couvercle aimanté.',
      specs: ['Pour ETB 192 × 168 × 92', 'Couvercle aimanté'],
      art: () => isoSolo(),
    },
    {
      id: 'aimants', name: "Kit 24 aimants N52", price: 9.9,
      desc: 'Aimants néodyme Ø5 × 3 mm de rechange, identiques à ceux du Vault. Pour remplacer un aimant perdu ou ajouter une pastille.',
      specs: ['Ø5 × 3 mm', 'N52', '24 pièces'],
      art: () => artMagnets(),
    },
    {
      id: 'roulettes', name: 'Lot de 4 roulettes', price: 29.9,
      desc: 'Roulettes à platine, 2 avec frein, boulonnerie M6 fournie. Compatibles avec tous les Vault.',
      specs: ['Platine 40 × 40', '25 kg / roulette', 'H 80 mm'],
      art: () => artWheels(),
    },
  ];
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

  // Remise mur selon le nombre de Vault 3×3
  const wallDiscount = n => (n >= 4 ? 0.10 : n >= 2 ? 0.05 : 0);

  const fmt = n => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  const fmtInt = n => n.toLocaleString('fr-FR');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Isometric drawing helpers ---------- */
  const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
  function projector(scale, ox, oy) {
    return (x, y, z) => [ox + (x - y) * C30 * scale, oy + (x + y) * S30 * scale - z * scale];
  }
  const poly = (P, pts, cls, extra = '') =>
    `<path class="${cls}" ${extra} d="M${pts.map(p => P(...p).map(v => v.toFixed(1)).join(' ')).join('L')}Z"/>`;

  // Box with the three faces seen from the front: top, front (y = y1), right (x = x1)
  function box(P, [x0, x1, y0, y1, z0, z1], cls) {
    const c = typeof cls === 'string' ? { top: cls, l: cls, r: cls } : cls;
    return (
      poly(P, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], c.l) +
      poly(P, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], c.r) +
      poly(P, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], c.top)
    );
  }

  function etbBox(P, x0, y0, z0) {
    const { x, y, z } = V.etb;
    // Bande dorée sur le côté gauche du dessus, rappel des coffrets premium
    return box(P, [x0, x0 + x, y0, y0 + y, z0, z0 + z], { top: 'dw-etb-top', l: 'dw-etb-l', r: 'dw-etb-r' }) +
      poly(P, [[x0, y0, z0 + z], [x0 + x * 0.22, y0, z0 + z], [x0 + x * 0.22, y0 + y, z0 + z], [x0, y0 + y, z0 + z]], 'dw-etb-band') +
      poly(P, [[x0, y0 + y, z0], [x0 + x * 0.22, y0 + y, z0], [x0 + x * 0.22, y0 + y, z0 + z], [x0, y0 + y, z0 + z]], 'dw-etb-band', 'opacity=".75"');
  }

  function wheel(P, x, y) {
    const [cx, cy] = P(x, y, -V.wheel + 22);
    const [tx, ty] = P(x, y, 0);
    return `<line x1="${tx}" y1="${ty}" x2="${cx}" y2="${cy}" stroke="#4a525b" stroke-width="5"/>` +
      `<ellipse class="dw-wheel" cx="${cx}" cy="${cy + 4}" rx="9" ry="11" stroke-width="1.5"/>`;
  }

  function magnetDot(P, x, y, z, r = 3.2) {
    const [cx, cy] = P(x, y, z);
    return `<ellipse class="dw-mag" cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.6}"/>`;
  }

  /* The full module, painter's order: back to front. */
  function vaultParts(P, { etbs = true } = {}) {
    const { W, D, t } = V;
    let s = '';
    // Roulettes, centres à 60 mm des bords
    [[60, 60], [W - 60, 60], [60, D - 60], [W - 60, D - 60]].forEach(([x, y]) => (s += wheel(P, x, y)));
    // Fond double
    s += box(P, [0, W, 0, D, 0, V.base], 'dw-acr');
    // Parois arrière (y = 0) et gauche (x = 0)
    s += box(P, [0, W, 0, t, V.base, TOP_WALL], 'dw-wall');
    s += box(P, [0, t, t, D - t, V.base, TOP_WALL], 'dw-wall');
    // Rangées (le long de y) : ETB + cloisons courtes, puis cloison longue
    for (let r = 0; r < 3; r++) {
      const y0 = t + r * (V.cell.y + t);
      for (let c = 0; c < 3; c++) {
        const x0 = t + c * (V.cell.x + t);
        if (etbs) s += etbBox(P, x0 + 1.5, y0 + 1.5, V.base);
        if (c < 2) s += box(P, [x0 + V.cell.x, x0 + V.cell.x + t, y0, y0 + V.cell.y, V.base, TOP_CELL], 'dw-wall');
      }
      if (r < 2) s += box(P, [t, W - t, y0 + V.cell.y, y0 + V.cell.y + t, V.base, TOP_CELL], 'dw-wall');
    }
    // Paroi droite puis paroi avant
    s += box(P, [W - t, W, t, D - t, V.base, TOP_WALL], 'dw-wall');
    s += box(P, [0, W, D - t, D, V.base, TOP_WALL], 'dw-wall');
    // Cadre aimanté des parois + 6 aimants
    const zf = TOP_WALL + V.frame;
    V.magX.forEach(x => { s += magnetDot(P, x, 4, zf); s += magnetDot(P, x, D - 4, zf); });
    V.magY.forEach(y => { s += magnetDot(P, 4, y, zf); s += magnetDot(P, W - 4, y, zf); });
    // Pastilles de liaison visibles : avant (2) et droite (1), centre à 44 mm au-dessus du fond
    const zp = V.base + 44;
    V.magX.forEach(x => (s += box(P, [x - 8, x + 8, D, D + 3, zp - 8, zp + 8], { top: 'dw-mag', l: 'dw-mag', r: 'dw-mag' })));
    V.magY.forEach(y => (s += box(P, [W, W + 3, y - 8, y + 8, zp - 8, zp + 8], { top: 'dw-mag', l: 'dw-mag', r: 'dw-mag' })));
    return s;
  }

  function lidParts(P, lift) {
    const z0 = TOP_WALL + V.frame + lift;
    return box(P, [0, V.W, 0, V.D, z0, z0 + V.frame + V.lid], { top: 'dw-acr', l: 'dw-wall', r: 'dw-wall' });
  }

  // Vertical origin that centres the module (wheels to raised lid) in the viewBox
  function centerY(scale, lift, h) {
    const top = TOP_WALL + 2 * V.frame + V.lid + lift;
    const span = ((V.W + V.D) * S30 + V.wheel + top) * scale;
    return (h - span) / 2 + top * scale;
  }

  function isoVault({ lift = 140, scale = 0.44, w = 520, h = 440 } = {}) {
    const ox = w / 2 + (V.D - V.W) * C30 * scale / 2;
    const oy = centerY(scale, lift, h);
    const P = projector(scale, ox, oy);
    return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">${vaultParts(P)}<g class="lid">${lidParts(P, lift)}</g></svg>`;
  }

  function isoSolo() {
    const s = 0.9, w = 400, h = 300, m = 6, t = 4;
    const bx = V.etb.x + 2 * (m + t), by = V.etb.y + 2 * (m + t), bz = V.etb.z + m + 2 * t;
    const P = projector(s, w / 2 + (by - bx) * C30 * s / 2, h - (bx + by) * S30 * s - 16);
    return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true">` +
      box(P, [0, bx, 0, by, 0, t], 'dw-acr') +
      etbBox(P, t + m, t + m, t) +
      box(P, [0, bx, 0, by, t, bz], { top: 'dw-acr', l: 'dw-wall', r: 'dw-wall' }) + '</svg>';
  }

  function artMagnets() {
    let s = '';
    for (let i = 0; i < 24; i++) {
      const col = i % 6, row = Math.floor(i / 6);
      const cx = 90 + col * 44 + (row % 2) * 22, cy = 80 + row * 46;
      s += `<ellipse cx="${cx}" cy="${cy + 6}" rx="16" ry="9" fill="#6b5320"/><rect x="${cx - 16}" y="${cy}" width="32" height="6" fill="#8a6a2a"/><ellipse class="dw-mag" cx="${cx}" cy="${cy}" rx="16" ry="9"/>`;
    }
    return `<svg viewBox="0 0 400 300" aria-hidden="true">${s}</svg>`;
  }

  function artWheels() {
    const one = (x, y) => `
      <g transform="translate(${x} ${y})">
        <rect x="-34" y="-8" width="68" height="10" rx="2" fill="#4a525b"/>
        <path d="M-20 2h40l-6 30h-28z" fill="#3a424a"/>
        <circle cx="0" cy="48" r="26" class="dw-wheel" stroke-width="3"/>
        <circle cx="0" cy="48" r="8" fill="#8e99a4"/>
      </g>`;
    return `<svg viewBox="0 0 400 300" aria-hidden="true">${one(110, 70)}${one(290, 70)}${one(110, 180)}${one(290, 180)}</svg>`;
  }

  /* ---------- Plan coté (vue de dessus) ---------- */
  function drawPlan(svg) {
    const s = 0.86, ox = 100, oy = 70, { W, D, t } = V;
    const X = x => ox + x * s, Y = y => oy + y * s;
    let g = `<rect class="dw-acr" x="${X(0)}" y="${Y(0)}" width="${W * s}" height="${D * s}" rx="2"/>`;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      const x0 = t + c * (V.cell.x + t), y0 = t + r * (V.cell.y + t);
      g += `<rect fill="var(--bg-alt)" x="${X(x0)}" y="${Y(y0)}" width="${V.cell.x * s}" height="${V.cell.y * s}"/>`;
      g += `<rect fill="none" stroke="var(--gold)" stroke-dasharray="4 4" opacity=".7" x="${X(x0 + 1.5)}" y="${Y(y0 + 1.5)}" width="${V.etb.x * s}" height="${V.etb.y * s}"/>`;
      g += `<text class="dw-txt" text-anchor="middle" x="${X(x0 + V.cell.x / 2)}" y="${Y(y0 + V.cell.y / 2) + 5}">${c + 1 + r * 3}</text>`;
    }
    // Aimants du cadre et pastilles
    V.magX.forEach(x => { g += `<circle class="dw-mag" cx="${X(x)}" cy="${Y(4)}" r="3"/><circle class="dw-mag" cx="${X(x)}" cy="${Y(D - 4)}" r="3"/>`; });
    V.magY.forEach(y => { g += `<circle class="dw-mag" cx="${X(4)}" cy="${Y(y)}" r="3"/><circle class="dw-mag" cx="${X(W - 4)}" cy="${Y(y)}" r="3"/>`; });
    V.magX.forEach(x => { g += `<rect class="dw-mag" x="${X(x - 8)}" y="${Y(-3)}" width="${16 * s}" height="${3 * s}"/><rect class="dw-mag" x="${X(x - 8)}" y="${Y(D)}" width="${16 * s}" height="${3 * s}"/>`; });
    V.magY.forEach(y => { g += `<rect class="dw-mag" x="${X(-3)}" y="${Y(y - 8)}" width="${3 * s}" height="${16 * s}"/><rect class="dw-mag" x="${X(W)}" y="${Y(y - 8)}" width="${3 * s}" height="${16 * s}"/>`; });

    // Cotes
    const dimH = (x0, x1, y, label, cls = '') =>
      `<path class="dw-dim" d="M${x0} ${y}H${x1}M${x0} ${y - 6}v12M${x1} ${y - 6}v12"/><text class="dw-txt ${cls}" text-anchor="middle" x="${(x0 + x1) / 2}" y="${y - 10}">${label}</text>`;
    const dimV = (y0, y1, x, label, cls = '') =>
      `<path class="dw-dim" d="M${x} ${y0}V${y1}M${x - 6} ${y0}h12M${x - 6} ${y1}h12"/><text class="dw-txt ${cls}" text-anchor="middle" transform="translate(${x - 12} ${(y0 + y1) / 2}) rotate(-90)">${label}</text>`;
    g += dimH(X(0), X(W), Y(0) - 30, '617');
    g += dimV(Y(0), Y(D), X(0) - 34, '545');
    g += dimH(X(t), X(t + V.cell.x), Y(D) + 44, '195', 'dw-txt--gold');
    g += dimV(Y(t), Y(t + V.cell.y), X(W) + 46, '171', 'dw-txt--gold');
    g += `<text class="dw-txt" x="${X(0)}" y="${Y(D) + 96}">Pointillés : ETB 192 × 168 · or : aimants et pastilles</text>`;
    svg.innerHTML = g;
  }

  /* ---------- Hero ---------- */
  function initHero() {
    const svg = $('#vaultIso');
    if (!svg) return;
    const scale = 0.44, lift = 150, w = 520, h = 440;
    const ox = w / 2 + (V.D - V.W) * C30 * scale / 2;
    const oy = centerY(scale, lift, h);
    const P = projector(scale, ox, oy);
    svg.innerHTML = vaultParts(P) + `<g class="lid">${lidParts(P, lift)}</g>`;
    svg.style.setProperty('--lid-drop', `${lift * scale}px`);

    $$('.iso__toggle .chip').forEach(btn => btn.addEventListener('click', () => {
      $$('.iso__toggle .chip').forEach(b => b.classList.toggle('is-active', b === btn));
      svg.classList.toggle('is-closed', btn.dataset.lid === 'closed');
    }));
  }

  /* ---------- Configurateur de mur ---------- */
  const cfg = { cols: 2, rows: 1, max: { cols: 5, rows: 3 } };

  function wallDims(cols, rows) {
    return { w: cols * V.W + (cols - 1) * V.gap, d: rows * V.D + (rows - 1) * V.gap };
  }

  function drawWall(svg) {
    const { cols, rows } = cfg, { w, d } = wallDims(cols, rows), pad = 60;
    svg.setAttribute('viewBox', `${-pad} ${-pad} ${w + 2 * pad} ${d + 2 * pad}`);
    let g = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x0 = c * (V.W + V.gap), y0 = r * (V.D + V.gap);
      g += `<rect class="dw-acr" x="${x0}" y="${y0}" width="${V.W}" height="${V.D}" rx="4" stroke-width="4"/>`;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        g += `<rect class="dw-etb-top" x="${x0 + V.t + 1.5 + i * (V.cell.x + V.t)}" y="${y0 + V.t + 1.5 + j * (V.cell.y + V.t)}" width="${V.etb.x}" height="${V.etb.y}" rx="3"/>`;
        g += `<rect class="dw-etb-band" x="${x0 + V.t + 1.5 + i * (V.cell.x + V.t)}" y="${y0 + V.t + 1.5 + j * (V.cell.y + V.t)}" width="${V.etb.x * 0.22}" height="${V.etb.y}" rx="3"/>`;
      }
      // Pastilles
      V.magX.forEach(x => { g += `<rect class="dw-mag" x="${x0 + x - 8}" y="${y0 - 3}" width="16" height="3"/><rect class="dw-mag" x="${x0 + x - 8}" y="${y0 + V.D}" width="16" height="3"/>`; });
      V.magY.forEach(y => { g += `<rect class="dw-mag" x="${x0 - 3}" y="${y0 + y - 8}" width="3" height="16"/><rect class="dw-mag" x="${x0 + V.W}" y="${y0 + y - 8}" width="3" height="16"/>`; });
    }
    const fs = Math.max(w, d) / 32;
    g += `<text class="dw-txt" text-anchor="middle" style="font-size:${fs}px" x="${w / 2}" y="${-pad / 3}">${fmtInt(w)} mm</text>`;
    g += `<text class="dw-txt" text-anchor="middle" style="font-size:${fs}px" transform="translate(${w + pad * 0.85} ${d / 2}) rotate(-90)">${fmtInt(d)} mm</text>`;
    svg.innerHTML = g;
  }

  function updateConfig() {
    const { cols, rows } = cfg, n = cols * rows, { w, d } = wallDims(cols, rows);
    const disc = wallDiscount(n), total = n * VAULT_PRICE * (1 - disc);
    $('#colsOut').textContent = cols;
    $('#rowsOut').textContent = rows;
    $('#statModules').textContent = n;
    $('#statEtb').textContent = n * 9;
    $('#statSize').textContent = `${fmtInt(w)} × ${fmtInt(d)} mm`;
    $('#statWeight').textContent = `≈ ${Math.round(n * (V.emptyKg + 9 * V.etbKg))} kg`;
    $('#statPrice').textContent = fmt(total);
    $('#statSaving').textContent = disc ? `Remise mur −${disc * 100} % (−${fmt(n * VAULT_PRICE * disc)})` : 'Remise −5 % dès 2 modules';
    $$('[data-step]').forEach(b => {
      const k = b.dataset.step, v = cfg[k] + Number(b.dataset.d);
      b.disabled = v < 1 || v > cfg.max[k];
    });
    drawWall($('#wallPlan'));
  }

  function initConfig() {
    if (!$('#wallPlan')) return;
    $$('[data-step]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.step;
      cfg[k] = Math.min(cfg.max[k], Math.max(1, cfg[k] + Number(b.dataset.d)));
      updateConfig();
    }));
    $('#configAdd').addEventListener('click', () => {
      const n = cfg.cols * cfg.rows;
      addToCart('vault33', n);
      toast(`${n} Vault 3×3 ajouté${n > 1 ? 's' : ''} au panier`);
    });
    updateConfig();
  }

  /* ---------- Boutique ---------- */
  function renderProducts() {
    const grid = $('#products');
    if (!grid) return;
    grid.innerHTML = PRODUCTS.map(p => `
      <article class="product${p.featured ? ' product--featured' : ''} reveal">
        <div class="product__media">
          ${p.tag ? `<span class="product__tag">${p.tag}</span>` : ''}
          ${p.art()}
        </div>
        <div class="product__body">
          <h3>${p.name}</h3>
          <p class="product__desc">${p.desc}</p>
          <ul class="product__specs">${p.specs.map(s => `<li>${s}</li>`).join('')}</ul>
          <div class="product__foot">
            <span class="product__price">${fmt(p.price)}</span>
            <button class="btn btn--gold product__add" data-add="${p.id}">Ajouter</button>
          </div>
        </div>
      </article>`).join('');
    grid.addEventListener('click', e => {
      const btn = e.target.closest('[data-add]');
      if (!btn) return;
      addToCart(btn.dataset.add, 1);
      toast(`${byId[btn.dataset.add].name} ajouté au panier`);
    });
  }

  /* ---------- Panier ---------- */
  const STORE_KEY = 'aegis-vault-cart';
  const FREE_SHIPPING = 80, SHIPPING = 6.9;
  let cart = load();

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return Object.fromEntries(Object.entries(raw).filter(([id, q]) => byId[id] && q > 0));
    } catch { return {}; }
  }
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch { /* stockage indisponible */ } }

  function addToCart(id, qty) {
    cart[id] = (cart[id] || 0) + qty;
    save(); renderCart();
    const c = $('#cartCount');
    c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
  }

  function totals() {
    const sub = Object.entries(cart).reduce((s, [id, q]) => s + byId[id].price * q, 0);
    const nVault = cart.vault33 || 0;
    const disc = nVault * VAULT_PRICE * wallDiscount(nVault);
    const afterDisc = sub - disc;
    const ship = afterDisc === 0 || afterDisc >= FREE_SHIPPING ? 0 : SHIPPING;
    return { sub, disc, ship, total: afterDisc + ship, count: Object.values(cart).reduce((a, b) => a + b, 0) };
  }

  function renderCart() {
    const list = $('#cartItems'), t = totals();
    $('#cartCount').textContent = t.count;
    const ids = Object.keys(cart);
    list.innerHTML = ids.length ? ids.map(id => `
      <div class="cart-item">
        <span class="cart-item__name">${byId[id].name}</span>
        <span class="cart-item__price">${fmt(byId[id].price * cart[id])}</span>
        <div class="cart-item__qty">
          <button data-qty="${id}" data-d="-1" aria-label="Retirer un">−</button>
          <span>${cart[id]}</span>
          <button data-qty="${id}" data-d="1" aria-label="Ajouter un">+</button>
        </div>
        <button class="cart-item__remove" data-remove="${id}">Supprimer</button>
      </div>`).join('') +
      (t.disc ? `<div class="cart-item"><span class="cart-item__name">Remise mur −${wallDiscount(cart.vault33) * 100} %</span><span class="cart-item__price">−${fmt(t.disc)}</span></div>` : '')
      : '<p class="cart__empty">Votre panier est vide.</p>';

    $('#cartShipping').textContent = !t.count ? 'Livraison offerte dès 80 €.'
      : t.ship ? `Livraison ${fmt(t.ship)} · plus que ${fmt(FREE_SHIPPING - (t.sub - t.disc))} pour la livraison offerte.`
      : 'Livraison offerte.';
    $('#cartTotal').textContent = fmt(t.total);
    $('#checkout').disabled = !t.count;
  }

  function initCart() {
    const drawer = $('#cart'), overlay = $('#overlay');
    const open = () => { drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); overlay.hidden = false; $('#cartClose').focus(); };
    const close = () => { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); overlay.hidden = true; };
    $('#cartOpen').addEventListener('click', open);
    $('#cartClose').addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    $('#cartItems').addEventListener('click', e => {
      const q = e.target.closest('[data-qty]'), r = e.target.closest('[data-remove]');
      if (q) {
        const id = q.dataset.qty;
        cart[id] += Number(q.dataset.d);
        if (cart[id] <= 0) delete cart[id];
      } else if (r) delete cart[r.dataset.remove];
      else return;
      save(); renderCart();
    });

    $('#checkout').addEventListener('click', () => {
      // Pas encore de paiement en ligne : la commande part par email.
      const t = totals();
      const lines = Object.entries(cart).map(([id, q]) => `- ${q} × ${byId[id].name} (${fmt(byId[id].price * q)})`);
      if (t.disc) lines.push(`- Remise mur : −${fmt(t.disc)}`);
      lines.push(`Livraison : ${t.ship ? fmt(t.ship) : 'offerte'}`, `Total : ${fmt(t.total)}`);
      const body = `Bonjour,\n\nJe souhaite commander :\n${lines.join('\n')}\n\nNom :\nAdresse de livraison :\n`;
      location.href = `mailto:contact@aegisvault.fr?subject=${encodeURIComponent('Commande Aegis Vault')}&body=${encodeURIComponent(body)}`;
    });
    renderCart();
  }

  /* ---------- Formulaires ---------- */
  function initForms() {
    const form = $('#contactForm'), status = $('#formStatus');
    form?.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach(f => {
        const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
        f.classList.toggle('is-invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) { status.textContent = 'Merci de remplir tous les champs correctement.'; status.className = 'form__status err'; return; }
      const d = Object.fromEntries(new FormData(form));
      const body = `${d.message}\n\n${d.name} · ${d.email}`;
      location.href = `mailto:contact@aegisvault.fr?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = 'Votre messagerie va s\'ouvrir avec le message prêt à envoyer.';
      status.className = 'form__status ok';
    });

    $('#newsletterForm')?.addEventListener('submit', e => {
      e.preventDefault();
      e.target.reset();
      toast('Merci ! Vous êtes inscrit à la newsletter.');
    });
  }

  /* ---------- UI générale ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
  }

  function initUI() {
    const header = $('.header'), burger = $('#burger'), nav = $('#nav');
    const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 10);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();

    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', open);
      nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
    });

    const io = 'IntersectionObserver' in window && new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(el => (io ? io.observe(el) : el.classList.add('is-visible')));

    $('#year').textContent = new Date().getFullYear();
  }

  renderProducts();
  initHero();
  drawPlan($('#vaultPlan'));
  initConfig();
  initCart();
  initForms();
  initUI();
})();
