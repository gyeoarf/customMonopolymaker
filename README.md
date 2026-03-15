# Custom Monopoly Asset Generator

A web-based tool for creating and exporting custom assets for Monopoly-style board games.

## Online Usage

The application is hosted on GitHub Pages and can be accessed at:
https://gyeoarf.github.io/customMonopolymaker/

### Creating Cards
Select an asset type from the sidebar (Property, Chance, Railroad, etc.) and use the editor on the left to customize the name, color, and rent values. Previews update in real-time on the right.

### Managing Batches
Once a card is configured, click "Create and add to batch" to save it. You can view all saved cards in the Batch Preview, where you can pan, zoom, and duplicate existing cards.

### Exporting
Use the "Export as PNG" button for individual cards or the batch export options to download your entire set as a collection.

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
