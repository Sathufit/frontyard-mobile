import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

export function subscribeToMatches(callback) {
  const q = query(collection(db, 'matches'), orderBy('lastUpdated', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(matches);
  });
}

export function subscribeToMatch(matchId, callback) {
  return onSnapshot(doc(db, 'matches', matchId), (d) => {
    if (d.exists()) {
      callback({ id: d.id, ...d.data() });
    }
  });
}

export async function createMatch(matchData) {
  const matchRef = doc(collection(db, 'matches'));
  await setDoc(matchRef, {
    ...matchData,
    id: matchRef.id,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  });
  return matchRef.id;
}

export async function updateMatch(matchId, data) {
  await updateDoc(doc(db, 'matches', matchId), {
    ...data,
    lastUpdated: serverTimestamp(),
  });
}
