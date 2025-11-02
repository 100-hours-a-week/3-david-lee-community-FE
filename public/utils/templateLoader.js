// 내부 캐시 (중복 fetch 방지)
const templateCache = new Map();

/**
 * 템플릿 HTML을 비동기로 불러와서 <template> DOM 반환
 */
export async function loadTemplate(path, id) {
    // 캐시 있으면 바로 반환
    if (templateCache.has(id)) {
        return templateCache.get(id);
    }

    const res = await fetch(path);
    if (!res.ok) throw new Error(`${id} 템플릿 로드 실패 (${res.status})`);

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const template = doc.getElementById(id);

    if (!template) {
        throw new Error(`템플릿 id='${id}' 없음`);
    }

    // 캐시에 저장
    templateCache.set(id, template);
    return template;
}