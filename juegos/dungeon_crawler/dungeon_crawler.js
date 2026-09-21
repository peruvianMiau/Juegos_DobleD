// Dungeon Crawler - Generación Procedural de Mazmorras, Niebla de Guerra, Enemigos, Cofres, Llaves, Trampas y Jefes

const canvas = document.getElementById('dungeonCanvas');
const ctx = canvas.getContext('2d');

const COLS = 26;
const ROWS = 20;
const TILE_W = canvas.width / COLS; // ~24.6px
const TILE_H = canvas.height / ROWS; // 24px

// Web Audio API
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'step') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.04);
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (type === 'attack') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'chest') {
            [440, 554, 659, 880].forEach((f, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.frequency.setValueAtTime(f, now + i * 0.06);
                g.gain.setValueAtTime(0.08, now + i * 0.06);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
                o.start(now + i * 0.06);
                o.stop(now + i * 0.06 + 0.15);
            });
        } else if (type === 'trap') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.setValueAtTime(160, now + 0.08);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'unlock') {
            [587, 880].forEach((f, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.frequency.setValueAtTime(f, now + i * 0.08);
                g.gain.setValueAtTime(0.12, now + i * 0.08);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
                o.start(now + i * 0.08);
                o.stop(now + i * 0.08 + 0.2);
            });
        } else if (type === 'victory') {
            [523, 659, 783, 1046, 1318].forEach((f, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.frequency.setValueAtTime(f, now + i * 0.1);
                g.gain.setValueAtTime(0.15, now + i * 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
                o.start(now + i * 0.1);
                o.stop(now + i * 0.1 + 0.3);
            });
        }
    } catch (e) {}
}

// Estados del Jugador
let jugador = {
    x: 0,
    y: 0,
    hpMax: 100,
    hp: 100,
    llaves: 0,
    pociones: 1,
    ataque: 20
};

// Mapa: 0 = Muro, 1 = Suelo, 2 = Puerta Cerrada, 3 = Puerta Abierta, 4 = Trampa
let mapa = [];
let niebla = []; // true = descubierta

let cofres = []; // { x, y, abierto, item }
let enemigos = []; // { x, y, hp, hpMax, ataque, nombre, avatar, esJefe }
let trampas = []; // { x, y, activada }

let juegoTerminado = false;

