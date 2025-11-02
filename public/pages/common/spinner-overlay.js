export function createSpinnerOverlay(options = {}) {
    const {
        zIndex = 9999,
        spinnerSize = 56,
        backdrop = "rgba(0,0,0,.35)",
        border = 6,
        borderColor = "#fff",
        ariaLabel = "업로드 중",
    } = options;

    // 스타일 주입(중복 방지)
    const STYLE_ID = "js-spinner-overlay-style";
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
      .js-overlay{position:fixed;inset:0;display:none;place-items:center}
      .js-overlay.is-open{display:grid}
      .js-overlay__backdrop{position:absolute;inset:0}
      .js-overlay__spinner{position:relative;width:${spinnerSize}px;height:${spinnerSize}px;border:${border}px solid ${borderColor};border-top-color:transparent;border-radius:50%;animation:js-spin .9s linear infinite}
      @keyframes js-spin{to{transform:rotate(360deg)}}
    `;
        document.head.appendChild(style);
    }

    // 노드 만들기
    const overlay = document.createElement("div");
    overlay.className = "js-overlay";
    overlay.style.zIndex = String(zIndex);
    overlay.setAttribute("aria-hidden", "true");

    const backdropEl = document.createElement("div");
    backdropEl.className = "js-overlay__backdrop";
    backdropEl.style.background = backdrop;

    const spinner = document.createElement("div");
    spinner.className = "js-overlay__spinner";
    spinner.setAttribute("role", "status");
    spinner.setAttribute("aria-label", ariaLabel);

    overlay.append(backdropEl, spinner);
    document.body.appendChild(overlay);

    // 포커스 트랩은 필요 시 추가 가능. 여기선 ESC로 닫히지 않게 유지.
    let lockTargets = [];

    function lockFormControls(yes) {
        lockTargets.forEach(el => (el.disabled = !!yes));
    }

    return {
        el: overlay,
        show({ lockSelectors = ["form input", "form button", "form textarea", "form select"] } = {}) {
            // 잠글 타깃 수집
            lockTargets = lockSelectors.flatMap(sel => Array.from(document.querySelectorAll(sel)));
            lockFormControls(true);

            overlay.classList.add("is-open");
            overlay.setAttribute("aria-hidden", "false");
        },
        hide() {
            overlay.classList.remove("is-open");
            overlay.setAttribute("aria-hidden", "true");
            lockFormControls(false);
        },
        destroy() {
            this.hide();
            overlay.remove();
        }
    };
}
