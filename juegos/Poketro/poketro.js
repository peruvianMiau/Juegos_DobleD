import { POKEMON_DECK, JOKERS_BASE } from './modules/pokemonData.js';
import { calculateScore } from './modules/scoring.js';
import { UI } from './modules/ui.js';

class PokemonBalatroGame {
  constructor() {
    this.ui = new UI();
    this.deck = [];
    this.hand = [];
    this.selectedCards = [];
    this.activeItems = [...JOKERS_BASE];
    this.targetScore = 300;
    this.currentScore = 0;
    this.handsLeft = 4;
    this.discardsLeft = 3;

    this.initEvents();
    this.startNewRun();
  }

  startNewRun() {
    this.deck = [...POKEMON_DECK, ...POKEMON_DECK, ...POKEMON_DECK];
    this.shuffleDeck();
    this.hand = [];
    this.selectedCards = [];
    this.currentScore = 0;
    this.handsLeft = 4;
    this.discardsLeft = 3;

    this.drawHand(8);
    this.updateUI();
  }

  shuffleDeck() {
    this.deck.sort(() => Math.random() - 0.5);
  }

  drawHand(count) {
    while (this.hand.length < count && this.deck.length > 0) {
      this.hand.push(this.deck.pop());
    }
  }

  toggleSelectCard(card) {
    const index = this.selectedCards.indexOf(card);
    if (index > -1) {
      this.selectedCards.splice(index, 1);
    } else {
      // Garantizar un máximo de 5 cartas seleccionadas
      if (this.selectedCards.length < 5) {
        this.selectedCards.push(card);
      }
    }
    this.updateUI();
  }

  playHand() {
    if (this.selectedCards.length === 0 || this.selectedCards.length > 5 || this.handsLeft <= 0) return;

    const result = calculateScore(this.selectedCards, this.activeItems);
    this.currentScore += result.totalScore;
    this.handsLeft--;

    this.hand = this.hand.filter(c => !this.selectedCards.includes(c));
    this.selectedCards = [];
    this.drawHand(8);

    this.updateUI();
    this.checkGameState();
  }

  discard() {
    if (this.discardsLeft <= 0 || this.selectedCards.length === 0 || this.selectedCards.length > 5) return;

    this.hand = this.hand.filter(c => !this.selectedCards.includes(c));
    this.selectedCards = [];
    this.discardsLeft--;
    this.drawHand(8);

    this.updateUI();
  }

  checkGameState() {
    if (this.currentScore >= this.targetScore) {
      setTimeout(() => {
        alert(`¡Gimnasio Vencido! Puntos totales: ${this.currentScore}. Siguiente nivel.`);
        this.targetScore = Math.floor(this.targetScore * 1.8);
        this.startNewRun();
      }, 200);
    } else if (this.handsLeft === 0) {
      setTimeout(() => {
        alert("¡Has quedado sin manos disponibles! Juego terminado.");
        this.targetScore = 300;
        this.startNewRun();
      }, 200);
    }
  }

  updateUI() {
    this.ui.renderState({
      targetScore: this.targetScore,
      currentScore: this.currentScore,
      handsLeft: this.handsLeft,
      discardsLeft: this.discardsLeft,
      activeItems: this.activeItems,
      selectedCount: this.selectedCards.length
    });

    this.ui.renderHand(this.hand, this.selectedCards, (card) => this.toggleSelectCard(card));

    const currentEval = calculateScore(this.selectedCards, this.activeItems);
    this.ui.renderPreviewScore(currentEval);
  }

  initEvents() {
    document.getElementById('play-btn').addEventListener('click', () => this.playHand());
    document.getElementById('discard-btn').addEventListener('click', () => this.discard());

    // Modal de Combos
    const modal = document.getElementById('combos-modal');
    document.getElementById('btn-show-combos').addEventListener('click', () => modal.classList.remove('hidden'));
    document.getElementById('close-combos-modal').addEventListener('click', () => modal.classList.add('hidden'));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new PokemonBalatroGame();
});