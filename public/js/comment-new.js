// ───────────── API ─────────────
import { saveComments } from "../api/comment.js";
import { createCommentCard } from "../components/commentCard.js";

// =================
//  새로운 댓글 생성
// =================

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
            // ───────────── 서버에 저장 ─────────────
            const res = await saveComments(newCommentData);

            // 서버에서 방금 생성된 댓글 객체가 응답으로 온다고 가정
            const newComment = res.data;

            // ───────────── DOM에 즉시 추가 ─────────────
            const commentList = document.querySelector('#commentList');
            if (commentList && newComment) {
                // 댓글 카드 생성
                const { node } = await createCommentCard(newComment, {
                    onCommentReply: (c) => console.log("답글 클릭:", c),
                    onCommentEdit: (c) => console.log("수정 클릭:", c),
                    onCommentDelete: (c) => console.log("삭제 클릭:", c),
                });

                // 맨 앞에 추가 (최신순)
                commentList.prepend(node);
            }

            // 입력창 초기화
            textarea.value = "";

            // 성공 알림
            alert("댓글이 등록되었습니다!");

        } catch (err) {
            console.error(err);
            alert(err?.message || "댓글 작성 중 오류가 발생했습니다.");
        }
    });
}
