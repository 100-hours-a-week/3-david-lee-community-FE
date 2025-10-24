/// 서버 요청 주소
const BASE_URL = 'http://localhost:8080/v1/images';

/// 인증 요청
import { authFetch } from './base.js';

/// 회원가입용 임시 주소 발급
export async function getTempUrl(fileName) {

    const res = await fetch(`${BASE_URL}/temp`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(fileName),
    });

    if (!res.ok) {
        throw new Error(`임시 파일 업로드 실패 (${res.status})`);
    }

    return await res.json();
}

/// 회원가입용 사용 확정
export async function confirmTempUrl(key) {

    const res = await fetch(`${BASE_URL}/temp`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(key),
    });

    if (!res.ok) {
        throw new Error(`임시 파일 확정 실패 (${res.status})`);
    }

    return await res.json();
}

/// 이미지 주소 발급
export async function getUrls(fileNames) {

    /// 인증 요청
    const res = await authFetch(BASE_URL, {
        method: 'POST',
        body: JSON.stringify({fileNames}),
    });

    if (!res.ok) {
        throw new Error(`이미지 주소 발급 실패 (${res.status})`);
    }

    return await res.json();

}

/// 이미지 사용 확정
export async function confirmUrls(keys) {

    /// 인증 요청
    const res = await authFetch(BASE_URL, {
        method: 'PATCH',
        body: JSON.stringify({keys}),
    });

    if (!res.ok) {
        throw new Error(`이미지 확정 실패 (${res.status})`);
    }

    return await res.json();


}