// RPG por Turnos - Sistema de Combate, Habilidades Elementales, Estados Alterados, Inventario y Niveles

// Web Audio API
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function playSfx(type) {
    try {
        if (!audioCtx) audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'fire') {
            osc.type = 'noise' || 'sawtooth';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'ice') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'heal') {
            [440, 554.37, 659.25, 880].forEach((f, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.frequency.setValueAtTime(f, now + i * 0.07);
                g.gain.setValueAtTime(0.1, now + i * 0.07);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
                o.start(now + i * 0.07);
                o.stop(now + i * 0.07 + 0.2);
            });
        } else if (type === 'levelup') {
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.frequency.setValueAtTime(f, now + i * 0.1);
                g.gain.setValueAtTime(0.15, now + i * 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
                o.start(now + i * 0.1);
                o.stop(now + i * 0.1 + 0.25);
            });
        }
    } catch (e) {}
}

// Paleta de Colores para Pixel Art 16x16
const PALETA = {
    '.': 'transparent',
    'k': '#0f172a', // Contorno oscuro
    'w': '#ffffff', // Blanco
    's': '#94a3b8', // Acero claro
    'S': '#475569', // Acero oscuro
    'g': '#f59e0b', // Dorado
    'G': '#b45309', // Dorado oscuro
    'f': '#fed7aa', // Piel clara
    'F': '#fba872', // Piel sombra
    'r': '#ef4444', // Rojo rubí
    'R': '#991b1b', // Carmesí oscuro
    'b': '#3b82f6', // Azul
    'B': '#1d4ed8', // Azul oscuro
    'p': '#818cf8', // Púrpura índigo
    'P': '#4338ca', // Púrpura oscuro
    'c': '#06b6d4', // Cian hielo
    'C': '#0e7490', // Cian profundo
    'e': '#22c55e', // Verde esmeralda
    'E': '#15803d', // Verde oscuro
    'y': '#fef08a', // Amarillo resplandor
    'o': '#f97316', // Naranja fuego
    'm': '#78350f'  // Cuero marrón
};

