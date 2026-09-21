// Tower Defense - Lógica del Juego en Canvas con Sistema de Oleadas, Torres y Mejoras

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
let oro = 160;
let vidas = 20;
let oleadaActual = 0;
const OLEADAS_TOTALES = 10;
let oleadaEnProgreso = false;
let velocidad = 1;
let juegoTerminado = false;

let tipoTorreSeleccionado = 'arrow';
let torreInspeccionada = null;
let mousePos = { x: -100, y: -100, dentro: false };

// Sendero (Camino de waypoints)
const CAMINO = [
    { x: -20, y: 110 },
    { x: 220, y: 110 },
    { x: 220, y: 360 },
    { x: 440, y: 360 },
    { x: 440, y: 150 },
    { x: 670, y: 150 },
    { x: 670, y: 440 },
    { x: 820, y: 440 }
];

const ANCHO_CAMINO = 54;

// Definición de Torres
const DATOS_TORRES = {
    arrow: {
        nombre: 'Torre Arquera',
        costo: 50,
        rango: 115,
        danio: 16,
        cadencia: 30, // frames
        color: '#f59e0b',
        icono: '🏹'
    },
    cannon: {
        nombre: 'Torre Cañón',
        costo: 100,
        rango: 95,
        danio: 45,
        cadencia: 65,
        splash: 65,
        color: '#ef4444',
        icono: '💣'
    },
    ice: {
        nombre: 'Torre de Hielo',
        costo: 80,
        rango: 105,
        danio: 8,
        cadencia: 40,
        ralentizar: 0.45,
        duracionSlow: 80,
        color: '#38bdf8',
        icono: '❄️'
    },
    laser: {
        nombre: 'Torre Láser',
        costo: 130,
        rango: 125,
        danioPorFrame: 1.8,
        color: '#c084fc',
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

// Utilidades matemáticas de colisión y distancia
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
        if (d < ANCHO_CAMINO / 2 + 16) return true;
    }
    return false;
}

// Actualización de UI superior
function actualizarMarcadoresUI() {
    document.getElementById('gold-count').innerText = oro;
    document.getElementById('lives-count').innerText = vidas;
    document.getElementById('wave-display').innerText = `Oleada ${oleadaActual} / ${OLEADAS_TOTALES}`;
    document.getElementById('enemies-left').innerText = `${enemigos.length + colaSpawn.length} vivos`;
}

// Selector de tipos de torre
function seleccionarTipoTorre(tipo) {
    tipoTorreSeleccionado = tipo;
    torreInspeccionada = null;
    actualizarPanelInspector();

    document.querySelectorAll('.tower-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === tipo);
    });
}

function actualizarPanelInspector() {
    const inspectName = document.getElementById('inspect-name');
    const inspectActions = document.getElementById('inspect-actions');

    if (!torreInspeccionada) {
        inspectName.innerText = "Haz clic en una torre para mejorar";
        inspectActions.className = 'hidden';
        return;
    }

    const info = DATOS_TORRES[torreInspeccionada.tipo];
    inspectName.innerHTML = `${info.icono} ${info.nombre} <span class="text-emerald-400 font-bold">Nv. ${torreInspeccionada.nivel}</span>`;
    inspectActions.className = 'flex items-center gap-2';

    const upgradeBtn = document.getElementById('btn-upgrade');
    if (torreInspeccionada.nivel >= 3) {
        upgradeBtn.disabled = true;
        upgradeBtn.innerText = 'Máx Nivel';
        upgradeBtn.className = 'px-3 py-1 bg-slate-700 text-slate-400 font-bold rounded-lg cursor-not-allowed';
    } else {
        upgradeBtn.disabled = false;
        upgradeBtn.className = 'px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition';
        const costoUpgrade = Math.round(info.costo * (torreInspeccionada.nivel === 1 ? 0.9 : 1.4));
        document.getElementById('upgrade-cost').innerText = costoUpgrade;
    }

    const valorVenta = Math.round(torreInspeccionada.inversionTotal * 0.7);
    document.getElementById('sell-value').innerText = valorVenta;
}

