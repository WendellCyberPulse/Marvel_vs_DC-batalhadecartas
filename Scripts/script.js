// =============================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// =============================================

// Configurações de dificuldade
// No início do script.js - CONFIGURAÇÕES COMPLETAS
const DIFFICULTY_SETTINGS = {
    1: { 
        name: "Iniciante", 
        opponentBuff: 0, 
        turnTime: 90,
        description: "Bom para aprender as mecânicas",
        deckStrategy: "balanced"
    },
    2: { 
        name: "Intermediário", 
        opponentBuff: 15, 
        turnTime: 90,
        description: "Oponente mais estratégico", 
        deckStrategy: "smart"
    },
    3: { 
        name: "Avançado", 
        opponentBuff: 25, 
        turnTime: 90,
        description: "Desafio significativo",
        deckStrategy: "aggressive" 
    },
    4: { 
        name: "Especialista", 
        opponentBuff: 35, 
        turnTime: 90,
        description: "Para mestres da estratégia",
        deckStrategy: "elite"
    },
    5: { 
        name: "Lendário", 
        opponentBuff: 50, 
        turnTime: 30,
        description: "O desafio máximo",
        deckStrategy: "ultimate"
    }
};

// Estado do jogo
// Estado do jogo COMPLETO
const gameState = {
    turn: 1,
    maxTurns: 4,
    currentPlayer: 'player',
    gameEnded: false,
    playerHand: [],
    opponentHand: [],
    playerDeck: [],
    opponentDeck: [],
    selectedCardId: null,
    arenas: {
        1: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: null },
        2: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: null },
        3: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: null }
    },
    score: 0,
    difficulty: 1,
    winStreak: 0,
    totalWins: 0,
    totalGames: 0,
    opponentBuff: 0, // 🔥 IMPORTANTE: Adicionar esta linha
    turnTime: 90,
    timeLeft: 90,
    timerInterval: null
};

// Elementos DOM
const elements = {
    // Informações do jogo
    turnValue: document.getElementById('turn-value'),
    playerTurn: document.getElementById('player-turn'),
    scoreValue: document.getElementById('score-value'),
    
    // Controles
    endTurnBtn: document.getElementById('end-turn-btn'),
    battleBtn: document.getElementById('battle-btn'),
    resetBtn: document.getElementById('reset-btn'),
    difficultySelect: document.getElementById('difficulty-select'),
    
    // Timer
    timer: document.getElementById('timer'),
    timerProgressBar: document.getElementById('timer-progress-bar'),
    timerContainer: document.querySelector('.timer-container'),
    
    // Áreas de jogo
    playerHand: document.getElementById('player-hand'),
    marvelCards: document.getElementById('marvel-cards'),
    dcCards: document.getElementById('dc-cards'),
    battleResult: document.getElementById('battle-result'),
    arenaTitle: document.getElementById('arena-title'),
    
    // Modal
    resultModal: document.getElementById('result-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalStats: document.getElementById('modal-stats'),
    modalNewGame: document.getElementById('modal-new-game'),
    modalClose: document.getElementById('modal-close'),
    closeModal: document.querySelector('.close-modal')
};

// =============================================
// INICIALIZAÇÃO DO JOGO
// =============================================

/**
 * Inicializa o jogo quando a página carrega
 */
function initGame() {
    console.log('🎮 Inicializando jogo...');

    gameState.opponentBuff = DIFFICULTY_SETTINGS[gameState.difficulty].opponentBuff;
    
    // Verificar se os dados estão carregados
    if (typeof getAllCharacters === 'undefined') {
        console.error('❌ Funções de characters não carregadas');
        showTemporaryMessage('Erro: Dados do jogo não carregados. Recarregue a página.');
        return;
    }
    
    // Inicializar elementos DOM
    const domSuccess = initializeDOMElements();
    if (!domSuccess) {
        console.error('❌ Falha ao inicializar elementos DOM');
        return;
    }
    
    // Verificar elementos críticos
    if (!elements.playerHand) {
        console.error('❌ Elemento player-hand não encontrado!');
        return;
    }
    
    setupEventListeners();
    setupClickOutsideHandler();
    setupArenas();
    createDecks();
    dealInitialHands();
    updateGameDisplay();
    
    console.log('✅ Jogo inicializado!');
}

/**
 * Inicializa todos os elementos DOM necessários
 */
function initializeDOMElements() {
    console.log('🔍 Inicializando elementos DOM...');
    
    // Elementos principais do jogo
    elements.turnValue = document.getElementById('turn-value');
    elements.playerTurn = document.getElementById('player-turn');
    elements.scoreValue = document.getElementById('score-value');
    
    // Botões de controle
    elements.endTurnBtn = document.getElementById('end-turn-btn');
    elements.battleBtn = document.getElementById('battle-btn');
    elements.resetBtn = document.getElementById('reset-btn');
    elements.difficultySelect = document.getElementById('difficulty-select');
    
    // Timer
    elements.timer = document.getElementById('timer');
    elements.timerProgressBar = document.getElementById('timer-progress-bar');
    elements.timerContainer = document.querySelector('.timer-container');
    
    // Áreas de cartas
    elements.playerHand = document.getElementById('player-hand');
    elements.marvelCards = document.getElementById('marvel-cards');
    elements.dcCards = document.getElementById('dc-cards');
    elements.battleResult = document.getElementById('battle-result');
    elements.arenaTitle = document.getElementById('arena-title');
    
    // Elementos das arenas (poderes)
    elements.arenaPowers = {
        player: {
            1: document.getElementById('power-arena-1-player'),
            2: document.getElementById('power-arena-2-player'),
            3: document.getElementById('power-arena-3-player')
        },
        opponent: {
            1: document.getElementById('power-arena-1-opponent'),
            2: document.getElementById('power-arena-2-opponent'),
            3: document.getElementById('power-arena-3-opponent')
        }
    };
    
    // Containers de cartas nas arenas
    elements.arenaContainers = {
        player: {
            1: document.getElementById('arena-1-player'),
            2: document.getElementById('arena-2-player'),
            3: document.getElementById('arena-3-player')
        },
        opponent: {
            1: document.getElementById('arena-1-opponent'),
            2: document.getElementById('arena-2-opponent'),
            3: document.getElementById('arena-3-opponent')
        }
    };
    
    // Modal de resultado
    elements.resultModal = document.getElementById('result-modal');
    elements.modalTitle = document.getElementById('modal-title');
    elements.modalMessage = document.getElementById('modal-message');
    elements.modalStats = document.getElementById('modal-stats');
    elements.modalNewGame = document.getElementById('modal-new-game');
    elements.modalClose = document.getElementById('modal-close');
    elements.closeModal = document.querySelector('.close-modal');
    
    // Verificar quais elementos foram encontrados
    const foundElements = {};
    const missingElements = {};
    
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            if (typeof elements[key] === 'object' && elements[key] !== null) {
                // Para objetos como arenaPowers, verificar sub-elementos
                const subElements = Object.values(elements[key]).flatMap(val => 
                    typeof val === 'object' ? Object.values(val) : [val]
                );
                const allFound = subElements.every(el => el !== null && el !== undefined);
                foundElements[key] = allFound ? '✅' : '⚠️';
            } else {
                foundElements[key] = '✅';
            }
        } else {
            missingElements[key] = '❌';
        }
    });
    
    console.log('📋 Elementos encontrados:', foundElements);
    if (Object.keys(missingElements).length > 0) {
        console.warn('⚠️ Elementos faltando:', missingElements);
    }
    
    // Verificar elementos críticos
    const criticalElements = ['playerHand', 'turnValue', 'scoreValue', 'endTurnBtn', 'battleBtn', 'resetBtn'];
    const missingCritical = criticalElements.filter(el => !elements[el]);
    
    if (missingCritical.length > 0) {
        console.error('❌ Elementos críticos faltando:', missingCritical);
        showTemporaryMessage('Erro: Elementos da interface não carregados. Recarregue a página.');
        return false;
    }
    
    console.log('✅ Todos os elementos DOM inicializados com sucesso!');
    return true;
}

