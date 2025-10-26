// =================
//  API
// =================
import { getComments } from "../api/comment.js";

// =================
//  컴포넌트
// =================
import {renderCommentThreads} from "../components/commentCard.js";
import {showToast} from "../pages/common/toast.js";
import {handleDelete, handleEdit, handleReply} from "./comment-edit.js";

// =================
//  댓글 리스트 조회
// =================
export async function loadComments(postId, root) {
    const commentList = root.querySelector('#commentList');
    commentList.innerHTML = '<p class="skeleton">댓글을 불러오는 중…</p>';

    try {
        const res = await getComments(postId);
        const threads = res.data.content;

        commentList.innerHTML = '';

        await renderCommentThreads(threads, commentList, {
            onCommentReply:  (c, ctx, e) => handleReply(c, ctx, postId, e),
            onCommentEdit:   (c, ctx, e) => handleEdit(c, ctx, e),
            onCommentDelete: (c, ctx, e) => handleDelete(c, ctx, e),
        });

    } catch (err) {
        console.error(err);
        await showToast(err);
        commentList.innerHTML = `<p style="color:#c00">댓글을 불러오는 중 오류가 발생했습니다.</p>`;
    }
}
