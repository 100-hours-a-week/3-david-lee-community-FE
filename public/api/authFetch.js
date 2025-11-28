/// 토큰 재발급 호출
import { reissue } from "./auth.js";

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

    /// 헤더를 포함하여 요청  전송
    let res = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // refresh_token 쿠키 포함
    });

    /// 토큰 재발급 -> RefreshToken 쿠키 바탕으로재시도
    if (res.status === 401) {

        /// 만료 알리기
        console.warn("액세스 토큰 만료 — 재발급을 요청합니다.");

        /// AccessToken 재발급
        const refreshed = await reissue();
        if (refreshed) {

            /// AccessToken 토큰 가져오기
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

    /// 에러 - 서버 응답의 실제 메시지 파싱
    if (!res.ok) {
        let errorMessage = `요청 실패 (${res.status})`;

        try {
            const errorData = await res.json();
            // 서버에서 보내는 다양한 에러 메시지 형식 처리
            errorMessage = errorData.message || errorData.error || errorData.msg || errorMessage;
        } catch (e) {
            // JSON 파싱 실패 시 기본 메시지 사용
            console.warn('에러 응답 파싱 실패:', e);
        }

        const error = new Error(errorMessage);
        error.status = res.status; // HTTP 상태 코드 추가
        throw error;
    }

    return res;
}