/**
 * Configura o seletor de dificuldade
 */
function setupDifficultySelector() {
    elements.difficultySelect.value = gameState.difficulty;
    
    elements.difficultySelect.addEventListener('change', (e) => {
        const newDifficulty = parseInt(e.target.value);
        
        if (gameState.gameEnded || gameState.turn === 1) {
            changeDifficulty(newDifficulty);
        } else {
            elements.difficultySelect.value = gameState.difficulty;
            showTemporaryMessage('Aguarde o fim do jogo para mudar a dificuldade');
        }
    });
}

/**
 * Configura os event listeners
 */
function setupEventListeners() {
    // Controles principais
    elements.endTurnBtn.addEventListener('click', endTurn);
    elements.battleBtn.addEventListener('click', endGame);
    elements.resetBtn.addEventListener('click', resetGame);
    
    // Modal
    elements.modalNewGame.addEventListener('click', resetGame);
    elements.modalClose.addEventListener('click', hideModal);
    elements.closeModal.addEventListener('click', hideModal);
    
    // Clique fora do modal para fechar
    elements.resultModal.addEventListener('click', (e) => {
        if (e.target === elements.resultModal) {
            hideModal();
        }
    });
    
    // Arenas (para drag and drop)
    document.querySelectorAll('.arena').forEach(arena => {
        arena.addEventListener('click', handleArenaClick);
    });
    
    // Event delegation para cartas na mão
    elements.playerHand.addEventListener('click', (e) => {
        const cardElement = e.target.closest('.hand-card.playable');
        if (!cardElement) return;
        
        const index = Array.from(elements.playerHand.children).indexOf(cardElement);
        if (index !== -1) {
            selectCardFromHand(index);
        }
    });
    
    // Drag and drop para cartas
    setupDragAndDrop();
}

/**
 * Configura drag and drop para cartas
 */
function setupDragAndDrop() {
    let draggedCardIndex = null;
    
    document.addEventListener('mousedown', (e) => {
        const cardElement = e.target.closest('.hand-card.playable');
        if (!cardElement || gameState.currentPlayer !== 'player' || gameState.gameEnded) return;
        
        draggedCardIndex = Array.from(elements.playerHand.children).indexOf(cardElement);
        if (draggedCardIndex === -1) return;
        
        // Efeito visual de arraste
        cardElement.style.transform = 'scale(1.05) rotate(5deg)';
        cardElement.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mouseup', (e) => {
        if (draggedCardIndex === null) return;
        
        const arenaElement = e.target.closest('.arena');
        if (arenaElement) {
            const arenaId = parseInt(arenaElement.dataset.arena);
            selectCardFromHand(draggedCardIndex);
            setTimeout(() => playCardToArena(arenaId), 100);
        }
        
        // Resetar efeitos visuais
        resetHandCardStyles();
        draggedCardIndex = null;
    });
}

/**
 * Reseta os estilos das cartas na mão
 */
function resetHandCardStyles() {
    elements.playerHand.querySelectorAll('.hand-card').forEach(card => {
        card.style.transform = '';
        card.style.cursor = '';
    });
}

function selectDeckForOpponent(cards) {
    const sortedByPower = [...cards].sort((a, b) => {
        return calculateCardPower(b) - calculateCardPower(a);
    });
    
    const deckSize = 12;
    let selectedCards = [];
    
    const strategy = DIFFICULTY_SETTINGS[gameState.difficulty].deckStrategy;
    
    switch (strategy) {
        case 'balanced': // Iniciante
            selectedCards = shuffleArray(sortedByPower).slice(0, deckSize);
            break;
            
        case 'smart': // Intermediário
            // 60% melhores cartas, 40% aleatórias
            const goodCardsCount = Math.floor(deckSize * 0.6);
            selectedCards = [
                ...sortedByPower.slice(0, goodCardsCount),
                ...shuffleArray(sortedByPower.slice(goodCardsCount)).slice(0, deckSize - goodCardsCount)
            ];
            break;
            
        case 'aggressive': // Avançado
            // 80% melhores cartas, foco em força e velocidade
            const strongCards = sortedByPower.filter(card => 
                card.strength >= 80 || card.speed >= 80
            );
            const aggressiveCount = Math.floor(deckSize * 0.8);
            selectedCards = [
                ...strongCards.slice(0, aggressiveCount),
                ...sortedByPower.slice(0, deckSize - aggressiveCount)
            ];
            break;
            
        case 'elite': // Especialista
            // Apenas as melhores cartas, priorizando atributos altos
            selectedCards = sortedByPower.slice(0, deckSize);
            break;
            
        case 'ultimate': // Lendário
            // Cartas elite + estratégia de composição
            const eliteCards = sortedByPower.filter(card => 
                calculateCardPower(card) >= 300
            );
            if (eliteCards.length >= deckSize) {
                selectedCards = eliteCards.slice(0, deckSize);
            } else {
                selectedCards = sortedByPower.slice(0, deckSize);
            }
            break;
            
        default:
            selectedCards = sortedByPower.slice(0, deckSize);
    }
    
    console.log(`🎯 Estratégia do oponente (${strategy}): ${selectedCards.length} cartas selecionadas`);
    return shuffleArray(selectedCards);
}

// =============================================
// SISTEMA DE TIMER
// =============================================

/**
 * Inicia o timer do turno
 */
function startTimer() {
    console.log('🕒 Iniciando timer...');
    
    // Parar timer anterior se existir
    stopTimer();
    
    // Configurar tempo baseado na dificuldade
    const difficultySettings = DIFFICULTY_SETTINGS[gameState.difficulty];
    gameState.turnTime = difficultySettings.turnTime;
    gameState.timeLeft = gameState.turnTime;
    
    // Atualizar display
    updateTimerDisplay();
    
    // Configurar estado visual
    elements.timerContainer.classList.add('active', 'timer-running');
    elements.timerContainer.classList.remove('inactive', 'opponent-turn');
    
    // Iniciar intervalo do timer
    let lastTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = currentTime - lastTime;
        
        if (elapsed >= 900) { // ~1 segundo com margem
            gameState.timeLeft--;
            lastTime = currentTime;
            
            updateTimerDisplay();
            
            if (gameState.timeLeft <= 0) {
                timeUp();
            }
        }
    }, 100);
}

