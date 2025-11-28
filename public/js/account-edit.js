// ───────────── 인증 가드 ─────────────
import { requireAuth } from '../utils/auth-guard.js';
requireAuth();

import { checkDuplicateNickname, getMyPage, updateMyPage, withdraw } from "../api/user.js";
import { showToast } from "../pages/common/toast.js";
import { createImageGalleryUploader } from "./image-uploader.js";
import { createSpinnerOverlay } from "../pages/common/spinner-overlay.js";

import {
    $,
    debounce,
    verifyNicknameField,
    verifyDupAsync,
    createFormEnabler,
    setFieldState,
    NICK_RE
} from "../utils/validators.js";

// ===== DOM =====
const formEl          = $("#accountForm");
const emailEl         = $("#email");
const nickNameEl      = $("#nickname");
const profileAvatarEl = $("#profileAvatar");
const changeImageBtn  = $("#changeImageBtn");
const withdrawBtn     = $("#withdrawBtn");
const submitBtn       = formEl?.querySelector(".btn--primary");

let currentImageKey = null;
let originalNickname = ""; // 서버에서 받은 "내 기존 닉네임" 저장

// ===== 숨김 업로드 컨테이너 구성 =====
const hiddenList = document.createElement("div");
hiddenList.style.display = "none";
document.body.appendChild(hiddenList);

const hiddenFile = document.createElement("input");
hiddenFile.type = "file";
hiddenFile.accept = "image/*";
hiddenFile.style.display = "none";
document.body.appendChild(hiddenFile);

// ===== 작동 스피너 (이미지 업로드용) =====
const overlay = createSpinnerOverlay({
    spinnerSize: 30,
    border: 6,
    borderColor: "#fff",
    backdrop: "rgba(0,0,0,.45)",
});

// 제출용 스피너
const submitSpinner = createSpinnerOverlay({ ariaLabel: "정보 수정 중" });

// ===== 업로더 =====
const uploader = createImageGalleryUploader({
    listEl: hiddenList,
    fileInputEl: hiddenFile,
    maxSizeMB: 10,
    onError: (msg) => showToast(msg),
    onToast: (msg) => showToast(msg),
    onUploadStart: () =>
        overlay.show({
            lockSelectors: ["#accountForm input", "#accountForm button", "#accountForm textarea", "#accountForm select"],
        }),
    onUploadEnd: () => overlay.hide(),
});

// ===== 아바타 미리보기 =====
function setAvatarPreview(url) {
    if (!profileAvatarEl) return;
    profileAvatarEl.style.backgroundImage = `url("${url}")`;
    profileAvatarEl.style.backgroundSize = "cover";
    profileAvatarEl.style.backgroundPosition = "center";
    profileAvatarEl.style.backgroundRepeat = "no-repeat";
}

// ===== 1장만 유지 & 미리보기 =====
function keepOnlyOneAndPreview() {
    const state = uploader.getState();
    if (state.length === 0) {
        currentImageKey = null;
        return;
    }
    const last = state[state.length - 1];

    uploader.setInitial([{ imageKey: last.key, imageUrl: last.url, order: 0 }]);
    currentImageKey = last.key || null;
    setAvatarPreview(last.url);
}

// ===== 닉네임 중복체크 래퍼 =====
async function isNickDuplicated(value) {
    const res = await checkDuplicateNickname(value);
    return res?.data?.duplicate ?? res?.duplicate ?? res === true;
}

// ===== 제출 버튼 활성화(순수 체크만) =====
const refreshSubmit = createFormEnabler(submitBtn, () => {
    const v = (nickNameEl?.value || "").trim();
    const formatOk = NICK_RE.test(v);
    const notDup   = nickNameEl?.dataset.duplicate !== "true";
    return [formatOk, notDup];
});

// ===== 입력/블러 시 공통 닉네임 처리 =====
async function handleNicknameCheck() {
    if (!nickNameEl) return;

    // 형식 검증(UI 갱신 OK)
    const ok = verifyNicknameField(nickNameEl, { re: NICK_RE });
    if (!ok) {
        delete nickNameEl.dataset.duplicate;
        return refreshSubmit();
    }

    const v = nickNameEl.value.trim();

    // 내 원래 닉네임과 같으면 중복검사 스킵 (사용 가능 처리)
    if (v === originalNickname && v.length > 0) {
        nickNameEl.dataset.duplicate = ""; // 중복 아님
        setFieldState(nickNameEl, { ok: true, msg: "현재 사용 중인 닉네임입니다." });
        return refreshSubmit();
    }

    // 형식 통과 & 기존과 다르면 서버 중복확인
    await verifyDupAsync(nickNameEl, isNickDuplicated, {
        okMsg: "사용 가능한 닉네임입니다.",
        dupMsg: "이미 사용 중인 닉네임입니다."
    });

    refreshSubmit();
}

