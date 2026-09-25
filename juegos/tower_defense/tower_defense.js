const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuración del Grid (Cuadrícula)
const TILE_SIZE = 40; // Tamaño de celda 40x40px

function snapToGrid(val) {
    return Math.floor(val / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
}

// Web Audio API
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playSound(type) {
    try {
        initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'shoot') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'cannon') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'ice') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'coin') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now);
            osc.frequency.setValueAtTime(1318.51, now + 0.06);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'hurt') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    } catch (e) {}
}

// Configuración y Estados del Juego
let oro = 180;
let vidas = 20;
let oleadaActual = 0;
const OLEADAS_TOTALES = 10;
let oleadaEnProgreso = false;
let velocidad = 1;
let juegoTerminado = false;
let globalTime = 0;

let tipoTorreSeleccionado = null;
let torreInspeccionada = null;
let mousePos = { x: -100, y: -100, dentro: false };

// Referencias DOM cacheadas (evita buscar el DOM repetidamente cada frame)
const uiGoldCount = document.getElementById('gold-count');
const uiLivesCount = document.getElementById('lives-count');
const uiWaveDisplay = document.getElementById('wave-display');
const uiEnemiesLeft = document.getElementById('enemies-left');

// Marca que la UI necesita actualizarse; se aplica una sola vez al final de update()
let uiDirty = false;

// sendero
const CAMINO = [
    { x: 20, y: 100 },
    { x: 220, y: 100 },
    { x: 220, y: 340 },
    { x: 460, y: 340 },
    { x: 460, y: 140 },
    { x: 660, y: 140 },
    { x: 660, y: 420 },
    { x: 740, y: 420 }
];

const ANCHO_CAMINO = TILE_SIZE;

// Elementos decorativos
const DECORACIONES = [];
function generarDecoraciones() {
    DECORACIONES.length = 0;
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 500;
        let cercaCamino = false;

        for (let j = 0; j < CAMINO.length - 1; j++) {
            if (distanciaPuntoASegmento(x, y, CAMINO[j].x, CAMINO[j].y, CAMINO[j + 1].x, CAMINO[j + 1].y) < ANCHO_CAMINO / 2 + 15) {
                cercaCamino = true;
                break;
            }
        }

        if (!cercaCamino) {
            const tipo = Math.random() < 0.6 ? 'tree' : (Math.random() < 0.8 ? 'rock' : 'flower');
            DECORACIONES.push({ x, y, tipo, size: Math.random() * 6 + 10 });
        }
    }
}

// Definición de Torres
const DATOS_TORRES = {
    arrow: {
        nombre: 'Torre Arquera',
        costo: 50,
        rango: 125,
        danio: 18,
        cadencia: 24,
        color: '#f59e0b',
        colorGlow: 'rgba(245, 158, 11, 0.4)',
        icono: '🏹'
    },
    cannon: {
        nombre: 'Torre Cañón',
        costo: 90,
        rango: 105,
        danio: 40,
        cadencia: 50,
        splash: 70,
        color: '#ef4444',
        colorGlow: 'rgba(239, 68, 68, 0.4)',
        icono: '💣'
    },
    ice: {
        nombre: 'Torre de Hielo',
        costo: 75,
        rango: 110,
        danio: 10,
        cadencia: 35,
        ralentizar: 0.40,
        color: '#38bdf8',
        colorGlow: 'rgba(56, 189, 248, 0.4)',
        icono: '❄️'
    },
    laser: {
        nombre: 'Torre Láser',
        costo: 140,
        rango: 130,
        danioPorFrame: 0.95,
        color: '#c084fc',
        colorGlow: 'rgba(192, 132, 252, 0.4)',
        icono: '⚡'
    }
};

let torres = [];
let enemigos = [];
let proyectiles = [];
let particulas = [];
let textosFlotantes = [];
let colaSpawn = [];
let frameSpawn = 0;

function distSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

