import {getPostDetail, updatePost} from '../api/post.js';
import {getUrls, confirmUrls} from '../api/image.js';
import {showToast} from "../pages/common/toast.js";

// 가장 먼저 존재하는 요소 하나”를 찾아 반환
function pick(...ids) {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el) return el;
    }
    return null;
}

/// HTMLDOM 수정할 수 있게끔
function required(el, name) {
    if (!el) throw new Error(`${name} 요소를 찾을 수 없습니다. id 확인 필요`);
    return el;
}

// ───────────── 변수 ─────────────
let postId, titleInput, contentInput, titleCount, contentCount, fileInput, imageListEl;
let keptExisting = [];
let removedKeys  = [];
let addedImages  = [];

// ───────────── 제목, 내용 최대값 제한 ─────────────
function updateCounts() {
    titleCount.textContent   = `${titleInput.value.length} / ${titleInput.maxLength || 0}`;
    contentCount.textContent = `${contentInput.value.length} / ${contentInput.maxLength || 0}`;
}


// ───────────── 이미지 로딩 로직 ─────────────
function renderImages() {
    imageListEl.innerHTML = '';

    const makeItem = (img, isNew) => {

        // 감싸기
        const wrap = document.createElement('div');
        wrap.className = 'image-item';
        wrap.dataset.key = img.key || '';

        /// 이미지 태그
        const imgtag = document.createElement('img');
        imgtag.src = img.url;
        imgtag.alt = img.key || 'image';

        /// 삭제 버튼
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove';
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', async () => {
            if (isNew) {
                // 새로 추가 업로드한 이미지 제거
                addedImages = addedImages.filter(x => x.key !== img.key);
                // 필요 시 업로드 취소/삭제 API가 있다면 여기서 호출
            } else {
                // 기존 이미지 제거 → keptExisting에서 제외 + removedKeys 기록
                keptExisting = keptExisting.filter(x => x.key !== img.key);
                if (!removedKeys.includes(img.key)) removedKeys.push(img.key);
            }
            renderImages();
        });

        /// 라벨
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = img.key || '';

        wrap.appendChild(imgtag);
        wrap.appendChild(removeBtn);
        wrap.appendChild(label);
        imageListEl.appendChild(wrap);
    };

    keptExisting.forEach(img => makeItem(img, false));
    addedImages.forEach(img => makeItem(img, true));
}

// ───────────── 수정 로직 ─────────────
function wireEvents() {

    // 기존 글자수 파악
    titleInput.addEventListener('input', updateCounts);
    contentInput.addEventListener('input', updateCounts);

    // 버튼 눌러서 제출
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // 페이로드 값
        const categoryId = "2";
        const title   = titleInput.value.trim();
        const content = contentInput.value.trim();
        const imageKeys = [];

        if (!title)   {
            return showToast('제목을 입력하세요.');
        }

        if (!content) {
            return showToast('내용을 입력하세요.');
        }

        const payload = { categoryId, title, content, imageKeys };

        try {
            await updatePost(postId, payload);
            alert('글 수정이 완료되었습니다.');
            location.href = `/pages/html/post-detail.html?id=${postId}`;
        } catch (err) {
            console.error(err);
            await showToast(err?.message || '글 수정 중 오류가 발생했습니다.');
        }
    });
}

// ───────────── 프리 로드 ─────────────
async function preload() {

    /// 아이디 없으면 에러 발생
    if (!postId) {
        alert('잘못된 접근입니다. (id 누락)');
        location.href = '/pages/html/post-list.html';
        return;
    }

    const d = await getPostDetail(postId);

    // 제목/내용
    titleInput.value   = d.title   ?? '';
    contentInput.value = d.content ?? '';
    updateCounts();

    // 서버 로그 확인용 (지금처럼)
    console.log(d.image);

    // === 기존 이미지 세팅 ===
    const arr = Array.isArray(d.image) ? d.image : [];
    keptExisting = arr
        .filter(it => !!it?.imageUrl)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(it => ({ key: it.imageUrl, url: it.imageUrl, order: it.order ?? 0 }));

    removedKeys = [];
    addedImages = [];

    renderImages();
}


// ───────────── 초기화 로직 ─────────────
function init() {
    const params = new URLSearchParams(location.search);
    postId = params.get('id');

    // 실제 존재하는 id 우선으로 선택 (title → e-title), (content → e-content)
    titleInput   = required(pick('title', 'e-title'), '제목 입력');
    contentInput = required(pick('content', 'e-content'), '내용 입력');
    fileInput    = required(pick('e-image', 'image'), '이미지 입력');

    titleCount   = required(document.getElementById('titleCount'), '제목 글자수');
    contentCount = required(document.getElementById('contentCount'), '내용 글자수');
    imageListEl  = required(document.getElementById('imageList'), '이미지 리스트');

    preload().catch(err => {
        console.error(err);
        alert(err?.message || '기존 내용을 불러오지 못했습니다.');
    });
    wireEvents();
}

/// 시작
document.addEventListener('DOMContentLoaded', init);
