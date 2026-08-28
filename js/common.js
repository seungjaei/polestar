/* ============================================================
   POLESTAR — common.js
   Shared across all pages (index.html + Phase 2 subpages):
   brand/product data, DOM utils, auth session helpers, cart data
   layer. Exposed as window.Polestar. No page-specific DOM writes
   here — callers own their own rendering.
   ============================================================ */
(() => {
'use strict';

/* ---------------------------------------------------------
   DATA
--------------------------------------------------------- */
const BRANDS = {
  iabstudio: {
    key: 'iabstudio',
    order: 0,
    name: 'IAB STUDIO',
    director: 'BEENZINO & IAB CREW',
    label: 'ARTIST FEATURE FILM — 01',
    desc: '아티스트 빈지노와 크리에이티브 크루가 전개하는 프레임리스 아트워크 스트릿 브랜드. 위트 있는 그래픽과 고유의 색감으로 한국 스트릿 씬의 시그니처 아이덴티티를 제시합니다.',
    descExtra: '프레임에 갇히지 않는 자유로운 아트 디렉션을 바탕으로, 계절과 트렌드에 얽매이지 않는 타임리스한 실루엣을 추구합니다. 크루원 각자의 개성이 살아있는 다채로운 그래픽 언어가 매 시즌 새로운 이야기를 씁니다.',
    logo: 'images/iabstudio/logo.png',
    artist: 'images/iabstudio/artist.jpg',
    slider: 'images/slider/iabstudio.jpg',
    screens: ['images/iabstudio/screen1.mp4', 'images/iabstudio/screen2.mp4'],
    products: [
      { id: 'iab-1', model: 'model1', ext: 'jpg', name: 'IAB BASIC CLOTH 01', price: 120000, cloth: ['cloth1.png'], content: ['content1.jpg'] },
      { id: 'iab-2', model: 'model2', ext: 'PNG', name: 'IAB BASIC CLOTH 02', price: 150000, cloth: ['cloth2.png', 'cloth3.png'], content: ['content2.jpg'] },
      { id: 'iab-3', model: 'model3', ext: 'PNG', name: 'IAB BASIC CLOTH 03', price: 200000, cloth: ['cloth4.PNG'], content: ['content3.PNG'] }
    ]
  },
  i4p: {
    key: 'i4p',
    order: 1,
    name: 'i4p',
    director: 'GIRIBOY',
    label: 'ARTIST FEATURE FILM — 02',
    desc: '프로듀서이자 아티스트 기리보이의 컬처럴 실루엣 레이블. 정형화되지 않은 미학, 오버사이즈드 핏, 그리고 독창적인 레이어링을 통해 아티스트 본인의 독특한 음악적 서사를 패션으로 투영합니다.',
    descExtra: '비정형의 실루엣과 레이어드 무드를 기반으로, 일상복과 무대의상의 경계를 허무는 룩을 지향합니다. 기리보이 특유의 몽환적이고 실험적인 사운드 스케이프가 텍스타일의 패턴과 톤으로 그대로 이어집니다.',
    logo: 'images/i4p/logo.png',
    artist: 'images/i4p/artist.jpg',
    slider: 'images/slider/i4p.jpg',
    screens: ['images/i4p/screen1.mp4', 'images/i4p/screen2.mp4'],
    products: [
      { id: 'i4p-1', model: 'model1', ext: 'jpg', name: 'I4P FUTURE SCIENCE CLOTH 01', price: 50000, cloth: ['cloth1.jpg'], content: ['content1.jpg'] },
      { id: 'i4p-2', model: 'model2', ext: 'jpg', name: 'I4P FUTURE SCIENCE CLOTH 02', price: 90000, cloth: ['cloth2.jpg'], content: ['content2.jpg'] },
      { id: 'i4p-3', model: 'model3', ext: 'jpg', name: 'I4P FUTURE SCIENCE CLOTH 03', price: 150000, cloth: ['cloth3.jpg'], content: ['content3.jpg'] }
    ]
  },
  blazed: {
    key: 'blazed',
    order: 2,
    name: 'BLAZED',
    director: 'JAY PARK',
    label: 'ARTIST FEATURE FILM — 03',
    desc: '아티스트 박재범의 자유로운 컬처럴 에너지와 하이어뮤직 서브컬처 아이덴티티를 담아낸 스트릿 브랜딩 레이블. 스트릿 씬의 에너지를 웨어러블하고 세련된 그래픽 텍스처로 풀어냅니다.',
    descExtra: '하이어뮤직 특유의 자유분방한 서브컬처 무드를 담아, 스트릿과 하이엔드의 경계를 넘나드는 그래픽 텍스처를 완성합니다. 무대 위 에너지를 그대로 옮겨온 실루엣은 데일리와 퍼포먼스 웨어 모두를 아우릅니다.',
    logo: 'images/blazed/logo.png',
    artist: 'images/blazed/artist.jfif',
    slider: 'images/slider/blazed.jpg',
    screens: ['images/blazed/screen1.mp4', 'images/blazed/screen2.mp4'],
    products: [
      { id: 'blz-1', model: 'model1', ext: 'jpg', name: 'BLAZED HIPHOP LAZY CLOTH 01', price: 200000, cloth: ['cloth1.jpg', 'cloth2.jpg'], content: ['content1.jpg', 'content2.jpg', 'content3.jpg'] },
      { id: 'blz-2', model: 'model2', ext: 'PNG', name: 'BLAZED HIPHOP LAZY CLOTH 02', price: 260000, cloth: ['cloth3.jpg', 'cloth4.jpg'], content: ['content4.jpg', 'content5.jpg', 'content6.jpg'] },
      { id: 'blz-3', model: 'model3', ext: 'PNG', name: 'BLAZED HIPHOP LAZY CLOTH 03', price: 320000, cloth: ['cloth3.jpg', 'cloth4.jpg'], content: ['content4.jpg', 'content5.jpg', 'content6.jpg'] },
      { id: 'blz-4', model: 'model4', ext: 'PNG', name: 'BLAZED HIPHOP LAZY CLOTH 04', price: 380000, cloth: ['cloth5.jpg', 'cloth6.jpg'], content: ['content7.jpg', 'content8.jpg', 'content9.jpg'] },
      { id: 'blz-5', model: 'model5', ext: 'PNG', name: 'BLAZED HIPHOP LAZY CLOTH 05', price: 440000, cloth: ['cloth5.jpg', 'cloth6.jpg'], content: ['content7.jpg', 'content8.jpg', 'content9.jpg'] },
      { id: 'blz-6', model: 'model6', ext: 'PNG', name: 'BLAZED HIPHOP LAZY CLOTH 06', price: 500000, cloth: ['cloth7.jpg', 'cloth8.jpg'], content: ['content10.jpg', 'content11.jpg'] }
    ]
  },
  libilly: {
    key: 'libilly',
    order: 3,
    name: 'LIBILLY',
    director: 'CHANGMO',
    label: 'ARTIST FEATURE FILM — 04',
    desc: '덕소에서 세계로, 아티스트 창모의 서브컬처 아이덴티티를 담은 리얼 서브컬처 패션 라인. 클래식 힙합 아카이브와 오리지널 로컬리티의 진정성을 웨어러블한 스트릿웨어로 풀어냅니다.',
    descExtra: '덕소라는 지역적 정체성에서 출발해, 클래식 힙합 아카이브의 정서를 현대적인 실루엣으로 재해석합니다. 로컬리티에 대한 진정성 있는 시선이 그래픽과 워딩 하나하나에 고스란히 녹아 있습니다.',
    logo: 'images/libilly/logo.png',
    artist: 'images/libilly/artist.jpg',
    slider: 'images/slider/libilly.jpg',
    screens: ['images/libilly/screen1.mp4', 'images/libilly/screen2.mp4'],
    products: [
      { id: 'lib-1', model: 'model1', ext: 'jpg', name: '031 HIPHOP CLOTH 01', price: 200000, cloth: ['cloth1.png', 'cloth2.png'], content: ['content1.jpg', 'content3.jpg', 'content4.jpg'] },
      { id: 'lib-2', model: 'model2', ext: 'jpg', name: '031 HIPHOP CLOTH 02', price: 250000, cloth: ['cloth3.jpg'], content: ['content6.jpg', 'content7.jpg'] },
      { id: 'lib-3', model: 'model3', ext: 'PNG', name: '031 HIPHOP CLOTH 03', price: 300000, cloth: ['cloth4.PNG'], content: ['content8.PNG'] }
    ]
  }
};
const BRAND_ORDER = ['iabstudio', 'i4p', 'blazed', 'libilly'];
const COLORS = ['BLACK', 'WHITE', 'GRAY'];
const SIZES = ['S', 'M', 'L', 'XL'];

function findProduct(id) {
  for (const key of BRAND_ORDER) {
    const p = BRANDS[key].products.find(p => p.id === id);
    if (p) return { product: p, brand: BRANDS[key] };
  }
  return null;
}

const FAQ_DATA = [
  { cat: '주문/결제', q: '주문 후 결제 수단을 변경할 수 있나요?', a: '결제 완료 전 상태에서는 [마이페이지 > 주문내역]에서 결제 수단 변경이 가능합니다. 이미 결제가 완료된 건은 취소 후 재주문해 주세요.' },
  { cat: '배송', q: '배송은 얼마나 걸리나요?', a: '결제 완료 후 평균 2~4 영업일 이내 출고되며, 도서/산간 지역은 1~2일 추가될 수 있습니다.' },
  { cat: '교환/반품', q: '교환/반품 신청은 어떻게 하나요?', a: '상품 수령 후 7일 이내 [마이페이지 > 주문내역]에서 교환/반품 신청이 가능합니다. 착용 흔적이 있는 경우 불가할 수 있습니다.' },
  { cat: '회원/기타', q: '비회원으로도 구매할 수 있나요?', a: '네, 비회원 주문이 가능하며 담아둔 장바구니는 로그인 시 자동으로 이관됩니다.' },
  { cat: '주문/결제', q: '무통장 입금도 가능한가요?', a: '네, 결제 수단에서 계좌이체를 선택하시면 가상계좌가 발급됩니다.' },
  { cat: '배송', q: '배송비는 얼마인가요?', a: '전 상품 기본 배송비는 3,000원이며, 도서/산간 지역은 추가 배송비가 발생할 수 있습니다.' }
];

/* ---------------------------------------------------------
   UTILITIES
--------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const won = n => n.toLocaleString('ko-KR') + ' KRW';

function showToast(msg) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

/* ---------------------------------------------------------
   AUTH (session/profile lookup only — no DOM, no state cache;
   each page keeps its own currentUser/currentProfile and calls
   these on load / after login / after logout)
--------------------------------------------------------- */
async function getSessionAndProfile() {
  const { data: { session } } = await sb.auth.getSession();
  const user = session?.user || null;
  if (!user) return { user: null, profile: null };
  const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) console.error(error);
  return { user, profile: data || null };
}

function signOut() {
  return sb.auth.signOut();
}

function checkUsernameExists(username) {
  return sb.rpc('username_exists', { p_username: username });
}

/* ---------------------------------------------------------
   CART (Supabase cart_items when logged in, localStorage guest
   cart otherwise). All functions take `user` explicitly rather
   than reading a shared module-level variable — each page owns
   its own auth state and passes it in.
--------------------------------------------------------- */
function loadGuestCart() { try { return JSON.parse(localStorage.getItem('polestar_cart') || '[]'); } catch { return []; } }
function saveGuestCart(cart) { localStorage.setItem('polestar_cart', JSON.stringify(cart)); }

async function loadCart(user) {
  if (user) {
    const { data, error } = await sb.from('cart_items')
      .select('id,product_id,color,size,qty')
      .eq('user_id', user.id)
      .order('created_at');
    if (error) { console.error(error); return []; }
    return data.map(row => {
      const found = findProduct(row.product_id);
      if (!found) return null;
      return {
        id: row.id,
        productId: row.product_id,
        name: found.product.name,
        price: found.product.price,
        img: `images/${found.brand.key}/${found.product.model}.${found.product.ext}`,
        color: row.color, size: row.size, qty: row.qty
      };
    }).filter(Boolean);
  }
  return loadGuestCart();
}

async function mergeGuestCartIntoDb(user) {
  const guestCart = loadGuestCart();
  if (!guestCart.length || !user) return;
  for (const item of guestCart) {
    const { data: existing } = await sb.from('cart_items')
      .select('id,qty')
      .eq('user_id', user.id).eq('product_id', item.productId)
      .eq('color', item.color).eq('size', item.size).maybeSingle();
    if (existing) await sb.from('cart_items').update({ qty: existing.qty + item.qty }).eq('id', existing.id);
    else await sb.from('cart_items').insert({ user_id: user.id, product_id: item.productId, color: item.color, size: item.size, qty: item.qty });
  }
  saveGuestCart([]);
}

async function addToCart(item, user) {
  if (user) {
    const { data: existing } = await sb.from('cart_items')
      .select('id,qty')
      .eq('user_id', user.id).eq('product_id', item.productId)
      .eq('color', item.color).eq('size', item.size).maybeSingle();
    if (existing) await sb.from('cart_items').update({ qty: existing.qty + item.qty }).eq('id', existing.id);
    else await sb.from('cart_items').insert({ user_id: user.id, product_id: item.productId, color: item.color, size: item.size, qty: item.qty });
  } else {
    const cart = loadGuestCart();
    const existing = cart.find(c => c.productId === item.productId && c.color === item.color && c.size === item.size);
    if (existing) existing.qty += item.qty;
    else cart.push(item);
    saveGuestCart(cart);
  }
}

async function removeCartItem(idx, item, user) {
  if (!item) return;
  if (user) {
    await sb.from('cart_items').delete().eq('id', item.id);
  } else {
    const cart = loadGuestCart();
    cart.splice(idx, 1);
    saveGuestCart(cart);
  }
}

async function changeCartQty(idx, item, delta, user) {
  if (!item) return;
  const nextQty = Math.max(1, item.qty + delta);
  if (user) {
    await sb.from('cart_items').update({ qty: nextQty }).eq('id', item.id);
  } else {
    const cart = loadGuestCart();
    cart[idx].qty = nextQty;
    saveGuestCart(cart);
  }
}

async function changeCartOption(idx, item, { color, size }, user) {
  if (!item) return;
  if (user) {
    await sb.from('cart_items').update({ color, size }).eq('id', item.id);
  } else {
    const cart = loadGuestCart();
    cart[idx].color = color;
    cart[idx].size = size;
    saveGuestCart(cart);
  }
}

async function removeCartItems(items, user) {
  if (!items.length) return;
  if (user) {
    await sb.from('cart_items').delete().in('id', items.map(it => it.id));
  } else {
    const cart = loadGuestCart();
    const removeKeys = new Set(items.map(it => `${it.productId}__${it.color}__${it.size}`));
    saveGuestCart(cart.filter(c => !removeKeys.has(`${c.productId}__${c.color}__${c.size}`)));
  }
}

/* ---------------------------------------------------------
   RECENTLY VIEWED / WISHLIST (localStorage only — no DB table;
   product detail page records views + wishlist toggles here,
   mypage.html reads them back)
--------------------------------------------------------- */
function addRecentlyViewed(productId) {
  let list = getRecentlyViewed();
  list = list.filter(id => id !== productId);
  list.unshift(productId);
  localStorage.setItem('polestar_recent', JSON.stringify(list.slice(0, 12)));
}
function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem('polestar_recent') || '[]'); } catch { return []; }
}
function getWishlist() {
  try { return JSON.parse(localStorage.getItem('polestar_wishlist') || '[]'); } catch { return []; }
}
function isWishlisted(productId) {
  return getWishlist().includes(productId);
}
function toggleWishlist(productId) {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  if (idx >= 0) list.splice(idx, 1); else list.unshift(productId);
  localStorage.setItem('polestar_wishlist', JSON.stringify(list));
  return list.includes(productId);
}

