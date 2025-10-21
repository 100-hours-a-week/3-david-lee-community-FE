import {signUp, checkDuplicateNickname, checkDuplicateEmail} from '../api/user.js';

// ───────────────── 헬퍼들 ─────────────────
const $ = (sel) => document.querySelector(sel);

const debounce = (fn, delay = 300) => {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delay);
    };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICK_RE  = /^[a-zA-Z0-9가-힣_.-]{2,10}$/;
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

const form = $('#signupForm');
const nameEl = $('#s-name');
const emailEl = $('#s-email');
const pwEl = $('#s-pw');
const pw2El = $('#s-pw2');
const nickEl = $('#s-nick');
const submitBtn = form?.querySelector('button[type="submit"]');

// 전체 폼 유효성 체크 → 버튼 활성/비활성
function refreshFormValidity() {
    const emailValid = emailEl && EMAIL_RE.test(emailEl.value.trim());
    const nickValid  = nickEl && NICK_RE.test(nickEl.value.trim());
    const pw        = pwEl?.value || '';
    const pw2       = pw2El?.value || '';
    const pwLenOk   = pw.length >= PW_MIN && pw.length <= PW_MAX;
    const pwMatch   = pw && pw2 && pw === pw2;
    const noEmailDup = emailEl.dataset.duplicate !== 'true';
    const noNickDup  = nickEl.dataset.duplicate !== 'true';
    const nameOk     = nameEl?.value?.trim().length > 0;

    const allOk = emailValid && nickValid && pwLenOk && pwMatch && noEmailDup && noNickDup && nameOk;
    if (submitBtn) submitBtn.disabled = !allOk;
}

// ───────────── 이메일 검증 + 중복 체크 ─────────────
async function verifyEmail() {
    const v = emailEl.value.trim();
    if (!v) {
        setFieldState(emailEl, { ok: false, msg: '이메일을 입력하세요.' });
        delete emailEl.dataset.duplicate;
        refreshFormValidity();
        return;
    }
    if (!EMAIL_RE.test(v)) {
        setFieldState(emailEl, { ok: false, msg: '이메일 형식이 올바르지 않습니다.' });
        delete emailEl.dataset.duplicate;
        refreshFormValidity();
        return;
    }

    try {
        /// API 호출
        const res = await checkDuplicateEmail(v);
        const duplicated = res?.data?.duplicate ?? res?.duplicate ?? res === true;
        emailEl.dataset.duplicate = duplicated ? 'true' : '';
        setFieldState(emailEl, duplicated
            ? { ok: false, msg: '이미 사용 중인 이메일입니다.' }
            : { ok: true,  msg: '사용 가능한 이메일입니다.' }
        );
    } catch (e) {
        delete emailEl.dataset.duplicate;
        setFieldState(emailEl, { ok: true, msg: '이메일 확인 중 오류가 발생했습니다. 제출 시 다시 시도합니다.' });
    } finally {
        refreshFormValidity();
    }
}

// ───────────── 닉네임 검증 + 중복 체크 ─────────────
async function verifyNickname() {
    const v = nickEl.value.trim();
    if (!v) {
        setFieldState(nickEl, { ok: false, msg: '닉네임을 입력하세요.' });
        delete nickEl.dataset.duplicate;
        refreshFormValidity();
        return;
    }
    if (!NICK_RE.test(v)) {
        setFieldState(nickEl, { ok: false, msg: '2~10자, 한글/영문/숫자/._-만 사용 가능합니다.' });
        delete nickEl.dataset.duplicate;
        refreshFormValidity();
        return;
    }

    try {
        /// 닉네임 API 호출
        const res = await checkDuplicateNickname(v);
        const duplicated = res?.data?.duplicate ?? res?.duplicate ?? res === true;
        nickEl.dataset.duplicate = duplicated ? 'true' : '';
        setFieldState(nickEl, duplicated
            ? { ok: false, msg: '이미 사용 중인 닉네임입니다.' }
            : { ok: true,  msg: '사용 가능한 닉네임입니다.' }
        );
    } catch (e) {
        delete nickEl.dataset.duplicate;
        setFieldState(nickEl, { ok: true, msg: '닉네임 확인 중 오류가 발생했습니다. 제출 시 다시 시도합니다.' });
    } finally {
        refreshFormValidity();
    }
}

// ───────────── 비밀번호 검증 ─────────────
function verifyPassword() {
    const lenOk = pwEl.value.length >= PW_MIN && pwEl.value.length <= PW_MAX;
    setFieldState(pwEl, lenOk
        ? { ok: true,  msg: '' }
        : { ok: false, msg: `비밀번호는 ${PW_MIN}~${PW_MAX}자로 입력하세요.` }
    );
    verifyPasswordMatch();
}

function verifyPasswordMatch() {
    const same = pwEl.value && pw2El.value && pwEl.value === pw2El.value;
    setFieldState(pw2El, same
        ? { ok: true,  msg: '' }
        : { ok: false, msg: '비밀번호가 일치하지 않습니다.' }
    );
    refreshFormValidity();
}

// ───────────── 이벤트 바인딩 ─────────────
emailEl?.addEventListener('input', debounce(verifyEmail, 350));
nickEl?.addEventListener('input', debounce(verifyNickname, 350));
pwEl?.addEventListener('input', () => { verifyPassword(); });
pw2El?.addEventListener('input', () => { verifyPasswordMatch(); });
nameEl?.addEventListener('input', refreshFormValidity);

submitBtn && (submitBtn.disabled = true);

// ───────────── 제출 ─────────────
form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    await Promise.all([verifyEmail(), verifyNickname()]);
    verifyPassword();
    verifyPasswordMatch();
    refreshFormValidity();
    if (submitBtn?.disabled) return;

    const payload = {
        name: nameEl.value.trim(),
        imageUrl: null,
        email: emailEl.value.trim(),
        password: pwEl.value,
        confirmPassword: pw2El.value,
        nickname: nickEl.value.trim(),
    };

    try {
        console.log(payload);
        await signUp(payload);
        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/pages/html/login.html';
    } catch (err) {
        alert(err?.message || '회원가입 중 오류가 발생했습니다.');
    }
});