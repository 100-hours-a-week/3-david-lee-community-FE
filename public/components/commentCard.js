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
        throw new Error("템플릿에 id='postCard' 없음");
    }

    return _template;
}

/// 댓글 목록 만들기
export async function createCommentCard(comment, {onClick} = {}) {

    /// 템플릿 가져오기
    const tpl = await ensureTemplate();
    const node = tpl.content.cloneNode(true);

    /// 내부 값 변화시키기
    node.querySelector('.author__url').textContent = comment.author.imageUrl ?? '';
    node.querySelector('.author__name').textContent = comment.author;
    node.querySelector('.comment__content').textContent = comment.content;
    node.querySelector('time').textContent = comment.date;

    /// 제목 뿐 아니라, 카드 전체를 선택해도 이동 가능하도록 수정
    if (onClick) {
        node.querySelector('.card').style.cursor = 'pointer';
        node.querySelector('.card').addEventListener('click', () => onClick(post));
    }

    return node;
}
