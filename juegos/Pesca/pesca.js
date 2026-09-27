const canvas = document.getElementById('fishingCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const fishCountEl = document.getElementById('fish-count');
const finalScoreEl = document.getElementById('final-score');
const overlayEl = document.getElementById('game-over-overlay');

let puntuacion = 0;
let capturas = 0;
let tiempoRestante = 120;
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

    const notas = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    let paso = 0;

    setInterval(() => {
        if (juegoTerminado || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(notas[paso % notas.length], audioCtx.currentTime);

        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
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
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    }

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

// Estado del barco y anzuelo
const bote = { x: 350, y: 60, ancho: 100, alto: 30, velocidad: 5.5 };
const anzuelo = {
    x: 400,
    y: 100,
    radio: 8,
    velocidadVertical: 4.5,
    pezEnganchado: null
};

// Control de teclado
const teclas = { Izquierda: false, Derecha: false, Arriba: false, Abajo: false };

// Peces, Burbujas, Estrellas y Partículas
let peces = [];
let burbujas = [];
let particulas = [];
let estrellas = [];
let tiempoOlas = 0;

const TIPOS_PECES = {
    normal: { nombre: 'Normal', color: '#ff7b00', puntos: 10, velocidad: 2.2, tamanio: 16 },
    dorado: { nombre: 'Dorado', color: '#ffd700', puntos: 30, velocidad: 4.5, tamanio: 11 },
    globo:  { nombre: 'PezGlobo', color: '#e63946', puntos: -15, velocidad: 2.5, tamanio: 24 }
};

// Generar elementos del escenario
for (let i = 0; i < 25; i++) {
    burbujas.push({
        x: Math.random() * 800,
        y: 90 + Math.random() * 410,
        radio: Math.random() * 3 + 1,
        velY: Math.random() + 0.5
    });
}

for (let i = 0; i < 30; i++) {
    estrellas.push({
        x: Math.random() * 800,
        y: Math.random() * 75,
        radio: Math.random() * 1.5 + 0.5,
        alfa: Math.random()
    });
}

function crearPez() {
    const rand = Math.random();
    let tipo;

    if (rand < 0.10) {
        tipo = TIPOS_PECES.dorado;
    } else if (rand < 0.35) {
        tipo = TIPOS_PECES.globo;
    } else {
        tipo = TIPOS_PECES.normal;
    }

    const izquierda = Math.random() < 0.5;
    peces.push({
        ...tipo,
        x: izquierda ? -35 : canvas.width + 35,
        y: 140 + Math.random() * (canvas.height - 190),
        dir: izquierda ? 1 : -1
    });
}

function crearParticulas(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particulas.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            vida: 1,
            color
        });
    }
}

// Escuchadores de eventos
window.addEventListener('keydown', (e) => {
    iniciarAudio();
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
    tiempoRestante = 120;
    juegoTerminado = false;
    peces = [];
    particulas = [];
    bote.x = 350;
    anzuelo.x = bote.x + bote.ancho / 2;
    anzuelo.y = 100;
    anzuelo.pezEnganchado = null;

    scoreEl.innerText = '0';
    fishCountEl.innerText = '0';
    timerEl.innerText = '120';
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
    if (teclas.Abajo && anzuelo.y < canvas.height - 25) {
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
        anzuelo.pezEnganchado.y = anzuelo.y + 12;
    }
}

function actualizarEfectos() {
    tiempoOlas += 0.05;

    burbujas.forEach((b) => {
        b.y -= b.velY;
        if (b.y < 95) {
            b.y = canvas.height - 15;
            b.x = Math.random() * canvas.width;
        }
    });

    estrellas.forEach((s) => {
        s.alfa += (Math.random() - 0.5) * 0.05;
        s.alfa = Math.max(0.2, Math.min(1, s.alfa));
    });

    particulas.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vida -= 0.03;
        if (p.vida <= 0) particulas.splice(i, 1);
    });
}

function actualizarPeces() {
    if (Math.random() < 0.035 && peces.length < 9) {
        crearPez();
    }

    peces.forEach((pez, index) => {
        if (pez !== anzuelo.pezEnganchado) {
            pez.x += pez.velocidad * pez.dir;
        }

        if (anzuelo.y > 110) {
            const dist = Math.hypot(anzuelo.x - pez.x, anzuelo.y - pez.y);

            // Si tocamos a un pez:
            if (dist < pez.tamanio + anzuelo.radio) {
                // Caso 1: Si no tenemos pez atrapado, atrapamos cualquiera
                if (!anzuelo.pezEnganchado) {
                    anzuelo.pezEnganchado = pez;
                }
                // Caso 2: Si ya llevamos un pez, pero chocamos contra un Pez Globo (puntos < 0), este tiene PRIORIDAD
                else if (pez.puntos < 0 && anzuelo.pezEnganchado.puntos > 0) {
                    anzuelo.pezEnganchado = pez; // El pez globo toma el lugar en el anzuelo
                }
            }
        }

        if ((pez.dir === 1 && pez.x > canvas.width + 50) || (pez.dir === -1 && pez.x < -50)) {
            if (pez !== anzuelo.pezEnganchado) {
                peces.splice(index, 1);
            }
        }
    });
}

