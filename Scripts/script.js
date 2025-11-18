// =============================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// =============================================

// Configurações de dificuldade
const DIFFICULTY_SETTINGS = {
    1: { name: "Iniciante", opponentBuff: 0, turnTime: 90, description: "Bom para aprender as mecânicas" },
    2: { name: "Intermediário", opponentBuff: 10, turnTime: 90, description: "Oponente mais estratégico" },
    3: { name: "Avançado", opponentBuff: 20, turnTime: 90, description: "Desafio significativo" },
    4: { name: "Especialista", opponentBuff: 30, turnTime: 90, description: "Para mestres da estratégia" },
    5: { name: "Lendário", opponentBuff: 40, turnTime: 30, description: "O desafio máximo" }
};

// Estado do jogo
const gameState = {
    // Controle de jogo
    turn: 1,
    maxTurns: 4,
    currentPlayer: 'player',
    gameEnded: false,
    
    // Cartas
    playerHand: [],
    opponentHand: [],
    playerDeck: [],
    opponentDeck: [],
    // Simulação determinística da mão/deck do oponente (multiplayer)
    simOpponentHand: [],
    simOpponentDeck: [],
    clientId: Math.random().toString(36).slice(2) + Date.now(),
    // Delay de alternância de vez (multiplayer)
    turnChangeTimeoutId: null,
    turnChangeIntervalId: null,
    turnChangeCountdown: 0,
    roomCurrentPlayerId: null,
    pendingNextCurrent: null,
    turnChangeLock: false,
    // Última ação de sala processada
    lastActionIdProcessed: null,
    processedActionIds: [],
    selectedCardId: null,
    
    // Arenas
    arenas: {
        1: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: null, disabled: false },
        2: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: null, disabled: false },
        3: { player: [], opponent: [], playerPower: 0, opponentPower: 0, arena: null, disabled: false }
    },
    
    // Progressão
    score: 0,
    difficulty: 1,
    winStreak: 0,
    totalWins: 0,
    totalGames: 0,
    opponentBuff: 0,
    
    // Timer
    turnTime: 90,
    timeLeft: 90,
    timerInterval: null,
    resultShown: false
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
    closeModal: document.querySelector('.close-modal'),

    // Multiplayer UI
    openMultiplayerBtn: document.getElementById('open-multiplayer-btn'),
    multiplayerModal: document.getElementById('multiplayer-modal'),
    mpUsername: document.getElementById('mp-username'),
    mpRoomCode: document.getElementById('mp-room-code'),
    mpGenerateBtn: document.getElementById('mp-generate'),
    mpJoinBtn: document.getElementById('mp-join'),
    mpReadyBtn: document.getElementById('mp-ready'),
    mpGeneratedCode: document.getElementById('mp-generated-code'),
    multiplayerClose: document.getElementById('multiplayer-close')
};

// =============================================
// INICIALIZAÇÃO DO JOGO
// =============================================

/**
 * Inicializa o jogo quando a página carrega
 */
