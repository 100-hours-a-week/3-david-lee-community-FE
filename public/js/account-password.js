/// API
import {updatePassword} from "../api/user.js";

// ───────── 내부 설정 ─────────
const form  = document.getElementById('pwForm');
const oldEl = document.getElementById('pw');
const pwEl  = document.getElementById('pw1');
const pw2El = document.getElementById('pw2');

// 사용자가 해당 필드를 만졌는지(빈칸일 때 경고 숨김 UX)
let touchedPw1 = false;
let touchedPw2 = false;

const PW_MIN = 8, PW_MAX = 20;

// ───────────────── 비밀번호 복잡성 ─────────────────

// 8~20자, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함
const PW_COMPLEXITY_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

function setFieldState(inputEl, { ok, msg }) {
    // 컨테이너 찾기
    const field = inputEl.closest('.field') || inputEl.parentElement;

    // 메시지 박스: .field__error 사용
    let err = field.querySelector('.field__error');
    if (!err) {
        err = document.createElement('div');
        err.className = 'field__error';
        err.setAttribute('aria-live', 'polite');
        field.appendChild(err);
    }
    err.textContent = msg || '';

    // 인풋에 직접 표시 (← 이게 핵심: 테두리 빨강)
    inputEl.classList.toggle('is-invalid', ok === false);
    inputEl.setAttribute('aria-invalid', ok ? 'false' : 'true');

    // 필드 컨테이너에도 상태 클래스(선택이지만 유용)
    field.classList.toggle('is-valid', !!ok);
    field.classList.toggle('is-invalid', ok === false);
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
    const pw = pwEl.value;
    const lenAndComplexityOk = PW_COMPLEXITY_RE.test(pw);

    // 메시지 강화
    const msg = lenAndComplexityOk ? '' :
        `비밀번호는 ${PW_MIN}~${PW_MAX}자, 대문자·소문자·숫자·특수문자 중 각각 최소 1개 이상 포함해야 합니다.`;

    setFieldState(pwEl, { ok: lenAndComplexityOk, msg: msg });
    verifyPasswordMatch();
}

function verifyPasswordMatch() {
    const same = pwEl.value && pw2El.value && pwEl.value === pw2El.value;
    // *************** 변경: 비밀번호1이 유효한지 확인하는 방식 개선 ***************
    const pw1IsCorrect = pwEl.closest('.field')?.classList.contains('is-valid');

    // 비밀번호1이 복잡성 조건을 통과하고, 비밀번호1과 비밀번호2가 일치할 때만 true
    const ok = same && pw1IsCorrect;

    setFieldState(pw2El, {
        ok: ok,
        msg: same ? '' : '비밀번호가 일치하지 않습니다.'
    });
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