/// 서버 요청 주소
const BASE_URL = 'http://localhost:8080/v1/comments';

/// 인증 요청
import { authFetch } from './authFetch.js';

/// 댓글 등록
export async function saveComments(commentData) {

    /// 인증 요청
    const res = await authFetch(BASE_URL, {
        method: 'POST',
        body: JSON.stringify(commentData),
    });

    if (!res.ok) {
        throw new Error(`댓글 등록 실패 (${res.status})`);
    }

    return await res.json();
}

/// 댓글 목록 조회
export async function getComments(postId, lastId) {
    const params = new URLSearchParams();
    params.set('postId', postId);
    params.set('offSet', 10); // 서버가 offSet=10 사용 중이므로 그대로
    if (lastId != null && lastId !== '') params.set('lastId', lastId); // undefined 방지

    const res = await authFetch(`${BASE_URL}?${params.toString()}`, { method: 'GET' });
    if (!res.ok) throw new Error(`댓글 목록 조회 실패 (${res.status})`);
    return await res.json();
}

/// 댓글 수정
export async function updateComment(commentId, content) {

    const res = await authFetch(`${BASE_URL}/${encodeURIComponent(commentId)}`, {
        method: 'PATCH',
        body: JSON.stringify(content),
    });
    if (!res.ok) {
        throw new Error(`댓글 수정 실패 (${res.status})`);
    }

    return await res.json();
}

/// 댓글 삭제
export async function deleteComment(commentId) {

    /// 인증 요청
    const res = await authFetch(`${BASE_URL}/${encodeURIComponent(commentId)}`, {
        method: 'PUT'
    });

    if (!res.ok) {
        throw new Error(`댓글 수정 실패 (${res.status})`);
    }

}


