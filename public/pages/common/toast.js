export async function showToast(msg) {
    const div = document.createElement('div');
    div.textContent = msg;

    Object.assign(div.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#333',
        color: '#fff',
        padding: '12px 18px',
        borderRadius: '8px',
        fontSize: '14px',
        zIndex: '9999',
        opacity: '0',
        transition: 'opacity 0.3s, transform 0.3s',
        pointerEvents: 'none',        // 클릭 막기
    });

    document.body.appendChild(div);

    // 살짝 아래에서 위로 뜨는 애니메이션
    requestAnimationFrame(() => {
        div.style.opacity = '1';
        div.style.transform = 'translate(-50%, 10px)';
    });

    // 2초 뒤 사라짐
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translate(-50%, 0px)';
        setTimeout(() => div.remove(), 300); // transition 후 제거
    }, 2000);
}
