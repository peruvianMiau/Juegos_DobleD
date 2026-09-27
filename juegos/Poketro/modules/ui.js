import { POKER_HANDS_INFO, LEGENDARY_SHOP, POKEMON_DATA } from './pokemonData.js';

function findPokemon(name) {
  return POKEMON_DATA.find(p => p.name === name);
}

// Formatea el multiplicador mostrando decimales solo cuando hacen falta (por los jokers x1.5, x2, etc.)
function formatMult(n) {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function contribLabel(res) {
  if (!res || !res.triggered) return '';
  const parts = [];
  if (res.chips) parts.push(`+${res.chips}🔷`);
  if (res.mult) parts.push(`+${res.mult}✖`);
  if (res.xmult && res.xmult !== 1) parts.push(`×${formatMult(res.xmult)}`);
  return parts.join(' ');
}

export function updateUI(gameState) {
  document.getElementById('roundDisplay').innerText = gameState.round;
  document.getElementById('moneyDisplay').innerText = `$${gameState.money}`;
  document.getElementById('targetScoreDisplay').innerText = gameState.targetScore;
  document.getElementById('currentScoreDisplay').innerText = gameState.currentScore;
  document.getElementById('handsLeftDisplay').innerText = gameState.handsLeft;
  document.getElementById('discardsLeftDisplay').innerText = gameState.discardsLeft;
}

export function renderHand(gameState, evalRes, onSelectCard) {
  const container = document.getElementById('handContainer');
  container.innerHTML = '';

  gameState.hand.forEach((card, index) => {
    const isSelected = gameState.selectedIndices.includes(index);
    const isScoring = evalRes && evalRes.scoringIndices.includes(index);

    const cardEl = document.createElement('div');
    cardEl.className = `card-container relative w-24 h-32 sm:w-28 sm:h-38 md:w-32 md:h-44 bg-slate-800 border-2 border-slate-600 rounded-xl flex flex-col justify-between p-2 cursor-pointer shadow-lg transition-all select-none ${isSelected ? 'card-selected' : ''} ${isScoring ? 'card-scoring' : ''}`;
    cardEl.onclick = () => onSelectCard(index);

    cardEl.innerHTML = `
      <div class="flex justify-between items-center text-xs md:text-sm font-bold">
        <span class="text-amber-300">${card.valStr}</span>
        <span class="text-base md:text-lg">${card.suit}</span>
      </div>
      <div class="flex-1 flex items-center justify-center my-0.5">
        <img src="${card.img}" alt="${card.name}" class="w-16 h-16 md:w-20 md:h-20 object-contain pointer-events-none" />
      </div>
      <div class="text-[10px] md:text-xs text-center font-semibold text-slate-300 truncate">
        ${card.name}
      </div>
    `;
    container.appendChild(cardEl);
  });

  document.getElementById('selectedCount').innerText = gameState.selectedIndices.length;
}

function jokerOverlayCardMarkup(joker) {
  return `
    <div class="joker-card relative w-16 h-24 sm:w-20 sm:h-28 bg-gradient-to-b from-amber-900/50 via-slate-900 to-slate-900 border-2 border-slate-700 rounded-lg flex flex-col justify-between p-1.5 shadow-lg opacity-40 grayscale">
      <div class="text-[8px] text-center font-bold text-yellow-300 truncate leading-tight">${joker.name}</div>
      <div class="flex-1 flex items-center justify-center">
        <img src="${joker.img}" alt="${joker.name}" class="w-9 h-9 sm:w-11 sm:h-11 object-contain pointer-events-none" />
      </div>
    </div>
  `;
}

export function showPlayResult(cardsPlayed, evalRes, jokers) {
  const overlay = document.getElementById('playResultOverlay');
  const container = document.getElementById('playResultCards');
  const handNameEl = document.getElementById('playResultHandName');
  const chipsEl = document.getElementById('playResultChips');
  const multEl = document.getElementById('playResultMult');
  const scoreEl = document.getElementById('playResultScore');
  const jokerStrip = document.getElementById('playResultJokers');
  const jokerStripWrap = document.getElementById('playResultJokersWrap');
  if (!overlay || !container) return;

  container.innerHTML = '';
  handNameEl.innerText = evalRes.handName;
  chipsEl.innerText = '0';
  multEl.innerText = '0';
  scoreEl.innerText = '0';

  cardsPlayed.forEach(({ card, originalIndex }, i) => {
    const isScoring = evalRes.scoringIndices.includes(originalIndex);

    const cardEl = document.createElement('div');
    cardEl.className = `result-card relative w-24 h-32 sm:w-28 sm:h-38 md:w-32 md:h-44 bg-slate-800 border-2 border-slate-600 rounded-xl flex flex-col justify-between p-2 shadow-2xl ${isScoring ? 'card-scoring' : 'result-card-unused'}`;
    cardEl.style.animationDelay = `${i * 0.08}s`;

    cardEl.innerHTML = `
      <div class="flex justify-between items-center text-xs md:text-sm font-bold">
        <span class="text-amber-300">${card.valStr}</span>
        <span class="text-base md:text-lg">${card.suit}</span>
      </div>
      <div class="flex-1 flex items-center justify-center my-0.5">
        <img src="${card.img}" alt="${card.name}" class="w-16 h-16 md:w-20 md:h-20 object-contain pointer-events-none" />
      </div>
      <div class="text-[10px] md:text-xs text-center font-semibold text-slate-300 truncate">
        ${card.name}
      </div>
    `;
    container.appendChild(cardEl);
  });

  // --- Tira de Comodines: aparecen apagados y "saltan" + brillan en el momento en que aportan ---
  const jokerList = jokers || [];
  const jokerResults = evalRes.jokerResults || [];
  const jokerElsById = {};

  if (jokerStrip) {
    jokerStrip.innerHTML = '';
    if (jokerStripWrap) {
      jokerStripWrap.classList.toggle('hidden', jokerList.length === 0);
      jokerStripWrap.classList.toggle('flex', jokerList.length > 0);
    }
    jokerList.forEach(j => {
      const wrap = document.createElement('div');
      wrap.className = 'relative';
      wrap.innerHTML = jokerOverlayCardMarkup(j);
      jokerStrip.appendChild(wrap);
      jokerElsById[j.id] = wrap.firstElementChild;
    });
  }

  const triggered = jokerResults.filter(r => r.triggered && jokerElsById[r.id]);

  // Los números del panel lateral aparecen un instante después de que las cartas se asienten
  setTimeout(() => {
    chipsEl.innerText = evalRes.baseChips;
    multEl.innerText = formatMult(evalRes.baseMult);
    chipsEl.classList.remove('score-pop'); void chipsEl.offsetWidth; chipsEl.classList.add('score-pop');
    multEl.classList.remove('score-pop'); void multEl.offsetWidth; multEl.classList.add('score-pop');

    let runningChips = evalRes.baseChips;
    let runningMult = evalRes.baseMult;

    triggered.forEach((res, i) => {
      setTimeout(() => {
        const el = jokerElsById[res.id];
        if (el) {
          el.classList.remove('opacity-40', 'grayscale');
          el.classList.remove('joker-trigger-anim');
          void el.offsetWidth;
          el.classList.add('joker-trigger-anim', 'border-yellow-300');

          const badge = document.createElement('div');
          badge.className = 'joker-float-badge';
          badge.innerText = contribLabel(res);
          el.parentElement.appendChild(badge);
          setTimeout(() => badge.remove(), 1000);
        }

        runningChips += res.chips || 0;
        runningMult += res.mult || 0;
        if (res.xmult && res.xmult !== 1) runningMult *= res.xmult;

        chipsEl.innerText = runningChips;
        multEl.innerText = formatMult(runningMult);
        chipsEl.classList.remove('value-pop'); void chipsEl.offsetWidth; chipsEl.classList.add('value-pop');
        multEl.classList.remove('value-pop'); void multEl.offsetWidth; multEl.classList.add('value-pop');
      }, i * 600);
    });

    const totalDelay = triggered.length * 600 + 350;
    setTimeout(() => {
      scoreEl.innerText = evalRes.estimatedTotal;
      scoreEl.classList.remove('score-pop');
      void scoreEl.offsetWidth;
      scoreEl.classList.add('score-pop');
    }, totalDelay);
  }, 250);

  overlay.classList.remove('hidden');
}

export function hidePlayResult() {
  document.getElementById('playResultOverlay')?.classList.add('hidden');
}

function jokerCardMarkup(joker, { showCost = false, disabled = false, resultInfo = null } = {}) {
  const isActive = resultInfo && resultInfo.triggered;
  const label = isActive ? contribLabel(resultInfo) : '';
  return `
    <div class="joker-card relative w-24 h-32 sm:w-28 sm:h-38 md:w-28 md:h-40 bg-gradient-to-b from-amber-900/50 via-slate-900 to-slate-900 border-2 rounded-xl flex flex-col justify-between p-2 shadow-lg ${disabled ? 'opacity-40' : ''} ${isActive ? 'joker-active' : 'border-yellow-500/70'}">
      ${showCost ? `<div class="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 shadow z-10">$${joker.cost}</div>` : ''}
      ${label ? `<div class="joker-live-badge">${label}</div>` : ''}
      <div class="text-[10px] md:text-xs text-center font-bold text-yellow-300 truncate">${joker.name}</div>
      <div class="flex-1 flex items-center justify-center">
        <img src="${joker.img}" alt="${joker.name}" class="w-14 h-14 md:w-16 md:h-16 object-contain pointer-events-none drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
      </div>
      <div class="text-[9px] md:text-[10px] text-center text-slate-300 leading-tight">${joker.desc}</div>
    </div>
  `;
}

// jokerResults (opcional): resultado en vivo de evaluateHand para resaltar qué comodines
// aportarían con la selección actual de cartas (antes incluso de jugar la mano).
export function renderJokers(jokers, jokerResults = null) {
  const container = document.getElementById('jokersContainer');
  const noText = document.getElementById('noJokersText');

  if (jokers.length === 0) {
    container.innerHTML = '';
    if (noText) container.appendChild(noText);
    return;
  }

  container.innerHTML = jokers.map(j => {
    const resultInfo = jokerResults ? jokerResults.find(r => r.id === j.id) : null;
    return jokerCardMarkup(j, { resultInfo });
  }).join('');
}

export function updateEvaluatorUI(res) {
  if (!res) {
    document.getElementById('detectedHandDisplay').innerText = "Ninguna";
    document.getElementById('baseChipsDisplay').innerText = "0";
    document.getElementById('baseMultDisplay').innerText = "0";
    document.getElementById('estimatedTotalDisplay').innerText = "0";
    return;
  }

  document.getElementById('detectedHandDisplay').innerText = res.handName;
  document.getElementById('baseChipsDisplay').innerText = res.totalChips;
  document.getElementById('baseMultDisplay').innerText = formatMult(res.totalMult);
  document.getElementById('estimatedTotalDisplay').innerText = res.estimatedTotal;
}

export function renderHandsModalInfo() {
  const container = document.getElementById('handsExamplesContainer');
  if (!container) return;
  container.innerHTML = '';

  POKER_HANDS_INFO.forEach(item => {
    const row = document.createElement('div');
    row.className = "bg-slate-800 border border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3";

    const miniCards = item.example.map(ex => {
      const poke = findPokemon(ex.name);
      if (!poke) return '';
      return `
        <div class="flex flex-col items-center bg-slate-900 border border-slate-700 rounded-lg p-1 w-12 sm:w-14 shrink-0">
          <img src="${poke.img}" alt="${ex.name}" class="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
          <span class="text-[8px] sm:text-[9px] text-amber-300 font-bold leading-tight">${poke.valStr}${ex.suit}</span>
        </div>
      `;
    }).join('');

    row.innerHTML = `
      <div>
        <div class="font-bold text-indigo-300">${item.name}</div>
        <div class="text-xs text-slate-400">Base: <span class="text-cyan-400">${item.chips} fichas</span> × <span class="text-rose-400">${item.mult} Mult</span></div>
      </div>
      <div class="flex gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
        ${miniCards}
      </div>
    `;
    container.appendChild(row);
  });
}

export function renderShop(gameState, onBuyJoker, onBuyPack, onChoosePackCard) {
  const moneyEl = document.getElementById('shopMoneyDisplay');
  if (moneyEl) moneyEl.innerText = `$${gameState.money}`;

  const offersContainer = document.getElementById('shopItemsContainer');
  if (offersContainer) {
    offersContainer.innerHTML = '';
    const offers = (gameState.shopOffers || [])
        .map(id => LEGENDARY_SHOP.find(j => j.id === id))
        .filter(Boolean);

    if (offers.length === 0) {
      offersContainer.innerHTML = `<p class="col-span-full text-sm text-slate-500 italic">No quedan más Comodines Legendarios disponibles.</p>`;
    }

    offers.forEach(joker => {
      const isBought = gameState.jokers.some(j => j.id === joker.id);
      const canAfford = gameState.money >= joker.cost;
      const wrap = document.createElement('div');
      wrap.className = "flex flex-col items-center gap-2";
      wrap.innerHTML = `
        ${jokerCardMarkup(joker, { showCost: true, disabled: isBought })}
        <button id="buy-btn-${joker.id}" ${isBought || !canAfford ? 'disabled' : ''}
                class="w-full max-w-[9rem] bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold py-1.5 rounded text-xs transition">
          ${isBought ? 'Comprado' : `Comprar ($${joker.cost})`}
        </button>
      `;
      offersContainer.appendChild(wrap);
      wrap.querySelector(`#buy-btn-${joker.id}`).onclick = () => onBuyJoker(joker.id);
    });
  }

  const packsContainer = document.getElementById('shopPacksContainer');
  if (packsContainer) {
    packsContainer.innerHTML = '';
    (gameState.shopPacks || []).forEach(pack => {
      const packEl = document.createElement('div');
      packEl.className = "bg-slate-950/70 border border-indigo-500/40 rounded-2xl p-4 flex flex-col items-center gap-3";

      if (!pack.opened) {
        const canAfford = gameState.money >= pack.cost;
        packEl.innerHTML = `
          <div class="pokeball-wrap pokeball-idle">
            <div class="pokeball">
              <div class="pokeball-band"></div>
              <div class="pokeball-button"></div>
            </div>
          </div>
          <div class="text-xs text-slate-300 font-semibold">Sobre Legendario</div>
          <div class="text-[10px] text-slate-500">Contiene 2 Pokémon, elige 1</div>
          <button id="pack-btn-${pack.id}" ${canAfford ? '' : 'disabled'}
                  class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition">
            Comprar ($${pack.cost})
          </button>
        `;
        packEl.querySelector(`#pack-btn-${pack.id}`).onclick = () => onBuyPack(pack.id);
      } else {
        const candidates = pack.candidates.map(id => LEGENDARY_SHOP.find(j => j.id === id)).filter(Boolean);
        packEl.innerHTML = `
          <div class="text-xs text-indigo-300 font-bold uppercase tracking-wide">Elige 1 Comodín</div>
          <div class="flex gap-3" id="pack-choices-${pack.id}"></div>
        `;
        const choicesWrap = packEl.querySelector(`#pack-choices-${pack.id}`);
        candidates.forEach(joker => {
          const choiceEl = document.createElement('button');
          choiceEl.className = "flex flex-col items-center gap-1 hover:scale-105 transition-transform";
          choiceEl.innerHTML = jokerCardMarkup(joker);
          choiceEl.onclick = () => onChoosePackCard(pack.id, joker.id);
          choicesWrap.appendChild(choiceEl);
        });
      }
      packsContainer.appendChild(packEl);
    });
  }
}

export function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
export function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }
