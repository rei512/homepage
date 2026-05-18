// 記事ページ用インタラクション（イイネ＋コメント）
// POST_SLUG はテンプレート側で設定済み

(function() {
  'use strict';

  var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  // ========================================
  // イイネ (Like) ボタン（トグル可能）
  // ========================================

  var IINE_STORAGE_KEY = 'iine_' + POST_SLUG;
  var iineBtn = document.getElementById('iine-btn');
  var iineCountEl = document.getElementById('iine-count');

  function hasLiked() {
    try {
      return localStorage.getItem(IINE_STORAGE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setLikedState(liked) {
    try {
      if (liked) {
        localStorage.setItem(IINE_STORAGE_KEY, '1');
      } else {
        localStorage.removeItem(IINE_STORAGE_KEY);
      }
    } catch (e) {}
  }

  function updateIineUI(count, liked) {
    if (iineCountEl) iineCountEl.textContent = count;
    if (iineBtn) {
      if (liked) {
        iineBtn.classList.add('iine-liked');
      } else {
        iineBtn.classList.remove('iine-liked');
      }
    }
  }

  function loadIine() {
    if (isLocal) {
      var devCount = parseInt(localStorage.getItem('dev_iine_' + POST_SLUG) || '0');
      updateIineUI(devCount, hasLiked());
      return;
    }
    fetch('/api/likes?slug=' + encodeURIComponent(POST_SLUG))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        // サーバーからliked状態を受け取り、localStorageも同期
        var liked = data.liked !== undefined ? data.liked : hasLiked();
        setLikedState(liked);
        updateIineUI(data.count || 0, liked);
      })
      .catch(function() {});
  }

  window.toggleIine = function() {
    var liked = hasLiked();

    if (isLocal) {
      var devCount = parseInt(localStorage.getItem('dev_iine_' + POST_SLUG) || '0');
      if (liked) {
        devCount = Math.max(0, devCount - 1);
      } else {
        devCount = devCount + 1;
      }
      localStorage.setItem('dev_iine_' + POST_SLUG, devCount.toString());
      setLikedState(!liked);
      updateIineUI(devCount, !liked);
      return;
    }

    if (iineBtn) iineBtn.disabled = true;

    var method = liked ? 'DELETE' : 'POST';
    fetch('/api/likes', {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: POST_SLUG })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.count !== undefined) {
        var newLiked = data.liked !== undefined ? data.liked : !liked;
        setLikedState(newLiked);
        updateIineUI(data.count, newLiked);
      }
    })
    .catch(function() {})
    .finally(function() {
      if (iineBtn) iineBtn.disabled = false;
    });
  };

  loadIine();

  // ========================================
  // コメント
  // ========================================

  var commentListEl = document.getElementById('comment-list');
  var commentCountEl = document.getElementById('comment-count');
  var commentForm = document.getElementById('comment-form');
  var commentStatus = document.getElementById('comment-status');

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    var h = ('0' + d.getHours()).slice(-2);
    var min = ('0' + d.getMinutes()).slice(-2);
    return y + '/' + m + '/' + day + ' ' + h + ':' + min;
  }

  function renderComment(comment) {
    var div = document.createElement('div');
    div.className = 'comment-item';

    var meta = document.createElement('div');
    meta.className = 'comment-meta';
    var authorSpan = document.createElement('span');
    authorSpan.className = 'comment-author';
    authorSpan.textContent = comment.author;
    var dateSpan = document.createElement('span');
    dateSpan.className = 'comment-date';
    dateSpan.textContent = formatDate(comment.created_at);
    meta.appendChild(authorSpan);
    meta.appendChild(dateSpan);

    var body = document.createElement('div');
    body.className = 'comment-body';
    // 改行を保持しつつ textContent で安全に挿入
    var lines = comment.body.split('\n');
    for (var i = 0; i < lines.length; i++) {
      if (i > 0) body.appendChild(document.createElement('br'));
      body.appendChild(document.createTextNode(lines[i]));
    }

    div.appendChild(meta);
    div.appendChild(body);
    return div;
  }

  function loadComments() {
    if (!commentListEl) return;

    if (isLocal) {
      var devComments = JSON.parse(localStorage.getItem('dev_comments_' + POST_SLUG) || '[]');
      if (commentCountEl) commentCountEl.textContent = devComments.length;
      if (devComments.length === 0) {
        commentListEl.innerHTML = '<div class="no-comments">まだコメントはありません</div>';
      } else {
        devComments.forEach(function(c) {
          commentListEl.appendChild(renderComment(c));
        });
      }
      return;
    }

    fetch('/api/comments?slug=' + encodeURIComponent(POST_SLUG))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var comments = data.comments || [];
        if (commentCountEl) commentCountEl.textContent = comments.length;
        if (comments.length === 0) {
          commentListEl.innerHTML = '<div class="no-comments">まだコメントはありません</div>';
        } else {
          comments.forEach(function(c) {
            commentListEl.appendChild(renderComment(c));
          });
        }
      })
      .catch(function() {
        commentListEl.innerHTML = '<div class="no-comments">読み込みに失敗しました</div>';
      });
  }

  window.submitComment = function(e) {
    e.preventDefault();
    var authorEl = document.getElementById('comment-author');
    var bodyEl = document.getElementById('comment-body');
    var submitBtn = document.getElementById('comment-submit');
    var author = authorEl ? authorEl.value.trim() : '';
    var body = bodyEl ? bodyEl.value.trim() : '';

    if (!author || !body) return;

    // Turnstile ウィジェットがある場合は認証成功を必須にする（失敗時は送信不可）
    var turnstileWidget = document.querySelector('.cf-turnstile');
    var turnstileToken = '';
    if (turnstileWidget) {
      turnstileToken = (typeof turnstile !== 'undefined') ? (turnstile.getResponse() || '') : '';
      if (!turnstileToken) {
        if (commentStatus) {
          commentStatus.textContent = 'CAPTCHA認証を完了してください';
          commentStatus.className = 'comment-status comment-status-error';
        }
        return;
      }
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '送信中...';
    }
    if (commentStatus) commentStatus.textContent = '';

    if (isLocal) {
      var newComment = { author: author, body: body, created_at: new Date().toISOString() };
      var devComments = JSON.parse(localStorage.getItem('dev_comments_' + POST_SLUG) || '[]');
      devComments.push(newComment);
      localStorage.setItem('dev_comments_' + POST_SLUG, JSON.stringify(devComments));
      var noComments = commentListEl ? commentListEl.querySelector('.no-comments') : null;
      if (noComments) noComments.remove();
      if (commentListEl) commentListEl.appendChild(renderComment(newComment));
      if (commentCountEl) commentCountEl.textContent = devComments.length;
      if (commentForm) commentForm.reset();
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '送信'; }
      if (commentStatus) {
        commentStatus.textContent = '投稿しました';
        commentStatus.className = 'comment-status comment-status-success';
      }
      return;
    }

    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: POST_SLUG, author: author, body: body, 'cf-turnstile-response': turnstileToken })
    })
    .then(function(res) {
      return res.json().then(function(d) { return { ok: res.ok, data: d }; });
    })
    .then(function(result) {
      if (result.ok && result.data.success) {
        var noComments = commentListEl ? commentListEl.querySelector('.no-comments') : null;
        if (noComments) noComments.remove();
        if (commentListEl) commentListEl.appendChild(renderComment(result.data.comment));
        if (commentCountEl) {
          commentCountEl.textContent = parseInt(commentCountEl.textContent) + 1;
        }
        if (commentForm) commentForm.reset();
        if (commentStatus) {
          commentStatus.textContent = '投稿しました';
          commentStatus.className = 'comment-status comment-status-success';
        }
      } else {
        if (commentStatus) {
          commentStatus.textContent = result.data.error || 'エラーが発生しました';
          commentStatus.className = 'comment-status comment-status-error';
        }
      }
      // Turnstileをリセット
      if (typeof turnstile !== 'undefined') turnstile.reset();
    })
    .catch(function() {
      if (commentStatus) {
        commentStatus.textContent = '送信に失敗しました';
        commentStatus.className = 'comment-status comment-status-error';
      }
      if (typeof turnstile !== 'undefined') turnstile.reset();
    })
    .finally(function() {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '送信'; }
    });
  };

  loadComments();
})();
