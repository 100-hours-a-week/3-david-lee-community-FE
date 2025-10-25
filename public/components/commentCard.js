/// 템플릿 정의
let _template;

// =================
//  외부 사용 로직
// =================

/// 댓글 목록 만들기
export async function createCommentCard(comment, {onReply, onEdit, onDelete} = {}) {

    /// 템플릿 가져와서 복제하기
    const tpl = await ensureTemplate();
    const node = tpl.content.cloneNode(true);

    /// HTML 요소를 선택
    const $avatar = node.querySelector('.author__avatar');
    const $createdAt = node.querySelector('.createdAt');
    const $authorName = node.querySelector('.author__name');
    const $authorUrl = node.querySelector('.author__url');
    const $content = node.querySelector('.comment__content');
    const $toolbar = node.querySelector('.toolbar');
    const $replies = node.querySelector('.replies');

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

    // 편집/삭제/답글 버튼 표시
    const editBtn = $toolbar.querySelector('[data-action="edit"]');
    const delBtn = $toolbar.querySelector('[data-action="delete"]');
    const replyBtn = node.querySelector('[data-action="reply"]');

    if (comment.editable) {
        /// 수정 버튼 클릭
        editBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            onEdit?.(comment);
        });
        ///삭제 버튼 클릭
        delBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            onDelete?.(comment);
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
            onReply?.(comment);
        });
    } else {
        replyBtn?.remove();
    }

    // replies 컨테이너 없으면 만들어서 반환(템플릿 미수정 대비)
    let repliesContainer = $replies;
    if (!repliesContainer) {
        repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies';
        node.querySelector('article.card')?.appendChild(repliesContainer);
    }

    return {node, repliesContainer};
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

// =================
//  내부 사용 로직
// =================

/// 템플릿 가져오기
async function ensureTemplate() {
    if (_template) {
        return _template;
    }

    /// HTML 가져오기
    const res = await fetch('/components/commentCard.html');

    if (!res.ok) {
        throw new Error('commentCard 템플릿 로드 실패');
    }

    const html = await res.text();

    /// HTML DOM 파서
    const doc = new DOMParser().parseFromString(html, 'text/html');
    _template = doc.getElementById('commentCard');
    if (!_template) {
        throw new Error("템플릿에 id='commentCard' 없음");
    }

    return _template;
}