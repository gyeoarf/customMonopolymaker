import { appState } from '../main.js';
import { createInteractableImage } from './InteractableImage.js';
import { escapeHtml } from '../utils/sanitize.js';

export function renderSpecialCardForm(container, type) {
  const stateRef = appState.assetData[type];
  const isRailroad = type === 'railroad';

  let formHtml = `
    <div class="form-section">
      <h3>${isRailroad ? 'Railroad Card' : 'Utility Card'}</h3>

      <div class="form-group">
        <label>${isRailroad ? 'Station Name' : 'Utility Name'}</label>
        <input type="text" id="sp-title" value="${stateRef.title}" />
      </div>

      <div class="form-group-row">
        <div class="form-group">
          <label>Header Color</label>
          <div class="color-picker-wrapper">
            <input type="color" id="sp-header-color" value="${stateRef.headerColor}" />
            <span id="sp-hc-hex">${stateRef.headerColor}</span>
          </div>
        </div>
        <div class="form-group">
          <label>Header Text</label>
          <div class="color-picker-wrapper">
            <input type="color" id="sp-header-text" value="${stateRef.headerTextColor}" />
            <span id="sp-ht-hex">${stateRef.headerTextColor}</span>
          </div>
        </div>
      </div>

      <div class="form-group-row">
        <div class="form-group">
          <label>Body Text</label>
          <div class="color-picker-wrapper">
            <input type="color" id="sp-text-color" value="${stateRef.textColor}" />
            <span id="sp-tc-hex">${stateRef.textColor}</span>
          </div>
        </div>
        <div class="form-group">
          <label>Card BG</label>
          <div class="color-picker-wrapper">
            <input type="color" id="sp-bg-color" value="${stateRef.backgroundColor}" />
            <span id="sp-bg-hex">${stateRef.backgroundColor}</span>
          </div>
        </div>
      </div>

      <div class="form-divider"></div>
  `;

  if (isRailroad) {
    formHtml += `
      <h3>Rent Values</h3>
      <div class="form-group">
        <label>If 1 Railroad is owned</label>
        <div class="input-prefix"><span>$</span><input type="number" id="sp-rent1" value="${stateRef.rent1}" /></div>
      </div>
      <div class="form-group">
        <label>If 2 Railroads are owned</label>
        <div class="input-prefix"><span>$</span><input type="number" id="sp-rent2" value="${stateRef.rent2}" /></div>
      </div>
      <div class="form-group">
        <label>If 3 Railroads are owned</label>
        <div class="input-prefix"><span>$</span><input type="number" id="sp-rent3" value="${stateRef.rent3}" /></div>
      </div>
      <div class="form-group">
        <label>If 4 Railroads are owned</label>
        <div class="input-prefix"><span>$</span><input type="number" id="sp-rent4" value="${stateRef.rent4}" /></div>
      </div>
      <div class="form-group">
        <label>Mortgage Value</label>
        <div class="input-prefix"><span>$</span><input type="number" id="sp-mortgage" value="${stateRef.mortgage}" /></div>
      </div>
    `;
  } else {
    // Utility
    formHtml += `
      <div class="form-group">
        <label>Mortgage Value</label>
        <div class="input-prefix"><span>$</span><input type="number" id="sp-mortgage" value="${stateRef.mortgage}" /></div>
      </div>

      <div class="form-divider"></div>

      <div class="form-group">
        <label>Custom Background Image (Optional)</label>
        <input type="file" id="sp-bg-img" accept="image/*" />
        <button id="sp-clear-img" class="btn-secondary" style="margin-top:5px; display:${stateRef.backgroundImageUrl ? 'block' : 'none'}">Clear Image</button>
      </div>
    `;
  }

  formHtml += '</div>';
  container.innerHTML = formHtml;

  // Bindings
  const bind = (id, key, isNumber = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      appState.updateState(type, key, isNumber ? Number(e.target.value) : e.target.value);
    });
  };

  bind('sp-title', 'title');
  bind('sp-header-color', 'headerColor');
  bind('sp-header-text', 'headerTextColor');
  bind('sp-text-color', 'textColor');
  bind('sp-bg-color', 'backgroundColor');
  bind('sp-mortgage', 'mortgage', true);

  // Color hex watchers
  const watchColor = (id, hexId) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', (e) => {
      document.getElementById(hexId).textContent = e.target.value.toUpperCase();
    });
  };
  watchColor('sp-header-color', 'sp-hc-hex');
  watchColor('sp-header-text', 'sp-ht-hex');
  watchColor('sp-text-color', 'sp-tc-hex');
  watchColor('sp-bg-color', 'sp-bg-hex');

  if (isRailroad) {
    bind('sp-rent1', 'rent1', true);
    bind('sp-rent2', 'rent2', true);
    bind('sp-rent3', 'rent3', true);
    bind('sp-rent4', 'rent4', true);
  } else {
    // Utility image upload
    document.getElementById('sp-bg-img').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          appState.updateState(type, 'backgroundImageUrl', ev.target.result);
          renderSpecialCardForm(container, type);
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('sp-clear-img').addEventListener('click', () => {
      appState.updateState(type, 'backgroundImageUrl', null);
      renderSpecialCardForm(container, type);
    });
  }
}

