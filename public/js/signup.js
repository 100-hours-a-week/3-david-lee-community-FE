// ───────────── 인증 가드 ─────────────
import { redirectIfAuthenticated } from "../utils/auth-guard.js";
redirectIfAuthenticated();

// ───────────── API ─────────────
import { signUp, checkDuplicateNickname, checkDuplicateEmail } from "../api/user.js";

// ───────────── 컴포넌트─────────────
import {
    $,
    debounce,
    setFieldState,
    verifyEmailField,
    verifyNicknameField,
    verifyPasswordComplexityField,
    verifyPasswordMatchField,
    verifyDupAsync,
    createFormEnabler
} from "../utils/validators.js";
import { showToast } from "../pages/common/toast.js";
import { createSpinnerOverlay } from "../pages/common/spinner-overlay.js";

// ───────────── 스피너 생성 ─────────────
const spinner = createSpinnerOverlay({ ariaLabel: "회원가입 중" });


// ───────────── 입력 폼 ─────────────

const form   = $("#signupForm");
const nameEl = $("#s-name");
const emailEl= $("#s-email");
const pwEl   = $("#s-pw");
const pw2El  = $("#s-pw2");
const nickEl = $("#s-nick");
const submit = form?.querySelector('button[type="submit"]');

const refresh = createFormEnabler(submit, () => {
    const nameOk = !!nameEl?.value?.trim();
    const emailOk= emailEl.closest(".field")?.classList.contains("is-valid");
    const nickOk = nickEl.closest(".field")?.classList.contains("is-valid");
    const pwOk   = pwEl.closest(".field")?.classList.contains("is-valid");
    const pw2Ok  = pw2El.closest(".field")?.classList.contains("is-valid");
    const noDupEmail = emailEl.dataset.duplicate !== "true";
    const noDupNick  = nickEl.dataset.duplicate !== "true";
    return [nameOk, emailOk, nickOk, pwOk, pw2Ok, noDupEmail, noDupNick];
});

// ───────────── 이메일 ─────────────
emailEl?.addEventListener("input", debounce(async () => {
    const ok = verifyEmailField(emailEl);
    if (!ok) { delete emailEl.dataset.duplicate; return refresh(); }
    await verifyDupAsync(emailEl, async (v) => {
        const res = await checkDuplicateEmail(v);
        return res?.data?.duplicate ?? res?.duplicate ?? res === true;
    }, { okMsg: "사용 가능한 이메일입니다.", dupMsg: "이미 사용 중인 이메일입니다." });
    refresh();
}, 350));

// ───────────── 닉네임 ─────────────
nickEl?.addEventListener("input", debounce(async () => {
    const ok = verifyNicknameField(nickEl);
    if (!ok) { delete nickEl.dataset.duplicate; return refresh(); }
    await verifyDupAsync(nickEl, async (v) => {
        const res = await checkDuplicateNickname(v);
        return res?.data?.duplicate ?? res?.duplicate ?? res === true;
    }, { okMsg: "사용 가능한 닉네임입니다.", dupMsg: "이미 사용 중인 닉네임입니다." });
    refresh();
}, 350));

// ───────────── 패스워드 ─────────────
pwEl?.addEventListener("input", () => {
    verifyPasswordComplexityField(pwEl);
    verifyPasswordMatchField(pwEl, pw2El);
    refresh();
});
pw2El?.addEventListener("input", () => {
    verifyPasswordMatchField(pwEl, pw2El);
    refresh();
});
nameEl?.addEventListener("input", refresh);

submit && (submit.disabled = true);

// ───────────── 제출 ─────────────
form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 마지막으로 강제 검증
    verifyEmailField(emailEl);
    verifyNicknameField(nickEl);
    verifyPasswordComplexityField(pwEl);
    verifyPasswordMatchField(pwEl, pw2El);
    if (!refresh()) return;

    const payload = {
        name: nameEl.value.trim(),
        email: emailEl.value.trim(),
        password: pwEl.value,
        confirmPassword: pw2El.value,
        nickname: nickEl.value.trim(),
        imageKey: ($("#avatarKey")?.value?.trim() || null),
    };

    // 스피너 표시
    spinner.show();

    try {
        await signUp(payload);
        await showToast("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
        location.href = "/pages/html/login.html?toast=signup";
    } catch (err) {
        spinner.hide();
        // 서버 필드 에러 매핑 (예시)
        const list = err?.error;
        if (err?.code === 400002 && Array.isArray(list)) {
            list.forEach(({ field, message }) => {
                const map = { email: emailEl, nickname: nickEl, password: pwEl };
                const el = map[field];
                if (el) setFieldState(el, { ok: false, msg: message });
                if (field === "email") emailEl.dataset.duplicate = "true";
                if (field === "nickname") nickEl.dataset.duplicate = "true";
            });
            refresh();
            await showToast("입력된 정보에 문제가 있습니다. 오류 메시지를 확인해주세요.");
            return;
        }
        await showToast(err?.message || "회원가입 중 오류가 발생했습니다.");
    }
});
