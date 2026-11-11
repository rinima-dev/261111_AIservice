// ==============================================================================
// public/js/planner.js
// 학습 플래너 생성, 로드맵/캘린더 렌더링, LocalStorage 상태 관리 & 성과 분석 모듈
// (30일 단위 캘린더 뷰, 날짜별 + 과제 추가, 최대 180일 지원)
// ==============================================================================

// LocalStorage 저장 키 이름
const PLANNER_STORAGE_KEY = 'ai_planner_data';

// 메모리에 유지되는 현재 플래너 데이터 객체
let currentPlannerData = {
  goal: '',
  roadmap: [],
  tasks: []
};

// 현재 사용자가 선택한 주차 (기본값: 1주차)
let selectedWeek = 1;

// 현재 캘린더 페이지 (1페이지 = Day 1~30, 2페이지 = Day 31~60 ...)
let currentCalendarPage = 1;
const DAYS_PER_PAGE = 30; // 30일 단위로 페이지 분할

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
      renderCalendar(currentPlannerData.tasks);

      // 주차 선택 드롭다운 갱신 및 달성률 계산
      updateWeekOptions(currentPlannerData.tasks);
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
 * 4. 일일 스케줄을 달력(캘린더) 7열 그리드로 렌더링하고, 30일 단위 페이지네이션을 처리하는 함수
 * @param {Array} taskList - [{ id, day, title, completed }, ...]
 */