// Sprites en Pixel Art 16x16 (Matriz de Caracteres)
const SPRITES_PIXEL = {
    guerrero: [
        "....kkkkkk......",
        "...kggggggk.....",
        "...kgsssggk.....",
        "..kssssssssk....",
        "..ksskkkkssk....",
        "..kskffffksk....",
        "..kskffFfksk....",
        "...kssssssk.....",
        "...kssssssk.....",
        "..kSssssssSk.s..",
        ".kSssssssssksk..",
        ".kSSSSSSSSSksk..",
        "..kSSssssSk.sk..",
        "..ksskksskk.sk..",
        "..ksskksskk.sk..",
        "..kkk..kkk..kk.."
    ],
    mago: [
        ".....kkkk.......",
        "....kPPPPk......",
        "....kPppPk......",
        "...kPppppPk.....",
        "...kggggggk...c.",
        "..kPPPPPPPPk.ccc",
        "..kPPffffPPk..c.",
        "..kPffffffPk..k.",
        "..kPwwwwwkPk..k.",
        "..kPPPPPPPPk..k.",
        ".kPppPppPppk..k.",
        ".kPppPppPppk..k.",
        ".kPppPppPppk..k.",
        "..kPPPPPPPPk..k.",
        "..kmmkkmmkk...k.",
        "..kkk..kkk....k."
    ],
    picaro: [
        "....kkkkkk......",
        "...kEEkkEEk.....",
        "..kEEEEEEEEk....",
        "..kEkkkkkkEk....",
        "..kEkfffffEk....",
        "..kEkffffFEk....",
        "..kEkkkkkkEk.s..",
        "...kEEEEEEk.sk..",
        "...kmmmmmmk.sk..",
        "..kmmmmmmmmksk..",
        ".kEmmmmmmmmkk...",
        ".kEEkEEEEkEEk...",
        ".kEkkEEEEkkEk.s.",
        "..kEkkkkkEk..sk.",
        "..kmmk..kmmk.sk.",
        "..kkk....kkk.kk."
    ],
    paladin: [
        "....yyyyyy......",
        "...kggggggk.....",
        "..kggggggggk....",
        "..kgwkkkkwgk....",
        "..kgkffffkgk....",
        "..kgkffFfkgk....",
        "...kggggggk.....",
        "..kRggggggRk....",
        ".kRRgwwwggRRk.y.",
        ".kRRgwwwggRRkyyy",
        ".kRggggggggRk.y.",
        "..kggggggggk..k.",
        "..kGggggggGk..k.",
        "..kGgkkkkGgk..k.",
        "..kggk..kggk..k.",
        "..kkk....kkk..kk."
    ],
    goblin: [
        "................",
        "..kEkk...kkEk...",
        ".kEEEk...kEEEk..",
        ".kEEeeeeeeEEEk..",
        "..keeeeeeeek....",
        "..keekrkeerke...",
        "..keeeeeeeek....",
        "...kewwwwek..s..",
        "...kmmmmmmk.sk..",
        "..kmmmmmmmmksk..",
        ".kmmmmmmmmmk.k..",
        ".kmmmmmmmmmk....",
        "..kEkk..kkEk....",
        "..keek..keek....",
        "..kmmk..kmmk....",
        "..kkk....kkk...."
    ],
    serpiente: [
        "................",
        ".....kkkkkk.....",
        "....kPPPPPkk....",
        "...kPPyyPyyPk...",
        "...kPPyyPyyPk...",
        "...kPPPwwPPPk...",
        "....kPPwwPPk....",
        "....kPPPPPPk.e..",
        "...kPPPPPPPPke..",
        "..kPPPPPPPPPPk..",
        "..kPPkkkPPPPk...",
        "..kPk...kPPPk...",
        "..kPk..kPPPPk...",
        "..kPkkkPPPPPk...",
        "...kPPPPPPPk....",
        "....kkkkkkk....."
    ],
    magoHielo: [
        ".....ccccc......",
        "....kCCCCk......",
        "...kCCwwCCk...c.",
        "..kCCCCCCCCk.ccc",
        "..kCkkkkkkCk..c.",
        "..kCkcccckCk..k.",
        "..kCkcccckCk..k.",
        "..kCkkkkkkCk..k.",
        "..kCCCCCCCCk..k.",
        ".kCwwCCwwCCk..k.",
        ".kCCwwCCwwCk..k.",
        ".kCCCCCCCCCCk.k.",
        ".kCCCCCCCCCCk.k.",
        "..kCCCkkCCCk..k.",
        "..kwwk..kwwk..k.",
        "..kkk....kkk..k."
    ],
    dragon: [
        "gggg......gggg..",
        "kggk......kggk..",
        ".kRRkkkkkkRRk...",
        ".kRRRRRRRRRRk...",
        "kRRRyyRRyyRRRk..",
        "kRRRyyRRyyRRRk..",
        ".kRRRRRRRRRRk...",
        "..kRRwoowRRk.oo.",
        ".kRRRwoowRRkoooo",
        "kRRRRRRRRRRkoooo",
        "kRRkRRRRRRkRRko.",
        "kk.kRRRRRRk.kk..",
        "...kRRRRRRk.....",
        "...kRkkkkRk.....",
        "...kRk..kRk.....",
        "...kkk..kkk....."
    ]
};

// Función para renderizar Pixel Art sobre cualquier Canvas
function dibujarPixelArt(canvas, spriteMatrix) {
    if (!canvas || !spriteMatrix) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const rows = spriteMatrix.length;
    const cols = spriteMatrix[0].length;
    const scaleX = canvas.width / cols;
    const scaleY = canvas.height / rows;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const char = spriteMatrix[r][c];
            const color = PALETA[char] || 'transparent';
            if (color !== 'transparent') {
                ctx.fillStyle = color;
                ctx.fillRect(Math.floor(c * scaleX), Math.floor(r * scaleY), Math.ceil(scaleX), Math.ceil(scaleY));
            }
        }
    }
}

