(function() {
  'use strict';

  const iframe = document.getElementById('content-iframe');
  const menuLinks = document.querySelectorAll('[data-iframe-url]');

  // メニューリンククリック処理
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const iframeUrl = link.getAttribute('data-iframe-url');
      if (iframeUrl && iframe) {
        iframe.src = iframeUrl;

        // アクティブ状態切り替え
        menuLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // 履歴管理
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', link.getAttribute('href'));
        }
      }
    });
  });

  // iframe内からのpostMessageを受信してURLバーを更新
  window.addEventListener('message', (event) => {
    // セキュリティ: 同一オリジンからのメッセージのみ受け付ける
    if (event.origin !== window.location.origin) {
      return;
    }

    if (event.data && event.data.type === 'navigation') {
      const url = event.data.url;

      // URLバーを更新
      if (window.history && window.history.pushState && url) {
        window.history.pushState(null, '', url);
      }

      // メニューのアクティブ状態を更新
      menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === url) {
          menuLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }
  });

  // 初期状態設定
  const currentPath = window.location.pathname;
  menuLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === '/')) {
      link.classList.add('active');
    }
  });
})();
