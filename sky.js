/* Ceremonial army backdrop — landing & table pages */
(function sky() {
  const canvas = document.getElementById('sky-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, camoBlobs = [], stars = [], embers = [], tick = 0;

  const CAMO = ['#1e2614', '#2f3d18', '#4a5f28', '#6b7c3a', '#3a3220', '#5c4a2e', '#252d14', '#1a1408'];
  const STAR_C = ['#fff', '#f5e6b8', '#d4af37', '#e8dcc0'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (!camoBlobs.length) init();
  }

  function init() {
    camoBlobs = [];
    const n = Math.max(48, Math.floor((W * H) / 14000));
    for (let i = 0; i < n; i++) {
      camoBlobs.push({
        x: Math.random() * W,
        y: Math.random() * H,
        rx: 35 + Math.random() * 95,
        ry: 28 + Math.random() * 75,
        rot: Math.random() * Math.PI,
        c: CAMO[Math.floor(Math.random() * CAMO.length)]
      });
    }

    stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.65,
        r: Math.random() * 1.5 + 0.4,
        a: Math.random() * 0.85 + 0.25,
        tw: Math.random() * 0.035 + 0.012,
        ph: Math.random() * 6.28,
        c: STAR_C[Math.floor(Math.random() * STAR_C.length)]
      });
    }

    embers = [];
    for (let i = 0; i < 35; i++) {
      embers.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2.2 + 0.5,
        dx: (Math.random() - 0.5) * 0.18,
        dy: -Math.random() * 0.22 - 0.06,
        a: Math.random() * 0.45 + 0.12,
        ph: Math.random() * 6.28
      });
    }
  }

  function baseGradient() {
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, '#1e2810');
    g.addColorStop(0.4, '#141c0a');
    g.addColorStop(1, '#080a04');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawCamo() {
    camoBlobs.forEach(function (b) {
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = b.c;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx, b.ry, b.rot, 0, 6.28);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawSpotlight() {
    const g = ctx.createRadialGradient(W * 0.5, -H * 0.05, 0, W * 0.5, H * 0.35, W * 0.85);
    g.addColorStop(0, 'rgba(255, 217, 102, 0.28)');
    g.addColorStop(0.35, 'rgba(232, 184, 64, 0.1)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.15, H * 0.8, 0, W * 0.15, H * 0.8, W * 0.45);
    g2.addColorStop(0, 'rgba(74, 93, 35, 0.18)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
  }

  function drawStar(cx, cy, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = rot + (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawInsignia() {
    const cx = W * 0.5;
    const cy = H * 0.52;
    const scale = Math.min(W, H) * 0.0011;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, 6.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 175, 0, 6.28);
    ctx.stroke();

    drawStar(0, -20, 55, 0);
    ctx.fillStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawCrossedRifles(0, 30);
    ctx.restore();

    const corners = [
      { x: W * 0.12, y: H * 0.18, s: 0.55 },
      { x: W * 0.88, y: H * 0.22, s: 0.45 },
      { x: W * 0.1,  y: H * 0.82, s: 0.4 },
      { x: W * 0.9,  y: H * 0.78, s: 0.5 }
    ];
    corners.forEach(function (c) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(c.s * scale, c.s * scale);
      ctx.globalAlpha = 0.06;
      drawStar(0, 0, 40, tick * 0.002);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.15)';
      ctx.fill();
      ctx.restore();
    });
  }

  function drawCrossedRifles(ox, oy) {
    ctx.save();
    ctx.translate(ox, oy);

    function rifle(angle) {
      ctx.save();
      ctx.rotate(angle);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.14)';
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(-130, 8);
      ctx.lineTo(90, 8);
      ctx.lineTo(95, 4);
      ctx.lineTo(130, 4);
      ctx.lineTo(130, -4);
      ctx.lineTo(95, -4);
      ctx.lineTo(90, -8);
      ctx.lineTo(-130, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-130, -8);
      ctx.lineTo(-155, -18);
      ctx.lineTo(-160, -8);
      ctx.lineTo(-160, 8);
      ctx.lineTo(-155, 18);
      ctx.lineTo(-130, 8);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(40, -8);
      ctx.lineTo(40, -35);
      ctx.lineTo(55, -35);
      ctx.lineTo(55, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(70, 0, 12, 0, 6.28);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }

    rifle(-0.55);
    rifle(0.55);
    ctx.restore();
  }

  function drawMedalRibbon(x, y, w, h) {
    const cols = ['#8b1a1a', '#d4af37', '#2d5016', '#1a3a6b', '#8b1a1a'];
    const sw = w / cols.length;
    cols.forEach(function (c, i) {
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.12;
      ctx.fillRect(x + i * sw, y, sw, h);
    });
    ctx.globalAlpha = 1;
  }

  function drawDecorations() {
    drawMedalRibbon(W * 0.08, H * 0.06, W * 0.22, 8);
    drawMedalRibbon(W * 0.7, H * 0.92, W * 0.25, 8);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.12)';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 48) {
      ctx.globalAlpha = 0.04;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    const g = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.2, W * 0.5, H * 0.5, H * 0.95);
    g.addColorStop(0, 'transparent');
    g.addColorStop(0.65, 'transparent');
    g.addColorStop(1, 'rgba(4, 6, 2, 0.75)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    baseGradient();
    drawCamo();
    drawSpotlight();
    drawInsignia();
    drawDecorations();

    stars.forEach(function (s) {
      const tw = 0.55 + 0.45 * Math.sin(tick * s.tw + s.ph);
      ctx.globalAlpha = s.a * tw;
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.28);
      ctx.fill();
    });

    embers.forEach(function (p) {
      p.x = (p.x + p.dx + W) % W;
      p.y = (p.y + p.dy + H) % H;
      const pulse = 0.7 + 0.3 * Math.sin(tick * 0.04 + p.ph);
      ctx.globalAlpha = p.a * pulse;
      ctx.fillStyle = 'rgba(212, 175, 55, ' + (p.a * pulse) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.28);
      ctx.fill();
    });

    drawVignette();
    ctx.globalAlpha = 1;
  }

  function loop() { tick++; draw(); requestAnimationFrame(loop); }

  window.addEventListener('resize', function () {
    camoBlobs = [];
    stars = [];
    embers = [];
    resize();
  });
  resize();
  loop();
})();
