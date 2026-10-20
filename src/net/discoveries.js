// TODE AND THE LAST LILYPAD - Recipe Discoveries Backend (v3 Spec Section 9)
// Manages Firestore first-discoverer claims and global first cooked records.

import { getFirebaseDb, getFirebaseAuth } from './firebase.js';

export async function claimRecipeDiscovery(recipeId, playerName = 'Tode Guardian') {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();
  if (!db || !auth || !auth.currentUser) {
    // Offline mode or anonymous auth not connected: succeed silently locally
    return { success: true, isFirstGlobal: false, localOnly: true };
  }

  try {
    const { doc, runTransaction, serverTimestamp } = await import('firebase/firestore');
    const recipeRef = doc(db, 'recipes', recipeId);

    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(recipeRef);
      if (snap.exists()) {
        return { isFirstGlobal: false, claimedBy: snap.data() };
      }

      const claimData = {
        firstUid: auth.currentUser.uid,
        firstName: playerName.slice(0, 16),
        firstAt: serverTimestamp(),
      };
      transaction.set(recipeRef, claimData);
      return { isFirstGlobal: true, claimData };
    });

    return { success: true, ...result };
  } catch (err) {
    // Silent fallback to avoid interrupting gameplay
    console.warn(`[Firebase] Could not claim recipe "${recipeId}":`, err.message);
    return { success: true, isFirstGlobal: false, error: err.message };
  }
}

export async function getRecipeDiscoverer(recipeId) {
  const db = getFirebaseDb();
  if (!db) return null;
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'recipes', recipeId));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    // Fallback
  }
  return null;
}
