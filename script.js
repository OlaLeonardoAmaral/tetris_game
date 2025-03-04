const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('next-piece-canvas');
const nextPieceContext = nextPieceCanvas.getContext('2d');

const gridCell = 30;
const gridWidth = 10;
const gridHeight = 20;

function createMatrix(w, h) {
    const matrix = [];
    for (let i = 0; i < h; i++) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

let board = createMatrix(gridWidth, gridHeight);

const tetrominoes = {
    'I': {
        shape: [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        color: '#00f0f0'
    },
    'J': {
        shape: [
            [2, 0, 0],
            [2, 2, 2],
            [0, 0, 0]
        ],
        color: '#0000f0'
    },
    'L': {
        shape: [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0]
        ],
        color: '#f0a000'
    },
    'O': {
        shape: [
            [4, 4],
            [4, 4]
        ],
        color: '#f0f000'
    },
    'S': {
        shape: [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0]
        ],
        color: '#00f000'
    },
    'T': {
        shape: [
            [0, 6, 0],
            [6, 6, 6],
            [0, 0, 0]
        ],
        color: '#a000f0'
    },
    'Z': {
        shape: [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ],
        color: '#f00000'
    }
};

function createPiece() {
    const tetrominoKeys = Object.keys(tetrominoes);
    const randKey = tetrominoKeys[Math.floor(Math.random() * tetrominoKeys.length)];
    const piece = {
        matrix: tetrominoes[randKey].shape.map(row => row.slice()),
        color: tetrominoes[randKey].color,
        x: Math.floor((gridWidth - tetrominoes[randKey].shape[0].length) / 2),
        y: 0
    };
    return piece;
}

let currentPiece = createPiece();
let nextPiece = createPiece();
let score = 0;
let level = 1;
let linesCleared = 0;

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, { x: 0, y: 0 }, context);
    
    // Desenhar a sombra (ghost piece)
    const ghostPiece = getGhostPiece(currentPiece);
    drawMatrix(ghostPiece.matrix, { x: ghostPiece.x, y: ghostPiece.y }, context, true);
    
    // Desenhar a peça atual por cima da sombra
    drawMatrix(currentPiece.matrix, { x: currentPiece.x, y: currentPiece.y }, context);
    drawNextPiece();
  }
  

  function drawMatrix(matrix, offset, ctx, isGhost = false) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          if (isGhost) {
            ctx.globalAlpha = 0.3;  // Define opacidade reduzida para o ghost piece
          } else {
            ctx.globalAlpha = 1;
          }
          ctx.fillStyle = getColor(value, matrix);
          ctx.fillRect((x + offset.x) * gridCell, (y + offset.y) * gridCell, gridCell, gridCell);
          
          // Resetar opacidade para o contorno
          ctx.globalAlpha = 1;
          ctx.strokeStyle = '#000';
          ctx.strokeRect((x + offset.x) * gridCell, (y + offset.y) * gridCell, gridCell, gridCell);
        }
      });
    });
  }
  

function drawNextPiece() {
    nextPieceContext.fillStyle = '#000';
    nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    const offset = {
        x: (nextPieceCanvas.width / gridCell - nextPiece.matrix[0].length) / 2,
        y: (nextPieceCanvas.height / gridCell - nextPiece.matrix.length) / 2
    };
    drawMatrix(nextPiece.matrix, offset, nextPieceContext);
}

function getColor(value, matrix) {
    if (matrix === currentPiece.matrix) {
        return currentPiece.color;
    }
    if (matrix === nextPiece.matrix) {
        return nextPiece.color;
    }
    const colors = [null, '#00f0f0', '#0000f0', '#f0a000', '#f0f000', '#00f000', '#a000f0', '#f00000'];
    return colors[value];
}

function getGhostPiece(piece) {
    // Clona a peça atual para calcular a posição final sem afetar o estado original
    let ghost = {
      matrix: piece.matrix.map(row => row.slice()),
      color: piece.color,
      x: piece.x,
      y: piece.y
    };
    // Move a peça para baixo até que colida com o tabuleiro
    while (!collide(board, ghost)) {
      ghost.y++;
    }
    ghost.y--; // Retrocede uma linha após a colisão
    return ghost;
  }
  

