// Multiplayer online com Firebase
// Este módulo supõe que os scripts do Firebase (compat) serão adicionados ao index.html:
// <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>

(function () {
  let app = null;
  let db = null;
  let auth = null;
  let currentRoomCode = null;
  let presenceInterval = null;

  // Inicializa Firebase
  // Chame initFirebase({ apiKey, authDomain, projectId, ... }) antes de usar as funções abaixo
  function initFirebase(config) {
    if (!window.firebase) {
      console.error('Firebase SDK não encontrado. Adicione os scripts compat no index.html.');
      return;
    }
    try {
      app = firebase.initializeApp(config);
      db = firebase.firestore();
      // Mitigar erros de WebChannel (proxies/firewalls) usando long polling
      try {
        // Desabilita fetch streams e força long polling para ambientes com restrições
        // Desativa auto-detect para evitar conflito com force long polling
        // Usa merge: true para não sobrescrever host/definições existentes
        db.settings({ experimentalAutoDetectLongPolling: false, experimentalForceLongPolling: true, useFetchStreams: false, merge: true });
      } catch (sErr) {
        console.warn('Não foi possível aplicar experimentalForceLongPolling/useFetchStreams:', sErr);
      }
      auth = firebase.auth();
      auth.signInAnonymously().catch(err => console.error('Auth anon falhou:', err));
      console.log('✅ Firebase inicializado para multiplayer');
    } catch (e) {
      console.error('Erro ao inicializar Firebase:', e);
    }
  }

  // Retorna o UID do usuário autenticado (anônimo)
  function getUid() {
    try {
      return auth && auth.currentUser ? auth.currentUser.uid : null;
    } catch (_) {
      return null;
    }
  }

  // Gera código: 3 letras (A-Z) + 3 números (0-9)
  function generateRoomCode() {
    const letters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    const numbers = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${letters}${numbers}`;
  }

  // Cria sala. Retorna { code }
  async function createRoom(username) {
    if (!db || !auth) throw new Error('Firebase não inicializado');
    await auth.ready; // noop: apenas garante que auth existe

    const user = auth.currentUser || (await auth.signInAnonymously().then(() => auth.currentUser));
    const uid = user.uid;

    // Gera código único
    let code = generateRoomCode();
    let exists = await db.collection('rooms').doc(code).get();
    let guard = 0;
    while (exists.exists && guard < 10) {
      code = generateRoomCode();
      exists = await db.collection('rooms').doc(code).get();
      guard++;
    }
    if (exists.exists) throw new Error('Não foi possível gerar um código único');

    const roomDoc = {
      code,
      status: 'lobby', // lobby | playing | ended
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      hostId: uid,
      players: {
        [uid]: { username: username || `Jogador_${code}_1`, ready: false }
      },
      maxPlayers: 2,
      currentPlayer: null,
      turn: 1,
      gameSeed: Math.floor(Math.random() * 1e9),
    };

    await db.collection('rooms').doc(code).set(roomDoc);
    currentRoomCode = code;
    await markPresence(code, true);
    startPresence(code);
    console.log('🎮 Sala criada:', code);
    return { code };
  }

  // Entra na sala existente (segundo jogador)
  async function joinRoom(code, username) {
    if (!db || !auth) throw new Error('Firebase não inicializado');
    const user = auth.currentUser || (await auth.signInAnonymously().then(() => auth.currentUser));
    const uid = user.uid;

    const ref = db.collection('rooms').doc(code);
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Sala não encontrada');
    const room = snap.data();
    if (room.status !== 'lobby') throw new Error('Sala já está em jogo ou encerrada');
    const players = room.players || {};
    const currentCount = Object.keys(players).length;
    // Se já está registrado (mesmo UID), considerar como sucesso
    if (players[uid]) {
      console.log('⚠️ Usuário já está na sala, prosseguindo:', uid);
      return { code };
    }
    if (currentCount >= (room.maxPlayers || 2)) {
      console.warn('🚫 Sala cheia', { code, currentCount, max: room.maxPlayers });
      throw new Error('Sala cheia');
    }

    const update = {};
    update[`players.${uid}`] = { username: username || `Jogador_${code}_2`, ready: false };
    await ref.update(update);
    currentRoomCode = code;
    await markPresence(code, true);
    startPresence(code);
    console.log('✅ Entrou na sala:', code);
    return { code };
  }

  // Marca pronto (pronto para começar)
  async function setReady(code, ready) {
    const user = auth.currentUser;
    if (!user) throw new Error('Não autenticado');
    const ref = db.collection('rooms').doc(code);
    const key = `players.${user.uid}.ready`;
    await ref.update({ [key]: !!ready });
  }

  // Começa o jogo quando ambos estiverem prontos
  async function startIfBothReady(code) {
    const ref = db.collection('rooms').doc(code);
    const snap = await ref.get();
    if (!snap.exists) return;
    const room = snap.data();
    const players = room.players || {};
    const uids = Object.keys(players);
    if (uids.length === 2 && uids.every(id => players[id].ready)) {
      await ref.update({ status: 'playing', currentPlayer: uids[0], turn: 1 });
      console.log('🚀 Partida iniciada');
    }
  }

  // Ouve atualizações da sala em tempo real
  function listenRoom(code, onUpdate) {
    const ref = db.collection('rooms').doc(code);
    return ref.onSnapshot((snap) => {
      if (!snap.exists) return;
      onUpdate && onUpdate(snap.data());
    }, (err) => console.error('Erro listener sala:', err));
  }

  // Obtém dados da sala uma vez
  async function getRoomOnce(code) {
    const ref = db.collection('rooms').doc(code);
    const snap = await ref.get();
    if (!snap.exists) return null;
    return snap.data();
  }

  // Ouve ações da sala em tempo real (apenas adições)
  function listenActions(code, onAction) {
    const ref = db.collection('rooms').doc(code).collection('actions').orderBy('ts', 'asc');
    return ref.onSnapshot((snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          onAction && onAction({ id: change.doc.id, ...data });
        }
      });
    }, (err) => console.error('Erro listener ações:', err));
  }

  // Atualiza estado parcial do jogo no doc da sala
  async function updateGameState(code, patch) {
    const ref = db.collection('rooms').doc(code);
    await ref.update(patch);
  }

  // Log de ações (útil para replays/debug)
  async function sendAction(code, action) {
    const user = auth.currentUser;
    const ref = db.collection('rooms').doc(code).collection('actions');
    await ref.add({
      ts: firebase.firestore.FieldValue.serverTimestamp(),
      uid: user ? user.uid : null,
      action
    });
  }

  async function markPresence(code, online) {
    try {
      const user = auth && auth.currentUser ? auth.currentUser : null;
      if (!user) return;
      const uid = user.uid;
      const ref = db.collection('rooms').doc(code);
      const patch = {};
      patch[`players.${uid}.online`] = !!online;
      patch[`players.${uid}.lastSeen`] = firebase.firestore.FieldValue.serverTimestamp();
      await ref.update(patch);
    } catch (e) {
      console.warn('Falha ao marcar presença:', e);
    }
  }

  function startPresence(code) {
    try {
      currentRoomCode = code;
      if (presenceInterval) clearInterval(presenceInterval);
      presenceInterval = setInterval(() => {
        markPresence(code, true);
      }, 20000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          markPresence(code, false);
          attemptCleanupRoom(code);
        } else if (document.visibilityState === 'visible') {
          markPresence(code, true);
        }
      });
      window.addEventListener('beforeunload', () => {
        markPresence(code, false);
        attemptCleanupRoom(code);
        deleteAnonymousUser();
      });
      window.addEventListener('pagehide', () => {
        markPresence(code, false);
        attemptCleanupRoom(code);
        deleteAnonymousUser();
      });
    } catch (e) {
      console.warn('Falha ao iniciar presença:', e);
    }
  }

  async function attemptCleanupRoom(code) {
    try {
      const ref = db.collection('rooms').doc(code);
      const snap = await ref.get();
      if (!snap.exists) return;
      const room = snap.data();
      if (room.status === 'playing') return;
      const players = room.players || {};
      const list = Object.values(players);
      if (list.length === 0) {
        await deleteRoomAndActions(ref);
        return;
      }
      const allOffline = list.every(p => p && p.online === false);
      const lastSeenTimes = list.map(p => p && p.lastSeen && p.lastSeen.toMillis ? p.lastSeen.toMillis() : 0);
      const now = Date.now();
      const stale = lastSeenTimes.length > 0 && Math.max.apply(null, lastSeenTimes) < (now - 20000);
      if (allOffline && stale) {
        await deleteRoomAndActions(ref);
      }
    } catch (e) {
      console.warn('Falha ao limpar sala:', e);
    }
  }

  async function deleteRoomAndActions(ref) {
    try {
      const actionsRef = ref.collection('actions');
      const actions = await actionsRef.get();
      const batch = db.batch();
      actions.forEach(doc => {
        batch.delete(actionsRef.doc(doc.id));
      });
      await batch.commit().catch(() => {});
      await ref.delete();
      if (presenceInterval) { clearInterval(presenceInterval); presenceInterval = null; }
      deleteAnonymousUser();
    } catch (e) {
      console.warn('Falha ao deletar sala/ações:', e);
    }
  }

  async function deleteAnonymousUser() {
    try {
      const user = auth && auth.currentUser ? auth.currentUser : null;
      if (!user || !user.isAnonymous) return;
      await user.delete();
    } catch (_) {
      try { await auth.signOut(); } catch (_) {}
    }
  }

  // Exponho na window para integração com UI depois
  window.Multiplayer = {
    initFirebase,
    generateRoomCode,
    createRoom,
    joinRoom,
    setReady,
    startIfBothReady,
    listenRoom,
    getRoomOnce,
    listenActions,
    updateGameState,
    sendAction,
    getUid,
    startPresence,
    markPresence,
    attemptCleanupRoom,
    deleteAnonymousUser
  };
})();