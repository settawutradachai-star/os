import pool from '@/lib/db';
import {
  normalizeQuestions,
  QuizAnswerSubmission,
  QuizQuestion,
} from '@/lib/ai-quiz-solver';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Helper to fetch questions from /api/quiz/{itemid}
async function fetchQuestions(
  itemid: string | number,
  token: string
): Promise<QuizQuestion[]> {
  try {
    const res = await fetch(
      `https://e-ed.e-tech.ac.th/api/quiz/${itemid}?token=${token}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) return [];

    const data = await res.json();
    return normalizeQuestions(data);
  } catch (err) {
    console.warn(`[quiz] fetchQuestions error for item ${itemid}:`, err);
    return [];
  }
}

// Helper to submit answers to e-ED
async function sendAnswersToEed(
  itemid: string | number,
  token: string,
  recid: number | string,
  openid: string | undefined,
  courseid: number | string,
  ans: QuizAnswerSubmission[],
  isLearn = true
) {
  const url =
    `https://e-ed.e-tech.ac.th/api/quiz/v2/${itemid}/sendAnswer?token=${token}`;

  /*
   * Build payload dynamically.
   *
   * Example:
   * {
   *   recid: 2124741,
   *   itemid: 623061,
   *   openid: "49066911100",
   *   courseid: 4906,
   *   ans: [
   *     {
   *       quizid: 912661,
   *       quiz_type: "M",
   *       ans: 4162125
   *     }
   *   ],
   *   is_learn: true
   * }
   */

  const payload = {
    recid: Number(recid),
    itemid: Number(itemid),
    openid,
    courseid: Number(courseid ?? 0),

    // Don't modify the number of questions.
    // Just normalize each answer into the new format.
    ans: ans.map((answer) => ({
      quizid: Number(answer.quizid),
      quiz_type: answer.quiz_type || 'M',
      ans: Number(answer.ans),
    })),

    is_learn: Boolean(isLearn),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify(payload),
  });

  const ct = res.headers.get('content-type') ?? '';

  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '');
    console.warn(
      `[quiz] sendAnswer returned non-JSON (${res.status}):`,
      text.slice(0, 500)
    );

    return {
      success: false,
      error: 'send_error',
      status: res.status,
    };
  }

  return await res.json();
}

// Helper to load answers from our Database cache
async function getCachedAnswers(
  itemid: string | number
): Promise<QuizAnswerSubmission[] | null> {
  try {
    const { rows } = await pool.query(
      'SELECT quizid, ans FROM quiz_answers WHERE itemid = $1',
      [Number(itemid)]
    );

    if (rows && rows.length > 0) {
      return rows.map((r: any) => ({
        quizid: Number(r.quizid),
        quiz_type: 'M',
        ans: Number(r.ans),
      }));
    }

    return null;
  } catch (err) {
    console.warn('[quiz] Failed to get cached answers:', err);
    return null;
  }
}

// Helper to save 100% correct answers into Database cache
async function saveAnswersToDb(
  itemid: string | number,
  answers: QuizAnswerSubmission[]
) {
  try {
    for (const a of answers) {
      await pool.query(
        `INSERT INTO quiz_answers (itemid, quizid, ans)
         VALUES ($1, $2, $3)
         ON CONFLICT (itemid, quizid)
         DO UPDATE SET
           ans = EXCLUDED.ans,
           created_at = NOW()`,
        [
          Number(itemid),
          Number(a.quizid),
          Number(a.ans),
        ]
      );
    }

    console.log(
      `[quiz] Saved ${answers.length} answers to DB for item ${itemid}`
    );
  } catch (err) {
    console.warn('[quiz] Failed to save answers to DB:', err);
  }
}

