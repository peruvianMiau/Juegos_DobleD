const RUEDA_NUMEROS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const ROJOS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Gestión de saldo del casino
function obtenerSaldo() {
    let balance = localStorage.getItem('casino_balance');
    if (balance === null || isNaN(parseInt(balance))) {
        balance = 1000;
        localStorage.setItem('casino_balance', balance);
    }
    return parseInt(balance);
}

function guardarSaldo(nuevoSaldo) {
    localStorage.setItem('casino_balance', nuevoSaldo);
    const balanceEl = document.getElementById('fichas-count');
    if (balanceEl) balanceEl.innerText = nuevoSaldo;
}

let fichas = obtenerSaldo();
let fichaSeleccionada = 10;
let apuestas = {}; // { 'num-7': 50, 'red': 100, ... }
let totalApostado = 0;
let estaGirando = false;
let historial = [];

// Variables de renderizado Canvas de la Rueda
let canvas, ctx;
let wheelAngle = 0;
let wheelSpeed = 0;
let ballAngle = 0;
let ballSpeed = 0;
let ballRadius = 160;
let winningIndex = 0;

// Efectos de Sonido mediante Web Audio API
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function reproducirSonidoClick() {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.03);
    } catch (e) {}
}

function reproducirSonidoVictoria() {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.08);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.08 + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + i * 0.08);
            osc.stop(audioCtx.currentTime + i * 0.08 + 0.25);
        });
    } catch (e) {}
}

// Inicialización del Tapete
function construirTapete() {
    const grid = document.getElementById('numbers-grid');
    grid.innerHTML = '';

    // Filas de números (3 filas x 12 columnas)
    // Fila 1: 3, 6, 9... 36
    // Fila 2: 2, 5, 8... 35
    // Fila 3: 1, 4, 7... 34
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 12; c++) {
            const num = (3 - r) + (c * 3);
            const isRed = ROJOS.includes(num);
            const cell = document.createElement('div');
            cell.className = `num-cell bet-target ${isRed ? 'num-red' : 'num-black'}`;
            cell.setAttribute('data-bet', `num-${num}`);
            cell.innerHTML = `
                <span>${num}</span>
                <div class="bet-chip-badge hidden" id="badge-num-${num}">0</div>
            `;
            cell.onclick = () => colocarApuesta(`num-${num}`);
            grid.appendChild(cell);
        }
    }
}

function seleccionarFicha(valor) {
    fichaSeleccionada = valor;
    document.querySelectorAll('.chip-select').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`chip-sel-${valor}`);
    if (btn) btn.classList.add('active');
}

function colocarApuesta(tipo) {
    if (estaGirando) return;

    // Una nueva ronda empieza sin resaltados de la ronda anterior.
    document.querySelectorAll('.winning-bet').forEach(el => el.classList.remove('winning-bet'));

    if (fichas < fichaSeleccionada) {
        mostrarEstado("¡Saldo insuficiente para colocar esta ficha!", "text-rose-400");
        return;
    }

    fichas -= fichaSeleccionada;
    guardarSaldo(fichas);

    apuestas[tipo] = (apuestas[tipo] || 0) + fichaSeleccionada;
    totalApostado += fichaSeleccionada;
    document.getElementById('total-bet').innerText = `$${totalApostado}`;

    // Actualizar badge visual en el tapete
    const badge = document.getElementById(`badge-${tipo}`);
    if (badge) {
        badge.innerText = `$${apuestas[tipo]}`;
        badge.classList.remove('hidden');
    }

    reproducirSonidoClick();
}

function limpiarApuestas() {
    if (estaGirando) return;

    // Devolver las fichas apostadas
    fichas += totalApostado;
    guardarSaldo(fichas);

    apuestas = {};
    totalApostado = 0;
    document.getElementById('total-bet').innerText = '$0';

    // Ocultar todos los badges
    document.querySelectorAll('.bet-chip-badge').forEach(b => {
        b.innerText = '0';
        b.classList.add('hidden');
    });

    mostrarEstado("Tapete limpio. Haz tus apuestas.", "text-slate-300");
}

