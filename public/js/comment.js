// /// API
// import { getComments } from "../api/comment.js";
//
// /// 컴포넌트
// import { renderCommentThreads } from "../components/commentCard.js";
//
// // ───────────── 내부 설정 ─────────────
// const listEl = document.getElementById('commentList');
//
// // ───────────── API 호출 ─────────────
// try {
//     const res = await getComments(postId);
//     console.log(res);
//
//     // ✅ API 구조에서 data.content 추출
//     const threads = res.data?.content ?? [];
//
//     // ✅ 렌더링 함수 호출 시 컨테이너 전달
//     await renderCommentThreads(threads, listEl, {
//         onReply: (comment) => console.log('답글 클릭:', comment),
//         onEdit: (comment) => console.log('수정 클릭:', comment),
//         onDelete: (comment) => console.log('삭제 클릭:', comment),
//     });
//
// } catch (error) {
//     console.error('댓글 로드 실패:', error);
//     listEl.innerHTML = `<p style="color:red">댓글을 불러오는 중 오류가 발생했습니다.</p>`;
// }
