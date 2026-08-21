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
  selectedPiece: null,
  winner: null,
  winningLine: [],
  gameMode: 'pvp',
  cpuDifficulty: 'easy',
  arcadeLevel: 1,
  engineDepth: 8
};

function initializeGame() {
  gameState.score = { player1: 0, player2: 0 };
  gameState.currentPlayer = 1;
  gameState.reserve = {
    player1: [3, 3, 2, 2, 1, 1],
    player2: [3, 3, 2, 2, 1, 1]
  };
  gameState.board = [
    [[], [], []],
    [[], [], []],
    [[], [], []]
  ];
  gameState.selectedPiece = null;
  gameState.winner = null;
  gameState.winningLine = [];
  aiMoveHistory = [];

  const depthEl = document.getElementById('engine-depth');
  if (depthEl) {
    gameState.engineDepth = Number(depthEl.value);
  }
}

function getTopPieceFromCell(row, col) {
  const stack = gameState.board[row][col];
  return stack.length ? stack[stack.length - 1] : null;
}

function getWinningLine() {
  const lines = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]]
  ];

  for (const [a, b, c] of lines) {
    const first = getTopPieceFromCell(a[0], a[1]);
    const second = getTopPieceFromCell(b[0], b[1]);
    const third = getTopPieceFromCell(c[0], c[1]);

    if (!first || !second || !third) {
      continue;
    }

    if (first.player === second.player && second.player === third.player) {
      return {
        player: first.player,
        cells: [a, b, c]
      };
    }
  }

  return null;
}

function getWinningPlayer() {
  const result = getWinningLine();
  return result ? result.player : null;
}

function isValidMove({ row, col, size }) {
  if (!Number.isInteger(row) || !Number.isInteger(col)) {
    return false;
  }

  if (row < 0 || row > 2 || col < 0 || col > 2) {
    return false;
  }

  const targetStack = gameState.board[row][col];
  const topPiece = targetStack[targetStack.length - 1];

  if (!targetStack.length) {
    return true;
  }

  return topPiece.size < size;
}

function boardContainsLegalMoveForCurrentPlayer() {
  const player = gameState.currentPlayer;
  const reservePieces = gameState.reserve[`player${player}`] || [];

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const top = getTopPieceFromCell(row, col);
      if (top && top.player === player) {
        return true;
      }
    }
  }

  return reservePieces.length > 0;
}

function switchTurn() {
  gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
}

function finishMatch(winner) {
  gameState.winner = winner;
  gameState.score[`player${winner}`] += 1;

  const lineResult = getWinningLine();
  if (lineResult && lineResult.player === winner) {
    gameState.winningLine = lineResult.cells;
  }

  if (gameState.gameMode !== 'pvp') {
    learnFromResult(winner);
  }
}

function handleReserveSelection(player, index) {
  if (gameState.winner) {
    return;
  }

  if (player !== gameState.currentPlayer) {
    return;
  }

  const selected = gameState.selectedPiece;
  if (selected && selected.origin === 'reserve' && selected.player === player && selected.index === index) {
    gameState.selectedPiece = null;
    return;
  }

  const size = gameState.reserve[`player${player}`][index];
  gameState.selectedPiece = { origin: 'reserve', player, size, index };
}

function handleBoardSelection(row, col) {
  if (gameState.winner) {
    return;
  }

  const stack = gameState.board[row][col];
  if (!stack.length) {
    if (gameState.selectedPiece) {
      attemptMove(row, col);
    }
    return;
  }

  const topPiece = stack[stack.length - 1];
  if (topPiece.player !== gameState.currentPlayer) {
    return;
  }

  if (gameState.selectedPiece && gameState.selectedPiece.origin === 'board' && gameState.selectedPiece.row === row && gameState.selectedPiece.col === col) {
    gameState.selectedPiece = null;
    return;
  }

  gameState.selectedPiece = { origin: 'board', player: topPiece.player, size: topPiece.size, row, col };
}

function isCurrentPlayerHoldingBoardPiece(row, col) {
  const stack = gameState.board[row][col];
  if (!stack.length) {
    return false;
  }

  const topPiece = stack[stack.length - 1];
  return topPiece.player === gameState.currentPlayer;
}

