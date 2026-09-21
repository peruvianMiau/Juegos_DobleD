const audioInput = document.getElementById('audio-upload');
const fileNameDisplay = document.getElementById('file-name');
const btnStart = document.getElementById('btn-start');
const setupPanel = document.getElementById('setup-panel');
const playArea = document.getElementById('play-area');
const loadingStatus = document.getElementById('loading-status');

const initVolumeInput = document.getElementById('init-volume');
const gameVolumeInput = document.getElementById('game-volume');
const liveOffsetInput = document.getElementById('live-offset');
const offsetValDisplay = document.getElementById('offset-val');

const btnPause = document.getElementById('btn-pause');
const btnResume = document.getElementById('btn-resume');
const pauseOverlay = document.getElementById('pause-overlay');

const canvas = document.getElementById('rhythmCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const accuracyEl = document.getElementById('accuracy');
const hitFeedback = document.getElementById('hit-feedback');
const controlsGuide = document.getElementById('controls-guide');

// Esquemas por defecto
const ESQUEMA_4 = [
    { tecla: 'd', color: '#ff0055' },
    { tecla: 'f', color: '#00f0ff' },
    { tecla: 'j', color: '#00f0ff' },
    { tecla: 'k', color: '#ff0055' }
];

const ESQUEMA_6 = [
    { tecla: 's', color: '#ff0055' },
    { tecla: 'd', color: '#00f0ff' },
    { tecla: 'f', color: '#ffd700' },
    { tecla: 'j', color: '#ffd700' },
    { tecla: 'k', color: '#00f0ff' },
    { tecla: 'l', color: '#ff0055' }
];

let CARRILES = [];
let reasignandoIndex = -1;

function cambiarModoTeclas() {
    const diff = document.getElementById('difficulty').value;
    const esExtremo = diff === 'extreme';

    document.getElementById('key-count-label').innerText = esExtremo ? "6 Teclas" : "4 Teclas";

    const base = esExtremo ? ESQUEMA_6 : ESQUEMA_4;
    CARRILES = JSON.parse(JSON.stringify(base));

    const container = document.getElementById('keybinds-container');
    container.innerHTML = '';

    CARRILES.forEach((c, idx) => {
        const box = document.createElement('div');
        box.className = 'key-box';
        box.innerHTML = `
            <span>C${idx + 1}</span>
            <button id="key-btn-${idx}" class="btn-key" onclick="configurarTecla(${idx})">${c.tecla.toUpperCase()}</button>
        `;
        container.appendChild(box);
    });

    actualizarLeyenda();
}

function configurarTecla(index) {
    if (reasignandoIndex !== -1) {
        document.getElementById(`key-btn-${reasignandoIndex}`).classList.remove('listening');
    }
    reasignandoIndex = index;
    const btn = document.getElementById(`key-btn-${index}`);
    btn.classList.add('listening');
    btn.innerText = '...';
}

window.addEventListener('keydown', (e) => {
    if (reasignandoIndex !== -1) {
        if (e.key === 'Escape') {
            document.getElementById(`key-btn-${reasignandoIndex}`).classList.remove('listening');
            document.getElementById(`key-btn-${reasignandoIndex}`).innerText = CARRILES[reasignandoIndex].tecla.toUpperCase();
            reasignandoIndex = -1;
            return;
        }
        const nueva = e.key.toLowerCase();
        if (nueva.length === 1) {
            CARRILES[reasignandoIndex].tecla = nueva;
            document.getElementById(`key-btn-${reasignandoIndex}`).innerText = nueva.toUpperCase();
            document.getElementById(`key-btn-${reasignandoIndex}`).classList.remove('listening');
            reasignandoIndex = -1;
            actualizarLeyenda();
        }
        return;
    }

    if (e.key === 'Escape') { alternarPausa(); return; }
    if (juegoPausado || !juegoIniciado) return;

    const tecla = e.key.toLowerCase();
    const carrilIdx = CARRILES.findIndex(c => c.tecla === tecla);

    if (carrilIdx !== -1 && !teclasPresionadas[tecla]) {
        teclasPresionadas[tecla] = true;
        procesarPresion(carrilIdx);
    }
});

window.addEventListener('keyup', (e) => {
    const tecla = e.key.toLowerCase();
    teclasPresionadas[tecla] = false;

    if (!juegoPausado && juegoIniciado) {
        const carrilIdx = CARRILES.findIndex(c => c.tecla === tecla);
        if (carrilIdx !== -1) {
            procesarLiberacion(carrilIdx);
        }
    }
});

function actualizarLeyenda() {
    const txt = CARRILES.map(c => `<mark>${c.tecla.toUpperCase()}</mark>`).join(' ');
    controlsGuide.innerHTML = `<strong>Controles:</strong> ${txt} | <mark>ESC</mark> Pausa`;
}

// Configuración Físicas Canvas
let ANCHO_CARRIL = 80;
const ALTURA_LINEA = 480;
let VELOCIDAD_CAIDA = 1.2;
let DESFASE_MS = -50;

let audioCtx, audioBuffer, audioSource, gainNode;
let tiempoInicioAudio = 0;
let momentoPausaMs = 0;

let notasGeneradas = [];
let puntuacion = 0, combo = 0, comboMax = 0, impactosTotales = 0, aciertosTotales = 0;
let juegoIniciado = false, juegoPausado = false;
const teclasPresionadas = {};

liveOffsetInput.addEventListener('input', (e) => {
    DESFASE_MS = parseInt(e.target.value);
    offsetValDisplay.innerText = `${DESFASE_MS}ms`;
});

initVolumeInput.addEventListener('input', (e) => gameVolumeInput.value = e.target.value);
gameVolumeInput.addEventListener('input', (e) => {
    initVolumeInput.value = e.target.value;
    if (gainNode) gainNode.gain.value = e.target.value;
});

audioInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        fileNameDisplay.innerText = e.target.files[0].name;
        btnStart.disabled = false;
    }
});

