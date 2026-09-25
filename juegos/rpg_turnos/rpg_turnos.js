// RPG Roguelike por Turnos - Solución Definitiva al Canvas en Blanco

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
    'k': '#0f172a',
    'w': '#ffffff',
    's': '#94a3b8',
    'S': '#475569',
    'g': '#f59e0b',
    'f': '#fed7aa',
    'r': '#ef4444',
    'b': '#3b82f6',
    'p': '#818cf8',
    'P': '#4338ca',
    'c': '#06b6d4',
    'e': '#22c55e',
    'y': '#fef08a',
    'o': '#f97316',
    'm': '#78350f'
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
        "..kpkffffffkpk..","..kpkffffffkpk..","...kppppppppk...","..kppppppppppk..",
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
    hombreLoboRostro: [
        ".......kkkk......kkkk.......",
        "......kSSSSk....kSSSSk......",
        ".....kSssssSSkkSSssssSk.....",
        "....kSssssssssSSsssssssSk...",
        "....kSssssssssssssssssssSk..",
        "...kSssssssssssssssssssssSk.",
        "...kSsssssSssssssssSsssssSk.",
        "..kSsssssrSssssssssSrsssssSk",
        "..kSssssrrrSssssssrrrSssssSk",
        "..kSssssrrrSssssssrrrSssssSk",
        "..kSsssssrSssssssssSrsssssSk",
        "..kSssssssSssssssssSssssssSk",
        "...kSssssssssssSsssssssssSk.",
        "...kSsssssssssSSSssssssssSk.",
        "....kSsssssssSSSSSssssssSk..",
        "....kSsssssssSwwwSssssssSk..",
        ".....kSsssssSwswwSsssssSk...",
        "......kSssssswwwwsssssSk....",
        ".......kSssssswwsssssSk.....",
        "........kSsssSSSSsssSk......",
        ".........kSSSSSSSSSsk.......",
        "..........kkSSSSSSkk........"
    ]
};

const ARTES_EVENTOS = {
    altar: [
        "................",".....cccccc.....","....cCCCCCCc....","...cCCyyyyCCc...",
        "...cCywywywCc...","...cCCyyyyCCc...","....cCCCCCCc....",".....cccccc.....",
        "....kSSSSSSk....","...kSSSSSSSSk...","..kSSSSSSSSSSk..",".kSSSSSSSSSSSSk.",
        ".kSSSSSSSSSSSSk.",".kSSSSSSSSSSSSk.","kkkkkkkkkkkkkkkk","kkkkkkkkkkkkkkkk"
    ],
    cofre: [
        "................","................","....gggggggg....","...gGgGgGgGgG...",
        "..gGgGgGgGgGgG..","..gGgGyyyyGgGg..","..gGgGyyyyGgGg..","..gGgGgGgGgGgG..",
        "..gGgGgGgGgGgG..","..gmmmmmmmmmmg..","..gmmmmmmmmmmg..","..gmmmmmmmmmmg..",
        "..gmmmmmmmmmmg..","..gmmmmmmmmmmg..","..kkkkkkkkkkkk..","................"
    ],
    viajero: [
        "....kkkkkk......","...kffffffk.....","..kfffffffffk...","..kfkffffkfkk...",
        "..kfffffffffk...","...kfffffffk....","....kmmkkmmk....","...kmmmmmmmmk...",
        "..kmmmmmmmmmmk..",".kmmmmmmmmmmmmk.",".kmmmmmmmmmmmmk.","..kmmkkkkkkmmk..",
        "..kmmk....kmmk..","..kmmk....kmmk..","..kkkk....kkkk..","................"
    ]
};

