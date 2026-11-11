// ==============================================================================
// public/js/planner.js
// 학습 플래너 생성, 로드맵/스케줄 렌더링, LocalStorage 상태 관리 & 성과 분석 모듈
// ==============================================================================

// LocalStorage 저장 키 이름
const PLANNER_STORAGE_KEY = 'ai_planner_data';

// 메모리에 유지되는 현재 플래너 데이터
let currentPlannerData = {
  goal: '',
  roadmap: [],
  tasks: []
};

/**
 * 1. 로컬 스토리지에 저장된 플래너 데이터 불러오기 및 초기 렌더링
 */
function loadSavedPlanner() {
  try {
    const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!saved) return;

    const parsed = JSON.parse(saved);
    if (parsed && Array.isArray(parsed.roadmap) && Array.isArray(parsed.tasks)) {
      currentPlannerData = parsed;
      renderRoadmap(currentPlannerData.roadmap);
      renderTaskList(currentPlannerData.tasks);
      updateMetrics(currentPlannerData.tasks);

      // 폼의 목표 입력창에도 이전 목표 채워넣기
      const goalInput = document.getElementById('goal-input');
      if (goalInput && currentPlannerData.goal) {
        goalInput.value = currentPlannerData.goal;
      }
    }
  } catch (error) {
    console.error('저장된 플래너 데이터 불러오기 오류:', error);
  }
}

/**
 * 2. 현재 플래너 데이터를 LocalStorage에 영구 저장하는 함수
 */
function savePlannerToStorage() {
  try {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(currentPlannerData));
  } catch (error) {
    console.error('LocalStorage 저장 실패:', error);
  }
}

/**
 * 3. 단계별 로드맵(Roadmap) 렌더링 함수
 * @param {Array} roadmapList - [{ step, title, description }, ...]
 */
function renderRoadmap(roadmapList) {
  const container = document.getElementById('roadmap-container');
  if (!container) return;

  if (!roadmapList || roadmapList.length === 0) {
    container.innerHTML = `
      <div class="empty-placeholder">
        상단에서 학습 목표를 설정하고 플래너를 생성하면 로드맵이 여기에 표시됩니다.
      </div>`;
    return;
  }

  container.innerHTML = roadmapList.map(item => `
    <div class="milestone-card">
      <div class="milestone-step">STEP ${escapeHtml(String(item.step || ''))}</div>
      <h3 class="milestone-title">${escapeHtml(item.title || '')}</h3>
      <p class="milestone-desc">${escapeHtml(item.description || '')}</p>
    </div>
  `).join('');
}

/**
 * 4. 일일 스케줄 할 일(Tasks) 목록 렌더링 함수
 * @param {Array} taskList - [{ id, day, title, completed }, ...]
 */
function renderTaskList(taskList) {
  const container = document.getElementById('task-list-container');
  if (!container) return;

  const addForm = document.getElementById('add-task-form');

  if (!taskList || taskList.length === 0) {
    container.innerHTML = `
      <li class="empty-placeholder">
        등록된 일일 스케줄이 없습니다. 학습 플래너를 먼저 생성해주세요.
      </li>`;
    if (addForm) addForm.style.display = 'none';
    return;
  }

  if (addForm) addForm.style.display = 'flex';

  container.innerHTML = taskList.map(task => `
    <li class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${escapeHtml(task.id)}">
      <input 
        type="checkbox" 
        class="task-checkbox" 
        id="chk-${escapeHtml(task.id)}" 
        ${task.completed ? 'checked' : ''}
        aria-label="${escapeHtml(task.title)}"
      >
      <div class="task-content">
        <span class="task-day-badge">Day ${task.day}</span>
        <div class="task-title">${escapeHtml(task.title)}</div>
      </div>
      <button type="button" class="task-delete-btn" title="이 과제 삭제" aria-label="과제 삭제">✕</button>
    </li>
  `).join('');

  // 체크박스 클릭 이벤트 바인딩
  container.querySelectorAll('.task-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const taskItem = e.target.closest('.task-item');
      const taskId = taskItem?.dataset?.taskId;
      toggleTaskCompletion(taskId, e.target.checked);
    });
  });

  // 과제 개별 삭제 버튼 이벤트 바인딩
  container.querySelectorAll('.task-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.task-item');
      const taskId = taskItem?.dataset?.taskId;
      if (taskId) {
        deleteTask(taskId);
      }
    });
  });
}

/**
 * 특정 과제를 삭제하는 함수
 * @param {string} taskId - 작업 ID
 */
function deleteTask(taskId) {
  const index = currentPlannerData.tasks.findIndex(t => t.id === taskId);
  if (index === -1) return;

  currentPlannerData.tasks.splice(index, 1);
  savePlannerToStorage();
  renderTaskList(currentPlannerData.tasks);
  updateMetrics(currentPlannerData.tasks);
  showToast('과제가 삭제되었습니다.', 'success');
}

/**
 * 나만의 과제를 일일 스케줄에 직접 추가하는 함수
 * @param {number} day - 일차 번호
 * @param {string} title - 과제 내용
 */
