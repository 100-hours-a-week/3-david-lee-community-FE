// =================
//  API
// =================
import { deleteComment, saveComments, updateComment } from "../api/comment.js";

// =================
//  컴포넌트
// =================
import {showToast} from "../pages/common/toast.js";
import {createCommentCard} from "../components/commentCard.js";

// ───────────── 댓글 수정하기 ─────────────
export async function handleEdit(comment, ctx) {
    const { node, contentEl, editForm, editTextarea, editCancelBtn, editCount } = ctx || {};
    if (!node || !contentEl || !editForm || !editTextarea) return;

    // === 상단 캐싱 ===
    const toolbarEl = node.querySelector(".toolbar");
    const editBtnInToolbar = toolbarEl?.querySelector('[data-action="edit"]');

    // 삭제 상태면 수정 불가
    const deletedText = "삭제된 메시지입니다.";
    const isDeleted =
        node.classList.contains("is-deleted") ||
        (contentEl.textContent && contentEl.textContent.trim() === deletedText) ||
        comment.deleted === true ||
        comment.isDeleted === true;

    if (isDeleted) {
        editBtnInToolbar?.setAttribute("disabled", "true");
        await showToast("삭제된 댓글은 수정할 수 없습니다.");
        return;
    }

    // 이미 편집 중이면 포커스만
    if (!editForm.classList.contains("hidden")) {
        editTextarea.focus();
        return;
    }

    // 본문 숨기고 폼 보이기 + 값 세팅
    const original = contentEl.textContent ?? "";
    contentEl.style.display = "none";
    editTextarea.value = original;
    editForm.classList.remove("hidden");
    editTextarea.focus();

    // 카운터 초기화
    if (editCount) {
        editCount.textContent = `${original.length} / ${editTextarea.maxLength || 200}`;
    }

    // 중복 바인딩 방지
    if (editForm.dataset.bound === "1") return;
    editForm.dataset.bound = "1";

    // 카운터 업데이트 이벤트
    if (editCount) {
        editTextarea.addEventListener("input", () => {
            editCount.textContent = `${editTextarea.value.length} / ${editTextarea.maxLength || 200}`;
        });
    }

    // 취소
    editCancelBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        editForm.classList.add("hidden");
        contentEl.style.display = "";
    });

    // 저장
    editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = editTextarea.value.trim();
        if (!next) {
            await showToast("수정할 내용을 입력해주세요.");
            return;
        }

        try {
            await updateComment(comment.id, { content: next });
            node.classList.remove("is-deleted");
            contentEl.textContent = next;
            await showToast("댓글이 수정되었습니다.");
            editForm.classList.add("hidden");
            contentEl.style.display = "";
        } catch (err) {
            console.error(err);
            await showToast("수정 중 오류가 발생했습니다.");
        }
    });
}

// ───────────── 댓글 삭제하기 ─────────────
export async function handleDelete(comment, ctx) {
    const { node, contentEl, repliesContainer } = ctx || {};
    if (!node) return;

    // === 상단 캐싱 ===
    const toolbarEl = node.querySelector(".toolbar");
    const editBtnEl = toolbarEl?.querySelector('[data-action="edit"]');
    const deleteBtnEl = toolbarEl?.querySelector('[data-action="delete"]');
    const contentTargetEl = contentEl ?? node.querySelector(".comment__content");

    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
        await deleteComment(comment.id);

        // 대댓글 존재 여부
        const hasReplies = (repliesContainer?.children?.length ?? 0) > 0;

        if (!hasReplies) {
            // 대댓글이 없다면 바로 하드 삭제: 카드 제거
            node.remove();
        } else {
            // 대댓글이 있다면 소프트 삭제: 내용 치환 + 툴바 비활성
            const deletedText = "삭제된 메시지입니다.";
            if (contentTargetEl) contentTargetEl.textContent = deletedText;

            editBtnEl?.remove();
            deleteBtnEl?.remove();
        }

        await showToast("댓글이 삭제되었습니다.");
    } catch (e) {
        console.error(e);
        alert(e?.message || "삭제 중 오류가 발생했습니다.");
    }
}

// ───────────── 대댓글 작성하기 ─────────────
export async function handleReply(comment, ctx, postId) {
    const { replyForm, replyTextarea, replyCancelBtn, repliesContainer, replyCount } = ctx || {};
    if (!replyForm || !replyTextarea || !repliesContainer) return;

    // === 상단 캐싱 (이미 전달된 요소들로 충분) ===
    replyForm.classList.remove("hidden");
    replyTextarea.focus();

    // 카운터 초기화
    if (replyCount) {
        replyCount.textContent = `${replyTextarea.value.length} / ${replyTextarea.maxLength || 200}`;
    }

    // 중복 바인딩 방지
    if (replyForm.dataset.bound === "1") return;
    replyForm.dataset.bound = "1";

    // 카운터 업데이트 이벤트
    if (replyCount) {
        replyTextarea.addEventListener("input", () => {
            replyCount.textContent = `${replyTextarea.value.length} / ${replyTextarea.maxLength || 200}`;
        });
    }

    // 취소 (once)
    replyCancelBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        replyTextarea.value = "";
        if (replyCount) {
            replyCount.textContent = "0 / 200";
        }
        replyForm.classList.add("hidden");
    });

    // 제출
    replyForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const content = replyTextarea.value.trim();

        if (!content) {
            await showToast("내용을 입력해주세요.");
            return;
        }

        try {
            const res = await saveComments({ parentId: comment.id, postId, content });
            const newReply = res.data;

            const { node: replyNode } = await createCommentCard(newReply, {
                onCommentReply: (c2, ctx2) => handleReply(c2, ctx2, postId),
                onCommentEdit: handleEdit,
                onCommentDelete: handleDelete,
            });

            repliesContainer.appendChild(replyNode);
            await showToast("답글이 등록되었습니다.");

            // reset & hide
            replyTextarea.value = "";
            if (replyCount) {
                replyCount.textContent = "0 / 200";
            }
            replyForm.classList.add("hidden");
        } catch (e2) {
            console.error(e2);
            await showToast("답글 등록 중 오류가 발생했습니다.");
        }
    });
}
