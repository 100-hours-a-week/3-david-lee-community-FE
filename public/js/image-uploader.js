import { getUrls, confirmUrls } from "../api/image.js";
import { showToast } from "../pages/common/toast.js";

function moveItem(arr, from, to) {
    if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return;
    const [spliced] = arr.splice(from, 1);
    arr.splice(to, 0, spliced);
}

export function createImageGalleryUploader({
                                               listEl,          // 필수
                                               fileInputEl,     // 선택
                                               maxSizeMB = 5,
                                               maxImages = 10,  // 최대 이미지 개수
                                               onError  = (msg) => alert(msg),
                                               onToast  = async (msg) => showToast(msg),
                                               onUploadStart = () => {},
                                               onUploadEnd   = () => {},
                                           } = {}) {
    if (!listEl) throw new Error("listEl은 필수입니다.");

    let gallery = [];     // [{key, url, isNew}]
    let dragSrcIndex = null;

    function indexOfItemEl(target) {
        const items = Array.from(listEl.querySelectorAll(".image-item"));
        return items.indexOf(target.closest(".image-item"));
    }

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

            wrap.append(handle, imgtag, removeBtn, label);
            listEl.appendChild(wrap);
        });
    }

    function setInitial(serverImages = []) {
        gallery = (Array.isArray(serverImages) ? serverImages : [])
            .filter((it) => !!it?.imageUrl)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((it) => ({ key: it.imageKey, url: it.imageUrl, isNew: false }));
        render();
    }

    function filterValid(filesLike) {
        const files = Array.from(filesLike || []);
        const maxBytes = maxSizeMB * 1024 * 1024;
        for (const f of files) {
            if (!f.type.startsWith("image/")) throw new Error("이미지 파일만 업로드 가능합니다.");
            if (f.size > maxBytes) throw new Error(`${maxSizeMB}MB를 초과한 파일이 있습니다.`);
        }
        return files;
    }

    // 업로드 상태 노출(원하면 밖에서 읽을 수 있게)
    let isUploading = false;

    async function upload(filesLike) {
        const files = filterValid(filesLike);
        if (files.length === 0) return [];

        // 이미지 개수 제한 체크
        const currentCount = gallery.length;
        const newCount = currentCount + files.length;
        if (newCount > maxImages) {
            await onToast(`이미지는 최대 ${maxImages}개까지 업로드할 수 있습니다. (현재: ${currentCount}개)`);
            return [];
        }

        // 로딩 시작
        isUploading = true;
        onUploadStart();

        try {
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

            if (fileInputEl) fileInputEl.value = "";

            return uploaded.map((u) => u.key);
        } catch (err) {
            console.error(err);
            onError(err?.message || "이미지 업로드 중 오류가 발생했습니다.");
            throw err;
        } finally {
            isUploading = false;
            onUploadEnd();
        }
    }

    if (fileInputEl) {
        fileInputEl.addEventListener("change", async (e) => {
            try {
                await upload(e.currentTarget.files || []);
            } catch (_) {}
        });
    }

    return {
        setInitial,
        upload,
        getKeys:  () => gallery.map((g) => g.key),
        getState: () => [...gallery],
        render,
        get isUploading() { return isUploading; },
    };
}
