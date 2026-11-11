# 01. 프로젝트 생성 지침 (Project Setup Guidelines)

## 1. 폴더 및 디렉토리 구조
프로젝트 루트 디렉토리는 아래 파일 및 폴더 구조를 반드시 유지해야 합니다.

```text
ai-learning-planner/
├── api/                   # Vercel Serverless Functions (Node.js 백엔드)
│   ├── generate-plan.js   # 학습 로드맵 및 스케줄 생성 API
│   └── qa.js              # 학습 질문 답변 API
├── public/                # 프론트엔드 정적 자원
│   ├── css/
│   │   ├── style.css      # 기본 및 레이아웃 스타일
│   │   └── components.css # 폼, 카드, 모달, 토스트 스타일
│   ├── js/
│   │   ├── app.js         # 메인 실행 및 이벤트 연결
│   │   ├── planner.js     # 로드맵/스케줄/달성률 계산 로직
│   │   ├── qa.js          # Q&A 질문답변 처리 로직
│   │   ├── feedback.js    # Supabase 피드백 연동 로직
│   │   └── supabaseClient.js # Supabase 클라이언트 초기화
│   └── index.html         # 단일 페이지 메인 HTML
├── .env.example           # 환경 변수 템플릿
├── package.json           # Node.js 의존성 및 스크립트 정의
├── vercel.json            # Vercel 배포 설정 파일
├── AGENTS.md              # AI 작업 규칙 문서
└── PRD.md                 # 제품 요구사항 정의서
```

---

## 2. 환경 설정 파일 작성 규격

### `package.json`
```json
{
  "name": "ai-learning-planner",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "vercel dev"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "openai": "^4.28.0"
  }
}
```

### `.env.example`
```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 3. 검증 및 완료 기준
- [ ] `npm install` 실행 시 오류 없이 필요한 패키지가 정상 설치되는가?
- [ ] 디렉토리 및 파일 이름이 가이드라인과 100% 일치하는가?
- [ ] 개발 환경 변수가 `.env.local` 파일로 안전하게 관리되는가?