const SPRITES_FOGATA = [
    [
        "................","....ooooo.......","...oyyyyyo......","...oyyoyyo......",
        "..oyyyyyyyo.....","..oyyoooyyo.....","...oyyyyyo......","....ooooo.......",
        ".....ooo........","....mmmmmm......","...mmmmmmmm.....","..mmmmmmmmmm....",
        ".mmmmkkkkmmmm...","..mmkk..kkmm....","...kk....kk.....","................"
    ],
    [
        ".....ooo........","....oyyyyo......","...oyyyyyyo.....","...oyyooyyo.....",
        "..oyyyyyyyyo....","..oyyooooyyo....","...oyyyyyyo.....","....oyyyyo......",
        ".....oooo.......","....mmmmmm......","...mmmmmmmm.....","..mmmmmmmmmm....",
        ".mmmmkkkkmmmm...","..mmkk..kkmm....","...kk....kk.....","................"
    ],
    [
        "....ooooo.......","...oyyyyyo......","..oyyyyyyyyo....","..oyyo..oyyo....",
        ".oyyyyyyyyyo....","..oyyooooyyo....","...oyyyyyyo.....","....oyyyyo......",
        ".....ooo........","....mmmmmm......","...mmmmmmmm.....","..mmmmmmmmmm....",
        ".mmmmkkkkmmmm...","..mmkk..kkmm....","...kk....kk.....","................"
    ]
];

const SPRITE_BOSQUE_PIXEL = [
    "kkkkkkkkkkkkkkkk","kkkwkkkkkkkkkkwk","kkkkkkkkkkkkkkkk","kkkkkkyyyyykkkkk",
    "kkkkkyyyyyyykkkk","kkkkkyyyyyyykkkk","kkkkkkyssykkkkkk","kkkkkkkkkkkkkkkk",
    "kSSSSkkkkkkkkSSS","kSSSSSkkkkkkSSSS","kkSSSSSkkkkSSSSS","kkkSSSSSkkSSSSSS",
    "kkkkSSSSSSSSSSSS","kkkkkSSSSSSSSSSS","kkkkkkSSSSSSSSSS","kkkkkkkSSSSSSSSS"
];

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
    guerrero: {
        id: 'guerrero', nombre: 'Ares', clase: 'Guerrero', hpMax: 140, mpMax: 35, ataque: 22, defensa: 12, sprite: SPRITES.guerrero,
        habilidades: [
            { id: 'corte', nombre: '🗡️ Corte Voraz', mp: 8, danio: 28, desc: 'Daño pesado.' },
            { id: 'grito', nombre: '📣 Grito de Guerra', mp: 10, buffAtq: 6, desc: 'Aumenta tu ataque.' },
            { id: 'escudo', nombre: '🛡️ Golpe Escudo', mp: 12, danio: 20, desc: 'Golpe defensivo.' },
            { id: 'berserk', nombre: '🔥 Ira Berserker', mp: 20, danio: 45, desc: 'Daño masivo.' }
        ]
    },
    mago: {
        id: 'mago', nombre: 'Valerius', clase: 'Archimago', hpMax: 85, mpMax: 95, ataque: 28, defensa: 5, sprite: SPRITES.mago,
        habilidades: [
            { id: 'fuego', nombre: '🔥 Bola de Fuego', mp: 15, danio: 32, desc: 'Daño elemental.' },
            { id: 'hielo', nombre: '❄️ Rayo Helado', mp: 18, danio: 26, desc: 'Daño helado.' },
            { id: 'meteorito', nombre: '☄️ Meteorito', mp: 30, danio: 55, desc: 'Daño arcano brutal.' },
            { id: 'drenar', nombre: '🟣 Drenaje Vital', mp: 12, danio: 20, curar: 20, desc: 'Daño y te cura.' }
        ]
    },
    picaro: {
        id: 'picaro', nombre: 'Kael', clase: 'Pícaro Sombrío', hpMax: 100, mpMax: 50, ataque: 25, defensa: 7, sprite: SPRITES.picaro,
        habilidades: [
            { id: 'furtivo', nombre: '🗡️ Ataque Furtivo', mp: 10, danio: 30, desc: 'Golpe crítico rápido.' },
            { id: 'veneno', nombre: '🧪 Daga Venenosa', mp: 12, danio: 20, desc: 'Aplica Veneno.' },
            { id: 'humo', nombre: '💨 Bomba de Humo', mp: 15, desc: 'Evasión rápida.' },
            { id: 'estocada', nombre: '⚡ Doble Estocada', mp: 22, danio: 48, desc: 'Dos golpes veloces.' }
        ]
    },
    paladin: {
        id: 'paladin', nombre: 'Aurelia', clase: 'Paladín Sagrado', hpMax: 120, mpMax: 65, ataque: 20, defensa: 11, sprite: SPRITES.paladin,
        habilidades: [
            { id: 'sagrado', nombre: '✨ Estocada Sagrada', mp: 10, danio: 24, desc: 'Daño de luz.' },
            { id: 'luz', nombre: '🌟 Luz Curativa', mp: 18, curar: 45, desc: 'Sana 45 HP.' },
            { id: 'escudo_div', nombre: '🛡️ Escudo Divino', mp: 15, desc: '+8 de Defensa.' },
            { id: 'juicio', nombre: '☀️ Juicio Solar', mp: 25, danio: 50, desc: 'Rayo sagrado destructivo.' }
        ]
    },
    cazador: {
        id: 'cazador', nombre: 'Sylvan', clase: 'Cazador', hpMax: 110, mpMax: 55, ataque: 24, defensa: 8, sprite: SPRITES.cazador,
        habilidades: [
            { id: 'flecha_ven', nombre: '🏹 Flecha Venenosa', mp: 12, danio: 22, desc: 'Daño + Veneno.' },
            { id: 'trampa', nombre: '🪤 Trampa de Oso', mp: 14, danio: 25, desc: 'Inmoviliza.' },
            { id: 'lluvia', nombre: '🌧️ Lluvia Flechas', mp: 20, danio: 40, desc: 'Múltiples disparos.' },
            { id: 'disparo_let', nombre: '🎯 Disparo Letal', mp: 25, danio: 52, desc: 'Daño máximo.' }
        ]
    },
    nigromante: {
        id: 'nigromante', nombre: 'Malakor', clase: 'Nigromante', hpMax: 95, mpMax: 85, ataque: 26, defensa: 6, sprite: SPRITES.nigromante,
        habilidades: [
            { id: 'drenar_alma', nombre: '💀 Drenar Alma', mp: 14, danio: 24, curar: 24, desc: 'Roba vida.' },
            { id: 'maldicion', nombre: '☠️ Maldición Ósea', mp: 16, danio: 28, desc: 'Daño oscuro.' },
            { id: 'espectro', nombre: '👻 Invocar Espectro', mp: 22, danio: 42, desc: 'Ataque fantasmal.' },
            { id: 'macabro', nombre: '🎼 Sinfonía Macabra', mp: 30, danio: 60, desc: 'Hechizo supremo.' }
        ]
    }
};

