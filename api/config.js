// ==============================================================================
// api/config.js
// Vercel Serverless Function - 공개 클라이언트 설정값 제공 API
//
// [보안 주의사항]
// - 프론트엔드가 Supabase 브라우저 클라이언트를 초기화하기 위한 URL과 Anon Key만 제공합니다.
// - OPENAI_API_KEY와 같은 비밀 키는 절대 이 곳에 포함하지 않습니다.
// ==============================================================================

const fs = require('fs');
const path = require('path');

// 로컬 환경(.env)에서 환경 변수를 읽어오는 헬퍼 함수
function loadEnvIfNeeded() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    return;
  }
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...values] = trimmed.split('=');
          const value = values.join('=').trim();
          if (key && !process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      });
    }
  } catch (err) {
    console.error('로컬 .env 파일 로드 중 오류:', err);
  }
}

module.exports = async function handler(req, res) {
  // CORS 및 캐시 방지 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  loadEnvIfNeeded();

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  // 클라이언트에게 Supabase 공개 접속 정보만 전달
  return res.status(200).json({
    supabaseUrl: supabaseUrl,
    supabaseAnonKey: supabaseAnonKey
  });
};

