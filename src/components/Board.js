/**
 * Board.js
 * Monopoly Board Preview component — form + live preview with pan/zoom.
 * Receives boardAppState via setBoardAppState() to avoid circular imports.
 */

let boardAppState = null;

export function setBoardAppState(state) {
  boardAppState = state;
}

import { escapeHtml } from '../utils/sanitize.js';
import { renderStaticBoard } from './BoardRenderer.js';
import { CORNER_INDICES, createDefaultSpace, getSpaceLabel } from '../data/defaultBoard.js';

// ============================================================
//  Batch card linking — reads batch cards from main app localStorage
// ============================================================
const MAIN_STORAGE_KEY = 'customMonopoly_appState';

function getBatchCards() {
  try {
    const raw = localStorage.getItem(MAIN_STORAGE_KEY);
    if (!raw) return [];
    const state = JSON.parse(raw);
    return Array.isArray(state.batchCards) ? state.batchCards : [];
  } catch (e) {
    return [];
  }
}

function getBatchCardsForSpaceType(spaceType) {
  const batchCards = getBatchCards();
  // Map board space types to batch card types
  const typeMap = { property: 'property', railroad: 'railroad', utility: 'utility' };
  const batchType = typeMap[spaceType];
  if (!batchType) return [];
  return batchCards.filter(c => c.type === batchType);
}

// Track document-level listeners for cleanup
let _docMoveHandler = null;
let _docUpHandler = null;
let _wsWheelHandler = null;
let _wsMouseDownHandler = null;

function cleanupBoardListeners() {
  if (_docMoveHandler) {
    document.removeEventListener('mousemove', _docMoveHandler);
    _docMoveHandler = null;
  }
  if (_docUpHandler) {
    document.removeEventListener('mouseup', _docUpHandler);
    _docUpHandler = null;
  }
  const ws = document.getElementById('board-preview-workspace');
  if (ws) {
    if (_wsWheelHandler) {
      ws.removeEventListener('wheel', _wsWheelHandler);
      _wsWheelHandler = null;
    }
    if (_wsMouseDownHandler) {
      ws.removeEventListener('mousedown', _wsMouseDownHandler);
      _wsMouseDownHandler = null;
    }
    ws.style.overflow = '';
    ws.style.cursor = '';
  }
}

// ============================================================
//  BOARD PREVIEW (Live Preview with Pan/Zoom on workspace)
// ============================================================

