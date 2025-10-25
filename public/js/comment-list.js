// =================
//  API
// =================
import { getComments } from "../api/comment.js";
import { updateComment, deleteComment, saveComments } from "../api/comment.js";

// =================
//  컴포넌트
// =================
import { renderCommentThreads, createCommentCard } from "../components/commentCard.js";
import { showToast } from "../pages/common/toast.js";

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

        // --- 댓글 렌더링 + 핸들러 연결 ---
        await renderCommentThreads(threads, commentList, {
            onCommentReply:  (c, ctx) => handleReply(c, ctx, postId),
            onCommentEdit:   (c, ctx) => handleEdit(c, ctx),
            onCommentDelete: (c, ctx) => handleDelete(c, ctx),
        });

    } catch (err) {
        console.error(err);
        await showToast(err);
        commentList.innerHTML = `<p style="color:#c00">댓글을 불러오는 중 오류가 발생했습니다.</p>`;
    }
}

// =================
//  내부 핸들러 구현
// =================

async function handleEdit(comment, ctx) {
    const { node, contentEl } = ctx;
    if (!node || !contentEl) return;

    if (node.dataset.editing === '1') return; // 중복 방지
    node.dataset.editing = '1';

    const original = contentEl.textContent ?? '';
    const textarea = document.createElement('textarea');
    textarea.value = original;
    textarea.className = 'comment__edit';
    textarea.rows = 3;

    const actions = document.createElement('div');
    actions.className = 'comment__edit-actions';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '저장';
    saveBtn.className = 'btn btn--primary btn--small';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '취소';
    cancelBtn.className = 'btn btn--ghost btn--small';

    actions.append(saveBtn, cancelBtn);

    contentEl.style.display = 'none';
    contentEl.insertAdjacentElement('afterend', textarea);
    textarea.insertAdjacentElement('afterend', actions);
    textarea.focus();

    const cleanup = () => {
        textarea.remove();
        actions.remove();
        contentEl.style.display = '';
        delete node.dataset.editing;
    };

    // 저장
    saveBtn.addEventListener('click', async () => {
        const next = textarea.value.trim();
        if (!next) return alert('내용을 입력해주세요.');

        try {
            await updateComment(comment.id, { content: next });
            contentEl.textContent = next;
            await showToast('댓글이 수정되었습니다.');
        } catch (e) {
            console.error(e);
            alert('수정 중 오류가 발생했습니다.');
        } finally {
            cleanup();
        }
    });

    cancelBtn.addEventListener('click', cleanup);
}

async function handleDelete(comment, ctx) {
    const { node } = ctx;
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
        await deleteComment(comment.id);
        node.remove();
        await showToast('댓글이 삭제되었습니다.');
    } catch (e) {
        console.error(e);
        alert('삭제 중 오류가 발생했습니다.');
    }
}

async function handleReply(comment, ctx, postId) {
    const { repliesContainer } = ctx;
    if (!repliesContainer) return;

    // 이미 폼이 있으면 포커스
    let form = repliesContainer.querySelector('.reply-form');
    if (!form) {
        form = document.createElement('form');
        form.className = 'reply-form';

        const textarea = document.createElement('textarea');
        textarea.rows = 2;
        textarea.placeholder = '답글을 입력하세요…';

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn--small btn--primary';
        submitBtn.textContent = '등록';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn--small btn--ghost';
        cancelBtn.textContent = '취소';

        form.append(textarea, submitBtn, cancelBtn);
        repliesContainer.prepend(form);

        cancelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            form.remove();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = textarea.value.trim();
            if (!content) return alert('내용을 입력해주세요.');

            try {
                const res = await saveComments({
                    parentId: comment.id,
                    postId,
                    content
                });

                const newReply = res.data;
                const { createCommentCard } = await import('../components/commentCard.js');
                const { node: replyNode } = await createCommentCard(newReply, {
                    onCommentReply:  handleReply,
                    onCommentEdit:   handleEdit,
                    onCommentDelete: handleDelete,
                });

                repliesContainer.appendChild(replyNode);
                await showToast('답글이 등록되었습니다.');
                form.remove();
            } catch (e) {
                console.error(e);
                alert('답글 등록 중 오류가 발생했습니다.');
            }
        });
    }

    form.querySelector('textarea')?.focus();
}
