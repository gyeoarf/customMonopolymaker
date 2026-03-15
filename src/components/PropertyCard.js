import { appState } from '../main.js';

export function renderPropertyForm(container) {
  const { property } = appState.assetData;
  
  container.innerHTML = `
    <div class="form-section">
      <h3>Property Details</h3>
      
      <div class="form-group">
        <label>Property Name</label>
        <input type="text" id="prop-title" value="${property.title}" />
      </div>
      
      <div class="form-group-row">
        <div class="form-group">
          <label>Header Color/bg</label>
          <div class="color-picker-wrapper">
            <input type="color" id="prop-color" value="${property.headerColor}" />
            <span id="color-hex">${property.headerColor}</span>
          </div>
        </div>
        <div class="form-group">
          <label>Header Text Color</label>
          <div class="color-picker-wrapper">
            <input type="color" id="prop-header-text" value="${property.headerTextColor || '#FFFFFF'}" />
            <span id="prop-header-text-hex">${property.headerTextColor || '#FFFFFF'}</span>
          </div>
        </div>
      </div>

      <div class="form-group-row">
        <div class="form-group">
          <label>Body Text Color</label>
          <div class="color-picker-wrapper">
            <input type="color" id="prop-text-color" value="${property.textColor || '#000000'}" />
            <span id="prop-text-hex">${property.textColor || '#000000'}</span>
          </div>
        </div>
        <div class="form-group">
          <label>Card BG Color</label>
          <div class="color-picker-wrapper">
            <input type="color" id="prop-bg-color" value="${property.backgroundColor || '#FFFFFF'}" />
            <span id="prop-bg-hex">${property.backgroundColor || '#FFFFFF'}</span>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Card Background Image (Optional)</label>
        <input type="file" id="prop-bg-img" accept="image/*" />
        <button id="prop-clear-img" class="btn-secondary" style="margin-top:5px; display:${property.backgroundImageUrl ? 'block' : 'none'}">Clear Background Image</button>
      </div>
      
      <div class="form-divider"></div>
      <h3>Rent Values</h3>
      
      <div class="form-group-row">
        <div class="form-group">
          <label>Base Rent</label>
          <div class="input-prefix">
            <span>$</span>
            <input type="number" id="prop-rent" value="${property.baseRent}" />
          </div>
        </div>
      </div>
      
      <div class="form-group-row">
        <div class="form-group">
          <label>With 1 House</label>
          <div class="input-prefix"><span>$</span><input type="number" id="prop-h1" value="${property.house1}" /></div>
        </div>
        <div class="form-group">
          <label>With 2 Houses</label>
          <div class="input-prefix"><span>$</span><input type="number" id="prop-h2" value="${property.house2}" /></div>
        </div>
      </div>
      
      <div class="form-group-row">
        <div class="form-group">
          <label>With 3 Houses</label>
          <div class="input-prefix"><span>$</span><input type="number" id="prop-h3" value="${property.house3}" /></div>
        </div>
        <div class="form-group">
          <label>With 4 Houses</label>
          <div class="input-prefix"><span>$</span><input type="number" id="prop-h4" value="${property.house4}" /></div>
        </div>
      </div>
      
      <div class="form-group">
        <label>With HOTEL</label>
        <div class="input-prefix"><span>$</span><input type="number" id="prop-hotel" value="${property.hotel}" /></div>
      </div>
      
      <div class="form-divider"></div>
      
      <div class="form-group-row">
        <div class="form-group">
          <label>Mortgage Value</label>
          <div class="input-prefix"><span>$</span><input type="number" id="prop-mortgage" value="${property.mortgage}" /></div>
        </div>
        <div class="form-group">
          <label>Houses cost</label>
          <div class="input-prefix"><span>$</span><input type="number" id="prop-build" value="${property.buildingCost}" /></div>
        </div>
      </div>
    </div>
  `;

  // Bind Events
  const bind = (id, key, isNumber = false) => {
    document.getElementById(id).addEventListener('input', (e) => {
      let val = e.target.value;
      if (isNumber) val = parseInt(val) || 0;
      appState.updateState('property', key, val);
      
      if (id === 'prop-color') {
        document.getElementById('color-hex').textContent = e.target.value.toUpperCase();
      }
    });
  };

  bind('prop-title', 'title');
  bind('prop-color', 'headerColor');
  bind('prop-header-text', 'headerTextColor');
  bind('prop-text-color', 'textColor');
  bind('prop-bg-color', 'backgroundColor');
  bind('prop-rent', 'baseRent', true);
  bind('prop-h1', 'house1', true);
  bind('prop-h2', 'house2', true);
  bind('prop-h3', 'house3', true);
  bind('prop-h4', 'house4', true);
  bind('prop-hotel', 'hotel', true);
  bind('prop-mortgage', 'mortgage', true);
  bind('prop-build', 'buildingCost', true);

  const watchColor = (id, hexId) => {
    document.getElementById(id).addEventListener('input', (e) => {
      document.getElementById(hexId).textContent = e.target.value.toUpperCase();
    });
  };
  watchColor('prop-header-text', 'prop-header-text-hex');
  watchColor('prop-text-color', 'prop-text-hex');
  watchColor('prop-bg-color', 'prop-bg-hex');

  document.getElementById('prop-bg-img').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        appState.updateState('property', 'backgroundImageUrl', ev.target.result);
        renderPropertyForm(container);
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('prop-clear-img').addEventListener('click', () => {
    appState.updateState('property', 'backgroundImageUrl', null);
    renderPropertyForm(container);
  });
}

