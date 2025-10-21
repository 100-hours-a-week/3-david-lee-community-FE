import { logout as apiLogout } from '../api/auth.js';

export function attachLogout(
    selector = '#logoutLink',
    {
        onBefore = () => {},
        onAfter = () => {},
        redirectTo = '/pages/html/login.html',
        clear = defaultClearClientSide,
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
            await apiLogout?.();
            clear();

            /// 팝업
            alert('로그아웃이 완료되었습니다.');

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

/// 다 지우기, 쿠키는 서버에서 다시 보내준다.
function defaultClearClientSide() {
    try {
        localStorage.removeItem('accessToken');
        sessionStorage.clear();
    } catch {}
}