export function renderBoardPreview(container) {
  if (!container) return;

  cleanupBoardListeners();

  const board = boardAppState.board;

  // Render the board directly in the export wrapper
  container.innerHTML = renderStaticBoard(board);

  // Highlight selected space
  highlightSpace(container, board.selectedSpaceIndex);

  // ---- Pan / Zoom on the workspace ----
  const workspace = document.getElementById('board-preview-workspace');
  if (!workspace) return;

  workspace.style.overflow = 'hidden';
  workspace.style.cursor = 'grab';

  container.style.transformOrigin = 'top left';

  let scale = 0.55;
  let panX = 20;
  let panY = 20;
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  let rafId = null;
  let mouseDownPos = null;

  // Center the board initially
  const wsRect = workspace.getBoundingClientRect();
  const boardVisualW = 1100 * scale;
  const boardVisualH = 1100 * scale;
  panX = Math.max(20, (wsRect.width - boardVisualW) / 2);
  panY = Math.max(20, (wsRect.height - boardVisualH) / 2);

  const getRotation = () => boardAppState.boardRotation || 0;

  const applyBoardRotation = () => {
    const boardEl = container.querySelector('.monopoly-board');
    if (boardEl) {
      const rot = getRotation();
      boardEl.style.transformOrigin = 'center center';
      boardEl.style.transform = rot ? `rotate(${rot}deg)` : '';
    }
  };

  const updateTransform = () => {
    container.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    applyBoardRotation();
    rafId = null;
  };

  const requestUpdate = () => {
    if (!rafId) rafId = requestAnimationFrame(updateTransform);
  };

  updateTransform();

  _wsWheelHandler = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    scale = Math.max(0.1, Math.min(5, scale + delta));
    requestUpdate();
  };

  _wsMouseDownHandler = (e) => {
    mouseDownPos = { x: e.clientX, y: e.clientY };
    isPanning = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    workspace.style.cursor = 'grabbing';
    e.preventDefault();
  };

  _docMoveHandler = (e) => {
    if (!isPanning) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    requestUpdate();
  };

  _docUpHandler = (e) => {
    if (!isPanning) return;
    isPanning = false;
    workspace.style.cursor = 'grab';

    // Click vs drag disambiguation
    if (mouseDownPos) {
      const dx = Math.abs(e.clientX - mouseDownPos.x);
      const dy = Math.abs(e.clientY - mouseDownPos.y);
      if (dx < 5 && dy < 5) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const spaceEl = el ? el.closest('.board-space') : null;
        if (spaceEl) {
          const idx = parseInt(spaceEl.dataset.index, 10);
          if (!isNaN(idx)) {
            boardAppState.board.selectedSpaceIndex = idx;
            boardAppState.publish('board_updated', boardAppState.board);
          }
        }
      }
      mouseDownPos = null;
    }
  };

  workspace.addEventListener('wheel', _wsWheelHandler, { passive: false });
  workspace.addEventListener('mousedown', _wsMouseDownHandler);
  document.addEventListener('mousemove', _docMoveHandler);
  document.addEventListener('mouseup', _docUpHandler);

  // ---- Subscribe to updates ----
  boardAppState.subscribe('board_updated', (data) => {
    container.innerHTML = renderStaticBoard(data);
    highlightSpace(container, data.selectedSpaceIndex);
    container.style.transformOrigin = 'top left';
    container.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    applyBoardRotation();
  });

  // ---- Subscribe to rotation changes ----
  boardAppState.subscribe('rotation_changed', () => {
    applyBoardRotation();
  });
}

function highlightSpace(root, index) {
  if (!root) return;
  root.querySelectorAll('.board-space').forEach(el => el.classList.remove('highlighted'));
  const target = root.querySelector(`.board-space[data-index="${index}"]`);
  if (target) target.classList.add('highlighted');
}

// ============================================================
//  BOARD FORM (Space selector + context-sensitive editor)
// ============================================================