function girarRuleta() {
    if (estaGirando) return;
    if (totalApostado === 0) {
        mostrarEstado("¡Debes realizar al menos una apuesta en el tapete!", "text-amber-400");
        return;
    }

    estaGirando = true;
    const btn = document.getElementById('btn-spin');
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    mostrarEstado("¡La Ruleta y la bola están girando! ¡Buena suerte!", "text-emerald-400");

    // El resultado se decide una sola vez. La animación se construye alrededor
    // de ese resultado para que la casilla bajo la bola y el resultado lógico
    // sean SIEMPRE el mismo número.
    const numeroGanador = Math.floor(Math.random() * 37);
    winningIndex = RUEDA_NUMEROS.indexOf(numeroGanador);
    const sector = (Math.PI * 2) / RUEDA_NUMEROS.length;
    const anguloBolaFinal = -Math.PI / 2; // posición fija de la bola: arriba
    const centroGanador = winningIndex * sector + sector / 2;
    const inicioRueda = wheelAngle;
    const inicioBola = ballAngle;
    // Queremos que el centro de la casilla ganadora termine exactamente debajo de la bola.
    const destinoBase = anguloBolaFinal - centroGanador;
    // Elegimos una posición final que alinea EXACTAMENTE el centro del sector ganador
    // con la posición fija de la bola (arriba), sin depender de acumulaciones de ángulo.
    const dosPi = Math.PI * 2;
    const vueltasEnteras = 8;
    const vueltasExtra = Math.floor(Math.random() * 2);
    const finalRueda = destinoBase + (Math.floor((inicioRueda - destinoBase) / dosPi) + vueltasEnteras + vueltasExtra) * dosPi;

    const duracion = 5000;
    const inicio = performance.now();
    let tickCounter = 0;
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    function frame(now) {
        const raw = Math.min((now - inicio) / duracion, 1);
        const t = easeOut(raw);
        wheelAngle = inicioRueda + (finalRueda - inicioRueda) * t;

        if (raw < 0.70) {
            const ballT = raw / 0.70;
            ballRadius = 158;
            ballAngle = inicioBola - Math.PI * 2 * 6 * easeOut(ballT);
        } else {
            const fallT = (raw - 0.70) / 0.30;
            ballRadius = 158 - 38 * easeOut(Math.min(fallT, 1));
            // Evita la vuelta rápida extra: la bola toma el camino angular más corto
            // hasta la posición final, sin completar otra revolución accidental.
            const angleAtFall = inicioBola - Math.PI * 2 * 6;
            const deltaCorto = Math.atan2(
                Math.sin(anguloBolaFinal - angleAtFall),
                Math.cos(anguloBolaFinal - angleAtFall)
            );
            ballAngle = angleAtFall + deltaCorto * easeOut(Math.min(fallT, 1));
        }

        tickCounter++;
        if (tickCounter % 5 === 0 && raw < 0.96) reproducirSonidoClick();
        dibujarRueda();

        if (raw < 1) {
            requestAnimationFrame(frame);
        } else {
            // Estado final exacto: centro de la casilla ganadora bajo la bola.
            wheelAngle = finalRueda;
            ballAngle = anguloBolaFinal;
            ballRadius = 120;
            dibujarRueda();
            estaGirando = false;
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
            procesarResultado(numeroGanador);
        }
    }
    requestAnimationFrame(frame);
}

function nombreApuesta(tipo) {
    const nombres = {
        red: 'Rojo',
        black: 'Negro',
        even: 'Par',
        odd: 'Impar',
        low: '1–18',
        high: '19–36',
        'doz-1': '1ª Docena',
        'doz-2': '2ª Docena',
        'doz-3': '3ª Docena',
        'col-1': 'Columna 1',
        'col-2': 'Columna 2',
        'col-3': 'Columna 3'
    };
    return tipo.startsWith('num-') ? `Número ${tipo.slice(4)}` : (nombres[tipo] || tipo);
}

function apuestaGanadora(betType, num, isRed) {
    if (betType === `num-${num}`) return 36;
    if (num === 0) return 0;
    if (betType === 'red' && isRed) return 2;
    if (betType === 'black' && !isRed) return 2;
    if (betType === 'even' && num % 2 === 0) return 2;
    if (betType === 'odd' && num % 2 !== 0) return 2;
    if (betType === 'low' && num >= 1 && num <= 18) return 2;
    if (betType === 'high' && num >= 19 && num <= 36) return 2;
    if (betType === 'doz-1' && num >= 1 && num <= 12) return 3;
    if (betType === 'doz-2' && num >= 13 && num <= 24) return 3;
    if (betType === 'doz-3' && num >= 25 && num <= 36) return 3;
    if (betType === 'col-1' && num % 3 === 1) return 3;
    if (betType === 'col-2' && num % 3 === 2) return 3;
    if (betType === 'col-3' && num % 3 === 0) return 3;
    return 0;
}

