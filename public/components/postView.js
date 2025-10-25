/// 템플릿 변수 선언
let _tpl;

/// 템플릿 로드
async function ensureTemplate() {
    if (_tpl) return _tpl;

    const res = await fetch('/components/postView.html');
    if (!res.ok) throw new Error('postView 템플릿 로드 실패');

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    _tpl = doc.getElementById('postView');
    if (!_tpl) throw new Error("템플릿에 id='postView' 없음");
    return _tpl;
}

/// 이미지 갤러리 생성기: 메인 + 썸네일 + 좌/우 버튼
function createImageGallery(imageUrls = [], title = 'post image') {
    const frag = document.createDocumentFragment();
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) return frag;

    // 래퍼
    const wrap = document.createElement('section');
    wrap.className = 'post__gallery';

    // 메인 영역
    let current = 0;
    const main = document.createElement('div');
    main.className = 'gallery__main';

    const mainImg = document.createElement('img');
    mainImg.alt = title || 'post image';
    mainImg.referrerPolicy = 'no-referrer';
    mainImg.decoding = 'async';
    mainImg.loading = 'lazy';
    mainImg.src = imageUrls[current];
    main.appendChild(mainImg);

    // 좌/우 버튼
    const prevBtn = document.createElement('button');
    prevBtn.className = 'gallery__nav gallery__nav--prev';
    prevBtn.type = 'button';
    prevBtn.textContent = '‹';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'gallery__nav gallery__nav--next';
    nextBtn.type = 'button';
    nextBtn.textContent = '›';

    function setCurrent(idx) {
        current = (idx + imageUrls.length) % imageUrls.length;
        mainImg.src = imageUrls[current];
        highlightThumb(current);
    }

    prevBtn.addEventListener('click', () => setCurrent(current - 1));
    nextBtn.addEventListener('click', () => setCurrent(current + 1));
    main.append(prevBtn, nextBtn);

    // 썸네일 리스트
    const thumbs = document.createElement('div');
    thumbs.className = 'gallery__thumbs';

    const thumbEls = imageUrls.map((url, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'thumb';
        btn.innerHTML = `<img src="${url}" alt="썸네일 ${idx + 1}" loading="lazy" referrerpolicy="no-referrer">`;
        btn.addEventListener('click', () => setCurrent(idx));
        return btn;
    });

    function highlightThumb(i) {
        thumbEls.forEach((el, k) => el.classList.toggle('is-active', k === i));
    }

    thumbEls.forEach(el => thumbs.appendChild(el));
    highlightThumb(current);

    wrap.append(main, thumbs);
    frag.appendChild(wrap);
    return frag;
}

