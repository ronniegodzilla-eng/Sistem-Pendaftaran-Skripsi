import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const apiKey = (import.meta as any).env.VITE_FIREBASE_API_KEY;
const authDomain = (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = (import.meta as any).env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = (import.meta as any).env.VITE_FIREBASE_APP_ID;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

console.log("Initializing Firebase...", (projectId && apiKey) ? "Config Found" : "Config Missing");

// Prevent duplicate initialization
const app = (projectId && apiKey)
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0])
  : null as any;

// App Check attaches a token to every Firestore request proving it came from this
// app on a registered domain. Firestore rules are open (the app has no login), so
// without this anyone holding the public projectId can read, write and delete the
// database directly, and run up the bill at will.
//
// Initialised before Firestore so the first request already carries a token.
// If the site key is absent the app still runs unprotected, which keeps local
// development and any deploy made before the key is configured working.
const recaptchaSiteKey = (import.meta as any).env.VITE_RECAPTCHA_SITE_KEY;

if (app && recaptchaSiteKey) {
  try {
    // Localhost is not a registered domain, so dev builds use a debug token that
    // must be allow-listed once under App Check > Manage debug tokens.
    if ((import.meta as any).env.DEV) {
      (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.log("App Check... Active");
  } catch (e) {
    // Never block the app on App Check setup; an unenforced project keeps working.
    console.warn("App Check initialization failed:", e);
  }
} else if (app) {
  console.warn(
    "App Check... Not configured (VITE_RECAPTCHA_SITE_KEY missing). " +
    "Firestore is reachable by anyone until this is set and enforcement is enabled."
  );
}

export const db = (projectId && apiKey)
  ? initializeFirestore(app, { ignoreUndefinedProperties: true })
  : null;