function distanciaPuntoASegmento(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function estaEnCamino(x, y) {
    for (let i = 0; i < CAMINO.length - 1; i++) {
        const d = distanciaPuntoASegmento(x, y, CAMINO[i].x, CAMINO[i].y, CAMINO[i + 1].x, CAMINO[i + 1].y);
        if (d < ANCHO_CAMINO / 2) return true;
    }
    return false;
}

function actualizarMarcadoresUI() {
    uiGoldCount.innerText = oro;
    uiLivesCount.innerText = vidas;
    uiWaveDisplay.innerText = `Oleada ${oleadaActual} / ${OLEADAS_TOTALES}`;
    uiEnemiesLeft.innerText = `${enemigos.length + colaSpawn.length} vivos`;
}

function seleccionarTipoTorre(tipo) {
    if (tipoTorreSeleccionado === tipo) {
        tipoTorreSeleccionado = null;
    } else {
        tipoTorreSeleccionado = tipo;
        torreInspeccionada = null;
    }
    actualizarPanelInspector();

    document.querySelectorAll('.tower-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === tipoTorreSeleccionado);
    });
}

function deseleccionarTorreConstruccion() {
    tipoTorreSeleccionado = null;
    document.querySelectorAll('.tower-btn').forEach(btn => btn.classList.remove('active'));
}

function actualizarPanelInspector() {
    const inspectName = document.getElementById('inspect-name');
    const inspectActions = document.getElementById('inspect-actions');

    if (!torreInspeccionada) {
        inspectName.innerText = "Haz clic en una torre para ver opciones";
        inspectActions.className = 'hidden';
        return;
    }

    const info = DATOS_TORRES[torreInspeccionada.tipo];
    inspectName.innerHTML = `<span class="text-base mr-1">${info.icono}</span> ${info.nombre} <span class="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-black text-xs ml-1">Nv. ${torreInspeccionada.nivel}</span>`;
    inspectActions.className = 'flex items-center gap-2';

    const upgradeBtn = document.getElementById('btn-upgrade');
    if (torreInspeccionada.nivel >= 3) {
        upgradeBtn.disabled = true;
        upgradeBtn.innerText = '★ Máx Nivel';
        upgradeBtn.className = 'px-3 py-1 bg-slate-800 text-slate-500 font-bold rounded-xl cursor-not-allowed border border-slate-700/50';
    } else {
        upgradeBtn.disabled = false;
        upgradeBtn.className = 'px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-xl transition shadow-lg shadow-emerald-950/40 text-xs flex items-center gap-1';
        const costoUpgrade = Math.round(info.costo * (torreInspeccionada.nivel === 1 ? 0.8 : 1.25));
        upgradeBtn.innerHTML = `⭐ Mejorar ($<span id="upgrade-cost">${costoUpgrade}</span>)`;
    }

    document.getElementById('sell-value').innerText = Math.round(torreInspeccionada.inversionTotal * 0.7);
}

function mejorarTorreSeleccionada() {
    if (!torreInspeccionada || torreInspeccionada.nivel >= 3) return;
    const info = DATOS_TORRES[torreInspeccionada.tipo];
    const costoUpgrade = Math.round(info.costo * (torreInspeccionada.nivel === 1 ? 0.8 : 1.25));

    if (oro >= costoUpgrade) {
        oro -= costoUpgrade;
        torreInspeccionada.nivel++;
        torreInspeccionada.inversionTotal += costoUpgrade;
        torreInspeccionada.rango += 16;
        torreInspeccionada.danio *= 1.45;
        torreInspeccionada.danioPorFrame *= 1.4;
        torreInspeccionada.cadencia = Math.max(12, Math.round(torreInspeccionada.cadencia * 0.82));

        for (let i = 0; i < 20; i++) {
            particulas.push({
                x: torreInspeccionada.x,
                y: torreInspeccionada.y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2,
                color: '#fbbf24',
                size: Math.random() * 3.5 + 2,
                life: 35
            });
        }
        playSound('coin');
        actualizarMarcadoresUI();
        actualizarPanelInspector();
    }
}

function venderTorreSeleccionada() {
    if (!torreInspeccionada) return;
    const valorVenta = Math.round(torreInspeccionada.inversionTotal * 0.7);
    oro += valorVenta;
    playSound('coin');

    torres = torres.filter(t => t !== torreInspeccionada);
    torreInspeccionada = null;
    actualizarMarcadoresUI();
    actualizarPanelInspector();
}

