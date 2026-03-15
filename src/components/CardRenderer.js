/**
 * CardRenderer.js
 * Generates static HTML snapshots of cards for batch thumbnails.
 * No PubSub subscriptions — pure HTML from data.
 */

/**
 * Returns rendered HTML string for a given card type and data.
 */
export function renderStaticCard(type, data) {
  switch (type) {
    case 'property': return renderStaticProperty(data);
    case 'chance': return renderStaticActionCard(data, 'chance');
    case 'chest': return renderStaticActionCard(data, 'chest');
    case 'back': return renderStaticBack(data);
    case 'railroad': return renderStaticRailroad(data);
    case 'utility': return renderStaticUtility(data);
    case 'currency': return renderStaticCurrency(data);
    case 'dice': return renderStaticDice(data);
    default: return '<div style="padding:10px;">Unknown card type</div>';
  }
}

/**
 * Returns the native dimensions of a card type (before scaling).
 */
export function getCardDimensions(type) {
  switch (type) {
    case 'chance':
    case 'chest':
    case 'back':
      return { width: 432, height: 270 }; // landscape action cards
    case 'currency':
      return { width: 400, height: 210 };
    case 'dice':
      return { width: 300, height: 200 };
    default:
      return { width: 270, height: 410 }; // property, railroad, utility
  }
}

function renderBgImage(url) {
  if (!url || url === 'assets/cardselements/placeholder.jpeg') return '';
  return `<img src="${url}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:0; pointer-events:none;" />`;
}

