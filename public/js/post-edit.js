/// API
import { getPostDetail, updatePost } from '../api/post.js';

// ───────────── 내부 설정 ─────────────

const params = new URLSearchParams(location.search);
const postId = params.get('id');
const titleEl = document.getElementById('e-title');
const contentEl = document.getElementById('e-content');

// ───────────── 기존 값 호출 ─────────────
(async function preload() {
    if (!postId) {
        alert('잘못된 접근입니다. (id 누락)');
        location.href = '/pages/html/post-list.html';
        return;
    }
    try {
        const d = await getPostDetail(postId); // 서버에서 최신 데이터 가져옴
        titleEl.value = d.title ?? '';
        contentEl.value = d.content ?? '';

    } catch (e) {
        console.error(e);
        alert(e?.message || '기존 내용을 불러오지 못했습니다.');
    }
})();

// ───────────── 수정 ─────────────
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const categoryId = "2";
    const title = titleEl.value.trim();
    const content = contentEl.value.trim();
    const imageUrls = [];

    if (!title) return alert('제목을 입력하세요.');
    if (!content) return alert('내용을 입력하세요.');

    /// 값
    const payload = { categoryId, title, content, imageUrls };

    /// 호출
    try {

        /// 수정
        await updatePost(postId, payload);
        alert('글 수정이 완료되었습니다.');

        /// 리다이렉트
        window.location.href = `/pages/html/post-detail.html?id=${postId}`;

    } catch (err) {
        console.error(err);
        alert(err?.message || '글 작성 중 오류가 발생했습니다.');
    }
});