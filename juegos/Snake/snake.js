// Snake Arcade - Edición Visual Neón Deluxe con Partículas, Ojos Animados y Sonido

const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const finalScoreEl = document.getElementById('final-score');
const gameOverOverlay = document.getElementById('game-over-overlay');

const GRID_SIZE = 20;
const TILE_SIZE = 20; // 400x400 canvas = 20x20 tiles

let snake = [{ x: 10, y: 10 }];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = { x: 15, y: 15 };
let score = 0;
let highScore = parseInt(localStorage.getItem('snake_highscore')) || 0;
let gameInterval = null;
let animFrameId = null;
let juegoPausado = false;

// Sistema de Partículas y Textos Flotantes
let particulas = [];
let textosFlotantes = [];

// Audio con Web Audio API
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function reproducirSonidoComer() {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {}
}

function reproducirSonidoGameOver() {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        [220, 196, 174, 130].forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + idx * 0.1);
            osc.stop(audioCtx.currentTime + idx * 0.1 + 0.2);
        });
    } catch (e) {}
}

if (highScoreEl) highScoreEl.innerText = highScore;

function generarComida() {
    food = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
    };
    if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        generarComida();
    }
}

function crearExplosionComida(x, y) {
    const centroX = x * TILE_SIZE + TILE_SIZE / 2;
    const centroY = y * TILE_SIZE + TILE_SIZE / 2;
    
    // Crear chispas de colores neón
    for (let i = 0; i < 16; i++) {
        const angulo = (Math.PI * 2 * i) / 16 + (Math.random() * 0.2);
        const velocidad = 1.5 + Math.random() * 2.5;
        particulas.push({
            x: centroX,
            y: centroY,
            vx: Math.cos(angulo) * velocidad,
            vy: Math.sin(angulo) * velocidad,
            vida: 1.0,
            color: Math.random() > 0.5 ? '#10b981' : (Math.random() > 0.5 ? '#38bdf8' : '#f59e0b'),
            radio: 2 + Math.random() * 2
        });
    }

    // Texto flotante +10
    textosFlotantes.push({
        x: centroX,
        y: centroY - 5,
        texto: '+10',
        vida: 1.0
    });
}

function actualizar() {
    if (juegoPausado) return;

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
        if (scoreEl) scoreEl.innerText = score;
        reproducirSonidoComer();
        crearExplosionComida(food.x, food.y);
        generarComida();
    } else {
        snake.pop();
    }
}

// Bucle de animación suave (60 FPS) para partículas, brillo y comida
function bucleRender() {
    dibujar();
    animFrameId = requestAnimationFrame(bucleRender);
}

