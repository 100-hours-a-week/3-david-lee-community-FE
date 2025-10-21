import {initAppBar} from '../pages/common/appbar.js';
import {attachLogout} from '../components/logout.js';
import {createPost} from '../api/post.js';

// ───────────── 기본 설정 (아바타 및 로그아웃) ─────────────
const { menu } = initAppBar();
attachLogout('#logoutLink');

// ───────────── 제출 로직 ─────────────
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const categoryId = "2";
    const title = form.title.value.trim();
    const content = form.content.value.trim();
    const imageUrls = [];

    if (!title) return alert('제목을 입력하세요.');
    if (!content) return alert('내용을 입력하세요.');

    /// 값
    const payload = { categoryId, title, content, imageUrls };

    /// 호출
    try {
        const res = await createPost(payload);

        alert('글 작성이 완료되었습니다.');
        window.location.href = `/pages/html/post-detail.html?id=${encodeURIComponent(res.data.postId)}`;

    } catch (err) {
        console.error(err);
        alert(err?.message || '글 작성 중 오류가 발생했습니다.');
    }
});