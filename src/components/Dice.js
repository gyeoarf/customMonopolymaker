import { appState } from '../main.js';
import { createInteractableImage } from './InteractableImage.js';


export function renderDiceForm(container) {
  const { dice } = appState.assetData;
  
  container.innerHTML = `
    <div class="form-section">
      <h3>Custom Dice (Digital)</h3>
      <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 10px;">
        Click on a specific face in the preview window to set its image and transform it.
      </p>

      <div class="form-group" style="margin-bottom: 20px;">
        <label>Upload Image for Selected Face (<span id="active-face-label">${dice.activeFaceIndex !== null ? dice.activeFaceIndex + 1 : 'None Selected'}</span>)</label>
        <input type="file" id="dice-img-upload" accept="image/*" ${dice.activeFaceIndex === null ? 'disabled' : ''} />
        <button id="dice-clear-img" class="btn-secondary" style="margin-top:5px; display:${dice.activeFaceIndex !== null && dice.faces[dice.activeFaceIndex] ? 'block' : 'none'}">Clear Face Image</button>
      </div>

      <div id="image-toolbar-container" style="display: none">
      </div>
    </div>
  `;

  // Bindings
  document.getElementById('dice-img-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    const { activeFaceIndex } = appState.assetData.dice;

    if (file && activeFaceIndex !== null) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        appState.assetData.dice.faces[activeFaceIndex] = ev.target.result;
        appState.publish('dice_updated', appState.assetData.dice);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset
    }
  });

  document.getElementById('dice-clear-img').addEventListener('click', () => {
    const { activeFaceIndex } = appState.assetData.dice;
    if (activeFaceIndex !== null) {
      appState.assetData.dice.faces[activeFaceIndex] = null;
      appState.publish('dice_updated', appState.assetData.dice);
      renderDiceForm(container);
    }
  });

  // Suscribe specifically to face changes just to re-render toolbar in form
  appState.subscribe('dice_face_changed', (idx) => {
    // We just re-render this form completely to catch the state
    renderDiceForm(container);
  });
}

export function renderDicePreview(container) {
  const { dice } = appState.assetData;
  
  // Render CSS grid
  container.innerHTML = `
    <div class="dice-grid" id="dice-preview">
      ${Array.from({ length: 6 }).map((_, i) => `
        <div class="dice-face ${dice.activeFaceIndex === i ? 'active' : ''}" data-index="${i}">
          <div class="face-number" style="z-index: 10; position: relative;">${i + 1}</div>
          <div class="dice-mount" style="position:absolute; top:0; left:0; width:100%; height:100%; overflow:hidden; z-index:1;"></div>
        </div>
      `).join('')}
    </div>
  `;

  // Bind Grid Item Clicks
  document.querySelectorAll('.dice-face').forEach(el => {
    el.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index);
      appState.assetData.dice.activeFaceIndex = idx;
      
      // Update local preview UI manually so we don't flash the whole element causing lag
      document.querySelectorAll('.dice-face').forEach(f => f.classList.remove('active'));
      e.currentTarget.classList.add('active');

      appState.publish('dice_face_changed', idx);
    });
  });

  let instances = Array(6).fill(null);

  // Global subscription for transformations/new images
  appState.subscribe('dice_updated', (data) => {
    data.faces.forEach((src, i) => {
      const faceEl = document.querySelector(`.dice-face[data-index="${i}"]`);
      if (!faceEl) return;
      
      const mountEl = faceEl.querySelector('.dice-mount');
      
      if (src) {
        if (!instances[i]) {
          instances[i] = createInteractableImage(src, mountEl, {
            ...data.transforms[i],
            onUpdate: (newTrans) => {
              appState.assetData.dice.transforms[i] = newTrans;
            }
          });
        } else {
          instances[i].updateSrc(src);
          instances[i].updateState(data.transforms[i]);
        }
      } else {
        if (instances[i]) {
          instances[i].destroy();
          instances[i] = null;
        }
      }
    });
  });

  // Immediately trigger with current data to handle images already in state (e.g. navigating back)
  appState.publish('dice_updated', appState.assetData.dice);
}
