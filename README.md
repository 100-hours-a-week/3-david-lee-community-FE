# 개발자 커뮤니티 Frontend

> 개발 이야기를 공유하는 특별한 공간

바닐라 JavaScript로 구현된 개발자 커뮤니티 플랫폼의 프론트엔드입니다. 빌드 도구나 프레임워크 없이 순수 HTML, CSS, JavaScript로 제작되었습니다.

## 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [개발 가이드](#개발-가이드)
- [아키텍처](#아키텍처)
- [API 연동](#api-연동)
- [배포](#배포)

## 주요 기능

### 사용자 인증
- 회원가입 및 로그인
- JWT 기반 토큰 인증
- 자동 토큰 갱신 (Refresh Token)
- 프로필 이미지 업로드

### 게시글 관리
- 게시글 작성, 수정, 삭제
- 마크다운 스타일 편집기
- 이미지 업로드 및 첨부
- 무한 스크롤 기반 게시글 목록
- 게시글 상세 보기

### 소셜 기능
- 댓글 작성 및 삭제
- 좋아요 기능
- 작성자 프로필 표시

### 사용자 경험
- 반응형 디자인 (모바일 최적화)
- 다크 테마 UI
- 실시간 폼 유효성 검증
- 토스트 알림
- 로딩 스피너

## 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: Flexbox, Grid, Custom Properties (CSS Variables)
- **JavaScript (ES6+)**: ES Modules, Async/Await, Fetch API
- **없는 것**: React, Vue, Angular 등 프레임워크 없음, Webpack 등 빌드 도구 없음

### 백엔드 연동
- **REST API**: `https://api.ktb-david.cloud/v1`
- **인증**: JWT (Access Token + Refresh Token)
- **HTTP Client**: Fetch API

### 개발 도구
- **Node.js**: v25.x (Express.js로 정적 파일 서빙)
- **Express.js**: v5.x (정적 파일 서버)
- **Jest**: 단위 테스트
- **Docker**: 컨테이너화 배포

## 프로젝트 구조

```
community_fe/
├── app.js                 # Express 서버 엔트리포인트
├── Dockerfile            # Docker 이미지 빌드 파일
├── package.json          # 프로젝트 설정 및 의존성
├── jest.config.js        # Jest 테스트 설정
└── public/               # 정적 파일 루트
    ├── api/              # API 클라이언트 모듈
    │   ├── config.js     # API 엔드포인트 설정
    │   ├── auth.js       # 인증 API (로그인, 로그아웃, 토큰 갱신)
    │   ├── authFetch.js  # 인증 래퍼 (자동 토큰 갱신)
    │   ├── user.js       # 사용자 API
    │   ├── post.js       # 게시글 API
    │   ├── comment.js    # 댓글 API
    │   ├── like.js       # 좋아요 API
    │   └── image.js      # 이미지 업로드 API
    ├── components/       # 재사용 가능한 UI 컴포넌트
    │   ├── postListCard.js     # 게시글 목록 카드
    │   ├── postListCard.html   # 게시글 목록 카드 템플릿
    │   ├── commentCard.js      # 댓글 카드
    │   ├── commentCard.html    # 댓글 카드 템플릿
    │   └── postDetailCard.html # 게시글 상세 템플릿
    ├── js/               # 페이지별 컨트롤러 스크립트
    │   ├── login.js      # 로그인 페이지
    │   ├── signup.js     # 회원가입 페이지
    │   ├── post-list.js  # 게시글 목록 페이지
    │   ├── post-detail.js # 게시글 상세 페이지
    │   ├── post-new.js   # 게시글 작성 페이지
    │   ├── post-edit.js  # 게시글 수정 페이지
    │   └── account-*.js  # 계정 관리 페이지
    ├── pages/
    │   ├── html/         # HTML 페이지 파일
    │   │   ├── home.html       # 랜딩 페이지
    │   │   ├── login.html      # 로그인
    │   │   ├── signup.html     # 회원가입
    │   │   ├── post-list.html  # 게시글 목록
    │   │   ├── post-detail.html # 게시글 상세
    │   │   └── ...
    │   ├── css/          # 페이지별 스타일시트
    │   │   ├── base.css  # 기본 스타일 및 디자인 토큰
    │   │   ├── home.css  # 홈 페이지 스타일
    │   │   └── ...
    │   └── common/       # 공통 UI 요소
    │       ├── appbar.js       # 상단 내비게이션 바
    │       ├── spinner-overlay.js # 로딩 스피너
    │       └── toast.js        # 토스트 알림
    └── utils/            # 유틸리티 함수
        ├── templateLoader.js # HTML 템플릿 로더
        └── validators.js     # 폼 유효성 검사
```

## 시작하기

### 사전 요구사항

- Node.js 25.x 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>
cd community_fe

# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm start
```

### 테스트 실행

```bash
# Jest 테스트 실행
npm test
```

## 개발 가이드

### 새 페이지 추가하기

1. **HTML 파일 생성**: `public/pages/html/new-page.html`
```html
<!doctype html>
<html lang="ko">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>새 페이지</title>
    <link rel="stylesheet" href="../css/base.css">
    <link rel="stylesheet" href="../css/new-page.css">
</head>
<body>
    <header class="appbar"></header>
    <main class="container">
        <!-- 콘텐츠 -->
    </main>
    <script type="module" src="../../js/new-page.js"></script>
</body>
</html>
```

2. **CSS 파일 생성**: `public/pages/css/new-page.css`
```css
/* 페이지 전용 스타일 */
```

3. **컨트롤러 스크립트 생성**: `public/js/new-page.js`
```javascript
import { initAppBar } from '../pages/common/appbar.js';

async function init() {
    await initAppBar();
    // 페이지 초기화 로직
}

init();
```

### 새 API 엔드포인트 추가하기

1. **엔드포인트 정의**: `public/api/config.js`에 추가
```javascript
export const API_ENDPOINTS = {
    // 기존 엔드포인트...
    NEW_RESOURCE: '/new-resource'
};
```

2. **API 모듈 생성**: `public/api/newResource.js`
```javascript
import { authFetch } from './authFetch.js';
import { API_ENDPOINTS } from './config.js';

export async function getNewResource() {
    return authFetch(API_ENDPOINTS.NEW_RESOURCE);
}
```

### 새 컴포넌트 만들기

1. **HTML 템플릿 생성**: `public/components/myComponent.html`
```html
<template id="myComponentTemplate">
    <div class="my-component">
        <!-- 컴포넌트 구조 -->
    </div>
</template>
```

2. **컴포넌트 스크립트 생성**: `public/components/myComponent.js`
```javascript
import { loadTemplate } from '../utils/templateLoader.js';

export async function createMyComponent(data) {
    const tpl = await loadTemplate('/components/myComponent.html', 'myComponentTemplate');
    const node = tpl.content.cloneNode(true);

    // 데이터 바인딩
    node.querySelector('.title').textContent = data.title;

    return node;
}
```

## 아키텍처

### 인증 시스템

이 프로젝트는 JWT 기반 이중 토큰 인증 방식을 사용합니다:

- **Access Token**: `localStorage`에 저장, API 요청 시 `Authorization` 헤더에 포함
- **Refresh Token**: HTTP-only 쿠키로 자동 관리

```javascript
// authFetch.js - 자동 토큰 갱신
async function authFetch(url, options = {}) {
    let response = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            ...options.headers
        }
    });

    // 401 응답 시 토큰 갱신 후 재시도
    if (response.status === 401) {
        await reissue(); // Refresh Token으로 Access Token 갱신
        response = await fetch(url, options);
    }

    return response;
}
```

### 컴포넌트 시스템

템플릿 로더 패턴을 사용하여 HTML 템플릿을 재사용합니다:

```javascript
// templateLoader.js
const templateCache = new Map();

