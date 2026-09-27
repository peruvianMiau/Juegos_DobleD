import { POKEMON_DATA, SUITS, LEGENDARY_SHOP, getJokerRarity, MAX_JOKERS } from './modules/pokemonData.js';
import { evaluateHand } from './modules/scoring.js';
import {
  updateUI,
  renderHand,
  renderJokers,
  updateEvaluatorUI,
  renderHandsModalInfo,
  renderJokersModalInfo,
  renderAllJokersCatalog,
  renderShop,
  renderDiscardJokerChoice,
  openModal,
  closeModal,
  showPlayResult,
  hidePlayResult,
  showRoundToast
} from './modules/ui.js';
import { toggleMusic } from './modules/audio.js';

const SHOP_INTERVAL = 3;
const TARGET_GROWTH = 1.45;
const ROUND_INCOME = 3;
const FAST_CLEAR_INCOME = 5; // Bonus si superas la Ciega usando solo 1 o 2 manos
const FAIL_INCOME = 1;
const SHOP_BONUS = 6;

const BASE_HANDS = 4;
const BASE_DISCARDS = 3;
const ROUNDS_PER_EXTRA_HAND = 2;   // +1 Mano cada 2 rondas
const ROUNDS_PER_EXTRA_DISCARD = 3; // +1 Descarte cada 3 rondas
const MAX_HANDS = 6;
const MAX_DISCARDS = 5;

function handsForRound(round) {
  return Math.min(MAX_HANDS, BASE_HANDS + Math.floor((round - 1) / ROUNDS_PER_EXTRA_HAND));
}

function discardsForRound(round) {
  return Math.min(MAX_DISCARDS, BASE_DISCARDS + Math.floor((round - 1) / ROUNDS_PER_EXTRA_DISCARD));
}

function freshState() {
  return {
    round: 1,
    targetScore: 300,
    currentScore: 0,
    money: 0,
    handsLeft: handsForRound(1),
    discardsLeft: discardsForRound(1),
    deck: [],
    hand: [],
    selectedIndices: [],
    jokers: [],
    shopOffers: [],
    shopPacks: [],
    pendingJoker: null // compra/sobre en espera mientras el jugador elige qué Comodín descartar
  };
}

let gameState = freshState();

function initGame() {
  createDeck();
  drawHand(8);
  refreshHandUI();
  renderJokers(gameState.jokers);
  renderHandsModalInfo();
  updateUI(gameState);
  setupEventListeners();
}

function createDeck() {
  gameState.deck = [];
  let idCounter = 1;
  SUITS.forEach(suit => {
    POKEMON_DATA.forEach(poke => {
      gameState.deck.push({
        id: idCounter++,
        name: poke.name,
        value: poke.value,
        valStr: poke.valStr,
        suit: suit,
        img: poke.img
      });
    });
  });
  gameState.deck.sort(() => Math.random() - 0.5);
}

function drawHand(count) {
  while (gameState.hand.length < count && gameState.deck.length > 0) {
    gameState.hand.push(gameState.deck.pop());
  }
}

function toggleSelectCard(index) {
  const selIdx = gameState.selectedIndices.indexOf(index);
  if (selIdx > -1) {
    gameState.selectedIndices.splice(selIdx, 1);
  } else {
    if (gameState.selectedIndices.length < 5) {
      gameState.selectedIndices.push(index);
    }
  }
  refreshHandUI();
}

function refreshHandUI() {
  const evalRes = evaluateHand(gameState.selectedIndices, gameState.hand, gameState.jokers);
  renderHand(gameState, evalRes, toggleSelectCard);
  updateEvaluatorUI(evalRes);
  // Vista previa en vivo: resalta qué Comodines aportarían con la selección actual
  renderJokers(gameState.jokers, evalRes ? evalRes.jokerResults : null);
}

function sortHandBySuit() {
  gameState.hand.sort((a, b) => {
    const suitDiff = SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
    return suitDiff !== 0 ? suitDiff : a.value - b.value;
  });
  gameState.selectedIndices = [];
  refreshHandUI();
}

function sortHandByValue() {
  gameState.hand.sort((a, b) => {
    const valDiff = a.value - b.value;
    return valDiff !== 0 ? valDiff : SUITS.indexOf(a.suit) - SUITS.indexOf(b.suit);
  });
  gameState.selectedIndices = [];
  refreshHandUI();
}

function playHand() {
  if (gameState.selectedIndices.length === 0 || gameState.handsLeft <= 0) return;

  const evalRes = evaluateHand(gameState.selectedIndices, gameState.hand, gameState.jokers);
  const cardsPlayed = gameState.selectedIndices.map(i => ({ card: gameState.hand[i], originalIndex: i }));

  document.getElementById('playBtn').disabled = true;
  document.getElementById('discardBtn').disabled = true;

  showPlayResult(cardsPlayed, evalRes, gameState.jokers);

  const triggeredCount = (evalRes.jokerResults || []).filter(r => r.triggered).length;
  const totalDelay = 1300 + triggeredCount * 600 + 700;

  setTimeout(() => {
    hidePlayResult();
    resolvePlayedHand(evalRes);
  }, totalDelay);
}

