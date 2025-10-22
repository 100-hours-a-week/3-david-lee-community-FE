/// API
import {getPostDetail, deletePost} from '../api/post.js';
import {likePost} from "../api/like.js";
import {unlikePost} from "../api/like.js";

/// 컴포넌트
import {createPostView} from '../components/postView.js';

/// 댓글 조회 JS 사용
import {loadComments} from './comment-list.js';
import {registerCommentSubmit} from "./comment-new.js";

// ───────────── 내부 설정 ─────────────

// DOM으로 postRoot 꺼내기
const root = document.getElementById('postRoot');
const params = new URLSearchParams(location.search);

/// ID 획득
const postId = params.get('id');

// ───────────── 예외 표기 설정 ─────────────
function showError(msg){
    root.innerHTML = `<p class="error" style="color:#c00">${msg}</p>`;
}

// ───────────── 상세 조회 ─────────────
async function load() {

    try {
        if(!postId) {
            throw new Error('잘못된 접근입니다. (id 누락)');
        }

        /// API 호출
        const data = await getPostDetail(postId);

        // 백엔드 응답
        const post = {
            id: data.id,
            title: data.title,
            content: data.content,
            author: data.author?.nickname,
            createdAt: data.createdAt,
            likeCount: data.likeCount ?? 0,
            viewCount: data.viewCount ?? 0,
            commentCount: data.commentCount ?? 0,
            images: data.image ?? [],
            comments: data.comments ?? [],
            editable: data.editable,
            liked: data.liked,
        };

        // ───────────── 좋아요 ─────────────
        const viewOptions = {
            onLike: async (p) => {
                const likeBtn = document.querySelector('[data-action="like"]');

                // 이미 좋아요 눌렀는지 확인
                const isLiked = likeBtn.classList.toggle('liked'); // 토글
                try {
                    if (isLiked) {
                        await likePost({postId}); // 백엔드 호출
                        location.href = `/pages/html/post-detail.html?id=${encodeURIComponent(postId)}`;

                    } else {
                        await unlikePost(postId); // 백엔드 호출
                        location.href = `/pages/html/post-detail.html?id=${encodeURIComponent(postId)}`;
                    }

                } catch (e) {
                    // 실패 시 원상 복귀
                    likeBtn.classList.toggle('liked', !isLiked);
                    likeBtn.style.color = isLiked ? '' : 'red';
                    alert('좋아요 처리 중 오류가 발생했습니다: ' + (e.message || ''));
                }
            },
        };

        // ───────────── 수정/삭제 ─────────────
        if (post.editable) {

            // ───────────── 수정 ─────────────
            viewOptions.onEdit = () => location.href = `/pages/html/post-edit.html?id=${postId}`;

            // ───────────── 삭제 ─────────────
            viewOptions.onDelete = async () => {
                if (!confirm('정말 삭제하시겠습니까?')) return;
                try {
                    await deletePost(postId);
                    alert('삭제되었습니다.');
                    location.href = '/pages/html/post-list.html';
                } catch (e) {
                    alert('삭제 실패: ' + (e.message || ''));
                }
            };
        }

        // ───────────── post/viewOptions를 ─────────────
        const view = await createPostView(post, viewOptions);

        root.innerHTML = '';
        root.appendChild(view);

        // 조회 시 이미 좋아요였다면 버튼을 빨갛게
        if (post.liked) {
            const likeBtn = root.querySelector('[data-action="like"]');
            if (likeBtn) {
                likeBtn.classList.add('liked');
            }
        }

        // ───────────── 댓글 작성 ─────────────
        await registerCommentSubmit(postId);

        // ───────────── 댓글 조회 ─────────────
        await loadComments(postId, root);


    } catch (e) {
        console.error(e);
        showError(e.message || '상세 조회 실패');
    }
}

/// 게시글 조회 로직 실행
load();