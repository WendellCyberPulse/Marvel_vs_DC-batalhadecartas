// Variáveis do jogo
let currentArenas = [];
let selectedCardIndex = null;
let gameState = {
    turn: 1,
    maxTurns: 4,
    currentPlayer: 'player',
    playerHand: [],
    opponentHand: [],
    playerDeck: [],
    opponentDeck: [],
    arenas: {
        1: { player: [], opponent: [], playerPower: 0, opponentPower: 0 },
        2: { player: [], opponent: [], playerPower: 0, opponentPower: 0 },
        3: { player: [], opponent: [], playerPower: 0, opponentPower: 0 }
    },
    score: 0,
    gameEnded: false,
    difficulty: 1,
    winStreak: 0,
    totalWins: 0,
    totalGames: 0,
    opponentBuff: 0 
};

const difficultySettings = {
    1: { name: "Iniciante", opponentBuff: 0, description: "Bom para aprender as mecânicas" },
    2: { name: "Intermediário", opponentBuff: 10, description: "Oponente mais estratégico" },
    3: { name: "Avançado", opponentBuff: 20, description: "Desafio significativo" },
    4: { name: "Especialista", opponentBuff: 30, description: "Para mestres da estratégia" },
    5: { name: "Lendário", opponentBuff: 40, description: "O desafio máximo" }
};

// Elementos DOM
const elements = {
    turnValue: document.getElementById('turn-value'),
    playerTurn: document.getElementById('player-turn'),
    scoreValue: document.getElementById('score-value'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    battleBtn: document.getElementById('battle-btn'),
    resetBtn: document.getElementById('reset-btn'),
    playerHand: document.getElementById('player-hand'),
    marvelCards: document.getElementById('marvel-cards'),
    dcCards: document.getElementById('dc-cards'),
    battleResult: document.getElementById('battle-result'),
    arenaTitle: document.getElementById('arena-title'),
    difficultySelect: document.getElementById('difficulty-select')
};

// Inicializar o jogo
function initGame() {
    setupDifficultySelector();
    createDecks();
    dealInitialHands();
    setupEventListeners();
    setupArenas();
    updateGameDisplay();
}


function setupDifficultySelector() {
    elements.difficultySelect.value = gameState.difficulty;
    
    elements.difficultySelect.addEventListener('change', (e) => {
        const newDifficulty = parseInt(e.target.value);
        
        if (gameState.gameEnded || gameState.turn === 1) {
            // Permite mudança manual apenas entre jogos
            changeDifficulty(newDifficulty);
        } else {
            // Durante o jogo, mostra a dificuldade atual mas não permite mudar
            elements.difficultySelect.value = gameState.difficulty;
            showTemporaryMessage('Aguarde o fim do jogo para mudar a dificuldade');
        }
    });
}

function showTemporaryMessage(message) {
    elements.battleResult.textContent = message;
    elements.battleResult.className = 'battle-result winner';
    elements.battleResult.style.display = 'block';
    
    setTimeout(() => {
        elements.battleResult.style.display = 'none';
    }, 2000);
}

function changeDifficulty(newDifficulty) {
    if (gameState.gameEnded || gameState.turn === 1) {
        gameState.difficulty = newDifficulty;
        gameState.opponentBuff = difficultySettings[newDifficulty].opponentBuff;
        
        // Recriar decks com nova dificuldade
        createDecks();
        dealInitialHands();
        updateGameDisplay();
        
        elements.battleResult.textContent = `Dificuldade alterada para: ${difficultySettings[newDifficulty].name}`;
        elements.battleResult.className = 'battle-result winner';
        elements.battleResult.style.display = 'block';
        
        setTimeout(() => {
            elements.battleResult.style.display = 'none';
        }, 2000);
    } else {
        // Se o jogo já começou, não permitir mudança
        elements.difficultySelect.value = gameState.difficulty;
        elements.battleResult.textContent = 'Só é possível mudar a dificuldade antes do jogo começar!';
        elements.battleResult.className = 'battle-result winner defeat';
        elements.battleResult.style.display = 'block';
        
        setTimeout(() => {
            elements.battleResult.style.display = 'none';
        }, 2000);
    }
}

function setupArenas() {
    if (typeof selectRandomArenas === 'function') {
        currentArenas = selectRandomArenas();
        
        gameState.arenas = {
            1: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: currentArenas[0] },
            2: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: currentArenas[1] },
            3: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: currentArenas[2] }
        };
    } else {
        // Fallback se arenas.js não carregar
        gameState.arenas = {
            1: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: {name: "Arena 1", effect: "Sem efeito", image: ""} },
            2: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: {name: "Arena 2", effect: "Sem efeito", image: ""} },
            3: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: {name: "Arena 3", effect: "Sem efeito", image: ""} }
        };
    }
}

