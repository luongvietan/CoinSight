import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  initializeFirestore,
} from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Khởi tạo Firebase chỉ một lần
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// Tạo Firestore với cấu hình nâng cao để khắc phục lỗi ERR_QUIC_PROTOCOL_ERROR
// const db = getFirestore(app);

// Buộc sử dụng long polling thay vì WebChannel/QUIC để tránh lỗi kết nối
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Sử dụng long polling thay vì WebChannel (QUIC)
});

const functions = getFunctions(app);
const storage = getStorage(app);

// Sử dụng Firebase Emulator trong môi trường development
if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
) {
  console.log("🔥 Sử dụng Firebase Emulator");

  // Kết nối với Auth Emulator
  connectAuthEmulator(auth, "http://localhost:9099");

  // Kết nối với Firestore Emulator
  connectFirestoreEmulator(db, "localhost", 8080);

  // Kết nối với Functions Emulator
  connectFunctionsEmulator(functions, "localhost", 5001);

  // Kết nối với Storage Emulator
  connectStorageEmulator(storage, "localhost", 9199);
}

export { app, auth, db, functions, storage };