function movePiece(offsetX, offsetY) {
    currentPiece.x += offsetX;
    currentPiece.y += offsetY;
    if (collide(board, currentPiece)) {
        currentPiece.x -= offsetX;
        currentPiece.y -= offsetY;
        return false;
    }
    return true;
}

function collide(board, piece) {
    const m = piece.matrix;
    const o = piece;
    for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
            if (m[y][x] !== 0) {
                if (!board[y + o.y] || board[y + o.y][x + o.x] !== 0) {
                    return true;
                }
            }
        }
    }
    return false;
}

function merge(board, piece) {
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + piece.y][x + piece.x] = value;
            }
        });
    });
}

function rotate(matrix) {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < y; x++) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    matrix.forEach(row => row.reverse());
}

function rotatePiece() {
    const pos = currentPiece.x;
    rotate(currentPiece.matrix);
    let offset = 1;
    while (collide(board, currentPiece)) {
        currentPiece.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > currentPiece.matrix[0].length) {
            rotate(currentPiece.matrix);
            rotate(currentPiece.matrix);
            rotate(currentPiece.matrix);
            currentPiece.x = pos;
            return;
        }
    }
}

function sweep() {
    let rowCount = 0;
    outer: for (let y = board.length - 1; y >= 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }
        const row = board.splice(y, 1)[0].fill(0);
        board.unshift(row);
        y++;
        rowCount++;
    }

    if (rowCount > 0) {
        score += rowCount * 10;
        linesCleared += rowCount;
        if (linesCleared >= level * 10) {
            level++;
        }
    }

    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
    document.getElementById('lines').innerText = linesCleared;
}

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    let currentDropInterval = dropInterval - ((level - 1) * 100);
    if (currentDropInterval < 100) currentDropInterval = 100;
    if (dropCounter > currentDropInterval) {
        if (!movePiece(0, 1)) {
            merge(board, currentPiece);
            sweep();
            currentPiece = nextPiece;
            nextPiece = createPiece();
            if (collide(board, currentPiece)) {
                gameOver();
                return;
            }
        }
        dropCounter = 0;
    }

    draw();
    requestAnimationFrame(update);
}

document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        movePiece(-1, 0);
    } else if (event.key === 'ArrowRight') {
        movePiece(1, 0);
    } else if (event.key === 'ArrowDown') {
        movePiece(0, 1);
    } else if (event.key === 'ArrowUp') {
        rotatePiece();
    } else if (event.key === ' ') {
        while (movePiece(0, 1)) {}
        dropCounter = dropInterval;
    }
});

function saveScore() {
    let highScores = JSON.parse(localStorage.getItem('tetrisHighScores')) || [];
    const currentDate = new Date().toISOString().split('T')[0];
    highScores.push({score: score, date: currentDate});
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('tetrisHighScores', JSON.stringify(highScores));
    updateHighScoresTable();
}

function updateHighScoresTable() {
    const highScores = JSON.parse(localStorage.getItem('tetrisHighScores')) || [];
    const tableBody = document.getElementById('high-scores-body');
    tableBody.innerHTML = '';
    highScores.forEach((score, index) => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = index + 1;
        row.insertCell(1).textContent = score.score;
        row.insertCell(2).textContent = score.date;
    });
}

function gameOver() {
    saveScore();
    const modal = document.getElementById('gameOverModal');
    const finalScoreElement = document.getElementById('finalScore');
    finalScoreElement.textContent = score;
    modal.style.display = 'block';
}

document.getElementById('playAgainButton').addEventListener('click', () => {
    const modal = document.getElementById('gameOverModal');
    modal.style.display = 'none';
    resetGame();
});

function resetGame() {
    board = createMatrix(gridWidth, gridHeight);
    score = 0;
    level = 1;
    linesCleared = 0;
    currentPiece = createPiece();
    nextPiece = createPiece();
    dropCounter = 0;
    lastTime = 0;
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
    document.getElementById('lines').innerText = linesCleared;
    update();
}

document.getElementById('startButton').addEventListener('click', () => {
    resetGame();
});

updateHighScoresTable();
