/* Texas Hold'em - hasta 8 jugadores, 12 bots, dificultad + experiencia y apuestas acumulativas */
const PALOS = [
    { simbolo: '♠', color: 'black' }, { simbolo: '♣', color: 'black' },
    { simbolo: '♥', color: 'red' }, { simbolo: '♦', color: 'red' }
];
const NOMBRES = {11:'J',12:'Q',13:'K',14:'A'};
const BOT_DEFS = [
    ['Carlos','Fácil',0.28], ['Elena','Fácil',0.34], ['Mateo','Normal',0.43],
    ['Lucía','Normal',0.49], ['Diego','Normal',0.55], ['Sofía','Difícil',0.61],
    ['Andrés','Difícil',0.67], ['Valentina','Difícil',0.72], ['Bruno','Experto',0.77],
    ['Camila','Experto',0.82], ['Nicolás','Experto',0.87], ['Renata','Maestra',0.92]
];
const STATS_KEY = 'texas_bot_stats';

let jugadores = [];
let baraja = [];
let comunitarias = [];
let bote = 0;
let fase = 'espera';
let apuestaBase = 20;
let apuestaActual = 20;
let manoActiva = false;
let procesandoBots = false;

function cargarStats() {
    try { return JSON.parse(localStorage.getItem(STATS_KEY) || '{}'); } catch (_) { return {}; }
}
function guardarStats(stats) { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); }
function experienciaBot(nombre) { return Number(cargarStats()[nombre] || 0); }

function crearBaraja() {
    const deck = [];
    for (const p of PALOS) for (let v=2; v<=14; v++)
        deck.push({valor:v, nombre:NOMBRES[v] || String(v), palo:p.simbolo, color:p.color});
    for (let i=deck.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [deck[i],deck[j]]=[deck[j],deck[i]];
    }
    return deck;
}
function renderizarCarta(carta, oculta=false) {
    const el=document.createElement('div');
    el.className=`card ${oculta?'back':carta.color}`;
    if (!oculta) el.innerHTML=`<div class="card-corner"><span class="card-value">${carta.nombre}</span><span class="card-suit-small">${carta.palo}</span></div><div class="card-center-suit">${carta.palo}</div><div class="card-corner rotate-180"><span class="card-value">${carta.nombre}</span><span class="card-suit-small">${carta.palo}</span></div>`;
    return el;
}
function nuevoJugador(nombre, bot, dificultad='Jugador', skill=1) {
    return {
        nombre, bot, dificultad, skill, games: bot ? experienciaBot(nombre) : 0,
        chips: bot ? 1000 : Number(localStorage.getItem('casino_balance') || 1000),
        totalContribution: 0,
        cards: [], contribution: 0, folded:false, allIn:false, status:'Esperando',
        lastAction:''
    };
}
function seleccionarBots() {
    const total = Number(document.getElementById('player-count').value);
    const modo = document.querySelector('input[name="opponents"]:checked')?.value || 'random';
    const checks=[...document.querySelectorAll('.bot-check:checked')].map(x=>x.value);
    let defs;
    if (modo==='selected') {
        defs=BOT_DEFS.filter(d=>checks.includes(d[0])).slice(0,total-1);
        if (defs.length < total-1) {
            mostrarSetupError(`Selecciona exactamente ${total-1} oponentes.`);
            return null;
        }
    } else {
        defs=[...BOT_DEFS].sort(()=>Math.random()-0.5).slice(0,total-1);
    }
    const bet=Math.floor(Number(document.getElementById('base-bet').value));
    if (!Number.isFinite(bet) || bet<1 || bet>500) {
        mostrarSetupError('La apuesta base debe estar entre $1 y $500.');
        return null;
    }
    apuestaBase=bet;
    return defs;
}
function iniciarNuevaMano() {
    if (manoActiva) return;
    abrirConfiguracion();
}
function confirmarConfiguracion() {
    const defs=seleccionarBots();
    if (!defs) return;
    cerrarConfiguracion();
    iniciarManoConBots(defs);
}
function iniciarManoConBots(defs) {
    const balance=Number(localStorage.getItem('casino_balance') || 1000);
    jugadores=[nuevoJugador('Tú',false,'Jugador',1)];
    defs.forEach(d=>jugadores.push(nuevoJugador(d[0],true,d[1],d[2])));
    jugadores[0].chips=balance;

    if (jugadores[0].chips < apuestaBase) {
        actualizarMensaje(`Saldo insuficiente. Necesitas al menos $${apuestaBase} para iniciar.`, 'error');
        return;
    }
    baraja=crearBaraja();
    comunitarias=[]; bote=0; fase='preflop'; manoActiva=true; apuestaActual=apuestaBase;
    document.getElementById('round-winner')?.classList.add('hidden');
    jugadores.forEach(p=>{p.cards=[baraja.pop(),baraja.pop()];p.contribution=0;p.totalContribution=0;p.folded=false;p.allIn=false;p.status='Activo';p.lastAction='';});
    renderizarMesa();
    document.getElementById('btn-start').disabled=true;
    document.getElementById('btn-start').textContent='Mano en curso';
    actualizarMarcadores();
    actualizarMensaje(`Pre-Flop. Apuesta mínima: $${apuestaActual}.`, 'normal');

    setTimeout(() => rondaBotsYJugador(), 500);
}
function apostar(p, amount) {
    const disponible=Math.max(0,p.chips);
    const pago=Math.min(amount,disponible);
    if (pago<=0) { p.allIn=true; return 0; }
    p.chips-=pago; p.contribution+=pago; p.totalContribution+=pago; bote+=pago;
    if (p.chips===0) p.allIn=true;
    return pago;
}
function maxContrib() { return jugadores.filter(p=>!p.folded).reduce((m,p)=>Math.max(m,p.contribution),0); }
function activos() { return jugadores.filter(p=>!p.folded); }