function alternarVelocidad() {
    velocidad = velocidad === 1 ? 2 : 1;
    document.getElementById('speed-text').innerText = `${velocidad}x`;
    const btn = document.getElementById('btn-speed');
    btn.className = velocidad === 2
        ? 'px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs border border-amber-400 transition shadow-lg'
        : 'px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition';
}

function iniciarSiguienteOleada() {
    if (oleadaEnProgreso || juegoTerminado) return;
    if (oleadaActual >= OLEADAS_TOTALES) return;

    oleadaActual++;
    oleadaEnProgreso = true;
    document.getElementById('btn-wave').disabled = true;
    document.getElementById('btn-wave').className = 'px-5 py-2 rounded-xl bg-slate-800 text-slate-500 font-black text-sm cursor-not-allowed flex items-center gap-2 border border-slate-700/50';

    colaSpawn = [];
    const count = 6 + oleadaActual * 3;
    const multiVelocidad = 1 + (oleadaActual - 1) * 0.05;

    for (let i = 0; i < count; i++) {
        let tipo = 'goblin';
        let hp = 45 + oleadaActual * 18;
        let speed = 2.0 * multiVelocidad;
        let recompensa = 4 + Math.floor(oleadaActual * 0.6);
        let color = '#10b981';
        let radio = 11;

        if (oleadaActual >= 3 && i % 3 === 0) {
            tipo = 'orc';
            hp = 110 + oleadaActual * 28;
            speed = 1.50 * multiVelocidad;
            recompensa = 8 + oleadaActual;
            color = '#f97316';
            radio = 15;
        }

        if (oleadaActual >= 6 && i % 4 === 0) {
            tipo = 'golem';
            hp = 280 + oleadaActual * 45;
            speed = 1.10 * multiVelocidad;
            recompensa = 16 + oleadaActual * 1.5;
            color = '#64748b';
            radio = 18;
        }

        if (oleadaActual === 10 && i === count - 1) {
            tipo = 'boss';
            hp = 1400;
            speed = 0.58 * multiVelocidad;
            recompensa = 80;
            color = '#dc2626';
            radio = 24;
        }

        // Lógica de escudo asignada por cada enemigo individualmente
        const tieneEscudo = oleadaActual >= 5 && Math.random() < 0.35;
        const valorEscudo = tieneEscudo ? Math.round(hp * 0.5) : 0;

        colaSpawn.push({
            tipo,
            hpMax: hp,
            hp: hp,
            speedBase: speed,
            speed: speed,
            recompensa: Math.round(recompensa),
            color,
            radio,
            puntoIdx: 0,
            x: CAMINO[0].x,
            y: CAMINO[0].y,
            slowTimer: 0,
            animOffset: Math.random() * Math.PI * 2,
            escudo: valorEscudo,
            escudoMax: valorEscudo
        });
    }

    actualizarMarcadoresUI();
}

function aplicarDanioEnemigo(enemigo, cantidadDanio) {
    if (enemigo.escudo > 0) {
        if (enemigo.escudo >= cantidadDanio) {
            enemigo.escudo -= cantidadDanio;
        } else {
            const sobrante = cantidadDanio - enemigo.escudo;
            enemigo.escudo = 0;
            enemigo.hp -= sobrante;

            for (let i = 0; i < 6; i++) {
                particulas.push({
                    x: enemigo.x, y: enemigo.y,
                    vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
                    color: '#38bdf8', size: 2.5, life: 15
                });
            }
        }
    } else {
        enemigo.hp -= cantidadDanio;
    }
}

