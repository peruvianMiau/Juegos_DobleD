const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ESTADO DEL JUEGO ---
let nivelActual = 1;
const TOTAL_NIVELES = 5;
let juegoTerminado = false;
let nivelCompletado = false;

// Variables de Cronómetro
let tiempoInicio = 0;
let tiempoTranscurrido = 0;
let timerInterval;

// Teclas presionadas
const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// --- MOTOR DE FÍSICAS ---
const GRAVEDAD = 0.5;
const FRICCION = 0.85;

class Jugador {
    constructor(x, y, color, tipo) {
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.w = 18;
        this.h = 26;
        this.vx = 0;
        this.vy = 0;
        this.color = color;
        this.tipo = tipo; // 'fuego' o 'agua'
        this.enSuelo = false;
        this.gemas = 0;
        this.enPuerta = false;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.vx = 0;
        this.vy = 0;
        this.enSuelo = false;
        this.gemas = 0;
        this.enPuerta = false;
    }

    update(plataformas) {
        // Movimiento Horizontal
        if (this.tipo === 'fuego') {
            if (keys['KeyA']) this.vx -= 0.8;
            if (keys['KeyD']) this.vx += 0.8;
            if (keys['KeyW'] && this.enSuelo) {
                this.vy = -11;
                this.enSuelo = false;
            }
        } else if (this.tipo === 'agua') {
            if (keys['ArrowLeft']) this.vx -= 0.8;
            if (keys['ArrowRight']) this.vx += 0.8;
            if (keys['ArrowUp'] && this.enSuelo) {
                this.vy = -11;
                this.enSuelo = false;
            }
        }

        // Aplicar Física
        this.vx *= FRICCION;
        this.vy += GRAVEDAD;

        // Movimiento X + Colisiones con Plataformas
        this.x += this.vx;

        // MUROS LATERALES Y TECHO ESTRICTOS (Evitan salir del mapa)
        if (this.x < 10) {
            this.x = 10;
            this.vx = 0;
        }
        if (this.x + this.w > canvas.width - 10) {
            this.x = canvas.width - 10 - this.w;
            this.vx = 0;
        }
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
        }

        for (let p of plataformas) {
            if (colision(this, p)) {
                if (this.vx > 0) this.x = p.x - this.w;
                else if (this.vx < 0) this.x = p.x + p.w;
                this.vx = 0;
            }
        }

        // Movimiento Y + Colisiones
        this.y += this.vy;
        this.enSuelo = false;

        for (let p of plataformas) {
            if (colision(this, p)) {
                if (this.vy > 0) { // Cayendo
                    this.y = p.y - this.h;
                    this.vy = 0;
                    this.enSuelo = true;
                } else if (this.vy < 0) { // Saltando
                    this.y = p.y + p.h;
                    this.vy = 0;
                }
            }
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.shadowBlur = 0;

        // Ojos
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 4, this.y + 6, 5, 5);
        ctx.fillRect(this.x + 15, this.y + 6, 5, 5);
    }
}

function colision(r1, r2) {
    return r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y;
}

// Funciones del Cronómetro
function iniciarTimer() {
    clearInterval(timerInterval);
    tiempoInicio = Date.now();
    document.getElementById('timer-display').innerText = "00:00";

    timerInterval = setInterval(() => {
        if (!juegoTerminado) {
            tiempoTranscurrido = Math.floor((Date.now() - tiempoInicio) / 1000);
            const mins = String(Math.floor(tiempoTranscurrido / 60)).padStart(2, '0');
            const secs = String(tiempoTranscurrido % 60).padStart(2, '0');
            document.getElementById('timer-display').innerText = `${mins}:${secs}`;
        }
    }, 1000);
}