function fuerzaMano(p) {
    const vals=p.cards.map(c=>c.valor).sort((a,b)=>b-a);
    if (!vals.length) return 0;
    if (fase==='preflop') {
        let pair=vals[0]===vals[1];
        let high=vals[0];
        return Math.min(0.95,(pair?0.55:0.18)+(high/14)*0.28+(Math.abs(vals[0]-vals[1])<=2?0.08:0));
    }
    const ev=evaluarMejorMano([...p.cards,...comunitarias]);
    return Math.min(0.98,(ev.score[0]/9)*0.72 + (ev.score[1]||0)/14*0.2 + 0.08);
}
function turnoBot(p) {
    if (p.folded || p.allIn) return false;
    const stats=p.games;
    const skill=Math.min(0.98,p.skill + Math.log1p(stats)/80);
    const fuerza=fuerzaMano(p);
    const actual=maxContrib();
    const porPagar=Math.max(0,actual-p.contribution);
    const ruido=(Math.random()-0.5)*0.18;
    const decision=fuerza + ruido + (skill-0.5)*0.22;

    if (porPagar>0) {
        if (decision < 0.25) {
            p.folded=true; p.status='Retirado'; p.lastAction='Fold';
            return false;
        }
        if (decision > 0.67 && p.chips > porPagar + 1) {
            const incremento = Math.max(1, Math.round(apuestaBase * (0.5 + skill)));
            const objetivo = Math.max(actual + 1, actual + incremento);
            const objetivoFinal = Math.min(p.contribution + p.chips, objetivo);
            apostar(p,Math.max(0,objetivoFinal-p.contribution));
            p.lastAction=`Sube a $${p.contribution}`;
            p.status='Sube';
            apuestaActual=Math.max(apuestaActual,p.contribution);
            return true;
        }
        apostar(p,porPagar);
        p.lastAction='Call';
        p.status='Iguala';
        return false;
    }

    if (decision > 0.72 && p.chips >= apuestaActual) {
        apostar(p,apuestaActual);
        p.lastAction=`Apuesta $${p.contribution}`;
        p.status='Apuesta';
        apuestaActual=Math.max(apuestaActual,p.contribution);
        return true;
    }
    p.lastAction='Check';
    p.status='Check';
    return false;
}
function rondaBotsYJugador() {
    if (!manoActiva || procesandoBots) return;
    procesandoBots=true;
    const bots=jugadores.filter(p=>p.bot&&!p.folded&&!p.allIn);
    let i=0;
    const siguiente=()=>{
        if (!manoActiva) { procesandoBots=false; return; }
        if (i>=bots.length) {
            procesandoBots=false;
            if (activos().length<=1) return terminarMano('retirada');
            if (jugadores[0].folded || jugadores[0].allIn) {
                avanzarFase();
            } else {
                actualizarControles();
                const porPagar = Math.max(0, maxContrib() - jugadores[0].contribution);
                const minSube = Math.max(apuestaActual, maxContrib() + 1);
                actualizarMensaje(`Tu turno. Debes igualar $${porPagar} o subir (Mínimo $${minSube}).`, 'normal');
            }
            actualizarMarcadores();
            renderizarMesa();
            return;
        }
        const b=bots[i++];
        setTimeout(()=>{ turnoBot(b); renderizarMesa(); actualizarMarcadores(); siguiente(); }, 350);
    };
    siguiente();
}

