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
  closeModal
} from './modules/ui.js';

let gameState = {
  round: 1,
  targetScore: 300,
  currentScore: 0,
  money: 4,
  handsLeft: 4,
  discardsLeft: 3,
  deck: [],
  hand: [],
  selectedIndices: [],
  jokers: []
};

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
}

function playHand() {
  if (gameState.selectedIndices.length === 0 || gameState.handsLeft <= 0) return;

  const evalRes = evaluateHand(gameState.selectedIndices, gameState.hand, gameState.jokers);
  gameState.currentScore += evalRes.estimatedTotal;
  gameState.handsLeft--;

  gameState.selectedIndices.sort((a, b) => b - a).forEach(idx => {
    gameState.hand.splice(idx, 1);
  });
  gameState.selectedIndices = [];

  drawHand(8);
  updateUI(gameState);
  refreshHandUI();

  if (gameState.currentScore >= gameState.targetScore) {
    setTimeout(() => openShopModal(), 500);
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

function openShopModal() {
  gameState.money += 4;
  updateUI(gameState);
  renderShop(gameState, buyJoker);
  openModal('shopModal');
}

function buyJoker(jokerId) {
  const joker = LEGENDARY_SHOP.find(j => j.id === jokerId);
  if (joker && gameState.money >= joker.cost) {
    gameState.money -= joker.cost;
    gameState.jokers.push(joker);
    renderJokers(gameState.jokers);
    updateUI(gameState);
    renderShop(gameState, buyJoker);
  }
}

function nextRoundFromShop() {
  closeModal('shopModal');
  gameState.round++;
  gameState.targetScore = Math.floor(gameState.targetScore * 1.8);
  gameState.currentScore = 0;
  gameState.handsLeft = 4;
  gameState.discardsLeft = 3;
  createDeck();
  gameState.hand = [];
  drawHand(8);
  updateUI(gameState);
  refreshHandUI();
}

function resetGame() {
  gameState = {
    round: 1,
    targetScore: 300,
    currentScore: 0,
    money: 4,
    handsLeft: 4,
    discardsLeft: 3,
    deck: [],
    hand: [],
    selectedIndices: [],
    jokers: []
  };
  initGame();
}

function setupEventListeners() {
  document.getElementById('playBtn').onclick = playHand;
  document.getElementById('discardBtn').onclick = discardCards;

  document.getElementById('openRulesBtn').onclick = () => openModal('rulesModal');
  document.getElementById('closeRulesBtn').onclick = () => closeModal('rulesModal');
  document.getElementById('confirmRulesBtn').onclick = () => closeModal('rulesModal');

  document.getElementById('openHandsBtn').onclick = () => openModal('handsModal');
  document.getElementById('closeHandsBtn').onclick = () => closeModal('handsModal');
  document.getElementById('confirmHandsBtn').onclick = () => closeModal('handsModal');

  document.getElementById('nextRoundBtn').onclick = nextRoundFromShop;
}

window.addEventListener('DOMContentLoaded', initGame);