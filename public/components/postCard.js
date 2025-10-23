
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

    /// 템플릿 가져오기
    const tpl = await ensureTemplate();
    const node = tpl.content.cloneNode(true);

    // 이미지 태그 생성 및 삽입
    const authorAvatar = node.querySelector('.author__avatar');
    if (authorAvatar) {
        // img 태그 생성
        const img = document.createElement('img');
        img.src = post.author.imageUrl;
        img.alt = post.author.nickname + ' 아바타';

        // CSS에서 .author__avatar에 크기가 정의되어 있으므로, <img>는 100% 채우도록 스타일링 필요
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%'; // 둥근 모양 유지

        authorAvatar.appendChild(img);
    }

    /// 내부 값 변화시키기
    node.querySelector('.author__name').textContent = post.author.nickname;
    node.querySelector('.post__title').textContent = post.title;
    node.querySelector('.likes').textContent = `좋아요 ${post.likes}`;
    node.querySelector('.comments').textContent = `댓글 ${post.comments}`;
    node.querySelector('.views').textContent = `조회수 ${post.views}`;
    node.querySelector('time').textContent = post.date;

    /// 제목 뿐 아니라, 카드 전체를 선택해도 이동 가능하도록 수정
    if (onClick) {
        node.querySelector('.card').style.cursor = 'pointer';
        node.querySelector('.card').addEventListener('click', () => onClick(post));
    }

    return node;
}
