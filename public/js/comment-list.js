// =================
//  API
// =================
import { getComments } from "../api/comment.js";

// =================
//  컴포넌트
// =================
import { showToast } from "../pages/common/toast.js";
import { handleDelete, handleEdit, handleReply } from "./comment-edit.js";

// =================
//  옵션
// =================
const COOLDOWN_MS = 350;    // 연속 트리거 방지

// 포스트별 상태: { loading, ended, cursor, listEl, sentinel, postId, observer, lastFiredAt }
const stateMap = new Map();

// 댓글 렌더 콜백 공통
function handlers(postId) {
    return {
        onCommentReply:  (c, ctx, e) => handleReply(c, ctx, postId, e),
        onCommentEdit:   (c, ctx, e) => handleEdit(c, ctx, e),
        onCommentDelete: (c, ctx, e) => handleDelete(c, ctx, e),
    };
}

// 내부 스크롤 컨테이너 감지(없으면 윈도우 스크롤)
function detectObserverRoot(listEl) {
    const st = getComputedStyle(listEl);
    const isScrollable = st.overflowY === "auto" || st.overflowY === "scroll";
    return isScrollable ? listEl : null;
}

// 다음 커서: 이번 페이지의 root.id 중 "최솟값"(오름/내림 정렬 모두 안전)
function nextCursorFrom(threads, currentCursor) {
    if (!Array.isArray(threads) || threads.length === 0) return null;
    const ids = threads.map(t => t?.root?.id).filter(id => typeof id === 'number');
    if (ids.length === 0) return null;
    let candidate = Math.min(...ids);
    if (typeof currentCursor === 'number') {
        const smaller = ids.filter(id => id < currentCursor);
        if (smaller.length > 0) candidate = Math.min(...smaller);
    }
    return candidate;
}

// ====== 핵심: 덧붙이기 렌더러 ======
function appendThreads(threads, listEl, h) {
    const frag = document.createDocumentFragment();

    for (const t of threads) {
        const r = t.root;
        if (!r) continue;

        // thread 컨테이너
        const thread = document.createElement('div');
        thread.className = 'comment-thread';
        thread.dataset.id = r.id;

        // 루트 댓글
        const root = document.createElement('div');
        root.className = 'comment comment--root';
        root.innerHTML = `
      <div class="comment__header">
        <img class="comment__avatar" src="${r.user?.imageUrl || ''}" alt="">
        <b class="comment__nickname">${r.user?.nickname || '익명'}</b>
        <span class="comment__time">${r.createdAt || ''}</span>
      </div>
      <div class="comment__body">${escapeHTML(r.content || '')}</div>
      <div class="comment__actions">
        <button class="btn-reply">답글</button>
        ${r.editable ? '<button class="btn-edit">수정</button><button class="btn-del">삭제</button>' : ''}
      </div>
    `;

        // 액션 바인딩
        const ctx = { threadEl: thread, rootEl: root, commentId: r.id };
        root.querySelector('.btn-reply')?.addEventListener('click', (e) => h.onCommentReply(r, ctx, e));
        if (r.editable) {
            root.querySelector('.btn-edit')?.addEventListener('click', (e) => h.onCommentEdit(r, ctx, e));
            root.querySelector('.btn-del')?.addEventListener('click', (e) => h.onCommentDelete(r, ctx, e));
        }

        thread.appendChild(root);

        // 자식 댓글들
        const children = Array.isArray(t.children) ? t.children : [];
        if (children.length > 0) {
            const ul = document.createElement('div');
            ul.className = 'comment-children';
            for (const c of children) {
                const child = document.createElement('div');
                child.className = 'comment comment--child';
                child.dataset.id = c.id;
                child.innerHTML = `
          <div class="comment__header">
            <img class="comment__avatar" src="${c.user?.imageUrl || ''}" alt="">
            <b class="comment__nickname">${c.user?.nickname || '익명'}</b>
            <span class="comment__time">${c.createdAt || ''}</span>
          </div>
          <div class="comment__body">${escapeHTML(c.content || '')}</div>
          <div class="comment__actions">
            ${c.editable ? '<button class="btn-edit">수정</button><button class="btn-del">삭제</button>' : ''}
          </div>
        `;
                const cctx = { threadEl: thread, rootEl: child, commentId: c.id, parentId: r.id };
                if (c.editable) {
                    child.querySelector('.btn-edit')?.addEventListener('click', (e) => h.onCommentEdit(c, cctx, e));
                    child.querySelector('.btn-del')?.addEventListener('click', (e) => h.onCommentDelete(c, cctx, e));
                }
                ul.appendChild(child);
            }
            thread.appendChild(ul);
        }

        frag.appendChild(thread);
    }

    listEl.appendChild(frag);
}

