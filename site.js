document.addEventListener('DOMContentLoaded', () => {
  // Canonical compositing skill tags (Top 10) for data/projects.json consistency:
  // ["Roto","Paint / Cleanup","Keying","2D Tracking","CG Integration","Set Extension / DMP",
  //  "Warp / Distort","Relighting","Smart Vectors / STMap","Tooling / Automation"]
  const COMPOSITING_ALLOWED_SKILLS = [
    'Roto',
    'Paint / Cleanup',
    'Keying',
    '2D Tracking',
    'CG Integration',
    'Set Extension / DMP',
    'Warp / Distort',
    'Relighting',
    'Smart Vectors / STMap',
    'Tooling / Automation'
  ];

  async function injectProjectHeaderTags() {
    const isLocalDebug =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const debugLog = (...args) => {
      if (isLocalDebug) console.log('[tags-debug]', ...args);
    };

    if (!document.body.classList.contains('project-page')) return;

    let title = document.querySelector('.project-hero h1, .content h1, h1');
    if (!title) {
      const introH2 = document.querySelector('.section.section-intro h2');
      if (introH2) {
        const promotedTitle = document.createElement('h1');
        promotedTitle.className = introH2.className;
        promotedTitle.innerHTML = introH2.innerHTML;
        introH2.replaceWith(promotedTitle);
        title = promotedTitle;
      }
    }
    debugLog('title found:', Boolean(title));
    if (!title) return;

    const pathname = new URL(window.location.href).pathname;
    const pathParts = pathname.split('/').filter(Boolean);
    const lastSegment = pathParts[pathParts.length - 1] || '';
    debugLog('pathname + last segment:', pathname, lastSegment);
    if (!lastSegment) return;

    const normalizedId = lastSegment.replace(/\.html$/i, '');
    debugLog('normalizedId:', normalizedId);
    if (!normalizedId || normalizedId === 'index') return;

    try {
      const dataUrl = new URL('../data/projects.json', window.location.href);
      debugLog('fetching data from:', dataUrl.toString());
      const res = await fetch(dataUrl.toString(), { cache: 'no-store' });
      debugLog('fetch ok/status:', res.ok, res.status);
      if (!res.ok) return;

      const data = await res.json();
      const projects = Array.isArray(data.projects) ? data.projects : [];
      const project = projects.find((p) => {
        if (typeof p.href !== 'string') return false;
        const hrefId = p.href.split('/').pop()?.replace(/\.html$/i, '') || '';
        return hrefId === normalizedId;
      });
      debugLog('project found:', Boolean(project), project?.id, project?.category);
      if (!project) return;

      if (typeof project.title === 'string' && project.title.trim()) {
        title.textContent = project.title.trim();
      }

      const defaultMetaByCategory = {
        compositing: 'Compositing • Nuke',
        motion: 'Motion'
      };
      const metaOverrides = {
        motopia: 'Compositing + CG • Nuke • Maya',
        bellyofthebeast: 'VFX Supe + Compositing • Nuke'
      };
      const metaText = metaOverrides[project.id] || defaultMetaByCategory[project.category] || '';
      let meta = title.parentElement?.querySelector('.meta');
      if (!meta && metaText) {
        meta = document.createElement('div');
        meta.className = 'meta';
        title.insertAdjacentElement('afterend', meta);
      }
      if (meta && (project.category === 'compositing' || !meta.textContent?.trim())) {
        meta.textContent = metaText;
      }

      const status = typeof project.status === 'string' ? project.status.trim() : '';
      const skills = project.category === 'compositing' && Array.isArray(project.skills)
        ? project.skills.map((s) => String(s).trim()).filter(Boolean)
        : [];
      debugLog('status + skills len:', status || '(none)', skills.length);
      if (!status && !skills.length) return;

      const unknown =
        project.category === 'compositing'
          ? skills.filter((s) => !COMPOSITING_ALLOWED_SKILLS.includes(s))
          : [];
      if (project.category === 'compositing' && unknown.length) {
        console.warn(`Unknown compositing skills for ${project.id}:`, unknown);
      }

      const row = document.createElement('div');
      row.className = 'tag-row';
      row.setAttribute('aria-label', 'Project status and tags');

      if (status) {
        const statusPill = document.createElement('span');
        statusPill.className = 'pill pill-status';
        const statusClass = status
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const normalizedStatus = status.toLowerCase().trim();
        if (statusClass) {
          statusPill.classList.add(`status-${statusClass}`);
        }
        if (
          normalizedStatus === 'wip' ||
          normalizedStatus === 'in progress' ||
          normalizedStatus === 'updating'
        ) {
          statusPill.classList.add('status-highlight');
        }
        statusPill.textContent = status;
        row.appendChild(statusPill);
      }

      skills.forEach((skill) => {
        const pill = document.createElement('span');
        pill.className = 'pill pill-skill';
        pill.textContent = skill;
        row.appendChild(pill);
      });

      title.insertAdjacentElement('afterend', row);
      debugLog('injected row; child pills:', row.children.length, 'in parent:', title.parentElement?.className);

      // Natural wrap by width, then clamp the visible block to two full lines.
      requestAnimationFrame(() => {
        const pillNodes = Array.from(row.querySelectorAll('.pill'));
        row.classList.remove('is-clamped');
        row.style.removeProperty('--tagMaxH');
        if (pillNodes.length < 3) return;

        const rowRect = row.getBoundingClientRect();
        const lineTops = [];

        pillNodes.forEach((pill) => {
          const top = Math.round(pill.getBoundingClientRect().top - rowRect.top);
          if (!lineTops.some((t) => Math.abs(t - top) <= 1)) {
            lineTops.push(top);
          }
        });

        lineTops.sort((a, b) => a - b);
        if (lineTops.length <= 2) return;

        const secondLineTop = lineTops[1];
        let secondLineBottom = 0;

        pillNodes.forEach((pill) => {
          const rect = pill.getBoundingClientRect();
          const top = Math.round(rect.top - rowRect.top);
          const bottom = rect.bottom - rowRect.top;
          if (top <= secondLineTop + 1) {
            secondLineBottom = Math.max(secondLineBottom, bottom);
          }
        });

        if (!secondLineBottom) return;

        row.style.setProperty('--tagMaxH', `${Math.ceil(secondLineBottom)}px`);
        row.classList.add('is-clamped');
        debugLog('clamped to two lines; maxH:', Math.ceil(secondLineBottom));
      });
    } catch (err) {
      debugLog('inject error:', err);
      console.warn(err);
    }
  }

  injectProjectHeaderTags();

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
    if (document.body.classList.contains('tools-page')) {
      revealEls.forEach((el) => el.classList.add('is-in'));
    } else {
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
