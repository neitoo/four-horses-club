function initSlider(root, config = {}) {
  const wrapper = root.querySelector(".slider__wrapper");
  const items = Array.from(root.querySelectorAll(".slider__item"));

  const prevBtn = root.querySelector(".slider__button--prev");
  const nextBtn = root.querySelector(".slider__button--next");

  const pagination = root.querySelector(".slider__pagination");
  const currentEl = root.querySelector(".slider__pagination-current");
  const totalEl = root.querySelector(".slider__pagination-all");

  if (!wrapper || items.length === 0) return;

  let isAnimating = false;
  let isDragging = false;

  let autoplayTimer = null;
  let lastInteractionTime = Date.now();

  function startAutoplay(interval = 4000) {
    if (!config.autoplay) return;

    clearInterval(autoplayTimer);

    autoplayTimer = setInterval(() => {
      const now = Date.now();

      if (now - lastInteractionTime < interval) return;

      goTo(currentIndex + 1);
    }, 1000);
  }

  function markInteraction() {
    lastInteractionTime = Date.now();
  }

  function getGroups(nodes) {
    const map = new Map();

    nodes.forEach((el) => {
      const left = el.offsetLeft;
      if (!map.has(left)) map.set(left, []);
      map.get(left).push(el);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, group]) => group);
  }

  let groups = getGroups(items);
  let realSlidesCount = groups.length;

  function getSlidesPerView() {
    const first = groups[0];
    const second = groups[1];

    if (!second) return 1;

    const gap = parseFloat(getComputedStyle(wrapper).columnGap || 0);

    const slideWidth = first[0].offsetWidth + gap;
    const containerWidth = wrapper.parentElement.offsetWidth;

    return Math.max(1, Math.round(containerWidth / slideWidth));
  }

  const slidesPerView = config.loop ? getSlidesPerView() : 0;

  if (config.loop && realSlidesCount > 1) {
    for (let i = 0; i < slidesPerView; i++) {
      const group = groups[i % realSlidesCount];

      group.forEach((el) => {
        const clone = el.cloneNode(true);
        clone.classList.add("is-clone");
        wrapper.appendChild(clone);
      });
    }

    for (let i = 0; i < slidesPerView; i++) {
      const group =
        groups[(realSlidesCount - 1 - i + realSlidesCount) % realSlidesCount];

      group
        .slice()
        .reverse()
        .forEach((el) => {
          const clone = el.cloneNode(true);
          clone.classList.add("is-clone");
          wrapper.insertBefore(clone, wrapper.firstChild);
        });
    }
  }

  let allItems = Array.from(wrapper.querySelectorAll(".slider__item"));

  function getSlidesPositions(nodes) {
    const positions = [];

    nodes.forEach((item) => {
      const left = item.offsetLeft;

      if (!positions.some((p) => Math.abs(p - left) < 1)) {
        positions.push(left);
      }
    });

    return positions.sort((a, b) => a - b);
  }

  let slides = getSlidesPositions(allItems);
  let maxIndex = slides.length - 1;

  let currentIndex = config.loop ? slidesPerView : 0;

  function updatePosition(animate = true) {
    if (animate) isAnimating = true;

    wrapper.style.transition = animate ? "" : "none";
    wrapper.style.transform = `translateX(-${slides[currentIndex]}px)`;
  }

  function getRealIndex() {
    if (!config.loop) return currentIndex;

    let i = currentIndex - slidesPerView;

    if (i < 0) i = realSlidesCount + i;
    if (i >= realSlidesCount) i = i % realSlidesCount;

    return i;
  }

  wrapper.addEventListener("transitionend", () => {
    if (!isAnimating) return;
    isAnimating = false;

    if (!config.loop) return;

    if (currentIndex < slidesPerView) {
      wrapper.style.transition = "none";
      currentIndex = realSlidesCount + currentIndex;
      updatePosition(false);
    }

    if (currentIndex >= realSlidesCount + slidesPerView) {
      wrapper.style.transition = "none";
      currentIndex = slidesPerView;
      updatePosition(false);
    }
  });

  function updateButtons() {
    if (!prevBtn || !nextBtn) return;

    if (config.loop) {
      prevBtn.classList.remove("slider__button--disabled");
      nextBtn.classList.remove("slider__button--disabled");
      return;
    }

    prevBtn.classList.toggle("slider__button--disabled", currentIndex === 0);
    nextBtn.classList.toggle(
      "slider__button--disabled",
      currentIndex === maxIndex,
    );
  }

  function renderPagination() {
    const type = config.paginationType || "dots";

    if (type === "numbers") {
      updateNumbers();
      return;
    }

    if (!pagination) return;

    pagination.innerHTML = "";

    for (let i = 0; i < realSlidesCount; i++) {
      const dot = document.createElement("span");
      dot.className = "slider__dot";

      if (i === 0) dot.classList.add("slider__dot--active");

      dot.addEventListener("click", () => {
        if (isAnimating) return;
        currentIndex = config.loop ? i + slidesPerView : i;
        update();
      });

      pagination.append(dot);
    }
  }

  function updateDots() {
    if (!pagination) return;

    const dots = pagination.querySelectorAll(".slider__dot");
    const realIndex = getRealIndex();

    dots.forEach((dot, i) => {
      dot.classList.toggle("slider__dot--active", i === realIndex);
    });
  }

  function updateNumbers() {
    if (!currentEl || !totalEl) return;

    currentEl.textContent = getRealIndex() + 1;
    totalEl.textContent = realSlidesCount;
  }

  function updatePagination() {
    const type = config.paginationType || "dots";

    if (type === "numbers") updateNumbers();
    else updateDots();
  }

  function update() {
    updatePosition();
    updateButtons();
    updatePagination();
  }

  function goTo(index) {
    if (isAnimating) return;

    markInteraction();

    if (config.loop) {
      currentIndex = index;
    } else {
      currentIndex = Math.max(0, Math.min(index, maxIndex));
    }

    update();
  }

  prevBtn?.addEventListener("click", () => {
    markInteraction();
    goTo(currentIndex - 1);
  });

  nextBtn?.addEventListener("click", () => {
    markInteraction();
    goTo(currentIndex + 1);
  });

  let startX = 0;
  let currentTranslate = 0;

  function getCurrentTranslate() {
    const style = getComputedStyle(wrapper);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return matrix.m41;
  }

  function onPointerDown(e) {
    if (isAnimating) return;

    isDragging = true;
    startX = e.clientX || e.touches?.[0]?.clientX;
    currentTranslate = getCurrentTranslate();

    wrapper.style.transition = "none";
  }

  function onPointerMove(e) {
    if (!isDragging) return;

    const x = e.clientX || e.touches?.[0]?.clientX;
    let dx = x - startX;

    if (!config.loop) {
      if (
        (currentIndex === 0 && dx > 0) ||
        (currentIndex === maxIndex && dx < 0)
      ) {
        dx *= 0.3;
      }
    }

    wrapper.style.transform = `translateX(${currentTranslate + dx}px)`;
  }

  function onPointerUp(e) {
    if (!isDragging) return;

    isDragging = false;
    markInteraction();

    if (isAnimating) return;

    wrapper.style.transition = "";

    const x = e.clientX || e.changedTouches?.[0]?.clientX;
    const dx = x - startX;

    if (Math.abs(dx) > 50) {
      dx < 0 ? goTo(currentIndex + 1) : goTo(currentIndex - 1);
    } else {
      updatePosition();
    }
  }

  wrapper.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  wrapper.addEventListener("touchstart", onPointerDown, { passive: true });
  window.addEventListener("touchmove", onPointerMove, { passive: true });
  window.addEventListener("touchend", onPointerUp);

  window.addEventListener("resize", () => {
    allItems = Array.from(wrapper.querySelectorAll(".slider__item"));
    slides = getSlidesPositions(allItems);
    maxIndex = slides.length - 1;

    updatePosition(false);
    updatePagination();
  });

  renderPagination();
  updatePosition(false);
  update();
  startAutoplay(config.autoplayInterval || 4000);
}

const sliderConfigs = {
  ".stages__track": {
    loop: false,
    disableAbove: 768,
    paginationType: "dots",
  },
  ".players__slider": {
    loop: true,
    paginationType: "numbers",
    autoplay: true,
    autoplayInterval: 4000,
  },
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
