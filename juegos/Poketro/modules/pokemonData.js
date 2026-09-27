// "value" = valor en fichas al puntuar (igual que en Póker: J/Q/K valen 10, As vale 11).
// "rankOrder" = orden real de rango 2..14, usado SOLO para detectar escaleras.
// (Antes no existía este campo y J/Q/K compartían value=10, por lo que una escalera
// que incluyera figuras nunca se podía detectar correctamente.)
export const POKEMON_DATA = [
  { name: "Pichu", value: 2, valStr: "2", rankOrder: 2, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/172.png" },
  { name: "Charmander", value: 3, valStr: "3", rankOrder: 3, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png" },
  { name: "Squirtle", value: 4, valStr: "4", rankOrder: 4, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png" },
  { name: "Bulbasaur", value: 5, valStr: "5", rankOrder: 5, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png" },
  { name: "Eevee", value: 6, valStr: "6", rankOrder: 6, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png" },
  { name: "Jigglypuff", value: 7, valStr: "7", rankOrder: 7, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png" },
  { name: "Meowth", value: 8, valStr: "8", rankOrder: 8, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png" },
  { name: "Psyduck", value: 9, valStr: "9", rankOrder: 9, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png" },
  { name: "Pikachu", value: 10, valStr: "10", rankOrder: 10, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" },
  { name: "Lucario", value: 10, valStr: "J", rankOrder: 11, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/448.png" },
  { name: "Gardevoir", value: 10, valStr: "Q", rankOrder: 12, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/282.png" },
  { name: "Charizard", value: 10, valStr: "K", rankOrder: 13, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" },
  { name: "Mew", value: 11, valStr: "A", rankOrder: 14, img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png" }
];

export const SUITS = ['🔥', '💧', '🌿', '⚡'];

// --- Comodines Legendarios estilo Balatro ---
// Cada joker tiene un "type" que define CUÁNDO aporta su bono, igual que en el juego original:
//   'flat'     -> siempre suma (comodines "base", pocos y económicos).
//   'handtype' -> solo suma si la mano jugada es una de las indicadas en "hands".
//   'xmult'    -> multiplica el Mult total (después de sumas) si la mano jugada coincide con "hands".
//   'suit'     -> suma por CADA carta jugada de un tipo (palo) concreto.
//   'perCard'  -> suma por CADA carta que puntúa con un nombre de Pokémon concreto.
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
  }
];

// Ejemplos con datos estructurados (nombre + palo) para poder mostrar sprites reales
// en el modal de combinaciones, en vez de solo texto.
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
