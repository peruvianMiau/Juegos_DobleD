const canvas = document.getElementById('fishingCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const fishCountEl = document.getElementById('fish-count');
const finalScoreEl = document.getElementById('final-score');
const overlayEl = document.getElementById('game-over-overlay');

let puntuacion = 0;
let capturas = 0;
let tiempoRestante = 60;
let juegoTerminado = false;
let temporizadorID;

// Sistema de Audio (Web Audio API)
let audioCtx;
function iniciarAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        reproducirMusicaFondo();
    }
}

// Reproductor de música 8-bit en bucle
function reproducirMusicaFondo() {
    if (juegoTerminado || !audioCtx) return;

    const notas = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // Escala C mayor
    let paso = 0;

    setInterval(() => {
        if (juegoTerminado || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notas[paso % notas.length], audioCtx.currentTime);

        gain.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volumen suave
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);

        paso++;
    }, 300);
}

// Efectos de Sonido
function sonarCaptura(puntos) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (puntos > 0) {
        // Sonido de victoria/puntos
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    } else {
        // Sonido de Pez Globo (pérdida de puntos)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    }

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

// Estado del barco y anzuelo
const bote = { x: 350, y: 60, ancho: 100, alto: 30, velocidad: 5 };
const anzuelo = {
    x: 400,
    y: 100,
    radio: 8,
    velocidadVertical: 4,
    pezEnganchado: null
};

// Control de teclado
const teclas = { Izquierda: false, Derecha: false, Arriba: false, Abajo: false };

// Peces, Burbujas y Partículas
let peces = [];
let burbujas = [];
let particulas = [];

const TIPOS_PECES = [
    { nombre: 'Normal', color: '#ff7b00', puntos: 10, velocidad: 2, tamanio: 16 },
    { nombre: 'Dorado', color: '#ffd700', puntos: 30, velocidad: 3.5, tamanio: 12 },
    { nombre: 'PezGlobo', color: '#e63946', puntos: -15, velocidad: 1.5, tamanio: 20 }
];

// Generar burbujas de fondo
for (let i = 0; i < 20; i++) {
    burbujas.push({
        x: Math.random() * 800,
        y: Math.random() * 500,
        radio: Math.random() * 3 + 1,
        velY: Math.random() + 0.5
    });
}

function crearPez() {
    const tipo = TIPOS_PECES[Math.floor(Math.random() * (Math.random() > 0.8 ? 3 : 2))];
    const izquierda = Math.random() < 0.5;
    peces.push({
        ...tipo,
        x: izquierda ? -30 : canvas.width + 30,
        y: 140 + Math.random() * (canvas.height - 180),
        dir: izquierda ? 1 : -1
    });
}

function crearParticulas(x, y, color) {
    for (let i = 0; i < 10; i++) {
        particulas.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            vida: 1,
            color
        });
    }
}

// Escuchadores de eventos
window.addEventListener('keydown', (e) => {
    iniciarAudio(); // Inicia el audio con la primera tecla presionada
    if (juegoTerminado) return;
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) teclas.Izquierda = true;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) teclas.Derecha = true;
    if (['ArrowUp', 'w', 'W'].includes(e.key)) teclas.Arriba = true;
    if (['ArrowDown', 's', 'S'].includes(e.key)) teclas.Abajo = true;
});

window.addEventListener('keyup', (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) teclas.Izquierda = false;
    if (['ArrowRight', 'd', 'D'].includes(e.key)) teclas.Derecha = false;
    if (['ArrowUp', 'w', 'W'].includes(e.key)) teclas.Arriba = false;
    if (['ArrowDown', 's', 'S'].includes(e.key)) teclas.Abajo = false;
});

function iniciarTemporizador() {
    clearInterval(temporizadorID);
    temporizadorID = setInterval(() => {
        if (tiempoRestante > 0) {
            tiempoRestante--;
            timerEl.innerText = tiempoRestante;
        } else {
            finalizarJuego();
        }
    }, 1000);
}

function finalizarJuego() {
    juegoTerminado = true;
    clearInterval(temporizadorID);
    finalScoreEl.innerText = puntuacion;
    overlayEl.style.display = 'flex';
}

function reiniciarJuego() {
    puntuacion = 0;
    capturas = 0;
    tiempoRestante = 60;
    juegoTerminado = false;
    peces = [];
    particulas = [];
    bote.x = 350;
    anzuelo.x = bote.x + bote.ancho / 2;
    anzuelo.y = 100;
    anzuelo.pezEnganchado = null;

    scoreEl.innerText = '0';
    fishCountEl.innerText = '0';
    timerEl.innerText = '60';
    overlayEl.style.display = 'none';

    iniciarAudio();
    iniciarTemporizador();
}