// Clases de Héroes Seleccionables
const CLASES_HEROES = {
    guerrero: {
        id: 'guerrero',
        nombre: 'Ares',
        clase: 'Caballero de Hierro',
        icono: '🛡️',
        hpMax: 135,
        mpMax: 35,
        ataque: 22,
        defensa: 12,
        desc: 'Tanque colosal con armadura de placas de acero y espadón. Máxima resistencia a daño físico.',
        colorBadge: 'border-amber-500/70 text-amber-300',
        sprite: SPRITES_PIXEL.guerrero
    },
    mago: {
        id: 'mago',
        nombre: 'Valerius',
        clase: 'Archimago Elemental',
        icono: '🔮',
        hpMax: 85,
        mpMax: 90,
        ataque: 27,
        defensa: 5,
        desc: 'Dominio de los elementos arcanos. Enorme reserva de maná para devastadores hechizos.',
        colorBadge: 'border-indigo-500/70 text-indigo-300',
        sprite: SPRITES_PIXEL.mago
    },
    picaro: {
        id: 'picaro',
        nombre: 'Kael',
        clase: 'Asesino Sombrío',
        icono: '🗡️',
        hpMax: 100,
        mpMax: 50,
        ataque: 25,
        defensa: 7,
        desc: 'Ágil y letal. Especialista en golpes críticos y daño rápido con dagas envenenadas.',
        colorBadge: 'border-emerald-500/70 text-emerald-300',
        sprite: SPRITES_PIXEL.picaro
    },
    paladin: {
        id: 'paladin',
        nombre: 'Aurelia',
        clase: 'Cruzada de la Luz',
        icono: '✨',
        hpMax: 115,
        mpMax: 65,
        ataque: 19,
        defensa: 10,
        desc: 'Guerrera bendecida por la luz sagrada. Defensas místicas y sanaciones potenciadas.',
        colorBadge: 'border-yellow-500/70 text-yellow-300',
        sprite: SPRITES_PIXEL.paladin
    }
};

let claseSeleccionadaId = 'guerrero';

// Datos del Héroe
let heroe = {
    nombre: 'Ares',
    clase: 'Caballero de Hierro',
    sprite: SPRITES_PIXEL.guerrero,
    nivel: 1,
    exp: 0,
    expMax: 100,
    hpMax: 135,
    hp: 135,
    mpMax: 35,
    mp: 35,
    ataque: 22,
    defensa: 12,
    defendiendo: false,
    estados: []
};

// Inventario
let inventario = {
    pot_hp: 3,
    pot_mp: 2,
    elixir: 1
};

// Lista de Enemigos con Sprites Pixel Art
const LISTA_ENEMIGOS = [
    {
        nombre: 'Goblin Pícaro',
        tipo: 'Monstruo Común',
        hpMax: 75,
        hp: 75,
        ataque: 14,
        defensa: 4,
        expRecompensa: 60,
        sprite: SPRITES_PIXEL.goblin,
        estados: []
    },
    {
        nombre: 'Serpiente Sombría',
        tipo: 'Bestia Venenosa',
        hpMax: 120,
        hp: 120,
        ataque: 19,
        defensa: 6,
        expRecompensa: 90,
        habilidadEspecial: 'veneno',
        sprite: SPRITES_PIXEL.serpiente,
        estados: []
    },
    {
        nombre: 'Archimago de Escarcha',
        tipo: 'Hechicero Gélido',
        hpMax: 175,
        hp: 175,
        ataque: 26,
        defensa: 8,
        expRecompensa: 140,
        habilidadEspecial: 'hielo',
        sprite: SPRITES_PIXEL.magoHielo,
        estados: []
    },
    {
        nombre: 'Dragón Ígneo Imperial',
        tipo: 'JEFE FINAL 👑',
        hpMax: 320,
        hp: 320,
        ataque: 35,
        defensa: 12,
        expRecompensa: 250,
        habilidadEspecial: 'fuego',
        sprite: SPRITES_PIXEL.dragon,
        estados: []
    }
];

let indiceEnemigoActual = 0;
let enemigoActual = null;
let turnoBloqueado = false;

// Gestión de Selección de Personaje
function abrirSeleccionPersonaje() {
    renderizarModalSeleccion();
    document.getElementById('character-select-modal').classList.remove('hidden');
}

