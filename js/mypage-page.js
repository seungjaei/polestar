/* ============================================================
   POLESTAR — mypage-page.js (mypage.html)
   Full-page profile: order history + 5-stage delivery timeline,
   phone/marketing-agree edit (Supabase), password change,
   wishlist / recently-viewed (localStorage).
   ============================================================ */
(() => {
'use strict';
const { $, $all, won, showToast, findProduct, getRecentlyViewed, getWishlist } = window.Polestar;

const STAGES = ['준비중', '배송중', '배달지도착', '배달중', '배달완료'];
function stageIndexOf(status) {
  const i = STAGES.indexOf(status);
  if (i >= 0) return i;
  if (status === '결제완료') return 0;
  if (status === '배송완료') return 4;
  return 0;
}

let currentUser = null;
let currentProfile = null;

function renderTimeline(status) {
  const idx = stageIndexOf(status);
  return `<div class="delivery-timeline">${STAGES.map((s, i) => `
    <div class="timeline-step ${i <= idx ? 'is-done' : ''}">
      <div class="timeline-step__dot"></div>
      <div class="timeline-step__label">${s}</div>
    </div>
  `).join('')}</div>`;
}

async function renderOrders() {
  const panel = $('#panel-orders');
  panel.innerHTML = '<div class="order-empty">불러오는 중...</div>';
  const { data: orders, error } = await sb.from('orders')
    .select('id,order_no,total,pay_method,status,created_at,tracking_no,order_items(product_name,color,size,qty,price)')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); panel.innerHTML = '<div class="order-empty">주문 내역을 불러오지 못했습니다.</div>'; return; }
  if (!orders.length) { panel.innerHTML = '<div class="order-empty">주문 내역이 없습니다.</div>'; return; }

  panel.innerHTML = orders.map(o => `
    <div class="order-card">
      <div class="order-card__head">
        <span>주문번호 ${o.order_no} · ${o.created_at.slice(0, 10)}</span>
        <span>${o.pay_method} · ${won(o.total)}</span>
      </div>
      ${renderTimeline(o.status)}
      <table class="data-table" style="margin-top:20px;">
        <thead><tr><th>상품명</th><th>옵션</th><th>수량</th><th>금액</th></tr></thead>
        <tbody>
          ${(o.order_items || []).map(it => `<tr><td>${it.product_name}</td><td>${it.color} / ${it.size}</td><td>${it.qty}</td><td>${won(it.price * it.qty)}</td></tr>`).join('')}
        </tbody>
      </table>
      <div style="display:flex; gap:12px; justify-content:flex-end; margin-top:16px;">
        <button class="text-btn" type="button" data-action="track" data-tracking="${o.tracking_no || ''}">송장번호 조회</button>
        <button class="text-btn" type="button" data-action="cancel">주문 취소/반품</button>
      </div>
    </div>
  `).join('');
}

function renderProfile() {
  const p = currentProfile;
  $('#profile-name').textContent = p?.name || p?.username || '';
  $('#profile-email').textContent = p?.email || currentUser.email;
  $('#profile-mileage').textContent = `MILEAGE: ${(p?.mileage || 0).toLocaleString('ko-KR')} M`;
  $('#edit-phone').value = p?.phone || '';
  $('#edit-marketing').checked = !!p?.marketing_agree;
}

async function saveProfile() {
  const phone = $('#edit-phone').value.trim();
  const marketing = $('#edit-marketing').checked;
  const { error } = await sb.from('profiles').update({ phone, marketing_agree: marketing }).eq('id', currentUser.id);
  if (error) { console.error(error); showToast('저장 중 오류가 발생했습니다'); return; }
  currentProfile = { ...currentProfile, phone, marketing_agree: marketing };
  showToast('회원정보가 저장되었습니다');
}

async function changePassword(e) {
  e.preventDefault();
  const pw = $('#new-pw').value;
  const pwConfirm = $('#new-pw-confirm').value;
  if (pw.length < 6) { showToast('비밀번호는 6자 이상 입력해 주세요'); return; }
  if (pw !== pwConfirm) { showToast('비밀번호가 일치하지 않습니다'); return; }
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) { console.error(error); showToast('비밀번호 변경 중 오류가 발생했습니다'); return; }
  $('#new-pw').value = '';
  $('#new-pw-confirm').value = '';
  showToast('비밀번호가 변경되었습니다');
}

function renderProductGrid(root, ids, emptyMsg) {
  if (!ids.length) { root.innerHTML = `<div class="wishlist-empty">${emptyMsg}</div>`; return; }
  root.innerHTML = `<div class="polaroid-grid" style="padding:0; gap:24px; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));">${ids.map(id => {
    const found = findProduct(id);
    if (!found) return '';
    const { product: p, brand: b } = found;
    return `
      <a class="polaroid-card" href="index.html#/product/${p.id}">
        <img src="images/${b.key}/${p.model}.${p.ext}" alt="${p.name}">
        <div class="polaroid-card__meta">
          <div class="polaroid-card__name">${p.name}</div>
          <div class="polaroid-card__price">${won(p.price)}</div>
        </div>
      </a>
    `;
  }).join('')}</div>`;
}

function switchPanel(name) {
  $all('.mypage-nav button').forEach(b => b.classList.toggle('is-active', b.dataset.panel === name));
  $all('.mypage-panel').forEach(p => p.classList.toggle('is-active', p.id === 'panel-' + name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('DOMContentLoaded', async () => {
  Polestar.wireHeaderEvents();
  const auth = await Polestar.requireAuth('index.html');
  if (!auth) return;
  currentUser = auth.user;
  currentProfile = auth.profile;
  await Polestar.mountHeader();

  renderProfile();
  await renderOrders();
  renderProductGrid($('#recent-products'), getRecentlyViewed(), '아직 살펴본 상품이 없습니다.');
  renderProductGrid($('#wishlist-products'), getWishlist(), '위시리스트에 담은 상품이 없습니다.');

  $all('.mypage-nav button').forEach(btn => btn.addEventListener('click', () => switchPanel(btn.dataset.panel)));
  $('#btn-save-profile').addEventListener('click', saveProfile);
  $('#form-change-pw').addEventListener('submit', changePassword);
  $('#btn-withdraw').addEventListener('click', () => {
    showToast('회원탈퇴는 고객센터를 통해 처리해 드립니다');
    setTimeout(() => { location.href = 'support.html'; }, 800);
  });

  $('#panel-orders').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'track') {
      showToast(btn.dataset.tracking ? `송장번호: ${btn.dataset.tracking}` : '아직 등록된 송장번호가 없습니다');
    } else if (btn.dataset.action === 'cancel') {
      showToast('주문 취소/반품은 고객센터로 문의해 주세요');
    }
  });
});

})();
