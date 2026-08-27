/* ============================================================
   POLESTAR — main.js
   SPA router + wheel/background sync + commerce mock (no backend)
   ============================================================ */
(() => {
'use strict';

/* ---------------------------------------------------------
   0. SHARED DATA / UTILS (js/common.js — window.Polestar)
--------------------------------------------------------- */
const {
  BRANDS, BRAND_ORDER, COLORS, SIZES, findProduct, FAQ_DATA,
  $, $all, won, showToast
} = window.Polestar;

/* ---------------------------------------------------------
   2. PROMO POPUPS
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
   3. HERO WHEEL + BACKGROUND SYNC
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
   4. BRAND SHOWCASE (fullscreen slides)
--------------------------------------------------------- */
function initShowcase() {
  const root = $('#brand-showcase-root');
  root.innerHTML = BRAND_ORDER.map(key => {
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
            </div>
            <div class="showcase__badge">
              <div class="showcase__title">${b.name}</div>
              <div class="showcase__director">${b.director}</div>
              <button class="showcase__btn" data-action="nav-brand" data-brand="${key}">VIEW LOOKBOOK ➔</button>
            </div>
          </div>
          <div class="showcase__phone">
            <video muted playsinline data-brand="${key}"></video>
            <button class="showcase__mute" data-action="toggle-mute" data-brand="${key}">UNMUTE</button>
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
}

function toggleMute(brandKey, btn) {
  const video = $(`#brand-showcase-root video[data-brand="${brandKey}"]`);
  if (!video) return;
  video.muted = !video.muted;
  btn.textContent = video.muted ? 'UNMUTE' : 'MUTE';
}

/* ---------------------------------------------------------
   5. LOOKBOOK VIEW
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
   6. PRODUCT DETAIL VIEW
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

  const form = $('.buy-form', view);
  form.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'qty-minus') updateQty(form, -1);
    if (action === 'qty-plus') updateQty(form, 1);
    if (action === 'add-cart') tryAddToCart(form, p, b, false);
    if (action === 'buy-now') tryAddToCart(form, p, b, true);
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
  await addToCart({
    productId: product.id,
    name: product.name,
    price: product.price,
    img: `images/${brand.key}/${product.model}.${product.ext}`,
    color, size, qty
  });
  if (isBuyNow) { openCart(); showToast('바로 구매하기로 장바구니에 담았습니다'); }
  else showToast('장바구니에 담았습니다');
}

/* ---------------------------------------------------------
   7. CART (data layer lives in common.js — window.Polestar;
   these are thin page-local wrappers that supply currentUser
   and re-render the drawer after each mutation)
--------------------------------------------------------- */
let cartCache = [];

async function addToCart(item) {
  await Polestar.addToCart(item, currentUser);
  await renderCartUI();
}
async function removeFromCart(idx) {
  await Polestar.removeCartItem(idx, cartCache[idx], currentUser);
  await renderCartUI();
}
async function changeCartQty(idx, delta) {
  await Polestar.changeCartQty(idx, cartCache[idx], delta, currentUser);
  await renderCartUI();
}

async function renderCartUI() {
  const cart = await Polestar.loadCart(currentUser);
  cartCache = cart;
  const count = cart.reduce((s, c) => s + c.qty, 0);
  $('#cart-count').textContent = String(count);

  const itemsEl = $('#cart-items');
  if (cart.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty">장바구니가 비어 있습니다.</div>`;
  } else {
    itemsEl.innerHTML = cart.map((c, i) => `
      <div class="cart-item">
        <img src="${c.img}" alt="${c.name}">
        <div style="flex:1;">
          <div class="cart-item__name">${c.name}</div>
          <div class="cart-item__opt">${c.color} / ${c.size}</div>
          <div class="cart-item__row">
            <div class="cart-item__qty">
              <button data-action="cart-qty-minus" data-idx="${i}">−</button>
              <span>${c.qty}</span>
              <button data-action="cart-qty-plus" data-idx="${i}">＋</button>
            </div>
            <button class="cart-item__remove" data-action="cart-remove" data-idx="${i}">삭제</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const shipping = cart.length ? 3000 : 0;
  $('#cart-summary').innerHTML = `
    <div class="cart-summary__row"><span>상품 금액</span><span>${won(subtotal)}</span></div>
    <div class="cart-summary__row"><span>배송비</span><span>${won(shipping)}</span></div>
    <div class="cart-summary__row cart-summary__total"><span>총 결제 금액</span><span>${won(subtotal + shipping)}</span></div>
    <button class="cart-checkout" data-action="checkout" ${cart.length ? '' : 'disabled'}>주문하기 / 결제하기</button>
  `;
}

function openCart() {
  $('#cart-drawer').classList.add('is-open');
  $('#modal-backdrop').hidden = false;
}
function closeCart() {
  $('#cart-drawer').classList.remove('is-open');
  if (!isAnyModalOpen()) $('#modal-backdrop').hidden = true;
}

async function doCheckout() {
  if (!currentUser) {
    closeCart();
    openModal('modal-login');
    showToast('주문하려면 로그인이 필요합니다');
    return;
  }
  const cart = await Polestar.loadCart(currentUser);
  if (!cart.length) return;

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const shipping = 3000;
  const orderNo = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const { data: order, error } = await sb.from('orders').insert({
    order_no: orderNo,
    user_id: currentUser.id,
    subtotal, shipping,
    total: subtotal + shipping,
    pay_method: '신용카드',
    status: '결제완료'
  }).select().single();

  if (error) { console.error(error); showToast('주문 처리 중 오류가 발생했습니다'); return; }

  const itemsPayload = cart.map(c => ({
    order_id: order.id, product_id: c.productId, product_name: c.name,
    color: c.color, size: c.size, qty: c.qty, price: c.price
  }));
  const { error: itemsError } = await sb.from('order_items').insert(itemsPayload);
  if (itemsError) console.error(itemsError);

  await sb.from('cart_items').delete().eq('user_id', currentUser.id);
  await renderCartUI();
  closeCart();
  showToast('주문이 완료되었습니다');
}

/* ---------------------------------------------------------
   8. AUTH (Supabase Auth + profiles)
--------------------------------------------------------- */
let currentUser = null;
let currentProfile = null;

function isLoggedIn() { return !!currentUser; }

async function refreshAuthState() {
  const { user, profile } = await Polestar.getSessionAndProfile();
  currentUser = user;
  currentProfile = profile;
  if (currentUser) await Polestar.mergeGuestCartIntoDb(currentUser);
  updateAuthUI();
}

async function doLogout() {
  await Polestar.signOut();
  currentUser = null;
  currentProfile = null;
  updateAuthUI();
  await renderCartUI();
  showToast('로그아웃 되었습니다');
}

async function checkUsernameAvailability() {
  const val = $('#join-id').value.trim();
  if (val.length < 8 || val.length > 13) { showToast('아이디는 8~13자로 입력해 주세요'); return; }
  const { data: exists, error } = await Polestar.checkUsernameExists(val);
  if (error) { console.error(error); showToast('중복확인 중 오류가 발생했습니다'); return; }
  showToast(exists ? '이미 사용 중인 아이디입니다' : '사용 가능한 아이디입니다');
}

function updateAuthUI() {
  const loggedIn = isLoggedIn();
  $('#btn-login').textContent = loggedIn ? 'LOGOUT' : 'LOGIN';
  $('#btn-join').style.display = loggedIn ? 'none' : '';
  $('#btn-login').dataset.action = loggedIn ? 'logout' : 'open-login';
}

const MODAL_IDS = ['modal-login', 'modal-join', 'modal-find', 'modal-mypage', 'modal-cs'];
function isAnyModalOpen() { return MODAL_IDS.some(id => !$('#' + id).hidden); }

function openModal(id) {
  MODAL_IDS.forEach(m => { $('#' + m).hidden = (m !== id); });
  $('#modal-backdrop').hidden = false;
}
function closeAllModals() {
  MODAL_IDS.forEach(m => { $('#' + m).hidden = true; });
  if (!$('#cart-drawer').classList.contains('is-open')) $('#modal-backdrop').hidden = true;
}

let authTimerInterval = null;
function startAuthTimer() {
  clearInterval(authTimerInterval);
  let remain = 180;
  const el = $('#auth-timer');
  el.textContent = `인증번호가 발송되었습니다. 남은 시간 03:00`;
  authTimerInterval = setInterval(() => {
    remain--;
    const m = String(Math.floor(remain / 60)).padStart(2, '0');
    const s = String(remain % 60).padStart(2, '0');
    el.textContent = `인증번호가 발송되었습니다. 남은 시간 ${m}:${s}`;
    if (remain <= 0) { clearInterval(authTimerInterval); el.textContent = '인증 시간이 만료되었습니다. 다시 시도해 주세요.'; }
  }, 1000);
}

/* ---------------------------------------------------------
   9. MYPAGE
--------------------------------------------------------- */
async function renderMypage() {
  const modal = $('#modal-mypage');
  modal.innerHTML = `
    <button class="modal__close" data-action="close-modal">✕</button>
    <div class="mypage__loading" style="padding:60px 0;text-align:center;color:#888;">불러오는 중...</div>
  `;

  const { data: orders, error } = await sb.from('orders')
    .select('order_no,total,pay_method,status,created_at,order_items(product_name,color,size,qty,price)')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
  if (error) console.error(error);

  const rows = (orders || []).flatMap(o => (o.order_items || []).map(it => `
    <tr>
      <td>${o.order_no}</td><td>${o.created_at.slice(0, 10)}</td><td>${it.product_name}</td><td>${it.color} / ${it.size}</td>
      <td>${won(o.total)}</td><td>${o.pay_method}</td>
      <td><span class="status-badge ${o.status === '배송완료' ? 'status-badge--done' : ''}">${o.status}</span></td>
    </tr>
  `)).join('');

  const p = currentProfile;
  modal.innerHTML = `
    <button class="modal__close" data-action="close-modal">✕</button>
    <div class="mypage__profile">
      <div>
        <div class="mypage__name">${p?.name || p?.username || ''}</div>
        <div class="mypage__email">${p?.email || currentUser.email}</div>
      </div>
      <div class="mileage-badge">MILEAGE: ${(p?.mileage || 0).toLocaleString('ko-KR')} M</div>
    </div>
    <div class="footer__col-title" style="margin-bottom:12px;">ORDER HISTORY</div>
    <table class="data-table">
      <thead><tr><th>주문번호</th><th>주문일</th><th>상품명</th><th>옵션</th><th>결제금액</th><th>결제수단</th><th>배송상태</th></tr></thead>
      <tbody>
        ${rows || `<tr><td colspan="7" style="text-align:center;padding:24px;">주문 내역이 없습니다.</td></tr>`}
      </tbody>
    </table>
    <div style="display:flex; gap:16px; justify-content:flex-end;">
      <button class="text-btn" type="button">회원정보 수정</button>
      <button class="text-btn" type="button">회원탈퇴</button>
    </div>
  `;
}

/* ---------------------------------------------------------
   10. CS CENTER
--------------------------------------------------------- */
let csTab = 'inquiry';
let faqFilter = '전체';
let faqQuery = '';

function renderCS() {
  const modal = $('#modal-cs');
  modal.innerHTML = `
    <button class="modal__close" data-action="close-modal">✕</button>
    <div class="modal__title" style="text-align:left;">고객센터 / CS CENTER</div>
    <div class="tab-bar">
      <button class="tab-btn ${csTab === 'inquiry' ? 'is-active' : ''}" data-cs-tab="inquiry">1:1 문의하기</button>
      <button class="tab-btn ${csTab === 'history' ? 'is-active' : ''}" data-cs-tab="history">문의내역 보기</button>
      <button class="tab-btn ${csTab === 'faq' ? 'is-active' : ''}" data-cs-tab="faq">자주 묻는 질문</button>
    </div>
    <div id="cs-panel"></div>
  `;
  renderCSPanel();
}

function renderCSPanel() {
  const panel = $('#cs-panel');
  if (csTab === 'inquiry') {
    panel.innerHTML = `
      <select class="select-field">
        <option>배송</option><option>취소/환불</option><option>상품 문의</option><option>기타</option>
      </select>
      <input class="field" type="text" placeholder="문의 제목">
      <textarea class="field" style="height:120px; padding:12px 16px;" placeholder="문의 내용을 입력해 주세요"></textarea>
      <input class="field" type="file">
      <button class="submit-btn" type="button" data-action="submit-inquiry">문의 등록</button>
    `;
  } else if (csTab === 'history') {
    const items = [
      { title: '배송 지연 문의', status: 'answered', body: '주문하신 상품은 8/25 출고되어 8/27 도착 예정입니다.' },
      { title: '사이즈 교환 문의', status: 'pending', body: '' }
    ];
    panel.innerHTML = items.map((it, i) => `
      <div class="accordion-item" data-idx="${i}">
        <div class="accordion-q" data-action="toggle-accordion">
          <span>${it.title}</span>
          <span class="inquiry-badge ${it.status === 'answered' ? 'answered' : ''}">${it.status === 'answered' ? '답변 완료' : '답변 대기'}</span>
        </div>
        <div class="accordion-a">${it.status === 'answered' ? '<b>관리자 답변:</b> ' + it.body : '아직 답변이 등록되지 않았습니다.'}</div>
      </div>
    `).join('');
  } else {
    const cats = ['전체', '주문/결제', '배송', '교환/반품', '회원/기타'];
    const filtered = FAQ_DATA.filter(f =>
      (faqFilter === '전체' || f.cat === faqFilter) &&
      (f.q.includes(faqQuery) || f.a.includes(faqQuery))
    );
    panel.innerHTML = `
      <input class="faq-search" type="text" placeholder="궁금한 점을 검색해 보세요" value="${faqQuery}" data-role="faq-search">
      <div class="faq-filters">
        ${cats.map(c => `<button class="faq-filter-btn ${faqFilter === c ? 'is-active' : ''}" data-faq-cat="${c}">${c}</button>`).join('')}
      </div>
      ${filtered.map((f, i) => `
        <div class="accordion-item" data-idx="${i}">
          <div class="accordion-q" data-action="toggle-accordion"><span>Q. ${f.q}</span><span>+</span></div>
          <div class="accordion-a">A. ${f.a}</div>
        </div>
      `).join('') || '<div class="field-hint">검색 결과가 없습니다.</div>'}
    `;
    $('[data-role="faq-search"]', panel).addEventListener('input', e => {
      faqQuery = e.target.value; renderCSPanel();
    });
  }
}

/* ---------------------------------------------------------
   11. FLOATING TOP + SCROLL
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
    const entered = showcaseRoot.getBoundingClientRect().top <= 0;
    header.classList.toggle('header--hidden', entered);
  }, { passive: true });
}

/* ---------------------------------------------------------
   12. ROUTER
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

  const crumb = $('#breadcrumb');
  if (state.view === 'lookbook') {
    renderLookbook(state.brand);
    crumb.textContent = `HOME > ${BRANDS[state.brand]?.name.toUpperCase() || ''} > LOOKBOOK`;
  } else if (state.view === 'detail') {
    renderDetail(state.productId);
    const found = findProduct(state.productId);
    crumb.textContent = found ? `HOME > ${found.brand.name.toUpperCase()} > ${found.product.name}` : '';
  } else {
    crumb.textContent = '';
  }

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
   13. EVENT DELEGATION
--------------------------------------------------------- */
function initEvents() {
  document.addEventListener('click', e => {
    const target = e.target.closest('[data-action], [data-find-tab], [data-cs-tab], [data-faq-cat], .find-method');
    if (!target) return;
    if (target.tagName === 'A') e.preventDefault();
    const action = target.dataset.action;

    switch (action) {
      case 'nav-home': navigate('#/'); break;
      case 'nav-brand': e.preventDefault(); navigate('#/brand/' + target.dataset.brand); break;
      case 'nav-product': e.preventDefault(); navigate('#/product/' + target.dataset.product); break;

      case 'open-login': openModal('modal-login'); break;
      case 'logout': doLogout(); break;
      case 'open-join': openModal('modal-join'); break;
      case 'open-findid': openModal('modal-find'); switchFindTab('id'); break;
      case 'open-findpw': openModal('modal-find'); switchFindTab('pw'); break;
      case 'open-mypage':
        if (!isLoggedIn()) { openModal('modal-login'); showToast('로그인이 필요합니다'); break; }
        renderMypage(); openModal('modal-mypage'); break;
      case 'open-cs': renderCS(); openModal('modal-cs'); break;
      case 'close-modal': closeAllModals(); break;

      case 'open-cart': openCart(); break;
      case 'close-cart': closeCart(); break;

      case 'close-popup': closePopup(target.dataset.popup); break;
      case 'hide-today-popup': hideTodayPopup(target.dataset.popup); break;

      case 'toggle-mute': toggleMute(target.dataset.brand, target); break;

      case 'send-auth': startAuthTimer(); break;
      case 'check-id': checkUsernameAvailability(); break;
      case 'find-address': showToast('상세주소까지 직접 입력해 주세요'); break;
      case 'submit-inquiry': showToast('문의가 등록되었습니다'); break;

      case 'cart-qty-minus': changeCartQty(Number(target.dataset.idx), -1); break;
      case 'cart-qty-plus': changeCartQty(Number(target.dataset.idx), 1); break;
      case 'cart-remove': removeFromCart(Number(target.dataset.idx)); break;
      case 'checkout': doCheckout(); break;

      case 'toggle-accordion': {
        const item = target.closest('.accordion-item');
        item.classList.toggle('is-open');
        break;
      }
    }

    if (target.dataset.findTab) switchFindTab(target.dataset.findTab);
    if (target.dataset.csTab) { csTab = target.dataset.csTab; renderCS(); }
    if (target.dataset.faqCat) { faqFilter = target.dataset.faqCat; renderCSPanel(); }
    if (target.classList.contains('find-method')) {
      target.parentElement.querySelectorAll('.find-method').forEach(b => b.classList.remove('is-active'));
      target.classList.add('is-active');
    }
  });

  $('#modal-backdrop').addEventListener('click', () => { closeAllModals(); closeCart(); });

  $('#header-logo').addEventListener('click', () => navigate('#/'));

  $('#form-login').addEventListener('submit', async e => {
    e.preventDefault();
    const idOrEmail = $('#login-id').value.trim();
    const pw = $('#login-pw').value;
    if (!idOrEmail || !pw) return;

    let email = idOrEmail;
    if (!idOrEmail.includes('@')) {
      const { data: resolvedEmail, error: lookupError } = await sb.rpc('get_email_by_username', { p_username: idOrEmail });
      if (lookupError || !resolvedEmail) { showToast('아이디 또는 비밀번호가 올바르지 않습니다'); return; }
      email = resolvedEmail;
    }

    const { error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) {
      showToast(error.message.includes('Email not confirmed')
        ? '이메일 인증 후 로그인해 주세요'
        : '아이디 또는 비밀번호가 올바르지 않습니다');
      return;
    }

    await refreshAuthState();
    await renderCartUI();
    closeAllModals();
    showToast('로그인 되었습니다');
  });

  $('#form-join').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('#join-name').value.trim();
    const phone = $('#join-phone').value.trim();
    const emailId = $('#email-id').value.trim();
    const domain = $('#email-domain').value.trim();
    const username = $('#join-id').value.trim();
    const pw = $('#join-pw').value;
    const pwConfirm = $('#join-pw-confirm').value;
    const address = $('#join-address').value.trim();
    const addressDetail = $('#join-address-detail').value.trim();
    const marketingAgree = $('#join-marketing').checked;

    if (!name) { showToast('이름을 입력해 주세요'); return; }
    if (!emailId || !domain) { showToast('이메일을 입력해 주세요'); return; }
    if (username.length < 8 || username.length > 13) { showToast('아이디는 8~13자로 입력해 주세요'); return; }
    if (pw.length < 6) { showToast('비밀번호는 6자 이상 입력해 주세요'); return; }
    if (pw !== pwConfirm) { showToast('비밀번호가 일치하지 않습니다'); return; }

    const { data: dup, error: dupError } = await Polestar.checkUsernameExists(username);
    if (dupError) { showToast('회원가입 중 오류가 발생했습니다'); return; }
    if (dup) { showToast('이미 사용 중인 아이디입니다'); return; }

    const email = `${emailId}@${domain}`;
    const { data, error } = await sb.auth.signUp({
      email, password: pw,
      options: { data: { username, name, phone, address, address_detail: addressDetail, marketing_agree: marketingAgree } }
    });

    if (error) {
      showToast(error.message.includes('already') ? '이미 가입된 이메일입니다' : '회원가입 중 오류가 발생했습니다');
      console.error(error);
      return;
    }

    closeAllModals();
    if (data.session) {
      await refreshAuthState();
      await renderCartUI();
      showToast('회원가입이 완료되었습니다');
    } else {
      showToast('가입 확인 메일을 발송했습니다. 이메일 인증 후 로그인해 주세요');
      openModal('modal-login');
    }
  });
}

function switchFindTab(which) {
  $all('.tab-btn', $('#modal-find')).forEach(b => b.classList.toggle('is-active', b.dataset.findTab === which));
  $('#find-id-panel').hidden = which !== 'id';
  $('#find-pw-panel').hidden = which !== 'pw';
  $('#find-title').textContent = which === 'id' ? '아이디 찾기' : '비밀번호 찾기';
}

/* ---------------------------------------------------------
   14. INIT
--------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  initPopups();
  initWheel();
  initShowcase();
  initFloatingTop();
  initHeaderScrollHide();
  initEvents();
  await refreshAuthState();
  await renderCartUI();
  navigate(location.hash || '#/', true);
});

})();
