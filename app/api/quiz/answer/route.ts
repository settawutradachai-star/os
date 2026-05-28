// GET — kept for backward compat
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token  = searchParams.get('token') ?? '';
  const itemid = searchParams.get('itemid') ?? '';
  if (!token || !itemid) return Response.json({ error: 'missing_parameters' }, { status: 400 });
  const res = await fetch(`https://e-ed.e-tech.ac.th/api/quiz/${itemid}/answer?token=${token}`);
  return Response.json(await res.json());
}

// POST — fetch questions + extract correct answers + submit in one round trip
export async function POST(req: Request) {
  const { token, itemid, recid, openid, course_id } = await req.json();
  if (!token || !itemid) return Response.json({ error: 'missing_parameters' }, { status: 400 });

  try {
    // Step 1: fetch quiz questions (old endpoint, returns array with choices_show_answer)
    const quizUrl = `https://e-ed.e-tech.ac.th/api/quiz/${itemid}/answer?token=${token}`;
    const quizRes = await fetch(quizUrl);

    const ct = quizRes.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      console.warn('[quiz] non-JSON from quiz API. status:', quizRes.status, 'url:', quizUrl);
      return Response.json({ success: false, error: 'quiz_api_error', skipped: true });
    }

    const quizData = await quizRes.json();
    console.log('[quiz raw]', JSON.stringify(quizData).slice(0, 300));

    if (!Array.isArray(quizData) || quizData.length === 0) {
      console.warn('[quiz] no questions for item', itemid);
      return Response.json({ success: false, error: 'no_questions', skipped: true });
    }

    // Step 2: build answers using PHP format — choices_show_answer where answer === 'Y'
    const ans = quizData.map((q: any) => {
      const correct = q.choices_show_answer?.find((c: any) => c.answer === 'Y');
      return correct ? { quizid: q.quizid, quiz_type: q.quiz_type, ans: correct.no } : null;
    }).filter(Boolean);

    console.log('[quiz] questions:', quizData.length, 'answers mapped:', ans.length);

    if (ans.length === 0) {
      console.warn('[quiz] no correct answers found for item', itemid);
      return Response.json({ success: false, error: 'no_answers', skipped: true });
    }

    // Step 3: submit answers
    const sendRes = await fetch(
      `https://e-ed.e-tech.ac.th/api/quiz/v2/${itemid}/sendAnswer?token=${token}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          recid:    Number(recid),
          itemid,
          openid,
          courseid: Number(course_id ?? 0),
          ans,
        }),
      }
    );

    const sendCt = sendRes.headers.get('content-type') ?? '';
    if (!sendCt.includes('application/json')) {
      console.warn('[quiz] sendAnswer returned non-JSON for item', itemid);
      return Response.json({ success: false, error: 'send_error', skipped: true });
    }

    const sendData = await sendRes.json();
    console.log('[quiz] result:', sendData);
    return Response.json(sendData);
  } catch (err) {
    console.error('[quiz] error for item', itemid, err);
    return Response.json({ success: false, error: 'exception', skipped: true });
  }
}