/* ---------------------------------------------------------
   SHARED HEADER (every page: index.html + signup/cart/checkout/
   mypage/support.html all ship the same #site-header + #modal-login
   markup — this is the one shared DOM component in common.js so
   login/logout/cart-badge behavior stays identical everywhere)
--------------------------------------------------------- */
function closeAllModals() {
  $all('.modal').forEach(m => { m.hidden = true; });
  const backdrop = $('#modal-backdrop');
  if (backdrop) backdrop.hidden = true;
}
function openModalEl(id) {
  closeAllModals();
  $('#' + id).hidden = false;
  $('#modal-backdrop').hidden = false;
}

function getNavBackdrop() {
  let backdrop = $('#header-nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'header-nav-backdrop';
    backdrop.className = 'header__nav-backdrop';
    backdrop.hidden = true;
    document.body.appendChild(backdrop);
    // Sits below the header (z-index) but above page content, so an
    // open dropdown can't be tapped-through into whatever happens to
    // be underneath it (e.g. the in-page breadcrumb on lookbook,
    // which used to sit right under the dropdown and eat the tap).
    backdrop.addEventListener('click', () => toggleMobileNav(false));
  }
  return backdrop;
}

function toggleMobileNav(force) {
  const nav = $('#header-nav');
  const btn = $('#header-hamburger');
  if (!nav || !btn) return;
  const open = force !== undefined ? force : !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open);
  btn.setAttribute('aria-expanded', String(open));
  getNavBackdrop().hidden = !open;
}

