// 2048 Clásico - Lógica de Matriz 4x4, Deslizamiento, Fusión y Puntuación

let grid = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
];

let score = 0;
let bestScore = parseInt(localStorage.getItem('2048_highscore')) || 0;
let ganoPartida = false;
let continuarTrasVictoria = false;
let juegoTerminado = false;

// Audio con Web Audio API
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playAudio(type) {
    try {
        if (!audioCtx) audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'move') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'merge') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(587.33, now + 0.04);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'win') {
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.frequency.setValueAtTime(f, now + i * 0.09);
                g.gain.setValueAtTime(0.1, now + i * 0.09);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.2);
                o.start(now + i * 0.09);
                o.stop(now + i * 0.09 + 0.2);
            });
        }
    } catch (e) {}
}

function inicializarTablero() {
    grid = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
    score = 0;
    ganoPartida = false;
    continuarTrasVictoria = false;
    juegoTerminado = false;

    document.getElementById('score-val').innerText = score;
    document.getElementById('best-val').innerText = bestScore;
    document.getElementById('game-modal').classList.add('hidden');

    generarFichaAleatoria(true);
    generarFichaAleatoria(true);
    renderizar();
}

function reiniciarPartida() {
    inicializarTablero();
}

// Genera un 2 (90%) o un 4 (10%) en una celda vacía
function generarFichaAleatoria(esInicial = false) {
    let celdasVacias = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) celdasVacias.push({ r, c });
        }
    }

    if (celdasVacias.length === 0) return null;

    const elegida = celdasVacias[Math.floor(Math.random() * celdasVacias.length)];
    const valor = Math.random() < 0.9 ? 2 : 4;
    grid[elegida.r][elegida.c] = valor;
    return elegida;
}

// Renderizado gráfico de las fichas dentro de la cuadrícula
function renderizar(fichaNueva = null, celdasFusionadas = []) {
    const container = document.getElementById('tile-container');
    container.innerHTML = '';

    const rect = container.getBoundingClientRect();
    const padding = 12; // padding del contenedor
    const gap = rect.width > 320 ? 14 : 10;
    const tileSize = (rect.width - padding * 2 - gap * 3) / 4;

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const val = grid[r][c];
            if (val > 0) {
                const tile = document.createElement('div');
                const esNueva = fichaNueva && fichaNueva.r === r && fichaNueva.c === c;
                const esFusionada = celdasFusionadas.some(cf => cf.r === r && cf.c === c);

                let colorClass = `tile-${val}`;
                if (val > 2048) colorClass = 'tile-super';

                tile.className = `tile ${colorClass} ${esNueva ? 'tile-new' : ''} ${esFusionada ? 'tile-merged' : ''}`;
                tile.style.width = `${tileSize}px`;
                tile.style.height = `${tileSize}px`;
                tile.style.left = `${padding + c * (tileSize + gap)}px`;
                tile.style.top = `${padding + r * (tileSize + gap)}px`;
                tile.innerText = val;

                container.appendChild(tile);
            }
        }
    }
}

// Lógica de Deslizamiento y Fusión
function deslizarLinea(linea) {
    let filtrada = linea.filter(x => x !== 0);
    let puntosGanados = 0;
    let fusionadas = [];

    for (let i = 0; i < filtrada.length - 1; i++) {
        if (filtrada[i] === filtrada[i + 1]) {
            filtrada[i] *= 2;
            puntosGanados += filtrada[i];
            fusionadas.push(i);
            filtrada.splice(i + 1, 1);
        }
    }

    while (filtrada.length < 4) {
        filtrada.push(0);
    }

    return { nuevaLinea: filtrada, puntos: puntosGanados, fusionadas };
}

