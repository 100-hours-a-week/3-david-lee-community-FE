/// API
import {getMyPage, updateMyPage, withdraw} from '../api/user.js';

// ───────────── 내부 설정 ─────────────
const emailEl = document.getElementById('email');
const nickNameEl = document.getElementById('nickname');
// 💡 추가: 프로필 이미지 컨테이너 요소
const profileAvatarEl = document.getElementById('profileAvatar');
// 💡 추가: 이미지 변경 버튼
const changeImageBtn = document.getElementById('changeImageBtn');

// 💡 수정 로직에 사용할 현재 이미지 URL 변수 (전역에서 관리)
let currentImageUrl = null;

// ───────────── 기존 값 호출 (이미지 출력 포함) ─────────────
(async function preload() {

    try {
        const d = await getMyPage(); // 서버에서 최신 데이터 가져옴
        const userData = d.data;

        emailEl.value = userData.email;
        nickNameEl.value = userData.nickname;

        // 💡 프로필 이미지 초기 설정
        if (userData.imageUrl && profileAvatarEl) {
            currentImageUrl = userData.imageUrl; // 현재 이미지 URL 저장
            profileAvatarEl.style.backgroundImage = `url('${currentImageUrl}')`;
        }

    } catch (e) {
        console.error(e);
        alert(e?.message || '기존 내용을 불러오지 못했습니다.');
    }
})();

// ───────────── 이미지 변경 로직 (더미) ─────────────
if (changeImageBtn) {
    changeImageBtn.addEventListener('click', () => {
        alert("이미지 변경 기능은 아직 구현되지 않았습니다. (파일 업로드 및 미리보기 로직 필요)");
        // TODO: <input type="file"> 요소를 숨겨서 클릭하고,
        // 선택된 파일을 읽어 미리보기를 업데이트하고,
        // 서버에 업로드 후 currentImageUrl을 업데이트하는 로직이 필요합니다.

        // 임시로 기본 이미지 URL로 변경하는 예시
        // currentImageUrl = 'https://example.com/new-default-avatar.png';
        // profileAvatarEl.style.backgroundImage = `url('${currentImageUrl}')`;
    });
}


// ───────────── 수정 로직 ─────────────
document.getElementById('accountForm').addEventListener('submit', async (e) => {

    /// 동작 막기
    e.preventDefault();

    /// 수정해야하는 값
    const nickname = nickNameEl.value;
    // 💡 저장된 currentImageUrl 값을 payload에 포함하여 전송 (이미지 미변경 시 기존 이미지 유지)
    const imageUrl = currentImageUrl;

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