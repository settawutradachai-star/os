import pool from '@/lib/db';

export async function POST(req: Request) {
  const { student_id, course_id, item_ids } = await req.json();

  if (!student_id || !Array.isArray(item_ids) || item_ids.length === 0) {
    return Response.json({ success: false, error: 'missing_parameters' }, { status: 400 });
  }

  try {
    await pool.query(
      `UPDATE paid_tasks SET ran_at = NOW()
       WHERE student_id = $1
         AND course_id = $2
         AND itemid = ANY($3::int[])
         AND ran_at IS NULL`,
      [student_id, Number(course_id ?? 0), item_ids.map(Number)]
    );
    return Response.json({ success: true });
  } catch (err) {
    console.error('[mark-ran]', err);
    return Response.json({ success: false, error: 'server_error' }, { status: 500 });
  }
}
