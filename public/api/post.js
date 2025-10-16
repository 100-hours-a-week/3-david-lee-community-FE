const BASE_URL = 'http://localhost:8080/v1/posts';

/// 등록
export async function createPost(postData) {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
    });
    if (!res.ok) throw new Error(`게시글 등록 실패 (${res.status})`);
    return await res.json();
}

/// 목록 조회
export async function getPosts(categoryId) {

    const url = `${BASE_URL}?lastId=&offSet=10&categoryId=${encodeURIComponent(categoryId)}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`목록 조회 실패 (${res.status})`);
    const data = await res.json();
    return Array.isArray(data.content) ? data.content : data;
}

/// 상세조회
export async function getPostDetail(postId) {
    const res = await fetch(`${BASE_URL}/${postId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`상세 조회 실패 (${res.status})`);
    return await res.json();
}

/// 수정
export async function updatePost(postId, postData) {
    const res = await fetch(`${BASE_URL}/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
    });
    if (!res.ok) throw new Error(`게시글 수정 실패 (${res.status})`);
    return await res.json();
}

/// 삭제
export async function deletePost(postId) {
    const res = await fetch(`${BASE_URL}/${postId}`, {
        method: 'PUT',
    });
    if (!res.ok) throw new Error(`게시글 삭제 실패 (${res.status})`);
}
