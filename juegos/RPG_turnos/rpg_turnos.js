// RPG Roguelike - Muestra de Estadísticas e Indicador de Rangos de Daño

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
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
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
        }
    } catch (e) {}
}

function toggleRulesModal(mostrar) {
    const modal = document.getElementById('rules-modal');
    if (mostrar) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

const PALETA = {
    '.': 'transparent',
    'k': '#061012',
    'w': '#ffffff',
    's': '#4e7a68',
    'S': '#234338',
    'g': '#f59e0b',
    'f': '#fce7f3',
    'r': '#ef4444',
    'b': '#3b82f6',
    'p': '#818cf8',
    'P': '#1e1b4b',
    'c': '#06b6d4',
    'e': '#10b981',
    'y': '#fef08a',
    'o': '#f97316',
    'm': '#78350f',
    'd': '#0a1d18',
    'v': '#11382b',
    'V': '#1d5e49',
    'C': '#182b3a',
    'F': '#fbcfe8',
    'H': '#1e293b'
};

const SPRITES = {
    guerrero: [
        "....kkkkkk......","...kggggggk.....","...kgsssggk.....","..kssssssssk....",
        "..ksskkkkssk....","..kskffffksk....","..kskffFfksk....","...kssssssk.....",
        "...kssssssk.....","..kSssssssSk.s..",".kSssssssssksk..",".kSSSSSSSSSksk..",
        "..kSSssssSk.sk..","..ksskksskk.sk..","..ksskksskk.sk..","..kkk..kkk..kk.."
    ],
    mago: [
        ".....kkkk.......","....kPPPPk......","....kPppPk......","...kPppppPk.....",
        "...kggggggk...c.","..kPPPPPPPPk.ccc","..kPPffffPPk..c.","..kPffffffPk..k.",
        "..kPwwwwwkPk..k.","..kPPPPPPPPk..k.","..kPppPppPppk.k.","..kPppPppPppk.k.",
        "..kPppPppPppk.k.","..kPPPPPPPPk..k.","..kmmkkmmkk...k.","..kkk..kkk....k."
    ],
    picaro: [
        "....kkkkkk......","...kEEkkEEk.....","..kEEEEEEEEk....","..kEkkkkkkEk....",
        "..kEkfffffEk....","..kEkffffFEk....","..kEkkkkkkEk.s..","...kEEEEEEk.sk..",
        "...kmmmmmmk.sk..","..kmmmmmmmmksk..",".kEmmmmmmmmkk...",".kEEkEEEEkEEk...",
        ".kEkkEEEEkkEk.s.","..kEkkkkkEk..sk.","..kmmk..kmmk.sk.","..kkk....kkk.kk."
    ],
    paladin: [
        "....yyyyyy......","...kggggggk.....","..kggggggggk....","..kgwkkkkwgk....",
        "..kgkffffkgk....","..kgkffFfkgk....","...kggggggk.....","..kRggggggRk....",
        ".kRRgwwwggRRk.y.",".kRRgwwwggRRkyyy",".kRggggggggRk.y.","..kggggggggk..k.",
        "..kGggggggGk..k.","..kGgkkkkGgk..k.","..kggk..kggk..k.","..kkk....kkk..kk."
    ],
    cazador: [
        "....kkkkkk......","...keeeeeek.....","..keeeeeeeeek...","..kekkkkkkek....",
        "..kekffffkek....","..kekffffkek....","...keeeeeek.....","..kmmmmmmmmk.s..",
        ".kmmmmmmmmmmksk.",".kmmmmmmmmmmksk.",".kmmmmmmmmmmk.s.","..kmmmmmmmmk..k.",
        "..kmmkkkkmmk..k.","..kmmk..kmmk..k.","..kmmk..kmmk..k.","..kkk....kkk..kk."
    ],
    nigromante: [
        ".....kkkk.......","....kppppk......","...kppppppppk...","..kppkkkkkkppk..",
        "..kpkffffffkpk..","..kpkffffffkpk..","...kppppppppk...","..kppkkkkkkppk..",
        ".kppkkkkkkkkppk.",".kppkkkkkkkkppk.",".kppppppppppppk.","..kppppppppppk..",
        "..kppkkkkkkppk..","..kppk....kppk..","..kmmk....kmmk..","..kkk......kkk.."
    ],
    goblin: [
        "................","..kEkk...kkEk...",".kEEEk...kEEEk..",".kEEeeeeeeEEEk..",
        "..keeeeeeeek....","..keekrkeerke...","..keeeeeeeek....","...kewwwwek..s..",
        "...kmmmmmmk.sk..","..kmmmmmmmmksk..",".kmmmmmmmmmk.k..",".kmmmmmmmmmk....",
        "..kEkk..kkEk....","..keek..keek....","..kmmk..kmmk....","..kkk....kkk...."
    ],
    dragon: [
        "gggg......gggg..","kggk......kggk..",".kRRkkkkkkRRk...",".kRRRRRRRRRRk...",
        "kRRRyyRRyyRRRk..","kRRRyyRRyyRRRk..",".kRRRRRRRRRRk...","..kRRwoowRRk.oo.",
        ".kRRRwoowRRkoooo","kRRRRRRRRRRkoooo","kRRkRRRRRRkRRko.","kk.kRRRRRRk.kk..",
        "...kRRRRRRk.....","...kRkkkkRk.....","...kRk..kRk.....","...kkk..kkk....."
    ],
    vendedoraChica: [
        ".......kkkkkkk.......",
        ".....kkCCCCCCkkk.....",
        "....kCCCCCCCCCCCk....",
        "...kCCCCCCCCCCCCCCk..",
        "..kCCCCCCCCCCCCCCCCk.",
        "..kCCCCbbbCCCCbbbCCk.",
        "..kCCCCbbbCCCCbbbCCk.",
        "..kCCCCfffffffffCCCk.",
        "..kCCCCffkffffkffCCk.",
        "...kCCCffkffffkffCk..",
        "....kCCfffffffffCk...",
        ".....kCffffffffCk....",
        "......kkffffffkk.....",
        ".....kkkwwkkkwwkk....",
        "....kwwwwwwwwwwwwwk..",
        "...kwwwwwwwwwwwwwkkk.",
        "..kwwwwwwwwwwwwwk.kk.",
        "..kwwwwwwwwwwwwwk...."
    ]
};

function dibujarPixelArt(canvas, spriteMatrix) {
    if (!canvas || !spriteMatrix) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
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

const CLASES = {
    guerrero: { id: 'guerrero', nombre: 'Ares', clase: 'Guerrero', hpMax: 140, mpMax: 35, ataque: 22, defensa: 12, sprite: SPRITES.guerrero, habilidades: [{ id: 'corte', nombre: '🗡️ Corte Voraz', mp: 8, danio: 28, desc: 'Daño pesado.' }, { id: 'grito', nombre: '📣 Grito de Guerra', mp: 10, buffAtq: 6, desc: 'Aumenta ataque.' }, { id: 'escudo', nombre: '🛡️ Golpe Escudo', mp: 12, danio: 20, desc: 'Golpe defensivo.' }, { id: 'berserk', nombre: '🔥 Ira Berserker', mp: 20, danio: 45, desc: 'Daño masivo.' }] },
    mago: { id: 'mago', nombre: 'Valerius', clase: 'Archimago', hpMax: 85, mpMax: 95, ataque: 28, defensa: 5, sprite: SPRITES.mago, habilidades: [{ id: 'fuego', nombre: '🔥 Bola de Fuego', mp: 15, danio: 32, desc: 'Daño elemental.' }, { id: 'hielo', nombre: '❄️ Rayo Helado', mp: 18, danio: 26, desc: 'Daño helado.' }, { id: 'meteorito', nombre: '☄️ Meteorito', mp: 30, danio: 55, desc: 'Daño arcano.' }, { id: 'drenar', nombre: '🟣 Drenaje Vital', mp: 12, danio: 20, curar: 20, desc: 'Drena vida.' }] },
    picaro: { id: 'picaro', nombre: 'Kael', clase: 'Pícaro Sombrío', hpMax: 100, mpMax: 50, ataque: 25, defensa: 7, sprite: SPRITES.picaro, habilidades: [{ id: 'furtivo', nombre: '🗡️ Ataque Furtivo', mp: 10, danio: 30, desc: 'Crítico rápido.' }, { id: 'veneno', nombre: '🧪 Daga Venenosa', mp: 12, danio: 20, desc: 'Aplica Veneno.' }, { id: 'humo', nombre: '💨 Bomba Humo', mp: 15, desc: 'Evasión.' }, { id: 'estocada', nombre: '⚡ Doble Estocada', mp: 22, danio: 48, desc: 'Dos golpes.' }] },
    paladin: { id: 'paladin', nombre: 'Aurelia', clase: 'Paladín Sagrado', hpMax: 120, mpMax: 65, ataque: 20, defensa: 11, sprite: SPRITES.paladin, habilidades: [{ id: 'sagrado', nombre: '✨ Estocada Sagrada', mp: 10, danio: 24, desc: 'Luz sagrada.' }, { id: 'luz', nombre: '🌟 Luz Curativa', mp: 18, curar: 45, desc: 'Sana 45 HP.' }, { id: 'escudo_div', nombre: '🛡️ Escudo Divino', mp: 15, desc: '+8 Defensa.' }, { id: 'juicio', nombre: '☀️ Juicio Solar', mp: 25, danio: 50, desc: 'Rayo solar.' }] },
    cazador: { id: 'cazador', nombre: 'Sylvan', clase: 'Cazador', hpMax: 110, mpMax: 55, ataque: 24, defensa: 8, sprite: SPRITES.cazador, habilidades: [{ id: 'flecha_ven', nombre: '🏹 Flecha Venenosa', mp: 12, danio: 22, desc: 'Flecha + Veneno.' }, { id: 'trampa', nombre: '🪤 Trampa de Oso', mp: 14, danio: 25, desc: 'Inmoviliza.' }, { id: 'lluvia', nombre: '🌧️ Lluvia Flechas', mp: 20, danio: 40, desc: 'Múltiples disparos.' }, { id: 'disparo_let', nombre: '🎯 Disparo Letal', mp: 25, danio: 52, desc: 'Daño máximo.' }] },
    nigromante: { id: 'nigromante', nombre: 'Malakor', clase: 'Nigromante', hpMax: 95, mpMax: 85, ataque: 26, defensa: 6, sprite: SPRITES.nigromante, habilidades: [{ id: 'drenar_alma', nombre: '💀 Drenar Alma', mp: 14, danio: 24, curar: 24, desc: 'Roba vida.' }, { id: 'maldicion', nombre: '☠️ Maldición Ósea', mp: 16, danio: 28, desc: 'Daño oscuro.' }, { id: 'espectro', nombre: '👻 Espectro', mp: 22, danio: 42, desc: 'Ataque fantasmal.' }, { id: 'macabro', nombre: '🎼 Sinfonía Macabra', mp: 30, danio: 60, desc: 'Hechizo supremo.' }] }
};

let heroe = null;
let claseSeleccionadaId = 'guerrero';
let oro = 50;
let pisoActual = 1;
let inventario = { pot_hp: 3, pot_mp: 2, elixir: 1 };
let nodosMapa = [];
let nodoActual = null;

const ITEMS_MERCADO = [
    { id: 'pot_hp', nombre: '🧪 Poción de Vida', precio: 20, desc: 'Restaura 50 HP de inmediato.', tipo: 'consumible' },
    { id: 'pot_mp', nombre: '🧪 Poción de Maná', precio: 15, desc: 'Restaura 40 MP de inmediato.', tipo: 'consumible' },
    { id: 'elixir', nombre: '✨ Elixir Purificador', precio: 30, desc: 'Cura todos los estados alterados.', tipo: 'consumible' },
    { id: 'atq_up', nombre: '⚔️ Afilador de Cristal', precio: 45, desc: '+4 Ataque permanente.', tipo: 'upgrade_atq' },
    { id: 'def_up', nombre: '🛡️ Escudo de Placas', precio: 40, desc: '+3 Defensa permanente.', tipo: 'upgrade_def' }
];

const EVENTOS = [
    {
        id: 'altar', titulo: "El Altar Abandonado", icono: "⛩️", etiquetaArte: "Altar Ancestral Radiante",
        descripcion: "Encuentras un antiguo altar cubierto de runas místicas. Una voz susurrante te pide un sacrificio a cambio de poder.",
        opciones: [
            { texto: "🙏 Orar y ofrecer 15 HP de tu sangre", efecto: 'sangre' },
            { texto: "💰 Ofrecer 20 monedas de oro", efecto: 'oro' },
            { texto: "🚶 Ignorar el altar y continuar", efecto: 'nada' }
        ]
    },
    {
        id: 'cofre', titulo: "El Cofre del Tesoro Sospechoso", icono: "📦", etiquetaArte: "Cofre Dorado Silencioso",
        descripcion: "Un cofre dorado descansa en medio de una sala. No hay trampas a la vista, pero los bordes lucen dentados.",
        opciones: [
            { texto: "🗝️ Abrirlo con cuidado", efecto: 'abrir_cofre' },
            { texto: "🗡️ Atacar al cofre primero por si es un Mimic", efecto: 'atacar_cofre' },
            { texto: "🚶 Alejarse prudencialmente", efecto: 'nada' }
        ]
    },
    {
        id: 'viajero', titulo: "El Viajero Herido", icono: "🩹", etiquetaArte: "Mercenario en Penumbra",
        descripcion: "Un viejo mercenario yace herido junto a las ruinas. Te pide ayuda desesperadamente para no sucumbir.",
        opciones: [
            { texto: "🧪 Regalarle una Poción de Vida", efecto: 'dar_pocion' },
            { texto: "💰 Robar sus pertenencias mientras está débil", efecto: 'robar_viajero' },
            { texto: "🚶 Desearle buena suerte y seguir", efecto: 'nada' }
        ]
    }
];

function redimensionarYDibujarMapa() {
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;
    const container = canvas.parentElement;
    if (container) {
        canvas.width = container.clientWidth || 1200;
        canvas.height = container.clientHeight || 560;
    }
    dibujarMapa();
}

function generarMapaProcedural() {
    nodosMapa = [];
    const capas = 6;
    let idCounter = 1;
    let fogataEnCapaAnterior = false;

    for (let c = 0; c < capas; c++) {
        const numNodos = c === 0 || c === capas - 1 ? 1 : Math.floor(Math.random() * 2) + 2;
        const xRatio = (c + 1) / (capas + 1);
        let hayFogataEnEstaCapa = false;

        for (let i = 0; i < numNodos; i++) {
            let tipo = 'enemy';
            if (c === capas - 1) tipo = 'boss';
            else if (c === 0) tipo = 'enemy';
            else {
                const r = Math.random();
                if (r < 0.20 && !fogataEnCapaAnterior && !hayFogataEnEstaCapa) {
                    tipo = 'rest';
                    hayFogataEnEstaCapa = true;
                } else if (r < 0.50) tipo = 'enemy';
                else if (r < 0.70) tipo = 'event';
                else if (r < 0.85) tipo = 'merchant';
                else tipo = 'elite';
            }

            const yRatio = (i + 1) / (numNodos + 1);
            nodosMapa.push({
                id: idCounter++, capa: c, xRatio: xRatio, yRatio: yRatio,
                tipo, completado: false, activo: c === 0, conexiones: []
            });
        }
        fogataEnCapaAnterior = hayFogataEnEstaCapa;
    }

    for (let c = 0; c < capas - 1; c++) {
        const nodosCapActual = nodosMapa.filter(n => n.capa === c);
        const nodosCapSiguiente = nodosMapa.filter(n => n.capa === c + 1);

        nodosCapActual.forEach(n1 => {
            const candidatos = [...nodosCapSiguiente].sort((a, b) =>
                Math.abs(a.yRatio - n1.yRatio) - Math.abs(b.yRatio - n1.yRatio)
            );
            n1.conexiones.push(candidatos[0].id);
            if (candidatos.length > 1 && Math.random() < 0.35) {
                n1.conexiones.push(candidatos[1].id);
            }
        });

        nodosCapSiguiente.forEach(n2 => {
            const tieneEntrada = nodosCapActual.some(n1 => n1.conexiones.includes(n2.id));
            if (!tieneEntrada) {
                const padre = [...nodosCapActual].sort((a, b) =>
                    Math.abs(a.yRatio - n2.yRatio) - Math.abs(b.yRatio - n2.yRatio)
                )[0];
                padre.conexiones.push(n2.id);
            }
        });
    }

    document.getElementById('header-floor-display').innerText = `PISO ${pisoActual}`;
    document.getElementById('map-floor-text').innerText = `Piso ${pisoActual}`;
    redimensionarYDibujarMapa();
}

function dibujarMapa() {
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width || 1200;
    const height = canvas.height || 560;

    ctx.fillStyle = '#061012';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1d5e49';
    ctx.setLineDash([8, 8]);

    nodosMapa.forEach(node => {
        const x1 = node.xRatio * width;
        const y1 = node.yRatio * height;
        node.conexiones.forEach(targetId => {
            const target = nodosMapa.find(n => n.id === targetId);
            if (target) {
                const x2 = target.xRatio * width;
                const y2 = target.yRatio * height;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        });
    });
    ctx.setLineDash([]);

    nodosMapa.forEach(node => {
        const x = node.xRatio * width;
        const y = node.yRatio * height;
        const radioNodo = 26;

        ctx.beginPath();
        ctx.arc(x, y, radioNodo, 0, Math.PI * 2);

        if (node.completado) ctx.fillStyle = '#1e293b';
        else if (node.tipo === 'enemy') ctx.fillStyle = '#e11d48';
        else if (node.tipo === 'rest') ctx.fillStyle = '#f59e0b';
        else if (node.tipo === 'event') ctx.fillStyle = '#0891b2';
        else if (node.tipo === 'merchant') ctx.fillStyle = '#10b981';
        else if (node.tipo === 'elite') ctx.fillStyle = '#9333ea';
        else if (node.tipo === 'boss') ctx.fillStyle = '#991b1b';

        ctx.fill();
        ctx.lineWidth = node.activo ? 5 : 2;
        ctx.strokeStyle = node.activo ? '#fef08a' : '#0f172a';
        ctx.stroke();

        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let icono = '⚔️';
        if (node.tipo === 'rest') icono = '🔥';
        if (node.tipo === 'event') icono = '❓';
        if (node.tipo === 'merchant') icono = '🛒';
        if (node.tipo === 'elite') icono = '💀';
        if (node.tipo === 'boss') icono = '👑';
        ctx.fillText(icono, x, y);
    });
}

document.getElementById('map-canvas')?.addEventListener('click', (e) => {
    const canvas = document.getElementById('map-canvas');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    nodosMapa.forEach(node => {
        if (node.activo && !node.completado) {
            const nodeX = node.xRatio * canvas.width;
            const nodeY = node.yRatio * canvas.height;
            if (Math.hypot(nodeX - x, nodeY - y) <= 30) seleccionarNodo(node);
        }
    });
});

window.addEventListener('resize', () => {
    if (!document.getElementById('view-map').classList.contains('hidden')) {
        redimensionarYDibujarMapa();
    }
});

function seleccionarNodo(node) {
    nodoActual = node;
    node.completado = true;
    nodosMapa.filter(n => n.capa === node.capa).forEach(n => n.activo = false);

    node.conexiones.forEach(id => {
        const sig = nodosMapa.find(n => n.id === id);
        if (sig && sig.capa === node.capa + 1) sig.activo = true;
    });

    dibujarMapa();

    if (node.tipo === 'enemy' || node.tipo === 'elite' || node.tipo === 'boss') {
        iniciarBatalla(node.tipo, node.capa);
    } else if (node.tipo === 'rest') ejecutarEscenaFogata();
    else if (node.tipo === 'event') abrirEvento();
    else if (node.tipo === 'merchant') abrirMercado();
}

// ESCENA FOGATA
let campAnimInterval = null;

function ejecutarEscenaFogata() {
    playSfx('heal');
    const hpAntes = heroe.hp;
    const mpAntes = heroe.mp;

    heroe.hp = Math.min(heroe.hpMax, heroe.hp + 45);
    heroe.mp = Math.min(heroe.mpMax, heroe.mp + 30);

    document.getElementById('campfire-hp-rec').innerText = `+${heroe.hp - hpAntes} HP`;
    document.getElementById('campfire-mp-rec').innerText = `+${heroe.mp - mpAntes} MP`;

    document.getElementById('view-map').classList.add('hidden');
    document.getElementById('view-campfire').classList.remove('hidden');

    const canvasCamp = document.getElementById('campfire-canvas');
    const ctx = canvasCamp.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const chispas = Array.from({ length: 25 }, () => ({ x: 0, y: 0, speedY: 0, speedX: 0, alpha: 0 }));
    let frame = 0;

    if (campAnimInterval) clearInterval(campAnimInterval);
    campAnimInterval = setInterval(() => {
        const w = canvasCamp.width;
        const h = canvasCamp.height;

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#041210');
        grad.addColorStop(0.5, '#0a231c');
        grad.addColorStop(1, '#0f382c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < 50; i++) {
            const x = (i * 47) % w;
            const y = (i * 23) % (h * 0.45);
            ctx.fillStyle = Math.sin(frame * 0.1 + i) > 0 ? '#e2f8f0' : '#1d5e49';
            ctx.fillRect(x, y, (i % 3 === 0) ? 3 : 2, (i % 3 === 0) ? 3 : 2);
        }

        ctx.fillStyle = '#051814';
        for (let x = 0; x < w; x += 35) {
            ctx.beginPath();
            ctx.moveTo(x, h * 0.62);
            ctx.lineTo(x + 17, h * 0.32);
            ctx.lineTo(x + 35, h * 0.62);
            ctx.fill();
        }

        ctx.fillStyle = '#0a2d23';
        ctx.fillRect(0, h * 0.62, w, h * 0.38);

        const tentX = w * 0.58;
        const tentY = h * 0.48;
        ctx.fillStyle = '#9a3412';
        ctx.beginPath();
        ctx.moveTo(tentX, tentY + 140);
        ctx.lineTo(tentX + 110, tentY);
        ctx.lineTo(tentX + 220, tentY + 140);
        ctx.fill();

        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(tentX + 35, tentY + 140);
        ctx.lineTo(tentX + 110, tentY + 20);
        ctx.lineTo(tentX + 125, tentY + 140);
        ctx.fill();

        const fireX = w * 0.4;
        const fireY = h * 0.75;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(fireX - 45, fireY + 25);
        ctx.lineTo(fireX, fireY - 45);
        ctx.lineTo(fireX + 45, fireY + 25);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(fireX, fireY + 10, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(fireX + Math.sin(frame * 0.4) * 2, fireY + 6, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(fireX, fireY + 4, 9, 0, Math.PI * 2);
        ctx.fill();

        chispas.forEach(p => {
            if (p.alpha <= 0) {
                p.x = fireX + (Math.random() * 30 - 15);
                p.y = fireY;
                p.speedY = 1.5 + Math.random() * 2;
                p.speedX = (Math.random() - 0.5) * 1.5;
                p.alpha = 1;
            } else {
                p.y -= p.speedY;
                p.x += p.speedX;
                p.alpha -= 0.025;
                ctx.fillStyle = `rgba(254, 240, 138, ${p.alpha})`;
                ctx.fillRect(p.x, p.y, 3, 3);
            }
        });

        frame++;
    }, 60);

    setTimeout(() => {
        clearInterval(campAnimInterval);
        document.getElementById('view-campfire').classList.add('hidden');
        document.getElementById('view-map').classList.remove('hidden');
        actualizarUI();
        requestAnimationFrame(() => redimensionarYDibujarMapa());
    }, 3800);
}

// ESCENA LA TIENDA
let merchantAnimInterval = null;

function abrirMercado() {
    document.getElementById('view-map').classList.add('hidden');
    document.getElementById('view-merchant').classList.remove('hidden');

    const canvasGirl = document.getElementById('vendedora-canvas');
    const ctx = canvasGirl.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let frame = 0;

    if (merchantAnimInterval) clearInterval(merchantAnimInterval);
    merchantAnimInterval = setInterval(() => {
        const w = canvasGirl.width;
        const h = canvasGirl.height;

        ctx.fillStyle = '#0a1d18';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#11382b';
        ctx.fillRect(15, 15, w - 30, h - 30);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(30, 60, w - 60, 12);
        ctx.fillRect(30, 130, w - 60, 12);

        ctx.fillStyle = '#ef4444'; ctx.fillRect(50, 38, 14, 22);
        ctx.fillStyle = '#3b82f6'; ctx.fillRect(90, 38, 14, 22);
        ctx.fillStyle = '#10b981'; ctx.fillRect(130, 38, 14, 22);
        ctx.fillStyle = '#f59e0b'; ctx.fillRect(170, 108, 16, 22);
        ctx.fillStyle = '#818cf8'; ctx.fillRect(220, 108, 16, 22);

        ctx.fillStyle = '#451a03';
        ctx.fillRect(0, h - 90, w, 90);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, h - 90, w, 12);

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 21;
        tempCanvas.height = 18;
        dibujarPixelArt(tempCanvas, SPRITES.vendedoraChica);

        const offsetY = Math.sin(frame * 0.15) * 4;
        ctx.drawImage(tempCanvas, w / 2 - 90, h - 230 + offsetY, 180, 150);

        frame++;
    }, 120);

    renderizarEstantesMercado();
}

function renderizarEstantesMercado() {
    const container = document.getElementById('merchant-shelf-container');
    container.innerHTML = '';

    ITEMS_MERCADO.forEach(item => {
        const estante = document.createElement('div');
        estante.className = 'bg-slate-900/90 border-2 border-emerald-800/80 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl hover:border-emerald-500 transition';

        let stockText = '';
        if (item.tipo === 'consumible') {
            const cantidad = inventario[item.id] || 0;
            stockText = `<span id="stock-${item.id}" class="text-xs font-black text-emerald-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">Posees: x${cantidad}</span>`;
        }

        estante.innerHTML = `
            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-3">
                    <h4 class="font-black text-base text-slate-100">${item.nombre}</h4>
                    ${stockText}
                </div>
                <p class="text-xs text-emerald-200/70">${item.desc}</p>
            </div>
            <button onclick="comprarItemMercado('${item.id}', ${item.precio}, '${item.tipo}')" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition shrink-0 flex items-center gap-1.5">
                <span>💰 ${item.precio}g</span>
            </button>
        `;
        container.appendChild(estante);
    });
}

function comprarItemMercado(id, precio, tipo) {
    if (oro < precio) return;

    oro -= precio;
    document.getElementById('hero-gold-display').innerText = `${oro}g`;

    if (tipo === 'consumible') {
        inventario[id]++;
        const stockEl = document.getElementById(`stock-${id}`);
        if (stockEl) stockEl.innerText = `Posees: x${inventario[id]}`;
    } else if (tipo === 'upgrade_atq') {
        heroe.ataque += 4;
    } else if (tipo === 'upgrade_def') {
        heroe.defensa += 3;
    }
    actualizarUI();
}

function cerrarMercado() {
    if (merchantAnimInterval) clearInterval(merchantAnimInterval);
    document.getElementById('view-merchant').classList.add('hidden');
    document.getElementById('view-map').classList.remove('hidden');
    requestAnimationFrame(() => redimensionarYDibujarMapa());
}

// ESCENA EVENTOS
let eventAnimInterval = null;
let eventoActual = null;

function abrirEvento() {
    eventoActual = EVENTOS[Math.floor(Math.random() * EVENTOS.length)];

    document.getElementById('view-map').classList.add('hidden');
    document.getElementById('view-event').classList.remove('hidden');

    document.getElementById('event-icon').innerText = eventoActual.icono;
    document.getElementById('event-title').innerText = eventoActual.titulo;
    document.getElementById('event-description').innerText = eventoActual.descripcion;
    document.getElementById('event-art-label').innerText = eventoActual.etiquetaArte;

    const canvasArt = document.getElementById('event-art-canvas');
    const ctx = canvasArt.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let frame = 0;

    if (eventAnimInterval) clearInterval(eventAnimInterval);
    eventAnimInterval = setInterval(() => {
        const w = canvasArt.width;
        const h = canvasArt.height;

        ctx.fillStyle = '#061012';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(25, 30, 35, h - 60);
        ctx.fillRect(w - 60, 30, 35, h - 60);

        const pulse = Math.sin(frame * 0.1) * 12;
        const aura = ctx.createRadialGradient(w / 2, h / 2 - 10, 10, w / 2, h / 2 - 10, 90 + pulse);
        aura.addColorStop(0, 'rgba(6, 182, 212, 0.6)');
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 - 10, 90 + pulse, 0, Math.PI * 2);
        ctx.fill();

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 16;
        tempCanvas.height = 16;
        dibujarPixelArt(tempCanvas, eventoActual.arte);

        ctx.drawImage(tempCanvas, w / 2 - 70, h / 2 - 70, 140, 140);

        frame++;
    }, 100);

    const optionsContainer = document.getElementById('event-options-container');
    optionsContainer.innerHTML = '';
    document.getElementById('event-result').classList.add('hidden');
    document.getElementById('btn-close-event').classList.add('hidden');

    eventoActual.opciones.forEach(opc => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500 rounded-xl font-bold text-xs sm:text-sm text-emerald-300 transition shadow';
        btn.innerText = opc.texto;
        btn.onclick = () => procesarEleccionEvento(opc.efecto);
        optionsContainer.appendChild(btn);
    });
}

function procesarEleccionEvento(efecto) {
    const resultDiv = document.getElementById('event-result');
    const optionsContainer = document.getElementById('event-options-container');
    optionsContainer.innerHTML = '';

    let mensaje = "";

    if (efecto === 'sangre') {
        heroe.hp = Math.max(1, heroe.hp - 15);
        heroe.ataque += 5;
        mensaje = "✨ El altar absorbe tu sangre. Perdiste 15 HP pero ganaste +5 de Ataque permanente.";
    } else if (efecto === 'oro') {
        if (oro >= 20) {
            oro -= 20;
            heroe.hp = Math.min(heroe.hpMax, heroe.hp + 35);
            mensaje = "🌟 El altar emite una luz dorada que restaura +35 HP.";
        } else mensaje = "❌ No tenías suficientes monedas. El altar no respondió.";
    } else if (efecto === 'abrir_cofre') {
        if (Math.random() < 0.6) {
            oro += 40;
            mensaje = "🎉 ¡El cofre contenía un tesoro! Obtuviste +40 Monedas de Oro.";
        } else {
            heroe.hp = Math.max(1, heroe.hp - 20);
            mensaje = "💀 ¡El cofre era una trampa! Perdiste 20 HP.";
        }
    } else if (efecto === 'atacar_cofre') {
        inventario.pot_hp++;
        mensaje = "⚔️ Destruyes el cofre antes de que reaccione y obtienes una Poción de Vida.";
    } else if (efecto === 'dar_pocion') {
        if (inventario.pot_hp > 0) {
            inventario.pot_hp--;
            oro += 50;
            mensaje = "🎁 El viajero te regala 50 Monedas de Oro en agradecimiento.";
        } else mensaje = "❌ No tienes ninguna Poción de Vida para entregarle.";
    } else if (efecto === 'robar_viajero') {
        oro += 25;
        mensaje = "🗡️ Obtienes +25 Monedas de Oro de sus pertenencias.";
    } else if (efecto === 'nada') mensaje = "🚶 Sigues adelante en tu camino sin arriesgarte.";

    document.getElementById('hero-gold-display').innerText = `${oro}g`;
    actualizarUI();

    resultDiv.innerText = mensaje;
    resultDiv.classList.remove('hidden');
    document.getElementById('btn-close-event').classList.remove('hidden');
}

function cerrarEvento() {
    if (eventAnimInterval) clearInterval(eventAnimInterval);
    document.getElementById('view-event').classList.add('hidden');
    document.getElementById('view-map').classList.remove('hidden');
    requestAnimationFrame(() => redimensionarYDibujarMapa());
}

// BATALLA
let enemigoActual = null;
let turnoBloqueado = false;
let battleAnimInterval = null;

function iniciarBatalla(tipoNodo, capaActual = 0) {
    document.getElementById('view-map').classList.add('hidden');
    document.getElementById('view-battle').classList.remove('hidden');

    const canvas = document.getElementById('battle-bg-canvas');
    const ctx = canvas.getContext('2d');
    let battleFrame = 0;

    if (battleAnimInterval) clearInterval(battleAnimInterval);
    battleAnimInterval = setInterval(() => {
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = '#061012';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(w * 0.82, 70, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0a2d23';
        for (let x = 0; x < w; x += 45) {
            ctx.beginPath();
            ctx.moveTo(x, h);
            ctx.lineTo(x + 22, h - 180);
            ctx.lineTo(x + 45, h);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.fillRect(0, h - 90 + Math.sin(battleFrame * 0.05) * 5, w, 90);

        battleFrame++;
    }, 100);

    const multPiso = 1 + ((pisoActual - 1) * 0.25);
    const multCapa = 1 + (capaActual * 0.12);
    const multTotal = multPiso * multCapa;

    let enemigo = {
        nombre: `Goblin Salvaje (Piso ${pisoActual})`,
        tipo: 'Monstruo Común',
        hpMax: Math.round(60 * multTotal), hp: Math.round(60 * multTotal),
        ataque: Math.round(11 * multTotal), defensa: Math.round(2 * multTotal),
        expRecompensa: 45 * pisoActual, sprite: SPRITES.goblin, esBoss: false
    };

    if (tipoNodo === 'elite') {
        enemigo = {
            nombre: `Guardián Élite (Piso ${pisoActual})`,
            tipo: '⚠️ MONSTRUO ELITE',
            hpMax: Math.round(120 * multTotal), hp: Math.round(120 * multTotal),
            ataque: Math.round(16 * multTotal), defensa: Math.round(5 * multTotal),
            expRecompensa: 100 * pisoActual, sprite: SPRITES.goblin, esBoss: false
        };
    } else if (tipoNodo === 'boss') {
        enemigo = {
            nombre: `Dragón Ígneo (Jefe Piso ${pisoActual})`,
            tipo: '👑 JEFE DE MAZMORRA',
            hpMax: Math.round(180 * multTotal), hp: Math.round(180 * multTotal),
            ataque: Math.round(20 * multTotal), defensa: Math.round(7 * multTotal),
            expRecompensa: 220 * pisoActual, sprite: SPRITES.dragon, esBoss: true
        };
    }

    enemigoActual = enemigo;
    document.getElementById('enemy-name').innerText = enemigo.nombre;
    document.getElementById('enemy-type').innerText = enemigo.tipo;
    dibujarPixelArt(document.getElementById('enemy-pixel-canvas'), enemigo.sprite);

    document.getElementById('combat-log').innerHTML = `<div class="text-emerald-300 font-bold">⚔️ ¡Enfrentas a ${enemigo.nombre}!</div>`;
    actualizarUI();
    desbloquearTurno();
}

function volverAlMapa() {
    if (battleAnimInterval) clearInterval(battleAnimInterval);
    document.getElementById('view-battle').classList.add('hidden');
    document.getElementById('victory-bar').classList.add('hidden');

    if (enemigoActual && enemigoActual.esBoss) {
        pisoActual++;
        document.getElementById('view-map').classList.remove('hidden');
        generarMapaProcedural();
    } else {
        if (nodoActual) {
            nodoActual.conexiones.forEach(id => {
                const sig = nodosMapa.find(n => n.id === id);
                if (sig && sig.capa === nodoActual.capa + 1) sig.activo = true;
            });
        }
        document.getElementById('view-map').classList.remove('hidden');
        requestAnimationFrame(() => redimensionarYDibujarMapa());
    }
}

function renderizarModalSeleccion() {
    const container = document.getElementById('class-cards-container');
    container.innerHTML = '';

    Object.values(CLASES).forEach(c => {
        const card = document.createElement('div');
        const sel = c.id === claseSeleccionadaId;
        card.className = `class-select-card ${sel ? 'selected' : ''}`;
        card.onclick = () => { claseSeleccionadaId = c.id; renderizarModalSeleccion(); };

        card.innerHTML = `
            <div class="w-20 h-20 rounded-2xl bg-slate-950 p-1 border border-slate-700 flex items-center justify-center">
                <canvas width="80" height="80" id="prev-${c.id}" class="pixel-art-canvas w-full h-full"></canvas>
            </div>
            <div>
                <h4 class="font-black text-slate-100 text-base">${c.nombre}</h4>
                <span class="text-xs font-bold text-emerald-400">${c.clase}</span>
            </div>
            <div class="w-full text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-xl text-left">
                <strong>Habilidades:</strong>
                <ul class="list-disc list-inside mt-1 space-y-0.5">
                    ${c.habilidades.map(h => `<li>${h.nombre}</li>`).join('')}
                </ul>
            </div>
        `;
        container.appendChild(card);
        setTimeout(() => dibujarPixelArt(document.getElementById(`prev-${c.id}`), c.sprite), 10);
    });
}

function confirmarSeleccionPersonaje() {
    const base = CLASES[claseSeleccionadaId];
    heroe = { ...base, hp: base.hpMax, mp: base.mpMax, nivel: 1, exp: 0, expMax: 100, defendiendo: false, estados: [] };

    document.getElementById('hero-name').innerText = heroe.nombre;
    document.getElementById('hero-class').innerText = heroe.clase;
    dibujarPixelArt(document.getElementById('hero-pixel-canvas'), heroe.sprite);

    document.getElementById('character-select-modal').classList.add('hidden');
    generarMapaProcedural();
    actualizarUI();
}

// ACTUALIZACIÓN COMPLETA DE STATS Y CÁLCULO DE DAÑO MÍNIMO Y MÁXIMO
function actualizarUI() {
    if (!heroe) return;

    const heroHpFinal = Math.max(0, Math.ceil(heroe.hp));
    const heroMpFinal = Math.max(0, Math.ceil(heroe.mp));

    document.getElementById('hero-hp-text').innerText = `${heroHpFinal} / ${heroe.hpMax}`;
    document.getElementById('hero-hp-bar').style.width = `${(heroHpFinal / heroe.hpMax) * 100}%`;
    document.getElementById('hero-mp-text').innerText = `${heroMpFinal} / ${heroe.mpMax}`;
    document.getElementById('hero-mp-bar').style.width = `${(heroMpFinal / heroe.mpMax) * 100}%`;

    // Renderizar Estadísticas en Header y Tarjeta
    document.getElementById('header-atq-display').innerText = heroe.ataque;
    document.getElementById('header-def-display').innerText = heroe.defensa;
    document.getElementById('hero-card-atq').innerText = heroe.ataque;
    document.getElementById('hero-card-def').innerText = heroe.defensa;

    document.getElementById('hero-level-display').innerText = `Nv. ${heroe.nivel}`;
    document.getElementById('hero-exp-display').innerText = `${heroe.exp}/${heroe.expMax}`;

    // Renderizar Estadísticas Enemigo
    if (enemigoActual) {
        const enemyHpFinal = Math.max(0, Math.ceil(enemigoActual.hp));
        document.getElementById('enemy-hp-text').innerText = `${enemyHpFinal} / ${enemigoActual.hpMax}`;
        document.getElementById('enemy-hp-bar').style.width = `${(enemyHpFinal / enemigoActual.hpMax) * 100}%`;
        document.getElementById('enemy-card-atq').innerText = enemigoActual.ataque;
        document.getElementById('enemy-card-def').innerText = enemigoActual.defensa;

        // Calcular Rango de Daño para Ataque Básico
        const minAtq = Math.max(1, heroe.ataque - enemigoActual.defensa);
        const maxAtq = Math.max(minAtq, Math.round(heroe.ataque * 1.25) - enemigoActual.defensa);
        document.getElementById('btn-attack-range').innerText = `Daño: ${minAtq} - ${maxAtq}`;

        // Renderizar Habilidades con Rangos Dinámicos
        const skillsContainer = document.getElementById('submenu-skills');
        skillsContainer.innerHTML = '';
        heroe.habilidades.forEach(h => {
            const btn = document.createElement('button');
            btn.className = 'skill-btn border-emerald-500/50 hover:bg-emerald-950/40 flex flex-col justify-between';
            btn.onclick = () => lanzarHabilidad(h);

            let rangoText = "";
            if (h.danio) {
                const minH = Math.max(1, h.danio - enemigoActual.defensa);
                const maxH = Math.max(minH, Math.round(h.danio * 1.25) - enemigoActual.defensa);
                rangoText = `<span class="text-[11px] font-bold text-amber-300">Daño: ${minH} - ${maxH}</span>`;
            } else if (h.curar) {
                rangoText = `<span class="text-[11px] font-bold text-emerald-300">Cura: +${h.curar} HP</span>`;
            } else {
                rangoText = `<span class="text-[11px] font-bold text-cyan-300">Efecto Especial</span>`;
            }

            btn.innerHTML = `
                <div class="flex items-center justify-between w-full">
                    <span class="font-bold text-xs sm:text-sm text-emerald-300">${h.nombre}</span>
                    <span class="text-xs font-black text-cyan-400">${h.mp} MP</span>
                </div>
                <div class="flex items-center justify-between w-full mt-1">
                    <p class="text-[10px] text-slate-400">${h.desc}</p>
                    ${rangoText}
                </div>
            `;
            skillsContainer.appendChild(btn);
        });
    }

    document.getElementById('count-pot-hp').innerText = `x${inventario.pot_hp}`;
    document.getElementById('count-pot-mp').innerText = `x${inventario.pot_mp}`;
    document.getElementById('count-elixir').innerText = `x${inventario.elixir}`;
}

function alternarSubmenu(tipo) {
    document.getElementById('submenu-skills').classList.toggle('hidden', tipo !== 'skills');
    document.getElementById('submenu-inventory').classList.toggle('hidden', tipo !== 'inventory');
}

function ejecutarAtaqueFisico() {
    if (turnoBloqueado) return;
    bloquearTurno();
    playSfx('hit');

    heroe.mp = Math.min(heroe.mpMax, heroe.mp + 5);

    const variacion = 0.9 + Math.random() * 0.3;
    const danioBase = Math.round(heroe.ataque * variacion);
    const danio = Math.max(1, danioBase - enemigoActual.defensa);
    enemigoActual.hp = Math.max(0, enemigoActual.hp - danio);

    agregarLog(`🗡️ Atacas e infliges <strong>${danio}</strong> de daño. Recuperas 💧 <strong>+5 MP</strong>.`, 'text-emerald-200');
    actualizarUI();

    if (enemigoActual.hp <= 0) derrotarEnemigo();
    else setTimeout(turnoEnemigo, 800);
}

function lanzarHabilidad(h) {
    if (turnoBloqueado) return;
    if (heroe.mp < h.mp) {
        agregarLog("❌ ¡No tienes suficiente Maná!", "text-rose-400");
        return;
    }
    bloquearTurno();
    heroe.mp -= h.mp;

    if (h.danio) {
        playSfx('fire');
        const variacion = 0.9 + Math.random() * 0.3;
        const danioBase = Math.round(h.danio * variacion);
        const d = Math.max(1, danioBase - enemigoActual.defensa);
        enemigoActual.hp = Math.max(0, enemigoActual.hp - d);
        agregarLog(`✨ Usas ${h.nombre} e infliges <strong>${d}</strong> de daño.`, 'text-cyan-300');
    }
    if (h.curar) {
        playSfx('heal');
        heroe.hp = Math.min(heroe.hpMax, heroe.hp + h.curar);
        agregarLog(`🌟 Recuperas <strong>${h.curar} HP</strong>.`, 'text-yellow-300');
    }

    actualizarUI();
    if (enemigoActual.hp <= 0) derrotarEnemigo();
    else setTimeout(turnoEnemigo, 800);
}

function usarObjeto(tipo) {
    if (inventario[tipo] <= 0) {
        agregarLog("❌ ¡No te quedan unidades de este objeto!", "text-rose-400");
        return;
    }
    inventario[tipo]--;

    if (tipo === 'pot_hp') heroe.hp = Math.min(heroe.hpMax, heroe.hp + 50);
    if (tipo === 'pot_mp') heroe.mp = Math.min(heroe.mpMax, heroe.mp + 40);
    if (tipo === 'elixir') heroe.estados = [];

    actualizarUI();
}

function ejecutarDefensa() {
    if (turnoBloqueado) return;
    bloquearTurno();
    heroe.defendiendo = true;

    heroe.mp = Math.min(heroe.mpMax, heroe.mp + 12);
    agregarLog(`🛡️ Te preparas para defender. Recuperas 💧 <strong>+12 MP</strong>.`, 'text-teal-200');
    actualizarUI();

    setTimeout(turnoEnemigo, 800);
}

function bloquearTurno() { turnoBloqueado = true; }
function desbloquearTurno() { turnoBloqueado = false; heroe.defendiendo = false; }

function turnoEnemigo() {
    if (enemigoActual.hp <= 0) { derrotarEnemigo(); return; }
    playSfx('hit');
    let danio = Math.max(4, enemigoActual.ataque - heroe.defensa);
    if (heroe.defendiendo) danio = Math.round(danio * 0.5);

    heroe.hp = Math.max(0, heroe.hp - danio);
    agregarLog(`💥 ${enemigoActual.nombre} inflige <strong>${danio}</strong> de daño.`, 'text-rose-400');
    actualizarUI();

    if (heroe.hp <= 0) {
        agregarLog(`💀 ¡Has sido derrotado en combate!`, 'text-rose-500 font-bold');
        setTimeout(() => location.reload(), 2500);
    } else desbloquearTurno();
}

function derrotarEnemigo() {
    oro += 25 * pisoActual;
    heroe.exp += enemigoActual.expRecompensa;
    actualizarUI();

    if (enemigoActual.esBoss) {
        document.getElementById('victory-text').innerText = `¡Jefe del Piso ${pisoActual} Derrotado! 🎉`;
    } else {
        document.getElementById('victory-text').innerText = `¡Victoria! 🎉`;
    }

    agregarLog(`🎉 ¡Derrotaste a <strong>${enemigoActual.nombre}</strong>! (+${25 * pisoActual} Gold / +${enemigoActual.expRecompensa} EXP)`, 'text-amber-300 font-bold');

    if (heroe.exp >= heroe.expMax) {
        heroe.nivel++;
        heroe.exp -= heroe.expMax;
        heroe.expMax = Math.round(heroe.expMax * 1.5);
        heroe.hpMax += 20; heroe.hp = heroe.hpMax;
        heroe.mpMax += 12; heroe.mp = heroe.mpMax;
        heroe.ataque += 4; heroe.defensa += 2;
        playSfx('heal');
        agregarLog(`⭐ ¡LEVEL UP! Alcanzaste el <strong>Nivel ${heroe.nivel}</strong>.`, 'text-emerald-400 font-black text-sm');
        actualizarUI();
    }

    document.getElementById('hero-gold-display').innerText = `${oro}g`;
    document.getElementById('victory-bar').classList.remove('hidden');
}

function agregarLog(texto, colorClass = 'text-slate-300') {
    const log = document.getElementById('combat-log');
    const entrada = document.createElement('div');
    entrada.className = colorClass;
    entrada.innerHTML = texto;
    log.appendChild(entrada);
    log.scrollTop = log.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarModalSeleccion();
});