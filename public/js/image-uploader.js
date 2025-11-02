// ───────────── API ─────────────
import { getUrls, confirmUrls } from "../api/image.js";

// 사용자가 파일 선택
export function pickImageFile(accept = "image/*") {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.onchange = () => resolve(input.files?.[0] || null);
        input.click();
    });
}

// 이름/타입/용량 필터링
export function filterValidImages(files, maxMB = 10) {
    const maxBytes = maxMB * 1024 * 1024;
    return files.filter(
        (f) =>
            !!f &&
            !!f.name &&
            f.name !== "null" &&
            f.type?.startsWith("image/") &&
            f.size <= maxBytes
    );
}

// 파일 이름 배열 → presign 결과 배열
async function requestPresigned(fileNames) {
    const presign = await getUrls(fileNames);
    const items = presign?.data ?? [];

    if (!Array.isArray(items) || items.length !== fileNames.length) {
        throw new Error("프리사인드 URL 개수가 파일 수와 다릅니다.");
    }

    // 응답 검증 + URL 따옴표 이중포장 제거
    items.forEach((it, idx) => {
        if (!it || typeof it.fileName !== "string") {
            throw new Error(`presign 응답 형식 오류 (index ${idx}, fileName 누락)`);
        }
        if (!it.preSignedUrl || typeof it.preSignedUrl !== "string") {
            throw new Error(`presign 응답 형식 오류 (index ${idx}, preSignedUrl 누락)`);
        }
        if (!it.key || it.key === "null" || it.key === null) {
            throw new Error(`presign 응답 key가 null입니다. (fileName=${it.fileName})`);
        }
        if (/^".*"$/.test(it.preSignedUrl)) {
            it.preSignedUrl = it.preSignedUrl.slice(1, -1);
        }
    });

    return items;
}

// S3 PUT 업로드 (단일 파일)
async function putToS3(preSignedUrl, file) {
    const res = await fetch(preSignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
    });
    if (!res.ok) throw new Error(`S3 업로드 실패: ${file.name}`);
}

// 다중 파일 업로드 → 업로드된 key 배열 반환
export async function uploadImagesAndGetKeys(files) {
    if (!Array.isArray(files) || files.length === 0) return [];

    // 1) presign
    const fileNames = files.map((f) => f.name);
    const items = await requestPresigned(fileNames);

    // 2) fileName → presign item 맵
    const mapByName = new Map(items.map((it) => [it.fileName, it]));
    const uploadedKeys = [];

    // 3) S3 PUT 업로드
    for (const file of files) {
        const item = mapByName.get(file.name);
        if (!item) {
            throw new Error(`presign 응답에 ${file.name}가 없습니다. (서버가 파일명을 변경했을 수 있음)`);
        }

        await putToS3(item.preSignedUrl, file);

        if (item.key && item.key !== "null") {
            uploadedKeys.push(item.key);
        } else {
            throw new Error(`업로드 키가 null 처리되어 제외됨: ${file.name}`);
        }
    }

    if (uploadedKeys.length === 0) {
        throw new Error("유효한 업로드 키가 없습니다.");
    }

    // 4) confirm
    await confirmUrls(uploadedKeys);

    return uploadedKeys;
}

// 파일 인풋과 파일명 라벨을 연결하는 유틸
export function bindFileNameLabel(fileInputEl, labelEl) {
    if (!fileInputEl || !labelEl) return;
    fileInputEl.addEventListener("change", () => {
        const files = Array.from(fileInputEl.files || []);
        if (files.length === 0) {
            labelEl.textContent = "파일을 선택해주세요.";
        } else if (files.length === 1) {
            labelEl.textContent = files[0].name;
        } else {
            labelEl.textContent = `${files[0].name} 외 ${files.length - 1}개`;
        }
    });
}
