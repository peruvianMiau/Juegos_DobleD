export function evaluateHand(selectedIndices, hand, jokers) {
  if (!selectedIndices || selectedIndices.length === 0) return null;

  const selectedCards = selectedIndices.map(i => ({ card: hand[i], originalIndex: i }));

  // Agrupa por nombre de Pokémon: cada nombre distinto representa un rango de carta
  // (ej. todos los "Pikachu" son el mismo rango, sin importar el palo).
  const counts = {};
  selectedCards.forEach(item => {
    const key = item.card.name;
    counts[key] = counts[key] || [];
    counts[key].push(item.originalIndex);
  });
  const countValues = Object.values(counts);

  // --- Color (mismo palo) ---
  const isFlush = selectedCards.length === 5 &&
    selectedCards.every(c => c.card.suit === selectedCards[0].card.suit);

  // --- Escalera (5 rangos consecutivos, usando rankOrder para que J/Q/K/A funcionen bien) ---
  const uniqueRanks = [...new Set(selectedCards.map(c => c.card.rankOrder))].sort((a, b) => a - b);
  const isStraight = selectedCards.length === 5 &&
    uniqueRanks.length === 5 &&
    (uniqueRanks[4] - uniqueRanks[0] === 4);

  const fourGroup = countValues.find(arr => arr.length === 4);
  const threeGroup = countValues.find(arr => arr.length === 3);
  const pairGroups = countValues.filter(arr => arr.length === 2);

  let handName, baseChips, baseMult, scoringIndices;

  if (isStraight && isFlush) {
    handName = "Escalera de Color";
    baseChips = 100; baseMult = 8;
    scoringIndices = selectedCards.map(c => c.originalIndex);
  } else if (fourGroup) {
    handName = "Poker";
    baseChips = 60; baseMult = 7;
    scoringIndices = fourGroup;
  } else if (threeGroup && pairGroups.length >= 1) {
    handName = "Full House";
    baseChips = 40; baseMult = 4;
    scoringIndices = [...threeGroup, ...pairGroups[0]];
  } else if (isFlush) {
    handName = "Color";
    baseChips = 35; baseMult = 4;
    scoringIndices = selectedCards.map(c => c.originalIndex);
  } else if (isStraight) {
    handName = "Escalera";
    baseChips = 30; baseMult = 4;
    scoringIndices = selectedCards.map(c => c.originalIndex);
  } else if (threeGroup) {
    handName = "Trío";
    baseChips = 30; baseMult = 3;
    scoringIndices = threeGroup;
  } else if (pairGroups.length >= 2) {
    handName = "Doble Pareja";
    baseChips = 20; baseMult = 2;
    scoringIndices = [...pairGroups[0], ...pairGroups[1]];
  } else if (pairGroups.length === 1) {
    handName = "Pareja";
    baseChips = 10; baseMult = 2;
    scoringIndices = pairGroups[0];
  } else {
    handName = "Carta Alta";
    baseChips = 5; baseMult = 1;
    let highest = selectedCards[0];
    selectedCards.forEach(item => { if (item.card.value > highest.card.value) highest = item; });
    scoringIndices = [highest.originalIndex];
  }

  let cardsChipsValue = 0;
  scoringIndices.forEach(idx => { cardsChipsValue += hand[idx].value; });

  const baseChipsTotal = baseChips + cardsChipsValue;

  // --- Comodines: cada uno aporta SOLO si se cumple su condición (como en Balatro) ---
  let addChips = 0;
  let addMult = 0;
  let xMultTotal = 1;

  const jokerResults = (jokers || []).map(j => {
    let chips = 0, mult = 0, xmult = 1, triggered = false;

    switch (j.type) {
      case 'flat':
        chips = j.chips || 0;
        mult = j.mult || 0;
        triggered = true;
        break;

      case 'handtype':
        if (j.hands && j.hands.includes(handName)) {
          chips = j.chips || 0;
          mult = j.mult || 0;
          triggered = true;
        }
        break;

      case 'xmult':
        if (j.hands && j.hands.includes(handName)) {
          xmult = j.xmult || 1;
          triggered = true;
        }
        break;

      case 'suit': {
        const n = selectedCards.filter(c => c.card.suit === j.suit).length;
        if (n > 0) {
          chips = (j.chips || 0) * n;
          mult = (j.mult || 0) * n;
          triggered = true;
        }
        break;
      }

      case 'perCard': {
        const n = scoringIndices.filter(idx => hand[idx].name === j.nameMatch).length;
        if (n > 0) {
          chips = (j.chips || 0) * n;
          mult = (j.mult || 0) * n;
          triggered = true;
        }
        break;
      }
    }

    addChips += chips;
    addMult += mult;
    xMultTotal *= xmult;

    return { id: j.id, triggered, chips, mult, xmult };
  });

  const totalChips = baseChipsTotal + addChips;
  const totalMult = (baseMult + addMult) * xMultTotal;

  return {
    handName,
    baseChips: baseChipsTotal,
    baseMult,
    totalChips,
    totalMult,
    scoringIndices,
    jokerResults,
    estimatedTotal: Math.round(totalChips * totalMult)
  };
}
