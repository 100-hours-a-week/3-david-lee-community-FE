/// 로그아웃 가져오기
import { attachLogout } from "../../js/logout.js";
import { getMyPage } from "../../api/user.js";
import {showToast} from "./toast.js";

/// 헤더 컨테이너
const header = document.querySelector(".appbar");

// 헤더가 있을 때만 마크업 삽입
if (header) {
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
  `;
}

/// 초기화
export async function initAppBar({
                                     avatarSelector = "#avatarBtn",
                                     menuSelector = "#menu",
                                     openClass = "is-open",
                                 } = {}) {
    // ──────────────────────────────
    // 1) 주요 노드 캐싱 (맨 위로 모으기)
    // ──────────────────────────────
    const avatarBtn = document.querySelector(avatarSelector);
    const menu = document.querySelector(menuSelector);
    const logoutLink = document.querySelector("#logoutLink");

    // 앱바가 없는 페이지면 조용히 종료
    if (!avatarBtn || !menu) {
        return { open() {}, close() {}, destroy() {} };
    }

    // 중복 init 방지
    if (avatarBtn.dataset.appbarBound === "1") {
        return { open() {}, close() {}, destroy() {} };
    }
    avatarBtn.dataset.appbarBound = "1";

    // ──────────────────────────────
    // 2) 프로필 이미지 비동기 주입
    // ──────────────────────────────
    try {
        const res = await getMyPage();
        const imageUrl = res?.data?.imageUrl;
        if (imageUrl) {
            avatarBtn.style.backgroundImage = `url('${imageUrl}')`;
            avatarBtn.style.backgroundSize = "cover";
            avatarBtn.style.backgroundPosition = "center";
            avatarBtn.style.backgroundRepeat = "no-repeat";
        }
    } catch (err) {
        await showToast("프로필 이미지 로드 오류");
    }

    // ──────────────────────────────
    // 3) 접근성 속성
    // ──────────────────────────────
    avatarBtn.setAttribute("role", "button");
    avatarBtn.setAttribute("aria-haspopup", "menu");
    avatarBtn.setAttribute("aria-expanded", "false");

    // ──────────────────────────────
    // 4) 열고/닫기 핸들러 (캐싱된 노드만 사용)
    // ──────────────────────────────
    const open = () => {
        menu.classList.add(openClass);
        avatarBtn.setAttribute("aria-expanded", "true");
    };
    const close = () => {
        menu.classList.remove(openClass);
        avatarBtn.setAttribute("aria-expanded", "false");
    };
    const toggle = () => (menu.classList.contains(openClass) ? close() : open());

    // 이벤트 핸들러
    const onAvatarClick = (e) => {
        e.stopPropagation();
        toggle();
    };
    const onDocClick = (e) => {
        if (!menu.contains(e.target) && !avatarBtn.contains(e.target)) close();
    };
    const onKey = (e) => {
        if (e.key === "Escape") close();
    };

    // ──────────────────────────────
    // 5) 이벤트 바인딩
    // ──────────────────────────────
    avatarBtn.addEventListener("click", onAvatarClick);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);

    const destroy = () => {
        avatarBtn.removeEventListener("click", onAvatarClick);
        document.removeEventListener("click", onDocClick);
        document.removeEventListener("keydown", onKey);
        delete avatarBtn.dataset.appbarBound;
    };

    // ──────────────────────────────
    // 6) 로그아웃 연결 (캐싱된 노드 사용)
    // ──────────────────────────────
    if (logoutLink) attachLogout("#logoutLink");

    return { open, close, destroy, menu, avatarBtn };
}

// 자동 실행 (헤더가 있을 때만)
if (header) {
    initAppBar();
}