export async function loadTemplate(path, id) {
    if (templateCache.has(id)) {
        return templateCache.get(id);
    }

    const response = await fetch(path);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const template = doc.getElementById(id);

    templateCache.set(id, template);
    return template;
}
```

### 무한 스크롤 구현

Intersection Observer API를 사용한 커서 기반 페이지네이션:

```javascript
const observer = new IntersectionObserver(async (entries) => {
    if (entries[0].isIntersecting && !isLoading && hasMore) {
        await loadMorePosts();
    }
}, { threshold: 0.5 });

observer.observe(document.querySelector('.sentinel'));
```

## API 연동

### 기본 설정

백엔드 API 기본 URL: `https://api.ktb-david.cloud/v1`

### 주요 엔드포인트

| 메서드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|-----------|
| POST | `/auth/login` | 로그인 | ❌ |
| POST | `/auth/logout` | 로그아웃 | ✅ |
| POST | `/auth/reissue` | 토큰 갱신 | ✅ |
| POST | `/users` | 회원가입 | ❌ |
| GET | `/users/my-page` | 내 정보 조회 | ✅ |
| PATCH | `/users/my-page` | 내 정보 수정 | ✅ |
| GET | `/posts` | 게시글 목록 | ✅ |
| POST | `/posts` | 게시글 작성 | ✅ |
| GET | `/posts/{id}` | 게시글 상세 | ✅ |
| PATCH | `/posts/{id}` | 게시글 수정 | ✅ |
| DELETE | `/posts/{id}` | 게시글 삭제 | ✅ |
| POST | `/comments` | 댓글 작성 | ✅ |
| DELETE | `/comments/{id}` | 댓글 삭제 | ✅ |
| POST | `/likes` | 좋아요 추가 | ✅ |
| DELETE | `/likes/{postId}` | 좋아요 취소 | ✅ |
| POST | `/images` | 이미지 업로드 | ✅ |