canvas.addEventListener('click', (e) => {
    if (juegoTerminado) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const rawY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const x = snapToGrid(rawX);
    const y = snapToGrid(rawY);

    const torreClickeada = torres.find(t => distSq(t.x, t.y, x, y) < 20 * 20);
    if (torreClickeada) {
        torreInspeccionada = torreClickeada;
        deseleccionarTorreConstruccion();
        actualizarPanelInspector();
        return;
    }

    if (!tipoTorreSeleccionado) return;

    const info = DATOS_TORRES[tipoTorreSeleccionado];
    if (oro < info.costo) return;
    if (estaEnCamino(x, y)) return;

    for (let t of torres) {
        if (distSq(t.x, t.y, x, y) < (TILE_SIZE - 2) * (TILE_SIZE - 2)) return;
    }

    oro -= info.costo;
    torres.push({
        x,
        y,
        tipo: tipoTorreSeleccionado,
        nivel: 1,
        inversionTotal: info.costo,
        rango: info.rango,
        danio: info.danio || 0,
        danioPorFrame: info.danioPorFrame || 0,
        cadencia: info.cadencia || 30,
        cooldown: 0,
        objetivoLaser: null,
        angulo: 0
    });

    playSound('coin');
    deseleccionarTorreConstruccion();
    actualizarMarcadoresUI();
    actualizarPanelInspector();
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    mousePos.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    mousePos.dentro = true;
});

canvas.addEventListener('mouseleave', () => {
    mousePos.dentro = false;
});

function update() {
    if (juegoTerminado) return;

    globalTime += 0.05;

    for (let s = 0; s < velocidad; s++) {
        if (colaSpawn.length > 0) {
            frameSpawn++;
            if (frameSpawn >= 36) {
                frameSpawn = 0;
                enemigos.push(colaSpawn.shift());
            }
        }

        for (let i = enemigos.length - 1; i >= 0; i--) {
            const e = enemigos[i];

            if (e.slowTimer > 0) {
                e.slowTimer--;
                e.speed = e.speedBase * 0.6;
            } else {
                e.speed = e.speedBase;
            }

            const target = CAMINO[e.puntoIdx + 1];
            if (!target) {
                vidas--;
                playSound('hurt');
                enemigos.splice(i, 1);
                uiDirty = true;

                if (vidas <= 0) {
                    actualizarMarcadoresUI();
                    finalizarJuego(false);
                    return;
                }
                continue;
            }

            const dx = target.x - e.x;
            const dy = target.y - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= e.speed) {
                e.x = target.x;
                e.y = target.y;
                e.puntoIdx++;
            } else {
                e.x += (dx / dist) * e.speed;
                e.y += (dy / dist) * e.speed;
            }
        }

        // Progreso de cada enemigo en el camino, calculado UNA vez (antes se recalculaba
        // por cada torre × cada enemigo, ahora es solo una vez × cada enemigo)
        for (let e of enemigos) {
            const sig = CAMINO[e.puntoIdx + 1];
            e.progreso = e.puntoIdx * 1000000 - distSq(e.x, e.y, sig ? sig.x : e.x, sig ? sig.y : e.y);
        }

        for (let t of torres) {
            let objetivo = null;
            let mayorProgreso = -Infinity;

            for (let e of enemigos) {
                const d2 = distSq(t.x, t.y, e.x, e.y);
                if (d2 <= t.rango * t.rango) {
                    if (e.progreso > mayorProgreso) {
                        mayorProgreso = e.progreso;
                        objetivo = e;
                    }
                }
            }

            if (objetivo) {
                t.angulo = Math.atan2(objetivo.y - t.y, objetivo.x - t.x);

                if (t.tipo === 'laser') {
                    t.objetivoLaser = objetivo;
                    aplicarDanioEnemigo(objetivo, t.danioPorFrame);
                    if (Math.random() < 0.3) {
                        particulas.push({
                            x: objetivo.x,
                            y: objetivo.y,
                            vx: (Math.random() - 0.5) * 4,
                            vy: (Math.random() - 0.5) * 4,
                            color: '#c084fc',
                            size: 2.5,
                            life: 18
                        });
                    }
                } else {
                    t.objetivoLaser = null;
                    if (t.cooldown <= 0) {
                        t.cooldown = t.cadencia;
                        dispararProyectil(t, objetivo);
                    }
                }
            } else {
                t.objetivoLaser = null;
            }

            if (t.cooldown > 0) t.cooldown--;
        }

        for (let i = proyectiles.length - 1; i >= 0; i--) {
            const p = proyectiles[i];
            const dx = p.objetivo.x - p.x;
            const dy = p.objetivo.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= p.velocidad || !enemigos.includes(p.objetivo)) {
                impactarProyectil(p);
                proyectiles.splice(i, 1);
            } else {
                p.x += (dx / dist) * p.velocidad;
                p.y += (dy / dist) * p.velocidad;
            }
        }

        for (let i = enemigos.length - 1; i >= 0; i--) {
            const e = enemigos[i];
            if (e.hp <= 0) {
                oro += e.recompensa;
                textosFlotantes.push({
                    text: `+${e.recompensa}g`,
                    x: e.x,
                    y: e.y,
                    color: '#facc15',
                    life: 32
                });

                for (let k = 0; k < 14; k++) {
                    particulas.push({
                        x: e.x,
                        y: e.y,
                        vx: (Math.random() - 0.5) * 5,
                        vy: (Math.random() - 0.5) * 5,
                        color: e.color,
                        size: Math.random() * 3 + 2,
                        life: 25
                    });
                }

                enemigos.splice(i, 1);
                uiDirty = true;
            }
        }

        if (oleadaEnProgreso && colaSpawn.length === 0 && enemigos.length === 0) {
            oleadaEnProgreso = false;
            playSound('coin');
            uiDirty = true;

            const waveBtn = document.getElementById('btn-wave');
            if (oleadaActual >= OLEADAS_TOTALES) {
                finalizarJuego(true);
            } else {
                waveBtn.disabled = false;
                waveBtn.className = 'px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg flex items-center gap-2';
            }
        }

        for (let i = particulas.length - 1; i >= 0; i--) {
            const p = particulas[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) particulas.splice(i, 1);
        }

        for (let i = textosFlotantes.length - 1; i >= 0; i--) {
            const t = textosFlotantes[i];
            t.y -= 0.8;
            t.life--;
            if (t.life <= 0) textosFlotantes.splice(i, 1);
        }
    }

    // Una sola escritura al DOM por frame en vez de una por cada evento (oro, muerte, etc.)
    if (uiDirty) {
        actualizarMarcadoresUI();
        uiDirty = false;
    }
}

