// ───────────── API ─────────────
import {checkDuplicateNickname} from '../api/user.js';
import {getMyPage, updateMyPage, withdraw} from '../api/user.js';
import {getUrls, confirmUrls} from "../api/image.js";

// =================
//  컴포넌트
// =================
import {showToast} from "../pages/common/toast.js";

// ───────────── 헬퍼/DOM (맨 위에서 한 번만 캐싱) ─────────────
const formEl            = document.querySelector('#accountForm');
const emailEl           = document.querySelector('#email');
const nickNameEl        = document.querySelector('#nickname');
const profileAvatarEl   = document.querySelector('#profileAvatar');
const changeImageBtn    = document.querySelector('#changeImageBtn');
const withdrawBtn       = document.querySelector('#withdrawBtn');

// ===== [추가] 정규식 & 디바운스 & 상태 헬퍼 =====
const NICK_RE = /^[a-zA-Z0-9가-힣_.-]{2,10}$/;
const debounce = (fn, d = 350) => {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), d); };
};

// .field 안에 .check 생성
function setFieldState(inputEl, { ok, msg }) {
    const field = inputEl.closest('.field') || inputEl.parentElement;
    if (!field) {
        return;
    }

    let hint = field.querySelector('.check');
    if (!hint) {
        hint = document.createElement('div');
        hint.className = 'check';
        hint.setAttribute('aria-live', 'polite');
        field.appendChild(hint);
    }
    hint.textContent = msg || '';
    field.classList.toggle('is-valid', !!ok);
    field.classList.toggle('is-invalid', ok === false);
}

// 제출 버튼 상태 제어
function refreshSubmit() {
    const submitBtn = formEl?.querySelector('.btn--primary');
    if (!submitBtn) {
        return;
    }

    const nickValid = nickNameEl?.closest('.field')?.classList.contains('is-valid');
    const noNickDup = nickNameEl?.dataset.duplicate !== 'true';
    submitBtn.disabled = !(nickValid && noNickDup);
}

// ───────────── 기존 값 호출 (이미지 출력 포함) ─────────────
(async function preload() {
    if (!emailEl || !nickNameEl) return;

    try {
        const d = await getMyPage();
        const user = d?.data || {};

        emailEl.value = user.email || '';
        nickNameEl.value = user.nickname || '';

        if (user.imageUrl && profileAvatarEl) {
            profileAvatarEl.style.backgroundImage = `url("${user.imageUrl}")`;
            profileAvatarEl.style.backgroundSize = 'cover';
            profileAvatarEl.style.backgroundPosition = 'center';
            profileAvatarEl.style.backgroundRepeat = 'no-repeat';
        }

        // [추가] 최초 로드 시 닉네임 형식 유효표시만
        const initialOk = !!user.nickname && NICK_RE.test(user.nickname);
        setFieldState(nickNameEl, { ok: initialOk, msg: initialOk ? '' : '2~10자, 한글/영문/숫자/._-만 가능합니다.' });
        delete nickNameEl.dataset.duplicate; // 초기엔 중복 미판정
        refreshSubmit();

    } catch (e) {
        await showToast(e?.message || '기존 내용을 불러오지 못했습니다.');
    }
})();

// ────────────────────────── 파일 선택기 ──────────────────────────
function pickImageFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => resolve(input.files?.[0] || null);
        input.click();
    });
}

// ────────────────────────── Presigned URL PUT 업로드 ──────────────────────────
async function uploadByPresignedPut(uploadUrl, file) {
    const headers = file.type ? { 'Content-Type': file.type } : undefined;
    const res = await fetch(uploadUrl, { method: 'PUT', headers, body: file });
    if (!res.ok) throw new Error(`S3 업로드 실패: ${file.name}`);
}

