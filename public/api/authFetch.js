/// 토큰 재발급 호출
import { reissue } from "./auth.js";
import {tokenStorage} from "../utils/tokenStorage.js";

// 동시 401 대응: 재발급 단일화(once)용
let reissuePromise = null;

/// 인증이 필요한 내용은 해당 API 호출을 통해서 진행
export async function authFetch(url, options = {}) {

    /// AccessToken 토큰 가져오기
    const token = localStorage.getItem("accessToken");

    /// 토큰 가져와서 헤더 설정
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    /// 1차 요청
    let res = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // refresh_token 쿠키 포함
    });

    /// 401이면 재발급 → 1회 재시도
    if (res.status === 401) {
        console.warn('액세스 토큰 만료 — 재발급 시도');

        // 동시에 여러 요청이 401을 맞아도 재발급은 한 번만 진행
        if (!reissuePromise) {
            reissuePromise = reissue().catch(err => {
                // 실패 시 토큰 제거하고
                tokenStorage.remove();
                throw err;
            }).finally(() => {
                reissuePromise = null;
            });
        }

        try {
            await reissuePromise;
        } catch {
            throw new Error('토큰 재발급 실패. 다시 로그인해주세요.');
        }

        // 갱신된 토큰으로 재시도 (딱 1회)
        const newToken = tokenStorage.get();
        const retryHeaders = {
            ...headers,
            ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
        };

        res = await fetch(url, {
            ...options,
            headers: retryHeaders,
            credentials: 'include',
        });
    }

    if (!res.ok) {
        throw new Error(`요청 실패 (${res.status})`);
    }

    return res;
}
