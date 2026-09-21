const canvas = document.getElementById('fightCanvas');
const ctx = canvas.getContext('2d');

const GRAVEDAD = 0.7;
const ALTO_SUELO = 96; // Altura desde el fondo del canvas

// Clases principales
class Peleador {
    constructor({ pos, vel, color, offsetAtaque, mirandoDerecha }) {
        this.pos = pos;
        this.vel = vel;
        this.ancho = 50;
        this.alto = 130;
        this.color = color;
        this.vida = 100;
        this.especial = 0; // 0 a 100

        this.mirandoDerecha = mirandoDerecha;
        this.estaAtacando = false;
        this.esEspecial = false;
        this.cajaAtaque = {
            pos: { x: this.pos.x, y: this.pos.y },
            offset: offsetAtaque,
            ancho: 100,
            alto: 50
        };

        this.enElSuelo = false;
    }

    dibujar() {
        // Cuerpo
        ctx.fillStyle = this.color;
        ctx.fillRect(this.pos.x, this.pos.y, this.ancho, this.alto);

        // Ojo / Indicador de dirección
        ctx.fillStyle = '#ffffff';
        const ojoX = this.mirandoDerecha ? this.pos.x + 35 : this.pos.x + 5;
        ctx.fillRect(ojoX, this.pos.y + 15, 10, 10);

        // Ataque Normal
        if (this.estaAtacando) {
            ctx.fillStyle = '#f9d423';
            ctx.fillRect(
                this.cajaAtaque.pos.x,
                this.cajaAtaque.pos.y,
                this.cajaAtaque.ancho,
                this.cajaAtaque.alto
            );
        }

        // Ataque Especial (Ráfaga de energía)
        if (this.esEspecial) {
            ctx.fillStyle = '#00c6ff';
            ctx.fillRect(
                this.cajaAtaque.pos.x,
                this.cajaAtaque.pos.y - 20,
                this.cajaAtaque.ancho * 1.5,
                this.cajaAtaque.alto + 40
            );
        }
    }

    actualizar() {
        this.dibujar();

        // Actualizar orientación
        if (this.mirandoDerecha) {
            this.cajaAtaque.pos.x = this.pos.x + this.cajaAtaque.offset.x;
        } else {
            this.cajaAtaque.pos.x = this.pos.x - this.cajaAtaque.ancho;
        }
        this.cajaAtaque.pos.y = this.pos.y + this.cajaAtaque.offset.y;

        // Movimiento
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        // Aplicar Gravedad
        if (this.pos.y + this.alto + this.vel.y >= canvas.height - ALTO_SUELO) {
            this.vel.y = 0;
            this.pos.y = canvas.height - ALTO_SUELO - this.alto;
            this.enElSuelo = true;
        } else {
            this.vel.y += GRAVEDAD;
            this.enElSuelo = false;
        }

        // Limites de pantalla
        if (this.pos.x < 0) this.pos.x = 0;
        if (this.pos.x + this.ancho > canvas.width) this.pos.x = canvas.width - this.ancho;
    }

    atacar() {
        if (this.estaAtacando || this.esEspecial) return;
        this.estaAtacando = true;
        setTimeout(() => {
            this.estaAtacando = false;
        }, 150);
    }

    lanzarEspecial() {
        if (this.especial < 100 || this.estaAtacando || this.esEspecial) return;
        this.especial = 0;
        this.esEspecial = true;
        setTimeout(() => {
            this.esEspecial = false;
        }, 300);
    }
}

// Inicialización de Jugadores
const jugador1 = new Peleador({
    pos: { x: 150, y: 0 },
    vel: { x: 0, y: 0 },
    color: '#0072ff',
    offsetAtaque: { x: 50, y: 20 },
    mirandoDerecha: true
});

const jugador2 = new Peleador({
    pos: { x: 800, y: 0 },
    vel: { x: 0, y: 0 },
    color: '#ff4e50',
    offsetAtaque: { x: 50, y: 20 },
    mirandoDerecha: false
});

// Control del Teclado
const teclas = {
    a: false, d: false,
    ArrowLeft: false, ArrowRight: false
};

