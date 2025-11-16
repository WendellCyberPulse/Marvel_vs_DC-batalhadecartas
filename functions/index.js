const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.cleanupRooms = functions.pubsub.schedule('every 1 minutes').onRun(async () => {
  const db = admin.firestore();
  const now = Date.now();
  const threshold = 120000; // 2 minutos para evitar apagar salas ativas
  const roomsSnap = await db.collection('rooms').get();
  const activeUids = new Set();
  const deletions = [];

  roomsSnap.forEach(doc => {
    const room = doc.data();
    const players = room.players || {};
    const keys = Object.keys(players);
    keys.forEach(k => activeUids.add(k));
    const list = keys.map(k => players[k]).filter(Boolean);
    const allOffline = list.length > 0 && list.every(p => p.online === false);
    const lastSeenMs = list.map(p => (p.lastSeen && p.lastSeen.toMillis) ? p.lastSeen.toMillis() : 0);
    const stale = lastSeenMs.length > 0 && Math.max(...lastSeenMs) < (now - threshold);
    if (room.status !== 'playing' && allOffline && stale) {
      deletions.push((async () => {
        const actionsSnap = await doc.ref.collection('actions').get();
        const batch = db.batch();
        actionsSnap.forEach(a => batch.delete(doc.ref.collection('actions').doc(a.id)));
        await batch.commit().catch(() => {});
        await doc.ref.delete();
      })());
    }
  });

  await Promise.all(deletions);

  const auth = admin.auth();
  const toDelete = [];
  let nextPageToken;
  do {
    const res = await auth.listUsers(1000, nextPageToken);
    res.users.forEach(u => {
      const isAnon = u.providerData.length === 0;
      if (isAnon && !activeUids.has(u.uid)) {
        toDelete.push(u.uid);
      }
    });
    nextPageToken = res.pageToken;
  } while (nextPageToken);

  await Promise.all(toDelete.map(uid => admin.auth().deleteUser(uid).catch(() => null)));
  return null;
});