function initSlider(root, { loop = false } = {}) {
  const wrapper = root.querySelector(".slider__wrapper");
  const items = root.querySelectorAll(".slider__item");
  const prevBtn = root.querySelector(".slider__button--prev");
  const nextBtn = root.querySelector(".slider__button--next");
  const pagination = root.querySelector(".slider__pagination");

  if (!wrapper || items.length === 0) return;

  let currentIndex = 0;

  let startX = 0;
  let currentTranslate = 0;
  let isDragging = false;
  let isSwiping = false;

  const SWIPE_THRESHOLD = 50;

  let slides = getSlidesPositions(items);
  let maxIndex = slides.length - 1;

  function getStep() {
    const item = items[0];
    const style = window.getComputedStyle(wrapper);
    const gap = parseFloat(style.columnGap || style.gap || 0);
    return item.offsetWidth + gap;
  }

  function getSlidesPositions(items) {
    const positions = [];

    items.forEach((item) => {
      const left = item.offsetLeft;

      if (!positions.some((pos) => Math.abs(pos - left) < 1)) {
        positions.push(left);
      }
    });

    return positions.sort((a, b) => a - b);
  }

  function getCurrentTranslate() {
    const style = window.getComputedStyle(wrapper);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return matrix.m41;
  }

  function updatePosition() {
    wrapper.style.transform = `translateX(-${slides[currentIndex]}px)`;
  }

  function updateButtons() {
    if (loop) return;

    prevBtn?.classList.toggle("slider__button--disabled", currentIndex === 0);

    nextBtn?.classList.toggle(
      "slider__button--disabled",
      currentIndex === maxIndex,
    );
  }

  function renderDots() {
    if (!pagination) return;

    pagination.innerHTML = "";

    slides.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "slider__dot";

      if (i === currentIndex) {
        dot.classList.add("stages__dot--active");
      }

      dot.addEventListener("click", () => {
        currentIndex = i;
        update();
      });

      pagination.append(dot);
    });
  }

  function updateDots() {
    if (!pagination) return;

    const dots = pagination.querySelectorAll(".slider__dot");

    dots.forEach((dot, i) => {
      dot.classList.toggle("stages__dot--active", i === currentIndex);
    });
  }

  function update() {
    updatePosition();
    updateButtons();
    updateDots();
  }

  prevBtn?.addEventListener("click", () => {
    if (currentIndex === 0) {
      if (!loop) return;
      currentIndex = maxIndex;
    } else {
      currentIndex--;
    }
    update();
  });

  nextBtn?.addEventListener("click", () => {
    if (currentIndex === maxIndex) {
      if (!loop) return;
      currentIndex = 0;
    } else {
      currentIndex++;
    }
    update();
  });

  function onPointerDown(e) {
    isDragging = true;
    isSwiping = false;

    startX = e.clientX || e.touches?.[0]?.clientX;

    currentTranslate = getCurrentTranslate();

    wrapper.style.transition = "none";
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const deltaX = clientX - startX;

    if (Math.abs(deltaX) > 5) {
      isSwiping = true;
    }

    wrapper.style.transform = `translateX(${currentTranslate + deltaX}px)`;
  }

  function onPointerUp(e) {
    if (!isDragging) return;

    isDragging = false;
    wrapper.style.transition = "";

    const clientX = e.clientX || e.changedTouches?.[0]?.clientX;
    const deltaX = clientX - startX;

    if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < 0) {
        if (currentIndex === maxIndex) {
          if (loop) currentIndex = 0;
        } else {
          currentIndex++;
        }
      } else {
        if (currentIndex === 0) {
          if (loop) currentIndex = maxIndex;
        } else {
          currentIndex--;
        }
      }
    }

    update();
  }

  wrapper.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  wrapper.addEventListener("touchstart", onPointerDown, { passive: true });
  window.addEventListener("touchmove", onPointerMove, { passive: true });
  window.addEventListener("touchend", onPointerUp);

  window.addEventListener("resize", () => {
    slides = getSlidesPositions(items);
    maxIndex = slides.length - 1;
    update();
  });

  renderDots();
  update();
}

const sliderConfigs = {
  ".stages__track": { loop: false, disableAbove: 768 },
};

function shouldDisable(config) {
  if (!config.disableAbove) return false;

  return window.innerWidth >= config.disableAbove;
}

export default function initSliders() {
  Object.entries(sliderConfigs).forEach(([selector, config]) => {
    const sliders = document.querySelectorAll(selector);

    sliders.forEach((slider) => {
      if (shouldDisable(config)) return;

      initSlider(slider, config);
    });
  });
}