// Generador Procedural de Mazmorras
function generarNuevaMazmorra() {
    juegoTerminado = false;
    document.getElementById('dungeon-modal').classList.add('hidden');

    jugador.hp = jugador.hpMax;
    jugador.llaves = 0;
    jugador.pociones = 1;

    // Inicializar matriz con muros
    mapa = [];
    niebla = [];
    for (let r = 0; r < ROWS; r++) {
        mapa[r] = [];
        niebla[r] = [];
        for (let c = 0; c < COLS; c++) {
            mapa[r][c] = 0; // Muro
            niebla[r][c] = false; // Oculto
        }
    }

    cofres = [];
    enemigos = [];
    trampas = [];

    // Crear habitaciones aleatorias
    const habitaciones = [];
    const NUM_HABITACIONES = 6;

    for (let i = 0; i < 30; i++) {
        if (habitaciones.length >= NUM_HABITACIONES) break;

        const w = Math.floor(Math.random() * 4) + 4; // 4 a 7
        const h = Math.floor(Math.random() * 3) + 4; // 4 a 6
        const x = Math.floor(Math.random() * (COLS - w - 2)) + 1;
        const y = Math.floor(Math.random() * (ROWS - h - 2)) + 1;

        // Comprobar colisión con habitaciones previas
        let solapa = false;
        for (let hab of habitaciones) {
            if (
                x <= hab.x + hab.w + 1 &&
                x + w + 1 >= hab.x &&
                y <= hab.y + hab.h + 1 &&
                y + h + 1 >= hab.y
            ) {
                solapa = true;
                break;
            }
        }

        if (!solapa) {
            habitaciones.push({ x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) });
            // Excavar suelo
            for (let r = y; r < y + h; r++) {
                for (let c = x; c < x + w; c++) {
                    mapa[r][c] = 1;
                }
            }
        }
    }

    // Conectar habitaciones consecutivas con pasillos
    for (let i = 0; i < habitaciones.length - 1; i++) {
        const hA = habitaciones[i];
        const hB = habitaciones[i + 1];

        // Pasillo horizontal
        let x1 = Math.min(hA.cx, hB.cx);
        let x2 = Math.max(hA.cx, hB.cx);
        for (let x = x1; x <= x2; x++) {
            mapa[hA.cy][x] = 1;
        }

        // Pasillo vertical
        let y1 = Math.min(hA.cy, hB.cy);
        let y2 = Math.max(hA.cy, hB.cy);
        for (let y = y1; y <= y2; y++) {
            mapa[y][hB.cx] = 1;
        }
    }

    // Ubicar al Jugador en la primera habitación
    jugador.x = habitaciones[0].cx;
    jugador.y = habitaciones[0].cy;

    // Habitación del Jefe (la última habitación)
    const habJefe = habitaciones[habitaciones.length - 1];

    // Colocar Puerta Cerrada en el acceso a la sala del jefe
    let puertaColocada = false;
    for (let r = habJefe.y - 1; r <= habJefe.y + habJefe.h; r++) {
        for (let c = habJefe.x - 1; c <= habJefe.x + habJefe.w; c++) {
            if (mapa[r] && mapa[r][c] === 1) {
                // Si es borde de la habitación
                if (r === habJefe.y - 1 || r === habJefe.y + habJefe.h || c === habJefe.x - 1 || c === habJefe.x + habJefe.w) {
                    mapa[r][c] = 2; // Puerta con candado
                    puertaColocada = true;
                    break;
                }
            }
        }
        if (puertaColocada) break;
    }

    // Jefe Final en el centro de la sala
    enemigos.push({
        x: habJefe.cx,
        y: habJefe.cy,
        hpMax: 110,
        hp: 110,
        ataque: 22,
        nombre: 'Señor Oscuro',
        avatar: '👑',
        esJefe: true
    });

    // Colocar Llave en una habitación intermedia (habitación 2 o en un cofre)
    const habLlave = habitaciones[Math.min(2, habitaciones.length - 2)];
    cofres.push({
        x: habLlave.x + 1,
        y: habLlave.y + 1,
        abierto: false,
        item: 'llave'
    });

    // Colocar Cofres adicionales con pociones
    for (let i = 1; i < habitaciones.length - 1; i++) {
        if (i !== 2) {
            cofres.push({
                x: habitaciones[i].x + 1,
                y: habitaciones[i].y + 1,
                abierto: false,
                item: 'pocion'
            });
        }
    }

    // Colocar Trampas en pasillos o habitaciones intermedias
    for (let i = 1; i < habitaciones.length; i++) {
        const h = habitaciones[i];
        trampas.push({
            x: h.x + Math.floor(Math.random() * (h.w - 2)) + 1,
            y: h.y + Math.floor(Math.random() * (h.h - 2)) + 1,
            activada: false
        });
    }

    // Colocar Enemigos regulares en las habitaciones intermedias
    const tipos = [
        { nombre: 'Esqueleto Guardián', avatar: '💀', hp: 35, ataque: 12 },
        { nombre: 'Murciélago Espectral', avatar: '🦇', hp: 25, ataque: 10 },
        { nombre: 'Orco Saqueador', avatar: '👹', hp: 50, ataque: 16 }
    ];

    for (let i = 1; i < habitaciones.length - 1; i++) {
        const h = habitaciones[i];
        const t = tipos[Math.floor(Math.random() * tipos.length)];
        enemigos.push({
            x: h.cx,
            y: h.cy,
            hpMax: t.hp,
            hp: t.hp,
            ataque: t.ataque,
            nombre: t.nombre,
            avatar: t.avatar,
            esJefe: false
        });
    }

    revelarNiebla();
    actualizarUI();
    dibujar();
    mostrarBanner("¡Explora las salas! Encuentra la llave 🔑 para abrir la puerta del Jefe.");
}

// Revelar Niebla de Guerra en radio de visión
function revelarNiebla() {
    const radio = 4;
    for (let r = Math.max(0, jugador.y - radio); r <= Math.min(ROWS - 1, jugador.y + radio); r++) {
        for (let c = Math.max(0, jugador.x - radio); c <= Math.min(COLS - 1, jugador.x + radio); c++) {
            const dist = Math.hypot(c - jugador.x, r - jugador.y);
            if (dist <= radio + 0.5) {
                niebla[r][c] = true;
            }
        }
    }
}

function actualizarUI() {
    document.getElementById('player-hp-display').innerText = `${jugador.hp} / ${jugador.hpMax}`;
    document.getElementById('player-keys-display').innerText = jugador.llaves;
    document.getElementById('player-pots-display').innerText = jugador.pociones;
}

function mostrarBanner(msg) {
    const banner = document.getElementById('dungeon-banner');
    banner.innerText = msg;
}

