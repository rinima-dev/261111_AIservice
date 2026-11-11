# 04. 기능 구현 지침 - OpenAI API 연동 (AI Integration Guidelines)

## 1. 백엔드 서버리스 API 엔드포인트 설계

### 엔드포인트 1: `/api/generate-plan` (플래너 생성)
- **요청 방식**: POST
- **요청 본문 (JSON)**:
  ```json
  {
    "goal": "문자열",
    "durationDays": 숫자,
    "dailyHours": 숫자,
    "currentLevel": "문자열"
  }
  ```
- **OpenAI 프롬프트 요구사항**:
  - 반드시 JSON 포맷으로 응답하도록 `response_format: { "type": "json_object" }` 설정
  - 단계별 로드맵 배열(`roadmap`)과 일자별 할 일 배열(`dailyTasks`)을 포함한 JSON 반환하도록 프롬프트 작성

### 엔드포인트 2: `/api/qa` (과목 질의응답)
- **요청 방식**: POST
- **요청 본문 (JSON)**:
  ```json
  {
    "subject": "문자열 (예: 수학, 영어, 코딩)",
    "question": "사용자의 질문 내용"
  }
  ```
- **OpenAI 프롬프트 요구사항**:
  - 친절하고 이해하기 쉬운 설명 제공
  - 불필요한 인사말을 줄이고 핵심 개념 위주로 답변

---

## 2. 예외 및 에러 처리 규격
- `OPENAI_API_KEY` 환경 변수가 누락된 경우: HTTP 500 상태코드 및 `{ "error": "AI 서비스 설정 오류가 발생했습니다." }` 반환
- API 요청 제한(Rate Limit) 또는 토큰 초과 시: HTTP 429/500 상태코드 및 `{ "error": "AI 요청이 많아 잠시 후 다시 시도해주세요." }` 반환

---

## 3. 검증 기준
- [ ] OpenAI API 키가 프론트엔드 자바스크립트 코드에 노출되지 않고 Node.js 백엔드(`process.env`)에서만 처리되는가?
- [ ] AI 응답 대기 시간 동안 프론트엔드에 로딩 스피너 및 입력 불가 처리가 정상 적용되는가?