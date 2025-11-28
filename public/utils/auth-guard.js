/**
 * 인증 가드 (Auth Guard)
 * 로그인하지 않은 사용자가 보호된 페이지에 접근하는 것을 방지합니다.
 */

/**
 * 액세스 토큰 존재 여부 확인
 * @returns {boolean} 토큰이 존재하면 true, 없으면 false
 */
export function hasAccessToken() {
    const token = localStorage.getItem('accessToken');
    return !!token && token.trim().length > 0;
}

/**
 * 인증 필수 페이지 보호
 * 토큰이 없으면 로그인 페이지로 리다이렉트
 *
 * @param {Object} options - 옵션
 * @param {string} options.redirectTo - 리다이렉트할 경로 (기본값: /pages/html/login.html)
 * @param {string} options.message - 토스트 메시지 (쿼리 파라미터로 전달)
 * @returns {boolean} 인증되었으면 true, 리다이렉트되면 false
 */
export function requireAuth(options = {}) {
    const {
        redirectTo = '/pages/html/login.html',
        message = 'login-required'
    } = options;

    if (!hasAccessToken()) {
        // 현재 페이지 URL을 저장 (로그인 후 돌아올 수 있도록)
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem('redirectAfterLogin', currentPath);

        // 로그인 페이지로 리다이렉트
        window.location.href = `${redirectTo}?toast=${message}`;
        return false;
    }

    return true;
}

/**
 * 로그인 후 원래 페이지로 복귀
 * 로그인 페이지에서 성공 후 호출
 *
 * @param {string} defaultPath - 저장된 경로가 없을 때 이동할 기본 경로
 * @returns {string} 리다이렉트할 경로
 */
export function getRedirectPath(defaultPath = '/pages/html/post-list.html') {
    const savedPath = sessionStorage.getItem('redirectAfterLogin');

    if (savedPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        return savedPath;
    }

    return defaultPath;
}

/**
 * 이미 로그인한 사용자가 로그인/회원가입 페이지 접근 시 리다이렉트
 *
 * @param {string} redirectTo - 리다이렉트할 경로 (기본값: /pages/html/post-list.html)
 */
export function redirectIfAuthenticated(redirectTo = '/pages/html/post-list.html') {
    if (hasAccessToken()) {
        window.location.href = redirectTo;
    }
}

/**
 * 페이지 로드 시 즉시 실행되는 인증 체크
 * 스크립트 최상단에서 호출하여 페이지 렌더링 전에 리다이렉트
 */
export function guardPage() {
    requireAuth();
}
