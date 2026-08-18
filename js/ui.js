const boardElement = document.getElementById('board');
const reservePlayer1 = document.getElementById('reserve-player1');
const reservePlayer2 = document.getElementById('reserve-player2');
const scorePlayer1 = document.getElementById('score-player1');
const scorePlayer2 = document.getElementById('score-player2');
const turnIndicator = document.getElementById('turn-indicator');
const nextMatchButton = document.getElementById('next-match-btn');

function getPlayerClassName(player) {
  return player === 1 ? 'one' : 'two';
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
        pieceEl.textContent = topPiece.size;
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
      piece.textContent = size;
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
    turnIndicator.textContent = `Player ${gameState.winner} wins!`;
    nextMatchButton.hidden = false;
    return;
  }

  nextMatchButton.hidden = true;
  turnIndicator.textContent = `Player ${gameState.currentPlayer} turn`;
}

function render() {
  renderBoard();
  renderReserves();
  renderScores();
  renderTurn();
}

nextMatchButton.addEventListener('click', () => {
  initializeGame();
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
      render();
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

initializeGame();
render();
