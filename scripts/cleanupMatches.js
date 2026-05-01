/**
 * cleanupMatches.js
 * Deletes all stale "live" matches (matches that never finished) from Firestore.
 *
 * Usage:
 *   node scripts/cleanupMatches.js
 *
 * Fill in your Firebase config below before running.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

// ── Paste your Firebase config here ─────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'PASTE_YOUR_API_KEY',
  authDomain: 'PASTE_YOUR_AUTH_DOMAIN',
  projectId: 'live-score-app-568b8',
  storageBucket: 'PASTE_YOUR_STORAGE_BUCKET',
  messagingSenderId: 'PASTE_YOUR_MESSAGING_SENDER_ID',
  appId: 'PASTE_YOUR_APP_ID',
};
// ─────────────────────────────────────────────────────────────────────────────

function isLive(match) {
  const finished =
    match.matchFinished === true ||
    match.status === 'finished' ||
    (typeof match.result === 'string' && match.result.trim() !== '') ||
    (typeof match.leadTrail === 'string' && match.leadTrail.toLowerCase().includes('won'));
  return !finished;
}

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log('Fetching matches from Firestore...');
  const snapshot = await getDocs(collection(db, 'matches'));

  const toDelete = [];
  snapshot.forEach((d) => {
    const data = d.data();
    if (isLive(data)) {
      toDelete.push({ id: d.id, title: data.title || data.matchName || d.id });
    }
  });

  if (toDelete.length === 0) {
    console.log('No matches to delete.');
    process.exit(0);
  }

  console.log(`\nMatches to delete (${toDelete.length}):`);
  toDelete.forEach((m) => console.log(`  • [${m.id}] ${m.title}`));

  console.log('\nDeleting...');
  await Promise.all(toDelete.map((m) => deleteDoc(doc(db, 'matches', m.id))));
  console.log(`Done. Deleted ${toDelete.length} match(es).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
