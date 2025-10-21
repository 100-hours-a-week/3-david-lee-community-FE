/// API
import {getPostDetail, deletePost} from '../api/post.js';
import {likePost} from "../api/like.js";
import {unlikePost} from "../api/like.js";
import {getComments} from '../api/comment.js';

/// 컴포넌트
import {createPostView} from '../components/postView.js';
import {renderCommentThreads} from "../components/commentCard.js";

// ───────────── 내부 설정 ─────────────
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
        if(!postId) throw new Error('잘못된 접근입니다. (id 누락)');
        const data = await getPostDetail(postId);

        // 백엔드 응답 → 뷰 모델 매핑
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

        // ───────────── 댓글 조회 ─────────────
        const commentList = root.querySelector('#commentList');
        if (commentList) {
            commentList.innerHTML = '<p class="skeleton">댓글을 불러오는 중…</p>';
            try {
                const res = await getComments(postId);

                console.log(res);

                const threads = res?.data?.content ?? [];
                commentList.innerHTML = ''; // 스켈레톤 제거
                await renderCommentThreads(threads, commentList, {
                    onReply:  (c) => console.log('답글 클릭:', c),
                    onEdit:   (c) => console.log('수정 클릭:', c),
                    onDelete: (c) => console.log('삭제 클릭:', c),
                    onClick:  (c) => console.log('스레드 포커스:', c),
                });
            } catch (err) {
                console.error(err);
                commentList.innerHTML = `<p style="color:#c00">댓글을 불러오는 중 오류가 발생했습니다.</p>`;
            }
        } else {
            console.warn('#commentList 컨테이너가 뷰에 없습니다. createPostView 템플릿에 추가하세요.');
        }

    } catch (e) {
        console.error(e);
        showError(e.message || '상세 조회 실패');
    }
}

/// 게시글 조회 로직
load();