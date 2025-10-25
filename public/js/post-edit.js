import { getPostDetail, updatePost } from '../api/post.js';

function pick(...ids) {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el) return el;
    }
    return null;
}

function required(el, name) {
    if (!el) throw new Error(`${name} 요소를 찾을 수 없습니다. id 확인 필요`);
    return el;
}

let postId, titleInput, contentInput, titleCount, contentCount;

function updateCounts() {
    titleCount.textContent   = `${titleInput.value.length} / ${titleInput.maxLength || 0}`;
    contentCount.textContent = `${contentInput.value.length} / ${contentInput.maxLength || 0}`;
}

async function preload() {
    if (!postId) {
        alert('잘못된 접근입니다. (id 누락)');
        location.href = '/pages/html/post-list.html';
        return;
    }

    const d = await getPostDetail(postId);
    // 서버 값 → 입력창 반영
    titleInput.value   = d.title   ?? '';
    contentInput.value = d.content ?? '';
    updateCounts();
}

function wireEvents() {
    titleInput.addEventListener('input', updateCounts);
    contentInput.addEventListener('input', updateCounts);

    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const categoryId = "2";
        const title   = titleInput.value.trim();
        const content = contentInput.value.trim();
        const imageKeys = [];

        if (!title)   return alert('제목을 입력하세요.');
        if (!content) return alert('내용을 입력하세요.');

        const payload = { categoryId, title, content, imageKeys };

        try {
            await updatePost(postId, payload);
            alert('글 수정이 완료되었습니다.');
            location.href = `/pages/html/post-detail.html?id=${postId}`;
        } catch (err) {
            console.error(err);
            alert(err?.message || '글 수정 중 오류가 발생했습니다.');
        }
    });
}

function init() {
    const params = new URLSearchParams(location.search);
    postId = params.get('id');

    // 실제 존재하는 id 우선으로 선택 (title → e-title), (content → e-content)
    titleInput   = required(pick('title', 'e-title'), '제목 입력');
    contentInput = required(pick('content', 'e-content'), '내용 입력');

    titleCount   = required(document.getElementById('titleCount'), '제목 글자수');
    contentCount = required(document.getElementById('contentCount'), '내용 글자수');

    preload().catch(err => {
        console.error(err);
        alert(err?.message || '기존 내용을 불러오지 못했습니다.');
    });
    wireEvents();
}

document.addEventListener('DOMContentLoaded', init);
