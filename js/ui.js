const boardElement = document.getElementById('board');
const reservePlayer1 = document.getElementById('reserve-player1');
const reservePlayer2 = document.getElementById('reserve-player2');
const scorePlayer1 = document.getElementById('score-player1');
const scorePlayer2 = document.getElementById('score-player2');
const turnIndicator = document.getElementById('turn-indicator');
const nextMatchButton = document.getElementById('next-match-btn');
const levelIndicator = document.getElementById('level-indicator');
const modeButtons = [...document.querySelectorAll('.mode-btn')];

function getPlayerClassName(player) {
  return player === 1 ? 'one' : 'two';
}

function pieceInnerHTML() {
  return [
    '<span class="piece-hair" aria-hidden="true"></span>',
    '<span class="piece-body" aria-hidden="true"></span>',
    '<span class="piece-top" aria-hidden="true"></span>',
    '<span class="piece-face" aria-hidden="true">',
    '<div class="eyes-container">',
    '<span class="eye eye-left" aria-hidden="true"></span>',
    '<span class="eye eye-right" aria-hidden="true"></span>',
    '</div>',
    '<span class="mouth" aria-hidden="true"></span>',
    '</span>'
  ].join('');
}

function renderBoard() {
  boardElement.innerHTML = '';

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.row = row;
      cell.dataset.col = col;

      const stack = gameState.board[row][col];
      const topPiece = stack[stack.length - 1];

      if (topPiece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = `piece player-${getPlayerClassName(topPiece.player)} size-${topPiece.size}`;
        pieceEl.innerHTML = pieceInnerHTML();
        pieceEl.style.top = '0px';
        pieceEl.style.zIndex = String(stack.length);

        if (gameState.selectedPiece && gameState.selectedPiece.origin === 'board' && gameState.selectedPiece.row === row && gameState.selectedPiece.col === col) {
          pieceEl.classList.add('selected-piece');
        }

        cell.appendChild(pieceEl);
      }

      if (gameState.selectedPiece && gameState.selectedPiece.player === gameState.currentPlayer) {
        const legal = isValidMove({ row, col, size: gameState.selectedPiece.size });
        const isSameSourceCell = gameState.selectedPiece.origin === 'board' && gameState.selectedPiece.row === row && gameState.selectedPiece.col === col;
        if (legal && !isSameSourceCell) {
          cell.classList.add('legal');
        }
      }

      if (gameState.selectedPiece && gameState.selectedPiece.origin === 'board' && isCurrentPlayerHoldingBoardPiece(row, col)) {
        cell.classList.add('selected');
      }

      if (gameState.selectedPiece && gameState.selectedPiece.origin === 'board' && gameState.selectedPiece.row === row && gameState.selectedPiece.col === col) {
        cell.classList.add('selected');
      }

      if (gameState.winningLine.some(([lineRow, lineCol]) => lineRow === row && lineCol === col)) {
        cell.classList.add('win');
      }

      boardElement.appendChild(cell);
    }
  }
}

function renderReserves() {
  reservePlayer1.innerHTML = '';
  reservePlayer2.innerHTML = '';

  ['player1', 'player2'].forEach((playerKey) => {
    const reserveEl = playerKey === 'player1' ? reservePlayer1 : reservePlayer2;
    const playerPieces = gameState.reserve[playerKey];

    playerPieces.forEach((size, index) => {
      const piece = document.createElement('button');
      piece.type = 'button';
      piece.className = `piece player-${getPlayerClassName(Number(playerKey.replace('player', '')))} size-${size}`;
      piece.innerHTML = pieceInnerHTML();
      piece.dataset.player = playerKey;
      piece.dataset.index = index;
      piece.dataset.size = size;

      if (gameState.selectedPiece && gameState.selectedPiece.origin === 'reserve' && gameState.selectedPiece.player === Number(playerKey.replace('player', '')) && gameState.selectedPiece.index === index) {
        piece.classList.add('selected-piece');
      }

      reserveEl.appendChild(piece);
    });
  });
}

function renderScores() {
  scorePlayer1.textContent = gameState.score.player1;
  scorePlayer2.textContent = gameState.score.player2;
}

