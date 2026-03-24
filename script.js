const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const difficultySelect = document.getElementById('difficulty');
const orientationSelect = document.getElementById('orientation');
const newGameBtn = document.getElementById('new-game-btn');
const undoBtn = document.getElementById('undo-btn');

// Game State
let game = new Chess();
let boardState = [];
let draggedPiece = null;
let sourceSquare = null;
let playerColor = 'white';
let aiColor = 'black';
let gameActive = true;

// Piece Assets (Wikimedia Commons)
const pieces = {
    'w': {
        'p': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
        'n': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
        'b': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
        'r': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
        'q': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
        'k': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg'
    },
    'b': {
        'p': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
        'n': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
        'b': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
        'r': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
        'q': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
        'k': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
    }
};

// Evaluation Tables (Simplified)
const pst = {
    p: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5, 5, 10, 25, 25, 10, 5, 5],
        [0, 0, 0, 20, 20, 0, 0, 0],
        [5, -5, -10, 0, 0, -10, -5, 5],
        [5, 10, 10, -20, -20, 10, 10, 5],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    n: [
        [-50, -40, -30, -30, -30, -30, -40, -50],
        [-40, -20, 0, 0, 0, 0, -20, -40],
        [-30, 0, 10, 15, 15, 10, 0, -30],
        [-30, 5, 15, 20, 20, 15, 5, -30],
        [-30, 0, 15, 20, 20, 15, 0, -30],
        [-30, 5, 10, 15, 15, 10, 5, -30],
        [-40, -20, 0, 5, 5, 0, -20, -40],
        [-50, -40, -30, -30, -30, -30, -40, -50]
    ],
    b: [
        [-20, -10, -10, -10, -10, -10, -10, -20],
        [-10, 0, 0, 0, 0, 0, 0, -10],
        [-10, 0, 5, 10, 10, 5, 0, -10],
        [-10, 5, 5, 10, 10, 5, 5, -10],
        [-10, 0, 10, 10, 10, 10, 0, -10],
        [-10, 10, 10, 10, 10, 10, 10, -10],
        [-10, 5, 0, 0, 0, 0, 5, -10],
        [-20, -10, -10, -10, -10, -10, -10, -20]
    ],
    r: [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [5, 10, 10, 10, 10, 10, 10, 5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [-5, 0, 0, 0, 0, 0, 0, -5],
        [0, 0, 0, 5, 5, 0, 0, 0]
    ],
    q: [
        [-20, -10, -10, -5, -5, -10, -10, -20],
        [-10, 0, 0, 0, 0, 0, 0, -10],
        [-10, 0, 5, 5, 5, 5, 0, -10],
        [-5, 0, 5, 5, 5, 5, 0, -5],
        [0, 0, 5, 5, 5, 5, 0, -5],
        [-10, 5, 5, 5, 5, 5, 0, -10],
        [-10, 0, 5, 0, 0, 0, 0, -10],
        [-20, -10, -10, -5, -5, -10, -10, -20]
    ],
    k: [
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-30, -40, -40, -50, -50, -40, -40, -30],
        [-20, -30, -30, -40, -40, -30, -30, -20],
        [-10, -20, -20, -20, -20, -20, -20, -10],
        [20, 20, 0, 0, 0, 0, 20, 20],
        [20, 30, 10, 0, 0, 10, 30, 20]
    ]
};

// --- Initialization ---
function initGame() {
    game = new Chess();
    playerColor = orientationSelect.value;
    aiColor = playerColor === 'white' ? 'black' : 'white';
    gameActive = true;
    renderBoard();
    updateStatus();

    if (aiColor === 'white') {
        setTimeout(makeAIMove, 500);
    }
}

