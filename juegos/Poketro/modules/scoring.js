import { COMBOS } from './pokemonData.js';

export function calculateScore(selectedCards, itemsActive) {
  if (selectedCards.length === 0) {
    return { comboName: "Ninguno", chips: 0, mult: 0, totalScore: 0 };
  }

  // 1. Sumar poder base de las cartas seleccionadas
  let cardChips = selectedCards.reduce((acc, c) => acc + c.power, 0);
  let cardMult = selectedCards.reduce((acc, c) => acc + c.mult, 0);

  // 2. Detectar combo
  const combo = detectCombo(selectedCards);

  let chips = cardChips + combo.baseChips;
  let mult = cardMult + combo.baseMult;

  // 3. Aplicar bonificadores de Comodines / Ítems
  itemsActive.forEach(item => {
    if (item.bonusType === 'chips') chips += item.value;
    if (item.bonusType === 'mult') mult += item.value;
    if (item.bonusType === 'xMult') mult *= item.value;
  });

  const totalScore = chips * mult;

  return {
    comboName: combo.name,
    chips,
    mult,
    totalScore
  };
}

function detectCombo(cards) {
  const typeCounts = {};
  cards.forEach(c => {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  });

  const maxSameType = Math.max(...Object.values(typeCounts));

  if (cards.length >= 5 && maxSameType === 5) return COMBOS.FLUSH_TIPO;
  if (maxSameType >= 3) return COMBOS.TRIO_ELEMENTAL;
  if (maxSameType >= 2) return COMBOS.MONOTIPO;
  
  return COMBOS.CARTA_ALTA;
}
