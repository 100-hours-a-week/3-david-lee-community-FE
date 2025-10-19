import { reissue } from "./auth.js";

export async function authFetch(url, options = {}) {
    const token = localStorage.getItem("accessToken");

    // AccessToken 헤더 설정
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // 기본 요청
    let res = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // refresh_token 쿠키 포함
    });

    // 토큰 만료 시(401) → refresh 호출 후 재시도
    if (res.status === 401) {
        console.warn("Access token expired — trying to reissue...");

        /// refresh token으로 access token 재발급
        const refreshed = await reissue();
        if (refreshed) {
            headers.Authorization = `Bearer ${localStorage.getItem("accessToken")}`;
            res = await fetch(url, {
                ...options,
                headers,
                credentials: "include",
            });
        } else {
            throw new Error("토큰 재발급 실패. 다시 로그인해주세요.");
        }
    }

    // 에러
    if (!res.ok) {
        const msg = `요청 실패 (${res.status})`;
        throw new Error(msg);
    }

    return res;
}