function resolvePlayedHand(evalRes) {
  gameState.currentScore += evalRes.estimatedTotal;
  gameState.handsLeft--;

  gameState.selectedIndices.sort((a, b) => b - a).forEach(idx => {
    gameState.hand.splice(idx, 1);
  });
  gameState.selectedIndices = [];

  drawHand(8);
  updateUI(gameState);
  refreshHandUI();

  document.getElementById('playBtn').disabled = false;
  document.getElementById('discardBtn').disabled = false;

  if (gameState.currentScore >= gameState.targetScore) {
    finishRound(true);
  } else if (gameState.handsLeft <= 0) {
    // Ya no se reinicia el juego: la ronda se da por "fallida" pero se sigue jugando.
    finishRound(false);
  }
}

function finishRound(success) {
  const handsUsed = handsForRound(gameState.round) - gameState.handsLeft;
  const fastClear = success && handsUsed <= 2;
  const income = success ? (fastClear ? FAST_CLEAR_INCOME : ROUND_INCOME) : FAIL_INCOME;
  gameState.money += income;
  updateUI(gameState);

  const willOpenShop = success && gameState.round % SHOP_INTERVAL === 0;
  showRoundToast(success, income, willOpenShop, fastClear);

  document.getElementById('playBtn').disabled = true;
  document.getElementById('discardBtn').disabled = true;

  if (!success) {
    // Se deja tiempo de sobra para leer el aviso antes de mostrar la pantalla de derrota.
    setTimeout(showGameOver, 2500);
    return;
  }

  // Se espera a que el aviso de "¡Ciega superada!" termine de mostrarse antes de continuar.
  setTimeout(() => {
    if (willOpenShop) {
      gameState.money += SHOP_BONUS;
      openShopModal();
    } else {
      advanceRound();
    }
  }, 3000);
}

function showGameOver() {
  document.getElementById('gameOverText').innerText =
    `No alcanzaste el objetivo de ${gameState.targetScore} en la Ciega ${gameState.round}.`;
  openModal('gameOverModal');
}

function discardCards() {
  if (gameState.selectedIndices.length === 0 || gameState.discardsLeft <= 0) return;

  gameState.discardsLeft--;
  gameState.selectedIndices.sort((a, b) => b - a).forEach(idx => {
    gameState.hand.splice(idx, 1);
  });
  gameState.selectedIndices = [];

  drawHand(8);
  updateUI(gameState);
  refreshHandUI();
}
const RARITY_WEIGHTS = { common: 10, rare: 4, epic: 2, legendary: 1 };
function weightedShuffle(pool) {
  return pool
    .map(joker => ({ joker, sortKey: Math.pow(Math.random(), 1 / RARITY_WEIGHTS[getJokerRarity(joker.cost)]) }))
    .sort((a, b) => b.sortKey - a.sortKey)
    .map(entry => entry.joker);
}