function dispararProyectil(torre, objetivo) {
    if (torre.tipo === 'arrow') {
        playSound('shoot');
        proyectiles.push({
            x: torre.x,
            y: torre.y,
            objetivo,
            velocidad: 9.0,
            danio: torre.danio,
            tipo: 'arrow',
            color: '#f59e0b'
        });
    } else if (torre.tipo === 'cannon') {
        playSound('cannon');
        proyectiles.push({
            x: torre.x,
            y: torre.y,
            objetivo,
            velocidad: 6.0,
            danio: torre.danio,
            splash: torre.nivel === 3 ? 90 : (torre.nivel === 2 ? 80 : 70),
            tipo: 'cannon',
            color: '#ef4444'
        });
    } else if (torre.tipo === 'ice') {
        playSound('ice');
        proyectiles.push({
            x: torre.x,
            y: torre.y,
            objetivo,
            velocidad: 7.5,
            danio: torre.danio,
            tipo: 'ice',
            color: '#38bdf8'
        });
    }
}

function impactarProyectil(p) {
    if (p.tipo === 'cannon') {
        for (let e of enemigos) {
            if (distSq(p.x, p.y, e.x, e.y) <= p.splash * p.splash) {
                aplicarDanioEnemigo(e, p.danio);
            }
        }
        for (let k = 0; k < 20; k++) {
            particulas.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7,
                color: Math.random() < 0.5 ? '#f97316' : '#ef4444',
                size: Math.random() * 4 + 2,
                life: 22
            });
        }
    } else if (p.tipo === 'ice') {
        aplicarDanioEnemigo(p.objetivo, p.danio);
        p.objetivo.slowTimer = 75;
        for (let k = 0; k < 10; k++) {
            particulas.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: '#38bdf8',
                size: 3,
                life: 20
            });
        }
    } else {
        aplicarDanioEnemigo(p.objetivo, p.danio);
        for (let k = 0; k < 6; k++) {
            particulas.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: '#fbbf24',
                size: 2.5,
                life: 16
            });
        }
    }
}

