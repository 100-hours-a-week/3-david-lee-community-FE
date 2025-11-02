
// ───────────── 기본 헬퍼 ─────────────
export const $ = (sel, root = document) => root.querySelector(sel);

export const debounce = (fn, delay = 300) => {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
};

// 필드 상태 표시 (공용)
export function setFieldState(inputEl, { ok, msg = "" }) {
    const field = inputEl.closest(".field") || inputEl.parentElement;
    let hint = field.querySelector(".note");
    if (!hint) {
        hint = document.createElement("div");
        hint.className = "note";
        hint.setAttribute("aria-live", "polite");
        field.appendChild(hint);
    }
    hint.textContent = msg;
    field.classList.toggle("is-valid", !!ok);
    field.classList.toggle("is-invalid", ok === false);
}

// ───────────── 정규식(필요 시 커스터마이즈 가능) ─────────────
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NICK_RE  = /^[a-zA-Z0-9가-힣_.-]{2,10}$/;
export const PW_MIN = 8, PW_MAX = 20;
export const PW_COMPLEXITY_RE =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

// ───────────── 단일 필드 검증기 ─────────────
export function verifyEmailField(el, { re = EMAIL_RE } = {}) {
    const v = el.value.trim();
    if (!v) return setFieldState(el, { ok: false, msg: "이메일을 입력하세요." }), false;
    if (!re.test(v)) return setFieldState(el, { ok: false, msg: "이메일 형식이 올바르지 않습니다." }), false;
    setFieldState(el, { ok: true, msg: "" });
    return true;
}

export function verifyNicknameField(el, { re = NICK_RE } = {}) {
    const v = el.value.trim();
    if (!v) return setFieldState(el, { ok: false, msg: "닉네임을 입력하세요." }), false;
    if (!re.test(v)) return setFieldState(el, {
        ok: false, msg: "2~10자, 한글/영문/숫자/._-만 사용 가능합니다."
    }), false;
    setFieldState(el, { ok: true, msg: "" });
    return true;
}

export function verifyPasswordComplexityField(pwEl, {
    re = PW_COMPLEXITY_RE, min = PW_MIN, max = PW_MAX
} = {}) {
    const ok = re.test(pwEl.value);
    setFieldState(pwEl, {
        ok,
        msg: ok ? "" : `비밀번호는 ${min}~${max}자, 대문자·소문자·숫자·특수문자 각각 ≥1 포함해야 합니다.`
    });
    return ok;
}

export function verifyPasswordLengthField(pwEl, { min = PW_MIN, max = PW_MAX } = {}) {
    const len = pwEl.value.length;
    const ok = len >= min && len <= max;
    setFieldState(pwEl, { ok, msg: ok ? "" : `비밀번호는 ${min}~${max}자로 입력하세요.` });
    return ok;
}

export function verifyPasswordMatchField(pwEl, pw2El) {
    const same = pwEl.value && pw2El.value && pwEl.value === pw2El.value;
    // pwEl가 유효(복잡성/길이)하고 same일 때만 ok로 표시하고 싶으면 필요시 추가 체크
    setFieldState(pw2El, { ok: same, msg: same ? "" : "비밀번호가 일치하지 않습니다." });
    return same;
}

// ───────────── 비동기 중복체크 헬퍼 ─────────────
export async function verifyDupAsync(inputEl, checker, { okMsg, dupMsg }) {
    try {
        const duplicated = await checker(inputEl.value.trim());
        inputEl.dataset.duplicate = duplicated ? "true" : "";
        setFieldState(inputEl, duplicated ? { ok: false, msg: dupMsg } : { ok: true, msg: okMsg });
        return !duplicated;
    } catch {
        // 중복 체크 실패는 폼 제출 시 다시 시도하도록 안내
        delete inputEl.dataset.duplicate;
        setFieldState(inputEl, { ok: true, msg: "중복 확인 중 오류. 제출 시 다시 시도합니다." });
        return true;
    }
}

// ───────────── 폼 단위 활성/비활성 제어 팩토리 ─────────────
export function createFormEnabler(submitBtn, checks) {
    return function refresh() {
        const result = checks();
        const ok = Array.isArray(result) ? result.every(Boolean) : !!result;
        if (submitBtn) submitBtn.disabled = !ok;
        return ok;
    };
}