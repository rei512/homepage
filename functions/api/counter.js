// Cloudflare Pages Functions - アクセスカウンターAPI
// D1データベースを使用して訪問者数をカウント
// 同一IPからの10分以内のアクセスは重複カウントしない

async function hashIP(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + '-counter-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequest(context) {
  const { request, env } = context;

  // レスポンスヘッダー
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  // OPTIONSリクエスト（CORS preflight）への対応
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  // GETリクエストのみ許可
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  // Refererチェック（セキュリティ対策）
  const referer = request.headers.get('Referer');
  if (referer) {
    try {
      const url = new URL(referer);
      const allowedHosts = ['deltav-lab.org', 'www.deltav-lab.org', 'blog.deltav-lab.org', 'localhost'];
      if (!allowedHosts.includes(url.hostname)) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers,
        });
      }
    } catch {
      // Referer解析失敗時は許可
    }
  }

  try {
    // D1が設定されていない場合のフォールバック
    if (!env.DB) {
      return new Response(JSON.stringify({ count: 0, error: 'Database not configured' }), {
        headers,
      });
    }

    // IPハッシュで重複チェック（10分間）
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const ipHash = await hashIP(clientIP);

    const recentVisit = await env.DB.prepare(
      "SELECT 1 FROM counter_visits WHERE ip_hash = ? AND visited_at > datetime('now', '-10 minutes')"
    ).bind(ipHash).first();

    if (!recentVisit) {
      // 10分以内の訪問がない → カウントをインクリメント
      await env.DB.prepare(
        'UPDATE visits SET count = count + 1 WHERE id = 1'
      ).run();

      // 訪問記録を UPSERT（同一IPの既存レコードは更新）
      await env.DB.prepare(
        "INSERT INTO counter_visits (ip_hash, visited_at) VALUES (?, datetime('now')) ON CONFLICT(ip_hash) DO UPDATE SET visited_at = datetime('now')"
      ).bind(ipHash).run();
    }
    // 10分以内に訪問済みの場合はカウントせず、現在値だけ返す

    // 現在のカウントを取得
    const result = await env.DB.prepare(
      'SELECT count FROM visits WHERE id = 1'
    ).first();

    return new Response(JSON.stringify({ count: result?.count || 0 }), {
      headers,
    });

  } catch (error) {
    console.error('Counter API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', count: 0 }), {
      status: 500,
      headers,
    });
  }
}
