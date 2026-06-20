/* Cassette player page logic */
(function playerApp() {
  const TAPES = {
    1: { title: 'Shukriya Papa',           audio: 'papa1.mp3', cover: 'papa1.jpg', color: '#e8a4c8' },
    2: { title: 'Aapse Seekhe Hue Sawaal', audio: 'papa2.mp3', cover: 'papa2.jpg', color: '#7eb8e8' },
    3: { title: 'Aapse Himmat Mili',       audio: 'papa3.mp3', cover: 'papa3.jpg', color: '#f5d78e' }
  };

  const $ = function (id) { return document.getElementById(id); };
  const audio      = $('audio');
  const playerUnit = $('player-unit');
  const playerBody = $('player-body');
  const deckSlot   = $('deck-slot');
  const playerCas  = $('player-cassette');
  const pcLabel    = $('pc-label');
  const dispCover  = $('disp-cover');
  const dispTitle  = $('disp-title');
  const dispSub    = $('disp-sub');
  const reelL      = $('reel-l');
  const reelR      = $('reel-r');
  const playerLed  = $('player-led');
  const btnPlay    = $('btn-play');
  const btnPause   = $('btn-pause');
  const btnEject   = $('btn-eject');

  let currentId = null;
  let busy = false;
  let drag = null;
  let suppressTap = false;
  let audioCtx = null;

  document.body.classList.add('on-table', 'entering');
  setTimeout(function () { document.body.classList.remove('entering'); }, 1400);

  function clickSound() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(380, t);
      o.frequency.exponentialRampToValueAtTime(100, t + 0.07);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + 0.08);
    } catch (e) {}
  }

  function setReels(on) {
    reelL.classList.toggle('spinning', on);
    reelR.classList.toggle('spinning', on);
    playerLed.classList.toggle('on', on);
    playerCas.classList.toggle('glow', on && currentId);
  }

  function setControls(playing) {
    const has = !!currentId;
    btnPlay.disabled  = !has || playing;
    btnPause.disabled = !has || !playing;
    btnEject.disabled = !has || busy;
  }

  function fadeImg(img, src) {
    return new Promise(function (res) {
      if (!src) { img.hidden = true; res(); return; }
      img.classList.add('fading');
      setTimeout(function () {
        img.src = src;
        img.hidden = false;
        img.classList.remove('fading');
        res();
      }, 400);
    });
  }

  function updateDisplay(tape) {
    fadeImg(dispCover, tape.cover);
    dispTitle.textContent = tape.title;
    dispSub.textContent = 'Now in player';
    pcLabel.style.backgroundImage = "url('" + tape.cover + "')";
    playerCas.style.background = 'linear-gradient(145deg,' + tape.color + ',#222)';
    deckSlot.classList.remove('empty');
    playerBody.classList.add('has-tape');
  }

  function clearDisplay() {
    fadeImg(dispCover, '');
    dispTitle.textContent = 'No cassette';
    dispSub.textContent = 'Insert a tape';
    pcLabel.style.backgroundImage = '';
    playerCas.style.background = '';
    deckSlot.classList.add('empty');
    playerBody.classList.remove('has-tape');
    playerCas.classList.remove('glow');
  }

  function showTape(id) {
    const el = $('tape-' + id);
    if (el) { el.classList.remove('in-deck'); el.classList.add('idle'); }
  }

  function hideTape(id) {
    const el = $('tape-' + id);
    if (el) { el.classList.add('in-deck'); el.classList.remove('idle', 'dragging'); }
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  async function insertTape(id) {
    if (busy || id === currentId) return;
    const tape = TAPES[id];
    if (!tape) return;

    busy = true;
    audio.pause();
    setReels(false);
    setControls(false);

    if (currentId) {
      playerCas.classList.add('ejecting');
      await wait(600);
      playerCas.classList.remove('ejecting');
      showTape(currentId);
      clearDisplay();
      await wait(150);
    }

    currentId = id;
    hideTape(id);
    updateDisplay(tape);

    playerCas.classList.add('inserting');
    await wait(700);
    playerCas.classList.remove('inserting');

    clickSound();
    audio.src = tape.audio;
    audio.load();

    try {
      await audio.play();
      setReels(true);
      setControls(true);
    } catch (e) {
      setControls(false);
      btnPlay.disabled = false;
    }
    busy = false;
  }

  async function ejectTape() {
    if (busy || !currentId) return;
    busy = true;
    audio.pause();
    setReels(false);

    playerCas.classList.add('ejecting');
    await wait(600);
    playerCas.classList.remove('ejecting');

    showTape(currentId);
    currentId = null;
    clearDisplay();
    setControls(false);
    busy = false;
  }

  function overPlayer(cx, cy) {
    const r = playerUnit.getBoundingClientRect();
    const p = 36;
    return cx >= r.left - p && cx <= r.right + p && cy >= r.top - p && cy <= r.bottom + p;
  }

  function setupDrag(el) {
    el.addEventListener('pointerdown', function (e) {
      if (busy || el.classList.contains('in-deck')) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const rect = el.getBoundingClientRect();
      const ghost = el.cloneNode(true);
      ghost.className = 'drag-float';
      ghost.style.left = rect.left + 'px';
      ghost.style.top = rect.top + 'px';
      document.body.appendChild(ghost);
      el.classList.add('dragging');
      el.classList.remove('idle');
      drag = { el: el, id: +el.dataset.id, ghost: ghost, ox: e.clientX - rect.left, oy: e.clientY - rect.top };
    });

    el.addEventListener('pointermove', function (e) {
      if (!drag || drag.el !== el) return;
      drag.ghost.style.left = (e.clientX - drag.ox) + 'px';
      drag.ghost.style.top  = (e.clientY - drag.oy) + 'px';
      playerUnit.classList.toggle('drop-target', overPlayer(e.clientX, e.clientY));
    });

    function end(e) {
      if (!drag || drag.el !== el) return;
      el.classList.remove('dragging');
      if (!el.classList.contains('in-deck')) el.classList.add('idle');
      drag.ghost.remove();
      playerUnit.classList.remove('drop-target');
      if (overPlayer(e.clientX, e.clientY)) {
        suppressTap = true;
        setTimeout(function () { suppressTap = false; }, 400);
        insertTape(drag.id);
      }
      drag = null;
    }

    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);

    el.addEventListener('click', function () {
      if (suppressTap || busy || el.classList.contains('in-deck')) return;
      insertTape(+el.dataset.id);
    });
  }

  document.querySelectorAll('.pool-tape').forEach(setupDrag);

  btnPlay.addEventListener('click', function () {
    if (!currentId) return;
    audio.play().then(function () { setReels(true); setControls(true); }).catch(function () {});
  });

  btnPause.addEventListener('click', function () {
    audio.pause();
    setReels(false);
    setControls(false);
    btnPlay.disabled = false;
  });

  btnEject.addEventListener('click', function () { ejectTape(); });

  audio.addEventListener('ended', function () {
    setReels(false);
    setControls(false);
    btnPlay.disabled = false;
  });

  audio.addEventListener('pause', function () {
    if (!audio.ended && !busy) setReels(false);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