export function renderBoardForm(container) {
  if (!container) return;

  const board = boardAppState.board;

  container.innerHTML = `
    <div style="padding: 16px;">
      <h2 style="font-size: 16px; margin-bottom: 16px; color: var(--text-light);">Board Editor</h2>

      <!-- Board-level settings -->
      <div class="board-form-section">
        <h3>Board Center</h3>
        <div class="board-form-row">
          <label>Background Color</label>
          <input type="color" id="board-center-color" value="${board.centerColor || '#C8E6C8'}" />
        </div>
        <div class="board-form-row">
          <label>Center Image</label>
          <input type="file" id="board-center-image" accept="image/*" style="flex:1; font-size:11px;" />
          <button class="btn-clear" id="board-center-image-clear">Clear</button>
        </div>
      </div>

      <!-- Space selector -->
      <div class="board-form-section">
        <h3>Space Editor</h3>
        <select class="board-space-select" id="board-space-select">
          ${renderSpaceOptions(board.spaces, board.selectedSpaceIndex)}
        </select>
        <div id="board-space-form">
          <!-- Dynamically rendered per selected space -->
        </div>
      </div>
    </div>
  `;

  // Render the initial space form
  renderSpaceForm(board);

  // ---- Bind board-level events ----
  document.getElementById('board-center-color').addEventListener('input', (e) => {
    boardAppState.board.centerColor = e.target.value;
    boardAppState.publish('board_updated', boardAppState.board);
  });

  document.getElementById('board-center-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      boardAppState.board.centerImage = ev.target.result;
      boardAppState.publish('board_updated', boardAppState.board);
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('board-center-image-clear').addEventListener('click', () => {
    boardAppState.board.centerImage = null;
    boardAppState.publish('board_updated', boardAppState.board);
  });

  // ---- Space selector ----
  document.getElementById('board-space-select').addEventListener('change', (e) => {
    boardAppState.board.selectedSpaceIndex = parseInt(e.target.value, 10);
    boardAppState.publish('board_updated', boardAppState.board);
    renderSpaceForm(boardAppState.board);
  });

  // ---- Subscribe to board_updated for form sync (e.g., when clicking a space in preview) ----
  boardAppState.subscribe('board_updated', (data) => {
    const select = document.getElementById('board-space-select');
    if (select && parseInt(select.value, 10) !== data.selectedSpaceIndex) {
      select.value = data.selectedSpaceIndex;
      renderSpaceForm(data);
    }
  });
}

function renderSpaceOptions(spaces, selectedIndex) {
  const sides = [
    { label: 'Bottom Side (GO)', start: 0, end: 9 },
    { label: 'Left Side (Jail)', start: 10, end: 19 },
    { label: 'Top Side (Free Parking)', start: 20, end: 29 },
    { label: 'Right Side (Go To Jail)', start: 30, end: 39 }
  ];

  return sides.map(side => {
    const options = [];
    for (let i = side.start; i <= side.end; i++) {
      const sel = i === selectedIndex ? ' selected' : '';
      options.push(`<option value="${i}"${sel}>${escapeHtml(getSpaceLabel(i, spaces[i]))}</option>`);
    }
    return `<optgroup label="${side.label}">${options.join('')}</optgroup>`;
  }).join('');
}

function renderSpaceForm(board) {
  const formContainer = document.getElementById('board-space-form');
  if (!formContainer) return;

  const idx = board.selectedSpaceIndex;
  const space = board.spaces[idx];
  const isCorner = CORNER_INDICES.includes(idx);

  if (isCorner) {
    renderCornerForm(formContainer, idx, space);
  } else {
    renderNonCornerForm(formContainer, idx, space);
  }
}

function renderCornerForm(container, idx, space) {
  const cornerTypes = ['go', 'jail', 'free_parking', 'go_to_jail'];
  const cornerLabels = { go: 'GO', jail: 'Jail', free_parking: 'Free Parking', go_to_jail: 'Go To Jail' };
  const cornerTypeOptions = cornerTypes
    .map(t => `<option value="${t}" ${t === space.type ? 'selected' : ''}>${cornerLabels[t]}</option>`)
    .join('');

  container.innerHTML = `
    <div class="board-form-section">
      <div class="board-form-row">
        <label>Corner Type</label>
        <select class="board-type-select" id="sf-corner-type">${cornerTypeOptions}</select>
      </div>
      <div class="board-form-row">
        <label>Main Text</label>
        <input type="text" id="sf-corner-text" value="${escapeHtml(space.cornerText || '')}" />
      </div>
      <div class="board-form-row">
        <label>Sub Text</label>
        <input type="text" id="sf-corner-subtext" value="${escapeHtml(space.cornerSubtext || '')}" />
      </div>
      <div class="board-form-row">
        <label>Text Color</label>
        <input type="color" id="sf-corner-text-color" value="${space.cornerTextColor || '#000000'}" />
      </div>
      <div class="board-form-row">
        <label>Image</label>
        <input type="file" id="sf-corner-image" accept="image/*" style="flex:1; font-size:11px;" />
        <button class="btn-clear" id="sf-corner-image-clear">Clear</button>
      </div>
    </div>
  `;

  // Corner type change — replaces the space with a new corner default
  document.getElementById('sf-corner-type').addEventListener('change', (e) => {
    const newType = e.target.value;
    const newSpace = createDefaultSpace(newType, '');
    boardAppState.board.spaces[idx] = newSpace;
    boardAppState.publish('board_updated', boardAppState.board);
    renderSpaceForm(boardAppState.board);
    updateSpaceSelectLabel(idx, newSpace);
  });

  bindInput('sf-corner-text', 'input', (val) => {
    boardAppState.updateBoardSpace(idx, 'cornerText', val);
  });
  bindInput('sf-corner-subtext', 'input', (val) => {
    boardAppState.updateBoardSpace(idx, 'cornerSubtext', val);
  });
  bindInput('sf-corner-text-color', 'input', (val) => {
    boardAppState.updateBoardSpace(idx, 'cornerTextColor', val);
  });
  bindFileInput('sf-corner-image', idx, 'image');
  bindClearButton('sf-corner-image-clear', idx, 'image');
}

function renderNonCornerForm(container, idx, space) {
  const typeOptions = ['property', 'railroad', 'utility', 'chance', 'chest', 'tax']
    .map(t => `<option value="${t}" ${t === space.type ? 'selected' : ''}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`)
    .join('');

  let conditionalFields = '';

  if (space.type === 'property') {
    conditionalFields = `
      <div class="board-form-row">
        <label>Color Stripe</label>
        <input type="color" id="sf-prop-color" value="${space.color || '#8B4513'}" />
      </div>
      <div class="board-form-row">
        <label>Price</label>
        <input type="text" id="sf-prop-price" value="${escapeHtml(space.price || '')}" />
      </div>
    `;
  } else if (space.type === 'railroad' || space.type === 'tax') {
    conditionalFields = `
      <div class="board-form-row">
        <label>Price</label>
        <input type="text" id="sf-price" value="${escapeHtml(space.price || '')}" />
      </div>
    `;
  }

  // Build "Link from Batch" section for linkable types
  let linkBatchSection = '';
  const linkableTypes = ['property', 'railroad', 'utility'];
  if (linkableTypes.includes(space.type)) {
    const matchingCards = getBatchCardsForSpaceType(space.type);
    const linkedId = space.linkedBatchCardId || '';
    if (matchingCards.length > 0) {
      const cardOptions = matchingCards.map(c => {
        const label = escapeHtml(c.data.title || c.data.name || c.type);
        const sel = c.id === linkedId ? ' selected' : '';
        return `<option value="${c.id}"${sel}>${label}</option>`;
      }).join('');
      linkBatchSection = `
        <div class="board-form-section board-link-batch-section">
          <h3>Link from Batch</h3>
          <div class="board-form-row">
            <select class="board-space-select" id="sf-link-batch" style="flex:1;">
              <option value="">— Select a card —</option>
              ${cardOptions}
            </select>
            <button class="btn-link-batch" id="sf-link-batch-apply" title="Apply card data to this space">Apply</button>
          </div>
          ${linkedId ? `<div class="board-link-status">Linked to: <strong>${escapeHtml(matchingCards.find(c => c.id === linkedId)?.data.title || '?')}</strong> <button class="btn-unlink" id="sf-unlink-batch" title="Remove link">Unlink</button></div>` : ''}
        </div>
      `;
    } else {
      linkBatchSection = `
        <div class="board-form-section board-link-batch-section">
          <h3>Link from Batch</h3>
          <p class="board-link-empty">No ${space.type} cards in batch. Create some in the <a href="index.html">Card Generator</a> first.</p>
        </div>
      `;
    }
  }

  container.innerHTML = `
    <div class="board-form-section">
      <div class="board-form-row">
        <label>Type</label>
        <select class="board-type-select" id="sf-type">${typeOptions}</select>
      </div>
      ${linkBatchSection}
      <div class="board-form-row">
        <label>Name</label>
        <input type="text" id="sf-name" value="${escapeHtml(space.name || '')}" />
      </div>
      <div class="board-form-row">
        <label>Name Color</label>
        <input type="color" id="sf-name-color" value="${space.nameColor || '#000000'}" />
      </div>
      ${conditionalFields}
      <div class="board-form-row">
        <label>Image</label>
        <input type="file" id="sf-image" accept="image/*" style="flex:1; font-size:11px;" />
        <button class="btn-clear" id="sf-image-clear">Clear</button>
      </div>
    </div>
  `;

  // Bind type change — resets the space to defaults
  document.getElementById('sf-type').addEventListener('change', (e) => {
    const newType = e.target.value;
    const oldName = space.name;
    const newSpace = createDefaultSpace(newType, oldName);
    boardAppState.board.spaces[idx] = newSpace;
    boardAppState.publish('board_updated', boardAppState.board);
    renderSpaceForm(boardAppState.board);
    updateSpaceSelectLabel(idx, newSpace);
  });

  bindInput('sf-name', 'input', (val) => {
    boardAppState.updateBoardSpace(idx, 'name', val);
    updateSpaceSelectLabel(idx, boardAppState.board.spaces[idx]);
  });
  bindInput('sf-name-color', 'input', (val) => {
    boardAppState.updateBoardSpace(idx, 'nameColor', val);
  });

  if (space.type === 'property') {
    bindInput('sf-prop-color', 'input', (val) => {
      boardAppState.updateBoardSpace(idx, 'color', val);
    });
    bindInput('sf-prop-price', 'input', (val) => {
      boardAppState.updateBoardSpace(idx, 'price', val);
    });
  } else if (space.type === 'railroad' || space.type === 'tax') {
    bindInput('sf-price', 'input', (val) => {
      boardAppState.updateBoardSpace(idx, 'price', val);
    });
  }

  bindFileInput('sf-image', idx, 'image');
  bindClearButton('sf-image-clear', idx, 'image');

  // ---- Batch linking events ----
  const applyBtn = document.getElementById('sf-link-batch-apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const select = document.getElementById('sf-link-batch');
      const cardId = select ? select.value : '';
      if (!cardId) return;

      const batchCards = getBatchCards();
      const card = batchCards.find(c => c.id === cardId);
      if (!card) return;

      // Apply card data to the board space
      const spaceRef = boardAppState.board.spaces[idx];
      spaceRef.name = card.data.title || card.data.name || spaceRef.name;
      spaceRef.linkedBatchCardId = cardId;

      if (card.type === 'property') {
        spaceRef.color = card.data.headerColor || spaceRef.color;
      }

      // Copy background image if available
      if (card.data.backgroundImageUrl) {
        spaceRef.image = card.data.backgroundImageUrl;
      }

      boardAppState.publish('board_updated', boardAppState.board);
      renderSpaceForm(boardAppState.board);
      updateSpaceSelectLabel(idx, spaceRef);
    });
  }

  const unlinkBtn = document.getElementById('sf-unlink-batch');
  if (unlinkBtn) {
    unlinkBtn.addEventListener('click', () => {
      delete boardAppState.board.spaces[idx].linkedBatchCardId;
      boardAppState.publish('board_updated', boardAppState.board);
      renderSpaceForm(boardAppState.board);
    });
  }
}

// ---- Helpers ----

function bindInput(id, event, callback) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener(event, (e) => callback(e.target.value));
}

function bindFileInput(id, idx, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      boardAppState.updateBoardSpace(idx, key, ev.target.result);
    };
    reader.readAsDataURL(file);
  });
}

function bindClearButton(id, idx, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', () => {
    boardAppState.updateBoardSpace(idx, key, null);
  });
}

function updateSpaceSelectLabel(idx, space) {
  const select = document.getElementById('board-space-select');
  if (!select) return;
  const option = select.querySelector(`option[value="${idx}"]`);
  if (option) {
    option.textContent = getSpaceLabel(idx, space);
  }
}

export { cleanupBoardListeners };
