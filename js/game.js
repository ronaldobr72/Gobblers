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
  winningLine: []
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
}
