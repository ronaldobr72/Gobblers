# Gobblet Gobblers Web — Implementation Plan

## Goal
Build a responsive, client-side, two-player Gobblet Gobblers game that runs as a static web app and can be deployed to GitHub Pages.

## Phase 1 — Project Foundation

1. Create the repository structure:
   - `index.html`
   - `css/style.css`
   - `js/game.js`
   - `js/ui.js`
   - `README.md`
2. Set up the base HTML skeleton with:
   - header and scoreboard
   - left and right reserves
   - center 3x3 board
   - turn indicator
3. Link the CSS and JS files and confirm the page renders cleanly in a browser.

## Phase 2 — Game State Model

1. Define a `gameState` object with:
   - score tracking
   - current player
   - reserve arrays
   - board matrix
   - selected piece state
2. Build initial setup functions:
   - reset the game
   - initialize reserve pieces
   - clear board data
3. Add helper functions for:
   - reading the top piece of a stack
   - inspecting cell occupancy
   - validating moves

## Phase 3 — Movement and Rules Engine

1. Implement piece selection from:
   - player's reserve
   - top of a stack on the board
2. Highlight legal destination squares.
3. Enforce the gobble rule:
   - only empty cells or smaller top pieces are valid
   - equal-sized or larger pieces cannot be covered
4. Prevent illegal moves from other players or invalid stacks.
5. Add turn switching after a legal move.

## Phase 4 — Win Detection and Score Logic

1. Detect win states after a move using rows, columns, and diagonals.
2. Detect the instant-win condition when lifting a piece reveals a winning line for the opponent.
3. Update `gameState.score` for the winner.
4. Trigger a victory flow that includes:
   - highlight or glow on the winning line
   - a visible winner banner or overlay
   - a "Next Match" action

## Phase 5 — UI Rendering and Interaction

1. Render the board dynamically from the `gameState.board` matrix.
2. Render each player's reserve with piece sizing and player colors.
3. Update the score display and turn indicator after each move.
4. Add selected-piece highlighting and board cell focus states.
5. Add CSS transitions for:
   - piece hover
   - gobble animation
   - selected-piece lift effect
   - victory glow styling

## Phase 6 — Polish and Responsiveness

1. Improve the layout for desktop and mobile screens.
2. Tune spacing, sizing, and colors for readability.
3. Add subtle CSS animations for board and piece feedback.
4. Consider optional `localStorage` persistence for score continuity across refreshes.

## Phase 7 — Verification and Deployment

1. Test gameplay loops in the browser:
   - legal moves
   - illegal gobble attempts
   - win condition checks
   - next match reset
2. Confirm the app loads correctly through static hosting.
3. Publish to GitHub Pages from the repository root.
4. Final review: Gameplay should be smooth, visually polished, and free of front-end logic errors.

## Recommended Order of Execution

1. HTML structure
2. CSS layout and basic board styling
3. Game state object and initialization
4. Move validation
5. Win detection and scoring
6. DOM rendering and interactivity
7. polish and page deployment

## Success Criteria

- Local two-player turns work correctly
- Gobble rules are enforced
- Win detection works in both required scenarios
- Score increments properly
- Board resets correctly between matches
- Game is responsive and deployable as a static site
