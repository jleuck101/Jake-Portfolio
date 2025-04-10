document.addEventListener('DOMContentLoaded', () => {
  const sliders = document.querySelectorAll('.slider-container');

  sliders.forEach((slider) => {
    const handle = slider.querySelector('.slider-handle');
    const afterImage = slider.querySelector('.after');

    if (!handle || !afterImage) return;

    let active = false;

    const updateSlider = (x) => {
      const rect = slider.getBoundingClientRect();
      const offset = Math.min(Math.max(x - rect.left, 0), rect.width);
      const percent = (offset / rect.width) * 100;
      handle.style.left = percent + '%';
      afterImage.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    };

    slider.addEventListener('pointerdown', (e) => {
      active = true;
      updateSlider(e.clientX);
    });

    window.addEventListener('pointermove', (e) => {
      if (active) updateSlider(e.clientX);
    });

    window.addEventListener('pointerup', () => {
      active = false;
    });
  });
});
