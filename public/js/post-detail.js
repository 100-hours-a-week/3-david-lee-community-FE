// ───────────── API ─────────────
import { getPostDetail, deletePost } from '../api/post.js';
import { likePost } from "../api/like.js";
import { unlikePost } from "../api/like.js";

/// 컴포넌트
import { createPostDetailCard } from '../components/PostDetailCard.js';

/// 댓글 조회 JS 사용
import { loadComments } from './comment-list.js';
import { registerCommentSubmit } from "./comment-new.js";
import {showToast} from "../pages/common/toast.js";

// ───────────── 내부 설정 ─────────────
const root = document.getElementById('postRoot');
const params = new URLSearchParams(location.search);
const postId = params.get('id');

// ───────────── 예외 표기 ─────────────
function showError(msg){
    root.innerHTML = `<p class="error" style="color:#c00">${msg}</p>`;
}

// ───────────── 상세 조회 ─────────────
async function load() {
    try {
        if (!postId) throw new Error('잘못된 접근입니다. (id 누락)');

        // 1) 상세 조회
        const data = await getPostDetail(postId);

        // 2) 이미지 정렬/매핑
        const rawImages = Array.isArray(data.image) ? data.image : [];
        const sortedImages = rawImages.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const imageUrls = sortedImages.map(it => it.imageUrl);

        // 3) 화면용 모델
        const post = {
            id: data.id,
            title: data.title,
            content: data.content,
            author: data.author,
            createdAt: data.createdAt,
            likeCount: data.likeCount ?? 0,
            viewCount: data.viewCount ?? 0,
            commentCount: data.commentCount ?? 0,
            images: imageUrls,
            editable: data.editable,
            liked: data.liked,
        };

        // 4) 이벤트 콜백들 (새로고침 없음: 낙관적 갱신은 createPostDetailCard 내부에서 처리)
        const viewOptions = {
            // prevLiked: 토글 "직전" 상태(true면 해제 요청, false면 좋아요 요청)
            onToggleLike: async (prevLiked) => {
                if (!prevLiked) {
                    await likePost({ postId });
                } else {
                    await unlikePost(postId);
                }
            },
        };

        if (post.editable) {
            viewOptions.onEdit = () => {
                location.href = `/pages/html/post-edit.html?id=${postId}`;
            };
            viewOptions.onDelete = async () => {
                if (!confirm('정말 삭제하시겠습니까?')) return;
                try {
                    await deletePost(postId);
                    /// 흔적 남기기
                    location.href = '/pages/html/post-list.html?toast=deleted';
                } catch (e) {
                    await showToast('삭제 실패: ' + (e.message || ''));
                }
            };
        }

        // 5) 렌더
        const view = await createPostDetailCard(post, viewOptions);
        root.innerHTML = '';
        root.appendChild(view);

        // 6) 댓글 (필요 시 외부 핸들러 사용)
        await registerCommentSubmit(postId);
        await loadComments(postId, root);

    } catch (e) {
        console.error(e);
        showError(e.message || '상세 조회 실패');
    }
}

// 진입점
load();
