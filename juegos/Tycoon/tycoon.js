const SAVE_KEY = 'tycoonEstudio_v1';

const GENEROS = ['Acción','RPG','Estrategia','Simulación','Terror','Aventura','Deportes','Carreras','Roguelike','Puzzle','Plataforma'];
const PLATAFORMAS_INICIALES = ['PC'];
const PLATAFORMAS_FUTURAS = [
    {id:'ConsolaA', nombre:'Consola Vantix', repReq:20},
    {id:'ConsolaB', nombre:'Consola Nexora', repReq:35},
    {id:'Portatil', nombre:'Portátil GoPlay', repReq:15},
    {id:'Movil', nombre:'Móvil', repReq:10}
];
const TAMANOS = {
    'Pequeño': {coste:2000, meses:2, puntosObjetivo:180, copiasBase:2200},
    'Mediano': {coste:8000, meses:4, puntosObjetivo:420, copiasBase:4200},
    'Grande':  {coste:25000, meses:7, puntosObjetivo:900, copiasBase:7800},
    'AAA':     {coste:80000, meses:12, puntosObjetivo:1800, copiasBase:15000}
};

const ESPECIALIDADES = {
    'Programador': {tecnologia:1.0, gameplay:0.6},
    'Diseñador':   {gameplay:1.0, pulido:0.5},
    'Artista':     {graficos:1.0},
    'Escritor':    {historia:1.0},
    'Compositor':  {audio:1.0},
    'Productor':   {gameplay:0.25, graficos:0.25, historia:0.25, audio:0.25, tecnologia:0.25, pulido:0.5}
};
const NOMBRES = ['Carlos','Lucía','Marco','Elena','Javier','Sofía','Diego','Valentina','Andrés','Paula','Tomás','Camila','Iván','Nadia','Bruno','Alicia','Rubén','Marta','Hugo','Nora'];

