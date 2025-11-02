import { getUrls, confirmUrls } from "../api/image.js";

function moveItem(arr, from, to) {
    if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return;
    const [spliced] = arr.splice(from, 1);
    arr.splice(to, 0, spliced);
}

export function createImageGalleryUploader({
                                               listEl,          // 필수: 갤러리 컨테이너(이미지 카드가 append될 요소)
                                               fileInputEl,     // 선택: 파일 input (있으면 change 시 자동 업로드 바인딩)
                                               addMoreBtnEl,    // 선택: "이미지 추가" 버튼 (클릭 시 fileInput 클릭)
                                               maxSizeMB = 5,   // 용량 제한
                                               onError = (msg) => alert(msg),
                                               onToast = async (msg) => alert(msg),
                                           } = {}) {
    if (!listEl) throw new Error("listEl은 필수입니다.");

    let gallery = [];     // [{key, url, isNew}]
    let dragSrcIndex = null;

    // 인덱스 계산
    function indexOfItemEl(target) {
        const items = Array.from(listEl.querySelectorAll(".image-item"));
        return items.indexOf(target.closest(".image-item"));
    }

    // 렌더
    function render() {
        listEl.innerHTML = "";
        gallery.forEach((img, idx) => {
            const wrap = document.createElement("div");
            wrap.className = "image-item";
            wrap.dataset.key = img.key || "";
            wrap.dataset.index = String(idx);
            wrap.draggable = true;

            const handle = document.createElement("div");
            handle.className = "drag-handle";

            const imgtag = document.createElement("img");
            imgtag.src = img.url;
            imgtag.alt = img.key || "image";

            const removeBtn = document.createElement("button");
            removeBtn.className = "remove";
            removeBtn.type = "button";
            removeBtn.textContent = "×";
            removeBtn.addEventListener("click", () => {
                gallery = gallery.filter((x) => x.key !== img.key);
                render();
            });

            const label = document.createElement("div");
            label.className = "label";
            label.textContent = img.key || "";

            // DnD
            wrap.addEventListener("dragstart", (e) => {
                dragSrcIndex = Number(wrap.dataset.index);
                e.dataTransfer.effectAllowed = "move";
            });
            wrap.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                wrap.classList.add("drag-over");
            });
            wrap.addEventListener("dragleave", () => {
                wrap.classList.remove("drag-over");
            });
            wrap.addEventListener("drop", (e) => {
                e.preventDefault();
                wrap.classList.remove("drag-over");
                const toIndex = indexOfItemEl(e.target);
                if (dragSrcIndex != null && toIndex !== -1) {
                    moveItem(gallery, dragSrcIndex, toIndex);
                    dragSrcIndex = null;
                    render();
                }
            });

            wrap.appendChild(handle);
            wrap.appendChild(imgtag);
            wrap.appendChild(removeBtn);
            wrap.appendChild(label);
            listEl.appendChild(wrap);
        });
    }

    // 초기 서버 데이터 세팅
    function setInitial(serverImages = []) {
        // 기대 형태: [{ imageUrl, imageKey, order? }, ...]
        gallery = (Array.isArray(serverImages) ? serverImages : [])
            .filter((it) => !!it?.imageUrl)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((it) => ({
                key: it.imageKey,
                url: it.imageUrl,
                isNew: false,
            }));
        render();
    }

    // 유효 파일 필터
    function filterValid(filesLike) {
        const files = Array.from(filesLike || []);
        const maxBytes = maxSizeMB * 1024 * 1024;

        for (const f of files) {
            if (!f.type.startsWith("image/")) throw new Error("이미지 파일만 업로드 가능합니다.");
            if (f.size > maxBytes) throw new Error(`${maxSizeMB}MB를 초과한 파일이 있습니다.`);
        }
        return files;
    }

    // 업로드
    async function upload(filesLike) {
        const files = filterValid(filesLike);
        if (files.length === 0) return [];

        // 1) presign
        const fileNames = files.map((f) => f.name);
        const presign = await getUrls(fileNames);
        const items = presign?.data ?? [];
        if (!Array.isArray(items) || items.length !== files.length) {
            throw new Error("프리사인드 URL 개수가 파일 수와 다릅니다.");
        }
        const byName = new Map(items.map((it) => [it.fileName, it]));

        // 2) S3 PUT
        const uploaded = [];
        for (const file of files) {
            const it = byName.get(file.name);
            if (!it) throw new Error(`presign 응답에 ${file.name}가 없습니다.`);
            const { preSignedUrl, key } = it;

            const res = await fetch(preSignedUrl, {
                method: "PUT",
                headers: { "Content-Type": file.type },
                body: file,
            });
            if (!res.ok) throw new Error(`S3 업로드 실패: ${file.name}`);

            const localPreview = URL.createObjectURL(file);
            uploaded.push({ key, url: localPreview, isNew: true });
        }

        // 3) confirm
        await confirmUrls(uploaded.map((u) => u.key));

        // 4) append & 렌더
        gallery.push(...uploaded);
        render();

        // file input 초기화(같은 파일 재선택 허용)
        if (fileInputEl) fileInputEl.value = "";

        return uploaded.map((u) => u.key);
    }

    // 외부에서 파일 input change를 바인딩하고 싶으면 fileInputEl 넘기기
    if (fileInputEl) {
        fileInputEl.addEventListener("change", async (e) => {
            try {
                await upload(e.currentTarget.files || []);
            } catch (err) {
                console.error(err);
                onError(err?.message || "이미지 업로드 중 오류가 발생했습니다.");
            }
        });
    }

    if (addMoreBtnEl && fileInputEl) {
        addMoreBtnEl.addEventListener("click", () => fileInputEl.click());
    }

    return {
        // 서버에서 받아온 이미지 세팅
        setInitial,
        // 직접 FileList/Array<File> 업로드
        upload,
        // 현재 순서대로 key 배열 반환
        getKeys: () => gallery.map((g) => g.key),
        // 현재 상태 조회(필요 시)
        getState: () => [...gallery],
        // 강제 렌더
        render,
    };
}
