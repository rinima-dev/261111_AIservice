# 03. 기능 구현 지침 - 학습 플래너 & 성과 분석 (Planner & Metrics Guidelines)

## 1. 입력 데이터 및 플래너 생성 데이터 구조
사용자가 폼을 제출할 때 백엔드로 전달되는 데이터 구조:
```javascript
const userInputs = {
  goal: "수능 대비 수학 I 개념 완강",
  durationDays: 14,
  dailyHours: 2,
  currentLevel: "기본 개념 50% 이해"
};
```

---

## 2. 상태 관리 및 로컬 저장 (LocalStorage)
- 로그인 기능이 없으므로 생성된 로드맵 및 스케줄 체크 상태는 브라우저의 `localStorage`에 저장합니다.
- 저장 키 이름: `ai_planner_data`
- 저장 데이터 구조 예시:
```json
{
  "goal": "수능 대비 수학 I 개념 완강",
  "roadmap": [
    { "step": 1, "title": "지수와 로그 개념 정리", "description": "기본 공식 암기 및 예제 풀이" }
  ],
  "tasks": [
    { "id": "task-1", "day": 1, "title": "지수 법칙 10문제 풀기", "completed": false }
  ]
}
```

---

## 3. 주간 및 월간 성과 분석 계산 공식
체크박스 클릭 시 즉시 수치를 다시 계산하여 화면에 반영해야 합니다.

- **일일 달성률 (%)**: $\left( \frac{\text{오늘 완료한 할 일 수}}{\text{오늘 전체 할 일 수}} \right) \times 100$
- **주간 성과 달성률 (%)**: $\left( \frac{\text{최근 7일간 완료한 할 일 수}}{\text{최근 7일간 전체 할 일 수}} \right) \times 100$
- **월간(전체) 성과 달성률 (%)**: $\left( \frac{\text{전체 완료한 할 일 수}}{\text{전체 할 일 수}} \right) \times 100$

---

## 4. 검증 기준
- [ ] 사용자가 할 일 체크박스를 누르면 달성률 퍼센티지가 즉시 갱신되는가?
- [ ] 브라우저를 새로고침해도 이전 로드맵과 체크 상태가 유지되는가?
- [ ] 할 일이 0개일 때 0으로 나누는 에러(`NaN`)가 발생하지 않는가?