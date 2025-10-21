/// 서버 요청 주소
const BASE_URL = 'http://localhost:8080/v1/auth';

/// 인증 요청
import { authFetch } from './base.js';

/// 로그인
export async function login(loginData) {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(loginData),
        credentials: 'include',
    });

    if (!res.ok) {
        /// 없으면 예외 처리
        throw new Error('로그인 실패');
    }

    /// 응답 요청 ACCESS TOKEN 저장하기
    const token = res.headers.get('Authorization');
    if (token) {

        /// Bearer 제거하고 저장
        const pureToken = token.replace('Bearer ', '');

        /// 로컬 스토리지에 저장하기
        localStorage.setItem('accessToken', pureToken);
    }

    return await res.json();
}


///  로그아웃
export async function logout() {

    /// 인증 요청
    const res = await authFetch(BASE_URL, {method: 'DELETE'});

    if (!res.ok) {
        /// 없으면 예외 처리
        throw new Error(`로그아웃 실패 (${res.status})`);
    }

    return await res.json();
}


/// 토큰 재발급
export async function reissue() {
    const res = await fetch(BASE_URL, {
        method: 'PUT',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
    });

    if (!res.ok) {
        throw new Error(`재발급 등록 실패 (${res.status})`);
    }

    const token = res.headers.get('Authorization');
    if (token) {
        /// Bearer 제거하고 저장
        const pureToken = token.replace('Bearer ', '');

        /// 로컬 스토리지에 저장
        localStorage.setItem('accessToken', pureToken);
    }

    return await res.json();
}