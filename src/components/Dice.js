import { appState } from '../main.js';
import { renderImageToolbar } from './ImageManipulation.js';


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
      </div>

      <div id="image-toolbar-container" style="display: ${dice.activeFaceIndex !== null && dice.faces[dice.activeFaceIndex] ? 'block' : 'none'}">
      </div>
    </div>
  `;

  if (dice.activeFaceIndex !== null && dice.faces[dice.activeFaceIndex]) {
    renderImageToolbar(document.getElementById('image-toolbar-container'), 'dice');
  }

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
          <div class="face-number">${i + 1}</div>
          ${dice.faces[i] ? `<img class="dice-bg" src="${dice.faces[i]}" style="transform: scale(${dice.transforms[i].scale}) rotate(${dice.transforms[i].rotate}deg) scaleX(${dice.transforms[i].flipX}) scaleY(${dice.transforms[i].flipY})" />` : ''}
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

  // Global subscription for transformations/new images
  appState.subscribe('dice_updated', (data) => {
    data.faces.forEach((src, i) => {
      const faceEl = document.querySelector(`.dice-face[data-index="${i}"]`);
      if (!faceEl) return;
      
      let img = faceEl.querySelector('img.dice-bg');
      if (src) {
        if (!img) {
          img = document.createElement('img');
          img.className = 'dice-bg';
          faceEl.appendChild(img);
        }
        img.src = src;
        img.style.transform = `scale(${data.transforms[i].scale}) rotate(${data.transforms[i].rotate}deg) scaleX(${data.transforms[i].flipX}) scaleY(${data.transforms[i].flipY})`;
      } else if (img) {
        img.remove();
      }
    });
  });
}
