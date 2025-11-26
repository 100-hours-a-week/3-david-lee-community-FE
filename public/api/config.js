// 환경에 따라 API Base URL 자동 설정
// localhost 환경: http://localhost:8080/v1
// 배포 환경: https://api.ktb-david.cloud/v1

const isLocalhost = window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1';

export const API_BASE = isLocalhost
  ? `http://localhost:8080/v1`
  : `https://api.ktb-david.cloud/v1`;

export const AUTH_URL = `${API_BASE}/auth`;
export const USER_URL = `${API_BASE}/users`;
export const POST_URL = `${API_BASE}/posts`;
export const LIKE_URL = `${API_BASE}/posts/likes`;
export const IMAGE_URL = `${API_BASE}/images`;
export const COMMENT_URL = `${API_BASE}/comments`;

// 현재 사용 중인 API URL 콘솔에 출력 (디버깅용)
console.log(`🌐 API Base URL: ${API_BASE}`);
