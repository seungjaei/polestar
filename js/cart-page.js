/* ============================================================
   POLESTAR — cart-page.js (cart.html)
   Full-page cart: option change, per-item select, select-all,
   delete selected/all. "주문하기" hands the selected items to
   checkout.html via sessionStorage.
   ============================================================ */
(() => {
'use strict';
const { $, $all, won, showToast, COLORS, SIZES } = window.Polestar;

let currentUser = null;
let cart = [];
let selected = new Set();

async function reload() {
  cart = await Polestar.loadCart(currentUser);
  selected = new Set([...selected].filter(i => i < cart.length));
  if (!cart.length) selected.clear();
  render();
  await Polestar.mountHeader();
}

function render() {
  const root = $('#cart-rows');
  if (!cart.length) {
    root.innerHTML = `<div class="cart-empty">장바구니가 비어 있습니다.</div>`;
  } else {
    root.innerHTML = cart.map((c, i) => `
      <div class="cart-row">
        <input type="checkbox" class="cart-row__check" data-idx="${i}" ${selected.has(i) ? 'checked' : ''}>
        <img src="${c.img}" alt="${c.name}">
        <div class="cart-row__info">
          <div class="cart-row__name">${c.name}</div>
          <div class="cart-row__opts">
            <select data-role="color" data-idx="${i}">${COLORS.map(col => `<option value="${col}" ${col === c.color ? 'selected' : ''}>${col}</option>`).join('')}</select>
            <select data-role="size" data-idx="${i}">${SIZES.map(s => `<option value="${s}" ${s === c.size ? 'selected' : ''}>${s}</option>`).join('')}</select>
          </div>
          <div class="cart-row__qty">
            <button type="button" data-action="qty-minus" data-idx="${i}">−</button>
            <span>${c.qty}</span>
            <button type="button" data-action="qty-plus" data-idx="${i}">＋</button>
          </div>
        </div>
        <div class="cart-row__price">${won(c.price * c.qty)}</div>
        <button type="button" class="cart-row__remove" data-action="remove" data-idx="${i}">삭제</button>
      </div>
    `).join('');
  }

  $('#select-all').checked = cart.length > 0 && selected.size === cart.length;

  const selectedItems = cart.filter((_, i) => selected.has(i));
  const subtotal = selectedItems.reduce((s, c) => s + c.price * c.qty, 0);
  const shipping = selectedItems.length ? 3000 : 0;
  $('#cart-total-box').innerHTML = `
    <div class="cart-total-box__row"><span>선택 상품 금액</span><span>${won(subtotal)}</span></div>
    <div class="cart-total-box__row"><span>배송비</span><span>${won(shipping)}</span></div>
    <div class="cart-total-box__row cart-total-box__total"><span>총 결제 예정 금액</span><span>${won(subtotal + shipping)}</span></div>
  `;
  $('#btn-order').disabled = selectedItems.length === 0;
}

async function updateOption(idx) {
  const color = $(`select[data-role="color"][data-idx="${idx}"]`).value;
  const size = $(`select[data-role="size"][data-idx="${idx}"]`).value;
  await Polestar.changeCartOption(idx, cart[idx], { color, size }, currentUser);
  await reload();
}

document.addEventListener('DOMContentLoaded', async () => {
  Polestar.wireHeaderEvents();
  currentUser = await Polestar.mountHeader();
  await reload();

  $('#select-all').addEventListener('change', e => {
    selected = e.target.checked ? new Set(cart.map((_, i) => i)) : new Set();
    render();
  });

  $('#btn-delete-selected').addEventListener('click', async () => {
    const items = cart.filter((_, i) => selected.has(i));
    if (!items.length) { showToast('선택된 상품이 없습니다'); return; }
    await Polestar.removeCartItems(items, currentUser);
    selected.clear();
    await reload();
    showToast('선택한 상품을 삭제했습니다');
  });

  $('#btn-delete-all').addEventListener('click', async () => {
    if (!cart.length) return;
    await Polestar.removeCartItems(cart, currentUser);
    selected.clear();
    await reload();
    showToast('장바구니를 비웠습니다');
  });

  $('#cart-rows').addEventListener('change', e => {
    const idx = Number(e.target.dataset.idx);
    if (e.target.classList.contains('cart-row__check')) {
      if (e.target.checked) selected.add(idx); else selected.delete(idx);
      render();
    } else if (e.target.dataset.role === 'color' || e.target.dataset.role === 'size') {
      updateOption(idx);
    }
  });

  $('#cart-rows').addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    if (btn.dataset.action === 'qty-minus') { await Polestar.changeCartQty(idx, cart[idx], -1, currentUser); await reload(); }
    if (btn.dataset.action === 'qty-plus') { await Polestar.changeCartQty(idx, cart[idx], 1, currentUser); await reload(); }
    if (btn.dataset.action === 'remove') { await Polestar.removeCartItem(idx, cart[idx], currentUser); selected.delete(idx); await reload(); }
  });

  $('#btn-order').addEventListener('click', () => {
    if (!currentUser) {
      showToast('주문하려면 로그인이 필요합니다');
      Polestar.openModalEl('modal-login');
      return;
    }
    const selectedItems = cart.filter((_, i) => selected.has(i));
    if (!selectedItems.length) return;
    sessionStorage.setItem('polestar_checkout_items', JSON.stringify(selectedItems));
    location.href = 'checkout.html';
  });
});

})();
