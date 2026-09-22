/* ==========================================
   LÓGICA COMPLETA DEL JUEGO BLACKJACK (21)
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ESTADO DEL JUEGO
    let baraja = [];
    let manoJugador = [];
    let manoDealer = [];
    let fichas = parseInt(localStorage.getItem('casino_balance')) || 1000;
    let apuestaActual = 50;
    let juegoEnProgreso = false;

    // ELEMENTOS DEL DOM
    const fichasCountEl = document.getElementById('fichas-count');
    const betInputEl = document.getElementById('bet-input');
    const playerCardsEl = document.getElementById('player-cards');
    const dealerCardsEl = document.getElementById('dealer-cards');
    const playerScoreEl = document.getElementById('player-score');
    const dealerScoreEl = document.getElementById('dealer-score');
    const statusBannerEl = document.getElementById('status-banner');
    const statusMessageEl = document.getElementById('status-message');

    // BOTONES
    const btnDeal = document.getElementById('btn-deal');
    const btnHit = document.getElementById('btn-hit');
    const btnStand = document.getElementById('btn-stand');
    const btnDouble = document.getElementById('btn-double');
    const btnClearBet = document.getElementById('btn-clear-bet');

    // PALOS Y VALORES
    const PALOS = [
        { nombre: 'corazones', simbolo: '♥️', color: 'red' },
        { nombre: 'diamantes', simbolo: '♦️', color: 'red' },
        { nombre: 'treboles', simbolo: '♣️', color: 'black' },
        { nombre: 'picas', simbolo: '♠️', color: 'black' }
    ];

    const VALORES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    /* ------------------------------------------
       CREACIÓN Y MEZCLA DE BARAJA
       ------------------------------------------ */
    function crearBaraja() {
        let deck = [];
        for (let palo of PALOS) {
            for (let valor of VALORES) {
                let numValor = 0;
                if (['J', 'Q', 'K'].includes(valor)) {
                    numValor = 10;
                } else if (valor === 'A') {
                    numValor = 11;
                } else {
                    numValor = parseInt(valor);
                }

                deck.push({
                    palo: palo.simbolo,
                    color: palo.color,
                    texto: valor,
                    valor: numValor
                });
            }
        }
        return mezclar(deck);
    }

    function mezclar(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    /* ------------------------------------------
       CÁLCULO DE PUNTUACIÓN (LÓGICA DEL AS)
       ------------------------------------------ */
    function calcularPuntos(mano) {
        let puntos = 0;
        let ases = 0;

        for (let carta of mano) {
            if (carta.oculta) continue; // No contar carta oculta del dealer
            puntos += carta.valor;
            if (carta.texto === 'A') ases++;
        }

        // Convertir Ases de 11 a 1 si nos pasamos de 21
        while (puntos > 21 && ases > 0) {
            puntos -= 10;
            ases--;
        }

        return puntos;
    }

    /* ------------------------------------------
       RENDERIZADO DE CARTAS EN PANTALLA
       ------------------------------------------ */
    function renderizarMano(contenedor, mano) {
        contenedor.innerHTML = '';
        mano.forEach(carta => {
            const cardEl = document.createElement('div');
            cardEl.className = `card ${carta.oculta ? 'back' : carta.color}`;

            if (!carta.oculta) {
                cardEl.innerHTML = `
                    <div class="card-corner">
                        <span class="card-value">${carta.texto}</span>
                        <span class="card-suit-small">${carta.palo}</span>
                    </div>
                    <div class="card-center-suit">${carta.palo}</div>
                    <div class="card-corner transform rotate-180">
                        <span class="card-value">${carta.texto}</span>
                        <span class="card-suit-small">${carta.palo}</span>
                    </div>
                `;
            }
            contenedor.appendChild(cardEl);
        });
    }

    /* ------------------------------------------
       FLUJO PRINCIPAL DEL JUEGO
       ------------------------------------------ */
    function iniciarRonda() {
        const montoApuesta = parseInt(betInputEl.value);

        if (isNaN(montoApuesta) || montoApuesta <= 0) {
            mostrarMensaje('Ingresa una apuesta válida', 'bg-amber-500/90 text-slate-950');
            return;
        }

        if (montoApuesta > fichas) {
            mostrarMensaje('No tienes suficientes fichas', 'bg-red-500/90 text-white');
            return;
        }

        // Restar apuesta
        apuestaActual = montoApuesta;
        fichas -= apuestaActual;
        actualizarFichasUI();

        // Preparar juego
        ocultarMensaje();
        baraja = crearBaraja();
        manoJugador = [baraja.pop(), baraja.pop()];
        manoDealer = [baraja.pop(), { ...baraja.pop(), oculta: true }];

        juegoEnProgreso = true;

        actualizarMapeoEInterfases();

        // Verificar Blackjack Instantáneo
        const puntosJugador = calcularPuntos(manoJugador);
        if (puntosJugador === 21) {
            finalizarRonda('blackjack');
        }
    }

    function pedirCarta() {
        if (!juegoEnProgreso) return;

        manoJugador.push(baraja.pop());
        actualizarMapeoEInterfases();

        // Desactivar Doblar si ya pidió carta
        btnDouble.disabled = true;
        btnDouble.classList.add('opacity-50', 'cursor-not-allowed');

        const puntosJugador = calcularPuntos(manoJugador);
        if (puntosJugador > 21) {
            finalizarRonda('pasado');
        } else if (puntosJugador === 21) {
            plantarse();
        }
    }

    function doblarApuesta() {
        if (!juegoEnProgreso || fichas < apuestaActual) {
            mostrarMensaje('Sin fichas para doblar', 'bg-amber-500/90 text-slate-950');
            return;
        }

        fichas -= apuestaActual;
        apuestaActual *= 2;
        actualizarFichasUI();

        manoJugador.push(baraja.pop());
        actualizarMapeoEInterfases();

        const puntosJugador = calcularPuntos(manoJugador);
        if (puntosJugador > 21) {
            finalizarRonda('pasado');
        } else {
            plantarse();
        }
    }

    function plantarse() {
        if (!juegoEnProgreso) return;

        juegoEnProgreso = false;

        // Revelar carta del dealer
        manoDealer[1].oculta = false;

        // Lógica de la Casa (El dealer pide cartas hasta tener al menos 17)
        while (calcularPuntos(manoDealer) < 17) {
            manoDealer.push(baraja.pop());
        }

        actualizarMapeoEInterfases();

        // Evaluar ganador
        const puntosJugador = calcularPuntos(manoJugador);
        const puntosDealer = calcularPuntos(manoDealer);

        if (puntosDealer > 21) {
            finalizarRonda('dealer_pasado');
        } else if (puntosJugador > puntosDealer) {
            finalizarRonda('ganaste');
        } else if (puntosJugador < puntosDealer) {
            finalizarRonda('perdiste');
        } else {
            finalizarRonda('empate');
        }
    }

    function finalizarRonda(resultado) {
        juegoEnProgreso = false;

        // Revelar la carta oculta del dealer si aún no se reveló
        if (manoDealer.length > 1 && manoDealer[1].oculta) {
            manoDealer[1].oculta = false;
        }

        actualizarMapeoEInterfases();

        switch (resultado) {
            case 'blackjack':
                const gananciaBJ = Math.floor(apuestaActual * 2.5);
                fichas += gananciaBJ;
                mostrarMensaje(`¡BLACKJACK! Ganaste $${gananciaBJ}`, 'bg-emerald-500 text-slate-950');
                break;
            case 'ganaste':
            case 'dealer_pasado':
                const ganancia = apuestaActual * 2;
                fichas += ganancia;
                mostrarMensaje(`¡Ganaste la ronda! +$${ganancia}`, 'bg-emerald-600 text-white');
                break;
            case 'empate':
                fichas += apuestaActual;
                mostrarMensaje('Empate (Push). Recuperas tu apuesta.', 'bg-slate-700 text-slate-100');
                break;
            case 'pasado':
                mostrarMensaje('Te pasaste de 21. Perdiste.', 'bg-red-600 text-white');
                break;
            case 'perdiste':
                mostrarMensaje('Gana la casa.', 'bg-red-600 text-white');
                break;
        }

        actualizarFichasUI();
        actualizarBotonesUI();
    }

    /* ------------------------------------------
       ACTUALIZACIÓN DE INTERFAZ (UI)
       ------------------------------------------ */
    function actualizarMapeoEInterfases() {
        renderizarMano(playerCardsEl, manoJugador);
        renderizarMano(dealerCardsEl, manoDealer);

        playerScoreEl.innerText = calcularPuntos(manoJugador);
        dealerScoreEl.innerText = calcularPuntos(manoDealer);

        actualizarBotonesUI();
    }

    function actualizarFichasUI() {
        fichasCountEl.innerText = fichas;
        localStorage.setItem('casino_balance', fichas);
    }

    function actualizarBotonesUI() {
        btnDeal.disabled = juegoEnProgreso;
        betInputEl.disabled = juegoEnProgreso;

        if (juegoEnProgreso) {
            btnDeal.classList.add('opacity-50', 'cursor-not-allowed');

            btnHit.disabled = false;
            btnHit.classList.remove('opacity-50', 'cursor-not-allowed');

            btnStand.disabled = false;
            btnStand.classList.remove('opacity-50', 'cursor-not-allowed');

            // Habilitar Doblar solo si tiene fichas y es el primer turno
            if (manoJugador.length === 2 && fichas >= apuestaActual) {
                btnDouble.disabled = false;
                btnDouble.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                btnDouble.disabled = true;
                btnDouble.classList.add('opacity-50', 'cursor-not-allowed');
            }
        } else {
            btnDeal.classList.remove('opacity-50', 'cursor-not-allowed');

            btnHit.disabled = true;
            btnHit.classList.add('opacity-50', 'cursor-not-allowed');

            btnStand.disabled = true;
            btnStand.classList.add('opacity-50', 'cursor-not-allowed');

            btnDouble.disabled = true;
            btnDouble.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    function mostrarMensaje(texto, clases) {
        statusMessageEl.innerText = texto;
        statusBannerEl.className = `z-20 text-center py-2 px-6 rounded-2xl font-bold text-base sm:text-xl transition-all duration-300 transform scale-100 opacity-100 shadow-xl ${clases}`;
    }

    function ocultarMensaje() {
        statusBannerEl.className = 'z-20 text-center py-2 px-6 rounded-2xl font-bold text-lg transition-all duration-300 transform opacity-0 scale-95 pointer-events-none';
    }

    /* ------------------------------------------
       EVENT LISTENERS
       ------------------------------------------ */
    btnDeal.addEventListener('click', iniciarRonda);
    btnHit.addEventListener('click', pedirCarta);
    btnStand.addEventListener('click', plantarse);
    btnDouble.addEventListener('click', doblarApuesta);

    // Botones de apuestas rápidas (+10, +25, etc.)
    document.querySelectorAll('[data-chip]').forEach(button => {
        button.addEventListener('click', () => {
            if (juegoEnProgreso) return;
            const incremento = parseInt(button.getAttribute('data-chip'));
            let valActual = parseInt(betInputEl.value) || 0;
            betInputEl.value = Math.min(valActual + incremento, fichas);
        });
    });

    btnClearBet.addEventListener('click', () => {
        if (!juegoEnProgreso) betInputEl.value = 10;
    });

    window.addEventListener('casino-balance-changed', (e) => {
        fichas = Number(e.detail.balance);
        actualizarFichasUI();
        actualizarBotonesUI();
    });

    // Inicializar interfaz vacía
    actualizarFichasUI();
    actualizarBotonesUI();
});