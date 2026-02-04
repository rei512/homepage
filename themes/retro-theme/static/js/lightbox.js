(function() {
  'use strict';

  var overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = '<img class="lightbox-img" src="" alt="">';
  document.body.appendChild(overlay);

  var lbImg = overlay.querySelector('.lightbox-img');

  function open(src) {
    lbImg.src = src;
    overlay.classList.add('active');
  }

  function close() {
    overlay.classList.remove('active');
    lbImg.src = '';
  }

  overlay.addEventListener('click', close);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') close();
  });

  document.addEventListener('click', function(e) {
    var img = e.target.closest('.post-content img, .showcase-image img');
    if (img) {
      e.preventDefault();
      open(img.src);
    }
  });
})();
