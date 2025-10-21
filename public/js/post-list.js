/// API
import {getPosts} from '../api/post.js';

/// 컴포넌트
import {createPostCard} from '../components/postCard.js';

// ───────────── 내부 설정 ─────────────
const listEl = document.getElementById('postList');

/// 에러
function showError(msg) {
    listEl.innerHTML = `<p class="error" style="color:#c00">${msg}</p>`;
}

/// 목록
async function renderList() {
    try {
        // API 응답 전체를 response 변수에 저장합니다.
        const response = await getPosts(2);

        // 실제 게시글 목록은 response.data.content 에 있습니다.
        const postList = response.data.content;

        // 백엔드 응답 구조 맞춰서 데이터 가공
        const posts = postList.map(p => ({
            id: p.id,
            title: p.title,
            likes: p.likeCount,
            comments: p.commentCount,
            views: p.viewCount,
            date: p.createdAt,
            author: p.user?.nickname,
        }));

        listEl.innerHTML = '';

        if (posts.length === 0) {
            listEl.innerHTML = `<p class="empty">게시글이 없습니다.</p>`;
            return;
        }

        for (const post of posts) {
            const card = await createPostCard(post, {
                onClick: (p) => {
                    location.href = `/pages/html/post-detail.html?id=${encodeURIComponent(p.id)}`;
                },
            });
            listEl.appendChild(card);
        }
    } catch (err) {
        console.error(err);
        // API 응답 자체에 에러 메시지가 있을 경우 그것을 사용합니다.
        const errorMessage = err.response?.data?.message || err.message;
        showError(errorMessage);
    }
}

// 초기화 실행
renderList();