const canvas = document.getElementById('fightCanvas');
const ctx = canvas.getContext('2d');

const GRAVEDAD = 0.7;
const ALTO_SUELO = 96;

// Sistema de Partículas para Efectos Visuales (VFX)
let particulas = [];
let efectosTexto = [];
let contadorSacudida = 0;
let juegoTerminado = false;

function agregarChispas(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particulas.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            tamano: Math.random() * 5 + 2,
            color: color,
            vida: 1.0
        });
    }
}

function agregarTextoImpacto(x, y, texto, color) {
    efectosTexto.push({
        x: x,
        y: y,
        texto: texto,
        color: color,
        vida: 1.0,
        vy: -2
    });
}

function actualizarParticulas() {
    for (let i = particulas.length - 1; i >= 0; i--) {
        let p = particulas[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vida -= 0.04;
        if (p.vida <= 0) {
            particulas.splice(i, 1);
        } else {
            ctx.save();
            ctx.globalAlpha = p.vida;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.tamano, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = efectosTexto.length - 1; i >= 0; i--) {
        let t = efectosTexto[i];
        t.y += t.vy;
        t.vida -= 0.03;
        if (t.vida <= 0) {
            efectosTexto.splice(i, 1);
        } else {
            ctx.save();
            ctx.globalAlpha = t.vida;
            ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = t.color;
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 6;
            ctx.fillText(t.texto, t.x, t.y);
            ctx.restore();
        }
    }
}

// Clase Peleador Avanzada con Gráficos Articulados
class Peleador {
    constructor({ pos, vel, colorCuerpo, colorAcento, offsetAtaque, mirandoDerecha, esP2 }) {
        this.pos = pos;
        this.vel = vel;
        this.ancho = 60;
        this.alto = 135;
        this.colorCuerpo = colorCuerpo;
        this.colorAcento = colorAcento;
        this.vida = 100;
        this.especial = 0;

        this.mirandoDerecha = mirandoDerecha;
        this.estaAtacando = false;
        this.esEspecial = false;
        this.enElSuelo = false;
        this.esP2 = esP2;

        this.cajaAtaque = {
            pos: { x: this.pos.x, y: this.pos.y },
            offset: offsetAtaque,
            ancho: 110,
            alto: 50
        };

        this.anguloPierna = 0;
    }

    dibujar() {
        ctx.save();

        const x = this.pos.x;
        const y = this.pos.y;
        const dir = this.mirandoDerecha ? 1 : -1;

        // Aura de Poder cuando el Especial está al 100%
        if (this.especial >= 100) {
            ctx.save();
            ctx.shadowColor = this.colorAcento;
            ctx.shadowBlur = 20;
            ctx.strokeStyle = this.colorAcento;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(x + this.ancho / 2, y + this.alto / 2, this.ancho / 1.2, this.alto / 1.8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Sombra en el suelo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(x + this.ancho / 2, canvas.height - ALTO_SUELO + 5, 35, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Piernas (Animadas al caminar)
        ctx.fillStyle = '#1a1a2e';
        const offsetCaminar = Math.sin(Date.now() * 0.01) * (this.vel.x !== 0 ? 15 : 0);
        ctx.fillRect(x + 10 + offsetCaminar, y + 80, 16, 55);
        ctx.fillRect(x + 34 - offsetCaminar, y + 80, 16, 55);

        // Torso / Armadura
        let gradienteTorso = ctx.createLinearGradient(x, y, x + this.ancho, y + 80);
        gradienteTorso.addColorStop(0, this.colorCuerpo);
        gradienteTorso.addColorStop(1, '#0f0f1b');
        ctx.fillStyle = gradienteTorso;
        ctx.fillRect(x + 8, y + 30, this.ancho - 16, 55);

        // Acentos / Pechera
        ctx.fillStyle = this.colorAcento;
        ctx.fillRect(x + 14, y + 35, this.ancho - 28, 12);

        // Cabeza / Casco
        ctx.fillStyle = this.colorCuerpo;
        ctx.beginPath();
        ctx.arc(x + this.ancho / 2, y + 16, 18, 0, Math.PI * 2);
        ctx.fill();

        // Visor Neón (Ojos)
        ctx.fillStyle = this.colorAcento;
        ctx.shadowColor = this.colorAcento;
        ctx.shadowBlur = 10;
        const visorX = dir === 1 ? x + this.ancho / 2 : x + this.ancho / 2 - 12;
        ctx.fillRect(visorX, y + 10, 12, 6);
        ctx.shadowBlur = 0;

        // Brazos y Ataque Normal
        ctx.fillStyle = this.colorCuerpo;
        if (this.estaAtacando) {
            // Brazo extendido dando un golpe potente
            const puñoX = dir === 1 ? x + this.ancho : x - 45;
            ctx.fillStyle = this.colorAcento;
            ctx.shadowColor = this.colorAcento;
            ctx.shadowBlur = 15;
            ctx.fillRect(puñoX, y + 32, 45, 20);
            ctx.shadowBlur = 0;
        } else {
            // Guardia estándar
            const guardiaX = dir === 1 ? x + this.ancho - 15 : x - 5;
            ctx.fillRect(guardiaX, y + 35, 18, 30);
        }

        // Renderizado del Ráfaga de Ataque Especial
        if (this.esEspecial) {
            const ataqueX = dir === 1 ? x + this.ancho : x - 180;
            let gradEspecial = ctx.createLinearGradient(ataqueX, y, ataqueX + 180, y);
            gradEspecial.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradEspecial.addColorStop(0.5, this.colorAcento);
            gradEspecial.addColorStop(1, 'transparent');

            ctx.fillStyle = gradEspecial;
            ctx.shadowColor = this.colorAcento;
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.ellipse(ataqueX + 90, y + 45, 90, 35, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    actualizar() {
        if (this.mirandoDerecha) {
            this.cajaAtaque.pos.x = this.pos.x + this.cajaAtaque.offset.x;
        } else {
            this.cajaAtaque.pos.x = this.pos.x - this.cajaAtaque.ancho;
        }
        this.cajaAtaque.pos.y = this.pos.y + this.cajaAtaque.offset.y;

        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        if (this.pos.y + this.alto + this.vel.y >= canvas.height - ALTO_SUELO) {
            this.vel.y = 0;
            this.pos.y = canvas.height - ALTO_SUELO - this.alto;
            this.enElSuelo = true;
        } else {
            this.vel.y += GRAVEDAD;
            this.enElSuelo = false;
        }

        if (this.pos.x < 0) this.pos.x = 0;
        if (this.pos.x + this.ancho > canvas.width) this.pos.x = canvas.width - this.ancho;

        this.dibujar();
    }

    atacar() {
        if (this.estaAtacando || this.esEspecial) return;
        this.estaAtacando = true;
        setTimeout(() => { this.estaAtacando = false; }, 150);
    }

    lanzarEspecial() {
        if (this.especial < 100 || this.estaAtacando || this.esEspecial) return;
        this.especial = 0;
        this.esEspecial = true;
        setTimeout(() => { this.esEspecial = false; }, 320);
    }
}

// Inicialización de Jugadores con Nuevos Paletas Neón
const jugador1 = new Peleador({
    pos: { x: 150, y: 0 },
    vel: { x: 0, y: 0 },
    colorCuerpo: '#1d3557',
    colorAcento: '#00f0ff',
    offsetAtaque: { x: 60, y: 20 },
    mirandoDerecha: true,
    esP2: false
});

const jugador2 = new Peleador({
    pos: { x: 800, y: 0 },
    vel: { x: 0, y: 0 },
    colorCuerpo: '#6b0504',
    colorAcento: '#ff0055',
    offsetAtaque: { x: 60, y: 20 },
    mirandoDerecha: false,
    esP2: true
});

// Teclado
const teclas = { a: false, d: false, ArrowLeft: false, ArrowRight: false };

window.addEventListener('keydown', (e) => {
    if (juegoTerminado) return;
    switch (e.key) {
        case 'a': case 'A': teclas.a = true; break;
        case 'd': case 'D': teclas.d = true; break;
        case 'w': case 'W': if (jugador1.enElSuelo) jugador1.vel.y = -16; break;
        case 'f': case 'F': jugador1.atacar(); break;
        case 'g': case 'G': jugador1.lanzarEspecial(); break;

        case 'ArrowLeft': teclas.ArrowLeft = true; break;
        case 'ArrowRight': teclas.ArrowRight = true; break;
        case 'ArrowUp': if (jugador2.enElSuelo) jugador2.vel.y = -16; break;
        case 'l': case 'L': case '1': jugador2.atacar(); break;
        case 'k': case 'K': case '2': jugador2.lanzarEspecial(); break;
    }
});

window.addEventListener('keyup', (e) => {
    if (juegoTerminado) return;
    switch (e.key) {
        case 'a': case 'A': teclas.a = false; break;
        case 'd': case 'D': teclas.d = false; break;
        case 'ArrowLeft': teclas.ArrowLeft = false; break;
        case 'ArrowRight': teclas.ArrowRight = false; break;
    }
});

function colisionHitbox(atacan, reciben) {
    const anchoAtaque = atacan.esEspecial ? atacan.cajaAtaque.ancho * 1.6 : atacan.cajaAtaque.ancho;
    return (
        atacan.cajaAtaque.pos.x < reciben.pos.x + reciben.ancho &&
        atacan.cajaAtaque.pos.x + anchoAtaque > reciben.pos.x &&
        atacan.cajaAtaque.pos.y < reciben.pos.y + reciben.alto &&
        atacan.cajaAtaque.pos.y + atacan.cajaAtaque.alto > reciben.pos.y
    );
}

// Dibujado del Escenario Futurista / Synthwave
function dibujarEscenario() {
    // Cielo Nocturno
    let gradienteCielo = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradienteCielo.addColorStop(0, '#05050f');
    gradienteCielo.addColorStop(0.6, '#1a0b2e');
    gradienteCielo.addColorStop(1, '#11001c');
    ctx.fillStyle = gradienteCielo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sol Synthwave / Luna Neón
    ctx.save();
    let gradSol = ctx.createLinearGradient(512, 100, 512, 300);
    gradSol.addColorStop(0, '#ff0055');
    gradSol.addColorStop(1, '#ff9900');
    ctx.fillStyle = gradSol;
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(512, 220, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Siluetas de Edificios
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(80, 220, 90, 260);
    ctx.fillRect(220, 180, 110, 300);
    ctx.fillRect(680, 200, 100, 280);
    ctx.fillRect(820, 240, 120, 240);

    // Suelo de Rejilla Neón
    ctx.fillStyle = '#120024';
    ctx.fillRect(0, canvas.height - ALTO_SUELO, canvas.width, ALTO_SUELO);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - ALTO_SUELO);
    ctx.lineTo(canvas.width, canvas.height - ALTO_SUELO);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Líneas Perspectiva en el Suelo
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, canvas.height - ALTO_SUELO);
        ctx.lineTo(i + (i - canvas.width / 2) * 0.5, canvas.height);
        ctx.stroke();
    }
}

let tiempoRestante = 99;
let temporizadorID;

function iniciarCronometro() {
    temporizadorID = setInterval(() => {
        if (tiempoRestante > 0) {
            tiempoRestante--;
            document.getElementById('timer').innerText = tiempoRestante;
        } else {
            determinarGanador();
        }
    }, 1000);
}

function determinarGanador() {
    if (juegoTerminado) return;
    juegoTerminado = true;
    teclas.a = teclas.d = teclas.ArrowLeft = teclas.ArrowRight = false;
    jugador1.vel.x = 0;
    jugador2.vel.x = 0;
    clearInterval(temporizadorID);
    const overlay = document.getElementById('game-over-overlay');
    const winnerText = document.getElementById('winner-text');
    overlay.style.display = 'flex';

    if (jugador1.vida === jugador2.vida) {
        winnerText.innerText = '¡EMPATE!';
    } else if (jugador1.vida > jugador2.vida) {
        winnerText.innerText = '¡JUGADOR 1 GANA!';
    } else {
        winnerText.innerText = '¡JUGADOR 2 GANA!';
    }
}

function reiniciarPelea() {
    juegoTerminado = false;
    teclas.a = teclas.d = teclas.ArrowLeft = teclas.ArrowRight = false;
    jugador1.vel.x = 0;
    jugador2.vel.x = 0;
    jugador1.vida = 100;
    jugador2.vida = 100;
    jugador1.especial = 0;
    jugador2.especial = 0;
    jugador1.pos = { x: 150, y: 0 };
    jugador2.pos = { x: 800, y: 0 };
    tiempoRestante = 99;

    document.getElementById('p1-health').style.width = '100%';
    document.getElementById('p2-health').style.width = '100%';
    document.getElementById('p1-special').style.width = '0%';
    document.getElementById('p2-special').style.width = '0%';
    document.getElementById('timer').innerText = '99';
    document.getElementById('game-over-overlay').style.display = 'none';

    iniciarCronometro();
}

// Bucle Principal
function animar() {
    requestAnimationFrame(animar);

    ctx.save();
    // Efecto Screen Shake
    if (contadorSacudida > 0) {
        ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        contadorSacudida--;
    }

    dibujarEscenario();

    // Movimiento (bloqueado durante la pantalla de resultado)
    jugador1.vel.x = 0;
    if (!juegoTerminado) {
        if (teclas.a) jugador1.vel.x = -6;
        if (teclas.d) jugador1.vel.x = 6;
    }

    jugador2.vel.x = 0;
    if (!juegoTerminado) {
        if (teclas.ArrowLeft) jugador2.vel.x = -6;
        if (teclas.ArrowRight) jugador2.vel.x = 6;
    }

    jugador1.mirandoDerecha = jugador1.pos.x < jugador2.pos.x;
    jugador2.mirandoDerecha = jugador2.pos.x < jugador1.pos.x;

    jugador1.actualizar();
    jugador2.actualizar();

    // Colisión P1 -> P2
    if ((jugador1.estaAtacando || jugador1.esEspecial) && colisionHitbox(jugador1, jugador2)) {
        const danio = jugador1.esEspecial ? 28 : 9;
        jugador2.vida = Math.max(0, jugador2.vida - danio);
        document.getElementById('p2-health').style.width = jugador2.vida + '%';

        jugador1.especial = Math.min(100, jugador1.especial + 18);
        document.getElementById('p1-special').style.width = jugador1.especial + '%';

        // Efectos Visuales
        agregarChispas(jugador2.pos.x + 20, jugador2.pos.y + 40, '#00f0ff');
        agregarTextoImpacto(jugador2.pos.x, jugador2.pos.y - 10, jugador1.esEspecial ? '¡ULTRA!' : 'HIT!', '#00f0ff');
        contadorSacudida = jugador1.esEspecial ? 12 : 5;

        jugador1.estaAtacando = false;
        jugador1.esEspecial = false;
    }

    // Colisión P2 -> P1
    if ((jugador2.estaAtacando || jugador2.esEspecial) && colisionHitbox(jugador2, jugador1)) {
        const danio = jugador2.esEspecial ? 28 : 9;
        jugador1.vida = Math.max(0, jugador1.vida - danio);
        document.getElementById('p1-health').style.width = jugador1.vida + '%';

        jugador2.especial = Math.min(100, jugador2.especial + 18);
        document.getElementById('p2-special').style.width = jugador2.especial + '%';

        // Efectos Visuales
        agregarChispas(jugador1.pos.x + 20, jugador1.pos.y + 40, '#ff0055');
        agregarTextoImpacto(jugador1.pos.x, jugador1.pos.y - 10, jugador2.esEspecial ? '¡ULTRA!' : 'HIT!', '#ff0055');
        contadorSacudida = jugador2.esEspecial ? 12 : 5;

        jugador2.estaAtacando = false;
        jugador2.esEspecial = false;
    }

    actualizarParticulas();
    ctx.restore();

    if (jugador1.vida <= 0 || jugador2.vida <= 0) {
        determinarGanador();
    }
}

iniciarCronometro();
animar();