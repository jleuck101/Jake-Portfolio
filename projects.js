async function loadProjectsData() {
  const res = await fetch('/data/projects.json', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load projects data: ${res.status}`);
  }
  return res.json();
}

function renderCard(project) {
  const badge = project.badge === 'WIP' || project.badge === 'Updating' ? project.badge : null;
  const classes = badge ? 'project-thumb wip-thumb' : 'project-thumb';

  return `
    <a href="${project.href}" class="${classes}">
      ${badge ? `<div class="wip-badge">${badge}</div>` : ''}
      <img src="${project.thumbnail}" alt="${project.alt}">
      <div class="overlay">${project.overlay}</div>
    </a>
  `;
}

function renderGallery(container, galleryIds, byId) {
  container.innerHTML = galleryIds
    .map((id) => byId[id])
    .filter(Boolean)
    .map((project) => renderCard(project))
    .join('');
}

async function initProjectGalleries() {
  try {
    const data = await loadProjectsData();
    const projects = Array.isArray(data.projects) ? data.projects : [];
    const galleries = data.galleries && typeof data.galleries === 'object' ? data.galleries : {};
    const byId = Object.fromEntries(projects.map((p) => [p.id, p]));

    Object.entries(galleries).forEach(([galleryId, galleryIds]) => {
      const container = document.getElementById(galleryId);
      if (!container || !Array.isArray(galleryIds)) return;
      renderGallery(container, galleryIds, byId);
    });
  } catch (err) {
    console.warn(err);
  }
}

document.addEventListener('DOMContentLoaded', initProjectGalleries);
