(function() {
  'use strict';

  // ランダム画像のリスト（static/images/Headers/ 内の画像）
  const images = [
    '/images/Headers/publicdomainq-0090914zsqfrb.jpg',
    '/images/Headers/publicdomainq-0091955sorqpy.jpg',
    '/images/Headers/publicdomainq-0092563ueznlj.jpg',
    '/images/Headers/publicdomainq-0093111ewmfsf.jpg',
    '/images/Headers/publicdomainq-0093131kwifro.jpg',
    '/images/Headers/publicdomainq-0093132dpmxwi.jpg'
  ];

  // ランダムフレーバーテキストのリスト
  const flavorTexts = [
    'あなたがここに辿り着いたのは、きっと偶然ではない。',
    '画面の向こう側に、いつかの誰かが残した光がある。',
    '忘れられたブックマークの先に、まだ世界は続いている。',
    'すべてのリンクは、どこかの誰かへの手紙だった。',
    '夜更けのブラウザだけが知っている静けさがある。',
    '回線の細さが、言葉の重さを教えてくれた頃。',
    'まだ読み込み中です。人生も、このページも。',
    '何も更新されない日にも、ここは在り続ける。',
    'あの頃のインターネットは、もう少しだけ暗くて温かかった。',
    'カウンターが回らなくても、あなたが来てくれたことは知っている。',
    '星のない夜に、ディスプレイの青だけが道標だった。',
    'ここは終着点ではなく、いつも途中のどこか。'
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
      imageEl.alt = 'Random showcase image';
    }

    if (textEl) {
      textEl.textContent = getRandomItem(flavorTexts);
    }
  });
})();
