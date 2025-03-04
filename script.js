const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

// Ajusta o tamanho do canvas para se adequar à tela do dispositivo
function resizeCanvas() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const size = Math.min(screenWidth, screenHeight) * 0.9;
    canvas.width = size;
    canvas.height = size * 2;
    gridCell = size / 10;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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
let score = 0;
let level = 1;
let linesCleared = 0;

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(board, { x: 0, y: 0 });
    drawMatrix(currentPiece.matrix, { x: currentPiece.x, y: currentPiece.y });
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = getColor(value, matrix);
                context.fillRect((x + offset.x) * gridCell, (y + offset.y) * gridCell, gridCell, gridCell);
                context.strokeStyle = '#000';
                context.strokeRect((x + offset.x) * gridCell, (y + offset.y) * gridCell, gridCell, gridCell);
            }
        });
    });
}

function getColor(value, matrix) {
    if (matrix === currentPiece.matrix) {
        return currentPiece.color;
    }
    const colors = [null, '#00f0f0', '#0000f0', '#f0a000', '#f0f000', '#00f000', '#a000f0', '#f00000'];
    return colors[value];
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
        document.getElementById('score').innerText = score;
        document.getElementById('level').innerText = level;
        document.getElementById('lines').innerText = linesCleared;
    }
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
            currentPiece = createPiece();
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

// Controles de toque
let touchStartX, touchStartY;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
});

canvas.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy)) {
        // Movimento horizontal
        if (dx > 0) {
            movePiece(1, 0);
        } else {
            movePiece(-1, 0);
        }
    } else {
        // Movimento vertical
        if (dy > 0) {
            while (movePiece(0, 1)) {}
        } else {
            rotatePiece();
        }
    }
});

// Controles de teclado
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
    highScores.push({score: score, date: new Date().toLocaleString()});
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
    const finalScoreSpan = document.getElementById('finalScore');
    const restartButton = document.getElementById('restartButton');
    finalScoreSpan.textContent = score;
    modal.style.display = 'block';
    restartButton.onclick = function() {
        modal.style.display = 'none';
        board = createMatrix(gridWidth, gridHeight);
        score = 0;
        level = 1;
        linesCleared = 0;
        currentPiece = createPiece();
        dropCounter = 0;
        lastTime = 0;
        document.getElementById('score').innerText = score;
        document.getElementById('level').innerText = level;
        document.getElementById('lines').innerText = linesCleared;
        update();
    };
}

document.getElementById('startButton').addEventListener('click', () => {
    board = createMatrix(gridWidth, gridHeight);
    score = 0;
    level = 1;
    linesCleared = 0;
    currentPiece = createPiece();
    dropCounter = 0;
    lastTime = 0;
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
    document.getElementById('lines').innerText = linesCleared;
    updateHighScoresTable();
    update();
});

updateHighScoresTable();
