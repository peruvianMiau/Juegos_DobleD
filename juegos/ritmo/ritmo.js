const audioInput = document.getElementById('audio-upload');
const fileNameDisplay = document.getElementById('file-name');
const btnStart = document.getElementById('btn-start');
const setupPanel = document.getElementById('setup-panel');
const playArea = document.getElementById('play-area');
const loadingStatus = document.getElementById('loading-status');

const initVolumeInput = document.getElementById('init-volume');
const gameVolumeInput = document.getElementById('game-volume');
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

// Configuración de Carriles (Modificable por el usuario)
const CARRILES = [
    { tecla: 'd', x: 0, color: '#ff0055' },
    { tecla: 'f', x: 100, color: '#00f0ff' },
    { tecla: 'j', x: 200, color: '#00f0ff' },
    { tecla: 'k', x: 300, color: '#ff0055' }
];

let reasignandoCarril = -1;

function configurarTecla(index) {
    // Cancelar cualquier otra escucha previa
    if (reasignandoCarril !== -1) {
        document.getElementById(`key-btn-${reasignandoCarril}`).classList.remove('listening');
    }

    reasignandoCarril = index;
    const btn = document.getElementById(`key-btn-${index}`);
    btn.classList.add('listening');
    btn.innerText = '...';
}

window.addEventListener('keydown', (e) => {
    // Si se está reasignando una tecla en el menú
    if (reasignandoCarril !== -1) {
        if (e.key === 'Escape') {
            document.getElementById(`key-btn-${reasignandoCarril}`).classList.remove('listening');
            document.getElementById(`key-btn-${reasignandoCarril}`).innerText = CARRILES[reasignandoCarril].tecla.toUpperCase();
            reasignandoCarril = -1;
            return;
        }

        const nuevaTecla = e.key.toLowerCase();
        if (nuevaTecla.length === 1 || nuevaTecla.startsWith('arrow')) {
            CARRILES[reasignandoCarril].tecla = nuevaTecla;
            const btn = document.getElementById(`key-btn-${reasignandoCarril}`);
            btn.innerText = nuevaTecla.toUpperCase();
            btn.classList.remove('listening');
            reasignandoCarril = -1;
            actualizarLeyendaControles();
        }
        return;
    }

    // Tecla ESC para Pausa en juego
    if (e.key === 'Escape') {
        alternarPausa();
        return;
    }

    if (juegoPausado || !juegoIniciado) return;

    // Procesar golpes de juego
    const tecla = e.key.toLowerCase();
    const carrilIndex = CARRILES.findIndex(c => c.tecla === tecla);
    if (carrilIndex !== -1 && !teclasPresionadas[tecla]) {
        teclasPresionadas[tecla] = true;
        procesarGolpe(tecla);
    }
});

function actualizarLeyendaControles() {
    const teclasTxt = CARRILES.map(c => `<mark>${c.tecla.toUpperCase()}</mark>`).join(' ');
    controlsGuide.innerHTML = `<strong>Controles:</strong> Usa ${teclasTxt}. <mark>ESC</mark> para Pausa.`;
}

const ANCHO_CARRIL = 100;
const ALTURA_LINEA_GOLPE = 460;
const TIEMPO_VIAJE_NOTA_MS = 1200;
const DESFASE_CALIBRACION_MS = -80;

let audioCtx;
let audioBuffer;
let audioSource;
let gainNode;

let tiempoInicioAudioCtx = 0;
let momentoPausaMs = 0;

let notasGeneradas = [];
let puntuacion = 0;
let combo = 0;
let comboMaximo = 0;
let impactosTotales = 0;
let aciertosTotales = 0;
let juegoIniciado = false;
let juegoPausado = false;

// Sincronizar Sliders de Volumen
initVolumeInput.addEventListener('input', (e) => {
    gameVolumeInput.value = e.target.value;
    if (gainNode) gainNode.gain.value = e.target.value;
});

gameVolumeInput.addEventListener('input', (e) => {
    initVolumeInput.value = e.target.value;
    if (gainNode) gainNode.gain.value = e.target.value;
});

// Carga de archivo
audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.innerText = file.name;
        btnStart.disabled = false;
    }
});

btnStart.addEventListener('click', async () => {
    const file = audioInput.files[0];
    if (!file) return;

    loadingStatus.innerText = "Analizando ritmo de la canción...";
    btnStart.disabled = true;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    analizarPicosRitmo(audioBuffer);

    setupPanel.classList.add('hidden');
    playArea.classList.remove('hidden');

    iniciarJuego();
});