function mover(direccion) {
    if (juegoTerminado) return;

    let movimientoValido = false;
    let puntosTotales = 0;
    let huboFusion = false;
    let celdasFusionadas = [];

    let copiaPrevia = JSON.stringify(grid);

    if (direccion === 'LEFT') {
        for (let r = 0; r < 4; r++) {
            const res = deslizarLinea(grid[r]);
            grid[r] = res.nuevaLinea;
            puntosTotales += res.puntos;
            if (res.puntos > 0) huboFusion = true;
            res.fusionadas.forEach(c => celdasFusionadas.push({ r, c }));
        }
    } else if (direccion === 'RIGHT') {
        for (let r = 0; r < 4; r++) {
            const invertida = [...grid[r]].reverse();
            const res = deslizarLinea(invertida);
            grid[r] = res.nuevaLinea.reverse();
            puntosTotales += res.puntos;
            if (res.puntos > 0) huboFusion = true;
            res.fusionadas.forEach(idx => celdasFusionadas.push({ r, c: 3 - idx }));
        }
    } else if (direccion === 'UP') {
        for (let c = 0; c < 4; c++) {
            let col = [grid[0][c], grid[1][c], grid[2][c], grid[3][c]];
            const res = deslizarLinea(col);
            for (let r = 0; r < 4; r++) grid[r][c] = res.nuevaLinea[r];
            puntosTotales += res.puntos;
            if (res.puntos > 0) huboFusion = true;
            res.fusionadas.forEach(r => celdasFusionadas.push({ r, c }));
        }
    } else if (direccion === 'DOWN') {
        for (let c = 0; c < 4; c++) {
            let col = [grid[3][c], grid[2][c], grid[1][c], grid[0][c]];
            const res = deslizarLinea(col);
            for (let r = 0; r < 4; r++) grid[3 - r][c] = res.nuevaLinea[r];
            puntosTotales += res.puntos;
            if (res.puntos > 0) huboFusion = true;
            res.fusionadas.forEach(idx => celdasFusionadas.push({ r: 3 - idx, c }));
        }
    }

    if (JSON.stringify(grid) !== copiaPrevia) {
        movimientoValido = true;
    }

    if (movimientoValido) {
        // Actualizar puntuación
        score += puntosTotales;
        document.getElementById('score-val').innerText = score;
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('2048_highscore', bestScore);
            document.getElementById('best-val').innerText = bestScore;
        }

        // Sonido
        if (huboFusion) playAudio('merge');
        else playAudio('move');

        // Generar nueva ficha
        const nuevaFicha = generarFichaAleatoria();
        renderizar(nuevaFicha, celdasFusionadas);

        // Verificar victoria (2048)
        if (!ganoPartida && !continuarTrasVictoria && hayFicha2048()) {
            ganoPartida = true;
            playAudio('win');
            mostrarModal(true);
            return;
        }

        // Verificar Game Over
        if (estaBloqueado()) {
            juegoTerminado = true;
            mostrarModal(false);
        }
    }
}

function hayFicha2048() {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 2048) return true;
        }
    }
    return false;
}

function estaBloqueado() {
    // ¿Hay celdas vacías?
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (grid[r][c] === 0) return false;
        }
    }

    // ¿Hay fusiones posibles horizontales o verticales?
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const v = grid[r][c];
            if (r < 3 && grid[r + 1][c] === v) return false;
            if (c < 3 && grid[r][c + 1] === v) return false;
        }
    }

    return true;
}

function mostrarModal(victoria) {
    const modal = document.getElementById('game-modal');
    const title = document.getElementById('modal-title');
    const msg = document.getElementById('modal-msg');
    const btnKeep = document.getElementById('btn-keep-playing');

    modal.classList.remove('hidden');

    if (victoria) {
        title.innerText = "¡ALCANZASTE EL 2048! 🏆";
        title.className = "text-3xl font-black text-yellow-400";
        msg.innerText = `¡Felicidades! Has unido las fichas hasta formar el 2048 con ${score} puntos.`;
        btnKeep.classList.remove('hidden');
    } else {
        title.innerText = "¡SIN MOVIMIENTOS! 💀";
        title.className = "text-3xl font-black text-rose-500";
        msg.innerText = `No quedan casillas vacías ni combinaciones posibles. Tu puntuación final es ${score}.`;
        btnKeep.classList.add('hidden');
    }
}

function continuarJugando() {
    continuarTrasVictoria = true;
    document.getElementById('game-modal').classList.add('hidden');
}

// Controles de Teclado
window.addEventListener('keydown', (e) => {
    const keys = {
        ArrowUp: 'UP',
        KeyW: 'UP',
        ArrowDown: 'DOWN',
        KeyS: 'DOWN',
        ArrowLeft: 'LEFT',
        KeyA: 'LEFT',
        ArrowRight: 'RIGHT',
        KeyD: 'RIGHT'
    };

    if (keys[e.code]) {
        e.preventDefault();
        mover(keys[e.code]);
    }
});

// Soporte de Gestos Táctiles (Swipe)
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
}, { passive: true });

window.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (Math.max(absX, absY) > 30) {
            if (absX > absY) {
                mover(deltaX > 0 ? 'RIGHT' : 'LEFT');
            } else {
                mover(deltaY > 0 ? 'DOWN' : 'UP');
            }
        }
    }
}, { passive: true });

window.addEventListener('resize', () => renderizar());

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    inicializarTablero();
});
