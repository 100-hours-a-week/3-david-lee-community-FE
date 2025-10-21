/// 서버 요청 주소
const BASE_URL = 'http://localhost:8080/v1/posts/likes';

/// 인증 요청
import { authFetch } from './base.js';

/// 좋아요
export async function likePost(likeData) {

    /// 인증 요청
    const res = await authFetch(BASE_URL, {
        method: 'POST',
        body: JSON.stringify(likeData),
    });

    if (!res.ok) {
        throw new Error(`좋아요 등록 실패 (${res.status})`);
    }

    return await res.json();
}


/// 좋아요 취소
export async function unlikePost(postId) {

    /// 인증 요청
    const res = await authFetch(`${BASE_URL}?postId=${encodeURIComponent(postId)}`, {
        method: 'DELETE',
    });

    if (!res.ok) {
        throw new Error(`좋아요 취소 실패 (${res.status})`);
    }

    return await res.json();
}
