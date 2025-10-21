export function initAppBar({
                               avatarSelector = '#avatarBtn',
                               menuSelector = '#menu',
                               openClass = 'is-open',
                           } = {}) {
    const avatarBtn = document.querySelector(avatarSelector);
    const menu = document.querySelector(menuSelector);

    if (!avatarBtn || !menu) {
        // 페이지마다 앱바가 없을 수 있으므로 조용히 no-op
        return { open(){}, close(){}, destroy(){} };
    }

    // 접근성 속성
    avatarBtn.setAttribute('role', 'button');
    avatarBtn.setAttribute('aria-haspopup', 'menu');
    avatarBtn.setAttribute('aria-expanded', 'false');

    const open = () => {
        menu.classList.add(openClass);
        avatarBtn.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
        menu.classList.remove(openClass);
        avatarBtn.setAttribute('aria-expanded', 'false');
    };
    const toggle = () => (menu.classList.contains(openClass) ? close() : open());

    // 이벤트
    const onAvatarClick = (e) => {
        e.stopPropagation();
        toggle();
    };
    const onDocClick = (e) => {
        if (!menu.contains(e.target) && !avatarBtn.contains(e.target)) close();
    };
    const onKey = (e) => {
        if (e.key === 'Escape') close();
    };

    avatarBtn.addEventListener('click', onAvatarClick);
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);

    const destroy = () => {
        avatarBtn.removeEventListener('click', onAvatarClick);
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onKey);
    };

    return { open, close, destroy, menu, avatarBtn };
}