/**
 * Para o timer
 */
function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

/**
 * Atualiza o display do timer
 */
function updateTimerDisplay() {
    if (!elements.timer || !elements.timerProgressBar) return;
    
    // Atualizar número
    elements.timer.textContent = gameState.timeLeft;
    
    // Atualizar barra de progresso
    const percentage = (gameState.timeLeft / gameState.turnTime) * 100;
    elements.timerProgressBar.style.width = `${Math.max(0, percentage)}%`;
    
    // Atualizar cores
    updateTimerColors(percentage);
}

/**
 * Atualiza cores do timer baseado no tempo restante
 */
function updateTimerColors(percentage) {
    // Resetar classes
    elements.timer.className = 'timer';
    elements.timerProgressBar.className = 'timer-progress-bar';
    
    // Aplicar cores baseadas na porcentagem
    if (percentage <= 25) {
        elements.timer.classList.add('danger');
        elements.timerProgressBar.classList.add('danger');
    } else if (percentage <= 50) {
        elements.timer.classList.add('warning');
        elements.timerProgressBar.classList.add('warning');
    }
    
    // Efeito especial para modo Lendário
    if (gameState.difficulty === 5 && percentage <= 33) {
        elements.timerProgressBar.classList.add('danger-pulse');
    }
}

/**
 * Configura timer para vez do oponente
 */
function setTimerForOpponent() {
    stopTimer();
    
    // Resetar tempo para visualização
    const difficultySettings = DIFFICULTY_SETTINGS[gameState.difficulty];
    gameState.timeLeft = difficultySettings.turnTime;
    gameState.turnTime = difficultySettings.turnTime;
    
    updateTimerDisplay();
    
    // Estado visual do oponente
    elements.timerContainer.classList.remove('active', 'timer-running');
    elements.timerContainer.classList.add('opponent-turn');
}

/**
 * Configura timer para jogo finalizado
 */
function setTimerForGameEnd() {
    stopTimer();
    elements.timerContainer.classList.remove('active', 'timer-running', 'opponent-turn');
    elements.timerContainer.classList.add('inactive');
}

/**
 * Chamado quando o tempo acaba
 */
function timeUp() {
    console.log('⏰ Tempo esgotado!');
    
    if (gameState.currentPlayer === 'player' && !gameState.gameEnded) {
        // Feedback visual
        elements.timerContainer.style.animation = 'flash-red 0.5s 3';
        
        // Mensagem para o jogador
        showTemporaryMessage('⏰ Tempo esgotado! Turno do oponente.');
        
        // Passar turno para oponente
        gameState.currentPlayer = 'opponent';
        
        // Atualizar display e iniciar jogada da IA
        setTimeout(() => {
            updateGameDisplay();
            opponentPlay();
            elements.timerContainer.style.animation = 'none';
        }, 1500);
    }
}

// =============================================
// SISTEMA DE CARTAS
// =============================================

/**
 * Cria os decks para jogador e oponente
 */
function createDecks() {
    const allCharacters = getAllCharacters();
    const shuffled = shuffleArray(allCharacters);
    
    // Pegar 24 cartas aleatórias para cada deck
    const availableCards = shuffled.slice(0, 24);
    
    gameState.playerDeck = selectDeckForPlayer(availableCards);
    gameState.opponentDeck = selectDeckForOpponent(availableCards);
    
    console.log(`🎴 Decks criados: Jogador ${gameState.playerDeck.length}, Oponente ${gameState.opponentDeck.length} cartas`);
}

/**
 * Seleciona deck para o jogador
 */
function selectDeckForPlayer(cards) {
    return shuffleArray([...cards]).slice(0, 12);
}

/**
 * Seleciona deck para o oponente baseado na dificuldade
 */
function selectDeckForOpponent(cards) {
    const sortedByPower = [...cards].sort((a, b) => {
        return calculateCardPower(b) - calculateCardPower(a);
    });
    
    const deckSize = 12;
    let selectedCards = [];
    
    switch (gameState.difficulty) {
        case 1: // Iniciante - cartas balanceadas
            selectedCards = sortedByPower.slice(0, deckSize);
            break;
        case 2: // Intermediário - 70% boas, 30% normais
        case 3: // Avançado - mesma lógica
            const goodCards = Math.floor(deckSize * 0.7);
            selectedCards = [
                ...sortedByPower.slice(0, goodCards),
                ...sortedByPower.slice(goodCards, deckSize)
            ];
            break;
        case 4: // Especialista - 90% boas
        case 5: // Lendário - melhores cartas
            selectedCards = sortedByPower.slice(0, deckSize);
            break;
        default:
            selectedCards = sortedByPower.slice(0, deckSize);
    }
    
    return shuffleArray(selectedCards);
}

/**
 * Distribui cartas iniciais
 */
function dealInitialHands() {
    gameState.playerHand = gameState.playerDeck.splice(0, 4);
    gameState.opponentHand = gameState.opponentDeck.splice(0, 4);
    
    console.log(`🃏 Mãos distribuídas: Jogador ${gameState.playerHand.length}, Oponente ${gameState.opponentHand.length} cartas`);
}

/**
 * Seleciona carta da mão
 */
function selectCardFromHand(index) {
    if (gameState.gameEnded || gameState.currentPlayer !== 'player') {
        console.log('⏸️ Não é a vez do jogador ou jogo acabou');
        return;
    }
    
    const card = gameState.playerHand[index];
    if (!card) {
        console.error('❌ Carta não encontrada no índice:', index);
        return;
    }
    
    // Se já tinha uma carta selecionada, esconder mensagem anterior
    if (gameState.selectedCardId !== null) {
        hideTemporaryMessage();
    }
    
    gameState.selectedCardId = card.id;
    
    // Destacar carta selecionada
    elements.playerHand.querySelectorAll('.hand-card').forEach(cardEl => {
        cardEl.classList.remove('selected');
    });
    
    const selectedCardElement = elements.playerHand.children[index];
    if (selectedCardElement) {
        selectedCardElement.classList.add('selected');
    }
    
    showTemporaryMessage(`"${card.name}" selecionada! Clique em uma arena.`);
    console.log(`🎯 Carta selecionada: ${card.name} (ID: ${card.id})`);
}

/**
 * Joga carta selecionada na arena
 */
