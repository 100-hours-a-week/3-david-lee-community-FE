/// 서버 요청 주소
import {AUTH_URL} from "./config.js";
const BASE_URL = AUTH_URL;

/// 인증 요청 및 토큰 저장소 유틸
import { authFetch } from './authFetch.js';
import {tokenStorage} from "../utils/tokenStorage.js";

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
    const token = extractBearer(res);
    if (token) tokenStorage.set(token);

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

    // 클라이언트 토큰 정리
    tokenStorage.remove();

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

    const token = extractBearer(res);
    if (token) tokenStorage.set(token);

    return await res.json();
}

/**
 * Authorization 헤더에서 Bearer 토큰 부분만 추출
 */
function extractBearer(res) {
    const raw = res.headers.get('Authorization');
    if (!raw) return null;
    // 대소문자 구분 없이 "Bearer " 제거
    return raw.replace(/^Bearer\s+/i, '').trim();
}
