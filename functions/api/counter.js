// Cloudflare Pages Functions - アクセスカウンターAPI
// D1データベースを使用して訪問者数をカウント

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
  const allowedOrigins = ['https://deltav-lab.org', 'http://localhost'];
  const isAllowed = !referer || allowedOrigins.some(origin => referer.startsWith(origin));

  if (!isAllowed) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers,
    });
  }

  try {
    // D1が設定されていない場合のフォールバック
    if (!env.DB) {
      return new Response(JSON.stringify({ count: 0, error: 'Database not configured' }), {
        headers,
      });
    }

    // カウントをインクリメント（Prepared Statement使用）
    await env.DB.prepare(
      'UPDATE visits SET count = count + 1 WHERE id = 1'
    ).run();

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
