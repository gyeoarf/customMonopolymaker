import { appState } from '../main.js';
import { renderStaticCard, getCardDimensions } from './CardRenderer.js';
import { escapeHtml } from '../utils/sanitize.js';

// Persistent zoom/pan state for the batch viewport
let batchViewState = { scale: 1, panX: 0, panY: 0 };

/**
 * Renders the full-size batch preview (for the toggle view).
 * Shows actual rendered card thumbnails scaled down.
 */
export function renderBatchPreview(container) {
  if (!container) return;

  const render = () => {
    const cards = appState.batchCards;

    if (cards.length === 0) {
      container.innerHTML = `
        <div class="batch-empty">
          <div class="batch-empty-icon">—</div>
          <p>No cards in batch yet.</p>
          <p class="batch-empty-sub">Use <strong>"Create and add to batch"</strong> to start building your card set.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="batch-viewport" id="batch-viewport">
        <div class="batch-canvas" id="batch-canvas">
          ${cards.map(card => {
            const dim = getCardDimensions(card.type);
            const scale = 0.55;
            const scaledW = dim.width * scale;
            const scaledH = dim.height * scale;
            return `
            <div class="batch-card-wrapper ${appState.selectedBatchCardId === card.id ? 'selected' : ''}" data-card-id="${card.id}" style="width:${scaledW}px; height:${scaledH + 36}px;">
              <button class="batch-card-delete" data-delete-id="${card.id}" title="Remove from batch">&times;</button>
              <button class="batch-card-duplicate" data-dup-id="${card.id}" title="Duplicate card">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
              <div class="batch-card-rendered" style="width:${dim.width}px; height:${dim.height}px;">
                ${renderStaticCard(card.type, card.data)}
              </div>
              <div class="batch-card-label" style="width:${scaledW}px;">
                <span class="batch-card-type">${escapeHtml(getTypeBadge(card.type))}</span>
                <span class="batch-card-name">${escapeHtml(getCardTitle(card))}</span>
              </div>
            </div>
          `}).join('')}
        </div>
      </div>
    `;

    bindBatchInteractions(container);
  };

  appState.subscribe('batch_updated', render);
  render();
}

/**
 * Renders the bottom batch strip (always visible, horizontal scroll).
 */
export function renderBatchStrip(container) {
  if (!container) return;

  const render = () => {
    const cards = appState.batchCards;

    if (cards.length === 0) {
      container.innerHTML = `
        <div class="strip-empty">No cards in batch</div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="strip-scroll">
        ${cards.map(card => {
          const dim = getCardDimensions(card.type);
          const scale = 0.25;
          const scaledW = dim.width * scale;
          const scaledH = dim.height * scale;
          const titleEscaped = escapeHtml(getCardTitle(card));
          return `
          <div class="strip-card ${appState.selectedBatchCardId === card.id ? 'selected' : ''}" data-card-id="${card.id}" title="${titleEscaped}" style="width:${scaledW}px; height:${scaledH}px;">
            <button class="strip-card-delete" data-delete-id="${card.id}">&times;</button>
            <div class="strip-card-rendered" style="width:${dim.width}px; height:${dim.height}px;">
              ${renderStaticCard(card.type, card.data)}
            </div>
          </div>
        `}).join('')}
      </div>
    `;

    // Bind strip interactions
    container.querySelectorAll('.strip-card-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        appState.removeBatchCard(e.currentTarget.dataset.deleteId);
      });
    });

    container.querySelectorAll('.strip-card').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.strip-card-delete')) return;
        // Switch to live preview and select the card
        const liveBtn = document.querySelector('#preview-toggle .toggle-btn[data-mode="live"]');
        if (liveBtn) liveBtn.click();
        appState.selectBatchCard(el.dataset.cardId);
      });
    });

    // Convert vertical scroll to horizontal scroll on the strip
    const scrollEl = container.querySelector('.strip-scroll');
    if (scrollEl) {
      scrollEl.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          scrollEl.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    }
  };

  appState.subscribe('batch_updated', render);
  render();
}

function getTypeBadge(type) {
  const badges = {
    property: 'Property',
    chance: 'Chance',
    chest: 'Chest',
    back: 'Back',
    railroad: 'Railroad',
    utility: 'Utility',
    currency: 'Currency',
    dice: 'Dice'
  };
  return badges[type] || type;
}

function getCardTitle(card) {
  const d = card.data;
  switch (card.type) {
    case 'property': return d.title || 'Untitled Property';
    case 'chance': return d.text ? d.text.substring(0, 30) + (d.text.length > 30 ? '…' : '') : 'Chance';
    case 'chest': return d.text ? d.text.substring(0, 30) + (d.text.length > 30 ? '…' : '') : 'Chest';
    case 'back': return 'Card Back';
    case 'railroad': return d.title || 'Untitled Railroad';
    case 'utility': return d.title || 'Untitled Utility';
    case 'currency': return `$${d.denomination} Bill`;
    case 'dice': return 'Dice';
    default: return 'Card';
  }
}

function bindBatchInteractions(container) {
  // Delete buttons
  container.querySelectorAll('.batch-card-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      appState.removeBatchCard(e.currentTarget.dataset.deleteId);
    });
  });

  // Duplicate buttons
  container.querySelectorAll('.batch-card-duplicate').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      appState.duplicateBatchCard(e.currentTarget.dataset.dupId);
    });
  });

  // Click to select / edit
  container.querySelectorAll('.batch-card-wrapper').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.batch-card-delete')) return;
      const liveBtn = document.querySelector('#preview-toggle .toggle-btn[data-mode="live"]');
      if (liveBtn) liveBtn.click();
      appState.selectBatchCard(el.dataset.cardId);
    });
  });

  // Pan/Zoom on the viewport
  const viewport = container.querySelector('#batch-viewport');
  const canvas = container.querySelector('#batch-canvas');
  if (!viewport || !canvas) return;

  // Restore persistent zoom/pan state
  let { scale, panX, panY } = batchViewState;
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let rafId = null;

  const updateTransform = () => {
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    rafId = null;
  };

  const requestUpdate = () => {
    if (!rafId) {
      rafId = requestAnimationFrame(updateTransform);
    }
  };

  // Apply the saved transform immediately
  updateTransform();

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.max(0.1, Math.min(5, scale + delta));
    batchViewState.scale = scale;
    requestUpdate();
  }, { passive: false });

  viewport.addEventListener('mousedown', (e) => {
    // Only pan if clicking the viewport or canvas background
    if (e.target === viewport || e.target === canvas) {
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      viewport.style.cursor = 'grabbing';
      e.preventDefault();
    }
  });

  const onMouseMove = (e) => {
    if (!isPanning) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    batchViewState.panX = panX;
    batchViewState.panY = panY;
    requestUpdate();
  };

  const onMouseUp = () => {
    if (isPanning) {
      isPanning = false;
      if (viewport) viewport.style.cursor = 'grab';
    }
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}
