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
  const scoreEl = document.getElementById('playResultScore');
  if (!overlay || !container) return;

  container.innerHTML = '';
  handNameEl.innerText = evalRes.handName;
  scoreEl.innerText = '';

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

  requestAnimationFrame(() => {
    scoreEl.innerText = `+${evalRes.estimatedTotal}`;
  });

  overlay.classList.remove('hidden');
}

export function hidePlayResult() {
  document.getElementById('playResultOverlay')?.classList.add('hidden');
}

export function renderJokers(jokers) {
  const container = document.getElementById('jokersContainer');
  const noText = document.getElementById('noJokersText');

  if (jokers.length === 0) {
    if (noText) noText.style.display = 'block';
    container.innerHTML = '';
    if (noText) container.appendChild(noText);
    return;
  }

  if (noText) noText.style.display = 'none';
  container.innerHTML = '';

  jokers.forEach(j => {
    const el = document.createElement('div');
    el.className = "bg-slate-800 border border-yellow-500/50 rounded-lg p-2 flex items-center gap-2 shadow";
    el.innerHTML = `
      <img src="${j.img}" class="w-8 h-8 object-contain" />
      <div class="text-left">
        <div class="text-xs font-bold text-yellow-300">${j.name}</div>
        <div class="text-[10px] text-slate-400">${j.desc}</div>
      </div>
    `;
    container.appendChild(el);
  });
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

export function renderShop(gameState, onBuyJoker) {
  const container = document.getElementById('shopItemsContainer');
  if (!container) return;
  container.innerHTML = '';

  LEGENDARY_SHOP.forEach(joker => {
    const isBought = gameState.jokers.some(j => j.id === joker.id);
    const card = document.createElement('div');
    card.className = "bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-between";
    card.innerHTML = `
      <img src="${joker.img}" class="w-16 h-16 object-contain mb-2" />
      <div class="font-bold text-yellow-400">${joker.name}</div>
      <div class="text-xs text-slate-300 my-2 text-center">${joker.desc}</div>
      <button id="buy-btn-${joker.id}" ${isBought || gameState.money < joker.cost ? 'disabled' : ''} 
              class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold py-1.5 rounded text-xs transition">
        ${isBought ? 'Comprado' : `Comprar ($${joker.cost})`}
      </button>
    `;
    container.appendChild(card);

    const btn = card.querySelector(`#buy-btn-${joker.id}`);
    btn.onclick = () => onBuyJoker(joker.id);
  });
}

export function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
export function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }