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

let chispasRitmo = [];

function crearChispas(x, y, color) {
    for (let i = 0; i < 14; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const vel = 2 + Math.random() * 3.5;
        chispasRitmo.push({
            x: x,
            y: y,
            vx: Math.cos(angulo) * vel,
            vy: Math.sin(angulo) * vel - 1.5,
            vida: 1.0,
            color: color,
            radio: 2 + Math.random() * 2.5
        });
    }
}

function procesarPresion(carrilIdx) {
    const t = getTiempoMs();
    const nota = notasGeneradas.find(n => n.carril === carrilIdx && !n.golpeada && !n.fallada && Math.abs(n.tiempoMs - t) < 140);

    impactosTotales++;
    const carril = CARRILES[carrilIdx];

    if (nota) {
        const diff = Math.abs(nota.tiempoMs - t);
        nota.golpeada = true;
        aciertosTotales++;

        const impactX = carrilIdx * ANCHO_CARRIL + ANCHO_CARRIL / 2;
        crearChispas(impactX, ALTURA_LINEA, carril.color);

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
        mostrarFeedback('MISS', '#ef4444');
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
        const carril = CARRILES[carrilIdx];
        const impactX = carrilIdx * ANCHO_CARRIL + ANCHO_CARRIL / 2;

        if (Math.abs(t - finEsperado) < 170) {
            notaHold.finalizada = true;
            mostrarFeedback('HOLD COMPLETE!', '#00f0ff');
            crearChispas(impactX, ALTURA_LINEA, '#00f0ff');
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
    hitFeedback.style.textShadow = `0 0 25px ${col}`;
    hitFeedback.style.transform = 'scale(1.2)';
    hitFeedback.style.opacity = '1';
    setTimeout(() => {
        hitFeedback.style.transform = 'scale(1)';
        hitFeedback.style.opacity = '0';
    }, 220);
}

function actualizarHUD() {
    scoreEl.innerText = puntuacion;
    comboEl.innerText = combo;
    accuracyEl.innerText = impactosTotales === 0 ? 100 : Math.round((aciertosTotales / impactosTotales) * 100);
}

function dibujarCapsulaNota(c, x, y, w, h, color) {
    c.save();
    c.shadowBlur = 16;
    c.shadowColor = color;

    // Fondo degradado
    const grad = c.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, color);
    grad.addColorStop(1, '#0a0a0a');
    c.fillStyle = grad;

    c.beginPath();
    const r = Math.min(8, h / 2);
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
    c.fill();

    // Borde brillante
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.5;
    c.stroke();
    c.restore();
}

function bucleJuego() {
    if (!juegoIniciado || juegoPausado) return;

    const t = getTiempoMs();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fondo oscuro con degradado
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#090b14');
    bgGrad.addColorStop(1, '#03050a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar Carriles y Teclas
    CARRILES.forEach((c, idx) => {
        const x = idx * ANCHO_CARRIL;
        
        // Línea divisoria de carril
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, 0, ANCHO_CARRIL, canvas.height);

        // Iluminación al presionar tecla
        if (teclasPresionadas[c.tecla]) {
            const laneGrad = ctx.createLinearGradient(x, ALTURA_LINEA, x, 0);
            laneGrad.addColorStop(0, c.color + '55');
            laneGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = laneGrad;
            ctx.fillRect(x, 0, ANCHO_CARRIL, canvas.height);
        }

        // Receptor en la parte inferior
        ctx.save();
        ctx.fillStyle = teclasPresionadas[c.tecla] ? c.color : '#1e293b';
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        if (teclasPresionadas[c.tecla]) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = c.color;
        }
        ctx.fillRect(x + 6, ALTURA_LINEA - 4, ANCHO_CARRIL - 12, 38);
        ctx.strokeRect(x + 6, ALTURA_LINEA - 4, ANCHO_CARRIL - 12, 38);

        // Tecla
        ctx.fillStyle = teclasPresionadas[c.tecla] ? '#ffffff' : c.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 0;
        ctx.fillText(c.tecla.toUpperCase(), x + ANCHO_CARRIL / 2, ALTURA_LINEA + 22);
        ctx.restore();
    });

    // Línea de Recepción (Láser Neón)
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f0ff';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, ALTURA_LINEA);
    ctx.lineTo(canvas.width, ALTURA_LINEA);
    ctx.stroke();
    ctx.restore();

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
            mostrarFeedback('MISS', '#ef4444');
            actualizarHUD();
        }

        const carril = CARRILES[nota.carril];
        const x = nota.carril * ANCHO_CARRIL;

        // Renderizado de Hold Note (Cinta luminosa)
        if (nota.duracionMs > 0) {
            const distFin = (nota.tiempoMs + nota.duracionMs) - t;
            const yFin = ALTURA_LINEA - (distFin * VELOCIDAD_CAIDA);

            if (yInicio > -50 && yFin < canvas.height + 50) {
                // Haz de luz de la nota hold
                const holdGrad = ctx.createLinearGradient(x, 0, x + ANCHO_CARRIL, 0);
                holdGrad.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
                holdGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.45)');
                holdGrad.addColorStop(1, 'rgba(255, 215, 0, 0.1)');
                ctx.fillStyle = holdGrad;
                ctx.fillRect(x + 12, yFin, ANCHO_CARRIL - 24, yInicio - yFin);

                // Bordes luminosos del haz
                ctx.strokeStyle = '#ffd700';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x + 12, yFin, ANCHO_CARRIL - 24, yInicio - yFin);

                if (!nota.golpeada) {
                    dibujarCapsulaNota(ctx, x + 6, yInicio - 10, ANCHO_CARRIL - 12, 20, carril.color);
                }
            }
        } else if (!nota.golpeada && yInicio > -30 && yInicio < canvas.height + 30) {
            dibujarCapsulaNota(ctx, x + 6, yInicio - 10, ANCHO_CARRIL - 12, 20, carril.color);
        }
    });

    // Renderizar Chispas de Impacto
    for (let i = chispasRitmo.length - 1; i >= 0; i--) {
        const p = chispasRitmo[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.93;
        p.vy *= 0.93;
        p.vida -= 0.045;

        if (p.vida <= 0) {
            chispasRitmo.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.vida;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

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