import { appState } from '../main.js';

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
        <textarea id="ac-text" rows="4" style="resize:vertical; padding:8px; border:1px solid #cbd5e1; border-radius:4px;">${stateRef.text}</textarea>
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
        <label>Upload Pattern/Background Image</label>
        <input type="file" id="ac-bg-upload" accept="image/*" />
        <button id="ac-clear-bg" class="btn-secondary" style="margin-top:5px; display:${stateRef.image ? 'block' : 'none'}">Clear Image</button>
      </div>

      <div class="form-group" style="margin-top: 10px; display:${stateRef.image ? 'block' : 'none'}" id="bg-repeat-toggle-container">
        <label style="display:flex; align-items:center; gap:8px;">
          <input type="checkbox" id="ac-repeat-toggle" ${stateRef.repeatPattern ? 'checked' : ''} />
          Repeat Pattern (Tile)
        </label>
        <p style="font-size:11px; color:#64748b; margin-top:4px;">If unchecked, image will stretch to cover the entire card.</p>
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

    const repeatToggle = document.getElementById('ac-repeat-toggle');
    if (repeatToggle) {
      repeatToggle.addEventListener('change', (e) => {
        appState.updateState(type, 'repeatPattern', e.target.checked);
      });
    }
  }
}

export function renderActionCardPreview(container, type) {
  const stateRef = appState.assetData[type];
  
  if (type === 'chance' || type === 'chest') {
    const isChest = type === 'chest';
    // Chest defaults to traditional chest logo if no custom image
    const defaultImgSrc = isChest ? '/assets/cardselements/chest_logo.png' : '';
    
    // We render a standard property card sized container, but formatted differently
    container.innerHTML = `
      <div class="property-card action-card-container">
        <div class="card-border action-inner">
          <div class="action-title">${isChest ? 'COMMUNITY CHEST' : 'CHANCE'}</div>
          
          <div class="action-image-wrapper">
             <img id="preview-ac-img" src="${stateRef.image || defaultImgSrc}" class="action-icon" style="display: ${stateRef.image || isChest ? 'block' : 'none'};" onerror="this.style.display='none'" />
          </div>

          <div class="action-body" id="preview-ac-text">
            ${stateRef.text.replace(/\\n/g, '<br/>')}
          </div>
        </div>
      </div>
    `;

    appState.subscribe(`${type}_updated`, (data) => {
      document.getElementById('preview-ac-text').innerHTML = data.text.replace(/\\n/g, '<br/>');
      const imgEl = document.getElementById('preview-ac-img');
      imgEl.src = data.image || defaultImgSrc;
      imgEl.style.display = (data.image || isChest) ? 'block' : 'none';
    });

  } else if (type === 'back') {
    container.innerHTML = `
      <div class="property-card action-card-container">
        <div class="card-border action-back" id="preview-back-bg" style="
          background-color: ${stateRef.backgroundColor};
          background-image: ${stateRef.image ? `url('${stateRef.image}')` : 'none'};
          background-size: ${stateRef.repeatPattern ? 'auto' : 'cover'};
          background-repeat: ${stateRef.repeatPattern ? 'repeat' : 'no-repeat'};
          background-position: center;
        ">
        </div>
      </div>
    `;

    appState.subscribe('back_updated', (data) => {
      const bgEl = document.getElementById('preview-back-bg');
      bgEl.style.backgroundColor = data.backgroundColor;
      bgEl.style.backgroundImage = data.image ? `url('${data.image}')` : 'none';
      bgEl.style.backgroundSize = data.repeatPattern ? 'auto' : 'cover';
      bgEl.style.backgroundRepeat = data.repeatPattern ? 'repeat' : 'no-repeat';
    });
  }
}
