// Arenas - Cenários do Universo Marvel e DC
const arenas = {
    marvel: [
        {
            id: 1,
            name: "Wakanda",
            universe: "marvel",
            image: "./imgs/arenas/wakanda.jpg",
            effect: "Cartas com Força > 80 ganham +15 de poder",
            effectType: "buff_high_strength",
            description: "O reino tecnologicamente avançado do Pantera Negra"
        },
        {
            id: 2,
            name: "Asgard",
            universe: "marvel",
            image: "./imgs/arenas/asgard.jpg",
            effect: "Cartas do universo Marvel ganham +10 de poder",
            effectType: "buff_marvel",
            description: "O reino celestial dos Deuses Nórdicos"
        },
        {
            id: 3,
            name: "Xavier's School",
            universe: "marvel",
            image: "./imgs/arenas/xavier_school.jpg",
            effect: "Cartas com Inteligência > 85 ganham +12 de poder",
            effectType: "buff_high_intelligence",
            description: "A escola para jovens superdotados do Professor X"
        },
        {
            id: 4,
            name: "Stark Tower",
            universe: "marvel",
            image: "./imgs/arenas/stark_tower.jpg",
            effect: "Cartas com tecnologia ganham vantagem",
            effectType: "buff_tech",
            description: "A sede dos Vingadores e casa de Tony Stark"
        },
        {
            id: 5,
            name: "Knowhere",
            universe: "marvel",
            image: "./imgs/arenas/knowhere.jpg",
            effect: "Todas as cartas têm seus atributos embaralhados",
            effectType: "shuffle_stats",
            description: "A colônia espacial dentro da cabeça de um Celestial"
        }
    ],
    dc: [
        {
            id: 6,
            name: "Metropolis",
            universe: "dc",
            image: "./imgs/arenas/metropolis.jpg",
            effect: "Cartas com Velocidade > 85 ganham +15 de poder",
            effectType: "buff_high_speed",
            description: "A cidade do Homem de Aço"
        },
        {
            id: 7,
            name: "Gotham City",
            universe: "dc",
            image: "./imgs/arenas/gotham.jpg",
            effect: "Cartas do universo DC ganham +10 de poder",
            effectType: "buff_dc",
            description: "A cidade sombria protegida pelo Batman"
        },
        {
            id: 8,
            name: "Themyscira",
            universe: "dc",
            image: "./imgs/arenas/themyscira.jpg",
            effect: "Cartas femininas ganham +20 de poder",
            effectType: "buff_female",
            description: "A ilha paradisíaca das Amazonas"
        },
        {
            id: 9,
            name: "Central City",
            universe: "dc",
            image: "./imgs/arenas/central_city.jpg",
            effect: "A carta com maior velocidade decide a arena",
            effectType: "speed_decides",
            description: "Casa do Flash e da Força de Aceleração"
        },
        {
            id: 10,
            name: "Oa",
            universe: "dc",
            image: "./imgs/arenas/oa.jpg",
            effect: "Cartas com Durabilidade > 80 ganham +15 de poder",
            effectType: "buff_high_durability",
            description: "O planeta central dos Guardiões do Universo"
        }
    ],
    neutral: [
        {
            id: 11,
            name: "Battleworld",
            universe: "neutral",
            image: "./imgs/arenas/battleworld.jpg",
            effect: "Nenhum efeito especial - batalha pura",
            effectType: "none",
            description: "Um planeta criado para batalhas épicas entre universos"
        },
        {
            id: 12,
            name: "Crossover Zone",
            universe: "neutral",
            image: "./imgs/arenas/crossover_zone.jpg",
            effect: "Cartas raras ganham +25 de poder",
            effectType: "buff_rare",
            description: "Onde os universos se encontram e colidem"
        },
        {
            id: 13,
            name: "Quantum Realm",
            universe: "neutral",
            image: "./imgs/arenas/quantum_realm.jpg",
            effect: "Poderes são invertidos temporariamente",
            effectType: "reverse_power",
            description: "Uma dimensão onde as regras da física são diferentes"
        }
    ]
};

// Função para selecionar arenas aleatórias para uma partida
function selectRandomArenas() {
    const allArenas = [...arenas.marvel, ...arenas.dc, ...arenas.neutral];
    const shuffled = [...allArenas].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3); // Retorna 3 arenas aleatórias
}

// Função para aplicar efeitos das arenas
function applyArenaEffect(card, arena, side) {
    let powerBonus = 0;
    
    switch(arena.effectType) {
        case 'buff_high_strength':
            if (card.strength > 80) powerBonus = 15;
            break;
        case 'buff_marvel':
            if (card.universe === 'marvel') powerBonus = 10;
            break;
        case 'buff_high_intelligence':
            if (card.intelligence > 85) powerBonus = 12;
            break;
        case 'buff_high_speed':
            if (card.speed > 85) powerBonus = 15;
            break;
        case 'buff_dc':
            if (card.universe === 'dc') powerBonus = 10;
            break;
        case 'buff_female':
            if (card.gender === 'female') powerBonus = 20;
            break;
        case 'buff_high_durability':
            if (card.durability > 80) powerBonus = 15;
            break;
        case 'buff_rare':
            if (card.rarity === 'rare') powerBonus = 25;
            break;
        case 'buff_tech':
            if (card.attributes && card.attributes.includes('tech')) powerBonus = 15;
            break;
    }
    
    return powerBonus;
}

// Função para calcular poder considerando efeitos de arena
function calculateCardPowerWithArena(card, arena) {
    const basePower = card.strength + card.intelligence + card.speed + card.durability;
    const arenaBonus = applyArenaEffect(card, arena, 'player');
    return basePower + arenaBonus;

}
