import express from 'express';
const app = express();
const port = 8080;

// 현재 디렉터리의 모든 파일을 정적(static)으로 제공
app.use(express.static('public'));

// 루트("/") 접근 시 html/index.html로 리다이렉트
app.get('/', (req, res) => {
    res.redirect('/html/index.html');
});

// 서버 실행
app.listen(port, () => {
    console.log(`✅ Server is running on port ${port}`);
});
