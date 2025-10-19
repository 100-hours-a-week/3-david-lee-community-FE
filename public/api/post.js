const BASE_URL = 'http://localhost:8080/v1/posts';
import { authFetch } from './base.js';

/// 등록
export async function createPost(postData) {
    const res = await authFetch(BASE_URL, {
        method: 'POST',
        body: JSON.stringify(postData),
    });

    if (!res.ok) throw new Error(`게시글 등록 실패 (${res.status})`);

    return await res.json();
}

/// 목록 조회
export async function getPosts(categoryId) {

    const url = `${BASE_URL}?lastId=&offSet=10&categoryId=${encodeURIComponent(categoryId)}`;
    const res = await authFetch(url, {method: 'GET'});
    if (!res.ok) throw new Error(`목록 조회 실패 (${res.status})`);
    const data = await res.json();

    // 로그
    console.log(data);

    return Array.isArray(data.content) ? data.content : data;
}

/// 상세조회
export async function getPostDetail(postId) {
    const res = await authFetch(`${BASE_URL}/${postId}`, { method: 'GET' });

    if (!res.ok) throw new Error(`상세 조회 실패 (${res.status})`);
    const data = await res.json();

    return data.data;
}

/// 수정
export async function updatePost(postId, postData) {
    const res = await authFetch(`${BASE_URL}/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify(postData),
    });
    if (!res.ok) throw new Error(`게시글 수정 실패 (${res.status})`);
    return await res.json();
}

/// 삭제
export async function deletePost(postId) {
    const res = await authFetch(`${BASE_URL}/${postId}`, {method: 'DELETE'});
    if (!res.ok) throw new Error(`게시글 삭제 실패 (${res.status})`);
}
