// ───────────── API ─────────────
import { getPosts } from '../api/post.js';

/// 컴포넌트
import { createPostListCard } from '../components/postListCard.js';
import {showToast} from "../pages/common/toast.js";

// ───────────── 내부 설정 ─────────────
const listEl = document.getElementById('postList');
const sentinel = document.getElementById('infiniteSentinel');
const PAGE_SIZE = 10;
// 상태값
let cursor = '';         // 백엔드 커서(마지막 게시글 id)
let isLoading = false;   // 중복 요청 방지
let hasMore = true;      // 더 가져올 데이터가 있는지
const seenIds = new Set(); // 중복 방지용

// 로딩 UI
function setLoading(loading) {
    isLoading = loading;
}

// 에러 UI
function showError(msg) {
    console.error(msg);

    sentinel.innerHTML = `
    <p style="color:#c00; margin:12px 0">오류: ${msg}</p>
    <button id="retryBtn" class="btn btn--secondary" style="padding:6px 10px">다시 시도</button>
  `;
    document.getElementById('retryBtn')?.addEventListener('click', () => {
        sentinel.innerHTML = '';
        loadMore(); // 재시도
    });
}

// 페이지 렌더링
async function loadMore() {
    if (isLoading || !hasMore) {
        return;
    }

    setLoading(true);

    try {
        const res = await getPosts(cursor, PAGE_SIZE, 2);
        const content = res?.data?.content ?? [];

        content.sort((a, b) => b.id - a.id);

        // 첫 페이지에서 비어있으면 빈 상태 표시
        if (cursor === '' && content.length === 0) {
            listEl.innerHTML = `<p class="empty">게시글이 없습니다.</p>`;
            hasMore = false;
            setLoading(false);
            return;
        }

        // 데이터 가공 & 렌더
        for (const p of content) {
            // 중복 방지 (커서 재요청/네트워크 지연 등 대비)
            if (seenIds.has(p.id)) {
                continue;
            }
            seenIds.add(p.id);

            const post = {
                id: p.id,
                title: p.title,
                likes: p.likeCount,
                comments: p.commentCount,
                views: p.viewCount,
                thumbnailUrl: p.thumbnailUrl,
                date: p.createdAt,
                author: p.user,
            };

            const card = await createPostListCard(post, {
                onClick: (pp) => {
                    location.href = `/pages/html/post-detail.html?id=${encodeURIComponent(pp.id)}`;
                },
            });
            listEl.appendChild(card);
        }

        // 커서 업데이트: 마지막 아이템의 id
        if (content.length > 0) {
            cursor = content[content.length - 1].id;
        }

        // 더 없음 판단
        if (content.length < PAGE_SIZE) {
            hasMore = false;
        } else {
            setLoading(false);
        }
    } catch (err) {
        const errorMessage = err?.response?.data?.message || err?.message || '알 수 없는 오류';
        setLoading(false);
        showError(errorMessage);
    }
}

// 초기 로딩(첫 페이지)
async function init() {

    const params = new URLSearchParams(location.search);
    if (params.get('toast') === 'deleted') {
        await showToast('삭제되었습니다.');
    }

    if (params.get('toast') === 'login') {
        await showToast('로그인 되었습니다.');
    }

    if (params.get('toast') === 'password') {
        await showToast('비밀번호가 정상적으로 변경되었습니다.');
    }


    // 초기 목록 비우기
    listEl.innerHTML = '';
    cursor = '';
    hasMore = true;
    seenIds.clear();

    // 첫 로딩
    await loadMore();

    // IntersectionObserver로 sentinel 감지 → loadMore()
    const io = new IntersectionObserver(
        (entries) => {
            const entry = entries[0];
            if (entry.isIntersecting) {
                // 여유를 두고 프리패칭 하고 싶으면 rootMargin 사용
                loadMore();
            }
        },
        {
            root: null,
            threshold: 0,
            rootMargin: '300px',
        }
    );

    io.observe(sentinel);
}

init();
