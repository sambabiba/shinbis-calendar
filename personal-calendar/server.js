const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// 정적 파일 서빙 - 모든 파일과 폴더를 그대로 제공
app.use(express.static('.'));

// 메인 페이지 - 환경변수를 HTML에 주입
app.get('/', (req, res) => {
  try {
    // index.html 파일 읽기
    let html = fs.readFileSync('index.html', 'utf8');
    
    // 환경변수 주입 스크립트를 head 태그 끝에 추가
    const envScript = `
    <script>
        // Azure 환경변수에서 API 키 설정
        window.GEMINI_API_KEY = '${process.env.GEMINI_API_KEY || ''}';
        console.log('✅ 서버에서 환경변수 주입:', window.GEMINI_API_KEY ? 'API 키 설정됨' : 'API 키 없음');
    </script>
</head>`;
    
    // </head> 태그를 찾아서 환경변수 스크립트 주입
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
    console.log(`🔑 GEMINI_API_KEY 환경변수:`, process.env.GEMINI_API_KEY ? '설정됨' : '설정안됨');
    console.log(`📂 현재 디렉토리:`, __dirname);
});