btnStart.addEventListener('click', async () => {
    loadingStatus.innerText = "Aislando bajas frecuencias (Ritmo/Bombo)...";
    btnStart.disabled = true;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioInput.files[0].arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Renderizamos de forma offline solo el canal de bajas frecuencias
    await generarBeatmapConFiltroRitmo(audioBuffer);

    setupPanel.classList.add('hidden');
    playArea.classList.remove('hidden');

    iniciarJuego();
});

// Aislamiento mediante Filtro Pasa Bajas (Low-Pass Filter)
async function generarBeatmapConFiltroRitmo(buffer) {
    const offlineCtx = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;

    // Crear filtro pasa bajas a 180Hz (Capta solo el pulso rítmico de graves)
    const filter = offlineCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 180;

    source.connect(filter);
    filter.connect(offlineCtx.destination);
    source.start(0);

    const bufferFiltrado = await offlineCtx.startRendering();
    procesarOndasFiltradas(bufferFiltrado);
}

function procesarOndasFiltradas(buffer) {
    const canal = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const salto = 256; // Mayor resolución de muestreo
    const diff = document.getElementById('difficulty').value;
    VELOCIDAD_CAIDA = parseFloat(document.getElementById('speed').value);

    ANCHO_CARRIL = canvas.width / CARRILES.length;

    let energias = [];
    for (let i = 0; i < canal.length; i += salto) {
        let sum = 0;
        for (let j = 0; j < 512 && (i + j) < canal.length; j++) {
            sum += canal[i + j] * canal[i + j];
        }
        energias.push(Math.sqrt(sum / 512));
    }

    // Configuración de cadencia rítmica
    const umbrales = {
        easy: 2.2,
        medium: 1.7,
        hard: 1.35,
        extreme: 1.15
    };
    const distanciasMinimasMs = {
        easy: 350,
        medium: 240,
        hard: 180,
        extreme: 130
    };

    const umbralActual = umbrales[diff] || 1.7;
    const minDistanciaMs = distanciasMinimasMs[diff] || 240;
    const permiteHolds = diff === 'hard' || diff === 'extreme';

    let carrilOcupadoHasta = new Array(CARRILES.length).fill(0);
    let notas = [];

    for (let i = 4; i < energias.length - 4; i++) {
        let prom = 0;
        for (let k = -4; k <= 4; k++) if (k !== 0) prom += energias[i + k];
        prom /= 8;

        if (energias[i] > prom * umbralActual && energias[i] > 0.02) {
            let tiempoMs = (i * salto / sr) * 1000;

            let carrilesDisponibles = [];
            for (let c = 0; c < CARRILES.length; c++) {
                if (carrilOcupadoHasta[c] <= tiempoMs) {
                    carrilesDisponibles.push(c);
                }
            }

            if (carrilesDisponibles.length > 0) {
                // Verificar intervalo de distancia
                if (notas.length === 0 || (tiempoMs - notas[notas.length - 1].tiempoMs) >= minDistanciaMs) {
                    let carrilElegido = carrilesDisponibles[Math.floor(Math.random() * carrilesDisponibles.length)];
                    let esHold = permiteHolds && Math.random() < 0.22;
                    let duracion = esHold ? (300 + Math.random() * 400) : 0;

                    let tiempoLibre = tiempoMs + duracion + (esHold ? 180 : minDistanciaMs);
                    carrilOcupadoHasta[carrilElegido] = tiempoLibre;

                    notas.push({
                        carril: carrilElegido,
                        tiempoMs: tiempoMs,
                        duracionMs: duracion,
                        golpeada: false,
                        manteniendo: false,
                        finalizada: false,
                        fallada: false
                    });
                }
            }
        }
    }
    notasGeneradas = notas;
}