let heroe = null;
let claseSeleccionadaId = 'guerrero';
let oro = 50;
let pisoActual = 1;

let inventario = {
    pot_hp: 3,
    pot_mp: 2,
    elixir: 1
};

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
        id: 'altar',
        titulo: "El Altar Abandonado",
        icono: "⛩️",
        arte: ARTES_EVENTOS.altar,
        etiquetaArte: "Altar Ancestral Radiante",
        descripcion: "Encuentras un antiguo altar cubierto de musgo brillante. Una voz susurrante te pide un sacrificio a cambio de poder.",
        opciones: [
            { texto: "🙏 Orar y ofrecer 15 HP de tu sangre", efecto: 'sangre' },
            { texto: "💰 Ofrecer 20 monedas de oro", efecto: 'oro' },
            { texto: "🚶 Ignorar el altar y continuar", efecto: 'nada' }
        ]
    },
    {
        id: 'cofre',
        titulo: "El Cofre del Tesoro Sospechoso",
        icono: "📦",
        arte: ARTES_EVENTOS.cofre,
        etiquetaArte: "Cofre Dorado Silencioso",
        descripcion: "Un cofre dorado descansa en medio de una sala. No hay trampas a la vista, pero los bordes lucen dentados.",
        opciones: [
            { texto: "🗝️ Abrirlo con cuidado", efecto: 'abrir_cofre' },
            { texto: "🗡️ Atacar al cofre primero por si es un Mimic", efecto: 'atacar_cofre' },
            { texto: "🚶 Alejarse prudencialmente", efecto: 'nada' }
        ]
    },
    {
        id: 'viajero',
        titulo: "El Viajero Herido",
        icono: "🩹",
        arte: ARTES_EVENTOS.viajero,
        etiquetaArte: "Mercenario en Penumbra",
        descripcion: "Un viejo mercenario yace herido junto a las ruinas. Te pide ayuda desesperadamente para no sucumbir.",
        opciones: [
            { texto: "🧪 Regalarle una Poción de Vida", efecto: 'dar_pocion' },
            { texto: "💰 Robar sus pertenencias mientras está débil", efecto: 'robar_viajero' },
            { texto: "🚶 Desearle buena suerte y seguir", efecto: 'nada' }
        ]
    }
];

