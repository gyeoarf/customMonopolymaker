/**
 * BoardRenderer.js
 * Generates static HTML for the Monopoly board (for batch thumbnails and export).
 * No PubSub — pure function from data to HTML string.
 */

import { escapeHtml } from '../utils/sanitize.js';
import { CORNER_INDICES, getSide, getGridPosition } from '../data/defaultBoard.js';

/**
 * Renders the full board as an HTML string.
 */
export function renderStaticBoard(boardData) {
  const { spaces, centerColor, centerImage } = boardData;

  let spacesHtml = '';
  for (let i = 0; i < 40; i++) {
    spacesHtml += renderStaticSpace(i, spaces[i]);
  }

  const centerImageHtml = centerImage
    ? `<img src="${centerImage}" class="board-center-image" />`
    : '';

  return `
    <div class="monopoly-board">
      ${spacesHtml}
      <div class="board-center" style="background-color: ${centerColor || '#C8E6C8'};">
        ${centerImageHtml}
      </div>
    </div>
  `;
}

function renderStaticSpace(index, space) {
  const { row, col } = getGridPosition(index);
  const isCorner = CORNER_INDICES.includes(index);
  const side = getSide(index);

  const cornerClass = isCorner ? `corner corner-${space.type.replace('_', '-')}` : '';
  const sideClass = isCorner ? '' : `side-${side}`;

  const style = `grid-row: ${row}; grid-column: ${col};`;

  if (isCorner) {
    return `
      <div class="board-space ${cornerClass}" data-index="${index}" style="${style}">
        ${renderCornerInner(space)}
      </div>
    `;
  }

  return `
    <div class="board-space ${sideClass}" data-index="${index}" style="${style}">
      <div class="space-inner">
        ${renderSpaceContent(space)}
      </div>
    </div>
  `;
}

function renderCornerInner(space) {
  const textColor = space.cornerTextColor || '#000000';
  const imageHtml = space.image
    ? `<div class="corner-image"><img src="${space.image}" /></div>`
    : '';

  return `
    <div class="corner-inner">
      <div class="corner-text" style="color: ${textColor};">${escapeHtml(space.cornerText || space.name)}</div>
      ${imageHtml}
      <div class="corner-subtext" style="color: ${textColor};">${escapeHtml(space.cornerSubtext || '')}</div>
    </div>
  `;
}

function renderSpaceContent(space) {
  const nameColor = space.nameColor || '#000000';

  switch (space.type) {
    case 'property':
      return renderPropertySpace(space, nameColor);
    case 'railroad':
      return renderRailroadSpace(space, nameColor);
    case 'utility':
      return renderUtilitySpace(space, nameColor);
    case 'chance':
      return renderChanceSpace(space, nameColor);
    case 'chest':
      return renderChestSpace(space, nameColor);
    case 'tax':
      return renderTaxSpace(space, nameColor);
    default:
      return `<div class="space-name" style="color: ${nameColor};">${escapeHtml(space.name)}</div>`;
  }
}

function renderPropertySpace(space, nameColor) {
  const imageHtml = space.image
    ? `<div class="space-image"><img src="${space.image}" /></div>`
    : '';

  return `
    <div class="space-color-stripe" style="background-color: ${space.color || '#8B4513'};"></div>
    <div class="space-content">
      <div class="space-name" style="color: ${nameColor};">${escapeHtml(space.name)}</div>
      ${imageHtml}
      <div class="space-price" style="color: ${nameColor};">${escapeHtml(space.price || '')}</div>
    </div>
  `;
}

function renderRailroadSpace(space, nameColor) {
  const imageHtml = space.image
    ? `<div class="space-image"><img src="${space.image}" /></div>`
    : `<div class="space-image"><img src="assets/cardselements/train.svg" /></div>`;

  return `
    <div class="space-content">
      <div class="space-name" style="color: ${nameColor};">${escapeHtml(space.name)}</div>
      ${imageHtml}
      <div class="space-price" style="color: ${nameColor};">${escapeHtml(space.price || '$200')}</div>
    </div>
  `;
}

function renderUtilitySpace(space, nameColor) {
  const imageHtml = space.image
    ? `<div class="space-image"><img src="${space.image}" /></div>`
    : '';

  return `
    <div class="space-content">
      <div class="space-name" style="color: ${nameColor};">${escapeHtml(space.name)}</div>
      ${imageHtml}
    </div>
  `;
}

function renderChanceSpace(space, nameColor) {
  const imageHtml = space.image
    ? `<div class="space-image"><img src="${space.image}" /></div>`
    : `<div class="space-type-icon" style="color: ${nameColor};">?</div>`;

  return `
    <div class="space-content">
      <div class="space-name" style="color: ${nameColor};">${escapeHtml(space.name)}</div>
      ${imageHtml}
    </div>
  `;
}

function renderChestSpace(space, nameColor) {
  const imageHtml = space.image
    ? `<div class="space-image"><img src="${space.image}" /></div>`
    : `<div class="space-image"><img src="assets/cardselements/communitychest.png" /></div>`;

  return `
    <div class="space-content">
      <div class="space-name" style="color: ${nameColor};">${escapeHtml(space.name)}</div>
      ${imageHtml}
    </div>
  `;
}

function renderTaxSpace(space, nameColor) {
  const imageHtml = space.image
    ? `<div class="space-image"><img src="${space.image}" /></div>`
    : '';

  return `
    <div class="space-content">
      <div class="space-name" style="color: ${nameColor};">${escapeHtml(space.name)}</div>
      ${imageHtml}
      <div class="space-price" style="color: ${nameColor};">${escapeHtml(space.price || '')}</div>
    </div>
  `;
}
