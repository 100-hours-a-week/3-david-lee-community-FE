// ───────────── API ─────────────
import { createPost } from "../api/post.js";

// ───────────── 컴포넌트 ─────────────
import {createImageGalleryUploader} from "./image-uploader.js";
import {createSpinnerOverlay} from "../pages/common/spinner-overlay.js";
import {showToast} from "../pages/common/toast.js";

// ───────────── DOM ─────────────
const formEl       = document.getElementById("postForm");
const titleInput   = document.getElementById("title");
const titleCount   = document.getElementById("titleCount");
const contentInput = document.getElementById("content");
const contentCount = document.getElementById("contentCount");

const fileInput = document.getElementById('e-image');
const listEl       = document.getElementById("imageList");  // 이미지 카드 컨테이너
const dropZone     = document.getElementById("dropZone");   // 선택(없으면 listEl이 드롭존)

// 카운터
titleInput?.addEventListener("input", () => {
    titleCount.textContent = `${titleInput.value.length} / ${titleInput.maxLength}`;
});
contentInput?.addEventListener("input", () => {
    contentCount.textContent = `${contentInput.value.length} / ${contentInput.maxLength}`;
});

/// 작동 스피너 넣기
const overlay = createSpinnerOverlay({
    spinnerSize: 30,
    border: 6,
    borderColor: "#fff",
    backdrop: "rgba(0,0,0,.45)",
});

// 갤러리 업로더 인스턴스
const gallery = createImageGalleryUploader({
    listEl,
    fileInputEl: fileInput,
    addMoreBtnEl: addBtn,
    dropZoneEl: dropZone,
    maxSizeMB: 10,
    onError: (m) => showToast(m),
    onToast: (m) => showToast(m),
    onUploadStart: () => overlay.show({ lockSelectors: ["#postForm input", "#postForm button", "#postForm textarea", "#postForm select"] }),
    onUploadEnd:   () => overlay.hide(),
});

// 작성 폼 제출
formEl?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = formEl.querySelector('button[type="submit"]');
    const categoryId = "2";
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title)  return showToast("제목을 입력하세요.");
    if (!content) return showToast("내용을 입력하세요.");

    submitBtn.disabled = true;

    try {
        const imageKeys = gallery.getKeys(); // 정렬 적용된 순서대로
        const payload = { categoryId, title, content, imageKeys };
        const res = await createPost(payload);

        await showToast("글 작성이 완료되었습니다.");
        location.href = `/pages/html/post-detail.html?id=${encodeURIComponent(res.data.postId)}`;
    } catch (err) {
        console.error(err);
        await showToast(err?.message || "글 작성 중 오류가 발생했습니다.");
    } finally {
        submitBtn.disabled = false;
    }
});
