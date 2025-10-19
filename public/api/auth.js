const BASE_URL = 'http://localhost:8080/v1/auth';

import { authFetch } from './base.js';

// 로그인 요청
export async function login(loginData) {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(loginData),
        credentials: 'include',
    });

    if (!res.ok) throw new Error('로그인 실패');

    const token = res.headers.get('Authorization');
    if (token) {
        // Bearer 제거하고 저장
        const pureToken = token.replace('Bearer ', '');
        localStorage.setItem('accessToken', pureToken);
    }

    return await res.json();
}


///  로그아웃
export async function logout() {
    const res = await authFetch(BASE_URL, {method: 'DELETE'});

    if (!res.ok) throw new Error(`로그아웃 실패 (${res.status})`);
    return await res.json();
}


/// 리프레쉬 토큰 바탕의 재발급
export async function reissue() {
    const res = await fetch(BASE_URL, {
        method: 'PUT',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
    });

    if (!res.ok) throw new Error(`재발급 등록 실패 (${res.status})`);

    const token = res.headers.get('Authorization');
    if (token) {
        // Bearer 제거하고 저장
        const pureToken = token.replace('Bearer ', '');
        localStorage.setItem('accessToken', pureToken);
    }

    return await res.json();
}