function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- FONDO DE CIELO NOCTURNO ---
    const cieloGrad = ctx.createLinearGradient(0, 0, 0, 90);
    cieloGrad.addColorStop(0, '#050a14');
    cieloGrad.addColorStop(1, '#102a45');
    ctx.fillStyle = cieloGrad;
    ctx.fillRect(0, 0, canvas.width, 90);

    // Estrellas
    estrellas.forEach((s) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alfa})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radio, 0, Math.PI * 2);
        ctx.fill();
    });

    // Luna
    ctx.fillStyle = '#fffae6';
    ctx.beginPath();
    ctx.arc(710, 35, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 250, 230, 0.15)';
    ctx.beginPath();
    ctx.arc(710, 35, 26, 0, Math.PI * 2);
    ctx.fill();

    // --- FONDO MARINO ---
    const fondoGrad = ctx.createLinearGradient(0, 90, 0, canvas.height);
    fondoGrad.addColorStop(0, '#0077b6');
    fondoGrad.addColorStop(0.3, '#023e8a');
    fondoGrad.addColorStop(0.7, '#03045e');
    fondoGrad.addColorStop(1, '#020224');
    ctx.fillStyle = fondoGrad;
    ctx.fillRect(0, 90, canvas.width, canvas.height - 90);

    // --- ALGAS DE FONDO (Más pequeñas y translúcidas) ---
    ctx.globalAlpha = 0.35; // Transparencia para efecto de fondo/profundidad
    for (let x = 30; x < canvas.width; x += 90) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        const swing = Math.sin(tiempoOlas + x) * 8;
        // Altura reducida a 25-35px max
        ctx.quadraticCurveTo(x + swing, canvas.height - 18, x + swing / 2, canvas.height - 32);
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0; // Restablecer opacidad

    // Suelo Marino (Arena)
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.quadraticCurveTo(200, canvas.height - 12, 400, canvas.height - 8);
    ctx.quadraticCurveTo(600, canvas.height - 4, canvas.width, canvas.height - 10);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Olas animadas en la superficie
    ctx.fillStyle = '#0077b6';
    ctx.beginPath();
    ctx.moveTo(0, 90);
    for (let x = 0; x <= canvas.width; x += 30) {
        ctx.lineTo(x, 90 + Math.sin(tiempoOlas + x * 0.05) * 3);
    }
    ctx.lineTo(canvas.width, 100);
    ctx.lineTo(0, 100);
    ctx.closePath();
    ctx.fill();

    // Burbujas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    burbujas.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radio, 0, Math.PI * 2);
        ctx.fill();
    });

    // Bote
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
    ctx.arc(bote.x + 30, bote.y - 10, 8, 0, Math.PI * 2);
    ctx.fill();

    // Caña
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bote.x + 30, bote.y - 5);
    ctx.lineTo(anzuelo.x, bote.y - 15);
    ctx.stroke();

    // Hilo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(anzuelo.x, bote.y - 15);
    ctx.lineTo(anzuelo.x, anzuelo.y);
    ctx.stroke();

    // Anzuelo
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(anzuelo.x, anzuelo.y, anzuelo.radio, 0, Math.PI);
    ctx.stroke();

    // Dibujar Peces
    peces.forEach((pez) => {
        ctx.fillStyle = pez.color;

        // Cuerpo
        ctx.beginPath();
        ctx.ellipse(pez.x, pez.y, pez.tamanio, pez.tamanio / 1.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cola
        ctx.beginPath();
        const colaX = pez.x - (pez.tamanio * pez.dir);
        ctx.moveTo(pez.x, pez.y);
        ctx.lineTo(colaX, pez.y - (pez.tamanio * 0.5));
        ctx.lineTo(colaX, pez.y + (pez.tamanio * 0.5));
        ctx.closePath();
        ctx.fill();

        // Ojo
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pez.x + (pez.tamanio / 2 * pez.dir), pez.y - 2, Math.max(2, pez.tamanio * 0.18), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(pez.x + (pez.tamanio / 2 * pez.dir), pez.y - 2, Math.max(1, pez.tamanio * 0.09), 0, Math.PI * 2);
        ctx.fill();

        // Púas si es Pez Globo
        if (pez.puntos < 0) {
            ctx.strokeStyle = '#e63946';
            ctx.lineWidth = 2;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
                const px = pez.x + Math.cos(a) * (pez.tamanio + 3);
                const py = pez.y + Math.sin(a) * (pez.tamanio / 1.6 + 3);
                ctx.beginPath();
                ctx.moveTo(pez.x + Math.cos(a) * pez.tamanio, pez.y + Math.sin(a) * (pez.tamanio / 1.6));
                ctx.lineTo(px, py);
                ctx.stroke();
            }
        }
    });

    // Partículas
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