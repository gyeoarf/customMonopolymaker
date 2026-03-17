# Custom Monopoly Asset Generator

A web-based tool for creating and exporting custom assets for Monopoly-style board games.

## Online Usage

The application is hosted on GitHub Pages and can be accessed at:
https://gyeoarf.github.io/customMonopolymaker/

### Creating Cards
Select an asset type from the sidebar (Property, Chance, Railroad, etc.) and use the editor on the left to customize the name, color, and rent values. Previews update in real-time on the right.

### Managing Batches
Once a card is configured, click "Create and add to batch" to save it. You can view all saved cards in the Batch Preview, where you can pan, zoom, and duplicate existing cards.

### Board Editor
Create a full custom game board with property spaces, action spaces, and custom corner squares (Go, Jail, Free Parking, etc.). Access the board editor via the **Board Editor** link in the sidebar.

## Local Installation

If the online site is unavailable or you prefer to run the tool locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/gyeoarf/customMonopolymaker.git
   ```
2. Navigate to the project directory:
   ```bash
   cd customMonopolymaker
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
The application will be available at http://localhost:3000.

## Supported Assets

The generator currently supports the following asset types:
- Property Cards (Title Deeds)
- Action Cards (Chance and Community Chest)
- Special Cards (Railroads and Utilities)
- Card Backs
- Currency Denominations
- Custom Dice Faces
- Game Boards (Full Board Customization)

## JSON Import / Export Guide

The application supports importing and exporting cards and boards as JSON files. This lets you create assets programmatically, share them, or back them up.

### Cards (Batch) JSON

A card batch file wraps one or more cards in this structure:

