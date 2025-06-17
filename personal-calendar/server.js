const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// public 폴더 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 메인 페이지에 환경변수 삽입
app.get('/', (req, res) => {
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    const envScript = `
    <script>
        window.GEMINI_API_KEY = '${process.env.GEMINI_API_KEY || ''}';
        console.log('✅ 서버에서 환경변수 주입:', window.GEMINI_API_KEY ? 'API 키 설정됨' : 'API 키 없음');
    </script>
</head>`;
    html = html.replace('</head>', envScript);

    res.send(html);
  } catch (error) {
    console.error('HTML 파일 읽기 오류:', error);
    res.status(500).send(`
      <h1>서버 오류</h1>
      <p>index.html 파일을 찾을 수 없습니다.</p>
      <p>오류: ${error.message}</p>
    `);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 서버가 포트 ${port}에서 실행중입니다`);
});
