(function() {
  'use strict';

  // ランダム画像のリスト（Homeと同じ）
  const images = [
    '/images/Headers/publicdomainq-0090914zsqfrb.jpg',
    '/images/Headers/publicdomainq-0091955sorqpy.jpg',
    '/images/Headers/publicdomainq-0092563ueznlj.jpg',
    '/images/Headers/publicdomainq-0093111ewmfsf.jpg',
    '/images/Headers/publicdomainq-0093131kwifro.jpg',
    '/images/Headers/publicdomainq-0093132dpmxwi.jpg'
  ];

  // 404用フレーバーテキストのリスト
  const flavorTexts = [
    'ここには何もないようです...',
    'お探しのページは別の次元に移動したようです。',
    'このURLは過去に置いてきてしまったようです。',
    '404: ページが迷子になりました。',
    'リンク切れ、それは誰もが通る道。',
    'ここにあったはずのページは、もうどこかへ。',
    'すべてのページが永遠ではない。',
    '接続はされた。でもページはなかった。',
    'このページは存在しない...まだ、あるいはもう。',
    '探し物は見つかりませんでした。でも旅は続きます。',
    'Error 404: ページは星になりました。',
    'ここには何もない。でも、それでいい。'
  ];

  // ランダム選択関数
  function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // DOM読み込み完了後に実行
  document.addEventListener('DOMContentLoaded', function() {
    const imageEl = document.getElementById('random-image');
    const textEl = document.getElementById('random-flavor-text');

    if (imageEl) {
      imageEl.src = getRandomItem(images);
      imageEl.alt = '404';
    }

    if (textEl) {
      textEl.textContent = getRandomItem(flavorTexts);
    }
  });
})();
