/**
 * AI Quiz Solver for e-ED Quiz Questions
 * Supports Groq (100% Free, No Credit Card), OpenRouter, Google Gemini, OpenAI, and Smart Differential Algorithm.
 */

export interface QuizChoice {
  no: number;
  choiceno?: number;
  choice?: string;
  choice_text?: string;
  answer?: string;
  [key: string]: any;
}

export interface QuizQuestion {
  quizid: number | string;
  quiz_type?: string;
  question?: string;
  quiz_title?: string;
  quiz_name?: string;
  title?: string;
  choices?: QuizChoice[];
  choices_show_answer?: QuizChoice[];
  [key: string]: any;
}

export interface QuizAnswerSubmission {
  quizid: number | string;
  quiz_type: string;
  ans: number;
}

/**
 * Normalizes question list from e-ED /quiz/{itemid} response
 */
export function normalizeQuestions(rawData: any): QuizQuestion[] {
  if (!rawData) return [];
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData.data)) return rawData.data;
  if (Array.isArray(rawData.questions)) return rawData.questions;
  return [];
}

/**
 * Extracts and sorts choices list for a given question
 */
export function getQuestionChoices(q: QuizQuestion): { no: number; choiceno: number; text: string }[] {
  const list = q.choices || q.choices_show_answer || [];
  if (!Array.isArray(list)) return [];
  
  return list.map((c: any, index: number) => ({
    no: Number(c.no),
    choiceno: Number(c.choiceno ?? index + 1),
    text: cleanText(c.choice_text ?? c.choice ?? c.name ?? c.title ?? `ตัวเลือก ${index + 1}`),
  })).sort((a, b) => a.choiceno - b.choiceno);
}

/**
 * Cleans markdown/HTML tags from text
 */
export function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses JSON array safely from AI response
 */
function parseJsonArrayFromAi(text: string): Array<{ quizid: any; ans: number }> | null {
  try {
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.answers)) return parsed.answers;
    if (parsed && Array.isArray(parsed.data)) return parsed.data;
    return null;
  } catch {
    const match = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {}
    }
    return null;
  }
}

/**
 * Builds prompt for AI models
 */
function buildQuizPrompt(questions: QuizQuestion[]): string {
  let prompt = `คุณคือผู้เชี่ยวชาญการทำข้อสอบ จงวิเคราะห์และตอบคำถามปรนัยต่อไปนี้ให้ถูกต้องที่สุด\n`;
  prompt += `ตอบกลับเป็น JSON array เท่านั้นในรูปแบบตัวอย่างนี้:\n`;
  prompt += `[\n  {"quizid": 123, "ans": 2},\n  {"quizid": 124, "ans": 4}\n]\n\n`;
  prompt += `โดย "ans" คือลำดับตัวเลือก (1, 2, 3, 4) ที่ถูกต้องที่สุด\n\n`;
  prompt += `รายการข้อสอบ:\n`;

  questions.forEach((q, idx) => {
    const qId = q.quizid ?? idx + 1;
    const qTitle = cleanText(q.question || q.quiz_title || q.quiz_name || q.title || `คำถามข้อที่ ${idx + 1}`);
    const choices = getQuestionChoices(q);

    prompt += `\nข้อที่ ${idx + 1} (quizid: ${qId}):\n`;
    prompt += `คำถาม: ${qTitle}\n`;
    if (choices.length > 0) {
      prompt += `ตัวเลือก:\n`;
      choices.forEach((c) => {
        prompt += `  ${c.choiceno}. ${c.text}\n`;
      });
    } else {
      prompt += `  1. จริง / ถูก\n  2. เท็จ / ผิด\n`;
    }
  });

  return prompt;
}

/**
 * Maps AI raw output (which selects choiceno 1..4) to QuizAnswerSubmission (using choice.no)
 */
function mapAiResponseToSubmissions(
  questions: QuizQuestion[],
  rawResponse: string
): QuizAnswerSubmission[] {
  const parsed = parseJsonArrayFromAi(rawResponse) || [];
  const answerMap = new Map<string | number, number>();

  parsed.forEach((item: any) => {
    if (item && item.quizid !== undefined && item.ans !== undefined) {
      answerMap.set(String(item.quizid), Number(item.ans));
    }
  });

  return questions.map((q, idx) => {
    const qId = q.quizid ?? idx + 1;
    const choices = getQuestionChoices(q);
    const chosenChoiceNo = answerMap.get(String(qId)) ?? 1;

    // Match chosen choiceno (e.g. 1..4) with choice.no
    const matchedChoice = choices.find((c) => c.choiceno === chosenChoiceNo) || choices[0];
    const finalAnsId = matchedChoice ? matchedChoice.no : Number(q.choices?.[0]?.no ?? 1);

    return {
      quizid: q.quizid,
      quiz_type: q.quiz_type || 'M',
      ans: finalAnsId,
    };
  });
}