function iniciarJuego() {
    gainNode = audioCtx.createGain();
    gainNode.gain.value = gameVolumeInput.value;
    gainNode.connect(audioCtx.destination);

    audioSource = audioCtx.createBufferSource();
    audioSource.buffer = audioBuffer; // Reproduce el audio completo original
    audioSource.connect(gainNode);

    tiempoInicioAudio = audioCtx.currentTime;
    audioSource.start(0);
    juegoIniciado = true;

    audioSource.onended = () => { if (!juegoPausado) finalizarJuego(); };
    bucleJuego();
}

function getTiempoMs() {
    if (juegoPausado) return momentoPausaMs;
    return (audioCtx.currentTime - tiempoInicioAudio) * 1000 + DESFASE_MS;
}

function procesarPresion(carrilIdx) {
    const t = getTiempoMs();
    const nota = notasGeneradas.find(n => n.carril === carrilIdx && !n.golpeada && !n.fallada && Math.abs(n.tiempoMs - t) < 140);

    impactosTotales++;

    if (nota) {
        const diff = Math.abs(nota.tiempoMs - t);
        nota.golpeada = true;
        aciertosTotales++;

        if (nota.duracionMs > 0) {
            nota.manteniendo = true;
            mostrarFeedback('HOLD!', '#ffd700');
        } else {
            nota.finalizada = true;
            if (diff < 40) { mostrarFeedback('PERFECT!', '#00f0ff'); puntuacion += 300 + (combo * 10); }
            else if (diff < 80) { mostrarFeedback('GREAT', '#ff0055'); puntuacion += 150; }
            else { mostrarFeedback('GOOD', '#ffd700'); puntuacion += 50; }
        }
        combo++;
    } else {
        mostrarFeedback('MISS', '#888');
        combo = 0;
    }
    comboMax = Math.max(comboMax, combo);
    actualizarHUD();
}

function procesarLiberacion(carrilIdx) {
    const t = getTiempoMs();
    const notaHold = notasGeneradas.find(n => n.carril === carrilIdx && n.manteniendo && !n.finalizada);

    if (notaHold) {
        const finEsperado = notaHold.tiempoMs + notaHold.duracionMs;
        if (Math.abs(t - finEsperado) < 170) {
            notaHold.finalizada = true;
            mostrarFeedback('HOLD COMPLETE!', '#00f0ff');
            puntuacion += 400;
        } else {
            notaHold.fallada = true;
            mostrarFeedback('RELEASE TOO EARLY', '#888');
            combo = 0;
        }
        notaHold.manteniendo = false;
        actualizarHUD();
    }
}

