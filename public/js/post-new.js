// ───────────── API ─────────────
import { createPost } from "../api/post.js";
import { showToast } from "../pages/common/toast.js";

// ───────────── 이미지 업로더 모듈 ─────────────
import {filterValidImages, uploadImagesAndGetKeys, bindFileNameLabel,} from "./image-uploader.js";

// ───────────── HTML DOM ─────────────
const fileInput     = document.getElementById("image");
const nameSpan      = document.getElementById("filename");
const titleInput    = document.getElementById("title");
const titleCount    = document.getElementById("titleCount");
const contentInput  = document.getElementById("content");
const contentCount  = document.getElementById("contentCount");
const formEl        = document.getElementById("postForm");

// 카운터
titleInput.addEventListener("input", () => {
    titleCount.textContent = `${titleInput.value.length} / ${titleInput.maxLength}`;
});
contentInput.addEventListener("input", () => {
    contentCount.textContent = `${contentInput.value.length} / ${contentInput.maxLength}`;
});

// 파일명 라벨 바인딩(모듈 제공 유틸)
bindFileNameLabel(fileInput, nameSpan);

// ───────────── 제출 로직 ─────────────
formEl.addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const submitBtn = form.querySelector('button[type="submit"]');
    const categoryId = "2";
    const title = form.title.value.trim();
    const content = form.content.value.trim();

    /// 없으면
    if (!title)  {
        return showToast("제목을 입력하세요.");
    }
    if (!content) {
        return showToast("내용을 입력하세요.");
    }

    // 원본 파일 목록
    const allFiles = Array.from(fileInput?.files || []);

    // (파일 검증 + 이름/타입/크기 선별
    const files = filterValidImages(allFiles, 10);
    if (allFiles.length !== files.length) {
        await showToast("일부 파일이 이름/타입/크기 조건 불일치로 제외되었습니다.");
    }

    submitBtn.disabled = true;

    try {
        let imageKeys = [];
        if (files.length > 0) {
            // 모듈이 presign → PUT → confirm까지 처리하고 업로드된 key[] 반환
            imageKeys = await uploadImagesAndGetKeys(files);
        }

        const payload = { categoryId, title, content, imageKeys };
        const res = await createPost(payload);

        await showToast("글 작성이 완료되었습니다.");
        window.location.href = `/pages/html/post-detail.html?id=${encodeURIComponent(res.data.postId)}`;
    } catch (err) {
        console.error(err);
        await showToast(err?.message || "글 작성 중 오류가 발생했습니다.");
    } finally {
        submitBtn.disabled = false;
    }
});