// --- DEFINICIÓN DE LOS 5 NIVELES ---
const NIVELES = [
    // Nivel 1: El Laberinto de Ascenso Cruzado
    {
        plataformas: [
            // Marcos externos y piso base
            {x: 0, y: 660, w: 1000, h: 40},
            {x: 0, y: 0, w: 20, h: 700},
            {x: 980, y: 0, w: 20, h: 700},
            {x: 0, y: 0, w: 1000, h: 20},

            // Ruta Fuego (Ascenso Izquierdo)
            {x: 20, y: 560, w: 250, h: 20},  // Escalón 1
            {x: 200, y: 460, w: 150, h: 20}, // Escalón 2

            // Ruta Agua (Ascenso Derecho)
            {x: 730, y: 560, w: 250, h: 20}, // Escalón 1
            {x: 650, y: 460, w: 150, h: 20}, // Escalón 2

            // Puente central compartido
            {x: 350, y: 360, w: 300, h: 20},

            // Plataformas superiores cruzadas (Zonas de las puertas)
            {x: 20, y: 260, w: 270, h: 20},  // Arriba Izquierda (Destino Agua)
            {x: 710, y: 260, w: 270, h: 20}, // Arriba Derecha (Destino Fuego)

            // Muros divisorios estructurales (Crean los corredores y fuerzan las rutas)
            {x: 490, y: 460, w: 20, h: 200}, // Divide la zona inferior impidiendo paso directo
            {x: 270, y: 260, w: 20, h: 120}, // Obliga a subir al puente desde la izquierda
            {x: 710, y: 260, w: 20, h: 120}  // Obliga a subir al puente desde la derecha
        ],
        charcos: [
            {x: 270, y: 650, w: 220, h: 10, tipo: 'fuego'}, // Peligro para Agua en el nivel inferior
            {x: 510, y: 650, w: 220, h: 10, tipo: 'agua'},  // Peligro para Fuego en el nivel inferior
            {x: 450, y: 350, w: 100, h: 10, tipo: 'acido'}  // Peligro central compartido en el puente
        ],
        gemas: [
            // Gemas de Fuego (Ruta izquierda y final derecho)
            {x: 260, y: 410, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 820, y: 210, w: 15, h: 15, tipo: 'fuego', tomada: false},
            // Gemas de Agua (Ruta derecha y final izquierdo)
            {x: 720, y: 410, w: 15, h: 15, tipo: 'agua', tomada: false},
            {x: 160, y: 210, w: 15, h: 15, tipo: 'agua', tomada: false}
        ],
        puertaFuego: {x: 880, y: 200, w: 35, h: 60}, // Fuego debe cruzar todo hacia la derecha
        puertaAgua: {x: 80, y: 200, w: 35, h: 60},   // Agua debe cruzar todo hacia la izquierda
        spawnFuego: {x: 50, y: 610},
        spawnAgua: {x: 900, y: 610}
    },
    // Nivel 2: Torres Entrelazadas (Ascenso zig-zag)
    {
        plataformas: [
            {x: 0, y: 660, w: 1000, h: 40}, {x: 0, y: 0, w: 20, h: 700}, {x: 980, y: 0, w: 20, h: 700}, {x: 0, y: 0, w: 1000, h: 20},
            // Suelos segmentados
            {x: 150, y: 560, w: 700, h: 20}, {x: 150, y: 440, w: 700, h: 20}, {x: 150, y: 320, w: 700, h: 20}, {x: 150, y: 200, w: 700, h: 20},
            // Huecos y Muros que fuerzan el camino
            {x: 150, y: 440, w: 20, h: 140}, {x: 830, y: 320, w: 20, h: 140}, {x: 150, y: 200, w: 20, h: 140}
        ],
        charcos: [
            {x: 250, y: 550, w: 150, h: 10, tipo: 'fuego'}, {x: 600, y: 550, w: 150, h: 10, tipo: 'agua'},
            {x: 400, y: 430, w: 200, h: 10, tipo: 'acido'},
            {x: 200, y: 310, w: 150, h: 10, tipo: 'agua'}, {x: 650, y: 310, w: 150, h: 10, tipo: 'fuego'}
        ],
        gemas: [
            {x: 320, y: 510, w: 15, h: 15, tipo: 'fuego', tomada: false}, {x: 670, y: 510, w: 15, h: 15, tipo: 'agua', tomada: false},
            {x: 800, y: 390, w: 15, h: 15, tipo: 'fuego', tomada: false}, {x: 200, y: 270, w: 15, h: 15, tipo: 'agua', tomada: false}
        ],
        puertaFuego: {x: 850, y: 140, w: 35, h: 60},
        puertaAgua: {x: 910, y: 140, w: 35, h: 60},
        spawnFuego: {x: 50, y: 610},
        spawnAgua: {x: 930, y: 610}
    },
    // Nivel 3: El Foso Letal (Precisión de caída)
    {
        plataformas: [
            {x: 0, y: 660, w: 1000, h: 40}, {x: 0, y: 0, w: 20, h: 700}, {x: 980, y: 0, w: 20, h: 700}, {x: 0, y: 0, w: 1000, h: 20},
            // Estructura superior (Spawn)
            {x: 20, y: 150, w: 300, h: 20}, {x: 680, y: 150, w: 300, h: 20},
            // Plataformas pequeñas flotantes
            {x: 380, y: 250, w: 60, h: 20}, {x: 560, y: 250, w: 60, h: 20},
            {x: 470, y: 380, w: 60, h: 20},
            {x: 250, y: 480, w: 100, h: 20}, {x: 650, y: 480, w: 100, h: 20},
            // Paredes para dificultar saltos horizontales
            {x: 470, y: 150, w: 20, h: 100}, {x: 510, y: 150, w: 20, h: 100},
            {x: 320, y: 350, w: 20, h: 150}, {x: 660, y: 350, w: 20, h: 150}
        ],
        charcos: [
            {x: 20, y: 650, w: 450, h: 10, tipo: 'acido'},
            {x: 530, y: 650, w: 450, h: 10, tipo: 'acido'}
        ],
        gemas: [
            {x: 400, y: 210, w: 15, h: 15, tipo: 'fuego', tomada: false}, {x: 580, y: 210, w: 15, h: 15, tipo: 'agua', tomada: false},
            {x: 490, y: 340, w: 15, h: 15, tipo: 'fuego', tomada: false}, {x: 490, y: 300, w: 15, h: 15, tipo: 'agua', tomada: false}
        ],
        puertaFuego: {x: 460, y: 600, w: 35, h: 60},
        puertaAgua: {x: 505, y: 600, w: 35, h: 60},
        spawnFuego: {x: 50, y: 100},
        spawnAgua: {x: 930, y: 100}
    },
    // Nivel 4: Galerías Subterráneas
    {
        plataformas: [
            {x: 0, y: 660, w: 1000, h: 40}, {x: 0, y: 0, w: 20, h: 700}, {x: 980, y: 0, w: 20, h: 700},
            // Tres pisos largos
            {x: 100, y: 500, w: 880, h: 20}, {x: 20, y: 340, w: 880, h: 20}, {x: 100, y: 180, w: 880, h: 20},
            // Bloqueos verticales (Muros cortos que obligan a saltar preciso)
            {x: 300, y: 500, w: 20, h: 100}, {x: 600, y: 500, w: 20, h: 100},
            {x: 400, y: 340, w: 20, h: 100}, {x: 700, y: 340, w: 20, h: 100}
        ],
        charcos: [
            {x: 150, y: 650, w: 200, h: 10, tipo: 'agua'}, {x: 550, y: 650, w: 200, h: 10, tipo: 'fuego'},
            {x: 350, y: 490, w: 200, h: 10, tipo: 'fuego'}, {x: 650, y: 490, w: 200, h: 10, tipo: 'acido'},
            {x: 200, y: 330, w: 150, h: 10, tipo: 'acido'}, {x: 750, y: 330, w: 100, h: 10, tipo: 'agua'}
        ],
        gemas: [
            {x: 310, y: 590, w: 15, h: 15, tipo: 'fuego', tomada: false}, {x: 610, y: 590, w: 15, h: 15, tipo: 'agua', tomada: false},
            {x: 410, y: 430, w: 15, h: 15, tipo: 'agua', tomada: false}, {x: 710, y: 430, w: 15, h: 15, tipo: 'fuego', tomada: false}
        ],
        puertaFuego: {x: 880, y: 120, w: 35, h: 60},
        puertaAgua: {x: 930, y: 120, w: 35, h: 60},
        spawnFuego: {x: 50, y: 610},
        spawnAgua: {x: 930, y: 610}
    },
    // Nivel 5: El Templo de la Agilidad
    {
        plataformas: [
            {x: 0, y: 660, w: 1000, h: 40}, {x: 0, y: 0, w: 20, h: 700}, {x: 980, y: 0, w: 20, h: 700},
            // Plataformas base
            {x: 20, y: 560, w: 150, h: 20}, {x: 830, y: 560, w: 150, h: 20},
            {x: 250, y: 480, w: 500, h: 20},
            {x: 100, y: 360, w: 200, h: 20}, {x: 700, y: 360, w: 200, h: 20},
            {x: 400, y: 260, w: 200, h: 20},
            // Paredes que encierran a los personajes
            {x: 250, y: 480, w: 20, h: 180}, {x: 730, y: 480, w: 20, h: 180},
            {x: 400, y: 100, w: 20, h: 160}, {x: 580, y: 100, w: 20, h: 160}
        ],
        charcos: [
            {x: 270, y: 650, w: 460, h: 10, tipo: 'acido'}, // Un gran foso central
            {x: 350, y: 470, w: 100, h: 10, tipo: 'agua'}, {x: 550, y: 470, w: 100, h: 10, tipo: 'fuego'}
        ],
        gemas: [
            {x: 300, y: 430, w: 15, h: 15, tipo: 'agua', tomada: false}, {x: 680, y: 430, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 150, y: 320, w: 15, h: 15, tipo: 'fuego', tomada: false}, {x: 800, y: 320, w: 15, h: 15, tipo: 'agua', tomada: false}
        ],
        puertaFuego: {x: 440, y: 200, w: 35, h: 60},
        puertaAgua: {x: 520, y: 200, w: 35, h: 60},
        spawnFuego: {x: 50, y: 610},
        spawnAgua: {x: 930, y: 610}
    }
];

