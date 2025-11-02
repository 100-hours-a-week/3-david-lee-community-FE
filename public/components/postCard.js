/// 템플릿 로더
import { loadTemplate } from '../utils/templateLoader.js';

/// 게시글 목록 만들기
export async function createPostCard(post, { onClick } = {}) {

    // 템플릿 가져오기
    const tpl = await loadTemplate('/components/postCard.html', 'postCard');
    const node = tpl.content.cloneNode(true);

    // ───────────── 썸네일 처리 ─────────────
    const thumbWrap = node.querySelector('.post__thumbnail');
    if (thumbWrap) {
        if (post.thumbnailUrl) {
            // 썸네일 이미지가 있을 때
            const img = document.createElement('img');
            img.src = post.thumbnailUrl;
            img.alt = (post.title ?? '') + ' 썸네일';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.onerror = () => (thumbWrap.style.display = 'none');
            thumbWrap.appendChild(img);
        } else {
            /// 없으면 NoImage 만들기
            const placeholder = document.createElement('span');
            placeholder.textContent = 'No Image';
            placeholder.style.color = '#9ca3af';
            placeholder.style.fontSize = '12px';
            thumbWrap.appendChild(placeholder);
        }
    }

    // ───────────── 작성자 아바타 (요구사항에서 일단은 제외함) ─────────────
    const avatar = node.querySelector('.author__avatar');
    if (avatar && post.author?.imageUrl) {
        const aimg = document.createElement('img');
        aimg.src = post.author.imageUrl;
        aimg.alt = (post.author?.nickname ?? '작성자') + ' 아바타';
        avatar.appendChild(aimg);
    }

    // ───────────── 내부 텍스트 채우기 ─────────────
    node.querySelector('.author__name').textContent = post.author?.nickname ?? '익명';
    node.querySelector('.post__title').textContent = post.title ?? '(제목 없음)';
    node.querySelector('.likes').textContent = `좋아요 ${post.likes ?? 0}`;
    node.querySelector('.comments').textContent = `댓글 ${post.comments ?? 0}`;
    node.querySelector('.views').textContent = `조회수 ${post.views ?? 0}`;
    node.querySelector('time').textContent = post.date ?? '';

    // ───────────── 클릭 이벤트 ─────────────
    if (onClick) {
        const card = node.querySelector('.card');
        if (card) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => onClick(post));
        }
    }

    return node;
}