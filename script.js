(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Particles (canvas) =====
  const canvas = document.getElementById('particles');
  const ctx = canvas?.getContext?.('2d');
  let w = 0;
  let h = 0;
  let dpr = 1;

  const particles = [];
  const PALETTE = [
    'rgba(138,43,226,0.9)',
    'rgba(255,79,216,0.9)',
    'rgba(76,201,255,0.9)',
    'rgba(255,255,255,0.75)',
  ];

  function resize() {
    if (!canvas || !ctx) return;
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    particles.length = 0;
    const count = prefersReduced ? 40 : Math.round(Math.min(180, Math.max(70, (w * h) / 16000)));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.8 + Math.random() * 2.2,
        vx: (-0.5 + Math.random()) * 0.4,
        vy: (-0.5 + Math.random()) * 0.4,
        a: 0.2 + Math.random() * 0.75,
        c: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        t: Math.random() * 1000,
      });
    }
  }

  function draw(now) {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, w, h);

    // soft glow blobs
    for (const p of particles) {
      p.t += 0.01;
      const drift = prefersReduced ? 0.0 : 0.35 * Math.sin(p.t);
      p.x += p.vx + drift * 0.02;
      p.y += p.vy + drift * 0.02;

      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      ctx.beginPath();
      ctx.fillStyle = p.c;
      ctx.globalAlpha = p.a * (0.65 + 0.35 * Math.sin((now + p.t * 30) / 900));
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (!prefersReduced) requestAnimationFrame(draw);
  }

  if (canvas && ctx) {
    resize();
    spawn();
    window.addEventListener('resize', () => {
      resize();
      spawn();
    });
    if (!prefersReduced) requestAnimationFrame(draw);
    else {
      // render one frame for reduced motion
      draw(performance.now());
    }
  }

  // ===== Scroll-triggered reveal =====
  const animEls = Array.from(document.querySelectorAll('[data-animate]'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.18 }
    );
    animEls.forEach((el) => io.observe(el));
  } else {
    animEls.forEach((el) => el.classList.add('is-in'));
  }

  // ===== Quote sequence =====
  const lines = [
    document.getElementById('quoteLine1'),
    document.getElementById('quoteLine2'),
    document.getElementById('quoteLine3'),
    document.getElementById('quoteFinal'),
  ].filter(Boolean);

  const dots = Array.from(document.querySelectorAll('.quoteDot'));
  let quoteIndex = 0;
  let quoteTimer = null;

  function setQuote(i) {
    lines.forEach((ln, idx) => {
      ln.classList.toggle('is-on', idx === i);
    });
    dots.forEach((d) => {
      d.classList.toggle('is-on', Number(d.dataset.idx) === i + 1);
    });
  }

  function startQuotes() {
    if (prefersReduced) {
      setQuote(3);
      return;
    }
    if (quoteTimer) clearInterval(quoteTimer);
    quoteIndex = 0;
    setQuote(quoteIndex);
    quoteTimer = setInterval(() => {
      quoteIndex = (quoteIndex + 1) % lines.length;
      setQuote(quoteIndex);
    }, 2600);
  }

  // start when scene 3 is near
  const scene3 = document.querySelector('[data-scene="3"]');
  if (scene3 && 'IntersectionObserver' in window) {
    const io3 = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          startQuotes();
          io3.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io3.observe(scene3);
  } else {
    startQuotes();
  }

  // ===== Typewriter =====
  const typeText = document.getElementById('typeText');
  const wish = 'Forever grateful for you.';
  let typeTimer = null;
  let typeIdx = 0;

  function startTyping() {
    if (!typeText) return;
    if (typeTimer) clearInterval(typeTimer);
    typeIdx = 0;
    typeText.textContent = '';

    const speed = prefersReduced ? 8 : 55;
    typeTimer = setInterval(() => {
      typeIdx++;
      typeText.textContent = wish.slice(0, typeIdx);
      if (typeIdx >= wish.length) {
        clearInterval(typeTimer);
        typeTimer = null;
      }
    }, speed);
  }

  // start typing when scene 4 is near
  const scene4 = document.querySelector('[data-scene="4"]');
  if (scene4 && 'IntersectionObserver' in window) {
    const io4 = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          startTyping();
          io4.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io4.observe(scene4);
  } else {
    startTyping();
  }

  // ===== Controls: Reel mode + Music =====
  const reelBtn = document.getElementById('reelBtn');
  const musicBtn = document.getElementById('musicBtn');
  const bgm = document.getElementById('bgm');

  function isReelMode() {
    return document.documentElement.classList.contains('reel');
  }

  function setReelMode(on) {
    document.documentElement.classList.toggle('reel', on);
    if (on) {
      // hide HUD after a brief delay for cinematic feel
      const hud = document.querySelector('.hud');
      if (hud) setTimeout(() => hud.classList.add('reelHidden'), 180);
    } else {
      const hud = document.querySelector('.hud');
      if (hud) hud.classList.remove('reelHidden');
    }
  }

  reelBtn?.addEventListener('click', () => {
    setReelMode(!isReelMode());
  });

  async function toggleMusic() {
    if (!bgm) return;
    try {
      if (bgm.paused) {
        await bgm.play();
        musicBtn && (musicBtn.textContent = 'Music On');
      } else {
        bgm.pause();
        musicBtn && (musicBtn.textContent = 'Play Music');
      }
    } catch (e) {
      // autoplay blocked; user needs to click
      musicBtn && (musicBtn.textContent = 'Tap to Play');
    }
  }

  musicBtn?.addEventListener('click', toggleMusic);

  // ===== Replay buttons =====
  const replayBtn = document.getElementById('replayBtn');
  replayBtn?.addEventListener('click', () => {
    // smooth jump to scene 1 and replay animations
    const s1 = document.querySelector('[data-scene="1"]');
    s1?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // replay parts
    setTimeout(() => {
      // reset quote and typing
      quoteIndex = 0;
      setQuote(0);
      startQuotes();
      startTyping();
    }, 450);
  });

  const replayAll = document.getElementById('replayAll');
  replayAll?.addEventListener('click', () => {
    const s1 = document.querySelector('[data-scene="1"]');
    s1?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      startQuotes();
      startTyping();
      // hint: also reshow reveal
      animEls.forEach((el) => el.classList.remove('is-in'));
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                e.target.classList.add('is-in');
                io.unobserve(e.target);
              }
            }
          },
          { threshold: 0.18 }
        );
        animEls.forEach((el) => io.observe(el));
      }
    }, 520);
  });

  // initial hints for reduced motion
  if (prefersReduced) {
    animEls.forEach((el) => el.classList.add('is-in'));
    lines.forEach((ln) => ln.classList.add('is-on'));
  }
})();

