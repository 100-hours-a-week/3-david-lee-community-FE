// ───────────── API ─────────────
import { getTempUrl, confirmTempUrl } from "../api/image.js";

/// 설정
const root = document.getElementById("avatar-uploader");
const circle = document.getElementById("avatarCircle");
const preview = document.getElementById("avatarPreview");
const hiddenKey = document.getElementById("avatarKey");

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

// 업로드 버튼 자체를 클릭 영역으로 사용하고, 미리보기 이미지를 보여줍니다.
// 초기에는 미리보기를 숨기고 원을 보이게 합니다.
function initializeUploader() {
    // 미리보기 이미지가 없을 때는 원형 버튼을 보이게 하고, 있을 때는 숨깁니다.
    const hasImage = hiddenKey.value;
    circle.style.display = hasImage ? 'none' : 'grid';
    preview.style.display = hasImage ? 'block' : 'none';

    // 클릭 리스너를 root에 달아 영역 전체를 버튼으로 사용합니다.
    root.style.cursor = 'pointer';
    root.setAttribute('role', 'button');
    root.setAttribute('tabindex', '0');

    root.addEventListener("click", handlePickAndUpload);
    root.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePickAndUpload();
        }
    });
}


/// 파일 선택 input 동적 생성 (접근성/재사용)
function createFileInput() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED_TYPES.join(",");
    input.style.display = "none";
    document.body.appendChild(input);
    return input;
}

/// 업로드 진행 표시 간단 처리
function setUploading(isUploading) {
    const targetEl = root.querySelector('.avatar-circle, #avatarPreview') || root;
    if (isUploading) {
        targetEl.textContent = "업로드 중...";
        targetEl.setAttribute("aria-busy", "true");
        targetEl.style.opacity = "0.6";
        targetEl.style.pointerEvents = "none";
    } else {
        // 업로드 완료 후에는 textContent를 원래대로 돌리거나 (circle의 경우), busy 상태를 제거합니다.
        circle.textContent = "+";
        circle.removeAttribute("aria-busy");
        preview.removeAttribute("aria-busy");
        targetEl.style.opacity = "1";
        targetEl.style.pointerEvents = "auto";
    }
}

/// 미리보기 세팅
function setPreview(objectUrl) {
    preview.src = objectUrl;
    preview.style.display = "block";
    circle.style.display = "none"; // 미리보기가 생기면 버튼 숨김
}

/// 메인 로직: 파일→pre-signed 발급→S3 PUT→confirm
async function handlePickAndUpload() {
    const fileInput = createFileInput();
    fileInput.addEventListener("change", async () => {
        const file = fileInput.files?.[0];
        fileInput.remove(); // 사용 후 정리

        if (!file) return;

        // 검증
        if (!ACCEPTED_TYPES.includes(file.type)) {
            alert("JPG/PNG/WebP 이미지만 업로드할 수 있습니다.");
            return;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            alert(`파일 용량은 최대 ${MAX_SIZE_MB}MB까지 가능합니다.`);
            return;
        }

        try {
            // *************** 수정: 업로드 시작 시 미리보기 숨기고 원형 버튼을 보이게 함 ***************
            preview.style.display = "none";
            circle.style.display = "grid";
            setUploading(true);

            // 1. 백엔드에 pre-signed URL 발급 요청
            const presign = await getTempUrl({fileName: file.name});
            const uploadUrl = presign.data.preSignedUrl;
            const objectKey = presign.data.key;

            if (!uploadUrl || !objectKey) {
                throw new Error("업로드 URL 또는 키를 받지 못했습니다.");
            }

            // 2. S3에 직접 업로드 (PUT)
            const putHeaders = {"Content-Type": file.type};
            const putRes = await fetch(uploadUrl, {
                method: "PUT",
                headers: putHeaders,
                body: file,
            });

            if (!putRes.ok) {
                const text = await putRes.text().catch(() => "");
                throw new Error(`S3 업로드 실패: ${putRes.status} ${text}`);
            }

            // 3. 업로드 성공 후 서버에 확정 처리
            const fileName = {key: objectKey};
            const confirmRes = await confirmTempUrl(fileName);
            const publicUrl = confirmRes.imageUrl;

            // 4. 업데이트: 미리보기 & hidden input 저장
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);

            hiddenKey.value = objectKey;

            alert("프로필 사진이 업로드되었습니다.");
        } catch (err) {
            console.error(err);
            alert(err?.message || "이미지 업로드 중 오류가 발생했습니다.");
        } finally {
            setUploading(false);
        }
    });

    // 파일 선택창 열기
    fileInput.click();
}

// 초기화 함수 호출
initializeUploader();