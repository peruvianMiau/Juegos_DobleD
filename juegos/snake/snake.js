const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');
const gameOverOverlay = document.getElementById('game-over-overlay');

const GRID_SIZE = 20;
const TILE_SIZE = 20;

let snake = [{ x: 10, y: 10 }];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 15, y: 15 };
let score = 0;
let highScore = localStorage.getItem('snake_highscore') || 0;
let gameInterval;

highScoreEl.innerText = highScore;

function generarComida() {
    food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
    };
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        generarComida();
    }
}

function actualizar() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    // Colisión con paredes o consigo misma
    if (
        head.x < 0 || head.x >= GRID_SIZE ||
        head.y < 0 || head.y >= GRID_SIZE ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)
    ) {
        finalizarJuego();
        return;
    }

    snake.unshift(head);

    // Comer comida
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.innerText = score;
        generarComida();
    } else {
        snake.pop();
    }

    dibujar();
}

function dibujar() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Comida
    ctx.fillStyle = '#f85149';
    ctx.fillRect(food.x * TILE_SIZE, food.y * TILE_SIZE, TILE_SIZE - 2, TILE_SIZE - 2);

    // Serpiente
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? '#58a6ff' : '#3fb950';
        ctx.fillRect(segment.x * TILE_SIZE, segment.y * TILE_SIZE, TILE_SIZE - 2, TILE_SIZE - 2);
    });
}

function finalizarJuego() {
    clearInterval(gameInterval);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snake_highscore', highScore);
        highScoreEl.innerText = highScore;
    }
    finalScoreEl.innerText = score;
    gameOverOverlay.classList.remove('hidden');
}

function reiniciarJuego() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    scoreEl.innerText = score;
    gameOverOverlay.classList.add('hidden');
    generarComida();
    clearInterval(gameInterval);
    gameInterval = setInterval(actualizar, 100);
}

window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) nextDirection = { x: 0, y: -1 }; break;
        case 'ArrowDown': if (direction.y === 0) nextDirection = { x: 0, y: 1 }; break;
        case 'ArrowLeft': if (direction.x === 0) nextDirection = { x: -1, y: 0 }; break;
        case 'ArrowRight': if (direction.x === 0) nextDirection = { x: 1, y: 0 }; break;
    }
});

reiniciarJuego();