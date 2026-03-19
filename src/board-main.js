/**
 * board-main.js
 * Standalone entry point for the Monopoly Board Editor page.
 * Has its own state management, independent from the card generator's main.js.
 */

import './style.css';
import './components/Board.css';
import * as htmlToImage from 'html-to-image';
import { createDefaultBoardState } from './data/defaultBoard.js';
import { renderBoardForm, renderBoardPreview, cleanupBoardListeners, setBoardAppState } from './components/Board.js';

// ============================================================
//  localStorage persistence
// ============================================================
const STORAGE_KEY = 'customMonopoly_boardState';

function loadBoardState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved && Array.isArray(saved.spaces) && saved.spaces.length === 40) {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to load board state from localStorage:', e);
  }
  return null;
}

function saveBoardState(board) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch (e) {
    console.warn('Failed to save board state:', e);
  }
}

// ============================================================
//  Lightweight PubSub (same pattern as main app)
// ============================================================
const subscribers = {};

export const boardAppState = {
  board: loadBoardState() || createDefaultBoardState(),
  boardRotation: 0, // 0, 90, 180, 270

  subscribe(event, callback) {
    if (!subscribers[event]) subscribers[event] = [];
    subscribers[event].push(callback);
  },

  publish(event, data) {
    if (subscribers[event]) {
      subscribers[event].forEach(cb => cb(data));
    }
  },

  updateBoardSpace(index, key, value) {
    this.board.spaces[index][key] = value;
    this.publish('board_updated', this.board);
  },

  setBoardRotation(degrees) {
    this.boardRotation = degrees;
    this.publish('rotation_changed', degrees);
  }
};

// Save board on every change
boardAppState.subscribe('board_updated', (board) => {
  saveBoardState(board);
});

// ============================================================
//  UI Shell
// ============================================================
function initBoardApp() {
  setBoardAppState(boardAppState);
  const root = document.getElementById('board-app');

  root.innerHTML = `
    <div class="top-bar">
      <a href="index.html" class="top-bar-back" title="Back to Card Generator">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
      </a>
      <span class="top-bar-label" style="font-size: 0.95rem; font-weight: 700; color: var(--text-light);">Board Editor</span>
      <div style="flex:1;"></div>
      <button class="board-toolbar-btn board-toolbar-btn--danger" id="board-reset" title="Reset board to default">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        <span>Reset Board</span>
      </button>
      <button class="board-toolbar-btn" id="board-export-json" title="Export board as JSON">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Export JSON</span>
      </button>
      <button class="board-toolbar-btn" id="board-import-json" title="Import board from JSON">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span>Import JSON</span>
      </button>
      <button class="board-toolbar-btn" id="board-download-png" title="Download board as PNG">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Download PNG</span>
      </button>
      <div class="board-rotate-controls">
        <span class="board-rotate-label">Rotate:</span>
        <button class="board-rotate-btn active" data-rotation="0" title="0°">0°</button>
        <button class="board-rotate-btn" data-rotation="90" title="90°">90°</button>
        <button class="board-rotate-btn" data-rotation="180" title="180°">180°</button>
        <button class="board-rotate-btn" data-rotation="270" title="270°">270°</button>
      </div>
    </div>
    <div class="app-container">
      <div class="board-form-panel" id="board-form-panel">
        <!-- Form rendered here -->
      </div>
      <div class="board-preview-workspace" id="board-preview-workspace">
        <div class="board-export-wrapper" id="board-export-wrapper">
          <!-- Board rendered here -->
        </div>
      </div>
    </div>

    <!-- Board JSON Export modal -->
    <div id="board-json-export-modal" class="modal-overlay" style="display:none;">
      <div class="modal-content modal-wide">
        <h3>Export Board JSON</h3>
        <p>Download as file or copy the text below.</p>
        <textarea id="board-json-export-text" class="modal-textarea" readonly></textarea>
        <div class="modal-actions">
          <button id="board-json-export-close" class="btn-secondary">Close</button>
          <button id="board-json-export-copy" class="btn-primary">Copy to Clipboard</button>
          <button id="board-json-export-download" class="btn-primary">Download File</button>
        </div>
      </div>
    </div>

    <!-- Board JSON Import modal -->
    <div id="board-json-import-modal" class="modal-overlay" style="display:none;">
      <div class="modal-content modal-wide">
        <h3>Import Board JSON</h3>
        <p>Paste JSON text below, or load from a file.</p>
        <textarea id="board-json-import-text" class="modal-textarea" placeholder="Paste your board JSON here..."></textarea>
        <div class="modal-actions">
          <button id="board-json-import-close" class="btn-secondary">Cancel</button>
          <button id="board-json-import-file" class="btn-primary">Load from File</button>
          <button id="board-json-import-paste" class="btn-primary btn-batch">Import from Text</button>
        </div>
      </div>
    </div>

    <!-- Hidden file input for JSON import -->
    <input type="file" id="board-json-file-input" accept=".json" style="display:none" />
  `;

  // Render form and preview
  const formPanel = document.getElementById('board-form-panel');
  const exportWrapper = document.getElementById('board-export-wrapper');

  renderBoardForm(formPanel);
  renderBoardPreview(exportWrapper);

  // Bind download button
  document.getElementById('board-download-png').addEventListener('click', downloadBoardPng);

  // Bind rotation buttons
  document.querySelectorAll('.board-rotate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const deg = parseInt(btn.dataset.rotation, 10);
      boardAppState.setBoardRotation(deg);
      // Update active state
      document.querySelectorAll('.board-rotate-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Bind JSON Export
  document.getElementById('board-export-json').addEventListener('click', () => {
    const modal = document.getElementById('board-json-export-modal');
    const textarea = document.getElementById('board-json-export-text');
    textarea.value = getBoardJsonString();
    modal.style.display = 'flex';
  });

  document.getElementById('board-json-export-close').addEventListener('click', () => {
    document.getElementById('board-json-export-modal').style.display = 'none';
  });

  document.getElementById('board-json-export-copy').addEventListener('click', () => {
    const text = document.getElementById('board-json-export-text').value;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('board-json-export-copy');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 2000);
    });
  });

  document.getElementById('board-json-export-download').addEventListener('click', () => {
    const jsonStr = getBoardJsonString();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'monopoly_board.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    document.getElementById('board-json-export-modal').style.display = 'none';
  });

  // Bind JSON Import
  const jsonFileInput = document.getElementById('board-json-file-input');

  document.getElementById('board-import-json').addEventListener('click', () => {
    document.getElementById('board-json-import-text').value = '';
    document.getElementById('board-json-import-modal').style.display = 'flex';
  });

  document.getElementById('board-json-import-close').addEventListener('click', () => {
    document.getElementById('board-json-import-modal').style.display = 'none';
  });

  document.getElementById('board-json-import-file').addEventListener('click', () => {
    jsonFileInput.click();
  });

  jsonFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (importBoardJson(ev.target.result)) {
        document.getElementById('board-json-import-modal').style.display = 'none';
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('board-json-import-paste').addEventListener('click', () => {
    const text = document.getElementById('board-json-import-text').value.trim();
    if (!text) {
      document.getElementById('board-json-import-text').style.borderColor = '#ef4444';
      return;
    }
    if (importBoardJson(text)) {
      document.getElementById('board-json-import-modal').style.display = 'none';
    }
  });

  // Bind reset button
  document.getElementById('board-reset').addEventListener('click', () => {
    if (!confirm('Reset the board to default? All changes will be lost.')) return;
    boardAppState.board = createDefaultBoardState();
    saveBoardState(boardAppState.board);
    boardAppState.publish('board_updated', boardAppState.board);
    // Re-render form to reflect reset
    renderBoardForm(document.getElementById('board-form-panel'));
  });
}