function renderizarModalSeleccion() {
    const container = document.getElementById('class-cards-container');
    container.innerHTML = '';

    Object.values(CLASES_HEROES).forEach(c => {
        const card = document.createElement('div');
        const esSeleccionado = c.id === claseSeleccionadaId;
        card.className = `class-select-card ${esSeleccionado ? 'selected' : ''}`;
        card.onclick = () => seleccionarClase(c.id);

        card.innerHTML = `
            <div class="w-16 h-16 rounded-2xl bg-slate-950 p-1 border border-slate-700 shadow-inner flex items-center justify-center overflow-hidden">
                <canvas width="64" height="64" id="preview-canvas-${c.id}" class="pixel-art-canvas w-full h-full"></canvas>
            </div>
            <div>
                <h4 class="font-black text-slate-100 text-sm">${c.nombre}</h4>
                <span class="text-[11px] font-bold text-indigo-400">${c.clase}</span>
            </div>
            <div class="w-full grid grid-cols-2 gap-1.5 text-[11px] bg-slate-950/70 p-2 rounded-xl border border-slate-800/80">
                <div class="text-rose-400 font-bold">HP: ${c.hpMax}</div>
                <div class="text-cyan-400 font-bold">MP: ${c.mpMax}</div>
                <div class="text-amber-400 font-bold">ATQ: ${c.ataque}</div>
                <div class="text-emerald-400 font-bold">DEF: ${c.defensa}</div>
            </div>
            <p class="text-[10px] text-slate-400 leading-tight">${c.desc}</p>
        `;

        container.appendChild(card);

        // Renderizar el pixel art en el canvas de la tarjeta
        setTimeout(() => {
            const canvasEl = document.getElementById(`preview-canvas-${c.id}`);
            if (canvasEl) dibujarPixelArt(canvasEl, c.sprite);
        }, 10);
    });

    const nombreBtn = document.getElementById('selected-hero-name-btn');
    if (nombreBtn) nombreBtn.innerText = CLASES_HEROES[claseSeleccionadaId].clase;
}

function seleccionarClase(id) {
    claseSeleccionadaId = id;
    renderizarModalSeleccion();
}

function confirmarSeleccionPersonaje() {
    const clase = CLASES_HEROES[claseSeleccionadaId];
    heroe = {
        nombre: clase.nombre,
        clase: clase.clase,
        sprite: clase.sprite,
        nivel: 1,
        exp: 0,
        expMax: 100,
        hpMax: clase.hpMax,
        hp: clase.hpMax,
        mpMax: clase.mpMax,
        mp: clase.mpMax,
        ataque: clase.ataque,
        defensa: clase.defensa,
        defendiendo: false,
        estados: []
    };

    inventario = {
        pot_hp: 3,
        pot_mp: 2,
        elixir: 1
    };

    indiceEnemigoActual = 0;
    document.getElementById('hero-name').innerText = heroe.nombre;
    document.getElementById('hero-class').innerText = heroe.clase;
    dibujarPixelArt(document.getElementById('hero-pixel-canvas'), heroe.sprite);

    document.getElementById('character-select-modal').classList.add('hidden');
    document.getElementById('combat-log').innerHTML = '';
    cargarEnemigo(0);
}

// Inicializar Batalla
function cargarEnemigo(indice) {
    const base = LISTA_ENEMIGOS[indice];
    enemigoActual = {
        ...base,
        hp: base.hpMax,
        estados: []
    };

    document.getElementById('enemy-name').innerText = enemigoActual.nombre;
    document.getElementById('enemy-type').innerText = enemigoActual.tipo;
    dibujarPixelArt(document.getElementById('enemy-pixel-canvas'), enemigoActual.sprite);
    document.getElementById('battle-counter').innerText = `Enemigo ${indice + 1} / ${LISTA_ENEMIGOS.length}`;
    document.getElementById('victory-bar').classList.add('hidden');

    agregarLog(`⚔️ ¡Un <strong>${enemigoActual.nombre}</strong> aparece! Prepárate para el combate.`, 'text-indigo-300 font-bold');
    actualizarUI();
    desbloquearTurnoJugador();
}