const CAMPANAS = {
    'Sin marketing': {coste:0, mult:1.0},
    'Marketing básico': {coste:5000, mult:1.25},
    'Marketing avanzado': {coste:25000, mult:1.6},
    'Campaña mundial': {coste:100000, mult:2.2}
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function rnd(min,max){return Math.random()*(max-min)+min;}
function rndInt(min,max){return Math.floor(rnd(min,max+1));}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function fmtMoney(n){return '$'+Math.round(n).toLocaleString('es-ES');}
function uid(){return Math.random().toString(36).slice(2,9);}

/* ================= GAME STATE ================= */
const GameState = {
    data:null,
    init(studioName){
        this.data = {
            studio: studioName || 'Mi Estudio',
            money: 10000,
            reputation: 0,
            year: 1995,
            month: 0, // 0=Enero
            officeLevel: 1,
            employees: [],
            candidates: [],
            unlockedPlatforms: ['PC'],
            market: {},
            currentProject: null, // en desarrollo
            activeReleases: [], // juegos vendiendo
            library: [], // historial de juegos terminados
            logs: [],
            totalRevenue: 0,
            totalExpenses: 0,
            lastMonthRevenue: 0,
            lastMonthExpenses: 0,
            gameOver:false
        };
        MarketSystem.initMarket(this.data);
        EmployeeSystem.hireStarter(this.data);
        this.log('Fundaste tu estudio en Enero de 1995. ¡Buena suerte!');
    },
    log(msg){
        this.data.logs.unshift({y:this.data.year, m:this.data.month, msg});
        if(this.data.logs.length>200) this.data.logs.pop();
        const line = document.getElementById('logLine');
        if(line) line.textContent = msg;
    },
    officeInfo(){
        const levels = [
            {nombre:'Pequeño estudio', maxEmp:4, coste:0, prod:1.0, sig:15000},
            {nombre:'Oficina mediana', maxEmp:9, coste:15000, prod:1.15, sig:60000},
            {nombre:'Gran estudio', maxEmp:18, coste:60000, prod:1.3, sig:220000},
            {nombre:'Campus empresarial', maxEmp:35, coste:220000, prod:1.5, sig:null}
        ];
        return levels[this.data.officeLevel-1];
    },
    tagline(){
        const r=this.data.reputation;
        if(r<15) return 'Pequeño estudio independiente';
        if(r<40) return 'Estudio reconocido';
        if(r<70) return 'Empresa importante';
        return 'Corporación mundial';
    }
};

/* ================= EMPLOYEE SYSTEM ================= */
const EmployeeSystem = {
    genCandidate(){
        const specs = Object.keys(ESPECIALIDADES);
        const spec = specs[rndInt(0,specs.length-1)];
        const base = rndInt(20,55);
        return {
            id: uid(), nombre: NOMBRES[rndInt(0,NOMBRES.length-1)], especialidad: spec, nivel:1, xp:0,
            programacion: spec==='Programador'?base+rndInt(15,35):rndInt(5,30),
            diseno: spec==='Diseñador'?base+rndInt(15,35):rndInt(5,30),
            arte: spec==='Artista'?base+rndInt(15,35):rndInt(5,30),
            historia: spec==='Escritor'?base+rndInt(15,35):rndInt(5,30),
            audio: spec==='Compositor'?base+rndInt(15,35):rndInt(5,30),
            salario: rndInt(1200,2600),
            motivacion: rndInt(70,100),
            velocidad: +(rnd(0.8,1.3)).toFixed(2)
        };
    },
    hireStarter(data){
        const e = this.genCandidate();
        e.especialidad='Programador'; e.salario=1400;
        data.employees.push(e);
    },
    refreshCandidates(data){
        data.candidates = [1,2,3].map(()=>this.genCandidate());
    },
    hire(data, candId){
        const info = GameState.officeInfo();
        if(data.employees.length>=info.maxEmp){ GameState.log('⚠ Oficina llena. Mejora tu oficina para contratar más.'); return false;}
        const idx = data.candidates.findIndex(c=>c.id===candId);
        if(idx<0) return false;
        const c = data.candidates.splice(idx,1)[0];
        data.employees.push(c);
        GameState.log('Contrataste a '+c.nombre+' ('+c.especialidad+').');
        return true;
    },
    fire(data, empId){
        data.employees = data.employees.filter(e=>e.id!==empId);
        data.reputation = clamp(data.reputation-2,0,100);
        GameState.log('Despediste a un empleado. La reputación baja levemente.');
    },
    monthlyXP(data){
        if(!data.currentProject) return;
        data.employees.forEach(e=>{
            e.xp += rndInt(3,8);
            if(e.xp>=100){
                e.xp=0; e.nivel++;
                ['programacion','diseno','arte','historia','audio'].forEach(k=>{ e[k]=clamp(e[k]+rndInt(1,4),0,100); });
                GameState.log('📈 '+e.nombre+' subió a nivel '+e.nivel+'.');
            }
            e.motivacion = clamp(e.motivacion + rndInt(-2,2), 40, 100);
        });
    }
};

/* ================= MARKET SYSTEM ================= */
const MarketSystem = {
    initMarket(data){
        GENEROS.forEach(g=>{ data.market[g] = rndInt(-10,20); });
    },
    shift(data){
        const g = GENEROS[rndInt(0,GENEROS.length-1)];
        const delta = rndInt(-15,20);
        data.market[g] = clamp(data.market[g]+delta,-40,60);
        const msgs = [
            `Los juegos de ${g} están de moda.`,
            `El mercado de ${g} muestra nuevas tendencias.`,
            `El interés por ${g} ha cambiado este mes.`
        ];
        if(Math.random()<0.5) GameState.log('📊 '+msgs[rndInt(0,msgs.length-1)]);
    }
};

/* ================= DEV SYSTEM ================= */
const DevSystem = {
    categorias:['gameplay','graficos','historia','audio','tecnologia','pulido'],
    startProject(data, cfg){
        const t = TAMANOS[cfg.tamano];
        if(data.money < t.coste){ GameState.log('⚠ No tienes dinero suficiente para este proyecto.'); return false; }
        data.money -= t.coste;
        data.totalExpenses += t.coste;
        const puntos = {}; this.categorias.forEach(c=>puntos[c]=0);
        data.currentProject = {
            id: uid(), nombre: cfg.nombre, genero: cfg.genero, plataforma: cfg.plataforma, tamano: cfg.tamano,
            puntos, objetivo: t.puntosObjetivo, mesesInvertidos:0, mesesPrevistos: t.meses, coste:t.coste, lanzado:false
        };
        GameState.log('🛠️ Iniciaste el desarrollo de "'+cfg.nombre+'" ('+cfg.tamano+').');
        return true;
    },
    progressMonth(data){
        const p = data.currentProject; if(!p) return;
        p.mesesInvertidos++;
        const office = GameState.officeInfo();
        data.employees.forEach(emp=>{
            const w = ESPECIALIDADES[emp.especialidad];
            const skillAvg = (emp.programacion+emp.diseno+emp.arte+emp.historia+emp.audio)/5;
            const power = (skillAvg*0.5 + emp.nivel*8) * emp.velocidad * (emp.motivacion/100) * office.prod;
            // Cada empleado aporta una base a TODAS las categorías (nadie deja una en cero),
            // y además un extra fuerte en su especialidad — así un equipo pequeño y generalista
            // siempre puede sacar un juego adelante, aunque más lento que un equipo completo.
            this.categorias.forEach(cat=>{
                const bonus = w[cat] || 0;
                p.puntos[cat] += power*(0.18 + bonus);
            });
        });
    },
    progressPct(p){
        const total = this.categorias.reduce((s,c)=>s+Math.min(p.puntos[c], p.objetivo/6),0);
        return clamp(Math.round(total/p.objetivo*100),0,100);
    },
    canLaunch(p){ return this.progressPct(p) >= 60; },
    cancel(data){
        if(!data.currentProject) return;
        GameState.log('❌ Cancelaste "'+data.currentProject.nombre+'". La reputación se resiente.');
        data.reputation = clamp(data.reputation-5,0,100);
        data.currentProject=null;
    }
};

/* ================= FINANCE / LAUNCH / SALES ================= */
const FinanceSystem = {
    monthlyUpkeep(data){
        const office = GameState.officeInfo();
        const salarios = data.employees.reduce((s,e)=>s+e.salario,0);
        const oficinaCoste = 300 + data.officeLevel*250;
        const total = salarios + oficinaCoste;
        data.money -= total;
        data.totalExpenses += total;
        data.lastMonthExpenses = total;
        return total;
    },
    launch(data, marketing){
        const p = data.currentProject;
        if(!p || !DevSystem.canLaunch(p)) return null;
        const camp = CAMPANAS[marketing];
        if(camp.coste>0 && data.money < camp.coste){ GameState.log('⚠ No puedes pagar esa campaña de marketing.'); return null; }
        data.money -= camp.coste; data.totalExpenses += camp.coste;

        const pct = DevSystem.progressPct(p);
        const trend = data.market[p.genero]||0;
        const repBonus = data.reputation/8;
        const rand = rnd(-8,8);
        let quality = pct*0.7 + trend*0.4 + repBonus + rand;
        quality = clamp(Math.round(quality),0,100);

        const t = TAMANOS[p.tamano];
        const qualityFactor = Math.pow(clamp(quality/70, 0.12, 1.6), 1.3);
        const marketFactor = 1 + trend/100;
        const repFactor = 1 + data.reputation/300;
        const baseSales = Math.max(300, t.copiasBase * qualityFactor * marketFactor * camp.mult * repFactor);
        const precio = {Pequeño:9.99, Mediano:19.99, Grande:34.99, AAA:59.99}[p.tamano];

        const release = {
            id:p.id, nombre:p.nombre, genero:p.genero, tamano:p.tamano, calidad:quality, precio,
            reviews: this.genReviews(quality, p.genero),
            mesesRestantes:4, decay:[0.45,0.27,0.16,0.12],
            ventasTotales:0, ingresosTotales:0, mesVenta:0, ventasBaseProy: baseSales
        };
        data.activeReleases.push(release);
        data.library.push({nombre:p.nombre, genero:p.genero, tamano:p.tamano, calidad:quality, anio:data.year});

        data.reputation = clamp(data.reputation + (quality-50)/6, 0, 100);
        GameState.log('🚀 Lanzaste "'+p.nombre+'" con calidad '+quality+'/100.');
        data.currentProject = null;
        return release;
    },
    genReviews(q, genero){
        const pool = {
            alta: [`Un ${genero.toLowerCase()} sorprendentemente profundo.`,'Una obra brillante, difícil de soltar.','Ritmo, diseño y ambición en su máxima expresión.'],
            media: ['Entretenido pero con algunos altibajos.','Buena base, aunque le falta algo de pulido.','Cumple sin sorprender demasiado.'],
            baja: ['Una experiencia olvidable.','Ideas interesantes mal ejecutadas.','Necesita mucho más tiempo de horno.']
        };
        const tier = q>=75?'alta':(q>=50?'media':'baja');
        const stars = q>=90?5:q>=75?4:q>=60?3:q>=40?2:1;
        const arr=[]; const n=rndInt(3,4);
        for(let i=0;i<n;i++){
            const txt = pool[tier][rndInt(0,pool[tier].length-1)];
            const s = clamp(stars + rndInt(-1,1),1,5);
            arr.push({estrellas:s, texto:txt});
        }
        return arr;
    },
    processSalesMonth(data){
        data.lastMonthRevenue = 0;
        data.activeReleases.forEach(r=>{
            if(r.mesesRestantes<=0) return;
            const idx = r.mesVenta;
            const frac = r.decay[idx] !== undefined ? r.decay[idx] : 0.05;
            const jitter = rnd(0.8,1.2);
            const copies = Math.max(0, Math.round(r.ventasBaseProy*frac*jitter));
            const ingresos = copies*r.precio;
            r.ventasTotales += copies;
            r.ingresosTotales += ingresos;
            data.money += ingresos;
            data.totalRevenue += ingresos;
            data.lastMonthRevenue += ingresos;
            r.mesVenta++; r.mesesRestantes--;
        });
        data.activeReleases = data.activeReleases.filter(r=>r.mesesRestantes>0);
    }
};

/* ================= TIME SYSTEM ================= */
const TimeSystem = {
    advance(n){
        const data = GameState.data;
        for(let i=0;i<n;i++){
            data.month++;
            if(data.month>=12){ data.month=0; data.year++; }
            DevSystem.progressMonth(data);
            EmployeeSystem.monthlyXP(data);
            FinanceSystem.processSalesMonth(data);
            const upkeep = FinanceSystem.monthlyUpkeep(data);
            if(Math.random()<0.35) MarketSystem.shift(data);
            EventSystem.maybeTrigger(data);
            if(data.money<0){
                if(!data.gameOver){
                    GameState.log('💀 ¡Estás en números rojos! Vende juegos o reduce gastos o tu estudio quebrará.');
                }
                if(data.money < -20000){ data.gameOver=true; }
            }
        }
        SaveSystem.autosave();
        UIManager.renderAll();
        if(GameState.data.gameOver) UIManager.showGameOver();
    }
};

/* ================= EVENT SYSTEM ================= */
const EventSystem = {
    maybeTrigger(data){
        if(Math.random()>0.22) return;
        const events = [
            ()=>{ if(data.employees.length>1){ const e=data.employees[rndInt(0,data.employees.length-1)]; if(e.motivacion<55 && Math.random()<0.4){ data.employees=data.employees.filter(x=>x.id!==e.id); GameState.log('😞 '+e.nombre+' renunció por baja motivación.'); } } },
            ()=>{ if(data.activeReleases.length){ const r=data.activeReleases[0]; r.ventasBaseProy*=1.4; GameState.log('🔥 ¡"'+r.nombre+'" se ha vuelto viral!'); } },
            ()=>{ if(data.activeReleases.length){ const r=data.activeReleases[rndInt(0,data.activeReleases.length-1)]; r.ventasBaseProy*=0.7; GameState.log('📉 La competencia lanzó algo similar a "'+r.nombre+'", bajan sus ventas.'); } },
            ()=>{ GameState.log('💡 Rumores de nueva tecnología recorren la industria.'); },
            ()=>{ if(data.currentProject){ data.currentProject.objetivo*=1.08; GameState.log('⚙️ Problemas técnicos retrasan levemente el desarrollo de "'+data.currentProject.nombre+'".'); } }
        ];
        events[rndInt(0,events.length-1)]();
    }
};

/* ================= SAVE SYSTEM ================= */
const SaveSystem = {
    save(){ localStorage.setItem(SAVE_KEY, JSON.stringify(GameState.data)); GameState.log('💾 Partida guardada.'); },
    autosave(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(GameState.data)); }catch(e){} },
    load(){
        const raw = localStorage.getItem(SAVE_KEY);
        if(!raw) return false;
        try{ GameState.data = JSON.parse(raw); return true; }catch(e){ return false; }
    },
    hasSave(){ return !!localStorage.getItem(SAVE_KEY); },
    reset(){ localStorage.removeItem(SAVE_KEY); }
};

