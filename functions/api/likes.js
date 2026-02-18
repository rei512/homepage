// Cloudflare Pages Functions - イイネ（Like）API
// D1データベースを使用して記事ごとのイイネ数をカウント
// IPベースで1記事につき1回のみいいね可能

async function hashIP(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + '-likes-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
    return new Response(JSON.stringify({ count: 0, liked: false, error: 'Database not configured' }), {
      headers,
    });
  }

  try {
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashIP(clientIP);

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

      // このIPが既にいいね済みか確認
      const likeRecord = await env.DB.prepare(
        'SELECT 1 FROM like_actions WHERE ip_hash = ? AND slug = ?'
      ).bind(ipHash, slug).first();

      return new Response(JSON.stringify({
        count: row?.count || 0,
        liked: !!likeRecord,
      }), { headers });
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

      // 既にいいね済みか確認
      const existing = await env.DB.prepare(
        'SELECT 1 FROM like_actions WHERE ip_hash = ? AND slug = ?'
      ).bind(ipHash, slug).first();
      if (existing) {
        const row = await env.DB.prepare(
          'SELECT count FROM likes WHERE slug = ?'
        ).bind(slug).first();
        return new Response(JSON.stringify({ count: row?.count || 0, liked: true }), { headers });
      }

      // いいね記録を追加
      await env.DB.prepare(
        'INSERT INTO like_actions (ip_hash, slug) VALUES (?, ?)'
      ).bind(ipHash, slug).run();

      // カウントをインクリメント
      await env.DB.prepare(
        'INSERT INTO likes (slug, count) VALUES (?, 1) ON CONFLICT(slug) DO UPDATE SET count = count + 1'
      ).bind(slug).run();

      const row = await env.DB.prepare(
        'SELECT count FROM likes WHERE slug = ?'
      ).bind(slug).first();
      return new Response(JSON.stringify({ count: row?.count || 0, liked: true }), { headers });
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

      // いいね記録がなければ何もしない
      const existing = await env.DB.prepare(
        'SELECT 1 FROM like_actions WHERE ip_hash = ? AND slug = ?'
      ).bind(ipHash, slug).first();
      if (!existing) {
        const row = await env.DB.prepare(
          'SELECT count FROM likes WHERE slug = ?'
        ).bind(slug).first();
        return new Response(JSON.stringify({ count: row?.count || 0, liked: false }), { headers });
      }

      // いいね記録を削除
      await env.DB.prepare(
        'DELETE FROM like_actions WHERE ip_hash = ? AND slug = ?'
      ).bind(ipHash, slug).run();

      // カウントをデクリメント
      await env.DB.prepare(
        'UPDATE likes SET count = MAX(0, count - 1) WHERE slug = ?'
      ).bind(slug).run();

      const row = await env.DB.prepare(
        'SELECT count FROM likes WHERE slug = ?'
      ).bind(slug).first();
      return new Response(JSON.stringify({ count: row?.count || 0, liked: false }), { headers });
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