// Actualizar Barras de Vida, Maná y Estados
function actualizarUI() {
    // Héroe
    const hPct = Math.max(0, Math.min(100, (heroe.hp / heroe.hpMax) * 100));
    const mPct = Math.max(0, Math.min(100, (heroe.mp / heroe.mpMax) * 100));

    document.getElementById('hero-hp-text').innerText = `${Math.ceil(heroe.hp)} / ${heroe.hpMax}`;
    document.getElementById('hero-hp-bar').style.width = `${hPct}%`;

    document.getElementById('hero-mp-text').innerText = `${Math.ceil(heroe.mp)} / ${heroe.mpMax}`;
    document.getElementById('hero-mp-bar').style.width = `${mPct}%`;

    document.getElementById('hero-level-display').innerText = `Nv. ${heroe.nivel}`;
    document.getElementById('hero-exp-display').innerText = `${heroe.exp} / ${heroe.expMax}`;

    renderizarEstados('hero-status-icons', heroe.estados);

    // Enemigo
    if (enemigoActual) {
        const ePct = Math.max(0, Math.min(100, (enemigoActual.hp / enemigoActual.hpMax) * 100));
        document.getElementById('enemy-hp-text').innerText = `${Math.ceil(enemigoActual.hp)} / ${enemigoActual.hpMax}`;
        document.getElementById('enemy-hp-bar').style.width = `${ePct}%`;
        renderizarEstados('enemy-status-icons', enemigoActual.estados);
    }

    // Inventario cantidades
    document.getElementById('count-pot-hp').innerText = `x${inventario.pot_hp}`;
    document.getElementById('count-pot-mp').innerText = `x${inventario.pot_mp}`;
    document.getElementById('count-elixir').innerText = `x${inventario.elixir}`;
}

function renderizarEstados(containerId, estados) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    estados.forEach(est => {
        const badge = document.createElement('span');
        if (est.tipo === 'quemadura') {
            badge.className = 'status-badge bg-orange-950 text-orange-400 border border-orange-600/50';
            badge.innerHTML = `🔥 Quemado (${est.turnos})`;
        } else if (est.tipo === 'veneno') {
            badge.className = 'status-badge bg-emerald-950 text-emerald-400 border border-emerald-600/50';
            badge.innerHTML = `🧪 Envenenado (${est.turnos})`;
        } else if (est.tipo === 'congelado') {
            badge.className = 'status-badge bg-cyan-950 text-cyan-400 border border-cyan-600/50';
            badge.innerHTML = `❄️ Congelado (${est.turnos})`;
        }
        container.appendChild(badge);
    });
}

function agregarLog(texto, colorClass = 'text-slate-300') {
    const log = document.getElementById('combat-log');
    const entrada = document.createElement('div');
    entrada.className = colorClass;
    entrada.innerHTML = texto;
    log.appendChild(entrada);
    log.scrollTop = log.scrollHeight;
}

function alternarSubmenu(tipo) {
    const sSkills = document.getElementById('submenu-skills');
    const sInv = document.getElementById('submenu-inventory');

    if (tipo === 'skills') {
        sSkills.classList.toggle('hidden');
        sInv.classList.add('hidden');
    } else if (tipo === 'inventory') {
        sInv.classList.toggle('hidden');
        sSkills.classList.add('hidden');
    }
}

function bloquearTurno() {
    turnoBloqueado = true;
    document.querySelectorAll('.action-btn, .skill-btn, .item-btn').forEach(btn => btn.disabled = true);
    document.getElementById('turn-badge').innerText = 'Turno Enemigo';
    document.getElementById('turn-badge').className = 'px-4 py-1.5 bg-rose-700 border border-rose-500 rounded-xl font-black text-xs uppercase tracking-widest text-white shadow-lg animate-pulse';
}

function desbloquearTurnoJugador() {
    turnoBloqueado = false;
    heroe.defendiendo = false;
    document.querySelectorAll('.action-btn, .skill-btn, .item-btn').forEach(btn => btn.disabled = false);
    document.getElementById('turn-badge').innerText = 'Tu Turno';
    document.getElementById('turn-badge').className = 'px-4 py-1.5 bg-indigo-600 border border-indigo-400 rounded-xl font-black text-xs uppercase tracking-widest text-indigo-100 shadow-lg animate-pulse';
}

// Acciones del Jugador
function animarAtaque(idAtacante, idObjetivo) {
    const atacante = document.getElementById(idAtacante);
    const objetivo = document.getElementById(idObjetivo);
    atacante.classList.add('attacking');
    setTimeout(() => {
        atacante.classList.remove('attacking');
        objetivo.classList.add('hit');
        setTimeout(() => objetivo.classList.remove('hit'), 300);
    }, 180);
}

function ejecutarAtaqueFisico() {
    if (turnoBloqueado) return;
    bloquearTurno();

    animarAtaque('hero-card', 'enemy-card');
    playSfx('hit');

    const variacion = Math.floor(Math.random() * 5) - 2;
    const danio = Math.max(5, heroe.ataque - enemigoActual.defensa + variacion);
    enemigoActual.hp -= danio;

    agregarLog(`🗡️ ${heroe.nombre} ataca con su espada e inflige <strong>${danio}</strong> de daño a ${enemigoActual.nombre}.`, 'text-indigo-200');
    actualizarUI();

    setTimeout(verificarEstadoTrasTurnoJugador, 800);
}

