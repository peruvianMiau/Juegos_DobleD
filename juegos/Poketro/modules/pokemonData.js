export const POKEMON_DECK = [
  // Planta
  { id: 1, name: "Bulbasaur", type: "Grass", power: 10, mult: 2, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png" },
  { id: 2, name: "Ivysaur", type: "Grass", power: 20, mult: 3, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/2.png" },
  { id: 3, name: "Venusaur", type: "Grass", power: 40, mult: 5, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png" },
  { id: 43, name: "Oddish", type: "Grass", power: 8, mult: 1, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/43.png" },

  // Fuego
  { id: 4, name: "Charmander", type: "Fire", power: 12, mult: 2, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png" },
  { id: 5, name: "Charmeleon", type: "Fire", power: 25, mult: 3, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/5.png" },
  { id: 6, name: "Charizard", type: "Fire", power: 50, mult: 6, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png" },
  { id: 37, name: "Vulpix", type: "Fire", power: 10, mult: 2, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/37.png" },

  // Agua
  { id: 7, name: "Squirtle", type: "Water", power: 10, mult: 2, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png" },
  { id: 8, name: "Wartortle", type: "Water", power: 22, mult: 3, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/8.png" },
  { id: 9, name: "Blastoise", type: "Water", power: 45, mult: 5, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png" },
  { id: 54, name: "Psyduck", type: "Water", power: 9, mult: 1, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png" },

  // Eléctrico
  { id: 25, name: "Pikachu", type: "Electric", power: 15, mult: 3, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png" },
  { id: 26, name: "Raichu", type: "Electric", power: 35, mult: 4, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/26.png" },

  // Psíquico
  { id: 63, name: "Abra", type: "Psychic", power: 12, mult: 2, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/63.png" },
  { id: 150, name: "Mewtwo", type: "Psychic", power: 60, mult: 8, sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png" }
];

export const JOKERS_BASE = [
  { id: 1, name: "Cinta Elegida", desc: "+15 Chips globales", bonusType: "chips", value: 15 },
  { id: 2, name: "Caramelo Raro", desc: "+3 Mult general", bonusType: "mult", value: 3 }
];

export const COMBOS = {
  CARTA_ALTA: { name: "Pokémon Individual", baseChips: 5, baseMult: 1 },
  MONOTIPO: { name: "Pareja Monotipo", baseChips: 20, baseMult: 2 },
  TRIO_ELEMENTAL: { name: "Tercia de Tipo", baseChips: 40, baseMult: 3 },
  FLUSH_TIPO: { name: "Equipo Elemental (5 del mismo Tipo)", baseChips: 70, baseMult: 5 }
};
