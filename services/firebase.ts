import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

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

export const db = (projectId && apiKey) 
  ? initializeFirestore(app, { ignoreUndefinedProperties: true })
  : null;