// REDIMENSIONADO SEGURO
function redimensionarYDibujarMapa() {
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;

    const container = canvas.parentElement;
    if (container) {
        const w = container.clientWidth || 1200;
        const h = container.clientHeight || 560;
        canvas.width = w;
        canvas.height = h;
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
                } else if (r < 0.50) {
                    tipo = 'enemy';
                } else if (r < 0.70) {
                    tipo = 'event';
                } else if (r < 0.85) {
                    tipo = 'merchant';
                } else {
                    tipo = 'elite';
                }
            }

            const yRatio = (i + 1) / (numNodos + 1);
            nodosMapa.push({
                id: idCounter++,
                capa: c,
                xRatio: xRatio,
                yRatio: yRatio,
                tipo,
                completado: false,
                activo: c === 0,
                conexiones: []
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
                const padreMasCercano = [...nodosCapActual].sort((a, b) =>
                    Math.abs(a.yRatio - n2.yRatio) - Math.abs(b.yRatio - n2.yRatio)
                )[0];
                padreMasCercano.conexiones.push(n2.id);
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

    ctx.fillStyle = '#1c150c';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#78350f';
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

        if (node.completado) ctx.fillStyle = '#334155';
        else if (node.tipo === 'enemy') ctx.fillStyle = '#e11d48';
        else if (node.tipo === 'rest') ctx.fillStyle = '#f59e0b';
        else if (node.tipo === 'event') ctx.fillStyle = '#0891b2';
        else if (node.tipo === 'merchant') ctx.fillStyle = '#059669';
        else if (node.tipo === 'elite') ctx.fillStyle = '#9333ea';
        else if (node.tipo === 'boss') ctx.fillStyle = '#991b1b';

        ctx.fill();

        ctx.lineWidth = node.activo ? 5 : 2;
        ctx.strokeStyle = node.activo ? '#fef08a' : '#1e293b';
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
            const dist = Math.hypot(nodeX - x, nodeY - y);
            if (dist <= 30) {
                seleccionarNodo(node);
            }
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
        if (sig && sig.capa === node.capa + 1) {
            sig.activo = true;
        }
    });

    dibujarMapa();

    if (node.tipo === 'enemy' || node.tipo === 'elite' || node.tipo === 'boss') {
        iniciarBatalla(node.tipo, node.capa);
    } else if (node.tipo === 'rest') {
        ejecutarEscenaFogata();
    } else if (node.tipo === 'event') {
        abrirEvento();
    } else if (node.tipo === 'merchant') {
        abrirMercado();
    }
}

// FOGATA
let campAnimInterval = null;

