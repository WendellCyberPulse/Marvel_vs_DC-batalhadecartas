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
            durability: 70
        },
        {
            id: 2,
            name: "Homem de Ferro",
            universe: "marvel",
            image: "./imgs/IronMAn.jpg",
            strength: 85,
            intelligence: 100,
            speed: 60,
            durability: 85
        },
        {
            id: 3,
            name: "Capitão América",
            universe: "marvel",
            image: "./imgs/CAp_america.jpg",
            strength: 80,
            intelligence: 70,
            speed: 50,
            durability: 80
        },
        {
            id: 4,
            name: "Thor",
            universe: "marvel",
            image: "./imgs/Thor.jpg",
            strength: 100,
            intelligence: 70,
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
            durability: 100
        },
        {
            id: 11,
            name: "Wolverine",
            universe: "marvel",
            image: "./imgs/logan.jpg",
            strength: 90,
            intelligence: 65,
            speed: 70,
            durability: 95
        },
        {
            id: 12,
            name: "Capitã Marvel",
            universe: "marvel",
            image: "./imgs/CAp_marvel.jpg",
            strength: 95,
            intelligence: 80,
            speed: 85,
            durability: 90
        },
        {
            id: 13,
            name: "Sr. Fantástico",
            universe: "marvel",
            image: "./imgs/sr_fantastico.jpg",
            strength: 80,
            intelligence: 90,
            speed: 55,
            durability: 90
        },
        {
            id: 14,
            name: "Coisa",
            universe: "marvel",
            image: "./imgs/Coisa.jpg",
            strength: 100,
            intelligence: 60,
            speed: 40,
            durability: 90
        },
        {
            id: 18,
            name: "Demolidor",
            universe: "marvel",
            image: "./imgs/demolidor.jpg",
            strength: 70,
            intelligence: 90,
            speed: 60,
            durability: 40
        },
        {
            id: 21,
            name: "Magneto",
            universe: "marvel",
            image: "./imgs/magneto.jpg",
            strength: 100,
            intelligence: 100,
            speed: 60,
            durability: 50
        }, 
        
        {
            id: 23,
            name: "Dr. Doom",
            universe: "marvel",
            image: "./imgs/doom.jpg",
            strength: 90,
            intelligence: 100,
            speed: 60,
            durability: 60
        },
        {
            id: 25,
            name: "Duende Verde",
            universe: "marvel",
            image: "./imgs/doende_verde.jpg",
            strength: 80,
            intelligence: 100,
            speed: 90,
            durability: 60
        },
        {
            id: 26,
            name: "Venom",
            universe: "marvel",
            image: "./imgs/venom.jpg",
            strength: 90,
            intelligence: 100,
            speed: 90,
            durability: 60
        },
        {
            id: 27,
            name: "Thanos",
            universe: "marvel",
            image: "./imgs/thanos.jpg",
            strength: 100,
            intelligence: 100,
            speed: 90,
            durability: 100
        },
        {
            id: 31,
            name: "Feiticeira Escarlate",
            universe: "marvel",
            image: "./imgs/wanda.jpg",
            strength: 80,
            intelligence: 100,
            speed: 90,
            durability: 90
        },

        {
            id: 32,
            name: "Cavaleiro da Lua",
            universe: "marvel",
            image: "./imgs/moon_k.jpg",
            strength: 80,
            intelligence: 100,
            speed: 90,
            durability: 80
        },
        {
            id: 33,
            name: "Ultron",
            universe: "marvel",
            image: "./imgs/ultron.jpg",
            strength: 90,
            intelligence: 100,
            speed: 90,
            durability: 100
        },
        {
            id: 34,
            name: "Kang, O Conquistador",
            universe: "marvel",
            image: "./imgs/kang.jpg",
            strength: 90,
            intelligence: 100,
            speed: 90,
            durability: 90
        },
    ],

    dc: [

        {
            id: 6,
            name: "Batman",
            universe: "dc",
            image: "./imgs/batman.jpg",
            strength: 80,
            intelligence: 100,
            speed: 65,
            durability: 75
        },
        {
            id: 7,
            name: "Superman",
            universe: "dc",
            image: "./imgs/Superman.jpg",
            strength: 100,
            intelligence: 85,
            speed: 100,
            durability: 100
        },
        {
            id: 8,
            name: "Mulher-Maravilha",
            universe: "dc",
            image: "./imgs/wonder_woman.jpg",
            strength: 95,
            intelligence: 80,
            speed: 90,
            durability: 95
        },
        {
            id: 9,
            name: "Flash",
            universe: "dc",
            image: "./imgs/flash.jpg",
            strength: 70,
            intelligence: 75,
            speed: 100,
            durability: 70
        },
        {
            id: 10,
            name: "Aquaman",
            universe: "dc",
            image: "./imgs/aquaman.jpg",
            strength: 85,
            intelligence: 70,
            speed: 80,
            durability: 85
        },
        {
            id: 15,
            name: "Lanterna Verde",
            universe: "dc",
            image: "./imgs/lanterna_verde.jpg",
            strength: 97,
            intelligence: 90,
            speed: 55,
            durability: 90
        },
        {
            id: 16,
            name: "Dr. Destino",
            universe: "dc",
            image: "./imgs/dr_destino.jpg",
            strength: 90,
            intelligence: 90,
            speed: 80,
            durability: 90
        },
        {
            id: 17,
            name: "Shazam",
            universe: "dc",
            image: "./imgs/shazam.jpg",
            strength: 100,
            intelligence: 50,
            speed: 90,
            durability: 90
        },
        {
            id: 19,
            name: "Cyborg",
            universe: "dc",
            image: "./imgs/cyborg.jpg",
            strength: 90,
            intelligence: 100,
            speed: 60,
            durability: 90
        },
        {
            id: 20,
            name: "Mutano",
            universe: "dc",
            image: "./imgs/mutano.jpg",
            strength: 90,
            intelligence: 51,
            speed: 60,
            durability: 50
        },
        {
            id: 22,
            name: "Coringa",
            universe: "dc",
            image: "./imgs/joker.jpg",
            strength: 20,
            intelligence: 100,
            speed: 60,
            durability: 50
        },
        {
            id: 24,
            name: "Professor Zoom",
            universe: "dc",
            image: "./imgs/flash_rev.jpg",
            strength: 90,
            intelligence: 100,
            speed: 60,
            durability: 50
        },
        {
            id: 28,
            name: "Sinestro",
            universe: "dc",
            image: "./imgs/sinestro.jpg",
            strength: 90,
            intelligence: 100,
            speed: 60,
            durability: 90
        },
        {
            id: 29,
            name: "Bane",
            universe: "dc",
            image: "./imgs/bane.jpg",
            strength: 100,
            intelligence: 100,
            speed: 60,
            durability: 90
        },
        {
            id: 30,
            name: "Darkside",
            universe: "dc",
            image: "./imgs/darkside.jpg",
            strength: 100,
            intelligence: 100,
            speed: 60,
            durability: 100
        },

        {
            id: 34,
            name: "Pacificador",
            universe: "dc",
            image: "./imgs/pacemaker.jpg",
            strength: 45,
            intelligence: 50,
            speed: 50,
            durability: 20
        },

        {
            id: 30,
            name: "Mulher Gavião",
            universe: "dc",
            image: "./imgs/gav_fem.jpg",
            strength: 90,
            intelligence: 75,
            speed: 60,
            durability: 90
        },
        {
            id: 30,
            name: "Super Shock",
            universe: "dc",
            image: "./imgs/supershock.jpg",
            strength: 90,
            intelligence: 80,
            speed: 90,
            durability: 90
        },
    ]

};