async function playCardToArena(arenaId) {
    if (gameState.selectedCardId === null) {
        showTemporaryMessage('Selecione uma carta primeiro!');
        return;
    }
    
    // Encontrar carta pelo ID
    const cardIndex = gameState.playerHand.findIndex(card => card.id === gameState.selectedCardId);
    if (cardIndex === -1) {
        console.error('Carta não encontrada na mão');
        return;
    }
    
    const card = gameState.playerHand[cardIndex];
    const cardElement = elements.playerHand.children[cardIndex];
    
    console.log(`🎮 Jogando ${card.name} na arena ${arenaId}`);
    
    // Remover carta da mão e adicionar na arena
    gameState.playerHand.splice(cardIndex, 1);
    gameState.arenas[arenaId].player.push(card);
    
    // Atualizar poder da arena
    gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
    
    // Animar movimento da carta
    await animateCardToArena(cardElement, arenaId, card);
    
    // Comprar nova carta se disponível
    if (gameState.playerDeck.length > 0) {
        const newCard = gameState.playerDeck.shift();
        gameState.playerHand.push(newCard);
    }
    
    // Atualizar interface
    renderPlayerHand();
    updateArenasDisplay();
    
    // Resetar seleção
    gameState.selectedCardId = null;
    elements.battleResult.style.display = 'none';
    
    // Continuar fluxo do jogo
    continueGameAfterPlay();
}

/**
 * Continua o jogo após jogada do jogador
 */
function continueGameAfterPlay() {
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

function updateGameStats(result) {
    const { playerWins, opponentWins } = result;
    
    let difficultyChanged = false;
    let oldDifficulty = gameState.difficulty;
    
    if (playerWins > opponentWins) {
        // VITÓRIA
        gameState.winStreak++;
        gameState.totalWins++;
        gameState.score += 50 + (gameState.difficulty * 10);
        
        // 🔥 PROGRESSÃO: Aumentar dificuldade após vitórias consecutivas
        if (gameState.winStreak >= 2 && gameState.difficulty < 5) {
            gameState.difficulty++;
            difficultyChanged = true;
            console.log(`🔥 Dificuldade aumentada para: ${DIFFICULTY_SETTINGS[gameState.difficulty].name}`);
        }
        
    } else if (playerWins < opponentWins) {
        // DERROTA
        gameState.winStreak = 0;
        gameState.score = Math.max(0, gameState.score - 20);
        
        // 🔥 REGRESSÃO: Reduzir dificuldade após derrota (mas não abaixo de 1)
        if (gameState.difficulty > 1) {
            gameState.difficulty = Math.max(1, gameState.difficulty - 1);
            difficultyChanged = true;
            console.log(`🔄 Dificuldade reduzida para: ${DIFFICULTY_SETTINGS[gameState.difficulty].name}`);
        }
        
    } else {
        // EMPATE
        gameState.winStreak = 0;
        gameState.score += 10;
    }
    
    gameState.totalGames++;
    gameState.opponentBuff = DIFFICULTY_SETTINGS[gameState.difficulty].opponentBuff;
    
    // Atualizar seletor de dificuldade
    if (elements.difficultySelect) {
        elements.difficultySelect.value = gameState.difficulty;
    }
    
    return { difficultyChanged, oldDifficulty };
}

// =============================================
// SISTEMA DE ARENAS
// =============================================

/**
 * Configura as arenas para a partida
 */
function setupArenas() {
    if (typeof selectRandomArenas === 'function') {
        const selectedArenas = selectRandomArenas();
        
        // Atualizar arenas no estado do jogo
        for (let i = 1; i <= 3; i++) {
            gameState.arenas[i].arena = selectedArenas[i - 1];
        }
        
        console.log('🏟️ Arenas configuradas:', selectedArenas.map(a => a.name));
    } else {
        // Fallback se arenas.js não carregar
        console.warn('Arenas não carregadas, usando fallback');
        for (let i = 1; i <= 3; i++) {
            gameState.arenas[i].arena = {
                name: `Arena ${i}`,
                effect: "Sem efeito especial",
                effectType: "none",
                image: ""
            };
        }
    }
}

/**
 * Calcula o poder total de uma arena
 */
function calculateArenaPower(arenaId, side) {
    const arenaData = gameState.arenas[arenaId];
    
    // Caso especial: Speed Decides
    if (arenaData.arena && arenaData.arena.effectType === 'speed_decides') {
        return calculateSpeedDecidesPower(arenaData, side);
    }
    
    // Cálculo normal de poder
    let totalPower = 0;
    
    arenaData[side].forEach(card => {
        const basePower = calculateCardPower(card);
        let arenaBonus = 0;
        
        // Aplicar efeito da arena se a função existir
        if (typeof applyArenaEffect === 'function' && arenaData.arena) {
            arenaBonus = applyArenaEffect(card, arenaData.arena, side);
        }
        
        // 🔥 BÔNUS DE DIFICULDADE PARA OPONENTE
        const difficultyBonus = (side === 'opponent') ? gameState.opponentBuff : 0;
        
        totalPower += basePower + arenaBonus + difficultyBonus;
    });
    
    return totalPower;
}

/**
 * Atualiza o display das arenas
 */
function updateArenasDisplay() {
    for (let i = 1; i <= 3; i++) {
        const arenaData = gameState.arenas[i];
        const arenaElement = document.getElementById(`arena-${i}`);
        
        if (!arenaElement) continue;
        
        // Aplicar estilo visual da arena
        updateArenaVisuals(arenaElement, arenaData);
        
        // Atualizar informações da arena
        updateArenaInfo(arenaElement, arenaData, i);
        
        // Atualizar cartas nas arenas
        updateArenaCards(arenaData, i);
        
        // Destacar arena vencedora/perdedora
        updateArenaStatus(arenaElement, arenaData);
    }
}

/**
 * Atualiza elementos visuais da arena
 */
function updateArenaVisuals(arenaElement, arenaData) {
    // Background e tema
    if (arenaData.arena && arenaData.arena.image) {
        arenaElement.style.backgroundImage = `url('${arenaData.arena.image}')`;
    }
    
    if (arenaData.arena && arenaData.arena.universe) {
        arenaElement.dataset.universe = arenaData.arena.universe;
    }
    
    // Efeito especial Speed Arena
    arenaElement.classList.remove('speed-arena');
    if (arenaData.arena && arenaData.arena.effectType === 'speed_decides') {
        arenaElement.classList.add('speed-arena');
    }
}

/**
 * Atualiza informações textuais da arena
 */
function updateArenaInfo(arenaElement, arenaData, arenaId) {
    const titleElement = arenaElement.querySelector('h3');
    if (titleElement && arenaData.arena) {
        titleElement.textContent = arenaData.arena.name;
    }
    
    // Efeito da arena
    let effectElement = arenaElement.querySelector('.arena-effect');
    if (!effectElement) {
        effectElement = document.createElement('div');
        effectElement.className = 'arena-effect';
        titleElement.after(effectElement);
    }
    effectElement.textContent = arenaData.arena ? arenaData.arena.effect : "Sem efeito especial";
    
    // Poderes
    const playerPowerElement = document.getElementById(`power-arena-${arenaId}-player`);
    const opponentPowerElement = document.getElementById(`power-arena-${arenaId}-opponent`);
    
    if (playerPowerElement) playerPowerElement.textContent = arenaData.playerPower;
    if (opponentPowerElement) opponentPowerElement.textContent = arenaData.opponentPower;
}

/**
 * Atualiza cartas visíveis nas arenas
 */
function updateArenaCards(arenaData, arenaId) {
    const playerContainer = document.getElementById(`arena-${arenaId}-player`);
    const opponentContainer = document.getElementById(`arena-${arenaId}-opponent`);
    
    if (playerContainer) {
        playerContainer.innerHTML = '';
        arenaData.player.forEach(card => {
            playerContainer.appendChild(createArenaCardElement(card));
        });
    }
    
    if (opponentContainer) {
        opponentContainer.innerHTML = '';
        arenaData.opponent.forEach(card => {
            opponentContainer.appendChild(createArenaCardElement(card));
        });
    }
    
    // Destacar cartas mais rápidas em Speed Decides
    if (arenaData.arena && arenaData.arena.effectType === 'speed_decides') {
        highlightFastestCards(arenaData, arenaId);
    }
}

/**
 * Cria elemento de carta para arena
 */
function createArenaCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = `arena-card ${card.universe}`;
    cardElement.dataset.id = card.id;
    cardElement.title = `${card.name} - Poder: ${calculateCardPower(card)}`;
    
    // Calcular poder total
    const totalPower = calculateCardPower(card);
    
    // HTML da carta com foto e stats
    cardElement.innerHTML = `
        <div class="arena-card-power-badge">${totalPower}</div>
        <div class="arena-card-image" style="background-image: url('${card.image || 'https://via.placeholder.com/100x60/333/fff?text=Sem+Imagem'}')"></div>
        <div class="arena-card-name">${card.name}</div>
        <div class="arena-card-stats">
            <div class="arena-card-stat">
                <span class="arena-card-stat-name">Força</span>
                <span class="arena-card-stat-value">${card.strength || 0}</span>
            </div>
            <div class="arena-card-stat">
                <span class="arena-card-stat-name">Inteligência</span>
                <span class="arena-card-stat-value">${card.intelligence || 0}</span>
            </div>
            <div class="arena-card-stat">
                <span class="arena-card-stat-name">Velocidade</span>
                <span class="arena-card-stat-value">${card.speed || 0}</span>
            </div>
            <div class="arena-card-stat">
                <span class="arena-card-stat-name">Durabilidade</span>
                <span class="arena-card-stat-value">${card.durability || 0}</span>
            </div>
            <div class="arena-card-total-power">Total: ${totalPower}</div>
        </div>
    `;
    
    // Adicionar animação de entrada
    cardElement.classList.add('arena-card-new');
    setTimeout(() => {
        cardElement.classList.remove('arena-card-new');
    }, 500);
    
    return cardElement;
}

