// ==============================================================================
// public/js/feedback.js
// Supabase 연동 비로그인 피드백 관리 & 공통 토스트 알림 모듈
// ==============================================================================

/**
 * 1. 공통 토스트(Toast) 알림 표시 함수
 * @param {string} message - 화면에 표시할 메시지
 * @param {'error'|'success'} type - 알림 종류 (기본값: 'error')
 */
function showToast(message, type = 'error') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  // 토스트 요소 생성
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // 아이콘 설정
  const icon = type === 'success' ? '✅' : '⚠️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  // 3.5초 후 부드럽게 사라지는 애니메이션 적용
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}

/**
 * HTML 특수문자 이스케이프 함수 (XSS 보안 공격 방어)
 * @param {string} text - 원본 문자열
 * @returns {string} 안전하게 이스케이프된 문자열
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 날짜 문자열을 한국어 형식으로 변환하는 함수
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} 예: "2026. 11. 11. 오후 1:30"
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 2. Supabase feedbacks 테이블에서 최신 피드백 목록을 조회하여 화면에 렌더링하는 함수 (별점 제외)
 */
async function fetchAndRenderFeedbacks() {
  const listContainer = document.getElementById('feedback-list');
  if (!listContainer) return;

  try {
    const client = await getSupabaseClient();
    if (!client) {
      listContainer.innerHTML = `
        <div class="empty-placeholder">
          Supabase 연결 설정(.env)이 완료되지 않아 피드백 목록을 불러올 수 없습니다.
        </div>`;
      return;
    }

    // Supabase DB 조회: 최신순(created_at 내림차순) 정렬
    const { data, error } = await client
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 등록된 피드백이 없는 경우
    if (!data || data.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-placeholder">
          아직 등록된 피드백이 없습니다. 첫 번째 한줄평을 남겨보세요!
        </div>`;
      return;
    }

    // 카드 목록 렌더링 (별점 없이 닉네임, 내용, 작성일시만 깔끔하게 출력)
    listContainer.innerHTML = data.map(item => `
      <div class="feedback-card">
        <div class="feedback-card-header">
          <span class="feedback-author">💬 ${escapeHtml(item.nickname)}</span>
          <span class="feedback-date">${formatDate(item.created_at)}</span>
        </div>
        <p class="feedback-body">${escapeHtml(item.content)}</p>
      </div>
    `).join('');

  } catch (error) {
    console.error('피드백 목록 조회 오류:', error);
    listContainer.innerHTML = `
      <div class="empty-placeholder" style="color: var(--error-color);">
        피드백 목록을 불러오는 중 오류가 발생했습니다.
      </div>`;
  }
}

/**
 * 3. 피드백 신규 등록(INSERT) 함수
 * @param {string} nickname - 작성자 닉네임
 * @param {string} content - 피드백 내용
 */
async function submitFeedback(nickname, content) {
  // 필수값 유효성 검증
  const cleanNickname = (nickname || '').trim();
  const cleanContent = (content || '').trim();

  if (!cleanNickname) {
    showToast('닉네임을 입력해주세요.', 'error');
    return false;
  }

  if (!cleanContent) {
    showToast('피드백 내용을 입력해주세요.', 'error');
    return false;
  }

  const submitBtn = document.getElementById('feedback-submit-btn');
  try {
    const client = await getSupabaseClient();
    if (!client) {
      showToast('Supabase 연결 설정(.env)이 완료되지 않았습니다.', 'error');
      return false;
    }

    // 버튼 로딩 상태 전환
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> <span>등록 중...</span>';
    }

    // Supabase feedbacks 테이블에 데이터 삽입
    // (기존 DB 스키마 NOT NULL 제약조건을 위해 rating 기본값 5로 저장)
    const { error } = await client
      .from('feedbacks')
      .insert([{
        nickname: cleanNickname,
        rating: 5,
        content: cleanContent
      }]);

    if (error) {
      throw error;
    }

    showToast('피드백이 성공적으로 등록되었습니다!', 'success');

    // 입력 폼 초기화
    const form = document.getElementById('feedback-form');
    if (form) form.reset();

    // 등록 즉시 최신 피드백 목록 재조회
    await fetchAndRenderFeedbacks();
    return true;

  } catch (error) {
    console.error('피드백 등록 실패:', error);
    showToast('피드백 등록 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    return false;
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>피드백 등록하기</span>';
    }
  }
}

/**
 * 호환성을 위한 더미 함수 (별점 UI 제거됨)
 */
function setupStarRating() {}
function resetStarRating() {}

/**
 * 4. 피드백 폼 이벤트 리스너 바인딩
 */
function setupFeedbackForm() {
  const form = document.getElementById('feedback-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nickname = document.getElementById('feedback-nickname')?.value;
    const content = document.getElementById('feedback-content')?.value;

    await submitFeedback(nickname, content);
  });
}
