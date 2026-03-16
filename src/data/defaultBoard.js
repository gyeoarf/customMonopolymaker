/**
 * defaultBoard.js
 * Default Monopoly board layout data, factory functions, and grid helpers.
 */

export const CORNER_INDICES = [0, 10, 20, 30];

const DEFAULT_TRANSFORM = { x: 0, y: 0, width: 40, height: 40, rotation: 0, flipX: 1, flipY: 1 };

export function createDefaultSpace(type, name, extras = {}) {
  const base = {
    type,
    name: name || '',
    nameColor: '#000000',
    image: null,
    imageTransform: { ...DEFAULT_TRANSFORM }
  };

  switch (type) {
    case 'property':
      return { ...base, color: extras.color || '#8B4513', price: extras.price || '$60' };
    case 'railroad':
      return { ...base, price: extras.price || '$200' };
    case 'utility':
      return { ...base };
    case 'chance':
      return { ...base, name: name || 'CHANCE' };
    case 'chest':
      return { ...base, name: name || 'COMMUNITY CHEST' };
    case 'tax':
      return { ...base, price: extras.price || '$200' };
    case 'go':
      return { ...base, name: name || 'GO', cornerText: extras.cornerText || 'GO', cornerSubtext: extras.cornerSubtext || 'COLLECT $200', cornerTextColor: extras.cornerTextColor || '#000000' };
    case 'jail':
      return { ...base, name: name || 'JAIL', cornerText: extras.cornerText || 'IN JAIL', cornerSubtext: extras.cornerSubtext || 'JUST VISITING', cornerTextColor: extras.cornerTextColor || '#000000' };
    case 'free_parking':
      return { ...base, name: name || 'FREE PARKING', cornerText: extras.cornerText || 'FREE', cornerSubtext: extras.cornerSubtext || 'PARKING', cornerTextColor: extras.cornerTextColor || '#000000' };
    case 'go_to_jail':
      return { ...base, name: name || 'GO TO JAIL', cornerText: extras.cornerText || 'GO TO', cornerSubtext: extras.cornerSubtext || 'JAIL', cornerTextColor: extras.cornerTextColor || '#000000' };
    default:
      return base;
  }
}

// Standard Monopoly color groups
const BROWN = '#8B4513';
const LIGHT_BLUE = '#AAD8E6';
const PINK = '#D93A96';
const ORANGE = '#F7941D';
const RED = '#ED1B24';
const YELLOW = '#FEF200';
const GREEN = '#1FB25A';
const DARK_BLUE = '#0072BB';

/**
 * Default 40 spaces in clockwise order from GO.
 * Indices 0-9: Bottom side (GO to Connecticut Ave)
 * Indices 10-19: Left side (Jail to New York Ave)
 * Indices 20-29: Top side (Free Parking to Marvin Gardens)
 * Indices 30-39: Right side (Go To Jail to Boardwalk)
 */
export const DEFAULT_SPACES = [
  // Bottom side (index 0-9)
  createDefaultSpace('go', 'GO', { cornerText: 'GO', cornerSubtext: 'COLLECT $200' }),
  createDefaultSpace('property', 'MEDITERRANEAN AVE', { color: BROWN, price: '$60' }),
  createDefaultSpace('chest', 'COMMUNITY CHEST'),
  createDefaultSpace('property', 'BALTIC AVE', { color: BROWN, price: '$60' }),
  createDefaultSpace('tax', 'INCOME TAX', { price: '$200' }),
  createDefaultSpace('railroad', 'READING RAILROAD', { price: '$200' }),
  createDefaultSpace('property', 'ORIENTAL AVE', { color: LIGHT_BLUE, price: '$100' }),
  createDefaultSpace('chance', 'CHANCE'),
  createDefaultSpace('property', 'VERMONT AVE', { color: LIGHT_BLUE, price: '$100' }),
  createDefaultSpace('property', 'CONNECTICUT AVE', { color: LIGHT_BLUE, price: '$120' }),

  // Left side (index 10-19)
  createDefaultSpace('jail', 'JAIL', { cornerText: 'IN JAIL', cornerSubtext: 'JUST VISITING' }),
  createDefaultSpace('property', 'ST. CHARLES PLACE', { color: PINK, price: '$140' }),
  createDefaultSpace('utility', 'ELECTRIC COMPANY'),
  createDefaultSpace('property', 'STATES AVE', { color: PINK, price: '$140' }),
  createDefaultSpace('property', 'VIRGINIA AVE', { color: PINK, price: '$160' }),
  createDefaultSpace('railroad', 'PENNSYLVANIA R.R.', { price: '$200' }),
  createDefaultSpace('property', 'ST. JAMES PLACE', { color: ORANGE, price: '$180' }),
  createDefaultSpace('chest', 'COMMUNITY CHEST'),
  createDefaultSpace('property', 'TENNESSEE AVE', { color: ORANGE, price: '$180' }),
  createDefaultSpace('property', 'NEW YORK AVE', { color: ORANGE, price: '$200' }),

  // Top side (index 20-29)
  createDefaultSpace('free_parking', 'FREE PARKING', { cornerText: 'FREE', cornerSubtext: 'PARKING' }),
  createDefaultSpace('property', 'KENTUCKY AVE', { color: RED, price: '$220' }),
  createDefaultSpace('chance', 'CHANCE'),
  createDefaultSpace('property', 'INDIANA AVE', { color: RED, price: '$220' }),
  createDefaultSpace('property', 'ILLINOIS AVE', { color: RED, price: '$240' }),
  createDefaultSpace('railroad', 'B. & O. RAILROAD', { price: '$200' }),
  createDefaultSpace('property', 'ATLANTIC AVE', { color: YELLOW, price: '$260' }),
  createDefaultSpace('property', 'VENTNOR AVE', { color: YELLOW, price: '$260' }),
  createDefaultSpace('utility', 'WATER WORKS'),
  createDefaultSpace('property', 'MARVIN GARDENS', { color: YELLOW, price: '$280' }),

  // Right side (index 30-39)
  createDefaultSpace('go_to_jail', 'GO TO JAIL', { cornerText: 'GO TO', cornerSubtext: 'JAIL' }),
  createDefaultSpace('property', 'PACIFIC AVE', { color: GREEN, price: '$300' }),
  createDefaultSpace('property', 'NORTH CAROLINA AVE', { color: GREEN, price: '$300' }),
  createDefaultSpace('chest', 'COMMUNITY CHEST'),
  createDefaultSpace('property', 'PENNSYLVANIA AVE', { color: GREEN, price: '$320' }),
  createDefaultSpace('railroad', 'SHORT LINE', { price: '$200' }),
  createDefaultSpace('chance', 'CHANCE'),
  createDefaultSpace('property', 'PARK PLACE', { color: DARK_BLUE, price: '$350' }),
  createDefaultSpace('tax', 'LUXURY TAX', { price: '$100' }),
  createDefaultSpace('property', 'BOARDWALK', { color: DARK_BLUE, price: '$400' })
];