function procesarResultado(num) {
    const isRed = ROJOS.includes(num);
    const color = num === 0 ? 'verde' : (isRed ? 'rojo' : 'negro');
    const colorClass = num === 0 ? 'text-emerald-400' : (isRed ? 'text-rose-500' : 'text-slate-300');

    document.getElementById('last-num-val').innerText = num;
    document.getElementById('center-result').style.borderColor =
        num === 0 ? '#10b981' : (isRed ? '#ef4444' : '#64748b');

    agregarHistorial(num, color);

    let premioTotal = 0;
    const acertadas = [];

    for (const [betType, monto] of Object.entries(apuestas)) {
        if (monto <= 0) continue;
        const mult = apuestaGanadora(betType, num, isRed);

        if (mult > 0) {
            const premio = monto * mult;
            premioTotal += premio;
            acertadas.push(`${nombreApuesta(betType)} (${monto} → ${premio})`);

            const cell = document.querySelector(`[data-bet="${betType}"]`);
            if (cell) cell.classList.add('winning-bet');
        }
    }

    const resultBox = document.getElementById('result-bets');
    if (resultBox) {
        resultBox.innerHTML = acertadas.length
            ? `<strong>✅ Apuestas acertadas:</strong><br>${acertadas.map(x => `• ${x}`).join('<br>')}`
            : '<strong>❌ Apuestas acertadas:</strong> ninguna';
    }

    if (premioTotal > 0) {
        fichas += premioTotal;
        guardarSaldo(fichas);
        reproducirSonidoVictoria();
        mostrarEstado(`🎉 ¡Salió el ${num} (${color.toUpperCase()})! Cobraste $${premioTotal}.`, "text-amber-300");
    } else {
        mostrarEstado(`Cayó en el ${num} (${color.toUpperCase()}). No hubo apuestas ganadoras.`, colorClass);
    }

    apuestas = {};
    totalApostado = 0;
    document.getElementById('total-bet').innerText = '$0';
    document.querySelectorAll('.bet-chip-badge').forEach(b => {
        b.innerText = '0';
        b.classList.add('hidden');
    });
}

function agregarHistorial(num, color) {
    historial.unshift({ num, color });
    if (historial.length > 10) historial.pop();

    const container = document.getElementById('history-container');
    container.innerHTML = '';
    historial.forEach(item => {
        const span = document.createElement('span');
        let bgClass = item.color === 'verde' ? 'history-green' : (item.color === 'rojo' ? 'history-red' : 'history-black');
        span.className = `history-badge ${bgClass}`;
        span.innerText = item.num;
        container.appendChild(span);
    });
}

function mostrarEstado(texto, colorClass) {
    const banner = document.getElementById('status-banner');
    banner.className = `w-full text-center py-2 px-4 rounded-xl font-bold text-sm min-h-[36px] flex items-center justify-center ${colorClass}`;
    banner.innerText = texto;
}

// Dibujo de la Ruleta y Bola en Canvas
function dibujarRueda() {
    if (!ctx) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 180;
    const innerRadius = 100;
    const totalSlices = RUEDA_NUMEROS.length;
    const sliceAngle = (Math.PI * 2) / totalSlices;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Borde exterior de caoba y bronce
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#3a200a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d97706';
    ctx.stroke();

    // Pista de la bola
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Dibujar cada casilla con su número
    for (let i = 0; i < totalSlices; i++) {
        const num = RUEDA_NUMEROS[i];
        const angleStart = wheelAngle + (i * sliceAngle);
        const angleEnd = angleStart + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, 150, angleStart, angleEnd);
        ctx.closePath();

        // Color de la casilla
        if (num === 0) {
            ctx.fillStyle = '#15803d'; // Verde
        } else if (ROJOS.includes(num)) {
            ctx.fillStyle = '#b91c1c'; // Rojo
        } else {
            ctx.fillStyle = '#0f172a'; // Negro
        }
        ctx.fill();

        // Línea divisoria metálica
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Texto del número
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angleStart + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(num.toString(), 142, 4);
        ctx.restore();
    }

    // Corona dorada central
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, innerRadius);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(0.6, '#d97706');
    grad.addColorStop(1, '#78350f');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Torreta central metálica
    ctx.beginPath();
    ctx.arc(centerX, centerY, 36, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dibujar la Bola de Marfil
    const ballX = centerX + Math.cos(ballAngle) * ballRadius;
    const ballY = centerY + Math.sin(ballAngle) * ballRadius;

    ctx.beginPath();
    ctx.arc(ballX, ballY, 7, 0, Math.PI * 2);
    const ballGrad = ctx.createRadialGradient(ballX - 2, ballY - 2, 1, ballX, ballY, 7);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.8, '#e2e8f0');
    ballGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = ballGrad;
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fill();
    ctx.shadowColor = 'transparent';
}

window.addEventListener('casino-balance-changed', (e) => {
    fichas = Number(e.detail.balance);
    guardarSaldo(fichas);
});

// Arranque
document.addEventListener('DOMContentLoaded', () => {
    guardarSaldo(fichas);
    canvas = document.getElementById('rouletteCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        dibujarRueda();
    }
    construirTapete();
});