function addNewTask(day, title) {
  const cleanTitle = (title || '').trim();
  const numDay = parseInt(day, 10);

  if (!cleanTitle) {
    showToast('추가할 과제 내용을 입력해주세요.', 'error');
    return;
  }

  const newTask = {
    id: `custom-task-${Date.now()}`,
    day: isNaN(numDay) || numDay < 1 ? 1 : numDay,
    title: cleanTitle,
    completed: false
  };

  currentPlannerData.tasks.push(newTask);
  // 일차(day) 순서대로 정렬
  currentPlannerData.tasks.sort((a, b) => Number(a.day) - Number(b.day));

  savePlannerToStorage();
  renderTaskList(currentPlannerData.tasks);
  updateMetrics(currentPlannerData.tasks);
  showToast(`Day ${newTask.day}에 새 과제가 추가되었습니다!`, 'success');
}

/**
 * 새 과제 추가 폼 이벤트 바인딩 함수
 */
function setupAddTaskForm() {
  const form = document.getElementById('add-task-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const dayInput = document.getElementById('new-task-day');
    const titleInput = document.getElementById('new-task-title');

    addNewTask(dayInput?.value, titleInput?.value);

    if (titleInput) {
      titleInput.value = '';
      titleInput.focus();
    }
  });
}

/**
 * 5. 할 일 완료 상태 토글 함수
 * @param {string} taskId - 작업 ID
 * @param {boolean} isCompleted - 완료 여부
 */
function toggleTaskCompletion(taskId, isCompleted) {
  const task = currentPlannerData.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = Boolean(isCompleted);

  // UI 클래스 반영
  const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
  if (taskElement) {
    if (task.completed) {
      taskElement.classList.add('completed');
    } else {
      taskElement.classList.remove('completed');
    }
  }

  // LocalStorage 저장 및 성과 지표 즉시 재계산
  savePlannerToStorage();
  updateMetrics(currentPlannerData.tasks);
}

/**
 * 6. 주간 및 전체 성과 분석 지표 계산 및 프로그레스 바 갱신 함수 (docs/03_planner_features.md)
 * 
 * - 주간 성과 달성률: 최근 7일(day <= 7)간 완료한 할 일 수 / 최근 7일간 전체 할 일 수 * 100
 * - 월간/전체 성과 달성률: 전체 완료한 할 일 수 / 전체 할 일 수 * 100
 * - 0으로 나누기(NaN) 방지 처리
 */
function updateMetrics(taskList) {
  if (!taskList || taskList.length === 0) {
    applyProgressUI('weekly', 0);
    applyProgressUI('overall', 0);
    return;
  }

  // 1. 주간(최근 7일차 이내) 과제 필터링
  const weeklyTasks = taskList.filter(t => Number(t.day) <= 7);
  const weeklyCompleted = weeklyTasks.filter(t => t.completed).length;
  const weeklyRate = weeklyTasks.length > 0 
    ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) 
    : 0;

  // 2. 전체 과제 달성률
  const totalCompleted = taskList.filter(t => t.completed).length;
  const overallRate = taskList.length > 0 
    ? Math.round((totalCompleted / taskList.length) * 100) 
    : 0;

  applyProgressUI('weekly', weeklyRate);
  applyProgressUI('overall', overallRate);

  // 전체 목표 100% 달성 시 축하 모달 팝업
  if (overallRate === 100 && taskList.length > 0) {
    showCelebrationModal();
  }
}

let hasCelebrated = false;

/**
 * 100% 완수 축하 모달을 띄우는 함수
 */
function showCelebrationModal() {
  if (hasCelebrated) return;
  const modal = document.getElementById('celebration-modal');
  if (!modal) return;

  modal.style.display = 'flex';
  hasCelebrated = true;

  const closeBtn = document.getElementById('close-celebration-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };
  }

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
}

/**
 * 프로그레스 바 UI 및 숫자 텍스트를 업데이트하는 보조 함수
 */
function applyProgressUI(prefix, percent) {
  const safePercent = Math.max(0, Math.min(100, isNaN(percent) ? 0 : percent));
  const percentText = document.getElementById(`${prefix}-metric-percent`);
  const progressBar = document.getElementById(`${prefix}-progress-bar`);

  if (percentText) {
    percentText.textContent = `${safePercent}%`;
  }
  if (progressBar) {
    progressBar.style.width = `${safePercent}%`;
  }
}

/**
 * 7. 학습 목표 설정 폼 제출 이벤트 바인딩 및 OpenAI API 호출
 */
