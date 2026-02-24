document.addEventListener('DOMContentLoaded', () => {
  // =========================================================
  // Scroll Reveal (site-wide, no HTML edits)
  // Automatically tags common elements for reveal if they
  // don't already have data-reveal set in the HTML.
  // =========================================================

  const autoReveal = (selector, { stagger = true, baseDelay = 0 } = {}) => {
    const nodes = Array.from(document.querySelectorAll(selector));
    const targets = nodes.filter((el) => !el.hasAttribute('data-reveal'));

    targets.forEach((el, i) => {
      el.setAttribute('data-reveal', '');

      // Optional lightweight stagger for lists/grids
      if (stagger) {
        // 1..4 cycle (matches your CSS delay helpers)
        const step = ((i + baseDelay) % 4) + 1;
        el.setAttribute('data-reveal-delay', String(step));
      }
    });
  };

  // Apply reveal across the site
  // (If this ever feels like "too much", we can narrow these selectors.)
  autoReveal('.section', { stagger: false });
  autoReveal('.project-thumb', { stagger: true });
  autoReveal('.tool-card', { stagger: true });
  autoReveal('footer', { stagger: false });

  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealEls.forEach((el) => io.observe(el));
  }

  // =========================================================
  // Before/After Sliders
  // Expects:
  //   .slider-container
  //   .slider-handle
  //   img.after
  // =========================================================
  const sliders = document.querySelectorAll('.slider-container');

  sliders.forEach((slider) => {
    const handle = slider.querySelector('.slider-handle');
    const afterImage = slider.querySelector('.after');
    if (!handle || !afterImage) return;

    let active = false;

    const updateSlider = (clientX) => {
      const rect = slider.getBoundingClientRect();
      const offset = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const percent = (offset / rect.width) * 100;
      handle.style.left = percent + '%';
      afterImage.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
    };

    slider.addEventListener('pointerdown', (e) => {
      active = true;
      updateSlider(e.clientX);
      slider.setPointerCapture?.(e.pointerId);
    });

    window.addEventListener('pointermove', (e) => {
      if (!active) return;
      updateSlider(e.clientX);
    });

    window.addEventListener('pointerup', () => {
      active = false;
    });
  });

  // =========================================================
  // Node Tree Toggle (Collapsible)
  // Works with your existing markup pattern:
  //   <div class="node-tease">
  //     <div>Node Tree</div>
  //     <div class="arrow">▼</div>
  //   </div>
  //   <div class="node-tree-section"> ... </div>
  //
  // Behavior:
  // - hides node-tree-section by default (adds .is-collapsible)
  // - click node-tease toggles .is-open
  // =========================================================
  const toggles = document.querySelectorAll('.node-tease');

  toggles.forEach((toggle) => {
    // Prefer the next sibling node tree section
    let panel = toggle.nextElementSibling;

    // If structure differs (node tree is elsewhere), find the next .node-tree-section in the DOM after toggle
    if (!panel || !panel.classList.contains('node-tree-section')) {
      const allPanels = Array.from(document.querySelectorAll('.node-tree-section'));
      const toggleIndex = Array.from(document.querySelectorAll('*')).indexOf(toggle);
      panel =
        allPanels.find((p) => Array.from(document.querySelectorAll('*')).indexOf(p) > toggleIndex) ||
        allPanels[0] ||
        null;
    }

    if (!panel) return;

    // Hide by default
    panel.classList.add('is-collapsible');
    panel.classList.remove('is-open');

    // Make toggle accessible-ish without changing your HTML
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
    toggle.setAttribute('aria-expanded', 'false');

    const setExpanded = (isOpen) => {
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    const doToggle = () => {
      const isOpen = panel.classList.toggle('is-open');
      setExpanded(isOpen);
    };

    toggle.addEventListener('click', doToggle);
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        doToggle();
      }
    });
  });

  // =========================================================
  // Tools page: one-time "hover to play" toast (pops up, then goes away)
  // Requires tools.html to include:
  //   <div id="preview-toast" class="preview-toast">...</div>
  // =========================================================
  const toast = document.getElementById('preview-toast');
  if (toast) {
    const key = 'tools_preview_toast_seen_v1';
    const already = localStorage.getItem(key);

    if (!already) {
      localStorage.setItem(key, '1');

      // Delay slightly so it feels intentional
      setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2600);
      }, 600);
    }
  }
});