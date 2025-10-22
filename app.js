import express from 'express';
const app = express();
const port = 3000;

// 현재 디렉터리의 모든 파일을 정적(static)으로 제공
app.use(express.static('public'));

// 루트("/") 접근 시 pages/index.html로 리다이렉트
app.get('/', (req, res) => {
    res.redirect('/pages/html/login.html');
});

// 서버 실행
app.listen(port, () => {
    console.log(`✅ 앱 서버가 ${port}번 포트에서 시작되었습니다.`);
});
