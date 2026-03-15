import { appState } from '../main.js';

const PLACEHOLDER_IMAGE = 'assets/cardselements/placeholder.jpeg';

/**
 * Build the project JSON string (used by both file download and clipboard copy).
 */
export function getProjectJsonString() {
  const cards = appState.batchCards.map(card => ({
    id: card.id,
    type: card.type,
    data: sanitizeDataForExport(card.type, card.data),
    timestamp: card.timestamp
  }));

  const project = {
    projectName: appState.projectName || 'Untitled',
    version: 1,
    cards
  };

  return JSON.stringify(project, null, 2);
}

/**
 * Export the current batch as a JSON file download.
 */
export function exportProjectJsonFile() {
  const jsonStr = getProjectJsonString();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.download = `${appState.projectName || 'monopoly_project'}.json`;
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Import a JSON string and load it into appState.
 */
export function importProjectJson(jsonString) {
  try {
    const project = JSON.parse(jsonString);

    if (!project.version || !Array.isArray(project.cards)) {
      alert('Invalid project file: missing version or cards array.');
      return false;
    }

    appState.projectName = project.projectName || '';
    appState.selectedBatchCardId = null;
    
    // Rebuild batch cards, assigning new IDs if missing
    appState.batchCards = project.cards.map(card => ({
      id: card.id || crypto.randomUUID(),
      type: card.type,
      data: card.data,
      timestamp: card.timestamp || Date.now()
    }));

    return true;
  } catch (e) {
    alert('Failed to parse JSON: ' + e.message);
    console.error('Import error:', e);
    return false;
  }
}

/**
 * Replace base64 image data with placeholder paths for export.
 */
function sanitizeDataForExport(type, data) {
  const clone = JSON.parse(JSON.stringify(data));

  switch (type) {
    case 'property':
      if (clone.backgroundImageUrl && clone.backgroundImageUrl.startsWith('data:')) {
        clone.backgroundImageUrl = PLACEHOLDER_IMAGE;
      }
      break;

    case 'chance':
    case 'chest':
      if (clone.image && clone.image.startsWith('data:')) {
        clone.image = PLACEHOLDER_IMAGE;
      }
      break;

    case 'back':
      if (clone.image && clone.image.startsWith('data:')) {
        clone.image = PLACEHOLDER_IMAGE;
      }
      break;

    case 'utility':
      if (clone.backgroundImageUrl && clone.backgroundImageUrl.startsWith('data:')) {
        clone.backgroundImageUrl = PLACEHOLDER_IMAGE;
      }
      break;

    case 'currency':
      if (clone.backgroundImageUrl && clone.backgroundImageUrl.startsWith('data:')) {
        clone.backgroundImageUrl = PLACEHOLDER_IMAGE;
      }
      break;

    case 'dice':
      if (clone.faces) {
        clone.faces = clone.faces.map(face =>
          face && face.startsWith('data:') ? PLACEHOLDER_IMAGE : face
        );
      }
      break;

    // railroad has no images
    default:
      break;
  }

  return clone;
}
