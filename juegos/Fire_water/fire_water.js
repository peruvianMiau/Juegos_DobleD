const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ESTADO DEL JUEGO ---
let nivelActual = 1;
const TOTAL_NIVELES = 5;
let juegoTerminado = false;
let nivelCompletado = false;

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
        this.w = 24;
        this.h = 32;
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
                this.vy = -10.5;
                this.enSuelo = false;
            }
        } else if (this.tipo === 'agua') {
            if (keys['ArrowLeft']) this.vx -= 0.8;
            if (keys['ArrowRight']) this.vx += 0.8;
            if (keys['ArrowUp'] && this.enSuelo) {
                this.vy = -10.5;
                this.enSuelo = false;
            }
        }

        // Aplicar Física
        this.vx *= FRICCION;
        this.vy += GRAVEDAD;

        // Movimiento X + Colisiones
        this.x += this.vx;
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

// --- DEFINICIÓN DE LOS 5 NIVELES ---
const NIVELES = [
    // Nivel 1: Introducción
    {
        plataformas: [
            {x: 0, y: 460, w: 800, h: 40}, // Suelo base
            {x: 150, y: 360, w: 200, h: 20},
            {x: 450, y: 360, w: 200, h: 20},
            {x: 300, y: 250, w: 200, h: 20},
            {x: 50, y: 150, w: 250, h: 20},
            {x: 500, y: 150, w: 250, h: 20}
        ],
        charcos: [
            {x: 200, y: 450, w: 120, h: 10, tipo: 'fuego'},
            {x: 480, y: 450, w: 120, h: 10, tipo: 'agua'}
        ],
        gemas: [
            {x: 180, y: 320, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 580, y: 320, w: 15, h: 15, tipo: 'agua', tomada: false},
            {x: 390, y: 210, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 410, y: 210, w: 15, h: 15, tipo: 'agua', tomada: false}
        ],
        puertaFuego: {x: 100, y: 90, w: 35, h: 60},
        puertaAgua: {x: 650, y: 90, w: 35, h: 60},
        spawnFuego: {x: 50, y: 410},
        spawnAgua: {x: 700, y: 410}
    },
    // Nivel 2: Lagos cruzados
    {
        plataformas: [
            {x: 0, y: 460, w: 800, h: 40},
            {x: 100, y: 350, w: 600, h: 20},
            {x: 0, y: 240, w: 300, h: 20},
            {x: 500, y: 240, w: 300, h: 20},
            {x: 250, y: 130, w: 300, h: 20}
        ],
        charcos: [
            {x: 250, y: 340, w: 150, h: 10, tipo: 'agua'},
            {x: 420, y: 340, w: 150, h: 10, tipo: 'fuego'}
        ],
        gemas: [
            {x: 320, y: 300, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 460, y: 300, w: 15, h: 15, tipo: 'agua', tomada: false},
            {x: 120, y: 200, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 660, y: 200, w: 15, h: 15, tipo: 'agua', tomada: false}
        ],
        puertaFuego: {x: 350, y: 70, w: 35, h: 60},
        puertaAgua: {x: 410, y: 70, w: 35, h: 60},
        spawnFuego: {x: 30, y: 410},
        spawnAgua: {x: 730, y: 410}
    },
    // Nivel 3: El veneno mortal (Ácido verde)
    {
        plataformas: [
            {x: 0, y: 460, w: 800, h: 40},
            {x: 200, y: 370, w: 100, h: 20},
            {x: 500, y: 370, w: 100, h: 20},
            {x: 350, y: 270, w: 100, h: 20},
            {x: 100, y: 170, w: 600, h: 20}
        ],
        charcos: [
            {x: 150, y: 450, w: 500, h: 10, tipo: 'acido'},
            {x: 300, y: 160, w: 200, h: 10, tipo: 'fuego'}
        ],
        gemas: [
            {x: 240, y: 330, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 540, y: 330, w: 15, h: 15, tipo: 'agua', tomada: false},
            {x: 390, y: 230, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 390, y: 120, w: 15, h: 15, tipo: 'agua', tomada: false}
        ],
        puertaFuego: {x: 150, y: 110, w: 35, h: 60},
        puertaAgua: {x: 610, y: 110, w: 35, h: 60},
        spawnFuego: {x: 30, y: 410},
        spawnAgua: {x: 730, y: 410}
    },
    // Nivel 4: Torres de precisión
    {
        plataformas: [
            {x: 0, y: 460, w: 800, h: 40},
            {x: 180, y: 380, w: 80, h: 20},
            {x: 360, y: 320, w: 80, h: 20},
            {x: 540, y: 260, w: 80, h: 20},
            {x: 0, y: 180, w: 250, h: 20},
            {x: 550, y: 180, w: 250, h: 20}
        ],
        charcos: [
            {x: 100, y: 450, w: 600, h: 10, tipo: 'acido'},
            {x: 50, y: 170, w: 100, h: 10, tipo: 'agua'},
            {x: 650, y: 170, w: 100, h: 10, tipo: 'fuego'}
        ],
        gemas: [
            {x: 210, y: 340, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 390, y: 280, w: 15, h: 15, tipo: 'agua', tomada: false},
            {x: 570, y: 220, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 100, y: 130, w: 15, h: 15, tipo: 'agua', tomada: false}
        ],
        puertaFuego: {x: 700, y: 120, w: 35, h: 60},
        puertaAgua: {x: 30, y: 120, w: 35, h: 60},
        spawnFuego: {x: 20, y: 410},
        spawnAgua: {x: 740, y: 410}
    },
    // Nivel 5: El templo final
    {
        plataformas: [
            {x: 0, y: 460, w: 800, h: 40},
            {x: 100, y: 360, w: 150, h: 20},
            {x: 550, y: 360, w: 150, h: 20},
            {x: 300, y: 280, w: 200, h: 20},
            {x: 0, y: 180, w: 800, h: 20}
        ],
        charcos: [
            {x: 100, y: 450, w: 250, h: 10, tipo: 'fuego'},
            {x: 450, y: 450, w: 250, h: 10, tipo: 'agua'},
            {x: 100, y: 170, w: 250, h: 10, tipo: 'agua'},
            {x: 450, y: 170, w: 250, h: 10, tipo: 'fuego'},
            {x: 330, y: 270, w: 140, h: 10, tipo: 'acido'}
        ],
        gemas: [
            {x: 160, y: 320, w: 15, h: 15, tipo: 'agua', tomada: false},
            {x: 610, y: 320, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 390, y: 230, w: 15, h: 15, tipo: 'fuego', tomada: false},
            {x: 410, y: 230, w: 15, h: 15, tipo: 'agua', tomada: false}
        ],
        puertaFuego: {x: 360, y: 390, w: 35, h: 60},
        puertaAgua: {x: 410, y: 390, w: 35, h: 60},
        spawnFuego: {x: 20, y: 410},
        spawnAgua: {x: 740, y: 410}
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
    const overlay = document.getElementById('overlay');
    document.getElementById('modal-title').innerText = "¡Derrota!";
    document.getElementById('modal-title').style.color = "#ef4444";
    document.getElementById('modal-msg').innerText = mensaje;

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

        const overlay = document.getElementById('overlay');
        document.getElementById('modal-title').innerText = nivelActual === TOTAL_NIVELES ? "¡JUEGO COMPLETADO! 🏆" : "¡Nivel Completado!";
        document.getElementById('modal-title').style.color = "#22c55e";
        document.getElementById('modal-msg').innerText = nivelActual === TOTAL_NIVELES ? "¡Increíble! Han superado todos los templos juntos." : "Ambos jugadores llegaron a las puertas con todas las gemas.";

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