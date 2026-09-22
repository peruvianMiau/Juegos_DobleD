// Lógica de Tragamonedas Vegas con físicas de parada escalonada, audio y saldo de casino

const SIMBOLOS = [
    { icono: '7️⃣', nombre: 'Siete Dorado', mult: 50, peso: 1 },
    { icono: '💎', nombre: 'Diamante', mult: 25, peso: 2 },
    { icono: '👑', nombre: 'Corona Real', mult: 15, peso: 3 },
    { icono: '🔔', nombre: 'Campana', mult: 10, peso: 4 },
    { icono: '🍇', nombre: 'Uvas', mult: 5, peso: 6 },
    { icono: '🍒', nombre: 'Cerezas', mult: 3, peso: 8 }
];

// Generador con pesos de probabilidad
let bolsaSimbolos = [];
SIMBOLOS.forEach(s => {
    for (let i = 0; i < s.peso; i++) bolsaSimbolos.push(s.icono);
});

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
let girando = false;

// Audio con Web Audio API
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function reproducirTick() {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {}
}

function reproducirStop() {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {}
}

function reproducirPremio(esJackpot = false) {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const notas = esJackpot ? [523.25, 659.25, 783.99, 1046.50, 1318.51] : [523.25, 659.25, 783.99];
        notas.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.1);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.1 + 0.35);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(audioCtx.currentTime + idx * 0.1);
            osc.stop(audioCtx.currentTime + idx * 0.1 + 0.35);
        });
    } catch (e) {}
}

function fijarApuesta(monto) {
    if (girando) return;
    const input = document.getElementById('bet-input');
    if (monto > fichas) monto = fichas;
    input.value = monto;
}

function simboloAleatorio() {
    return bolsaSimbolos[Math.floor(Math.random() * bolsaSimbolos.length)];
}

function girarTragamonedas() {
    if (girando) return;

    const betInput = document.getElementById('bet-input');
    const monto = parseInt(betInput.value) || 10;
    const display = document.getElementById('slot-display');
    const btnSpin = document.getElementById('btn-spin');

    if (monto <= 0 || monto > fichas) {
        display.innerText = "¡Monto de apuesta inválido o saldo insuficiente!";
        display.className = "w-full bg-black/90 border border-rose-500/40 rounded-xl p-3 text-center min-h-[48px] flex items-center justify-center font-bold text-base sm:text-lg text-rose-400 shadow-inner";
        return;
    }

    // Descontar apuesta
    fichas -= monto;
    guardarSaldo(fichas);
    girando = true;
    btnSpin.disabled = true;

    display.innerText = "¡Girando rodillos... que ruede la suerte!";
    display.className = "w-full bg-black/90 border border-amber-500/40 rounded-xl p-3 text-center min-h-[48px] flex items-center justify-center font-bold text-base sm:text-lg text-amber-300 shadow-inner";

    const r1 = document.getElementById('reel-1');
    const r2 = document.getElementById('reel-2');
    const r3 = document.getElementById('reel-3');

    r1.classList.add('spinning-reel');
    r2.classList.add('spinning-reel');
    r3.classList.add('spinning-reel');

    // Resultados seleccionados de antemano
    const res1 = simboloAleatorio();
    const res2 = simboloAleatorio();
    const res3 = simboloAleatorio();

    // Animación de cambio continuo mientras gira
    const intervalTick = setInterval(() => {
        r1.firstElementChild.innerText = simboloAleatorio();
        r2.firstElementChild.innerText = simboloAleatorio();
        r3.firstElementChild.innerText = simboloAleatorio();
        reproducirTick();
    }, 70);

    // Parada escalonada del Rodillo 1
    setTimeout(() => {
        r1.classList.remove('spinning-reel');
        r1.firstElementChild.innerText = res1;
        reproducirStop();
        animarRebote(r1.firstElementChild);
    }, 1100);

    // Parada escalonada del Rodillo 2
    setTimeout(() => {
        r2.classList.remove('spinning-reel');
        r2.firstElementChild.innerText = res2;
        reproducirStop();
        animarRebote(r2.firstElementChild);
    }, 1800);

    // Parada escalonada del Rodillo 3 y Evaluación
    setTimeout(() => {
        clearInterval(intervalTick);
        r3.classList.remove('spinning-reel');
        r3.firstElementChild.innerText = res3;
        reproducirStop();
        animarRebote(r3.firstElementChild);

        evaluarResultado(res1, res2, res3, monto);
        girando = false;
        btnSpin.disabled = false;
    }, 2500);
}

function animarRebote(elemento) {
    elemento.style.transform = 'scale(1.25)';
    setTimeout(() => {
        elemento.style.transform = 'scale(1)';
    }, 150);
}

function evaluarResultado(s1, s2, s3, apuesta) {
    const display = document.getElementById('slot-display');

    // Comprobar 3 iguales
    if (s1 === s2 && s2 === s3) {
        const itemInfo = SIMBOLOS.find(s => s.icono === s1);
        const mult = itemInfo ? itemInfo.mult : 10;
        const ganancia = apuesta * mult;
        fichas += ganancia;
        guardarSaldo(fichas);

        const esJackpot = s1 === '7️⃣';
        reproducirPremio(esJackpot);

        display.innerText = esJackpot 
            ? `🔥 ¡¡¡MEGA JACKPOT 777!!! GANASTE $${ganancia} (${mult}x) 🔥` 
            : `🎉 ¡TRIPLE ${s1}! ¡Ganaste $${ganancia} (${mult}x)!`;
        display.className = "w-full bg-black/90 border border-amber-400 rounded-xl p-3 text-center min-h-[48px] flex items-center justify-center font-black text-base sm:text-xl text-amber-300 shadow-[0_0_20px_#f59e0b]";
    }
    // Comprobar 2 iguales (Pareja)
    else if (s1 === s2 || s2 === s3 || s1 === s3) {
        const ganancia = Math.round(apuesta * 1.5);
        fichas += ganancia;
        guardarSaldo(fichas);
        reproducirPremio(false);

        display.innerText = `✨ ¡Par conseguido! Cobraste $${ganancia} (1.5x)`;
        display.className = "w-full bg-black/90 border border-emerald-500/60 rounded-xl p-3 text-center min-h-[48px] flex items-center justify-center font-bold text-base sm:text-lg text-emerald-300 shadow-inner";
    }
    // Sin premio
    else {
        display.innerText = "Sin combinaciones premiadas. ¡Vuelve a intentarlo!";
        display.className = "w-full bg-black/90 border border-slate-700 rounded-xl p-3 text-center min-h-[48px] flex items-center justify-center font-semibold text-base sm:text-lg text-slate-400 shadow-inner";
    }
}

// Tecla Espacio para girar
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !girando && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        girarTragamonedas();
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    guardarSaldo(fichas);
});