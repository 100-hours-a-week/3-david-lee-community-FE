let _tpl;

/// 템플릿 로드
async function ensureTemplate() {
    if (_tpl) return _tpl;
    const res = await fetch('/assets/postView.html');
    if (!res.ok) throw new Error('postView 템플릿 로드 실패');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    _tpl = doc.getElementById('postView');
    if (!_tpl) throw new Error("템플릿에 id='postView' 없음");
    return _tpl;
}

/// 상세 컴포넌트 생성
export async function createPostView(post, opts = {}) {
    const { onEdit, onDelete, onSubmitComment } = opts;

    /// 템플릿 가져오기
    const tpl = await ensureTemplate();
    const node = tpl.content.cloneNode(true);

    // 헤더/메타
    node.querySelector('.title').textContent = post.title;
    node.querySelector('.author__name').textContent = post.author;
    node.querySelector('.createdAt').textContent = post.createdAt;

    // 본문
    node.querySelector('.content').textContent = post.content ?? '';

    // 미디어(옵션)
    const media = node.querySelector('.media');
    if (Array.isArray(post.images) && post.images.length) {
        media.innerHTML = '';
        const img = document.createElement('img');
        img.src = post.images[0];
        img.alt = post.title ?? 'post image';
        img.style.maxWidth = '100%';
        img.style.borderRadius = '12px';
        media.appendChild(img);
    }

    // 통계
    node.querySelector('.likeCount').textContent = post.likeCount ?? 0;
    node.querySelector('.viewCount').textContent = post.viewCount ?? 0;
    node.querySelector('.commentCount').textContent = post.commentCount ?? 0;

    // 액션: onEdit, onDelete 핸들러가 있을 때만 버튼을 보여주고 이벤트를 연결합니다.
    const toolbar = node.querySelector('.toolbar');
    const editBtn = node.querySelector('[data-action="edit"]');
    const deleteBtn = node.querySelector('[data-action="delete"]');

    if (onEdit) {
        editBtn.addEventListener('click', () => onEdit(post));
    } else {
        editBtn.remove(); // onEdit 핸들러가 없으면 버튼 제거
    }

    if (onDelete) {
        deleteBtn.addEventListener('click', () => onDelete(post));
    } else {
        deleteBtn.remove(); // onDelete 핸들러가 없으면 버튼 제거
    }

    // 수정/삭제 버튼이 모두 없으면 toolbar 영역 전체를 제거
    if (!onEdit && !onDelete) {
        toolbar.remove();
    }

    // 댓글
    node.querySelector('[data-action="comment"]').addEventListener('click', async () => {
        const textarea = node.querySelector('#comment');
        const text = textarea.value.trim();
        if (!text) return alert('댓글을 입력하세요.');
        try {
            await onSubmitComment?.(post, text);
            textarea.value = '';
        } catch (e) {
            alert(e.message || '댓글 등록 실패');
        }
    });

    // 기존 댓글(있다면)
    const commentsWrap = node.querySelector('.comments');
    if (Array.isArray(post.comments)) {
        for (const c of post.comments) {
            const item = document.createElement('div');
            item.className = 'comment';
            item.innerHTML = `
        <div class="comment__top">
          <div class="comment__meta">
            <div class="author__avatar" style="width:28px;height:28px"></div>
            <span>${c.author ?? '익명'}</span>
            <time>${(c.createdAt || '').replace('T',' ').slice(0,19)}</time>
          </div>
        </div>
        <div class="comment__body">${c.content ?? ''}</div>
      `;
            commentsWrap.appendChild(item);
        }
    }

    return node;
}
