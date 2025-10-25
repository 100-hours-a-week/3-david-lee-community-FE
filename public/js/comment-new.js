// ───────────── API ─────────────
import { saveComments } from "../api/comment.js";

/**
 * 댓글 등록 버튼 클릭 이벤트 핸들러
 * @param {string|number} postId - 게시글 ID
 */
export async function registerCommentSubmit(postId) {
    document.addEventListener("click", async (e) => {
        if (!e.target.matches('[data-action="comment"]')) {
            return;
        }

        e.preventDefault();

        const textarea = document.getElementById("comment");
        const content = textarea?.value.trim();

        if (!content) {
            alert("댓글 내용을 입력해주세요!");
            return;
        }

        const newCommentData = {
            parentId: null, // 루트 댓글만 등록
            postId: postId,
            content: content,
        };

        try {
            await saveComments(newCommentData);
            alert("댓글이 등록되었습니다!");

            // 입력창 초기화
            textarea.value = "";

            // 필요 시 댓글 새로고침 로직
        } catch (err) {
            console.error(err);
            alert(err?.message || "댓글 작성 중 오류가 발생했습니다.");
        }
    });
}
