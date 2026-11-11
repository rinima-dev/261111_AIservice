// ==============================================================================
// api/qa.js
// Vercel Serverless Function - AI 과목 질의응답(Q&A) 튜터 API
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

  // 2. 요청 본문 파싱 및 입력값 검증
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: '올바른 JSON 형식이 아닙니다.' });
    }
  }

  const { subject, question } = body || {};

  if (!subject || !subject.trim()) {
    return res.status(400).json({ error: '과목명을 입력해주세요.' });
  }

  if (!question || !question.trim()) {
    return res.status(400).json({ error: '질문 내용을 입력해주세요.' });
  }

  // 3. OpenAI 클라이언트 호출
  try {
    const openai = new OpenAI({ apiKey: apiKey });

    const systemPrompt = `당신은 ${subject.trim()} 과목을 가르치는 친절하고 실력 있는 전문 AI 튜터입니다.
학생들의 질문에 대해 다음 지침을 반드시 지켜 답변하세요:
1. 불필요하고 긴 인사말은 생략하고, 바로 핵심 개념과 설명으로 시작하세요.
2. 초보자나 중고등학생도 쉽게 이해할 수 있도록 비유와 쉬운 예시를 적극 활용하세요.
3. 단계별 설명이 필요한 경우 글머리 기호(1., 2. 또는 -)를 사용하여 일목요연하게 정리하세요.
4. 마지막에는 학습자를 격려하는 따뜻한 응원 한 문장을 덧붙이세요.
5. 답변은 가독성 좋은 한국어로 작성하세요.`;

    const userMessage = `[과목]: ${subject.trim()}\n[질문]: ${question.trim()}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7
    });

    const answer = completion.choices[0]?.message?.content;
    if (!answer) {
      throw new Error('OpenAI로부터 답변을 생성하지 못했습니다.');
    }

    return res.status(200).json({
      subject: subject.trim(),
      answer: answer.trim()
    });

  } catch (error) {
    console.error('Q&A OpenAI API 호출 오류:', error);

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
      error: '질변 답변을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    });
  }
};

