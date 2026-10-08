(() => {
  const splash = document.getElementById('splash');
  if (!splash) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    splash.remove();
    return;
  }
  const dismiss = () => {
    splash.classList.add('splash-out');
    setTimeout(() => splash.remove(), 650);
  };
  // Decorative introduction: never locks scrolling, keyboard focus or links.
  const timeout = setTimeout(dismiss, 2200);
  addEventListener('keydown', () => { clearTimeout(timeout); dismiss(); }, { once: true });
  addEventListener('pointerdown', () => { clearTimeout(timeout); dismiss(); }, { once: true });
})();

