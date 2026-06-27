/* ===== Theme Toggle + Night Sky ===== */
(function () {
  'use strict';
  var STORAGE_KEY = 'avood-theme';

  /* ─────────────── theme helpers ─────────────── */
  function getPreferredTheme() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleIcon(theme);
    if (theme === 'dark') {
      ensureSkyCanvas();
      startSky();
    } else {
      stopSky();
    }
  }

  function updateToggleIcon(theme) {
    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  /* ─────────────── canvas state ─────────────── */
  var canvas = null;
  var ctx    = null;
  var rafId  = null;
  var shootingTimer = null;
  var stars  = [];
  var shootingStars = [];

  /* ─────────────── setup ─────────────── */
  function ensureSkyCanvas() {
    if (document.getElementById('night-sky-canvas')) {
      canvas = document.getElementById('night-sky-canvas');
      ctx    = canvas.getContext('2d');
      return;
    }
    canvas = document.createElement('canvas');
    canvas.id = 'night-sky-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    generateStars();
  }

  /* ─────────────── star generation ─────────────── */
  function generateStars() {
    if (!canvas) return;
    stars = [];

    /* density: roughly 1 star per 2 800 px² */
    var count = Math.round((canvas.width * canvas.height) / 2800);
    count = Math.max(150, Math.min(count, 400));

    var palette = [
      [255, 255, 255],   // pure white
      [220, 235, 255],   // cold blue-white
      [255, 248, 210],   // warm yellow-white
      [200, 215, 255],   // icy blue
      [255, 225, 170]    // golden
    ];

    for (var i = 0; i < count; i++) {
      var sizeRoll = Math.random();
      var r = sizeRoll < 0.60 ? 0.5 + Math.random() * 0.7   // tiny  (60 %)
            : sizeRoll < 0.88 ? 0.9 + Math.random() * 0.8   // medium(28 %)
            :                   1.5 + Math.random() * 1.1;  // bright(12 %)

      var col = palette[Math.floor(Math.random() * palette.length)];

      /* each star gets its own random twinkling rhythm */
      stars.push({
        x:       Math.random() * canvas.width,
        y:       Math.random() * canvas.height,
        r:       r,
        cr:      col[0], cg: col[1], cb: col[2],
        /* twinkling: alpha oscillates between lo and hi */
        lo:      0.06 + Math.random() * 0.20,          // dim floor
        hi:      0.55 + Math.random() * 0.45,          // bright peak
        phase:   Math.random() * Math.PI * 2,           // random start point in cycle
        freq:    0.00025 + Math.random() * 0.00120,     // how fast it blinks (radians/ms)
        /* extra random "flare" for occasional bursts */
        flareP:  Math.random() < 0.3 ? (0.003 + Math.random() * 0.010) : 0  // 30 % of stars flare
      });
    }
  }

  /* ─────────────── nebula blobs ─────────────── */
  var nebulaBlobs = [
    { x: 0.12, y: 0.22, r: 0.30, r0: 40,  g: 0.18, b: 0.55 },
    { x: 0.78, y: 0.12, r: 0.24, r0: 20,  g: 0.28, b: 0.55 },
    { x: 0.52, y: 0.68, r: 0.22, r0: 35,  g: 0.10, b: 0.40 },
    { x: 0.28, y: 0.82, r: 0.19, r0: 15,  g: 0.32, b: 0.42 }
  ];

  function drawNebula(t) {
    nebulaBlobs.forEach(function (b) {
      var pulse = 0.03 + 0.04 * Math.sin(t * 0.00025 + b.x * 8);
      var cx = b.x * canvas.width;
      var cy = b.y * canvas.height;
      var grd = ctx.createRadialGradient(cx, cy, b.r0, cx, cy, b.r * canvas.width);
      grd.addColorStop(0, 'rgba(' + Math.round(b.g * 255) + ',' + Math.round(b.r0 * 0.5) + ',' + Math.round(b.b * 255) + ',' + pulse + ')');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
  }

  /* ─────────────── shooting stars ─────────────── */
  function spawnShootingStar() {
    if (!canvas || document.documentElement.getAttribute('data-theme') !== 'dark') return;

    var w = canvas.width;
    var h = canvas.height;
    var angle = (Math.PI / 6) + Math.random() * (Math.PI / 5);  // 30°–66° downward

    shootingStars.push({
      /* start anywhere in the top-left 70 % of the screen */
      x:        Math.random() * w * 0.75,
      y:        Math.random() * h * 0.45,
      angle:    angle,
      tailLen:  80 + Math.random() * 150,
      speed:    7 + Math.random() * 9,
      progress: 0,
      life:     0,               /* 0→1, fades out as star moves */
      maxLife:  200 + Math.random() * 180
    });

    /* next shooting star: every 4–10 s */
    var delay = 4000 + Math.random() * 6000;
    shootingTimer = setTimeout(spawnShootingStar, delay);
  }

  function drawShootingStars() {
    shootingStars = shootingStars.filter(function (s) {
      s.progress += s.speed;
      s.life     += s.speed;

      var lifeRatio = s.life / s.maxLife;
      /* fade-in quickly, linger, then fade-out */
      var alpha = lifeRatio < 0.1  ? lifeRatio / 0.1
                : lifeRatio < 0.75 ? 1
                :                    1 - (lifeRatio - 0.75) / 0.25;
      alpha = Math.max(0, Math.min(1, alpha)) * 0.92;

      var headX = s.x + Math.cos(s.angle) * s.progress;
      var headY = s.y + Math.sin(s.angle) * s.progress;
      var tailX = headX - Math.cos(s.angle) * s.tailLen;
      var tailY = headY - Math.sin(s.angle) * s.tailLen;

      /* gradient: bright white head → transparent tail */
      var grd = ctx.createLinearGradient(headX, headY, tailX, tailY);
      grd.addColorStop(0.00, 'rgba(255,255,255,' + alpha + ')');
      grd.addColorStop(0.15, 'rgba(200,230,255,' + (alpha * 0.8) + ')');
      grd.addColorStop(1.00, 'rgba(180,210,255,0)');

      ctx.save();
      ctx.strokeStyle = grd;
      ctx.lineWidth   = 1.8;
      ctx.shadowColor = 'rgba(200,230,255,0.8)';
      ctx.shadowBlur  = 6;
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
      ctx.restore();

      return s.life < s.maxLife;
    });
  }

  /* ─────────────── draw loop ─────────────── */
  function drawFrame(t) {
    if (!canvas || !ctx) return;

    /* sky gradient — painted every frame so canvas stays opaque */
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0.00, '#010812');
    sky.addColorStop(0.45, '#050c1a');
    sky.addColorStop(1.00, '#07101f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawNebula(t);

    /* ── twinkling stars ── */
    stars.forEach(function (s) {
      /* sine wave gives smooth fade, plus optional random flare */
      var wave  = 0.5 + 0.5 * Math.sin(t * s.freq * (Math.PI * 2) + s.phase);
      var flare = s.flareP > 0 ? Math.max(0, Math.sin(t * s.flareP + s.phase * 3)) : 0;
      var alpha = s.lo + (s.hi - s.lo) * Math.max(wave, flare * 0.6);

      /* glow halo for medium/bright stars */
      if (s.r > 0.85) {
        var gloR  = s.r * (s.r > 1.4 ? 4.5 : 3.0);
        var gloA  = alpha * (s.r > 1.4 ? 0.35 : 0.20);
        var glow  = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, gloR);
        glow.addColorStop(0.0, 'rgba(' + s.cr + ',' + s.cg + ',' + s.cb + ',' + gloA + ')');
        glow.addColorStop(0.4, 'rgba(' + s.cr + ',' + s.cg + ',' + s.cb + ',' + (gloA * 0.3) + ')');
        glow.addColorStop(1.0, 'rgba(' + s.cr + ',' + s.cg + ',' + s.cb + ',0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, gloR, 0, Math.PI * 2);
        ctx.fill();
      }

      /* star core */
      ctx.fillStyle = 'rgba(' + s.cr + ',' + s.cg + ',' + s.cb + ',' + alpha + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();

      /* cross-sparkle for the very brightest stars (r > 1.8) */
      if (s.r > 1.8 && alpha > 0.5) {
        var len = s.r * 5 * alpha;
        ctx.save();
        ctx.strokeStyle = 'rgba(' + s.cr + ',' + s.cg + ',' + s.cb + ',' + (alpha * 0.5) + ')';
        ctx.lineWidth   = 0.6;
        ctx.beginPath();
        ctx.moveTo(s.x - len, s.y); ctx.lineTo(s.x + len, s.y);
        ctx.moveTo(s.x, s.y - len); ctx.lineTo(s.x, s.y + len);
        ctx.stroke();
        ctx.restore();
      }
    });

    drawShootingStars();

    if (document.documentElement.getAttribute('data-theme') === 'dark') {
      rafId = requestAnimationFrame(drawFrame);
    }
  }

  /* ─────────────── start / stop ─────────────── */
  function startSky() {
    if (!canvas) return;
    cancelAnimationFrame(rafId);
    clearTimeout(shootingTimer);
    shootingStars = [];
    rafId = requestAnimationFrame(drawFrame);
    /* first shooting star appears 2–5 s after dark mode kicks in */
    shootingTimer = setTimeout(spawnShootingStar, 2000 + Math.random() * 3000);
  }

  function stopSky() {
    cancelAnimationFrame(rafId);
    clearTimeout(shootingTimer);
    rafId = null;
    shootingStars = [];
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /* ─────────────── init ─────────────── */
  function initTheme() {
    var theme = getPreferredTheme();
    applyTheme(theme);

    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
