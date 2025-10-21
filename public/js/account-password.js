import {initAppBar} from '../components/appbar.js';
import {attachLogout} from '../components/logout.js';
import {updatePassword} from "../api/user.js";

const { menu } = initAppBar();
attachLogout('#logoutLink');

// ───────── 내부 설정 ─────────
const PW_MIN = 8, PW_MAX = 20;

const form  = document.getElementById('pwForm');
const oldEl = document.getElementById('pw');
const pwEl  = document.getElementById('pw1');
const pw2El = document.getElementById('pw2');

// 사용자가 해당 필드를 만졌는지(빈칸일 때 경고 숨김 UX)
let touchedPw1 = false;
let touchedPw2 = false;

// 공통: 필드 상태/메시지 세팅
function setFieldState(inputEl, { ok, msg }) {
    inputEl.classList.toggle('is-invalid', !ok);
    inputEl.setAttribute('aria-invalid', ok ? 'false' : 'true');
    const errEl = inputEl.parentElement.querySelector('.field__error');
    if (errEl) errEl.textContent = msg || '';
}

// 제출 가능 여부 갱신
function refreshFormValidity() {
    const submitBtn = form.querySelector('.btn--primary');
    const anyInvalid = form.querySelector('.is-invalid') != null;
    const anyEmpty = !oldEl.value || !pwEl.value || !pw2El.value;
    submitBtn.disabled = anyInvalid || anyEmpty;
}

// 검증: 기존 비밀번호(빈 값만 체크)
function verifyOld() {
    if (!oldEl.value.trim()) {
        setFieldState(oldEl, { ok:false, msg:'기존 비밀번호를 입력하세요.' });
    } else {
        setFieldState(oldEl, { ok:true, msg:'' });
    }
    refreshFormValidity();
}

// 검증: 새 비밀번호 길이
function verifyPassword() {
    const len = pwEl.value.length;
    const lenOk = len >= PW_MIN && len <= PW_MAX;

    if (!touchedPw1 && len === 0) {
        // 아직 안 만졌으면 경고 숨김
        setFieldState(pwEl, { ok:true, msg:'' });
    } else {
        setFieldState(pwEl, lenOk
            ? { ok:true, msg:'' }
            : { ok:false, msg:`비밀번호는 ${PW_MIN}~${PW_MAX}자로 입력하세요.` }
        );
    }
    verifyPasswordMatch();
}

// 검증: 새 비밀번호 일치
function verifyPasswordMatch() {
    const v1 = pwEl.value;
    const v2 = pw2El.value;

    if (!touchedPw2 && v2.length === 0) {
        setFieldState(pw2El, { ok:true, msg:'' });
    } else {
        const same = v1.length > 0 && v2.length > 0 && v1 === v2;
        setFieldState(pw2El, same
            ? { ok:true, msg:'' }
            : { ok:false, msg:'비밀번호가 일치하지 않습니다.' }
        );
    }
    refreshFormValidity();
}

// 이벤트 바인딩
oldEl.addEventListener('input', verifyOld);
pwEl.addEventListener('input', () => { touchedPw1 = true; verifyPassword(); });
pw2El.addEventListener('input', () => { touchedPw2 = true; verifyPasswordMatch(); });

// 초기 1회
verifyOld();
verifyPassword(); // 내부에서 verifyPasswordMatch 호출

// ───────── 제출 로직 ─────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('.btn--primary');

    const oldPassword = oldEl.value.trim();
    const newPassword = pwEl.value.trim();
    const confirmPassword = pw2El.value.trim();

    /// 수정중
    submitBtn.disabled = true;
    const prevText = submitBtn.textContent;
    submitBtn.textContent = '수정 중...';

    const payload = { oldPassword, newPassword, confirmPassword };

    try {
        await updatePassword(payload);
        submitBtn.textContent = '수정완료';
        alert('비밀번호가 변경되었습니다.');

        // 민감정보 초기화
        oldEl.value = '';
        pwEl.value  = '';
        pw2El.value = '';

        // 이동 (선택)
        location.href = '/pages/html/account-password.html';
    } catch (err) {
        console.error(err);
        alert('비밀번호 변경 실패: ' + (err?.message || '알 수 없는 오류'));
        submitBtn.textContent = prevText;
    } finally {
        submitBtn.disabled = false;
    }
});