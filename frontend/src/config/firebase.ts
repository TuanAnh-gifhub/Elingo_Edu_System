import { initializeApp, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";

type FirebaseEnvKey =
  | "VITE_FIREBASE_API_KEY"
  | "VITE_FIREBASE_AUTH_DOMAIN"
  | "VITE_FIREBASE_PROJECT_ID"
  | "VITE_FIREBASE_STORAGE_BUCKET"
  | "VITE_FIREBASE_MESSAGING_SENDER_ID"
  | "VITE_FIREBASE_APP_ID";

const REQUIRED_FIREBASE_ENV_KEYS: FirebaseEnvKey[] = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const getMissingFirebaseEnvKeys = (): FirebaseEnvKey[] => {
  return REQUIRED_FIREBASE_ENV_KEYS.filter((key) => {
    const value = import.meta.env[key];
    return typeof value !== "string" || value.trim().length === 0;
  });
};

let firebaseApp: FirebaseApp | null = null;
let firebaseStorage: FirebaseStorage | null = null;

export const isFirebaseConfigured = (): boolean => {
  return getMissingFirebaseEnvKeys().length === 0;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  const missingKeys = getMissingFirebaseEnvKeys();
  if (missingKeys.length > 0) {
    throw new Error(
      `Firebase chưa được cấu hình. Thiếu biến môi trường: ${missingKeys.join(", ")}`,
    );
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
  }

  if (!firebaseStorage) {
    firebaseStorage = getStorage(firebaseApp);
  }

  return firebaseStorage;
};
