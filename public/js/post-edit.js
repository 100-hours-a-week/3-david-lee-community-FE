// ───────────── 인증 가드 ─────────────
import { requireAuth } from '../utils/auth-guard.js';
requireAuth();

// ───────────── API ─────────────
import { getPostDetail, updatePost } from '../api/post.js';

// ───────────── 컴포넌트 ─────────────
import {showToast} from '../pages/common/toast.js';
import {createImageGalleryUploader} from './image-uploader.js';
import {createSpinnerOverlay} from "../pages/common/spinner-overlay.js";

// ───────────── 헬퍼 ─────────────
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

// ───────────── 상태 및 DOM ─────────────
let postId, titleInput, contentInput, titleCount, contentCount, fileInput, imageListEl, addMoreBtn;
let galleryCtl;
let submitSpinner;

function updateCounts() {
    titleCount.textContent   = `${titleInput.value.length} / ${titleInput.maxLength || 0}`;
    contentCount.textContent = `${contentInput.value.length} / ${contentInput.maxLength || 0}`;
}

// ───────────── 초기 데이터 로드 ─────────────
async function preload() {
    if (!postId) {
        location.href = '/pages/html/404.html';
        return;
    }

    const d = await getPostDetail(postId);

    // 제목/내용
    titleInput.value   = d.title   ?? '';
    contentInput.value = d.content ?? '';
    updateCounts();

    galleryCtl.setInitial(Array.isArray(d.image) ? d.image : []);
}

// ───────────── 이벤트 바인딩 ─────────────
function wireEvents() {
    titleInput.addEventListener('input', updateCounts);
    contentInput.addEventListener('input', updateCounts);

    // 제출
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const categoryId = '2';
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title)  return showToast('제목을 입력하세요.');
        if (!content) return showToast('내용을 입력하세요.');

        // 스피너 표시
        submitSpinner.show();

        try {
            const imageKeys = galleryCtl.getKeys(); // 화면 순서대로 키 반환
            const payload = { categoryId, title, content, imageKeys };
            await updatePost(postId, payload);

            alert('글 수정이 완료되었습니다.');
            location.href = `/pages/html/post-detail.html?id=${encodeURIComponent(postId)}`;
        } catch (err) {
            submitSpinner.hide();
            console.error(err);
            await showToast(err?.message || '글 수정 중 오류가 발생했습니다.');
        }
    });
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

    /// 작동 스피너 넣기 (이미지 업로드용)
    const overlay = createSpinnerOverlay({
        spinnerSize: 30,
        border: 6,
        borderColor: "#fff",
        backdrop: "rgba(0,0,0,.45)",
    });

    // 제출용 스피너
    submitSpinner = createSpinnerOverlay({ ariaLabel: "게시글 수정 중" });

    // 모듈 생성
    galleryCtl = createImageGalleryUploader({
        listEl: imageListEl,
        fileInputEl: fileInput,
        addMoreBtnEl: addMoreBtn,
        maxSizeMB: 5,
        maxImages: 10,
        onError: (msg) => showToast(msg),
        onToast: (msg) => showToast(msg),
        onUploadStart: () => overlay.show({ lockSelectors: ["#postForm input", "#postForm button", "#postForm textarea", "#postForm select"] }),
        onUploadEnd:   () => overlay.hide(),

    });

    preload().catch(err => {
        console.error(err);

        // 404 에러인 경우 404 페이지로 리다이렉트
        if (err.status === 404) {
            location.href = '/pages/html/404.html';
            return;
        }

        alert(err?.message || '기존 내용을 불러오지 못했습니다.');
    });

    wireEvents();
}

document.addEventListener('DOMContentLoaded', init);