// Criar decks
function createDecks() {
    const allCharacters = [...characters.marvel, ...characters.dc];
    const shuffled = [...allCharacters].sort(() => Math.random() - 0.5);
    
    gameState.playerDeck = selectDeckForPlayer(shuffled.slice(0, 24));
    gameState.opponentDeck = selectDeckForOpponent(shuffled.slice(0, 24));
}

function selectDeckForPlayer(cards) {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 12);
}

function selectDeckForOpponent(cards) {
    const sortedByPower = [...cards].sort((a, b) => {
        const powerA = calculateCardPower(a);
        const powerB = calculateCardPower(b);
        return powerB - powerA;
    });
    
    const deckSize = 12;
    let selectedCards = [];
    
    if (gameState.difficulty <= 2) {
        selectedCards = sortedByPower.slice(0, deckSize);
    } else if (gameState.difficulty <= 4) {
        const goodCards = Math.floor(deckSize * 0.7);
        selectedCards = [
            ...sortedByPower.slice(0, goodCards),
            ...sortedByPower.slice(goodCards, deckSize)
        ];
    } else {
        selectedCards = sortedByPower.slice(0, deckSize);
    }
    
    return selectedCards.sort(() => Math.random() - 0.5);
}

function dealInitialHands() {
    gameState.playerHand = gameState.playerDeck.splice(0, 4);
    gameState.opponentHand = gameState.opponentDeck.splice(0, 4);
}

function setupEventListeners() {
    elements.endTurnBtn.addEventListener('click', endTurn);
    elements.battleBtn.addEventListener('click', endGame);
    elements.resetBtn.addEventListener('click', resetGame);
    
    document.querySelectorAll('.arena').forEach(arena => {
        arena.addEventListener('click', (e) => {
            if (gameState.currentPlayer === 'player' && !gameState.gameEnded) {
                const arenaId = parseInt(arena.dataset.arena);
                playCardToArena(arenaId);
            }
        });
    });
}

// FUNÇÃO PRINCIPAL updateGameDisplay - APENAS UMA VERSÃO
function updateGameDisplay() {
    elements.turnValue.textContent = gameState.turn;
    elements.scoreValue.textContent = gameState.score;
    
    const difficultyInfo = difficultySettings[gameState.difficulty];
    
    if (gameState.gameEnded) {
        elements.playerTurn.innerHTML = `Jogo Finalizado!<br>Dificuldade: ${difficultyInfo.name}`;
        elements.playerTurn.className = 'player-turn opponent-turn';
        elements.endTurnBtn.disabled = true;
        elements.battleBtn.disabled = true;
        
        document.querySelectorAll('.hand-card').forEach(card => {
            card.classList.remove('playable');
            card.style.cursor = 'not-allowed';
        });
    } else {
        if (gameState.currentPlayer === 'player') {
            elements.playerTurn.innerHTML = `Sua vez!<br>Dificuldade: ${difficultyInfo.name}`;
            elements.playerTurn.className = 'player-turn';
        } else {
            elements.playerTurn.innerHTML = `Vez do Oponente<br>Dificuldade: ${difficultyInfo.name}`;
            elements.playerTurn.className = 'player-turn opponent-turn';
        }
        elements.endTurnBtn.disabled = false;
    }
    
    renderPlayerHand();
    updateArenasDisplay();
    elements.battleBtn.disabled = gameState.turn < gameState.maxTurns || gameState.gameEnded;
    updateArenaTitle();
}

