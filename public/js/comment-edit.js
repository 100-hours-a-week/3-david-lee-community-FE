
// ===== 핸들러들 =====
import {deleteComment, saveComments, updateComment} from "../api/comment.js";
import {showToast} from "../pages/common/toast.js";

export async function handleEdit(comment, ctx) {
    const { node, contentEl, editForm, editTextarea, editCancelBtn } = ctx || {};
    if (!node || !contentEl || !editForm || !editTextarea) return;

    // ✅ 삭제 상태면 수정 불가
    const deletedText = "삭제된 메시지입니다.";
    const isDeleted =
        node.classList.contains('is-deleted') ||
        (contentEl.textContent && contentEl.textContent.trim() === deletedText) ||
        comment.deleted === true || comment.isDeleted === true; // 서버 플래그가 있다면

    if (isDeleted) {
        // 버튼도 비활성화/제거 (방어적)
        node.querySelector('.toolbar [data-action="edit"]')?.setAttribute('disabled', 'true');
        await showToast('삭제된 댓글은 수정할 수 없습니다.');
        return;
    }

    // 이미 편집 중이면 포커스만
    if (!editForm.classList.contains('hidden')) {
        editTextarea.focus();
        return;
    }

    // 본문 숨기고 폼 보이기 + 값 세팅
    const original = contentEl.textContent ?? '';
    contentEl.style.display = 'none';
    editTextarea.value = original;
    editForm.classList.remove('hidden');
    editTextarea.focus();

    // 중복 바인딩 방지
    if (editForm.dataset.bound === '1') return;
    editForm.dataset.bound = '1';

    // 취소
    editCancelBtn?.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        editForm.classList.add('hidden');
        contentEl.style.display = '';
    });

    // 저장
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault(); e.stopPropagation();
        const next = editTextarea.value.trim();
        if (!next) { alert('내용을 입력해주세요.'); return; }

        try {
            await updateComment(comment.id, {content: next});
            node.classList.remove('is-deleted');
            contentEl.textContent = next;
            await showToast('댓글이 수정되었습니다.');
            editForm.classList.add('hidden');
            contentEl.style.display = '';
        } catch (err) {
            console.error(err);
            alert(err?.message || '수정 중 오류가 발생했습니다.');
        }
    });
}

export async function handleDelete(comment, ctx) {
    const { node, contentEl, repliesContainer } = ctx || {};
    if (!node) return;

    if (!confirm("정말 삭제하시겠습니까?")) {
        return;
    }

    try {
        await deleteComment(comment.id);

        // "대댓글 존재여부" 판단
        const hasReplies =
                (repliesContainer?.children?.length ?? 0) > 0;

        if (!hasReplies) {
            // 하드 삭제 UI: 카드 통째로 제거
            node.remove();
        } else {
            // 소프트 삭제 UI: 내용 치환 + 툴바 비활성
            const deletedText = "삭제된 메시지입니다.";

            if (contentEl) {
                contentEl.textContent = deletedText;
            } else {
                // 혹시 contentEl 못 찾은 경우 fallback
                const $content = node.querySelector(".comment__content");
                if ($content) $content.textContent = deletedText;
            }

            // 편집/삭제 버튼 숨기기
            const toolbar = node.querySelector(".toolbar");
            toolbar?.querySelector('[data-action="edit"]')?.remove();
            toolbar?.querySelector('[data-action="delete"]')?.remove();

        }

        await showToast("댓글이 삭제되었습니다.");
    } catch (e) {
        console.error(e);
        alert(e?.message || "삭제 중 오류가 발생했습니다.");
    }
}

export async function handleReply(comment, ctx, postId) {
    const { replyForm, replyTextarea, replyCancelBtn, repliesContainer } = ctx || {};
    if (!replyForm || !replyTextarea || !repliesContainer) return;

    // 보여주고 포커스
    replyForm.classList.remove('hidden');
    replyTextarea.focus();

    // 중복 바인딩 방지: 폼에 플래그
    if (replyForm.dataset.bound === '1') return;
    replyForm.dataset.bound = '1';

    // 취소 (once)
    replyCancelBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        replyTextarea.value = '';
        replyForm.classList.add('hidden');
    });

    // 제출 (once 아님: 여러 번 사용할 수 있게. 대신 내부에서 처리 후 숨김)
    replyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = replyTextarea.value.trim();
        if (!content) return alert('내용을 입력해주세요.');

        try {
            const res = await saveComments({ parentId: comment.id, postId, content });
            const newReply = res.data;

            const { createCommentCard } = await import('../components/commentCard.js');
            const { node: replyNode } = await createCommentCard(newReply, {
                onCommentReply:  (c2, ctx2) => handleReply(c2, ctx2, postId),
                onCommentEdit:   handleEdit,
                onCommentDelete: handleDelete,
            });

            repliesContainer.appendChild(replyNode);
            await showToast('답글이 등록되었습니다.');

            // reset & hide
            replyTextarea.value = '';
            replyForm.classList.add('hidden');
        } catch (e2) {
            console.error(e2);
            alert('답글 등록 중 오류가 발생했습니다.');
        }
    });
}