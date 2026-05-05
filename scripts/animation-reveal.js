export default function initScrollReveal() {
  const elements = document.querySelectorAll(".reveal");

  if (!elements.length) return;

  const vh = window.innerHeight;

  function update() {
    const vh = window.innerHeight;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();

      const start = vh * 0.9;
      const end = vh * 0.4;

      let progress = (start - rect.top) / (start - end);

      progress = Math.min(Math.max(progress, 0), 1);

      const eased = easeOutCubic(progress);

      const translateY = (1 - eased) * 30;
      const opacity = eased;

      el.style.opacity = opacity;
      el.style.transform = `translateY(${translateY}px)`;
    });
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);

  update();
}
