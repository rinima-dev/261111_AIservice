// ==============================================================================
// api/_env.js
// 로컬 개발 환경(.env) 및 Vercel 배포 환경 변수 로더 유틸리티
// ==============================================================================

const fs = require('fs');
const path = require('path');

let isLoaded = false;

/**
 * 로컬 개발 시 .env 파일의 환경 변수를 process.env로 안전하게 로드합니다.
 * Vercel 배포 환경에서는 대시보드에 설정된 환경변수가 이미 주입되어 있으므로 덮어쓰지 않습니다.
 */
function loadEnv() {
  if (isLoaded) return;

  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const fileContent = fs.readFileSync(envPath, 'utf8');
      const lines = fileContent.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        // 주석(#)이거나 빈 줄 건너뛰기
        if (!trimmed || trimmed.startsWith('#')) continue;

        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex !== -1) {
          const key = trimmed.substring(0, equalsIndex).trim();
          let value = trimmed.substring(equalsIndex + 1).trim();

          // 따옴표로 감싸진 경우 따옴표 제거
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }

          if (key && !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  } catch (error) {
    console.error('환경 변수 파일 로드 중 오류:', error);
  } finally {
    isLoaded = true;
  }
}

module.exports = {
  loadEnv
};

