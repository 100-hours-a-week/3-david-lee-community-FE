// ───────────── API ─────────────
import { login } from "../api/auth.js";

// ───────────── 컴포넌트 ─────────────
import { showToast } from "../pages/common/toast.js";
import {$, setFieldState, verifyEmailField, verifyPasswordLengthField, createFormEnabler} from "../utils/validators.js";

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

    const original = submit.textContent;
    submit.disabled = true;
    submit.textContent = "로그인 중...";

    try {
        await login(payload);
        // 다음 페이지에서 토스트 띄우기
        location.href = "/pages/html/post-list.html?toast=login";
    } catch (err) {
        const msg = err?.message || "로그인 중 오류가 발생했습니다.";
        await showToast(msg);
        setFieldState(pwEl, { ok: false, msg });
        verifyEmailField(emailEl); // 힌트 유지
    } finally {
        submit.textContent = original;
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