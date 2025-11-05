// 전역 __ENV__를 읽어서 상수 제공
export const API_BASE = `${location.protocol}//${location.hostname}:8080/v1`;

export const AUTH_URL = `${API_BASE}/auth`;
export const USER_URL = `${API_BASE}/users`;
export const POLICY_URL = `http://3.38.66.186:8080/v1/policy`;
export const POST_URL = `${API_BASE}/posts`;
export const LIKE_URL = `${API_BASE}/posts/likes`;
export const IMAGE_URL = `${API_BASE}/images`;
export const COMMENT_URL = `${API_BASE}/comments`;
