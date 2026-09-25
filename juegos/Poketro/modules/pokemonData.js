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
  { name: "Lucario", value: 10, valStr: "J", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/448.png" },
  { name: "Gardevoir", value: 10, valStr: "Q", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/282.png" },
  { name: "Charizard", value: 10, valStr: "K", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" },
  { name: "Mew", value: 11, valStr: "A", img: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/151.png" }
];

export const SUITS = ['🔥', '💧', '🌿', '⚡'];

export const LEGENDARY_SHOP = [
  { id: 'mewtwo', name: 'Mewtwo', cost: 6, mult: 4, chips: 0, desc: '+4 Mult a todas las manos', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png' },
  { id: 'rayquaza', name: 'Rayquaza', cost: 8, mult: 0, chips: 60, desc: '+60 Fichas en cada mano', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/384.png' },
  { id: 'zapdos', name: 'Zapdos', cost: 5, mult: 3, chips: 20, desc: '+20 Fichas y +3 Mult', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/145.png' },
  { id: 'articuno', name: 'Articuno', cost: 5, mult: 0, chips: 25, desc: '+25 Fichas en cada mano', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/144.png' },
  { id: 'moltres', name: 'Moltres', cost: 5, mult: 2, chips: 10, desc: '+10 Fichas y +2 Mult', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/146.png' },
  { id: 'suicune', name: 'Suicune', cost: 6, mult: 3, chips: 0, desc: '+3 Mult a todas las manos', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/245.png' },
  { id: 'entei', name: 'Entei', cost: 7, mult: 0, chips: 45, desc: '+45 Fichas en cada mano', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/244.png' },
  { id: 'raikou', name: 'Raikou', cost: 6, mult: 2, chips: 15, desc: '+15 Fichas y +2 Mult', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/243.png' },
  { id: 'lugia', name: 'Lugia', cost: 9, mult: 5, chips: 0, desc: '+5 Mult a todas las manos', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/249.png' },
  { id: 'hooh', name: 'Ho-Oh', cost: 9, mult: 0, chips: 70, desc: '+70 Fichas en cada mano', img: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/250.png' }
];

export const POKER_HANDS_INFO = [
  { name: "Poker (Four of a Kind)", chips: 60, mult: 7, example: ["Pikachu", "Pikachu", "Pikachu", "Pikachu"] },
  { name: "Full House", chips: 40, mult: 4, example: ["Pikachu", "Pikachu", "Pikachu", "Eevee", "Eevee"] },
  { name: "Color (Flush)", chips: 35, mult: 4, example: ["Charmander 🔥", "Bulbasaur 🔥", "Pikachu 🔥", "Mew 🔥", "Pichu 🔥"] },
  { name: "Escalera (Straight)", chips: 30, mult: 4, example: ["Pichu (2)", "Charmander (3)", "Squirtle (4)", "Bulbasaur (5)", "Eevee (6)"] },
  { name: "Trío (Three of a Kind)", chips: 30, mult: 3, example: ["Pikachu", "Pikachu", "Pikachu"] },
  { name: "Doble Pareja (Two Pair)", chips: 20, mult: 2, example: ["Pikachu", "Pikachu", "Eevee", "Eevee"] },
  { name: "Pareja (Pair)", chips: 10, mult: 2, example: ["Pikachu", "Pikachu"] },
  { name: "Carta Alta (High Card)", chips: 5, mult: 1, example: ["Charizard"] }
];