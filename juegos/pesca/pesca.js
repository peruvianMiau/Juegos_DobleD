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

// Estado del anzuelo
const anzuelo = {
    x: 400,
    y: 100,
    radio: 8,
    velY: 0,
    bajando: false,
    recomponiendo: false,
    pezEnganchado: null
};

// Bote y Pescador
const bote = { x: 350, y: 70, ancho: 100, alto: 30 };

// Lista de peces en movimiento
let peces = [];
const TIPOS_PECES = [
    { nombre: 'Normal', color: '#ff7b00', puntos: 10, velocidad: 2, tamaño: 16 },
    { nombre: 'Dorado', color: '#ffd700', puntos: 30, velocidad: 3.5, tamaño: 12 },
    { nombre: 'PezGlobo', color: '#e63946', puntos: -15, velocidad: 1.5, tamaño: 20 }
];

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

// Eventos de ratón
let presionado = false;

canvas.addEventListener('mousedown', (e) => {
    if (juegoTerminado) return;
    presionado = true;
    if (!anzuelo.bajando && anzuelo.y <= 100) {
        anzuelo.bajando = true;
    }
});

canvas.addEventListener('mouseup', () => { presionado = false; });

function iniciarTemporizador() {
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
    anzuelo.y = 100;
    anzuelo.pezEnganchado = null;
    anzuelo.bajando = false;

    scoreEl.innerText = '0';
    fishCountEl.innerText = '0';
    timerEl.innerText = '60';
    overlayEl.style.display = 'none';

    iniciarTemporizador();
}

function actualizarAnzuelo() {
    // Si presiona el clic, sube el anzuelo rápidamente
    if (presionado || anzuelo.pezEnganchado) {
        anzuelo.y -= 4;
        anzuelo.bajando = false;
    } else if (anzuelo.bajando) {
        anzuelo.y += 3;
        if (anzuelo.y >= canvas.height - 20) {
            anzuelo.bajando = false;
        }
    } else if (anzuelo.y > 100) {
        anzuelo.y -= 2; // Sube lentamente si no se presiona nada
    }

    if (anzuelo.y <= 100) {
        anzuelo.y = 100;
        // Si llegó arriba con pez, procesar captura
        if (anzuelo.pezEnganchado) {
            puntuacion = Math.max(0, puntuacion + anzuelo.pezEnganchado.puntos);
            if (anzuelo.pezEnganchado.puntos > 0) capturas++;
            scoreEl.innerText = puntuacion;
            fishCountEl.innerText = capturas;
            anzuelo.pezEnganchado = null;
        }
    }

    if (anzuelo.pezEnganchado) {
        anzuelo.pezEnganchado.x = anzuelo.x;
        anzuelo.pezEnganchado.y = anzuelo.y + 10;
    }
}

function actualizarPeces() {
    if (Math.random() < 0.03 && peces.length < 8) {
        crearPez();
    }

    peces.forEach((pez, index) => {
        if (pez !== anzuelo.pezEnganchado) {
            pez.x += pez.velocidad * pez.dir;
        }

        // Colisión con anzuelo
        if (!anzuelo.pezEnganchado && anzuelo.y > 110) {
            const dist = Math.hypot(anzuelo.x - pez.x, anzuelo.y - pez.y);
            if (dist < pez.tamaño + anzuelo.radio) {
                anzuelo.pezEnganchado = pez;
            }
        }

        // Eliminar peces fuera de pantalla
        if ((pez.dir === 1 && pez.x > canvas.width + 40) || (pez.dir === -1 && pez.x < -40)) {
            if (pez !== anzuelo.pezEnganchado) {
                peces.splice(index, 1);
            }
        }
    });
}

function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Agua Superficie
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(0, 0, canvas.width, 90);

    // Bote
    ctx.fillStyle = '#8d5b4c';
    ctx.beginPath();
    ctx.moveTo(bote.x, bote.y);
    ctx.lineTo(bote.x + bote.ancho, bote.y);
    ctx.lineTo(bote.x + bote.ancho - 15, bote.y + bote.alto);
    ctx.lineTo(bote.x + 15, bote.y + bote.alto);
    ctx.closePath();
    ctx.fill();

    // Línea de pesca
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(anzuelo.x, bote.y);
    ctx.lineTo(anzuelo.x, anzuelo.y);
    ctx.stroke();

    // Anzuelo
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(anzuelo.x, anzuelo.y, anzuelo.radio, 0, Math.PI);
    ctx.stroke();

    // Dibujar Peces
    peces.forEach((pez) => {
        ctx.fillStyle = pez.color;
        ctx.beginPath();
        ctx.ellipse(pez.x, pez.y, pez.tamaño, pez.tamaño / 1.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cola del pez
        ctx.beginPath();
        const colaX = pez.x - (pez.tamaño * pez.dir);
        ctx.moveTo(pez.x, pez.y);
        ctx.lineTo(colaX, pez.y - 8);
        ctx.lineTo(colaX, pez.y + 8);
        ctx.closePath();
        ctx.fill();
    });
}

function bucleJuego() {
    if (!juegoTerminado) {
        actualizarAnzuelo();
        actualizarPeces();
        dibujar();
    }
    requestAnimationFrame(bucleJuego);
}

iniciarTemporizador();
bucleJuego();