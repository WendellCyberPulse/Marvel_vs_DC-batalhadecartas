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
            effect: "Cartas com tecnologia ganham +15 de poder",
            effectType: "buff_tech",
            description: "A sede dos Vingadores e casa de Tony Stark"
        },
        {
            id: 5,
            name: "Sanctum Sanctorum",
            universe: "marvel",
            image: "./imgs/arenas/sanctum.jpg",
            effect: "Cartas raras ganham +20 de poder",
            effectType: "buff_rare",
            description: "A residência do Dr. Estranho"
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
            effect: "Todas as cartas ganham +5 de poder",
            effectType: "buff_all",
            description: "Onde os universos se encontram e colidem"
        },
        {
            id: 13,
            name: "Quantum Realm",
            universe: "neutral",
            image: "./imgs/arenas/quantum_realm.jpg",
            effect: "Atributos são randomizados",
            effectType: "shuffle_stats",
            description: "Uma dimensão onde as regras da física são diferentes"
        }
    ]
};

// Função para selecionar arenas aleatórias
function selectRandomArenas() {
    const allArenas = [...arenas.marvel, ...arenas.dc, ...arenas.neutral];
    const shuffled = shuffleArray(allArenas);
    return shuffled.slice(0, 3);
}

// Função para aplicar efeitos das arenas
function applyArenaEffect(card, arena, side) {
    if (!card || !arena) return 0;
    
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
        case 'buff_tech':
            if (card.attributes && card.attributes.includes('tech')) powerBonus = 15;
            break;
        case 'buff_rare':
            if (card.rarity && card.rarity === 'rare') powerBonus = 20;
            break;
        case 'buff_high_speed':
            if (card.speed > 85) powerBonus = 15;
            break;
        case 'buff_dc':
            if (card.universe === 'dc') powerBonus = 10;
            break;
        case 'buff_female':
            if (card.gender && card.gender === 'female') powerBonus = 20;
            break;
        case 'buff_high_durability':
            if (card.durability > 80) powerBonus = 15;
            break;
        case 'buff_all':
            powerBonus = 5;
            break;
        case 'speed_decides':
            // Efeito especial - tratado separadamente
            return 0;
        case 'shuffle_stats':
            // Efeito especial - randomiza atributos
            powerBonus = Math.floor(Math.random() * 21) - 10; // -10 a +10
            break;
        case 'none':
        default:
            powerBonus = 0;
            break;
    }
    
    return powerBonus;
}

// Função específica para arena Speed Decides
function calculateSpeedDecidesPower(arenaData, side) {
    const cards = arenaData[side];
    
    if (cards.length === 0) return 0;
    
    // Encontrar a carta com MAIOR velocidade
    const fastestCard = cards.reduce((fastest, current) => {
        return current.speed > fastest.speed ? current : fastest;
    }, cards[0]);
    
    // O poder total é baseado APENAS na velocidade da carta mais rápida
    let speedPower = fastestCard.speed * 2; // Dobra o valor da velocidade
    
    console.log(`🎯 Speed Decides: ${side} - ${fastestCard.name} com ${fastestCard.speed} velocidade = ${speedPower} poder`);
    
    return speedPower;
}

// Função para embaralhar array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
