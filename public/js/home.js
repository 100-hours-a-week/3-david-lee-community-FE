/**
 * 홈페이지 스크롤 애니메이션
 * Intersection Observer API를 사용하여 스크롤 시 요소가 나타나는 효과 구현
 */

function init() {
    setupScrollAnimations();
    setupParallaxEffect();
}

/**
 * 스크롤 애니메이션 설정
 */
function setupScrollAnimations() {
    // Intersection Observer 옵션
    const observerOptions = {
        root: null, // 뷰포트를 기준으로
        threshold: 0.1, // 요소의 10%가 보이면 트리거
        rootMargin: '0px 0px -50px 0px' // 하단 50px 마진
    };

    // Observer 생성
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 요소가 화면에 들어오면 revealed 클래스 추가
                entry.target.classList.add('revealed');

                // 한 번만 실행하고 관찰 중지 (선택사항)
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 애니메이션 대상 요소들 선택
    const animatedElements = document.querySelectorAll(
        '.scroll-reveal, .fade-in, .slide-left, .slide-right, .scale-up'
    );

    // 각 요소에 Observer 적용
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

/**
 * Parallax 스크롤 효과
 */
function setupParallaxEffect() {
    const codeBlock = document.querySelector('.code-block');
    if (!codeBlock) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * 0.3; // 스크롤 속도 조절

                // 코드 블록에 패럴랙스 효과 적용
                codeBlock.style.transform = `translateY(${rate}px)`;

                ticking = false;
            });

            ticking = true;
        }
    });
}

/**
 * 스크롤 진행 표시 (선택사항)
 */
function setupScrollProgress() {
    // 스크롤 진행 바 생성
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.innerHTML = '<div class="scroll-progress__bar"></div>';
    document.body.appendChild(progressBar);

    // 스크롤 이벤트
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;

        const bar = document.querySelector('.scroll-progress__bar');
        if (bar) {
            bar.style.width = scrolled + '%';
        }
    });
}

// 페이지 로드 시 초기화
init();
