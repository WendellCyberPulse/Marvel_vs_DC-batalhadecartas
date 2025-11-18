// Dados dos personagens
const characters = {
    marvel: [
        {
            id: 1,
            name: "Homem-Aranha",
            universe: "marvel",
            image: "./imgs/SpiderMan.jpg",
            strength: 85,
            intelligence: 95,
            speed: 90,
            durability: 70,
            ability: {
                id: 'spider_sense',
                name: 'Sentido Aranha',
                description: 'Revela duas cartas na mão do oponente ao jogar.',
                trigger: 'onPlay',
                effect: 'reveal',
                value: 2,
                uses: 1
            }
        },
        {
            id: 2,
            name: "Homem de Ferro",
            universe: "marvel",
            image: "./imgs/IronMAn.jpg",
            strength: 85,
            intelligence: 100,
            speed: 60,
            durability: 85,
            attributes: "tech"
        },
        {
            id: 3,
            name: "Capitão América",
            universe: "marvel",
            image: "./imgs/Cap_america.jpg",
            strength: 80,
            intelligence: 70,
            speed: 80,
            durability: 80
        },
        {
            id: 4,
            name: "Thor",
            universe: "marvel",
            image: "./imgs/Thor.jpg",
            strength: 100,
            intelligence: 80,
            speed: 85,
            durability: 95
        },
        {
            id: 5,
            name: "Hulk",
            universe: "marvel",
            image: "./imgs/hulk.jpg",
            strength: 100,
            intelligence: 60,
            speed: 70,
            durability: 100,
            ability: {
                id: 'hulk_smash',
                name: 'Hulk Esmaga',
                description: 'Ao jogar, elimina a carta mais forte do oponente na arena.',
                trigger: 'onPlay',
                effect: 'smash_strongest',
                uses: 1
            }
        },
        {
            id: 6,
            name: "Wolverine",
            universe: "marvel",
            image: "./imgs/logan.jpg",
            strength: 90,
            intelligence: 65,
            speed: 70,
            durability: 100,
            ability: {
                id: 'regeneration',
                name: 'Regeneração',
                description: 'No fim da sua jogada, ganha +10 de durabilidade (1 vez).',
                trigger: 'onTurnEnd',
                effect: 'self_buff',
                stat: 'durability',
                value: 10,
                uses: 1
            }
        },
        {
            id: 7,
            name: "Capitã Marvel",
            universe: "marvel",
            image: "./imgs/CAp_marvel.jpg",
            strength: 95,
            intelligence: 80,
            speed: 85,
            durability: 90,
            gender: "female"
        },
        {
            id: 8,
            name: "Sr. Fantástico",
            universe: "marvel",
            image: "./imgs/sr_fantastico.jpg",
            strength: 80,
            intelligence: 100,
            speed: 55,
            durability: 90
        },
        {
            id: 9,
            name: "Coisa",
            universe: "marvel",
            image: "./imgs/Coisa.jpg",
            strength: 100,
            intelligence: 60,
            speed: 40,
            durability: 90
        },
        {
            id: 10,
            name: "Demolidor",
            universe: "marvel",
            image: "./imgs/demolidor.jpg",
            strength: 70,
            intelligence: 90,
            speed: 60,
            durability: 40
        },
        {
            id: 11,
            name: "Magneto",
            universe: "marvel",
            image: "./imgs/magneto.jpg",
            strength: 100,
            intelligence: 100,
            speed: 60,
            durability: 50,
            rarity: "rare"
        }, 
        
        {
            id: 12,
            name: "Dr. Doom",
            universe: "marvel",
            image: "./imgs/doom.jpg",
            strength: 90,
            intelligence: 100,
            speed: 60,
            durability: 60
        },
        {
            id: 13,
            name: "Duende Verde",
            universe: "marvel",
            image: "./imgs/doende_verde.jpg",
            strength: 80,
            intelligence: 100,
            speed: 90,
            durability: 60
        },
        {
            id: 14,
            name: "Venom",
            universe: "marvel",
            image: "./imgs/venom.jpg",
            strength: 90,
            intelligence: 100,
            speed: 90,
            durability: 60
        },
        {
            id: 15,
            name: "Thanos",
            universe: "marvel",
            image: "./imgs/thanos.jpg",
            strength: 100,
            intelligence: 100,
            speed: 90,
            durability: 100,
            rarity: "rare"
            ,ability: {
                id: 'thanos_half',
                name: 'Metade do Destino',
                description: 'Ao jogar, reduz pela metade o poder total do oponente nesta arena.',
                trigger: 'onPlay',
                effect: 'halve_arena',
                uses: 1
            }
        },
        {
            id: 16,
            name: "Feiticeira Escarlate",
            universe: "marvel",
            image: "./imgs/wanda.jpg",
            strength: 80,
            intelligence: 100,
            speed: 90,
            durability: 90,
            gender: "female",
            ability: {
                id: 'scarlet_change_arena',
                name: 'Alteração de Arena',
                description: 'Ao jogar, muda a arena atual para outra aleatória.',
                trigger: 'onPlay',
                effect: 'change_arena',
                uses: 1
            }
        },

        {
            id: 17,
            name: "Cavaleiro da Lua",
            universe: "marvel",
            image: "./imgs/moon_k.jpg",
            strength: 80,
            intelligence: 100,
            speed: 90,
            durability: 80,
            rarity: "rare"
        },
        {
            id: 18,
            name: "Ultron",
            universe: "marvel",
            image: "./imgs/ultron.jpg",
            strength: 90,
            intelligence: 100,
            speed: 90,
            durability: 100,
            attributes: "tech",
            ability: {
                id: 'ultron_duplicate',
                name: 'Duplicador',
                description: 'Ao jogar, coloca uma cópia sua nas outras arenas.',
                trigger: 'onPlay',
                effect: 'duplicate_all_arenas',
                uses: 1
            }
        },
        {
            id: 19,
            name: "Kang, O Conquistador",
            universe: "marvel",
            image: "./imgs/kang.jpg",
            strength: 90,
            intelligence: 100,
            speed: 90,
            durability: 90,
            attributes: "tech"
        },
        {
            id: 20,
            name: "Deadpool",
            universe: "marvel",
            image: "./imgs/deadpool.jpg",
            strength: 80,
            intelligence: 80,
            speed: 90,
            durability: 100,
        },
        {
            id: 21,
            name: "Wiccano",
            universe: "marvel",
            image: "./imgs/wiccano.jpg",
            strength: 95,
            intelligence: 100,
            speed: 100,
            durability: 100,
            rarity: "rare",
            ability: {
                id: 'change_all_arenas',
                name: 'Alteração de Todas as Arenas',
                description: 'Ao jogar, altera todas as arenas da partida.',
                trigger: 'onPlay',
                effect: 'change_all_arenas',
                uses: 1
            }
        },
        {
            id: 22,
            name: "Cyclope",
            universe: "marvel",
            image: "./imgs/cyclope.jpg",
            strength: 95,
            intelligence: 90,
            speed: 90,
            durability: 90,
        },
        {
            id: 23,
            name: "Noturno",
            universe: "marvel",
            image: "./imgs/noturno.jpg",
            strength: 95,
            intelligence: 90,
            speed: 100,
            durability: 90,
            ability: {
                id: 'teleport',
                name: 'Teleporte',
                description: 'Move-se para a arena onde você está perdendo no fim da sua jogada.',
                trigger: 'onTurnEnd',
                effect: 'teleport_to_losing',
                uses: 1
            }
        },
        {
            id: 24,
            name: "Jean Grey/Fênix",
            universe: "marvel",
            image: "./imgs/fenix.jpg",
            strength: 100,
            intelligence: 100,
            speed: 100,
            durability: 100,
            rarity: "rare",
            gender: "female"
            ,ability: {
                id: 'phoenix_force',
                name: 'Força Fênix',
                description: 'Ao jogar, maximiza os atributos de todas as cartas aliadas.',
                trigger: 'onPlay',
                effect: 'max_allies',
                uses: 1
            }
        },
        {
            id: 25,
            name: "Pantera Negra",
            universe: "marvel",
            image: "./imgs/TChala.jpg",
            strength: 95,
            intelligence: 100,
            speed: 90,
            durability: 100,
        },
        {
            id: 26,
            name: "Dr. Estranho",
            universe: "marvel",
            image: "./imgs/dr_estranho.jpg",
            strength: 85,
            intelligence: 100,
            speed: 80,
            durability: 90,
            rarity: "rare",
            ability: {
                id: 'strange_portal',
                name: 'Portal Mágico',
                description: 'Ao jogar, invoca uma carta aliada da Marvel para a arena.',
                trigger: 'onPlay',
                effect: 'summon_marvel_ally',
                uses: 1
            }
        },
        {
            id: 27,
            name: "Falcão/Capitão America",
            universe: "marvel",
            image: "./imgs/falcao.jpg",
            strength: 95,
            intelligence: 100,
            speed: 95,
            durability: 90,
        },
        {
            id: 28,
            name: "Apocalipse",
            universe: "marvel",
            image: "./imgs/apocalipse.jpg",
            strength: 100,
            intelligence: 100,
            speed: 95,
            durability: 100,
            rarity: "rare"
        },
        {
            id: 29,
            name: "Galactus",
            universe: "marvel",
            image: "./imgs/galactus.jpg",
            strength: 100,
            intelligence: 100,
            speed: 95,
            durability: 100,
            rarity: "rare",
            ability: {
                id: 'galactus_devour',
                name: 'Devorador de Mundos',
                description: 'Ao jogar, remove uma arena onde você está perdendo.',
                trigger: 'onPlay',
                effect: 'devour_arena',
                uses: 1
            }
        },
        {
            id: 30,
            name: "Tempestade",
            universe: "marvel",
            image: "./imgs/tempestade.jpg",
            strength: 100,
            intelligence: 100,
            speed: 95,
            durability: 100,
            rarity: "rare",
            gender: "female"
        },
    ],

    dc: [

        {
            id: 31,
            name: "Batman",
            universe: "dc",
            image: "./imgs/batman.jpg",
            strength: 80,
            intelligence: 100,
            speed: 65,
            durability: 75,
            ability: {
                id: 'batman_prep',
                name: 'Preparo',
                description: 'Ao jogar, zera os atributos da carta mais forte do oponente nesta arena.',
                trigger: 'onPlay',
                effect: 'zero_strongest',
                uses: 1
            }
        },
        {
            id: 32,
            name: "Superman",
            universe: "dc",
            image: "./imgs/Superman.jpg",
            strength: 100,
            intelligence: 85,
            speed: 100,
            durability: 100,
            ability: {
                id: 'conditional_maximize',
                name: 'Maximização Condicional',
                description: 'Ao jogar, se for mais fraco que o oponente na arena, maximiza atributos.',
                trigger: 'onPlay',
                effect: 'maximize_if_lower',
                uses: 1
            }
        },
        {
            id: 33,
            name: "Mulher-Maravilha",
            universe: "dc",
            image: "./imgs/wonder_woman.jpg",
            strength: 100,
            intelligence: 80,
            speed: 90,
            durability: 95,
            gender: "female",
            ability: {
                id: 'amazon_summon',
                name: 'Amazona',
                description: 'Ao jogar, invoca uma carta feminina para a sua arena.',
                trigger: 'onPlay',
                effect: 'summon_female',
                uses: 1
            }
        },
        {
            id: 34,
            name: "Flash",
            universe: "dc",
            image: "./imgs/flash.jpg",
            strength: 70,
            intelligence: 90,
            speed: 100,
            durability: 70
        },
        {
            id: 35,
            name: "Aquaman",
            universe: "dc",
            image: "./imgs/aquaman.jpg",
            strength: 85,
            intelligence: 70,
            speed: 80,
            durability: 85
        },
        {
            id: 36,
            name: "Lanterna Verde",
            universe: "dc",
            image: "./imgs/lanterna_verde.jpg",
            strength: 97,
            intelligence: 90,
            speed: 55,
            durability: 90
        },
        {
            id: 37,
            name: "Dr. Destino",
            universe: "dc",
            image: "./imgs/dr_destino.jpg",
            strength: 90,
            intelligence: 90,
            speed: 80,
            durability: 90,
            rarity: "rare"
        },
        {
            id: 38,
            name: "Shazam",
            universe: "dc",
            image: "./imgs/shazam.jpg",
            strength: 100,
            intelligence: 50,
            speed: 90,
            durability: 90
        },
        {
            id: 39,
            name: "Cyborg",
            universe: "dc",
            image: "./imgs/cyborg.jpg",
            strength: 90,
            intelligence: 100,
            speed: 60,
            durability: 90,
            attributes: "tech",
            ability: {
                id: 'hack',
                name: 'Hack',
                description: 'Reduz 10% do poder das cartas inimigas nesta arena enquanto estiver presente.',
                trigger: 'aura',
                effect: 'reduce_percent',
                value: 0.10
            }
        },
        {
            id: 40,
            name: "Mutano",
            universe: "dc",
            image: "./imgs/mutano.jpg",
            strength: 90,
            intelligence: 51,
            speed: 60,
            durability: 50
        },
        {
            id: 41,
            name: "Coringa",
            universe: "dc",
            image: "./imgs/joker.jpg",
            strength: 20,
            intelligence: 100,
            speed: 60,
            durability: 50,
            ability: {
                id: 'joker_steal',
                name: 'Roubo Aleatório',
                description: 'Ao jogar, rouba uma carta aleatória do oponente nesta arena e coloca do seu lado.',
                trigger: 'onPlay',
                effect: 'steal',
                uses: 1
            }
        },
        {
            id: 42,
            name: "Professor Zoom",
            universe: "dc",
            image: "./imgs/flash_rev.jpg",
            strength: 90,
            intelligence: 100,
            speed: 100,
            durability: 50
        },
        {
            id: 43,
            name: "Sinestro",
            universe: "dc",
            image: "./imgs/sinestro.jpg",
            strength: 90,
            intelligence: 100,
            speed: 60,
            durability: 90
        },
        {
            id: 44,
            name: "Bane",
            universe: "dc",
            image: "./imgs/bane.jpg",
            strength: 100,
            intelligence: 100,
            speed: 60,
            durability: 90
        },
        {
            id: 45,
            name: "Darkside",
            universe: "dc",
            image: "./imgs/darkside.jpg",
            strength: 100,
            intelligence: 100,
            speed: 60,
            durability: 100,
            rarity: "rare",
            ability: {
                id: 'darkside_destroy',
                name: 'Destruição de Arena',
                description: 'Ao jogar, elimina todas as cartas inimigas da arena.',
                trigger: 'onPlay',
                effect: 'destroy_arena',
                uses: 1
            }
        },

        {
            id: 46,
            name: "Pacificador",
            universe: "dc",
            image: "./imgs/pacemaker.jpg",
            strength: 45,
            intelligence: 50,
            speed: 50,
            durability: 20,
            rarity: "rare"
        },

        {
            id: 47,
            name: "Mulher Gavião",
            universe: "dc",
            image: "./imgs/gav_fem.jpg",
            strength: 90,
            intelligence: 75,
            speed: 60,
            durability: 90,
            gender: "female"
        },
        {
            id: 48,
            name: "Super Shock",
            universe: "dc",
            image: "./imgs/supershock.jpg",
            strength: 90,
            intelligence: 80,
            speed: 90,
            durability: 90,
            rarity: "rare"
        },
        {
            id: 49,
            name: "Robin",
            universe: "dc",
            image: "./imgs/robin.jpg",
            strength: 80,
            intelligence: 100,
            speed: 65,
            durability: 85,
        },
        {
            id: 50,
            name: "Asa Noturna",
            universe: "dc",
            image: "./imgs/asa_noturna.jpg",
            strength: 90,
            intelligence: 100,
            speed: 75,
            durability: 90,
        },
        {
            id: 51,
            name: "Atrocitus",
            universe: "dc",
            image: "./imgs/atrocitus.jpg",
            strength: 100,
            intelligence: 100,
            speed: 75,
            durability: 100,
            rarity: "rare"
        },
        {
            id: 52,
            name: "Brainiac",
            universe: "dc",
            image: "./imgs/brainiac.jpg",
            strength: 90,
            intelligence: 100,
            speed: 75,
            durability: 100,
            attributes: "tech"
        },
        {
            id: 53,
            name: "Caçador de Marte",
            universe: "dc",
            image: "./imgs/jhon.jpg",
            strength: 100,
            intelligence: 95,
            speed: 90,
            durability: 95,
            ability: {
                id: 'martian_morph',
                name: 'Metamorfose',
                description: 'Ao jogar, assume os atributos da carta mais forte do oponente na arena.',
                trigger: 'onPlay',
                effect: 'morph_to_strongest',
                uses: 1
            }
        },
        {
            id: 54,
            name: "Ravena",
            universe: "dc",
            image: "./imgs/ravena.jpg",
            strength: 85,
            intelligence: 100,
            speed: 95,
            durability: 100,
            gender: "female",
            rarity: "rare"
        },
        {
            id: 55,
            name: "Constantine",
            universe: "dc",
            image: "./imgs/constantine.jpg",
            strength: 20,
            intelligence: 100,
            speed: 65,
            durability: 55,
            rarity: "rare"
        },
        {
            id: 56,
            name: "Etrigan",
            universe: "dc",
            image: "./imgs/etrigan.jpg",
            strength: 100,
            intelligence: 85,
            speed: 80,
            durability: 100,
            rarity: "rare"
        },
        {
            id: 57,
            name: "Supergirl",
            universe: "dc",
            image: "./imgs/kara.jpg",
            strength: 100,
            intelligence: 85,
            speed: 100,
            durability: 100,
            gender: "female",
            ability: {
                id: 'conditional_maximize',
                name: 'Maximização Condicional',
                description: 'Ao jogar, se for mais fraca que o oponente na arena, maximiza atributos.',
                trigger: 'onPlay',
                effect: 'maximize_if_lower',
                uses: 1
            }
        },
        {
            id: 58,
            name: "Lex Luhtor",
            universe: "dc",
            image: "./imgs/lex.jpg",
            strength: 65,
            intelligence: 100,
            speed: 50,
            durability: 60,
            attributes: "tech"
        },
        {
            id: 59,
            name: "Besouro Azul",
            universe: "dc",
            image: "./imgs/blue_b.jpg",
            strength: 100,
            intelligence: 80,
            speed: 95,
            durability: 95,
            attributes: "tech",
            rarity: "rare"
        },
        {
            id: 60,
            name: "Estelar",
            universe: "dc",
            image: "./imgs/estelar.jpg",
            strength: 100,
            intelligence: 80,
            speed: 95,
            durability: 100,
            gender: "female"
        },
        

    ]
};

// No final do arquivo characters.js, adicione:

// Função para obter todas as cartas
function getAllCharacters() {
    if (!characters || !characters.marvel || !characters.dc) {
        console.error('❌ Dados de personagens não carregados corretamente');
        return [];
    }
    return [...characters.marvel, ...characters.dc];
}

// Função para calcular poder
function calculateCardPower(card) {
    if (!card) return 0;
    return (card.strength || 0) + (card.intelligence || 0) + (card.speed || 0) + (card.durability || 0);
}

// Função para embaralhar array
function shuffleArray(array) {
    if (!array) return [];
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

console.log('✅ Characters.js totalmente carregado');