function lanzarHabilidad(tipo) {
    if (turnoBloqueado) return;

    if (tipo === 'heal') {
        if (heroe.mp < 20) {
            agregarLog("❌ ¡No tienes suficiente Maná para Luz Sagrada (requiere 20 MP)!", "text-rose-400 font-bold");
            return;
        }
        bloquearTurno();
        heroe.mp -= 20;
        const curacion = 45;
        heroe.hp = Math.min(heroe.hpMax, heroe.hp + curacion);
        playSfx('heal');
        agregarLog(`🌟 ¡${heroe.nombre} invoca Luz Sagrada y recupera <strong>${curacion} HP</strong>!`, 'text-yellow-300 font-bold');
        actualizarUI();
        setTimeout(verificarEstadoTrasTurnoJugador, 800);
        return;
    }

    let costoMp = 15;
    let danioBase = 28;
    let nombreHabilidad = '';
    let estado = null;

    if (tipo === 'fire') {
        costoMp = 15;
        danioBase = 30;
        nombreHabilidad = '🔥 Bola de Fuego';
        estado = { tipo: 'quemadura', turnos: 3, danio: 8 };
        playSfx('fire');
    } else if (tipo === 'ice') {
        costoMp = 18;
        danioBase = 24;
        nombreHabilidad = '❄️ Rayo Helado';
        estado = { tipo: 'congelado', turnos: 2 };
        playSfx('ice');
    } else if (tipo === 'poison') {
        costoMp = 12;
        danioBase = 20;
        nombreHabilidad = '🧪 Daga Tóxica';
        estado = { tipo: 'veneno', turnos: 3, danio: 9 };
        playSfx('hit');
    }

    if (heroe.mp < costoMp) {
        agregarLog(`❌ ¡No tienes suficiente Maná (requiere ${costoMp} MP)!`, 'text-rose-400 font-bold');
        return;
    }

    bloquearTurno();
    heroe.mp -= costoMp;
    animarAtaque('hero-card', 'enemy-card');

    const danio = Math.max(8, danioBase - enemigoActual.defensa + Math.floor(Math.random() * 6));
    enemigoActual.hp -= danio;

    // Aplicar estado si no lo tiene ya
    if (estado && !enemigoActual.estados.some(e => e.tipo === estado.tipo)) {
        enemigoActual.estados.push(estado);
        agregarLog(`✨ ¡${nombreHabilidad} inflige <strong>${danio}</strong> de daño y aplica <strong>${estado.tipo.toUpperCase()}</strong>!`, 'text-cyan-300 font-bold');
    } else {
        agregarLog(`✨ ¡${nombreHabilidad} inflige <strong>${danio}</strong> de daño!`, 'text-cyan-300');
    }

    actualizarUI();
    setTimeout(verificarEstadoTrasTurnoJugador, 800);
}

function usarObjeto(tipo) {
    if (turnoBloqueado) return;

    if (inventario[tipo] <= 0) {
        agregarLog("❌ ¡No te quedan más unidades de este objeto!", "text-rose-400");
        return;
    }

    bloquearTurno();
    inventario[tipo]--;

    if (tipo === 'pot_hp') {
        heroe.hp = Math.min(heroe.hpMax, heroe.hp + 50);
        playSfx('heal');
        agregarLog(`🧪 Has bebido una Poción de Vida (+50 HP).`, 'text-rose-300 font-bold');
    } else if (tipo === 'pot_mp') {
        heroe.mp = Math.min(heroe.mpMax, heroe.mp + 40);
        playSfx('heal');
        agregarLog(`💧 Has bebido una Poción de Maná (+40 MP).`, 'text-cyan-300 font-bold');
    } else if (tipo === 'elixir') {
        heroe.estados = [];
        playSfx('heal');
        agregarLog(`✨ ¡El Elixir Purificador ha eliminado todos tus estados alterados!`, 'text-purple-300 font-bold');
    }

    actualizarUI();
    setTimeout(verificarEstadoTrasTurnoJugador, 800);
}

