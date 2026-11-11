// ==============================================================================
// server.js
// 로컬 테스트용 독립 Node.js 개발 서버
// 
// [특징]
// - Vercel CLI나 추가 라이브러리 설치 없이 순수 Node.js 기본 기능만으로 작동합니다.
// - Vercel 계정 연동 오류 없이 즉시 http://localhost:3000 에서 테스트할 수 있습니다.
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME 타입 매핑 표
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Vercel Serverless Function 핸들러 래퍼 (Express req/res 호환 처리)
async function handleApiRequest(handlerPath, req, res) {
  // 요청 본문(body) 수집
  let bodyBuffer = '';
  req.on('data', chunk => {
    bodyBuffer += chunk;
  });

  req.on('end', async () => {
    try {
      // req 객체 확장
      if (bodyBuffer) {
        try {
          req.body = JSON.parse(bodyBuffer);
        } catch {
          req.body = bodyBuffer;
        }
      } else {
        req.body = {};
      }

      // res 객체 확장 (.status().json() 지원)
      res.status = function (statusCode) {
        res.statusCode = statusCode;
        return res;
      };

      res.json = function (data) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
        return res;
      };

      // 핸들러 실행
      delete require.cache[require.resolve(handlerPath)];
      const handler = require(handlerPath);
      await handler(req, res);
    } catch (err) {
      console.error(`API 실행 오류 [${handlerPath}]:`, err);
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: '서버 내부 오류가 발생했습니다.' }));
      }
    }
  });
}

// HTTP 서버 생성
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 1. API 라우팅 처리 (/api/*)
  if (pathname === '/api/generate-plan') {
    return handleApiRequest('./api/generate-plan.js', req, res);
  }
  if (pathname === '/api/qa') {
    return handleApiRequest('./api/qa.js', req, res);
  }
  if (pathname === '/api/config') {
    return handleApiRequest('./api/config.js', req, res);
  }

  // 2. 프론트엔드 정적 파일 서빙 (/public/*)
  let safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, safePath);

  // 디렉터리 접근 방지 보안 체크
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 파일이 없을 경우 index.html 반환 (SPA 폴백)
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (indexErr, content) => {
        if (indexErr) {
          res.statusCode = 404;
          return res.end('404 Not Found');
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(content);
      });
      return;
    }

    // MIME 타입 설정 후 파일 전송
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.statusCode = 500;
        return res.end('File Read Error');
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 [AI 학습 플래너] 로컬 서버가 시작되었습니다!`);
  console.log(`👉 브라우저 접속 주소: http://localhost:${PORT}`);
  console.log(`(종료하려면 터미널에서 Ctrl + C 를 누르세요)`);
  console.log(`======================================================\n`);
});

