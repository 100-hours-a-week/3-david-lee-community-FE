import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// 현재 디렉터리의 모든 파일을 정적(static)으로 제공
app.use(express.static('public'));

// 루트("/") 접근 시 홈 페이지로 리다이렉트
app.get('/', (req, res) => {
    res.redirect('/pages/html/home.html');
});

// 404 에러 핸들러 (모든 라우트 다음에 위치해야 함)
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'pages', 'html', '404.html'));
});

// 서버 실행
app.listen(port, () => {
    console.log(`✅ 앱 서버가 ${port}번 포트에서 시작되었습니다.`);
});