/**
 * Returns which side of the board a space index belongs to.
 */
export function getSide(index) {
  if (index >= 0 && index <= 9) return 'bottom';
  if (index >= 10 && index <= 19) return 'left';
  if (index >= 20 && index <= 29) return 'top';
  return 'right'; // 30-39
}

/**
 * Returns CSS grid position {row, col} (1-indexed) for a space index.
 *
 * Layout (11x11 grid):
 * - Row 1: Top side (Free Parking at col 1, spaces 21-29 at cols 2-10, Go To Jail at col 11)
 * - Col 1: Left side (Free Parking at row 1, spaces 11-19 reversed at rows 2-10, Jail at row 11)
 * - Row 11: Bottom side (Jail at col 1, spaces 1-9 reversed at cols 2-10, GO at col 11)
 * - Col 11: Right side (Go To Jail at row 1, spaces 31-39 at rows 2-10, GO at row 11)
 * - Center: rows 2-10, cols 2-10
 */
export function getGridPosition(index) {
  const side = getSide(index);

  if (side === 'bottom') {
    // Index 0 (GO) at col 11, index 9 at col 2
    if (index === 0) return { row: 11, col: 11 }; // GO corner
    return { row: 11, col: 11 - index };
  }
  if (side === 'left') {
    // Index 10 (Jail) at row 11, index 19 at row 2
    if (index === 10) return { row: 11, col: 1 }; // Jail corner
    return { row: 11 - (index - 10), col: 1 };
  }
  if (side === 'top') {
    // Index 20 (Free Parking) at col 1, index 29 at col 10
    if (index === 20) return { row: 1, col: 1 }; // Free Parking corner
    return { row: 1, col: index - 20 + 1 };
  }
  // right side
  // Index 30 (Go To Jail) at row 1, index 39 at row 10
  if (index === 30) return { row: 1, col: 11 }; // Go To Jail corner
  return { row: index - 30 + 1, col: 11 };
}

/**
 * Creates the full default board state object.
 */
export function createDefaultBoardState() {
  return {
    selectedSpaceIndex: 0,
    centerColor: '#C8E6C8',
    centerImage: null,
    centerImageTransform: { x: 0, y: 0, width: 600, height: 600, rotation: 0, flipX: 1, flipY: 1 },
    spaces: DEFAULT_SPACES.map(s => ({ ...s, imageTransform: { ...s.imageTransform } }))
  };
}

/**
 * Returns a human-readable label for a space, used in the form dropdown.
 */
export function getSpaceLabel(index, space) {
  const typeLabels = {
    property: 'Property',
    railroad: 'Railroad',
    utility: 'Utility',
    chance: 'Chance',
    chest: 'Comm. Chest',
    tax: 'Tax',
    go: 'Corner',
    jail: 'Corner',
    free_parking: 'Corner',
    go_to_jail: 'Corner'
  };
  return `${index + 1}. ${space.name} (${typeLabels[space.type] || space.type})`;
}