function renderCalendar(taskList) {
  const gridContainer = document.getElementById('calendar-grid-container');
  const paginationBar = document.getElementById('calendar-pagination');
  const weekdaysHeader = document.getElementById('calendar-weekdays');
  const pageInfo = document.getElementById('calendar-page-info');
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');

  if (!gridContainer) return;

  // 플래너에 등록된 과제가 없는 경우
  if (!taskList || taskList.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-placeholder" style="grid-column: 1 / -1;">
        등록된 일일 스케줄이 없습니다. 상단에서 학습 플래너를 먼저 생성해주세요.
      </div>`;
    if (paginationBar) paginationBar.style.display = 'none';
    if (weekdaysHeader) weekdaysHeader.style.display = 'none';
    return;
  }

  // 전체 등록된 최대 Day 계산 (최소 1일, 최대 180일)
  const maxDay = Math.max(...taskList.map(t => Number(t.day) || 1), 1);
  const totalPages = Math.ceil(maxDay / DAYS_PER_PAGE);

  // 현재 페이지 범위 안전 보정
  if (currentCalendarPage > totalPages) currentCalendarPage = totalPages;
  if (currentCalendarPage < 1) currentCalendarPage = 1;

  const startDay = (currentCalendarPage - 1) * DAYS_PER_PAGE + 1;
  const endDay = Math.min(currentCalendarPage * DAYS_PER_PAGE, Math.max(maxDay, currentCalendarPage * DAYS_PER_PAGE));

  // 30일 페이지네이션 바 UI 업데이트
  if (paginationBar) {
    if (maxDay > DAYS_PER_PAGE) {
      paginationBar.style.display = 'flex';
      if (pageInfo) {
        pageInfo.textContent = `Day ${startDay} ~ ${endDay} (페이지 ${currentCalendarPage}/${totalPages})`;
      }
      if (prevBtn) prevBtn.disabled = currentCalendarPage <= 1;
      if (nextBtn) nextBtn.disabled = currentCalendarPage >= totalPages;
    } else {
      paginationBar.style.display = 'none';
    }
  }

  if (weekdaysHeader) weekdaysHeader.style.display = 'grid';

  // Day별로 과제들을 그룹핑 (예: { 1: [task1, task2], 2: [task3] })
  const tasksByDay = {};
  for (let d = startDay; d <= endDay; d++) {
    tasksByDay[d] = [];
  }
  taskList.forEach(task => {
    const d = Number(task.day);
    if (d >= startDay && d <= endDay) {
      if (!tasksByDay[d]) tasksByDay[d] = [];
      tasksByDay[d].push(task);
    }
  });

  // 캘린더 날짜 칸(Cell) HTML 동적 생성
  let html = '';
  for (let d = startDay; d <= endDay; d++) {
    const dayTasks = tasksByDay[d] || [];
    
    html += `
      <div class="calendar-day-cell" data-day="${d}">
        <div class="calendar-day-header">
          <span class="calendar-day-title">Day ${d}</span>
          <button type="button" class="calendar-add-btn" data-add-day="${d}" title="Day ${d}에 과제 추가" aria-label="Day ${d} 과제 추가">+</button>
        </div>

        <!-- 해당 날짜의 과제 목록 -->
        <div class="calendar-day-tasks" id="tasks-day-${d}">
          ${dayTasks.map(task => `
            <div class="calendar-task-item ${task.completed ? 'completed' : ''}" data-task-id="${escapeHtml(task.id)}">
              <input 
                type="checkbox" 
                class="calendar-task-checkbox" 
                ${task.completed ? 'checked' : ''} 
                aria-label="${escapeHtml(task.title)}"
              >
              <span class="calendar-task-text">${escapeHtml(task.title)}</span>
              <button type="button" class="calendar-task-del-btn" title="과제 삭제" aria-label="과제 삭제">✕</button>
            </div>
          `).join('')}
        </div>

        <!-- 인라인 과제 추가 미니 입력 폼 (평소에는 숨김) -->
        <div class="calendar-inline-form" id="form-day-${d}" style="display: none;">
          <input 
            type="text" 
            class="calendar-inline-input" 
            id="input-day-${d}" 
            placeholder="과제 내용 입력..."
          >
          <div class="calendar-inline-actions">
            <button type="button" class="calendar-inline-submit" data-submit-day="${d}">추가</button>
            <button type="button" class="calendar-inline-cancel" data-cancel-day="${d}">취소</button>
          </div>
        </div>
      </div>
    `;
  }

  gridContainer.innerHTML = html;

  // 1. 체크박스 이벤트 바인딩
  gridContainer.querySelectorAll('.calendar-task-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const taskItem = e.target.closest('.calendar-task-item');
      const taskId = taskItem?.dataset?.taskId;
      toggleTaskCompletion(taskId, e.target.checked);
    });
  });

  // 2. 개별 과제 삭제 버튼 이벤트 바인딩
  gridContainer.querySelectorAll('.calendar-task-del-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const taskItem = e.target.closest('.calendar-task-item');
      const taskId = taskItem?.dataset?.taskId;
      if (taskId) {
        deleteTask(taskId);
      }
    });
  });

  // 3. [+] 버튼 클릭 시 해당 날짜의 인라인 입력 폼 토글
  gridContainer.querySelectorAll('.calendar-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetDay = e.currentTarget.dataset.addDay;
      const formEl = document.getElementById(`form-day-${targetDay}`);
      const inputEl = document.getElementById(`input-day-${targetDay}`);
      if (formEl) {
        const isHidden = formEl.style.display === 'none';
        formEl.style.display = isHidden ? 'flex' : 'none';
        if (isHidden && inputEl) {
          inputEl.focus();
        }
      }
    });
  });

  // 4. 인라인 입력 폼의 '추가' 버튼 이벤트 바인딩
  gridContainer.querySelectorAll('.calendar-inline-submit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetDay = e.currentTarget.dataset.submitDay;
      const inputEl = document.getElementById(`input-day-${targetDay}`);
      if (inputEl) {
        addNewTask(targetDay, inputEl.value);
        inputEl.value = '';
      }
    });
  });

  // 5. 인라인 입력 폼에서 엔터키 입력 시 과제 추가 지원
  gridContainer.querySelectorAll('.calendar-inline-input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const targetDay = input.id.replace('input-day-', '');
        addNewTask(targetDay, input.value);
        input.value = '';
      }
    });
  });

  // 6. 인라인 입력 폼의 '취소' 버튼 이벤트 바인딩
  gridContainer.querySelectorAll('.calendar-inline-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetDay = e.currentTarget.dataset.cancelDay;
      const formEl = document.getElementById(`form-day-${targetDay}`);
      if (formEl) formEl.style.display = 'none';
    });
  });
}

/**
 * 30일 단위 페이지네이션 이전/다음 버튼 이벤트 바인딩 함수
 */
function setupCalendarPagination() {
  const prevBtn = document.getElementById('prev-page-btn');
  const nextBtn = document.getElementById('next-page-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentCalendarPage > 1) {
        currentCalendarPage--;
        renderCalendar(currentPlannerData.tasks);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentCalendarPage++;
      renderCalendar(currentPlannerData.tasks);
    });
  }
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
  renderCalendar(currentPlannerData.tasks);
  updateWeekOptions(currentPlannerData.tasks);
  updateMetrics(currentPlannerData.tasks);
  showToast('과제가 삭제되었습니다.', 'success');
}

/**
 * 특정 날짜(day)에 과제를 직접 추가하는 함수
 * @param {number|string} day - 일차 번호
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
  renderCalendar(currentPlannerData.tasks);
  updateWeekOptions(currentPlannerData.tasks);
  updateMetrics(currentPlannerData.tasks);
  showToast(`Day ${newTask.day}에 새 과제가 추가되었습니다!`, 'success');
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
  const taskElement = document.querySelector(`.calendar-task-item[data-task-id="${taskId}"]`);
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
 * 6. 과제 목록의 최대 Day를 계산하여 주차(1주차, 2주차...) 옵션을 동적으로 생성하는 함수
 * @param {Array} taskList - 과제 목록
 */
function updateWeekOptions(taskList) {
  const weekSelect = document.getElementById('week-select');
  if (!weekSelect) return;

  if (!taskList || taskList.length === 0) {
    weekSelect.innerHTML = '<option value="1">1주차 (Day 1~7)</option>';
    selectedWeek = 1;
    return;
  }

  // 등록된 과제 중 가장 큰 Day 찾기
  const maxDay = Math.max(...taskList.map(t => Number(t.day) || 1), 7);
  // 7일 단위로 총 몇 주차까지 있는지 계산
  const totalWeeks = Math.ceil(maxDay / 7);

  // 이전 선택값 유지 시도
  const prevSelected = selectedWeek;
  weekSelect.innerHTML = '';

  for (let w = 1; w <= totalWeeks; w++) {
    const startDay = (w - 1) * 7 + 1;
    const endDay = w * 7;
    const option = document.createElement('option');
    option.value = w;
    option.textContent = `${w}주차 (Day ${startDay}~${endDay})`;
    if (w === prevSelected) {
      option.selected = true;
    }
    weekSelect.appendChild(option);
  }

  // 이전 선택값이 전체 주차 범위 밖이면 1주차로 리셋
  if (prevSelected > totalWeeks) {
    selectedWeek = 1;
    weekSelect.value = "1";
  } else {
    selectedWeek = parseInt(weekSelect.value, 10) || 1;
  }
}

/**
 * 주차 선택 드롭다운 이벤트 리스너 바인딩 함수
 */
function setupWeekSelectListener() {
  const weekSelect = document.getElementById('week-select');
  if (!weekSelect) return;

  weekSelect.addEventListener('change', (e) => {
    selectedWeek = parseInt(e.target.value, 10) || 1;
    updateMetrics(currentPlannerData.tasks);
  });
}

/**
 * 7. 주간(선택한 주차 기준 7일 단위) 및 전체 성과 분석 지표 계산 및 프로그레스 바 갱신 함수
 */
function updateMetrics(taskList) {
  if (!taskList || taskList.length === 0) {
    applyProgressUI('weekly', 0);
    applyProgressUI('overall', 0);
    return;
  }

  // 1. 사용자가 선택한 주차의 Day 범위 계산 (1주차 -> 1~7, 2주차 -> 8~14)
  const currentWeek = selectedWeek || 1;
  const startDay = (currentWeek - 1) * 7 + 1;
  const endDay = currentWeek * 7;

  // 해당 주차 범위에 속하는 과제만 필터링
  const weeklyTasks = taskList.filter(t => {
    const day = Number(t.day);
    return day >= startDay && day <= endDay;
  });

  const weeklyCompleted = weeklyTasks.filter(t => t.completed).length;
  const weeklyRate = weeklyTasks.length > 0 
    ? Math.round((weeklyCompleted / weeklyTasks.length) * 100) 
    : 0;

  // 2. 전체 과제 달성률
  const totalCompleted = taskList.filter(t => t.completed).length;
  const overallRate = taskList.length > 0 
    ? Math.round((totalCompleted / taskList.length) * 100) 
    : 0;

  // 프로그레스 바 UI 반영
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
 * 8. 학습 목표 설정 폼 제출 이벤트 바인딩 및 OpenAI API 호출
 */
function setupPlannerForm() {
  const form = document.getElementById('goal-form');
  const generateBtn = document.getElementById('generate-btn');
  if (!form) return;

  // 주차 선택 리스너 및 캘린더 페이지네이션 리스너 등록
  setupWeekSelectListener();
  setupCalendarPagination();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const goal = document.getElementById('goal-input')?.value?.trim();
    const durationDays = document.getElementById('duration-input')?.value;
    const dailyHours = document.getElementById('hours-input')?.value;
    const currentLevel = document.getElementById('level-select')?.value;

    // 필수값 검증 (최대 180일 검증 포함)
    const numDays = parseInt(durationDays, 10);
    if (!goal || isNaN(numDays) || !dailyHours || !currentLevel) {
      showToast('모든 항목을 올바르게 입력해주세요.', 'error');
      return;
    }

    if (numDays < 1 || numDays > 180) {
      showToast('학습 기간은 1일부터 최대 180일(6개월)까지 설정 가능합니다.', 'error');
      return;
    }

    // 버튼 로딩 상태 적용
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.innerHTML = '<span class="spinner"></span> <span>AI 플래너 생성 중... (잠시만 기다려주세요)</span>';
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
          durationDays: numDays,
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

      // UI 렌더링 (1페이지로 초기화)
      currentCalendarPage = 1;
      selectedWeek = 1;
      renderRoadmap(currentPlannerData.roadmap);
      renderCalendar(currentPlannerData.tasks);
      updateWeekOptions(currentPlannerData.tasks);
      updateMetrics(currentPlannerData.tasks);

      showToast('🎉 맞춤형 캘린더 학습 플래너가 성공적으로 생성되었습니다!', 'success');

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
 * 9. 학습 계획을 텍스트로 깔끔하게 정리하여 클립보드에 복사하는 함수
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
    text += `📅 [일일 학습 캘린더]\n`;
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
 * 10. 플래너 데이터 및 화면 상태 초기화 함수 (확인 창 포함)
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
  selectedWeek = 1;
  currentCalendarPage = 1;

  // 2. 화면 초기화
  renderRoadmap([]);
  renderCalendar([]);
  updateWeekOptions([]);
  updateMetrics([]);

  // 3. 입력 폼 초기화
  const goalForm = document.getElementById('goal-form');
  if (goalForm) goalForm.reset();

  showToast('🔄 플래너가 초기화되었습니다. 새로운 학습 목표를 세워보세요!', 'success');
  document.getElementById('goal-input')?.focus();
}

/**
 * 11. 대시보드 상단 복사 및 초기화 버튼 이벤트 리스너 연결
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
