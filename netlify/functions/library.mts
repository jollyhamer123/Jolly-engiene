import { randomBytes, createHash } from 'node:crypto';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { library } from '../../db/schema.js';

export default async (request: Request) => {
  const url = new URL(request.url);
  if (!['GET', 'POST', 'DELETE'].includes(request.method)) return new Response(null, { status: 405 });
  if (request.method !== 'GET' && request.headers.get('origin') !== url.origin) return new Response(null, { status: 403 });
  const cookieName = url.protocol === 'https:' ? '__Host-jolly-visitor' : 'jolly-visitor';
  const existing = request.headers.get('cookie')?.split(';').map(c => c.trim()).find(c => c.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  const visitor = existing && /^[a-f0-9]{64}$/.test(existing) ? existing : randomBytes(32).toString('hex');
  const owner = createHash('sha256').update(visitor).digest('hex');
  const headers = new Headers({ 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' });
  if (visitor !== existing) headers.set('Set-Cookie', `${cookieName}=${visitor}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${url.protocol === 'https:' ? '; Secure' : ''}`);
  const reply = (data: unknown, status = 200) => Response.json(data, { status, headers });
  const kind = url.searchParams.get('kind');
  if (kind !== 'history' && kind !== 'bookmark') return reply({ error: 'Invalid collection.' }, 400);
  const scope = and(eq(library.owner, owner), eq(library.kind, kind));
  try {
    if (request.method === 'GET') {
      const rows = await db.select({ id: library.id, view: library.view, value: library.value, title: library.title, createdAt: library.createdAt }).from(library).where(scope).orderBy(desc(library.createdAt)).limit(200);
      return reply({ items: rows });
    }
    if (request.method === 'DELETE') {
      const id = url.searchParams.get('id');
      if (id && !/^[a-f0-9-]{36}$/i.test(id)) return reply({ error: 'Invalid item.' }, 400);
      await db.delete(library).where(id ? and(scope, eq(library.id, id)) : scope);
      return reply({ ok: true });
    }
    const raw = await request.text();
    if (raw.length > 12000) return reply({ error: 'Item is too long.' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return reply({ error: 'Invalid item.' }, 400); }
    if (!body || !['results', 'ai', 'page'].includes(body.view) || typeof body.value !== 'string' || !body.value.trim() || body.value.length > 4000) return reply({ error: 'Invalid item.' }, 400);
    if (body.view === 'page') {
      try { if (!['http:', 'https:'].includes(new URL(body.value).protocol)) throw new Error(); } catch { return reply({ error: 'Invalid web address.' }, 400); }
    }
    if (kind === 'bookmark') {
      const [found] = await db.select({ id: library.id }).from(library).where(and(scope, eq(library.view, body.view), eq(library.value, body.value))).limit(1);
      if (found) return reply({ ok: true });
    }
    await db.insert(library).values({ owner, kind, view: body.view, value: body.value.trim(), title: String(body.title || body.value).slice(0, 300) });
    // Keep recent history bounded per visitor; bookmarks are removed explicitly.
    if (kind === 'history') {
      const older = await db.select({ id: library.id }).from(library).where(scope).orderBy(desc(library.createdAt)).offset(200);
      for (const row of older) await db.delete(library).where(and(scope, eq(library.id, row.id)));
    }
    return reply({ ok: true }, 201);
  } catch {
    return reply({ error: 'Saved items are temporarily unavailable. Please try again.' }, 503);
  }
};
