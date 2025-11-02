import { login } from '../api/auth.js';
import {showToast} from "../pages/common/toast.js";

// ───────────── 헬퍼 ─────────────
const $ = (sel) => document.querySelector(sel);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PW_MIN = 8, PW_MAX = 20;

function setFieldState(inputEl, { ok, msg }) {
    const field = inputEl.closest('.field') || inputEl.parentElement;
    let hint = field.querySelector('.note');
    if (!hint) {
        hint = document.createElement('div');
        hint.className = 'note';
        hint.setAttribute('aria-live', 'polite');
        field.appendChild(hint);
    }
    hint.textContent = msg || '';
    field.classList.toggle('is-valid', !!ok);
    field.classList.toggle('is-invalid', ok === false);
}

// ───────────── 엘리먼트 ─────────────
const form = $('#loginForm');
const emailEl = $('#email');
const pwEl = $('#password');
const submitBtn = form?.querySelector('button[type="submit"]');

// ───────────── 유효성 검사 ─────────────
function verifyEmail() {
    const v = emailEl.value.trim();
    if (!v) {
        setFieldState(emailEl, { ok: false, msg: '이메일을 입력하세요.' });
        return false;
    }
    if (!EMAIL_RE.test(v)) {
        setFieldState(emailEl, { ok: false, msg: '이메일 형식이 올바르지 않습니다.' });
        return false;
    }
    setFieldState(emailEl, { ok: true, msg: '' });
    return true;
}

function verifyPassword() {
    const len = pwEl.value.length;
    if (len < PW_MIN || len > PW_MAX) {
        setFieldState(pwEl, { ok: false, msg: `비밀번호는 ${PW_MIN}~${PW_MAX}자로 입력하세요.` });
        return false;
    }
    setFieldState(pwEl, { ok: true, msg: '' });
    return true;
}

function refreshFormValidity() {
    const ok = verifyEmail() & verifyPassword(); // 둘 다 실행되도록 단항 & 사용
    if (submitBtn) submitBtn.disabled = !ok;
}

// ───────────── 이벤트 바인딩 ─────────────
emailEl?.addEventListener('input', refreshFormValidity);
pwEl?.addEventListener('input', refreshFormValidity);
submitBtn && (submitBtn.disabled = true);

// ───────────── 제출 ─────────────
form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    refreshFormValidity();
    if (submitBtn?.disabled) return;

    const payload = {
        email: emailEl.value.trim(),
        password: pwEl.value,
    };

    // 로딩 상태(중복 클릭 방지)
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '로그인 중...';

    try {
        await login(payload);
        window.location.href = '/pages/html/post-list.html?toast=login';
    } catch (err) {
        // 서버가 주는 메시지를 우선 사용
        const msg = err?.message || '로그인 중 오류가 발생했습니다.';

        // *************** 변경된 부분: 오류 메시지를 경고창으로 표시 ***************
        await showToast(msg);

        // 필드에 친절히 안내
        setFieldState(pwEl, { ok: false, msg });

        // 이메일 형식이 맞는지 다시 한번 표시(사용자 힌트)
        verifyEmail();
    } finally {
        submitBtn.textContent = originalText;
        refreshFormValidity(); // 값 유지 시 다시 활성화될 수 있음
    }
});