function ejecutarEscenaFogata() {
    playSfx('heal');

    const hpAntes = heroe.hp;
    const mpAntes = heroe.mp;

    heroe.hp = Math.min(heroe.hpMax, heroe.hp + 45);
    heroe.mp = Math.min(heroe.mpMax, heroe.mp + 30);

    const hpGanado = heroe.hp - hpAntes;
    const mpGanado = heroe.mp - mpAntes;

    document.getElementById('campfire-hp-rec').innerText = `+${hpGanado} HP`;
    document.getElementById('campfire-mp-rec').innerText = `+${mpGanado} MP`;

    document.getElementById('view-map').classList.add('hidden');
    document.getElementById('view-campfire').classList.remove('hidden');

    const canvasCamp = document.getElementById('campfire-canvas');
    const ctx = canvasCamp.getContext('2d');
    let frame = 0;

    if (campAnimInterval) clearInterval(campAnimInterval);
    campAnimInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvasCamp.width, canvasCamp.height);

        const bgTemp = document.createElement('canvas');
        bgTemp.width = 16;
        bgTemp.height = 16;
        dibujarPixelArt(bgTemp, SPRITE_BOSQUE_PIXEL);
        ctx.drawImage(bgTemp, 0, 0, canvasCamp.width, canvasCamp.height);

        const fireW = 220;
        const fireH = 220;
        const fireX = (canvasCamp.width - fireW) / 2;
        const fireY = (canvasCamp.height - fireH) / 2 + 50;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 16;
        tempCanvas.height = 16;
        dibujarPixelArt(tempCanvas, SPRITES_FOGATA[frame % SPRITES_FOGATA.length]);
        ctx.drawImage(tempCanvas, fireX, fireY, fireW, fireH);

        frame++;
    }, 180);

    setTimeout(() => {
        clearInterval(campAnimInterval);
        document.getElementById('view-campfire').classList.add('hidden');
        document.getElementById('view-map').classList.remove('hidden');
        actualizarUI();
        requestAnimationFrame(() => redimensionarYDibujarMapa());
    }, 3000);
}

// MERCADO
let merchantAnimInterval = null;

function abrirMercado() {
    document.getElementById('view-map').classList.add('hidden');
    document.getElementById('view-merchant').classList.remove('hidden');

    const canvasWolf = document.getElementById('werewolf-canvas');
    const ctx = canvasWolf.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    let frame = 0;

    if (merchantAnimInterval) clearInterval(merchantAnimInterval);
    merchantAnimInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvasWolf.width, canvasWolf.height);

        const offsetY = (frame % 20 < 10) ? 0 : 3;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 28;
        tempCanvas.height = 22;
        dibujarPixelArt(tempCanvas, SPRITES.hombreLoboRostro);

        ctx.drawImage(tempCanvas, 0, offsetY, canvasWolf.width, canvasWolf.height);
        frame++;
    }, 150);

    renderizarEstantesMercado();
}

