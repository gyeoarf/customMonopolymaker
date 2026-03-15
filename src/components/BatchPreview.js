import { appState } from '../main.js';
import { renderStaticCard, getCardDimensions } from './CardRenderer.js';
import { escapeHtml } from '../utils/sanitize.js';

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

  let scale = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  const updateTransform = () => {
    canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  };

  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.max(0.2, Math.min(3, scale + delta));
    updateTransform();
  }, { passive: false });

  viewport.addEventListener('mousedown', (e) => {
    if (e.target === viewport || e.target === canvas) {
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      viewport.style.cursor = 'grabbing';
    }
  });

  const onMouseMove = (e) => {
    if (!isPanning) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
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
