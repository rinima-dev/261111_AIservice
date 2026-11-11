# 🎓 AI 스마트 학습 플래너 (AI Learning Planner)

> OpenAI API(`gpt-4o-mini`)와 Supabase를 활용하여 맞춤형 학습 로드맵과 일일 스케줄을 생성하고, 익명 피드백을 실시간으로 주고받는 웹 서비스입니다.

---

## 📌 주요 기능 (Features)

1. **AI 맞춤형 학습 로드맵 & 스케줄 생성**
   - 학습 목표, 기간(일), 하루 학습 가능 시간(시간), 현재 수준을 입력하면 AI가 실현 가능한 3~5단계 로드맵과 일일 체크리스트를 자동 생성합니다.
   - OpenAI의 구조화된 JSON 모드를 활용하여 정형화된 데이터를 제공합니다.

2. **일일 스케줄 실시간 달성률 분석**
   - 매일 할 일을 완료하고 체크박스를 누르면 주간(최근 7일) 및 전체 목표 달성률(%)이 실시간 프로그레스 바로 갱신됩니다.
   - 별도의 회원가입 없이 브라우저의 `localStorage`에 자동 보관되어 페이지를 새로고침해도 학습 상태가 유지됩니다.

3. **학습 과목 Q&A AI 튜터**
   - 공부하다 막히는 수학 공식, 영어 문법, 코딩 개념 등을 질문하면 AI 튜터가 핵심 개념 위주로 이해하기 쉽게 답변해 줍니다.

4. **비로그인 익명 피드백 시스템**
   - 누구나 자유롭게 닉네임, 별점(1~5점), 한줄평을 남길 수 있습니다.
   - Supabase DB(PostgreSQL)의 RLS(Row Level Security) 정책을 기반으로 안전하게 저장되고 최신순으로 실시간 표시됩니다.

---

## 🛠️ 기술 스택 (Tech Stack)

| 구분 | 사용 기술 | 설명 |
| :--- | :--- | :--- |
| **프론트엔드** | HTML5, CSS3, Vanilla JavaScript (ES6+) | 외부 프레임워크(React, Tailwind 등) 없이 표준 웹 기술만으로 구현 |
| **백엔드** | Node.js (Vercel Serverless Functions) | `/api/generate-plan`, `/api/qa`, `/api/config` 엔드포인트 분리 및 API 키 보안 처리 |
| **AI 연동** | OpenAI API (`gpt-4o-mini`) | 플래너 JSON 구조 반환 및 Q&A 대화형 응답 |
| **데이터베이스** | Supabase (PostgreSQL) | 익명 사용자 INSERT/SELECT 허용 RLS 보안 정책 적용 |
| **배포 플랫폼** | Vercel | GitHub 연동 자동 배포 및 환경 변수 안전 관리 |

---

## 📂 프로젝트 폴더 구조

```text
웹 서비스 실습/
├── api/                       # Vercel Serverless Functions (Node.js 백엔드)
│   ├── _env.js                # 로컬 .env 환경 변수 로더
│   ├── config.js              # 프론트엔드용 Supabase 공개 정보 제공 API
│   ├── generate-plan.js       # AI 맞춤 플래너 생성 API
│   └── qa.js                  # AI 과목 질의응답 API
├── public/                    # 프론트엔드 정적 파일
│   ├── css/
│   │   ├── style.css          # 기본 레이아웃 및 반응형 디자인 시스템
│   │   └── components.css     # 카드, 폼, 프로그레스바, 별점, 토스트 UI
│   ├── js/
│   │   ├── supabaseClient.js  # Supabase 클라이언트 초기화 모듈
│   │   ├── feedback.js        # 비로그인 피드백 등록 및 최신순 조회 로직
│   │   ├── planner.js         # 로드맵/스케줄 렌더링, LocalStorage, 성과 분석
│   │   ├── qa.js              # Q&A 질문 전송 및 대화창 UI 로직
│   │   └── app.js             # 애플리케이션 진입점 및 이벤트 통합
│   └── index.html             # 메인 HTML 페이지
├── supabase/
│   └── migrations/
│       └── 001_create_feedbacks_table.sql # 피드백 테이블 생성 및 RLS 정책 SQL
├── .env                       # 로컬 환경 변수 파일 (Git 미포함)
├── .env.example               # 환경 변수 설정 템플릿
├── .gitignore                 # Git 추적 제외 파일 목록
├── package.json               # 프로젝트 의존성 정의
├── vercel.json                # Vercel 배포 및 라우팅 설정
├── AGENTS.md                  # AI 작업 규칙 문서
├── PRD.md                     # 제품 요구사항 정의서
└── README.md                  # 프로젝트 설명서 (현재 문서)
```

---

## 🚀 로컬 실행 방법 (Local Development)

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경 변수 설정 (`.env`)
프로젝트 루트의 `.env` 파일에 발급받으신 키를 입력합니다:
```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Supabase 테이블 생성
Supabase 대시보드의 **SQL Editor**에서 `supabase/migrations/001_create_feedbacks_table.sql`의 내용을 복사하여 실행합니다.

### 4. 로컬 서버 실행
```bash
npx vercel dev
```
브라우저에서 `http://localhost:3000`으로 접속하여 테스트할 수 있습니다.

---

## 🌐 Vercel 실서버 배포 방법 (Deployment)

1. 소스 코드를 GitHub 저장소에 푸시합니다.
2. [Vercel](https://vercel.com)에 로그인 후 해당 저장소를 Import합니다.
3. Vercel 프로젝트 설정의 **Environment Variables**에 아래 3개 변수를 등록합니다:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. **Deploy** 버튼을 누르면 정식 서비스 주소가 발급됩니다.