```json
{
  "projectName": "My Custom Game",
  "version": 1,
  "cards": [
    {
      "id": "unique-uuid-string",
      "type": "property",
      "data": { ... },
      "timestamp": 1700000000000
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `projectName` | string | Name of the project (used for filenames on export) |
| `version` | number | Always `1` |
| `cards` | array | Array of card objects |
| `cards[].id` | string | Unique ID (UUID). Generate one per card |
| `cards[].type` | string | One of: `property`, `chance`, `chest`, `back`, `railroad`, `utility`, `currency`, `dice` |
| `cards[].data` | object | Card-specific data (see below) |
| `cards[].timestamp` | number | Unix timestamp in milliseconds |

> **Images:** When exporting, base64 image data is replaced with a placeholder path. If you are writing JSON by hand, set image fields to `null` or omit them.

---

### Property Card

```json
{
  "type": "property",
  "data": {
    "title": "BOARDWALK",
    "headerColor": "#0072BB",
    "headerTextColor": "#FFFFFF",
    "textColor": "#000000",
    "backgroundColor": "#FFFFFF",
    "backgroundImageUrl": null,
    "transform": { "x": 0, "y": 0, "width": 270, "height": 410, "rotation": 0, "flipX": 1, "flipY": 1 },
    "baseRent": 50,
    "house1": 200,
    "house2": 600,
    "house3": 1400,
    "house4": 1700,
    "hotel": 2000,
    "mortgage": 200,
    "buildingCost": 200
  }
}
```

| Field | Type | Default | What it controls |
|---|---|---|---|
| `title` | string | `"TITLE DEED"` | Header text on the card |
| `headerColor` | hex color | `"#005CE6"` | Color of the header strip |
| `headerTextColor` | hex color | `"#FFFFFF"` | Title text color |
| `textColor` | hex color | `"#000000"` | All body text color |
| `backgroundColor` | hex color | `"#FFFFFF"` | Card background |
| `backgroundImageUrl` | string or null | `null` | Full-card background image (base64 data URL) |
| `transform` | object | see below | Position/size/rotation of the background image |
| `baseRent` | number | `50` | Rent with no houses |
| `house1` | number | `200` | Rent with 1 house |
| `house2` | number | `600` | Rent with 2 houses |
| `house3` | number | `1400` | Rent with 3 houses |
| `house4` | number | `1700` | Rent with 4 houses |
| `hotel` | number | `2000` | Rent with hotel |
| `mortgage` | number | `200` | Mortgage value |
| `buildingCost` | number | `200` | Cost per house/hotel |

### Railroad Card

```json
{
  "type": "railroad",
  "data": {
    "title": "READING RAILROAD",
    "headerColor": "#000000",
    "headerTextColor": "#FFFFFF",
    "textColor": "#000000",
    "backgroundColor": "#FFFFFF",
    "rent1": 25,
    "rent2": 50,
    "rent3": 100,
    "rent4": 200,
    "mortgage": 100
  }
}
```

| Field | Type | Default | What it controls |
|---|---|---|---|
| `title` | string | `"READING RAILROAD"` | Header text |
| `headerColor` | hex color | `"#000000"` | Header strip color |
| `headerTextColor` | hex color | `"#FFFFFF"` | Title text color |
| `textColor` | hex color | `"#000000"` | Body text color |
| `backgroundColor` | hex color | `"#FFFFFF"` | Card background |
| `rent1` | number | `25` | Rent if 1 railroad owned |
| `rent2` | number | `50` | Rent if 2 railroads owned |
| `rent3` | number | `100` | Rent if 3 railroads owned |
| `rent4` | number | `200` | Rent if all 4 owned |
| `mortgage` | number | `100` | Mortgage value |

### Utility Card

```json
{
  "type": "utility",
  "data": {
    "title": "ELECTRIC COMPANY",
    "headerColor": "#000000",
    "headerTextColor": "#FFFFFF",
    "textColor": "#000000",
    "backgroundColor": "#FFFFFF",
    "backgroundImageUrl": null,
    "transform": { "x": 0, "y": 0, "width": 270, "height": 410, "rotation": 0, "flipX": 1, "flipY": 1 },
    "mortgage": 75
  }
}
```

| Field | Type | Default | What it controls |
|---|---|---|---|
| `title` | string | `"ELECTRIC COMPANY"` | Header text |
| `headerColor` | hex color | `"#000000"` | Header strip color |
| `headerTextColor` | hex color | `"#FFFFFF"` | Title text color |
| `textColor` | hex color | `"#000000"` | Body text color |
| `backgroundColor` | hex color | `"#FFFFFF"` | Card background |
| `backgroundImageUrl` | string or null | `null` | Background image |
| `transform` | object | see below | Image positioning |
| `mortgage` | number | `75` | Mortgage value |

### Chance / Community Chest Card

```json
{
  "type": "chance",
  "data": {
    "text": "ADVANCE TO GO. (COLLECT $200)",
    "image": null,
    "transform": { "x": 0, "y": 0, "width": 100, "height": 100, "rotation": 0, "flipX": 1, "flipY": 1 },
    "textOffsetY": -25
  }
}
```

| Field | Type | Default | What it controls |
|---|---|---|---|
| `text` | string | *(varies)* | Instruction text on the card |
| `image` | string or null | `null` | Card image (base64 data URL) |
| `transform` | object | see below | Image positioning |
| `textOffsetY` | number | `-25` | Vertical offset for the text in pixels (negative moves up) |

Use `"type": "chest"` for Community Chest cards. Same structure.

### Card Back

```json
{
  "type": "back",
  "data": {
    "backgroundColor": "#E53935",
    "image": null,
    "repeatPattern": false,
    "transform": { "x": 0, "y": 0, "width": 270, "height": 410, "rotation": 0, "flipX": 1, "flipY": 1 }
  }
}
```

| Field | Type | Default | What it controls |
|---|---|---|---|
| `backgroundColor` | hex color | `"#E53935"` | Back color |
| `image` | string or null | `null` | Back image |
| `repeatPattern` | boolean | `false` | If `true`, tiles the image instead of stretching |
| `transform` | object | see below | Image positioning |

### Currency

```json
{
  "type": "currency",
  "data": {
    "denomination": 500,
    "backgroundColor": "#f7f9f2",
    "backgroundImageUrl": null,
    "transform": { "x": 0, "y": 0, "width": 400, "height": 210, "rotation": 0, "flipX": 1, "flipY": 1 }
  }
}
```

| Field | Type | Default | What it controls |
|---|---|---|---|
| `denomination` | number | `500` | Face value shown on the bill |
| `backgroundColor` | hex color | `"#f7f9f2"` | Bill background |
| `backgroundImageUrl` | string or null | `null` | Bill background image |
| `transform` | object | see below | Image positioning |

### Dice

```json
{
  "type": "dice",
  "data": {
    "faces": [null, null, null, null, null, null],
    "activeFaceIndex": null,
    "transforms": [
      { "x": 0, "y": 0, "width": 90, "height": 90, "rotation": 0, "flipX": 1, "flipY": 1 },
      { "x": 0, "y": 0, "width": 90, "height": 90, "rotation": 0, "flipX": 1, "flipY": 1 },
      { "x": 0, "y": 0, "width": 90, "height": 90, "rotation": 0, "flipX": 1, "flipY": 1 },
      { "x": 0, "y": 0, "width": 90, "height": 90, "rotation": 0, "flipX": 1, "flipY": 1 },
      { "x": 0, "y": 0, "width": 90, "height": 90, "rotation": 0, "flipX": 1, "flipY": 1 },
      { "x": 0, "y": 0, "width": 90, "height": 90, "rotation": 0, "flipX": 1, "flipY": 1 }
    ]
  }
}
```

| Field | Type | Default | What it controls |
|---|---|---|---|
| `faces` | array of 6 | `[null, ...]` | Image for each die face (base64 or null) |
| `activeFaceIndex` | number or null | `null` | Which face is selected for editing |
| `transforms` | array of 6 objects | see below | Positioning per face |

### Image Transform Object

Used by all card types that support images.

| Field | Type | Default | What it controls |
|---|---|---|---|
| `x` | number | `0` | Horizontal offset in pixels |
| `y` | number | `0` | Vertical offset in pixels |
| `width` | number | varies | Image display width |
| `height` | number | varies | Image display height |
| `rotation` | number | `0` | Clockwise rotation in degrees |
| `flipX` | number | `1` | Horizontal flip (`1` = normal, `-1` = mirrored) |
| `flipY` | number | `1` | Vertical flip (`1` = normal, `-1` = mirrored) |

---

### Board JSON

The board file describes the full 40-space game board.

```json
{
  "version": 1,
  "type": "board",
  "centerColor": "#C8E6C8",
  "centerImage": null,
  "spaces": [ ... ]
}
```

| Field | Type | Default | What it controls |
|---|---|---|---|
| `version` | number | `1` | Schema version |
| `type` | string | `"board"` | Must be `"board"` |
| `centerColor` | hex color | `"#C8E6C8"` | Background color of the board center |
| `centerImage` | string or null | `null` | Center image (base64 or null) |
| `spaces` | array of 40 | *(see below)* | All 40 board spaces in clockwise order |

#### Space Layout

The 40 spaces are ordered clockwise starting from GO:

| Indices | Side | Corners |
|---|---|---|
| 0 | GO (bottom-right corner) | Corner |
| 1–9 | Bottom side | |
| 10 | Jail (bottom-left corner) | Corner |
| 11–19 | Left side | |
| 20 | Free Parking (top-left corner) | Corner |
| 21–29 | Top side | |
| 30 | Go To Jail (top-right corner) | Corner |
| 31–39 | Right side | |

#### Regular Space (property, railroad, utility, chance, chest, tax)

```json
{
  "type": "property",
  "name": "BOARDWALK",
  "nameColor": "#000000",
  "image": null,
  "imageTransform": { "x": 0, "y": 0, "width": 40, "height": 40, "rotation": 0, "flipX": 1, "flipY": 1 },
  "color": "#0072BB",
  "price": "$400"
}
```

| Field | Type | Applies to | What it controls |
|---|---|---|---|
| `type` | string | all | `property`, `railroad`, `utility`, `chance`, `chest`, or `tax` |
| `name` | string | all | Display name on the space |
| `nameColor` | hex color | all | Name text color |
| `image` | string or null | all | Space image (base64 or null) |
| `imageTransform` | object | all | Image positioning (same fields as card transforms) |
| `color` | hex color | property only | Color stripe at the top of the space |
| `price` | string | property, railroad, tax | Price text shown at the bottom (e.g. `"$200"`) |

**Standard Monopoly color groups for reference:**

| Color Group | Hex Code |
|---|---|
| Brown | `#8B4513` |
| Light Blue | `#AAD8E6` |
| Pink | `#D93A96` |
| Orange | `#F7941D` |
| Red | `#ED1B24` |
| Yellow | `#FEF200` |
| Green | `#1FB25A` |
| Dark Blue | `#0072BB` |

#### Corner Space (go, jail, free_parking, go_to_jail)

```json
{
  "type": "go",
  "name": "GO",
  "nameColor": "#000000",
  "image": null,
  "imageTransform": { "x": 0, "y": 0, "width": 40, "height": 40, "rotation": 0, "flipX": 1, "flipY": 1 },
  "cornerText": "GO",
  "cornerSubtext": "COLLECT $200",
  "cornerTextColor": "#000000"
}
```

| Field | Type | What it controls |
|---|---|---|
| `type` | string | `go`, `jail`, `free_parking`, or `go_to_jail` |
| `cornerText` | string | Large text displayed in the corner |
| `cornerSubtext` | string | Smaller text below the main text |
| `cornerTextColor` | hex color | Color of corner text |

## Legal Disclaimer

This project is a fan-made tool and is not affiliated with, endorsed by, or associated with Hasbro, Inc. Monopoly is a trademark of Hasbro, Inc. All assets generated are intended for personal, non-commercial use only.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
