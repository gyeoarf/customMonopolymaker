import './style.css';
import './components/PropertyCard.css';
import './components/Currency.css';
import './components/Dice.css';
import { createIcons, Plus, Image as ImageIcon, RotateCw, Play, Settings2, Download, MousePointerSquareDashed } from 'lucide';
import html2canvas from 'html2canvas';

import { renderPropertyForm, renderPropertyPreview } from './components/PropertyCard.js';
import { renderCurrencyForm, renderCurrencyPreview } from './components/Currency.js';
import { renderDiceForm, renderDicePreview } from './components/Dice.js';
import { renderActionCardForm, renderActionCardPreview } from './components/ActionCard.js';
import './components/ActionCard.css';

// Centralised State Manager (PubSub Pattern)
export const appState = {
  activeMenu: 'property_card', // Default view
  events: {},
  
  assetData: {
    property: {
      title: 'TITLE DEED',
      headerColor: '#005CE6', // Default blue
      headerTextColor: '#FFFFFF',
      textColor: '#000000',
      backgroundColor: '#FFFFFF',
      backgroundImageUrl: null,
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
      image: null
    },
    chest: {
      text: 'BANK ERROR IN YOUR FAVOR. COLLECT $200',
      image: null
    },
    back: {
      backgroundColor: '#E53935',
      image: null,
      repeatPattern: false
    },
    currency: {
      denomination: 500,
      backgroundColor: '#f7f9f2',
      backgroundImageUrl: null,
      transform: { scale: 1, rotate: 0, flipX: 1, flipY: 1 }
    },
    dice: {
      faces: [null, null, null, null, null, null],
      activeFaceIndex: null, // Track which face is being edited
      transforms: Array(6).fill({ scale: 1, rotate: 0, flipX: 1, flipY: 1 })
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

  // State Mutators
  updateState(assetType, key, value) {
    this.assetData[assetType][key] = value;
    this.publish(`${assetType}_updated`, this.assetData[assetType]);
  },
  
  setActiveMenu(menuId) {
    this.activeMenu = menuId;
    this.publish('menu_changed', this.activeMenu);
  }
};

// Bootstrap the core shell UI
function renderShell() {
  document.querySelector('#app').innerHTML = `
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
      </aside>
      
      <main class="workspace">
        <section class="form-panel" id="form-container">
          <!-- Active Form Injected Here -->
        </section>
        
        <section class="preview-panel">
          <header class="preview-header">
            <h2>Live Preview</h2>
            <button id="btn-export" class="btn-primary">
              <i data-lucide="download"></i> Export as PNG
            </button>
          </header>
          
          <div class="preview-workspace" id="preview-workspace">
            <div id="export-wrapper" class="export-wrapper">
              <!-- Active Preview Injected Here -->
            </div>
          </div>
        </section>
      </main>
    </div>
  `;

  createIcons({
    icons: {
      Plus, ImageIcon, RotateCw, Play, Settings2, Download, MousePointerSquareDashed
    }
  });
  
  // Bind Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      e.currentTarget.classList.add('active');
      appState.setActiveMenu(e.currentTarget.dataset.menu);
    });
  });
}

// Initialize Application
function init() {
  renderShell();
  
  appState.subscribe('menu_changed', (menuId) => {
    const formContainer = document.getElementById('form-container');
    const previewWorkspace = document.getElementById('export-wrapper');
    
    // Clear containers
    formContainer.innerHTML = '';
    previewWorkspace.innerHTML = '';
    
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
      // Add other cases later
      default:
        formContainer.innerHTML = '<p class="text-muted">Select an item from the menu.</p>';
    }
  });

  // Kickoff default state
  appState.publish('menu_changed', appState.activeMenu);

  // Bind Export Logic
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