function ejecutarDefensa() {
    if (turnoBloqueado) return;
    bloquearTurno();
    heroe.defendiendo = true;
    heroe.mp = Math.min(heroe.mpMax, heroe.mp + 8); // Recupera un poco de maná al defender
    agregarLog(`🛡️ ${heroe.nombre} levanta su escudo defensivo (+50% resistencia al próximo golpe y recupera 8 MP).`, 'text-cyan-200');
    actualizarUI();
    setTimeout(turnoEnemigo, 800);
}

// Estados alterados (Tick al final de turno)
function procesarEstadosAlterados(personaje, nombre) {
    let pierdeTurno = false;
    for (let i = personaje.estados.length - 1; i >= 0; i--) {
        const est = personaje.estados[i];

        if (est.tipo === 'quemadura') {
            personaje.hp -= est.danio;
            agregarLog(`🔥 ${nombre} sufre <strong>${est.danio}</strong> de daño por Quemadura.`, 'text-orange-400');
        } else if (est.tipo === 'veneno') {
            personaje.hp -= est.danio;
            agregarLog(`🧪 ${nombre} sufre <strong>${est.danio}</strong> de daño por Veneno.`, 'text-emerald-400');
        } else if (est.tipo === 'congelado') {
            if (Math.random() < 0.5) {
                pierdeTurno = true;
                agregarLog(`❄️ ¡${nombre} está completamente congelado y pierde su turno!`, 'text-cyan-400 font-bold');
            }
        }

        est.turnos--;
        if (est.turnos <= 0) {
            personaje.estados.splice(i, 1);
            agregarLog(`✨ El efecto de ${est.tipo} en ${nombre} ha desaparecido.`, 'text-slate-400 text-[11px]');
        }
    }
    return pierdeTurno;
}

function verificarEstadoTrasTurnoJugador() {
    // Procesar estados del enemigo
    procesarEstadosAlterados(enemigoActual, enemigoActual.nombre);
    actualizarUI();

    if (enemigoActual.hp <= 0) {
        derrotarEnemigo();
    } else {
        turnoEnemigo();
    }
}

// Turno del Enemigo
function turnoEnemigo() {
    // ¿Está congelado y pierde turno?
    const pierdeTurno = enemigoActual.estados.some(e => e.tipo === 'congelado') && Math.random() < 0.5;
    if (pierdeTurno) {
        agregarLog(`❄️ ¡${enemigoActual.nombre} no puede moverse por el hielo!`, 'text-cyan-300 font-bold');
        finalizarRondaCompleta();
        return;
    }

    animarAtaque('enemy-card', 'hero-card');
    playSfx('hit');

    let danio = Math.max(4, enemigoActual.ataque - heroe.defensa + Math.floor(Math.random() * 5));
    if (heroe.defendiendo) {
        danio = Math.max(2, Math.round(danio * 0.5));
    }

    // Posibilidad de habilidad enemiga
    if (enemigoActual.habilidadEspecial && Math.random() < 0.35) {
        if (enemigoActual.habilidadEspecial === 'veneno' && !heroe.estados.some(e => e.tipo === 'veneno')) {
            heroe.estados.push({ tipo: 'veneno', turnos: 3, danio: 7 });
            agregarLog(`🐍 ¡${enemigoActual.nombre} usa Mordisco Tóxico! Inflige <strong>${danio}</strong> de daño y te envenena.`, 'text-emerald-400 font-bold');
        } else if (enemigoActual.habilidadEspecial === 'fuego' && !heroe.estados.some(e => e.tipo === 'quemadura')) {
            heroe.estados.push({ tipo: 'quemadura', turnos: 3, danio: 9 });
            agregarLog(`🐉 ¡${enemigoActual.nombre} lanza Aliento Ígneo! Inflige <strong>${danio}</strong> de daño y te quema.`, 'text-orange-400 font-bold');
        } else if (enemigoActual.habilidadEspecial === 'hielo' && !heroe.estados.some(e => e.tipo === 'congelado')) {
            heroe.estados.push({ tipo: 'congelado', turnos: 2 });
            agregarLog(`🧙 ¡${enemigoActual.nombre} lanza Ventisca Gélida! Inflige <strong>${danio}</strong> de daño y te congela.`, 'text-cyan-400 font-bold');
        } else {
            heroe.hp -= danio;
            agregarLog(`💥 ${enemigoActual.nombre} ataca ferozmente e inflige <strong>${danio}</strong> de daño.`, 'text-rose-400');
        }
    } else {
        heroe.hp -= danio;
        agregarLog(`💥 ${enemigoActual.nombre} ataca e inflige <strong>${danio}</strong> de daño.`, 'text-rose-400');
    }

    actualizarUI();
    setTimeout(finalizarRondaCompleta, 800);
}

