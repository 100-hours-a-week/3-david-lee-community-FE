/// API
import { createPost } from '../api/post.js';
import { getUrls, confirmUrls } from '../api/image.js';

// 파일명 표시
const fileInput = document.getElementById('image');
const nameSpan = document.getElementById('filename');

// 입력 표시
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const titleCount = document.getElementById('titleCount');
const contentCount = document.getElementById('contentCount');

titleInput.addEventListener('input', () => {
    titleCount.textContent = `${titleInput.value.length} / ${titleInput.maxLength}`;
});

contentInput.addEventListener('input', () => {
    contentCount.textContent = `${contentInput.value.length} / ${contentInput.maxLength}`;
});


fileInput.addEventListener('change', () => {
    const files = Array.from(fileInput.files || []);
    if (files.length === 0) {
        nameSpan.textContent = '파일을 선택해주세요.';
    } else if (files.length === 1) {
        nameSpan.textContent = files[0].name;
    } else {
        nameSpan.textContent = `${files[0].name} 외 ${files.length - 1}개`;
    }
});

titleInput.addEventListener('input', () => {
    titleCount.textContent = `${titleInput.value.length} / ${titleInput.maxLength}`;
});

contentInput.addEventListener('input', () => {
    contentCount.textContent = `${contentInput.value.length} / ${contentInput.maxLength}`;
});

// ───────────── 제출 로직 ─────────────
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const submitBtn = form.querySelector('button[type="submit"]');
    const categoryId = "2";
    const title = form.title.value.trim();
    const content = form.content.value.trim();
    const files = Array.from(document.getElementById('image')?.files || []); // ← id 맞춤
    let imageKeys = [];

    if (!title) return alert('제목을 입력하세요.');
    if (!content) return alert('내용을 입력하세요.');

    // (선택) 파일 검증
    for (const f of files) {
        if (!f.type.startsWith('image/')) return alert('이미지 파일만 업로드 가능합니다.');
        if (f.size > 10 * 1024 * 1024) return alert('10MB를 초과한 파일이 있습니다.');
    }

    submitBtn.disabled = true;

    try {
// 1) presign → S3 업로드 → confirm (이미지 있을 때만)
        if (files.length > 0) {
            const fileNames = files.map(f => f.name);
            const presign = await getUrls(fileNames);

            // 서버 응답 구조: { success, code, message, data: [ { fileName, preSignedUrl, key } ] }
            const items = presign?.data ?? [];
            if (items.length !== files.length) {
                throw new Error('프리사인드 URL 개수가 파일 수와 다릅니다.');
            }

            // fileName으로 매핑(인덱스 의존 제거)
            const byName = new Map(items.map(it => [it.fileName, it]));

            const uploadedKeys = [];
            for (const file of files) {
                const item = byName.get(file.name);
                if (!item) throw new Error(`presign 응답에 ${file.name}가 없습니다.`);

                const { preSignedUrl, key } = item;

                const putHeaders = {"Content-Type": file.type};
                const putRes = await fetch(preSignedUrl, {
                    method: "PUT",
                    headers: putHeaders,
                    body: file,
                });
                if (!putRes.ok) {
                    throw new Error(`S3 업로드 실패: ${file.name}`);
                }

                uploadedKeys.push(key);
            }

            await confirmUrls(uploadedKeys);
            imageKeys = uploadedKeys;
        }

        // 2) 게시글 생성
        const payload = { categoryId, title, content, imageKeys };
        const res = await createPost(payload);

        alert('글 작성이 완료되었습니다.');
        window.location.href = `/pages/html/post-detail.html?id=${encodeURIComponent(res.data.postId)}`;

    } catch (err) {
        console.error(err);
        alert(err?.message || '글 작성 중 오류가 발생했습니다.');
    } finally {
        submitBtn.disabled = false;
    }
});