// --- Board Rendering ---
function renderBoard() {
    boardElement.innerHTML = '';
    const board = game.board();

    // Determine orientation
    const isWhite = playerColor === 'white';

    for (let i = 0; i < 64; i++) {
        const row = isWhite ? Math.floor(i / 8) : 7 - Math.floor(i / 8);
        const col = isWhite ? i % 8 : 7 - (i % 8);

        const square = document.createElement('div');
        const squareName = String.fromCharCode(97 + col) + (8 - row);

        square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
        square.dataset.square = squareName;

        // Highlight last move
        const history = game.history({ verbose: true });
        if (history.length > 0) {
            const lastMove = history[history.length - 1];
            if (squareName === lastMove.from || squareName === lastMove.to) {
                square.classList.add('last-move');
            }
        }

        // Check highlight
        if (game.in_check()) {
            const king = board[row][col];
            if (king && king.type === 'k' && king.color === game.turn()) {
                square.classList.add('check');
            }
        }

        const piece = board[row][col];
        if (piece) {
            const pieceEl = document.createElement('div');
            pieceEl.className = 'piece';
            pieceEl.style.backgroundImage = `url(${pieces[piece.color][piece.type]})`;
            pieceEl.draggable = true;

            // Only allow dragging own pieces
            if (gameActive && piece.color === playerColor.charAt(0)) {
                pieceEl.addEventListener('dragstart', handleDragStart);
                pieceEl.addEventListener('dragend', handleDragEnd);
            } else {
                pieceEl.draggable = false;
                pieceEl.style.cursor = 'default';
            }

            square.appendChild(pieceEl);
        }

        square.addEventListener('dragover', handleDragOver);
        square.addEventListener('drop', handleDrop);
        square.addEventListener('click', handleSquareClick); // For click-to-move fallback

        boardElement.appendChild(square);
    }
}

// --- Interaction Handlers ---
function handleDragStart(e) {
    if (!gameActive) return;
    draggedPiece = e.target;
    sourceSquare = draggedPiece.parentElement.dataset.square;
    e.dataTransfer.setData('text/plain', sourceSquare);
    setTimeout(() => draggedPiece.classList.add('dragging'), 0);

    // Show hints
    showHints(sourceSquare);
}

function handleDragEnd(e) {
    if (draggedPiece) draggedPiece.classList.remove('dragging');
    draggedPiece = null;
    sourceSquare = null;
    removeHints();
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const targetSquare = e.target.closest('.square').dataset.square;
    const from = e.dataTransfer.getData('text/plain');

    attemptMove(from, targetSquare);
}

// Click fallback
let selectedSquare = null;
function handleSquareClick(e) {
    if (!gameActive) return;
    const squareDiv = e.target.closest('.square');
    const squareName = squareDiv.dataset.square;
    const piece = game.get(squareName);

    if (selectedSquare) {
        // Try to move
        const move = attemptMove(selectedSquare, squareName);
        if (!move) {
            // If invalid move, but clicked on own piece, select that instead
            if (piece && piece.color === playerColor.charAt(0)) {
                removeHints();
                selectedSquare = squareName;
                squareDiv.classList.add('highlight');
                showHints(squareName);
            } else {
                removeHints();
                selectedSquare = null;
            }
        } else {
            selectedSquare = null;
        }
    } else {
        if (piece && piece.color === playerColor.charAt(0)) {
            selectedSquare = squareName;
            squareDiv.classList.add('highlight');
            showHints(squareName);
        }
    }
}

function showHints(square) {
    const moves = game.moves({ square: square, verbose: true });
    moves.forEach(move => {
        const el = document.querySelector(`[data-square="${move.to}"]`);
        if (el) {
            const hint = document.createElement('div');
            hint.className = 'hint';
            el.appendChild(hint);
        }
    });
}

function removeHints() {
    document.querySelectorAll('.hint').forEach(el => el.remove());
    document.querySelectorAll('.square.highlight').forEach(el => el.classList.remove('highlight'));
}

function attemptMove(from, to) {
    const move = game.move({
        from: from,
        to: to,
        promotion: 'q' // Always promote to queen for simplicity
    });

    if (move) {
        renderBoard();
        updateStatus();
        checkGameOver();
        if (gameActive) {
            setTimeout(makeAIMove, 250);
        }
        return true;
    }
    return false;
}

