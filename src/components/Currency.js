import { appState } from '../main.js';
import { renderImageToolbar } from './ImageManipulation.js';

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

      <div id="image-toolbar-container" style="display: ${currency.backgroundImageUrl ? 'block' : 'none'}">
        <!-- Toolbar injected here -->
      </div>
    </div>
  `;

  if (currency.backgroundImageUrl) {
    renderImageToolbar(document.getElementById('image-toolbar-container'), 'currency');
  }

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
  
  container.innerHTML = `
    <div class="currency-bill" id="curr-preview" style="background-color: ${currency.backgroundColor}">
      <div class="bill-border">
        <div class="bill-inner-border">
          <div class="corner top-left" id="corner-tl">${currency.denomination}</div>
          <div class="corner top-right" id="corner-tr">${currency.denomination}</div>
          
          <div class="center-denomination" id="center-val">${currency.denomination}</div>
          
          <div class="corner bottom-left" id="corner-bl">${currency.denomination}</div>
          <div class="corner bottom-right" id="corner-br">${currency.denomination}</div>
        </div>
      </div>
      ${currency.backgroundImageUrl ? `<img id="curr-bg-img" class="bill-bg" src="${currency.backgroundImageUrl}" style="transform: scale(${currency.transform.scale}) rotate(${currency.transform.rotate}deg) scaleX(${currency.transform.flipX}) scaleY(${currency.transform.flipY})" />` : ''}
    </div>
  `;

  // Live Subscription
  appState.subscribe('currency_updated', (data) => {
    // Re-render whole forms section if bg status changes for toolbar visibility
    const tbContainer = document.getElementById('image-toolbar-container');
    const clearBtn = document.getElementById('curr-clear-bg');
    if (tbContainer) {
      if (data.backgroundImageUrl && tbContainer.innerHTML.trim() === '') {
        renderImageToolbar(tbContainer, 'currency');
        tbContainer.style.display = 'block';
        clearBtn.style.display = 'block';
      } else if (!data.backgroundImageUrl) {
        tbContainer.innerHTML = '';
        tbContainer.style.display = 'none';
        clearBtn.style.display = 'none';
      }
    }

    const { scale, rotate, flipX, flipY } = data.transform;
    const bgImgEl = document.getElementById('curr-bg-img');

    // Structural Update (DOM)
    document.getElementById('curr-preview').style.backgroundColor = data.backgroundColor;
    document.getElementById('corner-tl').textContent = data.denomination;
    document.getElementById('corner-tr').textContent = data.denomination;
    document.getElementById('corner-bl').textContent = data.denomination;
    document.getElementById('corner-br').textContent = data.denomination;
    document.getElementById('center-val').textContent = data.denomination;

    // Handle Image Mounting
    if (data.backgroundImageUrl) {
      if (!bgImgEl) {
        const img = document.createElement('img');
        img.id = 'curr-bg-img';
        img.className = 'bill-bg';
        img.src = data.backgroundImageUrl;
        img.style.transform = `scale(${scale}) rotate(${rotate}deg) scaleX(${flipX}) scaleY(${flipY})`;
        document.getElementById('curr-preview').appendChild(img);
      } else {
        bgImgEl.src = data.backgroundImageUrl;
        bgImgEl.style.transform = `scale(${scale}) rotate(${rotate}deg) scaleX(${flipX}) scaleY(${flipY})`;
      }
    } else if (bgImgEl) {
      bgImgEl.remove();
    }
  });
}
