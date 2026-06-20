/* Cassette player page logic */
(function playerApp() {
  const SLIDESHOW = [
    'PAPA.jpeg',
    'PAPA2.jpeg',
    'papa3.jpeg',
    'papa4.jpeg',
    'papa5.jpeg'
  ];
  const SLIDE_MS = 4000;

  const TAPES = {
    1: { title: 'Shukriya Papa',     audio: 'शुक्रिया पापा (Duet Version).mp3', cover: 'PAPA.jpeg',  color: '#5a7a32' },
    2: { title: 'Aapse Himmat Mili', audio: 'papa3.mp3',                        cover: 'PAPA2.jpeg', color: '#a08050' }
  };

  const $ = function (id) { return document.getElementById(id); };
  const audio         = $('audio');
  const playerUnit    = $('player-unit');
  const playerBody    = $('player-body');
  const deckSlot      = $('deck-slot');
  const playerCas     = $('player-cassette');
  const slideA        = $('pc-slide-a');
  const slideB        = $('pc-slide-b');
  const dispCover     = $('disp-cover');
  const dispTitle     = $('disp-title');
  const dispSub       = $('disp-sub');
  const reelL         = $('reel-l');
  const reelR         = $('reel-r');
  const playerLed     = $('player-led');
  const btnPlay       = $('btn-play');
  const btnPause      = $('btn-pause');
  const btnEject      = $('btn-eject');
  const skipControls  = $('skip-controls');
  const btnSkip10     = $('btn-skip-10');
  const btnSkip15     = $('btn-skip-15');

  let currentId = null;
  let busy = false;
  let drag = null;
  let dragPreview = null;
  let deckPreviewId = null;
  let suppressTap = false;
  let audioCtx = null;
  let slideTimer = null;
  let slideIdx = 0;
  let activeSlide = 'a';

  SLIDESHOW.forEach(function (src) {
    const img = new Image();
    img.src = src;
  });

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
    playerCas.classList.toggle('glow', on && (currentId || deckPreviewId));
  }

  function updateSkipControls() {
    if (!skipControls) return;
    skipControls.hidden = !(currentId || dragPreview);
  }

  function skipForward(sec) {
    if (!currentId && !dragPreview) return;
    if (!audio.src) return;
    const max = audio.duration;
    if (Number.isFinite(max)) {
      audio.currentTime = Math.min(audio.currentTime + sec, max - 0.05);
    } else {
      audio.currentTime += sec;
    }
    if (audio.paused) audio.play().catch(function () {});
  }

  function setControls(playing) {
    const has = !!currentId;
    btnPlay.disabled  = !has || playing;
    btnPause.disabled = !has || !playing;
    btnEject.disabled = !has || busy;
  }

  function fadeImg(img, src) {
    return new Promise(function (res) {
      if (!src) { img.hidden = true; img.removeAttribute('src'); res(); return; }
      img.classList.add('fading');
      setTimeout(function () {
        img.src = src;
        img.hidden = false;
        img.classList.remove('fading');
        res();
      }, 280);
    });
  }

  function stopSlideshow() {
    if (slideTimer) {
      clearInterval(slideTimer);
      slideTimer = null;
    }
  }

  function showSlideAt(idx) {
    if (!slideA || !slideB) return;
    const src = SLIDESHOW[idx];
    const incoming = activeSlide === 'a' ? slideB : slideA;
    const outgoing = activeSlide === 'a' ? slideA : slideB;
    incoming.src = src;
    incoming.hidden = false;
    incoming.classList.add('active');
    outgoing.classList.remove('active');
    activeSlide = activeSlide === 'a' ? 'b' : 'a';
    fadeImg(dispCover, src);
  }

  function startSlideshow() {
    stopSlideshow();
    if (!playerCas.classList.contains('has-photo')) return;
    playerCas.classList.add('slideshow-active');

    const hasVisible = slideA.classList.contains('active') || slideB.classList.contains('active');
    if (!hasVisible) {
      slideIdx = 0;
      activeSlide = 'a';
      slideA.src = SLIDESHOW[0];
      slideA.hidden = false;
      slideA.classList.add('active');
      slideB.hidden = true;
      slideB.classList.remove('active');
      fadeImg(dispCover, SLIDESHOW[0]);
    }

    slideTimer = setInterval(function () {
      slideIdx = (slideIdx + 1) % SLIDESHOW.length;
      showSlideAt(slideIdx);
    }, SLIDE_MS);
  }

  function setCassettePhoto(cover) {
    stopSlideshow();
    if (!slideA || !slideB) return;

    if (!cover) {
      slideA.hidden = true;
      slideB.hidden = true;
      slideA.classList.remove('active');
      slideB.classList.remove('active');
      slideA.removeAttribute('src');
      slideB.removeAttribute('src');
      playerCas.classList.remove('has-photo', 'slideshow-active');
      return;
    }

    slideIdx = SLIDESHOW.indexOf(cover);
    if (slideIdx < 0) slideIdx = 0;

    activeSlide = 'a';
    slideA.src = cover;
    slideA.hidden = false;
    slideA.classList.add('active');
    slideB.hidden = true;
    slideB.classList.remove('active');
    slideB.removeAttribute('src');
    playerCas.classList.add('has-photo');
    playerCas.classList.remove('slideshow-active');
  }

  function applyTapeVisuals(tape, mode) {
    fadeImg(dispCover, tape.cover);
    dispTitle.textContent = tape.title;
    dispSub.textContent = mode === 'playing' ? 'Now in player' : 'Drop to play';
    setCassettePhoto(tape.cover);
    playerCas.style.setProperty('--tape-accent', tape.color);
    deckSlot.classList.remove('empty');
    playerBody.classList.add('has-tape');
    if (mode === 'preview') playerBody.classList.add('previewing');
    else playerBody.classList.remove('previewing');
  }

  function updateDisplay(tape) {
    applyTapeVisuals(tape, 'playing');
  }

  function clearDisplay() {
    fadeImg(dispCover, '');
    dispTitle.textContent = 'No cassette';
    dispSub.textContent = 'Insert a tape';
    setCassettePhoto('');
    playerCas.style.removeProperty('--tape-accent');
    deckSlot.classList.add('empty');
    playerBody.classList.remove('has-tape', 'previewing');
    playerCas.classList.remove('glow');
    deckPreviewId = null;
  }

  function showDeckPreview(id) {
    if (busy || currentId === id) return;
    const tape = TAPES[id];
    if (!tape) return;
    deckPreviewId = id;
    applyTapeVisuals(tape, 'preview');
  }

  function hideDeckPreview() {
    if (currentId || busy) return;
    deckPreviewId = null;
    clearDisplay();
    playerBody.classList.remove('previewing');
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
    playerBody.classList.remove('previewing');
    deckPreviewId = null;
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
    updateSkipControls();

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
    updateSkipControls();
    busy = false;
  }

  function overPlayer(cx, cy) {
    const r = playerUnit.getBoundingClientRect();
    const p = 36;
    return cx >= r.left - p && cx <= r.right + p && cy >= r.top - p && cy <= r.bottom + p;
  }

  function startDragPreview(id) {
    const tape = TAPES[id];
    if (!tape) return;

    dragPreview = {
      id: id,
      restoreId: currentId,
      wasPlaying: !audio.paused && !!currentId,
      savedTime: audio.currentTime
    };

    audio.pause();
    audio.src = tape.audio;
    audio.load();
    audio.play().catch(function () {});
    updateSkipControls();
  }

  function endDragPreview(inserted) {
    if (!dragPreview) return;

    if (inserted) {
      dragPreview = null;
      return;
    }

    const snap = dragPreview;
    dragPreview = null;
    hideDeckPreview();
    updateSkipControls();
    audio.pause();

    if (!snap.restoreId) {
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    const prev = TAPES[snap.restoreId];
    if (!prev) return;

    audio.src = prev.audio;
    audio.addEventListener('loadedmetadata', function onMeta() {
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.currentTime = snap.savedTime;
      if (snap.wasPlaying) audio.play().catch(function () {});
    });
    audio.load();
    updateSkipControls();
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
      startDragPreview(drag.id);
    });

    el.addEventListener('pointermove', function (e) {
      if (!drag || drag.el !== el) return;
      drag.ghost.style.left = (e.clientX - drag.ox) + 'px';
      drag.ghost.style.top  = (e.clientY - drag.oy) + 'px';
      const over = overPlayer(e.clientX, e.clientY);
      playerUnit.classList.toggle('drop-target', over);
      if (over) showDeckPreview(drag.id);
      else if (!currentId) hideDeckPreview();
    });

    function end(e) {
      if (!drag || drag.el !== el) return;
      el.classList.remove('dragging');
      if (!el.classList.contains('in-deck')) el.classList.add('idle');
      drag.ghost.remove();
      playerUnit.classList.remove('drop-target');
      const dropped = overPlayer(e.clientX, e.clientY);
      endDragPreview(dropped);
      if (dropped) {
        suppressTap = true;
        setTimeout(function () { suppressTap = false; }, 400);
        insertTape(drag.id);
      } else {
        hideDeckPreview();
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

  document.querySelectorAll('.pool-tape').forEach(function (el) {
    const tape = TAPES[+el.dataset.id];
    if (tape) {
      const photo = el.querySelector('.tape-photo');
      if (photo) photo.style.backgroundImage = "url('" + tape.cover + "')";
      const face = el.querySelector('.tape-3d');
      if (face) face.style.setProperty('--tape-color', tape.color);
    }
    setupDrag(el);
  });

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

  if (btnSkip10) btnSkip10.addEventListener('click', function () { skipForward(10); clickSound(); });
  if (btnSkip15) btnSkip15.addEventListener('click', function () { skipForward(15); clickSound(); });

  audio.addEventListener('ended', function () {
    stopSlideshow();
    setReels(false);
    setControls(false);
    btnPlay.disabled = false;
    playerCas.classList.remove('slideshow-active');
  });

  audio.addEventListener('play', function () {
    if (currentId || deckPreviewId || dragPreview) {
      startSlideshow();
    }
  });

  audio.addEventListener('pause', function () {
    stopSlideshow();
    playerCas.classList.remove('slideshow-active');
    if (!audio.ended && !busy && !dragPreview) setReels(false);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