function renderStaticProperty(d) {
  return `
    <div class="property-card" style="
      background-color: ${d.backgroundColor || '#FFFFFF'};
      color: ${d.textColor || '#000000'};
      position: relative;
    ">
      ${d.backgroundImageUrl ? renderBgImage(d.backgroundImageUrl) : ''}
      <div class="card-border" style="border-color: ${d.textColor || '#000000'}; position: relative; z-index: 10; pointer-events: none;">
        <div class="card-header" style="background-color: ${d.headerColor || '#005CE6'}; color: ${d.headerTextColor || '#FFFFFF'}; border-bottom-color: ${d.textColor || '#000000'};">
          <div class="title-deed">TITLE DEED</div>
          <h1>${d.title}</h1>
        </div>
        <div class="card-body">
          <div class="rent-row center">
            <span>RENT $</span><span>${d.baseRent}</span><span>.</span>
          </div>
          <div class="house-rents">
            <div class="grid-row"><span>With 1 House</span> <span>$${d.house1}.</span></div>
            <div class="grid-row"><span>With 2 Houses</span> <span>$${d.house2}.</span></div>
            <div class="grid-row"><span>With 3 Houses</span> <span>$${d.house3}.</span></div>
            <div class="grid-row"><span>With 4 Houses</span> <span>$${d.house4}.</span></div>
          </div>
          <div class="hotel-rent center margin-y">
            <span>With HOTEL $${d.hotel}.</span>
          </div>
          <div class="mortgage-val center margin-y">
            <span>Mortgage Value $${d.mortgage}.</span>
          </div>
          <div class="building-costs center">
            <div>Houses cost $${d.buildingCost}. each</div>
            <div>Hotels, $${d.buildingCost}. plus 4 houses</div>
          </div>
          <div class="instruction-tiny center">
            If a player owns ALL the Lots of any Color-Group, the rent is Doubled on Unimproved Lots in that group.
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStaticActionCard(d, type) {
  const isChest = type === 'chest';
  const title = isChest ? 'COMMUNITY CHEST' : 'CHANCE';
  const defaultImg = isChest ? '/assets/cardselements/communitychest.png' : '';
  const showDefault = !d.image && isChest;
  const hasCustomImage = d.image && d.image !== 'assets/cardselements/placeholder.jpeg';

  return `
    <div class="property-card action-card-container">
      <div class="card-border action-inner">
        <div class="action-title">${title}</div>
        <div class="action-image-wrapper" style="position: relative;">
          ${showDefault ? `<img src="${defaultImg}" class="action-icon" style="pointer-events: none;" />` : ''}
          ${hasCustomImage ? `<img src="${d.image}" class="action-icon" style="pointer-events: none;" />` : ''}
        </div>
        <div class="action-body">
          ${(d.text || '').replace(/\\n/g, '<br/>')}
        </div>
      </div>
    </div>
  `;
}

function renderStaticBack(d) {
  return `
    <div class="property-card action-card-container" style="background-color: ${d.backgroundColor}; position: relative; overflow: hidden;">
      ${d.image ? renderBgImage(d.image) : ''}
      <div class="card-border action-back" style="position:relative; z-index:10; pointer-events:none;">
      </div>
    </div>
  `;
}

function renderStaticRailroad(d) {
  return `
    <div class="property-card" style="
      background-color: ${d.backgroundColor};
      color: ${d.textColor};
      position: relative;
    ">
      <div class="card-border" style="border-color: ${d.textColor}; position:relative; z-index:10;">
        <div class="card-header" style="
          background-color: ${d.headerColor};
          color: ${d.headerTextColor};
          border-bottom-color: ${d.textColor};
        ">
          <div class="title-deed">RAILROAD</div>
          <h1>${d.title}</h1>
        </div>
        <div class="card-body" style="text-align: center;">
          <div style="margin: 10px auto;">
            <img src="/assets/cardselements/train.svg" alt="Train" style="width: 80px; height: auto; filter: ${d.textColor === '#FFFFFF' ? 'invert(1)' : 'none'};" />
          </div>
          <div class="house-rents" style="text-align: center; margin-top: 6px;">
            <div class="grid-row"><span>Rent</span><span>$${d.rent1}</span></div>
            <div class="grid-row"><span>If 2 R.R.'s are owned</span><span>$${d.rent2}</span></div>
            <div class="grid-row"><span>If 3 R.R.'s are owned</span><span>$${d.rent3}</span></div>
            <div class="grid-row"><span>If 4 R.R.'s are owned</span><span>$${d.rent4}</span></div>
          </div>
          <div class="margin-y center building-costs">
            Mortgage Value $${d.mortgage}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStaticUtility(d) {
  return `
    <div class="property-card" style="
      background-color: ${d.backgroundColor};
      color: ${d.textColor};
      position: relative;
    ">
      ${d.backgroundImageUrl ? renderBgImage(d.backgroundImageUrl) : ''}
      <div class="card-border" style="border-color: ${d.textColor}; position:relative; z-index:10; pointer-events: none;">
        <div class="card-header" style="
          background-color: ${d.headerColor};
          color: ${d.headerTextColor};
          border-bottom-color: ${d.textColor};
        ">
          <div class="title-deed">UTILITY</div>
          <h1>${d.title}</h1>
        </div>
        <div class="card-body" style="text-align: center; justify-content: center;">
          <div style="font-size: 12px; line-height: 1.6; padding: 10px;">
            <p>If one "Utility" is owned, rent is <strong>4 times</strong> amount shown on dice.</p>
            <p style="margin-top: 8px;">If both "Utilities" are owned, rent is <strong>10 times</strong> amount shown on dice.</p>
          </div>
          <div class="margin-y center building-costs">
            Mortgage Value $${d.mortgage}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStaticCurrency(d) {
  return `
    <div class="currency-bill" style="background-color: ${d.backgroundColor}; position: relative;">
      ${d.backgroundImageUrl ? renderBgImage(d.backgroundImageUrl) : ''}
      <div class="bill-border">
        <div class="bill-inner-border">
          <div class="corner top-left">${d.denomination}</div>
          <div class="corner top-right">${d.denomination}</div>
          <div class="center-denomination">${d.denomination}</div>
          <div class="corner bottom-left">${d.denomination}</div>
          <div class="corner bottom-right">${d.denomination}</div>
        </div>
      </div>
    </div>
  `;
}

function renderStaticDice(d) {
  return `
    <div class="dice-grid">
      ${Array.from({ length: 6 }).map((_, i) => `
        <div class="dice-face">
          <div class="face-number" style="z-index: 10; position: relative;">${i + 1}</div>
          ${d.faces && d.faces[i] ? `<img src="${d.faces[i]}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:1;" />` : ''}
        </div>
      `).join('')}
    </div>
  `;
}
