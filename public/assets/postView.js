/// 템플릿 변수 선언
let _tpl;

/// 템플릿 로드
async function ensureTemplate() {

    if (_tpl) {
        return _tpl;
    }

    /// HTML 가져오기
    const res = await fetch('/assets/postView.html');
    if (!res.ok) {
        throw new Error('postView 템플릿 로드 실패');
    }

    /// HTML DOM 파서
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    _tpl = doc.getElementById('postView');

    if (!_tpl) {
        throw new Error("템플릿에 id='postView' 없음");
    }

    return _tpl;
}

/// 상세 게시글 만들기
export async function createPostView(post, opts = {}) {

    /// 수정, 삭제 여부
    const {onLike, onEdit, onDelete, onSubmitComment} = opts;

    /// 템플릿 가져오기
    const tpl = await ensureTemplate();
    const node = tpl.content.cloneNode(true);

    /// 유저 및 시간
    node.querySelector('.author__url').textContent = post.author.imageUrl ?? '';
    node.querySelector('.author__name').textContent = post.author;
    node.querySelector('.createdAt').textContent = post.createdAt;

    /// 본문
    node.querySelector('.title').textContent = post.title;
    node.querySelector('.content').textContent = post.content ?? '';

    /// 통계
    node.querySelector('.likeCount').textContent = post.likeCount;
    node.querySelector('.viewCount').textContent = post.viewCount;
    node.querySelector('.commentCount').textContent = post.commentCount;

    /// 미디어(옵션)
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

    /// 수정 , 삭제 여부
    const editBtn = node.querySelector('[data-action="edit"]');
    const deleteBtn = node.querySelector('[data-action="delete"]');
    const likeBtn = node.querySelector('[data-action="like"]');

    /// 수정 여부
    if (onEdit) {
        editBtn.addEventListener('click', () => onEdit(post));
    } else {
        editBtn.remove();
    }

    /// 삭제 여부
    if (onDelete) {
        deleteBtn.addEventListener('click', () => onDelete(post));
    } else {
        deleteBtn.remove();
    }

    /// 좋아요 버튼은 항상 표시되도록 유지
    likeBtn.addEventListener('click', () => onLike?.(post));

    /// 댓글 목록
    const commentsWrap = node.querySelector('.comments');
    if (Array.isArray(post.comments)) {
        /// 목록 이기에
        for (const c of post.comments) {
            const item = document.createElement('div');
            item.className = 'comment';
            item.innerHTML = `
        <div class="comment__top">
          <div class="comment__meta">
            <div class="author__avatar" style="width:28px;height:28px"></div>
            <span>${c.author ?? '익명'}</span>
            <time>${(c.createdAt || '').replace('T', ' ').slice(0, 19)}</time>
          </div>
        </div>
        <div class="comment__body">${c.content ?? ''}</div>
      `;
            commentsWrap.appendChild(item);
        }
    }

    // 댓글 작성
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


    /// 응답
    return node;
}
