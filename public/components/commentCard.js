/// 템플릿 로더
import {loadTemplate} from "../utils/templateLoader.js";

// =================
//  외부 사용 로직
// =================

/// 댓글 목록 만들기
export async function createCommentCard(comment, {onCommentReply, onCommentEdit, onCommentDelete} = {}) {

    /// 템플릿 가져와서 복제하기
    const tpl = await loadTemplate('/components/commentCard.html', 'commentCard');
    const node = tpl.content.cloneNode(true);
    const rootEl = node.firstElementChild;

    /// HTML 요소를 선택
    const $avatar = node.querySelector('.author__avatar');
    const $createdAt = node.querySelector('.createdAt');
    const $authorName = node.querySelector('.author__name');
    const $authorUrl = node.querySelector('.author__url');
    const $content = node.querySelector('.comment__content');
    const $toolbar = node.querySelector('.toolbar');
    const $replies = node.querySelector('.replies');

    // 내장 답글 폼
    const $replyForm      = rootEl.querySelector('.reply-form');
    const $replyTextarea  = $replyForm?.querySelector('textarea');
    const $replyCancelBtn = $replyForm?.querySelector('[data-action="reply-cancel"]');
    const $replyCount     = $replyForm?.querySelector('.reply-count');

    // 내장 수정 폼
    const $editForm      = rootEl.querySelector('.edit-form');
    const $editTextarea  = $editForm?.querySelector('.edit-textarea');
    const $editCancelBtn = $editForm?.querySelector('[data-action="edit-cancel"]');
    const $editCount     = $editForm?.querySelector('.edit-count');

    /// comment 들어온 값을 사용하게끔 수정
    const user = comment.user ?? {};

    $authorName.textContent = user.nickname ?? '익명';
    $avatar.style.backgroundImage = `url("${user.imageUrl}")`;
    $avatar.style.backgroundSize = 'cover';
    $avatar.style.backgroundPosition = 'center';
    $authorUrl.textContent = '';
    $authorUrl.removeAttribute('href');
    $content.textContent = comment.content ?? '';
    $createdAt.textContent = comment.createdAt ?? '';

    /// 컨택스트 구성
    const ctx = {
        node: rootEl,
        repliesContainer: $replies,
        contentEl: $content,
        replyForm: $replyForm,
        replyTextarea: $replyTextarea,
        replyCancelBtn: $replyCancelBtn,
        replyCount: $replyCount,
        editForm: $editForm,
        editTextarea: $editTextarea,
        editCancelBtn: $editCancelBtn,
        editCount: $editCount,
    };

    // 편집/삭제/답글 버튼 표시
    const editBtn = $toolbar.querySelector('[data-action="edit"]');
    const delBtn = $toolbar.querySelector('[data-action="delete"]');
    const replyBtn = node.querySelector('[data-action="reply"]');

    /// 게시글 작성자와 동일하다면, 색깔을 파랗게 처리
    if (comment.writer === true) {
        $authorName.insertAdjacentHTML('beforeend', ' <span class="writer-badge">작성자</span>');
    }

    if (comment.editable) {
        /// 수정 버튼 클릭
        editBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            onCommentEdit?.(comment, ctx, e);
        });
        ///삭제 버튼 클릭
        delBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            onCommentDelete?.(comment, ctx, e);
        });
    } else {
        /// 권한이 없으면 삭제
        editBtn?.remove();
        delBtn?.remove();
    }

    // 답글 버튼은 루트에서 항상 보이게
    if (comment.parentId == null) {
        replyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onCommentReply?.(comment, ctx, e);
        });
    } else {
        replyBtn?.remove();
    }

    /// 삭제 시, 수정/삭제 툴바는 안보이게
    if (comment.deleted) {
        rootEl.classList.add('is-deleted');

        // 편집/삭제 버튼 제거
        $toolbar?.querySelector('[data-action="edit"]')?.remove();
        $toolbar?.querySelector('[data-action="delete"]')?.remove();
    }

    // replies 컨테이너 없으면 만들어서 반환(템플릿 미수정 대비)
    let repliesContainer = $replies;
    if (!repliesContainer) {
        repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies';
        node.querySelector('article.card')?.appendChild(repliesContainer);
    }

    return { node: rootEl, repliesContainer: ctx.repliesContainer, contentEl: $content };
}

/// 렌더링
export async function renderCommentThreads(threads, container, handlers = {}) {
    container.innerHTML = '';
    const frag = document.createDocumentFragment();

    for (const thread of threads) {
        const { root, children = [] } = thread;

        // 루트 댓글 카드
        const rootRendered = await createCommentCard(root, handlers);
        const { node: rootNode, repliesContainer } = rootRendered;

        // 대댓글 렌더
        if (children.length > 0) {
            const childFrag = document.createDocumentFragment();
            for (const child of children) {
                const childRendered = await createCommentCard(child, handlers);
                childFrag.appendChild(childRendered.node);
            }
            repliesContainer.appendChild(childFrag);
        }

        frag.appendChild(rootNode);
    }

    container.appendChild(frag);
}