/**
 * Solves quiz questions using Groq API (100% Free, Fast, No Credit Card needed)
 */
async function solveWithGroq(
  questions: QuizQuestion[],
  apiKey: string
): Promise<QuizAnswerSubmission[] | null> {
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const promptText = buildQuizPrompt(questions);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert exam solver in Thai curriculum. Output ONLY a valid JSON array.',
        },
        {
          role: 'user',
          content: promptText,
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const rawResponse = data.choices?.[0]?.message?.content;
  if (!rawResponse) return null;

  return mapAiResponseToSubmissions(questions, rawResponse);
}

/**
 * Solves quiz questions using OpenRouter API
 */
async function solveWithOpenRouter(
  questions: QuizQuestion[],
  apiKey: string
): Promise<QuizAnswerSubmission[] | null> {
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free';
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const promptText = buildQuizPrompt(questions);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert exam solver in Thai curriculum. Output ONLY a valid JSON array.',
        },
        {
          role: 'user',
          content: promptText,
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const rawResponse = data.choices?.[0]?.message?.content;
  if (!rawResponse) return null;

  return mapAiResponseToSubmissions(questions, rawResponse);
}

/**
 * Solves quiz questions using Google Gemini API
 */
async function solveWithGemini(
  questions: QuizQuestion[],
  apiKey: string
): Promise<QuizAnswerSubmission[] | null> {
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const promptText = buildQuizPrompt(questions);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawResponse) return null;

  return mapAiResponseToSubmissions(questions, rawResponse);
}

/**
 * Solves quiz questions using OpenAI API
 */
async function solveWithOpenAI(
  questions: QuizQuestion[],
  apiKey: string
): Promise<QuizAnswerSubmission[] | null> {
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';
  const promptText = buildQuizPrompt(questions);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert exam solver in Thai curriculum. Respond ONLY with a valid JSON array.',
        },
        {
          role: 'user',
          content: promptText,
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const rawResponse = data.choices?.[0]?.message?.content;
  if (!rawResponse) return null;

  return mapAiResponseToSubmissions(questions, rawResponse);
}

/**
 * Main AI solver dispatcher
 */
export async function solveQuizWithAI(
  questions: QuizQuestion[]
): Promise<QuizAnswerSubmission[]> {
  if (!questions || questions.length === 0) return [];

  // 1. Try Groq (Free, No Credit Card)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const results = await solveWithGroq(questions, groqKey);
      if (results && results.length > 0) {
        console.log(`[ai-solver] Solved ${results.length} questions with Groq (Llama 3.3)`);
        return results;
      }
    } catch (e) {
      console.warn('[ai-solver] Groq failed:', e);
    }
  }

  // 2. Try OpenRouter
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    try {
      const results = await solveWithOpenRouter(questions, openrouterKey);
      if (results && results.length > 0) {
        console.log(`[ai-solver] Solved ${results.length} questions with OpenRouter`);
        return results;
      }
    } catch (e) {
      console.warn('[ai-solver] OpenRouter failed:', e);
    }
  }

  // 3. Try Gemini
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_AI_API_KEY;

  if (geminiKey) {
    try {
      const results = await solveWithGemini(questions, geminiKey);
      if (results && results.length > 0) {
        console.log(`[ai-solver] Solved ${results.length} questions with Gemini`);
        return results;
      }
    } catch (e) {
      console.warn('[ai-solver] Gemini failed:', e);
    }
  }

  // 4. Try OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const results = await solveWithOpenAI(questions, openaiKey);
      if (results && results.length > 0) {
        console.log(`[ai-solver] Solved ${results.length} questions with OpenAI`);
        return results;
      }
    } catch (e) {
      console.warn('[ai-solver] OpenAI failed:', e);
    }
  }

  // 5. Fallback: Choice 1
  console.log('[ai-solver] Using choice-1 fallback');
  return questions.map((q) => {
    const choices = getQuestionChoices(q);
    const firstChoice = choices[0] || { no: Number(q.choices?.[0]?.no ?? 1) };
    return {
      quizid: q.quizid,
      quiz_type: q.quiz_type || 'M',
      ans: firstChoice.no,
    };
  });
}
