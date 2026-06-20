/* Shared galaxy sky canvas — used on landing & table pages */
(function sky() {
  const canvas = document.getElementById('sky-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, stars = [], particles = [], shooters = [], tick = 0;
  let fadeMul = 1;

  const COLORS = ['#fff', '#e8d4ff', '#b8d4ff', '#ffd4e8', '#fff8d4'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (!stars.length) init();
  }

  function init() {
    stars = [];
    for (let i = 0; i < 280; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.6 + 0.3,
        a: Math.random() * 0.7 + 0.2,
        tw: Math.random() * 0.04 + 0.01,
        ph: Math.random() * 6.28,
        c: COLORS[Math.floor(Math.random() * COLORS.length)],
        sp: Math.random() * 0.04 + 0.01
      });
    }
    particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 2.5 + 0.5,
        dx: (Math.random() - 0.5) * 0.15,
        dy: -Math.random() * 0.12 - 0.04,
        a: Math.random() * 0.35 + 0.1,
        c: Math.random() > 0.5 ? 'rgba(200,180,255,' : 'rgba(245,215,142,'
      });
    }
  }

  function nebula() {
    const g1 = ctx.createRadialGradient(W * 0.3, H * 0.2, 0, W * 0.3, H * 0.2, W * 0.5);
    g1.addColorStop(0, 'rgba(124, 92, 191, 0.22)');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.75, H * 0.35, 0, W * 0.75, H * 0.35, W * 0.4);
    g2.addColorStop(0, 'rgba(232, 164, 200, 0.14)');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    const g3 = ctx.createRadialGradient(W * 0.5, H * 0.7, 0, W * 0.5, H * 0.7, W * 0.45);
    g3.addColorStop(0, 'rgba(107, 159, 212, 0.1)');
    g3.addColorStop(1, 'transparent');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, W, H);
  }

  function maybeShoot() {
    if (shooters.length < 2 && Math.random() < 0.006) {
      shooters.push({
        x: Math.random() * W * 0.7,
        y: Math.random() * H * 0.35,
        vx: Math.random() * 5 + 7,
        vy: Math.random() * 3 + 3,
        len: Math.random() * 80 + 50,
        life: 1
      });
    }
  }

  function draw() {
    ctx.fillStyle = '#0a0618';
    ctx.fillRect(0, 0, W, H);
    nebula();

    const fm = fadeMul;

    stars.forEach(s => {
      const tw = 0.5 + 0.5 * Math.sin(tick * s.tw + s.ph);
      const x = (s.x + tick * s.sp * 0.3) % W;
      const y = (s.y + tick * s.sp * 0.15) % H;
      ctx.globalAlpha = s.a * tw * fm;
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, 6.28);
      ctx.fill();
    });

    particles.forEach(p => {
      p.x = (p.x + p.dx + W) % W;
      p.y = (p.y + p.dy + H) % H;
      ctx.globalAlpha = p.a * fm;
      ctx.fillStyle = p.c + (p.a * fm) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 6.28);
      ctx.fill();
    });

    shooters = shooters.filter(s => {
      s.x += s.vx; s.y += s.vy; s.life -= 0.025;
      if (s.life <= 0) return false;
      const spd = Math.hypot(s.vx, s.vy);
      const lg = ctx.createLinearGradient(s.x, s.y, s.x - s.vx / spd * s.len, s.y - s.vy / spd * s.len);
      lg.addColorStop(0, 'rgba(255,255,255,' + s.life * fm + ')');
      lg.addColorStop(1, 'transparent');
      ctx.globalAlpha = fm;
      ctx.strokeStyle = lg;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx / spd * s.len, s.y - s.vy / spd * s.len);
      ctx.stroke();
      return true;
    });

    ctx.globalAlpha = 1;
    maybeShoot();
  }

  function loop() { tick++; draw(); requestAnimationFrame(loop); }

  window.addEventListener('resize', resize);
  resize();
  loop();
})();
