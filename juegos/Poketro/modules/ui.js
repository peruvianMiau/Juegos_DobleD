import { POKER_HANDS_INFO, LEGENDARY_SHOP } from './pokemonData.js';

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

export function showPlayResult(cardsPlayed, evalRes) {
  const overlay = document.getElementById('playResultOverlay');
  const container = document.getElementById('playResultCards');
  const handNameEl = document.getElementById('playResultHandName');
  const chipsEl = document.getElementById('playResultChips');
  const multEl = document.getElementById('playResultMult');
  const scoreEl = document.getElementById('playResultScore');
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

  // Los números del panel lateral aparecen un instante después de que las cartas se asienten
  setTimeout(() => {
    chipsEl.innerText = evalRes.totalChips;
    multEl.innerText = evalRes.totalMult;
    scoreEl.innerText = evalRes.estimatedTotal;
    scoreEl.classList.remove('score-pop');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-pop');
  }, 250);

  overlay.classList.remove('hidden');
}

export function hidePlayResult() {
  document.getElementById('playResultOverlay')?.classList.add('hidden');
}

function jokerCardMarkup(joker, { showCost = false, disabled = false } = {}) {
  return `
    <div class="joker-card relative w-24 h-32 sm:w-28 sm:h-38 md:w-28 md:h-40 bg-gradient-to-b from-amber-900/50 via-slate-900 to-slate-900 border-2 border-yellow-500/70 rounded-xl flex flex-col justify-between p-2 shadow-lg ${disabled ? 'opacity-40' : ''}">
      ${showCost ? `<div class="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300 shadow z-10">$${joker.cost}</div>` : ''}
      <div class="text-[10px] md:text-xs text-center font-bold text-yellow-300 truncate">${joker.name}</div>
      <div class="flex-1 flex items-center justify-center">
        <img src="${joker.img}" alt="${joker.name}" class="w-14 h-14 md:w-16 md:h-16 object-contain pointer-events-none drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
      </div>
      <div class="text-[9px] md:text-[10px] text-center text-slate-300 leading-tight">${joker.desc}</div>
    </div>
  `;
}

export function renderJokers(jokers) {
  const container = document.getElementById('jokersContainer');
  const noText = document.getElementById('noJokersText');

  if (jokers.length === 0) {
    container.innerHTML = '';
    if (noText) container.appendChild(noText);
    return;
  }

  container.innerHTML = jokers.map(j => jokerCardMarkup(j)).join('');
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
  document.getElementById('baseMultDisplay').innerText = res.totalMult;
  document.getElementById('estimatedTotalDisplay').innerText = res.estimatedTotal;
}

export function renderHandsModalInfo() {
  const container = document.getElementById('handsExamplesContainer');
  if (!container) return;
  container.innerHTML = '';

  POKER_HANDS_INFO.forEach(item => {
    const row = document.createElement('div');
    row.className = "bg-slate-800 border border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2";
    row.innerHTML = `
      <div>
        <div class="font-bold text-indigo-300">${item.name}</div>
        <div class="text-xs text-slate-400">Base: <span class="text-cyan-400">${item.chips} fichas</span> × <span class="text-rose-400">${item.mult} Mult</span></div>
      </div>
      <div class="flex gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
        ${item.example.map(ex => `<span class="text-xs bg-slate-700 px-2 py-1 rounded text-amber-300 font-semibold">${ex}</span>`).join('')}
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
          <div class="envelope w-20 h-28 sm:w-24 sm:h-32 rounded-lg flex items-center justify-center text-3xl">🎴</div>
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