function accionJugador(accion) {
    if (!manoActiva || procesandoBots) return;
    const p=jugadores[0];
    if (p.folded || p.allIn) return;
    const actual=maxContrib();
    const porPagar=Math.max(0,actual-p.contribution);

    if (accion==='fold') {
        p.folded=true; p.status='Retirado'; p.lastAction='Fold';
        renderizarMesa();
        if (activos().length<=1) return terminarMano('retirada');
        avanzarFase();
        return;
    }
    if (accion==='call') {
        if (porPagar===0) { p.status='Check'; p.lastAction='Check'; }
        else { apostar(p,porPagar); p.status='Iguala'; p.lastAction='Call'; }
        renderizarMesa(); actualizarMarcadores();
        if (p.allIn) return rondaBotsYJugador();
        avanzarFase();
        return;
    }
    if (accion==='raise') {
        const input=document.getElementById('raise-amount');
        const objetivo=Math.floor(Number(input?.value));
        const minimo=Math.max(actual + 1, apuestaActual);

        if (!Number.isFinite(objetivo) || objetivo < minimo) {
            actualizarMensaje(`La subida debe ser de al menos $${minimo}.`, 'error'); return;
        }
        if (p.chips + p.contribution < objetivo) {
            actualizarMensaje(`No puedes subir a $${objetivo}. Tu máximo es $${p.chips+p.contribution}.`, 'error'); return;
        }
        apostar(p,objetivo-p.contribution);
        apuestaActual=Math.max(apuestaActual,p.contribution);
        p.status='Sube'; p.lastAction=`Raise a $${p.contribution}`;
        renderizarMesa(); actualizarMarcadores();
        rondaBotsYJugador();
        return;
    }
    if (accion==='allin') {
        if (p.chips<=0) return;
        apostar(p,p.chips);
        apuestaActual=Math.max(apuestaActual,p.contribution);
        p.status='All-In'; p.lastAction='All-In 🔥';
        renderizarMesa(); actualizarMarcadores();
        rondaBotsYJugador();
    }
}
function avanzarFase() {
    if (!manoActiva) return;
    const niveles= ['preflop','flop','turn','river','showdown'];
    const idx=niveles.indexOf(fase);
    const anteriorMax=Math.max(apuestaActual,maxContrib(),apuestaBase);
    if (fase==='preflop') comunitarias=[baraja.pop(),baraja.pop(),baraja.pop()];
    else if (fase==='flop') comunitarias.push(baraja.pop());
    else if (fase==='turn') comunitarias.push(baraja.pop());
    else if (fase==='river') { fase='showdown'; return terminarMano('showdown'); }
    else return terminarMano('showdown');

    fase=niveles[idx+1];
    apuestaActual=anteriorMax;
    jugadores.forEach(p=>{ if(!p.folded){p.contribution=0;p.status=p.allIn?'All-In':'Activo';p.lastAction='';} });
    renderizarMesa(); actualizarMarcadores();
    actualizarMensaje(`${nombreFase()}. Apuesta mínima heredada: $${apuestaActual}.`, 'normal');

    if (activos().filter(p=>!p.allIn).length<=1) {
        while(comunitarias.length<5) comunitarias.push(baraja.pop());
        return terminarMano('showdown');
    }
    setTimeout(rondaBotsYJugador,500);
}
function nombreFase() {
    return {preflop:'Pre-Flop',flop:'Flop',turn:'Turn',river:'River',showdown:'Showdown'}[fase] || fase;
}

