export function evaluateHand(selectedIndices, hand, jokers) {
  if (selectedIndices.length === 0) return null;

  const selectedCards = selectedIndices.map(i => ({ card: hand[i], originalIndex: i }));

  const counts = {};
  selectedCards.forEach(item => {
    const key = item.card.name;
    counts[key] = (counts[key] || []);
    counts[key].push(item.originalIndex);
  });

  const countValues = Object.values(counts);
  let scoringIndices = [];
  let handName = "Carta Alta";
  let baseChips = 5;
  let baseMult = 1;

  const fourGroup = countValues.find(arr => arr.length === 4);
  if (fourGroup) {
    handName = "Poker";
    baseChips = 60; baseMult = 7;
    scoringIndices = fourGroup;
  } else {
    const threeGroup = countValues.find(arr => arr.length === 3);
    const pairGroups = countValues.filter(arr => arr.length === 2);

    if (threeGroup && pairGroups.length >= 1) {
      handName = "Full House";
      baseChips = 40; baseMult = 4;
      scoringIndices = [...threeGroup, ...pairGroups[0]];
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
      let highest = selectedCards[0];
      selectedCards.forEach(item => {
        if (item.card.value > highest.card.value) highest = item;
      });
      scoringIndices = [highest.originalIndex];
    }
  }

  let cardsChipsValue = 0;
  scoringIndices.forEach(idx => {
    cardsChipsValue += hand[idx].value;
  });

  let jokerMult = 0;
  let jokerChips = 0;
  jokers.forEach(j => {
    jokerMult += j.mult;
    jokerChips += j.chips;
  });

  const totalChips = baseChips + cardsChipsValue + jokerChips;
  const totalMult = baseMult + jokerMult;

  return {
    handName,
    totalChips,
    totalMult,
    scoringIndices,
    estimatedTotal: totalChips * totalMult
  };
}