// ────────────────────────── 이미지 변경 ──────────────────────────
changeImageBtn?.addEventListener('click', async () => {
    try {
        const file = await pickImageFile();
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            await showToast('이미지 크기가 너무 큽니다. (최대 10MB)');
            return;
        }

        const issued = await getUrls([file.name]);
        const first =
            (Array.isArray(issued) && issued[0]) ||
            issued?.data?.[0] ||
            issued;

        const uploadUrl = first?.preSignedUrl;
        const fileKey   = first?.key;
        if (!uploadUrl || !fileKey) throw new Error('업로드 URL 또는 key가 응답에 없습니다.');

        await uploadByPresignedPut(uploadUrl, file);

        const confirmed = await confirmUrls([fileKey]);
        const confirmedFirst =
            (Array.isArray(confirmed) && confirmed[0]) ||
            confirmed?.data?.[0] ||
            confirmed;

        const confirmedUrl = confirmedFirst?.imageUrl;

        const preview = confirmedUrl || URL.createObjectURL(file);
        profileAvatarEl && (profileAvatarEl.style.backgroundImage = `url("${preview}")`);

    } catch (e) {
        console.error(e);
        alert(e?.message || '이미지 변경 중 오류가 발생했습니다.');
    }
});

// ───────────── [추가] 닉네임 실시간 검증 + 중복 체크 ─────────────
const verifyNickname = debounce(async () => {
    const v = nickNameEl?.value?.trim() || '';

    // 입력 없음
    if (!v) {
        setFieldState(nickNameEl, { ok: false, msg: '닉네임을 입력하세요.' });
        delete nickNameEl.dataset.duplicate;
        refreshSubmit();
        return;
    }

    // 형식 검증
    if (!NICK_RE.test(v)) {
        setFieldState(nickNameEl, { ok: false, msg: '2~10자, 한글/영문/숫자/._-만 가능합니다.' });
        delete nickNameEl.dataset.duplicate;
        refreshSubmit();
        return;
    }

    // 중복 체크
    try {
        const res = await checkDuplicateNickname(v);
        const duplicated = res?.data?.duplicate ?? res?.duplicate ?? res === true;

        nickNameEl.dataset.duplicate = duplicated ? 'true' : '';
        setFieldState(nickNameEl, duplicated
            ? { ok: false, msg: '이미 사용 중인 닉네임입니다.' }
            : { ok: true,  msg: '사용 가능한 닉네임입니다.' }
        );
    } catch (e) {
        // 오류 시, 형식만 통과했으면 일단 제출은 가능하게 하되 메시지 안내
        delete nickNameEl.dataset.duplicate;
        setFieldState(nickNameEl, { ok: true, msg: '중복 확인 중 오류가 발생했습니다. 제출 시 다시 확인합니다.' });
    } finally {
        refreshSubmit();
    }
}, 350);

// 바인딩
nickNameEl?.addEventListener('input', verifyNickname);

// ───────────── 수정 로직 ─────────────
formEl?.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 제출 직전 최종 확인(네트워크 일시 오류 대비)
    await verifyNickname();

    // 중복이면 제출 막기
    if (nickNameEl?.dataset.duplicate === 'true') return;

    const nickname = nickNameEl?.value?.trim();
    if (!nickname) {
        await showToast('닉네임을 입력하세요.');
        return;
    }

    const payload = {
        nickname,
        imageKey: null, // 필요 시 상태로부터 전달
    };

    const submitBtn = formEl.querySelector('.btn--primary');
    const oldText = submitBtn?.textContent ?? '';

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '수정 중...';
    }

    try {
        await updateMyPage(payload);
        await showToast('정상적으로 수정되었습니다.');
        if (submitBtn) submitBtn.textContent = '수정완료';
        location.href = '/pages/html/post-list.html';
    } catch (err) {
        console.error(err);
        await showToast('수정 실패');

        if (submitBtn) submitBtn.textContent = oldText;
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

// ───────────── 탈퇴 로직 ─────────────
withdrawBtn?.addEventListener('click', async () => {

    if (!confirm('정말 탈퇴하시겠습니까?')) {
        return;
    }

    try {
        await withdraw();
    } finally {
        location.href = '/pages/html/login.html';
    }
});
