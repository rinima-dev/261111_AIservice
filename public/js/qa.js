// ==============================================================================
// public/js/qa.js
// 학습 과목 질의응답(Q&A) 챗봇 처리 모듈
// ==============================================================================

/**
 * AI의 답변 텍스트 중 마크다운 문법(**볼드**, *기울임*, `코드` 등)을
 * 안전하고 가독성 좋은 HTML 태그로 변환해 주는 헬퍼 함수
 * @param {string} rawText - 원본 텍스트
 * @returns {string} 서식이 적용된 HTML 문자열
 */
function formatMarkdownText(rawText) {
  if (!rawText) return '';

  // 1. 보안을 위해 먼저 HTML 특수문자(<, >, & 등)를 이스케이프 처리
  let formatted = escapeHtml(rawText);

  // 2. **볼드 텍스트** 변환: **단어** -> <strong class="ai-highlight">단어</strong>
  // 정규식 설명: \*\*(.+?)\*\* 는 두 개의 별표 사이에 있는 내용을 찾아서 태그로 감쌉니다.
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong class="ai-highlight">$1</strong>');

  // 3. *기울임 텍스트* 변환: *단어* -> <em>단어</em>
  formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // 4. `인라인 코드/공식` 변환: `코드` -> <code class="ai-code">$1</code>
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="ai-code">$1</code>');

  // 5. 줄바꿈 문자(\n)를 HTML 줄바꿈(<br>)으로 변환
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

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
    // 마크다운 파싱을 적용하여 볼드체와 줄바꿈을 예쁘게 표현
    bubble.innerHTML = `<strong>🤖 AI 튜터:</strong><br>${formatMarkdownText(text)}`;
  } else if (sender === 'user') {
    // 사용자가 입력한 질문도 줄바꿈 보존
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
  const clearBtn = document.getElementById('clear-qa-btn');

  if (!form) return;

  // 이전 대화 지우기 버튼 이벤트 바인딩
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const chatBox = document.getElementById('qa-chat-box');
      if (chatBox) {
        chatBox.innerHTML = `
          <div class="chat-bubble system">
            궁금한 과목과 질문을 입력하시면 AI 튜터가 친절하게 설명해 드립니다.
          </div>`;
        showToast('대화 내용이 초기화되었습니다.', 'success');
      }
    });
  }

  // 질문 전송 폼 제출 이벤트 바인딩
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const subject = subjectInput?.value?.trim();
    const question = questionInput?.value?.trim();

    // 1. 유효성 검사 (입력값 누락 방지)
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

    // 3. 임시 로딩 말풍선 표시 (사용자 경험 개선)
    const chatBox = document.getElementById('qa-chat-box');
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble ai';
    loadingBubble.innerHTML = '<span class="spinner spinner-primary"></span> <span style="color: var(--text-secondary); margin-left: 8px;">AI 튜터가 답변을 작성 중입니다...</span>';
    chatBox.appendChild(loadingBubble);
    chatBox.scrollTop = chatBox.scrollHeight;

    // 전송 버튼 비활성화 (중복 클릭 방지)
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> <span>답변 생성 중...</span>';
    }

    try {
      // 4. Node.js 백엔드 /api/qa 서버리스 함수 호출
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

      // 로딩 말풍선 제거 후 실제 AI 답변 말풍선 추가 (마크다운 파싱 적용)
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
      // 전송 버튼 복원
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>질문 전송하기</span>';
      }
    }
  });
}
