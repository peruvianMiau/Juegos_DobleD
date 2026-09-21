// Lógica completa de Video Poker Jacks or Better: Reparto, Retención (HOLD), Cambio y Evaluación

const PALOS = [
    { simbolo: '♠', color: 'black' },
    { simbolo: '♣', color: 'black' },
    { simbolo: '♥', color: 'red' },
    { simbolo: '♦', color: 'red' }
];

const NOMBRES = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

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
let mazo = [];
let mano = [];
let cartasRetenidas = [false, false, false, false, false];
let estadoJuego = 'DEAL'; // 'DEAL' o 'DRAW'
let apuestaActual = 50;

// Audio con Web Audio API
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function reproducirClick() {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {}
}

function reproducirPremio() {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + idx * 0.08);
            osc.stop(audioCtx.currentTime + idx * 0.08 + 0.25);
        });
    } catch (e) {}
}

function crearMazo() {
    let deck = [];
    for (let p of PALOS) {
        for (let v = 2; v <= 14; v++) {
            deck.push({
                valor: v,
                nombre: NOMBRES[v] || v.toString(),
                palo: p.simbolo,
                color: p.color
            });
        }
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function fijarApuesta(monto) {
    if (estadoJuego === 'DRAW') return;
    const input = document.getElementById('bet-input');
    if (monto > fichas) monto = fichas;
    input.value = monto;
    actualizarTextoBoton();
}

function actualizarTextoBoton() {
    const betInput = document.getElementById('bet-input');
    const monto = parseInt(betInput.value) || 50;
    const btnText = document.getElementById('btn-action-text');
    if (estadoJuego === 'DEAL') {
        btnText.innerText = `REPARTIR ($${monto})`;
    } else {
        btnText.innerText = `CAMBIAR (DRAW)`;
    }
}

function renderizarCartas() {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = `card-wrapper ${cartasRetenidas[i] ? 'held' : ''}`;
        wrapper.onclick = () => alternarRetencion(i);

        // Badge de HOLD
        const badge = document.createElement('div');
        badge.className = `hold-badge ${cartasRetenidas[i] ? 'visible' : ''}`;
        badge.innerText = 'MANTENER';

        // Carta
        const cardDiv = document.createElement('div');
        const carta = mano[i];

        if (!carta) {
            cardDiv.className = 'card back';
        } else {
            cardDiv.className = `card ${carta.color}`;
            cardDiv.innerHTML = `
                <div class="card-corner top-left">
                    <span class="card-value">${carta.nombre}</span>
                    <span class="card-suit-small">${carta.palo}</span>
                </div>
                <div class="card-center-suit">${carta.palo}</div>
                <div class="card-corner bottom-right rotate-180">
                    <span class="card-value">${carta.nombre}</span>
                    <span class="card-suit-small">${carta.palo}</span>
                </div>
            `;
        }

        // Botón inferior
        const btnToggle = document.createElement('button');
        btnToggle.className = 'btn-hold-toggle';
        btnToggle.innerText = cartasRetenidas[i] ? 'RETENIDO' : 'HOLD';

        wrapper.appendChild(badge);
        wrapper.appendChild(cardDiv);
        wrapper.appendChild(btnToggle);
        container.appendChild(wrapper);
    }
}

function alternarRetencion(index) {
    if (estadoJuego !== 'DRAW') return;
    cartasRetenidas[index] = !cartasRetenidas[index];
    reproducirClick();
    renderizarCartas();
}

function manejarBotonAccion() {
    if (estadoJuego === 'DEAL') {
        iniciarReparto();
    } else if (estadoJuego === 'DRAW') {
        ejecutarCambio();
    }
}

function iniciarReparto() {
    const betInput = document.getElementById('bet-input');
    const monto = parseInt(betInput.value) || 50;

    if (monto <= 0 || monto > fichas) {
        mostrarMensaje("¡Monto de apuesta inválido o saldo insuficiente!", "text-rose-400");
        return;
    }

    // Descontar apuesta
    fichas -= monto;
    apuestaActual = monto;
    guardarSaldo(fichas);
    betInput.disabled = true;

    // Limpiar resaltados de la tabla de pagos
    document.querySelectorAll('.paytable-item').forEach(item => item.classList.remove('active-win'));

    // Crear mazo y repartir 5 cartas
    mazo = crearMazo();
    mano = [mazo.pop(), mazo.pop(), mazo.pop(), mazo.pop(), mazo.pop()];
    cartasRetenidas = [false, false, false, false, false];

    renderizarCartas();
    reproducirClick();

    estadoJuego = 'DRAW';
    actualizarTextoBoton();
    mostrarMensaje("Haz clic en las cartas que deseas CONSERVAR (HOLD) y pulsa CAMBIAR.", "text-cyan-300");
}

function ejecutarCambio() {
    // Reemplazar cartas no retenidas
    for (let i = 0; i < 5; i++) {
        if (!cartasRetenidas[i]) {
            mano[i] = mazo.pop();
        }
    }

    renderizarCartas();
    reproducirClick();

    // Evaluar la mano final
    evaluarManoFinal();

    estadoJuego = 'DEAL';
    actualizarTextoBoton();
    document.getElementById('bet-input').disabled = false;
}

function evaluarManoFinal() {
    const valores = mano.map(c => c.valor).sort((a, b) => b - a);
    const palos = mano.map(c => c.palo);

    const esColor = palos.every(p => p === palos[0]);

    let esEscalera = false;
    let escaleraAlta = valores[0];

    if (valores[0] - valores[4] === 4 && new Set(valores).size === 5) {
        esEscalera = true;
    } else if (valores[0] === 14 && valores[1] === 5 && valores[2] === 4 && valores[3] === 3 && valores[4] === 2) {
        esEscalera = true;
        escaleraAlta = 5;
    }

    let frec = {};
    valores.forEach(v => frec[v] = (frec[v] || 0) + 1);
    let pares = Object.entries(frec).map(([val, count]) => ({ val: parseInt(val), count }));
    pares.sort((a, b) => b.count - a.count || b.val - a.val);

    let resultado = null;

    // Escalera Real (250x)
    if (esColor && esEscalera && escaleraAlta === 14 && valores[4] === 10) {
        resultado = { id: 'pay-royal', nombre: "¡ESCALERA REAL!", mult: 250 };
    }
    // Escalera de Color (50x)
    else if (esColor && esEscalera) {
        resultado = { id: 'pay-straight-flush', nombre: "¡Escalera de Color!", mult: 50 };
    }
    // Póker (25x)
    else if (pares[0].count === 4) {
        resultado = { id: 'pay-quads', nombre: `¡Póker de ${NOMBRES[pares[0].val] || pares[0].val}!`, mult: 25 };
    }
    // Full House (9x)
    else if (pares[0].count === 3 && pares[1].count === 2) {
        resultado = { id: 'pay-full', nombre: "¡Full House!", mult: 9 };
    }
    // Color (6x)
    else if (esColor) {
        resultado = { id: 'pay-flush', nombre: "¡Color (Flush)!", mult: 6 };
    }
    // Escalera (4x)
    else if (esEscalera) {
        resultado = { id: 'pay-straight', nombre: "¡Escalera!", mult: 4 };
    }
    // Trío (3x)
    else if (pares[0].count === 3) {
        resultado = { id: 'pay-trips', nombre: `¡Trío de ${NOMBRES[pares[0].val] || pares[0].val}!`, mult: 3 };
    }
    // Doble Pareja (2x)
    else if (pares[0].count === 2 && pares[1].count === 2) {
        resultado = { id: 'pay-twopair', nombre: "¡Doble Pareja!", mult: 2 };
    }
    // Jacks or Better (Pareja de J o superior) (1x)
    else if (pares[0].count === 2 && pares[0].val >= 11) {
        resultado = { id: 'pay-jacks', nombre: `¡Pareja Alta (${NOMBRES[pares[0].val]})!`, mult: 1 };
    }

    if (resultado) {
        const premio = apuestaActual * resultado.mult;
        fichas += premio;
        guardarSaldo(fichas);
        reproducirPremio();

        const el = document.getElementById(resultado.id);
        if (el) el.classList.add('active-win');

        mostrarMensaje(`🎉 ${resultado.nombre} Ganaste $${premio} (${resultado.mult}x)`, "text-amber-300 font-black");
    } else {
        mostrarMensaje("Mano no premiada. ¡Prueba otra mano!", "text-slate-400 font-semibold");
    }
}

function mostrarMensaje(texto, colorClass) {
    const banner = document.getElementById('status-banner');
    banner.className = `text-center py-2 px-6 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 ${colorClass}`;
    banner.innerText = texto;
}

// Atajos de teclado: teclas 1 a 5 para retención, Espacio para Repartir/Cambiar
document.addEventListener('keydown', (e) => {
    if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        alternarRetencion(idx);
    } else if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        manejarBotonAccion();
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    guardarSaldo(fichas);
    actualizarTextoBoton();
    renderizarCartas();
});