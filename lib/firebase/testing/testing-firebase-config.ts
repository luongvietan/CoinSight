// Cấu hình Firebase cho môi trường testing
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import * as dotenv from "dotenv";

// Tải biến môi trường
dotenv.config();

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "test-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "test-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "test-project",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "test-project.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

console.log("Khởi tạo Firebase với config:", {
  apiKey: firebaseConfig.apiKey?.substring(0, 5) + "...",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
});

// Khởi tạo Firebase
let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Sử dụng emulator nếu được cấu hình
  if (process.env.USE_FIREBASE_EMULATOR === "true") {
    try {
      connectAuthEmulator(auth, "http://localhost:9099");
      connectFirestoreEmulator(db, "localhost", 8080);
      console.log("Đã kết nối với Firebase Emulators");
    } catch (err) {
      console.warn("Không thể kết nối với Firebase Emulators:", err);
    }
  }
} catch (error) {
  console.error("Lỗi khởi tạo Firebase:", error);

  // Tạo mockup objects để tránh lỗi null reference
  app = { name: "mock-app" };
  auth = {
    currentUser: null,
    signInWithEmailAndPassword: () =>
      Promise.resolve({ user: { uid: "mock-uid" } }),
    createUserWithEmailAndPassword: () =>
      Promise.resolve({ user: { uid: "mock-uid" } }),
    signOut: () => Promise.resolve(),
  };
  db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.resolve({ exists: true, data: () => ({}) }),
        set: () => Promise.resolve(),
      }),
    }),
  };

  // Đặt biến môi trường để sử dụng mock auth
  process.env.USE_MOCK_AUTH = "true";
}

export { app, auth, db };
export default { app, auth, db };