function mostrarFeedback(txt, col) {
    hitFeedback.innerText = txt;
    hitFeedback.style.color = col;
    hitFeedback.style.opacity = '1';
    setTimeout(() => hitFeedback.style.opacity = '0', 250);
}

function actualizarHUD() {
    scoreEl.innerText = puntuacion;
    comboEl.innerText = combo;
    accuracyEl.innerText = impactosTotales === 0 ? 100 : Math.round((aciertosTotales / impactosTotales) * 100);
}

function bucleJuego() {
    if (!juegoIniciado || juegoPausado) return;

    const t = getTiempoMs();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Carriles y Teclas
    CARRILES.forEach((c, idx) => {
        const x = idx * ANCHO_CARRIL;
        ctx.strokeStyle = '#1f2338';
        ctx.strokeRect(x, 0, ANCHO_CARRIL, canvas.height);

        if (teclasPresionadas[c.tecla]) {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.fillRect(x, 0, ANCHO_CARRIL, canvas.height);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(c.tecla.toUpperCase(), x + ANCHO_CARRIL / 2, ALTURA_LINEA + 35);
    });

    // Línea de Recepción
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, ALTURA_LINEA);
    ctx.lineTo(canvas.width, ALTURA_LINEA);
    ctx.stroke();

    // Renderizar Notas
    notasGeneradas.forEach(nota => {
        if (nota.finalizada) return;

        const distInicio = nota.tiempoMs - t;
        const yInicio = ALTURA_LINEA - (distInicio * VELOCIDAD_CAIDA);

        // Auto Miss
        if (distInicio < -140 && !nota.golpeada && !nota.fallada) {
            nota.fallada = true;
            combo = 0;
            impactosTotales++;
            mostrarFeedback('MISS', '#888');
            actualizarHUD();
        }

        const carril = CARRILES[nota.carril];
        const x = nota.carril * ANCHO_CARRIL;

        // Renderizado de Hold Note
        if (nota.duracionMs > 0) {
            const distFin = (nota.tiempoMs + nota.duracionMs) - t;
            const yFin = ALTURA_LINEA - (distFin * VELOCIDAD_CAIDA);

            if (yInicio > -50 && yFin < canvas.height + 50) {
                ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
                ctx.fillRect(x + 20, yFin, ANCHO_CARRIL - 40, yInicio - yFin);

                if (!nota.golpeada) {
                    ctx.fillStyle = carril.color;
                    ctx.fillRect(x + 8, yInicio - 8, ANCHO_CARRIL - 16, 16);
                }
            }
        } else if (!nota.golpeada && yInicio > -30 && yInicio < canvas.height + 30) {
            ctx.fillStyle = carril.color;
            ctx.shadowColor = carril.color;
            ctx.shadowBlur = 10;
            ctx.fillRect(x + 8, yInicio - 8, ANCHO_CARRIL - 16, 16);
            ctx.shadowBlur = 0;
        }
    });

    requestAnimationFrame(bucleJuego);
}

function alternarPausa() {
    if (!juegoIniciado) return;
    if (!juegoPausado) {
        juegoPausado = true;
        momentoPausaMs = getTiempoMs();
        audioCtx.suspend();
        pauseOverlay.classList.remove('hidden');
    } else {
        audioCtx.resume().then(() => {
            juegoPausado = false;
            pauseOverlay.classList.add('hidden');
            bucleJuego();
        });
    }
}

btnPause.addEventListener('click', alternarPausa);
btnResume.addEventListener('click', alternarPausa);

function finalizarJuego() {
    juegoIniciado = false;
    document.getElementById('res-score').innerText = puntuacion;
    document.getElementById('res-combo').innerText = comboMax;
    document.getElementById('res-accuracy').innerText = (impactosTotales === 0 ? 100 : Math.round((aciertosTotales / impactosTotales) * 100)) + '%';
    document.getElementById('game-over-overlay').classList.remove('hidden');
}

// Inicializar interfaz
cambiarModoTeclas();