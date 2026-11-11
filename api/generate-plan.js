// ==============================================================================
// api/generate-plan.js
// Vercel Serverless Function - AI 맞춤형 학습 플래너 생성 API
// (최대 180일/6개월 지원)
// ==============================================================================

const OpenAI = require('openai');
const { loadEnv } = require('./_env');

module.exports = async function handler(req, res) {
  // CORS 및 메서드 제어
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST 메서드만 지원합니다.' });
  }

  // 1. 환경 변수 로드
  loadEnv();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return res.status(500).json({
      error: 'AI 서비스 설정 오류가 발생했습니다. (.env 파일에 올바른 OPENAI_API_KEY를 입력해주세요.)'
    });
  }

  // 2. 요청 본문 파싱 및 입력값 유효성 검증
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: '올바른 JSON 형식이 아닙니다.' });
    }
  }

  const { goal, durationDays, dailyHours, currentLevel } = body || {};

  if (!goal || !durationDays || !dailyHours || !currentLevel) {
    return res.status(400).json({
      error: '모든 항목(학습 목표, 기간, 하루 학습 시간, 현재 학습 수준)을 입력해주세요.'
    });
  }

  const parsedDuration = parseInt(durationDays, 10);
  const parsedHours = parseFloat(dailyHours);

  // 최대 180일(6개월) 제한 적용
  if (isNaN(parsedDuration) || parsedDuration <= 0 || parsedDuration > 180) {
    return res.status(400).json({ error: '학습 기간은 1일부터 최대 180일(6개월)까지 설정 가능합니다.' });
  }

  if (isNaN(parsedHours) || parsedHours <= 0) {
    return res.status(400).json({ error: '하루 학습 시간은 0.5시간 이상이어야 합니다.' });
  }

  // 3. OpenAI 클라이언트 초기화 및 API 호출
  try {
    const openai = new OpenAI({ apiKey: apiKey });

    // 프롬프트 작성 (JSON 응답 강제)
    const systemPrompt = `당신은 대한민국 최고의 맞춤형 교육 커리큘럼 설계 전문가 및 AI 학습 플래너입니다.
사용자의 목표, 기간, 하루 가능 시간, 현재 수준을 바탕으로 실현 가능하고 체계적인 학습 로드맵과 일일 스케줄을 생성하세요.

반드시 다음 JSON 규격에 정확히 맞추어 응답해야 합니다:
{
  "goal": "${goal}",
  "roadmap": [
    {
      "step": 1,
      "title": "단계 제목 (예: 기초 개념 완성)",
      "description": "이 단계의 핵심 학습 내용 및 목표 상세 설명"
    }
  ],
  "tasks": [
    {
      "id": "task-1",
      "day": 1,
      "title": "구체적인 실천 과제 (예: 1단원 개념 강의 1~2강 수강 및 노트 필기)",
      "completed": false
    }
  ]
}

규칙:
1. roadmap은 전체 기간을 3~6개 단계(step)로 논리적으로 나눈 마일스톤이어야 합니다.
2. tasks는 1일차부터 ${parsedDuration}일차까지 매일 수행할 구체적인 과제를 생성하세요. (학습 기간이 긴 경우 중요한 주기별 실천 과제를 Day 1부터 Day ${parsedDuration}까지 고르게 분포되도록 작성하세요.)
3. 각 task의 id는 'task-1', 'task-2' 형태로 고유하게 부여하세요.
4. 모든 title과 description은 학습자가 명확하고 쉽게 실천할 수 있도록 친절하고 구체적인 한국어로 작성하세요.`;

    const userMessage = `[학습자 요청 정보]
- 학습 목표: ${goal}
- 총 학습 기간: ${parsedDuration}일 (최대 180일)
- 하루 학습 가능 시간: ${parsedHours}시간
- 현재 학습 수준/상태: ${currentLevel}

위 조건에 맞는 최고의 학습 로드맵과 1일차부터 ${parsedDuration}일차까지의 일일 실천 스케줄을 JSON으로 생성해주세요.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const replyContent = completion.choices[0]?.message?.content;
    if (!replyContent) {
      throw new Error('OpenAI로부터 응답 본문을 받지 못했습니다.');
    }

    const planData = JSON.parse(replyContent);

    // 응답 데이터 보정 (필수 키 보장)
    const finalData = {
      goal: planData.goal || goal,
      roadmap: Array.isArray(planData.roadmap) ? planData.roadmap : [],
      tasks: Array.isArray(planData.tasks) ? planData.tasks : []
    };

    return res.status(200).json(finalData);

  } catch (error) {
    console.error('플래너 생성 OpenAI API 호출 오류:', error);

    // Rate Limit 또는 토큰 관련 오류 분기
    if (error.status === 429) {
      return res.status(429).json({
        error: 'AI 요청이 많아 잠시 후 다시 시도해주세요. (OpenAI Rate Limit 초과)'
      });
    }

    if (error.status === 401) {
      return res.status(401).json({
        error: 'OpenAI API 키 인증에 실패했습니다. 키가 올바른지 확인해주세요.'
      });
    }

    return res.status(500).json({
      error: 'AI 학습 플래너 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
};
