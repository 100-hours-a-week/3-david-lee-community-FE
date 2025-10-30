// =================
//  API
// =================
import { getComments } from "../api/comment.js";

// =================
//  컴포넌트
// =================
import { renderCommentThreads } from "../components/commentCard.js";
import { showToast } from "../pages/common/toast.js";
import { handleDelete, handleEdit, handleReply } from "./comment-edit.js";

// =================
//  옵션
// =================
const COOLDOWN_MS = 350;    // 연속 트리거 방지(옵션)

// 포스트별 상태: { loading, ended, cursor, listEl, sentinel, postId, observer, lastFiredAt }
const stateMap = new Map();

// 서버 응답(content: [{root:{id,..}, children:[]}...])에서 다음 커서(lastId) 추출
function extractCursorFromThreads(threads) {
    if (!Array.isArray(threads) || threads.length === 0) return null;
    // 서버가 최신 → 오래된 순으로 내려주므로, 마지막 요소의 root.id를 커서로 사용
    const last = threads[threads.length - 1];
    return last?.root?.id ?? null;
}

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

// 옵저버 세팅
function setupObserver(st) {
    if (st.ended || st.observer) return;

    const rootEl = detectObserverRoot(st.listEl);

    st.lastFiredAt = 0;
    st.observer = new IntersectionObserver((entries) => {
        const e = entries[0];
        if (!e.isIntersecting) return;

        // 쿨타임으로 연속 호출 방지
        const now = Date.now();
        if (now - st.lastFiredAt < COOLDOWN_MS) return;
        st.lastFiredAt = now;

        void loadMore(st);
    }, {
        root: rootEl,     // 내부 스크롤 박스면 그 요소, 아니면 null(윈도우)
        rootMargin: "0px",
        threshold: 1.0,   // sentinel이 완전히 보일 때만
    });

    st.observer.observe(st.sentinel);
}

// 다음 페이지 로드
async function loadMore(st) {
    if (st.loading || st.ended) return;
    st.loading = true;

    try {
        // 서버는 lastId 쿼리를 받음: (없으면 첫 페이지)
        const page = await getComments(st.postId, st.cursor ?? undefined);
        const threads = page?.data?.content ?? [];

        // 비었으면 끝
        if (threads.length === 0) {
            st.ended = true;
            st.observer?.disconnect();
            return;
        }

        // 덧붙이기
        await renderCommentThreads(threads, st.listEl, handlers(st.postId));
        st.listEl.appendChild(st.sentinel); // sentinel을 항상 맨 끝으로

        // 서버가 hasNext만 줌 → 그대로 신뢰
        const hasNext = !!page?.data?.hasNext;
        st.ended = !hasNext;

        // 다음 커서: 마지막 스레드의 root.id
        st.cursor = extractCursorFromThreads(threads);

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

    const list = root.querySelector("#commentList");
    list.innerHTML = '<p class="skeleton">댓글을 불러오는 중…</p>';

    // sentinel 준비
    let sentinel = list.querySelector("#commentSentinel");
    if (!sentinel) {
        sentinel = document.createElement("div");
        sentinel.id = "commentSentinel";
        sentinel.style.height = "1px";
        sentinel.style.marginTop = "8px";
        list.appendChild(sentinel);
    }

    const st = {
        loading: false,
        ended: false,
        cursor: null, // 첫 페이지 커서 없음
        listEl: list,
        sentinel,
        postId,
        observer: null,
        lastFiredAt: 0,
    };
    stateMap.set(postId, st);

    try {
        // 첫 페이지
        const page = await getComments(postId);
        const threads = page?.data?.content ?? [];

        list.innerHTML = "";
        await renderCommentThreads(threads, list, handlers(postId));
        list.appendChild(sentinel);

        // hasNext 그대로 사용
        const hasNext = !!page?.data?.hasNext;
        st.ended = !hasNext;

        // 다음 커서: 마지막 스레드의 root.id
        st.cursor = extractCursorFromThreads(threads);

        // 옵저버 시작
        setupObserver(st);
    } catch (err) {
        console.error(err);
        await showToast(err);
        list.innerHTML = `<p style="color:#c00">댓글을 불러오는 중 오류가 발생했습니다.</p>`;
    }
}