// 간단한 XSS 방지용 escape
function escapeHTML(s) {
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// 옵저버 세팅
function setupObserver(st) {
    if (st.ended || st.observer) return;

    const rootEl = detectObserverRoot(st.listEl);
    st.lastFiredAt = 0;

    st.observer = new IntersectionObserver((entries) => {
        const e = entries[0];
        if (!e.isIntersecting) return;

        const now = Date.now();
        if (now - st.lastFiredAt < COOLDOWN_MS) return;
        st.lastFiredAt = now;

        void loadMore(st);
    }, {
        root: rootEl,
        rootMargin: '0px',
        threshold: 1.0,
    });

    st.observer.observe(st.sentinel);
}

// 다음 페이지 로드
async function loadMore(st) {
    if (st.loading || st.ended) return;
    st.loading = true;

    try {
        const page = await getComments(st.postId, st.cursor ?? undefined);
        const threads = page?.data?.content ?? [];

        if (threads.length === 0) {
            st.ended = !Boolean(page?.data?.hasNext);
            if (st.ended) st.observer?.disconnect();
            return;
        }

        // 덧붙이기
        appendThreads(threads, st.listEl, handlers(st.postId));
        // sentinel을 항상 맨 끝으로
        st.listEl.appendChild(st.sentinel);

        // 커서/종료 갱신
        const prevCursor = st.cursor;
        st.cursor = nextCursorFrom(threads, prevCursor);
        st.ended = !Boolean(page?.data?.hasNext);
        if (st.ended) st.observer?.disconnect();
    } catch (err) {
        console.error(err);
        await showToast(err);
    } finally {
        st.loading = false;
    }
}

// =================
//  초기 로드
// =================
export async function loadComments(postId, root) {
    // 중복 초기화 방지
    const prev = stateMap.get(postId);
    if (prev) {
        prev.observer?.disconnect();
        stateMap.delete(postId);
    }

    const list = root.querySelector('#commentList');
    list.innerHTML = '<p class="skeleton">댓글을 불러오는 중…</p>';

    // sentinel 준비
    let sentinel = list.querySelector('#commentSentinel');
    if (!sentinel) {
        sentinel = document.createElement('div');
        sentinel.id = 'commentSentinel';
        sentinel.style.height = '1px';
        sentinel.style.marginTop = '8px';
        list.appendChild(sentinel);
    }

    const st = {
        loading: false,
        ended: false,
        cursor: null,
        listEl: list,
        sentinel,
        postId,
        observer: null,
        lastFiredAt: 0,
    };
    stateMap.set(postId, st);

    try {
        const page = await getComments(postId);
        const threads = page?.data?.content ?? [];

        // 초기엔 비우고 → append
        list.innerHTML = '';
        appendThreads(threads, list, handlers(postId));
        list.appendChild(sentinel);

        // 커서/종료
        st.cursor = nextCursorFrom(threads, null);
        st.ended = !Boolean(page?.data?.hasNext);

        // 옵저버 시작
        setupObserver(st);
    } catch (err) {
        console.error(err);
        await showToast(err);
        list.innerHTML = `<p style="color:#c00">댓글을 불러오는 중 오류가 발생했습니다.</p>`;
    }
}
