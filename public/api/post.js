/// 서버 요청 주소
const BASE_URL = 'http://localhost:8080/v1/posts';

/// 인증 요청
import { authFetch } from './authFetch.js';

/// 등록
export async function createPost(postData) {

    /// 인증 요청
    const res = await authFetch(BASE_URL, {
        method: 'POST',
        body: JSON.stringify(postData),
    });

    if (!res.ok) {
        throw new Error(`게시글 등록 실패 (${res.status})`);
    }

    return await res.json();
}

/// 목록 조회
export async function getPosts(lastId, offset, categoryId) {

    /// 인증 요청
    const res = await authFetch(
        `${BASE_URL}?lastId=${encodeURIComponent(lastId)}&offSet=${encodeURIComponent(offset)}&categoryId=${encodeURIComponent(categoryId)}`, {
            method: 'GET'
        }
    );

    console.log("데이터를 추가로 요청합니다.");


    if (!res.ok) {
        throw new Error(`목록 조회 실패 (${res.status})`);
    }

    /// JSON 응답
    return await res.json();
}

/// 상세조회
export async function getPostDetail(postId) {

    /// 인증 요청
    const res = await authFetch(`${BASE_URL}/${postId}`, {method: 'GET'});

    if (!res.ok) {
        throw new Error(`상세 조회 실패 (${res.status})`);
    }

    /// JSON 응답
    const data = await res.json();

    /// data만 받기
    return data.data;
}

/// 수정
export async function updatePost(postId, postData) {

    /// 인증 요청
    const res = await authFetch(`${BASE_URL}/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify(postData),
    });

    if (!res.ok) {
        throw new Error(`게시글 수정 실패 (${res.status})`);
    }

    return await res.json();
}

/// 삭제
export async function deletePost(postId) {

    /// 인증 요청
    const res = await authFetch(`${BASE_URL}/${postId}`, {method: 'PUT'});

    if (!res.ok) {
        throw new Error(`게시글 삭제 실패 (${res.status})`);
    }

}