// ============================================================
//  Board JSON Export / Import
// ============================================================
const PLACEHOLDER_IMAGE = 'assets/cardselements/placeholder.jpeg';

function getBoardJsonString() {
  const board = boardAppState.board;
  // Sanitize base64 images for export
  const sanitizedSpaces = board.spaces.map(space => {
    const clone = { ...space };
    if (clone.image && clone.image.startsWith('data:')) {
      clone.image = PLACEHOLDER_IMAGE;
    }
    return clone;
  });

  const exportData = {
    version: 1,
    type: 'board',
    centerColor: board.centerColor,
    centerImage: board.centerImage && board.centerImage.startsWith('data:') ? PLACEHOLDER_IMAGE : board.centerImage,
    spaces: sanitizedSpaces
  };

  return JSON.stringify(exportData, null, 2);
}

function importBoardJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (!data.type || data.type !== 'board' || !Array.isArray(data.spaces) || data.spaces.length !== 40) {
      alert('Invalid board JSON: must have type "board" and 40 spaces.');
      return false;
    }

    boardAppState.board.centerColor = data.centerColor || '#C8E6C8';
    boardAppState.board.centerImage = data.centerImage === PLACEHOLDER_IMAGE ? null : (data.centerImage || null);
    boardAppState.board.spaces = data.spaces;
    boardAppState.board.selectedSpaceIndex = 0;

    saveBoardState(boardAppState.board);
    boardAppState.publish('board_updated', boardAppState.board);
    renderBoardForm(document.getElementById('board-form-panel'));

    return true;
  } catch (e) {
    alert('Failed to parse board JSON: ' + e.message);
    console.error('Board import error:', e);
    return false;
  }
}

// ============================================================
//  PNG Download via html2canvas
// ============================================================
async function downloadBoardPng() {
  const exportWrapper = document.getElementById('board-export-wrapper');
  if (!exportWrapper) return;

  const boardEl = exportWrapper.querySelector('.monopoly-board');
  if (!boardEl) {
    alert('No board to export.');
    return;
  }

  // Temporarily reset transforms (including rotation on inner board) for clean capture
  const savedTransform = exportWrapper.style.transform;
  const savedOrigin = exportWrapper.style.transformOrigin;
  const savedBoardTransform = boardEl.style.transform;
  const savedBoardOrigin = boardEl.style.transformOrigin;
  exportWrapper.style.transform = 'none';
  exportWrapper.style.transformOrigin = '';
  boardEl.style.transform = 'none';
  boardEl.style.transformOrigin = '';

  // Remove highlight momentarily
  const highlightedSpace = boardEl.querySelector('.highlighted');
  if (highlightedSpace) {
    highlightedSpace.classList.remove('highlighted');
  }

  try {
    const blob = await htmlToImage.toBlob(boardEl, {
      pixelRatio: 3,
      backgroundColor: 'transparent',
      width: 1100,
      height: 1100
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'monopoly_board.png';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Board export error:', err);
    alert('Export failed. Check the console for details.');
  } finally {
    exportWrapper.style.transform = savedTransform;
    exportWrapper.style.transformOrigin = savedOrigin;
    boardEl.style.transform = savedBoardTransform;
    boardEl.style.transformOrigin = savedBoardOrigin;

    if (highlightedSpace) {
      highlightedSpace.classList.add('highlighted');
    }
  }
}

// ============================================================
//  Boot
// ============================================================
initBoardApp();
