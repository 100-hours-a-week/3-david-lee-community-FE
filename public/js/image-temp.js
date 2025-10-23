/// API
import { getTempUrl, confirmTempUrl } from "../api/image.js";

/// 설정
const root = document.getElementById("avatar-uploader");
const circle = document.getElementById("avatarCircle");
const preview = document.getElementById("avatarPreview");
const hiddenKey = document.getElementById("avatarKey");

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

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
    if (isUploading) {
        circle.textContent = "업로드 중…";
        circle.setAttribute("aria-busy", "true");
        circle.style.opacity = "0.6";
        circle.style.pointerEvents = "none";
    } else {
        circle.textContent = "+";
        circle.removeAttribute("aria-busy");
        circle.style.opacity = "1";
        circle.style.pointerEvents = "auto";
    }
}

/// 미리보기 세팅
function setPreview(objectUrl) {
    preview.src = objectUrl;
    preview.style.display = "block";
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
            setUploading(true);

            // 백엔드에 pre-signed URL 발급 요청
            const presign = await getTempUrl({fileName: file.name});

            console.log(presign.data);

            const uploadUrl = presign.data.preSignedUrl; // S3에 PUT할 URL
            const objectKey = presign.data.key;       // 서버가 부여한 고유 key

            if (!uploadUrl || !objectKey) {
                throw new Error("업로드 URL 또는 키를 받지 못했습니다.");
            }

            /// S3에 직접 업로드 (PUT)
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

            // 업로드 성공 후 서버에 확정 처리
            const fileName = {key: objectKey};
            console.log(fileName);

            const confirmRes = await confirmTempUrl(fileName);
            console.log(confirmRes);

            const publicUrl = confirmRes.imageUrl;

            // 업데이트: 미리보기 & hidden input 저장
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);

            hiddenKey.value = objectKey;
            if (publicUrl) {
                hiddenUrl.value = publicUrl;
            }

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

/// 클릭/키보드 접근성
circle.addEventListener("click", handlePickAndUpload);
circle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePickAndUpload();
    }
});