function drawGrid() {
    if (!tipoTorreSeleccionado) return;

    const alpha = 0.18 + Math.sin(globalTime * 3) * 0.08;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += TILE_SIZE) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += TILE_SIZE) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

const glowSpriteCache = {};
function getGlowSprite(color, radio) {
    const key = color + '_' + radio;
    let sprite = glowSpriteCache[key];
    if (sprite) return sprite;

    const pad = 10; // espacio extra para que el blur no se recorte
    const size = (radio + pad) * 2;
    sprite = document.createElement('canvas');
    sprite.width = size;
    sprite.height = size;

    const sctx = sprite.getContext('2d');
    sctx.shadowColor = color;
    sctx.shadowBlur = 8;
    sctx.fillStyle = color;
    sctx.beginPath();
    sctx.arc(size / 2, size / 2, radio, 0, Math.PI * 2);
    sctx.fill();

    glowSpriteCache[key] = sprite;
    return sprite;
}

// Canvas en memoria para renderizado estático del fondo
const bgCanvas = document.createElement('canvas');
bgCanvas.width = 800;
bgCanvas.height = 500;
const bgCtx = bgCanvas.getContext('2d');

function preRenderFondo() {
    bgCtx.fillStyle = '#0a2315';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    bgCtx.fillStyle = 'rgba(16, 185, 129, 0.04)';
    bgCtx.beginPath();
    for (let i = 0; i < bgCanvas.width; i += 40) {
        for (let j = 0; j < bgCanvas.height; j += 40) {
            bgCtx.moveTo(i + 32, j + 20);
            bgCtx.arc(i + 20, j + 20, 12, 0, Math.PI * 2);
        }
    }
    bgCtx.fill();

    // --- Decoraciones (árboles, rocas, flores) ---
    // Son estáticas: nunca se mueven, así que se hornean aquí en vez de
    // redibujarse 40 veces por frame en draw().
    for (let dec of DECORACIONES) {
        if (dec.tipo === 'tree') {
            bgCtx.fillStyle = 'rgba(0,0,0,0.3)';
            bgCtx.beginPath();
            bgCtx.ellipse(dec.x, dec.y + dec.size * 0.6, dec.size * 0.8, dec.size * 0.4, 0, 0, Math.PI * 2);
            bgCtx.fill();

            bgCtx.fillStyle = '#064e3b';
            bgCtx.beginPath();
            bgCtx.arc(dec.x, dec.y, dec.size, 0, Math.PI * 2);
            bgCtx.fill();
            bgCtx.fillStyle = '#059669';
            bgCtx.beginPath();
            bgCtx.arc(dec.x - dec.size * 0.2, dec.y - dec.size * 0.2, dec.size * 0.6, 0, Math.PI * 2);
            bgCtx.fill();
        } else if (dec.tipo === 'rock') {
            bgCtx.fillStyle = '#334155';
            bgCtx.beginPath();
            bgCtx.arc(dec.x, dec.y, dec.size * 0.5, 0, Math.PI * 2);
            bgCtx.fill();
        } else {
            bgCtx.fillStyle = '#f43f5e';
            bgCtx.beginPath();
            bgCtx.arc(dec.x, dec.y, 3, 0, Math.PI * 2);
            bgCtx.fill();
        }
    }

    // --- Camino (sendero) ---
    // También estático: antes se trazaba con 3 pasadas de stroke en cada frame.
    bgCtx.lineCap = 'round';
    bgCtx.lineJoin = 'round';

    bgCtx.lineWidth = ANCHO_CAMINO;
    bgCtx.strokeStyle = '#2b1a09';
    bgCtx.beginPath();
    bgCtx.moveTo(CAMINO[0].x, CAMINO[0].y);
    for (let i = 1; i < CAMINO.length; i++) bgCtx.lineTo(CAMINO[i].x, CAMINO[i].y);
    bgCtx.stroke();

    bgCtx.lineWidth = ANCHO_CAMINO - 4;
    bgCtx.strokeStyle = '#5c3d24';
    bgCtx.beginPath();
    bgCtx.moveTo(CAMINO[0].x, CAMINO[0].y);
    for (let i = 1; i < CAMINO.length; i++) bgCtx.lineTo(CAMINO[i].x, CAMINO[i].y);
    bgCtx.stroke();

    bgCtx.lineWidth = 2;
    bgCtx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
    bgCtx.setLineDash([8, 8]);
    bgCtx.beginPath();
    bgCtx.moveTo(CAMINO[0].x, CAMINO[0].y);
    for (let i = 1; i < CAMINO.length; i++) bgCtx.lineTo(CAMINO[i].x, CAMINO[i].y);
    bgCtx.stroke();
    bgCtx.setLineDash([]);

    // --- Castillo (destino) ---
    // Estático (sin animación), así que también se hornea aquí. El portal de
    // entrada SÍ pulsa (usa globalTime) y por eso se sigue dibujando en draw().
    const dest = CAMINO[CAMINO.length - 1];
    bgCtx.fillStyle = 'rgba(0,0,0,0.5)';
    bgCtx.beginPath();
    bgCtx.ellipse(dest.x, dest.y + 16, 32, 12, 0, 0, Math.PI * 2);
    bgCtx.fill();

    bgCtx.fillStyle = '#1e293b';
    bgCtx.strokeStyle = '#f59e0b';
    bgCtx.lineWidth = 3.5;
    bgCtx.beginPath();
    bgCtx.arc(dest.x, dest.y, 30, 0, Math.PI * 2);
    bgCtx.fill();
    bgCtx.stroke();
    bgCtx.font = '24px sans-serif';
    bgCtx.textAlign = 'center';
    bgCtx.textBaseline = 'middle';
    bgCtx.fillText('🏰', dest.x, dest.y);
}