// GET — backward compatibility
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const token = searchParams.get('token') ?? '';
  const itemid = searchParams.get('itemid') ?? '';

  if (!token || !itemid) {
    return Response.json(
      { error: 'missing_parameters' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://e-ed.e-tech.ac.th/api/quiz/${itemid}?token=${token}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const ct = res.headers.get('content-type') ?? '';

    if (!ct.includes('application/json')) {
      return Response.json(
        { error: 'non_json' },
        { status: res.status }
      );
    }

    return Response.json(await res.json());
  } catch (err: any) {
    return Response.json(
      {
        error: err.message || 'fetch_error',
      },
      { status: 500 }
    );
  }
}

// POST — Quiz Solver
export async function POST(req: Request) {
  try {
    const body = await req.json();

    /*
     * Support both:
     *
     * courseid
     * course_id
     *
     * so old frontend code doesn't immediately break.
     */
    const token = body.token;
    const itemid = body.itemid;
    const recid = body.recid;
    const openid = body.openid;

    const courseid = body.courseid ?? body.course_id;

    const isLearn = body.is_learn ?? true;

    if (!token || !itemid) {
      return Response.json(
        { error: 'missing_parameters' },
        { status: 400 }
      );
    }

    if (courseid === undefined || courseid === null) {
      return Response.json(
        { error: 'missing_courseid' },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────
    // STEP 1: Check Database Cache
    // ─────────────────────────────────────────────

    const cachedAnswers = await getCachedAnswers(itemid);

    if (cachedAnswers && cachedAnswers.length > 0) {
      console.log(
        `[quiz] Found cached answers for item ${itemid} (${cachedAnswers.length})`
      );

      const sendRes = await sendAnswersToEed(
        itemid,
        token,
        recid,
        openid,
        courseid,
        cachedAnswers,
        isLearn
      );

      const s = Number(
        sendRes.score ??
          sendRes.total_score ??
          0
      );

      const ms = Number(
        sendRes.full_score ??
          sendRes.max_score ??
          cachedAnswers.length
      );

      if (s === ms && ms > 0) {
        return Response.json(sendRes);
      }
    }

    // ─────────────────────────────────────────────
    // STEP 2: Fetch Questions
    // ─────────────────────────────────────────────

    const questions = await fetchQuestions(itemid, token);

    if (!questions || questions.length === 0) {
      console.warn(
        `[quiz] No questions found for item ${itemid}`
      );

      return Response.json({
        success: false,
        error: 'no_questions',
        skipped: true,
      });
    }

    const totalQuestions = questions.length;

    console.log(
      `[quiz] Solving quiz ${itemid} with ${totalQuestions} questions...`
    );

    // ─────────────────────────────────────────────
    // STEP 3: Baseline
    // ─────────────────────────────────────────────

    let workingAnswers: QuizAnswerSubmission[] =
      questions.map((q) => {
        const choices = q.choices || [];

        const c1 =
          choices[0] || {
            no: Number(q.quizid),
          };

        return {
          quizid: Number(q.quizid),
          quiz_type: q.quiz_type || 'M',
          ans: Number(c1.no),
        };
      });

    let currentResult = await sendAnswersToEed(
      itemid,
      token,
      recid,
      openid,
      courseid,
      workingAnswers,
      isLearn
    );

    let currentScore = Number(
      currentResult.score ??
        currentResult.total_score ??
        0
    );

    const maxScore = Number(
      currentResult.full_score ??
        currentResult.max_score ??
        totalQuestions
    );

    console.log(
      `[quiz] Baseline score: ${currentScore}/${maxScore}`
    );

    if (currentScore === maxScore && maxScore > 0) {
      await saveAnswersToDb(
        itemid,
        workingAnswers
      );

      return Response.json(currentResult);
    }

    // ─────────────────────────────────────────────
    // STEP 4: Find better answers
    // ─────────────────────────────────────────────

    for (let i = 0; i < totalQuestions; i++) {
      if (currentScore === maxScore) {
        break;
      }

      const q = questions[i];
      const choices = q.choices || [];

      if (choices.length <= 1) {
        continue;
      }

      let bestChoice = workingAnswers[i].ans;
      let bestScore = currentScore;

      const otherChoices = choices.filter(
        (c: any) =>
          Number(c.no) !== Number(bestChoice)
      );

      for (const choice of otherChoices) {
        workingAnswers[i].ans = Number(choice.no);

        const testRes = await sendAnswersToEed(
          itemid,
          token,
          recid,
          openid,
          courseid,
          workingAnswers,
          isLearn
        );

        const s = Number(
          testRes.score ??
            testRes.total_score ??
            0
        );

        if (s > bestScore) {
          console.log(
            `Q${i + 1} upgraded! ${bestScore} -> ${s}`
          );

          bestScore = s;
          bestChoice = Number(choice.no);
          currentScore = s;
          currentResult = testRes;

          break;
        }

        if (s < bestScore) {
          workingAnswers[i].ans = bestChoice;
          break;
        }

        workingAnswers[i].ans = bestChoice;
      }

      workingAnswers[i].ans = bestChoice;
      currentScore = bestScore;
    }

    console.log(
      `[quiz] Final score: ${currentScore}/${maxScore}`
    );

    if (currentScore === maxScore) {
      await saveAnswersToDb(
        itemid,
        workingAnswers
      );
    }

    return Response.json(currentResult);
  } catch (err: any) {
    console.error(
      '[quiz] Exception in quiz solver:',
      err
    );

    return Response.json(
      {
        success: false,
        error: err?.message || 'exception',
        skipped: true,
      },
      { status: 500 }
    );
  }
}

