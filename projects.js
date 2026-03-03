async function loadProjectsData() {
  if (!window.__projectsDataPromise) {
    window.__projectsDataPromise = fetch('/data/projects.json', { cache: 'no-store' }).then((res) => {
      if (!res.ok) {
        throw new Error(`Failed to load projects data: ${res.status}`);
      }
      return res.json();
    });
  }

  return window.__projectsDataPromise;
}

const COMPOSITING_CANONICAL_SKILLS = [
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

function normalizeBadge(value) {
  return value === 'WIP' || value === 'Updating' ? value : null;
}

function ensureCardBadges(cards, byId) {
  cards.forEach((card) => {
    const projectId = card.getAttribute('data-project-id') || '';
    const project = projectId ? byId[projectId] : null;
    const badgeText = normalizeBadge(project?.badge);
    const existingBadge = card.querySelector('.wip-badge');

    if (badgeText) {
      if (existingBadge) {
        if (existingBadge.textContent !== badgeText) existingBadge.textContent = badgeText;
      } else {
        const badgeEl = document.createElement('div');
        badgeEl.className = 'wip-badge';
        badgeEl.textContent = badgeText;
        card.insertBefore(badgeEl, card.firstChild);
      }
      card.classList.add('wip-thumb');
    } else if (existingBadge) {
      existingBadge.remove();
      card.classList.remove('wip-thumb');
    } else {
      card.classList.remove('wip-thumb');
    }
  });
}

function renderCard(project, badgeOverride, hasBadgeOverride) {
  const badge = hasBadgeOverride ? normalizeBadge(badgeOverride) : normalizeBadge(project.badge);
  const classes = badge ? 'project-thumb wip-thumb' : 'project-thumb';
  const safeSkills = Array.isArray(project.skills)
    ? project.skills.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const encodedSkills = safeSkills.map((skill) => encodeURIComponent(skill)).join('|');

  return `
    <a href="${project.href}" class="${classes}" data-project-id="${project.id || ''}" data-skills="${encodedSkills}">
      ${badge ? `<div class="wip-badge">${badge}</div>` : ''}
      <img src="${project.thumbnail}" alt="${project.alt}">
      <div class="overlay">${project.overlay}</div>
    </a>
  `;
}

function normalizeGalleryEntry(entry) {
  if (typeof entry === 'string') {
    return { id: entry, hasBadgeOverride: false, badge: undefined };
  }

  if (entry && typeof entry === 'object' && typeof entry.id === 'string') {
    return {
      id: entry.id,
      hasBadgeOverride: Object.prototype.hasOwnProperty.call(entry, 'badge'),
      badge: entry.badge
    };
  }

  return null;
}

function renderGallery(container, galleryEntries, byId) {
  container.innerHTML = galleryEntries
    .map((entry) => normalizeGalleryEntry(entry))
    .filter(Boolean)
    .map((entry) => {
      const project = byId[entry.id];
      if (!project) return '';
      return renderCard(project, entry.badge, entry.hasBadgeOverride);
    })
    .join('');
}

function initCompositingSkillFilter(data, byId) {
  const filterRoot = document.getElementById('skill-filter');
  const countEl = document.getElementById('skill-count');
  const gallery = document.getElementById('gallery-compositing-projects');
  const toggleBtn = document.querySelector('.filter-toggle[aria-controls="skill-filter"]');
  if (!filterRoot || !countEl || !gallery) return;

  const entries = Array.isArray(data?.galleries?.['gallery-compositing-projects'])
    ? data.galleries['gallery-compositing-projects']
    : [];

  const compositingProjects = entries
    .map((entry) => normalizeGalleryEntry(entry))
    .filter(Boolean)
    .map((entry) => byId[entry.id])
    .filter((project) => project && project.category === 'compositing');

  const isLocalDebug =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const unknownSkillsInOrder = [];
  const unknownSkillSet = new Set();
  const skillCounts = new Map();

  compositingProjects.forEach((project) => {
    const skills = Array.isArray(project.skills) ? project.skills : [];
    const uniqueProjectSkills = new Set();
    skills.forEach((skillRaw) => {
      const skill = String(skillRaw).trim();
      if (!skill) return;

      if (!COMPOSITING_CANONICAL_SKILLS.includes(skill) && !unknownSkillSet.has(skill)) {
        unknownSkillSet.add(skill);
        unknownSkillsInOrder.push(skill);
      }

      uniqueProjectSkills.add(skill);
    });

    uniqueProjectSkills.forEach((skill) => {
      skillCounts.set(skill, (skillCounts.get(skill) || 0) + 1);
    });
  });

  if (isLocalDebug && unknownSkillsInOrder.length) {
    console.warn('Unknown compositing skills included in filter UI:', unknownSkillsInOrder);
  }

  const filterSkills = [...COMPOSITING_CANONICAL_SKILLS, ...unknownSkillsInOrder].filter(
    (skill) => (skillCounts.get(skill) || 0) >= 2
  );
  const selectedSkills = new Set();

  const allButton = document.createElement('button');
  allButton.type = 'button';
  allButton.className = 'skill-chip is-selected';
  allButton.dataset.skill = '__all__';
  allButton.setAttribute('aria-pressed', 'true');
  allButton.textContent = 'All';
  filterRoot.appendChild(allButton);

  filterSkills.forEach((skill) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'skill-chip';
    button.dataset.skill = skill;
    button.setAttribute('aria-pressed', 'false');
    button.textContent = skill;
    filterRoot.appendChild(button);
  });

  let cards = Array.from(gallery.querySelectorAll('.project-thumb'));
  const cardOriginalIndex = new Map(cards.map((card, index) => [card, index]));
  const total = cards.length;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOVE_MS = 420;
  const EXIT_FADE_MS = 240;
  const ENTER_FADE_MS = 240;
  const BADGE_FADE_MS = 220;
  const BADGE_REVEAL_DELAY_MS = Math.max(0, MOVE_MS - 40);
  const easingMove = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const easingFade = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  let filterRunId = 0;
  let isReady = false;
  let isAnimating = false;
  let hasQueuedApply = false;
  let exitOverlay = document.getElementById('filter-exit-overlay');
  if (!exitOverlay) {
    exitOverlay = document.createElement('div');
    exitOverlay.id = 'filter-exit-overlay';
    exitOverlay.style.position = 'absolute';
    exitOverlay.style.left = '0';
    exitOverlay.style.top = '0';
    exitOverlay.style.width = '0';
    exitOverlay.style.height = '0';
    exitOverlay.style.pointerEvents = 'none';
    exitOverlay.style.zIndex = '9999';
    document.body.appendChild(exitOverlay);
  }

  const clearCardInlineState = (card) => {
    card.style.transition = '';
    card.style.transform = '';
    card.style.opacity = '';
    card.style.width = '';
    card.style.height = '';
    card.style.left = '';
    card.style.top = '';
  };

  const restoreGalleryOrder = () => {
    cards.forEach((card) => {
      if (card.parentElement === gallery) gallery.appendChild(card);
    });
  };

  const toRank = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };

  const getCardProject = (card) => {
    const projectId = card.getAttribute('data-project-id') || '';
    return projectId ? byId[projectId] : null;
  };

  const getFeaturedRank = (project) => toRank(project?.featured_rank);

  const getSkillRank = (project, selectedSkillList) => {
    if (!project || !selectedSkillList.length || !project.skill_rank || typeof project.skill_rank !== 'object') {
      return Number.POSITIVE_INFINITY;
    }

    return selectedSkillList.reduce((best, skill) => {
      const rank = toRank(project.skill_rank[skill]);
      return rank < best ? rank : best;
    }, Number.POSITIVE_INFINITY);
  };

  const getFallbackTitle = (project, card) => {
    const raw =
      project?.title ||
      project?.overlay ||
      card.querySelector('.overlay')?.textContent ||
      project?.alt ||
      '';
    return String(raw).trim().toLowerCase();
  };

  const sortCardsForSelection = (cardList, selectedSkillList, usingAll) => {
    const selected = Array.isArray(selectedSkillList) ? selectedSkillList : [];
    const sorted = [...cardList];

    sorted.sort((a, b) => {
      const projectA = getCardProject(a);
      const projectB = getCardProject(b);

      if (usingAll) {
        const featuredDiff = getFeaturedRank(projectA) - getFeaturedRank(projectB);
        if (featuredDiff !== 0) return featuredDiff;
      } else {
        const skillDiff = getSkillRank(projectA, selected) - getSkillRank(projectB, selected);
        if (skillDiff !== 0) return skillDiff;

        const featuredDiff = getFeaturedRank(projectA) - getFeaturedRank(projectB);
        if (featuredDiff !== 0) return featuredDiff;
      }

      const titleA = getFallbackTitle(projectA, a);
      const titleB = getFallbackTitle(projectB, b);
      const titleDiff = titleA.localeCompare(titleB);
      if (titleDiff !== 0) return titleDiff;

      const idA = String(projectA?.id || a.getAttribute('data-project-id') || '').toLowerCase();
      const idB = String(projectB?.id || b.getAttribute('data-project-id') || '').toLowerCase();
      const idDiff = idA.localeCompare(idB);
      if (idDiff !== 0) return idDiff;

      return (cardOriginalIndex.get(a) ?? 0) - (cardOriginalIndex.get(b) ?? 0);
    });

    return sorted;
  };

  const applyFilter = () => {
    ensureCardBadges(cards, byId);
    cards.forEach((card) => {
      const badge = card.querySelector('.wip-badge');
      if (!badge) return;
      badge.classList.add('badge-fade');
      badge.classList.remove('is-visible');
    });

    const visibleSkillSet = new Set(filterSkills);
    const hiddenSelectedSkills = Array.from(selectedSkills).filter((skill) => !visibleSkillSet.has(skill));
    if (hiddenSelectedSkills.length) {
      selectedSkills.clear();
    }

    const usingAll = selectedSkills.size === 0;
    const selectedSkillList = Array.from(selectedSkills);
    cards = sortCardsForSelection(cards, selectedSkillList, usingAll);
    let shown = 0;

    const visibilityPlan = cards.map((card) => {
      const skills = String(card.getAttribute('data-skills') || '')
        .split('|')
        .map((token) => {
          try {
            return decodeURIComponent(token);
          } catch {
            return token;
          }
        })
        .map((s) => s.trim())
        .filter(Boolean);

      const visible = usingAll || skills.some((skill) => selectedSkills.has(skill));
      if (visible) shown += 1;
      return { card, visible };
    });

    const runId = ++filterRunId;

    if (prefersReducedMotion) {
      visibilityPlan.forEach(({ card, visible }) => {
        card.getAnimations().forEach((anim) => anim.cancel());
        if (card.parentElement !== gallery) gallery.appendChild(card);
        card.classList.remove('is-exiting', 'is-entering', 'is-entering-active');
        card.style.display = visible ? '' : 'none';
        clearCardInlineState(card);
      });
      restoreGalleryOrder();
      ensureCardBadges(cards, byId);
      cards.forEach((card) => {
        if (card.style.display === 'none' || card.parentElement !== gallery) return;
        const badge = card.querySelector('.wip-badge');
        if (!badge) return;
        badge.classList.remove('badge-fade', 'is-visible');
      });
      countEl.textContent = `Showing ${shown} of ${total}`;
      const chipButtons = Array.from(filterRoot.querySelectorAll('.skill-chip'));
      chipButtons.forEach((btn) => {
        const skill = btn.dataset.skill || '';
        const selected = skill === '__all__' ? usingAll : selectedSkills.has(skill);
        btn.classList.toggle('is-selected', selected);
        btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      return;
    }

    isAnimating = true;

    const firstRects = new Map();
    const statusByCard = new Map();
    const exitingCards = [];
    const enteringCards = [];
    const stayingCards = [];
    const hiddenCards = [];

    cards.forEach((card) => {
      card.getAnimations().forEach((anim) => anim.cancel());
      if (card.parentElement !== gallery && card.parentElement !== exitOverlay) {
        gallery.appendChild(card);
      }
      card.classList.remove('is-entering', 'is-entering-active');
      clearCardInlineState(card);

      if (card.parentElement === gallery && card.style.display !== 'none') {
        firstRects.set(card, card.getBoundingClientRect());
      }
    });

    visibilityPlan.forEach(({ card, visible }) => {
      const isVisibleNow = card.parentElement === gallery && card.style.display !== 'none';
      const status = visible ? (isVisibleNow ? 'staying' : 'entering') : (isVisibleNow ? 'exiting' : 'hidden');
      statusByCard.set(card, status);

      if (status === 'staying') stayingCards.push(card);
      else if (status === 'entering') enteringCards.push(card);
      else if (status === 'exiting') exitingCards.push(card);
      else hiddenCards.push(card);
    });

    // Move exiting cards to overlay so they can fade without reserving grid space.
    exitingCards.forEach((card) => {
      const rect = firstRects.get(card);
      if (!rect) {
        card.style.display = 'none';
        return;
      }
      card.style.width = `${rect.width}px`;
      card.style.height = `${rect.height}px`;
      card.style.left = `${rect.left + window.scrollX}px`;
      card.style.top = `${rect.top + window.scrollY}px`;
      card.style.transition = `opacity ${EXIT_FADE_MS}ms ${easingFade}`;
      card.classList.add('is-exiting');
      exitOverlay.appendChild(card);
    });

    // Final grid visibility state.
    hiddenCards.forEach((card) => {
      if (card.parentElement !== gallery) return;
      card.style.display = 'none';
    });
    enteringCards.forEach((card) => {
      if (card.parentElement !== gallery) gallery.appendChild(card);
      card.style.display = '';
      card.classList.add('is-entering');
    });
    stayingCards.forEach((card) => {
      if (card.parentElement !== gallery) gallery.appendChild(card);
      card.style.display = '';
    });
    restoreGalleryOrder();

    requestAnimationFrame(() => {
      if (runId !== filterRunId) return;

      const lastRects = new Map();
      [...stayingCards, ...enteringCards].forEach((card) => {
        lastRects.set(card, card.getBoundingClientRect());
      });

      // FLIP movement for cards that remain visible.
      stayingCards.forEach((card) => {
        const firstRect = firstRects.get(card);
        const lastRect = lastRects.get(card);
        if (!firstRect || !lastRect) return;
        const dx = firstRect.left - lastRect.left;
        const dy = firstRect.top - lastRect.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
        card.style.transform = `translate(${dx}px, ${dy}px)`;
        card.style.transition = 'none';
      });
      requestAnimationFrame(() => {
        if (runId !== filterRunId) return;
        stayingCards.forEach((card) => {
          if (!card.style.transform) return;
          card.style.transition = `transform ${MOVE_MS}ms ${easingMove}`;
          card.style.transform = 'translate(0, 0)';
        });
      });

      // Fade in entering cards.
      requestAnimationFrame(() => {
        if (runId !== filterRunId) return;
        enteringCards.forEach((card) => {
          card.style.transition = `opacity ${ENTER_FADE_MS}ms ${easingFade}`;
          card.classList.add('is-entering-active');
        });
      });
      window.setTimeout(() => {
        if (runId !== filterRunId) return;
        enteringCards.forEach((card) => {
          card.classList.remove('is-entering', 'is-entering-active');
          card.style.opacity = '';
        });
      }, ENTER_FADE_MS + 20);

      // Remove exiting cards after fade.
      window.setTimeout(() => {
        if (runId !== filterRunId) return;
        exitingCards.forEach((card) => {
          card.style.display = 'none';
          card.classList.remove('is-exiting');
          clearCardInlineState(card);
          gallery.appendChild(card);
        });
        restoreGalleryOrder();
      }, EXIT_FADE_MS + 20);

      // Fade badges in after card movement settles.
      window.setTimeout(() => {
        if (runId !== filterRunId) return;
        ensureCardBadges(cards, byId);
        const visibleBadges = cards
          .filter((card) => card.parentElement === gallery && card.style.display !== 'none')
          .map((card) => card.querySelector('.wip-badge'))
          .filter(Boolean);
        visibleBadges.forEach((badge) => {
          badge.classList.add('badge-fade');
          badge.classList.remove('is-visible');
          badge.style.transition = `opacity ${BADGE_FADE_MS}ms ${easingFade}`;
        });
        requestAnimationFrame(() => {
          if (runId !== filterRunId) return;
          visibleBadges.forEach((badge) => badge.classList.add('is-visible'));
        });
      }, BADGE_REVEAL_DELAY_MS);
    });

    // If a new filter action starts while exits are still animating, clean them up quickly.
    window.setTimeout(() => {
      if (runId !== filterRunId) {
        exitingCards.forEach((card) => {
          if (card.parentElement !== exitOverlay) return;
          card.classList.remove('is-exiting');
          card.style.display = 'none';
          clearCardInlineState(card);
          gallery.appendChild(card);
        });
        restoreGalleryOrder();
      }
    }, MOVE_MS + BADGE_FADE_MS);

    // Unlock interactions when movement completes; apply queued selection if any.
    window.setTimeout(() => {
      if (runId !== filterRunId) return;
      isAnimating = false;
      if (hasQueuedApply) {
        hasQueuedApply = false;
        applyFilter();
      }
    }, MOVE_MS + 20);

    countEl.textContent = `Showing ${shown} of ${total}`;

    const chipButtons = Array.from(filterRoot.querySelectorAll('.skill-chip'));
    chipButtons.forEach((btn) => {
      const skill = btn.dataset.skill || '';
      const selected = skill === '__all__' ? usingAll : selectedSkills.has(skill);
      btn.classList.toggle('is-selected', selected);
      btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
  };

  const onChipClick = (event) => {
    if (!isReady) return;
    const button = event.target.closest('.skill-chip');
    if (!button) return;
    const skill = button.dataset.skill || '';
    if (!skill) return;

    if (skill === '__all__') {
      selectedSkills.clear();
      if (isAnimating) {
        hasQueuedApply = true;
      } else {
        applyFilter();
      }
      return;
    }

    if (event.shiftKey) {
      if (selectedSkills.has(skill)) selectedSkills.delete(skill);
      else selectedSkills.add(skill);
      if (isAnimating) {
        hasQueuedApply = true;
      } else {
        applyFilter();
      }
      return;
    }

    if (selectedSkills.size === 1 && selectedSkills.has(skill)) {
      selectedSkills.clear();
      if (isAnimating) {
        hasQueuedApply = true;
      } else {
        applyFilter();
      }
      return;
    }

    selectedSkills.clear();
    selectedSkills.add(skill);
    if (isAnimating) {
      hasQueuedApply = true;
    } else {
      applyFilter();
    }
  };

  if (toggleBtn) {
    const syncToggleState = () => {
      const isOpen = filterRoot.classList.contains('is-open');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    };

    toggleBtn.addEventListener('click', () => {
      filterRoot.classList.toggle('is-open');
      syncToggleState();
    });

    syncToggleState();
  }

  ensureCardBadges(cards, byId);
  applyFilter();
  isReady = true;
  filterRoot.addEventListener('click', onChipClick);
}

async function initProjectGalleries() {
  try {
    const data = await loadProjectsData();
    const projects = Array.isArray(data.projects) ? data.projects : [];
    const galleries = data.galleries && typeof data.galleries === 'object' ? data.galleries : {};
    const byId = Object.fromEntries(projects.map((p) => [p.id, p]));

    Object.entries(galleries).forEach(([galleryId, galleryEntries]) => {
      const container = document.getElementById(galleryId);
      if (!container || !Array.isArray(galleryEntries)) return;
      renderGallery(container, galleryEntries, byId);
    });

    initCompositingSkillFilter(data, byId);
  } catch (err) {
    console.warn(err);
  }
}

document.addEventListener('DOMContentLoaded', initProjectGalleries);