function initGame() {
    console.log('🎮 Inicializando jogo...');
    
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

    setupDifficultySelector();
    
    // Verificar elementos críticos
    if (!elements.playerHand) {
        console.error('❌ Elemento player-hand não encontrado!');
        return;
    }
    const difficultySettings = DIFFICULTY_SETTINGS[gameState.difficulty];
    gameState.turnTime = difficultySettings.turnTime;
    gameState.timeLeft = difficultySettings.turnTime;
    gameState.opponentBuff = difficultySettings.opponentBuff;
    //gameState.opponentBuff = DIFFICULTY_SETTINGS[gameState.difficulty].opponentBuff;
    
    setupEventListeners();
    setupMultiplayerUI();
    setupClickOutsideHandler();
    // Em multiplayer, inicialize arenas de forma determinística usando seed da sala
    if (isMultiplayerMode()) {
        const code = getURLParam('code');
        // neutralizar buff em multiplayer para resultados consistentes
        gameState.opponentBuff = 0;
        if (code && window.Multiplayer && Multiplayer.getRoomOnce) {
            Multiplayer.getRoomOnce(code).then(room => {
                // Use seed da sala; se indisponível, derive do código para manter sincronização
                const derivedSeed = (room && room.gameSeed) ? room.gameSeed : hashString(code);
                gameState.multiplayerSeed = derivedSeed;
                setupArenas(derivedSeed);
                createDecks();
                // Finalizar renderização somente após decks criados
                dealInitialHands();
                renderUniverseCatalogs();
                updateGameDisplay();
            }).catch(() => {
                // Fallback determinístico usando o código da sala
                const fallbackSeed = hashString(code);
                gameState.multiplayerSeed = fallbackSeed;
                setupArenas(fallbackSeed);
                createDecks();
                dealInitialHands();
                renderUniverseCatalogs();
                updateGameDisplay();
            });
        } else {
            // Caso extremo: sem código/sala, seguir fluxo padrão (não sincronizado)
            setupArenas();
            createDecks();
            dealInitialHands();
            renderUniverseCatalogs();
            updateGameDisplay();
        }
    } else {
        setupArenas();
        createDecks();
        dealInitialHands();
        // Renderizar catálogos de cartas dos universos
        renderUniverseCatalogs();
        updateGameDisplay();
    }
    
    console.log('✅ Jogo inicializado! Dificuldade:', gameState.difficulty, 'Opponent Buff:', gameState.opponentBuff);
    // Modo multiplayer: oculta botão de lobby e começa a escutar a sala
    if (isMultiplayerMode()) {
        const code = getURLParam('code');
        elements.openMultiplayerBtn && (elements.openMultiplayerBtn.style.display = 'none');
        if (code && window.Multiplayer && Multiplayer.listenRoom) {
            Multiplayer.listenRoom(code, (data) => updateMultiplayerStatusUI(data));
            if (Multiplayer.listenActions) {
                Multiplayer.listenActions(code, handleRemoteAction);
            }
            showTemporaryMessage(`Multiplayer ativo • Sala ${code}`);
        }
    }
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
    elements.playerHost = document.getElementById('player-host');
    elements.playerGuest = document.getElementById('player-guest');
    
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
    // Em páginas sem seletor de dificuldade (ex.: multiplayer_game.html), apenas ignore
    if (!elements.difficultySelect) {
        console.log('ℹ️ Seletor de dificuldade não presente nesta página. Ignorando configuração.');
        return;
    }

    elements.difficultySelect.value = gameState.difficulty;
    
    elements.difficultySelect.addEventListener('change', (e) => {
        const newDifficulty = parseInt(e.target.value);
        
        console.log('🎯 EVENTO CHANGE - Dificuldade selecionada:', {
            novoValor: newDifficulty,
            valorAntigo: gameState.difficulty,
            elementoValue: e.target.value,
            tipo: typeof newDifficulty
        });
        
        if (gameState.gameEnded || gameState.turn === 1 || confirm('Mudar a dificuldade reiniciará o jogo. Continuar?')) {
            console.log('✅ Pode mudar dificuldade');
            changeDifficulty(newDifficulty);
        } else {
            console.log('❌ Não pode mudar agora');
            if (elements.difficultySelect) {
                elements.difficultySelect.value = gameState.difficulty;
            }
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
 * Configura UI e eventos do modal de Multiplayer
 */
function setupMultiplayerUI() {
    // Se não existir o botão/modal, não faz nada
    if (!elements.openMultiplayerBtn || !elements.multiplayerModal) return;

    // Abrir/fechar modal
    elements.openMultiplayerBtn.addEventListener('click', showMultiplayerModal);
    elements.multiplayerClose && elements.multiplayerClose.addEventListener('click', hideMultiplayerModal);
    elements.multiplayerModal.addEventListener('click', (e) => {
        if (e.target === elements.multiplayerModal) hideMultiplayerModal();
    });

    // Gerar sala
    elements.mpGenerateBtn && elements.mpGenerateBtn.addEventListener('click', async () => {
        const username = (elements.mpUsername?.value || '').trim();
        if (!username) { showTemporaryMessage('Informe seu nome para gerar o código.'); return; }
        if (!window.Multiplayer || !Multiplayer.createRoom) { showTemporaryMessage('Multiplayer não inicializado.'); return; }
        try {
            const result = await Multiplayer.createRoom(username);
            const code = result.code;
            elements.mpRoomCode.value = code;
            elements.mpGeneratedCode.textContent = `Código gerado: ${code}`;
            showTemporaryMessage('Sala criada. Compartilhe o código com seu amigo.');
            // Começa a escutar atualizações da sala
            Multiplayer.listenRoom(code, (data) => updateMultiplayerStatusUI(data));
        } catch (err) {
            console.error('Erro ao criar sala:', err);
            showTemporaryMessage('Erro ao criar sala. Verifique o Firebase.');
        }
    });

    // Entrar na sala
    elements.mpJoinBtn && elements.mpJoinBtn.addEventListener('click', async () => {
        const username = (elements.mpUsername?.value || '').trim();
        const code = (elements.mpRoomCode?.value || '').trim().toUpperCase();
        if (!username || !code) { showTemporaryMessage('Informe nome e código da sala.'); return; }
        if (!window.Multiplayer || !Multiplayer.joinRoom) { showTemporaryMessage('Multiplayer não inicializado.'); return; }
        try {
            await Multiplayer.joinRoom(code, username);
            elements.mpGeneratedCode.textContent = `Conectado à sala ${code}`;
            showTemporaryMessage('Entrou na sala. Aguarde o outro jogador.');
            Multiplayer.listenRoom(code, (data) => updateMultiplayerStatusUI(data));
        } catch (err) {
            console.error('Erro ao entrar na sala:', err);
            showTemporaryMessage('Não foi possível entrar na sala.');
        }
    });

    // Ficar pronto
    elements.mpReadyBtn && elements.mpReadyBtn.addEventListener('click', async () => {
        const code = (elements.mpRoomCode?.value || '').trim().toUpperCase();
        if (!code) { showTemporaryMessage('Nenhuma sala selecionada.'); return; }
        try {
            await Multiplayer.setReady(code, true);
            // tenta iniciar se ambos estiverem prontos
            Multiplayer.startIfBothReady && Multiplayer.startIfBothReady(code);
            showTemporaryMessage('Você está pronto!');
        } catch (err) {
            console.error('Erro ao marcar pronto:', err);
        }
    });
}

function showMultiplayerModal() {
    elements.multiplayerModal?.classList.add('show');
}

function hideMultiplayerModal() {
    elements.multiplayerModal?.classList.remove('show');
}
// Utilitários de URL/modo
function getURLParam(key) {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}

// Remove valores undefined de objetos/arrays para compatibilidade com Firestore
function sanitizeForFirestore(value) {
    if (value === undefined) return null;
    if (value === null) return null;
    if (Array.isArray(value)) {
        return value.map(sanitizeForFirestore);
    }
    if (typeof value === 'object') {
        const out = {};
        for (const k in value) {
            const v = value[k];
            if (v === undefined) continue;
            const sv = sanitizeForFirestore(v);
            out[k] = sv;
        }
        return out;
    }
    return value;
}

// Inicia contador visual de 5s para alternância de vez em multiplayer
function startTurnChangeCountdown() {
    if (!isMultiplayerMode()) return;
    if (gameState.turnChangeTimeoutId) {
        clearTimeout(gameState.turnChangeTimeoutId);
        gameState.turnChangeTimeoutId = null;
    }
    if (gameState.turnChangeIntervalId) {
        clearInterval(gameState.turnChangeIntervalId);
        gameState.turnChangeIntervalId = null;
    }
    gameState.turnChangeCountdown = 5;
    gameState.turnChangeIntervalId = setInterval(() => {
        gameState.turnChangeCountdown = Math.max(0, gameState.turnChangeCountdown - 1);
        updateGameDisplay();
        if (gameState.turnChangeCountdown === 0) {
            clearInterval(gameState.turnChangeIntervalId);
            gameState.turnChangeIntervalId = null;
        }
    }, 1000);
}

function isMultiplayerMode() {
    const mode = getURLParam('mode');
    return mode === 'mp';
}

function updateMultiplayerStatusUI(roomData) {
    // Atualiza feedback simples no modal conforme estado da sala
    if (!roomData) return;
    const { status, players } = roomData;
    // 🔁 Se a seed da partida mudou, reinicializa localmente com a nova seed para sincronizar arenas
    if (isMultiplayerMode()) {
        const code = getURLParam('code');
        const newSeed = roomData.gameSeed || (code ? hashString(code) : null);
        if (newSeed && newSeed !== gameState.multiplayerSeed) {
            console.log('🔁 Detectado nova seed na sala. Reiniciando com seed:', newSeed);
            gameState.multiplayerSeed = newSeed;
            restartMultiplayerWithSeed(newSeed);
        }
    }
    let text = `Status: ${status || 'desconhecido'}`;
    if (players) {
        const names = Object.values(players).map(p => `${p.username}${p.ready ? ' ✅' : ''}`).join(' vs ');
        text += ` | Jogadores: ${names}`;
    }
    if (elements.mpGeneratedCode) {
        elements.mpGeneratedCode.textContent = text;
    }
    // Sincronizar turno e vez com estado da sala
    try {
        const myUid = (window.Multiplayer && Multiplayer.getUid) ? Multiplayer.getUid() : null;
        if (typeof roomData.turn === 'number') {
            gameState.turn = roomData.turn;
        }
        // Força mapeamento inicial por role no turno 1
        if (roomData.status === 'playing' && roomData.turn === 1) {
            const role = getURLParam('role');
            const hostId = roomData.hostId;
            const starterId = roomData.currentPlayer || hostId;
            let nextCurrent;
            if (role === 'host') {
                nextCurrent = (starterId === hostId) ? 'player' : 'opponent';
            } else if (role === 'guest') {
                nextCurrent = (starterId === hostId) ? 'opponent' : 'player';
            } else {
                nextCurrent = (starterId === hostId) ? 'player' : 'opponent';
            }
            gameState.currentPlayer = nextCurrent;
            gameState.roomCurrentPlayerId = starterId;
            updateGameDisplay();
        }
        // Processar última ação espelhada no doc da sala (fallback)
        if (roomData.lastAction && roomData.lastAction.id && roomData.lastAction.id !== gameState.lastActionIdProcessed) {
            try {
                gameState.lastActionIdProcessed = roomData.lastAction.id;
                handleRemoteAction({ action: roomData.lastAction, uid: null, id: roomData.lastAction.id });
            } catch (e) {
                console.warn('Falha ao processar lastAction da sala:', e);
            }
        }
        // Tratativa inicial ao entrar/reiniciar: definir vez sem depender de UID
        if (!gameState.roomCurrentPlayerId && roomData.status === 'playing' && roomData.currentPlayer) {
            const role = getURLParam('role');
            const hostId = roomData.hostId;
            const starterId = roomData.currentPlayer;
            let nextCurrent;
            if (role === 'host') {
                nextCurrent = (starterId === hostId) ? 'player' : 'opponent';
            } else if (role === 'guest') {
                nextCurrent = (starterId === hostId) ? 'opponent' : 'player';
            } else {
                // Sem role, usar mapeamento pelo hostId
                nextCurrent = (starterId === hostId) ? 'player' : 'opponent';
            }
            if (nextCurrent) {
                gameState.currentPlayer = nextCurrent;
                gameState.roomCurrentPlayerId = starterId;
                updateGameDisplay();
            }
        }

        if (roomData.currentPlayer) {
            const prevRoomId = gameState.roomCurrentPlayerId;
            const newRoomId = roomData.currentPlayer;
            const hostId = roomData.hostId;
            const role = getURLParam('role');
            if (newRoomId !== prevRoomId) {
                gameState.roomCurrentPlayerId = newRoomId;
                let nextCurrent;
                const isHostTurn = newRoomId === hostId;
                if (role === 'host') {
                    nextCurrent = isHostTurn ? 'player' : 'opponent';
                } else if (role === 'guest') {
                    nextCurrent = isHostTurn ? 'opponent' : 'player';
                } else {
                    nextCurrent = isHostTurn ? 'player' : 'opponent';
                }
                gameState.currentPlayer = nextCurrent;
                // Bloqueia ações por 5s para dar tempo de efeitos/animações
                gameState.turnChangeLock = true;
                if (gameState.turnChangeTimeoutId) { clearTimeout(gameState.turnChangeTimeoutId); }
                if (gameState.turnChangeIntervalId) { clearInterval(gameState.turnChangeIntervalId); }
                gameState.turnChangeCountdown = 5;
                gameState.turnChangeIntervalId = setInterval(() => {
                    gameState.turnChangeCountdown = Math.max(0, gameState.turnChangeCountdown - 1);
                    updateGameDisplay();
                    if (gameState.turnChangeCountdown === 0) {
                        clearInterval(gameState.turnChangeIntervalId);
                        gameState.turnChangeIntervalId = null;
                    }
                }, 1000);
                gameState.turnChangeTimeoutId = setTimeout(() => {
                    gameState.turnChangeCountdown = 0;
                    gameState.turnChangeLock = false;
                    updateGameDisplay();
                    gameState.turnChangeTimeoutId = null;
                }, 5000);
            }
        }
        updateGameDisplay();
    } catch (_) {}
    const listElHost = elements.playerHost;
    const listElGuest = elements.playerGuest;
    if (listElHost && listElGuest && roomData && roomData.players) {
        const hostId = roomData.hostId;
        const players = roomData.players;
        const uids = Object.keys(players);
        const host = players[hostId] || null;
        const otherId = uids.find(id => id !== hostId);
        const guest = otherId ? players[otherId] : null;
        const isHostTurn = roomData && roomData.currentPlayer && roomData.currentPlayer === hostId;
        if (host) {
            listElHost.textContent = host.username || 'Host';
            if (host.online === false) {
                listElHost.className = 'player-badge status-offline';
            } else {
                listElHost.className = 'player-badge ' + (isHostTurn ? 'status-online' : 'status-offline');
            }
        } else {
            listElHost.textContent = 'Host';
            listElHost.className = 'player-badge status-online';
        }
        if (guest) {
            listElGuest.textContent = guest.username || 'Guest';
            if (guest.online === false) {
                listElGuest.className = 'player-badge status-offline';
            } else {
                listElGuest.className = 'player-badge ' + (!isHostTurn ? 'status-online' : 'status-offline');
            }
        } else {
            listElGuest.textContent = 'Aguardando convidado';
            listElGuest.className = 'player-badge';
        }
    }
    // Se a sala mudou para 'playing', podemos fechar modal
    if (status === 'playing') {
        hideMultiplayerModal();
        // Mostrar mensagem de partida iniciada apenas no lobby, não durante o jogo
        if (!isMultiplayerMode()) {
            showTemporaryMessage('Partida iniciada!');
            const code = (elements.mpRoomCode?.value || '').trim().toUpperCase() || roomData.code;
            const uid = (window.Multiplayer && Multiplayer.getUid) ? Multiplayer.getUid() : null;
            const role = roomData.hostId && uid && roomData.hostId === uid ? 'host' : 'guest';
            const url = `index.html?mode=mp&code=${encodeURIComponent(code)}&role=${encodeURIComponent(role || '')}`;
            console.log('🔀 Redirecionando para tela multiplayer:', url);
            window.location.href = url;
        }
    }

    // Encerramento coordenado pela sala
    if (roomData.status === 'ended' && !gameState.gameEnded) {
        gameState.gameEnded = true;
        gameState.currentPlayer = 'none';
        setTimeout(() => {
            if (gameState.resultShown) return;
            try {
                const result = calculateGameResult();
                const { difficultyChanged, oldDifficulty } = updateGameStats(result);
                showGameResult(result, difficultyChanged, oldDifficulty);
                gameState.resultShown = true;
                updateGameDisplay();
            } catch (e) {}
        }, 300);
    }
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
    
    // 🔥 SEMPRE usar o tempo da dificuldade atual
    const difficultySettings = DIFFICULTY_SETTINGS[gameState.difficulty];
    gameState.turnTime = difficultySettings.turnTime;
    gameState.timeLeft = gameState.turnTime;
    
    console.log(`⏰ Timer configurado: ${gameState.turnTime}s para dificuldade ${gameState.difficulty}`);
    
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
    console.log('⏰ UPDATE TIMER DISPLAY - Iniciando...', {
        timeLeft: gameState.timeLeft,
        turnTime: gameState.turnTime,
        difficulty: gameState.difficulty
    });
    
    if (!elements.timer || !elements.timerProgressBar) {
        console.error('❌ Elementos do timer não encontrados!');
        return;
    }
    
    // Atualizar número
    elements.timer.textContent = gameState.timeLeft;
    
    // Atualizar barra de progresso
    const percentage = (gameState.timeLeft / gameState.turnTime) * 100;
    elements.timerProgressBar.style.width = `${Math.max(0, percentage)}%`;
    
    console.log('📊 Timer atualizado:', {
        display: elements.timer.textContent,
        percentage: percentage + '%',
        width: elements.timerProgressBar.style.width
    });
    
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
async function timeUp() {
    console.log('⏰ Tempo esgotado!');
    
    if (gameState.currentPlayer === 'player' && !gameState.gameEnded) {
        // Feedback visual
        elements.timerContainer.style.animation = 'flash-red 0.5s 3';
        
        // Mensagem para o jogador
        showTemporaryMessage('⏰ Tempo esgotado! Turno do oponente.');
        
        // Em multiplayer, não altera localmente; envia PASS para sala
        if (isMultiplayerMode()) {
            const code = getURLParam('code');
            try {
                if (code && window.Multiplayer && Multiplayer.sendAction) {
                    const actionId = Math.random().toString(36).slice(2) + Date.now();
                    const actionPayload = { id: actionId, type: 'pass', clientId: gameState.clientId };
                    const sanitized = sanitizeForFirestore(actionPayload);
                    Multiplayer.sendAction(code, sanitized);
                    if (window.Multiplayer && Multiplayer.updateGameState) {
                        Multiplayer.updateGameState(code, { lastAction: sanitized });
                    }
                }
                await tryAutoTeleportNightcrawler();
                await tryRegenerationWolverine();
                if (window.Multiplayer && Multiplayer.recordPlay && code) {
                    Multiplayer.recordPlay(code);
                }
            } catch (err) {
                console.warn('Não foi possível enviar PASS no multiplayer (timeUp):', err);
            }
        } else {
            // Passar turno para oponente (singleplayer)
            gameState.currentPlayer = 'opponent';
        }
        
        // Atualizar display e iniciar jogada da IA
        setTimeout(() => {
            updateGameDisplay();
            if (!isMultiplayerMode()) {
                opponentPlay();
            }
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
    let shuffled;
    if (isMultiplayerMode() && typeof seededRandom === 'function') {
        const baseSeed = gameState.multiplayerSeed || 123456;
        const rng = seededRandom(baseSeed);
        const arr = [...allCharacters];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        shuffled = arr;
    } else {
        shuffled = shuffleArray(allCharacters);
    }
    
    // Pegar 24 cartas determinísticas para os decks em multiplayer
    const availableCards = shuffled.slice(0, 24);
    
    if (isMultiplayerMode()) {
        const role = getURLParam('role');
        const playerFirst = role === 'host';
        const firstHalf = availableCards.slice(0, 12).map(cloneCard);
        const secondHalf = availableCards.slice(12, 24).map(cloneCard);
        gameState.playerDeck = playerFirst ? firstHalf : secondHalf;
        gameState.opponentDeck = playerFirst ? secondHalf : firstHalf;
    } else {
        gameState.playerDeck = selectDeckForPlayer(availableCards);
        gameState.opponentDeck = selectDeckForOpponent(availableCards);
    }
    
    console.log(`🎴 Decks criados: Jogador ${gameState.playerDeck.length}, Oponente ${gameState.opponentDeck.length} cartas`);
}

/**
 * Seleciona deck para o jogador
 */
function selectDeckForPlayer(cards) {
    return shuffleArray([...cards]).slice(0, 12).map(cloneCard);
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
    
    return shuffleArray(selectedCards).map(cloneCard);
}

/**
 * Distribui cartas iniciais
 */
function dealInitialHands() {
    gameState.playerHand = gameState.playerDeck.splice(0, 4);
    gameState.opponentHand = gameState.opponentDeck.splice(0, 4);
    if (isMultiplayerMode()) {
        gameState.simOpponentDeck = [...gameState.opponentDeck];
        gameState.simOpponentHand = [...gameState.opponentHand];
    }
    
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
    if (gameState.arenas[arenaId] && gameState.arenas[arenaId].disabled) {
        showTemporaryMessage('Arena devorada: não é possível jogar cartas aqui');
        return;
    }
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
    gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
    gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
    
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

    // Enviar ação para o oponente (multiplayer)
    if (isMultiplayerMode()) {
        const code = getURLParam('code');
        try {
            if (code && window.Multiplayer && Multiplayer.sendAction) {
                const sendCard = { ...card };
                if (sendCard.ability) {
                    sendCard.ability = { ...sendCard.ability };
                    delete sendCard.ability.used;
                }
                const actionId = Math.random().toString(36).slice(2) + Date.now();
                const actionPayload = { id: actionId, type: 'play', arenaId, card: sendCard, clientId: gameState.clientId };
                const sanitized = sanitizeForFirestore(actionPayload);
                await Multiplayer.sendAction(code, sanitized);
                if (window.Multiplayer && Multiplayer.updateGameState) {
                    await Multiplayer.updateGameState(code, { lastAction: sanitized });
                }
                if (Multiplayer.recordPlay) {
                    await Multiplayer.recordPlay(code);
                }
                // Ajuste imediato no doc: passar vez para o outro jogador
                try {
                    if (window.Multiplayer && Multiplayer.getRoomOnce && Multiplayer.updateGameState) {
                        const room = await Multiplayer.getRoomOnce(code);
                        if (room && room.players) {
                            const hostId = room.hostId;
                            const uids = Object.keys(room.players);
                            const myUidNow = (window.Multiplayer && Multiplayer.getUid) ? Multiplayer.getUid() : null;
                            const otherId = myUidNow === hostId ? uids.find(id => id !== hostId) : hostId;
                            if (otherId) {
                                await Multiplayer.updateGameState(code, { currentPlayer: otherId });
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Falha ao ajustar currentPlayer no doc após play:', e);
                }
                showTemporaryMessage('Aguardando oponente... alterna em até 5s');
                elements.endTurnBtn.disabled = true;
            }
        } catch (err) {
            console.warn('Não foi possível enviar ação multiplayer:', err);
        }
    }

    // Habilidade ao jogar
    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'reveal' && !card.ability.used) {
        let pool = isMultiplayerMode() ? gameState.simOpponentHand : gameState.opponentHand;
        if (!pool || pool.length === 0) {
            // Fallback seguro: tenta usar mão conhecida ou reconstruir a simulação
            if (isMultiplayerMode() && gameState.opponentHand && gameState.opponentHand.length) {
                pool = gameState.opponentHand;
            } else {
                pool = [];
            }
        }
        const count = Math.max(1, Math.min(card.ability.value || 2, pool.length));
        const indices = [];
        for (let i = 0; i < pool.length; i++) indices.push(i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = indices[i];
            indices[i] = indices[j];
            indices[j] = t;
        }
        const revealed = indices.slice(0, count).map(idx => pool[idx]?.name).filter(Boolean);
        if (revealed.length > 0) {
            showTemporaryMessage(`Sentido Aranha: ${revealed.join(', ')}`);
            card.ability.used = true;
        }
    }

    // Habilidade: Roubo Aleatório (Coringa)
    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'steal' && !card.ability.used) {
        const pool = gameState.arenas[arenaId].opponent;
        if (pool && pool.length > 0) {
            let idx = 0;
            if (isMultiplayerMode()) {
                const baseSeed = Number(gameState.multiplayerSeed || 0) ^ (arenaId * 2654435761) ^ hashString(String(card.id)) ^ (gameState.turn || 1);
                const rnd = seededRandom(baseSeed);
                idx = Math.floor(rnd() * pool.length);
            } else {
                idx = Math.floor(Math.random() * pool.length);
            }
            const stolen = pool.splice(idx, 1)[0];
            gameState.arenas[arenaId].player.push(stolen);
            gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
            gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
            updateArenasDisplay();
            card.ability.used = true;
            if (isMultiplayerMode()) {
                const code = getURLParam('code');
                try {
                    if (code && window.Multiplayer && Multiplayer.sendAction) {
                        const actionId = Math.random().toString(36).slice(2) + Date.now();
                        const payload = { id: actionId, type: 'steal', arenaId, card: sanitizeForFirestore(stolen), clientId: gameState.clientId };
                        const sanitized = sanitizeForFirestore(payload);
                        await Multiplayer.sendAction(code, sanitized);
                        if (Multiplayer.updateGameState) {
                            await Multiplayer.updateGameState(code, { lastAction: sanitized });
                        }
                    }
                } catch (_) {}
            }
        } else {
            showTemporaryMessage('Coringa: nada para roubar nesta arena');
        }
    }

    // Habilidade: Metamorfose (Caçador de Marte)
    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'morph_to_strongest' && !card.ability.used) {
        const opp = gameState.arenas[arenaId].opponent;
        if (opp && opp.length > 0) {
            let bestIdx = 0;
            let bestVal = -Infinity;
            const hasHackPlayer = (gameState.arenas[arenaId].player || []).some(c => c && c.ability && c.ability.id === 'hack');
            for (let i = 0; i < opp.length; i++) {
                const oc = opp[i];
                const base = calculateCardPower(oc);
                const arenaBonus = (typeof applyArenaEffect === 'function' && gameState.arenas[arenaId].arena)
                    ? applyArenaEffect(oc, gameState.arenas[arenaId].arena, 'opponent')
                    : 0;
                const difficultyBonus = (!isMultiplayerMode() ? gameState.opponentBuff || 0 : 0);
                let val = base + arenaBonus + difficultyBonus;
                if (hasHackPlayer) val = Math.floor(val * 0.9);
                if (val > bestVal) { bestVal = val; bestIdx = i; }
            }
            const target = opp[bestIdx];
            card.strength = target.strength || 0;
            card.intelligence = target.intelligence || 0;
            card.speed = target.speed || 0;
            card.durability = target.durability || 0;
            gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
            updateArenasDisplay();
            card.ability.used = true;
            if (isMultiplayerMode()) {
                const code = getURLParam('code');
                try {
                    if (code && window.Multiplayer && Multiplayer.sendAction) {
                        const actionId = Math.random().toString(36).slice(2) + Date.now();
                        const payload = { id: actionId, type: 'morph', arenaId, cardId: card.id, stats: { strength: card.strength, intelligence: card.intelligence, speed: card.speed, durability: card.durability }, clientId: gameState.clientId };
                        const sanitized = sanitizeForFirestore(payload);
                        await Multiplayer.sendAction(code, sanitized);
                        if (Multiplayer.updateGameState) {
                            await Multiplayer.updateGameState(code, { lastAction: sanitized });
                        }
                    }
                } catch (_) {}
            }
        }
    }

    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'change_arena' && !card.ability.used) {
        const all = (typeof arenas !== 'undefined')
            ? [...arenas.marvel, ...arenas.dc, ...arenas.neutral]
            : [];
        if (all.length > 0) {
            const current = gameState.arenas[arenaId].arena;
            let idx = 0;
            if (isMultiplayerMode()) {
                const baseSeed = Number(gameState.multiplayerSeed || 0) ^ (arenaId * 2654435761) ^ hashString(String(card.id)) ^ (gameState.turn || 1);
                const rnd = seededRandom(baseSeed);
                idx = Math.floor(rnd() * all.length);
            } else {
                idx = Math.floor(Math.random() * all.length);
            }
            let newArena = all[idx];
            if (current && newArena && newArena.name === current.name) {
                newArena = all[(idx + 1) % all.length];
            }
            gameState.arenas[arenaId].arena = newArena;
            gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
            gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
            updateArenasDisplay();
            card.ability.used = true;
            if (isMultiplayerMode()) {
                const code = getURLParam('code');
                try {
                    if (code && window.Multiplayer && Multiplayer.sendAction) {
                        const actionId = Math.random().toString(36).slice(2) + Date.now();
                        const payload = { id: actionId, type: 'change_arena', arenaId, arena: newArena, clientId: gameState.clientId };
                        const sanitized = sanitizeForFirestore(payload);
                        await Multiplayer.sendAction(code, sanitized);
                        if (Multiplayer.updateGameState) {
                            await Multiplayer.updateGameState(code, { lastAction: sanitized });
                        }
                    }
                } catch (_) {}
            }
        }
    }

    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'change_all_arenas' && !card.ability.used) {
        let picked = [];
        if (typeof selectRandomArenasSeeded === 'function' && isMultiplayerMode()) {
            const seed = Number(gameState.multiplayerSeed || 0) ^ hashString('wiccano') ^ (gameState.turn || 1);
            picked = selectRandomArenasSeeded(seed);
        } else if (typeof selectRandomArenas === 'function') {
            picked = selectRandomArenas();
        }
        if (picked && picked.length >= 3) {
            for (let i = 1; i <= 3; i++) {
                gameState.arenas[i].arena = picked[i - 1];
                gameState.arenas[i].playerPower = calculateArenaPower(i, 'player');
                gameState.arenas[i].opponentPower = calculateArenaPower(i, 'opponent');
            }
            updateArenasDisplay();
            card.ability.used = true;
            if (isMultiplayerMode()) {
                const code = getURLParam('code');
                try {
                    if (code && window.Multiplayer && Multiplayer.sendAction) {
                        const actionId = Math.random().toString(36).slice(2) + Date.now();
                        const payload = { id: actionId, type: 'change_all_arenas', arenas: picked, clientId: gameState.clientId };
                        const sanitized = sanitizeForFirestore(payload);
                        await Multiplayer.sendAction(code, sanitized);
                        if (Multiplayer.updateGameState) {
                            await Multiplayer.updateGameState(code, { lastAction: sanitized });
                        }
                    }
                } catch (_) {}
            }
        }
    }

    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'max_allies' && !card.ability.used) {
        const items = [];
        for (let i = 1; i <= 3; i++) {
            const arr = gameState.arenas[i].player;
            for (let idx = 0; idx < arr.length; idx++) {
                const c = arr[idx];
                if (!c) continue;
                c.strength = 100;
                c.intelligence = 100;
                c.speed = 100;
                c.durability = 100;
                items.push({ arenaId: i, cardId: c.id });
            }
            gameState.arenas[i].playerPower = calculateArenaPower(i, 'player');
        }
        updateArenasDisplay();
        card.ability.used = true;
        if (isMultiplayerMode() && items.length) {
            const code = getURLParam('code');
            try {
                if (code && window.Multiplayer && Multiplayer.sendAction) {
                    const actionId = Math.random().toString(36).slice(2) + Date.now();
                    const payload = { id: actionId, type: 'phoenix_max_allies', items, clientId: gameState.clientId };
                    const sanitized = sanitizeForFirestore(payload);
                    await Multiplayer.sendAction(code, sanitized);
                    if (Multiplayer.updateGameState) {
                        await Multiplayer.updateGameState(code, { lastAction: sanitized });
                    }
                }
            } catch (_) {}
        }
    }

    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'smash_strongest' && !card.ability.used) {
        const opp = gameState.arenas[arenaId].opponent;
        if (opp && opp.length > 0) {
            let bestIdx = 0;
            let bestVal = -Infinity;
            const hasHackPlayer = (gameState.arenas[arenaId].player || []).some(c => c && c.ability && c.ability.id === 'hack');
            for (let i = 0; i < opp.length; i++) {
                const oc = opp[i];
                const base = calculateCardPower(oc);
                const arenaBonus = (typeof applyArenaEffect === 'function' && gameState.arenas[arenaId].arena)
                    ? applyArenaEffect(oc, gameState.arenas[arenaId].arena, 'opponent')
                    : 0;
                const difficultyBonus = (!isMultiplayerMode() ? gameState.opponentBuff || 0 : 0);
                let val = base + arenaBonus + difficultyBonus;
                if (hasHackPlayer) val = Math.floor(val * 0.9);
                if (val > bestVal) { bestVal = val; bestIdx = i; }
            }
            const target = opp[bestIdx];
            gameState.arenas[arenaId].opponent.splice(bestIdx, 1);
            gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
            updateArenasDisplay();
            card.ability.used = true;
            if (isMultiplayerMode()) {
                const code = getURLParam('code');
                try {
                    if (code && window.Multiplayer && Multiplayer.sendAction) {
                        const actionId = Math.random().toString(36).slice(2) + Date.now();
                        const payload = { id: actionId, type: 'smash', arenaId, cardId: target.id, clientId: gameState.clientId };
                        const sanitized = sanitizeForFirestore(payload);
                        await Multiplayer.sendAction(code, sanitized);
                        if (Multiplayer.updateGameState) {
                            await Multiplayer.updateGameState(code, { lastAction: sanitized });
                        }
                    }
                } catch (_) {}
            }
        }
    }

    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'zero_strongest' && !card.ability.used) {
        const opp = gameState.arenas[arenaId].opponent;
        if (opp && opp.length > 0) {
            let bestIdx = 0;
            let bestVal = -Infinity;
            const hasHackPlayer = (gameState.arenas[arenaId].player || []).some(c => c && c.ability && c.ability.id === 'hack');
            for (let i = 0; i < opp.length; i++) {
                const oc = opp[i];
                const base = calculateCardPower(oc);
                const arenaBonus = (typeof applyArenaEffect === 'function' && gameState.arenas[arenaId].arena)
                    ? applyArenaEffect(oc, gameState.arenas[arenaId].arena, 'opponent')
                    : 0;
                const difficultyBonus = (!isMultiplayerMode() ? gameState.opponentBuff || 0 : 0);
                let val = base + arenaBonus + difficultyBonus;
                if (hasHackPlayer) val = Math.floor(val * 0.9);
                if (val > bestVal) { bestVal = val; bestIdx = i; }
            }
            const target = opp[bestIdx];
            target.strength = 0;
            target.intelligence = 0;
            target.speed = 0;
            target.durability = 0;
            gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
            updateArenasDisplay();
            card.ability.used = true;
            if (isMultiplayerMode()) {
                const code = getURLParam('code');
                try {
                    if (code && window.Multiplayer && Multiplayer.sendAction) {
                        const actionId = Math.random().toString(36).slice(2) + Date.now();
                        const payload = { id: actionId, type: 'prep_zero', arenaId, cardId: target.id, clientId: gameState.clientId };
                        const sanitized = sanitizeForFirestore(payload);
                        await Multiplayer.sendAction(code, sanitized);
                        if (Multiplayer.updateGameState) {
                            await Multiplayer.updateGameState(code, { lastAction: sanitized });
                        }
                    }
                } catch (_) {}
            }
        } else {
            showTemporaryMessage('Batman: nenhuma carta inimiga nesta arena');
        }
    }

    // Habilidade: Destruição de Arena (Darkside)
    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'destroy_arena' && !card.ability.used) {
        const opp = gameState.arenas[arenaId].opponent;
        if (opp && opp.length > 0) {
            const ids = opp.map(c => c && c.id).filter(id => id != null);
            opp.splice(0, opp.length);
            gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
            updateArenasDisplay();
            card.ability.used = true;
            if (isMultiplayerMode()) {
                const code = getURLParam('code');
                try {
                    if (code && window.Multiplayer && Multiplayer.sendAction) {
                        const actionId = Math.random().toString(36).slice(2) + Date.now();
                        const payload = { id: actionId, type: 'destroy_arena', arenaId, ids, clientId: gameState.clientId };
                        const sanitized = sanitizeForFirestore(payload);
                        await Multiplayer.sendAction(code, sanitized);
                        if (Multiplayer.updateGameState) {
                            await Multiplayer.updateGameState(code, { lastAction: sanitized });
                        }
                    }
                } catch (_) {}
            }
        } else {
            showTemporaryMessage('Darkside: nenhuma carta inimiga para destruir');
        }
    }

    // Habilidade: Duplicador (Ultron)
    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'duplicate_all_arenas' && !card.ability.used) {
        const targets = [1, 2, 3].filter(i => i !== arenaId);
        const added = [];
        for (const t of targets) {
            const dup = { ...card };
            dup.id = `${card.id}_dup_${t}_${Math.random().toString(36).slice(2)}`;
            if (dup.ability) dup.ability = { ...dup.ability, used: true };
            gameState.arenas[t].player.push(dup);
            gameState.arenas[t].playerPower = calculateArenaPower(t, 'player');
            added.push({ arenaId: t, card: sanitizeForFirestore(dup) });
        }
        updateArenasDisplay();
        card.ability.used = true;
        if (isMultiplayerMode() && added.length) {
            const code = getURLParam('code');
            try {
                if (code && window.Multiplayer && Multiplayer.sendAction) {
                    const actionId = Math.random().toString(36).slice(2) + Date.now();
                    const payload = { id: actionId, type: 'duplicate_all', items: added, clientId: gameState.clientId };
                    const sanitized = sanitizeForFirestore(payload);
                    await Multiplayer.sendAction(code, sanitized);
                    if (Multiplayer.updateGameState) {
                        await Multiplayer.updateGameState(code, { lastAction: sanitized });
                    }
                }
            } catch (_) {}
        }
    }

    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'maximize_if_lower' && !card.ability.used) {
        const opp = gameState.arenas[arenaId].opponent;
        let oppMax = 0;
        if (opp && opp.length > 0) {
            const hasHackPlayer = (gameState.arenas[arenaId].player || []).some(c => c && c.ability && c.ability.id === 'hack');
            for (let i = 0; i < opp.length; i++) {
                const oc = opp[i];
                const base = calculateCardPower(oc);
                const arenaBonus = (typeof applyArenaEffect === 'function' && gameState.arenas[arenaId].arena)
                    ? applyArenaEffect(oc, gameState.arenas[arenaId].arena, 'opponent')
                    : 0;
                const difficultyBonus = (!isMultiplayerMode() ? gameState.opponentBuff || 0 : 0);
                let val = base + arenaBonus + difficultyBonus;
                if (hasHackPlayer) val = Math.floor(val * 0.9);
                if (val > oppMax) oppMax = val;
            }
        }
        const hasHackOpponent = (gameState.arenas[arenaId].opponent || []).some(c => c && c.ability && c.ability.id === 'hack');
        const myBase = calculateCardPower(card);
        const myArenaBonus = (typeof applyArenaEffect === 'function' && gameState.arenas[arenaId].arena)
            ? applyArenaEffect(card, gameState.arenas[arenaId].arena, 'player')
            : 0;
        let myVal = myBase + myArenaBonus;
        if (hasHackOpponent) myVal = Math.floor(myVal * 0.9);
        if (myVal < oppMax) {
            card.strength = 100;
            card.intelligence = 100;
            card.speed = 100;
            card.durability = 100;
            card.ability.used = true;
            gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
            updateArenasDisplay();
            if (isMultiplayerMode()) {
                const code = getURLParam('code');
                try {
                    if (code && window.Multiplayer && Multiplayer.sendAction) {
                        const actionId = Math.random().toString(36).slice(2) + Date.now();
                        const payload = { id: actionId, type: 'morph', arenaId, cardId: card.id, stats: { strength: card.strength, intelligence: card.intelligence, speed: card.speed, durability: card.durability }, clientId: gameState.clientId };
                        const sanitized = sanitizeForFirestore(payload);
                        await Multiplayer.sendAction(code, sanitized);
                        if (Multiplayer.updateGameState) {
                            await Multiplayer.updateGameState(code, { lastAction: sanitized });
                        }
                    }
                } catch (_) {}
            }
        }
    }

    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'summon_female' && !card.ability.used) {
        const all = (typeof getAllCharacters === 'function') ? getAllCharacters() : [];
        const females = all.filter(c => c && c.gender === 'female');
        if (females.length > 0) {
            let idx = 0;
            if (isMultiplayerMode()) {
                const baseSeed = Number(gameState.multiplayerSeed || 0) ^ (arenaId * 2654435761) ^ hashString(String(card.id)) ^ (gameState.turn || 1);
                const rnd = seededRandom(baseSeed);
                idx = Math.floor(rnd() * females.length);
            } else {
                idx = Math.floor(Math.random() * females.length);
            }
            const base = females[idx];
            const summon = { ...base };
            summon.id = `${base.id}_summon_${arenaId}_${Math.random().toString(36).slice(2)}`;
            if (summon.ability) summon.ability = { ...summon.ability, used: true };
            gameState.arenas[arenaId].player.push(summon);
            gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
            updateArenasDisplay();
            card.ability.used = true;
            if (isMultiplayerMode()) {
                const code = getURLParam('code');
                try {
                    if (code && window.Multiplayer && Multiplayer.sendAction) {
                        const actionId = Math.random().toString(36).slice(2) + Date.now();
                        const payload = { id: actionId, type: 'summon', arenaId, card: sanitizeForFirestore(summon), clientId: gameState.clientId };
                        const sanitized = sanitizeForFirestore(payload);
                        await Multiplayer.sendAction(code, sanitized);
                        if (Multiplayer.updateGameState) {
                            await Multiplayer.updateGameState(code, { lastAction: sanitized });
                        }
                    }
                } catch (_) {}
            }
        } else {
            showTemporaryMessage('Mulher-Maravilha: nenhuma carta feminina disponível');
        }
    }

    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'summon_marvel_ally' && !card.ability.used) {
        const all = (typeof getAllCharacters === 'function') ? getAllCharacters() : [];
        const marvels = all.filter(c => c && c.universe === 'marvel');
        if (marvels.length > 0) {
            let idx = 0;
            if (isMultiplayerMode()) {
                const baseSeed = Number(gameState.multiplayerSeed || 0) ^ (arenaId * 2654435761) ^ hashString(String(card.id)) ^ (gameState.turn || 1) ^ 0xA5A5A5A5;
                const rnd = seededRandom(baseSeed);
                idx = Math.floor(rnd() * marvels.length);
            } else {
                idx = Math.floor(Math.random() * marvels.length);
            }
            const base = marvels[idx];
            const summon = { ...base };
            summon.id = `${base.id}_portal_${arenaId}_${Math.random().toString(36).slice(2)}`;
            if (summon.ability) summon.ability = { ...summon.ability, used: true };
            gameState.arenas[arenaId].player.push(summon);
            gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
            updateArenasDisplay();
            card.ability.used = true;
            if (isMultiplayerMode()) {
                const code = getURLParam('code');
                try {
                    if (code && window.Multiplayer && Multiplayer.sendAction) {
                        const actionId = Math.random().toString(36).slice(2) + Date.now();
                        const payload = { id: actionId, type: 'summon', arenaId, card: sanitizeForFirestore(summon), clientId: gameState.clientId };
                        const sanitized = sanitizeForFirestore(payload);
                        await Multiplayer.sendAction(code, sanitized);
                        if (Multiplayer.updateGameState) {
                            await Multiplayer.updateGameState(code, { lastAction: sanitized });
                        }
                    }
                } catch (_) {}
            }
        } else {
            showTemporaryMessage('Dr. Estranho: nenhum aliado da Marvel disponível');
        }
    }

    if (card && card.ability && card.ability.trigger === 'onPlay' && card.ability.effect === 'devour_arena' && !card.ability.used) {
        let target = null;
        let worst = Infinity;
        for (let i = 1; i <= 3; i++) {
            const p = gameState.arenas[i].playerPower ?? calculateArenaPower(i, 'player');
            const o = gameState.arenas[i].opponentPower ?? calculateArenaPower(i, 'opponent');
            const diff = p - o;
            if (diff < 0 && diff < worst) {
                worst = diff;
                target = i;
            }
        }
        if (!target) {
            showTemporaryMessage('Galactus: nenhuma arena perdida para devorar');
        } else {
            gameState.arenas[target].player.splice(0, gameState.arenas[target].player.length);
            gameState.arenas[target].opponent.splice(0, gameState.arenas[target].opponent.length);
            gameState.arenas[target].playerPower = 0;
            gameState.arenas[target].opponentPower = 0;
            gameState.arenas[target].disabled = true;
            gameState.arenas[target].arena = {
                name: 'Mundo Devorado',
                effect: 'Removida pela fome de Galactus',
                effectType: 'none',
                image: ''
            };
            updateArenasDisplay();
            card.ability.used = true;
            if (isMultiplayerMode()) {
                const code = getURLParam('code');
                try {
                    if (code && window.Multiplayer && Multiplayer.sendAction) {
                        const actionId = Math.random().toString(36).slice(2) + Date.now();
                        const payload = { id: actionId, type: 'devour', arenaId: target, clientId: gameState.clientId };
                        const sanitized = sanitizeForFirestore(payload);
                        await Multiplayer.sendAction(code, sanitized);
                        if (Multiplayer.updateGameState) {
                            await Multiplayer.updateGameState(code, { lastAction: sanitized });
                        }
                    }
                } catch (_) {}
            }
        }
    }

    if (!isMultiplayerMode()) {
        await tryAutoTeleportNightcrawler();
        await tryRegenerationWolverine();
        continueGameAfterPlay();
    } else {
        await tryAutoTeleportNightcrawler();
        await tryRegenerationWolverine();
    }
}