function actualizarMovimiento() {
    if (teclas.Izquierda && bote.x > 0) {
        bote.x -= bote.velocidad;
        anzuelo.x -= bote.velocidad;
    }
    if (teclas.Derecha && bote.x + bote.ancho < canvas.width) {
        bote.x += bote.velocidad;
        anzuelo.x += bote.velocidad;
    }
    if (teclas.Abajo && anzuelo.y < canvas.height - 20) {
        anzuelo.y += anzuelo.velocidadVertical;
    }
    if (teclas.Arriba && anzuelo.y > 100) {
        anzuelo.y -= anzuelo.velocidadVertical;
    }

    if (anzuelo.y <= 100) {
        anzuelo.y = 100;
        if (anzuelo.pezEnganchado) {
            sonarCaptura(anzuelo.pezEnganchado.puntos);
            crearParticulas(anzuelo.x, anzuelo.y, anzuelo.pezEnganchado.color);

            puntuacion = Math.max(0, puntuacion + anzuelo.pezEnganchado.puntos);
            if (anzuelo.pezEnganchado.puntos > 0) capturas++;
            scoreEl.innerText = puntuacion;
            fishCountEl.innerText = capturas;

            const idx = peces.indexOf(anzuelo.pezEnganchado);
            if (idx !== -1) peces.splice(idx, 1);
            anzuelo.pezEnganchado = null;
        }
    }

    if (anzuelo.pezEnganchado) {
        anzuelo.pezEnganchado.x = anzuelo.x;
        anzuelo.pezEnganchado.y = anzuelo.y + 10;
    }
}

function actualizarEfectos() {
    // Actualizar burbujas
    burbujas.forEach((b) => {
        b.y -= b.velY;
        if (b.y < 90) {
            b.y = canvas.height;
            b.x = Math.random() * canvas.width;
        }
    });

    // Actualizar partículas
    particulas.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vida -= 0.03;
        if (p.vida <= 0) particulas.splice(i, 1);
    });
}

function actualizarPeces() {
    if (Math.random() < 0.03 && peces.length < 8) {
        crearPez();
    }

    peces.forEach((pez, index) => {
        if (pez !== anzuelo.pezEnganchado) {
            pez.x += pez.velocidad * pez.dir;
        }

        if (!anzuelo.pezEnganchado && anzuelo.y > 110) {
            const dist = Math.hypot(anzuelo.x - pez.x, anzuelo.y - pez.y);
            if (dist < pez.tamanio + anzuelo.radio) {
                anzuelo.pezEnganchado = pez;
            }
        }

        if ((pez.dir === 1 && pez.x > canvas.width + 40) || (pez.dir === -1 && pez.x < -40)) {
            if (pez !== anzuelo.pezEnganchado) {
                peces.splice(index, 1);
            }
        }
    });
}

function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo Marino (Degradado)
    const fondoGrad = ctx.createLinearGradient(0, 90, 0, canvas.height);
    fondoGrad.addColorStop(0, '#1e90ff');
    fondoGrad.addColorStop(1, '#000033');
    ctx.fillStyle = fondoGrad;
    ctx.fillRect(0, 90, canvas.width, canvas.height - 90);

    // Cielo/Superficie
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, canvas.width, 90);

    // Dibujar Burbujas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    burbujas.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radio, 0, Math.PI * 2);
        ctx.fill();
    });

    // Bote detallado
    ctx.fillStyle = '#8d5b4c';
    ctx.beginPath();
    ctx.moveTo(bote.x, bote.y);
    ctx.lineTo(bote.x + bote.ancho, bote.y);
    ctx.lineTo(bote.x + bote.ancho - 15, bote.y + bote.alto);
    ctx.lineTo(bote.x + 15, bote.y + bote.alto);
    ctx.closePath();
    ctx.fill();

    // Pescador
    ctx.fillStyle = '#ffd1dc';
    ctx.beginPath();
    ctx.arc(bote.x + 30, bote.y - 10, 8, 0, Math.PI * 2); // Cabeza
    ctx.fill();

    // Caña de pesca
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bote.x + 30, bote.y - 5);
    ctx.lineTo(anzuelo.x, bote.y - 15);
    ctx.stroke();

    // Hilo de Pescar
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(anzuelo.x, bote.y - 15);
    ctx.lineTo(anzuelo.x, anzuelo.y);
    ctx.stroke();

    // Anzuelo brillante
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(anzuelo.x, anzuelo.y, anzuelo.radio, 0, Math.PI);
    ctx.stroke();

    // Peces con detalles
    peces.forEach((pez) => {
        ctx.fillStyle = pez.color;
        ctx.beginPath();
        ctx.ellipse(pez.x, pez.y, pez.tamanio, pez.tamanio / 1.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cola del pez
        ctx.beginPath();
        const colaX = pez.x - (pez.tamanio * pez.dir);
        ctx.moveTo(pez.x, pez.y);
        ctx.lineTo(colaX, pez.y - 8);
        ctx.lineTo(colaX, pez.y + 8);
        ctx.closePath();
        ctx.fill();

        // Ojo del pez
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pez.x + (pez.tamanio / 2 * pez.dir), pez.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(pez.x + (pez.tamanio / 2 * pez.dir), pez.y - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Dibujar Partículas de captura
    particulas.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.vida;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    });
}

function bucleJuego() {
    if (!juegoTerminado) {
        actualizarMovimiento();
        actualizarEfectos();
        actualizarPeces();
        dibujar();
    }
    requestAnimationFrame(bucleJuego);
}

iniciarTemporizador();
bucleJuego();