// ───────────── 인증 가드 ─────────────
import { requireAuth } from '../utils/auth-guard.js';
requireAuth();

// ───────────── API ─────────────
import { updatePassword } from "../api/user.js";
import { createSpinnerOverlay } from "../pages/common/spinner-overlay.js";

// ───────────── 스피너 생성 ─────────────
const spinner = createSpinnerOverlay({ ariaLabel: "비밀번호 변경 중" });

// ───────── 내부 설정 ─────────
const form  = document.getElementById('pwForm');
const oldEl = document.getElementById('pw');
const pwEl  = document.getElementById('pw1');
const pw2El = document.getElementById('pw2');

const PW_MIN = 8, PW_MAX = 20;

// 8~20자, 대문자, 소문자, 숫자, 특수문자 각각 ≥1
const PW_COMPLEXITY_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

function setFieldState(inputEl, { ok, msg }) {
    const field = inputEl.closest('.field') || inputEl.parentElement;

    let err = field.querySelector('.field__error');
    if (!err) {
        err = document.createElement('div');
        err.className = 'field__error';
        err.setAttribute('aria-live', 'polite');
        field.appendChild(err);
    }
    err.textContent = msg || '';

    inputEl.classList.toggle('is-invalid', ok === false);
    inputEl.setAttribute('aria-invalid', ok ? 'false' : 'true');

    field.classList.toggle('is-valid', !!ok);
    field.classList.toggle('is-invalid', ok === false);
}

// ✅ 필드 유효 여부 헬퍼
const isFieldValid = (inputEl) =>
    inputEl.closest('.field')?.classList.contains('is-valid') === true;

// ✅ 제출 가능 여부 갱신(모든 체크 통과 전까지 버튼 비활성)
function refreshFormValidity() {
    const submitBtn = form.querySelector('.btn--primary');

    const checksOk =
        isFieldValid(oldEl) &&    // 기존 비밀번호 입력됨
        isFieldValid(pwEl)  &&    // 새 비밀번호 복잡성 통과
        isFieldValid(pw2El);      // 새 비밀번호 일치

    submitBtn.disabled = !checksOk;
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

// 검증: 새 비밀번호 복잡성
function verifyPassword() {
    const pw = pwEl.value;
    const lenAndComplexityOk = PW_COMPLEXITY_RE.test(pw);
    const msg = lenAndComplexityOk ? '' :
        `비밀번호는 ${PW_MIN}~${PW_MAX}자, 대문자·소문자·숫자·특수문자 각각 최소 1개 이상 포함해야 합니다.`;

    setFieldState(pwEl, { ok: lenAndComplexityOk, msg });
    verifyPasswordMatch();
}

// 검증: 새 비밀번호 일치
function verifyPasswordMatch() {
    const same = pwEl.value && pw2El.value && pwEl.value === pw2El.value;
    const pw1IsCorrect = isFieldValid(pwEl);
    const ok = same && pw1IsCorrect;

    setFieldState(pw2El, { ok, msg: same ? '' : '비밀번호가 일치하지 않습니다.' });
    refreshFormValidity();
}

// 이벤트 바인딩
oldEl.addEventListener('input', verifyOld);
pwEl.addEventListener('input', verifyPassword);
pw2El.addEventListener('input', verifyPasswordMatch);

// 초기 1회 실행 + 초기 비활성화
verifyOld();
verifyPassword(); // 내부에서 verifyPasswordMatch 호출
refreshFormValidity(); // 페이지 로드시 버튼 잠금 보장

// ───────── 제출 로직 ─────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 가드: 혹시나 DOM 조작으로 버튼을 활성화했을 경우 대비
    if (!isFieldValid(oldEl) || !isFieldValid(pwEl) || !isFieldValid(pw2El)) return;

    const oldPassword = oldEl.value.trim();
    const newPassword = pwEl.value.trim();
    const confirmPassword = pw2El.value.trim();

    const payload = { oldPassword, newPassword, confirmPassword };

    // 스피너 표시
    spinner.show();

    try {
        await updatePassword(payload);

        // 민감정보 초기화 및 상태 재검증
        oldEl.value = '';
        pwEl.value  = '';
        pw2El.value = '';
        verifyOld();
        verifyPassword(); // match 포함
        refreshFormValidity();

        // 이동
        location.href = '/pages/html/post-list.html?toast=password';
    } catch (err) {
        spinner.hide();
        console.error(err);
        alert('비밀번호 변경 실패: ' + (err?.message || '알 수 없는 오류'));
        refreshFormValidity();
    }
});