/**
 * Continua o jogo após jogada do jogador
 */
function continueGameAfterPlay() {
    if (isMultiplayerMode()) {
        // Em multiplayer, o avanço de turno é dirigido pelo estado da sala
        return;
    }
    if (gameState.turn > gameState.maxTurns) {
        setTimeout(() => endGame(), 1000);
    } else {
        setTimeout(() => {
            gameState.currentPlayer = 'opponent';
            updateGameDisplay();
            if (!isMultiplayerMode()) {
                opponentPlay();
            }
        }, 1000);
    }
}

// Processa ação recebida do oponente (multiplayer)
function handleRemoteAction(entry) {
    if (!entry || !entry.action) return;
    const { action, uid } = entry;
    const eventId = entry.id || action.id;
    const actionId = action && action.id;
    if (eventId || actionId) {
        const already = (eventId && gameState.processedActionIds.includes(eventId)) || (actionId && gameState.processedActionIds.includes(actionId));
        if (already) return;
        if (eventId) gameState.processedActionIds.push(eventId);
        if (actionId) gameState.processedActionIds.push(actionId);
    }
    const myUid = (window.Multiplayer && Multiplayer.getUid) ? Multiplayer.getUid() : null;
    if (action.type === 'play') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const arenaId = action.arenaId;
        const card = action.card;
        (async () => {
            try {
                await animateOpponentCard(arenaId, card);
                gameState.arenas[arenaId].opponent.push(card);
                gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
                gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
                updateArenasDisplay();
                // Em multiplayer, quem avança turno é o estado da sala
                // Atualizar simulação da mão do oponente
                if (isMultiplayerMode()) {
                    const idx = gameState.simOpponentHand.findIndex(c => c && c.id === card.id);
                    if (idx !== -1) gameState.simOpponentHand.splice(idx, 1);
                    if (gameState.simOpponentDeck.length > 0) {
                        gameState.simOpponentHand.push(gameState.simOpponentDeck.shift());
                    }
                }
            } catch (e) {
                console.error('Falha ao aplicar ação remota:', e);
            }
        })();
    }
    if (action.type === 'pass') {
        if (myUid && uid === myUid) return; // ignora meu próprio pass
        showTemporaryMessage('Oponente passou o turno.');
        updateGameDisplay();
    }
    if (action.type === 'teleport') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const from = action.from;
        const to = action.to;
        const cardId = action.cardId;
        if (from && to && cardId) {
            const idx = gameState.arenas[from].opponent.findIndex(c => c && c.id === cardId);
            if (idx !== -1) {
                const card = gameState.arenas[from].opponent.splice(idx, 1)[0];
                gameState.arenas[to].opponent.push(card);
                gameState.arenas[from].opponentPower = calculateArenaPower(from, 'opponent');
                gameState.arenas[to].opponentPower = calculateArenaPower(to, 'opponent');
                updateArenasDisplay();
            }
        }
    }
    if (action.type === 'change_arena') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const arenaId = action.arenaId;
        const arenaObj = action.arena;
        if (arenaId && arenaObj) {
            gameState.arenas[arenaId].arena = arenaObj;
            gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
            gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
            updateArenasDisplay();
        }
    }
    if (action.type === 'change_all_arenas') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const arr = action.arenas || [];
        if (arr.length >= 3) {
            for (let i = 1; i <= 3; i++) {
                gameState.arenas[i].arena = arr[i - 1];
                gameState.arenas[i].playerPower = calculateArenaPower(i, 'player');
                gameState.arenas[i].opponentPower = calculateArenaPower(i, 'opponent');
            }
            updateArenasDisplay();
        }
    }
    if (action.type === 'duplicate_all') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const items = action.items || [];
        for (const it of items) {
            const t = it.arenaId;
            const c = it.card;
            if (t && c) {
                gameState.arenas[t].opponent.push(c);
                gameState.arenas[t].opponentPower = calculateArenaPower(t, 'opponent');
            }
        }
        updateArenasDisplay();
    }
    if (action.type === 'phoenix_max_allies') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const items = action.items || [];
        for (const it of items) {
            const t = it.arenaId;
            const id = it.cardId;
            if (t && id != null) {
                const idx = gameState.arenas[t].opponent.findIndex(c => c && c.id === id);
                if (idx !== -1) {
                    const c = gameState.arenas[t].opponent[idx];
                    c.strength = 100;
                    c.intelligence = 100;
                    c.speed = 100;
                    c.durability = 100;
                    gameState.arenas[t].opponentPower = calculateArenaPower(t, 'opponent');
                }
            }
        }
        updateArenasDisplay();
    }
    if (action.type === 'smash') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const arenaId = action.arenaId;
        const cardId = action.cardId;
        if (arenaId && cardId != null) {
            const idx = gameState.arenas[arenaId].player.findIndex(c => c && c.id === cardId);
            if (idx !== -1) {
                gameState.arenas[arenaId].player.splice(idx, 1);
                gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
                updateArenasDisplay();
            }
        }
    }
    if (action.type === 'prep_zero') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const arenaId = action.arenaId;
        const cardId = action.cardId;
        if (arenaId && cardId != null) {
            const idx = gameState.arenas[arenaId].player.findIndex(c => c && c.id === cardId);
            if (idx !== -1) {
                const c = gameState.arenas[arenaId].player[idx];
                c.strength = 0;
                c.intelligence = 0;
                c.speed = 0;
                c.durability = 0;
                gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
                updateArenasDisplay();
            }
        }
    }
    if (action.type === 'destroy_arena') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const arenaId = action.arenaId;
        const ids = action.ids || [];
        if (arenaId) {
            if (ids.length > 0) {
                gameState.arenas[arenaId].player = gameState.arenas[arenaId].player.filter(c => !ids.includes(c && c.id));
            } else {
                gameState.arenas[arenaId].player = [];
            }
            gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
            updateArenasDisplay();
        }
    }
    if (action.type === 'morph') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const arenaId = action.arenaId;
        const cardId = action.cardId;
        const stats = action.stats || {};
        if (arenaId && cardId != null) {
            const idx = gameState.arenas[arenaId].opponent.findIndex(c => c && c.id === cardId);
            if (idx !== -1) {
                const oc = gameState.arenas[arenaId].opponent[idx];
                oc.strength = stats.strength || 0;
                oc.intelligence = stats.intelligence || 0;
                oc.speed = stats.speed || 0;
                oc.durability = stats.durability || 0;
                gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
                updateArenasDisplay();
            }
        }
    }
    if (action.type === 'self_buff') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const arenaId = action.arenaId;
        const cardId = action.cardId;
        const stat = action.stat || 'durability';
        const inc = action.value || 10;
        if (arenaId && cardId != null) {
            const idx = gameState.arenas[arenaId].opponent.findIndex(c => c && c.id === cardId);
            if (idx !== -1) {
                const oc = gameState.arenas[arenaId].opponent[idx];
                const before = oc[stat] || 0;
                oc[stat] = Math.min(100, before + inc);
                gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
                updateArenasDisplay();
            }
        }
    }
    if (action.type === 'steal') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const arenaId = action.arenaId;
        const stolen = action.card;
        if (arenaId && stolen && stolen.id != null) {
            const idx = gameState.arenas[arenaId].player.findIndex(c => c && c.id === stolen.id);
            if (idx !== -1) {
                const card = gameState.arenas[arenaId].player.splice(idx, 1)[0];
                gameState.arenas[arenaId].opponent.push(card);
                gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
                gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
                updateArenasDisplay();
            }
        }
    }
    if (action.type === 'devour') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const arenaId = action.arenaId;
        if (arenaId) {
            gameState.arenas[arenaId].player = [];
            gameState.arenas[arenaId].opponent = [];
            gameState.arenas[arenaId].playerPower = 0;
            gameState.arenas[arenaId].opponentPower = 0;
            gameState.arenas[arenaId].disabled = true;
            gameState.arenas[arenaId].arena = {
                name: 'Mundo Devorado',
                effect: 'Removida pela fome de Galactus',
                effectType: 'none',
                image: ''
            };
            updateArenasDisplay();
        }
    }
    if (action.type === 'summon') {
        if (action.clientId && action.clientId === gameState.clientId) return;
        const arenaId = action.arenaId;
        const c = action.card;
        if (arenaId && c) {
            gameState.arenas[arenaId].opponent.push(c);
            gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
            updateArenasDisplay();
        }
    }
    
    if (action.type === 'end_game') {
        if (gameState.gameEnded || gameState.resultShown) return;
        console.log('📡 Recebido end_game remoto');
        gameState.gameEnded = true;
        gameState.currentPlayer = 'none';
        setTimeout(() => {
            if (gameState.resultShown) return;
            const result = calculateGameResult();
            const { difficultyChanged, oldDifficulty } = updateGameStats(result);
            showGameResult(result, difficultyChanged, oldDifficulty);
            gameState.resultShown = true;
            updateGameDisplay();
        }, 300);
    }
}

