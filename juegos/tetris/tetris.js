const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const nextCanvas = document.getElementById('next');
const nextContext = nextCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');

context.scale(30, 30);
nextContext.scale(30, 30);

const PIEZAS = 'ILJOTSZ';
const COLORES = [
    null, '#00f0f0', '#0000f0', '#f0a000', '#f0f000', '#00f000', '#a000f0', '#f00000'
];

let juegoTerminado = false;
let audioCtx;
let musicaInterval;

// --- SISTEMA DE AUDIO (Web Audio API - Tema Original Korobeiniki Mejorado) ---
function iniciarAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        reproducirMusicaFondo();
    }
}

function reproducirMusicaFondo() {
    if (juegoTerminado || !audioCtx) return;

    // Partitura clásica completa del Tema A de Tetris
    const melodia = [
        // Parte A
        { f: 659.25, d: 0.25 }, { f: 493.88, d: 0.125 }, { f: 523.25, d: 0.125 }, { f: 587.33, d: 0.25 },
        { f: 523.25, d: 0.125 }, { f: 493.88, d: 0.125 }, { f: 440.00, d: 0.25 }, { f: 440.00, d: 0.125 },
        { f: 523.25, d: 0.125 }, { f: 659.25, d: 0.25 }, { f: 587.33, d: 0.125 }, { f: 523.25, d: 0.125 },
        { f: 493.88, d: 0.375 }, { f: 523.25, d: 0.125 }, { f: 587.33, d: 0.25 }, { f: 659.25, d: 0.25 },
        { f: 523.25, d: 0.25 }, { f: 440.00, d: 0.25 }, { f: 440.00, d: 0.25 }, { f: 0, d: 0.125 },

        { f: 587.33, d: 0.375 }, { f: 698.46, d: 0.125 }, { f: 880.00, d: 0.25 }, { f: 783.99, d: 0.125 },
        { f: 698.46, d: 0.125 }, { f: 659.25, d: 0.375 }, { f: 523.25, d: 0.125 }, { f: 659.25, d: 0.25 },
        { f: 587.33, d: 0.125 }, { f: 523.25, d: 0.125 }, { f: 493.88, d: 0.25 }, { f: 493.88, d: 0.125 },
        { f: 523.25, d: 0.125 }, { f: 587.33, d: 0.25 }, { f: 659.25, d: 0.25 }, { f: 523.25, d: 0.25 },
        { f: 440.00, d: 0.25 }, { f: 440.00, d: 0.25 }, { f: 0, d: 0.125 }
    ];

    let paso = 0;

    clearInterval(musicaInterval);
    musicaInterval = setInterval(() => {
        if (juegoTerminado || !audioCtx) return;

        const nota = melodia[paso % melodia.length];
        if (nota.f > 0) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(nota.f, audioCtx.currentTime);

            // VOLUMEN DE MÚSICA SUBIDO (de 0.025 a 0.08)
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + nota.d);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start();
            osc.stop(audioCtx.currentTime + nota.d);
        }

        paso++;
    }, 180); // Ligeramente más rápido para dar dinamismo
}

function sonarEfecto(tipo) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (tipo === 'mover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime); // Volumen subido
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    } else if (tipo === 'rotar') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volumen subido
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    } else if (tipo === 'linea') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime); // Volumen subido
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    } else if (tipo === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime); // Volumen subido
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    }

    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
}

// --- LÓGICA DEL JUEGO ---
function crearMatriz(w, h) {
    const matriz = [];
    while (h--) { matriz.push(new Array(w).fill(0)); }
    return matriz;
}

function crearPieza(tipo) {
    if (tipo === 'I') return [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]];
    if (tipo === 'L') return [[0,2,0],[0,2,0],[0,2,2]];
    if (tipo === 'J') return [[0,3,0],[0,3,0],[3,3,0]];
    if (tipo === 'O') return [[4,4],[4,4]];
    if (tipo === 'T') return [[0,5,0],[5,5,5],[0,0,0]];
    if (tipo === 'S') return [[0,6,6],[6,6,0],[0,0,0]];
    if (tipo === 'Z') return [[7,7,0],[0,7,7],[0,0,0]];
}

const tablero = crearMatriz(12, 20);

const jugador = {
    pos: {x: 0, y: 0},
    matriz: null,
    siguiente: null,
    puntuacion: 0,
};

