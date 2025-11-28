// ───────────── API ─────────────
import { logout as apiLogout } from '../api/auth.js';

/// 인증 정보 전부 삭제하기
function clearAuthentication() {
    try {
        localStorage.removeItem('accessToken');
        sessionStorage.clear();
    } catch {}
}

/// 로그아웃
export function attachLogout(
    selector = '#logoutLink',
    {
        onBefore = () => {},
        onAfter = () => {},
        redirectTo = '/',
        clear = clearAuthentication,
        textDuring = '로그아웃 중...',
        // 목적지에서 ?toast=logout 을 읽어 토스트 띄우도록
        toastQuery = 'logout',
    } = {}
) {
    const el = document.querySelector(selector);
    if (!el) return () => {};

    // ✅ 중복 바인딩 방지
    if (el.dataset.logoutBound === '1') return () => {};
    el.dataset.logoutBound = '1';

    const onClick = async (e) => {
        e.preventDefault();

        // ✅ 연속 클릭/중복 실행 방지
        if (el.dataset.busy === '1') return;
        el.dataset.busy = '1';

        onBefore?.();

        const original = el.textContent;
        el.textContent = textDuring;
        el.style.pointerEvents = 'none';

        try {
            await apiLogout?.();
            clear?.();

            // ✅ redirect 후 목적지에서 토스트 띄우기
            const url = new URL(redirectTo, location.origin);
            if (toastQuery) url.searchParams.set('toast', toastQuery);

            // alert 대신 다음 화면에서 토스트 표시
            location.href = url.toString();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                '로그아웃 중 오류가 발생했습니다.';
            alert(msg);
        } finally {
            // 리다이렉트되면 어차피 의미 없지만, 혹시 실패 케이스 대비 복구
            el.textContent = original;
            el.style.pointerEvents = '';
            delete el.dataset.busy;
            onAfter?.();
        }
    };

    el.addEventListener('click', onClick);

    // 해제 함수 반환
    return () => {
        el.removeEventListener('click', onClick);
        delete el.dataset.logoutBound;
        delete el.dataset.busy;
    };
}
