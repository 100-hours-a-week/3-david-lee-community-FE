// ───────────── API ─────────────
import { createPost } from '../api/post.js';
import { getUrls, confirmUrls } from '../api/image.js';
import {showToast} from "../pages/common/toast.js";

// ───────────── HTML DOM ─────────────
const fileInput = document.getElementById('image');
const nameSpan = document.getElementById('filename');
const titleInput = document.getElementById('title');
const titleCount = document.getElementById('titleCount');
const contentInput = document.getElementById('content');
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

// ───────────── 제출 로직 ─────────────
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const submitBtn = form.querySelector('button[type="submit"]');
    const categoryId = "2";
    const title = form.title.value.trim();
    const content = form.content.value.trim();
    const allFiles = Array.from(fileInput?.files || []);
    let imageKeys = [];

    if (!title) {
        return alert('제목을 입력하세요.');
    }
    if (!content) {
        return alert('내용을 입력하세요.');
    }

    // (선택) 파일 검증 + 이름/타입/크기 선별
    const files = allFiles.filter(f =>
        !!f &&
        !!f.name &&
        f.name !== 'null' &&                    // 이름이 "null"인 파일 제외
        f.type?.startsWith('image/') &&        // 이미지 타입만
        f.size <= 10 * 1024 * 1024             // 10MB 이하
    );

    if (allFiles.length !== files.length) {
        // 사용자가 이상한 파일 포함했을 수 있으니 안내
        await showToast("일부 파일이 이름/타입/크기 조건 불일치로 제외되었습니다.");
    }

    submitBtn.disabled = true;

    try {
        /// presign → S3 업로드 → confirm (이미지 있을 때만)
        if (files.length > 0) {
            /// 결과를 변수에 담아야 효과가 있음! (기존 코드의 filter는 반환값 미사용이었음)
            const fileNames = files.map(f => f.name);

            console.log('로그' + fileNames);

            const presign = await getUrls(fileNames);
            const items = presign?.data ?? [];

            if (!Array.isArray(items) || items.length !== files.length) {
                throw new Error('프리사인드 URL 개수가 파일 수와 다릅니다.');
            }

            /// presign 응답 강력 검증 + URL 따옴표 이중포장 제거
            items.forEach((it, idx) => {
                if (!it || typeof it.fileName !== 'string') {
                    throw new Error(`presign 응답 형식 오류 (index ${idx}, fileName 누락)`);
                }
                if (!it.preSignedUrl || typeof it.preSignedUrl !== 'string') {
                    throw new Error(`presign 응답 형식 오류 (index ${idx}, preSignedUrl 누락)`);
                }
                if (!it.key || it.key === 'null' || it.key === null) {
                    throw new Error(`presign 응답 key가 null입니다. (fileName=${it.fileName})`);
                }
                // 서버가 실수로 문자열에 따옴표를 한 번 더 씌운 경우 제거
                if (/^".*"$/.test(it.preSignedUrl)) {
                    it.preSignedUrl = it.preSignedUrl.slice(1, -1);
                }
            });

            /// fileName으로 매핑(인덱스 의존 제거)
            const byName = new Map(items.map(it => [it.fileName, it]));

            const uploadedKeys = [];
            for (const file of files) {
                const item = byName.get(file.name);
                if (!item) {
                    throw new Error(`presign 응답에 ${file.name}가 없습니다. (서버가 파일명을 변경했을 수 있음)`);
                }

                const { preSignedUrl, key } = item;

                // S3 업로드
                const putRes = await fetch(preSignedUrl, {
                    method: "PUT",
                    headers: { "Content-Type": file.type },
                    body: file,
                });
                if (!putRes.ok) {
                    throw new Error(`S3 업로드 실패: ${file.name}`);
                }

                // 업로드 키 정제: null/"null" 제거
                if (key && key !== 'null') {
                    uploadedKeys.push(key);
                } else {
                    throw new Error(`업로드 키가 null 처리되어 제외됨: ${file.name}`);
                }
            }

            if (uploadedKeys.length === 0) {
                throw new Error('유효한 업로드 키가 없습니다.');
            }

            await confirmUrls(uploadedKeys);

            // 최종 imageKeys도 이중 안전장치
            imageKeys = uploadedKeys.filter(k => k && k !== 'null');
            if (imageKeys.length !== uploadedKeys.length) {
                throw new Error('일부 업로드 키가 null로 판정되어 제외되었습니다.');
            }
        }

        // 2) 게시글 생성 (imageKeys는 항상 null/문자열 "null" 제거된 상태)
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
