
/// 템플릿 정의
let _template;

/// 템플릿 가져오기
async function ensureTemplate() {
    if (_template) {
        return _template;
    }

    /// HTML 가져오기
    const res = await fetch('/components/postCard.html');

    if (!res.ok) {
        throw new Error('postCard 템플릿 로드 실패');
    }

    const html = await res.text();

    /// HTML DOM 파서
    const doc = new DOMParser().parseFromString(html, 'text/html');
    _template = doc.getElementById('postCard');
    if (!_template) {
        throw new Error("템플릿에 id='postCard' 없음");
    }

    return _template;
}

/// 게시글 목록 만들기
export async function createPostCard(post, { onClick } = {}) {

    // 템플릿 가져오기
    const tpl = await ensureTemplate();
    const node = tpl.content.cloneNode(true);

    // ───────────── 썸네일 처리 ─────────────
    const thumbWrap = node.querySelector('.post__thumbnail');
    if (thumbWrap) {
        if (post.thumbnailUrl) {
            // 썸네일 이미지가 있을 때
            const img = document.createElement('img');
            img.src = post.thumbnailUrl;
            img.alt = (post.title ?? '') + ' 썸네일';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.onerror = () => (thumbWrap.style.display = 'none');
            thumbWrap.appendChild(img);
        } else {
            // 썸네일이 없을 때 기본 회색 박스 표시
            thumbWrap.style.backgroundColor = '#e5e7eb'; // 밝은 회색
            thumbWrap.style.display = 'flex';
            thumbWrap.style.alignItems = 'center';
            thumbWrap.style.justifyContent = 'center';
            thumbWrap.style.borderRadius = '8px';
            thumbWrap.style.width = '168px';
            thumbWrap.style.aspectRatio = '16 / 9';

            // (선택) "No Image" 텍스트 넣기
            const placeholder = document.createElement('span');
            placeholder.textContent = 'No Image';
            placeholder.style.color = '#9ca3af';
            placeholder.style.fontSize = '12px';
            thumbWrap.appendChild(placeholder);
        }
    }


// 아바타(기존 그대로)
    const avatar = node.querySelector('.author__avatar');
    if (avatar && post.author?.imageUrl) {
        const aimg = document.createElement('img');
        aimg.src = post.author.imageUrl;
        aimg.alt = (post.author?.nickname ?? '작성자') + ' 아바타';
        avatar.appendChild(aimg);
    }


    // ───────────── 작성자 아바타 ─────────────
    const authorAvatar = node.querySelector('.author__avatar');
    if (authorAvatar && post.author?.imageUrl) {
        const img = document.createElement('img');
        img.src = post.author.imageUrl;
        img.alt = post.author.nickname + ' 아바타';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
        authorAvatar.appendChild(img);
    }

    // ───────────── 내부 텍스트 채우기 ─────────────
    node.querySelector('.author__name').textContent = post.author?.nickname ?? '익명';
    node.querySelector('.post__title').textContent = post.title ?? '(제목 없음)';
    node.querySelector('.likes').textContent = `좋아요 ${post.likes ?? 0}`;
    node.querySelector('.comments').textContent = `댓글 ${post.comments ?? 0}`;
    node.querySelector('.views').textContent = `조회수 ${post.views ?? 0}`;
    node.querySelector('time').textContent = post.date ?? '';

    // ───────────── 클릭 이벤트 ─────────────
    if (onClick) {
        const card = node.querySelector('.card');
        if (card) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => onClick(post));
        }
    }

    return node;
}