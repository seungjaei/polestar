/* ============================================================
   POLESTAR — support-page.js (support.html)
   Customer service: FAQ accordion (static data) + 1:1 inquiry
   (real Supabase `inquiries` table — insert + own history read).
   ============================================================ */
(() => {
'use strict';
const { $, $all, showToast, FAQ_DATA } = window.Polestar;

let currentUser = null;
let csTab = 'inquiry';
let faqFilter = '전체';
let faqQuery = '';

function renderPanel() {
  if (csTab === 'inquiry') renderInquiryForm();
  else if (csTab === 'history') renderHistory();
  else renderFaq();
}

function renderInquiryForm() {
  const panel = $('#cs-panel');
  panel.innerHTML = `
    <select class="select-field" id="inquiry-category">
      <option>배송</option><option>취소/환불</option><option>상품 문의</option><option>기타</option>
    </select>
    <input class="field" type="text" placeholder="문의 제목" id="inquiry-title">
    <textarea class="field" style="height:120px; padding:12px 16px;" placeholder="문의 내용을 입력해 주세요" id="inquiry-content"></textarea>
    <button class="submit-btn" type="button" id="btn-submit-inquiry">문의 등록</button>
    ${currentUser ? '' : '<div class="field-hint">로그인 후 문의를 등록할 수 있습니다.</div>'}
  `;
  $('#btn-submit-inquiry').addEventListener('click', submitInquiry);
}

async function renderHistory() {
  const panel = $('#cs-panel');
  if (!currentUser) { panel.innerHTML = '<div class="order-empty">로그인 후 문의내역을 확인할 수 있습니다.</div>'; return; }
  panel.innerHTML = '<div class="order-empty">불러오는 중...</div>';
  const { data, error } = await sb.from('inquiries').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
  if (error) { console.error(error); panel.innerHTML = '<div class="order-empty">문의내역을 불러오지 못했습니다.</div>'; return; }
  if (!data.length) { panel.innerHTML = '<div class="order-empty">등록된 문의가 없습니다.</div>'; return; }
  panel.innerHTML = data.map((it, i) => `
    <div class="accordion-item" data-idx="${i}">
      <div class="accordion-q" data-action="toggle-accordion">
        <span>[${it.category}] ${it.title}</span>
        <span class="inquiry-badge ${it.status === '답변완료' ? 'answered' : ''}">${it.status}</span>
      </div>
      <div class="accordion-a">
        <div style="margin-bottom:10px;">${it.content}</div>
        <div>${it.answer ? '<b>관리자 답변:</b> ' + it.answer : '아직 답변이 등록되지 않았습니다.'}</div>
      </div>
    </div>
  `).join('');
}

function renderFaq() {
  const panel = $('#cs-panel');
  const cats = ['전체', '주문/결제', '배송', '교환/반품', '회원/기타'];
  const filtered = FAQ_DATA.filter(f =>
    (faqFilter === '전체' || f.cat === faqFilter) &&
    (f.q.includes(faqQuery) || f.a.includes(faqQuery))
  );
  panel.innerHTML = `
    <input class="faq-search" type="text" placeholder="궁금한 점을 검색해 보세요" value="${faqQuery}" id="faq-search">
    <div class="faq-filters">${cats.map(c => `<button type="button" class="faq-filter-btn ${faqFilter === c ? 'is-active' : ''}" data-faq-cat="${c}">${c}</button>`).join('')}</div>
    ${filtered.map((f, i) => `
      <div class="accordion-item" data-idx="${i}">
        <div class="accordion-q" data-action="toggle-accordion"><span>Q. ${f.q}</span><span>+</span></div>
        <div class="accordion-a">A. ${f.a}</div>
      </div>
    `).join('') || '<div class="field-hint">검색 결과가 없습니다.</div>'}
  `;
  $('#faq-search').addEventListener('input', e => { faqQuery = e.target.value; renderFaq(); });
}

async function submitInquiry() {
  if (!currentUser) { showToast('로그인이 필요합니다'); Polestar.openModalEl('modal-login'); return; }
  const category = $('#inquiry-category').value;
  const title = $('#inquiry-title').value.trim();
  const content = $('#inquiry-content').value.trim();
  if (!title || !content) { showToast('제목과 내용을 입력해 주세요'); return; }
  const { error } = await sb.from('inquiries').insert({ user_id: currentUser.id, category, title, content });
  if (error) { console.error(error); showToast('문의 등록 중 오류가 발생했습니다'); return; }
  showToast('문의가 등록되었습니다');
  switchTab('history');
}

function switchTab(tab) {
  csTab = tab;
  $all('.tab-btn[data-cs-tab]').forEach(b => b.classList.toggle('is-active', b.dataset.csTab === tab));
  renderPanel();
}

document.addEventListener('DOMContentLoaded', async () => {
  Polestar.wireHeaderEvents();
  currentUser = await Polestar.mountHeader();
  renderPanel();

  $all('.tab-btn[data-cs-tab]').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.csTab)));

  document.addEventListener('click', e => {
    const acc = e.target.closest('[data-action="toggle-accordion"]');
    if (acc) acc.closest('.accordion-item').classList.toggle('is-open');
    const faqCat = e.target.closest('[data-faq-cat]');
    if (faqCat) { faqFilter = faqCat.dataset.faqCat; renderFaq(); }
  });
});

})();
