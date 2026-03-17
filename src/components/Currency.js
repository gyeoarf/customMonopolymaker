import { appState } from '../main.js';
import { createInteractableImage } from './InteractableImage.js';
import { escapeHtml } from '../utils/sanitize.js';

export function renderCurrencyForm(container) {
  const { currency } = appState.assetData;
  
  container.innerHTML = `
    <div class="form-section">
      <h3>Currency Details</h3>
      
      <div class="form-group">
        <label>Denomination Amount</label>
        <input type="number" id="curr-amount" value="${currency.denomination}" />
      </div>

      <div class="form-group">
        <label>Base Background Color</label>
        <div class="color-picker-wrapper">
          <input type="color" id="curr-color" value="${currency.backgroundColor}" />
          <span id="curr-color-hex">${currency.backgroundColor}</span>
        </div>
      </div>
      
      <div class="form-divider"></div>
      <h3>Custom Background Image</h3>
      
      <div class="form-group">
        <label>Upload Image (Optional)</label>
        <input type="file" id="curr-bg-upload" accept="image/*" />
        <button id="curr-clear-bg" class="btn-secondary" style="margin-top:5px; display:${currency.backgroundImageUrl ? 'block' : 'none'}">Clear Image</button>
      </div>

      <div id="image-toolbar-container" style="display: none">
        <!-- Legacy toolbar removed -->
      </div>
    </div>
  `;

  // Bindings
  document.getElementById('curr-amount').addEventListener('input', (e) => {
    appState.updateState('currency', 'denomination', e.target.value);
  });

  document.getElementById('curr-color').addEventListener('input', (e) => {
    appState.updateState('currency', 'backgroundColor', e.target.value);
    document.getElementById('curr-color-hex').textContent = e.target.value.toUpperCase();
  });

  document.getElementById('curr-bg-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        appState.updateState('currency', 'backgroundImageUrl', ev.target.result);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset
    }
  });

  document.getElementById('curr-clear-bg').addEventListener('click', () => {
    appState.updateState('currency', 'backgroundImageUrl', null);
  });
}

export function renderCurrencyPreview(container) {
  const { currency } = appState.assetData;
  const den = escapeHtml(String(currency.denomination));
  
  container.innerHTML = `
    <div class="currency-bill" id="curr-preview" style="background-color: ${currency.backgroundColor}">
      <div class="bill-border">
        <div class="bill-inner-border">
          <div class="corner top-left" id="corner-tl">${den}</div>
          <div class="corner top-right" id="corner-tr">${den}</div>
          
          <div class="center-denomination" id="center-val">${den}</div>
          
          <div class="corner bottom-left" id="corner-bl">${den}</div>
          <div class="corner bottom-right" id="corner-br">${den}</div>
        </div>
      </div>
      <div id="curr-bg-container" style="position:absolute; top:0; left:0; width:100%; height:100%; overflow:hidden; z-index:1;"></div>
    </div>
  `;

  let interactableInstance = null;

  appState.subscribe('currency_updated', (data) => {
    // Reveal clear button if active
    const clearBtn = document.getElementById('curr-clear-bg');
    if (clearBtn) clearBtn.style.display = data.backgroundImageUrl ? 'block' : 'none';

    // Structural Update (DOM)
    document.getElementById('curr-preview').style.backgroundColor = data.backgroundColor;
    document.getElementById('corner-tl').textContent = data.denomination;
    document.getElementById('corner-tr').textContent = data.denomination;
    document.getElementById('corner-bl').textContent = data.denomination;
    document.getElementById('corner-br').textContent = data.denomination;
    document.getElementById('center-val').textContent = data.denomination;

    // Handle Image Mounting
    const containerEl = document.getElementById('curr-bg-container');
    
    if (data.backgroundImageUrl) {
      if (!interactableInstance) {
        interactableInstance = createInteractableImage(data.backgroundImageUrl, containerEl, {
          ...data.transform,
          onUpdate: (newTrans) => {
            appState.assetData.currency.transform = newTrans;
          }
        });
      } else {
        interactableInstance.updateSrc(data.backgroundImageUrl);
        interactableInstance.updateState(data.transform);
      }
    } else {
      if (interactableInstance) {
        interactableInstance.destroy();
        interactableInstance = null;
      }
    }
  });

  // Immediately trigger with current data to handle images already in state (e.g. batch card loaded)
  appState.publish('currency_updated', appState.assetData.currency);
}
