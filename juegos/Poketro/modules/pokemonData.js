export const POKEMON_DATA = [
  { name: "Pichu", value: 2, valStr: "2", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/172.png" },
  { name: "Charmander", value: 3, valStr: "3", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png" },
  { name: "Squirtle", value: 4, valStr: "4", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png" },
  { name: "Bulbasaur", value: 5, valStr: "5", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png" },
  { name: "Eevee", value: 6, valStr: "6", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png" },
  { name: "Jigglypuff", value: 7, valStr: "7", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png" },
  { name: "Meowth", value: 8, valStr: "8", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png" },
  { name: "Psyduck", value: 9, valStr: "9", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png" },
  { name: "Pikachu", value: 10, valStr: "10", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" },
  { name: "Lucario", value: 11, valStr: "J", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/448.png" },
  { name: "Gardevoir", value: 12, valStr: "Q", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/282.png" },
  { name: "Charizard", value: 13, valStr: "K", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" },
  { name: "Mew", value: 14, valStr: "A", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png" }
];

export const SUITS = ['🔥', '💧', '🌿', '⚡'];

export const MAX_JOKERS = 5;

export const LEGENDARY_SHOP = [
  {
    id: 'mewtwo', name: 'Mewtwo', cost: 6,
    type: 'flat', mult: 4, chips: 0,
    desc: '+4 Mult en CUALQUIER mano jugada',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png'
  },
  {
    id: 'suicune', name: 'Suicune', cost: 5,
    type: 'flat', mult: 0, chips: 15,
    desc: '+15 Fichas en CUALQUIER mano jugada',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/245.png'
  },
  {
    id: 'rayquaza', name: 'Rayquaza', cost: 8,
    type: 'handtype', hands: ['Poker', 'Escalera de Color'], mult: 0, chips: 80,
    desc: '+80 Fichas si juegas Póker (4 iguales) o Escalera de Color',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png'
  },
  {
    id: 'zapdos', name: 'Zapdos', cost: 6,
    type: 'suit', suit: '⚡', mult: 1, chips: 8,
    desc: '+8 Fichas y +1 Mult por CADA carta ⚡ Eléctrico jugada',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/145.png'
  },
  {
    id: 'articuno', name: 'Articuno', cost: 6,
    type: 'handtype', hands: ['Color', 'Escalera de Color'], mult: 0, chips: 45,
    desc: '+45 Fichas si juegas Color (Flush)',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/144.png'
  },
  {
    id: 'moltres', name: 'Moltres', cost: 5,
    type: 'suit', suit: '🔥', mult: 0, chips: 7,
    desc: '+7 Fichas por CADA carta 🔥 Fuego jugada',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/146.png'
  },
  {
    id: 'suicune-mistico', name: 'Suicune Místico', cost: 7,
    type: 'handtype', hands: ['Escalera', 'Escalera de Color'], mult: 5, chips: 0,
    desc: '+5 Mult si juegas Escalera (Straight)',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/245.png'
  },
  {
    id: 'entei', name: 'Entei', cost: 7,
    type: 'handtype', hands: ['Trío', 'Full House', 'Poker'], mult: 0, chips: 50,
    desc: '+50 Fichas si juegas Trío o una mano mejor (Full House / Póker)',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/244.png'
  },
  {
    id: 'raikou', name: 'Raikou', cost: 6,
    type: 'perCard', nameMatch: 'Pikachu', mult: 0, chips: 14,
    desc: '+14 Fichas por CADA Pikachu que puntúe en la mano',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/243.png'
  },
  {
    id: 'lugia', name: 'Lugia', cost: 10,
    type: 'xmult', hands: ['Poker', 'Escalera de Color'], xmult: 2,
    desc: 'Multiplica el Mult ×2 si juegas Póker o Escalera de Color',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/249.png'
  },
  {
    id: 'hooh', name: 'Ho-Oh', cost: 9,
    type: 'xmult', hands: ['Full House', 'Color', 'Escalera'], xmult: 1.5,
    desc: 'Multiplica el Mult ×1.5 si juegas Full House, Color o Escalera',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/250.png'
  },
  {
    id: 'mew-joker', name: 'Mew', cost: 8,
    type: 'perCard', nameMatch: 'Mew', mult: 0, chips: 20,
    desc: '+20 Fichas por CADA Mew (As) que puntúe en la mano',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png'
  },
  {
    id: 'vaporeon', name: 'Vaporeon', cost: 6,
    type: 'suit', suit: '💧', mult: 0, chips: 8,
    desc: '+8 Fichas por CADA carta 💧 Agua jugada',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/134.png'
  },
  {
    id: 'venusaur', name: 'Venusaur', cost: 6,
    type: 'suit', suit: '🌿', mult: 0, chips: 8,
    desc: '+8 Fichas por CADA carta 🌿 Planta jugada',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png'
  },
  // --- Comodines de gama alta: caros, pero con un impacto enorme (pensados para la tienda de cada 3 rondas) ---
  {
    id: 'giratina', name: 'Giratina', cost: 13,
    type: 'xmult', hands: ['Escalera de Color'], xmult: 3,
    desc: 'Multiplica el Mult ×3 si juegas la rarísima Escalera de Color',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/487.png'
  },
  {
    id: 'dialga', name: 'Dialga', cost: 12,
    type: 'handtype', hands: ['Full House', 'Poker', 'Escalera de Color'], mult: 0, chips: 120,
    desc: '+120 Fichas si juegas Full House, Póker o Escalera de Color',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/483.png'
  },
  {
    id: 'arceus', name: 'Arceus', cost: 16,
    type: 'flat', mult: 6, chips: 0,
    desc: 'El más caro y poderoso: +6 Mult en CUALQUIER mano jugada',
    img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/493.png'
  }
];

export function getJokerRarity(cost) {
  if (cost >= 13) return 'legendary';
  if (cost >= 10) return 'epic';
  if (cost >= 7) return 'rare';
  return 'common';
}

export const POKER_HANDS_INFO = [
  {
    name: "Escalera de Color (Straight Flush)", chips: 100, mult: 8,
    example: [
      { name: "Meowth", suit: "🔥" }, { name: "Psyduck", suit: "🔥" }, { name: "Pikachu", suit: "🔥" },
      { name: "Lucario", suit: "🔥" }, { name: "Gardevoir", suit: "🔥" }
    ]
  },
  {
    name: "Póker (Four of a Kind)", chips: 60, mult: 7,
    example: [
      { name: "Pikachu", suit: "🔥" }, { name: "Pikachu", suit: "💧" },
      { name: "Pikachu", suit: "🌿" }, { name: "Pikachu", suit: "⚡" }
    ]
  },
  {
    name: "Full House", chips: 40, mult: 4,
    example: [
      { name: "Pikachu", suit: "🔥" }, { name: "Pikachu", suit: "💧" }, { name: "Pikachu", suit: "🌿" },
      { name: "Eevee", suit: "🔥" }, { name: "Eevee", suit: "💧" }
    ]
  },
  {
    name: "Color (Flush)", chips: 35, mult: 4,
    example: [
      { name: "Charmander", suit: "🔥" }, { name: "Bulbasaur", suit: "🔥" }, { name: "Pikachu", suit: "🔥" },
      { name: "Mew", suit: "🔥" }, { name: "Pichu", suit: "🔥" }
    ]
  },
  {
    name: "Escalera (Straight)", chips: 30, mult: 4,
    example: [
      { name: "Pichu", suit: "🔥" }, { name: "Charmander", suit: "💧" }, { name: "Squirtle", suit: "🌿" },
      { name: "Bulbasaur", suit: "⚡" }, { name: "Eevee", suit: "🔥" }
    ]
  },
  {
    name: "Trío (Three of a Kind)", chips: 30, mult: 3,
    example: [
      { name: "Pikachu", suit: "🔥" }, { name: "Pikachu", suit: "💧" }, { name: "Pikachu", suit: "🌿" }
    ]
  },
  {
    name: "Doble Pareja (Two Pair)", chips: 20, mult: 2,
    example: [
      { name: "Pikachu", suit: "🔥" }, { name: "Pikachu", suit: "💧" },
      { name: "Eevee", suit: "🌿" }, { name: "Eevee", suit: "⚡" }
    ]
  },
  {
    name: "Pareja (Pair)", chips: 10, mult: 2,
    example: [
      { name: "Pikachu", suit: "🔥" }, { name: "Pikachu", suit: "💧" }
    ]
  },
  {
    name: "Carta Alta (High Card)", chips: 5, mult: 1,
    example: [
      { name: "Charizard", suit: "🔥" }
    ]
  }
];