// ===== 닉네임 입력 핸들링 (디바운스) =====
const onNicknameInput = debounce(handleNicknameCheck, 250);
nickNameEl?.addEventListener("input", onNicknameInput);
nickNameEl?.addEventListener("blur", handleNicknameCheck);

// ===== 초기 데이터 로드 =====
(async function preload() {
    try {
        const d = await getMyPage();
        const user = d?.data || {};

        if (emailEl)    emailEl.value = user.email ?? "";
        if (nickNameEl) {
            originalNickname = user.nickname ?? "";
            nickNameEl.value = originalNickname;

            // 형식 검사 후, 프리로드 즉시 중복 로직까지 수행
            await handleNicknameCheck();
        }

        // 서버 이미지 → 업로더 초기값 + 아바타 반영
        if (user.imageUrl) {
            uploader.setInitial([{ imageKey: user.imageKey, imageUrl: user.imageUrl, order: 0 }]);
            currentImageKey = user.imageKey ?? null;
            setAvatarPreview(user.imageUrl);
        } else {
            uploader.setInitial([]);
            currentImageKey = null;
        }

        refreshSubmit();
    } catch (e) {
        await showToast(e?.message || "기존 내용을 불러오지 못했습니다.");
    }
})();

// ===== 이미지 변경 =====
changeImageBtn?.addEventListener("click", async () => {
    hiddenFile.value = "";
    hiddenFile.click();
});

hiddenFile.addEventListener("change", async (e) => {
    const files = e.currentTarget.files || [];
    if (!files.length) return;

    try {
        await uploader.upload(files);    // presign → PUT → confirm
        keepOnlyOneAndPreview();         // 마지막 1장만 유지 + 미리보기
        await showToast("프로필 이미지가 변경되었습니다.");
    } catch (err) {
        console.error(err);
        await showToast(err?.message || "이미지 변경 중 오류가 발생했습니다.");
    }
});

// ===== 제출 =====
formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 형식 재확인(UI 갱신)
    const formatOk = verifyNicknameField(nickNameEl, { re: NICK_RE });
    if (!formatOk) return refreshSubmit();

    // 제출 직전 최신 중복 상태 재확인
    // (내 기존 닉네임과 동일하면 중복검사 스킵)
    let usable = true;
    const v = nickNameEl.value.trim();
    if (v !== originalNickname) {
        usable = await verifyDupAsync(nickNameEl, isNickDuplicated, {
            okMsg: "사용 가능한 닉네임입니다.",
            dupMsg: "이미 사용 중인 닉네임입니다."
        });
    } else {
        nickNameEl.dataset.duplicate = "";
    }

    if (!usable) {
        setFieldState(nickNameEl, { ok: false, msg: "이미 사용 중인 닉네임입니다." });
        nickNameEl.dataset.duplicate = "true";
        nickNameEl.focus();
        return refreshSubmit();
    }

    const nickname = nickNameEl.value.trim();
    const keys     = uploader.getKeys();
    const imageKey = keys.length ? keys[0] : currentImageKey ?? null;

    const payload = { nickname, imageKey };

    // 스피너 표시
    submitSpinner.show();

    try {
        await updateMyPage(payload);
        await showToast("정상적으로 수정되었습니다.");
        location.href = "/pages/html/post-list.html";
    } catch (err) {
        submitSpinner.hide();
        console.error(err);
        await showToast("기존 이미지/닉네임 수정없이 수정할 수 없습니다.");
    }
});

// ===== 탈퇴 =====
withdrawBtn?.addEventListener("click", async () => {
    if (!confirm("정말 탈퇴하시겠습니까?")) return;
    try {
        await withdraw();
        // 인증 정보 삭제
        localStorage.removeItem('accessToken');
        sessionStorage.clear();
    } finally {
        location.href = "/";
    }
});