// =============================================
// SISTEMA DE ARENAS
// =============================================

/**
 * Configura as arenas para a partida
 */
function setupArenas(seed = null) {
    if (typeof selectRandomArenas === 'function') {
        const selectedArenas = (seed !== null && typeof selectRandomArenasSeeded === 'function')
            ? selectRandomArenasSeeded(seed)
            : selectRandomArenas();
        
        // Atualizar arenas no estado do jogo
        for (let i = 1; i <= 3; i++) {
            gameState.arenas[i].arena = selectedArenas[i - 1];
            gameState.arenas[i].disabled = false;
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

// RNG determinístico baseado em seed (mulberry32)
function seededRandom(seed) {
    let t = seed >>> 0;
    return function() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

// Seleção de arenas determinística a partir do seed da sala
function selectRandomArenasSeeded(seed) {
    const all = (typeof arenas !== 'undefined')
        ? [...arenas.marvel, ...arenas.dc, ...arenas.neutral].filter(a => a.effectType !== 'shuffle_stats')
        : [];
    const rnd = seededRandom(Number(seed) || 123456);
    const picked = [];
    const pool = [...all];
    for (let i = 0; i < 3 && pool.length > 0; i++) {
        const idx = Math.floor(rnd() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
}

// Hash simples para string
function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < (str || '').length; i++) {
        h ^= (str.charCodeAt(i) & 0xff);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

// Bônus determinístico para arenas com efeito shuffle_stats
function deterministicShuffleBonus(arenaId, card, side) {
    const baseSeed = Number(gameState.multiplayerSeed || 0) ^ (arenaId * 2654435761) ^ hashString(card.name || '') ^ (side === 'opponent' ? 0x9E3779B9 : 0x85EBCA6B);
    const rnd = seededRandom(baseSeed);
    // mapear para inteiro no intervalo [-10, 10]
    return Math.floor(rnd() * 21) - 10;
}

/**
 * Calcula o poder total de uma arena
 */
/**
 * Calcula o poder total de uma arena COM BÔNUS DE DIFICULDADE
 */
function calculateArenaPower(arenaId, side) {
    const arenaData = gameState.arenas[arenaId];
    
    // Caso especial: Speed Decides
    if (arenaData.arena && arenaData.arena.effectType === 'speed_decides') {
        return calculateSpeedDecidesPower(arenaData, side);
    }
    
    // Cálculo normal de poder
    let totalPower = 0;
    const hackMultiplier = (side === 'opponent'
        ? (arenaData.player || []).some(c => c && c.ability && c.ability.id === 'hack')
        : (arenaData.opponent || []).some(c => c && c.ability && c.ability.id === 'hack')) ? 0.9 : 1.0;
    
    arenaData[side].forEach(card => {
        const basePower = calculateCardPower(card);
        let arenaBonus = 0;
        
        // Aplicar efeito da arena se existir
        if (arenaData.arena) {
            // Em multiplayer, usamos bônus determinístico para efeitos "shuffle_stats"
            // No singleplayer, mantemos o comportamento original (aleatório) via applyArenaEffect
            if (arenaData.arena.effectType === 'shuffle_stats' && isMultiplayerMode()) {
                arenaBonus = deterministicShuffleBonus(arenaId, card, side);
            } else if (typeof applyArenaEffect === 'function') {
                arenaBonus = applyArenaEffect(card, arenaData.arena, side);
            }
        }
        
        // 🔥 BÔNUS DE DIFICULDADE PARA OPONENTE (apenas singleplayer)
        const difficultyBonus = (side === 'opponent' && !isMultiplayerMode()) ? gameState.opponentBuff : 0;
        let contrib = basePower + arenaBonus + difficultyBonus;
        if (hackMultiplier !== 1) {
            contrib = Math.floor(contrib * hackMultiplier);
        }
        totalPower += contrib;
    });
    
    const hasThanosOther = (side === 'opponent'
        ? (arenaData.player || []).some(c => c && c.ability && c.ability.id === 'thanos_half')
        : (arenaData.opponent || []).some(c => c && c.ability && c.ability.id === 'thanos_half'));
    if (hasThanosOther) {
        totalPower = Math.floor(totalPower * 0.5);
    }
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
    arenaElement.classList.toggle('disabled', !!arenaData.disabled);
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
            const basePower = calculateCardPower(card);
            const arenaBonus = (typeof applyArenaEffect === 'function' && arenaData.arena)
                ? applyArenaEffect(card, arenaData.arena, 'player')
                : 0;
            const hasHackOpponent = (arenaData.opponent || []).some(c => c && c.ability && c.ability.id === 'hack');
            let adjustedPower = basePower + arenaBonus;
            if (hasHackOpponent) adjustedPower = Math.floor(adjustedPower * 0.9);
            const badges = [];
            if (arenaBonus) badges.push(`Arena +${arenaBonus}`);
            if (card.ability && card.ability.name) badges.push(`Habilidade: ${card.ability.name}`);
            playerContainer.appendChild(createArenaCardElement(card, adjustedPower, badges));
        });
    }
    
    if (opponentContainer) {
        opponentContainer.innerHTML = '';
        arenaData.opponent.forEach(card => {
            const basePower = calculateCardPower(card);
            const arenaBonus = (typeof applyArenaEffect === 'function' && arenaData.arena)
                ? applyArenaEffect(card, arenaData.arena, 'opponent')
                : 0;
            const difficultyBonus = gameState.opponentBuff || 0;
            const hasHackPlayer = (arenaData.player || []).some(c => c && c.ability && c.ability.id === 'hack');
            let adjustedPower = basePower + arenaBonus + difficultyBonus;
            if (hasHackPlayer) adjustedPower = Math.floor(adjustedPower * 0.9);
            const badges = [];
            if (arenaBonus) badges.push(`Arena +${arenaBonus}`);
            if (difficultyBonus) badges.push(`IA +${difficultyBonus}`);
            if (card.ability && card.ability.name) badges.push(`Habilidade: ${card.ability.name}`);
            opponentContainer.appendChild(createArenaCardElement(card, adjustedPower, badges));
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
function createArenaCardElement(card, adjustedPower = null, badges = []) {
    const cardElement = document.createElement('div');
    cardElement.className = `arena-card ${card.universe}`;
    cardElement.dataset.id = card.id;
    cardElement.title = `${card.name} - Poder: ${calculateCardPower(card)}${card.ability && card.ability.name ? ' - Habilidade: ' + card.ability.name : ''}`;
    if (card.rarity === 'rare') {
        cardElement.classList.add('rare');
    }
    
    // Calcular poder total
    const totalPower = (adjustedPower != null) ? adjustedPower : calculateCardPower(card);
    
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
        </div>
        ${badges && badges.length ? `<div class=\"arena-card-badges\">${badges.map(b => `<span class=\\\"arena-card-badge\\\">${b}</span>`).join('')}</div>` : ''}
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
            const availableArenas = [1,2,3].filter(i => !gameState.arenas[i].disabled);
            if (availableArenas.length === 0) { endOpponentTurn(); return; }
            const arenaId = availableArenas[Math.floor(Math.random() * availableArenas.length)];
            
            console.log(`🤖 Oponente joga ${card.name} na arena ${arenaId}`);
            
            // Animar carta do oponente
            await animateOpponentCard(arenaId, card);
            
            // Mover carta para arena
            gameState.opponentHand.splice(randomCardIndex, 1);
            gameState.arenas[arenaId].opponent.push(card);
            gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');

            if (card && card.ability && card.ability.trigger === 'onPlay' && !card.ability.used) {
                if (card.ability.effect === 'steal') {
                    const pool = gameState.arenas[arenaId].player;
                    if (pool && pool.length > 0) {
                        const idx = Math.floor(Math.random() * pool.length);
                        const stolen = pool.splice(idx, 1)[0];
                        gameState.arenas[arenaId].opponent.push(stolen);
                        gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
                        gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
                        updateArenasDisplay();
                        card.ability.used = true;
                    }
                }
                if (card.ability.effect === 'morph_to_strongest') {
                    const arr = gameState.arenas[arenaId].player;
                    if (arr && arr.length > 0) {
                        let bestIdx = 0;
                        let bestVal = -Infinity;
                        const hasHackOpponent = (gameState.arenas[arenaId].opponent || []).some(c => c && c.ability && c.ability.id === 'hack');
                        for (let i = 0; i < arr.length; i++) {
                            const pc = arr[i];
                            const base = calculateCardPower(pc);
                            const arenaBonus = (typeof applyArenaEffect === 'function' && gameState.arenas[arenaId].arena)
                                ? applyArenaEffect(pc, gameState.arenas[arenaId].arena, 'player')
                                : 0;
                            let val = base + arenaBonus;
                            if (hasHackOpponent) val = Math.floor(val * 0.9);
                            if (val > bestVal) { bestVal = val; bestIdx = i; }
                        }
                        const target = arr[bestIdx];
                        card.strength = target.strength || 0;
                        card.intelligence = target.intelligence || 0;
                        card.speed = target.speed || 0;
                        card.durability = target.durability || 0;
                        gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
                        updateArenasDisplay();
                        card.ability.used = true;
                    }
                }
                if (card.ability.effect === 'change_arena') {
                    const all = (typeof arenas !== 'undefined')
                        ? [...arenas.marvel, ...arenas.dc, ...arenas.neutral]
                        : [];
                    if (all.length > 0) {
                        const current = gameState.arenas[arenaId].arena;
                        let idx = Math.floor(Math.random() * all.length);
                        let newArena = all[idx];
                        if (current && newArena && newArena.name === current.name) {
                            newArena = all[(idx + 1) % all.length];
                        }
                        gameState.arenas[arenaId].arena = newArena;
                        gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
                        gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
                        updateArenasDisplay();
                        card.ability.used = true;
                    }
                }
                if (card.ability.effect === 'change_all_arenas') {
                    let picked = [];
                    if (typeof selectRandomArenas === 'function') {
                        picked = selectRandomArenas();
                    }
                    if (picked && picked.length >= 3) {
                        for (let i = 1; i <= 3; i++) {
                            gameState.arenas[i].arena = picked[i - 1];
                            gameState.arenas[i].playerPower = calculateArenaPower(i, 'player');
                            gameState.arenas[i].opponentPower = calculateArenaPower(i, 'opponent');
                        }
                        updateArenasDisplay();
                        card.ability.used = true;
                    }
                }
                if (card.ability.effect === 'max_allies') {
                    for (let i = 1; i <= 3; i++) {
                        const arr = gameState.arenas[i].opponent;
                        for (let idx = 0; idx < arr.length; idx++) {
                            const c = arr[idx];
                            if (!c) continue;
                            c.strength = 100;
                            c.intelligence = 100;
                            c.speed = 100;
                            c.durability = 100;
                        }
                        gameState.arenas[i].opponentPower = calculateArenaPower(i, 'opponent');
                    }
                    updateArenasDisplay();
                    card.ability.used = true;
                }
                if (card.ability.effect === 'smash_strongest') {
                    const arr = gameState.arenas[arenaId].player;
                    if (arr && arr.length > 0) {
                        let bestIdx = 0;
                        let bestVal = -Infinity;
                        const hasHackOpponent = (gameState.arenas[arenaId].opponent || []).some(c => c && c.ability && c.ability.id === 'hack');
                        for (let i = 0; i < arr.length; i++) {
                            const pc = arr[i];
                            const base = calculateCardPower(pc);
                            const arenaBonus = (typeof applyArenaEffect === 'function' && gameState.arenas[arenaId].arena)
                                ? applyArenaEffect(pc, gameState.arenas[arenaId].arena, 'player')
                                : 0;
                            let val = base + arenaBonus;
                            if (hasHackOpponent) val = Math.floor(val * 0.9);
                            if (val > bestVal) { bestVal = val; bestIdx = i; }
                        }
                        gameState.arenas[arenaId].player.splice(bestIdx, 1);
                        gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
                        updateArenasDisplay();
                        card.ability.used = true;
                    }
                }
                if (card.ability.effect === 'zero_strongest') {
                    const arr = gameState.arenas[arenaId].player;
                    if (arr && arr.length > 0) {
                        let bestIdx = 0;
                        let bestVal = -Infinity;
                        const hasHackOpponent = (gameState.arenas[arenaId].opponent || []).some(c => c && c.ability && c.ability.id === 'hack');
                        for (let i = 0; i < arr.length; i++) {
                            const pc = arr[i];
                            const base = calculateCardPower(pc);
                            const arenaBonus = (typeof applyArenaEffect === 'function' && gameState.arenas[arenaId].arena)
                                ? applyArenaEffect(pc, gameState.arenas[arenaId].arena, 'player')
                                : 0;
                            let val = base + arenaBonus;
                            if (hasHackOpponent) val = Math.floor(val * 0.9);
                            if (val > bestVal) { bestVal = val; bestIdx = i; }
                        }
                        const target = arr[bestIdx];
                        target.strength = 0;
                        target.intelligence = 0;
                        target.speed = 0;
                        target.durability = 0;
                        gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
                        updateArenasDisplay();
                        card.ability.used = true;
                    }
                }
                if (card.ability.effect === 'destroy_arena') {
                    const arr = gameState.arenas[arenaId].player;
                    if (arr && arr.length > 0) {
                        arr.splice(0, arr.length);
                        gameState.arenas[arenaId].playerPower = calculateArenaPower(arenaId, 'player');
                        updateArenasDisplay();
                        card.ability.used = true;
                    }
                }
                if (card.ability.effect === 'duplicate_all_arenas') {
                    const targets = [1, 2, 3].filter(i => i !== arenaId);
                    for (const t of targets) {
                        const dup = { ...card };
                        dup.id = `${card.id}_dup_${t}_${Math.random().toString(36).slice(2)}`;
                        if (dup.ability) dup.ability = { ...dup.ability, used: true };
                        gameState.arenas[t].opponent.push(dup);
                        gameState.arenas[t].opponentPower = calculateArenaPower(t, 'opponent');
                    }
                    updateArenasDisplay();
                    card.ability.used = true;
                }
                if (card.ability.effect === 'maximize_if_lower') {
                    const arr = gameState.arenas[arenaId].player;
                    let oppMax = 0;
                    if (arr && arr.length > 0) {
                        const hasHackOpponent = (gameState.arenas[arenaId].opponent || []).some(c => c && c.ability && c.ability.id === 'hack');
                        for (let i = 0; i < arr.length; i++) {
                            const pc = arr[i];
                            const base = calculateCardPower(pc);
                            const arenaBonus = (typeof applyArenaEffect === 'function' && gameState.arenas[arenaId].arena)
                                ? applyArenaEffect(pc, gameState.arenas[arenaId].arena, 'player')
                                : 0;
                            let val = base + arenaBonus;
                            if (hasHackOpponent) val = Math.floor(val * 0.9);
                            if (val > oppMax) oppMax = val;
                        }
                    }
                    const hasHackPlayer = (gameState.arenas[arenaId].player || []).some(c => c && c.ability && c.ability.id === 'hack');
                    const myBase = calculateCardPower(card);
                    const myArenaBonus = (typeof applyArenaEffect === 'function' && gameState.arenas[arenaId].arena)
                        ? applyArenaEffect(card, gameState.arenas[arenaId].arena, 'opponent')
                        : 0;
                    let myVal = myBase + myArenaBonus + (!isMultiplayerMode() ? (gameState.opponentBuff || 0) : 0);
                    if (hasHackPlayer) myVal = Math.floor(myVal * 0.9);
                    if (myVal < oppMax) {
                        card.strength = 100;
                        card.intelligence = 100;
                        card.speed = 100;
                        card.durability = 100;
                        card.ability.used = true;
                        gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
                        updateArenasDisplay();
                    }
                }
                if (card.ability.effect === 'devour_arena') {
                    let target = null;
                    let worst = Infinity;
                    for (let i = 1; i <= 3; i++) {
                        const o = gameState.arenas[i].opponentPower ?? calculateArenaPower(i, 'opponent');
                        const p = gameState.arenas[i].playerPower ?? calculateArenaPower(i, 'player');
                        const diff = o - p;
                        if (diff < 0 && diff < worst) {
                            worst = diff;
                            target = i;
                        }
                    }
                    if (target) {
                        gameState.arenas[target].player.splice(0, gameState.arenas[target].player.length);
                        gameState.arenas[target].opponent.splice(0, gameState.arenas[target].opponent.length);
                        gameState.arenas[target].playerPower = 0;
                        gameState.arenas[target].opponentPower = 0;
                        gameState.arenas[target].disabled = true;
                        gameState.arenas[target].arena = {
                            name: 'Mundo Devorado',
                            effect: 'Removida pela fome de Galactus',
                            effectType: 'none',
                            image: ''
                        };
                        updateArenasDisplay();
                        card.ability.used = true;
                    }
                }
                if (card.ability.effect === 'summon_female') {
                    const all = (typeof getAllCharacters === 'function') ? getAllCharacters() : [];
                    const females = all.filter(c => c && c.gender === 'female');
                    if (females.length > 0) {
                        const idx = Math.floor(Math.random() * females.length);
                        const base = females[idx];
                        const summon = { ...base };
                        summon.id = `${base.id}_summon_${arenaId}_${Math.random().toString(36).slice(2)}`;
                        if (summon.ability) summon.ability = { ...summon.ability, used: true };
                        gameState.arenas[arenaId].opponent.push(summon);
                        gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
                        updateArenasDisplay();
                        card.ability.used = true;
                    }
                }
                if (card.ability.effect === 'summon_marvel_ally') {
                    const all = (typeof getAllCharacters === 'function') ? getAllCharacters() : [];
                    const marvels = all.filter(c => c && c.universe === 'marvel');
                    if (marvels.length > 0) {
                        const idx = Math.floor(Math.random() * marvels.length);
                        const base = marvels[idx];
                        const summon = { ...base };
                        summon.id = `${base.id}_portal_${arenaId}_${Math.random().toString(36).slice(2)}`;
                        if (summon.ability) summon.ability = { ...summon.ability, used: true };
                        gameState.arenas[arenaId].opponent.push(summon);
                        gameState.arenas[arenaId].opponentPower = calculateArenaPower(arenaId, 'opponent');
                        updateArenasDisplay();
                        card.ability.used = true;
                    }
                }
            }
            
            // Comprar nova carta se disponível
            if (gameState.opponentDeck.length > 0) {
                gameState.opponentHand.push(gameState.opponentDeck.shift());
            }
            
            await tryAutoTeleportNightcrawlerOpponent();
            
            await tryRegenerationWolverineOpponent();
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
    // Não ultrapassar maxTurns ao encerrar
    if (gameState.turn >= gameState.maxTurns) {
        endGame();
        return;
    }
    gameState.turn++;
    gameState.currentPlayer = 'player';
    updateGameDisplay();
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
        const countdownText = (isMultiplayerMode() && gameState.turnChangeCountdown > 0)
            ? `<br>Troca de vez em ${gameState.turnChangeCountdown}s`
            : '';
        if (gameState.currentPlayer === 'player') {
            elements.playerTurn.innerHTML = `Sua vez!<br>Dificuldade: ${difficultyInfo.name}${countdownText}`;
            elements.playerTurn.className = 'player-turn';
        } else {
            elements.playerTurn.innerHTML = `Vez do Oponente<br>Dificuldade: ${difficultyInfo.name}${countdownText}`;
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
    if (card.rarity === 'rare') {
        cardElement.classList.add('rare');
    }
    
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
    
    const abilityBlock = card.ability ? `
        <div class="card-ability">
            <span class="ability-label">Habilidade</span>
            <span class="ability-name">${card.ability.name || 'Especial'}</span>
            ${card.ability.description ? `<div class="ability-desc">${card.ability.description}</div>` : ''}
        </div>
    ` : '';
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
        ${abilityBlock}
        ${attributeTags ? `<div class="card-attributes">${attributeTags}</div>` : ''}
    `;
    
    return cardElement;
}

// =============================================
// CATÁLOGO DE CARTAS (MARVEL / DC)
// =============================================

/**
 * Renderiza os catálogos dos universos Marvel e DC
 */
function renderUniverseCatalogs() {
    if (!elements.marvelCards || !elements.dcCards) {
        console.warn('Contêineres de catálogos não encontrados');
        return;
    }

    const all = typeof getAllCharacters === 'function' ? getAllCharacters() : [];
    const marvel = all.filter(c => c.universe === 'marvel');
    const dc = all.filter(c => c.universe === 'dc');

    renderCardsToContainer(marvel, elements.marvelCards);
    renderCardsToContainer(dc, elements.dcCards);
}

/**
 * Renderiza uma lista de cartas em um container
 */
function renderCardsToContainer(cards, container) {
    if (!container) return;
    container.innerHTML = '';

    // Ordenar por poder total para visual mais interessante
    const sorted = [...cards].sort((a, b) => {
        return (calculateCardPower(b) || 0) - (calculateCardPower(a) || 0);
    });

    sorted.forEach(card => {
        const el = createCardElement(card);
        // Garantir que não seja tratada como carta da mão
        el.classList.remove('hand-card', 'playable', 'selected');
        container.appendChild(el);
    });
}

/**
 * Atualiza controles do jogo
 */
function updateControls() {
    elements.battleBtn.disabled = gameState.turn < gameState.maxTurns || gameState.gameEnded;
    const locked = isMultiplayerMode() && gameState.turnChangeLock;
    elements.endTurnBtn.disabled = (gameState.currentPlayer !== 'player') || gameState.gameEnded || locked;
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
async function endTurn() {
    if (gameState.currentPlayer !== 'player' || gameState.gameEnded) {
        console.log('⏸️ Não pode finalizar turno agora');
        return;
    }
    
    console.log('⏭️ Finalizando turno...');
    elements.endTurnBtn.disabled = true;
    
    // Esconder mensagem ao finalizar turno
    hideTemporaryMessage();
    
    if (gameState.selectedCardId !== null) {
        // Jogar carta selecionada em arena aleatória
        const arenaId = Math.floor(Math.random() * 3) + 1;
        playCardToArena(arenaId);
    } else {
        // Passar turno sem jogar
        if (isMultiplayerMode()) {
            const code = getURLParam('code');
            try {
                if (code && window.Multiplayer && Multiplayer.sendAction) {
                    const actionId = Math.random().toString(36).slice(2) + Date.now();
                    const actionPayload = { id: actionId, type: 'pass', clientId: gameState.clientId };
                    const sanitized = sanitizeForFirestore(actionPayload);
                    Multiplayer.sendAction(code, sanitized);
                    if (window.Multiplayer && Multiplayer.updateGameState) {
                        Multiplayer.updateGameState(code, { lastAction: sanitized });
                    }
                }
                if (window.Multiplayer && Multiplayer.recordPlay && code) {
                    Multiplayer.recordPlay(code);
                }
                // Ajuste imediato no doc: passar vez para o outro jogador
                try {
                    if (window.Multiplayer && Multiplayer.getRoomOnce && Multiplayer.updateGameState) {
                        const room = await Multiplayer.getRoomOnce(code);
                        if (room && room.players) {
                            const hostId = room.hostId;
                            const uids = Object.keys(room.players);
                            const myUidNow = (window.Multiplayer && Multiplayer.getUid) ? Multiplayer.getUid() : null;
                            const otherId = myUidNow === hostId ? uids.find(id => id !== hostId) : hostId;
                            if (otherId) {
                                await Multiplayer.updateGameState(code, { currentPlayer: otherId });
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Falha ao ajustar currentPlayer no doc após pass:', e);
                }
            } catch (err) {
                console.warn('Não foi possível enviar PASS no multiplayer:', err);
            }
            showTemporaryMessage('Turno será alternado em até 5s...');
            // Não altera currentPlayer localmente; sala vai alternar
            updateGameDisplay();
        } else {
            await tryAutoTeleportNightcrawler();
            await tryRegenerationWolverine();
            gameState.currentPlayer = 'opponent';
            updateGameDisplay();
            opponentPlay();
        }
    }
}

async function tryAutoTeleportNightcrawler() {
    const finder = (() => {
        for (let i = 1; i <= 3; i++) {
            const idx = gameState.arenas[i].player.findIndex(c => c && ((c.ability && c.ability.id === 'teleport') || (c.name && c.name.toLowerCase() === 'noturno')));
            if (idx !== -1) return { arenaId: i, index: idx, card: gameState.arenas[i].player[idx] };
        }
        return null;
    })();
    if (!finder) return false;
    const card = finder.card;
    if (card.ability && card.ability.used) return false;
    let target = null;
    let worst = Infinity;
    for (let i = 1; i <= 3; i++) {
        const p = gameState.arenas[i].playerPower ?? calculateArenaPower(i, 'player');
        const o = gameState.arenas[i].opponentPower ?? calculateArenaPower(i, 'opponent');
        const diff = p - o;
        if (diff < 0 && diff < worst) {
            worst = diff;
            target = i;
        }
    }
    if (!target || target === finder.arenaId) return false;
    gameState.arenas[finder.arenaId].player.splice(finder.index, 1);
    gameState.arenas[target].player.push(card);
    gameState.arenas[finder.arenaId].playerPower = calculateArenaPower(finder.arenaId, 'player');
    gameState.arenas[target].playerPower = calculateArenaPower(target, 'player');
    if (card.ability) card.ability.used = true;
    updateArenasDisplay();
    if (isMultiplayerMode()) {
        const code = getURLParam('code');
        try {
            if (code && window.Multiplayer && Multiplayer.sendAction) {
                const actionId = Math.random().toString(36).slice(2) + Date.now();
                const payload = { id: actionId, type: 'teleport', cardId: card.id, from: finder.arenaId, to: target, clientId: gameState.clientId };
                const sanitized = sanitizeForFirestore(payload);
                await Multiplayer.sendAction(code, sanitized);
                if (Multiplayer.updateGameState) {
                    await Multiplayer.updateGameState(code, { lastAction: sanitized });
                }
            }
        } catch (_) {}
    }
    return true;
}
async function tryRegenerationWolverine() {
    const finder = (() => {
        for (let i = 1; i <= 3; i++) {
            const idx = gameState.arenas[i].player.findIndex(c => c && ((c.ability && c.ability.id === 'regeneration') || (c.name && c.name.toLowerCase() === 'wolverine')));
            if (idx !== -1) return { arenaId: i, index: idx, card: gameState.arenas[i].player[idx] };
        }
        return null;
    })();
    if (!finder) return false;
    const card = finder.card;
    if (card.ability && card.ability.used) return false;
    const stat = (card.ability && card.ability.stat) || 'durability';
    const inc = (card.ability && card.ability.value) || 10;
    const before = card[stat] || 0;
    const after = Math.min(100, before + inc);
    card[stat] = after;
    if (card.ability) card.ability.used = true;
    gameState.arenas[finder.arenaId].playerPower = calculateArenaPower(finder.arenaId, 'player');
    updateArenasDisplay();
    if (isMultiplayerMode()) {
        const code = getURLParam('code');
        try {
            if (code && window.Multiplayer && Multiplayer.sendAction) {
                const actionId = Math.random().toString(36).slice(2) + Date.now();
                const payload = { id: actionId, type: 'self_buff', arenaId: finder.arenaId, cardId: card.id, stat, value: inc, clientId: gameState.clientId };
                const sanitized = sanitizeForFirestore(payload);
                await Multiplayer.sendAction(code, sanitized);
                if (Multiplayer.updateGameState) {
                    await Multiplayer.updateGameState(code, { lastAction: sanitized });
                }
            }
        } catch (_) {}
    }
    return true;
}
async function tryAutoTeleportNightcrawlerOpponent() {
    const finder = (() => {
        for (let i = 1; i <= 3; i++) {
            const idx = gameState.arenas[i].opponent.findIndex(c => c && ((c.ability && c.ability.id === 'teleport') || (c.name && c.name.toLowerCase() === 'noturno')));
            if (idx !== -1) return { arenaId: i, index: idx, card: gameState.arenas[i].opponent[idx] };
        }
        return null;
    })();
    if (!finder) return false;
    const card = finder.card;
    if (card.ability && card.ability.used) return false;
    let target = null;
    let worst = Infinity;
    for (let i = 1; i <= 3; i++) {
        const o = gameState.arenas[i].opponentPower ?? calculateArenaPower(i, 'opponent');
        const p = gameState.arenas[i].playerPower ?? calculateArenaPower(i, 'player');
        const diff = o - p;
        if (diff < 0 && diff < worst) {
            worst = diff;
            target = i;
        }
    }
    if (!target || target === finder.arenaId) return false;
    gameState.arenas[finder.arenaId].opponent.splice(finder.index, 1);
    gameState.arenas[target].opponent.push(card);
    gameState.arenas[finder.arenaId].opponentPower = calculateArenaPower(finder.arenaId, 'opponent');
    gameState.arenas[target].opponentPower = calculateArenaPower(target, 'opponent');
    if (card.ability) card.ability.used = true;
    updateArenasDisplay();
    return true;
}
async function tryRegenerationWolverineOpponent() {
    const finder = (() => {
        for (let i = 1; i <= 3; i++) {
            const idx = gameState.arenas[i].opponent.findIndex(c => c && ((c.ability && c.ability.id === 'regeneration') || (c.name && c.name.toLowerCase() === 'wolverine')));
            if (idx !== -1) return { arenaId: i, index: idx, card: gameState.arenas[i].opponent[idx] };
        }
        return null;
    })();
    if (!finder) return false;
    const card = finder.card;
    if (card.ability && card.ability.used) return false;
    const stat = (card.ability && card.ability.stat) || 'durability';
    const inc = (card.ability && card.ability.value) || 10;
    const before = card[stat] || 0;
    const after = Math.min(100, before + inc);
    card[stat] = after;
    if (card.ability) card.ability.used = true;
    gameState.arenas[finder.arenaId].opponentPower = calculateArenaPower(finder.arenaId, 'opponent');
    updateArenasDisplay();
    return true;
}

/**
 * Finaliza o jogo e calcula resultado
 */
/**
 * Finaliza o jogo e calcula resultado COM PROGRESSÃO
 */
function endGame() {
    if (gameState.gameEnded) return;
    
    console.log('🏁 Finalizando jogo...');
    gameState.gameEnded = true;
    gameState.currentPlayer = 'none';
    
    // Calcular resultado
    const result = calculateGameResult();
    const { playerWins, opponentWins } = result;
    
    // 📡 Multiplayer: enviar ação de fim de jogo para o outro cliente
    if (isMultiplayerMode()) {
        const code = getURLParam('code');
        if (code && window.Multiplayer && Multiplayer.sendAction) {
            Multiplayer.sendAction(code, { type: 'end_game', result }).catch(err => {
                console.warn('Falha ao enviar ação end_game:', err);
            });
        }
    }
    
    // 🔥 Atualizar estatísticas E obter info sobre mudança de dificuldade
    const { difficultyChanged, oldDifficulty } = updateGameStats(result);
    
    // Mostrar resultado
    showGameResult(result, difficultyChanged, oldDifficulty);
    gameState.resultShown = true;
    
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
        if (arena.disabled) continue;
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
/**
 * Atualiza estatísticas do jogo COM PROGRESSÃO DE DIFICULDADE
 */
function updateGameStats(result) {
    const { playerWins, opponentWins } = result;
    
    console.log('📊 Atualizando estatísticas com progressão...', { playerWins, opponentWins });
    
    let difficultyChanged = false;
    let oldDifficulty = gameState.difficulty;
    
    if (playerWins > opponentWins) {
        // VITÓRIA
        gameState.winStreak++;
        gameState.totalWins++;
        gameState.score += 50 + (gameState.difficulty * 10);
        
        console.log(`🎉 Vitória! Win streak: ${gameState.winStreak}`);
        
        // 🔥 PROGRESSÃO: Aumentar dificuldade após 2 vitórias consecutivas
        if (gameState.winStreak >= 2 && gameState.difficulty < 5) {
            oldDifficulty = gameState.difficulty;
            gameState.difficulty++;
            difficultyChanged = true;
            console.log(`🔥 Dificuldade aumentada de ${oldDifficulty} para ${gameState.difficulty}`);
        }
        
    } else if (playerWins < opponentWins) {
        // DERROTA
        console.log(`💥 Derrota! Win streak resetado`);
        gameState.winStreak = 0;
        gameState.score = Math.max(0, gameState.score - 20);
        
        // 🔥 REGRESSÃO: Reduzir dificuldade após derrota
        if (gameState.difficulty > 1) {
            oldDifficulty = gameState.difficulty;
            gameState.difficulty = Math.max(1, gameState.difficulty - 1);
            difficultyChanged = true;
            console.log(`🔄 Dificuldade reduzida de ${oldDifficulty} para ${gameState.difficulty}`);
        }
        
    } else {
        // EMPATE
        console.log(`⚖️ Empate! Win streak resetado`);
        gameState.winStreak = 0;
        gameState.score += 10;
    }
    
    gameState.totalGames++;
    
    // 🔥 ATUALIZAR opponentBuff com a NOVA dificuldade
    gameState.opponentBuff = DIFFICULTY_SETTINGS[gameState.difficulty].opponentBuff;
    // Em multiplayer, manter IA desativada visual e mecanicamente
    if (isMultiplayerMode()) {
        gameState.opponentBuff = 0;
    }
    
    // Atualizar seletor de dificuldade
    if (elements.difficultySelect) {
        elements.difficultySelect.value = gameState.difficulty;
    }
    
    console.log('📈 Estatísticas atualizadas:', {
        newDifficulty: gameState.difficulty,
        opponentBuff: gameState.opponentBuff,
        difficultyChanged,
        score: gameState.score
    });
    
    return { difficultyChanged, oldDifficulty };
}
/**
 * Mostra resultado do jogo
 */
/**
 * Mostra resultado do jogo COM INFORMAÇÕES DE PROGRESSÃO
 */
function showGameResult(result, difficultyChanged = false, oldDifficulty = null) {
    const { playerWins, opponentWins } = result;
    const difficultyInfo = DIFFICULTY_SETTINGS[gameState.difficulty];
    
    let message, resultClass;
    
    if (playerWins > opponentWins) {
        resultClass = "victory";
        message = `🎉 **VITÓRIA!**\n\nVocê venceu ${playerWins} de 3 arenas!\n\n`;
        message += `🏆 Pontuação: +${50 + (gameState.difficulty * 10)}\n`;
        message += `📈 Sequência: ${gameState.winStreak} vitória(s)`;
        
        // 🔥 MENSAGEM DE PROGRESSÃO
        if (difficultyChanged) {
            message += `\n\n🔥 **Dificuldade aumentada!**\n${DIFFICULTY_SETTINGS[oldDifficulty].name} → ${difficultyInfo.name}`;
        } else if (gameState.winStreak === 1) {
            message += `\n\n⭐ **Mais 1 vitória para subir de dificuldade!**`;
        }
        
    } else if (playerWins < opponentWins) {
        resultClass = "defeat";
        message = `💥 **DERROTA**\n\nOponente venceu ${opponentWins} de 3 arenas!\n\n`;
        message += `📉 Pontuação: -20\n`;
        message += `🔄 Sequência: 0 vitória(s)`;
        
        // 🔥 MENSAGEM DE REGRESSÃO
        if (difficultyChanged) {
            message += `\n\n🔄 **Dificuldade reduzida**\n${DIFFICULTY_SETTINGS[oldDifficulty].name} → ${difficultyInfo.name}`;
        }
        
    } else {
        resultClass = "draw";
        message = `⚖️ **EMPATE!**\n\nAmbos venceram ${playerWins} arena(s)!\n\n`;
        message += `📊 Pontuação: +10\n`;
        message += `🔄 Sequência: 0 vitória(s)`;
    }
    
    message += `\n\n🎯 Dificuldade: ${difficultyInfo.name}`;
    message += `\n📊 Total: ${gameState.totalWins}/${gameState.totalGames} vitórias`;
    if (!isMultiplayerMode()) {
        message += `\n💪 Bônus do Oponente: +${gameState.opponentBuff}`;
    }
    
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
    // Em multiplayer, o host deve definir a nova seed na sala; convidados aguardam
    if (isMultiplayerMode()) {
        const code = getURLParam('code');
        const role = getURLParam('role');
        const uid = (window.Multiplayer && Multiplayer.getUid) ? Multiplayer.getUid() : null;
        if (code && window.Multiplayer && Multiplayer.getRoomOnce) {
            Multiplayer.getRoomOnce(code).then(room => {
                if (!room) {
                    showTemporaryMessage('Sala não encontrada. Mantendo estado atual.');
                    return;
                }
                const isHost = role ? role === 'host' : (room.hostId && uid && room.hostId === uid);
                if (isHost) {
                    const newSeed = Math.floor(Math.random() * 1e9);
                    console.log('🧩 Host gerando nova seed para próxima partida:', newSeed);
                    Multiplayer.updateGameState(code, { gameSeed: newSeed, turn: 1, currentPlayer: room.hostId || uid, turnStarter: room.hostId || uid, playsThisTurn: {}, status: 'playing' })
                      .then(() => {
                          gameState.multiplayerSeed = newSeed;
                          restartMultiplayerWithSeed(newSeed);
                      })
                      .catch(err => {
                          console.error('Erro ao atualizar seed da sala:', err);
                          // fallback: reiniciar com seed derivada do código
                          const fallbackSeed = hashString(code);
                          gameState.multiplayerSeed = fallbackSeed;
                          restartMultiplayerWithSeed(fallbackSeed);
                      });
                } else {
                    showTemporaryMessage('Aguardando o host iniciar nova partida...');
                    // Não reinicia localmente com seed própria; aguarda update da sala
                }
            }).catch(err => {
                console.error('Erro ao obter dados da sala:', err);
                showTemporaryMessage('Falha ao acessar sala. Tente novamente.');
            });
            return; // Evita fluxo padrão de single-player
        }
    }
    
    // Esconder mensagem temporária
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
    gameState.resultShown = false;
    gameState.selectedCardId = null;
    
    // Limpar cartas
    gameState.playerHand = [];
    gameState.opponentHand = [];
    gameState.playerDeck = [];
    gameState.opponentDeck = [];
    
    // 🔥 LIMPAR ARENAS ANTIGAS E SELECIONAR NOVAS
    for (let i = 1; i <= 3; i++) {
        gameState.arenas[i] = { 
            player: [], 
            opponent: [], 
            playerPower: 0, 
            opponentPower: 0, 
            arena: null // 🔥 IMPORTANTE: Resetar para null
        };
    }
    
    // 🔥 SELECIONAR NOVAS ARENAS ALEATÓRIAS
    setupArenas();
    
    // Inicializar opponentBuff
    gameState.opponentBuff = DIFFICULTY_SETTINGS[gameState.difficulty].opponentBuff;
    
    // Recriar jogo
    createDecks();
    dealInitialHands();
    updateGameDisplay();
    
    console.log('✅ Jogo reiniciado! Novas arenas selecionadas.');
}

// 🔁 Reinicia partida em modo multiplayer usando uma seed específica (sincroniza arenas entre jogadores)
function restartMultiplayerWithSeed(seed) {
    console.log('🔁 Reiniciando multiplayer com seed:', seed);
    hideTemporaryMessage();

    const finalResult = document.getElementById('final-battle-result');
    if (finalResult) {
        finalResult.remove();
    }

    // Resetar estado do jogo
    gameState.turn = 1;
    const role = getURLParam('role');
    gameState.currentPlayer = role === 'host' ? 'player' : 'opponent';
    gameState.gameEnded = false;
    gameState.resultShown = false;
    gameState.selectedCardId = null;
    gameState.processedActionIds = [];

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
            arena: null
        };
    }

    // Seed sincronizada e buff neutro em multiplayer
    gameState.multiplayerSeed = seed;
    gameState.opponentBuff = 0;

    setupArenas(seed);
    createDecks();
    dealInitialHands();
    updateGameDisplay();
    console.log('✅ Multiplayer reiniciado com seed sincronizada:', seed);
}

/**
 * Muda a dificuldade do jogo
 */
function changeDifficulty(newDifficulty) {
    console.log('🔧 CHANGE DIFFICULTY - Iniciando...', {
        parametroRecebido: newDifficulty,
        tipoParametro: typeof newDifficulty
    });
    
    // 🔥 VALIDAÇÃO EXTRA - garantir que é número
    if (typeof newDifficulty !== 'number') {
        console.error('❌ newDifficulty não é número:', newDifficulty);
        newDifficulty = parseInt(newDifficulty);
        console.log('🔧 Convertido para:', newDifficulty);
    }
    
    if (gameState.gameEnded || gameState.turn === 1) {
        console.log('🔄 Aplicando mudança de dificuldade...');
        
        // 🔥 VERIFICAR VALORES ANTES
        console.log('📊 ANTES:', {
            dificuldade: gameState.difficulty,
            turnTime: gameState.turnTime,
            timeLeft: gameState.timeLeft
        });
        
        // 🔥 APLICAR MUDANÇAS
        gameState.difficulty = newDifficulty;
        gameState.opponentBuff = DIFFICULTY_SETTINGS[newDifficulty].opponentBuff;
        gameState.turnTime = DIFFICULTY_SETTINGS[newDifficulty].turnTime;
        gameState.timeLeft = DIFFICULTY_SETTINGS[newDifficulty].turnTime;
        
        // 🔥 VERIFICAR VALORES DEPOIS
        console.log('📊 DEPOIS:', {
            dificuldade: gameState.difficulty,
            turnTime: gameState.turnTime,
            timeLeft: gameState.timeLeft,
            configLendario: DIFFICULTY_SETTINGS[5]
        });
        
        // 🔥 ATUALIZAR DISPLAY
        updateTimerDisplay();
        createDecks();
        dealInitialHands();
        updateGameDisplay();
        
        console.log('✅ Dificuldade alterada com sucesso!');
        showTemporaryMessage(`Dificuldade: ${DIFFICULTY_SETTINGS[newDifficulty].name}`);
        
    } else {
        console.log('⏸️ Não pode mudar dificuldade agora');
    }
}

// Adicione esta função para verificar o estado atual
function debugGameState() {
    console.group('🎮 DEBUG GAME STATE');
    console.log('Dificuldade:', gameState.difficulty);
    console.log('Turn Time:', gameState.turnTime);
    console.log('Time Left:', gameState.timeLeft);
    console.log('Opponent Buff:', gameState.opponentBuff);
    console.log('Config Lendário:', DIFFICULTY_SETTINGS[5]);
    console.log('Elemento select value:', elements.difficultySelect.value);
    console.groupEnd();
}

// Chame esta função no console para ver o estado atual
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

function cloneCard(card) {
    const copy = {
        id: card.id,
        name: card.name,
        universe: card.universe,
        image: card.image,
        strength: card.strength,
        intelligence: card.intelligence,
        speed: card.speed,
        durability: card.durability,
        rarity: card.rarity,
        attributes: card.attributes,
        gender: card.gender
    };
    if (card.ability) {
        copy.ability = {
            id: card.ability.id,
            name: card.ability.name,
            description: card.ability.description,
            trigger: card.ability.trigger,
            effect: card.ability.effect,
            value: card.ability.value,
            uses: card.ability.uses
        };
    }
    return copy;
}

