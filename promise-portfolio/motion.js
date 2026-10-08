(() => {
  'use strict';
  const canvas = document.querySelector('#particles');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const hero = document.querySelector('.hero');
  const scene = document.querySelector('.hero-scene');
  const cards = [...document.querySelectorAll('.project')];
  const surfaces = [...document.querySelectorAll('.portrait, .project, .progress-card')];
  const pointer = { x: -9999, y: -9999 };
  const ripples = [];
  let width = 0, height = 0, frame = 0, last = 0, time = 0;
  let dots = [], dirty = true;
  const orange = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  function resize() {
    width = innerWidth; height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    const step = width < 600 ? 32 : 29;
    for (let y = -step; y < height + step; y += step) {
      for (let x = -step; x < width + step; x += step) dots.push({ x, y });
    }
    dirty = true; wake();
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const cx = width * .77, cy = height * .4;
    const radius = Math.min(width * .6, height * .65, 540);
    for (const dot of dots) {
      const distance = Math.hypot(dot.x - cx, dot.y - cy);
      const fade = Math.max(0, 1 - distance / radius);
      const wave = reduced.matches ? 0 : Math.sin(dot.y * .017 + dot.x * .006 + time * .6) * 7;
      let x = dot.x + wave, y = dot.y + (reduced.matches ? 0 : Math.cos(dot.x * .015 + time * .4) * 5);
      const dx = x - pointer.x, dy = y - pointer.y, d = Math.hypot(dx, dy);
      const influence = Math.max(0, 1 - d / 190);
      // Reduced motion still offers immediate, stationary hover feedback.
      if (!reduced.matches && d > .01) { x += dx / d * influence * influence * 75; y += dy / d * influence * influence * 75; }
      let rippleGlow = 0;
      for (const ripple of ripples) {
        const age = time - ripple.started;
        const rx = dot.x - ripple.x, ry = dot.y - ripple.y;
        const rd = Math.hypot(rx, ry);
        const strength = Math.max(0, 1 - Math.abs(rd - age * 260) / 55) * Math.max(0, 1 - age / 1.25);
        rippleGlow = Math.max(rippleGlow, strength);
        if (rd > .01) { x += rx / rd * strength * 34; y += ry / rd * strength * 34; }
      }
      ctx.globalAlpha = Math.min(.9, fade * .38 + influence * .7 + rippleGlow * .65);
      if (ctx.globalAlpha < .015) continue;
      ctx.fillStyle = orange;
      ctx.beginPath(); ctx.arc(x, y, 0.7 + influence * 0.65 + rippleGlow * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function updateScroll() {
    if (reduced.matches) return;
    const travel = Math.min(scrollY, height);
    hero.style.setProperty('--hero-y', `${travel * .1}px`);
    hero.style.setProperty('--hero-rotate', `${-Math.min(travel / height, 1) * 4}deg`);
    for (const el of surfaces) {
      const rect = el.getBoundingClientRect();
      const entering = Math.max(0, Math.min(1, (rect.top - height * .6) / (height * .4)));
      el.style.setProperty('--scroll-angle', `${entering * 8}deg`);
      el.style.setProperty('--scroll-y', `${entering * 28}px`);
    }
  }
  function tick(now) {
    frame = 0;
    if (document.hidden) return;
    if (last && now - last < 30 && !dirty) { frame = requestAnimationFrame(tick); return; }
    time += last ? Math.min((now - last) / 1000, .06) : 0;
    last = now;
    while (ripples.length && time - ripples[0].started > 1.25) ripples.shift();
    if (dirty) { updateScroll(); dirty = false; }
    draw();
    if (!reduced.matches) frame = requestAnimationFrame(tick);
  }
  function wake() { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); }
  addEventListener('scroll', () => { dirty = true; wake(); }, { passive: true });
  addEventListener('resize', resize, { passive: true });
  function trackPointer(e) {
    pointer.x = e.clientX; pointer.y = e.clientY;
    if (scene && !reduced.matches) {
      const nx = e.clientX / Math.max(innerWidth, 1) - .5;
      const ny = e.clientY / Math.max(innerHeight, 1) - .5;
      scene.style.setProperty('--scene-x', `${nx * -25}px`);
      scene.style.setProperty('--scene-y', `${ny * -21}px`);
    }
    wake();
  }
  // Listen above the canvas so text, links, touch devices and embedded previews
  // all receive the effect without blocking normal clicks or page scrolling.
  addEventListener('pointermove', trackPointer, { passive: true, capture: true });
  addEventListener('pointerdown', e => {
    trackPointer(e);
    if (!reduced.matches) {
      ripples.push({ x: e.clientX, y: e.clientY, started: time });
      if (ripples.length > 6) ripples.shift();
    }
  }, { passive: true, capture: true });
  function clearPointer() { pointer.x = pointer.y = -9999; if (scene) { scene.style.setProperty('--scene-x','0px'); scene.style.setProperty('--scene-y','0px'); } wake(); }
  addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') clearPointer(); }, { passive: true });
  addEventListener('pointercancel', clearPointer, { passive: true });
  addEventListener('blur', clearPointer);
  document.documentElement.addEventListener('pointerleave', clearPointer);
  for (const card of cards) {
    card.addEventListener('pointermove', e => {
      if (!fine.matches || reduced.matches) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--tilt-x', `${-(e.clientY - r.top - r.height / 2) / r.height * 5}deg`);
      card.style.setProperty('--tilt-y', `${(e.clientX - r.left - r.width / 2) / r.width * 7}deg`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg'); card.style.setProperty('--tilt-y', '0deg');
    });
  }
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (!document.hidden) { dirty = true; wake(); }
  });
  reduced.addEventListener('change', () => {
    pointer.x = pointer.y = -9999;
    ripples.length = 0;
    hero.style.removeProperty('--hero-y'); hero.style.removeProperty('--hero-rotate');
    for (const el of surfaces) for (const name of ['--scroll-angle','--scroll-y','--tilt-x','--tilt-y']) el.style.removeProperty(name);
    dirty = true; wake();
  });
  resize();
})();


