"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { updateUser } from "@/lib/firebase/firestore";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Theo dõi trạng thái xác thực
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  // Đăng nhập - memoized với useCallback
  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        // Nếu đang trong trình duyệt, trì hoãn xử lý đăng nhập để không chặn main thread
        if (typeof window !== "undefined") {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        const result = await signInWithEmailAndPassword(auth, email, password);

        // Đặt token vào cookie để middleware có thể đọc
        const token = await result.user.getIdToken();
        Cookies.set("auth-token", token, { expires: 7 }); // Hết hạn sau 7 ngày

        // Điều hướng đến trang chính
        router.push("/");
      } catch (error: any) {
        console.error("Đăng nhập thất bại:", error.message);
        throw error;
      }
    },
    [router]
  );

  // Đăng ký - memoized với useCallback
  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        // Nếu đang trong trình duyệt, trì hoãn xử lý đăng ký để không chặn main thread
        if (typeof window !== "undefined") {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Cập nhật displayName cho user
        if (result.user) {
          await updateProfile(result.user, {
            displayName: name,
          });

          // Đặt token vào cookie để middleware có thể đọc
          const token = await result.user.getIdToken();
          Cookies.set("auth-token", token, { expires: 7 }); // Hết hạn sau 7 ngày

          // Cần load lại user để cập nhật thông tin
          setUser({ ...result.user });

          // Điều hướng đến trang chính
          router.push("/");
        }
      } catch (error: any) {
        console.error("Đăng ký thất bại:", error.message);

        // Xử lý lỗi cụ thể
        if (error.code === "auth/email-already-in-use") {
          throw new Error(
            "Email này đã được sử dụng. Vui lòng sử dụng email khác hoặc đăng nhập nếu đây là tài khoản của bạn."
          );
        }

        throw error;
      }
    },
    [router]
  );

  // Đăng xuất - memoized với useCallback
  const signOut = useCallback(async () => {
    try {
      // Đăng xuất khỏi Firebase
      await firebaseSignOut(auth);

      // Xóa token xác thực
      Cookies.remove("auth-token");

      // Cập nhật state người dùng
      setUser(null);

      // Điều hướng về trang đăng nhập
      router.push("/auth/login");
    } catch (error: any) {
      console.error("Đăng xuất thất bại:", error.message);
      throw error;
    }
  }, [router]);

  // Đặt lại mật khẩu - memoized với useCallback
  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Đặt lại mật khẩu thất bại:", error.message);
      throw error;
    }
  }, []);

  // Thêm hàm cập nhật profile
  const updateUserProfile = useCallback(
    async (displayName?: string, photoURL?: string) => {
      try {
        if (!user) {
          throw new Error("Người dùng chưa đăng nhập");
        }

        const updateData: { displayName?: string; photoURL?: string } = {};

        if (displayName) {
          updateData.displayName = displayName;
        }

        if (photoURL) {
          updateData.photoURL = photoURL;
        }

        // Cập nhật profile trên Firebase Authentication
        await updateProfile(user, updateData);

        // Cập nhật thông tin trong Firestore
        await updateUser(user.uid, updateData);

        // Cập nhật user state
        setUser({ ...user });
      } catch (error: any) {
        console.error("Cập nhật profile thất bại:", error.message);
        throw error;
      }
    },
    [user]
  );

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateUserProfile,
    }),
    [user, loading, signIn, signUp, signOut, resetPassword, updateUserProfile]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
