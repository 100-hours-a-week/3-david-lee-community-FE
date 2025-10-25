/// 푸터 로드
const footer = document.querySelector('.appfooter');

/// 내부 HTML 주입
footer.innerHTML = `
  <div class="footer__inner">
    <a href="http://localhost:8080/v1/policy/terms">이용약관</a>
    <span class="divider">|</span>
    <a href="http://localhost:8080/v1/policy/privacy">개인정보처리방침</a>
    <span class="divider">|</span>
    <p class="footer__copy">© 2025 아무 말 대잔치. All rights reserved.</p>
  </div>
`;
