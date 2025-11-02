const NAMESPACE = 'ktb';
const ACCESS_KEY = `${NAMESPACE}:accessToken`;

// 로컬스토리지 사용 가능 여부 체크 + 메모리 폴백
let _memory = {};
function safeStorage() {
    try {
        const testKey = '__test';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return localStorage;
    } catch {
        return {
            getItem: k => _memory[k] ?? null,
            setItem: (k, v) => { _memory[k] = String(v); },
            removeItem: k => { delete _memory[k]; },
        };
    }
}
const storage = safeStorage();

/** JWT payload 디코딩 (Base64URL) */
function decodeJwtPayload(token) {
    try {
        const payload = token.split('.')[1];
        const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(b64).split('').map(c => '%' + ('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function isExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.exp) {
        return false;
    } // exp 없으면 만료 판정 안함
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec;
}

export const tokenStorage = {
    get() {
        const t = storage.getItem(ACCESS_KEY);
        if (!t) return null;
        if (isExpired(t)) {
            // 만료 시 자동 제거
            storage.removeItem(ACCESS_KEY);
            return null;
        }
        return t;
    },
    set(token) {
        if (!token) return this.remove();
        storage.setItem(ACCESS_KEY, token);
        // 탭 간 동기화를 위해 커스텀 이벤트 발행 (옵션)
        window.dispatchEvent(new CustomEvent('access-token-changed', { detail: token }));
    },
    remove() {
        storage.removeItem(ACCESS_KEY);
        window.dispatchEvent(new CustomEvent('access-token-changed', { detail: null }));
    },
    // 탭 간 동기화 리스너 (선택)
    onChange(handler) {
        window.addEventListener('storage', (e) => {
            if (e.key === ACCESS_KEY) handler(e.newValue);
        });
        window.addEventListener('access-token-changed', (e) => handler(e.detail));
    }
};