function colision(tablero, jugador) {
    const m = jugador.matriz;
    const o = jugador.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (tablero[y + o.y] && tablero[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function combinar(tablero, jugador) {
    jugador.matriz.forEach((fila, y) => {
        fila.forEach((valor, x) => {
            if (valor !== 0) { tablero[y + jugador.pos.y][x + jugador.pos.x] = valor; }
        });
    });
}

function rotar(matriz, dir) {
    for (let y = 0; y < matriz.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matriz[x][y], matriz[y][x]] = [matriz[y][x], matriz[x][y]];
        }
    }
    if (dir > 0) matriz.forEach(fila => fila.reverse());
    else matriz.reverse();
}

function barridoTablero() {
    let contadorFilas = 1;
    let lineasLimpiadas = false;

    outer: for (let y = tablero.length - 1; y > 0; --y) {
        for (let x = 0; x < tablero[y].length; ++x) {
            if (tablero[y][x] === 0) continue outer;
        }
        const fila = tablero.splice(y, 1)[0].fill(0);
        tablero.unshift(fila);
        ++y;
        jugador.puntuacion += contadorFilas * 100;
        contadorFilas *= 2;
        lineasLimpiadas = true;
    }

    if (lineasLimpiadas) {
        sonarEfecto('linea');
    }
    scoreElement.innerText = jugador.puntuacion;
}

function caidaJugador() {
    jugador.pos.y++;
    if (colision(tablero, jugador)) {
        jugador.pos.y--;
        combinar(tablero, jugador);
        reiniciarJugador();
        barridoTablero();
    }
    contadorCaida = 0;
}

function caidaRapida() {
    while (!colision(tablero, jugador)) {
        jugador.pos.y++;
    }
    jugador.pos.y--;
    combinar(tablero, jugador);
    reiniciarJugador();
    barridoTablero();
}

function moverJugador(offset) {
    jugador.pos.x += offset;
    if (colision(tablero, jugador)) {
        jugador.pos.x -= offset;
    } else {
        sonarEfecto('mover');
    }
}

function reiniciarJugador() {
    if (!jugador.siguiente) {
        jugador.siguiente = crearPieza(PIEZAS[PIEZAS.length * Math.random() | 0]);
    }
    jugador.matriz = jugador.siguiente;
    jugador.siguiente = crearPieza(PIEZAS[PIEZAS.length * Math.random() | 0]);

    jugador.pos.y = 0;
    jugador.pos.x = (tablero[0].length / 2 | 0) - (jugador.matriz[0].length / 2 | 0);

    dibujarSiguiente();

    if (colision(tablero, jugador)) {
        juegoTerminado = true;
        sonarEfecto('gameover');
        gameOverElement.style.display = 'block';
    }
}

function reiniciarJuego() {
    tablero.forEach(fila => fila.fill(0));
    jugador.puntuacion = 0;
    scoreElement.innerText = '0';
    juegoTerminado = false;
    gameOverElement.style.display = 'none';
    jugador.siguiente = null;
    reiniciarJugador();
    reproducirMusicaFondo();
}

function rotarJugador(dir) {
    const pos = jugador.pos.x;
    let offset = 1;
    rotar(jugador.matriz, dir);
    while (colision(tablero, jugador)) {
        jugador.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > jugador.matriz[0].length) {
            rotar(jugador.matriz, -dir);
            jugador.pos.x = pos;
            return;
        }
    }
    sonarEfecto('rotar');
}

function dibujarMatriz(matriz, offset, ctx = context) {
    matriz.forEach((fila, y) => {
        fila.forEach((valor, x) => {
            if (valor !== 0) {
                ctx.fillStyle = COLORES[valor];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.fillRect(x + offset.x, y + offset.y, 1, 0.08);
                ctx.fillRect(x + offset.x, y + offset.y, 0.08, 1);

                ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                ctx.fillRect(x + offset.x, y + offset.y + 0.92, 1, 0.08);
                ctx.fillRect(x + offset.x + 0.92, y + offset.y, 0.08, 1);
            }
        });
    });
}

function dibujarSiguiente() {
    nextContext.fillStyle = '#0d1b2a';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (jugador.siguiente) {
        dibujarMatriz(jugador.siguiente, {x: 0.5, y: 0.5}, nextContext);
    }
}

function dibujar() {
    context.fillStyle = '#0d1b2a';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    context.lineWidth = 0.04;
    for (let x = 0; x < 12; x++) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, 20);
        context.stroke();
    }
    for (let y = 0; y < 20; y++) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(12, y);
        context.stroke();
    }

    dibujarMatriz(tablero, {x: 0, y: 0});
    if (jugador.matriz) {
        dibujarMatriz(jugador.matriz, jugador.pos);
    }
}

let contadorCaida = 0;
let intervaloCaida = 1000;
let ultimoTiempo = 0;

function actualizar(tiempo = 0) {
    const deltaTime = tiempo - ultimoTiempo;
    ultimoTiempo = tiempo;

    if (!juegoTerminado) {
        contadorCaida += deltaTime;
        if (contadorCaida > intervaloCaida) { caidaJugador(); }
    }

    dibujar();
    requestAnimationFrame(actualizar);
}

document.addEventListener('keydown', event => {
    iniciarAudio();
    if (juegoTerminado) return;

    const key = event.key.toLowerCase();

    if (key === 'arrowleft' || key === 'a') moverJugador(-1);
    else if (key === 'arrowright' || key === 'd') moverJugador(1);
    else if (key === 'arrowdown' || key === 's') caidaJugador();
    else if (key === 'arrowup' || key === 'w') rotarJugador(1);
    else if (key === ' ') caidaRapida();
});

reiniciarJugador();
actualizar();