function setupPlannerForm() {
  const form = document.getElementById('goal-form');
  const generateBtn = document.getElementById('generate-btn');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const goal = document.getElementById('goal-input')?.value?.trim();
    const durationDays = document.getElementById('duration-input')?.value;
    const dailyHours = document.getElementById('hours-input')?.value;
    const currentLevel = document.getElementById('level-select')?.value;

    // 필수값 검증
    if (!goal || !durationDays || !dailyHours || !currentLevel) {
      showToast('모든 항목을 올바르게 입력해주세요.', 'error');
      return;
    }

    // 버튼 로딩 상태 적용
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<span class="spinner"></span> <span>AI 플래너 생성 중... (약 3~5초 소요)</span>';
    }

    try {
      // Node.js 서버리스 API 호출
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          goal: goal,
          durationDays: Number(durationDays),
          dailyHours: Number(dailyHours),
          currentLevel: currentLevel
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '플래너 생성에 실패했습니다.');
      }

      // 플래너 데이터 메모리 및 로컬스토리지 저장
      currentPlannerData = {
        goal: result.goal || goal,
        roadmap: result.roadmap || [],
        tasks: result.tasks || []
      };
      savePlannerToStorage();

      // UI 렌더링
      renderRoadmap(currentPlannerData.roadmap);
      renderTaskList(currentPlannerData.tasks);
      updateMetrics(currentPlannerData.tasks);

      showToast('🎉 맞춤형 학습 플래너가 성공적으로 생성되었습니다!', 'success');

      // 대시보드 영역으로 부드럽게 스크롤 이동
      const dashboard = document.getElementById('dashboard-section');
      if (dashboard) {
        dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

    } catch (error) {
      console.error('플래너 생성 실패:', error);
      showToast(error.message || 'AI 플래너 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span>✨ AI 학습 플래너 생성하기</span>';
      }
    }
  });

  // 대시보드 복사 및 초기화 버튼 이벤트 바인딩
  setupDashboardActions();
}

/**
 * 8. 학습 계획을 텍스트로 깔끔하게 정리하여 클립보드에 복사하는 함수
 */
async function copyPlannerToClipboard() {
  if (!currentPlannerData || (!currentPlannerData.roadmap.length && !currentPlannerData.tasks.length)) {
    showToast('복사할 학습 플래너가 없습니다. 플래너를 먼저 생성해주세요.', 'error');
    return;
  }

  let text = `========================================\n`;
  text += `🎯 [AI 스마트 학습 플래너] ${currentPlannerData.goal || '나의 학습 목표'}\n`;
  text += `========================================\n\n`;

  // 1. 로드맵 텍스트 변환
  if (currentPlannerData.roadmap && currentPlannerData.roadmap.length > 0) {
    text += `🗺️ [단계별 로드맵]\n`;
    currentPlannerData.roadmap.forEach(item => {
      text += `• STEP ${item.step}: ${item.title}\n  - ${item.description}\n`;
    });
    text += `\n`;
  }

  // 2. 일일 스케줄 텍스트 변환
  if (currentPlannerData.tasks && currentPlannerData.tasks.length > 0) {
    text += `📋 [일일 학습 스케줄]\n`;
    currentPlannerData.tasks.forEach(task => {
      const status = task.completed ? '[완료 ✔]' : '[진행중 □]';
      text += `${status} Day ${task.day}: ${task.title}\n`;
    });
    text += `\n`;
  }

  text += `출처: AI 스마트 학습 플래너\n`;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast('📋 학습 계획이 클립보드에 복사되었습니다! 노션이나 메모장에 붙여넣어 보세요.', 'success');
    } else {
      // 폴백 복사 로직
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('📋 학습 계획이 클립보드에 복사되었습니다!', 'success');
    }
  } catch (err) {
    console.error('클립보드 복사 오류:', err);
    showToast('클립보드 복사 중 오류가 발생했습니다.', 'error');
  }
}

/**
 * 9. 플래너 데이터 및 화면 상태 초기화 함수 (확인 창 포함)
 */
function resetPlanner() {
  if (!currentPlannerData || (!currentPlannerData.roadmap.length && !currentPlannerData.tasks.length)) {
    showToast('초기화할 플래너 데이터가 없습니다.', 'error');
    return;
  }

  const confirmed = confirm('정말 현재 플래너를 초기화하고 새 목표를 작성하시겠습니까?\n(기존 달성률과 체크 내역이 모두 초기화됩니다.)');
  if (!confirmed) return;

  // 1. 메모리 및 LocalStorage 비우기
  currentPlannerData = {
    goal: '',
    roadmap: [],
    tasks: []
  };
  localStorage.removeItem(PLANNER_STORAGE_KEY);

  // 2. 화면 초기화
  renderRoadmap([]);
  renderTaskList([]);
  updateMetrics([]);

  // 3. 입력 폼 초기화
  const goalForm = document.getElementById('goal-form');
  if (goalForm) goalForm.reset();

  showToast('🔄 플래너가 초기화되었습니다. 새로운 학습 목표를 세워보세요!', 'success');

  // 목표 입력창으로 포커스
  document.getElementById('goal-input')?.focus();
}

/**
 * 10. 대시보드 상단 복사 및 초기화 버튼 이벤트 리스너 연결
 */
function setupDashboardActions() {
  const copyBtn = document.getElementById('copy-plan-btn');
  const resetBtn = document.getElementById('reset-plan-btn');

  if (copyBtn) {
    copyBtn.addEventListener('click', copyPlannerToClipboard);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetPlanner);
  }
}

