// 더미 데이터
const posts = [
    { title: "오늘의 아무 말", likes: 2, comments: 3, views: 25, date: "2025-01-01 00:00:00", author: "이도연" },
    { title: "테스트 게시글",   likes: 5, comments: 1, views: 18, date: "2025-01-02 12:10:00", author: "홍길동" },
    { title: "아무말 대잔치 시작!", likes: 1, comments: 0, views: 10, date: "2025-01-03 09:00:00", author: "익명" }
];

async function loadTemplate() {
    const res = await fetch('/assets/postCard.html'); // 절대경로로 고정
    if (!res.ok) throw new Error(`템플릿 로드 실패: ${res.status}`);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const tpl = doc.getElementById('postCard');
    if (!tpl) throw new Error("템플릿에 id='postCard'가 없습니다.");
    return tpl;
}

function renderList(template, data) {
    const list = document.getElementById('postList');
    if (!list) throw new Error('#postList를 찾을 수 없습니다.');
    list.innerHTML = '';

    data.forEach((p) => {
        const node = template.content.cloneNode(true);
        node.querySelector('.post__title').textContent = p.title;
        node.querySelector('.likes').textContent = `좋아요 ${p.likes}`;
        node.querySelector('.comments').textContent = `댓글 ${p.comments}`;
        node.querySelector('.views').textContent = `조회수 ${p.views}`;
        node.querySelector('time').textContent = p.date;
        node.querySelector('.author__name').textContent = p.author;
        list.appendChild(node);
    });
}

(async function init() {
    try {
        const template = await loadTemplate();
        renderList(template, posts);
    } catch (err) {
        console.error(err);
        const list = document.getElementById('postList');
        if (list) list.innerHTML = `<p class="error">${err.message}</p>`;
    }
})();
