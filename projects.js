async function loadProjectsData() {
  const res = await fetch('/data/projects.json', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load projects data: ${res.status}`);
  }
  return res.json();
}

function normalizeBadge(value) {
  return value === 'WIP' || value === 'Updating' ? value : null;
}

function renderCard(project, badgeOverride, hasBadgeOverride) {
  const badge = hasBadgeOverride ? normalizeBadge(badgeOverride) : normalizeBadge(project.badge);
  const classes = badge ? 'project-thumb wip-thumb' : 'project-thumb';

  return `
    <a href="${project.href}" class="${classes}">
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
  } catch (err) {
    console.warn(err);
  }
}

document.addEventListener('DOMContentLoaded', initProjectGalleries);