function renderTurn() {
  if (gameState.winner) {
    if (gameState.gameMode === 'pvp') {
      turnIndicator.textContent = `Player ${gameState.winner} wins!`;
    } else {
      turnIndicator.textContent = gameState.winner === 1 ? 'You win! 🎉' : 'Computer wins!';
    }
    nextMatchButton.hidden = false;
    return;
  }

  nextMatchButton.hidden = true;
  if (gameState.gameMode === 'pvp') {
    turnIndicator.textContent = `Player ${gameState.currentPlayer} turn`;
  } else if (gameState.currentPlayer === 1) {
    turnIndicator.textContent = 'Your turn';
  } else {
    turnIndicator.textContent = 'Computer thinking...';
  }
}

function renderLevel() {
  if (gameState.gameMode === 'arcade') {
    levelIndicator.hidden = false;
    levelIndicator.textContent = `Level ${gameState.arcadeLevel}`;
  } else {
    levelIndicator.hidden = true;
  }
}

function render() {
  renderBoard();
  renderReserves();
  renderScores();
  renderTurn();
  renderLevel();
}

nextMatchButton.addEventListener('click', () => {
  resetMatch();
  render();
});

boardElement.addEventListener('click', (event) => {
  const cell = event.target.closest('.cell');
  if (!cell) {
    return;
  }

  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);

  if (gameState.selectedPiece) {
    const canMove = isValidMove({ row, col, size: gameState.selectedPiece.size });
    const isSameSourceCell = gameState.selectedPiece.origin === 'board' && gameState.selectedPiece.row === row && gameState.selectedPiece.col === col;

    if (canMove && !isSameSourceCell) {
      attemptMove(row, col);
      afterMove();
      return;
    }

    if (isSameSourceCell) {
      gameState.selectedPiece = null;
      render();
      return;
    }

    if (gameState.selectedPiece.origin !== 'board') {
      gameState.selectedPiece = null;
      render();
      return;
    }
  }

  if (isCurrentPlayerHoldingBoardPiece(row, col)) {
    handleBoardSelection(row, col);
    render();
    return;
  }

  handleBoardSelection(row, col);
  render();
});

['player1', 'player2'].forEach((playerKey) => {
  const reserveEl = playerKey === 'player1' ? reservePlayer1 : reservePlayer2;
  reserveEl.addEventListener('click', (event) => {
    const piece = event.target.closest('.piece');
    if (!piece) {
      return;
    }

    const player = Number(playerKey.replace('player', ''));
    const index = Number(piece.dataset.index);

    if (gameState.currentPlayer !== player) {
      return;
    }

    handleReserveSelection(player, index);
    render();
  });
});

function resetMatch() {
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

function afterMove() {
  if (gameState.winner && gameState.gameMode === 'arcade') {
    if (gameState.winner === 1) {
      gameState.arcadeLevel += 1;
    } else {
      gameState.arcadeLevel = 1;
    }
  }

  render();

  if (!gameState.winner && gameState.gameMode !== 'pvp' && gameState.currentPlayer === 2) {
    setTimeout(() => {
      const move = findBestMove(2, getCpuDifficulty());
      applyComputerMove(move);
      render();
    }, 450);
  }
}

function setMode(mode) {
  modeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  gameState.gameMode = 'pvp';
  gameState.cpuDifficulty = 'easy';
  gameState.arcadeLevel = 1;

  if (mode === 'cpu-easy') {
    gameState.gameMode = 'cpu';
    gameState.cpuDifficulty = 'easy';
  } else if (mode === 'cpu-medium') {
    gameState.gameMode = 'cpu';
    gameState.cpuDifficulty = 'medium';
  } else if (mode === 'cpu-hard') {
    gameState.gameMode = 'cpu';
    gameState.cpuDifficulty = 'hard';
  } else if (mode === 'cpu-impossible') {
    gameState.gameMode = 'cpu';
    gameState.cpuDifficulty = 'impossible';
  } else if (mode === 'arcade') {
    gameState.gameMode = 'arcade';
    gameState.arcadeLevel = 1;
  }

  initializeGame();
  render();
}

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
  });
});

initializeGame();
render();
