export class UI {
  constructor() {
    this.targetScoreEl = document.getElementById('target-score');
    this.currentScoreEl = document.getElementById('current-score');
    this.handsLeftEl = document.getElementById('hands-left');
    this.discardsLeftEl = document.getElementById('discards-left');
    this.playerHandEl = document.getElementById('player-hand');
    this.jokersListEl = document.getElementById('jokers-list');
    this.handTypeTagEl = document.getElementById('hand-type-tag');
    this.selectedCountEl = document.getElementById('selected-count');

    this.calcChipsEl = document.getElementById('calc-chips');
    this.calcMultEl = document.getElementById('calc-mult');
    this.calcTotalEl = document.getElementById('calc-total');
  }

  renderState(state) {
    this.targetScoreEl.textContent = state.targetScore;
    this.currentScoreEl.textContent = state.currentScore;
    this.handsLeftEl.textContent = state.handsLeft;
    this.discardsLeftEl.textContent = state.discardsLeft;
    if (this.selectedCountEl) {
      this.selectedCountEl.textContent = state.selectedCount;
    }

    this.renderJokers(state.activeItems);
  }

  renderHand(hand, selectedCards, onSelectCard) {
    this.playerHandEl.innerHTML = '';
    hand.forEach(card => {
      const cardEl = this.createCardDOM(card);
      if (selectedCards.includes(card)) {
        cardEl.classList.add('selected');
      }
      cardEl.addEventListener('click', () => onSelectCard(card));
      this.playerHandEl.appendChild(cardEl);
    });
  }

  renderJokers(items) {
    this.jokersListEl.innerHTML = '';
    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'item-card';
      itemEl.innerHTML = `
        <div class="item-name">${item.name}</div>
        <div>${item.desc}</div>
      `;
      this.jokersListEl.appendChild(itemEl);
    });
  }

  renderPreviewScore(evalResult) {
    this.calcChipsEl.textContent = evalResult.chips;
    this.calcMultEl.textContent = evalResult.mult;
    this.calcTotalEl.textContent = evalResult.totalScore;
    this.handTypeTagEl.textContent = `Formación: ${evalResult.comboName}`;
  }

  createCardDOM(card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';

    const typeClass = `type-${card.type.toLowerCase()}`;

    cardEl.innerHTML = `
      <span class="card-type ${typeClass}">${card.type}</span>
      <img src="${card.sprite}" alt="${card.name}" />
      <span class="card-name">${card.name}</span>
      <span class="card-stats">+${card.power} / x${card.mult}</span>
    `;

    return cardEl;
  }
}