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
let particulas = [];
let animacionesLineas = []; // Guarda las filas en proceso de eliminación

// VARIABLES DE VELOCIDAD DINÁMICA
let intervaloCaidaOriginal = 1000;
let intervaloCaida = 1000;
let velocidadMinima = 120; // Tope máximo de velocidad (en ms) para no ser abusivo
let contadorCaida = 0;
let ultimoTiempo = 0;

// SISTEMA DE AUDIO
let audioCtx;
let musicaTimeout;

const MUSICA = {
    volumen: 0.08,
    velocidad: 0.9,
    instrumento: 'square'
};

const melodia = [
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

function iniciarAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (!musicaTimeout) {
        reproducirMusicaFondo();
    }
}

function reproducirMusicaFondo() {
    if (juegoTerminado || !audioCtx) return;
    let paso = 0;

    function tocarSiguiente() {
        if (juegoTerminado || !audioCtx) return;
        const nota = melodia[paso % melodia.length];
        const duracion = nota.d / MUSICA.velocidad;

        if (nota.f > 0) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = MUSICA.instrumento;
            osc.frequency.setValueAtTime(nota.f, audioCtx.currentTime);
            gain.gain.setValueAtTime(MUSICA.volumen, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duracion);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duracion);
        }
        paso++;
        musicaTimeout = setTimeout(tocarSiguiente, duracion * 1000);
    }
    tocarSiguiente();
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
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    } else if (tipo === 'rotar') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    } else if (tipo === 'linea') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    } else if (tipo === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, audioCtx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    }

    osc.start();
    osc.stop(audioCtx.currentTime + (tipo === 'gameover' ? 0.6 : 0.25));
}

// LÓGICA DE JUEGO
function crearMatriz(w, h) {
    const matriz = [];
    while (h--) { matriz.push(new Array(w).fill(0)); }
    return matriz;
}

function crearPieza(tipo) {
    if (tipo === 'I') return [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]];
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

function crearParticulasFila(y) {
    for (let x = 0; x < 12; x++) {
        for (let k = 0; k < 3; k++) {
            particulas.push({
                x: x + Math.random(),
                y: y + Math.random(),
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.8) * 0.15,
                vida: 1.0,
                color: '#00b4d8'
            });
        }
    }
}

function barridoTablero() {
    let contadorFilas = 1;
    let lineasLimpiadas = false;

    outer: for (let y = tablero.length - 1; y > 0; --y) {
        for (let x = 0; x < tablero[y].length; ++x) {
            if (tablero[y][x] === 0) continue outer;
        }

        // Efecto visual de desvanecimiento y partículas
        animacionesLineas.push({ y: y, opacidad: 1.0 });
        crearParticulasFila(y);

        const fila = tablero.splice(y, 1)[0].fill(0);
        tablero.unshift(fila);
        ++y;
        jugador.puntuacion += contadorFilas * 100;
        contadorFilas *= 2;
        lineasLimpiadas = true;
    }

    if (lineasLimpiadas) {
        sonarEfecto('linea');
        actualizarVelocidad();
    }
    scoreElement.innerText = jugador.puntuacion;
}

// LÓGICA DE VELOCIDAD PROGRESIVA CON TOPE
function actualizarVelocidad() {
    // Reduce 30ms por cada 200 puntos conseguidos
    const reduccion = Math.floor(jugador.puntuacion / 200) * 30;
    intervaloCaida = Math.max(velocidadMinima, intervaloCaidaOriginal - reduccion);
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
        gameOverElement.classList.add('active');
    }
}

function reiniciarJuego() {
    tablero.forEach(fila => fila.fill(0));
    jugador.puntuacion = 0;
    scoreElement.innerText = '0';
    juegoTerminado = false;

    // Resetear velocidad al valor original
    intervaloCaida = intervaloCaidaOriginal;
    contadorCaida = 0;

    gameOverElement.classList.remove('active');
    jugador.siguiente = null;
    particulas = [];
    animacionesLineas = [];
    reiniciarJugador();

    if (musicaTimeout) {
        clearTimeout(musicaTimeout);
        musicaTimeout = null;
    }
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

// OBTENER POSICIÓN DE LA PROYECCIÓN DE LA PIEZA (GHOST PIECE)
function obtenerPosicionProyeccion() {
    const fantasma = {
        pos: { x: jugador.pos.x, y: jugador.pos.y },
        matriz: jugador.matriz
    };
    while (!colision(tablero, fantasma)) {
        fantasma.pos.y++;
    }
    fantasma.pos.y--;
    return fantasma.pos;
}

function dibujarMatriz(matriz, offset, ctx = context, esFantasma = false) {
    matriz.forEach((fila, y) => {
        fila.forEach((valor, x) => {
            if (valor !== 0) {
                if (esFantasma) {
                    // Renderizado translúcido para el indicador visual
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.lineWidth = 0.05;
                    ctx.strokeRect(x + offset.x + 0.02, y + offset.y + 0.02, 0.96, 0.96);
                } else {
                    ctx.fillStyle = COLORES[valor];
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 1);

                    // Brillo superior e izquierdo
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.fillRect(x + offset.x, y + offset.y, 1, 0.08);
                    ctx.fillRect(x + offset.x, y + offset.y, 0.08, 1);

                    // Sombra inferior y derecha
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
                    ctx.fillRect(x + offset.x, y + offset.y + 0.92, 1, 0.08);
                    ctx.fillRect(x + offset.x + 0.92, y + offset.y, 0.08, 1);
                }
            }
        });
    });
}

function dibujarSiguiente() {
    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextContext.fillStyle = '#0a111e';
    nextContext.fillRect(0, 0, 4, 4);

    if (jugador.siguiente) {
        const m = jugador.siguiente;
        const offsetX = (4 - m[0].length) / 2;
        const offsetY = (4 - m.length) / 2;
        dibujarMatriz(m, {x: offsetX, y: offsetY}, nextContext);
    }
}

function actualizarParticulasYEfectos() {
    for (let i = animacionesLineas.length - 1; i >= 0; i--) {
        const anim = animacionesLineas[i];
        context.fillStyle = `rgba(255, 255, 255, ${anim.opacidad})`;
        context.fillRect(0, anim.y, 12, 1);
        anim.opacidad -= 0.1;
        if (anim.opacidad <= 0) {
            animacionesLineas.splice(i, 1);
        }
    }

    for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vida -= 0.04;

        if (p.vida <= 0) {
            particulas.splice(i, 1);
        } else {
            context.fillStyle = p.color;
            context.globalAlpha = p.vida;
            context.fillRect(p.x, p.y, 0.15, 0.15);
            context.globalAlpha = 1.0;
        }
    }
}

function dibujar() {
    context.fillStyle = '#0a111e';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Cuadrícula sutil
    context.strokeStyle = 'rgba(0, 180, 216, 0.06)';
    context.lineWidth = 0.02;
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

    // Indicador visual de caída (Ghost Piece)
    if (jugador.matriz && !juegoTerminado) {
        const posFantasma = obtenerPosicionProyeccion();
        dibujarMatriz(jugador.matriz, posFantasma, context, true);
        dibujarMatriz(jugador.matriz, jugador.pos);
    }

    actualizarParticulasYEfectos();
}

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