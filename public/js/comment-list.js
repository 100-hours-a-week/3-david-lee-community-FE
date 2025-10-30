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
const COOLDOWN_MS = 350; // 옵저버 연속 트리거 방지
const stateMap = new Map(); // 포스트별 상태 저장

// ---------- 유틸 ----------
function handlers(postId) {
    return {
        onCommentReply:  (c, ctx, e) => handleReply(c, ctx, postId, e),
        onCommentEdit:   (c, ctx, e) => handleEdit(c, ctx, e),
        onCommentDelete: (c, ctx, e) => handleDelete(c, ctx, e),
    };
}

// 서버 응답 threads -> 다음 커서(lastId): 마지막 스레드의 root.id 사용
function extractCursor(threads) {
    if (!Array.isArray(threads) || threads.length === 0) return null;
    const last = threads[threads.length - 1];
    return last?.root?.id ?? null;
}

// 컨테이너가 내부 스크롤 박스면 root로, 아니면 윈도우
function detectObserverRoot(listEl) {
    const st = getComputedStyle(listEl);
    const isScrollable = st.overflowY === "auto" || st.overflowY === "scroll";
    return isScrollable ? listEl : null;
}

// 임시 컨테이너에 렌더 → 실제 리스트로 “옮겨 붙이기(append)”
async function safeAppendWithRenderer(threads, listEl, postId) {
    if (!threads || threads.length === 0) return;
    const temp = document.createElement("div");
    // renderCommentThreads가 컨테이너를 비워도 temp만 영향을 받음
    await renderCommentThreads(threads, temp, handlers(postId));
    // 이벤트 리스너가 유지된 상태로 자식들을 실제 리스트에 이동
    while (temp.firstChild) {
        listEl.appendChild(temp.firstChild);
    }
}

// ---------- 옵저버 ----------
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
        rootMargin: "0px",
        threshold: 1.0, // sentinel이 완전히 보일 때만
    });

    st.observer.observe(st.sentinel);
}

// ---------- 다음 페이지 로드 ----------
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

        await safeAppendWithRenderer(threads, st.listEl, st.postId);
        st.listEl.appendChild(st.sentinel); // sentinel을 항상 맨 끝으로

        st.cursor = extractCursor(threads);
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
//  초기 로드 (첫 페이지 + 무한스크롤 시작)
// =================
export async function loadComments(postId, root) {
    // 기존 상태 정리
    const prev = stateMap.get(postId);
    if (prev) {
        prev.observer?.disconnect();
        stateMap.delete(postId);
    }

    const list = root.querySelector("#commentList");
    list.innerHTML = '<p class="skeleton">댓글을 불러오는 중…</p>';

    // sentinel 준비(보이지 않지만 공간 차지)
    let sentinel = list.querySelector("#commentSentinel");
    if (!sentinel) {
        sentinel = document.createElement("div");
        sentinel.id = "commentSentinel";
        sentinel.style.height = "1px";
        sentinel.style.marginTop = "8px";
        sentinel.style.visibility = "hidden";
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
        const res = await getComments(postId);
        const threads = res?.data?.content ?? [];

        list.innerHTML = ""; // 스켈레톤 제거
        await safeAppendWithRenderer(threads, list, postId);
        list.appendChild(sentinel);

        st.cursor = extractCursor(threads);
        st.ended = !Boolean(res?.data?.hasNext);

        setupObserver(st);
    } catch (err) {
        console.error(err);
        await showToast(err);
        list.innerHTML = `<p style="color:#c00">댓글을 불러오는 중 오류가 발생했습니다.</p>`;
    }
}
