let _template;

async function ensureTemplate() {
    if (_template) return _template;
    const res = await fetch('/assets/postCard.html');
    if (!res.ok) throw new Error('postCard 템플릿 로드 실패');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    _template = doc.getElementById('postCard');
    if (!_template) throw new Error("템플릿에 id='postCard' 없음");
    return _template;
}

export async function createPostCard(post, { onClick } = {}) {
    const tpl = await ensureTemplate();
    const node = tpl.content.cloneNode(true);

    node.querySelector('.post__title').textContent = post.title ?? '';
    node.querySelector('.likes').textContent = `좋아요 ${post.likes ?? 0}`;
    node.querySelector('.comments').textContent = `댓글 ${post.comments ?? 0}`;
    node.querySelector('.views').textContent = `조회수 ${post.views ?? 0}`;
    node.querySelector('time').textContent = post.date ?? '';
    node.querySelector('.author__name').textContent = post.author ?? '';

    if (onClick) {
        node.querySelector('.post__title').style.cursor = 'pointer';
        node.querySelector('.post__title').addEventListener('click', () => onClick(post));
    }

    return node;
}
