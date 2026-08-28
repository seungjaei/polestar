/* ============================================================
   POLESTAR — main.js (index.html only)
   SPA router (home/lookbook/detail) + wheel/background sync +
   product detail add-to-cart. Login modal, header state, and
   cart data all come from js/common.js (window.Polestar), shared
   with the standalone pages (signup/cart/checkout/mypage/support).
   ============================================================ */
(() => {
'use strict';

/* ---------------------------------------------------------
   0. SHARED DATA / UTILS (js/common.js — window.Polestar)
--------------------------------------------------------- */
const {
  BRANDS, BRAND_ORDER, COLORS, SIZES, findProduct,
  $, $all, won, showToast
} = window.Polestar;

let currentUser = null;

/* ---------------------------------------------------------
   1. PROMO POPUPS
--------------------------------------------------------- */
const POPUP_DATA = [
  { id: 'randombox', tag: 'LIMITED DROP', title: 'POLESTAR RANDOM BOX', desc: '4대 아티스트 브랜드 시그니처 아이템 랜덤 구성', price: '150,000 KRW' },
  { id: 'special31', tag: 'PROMOTION', title: 'ARTIST DROPS 3+1', desc: '랜덤박스 3개 구매 시 1개 추가 무료 증정', price: '3+1 SPECIAL DEAL' },
  { id: 'mileage', tag: 'MEMBERSHIP', title: 'HIGH-VALUE REWARD', desc: '30만원 이상 구매 시 추가 마일리지 적립', price: '+45,000 M REWARD' }
];

function initPopups() {
  const root = $('#promo-popups');
  root.innerHTML = POPUP_DATA.map(p => `
    <div class="promo-card" id="popup-${p.id}" data-popup="${p.id}">
      <button class="promo-card__close" data-action="close-popup" data-popup="${p.id}">✕</button>
      <div>
        <div class="promo-card__tag">${p.tag}</div>
        <div class="promo-card__title">${p.title}</div>
        <div class="promo-card__desc">${p.desc}</div>
      </div>
      <div class="promo-card__footer">
        <button class="promo-card__hide" data-action="hide-today-popup" data-popup="${p.id}">오늘 하루 보지 않음</button>
      </div>
      <div class="promo-card__price">${p.price}</div>
    </div>
  `).join('');

  setTimeout(() => {
    POPUP_DATA.forEach(p => {
      const hideUntil = Number(localStorage.getItem('polestar_popup_hide_' + p.id) || 0);
      if (Date.now() < hideUntil) return;
      $('#popup-' + p.id)?.classList.add('is-visible');
    });
  }, 1000);

  document.addEventListener('click', e => {
    if (!window.matchMedia('(max-width: 560px)').matches) return;
    if (root.contains(e.target)) return;
    $all('.promo-card.is-visible', root).forEach(card => card.classList.remove('is-visible'));
  });
}

function closePopup(id) {
  $('#popup-' + id)?.classList.remove('is-visible');
}
function hideTodayPopup(id) {
  localStorage.setItem('polestar_popup_hide_' + id, String(Date.now() + 24 * 60 * 60 * 1000));
  closePopup(id);
}

/* ---------------------------------------------------------
   2. HERO WHEEL + BACKGROUND SYNC
--------------------------------------------------------- */
const WHEEL_BASE_ANGLE = { 0: 315, 1: 45, 2: 135, 3: 225 };
let wheelStart = null, wheelPausedAccum = 0, wheelPauseStart = null;

function initWheel() {
  const wheel = $('#wheel');
  wheel.innerHTML = BRAND_ORDER.map((key, i) => {
    const b = BRANDS[key];
    return `
      <div class="wheel__wedge" data-pos="${i}" data-brand="${key}" data-action="nav-brand">
        <img class="wheel__logo" src="${b.logo}" alt="${b.name}">
      </div>
    `;
  }).join('');

  const bg = $('#hero-bg');
  bg.innerHTML = BRAND_ORDER.map(key => `
    <div class="hero-bg__layer" data-brand="${key}" style="background-image:url('${BRANDS[key].slider}')"></div>
  `).join('') + `<div class="hero-bg__dim"></div>`;

  const wrap = $('.wheel-wrap');
  wrap.addEventListener('mouseenter', () => {
    wheel.classList.add('is-paused');
    wheelPauseStart = performance.now();
  });
  wrap.addEventListener('mouseleave', () => {
    wheel.classList.remove('is-paused');
    if (wheelPauseStart) { wheelPausedAccum += performance.now() - wheelPauseStart; wheelPauseStart = null; }
  });

  wheelStart = performance.now();
  requestAnimationFrame(syncWheelBackground);
}

let currentActiveBrand = null;
function syncWheelBackground() {
  const now = wheelPauseStart || performance.now();
  const elapsed = now - wheelStart - wheelPausedAccum;
  const angle = ((elapsed / 40000) * 360) % 360;

  let best = null, bestDist = 999;
  BRAND_ORDER.forEach((key, i) => {
    const display = (WHEEL_BASE_ANGLE[i] + angle) % 360;
    const dist = Math.min(display, 360 - display);
    if (dist < bestDist) { bestDist = dist; best = key; }
  });

  if (best !== currentActiveBrand) {
    currentActiveBrand = best;
    $all('.hero-bg__layer').forEach(el => {
      el.classList.toggle('is-active', el.dataset.brand === best);
    });
  }
  requestAnimationFrame(syncWheelBackground);
}

/* ---------------------------------------------------------
   3. BRAND SHOWCASE (fullscreen slides)
--------------------------------------------------------- */
function initShowcase() {
  const root = $('#brand-showcase-root');
  root.innerHTML = BRAND_ORDER.map((key, i) => {
    const b = BRANDS[key];
    return `
      <section class="showcase" id="showcase-${key}" data-brand="${key}">
        <img class="showcase__visual" src="${b.artist}" alt="${b.name} artist">
        <div class="showcase__dim"></div>
        <div class="showcase__content">
          <div class="showcase__story-col">
            <div class="showcase__story">
              <div class="showcase__label">${b.label}</div>
              <p class="showcase__desc">${b.desc}</p>
              <p class="showcase__extra">${b.descExtra}</p>
            </div>
            <div class="showcase__badge">
              <div class="showcase__title">${b.name}</div>
              <div class="showcase__director">${b.director}</div>
              <button class="showcase__btn" data-action="nav-brand" data-brand="${key}">VIEW LOOKBOOK ➔</button>
            </div>
          </div>
          <div class="showcase__phone-wrap">
            <div class="showcase__phone" data-action="open-video-modal" data-brand="${key}">
              <div class="phone-notch"></div>
              <video muted playsinline data-brand="${key}"></video>
              <div class="phone-home-bar"></div>
              <button class="showcase__mute" data-action="toggle-mute" data-brand="${key}">UNMUTE</button>
            </div>
            ${i === 0 ? `<span class="showcase__swipe-hint" aria-hidden="true">➔</span>` : ''}
          </div>
        </div>
      </section>
    `;
  }).join('');

  BRAND_ORDER.forEach(key => {
    const b = BRANDS[key];
    const video = root.querySelector(`video[data-brand="${key}"]`);
    let idx = 0;
    video.src = b.screens[0];
    video.addEventListener('ended', () => {
      idx = (idx + 1) % b.screens.length;
      video.src = b.screens[idx];
      video.play().catch(() => {});
    });
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target.querySelector('video');
      if (!video) return;
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
  }, { threshold: 0.5 });

  $all('.showcase', root).forEach(el => io.observe(el));

  // Mobile-only swipe hint on the first (iabstudio) card — dismiss it
  // for good the moment the user actually swipes.
  const hint = root.querySelector('.showcase__swipe-hint');
  if (hint) {
    const onSwipe = () => {
      if (root.scrollLeft > 10) {
        hint.remove();
        root.removeEventListener('scroll', onSwipe);
      }
    };
    root.addEventListener('scroll', onSwipe, { passive: true });
  }
}

function toggleMute(brandKey, btn) {
  const video = $(`#brand-showcase-root video[data-brand="${brandKey}"]`);
  if (!video) return;
  video.muted = !video.muted;
  btn.textContent = video.muted ? 'UNMUTE' : 'MUTE';
}

/* Mobile-only: tapping the artist card's phone frame opens an enlarged
   video modal (iPhone-frame + muted autoplay) — desktop keeps the
   always-visible inline showcase, no modal needed there. */
function openVideoModal(brandKey) {
  if (!window.matchMedia('(max-width: 900px)').matches) return;
  const b = BRANDS[brandKey];
  const sourceVideo = $(`#brand-showcase-root video[data-brand="${brandKey}"]`);
  const modalVideo = $('#modal-video-el');
  modalVideo.src = (sourceVideo && (sourceVideo.currentSrc || sourceVideo.src)) || b.screens[0];
  modalVideo.muted = true;
  Polestar.openModalEl('modal-video');
  modalVideo.play().catch(() => {});
}
function closeVideoModal() {
  $('#modal-video-el')?.pause();
}

/* ---------------------------------------------------------
   4. LOOKBOOK VIEW
--------------------------------------------------------- */
function renderLookbook(brandKey) {
  const b = BRANDS[brandKey];
  const view = $('#view-lookbook');
  view.innerHTML = `
    <div class="lookbook-header">
      <div class="breadcrumb">
        <a href="#/" data-action="nav-home">HOME</a> &gt; ${b.name} &gt; LOOKBOOK
      </div>
      <div class="collabo-header">
        <img class="brand-logo" src="${b.logo}" alt="${b.name}">
        <span class="collabo-header__x">X</span>
        <img class="polestar-logo" src="images/logo/polestar1.jpg" alt="POLESTAR">
      </div>
    </div>
    <div class="polaroid-grid">
      ${b.products.map(p => `
        <div class="polaroid-card" data-action="nav-product" data-product="${p.id}">
          <img src="images/${b.key}/${p.model}.${p.ext}" alt="${p.name}">
          <div class="polaroid-card__meta">
            <div class="polaroid-card__name">${p.name}</div>
            <div class="polaroid-card__price">${won(p.price)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ---------------------------------------------------------
   5. PRODUCT DETAIL VIEW
--------------------------------------------------------- */
function reviewsFor(product) {
  return [
    {
      user: 'streetlover_kr', rating: 5, option: `${COLORS[0]} / M`,
      body: `${product.name} 실착 후기입니다. 핏도 예쁘고 원단 퀄리티가 가격대비 훌륭해요. 재구매 의사 있습니다.`,
      like: 24,
      reply: '소중한 후기 감사합니다! 앞으로도 좋은 컬렉션으로 찾아뵙겠습니다.'
    },
    {
      user: 'hiphop_archive', rating: 4, option: `${COLORS[1]} / L`,
      body: '디자인은 정말 만족스러운데 배송이 하루 정도 늦어서 아쉬웠어요. 그래도 상품 자체는 강추합니다.',
      like: 11,
      reply: null
    }
  ];
}

function renderDetail(productId) {
  const found = findProduct(productId);
  if (!found) { navigate('#/', true); return; }
  const { product: p, brand: b } = found;
  const view = $('#view-detail');

  view.innerHTML = `
    <div class="detail-nav-wrap">
      <div class="breadcrumb" style="padding-left:0;margin-bottom:20px;">
        <a href="#/" data-action="nav-home">HOME</a> &gt;
        <a href="#/brand/${b.key}" data-action="nav-brand" data-brand="${b.key}">${b.name}</a> &gt; ${p.name}
      </div>
      <button class="btn-back" data-action="nav-brand" data-brand="${b.key}">← BACK TO LOOKBOOK</button>
    </div>

    <div class="buy-zone">
      <img class="buy-zone__image" src="images/${b.key}/${p.model}.${p.ext}" alt="${p.name}">
      <div class="buy-form" data-product="${p.id}">
        <div class="buy-zone__brand">${b.name.toUpperCase()}</div>
        <div class="buy-zone__title">${p.name}</div>
        <div class="buy-zone__price">${won(p.price)}</div>

        <select class="select-field" data-role="color">
          <option value="">컬러 선택</option>
          ${COLORS.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <select class="select-field" data-role="size">
          <option value="">사이즈 선택</option>
          ${SIZES.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>

        <div class="qty-counter">
          <button type="button" data-action="qty-minus">−</button>
          <span data-role="qty">1</span>
          <button type="button" data-action="qty-plus">＋</button>
        </div>

        <div class="total-row">
          <span class="total-row__label">TOTAL</span>
          <span class="total-row__amount" data-role="total">${won(p.price)}</span>
        </div>

        <div class="btn-group">
          <button class="btn-cart" type="button" data-action="add-cart">장바구니 담기</button>
          <button class="btn-buy" type="button" data-action="buy-now">바로 구매하기</button>
          <button class="btn-cart" type="button" data-action="toggle-wishlist">${Polestar.isWishlisted(p.id) ? '♥ 위시리스트 담김' : '♡ 위시리스트 담기'}</button>
        </div>
      </div>
    </div>

    <div class="model-info-card">
      <div class="model-info-card__title">MODEL SIZE INFO</div>
      <div class="model-info-card__text">
        MODEL SIZE : 남성 Height 175cm / Weight 63kg / Top 77~88 / Bottom 28(S) / M size 착용 |
        여성 Height 168cm / Weight 48kg / Top 44~55 / Bottom 25(S) / S size 착용
      </div>
    </div>

    <div class="detail-lookbook">
      ${p.cloth.map(f => `<img src="images/${b.key}/${f}" alt="${p.name} cloth">`).join('')}
      ${p.content.map(f => `<img src="images/${b.key}/${f}" alt="${p.name} content">`).join('')}
    </div>

    <div class="size-guide">
      <div class="size-guide__title">SIZE &amp; FABRIC GUIDE</div>
      <table>
        <thead><tr><th>SIZE</th><th>어깨너비</th><th>가슴단면</th><th>총장</th><th>소매길이</th></tr></thead>
        <tbody>
          <tr><td>S</td><td>45cm</td><td>52cm</td><td>68cm</td><td>60cm</td></tr>
          <tr><td>M</td><td>47cm</td><td>55cm</td><td>70cm</td><td>62cm</td></tr>
          <tr><td>L</td><td>49cm</td><td>58cm</td><td>72cm</td><td>64cm</td></tr>
          <tr><td>XL</td><td>51cm</td><td>61cm</td><td>74cm</td><td>66cm</td></tr>
        </tbody>
      </table>
    </div>

    <div class="reviews">
      <div class="reviews__title">PRODUCT REVIEW</div>
      ${reviewsFor(p).map(r => `
        <div class="review-card">
          <div class="review-card__head">
            <span class="review-card__user">${r.user}</span>
            <span class="review-card__meta">${p.name} · ${r.option}</span>
          </div>
          <div class="review-card__rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
          <div class="review-card__body">${r.body}</div>
          <div class="review-card__like">👍 좋아요 ${r.like}</div>
          ${r.reply ? `<div class="review-card__reply"><b>POLESTAR 관리자</b><br>${r.reply}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  currentUnitPrice = p.price;
  Polestar.addRecentlyViewed(p.id);

  const form = $('.buy-form', view);
  form.addEventListener('click', e => {
    const target = e.target.closest('[data-action]');
    const action = target?.dataset.action;
    if (!action) return;
    if (action === 'qty-minus') updateQty(form, -1);
    if (action === 'qty-plus') updateQty(form, 1);
    if (action === 'add-cart') tryAddToCart(form, p, b, false);
    if (action === 'buy-now') tryAddToCart(form, p, b, true);
    if (action === 'toggle-wishlist') {
      const nowIn = Polestar.toggleWishlist(p.id);
      target.textContent = nowIn ? '♥ 위시리스트 담김' : '♡ 위시리스트 담기';
      showToast(nowIn ? '위시리스트에 담았습니다' : '위시리스트에서 제거했습니다');
    }
  });
  $all('select', form).forEach(sel => sel.addEventListener('change', () => updateTotal(form, p.price)));
}

function updateQty(form, delta) {
  const el = $('[data-role="qty"]', form);
  const next = Math.max(1, Number(el.textContent) + delta);
  el.textContent = String(next);
  updateTotal(form, currentUnitPrice);
}
let currentUnitPrice = 0;
function updateTotal(form, unitPrice) {
  currentUnitPrice = unitPrice;
  const qty = Number($('[data-role="qty"]', form).textContent);
  $('[data-role="total"]', form).textContent = won(unitPrice * qty);
}

async function tryAddToCart(form, product, brand, isBuyNow) {
  const color = $('[data-role="color"]', form).value;
  const size = $('[data-role="size"]', form).value;
  const qty = Number($('[data-role="qty"]', form).textContent);
  if (!color || !size) { showToast('옵션을 선택해 주세요'); return; }
  await Polestar.addToCart({
    productId: product.id,
    name: product.name,
    price: product.price,
    img: `images/${brand.key}/${product.model}.${product.ext}`,
    color, size, qty
  }, currentUser);

  if (isBuyNow) {
    location.href = 'cart.html';
    return;
  }
  const cart = await Polestar.loadCart(currentUser);
  $('#cart-count').textContent = String(cart.reduce((s, c) => s + c.qty, 0));
  showToast('장바구니에 담았습니다');
}

/* ---------------------------------------------------------
   6. FLOATING TOP + HEADER SCROLL HIDE
--------------------------------------------------------- */
function initFloatingTop() {
  const btn = $('#floating-top');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initHeaderScrollHide() {
  const header = $('#site-header');
  const showcaseRoot = $('#brand-showcase-root');
  if (!header || !showcaseRoot) return;
  window.addEventListener('scroll', () => {
    // Lookbook/detail hide #view-home (display:none), which collapses
    // showcaseRoot's rect to all-zeros — that reads as "top <= 4" and
    // would hide the header on every scroll there. Only the home view
    // should ever hide the header.
    if (document.body.classList.contains('is-subpage')) {
      header.classList.remove('header--hidden');
      return;
    }
    // small tolerance — natural scroll positions rarely land on an exact
    // integer 0px boundary, so a strict `<= 0` check can miss by 1-2px
    const entered = showcaseRoot.getBoundingClientRect().top <= 4;
    header.classList.toggle('header--hidden', entered);
  }, { passive: true });
}

/* ---------------------------------------------------------
   7. ROUTER (home / lookbook / detail)
--------------------------------------------------------- */
function parseHash(hash) {
  const h = (hash || '#/').replace(/^#/, '');
  const parts = h.split('/').filter(Boolean);
  if (parts[0] === 'brand' && parts[1]) return { view: 'lookbook', brand: parts[1] };
  if (parts[0] === 'product' && parts[1]) return { view: 'detail', productId: parts[1] };
  return { view: 'home' };
}

function render(state) {
  const home = $('#view-home'), lookbook = $('#view-lookbook'), detail = $('#view-detail');
  home.hidden = state.view !== 'home';
  lookbook.hidden = state.view !== 'lookbook';
  detail.hidden = state.view !== 'detail';

  document.body.classList.toggle('is-subpage', state.view !== 'home');
  document.documentElement.classList.toggle('is-home-snap', state.view === 'home');

  // Lookbook/detail already render their own in-page .breadcrumb — the
  // header's #breadcrumb stays empty everywhere to avoid showing the
  // same "HOME > BRAND > ..." path twice.
  if (state.view === 'lookbook') renderLookbook(state.brand);
  else if (state.view === 'detail') renderDetail(state.productId);

  window.scrollTo(0, 0);
}

function navigate(hash, replace) {
  const state = parseHash(hash);
  render(state);
  if (replace) history.replaceState(state, '', hash);
  else history.pushState(state, '', hash);
}

window.addEventListener('popstate', e => {
  render(e.state || parseHash(location.hash));
});

/* ---------------------------------------------------------
   8. EVENT DELEGATION (page-specific: nav / popups / find modal)
--------------------------------------------------------- */
function initEvents() {
  document.addEventListener('click', e => {
    const target = e.target.closest('[data-action], [data-find-tab], .find-method');
    if (!target) return;
    if (target.tagName === 'A') e.preventDefault();
    const action = target.dataset.action;

    switch (action) {
      case 'nav-home': navigate('#/'); break;
      case 'nav-brand': e.preventDefault(); navigate('#/brand/' + target.dataset.brand); break;
      case 'nav-product': e.preventDefault(); navigate('#/product/' + target.dataset.product); break;

      case 'open-findid': Polestar.openModalEl('modal-find'); switchFindTab('id'); break;
      case 'open-findpw': Polestar.openModalEl('modal-find'); switchFindTab('pw'); break;

      case 'close-popup': closePopup(target.dataset.popup); break;
      case 'hide-today-popup': hideTodayPopup(target.dataset.popup); break;

      case 'toggle-mute': toggleMute(target.dataset.brand, target); break;
      case 'open-video-modal': openVideoModal(target.dataset.brand); break;
      case 'close-modal': closeVideoModal(); Polestar.closeAllModals(); break;
    }

    if (target.dataset.findTab) switchFindTab(target.dataset.findTab);
    if (target.classList.contains('find-method')) {
      target.parentElement.querySelectorAll('.find-method').forEach(b => b.classList.remove('is-active'));
      target.classList.add('is-active');
    }
  });

  $('#modal-backdrop').addEventListener('click', closeVideoModal);
}

function switchFindTab(which) {
  $all('.tab-btn', $('#modal-find')).forEach(b => b.classList.toggle('is-active', b.dataset.findTab === which));
  $('#find-id-panel').hidden = which !== 'id';
  $('#find-pw-panel').hidden = which !== 'pw';
  $('#find-title').textContent = which === 'id' ? '아이디 찾기' : '비밀번호 찾기';
}

/* ---------------------------------------------------------
   9. INIT
--------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  initPopups();
  initWheel();
  initShowcase();
  initFloatingTop();
  initHeaderScrollHide();
  initEvents();
  Polestar.wireHeaderEvents({ onLogoClick: () => navigate('#/') });
  currentUser = await Polestar.mountHeader();
  navigate(location.hash || '#/', true);
});

})();