// Instancias de personajes
const jugadorFuego = new Jugador(0, 0, '#ef4444', 'fuego');
const jugadorAgua = new Jugador(0, 0, '#38bdf8', 'agua');

function cargarNivel(num) {
    const mapa = NIVELES[num - 1];

    jugadorFuego.startX = mapa.spawnFuego.x;
    jugadorFuego.startY = mapa.spawnFuego.y;
    jugadorFuego.reset();

    jugadorAgua.startX = mapa.spawnAgua.x;
    jugadorAgua.startY = mapa.spawnAgua.y;
    jugadorAgua.reset();

    mapa.gemas.forEach(g => g.tomada = false);

    juegoTerminado = false;
    nivelCompletado = false;

    document.getElementById('level-display').innerText = num;
    document.getElementById('overlay').classList.add('hidden');
    actualizarUI();

    // Iniciar cronómetro para el nuevo nivel
    iniciarTimer();
}

function actualizarUI() {
    const mapa = NIVELES[nivelActual - 1];
    const totalGemasFuego = mapa.gemas.filter(g => g.tipo === 'fuego').length;
    const totalGemasAgua = mapa.gemas.filter(g => g.tipo === 'agua').length;

    document.getElementById('fire-gems').innerText = `${jugadorFuego.gemas} / ${totalGemasFuego}`;
    document.getElementById('water-gems').innerText = `${jugadorAgua.gemas} / ${totalGemasAgua}`;
}

