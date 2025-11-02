// ───────────── API ─────────────
import { saveComments } from "../api/comment.js";

// ───────────── 의존성 ─────────────
import {loadComments} from "./comment-list.js";
import {showToast} from "../pages/common/toast.js";

// ───────────── 댓글 등록하기 ─────────────
export async function registerCommentSubmit(postId) {

    // 중복 바인딩 방지
    if (document.body.dataset.commentSubmitBound === "1") {
        return;
    }

    document.body.dataset.commentSubmitBound = "1";

    /// click => onClick 바꾸기
    document.addEventListener("click", async (e) => {

        /// 잘 클릭 된건지
        if (!e.target.matches('[data-action="comment"]')) {
            return;
        }

        e.preventDefault();
        const textarea = document.getElementById("comment");
        const content = textarea?.value.trim();

        /// 없으면 요청
        if (!content) {
            await showToast("댓글 내용을 입력해주세요!");
            return;
        }

        /// 토스트 띄우기
        await showToast("댓글이 입력되었습니다.");

        /// 새롭게 저장할 값
        const newCommentData = { parentId: null, postId, content };

        // 버튼 비활성화
        const btn = e.target;
        btn.disabled = true;

        try {
            await saveComments(newCommentData);

            // 입력창 초기화
            textarea.value = "";

            // 전체 목록 재조회
            const root = document.getElementById("postRoot");
            await loadComments(postId, root);

            // 스크롤
            document.querySelector("#commentList")?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (err) {
            console.error(err);
            await showToast("댓글 작성 중 오류가 발생했습니다.");
        } finally {
            btn.disabled = false;
        }
    });
}
