import { appState } from '../main.js';
import { createInteractableImage } from './InteractableImage.js';
import { escapeHtml } from '../utils/sanitize.js';

export function renderActionCardForm(container, type) { // type can be 'chance', 'chest', or 'back'
  const stateRef = appState.assetData[type];
  
  const title = type === 'chance' ? 'Chance Card' : 
                type === 'chest' ? 'Community Chest' : 'Card Back';

  let formHtml = `
    <div class="form-section">
      <h3>${title}</h3>
  `;

  if (type === 'chance' || type === 'chest') {
    formHtml += `
      <div class="form-group">
        <label>Instruction Text</label>
        <textarea id="ac-text" rows="4" style="resize:vertical; padding:8px; border:1px solid #cbd5e1; border-radius:4px;">${escapeHtml(stateRef.text)}</textarea>
      </div>
      
      <div class="form-group">
        <label>Center Image (Optional)</label>
        <input type="file" id="ac-img-upload" accept="image/*" />
        <button id="ac-clear-img" class="btn-secondary" style="margin-top:5px; display:${stateRef.image ? 'block' : 'none'}">Clear Custom Image</button>
      </div>
    `;
  } else if (type === 'back') {
    formHtml += `
      <div class="form-group">
        <label>Background Color</label>
        <div class="color-picker-wrapper">
          <input type="color" id="ac-color" value="${stateRef.backgroundColor}" />
          <span id="ac-color-hex">${stateRef.backgroundColor}</span>
        </div>
      </div>

      <div class="form-divider"></div>
      
      <div class="form-group">
        <label>Upload Background Image</label>
        <input type="file" id="ac-bg-upload" accept="image/*" />
        <button id="ac-clear-bg" class="btn-secondary" style="margin-top:5px; display:${stateRef.image ? 'block' : 'none'}">Clear Image</button>
      </div>
    `;
  }

  formHtml += '</div>';
  container.innerHTML = formHtml;

  // Bindings
  if (type === 'chance' || type === 'chest') {
    document.getElementById('ac-text').addEventListener('input', (e) => {
      appState.updateState(type, 'text', e.target.value);
    });

    document.getElementById('ac-img-upload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const r = new FileReader();
        r.onload = ev => appState.updateState(type, 'image', ev.target.result);
        r.readAsDataURL(file);
      }
    });

    document.getElementById('ac-clear-img').addEventListener('click', () => {
      appState.updateState(type, 'image', null);
      renderActionCardForm(container, type); // Re-render to handle button visibility
    });

  } else if (type === 'back') {
    document.getElementById('ac-color').addEventListener('input', (e) => {
      appState.updateState(type, 'backgroundColor', e.target.value);
      document.getElementById('ac-color-hex').textContent = e.target.value.toUpperCase();
    });

    document.getElementById('ac-bg-upload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const r = new FileReader();
        r.onload = ev => {
          appState.updateState(type, 'image', ev.target.result);
          renderActionCardForm(container, type);
        };
        r.readAsDataURL(file);
      }
    });

    document.getElementById('ac-clear-bg').addEventListener('click', () => {
      appState.updateState(type, 'image', null);
      renderActionCardForm(container, type);
    });
  }
}

export function renderActionCardPreview(container, type) {
  const stateRef = appState.assetData[type];
  
  if (type === 'chance' || type === 'chest') {
    const isChest = type === 'chest';
    // Chest defaults to traditional chest logo if no custom image
    const defaultImgSrc = isChest ? 'assets/cardselements/communitychest.png' : '';
    
    // We render a standard property card sized container, but formatted differently
    container.innerHTML = `
      <div class="property-card action-card-container">
        <div class="card-border action-inner">
          <div class="action-title">${isChest ? 'COMMUNITY CHEST' : 'CHANCE'}</div>
          
          <div class="action-image-wrapper" id="preview-ac-img-container" style="position: relative;">
             <!-- Default static image -->
             <img id="preview-ac-img-default" src="${defaultImgSrc}" class="action-icon" style="display: ${!stateRef.image && isChest ? 'block' : 'none'}; pointer-events: none;" />
          </div>

          <div class="action-body" id="preview-ac-text">
            ${escapeHtml(stateRef.text || '').replace(/\\n/g, '<br/>')}
          </div>
        </div>
      </div>
    `;

    let interactableInstance = null;

    appState.subscribe(`${type}_updated`, (data) => {
      const textEl = document.getElementById('preview-ac-text');
      if (textEl) {
        textEl.innerHTML = escapeHtml(data.text || '').replace(/\\n/g, '<br/>');
      }
      
      const defaultImg = document.getElementById('preview-ac-img-default');
      const containerEl = document.getElementById('preview-ac-img-container');

      if (!containerEl || !defaultImg) return;

      if (data.image) {
        defaultImg.style.display = 'none';
        if (!interactableInstance) {
          interactableInstance = createInteractableImage(data.image, containerEl, {
            ...data.transform,
            onUpdate: (newTrans) => {
              // Update state silently so we don't cause an infinite re-render loop
              appState.assetData[type].transform = newTrans;
            }
          });
        } else {
          interactableInstance.updateSrc(data.image);
          interactableInstance.updateState(data.transform);
        }
      } else {
        if (interactableInstance) {
          interactableInstance.destroy();
          interactableInstance = null;
        }
        defaultImg.style.display = isChest ? 'block' : 'none';
      }
    });

    // Immediately trigger with current data to handle images already in state (e.g. batch card loaded)
    appState.publish(`${type}_updated`, appState.assetData[type]);

  } else if (type === 'back') {
    container.innerHTML = `
      <div class="property-card action-card-container" style="background-color: ${stateRef.backgroundColor}; position: relative; overflow: hidden;">
        <div id="preview-back-bg" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:0;"></div>
        <div class="card-border action-back" style="position:relative; z-index:10; pointer-events:none;">
        </div>
      </div>
    `;

    let interactableInstanceBack = null;

    appState.subscribe('back_updated', (data) => {
      const outerEl = container.querySelector('.action-card-container');
      if (outerEl) outerEl.style.backgroundColor = data.backgroundColor;

      const bgContainer = document.getElementById('preview-back-bg');
      if (!bgContainer) return;
      
      if (data.image) {
        if (!interactableInstanceBack) {
          interactableInstanceBack = createInteractableImage(data.image, bgContainer, {
            ...data.transform,
            onUpdate: (newTrans) => {
              appState.assetData.back.transform = newTrans;
            }
          });
        } else {
          interactableInstanceBack.updateSrc(data.image);
          interactableInstanceBack.updateState(data.transform);
        }
      } else {
        if (interactableInstanceBack) {
          interactableInstanceBack.destroy();
          interactableInstanceBack = null;
        }
      }
    });

    // Immediately trigger with current data to handle images already in state (e.g. batch card loaded)
    appState.publish('back_updated', appState.assetData.back);
  }
}