function mejorarTorreSeleccionada() {
    if (!torreInspeccionada || torreInspeccionada.nivel >= 3) return;
    const info = DATOS_TORRES[torreInspeccionada.tipo];
    const costoUpgrade = Math.round(info.costo * (torreInspeccionada.nivel === 1 ? 0.9 : 1.4));

    if (oro >= costoUpgrade) {
        oro -= costoUpgrade;
        torreInspeccionada.nivel++;
        torreInspeccionada.inversionTotal += costoUpgrade;
        torreInspeccionada.rango += 18;
        torreInspeccionada.danio *= 1.5;
        torreInspeccionada.cadencia = Math.max(15, Math.round(torreInspeccionada.cadencia * 0.85));

        // Partículas de mejora doradas
        for (let i = 0; i < 16; i++) {
            particulas.push({
                x: torreInspeccionada.x,
                y: torreInspeccionada.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                color: '#fbbf24',
                size: Math.random() * 3 + 2,
                life: 30
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
        ? 'px-3 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs border border-amber-400 transition'
        : 'px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition';
}

// Generación de Oleadas
function iniciarSiguienteOleada() {
    if (oleadaEnProgreso || juegoTerminado) return;
    if (oleadaActual >= OLEADAS_TOTALES) return;

    oleadaActual++;
    oleadaEnProgreso = true;
    document.getElementById('btn-wave').disabled = true;
    document.getElementById('btn-wave').className = 'px-5 py-2 rounded-xl bg-slate-800 text-slate-500 font-black text-sm cursor-not-allowed flex items-center gap-2';

    // Composición de enemigos para la oleada
    colaSpawn = [];
    const count = 7 + oleadaActual * 3;

    for (let i = 0; i < count; i++) {
        let tipo = 'goblin';
        let hp = 55 + oleadaActual * 25;
        let speed = 2.1;
        let recompensa = 8 + Math.floor(oleadaActual * 1.5);
        let color = '#10b981';
        let radio = 11;

        if (oleadaActual >= 3 && i % 3 === 0) {
            tipo = 'orc';
            hp = 140 + oleadaActual * 40;
            speed = 1.4;
            recompensa = 16 + oleadaActual * 2;
            color = '#f97316';
            radio = 15;
        }

        if (oleadaActual >= 6 && i % 5 === 0) {
            tipo = 'golem';
            hp = 380 + oleadaActual * 70;
            speed = 0.9;
            recompensa = 35 + oleadaActual * 4;
            color = '#64748b';
            radio = 18;
        }

        if (oleadaActual === 10 && i === count - 1) {
            tipo = 'boss';
            hp = 2500;
            speed = 0.75;
            recompensa = 150;
            color = '#dc2626';
            radio = 24;
        }

        colaSpawn.push({
            tipo,
            hpMax: hp,
            hp: hp,
            speedBase: speed,
            speed: speed,
            recompensa,
            color,
            radio,
            puntoIdx: 0,
            x: CAMINO[0].x,
            y: CAMINO[0].y,
            slowTimer: 0
        });
    }

    actualizarMarcadoresUI();
}

// Colocación de Torres
canvas.addEventListener('click', (e) => {
    if (juegoTerminado) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // ¿Hizo clic en una torre existente?
    const torreClickeada = torres.find(t => distSq(t.x, t.y, x, y) < 22 * 22);
    if (torreClickeada) {
        torreInspeccionada = torreClickeada;
        actualizarPanelInspector();
        return;
    }

    // Si no, intentar construir una torre nueva
    const info = DATOS_TORRES[tipoTorreSeleccionado];
    if (oro < info.costo) return;

    // Validar que no esté en el camino
    if (estaEnCamino(x, y)) return;

    // Validar distancia mínima con otras torres
    for (let t of torres) {
        if (distSq(t.x, t.y, x, y) < 36 * 36) return;
    }

    // Construir
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
    actualizarMarcadoresUI();
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

// Bucle de Simulación del Juego
function update() {
    if (juegoTerminado) return;

    for (let s = 0; s < velocidad; s++) {
        // 1. Spawning de enemigos
        if (colaSpawn.length > 0) {
            frameSpawn++;
            if (frameSpawn >= 38) {
                frameSpawn = 0;
                enemigos.push(colaSpawn.shift());
            }
        }

        // 2. Movimiento de enemigos a lo largo del sendero
        for (let i = enemigos.length - 1; i >= 0; i--) {
            const e = enemigos[i];

            // Gestión de ralentización (hielo)
            if (e.slowTimer > 0) {
                e.slowTimer--;
                e.speed = e.speedBase * 0.5;
            } else {
                e.speed = e.speedBase;
            }

            const target = CAMINO[e.puntoIdx + 1];
            if (!target) {
                // Llegó al final -> Pierde 1 vida
                vidas--;
                playSound('hurt');
                enemigos.splice(i, 1);
                actualizarMarcadoresUI();

                if (vidas <= 0) {
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

        // 3. Lógica de torres (búsqueda y ataque)
        for (let t of torres) {
            // Buscar enemigos dentro de rango (priorizar al más avanzado en el camino)
            let objetivo = null;
            let mayorProgreso = -1;

            for (let e of enemigos) {
                const d2 = distSq(t.x, t.y, e.x, e.y);
                if (d2 <= t.rango * t.rango) {
                    const progreso = e.puntoIdx * 1000 + (CAMINO[e.puntoIdx + 1] ? -distSq(e.x, e.y, CAMINO[e.puntoIdx + 1].x, CAMINO[e.puntoIdx + 1].y) : 0);
                    if (progreso > mayorProgreso) {
                        mayorProgreso = progreso;
                        objetivo = e;
                    }
                }
            }

            if (objetivo) {
                t.angulo = Math.atan2(objetivo.y - t.y, objetivo.x - t.x);

                if (t.tipo === 'laser') {
                    t.objetivoLaser = objetivo;
                    objetivo.hp -= t.danioPorFrame;
                    if (Math.random() < 0.2) {
                        particulas.push({
                            x: objetivo.x,
                            y: objetivo.y,
                            vx: (Math.random() - 0.5) * 3,
                            vy: (Math.random() - 0.5) * 3,
                            color: '#c084fc',
                            size: 2,
                            life: 15
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

        // 4. Actualización de proyectiles
        for (let i = proyectiles.length - 1; i >= 0; i--) {
            const p = proyectiles[i];
            const dx = p.objetivo.x - p.x;
            const dy = p.objetivo.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= p.velocidad || !enemigos.includes(p.objetivo)) {
                // Impacto
                impactarProyectil(p);
                proyectiles.splice(i, 1);
            } else {
                p.x += (dx / dist) * p.velocidad;
                p.y += (dy / dist) * p.velocidad;
            }
        }

        // 5. Eliminar enemigos muertos y dar oro
        for (let i = enemigos.length - 1; i >= 0; i--) {
            const e = enemigos[i];
            if (e.hp <= 0) {
                oro += e.recompensa;
                textosFlotantes.push({
                    text: `+${e.recompensa}g`,
                    x: e.x,
                    y: e.y,
                    color: '#facc15',
                    life: 30
                });

                // Efecto de explosión de chispas
                for (let k = 0; k < 12; k++) {
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
                actualizarMarcadoresUI();
            }
        }

        // 6. Fin de oleada
        if (oleadaEnProgreso && colaSpawn.length === 0 && enemigos.length === 0) {
            oleadaEnProgreso = false;
            oro += 30 + oleadaActual * 5; // Bonus por completar oleada
            playSound('coin');
            actualizarMarcadoresUI();

            const waveBtn = document.getElementById('btn-wave');
            if (oleadaActual >= OLEADAS_TOTALES) {
                finalizarJuego(true);
            } else {
                waveBtn.disabled = false;
                waveBtn.className = 'px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg flex items-center gap-2';
            }
        }

        // 7. Partículas y textos
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
}

function dispararProyectil(torre, objetivo) {
    if (torre.tipo === 'arrow') {
        playSound('shoot');
        proyectiles.push({
            x: torre.x,
            y: torre.y,
            objetivo,
            velocidad: 8.5,
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
            velocidad: 5.5,
            danio: torre.danio,
            splash: torre.nivel === 3 ? 85 : (torre.nivel === 2 ? 75 : 65),
            tipo: 'cannon',
            color: '#ef4444'
        });
    } else if (torre.tipo === 'ice') {
        playSound('ice');
        proyectiles.push({
            x: torre.x,
            y: torre.y,
            objetivo,
            velocidad: 7.0,
            danio: torre.danio,
            tipo: 'ice',
            color: '#38bdf8'
        });
    }
}

function impactarProyectil(p) {
    if (p.tipo === 'cannon') {
        // Daño de área splash
        for (let e of enemigos) {
            if (distSq(p.x, p.y, e.x, e.y) <= p.splash * p.splash) {
                e.hp -= p.danio;
            }
        }
        for (let k = 0; k < 18; k++) {
            particulas.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                color: '#f97316',
                size: Math.random() * 4 + 2,
                life: 20
            });
        }
    } else if (p.tipo === 'ice') {
        p.objetivo.hp -= p.danio;
        p.objetivo.slowTimer = 90;
        for (let k = 0; k < 8; k++) {
            particulas.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: '#38bdf8',
                size: 3,
                life: 18
            });
        }
    } else {
        p.objetivo.hp -= p.danio;
        for (let k = 0; k < 5; k++) {
            particulas.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: '#fbbf24',
                size: 2,
                life: 15
            });
        }
    }
}

// Renderizado en Canvas
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Fondo de terreno verde oscuro
    ctx.fillStyle = '#0a2315';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Detalles sutiles del suelo
    ctx.fillStyle = '#0d2d1b';
    for (let i = 20; i < canvas.width; i += 60) {
        for (let j = 20; j < canvas.height; j += 60) {
            ctx.beginPath();
            ctx.arc(i, j, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 2. Dibujar Sendero (Camino de tierra empedrada)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Borde del camino
    ctx.lineWidth = ANCHO_CAMINO + 6;
    ctx.strokeStyle = '#291b0f';
    ctx.beginPath();
    ctx.moveTo(CAMINO[0].x, CAMINO[0].y);
    for (let i = 1; i < CAMINO.length; i++) ctx.lineTo(CAMINO[i].x, CAMINO[i].y);
    ctx.stroke();

    // Relleno del camino
    ctx.lineWidth = ANCHO_CAMINO;
    ctx.strokeStyle = '#452b14';
    ctx.beginPath();
    ctx.moveTo(CAMINO[0].x, CAMINO[0].y);
    for (let i = 1; i < CAMINO.length; i++) ctx.lineTo(CAMINO[i].x, CAMINO[i].y);
    ctx.stroke();

    // Línea central decorativa punteada
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#5a3a1d';
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(CAMINO[0].x, CAMINO[0].y);
    for (let i = 1; i < CAMINO.length; i++) ctx.lineTo(CAMINO[i].x, CAMINO[i].y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Base del Castillo final
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CAMINO[CAMINO.length - 1].x - 10, CAMINO[CAMINO.length - 1].y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏰', CAMINO[CAMINO.length - 1].x - 10, CAMINO[CAMINO.length - 1].y);

    // 3. Rango de la torre inspeccionada
    if (torreInspeccionada) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(torreInspeccionada.x, torreInspeccionada.y, torreInspeccionada.rango, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    // 4. Previsualización de colocación de torre
    if (mousePos.dentro && !torreInspeccionada && !juegoTerminado) {
        const info = DATOS_TORRES[tipoTorreSeleccionado];
        const puedeConstruir = oro >= info.costo && !estaEnCamino(mousePos.x, mousePos.y);

        ctx.fillStyle = puedeConstruir ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.2)';
        ctx.strokeStyle = puedeConstruir ? '#10b981' : '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, info.rango, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = puedeConstruir ? 'rgba(255, 255, 255, 0.4)' : 'rgba(239, 68, 68, 0.5)';
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 16, 0, Math.PI * 2);
        ctx.fill();
    }

    // 5. Torres construidas
    for (let t of torres) {
        const info = DATOS_TORRES[t.tipo];

        // Base
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = t === torreInspeccionada ? '#fbbf24' : '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Icono y cañón orientado
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angulo);

        // Cañón / Boca
        ctx.fillStyle = info.color;
        ctx.fillRect(8, -3, 10, 6);
        ctx.restore();

        // Icono central
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(info.icono, t.x, t.y);

        // Estrellas de nivel
        if (t.nivel > 1) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = '10px sans-serif';
            ctx.fillText(t.nivel === 2 ? '★★' : '★★★', t.x, t.y - 23);
        }

        // Rayo Láser si está activo
        if (t.tipo === 'laser' && t.objetivoLaser) {
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#d8b4fe';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(t.x, t.y);
            ctx.lineTo(t.objetivoLaser.x, t.objetivoLaser.y);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }

    // 6. Proyectiles
    for (let p of proyectiles) {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.tipo === 'cannon' ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // 7. Enemigos
    for (let e of enemigos) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Halo de congelación si está ralentizado
        if (e.slowTimer > 0) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.beginPath();
            ctx.arc(0, 0, e.radio + 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cuerpo
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(0, 0, e.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Ojos
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-e.radio * 0.3, -2, 2.5, 0, Math.PI * 2);
        ctx.arc(e.radio * 0.3, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Barra de Vida
        const anchoBarra = e.radio * 2.2;
        const pct = Math.max(0, e.hp / e.hpMax);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-anchoBarra / 2, -e.radio - 9, anchoBarra, 4);

        ctx.fillStyle = pct > 0.5 ? '#10b981' : (pct > 0.2 ? '#f59e0b' : '#ef4444');
        ctx.fillRect(-anchoBarra / 2, -e.radio - 9, anchoBarra * pct, 4);

        ctx.restore();
    }

    // 8. Partículas
    for (let p of particulas) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }

    // 9. Textos flotantes
    ctx.font = 'bold 12px sans-serif';
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
        msg.innerText = `¡Has defendido el castillo con éxito a través de las 10 oleadas! Oro final: $${oro}.`;
    } else {
        title.innerText = "¡CASTILLO DERROTADO! 💀";
        title.className = "text-3xl sm:text-4xl font-black text-rose-500";
        msg.innerText = `Los invasores superaron tus defensas en la oleada ${oleadaActual}. ¡Inténtalo de nuevo con otra estrategia de torres!`;
    }
}

function reiniciarJuego() {
    oro = 160;
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

    document.getElementById('game-overlay').classList.add('hidden');
    const waveBtn = document.getElementById('btn-wave');
    waveBtn.disabled = false;
    waveBtn.className = 'px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg flex items-center gap-2';

    actualizarMarcadoresUI();
    actualizarPanelInspector();
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    actualizarMarcadoresUI();
    actualizarPanelInspector();
    requestAnimationFrame(loop);
});
