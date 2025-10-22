/// API 호출
import { getComments } from "../api/comment.js";
import { renderCommentThreads } from "../components/commentCard.js";

/// 댓글 리스트 조회
export async function loadComments(postId, root) {
    const commentList = root.querySelector('#commentList');
    if (!commentList) {
        console.warn('#commentList 컨테이너가 뷰에 없습니다. createPostView 템플릿에 추가하세요.');
        return;
    }

    commentList.innerHTML = '<p class="skeleton">댓글을 불러오는 중…</p>';

    try {
        /// postId를 인자로 받아 API 호출
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
}
