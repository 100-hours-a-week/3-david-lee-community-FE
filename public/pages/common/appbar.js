/// 로그아웃 가져오기
import {attachLogout} from "../../js/logout.js";
import {getMyPage} from "../../api/user.js";

/// 헤더 값 가져오기
const header = document.querySelector('.appbar');

/// 내부에 HTML 넣기
header.innerHTML = `
<div class="appbar__inner">
        <a class="appbar__back" href="/pages/html/post-list.html" aria-label="뒤로가기">← 뒤로</a>
        <strong class="appbar__title">아무 말 대잔치</strong>
        <div class="appbar__avatar" id="avatarBtn" title="프로필"></div>
        <nav class="menu" id="menu">
            <a href="/pages/html/account-edit.html">회원정보수정</a>
            <a href="/pages/html/account-password.html">비밀번호수정</a>
            <a href="/pages/html/login.html" id="logoutLink">로그아웃</a>
        </nav>
    </div>
`

export async function initAppBar({
                               avatarSelector = '#avatarBtn',
                               menuSelector = '#menu',
                               openClass = 'is-open',
                           } = {}) {

    /// 아바타 이미지 넣기
    try {
        const res = await getMyPage();

        console.log(res.data.imageUrl);

        const avatarDiv = document.getElementById('avatarBtn');
        const imageUrl = res.data.imageUrl;

        if (avatarDiv) {
            avatarDiv.style.backgroundImage = `url('${imageUrl}')`;
        }

    } catch(err) {
        console.log(err);

    }

    if (!avatarBtn || !menu) {
        // 페이지마다 앱바가 없을 수 있으므로 조용히 no-op
        return { open(){}, close(){}, destroy(){} };
    }

    // 접근성 속성
    avatarBtn.setAttribute('role', 'button');
    avatarBtn.setAttribute('aria-haspopup', 'menu');
    avatarBtn.setAttribute('aria-expanded', 'false');

    /// 토글 열고 닫기
    const open = () => {
        menu.classList.add(openClass);
        avatarBtn.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
        menu.classList.remove(openClass);
        avatarBtn.setAttribute('aria-expanded', 'false');
    };
    const toggle = () => (menu.classList.contains(openClass) ? close() : open());

    // 아바타 선택 시
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

/// 창 실행
initAppBar();

/// 로그아웃 실행
// 메뉴 안의 로그아웃 링크
attachLogout('#logoutLink');