export function renderPropertyPreview(container) {
  const { property } = appState.assetData;
  
  container.innerHTML = `
    <div class="property-card" id="card-preview" style="
      background-color: ${property.backgroundColor || '#FFFFFF'};
      color: ${property.textColor || '#000000'};
      ${property.backgroundImageUrl ? `background-image: url('${property.backgroundImageUrl}'); background-size: cover; background-position: center;` : ''}
    ">
      <div class="card-border" style="border-color: ${property.textColor || '#000000'}">
        <div class="card-header" id="preview-header" style="background-color: ${property.headerColor || '#005CE6'}; color: ${property.headerTextColor || '#FFFFFF'}; border-bottom-color: ${property.textColor || '#000000'};">
          <div class="title-deed">TITLE DEED</div>
          <h1 id="preview-title">${property.title}</h1>
        </div>
        
        <div class="card-body">
          <div class="rent-row center">
            <span>RENT $</span><span id="preview-rent">${property.baseRent}</span><span>.</span>
          </div>
          
          <div class="house-rents">
            <div class="grid-row"><span>With 1 House</span> <span>$<span id="preview-h1">${property.house1}</span>.</span></div>
            <div class="grid-row"><span>With 2 Houses</span> <span>$<span id="preview-h2">${property.house2}</span>.</span></div>
            <div class="grid-row"><span>With 3 Houses</span> <span>$<span id="preview-h3">${property.house3}</span>.</span></div>
            <div class="grid-row"><span>With 4 Houses</span> <span>$<span id="preview-h4">${property.house4}</span>.</span></div>
          </div>
          
          <div class="hotel-rent center margin-y">
            <span>With HOTEL $<span id="preview-hotel">${property.hotel}</span>.</span>
          </div>
          
          <div class="mortgage-val center margin-y">
            <span>Mortgage Value $<span id="preview-mortgage">${property.mortgage}</span>.</span>
          </div>
          
          <div class="building-costs center">
            <div>Houses cost $<span id="preview-build">${property.buildingCost}</span>. each</div>
            <div>Hotels, $<span id="preview-build-hotel">${property.buildingCost}</span>. plus 4 houses</div>
          </div>
          
          <div class="instruction-tiny center">
            If a player owns ALL the Lots of any Color-Group, the rent is Doubled on Unimproved Lots in that group.
          </div>
        </div>
      </div>
    </div>
  `;

  // Subscribe to updates for Live Preview
  appState.subscribe('property_updated', (data) => {
    const cardEl = document.getElementById('card-preview');
    cardEl.style.backgroundColor = data.backgroundColor;
    cardEl.style.color = data.textColor;
    if (data.backgroundImageUrl) {
      cardEl.style.backgroundImage = `url('${data.backgroundImageUrl}')`;
      cardEl.style.backgroundSize = 'cover';
      cardEl.style.backgroundPosition = 'center';
    } else {
      cardEl.style.backgroundImage = 'none';
    }

    const borderEl = cardEl.querySelector('.card-border');
    borderEl.style.borderColor = data.textColor;

    const headerEl = document.getElementById('preview-header');
    headerEl.style.backgroundColor = data.headerColor;
    headerEl.style.color = data.headerTextColor;
    headerEl.style.borderBottomColor = data.textColor;

    document.getElementById('preview-title').textContent = data.title;
    document.getElementById('preview-rent').textContent = data.baseRent;
    document.getElementById('preview-h1').textContent = data.house1;
    document.getElementById('preview-h2').textContent = data.house2;
    document.getElementById('preview-h3').textContent = data.house3;
    document.getElementById('preview-h4').textContent = data.house4;
    document.getElementById('preview-hotel').textContent = data.hotel;
    document.getElementById('preview-mortgage').textContent = data.mortgage;
    document.getElementById('preview-build').textContent = data.buildingCost;
    document.getElementById('preview-build-hotel').textContent = data.buildingCost;
  });
}
