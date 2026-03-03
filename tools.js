async function loadToolsData() {
  const res = await fetch('/data/tools.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load tools data: ${res.status}`);
  return res.json();
}

function renderTags(tags) {
  if (!Array.isArray(tags) || !tags.length) return '';
  return `
    <div class="tool-project__meta">
      ${tags.map((tag) => `<span class="tool-tag">${tag}</span>`).join('')}
    </div>
  `;
}

function renderBullets(bulletsHtml) {
  if (!Array.isArray(bulletsHtml) || !bulletsHtml.length) return '';
  return `
    <ul class="tool-project__bullets">
      ${bulletsHtml.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  `;
}

function renderMedia(tool) {
  const mediaClasses = `tool-project__media${tool.mediaPlaceholder ? ' tool-project__media--placeholder' : ''}`;
  const aria = tool.ariaLabel ? ` aria-label="${tool.ariaLabel}"` : '';
  const badge = tool.statusBadge ? `<div class="tool-project__badge">${tool.statusBadge}</div>` : '';

  if (tool.previewMp4 && tool.thumbJpg) {
    return `
      <div class="${mediaClasses}"${aria}>
        ${badge}
        <img class="tool-project__thumb" src="${tool.thumbJpg}" alt="" aria-hidden="true" loading="lazy" decoding="async">
        <video class="tool-project__video" loop muted playsinline preload="none" data-src="${tool.previewMp4}"></video>
      </div>
    `;
  }

  return `
    <div class="${mediaClasses}"${aria}>
      ${badge}
      <div class="tool-project__placeholder">Preview coming soon</div>
    </div>
  `;
}

function renderTool(tool) {
  return `
    <article class="tool-project">
      ${renderMedia(tool)}
      <div class="tool-project__body">
        <header class="tool-project__header">
          <h4>${tool.title}</h4>
          ${renderTags(tool.tags)}
        </header>
        <p class="muted tool-project__lead">${tool.descriptionHtml}</p>
        ${renderBullets(tool.bulletsHtml)}
      </div>
    </article>
  `;
}

function applyToolCardMediaState(scope) {
  const cards = Array.from(scope.querySelectorAll('.tool-project'));
  cards.forEach((card) => {
    const video = card.querySelector('video.tool-project__video');
    const src = (video?.getAttribute('src') || '').trim();
    const dataSrc = (video?.dataset?.src || '').trim();
    const hasVideo = Boolean(video && (src || dataSrc));

    card.classList.toggle('has-video', hasVideo);
    card.classList.toggle('no-video', !hasVideo);
    card.dataset.hasVideo = hasVideo ? 'true' : 'false';
  });
}

async function initToolsGallery() {
  const gallery = document.getElementById('tools-gallery');
  if (!gallery) return;

  try {
    const data = await loadToolsData();
    const tools = Array.isArray(data.tools) ? data.tools : [];
    gallery.innerHTML = tools.map((tool) => renderTool(tool)).join('');
    applyToolCardMediaState(gallery);
    window.dispatchEvent(new CustomEvent('tools:rendered'));
  } catch (err) {
    console.warn(err);
  }
}

document.addEventListener('DOMContentLoaded', initToolsGallery);