/// 상세 게시글 만들기
/// 상세 게시글 만들기
export async function createPostView(post, opts = {}) {
    const { onToggleLike, onEdit, onDelete, onSubmitComment } = opts;

    // 템플릿 가져오기
    const tpl = await ensureTemplate();
    const node = tpl.content.cloneNode(true);

    // 작성자/시간
    const authorUrlEl = node.querySelector('.author__url');
    const authorNameEl = node.querySelector('.author__name');
    const createdAtEl  = node.querySelector('.createdAt');

    if (authorUrlEl && post.author?.imageUrl) {
        const img = document.createElement('img');
        img.src = post.author.imageUrl;
        img.alt = post.author.nickname ?? '작성자 프로필';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        authorUrlEl.textContent = '';
        authorUrlEl.appendChild(img);
    }
    if (authorNameEl) authorNameEl.textContent = post.author?.nickname ?? '익명';
    if (createdAtEl)  createdAtEl.textContent  = post.createdAt ?? '';

    // 아바타(옵션)
    const avatarImg = node.querySelector('.author__avatar img');
    if (avatarImg) {
        if (post.author?.imageUrl) {
            avatarImg.src = post.author.imageUrl;
            avatarImg.alt = post.author.nickname ?? '작성자';
            avatarImg.referrerPolicy = 'no-referrer';
            avatarImg.loading = 'lazy';
            avatarImg.decoding = 'async';
        } else {
            avatarImg.remove();
        }
    }

    // 본문
    const titleEl   = node.querySelector('.title');
    const contentEl = node.querySelector('.content');
    if (titleEl)   titleEl.textContent   = post.title ?? '';
    if (contentEl) contentEl.textContent = post.content ?? '';

    // 통계
    const likeBtnEl      = node.querySelector('[data-action="toggle-like"]');
    const likeCountEl    = node.querySelector('.likeCount');
    const viewCountEl    = node.querySelector('.viewCount');
    const commentCountEl = node.querySelector('.commentCount');

    if (viewCountEl)    viewCountEl.textContent    = String(post.viewCount ?? 0);
    if (commentCountEl) commentCountEl.textContent = String(post.commentCount ?? 0);

    // 미디어
    const media = node.querySelector('.media');
    if (media) {
        media.innerHTML = '';
        if (Array.isArray(post.images) && post.images.length > 0) {
            media.appendChild(createImageGallery(post.images, post.title ?? 'post image'));
        }
    }

    // 내부 상태
    let liked = !!post.liked;
    let likeCount = Number(post.likeCount ?? 0);
    let busy = false; // 중복 클릭 방지

    // 수정/삭제
    const editBtn   = node.querySelector('[data-action="edit"]');
    const deleteBtn = node.querySelector('[data-action="delete"]');
    if (onEdit && editBtn)   editBtn.addEventListener('click', () => onEdit(post));
    else if (editBtn)        editBtn.remove();

    if (onDelete && deleteBtn) deleteBtn.addEventListener('click', () => onDelete(post));
    else if (deleteBtn)        deleteBtn.remove();

    // 좋아요 UI 렌더
    function renderLikeUI() {
        if (likeCountEl) likeCountEl.textContent = String(likeCount);
        if (likeBtnEl) {
            likeBtnEl.setAttribute('aria-pressed', liked ? 'true' : 'false');
            likeBtnEl.classList.toggle('liked', liked);
            likeBtnEl.disabled = !!busy;
        }
    }
    renderLikeUI();

    // 좋아요 토글 핸들러 (낙관적 갱신 → 실패 시 롤백)
    async function handleToggleLike() {
        if (!likeBtnEl || busy) return;

        const prevLiked = liked;
        const prevCount = likeCount;

        // UI 먼저 토글
        liked = !liked;
        likeCount = liked ? prevCount + 1 : Math.max(0, prevCount - 1);
        busy = true;
        renderLikeUI();

        try {
            // 현재 상태(prevLiked 기준으로 서버 호출)
            // prevLiked=false 였으면 like 요청, true 였으면 unlike 요청
            await onToggleLike?.(prevLiked);
            busy = false;
            renderLikeUI();
        } catch (e) {
            // 실패하면 되돌림
            liked = prevLiked;
            likeCount = prevCount;
            busy = false;
            renderLikeUI();
            alert('좋아요 처리 중 오류가 발생했습니다: ' + (e?.message || ''));
        }
    }

    if (likeBtnEl) {
        likeBtnEl.addEventListener('click', handleToggleLike);
        likeBtnEl.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter' || evt.key === ' ') {
                evt.preventDefault();
                handleToggleLike();
            }
        });
    }

    // 댓글 목록 (있다면 렌더)
    const commentsWrap = node.querySelector('.comments');
    if (commentsWrap && Array.isArray(post.comments)) {
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

    // 댓글 작성 (버그 수정: text -> textarea.value.trim())
    const commentBtn = node.querySelector('[data-action="comment"]');
    if (commentBtn) {
        commentBtn.addEventListener('click', async () => {
            const textarea = node.querySelector('#comment');
            const text = textarea?.value?.trim() ?? '';
            if (!text) {
                alert('댓글 내용을 입력해주세요!');
                return;
            }
            try {
                await onSubmitComment?.(post, text);
                if (textarea) textarea.value = '';
            } catch (e) {
                alert(e.message || '댓글 등록 실패');
            }
        });
    }

    return node;
}