function attemptMove(targetRow, targetCol) {
  if (!gameState.selectedPiece || gameState.winner) {
    return;
  }

  const { origin, size, player, row, col } = gameState.selectedPiece;

  if (!isValidMove({ row: targetRow, col: targetCol, size })) {
    gameState.selectedPiece = null;
    return;
  }

  if (origin === 'board' && row === targetRow && col === targetCol) {
    gameState.selectedPiece = null;
    return;
  }

  if (origin === 'board') {
    const liftedStack = gameState.board[row][col];
    if (liftedStack.length === 0) {
      return;
    }

    const liftedPiece = liftedStack.pop();
    const revealWinner = getWinningPlayer();
    liftedStack.push(liftedPiece);

    if (revealWinner && revealWinner !== player) {
      finishMatch(revealWinner);
      gameState.selectedPiece = null;
      return;
    }
  }

  if (origin === 'reserve') {
    const currentReserve = gameState.reserve[`player${player}`];
    currentReserve.splice(gameState.selectedPiece.index, 1);
    gameState.board[targetRow][targetCol].push({ player, size });
  } else {
    const sourceStack = gameState.board[row][col];
    const liftedPiece = sourceStack.pop();
    gameState.board[targetRow][targetCol].push(liftedPiece);
  }

  const win = getWinningLine();
  if (win) {
    finishMatch(win.player);
  } else {
    switchTurn();
  }

  gameState.selectedPiece = null;
}

// ---------- IA (CPU) ----------
function cloneState(state) {
  return {
    score: { player1: state.score.player1, player2: state.score.player2 },
    currentPlayer: state.currentPlayer,
    reserve: {
      player1: state.reserve.player1.slice(),
      player2: state.reserve.player2.slice()
    },
    board: state.board.map((row) => row.map((stack) => stack.slice())),
    winner: state.winner,
    winningLine: state.winningLine.slice()
  };
}

function getTopPieceFromCellState(state, row, col) {
  const stack = state.board[row][col];
  return stack.length ? stack[stack.length - 1] : null;
}

function getWinningLineState(state) {
  const lines = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]]
  ];

  for (const [a, b, c] of lines) {
    const first = getTopPieceFromCellState(state, a[0], a[1]);
    const second = getTopPieceFromCellState(state, b[0], b[1]);
    const third = getTopPieceFromCellState(state, c[0], c[1]);

    if (first && second && third && first.player === second.player && second.player === third.player) {
      return { player: first.player, cells: [a, b, c] };
    }
  }

  return null;
}

function isValidMoveState(state, row, col, size) {
  if (row < 0 || row > 2 || col < 0 || col > 2) {
    return false;
  }

  const stack = state.board[row][col];
  if (!stack.length) {
    return true;
  }

  return stack[stack.length - 1].size < size;
}

function getLegalMoves(state, player) {
  const moves = [];
  const seenSizes = {};
  const reserve = state.reserve[`player${player}`] || [];

  reserve.forEach((size) => {
    if (seenSizes[`r${size}`]) {
      return;
    }
    seenSizes[`r${size}`] = true;

    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        if (isValidMoveState(state, r, c, size)) {
          moves.push({ origin: 'reserve', size, from: null, to: { row: r, col: c }, player });
        }
      }
    }
  });

  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const stack = state.board[r][c];
      if (!stack.length) {
        continue;
      }

      const top = stack[stack.length - 1];
      if (top.player !== player) {
        continue;
      }

      for (let tr = 0; tr < 3; tr += 1) {
        for (let tc = 0; tc < 3; tc += 1) {
          if (tr === r && tc === c) {
            continue;
          }
          if (!isValidMoveState(state, tr, tc, top.size)) {
            continue;
          }

          // Regra de revelação: não pode mover se revelar uma vitória do oponente.
          const lifted = stack.pop();
          const reveal = getWinningLineState(state);
          stack.push(lifted);
          if (reveal && reveal.player !== player) {
            continue;
          }

          moves.push({ origin: 'board', size: top.size, from: { row: r, col: c }, to: { row: tr, col: tc }, player });
        }
      }
    }
  }

  return moves;
}

function applyMoveState(state, move) {
  const s = cloneState(state);

  if (move.origin === 'reserve') {
    const arr = s.reserve[`player${move.player}`];
    const idx = arr.indexOf(move.size);
    if (idx >= 0) {
      arr.splice(idx, 1);
    }
    s.board[move.to.row][move.to.col].push({ player: move.player, size: move.size });
  } else {
    const lifted = s.board[move.from.row][move.from.col].pop();
    s.board[move.to.row][move.to.col].push(lifted);
  }

  s.currentPlayer = move.player === 1 ? 2 : 1;
  return s;
}

