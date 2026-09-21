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

// Estado del barco y anzuelo
const bote = { x: 350, y: 60, ancho: 100, alto: 30, velocidad: 5 };
const anzuelo = {
    x: 400,
    y: 100,
    radio: 8,
    velocidadVertical: 4,
    pezEnganchado: null
};

// Control de teclas presionadas
const teclas = {
    Izquierda: false,
    Derecha: false,
    Arriba: false,
    Abajo: false
};

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

// Escuchadores de eventos para el teclado
window.addEventListener('keydown', (e) => {
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
    bote.x = 350;
    anzuelo.x = bote.x + bote.ancho / 2;
    anzuelo.y = 100;
    anzuelo.pezEnganchado = null;

    scoreEl.innerText = '0';
    fishCountEl.innerText = '0';
    timerEl.innerText = '60';
    overlayEl.style.display = 'none';

    iniciarTemporizador();
}

function actualizarMovimiento() {
    // Movimiento Horizontal (Bote + Anzuelo)
    if (teclas.Izquierda && bote.x > 0) {
        bote.x -= bote.velocidad;
        anzuelo.x -= bote.velocidad;
    }
    if (teclas.Derecha && bote.x + bote.ancho < canvas.width) {
        bote.x += bote.velocidad;
        anzuelo.x += bote.velocidad;
    }

    // Movimiento Vertical (Anzuelo)
    if (teclas.Abajo && anzuelo.y < canvas.height - 20) {
        anzuelo.y += anzuelo.velocidadVertical;
    }
    if (teclas.Arriba && anzuelo.y > 100) {
        anzuelo.y -= anzuelo.velocidadVertical;
    }

    // Procesar captura cuando el anzuelo sube a la superficie
    if (anzuelo.y <= 100) {
        anzuelo.y = 100;
        if (anzuelo.pezEnganchado) {
            puntuacion = Math.max(0, puntuacion + anzuelo.pezEnganchado.puntos);
            if (anzuelo.pezEnganchado.puntos > 0) capturas++;
            scoreEl.innerText = puntuacion;
            fishCountEl.innerText = capturas;

            // Eliminar el pez capturado del array
            const idx = peces.indexOf(anzuelo.pezEnganchado);
            if (idx !== -1) peces.splice(idx, 1);

            anzuelo.pezEnganchado = null;
        }
    }

    // Acompañar posición del pez enganchado
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

        // Detectar colisión con el anzuelo
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

    // Agua Superficie
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
    ctx.moveTo(anzuelo.x, bote.y + bote.alto / 2);
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
        actualizarMovimiento();
        actualizarPeces();
        dibujar();
    }
    requestAnimationFrame(bucleJuego);
}

iniciarTemporizador();
bucleJuego();

