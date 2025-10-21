/// API
import {getMyPage, updateMyPage, withdraw} from '../api/user.js';

// ───────────── 내부 설정 ─────────────
const emailEl = document.getElementById('email');
const nickNameEl = document.getElementById('nickname');

// ───────────── 기존 값 호출 ─────────────
(async function preload() {

    try {
        const d = await getMyPage(); // 서버에서 최신 데이터 가져옴
        emailEl.value = d.data.email;
        nickNameEl.value = d.data.nickname;

    } catch (e) {
        console.error(e);
        alert(e?.message || '기존 내용을 불러오지 못했습니다.');
    }
})();

// ───────────── 수정 로직 ─────────────
document.getElementById('accountForm').addEventListener('submit', async (e) => {

    /// 동작 막기
    e.preventDefault();

    /// 수정해야하는 값
    const nickname = nickNameEl.value;
    const imageUrl = null;

    if (!nickname) {
        alert('닉네임을 입력하세요.');
        return;
    }

    /// 값
    const payload = {nickname, imageUrl};

    // 버튼 요소 참조
    const submitBtn = e.target.querySelector('.btn--primary');
    submitBtn.disabled = true; // 중복 클릭 방지
    submitBtn.textContent = '수정 중...';

    try {
        await updateMyPage(payload); // 비동기 대기

        // 성공 시 버튼 텍스트 변경
        alert("정상적으로 수정되었습니다.");

        submitBtn.textContent = '수정완료';

    } catch (err) {
        console.error(err);
        alert('수정 실패: ' + (err?.message || ''));
        submitBtn.textContent = '수정하기'; // 실패 시 원복
    } finally {
        submitBtn.disabled = false;
    }
});

// ───────────── 탈퇴 로직 ─────────────
document.getElementById('withdrawBtn').addEventListener('click', ()=>{

    /// 탈퇴한다면 홈으로 리다이렉트
    if(confirm('정말 탈퇴하시겠습니까?')){
        withdraw();
        location.href = '/pages/html/login.html';
    }

});