function reiniciarNivel(mensaje) {
    juegoTerminado = true;
    clearInterval(timerInterval); // Se detiene el cronómetro

    const overlay = document.getElementById('overlay');
    document.getElementById('modal-title').innerText = "¡Derrota!";
    document.getElementById('modal-title').style.color = "#ef4444";
    document.getElementById('modal-msg').innerHTML = `<p>${mensaje}</p>`;

    const btn = document.getElementById('btn-action');
    btn.innerText = "Reintentar";
    btn.onclick = () => cargarNivel(nivelActual);

    overlay.classList.remove('hidden');
}

function comprobarVictoria() {
    const mapa = NIVELES[nivelActual - 1];
    const totalGemasFuego = mapa.gemas.filter(g => g.tipo === 'fuego').length;
    const totalGemasAgua = mapa.gemas.filter(g => g.tipo === 'agua').length;

    const tieneTodasGemas = (jugadorFuego.gemas === totalGemasFuego) && (jugadorAgua.gemas === totalGemasAgua);

    jugadorFuego.enPuerta = colision(jugadorFuego, mapa.puertaFuego);
    jugadorAgua.enPuerta = colision(jugadorAgua, mapa.puertaAgua);

    if (tieneTodasGemas && jugadorFuego.enPuerta && jugadorAgua.enPuerta && !nivelCompletado) {
        nivelCompletado = true;
        juegoTerminado = true;
        clearInterval(timerInterval); // Detener timer al ganar

        // Asignación de Rango según el tiempo
        let rango = "C";
        let colorRango = "text-slate-400";
        if (tiempoTranscurrido <= 15) { rango = "S"; colorRango = "text-amber-400"; }
        else if (tiempoTranscurrido <= 25) { rango = "A"; colorRango = "text-purple-400"; }
        else if (tiempoTranscurrido <= 40) { rango = "B"; colorRango = "text-blue-400"; }

        const overlay = document.getElementById('overlay');
        document.getElementById('modal-title').innerText = nivelActual === TOTAL_NIVELES ? "¡JUEGO COMPLETADO! 🏆" : "¡Nivel Completado!";
        document.getElementById('modal-title').style.color = "#22c55e";

        document.getElementById('modal-msg').innerHTML = `
            Han recogido todas las gemas y llegado a las puertas.
            <div class="mt-5 bg-slate-950/80 p-5 rounded-2xl border border-slate-700/60 shadow-inner inline-block w-full">
                <div class="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                    <span class="text-slate-400 uppercase text-xs font-bold">Tiempo Superado</span>
                    <span class="font-mono text-cyan-400 text-lg">${tiempoTranscurrido}s</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-slate-400 uppercase text-xs font-bold">Rango Obtenido</span>
                    <span class="text-3xl font-black drop-shadow-md ${colorRango}">${rango}</span>
                </div>
            </div>
        `;

        const btn = document.getElementById('btn-action');
        if (nivelActual < TOTAL_NIVELES) {
            btn.innerText = "Siguiente Nivel";
            btn.onclick = () => {
                nivelActual++;
                cargarNivel(nivelActual);
            };
        } else {
            btn.innerText = "Volver a Jugar";
            btn.onclick = () => {
                nivelActual = 1;
                cargarNivel(1);
            };
        }

        overlay.classList.remove('hidden');
    }
}

