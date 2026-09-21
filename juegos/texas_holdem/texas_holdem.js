// Texas Hold'em Poker Completo: 2 cartas por jugador, 5 comunitarias, bots con IA y evaluador de 7 a 5 cartas

const PALOS = [
    { simbolo: '♠', color: 'black' },
    { simbolo: '♣', color: 'black' },
    { simbolo: '♥', color: 'red' },
    { simbolo: '♦', color: 'red' }
];

const NOMBRES = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

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

let fichasJugador = obtenerSaldo();
let fichasBot1 = 1000;
let fichasBot2 = 1000;

let baraja = [];
let cartasJugador = [];
let cartasBot1 = [];
let cartasBot2 = [];
let cartasComunitarias = [];

let bote = 0;
let apuestaActualRonda = 0;
let apuestaJugadorRonda = 0;
let apuestaBot1Ronda = 0;
let apuestaBot2Ronda = 0;

let jugadorActivo = true;
let bot1Activo = true;
let bot2Activo = true;

// Fases: 'preflop', 'flop', 'turn', 'river', 'showdown'
let faseJuego = 'espera';

// Baraja y Cartas
function crearBaraja() {
    let mazo = [];
    for (let p of PALOS) {
        for (let v = 2; v <= 14; v++) {
            mazo.push({
                valor: v,
                nombre: NOMBRES[v] || v.toString(),
                palo: p.simbolo,
                color: p.color
            });
        }
    }
    // Barajar Fisher-Yates
    for (let i = mazo.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }
    return mazo;
}

