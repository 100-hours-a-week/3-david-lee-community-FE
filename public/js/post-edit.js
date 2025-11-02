import { getPostDetail, updatePost } from '../api/post.js';
import { getUrls, confirmUrls } from '../api/image.js';
import { showToast } from '../pages/common/toast.js';

// 가장 먼저 존재하는 요소 하나를 찾아 반환
function pick(...ids) {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (el) return el;
    }
    return null;
}

// 필수 요소 체크
function required(el, name) {
    if (!el) throw new Error(`${name} 요소를 찾을 수 없습니다. id 확인 필요`);
    return el;
}

// ───────────── 상태 값 ─────────────
let postId, titleInput, contentInput, titleCount, contentCount, fileInput, imageListEl, addMoreBtn;
let gallery = [];
let dragSrcIndex = null;

// ───────────── 글자수 카운트 ─────────────
function updateCounts() {
    titleCount.textContent   = `${titleInput.value.length} / ${titleInput.maxLength || 0}`;
    contentCount.textContent = `${contentInput.value.length} / ${contentInput.maxLength || 0}`;
}

// ───────────── DnD 유틸 ─────────────
function moveItem(arr, from, to) {
    if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
        return;
    }
    const [spliced] = arr.splice(from, 1);
    arr.splice(to, 0, spliced);
}

// 인덱스 계산
function indexOfItemEl(target) {
    const items = Array.from(imageListEl.querySelectorAll('.image-item'));
    return items.indexOf(target.closest('.image-item'));
}

// ───────────── 이미지 렌더 ─────────────
function renderImages() {
    imageListEl.innerHTML = '';

    gallery.forEach((img, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'image-item';
        wrap.dataset.key = img.key || '';
        wrap.dataset.index = String(idx);
        wrap.draggable = true; // DnD 활성화

        // 드래그 핸들
        const handle = document.createElement('div');
        handle.className = 'drag-handle';

        const imgtag = document.createElement('img');
        imgtag.src = img.url;
        imgtag.alt = img.key || 'image';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove';
        removeBtn.type = 'button';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
            /// 갤러리에서 제거
            gallery = gallery.filter(x => x.key !== img.key);
            renderImages();
        });

        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = img.key || '';

        // DnD 이벤트
        wrap.addEventListener('dragstart', (e) => {
            dragSrcIndex = Number(wrap.dataset.index);
            e.dataTransfer.effectAllowed = 'move';
        });

        wrap.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            wrap.classList.add('drag-over');
        });

        wrap.addEventListener('dragleave', () => {
            wrap.classList.remove('drag-over');
        });

        wrap.addEventListener('drop', (e) => {
            e.preventDefault();
            wrap.classList.remove('drag-over');
            const toIndex = indexOfItemEl(e.target);
            if (dragSrcIndex != null && toIndex !== -1) {
                moveItem(gallery, dragSrcIndex, toIndex);
                dragSrcIndex = null;
                // 재렌더 → 순서 반영
                renderImages();
            }
        });

        wrap.appendChild(handle);
        wrap.appendChild(imgtag);
        wrap.appendChild(removeBtn);
        wrap.appendChild(label);
        imageListEl.appendChild(wrap);
    });
}

// ───────────── 파일 선택 → 즉시 업로드 ─────────────
async function handleFileSelect(filesLike) {
    const files = Array.from(filesLike || []);
    if (files.length === 0) return;

    // 기본 검증
    for (const f of files) {
        if (!f.type.startsWith('image/')) {
            await showToast('이미지 파일만 업로드 가능합니다.');
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            await showToast('5MB를 초과한 파일이 있습니다.');
            return;
        }
    }

    // 1) presign
    const fileNames = files.map(f => f.name);
    const presign = await getUrls(fileNames);
    const items = presign?.data ?? [];
    if (items.length !== files.length) {
        throw new Error('프리사인드 URL 개수가 파일 수와 다릅니다.');
    }
    const byName = new Map(items.map(it => [it.fileName, it]));

    // 2) S3 업로드
    const uploaded = [];
    for (const file of files) {
        const it = byName.get(file.name);
        if (!it) throw new Error(`presign 응답에 ${file.name}가 없습니다.`);

        const { preSignedUrl, key } = it;

        const putRes = await fetch(preSignedUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
        });
        if (!putRes.ok) {
            throw new Error(`S3 업로드 실패: ${file.name}`);
        }

        // 로컬 미리보기 (짧게만 사용)
        const localPreview = URL.createObjectURL(file);
        uploaded.push({ key, url: localPreview, isNew: true });
    }

    // 3) confirm
    await confirmUrls(uploaded.map(u => u.key));

    // 4) 상태 반영: 갤러리에 뒤에 이어붙임(순서 = 현재 끝에 추가)
    gallery.push(...uploaded);
    renderImages();

    // 파일 인풋 초기화 (같은 파일 재선택 허용)
    if (fileInput) fileInput.value = '';
}

// ───────────── 이벤트 바인딩 ─────────────
function wireEvents() {
    // 글자수
    titleInput.addEventListener('input', updateCounts);
    contentInput.addEventListener('input', updateCounts);

    // 파일 선택(추가 업로드)
    fileInput.addEventListener('change', async (e) => {
        try {
            await handleFileSelect(e.currentTarget.files || []);
        } catch (err) {
            console.error(err);
            await showToast(err?.message || '이미지 업로드 중 오류가 발생했습니다.');
        }
    });

    // (선택) “이미지 추가” 버튼
    if (addMoreBtn) {
        addMoreBtn.addEventListener('click', () => fileInput?.click());
    }

    // 제출
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
        submitBtn.disabled = true;

        const categoryId = '2';
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title) {
            submitBtn.disabled = false;
            return showToast('제목을 입력하세요.');
        }
        if (!content) {
            submitBtn.disabled = false;
            return showToast('내용을 입력하세요.');
        }

        try {
            // 화면에 보이는 순서대로 전달
            const imageKeys = gallery.map(x => x.key);

            const payload = { categoryId, title, content, imageKeys };
            await updatePost(postId, payload);

            alert('글 수정이 완료되었습니다.');
            location.href = `/pages/html/post-detail.html?id=${encodeURIComponent(postId)}`;
        } catch (err) {
            console.error(err);
            await showToast(err?.message || '글 수정 중 오류가 발생했습니다.');
        } finally {
            submitBtn.disabled = false;
        }
    });
}

// ───────────── 초기 데이터 로드 ─────────────
async function preload() {
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

    // 기대 형태: d.image: [{ imageUrl, key?, order? }]
    const arr = Array.isArray(d.image) ? d.image : [];
    gallery = arr
        .filter(it => !!it?.imageUrl)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(it => ({
            key: it.imageKey,
            url: it.imageUrl,
            isNew: false,
        }));

    renderImages();
}

// ───────────── 시작 ─────────────
function init() {
    const params = new URLSearchParams(location.search);
    postId = params.get('id');

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

document.addEventListener('DOMContentLoaded', init);