// --- BUCLE PRINCIPAL DE RENDERIZADO ---
function update() {
    if (!juegoTerminado) {
        const mapa = NIVELES[nivelActual - 1];

        jugadorFuego.update(mapa.plataformas);
        jugadorAgua.update(mapa.plataformas);

        // Interacción con Gemas
        mapa.gemas.forEach(g => {
            if (!g.tomada) {
                if (g.tipo === 'fuego' && colision(jugadorFuego, g)) {
                    g.tomada = true;
                    jugadorFuego.gemas++;
                    actualizarUI();
                } else if (g.tipo === 'agua' && colision(jugadorAgua, g)) {
                    g.tomada = true;
                    jugadorAgua.gemas++;
                    actualizarUI();
                }
            }
        });

        // Interacción con Charcos de Elementos / Ácido
        mapa.charcos.forEach(c => {
            if (colision(jugadorFuego, c)) {
                if (c.tipo === 'agua') reiniciarNivel("Fuego cayó en el agua y se apagó.");
                if (c.tipo === 'acido') reiniciarNivel("Fuego cayó en el ácido mortal.");
            }
            if (colision(jugadorAgua, c)) {
                if (c.tipo === 'fuego') reiniciarNivel("Agua cayó en la lava y se evaporó.");
                if (c.tipo === 'acido') reiniciarNivel("Agua cayó en el ácido mortal.");
            }
        });

        comprobarVictoria();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const mapa = NIVELES[nivelActual - 1];

    // 1. Dibujar Puertas
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(mapa.puertaFuego.x, mapa.puertaFuego.y, mapa.puertaFuego.w, mapa.puertaFuego.h);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(mapa.puertaAgua.x, mapa.puertaAgua.y, mapa.puertaAgua.w, mapa.puertaAgua.h);

    // 2. Dibujar Plataformas
    ctx.fillStyle = '#334155';
    mapa.plataformas.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

    // Dibujar visualmente los Muros Laterales para que el jugador note el encierro
    ctx.fillStyle = '#1e293b'; // Color un poco más oscuro que las plataformas
    ctx.fillRect(0, 0, 10, canvas.height); // Muro Izquierdo
    ctx.fillRect(canvas.width - 10, 0, 10, canvas.height); // Muro Derecho

    // 3. Dibujar Charcos (Lava/Agua/Ácido)
    mapa.charcos.forEach(c => {
        if (c.tipo === 'fuego') ctx.fillStyle = '#f97316';
        else if (c.tipo === 'agua') ctx.fillStyle = '#38bdf8';
        else if (c.tipo === 'acido') ctx.fillStyle = '#22c55e';
        ctx.fillRect(c.x, c.y, c.w, c.h);
    });

    // 4. Dibujar Gemas
    mapa.gemas.forEach(g => {
        if (!g.tomada) {
            ctx.fillStyle = g.tipo === 'fuego' ? '#ef4444' : '#0284c7';
            ctx.beginPath();
            ctx.arc(g.x + g.w / 2, g.y + g.h / 2, g.w / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // 5. Dibujar Jugadores
    jugadorFuego.draw();
    jugadorAgua.draw();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Iniciar Juego
cargarNivel(1);
gameLoop();