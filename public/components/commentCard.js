/// 템플릿 정의
let _template;

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

/// 댓글 목록 만들기
export async function createCommentCard(comment, { onClick, onReply, onEdit, onDelete } = {}) {
    const tpl = await ensureTemplate();
    const node = tpl.content.cloneNode(true);

    const $card = node.querySelector('.card');
    const $avatar = node.querySelector('.author__avatar');
    const $createdAt = node.querySelector('.createdAt');
    const $authorName = node.querySelector('.author__name');
    const $authorUrl = node.querySelector('.author__url'); // 있으면 사용, 없으면 무시
    const $content = node.querySelector('.comment__content');
    const $toolbar = node.querySelector('.toolbar');
    const $replies = node.querySelector('.replies');

    // ----- API 구조: comment.user.nickname / imageUrl / userId -----
    const user = comment.user ?? {};
    if ($authorName) $authorName.textContent = user.nickname ?? '익명';
    if ($avatar && user.imageUrl) {
        $avatar.style.backgroundImage = `url("${user.imageUrl}")`;
        $avatar.style.backgroundSize = 'cover';
        $avatar.style.backgroundPosition = 'center';
    }
    if ($authorUrl) {
        $authorUrl.textContent = '';        // 프로필 URL이 없으니 비워둠
        $authorUrl.removeAttribute('href'); // a 태그라면 링크 제거
    }

    // 내용/시간
    if ($content) $content.textContent = comment.content ?? '';
    if (comment.createdAt) {
        // API에 시간이 없으므로 표시만 비움
        $createdAt.textContent = comment.createdAt;
    }

    // 편집/삭제 권한 표시
    if ($toolbar) {
        if (comment.editable) {
            const editBtn = $toolbar.querySelector('[data-action="edit"]');
            const delBtn  = $toolbar.querySelector('[data-action="delete"]');
            editBtn?.addEventListener('click', (e) => { e.stopPropagation(); onEdit?.(comment); });
            delBtn?.addEventListener('click', (e) => { e.stopPropagation(); onDelete?.(comment); });
        } else {
            $toolbar.style.display = 'none';
        }
    }

    // 카드 클릭
    if (onClick && $card) {
        $card.style.cursor = 'pointer';
        $card.addEventListener('click', () => onClick(comment));
    }

    // 답글 버튼(옵션)
    const replyBtn = node.querySelector('[data-action="reply"]');
    if (replyBtn) {
        if (onReply) {
            replyBtn.addEventListener('click', (e) => { e.stopPropagation(); onReply(comment); });
        } else {
            replyBtn.remove(); // 핸들러 없으면 버튼 제거
        }
    }

    // replies 컨테이너 없으면 만들어서 반환(템플릿 미수정 대비)
    let repliesContainer = $replies;
    if (!repliesContainer) {
        repliesContainer = document.createElement('div');
        repliesContainer.className = 'replies';
        node.querySelector('article.card')?.appendChild(repliesContainer);
    }

    return { node, repliesContainer };
}

/**
 * threads: API의 data.content (배열)
 * container: 렌더 대상 DOM
 */
export async function renderCommentThreads(threads, container, handlers = {}) {
    container.innerHTML = '';
    const frag = document.createDocumentFragment();

    for (const thread of threads) {
        const { root, children = [] } = thread;

        // 1) 루트 댓글 카드
        const rootRendered = await createCommentCard(root, handlers);
        const { node: rootNode, repliesContainer } = rootRendered;

        // 2) 대댓글(1 depth) 렌더
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
