/// API
import { getMyPage, updateMyPage, withdraw } from '../api/user.js';
import { getUrls, confirmUrls } from "../api/image.js";

// ───────────── 헬퍼/DOM ─────────────
const $ = (sel) => document.querySelector(sel);

const emailEl = $('#email');
const nickNameEl = $('#nickname');
const profileAvatarEl = $('#profileAvatar');
const changeImageBtn = $('#changeImageBtn');

// 이미지 상태 일원화
const imageState = {
    changed: false,     // 업로드로 이미지가 바뀌었는지
    imageKey: null,     // 서버가 발급한 key (서버가 key를 받는 계약이면 이걸 보냄)
    finalUrl: null,     // 확정 후 접근 URL(서버가 URL을 받는 계약이면 이걸 보냄)
    previewUrl: null,   // ObjectURL(미리보기용)
    originalUrl: null,  // 최초 마이페이지의 기존 URL
};

// 미리보기 적용/정리
function setAvatarPreview(url) {
    if (!profileAvatarEl) return;

    if (imageState.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageState.previewUrl);
    }
    imageState.previewUrl = url || null;
    profileAvatarEl.style.backgroundImage = url ? `url("${url}")` : '';
}

// ───────────── 기존 값 호출 (이미지 출력 포함) ─────────────
(async function preload() {
    try {
        const d = await getMyPage(); // 서버에서 최신 데이터
        const user = d.data || {};

        emailEl.value = user.email || '';
        nickNameEl.value = user.nickname || '';

        if (user.imageUrl && profileAvatarEl) {
            imageState.originalUrl = user.imageUrl;
            profileAvatarEl.style.backgroundImage = `url("${user.imageUrl}")`;
        }
    } catch (e) {
        console.error(e);
        alert(e?.message || '기존 내용을 불러오지 못했습니다.');
    }
})();

// ────────────────────────── 파일 선택기 ──────────────────────────
function pickImageFile() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = () => resolve(input.files?.[0] || null);
        input.click();
    });
}

// ────────────────────────── Presigned URL PUT 업로드 ──────────────────────────
async function uploadByPresignedPut(uploadUrl, file) {
    const headers = file.type ? { 'Content-Type': file.type } : undefined;

    const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: file,
    });
    if (!res.ok) throw new Error(`S3 업로드 실패: ${file.name}`);
}

// ────────────────────────── 이미지 변경 ──────────────────────────
changeImageBtn?.addEventListener('click', async () => {
    try {
        const file = await pickImageFile();
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('이미지 크기가 너무 큽니다. (최대 10MB)');
            return;
        }

        // 업로드 URL/키 발급 (여러 형태 지원)
        const issued = await getUrls([file.name]);

        const first =
            (Array.isArray(issued) && issued[0]) ||
            issued?.data?.[0] ||
            issued;

        const uploadUrl = first.preSignedUrl;
        const fileKey = first.key;

        if (!uploadUrl || !fileKey) {
            throw new Error('업로드 URL 또는 key가 응답에 없습니다.');
        }

        // S3 업로드
        await uploadByPresignedPut(uploadUrl, file);

        // 사용 확정(확정 후 최종 URL을 리턴하는 구현도 존재)
        const confirmed = await confirmUrls([fileKey]);

        console.log(confirmed.data[0]);

        const confirmedFirst =
            (Array.isArray(confirmed) && confirmed[0]) ||
            confirmed?.data?.[0] ||
            confirmed;

        const confirmedUrl = confirmedFirst?.imageUrl;

        // 상태 갱신
        imageState.changed = true;
        imageState.imageKey = fileKey;
        imageState.finalUrl = confirmedUrl;

        // 미리보기(있으면 서버 URL, 없으면 로컬 ObjectURL)
        const preview = confirmedUrl || URL.createObjectURL(file);
        setAvatarPreview(preview);
    } catch (e) {
        console.error(e);
        alert(e?.message || '이미지 변경 중 오류가 발생했습니다.');
    }
});

// ───────────── 수정 로직 ─────────────
document.getElementById('accountForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const nickname = nickNameEl.value?.trim();
    if (!nickname) {
        alert('닉네임을 입력하세요.');
        return;
    }
    const imageKey = imageState.imageKey;

    const payload = {
        nickname,
        imageKey: imageKey ?? null,
    };

    // 버튼 상태
    const submitBtn = e.target.querySelector('.btn--primary');
    const oldText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '수정 중...';

    try {
        await updateMyPage(payload);
        alert('정상적으로 수정되었습니다.');
        submitBtn.textContent = '수정완료';

        // 성공 시 원본 상태 동기화
        if (imageState.changed) {
            imageState.originalUrl = imageState.finalUrl || imageState.originalUrl;
            imageState.changed = false;
        }
    } catch (err) {
        console.error(err);
        alert('수정 실패: ' + (err?.message || ''));
        submitBtn.textContent = oldText;
    } finally {
        submitBtn.disabled = false;
    }
});

// ───────────── 탈퇴 로직 ─────────────
document.getElementById('withdrawBtn').addEventListener('click', () => {
    if (confirm('정말 탈퇴하시겠습니까?')) {
        withdraw();
        location.href = '/pages/html/login.html';
    }
});

// 페이지 이탈 시 미리보기 ObjectURL 정리
window.addEventListener('beforeunload', () => {
    if (imageState.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(imageState.previewUrl);
    }
});