function renderizarCarta(carta, oculta = false) {
    const cardDiv = document.createElement('div');
    if (oculta) {
        cardDiv.className = 'card back';
        return cardDiv;
    }
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

// Iniciar Nueva Mano
function iniciarNuevaMano() {
    if (fichasJugador < 20) {
        actualizarMensaje("¡No tienes suficientes fichas para la ciega ($20)!", "text-rose-400");
        return;
    }

    baraja = crearBaraja();
    cartasComunitarias = [];
    bote = 0;
    apuestaActualRonda = 20;

    // Ciegas obligatorias de $20
    fichasJugador -= 20;
    guardarSaldo(fichasJugador);
    apuestaJugadorRonda = 20;

    fichasBot1 = Math.max(0, fichasBot1 - 20);
    apuestaBot1Ronda = 20;

    fichasBot2 = Math.max(0, fichasBot2 - 20);
    apuestaBot2Ronda = 20;

    bote = 60;
    actualizarMarcadores();

    jugadorActivo = true;
    bot1Activo = true;
    bot2Activo = true;

    document.getElementById('bot1-status').innerText = 'Activo';
    document.getElementById('bot2-status').innerText = 'Activo';

    // Repartir 2 cartas a cada uno
    cartasJugador = [baraja.pop(), baraja.pop()];
    cartasBot1 = [baraja.pop(), baraja.pop()];
    cartasBot2 = [baraja.pop(), baraja.pop()];

    renderizarMesa();

    faseJuego = 'preflop';
    document.getElementById('game-stage').innerText = 'Pre-Flop';
    document.getElementById('btn-start').disabled = true;

    actualizarMensaje("Ronda Pre-Flop. Tus 2 cartas han sido repartidas. ¿Qué decides?", "text-emerald-300");
    evaluarManoJugadorActual();
    habilitarControlesJugador(true);
}

function renderizarMesa(revelarBots = false) {
    // Jugador
    const playerBox = document.getElementById('player-cards');
    playerBox.innerHTML = '';
    cartasJugador.forEach(c => playerBox.appendChild(renderizarCarta(c)));

    // Bot 1
    const b1Box = document.getElementById('bot1-cards');
    b1Box.innerHTML = '';
    cartasBot1.forEach(c => b1Box.appendChild(renderizarCarta(c, !revelarBots)));

    // Bot 2
    const b2Box = document.getElementById('bot2-cards');
    b2Box.innerHTML = '';
    cartasBot2.forEach(c => b2Box.appendChild(renderizarCarta(c, !revelarBots)));

    // Comunitarias
    const commBox = document.getElementById('community-cards');
    commBox.innerHTML = '';
    cartasComunitarias.forEach(c => commBox.appendChild(renderizarCarta(c)));

    // Rellenar espacios vacíos de comunitarias con dorsos
    for (let i = cartasComunitarias.length; i < 5; i++) {
        const slot = document.createElement('div');
        slot.className = 'card back opacity-30';
        commBox.appendChild(slot);
    }
}

function actualizarMarcadores() {
    document.getElementById('pot-amount').innerText = `$${bote}`;
    document.getElementById('bot1-chips').innerText = fichasBot1;
    document.getElementById('bot2-chips').innerText = fichasBot2;
    guardarSaldo(fichasJugador);
}

function habilitarControlesJugador(habilitar) {
    document.getElementById('btn-fold').disabled = !habilitar;
    document.getElementById('btn-check-call').disabled = !habilitar;
    document.getElementById('btn-raise').disabled = !habilitar;
    document.getElementById('btn-allin').disabled = !habilitar;

    if (habilitar) {
        const diff = apuestaActualRonda - apuestaJugadorRonda;
        document.getElementById('btn-check-call').innerText = diff > 0 ? `Igualar $${diff} (Call)` : "Pasar (Check)";
    }
}

// Acciones del Jugador
function accionJugador(tipo) {
    if (faseJuego === 'espera' || faseJuego === 'showdown') return;

    if (tipo === 'fold') {
        jugadorActivo = false;
        actualizarMensaje("Te has retirado de la mano.", "text-slate-400");
        document.getElementById('player-hand-desc').innerText = "Retirado";
        habilitarControlesJugador(false);
        ejecutarRondaBots();
        return;
    }

    if (tipo === 'call') {
        const diff = Math.max(0, apuestaActualRonda - apuestaJugadorRonda);
        if (diff > 0) {
            let pago = Math.min(fichasJugador, diff);
            fichasJugador -= pago;
            bote += pago;
            apuestaJugadorRonda += pago;
            actualizarMensaje(`Has igualado $${pago}.`, "text-cyan-300");
        } else {
            actualizarMensaje("Has pasado (Check).", "text-cyan-300");
        }
    } else if (tipo === 'raise') {
        const aumento = 40;
        const totalReq = (apuestaActualRonda - apuestaJugadorRonda) + aumento;
        let pago = Math.min(fichasJugador, totalReq);
        fichasJugador -= pago;
        bote += pago;
        apuestaJugadorRonda += pago;
        apuestaActualRonda = apuestaJugadorRonda;
        actualizarMensaje(`¡Has subido la apuesta a $${apuestaActualRonda}!`, "text-amber-300");
    } else if (tipo === 'allin') {
        let pago = fichasJugador;
        fichasJugador = 0;
        bote += pago;
        apuestaJugadorRonda += pago;
        if (apuestaJugadorRonda > apuestaActualRonda) {
            apuestaActualRonda = apuestaJugadorRonda;
        }
        actualizarMensaje(`🔥 ¡Has ido ALL-IN con $${pago}!`, "text-purple-400");
    }

    actualizarMarcadores();
    habilitarControlesJugador(false);

    // Turno de la IA
    setTimeout(ejecutarRondaBots, 700);
}

// Inteligencia Artificial de los Bots
function turnoBot(botNombre, cartasBot, fichasBot, apuestaBot) {
    const diff = apuestaActualRonda - apuestaBot;
    const sieteCartas = [...cartasBot, ...cartasComunitarias];
    const evaluacion = cartasComunitarias.length >= 3 
        ? evaluarMejorManoDe7(sieteCartas) 
        : null;

    // Fuerza preflop simple basada en parejas o cartas altas
    let fuerzaPreflop = (cartasBot[0].valor === cartasBot[1].valor) ? 8 : (cartasBot[0].valor >= 11 || cartasBot[1].valor >= 11 ? 5 : 2);

    let decision = 'call'; // pasar / igualar

    if (cartasComunitarias.length < 3) {
        // Pre-flop
        if (diff > 40 && fuerzaPreflop < 5) decision = 'fold';
        else if (fuerzaPreflop >= 8 && Math.random() > 0.4) decision = 'raise';
        else decision = 'call';
    } else {
        // Post-flop (evaluación completa de mano)
        const tier = evaluacion.score[0];
        if (tier >= 3) { // Trío o mejor
            decision = Math.random() > 0.3 ? 'raise' : 'call';
        } else if (tier >= 1) { // Pareja o doble pareja
            decision = diff > 50 ? (Math.random() > 0.4 ? 'call' : 'fold') : 'call';
        } else {
            // Carta alta
            decision = diff > 0 ? (Math.random() > 0.7 ? 'call' : 'fold') : 'call';
        }
    }

    return decision;
}

function ejecutarRondaBots() {
    // Bot 1
    if (bot1Activo) {
        const dec1 = turnoBot('Carlos', cartasBot1, fichasBot1, apuestaBot1Ronda);
        if (dec1 === 'fold') {
            bot1Activo = false;
            document.getElementById('bot1-status').innerText = 'Retirado (Fold)';
        } else if (dec1 === 'raise' && fichasBot1 >= 40) {
            const pago = Math.min(fichasBot1, (apuestaActualRonda - apuestaBot1Ronda) + 40);
            fichasBot1 -= pago;
            bote += pago;
            apuestaBot1Ronda += pago;
            apuestaActualRonda = apuestaBot1Ronda;
            document.getElementById('bot1-status').innerText = 'Subió +$40';
        } else {
            const diff = Math.min(fichasBot1, Math.max(0, apuestaActualRonda - apuestaBot1Ronda));
            fichasBot1 -= diff;
            bote += diff;
            apuestaBot1Ronda += diff;
            document.getElementById('bot1-status').innerText = diff > 0 ? `Igualó $${diff}` : 'Pasó (Check)';
        }
    }

    // Bot 2
    if (bot2Activo) {
        const dec2 = turnoBot('Elena', cartasBot2, fichasBot2, apuestaBot2Ronda);
        if (dec2 === 'fold') {
            bot2Activo = false;
            document.getElementById('bot2-status').innerText = 'Retirado (Fold)';
        } else if (dec2 === 'raise' && fichasBot2 >= 40) {
            const pago = Math.min(fichasBot2, (apuestaActualRonda - apuestaBot2Ronda) + 40);
            fichasBot2 -= pago;
            bote += pago;
            apuestaBot2Ronda += pago;
            apuestaActualRonda = apuestaBot2Ronda;
            document.getElementById('bot2-status').innerText = 'Subió +$40';
        } else {
            const diff = Math.min(fichasBot2, Math.max(0, apuestaActualRonda - apuestaBot2Ronda));
            fichasBot2 -= diff;
            bote += diff;
            apuestaBot2Ronda += diff;
            document.getElementById('bot2-status').innerText = diff > 0 ? `Igualó $${diff}` : 'Pasó (Check)';
        }
    }

    actualizarMarcadores();

    // Comprobar si todos los bots se retiraron
    const activos = [jugadorActivo, bot1Activo, bot2Activo].filter(Boolean).length;
    if (activos <= 1) {
        finalizarPorRetirada();
        return;
    }

    // Avanzar a la siguiente fase
    setTimeout(avanzarFase, 900);
}

function avanzarFase() {
    apuestaActualRonda = 0;
    apuestaJugadorRonda = 0;
    apuestaBot1Ronda = 0;
    apuestaBot2Ronda = 0;

    if (faseJuego === 'preflop') {
        faseJuego = 'flop';
        document.getElementById('game-stage').innerText = 'El Flop (3 cartas)';
        // Quemar 1 y repartir 3
        baraja.pop();
        cartasComunitarias.push(baraja.pop(), baraja.pop(), baraja.pop());
        renderizarMesa();
        actualizarMensaje("Se descubre el Flop (3 cartas comunitarias).", "text-cyan-300");
    } else if (faseJuego === 'flop') {
        faseJuego = 'turn';
        document.getElementById('game-stage').innerText = 'El Turn (4ª carta)';
        baraja.pop();
        cartasComunitarias.push(baraja.pop());
        renderizarMesa();
        actualizarMensaje("Se descubre el Turn (4ª carta comunitaria).", "text-cyan-300");
    } else if (faseJuego === 'turn') {
        faseJuego = 'river';
        document.getElementById('game-stage').innerText = 'El River (5ª carta)';
        baraja.pop();
        cartasComunitarias.push(baraja.pop());
        renderizarMesa();
        actualizarMensaje("Se descubre el River (5ª y última comunitaria). ¡Ronda final!", "text-cyan-300");
    } else if (faseJuego === 'river') {
        faseJuego = 'showdown';
        ejecutarShowdown();
        return;
    }

    evaluarManoJugadorActual();

    if (jugadorActivo) {
        habilitarControlesJugador(true);
    } else {
        setTimeout(ejecutarRondaBots, 800);
    }
}

function evaluarManoJugadorActual() {
    if (cartasComunitarias.length >= 3) {
        const mejor = evaluarMejorManoDe7([...cartasJugador, ...cartasComunitarias]);
        document.getElementById('player-hand-desc').innerText = mejor.tierName;
    } else {
        document.getElementById('player-hand-desc').innerText = `En mano: ${cartasJugador[0].nombre}${cartasJugador[0].palo} ${cartasJugador[1].nombre}${cartasJugador[1].palo}`;
    }
}

// Showdown: Evaluación Final de la Mejor Combinación de 5 Cartas de entre 7
function ejecutarShowdown() {
    document.getElementById('game-stage').innerText = 'Showdown (Mano Final)';
    renderizarMesa(true); // Revelar las cartas ocultas de los bots

    let participantes = [];

    if (jugadorActivo) {
        const evJugador = evaluarMejorManoDe7([...cartasJugador, ...cartasComunitarias]);
        participantes.push({ nombre: 'Tú', evaluacion: evJugador, esJugador: true });
    }
    if (bot1Activo) {
        const evBot1 = evaluarMejorManoDe7([...cartasBot1, ...cartasComunitarias]);
        participantes.push({ nombre: 'Carlos (IA)', evaluacion: evBot1, botId: 'bot1' });
    }
    if (bot2Activo) {
        const evBot2 = evaluarMejorManoDe7([...cartasBot2, ...cartasComunitarias]);
        participantes.push({ nombre: 'Elena (IA)', evaluacion: evBot2, botId: 'bot2' });
    }

    // Ordenar por puntuación descendente
    participantes.sort((a, b) => compararManos(b.evaluacion.score, a.evaluacion.score));

    const ganador = participantes[0];

    if (ganador.esJugador) {
        fichasJugador += bote;
        actualizarMensaje(`🎉 ¡GANASTE EL BOTE DE $${bote}! Tu mano: ${ganador.evaluacion.tierName}`, "text-amber-300");
    } else {
        if (ganador.botId === 'bot1') fichasBot1 += bote;
        else fichasBot2 += bote;
        actualizarMensaje(`Gana ${ganador.nombre} con ${ganador.evaluacion.tierName}. Bote: $${bote}.`, "text-rose-400");
    }

    bote = 0;
    actualizarMarcadores();
    document.getElementById('btn-start').disabled = false;
    habilitarControlesJugador(false);
}

function finalizarPorRetirada() {
    if (jugadorActivo) {
        fichasJugador += bote;
        actualizarMensaje(`🎉 ¡Todos los rivales se retiraron! Ganas el bote de $${bote}.`, "text-amber-300");
    } else if (bot1Activo) {
        fichasBot1 += bote;
        actualizarMensaje(`Carlos (IA) gana el bote de $${bote} por retirada.`, "text-slate-400");
    } else {
        fichasBot2 += bote;
        actualizarMensaje(`Elena (IA) gana el bote de $${bote} por retirada.`, "text-slate-400");
    }
    bote = 0;
    actualizarMarcadores();
    document.getElementById('btn-start').disabled = false;
    habilitarControlesJugador(false);
}

// Evaluador Matemático de 7 Cartas -> Mejor combinación de 5 cartas
function obtenerCombinaciones5de7(siete) {
    let combis = [];
    for (let a = 0; a < 7; a++) {
        for (let b = a + 1; b < 7; b++) {
            for (let c = b + 1; c < 7; c++) {
                for (let d = c + 1; d < 7; d++) {
                    for (let e = d + 1; e < 7; e++) {
                        combis.push([siete[a], siete[b], siete[c], siete[d], siete[e]]);
                    }
                }
            }
        }
    }
    return combis; // 21 combinaciones posibles
}

function evaluar5Cartas(cinco) {
    const valores = cinco.map(c => c.valor).sort((a, b) => b - a);
    const palos = cinco.map(c => c.palo);

    const esColor = palos.every(p => p === palos[0]);

    // Comprobar escalera
    let esEscalera = false;
    let escaleraAlta = valores[0];

    if (valores[0] - valores[4] === 4 && new Set(valores).size === 5) {
        esEscalera = true;
    } else if (valores[0] === 14 && valores[1] === 5 && valores[2] === 4 && valores[3] === 3 && valores[4] === 2) {
        // Escalera con As bajo (A-2-3-4-5)
        esEscalera = true;
        escaleraAlta = 5;
    }

    // Contar frecuencias
    let frec = {};
    valores.forEach(v => frec[v] = (frec[v] || 0) + 1);
    let pares = Object.entries(frec).map(([val, count]) => ({ val: parseInt(val), count }));
    pares.sort((a, b) => b.count - a.count || b.val - a.val);

    // 9: Escalera Real (A-K-Q-J-10 del mismo palo)
    if (esColor && esEscalera && escaleraAlta === 14 && valores[4] === 10) {
        return { score: [9, 14], name: "Escalera Real" };
    }
    // 8: Escalera de Color
    if (esColor && esEscalera) {
        return { score: [8, escaleraAlta], name: `Escalera de Color al ${NOMBRES[escaleraAlta] || escaleraAlta}` };
    }
    // 7: Póker (Four of a Kind)
    if (pares[0].count === 4) {
        return { score: [7, pares[0].val, pares[1].val], name: `Póker de ${NOMBRES[pares[0].val] || pares[0].val}` };
    }
    // 6: Full House
    if (pares[0].count === 3 && pares[1].count === 2) {
        return { score: [6, pares[0].val, pares[1].val], name: `Full House (${NOMBRES[pares[0].val] || pares[0].val} y ${NOMBRES[pares[1].val] || pares[1].val})` };
    }
    // 5: Color (Flush)
    if (esColor) {
        return { score: [5, ...valores], name: `Color (${palos[0]})` };
    }
    // 4: Escalera
    if (esEscalera) {
        return { score: [4, escaleraAlta], name: `Escalera al ${NOMBRES[escaleraAlta] || escaleraAlta}` };
    }
    // 3: Trío
    if (pares[0].count === 3) {
        return { score: [3, pares[0].val, pares[1].val, pares[2].val], name: `Trío de ${NOMBRES[pares[0].val] || pares[0].val}` };
    }
    // 2: Doble Pareja
    if (pares[0].count === 2 && pares[1].count === 2) {
        return { score: [2, pares[0].val, pares[1].val, pares[2].val], name: `Doble Pareja (${NOMBRES[pares[0].val] || pares[0].val} y ${NOMBRES[pares[1].val] || pares[1].val})` };
    }
    // 1: Pareja
    if (pares[0].count === 2) {
        return { score: [1, pares[0].val, pares[1].val, pares[2].val, pares[3].val], name: `Pareja de ${NOMBRES[pares[0].val] || pares[0].val}` };
    }
    // 0: Carta Alta
    return { score: [0, ...valores], name: `Carta Alta (${NOMBRES[valores[0]] || valores[0]})` };
}

function compararManos(scoreA, scoreB) {
    for (let i = 0; i < Math.max(scoreA.length, scoreB.length); i++) {
        const valA = scoreA[i] || 0;
        const valB = scoreB[i] || 0;
        if (valA !== valB) return valA - valB;
    }
    return 0;
}

function evaluarMejorManoDe7(sieteCartas) {
    const combinaciones = obtenerCombinaciones5de7(sieteCartas);
    let mejor = null;

    for (let combi of combinaciones) {
        const ev = evaluar5Cartas(combi);
        if (!mejor || compararManos(ev.score, mejor.score) > 0) {
            mejor = { score: ev.score, tierName: ev.name, cartas: combi };
        }
    }
    return mejor;
}

function actualizarMensaje(msg, colorClass) {
    const el = document.getElementById('dealer-msg');
    el.className = `text-center font-bold text-sm sm:text-base min-h-[28px] ${colorClass}`;
    el.innerText = msg;
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    guardarSaldo(fichasJugador);
    actualizarMarcadores();
});