### 요청 예시

```javascript
// 게시글 목록 조회
import { getPosts } from './api/post.js';

const posts = await getPosts({ cursor: 0, size: 20 });
```

```javascript
// 게시글 작성
import { createPost } from './api/post.js';

const newPost = await createPost({
    title: '제목',
    content: '내용',
    imageUrl: 'https://...'
});
```

## 배포

### Docker를 사용한 배포

```bash
# Docker 이미지 빌드
docker build -t community_fe .

# 컨테이너 실행
docker run -p 3000:3000 community_fe
```

### Docker Compose 사용

```bash
# 컨테이너 시작
docker-compose up -d

# 컨테이너 중지
docker-compose down
```

### 환경 변수

필요한 경우 `public/api/config.js`에서 API 엔드포인트를 환경에 맞게 수정:

```javascript
// 개발 환경
export const API_BASE_URL = 'http://localhost:8080/v1';

// 프로덕션 환경
export const API_BASE_URL = 'https://api.ktb-david.cloud/v1';
```

## 반응형 디자인

모바일 우선 반응형 디자인을 적용하여 다양한 화면 크기를 지원합니다:

- **480px 이하**: 아주 작은 모바일
- **640px 이하**: 모바일
- **768px 이하**: 작은 태블릿
- **980px 이하**: 태블릿
- **980px 초과**: 데스크톱

```css
/* 모바일 우선 */
.container {
    padding: 20px;
}

/* 태블릿 */
@media (max-width: 768px) {
    .container {
        padding: 24px;
    }
}

/* 데스크톱 */
@media (min-width: 981px) {
    .container {
        padding: 40px;
    }
}
```

## 브라우저 지원

- Chrome (최신)
- Firefox (최신)
- Safari (최신)
- Edge (최신)

> ES6 모듈을 사용하므로 IE11은 지원하지 않습니다.

## 라이센스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 기여

버그 제보 및 기능 제안은 Issues를 통해 제출해 주세요.
