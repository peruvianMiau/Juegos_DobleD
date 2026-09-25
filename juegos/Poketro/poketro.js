import { POKEMON_DATA, SUITS, LEGENDARY_SHOP } from './modules/pokemonData.js';
import { evaluateHand } from './modules/scoring.js';
import {
  updateUI,
  renderHand,
  renderJokers,
  updateEvaluatorUI,
  renderHandsModalInfo,
  renderShop,
  openModal,
  closeModal,
  showPlayResult,
  hidePlayResult
} from './modules/ui.js';
import { toggleMusic } from './modules/audio.js';

function freshState() {
  return {
    round: 1,
    targetScore: 300,
    currentScore: 0,
    money: 4,
    handsLeft: 4,
    discardsLeft: 3,
    deck: [],
    hand: [],
    selectedIndices: [],
    jokers: [],
    shopOffers: [],
    shopPacks: []
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
        rankOrder: poke.rankOrder,
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

// --- Ordenar mano ---
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

  // Bloquea los controles mientras se muestra la animación de la mano jugada
  document.getElementById('playBtn').disabled = true;
  document.getElementById('discardBtn').disabled = true;

  showPlayResult(cardsPlayed, evalRes, gameState.jokers);

  // Le damos tiempo extra a la animación si hay Comodines que saltan y aportan puntos
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
    setTimeout(() => openShopModal(), 400);
  } else if (gameState.handsLeft <= 0) {
    alert("¡Te has quedado sin manos! Juego terminado.");
    resetGame();
  }
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

// --- Tienda estilo Balatro: ofertas directas + sobres con elección ---
function generateShopInventory() {
  const ownedIds = gameState.jokers.map(j => j.id);
  const available = LEGENDARY_SHOP.filter(j => !ownedIds.includes(j.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);

  gameState.shopOffers = shuffled.slice(0, 3).map(j => j.id);

  const packPool = shuffled.length >= 2 ? shuffled : available;
  gameState.shopPacks = [0, 1].map((_, idx) => {
    const packShuffled = [...packPool].sort(() => Math.random() - 0.5);
    const candidates = packShuffled.slice(0, 2).map(j => j.id);
    return {
      id: `pack-${idx}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cost: 4,
      opened: false,
      candidates
    };
  }).filter(pack => pack.candidates.length > 0);
}

function openShopModal() {
  gameState.money += 4;
  generateShopInventory();
  updateUI(gameState);
  renderShop(gameState, buyJoker, buyPack, choosePackCard);
  openModal('shopModal');
}

function buyJoker(jokerId) {
  const joker = LEGENDARY_SHOP.find(j => j.id === jokerId);
  if (joker && gameState.money >= joker.cost && !gameState.jokers.some(j => j.id === joker.id)) {
    gameState.money -= joker.cost;
    gameState.jokers.push(joker);
    renderJokers(gameState.jokers);
    updateUI(gameState);
    renderShop(gameState, buyJoker, buyPack, choosePackCard);
  }
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
  if (joker && !gameState.jokers.some(j => j.id === joker.id)) {
    gameState.jokers.push(joker);
    renderJokers(gameState.jokers);
  }
  gameState.shopPacks = gameState.shopPacks.filter(p => p.id !== packId);
  updateUI(gameState);
  renderShop(gameState, buyJoker, buyPack, choosePackCard);
}

function nextRoundFromShop() {
  closeModal('shopModal');
  gameState.round++;
  gameState.targetScore = Math.floor(gameState.targetScore * 1.8);
  gameState.currentScore = 0;
  gameState.handsLeft = 4;
  gameState.discardsLeft = 3;
  gameState.shopOffers = [];
  gameState.shopPacks = [];
  createDeck();
  gameState.hand = [];
  drawHand(8);
  updateUI(gameState);
  refreshHandUI();
}

function resetGame() {
  gameState = freshState();
  initGame();
}

function setupEventListeners() {
  document.getElementById('playBtn').onclick = playHand;
  document.getElementById('discardBtn').onclick = discardCards;

  document.getElementById('sortSuitBtn').onclick = sortHandBySuit;
  document.getElementById('sortValueBtn').onclick = sortHandByValue;

  document.getElementById('openHandsBtn').onclick = () => openModal('handsModal');
  document.getElementById('closeHandsBtn').onclick = () => closeModal('handsModal');
  document.getElementById('confirmHandsBtn').onclick = () => closeModal('handsModal');

  document.getElementById('nextRoundBtn').onclick = nextRoundFromShop;

  const musicBtn = document.getElementById('musicToggleBtn');
  musicBtn.onclick = () => {
    const playing = toggleMusic();
    musicBtn.innerText = playing ? '🔊' : '🔈';
  };
}

window.addEventListener('DOMContentLoaded', initGame);
