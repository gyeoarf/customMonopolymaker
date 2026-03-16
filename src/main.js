import './style.css';
import './components/PropertyCard.css';
import './components/Currency.css';
import './components/Dice.css';
import './components/BatchPreview.css';
import { createIcons, Plus, Image as ImageIcon, RotateCw, Play, Settings2, Download, MousePointerSquareDashed, Upload, FolderDown, PackagePlus } from 'lucide';
import html2canvas from 'html2canvas';

import { renderPropertyForm, renderPropertyPreview } from './components/PropertyCard.js';
import { renderCurrencyForm, renderCurrencyPreview } from './components/Currency.js';
import { renderDiceForm, renderDicePreview } from './components/Dice.js';
import { renderActionCardForm, renderActionCardPreview } from './components/ActionCard.js';
import { renderSpecialCardForm, renderSpecialCardPreview } from './components/SpecialCard.js';
import { renderBatchPreview, renderBatchStrip } from './components/BatchPreview.js';
import { getProjectJsonString, exportProjectJsonFile, importProjectJson } from './components/JsonIO.js';
import { exportBatchAsZip } from './components/ZipExport.js';
import './components/ActionCard.css';

// Centralised State Manager (PubSub Pattern)
export const appState = {
  activeMenu: 'property_card', // Default view
  events: {},
  projectName: '',
  batchCards: [],           // Array of { id, type, data, timestamp }
  selectedBatchCardId: null,

  assetData: {
    property: {
      title: 'TITLE DEED',
      headerColor: '#005CE6', // Default blue
      headerTextColor: '#FFFFFF',
      textColor: '#000000',
      backgroundColor: '#FFFFFF',
      backgroundImageUrl: null,
      transform: { x: 0, y: 0, width: 270, height: 410, rotation: 0, flipX: 1, flipY: 1 },
      baseRent: 50,
      house1: 200,
      house2: 600,
      house3: 1400,
      house4: 1700,
      hotel: 2000,
      mortgage: 200,
      buildingCost: 200
    },
    chance: {
      text: 'ADVANCE TO GO. (COLLECT $200)',
      image: null,
      transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0, flipX: 1, flipY: 1 }
    },
    chest: {
      text: 'BANK ERROR IN YOUR FAVOR. COLLECT $200',
      image: null,
      transform: { x: 0, y: 0, width: 100, height: 100, rotation: 0, flipX: 1, flipY: 1 }
    },
    back: {
      backgroundColor: '#E53935',
      image: null,
      repeatPattern: false,
      transform: { x: 0, y: 0, width: 270, height: 410, rotation: 0, flipX: 1, flipY: 1 }
    },
    currency: {
      denomination: 500,
      backgroundColor: '#f7f9f2',
      backgroundImageUrl: null,
      transform: { x: 0, y: 0, width: 400, height: 210, rotation: 0, flipX: 1, flipY: 1 }
    },
    dice: {
      faces: [null, null, null, null, null, null],
      activeFaceIndex: null, // Track which face is being edited
      transforms: Array(6).fill({ x: 0, y: 0, width: 90, height: 90, rotation: 0, flipX: 1, flipY: 1 })
    },
    railroad: {
      title: 'READING RAILROAD',
      headerColor: '#000000',
      headerTextColor: '#FFFFFF',
      textColor: '#000000',
      backgroundColor: '#FFFFFF',
      rent1: 25,
      rent2: 50,
      rent3: 100,
      rent4: 200,
      mortgage: 100
    },
    utility: {
      title: 'ELECTRIC COMPANY',
      headerColor: '#000000',
      headerTextColor: '#FFFFFF',
      textColor: '#000000',
      backgroundColor: '#FFFFFF',
      backgroundImageUrl: null,
      transform: { x: 0, y: 0, width: 270, height: 410, rotation: 0, flipX: 1, flipY: 1 },
      mortgage: 75
    }
  },

  // PubSub Methods
  subscribe(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  },

  publish(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(data));
  },

  // Clear all subscriptions EXCEPT core system ones (menu_changed)
  clearComponentSubscriptions() {
    for (const key of Object.keys(this.events)) {
      if (key !== 'menu_changed') {
        delete this.events[key];
      }
    }
  },

  // State Mutators
  updateState(assetType, key, value) {
    this.assetData[assetType][key] = value;
    this.publish(`${assetType}_updated`, this.assetData[assetType]);

    // If we are editing a selected batch card, sync updates
    if (this.selectedBatchCardId) {
      const card = this.batchCards.find(c => c.id === this.selectedBatchCardId);
      if (card && card.type === assetType) {
        card.data = JSON.parse(JSON.stringify(this.assetData[assetType]));
        this.publish('batch_updated', this.batchCards);
      }
    }
  },

  setActiveMenu(menuId) {
    this.activeMenu = menuId;
    this.publish('menu_changed', this.activeMenu);
  },

  // --- Batch Methods ---

  /** Maps sidebar menuId => assetData key */
  menuToAssetType(menuId) {
    const map = {
      'property_card': 'property',
      'chance_card': 'chance',
      'chest_card': 'chest',
      'card_back': 'back',
      'railroad_card': 'railroad',
      'utility_card': 'utility',
      'currency': 'currency',
      'dice': 'dice'
    };
    return map[menuId] || menuId;
  },

  /** Maps assetData type => sidebar menuId */
  assetTypeToMenu(type) {
    const map = {
      'property': 'property_card',
      'chance': 'chance_card',
      'chest': 'chest_card',
      'back': 'card_back',
      'railroad': 'railroad_card',
      'utility': 'utility_card',
      'currency': 'currency',
      'dice': 'dice'
    };
    return map[type] || type;
  },

  addToBatch() {
    const assetType = this.menuToAssetType(this.activeMenu);
    const snapshot = JSON.parse(JSON.stringify(this.assetData[assetType]));
    const card = {
      id: crypto.randomUUID(),
      type: assetType,
      data: snapshot,
      timestamp: Date.now()
    };
    this.batchCards.push(card);
    this.publish('batch_updated', this.batchCards);
  },

  removeBatchCard(id) {
    this.batchCards = this.batchCards.filter(c => c.id !== id);
    if (this.selectedBatchCardId === id) {
      this.selectedBatchCardId = null;
    }
    this.publish('batch_updated', this.batchCards);
  },

  selectBatchCard(id) {
    const card = this.batchCards.find(c => c.id === id);
    if (!card) return;

    this.selectedBatchCardId = id;
    // Load data into editor
    this.assetData[card.type] = JSON.parse(JSON.stringify(card.data));

    // Switch to the correct menu
    const menuId = this.assetTypeToMenu(card.type);

    // Update nav UI
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const targetNav = document.querySelector(`.nav-item[data-menu="${menuId}"]`);
    if (targetNav) targetNav.classList.add('active');

    this.setActiveMenu(menuId);
    this.publish('batch_updated', this.batchCards);
  },

  deselectBatchCard() {
    this.selectedBatchCardId = null;
    this.publish('batch_updated', this.batchCards);
  },

  duplicateBatchCard(id) {
    const cardIndex = this.batchCards.findIndex(c => c.id === id);
    if (cardIndex === -1) return;

    const original = this.batchCards[cardIndex];
    const duplicate = {
      ...original,
      id: `card_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      data: JSON.parse(JSON.stringify(original.data))
    };

    // Insert after the original
    this.batchCards.splice(cardIndex + 1, 0, duplicate);
    this.publish('batch_updated', this.batchCards);
  }
};

// Bootstrap the core shell UI
function renderShell() {
  document.querySelector('#app').innerHTML = `
    <div class="top-bar">
      <label for="project-name-input" class="top-bar-label">Project Name:</label>
      <input type="text" id="project-name-input" class="top-bar-input" placeholder="My Custom Monopoly" value="${appState.projectName}" />
    </div>
    <div class="app-container">
      <aside class="sidebar">
        <h1 class="brand">Monopoly Maker</h1>

        <nav class="nav-group">
          <h2>Cards</h2>
          <ul>
            <li class="nav-item active" data-menu="property_card">
              <i data-lucide="mouse-pointer-square-dashed"></i> Property Card
            </li>
            <li class="nav-item" data-menu="chance_card">
              <i data-lucide="play"></i> Chance
            </li>
            <li class="nav-item" data-menu="chest_card">
              <i data-lucide="play"></i> Community Chest
            </li>
            <li class="nav-item" data-menu="card_back">
              <i data-lucide="image"></i> Card Back
            </li>
            <li class="nav-item" data-menu="railroad_card">
              <i data-lucide="play"></i> Railroad
            </li>
            <li class="nav-item" data-menu="utility_card">
              <i data-lucide="play"></i> Utility
            </li>
          </ul>
        </nav>

        <nav class="nav-group">
          <h2>Accessories</h2>
          <ul>
            <li class="nav-item" data-menu="dice">
              <i data-lucide="plus"></i> Custom Dice
            </li>
            <li class="nav-item" data-menu="currency">
              <i data-lucide="image"></i> Currency
            </li>
          </ul>
        </nav>

        <nav class="nav-group">
          <h2>Board</h2>
          <ul>
            <li class="nav-item nav-item-link" id="btn-board-editor">
              <i data-lucide="settings-2"></i> Board Editor
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto; opacity:0.5;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </li>
          </ul>
        </nav>

        <nav class="nav-group">
          <h2>Project</h2>
          <ul>
            <li class="nav-item" id="btn-export-json">
              <i data-lucide="download"></i> Export JSON
            </li>
            <li class="nav-item" id="btn-import-json">
              <i data-lucide="upload"></i> Import JSON
            </li>
          </ul>
        </nav>
      </aside>

      <main class="workspace">
        <section class="form-panel" id="form-container">
          <!-- Active Form Injected Here -->
        </section>

        <section class="preview-panel">
          <header class="preview-header">
            <div class="preview-toggle-group">
              <div class="preview-toggle" id="preview-toggle">
                <button class="toggle-btn active" data-mode="live">Live Preview</button>
                <button class="toggle-btn" data-mode="batch">Batch Preview</button>
                <div class="toggle-slider"></div>
              </div>
              <span class="batch-count" id="batch-count"></span>
            </div>
            <div class="preview-header-actions">
              <button id="btn-add-batch" class="btn-primary btn-batch">
                <i data-lucide="package-plus"></i> Create and add to batch
              </button>
              <button id="btn-export" class="btn-primary">
                <i data-lucide="download"></i> Export as PNG
              </button>
              <button id="btn-export-zip" class="btn-primary btn-zip">
                <i data-lucide="folder-down"></i> Export all as ZIP
              </button>
              <button id="btn-clear-batch" class="btn-primary btn-danger">
                <i data-lucide="rotate-cw"></i> Clear Batch
              </button>
            </div>
          </header>

          <div class="preview-workspace" id="preview-workspace">
            <div id="export-wrapper" class="export-wrapper">
              <!-- Active Preview Injected Here -->
            </div>
          </div>

          <div class="preview-workspace batch-workspace" id="batch-workspace" style="display:none;">
            <div id="batch-preview-container" class="batch-preview-fullsize">
              <!-- Batch Preview Injected Here -->
            </div>
          </div>

          <div id="batch-strip-container" class="batch-strip">
            <!-- Bottom Batch Strip Injected Here -->
          </div>
        </section>
      </main>
    </div>

    <!-- Hidden input for JSON import -->
    <input type="file" id="json-import-input" accept=".json" style="display:none" />

    <!-- Project name modal -->
    <div id="project-name-modal" class="modal-overlay" style="display:none;">
      <div class="modal-content">
        <h3>Enter Project Name</h3>
        <p>A project name is required before exporting.</p>
        <input type="text" id="modal-project-name" class="modal-input" placeholder="My Custom Monopoly" />
        <div class="modal-actions">
          <button id="modal-cancel" class="btn-secondary">Cancel</button>
          <button id="modal-confirm" class="btn-primary">Confirm</button>
        </div>
      </div>
    </div>

    <!-- JSON Export modal -->
    <div id="json-export-modal" class="modal-overlay" style="display:none;">
      <div class="modal-content modal-wide">
        <h3>Export JSON</h3>
        <p>Download as file or copy the text below.</p>
        <textarea id="json-export-text" class="modal-textarea" readonly></textarea>
        <div class="modal-actions">
          <button id="json-export-close" class="btn-secondary">Close</button>
          <button id="json-export-copy" class="btn-primary">Copy to Clipboard</button>
          <button id="json-export-download" class="btn-primary">Download File</button>
        </div>
      </div>
    </div>

    <!-- JSON Import modal -->
    <div id="json-import-modal" class="modal-overlay" style="display:none;">
      <div class="modal-content modal-wide">
        <h3>Import JSON</h3>
        <p>Paste JSON text below, or load from a file.</p>
        <textarea id="json-import-text" class="modal-textarea" placeholder="Paste your JSON here..."></textarea>
        <div class="modal-actions">
          <button id="json-import-close" class="btn-secondary">Cancel</button>
          <button id="json-import-file" class="btn-primary">Load from File</button>
          <button id="json-import-paste" class="btn-primary btn-batch">Import from Text</button>
        </div>
      </div>
    </div>
  `;

  createIcons({
    icons: {
      Plus, Image: ImageIcon, RotateCw, Play, Settings2, Download, MousePointerSquareDashed,
      Upload, FolderDown, PackagePlus
    }
  });

  // Bind Navigation
  document.querySelectorAll('.nav-item[data-menu]').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      e.currentTarget.classList.add('active');
      appState.deselectBatchCard();
      appState.setActiveMenu(e.currentTarget.dataset.menu);
    });
  });

  // Bind project name input
  document.getElementById('project-name-input').addEventListener('input', (e) => {
    appState.projectName = e.target.value;
  });

  // Bind Board Editor link (opens separate page)
  document.getElementById('btn-board-editor').addEventListener('click', () => {
    window.location.href = 'board.html';
  });

  // Bind JSON Export (modal with copy + download)
  document.getElementById('btn-export-json').addEventListener('click', () => {
    const modal = document.getElementById('json-export-modal');
    const textarea = document.getElementById('json-export-text');
    textarea.value = getProjectJsonString();
    modal.style.display = 'flex';
  });

  document.getElementById('json-export-close').addEventListener('click', () => {
    document.getElementById('json-export-modal').style.display = 'none';
  });

  document.getElementById('json-export-copy').addEventListener('click', () => {
    const text = document.getElementById('json-export-text').value;
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('json-export-copy');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy to Clipboard'; }, 2000);
    });
  });

  document.getElementById('json-export-download').addEventListener('click', () => {
    exportProjectJsonFile();
    document.getElementById('json-export-modal').style.display = 'none';
  });

  // Bind JSON Import (modal with paste + file)
  const jsonImportInput = document.getElementById('json-import-input');

  document.getElementById('btn-import-json').addEventListener('click', () => {
    const modal = document.getElementById('json-import-modal');
    document.getElementById('json-import-text').value = '';
    modal.style.display = 'flex';
  });

  document.getElementById('json-import-close').addEventListener('click', () => {
    document.getElementById('json-import-modal').style.display = 'none';
  });

  document.getElementById('json-import-file').addEventListener('click', () => {
    jsonImportInput.click();
  });

  jsonImportInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (importProjectJson(ev.target.result)) {
        document.getElementById('project-name-input').value = appState.projectName;
        appState.publish('batch_updated', appState.batchCards);
        document.getElementById('json-import-modal').style.display = 'none';
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  document.getElementById('json-import-paste').addEventListener('click', () => {
    const text = document.getElementById('json-import-text').value.trim();
    if (!text) {
      document.getElementById('json-import-text').style.borderColor = '#ef4444';
      return;
    }
    if (importProjectJson(text)) {
      document.getElementById('project-name-input').value = appState.projectName;
      appState.publish('batch_updated', appState.batchCards);
      document.getElementById('json-import-modal').style.display = 'none';
    }
  });

  // Bind "Create and add to batch"
  document.getElementById('btn-add-batch').addEventListener('click', () => {
    appState.addToBatch();
    updateBatchCount();
  });

  // Bind Clear Batch
  document.getElementById('btn-clear-batch').addEventListener('click', () => {
    if (appState.batchCards.length === 0) return;
    if (!confirm('Clear all cards from the batch? This cannot be undone.')) return;
    appState.batchCards = [];
    appState.selectedBatchCardId = null;
    appState.publish('batch_updated', appState.batchCards);
    updateBatchCount();
  });

  // Bind ZIP export
  document.getElementById('btn-export-zip').addEventListener('click', () => {
    if (!appState.projectName.trim()) {
      showProjectNameModal(() => {
        exportBatchAsZip();
      });
    } else {
      exportBatchAsZip();
    }
  });

  // Bind Preview Toggle (Live <-> Batch)
  const toggleBtns = document.querySelectorAll('#preview-toggle .toggle-btn');
  const pngExportBtn = document.getElementById('btn-export');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const slider = document.querySelector('#preview-toggle .toggle-slider');
      const liveWs = document.getElementById('preview-workspace');
      const batchWs = document.getElementById('batch-workspace');

      if (mode === 'batch') {
        slider.style.transform = 'translateX(100%)';
        liveWs.style.display = 'none';
        batchWs.style.display = 'flex';
        // Disable PNG export in batch mode
        pngExportBtn.disabled = true;
        pngExportBtn.style.opacity = '0.4';
        pngExportBtn.style.cursor = 'not-allowed';
      } else {
        slider.style.transform = 'translateX(0)';
        liveWs.style.display = 'flex';
        batchWs.style.display = 'none';
        // Re-enable PNG export in live mode
        pngExportBtn.disabled = false;
        pngExportBtn.style.opacity = '1';
        pngExportBtn.style.cursor = 'pointer';
      }
    });
  });

  // Subscribe to batch_updated to keep counter in sync
  appState.subscribe('batch_updated', () => updateBatchCount());
}

function updateBatchCount() {
  const el = document.getElementById('batch-count');
  if (el) {
    const n = appState.batchCards.length;
    el.textContent = n > 0 ? `(${n} card${n !== 1 ? 's' : ''})` : '';
  }
}

// Project name modal helper
function showProjectNameModal(onConfirm) {
  const modal = document.getElementById('project-name-modal');
  const input = document.getElementById('modal-project-name');
  const cancelBtn = document.getElementById('modal-cancel');
  const confirmBtn = document.getElementById('modal-confirm');

  modal.style.display = 'flex';
  input.value = '';
  input.focus();

  const cleanup = () => {
    modal.style.display = 'none';
    cancelBtn.removeEventListener('click', onCancel);
    confirmBtn.removeEventListener('click', onConfirmClick);
  };

  const onCancel = () => cleanup();

  const onConfirmClick = () => {
    const name = input.value.trim();
    if (!name) {
      input.style.borderColor = '#ef4444';
      return;
    }
    appState.projectName = name;
    document.getElementById('project-name-input').value = name;
    cleanup();
    if (onConfirm) onConfirm();
  };

  cancelBtn.addEventListener('click', onCancel);
  confirmBtn.addEventListener('click', onConfirmClick);
}

// ============================================================
//  localStorage persistence
// ============================================================
const STORAGE_KEY = 'customMonopoly_appState';

function saveAppState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      projectName: appState.projectName,
      batchCards: appState.batchCards,
      assetData: appState.assetData
    }));
  } catch (e) { /* localStorage full — ignore */ }
}

function restoreAppState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const s = JSON.parse(raw);

    if (s.projectName) {
      appState.projectName = s.projectName;
      const input = document.getElementById('project-name-input');
      if (input) input.value = s.projectName;
    }

    if (s.assetData) {
      for (const key of Object.keys(appState.assetData)) {
        if (s.assetData[key]) {
          Object.assign(appState.assetData[key], s.assetData[key]);
        }
      }
    }

    if (Array.isArray(s.batchCards)) {
      appState.batchCards = s.batchCards;
    }
  } catch (e) {
    console.warn('Failed to restore app state:', e);
  }
}

// Initialize Application
function init() {
  renderShell();

  // Restore saved state before first render — data is in place
  // when publish('menu_changed') triggers the initial render below
  restoreAppState();

  appState.subscribe('menu_changed', (menuId) => {
    const formContainer = document.getElementById('form-container');
    const previewWorkspace = document.getElementById('export-wrapper');

    // Clear containers
    formContainer.innerHTML = '';
    previewWorkspace.innerHTML = '';

    // CRITICAL: Clear all component subscriptions to prevent accumulation
    appState.clearComponentSubscriptions();

    // Remove previous specific styling wrappers if necessary
    previewWorkspace.className = 'export-wrapper';

    switch (menuId) {
      case 'property_card':
        renderPropertyForm(formContainer);
        renderPropertyPreview(previewWorkspace);
        break;
      case 'currency':
        renderCurrencyForm(formContainer);
        renderCurrencyPreview(previewWorkspace);
        break;
      case 'dice':
        renderDiceForm(formContainer);
        renderDicePreview(previewWorkspace);
        break;
      case 'chance_card':
        renderActionCardForm(formContainer, 'chance');
        renderActionCardPreview(previewWorkspace, 'chance');
        break;
      case 'chest_card':
        renderActionCardForm(formContainer, 'chest');
        renderActionCardPreview(previewWorkspace, 'chest');
        break;
      case 'card_back':
        renderActionCardForm(formContainer, 'back');
        renderActionCardPreview(previewWorkspace, 'back');
        break;
      case 'railroad_card':
        renderSpecialCardForm(formContainer, 'railroad');
        renderSpecialCardPreview(previewWorkspace, 'railroad');
        break;
      case 'utility_card':
        renderSpecialCardForm(formContainer, 'utility');
        renderSpecialCardPreview(previewWorkspace, 'utility');
        break;
      default:
        formContainer.innerHTML = '<p class="text-muted">Select an item from the menu.</p>';
    }

    // Re-subscribe batch preview and strip (they were cleared above)
    renderBatchPreview(document.getElementById('batch-preview-container'));
    renderBatchStrip(document.getElementById('batch-strip-container'));
    updateBatchCount();
  });

  // Kickoff default state
  appState.publish('menu_changed', appState.activeMenu);

  // Bind Export Logic (single card PNG)
  document.getElementById('btn-export').addEventListener('click', () => {
    const exportNode = document.getElementById('export-wrapper');
    html2canvas(exportNode, {
      scale: 3, // High resolution
      backgroundColor: null, // Transparent background if possible
      useCORS: true
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `custom_monopoly_${appState.activeMenu}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  });
}

document.addEventListener('DOMContentLoaded', init);

// Save state on page exit + periodic safety net
window.addEventListener('beforeunload', saveAppState);
setInterval(saveAppState, 5000);
