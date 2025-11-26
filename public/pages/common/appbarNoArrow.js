/// 로그아웃 가져오기
import {attachLogout} from "../../js/logout.js";
import {initAppBar} from "./appbar.js";

/// 헤더 값 가져오기
const header = document.querySelector('.appbar');

/// 내부에 HTML 넣기
header.innerHTML = `
<div class="appbar__inner">
        <div class="appbar__title">
            <span class="appbar__logo-icon">&lt;/&gt;</span>
            <span class="appbar__logo-text">개발자 커뮤니티</span>
        </div>
        <div class="appbar__avatar" id="avatarBtn" title="프로필"></div>
        <nav class="menu" id="menu">
            <a href="/pages/html/account-edit.html">회원정보수정</a>
            <a href="/pages/html/account-password.html">비밀번호수정</a>
            <a href="/pages/html/login.html" id="logoutLink">로그아웃</a>
        </nav>
    </div>
`

/// 창 실행
initAppBar();


/// 로그아웃 실행
attachLogout('#logoutLink');        // 메뉴 안의 로그아웃 링크