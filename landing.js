/* Landing page — transition to table.html */
(function landing() {
  const page = document.querySelector('.page-landing');
  const btn = document.getElementById('btn-begin');
  if (!page || !btn) return;

  btn.addEventListener('click', function () {
    page.classList.add('leaving');
    setTimeout(function () {
      window.location.href = 'table.html';
    }, 900);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
