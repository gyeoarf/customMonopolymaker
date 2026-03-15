import { appState } from '../main.js';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { renderStaticCard, getCardDimensions } from './CardRenderer.js';

/**
 * Export all batch cards as a ZIP of PNGs, organized by category.
 * Uses CardRenderer for static HTML (same as batch preview), ensuring images render.
 */
export async function exportBatchAsZip() {
  const { batchCards, projectName } = appState;

  if (batchCards.length === 0) {
    alert('No cards in the batch. Add some cards first!');
    return;
  }

  if (!projectName.trim()) {
    alert('Please set a project name first.');
    return;
  }

  const zip = new JSZip();
  const rootFolder = zip.folder(`customMonopoly__${projectName.trim()}`);

  // Counters for auto-numbered types
  const counters = { chance: 0, chest: 0, back: 0, dice: 0 };

  // Create a hidden off-screen container for rendering
  const offscreen = document.createElement('div');
  offscreen.style.cssText = 'position:fixed; left:-9999px; top:-9999px; z-index:-1; pointer-events:none;';
  document.body.appendChild(offscreen);

  try {
    for (let i = 0; i < batchCards.length; i++) {
      const card = batchCards[i];
      const { type, data } = card;
      const dim = getCardDimensions(type);

      // Create render container with exact card dimensions
      const renderContainer = document.createElement('div');
      renderContainer.className = 'export-wrapper';
      renderContainer.style.width = `${dim.width}px`;
      renderContainer.style.height = `${dim.height}px`;
      renderContainer.style.overflow = 'hidden';

      // Use static renderer (same as batch preview, includes images)
      renderContainer.innerHTML = renderStaticCard(type, data);
      offscreen.appendChild(renderContainer);

      // Wait for all images to load
      const images = renderContainer.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // don't block on broken images
        });
      }));

      // Extra tick for DOM to settle
      await new Promise(r => setTimeout(r, 50));

      // Capture as canvas
      const canvas = await html2canvas(renderContainer, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true
      });

      // Get folder and filename
      const folder = getFolderName(type);
      const filename = getFileName(type, data, counters);

      // Convert to blob and add to ZIP
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const subFolder = rootFolder.folder(folder);
      subFolder.file(filename, blob);

      // Cleanup
      offscreen.removeChild(renderContainer);
    }

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.download = `customMonopoly__${projectName.trim()}.zip`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);

  } catch (err) {
    console.error('ZIP export error:', err);
    alert('An error occurred during export. Check the console for details.');
  } finally {
    if (offscreen.parentNode) {
      document.body.removeChild(offscreen);
    }
  }
}

function getFolderName(type) {
  const map = {
    property: 'property_cards',
    chance: 'chance_cards',
    chest: 'community_chest',
    back: 'card_backs',
    railroad: 'railroad_cards',
    utility: 'utility_cards',
    currency: 'currency',
    dice: 'dice'
  };
  return map[type] || type;
}

function getFileName(type, data, counters) {
  // Sanitize a string to be safe for filenames
  const sanitize = (str) => str.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').substring(0, 60);

  switch (type) {
    case 'property':
      return `${sanitize(data.title || 'property')}.png`;
    case 'chance':
      counters.chance++;
      return `chance_${counters.chance}.png`;
    case 'chest':
      counters.chest++;
      return `chest_${counters.chest}.png`;
    case 'back':
      counters.back++;
      return `card_back_${counters.back}.png`;
    case 'railroad':
      return `${sanitize(data.title || 'railroad')}.png`;
    case 'utility':
      return `${sanitize(data.title || 'utility')}.png`;
    case 'currency':
      return `${sanitize(String(data.denomination || '0'))}_bill.png`;
    case 'dice':
      counters.dice++;
      return `dice_${counters.dice}.png`;
    default:
      return `card_${Date.now()}.png`;
  }
}
