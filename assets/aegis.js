/* Aegis Vault theme — drawings, wall configurator, AJAX cart.
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


  /* ---------- Utilitaires ---------- */
  const AV = window.AegisVault || { routes: { root: '/', cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change' }, currency: 'EUR', locale: 'fr' };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmtInt = n => n.toLocaleString('fr-FR');
  // Montants Shopify en centimes
  const money = cents => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: AV.currency || 'EUR' });
  const esc = str => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Illustrations ---------- */
  const ART = {
    vault: () => isoVault({ lift: 90, scale: 0.38, w: 520, h: 360 }),
    solo: () => isoSolo(),
    magnets: () => artMagnets(),
    wheels: () => artWheels(),
  };
  function initArt(scope = document) {
    $$('[data-art]', scope).forEach(el => { if (!el.firstChild) el.innerHTML = (ART[el.dataset.art] || ART.solo)(); });
    $$('[data-vault-plan]', scope).forEach(drawPlan);
  }

  function initHero(scope = document) {
    $$('[data-vault-iso]', scope).forEach(svg => {
      const scale = 0.44, lift = 150, w = 520, h = 440;
      const ox = w / 2 + (V.D - V.W) * C30 * scale / 2;
      const P = projector(scale, ox, centerY(scale, lift, h));
      svg.innerHTML = vaultParts(P) + `<g class="lid">${lidParts(P, lift)}</g>`;
      svg.style.setProperty('--lid-drop', `${lift * scale}px`);
      const chips = $$('[data-lid]', svg.parentElement);
      chips.forEach(btn => btn.addEventListener('click', () => {
        chips.forEach(b => b.classList.toggle('is-active', b === btn));
        svg.classList.toggle('is-closed', btn.dataset.lid === 'closed');
      }));
    });
  }

  /* ---------- Configurateur de mur ---------- */
  function wallDims(cols, rows) {
    return { w: cols * V.W + (cols - 1) * V.gap, d: rows * V.D + (rows - 1) * V.gap };
  }

  function drawWall(svg, cols, rows) {
    const { w, d } = wallDims(cols, rows), pad = 60;
    svg.setAttribute('viewBox', `${-pad} ${-pad} ${w + 2 * pad} ${d + 2 * pad}`);
    let g = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x0 = c * (V.W + V.gap), y0 = r * (V.D + V.gap);
      g += `<rect class="dw-acr" x="${x0}" y="${y0}" width="${V.W}" height="${V.D}" rx="4" stroke-width="4"/>`;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const ex = x0 + V.t + 1.5 + i * (V.cell.x + V.t), ey = y0 + V.t + 1.5 + j * (V.cell.y + V.t);
        g += `<rect class="dw-etb-top" x="${ex}" y="${ey}" width="${V.etb.x}" height="${V.etb.y}" rx="3"/>`;
        g += `<rect class="dw-etb-band" x="${ex}" y="${ey}" width="${V.etb.x * 0.22}" height="${V.etb.y}" rx="3"/>`;
      }
      V.magX.forEach(x => { g += `<rect class="dw-mag" x="${x0 + x - 8}" y="${y0 - 3}" width="16" height="3"/><rect class="dw-mag" x="${x0 + x - 8}" y="${y0 + V.D}" width="16" height="3"/>`; });
      V.magY.forEach(y => { g += `<rect class="dw-mag" x="${x0 - 3}" y="${y0 + y - 8}" width="3" height="16"/><rect class="dw-mag" x="${x0 + V.W}" y="${y0 + y - 8}" width="3" height="16"/>`; });
    }
    const fs = Math.max(w, d) / 32;
    g += `<text class="dw-txt" text-anchor="middle" style="font-size:${fs}px" x="${w / 2}" y="${-pad / 3}">${fmtInt(w)} mm</text>`;
    g += `<text class="dw-txt" text-anchor="middle" style="font-size:${fs}px" transform="translate(${w + pad * 0.85} ${d / 2}) rotate(-90)">${fmtInt(d)} mm</text>`;
    svg.innerHTML = g;
  }

  function initConfig(root) {
    const cfg = { cols: 2, rows: 1, max: { cols: +root.dataset.maxCols || 5, rows: +root.dataset.maxRows || 3 } };
    const price = Number(root.dataset.price || 0);
    // Paliers [quantité, %], du plus grand au plus petit
    let tiers = [];
    try { tiers = JSON.parse(root.dataset.tiers || '[]').filter(([q, p]) => q > 0 && p > 0).sort((a, b) => b[0] - a[0]); } catch { /* paliers invalides */ }
    const discountFor = n => { const t = tiers.find(([q]) => n >= q); return t ? t[1] / 100 : 0; };
    const stat = k => $(`[data-stat="${k}"]`, root);

    const update = () => {
      const { cols, rows } = cfg, n = cols * rows, { w, d } = wallDims(cols, rows);
      $('[data-out="cols"]', root).textContent = cols;
      $('[data-out="rows"]', root).textContent = rows;
      stat('modules').textContent = n;
      stat('etb').textContent = n * 9;
      stat('size').textContent = `${fmtInt(w)} × ${fmtInt(d)} mm`;
      stat('weight').textContent = `≈ ${Math.round(n * (V.emptyKg + 9 * V.etbKg))} kg`;
      if (price && stat('price')) {
        const disc = discountFor(n);
        stat('price').textContent = money(Math.round(n * price * (1 - disc)));
        const next = tiers.slice().reverse().find(([q]) => q > n);
        stat('saving').textContent = disc
          ? `Remise mur −${Math.round(disc * 100)} % (−${money(Math.round(n * price * disc))})`
          : next ? `Remise −${next[1]} % dès ${next[0]} modules` : '';
      }
      $$('[data-step]', root).forEach(b => {
        const k = b.dataset.step, v = cfg[k] + Number(b.dataset.d);
        b.disabled = v < 1 || v > cfg.max[k];
      });
      drawWall($('[data-wall-plan]', root), cols, rows);
    };

    $$('[data-step]', root).forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.step;
      cfg[k] = Math.min(cfg.max[k], Math.max(1, cfg[k] + Number(b.dataset.d)));
      update();
    }));

    const add = $('[data-config-add]', root);
    add?.addEventListener('click', async () => {
      const n = cfg.cols * cfg.rows;
      add.disabled = true;
      try {
        await cartAdd([{ id: Number(root.dataset.variant), quantity: n }]);
        toast(`${n} Vault 3×3 ajouté${n > 1 ? 's' : ''} au panier`);
        openCart();
      } catch (e) {
        toast(e.message);
      } finally {
        add.disabled = false;
      }
    });
    update();
  }

  /* ---------- Panier (API AJAX Shopify) ---------- */
  async function cartRequest(url, body) {
    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.description || data.message || 'Impossible de mettre à jour le panier.');
    return data;
  }
  const cartGet = () => cartRequest(`${AV.routes.cart}.js`);
  const cartAdd = items => cartRequest(`${AV.routes.cartAdd}.js`, { items }).then(refreshCart);
  const cartChange = (key, quantity) => cartRequest(`${AV.routes.cartChange}.js`, { id: key, quantity }).then(renderCart);

  function renderCart(cart) {
    const count = $('#cartCount');
    if (count) {
      count.textContent = cart.item_count;
      count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump');
    }
    const list = $('#cartItems');
    if (!list) return cart;
    list.innerHTML = cart.items.length ? cart.items.map(item => `
      <div class="cart-item">
        <span class="cart-item__name">${esc(item.product_title)}${item.variant_title && !item.product_has_only_default_variant ? `<small>${esc(item.variant_title)}</small>` : ''}</span>
        <span class="cart-item__price">${item.original_line_price !== item.final_line_price ? `<s>${money(item.original_line_price)}</s>` : ''}${money(item.final_line_price)}</span>
        <div class="cart-item__qty">
          <button data-key="${esc(item.key)}" data-qty="${item.quantity - 1}" aria-label="Retirer un">−</button>
          <span>${item.quantity}</span>
          <button data-key="${esc(item.key)}" data-qty="${item.quantity + 1}" aria-label="Ajouter un">+</button>
        </div>
        <button class="cart-item__remove" data-key="${esc(item.key)}" data-qty="0">Supprimer</button>
        ${(item.line_level_discount_allocations || []).map(d => `<span class="cart-item__discount">${esc(d.discount_application.title)} −${money(d.amount)}</span>`).join('')}
      </div>`).join('') +
      (cart.cart_level_discount_applications || []).map(d => `<div class="cart-item"><span class="cart-item__name">${esc(d.title)}</span><span class="cart-item__price">−${money(d.total_allocated_amount)}</span></div>`).join('')
      : '<p class="cart__empty">Votre panier est vide.</p>';
    $('#cartTotal').textContent = money(cart.total_price);
    $('#checkout').classList.toggle('is-disabled', !cart.item_count);
    return cart;
  }
  const refreshCart = () => cartGet().then(renderCart);

  const drawer = () => $('#cart');
  function openCart() {
    const d = drawer(); if (!d) return;
    d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false');
    $('#overlay').hidden = false;
    $('#cartClose').focus();
  }
  function closeCart() {
    const d = drawer(); if (!d) return;
    d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true');
    $('#overlay').hidden = true;
  }

  function initCart() {
    if (!drawer()) return;
    // Sur la page panier, le lien mène à la page ; ailleurs il ouvre le tiroir
    $('#cartOpen')?.addEventListener('click', e => {
      if (document.body.classList.contains('template-cart')) return;
      e.preventDefault();
      refreshCart().catch(() => {});
      openCart();
    });
    $('#cartClose').addEventListener('click', closeCart);
    $('#overlay').addEventListener('click', closeCart);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

    $('#cartItems').addEventListener('click', e => {
      const btn = e.target.closest('[data-key]');
      if (!btn) return;
      btn.disabled = true;
      cartChange(btn.dataset.key, Number(btn.dataset.qty)).catch(err => toast(err.message));
    });

    // Formulaires « Ajouter au panier » : envoi AJAX, repli sur l'envoi classique sans JS
    document.addEventListener('submit', async e => {
      const form = e.target.closest('form[data-ajax-cart]');
      if (!form) return;
      e.preventDefault();
      const fd = new FormData(form);
      const btn = form.querySelector('[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        await cartAdd([{ id: Number(fd.get('id')), quantity: Math.max(1, Number(fd.get('quantity')) || 1) }]);
        openCart();
      } catch (err) {
        toast(err.message);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  /* ---------- Fiche produit ---------- */
  function initProduct() {
    $$('[data-qty-step]').forEach(btn => btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      input.value = Math.max(1, (Number(input.value) || 1) + Number(btn.dataset.qtyStep));
    }));
    $$('[data-variant-select]').forEach(sel => sel.addEventListener('change', () => {
      const opt = sel.selectedOptions[0];
      const form = sel.closest('form');
      const price = $('[data-product-price] [data-price]');
      if (price) price.textContent = opt.dataset.price;
      const submit = form.querySelector('[type="submit"]');
      const available = opt.dataset.available === 'true';
      submit.disabled = !available;
      submit.textContent = available ? 'Ajouter au panier' : 'Épuisé';
      const url = new URL(location.href);
      url.searchParams.set('variant', sel.value);
      history.replaceState(null, '', url);
    }));
  }

  /* ---------- UI générale ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2600);
  }

  function initUI() {
    const header = $('.header'), burger = $('#burger'), nav = $('#nav');
    if (header) {
      const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 10);
      addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }
    burger?.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', open);
      nav.classList.toggle('is-open', open);
    });
    nav?.addEventListener('click', e => {
      if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
    });

    // Dans l'éditeur de thème, tout reste visible
    const io = !window.Shopify?.designMode && 'IntersectionObserver' in window && new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    $$('.reveal').forEach(el => (io ? io.observe(el) : el.classList.add('is-visible')));

    $$('[data-toggle-recover]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      $('#recover')?.classList.toggle('is-open');
    }));
  }

  function init() {
    initArt();
    initHero();
    $$('[data-wall-config]').forEach(initConfig);
    initCart();
    initProduct();
    initUI();
  }
  document.addEventListener('DOMContentLoaded', init);
  // Éditeur de thème : réinitialiser une section rechargée
  document.addEventListener('shopify:section:load', e => {
    initArt(e.target); initHero(e.target); $$('[data-wall-config]', e.target).forEach(initConfig);
    $$('.reveal', e.target).forEach(el => el.classList.add('is-visible'));
  });
})();
