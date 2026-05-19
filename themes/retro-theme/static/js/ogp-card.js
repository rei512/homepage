// 裸の外部URLリンクを OGP カードに展開する
// corsproxy.io 経由でリンク先 HTML を取得し、OGP メタタグを解析してカード描画。
// 取得失敗・OGタグ無しの場合は元のリンクをそのまま残す。
(function() {
  'use strict';

  // CORS 回避プロキシ。仕様変更時はここを差し替える。
  var PROXY = 'https://corsproxy.io/?url=';

  var links = document.querySelectorAll('a.ogp-card-link');
  if (!links.length) return;

  function getMeta(doc, selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = doc.querySelector(selectors[i]);
      if (el) {
        var c = (el.getAttribute('content') || '').trim();
        if (c) return c;
      }
    }
    return '';
  }

  function parseOGP(html, baseUrl) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var title = getMeta(doc, ['meta[property="og:title"]', 'meta[name="twitter:title"]']);
    if (!title) {
      var t = doc.querySelector('title');
      if (t) title = t.textContent.trim();
    }
    var desc = getMeta(doc, [
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]'
    ]);
    var image = getMeta(doc, ['meta[property="og:image"]', 'meta[name="twitter:image"]']);
    if (image) {
      try { image = new URL(image, baseUrl).href; } catch (e) {}
    }
    return { title: title, desc: desc, image: image };
  }

  function buildCard(href, og, external) {
    var card = document.createElement('a');
    card.className = 'ogp-card';
    card.href = href;
    // 外部リンクのみ新規タブ。内部リンクは同じタブで開く
    if (external) {
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    }

    if (og.image) {
      var imgWrap = document.createElement('div');
      imgWrap.className = 'ogp-card-image';
      var img = document.createElement('img');
      img.src = og.image;
      img.alt = '';
      img.loading = 'lazy';
      // 画像取得失敗時は画像枠だけ取り除き、テキストカードとして表示
      img.onerror = function() {
        if (imgWrap.parentNode) imgWrap.parentNode.removeChild(imgWrap);
      };
      imgWrap.appendChild(img);
      card.appendChild(imgWrap);
    }

    var body = document.createElement('div');
    body.className = 'ogp-card-body';

    var titleEl = document.createElement('div');
    titleEl.className = 'ogp-card-title';
    titleEl.textContent = og.title;
    body.appendChild(titleEl);

    if (og.desc) {
      var descEl = document.createElement('div');
      descEl.className = 'ogp-card-desc';
      descEl.textContent = og.desc;
      body.appendChild(descEl);
    }

    var hostEl = document.createElement('div');
    hostEl.className = 'ogp-card-host';
    try { hostEl.textContent = new URL(href).hostname; } catch (e) {}
    body.appendChild(hostEl);

    card.appendChild(body);
    return card;
  }

  // Twitter/X のツイート(status)URLか判定
  function isTweetUrl(url) {
    try {
      var u = new URL(url);
      if (!/(^|\.)(twitter\.com|x\.com)$/.test(u.hostname)) return false;
      return /^\/[^\/]+\/status(es)?\/\d+/.test(u.pathname);
    } catch (e) { return false; }
  }

  function buildTweet(url) {
    // zoom で 50% 縮小するためのラッパー
    var wrap = document.createElement('div');
    wrap.className = 'tweet-embed';
    var bq = document.createElement('blockquote');
    bq.className = 'twitter-tweet';
    bq.setAttribute('data-theme', 'light');
    bq.setAttribute('data-dnt', 'true');
    var a = document.createElement('a');
    a.href = url;
    bq.appendChild(a);
    wrap.appendChild(bq);
    return wrap;
  }

  // Twitter widgets.js を一度だけ読み込む(読み込み時に .twitter-tweet を自動描画)
  function loadTwitterWidgets() {
    if (document.getElementById('twitter-wjs')) {
      if (window.twttr && window.twttr.widgets) window.twttr.widgets.load();
      return;
    }
    var s = document.createElement('script');
    s.id = 'twitter-wjs';
    s.src = 'https://platform.twitter.com/widgets.js';
    s.async = true;
    document.body.appendChild(s);
  }

  var hasTweet = false;

  Array.prototype.forEach.call(links, function(link) {
    var href = link.href;

    // ツイートURL → 公式の埋め込みツイートに置き換え
    if (isTweetUrl(href)) {
      var tweet = buildTweet(href);
      if (link.parentNode) link.parentNode.replaceChild(tweet, link);
      hasTweet = true;
      return;
    }

    // 同一オリジン(自サイト)は直接取得、外部は corsproxy 経由
    var external = true;
    try { external = (new URL(href).origin !== location.origin); } catch (e) {}
    var fetchUrl = external ? (PROXY + encodeURIComponent(href)) : href;
    fetch(fetchUrl)
      .then(function(res) {
        if (!res.ok) throw new Error('fetch ' + res.status);
        return res.text();
      })
      .then(function(html) {
        var og = parseOGP(html, href);
        if (!og.title) return; // OGP が取れなければリンクのまま
        var card = buildCard(href, og, external);
        if (link.parentNode) link.parentNode.replaceChild(card, link);
      })
      .catch(function() {
        // 失敗時は元のリンクをそのまま残す
      });
  });

  if (hasTweet) loadTwitterWidgets();
})();