function terminarMano(motivo) {
    if (!manoActiva) return;
    manoActiva=false;
    while(comunitarias.length<5) comunitarias.push(baraja.pop());
    fase='showdown';

    if (motivo==='retirada') {
        const ganador=activos()[0];
        if (ganador) ganador.chips+=bote;
        const winnerBox=document.getElementById('round-winner');
        if(winnerBox){winnerBox.textContent=`🏆 Ganador de la ronda: ${ganador?.nombre || 'Nadie'} · Bote $${bote}`;winnerBox.classList.remove('hidden');}
        actualizarMensaje(`${ganador?.nombre || 'Nadie'} gana el bote de $${bote} por retirada.`, 'win');
    } else {
        const pots=crearSidePots();
        const premios={};
        pots.forEach(pot=>{
            const elegibles=jugadores.filter(p=>!p.folded && p.totalContribution>=pot.level);
            if (!elegibles.length) return;

            let ganadores=[elegibles[0]];
            let mejorEvaluacion=evaluarMejorMano([...elegibles[0].cards,...comunitarias]);

            for(let i=1; i<elegibles.length; i++){
                const p=elegibles[i];
                const ev=evaluarMejorMano([...p.cards,...comunitarias]);
                const cmp=compararManos(ev.score, mejorEvaluacion.score);
                if(cmp>0){
                    mejorEvaluacion=ev;
                    ganadores=[p];
                } else if(cmp===0) {
                    ganadores.push(p);
                }
            }
            const parte=Math.floor(pot.amount/ganadores.length);
            ganadores.forEach(g=>{g.chips+=parte;premios[g.nombre]=(premios[g.nombre]||0)+parte;});
            let resto=pot.amount-parte*ganadores.length;
            if(resto>0 && ganadores[0]) ganadores[0].chips+=resto;
        });
        const texto=Object.entries(premios).map(([n,v])=>`${n}: $${v}`).join(' · ');
        const winnerBox=document.getElementById('round-winner');
        if(winnerBox){winnerBox.textContent=`🏆 Ganador(es) de la ronda: ${texto || 'Sin premio'}`;winnerBox.classList.remove('hidden');}
        actualizarMensaje(`🏆 Showdown: ${texto || 'Sin premio'}. Cartas reveladas.`, 'win');
    }

    const stats=cargarStats();
    jugadores.filter(p=>p.bot).forEach(p=>{ stats[p.nombre]=(Number(stats[p.nombre]||0)+1); p.games=stats[p.nombre]; });
    guardarStats(stats);

    localStorage.setItem('casino_balance', String(Math.max(0,jugadores[0].chips)));
    jugadores[0].chips=Math.max(0,jugadores[0].chips);
    document.getElementById('btn-start').disabled=false;
    document.getElementById('btn-start').textContent='Nueva mano / Configurar';
    actualizarControles();
    renderizarMesa();
    actualizarMarcadores();
}
function crearSidePots() {
    const niveles=[...new Set(jugadores.filter(p=>p.totalContribution>0).map(p=>p.totalContribution))].sort((a,b)=>a-b);
    const pots=[]; let prev=0;
    for(const level of niveles){
        const participantes=jugadores.filter(p=>p.totalContribution>=level);
        const amount=(level-prev)*participantes.length;
        if(amount>0) pots.push({level,amount});
        prev=level;
    }
    return pots;
}
function obtenerCombinacionesDe5(cartas) {
    if(cartas.length<5) return [];
    const out=[]; const n=cartas.length;
    for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)for(let c=b+1;c<n;c++)for(let d=c+1;d<n;d++)for(let e=d+1;e<n;e++)out.push([cartas[a],cartas[b],cartas[c],cartas[d],cartas[e]]);
    return out;
}
function evaluar5Cartas(cinco) {
    const valores=cinco.map(c=>c.valor).sort((a,b)=>b-a), palos=cinco.map(c=>c.palo);
    const color=palos.every(p=>p===palos[0]);
    let escalera=false, alta=valores[0];
    if(valores[0]-valores[4]===4 && new Set(valores).size===5) escalera=true;
    else if(JSON.stringify(valores)==='[14,5,4,3,2]'){escalera=true;alta=5;}
    const frec={}; valores.forEach(v=>frec[v]=(frec[v]||0)+1);
    const grupos=Object.entries(frec).map(([v,c])=>({val:+v,count:c})).sort((a,b)=>b.count-a.count||b.val-a.val);
    if(color&&escalera&&alta===14&&valores[4]===10)return{score:[9,14],name:'Escalera Real'};
    if(color&&escalera)return{score:[8,alta],name:`Escalera de Color al ${NOMBRES[alta]||alta}`};
    if(grupos[0].count===4)return{score:[7,grupos[0].val,grupos[1].val],name:`Póker de ${NOMBRES[grupos[0].val]||grupos[0].val}`};
    if(grupos[0].count===3&&grupos[1].count===2)return{score:[6,grupos[0].val,grupos[1].val],name:'Full House'};
    if(color)return{score:[5,...valores],name:'Color'};
    if(escalera)return{score:[4,alta],name:`Escalera al ${NOMBRES[alta]||alta}`};
    if(grupos[0].count===3)return{score:[3,grupos[0].val,...grupos.slice(1).map(x=>x.val)],name:'Trío'};
    if(grupos[0].count===2&&grupos[1].count===2)return{score:[2,grupos[0].val,grupos[1].val,grupos[2].val],name:'Doble Pareja'};
    if(grupos[0].count===2)return{score:[1,grupos[0].val,...grupos.slice(1).map(x=>x.val)],name:`Pareja de ${NOMBRES[grupos[0].val]||grupos[0].val}`};
    return{score:[0,...valores],name:`Carta Alta (${NOMBRES[valores[0]]||valores[0]})`};
}
function compararManos(a,b){
    const len=Math.max(a.length,b.length);
    for(let i=0;i<len;i++){
        const x=a[i]!==undefined?a[i]:0;
        const y=b[i]!==undefined?b[i]:0;
        if(x!==y)return x-y;
    }
    return 0;
}
function evaluarMejorMano(cartas) {
    if(cartas.length<5)return{score:[0,0],name:'Incompleta'};
    return obtenerCombinacionesDe5(cartas).map(c=>({...evaluar5Cartas(c),cards:c})).sort((a,b)=>compararManos(b.score,a.score))[0];
}
function renderizarMesa() {
    const cc=document.getElementById('community-cards'); cc.innerHTML='';
    comunitarias.forEach(c=>cc.appendChild(renderizarCarta(c,false)));
    while(cc.children.length<5){const ph=document.createElement('div');ph.className='card-placeholder';cc.appendChild(ph);}

    const area=document.getElementById('players-area'); area.innerHTML='';
    const total = jugadores.length;
    const rx = 40;
    const ry = 38;

    jugadores.forEach((p,i)=>{
        const box=document.createElement('div');
        box.className=`player-box ${i===0?'human-player':''} ${p.folded?'folded-player':''}`;

        const angle = (Math.PI / 2) + (i * (2 * Math.PI / total));
        const left = 50 + rx * Math.cos(angle);
        const top = 50 + ry * Math.sin(angle);

        box.style.left = `${left}%`;
        box.style.top = `${top}%`;
        box.style.transform = 'translate(-50%, -50%)';

        const head=document.createElement('div'); head.className='player-head';
        const exp=p.bot?` · ${p.games}p`:'';
        head.innerHTML=`<span class="player-name">${p.bot?'🤖 ': '🧑 '}${p.nombre}</span><span class="player-meta">${p.dificultad}${exp}</span>`;
        const chips=document.createElement('div');chips.className='player-chips';chips.textContent=`$${p.chips}`;
        const cards=document.createElement('div');cards.className='cards-holder';
        p.cards.forEach(c=>{
            const oculta = p.bot && manoActiva && !p.folded;
            cards.appendChild(renderizarCarta(c, oculta));
        });
        const status=document.createElement('div');status.className='status-pill';status.textContent=p.folded?'Retirado':(p.allIn?'All-In':p.lastAction||p.status);
        const contrib=document.createElement('small');contrib.className='contribution';contrib.textContent=`Ap: $${p.contribution}`;
        box.append(head,chips,cards,status,contrib); area.appendChild(box);
    });

    const hand=jugadores[0];
    const desc=document.getElementById('player-hand-desc');
    if(desc) desc.textContent=hand && comunitarias.length>=3 ? evaluarMejorMano([...hand.cards,...comunitarias]).name : 'Esperando reparto';
}
function actualizarMarcadores() {
    document.getElementById('pot-amount').textContent=`$${bote}`;
    document.getElementById('game-stage').textContent=nombreFase();
    document.getElementById('min-bet').textContent=`$${apuestaActual}`;
    const human=jugadores[0];
    if(human){document.getElementById('fichas-count').textContent=Math.max(0,Math.floor(human.chips));localStorage.setItem('casino_balance',String(Math.max(0,Math.floor(human.chips))));}
}
function actualizarControles() {
    const active = manoActiva && !procesandoBots && jugadores[0] && !jugadores[0].folded && !jugadores[0].allIn;
    ['btn-fold','btn-check-call','btn-raise','btn-allin'].forEach(id => document.getElementById(id).disabled = !active);

    const maxApostado = maxContrib();
    const porPagar = Math.max(0, maxApostado - (jugadores[0]?.contribution || 0));

    document.getElementById('btn-check-call').textContent = porPagar > 0 ? `Igualar $${porPagar}` : 'Pasar (Check)';
    document.getElementById('btn-raise').textContent = `Subir`;

    const raiseInput = document.getElementById('raise-amount');
    if (raiseInput) {
        raiseInput.disabled = !active;

        const minApostar = Math.max(apuestaActual, maxApostado + 1);
        raiseInput.min = String(minApostar);

        if (Number(raiseInput.value) < minApostar) {
            raiseInput.value = String(minApostar);
        }

        const maxPosible = jugadores[0] ? jugadores[0].chips + jugadores[0].contribution : 1000;
        raiseInput.max = String(Math.max(minApostar, maxPosible));
    }
}
function actualizarMensaje(msg,tipo='normal'){
    const el=document.getElementById('dealer-msg');
    el.className=`dealer-msg ${tipo}`;el.textContent=msg;
}
function abrirConfiguracion(){
    document.getElementById('setup-modal').classList.remove('hidden');
    actualizarListaBots();
}
function cerrarConfiguracion(){document.getElementById('setup-modal').classList.add('hidden');}
function mostrarSetupError(msg){const e=document.getElementById('setup-error');e.textContent=msg;e.classList.remove('hidden');}
function actualizarListaBots(){
    const total=Number(document.getElementById('player-count').value);
    document.getElementById('opponent-count').textContent=`Debes elegir ${total-1} oponentes.`;
    document.querySelectorAll('.bot-check').forEach(c=>c.closest('label').classList.toggle('opacity-40',false));
}
function terminarConfiguracion(){
    const modo=document.querySelector('input[name="opponents"]:checked')?.value;
    document.getElementById('selected-bots').classList.toggle('hidden',modo!=='selected');
}
function configurarChecks(){
    const total=Number(document.getElementById('player-count').value);
    const checked=[...document.querySelectorAll('.bot-check:checked')];
    if(checked.length>total-1) checked[checked.length-1].checked=false;
    actualizarListaBots();
}
document.addEventListener('DOMContentLoaded',()=>{
    document.getElementById('fichas-count').textContent=localStorage.getItem('casino_balance')||'1000';
    const container=document.getElementById('bot-options');
    container.innerHTML=BOT_DEFS.map(d=>`<label class="bot-option"><input class="bot-check" type="checkbox" value="${d[0]}"><span><strong>${d[0]}</strong><small>${d[1]} · ${experienciaBot(d[0])} partidas</small></span></label>`).join('');
    document.getElementById('player-count').addEventListener('change',()=>{mostrarSetupError('');actualizarListaBots();});
    document.querySelectorAll('input[name="opponents"]').forEach(r=>r.addEventListener('change',terminarConfiguracion));
    document.getElementById('bot-options').addEventListener('change',configurarChecks);
    document.getElementById('btn-confirm-setup').addEventListener('click',confirmarConfiguracion);
    document.getElementById('btn-cancel-setup').addEventListener('click',cerrarConfiguracion);
    terminarConfiguracion();
    abrirConfiguracion();
    actualizarControles();
    window.addEventListener('casino-balance-changed',e=>{
        if(!manoActiva){
            document.getElementById('fichas-count').textContent=e.detail.balance;
            return;
        }
        if(jugadores[0] && !procesandoBots){
            jugadores[0].chips=Number(e.detail.balance);
            actualizarMarcadores();
            renderizarMesa();
        }
    });
});