function renderizarEstantesMercado() {
    const container = document.getElementById('merchant-shelf-container');
    container.innerHTML = '';

    ITEMS_MERCADO.forEach(item => {
        const estante = document.createElement('div');
        estante.className = 'bg-amber-950/80 border-2 border-amber-800 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xl hover:border-amber-500 transition';

        let stockText = '';
        if (item.tipo === 'consumible') {
            const cantidad = inventario[item.id] || 0;
            stockText = `<span id="stock-${item.id}" class="text-xs font-black text-amber-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">Posees: x${cantidad}</span>`;
        }

        estante.innerHTML = `
            <div class="flex flex-col gap-1">
                <div class="flex items-center gap-3">
                    <h4 class="font-black text-base text-slate-100">${item.nombre}</h4>
                    ${stockText}
                </div>
                <p class="text-xs text-amber-200/70">${item.desc}</p>
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
        actualizarUI();
    } else if (tipo === 'upgrade_atq') {
        heroe.ataque += 4;
    } else if (tipo === 'upgrade_def') {
        heroe.defensa += 3;
    }
}

function cerrarMercado() {
    if (merchantAnimInterval) clearInterval(merchantAnimInterval);
    document.getElementById('view-merchant').classList.add('hidden');
    document.getElementById('view-map').classList.remove('hidden');
    requestAnimationFrame(() => redimensionarYDibujarMapa());
}

// EVENTOS NARRATIVOS
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
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvasArt.width, canvasArt.height);

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(20, 20, canvasArt.width - 40, canvasArt.height - 40);

        if (eventoActual.id === 'altar') {
            ctx.fillStyle = frame % 10 < 5 ? '#06b6d4' : '#3b82f6';
            ctx.beginPath();
            ctx.arc(canvasArt.width / 2, canvasArt.height / 2 - 20, 80 + Math.sin(frame * 0.2) * 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (eventoActual.id === 'cofre') {
            ctx.fillStyle = frame % 8 < 4 ? '#f59e0b' : '#fef08a';
            ctx.fillRect(canvasArt.width / 2 - 60, canvasArt.height / 2 - 60, 120, 120);
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 16;
        tempCanvas.height = 16;
        dibujarPixelArt(tempCanvas, eventoActual.arte);

        ctx.drawImage(tempCanvas, canvasArt.width / 2 - 80, canvasArt.height / 2 - 80, 160, 160);
        frame++;
    }, 150);

    const optionsContainer = document.getElementById('event-options-container');
    optionsContainer.innerHTML = '';
    document.getElementById('event-result').classList.add('hidden');
    document.getElementById('btn-close-event').classList.add('hidden');

    eventoActual.opciones.forEach(opc => {
        const btn = document.createElement('button');
        btn.className = 'w-full text-left p-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500 rounded-xl font-bold text-xs sm:text-sm text-cyan-300 transition shadow';
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
        } else {
            mensaje = "❌ No tenías suficientes monedas. El altar no respondió.";
        }
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
        } else {
            mensaje = "❌ No tienes ninguna Poción de Vida para entregarle.";
        }
    } else if (efecto === 'robar_viajero') {
        oro += 25;
        mensaje = "🗡️ Obtienes +25 Monedas de Oro de sus pertenencias.";
    } else if (efecto === 'nada') {
        mensaje = "🚶 Sigues adelante en tu camino sin arriesgarte.";
    }

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

function iniciarBatalla(tipoNodo, capaActual = 0) {
    document.getElementById('view-map').classList.add('hidden');
    document.getElementById('view-battle').classList.remove('hidden');

    const multPiso = 1 + ((pisoActual - 1) * 0.25);
    const multCapa = 1 + (capaActual * 0.12);
    const multTotal = multPiso * multCapa;

    let enemigo = {
        nombre: `Goblin Salvaje (Piso ${pisoActual})`,
        tipo: 'Monstruo Común',
        hpMax: Math.round(60 * multTotal),
        hp: Math.round(60 * multTotal),
        ataque: Math.round(11 * multTotal),
        defensa: Math.round(2 * multTotal),
        expRecompensa: 45 * pisoActual,
        sprite: SPRITES.goblin,
        esBoss: false
    };

    if (tipoNodo === 'elite') {
        enemigo = {
            nombre: `Guardián Élite (Piso ${pisoActual})`,
            tipo: '⚠️ MONSTRUO ELITE',
            hpMax: Math.round(120 * multTotal),
            hp: Math.round(120 * multTotal),
            ataque: Math.round(16 * multTotal),
            defensa: Math.round(5 * multTotal),
            expRecompensa: 100 * pisoActual,
            sprite: SPRITES.goblin,
            esBoss: false
        };
    } else if (tipoNodo === 'boss') {
        enemigo = {
            nombre: `Dragón Ígneo (Jefe Piso ${pisoActual})`,
            tipo: '👑 JEFE DE MAZMORRA',
            hpMax: Math.round(180 * multTotal),
            hp: Math.round(180 * multTotal),
            ataque: Math.round(20 * multTotal),
            defensa: Math.round(7 * multTotal),
            expRecompensa: 220 * pisoActual,
            sprite: SPRITES.dragon,
            esBoss: true
        };
    }

    enemigoActual = enemigo;
    document.getElementById('enemy-name').innerText = enemigo.nombre;
    document.getElementById('enemy-type').innerText = enemigo.tipo;
    dibujarPixelArt(document.getElementById('enemy-pixel-canvas'), enemigo.sprite);

    document.getElementById('combat-log').innerHTML = `<div class="text-indigo-300 font-bold">⚔️ ¡Enfrentas a ${enemigo.nombre}!</div>`;
    actualizarUI();
    desbloquearTurno();
}

// RETORNO AL MAPA ROBUSTO CON REQUESTANIMATIONFRAME
function volverAlMapa() {
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
                if (sig && sig.capa === nodoActual.capa + 1) {
                    sig.activo = true;
                }
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
                <span class="text-xs font-bold text-indigo-400">${c.clase}</span>
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

    const skillsContainer = document.getElementById('submenu-skills');
    skillsContainer.innerHTML = '';
    heroe.habilidades.forEach(h => {
        const btn = document.createElement('button');
        btn.className = 'skill-btn border-indigo-500/50 hover:bg-indigo-950/40';
        btn.onclick = () => lanzarHabilidad(h);
        btn.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="font-bold text-xs sm:text-sm text-indigo-300">${h.nombre}</span>
                <span class="text-xs font-black text-cyan-400">${h.mp} MP</span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">${h.desc}</p>
        `;
        skillsContainer.appendChild(btn);
    });

    document.getElementById('character-select-modal').classList.add('hidden');
    generarMapaProcedural();
}

