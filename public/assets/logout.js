import { logout as apiLogout } from '../api/auth.js';

export function attachLogout(
    selector = '#logoutLink',
    {
        onBefore = () => {},
        onAfter = () => {},
        redirectTo = '/pages/html/login.html',
        clear = defaultClearClientSide,    // 기본 클린업
        textDuring = '로그아웃 중...',
    } = {}
) {
    const el = document.querySelector(selector);
    if (!el) return () => {};

    const onClick = async (e) => {
        e.preventDefault();
        onBefore();

        const original = el.textContent;
        el.textContent = textDuring;
        el.style.pointerEvents = 'none';

        try {
            await apiLogout?.(); // 서버에 세션/리프레시 정리 (withCredentials 필요 시 설정)
            clear();
            location.href = redirectTo;
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || '로그아웃 중 오류가 발생했습니다.';
            alert(msg);
        } finally {
            el.textContent = original;
            el.style.pointerEvents = '';
            onAfter();
        }
    };

    el.addEventListener('click', onClick);

    // 해제 함수 반환
    return () => el.removeEventListener('click', onClick);
}

function defaultClearClientSide() {
    try {
        localStorage.removeItem('accessToken');
        sessionStorage.clear();
        document.cookie = 'refresh_token=; Max-Age=0; path=/;';
    } catch {}
}