export function renderSpecialCardPreview(container, type) {
  const stateRef = appState.assetData[type];
  const isRailroad = type === 'railroad';

  if (isRailroad) {
    container.innerHTML = `
      <div class="property-card" id="sp-card-preview" style="
        background-color: ${stateRef.backgroundColor};
        color: ${stateRef.textColor};
        position: relative;
      ">
        <div class="card-border" style="border-color: ${stateRef.textColor}; position:relative; z-index:10;">
          <div class="card-header" id="sp-preview-header" style="
            background-color: ${stateRef.headerColor};
            color: ${stateRef.headerTextColor};
            border-bottom-color: ${stateRef.textColor};
          ">
            <div class="title-deed">RAILROAD</div>
            <h1 id="sp-preview-title">${escapeHtml(stateRef.title)}</h1>
          </div>

          <div class="card-body" style="text-align: center;">
            <div style="margin: 10px auto;">
              <img src="/assets/cardselements/train.svg" alt="Train" style="width: 80px; height: auto; filter: ${stateRef.textColor === '#FFFFFF' ? 'invert(1)' : 'none'};" />
            </div>

            <div class="house-rents" style="text-align: center; margin-top: 6px;">
              <div class="grid-row"><span>Rent</span><span>$<span id="sp-r1">${escapeHtml(String(stateRef.rent1))}</span></span></div>
              <div class="grid-row"><span>If 2 R.R.'s are owned</span><span>$<span id="sp-r2">${escapeHtml(String(stateRef.rent2))}</span></span></div>
              <div class="grid-row"><span>If 3 R.R.'s are owned</span><span>$<span id="sp-r3">${escapeHtml(String(stateRef.rent3))}</span></span></div>
              <div class="grid-row"><span>If 4 R.R.'s are owned</span><span>$<span id="sp-r4">${escapeHtml(String(stateRef.rent4))}</span></span></div>
            </div>

            <div class="margin-y center building-costs">
              Mortgage Value $<span id="sp-mortgage">${escapeHtml(String(stateRef.mortgage))}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    appState.subscribe('railroad_updated', (data) => {
      const cardEl = document.getElementById('sp-card-preview');
      if (!cardEl) return;
      cardEl.style.backgroundColor = data.backgroundColor;
      cardEl.style.color = data.textColor;

      const headerEl = document.getElementById('sp-preview-header');
      if (headerEl) {
        headerEl.style.backgroundColor = data.headerColor;
        headerEl.style.color = data.headerTextColor;
        headerEl.style.borderBottomColor = data.textColor;
      }

      const borderEl = cardEl.querySelector('.card-border');
      if (borderEl) borderEl.style.borderColor = data.textColor;

      const titleEl = document.getElementById('sp-preview-title');
      if (titleEl) titleEl.textContent = data.title;
      const r1 = document.getElementById('sp-r1');
      if (r1) r1.textContent = data.rent1;
      const r2 = document.getElementById('sp-r2');
      if (r2) r2.textContent = data.rent2;
      const r3 = document.getElementById('sp-r3');
      if (r3) r3.textContent = data.rent3;
      const r4 = document.getElementById('sp-r4');
      if (r4) r4.textContent = data.rent4;
      const mort = document.getElementById('sp-mortgage');
      if (mort) mort.textContent = data.mortgage;
    });

  } else {
    // Utility card
    container.innerHTML = `
      <div class="property-card" id="sp-card-preview" style="
        background-color: ${stateRef.backgroundColor};
        color: ${stateRef.textColor};
        position: relative;
      ">
        <div id="sp-bg-container" style="position:absolute; top:0; left:0; width:100%; height:100%; overflow:hidden; z-index: 0;"></div>

        <div class="card-border" style="border-color: ${stateRef.textColor}; position:relative; z-index:10; pointer-events: none;">
          <div class="card-header" id="sp-preview-header" style="
            background-color: ${stateRef.headerColor};
            color: ${stateRef.headerTextColor};
            border-bottom-color: ${stateRef.textColor};
          ">
            <div class="title-deed">UTILITY</div>
            <h1 id="sp-preview-title">${escapeHtml(stateRef.title)}</h1>
          </div>

          <div class="card-body" style="text-align: center; justify-content: center;">
            <div style="font-size: 12px; line-height: 1.6; padding: 10px;">
              <p>If one "Utility" is owned, rent is <strong>4 times</strong> amount shown on dice.</p>
              <p style="margin-top: 8px;">If both "Utilities" are owned, rent is <strong>10 times</strong> amount shown on dice.</p>
            </div>
            <div class="margin-y center building-costs">
              Mortgage Value $<span id="sp-mortgage">${escapeHtml(String(stateRef.mortgage))}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    let interactableInstance = null;

    appState.subscribe('utility_updated', (data) => {
      const cardEl = document.getElementById('sp-card-preview');
      if (!cardEl) return;
      cardEl.style.backgroundColor = data.backgroundColor;
      cardEl.style.color = data.textColor;

      const headerEl = document.getElementById('sp-preview-header');
      if (headerEl) {
        headerEl.style.backgroundColor = data.headerColor;
        headerEl.style.color = data.headerTextColor;
        headerEl.style.borderBottomColor = data.textColor;
      }

      const borderEl = cardEl.querySelector('.card-border');
      if (borderEl) borderEl.style.borderColor = data.textColor;

      const titleEl = document.getElementById('sp-preview-title');
      if (titleEl) titleEl.textContent = data.title;
      const mort = document.getElementById('sp-mortgage');
      if (mort) mort.textContent = data.mortgage;

      // Handle BG Image
      const bgContainer = document.getElementById('sp-bg-container');
      if (data.backgroundImageUrl) {
        if (!interactableInstance) {
          interactableInstance = createInteractableImage(data.backgroundImageUrl, bgContainer, {
            ...data.transform,
            onUpdate: (newTrans) => {
              appState.assetData.utility.transform = newTrans;
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
    appState.publish('utility_updated', appState.assetData.utility);
  }
}
