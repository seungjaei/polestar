/* ============================================================
   POLESTAR — signup.js (signup.html)
   Standalone join page: demo phone-verification simulation +
   Daum(Kakao) Postcode address lookup + Supabase signUp.
   ============================================================ */
(() => {
'use strict';
const { $, showToast, checkUsernameExists, mergeGuestCartIntoDb } = window.Polestar;

let demoAuthCode = null;
let phoneVerified = false;
let authTimerInterval = null;

function sendAuthCode() {
  const phone = $('#join-phone').value.trim();
  if (!/^01[0-9]-?\d{3,4}-?\d{4}$/.test(phone)) { showToast('휴대폰 번호를 정확히 입력해 주세요'); return; }

  demoAuthCode = String(Math.floor(1000 + Math.random() * 9000));
  phoneVerified = false;
  $('#join-auth-code').disabled = false;
  $('#join-auth-code').value = '';
  $('#btn-verify-code').disabled = false;

  clearInterval(authTimerInterval);
  let remain = 180;
  const el = $('#auth-timer');
  el.textContent = `데모 인증코드: ${demoAuthCode} (남은 시간 03:00) — 실제 문자 발송 없이 화면에 표시되는 데모 기능입니다.`;
  authTimerInterval = setInterval(() => {
    remain--;
    const m = String(Math.floor(remain / 60)).padStart(2, '0');
    const s = String(remain % 60).padStart(2, '0');
    if (!phoneVerified) el.textContent = `데모 인증코드: ${demoAuthCode} (남은 시간 ${m}:${s})`;
    if (remain <= 0) {
      clearInterval(authTimerInterval);
      if (!phoneVerified) { el.textContent = '인증 시간이 만료되었습니다. 다시 시도해 주세요.'; demoAuthCode = null; }
    }
  }, 1000);
}

function verifyAuthCode() {
  const input = $('#join-auth-code').value.trim();
  if (!demoAuthCode) { showToast('인증번호를 먼저 발송해 주세요'); return; }
  if (input !== demoAuthCode) { showToast('인증번호가 일치하지 않습니다'); return; }
  phoneVerified = true;
  clearInterval(authTimerInterval);
  $('#auth-timer').textContent = '휴대폰 인증이 완료되었습니다.';
  $('#join-phone').disabled = true;
  $('#join-auth-code').disabled = true;
  $('#btn-verify-code').disabled = true;
  $('#btn-send-auth').disabled = true;
}

function syncEmailDomainMode() {
  const isCustom = $('#email-domain').value === 'custom';
  $('#email-domain-custom').hidden = !isCustom;
  if (isCustom) $('#email-domain-custom').focus();
  else $('#email-domain-custom').value = '';
}

function openAddressSearch() {
  if (typeof daum === 'undefined' || !daum.Postcode) { showToast('주소 검색 서비스를 불러오지 못했습니다'); return; }
  new daum.Postcode({
    oncomplete(data) {
      $('#join-postcode').value = data.zonecode;
      $('#join-address').value = data.roadAddress || data.jibunAddress;
      $('#join-address-detail').focus();
    }
  }).open();
}

async function checkUsernameAvailability() {
  const val = $('#join-id').value.trim();
  if (val.length < 8 || val.length > 13) { showToast('아이디는 8~13자로 입력해 주세요'); return; }
  const { data: exists, error } = await checkUsernameExists(val);
  if (error) { console.error(error); showToast('중복확인 중 오류가 발생했습니다'); return; }
  showToast(exists ? '이미 사용 중인 아이디입니다' : '사용 가능한 아이디입니다');
}

async function submitJoin(e) {
  e.preventDefault();
  const name = $('#join-name').value.trim();
  const phone = $('#join-phone').value.trim();
  const emailId = $('#email-id').value.trim();
  const domainSelect = $('#email-domain').value;
  const domain = domainSelect === 'custom' ? $('#email-domain-custom').value.trim() : domainSelect;
  const username = $('#join-id').value.trim();
  const pw = $('#join-pw').value;
  const pwConfirm = $('#join-pw-confirm').value;
  const postcode = $('#join-postcode').value.trim();
  const address = $('#join-address').value.trim();
  const addressDetail = $('#join-address-detail').value.trim();
  const marketingAgree = $('#join-marketing').checked;

  if (!name) { showToast('이름을 입력해 주세요'); return; }
  if (!phoneVerified) { showToast('휴대폰 인증을 완료해 주세요'); return; }
  if (!emailId || !domain) { showToast('이메일을 입력해 주세요'); return; }
  if (username.length < 8 || username.length > 13) { showToast('아이디는 8~13자로 입력해 주세요'); return; }
  if (pw.length < 6) { showToast('비밀번호는 6자 이상 입력해 주세요'); return; }
  if (pw !== pwConfirm) { showToast('비밀번호가 일치하지 않습니다'); return; }
  if (!$('#join-agree').checked) { showToast('개인정보 수집 및 이용에 동의해 주세요'); return; }

  const { data: dup, error: dupError } = await checkUsernameExists(username);
  if (dupError) { showToast('회원가입 중 오류가 발생했습니다'); return; }
  if (dup) { showToast('이미 사용 중인 아이디입니다'); return; }

  const email = `${emailId}@${domain}`;
  const { data, error } = await sb.auth.signUp({
    email, password: pw,
    options: { data: { username, name, phone, postcode, address, address_detail: addressDetail, marketing_agree: marketingAgree } }
  });

  if (error) {
    showToast(error.message.includes('already') ? '이미 가입된 이메일입니다' : '회원가입 중 오류가 발생했습니다');
    console.error(error);
    return;
  }

  if (data.session) {
    await mergeGuestCartIntoDb(data.user);
    showToast('회원가입이 완료되었습니다');
    setTimeout(() => { location.href = 'index.html'; }, 600);
  } else {
    showToast('가입 확인 메일을 발송했습니다. 이메일 인증 후 로그인해 주세요');
    setTimeout(() => { location.href = 'index.html'; }, 1200);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  Polestar.wireHeaderEvents();
  await Polestar.mountHeader();

  $('#btn-send-auth').addEventListener('click', sendAuthCode);
  $('#btn-verify-code').addEventListener('click', verifyAuthCode);
  $('#btn-find-address').addEventListener('click', openAddressSearch);
  $('#btn-check-id').addEventListener('click', checkUsernameAvailability);
  $('#form-join').addEventListener('submit', submitJoin);

  $('#email-domain').addEventListener('change', syncEmailDomainMode);
  syncEmailDomainMode();
});

})();
