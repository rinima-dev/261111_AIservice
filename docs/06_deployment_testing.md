# 06. 배포 및 검증 지침 (Deployment & Testing Guidelines)

## 1. Vercel 배포 설정
- **Framework Preset**: Other (또는 Node.js)
- **Root Directory**: `./`
- **Environment Variables (환경 변수)**:
  - `OPENAI_API_KEY`: OpenAI API Key 입력
  - `SUPABASE_URL`: Supabase 프로젝트 URL
  - `SUPABASE_ANON_KEY`: Supabase Anonymous Public Key

---

## 2. 시나리오별 검증 체크리스트 (Test Cases)

| 테스트 ID | 테스트 시나리오 | 예상 결과 | 합격/불합격 기준 |
| :--- | :--- | :--- | :--- |
| **TC-01** | 빈 항목으로 학습 목표 생성 버튼 클릭 | 화면 상단에 에러 알림 표시 ("모든 항목을 입력해주세요.") | 폼 제출 차단 |
| **TC-02** | 유효한 값 입력 후 플래너 생성 | 5초 이내에 로드맵 카드 및 일일 스케줄 표시 | 정상 출력 |
| **TC-03** | 일일 스케줄 체크박스 클릭 | 주간/월간 달성률 퍼센티지 즉시 변경 | LocalStorage 저장 |
| **TC-04** | AI 과목 질문 입력 후 전송 | 질문에 대한 AI 설명이 챗봇 창에 출력 | 답변 정상 표시 |
| **TC-05** | 비로그인 상태로 피드백 작성 | Supabase DB 저장 및 화면 하단 최신순 목록 반영 | 실시간 반영 |
| **TC-06** | 잘못된 API 키 설정 환경에서 시도 | 화면에 친절한 오류 안내 문구 표시 | 앱 다운 방지 |

---

## 3. 최종 완료 승인 기준
- Vercel 로컬 테스트 명령(`vercel dev`) 시 모든 기능이 에러 없이 동작해야 함.
- 배포된 URL 접속 시 Chrome, Edge, Safari 브라우저에서 콘솔 에러 없이 작동해야 함.