async function mountHeader() {
  const { user } = await getSessionAndProfile();
  const loginBtn = $('#btn-login');
  const joinBtn = $('#btn-join');
  if (loginBtn) {
    loginBtn.textContent = user ? 'LOGOUT' : 'LOGIN';
    loginBtn.dataset.action = user ? 'logout' : 'open-login';
  }
  if (joinBtn) joinBtn.style.display = user ? 'none' : '';
  const cart = await loadCart(user);
  const countEl = $('#cart-count');
  if (countEl) countEl.textContent = String(cart.reduce((s, c) => s + c.qty, 0));
  return user;
}

function wireHeaderEvents(opts = {}) {
  const onLogoClick = opts.onLogoClick || (() => { location.href = 'index.html'; });
  const afterLogin = opts.afterLogin || (() => { location.reload(); });

  document.addEventListener('click', async e => {
    const target = e.target.closest('[data-action]');
    const action = target?.dataset.action;

    if (action === 'toggle-menu') toggleMobileNav();
    else if (!e.target.closest('#header-session')) toggleMobileNav(false);

    if (!action) return;
    if (action === 'open-login') { openModalEl('modal-login'); toggleMobileNav(false); }
    else if (action === 'close-modal') closeAllModals();
    else if (action === 'logout') { await signOut(); location.reload(); }
  });

  $('#modal-backdrop')?.addEventListener('click', closeAllModals);
  $('#header-logo')?.addEventListener('click', onLogoClick);

  $('#form-login')?.addEventListener('submit', async e => {
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

    const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });
    if (error) {
      showToast(error.message.includes('Email not confirmed')
        ? '이메일 인증 후 로그인해 주세요'
        : '아이디 또는 비밀번호가 올바르지 않습니다');
      return;
    }
    await mergeGuestCartIntoDb(data.user);
    showToast('로그인 되었습니다');
    setTimeout(afterLogin, 400);
  });
}

async function requireAuth(redirectTo) {
  const { user, profile } = await getSessionAndProfile();
  if (!user) {
    showToast('로그인이 필요합니다');
    setTimeout(() => { location.href = redirectTo || 'index.html'; }, 600);
    return null;
  }
  return { user, profile };
}

/* ---------------------------------------------------------
   EXPORT
--------------------------------------------------------- */
window.Polestar = {
  BRANDS, BRAND_ORDER, COLORS, SIZES, findProduct, FAQ_DATA,
  $, $all, won, showToast,
  getSessionAndProfile, signOut, checkUsernameExists, requireAuth,
  loadCart, addToCart, removeCartItem, removeCartItems, changeCartQty, changeCartOption, mergeGuestCartIntoDb,
  closeAllModals, openModalEl, mountHeader, wireHeaderEvents,
  addRecentlyViewed, getRecentlyViewed, getWishlist, isWishlisted, toggleWishlist
};

})();