/**
 * Destaca cartas mais rápidas em Speed Decides
 */
function highlightFastestCards(arenaData, arenaId) {
    const playerContainer = document.getElementById(`arena-${arenaId}-player`);
    const opponentContainer = document.getElementById(`arena-${arenaId}-opponent`);
    
    const playerFastest = arenaData.player.length > 0 ? 
        arenaData.player.reduce((a, b) => a.speed > b.speed ? a : b) : null;
    const opponentFastest = arenaData.opponent.length > 0 ? 
        arenaData.opponent.reduce((a, b) => a.speed > b.speed ? a : b) : null;
    
    highlightFastestCardInContainer(playerContainer, playerFastest);
    highlightFastestCardInContainer(opponentContainer, opponentFastest);
}

/**
 * Destaca carta mais rápida em um container
 */
function highlightFastestCardInContainer(container, fastestCard) {
    if (!container || !fastestCard) return;
    
    const cardElements = container.querySelectorAll('.arena-card');
    cardElements.forEach(cardElement => {
        cardElement.classList.remove('fastest-card');
        if (cardElement.textContent === fastestCard.name) {
            cardElement.classList.add('fastest-card');
        }
    });
}

/**
 * Atualiza status da arena (vencendo/perdendo)
 */
function updateArenaStatus(arenaElement, arenaData) {
    arenaElement.classList.remove('winning', 'losing');
    
    if (arenaData.playerPower > arenaData.opponentPower) {
        arenaElement.classList.add('winning');
    } else if (arenaData.playerPower < arenaData.opponentPower) {
        arenaElement.classList.add('losing');
    }
}

// =============================================
// JOGADOR OPONENTE (IA)
// =============================================

/**
 * Executa jogada do oponente
 */
function opponentPlay() {
    console.log('🤖 Vez do oponente');
    
    if (gameState.gameEnded || gameState.opponentHand.length === 0) {
        endOpponentTurn();
        return;
    }
    
    setTimeout(async () => {
        try {
            // Escolher carta e arena aleatórias (IA simples)
            const randomCardIndex = Math.floor(Math.random() * gameState.opponentHand.length);
            const card = gameState.opponentHand[randomCardIndex];
            const arenaId = Math.floor(Math.random() * 3) + 1;
            
            console.log(`🤖 Oponente joga ${card.name} na arena ${arenaId}`);
            
            // Animar carta do oponente
            await animateOpponentCard(arenaId, card);
            
            // Mover carta para arena
            gameState.opponentHand.splice(randomCardIndex, 1);
            gameState.arenas[arenaId].opponent.push(card);
            gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
            
            // Comprar nova carta se disponível
            if (gameState.opponentDeck.length > 0) {
                gameState.opponentHand.push(gameState.opponentDeck.shift());
            }
            
            // Finalizar turno do oponente
            endOpponentTurn();
            
        } catch (error) {
            console.error('Erro na jogada do oponente:', error);
            endOpponentTurn();
        }
    }, 1000);
}

/**
 * Finaliza turno do oponente
 */
function endOpponentTurn() {
    gameState.turn++;
    gameState.currentPlayer = 'player';
    
    updateGameDisplay();
    
    // Verificar se o jogo acabou
    if (gameState.turn > gameState.maxTurns) {
        endGame();
    }
}

// =============================================
// INTERFACE DO USUÁRIO
// =============================================

/**
 * Atualiza toda a interface do jogo
 */
function updateGameDisplay() {
    updateGameInfo();
    updateTimerState();
    renderPlayerHand();
    updateArenasDisplay();
    updateControls();
    updateArenaTitle();
}

/**
 * Atualiza informações do jogo
 */
function updateGameInfo() {
    elements.turnValue.textContent = gameState.turn;
    elements.scoreValue.textContent = gameState.score;
    
    const difficultyInfo = DIFFICULTY_SETTINGS[gameState.difficulty];
    
    if (gameState.gameEnded) {
        elements.playerTurn.innerHTML = `Jogo Finalizado!<br>Dificuldade: ${difficultyInfo.name}`;
        elements.playerTurn.className = 'player-turn opponent-turn';
    } else {
        if (gameState.currentPlayer === 'player') {
            elements.playerTurn.innerHTML = `Sua vez!<br>Dificuldade: ${difficultyInfo.name}`;
            elements.playerTurn.className = 'player-turn';
        } else {
            elements.playerTurn.innerHTML = `Vez do Oponente<br>Dificuldade: ${difficultyInfo.name}`;
            elements.playerTurn.className = 'player-turn opponent-turn';
        }
    }
}