function updateStatus() {
    let status = '';
    let moveColor = game.turn() === 'b' ? 'Black' : 'White';

    if (game.in_checkmate()) {
        status = `Game over, ${moveColor} is in checkmate.`;
        gameActive = false;
    } else if (game.in_draw()) {
        status = 'Game over, drawn position';
        gameActive = false;
    } else {
        status = `${moveColor} to move`;
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check';
        }
    }
    statusElement.innerText = status;
}

function checkGameOver() {
    if (game.game_over()) {
        gameActive = false;
    }
}

// --- AI Logic ---

function makeAIMove() {
    if (!gameActive) return;

    const difficulty = parseInt(difficultySelect.value);

    // Update status to show thinking
    statusElement.innerText = "AI is thinking...";

    // Use setTimeout to allow UI to update before heavy calculation
    setTimeout(() => {
        let move;
        if (difficulty === 0) {
            // Easy: Random
            const moves = game.moves();
            move = moves[Math.floor(Math.random() * moves.length)];
            game.move(move);
        } else {
            // Medium/Hard: Minimax
            const depth = difficulty === 1 ? 2 : 3;
            const isMaximizing = aiColor === 'white';
            const bestMove = minimaxRoot(depth, game, isMaximizing);
            game.move(bestMove);
        }

        renderBoard();
        updateStatus();
        checkGameOver();
    }, 50);
}

function evaluateBoard(board) {
    let totalEvaluation = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            totalEvaluation = totalEvaluation + getPieceValue(board[i][j], i, j);
        }
    }
    return totalEvaluation;
}

function getPieceValue(piece, x, y) {
    if (piece === null) {
        return 0;
    }

    const getAbsoluteValue = function (piece, isWhite, x, y) {
        let value = 0;
        let tableX = x;
        let tableY = y;

        if (!isWhite) {
            tableX = 7 - x;
        }

        switch (piece.type) {
            case 'p': value = 10 + (pst.p[tableX][tableY]); break;
            case 'r': value = 50 + (pst.r[tableX][tableY]); break;
            case 'n': value = 30 + (pst.n[tableX][tableY]); break;
            case 'b': value = 30 + (pst.b[tableX][tableY]); break;
            case 'q': value = 90 + (pst.q[tableX][tableY]); break;
            case 'k': value = 900 + (pst.k[tableX][tableY]); break;
        }
        return value;
    };

    const absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x, y);
    return piece.color === 'w' ? absoluteValue : -absoluteValue;
}

function minimaxRoot(depth, game, isMaximisingPlayer) {
    const newGameMoves = game.moves();
    let bestMove = isMaximisingPlayer ? -9999 : 9999;
    let bestMoveFound;

    for (let i = 0; i < newGameMoves.length; i++) {
        const newGameMove = newGameMoves[i];
        game.move(newGameMove);
        const value = minimax(depth - 1, game, -10000, 10000, !isMaximisingPlayer);
        game.undo();

        if (isMaximisingPlayer) {
            if (value >= bestMove) {
                bestMove = value;
                bestMoveFound = newGameMove;
            }
        } else {
            if (value <= bestMove) {
                bestMove = value;
                bestMoveFound = newGameMove;
            }
        }
    }
    return bestMoveFound;
}

function minimax(depth, game, alpha, beta, isMaximisingPlayer) {
    if (depth === 0) {
        return evaluateBoard(game.board());
    }

    const newGameMoves = game.moves();

    if (isMaximisingPlayer) {
        let bestMove = -9999;
        for (let i = 0; i < newGameMoves.length; i++) {
            game.move(newGameMoves[i]);
            bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    } else {
        let bestMove = 9999;
        for (let i = 0; i < newGameMoves.length; i++) {
            game.move(newGameMoves[i]);
            bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) {
                return bestMove;
            }
        }
        return bestMove;
    }
}

// --- Event Listeners ---
newGameBtn.addEventListener('click', initGame);
undoBtn.addEventListener('click', () => {
    game.undo(); // Undo AI
    game.undo(); // Undo Player
    renderBoard();
    updateStatus();
    gameActive = true;
});

difficultySelect.addEventListener('change', () => {
    // Optional: Restart game or just change difficulty for next move
});

orientationSelect.addEventListener('change', initGame);

// Start
initGame();
