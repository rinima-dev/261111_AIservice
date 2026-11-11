// ==============================================================================
// public/js/supabaseClient.js
// Supabase 클라이언트 초기화 및 관리 모듈
// ==============================================================================

// 전역 Supabase 클라이언트 인스턴스 변수
let supabaseClient = null;

/**
 * Supabase 클라이언트를 초기화하고 반환하는 비동기 함수
 * 1. 백엔드 /api/config 엔드포인트에서 Supabase URL과 Anon Key를 받아옵니다.
 * 2. CDN으로 로드된 window.supabase 라이브러리를 통해 클라이언트를 생성합니다.
 * 3. 생성이 완료되면 전역 window.supabaseClient에 등록합니다.
 * 
 * @returns {Promise<object|null>} Supabase 클라이언트 객체
 */
async function initSupabaseClient() {
  // 이미 초기화된 경우 기존 인스턴스 반환
  if (supabaseClient) {
    return supabaseClient;
  }

  // 브라우저에 CDN 스크립트가 로드되었는지 확인
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase CDN 라이브러리가 로드되지 않았습니다.');
    return null;
  }

  try {
    // 1. 서버리스 API에서 공개 설정값 조회
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`설정 조회 실패 (상태코드: ${response.status})`);
    }

    const config = await response.json();
    const { supabaseUrl, supabaseAnonKey } = config;

    // 2. 키 설정 여부 검증
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-project')) {
      console.warn('Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env 파일을 확인해주세요.');
      return null;
    }

    // 3. Supabase 클라이언트 생성
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    window.supabaseClient = supabaseClient;
    console.log('✅ Supabase 클라이언트가 성공적으로 초기화되었습니다.');
    return supabaseClient;

  } catch (error) {
    console.error('Supabase 클라이언트 초기화 중 오류 발생:', error);
    return null;
  }
}

/**
 * 현재 초기화된 Supabase 클라이언트를 가져오는 함수
 * 미초기화 상태라면 초기화를 시도합니다.
 */
async function getSupabaseClient() {
  if (!supabaseClient) {
    return await initSupabaseClient();
  }
  return supabaseClient;
}