function generateShopInventory() {
  const ownedIds = gameState.jokers.map(j => j.id);
  const available = LEGENDARY_SHOP.filter(j => !ownedIds.includes(j.id));

  gameState.shopOffers = weightedShuffle(available).slice(0, 4).map(j => j.id);

  gameState.shopPacks = [0, 1, 2].map((_, idx) => {
    const candidates = weightedShuffle(available).slice(0, 2).map(j => j.id);
    return {
      id: `pack-${idx}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cost: 4,
      opened: false,
      candidates
    };
  }).filter(pack => pack.candidates.length > 0);
}

function openShopModal() {
  generateShopInventory();
  updateUI(gameState);
  renderShop(gameState, buyJoker, buyPack, choosePackCard);
  openModal('shopModal');
}

function buyJoker(jokerId) {
  const joker = LEGENDARY_SHOP.find(j => j.id === jokerId);
  if (!joker || gameState.money < joker.cost || gameState.jokers.some(j => j.id === joker.id)) return;

  // Tope de Comodines alcanzado: hay que elegir a cuál soltar antes de completar la compra.
  if (gameState.jokers.length >= MAX_JOKERS) {
    openDiscardJokerModal({ type: 'shop', jokerId: joker.id });
    return;
  }

  gameState.money -= joker.cost;
  gameState.jokers.push(joker);
  renderJokers(gameState.jokers);
  updateUI(gameState);
  renderShop(gameState, buyJoker, buyPack, choosePackCard);
}

function buyPack(packId) {
  const pack = gameState.shopPacks.find(p => p.id === packId);
  if (!pack || pack.opened || gameState.money < pack.cost) return;
  gameState.money -= pack.cost;
  pack.opened = true;
  updateUI(gameState);
  renderShop(gameState, buyJoker, buyPack, choosePackCard);
}

function choosePackCard(packId, jokerId) {
  const pack = gameState.shopPacks.find(p => p.id === packId);
  if (!pack) return;
  const joker = LEGENDARY_SHOP.find(j => j.id === jokerId);
  if (!joker || gameState.jokers.some(j => j.id === joker.id)) return;

  // Tope de Comodines alcanzado: hay que elegir a cuál soltar antes de quedarse con el del sobre.
  if (gameState.jokers.length >= MAX_JOKERS) {
    openDiscardJokerModal({ type: 'pack', packId, jokerId: joker.id });
    return;
  }

  gameState.jokers.push(joker);
  renderJokers(gameState.jokers);
  gameState.shopPacks = gameState.shopPacks.filter(p => p.id !== packId);
  updateUI(gameState);
  renderShop(gameState, buyJoker, buyPack, choosePackCard);
}

function openDiscardJokerModal(pending) {
  gameState.pendingJoker = pending;
  const incomingJoker = LEGENDARY_SHOP.find(j => j.id === pending.jokerId);
  renderDiscardJokerChoice(gameState.jokers, incomingJoker, confirmDiscardJoker);
  openModal('discardJokerModal');
}

function confirmDiscardJoker(oldJokerId) {
  const pending = gameState.pendingJoker;
  if (!pending) return;
  const newJoker = LEGENDARY_SHOP.find(j => j.id === pending.jokerId);
  if (!newJoker) return;

  gameState.jokers = gameState.jokers.filter(j => j.id !== oldJokerId);

  if (pending.type === 'shop') {
    gameState.money -= newJoker.cost;
  } else if (pending.type === 'pack') {
    gameState.shopPacks = gameState.shopPacks.filter(p => p.id !== pending.packId);
  }

  gameState.jokers.push(newJoker);
  gameState.pendingJoker = null;

  renderJokers(gameState.jokers);
  updateUI(gameState);
  renderShop(gameState, buyJoker, buyPack, choosePackCard);
  closeModal('discardJokerModal');
}

// Cancela el intento de compra/sobre sin quitar ningún Comodín ni cobrar nada.
function cancelDiscardJoker() {
  gameState.pendingJoker = null;
  closeModal('discardJokerModal');
}

function advanceRound() {
  gameState.round++;
  gameState.targetScore = Math.floor(gameState.targetScore * TARGET_GROWTH);
  gameState.currentScore = 0;
  gameState.handsLeft = handsForRound(gameState.round);
  gameState.discardsLeft = discardsForRound(gameState.round);
  gameState.shopOffers = [];
  gameState.shopPacks = [];
  createDeck();
  gameState.hand = [];
  drawHand(8);
  updateUI(gameState);
  refreshHandUI();
  document.getElementById('playBtn').disabled = false;
  document.getElementById('discardBtn').disabled = false;
}

function nextRoundFromShop() {
  closeModal('shopModal');
  advanceRound();
}

function setupEventListeners() {
  document.getElementById('playBtn').onclick = playHand;
  document.getElementById('discardBtn').onclick = discardCards;

  document.getElementById('sortSuitBtn').onclick = sortHandBySuit;
  document.getElementById('sortValueBtn').onclick = sortHandByValue;

  document.getElementById('openHandsBtn').onclick = () => openModal('handsModal');
  document.getElementById('closeHandsBtn').onclick = () => closeModal('handsModal');
  document.getElementById('confirmHandsBtn').onclick = () => closeModal('handsModal');

  document.getElementById('openJokersInfoBtn').onclick = () => {
    renderJokersModalInfo(gameState.jokers);
    openModal('jokersInfoModal');
  };
  document.getElementById('closeJokersInfoBtn').onclick = () => closeModal('jokersInfoModal');
  document.getElementById('confirmJokersInfoBtn').onclick = () => closeModal('jokersInfoModal');

  document.getElementById('openAllJokersBtn').onclick = () => {
    renderAllJokersCatalog(gameState.jokers.map(j => j.id));
    openModal('allJokersModal');
  };
  document.getElementById('closeAllJokersBtn').onclick = () => closeModal('allJokersModal');
  document.getElementById('confirmAllJokersBtn').onclick = () => closeModal('allJokersModal');

  document.getElementById('cancelDiscardJokerBtn').onclick = cancelDiscardJoker;

  document.getElementById('nextRoundBtn').onclick = nextRoundFromShop;
  document.getElementById('playAgainBtn').onclick = () => location.reload();

  const musicBtn = document.getElementById('musicToggleBtn');
  musicBtn.onclick = () => {
    const playing = toggleMusic();
    musicBtn.innerText = playing ? '🔊' : '🔈';
  };
}

window.addEventListener('DOMContentLoaded', initGame);
