// Cloudflare Pages Functions - コメントAPI
// D1データベースを使用して記事ごとのコメントを管理

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
    return new Response(JSON.stringify({ comments: [], error: 'Database not configured' }), {
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
      const { results } = await env.DB.prepare(
        'SELECT id, author, body, created_at FROM comments WHERE slug = ? ORDER BY created_at ASC'
      ).bind(slug).all();
      return new Response(JSON.stringify({ comments: results || [] }), { headers });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const slug = body.slug;
      const author = (body.author || '').trim();
      const commentBody = (body.body || '').trim();

      // Cloudflare Turnstile 検証（シークレットキーが設定されている場合のみ）
      if (env.TURNSTILE_SECRET) {
        const turnstileToken = body['cf-turnstile-response'] || '';
        if (!turnstileToken) {
          return new Response(JSON.stringify({ error: 'CAPTCHA認証が必要です' }), {
            status: 400,
            headers,
          });
        }
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: env.TURNSTILE_SECRET,
            response: turnstileToken,
            remoteip: request.headers.get('CF-Connecting-IP'),
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
          return new Response(JSON.stringify({ error: 'CAPTCHA認証に失敗しました。もう一度お試しください。' }), {
            status: 403,
            headers,
          });
        }
      }

      // バリデーション
      if (!slug || typeof slug !== 'string' || slug.length > 200) {
        return new Response(JSON.stringify({ error: 'Invalid slug' }), {
          status: 400,
          headers,
        });
      }
      if (!author || author.length > 50) {
        return new Response(JSON.stringify({ error: '名前は必須です（最大50文字）' }), {
          status: 400,
          headers,
        });
      }
      if (!commentBody || commentBody.length > 1000) {
        return new Response(JSON.stringify({ error: 'コメントは必須です（最大1000文字）' }), {
          status: 400,
          headers,
        });
      }

      // IPハッシュによるレート制限
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      const encoder = new TextEncoder();
      const data = encoder.encode(clientIP + '-comments-salt');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // レート制限: 10分間に5件まで
      const recent = await env.DB.prepare(
        "SELECT COUNT(*) as cnt FROM comments WHERE ip_hash = ? AND created_at > datetime('now', '-10 minutes')"
      ).bind(ipHash).first();
      if (recent && recent.cnt >= 5) {
        return new Response(JSON.stringify({ error: '投稿制限中です。しばらくお待ちください。' }), {
          status: 429,
          headers,
        });
      }

      // HTMLエスケープ（XSS対策）
      const safeAuthor = escapeHtml(author);
      const safeBody = escapeHtml(commentBody);

      await env.DB.prepare(
        'INSERT INTO comments (slug, author, body, ip_hash) VALUES (?, ?, ?, ?)'
      ).bind(slug, safeAuthor, safeBody, ipHash).run();

      return new Response(JSON.stringify({
        success: true,
        comment: { author: safeAuthor, body: safeBody, created_at: new Date().toISOString() }
      }), { status: 201, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });

  } catch (error) {
    console.error('Comments API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', comments: [] }), {
      status: 500,
      headers,
    });
  }
}
