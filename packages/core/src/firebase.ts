import { initializeApp, getApps, FirebaseOptions } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Firebase project credentials — fill these in via environment variables.
// See README.md for how to obtain them from the Firebase console.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

let auth: Auth;
try {
  if (Platform.OS === "web") {
    auth = initializeAuth(app, { persistence: browserLocalPersistence });
  } else {
    // Lazy require: only pulled in on native platforms so the web bundle
    // doesn't need to resolve the AsyncStorage-based persistence adapter.
    const { getReactNativePersistence } = require("firebase/auth");
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  }
} catch {
  // initializeAuth throws if already called once (e.g. Fast Refresh) — reuse the existing instance.
  auth = getAuth(app);
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };
export default app;
