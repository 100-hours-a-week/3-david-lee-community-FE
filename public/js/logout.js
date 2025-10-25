// ───────────── API ─────────────
import { logout as apiLogout } from '../api/auth.js';

/// 로그아웃
export function attachLogout(

    /// 로그아웃 링크 선택
    selector = '#logoutLink',
    {
        onBefore = () => {},
        onAfter = () => {},
        redirectTo = '/pages/html/login.html',
        clear = clearAuthentication,
        textDuring = '로그아웃 중...',
    } = {}
) {

    /// 컴포넌트 선택
    const el = document.querySelector(selector);
    if (!el) {
        return () => {};
    }

    /// 클릭할 경우
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

/// 인증 정보 전부 삭제하기
function clearAuthentication() {
    try {
        localStorage.removeItem('accessToken');
        sessionStorage.clear();
    } catch {}
}