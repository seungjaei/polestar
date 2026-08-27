/* ============================================================
   POLESTAR — checkout.js (checkout.html)
   Reads the selected cart items handed off by cart.html via
   sessionStorage, collects shipping info + payment method, and
   writes the real order (orders + order_items) on submit.
   ============================================================ */
(() => {
'use strict';
const { $, $all, won, showToast, findProduct } = window.Polestar;

const FREE_SHIP_THRESHOLD = 100000;
let items = [];
let currentUser = null;

function loadItems() {
  try { items = JSON.parse(sessionStorage.getItem('polestar_checkout_items') || '[]'); }
  catch { items = []; }
}

function renderSummary() {
  $('#order-summary').innerHTML = items.map(c => {
    const found = findProduct(c.productId);
    const brand = found ? found.brand.name : '';
    return `
      <div class="order-summary-item">
        <img src="${c.img}" alt="${c.name}">
        <div>
          <div class="order-summary-item__name">${brand} · ${c.name}</div>
          <div class="order-summary-item__opt">${c.color} / ${c.size} · 수량 ${c.qty}</div>
        </div>
        <div class="order-summary-item__price">${won(c.price * c.qty)}</div>
      </div>
    `;
  }).join('');
}

function computeTotals() {
  const subtotal = items.reduce((s, c) => s + c.price * c.qty, 0);
  const shipping = subtotal === 0 ? 0 : (subtotal >= FREE_SHIP_THRESHOLD ? 0 : 3000);
  return { subtotal, shipping, total: subtotal + shipping };
}

function renderPriceBox() {
  const { subtotal, shipping, total } = computeTotals();
  $('#price-breakdown').innerHTML = `
    <div class="cart-total-box__row"><span>총 상품 금액</span><span>${won(subtotal)}</span></div>
    <div class="cart-total-box__row"><span>배송비${shipping === 0 && subtotal > 0 ? ' (무료배송)' : ''}</span><span>${won(shipping)}</span></div>
    <div class="cart-total-box__row cart-total-box__total"><span>최종 결제 금액</span><span>${won(total)}</span></div>
  `;
  $('#btn-pay').textContent = `${total.toLocaleString('ko-KR')}원 결제하기`;
}

function openAddressSearch() {
  if (typeof daum === 'undefined' || !daum.Postcode) { showToast('주소 검색 서비스를 불러오지 못했습니다'); return; }
  new daum.Postcode({
    oncomplete(data) {
      $('#ship-postcode').value = data.zonecode;
      $('#ship-address').value = data.roadAddress || data.jibunAddress;
      $('#ship-address-detail').focus();
    }
  }).open();
}

async function submitOrder() {
  if (!items.length) return;
  const recipientName = $('#ship-name').value.trim();
  const recipientPhone = $('#ship-phone').value.trim();
  const postcode = $('#ship-postcode').value.trim();
  const address = $('#ship-address').value.trim();
  const addressDetail = $('#ship-address-detail').value.trim();
  const shippingMemo = $('#ship-memo').value;
  const payMethod = $('input[name="pay-method"]:checked')?.value;

  if (!recipientName || !recipientPhone) { showToast('수령인 정보를 입력해 주세요'); return; }
  if (!address) { showToast('배송지 주소를 입력해 주세요'); return; }
  if (!payMethod) { showToast('결제 수단을 선택해 주세요'); return; }
  if (!$('#pay-agree').checked) { showToast('테스트 결제 진행에 동의해 주세요'); return; }

  const { subtotal, shipping, total } = computeTotals();
  const orderNo = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const { data: order, error } = await sb.from('orders').insert({
    order_no: orderNo,
    user_id: currentUser.id,
    subtotal, shipping, total,
    pay_method: payMethod,
    status: '준비중',
    recipient_name: recipientName,
    recipient_phone: recipientPhone,
    postcode, address, address_detail: addressDetail,
    shipping_memo: shippingMemo
  }).select().single();

  if (error) { console.error(error); showToast('주문 처리 중 오류가 발생했습니다'); return; }

  const itemsPayload = items.map(c => ({
    order_id: order.id, product_id: c.productId, product_name: c.name,
    color: c.color, size: c.size, qty: c.qty, price: c.price
  }));
  const { error: itemsError } = await sb.from('order_items').insert(itemsPayload);
  if (itemsError) console.error(itemsError);

  await Polestar.removeCartItems(items, currentUser);
  sessionStorage.removeItem('polestar_checkout_items');
  showToast('주문이 완료되었습니다');
  setTimeout(() => { location.href = 'mypage.html'; }, 800);
}

document.addEventListener('DOMContentLoaded', async () => {
  Polestar.wireHeaderEvents();
  const auth = await Polestar.requireAuth('cart.html');
  if (!auth) return;
  currentUser = auth.user;
  await Polestar.mountHeader();

  loadItems();
  if (!items.length) {
    showToast('선택된 상품이 없습니다');
    setTimeout(() => { location.href = 'cart.html'; }, 600);
    return;
  }
  renderSummary();
  renderPriceBox();

  $('#btn-find-address').addEventListener('click', openAddressSearch);
  $('#btn-pay').addEventListener('click', submitOrder);
  document.addEventListener('click', e => {
    const label = e.target.closest('.payment-method');
    if (!label) return;
    $all('.payment-method').forEach(l => l.classList.remove('is-active'));
    label.classList.add('is-active');
  });
});

})();