function countTwoInARow(state, player) {
  const lines = [
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]]
  ];

  let count = 0;
  for (const [a, b, c] of lines) {
    const tops = [a, b, c].map(([r, col]) => getTopPieceFromCellState(state, r, col));
    const own = tops.filter((p) => p && p.player === player);
    const blocked = tops.some((p) => p && p.player !== player);

    if (own.length === 2 && !blocked) {
      count += 1;
    }
  }

  return count;
}

const LOSS_MEMORY_KEY = 'gobblers_loss_memory';
let lossMemory = {};
let aiMoveHistory = [];

function loadLossMemory() {
  try {
    const raw = localStorage.getItem(LOSS_MEMORY_KEY);
    lossMemory = raw ? JSON.parse(raw) : {};
  } catch (e) {
    lossMemory = {};
  }
}

function boardSignature(state) {
  let sig = `${state.currentPlayer}|`;
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const stack = state.board[r][c];
      sig += stack.length ? stack.map((p) => `${p.player}${p.size}`).join(',') : '-';
      sig += ';';
    }
  }
  sig += `|${(state.reserve.player1 || []).join('')}|${(state.reserve.player2 || []).join('')}`;
  return sig;
}

function getTransformations(board) {
  const boards = [];
  
  function rotate90(grid) {
    const nextGrid = [[], [], []];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        nextGrid[c][2 - r] = grid[r][c];
      }
    }
    return nextGrid;
  }
  
  function reflectH(grid) {
    const nextGrid = [[], [], []];
    for (let r = 0; r < 3; r++) {
      nextGrid[r] = [grid[r][2], grid[r][1], grid[r][0]];
    }
    return nextGrid;
  }

  let current = board;
  const rotations = [];
  for (let i = 0; i < 4; i++) {
    rotations.push(current);
    current = rotate90(current);
  }

  for (const rot of rotations) {
    boards.push(rot);
    boards.push(reflectH(rot));
  }

  return boards;
}

function getSymmetricSignatures(state) {
  const transformations = getTransformations(state.board);
  const signatures = new Set();

  for (const transBoard of transformations) {
    const tempState = {
      currentPlayer: state.currentPlayer,
      board: transBoard,
      reserve: state.reserve
    };
    signatures.add(boardSignature(tempState));
  }

  return Array.from(signatures);
}

function moveScore(move, state, player) {
  let s = 0;
  if (move.to.row === 1 && move.to.col === 1) {
    s += 6;
  }
  if ((move.to.row === 0 || move.to.row === 2) && (move.to.col === 0 || move.to.col === 2)) {
    s += 3;
  }
  s += move.size * 2;
  const target = state.board[move.to.row][move.to.col];
  if (target.length) {
    const top = target[target.length - 1];
    if (top.player !== player) {
      s += top.size * 5;
    }
  }
  return s;
}

function orderMoves(moves, state, player) {
  return moves.sort((a, b) => moveScore(b, state, player) - moveScore(a, state, player));
}

function learnFromResult(winner) {
  if (winner === 1) {
    for (const stateObj of aiMoveHistory) {
      const symSigs = getSymmetricSignatures(stateObj);
      for (const sig of symSigs) {
        lossMemory[sig] = (lossMemory[sig] || 0) + 1;
      }
    }
    const keys = Object.keys(lossMemory);
    if (keys.length > 2000) {
      keys.sort((a, b) => lossMemory[a] - lossMemory[b]);
      for (const k of keys.slice(0, 500)) {
        delete lossMemory[k];
      }
    }
    try {
      localStorage.setItem(LOSS_MEMORY_KEY, JSON.stringify(lossMemory));
    } catch (e) {
      // armazenamento indisponível
    }
  }
  aiMoveHistory = [];
}

loadLossMemory();

function evaluateState(state, aiPlayer) {
  const human = aiPlayer === 1 ? 2 : 1;
  const win = getWinningLineState(state);
  if (win) {
    return win.player === aiPlayer ? 1000000 : -1000000;
  }

  let score = 0;

  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const top = getTopPieceFromCellState(state, r, c);
      if (top) {
        score += (top.player === aiPlayer ? 1 : -1) * top.size * 10;
      }
    }
  }

  score += countTwoInARow(state, aiPlayer) * 60;
  score -= countTwoInARow(state, human) * 60;

  const center = getTopPieceFromCellState(state, 1, 1);
  if (center) {
    score += (center.player === aiPlayer ? 1 : -1) * 25;
  }

  const corners = [[0, 0], [0, 2], [2, 0], [2, 2]];
  for (const [r, c] of corners) {
    const p = getTopPieceFromCellState(state, r, c);
    if (p) {
      score += (p.player === aiPlayer ? 1 : -1) * 8;
    }
  }

  const aiReserve = state.reserve[`player${aiPlayer}`].length;
  const humanReserve = state.reserve[`player${human}`].length;
  score += aiReserve * 2;
  score -= humanReserve * 2;

  // Aprendizado: penaliza posições que historicamente levaram a derrotas
  const penalty = lossMemory[boardSignature(state)] || 0;
  if (penalty) {
    score -= Math.min(penalty, 8) * 25;
  }

  return score;
}

