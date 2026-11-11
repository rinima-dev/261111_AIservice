// ==============================================================================
// public/js/app.js
// 메인 어플리케이션 초기화 및 이벤트 연결 모듈
// ==============================================================================

/**
 * 탭 네비게이션 클릭 전환 처리 함수
 * - 상단: '학습 목표' ↔ '과목 Q&A 튜터'
 * - 대시보드: '일일 학습 스케줄' ↔ '단계별 로드맵'
 */
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.tabGroup;
      const targetSelector = btn.dataset.tabTarget;
      if (!group || !targetSelector) return;

      // 1. 동일한 탭 그룹의 버튼 상태 갱신
      const groupButtons = document.querySelectorAll(`.tab-btn[data-tab-group="${group}"]`);
      groupButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // 2. 동일한 그룹의 콘텐츠 영역 전환
      groupButtons.forEach(b => {
        const otherTarget = b.dataset.tabTarget;
        if (otherTarget) {
          const content = document.querySelector(otherTarget);
          if (content) {
            content.classList.add('hidden');
          }
        }
      });

      // 3. 선택된 대상 콘텐츠 표시
      const activeContent = document.querySelector(targetSelector);
      if (activeContent) {
        activeContent.classList.remove('hidden');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 AI 스마트 학습 플래너 앱이 로드되었습니다.');

  // 0. 탭 클릭 전환 시스템 초기화
  setupTabNavigation();

  // 1. 학습 플래너 모듈 초기화
  try {
    if (typeof setupPlannerForm === 'function') {
      setupPlannerForm();
    }
    // 이전에 저장된 플래너 데이터가 있다면 화면에 복원
    if (typeof loadSavedPlanner === 'function') {
      loadSavedPlanner();
    }
  } catch (err) {
    console.error('학습 플래너 초기화 오류:', err);
  }

  // 2. Q&A 챗봇 모듈 초기화
  try {
    if (typeof setupQAForm === 'function') {
      setupQAForm();
    }
  } catch (err) {
    console.error('Q&A 모듈 초기화 오류:', err);
  }

  // 3. Supabase 피드백 모듈 초기화
  try {
    if (typeof setupStarRating === 'function') {
      setupStarRating();
    }
    if (typeof setupFeedbackForm === 'function') {
      setupFeedbackForm();
    }
    if (typeof fetchAndRenderFeedbacks === 'function') {
      await fetchAndRenderFeedbacks();
    }
  } catch (err) {
    console.error('피드백 모듈 초기화 오류:', err);
  }
});