window.addEventListener('keydown', (e) => {
    switch (e.key) {
        // JUGADOR 1
        case 'a': case 'A': teclas.a = true; break;
        case 'd': case 'D': teclas.d = true; break;
        case 'w': case 'W': if (jugador1.enElSuelo) jugador1.vel.y = -16; break;
        case 'f': case 'F': jugador1.atacar(); break;
        case 'g': case 'G': jugador1.lanzarEspecial(); break;

        // JUGADOR 2
        case 'ArrowLeft': teclas.ArrowLeft = true; break;
        case 'ArrowRight': teclas.ArrowRight = true; break;
        case 'ArrowUp': if (jugador2.enElSuelo) jugador2.vel.y = -16; break;
        case 'l': case 'L': case '1': jugador2.atacar(); break;
        case 'k': case 'K': case '2': jugador2.lanzarEspecial(); break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'a': case 'A': teclas.a = false; break;
        case 'd': case 'D': teclas.d = false; break;
        case 'ArrowLeft': teclas.ArrowLeft = false; break;
        case 'ArrowRight': teclas.ArrowRight = false; break;
    }
});

// Colisión
function colisionHitbox(atacan, reciben) {
    const hitboxAncho = atacan.esEspecial ? atacan.cajaAtaque.ancho * 1.5 : atacan.cajaAtaque.ancho;
    return (
        atacan.cajaAtaque.pos.x < reciben.pos.x + reciben.ancho &&
        atacan.cajaAtaque.pos.x + hitboxAncho > reciben.pos.x &&
        atacan.cajaAtaque.pos.y < reciben.pos.y + reciben.alto &&
        atacan.cajaAtaque.pos.y + atacan.cajaAtaque.alto > reciben.pos.y
    );
}

// Cronómetro del juego
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

// Bucle principal de animación
function animar() {
    requestAnimationFrame(animar);

    // Fondo / Escenario
    ctx.fillStyle = '#1b1b2f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Suelo
    ctx.fillStyle = '#162447';
    ctx.fillRect(0, canvas.height - ALTO_SUELO, canvas.width, ALTO_SUELO);
    ctx.fillStyle = '#e43f5a';
    ctx.fillRect(0, canvas.height - ALTO_SUELO, canvas.width, 6);

    // Movimiento P1
    jugador1.vel.x = 0;
    if (teclas.a) jugador1.vel.x = -6;
    if (teclas.d) jugador1.vel.x = 6;

    // Movimiento P2
    jugador2.vel.x = 0;
    if (teclas.ArrowLeft) jugador2.vel.x = -6;
    if (teclas.ArrowRight) jugador2.vel.x = 6;

    // Orientar direcciones según posición
    jugador1.mirandoDerecha = jugador1.pos.x < jugador2.pos.x;
    jugador2.mirandoDerecha = jugador2.pos.x < jugador1.pos.x;

    // Actualizar personajes
    jugador1.actualizar();
    jugador2.actualizar();

    // Detección de golpes P1 -> P2
    if ((jugador1.estaAtacando || jugador1.esEspecial) && colisionHitbox(jugador1, jugador2)) {
        const danio = jugador1.esEspecial ? 25 : 8;
        jugador2.vida = Math.max(0, jugador2.vida - danio);
        document.getElementById('p2-health').style.width = jugador2.vida + '%';

        // Cargar barra especial del atacante
        jugador1.especial = Math.min(100, jugador1.especial + 15);
        document.getElementById('p1-special').style.width = jugador1.especial + '%';

        jugador1.estaAtacando = false;
        jugador1.esEspecial = false;
    }

    // Detección de golpes P2 -> P1
    if ((jugador2.estaAtacando || jugador2.esEspecial) && colisionHitbox(jugador2, jugador1)) {
        const danio = jugador2.esEspecial ? 25 : 8;
        jugador1.vida = Math.max(0, jugador1.vida - danio);
        document.getElementById('p1-health').style.width = jugador1.vida + '%';

        // Cargar barra especial del atacante
        jugador2.especial = Math.min(100, jugador2.especial + 15);
        document.getElementById('p2-special').style.width = jugador2.especial + '%';

        jugador2.estaAtacando = false;
        jugador2.esEspecial = false;
    }

    // Comprobar Fin de Juego
    if (jugador1.vida <= 0 || jugador2.vida <= 0) {
        determinarGanador();
    }
}

// Iniciar Juego
iniciarCronometro();
animar();