
/// 템플릿 정의
let _template;

/// 템플릿 가져오기
async function ensureTemplate() {
    if (_template) {
        return _template;
    }

    /// HTML 가져오기
    const res = await fetch('/assets/postCard.html');

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

    /// 내부 값 변화시키기
    node.querySelector('.post__title').textContent = post.title ?? '';
    node.querySelector('.likes').textContent = `좋아요 ${post.likes}`;
    node.querySelector('.comments').textContent = `댓글 ${post.comments}`;
    node.querySelector('.views').textContent = `조회수 ${post.views}`;
    node.querySelector('time').textContent = post.date ?? '';
    node.querySelector('.author__name').textContent = post.author ?? '';

    /// 제목 뿐 아니라, 카드 전체를 선택해도 이동 가능하도록 수정
    if (onClick) {
        node.querySelector('.card').style.cursor = 'pointer';
        node.querySelector('.card').addEventListener('click', () => onClick(post));
    }

    return node;
}
