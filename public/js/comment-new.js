// ───────────── API ─────────────
import { saveComments } from "../api/comment.js";

// ───────────── 의존성 ─────────────
import { loadComments } from "./comment-list.js";

export async function registerCommentSubmit(postId) {
    // 중복 바인딩 방지
    if (document.body.dataset.commentSubmitBound === "1") return;
    document.body.dataset.commentSubmitBound = "1";

    document.addEventListener("click", async (e) => {
        if (!e.target.matches('[data-action="comment"]')) return;

        e.preventDefault();
        const textarea = document.getElementById("comment");
        const content = textarea?.value.trim();

        /// 없으면 요청
        if (!content) {
            return alert("댓글 내용을 입력해주세요!");
        }

        const newCommentData = { parentId: null, postId, content };

        // UX: 버튼 비활성화
        const btn = e.target;
        btn.disabled = true;

        try {
            await saveComments(newCommentData);

            // 입력창 초기화
            textarea.value = "";

            // 전체 목록 재조회 + 렌더
            const root = document.getElementById("postRoot");
            await loadComments(postId, root);

            // 스크롤/포커스 보정(선택)
            document.querySelector("#commentList")?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (err) {
            console.error(err);
            alert(err?.message || "댓글 작성 중 오류가 발생했습니다.");
        } finally {
            btn.disabled = false;
        }
    });
}
