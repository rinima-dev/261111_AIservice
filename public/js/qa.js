// ==============================================================================
// public/js/qa.js
// 학습 과목 질의응답(Q&A) 챗봇 처리 모듈
// ==============================================================================

/**
 * Q&A 대화창에 새로운 말풍선 메시지를 추가하고 스크롤을 맨 아래로 내리는 함수
 * @param {string} text - 메시지 내용
 * @param {'user'|'ai'|'system'} sender - 발신자 유형
 * @returns {HTMLElement} 생성된 말풍선 요소
 */
function appendChatMessage(text, sender = 'ai') {
  const chatBox = document.getElementById('qa-chat-box');
  if (!chatBox) return null;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;

  if (sender === 'ai') {
    // 줄바꿈 보존 및 안전한 텍스트 처리
    bubble.innerHTML = `<strong>🤖 AI 튜터:</strong><br>${escapeHtml(text).replace(/\n/g, '<br>')}`;
  } else if (sender === 'user') {
    bubble.innerHTML = `<strong>🙋 나:</strong><br>${escapeHtml(text).replace(/\n/g, '<br>')}`;
  } else {
    bubble.textContent = text;
  }

  chatBox.appendChild(bubble);
  // 대화창 최하단으로 자동 스크롤
  chatBox.scrollTop = chatBox.scrollHeight;
  return bubble;
}

/**
 * Q&A 폼 이벤트 바인딩 및 OpenAI Q&A API 호출 함수
 */
function setupQAForm() {
  const form = document.getElementById('qa-form');
  const subjectInput = document.getElementById('qa-subject');
  const questionInput = document.getElementById('qa-question');
  const submitBtn = document.getElementById('qa-submit-btn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const subject = subjectInput?.value?.trim();
    const question = questionInput?.value?.trim();

    // 1. 유효성 검사
    if (!subject) {
      showToast('과목명을 입력해주세요. (예: 수학, 영어, 코딩)', 'error');
      subjectInput?.focus();
      return;
    }

    if (!question) {
      showToast('질문 내용을 입력해주세요.', 'error');
      questionInput?.focus();
      return;
    }

    // 2. 화면에 사용자 질문 말풍선 즉시 추가
    appendChatMessage(`[${subject}] ${question}`, 'user');

    // 3. 임시 로딩 말풍선 표시
    const chatBox = document.getElementById('qa-chat-box');
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble ai';
    loadingBubble.innerHTML = '<span class="spinner spinner-primary"></span> <span style="color: var(--text-secondary); margin-left: 8px;">AI 튜터가 답변을 작성 중입니다...</span>';
    chatBox.appendChild(loadingBubble);
    chatBox.scrollTop = chatBox.scrollHeight;

    // 버튼 비활성화
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> <span>답변 생성 중...</span>';
    }

    try {
      // 4. 백엔드 /api/qa 호출
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: subject,
          question: question
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '답변 생성에 실패했습니다.');
      }

      // 로딩 말풍선 제거 후 실제 답변 말풍선 추가
      loadingBubble.remove();
      appendChatMessage(result.answer, 'ai');

      // 질문 입력창 초기화
      if (questionInput) {
        questionInput.value = '';
        questionInput.focus();
      }

    } catch (error) {
      console.error('Q&A 처리 실패:', error);
      loadingBubble.remove();
      appendChatMessage(`⚠️ 오류: ${error.message || '답변을 불러오지 못했습니다.'}`, 'ai');
      showToast(error.message || '질문 전송 중 오류가 발생했습니다.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>질문 전송하기</span>';
      }
    }
  });
}

