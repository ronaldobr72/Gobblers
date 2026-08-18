# Gobblet Gobblers Web

A lightweight, client-side web version of Gobblet Gobblers for local two-player matches on the same device. This project is designed to run as a static site and be deployable on GitHub Pages.

## 1. Project Overview

Develop a responsive and interactive web version of the board game Gobblet Gobblers.

The game runs entirely client-side, allowing local Player vs. Player matches on one device. This keeps the app lightweight, fast, and easy to deploy for free on GitHub Pages.

## 2. Architecture & Technologies

- HTML5: page structure for the board, scoreboard, and reserves
- CSS3: responsive layout, visual design, smooth transitions, and animations
- JavaScript (ES6+): game state, validation logic, win detection, and DOM rendering

## 3. Game State Data Structure

```js
const gameState = {
  score: { player1: 0, player2: 0 },
  currentPlayer: 1,
  reserve: {
    player1: [3, 3, 2, 2, 1, 1],
    player2: [3, 3, 2, 2, 1, 1]
  },
  board: [
    [[], [], []],
    [[], [], []],
    [[], [], []]
  ],
  selectedPiece: null
};
```

A selected piece should store origin context, such as:

```js
{ origin: 'reserve' | 'board', size: 3, index: 0, row: 0, col: 0 }
```

## 4. Core Mechanics & Business Rules

### 4.1 Turn Flow

- The active player selects a piece from their reserve or from the top of a board stack if it belongs to them.
- Valid destination cells are highlighted.
- The player clicks a target cell to place or move the piece.

### 4.2 Movement Validation (Gobble Rule)

A move is valid only if the target cell is empty or if the top piece in that stack is strictly smaller than the incoming piece.

Examples:
- Large piece (3) can cover Medium (2) or Small (1)
- Large piece can occupy an empty cell
- A piece cannot stack on an equal or larger piece

### 4.3 Continuous Win Detection

Win detection occurs in two key moments:

1. Immediately after lifting a piece from the board:
   - If lifting reveals an opponent's piece that completes a three-in-a-row, the opponent wins instantly.
2. After a move is completed:
   - The game checks all top pieces for rows, columns, and diagonals of the same color.

### 4.4 Scoring & Reset System

- Increment the winner's score in `gameState.score`
- Display a victory screen with a "Next Match" button
- Reset the reserve and board while preserving the scoreboard
- Optional persistence via `localStorage` for refreshes

## 5. User Interface & Animations

### 5.1 Screen Layout

- Header: title and scoreboard
- Central board area: 3x3 grid with visible boundaries
- Left reserve: Player 1
- Right reserve: Player 2
- Footer: turn indicator

### 5.2 Animation Requirements

- Gobble effect: scale-up and drop-down motion when a larger piece covers a smaller one
- Selected piece: hover motion and subtle drop shadow
- Victory screen: neon glow effect for the winning line and rolling ticker animation on the scoreboard

## 6. Directory Structure

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── game.js
│   └── ui.js
├── README.md
```

## 7. Implementation Plan

### Phase 1: Project Setup

- Create the static web app structure
- Add base HTML containers for the board, reserves, and score panel
- Configure CSS variables and responsive styling

### Phase 2: Core Game State

- Build `gameState` object and initialization logic
- Create reserve arrays and board matrix representation
- Add helper functions for piece placement and stack logic

### Phase 3: Movement Rules

- Implement piece selection and validation
- Enforce gobbling rules and stack restrictions
- Prevent illegal moves and highlight legal destinations

### Phase 4: Win Detection

- Detect completed lines after each move
- Handle instant-win scenario when a board piece is lifted
- Trigger the victory flow and score update

### Phase 5: UI Rendering

- Render reserves and board stacks through the DOM
- Add selected-piece highlighting and turn indicators
- Implement victory overlay and reset button behaviors

### Phase 6: Polish & Deployment

- Add board animations and hover effects
- Improve responsiveness and accessibility
- Test locally in browser
- Deploy through GitHub Pages

## 8. Recommended Development Order

1. Build the board and reserve layout
2. Implement state model and initial render
3. Add move validation
4. Add win detection and scoring
5. Add animations and visual polish
6. Validate gameplay loop and deploy

## 9. Deployment Note

This project is intended for a GitHub Pages deployment and should be kept as a static frontend-only application to satisfy the serverless architecture requirement.

## 10. Repository

Repository: https://github.com/ronaldobr72/Gobblers