function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo Cyberpunk con rejilla sutil
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rejilla de puntos sutiles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = 0; x < canvas.width; x += TILE_SIZE) {
        for (let y = 0; y < canvas.height; y += TILE_SIZE) {
            ctx.fillRect(x + 9, y + 9, 2, 2);
        }
    }

    // Dibujar Comida (Manzana Neón Pulsante)
    const pulso = Math.sin(Date.now() / 150) * 1.5;
    const comidaX = food.x * TILE_SIZE + TILE_SIZE / 2;
    const comidaY = food.y * TILE_SIZE + TILE_SIZE / 2;
    const radioComida = 7 + pulso;

    // Halo brillante exterior
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(comidaX, comidaY + 1, radioComida, 0, Math.PI * 2);
    ctx.fill();

    // Brillo interior
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(comidaX - 2, comidaY - 1, radioComida * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Pequeña hoja verde en la manzana
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(comidaX + 2, comidaY - 8, 3, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Dibujar Cuerpo de la Serpiente
    snake.forEach((segment, index) => {
        const segX = segment.x * TILE_SIZE;
        const segY = segment.y * TILE_SIZE;
        const margen = 1.5;
        const w = TILE_SIZE - margen * 2;
        const h = TILE_SIZE - margen * 2;
        const radioBorde = index === 0 ? 8 : 5;

        ctx.save();
        if (index === 0) {
            // Cabeza Neón Cian/Esmeralda
            ctx.shadowBlur = 14;
            ctx.shadowColor = '#06b6d4';
            const gradHead = ctx.createLinearGradient(segX, segY, segX + w, segY + h);
            gradHead.addColorStop(0, '#38bdf8');
            gradHead.addColorStop(1, '#10b981');
            ctx.fillStyle = gradHead;

            dibujarRectanguloRedondeado(ctx, segX + margen, segY + margen, w, h, radioBorde);
            ctx.fill();

            // Ojos de la serpiente orientados a la dirección de movimiento
            ctx.shadowBlur = 0;
            const centroX = segX + TILE_SIZE / 2;
            const centroY = segY + TILE_SIZE / 2;

            let ojo1X, ojo1Y, ojo2X, ojo2Y;
            const separacion = 5;
            const adelante = 3;

            if (direction.x === 1) { // Derecha
                ojo1X = centroX + adelante; ojo1Y = centroY - separacion;
                ojo2X = centroX + adelante; ojo2Y = centroY + separacion;
            } else if (direction.x === -1) { // Izquierda
                ojo1X = centroX - adelante; ojo1Y = centroY - separacion;
                ojo2X = centroX - adelante; ojo2Y = centroY + separacion;
            } else if (direction.y === -1) { // Arriba
                ojo1X = centroX - separacion; ojo1Y = centroY - adelante;
                ojo2X = centroX + separacion; ojo2Y = centroY - adelante;
            } else { // Abajo
                ojo1X = centroX - separacion; ojo1Y = centroY + adelante;
                ojo2X = centroX + separacion; ojo2Y = centroY + adelante;
            }

            // Ojos blancos
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ojo1X, ojo1Y, 2.8, 0, Math.PI * 2);
            ctx.arc(ojo2X, ojo2Y, 2.8, 0, Math.PI * 2);
            ctx.fill();

            // Pupilas negras
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(ojo1X + direction.x * 0.8, ojo1Y + direction.y * 0.8, 1.4, 0, Math.PI * 2);
            ctx.arc(ojo2X + direction.x * 0.8, ojo2Y + direction.y * 0.8, 1.4, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // Segmentos del cuerpo con gradiente según la distancia a la cabeza
            const factor = Math.max(0.3, 1 - (index / (snake.length + 5)));
            ctx.fillStyle = `rgb(${Math.round(16 * factor)}, ${Math.round(185 * factor)}, ${Math.round(129 * factor)})`;
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';

            dibujarRectanguloRedondeado(ctx, segX + margen, segY + margen, w, h, radioBorde);
            ctx.fill();

            // Reflejo central elegante
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.beginPath();
            ctx.arc(segX + TILE_SIZE / 2, segY + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    });

    // Actualizar y dibujar partículas
    for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.vida -= 0.035;

        if (p.vida <= 0) {
            particulas.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.vida;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Actualizar y dibujar textos flotantes (+10)
    for (let i = textosFlotantes.length - 1; i >= 0; i--) {
        const tf = textosFlotantes[i];
        tf.y -= 0.75;
        tf.vida -= 0.03;

        if (tf.vida <= 0) {
            textosFlotantes.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = tf.vida;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#fef08a';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.fillText(tf.texto, tf.x, tf.y);
        ctx.restore();
    }
}

function dibujarRectanguloRedondeado(c, x, y, width, height, radius) {
    c.beginPath();
    c.moveTo(x + radius, y);
    c.lineTo(x + width - radius, y);
    c.quadraticCurveTo(x + width, y, x + width, y + radius);
    c.lineTo(x + width, y + height - radius);
    c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    c.lineTo(x + radius, y + height);
    c.quadraticCurveTo(x, y + height, x, y + height - radius);
    c.lineTo(x, y + radius);
    c.quadraticCurveTo(x, y, x + radius, y);
    c.closePath();
}

function finalizarJuego() {
    clearInterval(gameInterval);
    gameInterval = null;
    reproducirSonidoGameOver();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snake_highscore', highScore);
        if (highScoreEl) highScoreEl.innerText = highScore;
    }
    if (finalScoreEl) finalScoreEl.innerText = score;
    if (gameOverOverlay) gameOverOverlay.classList.remove('hidden');
}

function reiniciarJuego() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    if (scoreEl) scoreEl.innerText = score;
    particulas = [];
    textosFlotantes = [];
    if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
    generarComida();

    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(actualizar, 135);

    if (!animFrameId) {
        bucleRender();
    }
}

// Controles WASD y Flechas con prevención de scroll
window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    switch (key) {
        case 'arrowup':
        case 'w':
            if (direction.y === 0) {
                nextDirection = { x: 0, y: -1 };
                e.preventDefault();
            }
            break;
        case 'arrowdown':
        case 's':
            if (direction.y === 0) {
                nextDirection = { x: 0, y: 1 };
                e.preventDefault();
            }
            break;
        case 'arrowleft':
        case 'a':
            if (direction.x === 0) {
                nextDirection = { x: -1, y: 0 };
                e.preventDefault();
            }
            break;
        case 'arrowright':
        case 'd':
            if (direction.x === 0) {
                nextDirection = { x: 1, y: 0 };
                e.preventDefault();
            }
            break;
        case ' ':
        case 'p':
            // Pausa rápida
            if (gameInterval) {
                juegoPausado = !juegoPausado;
                e.preventDefault();
            }
            break;
    }
});

reiniciarJuego();