function renderPlayerHand() {
    elements.playerHand.innerHTML = '';
    
    gameState.playerHand.forEach((card, index) => {
        const cardElement = createCardElement(card);
        cardElement.classList.add('hand-card');
        
        if (gameState.currentPlayer === 'player' && !gameState.gameEnded) {
            cardElement.classList.add('playable');
            cardElement.style.cursor = 'pointer';
            cardElement.addEventListener('click', () => selectCardFromHand(index));
        }
        
        elements.playerHand.appendChild(cardElement);
    });
}

function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.universe}`;
    cardElement.dataset.id = card.id;
    
    cardElement.innerHTML = `
        <div class="card-header">${card.name}</div>
        <div class="card-image" style="background-image: url('${card.image}')"></div>
        <div class="card-stats">
            <div class="stat">
                <span class="stat-name">Força</span>
                <span class="stat-value">${card.strength}</span>
            </div>
            <div class="stat">
                <span class="stat-name">Inteligência</span>
                <span class="stat-value">${card.intelligence}</span>
            </div>
            <div class="stat">
                <span class="stat-name">Velocidade</span>
                <span class="stat-value">${card.speed}</span>
            </div>
            <div class="stat">
                <span class="stat-name">Durabilidade</span>
                <span class="stat-value">${card.durability}</span>
            </div>
            <div class="stat total-power">
                <span class="stat-name">Poder Total</span>
                <span class="stat-value">${calculateCardPower(card)}</span>
            </div>
        </div>
    `;
    
    return cardElement;
}

function calculateCardPower(card) {
    return card.strength + card.intelligence + card.speed + card.durability;
}

// FUNÇÃO selectCardFromHand - APENAS UMA VERSÃO
function selectCardFromHand(index) {
    if (gameState.gameEnded) return;
    
    selectedCardIndex = index;
    
    document.querySelectorAll('.hand-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    if (elements.playerHand.children[index]) {
        elements.playerHand.children[index].classList.add('selected');
    }
    
    elements.battleResult.textContent = 'Agora clique em uma arena para jogar esta carta!';
    elements.battleResult.className = 'battle-result winner';
    elements.battleResult.style.display = 'block';
}

function playCardToArena(arenaId) {
    if (selectedCardIndex === null || selectedCardIndex >= gameState.playerHand.length) return;
    
    const card = gameState.playerHand[selectedCardIndex];
    
    gameState.playerHand.splice(selectedCardIndex, 1);
    gameState.arenas[arenaId].player.push(card);
    gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
    
    if (gameState.playerDeck.length > 0) {
        gameState.playerHand.push(gameState.playerDeck.shift());
    }
    
    selectedCardIndex = null;
    elements.battleResult.style.display = 'none';
    
    if (gameState.turn >= gameState.maxTurns) {
        setTimeout(() => endGame(), 1000);
    } else {
        setTimeout(() => {
            gameState.currentPlayer = 'opponent';
            updateGameDisplay();
            opponentPlay();
        }, 1000);
    }
}

function opponentPlay() {
    if (gameState.gameEnded || gameState.opponentHand.length === 0) return;
    
    setTimeout(() => {
        const randomCardIndex = Math.floor(Math.random() * gameState.opponentHand.length);
        const card = gameState.opponentHand[randomCardIndex];
        const arenaId = Math.floor(Math.random() * 3) + 1;
        
        gameState.opponentHand.splice(randomCardIndex, 1);
        gameState.arenas[arenaId].opponent.push(card);
        gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
        
        if (gameState.opponentDeck.length > 0) {
            gameState.opponentHand.push(gameState.opponentDeck.shift());
        }
        
        gameState.turn++;
        gameState.currentPlayer = 'player';
        
        updateGameDisplay();
        
        if (gameState.turn > gameState.maxTurns) {
            endGame();
        }
    }, 1500);
}

function calculateArenaPower(arenaId, side) {
    const arenaData = gameState.arenas[arenaId];
    let basePower = arenaData[side].reduce((total, card) => {
        return total + calculateCardPower(card);
    }, 0);
    
    if (side === 'opponent') {
        basePower += gameState.opponentBuff;
    }
    
    return basePower;
}

function updateArenasDisplay() {
    for (let i = 1; i <= 3; i++) {
        const arenaData = gameState.arenas[i];
        const arenaElement = document.getElementById(`arena-${i}`);
        
        if (arenaData.arena && arenaData.arena.image) {
            arenaElement.style.backgroundImage = `url('${arenaData.arena.image}')`;
        }
        if (arenaData.arena && arenaData.arena.universe) {
            arenaElement.dataset.universe = arenaData.arena.universe;
        }
        
        const titleElement = arenaElement.querySelector('h3');
        if (arenaData.arena) {
            titleElement.textContent = arenaData.arena.name;
        }
        
        let effectElement = arenaElement.querySelector('.arena-effect');
        if (!effectElement) {
            effectElement = document.createElement('div');
            effectElement.className = 'arena-effect';
            titleElement.after(effectElement);
        }
        effectElement.textContent = arenaData.arena ? arenaData.arena.effect : "Sem efeito especial";
        
        const playerPowerElement = document.getElementById(`power-arena-${i}-player`);
        const opponentPowerElement = document.getElementById(`power-arena-${i}-opponent`);
        
        playerPowerElement.textContent = arenaData.playerPower;
        opponentPowerElement.textContent = arenaData.opponentPower;
        
        const playerContainer = document.getElementById(`arena-${i}-player`);
        const opponentContainer = document.getElementById(`arena-${i}-opponent`);
        
        playerContainer.innerHTML = '';
        opponentContainer.innerHTML = '';
        
        arenaData.player.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = `arena-card ${card.universe}`;
            cardElement.textContent = card.name;
            cardElement.style.background = card.universe === 'marvel' ? 
                'linear-gradient(135deg, rgba(226, 54, 54, 0.8), rgba(196, 30, 58, 0.6))' : 
                'linear-gradient(135deg, rgba(81, 140, 202, 0.8), rgba(0, 87, 183, 0.6))';
            playerContainer.appendChild(cardElement);
        });
        
        arenaData.opponent.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = `arena-card ${card.universe}`;
            cardElement.textContent = card.name;
            cardElement.style.background = card.universe === 'marvel' ? 
                'linear-gradient(135deg, rgba(226, 54, 54, 0.8), rgba(196, 30, 58, 0.6))' : 
                'linear-gradient(135deg, rgba(81, 140, 202, 0.8), rgba(0, 87, 183, 0.6))';
            opponentContainer.appendChild(cardElement);
        });
        
        arenaElement.classList.remove('winning', 'losing');
        if (arenaData.playerPower > arenaData.opponentPower) {
            arenaElement.classList.add('winning');
        } else if (arenaData.playerPower < arenaData.opponentPower) {
            arenaElement.classList.add('losing');
        }
    }
}

function endTurn() {
    if (gameState.currentPlayer !== 'player' || gameState.gameEnded) return;
    
    if (selectedCardIndex !== null) {
        const arenaId = Math.floor(Math.random() * 3) + 1;
        playCardToArena(arenaId);
    } else {
        gameState.currentPlayer = 'opponent';
        updateGameDisplay();
        
        if (gameState.turn >= gameState.maxTurns) {
            endGame();
        } else {
            opponentPlay();
        }
    }
}

function endGame() {
    if (gameState.gameEnded) return;
    
    gameState.gameEnded = true;
    gameState.currentPlayer = 'none';
    gameState.totalGames++;
    
    let playerWins = 0;
    let opponentWins = 0;
    
    for (let i = 1; i <= 3; i++) {
        const arena = gameState.arenas[i];
        const playerFinalPower = arena.playerPower;
        const opponentFinalPower = arena.opponentPower + gameState.opponentBuff;
        
        if (playerFinalPower > opponentFinalPower) playerWins++;
        else if (playerFinalPower < opponentFinalPower) opponentWins++;
    }
    
    let resultText = "";
    let resultClass = "";
    
    if (playerWins > opponentWins) {
        gameState.winStreak++;
        gameState.totalWins++;
        resultText = `🎉 Vitória! Você venceu ${playerWins} de 3 arenas!`;
        resultClass = "winner victory";
        gameState.score += 50 + (gameState.difficulty * 10);
        
        if (gameState.winStreak >= 2 && gameState.difficulty < 5) {
            gameState.difficulty++;
            resultText += `<br><br>🏆 Dificuldade aumentada para: ${difficultySettings[gameState.difficulty].name}!`;
        }
    } else if (playerWins < opponentWins) {
        gameState.winStreak = 0;
        resultText = `💥 Derrota! Oponente venceu ${opponentWins} de 3 arenas!`;
        resultClass = "winner defeat";
        gameState.score = Math.max(0, gameState.score - 20);
        
        if (gameState.difficulty > 1) {
            gameState.difficulty = Math.max(1, gameState.difficulty - 1);
            resultText += `<br><br>📉 Dificuldade reduzida para: ${difficultySettings[gameState.difficulty].name}`;
        }
    } else {
        gameState.winStreak = 0;
        resultText = `⚖️ Empate! Ambos venceram ${playerWins} arena(s)!`;
        resultClass = "winner draw";
        gameState.score += 10;
    }

    elements.difficultySelect.value = gameState.difficulty;
    
    gameState.opponentBuff = difficultySettings[gameState.difficulty].opponentBuff;
    
    resultText += `<br><small>Dificuldade: ${difficultySettings[gameState.difficulty].name}`;
    resultText += ` | Sequência: ${gameState.winStreak} vitória(s)`; 
    resultText += ` | Total: ${gameState.totalWins}/${gameState.totalGames}</small>`;
    
    elements.battleResult.innerHTML = resultText;
    elements.battleResult.className = `battle-result ${resultClass}`;
    elements.battleResult.style.display = 'block';
    
    updateGameDisplay();
}

function updateArenaTitle() {
    const titles = ["Arena Central", "Batalha Épica", "Duelo de Titãs", "Confronto Final"];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    elements.arenaTitle.textContent = randomTitle;
}

function resetGame() {
    gameState = {
        turn: 1,
        maxTurns: 4,
        currentPlayer: 'player',
        playerHand: [],
        opponentHand: [],
        playerDeck: [],
        opponentDeck: [],
        arenas: {
            1: { player: [], opponent: [], playerPower: 0, opponentPower: 0 },
            2: { player: [], opponent: [], playerPower: 0, opponentPower: 0 },
            3: { player: [], opponent: [], playerPower: 0, opponentPower: 0 }
        },
        score: gameState.score,
        difficulty: gameState.difficulty,
        winStreak: gameState.winStreak,
        totalWins: gameState.totalWins,
        totalGames: gameState.totalGames,
        opponentBuff: gameState.opponentBuff,
        gameEnded: false
    };

    elements.difficultySelect.value = gameState.difficulty;
    
    createDecks();
    dealInitialHands();
    setupArenas();
    updateGameDisplay();
    
    elements.battleResult.style.display = 'none';
    selectedCardIndex = null;
}

window.addEventListener('DOMContentLoaded', initGame);