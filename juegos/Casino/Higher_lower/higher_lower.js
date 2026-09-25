const PALOS = [
    { simbolo: '♠', color: 'black' },
    { simbolo: '♣', color: 'black' },
    { simbolo: '♥', color: 'red' },
    { simbolo: '♦', color: 'red' }
];

const NOMBRES = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

// Gestión de saldo global del casino
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
let racha = 0;
let mejorRacha = parseInt(localStorage.getItem('hl_best')) || 0;
let apuestaActual = 50;
let premioAcumulado = 0;
let enJuego = false;
let cartaActual = generarCarta();

function generarCarta() {
    const valor = Math.floor(Math.random() * 14) + 1; // 1 al 14 (As=14)
    const paloInfo = PALOS[Math.floor(Math.random() * PALOS.length)];
    return {
        valor: valor,
        nombre: NOMBRES[valor] || valor.toString(),
        palo: paloInfo.simbolo,
        color: paloInfo.color
    };
}

function renderizarCarta(carta) {
    const cardDiv = document.createElement('div');
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
    return cardDiv;
}

function mostrarCartaActual() {
    const slot = document.getElementById('current-card-slot');
    slot.innerHTML = '';
    slot.appendChild(renderizarCarta(cartaActual));
}

function sumarApuesta(monto) {
    if (enJuego) return;
    const input = document.getElementById('bet-input');
    let val = parseInt(input.value) || 0;
    val += monto;
    if (val > fichas) val = fichas;
    input.value = val;
}

function reiniciarApuesta() {
    if (enJuego) return;
    document.getElementById('bet-input').value = 10;
}

function adivinar(esMayor) {
    const betInput = document.getElementById('bet-input');
    const monto = parseInt(betInput.value) || 10;

    // Si aún no está en juego, descontar la apuesta inicial
    if (!enJuego) {
        if (monto > fichas || monto <= 0) {
            mostrarMensaje("¡Saldo insuficiente o apuesta inválida!", "text-rose-400");
            return;
        }
        fichas -= monto;
        guardarSaldo(fichas);
        apuestaActual = monto;
        premioAcumulado = monto;
        enJuego = true;
        betInput.disabled = true;
    }

    let siguienteCarta;
    // Evitar carta exactamente idéntica de valor para dinamismo
    do {
        siguienteCarta = generarCarta();
    } while (siguienteCarta.valor === cartaActual.valor);

    // Revelar siguiente carta con animación
    const nextSlot = document.getElementById('next-card-slot');
    nextSlot.innerHTML = '';
    nextSlot.appendChild(renderizarCarta(siguienteCarta));

    const acierto = esMayor
        ? siguienteCarta.valor > cartaActual.valor
        : siguienteCarta.valor < cartaActual.valor;

    if (acierto) {
        racha++;
        // Multiplicador progresivo (+50% acumulado por ronda)
        premioAcumulado = Math.round(premioAcumulado * 1.5);
        document.getElementById('streak').innerText = racha;
        document.getElementById('current-prize').innerText = `$${premioAcumulado}`;
        document.getElementById('btn-cashout').disabled = false;

        mostrarMensaje(`¡Correcto! ${siguienteCarta.nombre}${siguienteCarta.palo}. Premio: $${premioAcumulado}`, "text-emerald-400");

        if (racha > mejorRacha) {
            mejorRacha = racha;
            localStorage.setItem('hl_best', mejorRacha);
            document.getElementById('best-streak').innerText = mejorRacha;
        }

        // Transicionar la siguiente carta al puesto actual
        setTimeout(() => {
            cartaActual = siguienteCarta;
            mostrarCartaActual();
            nextSlot.innerHTML = '<div class="card back"></div>';
        }, 900);

    } else {
        // Fallo
        mostrarMensaje(`¡Fallaste! Salió ${siguienteCarta.nombre}${siguienteCarta.palo}. Perdiste la ronda.`, "text-rose-400");
        reiniciarRonda();
    }
}

function cobrar() {
    if (!enJuego || premioAcumulado <= 0) return;

    fichas += premioAcumulado;
    guardarSaldo(fichas);
    mostrarMensaje(`🎉 ¡Has cobrado un premio de $${premioAcumulado}!`, "text-amber-300");

    reiniciarRonda();
}

function reiniciarRonda() {
    enJuego = false;
    racha = 0;
    premioAcumulado = 0;
    document.getElementById('streak').innerText = '0';
    document.getElementById('current-prize').innerText = '$0';
    document.getElementById('btn-cashout').disabled = true;
    document.getElementById('bet-input').disabled = false;

    setTimeout(() => {
        cartaActual = generarCarta();
        mostrarCartaActual();
        document.getElementById('next-card-slot').innerHTML = '<div class="card back"></div>';
    }, 1500);
}

function mostrarMensaje(texto, colorClass) {
    const banner = document.getElementById('status-banner');
    banner.className = `text-center py-2 px-6 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 ${colorClass}`;
    banner.innerText = texto;
}

window.addEventListener('casino-balance-changed', (e) => {
    fichas = Number(e.detail.balance);
    guardarSaldo(fichas);
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    guardarSaldo(fichas);
    document.getElementById('best-streak').innerText = mejorRacha;
    mostrarCartaActual();
});