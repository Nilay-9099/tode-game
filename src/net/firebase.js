// TODE AND THE LAST LILYPAD - Firebase & Firestore Service (Spec Section 8)
// Zero-block, offline-safe cloud backend for Leaderboards, Daily Challenge, and Global Pond Counter.

let isInitialized = false;
let isOfflineMode = true;
let currentUser = null;
let db = null;
let auth = null;

// Default client cache
let topScoresCache = [];
let dailyScoresCache = [];
let cachedPondCounter = 1420; // Default local starting counter

// Optional user-supplied config via window.__FIREBASE_CONFIG__ or environment
const firebaseConfig = window.__FIREBASE_CONFIG__ || {
  apiKey: "AIzaSyDummyKeyForAntigravityCourseTodeGame",
  authDomain: "tode-last-lilypad.firebaseapp.com",
  projectId: "tode-last-lilypad",
  storageBucket: "tode-last-lilypad.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

export async function initFirebase() {
  if (isInitialized) return { isOfflineMode, currentUser };

  try {
    const { initializeApp } = await import('firebase/app');
    const { getAuth, signInAnonymously } = await import('firebase/auth');
    const { getFirestore } = await import('firebase/firestore');

    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Silent anonymous auth
    try {
      const cred = await signInAnonymously(auth);
      currentUser = cred.user;
      isOfflineMode = false;
      console.log('🔥 [Firebase] Anonymous auth connected:', currentUser.uid);
    } catch (authErr) {
      console.warn('⚠️ [Firebase] Auth unavailable (operating in offline fallback mode):', authErr.message);
      isOfflineMode = true;
    }
  } catch (err) {
    console.warn('ℹ️ [Firebase] SDK running in offline-local mode:', err.message);
    isOfflineMode = true;
  }

  isInitialized = true;
  return { isOfflineMode, currentUser };
}

// 1. Submit Run Score
export async function submitScore({ name, score, wave, mode = 'normal', seed = '', streak = 0 }) {
  const payload = {
    uid: currentUser ? currentUser.uid : 'anon_' + Math.random().toString(36).slice(2, 8),
    name: (name || 'Tode Guardian').slice(0, 16),
    score: Math.min(Math.floor(score), 2000000),
    wave: Number(wave) || 1,
    mode: mode === 'daily' ? 'daily' : 'normal',
    seed: String(seed || ''),
    streak: Number(streak) || 0,
    createdAt: new Date().toISOString(),
  };

  if (!isOfflineMode && db) {
    try {
      const { collection, addDoc, doc, setDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'scores'), payload);

      if (payload.mode === 'daily') {
        const today = new Date().toISOString().slice(0, 10);
        await setDoc(doc(db, `dailyScores/${today}/entries`, payload.uid), payload);
      }
      console.log('🏆 [Firebase] Score submitted successfully to Firestore!');
      return { success: true, cloud: true };
    } catch (err) {
      console.warn('⚠️ [Firebase] Could not save to Firestore; caching locally:', err.message);
    }
  }

  // Local fallback cache
  topScoresCache.push(payload);
  topScoresCache.sort((a, b) => b.score - a.score);
  return { success: true, cloud: false };
}

// 2. Fetch Top Leaderboard (Cached, Quota-friendly)
export async function fetchLeaderboard(mode = 'normal') {
  if (!isOfflineMode && db) {
    try {
      const { collection, query, orderBy, limit, getDocs } = await import('firebase/firestore');
      const q = query(collection(db, 'scores'), orderBy('score', 'desc'), limit(15));
      const snapshot = await getDocs(q);
      const scores = [];
      snapshot.forEach((doc) => scores.push(doc.data()));
      if (scores.length > 0) {
        topScoresCache = scores;
        return topScoresCache;
      }
    } catch (err) {
      console.warn('⚠️ [Firebase] Failed to fetch Firestore scores; using fallback:', err.message);
    }
  }

  // Fallback default sample hall of fame
  if (topScoresCache.length === 0) {
    topScoresCache = [
      { name: 'LilypadHero', score: 4850, wave: 9, streak: 5 },
      { name: 'TodeMaster', score: 3620, wave: 7, streak: 4 },
      { name: 'PondGuardian', score: 2740, wave: 5, streak: 3 },
      { name: 'RibbitKing', score: 1950, wave: 4, streak: 2 },
      { name: 'GardenScout', score: 1200, wave: 3, streak: 2 },
    ];
  }
  return topScoresCache;
}

// 3. Sharded Community Pond Counter ("Together we have saved N tadpoles")
export async function incrementSavedTadpoles(count = 1) {
  cachedPondCounter += count;
  if (!isOfflineMode && db) {
    try {
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      const shardIndex = Math.floor(Math.random() * 5);
      const shardRef = doc(db, 'stats/global/shards', shardIndex.toString());
      await updateDoc(shardRef, { tadpolesSaved: increment(count) });
    } catch (err) {
      // Fail silently
    }
  }
}

export async function getGlobalPondCounter() {
  if (!isOfflineMode && db) {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const shardsSnap = await getDocs(collection(db, 'stats/global/shards'));
      let sum = 0;
      shardsSnap.forEach((doc) => {
        const d = doc.data();
        if (d && typeof d.tadpolesSaved === 'number') sum += d.tadpolesSaved;
      });
      if (sum > 0) cachedPondCounter = sum;
    } catch (err) {
      // Fail silently
    }
  }
  return cachedPondCounter;
}
