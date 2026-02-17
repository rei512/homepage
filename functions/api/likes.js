// Cloudflare Pages Functions - イイネ（Like）API
// D1データベースを使用して記事ごとのイイネ数をカウント

export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  // OPTIONSリクエスト（CORS preflight）への対応
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // Refererチェック（セキュリティ対策）
  const referer = request.headers.get('Referer');
  const allowedHosts = ['deltav-lab.org', 'www.deltav-lab.org', 'blog.deltav-lab.org', 'localhost'];
  if (!referer) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
  }
  try {
    const url = new URL(referer);
    if (!allowedHosts.includes(url.hostname)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
  }

  // D1が設定されていない場合のフォールバック
  if (!env.DB) {
    return new Response(JSON.stringify({ count: 0, error: 'Database not configured' }), {
      headers,
    });
  }

  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const slug = url.searchParams.get('slug');
      if (!slug) {
        return new Response(JSON.stringify({ error: 'slug required' }), {
          status: 400,
          headers,
        });
      }
      const row = await env.DB.prepare(
        'SELECT count FROM likes WHERE slug = ?'
      ).bind(slug).first();
      return new Response(JSON.stringify({ count: row?.count || 0 }), { headers });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const slug = body.slug;
      if (!slug || typeof slug !== 'string' || slug.length > 200) {
        return new Response(JSON.stringify({ error: 'Invalid slug' }), {
          status: 400,
          headers,
        });
      }
      // UPSERT: 存在しなければ挿入、存在すればインクリメント
      await env.DB.prepare(
        'INSERT INTO likes (slug, count) VALUES (?, 1) ON CONFLICT(slug) DO UPDATE SET count = count + 1'
      ).bind(slug).run();

      const row = await env.DB.prepare(
        'SELECT count FROM likes WHERE slug = ?'
      ).bind(slug).first();
      return new Response(JSON.stringify({ count: row?.count || 0 }), { headers });
    }

    if (request.method === 'DELETE') {
      const body = await request.json();
      const slug = body.slug;
      if (!slug || typeof slug !== 'string' || slug.length > 200) {
        return new Response(JSON.stringify({ error: 'Invalid slug' }), {
          status: 400,
          headers,
        });
      }
      // デクリメント（0未満にはしない）
      await env.DB.prepare(
        'UPDATE likes SET count = MAX(0, count - 1) WHERE slug = ?'
      ).bind(slug).run();

      const row = await env.DB.prepare(
        'SELECT count FROM likes WHERE slug = ?'
      ).bind(slug).first();
      return new Response(JSON.stringify({ count: row?.count || 0 }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });

  } catch (error) {
    console.error('Likes API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', count: 0 }), {
      status: 500,
      headers,
    });
  }
}
