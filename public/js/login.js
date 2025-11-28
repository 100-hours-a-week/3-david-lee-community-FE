// ───────────── API ─────────────
import { login } from "../api/auth.js";

// ───────────── 컴포넌트 ─────────────
import { showToast } from "../pages/common/toast.js";
import { createSpinnerOverlay } from "../pages/common/spinner-overlay.js";
import { redirectIfAuthenticated, getRedirectPath } from "../utils/auth-guard.js";
import {$, setFieldState, verifyEmailField, verifyPasswordLengthField, createFormEnabler} from "../utils/validators.js";

// ───────────── 이미 로그인한 경우 리다이렉트 ─────────────
redirectIfAuthenticated();

// ───────────── 스피너 생성 ─────────────
const spinner = createSpinnerOverlay({ ariaLabel: "로그인 중" });

// ───────────── 폼 ─────────────
const form = $("#loginForm");
const emailEl = $("#email");
const pwEl = $("#password");
const submit = form?.querySelector('button[type="submit"]');

// ───────────── 유효성 검사 ─────────────
const refresh = createFormEnabler(submit, () => {
    const emailOk = verifyEmailField(emailEl);
    const pwOk = verifyPasswordLengthField(pwEl);
    return [emailOk, pwOk];
});

emailEl?.addEventListener("input", refresh);
pwEl?.addEventListener("input", refresh);
submit && (submit.disabled = true);

form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!refresh()) return;

    const payload = { email: emailEl.value.trim(), password: pwEl.value };

    // 스피너 표시
    spinner.show();

    try {
        await login(payload);
        // 원래 가려던 페이지 또는 기본 페이지로 이동
        const redirectPath = getRedirectPath('/pages/html/post-list.html?toast=login');
        location.href = redirectPath;
    } catch (err) {
        spinner.hide();
        const msg = err?.message || "로그인 중 오류가 발생했습니다.";
        await showToast(msg);
        setFieldState(pwEl, { ok: false, msg });
        verifyEmailField(emailEl); // 힌트 유지
        refresh();
    }
});

const params = new URLSearchParams(location.search);
if (params.get('toast') === 'logout') {
    showToast('로그아웃 되었습니다.');
}
if (params.get('toast') === 'signup') {
    showToast('회원가입 되었습니다.');
}
if (params.get('toast') === 'login-required') {
    showToast('로그인이 필요합니다.');
}