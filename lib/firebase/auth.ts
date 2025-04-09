import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

// Đăng ký người dùng mới
export const registerUser = async (
  email: string,
  password: string,
  displayName: string
) => {
  try {
    // Tạo tài khoản với email và password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Thêm thông tin người dùng vào Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      displayName: displayName,
      photoURL: user.photoURL || "",
      isPremium: false,
      createdAt: serverTimestamp(),
      currency: "VND",
      monthlyBudget: 0,
      categories: ["food", "shopping", "bills", "entertainment", "other"],
    });

    return user;
  } catch (error) {
    // console.error("Lỗi đăng ký:", error);
    throw error;
  }
};

// Đăng nhập với email và password
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    // console.error("Lỗi đăng nhập:", error);
    throw error;
  }
};

// Đăng nhập với Google
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Kiểm tra xem user đã tồn tại trong DB chưa
    const userDoc = await getDoc(doc(db, "users", user.uid));

    // Nếu chưa có, tạo mới user
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        isPremium: false,
        createdAt: serverTimestamp(),
        currency: "VND",
        monthlyBudget: 0,
        categories: ["food", "shopping", "bills", "entertainment", "other"],
      });
    }

    return user;
  } catch (error) {
    // console.error("Lỗi đăng nhập với Google:", error);
    throw error;
  }
};

// Đăng xuất
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    // console.error("Lỗi đăng xuất:", error);
    throw error;
  }
};

// Gửi email đặt lại mật khẩu
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    // console.error("Lỗi gửi email đặt lại mật khẩu:", error);
    throw error;
  }
};

// Hook lắng nghe trạng thái xác thực
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
