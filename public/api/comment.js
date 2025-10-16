const BASE_URL = 'http://localhost:8080/v1/comment';

/// 등록
export async function saveComments(commentData) {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content: commentData})
    });

    if (!res.ok) throw new Error(`댓글 등록 실패 (${res.status})`);
    return await res.json();
}

/// 목록 조회
export async function getComments(postId) {

    const url = `${BASE_URL}?lastId=&offSet=10&postId=${encodeURIComponent(postId)}`;
    const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`댓글 목록 조회 실패 (${res.status})`);
    const data = await res.json();
    return Array.isArray(data.content) ? data.content : data;
}