function finalizarRondaCompleta() {
    // Procesar estados del Héroe
    procesarEstadosAlterados(heroe, heroe.nombre);
    actualizarUI();

    if (heroe.hp <= 0) {
        derrotaHeroe();
    } else {
        desbloquearTurnoJugador();
    }
}

function derrotarEnemigo() {
    enemigoActual.hp = 0;
    actualizarUI();
    playSfx('levelup');

    agregarLog(`🎉 ¡Has derrotado a <strong>${enemigoActual.nombre}</strong>! Ganaste <strong>${enemigoActual.expRecompensa} EXP</strong>.`, 'text-amber-300 font-bold text-sm');

    // Ganar EXP y posible Level Up
    heroe.exp += enemigoActual.expRecompensa;
    if (heroe.exp >= heroe.expMax) {
        heroe.nivel++;
        heroe.exp -= heroe.expMax;
        heroe.expMax = Math.round(heroe.expMax * 1.5);
        heroe.hpMax += 25;
        heroe.hp = heroe.hpMax;
        heroe.mpMax += 15;
        heroe.mp = heroe.mpMax;
        heroe.ataque += 6;
        heroe.defensa += 3;
        playSfx('levelup');
        agregarLog(`⭐ ¡LEVEL UP! Has alcanzado el <strong>Nivel ${heroe.nivel}</strong>. ¡Tus estadísticas aumentan y recuperas vida/maná!`, 'text-emerald-400 font-black text-sm');
    }

    actualizarUI();

    // Recompensa de pociones aleatoria
    if (Math.random() < 0.6) {
        inventario.pot_hp++;
        agregarLog(`🎁 El enemigo dejó caer una <strong>Poción de Vida</strong>.`, 'text-slate-300 text-xs');
    }

    const victoryBar = document.getElementById('victory-bar');
    const nextBtn = document.getElementById('btn-next-battle');

    victoryBar.classList.remove('hidden');
    if (indiceEnemigoActual >= LISTA_ENEMIGOS.length - 1) {
        document.getElementById('victory-text').innerText = "🏆 ¡HAS COMPLETADO EL RPG DERROTANDO AL DRAGÓN IMPERIAL!";
        nextBtn.innerText = "Reiniciar Aventura 🔄";
        nextBtn.onclick = reiniciarAventuraCompleta;
    } else {
        document.getElementById('victory-text').innerText = `¡${enemigoActual.nombre} eliminado!`;
        nextBtn.innerText = "Siguiente Enemigo ⚔️";
        nextBtn.onclick = avanzarSiguienteEnemigo;
    }
}

function avanzarSiguienteEnemigo() {
    indiceEnemigoActual++;
    cargarEnemigo(indiceEnemigoActual);
}

function derrotaHeroe() {
    heroe.hp = 0;
    actualizarUI();
    agregarLog(`💀 ¡${heroe.nombre} ha caído en combate! Fin de la partida.`, 'text-rose-500 font-black text-sm');

    const victoryBar = document.getElementById('victory-bar');
    const nextBtn = document.getElementById('btn-next-battle');
    victoryBar.classList.remove('hidden');
    document.getElementById('victory-text').innerText = "💀 HAS SIDO DERROTADO";
    nextBtn.innerText = "Reintentar Aventura 🔄";
    nextBtn.className = "px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition shadow-lg";
    nextBtn.onclick = reiniciarAventuraCompleta;
}

function reiniciarAventuraCompleta() {
    heroe = {
        nombre: 'Valerius',
        nivel: 1,
        exp: 0,
        expMax: 100,
        hpMax: 100,
        hp: 100,
        mpMax: 60,
        mp: 60,
        ataque: 20,
        defensa: 6,
        defendiendo: false,
        estados: []
    };
    inventario = {
        pot_hp: 3,
        pot_mp: 2,
        elixir: 1
    };
    indiceEnemigoActual = 0;
    document.getElementById('combat-log').innerHTML = '';
    cargarEnemigo(0);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    cargarEnemigo(0);
});