// Movimiento e Interacción del Jugador
function moverJugador(dx, dy) {
    if (juegoTerminado) return;

    const nx = jugador.x + dx;
    const ny = jugador.y + dy;

    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;

    // 1. ¿Hay un enemigo en esa celda? -> Combatir
    const enemigo = enemigos.find(e => e.x === nx && e.y === ny);
    if (enemigo) {
        atacarEnemigo(enemigo);
        return;
    }

    // 2. ¿Es una puerta con candado?
    if (mapa[ny][nx] === 2) {
        if (jugador.llaves > 0) {
            jugador.llaves--;
            mapa[ny][nx] = 3; // Puerta abierta
            playSound('unlock');
            mostrarBanner("🔓 ¡Has abierto la puerta con la Llave!");
            actualizarUI();
            dibujar();
        } else {
            mostrarBanner("🔒 La puerta está cerrada con candado. ¡Busca la Llave!");
        }
        return;
    }

    // 3. ¿Es un muro?
    if (mapa[ny][nx] === 0) {
        return;
    }

    // Mover
    jugador.x = nx;
    jugador.y = ny;
    playSound('step');
    revelarNiebla();

    // 4. ¿Hay un cofre?
    const cofre = cofres.find(c => c.x === nx && c.y === ny && !c.abierto);
    if (cofre) {
        cofre.abierto = true;
        playSound('chest');
        if (cofre.item === 'llave') {
            jugador.llaves++;
            mostrarBanner("🔑 ¡Encontraste una Llave Antigua dentro del cofre!");
        } else {
            jugador.pociones++;
            mostrarBanner("🧪 ¡Encontraste una Poción de Vida dentro del cofre!");
        }
        actualizarUI();
    }

    // 5. ¿Hay una trampa en el suelo?
    const trampa = trampas.find(t => t.x === nx && t.y === ny && !t.activada);
    if (trampa) {
        trampa.activada = true;
        jugador.hp = Math.max(0, jugador.hp - 15);
        playSound('trap');
        mostrarBanner("⚡ ¡Pisaste una trampa de pinchos! (-15 HP)");
        actualizarUI();
        if (jugador.hp <= 0) {
            finalizarJuego(false);
            return;
        }
    }

    // Mover levemente a los enemigos no jefe hacia el jugador si están cerca
    moverEnemigosCercanos();

    actualizarUI();
    dibujar();
}

function atacarEnemigo(enemigo) {
    playSound('attack');
    const danio = jugador.ataque + Math.floor(Math.random() * 6);
    enemigo.hp -= danio;

    if (enemigo.hp <= 0) {
        mostrarBanner(`⚔️ ¡Has derrotado a ${enemigo.nombre}!`);
        enemigos = enemigos.filter(e => e !== enemigo);

        if (enemigo.esJefe) {
            playSound('victory');
            finalizarJuego(true);
            return;
        }
    } else {
        // Contraataque del enemigo
        const contra = Math.max(3, enemigo.ataque + Math.floor(Math.random() * 5) - 3);
        jugador.hp = Math.max(0, jugador.hp - contra);
        mostrarBanner(`⚔️ Golpeas a ${enemigo.nombre} (-${danio} HP). ¡Te contraataca (-${contra} HP)!`);

        if (jugador.hp <= 0) {
            finalizarJuego(false);
            return;
        }
    }

    actualizarUI();
    dibujar();
}

function moverEnemigosCercanos() {
    for (let e of enemigos) {
        if (e.esJefe) continue; // El jefe guarda el centro de su sala

        const dist = Math.hypot(e.x - jugador.x, e.y - jugador.y);
        if (dist <= 3.5 && dist > 1) {
            const dx = Math.sign(jugador.x - e.x);
            const dy = Math.sign(jugador.y - e.y);

            const nx = e.x + (Math.random() < 0.5 ? dx : 0);
            const ny = e.y + (Math.random() < 0.5 ? dy : 0);

            if (mapa[ny] && mapa[ny][nx] === 1 && !enemigos.some(other => other !== e && other.x === nx && other.y === ny) && !(jugador.x === nx && jugador.y === ny)) {
                e.x = nx;
                e.y = ny;
            }
        }
    }
}

function beberPocion() {
    if (juegoTerminado) return;
    if (jugador.pociones <= 0) {
        mostrarBanner("❌ No tienes pociones de vida disponibles.");
        return;
    }
    if (jugador.hp >= jugador.hpMax) {
        mostrarBanner("⚠️ Ya tienes la vida al máximo.");
        return;
    }

    jugador.pociones--;
    jugador.hp = Math.min(jugador.hpMax, jugador.hp + 40);
    playSound('chest');
    mostrarBanner("💚 Has bebido una Poción (+40 HP).");
    actualizarUI();
    dibujar();
}

