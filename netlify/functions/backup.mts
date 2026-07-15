import { getStore } from '@netlify/blobs';

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB
const RETENTION_COUNT = 60;
const KEY_RE = /^\d{4}-\d{2}-\d{2}\.json$/;

/** 台灣時間（UTC+8）的今天日期 YYYY-MM-DD */
const taiwanToday = (): string => {
  const now = new Date(Date.now() + 8 * 3600 * 1000);
  return now.toISOString().slice(0, 10);
};

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });

const keyToDate = (key: string): string => key.replace(/\.json$/, '');

/** 列出所有快照 key，依日期新→舊排序 */
const listKeys = async (store: ReturnType<typeof getStore>): Promise<string[]> => {
  const { blobs } = await store.list();
  return blobs
    .map((b) => b.key)
    .filter((k) => KEY_RE.test(k))
    .sort()
    .reverse();
};

export default async (req: Request): Promise<Response> => {
  try {
    const expectedToken = process.env.BACKUP_TOKEN;
    if (!expectedToken) {
      return json(503, { error: 'BACKUP_TOKEN not configured' });
    }
    if (req.headers.get('x-backup-token') !== expectedToken) {
      return json(401, { error: 'unauthorized' });
    }

    const store = getStore('backups');
    const url = new URL(req.url);

    if (req.method === 'POST') {
      const body = await req.text();
      if (body.length > MAX_BODY_BYTES) {
        return json(413, { error: 'backup too large' });
      }
      try {
        JSON.parse(body);
      } catch {
        return json(400, { error: 'body is not valid JSON' });
      }

      const date = taiwanToday();
      await store.set(`${date}.json`, body);

      // 保留最新 RETENTION_COUNT 份，其餘刪除
      const keys = await listKeys(store);
      const stale = keys.slice(RETENTION_COUNT);
      await Promise.all(stale.map((k) => store.delete(k)));

      return json(200, { ok: true, date, kept: Math.min(keys.length, RETENTION_COUNT) });
    }

    if (req.method === 'GET') {
      if (url.searchParams.has('list')) {
        const keys = await listKeys(store);
        return json(200, keys.map((k) => ({ key: k, date: keyToDate(k) })));
      }

      let key: string | null = null;
      if (url.searchParams.has('latest')) {
        const keys = await listKeys(store);
        if (keys.length === 0) return json(404, { error: 'no backups yet' });
        key = keys[0];
      } else {
        const date = url.searchParams.get('date');
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return json(400, { error: 'missing ?list, ?latest or ?date=YYYY-MM-DD' });
        }
        key = `${date}.json`;
      }

      const data = await store.get(key);
      if (data === null) return json(404, { error: 'not found' });
      return new Response(data, {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-backup-date': keyToDate(key)
        }
      });
    }

    return json(405, { error: 'method not allowed' });
  } catch (err) {
    console.error('backup function error:', err);
    return json(500, { error: 'internal error' });
  }
};
