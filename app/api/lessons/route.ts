import { cookies } from 'next/headers';
import { eedFetch } from '@/lib/eed-client';

async function getYoutubeDuration(videoId: string): Promise<number | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !videoId) return null;
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`
    );
    const data = await res.json();
    const iso = data?.items?.[0]?.contentDetails?.duration;
    if (!iso) return null;
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return null;
    const h = parseInt(match[1] ?? '0');
    const m = parseInt(match[2] ?? '0');
    const s = parseInt(match[3] ?? '0');
    return h * 3600 + m * 60 + s;
  } catch {
    return null;
  }
}

async function injectYoutubeDurations(lessons: any[]): Promise<void> {
  await Promise.all(
    lessons.map(async (lesson: any) => {
      if (lesson.lesson_type === 'Y' && lesson.video_id) {
        const ytDuration = await getYoutubeDuration(lesson.video_id);
        if (ytDuration && ytDuration > 1) {
          lesson.lenght_vdo = ytDuration;
          lesson.duration   = ytDuration;
        }
      }
      // ถ้ามี child/children/lessons ซ้อนอยู่ข้างใน ให้ inject ด้วย
      for (const key of ['child', 'children', 'lessons']) {
        if (Array.isArray(lesson[key])) {
          await injectYoutubeDurations(lesson[key]);
        }
      }
    })
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemid      = searchParams.get('itemid') ?? '';
  const recid       = searchParams.get('recid')  ?? '';
  const tokenParam  = searchParams.get('token')  ?? '';
  const cookieToken = cookies().get('eed_token')?.value;
  const authToken   = tokenParam || cookieToken;

  if (!authToken) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const data = await eedFetch(`/item/${itemid}/lessons?recid=${recid}`, authToken);

  if (Array.isArray(data)) {
    await injectYoutubeDurations(data);
  } else if (data && typeof data === 'object') {
    // บาง endpoint wrap ใน { data: [...] } หรือ { lessons: [...] }
    for (const key of ['data', 'lessons', 'items']) {
      if (Array.isArray((data as any)[key])) {
        await injectYoutubeDurations((data as any)[key]);
        break;
      }
    }
  }

  return Response.json(data);
}