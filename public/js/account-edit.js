/// API
import {getMyPage, updateMyPage, withdraw} from '../api/user.js';
import {getUrls, confirmUrls} from "../api/image.js";

// ───────────── 내부 설정 ─────────────
const emailEl = document.getElementById('email');
const nickNameEl = document.getElementById('nickname');
//  프로필 이미지 컨테이너 요소
const profileAvatarEl = document.getElementById('profileAvatar');
// 이미지 변경 버튼
const changeImageBtn = document.getElementById('changeImageBtn');

// 이미지 URL 변수
let currentImageKey = null;
let currentImageUrl = null;

// 이미지 미리보기 적용
function setAvatarPreview(url) {
    const avatar = $('#profileAvatar');
    if (!avatar) return;

    if (url) {
        avatar.style.backgroundImage = `url("${url}")`;
    } else {
        avatar.style.backgroundImage = '';
    }
}

// ───────────── 기존 값 호출 (이미지 출력 포함) ─────────────
(async function preload() {

    try {
        const d = await getMyPage(); // 서버에서 최신 데이터 가져옴
        const userData = d.data;

        emailEl.value = userData.email;
        nickNameEl.value = userData.nickname;

        // 프로필 이미지 초기 설정
        if (userData.imageUrl && profileAvatarEl) {

            // 현재 이미지 URL 저장
            currentImageUrl = userData.imageUrl;
            profileAvatarEl.style.backgroundImage = `url('${currentImageUrl}')`;
        }

    } catch (e) {
        console.error(e);
        alert(e?.message || '기존 내용을 불러오지 못했습니다.');
    }
})();

// ──────────────────────────  파일 선택기 열기 ──────────────────────────
function pickImageFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => resolve(input.files?.[0] || null);
        input.click();
    });
}

// ────────────────────────── Presigned URL 일반 PUT 업로드 ──────────────────────────
async function uploadByPresignedPut(uploadUrl, file) {

    const putHeaders = {"Content-Type": file.type};
    const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: putHeaders,
        body: file,
    });
    if (!putRes.ok) {
        throw new Error(`S3 업로드 실패: ${file.name}`);
    }
}

// ────────────────────────── 이미지 변경 ──────────────────────────
$('#changeImageBtn')?.addEventListener('click', async () => {
    try {
        const file = await pickImageFile();
        if (!file) {
            return;
        }

        // 간단 검증 (필요시 크기/확장자 제한 추가)
        if (file.size > 10 * 1024 * 1024) {
            alert('이미지 크기가 너무 큽니다. (최대 10MB)');
            return;
        }

        // 업로드 URL 발급
        // 프로젝트 응답 형태에 유연하게 대응 (uploads[0] / [0] / 단일 객체 등)
        const issue = await getUrls([file.name]);
        const first =
            (Array.isArray(issue) && issue[0]) ||
            issue?.uploads?.[0] ||
            issue;

        console.log(first);

        // 응답 케이스들 커버: uploadUrl|url, key 필수
        const uploadUrl = first.preSignedUrl || first.url;
        const fileKey = first.key;

        if (!uploadUrl || !fileKey) {
            throw new Error('업로드 URL 또는 key가 응답에 없습니다.');
        }

        // S3 Presigned URL로 업로드
        await uploadByPresignedPut(uploadUrl, file);

        // 사용 확정
        await confirmUrls([fileKey]);

        // 미리보기 & 상태 갱신
        const localPreviewUrl = URL.createObjectURL(file);
        setAvatarPreview(localPreviewUrl);

        currentImageKey = fileKey;
    } catch (e) {
        console.error(e);
        alert(e?.message || '이미지 변경 중 오류가 발생했습니다.');
    }
});


// ───────────── 수정 로직 ─────────────
document.getElementById('accountForm').addEventListener('submit', async (e) => {

    /// 동작 막기
    e.preventDefault();

    /// 수정해야하는 값
    const nickname = nickNameEl.value;
    const imageKey = currentImageUrl;

    if (!nickname) {
        alert('닉네임을 입력하세요.');
        return;
    }

    /// 값
    const payload = {nickname, imageUrl: imageKey};

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