function analizarPicosRitmo(buffer) {
    const datosCanal = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const tamanoVentana = 1024;
    const salto = 512;

    const dificultad = document.getElementById('difficulty').value;
    const umbralSensibilidad = dificultad === 'easy' ? 2.2 : (dificultad === 'medium' ? 1.6 : 1.2);

    let energias = [];
    for (let i = 0; i < datosCanal.length; i += salto) {
        let suma = 0;
        for (let j = 0; j < tamanoVentana && (i + j) < datosCanal.length; j++) {
            suma += datosCanal[i + j] * datosCanal[i + j];
        }
        energias.push(Math.sqrt(suma / tamanoVentana));
    }

    let notas = [];
    for (let i = 4; i < energias.length - 4; i++) {
        let promedioLocal = 0;
        for (let k = -4; k <= 4; k++) {
            if (k !== 0) promedioLocal += energias[i + k];
        }
        promedioLocal /= 8;

        if (energias[i] > promedioLocal * umbralSensibilidad && energias[i] > 0.04) {
            let tiempoSegundos = (i * salto) / sampleRate;
            let tiempoMs = tiempoSegundos * 1000;
            let carrilRandom = Math.floor(Math.random() * 4);

            if (notas.length === 0 || (tiempoMs - notas[notas.length - 1].tiempoMs) > 160) {
                notas.push({
                    carril: carrilRandom,
                    tiempoMs: tiempoMs,
                    golpeada: false,
                    fallada: false
                });
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
    audioSource.buffer = audioBuffer;
    audioSource.connect(gainNode);

    tiempoInicioAudioCtx = audioCtx.currentTime;
    audioSource.start(0);
    juegoIniciado = true;

    audioSource.onended = () => {
        if (!juegoPausado) finalizarJuego();
    };

    bucleJuego();
}

function getTiempoCancionMs() {
    if (juegoPausado) return momentoPausaMs;
    return (audioCtx.currentTime - tiempoInicioAudioCtx) * 1000 + DESFASE_CALIBRACION_MS;
}

function alternarPausa() {
    if (!juegoIniciado) return;

    if (!juegoPausado) {
        juegoPausado = true;
        momentoPausaMs = getTiempoCancionMs();
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

const teclasPresionadas = {};

window.addEventListener('keyup', (e) => {
    const tecla = e.key.toLowerCase();
    teclasPresionadas[tecla] = false;
});

function procesarGolpe(tecla) {
    if (!juegoIniciado || juegoPausado) return;

    const carrilIndex = CARRILES.findIndex(c => c.tecla === tecla);
    const tiempoCancion = getTiempoCancionMs();

    const notaCercana = notasGeneradas.find(n =>
        n.carril === carrilIndex &&
        !n.golpeada &&
        !n.fallada &&
        Math.abs(n.tiempoMs - tiempoCancion) < 140
    );

    impactosTotales++;

    if (notaCercana) {
        const diferencia = Math.abs(notaCercana.tiempoMs - tiempoCancion);
        notaCercana.golpeada = true;
        aciertosTotales++;

        if (diferencia < 40) {
            mostrarFeedback('PERFECT!', '#00f0ff');
            puntuacion += 300 + (combo * 10);
            combo++;
        } else if (diferencia < 80) {
            mostrarFeedback('GREAT', '#ff0055');
            puntuacion += 100 + (combo * 5);
            combo++;
        } else {
            mostrarFeedback('GOOD', '#ffd700');
            puntuacion += 50;
            combo++;
        }
    } else {
        mostrarFeedback('MISS', '#888');
        combo = 0;
    }

    comboMaximo = Math.max(comboMaximo, combo);
    actualizarHUD();
}

function mostrarFeedback(texto, color) {
    hitFeedback.innerText = texto;
    hitFeedback.style.color = color;
    hitFeedback.style.opacity = '1';
    setTimeout(() => { hitFeedback.style.opacity = '0'; }, 250);
}

function actualizarHUD() {
    scoreEl.innerText = puntuacion;
    comboEl.innerText = combo;
    const precision = impactosTotales === 0 ? 100 : Math.round((aciertosTotales / impactosTotales) * 100);
    accuracyEl.innerText = precision;
}

function bucleJuego() {
    if (!juegoIniciado || juegoPausado) return;

    const tiempoCancion = getTiempoCancionMs();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Carriles y Teclas
    CARRILES.forEach((carril) => {
        ctx.strokeStyle = '#1f2338';
        ctx.strokeRect(carril.x, 0, ANCHO_CARRIL, canvas.height);

        if (teclasPresionadas[carril.tecla]) {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
            ctx.fillRect(carril.x, 0, ANCHO_CARRIL, canvas.height);
        }

        // Renderizar la letra asignada en la parte inferior de cada carril
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(carril.tecla.toUpperCase(), carril.x + ANCHO_CARRIL / 2, ALTURA_LINEA_GOLPE + 40);
    });

    // Línea de Recepción (Hit Line)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, ALTURA_LINEA_GOLPE);
    ctx.lineTo(canvas.width, ALTURA_LINEA_GOLPE);
    ctx.stroke();

    // Dibujar Notas
    notasGeneradas.forEach(nota => {
        if (nota.golpeada) return;

        const tiempoHastaHit = nota.tiempoMs - tiempoCancion;
        const progreso = 1 - (tiempoHastaHit / TIEMPO_VIAJE_NOTA_MS);
        const notaY = progreso * ALTURA_LINEA_GOLPE;

        if (tiempoHastaHit < -120 && !nota.fallada) {
            nota.fallada = true;
            combo = 0;
            impactosTotales++;
            mostrarFeedback('MISS', '#888');
            actualizarHUD();
        }

        if (notaY > -30 && notaY < canvas.height + 30) {
            const carril = CARRILES[nota.carril];
            ctx.fillStyle = carril.color;
            ctx.shadowColor = carril.color;
            ctx.shadowBlur = 12;
            ctx.fillRect(carril.x + 12, notaY - 10, ANCHO_CARRIL - 24, 20);
            ctx.shadowBlur = 0;
        }
    });

    requestAnimationFrame(bucleJuego);
}

function finalizarJuego() {
    juegoIniciado = false;
    document.getElementById('res-score').innerText = puntuacion;
    document.getElementById('res-combo').innerText = comboMaximo;
    const precision = impactosTotales === 0 ? 100 : Math.round((aciertosTotales / impactosTotales) * 100);
    document.getElementById('res-accuracy').innerText = precision + '%';

    document.getElementById('game-over-overlay').classList.remove('hidden');
}

// Inicializar Leyenda con controles por defecto
actualizarLeyendaControles();