import { appState } from '../main.js';
import { createIcons, Settings2 } from 'lucide';

export function renderImageToolbar(container, assetType) {
  // Extract transform object reference
  const stateRef = appState.assetData[assetType];
  const tr = assetType === 'dice' ? stateRef.transforms[stateRef.activeFaceIndex] : stateRef.transform;
  
  container.innerHTML = `
    <div class="image-toolbar">
      <h4 class="toolbar-title"><i data-lucide="settings-2"></i> Image Tools</h4>
      
      <div class="toolbar-control">
        <label>Scale: <span id="val-scale">${tr.scale}x</span></label>
        <input type="range" id="t-scale" min="0.1" max="5" step="0.1" value="${tr.scale}" />
      </div>
      
      <div class="toolbar-control">
        <label>Rotate: <span id="val-rotate">${tr.rotate}°</span></label>
        <input type="range" id="t-rotate" min="-180" max="180" step="1" value="${tr.rotate}" />
      </div>
      
      <div class="toolbar-actions">
        <button id="t-flipx" class="btn-icon" title="Flip Horizontal">
          Mirror Horizontal
        </button>
        <button id="t-flipy" class="btn-icon" title="Flip Vertical">
          Mirror Vertical
        </button>
      </div>
    </div>
  `;

  createIcons({
    icons: {
      Settings2
    }
  });

  // Binds explicitly to the nested transform object
  const updateTransform = (key, val) => {
    let specificTr;
    if (assetType === 'dice') {
      const faceIdx = appState.assetData.dice.activeFaceIndex;
      if (faceIdx === null) return;
      appState.assetData.dice.transforms[faceIdx][key] = val;
      // Publish parent trigger
      appState.publish('dice_updated', appState.assetData.dice);
    } else {
      appState.assetData[assetType].transform[key] = val;
      appState.publish(`${assetType}_updated`, appState.assetData[assetType]);
    }
  };

  document.getElementById('t-scale').addEventListener('input', (e) => {
    document.getElementById('val-scale').textContent = `${e.target.value}x`;
    updateTransform('scale', parseFloat(e.target.value));
  });

  document.getElementById('t-rotate').addEventListener('input', (e) => {
    document.getElementById('val-rotate').textContent = `${e.target.value}°`;
    updateTransform('rotate', parseInt(e.target.value));
  });

  document.getElementById('t-flipx').addEventListener('click', () => {
    const currentTr = assetType === 'dice' ? appState.assetData.dice.transforms[appState.assetData.dice.activeFaceIndex] : appState.assetData[assetType].transform;
    updateTransform('flipX', currentTr.flipX * -1);
  });

  document.getElementById('t-flipy').addEventListener('click', () => {
    const currentTr = assetType === 'dice' ? appState.assetData.dice.transforms[appState.assetData.dice.activeFaceIndex] : appState.assetData[assetType].transform;
    updateTransform('flipY', currentTr.flipY * -1);
  });
}
