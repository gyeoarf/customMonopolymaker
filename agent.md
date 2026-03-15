# Agent Guide: Custom Monopoly Asset Generator

This document provides essential information for AI agents working on the Custom Monopoly Asset Generator project.

## Project Overview
The **Custom Monopoly Asset Generator** is a web-based tool designed to create and export high-quality, custom assets for Monopoly-style board games. It supports generating:
- **Property Cards**: Full customization of names, rents, colors, and background images.
- **Action Cards**: Chance and Community Chest cards.
- **Special Cards**: Railroads and Utilities.
- **Game Accessories**: Custom Dice faces and Currency denominations.
- **Exporting**: Uses `html2canvas` to export previews as high-resolution PNGs.

## Tech Stack
- **Framework**: [Vite](https://vitejs.dev/) (Build tool & Dev server)
- **Language**: Vanilla JavaScript (ES Modules)
- **Styling**: Vanilla CSS
- **Icons**: [Lucide](https://lucide.dev/)
- **Utilities**: [html2canvas](https://html2canvas.hertzen.com/) (for PNG export)

## Architecture & State Management
The project uses a **Centralized State Manager** located in `src/main.js` following a **PubSub (Publisher-Subscriber) pattern**.

### `appState` Object (`src/main.js`)
- **`assetData`**: Holds the current configuration for all asset types (property, chance, chest, dice, etc.).
- **`subscribe(event, callback)`**: Allows components to listen for state changes (e.g., `property_updated`).
- **`publish(event, data)`**: Triggers updates across the application.
- **`updateState(assetType, key, value)`**: The primary method for mutating state and notifying subscribers.

### Component Structure (`src/components/`)
Each feature (PropertyCard, Dice, etc.) typically consists of:
1. `renderXForm(container)`: Generates the UI for editing the asset.
2. `renderXPreview(container)`: Generates the live preview UI and subscribes to state updates.
3. Relevant CSS files for styling.

## Essential Commands
- **Install Dependencies**: `npm install`
- **Development Server**: `npm run dev`
- **Production Build**: `npm run build`

## Critical Rules for Agents
- **Git Push Policy**: Do **NOT** push to `https://github.com/gyeoarf/customMonopolymaker` until the user explicitly confirms that a feature is working properly.
- **Environment**: ALWAYS ensure the local development server (`npm run dev`) is running at the end of your work session so the user can see your changes.
- **Testing**: **NEVER** perform testing by yourself in the browser (e.g., using `browser_subagent`). Provide the work and leave the verification and testing to the user.
- **State Mutation**: Always use `appState.updateState()` to ensure the UI remains in sync across forms and previews.
- **Styling**: Favor the existing CSS variables and component styles in `src/style.css` and individual component CSS files.
