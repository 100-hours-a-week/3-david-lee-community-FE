// ───────────── API ─────────────
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
const NICK_RE  = /^[a-zA-Z0-9가-힣_.-]{2,10}$/;
const PW_MIN = 8, PW_MAX = 20;

// *************** 추가: 비밀번호 복잡성 정규식 ***************
// 8~20자, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 이상 포함
const PW_COMPLEXITY_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

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

// aria-busy로 업로드중 표시
const uploadBtn  = document.getElementById('avatarCircle');
const avatarKeyEl = document.getElementById('avatarKey');

// 전체 폼 유효성 체크 → 버튼 활성/비활성
// *************** 변경: 이미지 키(avatarKey) 제외 ***************
function refreshFormValidity() {
    // 필드가 유효한지 확인하는 helper function
    const isFieldValid = (el) => el.closest('.field')?.classList.contains('is-valid') === true;

    // 개별 유효성 상태를 .is-valid 클래스로 체크
    const emailValid = isFieldValid(emailEl);
    const nickValid = isFieldValid(nickEl);
    const pwLenOk= isFieldValid(pwEl);
    const pwMatch = isFieldValid(pw2El);

    // 중복 체크는 dataset으로 확인
    const noEmailDup = emailEl.dataset.duplicate !== 'true';
    const noNickDup = nickEl.dataset.duplicate !== 'true';
    const nameOk = nameEl?.value?.trim().length > 0;

    // 모든 필수 조건이 충족되어야 함 (이미지 제외)
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
        // ───────────── API ─────────────
        const res = await checkDuplicateEmail(v);
        const duplicated = res?.data?.duplicate ?? res?.duplicate ?? res === true;
        emailEl.dataset.duplicate = duplicated ? 'true' : '';
        setFieldState(emailEl, duplicated
            ? { ok: false, msg: '이미 사용 중인 이메일입니다.' }
            : { ok: true,  msg: '사용 가능한 이메일입니다.' }
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
            : { ok: true,  msg: '사용 가능한 닉네임입니다.' }
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

    // 최종 클라이언트 측 유효성 검증
    await Promise.all([verifyEmail(), verifyNickname()]);
    verifyPassword();
    verifyPasswordMatch();
    refreshFormValidity();
    if (submitBtn?.disabled) return;

    const imageKey = avatarKeyEl?.value?.trim() || null;
    console.log(imageKey);

    const payload = {
        name: nameEl.value.trim(),
        email: emailEl.value.trim(),
        password: pwEl.value,
        confirmPassword: pw2El.value,
        nickname: nickEl.value.trim(),
        imageKey: imageKey,
    };

    try {
        console.log(payload);
        await signUp(payload);
        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
        window.location.href = '/pages/html/login.html';
    } catch (err) {
        // 서버 응답 에러 객체 처리
        if (err?.code === 400002 && Array.isArray(err.error)) {
            // 상세 필드 에러 처리
            err.error.forEach(errorDetail => {
                const fieldName = errorDetail.field;
                const errorMessage = errorDetail.message;
                let inputEl;

                // 필드 이름에 따라 해당하는 입력 요소 찾기
                if (fieldName === 'password') {
                    inputEl = pwEl;
                } else if (fieldName === 'nickname') {
                    inputEl = nickEl;
                } else if (fieldName === 'email') {
                    inputEl = emailEl;
                } // 필요한 다른 필드 추가

                if (inputEl) {
                    setFieldState(inputEl, { ok: false, msg: errorMessage });
                    // 유효하지 않은 필드가 있다면 버튼 비활성화를 위해 data-duplicate를 'true'로 설정하여 refreshFormValidity()를 유도
                    if (fieldName === 'email') emailEl.dataset.duplicate = 'true';
                    if (fieldName === 'nickname') nickEl.dataset.duplicate = 'true';
                }
            });
            refreshFormValidity();
            alert('입력된 정보에 문제가 있습니다. 오류 메시지를 확인해주세요.');
        } else {
            // 기타 일반적인 에러 처리
            alert(err?.message || '회원가입 중 오류가 발생했습니다.');
        }
    }
});