function finalizarJuego(victoria) {
    juegoTerminado = true;
    const modal = document.getElementById('dungeon-modal');
    const title = document.getElementById('dungeon-modal-title');
    const msg = document.getElementById('dungeon-modal-msg');

    modal.classList.remove('hidden');

    if (victoria) {
        title.innerText = "¡MAZMORRA PURIFICADA! 👑";
        title.className = "text-3xl sm:text-4xl font-black text-amber-400";
        msg.innerText = "¡Has derrotado al temible Señor Oscuro y reclamado el tesoro ancestral!";
    } else {
        title.innerText = "¡HAS CAÍDO EN LA MAZMORRA! 💀";
        title.className = "text-3xl sm:text-4xl font-black text-rose-500";
        msg.innerText = "Tus fuerzas sucumbieron ante la oscuridad. ¡Intenta otra mazmorra!";
    }
}

// Renderizado Gráfico en Canvas
function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * TILE_W;
            const y = r * TILE_H;

            // Niebla absoluta
            if (!niebla[r][c]) {
                ctx.fillStyle = '#020617';
                ctx.fillRect(x, y, TILE_W + 0.5, TILE_H + 0.5);
                continue;
            }

            const tipo = mapa[r][c];

            // 1. Fondo de baldosa
            if (tipo === 0) {
                // Muro
                ctx.fillStyle = '#1e293b';
                ctx.fillRect(x, y, TILE_W + 0.5, TILE_H + 0.5);
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, TILE_W, TILE_H);
            } else {
                // Suelo
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(x, y, TILE_W + 0.5, TILE_H + 0.5);
                ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
                ctx.strokeRect(x, y, TILE_W, TILE_H);
            }

            // Puerta cerrada
            if (tipo === 2) {
                ctx.fillStyle = '#b45309';
                ctx.fillRect(x + 2, y + 2, TILE_W - 4, TILE_H - 4);
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🚪', x + TILE_W / 2, y + TILE_H / 2);
            } else if (tipo === 3) {
                // Puerta abierta
                ctx.fillStyle = '#451a03';
                ctx.fillRect(x + 2, y + 2, TILE_W - 4, TILE_H - 4);
            }
        }
    }

    // 2. Trampas visibles
    for (let t of trampas) {
        if (niebla[t.y][t.x]) {
            const x = t.x * TILE_W;
            const y = t.y * TILE_H;
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(t.activada ? '💥' : '⚡', x + TILE_W / 2, y + TILE_H / 2);
        }
    }

    // 3. Cofres
    for (let c of cofres) {
        if (niebla[c.y][c.x]) {
            const x = c.x * TILE_W;
            const y = c.y * TILE_H;
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(c.abierto ? '📦' : '🎁', x + TILE_W / 2, y + TILE_H / 2);
        }
    }

    // 4. Enemigos
    for (let e of enemigos) {
        if (niebla[e.y][e.x]) {
            const x = e.x * TILE_W;
            const y = e.y * TILE_H;

            // Avatar
            ctx.font = e.esJefe ? '18px sans-serif' : '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.avatar, x + TILE_W / 2, y + TILE_H / 2);

            // Barra de vida
            const pct = Math.max(0, e.hp / e.hpMax);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(x + 2, y - 3, (TILE_W - 4) * pct, 3);
        }
    }

    // 5. Jugador
    const jx = jugador.x * TILE_W;
    const jy = jugador.y * TILE_H;

    // Resplandor del Jugador
    ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
    ctx.beginPath();
    ctx.arc(jx + TILE_W / 2, jy + TILE_H / 2, TILE_W * 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧙', jx + TILE_W / 2, jy + TILE_H / 2);
}

// Teclado
window.addEventListener('keydown', (e) => {
    const code = e.code;
    if (code === 'ArrowUp' || code === 'KeyW') {
        e.preventDefault();
        moverJugador(0, -1);
    } else if (code === 'ArrowDown' || code === 'KeyS') {
        e.preventDefault();
        moverJugador(0, 1);
    } else if (code === 'ArrowLeft' || code === 'KeyA') {
        e.preventDefault();
        moverJugador(-1, 0);
    } else if (code === 'ArrowRight' || code === 'KeyD') {
        e.preventDefault();
        moverJugador(1, 0);
    } else if (code === 'KeyP') {
        beberPocion();
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    generarNuevaMazmorra();
});
