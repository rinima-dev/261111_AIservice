# AGENTS.md - Antigravity AI 코딩 에이전트 작업 규칙

## 1. 역할 및 목표
본 프로젝트는 Node.js 백엔드, OpenAI API, Supabase DB를 활용하고 Vercel에 배포되는 **HTML/CSS/JS 기반 AI 학습 플래너** 개발 프로젝트입니다.
AI 코딩 에이전트의 주요 역할은 `PRD.md` 및 `docs/` 폴더 내의 6개 상세 가이드 문서에 명시된 지침을 엄격히 준수하여 코드를 작성, 테스트, 보완하는 것입니다.

---

## 2. 기본 작업 원칙 (General Principles)
1. **임의 추측 금지 (Zero Ambiguity)**: 명시된 요구사항 및 지침 이외의 기능을 임의로 추가하거나 변경하지 마십시오.
2. **순수 기술 스택 우선 (Vanilla First)**: 프론트엔드는 반드시 표준 HTML5, CSS3, 순수 Vanilla JavaScript (ES6+)만을 사용합니다. 명시적인 요청이 없는 한 React, Vue, Tailwind CSS 등의 외부 프레임워크를 도입하지 마십시오.
3. **철저한 예외 처리 (Robust Error Handling)**: 모든 비동기 요청(Fetch, API 호출, DB 연동)에는 반드시 `try...catch` 구문을 작성하고, 사용자 화면에 에러 메세지 토스트/모달을 띄워야 합니다.
4. **모듈화 및 명확한 파일 분리**: HTML(구조), CSS(스타일), JS(로직 및 API)를 명확히 분리하여 깔끔한 코드 구조를 유지합니다.

---

## 3. 개발 단계 및 순서 (Workflow Sequence)
1. **1단계**: 프로젝트 폴더 구조 생성 및 초기 설정 (`docs/01_project_setup.md`)
2. **2단계**: HTML 레이아웃 및 CSS 디자인 시스템 구축 (`docs/02_ui_ux_guidelines.md`)
3. **3단계**: Supabase DB 연동 및 로그인 없는 피드백 기능 구현 (`docs/05_feedback_supabase.md`)
4. **4단계**: Node.js 서버리스 API 구축 및 OpenAI API 연동 (`docs/04_ai_integration.md`)
5. **5단계**: 핵심 학습 플래너 로직, 성과 분석, LocalStorage 상태 관리 구현 (`docs/03_planner_features.md`)
6. **6단계**: Vercel 배포 설정 및 전체 검증 (`docs/06_deployment_testing.md`)

---

## 4. 완료 기준 (Definition of Done & Acceptance Criteria)
- [ ] `docs/01_project_setup.md`에 명시된 파일 경로 및 명명 규칙을 정확히 준수했는가?
- [ ] 데스크톱(>1024px), 태블릿(768px~1024px), 모바일(<768px) 환경에서 반응형 UI가 정상 동작하는가?
- [ ] 모든 입력 폼(학습 목표, Q&A, 피드백) 제출 전 필수값 검증(Validation)이 작동하는가?
- [ ] OpenAI API 응답 데이터가 로드맵, 일일 스케줄, 답변 창에 깔끔하게 출력되는가?
- [ ] Supabase에 비로그인 사용자의 피드백이 정상 저장되고, 화면 하단 최신순 목록에 바로 반영되는가?
- [ ] 에러 발생 시 사용자에게 친절한 한글 오류 메세지 안내창이 출력되는가?