function actualizarUI() {
    if (!heroe) return;

    const heroHpFinal = Math.max(0, Math.ceil(heroe.hp));
    const heroMpFinal = Math.max(0, Math.ceil(heroe.mp));

    document.getElementById('hero-hp-text').innerText = `${heroHpFinal} / ${heroe.hpMax}`;
    document.getElementById('hero-hp-bar').style.width = `${(heroHpFinal / heroe.hpMax) * 100}%`;
    document.getElementById('hero-mp-text').innerText = `${heroMpFinal} / ${heroe.mpMax}`;
    document.getElementById('hero-mp-bar').style.width = `${(heroMpFinal / heroe.mpMax) * 100}%`;

    document.getElementById('hero-level-display').innerText = `Nv. ${heroe.nivel}`;
    document.getElementById('hero-exp-display').innerText = `${heroe.exp}/${heroe.expMax}`;

    if (enemigoActual) {
        const enemyHpFinal = Math.max(0, Math.ceil(enemigoActual.hp));
        document.getElementById('enemy-hp-text').innerText = `${enemyHpFinal} / ${enemigoActual.hpMax}`;
        document.getElementById('enemy-hp-bar').style.width = `${(enemyHpFinal / enemigoActual.hpMax) * 100}%`;
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

    const danio = Math.max(6, heroe.ataque - enemigoActual.defensa);
    enemigoActual.hp = Math.max(0, enemigoActual.hp - danio);

    agregarLog(`🗡️ Atacas e infliges <strong>${danio}</strong> de daño. Recuperas 💧 <strong>+5 MP</strong>.`, 'text-indigo-200');
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
        const d = Math.max(8, h.danio - enemigoActual.defensa);
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
    agregarLog(`🛡️ Te preparas para defender. Recuperas 💧 <strong>+12 MP</strong>.`, 'text-cyan-200');
    actualizarUI();

    setTimeout(turnoEnemigo, 800);
}

function bloquearTurno() {
    turnoBloqueado = true;
}

function desbloquearTurno() {
    turnoBloqueado = false;
    heroe.defendiendo = false;
}

function turnoEnemigo() {
    if (enemigoActual.hp <= 0) {
        derrotarEnemigo();
        return;
    }
    playSfx('hit');
    let danio = Math.max(4, enemigoActual.ataque - heroe.defensa);
    if (heroe.defendiendo) danio = Math.round(danio * 0.5);

    heroe.hp = Math.max(0, heroe.hp - danio);
    agregarLog(`💥 ${enemigoActual.nombre} inflige <strong>${danio}</strong> de daño.`, 'text-rose-400');
    actualizarUI();

    if (heroe.hp <= 0) {
        agregarLog(`💀 ¡Has sido derrotado en combate!`, 'text-rose-500 font-bold');
        setTimeout(() => location.reload(), 2500);
    } else {
        desbloquearTurno();
    }
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
        heroe.hpMax += 20;
        heroe.hp = heroe.hpMax;
        heroe.mpMax += 12;
        heroe.mp = heroe.mpMax;
        heroe.ataque += 4;
        heroe.defensa += 2;
        playSfx('heal');
        agregarLog(`⭐ ¡LEVEL UP! Alcanzaste el <strong>Nivel ${heroe.nivel}</strong>. ¡Estadísticas mejoradas y salud restaurada!`, 'text-emerald-400 font-black text-sm');
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