/**
 * Atualiza estado do timer
 */
function updateTimerState() {
    if (gameState.gameEnded) {
        setTimerForGameEnd();
    } else if (gameState.currentPlayer === 'player') {
        startTimer();
    } else {
        setTimerForOpponent();
    }
}

/**
 * Renderiza a mão do jogador
 */
function renderPlayerHand() {
    elements.playerHand.innerHTML = '';
    
    gameState.playerHand.forEach((card, index) => {
        const cardElement = createCardElement(card);
        cardElement.classList.add('hand-card');
        
        // Animar cartas novas
        if (index >= gameState.playerHand.length - 1) {
            setTimeout(() => {
                animateCardDraw(cardElement);
            }, 100 * index);
        }
        
        // Tornar jogável se for vez do jogador
        if (gameState.currentPlayer === 'player' && !gameState.gameEnded) {
            cardElement.classList.add('playable');
            cardElement.style.cursor = 'pointer';
        }
        
        elements.playerHand.appendChild(cardElement);
    });
}

/**
 * Cria elemento de carta para exibição
 */
function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.universe}`;
    cardElement.dataset.id = card.id;
    
    // Construir tags de atributos
    let attributeTags = '';
    
    if (card.gender) {
        attributeTags += `<span class="attribute-tag attribute-gender-${card.gender}">${card.gender === 'female' ? '♀ Feminino' : '♂ Masculino'}</span>`;
    }
    
    if (card.rarity) {
        attributeTags += `<span class="attribute-tag attribute-rarity-${card.rarity}">${card.rarity === 'rare' ? '⭐ Rara' : card.rarity}</span>`;
    }
    
    if (card.attributes) {
        attributeTags += `<span class="attribute-tag attribute-tech">🔧 ${card.attributes}</span>`;
    }
    
    cardElement.innerHTML = `
        <div class="card-header">${card.name}</div>
        <div class="card-image" style="background-image: url('${card.image}')" 
             onerror="this.style.backgroundImage='linear-gradient(135deg, #333, #555)'">
        </div>
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
        ${attributeTags ? `<div class="card-attributes">${attributeTags}</div>` : ''}
    `;
    
    return cardElement;
}

/**
 * Atualiza controles do jogo
 */
function updateControls() {
    elements.battleBtn.disabled = gameState.turn < gameState.maxTurns || gameState.gameEnded;
    elements.endTurnBtn.disabled = gameState.currentPlayer !== 'player' || gameState.gameEnded;
}

/**
 * Atualiza título da arena
 */
function updateArenaTitle() {
    const titles = ["Arena Central", "Batalha Épica", "Duelo de Titãs", "Confronto Final"];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    elements.arenaTitle.textContent = randomTitle;
}

// =============================================
// CONTROLE DE JOGO
// =============================================

/**
 * Finaliza o turno atual
 */
function endTurn() {
    if (gameState.currentPlayer !== 'player' || gameState.gameEnded) {
        console.log('⏸️ Não pode finalizar turno agora');
        return;
    }
    
    console.log('⏭️ Finalizando turno...');
    
    // Esconder mensagem ao finalizar turno
    hideTemporaryMessage();
    
    if (gameState.selectedCardId !== null) {
        // Jogar carta selecionada em arena aleatória
        const arenaId = Math.floor(Math.random() * 3) + 1;
        playCardToArena(arenaId);
    } else {
        // Passar turno sem jogar
        gameState.currentPlayer = 'opponent';
        updateGameDisplay();
        opponentPlay();
    }
}

/**
 * Finaliza o jogo e calcula resultado
 */
function endGame() {
    if (gameState.gameEnded) return;
    
    console.log('🏁 Finalizando jogo...');
    gameState.gameEnded = true;
    gameState.currentPlayer = 'none';
    
    // Calcular resultado
    const result = calculateGameResult();
    const { playerWins, opponentWins } = result;
    
    // Atualizar estatísticas E obter info sobre mudança de dificuldade
    const { difficultyChanged, oldDifficulty } = updateGameStats(result);
    
    // Mostrar resultado
    showGameResult(result, difficultyChanged, oldDifficulty);
    
    // Atualizar interface
    updateGameDisplay();
    
    console.log('📊 Jogo finalizado - Resultado:', { 
        playerWins, 
        opponentWins, 
        difficulty: gameState.difficulty,
        winStreak: gameState.winStreak 
    });
}

/**
 * Calcula resultado do jogo
 */
function calculateGameResult() {
    let playerWins = 0;
    let opponentWins = 0;
    
    for (let i = 1; i <= 3; i++) {
        const arena = gameState.arenas[i];
        console.log(`Arena ${i}: Jogador ${arena.playerPower} vs Oponente ${arena.opponentPower}`);
        
        if (arena.playerPower > arena.opponentPower) {
            playerWins++;
        } else if (arena.playerPower < arena.opponentPower) {
            opponentWins++;
        }
        // Empate não conta vitória para ninguém
    }
    
    return { playerWins, opponentWins };
}


/**
 * Atualiza estatísticas do jogo
 */
function updateGameStats(result) {
    const { playerWins, opponentWins } = result;
    
    if (playerWins > opponentWins) {
        gameState.winStreak++;
        gameState.totalWins++;
        gameState.score += 50 + (gameState.difficulty * 10);
    } else if (playerWins < opponentWins) {
        gameState.winStreak = 0;
        gameState.score = Math.max(0, gameState.score - 20);
    } else {
        gameState.winStreak = 0;
        gameState.score += 10;
    }
    
    gameState.totalGames++;
}

/**
 * Mostra resultado do jogo
 */
function showGameResult(result, difficultyChanged = false, oldDifficulty = null) {
    const { playerWins, opponentWins } = result;
    const difficultyInfo = DIFFICULTY_SETTINGS[gameState.difficulty];
    
    let message, resultClass, resultType;
    
    if (playerWins > opponentWins) {
        resultType = 'victory';
        message = `🎉 **VITÓRIA!** 🎉\n\nVocê venceu ${playerWins} de 3 arenas!\n\n`;
        message += `🏆 Pontuação: +${50 + (gameState.difficulty * 10)}\n`;
        message += `📈 Sequência: ${gameState.winStreak} vitória(s) consecutiva(s)`;
        resultClass = "victory";
        
        // 🔥 MENSAGEM DE PROGRESSÃO
        if (difficultyChanged) {
            message += `\n\n🔥 **Dificuldade aumentada para: ${difficultyInfo.name}**`;
        } else if (gameState.winStreak >= 1) {
            message += `\n\n⭐ **Mais ${2 - gameState.winStreak} vitória(s) para subir de dificuldade!**`;
        }
        
    } else if (playerWins < opponentWins) {
        resultType = 'defeat';
        message = `💥 **DERROTA!** 💥\n\nOponente venceu ${opponentWins} de 3 arenas!\n\n`;
        message += `📉 Pontuação: -20\n`;
        message += `📊 Sequência: 0 vitória(s) consecutiva(s)`;
        resultClass = "defeat";
        
        // 🔥 MENSAGEM DE REGRESSÃO
        if (difficultyChanged) {
            message += `\n\n🔄 **Dificuldade reduzida para: ${difficultyInfo.name}**`;
        }
        
    } else {
        resultType = 'draw';
        message = `⚖️ **EMPATE!** ⚖️\n\nAmbos venceram ${playerWins} arena(s)!\n\n`;
        message += `📊 Pontuação: +10\n`;
        message += `🔄 Sequência: 0 vitória(s) consecutiva(s)`;
        resultClass = "draw";
    }
    
    message += `\n\n🎯 Dificuldade: ${difficultyInfo.name}`;
    message += `\n📊 Total: ${gameState.totalWins}/${gameState.totalGames} vitórias`;
    
    // Mostrar resultado
    showFinalResult(message, resultClass, result);
}

function showFinalResult(message, resultClass, result) {
    const { playerWins, opponentWins } = result;
    
    // Criar ou atualizar elemento de resultado
    let resultElement = document.getElementById('final-battle-result');
    
    if (!resultElement) {
        resultElement = document.createElement('div');
        resultElement.id = 'final-battle-result';
        resultElement.className = `final-battle-result ${resultClass}`;
        
        // Inserir antes do container de arenas
        const arenaContainer = document.querySelector('.arena-container');
        if (arenaContainer && arenaContainer.parentNode) {
            arenaContainer.parentNode.insertBefore(resultElement, arenaContainer);
        } else {
            document.querySelector('.game-container').appendChild(resultElement);
        }
    }
    
    // Conteúdo detalhado do resultado
    resultElement.innerHTML = `
        <div class="result-header">
            <h2>${resultClass === 'victory' ? '🎉 VITÓRIA!' : resultClass === 'defeat' ? '💥 DERROTA' : '⚖️ EMPATE'}</h2>
            <div class="result-arenas">
                <div class="arena-result">
                    <span class="result-label">Você</span>
                    <span class="result-wins ${playerWins > opponentWins ? 'winner' : ''}">${playerWins}</span>
                </div>
                <div class="vs">VS</div>
                <div class="arena-result">
                    <span class="result-label">Oponente</span>
                    <span class="result-wins ${opponentWins > playerWins ? 'winner' : ''}">${opponentWins}</span>
                </div>
            </div>
        </div>
        <div class="result-message">
            ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
        </div>
        <div class="result-actions">
            <button id="play-again-btn" class="result-btn primary">Jogar Novamente</button>
            <button id="change-difficulty-btn" class="result-btn secondary">Mudar Dificuldade</button>
        </div>
    `;
    
    // Event listeners para os botões
    setTimeout(() => {
        const playAgainBtn = document.getElementById('play-again-btn');
        const changeDifficultyBtn = document.getElementById('change-difficulty-btn');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', resetGame);
        }
        
        if (changeDifficultyBtn) {
            changeDifficultyBtn.addEventListener('click', () => {
                elements.difficultySelect.focus();
                resultElement.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }, 100);
    
    // Scroll para o resultado
    setTimeout(() => {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);
    
    console.log('📢 Resultado mostrado:', resultClass);
}



/**
 * Reinicia o jogo
 */
function resetGame() {
    console.log('🔄 Reiniciando jogo...');
    
    // 🔥 IMPORTANTE: Esconder mensagem temporária
    hideTemporaryMessage();
    
    // Remover elemento de resultado final se existir
    const finalResult = document.getElementById('final-battle-result');
    if (finalResult) {
        finalResult.remove();
    }
    
    // Resetar estado do jogo
    gameState.turn = 1;
    gameState.currentPlayer = 'player';
    gameState.gameEnded = false;
    gameState.selectedCardId = null;
    
    // Limpar cartas
    gameState.playerHand = [];
    gameState.opponentHand = [];
    gameState.playerDeck = [];
    gameState.opponentDeck = [];
    
    // Limpar arenas
    for (let i = 1; i <= 3; i++) {
        gameState.arenas[i] = { 
            player: [], 
            opponent: [], 
            playerPower: 0, 
            opponentPower: 0, 
            arena: gameState.arenas[i].arena 
        };
    }
    
    // Recriar jogo
    createDecks();
    dealInitialHands();
    updateGameDisplay();
    
    console.log('✅ Jogo reiniciado!');
}

/**
 * Muda a dificuldade do jogo
 */
function changeDifficulty(newDifficulty) {
    if (gameState.gameEnded || gameState.turn === 1) {
        gameState.difficulty = newDifficulty;
        
        // Recriar decks com nova dificuldade
        createDecks();
        dealInitialHands();
        updateGameDisplay();
        
        showTemporaryMessage(`Dificuldade alterada para: ${DIFFICULTY_SETTINGS[newDifficulty].name}`);
    }
}

// =============================================
// MODAL E MENSAGENS
// =============================================

/**
 * Mostra modal de resultado
 */
function showResultModal(message, modalClass, result) {
    elements.modalMessage.innerHTML = message;
    elements.modalContent.className = `modal-content ${modalClass}`;
    
    // Estatísticas detalhadas
    const statsHTML = `
        <div>Pontuação: <span class="stat-value">${gameState.score}</span></div>
        <div>Sequência de Vitórias: <span class="stat-value">${gameState.winStreak}</span></div>
        <div>Total: <span class="stat-value">${gameState.totalWins}/${gameState.totalGames}</span></div>
        <div>Dificuldade: <span class="stat-value">${DIFFICULTY_SETTINGS[gameState.difficulty].name}</span></div>
    `;
    
    elements.modalStats.innerHTML = statsHTML;
    elements.resultModal.style.display = 'flex';
}

/**
 * Esconde o modal
 */
function hideModal() {
    elements.resultModal.style.display = 'none';
}

/**
 * Mostra mensagem temporária
 */
function showTemporaryMessage(message) {
    if (!elements.battleResult) return;
    
    // Não mostrar mensagens temporárias se o jogo acabou
    if (gameState.gameEnded) return;
    
    // Limpar timeout anterior se existir
    if (window.messageTimeout) {
        clearTimeout(window.messageTimeout);
    }
    
    elements.battleResult.innerHTML = message.replace(/\n/g, '<br>');
    elements.battleResult.className = 'battle-result active';
    elements.battleResult.style.display = 'block';
    
    // Auto-esconder após 1 segundos
    window.messageTimeout = setTimeout(() => {
        hideTemporaryMessage();
    }, 2000);
}

/**
 * Esconde a mensagem temporária imediatamente
 */
function hideTemporaryMessage() {
    if (!elements.battleResult) return;
    
    elements.battleResult.style.display = 'none';
    elements.battleResult.className = 'battle-result';
    
    // Limpar qualquer timeout pendente
    if (window.messageTimeout) {
        clearTimeout(window.messageTimeout);
        window.messageTimeout = null;
    }
}

/**
 * Limpa seleção e mensagem ao clicar em áreas vazias
 */
function setupClickOutsideHandler() {
    document.addEventListener('click', (e) => {
        // Se clicou fora das cartas e arenas, limpar seleção
        const isCardClick = e.target.closest('.hand-card');
        const isArenaClick = e.target.closest('.arena');
        const isControlClick = e.target.closest('button');
        
        if (!isCardClick && !isArenaClick && !isControlClick && gameState.selectedCardId !== null) {
            hideTemporaryMessage();
            gameState.selectedCardId = null;
            
            // Remover destaque das cartas
            elements.playerHand.querySelectorAll('.hand-card').forEach(cardEl => {
                cardEl.classList.remove('selected');
            });
            
            console.log('🧹 Seleção limpa (clique fora)');
        }
    });
}



// =============================================
// MANIPULAÇÃO DE EVENTOS
// =============================================

/**
 * Manipula clique na arena
 */
function handleArenaClick(e) {
    if (gameState.currentPlayer === 'player' && !gameState.gameEnded && gameState.selectedCardId !== null) {
        const arenaElement = e.target.closest('.arena');
        if (arenaElement) {
            const arenaId = parseInt(arenaElement.dataset.arena);
            playCardToArena(arenaId);
        }
    }
}

// =============================================
// ANIMAÇÕES
// =============================================

/**
 * Animação de carta sendo jogada na arena
 */
async function animateCardToArena(cardElement, arenaId, cardData) {
    return new Promise((resolve) => {
        if (!cardElement) {
            resolve();
            return;
        }
        
        // Criar overlay de animação se não existir
        let animationOverlay = document.querySelector('.animation-overlay');
        if (!animationOverlay) {
            animationOverlay = document.createElement('div');
            animationOverlay.className = 'animation-overlay';
            document.body.appendChild(animationOverlay);
        }
        
        // Clonar carta para animação
        const cardClone = cardElement.cloneNode(true);
        
        // Posição inicial
        const startRect = cardElement.getBoundingClientRect();
        cardClone.style.position = 'fixed';
        cardClone.style.left = startRect.left + 'px';
        cardClone.style.top = startRect.top + 'px';
        cardClone.style.width = startRect.width + 'px';
        cardClone.style.height = startRect.height + 'px';
        cardClone.style.margin = '0';
        cardClone.style.zIndex = '10000';
        cardClone.style.pointerEvents = 'none';
        
        // Posição final
        const arenaElement = document.getElementById(`arena-${arenaId}`);
        const playerSide = arenaElement.querySelector('.player-side');
        const arenaRect = playerSide.getBoundingClientRect();
        
        const endX = arenaRect.left + (arenaRect.width / 2) - (startRect.width * 0.15);
        const endY = arenaRect.top + (arenaRect.height / 2) - (startRect.height * 0.15);
        
        const moveX = endX - startRect.left;
        const moveY = endY - startRect.top;
        
        // Configurar animação
        cardClone.style.setProperty('--start-x', '0px');
        cardClone.style.setProperty('--start-y', '0px');
        cardClone.style.setProperty('--move-x', moveX + 'px');
        cardClone.style.setProperty('--move-y', moveY + 'px');
        
        cardClone.classList.add('card-moving');
        animationOverlay.appendChild(cardClone);
        
        // Esconder carta original
        cardElement.style.visibility = 'hidden';
        
        // Finalizar animação
        setTimeout(() => {
            cardClone.remove();
            animateCardInArena(arenaId);
            resolve();
        }, 800);
    });
}

/**
 * Animação de carta chegando na arena
 */
function animateCardInArena(arenaId) {
    const arenaContainer = document.getElementById(`arena-${arenaId}-player`);
    const cardElements = arenaContainer.querySelectorAll('.arena-card');
    const lastCard = cardElements[cardElements.length - 1];
    
    if (lastCard) {
        lastCard.classList.add('arena-card-arrival');
        setTimeout(() => {
            lastCard.classList.remove('arena-card-arrival');
        }, 1200);
    }
}

/**
 * Animação de carta do oponente
 */
async function animateOpponentCard(arenaId, cardData) {
    return new Promise((resolve) => {
        const animationOverlay = document.querySelector('.animation-overlay') || 
                               document.createElement('div');
        if (!animationOverlay.parentNode) {
            animationOverlay.className = 'animation-overlay';
            document.body.appendChild(animationOverlay);
        }
        
        // Criar elemento simplificado da carta
        const cardElement = document.createElement('div');
        cardElement.className = 'card moving-opponent-card';
        cardElement.innerHTML = `
            <div class="card-header">${cardData.name}</div>
            <div class="card-image" style="background-image: url('${cardData.image}')"></div>
        `;
        
        // Posicionar e animar
        cardElement.style.position = 'fixed';
        cardElement.style.right = '-200px';
        cardElement.style.top = '50%';
        cardElement.style.transform = 'translateY(-50%)';
        cardElement.style.width = '150px';
        cardElement.style.height = '200px';
        cardElement.style.zIndex = '10000';
        cardElement.style.pointerEvents = 'none';
        
        animationOverlay.appendChild(cardElement);
        
        // Animar entrada
        const arenaElement = document.getElementById(`arena-${arenaId}`);
        const opponentSide = arenaElement.querySelector('.opponent-side');
        const arenaRect = opponentSide.getBoundingClientRect();
        
        cardElement.style.transition = 'all 0.6s ease-out';
        cardElement.style.right = (window.innerWidth - arenaRect.right + 75) + 'px';
        cardElement.style.top = (arenaRect.top + arenaRect.height / 2 - 100) + 'px';
        cardElement.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            cardElement.remove();
            animateCardInArenaOpponent(arenaId);
            resolve();
        }, 600);
    });
}

/**
 * Animação de carta do oponente chegando na arena
 */
function animateCardInArenaOpponent(arenaId) {
    const arenaContainer = document.getElementById(`arena-${arenaId}-opponent`);
    const cardElements = arenaContainer.querySelectorAll('.arena-card');
    const lastCard = cardElements[cardElements.length - 1];
    
    if (lastCard) {
        lastCard.classList.add('arena-card-arrival');
        setTimeout(() => {
            lastCard.classList.remove('arena-card-arrival');
        }, 800);
    }
}

/**
 * Animação de compra de carta
 */
function animateCardDraw(cardElement) {
    cardElement.classList.add('card-drawing');
    setTimeout(() => {
        cardElement.classList.remove('card-drawing');
    }, 500);
}

// =============================================
// INICIALIZAÇÃO
// =============================================

// Iniciar jogo quando a página carregar
document.addEventListener('DOMContentLoaded', initGame);

// Prevenir ações padrão para melhor UX
document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('hand-card')) {
        e.preventDefault();
    }
});
