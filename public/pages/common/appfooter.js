/// 푸터 로드
import {API_BASE} from "../../api/config.js";

const footer = document.querySelector('.appfooter');

/// 내부 HTML 주입
footer.innerHTML = `
  <div class="footer__inner">
    <a href="${API_BASE}/policy/terms">이용약관</a>
    <span class="divider">|</span>
    <a href="${API_BASE}/policy/privacy">개인정보처리방침</a>
    <span class="divider">|</span>
    <p class="footer__copy">© 2025 개발자 커뮤니티. All rights reserved.</p>
  </div>
`;