/* ================= UI MANAGER ================= */
const UIManager = {
    currentTab:'dashboard',
    init(){
        document.querySelectorAll('.tabBtn').forEach(b=>{
            b.addEventListener('click',()=>{ this.currentTab=b.dataset.tab; this.setActiveTab(); this.renderTab(); });
        });
        document.getElementById('btnSave').onclick=()=>SaveSystem.save();
        document.getElementById('btnAdv1').onclick=()=>TimeSystem.advance(1);
        document.getElementById('btnAdv3').onclick=()=>TimeSystem.advance(3);
        document.getElementById('btnAdv6').onclick=()=>TimeSystem.advance(6);
        document.getElementById('btnAdv12').onclick=()=>TimeSystem.advance(12);
        document.getElementById('btnReset').onclick=()=>{
            if(confirm('¿Seguro que quieres reiniciar la partida? Se perderá todo el progreso.')){
                SaveSystem.reset(); location.reload();
            }
        };
        this.renderAll();
    },
    setActiveTab(){
        document.querySelectorAll('.tabBtn').forEach(b=>b.classList.toggle('active', b.dataset.tab===this.currentTab));
    },
    renderAll(){
        const d = GameState.data;
        document.getElementById('hStudio').textContent = d.studio;
        document.getElementById('hMoney').textContent = fmtMoney(d.money);
        document.getElementById('hMoney').style.color = d.money<0? 'var(--danger)':'var(--money)';
        document.getElementById('hRep').textContent = Math.round(d.reputation);
        document.getElementById('hDate').textContent = MESES[d.month]+' '+d.year;
        document.getElementById('hEmp').textContent = d.employees.length+'/'+GameState.officeInfo().maxEmp;
        document.getElementById('hOffice').textContent = d.officeLevel;
        document.getElementById('hTagline').textContent = GameState.tagline();
        this.renderTab();
    },
    renderTab(){
        const c = document.getElementById('tabContent');
        const d = GameState.data;
        if(this.currentTab==='dashboard') c.innerHTML = this.dashboardHTML(d);
        else if(this.currentTab==='crear') c.innerHTML = this.crearHTML(d);
        else if(this.currentTab==='empleados') c.innerHTML = this.empleadosHTML(d);
        else if(this.currentTab==='mercado') c.innerHTML = this.mercadoHTML(d);
        else if(this.currentTab==='oficina') c.innerHTML = this.oficinaHTML(d);
        else if(this.currentTab==='finanzas') c.innerHTML = this.finanzasHTML(d);
        else if(this.currentTab==='historial') c.innerHTML = this.historialHTML(d);
        this.bindTabEvents();
    },
    dashboardHTML(d){
        let proyecto = '<p style="color:var(--muted)">No hay ningún proyecto en desarrollo. Ve a "Crear Juego".</p>';
        if(d.currentProject){
            const p = d.currentProject; const pct = DevSystem.progressPct(p);
            proyecto = `<div><b>${p.nombre}</b> — ${p.genero} · ${p.tamano} (mes ${p.mesesInvertidos}/${p.mesesPrevistos})</div>
      <div class="progress"><div class="progressFill" style="width:${pct}%"></div></div>
      ${DevSystem.categorias.map(cat=>{
                const val = clamp(Math.round(p.puntos[cat]/(p.objetivo/6)*100),0,100);
                return `<div class="row"><span>${this.catLabel(cat)}</span><span>${val}%</span></div><div class="progress"><div class="progressFill" style="width:${val}%"></div></div>`;
            }).join('')}
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btnPrimary" id="btnOpenLaunch" ${DevSystem.canLaunch(p)?'':'disabled'}>🚀 Lanzar juego</button>
        <button class="btn btnDanger" id="btnCancelProject">Cancelar proyecto</button>
      </div>`;
        }
        const activos = d.activeReleases.map(r=>`<div class="row"><span>${r.nombre}</span><span>${r.ventasTotales.toLocaleString('es-ES')} copias · ${fmtMoney(r.ingresosTotales)}</span></div>`).join('') || '<p style="color:var(--muted)">Sin lanzamientos activos.</p>';
        return `<section class="tycoon-hero">
      <div class="tycoon-hero-copy">
        <div class="tycoon-kicker">ESTUDIO · ${d.year}</div>
        <h2 class="tycoon-hero-title">${this.escapeHtml(d.studio)}</h2>
        <p class="tycoon-hero-sub">Construye tu estudio, crea juegos y convierte un pequeño equipo en una leyenda del videojuego.</p>
      </div>
      <svg class="tycoon-hero-art" viewBox="0 0 560 210" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g shape-rendering="crispEdges">
          <!-- cielo / luces -->
          <rect x="0" y="170" width="560" height="40" fill="#0b1322"/>
          <rect x="24" y="112" width="76" height="58" fill="#172554"/>
          <rect x="35" y="124" width="12" height="12" fill="#22d3ee"/><rect x="54" y="124" width="12" height="12" fill="#fbbf24"/><rect x="73" y="124" width="12" height="12" fill="#22d3ee"/>
          <rect x="35" y="143" width="12" height="12" fill="#fbbf24"/><rect x="54" y="143" width="12" height="12" fill="#22d3ee"/><rect x="73" y="143" width="12" height="12" fill="#fbbf24"/>
          <rect x="116" y="80" width="92" height="90" fill="#1e3a8a"/>
          <rect x="129" y="94" width="15" height="12" fill="#fbbf24"/><rect x="153" y="94" width="15" height="12" fill="#22d3ee"/><rect x="177" y="94" width="15" height="12" fill="#fbbf24"/>
          <rect x="129" y="115" width="15" height="12" fill="#22d3ee"/><rect x="153" y="115" width="15" height="12" fill="#fbbf24"/><rect x="177" y="115" width="15" height="12" fill="#22d3ee"/>
          <rect x="129" y="136" width="15" height="12" fill="#fbbf24"/><rect x="153" y="136" width="15" height="12" fill="#22d3ee"/><rect x="177" y="136" width="15" height="12" fill="#fbbf24"/>
          <rect x="225" y="48" width="112" height="122" fill="#312e81"/>
          <rect x="240" y="62" width="18" height="15" fill="#22d3ee"/><rect x="270" y="62" width="18" height="15" fill="#fbbf24"/><rect x="300" y="62" width="18" height="15" fill="#22d3ee"/>
          <rect x="240" y="86" width="18" height="15" fill="#fbbf24"/><rect x="270" y="86" width="18" height="15" fill="#22d3ee"/><rect x="300" y="86" width="18" height="15" fill="#fbbf24"/>
          <rect x="240" y="110" width="18" height="15" fill="#22d3ee"/><rect x="270" y="110" width="18" height="15" fill="#fbbf24"/><rect x="300" y="110" width="18" height="15" fill="#22d3ee"/>
          <rect x="240" y="134" width="18" height="15" fill="#fbbf24"/><rect x="270" y="134" width="18" height="15" fill="#22d3ee"/><rect x="300" y="134" width="18" height="15" fill="#fbbf24"/>
          <!-- oficina con logo -->
          <rect x="357" y="100" width="165" height="70" fill="#0f1f36" stroke="#334155" stroke-width="4"/>
          <rect x="380" y="120" width="46" height="30" fill="#172554" stroke="#22d3ee" stroke-width="3"/>
          <rect x="388" y="128" width="10" height="8" fill="#22d3ee"/><rect x="403" y="128" width="10" height="8" fill="#fbbf24"/>
          <rect x="447" y="122" width="10" height="28" fill="#3b82f6"/>
          <rect x="462" y="114" width="10" height="36" fill="#8b5cf6"/>
          <rect x="477" y="130" width="10" height="20" fill="#22d3ee"/>
          <rect x="492" y="106" width="10" height="44" fill="#3b82f6"/>
          <rect x="370" y="160" width="140" height="10" fill="#24324a"/>
          <!-- personaje -->
          <rect x="305" y="146" width="18" height="16" fill="#fbbf24"/>
          <rect x="301" y="143" width="26" height="7" fill="#92400e"/>
          <rect x="301" y="162" width="26" height="20" fill="#3b82f6"/>
          <rect x="307" y="182" width="7" height="14" fill="#1e293b"/><rect x="318" y="182" width="7" height="14" fill="#1e293b"/>
          <rect x="292" y="166" width="9" height="7" fill="#fbbf24"/><rect x="327" y="166" width="9" height="7" fill="#fbbf24"/>
          <rect x="0" y="198" width="560" height="12" fill="#162337"/>
        </g>
      </svg>
      <div class="pixel-city"></div>
    </section>
    <div class="grid">
      <div class="card" style="grid-column:1/-1"><div class="pixel-card-art monitor"></div><h3>🎮 Proyecto actual</h3>${proyecto}</div>
      <div class="card"><h3>📈 Ventas activas</h3>${activos}</div>
      <div class="card"><h3>💵 Este mes</h3>
        <div class="row"><span>Ingresos</span><span style="color:var(--money)">${fmtMoney(d.lastMonthRevenue)}</span></div>
        <div class="row"><span>Gastos</span><span style="color:var(--danger)">${fmtMoney(d.lastMonthExpenses)}</span></div>
      </div>
      <div class="card"><h3>🏢 Estudio</h3>
        <div class="row"><span>Nivel oficina</span><span>${GameState.officeInfo().nombre}</span></div>
        <div class="row"><span>Empleados</span><span>${d.employees.length}/${GameState.officeInfo().maxEmp}</span></div>
        <div class="row"><span>Juegos publicados</span><span>${d.library.length}</span></div>
      </div>
    </div>`;
    },
    escapeHtml(value){
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        }[ch]));
    },
    catLabel(c){ return {gameplay:'Gameplay',graficos:'Gráficos',historia:'Historia',audio:'Audio',tecnologia:'Tecnología',pulido:'Pulido'}[c]; },
    crearHTML(d){
        if(d.currentProject){
            return `<div class="tycoon-single-page"><div class="card"><h3>⚠ Ya tienes un proyecto en desarrollo</h3><p style="color:var(--muted)">Termina o cancela "${this.escapeHtml(d.currentProject.nombre)}" antes de iniciar otro.</p></div></div>`;
        }
        const plataformasDisponibles = d.unlockedPlatforms;
        return `<div class="create-layout">
      <div class="card create-form-card">
        <div class="create-kicker">NUEVO PROYECTO</div>
        <h3>🆕 Crea tu próximo juego</h3>
        <p class="create-help">Elige las características y mira cómo cambia la identidad visual del proyecto.</p>
        <label>Nombre del juego</label>
        <input id="inNombre" class="px-input" placeholder="Galaxy Warriors" maxlength="32">
        <label>Género</label>
        <select id="inGenero" class="px-select">${GENEROS.map(g=>`<option>${g}</option>`).join('')}</select>
        <label>Plataforma</label>
        <select id="inPlataforma" class="px-select">${plataformasDisponibles.map(p=>`<option>${p}</option>`).join('')}</select>
        <label>Tamaño del proyecto</label>
        <select id="inTamano" class="px-select">${Object.keys(TAMANOS).map(t=>`<option value="${t}">${t} — ${fmtMoney(TAMANOS[t].coste)} · ${TAMANOS[t].meses} meses aprox.</option>`).join('')}</select>
        <button class="btn btnPrimary create-start-btn" id="btnCrear">🚀 Iniciar desarrollo</button>
      </div>

      <aside class="card game-preview-card">
        <div class="preview-head">
          <div><span class="create-kicker">VISTA PREVIA</span><h3 id="previewTitle">Sin título</h3></div>
          <span id="previewSize" class="preview-size">PEQUEÑO</span>
        </div>
        <div id="gamePreview" class="game-preview" aria-live="polite"></div>
        <div class="preview-meta">
          <span id="previewGenre">🎮 Acción</span>
          <span id="previewPlatform">💻 PC</span>
          <span id="previewCost">💰 $2.000</span>
        </div>
      </aside>
    </div>`;
    },
    renderGamePreview(){
        const name = document.getElementById('inNombre')?.value.trim() || 'Sin título';
        const genre = document.getElementById('inGenero')?.value || 'Acción';
        const platform = document.getElementById('inPlataforma')?.value || 'PC';
        const size = document.getElementById('inTamano')?.value || 'Pequeño';
        const themes = {
            'Acción':      {bg:'#172554', glow:'#22d3ee', accent:'#fbbf24', icon:'⚡', scene:'city'},
            'RPG':         {bg:'#24113f', glow:'#a78bfa', accent:'#fbbf24', icon:'⚔', scene:'castle'},
            'Estrategia':  {bg:'#132e2b', glow:'#34d399', accent:'#fbbf24', icon:'♜', scene:'map'},
            'Simulación':  {bg:'#102b3a', glow:'#38bdf8', accent:'#4ade80', icon:'⌂', scene:'city'},
            'Terror':      {bg:'#180f1c', glow:'#f43f5e', accent:'#a78bfa', icon:'☠', scene:'horror'},
            'Aventura':    {bg:'#17311f', glow:'#4ade80', accent:'#fbbf24', icon:'★', scene:'jungle'},
            'Deportes':    {bg:'#172a46', glow:'#60a5fa', accent:'#f8fafc', icon:'●', scene:'sport'},
            'Carreras':    {bg:'#24130f', glow:'#fb923c', accent:'#f43f5e', icon:'➤', scene:'race'},
            'Roguelike':   {bg:'#171329', glow:'#c084fc', accent:'#f87171', icon:'☠', scene:'dungeon'},
            'Puzzle':      {bg:'#1b1837', glow:'#818cf8', accent:'#22d3ee', icon:'◆', scene:'blocks'},
            'Plataforma':  {bg:'#122b35', glow:'#2dd4bf', accent:'#fbbf24', icon:'★', scene:'platform'}
        };
        const t = themes[genre] || themes['Acción'];
        const scale = {Pequeño:0.82,Mediano:0.92,Grande:1.02,AAA:1.12}[size] || 0.82;
        const safeName = this.escapeHtml(name);
        const scene = {
            city:`<rect x="0" y="122" width="320" height="58" fill="#0b1322"/><rect x="24" y="72" width="45" height="50" fill="#243b6b"/><rect x="86" y="48" width="52" height="74" fill="#1e3a8a"/><rect x="156" y="84" width="48" height="38" fill="#334155"/><rect x="220" y="58" width="58" height="64" fill="#312e81"/><g fill="${t.accent}"><rect x="33" y="82" width="8" height="8"/><rect x="49" y="98" width="8" height="8"/><rect x="98" y="61" width="9" height="9"/><rect x="117" y="82" width="9" height="9"/><rect x="234" y="72" width="10" height="10"/></g>`,
            castle:`<rect x="0" y="124" width="320" height="56" fill="#101827"/><path d="M70 124V70h28v-18h22v18h30v54M165 124V78h25V58h18v20h27v46" fill="#312e81" stroke="#8b5cf6" stroke-width="3"/><path d="M0 145l55-22 42 22 48-27 45 27 58-20 72 20v35H0z" fill="#172554"/><circle cx="158" cy="94" r="8" fill="${t.accent}"/>`,
            map:`<rect x="0" y="0" width="320" height="180" fill="#12352e"/><path d="M0 112 Q80 62 150 110 T320 88 V180H0Z" fill="#14532d"/><path d="M28 24h88v56H28zM138 20h70v62h-70zM232 28h60v54h-60z" fill="#1f2937" stroke="#34d399" stroke-width="2"/><g fill="${t.accent}"><circle cx="70" cy="51" r="8"/><circle cx="173" cy="51" r="8"/><circle cx="262" cy="54" r="8"/></g>`,
            horror:`<rect x="0" y="0" width="320" height="180" fill="#09070d"/><path d="M72 126V68h22V48h22V68h50v58M164 126V74h24V54h22v20h36v52" fill="#17101c" stroke="#7f1d4e" stroke-width="3"/><circle cx="122" cy="88" r="7" fill="#f43f5e"/><circle cx="198" cy="88" r="7" fill="#f43f5e"/><path d="M105 113 Q160 140 215 113" fill="none" stroke="#f43f5e" stroke-width="3"/>`,
            jungle:`<rect x="0" y="0" width="320" height="180" fill="#163321"/><path d="M0 138 Q70 90 135 138 T320 132V180H0Z" fill="#14532d"/><g fill="#22c55e"><path d="M18 142Q22 48 65 20Q48 93 70 142Z"/><path d="M250 142Q245 65 292 30Q275 95 305 142Z"/></g><path d="M140 122l20-38 20 38z" fill="#fbbf24"/><circle cx="160" cy="72" r="9" fill="#f59e0b"/>`,
            sport:`<rect x="0" y="0" width="320" height="180" fill="#16304c"/><path d="M30 25h260v130H30z" fill="#14532d" stroke="#60a5fa" stroke-width="3"/><path d="M160 25v130M30 90h260M160 65a25 25 0 1 1 0 50a25 25 0 1 1 0-50" fill="none" stroke="#e2e8f0" stroke-width="2"/><circle cx="160" cy="90" r="8" fill="${t.accent}"/>`,
            race:`<rect x="0" y="0" width="320" height="180" fill="#25120e"/><path d="M0 20h320v34H0zM0 126h320v34H0z" fill="#111827"/><path d="M0 70L320 45v78L0 98z" fill="#1f2937"/><path d="M120 69l62 0 22 18-22 18h-62l-18-18z" fill="#ef4444" stroke="#fb923c" stroke-width="3"/><circle cx="125" cy="108" r="9" fill="#0f172a"/><circle cx="184" cy="108" r="9" fill="#0f172a"/>`,
            dungeon:`<rect x="0" y="0" width="320" height="180" fill="#0c0a16"/><path d="M48 132V52h36V32h42v20h44V32h42v20h36v80" fill="#21163b" stroke="#a78bfa" stroke-width="3"/><path d="M0 150h320v30H0z" fill="#171329"/><path d="M130 130l30-52 30 52z" fill="#c084fc"/><circle cx="160" cy="68" r="8" fill="#f87171"/>`,
            blocks:`<rect x="0" y="0" width="320" height="180" fill="#161332"/><g stroke="#818cf8" stroke-width="2"><rect x="70" y="45" width="30" height="30" fill="#22d3ee"/><rect x="100" y="75" width="30" height="30" fill="#818cf8"/><rect x="130" y="105" width="30" height="30" fill="#fbbf24"/><rect x="160" y="75" width="30" height="30" fill="#f472b6"/><rect x="190" y="45" width="30" height="30" fill="#4ade80"/></g>`,
            platform:`<rect x="0" y="0" width="320" height="180" fill="#10303a"/><rect x="0" y="142" width="320" height="38" fill="#14532d"/><rect x="38" y="110" width="62" height="10" fill="#fbbf24"/><rect x="148" y="88" width="62" height="10" fill="#2dd4bf"/><rect x="246" y="116" width="50" height="10" fill="#fbbf24"/><circle cx="126" cy="122" r="11" fill="#22d3ee"/>`
        }[t.scene];
        const svg = `<svg viewBox="0 0 320 180" class="preview-svg" role="img" aria-label="Vista previa de ${safeName}">
            <defs><linearGradient id="previewGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.bg}"/><stop offset="1" stop-color="#070b12"/></linearGradient></defs>
            <rect width="320" height="180" rx="14" fill="url(#previewGlow)"/>
            <g>${scene}</g>
            <rect x="10" y="10" width="300" height="160" rx="10" fill="none" stroke="${t.glow}" stroke-opacity=".55"/>
            <g transform="translate(160 90) scale(${scale}) translate(-160 -90)">
                <rect x="136" y="102" width="48" height="38" rx="4" fill="#0f172a" stroke="${t.glow}" stroke-width="3"/>
                <rect x="142" y="108" width="36" height="24" fill="${t.bg}"/>
                <text x="160" y="125" text-anchor="middle" font-size="15" font-weight="900" fill="${t.accent}">${t.icon}</text>
            </g>
            <rect x="16" y="145" width="288" height="23" rx="6" fill="#05080f" fill-opacity=".82"/>
            <text x="28" y="160" fill="#e2e8f0" font-size="9" font-family="Rubik, sans-serif" font-weight="800">${safeName.slice(0,30)}</text>
        </svg>`;
        const root = document.getElementById('gamePreview');
        if(root) root.innerHTML = svg;
        const title = document.getElementById('previewTitle');
        if(title) title.textContent = name;
        const sizeEl = document.getElementById('previewSize');
        if(sizeEl) sizeEl.textContent = size.toUpperCase();
        const genreEl = document.getElementById('previewGenre');
        if(genreEl) genreEl.textContent = '🎮 '+genre;
        const platformEl = document.getElementById('previewPlatform');
        if(platformEl) platformEl.textContent = '🕹️ '+platform;
        const costEl = document.getElementById('previewCost');
        if(costEl) costEl.textContent = '💰 '+fmtMoney(TAMANOS[size].coste);
    },
    empleadosHTML(d){
        const list = d.employees.map(e=>`
      <div class="empCard">
        <div class="name">${e.nombre} <span style="color:var(--muted);font-weight:400">Nv.${e.nivel}</span></div>
        <div class="spec">${e.especialidad} · 💵${e.salario}/mes · Motivación ${e.motivacion}%</div>
        <span class="statChip">Prog ${e.programacion}</span><span class="statChip">Diseño ${e.diseno}</span>
        <span class="statChip">Arte ${e.arte}</span><span class="statChip">Historia ${e.historia}</span>
        <span class="statChip">Audio ${e.audio}</span>
        <div style="margin-top:8px"><button class="btn btnDanger" data-fire="${e.id}">Despedir</button></div>
      </div>`).join('') || '<p style="color:var(--muted)">Sin empleados.</p>';
        const cands = d.candidates.length ? d.candidates.map(c=>`
      <div class="empCard">
        <div class="name">${c.nombre}</div>
        <div class="spec">${c.especialidad} · 💵${c.salario}/mes</div>
        <span class="statChip">Prog ${c.programacion}</span><span class="statChip">Diseño ${c.diseno}</span>
        <span class="statChip">Arte ${c.arte}</span><span class="statChip">Historia ${c.historia}</span>
        <span class="statChip">Audio ${c.audio}</span>
        <div style="margin-top:8px"><button class="btn btnPrimary" data-hire="${c.id}">Contratar</button></div>
      </div>`).join('') : '<p style="color:var(--muted)">Pulsa "Buscar candidatos".</p>';
        return `<div class="grid">
      <div class="card"><h3>👥 Tu equipo (${d.employees.length}/${GameState.officeInfo().maxEmp})</h3>${list}</div>
      <div class="card"><h3>🔎 Candidatos</h3><button class="btn" id="btnBuscar">Buscar candidatos</button><div style="margin-top:10px">${cands}</div></div>
    </div>`;
    },
    mercadoHTML(d){
        const rows = GENEROS.map(g=>{
            const v = d.market[g];
            const cls = v>10?'tagGood':(v<-5?'tagBad':'tagMid');
            return `<div class="row"><span>${g}</span><span class="tag ${cls}">${v>=0?'+':''}${v}% demanda</span></div>`;
        }).join('');
        return `<div class="card" style="max-width:480px"><h3>📊 Tendencias del mercado</h3>${rows}
      <p style="color:var(--muted);font-size:12px;margin-top:10px">Las tendencias cambian cada mes. Elige el género de tu próximo juego con cabeza.</p></div>`;
    },
    oficinaHTML(d){
        const info = GameState.officeInfo();
        const next = info.sig!=null ? `<button class="btn btnPrimary" id="btnUpgrade">Mejorar oficina — ${fmtMoney(info.sig)}</button>` : '<p style="color:var(--muted)">Ya tienes el nivel máximo de oficina.</p>';
        return `<div class="card" style="max-width:480px">
      <h3>🏢 ${info.nombre} (Nivel ${d.officeLevel})</h3>
      <div class="row"><span>Empleados máximos</span><span>${info.maxEmp}</span></div>
      <div class="row"><span>Productividad</span><span>x${info.prod}</span></div>
      <div class="row"><span>Coste mensual</span><span>${fmtMoney(300+d.officeLevel*250)}</span></div>
      <div style="margin-top:10px">${next}</div>
    </div>`;
    },
    finanzasHTML(d){
        return `<div class="grid">
      <div class="card"><h3>💰 Resumen</h3>
        <div class="row"><span>Dinero actual</span><span>${fmtMoney(d.money)}</span></div>
        <div class="row"><span>Ingresos totales</span><span style="color:var(--money)">${fmtMoney(d.totalRevenue)}</span></div>
        <div class="row"><span>Gastos totales</span><span style="color:var(--danger)">${fmtMoney(d.totalExpenses)}</span></div>
      </div>
      <div class="card"><h3>📆 Gastos mensuales fijos</h3>
        <div class="row"><span>Salarios</span><span>${fmtMoney(d.employees.reduce((s,e)=>s+e.salario,0))}</span></div>
        <div class="row"><span>Oficina</span><span>${fmtMoney(300+d.officeLevel*250)}</span></div>
      </div>
    </div>`;
    },
    historialHTML(d){
        const lib = d.library.slice().reverse().map(g=>`<div class="row"><span>${g.nombre} (${g.genero}, ${g.anio})</span><span>${g.calidad}/100</span></div>`).join('') || '<p style="color:var(--muted)">Aún no has publicado ningún juego.</p>';
        const logs = d.logs.slice(0,30).map(l=>`<div class="row"><span>${MESES[l.m]} ${l.y}</span><span style="text-align:right;flex:1;margin-left:10px">${l.msg}</span></div>`).join('');
        return `<div class="grid">
      <div class="card"><h3>🎮 Juegos publicados</h3>${lib}</div>
      <div class="card"><h3>📜 Registro reciente</h3>${logs}</div>
    </div>`;
    },
    bindTabEvents(){
        const $ = id=>document.getElementById(id);
        if($('btnCrear')) $('btnCrear').onclick=()=>{
            const nombre = $('inNombre').value.trim()||'Sin título';
            const genero = $('inGenero').value, plataforma=$('inPlataforma').value, tamano=$('inTamano').value;
            if(DevSystem.startProject(GameState.data,{nombre,genero,plataforma,tamano})) this.renderAll();
        };
        ['inNombre','inGenero','inPlataforma','inTamano'].forEach(id=>{
            const el=$(id);
            if(el) el.addEventListener(el.tagName==='INPUT'?'input':'change',()=>this.renderGamePreview());
        });
        if($('gamePreview')) this.renderGamePreview();
        if($('btnOpenLaunch')) $('btnOpenLaunch').onclick=()=>this.showLaunchModal();
        if($('btnCancelProject')) $('btnCancelProject').onclick=()=>{ if(confirm('¿Cancelar el proyecto actual?')){ DevSystem.cancel(GameState.data); this.renderAll(); } };
        if($('btnBuscar')) $('btnBuscar').onclick=()=>{ EmployeeSystem.refreshCandidates(GameState.data); this.renderAll(); };
        if($('btnUpgrade')) $('btnUpgrade').onclick=()=>{
            const info = GameState.officeInfo();
            if(GameState.data.money<info.sig){ GameState.log('⚠ No tienes dinero suficiente para mejorar la oficina.'); this.renderAll(); return; }
            GameState.data.money -= info.sig; GameState.data.totalExpenses += info.sig; GameState.data.officeLevel++;
            GameState.log('🏗️ ¡Oficina mejorada!'); this.renderAll();
        };
        document.querySelectorAll('[data-hire]').forEach(b=>b.onclick=()=>{ EmployeeSystem.hire(GameState.data,b.dataset.hire); this.renderAll(); });
        document.querySelectorAll('[data-fire]').forEach(b=>b.onclick=()=>{ if(confirm('¿Despedir a este empleado?')){ EmployeeSystem.fire(GameState.data,b.dataset.fire); this.renderAll(); } });
    },
    showLaunchModal(){
        const root = document.getElementById('modalRoot');
        root.innerHTML = `<div class="modalOverlay"><div class="modalBox">
      <h2>🚀 Preparar lanzamiento</h2>
      <label>Campaña de marketing</label>
      <select id="mktSelect">${Object.keys(CAMPANAS).map(k=>`<option value="${k}">${k} — ${fmtMoney(CAMPANAS[k].coste)}</option>`).join('')}</select>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btnPrimary" id="btnConfirmLaunch">Lanzar ahora</button>
        <button class="btn" id="btnCancelModal">Cancelar</button>
      </div>
    </div></div>`;
        document.getElementById('btnCancelModal').onclick=()=>root.innerHTML='';
        document.getElementById('btnConfirmLaunch').onclick=()=>{
            const mkt = document.getElementById('mktSelect').value;
            const release = FinanceSystem.launch(GameState.data, mkt);
            root.innerHTML='';
            if(release) this.showReviewModal(release);
            this.renderAll();
        };
    },
    showReviewModal(r){
        const root = document.getElementById('modalRoot');
        const avgStars = (r.reviews.reduce((s,x)=>s+x.estrellas,0)/r.reviews.length).toFixed(1);
        root.innerHTML = `<div class="modalOverlay"><div class="modalBox">
      <h2>📰 Reseñas de "${r.nombre}"</h2>
      <div class="qualityBig" style="color:${r.calidad>=75?'var(--money)':r.calidad>=50?'var(--rep)':'var(--danger)'}">${r.calidad}/100</div>
      <div style="text-align:center;color:var(--muted);margin-bottom:10px">⭐ ${avgStars}/5 promedio</div>
      ${r.reviews.map(rv=>`<div class="review">${'★'.repeat(rv.estrellas)}${'☆'.repeat(5-rv.estrellas)}<br>"${rv.texto}"</div>`).join('')}
      <button class="btn btnPrimary" style="width:100%;margin-top:10px" id="btnCloseReview">Continuar</button>
    </div></div>`;
        document.getElementById('btnCloseReview').onclick=()=>root.innerHTML='';
    },
    showGameOver(){
        const root = document.getElementById('modalRoot');
        root.innerHTML = `<div class="modalOverlay"><div class="modalBox" style="text-align:center">
      <h2 style="color:var(--danger)">💀 Bancarrota</h2>
      <p style="color:var(--muted)">Tu estudio ha acumulado demasiadas deudas y ha tenido que cerrar.</p>
      <button class="btn btnDanger" id="btnGORestart">Empezar de nuevo</button>
    </div></div>`;
        document.getElementById('btnGORestart').onclick=()=>{ SaveSystem.reset(); location.reload(); };
    }
};

/* ================= BOOT ================= */
window.addEventListener('DOMContentLoaded',()=>{
    const startScreen = document.getElementById('startScreen');
    const app = document.getElementById('app');
    document.getElementById('btnLoadGame').disabled = !SaveSystem.hasSave();
    document.getElementById('btnNewGame').onclick=()=>{
        const name = document.getElementById('studioNameInput').value.trim();
        GameState.init(name);
        startScreen.classList.add('hidden'); app.classList.remove('hidden');
        UIManager.init();
    };
    document.getElementById('btnLoadGame').onclick=()=>{
        if(SaveSystem.load()){
            startScreen.classList.add('hidden'); app.classList.remove('hidden');
            UIManager.init();
        }
    };
});