// Las decoraciones deben generarse ANTES de hornear el fondo, porque
// preRenderFondo() ahora las dibuja de forma permanente en bgCanvas.
generarDecoraciones();
preRenderFondo();

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bgCanvas, 0, 0);

    // El portal de entrada
    ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CAMINO[0].x, CAMINO[0].y, 20 + Math.sin(globalTime * 3) * 2, 0, Math.PI * 2); // Usa CAMINO[0].x en lugar de 15
    ctx.fill();
    ctx.stroke();

    drawGrid();

    if (torreInspeccionada) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(torreInspeccionada.x, torreInspeccionada.y, torreInspeccionada.rango, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (mousePos.dentro && tipoTorreSeleccionado && !torreInspeccionada && !juegoTerminado) {
        const snappedX = snapToGrid(mousePos.x);
        const snappedY = snapToGrid(mousePos.y);

        const info = DATOS_TORRES[tipoTorreSeleccionado];
        let celdaOcupada = torres.some(t => distSq(t.x, t.y, snappedX, snappedY) < (TILE_SIZE - 2) * (TILE_SIZE - 2));
        const puedeConstruir = oro >= info.costo && !estaEnCamino(snappedX, snappedY) && !celdaOcupada;

        ctx.fillStyle = puedeConstruir ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.35)';
        ctx.strokeStyle = puedeConstruir ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.fillRect(snappedX - TILE_SIZE / 2, snappedY - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
        ctx.strokeRect(snappedX - TILE_SIZE / 2, snappedY - TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);

        ctx.fillStyle = puedeConstruir ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.12)';
        ctx.beginPath();
        ctx.arc(snappedX, snappedY, info.rango, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    for (let t of torres) {
        const info = DATOS_TORRES[t.tipo];

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(t.x, t.y + 8, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = info.colorGlow;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = t === torreInspeccionada ? '#fbbf24' : '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angulo);

        ctx.fillStyle = info.color;
        ctx.fillRect(8, -4, 12, 8);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(8, -4, 12, 8);
        ctx.restore();

        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.icono, t.x, t.y);

        if (t.nivel > 1) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = '10px sans-serif';
            ctx.fillText(t.nivel === 2 ? '★★' : '★★★', t.x, t.y - 24);
        }

        if (t.tipo === 'laser' && t.objetivoLaser) {
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#d8b4fe';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.moveTo(t.x, t.y);
            ctx.lineTo(t.objetivoLaser.x, t.objetivoLaser.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    for (let p of proyectiles) {
        const radio = p.tipo === 'cannon' ? 6 : 4;
        const sprite = getGlowSprite(p.color, radio);
        ctx.drawImage(sprite, p.x - sprite.width / 2, p.y - sprite.height / 2);
    }

    // Renderizado correcto de Enemigos y sus Escudos
    for (let e of enemigos) {
        ctx.save();
        const floatY = Math.sin(globalTime * 8 + e.animOffset) * 2;
        ctx.translate(e.x, e.y + floatY);

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(0, e.radio * 0.8, e.radio, e.radio * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (e.slowTimer > 0) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.beginPath();
            ctx.arc(0, 0, e.radio + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Aura azul si el enemigo conserva su escudo
        if (e.escudo > 0) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, e.radio + 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(0, 0, e.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-e.radio * 0.3, -2, 2.8, 0, Math.PI * 2);
        ctx.arc(e.radio * 0.3, -2, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-e.radio * 0.3 + 0.5, -2, 1.2, 0, Math.PI * 2);
        ctx.arc(e.radio * 0.3 + 0.5, -2, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Barra de Vida
        const anchoBarra = e.radio * 2.4;
        const pct = Math.max(0, e.hp / e.hpMax);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(-anchoBarra / 2, -e.radio - 10, anchoBarra, 4);

        ctx.fillStyle = pct > 0.5 ? '#10b981' : (pct > 0.2 ? '#f59e0b' : '#ef4444');
        ctx.fillRect(-anchoBarra / 2, -e.radio - 10, anchoBarra * pct, 4);

        // Barra de Escudo (sobre la barra de vida)
        if (e.escudoMax > 0 && e.escudo > 0) {
            const pctEscudo = e.escudo / e.escudoMax;
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-anchoBarra / 2, -e.radio - 15, anchoBarra * pctEscudo, 3);
        }

        ctx.restore();
    }

    for (let p of particulas) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.font = 'black 13px sans-serif';
    ctx.textAlign = 'center';
    for (let t of textosFlotantes) {
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function finalizarJuego(victoria) {
    juegoTerminado = true;
    const overlay = document.getElementById('game-overlay');
    const title = document.getElementById('overlay-title');
    const msg = document.getElementById('overlay-msg');

    overlay.classList.remove('hidden');
    if (victoria) {
        title.innerText = "¡VICTORIA REAL! 👑";
        title.className = "text-3xl sm:text-4xl font-black text-amber-400";
        msg.innerText = `¡Has defendido el reino con éxito a través de las 10 oleadas! Oro acumulado: $${oro}.`;
    } else {
        title.innerText = "¡CASTILLO DERROTADO! 💀";
        title.className = "text-3xl sm:text-4xl font-black text-rose-500";
        msg.innerText = `Los invasores superaron tus defensas en la oleada ${oleadaActual}. ¡Inténtalo de nuevo ajustando tu estrategia de torres!`;
    }
}

function reiniciarJuego() {
    oro = 180;
    vidas = 20;
    oleadaActual = 0;
    oleadaEnProgreso = false;
    juegoTerminado = false;
    torres = [];
    enemigos = [];
    proyectiles = [];
    particulas = [];
    textosFlotantes = [];
    colaSpawn = [];
    torreInspeccionada = null;
    deseleccionarTorreConstruccion();

    document.getElementById('game-overlay').classList.add('hidden');
    const waveBtn = document.getElementById('btn-wave');
    waveBtn.disabled = false;
    waveBtn.className = 'px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg flex items-center gap-2';

    actualizarMarcadoresUI();
    actualizarPanelInspector();
}

document.addEventListener('DOMContentLoaded', () => {
    // Nota: generarDecoraciones() ya se ejecutó antes de preRenderFondo() más arriba,
    // así que el fondo horneado (bgCanvas) coincide con DECORACIONES. No se vuelve
    // a generar aquí para no desincronizar el fondo ya dibujado.
    actualizarMarcadoresUI();
    actualizarPanelInspector();
    requestAnimationFrame(loop);
});

function toggleRulesModal(mostrar) {
    const modal = document.getElementById('rules-modal');
    if (mostrar) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}