function minimax(state, depth, alpha, beta, maximizing, aiPlayer) {
  const win = getWinningLineState(state);
  if (win) {
    return win.player === aiPlayer ? 100000 + depth : -100000 - depth;
  }
  if (depth === 0) {
    return evaluateState(state, aiPlayer);
  }

  const player = maximizing ? aiPlayer : (aiPlayer === 1 ? 2 : 1);
  const moves = orderMoves(getLegalMoves(state, player), state, player);
  if (!moves.length) {
    return evaluateState(state, aiPlayer);
  }

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      const next = applyMoveState(state, move);
      const value = minimax(next, depth - 1, alpha, beta, false, aiPlayer);
      if (value > best) {
        best = value;
      }
      if (value > alpha) {
        alpha = value;
      }
      if (beta <= alpha) {
        break;
      }
    }
    return best;
  }

  let best = Infinity;
  for (const move of moves) {
    const next = applyMoveState(state, move);
    const value = minimax(next, depth - 1, alpha, beta, true, aiPlayer);
    if (value < best) {
      best = value;
    }
    if (value < beta) {
      beta = value;
    }
    if (beta <= alpha) {
      break;
    }
  }
  return best;
}

function findBestMove(aiPlayer, level) {
  const moves = orderMoves(getLegalMoves(gameState, aiPlayer), gameState, aiPlayer);
  if (!moves.length) {
    return null;
  }

  for (const move of moves) {
    const next = applyMoveState(gameState, move);
    const win = getWinningLineState(next);
    if (win && win.player === aiPlayer) {
      return move;
    }
  }

  if (level === 'easy') {
    const centerMoves = moves.filter((m) => m.to.row === 1 && m.to.col === 1);
    const pool = centerMoves.length ? centerMoves : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const depth = level === 'challenge' ? gameState.engineDepth : (level === 'hard' ? 4 : 2);
  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = applyMoveState(gameState, move);
    let score = minimax(next, depth - 1, -Infinity, Infinity, false, aiPlayer);
    
    // Penalize moves that result in historically losing board layouts
    const penalty = lossMemory[boardSignature(next)] || 0;
    if (penalty) {
      score -= penalty * 5000;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function getCpuDifficulty() {
  if (gameState.gameMode === 'arcade') {
    const level = gameState.arcadeLevel;
    if (level <= 1) {
      return 'easy';
    }
    if (level === 2) {
      return 'medium';
    }
    if (level === 3) {
      return 'hard';
    }
    return 'challenge';
  }
  return gameState.cpuDifficulty;
}

function applyComputerMove(move) {
  if (!move) {
    return;
  }

  if (gameState.gameMode !== 'pvp') {
    const nextState = applyMoveState(gameState, move);
    aiMoveHistory.push(cloneState(nextState));
  }

  if (move.origin === 'reserve') {
    const arr = gameState.reserve[`player${move.player}`];
    const index = arr.indexOf(move.size);
    gameState.selectedPiece = { origin: 'reserve', player: move.player, size: move.size, index };
  } else {
    gameState.selectedPiece = {
      origin: 'board',
      player: move.player,
      size: move.size,
      row: move.from.row,
      col: move.from.col
    };
  }

  attemptMove(move.to.row, move.to.col);
}

if (typeof window !== 'undefined') {
  window.gameState = gameState;
  window.initializeGame = initializeGame;
  window.isValidMove = isValidMove;
  window.getWinningPlayer = getWinningPlayer;
  window.getWinningLine = getWinningLine;
  window.handleReserveSelection = handleReserveSelection;
  window.handleBoardSelection = handleBoardSelection;
  window.attemptMove = attemptMove;
  window.finishMatch = finishMatch;
  window.switchTurn = switchTurn;
  window.findBestMove = findBestMove;
  window.applyComputerMove = applyComputerMove;
  window.getCpuDifficulty = getCpuDifficulty;
}
