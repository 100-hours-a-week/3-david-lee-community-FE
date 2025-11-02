import { checkDuplicateNickname, getMyPage, updateMyPage, withdraw } from "../api/user.js";
import { showToast } from "../pages/common/toast.js";
import { createImageGalleryUploader } from "./image-uploader.js";
import {createSpinnerOverlay} from "../pages/common/spinner-overlay.js";

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

// ===== 숨김 업로드 컨테이너 구성 =====
const hiddenList = document.createElement("div");
hiddenList.style.display = "none";
document.body.appendChild(hiddenList);

const hiddenFile = document.createElement("input");
hiddenFile.type = "file";
hiddenFile.accept = "image/*";
hiddenFile.style.display = "none";
document.body.appendChild(hiddenFile);

/// 작동 스피너 넣기
const overlay = createSpinnerOverlay({
    spinnerSize: 30,
    border: 6,
    borderColor: "#fff",
    backdrop: "rgba(0,0,0,.45)",
});

// 업로더 만들기
const uploader = createImageGalleryUploader({
    listEl: hiddenList,
    fileInputEl: hiddenFile,
    maxSizeMB: 10,
    onError: (msg) => showToast(msg),
    onToast: (msg) => showToast(msg),
    onUploadStart: () => overlay.show({ lockSelectors: ["#postForm input", "#postForm button", "#postForm textarea", "#postForm select"] }),
    onUploadEnd:   () => overlay.hide(),
});

// 1장만 유지하도록 보조 함수
function keepOnlyOneAndPreview() {
    const state = uploader.getState();
    if (state.length === 0) {
        currentImageKey = null;
        return;
    }
    const last = state[state.length - 1];

    // 1장만 남기도록 setInitial 재세팅
    uploader.setInitial([{ imageKey: last.key, imageUrl: last.url, order: 0 }]);

    currentImageKey = last.key || null;
    setAvatarPreview(last.url);
}

// 아바타 미리보기 반영
function setAvatarPreview(url) {
    if (!profileAvatarEl) return;
    profileAvatarEl.style.backgroundImage = `url("${url}")`;
    profileAvatarEl.style.backgroundSize = "cover";
    profileAvatarEl.style.backgroundPosition = "center";
    profileAvatarEl.style.backgroundRepeat = "no-repeat";
}

// 닉네임 중복체크 래퍼
async function isNickDuplicated(value) {
    const res = await checkDuplicateNickname(value);
    return res?.data?.duplicate ?? res?.duplicate ?? res === true;
}

// 제출 버튼 활성화
const refreshSubmit = createFormEnabler(submitBtn, () => {
    const formatOk = verifyNicknameField(nickNameEl, { re: NICK_RE });
    const notDup   = nickNameEl?.dataset.duplicate !== "true";
    return [formatOk, notDup];
});

// 닉네임 입력 → 형식 →(통과 시) 중복 체크
const onNicknameInput = debounce(async () => {
    const ok = verifyNicknameField(nickNameEl, { re: NICK_RE });
    if (!ok) {
        delete nickNameEl.dataset.duplicate;
        return refreshSubmit();
    }
    await verifyDupAsync(nickNameEl, isNickDuplicated, {
        okMsg: "사용 가능한 닉네임입니다.",
        dupMsg: "이미 사용 중인 닉네임입니다."
    });
    refreshSubmit();
}, 300);

nickNameEl?.addEventListener("input", onNicknameInput);

// 초기 데이터 로드
(async function preload() {
    try {
        const d = await getMyPage();
        const user = d?.data || {};

        if (emailEl)    emailEl.value = user.email ?? "";
        if (nickNameEl) nickNameEl.value = user.nickname ?? "";

        verifyNicknameField(nickNameEl, { re: NICK_RE });
        delete nickNameEl.dataset.duplicate;

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

// 이미지 변경 버튼 → 파일 선택 → 업로드 → 1장 유지 & 미리보기
changeImageBtn?.addEventListener("click", async () => {
    hiddenFile.value = "";
    hiddenFile.click();
});

hiddenFile.addEventListener("change", async (e) => {
    const files = e.currentTarget.files || [];
    if (!files.length) return;

    try {
        await uploader.upload(files);    // 내부에서 presign → PUT → confirm
        keepOnlyOneAndPreview();         // 마지막 1장만 유지하고 미리보기 반영
        await showToast("프로필 이미지가 변경되었습니다.");
    } catch (err) {
        console.error(err);
        await showToast(err?.message || "이미지 변경 중 오류가 발생했습니다.");
    }
});

// 제출
formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formatOk = verifyNicknameField(nickNameEl, { re: NICK_RE });
    if (!formatOk) return refreshSubmit();

    const dupOk = await verifyDupAsync(nickNameEl, isNickDuplicated, {
        okMsg: "사용 가능한 닉네임입니다.",
        dupMsg: "이미 사용 중인 닉네임입니다."
    });
    console.log(dupOk);

    if (dupOk) {
        // 중복일 때 시각적 피드백을 확실히 보장
        setFieldState(nickNameEl, { ok: false, msg: "이미 사용 중인 닉네임입니다." });
        nickNameEl.dataset.duplicate = "true";
        nickNameEl.focus();
        return refreshSubmit();
    }

    const nickname = nickNameEl.value.trim();
    const keys     = uploader.getKeys();
    const imageKey = keys.length ? keys[0] : currentImageKey ?? null;

    const payload = { nickname, imageKey };
    console.log(payload);

    const oldText = submitBtn?.textContent ?? "";
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "수정 중...";
    }

    try {
        await updateMyPage(payload);
        await showToast("정상적으로 수정되었습니다.");
        if (submitBtn) submitBtn.textContent = "수정완료";
        location.href = "/pages/html/post-list.html";
    } catch (err) {
        console.error(err);
        await showToast("수정 실패");
        if (submitBtn) submitBtn.textContent = oldText;
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});

// 탈퇴
withdrawBtn?.addEventListener("click", async () => {
    if (!confirm("정말 탈퇴하시겠습니까?")) return;
    try {
        await withdraw();
    } finally {
        location.href = "/pages/html/login.html";
    }
});
