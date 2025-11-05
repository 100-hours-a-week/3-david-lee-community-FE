/// 템플릿 로더
import {loadTemplate} from "../utils/templateLoader.js";
import {showToast} from "../pages/common/toast.js";

/// 이미지 갤러리 생성기: 메인 + 썸네일 + 좌/우 버튼
function mountGallery(root, imageUrls = [], title = 'post image') {
    const el = root.querySelector('[data-gallery]');
    if (!el) return;

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        el.closest('.media')?.remove();
        return;
    }

    const main      = el.querySelector('.gallery__main');
    const mainImg   = main?.querySelector('img');
    const prevBtn   = el.querySelector('.gallery__nav--prev');
    const nextBtn   = el.querySelector('.gallery__nav--next');
    const thumbsBox = el.querySelector('.gallery__thumbs');

    let current = 0;

    // 메인 이미지 초기화
    if (mainImg) {
        mainImg.alt = title || 'post image';
        mainImg.referrerPolicy = 'no-referrer';
        mainImg.decoding = 'async';
        mainImg.loading = 'lazy';
        mainImg.src = imageUrls[current];
    }

    // 썸네일 생성 + 클릭 핸들러
    const thumbEls = [];
    const frag = document.createDocumentFragment();
    imageUrls.forEach((url, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'thumb';
        btn.setAttribute('aria-label', `이미지 ${idx + 1} 보기`);

        const img = document.createElement('img');
        img.src = url;
        img.alt = `썸네일 ${idx + 1}`;
        img.loading = 'lazy';
        img.referrerPolicy = 'no-referrer';

        btn.appendChild(img);
        btn.addEventListener('click', () => setCurrent(idx));
        thumbEls.push(btn);
        frag.appendChild(btn);
    });
    thumbsBox?.appendChild(frag);

    function highlightThumb(i) {
        thumbEls.forEach((el, k) => el.classList.toggle('is-active', k === i));
    }

    function setCurrent(idx) {
        if (!imageUrls.length) return;
        current = (idx + imageUrls.length) % imageUrls.length;
        if (mainImg) mainImg.src = imageUrls[current];
        highlightThumb(current);
    }

    // 이전/다음 버튼만 처리
    prevBtn?.addEventListener('click', () => setCurrent(current - 1));
    nextBtn?.addEventListener('click', () => setCurrent(current + 1));

    // 초기 하이라이트
    highlightThumb(current);
}

/// 상세 게시글 만들기
export async function createPostDetailCard(post, opts = {}) {
    const {onToggleLike, onEdit, onDelete} = opts;

    // 템플릿 로드
    const tpl = await loadTemplate('/components/postDetailCard.html', 'postDetailCard');
    const node = tpl.content.cloneNode(true);

    // ──────────────────────────────
    // 주요 노드 캐싱 (상단으로 전부 이동)
    // ──────────────────────────────
    const authorNameEl    = node.querySelector('.author__name');
    const createdAtEl     = node.querySelector('.createdAt');
    const avatarImg       = node.querySelector('.author__avatar img');
    const titleEl         = node.querySelector('.title');
    const contentEl       = node.querySelector('.content');
    const likeBtnEl      = node.querySelector('[data-action="toggle-like"]');
    const likeCountEl     = node.querySelector('.likeCount');
    const viewCountEl     = node.querySelector('.viewCount');
    const commentCountEl  = node.querySelector('.commentCount');
    const editBtn         = node.querySelector('[data-action="edit"]');
    const deleteBtn       = node.querySelector('[data-action="delete"]');
    const media           = node.querySelector('.media');

    // ──────────────────────────────
    // 데이터 주입
    // ──────────────────────────────
    if (authorNameEl) authorNameEl.textContent = post.author?.nickname ?? '익명';
    if (createdAtEl)  createdAtEl.textContent  = post.createdAt ?? '';

    if (avatarImg) {
        if (post.author?.imageUrl) {
            Object.assign(avatarImg, {
                src: post.author.imageUrl,
                alt: post.author.nickname ?? '작성자',
                referrerPolicy: 'no-referrer',
                loading: 'lazy',
                decoding: 'async',
            });
        } else avatarImg.remove();
    }

    if (titleEl)   titleEl.textContent   = post.title ?? '';
    if (contentEl) contentEl.textContent = post.content ?? '';

    if (viewCountEl)    viewCountEl.textContent    = String(post.viewCount ?? 0);
    if (commentCountEl) commentCountEl.textContent = String(post.commentCount ?? 0);

    // 미디어
    if (media) {
        const urls = Array.isArray(post.images) ? post.images : [];
        mountGallery(media, urls, post.title ?? 'post image');
    }

    // ──────────────────────────────
    // 좋아요 처리
    // ──────────────────────────────
    let liked = !!post.liked;
    let likeCount = Number(post.likeCount ?? 0);
    let busy = false;

    function renderLikeUI() {
        if (likeCountEl) likeCountEl.textContent = String(likeCount);
        if (likeBtnEl) {
            likeBtnEl.setAttribute('aria-pressed', liked ? 'true' : 'false');
            likeBtnEl.classList.toggle('liked', liked);
            likeBtnEl.disabled = !!busy;
        }
    }
    renderLikeUI();

    // 좋아요 토글 핸들러 (낙관적 갱신 → 실패 시 롤백)
    async function handleToggleLike() {
        if (!likeBtnEl || busy) return;
        const prevLiked = liked;
        const prevCount = likeCount;

        // UI 먼저 토글
        liked = !liked;
        likeCount = liked ? prevCount + 1 : Math.max(0, prevCount - 1);
        busy = true;
        renderLikeUI();

        try {
            // 현재 상태(prevLiked 기준으로 서버 호출)
            // prevLiked=false 였으면 like 요청, true 였으면 unlike 요청
            await onToggleLike?.(prevLiked);
            busy = false;
            renderLikeUI();
        } catch (e) {
            // 실패하면 되돌림
            liked = prevLiked;
            likeCount = prevCount;
            busy = false;
            renderLikeUI();
            await showToast('좋아요 처리 중 오류가 발생했습니다: ' + (e?.message || ''));
        }
    }

    if (likeBtnEl) {
        likeBtnEl.addEventListener('click', handleToggleLike);
        likeBtnEl.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter' || evt.key === ' ') {
                evt.preventDefault();
                handleToggleLike();
            }
        });
    }

    // ──────────────────────────────
    // 수정 / 삭제
    // ──────────────────────────────
    editBtn && (onEdit ? editBtn.addEventListener('click', () => onEdit(post)) : editBtn.remove());
    deleteBtn && (onDelete ? deleteBtn.addEventListener('click', () => onDelete(post)) : deleteBtn.remove());

    return node;
}

