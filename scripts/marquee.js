export default function initMarquee() {
  document.querySelectorAll(".marquee").forEach((marquee) => {
    const track = marquee.querySelector(".marquee__track");
    const content = marquee.querySelector(".marquee__content");

    const clone = content.cloneNode(true);
    track.appendChild(clone);

    let x = 0;
    const speed = 1.2;

    function animate() {
      x -= speed;

      if (Math.abs(x) >= content.offsetWidth) {
        x = 0;
      }

      track.style.transform = `translateX(${x}px)`;
      requestAnimationFrame(animate);
    }

    animate();
  });
}
